/**
 * Utilities for classifying LinkML-derived JSON Schema classes into
 * primitive slots (form fields), enum slots (dropdowns), widget slots
 * (inline measurement / attribute objects), and ref slots (graph edges).
 *
 * Inline detection strategy
 * ─────────────────────────
 * LinkML's JSON Schema generator (with mergeimports:true) fully flattens
 * inheritance — every subclass has exactly the same property set as its
 * parent.  We exploit this: any class whose property set and required set
 * match those of QuantitativeAttribute or QualitativeAttribute IS a
 * descendant of those classes and can be rendered as an inline widget.
 *
 * Detected inline families (auto-derived at load time):
 *   Quantitative: Mass, Temperature, Volume, Pressure, Density,
 *                 Concentration, Yield, MolarMass, MolarEquivalent,
 *                 AmountOfSubstance, PHValue, PercentageOfTotal, …
 *   Qualitative:  InChi, InChIKey, SMILES, MolecularFormula, IUPACName, …
 */

// ── Class role detection ──────────────────────────────────────────────────────

/**
 * Build a Set of class names that are "lookup wrappers" — their properties
 * are ALL primitive (no $ref / anyOf-with-ref / items-with-ref).
 * These become inline reference rows (value + slot-name dropdown) rather
 * than graph nodes.  Examples: DefinedTerm, Identifier, Resource.
 */
function buildLookupClassSet(defs) {
  const lookup = new Set();
  for (const [name, def] of Object.entries(defs)) {
    if (Array.isArray(def.enum)) continue;        // enums handled separately
    if (!def.properties) continue;
    const allPrimitive = Object.values(def.properties).every(prop =>
      !prop.$ref &&
      !prop.anyOf?.some(a => a.$ref) &&
      !prop.items?.$ref
    );
    if (allPrimitive) lookup.add(name);
  }
  return lookup;
}

/**
 * Build a Set of class names that should be rendered as inline widgets
 * (i.e. they are structural descendants of QuantitativeAttribute or
 * QualitativeAttribute, detected by exact property-set fingerprint).
 */
function buildInlineClassSet(defs) {
  const fingerprint = (className) => {
    const cls = defs[className];
    if (!cls?.properties) return null;
    return JSON.stringify({
      props: Object.keys(cls.properties).sort(),
      req:   [...(cls.required ?? [])].sort(),
    });
  };

  const qaFp  = fingerprint('QuantitativeAttribute');
  const qalFp = fingerprint('QualitativeAttribute');

  const inlineClasses = new Set();
  for (const [name, def] of Object.entries(defs)) {
    if (Array.isArray(def.enum)) continue;          // skip enums
    const fp = fingerprint(name);
    if (fp === qaFp || fp === qalFp) inlineClasses.add(name);
  }
  return inlineClasses;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function refToClassName(ref) {
  return ref.replace('#/$defs/', '');
}

function isEnumClass(defs, className) {
  return Array.isArray(defs[className]?.enum);
}

// ── Slot classification ───────────────────────────────────────────────────────

/**
 * Slot kinds:
 *   'primitive'  – string / number / integer  → inline form field
 *   'enum'       – ref to an enum class        → dropdown
 *   'widget'     – ref to an inline attribute class (Quantitative / Qualitative)
 *                  → compact inline widget (value + unit + type)
 *   'lookup'     – ref to an all-primitive wrapper class (DefinedTerm, Identifier, Resource, …)
 *                  → inline reference row: [ URI/value input ] [ slot-name ▾ ] [ × ]
 *                     all lookup slots on a node share one list with a single [+ add] button
 *   'ref'        – ref to a semantic entity class → graph edge + separate node
 *
 * Property patterns handled (all observed in dcat_4c_ap.schema.json):
 *   1. Direct $ref                                  → ref / enum / widget / lookup
 *   2. anyOf: [{ $ref }, { type: null }, …]         → ref / enum / widget / lookup (nullable)
 *   3. { type: ['array','null'], items: { $ref } }  → ref / widget / lookup, multivalued
 *   4. { type: array,           items: { $ref } }   → ref / widget / lookup, multivalued, required
 *   5. { type: ['array','null'], items: { type } }  → primitive array
 *   6. { type: array,           items: { type } }   → primitive array, required
 *   7. { type: string|number|integer … }            → primitive
 */
function classifyProperty(name, prop, defs, requiredSet, inlineClasses, lookupClasses) {
  const required = requiredSet.has(name);
  const base = { name, description: prop.description ?? null, required };

  // Pattern 1 – direct $ref
  if (prop.$ref) {
    const target = refToClassName(prop.$ref);
    if (isEnumClass(defs, target))     return { ...base, kind: 'enum',    multivalued: false, targetClass: target, enumValues: defs[target].enum };
    if (inlineClasses.has(target))     return { ...base, kind: 'widget',  multivalued: false, targetClass: target };
    if (lookupClasses.has(target))     return { ...base, kind: 'lookup',  multivalued: false, targetClass: target };
    return                                    { ...base, kind: 'ref',     multivalued: false, targetClasses: [target] };
  }

  // Pattern 2 – anyOf (nullable ref or union of refs)
  if (prop.anyOf) {
    const refs = prop.anyOf.filter(a => a.$ref).map(a => refToClassName(a.$ref));
    if (refs.length === 1 && isEnumClass(defs, refs[0]))    return { ...base, kind: 'enum',   multivalued: false, targetClass: refs[0], enumValues: defs[refs[0]].enum };
    if (refs.length === 1 && inlineClasses.has(refs[0]))    return { ...base, kind: 'widget', multivalued: false, targetClass: refs[0] };
    if (refs.length === 1 && lookupClasses.has(refs[0]))    return { ...base, kind: 'lookup', multivalued: false, targetClass: refs[0] };
    if (refs.length > 0)                                    return { ...base, kind: 'ref',    multivalued: false, targetClasses: refs };
    // anyOf containing only primitives
    const t = prop.anyOf.find(a => a.type && a.type !== 'null')?.type;
    if (t) return { ...base, kind: 'primitive', multivalued: false, primitiveType: t };
  }

  // Patterns 3 & 4 – array of $refs
  if (prop.items?.$ref) {
    const target = refToClassName(prop.items.$ref);
    if (isEnumClass(defs, target))   return { ...base, kind: 'enum',   multivalued: true, targetClass: target, enumValues: defs[target].enum };
    if (inlineClasses.has(target))   return { ...base, kind: 'widget', multivalued: true, targetClass: target };
    if (lookupClasses.has(target))   return { ...base, kind: 'lookup', multivalued: true, targetClass: target };
    return                                  { ...base, kind: 'ref',    multivalued: true, targetClasses: [target] };
  }

  // Patterns 5 & 6 – array of primitives
  if (prop.items?.type) {
    return { ...base, kind: 'primitive', multivalued: true, primitiveType: prop.items.type };
  }

  // Pattern 7 – plain primitive
  const rawType = Array.isArray(prop.type)
    ? prop.type.find(t => t !== 'null')
    : prop.type;
  if (rawType && ['string', 'number', 'integer'].includes(rawType)) {
    return { ...base, kind: 'primitive', multivalued: false, primitiveType: rawType, pattern: prop.pattern ?? null };
  }

  return { ...base, kind: 'unknown' };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Return a classified description of a single class.
 *
 * @param {object} schema     – parsed dcat_4c_ap.schema.json
 * @param {string} className
 * @returns {{
 *   name: string,
 *   description: string|null,
 *   inlineFamily: 'quantitative'|'qualitative'|null,
 *   primitiveSlots: Slot[],
 *   enumSlots:      Slot[],
 *   widgetSlots:    Slot[],   // inline measurement / attribute objects
 *   refSlots:       Slot[],   // graph edges
 * } | null}
 */
export function getClassInfo(schema, className) {
  const defs         = schema.$defs ?? {};
  const cls          = defs[className];
  if (!cls) return null;

  const inlineClasses = buildInlineClassSet(defs);
  const lookupClasses = buildLookupClassSet(defs);
  const requiredSet   = new Set(cls.required ?? []);

  const slots = Object.entries(cls.properties ?? {}).map(([name, prop]) =>
    classifyProperty(name, prop, defs, requiredSet, inlineClasses, lookupClasses)
  );

  // Detect which inline family this class belongs to (if any)
  let inlineFamily = null;
  if (inlineClasses.has(className)) {
    const hasQuantType = 'has_quantity_type' in (cls.properties ?? {});
    inlineFamily = hasQuantType ? 'quantitative' : 'qualitative';
  }

  return {
    name: className,
    description:    cls.description ?? null,
    inlineFamily,
    primitiveSlots: slots.filter(s => s.kind === 'primitive'),
    enumSlots:      slots.filter(s => s.kind === 'enum'),
    widgetSlots:    slots.filter(s => s.kind === 'widget'),
    lookupSlots:    slots.filter(s => s.kind === 'lookup'),  // shared inline reference rows
    refSlots:       slots.filter(s => s.kind === 'ref'),
  };
}

/**
 * Return the pre-computed set of inline class names for this schema.
 * Useful for rendering decisions outside getClassInfo.
 */
export function getInlineClasses(schema) {
  return buildInlineClassSet(schema.$defs ?? {});
}

/**
 * List all concrete (non-enum, non-inline) class names — i.e. the classes
 * that should appear as top-level graph nodes.
 */
export function listNodeClasses(schema) {
  const defs   = schema.$defs ?? {};
  const inline  = buildInlineClassSet(defs);
  const lookups = buildLookupClassSet(defs);
  return Object.entries(defs)
    .filter(([name, def]) =>
      !Array.isArray(def.enum) &&
      def.type === 'object' &&
      !inline.has(name) &&
      !lookups.has(name)
    )
    .map(([name]) => name)
    .sort();
}

/**
 * List all class names (including inline and enum classes).
 */
export function listClasses(schema) {
  return Object.entries(schema.$defs ?? {})
    .filter(([, def]) => !Array.isArray(def.enum) && def.type === 'object')
    .map(([name]) => name)
    .sort();
}

/**
 * List all enum class names and their values.
 */
export function listEnums(schema) {
  return Object.entries(schema.$defs ?? {})
    .filter(([, def]) => Array.isArray(def.enum))
    .map(([name, def]) => ({ name, values: def.enum }));
}

/**
 * Return true if `childName` is the same class as `parentName`, or is a
 * structural subtype of it (i.e. the child's property set is a superset of
 * the parent's property set).
 *
 * This works because LinkML's JSON Schema generator fully flattens
 * inheritance — every subclass inherits all ancestor properties verbatim.
 * Therefore a class that has ALL of a parent's properties is necessarily
 * a descendant of that parent in the original LinkML model.
 *
 * @param {string} childName
 * @param {string} parentName
 * @param {object} schema   – parsed dcat_4c_ap.schema.json
 */
export function isSubtypeOf(childName, parentName, schema) {
  if (childName === parentName) return true;
  const defs = schema.$defs ?? {};
  const parent = defs[parentName];
  const child  = defs[childName];
  if (!parent?.properties || !child?.properties) return false;
  return Object.keys(parent.properties).every(k => k in child.properties);
}
