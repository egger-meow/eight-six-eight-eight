import { doubleCsrf } from 'csrf-csrf';
import { getSecureSecret } from '../lib/config';
import { config } from '../lib/config';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => getSecureSecret('CSRF_SECRET'),
  cookieName: '__Host-8688_csrf', // Secure cookie prefix
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.NODE_ENV === 'production',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

export { generateToken, doubleCsrfProtection };
