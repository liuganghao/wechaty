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
import { StateSwitch } from 'state-switch';
import { WatchdogFood } from 'watchdog';
import { Sayable } from './config';
import Contact from './contact';
import FriendRequest from './friend-request';
import { Message, MediaMessage } from './message';
import Profile from './profile';
import Room from './room';
import { WechatyEvent } from './wechaty';
export interface ScanInfo {
    url: string;
    code: number;
}
export declare type PuppetEvent = WechatyEvent | 'watchdog';
export interface PuppetOptions {
    profile: Profile;
}
/**
 * Abstract Puppet Class
 */
export declare abstract class Puppet extends EventEmitter implements Sayable {
    options: PuppetOptions;
    userId: string | null;
    user: Contact | null;
    abstract getContact(id: string): Promise<any>;
    state: StateSwitch;
    constructor(options: PuppetOptions);
    emit(event: 'error', e: Error): boolean;
    emit(event: 'friend', friend: Contact, request?: FriendRequest): boolean;
    emit(event: 'heartbeat', data: any): boolean;
    emit(event: 'login', user: Contact): boolean;
    emit(event: 'logout', user: Contact | string): boolean;
    emit(event: 'message', message: Message): boolean;
    emit(event: 'room-join', room: Room, inviteeList: Contact[], inviter: Contact): boolean;
    emit(event: 'room-leave', room: Room, leaverList: Contact[]): boolean;
    emit(event: 'room-topic', room: Room, topic: string, oldTopic: string, changer: Contact): boolean;
    emit(event: 'scan', url: string, code: number): boolean;
    emit(event: 'watchdog', food: WatchdogFood): boolean;
    emit(event: never, ...args: never[]): never;
    on(event: 'error', listener: (e: Error) => void): this;
    on(event: 'friend', listener: (friend: Contact, request?: FriendRequest) => void): this;
    on(event: 'heartbeat', listener: (data: any) => void): this;
    on(event: 'login', listener: (user: Contact) => void): this;
    on(event: 'logout', listener: (user: Contact) => void): this;
    on(event: 'message', listener: (message: Message) => void): this;
    on(event: 'room-join', listener: (room: Room, inviteeList: Contact[], inviter: Contact) => void): this;
    on(event: 'room-leave', listener: (room: Room, leaverList: Contact[]) => void): this;
    on(event: 'room-topic', listener: (room: Room, topic: string, oldTopic: string, changer: Contact) => void): this;
    on(event: 'scan', listener: (info: ScanInfo) => void): this;
    on(event: 'watchdog', listener: (data: WatchdogFood) => void): this;
    on(event: never, listener: never): never;
    abstract init(): Promise<void>;
    abstract self(): Contact;
    /**
     * Message
     */
    abstract forward(message: MediaMessage, contact: Contact | Room): Promise<boolean>;
    abstract say(content: string): Promise<boolean>;
    abstract send(message: Message | MediaMessage): Promise<boolean>;
    /**
     * Login / Logout
     */
    abstract logonoff(): boolean;
    abstract reset(reason?: string): void;
    abstract logout(): Promise<void>;
    abstract quit(): Promise<void>;
    /**
     * Misc
     */
    abstract ding(): Promise<string>;
    /**
     * FriendRequest
     */
    abstract friendRequestSend(contact: Contact, hello?: string): Promise<any>;
    abstract friendRequestAccept(contact: Contact, ticket: string): Promise<any>;
    /**
     * Room
     */
    abstract roomAdd(room: Room, contact: Contact): Promise<number>;
    abstract roomDel(room: Room, contact: Contact): Promise<number>;
    abstract roomTopic(room: Room, topic: string): Promise<string>;
    abstract roomCreate(contactList: Contact[], topic?: string): Promise<Room>;
    abstract roomFind(filterFunc: string): Promise<Room[]>;
    /**
     * Contact
     */
    abstract contactFind(filterFunc: string): Promise<Contact[]>;
    abstract contactAlias(contact: Contact, alias: string | null): Promise<boolean>;
}
export default Puppet;
