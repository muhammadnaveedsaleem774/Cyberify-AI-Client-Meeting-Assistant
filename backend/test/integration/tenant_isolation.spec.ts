import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('Tenant Isolation', function () {
  let mongo: MongoMemoryServer;
  let app: any;
  let tokenA: string;
  let tokenB: string;
  this.timeout(20000);

  before(async function () {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await connectDB(uri);
    app = createApp();

    // signup user A
    const r1 = await request(app).post('/api/auth/signup').send({ name: 'UserA', email: 'a@example.com', password: 'password', workspaceName: 'WS-A' }).expect(201);
    tokenA = r1.body.data.accessToken;

    // signup user B
    const r2 = await request(app).post('/api/auth/signup').send({ name: 'UserB', email: 'b@example.com', password: 'password', workspaceName: 'WS-B' }).expect(201);
    tokenB = r2.body.data.accessToken;
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('blocks cross-workspace project access', async () => {
    // create project as A
    const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${tokenA}`).send({ name: 'ProjA' }).expect(201);
    const projectId = p.body.data._id;

    // B should not see the project by id
    const getB = await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect(getB.body.data).to.be.null;

    // B listing projects should not include it
    const listB = await request(app).get('/api/projects').set('Authorization', `Bearer ${tokenB}`).expect(200);
    const found = (listB.body.data as any[]).find(it => String(it._id) === String(projectId));
    expect(found).to.be.undefined;
  });

  it('blocks cross-workspace meeting access', async () => {
    // create project + meeting as A
    const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${tokenA}`).send({ name: 'ProjM' }).expect(201);
    const projectId = p.body.data._id;
    const m = await request(app).post('/api/meetings').set('Authorization', `Bearer ${tokenA}`).send({ title: 'M1', date: new Date().toISOString(), projectId }).expect(201);
    const meetingId = m.body.data._id;

    // B cannot fetch
    const getB = await request(app).get(`/api/meetings/${meetingId}`).set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect(getB.body.data).to.be.null;
  });

  it('blocks cross-workspace task access', async () => {
    // create meeting as A
    const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${tokenA}`).send({ name: 'ProjT' }).expect(201);
    const projectId = p.body.data._id;
    const m = await request(app).post('/api/meetings').set('Authorization', `Bearer ${tokenA}`).send({ title: 'M-T', date: new Date().toISOString(), projectId }).expect(201);
    const meetingId = m.body.data._id;

    // create task as A
    const t = await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Task1', meetingId }).expect(201);
    const taskId = t.body.data._id;

    // B cannot fetch task
    const getB = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect(getB.body.data).to.be.null;
  });

  it('blocks cross-workspace AIAnalysis access', async () => {
    // create meeting as A
    const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${tokenA}`).send({ name: 'ProjAI' }).expect(201);
    const projectId = p.body.data._id;
    const m = await request(app).post('/api/meetings').set('Authorization', `Bearer ${tokenA}`).send({ title: 'MAI', date: new Date().toISOString(), projectId }).expect(201);
    const meetingId = m.body.data._id;

    // analyze as A (POST)
    await request(app).post('/api/ai/analyze-meeting').set('Authorization', `Bearer ${tokenA}`).send({ meetingId }).expect(200);

    // B should not see analysis
    const getB = await request(app).get(`/api/ai/analysis/${meetingId}`).set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect(getB.body.data).to.be.null;
  });

  it('blocks cross-workspace file access (download/delete)', async () => {
    // create project as A
    const p = await request(app).post('/api/projects').set('Authorization', `Bearer ${tokenA}`).send({ name: 'ProjF' }).expect(201);
    const projectId = p.body.data._id;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberify-test-'));
    const tmp = path.join(tmpDir, 'tmp-file.txt');
    fs.writeFileSync(tmp, 'hello');

    const up = await request(app).post('/api/files/upload').set('Authorization', `Bearer ${tokenA}`).field('projectId', projectId).attach('file', tmp).expect(201);
    const fileId = up.body.file._id;

    // B listing files for project should be empty
    const listB = await request(app).get(`/api/files/project/${projectId}`).set('Authorization', `Bearer ${tokenB}`).expect(200);
    expect(listB.body.files).to.be.an('array').that.is.empty;

    // B cannot download
    await request(app).get(`/api/files/${fileId}/download`).set('Authorization', `Bearer ${tokenB}`).expect(403);

    // B cannot delete
    await request(app).delete(`/api/files/${fileId}`).set('Authorization', `Bearer ${tokenB}`).expect(403);

    // cleanup tmp
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
