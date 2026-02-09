import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RekkonGraphSchema } from '@rekkon/core';
import { analyze } from '../src/index.js';

async function main() {
  const rootDir = resolve(import.meta.dirname, '../../core/src');

  console.log(`Analyzing ${rootDir}...`);
  const result = await analyze({ rootDir });

  console.log(`✅ Analysis complete in ${result.duration_ms}ms`);
  console.log(`   Files: ${result.graph.snapshot.total_files}`);
  console.log(`   Symbols: ${result.graph.snapshot.total_symbols}`);
  console.log(`   Edges: ${result.graph.snapshot.total_edges}`);
  console.log(`   Errors: ${result.errors.length}`);

  RekkonGraphSchema.parse(result.graph);
  console.log('✅ Zod validation passed');

  const outPath = resolve(import.meta.dirname, 'test-output.json');
  writeFileSync(outPath, JSON.stringify(result.graph, null, 2));
  console.log(`Output written to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
