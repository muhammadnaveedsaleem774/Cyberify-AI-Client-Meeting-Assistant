import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';

describe('Modules Integration', function () {
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
    const res = await request(app).post('/api/auth/signup').send({ name: 'User2', email: 'user2@example.com', password: 'password', workspaceName: 'WS2' }).expect(201);
    token = res.body.data.accessToken;
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('projects: create and fetch', async () => {
    const create = await request(app).post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name: 'Project A', clientName: 'Client A', description: 'Desc' }).expect(201);
    expect(create.body.ok).to.be.true;
    const list = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.data).to.be.an('array').that.satisfies((arr: any[]) => arr.some((p) => p.name === 'Project A'));
  });

  it('meetings: create and fetch', async () => {
    const create = await request(app).post('/api/meetings').set('Authorization', `Bearer ${token}`).send({ title: 'Kickoff', date: new Date().toISOString(), notes: 'Intro' }).expect(201);
    expect(create.body.ok).to.be.true;
    const list = await request(app).get('/api/meetings').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.data).to.be.an('array').that.satisfies((arr: any[]) => arr.some((m) => m.title === 'Kickoff'));
  });

  it('tasks: create and complete', async () => {
    const create = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'Task 1', description: 'Do something', priority: 'High' }).expect(201);
    expect(create.body.ok).to.be.true;
    const id = create.body.data._id;
    const comp = await request(app).patch(`/api/tasks/${id}/complete`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(comp.body.ok).to.be.true;
    expect(comp.body.data.status).to.equal('Completed');
  });

  it('supports combinable project, meeting, and task filters', async () => {
    const today = new Date().toISOString().slice(0, 10);

    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Filter Alpha Project', clientName: 'Filter Client', status: 'active' })
      .expect(201);
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Filter Beta Project', clientName: 'Other Client', status: 'paused' })
      .expect(201);

    const projects = await request(app)
      .get('/api/projects')
      .query({ q: 'Alpha', status: 'active', dateFrom: today, dateTo: today })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(projects.body.data).to.be.an('array').with.length(1);
    expect(projects.body.data[0].name).to.equal('Filter Alpha Project');

    await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Filter Planning Meeting', date: `${today}T10:00:00.000Z`, notes: 'Planning notes' })
      .expect(201);
    await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Unrelated Meeting', date: `${today}T11:00:00.000Z`, notes: 'Other notes' })
      .expect(201);

    const meetings = await request(app)
      .get('/api/meetings')
      .query({ q: 'Planning', dateFrom: today, dateTo: today })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(meetings.body.data).to.be.an('array').with.length(1);
    expect(meetings.body.data[0].title).to.equal('Filter Planning Meeting');

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Filter Critical Task', description: 'Important filter task', priority: 'High' })
      .expect(201);
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Filter Minor Task', description: 'Less important', priority: 'Low' })
      .expect(201);

    const tasks = await request(app)
      .get('/api/tasks')
      .query({ q: 'Critical', status: 'Open', priority: 'High', dateFrom: today, dateTo: today })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(tasks.body.data).to.be.an('array').with.length(1);
    expect(tasks.body.data[0].title).to.equal('Filter Critical Task');
    expect(tasks.body.data[0].priority).to.equal('High');
  });
});
