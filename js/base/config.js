import * as THREE from '../libs/three'

export const COLORS = {
    red: 0xCC463D,
    pureRed: 0xff0000,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xf39ab7,
    brownDark: 0x23190f,
    blue: 0x009FF7,
    yellow: 0xFFBE00,
    pureWhite: 0xffffff,
    orange: 0xf7aa6c,
    orangeDark: 0xFF8C00,
    black: 0x000000,
    cream: 0xF5F5F5,
    green: 0x2C9F67,
    lightBlue: 0xD1EEEE,
    cyan: 0x93e4ce,
    yellowBrown: 0xffcf8b,
    purple: 0x8a9ad6
}

export const BOTTLE = {
    headRadius: 0.945,
    bodyWidth: 2.34,
    bodyDepth: 2.34,

    bodyHeight: 3.2,

    reduction: 0.005,
    minScale: 0.5,
    velocityYIncrement: 15,
    velocityY: 135,
    velocityZIncrement: 70
}

export const PARTICLE = {
    radius: 0.3,
    detail: 2
}

export const GAME = {
    BOTTOMBOUND: -55,
    TOPBOUND: 41,
    gravity: 720,
    //gravity: 750,
    touchmoveTolerance: 20,
    LEFTBOUND: -140,
    topTrackZ: -30,
    rightBound: 90,
    HEIGHT: window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth,
    WIDTH: window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth,
    canShadow: true
}

export const WAVE = {
    innerRadius: 2.2,
    outerRadius: 3,
    thetaSeg: 25
};

export const CAMERA = {
    fov: 60
};

export const AUDIO = {
    success: 'audio/success.mp3',
    perfect: 'audio/perfect.mp3',
    scale_loop: 'audio/scale_loop.mp3',
    scale_intro: 'audio/scale_intro.mp3',
    restart: 'audio/start.mp3',
    fall: 'audio/fall.mp3',
    fall_2: 'audio/fall_2.mp3',
    combo1: 'audio/combo1.mp3',
    combo2: 'audio/combo2.mp3',
    combo3: 'audio/combo3.mp3',
    combo4: 'audio/combo4.mp3',
    combo5: 'audio/combo5.mp3',
    combo6: 'audio/combo6.mp3',
    combo7: 'audio/combo7.mp3',
    combo8: 'audio/combo8.mp3',
    icon: 'audio/icon.mp3',
    pop: 'audio/pop.mp3',
    sing: 'audio/sing.mp3',
    store: 'audio/store.mp3',
    water: 'audio/water.mp3'
};

export const BLOCK = {
    radius: 5,
    width: 10,
    minRadiusScale: 0.8,
    maxRadiusScale: 1,
    height: 5.5,
    radiusSegments: [4, 50],
    floatHeight: 0,
    minDistance: 1,
    maxDistance: 17,
    minScale: BOTTLE.minScale,
    reduction: BOTTLE.reduction,
    moveDownVelocity: 0.07,
    fullHeight: 5.5 / 21 * 40
};

export var FRUSTUMSIZE = exports.FRUSTUMSIZE = window.innerHeight / window.innerWidth / 736 * 414 * 60;

export var loader = exports.loader = new THREE.TextureLoader();

export var cylinder_shadow = new THREE.MeshBasicMaterial({ map: loader.load('images/cylinder_shadow.png'), transparent: true, alphaTest: 0.01 });
export var desk_shadow = new THREE.MeshBasicMaterial({ map: loader.load('images/desk_shadow.png'), transparent: true, alphaTest: 0.01 });
export var shadow = new THREE.MeshBasicMaterial({ map: loader.load('images/shadow.png'), transparent: true, alphaTest: 0.01 });
export var grayMaterial = new THREE.MeshLambertMaterial({ map: loader.load('images/gray.png') });
export var numberMaterial = new THREE.MeshLambertMaterial({ map: loader.load('images/number.png'), alphaTest: 0.6 });

export var REPORTERTIMEOUT = 60001;