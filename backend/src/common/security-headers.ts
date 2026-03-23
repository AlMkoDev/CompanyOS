type HeaderSetter = {
  setHeader(name: string, value: string): void;
};

const SWAGGER_PATH_PREFIXES = ['/api/docs', '/api/docs-json'];

export function isSwaggerPath(path: string) {
  return SWAGGER_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function applySecurityHeaders(
  response: HeaderSetter,
  requestPath: string,
  options?: { hstsEnabled?: boolean },
) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  if (options?.hstsEnabled) {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (!isSwaggerPath(requestPath)) {
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  }
}
