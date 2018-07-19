import * as Config from './config';

export default class AudioManager {
    constructor(game) {
        this.game = game;
        this.musicPool = ['success', 'combo1', 'combo2', 'combo3', 'combo4', 'combo5', 'combo6', 'combo7', 'combo8', 'scale_intro', 'scale_loop', 'restart', 'fall', 'fall_2', 'pop', 'icon', 'sing', 'store', 'water'];
        this.musicPool.forEach((key) => {
            this[key] = wx.createInnerAudioContext();
            this[key].src = Config.AUDIO[key];
        });
        this.scale_loop.loop = true;
        this.store.onPlay(() => {
            this.store.before && this.store.before();
        });
        this.store.onEnded(() => {
            this.store.after && this.store.after();
            this.timer = setTimeout(function() {
                this.store.seek(0);
                this.store.play();
            }, 3000);
        });
        this.sing.onEnded(() => {
            this.timer = setTimeout(() => {
                this.sing.seek(0);
                this.sing.play();
            }, 3000);
        });

        this.water.onEnded(() => {
            this.timer = setTimeout(() => {
                this.water.seek(0);
                this.water.play();
            }, 3000);
        });
        // this.sing.onPlay(() => {
        //   this.sing.before && this.sing.before();
        // });
        this.scale_intro.onEnded(() => {
            if (this.game.bottle.status == 'prepare') this.scale_loop.play();
        });
    }

    resetAudio() {

        this.musicPool.forEach((key) => {
            this[key].stop();
        });
    }

    register(key, before, after) {
        this[key].before = before;
        this[key].after = after;
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    replay(key) {
        var music = this[key];
        if (music) {
            music.stop();
            music.play();
        } else {
            console.warn('there is no music', key);
        }
    }
}