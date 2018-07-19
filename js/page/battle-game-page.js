import { BasePage } from "./base-page";

export default class BattleGamePage extends BasePage {
    constructor(game) {
        super(game);
        this.UI = this.game.UI;
        this.viewer = this.game.viewer;
        this.name = 'game';
    }

    show() {
        this.UI.showScore();

        this.UI.scoreText.obj.position.y = 21;
        this.UI.scoreText.obj.position.x = -13;
        this.UI.scoreText.changeStyle({ textAlign: 'left' });
    }

    hide() {
        this.UI.hideScore();
    }
}