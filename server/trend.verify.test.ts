import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('Trend Verification API', () => {
  it('should return success response with viral data', async () => {
    const caller = appRouter.createCaller({} as any);
    
    const result = await caller.trend.verify({
      trackUrl: 'https://open.spotify.com/track/test123'
    });
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('isViral');
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('trackUrl');
    expect(result.data).toHaveProperty('velocityPercent');
    expect(result.data).toHaveProperty('platform');
    expect(result.data).toHaveProperty('message');
    expect(result.success).toBe(true);
  });

  it('should handle track URL input correctly', async () => {
    const caller = appRouter.createCaller({} as any);
    const testUrl = 'https://open.spotify.com/track/abc123';
    
    const result = await caller.trend.verify({
      trackUrl: testUrl
    });
    
    expect(result.data.trackUrl).toBe(testUrl);
  });

  it('should return velocity percentage within expected range', async () => {
    const caller = appRouter.createCaller({} as any);
    
    const result = await caller.trend.verify({
      trackUrl: 'https://open.spotify.com/track/test'
    });
    
    expect(result.data.velocityPercent).toBeGreaterThanOrEqual(0);
    expect(result.data.velocityPercent).toBeLessThanOrEqual(200);
  });
});
