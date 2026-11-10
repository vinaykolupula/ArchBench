import { Express } from "express";
export interface ServerOptions {
    port?: number;
    openBrowser?: boolean;
    initialSpec?: string;
}
export declare function createServer(_options?: ServerOptions): Promise<Express>;
export declare function startServer(options?: ServerOptions): Promise<{
    server: any;
    url: string;
}>;
//# sourceMappingURL=index.d.ts.map