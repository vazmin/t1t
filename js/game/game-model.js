import Session from "../base/session";
import Storage from "../base/storage";

export default class GameModel {
    constructor(game) {
        this.game = game;
        this.mode = '';
        this.stage = '';
        this.is_from_wn = 0;
        this.firstBlood = false;
        this.currentScore = 0;
        this.highestScore = 0;
        this.observeInfo = {};
        this.friendsScore = [];
        this.weekBestScore = 0;
        this.startTime = Math.floor(Date.now() / 1000);
    }

    setMode(mode) {
        this.mode = mode;
        this.game.mode = mode;
    }

    setStage(stage) {
        this.stage = stage;
        this.game.stage = stage;
    }

    init() {
        Session.init();

        var fb = Storage.getFirstBlood();
        if (!fb) {
            this.setFirstBlood(true);
            Storage.saveFirstBlood();
        }

        this.highestScore = Storage.getHeighestScore() || 0;
        Session.setServerConfig(Storage.getServerConfig());

        this.weekBestScore = Storage.getWeekBestScore() || 0;
        this.friendsScore = Storage.getFriendsScore();
    }

    getServerConfig() {
        return Session.serverConfig;
    }

    setIsFromWn(number) {
        this.is_from_wn = number;
        this.game.is_from_wn = number;
    }

    setFirstBlood(bool) {
        this.firstBlood = bool;
        this.game.firstBlood = bool;
    }

    getMode() {
        return this.mode;
    }

    setScore(score) {
        this.currentScore = score;
        // if (score > this.highestScore) {
        //   this.saveHeighestScore(score)
        // }
    }

    saveHeighestScore(score) {
        var verifyData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

        if (verifyData) {
            var expire = this.getNextSunday();
            var vData = {
                ts: expire,
                data: verifyData
            };
        } else {
            var vData = '';
        }

        Storage.saveHeighestScore(score);
        Storage.saveActionData(vData);
        this.highestScore = score;
    }

    saveWeekBestScore() {
        var score = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

        var data = {
            ts: this.getNextSunday(),
            data: score
        };
        Storage.saveWeekBestScore(data);
    }

    getActionData() {
        return Storage.getActionData();
    }

    getHighestScore() {
        return this.highestScore;
    }

    saveFriendsScore(data) {
        this.friendsScore = data;
        var formatData = {
            ts: this.getNextSunday(),
            data: data
        };
        Storage.saveFriendsScore(formatData);
    }

    getSessionId() {
        return Session.sessionId;
    }

    getPkId() {
        return Session.pkId;
    }

    clearPkId() {
        Session.clearPkId();
    }

    setShareTicket(rawData) {
        Session.setShareTicket(rawData);
    }

    getShareTicket() {
        return Session.shareTicket;
    }

    clearShareTicket() {
        Session.clearShareTicket();
    }

    setGameId(id) {
        Session.setGameId(id);
    }

    setGameTicket(ticket) {
        Session.setGameTicket(ticket);
    }

    clearGameId() {
        Session.clearGameId();
    }

    clearGameTicket() {
        Session.clearGameTicket();
    }

    setObserveInfo(opt) {
        this.observeInfo.headimg = opt.headimg;
        this.observeInfo.nickName = opt.nickName;
    }

    clearObserveInfo() {
        this.observeInfo.headimg = null;
        this.observeInfo.nickName = null;
    }

    getNextSunday() {
        var now = new Date();
        var day = now.getDay();
        now.setHours(0, 0, 0, 0);
        var expire = now.valueOf() + (8 - day) % 7 * 24 * 60 * 60 * 1000;
        return expire;
    }
}