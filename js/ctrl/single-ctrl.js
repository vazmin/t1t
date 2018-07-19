import SingleStartPage from "../page/single-start-page";
import GamePage from "../page/game-page";
import SingleGameOverPage from "../page/single-game-over-page";
import SingleFriendRankPage from "../page/single-friend-rank-page";
import { shareGroupRank, shareObserve } from "../base/share";
import Network from "../base/network";

export default class singleCtrl {
    constructor(game, modeCtrl) {
        this.name = 'single';
        this.game = game;
        this.gameCtrl = this.game.gameCtrl;
        this.model = this.game.gameModel;
        this.view = this.game.gameView;
        this.modeCtrl = modeCtrl;
        this.netWorkCtrl = this.gameCtrl.netWorkCtrl;
        this.gameSocket = this.game.gameSocket;

        this.startPage = new SingleStartPage(game);
        this.gamePage = new GamePage(game);
        this.gameOverPage = new SingleGameOverPage(game);
        this.friendRankPage = new SingleFriendRankPage(game);
        this.currentPage = null;
        this.lastPage = null;

        this.socketTimeout = null;
    }

    init(options) {
        this.startPage.show();
        this.model.setStage(this.startPage.name);
        this.currentPage = this.startPage;
    }

    clickStart() {
        this.hideCurrentPage();
        this.gamePage.show();
        this.game.replayGame();
        this.model.setStage(this.gamePage.name);
        this.currentPage = this.gamePage;
    }

    showGameOverPage() {
        this.hideCurrentPage();
        this.gameOverPage.show();

        // 清空上次留存的pkId
        this.model.clearPkId();
        this.model.setStage(this.gameOverPage.name);
        this.currentPage = this.gameOverPage;
    }

    gameOverClickReplay() {
        this.clickStart();
    }

    showFriendRank() {
        this.lastPage = this.currentPage;
        this.hideCurrentPage();
        this.friendRankPage.show();
        this.model.setStage(this.friendRankPage.name);
        this.currentPage = this.friendRankPage;
    }

    friendRankReturn() {
        this.hideCurrentPage();
        this.lastPage.show();

        this.model.setStage(this.lastPage.name);
        this.currentPage = this.lastPage;
        // this.lastPage = null
    }

    shareGroupRank() {
        shareGroupRank((success, isGroup) => {
            this.gameCtrl.afterShareGroupRank(success, isGroup);
        });
    }

    clickRank() {
        this.showFriendRank();
    }

    shareBattleCard() {

        var sessionId = this.model.getSessionId();
        var currentScore = this.model.currentScore;
        var pkId = this.model.getPkId();
        if (!sessionId) {
            this.view.showNoSession();
            return;
        }

        if (!pkId) {
            Network.createPK(currentScore)
                .then(
                    () => {
                        this.afterHavePkId();
                    },
                    function() {
                        this.getPKErr();
                    }
                )
                .catch(function(err) {
                    return console.log(err);
                });
        } else {
            this.afterHavePkId();
        }
    }

    afterHavePkId() {
        var _this3 = this;

        var pkId = this.model.getPkId();
        var score = this.model.currentScore;

        (0, _shareApp.shareBattle)(pkId, score, function(success, isGroup) {
            _this3.gameCtrl.afterShareBattle(success, isGroup);
        });
    }

    getPKErr() {
        this.view.showGetPkIdFail();
    }

    shareObservCard() {
        this.gamePage.hideLookersShare();
        this.model.setStage('loading');
        wx.showLoading();
        var sessionId = this.model.getSessionId();
        if (!sessionId) {
            this.netWorkCtrl.netWorkLogin(this.afterLogin.bind(this));
        } else {
            this.afterLogin(true);
        }
    }

    afterLogin(success) {

        if (success) {
            // 连接socket和请求gameId
            Network.requestCreateGame((success, res) => {
                if (success) {
                    this.model.setGameId(res.data.game_id);
                    this.model.setGameTicket(res.data.up_op_ticket);
                    this.shareObservCardA();
                } else {
                    this.shareObservCardFail(res);
                }
            });
        } else {
            this.shareObservCardFail();
        }
    }

    shareObservCardFail(res) {

        // 提示wording弹窗
        this.view.showShareObserveCardFail(res);

        // 清理gameId，gameTicket
        this.model.clearGameId();
        this.model.clearGameTicket();

        // 切回stage loading -> game
        if (this.model.stage == 'loading') {
            this.model.setStage('game');
        }

        // 清除定时器
        this.clearSocketTimeout();

        // 关闭socket 回到游戏页面
        this.gameSocket.close();

        // 清除wx.showloading
        wx.hideLoading();
    }

    shareObservCardA() {
        this.socketTimeout = setTimeout(this.shareObservCardFail.bind(this), 5000);

        /**
         * 连接网络
         * socket连接上自动joingame，中间出错，直接调用分享失败,关闭socket
         */
        this.gameSocket.connectSocket();
    }

    socketJoinSuccess(success) {
        wx.hideLoading();
        if (success) {

            // 取消定时器
            this.clearSocketTimeout();
            this.shareObservCardB();
        } else {
            this.shareObservCardFail();
        }
    }

    shareObservCardB() {
        shareObserve((success, num) => {
            if (!!success) {
                this.gameCtrl.afterShareObserveCard(num);
            }
            setTimeout(() => {
                // console.log('!!!!!shareObservCardB,stage', this.model.stage)
                if (this.model.stage == 'loading') {
                    this.model.setStage('game');
                }
                this.modeCtrl.singleChangeToPlayer();
                this.currentPage = null;
            }, 50);
        });
    }

    clearSocketTimeout() {
        if (this.socketTimeout != null) {
            clearTimeout(this.socketTimeout);
            this.socketTimeout = null;
        }
    }

    wxOnhide() {
        return;
    }

    wxOnshow() {
        return;
    }

    destroy() {
        this.hideCurrentPage();
        this.currentPage = null;
        this.model.setStage('');
        // 清理gameId，gameTicket
        this.model.clearGameId();
        this.model.clearGameTicket();

        // 清除定时器
        this.clearSocketTimeout();

        this.game.resetScene();
    }

    hideCurrentPage() {
        if (this.currentPage) {
            this.currentPage.hide();
        }
    }
}