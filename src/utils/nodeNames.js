/**
 * Provisional display-name generator.
 *
 * Keeps a per-class counter (resets on page reload — intentional, names are temporary).
 * Splits CamelCase and uses the last segment as a short readable suffix:
 *   ChemicalProduct  →  Product-1, Product-2 …
 *   MaterialSample   →  Sample-1, Sample-2 …
 *   AnalysisDataset  →  Dataset-1 …
 */

const _counters = {};

export function generateDisplayName(className) {
  _counters[className] = (_counters[className] ?? 0) + 1;
  const parts = className.match(/[A-Z][a-z]*/g) ?? [className];
  return `${parts[parts.length - 1]}-${_counters[className]}`;
}
