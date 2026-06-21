jest.mock('../middleware/requireAuth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  },
}));

jest.mock('../services/aiInsightsService', () => ({
  generateTips: jest.fn().mockResolvedValue([
    'Mock tip 1',
    'Mock tip 2',
    'Mock tip 3',
    'Mock tip 4',
  ]),
}));

jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'mock-snapshot-id' },
            error: null,
          }),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      })),
    })),
  },
}));

const request = require('supertest');
const app = require('../index');

const VALID_INPUT = {
  commuteMode: 'bus',
  weeklyCommuteKm: 60,
  dietType: 'vegetarian',
  monthlyElectricityKwh: 150,
  domesticFlightsPerYear: 1,
  internationalFlightsPerYear: 0,
};

describe('POST /api/footprint/calculate', () => {
  test('returns breakdown, total, comparison, and tips for valid input', async () => {
    const res = await request(app)
      .post('/api/footprint/calculate')
      .send(VALID_INPUT);

    expect(res.status).toBe(200);
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.totalMonthlyKgCo2).toBeGreaterThanOrEqual(0);
    expect(res.body.tips).toHaveLength(4);
  });

  test('rejects invalid commuteMode with 400', async () => {
    const res = await request(app)
      .post('/api/footprint/calculate')
      .send({ ...VALID_INPUT, commuteMode: 'teleport' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('rejects negative weeklyCommuteKm with 400', async () => {
    const res = await request(app)
      .post('/api/footprint/calculate')
      .send({ ...VALID_INPUT, weeklyCommuteKm: -10 });

    expect(res.status).toBe(400);
  });

  test('rejects missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/footprint/calculate')
      .send({ commuteMode: 'bus' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/footprint/save', () => {
  test('saves a valid snapshot and returns 201', async () => {
    const res = await request(app)
      .post('/api/footprint/save')
      .send({ input: VALID_INPUT });

    expect(res.status).toBe(201);
    expect(res.body.snapshot).toBeDefined();
  });

  test('rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/api/footprint/save')
      .send({ input: { ...VALID_INPUT, dietType: 'carnivore-extreme' } });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/footprint/history', () => {
  test('returns an array of snapshots', async () => {
    const res = await request(app).get('/api/footprint/history');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.snapshots)).toBe(true);
  });
});

describe('GET /api/health', () => {
  test('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Unmatched route', () => {
  test('returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
