import request from 'supertest';
import { createTestApp, signup, auth, TestAppContext } from './helpers/testApp';
import { analyzeWithProvider } from '../../src/providers/ai';
import { extractJsonObject, validateAnalysisResult } from '../../src/providers/ai/aiUtils';

jest.mock('../../src/providers/ai', () => ({
  analyzeWithProvider: jest.fn()
}));

const mockedAnalyze = analyzeWithProvider as jest.MockedFunction<typeof analyzeWithProvider>;

describe('ai analysis', () => {
  let ctx: TestAppContext;

  beforeEach(async () => {
    ctx = await createTestApp();
  });

  afterEach(async () => {
    await ctx.close();
  });

  it('validates AI output, confirms workflow, saves analysis, and creates reviewed tasks', async () => {
    mockedAnalyze.mockResolvedValueOnce({
      summary: 'A marketplace platform for vehicle buyers and sellers.',
      functionalRequirements: ['Sellers can list cars', 'Buyers can purchase cars'],
      userRoles: ['Admin', 'Seller', 'Buyer'],
      entities: ['User', 'Car', 'Order'],
      timeline: ['Week 1: Authentication', 'Week 2: Marketplace module'],
      tasks: [
        { title: 'Sellers can list cars', description: 'Sellers can list cars' },
        { title: 'Buyers can purchase cars', description: 'Buyers can purchase cars' }
      ],
      risks: ['Payment gateway is not specified'],
      riskAnalysis: {
        missingRequirements: ['Payment gateway is not specified'],
        ambiguousRequirements: [],
        potentialRisks: []
      }
    });

    const account = await signup(ctx.app, 'ai-valid');
    const draft = await request(ctx.app)
      .post('/api/ai/analyze-notes')
      .set(auth(account.accessToken))
      .send({ title: 'AI Meeting', date: new Date().toISOString(), notes: 'Need car marketplace' })
      .expect(200);

    expect(draft.body.data.summary).toContain('marketplace');
    expect(draft.body.data.functionalRequirements).toEqual(['Sellers can list cars', 'Buyers can purchase cars']);
    expect(draft.body.data.userRoles).toEqual(['Admin', 'Seller', 'Buyer']);
    expect(draft.body.data.entities).toEqual(['User', 'Car', 'Order']);
    expect(draft.body.data.timeline).toEqual(['Week 1: Authentication', 'Week 2: Marketplace module']);
    expect(draft.body.data.risks).toEqual(['Payment gateway is not specified']);
    expect(draft.body.data.riskAnalysis.missingRequirements).toEqual(['Payment gateway is not specified']);
    expect(draft.body.data.riskAnalysis.ambiguousRequirements).toEqual([]);
    expect(draft.body.data.riskAnalysis.potentialRisks).toEqual([]);

    const confirmed = await request(ctx.app)
      .post('/api/ai/confirm-analysis')
      .set(auth(account.accessToken))
      .send({
        title: 'AI Meeting',
        date: new Date().toISOString(),
        notes: 'Need car marketplace',
        newProject: { name: 'AI Marketplace Project' },
        analysis: {
          ...draft.body.data,
          tasks: draft.body.data.tasks.map((task: any) => ({ ...task, priority: 'High' }))
        }
      })
      .expect(201);

    expect(confirmed.body.data.meeting._id).toBeTruthy();
    expect(confirmed.body.data.analysis.summary).toContain('marketplace');
    expect(confirmed.body.data.analysis.riskAnalysis.missingRequirements).toEqual(['Payment gateway is not specified']);
    expect(confirmed.body.data.tasks).toHaveLength(2);

    const tasks = await request(ctx.app).get('/api/tasks').set(auth(account.accessToken)).expect(200);
    expect(tasks.body.data).toHaveLength(2);
    expect(tasks.body.data.every((task: any) => task.priority === 'High')).toBe(true);
  });

  it('returns structured error when AI provider returns invalid output', async () => {
    mockedAnalyze.mockRejectedValueOnce({ status: 502, message: 'AI provider returned invalid JSON' });

    const account = await signup(ctx.app, 'ai-invalid');
    const meeting = await request(ctx.app)
      .post('/api/meetings')
      .set(auth(account.accessToken))
      .send({ title: 'Bad AI Meeting', date: new Date().toISOString(), notes: 'Invalid AI response case' })
      .expect(201);

    const res = await request(ctx.app)
      .post('/api/ai/analyze-meeting')
      .set(auth(account.accessToken))
      .send({ meetingId: meeting.body.data._id })
      .expect(502);

    expect(res.body.ok).toBe(false);
    expect(res.body.message).toBe('AI provider returned invalid JSON');
  });

  it('normalizes legacy and object-heavy AI response shapes', () => {
    const raw = extractJsonObject(JSON.stringify({
      summary: 'Legacy shape',
      requirements: ['Build auth'],
      roles: ['Admin'],
      entities: [{ name: 'User', fields: ['email', 'passwordHash'] }],
      timeline: [{ phase: 'MVP', duration: '2 weeks' }],
      risks: [{ title: 'Missing payment details' }]
    }));

    const normalized = validateAnalysisResult(raw);
    expect(normalized.functionalRequirements).toEqual(['Build auth']);
    expect(normalized.userRoles).toEqual(['Admin']);
    expect(normalized.entities[0]).toContain('User');
    expect(normalized.timeline[0]).toContain('MVP');
    expect(normalized.risks[0]).toContain('Missing payment details');
    expect(normalized.riskAnalysis.potentialRisks[0]).toContain('Missing payment details');
    expect(normalized.tasks[0].title).toBe('Build auth');
  });
});
