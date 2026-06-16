import request from 'supertest';
import { auth, createTestApp, signup, TestAppContext } from './helpers/testApp';

describe('meetings module', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('requires authentication and validates title and date fields', async () => {
    const account = await signup(ctx.app, 'meetings-validation');

    await request(ctx.app)
      .get('/api/meetings')
      .expect(401);

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({})
      .expect(400);

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({ title: '', date: '2026-06-17T10:00:00.000Z' })
      .expect(400);

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({ title: 'Invalid Date Meeting', date: 'not-a-date' })
      .expect(400);
  });

  it('supports meeting CRUD with title, notes, date, and project link', async () => {
    const account = await signup(ctx.app, 'meetings-crud');

    const project = await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({ name: 'Meeting Parent Project' })
      .expect(201);
    const projectId = project.body.data._id;

    const created = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({
        title: 'Discovery Meeting',
        notes: 'Client needs authentication and reporting',
        date: '2026-06-17T10:00:00.000Z',
        projectId
      })
      .expect(201);

    const meetingId = created.body.data._id;
    expect(created.body.data.title).toBe('Discovery Meeting');
    expect(created.body.data.notes).toBe('Client needs authentication and reporting');
    expect(created.body.data.projectId).toBe(projectId);
    expect(new Date(created.body.data.date).toISOString()).toBe('2026-06-17T10:00:00.000Z');

    const fetched = await request(ctx.app)
      .get(`/api/meetings/${meetingId}`)
      .set(auth(account.accessToken))
      .expect(200);

    expect(fetched.body.data._id).toBe(meetingId);

    const updated = await request(ctx.app)
      .put(`/api/meetings/${meetingId}`)
      .set(auth(account.accessToken))
      .send({
        title: 'Updated Discovery Meeting',
        notes: 'Updated notes with clarified scope',
        date: '2026-06-18T12:30:00.000Z'
      })
      .expect(200);

    expect(updated.body.data.title).toBe('Updated Discovery Meeting');
    expect(updated.body.data.notes).toBe('Updated notes with clarified scope');
    expect(new Date(updated.body.data.date).toISOString()).toBe('2026-06-18T12:30:00.000Z');

    await request(ctx.app)
      .put(`/api/meetings/${meetingId}`)
      .set(auth(account.accessToken))
      .send({ date: 'not-a-date' })
      .expect(400);

    await request(ctx.app)
      .delete(`/api/meetings/${meetingId}`)
      .set(auth(account.accessToken))
      .expect(200);

    const afterDelete = await request(ctx.app)
      .get(`/api/meetings/${meetingId}`)
      .set(auth(account.accessToken))
      .expect(200);

    expect(afterDelete.body.data).toBeNull();
  });

  it('supports search and date filters inside the current workspace only', async () => {
    const userA = await signup(ctx.app, 'meetings-filter-a');
    const userB = await signup(ctx.app, 'meetings-filter-b');

    const kickoff = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userA.accessToken))
      .send({
        title: 'Kickoff Discovery',
        notes: 'Payment gateway and user role requirements',
        date: '2026-06-17T09:00:00.000Z'
      })
      .expect(201);

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userA.accessToken))
      .send({
        title: 'Sprint Review',
        notes: 'Delivery blockers and reporting feedback',
        date: '2026-06-18T15:00:00.000Z'
      })
      .expect(201);

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userB.accessToken))
      .send({
        title: 'Kickoff Foreign Workspace',
        notes: 'Should never appear for user A',
        date: '2026-06-17T09:00:00.000Z'
      })
      .expect(201);

    const byTitle = await request(ctx.app)
      .get('/api/meetings?q=kickoff')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(byTitle.body.data).toHaveLength(1);
    expect(byTitle.body.data[0]._id).toBe(kickoff.body.data._id);

    const byNotes = await request(ctx.app)
      .get('/api/meetings?q=payment')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(byNotes.body.data).toHaveLength(1);
    expect(byNotes.body.data[0].title).toBe('Kickoff Discovery');

    const dateFiltered = await request(ctx.app)
      .get('/api/meetings?dateFrom=2026-06-18&dateTo=2026-06-18')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(dateFiltered.body.data).toHaveLength(1);
    expect(dateFiltered.body.data[0].title).toBe('Sprint Review');

    const fullRange = await request(ctx.app)
      .get('/api/meetings?dateFrom=2026-06-17&dateTo=2026-06-18')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(fullRange.body.data.map((meeting: any) => meeting.title).sort()).toEqual([
      'Kickoff Discovery',
      'Sprint Review'
    ]);

    const futureFiltered = await request(ctx.app)
      .get('/api/meetings?dateFrom=2999-01-01')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(futureFiltered.body.data).toHaveLength(0);
  });
});
