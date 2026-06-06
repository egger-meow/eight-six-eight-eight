"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doubleCsrfProtection = exports.generateToken = void 0;
const csrf_csrf_1 = require("csrf-csrf");
const config_1 = require("../lib/config");
const config_2 = require("../lib/config");
const { generateToken, doubleCsrfProtection } = (0, csrf_csrf_1.doubleCsrf)({
    getSecret: () => (0, config_1.getSecureSecret)('CSRF_SECRET'),
    cookieName: '__Host-8688_csrf', // Secure cookie prefix
    cookieOptions: {
        httpOnly: true,
        sameSite: 'strict',
        secure: config_2.config.NODE_ENV === 'production',
        path: '/',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});
exports.generateToken = generateToken;
exports.doubleCsrfProtection = doubleCsrfProtection;
//# sourceMappingURL=csrf.js.map