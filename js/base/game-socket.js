import Network from "./network";
import Session from "./session";

export default class GameSocket {
    constructor(game) {
        this.alive = false;
        this.noErr = false;
        // this.joinGame = false
        this.game = game;

        this.handlers = {};
        this.handleSocketErr = '';
        // 用来清除心跳，防止发送过多心跳
        this.heartBeat = [];

        /**
         * 命令池,数据格式
         * cmdPool = {
         *  'gameId': {
         *    n:当前帧序号
         *    arr:[]序号指令池
         *  }
         * }
         */
        this.cmdPool = {};

        wx.onSocketOpen((res) => {
            // console.log('Socket open', res)
            this.joinGame();
        });

        wx.onSocketClose((res) => {
            if (this.game.mode == 'player' && !this.noErr) {
                Network.quitGame();
                this.game.gameCtrl.onSocketCloseErr();
            }
            if (this.game.mode == 'observe' && !this.noErr) {
                this.game.gameCtrl.onSocketCloseErr();
            }
            this.alive = false;
            // console.log('Socket close', res)
        });

        wx.onSocketError((res) => {
            // console.log('Socket connect fail', res)

            // 错误处理
            // if (typeof this.handleSocketErr == 'function') {
            //   this.handleSocketErr()
            // }
        });

        wx.onSocketMessage((res) => {
            // console.log('Socket receive message1', res)
            // wx.hideLoading()

            // 清空心跳队列
            this.cleanHeartBeat();

            var data;
            try {
                data = JSON.parse(res.data);
            } catch (error) {
                // console.log('onSocketMessage err: ', error, 'socket will be close')
                this.game.handleWxOnError({
                    message: 'socket receive wrong msg JSON.parse(res.data) error',
                    stack: ''
                });
                wx.closeSocket();
                return;
            }

            // 发送帧的确认帧
            if (data.cmd === 106) {
                this.handleACK(data);
            }

            // 加入游戏响应 
            if (data.cmd === 101) {
                this.handleJoinGame(data);
            }

            if (data.cmd === 104) {
                // console.log('receive heart beat')
            }

            if (data.cmd === 108) {
                this.handlePeopleCome(data);
            }

            if (data.cmd === 102) {
                this.receiveCommand(data);
            }

            // 围观模式下
            if (data.cmd == 109) {
                this.close();
            }

            // 主播退出直播了
            if (data.cmd == 107) {
                this.handlePlayerOut();
            }

            this.heartBeat.push(setTimeout(this.sendHeartBeat.bind(this), 5000));
            // this.heartBeat.push(setTimeout(this.sendHeartBeat.bind(this), 1000))
        });
    }

    cleanHeartBeat() {
        if (this.heartBeat.length) {
            while (this.heartBeat.length) {
                var heartBeat = this.heartBeat.pop();
                clearTimeout(heartBeat);
            }
        }
    }

    handleSocketOpen() {
        this.joinGame();
        this.alive = true;
    }

    connectSocket() {
        var _this2 = this;

        this.alive = true;
        wx.connectSocket({
            // url: 'ws://mptest.weixin.qq.com/game/',
            url: 'wss://wxagame.weixin.qq.com',
            fail: function fail() {
                _this2.alive = false;
                // this.handleConnectSocketFail()
            }
        });
    }

    // handleConnectSocketFail() {
    //   this.alive = false
    //   if (this.game.mode == 'player') {
    //     this.game.shareObservCardFail()
    //   }
    //   if (this.game.mode == 'observe') {
    //     this.handleSocketErr(true)
    //   }
    // }


    addHandler(cmd, cb) {
        if (!this.handlers[cmd]) {
            this.handlers[cmd] = [cb];
        } else {
            this.handlers[cmd].push(cb);
        }
    }

    // 发送指令

    sendCommand(cmdSequence, data) {
        var gameId = Session.gameId;
        var gameTicket = Session.gameTicket;
        if (!gameId || !gameTicket || !cmdSequence) {
            return;
        }
        if (typeof gameId !== 'string') {
            console.warn('Socket send cmd need gameId');
            return;
        }

        var obj = {
            cmd: 102,
            i: gameId,
            n: cmdSequence,
            k: gameTicket,
            o: [JSON.stringify(data)]
                // const obj = {
                //   cmd: 102,
                //   i: gameId,
                //   k: gameTicket,
                //   o: []
                // }
                // console.log('send Message', JSON.stringify(obj))
        };
        wx.sendSocketMessage({
            data: JSON.stringify(obj)
        });
    }

    sendNullCommand() {
        var gameId = Session.gameId;
        var gameTicket = Session.gameTicket;
        if (!gameId || !gameTicket) {
            return;
        }
        if (typeof gameId !== 'string') {
            console.warn('Socket send cmd need gameId');
            return;
        }

        var obj = {
            cmd: 102,
            i: gameId,
            k: gameTicket,
            o: []
                // console.log('send heartBeat Message', JSON.stringify(obj))
        };
        wx.sendSocketMessage({
            data: JSON.stringify(obj)
        });
    }

    getCommand(gameId) {}

    onPeopleCome(cb) {
        this.peopleCome = cb;
    }

    onReciveCommand(cb) {
        this.observerMessage = cb;
    }

    onJoinSuccess(cb) {
        this.joinSuccess = cb;
    }

    onPlayerOut(cb) {
        this.playerOutHandler = cb;
    }

    // 接收到指令
    receiveCommand(res) {
        // console.log('receiveCommand',res)
        if (typeof this.observerMessage !== 'function') {
            return;
        }
        if (!res.o) {
            return;
        }
        if (!res.o[0]) {
            return;
        }
        if (!res.o[0].o) {
            return;
        }
        this.observerMessage(res.n, JSON.parse(res.o[0].o));
        return;
    }

    handlePeopleCome(res) {
        if (typeof this.peopleCome !== 'function') {
            return;
        }
        this.peopleCome(res);
        return;
    }

    // 接收到指令确认帧
    receiveACK() {}

    // 加入游戏
    /**
     *  observe : handleConnectSocketfail => handleSocketFucked
     */
    joinGame() {
        // console.log('Socket open success')
        var gameId = Session.gameId;
        if (!Session.sessionId || !gameId) {
            // console.log('Socket join game fail')
            // this.handleConnectSocketFail()
            return;
        }
        var obj = {
            cmd: 101,
            game_id: gameId,
            fast: 1,
            session_id: Session.sessionId
        };

        wx.sendSocketMessage({
            data: JSON.stringify(obj)
        });
        // console.log('Socket join game', obj)
    }

    handleACK(data) {
        if (this.handlers['ack']) {
            this.handlers['ack'].forEach(function(cb) {
                cb(data);
            });
        }
    }

    handleJoinGame(data) {
        // console.log(data)
        if (this.game.mode == 'observe') {
            switch (data.ret) {
                // 成功
                case 0:
                    this.joinSuccess(true);
                    break;
                    // 不活跃
                case 2:
                    this.joinSuccess(true);
                    break;
                default:
                    this.joinSuccess(false);
                    break;
            }
        } else {
            if (data.ret != 0) {
                this.joinSuccess(false);
            } else {
                this.joinSuccess(true);
            }
        }

        // if (this.game.mode == 'player') {
        //   if (data.ret != 0) {
        //     this.close()
        //     this.handleConnectSocketFail()
        //   } else {
        //     this.joinSuccess()
        //   }
        // }
    }

    sendHeartBeat() {
        if (this.game.mode == 'player') {
            this.sendNullCommand();
        } else {

            var obj = {
                cmd: 104
            };
            wx.sendSocketMessage({
                data: JSON.stringify(obj)
            });
        }
    }

    quitObserve() {
        if (!this.alive) {
            return;
        }
        // console.log('quitObservequitObserve')
        var obj = {
            cmd: 109,
            fast: 1,
            game_id: Session.gameId,
            session_id: Session.sessionId
                // console.log(obj)
        };
        wx.sendSocketMessage({
            data: JSON.stringify(obj)
        });
    }

    close() {
        var _this3 = this;

        if (!this.alive) {
            return;
        }

        this.alive = false;
        this.noErr = true;
        // console.log('emmit close')
        wx.closeSocket();

        Session.clearShareTicket();
        Session.clearGameId();

        setTimeout(function() {
            _this3.reset();
        }, 1000);
    }

    onSocketErr(cb) {
        this.handleSocketErr = cb;
    }

    reset() {
        this.alive = false;
        this.noErr = false;
    }

    handlePlayerOut() {
        if (typeof this.playerOutHandler == 'function') {
            this.playerOutHandler();
        }
    }

}