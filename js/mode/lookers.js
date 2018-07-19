import * as THREE from '../libs/three'
import * as CONFIG from '../base/config'
import Storage from '../base/storage'

var Dpr = window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio; // 当前屏幕的Dpr， i7p 设置3 会挂
var W = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth; // CSS像素
var H = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth; // CSS像素
var HEIGHT = H * Dpr; // 设备像素
var WIDTH = W * Dpr; // 设备像素
var frustumSizeHeight = CONFIG.FRUSTUMSIZE; // 动画的尺寸单位坐标高度
var frustumSizeWidth = WIDTH / HEIGHT * frustumSizeHeight; // 动画的尺寸单位坐标高度
var planList = ['bg'];

export default class Lookers {
    constructor(options) {
        this.texture = {};
        this.material = {};
        this.geometry = {};
        this.obj = {};
        this.canvas = {};
        this.context = {};
        this._touchInfo = { trackingID: -1, maxDy: 0, maxDx: 0 };
        this.cwidth = WIDTH;
        this.cheight = 50;
        this.options = Object.assign({}, {}, options);
        this._createPlane();
        // --- 显示X人围观和头像
        // this.showLookers({
        // 	avaImg: false,
        // 	icon: true,
        // 	wording: true,
        // 	num : 9,
        // 	avatar : ['','','']
        // })
        // 隐藏这个界面：
        // this.hideLookers()
        // --- 邀请围观
        // this.showLookersShare({});
    }

    showLookers(opt) {
        this.showState = true;
        opt = opt || {};
        this._drawLookers(opt);
    }

    showLookersShare(opt) {
        this.showState = true;
        opt = opt || {};
    }

    hideLookers() {
        this.showState = false;
        for (var i = 0; i < planList.length; i++) {
            this.obj[planList[i]].visible = false;
            this.options.camera.remove(this.obj[planList[i]]);
        }
    }

    _drawLookers(opt) {

        var ctx = this.context['bg'];
        ctx.fillStyle = 'pink';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2 * Dpr;
        // ctx.fillRect(0, 0, this._cx( 414 ), this._cx( this.cheight ));
        ctx.clearRect(0, 0, this._cx(414), this._cx(this.cheight));
        // ctx.strokeRect(0, 0, this._cx( 414 ), this._cx( this.cheight ));
        var height = this.cheight;

        if (opt.avaImg) {
            var right_offset = WIDTH - opt.avatar.length * this._cx(32);
            var that = this;

            var loop = () => {
                var x = i * this._cx(36) + right_offset;
                this._drawImageCenter(opt.avatar[i], x, height / 2, that._cx(25), that._cx(25), 'bg', function() {
                    that._drawImageCenter('images/ava_big1.png', x, height / 2, that._cx(29), that._cx(29), 'bg');
                });
            };

            for (var i = 0; i < opt.avatar.length; i++) {
                loop();
            }
            // 绘制背景图

            ctx.fillStyle = 'rgba(0,0,0,0.56)';
            ctx.font = this._cf(14);
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillText('有' + opt.num + '位好友正在围观', right_offset - this._cx(20), this._cx(16));
        }

        if (opt.icon) {
            this._drawImageCenter('images/observShare.png', this._cx(35), height / 2, this._cx(14), this._cx(16), 'bg');
        }
        if (opt.wording) {
            ctx.fillStyle = 'rgba(0,0,0,0.56)';
            ctx.font = this._cf(14);
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText('邀请围观', this._cx(55), this._cx(16));
        }

        this._updatePlane('bg');
    }

    // ----------------- 画布创建与更新 -----------------

    _createPlane() {
        // 创建画布
        for (var i = 0; i < planList.length; i++) {
            this.canvas[planList[i]] = document.createElement('canvas');
            this.context[planList[i]] = this.canvas[planList[i]].getContext('2d');
            this.canvas[planList[i]].width = WIDTH;
            this.canvas[planList[i]].height = this.cheight * Dpr;
            this.texture[planList[i]] = new THREE.Texture(this.canvas[planList[i]]);
            this.material[planList[i]] = new THREE.MeshBasicMaterial({ map: this.texture[planList[i]], transparent: true });
            this.geometry[planList[i]] = new THREE.PlaneGeometry(frustumSizeWidth, this.cheight / H * frustumSizeHeight);
            this.obj[planList[i]] = new THREE.Mesh(this.geometry[planList[i]], this.material[planList[i]]);
            this.material[planList[i]].map.minFilter = THREE.LinearFilter;
            // console.log( HEIGHT, WIDTH)
            this.obj[planList[i]].position.y = -(0.5 - this.cheight / 2 / H) * frustumSizeHeight; // - frustumSizeHeight/15*7; // 上下
            this.obj[planList[i]].position.x = 0; // frustumSizeWidth/5; // 左右
            this.obj[planList[i]].position.z = 9 - i * 0.001;
        }
    }

    _updatePlane(type) {

        // 画布更新
        if (!this.showState) {
            return;
        }
        this.texture[type].needsUpdate = true;
        this.obj[type].visible = true;
        this.options.camera.add(this.obj[type]);
    }

    // ----------------- 工具函数 -----------------
    _drawImageCenter(src, x, y, width, height, type, cb) {
        // imgid 是渲染时候的imgid， 在每次改变画布的时候自增
        // 以xy为中心来显示一副图片

        if (src == '/0' || src == '/96' || src == '/64' || !src) {
            src = 'images/ava.png';
        }
        var img = new Image();
        var that = this;
        var ctx = this.context[type];
        img.onload = function() {
            ctx.drawImage(img, x - width / 2, y - height / 2, width, height);
            !!cb && cb();
            that._updatePlane(type); // 更新画布
        };
        img.onerror = function() {
            !!cb && cb();
        };
        img.src = src;
    }

    _cx(x) {
        var realx = x * W / 414;
        return realx * Dpr;
    }

    _cf(size) {
        // font size 
        var realf = size * Dpr * W / 414;
        return realf + 'px Helvetica';
    }
}