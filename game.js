import './js/libs/weapp-adapter/index'
import './js/libs/symbol'
import './js/libs/aes'
import Main from './js/main';

// var main = new Main();
// main.init();

if (wx.getLaunchOptionsSync) {
    var options = wx.getLaunchOptionsSync();

    var controller = new Main(options);
} else {
    // var options = { scene: 1001, query: {} }
    var controller = new Main();
}

var lastFrameTime = Date.now();

// var Stats = function () {

//   var beginTime = Date.now(), prevTime = beginTime, frames = 0, count = 0, flag = true;

//   return {

//     begin: function () {

//       beginTime = Date.now();

//     },

//     stop: function () {
//       flag = false;
//       if (count > 3) controller.removeShadow();
//     },

//     end: function () {
//       //if (!flag) return;
//       frames++;

//       var time = Date.now();

//       //console.log("prevy", prevTime, time);
//       if (time >= prevTime + 1000) {
//         console.log("frames", frames * 1000 / (time - prevTime));

//         prevTime = time;
//         frames = 0;

//       }

//       return time;

//     }

//   };

// };

// var stats = new Stats();

var oRequestAnimation = requestAnimationFrame;
var frameCallbacks = [];
var lastestFrameCallback = void 0;

var requestAnimationFrameHandler = function requestAnimationFrameHandler() {
    var _frameCallbacks = [];
    var _lastestFrameCallback = lastestFrameCallback;

    frameCallbacks.forEach(function(cb) {
        _frameCallbacks.push(cb);
    });
    lastestFrameCallback = undefined;
    frameCallbacks.length = 0;

    _frameCallbacks.forEach(function(cb) {
        typeof cb === 'function' && cb();
    });
    if (typeof _lastestFrameCallback === 'function') {
        _lastestFrameCallback();
    }

    oRequestAnimation(requestAnimationFrameHandler);
};

window.requestAnimationFrame = function(callback, isLastest) {
    if (!isLastest) {
        frameCallbacks.push(callback);
    } else {
        lastestFrameCallback = callback;
    }
};

requestAnimationFrameHandler();

animate();

function animate() {
    //stats.begin();
    var now = Date.now();
    var tickTime = now - lastFrameTime;
    lastFrameTime = now;
    requestAnimationFrame(animate, true);
    if (tickTime > 100) return;
    controller.update(tickTime / 1000);
    //stats.end();
}