/*global normalbot, script, sys, SESSION, module, staffchannel, autosmute, sendChanAll */
//inherited from main script

module.exports.init = function() {}; //this is just so it says when updated thought /updateplugin :x

module.exports.beforeChatMessage = function beforeChatMessage(src, message, channel) {
};

module.exports.afterChangeTeam = function afterChangeTeam(src){
    this.afterLogIn(src);
};

module.exports.afterLogIn = function afterLogIn(src) {
    if (!SESSION.users(src)) return;

    var name = sys.name(src);
    if (sys.auth(src) > 0 || SESSION.users(src).smute.active) {
        return;
    }
    /*if (sys.getColor(src) == "#ff007f" && /doj/i.test(sys.name(src))) {
        normalbot.sendAll("Smute based on color: " + sys.name(src) + ", IP: " + sys.ip(src), staffchannel);
        var endtime = parseInt(sys.time(), 10) + 86400;
        SESSION.users(src).activate("smute", "Script", endtime, "User is probably Doj; color based auto smute", true);
        sys.delayedCall(function () {
            if(sys.id(src)) {
                sys.ban(sys.name(src));
                sys.kick(src);
            }
        }, sys.rand(10, 75));
    }*/
    if (autosmute.indexOf(name.toLowerCase()) !== -1) { //using this so they can't just check the name!
        SESSION.users(src).activate("smute", "Script", parseInt(sys.time(), 10) + 86400, "Evader", true);
        normalbot.sendAll("Smute based on name: " + name + ", IP: " + sys.ip(src), staffchannel);
    }
};
