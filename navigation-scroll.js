export function routeScrollKey(hash) {
  return String(hash || '').replace(/^#\/?/, '') || 'home';
}

export function createRouteScrollMemory(initialRoute = 'home') {
  const positions = new Map();
  let currentRoute = initialRoute;
  return {
    remember(y) {
      if (Number.isFinite(y)) positions.set(currentRoute, Math.max(0, y));
    },
    transition(nextRoute, restore = false) {
      currentRoute = nextRoute;
      const y = restore ? positions.get(nextRoute) ?? 0 : 0;
      positions.set(nextRoute, y);
      return y;
    },
  };
}
