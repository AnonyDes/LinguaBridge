import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiKeyService } from '../services/api-key-service';

afterEach(() => vi.unstubAllEnvs());

describe('environment extension key', () => {
  it('persists across service instances with translation scopes only', () => {
    vi.stubEnv('API_KEY', 'lb_admin_test_secret_123456789');
    vi.stubEnv('EXTENSION_API_KEY', 'lb_extension_test_secret_123456789');
    const first = new ApiKeyService().validateKey('lb_extension_test_secret_123456789');
    const second = new ApiKeyService().validateKey('lb_extension_test_secret_123456789');
    expect(first.valid).toBe(true);
    expect(second.valid).toBe(true);
    expect(first.key?.permissions).toContain('translate:batch');
    expect(first.key?.permissions).not.toContain('admin');
    expect(first.key?.permissions).not.toContain('*');
  });

  it('does not turn an admin or demo key into a browser key', () => {
    vi.stubEnv('API_KEY', 'lb_admin_test_secret_123456789');
    vi.stubEnv('EXTENSION_API_KEY', 'lb_admin_test_secret_123456789');
    expect(new ApiKeyService().listKeys().some((key) => key.id === 'env-extension-key')).toBe(false);
    vi.stubEnv('EXTENSION_API_KEY', 'lb_demo_key_2026');
    expect(new ApiKeyService().listKeys().some((key) => key.id === 'env-extension-key')).toBe(false);
  });
});
