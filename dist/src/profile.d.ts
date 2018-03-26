export declare type ProfileSection = 'cookies';
export interface ProfileSchema {
    cookies?: any[];
    browser?: BrowserConfig;
}
export interface BrowserConfig {
    headless: boolean;
    args?: any[];
    port: number;
    viewpoint: any;
}
export declare class Profile {
    name: string | null;
    obj: ProfileSchema;
    private file;
    constructor(name?: string | null);
    toString(): string;
    private win32;
    private darwin;
    load(): void;
    save(): void;
    get(section: ProfileSection): null | any;
    set(section: ProfileSection, data: any): void;
    destroy(): void;
}
export default Profile;
