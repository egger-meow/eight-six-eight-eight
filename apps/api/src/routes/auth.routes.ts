import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { doubleCsrfProtection, generateToken } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { LoginSchema, ChangePasswordSchema } from '../schemas/auth.schema';
import { signToken, verifyToken } from '../lib/jwt';
import { hashPassword, verifyPassword } from '../lib/password';
import { config } from '../lib/config';

const router = Router();

router.post('/login', validate(LoginSchema), async (req, res, next) => {
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
    const isMatch = password === config.ADMIN_DEFAULT_PASSWORD; // Replace with proper DB check later
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
        user: { id: 1, username: 'yenfeng', display_name: '黃筵丰', created_at: new Date().toISOString() },
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

router.get('/me', requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: { id: 1, username: 'yenfeng', display_name: '黃筵丰', created_at: new Date().toISOString() }
  });
});

router.put('/password', requireAdmin, doubleCsrfProtection, validate(ChangePasswordSchema), async (req, res, next) => {
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
