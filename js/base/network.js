import Session from "./session";
import Storage from "./storage";
import { encrypt } from "../utils/encryption";

/**
 * 配置目前有：
 * {
 *  audience_mode_switch:0, // 围观模式，围观在前端拦截
 *  friends_score_switch:0,
 *  group_score_switch:0,
 *  game_center_entry_switch, // 目前没有
 *  bad_js_ratio
 * }
 */

var networkConfig = {
    // AJAX_URL: 'https://wxardm.weixin.qq.com',
    AJAX_URL: 'https://mp.weixin.qq.com'
};

export default class Network {
    constructor() {}

    static onServerConfigForbid(cb) {
        this.emmitServerConfigForbid = cb;
    }

    static getUserInfo() {
        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            }
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_getuserinfo',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // // console.log('Network getUserInfo not ok', res)
                    return;
                }

                // 当sessionId过期的逻辑 待测
                // if (res.data.base_resp.errcode === -5) {

                //   this.reGetSessionId('getUserInfo')
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network getUserInfo not ok', res)
                    return;
                }

                // console.log('Network getUserInfo success', res)
                Storage.saveMyUserInfo(res.data);
            },
            fail: function fail(err) {
                // console.log('Network getUserInfo fail', err)
            }
        });
    }

    static requestLogin(afterLoginProcess) {
        if (!afterLoginProcess) {
            afterLoginProcess = function afterLoginProcess() {
                // console.log('Network requestLogin parameter')
            };
        }
        wx.login({
            success: function success(res) {
                if (res.code) {
                    // console.log('Network login ok', res.code)

                    // 存session
                    Session.setLoginState(res.code);

                    // 存sessionId到缓存里
                    // Storage.saveSessionId(res.code)
                    afterLoginProcess(true);
                } else {
                    // console.log('Network wx.login fail', res)
                    afterLoginProcess(false);
                }
            },
            fail: function fail(res) {

                // 处理失败逻辑
                // console.log('Network wx.login fail: ', res)
                afterLoginProcess(false);
            }
        });
    }

    static requestFriendsScore() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

        if (Session.serverConfig) {
            if (!Session.serverConfig.friends_score_switch) {
                // console.log('Network requestFriendsScore server forbidden')
                // this.errHandler()
                return;
            }
        }

        if (!Session.sessionId) {
            // console.log('Network requestFriendsScore abort for no sessionId')
            callback(false);
            return;
        }
        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            }

            // 数据格式 testData = {
            //   user_info: [
            //     {
            //       nickname: 'juto',
            //       headimg: 'http://wx.qlogo.cn/mmhead/qE9MKluetOlFQg1u4bfs14LFdlRu2MSFKzj5iceWeia4ibZCngaibibE1NQ/0',
            //       score_info: [
            //         {type: 0, score: 1000}
            //       ],
            //     }
            //   ]
            // }
        };
        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_getfriendsscore',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network getfriendsscore not ok', res)
                    if (callback) {
                        callback(false);
                    }
                    return;
                }

                // 当sessionId过期的逻辑 待测
                // if (res.data.base_resp.errcode === -5) {
                //   this.reGetSessionId('requestFriendsScore', callback)
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network getfriendsscore not ok', res)
                    if (callback) {
                        callback(false);
                    }
                    return;
                }

                // console.log('Network requestFriendsScore success', res)

                callback(true, res.data);
            },
            fail: function fail(err) {
                // console.log('Network getfriendsscore fail', err)
                callback(false, false);
            }
        });
    }

    static requestSettlement() {
        var score = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var times = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function() {};
        var verifyData = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        if (!Session.sessionId) {
            // console.log('Network requestSettlement abort for no sessionId')
            callback(false);
            return;
        }
        // var scoreInfo = [
        //   { type: 0, score: score },
        //   { type: 2, score: times }
        // ]
        var scoreInfo = {
            score: score,
            times: times,
            game_data: JSON.stringify(verifyData)
        };

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            // score_info: scoreInfo,
            action_data: encrypt(scoreInfo, Session.sessionId)
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_settlement',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network requestCreateGame not ok', res)
                    callback(false);
                    return;
                }
                if (res.data.base_resp.errcode === 0) {
                    // console.log('Network request settlement success', res)
                    callback(true);
                } else {
                    // console.log('Network request settlement fail', res)
                    callback(false);
                }
            },
            fail: function fail(res) {
                // console.log('Network request settlement fail', res)
                callback(false);
            }
        });
    }

    static requestCreateGame() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

        if (Session.serverConfig) {
            // 0是关，1是开  !0 true !1 false
            if (!Session.serverConfig.audience_mode_switch) {
                // console.log('requestCreateGame server forbidden')
                callback(false, '当前围观人数过多，请稍后再试');
                return;
            }
        }

        if (!Session.sessionId) {
            this.reGetSessionId('requestCreateGame', callback);
            // console.log('Network create game request sessionId')
        }

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            }
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_creategame',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network requestCreateGame not ok', res)
                    callback(false);
                    return;
                }
                if (res.data.base_resp.errcode === 0) {
                    // console.log('Network createGame success', res)
                    callback(true, res);
                } else {
                    // console.log('Network createGame fail', res)
                    callback(false);
                }
            },
            fail: function fail(res) {
                // console.log('Network createGame fail', res)
                callback(false);
            }
        });

        // { 返回包示例
        //   data:{
        //     base_resp:{errcode},
        //     game_id:''
        //   }
        // }
    }

    static reGetSessionId(name, cb) {
        var _this = this;

        // console.log('network reGetSessionId:', name)
        Storage.clearSessionId();
        this.requestLogin(function(success) {
            if (success) {
                if (cb) {
                    _this[name](cb);
                } else {
                    _this[name]();
                }
            } else {
                if (cb) {
                    cb(false);
                }
            }
        });
    }

    /**
     * 服务器发的配置存在内存和缓存里
     */
    static requestInit() {
        if (!Session.sessionId) {
            // console.log('Network requestInit request sessionId')
            return;
            this.reGetSessionId('requestInit');
        }

        if (Session.serverConfig) {
            var v = Session.serverConfig.version;
            this.requestServerInit(v);
        } else {
            this.requestServerInit(0);
        }
    }

    static requestServerInit(version) {
        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            version: version
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_init',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network requestInit not ok', res)
                    return;
                }

                // 当sessionId过期的逻辑
                // if (res.data.base_resp.errcode === -5) {

                //   this.reGetSessionId('requestInit')
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network requestInit not ok', res)
                    return;
                }

                // console.log('Network requestInit success', res)
                if (res.data.version > Session.serverConfig.version || !Session.serverConfig.version) {
                    Session.setServerConfig(res.data);
                    Storage.saveServerConfig(res.data);
                }
            },
            fail: function fail(err) {
                // console.log('Network requestInit fail', err)
            }
        });
    }

    static getGroupScore() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

        if (!Session.sessionId) {
            // console.log('Network getGroupScore not ok need sessionID')
            callback(false);
            return;
        }
        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1,
                group_info: {
                    share_ticket: Session.shareTicket
                }
            }
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_getgrouprank',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network getGroupScore not ok', res)
                    callback(false);
                    return;
                }

                // 当sessionId过期的逻辑
                // if (res.data.base_resp.errcode === -5) {

                //   this.reGetSessionId('getGroupScore', callback)
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network getGroupScore not ok', res)
                    callback(false);
                    return;
                }
                // console.log('Network getGroupScore success', res)
                callback(true, res);
            },
            fail: function fail(err) {
                // console.log('Network getGroupScore fail', err)
                callback(false);
            }
        });
    }

    static createPK(score) {
        return new Promise(function(resolve, reject) {
            if (!Session.sessionId) {
                // console.log('Network getGroupScore not ok need sessionID')
                reject();
                return;
            }
            wx.showLoading();
            var obj = {
                base_req: {
                    session_id: Session.sessionId,
                    fast: 1
                },
                score: score
            };

            wx.request({
                url: networkConfig.AJAX_URL + '/wxagame/wxagame_createpk',
                method: 'POST',
                data: obj,
                success: function success(res) {
                    if (res.statusCode !== 200) {
                        // console.log('Network getPKID not ok', res)
                        reject();
                        return;
                    }

                    // // 当sessionId过期的逻辑
                    // if (res.data.base_resp.errcode === -5) {

                    //   this.reGetSessionId('getGroupScore', callback)
                    //   return
                    // }

                    if (res.data.base_resp.errcode !== 0) {
                        // console.log('Network getPKID not ok', res)
                        reject();
                        return;
                    }

                    Session.setPkId(res.data.pk_id);
                    // console.log('Network getPKID success', res.data.pk_id, res)
                    resolve();
                },
                fail: function fail(err) {
                    // console.log('Network getPKID fail', err)
                    reject();
                },
                complete: function complete() {
                    wx.hideLoading();
                }
            });
        });
    }

    static getBattleData() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};
        var pkId = arguments[1];

        if (!Session.sessionId || !pkId) {
            // console.log('Network getBattleData not ok need sessionID pkId')
            callback(false);
            return;
        }

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            pk_id: pkId
        };

        if (Session.shareTicket) {
            obj.base_req.group_info = {
                share_ticket: Session.shareTicket
            };
        }

        // console.log('getBattleDatagetBattleDatagetBattleData', obj)
        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_getpkinfo',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network getBattleData not ok', res)
                    callback(false);
                    return;
                }

                // 当sessionId过期的逻辑
                // if (res.data.base_resp.errcode === -5) {

                //   this.reGetSessionId('getGroupScore', callback)
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network getBattleData not ok', res)
                    callback(false);
                    return;
                }

                // console.log('Network getBattleData success', res)
                callback(true, res);
            },
            fail: function fail(err) {
                // console.log('Network getBattleData fail', err)
                callback(false);
            }
        });
    }

    static updatepkinfo() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};
        var pkId = arguments[1];
        var score = arguments[2];

        if (!Session.sessionId || !pkId) {
            // console.log('Network getBattleData not ok need sessionID pkId')
            callback(false);
            return;
        }

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            pk_id: pkId,
            score: score

            // console.log('updatepkinfoupdatepkinfoupdatepkinfo', obj)
        };
        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_updatepkinfo',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network updatepkinfo not ok', res)
                    callback(false);
                    return;
                }

                // // 当sessionId过期的逻辑
                // if (res.data.base_resp.errcode === -5) {

                //   this.reGetSessionId('getGroupScore', callback)
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network updatepkinfo not ok', res)
                    callback(false);
                    return;
                }

                // console.log('Network updatepkinfo success', res)
                callback(true, res);
            },
            fail: function fail(err) {
                // console.log('Network updatepkinfo fail', err)
                callback(false);
            }
        });
    }

    static quitGame() {
        var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

        if (!Session.gameId && !Session.sessionId) {
            // console.log('Network quitGame not ok need sessionID gameId')
            callback(false);
            return;
        }

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            game_id: Session.gameId
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_quitgame',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network updatepkinfo not ok', res)
                    callback(false);
                    return;
                }

                // 当sessionId过期的逻辑
                // if (res.data.base_resp.errcode === -5) {

                //   this.reGetSessionId('quitGame', callback)
                //   return
                // }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network quitGame not ok', res)
                    callback(false);
                    return;
                }

                // console.log('Network quitGame success', res)
                callback(true, res);
            },
            fail: function fail(err) {
                // console.log('Network quitGame fail', err)
                callback(false);
            }
        });
    }

    static syncop() {
        var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

        if (!Session.gameId && !Session.sessionId) {
            // console.log('Network quitGame not ok need sessionID gameId')
            callback(false);
            return;
        }
        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            game_id: Session.gameId
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_syncop',
            method: 'POST',
            data: obj,
            success: function success(res) {
                if (res.statusCode !== 200) {
                    // console.log('Network syncop not ok', res)
                    cb(false);
                    return;
                }

                if (res.data.base_resp.errcode !== 0) {
                    // console.log('Network syncop not ok', res)
                    cb(false);
                    return;
                }

                // console.log('Network syncop success', res)
                cb(true, res);
            },
            fail: function fail(err) {
                cb(false);
                // console.log('Network syncop fail', err)
            }
        });
    }

    static sendReport() {
        var reportList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var clientInfo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (!Session.sessionId) {
            // console.log('sendReport need session ID')
            return;
        }

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1,
                client_info: clientInfo
            },
            report_list: reportList
        };
        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_bottlereport',
            method: 'POST',
            data: obj,
            success: function success(res) {
                // console.log('Network sendReport success', res)
            },
            fail: function fail() {
                // console.log('Network sendReport fail')
            }
        });
    }

    static badReport(msg, stack) {
        var res = wx.getSystemInfoSync();
        var sessionId = Session.sessionId || '';
        var msg = 'model:' + res.model + ',SDKVersion:' + res.SDKVersion + ',version:' + res.version + ',sessionId:' + sessionId + ',errmsg:' + msg + ',stack:' + stack;
        wx.request({
            url: 'https://badjs.weixinbridge.com/badjs',
            data: {
                id: 130,
                level: 4,
                msg: msg
            },
            success: function success(res) {
                // console.log('Network badjs', res)
            },
            fail: function fail(res) {
                // console.log('Network badjs', res)
            }
        });
    }

    static sendServerError(key) {
        if (!Session.sessionId) {
            // console.log('sendReport need session ID')
            return;
        }

        var obj = {
            base_req: {
                session_id: Session.sessionId,
                fast: 1
            },
            id: 1,
            key: key
        };

        wx.request({
            url: networkConfig.AJAX_URL + '/wxagame/wxagame_jsreport',
            method: 'POST',
            data: obj,
            success: function success(res) {
                // console.log('Network sendServerError success', res)
            },
            fail: function fail() {
                // console.log('Network sendServerError fail')
            }
        });
    }
}