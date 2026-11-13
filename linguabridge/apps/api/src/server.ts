import dotenv from 'dotenv';
dotenv.config();

import { buildApp } from './app';

const port = Number(process.env.PORT || process.env.API_PORT) || 3001;
const host = process.env.API_HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

async function main() {
  const app = await buildApp({ enableLogging: true });

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port, host });
    app.log.info(`LinguaBridge API server running at http://${host}:${port}`);
    app.log.info(`Documentation available at http://${host}:${port}/docs`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
