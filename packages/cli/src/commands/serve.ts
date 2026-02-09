import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { RekkonGraphSchema } from '@rekkon/core';
import { ServeStartupError, startDevServer } from '../server/dev-server.js';

interface ServeOptions {
  port: string;
  open: boolean;
}

export async function serveCommand(file: string, options: ServeOptions): Promise<void> {
  const filePath = resolve(file);

  if (!existsSync(filePath)) {
    console.error(chalk.red(`Error: File not found: ${filePath}`));
    console.error(chalk.dim('Run "rekkon analyze" first to generate a graph file.'));
    process.exit(1);
  }

  let graphData: unknown;
  try {
    graphData = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    console.error(chalk.red(`Error: Invalid JSON in ${filePath}`));
    process.exit(1);
  }

  try {
    RekkonGraphSchema.parse(graphData);
  } catch (error) {
    console.error(chalk.red(`Error: Invalid Rekkon graph format in ${filePath}`));
    console.error(chalk.dim(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  if (!/^\d+$/.test(options.port)) {
    console.error(chalk.red(`Error: Invalid port "${options.port}". Use a number between 1 and 65535.`));
    process.exit(1);
  }

  const port = Number(options.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(chalk.red(`Error: Invalid port "${options.port}". Use a number between 1 and 65535.`));
    process.exit(1);
  }

  try {
    await startDevServer({
      filePath,
      port,
      open: options.open,
    });
  } catch (error) {
    if (error instanceof ServeStartupError) {
      process.exit(1);
    }
    throw error;
  }
}
