/// <reference types="node" />
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 *   @ignore
 */
import { Sayable } from './config';
import { MediaMessage } from './message';
export interface ContactObj {
    address: string;
    city: string;
    id: string;
    name: string;
    province: string;
    alias: string | null;
    sex: Gender;
    signature: string;
    star: boolean;
    stranger: boolean;
    uin: string;
    weixin: string;
    avatar: string;
    official: boolean;
    special: boolean;
}
export interface ContactRawObj {
    Alias: string;
    City: string;
    NickName: string;
    Province: string;
    RemarkName: string;
    Sex: Gender;
    Signature: string;
    StarFriend: string;
    Uin: string;
    UserName: string;
    HeadImgUrl: string;
    stranger: string;
    VerifyFlag: number;
}
/**
 * Enum for Gender values.
 *
 * @enum {number}
 * @property {number} Unknown   - 0 for Unknown
 * @property {number} Male      - 1 for Male
 * @property {number} Female    - 2 for Female
 */
export declare enum Gender {
    Unknown = 0,
    Male = 1,
    Female = 2,
}
export interface ContactQueryFilter {
    name?: string | RegExp;
    alias?: string | RegExp;
    remark?: string | RegExp;
}
/**
 * All wechat contacts(friend) will be encapsulated as a Contact.
 *
 * `Contact` is `Sayable`,
 * [Examples/Contact-Bot]{@link https://github.com/Chatie/wechaty/blob/master/examples/contact-bot.ts}
 */
export declare class Contact implements Sayable {
    readonly id: string;
    private static pool;
    obj: ContactObj | null;
    private rawObj;
    /**
     * @private
     */
    constructor(id: string);
    /**
     * @private
     */
    toString(): string;
    /**
     * @private
     */
    toStringEx(): string;
    /**
     * @private
     */
    private parse(rawObj);
    /**
     * The way to search Contact
     *
     * @typedef    ContactQueryFilter
     * @property   {string} name    - The name-string set by user-self, should be called name
     * @property   {string} alias   - The name-string set by bot for others, should be called alias
     * [More Detail]{@link https://github.com/Chatie/wechaty/issues/365}
     */
    /**
     * Try to find a contact by filter: {name: string | RegExp} / {alias: string | RegExp}
     *
     * Find contact by name or alias, if the result more than one, return the first one.
     *
     * @static
     * @param {ContactQueryFilter} query
     * @returns {(Promise<Contact | null>)} If can find the contact, return Contact, or return null
     * @example
     * const contactFindByName = await Contact.find({ name:"ruirui"} )
     * const contactFindByAlias = await Contact.find({ alias:"lijiarui"} )
     */
    static find(query: ContactQueryFilter): Promise<Contact | null>;
    /**
     * Find contact by `name` or `alias`
     *
     * If use Contact.findAll() get the contact list of the bot.
     *
     * #### definition
     * - `name`   the name-string set by user-self, should be called name
     * - `alias`  the name-string set by bot for others, should be called alias
     *
     * @static
     * @param {ContactQueryFilter} [queryArg]
     * @returns {Promise<Contact[]>}
     * @example
     * const contactList = await Contact.findAll()                    // get the contact list of the bot
     * const contactList = await Contact.findAll({name: 'ruirui'})    // find allof the contacts whose name is 'ruirui'
     * const contactList = await Contact.findAll({alias: 'lijiarui'}) // find all of the contacts whose alias is 'lijiarui'
     */
    static findAll(queryArg?: ContactQueryFilter): Promise<Contact[]>;
    /**
     * Sent Text to contact
     *
     * @param {string} text
     */
    say(text: string): Promise<boolean>;
    /**
     * Send Media File to Contact
     *
     * @param {MediaMessage} mediaMessage
     * @memberof Contact
     */
    say(mediaMessage: MediaMessage): Promise<boolean>;
    /**
     * Get the name from a contact
     *
     * @returns {string}
     * @example
     * const name = contact.name()
     */
    name(): string;
    alias(): string | null;
    alias(newAlias: string): Promise<boolean>;
    alias(empty: null): Promise<boolean>;
    /**
     * Check if contact is stranger
     *
     * @returns {boolean | null} - True for not friend of the bot, False for friend of the bot, null for unknown.
     * @example
     * const isStranger = contact.stranger()
     */
    stranger(): boolean | null;
    /**
     * Check if it's a offical account
     *
     * @returns {boolean|null} - True for official account, Flase for contact is not a official account, null for unknown
     * @see {@link https://github.com/Chatie/webwx-app-tracker/blob/7c59d35c6ea0cff38426a4c5c912a086c4c512b2/formatted/webwxApp.js#L3243|webwxApp.js#L324}
     * @see {@link https://github.com/Urinx/WeixinBot/blob/master/README.md|Urinx/WeixinBot/README}
     * @example
     * const isOfficial = contact.official()
     */
    official(): boolean;
    /**
     * Check if it's a special contact
     *
     * The contact who's id in following list will be identify as a special contact
     * `weibo`, `qqmail`, `fmessage`, `tmessage`, `qmessage`, `qqsync`, `floatbottle`,
     * `lbsapp`, `shakeapp`, `medianote`, `qqfriend`, `readerapp`, `blogapp`, `facebookapp`,
     * `masssendapp`, `meishiapp`, `feedsapp`, `voip`, `blogappweixin`, `weixin`, `brandsessionholder`,
     * `weixinreminder`, `wxid_novlwrv3lqwv11`, `gh_22b87fa7cb3c`, `officialaccounts`, `notification_messages`,
     *
     * @see {@link https://github.com/Chatie/webwx-app-tracker/blob/7c59d35c6ea0cff38426a4c5c912a086c4c512b2/formatted/webwxApp.js#L3848|webwxApp.js#L3848}
     * @see {@link https://github.com/Chatie/webwx-app-tracker/blob/7c59d35c6ea0cff38426a4c5c912a086c4c512b2/formatted/webwxApp.js#L3246|webwxApp.js#L3246}
     * @returns {boolean|null} True for brand, Flase for contact is not a brand
     * @example
     * const isSpecial = contact.special()
     */
    special(): boolean;
    /**
     * Check if it's a personal account
     *
     * @returns {boolean|null} - True for personal account, Flase for contact is not a personal account
     * @example
     * const isPersonal = contact.personal()
     */
    personal(): boolean;
    /**
     * Check if the contact is star contact.
     *
     * @returns {boolean} - True for star friend, False for no star friend.
     * @example
     * const isStar = contact.star()
     */
    star(): boolean | null;
    /**
     * Contact gender
     *
     * @returns {Gender.Male(2)|Gender.Female(1)|Gender.Unknown(0)}
     * @example
     * const gender = contact.gender()
     */
    gender(): Gender;
    /**
     * Get the region 'province' from a contact
     *
     * @returns {string | undefined}
     * @example
     * const province = contact.province()
     */
    province(): string | null;
    /**
     * Get the region 'city' from a contact
     *
     * @returns {string | undefined}
     * @example
     * const city = contact.city()
     */
    city(): string | null;
    /**
     * Get avatar picture file stream
     *
     * @returns {Promise<NodeJS.ReadableStream>}
     * @example
     * const avatarFileName = contact.name() + `.jpg`
     * const avatarReadStream = await contact.avatar()
     * const avatarWriteStream = createWriteStream(avatarFileName)
     * avatarReadStream.pipe(avatarWriteStream)
     * log.info('Bot', 'Contact: %s: %s with avatar file: %s', contact.weixin(), contact.name(), avatarFileName)
     */
    avatar(): Promise<NodeJS.ReadableStream>;
    /**
     * @private
     */
    get(prop: any): any;
    /**
     * @private
     */
    isReady(): boolean;
    /**
     * Force reload data for Contact
     *
     * @returns {Promise<this>}
     * @example
     * await contact.refresh()
     */
    refresh(): Promise<this>;
    /**
     * @private
     */
    ready(contactGetter?: (id: string) => Promise<ContactRawObj>): Promise<this>;
    /**
     * @private
     */
    dumpRaw(): void;
    /**
     * @private
     */
    dump(): void;
    /**
     * Check if contact is self
     *
     * @returns {boolean} True for contact is self, False for contact is others
     * @example
     * const isSelf = contact.self()
     */
    self(): boolean;
    /**
     * @private
     */
    remark(newRemark?: string | null): Promise<boolean> | string | null;
    /**
     * @private
     */
    static load(id: string): Contact;
    /**
     * Get the weixin number from a contact.
     *
     * Sometimes cannot get weixin number due to weixin security mechanism, not recommend.
     *
     * @private
     * @returns {string | null}
     * @example
     * const weixin = contact.weixin()
     */
    weixin(): string | null;
}
export default Contact;
