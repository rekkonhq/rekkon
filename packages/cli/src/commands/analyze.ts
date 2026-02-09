import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyze } from '@rekkon/parser';

type CytoscapeElement = {
  group: 'nodes' | 'edges';
  data: Record<string, unknown>;
};

/**
 * rekkon analyze <directory>
 */
export async function analyzeCommand(targetDir: string): Promise<void> {
  const projectRoot = resolve(targetDir);
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
    throw new Error(`Directory not found: ${projectRoot}`);
  }

  const result = await analyze({ rootDir: projectRoot });
  const graph = result.graph;
  const outputDir = resolve(projectRoot, '.archviz');
  mkdirSync(outputDir, { recursive: true });

  const graphPath = resolve(outputDir, 'graph.json');
  writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  const cytoscapeElements: CytoscapeElement[] = [
    ...graph.elements.nodes.map((node) => ({
      group: 'nodes' as const,
      data: node.data as Record<string, unknown>,
    })),
    ...graph.elements.edges.map((edge) => ({
      group: 'edges' as const,
      data: edge.data as Record<string, unknown>,
    })),
  ];
  const cytoscapePath = resolve(outputDir, 'cytoscape.json');
  writeFileSync(cytoscapePath, JSON.stringify(cytoscapeElements, null, 2));

  const summary = {
    total_files: graph.snapshot.total_files,
    total_symbols: graph.snapshot.total_symbols,
    total_edges: graph.snapshot.total_edges,
    total_loc: graph.snapshot.total_loc,
    languages: graph.snapshot.languages,
    framework: graph.snapshot.framework ?? undefined,
    layer_summary: graph.snapshot.layer_summary,
    analysis_duration_ms: result.duration_ms,
    analyzer_version: graph.analyzer_version,
    errors: result.errors,
  };
  const summaryPath = resolve(outputDir, 'summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('Analysis complete');
  console.log(`Files: ${summary.total_files}`);
  console.log(`Symbols: ${summary.total_symbols}`);
  console.log(`Edges: ${summary.total_edges}`);
  console.log(`LOC: ${summary.total_loc}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Output: ${outputDir}`);
}
