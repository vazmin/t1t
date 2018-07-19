import { BasePage } from "./base-page";

/**
 * 48
 */
export default class WaitingPage extends BasePage {
    constructor(game) {
        super(game);
        this.UI = this.game.UI;
        this.name = 'viewerWaiting';
    }

    show() {
        var observeInfo = this.model.observeInfo;
        this.full2D.showLookersPage({
            type: 'in',
            headimg: observeInfo.headimg,
            nickname: observeInfo.nickName
        });
        this.UI.scoreText.obj.position.x = 0;
        this.UI.scoreText.obj.position.y = 11;
        this.UI.scoreText.changeStyle({ textAlign: 'center' });
        this.UI.showScore();
    }

    hide() {
        this.full2D.hide2D();
        this.UI.hideScore();
        this.UI.scoreText.obj.position.y = 21;
        this.UI.scoreText.obj.position.x = -13;
        this.UI.scoreText.changeStyle({ textAlign: 'left' });
    }
}