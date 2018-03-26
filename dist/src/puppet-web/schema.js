"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * Enum for AppMsgType values.
 *
 * @enum {number}
 * @property {number} TEXT                    - AppMsgType.TEXT                     (1)     for TEXT
 * @property {number} IMG                     - AppMsgType.IMG                      (2)      for IMG
 * @property {number} AUDIO                   - AppMsgType.AUDIO                    (3)      for AUDIO
 * @property {number} VIDEO                   - AppMsgType.VIDEO                    (4)      for VIDEO
 * @property {number} URL                     - AppMsgType.URL                      (5)      for URL
 * @property {number} ATTACH                  - AppMsgType.ATTACH                   (6)      for ATTACH
 * @property {number} OPEN                    - AppMsgType.OPEN                     (7)      for OPEN
 * @property {number} EMOJI                   - AppMsgType.EMOJI                    (8)      for EMOJI
 * @property {number} VOICE_REMIND            - AppMsgType.VOICE_REMIND             (9)      for VOICE_REMIND
 * @property {number} SCAN_GOOD               - AppMsgType.SCAN_GOOD                (10)     for SCAN_GOOD
 * @property {number} GOOD                    - AppMsgType.GOOD                     (13)     for GOOD
 * @property {number} EMOTION                 - AppMsgType.EMOTION                  (15)     for EMOTION
 * @property {number} CARD_TICKET             - AppMsgType.CARD_TICKET              (16)     for CARD_TICKET
 * @property {number} REALTIME_SHARE_LOCATION - AppMsgType.REALTIME_SHARE_LOCATION  (17)     for REALTIME_SHARE_LOCATION
 * @property {number} TRANSFERS               - AppMsgType.TRANSFERS                (2e3)    for TRANSFERS
 * @property {number} RED_ENVELOPES           - AppMsgType.RED_ENVELOPES            (2001)   for RED_ENVELOPES
 * @property {number} READER_TYPE             - AppMsgType.READER_TYPE              (100001) for READER_TYPE
 */
var AppMsgType;
(function (AppMsgType) {
    AppMsgType[AppMsgType["TEXT"] = 1] = "TEXT";
    AppMsgType[AppMsgType["IMG"] = 2] = "IMG";
    AppMsgType[AppMsgType["AUDIO"] = 3] = "AUDIO";
    AppMsgType[AppMsgType["VIDEO"] = 4] = "VIDEO";
    AppMsgType[AppMsgType["URL"] = 5] = "URL";
    AppMsgType[AppMsgType["ATTACH"] = 6] = "ATTACH";
    AppMsgType[AppMsgType["OPEN"] = 7] = "OPEN";
    AppMsgType[AppMsgType["EMOJI"] = 8] = "EMOJI";
    AppMsgType[AppMsgType["VOICE_REMIND"] = 9] = "VOICE_REMIND";
    AppMsgType[AppMsgType["SCAN_GOOD"] = 10] = "SCAN_GOOD";
    AppMsgType[AppMsgType["GOOD"] = 13] = "GOOD";
    AppMsgType[AppMsgType["EMOTION"] = 15] = "EMOTION";
    AppMsgType[AppMsgType["CARD_TICKET"] = 16] = "CARD_TICKET";
    AppMsgType[AppMsgType["REALTIME_SHARE_LOCATION"] = 17] = "REALTIME_SHARE_LOCATION";
    AppMsgType[AppMsgType["TRANSFERS"] = 2000] = "TRANSFERS";
    AppMsgType[AppMsgType["RED_ENVELOPES"] = 2001] = "RED_ENVELOPES";
    AppMsgType[AppMsgType["READER_TYPE"] = 100001] = "READER_TYPE";
})(AppMsgType = exports.AppMsgType || (exports.AppMsgType = {}));
/**
 *
 * Enum for MsgType values.
 * @enum {number}
 * @property {number} TEXT                - MsgType.TEXT                (1)     for TEXT
 * @property {number} IMAGE               - MsgType.IMAGE               (3)     for IMAGE
 * @property {number} VOICE               - MsgType.VOICE               (34)    for VOICE
 * @property {number} VERIFYMSG           - MsgType.VERIFYMSG           (37)    for VERIFYMSG
 * @property {number} POSSIBLEFRIEND_MSG  - MsgType.POSSIBLEFRIEND_MSG  (40)    for POSSIBLEFRIEND_MSG
 * @property {number} SHARECARD           - MsgType.SHARECARD           (42)    for SHARECARD
 * @property {number} VIDEO               - MsgType.VIDEO               (43)    for VIDEO
 * @property {number} EMOTICON            - MsgType.EMOTICON            (47)    for EMOTICON
 * @property {number} LOCATION            - MsgType.LOCATION            (48)    for LOCATION
 * @property {number} APP                 - MsgType.APP                 (49)    for APP
 * @property {number} VOIPMSG             - MsgType.VOIPMSG             (50)    for VOIPMSG
 * @property {number} STATUSNOTIFY        - MsgType.STATUSNOTIFY        (51)    for STATUSNOTIFY
 * @property {number} VOIPNOTIFY          - MsgType.VOIPNOTIFY          (52)    for VOIPNOTIFY
 * @property {number} VOIPINVITE          - MsgType.VOIPINVITE          (53)    for VOIPINVITE
 * @property {number} MICROVIDEO          - MsgType.MICROVIDEO          (62)    for MICROVIDEO
 * @property {number} SYSNOTICE           - MsgType.SYSNOTICE           (9999)  for SYSNOTICE
 * @property {number} SYS                 - MsgType.SYS                 (10000) for SYS
 * @property {number} RECALLED            - MsgType.RECALLED            (10002) for RECALLED
 */
var MsgType;
(function (MsgType) {
    MsgType[MsgType["TEXT"] = 1] = "TEXT";
    MsgType[MsgType["IMAGE"] = 3] = "IMAGE";
    MsgType[MsgType["VOICE"] = 34] = "VOICE";
    MsgType[MsgType["VERIFYMSG"] = 37] = "VERIFYMSG";
    MsgType[MsgType["POSSIBLEFRIEND_MSG"] = 40] = "POSSIBLEFRIEND_MSG";
    MsgType[MsgType["SHARECARD"] = 42] = "SHARECARD";
    MsgType[MsgType["VIDEO"] = 43] = "VIDEO";
    MsgType[MsgType["EMOTICON"] = 47] = "EMOTICON";
    MsgType[MsgType["LOCATION"] = 48] = "LOCATION";
    MsgType[MsgType["APP"] = 49] = "APP";
    MsgType[MsgType["VOIPMSG"] = 50] = "VOIPMSG";
    MsgType[MsgType["STATUSNOTIFY"] = 51] = "STATUSNOTIFY";
    MsgType[MsgType["VOIPNOTIFY"] = 52] = "VOIPNOTIFY";
    MsgType[MsgType["VOIPINVITE"] = 53] = "VOIPINVITE";
    MsgType[MsgType["MICROVIDEO"] = 62] = "MICROVIDEO";
    MsgType[MsgType["SYSNOTICE"] = 9999] = "SYSNOTICE";
    MsgType[MsgType["SYS"] = 10000] = "SYS";
    MsgType[MsgType["RECALLED"] = 10002] = "RECALLED";
})(MsgType = exports.MsgType || (exports.MsgType = {}));
//# sourceMappingURL=schema.js.map