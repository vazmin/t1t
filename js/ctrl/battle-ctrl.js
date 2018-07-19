import BattlePkPage from "../page/battle-pk-page";
import BattleGamePage from "../page/battle-game-page";
import Network from "../base/network";

export default class BattleCtrl {
    constructor(game, modeCtrl) {
        this.name = 'battlePage';
        this.game = game;
        this.gameCtrl = this.game.gameCtrl;
        this.model = this.game.gameModel;
        this.view = this.game.gameView;
        this.modeCtrl = modeCtrl;
        this.netWorkCtrl = this.gameCtrl.netWorkCtrl;
        this.currentPage = null;
        this.pkPage = new BattlePkPage(game);
        this.gamePage = new BattleGamePage(game);

        this.shareTicket = '';
        this.pkId = '';
        this.shareInfoTimeout = null;
        this.battleScore = undefined;
    }

    init(options) {
        var sessionId = this.model.getSessionId();
        this.shareTicket = options.shareTicket;
        this.pkId = options.query.pkId;
        this.model.setStage('');
        wx.showLoading();
        if (!sessionId) {
            this.netWorkCtrl.netWorkLogin(this.afterLogin.bind(this));
        } else {
            this.afterLogin(true);
        }
    }

    afterLogin(success) {

        if (success) {
            this.setShareInfoTimeout();

            // 换取rawdata
            wx.getShareInfo({
                shareTicket: this.shareTicket,
                success: (res) => {

                    // 如果定时器还没有触发，就取消定时器
                    if (this.shareInfoTimeout != null) {
                        // console.log('没有触发定时器')
                        this.clearShareInfoTimeout();
                    } else {
                        // console.log('已经触发定时器')
                        return;
                    }
                    this.model.setShareTicket(res.rawData);

                    // console.log('wx.getShareInfo success group', res)
                    this.gotoBattlePage();
                    this.gameCtrl.loginBattle(1);
                },
                fail: (res) => {

                    // 如果定时器还没有触发，就取消定时器
                    if (this.shareInfoTimeout != null) {
                        this.clearShareInfoTimeout();
                        // console.log('没有触发定时器')
                    } else {
                        // console.log('已经触发定时器')
                        return;
                    }

                    // 失败就是个人
                    this.gotoBattlePage();
                    this.gameCtrl.loginBattle(0);
                }
            });
        } else {
            this.goToBattleFail();
        }
    }

    gotoBattlePage() {

        // 拉分数
        Network.getBattleData(this.gotoBattlePageAfterHaveData.bind(this), this.pkId);
    }

    gotoBattlePageAfterHaveData(success, res) {
        wx.hideLoading();
        if (success) {
            var pkList = [];
            if (res.data.challenger.length) {
                res.data.challenger.forEach(function(el) {
                    pkList.push({
                        headimg: el.headimg,
                        is_self: el.is_self ? 1 : 0,
                        nickname: el.nickname,
                        score_info: [{
                            score: el.score
                        }]
                    });
                }, this);
            }

            pkList.sort(function(a, b) {
                return b.score_info[0].score - a.score_info[0].score;
            });

            var obj = {
                data: {
                    organizerInfo: {
                        headimg: res.data.owner.headimg,
                        nickname: res.data.owner.nickname,
                        score_info: [{
                            score: res.data.owner.score
                        }],
                        // create_time: res.data.create_time,
                        left_time: res.data.left_time,
                        is_self: res.data.is_owner ? 1 : 0
                    },
                    pkListInfo: pkList,
                    gg_score: this.battleScore
                }
            };

            if (this.currentPage) {
                this.currentPage.hide();
            }
            this.pkPage.show(obj);
            this.model.setStage(this.pkPage.name);
            this.currentPage = this.pkPage;

            this.gameCtrl.showPkPage(res.data.owner.score);
        } else {
            this.goToBattleFail();
        }
    }

    goToBattleFail() {
        this.view.showGoToBattleFail();
        this.modeCtrl.changeMode('singleCtrl');
    }

    setShareInfoTimeout() {
        this.shareInfoTimeout = setTimeout(this.handleShareInfoTimeout.bind(this), 5000);
    }

    clearShareInfoTimeout() {
        if (this.shareInfoTimeout != null) {
            clearTimeout(this.shareInfoTimeout);
            this.shareInfoTimeout = null;
        }
    }

    handleShareInfoTimeout() {
        this.clearShareInfoTimeout();
        this.goToBattleFail();
    }

    destroy() {
        if (this.currentPage) {
            this.currentPage.hide();
        }
        this.model.setStage('');
        wx.hideLoading();
        this.shareTicket = '';
        this.pkId = '';
        this.clearShareInfoTimeout();
        this.model.clearShareTicket();
        this.game.resetScene();
        this.battleScore = undefined;
    }

    battlePlay(pk) {
        if (pk) {
            if (this.currentPage) {
                this.currentPage.hide();
            }
            this.gamePage.show();
            this.game.replayGame();
            this.model.setStage(this.gamePage.name);
            this.currentPage = this.gamePage;
        } else {
            this.modeCtrl.directPlaySingleGame();
            this.gameCtrl.battleToSingle();
        }
    }

    showGameOverPage() {
        if (this.currentPage) {
            this.currentPage.hide();
        }
        this.model.setStage('');
        this.currentPage = null;
        var score = this.model.currentScore;
        this.battleScore = score;

        // 先上传分数，然后再拉分数
        wx.showLoading();
        Network.updatepkinfo(this.gotoBattlePageAgain.bind(this), this.pkId, score);
    }

    gotoBattlePageAgain(scoreUpLoad) {
        if (!scoreUpLoad) {
            this.view.showUploadPkScoreFail();
        }

        this.gotoBattlePage();
    }

    wxOnhide() {
        return;
    }
}