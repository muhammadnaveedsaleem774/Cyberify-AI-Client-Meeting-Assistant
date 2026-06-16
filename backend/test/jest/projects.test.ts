import request from 'supertest';
import { auth, createTestApp, signup, TestAppContext } from './helpers/testApp';

describe('projects module', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('requires authentication and validates required project fields', async () => {
    const account = await signup(ctx.app, 'projects-validation');

    await request(ctx.app)
      .get('/api/projects')
      .expect(401);

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({})
      .expect(400);

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({ name: '' })
      .expect(400);
  });

  it('supports project CRUD with name, clientName, description, and status', async () => {
    const account = await signup(ctx.app, 'projects-crud');

    const created = await request(ctx.app)
      .post('/api/projects')
      .set(auth(account.accessToken))
      .send({
        name: 'Client Portal',
        clientName: 'Acme Corp',
        description: 'Self-service client portal',
        status: 'active'
      })
      .expect(201);

    const projectId = created.body.data._id;
    expect(created.body.data.name).toBe('Client Portal');
    expect(created.body.data.clientName).toBe('Acme Corp');
    expect(created.body.data.description).toBe('Self-service client portal');
    expect(created.body.data.status).toBe('active');

    const fetched = await request(ctx.app)
      .get(`/api/projects/${projectId}`)
      .set(auth(account.accessToken))
      .expect(200);

    expect(fetched.body.data._id).toBe(projectId);

    const updated = await request(ctx.app)
      .put(`/api/projects/${projectId}`)
      .set(auth(account.accessToken))
      .send({
        clientName: 'Acme International',
        description: 'Updated delivery scope',
        status: 'completed'
      })
      .expect(200);

    expect(updated.body.data.clientName).toBe('Acme International');
    expect(updated.body.data.description).toBe('Updated delivery scope');
    expect(updated.body.data.status).toBe('completed');

    await request(ctx.app)
      .delete(`/api/projects/${projectId}`)
      .set(auth(account.accessToken))
      .expect(200);

    const afterDelete = await request(ctx.app)
      .get(`/api/projects/${projectId}`)
      .set(auth(account.accessToken))
      .expect(200);

    expect(afterDelete.body.data).toBeNull();
  });

  it('supports search plus status and date filters inside the current workspace only', async () => {
    const userA = await signup(ctx.app, 'projects-filter-a');
    const userB = await signup(ctx.app, 'projects-filter-b');

    const alpha = await request(ctx.app)
      .post('/api/projects')
      .set(auth(userA.accessToken))
      .send({
        name: 'Alpha Mobile App',
        clientName: 'Northwind',
        description: 'React Native client application',
        status: 'active'
      })
      .expect(201);

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(userA.accessToken))
      .send({
        name: 'Beta Admin Portal',
        clientName: 'Contoso',
        description: 'Internal dashboard and reports',
        status: 'completed'
      })
      .expect(201);

    await request(ctx.app)
      .post('/api/projects')
      .set(auth(userB.accessToken))
      .send({
        name: 'Alpha Foreign Workspace',
        clientName: 'Other Tenant',
        description: 'Should never appear for user A',
        status: 'active'
      })
      .expect(201);

    const searchByName = await request(ctx.app)
      .get('/api/projects?q=alpha')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(searchByName.body.data).toHaveLength(1);
    expect(searchByName.body.data[0]._id).toBe(alpha.body.data._id);

    const searchByClient = await request(ctx.app)
      .get('/api/projects?q=contoso')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(searchByClient.body.data).toHaveLength(1);
    expect(searchByClient.body.data[0].name).toBe('Beta Admin Portal');

    const activeOnly = await request(ctx.app)
      .get('/api/projects?status=active')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(activeOnly.body.data).toHaveLength(1);
    expect(activeOnly.body.data[0].name).toBe('Alpha Mobile App');

    const today = new Date().toISOString().slice(0, 10);
    const dateFiltered = await request(ctx.app)
      .get(`/api/projects?dateFrom=${today}&dateTo=${today}`)
      .set(auth(userA.accessToken))
      .expect(200);

    expect(dateFiltered.body.data.map((project: any) => project.name).sort()).toEqual([
      'Alpha Mobile App',
      'Beta Admin Portal'
    ]);

    const futureFiltered = await request(ctx.app)
      .get('/api/projects?dateFrom=2999-01-01')
      .set(auth(userA.accessToken))
      .expect(200);

    expect(futureFiltered.body.data).toHaveLength(0);
  });
});
