import { BasePage } from "./base-page";

export default class BattlePkPage extends BasePage {
    constructor(game) {
        super(game);
        this.name = 'battlePage';
    }

    show(obj) {
        this.full2D.showPkPage(obj);
    }

    hide() {
        this.full2D.hide2D();
    }
}