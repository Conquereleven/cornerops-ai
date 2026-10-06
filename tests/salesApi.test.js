process.env.NODE_ENV = 'test';

const request = require('supertest');
const { USERS, authed, installTestAppAuth } = require('./helpers/appAuth');
const app = require('../src/app');
const sales = require('../src/core/sales');
const logger = require('../src/utils/logger');

const SYNTHETIC = { name: 'Ana Ejemplo', email: 'ana.ejemplo@example.test', phone: '+000 000 0000' };

describe('Sales MVP API', () => {
  let store; let founder; let operator; let viewer;
  beforeEach(() => {
    installTestAppAuth();
    store = new sales.MemorySalesStore();
    sales.setSalesService(new sales.SalesService({ store }));
    founder = authed(app, 'founder'); operator = authed(app, 'operator'); viewer = authed(app, 'viewer');
  });
  afterAll(() => sales.setSalesService(undefined));

  const createAccount = async (client = operator, body = { name: 'Example Trading LLC' }) => (await client.post('/api/app/sales/accounts').send(body).expect(201)).body;

  test('empty workspace returns truthful empty state with no invented value', async () => {
    const summary = (await viewer.get('/api/app/sales/summary').expect(200)).body;
    expect(summary).toMatchObject({ accounts: { total: 0 }, opportunities: { total: 0, open: 0 }, nextActionsDue: [], needingFollowUp: [], pipelineValue: [] });
    expect((await viewer.get('/api/app/sales/accounts').expect(200)).body).toEqual({ accounts: [] });
  });

  test('records an account, contact, opportunity and activity, then reads the detail', async () => {
    const account = await createAccount(operator, { name: 'Example Trading LLC', segment: 'Distribution', priority: 'high', fitScore: 80, problemHypothesis: 'Manual order intake' });
    expect(account).toMatchObject({ name: 'Example Trading LLC', status: 'prospect', createdBy: USERS.operator, updatedBy: USERS.operator });
    expect(account.workspaceId).toBeUndefined();

    const contact = (await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).send({ ...SYNTHETIC, isPrimary: true, contactConfidence: 'likely' }).expect(201)).body;
    const opportunity = (await operator.post(`/api/app/sales/accounts/${account.id}/opportunities`).send({ stage: 'contacted', nextStep: 'Send discovery questions', nextStepAt: '2020-01-01T09:00:00Z' }).expect(201)).body;
    expect(opportunity.estimatedValue ?? null).toBeNull();
    const activity = (await operator.post(`/api/app/sales/accounts/${account.id}/activities`).send({ type: 'email', direction: 'outbound', outcome: 'Intro sent', externalRef: 'gmail-thread:abc123', contactId: contact.id, opportunityId: opportunity.id }).expect(201)).body;
    expect(activity).toMatchObject({ type: 'email', createdBy: USERS.operator });

    const detail = (await viewer.get(`/api/app/sales/accounts/${account.id}`).expect(200)).body;
    expect(detail.contacts).toHaveLength(1);
    expect(detail.opportunities).toHaveLength(1);
    expect(detail.activities).toHaveLength(1);

    const [row] = (await viewer.get('/api/app/sales/accounts').expect(200)).body.accounts;
    expect(row).toMatchObject({
      primaryContact: { name: SYNTHETIC.name }, latestActivity: { type: 'email' },
      nextStep: { text: 'Send discovery questions', stage: 'contacted' }, openOpportunities: 1,
    });
    expect(JSON.stringify(row)).not.toContain(SYNTHETIC.email);

    const summary = (await viewer.get('/api/app/sales/summary').expect(200)).body;
    expect(summary.opportunities.byStage.contacted).toBe(1);
    expect(summary.nextActionsDue).toHaveLength(1);
    expect(summary.pipelineValue).toEqual([]);
    expect(summary.valueCoverage).toEqual({ withValue: 0, withoutValue: 1 });
  });

  test('updates the next step and keeps a single primary contact', async () => {
    const account = await createAccount();
    const opportunity = (await operator.post(`/api/app/sales/accounts/${account.id}/opportunities`).send({}).expect(201)).body;
    const updated = (await operator.patch(`/api/app/sales/opportunities/${opportunity.id}`).send({ nextStep: 'Book discovery call', stage: 'engaged' }).expect(200)).body;
    expect(updated).toMatchObject({ nextStep: 'Book discovery call', stage: 'engaged', updatedBy: USERS.operator });

    const first = (await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).send({ name: 'First Example', isPrimary: true }).expect(201)).body;
    const second = (await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).send({ name: 'Second Example', isPrimary: true }).expect(201)).body;
    const { contacts } = (await viewer.get(`/api/app/sales/accounts/${account.id}`).expect(200)).body;
    expect(contacts.filter((contact) => contact.isPrimary).map((contact) => contact.id)).toEqual([second.id]);
    await operator.patch(`/api/app/sales/contacts/${first.id}`).send({ isPrimary: true }).expect(200);
    const after = (await viewer.get(`/api/app/sales/accounts/${account.id}`).expect(200)).body.contacts;
    expect(after.filter((contact) => contact.isPrimary).map((contact) => contact.id)).toEqual([first.id]);
  });

  test('pipeline value is only what was entered, grouped by currency', async () => {
    const account = await createAccount();
    await operator.post(`/api/app/sales/accounts/${account.id}/opportunities`).send({ estimatedValue: 12000, currency: 'AED' }).expect(201);
    await operator.post(`/api/app/sales/accounts/${account.id}/opportunities`).send({ estimatedValue: 500.5, currency: 'USD' }).expect(201);
    await operator.post(`/api/app/sales/accounts/${account.id}/opportunities`).send({ stage: 'discovery' }).expect(201);
    await operator.post(`/api/app/sales/accounts/${account.id}/opportunities`).send({ stage: 'won', estimatedValue: 9999, currency: 'AED' }).expect(201);
    const summary = (await viewer.get('/api/app/sales/summary').expect(200)).body;
    expect(summary.pipelineValue).toEqual([{ currency: 'AED', total: 12000, opportunities: 1 }, { currency: 'USD', total: 500.5, opportunities: 1 }]);
    expect(summary.valueCoverage).toEqual({ withValue: 2, withoutValue: 1 });
  });

  test('rejects invalid stage, unknown fields, server-owned fields and value without currency', async () => {
    const account = await createAccount();
    const invalid = async (path, body, field, method = 'post') => {
      const response = await operator[method](path).send(body);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('SALES_VALIDATION_FAILED');
      expect(Object.keys(response.body.fields)).toContain(field);
      return response;
    };
    await invalid(`/api/app/sales/accounts/${account.id}/opportunities`, { stage: 'closing' }, 'stage');
    await invalid(`/api/app/sales/accounts/${account.id}/opportunities`, { estimatedValue: 100 }, 'currency');
    await invalid(`/api/app/sales/accounts/${account.id}/opportunities`, { estimatedValue: -1, currency: 'AED' }, 'estimatedValue');
    await invalid('/api/app/sales/accounts', {}, 'name');
    await invalid('/api/app/sales/accounts', { name: 'x', workspaceId: 'other' }, 'workspaceId');
    await invalid('/api/app/sales/accounts', { name: 'x', createdBy: USERS.founder }, 'createdBy');
    await invalid('/api/app/sales/accounts', { name: 'x', fitScore: 101 }, 'fitScore');
    await invalid(`/api/app/sales/accounts/${account.id}/activities`, { type: 'sms' }, 'type');
    await invalid(`/api/app/sales/accounts/${account.id}`, {}, 'body', 'patch');
    const response = await invalid(`/api/app/sales/accounts/${account.id}/contacts`, { name: 'x', email: 'not-an-email-value' }, 'email');
    expect(JSON.stringify(response.body)).not.toContain('not-an-email-value');
  });

  test('viewer cannot write; anonymous cannot read or write', async () => {
    const account = await createAccount();
    expect((await viewer.post('/api/app/sales/accounts').send({ name: 'x' })).statusCode).toBe(403);
    expect((await viewer.patch(`/api/app/sales/accounts/${account.id}`).send({ name: 'y' })).statusCode).toBe(403);
    expect((await viewer.post(`/api/app/sales/accounts/${account.id}/activities`).send({ type: 'note' })).statusCode).toBe(403);
    expect((await request(app).get('/api/app/sales/accounts')).statusCode).toBe(401);
    expect((await request(app).post('/api/app/sales/accounts').send({ name: 'x' })).statusCode).toBe(401);
    expect((await authed(app, 'outsider').get('/api/app/sales/accounts')).statusCode).toBe(403);
  });

  test('workspace isolation: another workspace cannot see, edit or attach to records', async () => {
    const account = await createAccount(founder);
    const contact = (await founder.post(`/api/app/sales/accounts/${account.id}/contacts`).send(SYNTHETIC).expect(201)).body;
    const other = authed(app, 'other');
    expect((await other.get('/api/app/sales/accounts').expect(200)).body.accounts).toEqual([]);
    expect((await other.get('/api/app/sales/summary').expect(200)).body.accounts.total).toBe(0);
    await other.get(`/api/app/sales/accounts/${account.id}`).expect(404);
    await other.patch(`/api/app/sales/accounts/${account.id}`).send({ name: 'Hijacked' }).expect(404);
    await other.patch(`/api/app/sales/contacts/${contact.id}`).send({ name: 'Hijacked' }).expect(404);
    await other.post(`/api/app/sales/accounts/${account.id}/contacts`).send({ name: 'Planted' }).expect(404);
    await other.post(`/api/app/sales/accounts/${account.id}/activities`).send({ type: 'note' }).expect(404);
    // The founder of workspace A cannot reach into workspace B by header either.
    await founder.get('/api/app/sales/accounts').set('x-cornerops-workspace', 'other-workspace').expect(403);

    const foreign = (await other.post('/api/app/sales/accounts').send({ name: 'Other Co' }).expect(201)).body;
    const foreignContact = (await other.post(`/api/app/sales/accounts/${foreign.id}/contacts`).send({ name: 'Foreign Contact' }).expect(201)).body;
    await founder.post(`/api/app/sales/accounts/${account.id}/activities`).send({ type: 'note', contactId: foreignContact.id }).expect(404);
    expect((await founder.get(`/api/app/sales/accounts/${account.id}`).expect(200)).body.account.name).toBe('Example Trading LLC');
  });

  test('a contact from another account in the same workspace cannot be linked', async () => {
    const first = await createAccount(); const second = await createAccount(operator, { name: 'Second Example Co' });
    const contact = (await operator.post(`/api/app/sales/accounts/${second.id}/contacts`).send({ name: 'Elsewhere' }).expect(201)).body;
    await operator.post(`/api/app/sales/accounts/${first.id}/activities`).send({ type: 'call', contactId: contact.id }).expect(404);
  });

  test('malformed ids are a 404, not an error', async () => {
    await viewer.get('/api/app/sales/accounts/not-a-uuid').expect(404);
    await operator.patch('/api/app/sales/opportunities/1%27%20or%201=1').send({ stage: 'won' }).expect(404);
  });

  test('every mutation is audited with ids and field names but no contact data', async () => {
    const account = await createAccount();
    await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).send(SYNTHETIC).expect(201);
    await operator.patch(`/api/app/sales/accounts/${account.id}`).send({ priority: 'low' }).expect(200);
    const events = store.state.auditEvents;
    expect(events.map((event) => event.eventType)).toEqual(['sales_account_created', 'sales_contact_created', 'sales_account_updated']);
    for (const event of events) {
      expect(event).toMatchObject({ actorType: 'user', actorId: USERS.operator, metadata: { result: 'success', externalSendPerformed: false, accountId: account.id } });
      expect(event.metadata.workspaceId).toEqual(expect.any(String));
    }
    expect(events[1].metadata.fields).toEqual(['email', 'name', 'phone']);
    const serialized = JSON.stringify(events);
    for (const value of Object.values(SYNTHETIC)) expect(serialized).not.toContain(value);
  });

  test('a failed write leaves no partial record and no audit event', async () => {
    const account = await createAccount();
    const before = structuredClone(store.state);
    await operator.post(`/api/app/sales/accounts/${account.id}/activities`).send({ type: 'note', contactId: '99999999-9999-4999-8999-999999999999' }).expect(404);
    expect(store.state).toEqual(before);
  });

  test('contact data never reaches request logs', async () => {
    const lines = [];
    const spies = ['info', 'warn', 'error'].map((level) => jest.spyOn(logger, level).mockImplementation((...args) => lines.push(JSON.stringify(args))));
    const account = await createAccount();
    await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).send(SYNTHETIC).expect(201);
    await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).send({ ...SYNTHETIC, email: 'bad-value-for-email' }).expect(400);
    await operator.post(`/api/app/sales/accounts/${account.id}/contacts`).set('Content-Type', 'application/json').send(`{"email":"${SYNTHETIC.email}",`).expect(400);
    spies.forEach((spy) => spy.mockRestore());
    const output = lines.join('\n');
    for (const value of [...Object.values(SYNTHETIC), 'bad-value-for-email']) expect(output).not.toContain(value);
  });

  test('sales has no send capability and performs no outbound request', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => { throw new Error('outbound call attempted'); });
    const account = await createAccount();
    for (const type of ['email', 'whatsapp', 'linkedin', 'call', 'meeting', 'note']) {
      await operator.post(`/api/app/sales/accounts/${account.id}/activities`).send({ type, direction: 'outbound', notes: 'logged only' }).expect(201);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    const { listRoutes } = require('../src/api/routeInventory');
    const paths = listRoutes(app).filter((route) => route.path.startsWith('/api/app/sales')).map((route) => `${route.method} ${route.path}`);
    expect(paths.filter((path) => /send|outreach|dispatch|deliver|schedule|campaign/i.test(path))).toEqual([]);
    expect(paths.some((path) => path.startsWith('DELETE'))).toBe(false);
  });

  test('persistence unavailable fails closed', async () => {
    sales.setSalesService(new sales.SalesService({ store: new sales.UnavailableSalesStore() }));
    expect((await viewer.get('/api/app/sales/accounts')).statusCode).toBe(503);
    expect((await operator.post('/api/app/sales/accounts').send({ name: 'x' })).statusCode).toBe(503);
  });

  test('CSV preview validates without writing and without echoing values', async () => {
    const csv = [
      'Company,Website,Priority,Contact Name,Email,Stage,Estimated Value,Currency,Notes',
      'Example Trading LLC,https://example.test,High,Ana Ejemplo,ana.ejemplo@example.test,Contacted,,,first',
      'Example Trading LLC,,,"Second, Person",second@example.test,,,,dup account',
      'Broken Co,,urgent,No Email,not-an-email,closing,100,,bad row',
      ',,,,,,,,',
    ].join('\n');
    const preview = (await operator.post('/api/app/sales/import/preview').send({ csv }).expect(200)).body;
    expect(preview).toMatchObject({ writesPerformed: false, rows: 3, wouldCreate: { accounts: 1, contacts: 2, opportunities: 1 }, unmappedColumns: ['Notes'] });
    expect(preview.rejected).toEqual([{ row: 4, errors: expect.objectContaining({ 'account.priority': expect.any(String), 'contact.email': expect.any(String), 'opportunity.stage': expect.any(String) }) }]);
    expect(JSON.stringify(preview)).not.toContain('example.test');
    expect(store.state.rows.sales_accounts).toHaveLength(0);
    expect((await viewer.post('/api/app/sales/import/preview').send({ csv })).statusCode).toBe(403);
  });
});
