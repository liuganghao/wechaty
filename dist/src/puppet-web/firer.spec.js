#!/usr/bin/env ts-node
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
const test = require("blue-tape");
// import * as sinon from 'sinon'
// const sinonTest   = require('sinon-test')(sinon)
const firer_1 = require("./firer");
test('Firer smoke testing', (t) => __awaiter(this, void 0, void 0, function* () {
    t.true(true, 'should be true');
}));
test('parseFriendConfirm()', (t) => __awaiter(this, void 0, void 0, function* () {
    const contentList = [
        [
            'You have added 李卓桓 as your WeChat contact. Start chatting!',
            '李卓桓',
        ],
        [
            '你已添加了李卓桓，现在可以开始聊天了。',
            '李卓桓',
        ],
        [
            `johnbassserver@gmail.com just added you to his/her contacts list. Send a message to him/her now!`,
            `johnbassserver@gmail.com`,
        ],
        [
            `johnbassserver@gmail.com刚刚把你添加到通讯录，现在可以开始聊天了。`,
            `johnbassserver@gmail.com`,
        ],
    ];
    let result;
    contentList.forEach(([content]) => {
        result = firer_1.Firer.parseFriendConfirm(content);
        t.true(result, 'should be truthy for confirm msg: ' + content);
    });
    result = firer_1.Firer.parseFriendConfirm('fsdfsdfasdfasdfadsa');
    t.false(result, 'should be falsy for other msg');
}));
test('parseRoomJoin()', (t) => __awaiter(this, void 0, void 0, function* () {
    const contentList = [
        [
            `You invited 管理员 to the group chat.   `,
            `You`,
            [`管理员`],
        ],
        [
            `You invited 李卓桓.PreAngel、Bruce LEE to the group chat.   `,
            `You`,
            [`李卓桓.PreAngel`, `Bruce LEE`],
        ],
        [
            `管理员 invited 小桔建群助手 to the group chat`,
            `管理员`,
            [`小桔建群助手`],
        ],
        [
            `管理员 invited 庆次、小桔妹 to the group chat`,
            `管理员`,
            ['庆次', '小桔妹'],
        ],
        [
            `你邀请"管理员"加入了群聊  `,
            `你`,
            ['管理员'],
        ],
        [
            `"管理员"邀请"宁锐锋"加入了群聊`,
            `管理员`,
            ['宁锐锋'],
        ],
        [
            `"管理员"通过扫描你分享的二维码加入群聊  `,
            `你`,
            ['管理员'],
        ],
        [
            `" 桔小秘"通过扫描"李佳芮"分享的二维码加入群聊`,
            `李佳芮`,
            ['桔小秘'],
        ],
        [
            `"管理员" joined group chat via the QR code you shared.  `,
            `you`,
            ['管理员'],
        ],
        [
            `"宁锐锋" joined the group chat via the QR Code shared by "管理员".`,
            `管理员`,
            ['宁锐锋'],
        ],
    ];
    let result;
    contentList.forEach(([content, inviter, inviteeList]) => {
        result = firer_1.Firer.parseRoomJoin(content);
        t.ok(result, 'should check room join message right for ' + content);
        t.deepEqual(result[0], inviteeList, 'should get inviteeList right');
        t.is(result[1], inviter, 'should get inviter right');
    });
    t.throws(() => {
        firer_1.Firer.parseRoomJoin('fsadfsadfsdfsdfs');
    }, Error, 'should throws if message is not expected');
}));
test('parseRoomLeave()', (t) => __awaiter(this, void 0, void 0, function* () {
    const contentLeaverList = [
        [
            `You removed "Bruce LEE" from the group chat`,
            `Bruce LEE`,
        ],
        [
            '你将"李佳芮"移出了群聊',
            '李佳芮',
        ],
    ];
    const contentRemoverList = [
        [
            `You were removed from the group chat by "桔小秘"`,
            `桔小秘`,
        ],
        [
            '你被"李佳芮"移出群聊',
            '李佳芮',
        ],
    ];
    contentLeaverList.forEach(([content, leaver]) => {
        const resultLeaver = firer_1.Firer.parseRoomLeave(content)[0];
        t.ok(resultLeaver, 'should get leaver for leave message: ' + content);
        t.is(resultLeaver, leaver, 'should get leaver name right');
    });
    contentRemoverList.forEach(([content, remover]) => {
        const resultRemover = firer_1.Firer.parseRoomLeave(content)[1];
        t.ok(resultRemover, 'should get remover for leave message: ' + content);
        t.is(resultRemover, remover, 'should get leaver name right');
    });
    t.throws(() => {
        firer_1.Firer.parseRoomLeave('fafdsfsdfafa');
    }, Error, 'should throw if message is not expected');
}));
test('parseRoomTopic()', (t) => __awaiter(this, void 0, void 0, function* () {
    const contentList = [
        [
            `"李卓桓.PreAngel" changed the group name to "ding"`,
            `李卓桓.PreAngel`,
            `ding`,
        ],
        [
            '"李佳芮"修改群名为“dong”',
            '李佳芮',
            'dong',
        ],
    ];
    let result;
    contentList.forEach(([content, changer, topic]) => {
        result = firer_1.Firer.parseRoomTopic(content);
        t.ok(result, 'should check topic right for content: ' + content);
        t.is(topic, result[0], 'should get right topic');
        t.is(changer, result[1], 'should get right changer');
    });
    t.throws(() => {
        firer_1.Firer.parseRoomTopic('fafdsfsdfafa');
    }, Error, 'should throw if message is not expected');
}));
//# sourceMappingURL=firer.spec.js.map