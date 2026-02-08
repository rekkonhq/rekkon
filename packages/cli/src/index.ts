#!/usr/bin/env node

import { analyzeCommand } from './commands/analyze.js';

function printHelp(): void {
  console.log('rekkon');
  console.log('');
  console.log('Usage:');
  console.log('  rekkon analyze <directory>');
  console.log('');
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (!command || command === '-h' || command === '--help') {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  switch (command) {
    case 'analyze': {
      const targetDir = args[0];
      if (!targetDir) {
        printHelp();
        process.exit(1);
      }
      await analyzeCommand(targetDir);
      return;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
