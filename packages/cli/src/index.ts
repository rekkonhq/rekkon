#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';
import { serveCommand } from './commands/serve.js';

const program = new Command();

program
  .name('rekkon')
  .description('Understand your codebase. Architecture analysis for AI agents and developers.')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze a codebase and produce an architecture graph')
  .argument('[directory]', 'Directory to analyze', '.')
  .option('-o, --output <path>', 'Output file path', 'rekkon-graph.json')
  .option('--no-symbols', 'Skip function/class-level symbol extraction')
  .option('--ignore <patterns...>', 'Additional glob patterns to ignore')
  .option('--module-depth <n>', 'Maximum depth for module grouping', '2')
  .option('--json', 'Output raw JSON to stdout instead of writing a file')
  .action(analyzeCommand);

program
  .command('serve')
  .description('Start a local server to visualize a Rekkon graph')
  .argument('[file]', 'Path to rekkon-graph.json', 'rekkon-graph.json')
  .option('-p, --port <number>', 'Port to serve on', '3333')
  .option('--no-open', "Don't auto-open the browser")
  .action(serveCommand);

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
