import { BasePage } from "./base-page";

export default class outPage extends BasePage {
    constructor(game) {
        super(game);
        this.UI = this.game.UI;
        this.name = 'viewerOut';
    }

    show() {
        var observeInfo = this.model.observeInfo;
        this.full2D.showLookersPage({
            type: 'out',
            headimg: observeInfo.headimg,
            nickname: observeInfo.nickName
        });
        this.UI.hideScore();
    }

    hide() {
        this.full2D.hide2D();
    }
}