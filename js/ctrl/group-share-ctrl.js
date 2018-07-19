import GroupPage from "../page/group-page";
import Network from "../base/network";


export default class GroupShareCtrl {
    constructor(game, modeCtrl) {
        this.name = 'groupShare';
        this.game = game;
        this.gameCtrl = this.game.gameCtrl;
        this.model = this.game.gameModel;
        this.view = this.game.gameView;
        this.netWorkCtrl = this.gameCtrl.netWorkCtrl;
        this.modeCtrl = modeCtrl;
        this.groupPage = new GroupPage(game);

        this.shareTicket = '';
        this.shareInfoTimeout = null;
    }

    init(options) {
        // console.log('init groupShareCtrl')
        // 服务器
        var serverConfig = this.model.getServerConfig();
        if (serverConfig) {
            if (!serverConfig.group_score_switch) {
                this.view.showServeConfigForbiddenGroupShare();
                this.modeCtrl.changeMode('singleCtrl');
                return;
            }
        }
        this.model.setStage('');
        var sessionId = this.model.getSessionId();
        this.shareTicket = options.shareTicket;
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
                        this.clearShareInfoTimeout();
                        // console.log('没有触发定时器')
                    } else {
                        // console.log('已经触发定时器')
                        return;
                    }

                    this.model.setShareTicket(res.rawData);

                    // 获取群数据
                    Network.getGroupScore((success, res) => {

                        // 如果成功则显示好友排行
                        if (success) {
                            var list = res.data.user_info || [];
                            var myUserInfo = res.data.my_user_info || {};
                            this.showGroupRankPage(list, myUserInfo);
                        } else {

                            // 如果失败，回到单机模式
                            // this.handleNetworkFucked(true, '数据异常，点击确定进入游戏')
                            this.goToGroupShareFail();
                        }
                        wx.hideLoading();
                    });
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

                    wx.hideLoading();
                    this.goToGroupShareFail('群里的群分享才有效哦~');
                    // this.handleNetworkFucked(true, '数据异常，点击确定进入游戏')
                }
            });
        } else {
            wx.hideLoading();
            this.goToGroupShareFail();
        }
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
        this.goToGroupShareFail();
    }

    goToGroupShareFail(wording) {
        this.view.showGroupShareFail(wording);
        this.modeCtrl.changeMode('singleCtrl');
    }

    showGroupRankPage(list, myUserInfo) {
        this.groupPage.show(list, myUserInfo);
        this.model.setStage(this.groupPage.name);
        this.currentPage = this.groupPage;
    }

    destroy() {
        wx.hideLoading();
        if (this.currentPage) {
            this.currentPage.hide();
        }
        this.model.setStage('');
        this.shareTicket = '';
        this.model.clearShareTicket();
        this.clearShareInfoTimeout();
        this.game.resetScene();
    }

    groupPlayGame() {
        this.modeCtrl.directPlaySingleGame();
    }

    wxOnhide() {
        return;
    }
}