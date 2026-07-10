import jwt from 'jsonwebtoken';
import { getSecureSecret } from './config';

interface JwtPayload {
  userId: number;
  username: string;
}

export function signToken(payload: JwtPayload): string {
  const secret = getSecureSecret('JWT_SECRET');
  return jwt.sign(payload, secret, {
    expiresIn: '24h',
    algorithm: 'HS256'
  });
}

export function verifyToken(token: string): JwtPayload {
  const secret = getSecureSecret('JWT_SECRET');
  return jwt.verify(token, secret, {
    algorithms: ['HS256']
  }) as JwtPayload;
}
