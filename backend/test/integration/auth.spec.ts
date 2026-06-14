import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';

describe('Auth Integration', function () {
  let mongo: MongoMemoryServer;
  let app: any;

  before(async function () {
    this.timeout(20000);
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await connectDB(uri);
    app = createApp();
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('signup should create user and workspace and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password', workspaceName: 'Test WS' })
      .expect(201);

    expect(res.body).to.have.property('ok', true);
    expect(res.body.data).to.have.property('user');
    expect(res.body.data).to.have.property('workspace');
    expect(res.body.data).to.have.property('accessToken');
    expect(res.body.data).to.have.property('refreshToken');
    expect(res.body.data.user).to.not.have.property('passwordHash');
  });

  it('login should return tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password' }).expect(200);
    expect(res.body).to.have.property('ok', true);
    expect(res.body.data).to.have.property('accessToken');
    expect(res.body.data).to.have.property('refreshToken');
    expect(res.body.data.user).to.not.have.property('passwordHash');
  });

  it('protected route without token should fail', async () => {
    await request(app).get('/api/workspaces').expect(401);
  });

  it('protected route with token should pass', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password' }).expect(200);
    const token = login.body.data.accessToken;
    const res = await request(app).get('/api/workspaces').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).to.have.property('ok', true);
    // workspace created on signup should exist
    expect(res.body.data).to.be.an('array').that.is.not.empty;
  });

  it('refresh should rotate tokens and logout should revoke refresh token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password' }).expect(200);
    const firstRefreshToken = login.body.data.refreshToken;

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(200);

    expect(refreshed.body.data).to.have.property('accessToken');
    expect(refreshed.body.data).to.have.property('refreshToken');
    expect(refreshed.body.data.refreshToken).to.not.equal(firstRefreshToken);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken })
      .expect(401);

    const activeRefreshToken = refreshed.body.data.refreshToken;
    await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: activeRefreshToken })
      .expect(200);

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: activeRefreshToken })
      .expect(401);
  });
});
