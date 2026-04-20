/**
 * validate-examples.mjs
 *
 * Checks every JSON file in example_data/ against its compiled schema.
 * Validates that:
 *   1. The file has a @type or type field
 *   2. That class name exists in the compiled schema's $defs
 *
 * Usage:  node scripts/validate-examples.mjs
 * Exit:   0 = all OK, 1 = one or more errors
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Map from example_data sub-folder → compiled schema file
const SCHEMA_MAP = {
  'chem_dcat_ap':  'src/schema/dcat_4c_ap.schema.json',
  'coremeta4cat':  'src/schema/coremeta4cat.schema.json',
  'dcat_ap_plus':  'src/schema/dcat_ap_plus.schema.json',
};

function findJsonFiles(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) results.push(...findJsonFiles(full));
      else if (extname(entry) === '.json') results.push(full);
    }
  } catch {
    // directory doesn't exist — skip silently
  }
  return results;
}

let errors = 0;
let checked = 0;

for (const [folder, schemaFile] of Object.entries(SCHEMA_MAP)) {
  const exampleDir = join('example_data', folder);
  const files = findJsonFiles(exampleDir);
  if (!files.length) continue;

  let schema;
  try {
    schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
  } catch {
    console.error(`ERROR: Cannot load schema ${schemaFile} — run gen-json-schema first`);
    errors++;
    continue;
  }

  const defs = schema.$defs ?? {};

  for (const file of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      console.error(`ERROR: Invalid JSON — ${file}`);
      errors++;
      continue;
    }

    const type = data['@type'] ?? data['type'];
    if (!type) {
      console.warn(`WARN:  No @type field — ${file}`);
      continue;
    }

    if (!(type in defs)) {
      console.error(`ERROR: @type "${type}" not in schema ${schemaFile} — ${file}`);
      errors++;
    } else {
      console.log(`OK:    ${type.padEnd(40)} ${file}`);
    }
    checked++;
  }
}

console.log(`\n${checked} file(s) checked, ${errors} error(s).`);
process.exit(errors > 0 ? 1 : 0);
