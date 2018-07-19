var seed = void 0;

/**
 * 用法：random(a,b)随机产生一个a到b之间的整数
 * 
 */

export var setRandomSeed = function setRandomSeed(s) {
    seed = s;
};

var rand = function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor(seed / 233280.0 * 100) / 100;
};

export var random = function random() {
    if (arguments.length === 0) {
        return rand();
    } else if (arguments.length === 1) {
        var e = arguments[0];
        return Math.floor(rand() * e);
    } else {
        var s = arguments[0];
        var _e = arguments[1];
        return Math.floor(rand() * (_e - s)) + s;
    }
};