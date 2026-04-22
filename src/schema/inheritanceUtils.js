import { load as yamlLoad } from 'js-yaml';

/**
 * Parse an array of raw YAML strings (Vite `?raw` imports) and build a
 * Map<className, parentName> of direct `is_a` inheritance relationships.
 * Later files in the array overwrite earlier ones if a class appears twice.
 */
export function buildInheritanceMap(yamlSources) {
  const map       = new Map();
  const originMap = new Map();
  for (const rawYaml of yamlSources) {
    try {
      const doc = yamlLoad(rawYaml);
      if (!doc?.classes) continue;
      const yamlName = doc.name ?? 'unknown';
      for (const [className, classDef] of Object.entries(doc.classes)) {
        if (classDef?.is_a) map.set(className, classDef.is_a);
        originMap.set(className, yamlName);
      }
    } catch {
      // skip malformed YAML silently
    }
  }
  return { inheritanceMap: map, classOriginMap: originMap };
}
