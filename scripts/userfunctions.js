/*global sys, script, callplugins, utilities, exports */

function POUser(id)
{
    /* user's id */
    this.id = id;
    this.name = sys.name(id);
    /* whether user is megauser or not */
    this.megauser = false;
    /* whether user is muted or not */
    this.mute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is mafiabanned or not */
    this.mban = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is secrectly muted */
    this.smute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is hangmanbanned or not */
    this.hmute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is safaribanned or not */
    this.safban = {active: false, by: null, expires: 0, time: null, reason: null};
    /* caps counter for user */
    this.caps = 0;
    /* whether user is impersonating someone */
    this.impersonation = undefined;
    /* last time user said something */
    // TODO replace with the other one
    this.timecount = parseInt(sys.time(), 10);
    /* last time user said something */
    this.talk = (new Date()).getTime();
    /* counter on how many lines user has said recently */
    this.floodcount = 0;
    /* counts coins */
    this.coins = 0;
    /* whether user has enabled battling only in same tier */
    this.sametier = undefined;
    /* name history */
    this.namehistory = [];
    /* last line */
    this.lastline = {message: null, time: 0};
    /* login time */
    this.logintime = parseInt(sys.time(), 10);
    /* tier alerts */
    this.tiers = [];
    /* last time a user PM'd */
    this.lastpm = parseInt(sys.time(), 10);
    /* amount of PM's a user has sent */
    this.pmcount = 0;
    /* stopping spam */
    this.pmwarned = false;
    /* invite delay */
    this.inviteDelay = {};
    /* invitespec delay */
    this.inviteBattleDelay = {};
    /* tour alert */
    if (script.getKey('touralertson', id) == "true") {
        this.tiers = script.getKey("touralerts", id).split("*");
    }
    /* mafia alerts */
    this.mafiathemes = [];
    if (script.getKey("mafiaalertson", id) == "true") {
        this.mafiaalertson = true;
        this.mafiaalertsany = script.getKey("mafiaalertsany", id) == "true" ? true : false;
        this.mafiathemes = script.getKey("mafiathemes", id).split("*");
    }
    /* host name */
    this.hostname = "pending";
    var user = this; // closure
    sys.hostName(sys.ip(id), function(result) {
        try {
            user.hostname = result;
        } catch (e) {}
    });
    this.battles = {};

    var name = sys.name(id);
    if (script.contributors.hash.hasOwnProperty(name))
        this.contributions = script.contributors.get(name);

    /* check if user is banned or mafiabanned */
    var data;
    var loopArgs = [["mute", script.mutes], ["mban", script.mbans], ["smute", script.smutes], ["hmute", script.hmutes], ["safban", script.safbans]];
    for (var i = 0; i < loopArgs.length; ++i) {
        var action = loopArgs[i][0];
        if ((data = loopArgs[i][1].get(sys.ip(id))) !== undefined) {
            this[action].active=true;
            var args = data.split(":");
            if (action !== "detained") {
                this[action].time = parseInt(args[0], 10);
                if (args.length == 5) {
                    this[action].by = args[1];
                    this[action].expires = parseInt(args[2], 10);
                    this[action].reason = args.slice(4).join(":");
                }
            } else {
                this[action].by = args[1];
                this[action].games = parseInt(args[0], 10);
                this[action].reason = args.slice(3).join(":");
            }
        }
    }
}


POUser.prototype.toString = function() {
    return "[object POUser]";
};

POUser.prototype.expired = function(thingy) {
    return this[thingy].expires !== 0 && this[thingy].expires < sys.time();
};

POUser.prototype.activate = function(thingy, by, expires, reason, persistent) {
    this[thingy].active = true;
    this[thingy].by = by;
    this[thingy].expires = expires;
    this[thingy].time = parseInt(sys.time(), 10);
    this[thingy].reason = reason;
    if (persistent) {
        var table = {"mute": script.mutes, "smute": script.smutes, "mban": script.mbans, "hmute":script.hmutes, "safban":script.safbans};
        table[thingy].add(sys.ip(this.id), sys.time() + ":" + by + ":" + expires + ":" + sys.name(this.id) + ":" + reason);
    }

    callplugins("on"+ utilities.capitalize(thingy), this.id);
};

POUser.prototype.un = function(thingy) {
    this[thingy].active = false;
    this[thingy].expires = 0;
    var table = {"mute": script.mutes, "smute": script.smutes, "mban": script.mbans, "hmute":script.hmutes, "safban":script.safbans};
    table[thingy].remove(sys.ip(this.id));

    callplugins("onUn"+ utilities.capitalize(thingy), this.id);
};

exports.POUser = POUser;