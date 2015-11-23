/*global channel, exports, sendChanAll, sys*/
/*jshint strict: false, shadow: true, evil: true, laxcomma: true*/
/*jslint sloppy: true, vars: true, evil: true, plusplus: true*/
function Bot(name) {
    this.name = name;
}
Bot.prototype.formatMsg = function (message) {
    return "±" + this.name + ": " + message;
};
/* Shortcuts to sys functions */
Bot.prototype.sendAll = function (message, channel) {
    if (channel === undefined || channel === -1) {
        sendChanAll(this.formatMsg(message), -1);
    } else {
        sendChanAll(this.formatMsg(message), channel);
    }
};
Bot.prototype.sendMessage = function (tar, message, channel) {
    if (channel === undefined) {
        sys.sendMessage(tar, this.formatMsg(message));
    } else {
        sys.sendMessage(tar, this.formatMsg(message), channel);
    }
};
Bot.prototype.sendHtmlAll = function (message, channel) {
    if (channel === undefined) {
        sys.sendHtmlAll("<font color='#3daa68'><timestamp/><b>" + "±" + this.name + ":</font></b> " + message);
    } else {
        sys.sendHtmlAll("<font color='#3daa68'><timestamp/><b>" + "±" + this.name + ":</font></b> " + message, channel);
    }
};
Bot.prototype.sendHtmlMessage = function (tar, message, channel) {
    if (channel === undefined) {
        sys.sendHtmlMessage(tar, "<font color='#3daa68'><timestamp/><b>" + "±" + this.name + ":</font></b> " + message);
    } else {
        sys.sendHtmlMessage(tar, "<font color='#3daa68'><timestamp/><b>" + "±" + this.name + ":</font></b> " + message, channel);
    }
};
Bot.prototype.sendMainTour = function (message) {
    this.sendAll(message, 0);
    // Relies on Tournaments channel
    this.sendAll(message, sys.channelId("Tournaments"));
};
/* Following two rely on global channel parameter */
Bot.prototype.sendChanMessage = function (tar, message) {
    this.sendMessage(tar, message, channel);
};
Bot.prototype.sendChanAll = function (message) {
    this.sendAll(message, channel);
};
exports.Bot = Bot;
