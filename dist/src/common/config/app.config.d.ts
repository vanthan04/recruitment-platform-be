declare const _default: (() => {
    app: {
        port: number;
        apiPrefix: string;
    };
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiration: string | undefined;
        refreshSecret: string | undefined;
        refreshExpiration: string | undefined;
    };
    mail: {
        host: string | undefined;
        port: number;
        user: string | undefined;
        pass: string | undefined;
        from: string | undefined;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    app: {
        port: number;
        apiPrefix: string;
    };
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiration: string | undefined;
        refreshSecret: string | undefined;
        refreshExpiration: string | undefined;
    };
    mail: {
        host: string | undefined;
        port: number;
        user: string | undefined;
        pass: string | undefined;
        from: string | undefined;
    };
}>;
export default _default;
