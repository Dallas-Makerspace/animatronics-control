
export function sortMapByValues<K>(map: Map<K, number>): Map<K, number> {
  var sortedKeys = (Object.keys(Object.fromEntries(map)) as K[]).sort(function(a: K,b: K) { return (map.get(a) || 0) - (map.get(b) || 0); });
  const sortedMap = new Map(sortedKeys.map(key => [key, map.get(key) || 0]));
  return sortedMap;
}

export function mapToJson(map: Map<string, any>): string {
  const obj = Object.fromEntries(map);
  return JSON.stringify(obj);
}

export function jsonToMap(jsonStr: string): Map<string, any> {
  const obj = JSON.parse(jsonStr);
  return new Map(Object.entries(obj));
}