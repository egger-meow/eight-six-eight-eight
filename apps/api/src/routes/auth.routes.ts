import { Router } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { doubleCsrfProtection, generateToken } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { LoginSchema, ChangePasswordSchema } from '../schemas/auth.schema';
import { signToken, verifyToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { config } from '../lib/config';
import { db } from '@8688bnb/db';

const router = Router();

router.post('/login', validate(LoginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await db.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
      });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_INVALID_CREDENTIALS', message: '帳號或密碼錯誤' }
      });
    }

    const payload = { userId: user.id, username: user.username };
    const token = signToken(payload);

    res.cookie('__Host-8688_session', token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, display_name: user.displayName, created_at: user.createdAt.toISOString() },
        csrf_token: generateToken(req, res)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAdmin, doubleCsrfProtection, (req, res) => {
  res.clearCookie('__Host-8688_session');
  res.json({ success: true, data: { message: '已成功登出' } });
});

router.get('/me', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user?.userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    res.json({
      success: true,
      data: { id: user.id, username: user.username, display_name: user.displayName, created_at: user.createdAt.toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/password', requireAdmin, doubleCsrfProtection, validate(ChangePasswordSchema), async (req: AuthRequest, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await db.user.findUnique({ where: { id: req.user?.userId } });
    
    if (!user || !(await verifyPassword(current_password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: '目前密碼錯誤' } });
    }

    const newPasswordHash = await hashPassword(new_password);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });
    
    // Invalidate session
    res.clearCookie('__Host-8688_session');
    
    res.json({
      success: true,
      data: { message: '密碼已更新，請重新登入' }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/csrf-token', requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: { csrf_token: generateToken(req, res) }
  });
});

export default router;
