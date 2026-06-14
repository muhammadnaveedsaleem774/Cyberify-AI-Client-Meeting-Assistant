import jwt from 'jsonwebtoken';
import request from 'supertest';
import { config } from '../../src/config';
import { createTestApp, signup, auth, TestAppContext } from './helpers/testApp';

describe('auth and security', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('signs up and logs in successfully', async () => {
    const account = await signup(ctx.app, 'auth-success');
    expect(account.accessToken).toBeTruthy();
    expect(account.refreshToken).toBeTruthy();
    expect(account.user.passwordHash).toBeUndefined();

    const login = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'user-auth-success@example.com', password: 'password123' })
      .expect(200);

    expect(login.body.ok).toBe(true);
    expect(login.body.data.accessToken).toBeTruthy();
    expect(login.body.data.refreshToken).toBeTruthy();
    expect(login.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid credentials', async () => {
    await signup(ctx.app, 'invalid-creds');
    await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'user-invalid-creds@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('blocks unauthorized requests and invalid JWTs', async () => {
    await request(ctx.app).get('/api/projects').expect(401);
    await request(ctx.app).get('/api/projects').set('Authorization', 'Bearer not-a-jwt').expect(401);
  });

  it('rejects expired access tokens', async () => {
    const account = await signup(ctx.app, 'expired-token');
    const expiredAccessToken = jwt.sign(
      { userId: account.user.id, workspaceId: account.workspace._id },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );

    await request(ctx.app).get('/api/workspaces').set(auth(expiredAccessToken)).expect(401);
  });

  it('rotates refresh tokens and revokes old tokens on logout', async () => {
    const account = await signup(ctx.app, 'refresh-flow');

    const refreshed = await request(ctx.app)
      .post('/api/auth/refresh')
      .send({ refreshToken: account.refreshToken })
      .expect(200);

    expect(refreshed.body.data.accessToken).toBeTruthy();
    expect(refreshed.body.data.refreshToken).toBeTruthy();
    expect(refreshed.body.data.refreshToken).not.toBe(account.refreshToken);

    await request(ctx.app)
      .post('/api/auth/refresh')
      .send({ refreshToken: account.refreshToken })
      .expect(401);

    await request(ctx.app)
      .post('/api/auth/logout')
      .send({ refreshToken: refreshed.body.data.refreshToken })
      .expect(200);

    await request(ctx.app)
      .post('/api/auth/refresh')
      .send({ refreshToken: refreshed.body.data.refreshToken })
      .expect(401);
  });
});
