import * as THREE from '../libs/three'
import Lookers from '../mode/lookers';

export default class viewer {
    constructor(camera) {
        this.num = 0;
        this.list = [];
        this.imgPlanes = [];
        this.camera = camera;
        this.lookers = new Lookers({ camera: camera });
        this.isOpen = false;
    }

    peopleCome(data) {

        var index = this.list.findIndex(function(el) {
            if (el) {
                return el.audience_openid == data.audience_openid;
            } else {
                return false;
            }
        });

        // 如果存在就返回
        if (index > -1) {
            return;
        }

        this.list.push(data);
        this.num++;
        if (this.isOpen) {
            this.showAvatar();
        }
    }

    peopleOut(data) {
        var index = this.list.findIndex(function(el) {
            if (el) {
                return el.audience_openid == data.audience_openid;
            } else {
                return false;
            }
        });

        // 没找到就算了
        if (index < 0) {
            return;
        }

        this.num = this.num - 1 < 0 ? 0 : this.num - 1;
        this.list.splice(index, 1);

        if (this.isOpen) {
            this.showAvatar();
        }
    }

    showAvatar() {
        if (this.num > 0) {

            var avatar = [];
            for (var i = 1; i < 4; i++) {
                if (this.list.length - i >= 0) {
                    avatar.unshift(this.list[this.list.length - i].audience_headimg);
                }
            }
            this.lookers.showLookers({
                avaImg: true,
                icon: true,
                wording: false,
                num: this.num,
                avatar: avatar
            });
        } else {
            this.lookers.showLookers({
                avaImg: false,
                icon: true,
                wording: false
            });
        }
    }

    open() {
        this.isOpen = true;
        this.showAvatar();
    }

    close() {
        this.isOpen = false;
        this.hideAll();
    }

    reset() {
        this.num = 0;
        this.list = [];
        this.lookers.hideLookers();
    }

    hideAll() {
        this.lookers.hideLookers();
    }
}