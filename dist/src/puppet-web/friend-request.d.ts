import { Contact } from '../contact';
import FriendRequest from '../friend-request';
import { RecommendInfo } from './schema';
/**
 * @alias FriendRequest
 */
export declare class PuppetWebFriendRequest extends FriendRequest {
    info: RecommendInfo;
    private ticket;
    constructor();
    receive(info: RecommendInfo): void;
    confirm(contact: Contact): void;
    /**
     * Send a new friend request
     * @param {Contact} contact
     * @param {string} [hello='Hi']
     * @returns {Promise<boolean>} Return a Promise, true for accept successful, false for failure.
     * @example
     * const from = message.from()
     * const request = new FriendRequest()
     * request.send(from, 'hello~')
     */
    send(contact: Contact, hello?: string): Promise<boolean>;
    /**
     * Accept a friend request
     *
     * @returns {Promise<boolean>} Return a Promise, true for accept successful, false for failure.
     */
    accept(): Promise<boolean>;
}
export default PuppetWebFriendRequest;
