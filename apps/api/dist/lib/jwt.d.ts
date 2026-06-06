interface JwtPayload {
    userId: number;
    username: string;
}
export declare function signToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
export {};
//# sourceMappingURL=jwt.d.ts.map