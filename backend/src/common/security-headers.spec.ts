import { applySecurityHeaders, isSwaggerPath } from './security-headers';

describe('security headers', () => {
  function createResponseRecorder() {
    const headers: Record<string, string> = {};

    return {
      headers,
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
    };
  }

  it('detects swagger paths', () => {
    expect(isSwaggerPath('/api/docs')).toBe(true);
    expect(isSwaggerPath('/api/docs/index.html')).toBe(true);
    expect(isSwaggerPath('/api/users')).toBe(false);
  });

  it('applies security headers to non-swagger routes', () => {
    const response = createResponseRecorder();

    applySecurityHeaders(response, '/auth/me');

    expect(response.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(response.headers['X-Frame-Options']).toBe('DENY');
    expect(response.headers['Referrer-Policy']).toBe('no-referrer');
    expect(response.headers['Content-Security-Policy']).toContain("default-src 'none'");
  });

  it('skips CSP for swagger routes', () => {
    const response = createResponseRecorder();

    applySecurityHeaders(response, '/api/docs');

    expect(response.headers['Content-Security-Policy']).toBeUndefined();
    expect(response.headers['Permissions-Policy']).toBeDefined();
  });

  it('adds HSTS when enabled', () => {
    const response = createResponseRecorder();

    applySecurityHeaders(response, '/auth/me', { hstsEnabled: true });

    expect(response.headers['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
  });
});
