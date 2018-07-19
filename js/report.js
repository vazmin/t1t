export default class Report {
    constructor() {}

    frameReport(type, frame) {
        var key = 0; // 默认值
        switch (type) {
            case 'iPhone5':
                key = 1;
                break;
            case 'iPhone5s':
                key = 2;
                break;
            case 'iPhone6':
                key = 3;
                break;
            case 'iPhone6s':
                key = 4;
                break;
            case 'iPhone6Plus':
                key = 5;
                break;
            case 'iPhone6sPlus':
                key = 6;
                break;
            case 'iPhone7':
                key = 7;
                break;
            case 'iPhone7s':
                key = 8;
                break;
            case 'iPhone7Plus':
                key = 9;
                break;
            case 'iPhone7sPlus':
                key = 10;
                break;
            case 'iPhone8':
                key = 11;
                break;
            case 'iPhone8Plus':
                key = 12;
                break;
            case 'iPhoneX':
                key = 13;
                break;
        }

        new Image().src = "https://mp.weixin.qq.com/mp/jsmonitor?idkey=58121_" + key * 3 + "_" + frame + ";58121_" + (key * 3 + 1) + "_1&t=" + Math.random();
    }
}