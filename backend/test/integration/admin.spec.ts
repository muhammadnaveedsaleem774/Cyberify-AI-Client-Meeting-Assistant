import { expect } from 'chai';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../../src/index';
import { connectDB } from '../../src/db';
import mongoose from 'mongoose';
import UserModel from '../../src/models/user.model';

describe('Admin Integration', function () {
  let mongo: MongoMemoryServer;
  let app: any;
  let userToken: string;
  let adminToken: string;
  this.timeout(20000);

  before(async function () {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await connectDB(uri);
    app = createApp();

    // normal user signup
    const res = await request(app).post('/api/auth/signup').send({ name: 'Normal', email: 'normal@example.com', password: 'password', workspaceName: 'NormWS' }).expect(201);
    userToken = res.body.data.accessToken;

    // admin user signup then promote
    const res2 = await request(app).post('/api/auth/signup').send({ name: 'Admin', email: 'admin@example.com', password: 'password', workspaceName: 'AdminWS' }).expect(201);
    adminToken = res2.body.data.accessToken;

    // promote admin user in DB
    const adminUser = await UserModel.findOne({ email: 'admin@example.com' });
    if (adminUser) { adminUser.role = 'admin'; await adminUser.save(); }
  });

  after(async function () {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('normal user cannot access admin stats', async () => {
    await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${userToken}`).expect(403);
  });

  it('admin user can access admin stats', async () => {
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.ok).to.be.true;
    expect(res.body.stats).to.have.property('totalUsers');
  });
});
