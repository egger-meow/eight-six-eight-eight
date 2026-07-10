import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { config } from '../lib/config';

export const SESSION_COOKIE_NAME = config.NODE_ENV === 'production'
  ? '__Host-8688_session'
  : '8688_session';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[SESSION_COOKIE_NAME] || req.cookies['__Host-8688_session'];
    
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

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
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
