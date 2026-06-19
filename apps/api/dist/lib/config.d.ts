export declare const config: {
    NODE_ENV: "development" | "production" | "test";
    API_PORT: number;
    CORS_ORIGIN: string;
    ADMIN_DEFAULT_PASSWORD: string;
    REDIS_URL: string;
    PUBLIC_ADMIN_URL: string;
    LINE_ADMIN_OWNER_USER_IDS: string;
    LINE_ADMIN_DEVELOPER_USER_IDS: string;
    LINE_BINDING_CODE_TTL_MINUTES: number;
    NOTIFICATION_WORKER_ENABLED: boolean;
    NOTIFICATION_WORKER_INTERVAL_MS: number;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_FROM: string;
    BOOKING_NOTIFICATION_EMAILS: string;
    JWT_SECRET?: string | undefined;
    CSRF_SECRET?: string | undefined;
    WEBHOOK_API_KEY?: string | undefined;
    DATABASE_URL?: string | undefined;
    LINE_CHANNEL_SECRET?: string | undefined;
    LINE_CHANNEL_ACCESS_TOKEN?: string | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASSWORD?: string | undefined;
};
/**
 * Helper to securely get JWT or CSRF secrets.
 * Fallbacks: Environment -> Random Generation + Warning
 * NEVER use hardcoded fallback strings.
 */
export declare function getSecureSecret(name: 'JWT_SECRET' | 'CSRF_SECRET'): string;
//# sourceMappingURL=config.d.ts.map