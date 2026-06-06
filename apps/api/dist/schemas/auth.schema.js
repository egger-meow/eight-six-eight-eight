"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
exports.LoginSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string().min(8).max(128),
});
exports.ChangePasswordSchema = zod_1.z.object({
    current_password: zod_1.z.string().max(128),
    new_password: zod_1.z.string().min(8).max(128),
});
//# sourceMappingURL=auth.schema.js.map