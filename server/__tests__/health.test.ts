import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/v1/health', () => {
  it('returns 200 with a success envelope', async () => {
    const res = await request(createApp('http://localhost:3000')).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});

describe('error handling', () => {
  it('returns a failed envelope for unknown routes', async () => {
    const res = await request(createApp('http://localhost:3000')).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('failed');
  });
});
