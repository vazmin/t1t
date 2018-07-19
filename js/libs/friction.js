'use strict';
export default class Friction {
    constructor(drag) {
        this._drag = drag;
        this._dragLog = Math.log(drag);
        this._x = 0;
        this._v = 0;
        this._startTime = 0;
    }
    set(x, v) {
        this._x = x;
        this._v = v;
        this._startTime = (new Date()).getTime();
    }
    x(dt) {
        // if (dt == undefined)
        //     dt = ((new Date()).getTime() - this._startTime) / 1000;
        // return this._x + this._v * Math.pow(this._drag, dt) / this._dragLog - this._v / this._dragLog;
        if (dt === undefined) dt = (new Date().getTime() - this._startTime) / 1000;
        var powDragDt;
        if (dt === this._dt && this._powDragDt) {
            powDragDt = this._powDragDt;
        } else {
            powDragDt = this._powDragDt = Math.pow(this._drag, dt);
        }
        this._dt = dt;
        return this._x + this._v * powDragDt / this._dragLog - this._v / this._dragLog;
    }
    dx() {
        // var dt = ((new Date()).getTime() - this._startTime) / 1000;
        // return this._v * Math.pow(this._drag, dt);
        if (dt === undefined) dt = (new Date().getTime() - this._startTime) / 1000;
        var powDragDt;
        if (dt === this._dt && this._powDragDt) {
            powDragDt = this._powDragDt;
        } else {
            powDragDt = this._powDragDt = Math.pow(this._drag, dt);
        }
        this._dt = dt;
        return this._v * powDragDt;
    }
    done() {
        return Math.abs(this.dx()) < 1;
    }
    reconfigure(drag) {
        var x = this.x();
        var v = this.dx();
        this._drag = drag;
        this._dragLog = Math.log(drag);
        this.set(x, v);
    }
    configuration() {
        var self = this;
        return [{
            label: 'Friction',
            read: function() { return self._drag; },
            write: function(drag) { self.reconfigure(drag); },
            min: 0.001,
            max: 0.1,
            step: 0.001
        }];
    }
}