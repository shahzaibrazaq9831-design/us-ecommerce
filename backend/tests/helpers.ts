import type { Express } from 'express';
import type { AppConfig } from '../src/config';
import { createApp } from '../src/app';
import { createContainer, type Container } from '../src/container';
import { seedDatabase } from '../src/seed';

export const TEST_CONFIG: AppConfig = {
  port: 0,
  jwtSecret: 'jest-secret',
  dbPath: ':memory:',
  corsOrigin: '*',
  nodeEnv: 'test',
};

export interface TestContext {
  app: Express;
  container: Container;
}

export async function createTestContext(): Promise<TestContext> {
  const container = createContainer(TEST_CONFIG);
  await seedDatabase(container);
  const app = createApp(container);
  return { app, container };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
