import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('Files and Activity Integration', function () {
  let mongo: MongoMemoryServer;
  let app: any;
  let token: string;
  this.timeout(20000);

  before(async function () {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await connectDB(uri);
    app = createApp();

    // signup
    const res = await request(app).post('/api/auth/signup').send({ name: 'FileUser', email: 'fileuser@example.com', password: 'password', workspaceName: 'FileWS' }).expect(201);
    token = res.body.data.accessToken;
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('uploads a file and records activity, then deletes it', async () => {
    // create project
    const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name: 'FileProj', clientName: 'C', description: 'd' }).expect(201);
    const projectId = p.body.data._id;

    // prepare temp file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberify-test-'));
    const tmpPath = path.join(tmpDir, 'test-upload.txt');
    fs.writeFileSync(tmpPath, 'Hello world');

    // upload
    const up = await request(app).post('/api/files/upload').set('Authorization', `Bearer ${token}`).field('projectId', projectId).attach('file', tmpPath).expect(201);
    expect(up.body.ok).to.be.true;
    const fileId = up.body.file._id;

    // activity logs should contain File Uploaded
    const a = await request(app).get('/api/activity-logs').set('Authorization', `Bearer ${token}`).expect(200);
    expect(a.body.ok).to.be.true;
    const found = a.body.data.items.find((it: any) => it.type === 'File Uploaded');
    expect(found).to.exist;

    // delete file
    const d = await request(app).delete(`/api/files/${fileId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(d.body.ok).to.be.true;

    // cleanup temp
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
