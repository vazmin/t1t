export default class GameView {
    constructor(game) {
        this.game = game;
    }

    init() {}

    showIdentifyModeErr(wording) {
        this.showModal(wording);
    }

    showNoSession() {
        this.showModal();
    }

    showGetPkIdFail() {
        this.showModal();
    }

    showGoToBattleFail() {
        this.showModal();
    }

    showUploadPkScoreFail() {
        this.showModal('数据上传失败');
    }

    showShareObserveCardFail(res) {
        this.showModal(res);
    }

    showObserveStateFail() {
        this.showModal('服务器异常');
    }

    showModal() {
        var wording = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '网络异常,点击确定回到游戏';

        wx.showModal({
            title: '提示',
            content: wording,
            showCancel: false
        });
    }

    showServeConfigForbiddenObserveMode() {
        this.showModal('当前围观人数过多，请稍后再试');
    }

    showServeConfigForbiddenGroupShare() {
        this.showModal('查看群排行人数过多，请稍后再试');
    }

    showSocketCloseErr() {
        // this.showModal('网络连接异常，点击确定回到游戏')
    }

    showSyncopErr() {
        return;
    }
}