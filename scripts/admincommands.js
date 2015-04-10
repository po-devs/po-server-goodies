exports.handleCommand = function(src, command, commandData, tar, channel) {
    if (command == "memorydump") {
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
    }
    if (command == "indigoinvite") {

        if (channel != staffchannel && channel != sachannel) {
            normalbot.sendMessage(src, "Can't use on this channel.", channel);
            return;
        }
        if (tar === undefined) {
            normalbot.sendMessage(src, "Your target is not online.", channel);
            return;
        }
        if (SESSION.users(tar).megauser || SESSION.users(tar).contributions || sys.auth(tar) > 0) {
            normalbot.sendMessage(src, "They have already access.", channel);
            return;
        }
        SESSION.channels(channel).issueAuth(src, commandData, "member");
        normalbot.sendAll("" + sys.name(src) + " summoned " + sys.name(tar) + " to this channel!", channel);
        sys.putInChannel(tar, channel);
        normalbot.sendMessage(tar, "" + sys.name(src) + " made you join this channel!", channel);
        return;
    }
    if (command == "indigodeinvite") {
        var count = 0;
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if (sys.isInChannel(current_player, staffchannel) && !script.canJoinStaffChannel(current_player)) {
                sys.kick(current_player, staffchannel);
                SESSION.channels(channel).takeAuth(src, sys.name(current_player), "member");
                count = 1;
            }
        }
        normalbot.sendAll("" + count + " unwanted visitors were kicked...", staffchannel);
        return;
    }
    if (command == "destroychan") {
        var ch = commandData;
        var chid = sys.channelId(ch);
        if(sys.existChannel(ch) !== true) {
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
    if (command == "ban") {
        if(sys.dbIp(commandData) === undefined) {
            normalbot.sendMessage(src, "No player exists by this name!", channel);
            return;
        }
        if (sys.maxAuth(sys.ip(tar))>=sys.auth(src)) {
           normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
           return;
        }

        var ip = sys.dbIp(commandData);
        if(sys.maxAuth(ip)>=sys.auth(src)) {
           normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
           return;
        }
        if(sys.banned(ip) && !script.isTempBanned(ip)) {
            normalbot.sendMessage(src, "He/she's already banned!", channel);
            return;
        }
        
        if (script.isTempBanned(ip)) {
            sys.unban(commandData); //needed as at the moment bans don't overwrite tempbans
        }
        normalbot.sendAll("Target: " + commandData + ", IP: " + ip, staffchannel);
        sendChanHtmlAll('<b><font color=red>' + commandData + ' was banned by ' + nonFlashing(sys.name(src)) + '!</font></b>',-1);
        sys.ban(commandData);
        script.kickAll(ip);
        sys.appendToFile('bans.txt', sys.name(src) + ' banned ' + commandData + "\n");
        var authname = sys.name(src).toLowerCase();
        script.authStats[authname] =  script.authStats[authname] || {};
        script.authStats[authname].latestBan = [commandData, parseInt(sys.time(), 10)];
        return;
    }
    if (command == "unban") {
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

    if (command == "nameban") {
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
        return;
    }
    if (command == "nameunban") {
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
        }
        return;
    }
    if (command == "channameban" || command == "channelnameban") {
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
    if (command == "channameunban" || command == "channelnameunban") {
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
    if (command == "namewarn") {
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
    if (command == "nameunwarn") {
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
    
       
    if (command == "cookieban" || command == "cookiemute") {
        if (!commandData) {
            return;
        }
        if (!sys.loggedIn(sys.id(commandData))) {
            normalbot.sendMessage(src, "Target not logged in", channel);
            return;
        }
        var tar = sys.id(commandData);
        if (sys.os(tar) !== "android" && sys.version(tar) < 2402 || sys.os(tar) === "android" && sys.version(tar) < 37) {
            //probably won't work well on windows/linux/etc anyways...
            normalbot.sendMessage(src, "Cookies won't work on this target", channel);
            return;
        }
        if (command == "cookiemute") {
            SESSION.users(sys.id(commandData)).activate("smute", Config.kickbot, 0, "Cookie", true);
            kickbot.sendAll(commandData + " was smuted by cookie", staffchannel);
        }
        var type = (command === "cookieban" ? "banned" : "muted");
        sys.setCookie(sys.id(commandData), type + " " + commandData.toCorrectCase());
        normalbot.sendAll(commandData.toCorrectCase() + " was cookie " + type + " by " + sys.name(src), staffchannel);
        if (type == "banned") {
            sys.kick(tar);
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
        normalbot.sendAll(commandData.toCorrectCase() + " was cookie " + type, staffchannel);
        return;
    }
    
    if (command == "whobanned") {
        if (!commandData) {
            normalbot.sendMessage(src, "No name entered", channel);
            return;
        }
        var banned = sys.getFileContent("bans.txt").split("\n").filter(function(s) {
            return s.toLowerCase().indexOf(commandData.toLowerCase()) != -1;
        });
        normalbot.sendMessage(src, banned, channel);
        return;
    }
    if (command == "idban" || command == "idmute") {
        if (!commandData) {
            return;
        }
        if (!sys.loggedIn(sys.id(commandData))) {
            normalbot.sendMessage(src, "Target not logged in", channel);
            return;
        }
        var tar = sys.id(commandData);
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
        normalbot.sendAll(commandData.toCorrectCase() + " was ID " + type + " by " + sys.name(src), staffchannel);
        if (type == "muted") {
            SESSION.users(tar).activate("smute", Config.kickbot, 0, "ID", true);
        } else {
            sys.kick(tar);
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
            var tar = banInfo.name;
            script.idBans.remove(commandData);
            if (banInfo.type == "muted") {
                script.unban("smute", Config.kickbot, tar, commandData);
            }
            normalbot.sendAll(commandData.toCorrectCase() + " was ID " + type, staffchannel);
            return;
        }
        normalbot.sendMessage(src, "ID not found", channel);
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
exports.help = 
    [
        "/ban: Bans a user.",
        "/unban: Unbans a user.",
        "/togglerainbow [on/off]: Turns /rainbow or on off in the server",
        "/memorydump: Shows the state of the memory.",
        "/nameban: Adds a regexp ban on usernames.",
        "/nameunban: Removes a regexp ban on usernames.",
        "/channelnameban: Adds a regexp ban on channel names.",
        "/channelnameunban: Removes a regexp ban on channel names.",
        "/namewarn: Adds a regexp namewarning",
        "/nameunwarn: Removes a regexp namewarning",
        "/destroychan: Destroy a channel (official channels are protected).",
        "/indigoinvite: To invite somebody to staff channels.",
        "/indigodeinvite: To deinvite unwanted visitors from staff channel.",
        "/cookieban: Bans an online target by cookie.",
        "/cookiemute: Puts an online android target on an autosmute list by cookie.",
        "/cookieunban/mute: Undos a cookieban/mute. Will take effect when they next log in"
    ];
