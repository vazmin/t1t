import { TweenAnimation, customAnimation } from '../animation/animation';
import * as THREE from '../libs/three';
import * as Config from '../base/config';
import Text from '../base/text';

export default class Bottle {
    constructor() {
        this.obj = new THREE.Object3D();
        this.obj.name = 'bottle';
        this.trail = null;

        this.bottle = new THREE.Object3D();
        var basicMaterial = new THREE.MeshBasicMaterial({ map: Config.loader.load('images/head.png') });

        var headRadius = 2.1 * 0.45;
        this.human = new THREE.Object3D();
        this.head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 20, 20), basicMaterial);
        // this.head.rotation.y = 3.4;
        // this.head.rotation.x = -1;
        // window.hhh = this.head;
        this.head.castShadow = true;
        this.bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.88 * headRadius, 1.27 * headRadius, 2.68 * headRadius, 20), new THREE.MeshBasicMaterial({ map: Config.loader.load('images/bottom.png') }));
        this.bottom.rotation.y = 4.7;
        this.bottom.castShadow = true;
        var middleGeometry = new THREE.CylinderGeometry(headRadius, 0.88 * headRadius, 1.2 * headRadius, 20);
        var middleMaterial = new THREE.MeshBasicMaterial({ map: Config.loader.load('images/top.png') });
        var materials = [middleMaterial, basicMaterial];
        var totalGeometry = new THREE.Geometry();
        middleGeometry.rotateY(4.7);
        this.merge(totalGeometry, middleGeometry, 0, [{ x: 0, y: this.bottom.position.y + 1.94 * headRadius, z: 0 }]);
        var topGeometry = new THREE.SphereGeometry(headRadius, 20, 20);
        topGeometry.scale(1, 0.54, 1);
        this.merge(totalGeometry, topGeometry, 1, [{ x: 0, y: this.bottom.position.y + 2.54 * headRadius, z: 0 }]);
        this.middle = new THREE.Mesh(totalGeometry, materials);
        this.middle.castShadow = true;
        // this.top.rotation.y = 3.4;
        // this.top.rotation.x = -1;
        this.body = new THREE.Object3D();
        this.body.add(this.bottom);
        this.body.add(this.middle);
        this.human.add(this.body);
        this.head.position.y = 4.725;
        this.human.add(this.head);
        //this.human.scale.set(0.45, 0.45, 0.45)
        this.bottle.add(this.human);

        this.bottle.position.y = Config.BOTTLE.bodyHeight / 2 - 0.25;

        this.obj.add(this.bottle);

        // 状态量
        this.status = 'stop';
        this.scale = 1;
        this.double = 1;
        this.velocity = {};
        this.flyingTime = 0;
        this.direction = 'straight';
        this.jumpStatus = 'init';

        // 粒子
        this.particles = [];
        var whiteParticleMaterial = new THREE.MeshBasicMaterial({ map: Config.loader.load('images/white.png'), alphaTest: 0.5 });
        var greenParticleMaterial = new THREE.MeshBasicMaterial({ map: Config.loader.load('images/green.png'), alphaTest: 0.5 });
        var particleGeometry = new THREE.PlaneGeometry(1, 1);
        for (var i = 0; i < 15; ++i) {
            var particle = new THREE.Mesh(particleGeometry, whiteParticleMaterial);
            particle.rotation.y = -Math.PI / 4;
            particle.rotation.x = -Math.PI / 5;
            particle.rotation.z = -Math.PI / 5;
            this.particles.push(particle);
            this.obj.add(particle);
        }
        for (var i = 0; i < 5; ++i) {
            var particle = new THREE.Mesh(particleGeometry, greenParticleMaterial);
            particle.rotation.y = -Math.PI / 4;
            particle.rotation.x = -Math.PI / 5;
            particle.rotation.z = -Math.PI / 5;
            this.particles.push(particle);
            this.obj.add(particle);
        }
        this.scoreText = new Text('0', { fillStyle: 0x252525, textAlign: 'center', plusScore: true });
        this.scoreText.obj.visible = false;
        this.scoreText.obj.rotation.y = -Math.PI / 4;
        this.scoreText.obj.scale.set(0.5, 0.5, 0.5);
        this.obj.add(this.scoreText.obj);
    }

    merge(totalGeometry, geometry, index, positions) {
        for (var i = 0, len = geometry.faces.length; i < len; ++i) {
            geometry.faces[i].materialIndex = 0;
        }
        var mesh = new THREE.Mesh(geometry);
        for (var i = 0, len = positions.length; i < len; ++i) {
            mesh.position.set(positions[i].x, positions[i].y, positions[i].z);
            mesh.updateMatrix();
            totalGeometry.merge(mesh.geometry, mesh.matrix, index);
        }
    }

    showAddScore(score, double, quick, keepDouble) {
        if (keepDouble) {
            this.scoreText.setScore(score.toString());
        } else {
            if (double) {
                if (this.double === 1) this.double = 2;
                else this.double += 2;
            } else {
                this.double = 1;
            }
            if (quick && this.double <= 2) {
                this.double *= 2;
            }
            this.double = Math.min(32, this.double);
            score = score * this.double;

            this.scoreText.setScore(score.toString());
            /*if (this.direction === 'left') {
addScore.rotation.y = -Math.PI / 2;
}*/
        }
        this.scoreText.obj.visible = true;
        this.scoreText.obj.position.y = 3;
        this.scoreText.material.opacity = 1;
        TweenAnimation(this.scoreText.obj.position.y, Config.BOTTLE.bodyHeight + 6, 700, function(value) {
            this.scoreText.obj.position.y = value;
        }.bind(this));
        TweenAnimation(this.scoreText.material.opacity, 0, 700, function(value, complete) {
            this.scoreText.material.opacity = value;
            if (complete) {
                this.scoreText.obj.visible = false;
            }
        }.bind(this));
    }

    changeScorePos(z) {
        this.scoreText.obj.position.z = z;
    }

    resetParticles() {
        if (this.gatherTimer) clearTimeout(this.gatherTimer);
        this.gatherTimer = null;
        for (var i = 0, len = this.particles.length; i < len; ++i) {
            this.particles[i].gathering = false;
            this.particles[i].visible = false;
            this.particles[i].scattering = false;
        }
    }

    scatterParticles() {
        for (var i = 0; i < 10; ++i) {
            this.particles[i].scattering = true;
            this.particles[i].gathering = false;
            this._scatterParticles(this.particles[i]);
        }
    }

    _scatterParticles(particle) {
        var that = this;
        var minDistance = Config.BOTTLE.bodyWidth / 2;
        var maxDistance = 2;
        var x = (minDistance + Math.random() * (maxDistance - minDistance)) * (1 - 2 * Math.random());
        var z = (minDistance + Math.random() * (maxDistance - minDistance)) * (1 - 2 * Math.random());
        particle.scale.set(1, 1, 1);
        particle.visible = false;
        particle.position.x = x;
        particle.position.y = -0.5;
        particle.position.z = z;
        setTimeout(function(particle) {
            return function() {
                if (!particle.scattering) return;
                particle.visible = true;
                var duration = 0.3 + Math.random() * 0.2;
                //TweenMax.to(particle.rotation, duration, { x: Math.random() * 12, y: Math.random() * 12 });
                customAnimation.to(particle.scale, duration, { x: 0.2, y: 0.2, z: 0.2 });
                customAnimation.to(particle.position, duration, {
                    x: 2 * x,
                    y: 2.5 * Math.random() + 2,
                    z: 2 * z,
                    onComplete: function onComplete() {
                        particle.scattering = false;
                        particle.visible = false;
                    }
                });
            };
        }(particle), 0);
    }

    gatherParticles() {
        var _this = this;

        for (var i = 10; i < 20; ++i) {
            this.particles[i].gathering = true;
            this.particles[i].scattering = false;
            this._gatherParticles(this.particles[i]);
        }
        this.gatherTimer = setTimeout(function() {
            for (var i = 0; i < 10; ++i) {
                _this.particles[i].gathering = true;
                _this.particles[i].scattering = false;
                _this._gatherParticles(_this.particles[i]);
            }
        }, 500 + 1000 * Math.random());
    }

    _gatherParticles(particle) {
        var that = this;
        var minDistance = 1;
        var maxDistance = 8;
        particle.scale.set(1, 1, 1);
        particle.visible = false;
        var x = Math.random() > 0.5 ? 1 : -1;
        var z = Math.random() > 0.5 ? 1 : -1;
        particle.position.x = (minDistance + Math.random() * (maxDistance - minDistance)) * x;
        particle.position.y = minDistance + Math.random() * (maxDistance - minDistance);
        particle.position.z = (minDistance + Math.random() * (maxDistance - minDistance)) * z;
        setTimeout(function(particle) {
            return function() {
                if (!particle.gathering) return;
                particle.visible = true;
                var duration = 0.5 + Math.random() * 0.4;
                //TweenMax.to(particle.rotation, duration, { x: Math.random() * 12, y: Math.random() * 12 });
                TweenAnimation(particle.scale.x, 0.8 + Math.random(), duration * 1000, function(value) {
                    particle.scale.x = value;
                });
                TweenAnimation(particle.scale.y, 0.8 + Math.random(), duration * 1000, function(value) {
                    particle.scale.y = value;
                });
                TweenAnimation(particle.scale.z, 0.8 + Math.random(), duration * 1000, function(value) {
                    particle.scale.z = value;
                });

                TweenAnimation(particle.position.x, Math.random() * x, duration * 1000, function(value) {
                    particle.position.x = value;
                });
                TweenAnimation(particle.position.y, Math.random() * 2.5, duration * 1000, function(value) {
                    particle.position.y = value;
                });
                TweenAnimation(particle.position.z, Math.random() * z, duration * 1000, function(value, complete) {
                    particle.position.z = value;
                    if (complete && particle.gathering) {
                        that._gatherParticles(particle);
                    }
                });
            };
        }(particle), Math.random() * 500);
    }

    update(tickTime) {
        if (this.status == 'stop') {
            return;
        }
        if (this.status == 'prepare') {
            this._prepare();
        } else if (this.status == 'jump') {
            this._jump(tickTime);
        } else if (this.status == 'turn') {
            this.turn();
        }
    }

    lookAt(direction, targetPosition) {
        if (direction !== this.direction) {
            if (direction === 'straight') {
                this.turnAngle = -(Math.PI / 2);
                this.angle = 0;
            } else {
                this.turnAngle = Math.PI / 2;
                this.angle = Math.PI / 2;
            }
            this.direction = direction;
            //this.status = 'turn';
        }

        // targetPosition.y = (BOTTLE.bodyHeight + BLOCK.height) / 2
        // this.status = 'turn';
        // this.direction = direction;
        // this.angle = targetPosition.clone().sub(this.obj.position.clone()).angleTo(new THREE.Vector3(1, 0, 0));
        // if (this.obj.position.z < targetPosition.z) this.angle *= -1;
        // this.turnAngle = this.angle - this.obj.rotation.y;
    }

    turn() {
        var angle = this.turnAngle > 0 ? 0.2 : -0.2;
        this.bottle.rotation.y += angle;
        this.turnAngle -= angle;
        if (this.turnAngle >= -0.2 && this.turnAngle <= 0.2) {
            this.bottle.rotation.y = this.angle;
            this.status = 'stop';
        }
    }

    fall() {
        var _this2 = this;

        this.stop();
        setTimeout(function() {
            _this2.status = 'fall';
            TweenAnimation(_this2.obj.position.y, -Config.BLOCK.height / 2 - 0.3, 400, function(value) {
                this.obj.position.y = value;
            }.bind(_this2));
        }, 0);
    }

    forerake() {
        var _this3 = this;

        this.stop();
        this.status = 'forerake';
        setTimeout(function() {
            if (_this3.direction === 'straight') {
                TweenAnimation(_this3.obj.rotation.z, -Math.PI / 2, 1000, function(value) {
                    this.obj.rotation.z = value;
                }.bind(_this3));

                //TweenMax.to(this.obj.position, 0.3, { x: this.obj.position.x + BOTTLE.bodyWidth });
            } else {
                TweenAnimation(_this3.obj.rotation.x, -Math.PI / 2, 1000, function(value) {
                    this.obj.rotation.x = value;
                }.bind(_this3));
                //TweenMax.to(this.obj.position, 0.3, { z: this.obj.position.z - BOTTLE.bodyWidth });
            }
            // TweenAnimation(this.obj.position.y, this.obj.position.y - 0.5, 500, function(value) {
            // 	this.obj.position.y = value;
            // }.bind(this));
            setTimeout(function() {
                if (_this3.status == 'suspend') {
                    _this3.status = 'stop';
                    return;
                }
                TweenAnimation(_this3.obj.position.y, -Config.BLOCK.height / 2 + 1.2, 400, function(value, complete) {
                    this.obj.position.y = value;
                    if (complete) this.status = 'stop';
                }.bind(_this3));
                customAnimation.to(_this3.head.position, 0.2, { x: -1.125 });
                customAnimation.to(_this3.head.position, 0.2, { x: 0, delay: 0.2 });
            }, 200);
        }, 200);
    }

    hypsokinesis() {
        var _this4 = this;

        this.stop();
        this.status = 'hypsokinesis';
        setTimeout(function() {
            if (_this4.direction === 'straight') {
                TweenAnimation(_this4.obj.rotation.z, Math.PI / 2, 800, function(value) {
                    this.obj.rotation.z = value;
                }.bind(_this4));
            } else {
                TweenAnimation(_this4.obj.rotation.x, Math.PI / 2, 800, function(value) {
                    this.obj.rotation.x = value;
                }.bind(_this4));
            }
            setTimeout(function() {
                if (_this4.status == 'suspend') {
                    _this4.status = 'stop';
                    return;
                }
                TweenAnimation(_this4.obj.position.y, -Config.BLOCK.height / 2 + 1.2, 400, function(value, complete) {
                    this.obj.position.y = value;
                    if (complete) this.status = 'stop';
                }.bind(_this4));
                customAnimation.to(_this4.head.position, 0.2, { x: 1.125 });
                customAnimation.to(_this4.head.position, 0.2, { x: 0, delay: 0.2 });
            }, 350);
        }, 200);
    }

    _jump(tickTime) {
        var translateV = new THREE.Vector3(0, 0, 0);
        translateV.z = this.velocity.vz * tickTime;
        translateV.y = this.velocity.vy * tickTime - Config.GAME.gravity / 2 * tickTime * tickTime - Config.GAME.gravity * this.flyingTime * tickTime;
        this.flyingTime += tickTime;
        this.obj.translateY(translateV.y);
        this.obj.translateOnAxis(this.axis, translateV.z);

        // if (this.jumpStatus == 'init' && this.flyingTime > 0.05) {
        // 	this.jumpStatus = 'rotate1';
        // }
        // if (this.jumpStatus == 'still' && this.flyingTime - this.stillStartTime > 0.05) {
        // 	this.jumpStatus = 'rotate2';
        // }
        // if (this.jumpStatus == 'rotate1') {
        // 	this.bottle.rotateZ(Math.PI / 4);
        // }
        // if (this.jumpStatus == 'rotate2') {
        // 	this.bottle.rotateZ(Math.PI / 8);
        // }
        // if (this.jumpStatus == 'rotate1' && this.bottle.rotation.z <= 0) {
        // 	this.jumpStatus = 'still';
        // 	this.stillStartTime = this.flyingTime;
        // }
        // if (this.jumpStatus == 'rotate2' && this.bottle.rotation.z >= 0) {
        // 	this.jumpStatus = 'stop';
        // 	this.bottle.rotation.z = 0;
        // }
    }

    squeeze() {
        this.obj.position.y = Config.BLOCK.height / 2;
        customAnimation.to(this.body.scale, 0.15, { y: 0.9, x: 1.07, z: 1.07 });
        customAnimation.to(this.body.scale, 0.15, { y: 1, x: 1, z: 1, delay: 0.15 });
        customAnimation.to(this.head.position, 0.15, { y: 4.725, delay: 0.15 });
    }

    stop() {
        this.status = 'stop';
        this.flyingTime = 0;
        this.scale = 1;
        this.velocity = {};
        this.jumpStatus = 'init';
    }

    suspend() {
        this.status = 'suspend';
        TweenAnimation.killAll()();
    }

    rotate() {
        TweenAnimation.killAll()();
        if (this.direction === 'straight') {
            TweenAnimation(this.obj.rotation.z, 0, 300, function(value) {
                this.obj.rotation.z = value;
            }.bind(this));
            var offset;
            if (this.status.indexOf('forerake') >= 0) {
                offset = 2;
            } else {
                offset = -2;
            }
            TweenAnimation(this.obj.position.x, this.obj.position.x + offset, 300, function(value) {
                this.obj.position.x = value;
            }.bind(this));
        } else {
            TweenAnimation(this.obj.rotation.x, 0, 300, function(value) {
                this.obj.rotation.x = value;
            }.bind(this));
            if (this.status.indexOf('forerake') >= 0) {
                offset = -2;
            } else {
                offset = 2;
            }
            TweenAnimation(this.obj.position.z, this.obj.position.z + offset, 300, function(value) {
                this.obj.position.z = value;
            }.bind(this));
        }
        TweenAnimation(this.head.position.x, 0, 100, function(value) {
            this.head.position.x = value;
        }.bind(this));
        TweenAnimation(this.obj.position.y, -Config.BLOCK.height / 2, 300, function(value, complete) {
            this.obj.position.y = value;
            if (complete) this.status = 'stop';
        }.bind(this));
        this.status = 'rotate';
    }

    _prepare() {

        this.scale -= Config.BOTTLE.reduction;
        this.scale = Math.max(Config.BOTTLE.minScale, this.scale);
        if (this.scale <= Config.BOTTLE.minScale) {
            return;
        }
        // this.bottle.scale.y = this.scale;
        // this.bottle.scale.x += 0.007;
        // this.bottle.scale.z += 0.007;
        this.body.scale.y = this.scale;
        this.body.scale.x += 0.007;
        this.body.scale.z += 0.007;
        this.head.position.y -= 0.018;
        var distance = 0.027;
        this.obj.position.y -= Config.BLOCK.reduction / 2 * Config.BLOCK.height / 2 + distance;
        //if (this.obj.position.y <= BLOCK.height / 2 + BOTTLE.bodyHeight / 2 - (1 - this.scale) * BOTTLE.bodyHeight / 2) return;
        //this.obj.position.y -= distance + BLOCK.moveDownVelocity;
        // this.obj.position.y -= BLOCK.moveDownVelocity;
        //this.obj.position.y -= distance;
    }

    prepare() {
        this.status = 'prepare';
        this.gatherParticles();
    }

    jump(axis) {
        this.resetParticles();
        this.status = 'jump';
        this.axis = axis;
        customAnimation.to(this.body.scale, 0.25, { x: 1, y: 1, z: 1 });
        this.head.position.y = 4.725;
        this.scale = 1;

        /**
         * 注释掉体操旋转
         */

        // if (this.direction === 'straight') {
        // 	TweenMax.to(this.bottle.rotation, 0.1, { ease: Power1.easeIn, z: this.bottle.rotation.z - Math.PI });
        // 	TweenMax.to(this.bottle.rotation, 0.2, { z: this.bottle.rotation.z - 2 * Math.PI, delay: 0.15 });
        // } else {
        // 	TweenMax.to(this.bottle.rotation, 0.1, { ease: Power1.easeIn, x: this.bottle.rotation.x - Math.PI });
        // 	TweenMax.to(this.bottle.rotation, 0.2, { x: this.bottle.rotation.x - 2 * Math.PI, delay: 0.15 });
        // }

        // if (this.direction === 'straight') {
        // 	TweenMax.to(this.timer.rotation, 0.3, { ease: Power1.easeIn, z: this.timer.rotation.z - Math.PI, onComplete: () =>{
        // 		this.timer.rotation.z = this.timer.rotation.x = 0;
        // 	}});
        // 	//TweenMax.to(this.bottle.rotation, 0.2, { z: this.bottle.rotation.z + 2 * Math.PI, delay: 0.15 });
        // } else {
        // 	TweenMax.to(this.timer.rotation, 0.3, { ease: Power1.easeIn, x: this.timer.rotation.x - Math.PI, onComplete: () => {
        // 		this.timer.rotation.z = this.timer.rotation.x = 0;
        // 	} });
        // 	//TweenMax.to(this.bottle.rotation, 0.2, { x: this.bottle.rotation.x + 2 * Math.PI, delay: 0.15 });
        // }

        // if (this.direction === 'straight') {
        // 	TweenMax.to(this.body.rotation, 1, { ease: Power1.easeIn, z: this.body.rotation.z  + Math.PI });
        // 	TweenMax.to(this.body.rotation, 0.2, { z: this.body.rotation.z + 2 * Math.PI, delay: 0.15 });
        // } else {
        // 	TweenMax.to(this.body.rotation, 0.1, { ease: Power1.easeIn, x: this.body.rotation.x + Math.PI });
        // 	TweenMax.to(this.body.rotation, 0.2, { x: this.body.rotation.x + 2 * Math.PI, delay: 0.15 });
        // }
        // TweenMax.to(this.head.position, 0.1, { z: this.head.position.z  - 1, delay: 0.15 });
        // TweenMax.to(this.head.position, 0.1, { z: this.head.position.z, y: this.head.position.y, delay: 0.25 });


        var scale = Math.min(Math.max(this.velocity.vz / 35, 1.2), 1.4);
        this.human.rotation.z = this.human.rotation.x = 0;
        if (this.direction === 'straight') {
            customAnimation.to(this.human.rotation, 0.14, { z: this.human.rotation.z - Math.PI });
            customAnimation.to(this.human.rotation, 0.18, { z: this.human.rotation.z - 2 * Math.PI, delay: 0.14 });
            customAnimation.to(this.head.position, 0.1, { y: this.head.position.y + 0.9 * scale, x: this.head.position.x + 0.45 * scale });
            customAnimation.to(this.head.position, 0.1, { y: this.head.position.y - 0.9 * scale, x: this.head.position.x - 0.45 * scale, delay: 0.1 });
            customAnimation.to(this.head.position, 0.15, { y: 4.725, x: 0, delay: 0.25 });
            // TweenMax.to(this.head.position, 0.1, { z: this.head.position.z , delay: 0.3 });
            customAnimation.to(this.body.scale, 0.1, { y: Math.max(scale, 1), x: Math.max(Math.min(1 / scale, 1), 0.7), z: Math.max(Math.min(1 / scale, 1), 0.7) });
            customAnimation.to(this.body.scale, 0.1, { y: Math.min(0.9 / scale, 0.7), x: Math.max(scale, 1.2), z: Math.max(scale, 1.2), delay: 0.1 });
            customAnimation.to(this.body.scale, 0.3, { y: 1, x: 1, z: 1, delay: 0.2 });
        } else {
            customAnimation.to(this.human.rotation, 0.14, { x: this.human.rotation.x - Math.PI });
            customAnimation.to(this.human.rotation, 0.18, { x: this.human.rotation.x - 2 * Math.PI, delay: 0.14 });

            customAnimation.to(this.head.position, 0.1, { y: this.head.position.y + 0.9 * scale, z: this.head.position.z - 0.45 * scale });
            customAnimation.to(this.head.position, 0.1, { z: this.head.position.z + 0.45 * scale, y: this.head.position.y - 0.9 * scale, delay: 0.1 });
            customAnimation.to(this.head.position, 0.15, { y: 4.725, z: 0, delay: 0.25 });
            // TweenMax.to(this.head.position, 0.1, { z: this.head.position.z , delay: 0.3 });
            customAnimation.to(this.body.scale, 0.05, { y: Math.max(scale, 1), x: Math.max(Math.min(1 / scale, 1), 0.7), z: Math.max(Math.min(1 / scale, 1), 0.7) });
            customAnimation.to(this.body.scale, 0.05, { y: Math.min(0.9 / scale, 0.7), x: Math.max(scale, 1.2), z: Math.max(scale, 1.2), delay: 0.1 });
            customAnimation.to(this.body.scale, 0.2, { y: 1, x: 1, z: 1, delay: 0.2 });
        }

        //TweenMax.to(this.bottle.rotation, 1, { z: 2 * Math.PI, delay: 2 });
    }

    showup() {
        this.status = 'showup';
        this.obj.position.y = 25;
        this.human.rotation.x = this.human.rotation.z = 0;
        TweenAnimation(this.obj.position.y, Config.BLOCK.height / 2, 500, 'Bounce.easeOut', function(value, complete) {
            this.obj.position.y = value;
            if (complete) {
                this.status = 'stop';
            }
        }.bind(this));

        /*    TweenMax.to(this.obj.position, 0.5, { ease: Bounce.easeOut, y: (BLOCK.height) / 2 , onComplete: () => { */
        // this.status = 'stop';
        /* }}); */
    }

    stopPrepare() {
        this.obj.position.y = Config.BLOCK.height / 2;
        this.stop();
        this.body.scale.set(1, 1, 1);
        this.head.position.y = 4.725;
        this.head.position.x = 0;
        this.resetParticles();
    }

    getBox() {
        return [new THREE.Box3().setFromObject(this.head), new THREE.Box3().setFromObject(this.middle), new THREE.Box3().setFromObject(this.bottom)];
    }

    reset() {
        this.stop();
        this.obj.position.y = Config.BLOCK.height / 2;
        this.obj.position.x = this.obj.position.z = 0;
        this.obj.rotation.z = 0;
        this.obj.rotation.y = 0;
        this.obj.rotation.x = 0;
        this.bottle.rotation.y = 0;
        this.bottle.rotation.z = 0;
        this.bottle.rotation.x = 0;
        if (this.body && this.head) {
            this.body.scale.set(1, 1, 1);
            this.body.rotation.z = 0;
            this.body.rotation.x = 0;
            this.head.position.y = 4.725;
            this.head.position.x = 0;
            this.human.rotation.z = this.human.rotation.x = 0;
        }
        this.direction = 'straight';
        this.jumpStatus = 'init';
        this.double = 1;
        this.resetParticles();
        this.scoreText.obj.visible = false;
    }
}