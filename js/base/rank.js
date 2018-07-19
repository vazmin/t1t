import Storage from "./storage";
import * as Animation from '../animation/animation'
import * as Config from './config';
import ScrollHandler from "../handler/scroll-handler";
import * as THREE from '../libs/three';

var Dpr = window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio; // 当前屏幕的Dpr， i7p 设置3 会挂
var W = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth; // CSS像素
var H = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth; // CSS像素
var HEIGHT = H * Dpr; // 设备像素
var WIDTH = W * Dpr; // 设备像素
var planList = ['btn', 'bg', 'list1', 'list2'];
var CANVASTYPE = { // 当前绘制的2D场景
    'friendRank': 0, // 好友排行榜
    'groupRank': 1,
    'gameOver': 2,
    'start': 3,
    'pk': 4,
    'lookers': 5,
    'gameOverNew': 6, //结算页显示新手引导
    'gameOverHighest': 7, // 结算页达到排行榜最高 / 历史最高
    'beginner': 8 //新手引导页
};
var frustumSizeHeight = Config.FRUSTUMSIZE; // 动画的尺寸单位坐标高度
var frustumSizeWidth = WIDTH / HEIGHT * frustumSizeHeight; // 动画的尺寸单位坐标高度

var DEBUG = false;
var showDebugImg = false;

var ListLineHeight = 60;

var family = wx.loadFont('fonts/num.ttf');

export default class Rank {
    constructor(options) {

        this.texture = {};
        this.material = {};
        this.geometry = {};
        this.obj = {};
        this.canvas = {};
        this.context = {};
        this._touchInfo = { trackingID: -1, maxDy: 0, maxDx: 0 };
        this.options = Object.assign({}, {}, options);
        this.imgid = {
            'btn': 0,
            'bg': 0,
            'list1': 0,
            'list2': 0
        };

        // 相关回调
        // --- 好友排行榜：
        this.options.onGroupShare = options.onGroupShare; // 群分享的时候的回调
        this.options.friendRankReturn = options.friendRankReturn; // 好友排行榜返回上一层， 点击右上角X的回调

        // --- 群排行榜
        this.options.groupPlayGame = options.groupPlayGame; // 我也来玩一局的回调

        // --- 结算页：
        this.options.onClickRank = options.onClickRank; // 点击排行榜的回调
        this.options.onClickReplay = options.onClickReplay; // 点击在玩一局的回调, 排行榜再晚一局的回调
        this.options.onClickShare = options.onClickShare; // 点击分享挑战的回调
        this.options.onClickPureShare = options.onClickPureShare; // 纯分享，用户点击将打开首页

        // --- 首页：
        this.options.onClickStart = options.onClickStart; // 点击开始游戏回调
        this.options.onShowFriendRank = options.onShowFriendRank; // 点击排行榜的回调

        // --- 挑战页：
        this.options.onBattlePlay = options.onBattlePlay; // 玩一局， pk 表示当前分数是pk的， '' 表示当前只是自己玩一局

        // --- 围观页：
        this.options.onLookersStart = options.onLookersStart; // 围观页面，开启新的一局


        // 裁剪区域的大小 - 好友/群排行榜
        this.p0 = new THREE.Vector3(0, 0, 9);
        this.p1 = new THREE.Vector3(-frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), (0.5 - this._cy(143) / HEIGHT) * frustumSizeHeight, 9);
        this.p2 = new THREE.Vector3(frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), frustumSizeHeight * (0.5 - this._cy(143) / HEIGHT), 9);
        this.p3 = new THREE.Vector3(frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), -frustumSizeHeight * (0.5 - this._cy(144) / HEIGHT), 9);
        this.p4 = new THREE.Vector3(-frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), -frustumSizeHeight * (0.5 - this._cy(144) / HEIGHT), 9);

        // 裁剪区域大小 - 挑战
        this.p5 = new THREE.Vector3(-frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), (0.5 - this._cy(205) / HEIGHT) * frustumSizeHeight, 9);
        this.p6 = new THREE.Vector3(frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), frustumSizeHeight * (0.5 - this._cy(205) / HEIGHT), 9);
        this.p7 = new THREE.Vector3(frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), -frustumSizeHeight * (0.5 - this._cy(104) / HEIGHT), 9);
        this.p8 = new THREE.Vector3(-frustumSizeWidth * (0.5 - this._cx(30) / WIDTH), -frustumSizeHeight * (0.5 - this._cy(104) / HEIGHT), 9);

        // DEBUG 的时候多加一层
        if (DEBUG) {
            planList = ['sample', 'btn', 'bg', 'list1', 'list2'];
        }

        // 接口测试：
        // --- 新手指引
        // this.showBeginnerPage();
        // --- 排行榜:
        // this.showFriendRankList(); // 显示好友排行榜 
        // this.showGroupRankList(); // 显示群排行 
        // --- 结算页：
        // this.showGameOverPage({
        //  	score : 0, // 当局分数
        //  	highest_score : 1078, // 历史最高分
        //  	start_time : 2511922923, // 起始时间的秒级时间戳
        //  	week_best_score : 0, // 本周最高分
        //  	game_cnt : 5
        // });

        // --- 首页：
        // this.showStartPage(); 
        // --- 挑战页：
        // this.showPkPage({
        // 	data : {
        // 		organizerInfo : { // 擂主
        // 			headimg : '', // 擂主的头像
        // 			nickname : '游戏小子11111111111111111111111', // 擂主的名字
        // 			score_info : [{
        // 				score : 912 // 擂主的分数
        // 			}],
        // 			left_time : 10, // 创建时间的秒级时间戳
        // 			is_self : 0, // 0 - 不是当前用户，1- 是当前用户
        // 		},
        // 		pkListInfo : [{ // 挑战记录， 不包含当前用户的成绩
        // 			headimg : '', 
        // 			nickname : 'bbbbbbbbbbbbbbbbbb',
        // 			score_info : [{
        // 				score : 4567
        // 			}],
        // 			is_self : 0, // 0 - 不是当前用户，1- 是当前用户
        // 		},{
        // 			headimg : '',
        // 			nickname : 'vvv',
        // 			score_info : [{
        // 				score : 233
        // 			}],
        // 			is_self : 0, // 0 - 不是当前用户，1- 是当前用户
        // 		},{
        // 			headimg : '',
        // 			nickname : 'vvv',
        // 			score_info : [{
        // 				score : 233
        // 			}],
        // 			is_self : 0, // 0 - 不是当前用户，1- 是当前用户
        // 		},{
        // 			headimg : '',
        // 			nickname : 'vvv',
        // 			score_info : [{
        // 				score : 233
        // 			}],
        // 			is_self : 0, // 0 - 不是当前用户，1- 是当前用户
        // 		}],
        // 		gg_score : 1032 // 任何num 都是合法的， 如果没有结算，则传个 undefined 过来
        // 	}
        // })
        // --- 围观页面  按钮居中/背景换成切片/头像白色描边/ 正在玩的分数间距拉大
        // this.showLookersPage({
        // 	headimg : '',
        // 	nickname : 'bbbb',
        // 	type : 'out', // in - 正在玩, gg - 结算, out - 退出    
        // 	score : 666
        // }); // 围观者的游戏中的画面
        // 隐藏这个界面：
        // this.hide2D()
    }

    showFriendRankList(opt) {
        this.hide2D();
        this.showState = true;
        opt = opt || {};
        this.canvasType = CANVASTYPE['friendRank']; // 当前绘制的2D场景
        this.myUserInfo = Storage.getMyUserInfo() || {}; // 更新用户信息
        this.myUserInfo.week_best_score = opt.week_best_score || 0;
        this._createPlane();
        this._updateClip();
        this._drawRankListBg(); // 背景绘制
        this.renderRankList(Storage.getFriendsScore());
    }

    showGroupRankList(list, myUserInfo) {
        this.hide2D();
        this.showState = true;
        this.canvasType = CANVASTYPE['groupRank'];
        this.myUserInfo = myUserInfo || {
            headimg: '',
            nickname: '',
            week_best_score: 0,
            grade: 1
        };
        this._createPlane();
        this._updateClip();
        this.renderRankList(list);
        this._drawRankListBg(); // 背景绘制
    }

    showGameOverPage(opt) {
        this.hide2D();
        // Report.frameReport('xxxxx', 60);
        this.showState = true;
        /*opt = {
score : 1100, // 当局分数
highest_score : 90, // 历史最高分
start_time : 2511922923, // 起始时间的秒级时间戳
week_best_score : 0, // 本周最高分
game_cnt : 5
}*/
        opt = opt || {};
        this.opt = opt || this.opt;

        this._createPlane();

        // 找出那个排行 - 
        this.myUserInfo = Storage.getMyUserInfo() || {
            headimg: '',
            nickname: '',
            week_best_score: 0,
            score_info: [{ score: 0 }] // 更新用户信息
        };
        this.myUserInfo.last_week_best_score = opt.week_best_score;
        this.myUserInfo.week_best_score = Math.max(opt.week_best_score, opt.score) || 0;
        var friendRankList = Storage.getFriendsScore() || [];
        friendRankList.push(this.myUserInfo); // 把自己的最高分放进去
        var rank_list = this._rerank(friendRankList);
        this.sotedRankList = rank_list;
        // console.log('vicky 拿到的结算页的数据： ')
        // console.log(opt)
        // console.log(this.myUserInfo)
        // console.log(friendRankList)
        this.myidx = rank_list.findIndex(this._findSelfIndex.bind(this)) + 1; // 找到自己的index

        // 超越了多少人
        if (opt.score >= opt.highest_score || opt.score >= this.myUserInfo.last_week_best_score) {
            // 达到历史最高分 或者 本周最高分， 计算 超越的人数
            var userInfo = Storage.getMyUserInfo() || { headimg: '', nickname: '', week_best_score: 0, score_info: [{ score: 0 }] };
            userInfo.week_best_score = opt.score;
            var friendRank1 = Storage.getFriendsScore() || [];
            this.changlleList = [];
            for (var j = 0; j < friendRank1.length; j++) {
                if (friendRank1[j].week_best_score < opt.score && friendRank1[j].week_best_score > this.myUserInfo.last_week_best_score) {
                    // 显示新超越的人数， 
                    this.changlleList.push(friendRank1[j]);
                }
            }
        }
        // console.log(' 超越好友数：', this.changlleList)
        // 新手指引，走普通结算
        /*if(opt.score < 5 && opt.game_cnt < 5){
this.canvasType = CANVASTYPE['gameOver']
this._drawGameOver();
} else */
        if (opt.score > opt.highest_score) {
            // 历史最高分
            this.canvasType = CANVASTYPE['gameOverHighest'];
            this.opt.type = 'history';
            this.opt.msg = '历史最高分';
            this._drawGameOverHighest(this.opt, 'history');
        } else if (rank_list.length > 1 && opt.score >= rank_list[0].week_best_score) {
            // 达到排行榜冠军
            this.canvasType = CANVASTYPE['gameOverHighest'];
            this.opt.type = 'rank';
            this._drawGameOverHighest(this.opt, 'rank');
        } else if (opt.score > this.myUserInfo.last_week_best_score) {
            // 本周最高分
            this.canvasType = CANVASTYPE['gameOverHighest'];
            this.opt.type = 'history';
            this.opt.msg = '本周最高分';
            this._drawGameOverHighest(this.opt, 'history');
        } else {
            // 普通结算
            this.canvasType = CANVASTYPE['gameOver'];
            this._drawGameOver();
        }
    }

    showStartPage(opt) {
        this.hide2D();
        if (DEBUG) return;
        this.showState = true;
        this.canvasType = CANVASTYPE['start'];
        this._createPlane();
        this._drawStart(opt);
    }

    showPkPage(opt) {
        this.hide2D();
        // console.log('vicky 拿到的pk数据')
        // console.log(opt)
        this.showState = true;
        opt = opt || {};
        this.data = opt.data;
        this.canvasType = CANVASTYPE['pk'];
        this._createPlane();
        this._updateClip();
        this.myidx = this.data.pkListInfo.findIndex(this._findPartner) + 1;
        this.myUserInfo = this.data.pkListInfo[this.myidx - 1] || Storage.getMyUserInfo();
        this.renderRankList(this.data.pkListInfo);
        this._drawPKListBg();
    }

    showLookersPage(opt) {
        this.hide2D();
        this.showState = true;
        this.canvasType = CANVASTYPE['lookers'];
        this._createPlane();
        this._drawLookers(opt);
    }

    showBeginnerPage() {
        this.hide2D();
        this.showState = true;
        this.canvasType = CANVASTYPE['beginner'];
        this._createPlane();
        this._drawBeginner();
    }

    hide2D() {
        if (DEBUG) return;
        this.showState = false;
        for (var i = 0; i < planList.length; i++) {
            if (!this.obj[planList[i]]) continue;
            this.obj[planList[i]].visible = false;
            this.options.camera.remove(this.obj[planList[i]]);
        }
    }

    hide2DGradually() {
        if (DEBUG) return;
        var that = this;
        for (var i = 0; i < planList.length; i++) {
            if (!this.obj[planList[i]]) continue;
            Animation.customAnimation.to(this.material[planList[i]], 1, {
                opacity: 0,
                onComplete: function(i) {
                    return function() {
                        that.material[planList[i]].opacity = 1;
                        that.obj[planList[i]].visible = false;
                        that.showState = false;
                        that.options.camera.remove(that.obj[planList[i]]);
                    };
                }(i)
            });
        }
    }

    _findDelta(e) {
        var touchInfo = this._touchInfo;
        var touches = e.touches[0] || e.changedTouches[0];
        if (touches) return { x: touches.pageX - touchInfo.x, y: touches.pageY - touchInfo.y };
        return null;
    }

    doTouchStartEvent(e) {
        if (!this.showState) return;
        var pageX = e.changedTouches[0].pageX;
        var pageY = e.changedTouches[0].pageY;
        this.startX = pageX;
        this.startY = pageY;
        if (this.canvasType == CANVASTYPE['friendRank'] || this.canvasType == CANVASTYPE['groupRank'] || this.canvasType == CANVASTYPE['pk']) {
            var touchInfo = this._touchInfo;
            var listener = this.scrollHandler;
            if (!listener) return;

            touchInfo.trackingID = 'touch';
            touchInfo.x = e.touches[0].pageX;
            touchInfo.y = e.touches[0].pageY;

            touchInfo.maxDx = 0;
            touchInfo.maxDy = 0;
            touchInfo.historyX = [0];
            touchInfo.historyY = [0];
            touchInfo.historyTime = [+new Date()];
            touchInfo.listener = listener;

            if (listener.onTouchStart) {
                listener.onTouchStart();
            }
        } else if (this.canvasType == CANVASTYPE['gameOver']) {
            pageX = this._cxp(pageX);
            pageY = this._cyp(pageY);
            if ((!this.noplay_time || this.noplay_time < 0) && pageX > 117 && pageX < 297 && pageY > 540 && pageY < 660) {
                // console.log('click replay');
                this._drawGameOverBtnClick();
            }
        } else if (this.canvasType == CANVASTYPE['start']) {
            pageX = this._cxp(pageX);
            pageY = this._cyp(pageY);
            if (pageX > 100 && pageX < 320 && pageY > 515 && pageY < 645) {
                this._drawStartClick();
            }
        }
    }

    doTouchMoveEvent(e) {
        if (!this.showState) return;
        if (this.canvasType == CANVASTYPE['friendRank'] || this.canvasType == CANVASTYPE['groupRank'] || this.canvasType == CANVASTYPE['pk']) {
            var touchInfo = this._touchInfo;
            if (touchInfo.trackingID == -1) return;
            e.preventDefault();
            var delta = this._findDelta(e);
            if (!delta) return;
            touchInfo.maxDy = Math.max(touchInfo.maxDy, Math.abs(delta.y));
            touchInfo.maxDx = Math.max(touchInfo.maxDx, Math.abs(delta.x));

            // This is all for our crummy velocity computation method. We really
            // should do least squares or anything at all better than just taking
            // the difference between two random samples.
            var timeStamp = +new Date();
            touchInfo.historyX.push(delta.x);
            touchInfo.historyY.push(delta.y);
            touchInfo.historyTime.push(timeStamp);
            while (touchInfo.historyTime.length > 10) {
                touchInfo.historyTime.shift();
                touchInfo.historyX.shift();
                touchInfo.historyY.shift();
            }
            if (touchInfo.listener && touchInfo.listener.onTouchMove) touchInfo.listener.onTouchMove(delta.x, delta.y, timeStamp);
        }
    }

    doTouchEndEvent(e) {
        if (!this.showState) return;
        // 触摸返回按钮
        var pageX = e.changedTouches[0].pageX;
        var pageY = e.changedTouches[0].pageY;
        var isClick = true;
        if ((this.canvasType == CANVASTYPE['friendRank'] || this.canvasType == CANVASTYPE['groupRank'] || this.canvasType == CANVASTYPE['pk'] || this.canvasType == CANVASTYPE['gameOver']) && (Math.abs(pageX - this.startX) > 5 || Math.abs(pageY - this.startY) > 5)) {
            // 不认为是一次 click
            isClick = false;
        }
        pageX = this._cxp(pageX);
        pageY = this._cyp(pageY);

        if (isClick) {
            if (this.canvasType == CANVASTYPE['groupRank']) {
                if (pageX > 134 && pageX < 283 && pageY > 640 && pageY < 727) {
                    this.hide2D();
                    !!this.options.groupPlayGame && this.options.groupPlayGame();
                    return;
                }
            }
            if (this.canvasType == CANVASTYPE['friendRank']) {
                if (pageX > 120 && pageX < 300 && pageY > 640 && pageY < 720) {
                    // console.log('查看群排行');
                    !!this.options.onGroupShare && this.options.onGroupShare();
                    return;
                } else if (pageX > 330 && pageX < 408 && pageY > 100 && pageY < 200) {
                    if (!!this.opt) {
                        this.hide2D();
                        this.showState = true;
                        this.canvasType = CANVASTYPE['gameOver'];
                        this._drawGameOver();
                    } else {
                        !!this.options.friendRankReturn && this.options.friendRankReturn('');
                    }
                    return;
                }
            }
            if (this.canvasType == CANVASTYPE['gameOver']) {
                if (this.opt.type != 'beginner' && this.opt.type != 'tired' && pageX > 25 && pageX < 385 && pageY > 290 && pageY < 500) {
                    // console.log('click rank');
                    !!this.options.onClickRank && this.options.onClickRank();
                } else if (pageX > 150 && pageX < 260 && pageY > 199 && pageY < 260) {
                    // console.log('click share');
                    !!this.options.onClickShare && this.options.onClickShare();
                } else if ((!this.noplay_time || this.noplay_time < 0) && pageX > 117 && pageX < 297 && pageY > 540 && pageY < 660) {
                    // console.log('click replay');
                    !!this.options.onClickReplay && this.options.onClickReplay();
                } else if (!this.noplay_time || this.noplay_time < 0) {
                    this._drawGameOverBtnClickRevert();
                }
                return;
            }
            if (this.canvasType == CANVASTYPE['gameOverHighest']) {
                if (pageX > 340 && pageX < 407 && pageY > 76 && pageY < 138) {
                    // console.log('click return');
                    this.canvasType = CANVASTYPE['gameOver'];
                    this._drawGameOver();
                } else if (pageX > 111 && pageX < 380 && pageY > 540 && pageY < 660) {
                    // console.log('click replay');
                    !!this.options.onClickReplay && this.options.onClickReplay();
                } else if (this.changlleList.length > 0 && pageX > 170 && pageX < 230 && pageY > 330 && pageY < 390) {
                    // 有超越好友的分享
                    // console.log('click pure share');
                    var typ = this.opt.type;
                    if (this.opt.msg == '本周最高分') typ = 'week';
                    !!this.options.onClickPureShare && this.options.onClickPureShare(typ);
                } else if (this.changlleList.length == 0 && pageX > 170 && pageX < 230 && pageY > 410 && pageY < 470) {
                    // 没有超越好友的分享 
                    var typ = this.opt.type;
                    if (this.opt.msg == '本周最高分') typ = 'week';
                    !!this.options.onClickPureShare && this.options.onClickPureShare(typ);
                } else if (this.changlleList.length > 7 && pageX > 55 && pageX < 115 && pageY > 437 && pageY < 497) {
                    // 左翻页
                    this._reDrawChangeAva(-1);
                } else if (this.changlleList.length > 7 && pageX > 297 && pageX < 357 && pageY > 437 && pageY < 497) {
                    // 右翻页
                    this._reDrawChangeAva(1);
                }
            }
            if (this.canvasType == CANVASTYPE['start']) {
                if (pageX > 100 && pageX < 320 && pageY > 515 && pageY < 645) {
                    // console.log('-click 开始游戏')
                    !!this.options.onClickStart && this.options.onClickStart();
                } else if (pageX > 110 && pageX < 290 && pageY > 645 && pageY < 705) {
                    // console.log('-click 排行榜')
                    !!this.options.onShowFriendRank && this.options.onShowFriendRank();
                } else {
                    this._drawStartClickRevert();
                }
                return;
            }
            if (this.canvasType == CANVASTYPE['pk']) {
                if (pageX > 110 && pageX < 310 && pageY > 650 && pageY < 730) {
                    // console.log('不挑战 直接开始');
                    !!this.options.onBattlePlay && this.options.onBattlePlay(''); // 自己玩一局
                    return;
                }
                if (this.data.organizerInfo.left_time > 0 && this.data.organizerInfo.is_self == 0 && pageX > 140 && pageX < 280 && pageY > 325 && pageY < 405) {
                    // console.log('挑战按钮');
                    !!this.options.onBattlePlay && this.options.onBattlePlay('pk'); // 再次挑战
                    return;
                }
            }

            if (this.canvasType == CANVASTYPE['lookers']) {
                if (pageX > 130 && pageX < 280 && pageY > 650 && pageY < 720) {
                    !!this.options.onLookersStart && this.options.onLookersStart();
                }
                return;
            }
        }
        var touchInfo = this._touchInfo;
        if (touchInfo.trackingID == -1) return;
        e.preventDefault();
        var delta = this._findDelta(e);
        if (!delta) return;
        var listener = touchInfo.listener;
        touchInfo.trackingID = -1;
        touchInfo.listener = null;

        // Compute velocity in the most atrocious way. Walk backwards until we find a sample that's 30ms away from
        // our initial sample. If the samples are too distant (nothing between 30 and 50ms away then blow it off
        // and declare zero velocity. Same if there are no samples.
        var sampleCount = touchInfo.historyTime.length;
        var velocity = { x: 0, y: 0 };
        if (sampleCount > 2) {
            var idx = touchInfo.historyTime.length - 1;
            var lastTime = touchInfo.historyTime[idx];
            var lastX = touchInfo.historyX[idx];
            var lastY = touchInfo.historyY[idx];
            var found = false;
            while (idx > 0) {
                idx--;
                var t = touchInfo.historyTime[idx];
                var dt = lastTime - t;
                if (dt > 30 && dt < 50) {
                    // Ok, go with this one.
                    velocity.x = (lastX - touchInfo.historyX[idx]) / (dt / 1000);
                    velocity.y = (lastY - touchInfo.historyY[idx]) / (dt / 1000);
                    break;
                }
            }
        }
        touchInfo.historyTime = [];
        touchInfo.historyX = [];
        touchInfo.historyY = [];

        if (listener && listener.onTouchEnd) listener.onTouchEnd(delta.x, delta.y, velocity);
    }

    updatePosition(scrollY) {
        var viewS; // 好友/ 群排行
        if (scrollY > 0) {
            // 表头下拉效果
            scrollY = 0;
        }
        var listlength = 10 * this._cwh(ListLineHeight) / HEIGHT * frustumSizeHeight; // list length 在 fust 下的尺寸
        var listlength1 = 10 * this._cwh(ListLineHeight);

        if (this.canvasType == CANVASTYPE['friendRank'] || this.canvasType == CANVASTYPE['groupRank']) {
            // 736/2 - 448/2  
            viewS = -(this._cy(143) + listlength1 / 2 - HEIGHT / 2) / HEIGHT * frustumSizeHeight; //这个坐标计算好像有点问题，设计稿是143
        }
        if (this.canvasType == CANVASTYPE['pk']) {
            viewS = -(this._cy(437) + listlength1 / 2 - HEIGHT / 2) / HEIGHT * frustumSizeHeight;
        }

        // 滑到第几屏的list

        var n = Math.floor((viewS - frustumSizeHeight * scrollY / H) / listlength);
        if (this.lastN != n && this.lastN - n < 0) {
            // 下移
            if (n % 2 == 0) {
                this._drawList((n + 1) * 10, 'list2');
            } else {
                this._drawList((n + 1) * 10, 'list1');
            }
        } else if (this.lastN != n && this.lastN - n > 0) {
            // 上移
            var x = n;
            if (x == -1) x = 1;
            if (n % 2 == 0) {
                this._drawList(n * 10, 'list1');
            } else {
                this._drawList(x * 10, 'list2');
            }
        }

        if (n % 2 == 0) {
            this.obj['list1'].position.y = viewS - frustumSizeHeight * scrollY / H - n * listlength;
            this.obj['list2'].position.y = viewS - frustumSizeHeight * scrollY / H - (n + 1) * listlength;
        } else {
            this.obj['list2'].position.y = viewS - frustumSizeHeight * scrollY / H - n * listlength;
            this.obj['list1'].position.y = viewS - frustumSizeHeight * scrollY / H - (n + 1) * listlength;
        }
        this.lastN = n;
        this.lastScrollY = scrollY;
    }

    // ----------------- 列表绘制 -----------------
    _drawList(offset, type) {

        if (type == 'list1') {
            // 两个list互不干扰，只在一个list显示时候++
            this.imgid['list1']++;
        } else if (type == 'list2') {
            this.imgid['list2']++;
        }

        var limit = 10;
        var list = this.sotedRankList.slice(offset, offset + limit);
        // 绘制列表 从 m 开始到 n 结束的列表
        var ctx = this.context[type];
        ctx.clearRect(0, 0, WIDTH, 10 * this._cwh(ListLineHeight));

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        if (this.canvasType == CANVASTYPE['pk']) {
            ctx.fillStyle = 'white';
        }
        ctx.textBaseline = "middle";
        ctx.fillRect(0, 0, WIDTH, 10 * this._cwh(ListLineHeight)); //list 底色为白色

        if (offset != 0 && list.length == 0) {
            // 最后面列表结束显示白色屏幕就可以，不显示
            this._updatePlane(type);
            return;
        }
        if (offset < 0) {
            // 这种情况下不要更新列表
            return;
        }

        var len = list.length;

        var _loop = () => {
            if (this.canvasType != CANVASTYPE['pk']) {
                if (i % 2 == 1) {
                    ctx.fillStyle = 'rgba(255,255,255, 0.03)';
                    ctx.fillRect(0, i * this._cwh(ListLineHeight), this._cwh(414), this._cwh(ListLineHeight));
                }
            }

            // 写一个大的数字
            var y = (i + 0.5) * this._cwh(ListLineHeight); // 每一行中间的y值
            ctx.textAlign = "center";
            n = i + 1 + offset;

            if (n == 1) {
                ctx.fillStyle = 'rgb(250,126,0)';
            } else if (n == 2) {
                ctx.fillStyle = 'rgb(254,193,30)';
            } else if (n == 3) {
                ctx.fillStyle = 'rgb(251,212,19)';
            } else {
                ctx.fillStyle = '#aaa';
            }
            ctx.font = "italic bold " + this._cf(17);
            ctx.fillText(n, this._cx(58.5), y);

            // 绘制头像
            var that = this;

            var g = list[i].grade || 0;
            this._drawImageRound(list[i].headimg, this._cx(107), y, this._cwh(34), this._cwh(34), type, function() {
                if (that.canvasType == CANVASTYPE['pk']) {
                    that._drawImageCenter('images/ava_lookers.png', that._cx(107), y, that._cwh(37), that._cwh(37), type, null, that.imgid[type]);
                } else that._drawImageCenter('images/ava_rank.png', that._cx(107), y, that._cwh(47), that._cwh(47), type, null, that.imgid[type]);
            }, this.imgid[type], true);

            if (this.canvasType == CANVASTYPE['pk']) {
                // 写名字
                ctx.textAlign = "left";
                ctx.fillStyle = '#000';
                ctx.font = 'bold ' + this._cf(17);
                ctx.fillText(this._cname(list[i].nickname, 16), this._cx(144), y - this._cwh(10));

                if (list[i].score_info[0].score > this.data.organizerInfo.score_info[0].score) {
                    ctx.font = this._cf(12);
                    ctx.fillStyle = '#FC4814';
                    ctx.fillText('挑战成功', this._cx(144), y + this._cwh(12));
                    ctx.fillStyle = '#000';
                } else {
                    ctx.font = this._cf(12);
                    ctx.fillStyle = '#888';
                    ctx.fillText('挑战失败', this._cx(144), y + this._cwh(12));
                }

                ctx.textAlign = "right";
                ctx.font = this._cf(22, true);
                ctx.fillText(list[i].score_info[0].score || 0, this._cx(364), y);
            } else {
                // 写名字
                ctx.textAlign = "left";
                ctx.fillStyle = '#fff';
                ctx.font = this._cf(17);
                list[i].nickname = list[i].nickname || '';
                ctx.fillText(this._cname(list[i].nickname, 16), this._cx(144), y);

                // 写分数
                ctx.textAlign = "right";
                ctx.font = this._cf(22, true);
                ctx.fillText(list[i].week_best_score || 0, this._cx(364), y);
            }
        };

        for (var i = 0; i < len; i++) {
            var n;

            _loop();
        }

        if (len == 0) {
            // 没有任何数据
            ctx.textAlign = "center";
            ctx.fillStyle = '#ccc';
            ctx.font = this._cf(14);
            if (this.canvasType == CANVASTYPE['pk']) {
                ctx.fillText('暂无人应战', this._cx(207), this._cwh(100));
            } else {
                ctx.fillText('暂无排行数据', this._cx(207), this._cy(429));
            }
        }
        this._updatePlane(type);
    }

    renderRankList(res) {
        var rank_list = [];
        this.myUserInfo = this.myUserInfo || { headimg: '', nickname: '', week_best_score: 0, score_info: [{ score: 0 }] };

        if (this.canvasType == CANVASTYPE['friendRank'] || this.canvasType == CANVASTYPE['groupRank']) {
            res = res || [];
            res.push(this.myUserInfo); // 把自己的最高分放进去
            rank_list = this._rerank(res);
            this.sotedRankList = rank_list; // 存下来，滑动的时候用到
        } else {
            this.sotedRankList = res; // 存下来，滑动的时候用到
        }
        var innerHeight = this.sotedRankList.length * this._cwh(ListLineHeight) / Dpr;
        var outterOffsetHeight;

        if (this.canvasType == CANVASTYPE['friendRank'] || this.canvasType == CANVASTYPE['groupRank']) {
            this.myidx = rank_list.findIndex(this._findSelfIndex.bind(this)) + 1; // 找到自己的index
            outterOffsetHeight = this._cwh(445) / Dpr;
        }
        if (this.canvasType == CANVASTYPE['pk']) {
            outterOffsetHeight = this._cwh(194) / Dpr;
        }
        // scroll handler
        this.scrollHandler = new ScrollHandler({
            innerOffsetHeight: innerHeight, // 个数 * 每一行的高度百分比 * 总高度
            outterOffsetHeight: outterOffsetHeight,
            updatePosition: this.updatePosition.bind(this)
        });
        this._drawList(0, 'list1'); // 绘制滚动列表
        this._drawList(10, 'list2'); // 绘制滚动列表
    }

    _drawGameOverBtnClick() {
        // 再玩一局的点击态
        var ctx = this.context['btn'];
        ctx.clearRect(this._cx(91), this._cy(567), this._cwh(232), this._cwh(94));
        this._drawImageCenter('images/replay.png', this._cx(207), this._cy(607), this._cwh(190), this._cwh(75), 'btn', null, this.imgid['btn']);
    }

    _drawGameOverBtnClickRevert() {
        // 再玩一局的点击态
        var ctx = this.context['btn'];
        ctx.clearRect(this._cx(91), this._cy(567), this._cwh(232), this._cwh(94));
        this._drawImageCenter('images/replay.png', this._cx(207), this._cy(607), this._cwh(212), this._cwh(84), 'btn', null, this.imgid['btn']);
    }

    _drawStartClick() {
        // 再玩一局的点击态
        var ctx = this.context['btn'];
        ctx.clearRect(this._cx(91), this._cy(547), this._cwh(232), this._cwh(94));
        this._drawImageCenter('images/play.png', this._cx(207), this._cy(587), this._cwh(190), this._cwh(75), 'btn', null, this.imgid['btn']);
    }

    _drawStartClickRevert() {
        // 再玩一局的点击态
        var ctx = this.context['btn'];
        ctx.clearRect(this._cx(91), this._cy(547), this._cwh(232), this._cwh(94));
        this._drawImageCenter('images/play.png', this._cx(207), this._cy(587), this._cwh(212), this._cwh(84), 'btn', null, this.imgid['btn']);
    }

    // ----------------- 背景绘制 -----------------

    _drawPKListBg() {
        // 绘制背景图
        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'rgba(0,0,0, 0.8)';
        ctx.fillRect(0, 0, (WIDTH - this._cwh(354)) / 2, HEIGHT); // 左
        ctx.fillRect(this._cx(384), 0, (WIDTH - this._cwh(354)) / 2, HEIGHT); // 右

        ctx.fillRect(this._cx(30), 0, this._cwh(354), this._cy(110)); // 上
        ctx.fillRect(this._cx(30), this._cy(632), this._cwh(354), this._cy(144)); // 下

        // 显示擂主分数
        // 列表背景
        ctx.fillStyle = 'rgb(250,250,250)';
        ctx.fillRect(this._cx(31), this._cy(103), this._cwh(354), this._cwh(335));

        ctx.lineWidth = 2 * Dpr;
        ctx.strokeStyle = '#fff';
        this._roundedRectR(this._cx(30), this._cy(102), this._cwh(354), this._cwh(530), 1 * Dpr, 'bg');

        ctx.textBaseline = "middle";
        // 绘制头像
        var that = this;

        if (this.data.gg_score == undefined) {
            // 显示擂主信息
            this._drawImageCenter(this.data.organizerInfo.headimg, this._cx(207), this._cy(158), this._cwh(50), this._cwh(50), 'bg', null, this.imgid['bg']);
            // 写名字
            ctx.textAlign = "center";
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.font = this._cf(14);
            ctx.fillText(this.data.organizerInfo.nickname, this._cx(207), this._cy(195));
            ctx.fillText('擂主得分', this._cx(207), this._cy(242));
            // 一条线
            ctx.lineWidth = 0.5 * Dpr;
            ctx.strokeStyle = 'rgba(0,0,0,0.06)';
            ctx.beginPath();
            ctx.moveTo(this._cx(160), this._cy(217));
            ctx.lineTo(this._cx(254), this._cy(217));
            ctx.closePath();
            ctx.stroke();

            // 小方块
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(this._cx(162), this._cy(239), this._cwh(9), this._cwh(3));
            ctx.fillRect(this._cx(162), this._cy(244), this._cwh(9), this._cwh(3));
            ctx.fillRect(this._cx(241), this._cy(239), this._cwh(9), this._cwh(3));
            ctx.fillRect(this._cx(241), this._cy(244), this._cwh(9), this._cwh(3));

            // 写分数
            ctx.fillStyle = '#000';
            ctx.font = this._cf(66, true);
            ctx.fillText(this.data.organizerInfo.score_info[0].score, this._cx(207), this._cy(298));
        } else {
            // 显示挑战结果
            var suc_src = void 0,
                suc_word = void 0,
                c1 = void 0,
                c2 = void 0;
            if (this.data.gg_score > this.data.organizerInfo.score_info[0].score) {
                // 挑战成功
                suc_src = 'images/suc.png';
                suc_word = '挑战成功';
                c1 = 'rgba(0,0,0,1)';
                c2 = 'rgba(0,0,0,0.3)';
                // 烟花
                this._drawImageCenter('images/flower_small.png', this._cx(207), this._cy(175), this._cwh(140), this._cwh(53), 'bg', null, this.imgid['bg']);
            } else {
                // 挑战失败
                suc_src = 'images/fail.png';
                suc_word = '挑战失败';
                c1 = 'rgba(0,0,0,0.3)';
                c2 = 'rgba(0,0,0,1)';
            }

            // 顶部icon
            this._drawImageCenter(suc_src, this._cx(207), this._cy(135), this._cwh(20), this._cwh(15), 'bg', null, this.imgid['bg']);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.font = 'bold ' + this._cf(30);
            ctx.fillText(suc_word, this._cx(207), this._cy(178));

            // 头像
            this._drawImageCenter(this.myUserInfo.headimg, this._cx(158), this._cy(289), this._cwh(26), this._cwh(26), 'bg', null, this.imgid['bg']);
            this._drawImageCenter(this.data.organizerInfo.headimg, this._cx(260), this._cy(289), this._cwh(26), this._cwh(26), 'bg', null, this.imgid['bg']);
            // 名字
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.font = this._cf(11);
            ctx.fillText(this._cname(this.myUserInfo.nickname, 16), this._cx(158), this._cy(318));
            ctx.fillText(this._cname(this.data.organizerInfo.nickname, 16), this._cx(260), this._cy(318));

            // 分数
            ctx.fillStyle = c1;
            ctx.font = this._cf(44, true);
            if (this.data.gg_score > 999) {
                ctx.textAlign = 'right';
                ctx.fillText(this.data.gg_score, this._cx(190), this._cy(253));
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(this.data.gg_score, this._cx(158), this._cy(253));
            }

            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.3)';

            ctx.fillRect(this._cx(202), this._cy(242), this._cwh(10), this._cwh(4));

            ctx.fillStyle = c2;
            ctx.font = this._cf(44, true);
            if (this.data.organizerInfo.score_info[0].score > 999) {
                ctx.textAlign = 'left';
                ctx.fillText(this.data.organizerInfo.score_info[0].score, this._cx(231), this._cy(253));
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(this.data.organizerInfo.score_info[0].score, this._cx(260), this._cy(253));
            }
        }

        // 列表有一条分界线
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this._cx(30), this._cy(437));
        ctx.lineTo(this._cx(384), this._cy(437));
        ctx.stroke();
        ctx.closePath();

        // 挑战btn
        var msg = '挑战';
        var that = this;
        if (this.data.organizerInfo.left_time > 0 && this.data.organizerInfo.is_self == 0) {
            // 剩余时间 > 0 并且不是擂主，就可以挑战
            if (this.myidx > 0) {
                // 有名次的一定是 [1, ~)
                msg = '再次挑战';
            }
            this._drawImageCenter('images/btn_bg_g.png', this._cx(207), this._cy(368), this._cwh(130), this._cwh(63), 'bg', function() {
                ctx.textAlign = "center";
                ctx.fillStyle = '#fff';
                ctx.font = that._cf(14);
                ctx.fillText(msg, that._cx(207), that._cy(368));
                that._updatePlane('bg');
            }, this.imgid['bg']);
            // 显示有效时间
            ctx.font = this._cf(12);;
            ctx.textAlign = "right";
            ctx.fillStyle = '#000';
            ctx.fillText('有效时间至', this._cx(223), this._cy(403.5));
            ctx.textAlign = "left";
            ctx.fillStyle = '#fc4814';
            var nt = +new Date();
            var lt = nt + this.data.organizerInfo.left_time * 1000;
            nt = new Date(lt);
            var ho = nt.getHours();
            ho = ho < 10 ? '0' + ho : ho;
            var m = nt.getMinutes();
            m = m < 10 ? '0' + m : m;
            ctx.fillText(ho + ':' + m, this._cx(225), this._cy(403.5));
        } else if (this.data.organizerInfo.left_time == 0 && this.data.organizerInfo.is_self == 0) {
            // 没有剩余时间并且不是擂主， 显示失效
            var that = this;
            this._drawImageCenter('images/btn_bg_h.png', this._cx(207), this._cy(368), this._cwh(130), this._cwh(63), 'bg', function() {
                ctx.font = that._cf(14);
                ctx.textAlign = "center";
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillText('挑战结束', that._cx(207), that._cy(368));
                that._updatePlane('bg');
            }, this.imgid['bg']);
            ctx.font = this._cf(14);
            ctx.textAlign = "center";
            ctx.fillStyle = '#888';
            ctx.fillText('已失效', this._cx(207), this._cy(403.5));
        } else if (this.data.organizerInfo.left_time > 0 && this.data.organizerInfo.is_self == 1) {
            // 有剩余时间，是擂主，擂主看到失效时间
            ctx.font = this._cf(14);
            ctx.textAlign = "right";
            ctx.fillStyle = '#888';
            ctx.fillText('有效时间至', this._cx(223), this._cy(369));
            ctx.textAlign = "left";
            ctx.fillStyle = '#2c9f67';
            var nt = +new Date();
            var lt = nt + this.data.organizerInfo.left_time * 1000;
            nt = new Date(lt);
            var ho = nt.getHours();
            ho = ho < 10 ? '0' + ho : ho;
            var m = nt.getMinutes();
            m = m < 10 ? '0' + m : m;
            ctx.fillText(ho + ':' + m, this._cx(225), this._cy(369));
        }

        ctx.textAlign = "center";
        ctx.fillStyle = '#fff';
        ctx.font = this._cf(17);
        ctx.fillText('不挑战，直接开始', this._cx(199), this._cy(688));
        this._drawImageCenter('images/r_arr.png', this._cx(280), this._cy(688), this._cwh(6.5), this._cwh(12.5), 'bg', null, this.imgid['bg']);

        this._updatePlane('bg');
    }

    _drawRankListBg() {
        // 绘制背景图
        this.imgid['bg']++; // 从另一个bg场景，到这一个bg场景，为了不渲染上一个bg场景的图片，这里应该++
        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'rgba(0,0,0, 0.8)';
        ctx.fillRect(0, 0, (WIDTH - this._cwh(354)) / 2, HEIGHT); // 左
        ctx.fillRect(this._cx(384), 0, (WIDTH - this._cwh(354)) / 2, HEIGHT); // 右

        ctx.fillRect(this._cx(30), 0, this._cwh(354), this._cy(110)); // 上
        ctx.fillRect(this._cx(30), this._cy(592), this._cwh(354), this._cy(144)); // 下

        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // 列表里面的半透明的蒙层
        /*var grd=ctx.createLinearGradient(this._cx(30), this._cy(185), this._cx(30), this._cy(191)); // xyxy
grd.addColorStop(0, "rgba(0,0,0, 0.04)");
grd.addColorStop(1,"rgba(255,255,255, 0.1)");
ctx.fillStyle=grd;
ctx.fillRect(this._cx(30), this._cy(185), this._cx(354), this._cx(6)); // xy wh*/

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(this._cx(30), this._cy(110), this._cwh(354), this._cwh(33));

        // 列表有一条分界线
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1 * Dpr;
        ctx.beginPath();
        ctx.moveTo(this._cx(30), this._cy(143));
        ctx.lineTo(this._cx(384), this._cy(143));
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + this._cf(12);
        ctx.textAlign = "left";
        ctx.fillText('每周一凌晨刷新', this._cx(54), this._cy(126.5));

        ctx.lineWidth = 1 * Dpr;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        this._roundedRectR(this._cx(30), this._cy(110), this._cwh(354), this._cwh(482), 1 * Dpr, 'bg');

        this._updatePlane('bg');

        if (this.canvasType == CANVASTYPE['groupRank']) {
            var that = this;
            ctx.font = that._cf(17);
            ctx.fillStyle = '#fff';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText('玩一局', that._cx(207), that._cy(680));
            this._drawImageCenter('images/r_arr.png', this._cx(244), this._cy(680), this._cwh(6.6), this._cwh(10), 'bg', null, this.imgid['bg']);
        }
        if (this.canvasType == CANVASTYPE['friendRank']) {
            ctx.fillStyle = '#fff';
            ctx.font = this._cf(17);
            ctx.textAlign = "left";
            ctx.fillText('查看群排行', this._cx(177), this._cy(674));
            this._drawImageCenter('images/r_arr.png', this._cx(270), this._cy(674), this._cwh(6.6), this._cwh(10), 'bg', null, this.imgid['bg']);
            this._drawImageCenter('images/rank.png', this._cx(154), this._cy(674), this._cwh(22), this._cwh(22), 'bg', null, this.imgid['bg']);
            this._drawImageCenter('images/close.png', this._cx(375), this._cy(114), this._cwh(48), this._cwh(48), 'bg', null, this.imgid['bg']);
        }
    }

    _drawGameOver() {
        var this2 = this;

        this.imgid['bg'];
        var opt = this.opt;
        opt.score = opt.score || 0;
        opt.highest_score = opt.highest_score || 0;
        var that = this;
        // 绘制背景图
        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'rgba(0,0,0, 0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.textBaseline = "middle";

        // 分数
        ctx.textAlign = "center";
        ctx.fillStyle = '#fff';
        ctx.font = this._cf(14);
        ctx.fillText('本次得分', this._cx(207), this._cy(84));

        ctx.fillStyle = '#fff';
        ctx.font = this._cf(88, true);
        ctx.fillText(opt.score, this._cx(207 + 5), this._cy(150));

        // 本次得分的小方块
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(this._cx(162), this._cy(78), this._cwh(9), this._cwh(3));
        ctx.fillRect(this._cx(162), this._cy(84), this._cwh(9), this._cwh(3));
        ctx.fillRect(this._cx(241), this._cy(78), this._cwh(9), this._cwh(3));
        ctx.fillRect(this._cx(241), this._cy(84), this._cwh(9), this._cwh(3));

        // 发起挑战
        this._drawImageCenter('images/btn.png', this._cx(207), this._cy(214), this._cwh(86), this._cwh(32), 'bg', null, this.imgid['bg']);
        ctx.font = this._cf(13);
        ctx.fillStyle = '#fff';
        ctx.fillText('发起挑战', this._cx(207), this._cy(214));

        var showTired = false; // 是否显示温馨提示
        if ((opt.game_cnt > 5 || opt.score > 5) && // 不是新手引导
            opt.score < opt.highest_score && // 不是历史最高分
            this.myidx != 1 && // 不是排行榜第一
            !this._has_show_tired && // 从未显示过
            +new Date() / 1000 - opt.start_time > 1800 // 玩的时间超过半小时
        ) {
            showTired = true;
            this._has_show_tired = true;
        }

        if (showTired) {
            // this._has_show_tired = true;
            // 游戏时间超过30min
            ctx.lineWidth = 4 * Dpr;
            ctx.strokeStyle = '#fff';
            ctx.fillStyle = '#fff';
            this._roundedRectR(this._cx(31), this._cy(298), this._cwh(354), this._cwh(210), 1 * Dpr, 'bg');
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.font = this._cf(17);
            ctx.textAlign = 'left';
            ctx.fillText('玩了这么久', this._cx(80), this._cy(370));
            ctx.fillText('休息一下吧', this._cx(80), this._cy(410));

            this._drawImageCenter('images/tired.png', this._cx(297), this._cy(397), this._cwh(179), this._cwh(185), 'bg', null, that.imgid['bg']);
            this.opt.type = 'tired';
        } else {
            ctx.lineWidth = 0.5 * Dpr;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            this._roundedRectR(this._cx(30), this._cy(297), this._cwh(354), this._cwh(192), 4 * Dpr, 'bg');
            ctx.fill();
            // 排行榜背景
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(this._cx(150), this._cy(336), this._cwh(115), this._cwh(153));

            /*// 左右投影
var grd=ctx.createLinearGradient(this._cx(90), this._cy(336), this._cx(150), this._cy(336)); // xyxy
grd.addColorStop(0, "rgba(0,0,0, 0.1)");
grd.addColorStop(1, "rgba(0,0,0, 0.4)");
ctx.fillStyle=grd;
ctx.fillRect(this._cx(90), this._cy(336), this._cwh(60), this._cwh(153)); // xy wh
// 左右投影
var grd=ctx.createLinearGradient(this._cx(264), this._cy(336), this._cx(324), this._cy(336)); // xyxy
grd.addColorStop(0, "rgba(0,0,0, 0.4)");
grd.addColorStop(1, "rgba(0,0,0, 0.1)");
ctx.fillStyle=grd;
ctx.fillRect(this._cx(264), this._cy(336), this._cwh(60), this._cwh(153)); // xy wh*/

            // 排行榜文字
            ctx.beginPath();
            ctx.lineWidth = 0.5 * Dpr;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.moveTo(this._cx(30), this._cy(336));
            ctx.lineTo(this._cx(384), this._cy(336));
            ctx.stroke();
            ctx.closePath();

            ctx.font = this._cf(12);
            ctx.textAlign = "left";
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText('排行榜 · 每周一凌晨刷新', this._cx(46), this._cy(316));
            ctx.fillStyle = '#fff';
            ctx.fillText('查看全部排行', this._cx(291), this._cy(316));
            this._drawImageCenter('images/r_arr.png', this._cx(371), this._cy(315), this._cwh(6.6), this._cwh(10), 'bg', null, this.imgid['bg']);

            // 排行榜数据
            // 个人要居中
            var start = this.myidx - 2;
            var no_friend_idx = 0;
            if (this.sotedRankList.length == 1) {
                // 该用户没有好友，自己要显示在中间
                no_friend_idx = 1;
            }
            for (var i = 0; i < 3; i++) {
                ctx.font = "italic bold " + this._cf(16);
                ctx.textAlign = "center";

                if (this.myidx == 1 && i == 0) {
                    start++;
                }
                if (this.myidx == this.sotedRankList.length && i == 2) {
                    // 最后一名，第三个格子空出
                    continue;
                }
                if (this.myidx == start + 1 + i) {
                    // 自己的名次是绿色
                    ctx.fillStyle = '#41bf8c';
                } else {
                    ctx.fillStyle = '#888';
                }
                if (!!this.sotedRankList[start + i]) {
                    var that;

                    (function() {
                        ctx.fillText(start + 1 + i, this2._cx(90 + 118 * (i + no_friend_idx)), this2._cy(356));
                        ctx.font = this2._cf(14);
                        ctx.fillStyle = '#888';
                        ctx.fillText(this2._cname(this2.sotedRankList[start + i].nickname, 14), this2._cx(90 + 118 * (i + no_friend_idx)), this2._cy(435));

                        ctx.font = this2._cf(22, true);
                        ctx.fillStyle = '#fff';
                        ctx.fillText(this2.sotedRankList[start + i].week_best_score || 0, this2._cx(90 + 118 * (i + no_friend_idx)), this2._cy(463));
                        that = this2;

                        var x0 = this2._cx(90 + 118 * (i + no_friend_idx));
                        this2._drawImageRound(this2.sotedRankList[start + i].headimg, x0, this2._cy(393), this2._cwh(42), this2._cwh(42), 'bg', function() {
                            that._drawImageCenter('images/ava_rank.png', x0, that._cy(393), that._cwh(58), that._cwh(58), 'bg', null, that.imgid['bg']);
                        }, this2.imgid['bg'], true);
                    })();
                }
            }
        }

        // 在玩一局， 返回的时候不要重新渲染
        var ctx1 = this.context['btn'];
        ctx1.clearRect(0, 0, WIDTH, HEIGHT);
        if (showTired) {
            this._drawImageCenter('images/noplay.png', this._cx(207), this._cy(607), this._cwh(212), this._cwh(84), 'btn', function() {
                ctx1.fillStyle = '#00C777';
                ctx1.textBaseline = 'middle';
                ctx1.font = that._cf(22);
                that.noplay_time = 5;
                ctx1.fillText(that.noplay_time, that._cx(140), that._cy(607));
                that._updatePlane('btn');
                that.timer = setInterval(function() {
                    that.noplay_time--;
                    if (that.noplay_time <= 0) {
                        clearInterval(that.timer);
                        ctx1.clearRect(0, 0, WIDTH, HEIGHT);
                        that._drawImageCenter('images/replay.png', that._cx(207), that._cy(607), that._cwh(212), that._cwh(84), 'btn', null, that.imgid['btn']);
                    } else {
                        ctx1.fillStyle = 'white';
                        ctx1.fillRect(that._cx(125), that._cy(590), that._cwh(30), that._cwh(30));
                        ctx1.fillStyle = '#00C777';
                        ctx1.textBaseline = 'middle';
                        ctx1.font = that._cf(22);
                        ctx1.fillText(that.noplay_time, that._cx(140), that._cy(607));
                        that._updatePlane('btn');
                    }
                }, 1000);
            }, this.imgid['btn']);
        } else {
            var ctx1 = this.context['btn'];
            ctx1.clearRect(this._cx(91), this._cy(547), this._cwh(232), this._cwh(94));
            this._drawImageCenter('images/replay.png', this._cx(207), this._cy(607), this._cwh(212), this._cwh(84), 'btn', null, this.imgid['btn']);
        }

        // 历史最高分
        ctx.font = this._cf(14);
        ctx.textAlign = "center";
        ctx.fillStyle = '#fff';
        ctx.fillText('历史最高分：' + Math.max(opt.highest_score, opt.score), this._cx(207), this._cy(703));

        this._updatePlane('bg');
    }

    _drawStart(opt) {
        opt = opt || {};
        // 绘制背景图
        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'rgba(0,0,0, 0.3)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        var that = this;
        this._drawImageCenter('images/title.png', this._cx(204), this._cy(168), this._cwh(207), this._cwh(52), 'bg', null, this.imgid['bg']);

        var ctx1 = this.context['btn'];
        ctx1.clearRect(0, 0, WIDTH, HEIGHT);
        this._drawImageCenter('images/play.png', that._cx(207), that._cy(587), that._cwh(208), that._cwh(78), 'btn', null, this.imgid['btn']);

        ctx.font = this._cf(17);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('排行榜', this._cx(213.5), that._cy(684));

        // 246 684
        this._drawImageCenter('images/r_arr.png', this._cx(250), this._cy(684), this._cwh(6.6), this._cwh(10), 'bg', null, this.imgid['bg']);

        this._drawImageCenter('images/rank.png', this._cx(165), this._cy(684), this._cwh(22), this._cwh(22), 'bg', null, this.imgid['bg']);

        this._updatePlane('bg');
    }

    _drawLookers(opt) {
        // 绘制背景图
        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // 绘制头像
        var that = this;

        var score = opt.score || 0;
        var name = opt.nickname || '';
        ctx.textAlign = "center";

        ctx.textBaseline = "middle";
        if (opt.type == 'in') {
            this._drawImageRound(opt.headimg, this._cx(207), this._cy(91), this._cx(50), this._cx(50), 'bg', function() {
                that._drawImageCenter('images/ava_lookers.png', that._cx(207), that._cy(91), that._cx(53), that._cx(53), 'bg', null, that.imgid['bg']);
            }, this.imgid['bg'], true);
            ctx.font = this._cf(17);
            ctx.fillStyle = 'black';
            ctx.fillText(name + ' 正在游戏中', this._cx(207), this._cy(144));
        } else if (opt.type == 'gg') {
            ctx.fillStyle = 'rgba(0,0,0, 0.4)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            this._drawImageRound(opt.headimg, this._cx(207), this._cy(91), this._cwh(50), this._cwh(50), 'bg', function() {
                that._drawImageCenter('images/ava_lookers.png', that._cx(207), that._cy(91), that._cwh(53), that._cwh(53), 'bg', null, that.imgid['bg']);
            }, this.imgid['bg'], true);
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'white';
            ctx.font = this._cf(17);
            ctx.fillText(name + ' 游戏已结束', this._cx(207), this._cy(144));
            ctx.lineWidth = 0.5 * Dpr;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.moveTo(this._cx(157), this._cy(176));
            ctx.lineTo(this._cx(257), this._cy(176));
            ctx.closePath();
            ctx.stroke();
            ctx.font = this._cf(14);
            ctx.fillText('游戏得分', this._cx(207), this._cy(207));
            // 小方块
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(this._cx(156), this._cy(203), this._cwh(9), this._cwh(3));
            ctx.fillRect(this._cx(156), this._cy(209), this._cwh(9), this._cwh(3));
            ctx.fillRect(this._cx(243), this._cy(203), this._cwh(9), this._cwh(3));
            ctx.fillRect(this._cx(243), this._cy(209), this._cwh(9), this._cwh(3));
            ctx.fillStyle = '#fff';
            ctx.font = this._cf(80, true);
            ctx.fillText(score || 0, this._cx(212), this._cy(267));
        } else if (opt.type == 'out') {
            ctx.fillStyle = 'rgba(0,0,0, 0.4)';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            this._drawImageRound(opt.headimg, this._cx(207), this._cy(221), this._cwh(50), this._cwh(50), 'bg', function() {
                that._drawImageCenter('images/ava_lookers.png', that._cx(207), that._cy(221), that._cwh(53), that._cwh(53), 'bg', null, that.imgid['bg']);
            }, this.imgid['bg'], true);

            ctx.fillStyle = '#fff';
            ctx.font = this._cf(17);
            ctx.fillText(name + ' 游戏已结束', this._cx(207), this._cy(278));
        }

        var that = this;
        this._drawImageCenter('images/btn_iplay.png', this._cx(207), this._cy(663), this._cwh(131), this._cwh(54), 'bg', null, this.imgid['bg']);

        this._updatePlane('bg');
    }

    _drawGameOverHighest(opt, type) {
        this.imgid['bg']++;
        opt.score = opt.score || 0;

        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = 'rgba(0,0,0, 0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // 避免一次触发了超越，一次没有触发超越，显示了上一次的头像
        var ctx1 = this.context['btn'];
        ctx1.clearRect(this._cx(30), this._cy(448), this._cwh(354), this._cwh(55));

        // 历史最高分
        ctx.font = this._cf(14);
        ctx.textAlign = "center";
        ctx.fillStyle = '#fff';
        ctx.fillText('历史最高分：' + Math.max(opt.highest_score, opt.score), this._cx(207), this._cy(703));

        // 历史最高分 / 本周最高分 / 各种称号
        if (type == 'history') {
            if (this.changlleList.length == 0) {
                // 没有超越好友
                ctx.lineWidth = 2 * Dpr;
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this._roundedRectR(this._cx(30), this._cy(104), this._cwh(354), this._cwh(371), 4 * Dpr, 'bg');
                ctx.fill();
                // 分享
                this._drawImageCenter('images/pure_share.png', this._cx(207), this._cy(440), this._cwh(18), this._cwh(24), 'bg', null, this.imgid['bg']);
            } else {
                // 有超越的好友
                ctx.lineWidth = 2 * Dpr;
                ctx.strokeStyle = 'rgba(255,255,255,0.06)';
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this._roundedRectR(this._cx(30), this._cy(104), this._cwh(354), this._cwh(401), 4 * Dpr, 'bg');
                ctx.fill();
                // 线
                ctx.lineWidth = 0.5 * Dpr;
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.moveTo(this._cx(127), this._cy(406));
                ctx.lineTo(this._cx(287), this._cy(406));
                ctx.stroke();
                ctx.closePath();

                ctx.font = this._cf(14);
                ctx.fillStyle = '#fff';
                ctx.fillText('排名新超越' + this.changlleList.length + '位好友', this._cx(207), this._cy(429));

                // 好友头像
                this.changlleListStart = 0;
                this._reDrawChangeAva(0);

                // 分享
                this._drawImageCenter('images/pure_share.png', this._cx(207), this._cy(368), this._cwh(18), this._cwh(24), 'bg', null, this.imgid['bg']);
            }
            // 开始一坨称号的表演
            var other_msg = '';
            var color = '';
            var w = 80;
            if (this.opt.msg == '历史最高分') {

                if (this.opt.highest_score < 100 && this.opt.score >= 100) {
                    // 第一次达到100分
                    other_msg = '初窥门径';
                    color = '#509FC9';
                }
                if (this.opt.highest_score < 500 && this.opt.score >= 500) {
                    other_msg = '耐得寂寞';
                    color = '#E67600';
                }
                if (this.opt.highest_score < 1000 && this.opt.score >= 1000) {
                    other_msg = '登堂入室';
                    color = '#009D5E';
                }
                if (this.opt.highest_score < 2000 && this.opt.score >= 2000) {
                    other_msg = '无聊大师';
                    color = '#7A0096';
                }
                if (this.opt.highest_score < 3000 && this.opt.score >= 3000) {
                    other_msg = '一指禅';
                    color = '#555555';
                }
                if (this.opt.highest_score < 5000 && this.opt.score >= 5000) {
                    other_msg = '立地成佛';
                    color = '#AC8742';
                }
                // 结束一坨称号的表演
            }
            if (!!other_msg) {
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1 * Dpr;

                // ctx.fillRect( this._cx(163), this._cy(154), this._cx(88), this._cx(26) );
                this._roundedRectR(this._cx(207 - w / 2), this._cy(154), this._cwh(w), this._cwh(26), 2 * Dpr, 'bg');
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + this._cf(14);
                ctx.fillText(other_msg, this._cx(207), this._cy(167));
            } else this._drawImageCenter('images/new.png', this._cx(207), this._cy(167), this._cwh(58), this._cwh(26), 'bg', null, this.imgid['bg']);

            ctx.font = this._cf(14);
            ctx.textAlign = "center";
            ctx.fillStyle = '#fff';
            ctx.textBaseline = 'middle';

            ctx.fillText(this.opt.msg || '本周最高分', this._cx(207), this._cy(224));

            ctx.font = this._cf(86, true);
            ctx.fillStyle = '#00c777';
            ctx.fillText(opt.score, this._cx(207), this._cy(292.5));
        }

        // 排行榜最高分
        if (type == 'rank') {
            this._drawImageCenter('images/new.png', this._cx(207), this._cy(167), this._cwh(58), this._cwh(26), 'bg', null, this.imgid['bg']);

            ctx.lineWidth = 2 * Dpr;
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            this._roundedRectR(this._cx(30), this._cy(104), this._cwh(354), this._cwh(371), 4 * Dpr, 'bg');
            ctx.fill();

            var that = this;
            this._drawImageRound(this.myUserInfo.headimg, this._cx(207), this._cy(291), this._cwh(56), this._cwh(56), 'bg', function() {
                that._drawImageCenter('images/gold.png', that._cx(207), that._cy(253), that._cwh(40), that._cwh(40), 'bg', null, that.imgid['bg']);
            }, this.imgid['bg']);

            ctx.font = this._cf(14);
            ctx.textAlign = "center";
            ctx.fillStyle = '#fff';
            ctx.textBaseline = 'middle';
            ctx.fillText('排行榜冠军', this._cx(207), this._cy(224));

            ctx.font = this._cf(40, true);
            ctx.fillStyle = '#00c777';
            ctx.fillText(opt.score, this._cx(207), this._cy(349));

            // 分享
            this._drawImageCenter('images/pure_share.png', this._cx(207), this._cy(415), this._cwh(18), this._cwh(24), 'bg', null, this.imgid['bg']);
        }

        // title的小方块
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(this._cx(155), this._cy(218.5), this._cwh(9), this._cwh(3));
        ctx.fillRect(this._cx(155), this._cy(224.5), this._cwh(9), this._cwh(3));
        ctx.fillRect(this._cx(248), this._cy(218.5), this._cwh(9), this._cwh(3));
        ctx.fillRect(this._cx(248), this._cy(224.5), this._cwh(9), this._cwh(3));

        // 关闭 - 回到正常结算页
        this._drawImageCenter('images/close.png', this._cx(375), this._cy(112), this._cwh(43), this._cwh(43), 'bg', null, this.imgid['bg']);

        // 头像会改变层级，所以要在头像之后显示
        var ctx1 = this.context['btn'];
        ctx1.clearRect(this._cx(91), this._cy(547), this._cwh(232), this._cwh(94));
        this._drawImageCenter('images/replay.png', this._cx(207), this._cy(607), this._cwh(212), this._cwh(84), 'btn', null, this.imgid['btn']);

        // 礼花
        this._drawImageCenter('images/flower.png', this._cx(207), this._cy(290), this._cwh(260), this._cwh(141), 'bg', null, this.imgid['bg']);

        /*var that = this;
        this.particles = {};
        setInterval(function(){
        that.explode(-7, 9, 1);// 烟花动画
        that.explode(7, 9, 2);// 烟花动画
        that.explode(0, 2, 3);// 烟花动画
        }, 3000)*/
        this._updatePlane('bg');
    }

    _reDrawChangeAva(pos) {
        var this3 = this;

        this.imgid['btn']++; // 避免上一次的头像显示在这里
        if (this.changlleListStart + pos * 5 < 0 || this.changlleListStart + pos * 5 >= this.changlleList.length) {
            return;
        }
        this.changlleListStart = this.changlleListStart + pos * 5;

        var show_ava_list = this.changlleList.slice(this.changlleListStart, this.changlleListStart + 5);
        var n = show_ava_list.length,
            w = 32,
            p = 10;
        var startx = 207 - (n * 32 + (n - 1) * 10) / 2;

        var ctx = this.context['btn'];
        ctx.clearRect(this._cx(30), this._cy(448), this._cwh(354), this._cwh(55));

        var _loop2 = function _loop2() {
            var x0 = this3._cx(startx + w / 2 + i * (w + p));
            that = this3;

            this3._drawImageRound(show_ava_list[i].headimg, x0, this3._cy(469), this3._cwh(w), this3._cwh(w), 'btn', function() {
                that._drawImageCenter('images/ava_rank.png', x0, that._cy(469), that._cwh(w + 14), that._cwh(w + 14), 'btn', null, that.imgid['btn']);
            }, this3.imgid['btn'], true);
        };

        for (var i = 0; i < n; i++) {
            var that;

            _loop2();
        }

        // 是否显示左右箭头
        if (this.changlleList.length > 5 && this.changlleListStart + 5 < Math.floor(this.changlleList.length / 5) * 5) {
            this._drawImageCenter('images/r_arr1.png', this._cx(339), this._cy(469), this._cwh(6), this._cwh(8), 'btn', null, this.imgid['btn']);
        }
        if (this.changlleList.length > 5 && this.changlleListStart != 0) {
            this._drawImageCenter('images/l_arr.png', this._cx(69), this._cy(469), this._cwh(6), this._cwh(8), 'btn', null, this.imgid['btn']);
        }
    }

    _drawBeginner() {
        var ctx = this.context['bg'];
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(this._cx(103), this._cy(134), this._cwh(206), this._cwh(115));

        ctx.fillStyle = 'black';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = this._cf(17);
        ctx.fillText('长按屏幕并释放', this._cx(207), this._cy(172));

        ctx.textAlign = 'left';
        ctx.fillText('控制', this._cx(149), this._cy(213));

        ctx.textAlign = 'right';
        ctx.fillText('向前跳', this._cx(265), this._cy(213));

        this._drawImageCenter('images/i.png', this._cx(198), this._cy(211), this._cwh(13.2), this._cwh(35.6), 'bg', null, this.imgid['bg']);

        this._updatePlane('bg');
    }

    // ----------------- 画布创建与更新 -----------------
    _createPlane() {
        // 创建画布
        if (!!this.canvas['bg']) return;
        for (var i = 0; i < planList.length; i++) {
            this.canvas[planList[i]] = document.createElement('canvas');
            this.context[planList[i]] = this.canvas[planList[i]].getContext('2d');
            this.canvas[planList[i]].width = WIDTH;
            if (planList[i] == 'list1' || planList[i] == 'list2') {
                // 高度是10倍的列表高度
                this.canvas[planList[i]].height = 10 * this._cwh(ListLineHeight);
            } else {
                this.canvas[planList[i]].height = HEIGHT;
            }

            this.texture[planList[i]] = new THREE.Texture(this.canvas[planList[i]]);
            // this.texture[i].needsUpdate = true;
            this.material[planList[i]] = new THREE.MeshBasicMaterial({ map: this.texture[planList[i]], transparent: true });
            if (planList[i] == 'list1' || planList[i] == 'list2') {
                this.geometry[planList[i]] = new THREE.PlaneGeometry(frustumSizeWidth, 10 * this._cwh(ListLineHeight) / HEIGHT * frustumSizeHeight);
            } else {
                this.geometry[planList[i]] = new THREE.PlaneGeometry(frustumSizeWidth, frustumSizeHeight);
            }
            this.obj[planList[i]] = new THREE.Mesh(this.geometry[planList[i]], this.material[planList[i]]);
            this.material[planList[i]].map.minFilter = THREE.LinearFilter;
            this.obj[planList[i]].position.y = 0; // 上下
            this.obj[planList[i]].position.x = 0; // 左右
            this.obj[planList[i]].position.z = 9 - i * 0.001; // 前后 -1 - scrollBar , -2 background, -3 list 1, -4 list 2
        }

        if (DEBUG && showDebugImg) {
            var ctx = this.context['sample'];
            ctx.globalAlpha = 0.4;
            var that = this;
            setTimeout(function() {
                that._drawImageCenter('images/sample.png', that._cx(207), that._cy(368), that._cwh(414), that._cwh(736), 'sample', null, that.imgid);
            }, 2000);
        }
    }

    _updatePlane(type) {
        // 画布更新
        if (!this.showState) {
            return;
        }

        if (this.canvasType == CANVASTYPE['gameOver'] && type != 'bg' && type != 'btn' && type != 'sample') {
            return;
        }
        if (this.canvasType == CANVASTYPE['start'] && type != 'bg' && type != 'btn' && type != 'sample') {
            return;
        }
        this.texture[type].needsUpdate = true;
        this.obj[type].visible = true;
        this.options.camera.add(this.obj[type]);
    }

    _updateClip() {
        // 更新切面位置
        var cp0 = this.p0.clone();
        var cp1 = this.p1.clone();
        var cp2 = this.p2.clone();
        var cp3 = this.p3.clone();
        var cp4 = this.p4.clone();
        if (this.canvasType == CANVASTYPE['pk']) {
            cp1 = this.p5.clone();
            cp2 = this.p6.clone();
            cp3 = this.p7.clone();
            cp4 = this.p8.clone();
        }

        this.options.camera.updateMatrixWorld();
        var matrixWorld = this.options.camera.matrixWorld;

        cp0.applyMatrix4(matrixWorld);
        cp1.applyMatrix4(matrixWorld);
        cp2.applyMatrix4(matrixWorld);
        cp3.applyMatrix4(matrixWorld);
        cp4.applyMatrix4(matrixWorld);

        var triangle = new THREE.Triangle(cp2, cp1);
        var cutA = triangle.plane();
        this._negatePlane(cutA, cp0.clone());

        triangle = new THREE.Triangle(cp3, cp2);
        var cutB = triangle.plane();
        this._negatePlane(cutB, cp0.clone());

        triangle = new THREE.Triangle(cp4, cp3);
        var cutC = triangle.plane();
        this._negatePlane(cutC, cp0.clone());

        triangle = new THREE.Triangle(cp1, cp4);
        var cutD = triangle.plane();
        this._negatePlane(cutD, cp0.clone());

        this.material['list1'].clippingPlanes = [cutA, cutB, cutC, cutD];
        this.material['list1'].needsUpdate = true;
        this.material['list2'].clippingPlanes = [cutA, cutB, cutC, cutD];
        this.material['list2'].needsUpdate = true;

        // 更新切面位置结束
    }

    // ----------------- 工具函数 -----------------

    _cname(x, namelen) {
        namelen = namelen || 16;
        x = x || '';
        var len = x.replace(/[^\x00-\xff]/g, '**').length;
        if (len > namelen) {
            x = this._sliceName(x, namelen) + '...';
        }
        return x;
    }

    _sliceName(x, namelen) {
        x = x || '';
        var len = x.replace(/[^\x00-\xff]/g, '**').length;
        if (len > namelen) {
            x = x.substring(0, x.length - 1);
            x = this._sliceName(x, namelen);
        }
        return x;
    }

    _cwh(x) {
        var realx = x * W / 414;
        if (H / W < 736 / 414) {
            // 某4
            realx = x * H / 736;
        }
        return realx * Dpr;
    }

    _cx(x) {
        // change x 
        // x 为 在 414*736 屏幕下的，标准像素的 x ，即为设计图的x的px值
        // realx 表示在当前屏幕下，应该得到的x值，这里所有屏幕画布将按照x轴缩放
        var realx = x * W / 414;
        if (H / W < 736 / 414) {
            // 某4
            realx = x * H / 736 + (W - H * 414 / 736) / 2;
        }
        return realx * Dpr;
    }

    _cy(y) {
        // change y
        // y 位在 414*736 屏幕下的，标准像素的y，即为设计图的y的px值
        // realy表示在当前屏幕下，应该得到的y值，如果屏幕的长宽值特别大（某X，某note8），那么就上下留白
        var really;
        if (H / W > 736 / 414) {
            // 某X
            // 屏幕显示区域的高度h: WIDTH*736/414, 上下留白是  (HEIGHT - h)/2
            really = y * W / 414 + (H - W * 736 / 414) / 2;
        } else {
            really = y * H / 736;
        }
        return really * Dpr;
    }

    _cf(size, is_num) {
        // font size 
        var realf = size * Dpr * W / 414;
        if (H / W < 736 / 414) {
            // 某4
            realf = size * Dpr * H / 736;
        }
        if (!!is_num && !!family) return realf + ('px ' + family);
        else return realf + 'px Helvetica';
    }

    _cxp(x) {
        // 根据坐标反推出x
        return x / W * 414;
    }

    _cyp(y) {
        // 根据坐标反推出y
        var really;
        if (H / W > 736 / 414) {
            // 某X
            // 屏幕显示区域的高度h: WIDTH*736/414, 上下留白是  (HEIGHT - h)/2
            really = (y - (H - W * 736 / 414) / 2) / W * 414;
        } else {
            really = y / H * 736;
        }
        return really;
    }

    _negatePlane(plane, point) {
        if (!plane || !point) {
            return;
        }
        var distance = plane.distanceToPoint(point);
        if (distance < 0) {
            plane.negate();
        }
    }

    _drawImageCenter(src, x, y, width, height, type, cb, imgid, noupdate) {
        // imgid 是渲染时候的imgid， 在每次改变画布的时候自增
        // 以xy为中心来显示一副图片

        if (src == '/0' || src == '/96' || src == '/64' || !src) {
            src = 'images/ava.png';
        }
        var img = new Image();
        var that = this;
        img.onload = function() {
            if (that.imgid[type] == imgid) {
                that.context[type].drawImage(img, x - width / 2, y - height / 2, width, height);
                !!cb && cb();
                if (!noupdate) that._updatePlane(type); // 更新画布
            } else {}
            //console.log(that.imgid[type], imgid, type, src, '出现了时序错误!!!')

            // 切到了其他场景，自然cb也就不需要了
        };
        img.onerror = function() {
            !!cb && cb();
        };
        img.src = src;
    }

    _drawImageRound(src, x, y, width, height, type, cb, imgid, noupdate) {
        // imgid 是渲染时候的imgid， 在每次改变画布的时候自增
        // 以xy为中心来显示一副图片
        if (src == '/0' || src == '/96' || src == '/64' || !src) {
            src = 'images/ava.png';
        }
        // src = 'http://wx.qlogo.cn/mmhead/Q3auHgzwzM73y96lOXERaFVGib5ENtBXAVQ1Zn9Wk1oNIAEKibq7jMTA/96'
        var img = new Image();
        var that = this;
        var ctx = this.context[type];
        var can = this.canvas[type];
        img.onload = function() {
            if (that.imgid[type] == imgid) {
                ctx.save();
                that._roundedRectR(x - width / 2, y - height / 2, width, height, 2, type);
                ctx.clip();
                ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
                ctx.closePath();
                ctx.restore();
                !!cb && cb();
                if (!noupdate) that._updatePlane(type); // 更新画布
            } else {}
            //console.log(that.imgid[type], imgid, type, src, '出现了时序错误!!!')

            // 切到了其他场景，自然cb也就不需要了
        };
        img.onerror = function() {
            !!cb && cb();
        };
        img.src = src;
    }

    _rerank(array) {
        // 排行榜重新排序
        var i = 0,
            len = array.length,
            j,
            d;
        for (; i < len; i++) {
            for (j = 0; j < len; j++) {
                if (array[i].week_best_score > array[j].week_best_score) {
                    d = array[j];
                    array[j] = array[i];
                    array[i] = d;
                }
            }
        }
        return array;
    }

    _findSelfIndex(element, index, array) {
        // 从排行列表中找出自己的排名
        return element.nickname === this.myUserInfo.nickname;
    }

    _findPartner(element, index, array) {
        // 从排行列表中找出自己的排名
        return element.is_self === 1;
    }

    _roundedRectR(x, y, width, height, radius, type) {
        var ctx = this.context[type];
        ctx.beginPath();
        ctx.moveTo(x, y + radius - 1);
        ctx.lineTo(x, y + height - radius);
        ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
        ctx.lineTo(x + width - radius, y + height);
        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        ctx.lineTo(x + width, y + radius);
        ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
        ctx.lineTo(x + radius, y); // 终点
        ctx.quadraticCurveTo(x, y, x, y + radius);
        ctx.stroke();
        ctx.closePath();
    }

    explode(x, y, idx) {
        if (!this.particles[idx]) {
            var colors = [0x00B6F1, 0x1800FF, 0xFF0000, 0xFEFF00, 0x00FF00];
            this.materials = [];
            var geometry = new THREE.PlaneGeometry(0.4, 0.4);
            for (var i = 0; i < colors.length; ++i) {
                this.materials.push(new THREE.MeshBasicMaterial({ color: colors[i], transparent: true }));
            }
            this.particles[idx] = [];
            for (var i = 0; i < 25; ++i) {
                var particle = new THREE.Mesh(geometry, this.materials[i % colors.length]);
                // particle.position.set(0, 0, 9.9);
                this.options.camera.add(particle);
                this.particles[idx].push(particle);
            }
        }
        var t1 = 0.35;
        var t2 = 0.35;

        for (var i = 0; i < this.particles[idx].length; ++i) {
            var x0 = x,
                y0 = y;
            this.particles[idx][i].position.set(x0, y0, 9.9);

            // 快速 随机左右散开，占 2/3
            var x1 = (1 - 2 * Math.random()) * 5 + x0;
            var y1 = (1 - 2 * Math.random()) * 5 + y0;

            var x11 = x0 + (x1 - x0) * 0.95;
            var y11 = y0 + (y1 - y0) * 0.95;

            Animation.customAnimation.to(this.particles[idx][i].position, t1, {
                x: x11,
                y: y11
            });

            Animation.customAnimation.to(this.particles[idx][i].position, t2, {
                x: x1,
                y: y1,
                delay: t1
            });
        }
        /*for (var i = 0; i < this.materials.length; ++i) {
this.materials[i].opacity = 1;
customAnimation.to(this.materials[i], t2, { opacity: 0, delay: t1});
}*/
    }

    showFinger() {
        var this4 = this;

        return;
        if (!this.hand) {
            this.hand = new THREE.Mesh(new THREE.PlaneGeometry(2, 3.4), new THREE.MeshBasicMaterial({ map: _config.loader.load('images/hand.png'), transparent: true }));
            this.hand.position.set(11, -8, 9.9);
            this.circle = new THREE.Mesh(new THREE.RingGeometry(1, 1.2, 30), new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true }));
            this.circle.position.set(10.5, -6.8, 9.9);
        }
        this.options.camera.add(this.hand);
        this.options.camera.add(this.circle);
        Animation.customAnimation.to(this.circle.material, 0.1, { opacity: 1 });
        Animation.customAnimation.to(this.circle.scale, 0.3, { x: 1.5, y: 1.5, z: 1.5 });
        Animation.customAnimation.to(this.circle.material, 0.1, { opacity: 0, delay: 1.3 });

        Animation.customAnimation.to(this.hand.scale, 0.5, { x: 1, y: 1, delay: 1 });
        Animation.customAnimation.to(this.hand.scale, 0.5, { x: 1.5, y: 1.5, delay: 2 });

        this.fingerTimer = setTimeout(function() {
            this4.showFinger();
            this4.circle.scale.set(1, 1, 1);
        }, 3000);
    }

    clearFinger() {
        if (this.fingerTimer) {
            clearTimeout(this.fingerTimer);
            this.fingerTimer = null;
        }
        this.opts.camera.remove(this.hand);
    }
}