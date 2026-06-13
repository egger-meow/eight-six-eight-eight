"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_COOKIE_NAME = void 0;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../lib/jwt");
const config_1 = require("../lib/config");
exports.SESSION_COOKIE_NAME = config_1.config.NODE_ENV === 'production'
    ? '__Host-8688_session'
    : '8688_session';
function requireAdmin(req, res, next) {
    try {
        const token = req.cookies[exports.SESSION_COOKIE_NAME] || req.cookies['__Host-8688_session'];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_SESSION_EXPIRED',
                    message: '登入已過期，請重新登入',
                    message_en: 'Session expired, please log in again'
                }
            });
        }
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'AUTH_SESSION_EXPIRED',
                message: '登入已過期，請重新登入',
                message_en: 'Session expired, please log in again'
            }
        });
    }
}
//# sourceMappingURL=auth.js.map