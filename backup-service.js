import * as db from './db.js';
import {validateConfig} from './ui-config.js';
import {scopedStorage as localStorage} from './local-scope.js';

const EXTRAS=['pet-life-meta-v1','pet-life-likes-v1','pet-life-care-tasks-v1','pet-life-care-demo-v1','pet-life-service-v1'];
const PREFERENCES=['pet-location-city-v1','pet-memory-ui-config-v1'];
const KEYS=[...EXTRAS,...PREFERENCES];
const pick=keys=>Object.fromEntries(keys.filter(key=>localStorage.getItem(key)!==null).map(key=>[key,localStorage.getItem(key)]));
export async function createFullArchive(){
 const archive=await db.exportArchive();
 archive.lifeExtras=pick(EXTRAS);archive.preferences=pick(PREFERENCES);
 return archive;
}
export async function restoreFullArchive(archive){
 const restored={};
 for(const [field,keys] of [['lifeExtras',EXTRAS],['preferences',PREFERENCES]]){
  const source=archive?.[field];
  if(source!==undefined&&(!source||typeof source!=='object'||Array.isArray(source)))throw new Error('备份中的设置格式无效');
  for(const [key,value] of Object.entries(source||{})){
   if(!keys.includes(key))continue;
   if(typeof value!=='string'||value.length>3000000)throw new Error('备份中的设置过大或格式无效');
   const parsed=JSON.parse(value);
   if(key==='pet-location-city-v1'){
    if(typeof parsed!=='string'||parsed.length>20||/[<>\x00-\x1f]/.test(parsed))throw new Error('备份中的城市无效');
   }else if(key==='pet-memory-ui-config-v1'){validateConfig(parsed);}
   else{
    const arrayKey=['pet-life-likes-v1','pet-life-care-demo-v1'].includes(key);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)!==arrayKey)throw new Error('备份中的扩展资料格式无效');
   }
   restored[key]=value;
  }
 }
 const before=pick(KEYS);
 // Old archives carry no preferences: preserve existing settings for backward compatibility.
 if(archive.preferences===undefined)Object.assign(restored,pick(PREFERENCES));
 const replace=values=>{KEYS.forEach(key=>localStorage.removeItem(key));for(const [key,value]of Object.entries(values))localStorage.setItem(key,value);};
 try{replace(restored);await db.importArchive(archive);}catch(error){replace(before);throw error;}
 localStorage.removeItem('pet-active-id');
}

// Extension contract: an authenticated provider must be installed by application code.
// Never persist credentials in a backup or permit a user-entered arbitrary upload URL.
let cloudProvider=null;
export function configureCloudBackup(provider){
 if(provider!==null&&(!provider||!['status','upload','list','download','remove'].every(name=>typeof provider[name]==='function')))
  throw new Error('云端备份适配器不完整');
 cloudProvider=provider;
}
export async function cloudBackupStatus(){
 if(!cloudProvider)return {connected:false,reason:'云端数据库尚未连接'};
 const state=await cloudProvider.status();
 return {...state,connected:state?.connected===true&&typeof state?.accountId==='string'&&!!state.accountId};
}
export async function uploadCloudBackup(){
 const state=await cloudBackupStatus();
 if(!state.connected)throw new Error('请先连接云端服务并登录账户');
 const archive=await createFullArchive();
 // Provider must re-check identity before uploading, scope data on the server and persist media privately.
 const result=await cloudProvider.upload(archive,{accountId:state.accountId});
 if(!result||typeof result.id!=='string'||!result.id||!Number.isFinite(Date.parse(result.completedAt)))
  throw new Error('未收到云端保存完成凭据，请检查备份记录');
 return result;
}
export async function listCloudBackups(){const state=await cloudBackupStatus();if(!state.connected)throw new Error('请先登录');return cloudProvider.list({accountId:state.accountId});}
export async function downloadCloudBackup(id){const state=await cloudBackupStatus();if(!state.connected)throw new Error('请先登录');return cloudProvider.download(id,{accountId:state.accountId});}
export async function removeCloudBackup(id){const state=await cloudBackupStatus();if(!state.connected)throw new Error('请先登录');return cloudProvider.remove(id,{accountId:state.accountId});}

// These declarations reserve capabilities, NOT authorization. The OS and server must enforce real access.
export const PERMISSION_SLOTS=Object.freeze({
 location:{default:'off',scope:'foreground-optional',implemented:false},
 media:{default:'user-selection',scope:'selected-files',implemented:true},
 notifications:{default:'off',scope:'care-reminders',implemented:false},
 cloudBackup:{default:'off',scope:'authenticated-owner',implemented:false},
 communityPublish:{default:'private',scope:'explicit-publication',implemented:false},
 admin:{default:'deny',scope:'server-roles',implemented:false}
});
