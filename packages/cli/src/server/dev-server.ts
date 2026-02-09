import { readFileSync, unwatchFile, watchFile } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import chalk from 'chalk';
import open from 'open';
import { getHtmlTemplate } from './template.js';

interface DevServerOptions {
  filePath: string;
  port: number;
  open: boolean;
}

export class ServeStartupError extends Error {
  constructor() {
    super('Serve startup failed');
    this.name = 'ServeStartupError';
  }
}

export async function startDevServer(options: DevServerOptions): Promise<void> {
  const { filePath, port, open: shouldOpen } = options;
  let graphJson = readGraphFile(filePath);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = parseRequestUrl(req.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(getHtmlTemplate());
      return;
    }

    if (url.pathname === '/api/graph') {
      try {
        graphJson = readGraphFile(filePath);
      } catch {
        // Keep last known graph payload if the file is temporarily unreadable.
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(graphJson);
      return;
    }

    if (url.pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });

  const wss = new WebSocketServer({ server });
  const clients = new Set<WebSocket>();

  wss.on('error', (error: Error) => {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') {
      return;
    }
    console.error(chalk.red(`WebSocket error: ${error.message}`));
  });

  wss.on('connection', (client) => {
    clients.add(client);
    client.on('close', () => {
      clients.delete(client);
    });
    client.on('error', () => {
      clients.delete(client);
    });
    client.on('message', (_data: RawData) => {
      // Keepalive placeholder; no-op for now.
    });
  });

  watchFile(filePath, { interval: 500, persistent: true }, () => {
    const next = tryReadGraphFile(filePath, graphJson);
    if (next === graphJson) {
      return;
    }

    graphJson = next;
    console.log(chalk.dim('Graph file changed, reloading...'));
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    }
  });

  let shuttingDown = false;
  let listening = false;

  await new Promise<void>((resolve, reject) => {
    const cleanupListeners = () => {
      process.off('SIGINT', handleSigint);
      process.off('SIGTERM', handleSigterm);
      server.off('error', handleServerError);
    };

    const shutdown = () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      unwatchFile(filePath);

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
          client.close();
        }
      }

      wss.close(() => {
        server.close(() => {
          cleanupListeners();
          resolve();
        });
      });
    };

    const handleSigint = () => {
      console.log(chalk.dim('\nShutting down Rekkon visualizer...'));
      shutdown();
    };

    const handleSigterm = () => {
      shutdown();
    };

    const handleServerError = (error: NodeJS.ErrnoException) => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      unwatchFile(filePath);
      wss.close();
      cleanupListeners();

      if (error.code === 'EADDRINUSE') {
        console.error(chalk.red(`Error: Port ${port} is already in use.`));
        console.error(chalk.dim(`Try: rekkon serve --port ${port + 1}`));
      } else {
        const message = error.message || 'Unknown server error';
        console.error(chalk.red(`Error: ${message}`));
      }

      if (listening) {
        server.close(() => reject(new ServeStartupError()));
      } else {
        reject(new ServeStartupError());
      }
    };

    process.on('SIGINT', handleSigint);
    process.on('SIGTERM', handleSigterm);
    server.on('error', handleServerError);

    server.listen(port, () => {
      listening = true;
      const url = `http://localhost:${port}`;

      console.log(chalk.cyan(`🚀 Rekkon visualizer running at ${url}`));
      console.log(chalk.dim(`Watching ${filePath} for changes`));
      console.log(chalk.dim('Press Ctrl+C to stop'));

      if (shouldOpen) {
        void open(url).catch(() => {
          // Ignore environments where opening a browser is unsupported.
        });
      }
    });
  });
}

function parseRequestUrl(rawUrl: string | undefined): URL {
  try {
    return new URL(rawUrl ?? '/', 'http://localhost');
  } catch {
    return new URL('/', 'http://localhost');
  }
}

function readGraphFile(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

function tryReadGraphFile(filePath: string, fallback: string): string {
  try {
    return readGraphFile(filePath);
  } catch {
    return fallback;
  }
}
