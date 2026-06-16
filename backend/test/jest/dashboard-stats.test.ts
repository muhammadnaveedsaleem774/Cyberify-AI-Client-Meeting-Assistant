import request from 'supertest';
import { auth, createTestApp, signup, TestAppContext } from './helpers/testApp';

describe('dashboard stats', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('returns aggregate chart breakdowns for ObjectId workspace ids', async () => {
    const account = await signup(ctx.app, 'dashboard-chart');

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({ name: 'Active Project', status: 'active' })
      .expect(201);

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({ name: 'Completed Project', status: 'completed' })
      .expect(201);

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({ title: 'Dashboard Meeting', date: '2026-06-17T10:00:00.000Z' })
      .expect(201);

    await request(ctx.app)
      .post('/api/tasks')
      .set(auth(account.accessToken))
      .send({ title: 'Open Dashboard Task', status: 'Open' })
      .expect(201);

    await request(ctx.app)
      .post('/api/tasks')
      .set(auth(account.accessToken))
      .send({ title: 'Completed Dashboard Task', status: 'Completed' })
      .expect(201);

    const res = await request(ctx.app)
      .get('/api/dashboard/stats')
      .set(auth(account.accessToken))
      .expect(200);

    expect(res.body.stats.totalProjects).toBe(2);
    expect(res.body.stats.totalMeetings).toBe(1);
    expect(res.body.stats.openTasks).toBe(1);
    expect(res.body.stats.completedTasks).toBe(1);
    expect(res.body.stats.projectsByStatus).toEqual({ active: 1, completed: 1 });
    expect(res.body.stats.tasksByStatus).toEqual({ Open: 1, Completed: 1 });
    expect(res.body.stats.meetingsByDate).toEqual({ '2026-06-17': 1 });
  });
});
