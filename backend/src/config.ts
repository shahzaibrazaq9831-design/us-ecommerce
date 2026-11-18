export interface AppConfig {
  port: number;
  jwtSecret: string;
  dbPath: string;
  corsOrigin: string;
  nodeEnv: string;
}

export function loadConfig(): AppConfig {
  const port = Number.parseInt(process.env.PORT ?? '4000', 10);
  return {
    port: Number.isFinite(port) ? port : 4000,
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-this-secret',
    dbPath: process.env.DB_PATH ?? './data/ecommerce.sqlite',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}
