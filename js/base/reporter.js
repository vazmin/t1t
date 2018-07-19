import Network from "./network";

export default class reporter {
    constructor() {
        this.timeOut = null;
        this.reportList = [];
        this.pkState = {
            isGroup: 0,
            score: 0
        };
        this.singleState = 0;
        this.observeState = {
            startTime: 0,
            success: 0
        };
        this.playerState = {
            startTime: 0,
            maxAudience: 0
        };
        this.gameStartTime = 0;

        try {
            var res = wx.getSystemInfoSync();
            this.clientInfo = {
                platform: res.platform,
                brand: res.brand,
                model: res.model,
                system: res.system
            };
        } catch (error) {
            console.log(error);
        }
    }

    getTime() {
        var time = Date.now();
        time = Math.floor(time / 1000);
        return time;
    }

    // EnterReport:     //进入小程序
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填0
    // scene         //uint32, 小程序进入场景
    enterReport(scene) {
        this.gameStartTime = this.getTime();
        if (!scene) {
            // console.log('enterReport need scene')
            return;
        }
        var data = {
            ts: this.getTime(),
            type: 0,
            scene: scene
        };
        this.reportList.push(data);
    }

    // QuitReport:     //退出小程序
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填1
    quitReport() {
        if (!this.gameStartTime) {
            return;
        }
        var data = {
            ts: this.getTime(),
            type: 1,
            duration: this.getTime() - this.gameStartTime
        };
        this.reportList.push(data);
    }

    // PlayGameReport:  //游戏局内上报
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填2
    // score         //uint32, 当局分数
    // best_score    //uint32, 历史最高分（包括当局）
    // break_record  //uint32, 当局是否打破记录
    // duration      //uint32，秒级游戏时长
    // times         //unit32，次数
    playGameReport(score, bestScore, times) {
        if (!this.singleState) {
            return;
        }
        var data = {
            ts: this.getTime(),
            type: 2,
            score: score,
            best_score: bestScore,
            break_record: score > bestScore ? 1 : 0,
            duration: this.getTime() - this.singleState,
            times: times
        };
        this.reportList.push(data);
        this.singleState = 0;
    }

    playGameReportStart() {
        this.singleState = this.getTime();
    }


    // ShareAudienceReport:   //分享围观上报
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填3
    // is_group      //uint32，是否分享到群聊，单聊：0，群聊：1
    shareAudienceReport(isGroup) {
        var data = {
            ts: this.getTime(),
            type: 3,
            is_group: isGroup
        };
        this.reportList.push(data);
    }

    // PlayAudienceReport:    //围观中玩游戏,以局为单位
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填4
    // duration      //uint32，在围观中玩游戏持续时长，秒级
    // max_audience  //uint32，累计围观观众人数

    playAudienceReport() {
        if (!this.playerState.startTime) {
            return;
        }
        var data = {
            ts: this.getTime(),
            type: 4,
            duration: this.getTime() - this.playerState.startTime,
            max_audience: this.playerState.maxAudience
        };
        this.reportList.push(data);
        this.playerState.startTime = 0;
        this.playerState.maxAudience = 0;
    }

    // 新增上报，每次游戏开始都加一条
    // type 10
    playAudienceReportStart() {
        this.playerState.startTime = this.getTime();
        var data = {
            ts: this.getTime(),
            type: 10
        };
        this.reportList.push(data);
    }

    playAudienceReportMaxPeople(n) {
        if (this.playerState.maxAudience < n) {

            this.playerState.maxAudience = n;
        }
    }

    // JoinAudienceReport:    //观众进入围观
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填5
    // duration      //uint32，围观时长
    // join_audience_success //uint32，是否成功看到玩家玩游戏，0：没看到；1：看到
    // 出口，再来一句，join失败
    joinAudienceReport() {
        var time = this.observeState.startTime == 0 ? 0 : this.getTime() - this.observeState.startTime;
        var data = {
            ts: this.getTime(),
            type: 5,
            duration: time,
            join_audience_success: this.observeState.success
        };
        this.reportList.push(data);
        this.observeState.startTime = 0;
        this.observeState.success = 0;
    }

    // 入口joinSuccess
    joinAudienceReportStart() {
        this.observeState.startTime = this.getTime();
        this.observeState.success = 1;
    }

    // ShareRankReport:       //分享排行榜
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填6
    // is_group      //uint32，是否分享到群聊，单聊：0，群聊：1
    shareGroupReport(isGroup) {
        var data = {
            ts: this.getTime(),
            type: 6,
            is_group: isGroup
        };
        this.reportList.push(data);
    }

    // SharePKReport：        //分享PK
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填7
    // is_group      //uint32，是否分享到群聊，单聊：0，群聊：1

    sharePKReport(isGroup) {
        var data = {
            ts: this.getTime(),
            type: 7,
            is_group: isGroup
        };
        this.reportList.push(data);
    }

    // JoinPKReport:          //点击卡片进入PK页面
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填8
    // is_group      //uint32，是否分享到群聊，单聊：0，群聊：1
    joinPKReport(isGroup) {
        var data = {
            ts: this.getTime(),
            type: 8,
            is_group: isGroup
        };
        this.reportList.push(data);
    }

    // PlayPKReport：
    // ts            //uint32，秒级日志时间戳
    // type          //uint32，填9
    // is_group      //uint32，是否来自群聊，单聊：0，群聊：1
    // result        //uint32，0：挑战失败；1：平局；3：挑战成功
    playPKReport(currentScore) {
        var result = 0;
        if (currentScore == this.pkState.score) {
            result = 1;
        }
        if (currentScore > this.pkState.score) {
            result = 3;
        }
        var data = {
            ts: this.getTime(),
            type: 9,
            is_group: this.pkState.isGroup,
            result: result
        };
        this.reportList.push(data);
    }

    playPKReportStart(isGroup) {
        this.pkState.isGroup = isGroup;
    }

    playPKScore(score) {
        this.pkState.score = score;
    }

    resetPKReport() {
        this.pkState.isGroup = 0;
        this.pkState.score = 0;
    }

    sendReport() {
        //console.log(this.reportList)
        // return
        if (this.reportList.length) {
            Network.sendReport(this.reportList, this.clientInfo);
            this.reportList = [];
        }
    }

    clearTimer() {
        if (this.timeOut) {
            clearInterval(this.timeOut);
        }
    }

    setTimer(REPORTERTIMEOUT) {
        this.timeOut = setInterval(this.sendReport.bind(this), REPORTERTIMEOUT);
    }
}