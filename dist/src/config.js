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
const os = require("os");
const path = require("path");
const readPkgUp = require("read-pkg-up");
const Raven = require("raven");
exports.Raven = Raven;
const brolog_1 = require("brolog");
const pkg = readPkgUp.sync({ cwd: __dirname }).pkg;
exports.VERSION = pkg.version;
/**
 * Raven.io
 */
Raven.disableConsoleAlerts();
Raven
    .config(process.env.NODE_ENV === 'production'
    && 'https://f6770399ee65459a82af82650231b22c:d8d11b283deb441e807079b8bb2c45cd@sentry.io/179672', {
    release: exports.VERSION,
    tags: {
        git_commit: '',
        platform: !!process.env['WECHATY_DOCKER']
            ? 'docker'
            : os.platform(),
    },
})
    .install();
/*
try {
    doSomething(a[0])
} catch (e) {
    Raven.captureException(e)
}

Raven.context(function () {
  doSomething(a[0])
})
 */
exports.log = new brolog_1.default();
const logLevel = process.env['WECHATY_LOG'] || 'info';
if (logLevel) {
    exports.log.level(logLevel.toLowerCase());
    exports.log.silly('Brolog', 'WECHATY_LOG set level to %s', logLevel);
}
/**
 * to handle unhandled exceptions
 */
if (/verbose|silly/i.test(exports.log.level())) {
    exports.log.info('Config', 'registering process.on("unhandledRejection") for development/debug');
    process.on('unhandledRejection', (reason, promise) => {
        exports.log.error('Config', '###########################');
        exports.log.error('Config', 'unhandledRejection: %s %s', reason, promise);
        exports.log.error('Config', '###########################');
        promise.catch(err => {
            exports.log.error('Config', 'process.on(unhandledRejection) promise.catch(%s)', err.message);
            console.error('Config', err); // I don't know if log.error has similar full trace print support like console.error
        });
    });
}
/* tslint:disable:variable-name */
/* tslint:disable:no-var-requires */
exports.DEFAULT_SETTING = pkg.wechaty;
class Config {
    constructor() {
        this.default = exports.DEFAULT_SETTING;
        this.apihost = process.env['WECHATY_APIHOST'] || exports.DEFAULT_SETTING.DEFAULT_APIHOST;
        this.head = ('WECHATY_HEAD' in process.env) ? (!!process.env['WECHATY_HEAD']) : (!!(exports.DEFAULT_SETTING.DEFAULT_HEAD));
        this.puppet = (process.env['WECHATY_PUPPET'] || exports.DEFAULT_SETTING.DEFAULT_PUPPET);
        this.profile = process.env['WECHATY_PROFILE'] || null; // DO NOT set DEFAULT_PROFILE, because sometimes user do not want to save session
        this.token = process.env['WECHATY_TOKEN'] || null; // DO NOT set DEFAULT, because sometimes user do not want to connect to io cloud service
        this.debug = !!(process.env['WECHATY_DEBUG']);
        this.httpPort = process.env['PORT'] || process.env['WECHATY_PORT'] || exports.DEFAULT_SETTING.DEFAULT_PORT;
        this.docker = !!(process.env['WECHATY_DOCKER']);
        this._puppetInstance = null;
        exports.log.verbose('Config', 'constructor()');
        this.validApiHost(this.apihost);
    }
    puppetInstance(instance) {
        if (typeof instance === 'undefined') {
            if (!this._puppetInstance) {
                throw new Error('no puppet instance');
            }
            return this._puppetInstance;
        }
        else if (instance === null) {
            exports.log.verbose('Config', 'puppetInstance(null)');
            this._puppetInstance = null;
            return;
        }
        exports.log.verbose('Config', 'puppetInstance(%s)', instance.constructor.name);
        this._puppetInstance = instance;
        return;
    }
    gitRevision() {
        const dotGitPath = path.join(__dirname, '..', '.git'); // only for ts-node, not for dist
        // const gitLogArgs  = ['log', '--oneline', '-1']
        // TODO: use git rev-parse HEAD ?
        const gitArgs = ['rev-parse', 'HEAD'];
        try {
            // Make sure this is a Wechaty repository
            fs.statSync(dotGitPath).isDirectory();
            const ss = require('child_process')
                .spawnSync('git', gitArgs, { cwd: __dirname });
            if (ss.status !== 0) {
                throw new Error(ss.error);
            }
            const revision = ss.stdout
                .toString()
                .trim()
                .slice(0, 7);
            return revision;
        }
        catch (e) {
            /**
             *  1. .git not exist
             *  2. git log fail
             */
            exports.log.silly('Wechaty', 'version() form development environment is not availble: %s', e.message);
            return null;
        }
    }
    validApiHost(apihost) {
        if (/^[a-zA-Z0-9\.\-\_]+:?[0-9]*$/.test(apihost)) {
            return true;
        }
        throw new Error('validApiHost() fail for ' + apihost);
    }
}
exports.Config = Config;
exports.config = new Config();
exports.default = exports.config;
//# sourceMappingURL=config.js.map