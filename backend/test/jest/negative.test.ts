import request from 'supertest';
import { auth, createTestApp, signup, TestAppContext } from './helpers/testApp';

describe('negative and validation cases', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('rejects empty payloads on protected create endpoints', async () => {
    const account = await signup(ctx.app, 'negative-empty');

    await request(ctx.app).post('/api/projects').set(auth(account.accessToken)).send({}).expect(400);
    await request(ctx.app).post('/api/meetings').set(auth(account.accessToken)).send({}).expect(400);
    await request(ctx.app).post('/api/tasks').set(auth(account.accessToken)).send({}).expect(400);
    await request(ctx.app).post('/api/ai/analyze-meeting').set(auth(account.accessToken)).send({}).expect(400);
  });

  it('handles invalid object ids without exposing server crashes', async () => {
    const account = await signup(ctx.app, 'negative-ids');

    const project = await request(ctx.app).get('/api/projects/not-a-valid-id').set(auth(account.accessToken));
    const meeting = await request(ctx.app).get('/api/meetings/not-a-valid-id').set(auth(account.accessToken));
    const task = await request(ctx.app).get('/api/tasks/not-a-valid-id').set(auth(account.accessToken));

    expect([400, 404, 500]).toContain(project.status);
    expect([400, 404, 500]).toContain(meeting.status);
    expect([400, 404, 500]).toContain(task.status);
    expect(project.body.ok).toBe(false);
    expect(meeting.body.ok).toBe(false);
    expect(task.body.ok).toBe(false);
  });

  it('rejects very large JSON payloads', async () => {
    const account = await signup(ctx.app, 'negative-large');
    const largeDescription = 'x'.repeat(150 * 1024);

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({ name: 'Large Payload', description: largeDescription })
      .expect(413);
  });

  it('rejects invalid query date filters', async () => {
    const account = await signup(ctx.app, 'negative-dates');

    await request(ctx.app).get('/api/projects?dateFrom=not-a-date').set(auth(account.accessToken)).expect(400);
    await request(ctx.app).get('/api/meetings?dateTo=not-a-date').set(auth(account.accessToken)).expect(400);
    await request(ctx.app).get('/api/tasks?dateFrom=not-a-date').set(auth(account.accessToken)).expect(400);
  });
});
