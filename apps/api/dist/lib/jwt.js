"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
function signToken(payload) {
    const secret = (0, config_1.getSecureSecret)('JWT_SECRET');
    return jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: '24h',
        algorithm: 'HS256'
    });
}
function verifyToken(token) {
    const secret = (0, config_1.getSecureSecret)('JWT_SECRET');
    return jsonwebtoken_1.default.verify(token, secret, {
        algorithms: ['HS256']
    });
}
//# sourceMappingURL=jwt.js.map