import { BasePage } from "./base-page";

export default class GgPage extends BasePage {
    constructor(game) {
        super(game);
        this.UI = this.game.UI;
        this.name = 'viewerGG';
    }

    show(score) {
        var observeInfo = this.model.observeInfo;
        this.full2D.showLookersPage({
            type: 'gg',
            score: score,
            headimg: observeInfo.headimg,
            nickname: observeInfo.nickName
        });
        this.UI.hideScore();
    }

    hide() {
        this.full2D.hide2D();
    }
}