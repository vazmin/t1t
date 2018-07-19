import { BasePage } from "./base-page";

export default class SingleFriendRankPage extends BasePage {
    constructor(game) {
        super(game);
        this.name = 'friendRankList';
    }

    show() {
        this.full2D.showFriendRankList({
            week_best_score: this.model.weekBestScore
        });
    }

    hide() {
        this.full2D.hide2D();
    }
}