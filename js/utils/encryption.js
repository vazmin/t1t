import CryptoJS from '../libs/aes'

export function encrypt(data, originKey) {
    var originKey = originKey.slice(0, 16);
    var key = CryptoJS.enc.Utf8.parse(originKey);
    var iv = CryptoJS.enc.Utf8.parse(originKey);

    var msg = data;
    msg = JSON.stringify(msg);
    // console.log('msgmsgmsgmsgmsg', msg)
    // console.log('keykeykeykey',originKey)
    var passWord = CryptoJS.AES.encrypt(msg, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    passWord = passWord.toString();

    // console.log('passWordpassWordpassWord', passWord)
    return passWord;
}