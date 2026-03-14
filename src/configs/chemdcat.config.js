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

export const config = {
  appTitle:    'Schema Graph Editor',
  appSubtitle: 'chem-dcat-ap visual instance editor',
  githubUrl:   'https://github.com/nfdi4cat/chem-dcat-ap',
  schema,
  abstractClasses: [...DCAT_AP_BASE, ...DCAT_ADMIN, ...CHEMDCAT_ABSTRACT],
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
