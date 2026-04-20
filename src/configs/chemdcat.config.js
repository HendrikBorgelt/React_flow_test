/**
 * chem-dcat-ap configuration
 *
 * Schema: compiled from schemas/chem_dcat_ap/schema/chem_dcat_ap.yaml
 * The compiled JSON schema is committed to src/schema/dcat_4c_ap.schema.json
 */
import schema  from '../schema/dcat_4c_ap.schema.json';
import msJson  from '../examples/chemdcat/MaterialSample-001.json';
import ssJson  from '../examples/chemdcat/SubstanceSample-001.json';
import crJson  from '../examples/chemdcat/ChemicalReaction-001.json';

// ── Abstract / infrastructure classes to hide from the node palette ──────────
// gen-json-schema does NOT emit `abstract: true`, so we list them explicitly.
// DCAT-AP+ base hierarchy (shared infrastructure, never directly instantiated):
const DCAT_AP_BASE = [
  'Activity', 'Agent', 'AgenticEntity',
  'DataGeneratingActivity',
  'Entity', 'EvaluatedActivity', 'EvaluatedEntity',
  'Kind', 'Plan',
];
// DCAT catalog / administrative infrastructure (not chemistry domain nodes):
const DCAT_ADMIN = [
  'Catalogue', 'CatalogueRecord', 'Checksum',
  'DataService', 'DatasetSeries',
  'Distribution', 'LicenseDocument',
  'PeriodOfTime', 'Relationship',
];
// chemdcat-specific abstract material/entity bases:
const CHEMDCAT_ABSTRACT = [
  'Device',          // abstract AgenticEntity base → use Reactor instead
  'MaterialEntity',  // abstract base for MaterialSample, SubstanceSample, …
  'ChemicalEntity',  // abstract base for Atom, …
];
// DCAT-AP / DCAT-AP+ data-catalog classes that should never be auto-inferred
// as children of chemical/material entity slots (has_part, composed_of, …).
// They remain visible in the palette's manual subsections so users can still
// add them explicitly; they are only excluded from the automatic class
// inference used when loading JSON/YAML files.
const DCAT_DATA_CLASSES = [
  'AnalysisDataset',                      // dataset catalog entity, not a material/chemical entity
  'AnalysisSourceData',                   // evaluated-entity subtype, not a physical material
  'DataAnalysis',                         // analysis activity, not a material
  'Dataset',                              // base DCAT-AP dataset, not a material
  'ReactionMonitoringDataset',            // dataset subtype — root class only, not an inferred child
  'SubstanceSampleCharacterizationDataset', // dataset subtype — root class only, not an inferred child
  'Software',                             // software entity, not a material
];

// ── Palette subsections ───────────────────────────────────────────────────────
// Each section corresponds to one source schema file.
// Inline/mixin/enum classes are intentionally excluded from every section.
// (The "Relevant classes" section is auto-computed by listNodeClasses().)
const PALETTE_SECTIONS = [
  {
    id:    'dcat-ap',
    label: 'DCAT-AP',
    // dcat_ap_linkml.yaml — base W3C DCAT-AP vocabulary
    classes: [
      'Activity', 'Agent', 'Any', 'Attribution',
      'Catalogue', 'CatalogueRecord', 'Checksum',
      'Concept', 'ConceptScheme',
      'DataService', 'Dataset', 'DatasetSeries',
      'Distribution', 'Document',
      'Frequency', 'Geometry', 'Identifier', 'Kind',
      'LegalResource', 'LicenseDocument', 'LinguisticSystem', 'Location',
      'MediaType', 'MediaTypeOrExtent',
      'PeriodOfTime', 'Policy', 'ProvenanceStatement',
      'Relationship', 'Resource', 'RightsStatement', 'Role',
      'Standard', 'SupportiveEntity', 'TimeInstant',
    ],
  },
  {
    id:    'dcat-ap-plus',
    label: 'DCAT-AP+',
    // dcat_ap_plus.yaml — classes added over the base DCAT-AP vocabulary
    classes: [
      'AgenticEntity', 'AnalysisDataset', 'AnalysisSourceData',
      'DataAnalysis', 'DataGeneratingActivity', 'DefinedTerm',
      'Device', 'Entity', 'EvaluatedActivity', 'EvaluatedEntity',
      'Plan', 'Software',
    ],
  },
  {
    id:    'chemdcat',
    label: 'ChemDCAT-AP',
    // chem_dcat_ap.yaml — top-level classes added by the ChemDCAT-AP profile
    classes: ['Laboratory', 'PolymerSample', 'SubstanceSample'],
  },
  {
    id:    'material',
    label: 'Material Entities',
    // material_entities_ap.yaml (measurement-property classes excluded)
    classes: ['MaterialEntity', 'MaterialSample'],
  },
  {
    id:    'chemical',
    label: 'Chemical Entities',
    // chemical_entities_ap.yaml (inline identifier/measurement classes excluded)
    classes: ['Atom', 'ChemicalEntity'],
  },
  {
    id:    'reaction',
    label: 'Chemical Reaction',
    // chemical_reaction_ap.yaml (inline yield/molar classes excluded)
    classes: [
      'Catalyst', 'ChemicalProduct', 'ChemicalReaction',
      'DissolvingSubstance', 'Reagent', 'Reactor',
      'StartingMaterial', 'Surrounding',
    ],
  },
];

export const config = {
  appTitle:    'Schema Graph Editor',
  appSubtitle: 'chem-dcat-ap visual instance editor',
  githubUrl:   'https://github.com/nfdi4cat/chem-dcat-ap',
  schema,
  abstractClasses: [...DCAT_AP_BASE, ...DCAT_ADMIN, ...CHEMDCAT_ABSTRACT, ...DCAT_DATA_CLASSES],
  paletteSections: PALETTE_SECTIONS,
  examples: [
    {
      json:  msJson,
      label: 'MaterialSample',
      title: "Philip's Wood Sample",
      desc:  'Physical sample with mass, temperature, volume & pressure measurements.',
    },
    {
      json:  ssJson,
      label: 'SubstanceSample',
      title: 'CRS-50440',
      desc:  'Chemical substance with InChI, SMILES, molecular formula & molar mass.',
    },
    {
      json:  crJson,
      label: 'ChemicalReaction',
      title: 'CRR-56408 Reaction',
      desc:  'Phosphorylation with starting materials, solvents, temperatures & yield.',
    },
  ],
};
