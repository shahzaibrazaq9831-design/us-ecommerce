import { createApp } from './app';
import { loadConfig } from './config';
import { createContainer } from './container';
import { seedDatabase } from './seed';

async function main(): Promise<void> {
  const config = loadConfig();
  const container = createContainer(config);
  await seedDatabase(container);

  const app = createApp(container);
  const server = app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
    console.log(`SQLite database: ${config.dbPath}`);
  });

  const shutdown = () => {
    server.close(() => {
      container.db.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
