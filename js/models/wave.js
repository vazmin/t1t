import * as THREE from '../libs/three'
import * as Config from '../base/config';

var geometry = new THREE.RingGeometry(Config.WAVE.innerRadius, Config.WAVE.outerRadius, Config.WAVE.thetaSeg);

export default class Wave {
    constructor() {
        var material = new THREE.MeshBasicMaterial({ color: Config.COLORS.pureWhite, transparent: true });
        this.obj = new THREE.Mesh(geometry, material);
        this.obj.rotation.x = -Math.PI / 2;
        this.obj.name = 'wave';
    }

    reset() {
        this.obj.scale.set(1, 1, 1);
        this.obj.material.opacity = 1;
        this.obj.visible = false;
    }
}