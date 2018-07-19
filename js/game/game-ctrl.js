import QueryCtrl from "../ctrl/query-ctrl";
import NetWorkCtrl from "../ctrl/network-ctrl";
import ModeCtrl from "../ctrl/mode-ctrl";
import * as CONFIG from "../base/config";

export default class GameCtrl {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.gameView = this.game.gameView;
        this.queryCtrl = new QueryCtrl(this.game);
        this.netWorkCtrl = new NetWorkCtrl(this.game);
        this.modeCtrl = new ModeCtrl(this.game);
        this.model = this.game.gameModel;

        this.reporter = this.game.reporter;
        this.historyTimes = this.game.historyTimes;
        this.viewer = this.game.viewer;
    }

    firstInitGame(options) {
        this.queryCtrl.identifyMode(options);
        this.modeCtrl.initFirstPage(options);
    }

    identifyModeErr(wording) {
        this.gameView.showIdentifyModeErr(wording);
    }

    onLoginSuccess() {
        this.reporter.setTimer(CONFIG.REPORTERTIMEOUT);
    }

    // 首页：开始游戏
    clickStart() {
        this.modeCtrl.clickStart();
    }

    // 首页：点击排行
    showFriendRank() {
        this.modeCtrl.showFriendRank();
    }

    // 结算页：点击排行
    clickRank() {
        this.modeCtrl.clickRank();
    }

    gameOver(score) {
        this.model.setScore(score);
        if (this.model.mode != 'observe') {
            var highestScore = this.model.getHighestScore();
            var weekBestScore = this.model.weekBestScore;

            // 加一局玩过的次数
            this.historyTimes.addOne();
            var gameTimes = this.historyTimes.getTimes();

            this.reporter.playGameReport(score, highestScore, gameTimes);
            //console.log("wtf", JSON.stringify(this.game.actionList), JSON.stringify(this.game.musicList), this.game.randomSeed,  JSON.stringify(this.game.touchList));
            // !!! 这里因为调用的都是同一个接口，为了节省服务器资源，最高分跟回合次数耦合在一起了
            if (weekBestScore < score) {
                // 如果产生了最高分
                // !!! 这里上传了最高分和历史回合次数
                var verifyData = {
                    seed: this.game.randomSeed,
                    action: this.game.actionList,
                    musicList: this.game.musicList,
                    touchList: this.game.touchList,
                    version: 1
                };
                this.historyTimes.upLoadHistoryTimes(score, verifyData);
                // this.model.weekBestScore = score
                // if (highestScore < score) {
                //   this.model.saveHeighestScore(score)
                // }
            } else {

                // 检查是否需要上传次数
                this.historyTimes.checkUp();
            }

            // 更新排行榜分数
            this.netWorkCtrl.upDateFriendsScoreList();
        }

        if (this.mode == 'player') {
            this.reporter.playAudienceReport();
        }

        if (this.mode == 'battle') {
            this.reporter.playPKReport(score);
        }
    }

    gameOverShowPage() {
        this.modeCtrl.showGameOverPage();
        if (this.model.mode != 'observe') {
            if (this.model.currentScore >= this.model.weekBestScore) {
                this.model.weekBestScore = this.model.currentScore;
                this.model.saveWeekBestScore(this.model.currentScore);
                if (this.model.currentScore > this.model.getHighestScore()) {
                    var verifyData = {
                        seed: this.game.randomSeed,
                        action: this.game.actionList
                    };
                    this.model.saveHeighestScore(this.model.currentScore, verifyData);
                }
            }
        }
    }

    // 结算页面：重新玩
    clickReplay() {
        this.reporter.playAudienceReportStart();
        this.modeCtrl.gameOverClickReplay();
    }

    // 好友排行：返回上一页
    friendRankReturn() {
        this.modeCtrl.friendRankReturn();
    }

    netWorkLogin() {
        this.netWorkCtrl.netWorkLogin();
    }

    // 好友排行页面：群分享
    shareGroupRank() {
        this.modeCtrl.shareGroupRank();
    }

    afterShareGroupRank(success, isGroup) {
        // console.log(success, isGroup)
        this.reporter.shareGroupReport(isGroup);
    }

    // 结算页面：
    shareBattleCard() {
        this.modeCtrl.shareBattleCard();
    }

    afterShareBattle(success, isGroup) {
        // console.log(success, isGroup)
        if (success) {
            this.reporter.sharePKReport(isGroup);
        }
    }

    groupPlayGame() {
        this.modeCtrl.groupPlayGame();
    }

    // 加入挑战模式事件
    loginBattle(isGroup) {
        // console.log('loginBattle', isGroup)
        this.reporter.joinPKReport(isGroup);
        this.reporter.playPKReportStart(isGroup);
    }

    // 获取PK的信息之后触发事件
    showPkPage(ownerScore) {
        // console.log('showPkPage', ownerScore)
        this.reporter.playPKScore(ownerScore);
    }

    // 挑战页面：点击挑战
    onBattlePlay(pk) {
        this.modeCtrl.battlePlay(pk);
    }

    battleToSingle() {
        this.reporter.resetPKReport();
    }

    // 事件
    shareObservCard() {
        this.modeCtrl.shareObservCard();
    }

    socketJoinSuccess(success) {
        this.modeCtrl.socketJoinSuccess(success);
        if (this.model.mode == 'observe') {
            if (success) {
                this.game.socketFirstSync = true;
                this.reporter.joinAudienceReportStart();
            }
        } else {
            this.reporter.joinAudienceReport();
        }

        if (this.model.mode == 'player') {
            this.reporter.playAudienceReportStart();
        }
    }

    // 分享卡片之后
    afterShareObserveCard(isGroup) {
        this.reporter.shareAudienceReport(isGroup);
    }

    showPlayerGG(data) {
        this.modeCtrl.showPlayerGG(data);
    }

    showPlayerWaiting() {
        this.modeCtrl.showPlayerWaiting();
    }

    onPlayerOut() {
        this.modeCtrl.onPlayerOut();
    }

    onViewerStart() {
        this.game.audioManager.scale_intro.stop();
        if (this.game.deadTimeout) {
            clearTimeout(this.game.deadTimeout);
            this.game.deadTimeout = null;
        }
        this.game.pendingReset = false;
        // TweenAnimation.killAll();
        this.modeCtrl.onViewerStart();
        this.reporter.joinAudienceReport();
    }

    wxOnShow(options) {

        this.netWorkCtrl.requestServerInit();
        this.reporter.setTimer(CONFIG.REPORTERTIMEOUT);
        setTimeout(() => {

            // 根据传进来的mode参数判断，如果有mode说明需要更换场景
            if (!!options.query && options.query.hasOwnProperty('mode')) {
                this.modeCtrl.reInitFirstPage(options);
            } else if (this.model.mode != 'single' && this.model.mode != 'player' && this.model.mode != 'battle') {
                // 进来没有参数onshow，单人，围观，挑战，有可能在分享时候回来
                this.modeCtrl.changeMode('singleCtrl');
            }
        }, 300);
    }

    wxOnhide() {
        this.reporter.quitReport();
        if (this.model.mode == 'observe') {
            this.reporter.joinAudienceReport();
        }

        // 清除定时器，1、服务器下发配置的定时器，2、上报的定时器
        this.netWorkCtrl.clearServerInit();
        this.reporter.clearTimer();

        this.modeCtrl.wxOnhide();
    }

    onReplayGame() {
        var mode = this.model.mode;
        if (mode != 'observe') {
            this.reporter.playGameReportStart();
        }
    }

    onPeopleCome(data) {
        if (data.audience_cmd == 0) {

            // 来人了
            this.viewer.peopleCome(data);
            this.reporter.playAudienceReportMaxPeople(this.viewer.num);
        } else if (data.audience_cmd == 1) {

            // 人走了
            this.viewer.peopleOut(data);
        }
    }

    onServerConfigForbid() {}

    onSocketCloseErr() {
        this.gameView.showSocketCloseErr();
        this.modeCtrl.changeMode('singleCtrl');
    }
}