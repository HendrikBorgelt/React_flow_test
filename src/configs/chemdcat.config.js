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

export const config = {
  appTitle:    'Schema Graph Editor',
  appSubtitle: 'chem-dcat-ap visual instance editor',
  githubUrl:   'https://github.com/nfdi4cat/chem-dcat-ap',
  schema,
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
