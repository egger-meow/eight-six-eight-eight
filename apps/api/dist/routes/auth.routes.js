"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const auth_schema_1 = require("../schemas/auth.schema");
const jwt_1 = require("../lib/jwt");
const config_1 = require("../lib/config");
const router = (0, express_1.Router)();
router.post('/login', (0, validate_1.validate)(auth_schema_1.LoginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        // TODO: Fetch from DB. For now, hardcode admin user logic
        if (username !== 'yenfeng') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_INVALID_CREDENTIALS',
                    message: '帳號或密碼錯誤'
                }
            });
        }
        // Mock hash check
        const isMatch = password === config_1.config.ADMIN_DEFAULT_PASSWORD; // Replace with proper DB check later
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_INVALID_CREDENTIALS',
                    message: '帳號或密碼錯誤'
                }
            });
        }
        const payload = { userId: 1, username: 'yenfeng' };
        const token = (0, jwt_1.signToken)(payload);
        res.cookie('__Host-8688_session', token, {
            httpOnly: true,
            secure: config_1.config.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        res.json({
            success: true,
            data: {
                user: { id: 1, username: 'yenfeng', display_name: '黃筵丰', created_at: new Date().toISOString() },
                csrf_token: (0, csrf_1.generateToken)(req, res)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/logout', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (req, res) => {
    res.clearCookie('__Host-8688_session');
    res.json({ success: true, data: { message: '已成功登出' } });
});
router.get('/me', auth_1.requireAdmin, (req, res) => {
    res.json({
        success: true,
        data: { id: 1, username: 'yenfeng', display_name: '黃筵丰', created_at: new Date().toISOString() }
    });
});
router.put('/password', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(auth_schema_1.ChangePasswordSchema), async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        // TODO: Verify current_password against DB
        // TODO: Hash new_password and save to DB
        // Invalidate session
        res.clearCookie('__Host-8688_session');
        res.json({
            success: true,
            data: { message: '密碼已更新，請重新登入' }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/csrf-token', auth_1.requireAdmin, (req, res) => {
    res.json({
        success: true,
        data: { csrf_token: (0, csrf_1.generateToken)(req, res) }
    });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map