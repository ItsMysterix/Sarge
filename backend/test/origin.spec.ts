import { describe, expect, test } from 'vitest';
import { isAllowedOrigin } from '../src/ws/origin';

describe('isAllowedOrigin', () => {
  test('allows localhost when no allowlist', () => {
    expect(isAllowedOrigin('http://localhost')).toBe(true);
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedOrigin('https://127.0.0.1:8443')).toBe(true);
  });

  test('blocks evil origin when no allowlist', () => {
    expect(isAllowedOrigin('http://evil.example.com')).toBe(false);
  });

  test('respects allowlist exact/prefix matches', () => {
    const allow = ['https://app.example.com', 'https://staging.example.com'];
    expect(isAllowedOrigin('https://app.example.com', allow)).toBe(true);
    expect(isAllowedOrigin('https://app.example.com:443', allow)).toBe(true);
    expect(isAllowedOrigin('https://staging.example.com/foo', allow)).toBe(true);
    expect(isAllowedOrigin('https://other.example.com', allow)).toBe(false);
  });
});
