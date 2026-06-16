import request from 'supertest';
import { auth, createTempFile, createTestApp, signup, TestAppContext } from './helpers/testApp';

describe('crud, tenant isolation, and files', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('runs full project, meeting, and task lifecycles', async () => {
    const account = await signup(ctx.app, 'crud');

    const project = await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({ name: 'Lifecycle Project', clientName: 'Client', description: 'Initial', status: 'active' })
      .expect(201);
    const projectId = project.body.data._id;

    await request(ctx.app)
      .put(`/api/projects/${projectId}`)
      .set(auth(account.accessToken))
      .send({ status: 'completed' })
      .expect(200);

    const meeting = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({ title: 'Lifecycle Meeting', notes: 'Build auth and dashboard', date: new Date().toISOString(), projectId })
      .expect(201);
    const meetingId = meeting.body.data._id;

    await request(ctx.app)
      .put(`/api/meetings/${meetingId}`)
      .set(auth(account.accessToken))
      .send({ title: 'Updated Lifecycle Meeting' })
      .expect(200);

    const task = await request(ctx.app)
      .post('/api/tasks')
      .set(auth(account.accessToken))
      .send({ title: 'Lifecycle Task', priority: 'High', projectId, meetingId })
      .expect(201);
    const taskId = task.body.data._id;

    await request(ctx.app).patch(`/api/tasks/${taskId}/complete`).set(auth(account.accessToken)).expect(200);
    await request(ctx.app).delete(`/api/tasks/${taskId}`).set(auth(account.accessToken)).expect(200);
    await request(ctx.app).delete(`/api/meetings/${meetingId}`).set(auth(account.accessToken)).expect(200);
    await request(ctx.app).delete(`/api/projects/${projectId}`).set(auth(account.accessToken)).expect(200);
  });

  it('enforces workspace isolation on projects, meetings, tasks, files, and activity', async () => {
    const userA = await signup(ctx.app, 'tenant-a');
    const userB = await signup(ctx.app, 'tenant-b');

    const project = await request(ctx.app)
      .post('/api/projects')
      .set(auth(userA.accessToken))
      .send({ name: 'Tenant A Project' })
      .expect(201);
    const projectId = project.body.data._id;

    const meeting = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userA.accessToken))
      .send({ title: 'Tenant A Meeting', date: new Date().toISOString(), projectId })
      .expect(201);
    const meetingId = meeting.body.data._id;

    const task = await request(ctx.app)
      .post('/api/tasks')
      .set(auth(userA.accessToken))
      .send({ title: 'Tenant A Task', meetingId, priority: 'Medium' })
      .expect(201);
    const taskId = task.body.data._id;

    expect((await request(ctx.app).get(`/api/projects/${projectId}`).set(auth(userB.accessToken)).expect(200)).body.data).toBeNull();
    expect((await request(ctx.app).get(`/api/meetings/${meetingId}`).set(auth(userB.accessToken)).expect(200)).body.data).toBeNull();
    expect((await request(ctx.app).get(`/api/tasks/${taskId}`).set(auth(userB.accessToken)).expect(200)).body.data).toBeNull();

    const file = createTempFile('tenant-file.txt', 'hello from tenant A');
    try {
      const uploaded = await request(ctx.app)
        .post('/api/files/upload')
        .set(auth(userA.accessToken))
        .field('projectId', projectId)
        .attach('file', file.path)
        .expect(201);
      const fileId = uploaded.body.file._id;

      const filesForB = await request(ctx.app)
        .get(`/api/files/project/${projectId}`)
        .set(auth(userB.accessToken))
        .expect(200);
      expect(filesForB.body.files).toEqual([]);

      await request(ctx.app).get(`/api/files/${fileId}/download`).set(auth(userB.accessToken)).expect(403);
      await request(ctx.app).delete(`/api/files/${fileId}`).set(auth(userB.accessToken)).expect(403);
    } finally {
      file.cleanup();
    }

    const activityB = await request(ctx.app).get('/api/activity-logs').set(auth(userB.accessToken)).expect(200);
    expect(activityB.body.data.items.some((item: any) => item.meta?.projectId === projectId)).toBe(false);
  });

  it('rejects cross-workspace project and meeting references', async () => {
    const userA = await signup(ctx.app, 'tenant-links-a');
    const userB = await signup(ctx.app, 'tenant-links-b');

    const projectA = await request(ctx.app)
      .post('/api/projects')
      .set(auth(userA.accessToken))
      .send({ name: 'Tenant A Linked Project' })
      .expect(201);
    const projectAId = projectA.body.data._id;

    const meetingA = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userA.accessToken))
      .send({ title: 'Tenant A Linked Meeting', date: new Date().toISOString(), projectId: projectAId })
      .expect(201);
    const meetingAId = meetingA.body.data._id;

    await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userB.accessToken))
      .send({ title: 'Cross-linked Meeting', date: new Date().toISOString(), projectId: projectAId })
      .expect(403);

    await request(ctx.app)
      .post('/api/tasks')
      .set(auth(userB.accessToken))
      .send({ title: 'Cross-linked Task', projectId: projectAId, meetingId: meetingAId })
      .expect(403);

    const projectB = await request(ctx.app)
      .post('/api/projects')
      .set(auth(userB.accessToken))
      .send({ name: 'Tenant B Project' })
      .expect(201);
    const projectBId = projectB.body.data._id;

    const meetingB = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(userB.accessToken))
      .send({ title: 'Tenant B Meeting', date: new Date().toISOString(), projectId: projectBId })
      .expect(201);
    const meetingBId = meetingB.body.data._id;

    const taskB = await request(ctx.app)
      .post('/api/tasks')
      .set(auth(userB.accessToken))
      .send({ title: 'Tenant B Task', projectId: projectBId, meetingId: meetingBId })
      .expect(201);
    const taskBId = taskB.body.data._id;

    await request(ctx.app)
      .put(`/api/meetings/${meetingBId}`)
      .set(auth(userB.accessToken))
      .send({ projectId: projectAId })
      .expect(403);

    await request(ctx.app)
      .put(`/api/tasks/${taskBId}`)
      .set(auth(userB.accessToken))
      .send({ projectId: projectAId, meetingId: meetingAId })
      .expect(403);

    const file = createTempFile('cross-workspace-file.txt', 'should not attach to tenant A project');
    try {
      await request(ctx.app)
        .post('/api/files/upload')
        .set(auth(userB.accessToken))
        .field('projectId', projectAId)
        .attach('file', file.path)
        .expect(403);
    } finally {
      file.cleanup();
    }
  });
});
