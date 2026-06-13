import { Request, Response, NextFunction } from 'express';
export declare const SESSION_COOKIE_NAME: string;
export interface AuthRequest extends Request {
    user?: {
        userId: number;
        username: string;
    };
}
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map