import { accessSync, constants, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import chalk from 'chalk';
import { analyze } from '@rekkon/parser';
import { formatBytes, formatDuration } from '../utils/format.js';

interface AnalyzeCommandOptions {
  output: string;
  symbols: boolean;
  ignore?: string[];
  moduleDepth: string;
  json: boolean;
}

export async function analyzeCommand(
  directory: string,
  options: AnalyzeCommandOptions,
): Promise<void> {
  const rootDir = resolve(directory);

  if (!existsSync(rootDir)) {
    console.error(chalk.red(`Error: Directory not found: ${rootDir}`));
    process.exit(1);
  }

  const rootStats = statSync(rootDir);
  if (!rootStats.isDirectory()) {
    console.error(chalk.red(`Error: Not a directory: ${rootDir}`));
    process.exit(1);
  }

  try {
    accessSync(rootDir, constants.R_OK);
  } catch {
    console.error(chalk.red(`Error: Directory is not readable: ${rootDir}`));
    process.exit(1);
  }

  const log = options.json ? () => {} : console.log;
  const rootDisplayPath = relative(process.cwd(), rootDir) || '.';
  const rootDisplayLabel = rootDisplayPath === '.' ? './' : rootDisplayPath;
  const moduleDepth = parseModuleDepth(options.moduleDepth);

  log(`\n${chalk.cyan('🔍')} Analyzing ${chalk.bold(rootDisplayLabel)}...\n`);

  try {
    const result = await analyze({
      rootDir,
      extractSymbols: options.symbols,
      ignorePaths: options.ignore,
      moduleDepth,
    });

    const { graph, duration_ms: durationMs, errors } = result;
    const { snapshot } = graph;

    if (options.json) {
      process.stdout.write(JSON.stringify(graph, null, 2));
      return;
    }

    log(`${chalk.green('✅')} Analysis complete in ${formatDuration(durationMs)}\n`);
    log(`  Files:    ${chalk.bold(String(snapshot.total_files))}`);
    log(`  Symbols:  ${chalk.bold(String(snapshot.total_symbols))}`);
    log(`  Edges:    ${chalk.bold(String(snapshot.total_edges))}`);
    log(`  LOC:      ${chalk.bold(String(snapshot.total_loc))}`);
    if (snapshot.languages.length > 0) {
      log(`  Language: ${snapshot.languages.join(', ')}`);
    }

    if (snapshot.layer_summary.length > 0) {
      log('');
      log('  Layers:');
      for (const layer of snapshot.layer_summary) {
        log(
          `    ${chalk.bold(layer.label.padEnd(8))} - ${layer.file_count} files, ${layer.symbol_count} symbols`,
        );
      }
    }

    const outputPath = resolve(options.output);
    mkdirSync(dirname(outputPath), { recursive: true });
    const json = JSON.stringify(graph, null, 2);
    writeFileSync(outputPath, json, 'utf8');

    const fileSize = statSync(outputPath).size;
    const outputDisplayPath = relative(process.cwd(), outputPath) || outputPath;
    log(`\n${chalk.cyan('📄')} Written to ${chalk.bold(outputDisplayPath)} (${formatBytes(fileSize)})\n`);

    if (errors.length > 0) {
      log(chalk.yellow(`⚠️  ${errors.length} file(s) had parse errors:`));
      for (const error of errors) {
        log(chalk.dim(`   ${error.file} - ${error.error}`));
      }
      log('');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Analysis failed: ${message}`));
    process.exit(1);
  }
}

function parseModuleDepth(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
