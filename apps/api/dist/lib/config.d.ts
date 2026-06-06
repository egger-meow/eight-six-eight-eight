export declare const config: {
    NODE_ENV: "development" | "production" | "test";
    API_PORT: number;
    CORS_ORIGIN: string;
    ADMIN_DEFAULT_PASSWORD: string;
    REDIS_URL: string;
    JWT_SECRET?: string | undefined;
    CSRF_SECRET?: string | undefined;
    WEBHOOK_API_KEY?: string | undefined;
    DATABASE_URL?: string | undefined;
};
/**
 * Helper to securely get JWT or CSRF secrets.
 * Fallbacks: Environment -> Random Generation + Warning
 * NEVER use hardcoded fallback strings.
 */
export declare function getSecureSecret(name: 'JWT_SECRET' | 'CSRF_SECRET'): string;
//# sourceMappingURL=config.d.ts.map