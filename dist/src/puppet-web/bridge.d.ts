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
 */
import { EventEmitter } from 'events';
import { Browser, Cookie, Dialog, Page } from 'puppeteer';
import { Profile } from '../profile';
import { MediaData, MsgRawObj } from './schema';
export interface InjectResult {
    code: number;
    message: string;
}
export interface BridgeOptions {
    head?: boolean;
    profile: Profile;
}
export declare class Bridge extends EventEmitter {
    options: BridgeOptions;
    private browser;
    private page;
    private state;
    constructor(options: BridgeOptions);
    init(): Promise<void>;
    initBrowser(): Promise<Browser>;
    onDialog(dialog: Dialog): Promise<void>;
    onLoad(page: Page): Promise<void>;
    initPage(browser: Browser): Promise<Page>;
    readyAngular(page: Page): Promise<void>;
    inject(page: Page): Promise<void>;
    logout(): Promise<any>;
    quit(): Promise<void>;
    getUserName(): Promise<string>;
    contactRemark(contactId: string, remark: string | null): Promise<boolean>;
    contactFind(filterFunc: string): Promise<string[]>;
    roomFind(filterFunc: string): Promise<string[]>;
    roomDelMember(roomId: any, contactId: any): Promise<number>;
    roomAddMember(roomId: any, contactId: any): Promise<number>;
    roomModTopic(roomId: any, topic: any): Promise<string>;
    roomCreate(contactIdList: string[], topic?: string): Promise<string>;
    verifyUserRequest(contactId: any, hello: any): Promise<boolean>;
    verifyUserOk(contactId: any, ticket: any): Promise<boolean>;
    send(toUserName: string, content: string): Promise<boolean>;
    getMsgImg(id: any): Promise<string>;
    getMsgEmoticon(id: any): Promise<string>;
    getMsgVideo(id: any): Promise<string>;
    getMsgVoice(id: any): Promise<string>;
    getMsgPublicLinkImg(id: any): Promise<string>;
    getContact(id: string): Promise<object>;
    getBaseRequest(): Promise<string>;
    getPassticket(): Promise<string>;
    getCheckUploadUrl(): Promise<string>;
    getUploadMediaUrl(): Promise<string>;
    sendMedia(mediaData: MediaData): Promise<boolean>;
    forward(baseData: MsgRawObj, patchData: MsgRawObj): Promise<boolean>;
    /**
     * Proxy Call to Wechaty in Bridge
     */
    proxyWechaty(wechatyFunc: string, ...args: any[]): Promise<any>;
    ding(data: any): Promise<any>;
    preHtmlToXml(text: string): string;
    innerHTML(): Promise<string>;
    /**
     * Throw if there's a blocked message
     */
    testBlockedMessage(text?: string): Promise<string | false>;
    clickSwitchAccount(page: Page): Promise<boolean>;
    hostname(): Promise<string | null>;
    cookies(cookieList: Cookie[]): Promise<void>;
    cookies(): Promise<Cookie[]>;
    /**
     * name
     */
    entryUrl(cookieList?: Cookie[]): string;
    reload(): Promise<void>;
    evaluate(fn: () => any, ...args: any[]): Promise<any>;
}
export { Cookie };
export default Bridge;
