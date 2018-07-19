import Storage from "./storage";
import Network from "./network";

export default class historyTimes {
    constructor(game) {
        this.times = Storage.getHistoryTimes();
        if (!this.times) {
            this.times = {
                accurate: 0,
                bonus: 0
            };
        }
        this.game = game;
        this.limitScore = 5;
    }

    verifyScore(onlineScore) {
        if (onlineScore >= this.times.accurate) {

            // 如果网上的分数比当前分数大，则赋值，更新本地缓存
            this.times.accurate = onlineScore;

            if (this.times.bonus >= this.limitScore) {

                // 如果累加分数超过5分
                this.upLoadHistoryTimes();
            } else {

                Storage.saveHistoryTimes(this.times);
            }
        } else {
            this.upLoadHistoryTimes();
        }
    }

    addOne() {
        // console.log('score add one')
        this.times.bonus++;
        // this.checkUp()
    }

    checkUp() {
        if (this.times.bonus >= this.limitScore) {

            // 如果累加分数超过5分
            this.upLoadHistoryTimes();
        } else {
            Storage.saveHistoryTimes(this.times);
        }
    }

    upLoadHistoryTimes() {
        var highestScore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var verifyData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var times = this.times.accurate + this.times.bonus;
        // 上传分数
        Network.requestSettlement(highestScore, times, this.afterUpload.bind(this), verifyData);
    }

    afterUpload(success) {
        if (success) {
            this.times.accurate += this.times.bonus;
            this.times.bonus = 0;
        }
        Storage.saveHistoryTimes(this.times);
    }

    getTimes() {
        return this.times.accurate + this.times.bonus;
    }
}