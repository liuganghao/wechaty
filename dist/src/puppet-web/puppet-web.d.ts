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
 */
import { Watchdog } from 'watchdog';
import Contact from '../contact';
import { Message, MediaMessage } from '../message';
import Profile from '../profile';
import { Puppet, PuppetOptions, ScanInfo } from '../puppet';
import Room from '../room';
import { Bridge, Cookie } from './bridge';
export declare type PuppetFoodType = 'scan' | 'ding';
export declare type ScanFoodType = 'scan' | 'login' | 'logout';
export declare class PuppetWeb extends Puppet {
    options: PuppetOptions;
    bridge: Bridge;
    scanInfo: ScanInfo | null;
    puppetWatchdog: Watchdog<PuppetFoodType>;
    scanWatchdog: Watchdog<ScanFoodType>;
    private fileId;
    constructor(options: PuppetOptions);
    toString(): string;
    init(): Promise<void>;
    initWatchdogForPuppet(): void;
    /**
     * Deal with SCAN events
     *
     * if web browser stay at login qrcode page long time,
     * sometimes the qrcode will not refresh, leave there expired.
     * so we need to refresh the page after a while
     */
    initWatchdogForScan(): void;
    quit(): Promise<void>;
    initBridge(profile: Profile): Promise<Bridge>;
    reset(reason?: string): Promise<void>;
    logined(): boolean;
    logonoff(): boolean;
    /**
     * get self contact
     */
    self(): Contact;
    private getBaseRequest();
    private uploadMedia(mediaMessage, toUserName);
    sendMedia(message: MediaMessage): Promise<boolean>;
    /**
     * TODO: Test this function if it could work...
     */
    forward(message: MediaMessage, sendTo: Contact | Room): Promise<boolean>;
    send(message: Message | MediaMessage): Promise<boolean>;
    /**
     * Bot say...
     * send to `self` for notice / log
     */
    say(content: string): Promise<boolean>;
    /**
     * logout from browser, then server will emit `logout` event
     */
    logout(): Promise<void>;
    getContact(id: string): Promise<object>;
    ding(data?: any): Promise<string>;
    contactAlias(contact: Contact, remark: string | null): Promise<boolean>;
    contactFind(filterFunc: string): Promise<Contact[]>;
    roomFind(filterFunc: string): Promise<Room[]>;
    roomDel(room: Room, contact: Contact): Promise<number>;
    roomAdd(room: Room, contact: Contact): Promise<number>;
    roomTopic(room: Room, topic: string): Promise<string>;
    roomCreate(contactList: Contact[], topic: string): Promise<Room>;
    /**
     * FriendRequest
     */
    friendRequestSend(contact: Contact, hello: string): Promise<boolean>;
    friendRequestAccept(contact: Contact, ticket: string): Promise<boolean>;
    /**
     * @private
     * For issue #668
     */
    readyStable(): Promise<void>;
    hostname(): Promise<string>;
    cookies(): Promise<Cookie[]>;
    saveCookie(): Promise<void>;
}
export default PuppetWeb;
