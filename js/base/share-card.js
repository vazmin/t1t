import Storage from './storage'

var Dpr = window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio; // 当前屏幕的Dpr， i7p 设置3 会挂
var W = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth; // CSS像素
var H = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth; // CSS像素
var HEIGHT = H * Dpr; // 设备像素
var WIDTH = W * Dpr; // 设备像素

var family = wx.loadFont('fonts/num.ttf');
/**
 * 50
 */
export default class ShareCard {
    constructor(option) {
        this.texture = {};
        this.material = {};
    }

    getShareCard(opt, cb) {

        opt = opt || {};
        var cwidth = 693; // 553, 693
        var cheight = 558; // 543, 558 
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            this.canvas.width = cwidth;
            this.canvas.height = cheight;
        }

        // console.log('sharetype: ', opt)
        var ctx = this.context;
        if (opt.type == 'shareBattle') {
            ctx.fillStyle = 'white'; // 白色
            ctx.fillRect(0, 0, cwidth, cheight);

            var that = this;
            this._drawImageCanvas1('fonts/changlle_share.png', 0, 0, cwidth, cheight, 'share', function() {
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; // 灰色文字
                ctx.font = '180px ' + family;
                ctx.textBaseline = "middle";
                ctx.textAlign = 'center';
                ctx.fillText(opt.score || 0, 0.5 * cwidth + 10, 0.6 * cheight);
                !!cb && cb(that.canvas);
            });
        }
        if (opt.type == 'history') {
            // 历史最高分的分享 history
            // new
            ctx.fillStyle = 'white'; // 白色
            ctx.fillRect(0, 0, cwidth, cheight);
            var that = this;
            this._drawImageCanvas1('fonts/high_score.png', 0, 0, cwidth, cheight, 'share', function() {
                ctx.fillStyle = '#00c777'; // 绿色文字
                ctx.font = '180px ' + family;
                ctx.textBaseline = "middle";
                ctx.textAlign = 'center';
                ctx.fillText(opt.score || 0, 0.5 * cwidth + 10, 0.68 * cheight);
                !!cb && cb(that.canvas);
            });
        }
        if (opt.type == 'week') {
            // 本周最高分的分享 week
            // new
            ctx.fillStyle = 'white'; // 白色
            ctx.fillRect(0, 0, cwidth, cheight);
            var that = this;
            this._drawImageCanvas1('fonts/high_score_week.png', 0, 0, cwidth, cheight, 'share', function() {
                ctx.fillStyle = '#00c777'; // 绿色文字
                ctx.font = '180px ' + family;
                ctx.textBaseline = "middle";
                ctx.textAlign = 'center';
                ctx.fillText(opt.score || 0, 0.5 * cwidth + 10, 0.68 * cheight);
                !!cb && cb(that.canvas);
            });
        }
        if (opt.type == 'rank') {
            // 排行榜第一的分享 highestRank
            ctx.fillStyle = 'white'; // 白色
            ctx.fillRect(0, 0, cwidth, cheight);
            var that = this;
            var userInfo = new Storage.getMyUserInfo();
            // console.log(userInfo.headimg)
            that._drawImageCanvas1(userInfo.headimg, 0.5 * cwidth + 10 - 51, 330 - 51, 102, 102, 'share', function() {
                that._drawImageCanvas1('fonts/high_rank.png', 0, 0, cwidth, cheight, 'share', function() {
                    ctx.fillStyle = '#00c777'; // 绿色文字
                    ctx.font = '60px ' + family;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = 'center';
                    ctx.fillText(opt.score || 5678, 0.5 * cwidth + 10, 0.8 * cheight);

                    !!cb && cb(that.canvas);
                });
            });
        }
    }

    _smallReat() {
        var ctx = this.context;
        var colors = ['red', 'blue', 'green', 'yellow', 'skyblue'];
        var cwidth = 553;
        var cheight = 691;

        for (var i = 0; i < colors.length; i++) {
            ctx.fillStyle = colors[i];
            for (var j = 0; j < 5; j++) {
                ctx.fillRect(Math.random() * cwidth, Math.random() * cheight, 15, 15);
            }
        }
    }

    _drawImageCanvas(src, x, y, width, height, type, cb) {
        // 在画布里面显示一副图片
        var img = new Image();
        var that = this;
        img.onload = function() {
            that.context.drawImage(img, x - width / 2, y - height / 2, width, height);
            !!cb && cb(that.canvas);
        };
        img.onerror = function() {
            !!cb && cb(that.canvas);
        };
        img.src = src;
    }

    _drawImageCanvas1(src, x, y, width, height, type, cb) {
        // 在画布里面显示一副图片
        if (src == '/0' || src == '/96' || src == '/64' || !src) {
            src = 'fonts/ava.png';
        }
        var img = new Image();
        var that = this;
        img.onload = function() {
            that.context.drawImage(img, x, y, width, height);
            !!cb && cb(that.canvas);
        };
        img.onerror = function() {
            !!cb && cb(that.canvas);
        };
        img.src = src;
    }
}