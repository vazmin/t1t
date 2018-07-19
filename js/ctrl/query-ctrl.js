export default class QueryCtrl {
    constructor(game) {
        this.game = game;
        this.model = this.game.gameModel;
        this.gameCtrl = this.game.gameCtrl;
    }

    identifyMode(options) {
        // if (options.scene == 1086 || options.scene == 1087) {
        //   this.model.setIsFromWn(1)
        // } else {
        //   this.model.setIsFromWn(0)
        // }

        if (!!options.query && options.query.hasOwnProperty('mode')) {
            switch (options.query.mode) {
                case 'groupShare':
                    if (options.shareTicket) {
                        this.model.setMode('groupShare');
                    } else {
                        this.gameCtrl.identifyModeErr('获取群信息失败');
                        this.model.setMode('single');
                    }
                    break;
                case 'battle':
                    if (options.query.pkId) {
                        this.model.setMode('battle');
                    } else {
                        this.gameCtrl.identifyModeErr('获取PK信息失败');
                        this.model.setMode('single');
                    }
                    break;
                case 'observe':
                    if (options.query.gameId) {

                        // gameId存session里！！！！！切记不看的时候关闭链接，清空gameId
                        // Session.setGameId(options.query.gameId)
                        this.model.setMode('observe');
                    } else {
                        this.gameCtrl.identifyModeErr('获取围观信息失败');
                        this.model.setMode('single');
                    }
                    break;
                default:
                    this.model.setMode('single');
                    break;
            }
        } else {
            this.model.setMode('single');
        }
    }
}