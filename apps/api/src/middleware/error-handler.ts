import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled error:', err);

  // Check for CSRF errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_CSRF_INVALID',
        message: 'CSRF 驗證失敗',
        message_en: 'CSRF validation failed',
      }
    });
  }

  // Handle SyntaxError for bad JSON
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: '無效的 JSON 格式',
        message_en: 'Invalid JSON format',
      }
    });
  }

  // Default generic 500 error, never leak internals
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '系統發生錯誤，請稍後再試',
      message_en: 'Internal server error, please try again later'
    }
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '找不到請求的資源',
      message_en: 'Resource not found'
    }
  });
}
