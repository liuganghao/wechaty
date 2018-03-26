import { ScanInfo } from '../puppet';
import PuppetWeb from './puppet-web';
import { MsgRawObj } from './schema';
export declare const Event: {
    onDing: (this: PuppetWeb, data: any) => void;
    onLog: (data: any) => void;
    onLogin: (this: PuppetWeb, memo: string, ttl?: number) => Promise<void>;
    onLogout: (this: PuppetWeb, data: any) => void;
    onMessage: (this: PuppetWeb, obj: MsgRawObj) => Promise<void>;
    onScan: (this: PuppetWeb, data: ScanInfo) => Promise<void>;
    onUnload: (this: PuppetWeb) => Promise<void>;
};
export default Event;
