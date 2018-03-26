"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const events_1 = require("events");
const config_1 = require("./config");
const contact_1 = require("./contact");
const message_1 = require("./message");
const misc_1 = require("./misc");
/**
 * All wechat rooms(groups) will be encapsulated as a Room.
 *
 * `Room` is `Sayable`,
 * [Examples/Room-Bot]{@link https://github.com/Chatie/wechaty/blob/master/examples/room-bot.ts}
 */
class Room extends events_1.EventEmitter {
    /**
     * @private
     */
    constructor(id) {
        super();
        this.id = id;
        config_1.log.silly('Room', `constructor(${id})`);
    }
    /**
     * @private
     */
    toString() { return `@Room<${this.topic()}>`; }
    /**
     * @private
     */
    toStringEx() { return `Room(${this.obj && this.obj.topic}[${this.id}])`; }
    /**
     * @private
     */
    isReady() {
        return !!(this.obj && this.obj.memberList && this.obj.memberList.length);
    }
    /**
     * @private
     */
    readyAllMembers(memberList) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const member of memberList) {
                const contact = contact_1.default.load(member.UserName);
                yield contact.ready();
            }
            return;
        });
    }
    /**
     * @private
     */
    ready(contactGetter) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('Room', 'ready(%s)', contactGetter ? contactGetter.constructor.name : '');
            if (!this.id) {
                const e = new Error('ready() on a un-inited Room');
                config_1.log.warn('Room', e.message);
                throw e;
            }
            else if (this.isReady()) {
                return this;
            }
            else if (this.obj && this.obj.id) {
                config_1.log.verbose('Room', 'ready() is not full loaded in room<topic:%s>. reloading', this.obj.topic);
            }
            if (!contactGetter) {
                contactGetter = config_1.config.puppetInstance()
                    .getContact.bind(config_1.config.puppetInstance());
            }
            if (!contactGetter) {
                throw new Error('no contactGetter');
            }
            try {
                let ttl = 7;
                while (ttl--) {
                    const roomRawObj = yield contactGetter(this.id);
                    const currNum = roomRawObj.MemberList && roomRawObj.MemberList.length || 0;
                    const prevNum = this.rawObj && this.rawObj.MemberList && this.rawObj.MemberList.length || 0;
                    config_1.log.silly('Room', `ready() contactGetter(%s) MemberList.length:%d at ttl:%d`, this.id, currNum, ttl);
                    if (currNum) {
                        if (prevNum === currNum) {
                            config_1.log.verbose('Room', `ready() contactGetter(${this.id}) done at ttl:%d`, ttl);
                            break;
                        }
                        this.rawObj = roomRawObj;
                    }
                    config_1.log.silly('Room', `ready() contactGetter(${this.id}) retry at ttl:%d`, ttl);
                    yield new Promise(r => setTimeout(r, 1000)); // wait for 1 second
                }
                yield this.readyAllMembers(this.rawObj && this.rawObj.MemberList || []);
                this.obj = this.parse(this.rawObj);
                if (!this.obj) {
                    throw new Error('no this.obj set after contactGetter');
                }
                yield Promise.all(this.obj.memberList.map(c => c.ready(contactGetter)));
                return this;
            }
            catch (e) {
                config_1.log.error('Room', 'contactGetter(%s) exception: %s', this.id, e.message);
                config_1.Raven.captureException(e);
                throw e;
            }
        });
    }
    /**
     * Send message inside Room, if set [replyTo], wechaty will mention the contact as well.
     *
     * @param {(string | MediaMessage)} textOrMedia - Send `text` or `media file` inside Room.
     * @param {(Contact | Contact[])} [replyTo] - Optional parameter, send content inside Room, and mention @replyTo contact or contactList.
     * @returns {Promise<boolean>}
     * If bot send message successfully, it will return true. If the bot failed to send for blocking or any other reason, it will return false
     *
     * @example <caption>Send text inside Room</caption>
     * const room = await Room.find({name: 'wechaty'})        // change 'wechaty' to any of your room in wechat
     * await room.say('Hello world!')
     *
     * @example <caption>Send media file inside Room</caption>
     * const room = await Room.find({name: 'wechaty'})        // change 'wechaty' to any of your room in wechat
     * await room.say(new MediaMessage('/test.jpg'))          // put the filePath you want to send here
     *
     * @example <caption>Send text inside Room, and mention @replyTo contact</caption>
     * const contact = await Contact.find({name: 'lijiarui'}) // change 'lijiarui' to any of the room member
     * const room = await Room.find({name: 'wechaty'})        // change 'wechaty' to any of your room in wechat
     * await room.say('Hello world!', contact)
     */
    say(textOrMedia, replyTo) {
        const content = textOrMedia instanceof message_1.MediaMessage ? textOrMedia.filename() : textOrMedia;
        config_1.log.verbose('Room', 'say(%s, %s)', content, Array.isArray(replyTo)
            ? replyTo.map(c => c.name()).join(', ')
            : replyTo ? replyTo.name() : '');
        let m;
        if (typeof textOrMedia === 'string') {
            m = new message_1.Message();
            const replyToList = [].concat(replyTo || []);
            if (replyToList.length > 0) {
                const AT_SEPRATOR = String.fromCharCode(8197);
                const mentionList = replyToList.map(c => '@' + c.name()).join(AT_SEPRATOR);
                m.content(mentionList + ' ' + content);
            }
            else {
                m.content(content);
            }
            // m.to(replyToList[0])
        }
        else
            m = textOrMedia;
        m.room(this);
        return config_1.config.puppetInstance()
            .send(m);
    }
    /**
     * @desc       Room Class Event Type
     * @typedef    RoomEventName
     * @property   {string}  join  - Emit when anyone join any room.
     * @property   {string}  topic - Get topic event, emitted when someone change room topic.
     * @property   {string}  leave - Emit when anyone leave the room.<br>
     *                               If someone leaves the room by themselves, wechat will not notice other people in the room, so the bot will never get the "leave" event.
     */
    /**
     * @desc       Room Class Event Function
     * @typedef    RoomEventFunction
     * @property   {Function} room-join       - (this: Room, inviteeList: Contact[] , inviter: Contact)  => void
     * @property   {Function} room-topic      - (this: Room, topic: string, oldTopic: string, changer: Contact) => void
     * @property   {Function} room-leave      - (this: Room, leaver: Contact) => void
     */
    /**
     * @listens Room
     * @param   {RoomEventName}      event      - Emit WechatyEvent
     * @param   {RoomEventFunction}  listener   - Depends on the WechatyEvent
     * @return  {this}                          - this for chain
     *
     * @example <caption>Event:join </caption>
     * const room = await Room.find({topic: 'event-room'}) // change `event-room` to any room topic in your wechat
     * if (room) {
     *   room.on('join', (room: Room, inviteeList: Contact[], inviter: Contact) => {
     *     const nameList = inviteeList.map(c => c.name()).join(',')
     *     console.log(`Room ${room.topic()} got new member ${nameList}, invited by ${inviter}`)
     *   })
     * }
     *
     * @example <caption>Event:leave </caption>
     * const room = await Room.find({topic: 'event-room'}) // change `event-room` to any room topic in your wechat
     * if (room) {
     *   room.on('leave', (room: Room, leaverList: Contact[]) => {
     *     const nameList = leaverList.map(c => c.name()).join(',')
     *     console.log(`Room ${room.topic()} lost member ${nameList}`)
     *   })
     * }
     *
     * @example <caption>Event:topic </caption>
     * const room = await Room.find({topic: 'event-room'}) // change `event-room` to any room topic in your wechat
     * if (room) {
     *   room.on('topic', (room: Room, topic: string, oldTopic: string, changer: Contact) => {
     *     console.log(`Room ${room.topic()} topic changed from ${oldTopic} to ${topic} by ${changer.name()}`)
     *   })
     * }
     *
     */
    on(event, listener) {
        config_1.log.verbose('Room', 'on(%s, %s)', event, typeof listener);
        super.on(event, listener); // Room is `Sayable`
        return this;
    }
    /**
     * @private
     */
    get(prop) { return (this.obj && this.obj[prop]) || (this.dirtyObj && this.dirtyObj[prop]); }
    /**
     * @private
     */
    parse(rawObj) {
        if (!rawObj) {
            config_1.log.warn('Room', 'parse() on a empty rawObj?');
            return null;
        }
        const memberList = (rawObj.MemberList || [])
            .map(m => contact_1.default.load(m.UserName));
        const nameMap = this.parseMap('name', rawObj.MemberList);
        const roomAliasMap = this.parseMap('roomAlias', rawObj.MemberList);
        const contactAliasMap = this.parseMap('contactAlias', rawObj.MemberList);
        return {
            id: rawObj.UserName,
            encryId: rawObj.EncryChatRoomId,
            topic: rawObj.NickName,
            ownerUin: rawObj.OwnerUin,
            memberList,
            nameMap,
            roomAliasMap,
            contactAliasMap,
        };
    }
    /**
     * @private
     */
    parseMap(parseContent, memberList) {
        const mapList = new Map();
        if (memberList && memberList.map) {
            memberList.forEach(member => {
                let tmpName;
                const contact = contact_1.default.load(member.UserName);
                switch (parseContent) {
                    case 'name':
                        tmpName = contact.name();
                        break;
                    case 'roomAlias':
                        tmpName = member.DisplayName;
                        break;
                    case 'contactAlias':
                        tmpName = contact.alias() || '';
                        break;
                    default:
                        throw new Error('parseMap failed, member not found');
                }
                /**
                 * ISSUE #64 emoji need to be striped
                 * ISSUE #104 never use remark name because sys group message will never use that
                 * @rui: Wrong for 'never use remark name because sys group message will never use that', see more in the latest comment in #104
                 * @rui: webwx's NickName here return contactAlias, if not set contactAlias, return name
                 * @rui: 2017-7-2 webwx's NickName just ruturn name, no contactAlias
                 */
                mapList[member.UserName] = misc_1.default.stripEmoji(tmpName);
            });
        }
        return mapList;
    }
    /**
     * @private
     */
    dumpRaw() {
        console.error('======= dump raw Room =======');
        Object.keys(this.rawObj).forEach(k => console.error(`${k}: ${this.rawObj[k]}`));
    }
    /**
     * @private
     */
    dump() {
        console.error('======= dump Room =======');
        if (!this.obj) {
            throw new Error('no this.obj');
        }
        Object.keys(this.obj).forEach(k => console.error(`${k}: ${this.obj && this.obj[k]}`));
    }
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
    add(contact) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Room', 'add(%s)', contact);
            if (!contact) {
                throw new Error('contact not found');
            }
            const n = config_1.config.puppetInstance()
                .roomAdd(this, contact);
            return n;
        });
    }
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
    del(contact) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Room', 'del(%s)', contact.name());
            if (!contact) {
                throw new Error('contact not found');
            }
            const n = yield config_1.config.puppetInstance()
                .roomDel(this, contact)
                .then(_ => this.delLocal(contact));
            return n;
        });
    }
    /**
     * @private
     */
    delLocal(contact) {
        config_1.log.verbose('Room', 'delLocal(%s)', contact);
        const memberList = this.obj && this.obj.memberList;
        if (!memberList || memberList.length === 0) {
            return 0; // already in refreshing
        }
        let i;
        for (i = 0; i < memberList.length; i++) {
            if (memberList[i].id === contact.id) {
                break;
            }
        }
        if (i < memberList.length) {
            memberList.splice(i, 1);
            return 1;
        }
        return 0;
    }
    /**
     * @private
     */
    quit() {
        throw new Error('wx web not implement yet');
        // WechatyBro.glue.chatroomFactory.quit("@@1c066dfcab4ef467cd0a8da8bec90880035aa46526c44f504a83172a9086a5f7"
    }
    /**
     * SET/GET topic from the room
     *
     * @param {string} [newTopic] If set this para, it will change room topic.
     * @returns {(string | void)}
     *
     * @example <caption>When you say anything in a room, it will get room topic. </caption>
     * const bot = Wechaty.instance()
     * bot
     * .on('message', async m => {
     *   const room = m.room()
     *   if (room) {
     *     const topic = room.topic()
     *     console.log(`room topic is : ${topic}`)
     *   }
     * })
     *
     * @example <caption>When you say anything in a room, it will change room topic. </caption>
     * const bot = Wechaty.instance()
     * bot
     * .on('message', async m => {
     *   const room = m.room()
     *   if (room) {
     *     const oldTopic = room.topic()
     *     room.topic('change topic to wechaty!')
     *     console.log(`room topic change from ${oldTopic} to ${room.topic()}`)
     *   }
     * })
     */
    topic(newTopic) {
        config_1.log.verbose('Room', 'topic(%s)', newTopic ? newTopic : '');
        if (!this.isReady()) {
            config_1.log.warn('Room', 'topic() room not ready');
        }
        if (typeof newTopic === 'undefined') {
            return misc_1.default.plainText(this.obj ? this.obj.topic : '');
        }
        config_1.config.puppetInstance()
            .roomTopic(this, newTopic)
            .catch(e => {
            config_1.log.warn('Room', 'topic(newTopic=%s) exception: %s', newTopic, e && e.message || e);
            config_1.Raven.captureException(e);
        });
        if (!this.obj) {
            this.obj = {};
        }
        this.obj['topic'] = newTopic;
        return;
    }
    /**
     * should be deprecated
     * @private
     */
    nick(contact) {
        config_1.log.warn('Room', 'nick(Contact) DEPRECATED, use alias(Contact) instead.');
        return this.alias(contact);
    }
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
    alias(contact) {
        return this.roomAlias(contact);
    }
    /**
     * Same as function alias
     * @param {Contact} contact
     * @returns {(string | null)}
     */
    roomAlias(contact) {
        if (!this.obj || !this.obj.roomAliasMap) {
            return null;
        }
        return this.obj.roomAliasMap[contact.id] || null;
    }
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
    has(contact) {
        if (!this.obj || !this.obj.memberList) {
            return false;
        }
        return this.obj.memberList
            .filter(c => c.id === contact.id)
            .length > 0;
    }
    /**
     * The way to search member by Room.member()
     *
     * @typedef    MemberQueryFilter
     * @property   {string} name            -Find the contact by wechat name in a room, equal to `Contact.name()`.
     * @property   {string} alias           -Find the contact by alias set by the bot for others in a room, equal to `roomAlias`.
     * @property   {string} roomAlias       -Find the contact by alias set by the bot for others in a room.
     * @property   {string} contactAlias    -Find the contact by alias set by the contact out of a room, equal to `Contact.alias()`.
     * [More Detail]{@link https://github.com/Chatie/wechaty/issues/365}
     */
    /**
     * Find all contacts in a room
     *
     * #### definition
     * - `name`                 the name-string set by user-self, should be called name, equal to `Contact.name()`
     * - `roomAlias` | `alias`  the name-string set by user-self in the room, should be called roomAlias
     * - `contactAlias`         the name-string set by bot for others, should be called alias, equal to `Contact.alias()`
     * @param {(MemberQueryFilter | string)} queryArg -When use memberAll(name:string), return all matched members, including name, roomAlias, contactAlias
     * @returns {Contact[]}
     * @memberof Room
     */
    memberAll(queryArg) {
        if (typeof queryArg === 'string') {
            //
            // use the following `return` statement to do this job.
            //
            // const nameList = this.memberAll({name: queryArg})
            // const roomAliasList = this.memberAll({roomAlias: queryArg})
            // const contactAliasList = this.memberAll({contactAlias: queryArg})
            // if (nameList) {
            //   contactList = contactList.concat(nameList)
            // }
            // if (roomAliasList) {
            //   contactList = contactList.concat(roomAliasList)
            // }
            // if (contactAliasList) {
            //   contactList = contactList.concat(contactAliasList)
            // }
            return [].concat(this.memberAll({ name: queryArg }), this.memberAll({ roomAlias: queryArg }), this.memberAll({ contactAlias: queryArg }));
        }
        /**
         * We got filter parameter
         */
        config_1.log.silly('Room', 'memberAll({ %s })', Object.keys(queryArg)
            .map(k => `${k}: ${queryArg[k]}`)
            .join(', '));
        if (Object.keys(queryArg).length !== 1) {
            throw new Error('Room member find queryArg only support one key. multi key support is not availble now.');
        }
        if (!this.obj || !this.obj.memberList) {
            config_1.log.warn('Room', 'member() not ready');
            return [];
        }
        const filterKey = Object.keys(queryArg)[0];
        /**
         * ISSUE #64 emoji need to be striped
         */
        const filterValue = misc_1.default.stripEmoji(misc_1.default.plainText(queryArg[filterKey]));
        const keyMap = {
            contactAlias: 'contactAliasMap',
            name: 'nameMap',
            alias: 'roomAliasMap',
            roomAlias: 'roomAliasMap',
        };
        const filterMapName = keyMap[filterKey];
        if (!filterMapName) {
            throw new Error('unsupport filter key: ' + filterKey);
        }
        if (!filterValue) {
            throw new Error('filterValue not found');
        }
        const filterMap = this.obj[filterMapName];
        const idList = Object.keys(filterMap)
            .filter(id => filterMap[id] === filterValue);
        config_1.log.silly('Room', 'memberAll() check %s from %s: %s', filterValue, filterKey, JSON.stringify(filterMap));
        if (idList.length) {
            return idList.map(id => contact_1.default.load(id));
        }
        else {
            return [];
        }
    }
    /**
     * Find all contacts in a room, if get many, return the first one.
     *
     * @param {(MemberQueryFilter | string)} queryArg -When use member(name:string), return all matched members, including name, roomAlias, contactAlias
     * @returns {(Contact | null)}
     *
     * @example <caption>Find member by name</caption>
     * const room = await Room.find({topic: 'wechaty'})           // change 'wechaty' to any room name in your wechat
     * if (room) {
     *   const member = room.member('lijiarui')                   // change 'lijiarui' to any room member in your wechat
     *   if (member) {
     *     console.log(`${room.topic()} got the member: ${member.name()}`)
     *   } else {
     *     console.log(`cannot get member in room: ${room.topic()}`)
     *   }
     * }
     *
     * @example <caption>Find member by MemberQueryFilter</caption>
     * const room = await Room.find({topic: 'wechaty'})          // change 'wechaty' to any room name in your wechat
     * if (room) {
     *   const member = room.member({name: 'lijiarui'})          // change 'lijiarui' to any room member in your wechat
     *   if (member) {
     *     console.log(`${room.topic()} got the member: ${member.name()}`)
     *   } else {
     *     console.log(`cannot get member in room: ${room.topic()}`)
     *   }
     * }
     */
    member(queryArg) {
        config_1.log.verbose('Room', 'member(%s)', JSON.stringify(queryArg));
        let memberList;
        // ISSUE #622
        // error TS2345: Argument of type 'string | MemberQueryFilter' is not assignable to parameter of type 'MemberQueryFilter' #622
        if (typeof queryArg === 'string') {
            memberList = this.memberAll(queryArg);
        }
        else {
            memberList = this.memberAll(queryArg);
        }
        if (!memberList || !memberList.length) {
            return null;
        }
        if (memberList.length > 1) {
            config_1.log.warn('Room', 'member(%s) get %d contacts, use the first one by default', JSON.stringify(queryArg), memberList.length);
        }
        return memberList[0];
    }
    /**
     * Get all room member from the room
     *
     * @returns {Contact[]}
     */
    memberList() {
        config_1.log.verbose('Room', 'memberList');
        if (!this.obj || !this.obj.memberList || this.obj.memberList.length < 1) {
            config_1.log.warn('Room', 'memberList() not ready');
            config_1.log.verbose('Room', 'memberList() trying call refresh() to update');
            this.refresh().then(() => {
                config_1.log.verbose('Room', 'memberList() refresh() done');
            });
            return [];
        }
        return this.obj.memberList;
    }
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
    static create(contactList, topic) {
        config_1.log.verbose('Room', 'create(%s, %s)', contactList.join(','), topic);
        if (!contactList || !Array.isArray(contactList)) {
            throw new Error('contactList not found');
        }
        return config_1.config.puppetInstance()
            .roomCreate(contactList, topic)
            .catch(e => {
            config_1.log.error('Room', 'create() exception: %s', e && e.stack || e.message || e);
            config_1.Raven.captureException(e);
            throw e;
        });
    }
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
    static findAll(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query) {
                query = { topic: /.*/ };
            }
            config_1.log.verbose('Room', 'findAll({ topic: %s })', query.topic);
            let topicFilter = query.topic;
            if (!topicFilter) {
                throw new Error('topicFilter not found');
            }
            let filterFunction;
            if (topicFilter instanceof RegExp) {
                filterFunction = `(function (c) { return ${topicFilter.toString()}.test(c) })`;
            }
            else if (typeof topicFilter === 'string') {
                topicFilter = topicFilter.replace(/'/g, '\\\'');
                filterFunction = `(function (c) { return c === '${topicFilter}' })`;
            }
            else {
                throw new Error('unsupport topic type');
            }
            const roomList = yield config_1.config.puppetInstance()
                .roomFind(filterFunction)
                .catch(e => {
                config_1.log.verbose('Room', 'findAll() rejected: %s', e.message);
                config_1.Raven.captureException(e);
                return []; // fail safe
            });
            yield Promise.all(roomList.map(room => room.ready()));
            // for (let i = 0; i < roomList.length; i++) {
            //   await roomList[i].ready()
            // }
            return roomList;
        });
    }
    /**
     * Try to find a room by filter: {topic: string | RegExp}. If get many, return the first one.
     *
     * @param {RoomQueryFilter} query
     * @returns {Promise<Room | null>} If can find the room, return Room, or return null
     */
    static find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Room', 'find({ topic: %s })', query.topic);
            const roomList = yield Room.findAll(query);
            if (!roomList || roomList.length < 1) {
                return null;
            }
            else if (roomList.length > 1) {
                config_1.log.warn('Room', 'find() got more than one result, return the 1st one.');
            }
            return roomList[0];
        });
    }
    /**
     * Force reload data for Room
     *
     * @returns {Promise<void>}
     */
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isReady()) {
                this.dirtyObj = this.obj;
            }
            this.obj = null;
            yield this.ready();
            return;
        });
    }
    /**
     * @private
     * Get room's owner from the room.
     * Not recommend, because cannot always get the owner
     * @returns {(Contact | null)}
     */
    owner() {
        const ownerUin = this.obj && this.obj.ownerUin;
        const user = config_1.config.puppetInstance()
            .user;
        if (user && user.get('uin') === ownerUin) {
            return user;
        }
        if (this.rawObj.ChatRoomOwner) {
            return contact_1.default.load(this.rawObj.ChatRoomOwner);
        }
        config_1.log.info('Room', 'owner() is limited by Tencent API, sometimes work sometimes not');
        return null;
    }
    /**
     * @private
     */
    static load(id) {
        if (!id) {
            throw new Error('Room.load() no id');
        }
        if (id in Room.pool) {
            return Room.pool[id];
        }
        return Room.pool[id] = new Room(id);
    }
}
Room.pool = new Map();
exports.Room = Room;
exports.default = Room;
//# sourceMappingURL=room.js.map