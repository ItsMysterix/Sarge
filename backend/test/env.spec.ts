import { describe, it, expect, vi, beforeEach } from 'vitest';

// We are testing the env module itself, so we should not mock it.
// The issue is with how process.env and module caching interact.
// The correct approach is to ensure process.env is pristine for each test
// and that the module is re-evaluated.

describe('Backend Environment Validation', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Reset modules to ensure env.ts is re-evaluated
    vi.resetModules();
    // Restore original environment, then we can manipulate it for each test
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'test' };
  });

  it('should parse a valid DATABASE_URL', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    const { ENV } = await import('../src/env');
    expect(ENV.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
  });

  it('should throw an error if DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    // The module throws on parse, so the dynamic import will reject
    await expect(import('../src/env')).rejects.toThrow();
  });

  it('should use the default value for WS_PORT when it is not provided', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    delete process.env.WS_PORT;
    const { ENV } = await import('../src/env');
    expect(ENV.WS_PORT).toBe(3001);
  });

  it('should correctly parse a provided WS_PORT', async () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.WS_PORT = '8080';
    const { ENV } = await import('../src/env');
    expect(ENV.WS_PORT).toBe(8080);
  });
});
