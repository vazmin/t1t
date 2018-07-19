import { BasePage } from "./base-page";

export default class SingleStartPage extends BasePage {
    constructor(game) {
        super(game);
        this.name = 'startPage';
    }
    show() {
        // var _this = this;

        if (!this.full2D) {
            this.game.handleWxOnError({
                message: 'can not find full 2D',
                stack: ''
            });
        }
        setTimeout(() => {
            if (this.full2D) {
                this.full2D.showStartPage();
            } else {
                // wx.exitMiniProgram()
            }
        }, 0);
    }
}