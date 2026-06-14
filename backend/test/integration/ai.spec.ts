import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';

describe('AI Analysis Integration', function () {
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
    const res = await request(app).post('/api/auth/signup').send({ name: 'AIUser', email: 'aiuser@example.com', password: 'password', workspaceName: 'AIWS' }).expect(201);
    token = res.body.data.accessToken;
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('should analyze, fetch, re-analyze (update), and delete analysis', async () => {
    // create meeting
    const m = await request(app).post('/api/meetings').set('Authorization', `Bearer ${token}`).send({ title: 'AI Meeting', date: new Date().toISOString(), notes: 'Notes for AI' }).expect(201);
    const meetingId = m.body.data._id;

    // analyze
    const a1 = await request(app).post('/api/ai/analyze-meeting').set('Authorization', `Bearer ${token}`).send({ meetingId }).expect(200);
    expect(a1.body.ok).to.be.true;
    expect(a1.body.data).to.have.property('_id');
    const analysisId = a1.body.data._id;

    // fetch
    const g = await request(app).get(`/api/ai/analysis/${meetingId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(g.body.ok).to.be.true;
    expect(g.body.data).to.have.property('_id', analysisId);

    // analyze again -> should update and return same analysis id
    const a2 = await request(app).post('/api/ai/analyze-meeting').set('Authorization', `Bearer ${token}`).send({ meetingId }).expect(200);
    expect(a2.body.ok).to.be.true;
    expect(a2.body.data).to.have.property('_id', analysisId);

    // delete
    const d = await request(app).delete(`/api/ai/analysis/${meetingId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(d.body.ok).to.be.true;

    // fetch after delete -> should be null data
    const g2 = await request(app).get(`/api/ai/analysis/${meetingId}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(g2.body.ok).to.be.true;
    expect(g2.body.data).to.be.null;
  });
});
