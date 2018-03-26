/// <reference types="node" />
import { Readable } from 'stream';
import { Sayable } from './config';
import Contact from './contact';
import Room from './room';
import { AppMsgType, MsgObj, MsgRawObj, MsgType } from './puppet-web/schema';
export declare type TypeName = 'attachment' | 'audio' | 'image' | 'video';
/**
 * All wechat messages will be encapsulated as a Message.
 *
 * `Message` is `Sayable`,
 * [Examples/Ding-Dong-Bot]{@link https://github.com/Chatie/wechaty/blob/master/examples/ding-dong-bot.ts}
 */
export declare class Message implements Sayable {
    rawObj: MsgRawObj | undefined;
    /**
     * @private
     */
    static counter: number;
    /**
     * @private
     */
    _counter: number;
    /**
     * @private
     */
    readonly id: string;
    /**
     * @private
     */
    obj: MsgObj;
    /**
     * @private
     */
    filename(): string;
    /**
     * @private
     */
    constructor(rawObj?: MsgRawObj | undefined);
    /**
     * @private
     */
    private parse(rawObj);
    /**
     * @private
     */
    toString(): string;
    /**
     * @private
     */
    toStringDigest(): string;
    /**
     * @private
     */
    toStringEx(): string;
    /**
     * @private
     */
    getSenderString(): string;
    /**
     * @private
     */
    getContentString(): string;
    say(text: string, replyTo?: Contact | Contact[]): Promise<any>;
    say(mediaMessage: MediaMessage, replyTo?: Contact | Contact[]): Promise<any>;
    /**
     * @private
     */
    from(contact: Contact): void;
    /**
     * @private
     */
    from(id: string): void;
    from(): Contact;
    /**
     * @private
     */
    room(room: Room): void;
    /**
     * @private
     */
    room(id: string): void;
    room(): Room | null;
    /**
     * Get the content of the message
     *
     * @returns {string}
     */
    content(): string;
    /**
     * @private
     */
    content(content: string): void;
    /**
     * Get the type from the message.
     *
     * If type is equal to `MsgType.RECALLED`, {@link Message#id} is the msgId of the recalled message.
     * @see {@link MsgType}
     * @returns {MsgType}
     */
    type(): MsgType;
    /**
     * Get the typeSub from the message.
     *
     * If message is a location message: `m.type() === MsgType.TEXT && m.typeSub() === MsgType.LOCATION`
     *
     * @see {@link MsgType}
     * @returns {MsgType}
     */
    typeSub(): MsgType;
    /**
     * Get the typeApp from the message.
     *
     * @returns {AppMsgType}
     * @see {@link AppMsgType}
     */
    typeApp(): AppMsgType;
    /**
     * Get the typeEx from the message.
     *
     * @returns {MsgType}
     */
    typeEx(): string;
    /**
     * @private
     */
    count(): number;
    /**
     * Check if a message is sent by self.
     *
     * @returns {boolean} - Return `true` for send from self, `false` for send from others.
     * @example
     * if (message.self()) {
     *  console.log('this message is sent by myself!')
     * }
     */
    self(): boolean;
    /**
     *
     * Get message mentioned contactList.
     *
     * Message event table as follows
     *
     * |                                                                            | Web  |  Mac PC Client | iOS Mobile |  android Mobile |
     * | :---                                                                       | :--: |     :----:     |   :---:    |     :---:       |
     * | [You were mentioned] tip ([有人@我]的提示)                                   |  ✘   |        √       |     √      |       √         |
     * | Identify magic code (8197) by copy & paste in mobile                       |  ✘   |        √       |     √      |       ✘         |
     * | Identify magic code (8197) by programming                                  |  ✘   |        ✘       |     ✘      |       ✘         |
     * | Identify two contacts with the same roomAlias by [You were  mentioned] tip |  ✘   |        ✘       |     √      |       √         |
     *
     * @returns {Contact[]} - Return message mentioned contactList
     *
     * @example
     * const contactList = message.mentioned()
     * console.log(contactList)
     */
    mentioned(): Contact[];
    /**
     * @private
     */
    ready(): Promise<void>;
    /**
     * @private
     */
    get(prop: string): string;
    /**
     * @private
     */
    set(prop: string, value: string): this;
    /**
     * @private
     */
    dump(): void;
    /**
     * @private
     */
    dumpRaw(): void;
    /**
     * @todo add function
     */
    static find(query: any): Promise<Message>;
    /**
     * @todo add function
     */
    static findAll(query: any): Promise<Message[]>;
    /**
     * @private
     */
    to(contact: Contact): void;
    /**
     * @private
     */
    to(id: string): void;
    to(): Contact | null;
    /**
     * Please notice that when we are running Wechaty,
     * if you use the browser that controlled by Wechaty to send attachment files,
     * you will get a zero sized file, because it is not an attachment from the network,
     * but a local data, which is not supported by Wechaty yet.
     *
     * @returns {Promise<Readable>}
     */
    readyStream(): Promise<Readable>;
}
/**
 * Meidia Type Message
 *
 */
export declare class MediaMessage extends Message {
    /**
     * @private
     */
    private bridge;
    /**
     * @private
     */
    private filePath;
    /**
     * @private
     */
    private fileName;
    /**
     * @private
     */
    private fileExt;
    /**
     * @private
     */
    constructor(rawObj: Object);
    /**
     * @private
     */
    constructor(filePath: string);
    /**
     * @private
     */
    toString(): string;
    /**
     * @private
     */
    ready(): Promise<void>;
    /**
     * Get the MediaMessage file extension, etc: `jpg`, `gif`, `pdf`, `word` ..
     *
     * @returns {string}
     * @example
     * bot.on('message', async function (m) {
     *   if (m instanceof MediaMessage) {
     *     console.log('media message file name extention is: ' + m.ext())
     *   }
     * })
     */
    ext(): string;
    /**
     * return the MIME Type of this MediaMessage
     *
     */
    mimeType(): string | null;
    /**
     * Get the MediaMessage filename, etc: `how to build a chatbot.pdf`..
     *
     * @returns {string}
     * @example
     * bot.on('message', async function (m) {
     *   if (m instanceof MediaMessage) {
     *     console.log('media message file name is: ' + m.filename())
     *   }
     * })
     */
    filename(): string;
    /**
     * Get the read stream for attachment file
     */
    readyStream(): Promise<Readable>;
    /**
     * save file
     *
     * @param filePath save file
     */
    saveFile(filePath: string): Promise<void>;
    /**
     * Forward the received message.
     *
     * The types of messages that can be forwarded are as follows:
     *
     * The return value of {@link Message#type} matches one of the following types:
     * ```
     * MsgType {
     *   TEXT                = 1,
     *   IMAGE               = 3,
     *   VIDEO               = 43,
     *   EMOTICON            = 47,
     *   LOCATION            = 48,
     *   APP                 = 49,
     *   MICROVIDEO          = 62,
     * }
     * ```
     *
     * When the return value of {@link Message#type} is `MsgType.APP`, the return value of {@link Message#typeApp} matches one of the following types:
     * ```
     * AppMsgType {
     *   TEXT                     = 1,
     *   IMG                      = 2,
     *   VIDEO                    = 4,
     *   ATTACH                   = 6,
     *   EMOJI                    = 8,
     * }
     * ```
     * It should be noted that when forwarding ATTACH type message, if the file size is greater than 25Mb, the forwarding will fail.
     * The reason is that the server shields the web wx to download more than 25Mb files with a file size of 0.
     *
     * But if the file is uploaded by you using wechaty, you can forward it.
     * You need to detect the following conditions in the message event, which can be forwarded if it is met.
     *
     * ```javasrcipt
     * .on('message', async m => {
     *   if (m.self() && m.rawObj && m.rawObj.Signature) {
     *     // Filter the contacts you have forwarded
     *     const msg = <MediaMessage> m
     *     await msg.forward()
     *   }
     * })
     * ```
     *
     * @param {(Sayable | Sayable[])} to Room or Contact
     * The recipient of the message, the room, or the contact
     * @returns {Promise<boolean>}
     * @memberof MediaMessage
     */
    forward(to: Room | Contact): Promise<boolean>;
}
export { MsgType };
export default Message;
