import { BasePage } from "./base-page";

export default class SingleGameOverPage extends BasePage {
    constructor(game) {
        super(game);
        this.name = 'singleSettlementPgae';
    }

    show() {

        var score = this.model.currentScore;
        var highest_score = this.model.getHighestScore();
        var start_time = this.model.startTime;
        var week_best_score = this.model.weekBestScore;
        var game_cnt = this.game.historyTimes.getTimes();
        if (!this.full2D) {
            this.game.handleWxOnError({
                message: 'can not find full 2D gameOverPage',
                stack: ''
            });
        }

        setTimeout(() => {
            if (this.full2D) {
                this.full2D.showGameOverPage({
                    score: score,
                    highest_score: highest_score,
                    start_time: start_time,
                    week_best_score: week_best_score,
                    game_cnt: game_cnt
                });
            } else {
                // wx.exitMiniProgram()
            }
        }, 0);
    }

    hide() {
        this.full2D.hide2D();
    }

}