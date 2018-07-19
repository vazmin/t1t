import { BasePage } from "./base-page";

export default class GroupPage extends BasePage {
    constructor(game) {
        super(game);
        this.name = 'groupRankList';
    }

    show(list, myUserInfo) {
        this.full2D.showGroupRankList(list, myUserInfo);
    }

    hide() {
        this.full2D.hide2D();
    }
}