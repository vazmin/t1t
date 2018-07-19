export default class Session {
    constructor() {}

    static init() {
        this.sessionId = '';
        this.gameId = '';
        this.gameTicket = '';
        this.serverConfig = '';
        this.shareTicket = '';
        this.pkId = '';
        this.serverConfig = '';
    }

    static setLoginState(sessionId) {
        this.sessionId = sessionId;
    }

    static setGameId(gameId) {
        this.gameId = gameId;
    }

    static setGameTicket(gameTicket) {
        this.gameTicket = gameTicket;
    }

    static setServerConfig(config) {
        this.serverConfig = config;
    }

    static setShareTicket(ticket) {
        this.shareTicket = ticket;
    }

    static setPkId(id) {
        this.pkId = id;
    }

    static clearPkId() {
        this.pkId = '';
    }

    static clearGameId() {
        this.gameId = '';
    }

    static clearShareTicket() {
        this.ShareTicket = '';
    }

    static clearGameTicket() {
        this.gameTicket = '';
    }

    static setServerConfig(config) {
        this.serverConfig = config;
    }
}