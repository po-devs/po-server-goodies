/*global exports, normalbot, SESSION, sachannel, staffchannel, sys*/
/*jshint shadow: true*/
/*jslint sloppy: true*/
exports.handleCommand = function (src, command, commandData, tar, channel) {
    /*
    if (command === "memorydump") {
        sys.sendMessage(src, sys.memoryDump(), channel);
        return;
    }
    if (command == "togglerainbow") {
        if (commandData === "off") {
            SESSION.global().allowRainbow = false;
            normalbot.sendMessage(src, "You turned rainbow off!", channel);
            return;
        }
        SESSION.global().allowRainbow = true;
        normalbot.sendMessage(src, "You turned rainbow on!", channel);
        return;
    }*/
    if (command === "addwatch") {
        var i = commandData.split(":");
        var name = i[0];
        var comment = i[1] || '-';
        if (i.length !== 2) {
            normalbot.sendMessage(src, "The format is (user):(comment)", channel);
            return;
        }
        if (sys.dbIp(name) === undefined) {
            normalbot.sendMessage(src, name + " is not a valid user.", channel);
            return;
        }
        script.namesToWatch.add(name.toLowerCase(), comment + " ~ " + sys.name(src));
        normalbot.sendAll(name + " was added to the watch list by " + sys.name(src) + ".", staffchannel);
        return;
    }
    if (command == "removewatch") {
        var name = commandData;
        if (script.namesToWatch.get(name.toLowerCase()) !== undefined) {
            script.namesToWatch.remove(name.toLowerCase());
            normalbot.sendAll(name + " was removed from the watch list by " + sys.name(src) + ".", staffchannel);
        }
        else {
            normalbot.sendMessage(src, name + " is not in the watch list.", channel);
        }
        return;
    }
    if (command === "toggleweblinks") {
        if (commandData === "off") {
            SESSION.global().blockWebLinks = true;
            normalbot.sendMessage(src, "Webclient users will not send clickable hyperlinks now.", channel);
            return;
        }
        SESSION.global().blockWebLinks = false;
        normalbot.sendMessage(src, "Webclient users can send clickable hyperlinks again.", channel);
        return;
    }
    if (command === "indigoinvite" || command === "forceinvite") {
        /*if (channel !== staffchannel && channel !== sachannel) {
            normalbot.sendMessage(src, "Can't use on this channel.", channel);
            return;
        }*/
        if (tar === undefined) {
            normalbot.sendMessage(src, "Your target is not online.", channel);
            return;
        }

        if (!sys.isInChannel(tar, channel)) {
            if (!SESSION.channels(channel).isChannelMember(tar)) {
                SESSION.channels(channel).issueAuth(src, commandData, "member");
            }
            normalbot.sendAll(sys.name(src) + " summoned " + sys.name(tar) + " to this channel!", channel);
            sys.putInChannel(tar, channel);
            normalbot.sendMessage(tar, sys.name(src) + " made you join this channel!", channel);
        } else {
            normalbot.sendMessage(src, sys.name(tar) + " is already in this channel!", channel);
        }
        return;
    }
    if (command === "destroychan") {
        var ch = commandData;
        var chid = sys.channelId(ch);
        if (!sys.existChannel(ch)) {
            normalbot.sendMessage(src, "No channel exists by this name!", channel);
            return;
        }
        if (chid === 0 || chid == staffchannel ||  chid == tourchannel || SESSION.channels(chid).perm) {
            normalbot.sendMessage(src, "This channel cannot be destroyed!", channel);
            return;
        }
        var channelDataFile = SESSION.global().channelManager.dataFileFor(chid);
        sys.writeToFile(channelDataFile, "");
        sys.playersOfChannel(chid).forEach(function(player) {
            sys.kick(player, chid);
            if (sys.channelsOfPlayer(player).length < 1 && !sys.isInChannel(player, 0)) {
                sys.putInChannel(player, 0);
            }
        });
        return;
    }
    if (command === "ban") {
        if(sys.dbIp(commandData) === undefined) {
            normalbot.sendMessage(src, "No player exists by this name!", channel);
            return;
        }
        if (sys.maxAuth(sys.ip(tar)) >= sys.auth(src)) {
           normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
           return;
        }

        var ip = sys.dbIp(commandData);
        if(sys.maxAuth(ip) >= sys.auth(src)) {
           normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
           return;
        }
        if(sys.banned(ip) && !script.isTempBanned(ip)) {
            normalbot.sendMessage(src, "He/she's already banned!", channel);
            return;
        }
        var tarId = sys.id(commandData.split(":")[0]);
        if (!isSuperAdmin(src)) {
            if (sys.auth(tarId) >= sys.auth(src) && sys.auth(src) < 3) {
                normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
                return;
            }
        }

        if (script.isTempBanned(ip)) {
            sys.unban(commandData); //needed as at the moment bans don't overwrite tempbans
        }
        normalbot.sendAll("Target: " + commandData + ", IP: " + ip.replace("::ffff:", ""), staffchannel);
        sendChanHtmlAll("<b><font color=red>" + commandData + " was banned by " + nonFlashing(sys.name(src)) + "!</font></b>",-1);        
        callplugins("onBan", src, commandData);
        sys.ban(commandData);
        script.kickAll(ip);
        sys.appendToFile("bans.txt", sys.name(src) + " banned " + commandData + "\n");
        var authName = sys.name(src).toLowerCase();
        script.authStats[authName] =  script.authStats[authName] || {};
        script.authStats[authName].latestBan = [commandData, parseInt(sys.time(), 10)];
        return;
    }
    if (command === "unban") {
        if(sys.dbIp(commandData) === undefined) {
            normalbot.sendMessage(src, "No player exists by this name!", channel);
            return;
        }
        var banlist=sys.banList();
        for(var a in banlist) {
            if(sys.dbIp(commandData) == sys.dbIp(banlist[a])) {
                sys.unban(commandData);
                normalbot.sendMessage(src, "You unbanned " + commandData + "!", channel);
                sys.appendToFile('bans.txt', sys.name(src) + ' unbanned ' + commandData + "\n");
                return;
            }
        }
        normalbot.sendMessage(src, "He/she's not banned!", channel);
        return;
    }

    if (command === "nameban") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Sorry, can't name ban empty names.", channel);
            return;
        }
        var regex;
        try {
            regex = new RegExp(commandData.toLowerCase()); // incase sensitive
        } catch (e) {
            normalbot.sendMessage(src, "Sorry, your regular expression '" +commandData + "' fails. (" + e + ")", channel);
        }
        nameBans.push(regex);
        var serialized = {nameBans: []};
        for (var i = 0; i < nameBans.length; ++i) {
            serialized.nameBans.push(nameBans[i].source);
        }
        sys.writeToFile(Config.dataDir+"nameBans.json", JSON.stringify(serialized));
        normalbot.sendMessage(src, "You banned: " + regex.toString(), channel);
        script.refreshNamebans();
        return;
    }
    if (command === "nameunban") {
        var unban = false;
        nameBans = nameBans.filter(function(name) {
            if (name.toString() == commandData) {
                var toDelete = nameBans.indexOf(name.toString());
                normalbot.sendMessage(src, "You unbanned: " + name.toString(), channel);
                unban = true;
                return false;
            }
            return true;
        });
        if (!unban) {
            normalbot.sendMessage(src, "No match.", channel);
        } else {
            var serialized = {nameBans: []};
            for (var i = 0; i < nameBans.length; ++i) {
                serialized.nameBans.push(nameBans[i].source);
            }
            sys.writeToFile(Config.dataDir+"nameBans.json", JSON.stringify(serialized));
            script.refreshNamebans();
        }
        return;
    }
    if (command === "channameban" || command === "channelnameban") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Sorry, can't name ban empty names.", channel);
            return;
        }
        var regex;
        try {
            regex = new RegExp(commandData.toLowerCase()); // incase sensitive
        } catch (e) {
            normalbot.sendMessage(src, "Sorry, your regular expression '" +commandData + "' fails. (" + e + ")", channel);
        }
        script.chanNameBans.push(regex);
        var serialized = {chanNameBans: []};
        for (var i = 0; i < script.chanNameBans.length; ++i) {
            serialized.chanNameBans.push(script.chanNameBans[i].source);
        }
        sys.writeToFile(Config.dataDir+"chanNameBans.json", JSON.stringify(serialized));
        normalbot.sendMessage(src, "You banned: " + regex.toString(), channel);
        return;
    }
    if (command === "channameunban" || command === "channelnameunban") {
        var unban = false;
        script.chanNameBans = script.chanNameBans.filter(function(name) {
            if (name.toString() == commandData) {
                var toDelete = script.chanNameBans.indexOf(name.toString());
                normalbot.sendMessage(src, "You unbanned: " + name.toString(), channel);
                unban = true;
                return false;
            }
            return true;
        });
        if (!unban) {
            normalbot.sendMessage(src, "No match.", channel);
        } else {
            var serialized = {chanNameBans: []};
            for (var i = 0; i < script.chanNameBans.length; ++i) {
                serialized.chanNameBans.push(script.chanNameBans[i].source);
            }
            sys.writeToFile(Config.dataDir+"chanNameBans.json", JSON.stringify(serialized));
        }
        return;
    }
    if (command === "namewarn") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Sorry, can't set warning for empty names.", channel);
            return;
        }
        var regex;
        try {
            regex = new RegExp(commandData.toLowerCase()); // incase sensitive
        } catch (e) {
            normalbot.sendMessage(src, "Sorry, your regular expression '" +commandData + "' fails. (" + e + ")", channel);
        }
        nameWarns.push(regex);
        var serialized = {nameWarns: []};
        for (var i = 0; i < nameWarns.length; ++i) {
            serialized.nameWarns.push(nameWarns[i].source);
        }
        sys.writeToFile(Config.dataDir+"nameWarns.json", JSON.stringify(serialized));
        normalbot.sendMessage(src, "You set a warning for: " + regex.toString(), channel);
        return;
    }
    if (command === "nameunwarn") {
        var unwarn = false;
        nameWarns = nameWarns.filter(function(name) {
            if (name.toString() == commandData) {
                var toDelete = nameWarns.indexOf(name.toString());
                normalbot.sendMessage(src, "You removed a warning for: " + name.toString(), channel);
                unwarn = true;
                return false;
            }
            return true;
        });
        if (!unwarn)
            normalbot.sendMessage(src, "No match.", channel);
        else
            sys.writeToFile(Config.dataDir+"nameWarns.json", JSON.stringify(nameWarns));
        return;
    }
    if (command === "watchlog") {
        var log = sys.getFileContent(Config.dataDir+"watchNamesLog.txt");

        if (log) {
            log = log.split("\n");
            if (!commandData) {
                commandData = "";
            }
            var info = commandData.split(":"),
                term = info.length > 1 ? info[1] : "",
                e, lower = 0, upper = 10;

            var range = info[0].split("-");
            if (range.length > 1) {
                lower = parseInt(range[0], 10);
                upper = parseInt(range[1], 10);
            } else {
                lower = 0;
                upper = parseInt(range[0], 10);
            }
            lower = isNaN(lower) ? 0 : lower;
            upper = isNaN(upper) ? 10 : upper;

            if (lower <= 0) {
                log = log.slice(-(upper+1));
            } else {
                var len = log.length;
                log = log.slice(Math.max(len - upper - 1, 0), len - lower);
            }

            if (term) {
                var exp = new RegExp(term, "gi");
                for (e = log.length - 1; e >= 0; e--) {
                    if (!exp.test(log[e])) {
                        log.splice(e, 1);
                    }
                }
            }
            if (log.indexOf("") !== -1) {
                log.splice(log.indexOf(""), 1);
            }
            if (log.length <= 0) {
                normalbot.sendMessage(src, "Nothing found for this query!", channel);
            } else {
                sys.sendMessage(src, "", channel);
                sys.sendMessage(src, "Watch Log (last " + (lower > 0 ? lower + "~" : "") + upper + " entries" + (term ? ", only including entries with the term " + term : "") + "):", channel);
                for (e in log) {
                    if (!log[e]) {
                        continue;
                    }

                    var params = log[e].split(":::");
                    var msg = "Players: {0} and {1} -- Winner: {2} -- Forfeit: {3} -- Tier: {4} -- Time: {5} -- {0}'s IP: {6} -- {1}'s IP: {7}";
                    normalbot.sendMessage(src, msg.format(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]), channel);
                }
                sys.sendMessage(src, "", channel);
            }
        } else {
            normalbot.sendMessage(src, "Log file not found!", channel);
        }
        return;
    }

    if (command == "cookieban" || command == "cookiemute") {
        if (!commandData) {
            return;
        }
        if (!sys.loggedIn(tar)) {
            normalbot.sendMessage(src, "Target not logged in", channel);
            return;
        }
        if (sys.os(tar) !== "android" && sys.version(tar) < 2402 || sys.os(tar) === "android" && sys.version(tar) < 37) {
            //probably won't work well on windows/linux/etc anyways...
            normalbot.sendMessage(src, "Cookies won't work on this target", channel);
            return;
        }
        if (command == "cookiemute") {
            SESSION.users(tar).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "Cookie", true);
            kickbot.sendAll(commandData + " was smuted by cookie", staffchannel);
        }
        var type = (command === "cookieban" ? "banned" : "muted");
        sys.setCookie(tar, type + " " + commandData.toCorrectCase());
        normalbot.sendAll(commandData.toCorrectCase() + " was cookie " + type + " by " + sys.name(src) + ". [" + sys.os(tar) + " " + sys.version(tar) + "]", staffchannel);
        if (type == "banned") {
            sys.kick(tar);
            sys.appendToFile("bans.txt", sys.name(src) + " cookiebanned " + commandData + "\n");
        }
        return;
    }
    if (command == "cookieunban" || command ==  "cookieunmute") {
        if (!commandData) {
            return;
        }
        if (commandData == "cookieunmute" && sys.loggedIn(sys.id(commandData))) {
            script.unban("smute", Config.kickbot, tar, commandData);
            sys.removeCookie(sys.id(commandData));
            return;
        }
        var type = (command === "cookieunban" ? "unbanned" : "unmuted");
        script.namesToUnban.add(commandData.toLowerCase(), "true");
        normalbot.sendAll(commandData.toCorrectCase() + " was cookie " + type + " by " + sys.name(src) + ".", staffchannel);
        if (type === "unbanned") {
            sys.appendToFile('bans.txt', sys.name(src) + ' cookieunbanned ' + commandData + "\n");
        }
        return;
    }
    if (command === "whobanned") {
        if (!commandData) {
            normalbot.sendMessage(src, "No name entered", channel);
            return;
        }
        var banned = sys.getFileContent("bans.txt").split("\n").filter(function(s) {
            return s.toLowerCase().indexOf(commandData.toLowerCase()) != -1;
        });
        normalbot.sendMessage(src, banned.length > 1 ? banned.join(", ") : commandData + " has no current bans", channel);
        return;
    }
    if (command == "idban" || command == "idmute") {
        if (!commandData) {
            return;
        }
        var tar = sys.id(commandData);
        if (!sys.loggedIn(tar)) {
            normalbot.sendMessage(src, "Target not logged in", channel);
            return;
        }
        if (!sys.uniqueId(tar)) {
            normalbot.sendMessage(src, "Target doesn't have a unique ID (update needed)", channel);
            return;
        }
        var id = sys.uniqueId(tar).id;
        var psuedo = !sys.uniqueId(tar).isUnique;
        var type = (command === "idban" ? "banned" : "muted");
        var banInfo = {};
        banInfo.name = sys.name(tar);
        banInfo.ip = sys.ip(tar);
        banInfo.banner = sys.name(src);
        banInfo.type = type;
        banInfo.psuedo = psuedo;
        script.idBans.add(id, JSON.stringify(banInfo));
        normalbot.sendAll(commandData.toCorrectCase() + " was ID " + type + " by " + sys.name(src) + ". [" + sys.os(tar) + ", v" + sys.version(tar) + "]", staffchannel);
        if (type == "muted") {
            SESSION.users(tar).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "ID", true);
        } else {
            sys.kick(tar);
            sys.appendToFile("bans.txt", sys.name(src) + " idbanned " + commandData + "\n");
        }
        return;
    }
    if (command == "idunban" || command == "idunmute") {
        if (!commandData) {
            return;
        }
        var type = (command === "idunban" ? "unbanned" : "unmuted");
        var banInfo = script.idBans.get(commandData);
        if (banInfo) {
            var tar = JSON.parse(banInfo).name;
            script.idBans.remove(commandData);
            if (banInfo.type == "muted") {
                script.unban("smute", Config.kickbot, tar, commandData);
            } else {
                sys.appendToFile('bans.txt', sys.name(src) + ' idunbanned ' + commandData + "\n");
            }
            normalbot.sendAll(tar.toCorrectCase() + " was ID " + type + " by " + sys.name(src) + ".", staffchannel);
            return;
        }
        normalbot.sendMessage(src, "ID not found", channel);
        return;
    }
    if (command === "ultraban" || command === "sultraban" || command === "ultramute") {
        var banType = command === "ultramute" ? "muted" : "banned";
        if (!commandData) {
            normalbot.sendMessage(src, "No player exists by this name!", channel);
            return;
        }
        var name = commandData.toCorrectCase();
        var ip = sys.dbIp(name);
        if (!ip) {
            normalbot.sendMessage(src, "No player exists by this name!", channel);
            return;
        }
        if (sys.maxAuth(ip) > 0) {
            normalbot.sendMessage(src, "You cannot use " + command + " on auth.", channel);
            return;
        }
        var id = sys.id(name);
        var os = sys.os(id);
        var version = sys.version(id);
        var banner = sys.name(src);
        var bansApplied = [];
        if (sys.loggedIn(id)) {
            if (sys.os(tar) !== "android" && sys.version(tar) > 2402 || sys.os(tar) === "android" && sys.version(tar) > 37) {
                sys.setCookie(tar, banType + " " + name);
                bansApplied.push("cookie");
                if (banType === "muted") {
                    SESSION.users(tar).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "Cookie", true);
                }
            }
            if (sys.uniqueId(id)) {
                var banInfo = {"name": name, "ip": ip, "banner": banner, "type": banType, "psuedo": !sys.uniqueId(id).isUnique };
                script.idBans.add(sys.uniqueId(id).id, JSON.stringify(banInfo));
                bansApplied.push("id");
                if (banType === "muted") {
                    SESSION.users(tar).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "ID", true);
                }
            }
            if (sys.os(tar) === "webclient" && command === "ultramute") {
                SESSION.users(tar).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "Ultramute", true);
                bansApplied.push("silent");
            }
        }
        if (banType === "banned") {
            if (script.isTempBanned(ip)) {
                sys.unban(commandData); //needed as at the moment bans don't overwrite tempbans
            }
            sys.ban(commandData);
            bansApplied.push("ip");
            script.kickAll(ip);
            sys.appendToFile("bans.txt", banner + " ultrabanned " + name + "\n");
            var authName = banner.toLowerCase();
            script.authStats[authName] =  script.authStats[authName] || {};
            script.authStats[authName].latestBan = [name, parseInt(sys.time(), 10)];
        }

        if (bansApplied.length > 0) {
            os = os.charAt(0).toUpperCase() + os.slice(1);
            normalbot.sendAll("Target: " + name + ", IP: " + ip.replace("::ffff:", "") + ", OS: " + os + ", Version: " + version, staffchannel);
            normalbot.sendAll(nonFlashing(banner) + " applied the following " +  (command === "ultramute" ? "mutes" : "bans") + ": " + bansApplied.join(", "), staffchannel);
            if (command === "ultraban") {
                sendChanHtmlAll("<b><font color=red>" + name + " was banned by " + nonFlashing(banner) + "!</font></b>", -1);
            }
        } else {
            normalbot.sendMessage(src, "You used " + command + "! But nothing happened!", channel);
        }
        return;
    }
    // hack, for allowing some subset of the owner commands for super admins
    if (isSuperAdmin(src)) {
       if (["changeauth"].indexOf(command) != -1) {
           normalbot.sendMessage(src, "Can't aboos some commands", channel);
           return;
       }
       return require("ownercommands.js").handleCommand(src, command, commandData, tar, channel);
    }

    return "no command";
};
exports.help = [
    "/ban [ip/name]: Bans a user. /unban to unban.",
    "/cookieban [name]: Bans an online target by cookie. /cookieunban to unban.",
    "/cookiemute [name]: Puts an online target on an autosmute list by cookie. /cookieunmute to unmute.",
    "/idban [name]: Bans an online target by ID. /idunban [id] to unban.",
    "/idmute [name]: Puts an online target on an autosmute list by ID. /idunmute [id] to unmute.",
    "/ultraban [name]: Bans an online target by IP, cookie and ID. Use /ultramute for mutes, /sultraban to skip the red ban message.",
    "/channelnameban [name]: Adds a regexp ban on channel names. /channelnameunban to unban.",
    "/destroychan [name]: Destroy a channel (official channels are protected).",
    "/nameban [name]: Adds a regexp ban on usernames. /nameunban to unban.",
    "/namewarn [name]: Adds a regexp namewarning. /nameunwarn to unwarn.",
    "/forceinvite [name]: To force a user to join a specific channel.",
//  "/memorydump: Shows the state of the memory.",
    "/toggleweblinks [on/off]: Allows or disallows webclient users to send clickable urls.",
    "/[add/remove]watch: Adds a user to a watch list to track their battle activity. Format is /addwatch user:comment.",
    "/watchlog: Search the watch log. Accepts /watch 15 (last 15 entries), /watch 10-20 (last 10 to 20) and /watch 10:[Word] (entries that contain that word).",
    "/whobanned: Lists who has banned and unbanned a particular user."
];
