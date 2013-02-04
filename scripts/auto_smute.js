/*global normalbot, script, sys, SESSION, module, staffchannel, autosmute, sendChanAll */
//inherited from main script

module.exports.init = function() {}; //this is just so it says when updated thought /updateplugin :x

module.exports.beforeChatMessage = function beforeChatMessage(src, message, channel) {
    if (!SESSION.users(src)) return;
    var name = sys.name(src);
    var lowerM = message.toLowerCase();
    if (sys.auth(src) > 0) return;
    if (/(the )?muted [A-Za-z]{3,10}/i.test(name) && !sys.dbRegistered(name) && lowerM.match(/satan/gi).length > 3) {
        SESSION.users(src).activate("smute", "Script", 0, "Evader", true);
        normalbot.sendAll("Evader auto-smuted: " + name + ", message: " + message, staffchannel);
        sys.sendMessage(src, name+": "+message, channel);
        return true;
    }
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
        SESSION.users(src).activate("smute", "Script", 0, "Evader", true);
        normalbot.sendAll("Smute based on name: " + name + ", IP: " + sys.ip(src), staffchannel);
    }
    if (/^conflict/i.test(name)) {
        script.issueBan("smute", "Scripts!", undefined, "" + name + ":conflict:2h");
        sendChanAll("±Funkie: conflict auto muted under name " + name, staffchannel);
    }
};
