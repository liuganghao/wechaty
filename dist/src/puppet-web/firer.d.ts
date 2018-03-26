import Message from '../message';
export declare const Firer: {
    checkFriendConfirm: (m: Message) => Promise<void>;
    checkFriendRequest: (m: Message) => Promise<void>;
    checkRoomJoin: (m: Message) => Promise<boolean>;
    checkRoomLeave: (m: Message) => Promise<boolean>;
    checkRoomTopic: (m: Message) => Promise<boolean>;
    parseFriendConfirm: (content: string) => boolean;
    parseRoomJoin: (content: string) => [string[], string];
    parseRoomLeave: (content: string) => [string, string];
    parseRoomTopic: (content: string) => [string, string];
};
export default Firer;
