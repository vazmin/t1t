import WaitingPage from '../page/waiting-page'
import GgPage from '../page/gg-page';
import outPage from '../page/out-page';
import Network from '../base/network';

var SYCTIME = 10000;
var TIMEOUT = 9000;
/**
 * 36
 */
export default class ObserveCtrl {

    constructor(game, modeCtrl) {
        this.game = game;
        this.name = 'observe';
        this.gameCtrl = this.game.gameCtrl;
        this.model = this.game.gameModel;
        this.view = this.game.gameView;
        this.modeCtrl = modeCtrl;
        this.netWorkCtrl = this.gameCtrl.netWorkCtrl;
        this.gameSocket = this.game.gameSocket;
        this.currentPage = null;

        this.waitingPage = new WaitingPage(game);
        this.ggPage = new GgPage(game);
        this.outPage = new outPage(game);

        this.gameId = '';
        this.longTimeout = null;
    }

    init(options) {
        // TODO 如果服务器下发的配置禁止围观，返回单机游戏
        var serverConfig = this.model.getServerConfig();
        if (serverConfig) {
            if (!serverConfig.audience_mode_switch) {
                this.view.showServeConfigForbiddenObserveMode();
                this.modeCtrl.changeMode('singleCtrl');
                return;
            }
        }
        this.model.setStage('');
        var sessionId = this.model.getSessionId();
        this.gameId = options.query.gameId;
        this.model.setObserveInfo({
            headimg: options.query.headimg,
            nickName: options.query.nickName
        });
        this.model.setGameId(this.gameId);

        wx.showLoading();
        if (!sessionId) {
            this.netWorkCtrl.netWorkLogin(this.afterLogin.bind(this));
        } else {
            this.afterLogin(true);
        }
    }

    afterLogin(success) {
        if (success) {
            this.setLongTimeHandle();
            this.gameSocket.connectSocket();
            this.model.setStage('');
        } else {
            this.goToObserveStateFail();
        }
    }

    socketJoinSuccess(success) {

        // 清除定时器
        this.clearLongTimeHandle();
        wx.hideLoading();
        if (success) {

            // 切换页面
            this.waitingPage.show();
            this.model.setStage(this.waitingPage.name);
            this.currentPage = this.waitingPage;

            // 清UI分数
            this.game.UI.setScore(0);

            // 设置轮询，查主播状态
            this.checkPlayerTimeout = setInterval(this.checkPlayerState.bind(this), SYCTIME);
        } else {

            // 展示主播直播结束
            this.showPlayerDead();
        }
    }

    goToObserveStateFail() {

        // 提示wording
        this.view.showObserveStateFail();

        // 跳回单机主页
        this.modeCtrl.changeMode('singleCtrl');
    }

    setLongTimeHandle() {
        this.longTimeout = setTimeout(this.handleLongTime.bind(this), TIMEOUT);
    }

    handleLongTime() {
        this.goToObserveStateFail();
    }

    clearLongTimeHandle() {
        if (this.longTimeout != null) {
            clearTimeout(this.longTimeout);
            this.longTimeout = null;
        }
    }

    showPlayerDead() {
        // 关闭socket
        this.gameSocket.close();

        // 关闭定时器
        this.clearCheckPlayerTimeout();

        // 展示主播退出页面
        if (this.currentPage) {
            this.currentPage.hide();
        }
        this.outPage.show();
        this.model.setStage(this.outPage.name);
        this.currentPage = this.outPage;
    }

    checkPlayerState() {
        Network.syncop(this.judgePlayerState.bind(this));
    }

    judgePlayerState(success, res) {
        if (success) {
            if (res.data.state != 0) {
                this.clearCheckPlayerTimeout();
                this.showPlayerDead();
            }
        } else {
            this.handleSyncopErr();
        }
    }

    clearCheckPlayerTimeout() {
        if (this.checkPlayerTimeout != null) {
            clearInterval(this.checkPlayerTimeout);
            this.checkPlayerTimeout = null;
        }
    }

    destroy() {
        if (this.currentPage) {
            this.currentPage.hide();
        }
        this.currentPage = null;
        this.model.setStage('');

        // 清理gameID
        this.model.clearGameId();

        // 清理连接超时定时器
        this.clearLongTimeHandle();

        // 清理sycop定时器
        this.clearCheckPlayerTimeout();

        // 隐藏loading
        wx.hideLoading();

        if (this.gameSocket.alive) {

            // 关闭socket
            this.gameSocket.close();
        }

        // 清楚围观者的信息
        this.model.clearObserveInfo();

        this.game.instructionCtrl.destroy();

        this.game.resetScene();
    }

    showPlayerWaiting() {
        // 查看当前stage是否是playerWaiting，不是才改
        if (this.currentPage != this.waitingPage) {
            if (this.currentPage != null) {
                this.currentPage.hide();
            }
            this.waitingPage.show();
            this.model.setStage(this.waitingPage.name);
            this.currentPage = this.waitingPage;
        }
    }

    showPlayerGG(score) {
        if (this.currentPage != null) {
            this.currentPage.hide();
        }
        this.ggPage.show(score);
        this.model.setStage(this.ggPage.name);
        this.currentPage = this.ggPage;
    }

    onPlayerOut() {
        this.showPlayerDead();
    }

    onViewerStart() {
        this.gameSocket.quitObserve();
        this.game.instructionCtrl.destroy();
        this.modeCtrl.directPlaySingleGame();
    }

    showGameOverPage() {
        return;
    }

    wxOnhide() {
        this.clearCheckPlayerTimeout();
        this.gameSocket.quitObserve();
        this.gameSocket.close();
        this.game.resetScene();
    }

    wxOnshow() {
        return;
    }
}