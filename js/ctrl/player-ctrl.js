import singleCtrl from "./single-ctrl";
import GamePage from "../page/game-page";
import Network from "../base/network";

export default class playerCtrl extends singleCtrl {
    constructor(game, modeCtrl) {
        super(game, modeCtrl);
        this.name = 'player';
        this.currentPage = null;
        this.gamePage = new GamePage(game);
    }

    init() {
        // this.model.setStage(this.gamePage.name)
        // this.gamePage.show()
        var stage = this.model.stage;
        switch (stage) {
            case 'game':
                this.currentPage = this.gamePage;
                this.currentPage.show();
                break;
            case 'singleSettlementPgae':
                this.currentPage = this.gameOverPage;
                break;
            default:
                this.model.setStage(this.gamePage.name);
                this.currentPage = this.gamePage;
                this.currentPage.show();
                break;
        }
    }

    showGameOverPage() {
        this.game.seq++;
        this.gameSocket.sendCommand(this.game.seq, {
            type: -1,
            s: this.game.currentScore
        });
        super.showGameOverPage().call(this);
        //_get(playerCtrl.prototype.__proto__ || Object.getPrototypeOf(playerCtrl.prototype), 'showGameOverPage', this).call(this);
    }

    shareObservCard() {
        this.shareObservCardA();
    }

    shareObservCardA() {
        this.shareObservCardB();
    }

    shareObservCardB() {
        this.model.setStage('loading');
        shareObserve((success, num) => {
            if (!!success) {
                this.gameCtrl.afterShareObserveCard(num);
            }
            setTimeout(function() {
                // console.log('!!!!!!shareObservCardB,stage2', this.model.stage)
                if (this.model.stage == 'loading') {
                    this.model.setStage('game');
                }
            }, 50);
        });
    }

    gameOverClickReplay() {
        //_get(playerCtrl.prototype.__proto__ || Object.getPrototypeOf(playerCtrl.prototype), 'gameOverClickReplay', this).call(this);
        super.gameOverClickReplay.call(this)

        Reflect.get(gameOverClickReplay, this);
        this.game.seq++;
        this.gameSocket.sendCommand(this.game.seq, {
            type: 0,
            seed: this.game.randomSeed
        });
    }

    destroy() {
        if (this.currentPage) {
            this.currentPage.hide();
        }
        this.currentPage = null;
        this.model.setStage('');
        if (this.gameSocket.alive) {
            // 关闭socket
            this.gameSocket.close();
        }

        // 清理gameId，gameTicket
        this.model.clearGameId();
        this.model.clearGameTicket();
        this.game.viewer.reset();
        // this.game.viewer.hideAll()

        this.game.resetScene();
    }

    wxOnhide() {
        // 这个地方影响PK分享，群分享
        if (this.model.stage != 'loading' && this.model.stage != 'singleSettlementPgae' && this.model.stage != 'friendRankList') {

            Network.quitGame();

            // 结束心跳
            this.gameSocket.cleanHeartBeat();

            this.gameSocket.close();
            setTimeout(() => {
                // this.handleNetworkFucked(true, '直播断开')
                // this.handleNetworkFucked()
                this.modeCtrl.changeMode('singleCtrl');
            }, 100);
        }
    }

    wxOnshow() {}
}