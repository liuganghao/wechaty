import Contact from './contact';
/**
 * Send, receive friend request, and friend confirmation events.
 *
 * 1. send request
 * 2. receive request(in friend event)
 * 3. confirmation friendship(friend event)
 *
 * [Examples/Friend-Bot]{@link https://github.com/Chatie/wechaty/blob/master/examples/friend-bot.ts}
 */
export declare abstract class FriendRequest {
    contact: Contact;
    hello: string;
    type: 'send' | 'receive' | 'confirm';
    constructor();
    abstract send(contact: Contact, hello: string): Promise<boolean>;
    abstract accept(): Promise<boolean>;
}
export default FriendRequest;
