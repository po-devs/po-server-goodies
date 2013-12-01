function Bot(name) {
    this.name = name;
}
Bot.prototype.formatMsg = function(message)
{
    return "±" + this.name + ": " + message;
}
/* Shortcuts to sys functions */
Bot.prototype.sendAll = function(message, channel)
{
    if (channel === undefined || channel == -1)
        sendChanAll(this.formatMsg(message),-1);
    else
        sendChanAll(this.formatMsg(message), channel);
}

Bot.prototype.sendMessage = function(tar, message, channel)
{
    if (channel === undefined)
        sys.sendMessage(tar, this.formatMsg(message));
    else
        sys.sendMessage(tar, this.formatMsg(message), channel);
}

Bot.prototype.sendMainTour = function(message)
{
    this.sendAll(message, 0);
    // Relies on Tournaments channel
    this.sendAll(message, sys.channelId("Tournaments"));
}

Bot.prototype.sendOfficialAll = function(message)
{
    var formatted = this.formatMsg(message);
    var chans = script.officialChannels(), len, i;
    for (i = 0, len = chans.length; i < len; i += 1) {
        this.sendAll(message, chans[i]);
    }
}

Bot.prototype.sendOfficialMessage = function(tar, message)
{
    var chans = script.officialChannels(), len, i;
    for (i = 0, len = chans.length; i < len; i += 1) {
        if (sys.isInChannel(tar, chans[i])) {
            this.sendMessage(tar, message, chans[i]);
        }
    }
}

/* Following two rely on global channel parameter */
Bot.prototype.sendChanMessage = function(tar, message)
{
    this.sendMessage(tar, message, channel);
}
Bot.prototype.sendChanAll = function(message)
{
    this.sendAll(message, channel);
}

exports.Bot = Bot;
