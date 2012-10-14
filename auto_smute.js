module.exports.init = function(){}
module.exports.afterLogIn = function afterLogIn(src) {

    var name = sys.name(src);
    
  if (sys.getColor(src) == "#ff007f" && /doj/i.test(sys.name(src))) {
        normalbot.sendAll("Smute based on color: " + sys.name(src) + ", IP: " + sys.ip(src), staffchannel);
        var endtime = parseInt(sys.time()) + 86400;
        SESSION.users(src).activate("smute", "Script", endtime, "User is probably Doj; color based auto smute", true);
        sys.delayedCall(function () {
            if (sys.id(src)) {
                sys.ban(sys.name(src));
                sys.kick(src);
            }
        }, sys.rand(10, 75));
    }

    if (/^conflict/i.test(name)) {
        script.issueBan("smute", "Scripts!", undefined, "" + name + ":conflict:2h");
        sys.sendAll("±Funkie: conflict auto muted under name " + name, staffchannel);
    }

    if (sys.auth(src) == 0 && name.substr(0,5).toLowerCase() == "ethan" && !isNaN(name.slice(5))) {
        SESSION.users(src).activate("smute", "Script", parseInt(sys.time()) + 86400, "Evader", true);
        sys.sendAll(name+" auto smuted; probably GangGreenGan", staffchannel);
    }

}
