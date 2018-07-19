import * as THREE from '../libs/three.min'

export default class singleSettlementPage {
    constructor(camera) {
        var material = new THREE.MeshBasicMaterial({ color: 0x0080c0 });
        var rankList = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), material);
        var replay = rankList.clone();
        var challenge = rankList.clone();

        replay.position.set(0, -20, -1);
        rankList.position.set(-10, -20, -1);
        challenge.position.set(10, -20, -1);

        this.ui = [replay, rankList, challenge];
        this.camera = camera;
    }

    show() {

        this.ui.forEach((ui) => {
            this.camera.add(ui);
        });
    }

    hide() {

        this.ui.forEach((ui) => {
            this.camera.remove(ui);
        });
    }
}