"use strict";
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
 */
const fs = require("fs");
const path = require("path");
const config_1 = require("./config");
const os = require("os");
class Profile {
    constructor(name = config_1.config.profile) {
        this.name = name;
        config_1.log.verbose('Profile', 'constructor(%s)', name);
        if (!name) {
            this.file = null;
        }
        else {
            this.file = path.isAbsolute(name)
                ? name
                : path.join(process.cwd(), name);
            if (!/\.wechaty\.json$/.test(this.file)) {
                this.file += '.wechaty.json';
            }
        }
    }
    toString() {
        return `Profile<${this.name}>`;
    }
    load() {
        config_1.log.verbose('Profile', 'load() file: %s', this.file);
        this.obj = {};
        if (!this.file) {
            config_1.log.verbose('Profile', 'load() no file, NOOP');
            return;
        }
        if (!fs.existsSync(this.file)) {
            config_1.log.verbose('Profile', 'load() file not exist, NOOP');
            return;
        }
        const text = fs.readFileSync(this.file).toString();
        try {
            this.obj = JSON.parse(text);
            if (!this.obj.browser) {
                if (os.platform() == 'darwin') {
                    this.obj.browser = {
                        port: 9225,
                        viewpoint: { width: 1440, height: 826 },
                        headless: true
                    };
                }
                else {
                    this.obj.browser = {
                        port: 9225,
                        viewpoint: { width: 1278, height: 954 },
                        headless: true
                    };
                }
            }
        }
        catch (e) {
            config_1.log.error('Profile', 'load() exception: %s', e);
        }
    }
    save() {
        config_1.log.verbose('Profile', 'save() file: %s', this.file);
        if (!this.file) {
            config_1.log.verbose('Profile', 'save() no file, NOOP');
            return;
        }
        if (!this.obj) {
            config_1.log.verbose('Profile', 'save() no obj, NOOP');
            return;
        }
        try {
            const text = JSON.stringify(this.obj);
            fs.writeFileSync(this.file, text);
        }
        catch (e) {
            config_1.log.error('Profile', 'save() exception: %s', e);
            throw e;
        }
    }
    get(section) {
        config_1.log.verbose('Profile', 'get(%s)', section);
        if (!this.obj) {
            return null;
        }
        return this.obj[section];
    }
    set(section, data) {
        config_1.log.verbose('Profile', 'set(%s, %s)', section, data);
        if (!this.obj) {
            this.obj = {};
        }
        this.obj[section] = data;
    }
    destroy() {
        config_1.log.verbose('Profile', 'destroy() file: %s', this.file);
        this.obj = {};
        if (this.file && fs.existsSync(this.file)) {
            fs.unlinkSync(this.file);
            this.file = null;
        }
    }
}
exports.Profile = Profile;
exports.default = Profile;
//# sourceMappingURL=profile.js.map