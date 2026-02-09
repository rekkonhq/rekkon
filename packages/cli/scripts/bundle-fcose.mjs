import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, '..');
const entryPoint = resolve(packageRoot, 'src/server/fcose-entry.ts');
const outPaths = [
  resolve(packageRoot, 'src/server/fcose-bundle.js'),
  resolve(packageRoot, 'dist/server/fcose-bundle.js'),
];

const result = await build({
  entryPoints: [entryPoint],
  bundle: true,
  format: 'iife',
  globalName: 'cytoscapeFcose',
  platform: 'browser',
  external: ['cytoscape'],
  define: {
    global: 'window',
  },
  write: false,
  logLevel: 'silent',
});

const output = result.outputFiles[0];
if (!output) {
  throw new Error('No fcose bundle was produced');
}

for (const outPath of outPaths) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, output.text, 'utf8');
}

console.log('fcose bundled successfully');
