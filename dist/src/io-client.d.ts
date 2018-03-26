import { Wechaty } from './wechaty';
export interface IoClientOptions {
    token: string;
    wechaty?: Wechaty;
}
export declare class IoClient {
    options: IoClientOptions;
    private io;
    private state;
    constructor(options: IoClientOptions);
    init(): Promise<void>;
    private hookWechaty(wechaty);
    private initIo();
    initWeb(port?: string | number): Promise<{}>;
    private onMessage(m);
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    quit(): Promise<void>;
}
export default IoClient;
