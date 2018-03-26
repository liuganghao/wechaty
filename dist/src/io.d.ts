import Wechaty from './wechaty';
export interface IoOptions {
    wechaty: Wechaty;
    token: string;
    apihost?: string;
    protocol?: string;
}
export declare class Io {
    private options;
    uuid: string;
    private protocol;
    private eventBuffer;
    private ws;
    private state;
    private reconnectTimer;
    private reconnectTimeout;
    private onMessage;
    constructor(options: IoOptions);
    toString(): string;
    private connected();
    init(): Promise<void>;
    private initEventHook();
    private initWebSocket();
    private wsOnOpen(ws);
    private wsOnMessage(data);
    private wsOnError(e?);
    private wsOnClose(ws, code, message);
    private reconnect();
    private send(ioEvent?);
    quit(): Promise<void>;
    /**
     *
     * Prepare to be overwriten by server setting
     *
     */
    private ioMessage(m);
}
export default Io;
