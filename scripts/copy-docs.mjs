/**
 * Post-build script: copies static docs pages from public/ into dist/
 * so the final dist/ tree is:
 *
 *   dist/
 *   ├── index.html        ← docs home
 *   ├── howto.html        ← how-to guide
 *   ├── widget-page.html  ← iframe demo page
 *   └── widget/
 *       ├── index.html    ← React app (built by Vite)
 *       └── assets/
 */
import { copyFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const files = [
  ['public/index.html',       'dist/index.html'],
  ['public/howto.html',       'dist/howto.html'],
  ['public/widget-page.html', 'dist/widget-page.html'],
];

mkdirSync(resolve(root, 'dist'), { recursive: true });

for (const [src, dest] of files) {
  copyFileSync(resolve(root, src), resolve(root, dest));
  console.log(`  copied  ${src}  →  ${dest}`);
}
