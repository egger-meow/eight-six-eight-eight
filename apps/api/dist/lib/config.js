"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.getSecureSecret = getSecureSecret;
const zod_1 = require("zod");
const crypto = __importStar(require("crypto"));
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    API_PORT: zod_1.z.coerce.number().default(3333),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    JWT_SECRET: zod_1.z.string().optional(),
    CSRF_SECRET: zod_1.z.string().optional(),
    ADMIN_DEFAULT_PASSWORD: zod_1.z.string().min(8).default('8688bnb!'),
    WEBHOOK_API_KEY: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    DATABASE_URL: zod_1.z.string().url().optional(),
});
const env = envSchema.safeParse(process.env);
if (!env.success) {
    console.error('❌ Invalid environment variables:', env.error.format());
    process.exit(1);
}
exports.config = env.data;
/**
 * Helper to securely get JWT or CSRF secrets.
 * Fallbacks: Environment -> Random Generation + Warning
 * NEVER use hardcoded fallback strings.
 */
function getSecureSecret(name) {
    if (exports.config[name]) {
        return exports.config[name];
    }
    console.warn(`⚠️  WARNING: ${name} is not set in environment. Generating ephemeral secret.`);
    console.warn(`⚠️  This means sessions/tokens will be invalidated upon server restart.`);
    const ephemeralSecret = crypto.randomBytes(32).toString('hex');
    // Save it back to config to keep it consistent during runtime
    exports.config[name] = ephemeralSecret;
    return ephemeralSecret;
}
//# sourceMappingURL=config.js.map