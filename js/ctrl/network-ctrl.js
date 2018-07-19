import Network from "../base/network";
var SERVERCONFIG = 60000;

export default class NetWorkCtrl {
    constructor(game) {

        this.game = game;
        this.gameCtrl = game.gameCtrl;
        this.model = game.gameModel;
        this.loginCb = null;

        // 服务器拉取配置的定时器
        this.serverConfigInterval = null;

        this.historyTimes = this.game.historyTimes;
    }

    netWorkLogin(cb) {
        if (cb) {
            this.loginCb = cb;
        }
        Network.requestLogin(this.afterRequestLogin.bind(this));
    }

    afterRequestLogin(success) {
        if (this.loginCb) {
            this.loginCb(success);
        }

        if (success) {

            // 拉取用户头像
            Network.getUserInfo();

            // 获取好友排行
            Network.requestFriendsScore(this.updateFriendsScore.bind(this));

            // 拉配置,每分钟拉一次
            this.requestServerInit();

            // 抛出事件
            this.gameCtrl.onLoginSuccess();
        }
    }

    requestServerInit() {
        Network.requestInit();
        this.serverConfigInterval = setInterval(Network.requestInit.bind(Network), SERVERCONFIG);
    }

    clearServerInit() {
        if (this.serverConfigInterval) {
            clearInterval(this.serverConfigInterval);
        }
    }

    upDateFriendsScoreList() {
        var sessionId = this.model.getSessionId();
        if (sessionId) {
            // 获取好友排行
            Network.requestFriendsScore(this.updateFriendsScore2.bind(this));
        }
    }

    updateFriendsScore(res, data) {
        if (res) {
            // this.friendsScore = data.user_info

            // 对好友分数进行排序
            data.user_info.sort(function(el1, el2) {
                var score1 = el1.week_best_score || 0;
                var score2 = el2.week_best_score || 0;
                return -score1 + score2;
            });

            this.model.saveFriendsScore(data.user_info);

            if (data.my_user_info) {

                var netWorkHighestScore = data.my_user_info.history_best_score || 0;
                if (netWorkHighestScore > this.model.highestScore) {
                    // console.log('update highest score')
                    this.model.saveHeighestScore(netWorkHighestScore);
                } else if (netWorkHighestScore < this.model.highestScore) {
                    var actionData = this.model.getActionData();
                    var now = Date.now();
                    if (actionData) {
                        if (actionData.ts > now) {
                            var verifyData = actionData.data;
                            this.game.historyTimes.upLoadHistoryTimes(this.model.highestScore, verifyData);
                        }
                    }
                }

                // 更新本周最高分
                var weekBestScore = data.my_user_info.week_best_score || 0;
                // console.log('update weekBestScore history times')
                this.model.weekBestScore = weekBestScore;
                this.model.saveWeekBestScore(weekBestScore);
                var times = data.my_user_info.times;
                this.historyTimes.verifyScore(times);
                // this.grade = data.my_user_info.grade
            }

            // 加测试数据
            // 设置假数据
            // console.log(this.friendsScore)
            // for (var i = 0; i < 1000; i++) {
            //   this.friendsScore.push({
            //     nickname: 'tunny',
            //     headimg: 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJFbxurAsxCCqN5GLcc8qQPboZN8dcDcsQkhmgicErTosqKfbthk6Ejyoib7h0iaZBT156Vbviczpic4QQ/0',
            //     score_info: [
            //       { type: 0, score: i }
            //     ],
            //   })
            // }
        }
    }

    updateFriendsScore2(res, data) {
        if (res) {

            // 对好友分数进行排序
            data.user_info.sort(function(el1, el2) {
                var score1 = el1.week_best_score || 0;
                var score2 = el2.week_best_score || 0;
                return -score1 + score2;
            });

            this.model.saveFriendsScore(data.user_info);
        }
    }

    uploadScore(score) {
        Network.requestSettlement(score);
    }
}