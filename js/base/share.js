import Rank from "./rank";
import Storage from './storage';
import Session from './session'

var shareCard = new Rank({});

export function shareGroupRank() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

    wx.getNetworkType({
        success: function success(res) {
            if (res.networkType !== 'none') {
                wx.updateShareMenu({
                    withShareTicket: true,
                    success: function success() {
                        wx.shareAppMessage({

                            title: '群雄逐鹿，看看你第几',
                            query: 'mode=groupShare',
                            imageUrl: 'http://mmbiz.qpic.cn/mmbiz_png/icTdbqWNOwNQ0ia79enzYJBrAavqMRykpovYxSA9RRTwIjde6a68ZCczLMBBd8eSoOyTRyp2Codc5IObdeqZVFyw/0?wx_fmt=png',
                            success: function success(res) {
                                cb(true, 1);
                                // let shareTicket = ''
                                // if (res.shareTickets) {
                                //   shareTicket = res.shareTickets[0]
                                // }
                                // // console.log('#####res', res)
                                // wx.getShareInfo({
                                //   shareTicket,
                                //   success(res) {
                                //     cb(true, 1)
                                //     // console.log('###res', res)
                                //   },
                                //   fail(e) {
                                //     wx.showModal({
                                //       title: '提示',
                                //       content: '分享至群聊才能查看群排行哦~',
                                //       showCancel: false
                                //     })
                                //     cb(true, 0)
                                //     // console.log('###res e', e)
                                //   }
                                // })
                            },
                            fail: function fail(err) {
                                cb(false);
                                // console.log('send invitation fail:', err)
                            }
                        });
                    }
                });
            } else {
                cb(false);
                wx.showModal({
                    title: '提示',
                    content: '网络状态异常',
                    showCancel: false
                });
            }
        }
    });
}

export function shareBattle(pkId, score) {
    var cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function() {};

    shareCard.getShareCard({
        score: score,
        type: 'shareBattle'
    }, function(canvas) {
        var path = '';
        try {
            path = canvas.toTempFilePathSync();
        } catch (e) {
            console.log('shareBattle: ', e);
        }
        if (!pkId) {
            return;
        }
        wx.updateShareMenu({
            withShareTicket: true,
            success: function success() {

                wx.shareAppMessage({
                    title: '小试牛刀，不服来战',
                    query: 'mode=battle&pkId=' + pkId,
                    imageUrl: path,
                    success: function success(res) {
                        cb(true, 1);
                        // let shareTicket = ''
                        // if (res.shareTickets) {
                        //   shareTicket = res.shareTickets[0]
                        // }
                        // wx.getShareInfo({
                        //   shareTicket,
                        //   success(res) {
                        //     // console.log('shareBattle', res)
                        //     cb(true, 1)
                        //   },
                        //   fail(e) {
                        //     // console.log('shareBattle e', e)
                        //     cb(true, 0)
                        //   }
                        // })
                        console.log('mode=battle&pkId=' + pkId);
                    },
                    fail: function fail() {
                        cb(false);
                    }
                });
            },
            fail: function fail(err) {
                // console.log('shareBattle e', e)
                cb(false);
            }
        });
    });
}

export function shareObserve() {
    var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function() {};

    var myUserInfo = Storage.getMyUserInfo();
    if (!myUserInfo) {
        myUserInfo = {
            nickname: '',
            headimg: ''
        };
    }
    console.log('query: ', 'gameId=' + Session.gameId + '&mode=observe&nickName=' + myUserInfo.nickname + '&headimg=' + myUserInfo.headimg);
    wx.updateShareMenu({
        withShareTicket: true,
        success: function success() {
            wx.shareAppMessage({
                title: '即刻起跳，速来围观',
                query: 'gameId=' + Session.gameId + '&mode=observe&nickName=' + myUserInfo.nickname + '&headimg=' + myUserInfo.headimg,
                imageUrl: 'http://mmbiz.qpic.cn/mmbiz_png/icTdbqWNOwNQ0ia79enzYJBiaBtXsYrvBsYBdBdDtKE7y638J84JKPckcOtFMp4QunIWFGc7pibQLm13s9fKZ9ic9ew/0?wx_fmt=png',
                success: function success(res) {
                    // console.log('send invitation success')
                    cb(true, 1);
                    // let shareTicket = ''
                    // if (res.shareTickets) {
                    //   shareTicket = res.shareTickets[0]
                    // }
                    // wx.getShareInfo({
                    //   shareTicket,
                    //   success(res) {
                    //     cb(true, 1)
                    //     // console.log('###res', res)
                    //   },
                    //   fail(e) {
                    //     cb(true, 0)
                    //     // console.log('###res e', e)
                    //   }
                    // })
                },
                fail: function fail(err) {
                    // console.log('send invitation fail', err)
                    cb(false);
                }
            });
        },
        fail: function fail() {
            cb(false);
        }
    });
}

export function pureShare(type, score) {
    shareCard.getShareCard({ type: type, score: score }, function(canvas) {
        // console.log('???', canvas)
        var path = '';
        try {
            path = canvas.toTempFilePathSync();
        } catch (e) {
            console.log('pureShare: ', e);
        }
        // wx.updateShareMenu({
        // withShareTicket: true,
        // success() {
        var title = '';
        if (type == 'rank') {
            title = '跳遍天下，已无敌手';
        } else {
            // history week
            title = '不好意思，又破纪录了';
        }
        wx.shareAppMessage({
            title: title,
            // query: `gameId=${Session.gameId}&mode=observe&nickName=${myUserInfo.nickname}&headimg=${myUserInfo.headimg}`,
            imageUrl: path,
            success: function success(res) {
                // console.log('send invitation success')
                // // cb()
                // let shareTicket = ''
                // if (res.shareTickets) {
                //   shareTicket = res.shareTickets[0]
                // }
                // wx.getShareInfo({
                //   shareTicket,
                //   success(res) {
                //     cb(true, 1)
                //     // console.log('###res', res)
                //   },
                //   fail(e) {
                //     cb(true, 0)
                //     // console.log('###res e', e)
                //   }
                // })
            },
            fail: function fail(err) {
                //cb(false)
            }
        });
        // },
        // fail() {}
        // })
    });
}