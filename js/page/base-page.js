export class BasePage {
    constructor(game) {
        this.game = game;
        this.model = this.game.gameModel;
        this.full2D = this.game.full2D;
        this.name = 'unset';
    }

    show() {

    }

    hide() {

    }
}