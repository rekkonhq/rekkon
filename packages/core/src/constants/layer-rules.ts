// Default layer classifications for common frameworks
// Maps directory patterns to layer labels

export const DEFAULT_LAYER_RULES: Record<string, string> = {
  // Next.js / React
  'app/api': 'API',
  'pages/api': 'API',
  app: 'Pages',
  pages: 'Pages',
  components: 'UI',
  hooks: 'Hooks',
  lib: 'Core',
  utils: 'Core',
  helpers: 'Core',
  services: 'Services',
  store: 'State',
  stores: 'State',
  context: 'State',
  types: 'Types',
  styles: 'Styles',
  public: 'Assets',
  config: 'Config',
  middleware: 'Middleware',
  tests: 'Tests',
  __tests__: 'Tests',

  // Express / Backend
  routes: 'API',
  controllers: 'API',
  models: 'Data',
  schemas: 'Data',
  migrations: 'Data',
  prisma: 'Data',
  drizzle: 'Data',
};
