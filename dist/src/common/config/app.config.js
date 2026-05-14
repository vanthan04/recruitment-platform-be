"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('config', () => ({
    app: {
        port: parseInt(process.env.PORT || '8080', 10),
        apiPrefix: process.env.API_PREFIX || 'api/v1',
    },
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiration: process.env.JWT_EXPIRATION,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION,
    },
    mail: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
        from: process.env.MAIL_FROM,
    },
}));
//# sourceMappingURL=app.config.js.map