import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';

describe('Dashboard Integration', function () {
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
    const res = await request(app).post('/api/auth/signup').send({ name: 'DashUser', email: 'dash@example.com', password: 'password', workspaceName: 'DashWS' }).expect(201);
    token = res.body.data.accessToken;
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('should return dashboard stats', async () => {
    // create a project
    await request(app).post('/api/projects').set('Authorization', `Bearer ${token}`).send({ name: 'Dash Project' }).expect(201);
    // create meeting
    await request(app).post('/api/meetings').set('Authorization', `Bearer ${token}`).send({ title: 'Dash Meet', date: new Date().toISOString() }).expect(201);
    // create task
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'Dash Task' }).expect(201);

    const statsRes = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`).expect(200);
    expect(statsRes.body.ok).to.be.true;
    const s = statsRes.body.stats;
    expect(s).to.have.property('totalProjects');
    expect(s).to.have.property('totalMeetings');
    expect(s).to.have.property('openTasks');
  });
});
