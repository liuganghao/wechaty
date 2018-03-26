/// <reference types="node" />
/// <reference types="pouchdb-core" />
import { Readable } from 'stream';
import { MsgType } from './message';
export declare class Misc {
    static stripHtml(html?: string): string;
    static unescapeHtml(str?: string): string;
    static digestEmoji(html?: string): string;
    /**
     * unifyEmoji: the same emoji will be encoded as different xml code in browser. unify them.
     *
     *  from: <img class="emoji emoji1f602" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />
     *  to:   <span class=\"emoji emoji1f602\"></span>
     *
     */
    static unifyEmoji(html?: string): string;
    static stripEmoji(html?: string): string;
    static plainText(html?: string): string;
    static urlStream(href: string, cookies: any[]): Promise<Readable>;
    static guid(): string;
    /**
     *
     * @param port is just a suggestion.
     * there's no grantuee for the number
     *
     * The IANA suggested ephemeral port range.
     * @see http://en.wikipedia.org/wiki/Ephemeral_ports
     *
     * const DEFAULT_IANA_RANGE = {min: 49152, max: 65535}
     *
     */
    static getPort(port: number): Promise<number>;
    static md5(buffer: Buffer): string;
    static msgType(ext: string): MsgType;
}
export default Misc;
