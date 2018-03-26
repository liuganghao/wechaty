import * as Raven from 'raven';
import Brolog from 'brolog';
import Puppet from './puppet';
export declare const VERSION: string;
export declare const log: Brolog;
export declare type PuppetName = 'web' | 'android' | 'ios';
export interface DefaultSetting {
    DEFAULT_HEAD: number;
    DEFAULT_PORT: number;
    DEFAULT_PUPPET: PuppetName;
    DEFAULT_APIHOST: string;
    DEFAULT_PROFILE: string;
    DEFAULT_TOKEN: string;
    DEFAULT_PROTOCOL: string;
}
export declare const DEFAULT_SETTING: DefaultSetting;
export declare class Config {
    default: DefaultSetting;
    apihost: string;
    head: boolean;
    puppet: PuppetName;
    profile: string | null;
    token: string | null;
    debug: boolean;
    httpPort: string | number;
    docker: boolean;
    private _puppetInstance;
    constructor();
    /**
     * 5. live setting
     */
    puppetInstance(): Puppet;
    puppetInstance(empty: null): void;
    puppetInstance(instance: Puppet): void;
    gitRevision(): string | null;
    validApiHost(apihost: string): boolean;
}
export interface Sayable {
    say(content: string, replyTo?: any | any[]): Promise<boolean>;
}
export interface Sleepable {
    sleep(millisecond: number): Promise<void>;
}
export { Raven };
export declare const config: Config;
export default config;
