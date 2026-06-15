process.env.NODE_ENV = 'test';

const { handle } = require('../src/services/workers/b2bWorker');

describe('b2bWorker', () => {
  test('captures a progressive lead and reports missing fields', async () => {
    const result = await handle({
      userId: 'lead-test',
      message: 'Tengo un restaurante en Dubai y quiero Tajín al mayoreo',
    });
    expect(result.metadata.leadId).toMatch(/^lead-/);
    expect(result.metadata.missingFields).toContain('email');
    expect(result.reply).toContain('Registré');
  });

  test('qualifies a complete bilingual lead', async () => {
    const result = await handle({
      userId: `lead-complete-${Date.now()}`,
      language: 'en',
      message:
        'My name is John Smith, restaurant name is Taco House in Dubai. I need 20 boxes of Tajin per month. john@tacohouse.example',
    });
    expect(result.metadata.leadCaptured).toBe(true);
    expect(result.metadata.status).toBe('qualified');
    expect(result.metadata.requestedProducts).toContain('Tajín');
  });
});
