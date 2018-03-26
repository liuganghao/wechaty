export declare type ProfileSection = 'cookies';
export interface ProfileSchema {
    cookies?: any[];
}
export declare class Profile {
    name: string | null;
    private obj;
    private file;
    constructor(name?: string | null);
    toString(): string;
    load(): void;
    save(): void;
    get(section: ProfileSection): null | any;
    set(section: ProfileSection, data: any): void;
    destroy(): void;
}
export default Profile;
