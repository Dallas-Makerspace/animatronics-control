
export function sortMapByValues<K>(map: Map<K, number>): Map<K, number> {
  var sortedKeys = (Object.keys(Object.fromEntries(map)) as K[]).sort(function(a: K,b: K) { return (map.get(a) || 0) - (map.get(b) || 0); });
  const sortedMap = new Map(sortedKeys.map(key => [key, map.get(key) || 0]));
  return sortedMap;
}