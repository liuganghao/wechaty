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
import { EventEmitter } from 'events';
import { Sayable } from './config';
import Contact from './contact';
import { MediaMessage } from './message';
export interface RoomRawMember {
    UserName: string;
    NickName: string;
    DisplayName: string;
}
export interface RoomRawObj {
    UserName: string;
    EncryChatRoomId: string;
    NickName: string;
    OwnerUin: number;
    ChatRoomOwner: string;
    MemberList?: RoomRawMember[];
}
export declare type RoomEventName = 'join' | 'leave' | 'topic' | 'EVENT_PARAM_ERROR';
export interface RoomQueryFilter {
    topic: string | RegExp;
}
export interface MemberQueryFilter {
    name?: string;
    alias?: string;
    roomAlias?: string;
    contactAlias?: string;
}
/**
 * All wechat rooms(groups) will be encapsulated as a Room.
 *
 * `Room` is `Sayable`,
 * [Examples/Room-Bot]{@link https://github.com/Chatie/wechaty/blob/master/examples/room-bot.ts}
 */
export declare class Room extends EventEmitter implements Sayable {
    id: string;
    private static pool;
    private dirtyObj;
    private obj;
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
    isReady(): boolean;
    /**
     * @private
     */
    private readyAllMembers(memberList);
    /**
     * @private
     */
    ready(contactGetter?: (id: string) => Promise<any>): Promise<Room>;
    say(mediaMessage: MediaMessage): any;
    say(content: string): any;
    say(content: string, replyTo: Contact): any;
    say(content: string, replyTo: Contact[]): any;
    on(event: 'leave', listener: (this: Room, leaver: Contact) => void): this;
    on(event: 'join', listener: (this: Room, inviteeList: Contact[], inviter: Contact) => void): this;
    on(event: 'topic', listener: (this: Room, topic: string, oldTopic: string, changer: Contact) => void): this;
    on(event: 'EVENT_PARAM_ERROR', listener: () => void): this;
    /**
     * @private
     */
    get(prop: any): string;
    /**
     * @private
     */
    private parse(rawObj);
    /**
     * @private
     */
    private parseMap(parseContent, memberList?);
    /**
     * @private
     */
    dumpRaw(): void;
    /**
     * @private
     */
    dump(): void;
    /**
     * Add contact in a room
     *
     * @param {Contact} contact
     * @returns {Promise<number>}
     * @example
     * const contact = await Contact.find({name: 'lijiarui'}) // change 'lijiarui' to any contact in your wechat
     * const room = await Room.find({topic: 'wechat'})        // change 'wechat' to any room topic in your wechat
     * if (room) {
     *   const result = await room.add(contact)
     *   if (result) {
     *     console.log(`add ${contact.name()} to ${room.topic()} successfully! `)
     *   } else{
     *     console.log(`failed to add ${contact.name()} to ${room.topic()}! `)
     *   }
     * }
     */
    add(contact: Contact): Promise<number>;
    /**
     * Delete a contact from the room
     * It works only when the bot is the owner of the room
     * @param {Contact} contact
     * @returns {Promise<number>}
     * @example
     * const room = await Room.find({topic: 'wechat'})          // change 'wechat' to any room topic in your wechat
     * const contact = await Contact.find({name: 'lijiarui'})   // change 'lijiarui' to any room member in the room you just set
     * if (room) {
     *   const result = await room.del(contact)
     *   if (result) {
     *     console.log(`remove ${contact.name()} from ${room.topic()} successfully! `)
     *   } else{
     *     console.log(`failed to remove ${contact.name()} from ${room.topic()}! `)
     *   }
     * }
     */
    del(contact: Contact): Promise<number>;
    /**
     * @private
     */
    private delLocal(contact);
    /**
     * @private
     */
    quit(): void;
    topic(): string;
    topic(newTopic: string): void;
    /**
     * should be deprecated
     * @private
     */
    nick(contact: Contact): string | null;
    /**
     * Return contact's roomAlias in the room, the same as roomAlias
     * @param {Contact} contact
     * @returns {string | null} - If a contact has an alias in room, return string, otherwise return null
     * @example
     * const bot = Wechaty.instance()
     * bot
     * .on('message', async m => {
     *   const room = m.room()
     *   const contact = m.from()
     *   if (room) {
     *     const alias = room.alias(contact)
     *     console.log(`${contact.name()} alias is ${alias}`)
     *   }
     * })
     */
    alias(contact: Contact): string | null;
    /**
     * Same as function alias
     * @param {Contact} contact
     * @returns {(string | null)}
     */
    roomAlias(contact: Contact): string | null;
    /**
     * Check if the room has member `contact`.
     *
     * @param {Contact} contact
     * @returns {boolean} Return `true` if has contact, else return `false`.
     * @example <caption>Check whether 'lijiarui' is in the room 'wechaty'</caption>
     * const contact = await Contact.find({name: 'lijiarui'})   // change 'lijiarui' to any of contact in your wechat
     * const room = await Room.find({topic: 'wechaty'})         // change 'wechaty' to any of the room in your wechat
     * if (contact && room) {
     *   if (room.has(contact)) {
     *     console.log(`${contact.name()} is in the room ${room.topic()}!`)
     *   } else {
     *     console.log(`${contact.name()} is not in the room ${room.topic()} !`)
     *   }
     * }
     */
    has(contact: Contact): boolean;
    memberAll(filter: MemberQueryFilter): Contact[];
    memberAll(name: string): Contact[];
    member(name: string): Contact | null;
    member(filter: MemberQueryFilter): Contact | null;
    /**
     * Get all room member from the room
     *
     * @returns {Contact[]}
     */
    memberList(): Contact[];
    /**
     * Create a new room.
     *
     * @static
     * @param {Contact[]} contactList
     * @param {string} [topic]
     * @returns {Promise<Room>}
     * @example <caption>Creat a room with 'lijiarui' and 'juxiaomi', the room topic is 'ding - created'</caption>
     * const helperContactA = await Contact.find({ name: 'lijiarui' })  // change 'lijiarui' to any contact in your wechat
     * const helperContactB = await Contact.find({ name: 'juxiaomi' })  // change 'juxiaomi' to any contact in your wechat
     * const contactList = [helperContactA, helperContactB]
     * console.log('Bot', 'contactList: %s', contactList.join(','))
     * const room = await Room.create(contactList, 'ding')
     * console.log('Bot', 'createDingRoom() new ding room created: %s', room)
     * await room.topic('ding - created')
     * await room.say('ding - created')
     */
    static create(contactList: Contact[], topic?: string): Promise<Room>;
    /**
     * Find room by topic, return all the matched room
     *
     * @static
     * @param {RoomQueryFilter} [query]
     * @returns {Promise<Room[]>}
     * @example
     * const roomList = await Room.findAll()                    // get the room list of the bot
     * const roomList = await Room.findAll({name: 'wechaty'})   // find all of the rooms with name 'wechaty'
     */
    static findAll(query?: RoomQueryFilter): Promise<Room[]>;
    /**
     * Try to find a room by filter: {topic: string | RegExp}. If get many, return the first one.
     *
     * @param {RoomQueryFilter} query
     * @returns {Promise<Room | null>} If can find the room, return Room, or return null
     */
    static find(query: RoomQueryFilter): Promise<Room | null>;
    /**
     * Force reload data for Room
     *
     * @returns {Promise<void>}
     */
    refresh(): Promise<void>;
    /**
     * @private
     * Get room's owner from the room.
     * Not recommend, because cannot always get the owner
     * @returns {(Contact | null)}
     */
    owner(): Contact | null;
    /**
     * @private
     */
    static load(id: string): Room;
}
export default Room;
