import * as THREE from '../libs/three'

var cellTailConfig = {
    duration: 100,
    height: 2.0,
    width: 0.5,
    distance: 0.5
};

export default class TailSystem {
    constructor(scene, bottle) {
        this.scene = scene;
        this.bottle = bottle;
        this.tailsRemainPool = [];
        this.tailsUsingPool = [];
        this.lastDotPosition = this.bottle.obj.position.clone();
        this.nowPosition = this.bottle.obj.position.clone();

        this.distance = cellTailConfig.distance;

        this.init();
    }

    init() {
        var width = cellTailConfig.width;
        var height = cellTailConfig.height;
        this.geometry = new THREE.PlaneGeometry(width, height);
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        //this.cloneMesh = new THREE.Mesh(geometry, material)
        //this.cloneMesh.visible = false
        // this.cloneMesh.visible = true

        // 创造50个尾巴单元,平面和圆柱，先选择平面
        for (var i = 0; i < 20; i++) {
            var cellTail = new CellTail(this.geometry, this.material);

            this.scene.add(cellTail.mesh);
            this.tailsRemainPool.push(cellTail);
        }
    }

    update(tickTime) {
        // console.log(tickTime)
        this.updateActiveCell(tickTime);
        if (this.bottle.status == 'prepare') {
            this.nowPosition = this.bottle.obj.position.clone();
            this.lastDotPosition = this.bottle.obj.position.clone();
        }

        if (this.bottle.status == 'jump') {
            var distance = void 0;

            // 更新位置
            this.nowPosition = this.bottle.obj.position.clone();

            distance = this.nowPosition.clone().distanceTo(this.lastDotPosition.clone());
            if (distance < 5) {
                if (distance >= this.distance) {
                    // 距离过大问题
                    var m = distance / this.distance;
                    var n = Math.floor(m);
                    var lastPosition = this.lastDotPosition.clone();
                    var nowPosition = this.nowPosition.clone();
                    var tickScale = tickTime / cellTailConfig.duration;
                    for (var i = 1; i <= n; i++) {
                        nowPosition = this.lastDotPosition.clone().lerp(this.nowPosition.clone(), i / m);
                        var scale = 1 + tickScale * (i / m - 1);
                        scale = scale <= 0 ? 0 : scale;
                        this.layEgg(lastPosition.clone(), nowPosition.clone(), scale);
                        lastPosition = nowPosition.clone();
                        if (i == n) {
                            this.lastDotPosition = nowPosition.clone();
                        }
                    }
                }
            } else {
                this.lastDotPosition = this.nowPosition.clone();
            }
        }
    }

    updateActiveCell(tickTime) {
        var array = this.tailsUsingPool;
        var deltaScaleY = 1 / cellTailConfig.duration;
        var delatAlpha = 1 / cellTailConfig.duration;
        for (var i = 0; i < array.length; i++) {
            // 更新时间
            array[i].tickTime += tickTime;

            // 压缩所有cell的高度
            var newScale = array[i].mesh.scale.y - deltaScaleY * tickTime;
            if (newScale > 0) {

                array[i].mesh.scale.y = newScale > 0 ? newScale : 0;

                // array[i].mesh.material.opacity = 0.3

                // 判断透明度和高度，剔除用完的
                if (array[i].tickTime >= cellTailConfig.duration) {
                    array[i].reset();
                    var cell = array.shift();
                    this.tailsRemainPool.push(cell);
                    i--;
                }
            } else {
                array[i].reset();
                var _cell = array.shift();
                this.tailsRemainPool.push(_cell);
                i--;
            }
        }
    }

    correctPosition() {
        this.lastDotPosition = this.bottle.obj.position.clone();
    }

    layEgg(lastDotPosition, nowPosition) {
        var scale = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

        // 获取一个
        var cellTail = this.getMesh();

        this.tailsUsingPool.push(cellTail);

        // 摆放位置
        cellTail.mesh.position.set(nowPosition.x, nowPosition.y, nowPosition.z);

        cellTail.mesh.scale.y = scale;

        // 修正方向
        cellTail.mesh.lookAt(lastDotPosition);

        cellTail.mesh.rotateY(Math.PI / 2);

        // 变可见
        cellTail.mesh.visible = true;
    }

    getMesh() {
        var res = this.tailsRemainPool.shift();
        if (!res) {
            res = new CellTail(this.geometry, this.material);
            this.scene.add(res.mesh);
        }
        return res;
    }

    allReset() {
        this.tailsRemainPool.forEach(function(el) {
            el.reset();
        });
    }
}

export class CellTail {
    constructor(geometry, material) {
        this.tickTime = 0;
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        this.mesh.name = 'tail';
    }

    reset() {
        this.tickTime = 0;
        this.mesh.scale.set(1, 1, 1);
        this.mesh.visible = false;
    }
}