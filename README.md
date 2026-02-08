# Rekkon

**Understand your codebase.** Architecture analysis for AI agents and developers.

Rekkon parses your codebase using tree-sitter, builds a layered architecture graph (Layer → Module → File → Symbol), and makes it queryable by AI agents via MCP and explorable via an interactive Cytoscape.js visualizer.

## Status

🚧 **Early development** — core types and parser PoC are working.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@rekkon/core` | Shared types, Zod schemas, utilities | ✅ Ready |
| `@rekkon/parser` | Tree-sitter codebase analysis engine | ✅ Implemented |
| `@rekkon/cli` | `rekkon analyze` CLI command | ✅ Implemented |
| `@rekkon/mcp` | MCP server for AI agents | 📋 Planned |
| `@rekkon/visualizer` | Local Cytoscape.js graph viewer | 🔨 PoC complete, migration pending |

## Quick Start

```bash
# Clone
git clone https://github.com/rekkonhq/rekkon.git
cd rekkon

# Install
npm install

# Build all packages
npm run build

# Run analysis via CLI
node packages/cli/dist/index.js analyze ./sample-project

# Open sample-project/visualizer.html in your browser
# (expects ./sample-project/.archviz from the command above)
```

## Architecture

Rekkon uses a 4-level hierarchy to represent codebases:

```
Layer (API, UI, Core, Data...)
  └── Module (auth/, dashboard/, utils/...)
        └── File (login.tsx, api.ts...)
              └── Symbol (functions, classes, types...)
```

Each level is a compound node in the graph. Edges represent imports, calls, renders, extends, and other relationships between nodes.

## How It Works

1. **Parse** — tree-sitter extracts structure from TypeScript/JavaScript files
2. **Classify** — Files are sorted into layers and modules based on directory patterns
3. **Connect** — Import/export analysis builds the dependency graph
4. **Output** — Cytoscape.js-compatible JSON with full metadata

## Open Core

This repo is the open-source core of Rekkon. It includes everything needed to analyze codebases locally and integrate with AI agents.

[Rekkon Cloud](https://rekkon.dev) (coming soon) adds a web dashboard, team collaboration, historical snapshots, and AI-powered descriptions.

## License

MIT
