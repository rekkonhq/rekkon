// Default layer classifications for common frameworks
// Maps directory segment names to layer labels

export const DEFAULT_LAYER_RULES_MULTI: Record<string, string> = {
  'app/api': 'API',
  'pages/api': 'API',
  'src/app/api': 'API',
  'src/pages/api': 'API',
};

export const DEFAULT_LAYER_RULES: Record<string, string> = {
  // Application surfaces
  app: 'Pages',
  pages: 'Pages',
  layouts: 'UI',
  components: 'UI',
  visualizer: 'UI',
  views: 'UI',
  display: 'UI',
  render: 'UI',

  // State and composition
  hooks: 'Hooks',
  context: 'State',
  providers: 'State',
  store: 'State',
  stores: 'State',
  zustand: 'State',
  redux: 'State',
  atoms: 'State',

  // Core / library internals
  core: 'Core',
  lib: 'Lib',
  libs: 'Lib',
  utils: 'Lib',
  helpers: 'Lib',
  graph: 'Core',
  builders: 'Core',
  analyzers: 'Core',
  parsers: 'Core',
  engine: 'Core',
  languages: 'Core',
  grammars: 'Core',
  plugins: 'Core',
  commands: 'Core',
  cmd: 'Core',
  cli: 'Core',

  // API and transport
  api: 'API',
  routes: 'API',
  route: 'API',
  server: 'API',
  http: 'API',
  ws: 'API',
  websocket: 'API',
  controllers: 'API',
  controller: 'API',
  resolvers: 'API',
  resolver: 'API',
  queries: 'API',
  query: 'API',
  mutations: 'API',
  mutation: 'API',
  actions: 'API',
  handlers: 'API',
  auth: 'API',
  authentication: 'API',
  authorization: 'API',

  // Data and persistence
  data: 'Data',
  db: 'Data',
  database: 'Data',
  models: 'Data',
  model: 'Data',
  schemas: 'Data',
  schema: 'Data',
  migrations: 'Data',
  seeds: 'Data',
  prisma: 'Data',
  drizzle: 'Data',

  // Platform services
  services: 'Services',
  service: 'Services',
  workers: 'Services',
  worker: 'Services',
  jobs: 'Services',
  job: 'Services',
  queues: 'Services',
  queue: 'Services',
  tasks: 'Services',
  task: 'Services',
  emails: 'Services',
  templates: 'Services',
  notifications: 'Services',

  // Configuration and infrastructure
  config: 'Config',
  configs: 'Config',
  scripts: 'Config',
  tools: 'Config',
  bin: 'Config',

  // Middleware / cross-cutting concerns
  middleware: 'Middleware',

  // Types and tests
  types: 'Types',
  tests: 'Tests',
  test: 'Tests',
  __tests__: 'Tests',
  spec: 'Tests',
  specs: 'Tests',
  __mocks__: 'Tests',

  // Styling and assets
  styles: 'Styles',
  style: 'Styles',
  assets: 'Assets',
  public: 'Assets',
  images: 'Assets',
  fonts: 'Assets',
  icons: 'Assets',
  media: 'Assets',
};
