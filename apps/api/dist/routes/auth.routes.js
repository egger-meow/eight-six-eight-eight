"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const csrf_1 = require("../middleware/csrf");
const validate_1 = require("../middleware/validate");
const auth_schema_1 = require("../schemas/auth.schema");
const jwt_1 = require("../lib/jwt");
const password_1 = require("../lib/password");
const config_1 = require("../lib/config");
const db_1 = require("@8688bnb/db");
const router = (0, express_1.Router)();
router.post('/login', (0, validate_1.validate)(auth_schema_1.LoginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await db_1.db.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTH_INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
            });
        }
        const isMatch = await (0, password_1.verifyPassword)(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: { code: 'AUTH_INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
            });
        }
        const payload = { userId: user.id, username: user.username };
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
                user: { id: user.id, username: user.username, display_name: user.displayName, created_at: user.createdAt.toISOString() },
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
router.get('/me', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const user = await db_1.db.user.findUnique({ where: { id: req.user?.userId } });
        if (!user) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        }
        res.json({
            success: true,
            data: { id: user.id, username: user.username, display_name: user.displayName, created_at: user.createdAt.toISOString() }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/password', auth_1.requireAdmin, csrf_1.doubleCsrfProtection, (0, validate_1.validate)(auth_schema_1.ChangePasswordSchema), async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        const user = await db_1.db.user.findUnique({ where: { id: req.user?.userId } });
        if (!user || !(await (0, password_1.verifyPassword)(current_password, user.passwordHash))) {
            return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: '目前密碼錯誤' } });
        }
        const newPasswordHash = await (0, password_1.hashPassword)(new_password);
        await db_1.db.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash }
        });
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