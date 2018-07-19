import Network from "./base/network";
import Session from "./base/session";
import * as CONFIG from './base/config';
import { TweenAnimation, customAnimation } from './animation/animation';
import { random, setRandomSeed } from './utils/random';
import Storage from "./base/storage";
import GameCtrl from "./game/game-ctrl";
import GameView from "./game/game-view";
import GameModel from "./game/game-model";
import InstuctionCtrl from "./ctrl/instuction-ctrl";
import historyTimes from "./base/history-times";
import reporter from "./base/reporter";
import AudioManager from "./base/audio-manager";
import GameSocket from "./base/game-socket";
import * as THREE from './libs/three';
import Ground from "./models/ground";
import Wave from "./models/wave";
import Block from "./models/block";
import Bottle from "./models/bottle";
import { pureShare } from "./base/share";
import TailSystem from "./models/tail";
import UI from "./base/ui";
import Rank from "./base/rank";
import viewer from "./models/viewer";
import RankSystem from "./base/rank-system";
import { pointInPolygon } from "./utils/point-in-polygon";

//window.console = { log: function() {}, error: function() {}, warn: function() {} };
var HEIGHT = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
var WIDTH = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;
var TIMEOUT = 9000;
var SERVERCONFIG = 60000;
// const SERVERCONFIG = 1000
var SYCTIME = 10000;
var REPORTERTIMEOUT = 60001;
// const REPORTERTIMEOUT = 1000
var system = wx.getSystemInfoSync() || {};
var isIPhone = system.platform == 'ios';
var model = system.model;

export default class Main {
    constructor(options) {
        // 模式：单机，围观(玩家，观察者），挑战，首屏，loading, viewerWating, viewer,viewergg,viewerout
        //console.log('options', options)
        this.options = options;
        this.is_from_wn = 0;
        // this.is_from_wn = 1

        this.firstInit = true;
        this.distance = 0;

        this.heightestScore = 0;

        // 目前stage有 game,friendRankList,singleSettlementPgae,groupShareList,battlePage
        this.stage = '';
        this.succeedTime = 0;
        this.lastAddBonus = -2;

        this.lastStage = '';

        // 定时器，死亡碰撞
        this.deadTimeout = null;

        // 本小局分数
        this.currentScore = 0;
        this.seq = 0;

        this.thirdBlock = null;

        this.straight = true;

        this.firstBlood = false;

        this.lastHardLevel = 200;
        this.guider = false;

        this.hardDistances = [];

        this.duration = [];
        this.quickArr = [];
        this.socketFirstSync = false;
        this.init();

        this.randomSeed = Date.now();
        setRandomSeed(this.randomSeed);
        this.actionList = [];
        this.musicList = [];
        this.touchList = [];
        this.blocks = [];

        this.liveTime = 0;

        wx.setKeepScreenOn && wx.setKeepScreenOn({
            keepScreenOn: true
        });
    }

    moveGradually(vector, duration) {
        if (this.animating && !this.guider) {
            //console.log("moveGradually", vector, duration);
            TweenAnimation(this.bottle.obj.position.x, this.bottle.obj.position.x - vector.x, duration * 500, 'Linear', function(value, complete) {
                this.bottle.obj.position.x = value;
                if (complete) {
                    this.bottle.obj.position.x = -0.098;
                }
            }.bind(this));

            // TweenAnimation(this.bottle.obj.position.z, this.bottle.obj.position.z - vector.z, duration * 500, 'Linear', function (value) {
            //   this.bottle.obj.position.z = value
            // }.bind(this))

            for (var i = 0, len = this.blocksInUse.length; i < len; ++i) {
                TweenAnimation(this.blocksInUse[i].obj.position.x, this.blocksInUse[i].obj.position.x - vector.x, duration * 500, 'Linear', function(value) {
                    this.obj.position.x = value;
                }.bind(this.blocksInUse[i]));
                // TweenAnimation(this.blocksInUse[i].obj.position.z, this.blocksInUse[i].obj.position.z - vector.z, duration * 500, 'Linear', function (value) {
                //   this.obj.position.z = value
                // }.bind(this.blocksInUse[i]))
            }
            if (this.blocks[0]) {
                TweenAnimation(this.blocks[0].obj.position.x, this.blocks[0].obj.position.x - vector.x, duration * 500, 'Linear', function(value) {
                    this.obj.position.x = value;
                }.bind(this.blocks[0]));
            }
        } else {
            TweenAnimation(this.camera.position.x, this.camera.position.x + vector.x, duration * 500, 'Quad.easeOut', function(value) {
                this.camera.position.x = value;
            }.bind(this));
            TweenAnimation(this.camera.position.z, this.camera.position.z + vector.z, duration * 500, 'Quad.easeOut', function(value) {
                this.camera.position.z = value;
            }.bind(this));
            //TweenMax.to(this.camera.position, duration, { ease: Power2.easeOut, x: this.camera.position.x + vector.x, z: this.camera.position.z + vector.z });
        }
    }

    update(tickTime) {
        var _this = this;

        // 更新尾巴
        if (this.tailSystem) {
            this.tailSystem.update(tickTime * 1000);
        }

        this.bottle.update(tickTime);
        this.UI.update();
        if (this.renderer.shadowMap.enabled) {
            this.shadowTarget.position.x = this.bottle.obj.position.x;
            this.shadowTarget.position.z = this.bottle.obj.position.z;
            this.shadowLight.position.x = this.bottle.obj.position.x + 0;
            this.shadowLight.position.z = this.bottle.obj.position.z + 10;
        }
        for (var i = 0, len = this.blocksInUse.length; i < len; ++i) {
            this.blocksInUse[i].update();
        }

        if (this.guider && this.blocks[0]) this.blocks[0].update();

        if ((this.bottle.status === 'forerake' || this.bottle.status === 'hypsokinesis') && this.hit != 5) {
            var boxes = this.bottle.getBox();
            var blockBox = this.bottle.status === 'forerake' ? this.nextBlock.getBox() : this.currentBlock.getBox();
            for (var i = 0, len = boxes.length; i < len; ++i) {
                if (boxes[i].intersectsBox(blockBox)) {
                    //   var box = new THREE.BoxHelper(this.bottle.middle, 0xffff00 );
                    // var box2 = new THREE.BoxHelper(this.bottle.head, 0xffff00 );
                    // var box3 = new THREE.BoxHelper(this.currentBlock.body, 0xffff00);
                    // this.scene.add(box3);
                    // this.scene.add(box2);
                    // this.scene.add( box );
                    if (i == 0) {
                        this.bottle.rotate();
                        if (this.suspendTimer) {
                            clearTimeout(this.suspendTimer);
                            this.suspendTimer = null;
                        }
                    } else if (i == 1) {
                        this.bottle.suspend();
                        if (this.suspendTimer) {
                            clearTimeout(this.suspendTimer);
                            this.suspendTimer = null;
                        }
                    } else if (i == 2 && !this.suspendTimer) {
                        this.suspendTimer = setTimeout(function() {
                            _this.bottle.suspend();
                            _this.suspendTimer = null;
                        }, 90 * this.distance);
                    }
                    break;
                }
            }
        }

        // 物理碰撞
        if (this.bottle.obj.position.y <= CONFIG.BLOCK.height / 2 + 0.1 && this.bottle.status === 'jump' && this.bottle.flyingTime > 0.3 && !this.pendingReset) {
            if (this.hit === 1 || this.hit === 7) {
                this.bottle.stop();
                this.succeed();
                if (this.animating) return;
                //this.addWave(Math.min(1, 4));
                if (this.hit === 1) {
                    //this.bottle.showAddScore(1, true);
                    // 播放命中靶心
                    this.audioManager['combo' + Math.min(this.doubleHit + 1, 8)].seek(0);
                    this.audioManager['combo' + Math.min(this.doubleHit + 1, 8)].play();

                    ++this.doubleHit;
                    this.addWave(Math.min(this.doubleHit, 4));
                    this.bottle.showAddScore(1, true, this.quick);
                    this.UI.addScore(1, true, this.quick);
                    this.currentScore = this.UI.score;

                    if (this.mode != 'observe') {
                        this.showCombo();
                    }
                } else {

                    // 播放成功音乐
                    this.doubleHit = 0;
                    this.UI.addScore(1, false, this.quick);
                    this.currentScore = this.UI.score;
                    this.bottle.showAddScore(1, false, this.quick);
                }
                this.audioManager.success.seek(0);
                this.audioManager.success.play();

                if (this.mode != 'observe') {

                    // 更新超越头像
                    this.rankSystem.update();
                }
            } else if (this.hit === 2) {
                this.bottle.stop();
                this.bottle.obj.position.y = CONFIG.BLOCK.height / 2;
                this.bottle.obj.position.x = this.bottle.destination[0];
                this.bottle.obj.position.z = this.bottle.destination[1];
            } else if (this.hit === 3) {
                this.bottle.hypsokinesis();
                this.audioManager.fall_2.play();
                this.bottle.obj.position.y = CONFIG.BLOCK.height / 2;
            } else if (this.hit === 4 || this.hit === 5) {
                this.bottle.forerake();
                this.audioManager.fall_2.play();
                this.bottle.obj.position.y = CONFIG.BLOCK.height / 2;
            } else if (this.hit === 0) {
                this.bottle.fall();
                this.audioManager.fall.play();
                this.bottle.obj.position.y = CONFIG.BLOCK.height / 2;
            } else if (this.hit === 6) {
                this.bottle.stop();
                this.audioManager.fall.play();
                this.bottle.obj.position.y = CONFIG.BLOCK.height / 2;
            } else if (this.hit === -1) {
                this.bottle.stop();
                this.bottle.obj.position.y = CONFIG.BLOCK.height / 2;
                this.bottle.obj.position.x = 0;
            }
            if (this.hit === 0 || this.hit === 3 || this.hit === 4 || this.hit === 5 || this.hit === 6) {
                if (this.guider) {
                    if (this.UI.score > 0) {
                        this.guider = false;
                    } else {
                        if (this.liveTime > 3) {
                            this.guider = false;
                            this.full2D.hide2DGradually();
                        } else {
                            this.live();
                            return;
                        }
                    }
                }
                this.pendingReset = true;
                this.currentScore = this.UI.score;
                this.gameCtrl.gameOver(this.currentScore);
                this.deadTimeout = setTimeout(function() {
                    TweenAnimation.killAll();
                    _this.gameCtrl.gameOverShowPage();
                    _this.pendingReset = false;
                    if (_this.mode == 'observe') {
                        _this.instructionCtrl.onCmdComplete();
                    }
                }, 2000);
            } else {
                if (this.mode == 'observe') {
                    this.instructionCtrl.onCmdComplete();
                }
            }
        }
        //var a = Date.now();
        this.renderer.render(this.scene, this.camera);
    }

    succeed() {
        var _this2 = this;

        ++this.succeedTime;
        this.musicScore = false;
        this.lastSucceedTime = Date.now();
        if (this.succeedTime % 15 == 0) {
            this.ground.changeColor();
        }
        if (this.blocksInUse.length >= 9) {
            var temp = this.blocksInUse.shift();
            temp.obj.visible = false;
            this.blocksPool.push(temp);
        }
        var firstV = this.nextBlock.obj.position.clone().sub(this.currentBlock.obj.position);
        this.bottle.obj.position.x = this.bottle.destination[0];
        this.bottle.obj.position.z = this.bottle.destination[1];
        this.bottle.squeeze();
        var block = this.thirdBlock;
        if (this.firstAnimating) return;
        if (this.guider) {
            this.guider = false;
            this.full2D.hide2DGradually();
        }
        if (this.animating) {} else {
            if (this.nextBlock.order == 15) {
                this.nextBlock.glow();
            } else if (this.nextBlock.order == 19) {
                var box = this.nextBlock;
                // this.audioManager.register('sing', () => {
                //    box.playMusic();
                //  });
                this.musicTimer = setTimeout(function() {
                    _this2.audioManager.sing.seek(0);
                    _this2.audioManager.sing.play();
                    box.playMusic();
                    _this2.musicScore = true;
                    _this2.UI.addScore(30, false, false, true);
                    _this2.bottle.showAddScore(30, false, false, true);
                }, 2000);
            } else if (this.nextBlock.order == 24) {
                var box = this.nextBlock;
                this.audioManager.register('store', function() {
                    box.openDoor();
                }, function() {
                    box.closeDoor();
                });
                this.musicTimer = setTimeout(function() {
                    _this2.audioManager.store.seek(0);
                    _this2.audioManager.store.play();
                    _this2.musicScore = true;
                    _this2.UI.addScore(15, false, false, true);
                    _this2.bottle.showAddScore(15, false, false, true);
                }, 2000);
            } else if (this.nextBlock.order == 26) {
                this.musicTimer = setTimeout(function() {
                    _this2.audioManager.water.seek(0);
                    _this2.audioManager.water.play();
                    _this2.UI.addScore(5, false, false, true);
                    _this2.musicScore = true;
                    _this2.bottle.showAddScore(5, false, false, true);
                }, 2000);
            } else if (this.nextBlock.order == 17) {
                var box = this.nextBlock;
                this.musicTimer = setTimeout(function() {
                    box.rotateBox();
                    _this2.musicScore = true;
                    _this2.UI.addScore(10, false, false, true);
                    _this2.bottle.showAddScore(10, false, false, true);
                }, 2000);
            }
            var nextPosition = this.nextBlock.obj.position.clone();
            var distance = this.nextBlock.radius + this.distance + block.radius;
            var straight = this.straight;
            var straight = this.straight;
            if (straight) {
                nextPosition.x += distance;
                this.bottle.lookAt('straight', nextPosition.clone());
            } else {
                nextPosition.z -= distance;
                this.bottle.lookAt('left', nextPosition.clone());
            }
            block.obj.position.x = nextPosition.x;
            block.obj.position.z = nextPosition.z;
            this.audioManager['pop'].seek(0);
            this.audioManager['pop'].play();
        }
        block.popup();
        var secondV = block.obj.position.clone().sub(this.nextBlock.obj.position);
        var cameraV = firstV.add(secondV);
        cameraV.x /= 2;
        cameraV.z /= 2;
        // this.blocksInUse.push(block);
        this.scene.add(block.obj);
        this.currentBlock = this.nextBlock;
        this.nextBlock = block;

        var duration = cameraV.length() / 10;
        if (CONFIG.GAME.canShadow) this.bottle.scatterParticles();
        if (this.animating) cameraV.x = 19.8;
        this.moveGradually(cameraV, duration);
        this.bottle.human.rotation.z = 0;
        this.bottle.human.rotation.x = 0;
    }

    handleWxOnHideEvent() {
        this.show = false;

        if (this.animateTimer) {
            clearTimeout(this.animateTimer);
            this.animateTimer = null;
        }

        if (this.onshowAnimateTimer) {
            clearTimeout(this.onshowAnimateTimer);
            this.onshowAnimateTimer = null;
        }

        this.gameCtrl.wxOnhide();
    }

    init() {
        var _this3 = this;

        var fb = Storage.getFirstBlood();
        if (!fb && !this.options.query.mode) {
            this.guider = true;
        }
        this.gameCtrl = new GameCtrl(this);
        this.gameView = new GameView(this);
        this.gameModel = new GameModel(this);
        this.instructionCtrl = new InstuctionCtrl(this);

        /**
         * 历史玩过的次数
         */
        this.historyTimes = new historyTimes(this);

        /**
         * 数据上报
         */
        this.reporter = new reporter();

        /**
         * 数据初始化
         */
        this.audioManager = new AudioManager(this);
        this.gameSocket = new GameSocket(this);

        /**
         * 初始化场景
         */
        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

        var frustumSize = CONFIG.FRUSTUMSIZE;
        var aspect = WIDTH / HEIGHT;
        this.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, -10, 85);
        this.camera.position.set(-17, 30, 26);
        this.camera.lookAt(new THREE.Vector3(13, 0, -4));
        this.scene.add(this.camera);

        // var CameraHelper = new THREE.CameraHelper(this.camera);
        // this.scene.add(CameraHelper);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, preserveDrawingBuffer: true });
        window.renderer = this.renderer;
        //this.renderer.sortObjects = false
        //this.renderer.setPixelRatio(1)
        //this.renderer.setPixelRatio(window.devicePixelRatio ? (isIPhone ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio) : 1);


        // 坐标轴
        //var AxesHelper = new THREE.AxesHelper(1000);
        //this.scene.add(AxesHelper);

        this.blocksPool = [];
        this.blocksInUse = [];
        this.doubleHit = 0;
        if (isIPhone && (model.indexOf('iPhone 4') >= 0 || model.indexOf('iPhone 5') >= 0 || system.system.indexOf('iOS 9') >= 0 || system.system.indexOf('iOS 8') >= 0 || model.indexOf('iPhone 6') >= 0 && model.indexOf('iPhone 6s') < 0)) {
            this.renderer.shadowMap.enabled = false;
            CONFIG.GAME.canShadow = false;
            this.renderer.setPixelRatio(1.5);
            //wx.setPreferredFramesPerSecond && wx.setPreferredFramesPerSecond(45); 
        } else {
            if (typeof system.benchmarkLevel != 'undefined' && system.benchmarkLevel < 5 && system.benchmarkLevel != -1) {
                CONFIG.GAME.canShadow = false;
                this.renderer.shadowMap.enabled = false;
                this.renderer.setPixelRatio(window.devicePixelRatio ? isIPhone ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio : 1);
            } else {
                //GAME.canShadow = false;
                this.renderer.setPixelRatio(window.devicePixelRatio ? isIPhone ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio : 1);
                this.renderer.shadowMap.enabled = true;
            }
        }
        this.renderer.setSize(WIDTH, HEIGHT);
        this.renderer.localClippingEnabled = true;
        //this.renderer.setClearColor( 0x000000, 0 );
        this.ground = new Ground();
        this.ground.obj.position.z = -84;
        //this.ground.obj.rotation.x = -0.8;
        // window.rrr = this.ground.obj.position;

        this.camera.add(this.ground.obj);

        this.waves = [];
        for (var i = 0; i < 4; ++i) {
            var wave = new Wave();
            this.waves.push(wave);
            wave.obj.visible = false;
            this.scene.add(wave.obj);
        }
        var basicMaterial = new THREE.MeshBasicMaterial({ color: 0xF5F5F5 });
        this.combo = new THREE.Mesh(new THREE.CircleGeometry(0.6, 40), basicMaterial);
        this.combo.name = 'combo';
        this.combo.position.x = -50;
        this.combo.rotation.x = -Math.PI / 2;
        this.scene.add(this.combo);

        if (this.renderer.shadowMap.enabled) {
            this.shadowTarget = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), basicMaterial);
            this.shadowTarget.visible = false;
            this.shadowTarget.name = 'shadowTarget';
            this.scene.add(this.shadowTarget);
        }
        this.currentBlock = new Block(0);

        this.initNextBlock = this.nextBlock = new Block(1);
        this.nextBlock.obj.position.x = 20;
        this.bottle = new Bottle();
        this.bottle.obj.position.set(-10, -CONFIG.BLOCK.height / 2, 0);
        this.scene.add(this.bottle.obj);
        if (this.guider) {
            this.bottle.obj.position.set(-11, 50, 0);
            this.camera.position.x -= 19;
            setTimeout(function() {
                _this3.bottle.showup();
            }, 800);
            this.currentBlock.obj.position.x = -11;
            this.currentBlock.change(null, 'gray', 0.7);
            this.scene.add(this.currentBlock.obj);
            this.guiderTimer = setInterval(function() {
                _this3.bottle.velocity.vz = 0;
                _this3.bottle.velocity.vy = 150;
                _this3.direction = new THREE.Vector2(1, 0);
                var direction = new THREE.Vector3(1, 0, 0);
                _this3.bottle.jump(direction.normalize());
                _this3.hit = _this3.checkHit2(_this3.bottle, _this3.currentBlock);
            }, 3000);
        }
        this.blocksInUse.push(this.nextBlock);
        this.blocksInUse.push(this.currentBlock);

        for (var i = 2; i < 30; ++i) {
            var block = new Block(i);
            this.blocksPool.push(block);
            //this.scene.add(block.obj);
        }

        this.full2D = new Rank({
            camera: this.camera,
            // --- 结算页：点击排行榜的回调
            onClickRank: this.gameCtrl.clickRank.bind(this.gameCtrl),
            // 在玩一局
            onClickReplay: this.gameCtrl.clickReplay.bind(this.gameCtrl),
            // 分享挑战
            onClickShare: this.gameCtrl.shareBattleCard.bind(this.gameCtrl),
            // -- 首页：游戏开始
            onClickStart: this.gameCtrl.clickStart.bind(this.gameCtrl),
            // 点击排行
            onShowFriendRank: this.gameCtrl.showFriendRank.bind(this.gameCtrl),
            // -- 挑战页面
            onBattlePlay: this.gameCtrl.onBattlePlay.bind(this.gameCtrl),
            // -- 好友排行，群分享
            onGroupShare: this.gameCtrl.shareGroupRank.bind(this.gameCtrl),
            // 返回上一页
            friendRankReturn: this.gameCtrl.friendRankReturn.bind(this.gameCtrl),
            // -- 群排行，我也玩一局
            groupPlayGame: this.gameCtrl.groupPlayGame.bind(this.gameCtrl),
            // -- 围观页，开启新的一局
            onLookersStart: this.gameCtrl.onViewerStart.bind(this.gameCtrl),
            // -- 返回微信
            onReturnWechat: function onReturnWechat() {
                wx.exitMiniProgram();
            },
            // -- 纯分享
            onClickPureShare: function onClickPureShare(type) {
                pureShare(type, _this3.gameModel.currentScore);
            }
        });


        this.UI = new UI(this.scene, this.camera, this.full2D, this);
        console.log(this.UI);
        if (CONFIG.GAME.canShadow) {
            this.tailSystem = new TailSystem(this.scene, this.bottle);
        }

        this.addLight();
        this.bindEvent();
        // this.moveCamera = new Camera(this.camera, [this.shadowLight]);

        // 围观群众
        this.viewer = new viewer(this.camera);

        // 初始化好友超越机制
        this.rankSystem = new RankSystem(this);

        // 绑定当服务器
        // Network.onServerConfigForbid(this.gameCtrl.onServerConfigForbid.bind(this.gameCtrl))

        this.audioManager.icon.play();
        this.UI.hideScore();

        // 这个一定要放在最底下
        this.gameModel.init();
        this.gameCtrl.init();
        this.gameView.init();

        /**
         * 系统事件绑定
         */
        wx.onShow(this.handleWxOnShowEvent.bind(this));
        wx.onHide(this.handleWxOnHideEvent.bind(this));
        wx.onError(this.handleWxOnError.bind(this));
        wx.onAudioInterruptionBegin && wx.onAudioInterruptionBegin(this.handleInterrupt.bind(this));

        this.gameCtrl.firstInitGame(this.options);
    }

    loopAnimate() {
        var _this4 = this;

        var duration = 0.7;
        this.bottle.velocity.vz = Math.min(duration * CONFIG.BOTTLE.velocityZIncrement, 180);
        this.bottle.velocity.vy = Math.min(CONFIG.BOTTLE.velocityY + duration * CONFIG.BOTTLE.velocityYIncrement, 180);
        var direction = new THREE.Vector3(this.nextBlock.obj.position.x - this.bottle.obj.position.x, 0, this.nextBlock.obj.position.z - this.bottle.obj.position.z);
        this.direction = new THREE.Vector2(this.nextBlock.obj.position.x - this.bottle.obj.position.x, this.nextBlock.obj.position.z - this.bottle.obj.position.z);
        this.hit = this.checkHit2(this.bottle, this.currentBlock, this.nextBlock);
        this.thirdBlock = this.generateNextBlock();
        this.thirdBlock.obj.position.set(39.7, 0, 0);
        if (this.tailSystem) {

            this.tailSystem.correctPosition();
        }
        this.bottle.jump(direction.normalize());
        this.animateTimer = setTimeout(function() {
            _this4.loopAnimate();
        }, 3000);
    }

    animate() {
        var _this5 = this;

        this.firstAnimating = true;
        var that = this;
        for (var i = 0; i < 7; ++i) {
            setTimeout(function(i) {
                return function() {
                    if ((that.mode == 'single' && (that.stage == 'startPage' || that.stage == 'friendRankList') || that.guider) && that.blocks && that.blocks.length < 7) {
                        var block = new Block(-1, i);
                        block.showup(i);
                        that.scene.add(block.obj);
                        that.blocks.push(block);
                        if (i == 0) this.nextBlock = block;
                    }
                };
            }(i), i * 200);
        }
        setTimeout(function() {
            if (!(that.mode == 'single' && (that.stage == 'startPage' || that.stage == 'friendRankList')) && !that.guider) return;
            var duration = 0.4;
            _this5.bottle.velocity.vz = Math.min(duration * CONFIG.BOTTLE.velocityZIncrement, 180);
            _this5.bottle.velocity.vy = Math.min(CONFIG.BOTTLE.velocityY + duration * CONFIG.BOTTLE.velocityYIncrement, 180);
            _this5.direction = new THREE.Vector2(_this5.nextBlock.obj.position.x - _this5.bottle.obj.position.x, _this5.nextBlock.obj.position.z - _this5.bottle.obj.position.z);
            var direction = new THREE.Vector3(_this5.nextBlock.obj.position.x - _this5.bottle.obj.position.x, 0, _this5.nextBlock.obj.position.z - _this5.bottle.obj.position.z);
            _this5.bottle.jump(direction.normalize());
            _this5.hit = -1;
            _this5.nextBlock = _this5.initNextBlock;
            for (var i = 0, len = _this5.blocks.length; i < len; ++i) {
                customAnimation.to(_this5.blocks[i].hitObj.material, 1, { opacity: 0, delay: i * 0.2 + 0.5 });
            }
            for (var i = 1, len = _this5.blocks.length; i < len; ++i) {
                customAnimation.to(_this5.blocks[i].obj.position, 0.5, { z: i % 2 == 0 ? 60 : -60, delay: i * 0.1 + 2.2 });
            }
            if (_this5.guider) {
                customAnimation.to(_this5.currentBlock.obj.position, 0.5, { z: -60, delay: 2.1 });
                var currentBlock = _this5.currentBlock;
                setTimeout(function() {
                    currentBlock.obj.visible = false;
                }, 3000);
            }
            _this5.currentBlock = _this5.blocks[0];
            setTimeout(function() {
                if (!(that.mode == 'single' && (that.stage == 'startPage' || that.stage == 'friendRankList')) && !that.guider) return;
                if (that.guider) {
                    //this.nextBlock.change(null, null, 1);
                    //this.nextBlock.obj.position.x = 14;
                    _this5.full2D.showBeginnerPage();
                }
                _this5.nextBlock.popup();
                _this5.nextBlock.greenMaterial.color.setHex(0x5d5d5d);
                _this5.nextBlock.whiteMaterial.color.setHex(0xaaaaaa);
                _this5.scene.add(_this5.nextBlock.obj);
                for (var i = 1, len = _this5.blocks.length; i < len; ++i) {
                    _this5.blocks[i].obj.visible = false;
                }
                if (_this5.guider) {
                    _this5.animating = false;
                }
                _this5.firstAnimating = false;
            }, 3000);
            setTimeout(function() {
                if (!(that.mode == 'single' && (that.stage == 'startPage' || that.stage == 'friendRankList'))) return;
                if (!that.show) return;
                _this5.loopAnimate();
            }, 4500);
        }, 1500);
    }

    handleWxOnShowEvent(options) {
        //this.handleInterrupt();

        var that = this;
        wx.setKeepScreenOn && wx.setKeepScreenOn({ keepScreenOn: true });
        this.show = true;

        this.reporter.enterReport(options.scene);

        if (!this.firstInit) this.guider = false;

        if (this.guiderTimer && !this.guider) {
            clearInterval(this.guiderTimer);
            this.guiderTimer = null;
        }

        // 处理第一次提交

        this.onshowAnimateTimer = setTimeout(function(firstInit) {
            return function() {
                if (that.mode == 'single' && that.stage == 'startPage' && !that.animateTimer && that.show) {
                    if (that.blocks && that.blocks.length > 0 && !that.firstAnimating) {
                        that.loopAnimate();
                    } else if (!that.animating && firstInit && !that.guider) {

                        that.animating = true;
                        that.animate();
                    }
                }
            };
        }(this.firstInit), 1000);

        if (this.firstInit) {
            this.firstInit = false;
            return;
        }

        this.gameCtrl.wxOnShow(options);
    }

    showCombo() {
        var _this6 = this;

        setTimeout(function() {
            _this6.combo.position.set(_this6.nextBlock.obj.position.x, CONFIG.BLOCK.height / 2 + 0.15, _this6.nextBlock.obj.position.z);
        }, 200);
    }

    hideCombo() {
        this.combo.position.set(-30, 0, 0);
    }

    replayGame(seed) {
        this.currentScore = 0;
        this.gameCtrl.onReplayGame();
        this.audioManager.restart.seek(0);
        this.audioManager.restart.play();
        if (this.guider) {
            if (this.guiderTimer) {
                clearInterval(this.guiderTimer);
                this.guiderTimer = null;
            }
            this.animating = true;
            this.animate();
            this.moveGradually(new THREE.Vector3(19, 0, 0), 3);
        } else {
            // 播放重新开始音效
            this.resetScene(seed);
            this.bottle.showup();
        }
    }

    addWave(amount) {
        var that = this;
        for (var i = 0; i < amount; ++i) {
            setTimeout(function(i) {
                return function() {
                    that.waves[i].obj.visible = true;
                    //that.waves[i].obj.material.opacity = 1;
                    that.waves[i].obj.position.set(that.bottle.obj.position.x, CONFIG.BLOCK.height / 2 + i * 0.1 + 1, that.bottle.obj.position.z);

                    TweenAnimation(that.waves[i].obj.scale.x, 4, 2 / (i / 2.5 + 2) * 500, 'Linear', function(value, complete) {
                        that.waves[i].obj.scale.x = value;
                        that.waves[i].obj.scale.y = value;
                        that.waves[i].obj.scale.z = value;
                    });

                    TweenAnimation(that.waves[i].obj.material.opacity, 0, 2 / (i / 2.5 + 2) * 500, 'Linear', function(value, complete) {
                        that.waves[i].obj.material.opacity = value;
                        if (complete) {
                            that.waves[i].reset();
                        }
                    });

                    /*           TweenMax.to(that.waves[i].obj.scale, 2 / (i / 2.5 + 2), { x: 4, y: 4, z: 4 }); */
                    // TweenMax.to(that.waves[i].obj.material, 2 / (i / 2.5 + 2), {
                    // opacity: 0, onComplete: function () {
                    // that.waves[i].reset();
                    // }
                    /* }); */
                };
            }(i), i * 200);
        }
    }

    addLight() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.shadowLight = new THREE.DirectionalLight(0xffffff, 0.28);
        this.shadowLight.position.set(0, 15, 10);
        if (this.renderer.shadowMap.enabled) {
            this.shadowLight.castShadow = true;
            this.shadowLight.target = this.shadowTarget;
            this.shadowLight.shadow.camera.near = 5;
            this.shadowLight.shadow.camera.far = 30;
            this.shadowLight.shadow.camera.left = -10;
            this.shadowLight.shadow.camera.right = 10;
            this.shadowLight.shadow.camera.top = 10;
            this.shadowLight.shadow.camera.bottom = -10;
            this.shadowLight.shadow.mapSize.width = 512;
            this.shadowLight.shadow.mapSize.height = 512;
            var shadowGeometry = new THREE.PlaneGeometry(65, 25);
            this.shadowGround = new THREE.Mesh(shadowGeometry, new THREE.ShadowMaterial({ transparent: true, color: 0x000000, opacity: 0.3 }));
            this.shadowGround.receiveShadow = true;
            //this.shadowGround.position.z = 0;
            this.shadowGround.position.x = -25;
            this.shadowGround.position.y = -18;
            this.shadowGround.position.z = -15;
            this.shadowGround.rotation.x = -Math.PI / 2;
            this.shadowLight.add(this.shadowGround);
        }
        //this.shadowLight.shadow.radius = 1024;
        // var helper = new THREE.CameraHelper(this.shadowLight.shadow.camera);
        // this.scene.add( helper );

        // var light = new THREE.DirectionalLight(0xffffff, 0.15);
        // light.position.set(-5, 2, 20);
        // this.scene.add(light);

        //this.scene.add(hemisphereLight);
        this.scene.add(this.shadowLight);

        this.scene.add(ambientLight);
    }

    checkHit2(bottle, currentBlock, nextBlock, initY) {
        var flyingTime = bottle.velocity.vy / CONFIG.GAME.gravity * 2;
        initY = initY || +bottle.obj.position.y.toFixed(2);
        var destinationY = CONFIG.BLOCK.height / 2;

        var differenceY = destinationY - initY;
        var time = +((-bottle.velocity.vy + Math.sqrt(Math.pow(bottle.velocity.vy, 2) - 2 * CONFIG.GAME.gravity * differenceY)) / -CONFIG.GAME.gravity).toFixed(2);
        flyingTime -= time;
        flyingTime = +flyingTime.toFixed(2);
        var destination = [];
        var bottlePosition = new THREE.Vector2(bottle.obj.position.x, bottle.obj.position.z);
        var translate = this.direction.setLength(bottle.velocity.vz * flyingTime);
        bottlePosition.add(translate);
        bottle.destination = [+bottlePosition.x.toFixed(2), +bottlePosition.y.toFixed(2)];
        destination.push(+bottlePosition.x.toFixed(2), +bottlePosition.y.toFixed(2));
        if (this.animating) return 7;
        if (nextBlock) {
            var nextDiff = Math.pow(destination[0] - nextBlock.obj.position.x, 2) + Math.pow(destination[1] - nextBlock.obj.position.z, 2);
            var nextPolygon = nextBlock.getVertices();
            var result1;
            if (pointInPolygon(destination, nextPolygon)) {
                if (Math.abs(nextDiff) < 0.5) {
                    return 1;
                } else {
                    return 7;
                }
            } else if (pointInPolygon([destination[0] - CONFIG.BOTTLE.bodyWidth / 2, destination[1]], nextPolygon) || pointInPolygon([destination[0], destination[1] + CONFIG.BOTTLE.bodyDepth / 2], nextPolygon)) {
                result1 = 5;
            } else if (pointInPolygon([destination[0], destination[1] - CONFIG.BOTTLE.bodyDepth / 2], nextPolygon) || pointInPolygon([destination[0] + CONFIG.BOTTLE.bodyDepth / 2, destination[1]], nextPolygon)) {
                result1 = 3;
            }
        }

        var currentPolygon = currentBlock.getVertices();
        var result2;
        if (pointInPolygon(destination, currentPolygon)) {
            return 2;
        } else if (pointInPolygon([destination[0], destination[1] + CONFIG.BOTTLE.bodyDepth / 2], currentPolygon) || pointInPolygon([destination[0] - CONFIG.BOTTLE.bodyWidth / 2, destination[1]], currentPolygon)) {
            if (result1) return 6;
            return 4;
        }
        return result1 || result2 || 0;
    }

    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

    generateNextBlock() {
        var block;
        var interval = 5;
        if (this.UI.score > 1000) {
            interval = 6;
        } else if (this.succeedTime > 3000) {
            interval = 7;
        }
        if (!this.animating) {
            this.shuffleArray(this.blocksPool);
        }
        for (var i = 0, len = this.blocksPool.length; i < len; ++i) {
            if (this.succeedTime - this.lastAddBonus >= interval && this.blocksPool[i].order >= 13 || this.succeedTime - this.lastAddBonus < interval && this.blocksPool[i].order < 13) {
                block = this.blocksPool[i];
                if (block.order >= 13) {
                    if (this.lastBonusOrder && this.lastBonusOrder == block.order || this.UI.score < 100 && block.order == 29) {
                        continue;
                    }
                    this.lastAddBonus = this.succeedTime;
                    this.lastBonusOrder = block.order;
                }
                this.blocksInUse.push(block);
                this.blocksPool.splice(i, 1);
                break;
            }
        }
        if (!block) {
            var temp = this.blocksInUse.shift();
            while (temp.order >= 13) {
                temp.obj.visible = false;
                this.blocksPool.push(temp);
                temp = this.blocksInUse.shift();
            }
            block = temp;
            this.blocksInUse.push(block);
        }
        block.obj.visible = false;
        block.change();
        return block;
    }

    live() {
        var _this7 = this;

        ++this.liveTime;
        this.firstAnimating = false;
        if (this.animateTimer) {
            clearTimeout(this.animateTimer);
            this.animateTimer = null;
        }
        TweenAnimation.killAll();
        this.animating = false;
        CONFIG.BLOCK.minRadiusScale = 0.8;
        CONFIG.BLOCK.maxRadiusScale = 1;
        CONFIG.BLOCK.minDistance = 1;
        CONFIG.BLOCK.maxDistance = 17;
        setTimeout(function() {
            _this7.bottle.reset();
            _this7.bottle.obj.position.x = 0;
            _this7.bottle.showup();
        }, 2000);
        this.actionList = [];
        this.musicList = [];
        this.touchList = [];
        wx.triggerGC && wx.triggerGC();
    }

    resetScene(seed) {
        this.firstAnimating = false;
        for (var i = 0, len = this.blocks.length; i < len; ++i) {
            this.scene.remove(this.blocks[i].obj);
        }
        this.blocks = [];
        if (this.mode == 'observe') {
            this.audioManager.scale_intro.stop();
            this.audioManager.scale_loop.stop();
        }
        this.randomSeed = seed || Date.now();
        setRandomSeed(this.randomSeed);
        this.actionList = [];
        this.musicList = [];
        this.touchList = [];
        if (this.animateTimer) {
            clearTimeout(this.animateTimer);
            this.animateTimer = null;
        }

        // 修复围观在蓄力到一半的情况下resetScene底座压缩到一半没回弹的情况
        if (this.currentBlock) {
            this.currentBlock.reset();
        }
        TweenAnimation.killAll();
        this.animating = false;
        CONFIG.BLOCK.minRadiusScale = 0.8;
        CONFIG.BLOCK.maxRadiusScale = 1;
        CONFIG.BLOCK.minDistance = 1;
        CONFIG.BLOCK.maxDistance = 17;
        // this.AudioManager.restart.currentTime = 0
        // this.audioManager.restart.play()
        for (var i = 0, len = this.blocksInUse.length; i < len; ++i) {
            var block = this.blocksInUse.pop();
            block.obj.visible = false;
            block.reset();
            this.blocksPool.push(block);
        }
        for (var i = 0, len = this.waves.length; i < len; ++i) {
            this.waves[i].reset();
        }

        this.blocksPool.sort(function(a, b) {
            return a.order - b.order;
        });
        this.currentBlock = this.blocksPool.shift();
        this.currentBlock.obj.visible = true;
        this.scene.add(this.currentBlock.obj);
        this.blocksInUse.push(this.currentBlock);
        this.shadowTarget && this.shadowTarget.position.set(0, 0, 0);
        this.nextBlock = this.blocksPool.shift();
        this.currentBlock.change(null, null, 1);
        this.nextBlock.change(null, null, 1);
        this.nextBlock.obj.position.set(20, 0, 0);
        this.currentBlock.obj.position.set(0, 0, 0);
        this.nextBlock.obj.visible = true;
        this.scene.add(this.nextBlock.obj);
        this.blocksInUse.push(this.nextBlock);
        this.bottle.reset();

        this.thirdBlock = null;

        this.UI.reset();

        this.rankSystem.reset();

        this.lastAddBonus = -2;
        this.succeedTime = 0;

        //this.moveCamera.reset();
        this.doubleHit = 0;
        this.camera.position.set(-17, 30, 26);
        this.shadowLight.position.set(0, 15, 10);
        // this.UI.showScore();
        wx.triggerGC && wx.triggerGC();
    }

    generateHardDistances() {
        var amount = 2 + Math.floor(random() * 2);
        var distances = [];
        for (var i = 0; i < amount; ++i) {
            if (i < amount - 1) {
                distances.push(CONFIG.BLOCK.minDistance + random() * 2);
            } else {
                distances.push(CONFIG.BLOCK.maxDistance - random() * 2);
            }
        }
        return distances;
    }

    bindEvent() {
        var that = this;
        that.instructionCtrl.bindCmdHandler(function(data) {
            if (data.type == -1) {
                that.gameCtrl.showPlayerGG(data.s);
                that.instructionCtrl.onCmdComplete();
                return;
            } else if (data.type == 0) {
                // that.gameCtrl.showPlayerWaiting()
                // that.replayGame(data.seed)
                that.socketFirstSync = true;
                that.bottle.reset();
                that.UI.scoreText.changeStyle({ textAlign: 'center' });
                that.UI.setScore(0);
                that.instructionCtrl.onCmdComplete();
                return;
            } else {
                that.gameCtrl.showPlayerWaiting();
                if (data.score != that.UI.score) {
                    that.UI.score = data.score;
                    that.UI.setScore(data.score);
                }
            }

            if (!data || !data.b || !data.b.vy) {
                that.instructionCtrl.onCmdComplete();
                return;
            }
            if (that.socketFirstSync) {
                that.socketFirstSync = false;
                that.camera.position.set(data.ca.x, data.ca.y, data.ca.z);
                that.ground.obj.position.set(data.gd.x, data.gd.y, data.gd.z);
            }
            // 如果两个序号不一样，就重置两个队列
            if (that.currentBlock.order != data.c.order || that.nextBlock.order != data.n.order) {
                for (var i = 0, len = that.blocksInUse.length; i < len; ++i) {
                    var block = that.blocksInUse.pop();
                    that.scene.remove(block.obj);
                    that.blocksPool.push(block);
                }
                var cIn = that.blocksPool.findIndex(function(el) {
                    return el.order == data.c.order;
                });
                that.currentBlock = that.blocksPool[cIn];
                var temp = that.blocksPool.splice(cIn, 1);
                that.blocksInUse.push(temp[0]);

                var nIn = that.blocksPool.findIndex(function(el) {
                    return el.order == data.n.order;
                });
                that.nextBlock = that.blocksPool[nIn];
                var temp = that.blocksPool.splice(nIn, 1);
                that.blocksInUse.push(temp[0]);
            }
            that.scene.add(that.currentBlock.obj);
            that.scene.add(that.nextBlock.obj);
            that.currentBlock.obj.visible = true;
            that.nextBlock.obj.visible = true;
            that.currentBlock.obj.position.x = data.c.x;
            that.currentBlock.obj.position.z = data.c.z;
            that.currentBlock.change(data.c.r, data.c.type, data.c.rs);

            that.nextBlock.obj.position.x = data.n.x;
            that.nextBlock.obj.position.z = data.n.z;
            that.nextBlock.change(data.n.r, data.n.type, data.n.rs);

            that.bottle.obj.position.set(data.b.x, CONFIG.BLOCK.height / 2, data.b.z);
            that.bottle.velocity.vz = data.b.vz;
            that.bottle.velocity.vy = data.b.vy;
            that.distance = data.di;
            that.straight = data.s;
            var direction = new THREE.Vector3(that.nextBlock.obj.position.x - that.bottle.obj.position.x, 0, that.nextBlock.obj.position.z - that.bottle.obj.position.z);
            that.direction = new THREE.Vector2(that.nextBlock.obj.position.x - that.bottle.obj.position.x, that.nextBlock.obj.position.z - that.bottle.obj.position.z);
            that.checkHit2(that.bottle, that.currentBlock, that.nextBlock, data.b.y);
            that.quick = data.q;
            // 先在pool里面找第三块
            if (data.t) {

                var tIn = that.blocksPool.findIndex(function(el) {
                    return el.order == data.t.order;
                });
                if (tIn > -1) {
                    that.thirdBlock = that.blocksPool[tIn];
                    var temp = that.blocksPool.splice(tIn, 1);
                    that.blocksInUse.push(that.thirdBlock);
                } else {
                    that.thirdBlock = that.blocksInUse.find(function(el) {
                        return el.order == data.t.order;
                    });
                    that.scene.remove(that.thirdBlock.obj);
                }

                that.thirdBlock.change(data.t.r, data.t.type, data.t.rs);
            }
            that.hit = data.h;
            if (that.tailSystem) {

                that.tailSystem.correctPosition();
            }

            //that.audioManager.scale_intro.stop();
            that.audioManager.scale_intro.seek(0);
            that.audioManager.scale_intro.play();
            that.bottle.prepare();
            that.currentBlock.shrink();

            var caPos = {
                x: data.ca.x,
                y: data.ca.y,
                z: data.ca.z
            };
            var gdPos = {
                x: data.gd.x,
                y: data.gd.y,
                z: data.gd.z
            };
            that.stopBlockMusic();
            that.instructionCtrl.icTimeout = setTimeout(function() {
                that.audioManager.scale_intro.stop();
                that.audioManager.scale_loop.stop();
                if (that.currentBlock.order == 15) {
                    that.currentBlock.hideGlow();
                }
                that.currentBlock.rebound();
                that.camera.position.set(caPos.x, caPos.y, caPos.z);
                that.ground.obj.position.set(gdPos.x, gdPos.y, gdPos.z);
                caPos = null;
                gdPos = null;
                that.bottle.jump(direction.normalize());
            }, data.d * 1000);
            data = null;
        });
        that.gameSocket.onReciveCommand(function(seq, data) {
            if (that.mode != 'observe') {
                return;
            }
            that.instructionCtrl.onReceiveCommand(data, seq);
        });

        that.gameSocket.onPeopleCome(function(data) {
            that.gameCtrl.onPeopleCome(data);
        });

        that.gameSocket.onPlayerOut(function() {
            that.gameCtrl.onPlayerOut();
        });

        that.gameSocket.onJoinSuccess(function(success) {
            that.gameCtrl.socketJoinSuccess(success);
            if (that.mode == 'observe') {
                // 展示初始画面
                that.bottle.obj.position.set(8, -CONFIG.BLOCK.height / 2, 0);
                that.camera.position.set(-17, 30, 26);
                that.shadowLight.position.set(0, 15, 10);
                if (that.currentBlock) {
                    that.currentBlock.obj.visible = false;
                }
                if (that.nextBlock) {
                    that.nextBlock.obj.visible = false;
                }
            }
        });

        canvas.addEventListener('touchstart', function(e) {
            // that.full2D.doTouchStartEvent(e); return;
            /**
             * 全局都能触发的事件
             */

            if (that.mode == 'single' || that.mode == 'player') {
                if (that.stage == 'game' && !that.is_from_wn && !that.guider) {
                    if (e.changedTouches[0].clientX < WIDTH * 0.13 && e.changedTouches[0].clientY > HEIGHT * (1 - 0.12)) {
                        that.gameCtrl.shareObservCard();
                        return;
                    }
                }
            }

            /**
             *  根据stage来改变派发事件
             */
            if (that.stage == 'friendRankList' || that.stage == 'battlePage' || that.stage == 'groupRankList' || that.stage == 'singleSettlementPgae' || that.stage == 'startPage') {
                that.full2D.doTouchStartEvent(e);
                return;
            }

            if (that.stage == 'viewerWaiting' || that.stage == 'viewerGG' || that.stage == 'viewerOut') {
                that.full2D.doTouchEndEvent(e);
                return;
            }

            if (that.stage == 'game') {
                if (that.mode === 'observe') return;
                //that.audioManager.scale_loop.stop()
                //that.audioManager.scale_intro.stop()
                if (that.bottle.status === 'stop' && !that.pendingReset && !(that.guider && that.animating)) {
                    // 缩放声音开始
                    // that.audioManager.scale.currentTime = 0
                    that.stopBlockMusic();
                    that.audioManager.scale_intro.seek(0);
                    that.audioManager.scale_intro.play();
                    that.bottle.prepare();
                    that.currentBlock.shrink();
                    that.mouseDownTime = Date.now();
                    //console.log("touchend", that.mouseDownTime)
                }
                return;
            }
        });

        var touchEnd = function touchEnd(e) {
            //console.log('touchEnd', that.stage, that.mode)
            // that.full2D.doTouchEndEvent(e); return;
            var x = e.changedTouches[0].clientX;
            var y = e.changedTouches[0].clientY;

            if (that.bottle.status === 'prepare' && !that.pendingReset && !(that.guider && that.animating) && that.stage != 'game') {
                that.handleWxOnError({
                    'message': 'touchstart triggered and bottle prepare but touchend error.  stage: ' + that.stage,
                    'stack': ''
                });
            }

            if (that.stage == 'singleSettlementPgae' || that.stage == 'startPage') {
                that.full2D.doTouchEndEvent(e);
                return;
            }
            if (that.stage == 'viewerWaiting' || that.stage == 'viewerGG' || that.stage == 'viewerOut') {
                that.full2D.doTouchEndEvent(e);
                return;
            }

            if (that.stage == 'friendRankList') {
                that.full2D.doTouchEndEvent(e);
                return;
            }

            if (that.stage == 'battlePage') {
                that.full2D.doTouchEndEvent(e);
                return;
            }

            if (that.stage == 'groupRankList') {
                // console.log('groupRankList', 'touch')
                that.full2D.doTouchEndEvent(e);
            }

            if (that.stage == 'game') {
                if (that.bottle.status === 'prepare' && !that.pendingReset && !(that.guider && that.animating)) {
                    // console.log(that.blocksPool, that.blocksInUse)
                    // 缩放声音结束
                    that.audioManager.scale_intro.stop();
                    that.audioManager.scale_loop.stop();
                    // that.audioManager['jump_' + jumpType].seek(0);
                    // that.audioManager['jump_' + jumpType].play();
                    that.currentBlock.rebound();
                    var duration = (Date.now() - that.mouseDownTime) / 1000;
                    // that.duration.push(duration);

                    that.bottle.velocity.vz = Math.min(duration * CONFIG.BOTTLE.velocityZIncrement, 150);
                    that.bottle.velocity.vz = +that.bottle.velocity.vz.toFixed(2);
                    that.bottle.velocity.vy = Math.min(CONFIG.BOTTLE.velocityY + duration * CONFIG.BOTTLE.velocityYIncrement, 180);
                    that.bottle.velocity.vy = +that.bottle.velocity.vy.toFixed(2);
                    that.direction = new THREE.Vector2(that.nextBlock.obj.position.x - that.bottle.obj.position.x, that.nextBlock.obj.position.z - that.bottle.obj.position.z);
                    that.direction.x = +that.direction.x.toFixed(2);
                    that.direction.y = +that.direction.y.toFixed(2);
                    var direction = new THREE.Vector3(that.direction.x, 0, that.direction.y);
                    that.bottle.jump(direction.normalize());
                    that.hideCombo();
                    that.hit = that.checkHit2(that.bottle, that.currentBlock, that.nextBlock);
                    if (that.currentBlock.order == 15) {
                        that.currentBlock.hideGlow();
                    }
                    // if (that.UI.score - that.lastHardLevel > 15000 && that.hardDistances.length == 0) {
                    //   that.lastHardLevel = that.UI.score;
                    //   that.hardDistances = that.generateHardDistances();
                    // }
                    // if (that.hardDistances.length > 0) {
                    //   that.distance = that.hardDistances.shift();
                    // }
                    // else {

                    that.distance = CONFIG.BLOCK.minDistance + random() * (CONFIG.BLOCK.maxDistance - CONFIG.BLOCK.minDistance);
                    that.distance = +that.distance.toFixed(2);
                    that.straight = random() > 0.5 ? 1 : 0;

                    if (that.hit === 1 || that.hit === 7) {
                        var block = that.generateNextBlock();
                        that.thirdBlock = block;
                        that.quick = Date.now() - that.lastSucceedTime < 800 || false;
                        that.quickArr.push(that.quick);
                        if (that.mode === 'player') {
                            ++that.seq;
                            that.gameSocket.sendCommand(that.seq, {
                                type: 1,
                                c: { x: that.currentBlock.obj.position.x, z: that.currentBlock.obj.position.z, order: that.currentBlock.order, type: that.currentBlock.type, r: that.currentBlock.radius, rs: that.currentBlock.radiusScale },
                                n: { x: that.nextBlock.obj.position.x, z: that.nextBlock.obj.position.z, order: that.nextBlock.order, type: that.nextBlock.type, r: that.nextBlock.radius, rs: that.nextBlock.radiusScale },
                                d: duration,
                                b: { x: that.bottle.obj.position.x, y: +that.bottle.obj.position.y.toFixed(2), z: that.bottle.obj.position.z, vy: that.bottle.velocity.vy, vz: that.bottle.velocity.vz },
                                t: { order: that.thirdBlock.order, type: that.thirdBlock.type, r: that.thirdBlock.radius, rs: that.thirdBlock.radiusScale },
                                h: that.hit,
                                di: that.distance,
                                s: that.straight,
                                q: that.quick,
                                ca: { x: that.camera.position.x, y: that.camera.position.y, z: that.camera.position.z },
                                gd: { x: that.ground.obj.position.x, y: that.ground.obj.position.y, z: that.ground.obj.position.z },
                                score: that.UI.score
                                    // nickname: myUserInfo.nickname,
                                    // img: myUserInfo.headimg
                            });
                        }
                    } else {
                        if (that.mode === 'player') {
                            ++that.seq;
                            that.gameSocket.sendCommand(that.seq, {
                                type: 1,
                                c: { x: that.currentBlock.obj.position.x, z: that.currentBlock.obj.position.z, order: that.currentBlock.order, type: that.currentBlock.type, r: that.currentBlock.radius, rs: that.currentBlock.radiusScale },
                                n: { x: that.nextBlock.obj.position.x, z: that.nextBlock.obj.position.z, order: that.nextBlock.order, type: that.nextBlock.type, r: that.nextBlock.radius, rs: that.nextBlock.radiusScale },
                                d: duration,
                                b: { x: that.bottle.obj.position.x, y: +that.bottle.obj.position.y.toFixed(2), z: that.bottle.obj.position.z, vy: that.bottle.velocity.vy, vz: that.bottle.velocity.vz },
                                // t: { order: that.thirdBlock.order, type: that.thirdBlock.type, r: that.thirdBlock.radius, rs: that.thirdBlock.radiusScale },
                                h: that.hit,
                                di: that.distance,
                                s: that.straight,
                                q: that.quick,
                                ca: { x: that.camera.position.x, y: that.camera.position.y, z: that.camera.position.z },
                                gd: { x: that.ground.obj.position.x, y: that.ground.obj.position.y, z: that.ground.obj.position.z },
                                score: that.UI.score
                                    // nickname: myUserInfo.nickname,
                                    // img: myUserInfo.headimg
                            });
                        }
                    }
                    if (that.mode != 'observe') {
                        that.actionList.push([duration, +that.bottle.obj.position.y.toFixed(2), that.quick]);
                        that.musicList.push(that.musicScore);
                        if (e.changedTouches && e.changedTouches[0]) {
                            that.touchList.push([e.changedTouches[0].clientX, e.changedTouches[0].clientY]);
                        }
                    }
                }
            }
        };

        canvas.addEventListener('touchend', touchEnd);
        canvas.addEventListener('touchmove', function(e) {
            // that.full2D.doTouchMoveEvent(e); return;
            if (that.stage == 'battlePage' || that.stage == 'friendRankList' || that.stage == 'groupRankList') {
                that.full2D.doTouchMoveEvent(e);
                return;
            }
        });
    }

    stopBlockMusic() {
        if (this.currentBlock.order == 19) {
            this.audioManager.sing.stop();
            this.currentBlock.stopMusic();
        } else if (this.currentBlock.order == 24) {
            this.audioManager.store.stop();
            this.currentBlock.closeDoor();
        } else if (this.currentBlock.order == 26) {
            this.audioManager.water.stop();
        }
        this.audioManager.clearTimer();
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    handleNetworkFucked(show) {
        var word = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '网络异常,点击确定进入游戏';

        this.rollBackToSingle();

        if (show) {
            wx.showModal({
                title: '提示',
                content: word,
                showCancel: false
            });
        }
    }

    handleSocketFucked() {
        // console.log('handleSocketFucked')
        this.gameSocket.close();
        if (this.mode == 'player') {
            this.shareObservCardFail();
            this.updateUI();
        }
        if (this.mode == 'observe') {
            this.handleNetworkFucked(true);
        }
    }

    handleInterrupt() {
        if (this.bottle.status == 'prepare') {
            this.bottle.stopPrepare();
            this.currentBlock.reset();
            this.audioManager.scale_loop.stop();
        }
    }

    handleWxOnError(error) {
        var serverRation = Session.serverCONFIG.bad_js_ratio == undefined ? 1000000 : Session.serverCONFIG.bad_js_ratio;
        var ratio = serverRation / 1000000 || 1;
        // var ratio = 1;
        if (Math.random() <= ratio) {
            Network.badReport(error.message, error.stack);
        }
    }

    sendServerError(word) {
        Network.sendServerError(word);
    }
}