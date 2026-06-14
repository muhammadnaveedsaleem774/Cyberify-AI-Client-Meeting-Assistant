import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../../src/index';
import { connectDB } from '../../../src/db';

export type TestAppContext = {
  app: ReturnType<typeof createApp>;
  mongo: MongoMemoryServer;
  close: () => Promise<void>;
};

export async function createTestApp(): Promise<TestAppContext> {
  const mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri());
  const app = createApp();

  return {
    app,
    mongo,
    async close() {
      await mongoose.disconnect();
      await mongo.stop();
    }
  };
}

export async function signup(app: ReturnType<typeof createApp>, suffix = Date.now().toString()) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      name: `User ${suffix}`,
      email: `user-${suffix}@example.com`,
      password: 'password123',
      workspaceName: `Workspace ${suffix}`
    })
    .expect(201);

  return {
    user: res.body.data.user,
    workspace: res.body.data.workspace,
    accessToken: res.body.data.accessToken as string,
    refreshToken: res.body.data.refreshToken as string
  };
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function createTempFile(filename: string, content = 'test file') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberify-test-'));
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);
  return {
    path: filePath,
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}
