/*jshint laxbreak: true, shadow: true, undef: true, evil: true, trailing: true, proto: true, withstmt: true*/
/*global exports, require, SESSION, sys, script, channelbot, Config, normalbot, sendChanHtmlAll, utilities, staffchannel, sachannel, watchchannel, revchan, getSeconds*/
exports.handleCommand = function (src, command, commandData, tar, channel) {
    var html_escape = require("utilities.js").html_escape;
    var poChannel = SESSION.channels(channel);
    if (poChannel.operators === undefined) {
        poChannel.operators = [];
    }
    if (command === "cauth") {
        if (typeof SESSION.channels(channel).operators !== "object") {
            SESSION.channels(channel).operators = [];
        }
        if (typeof SESSION.channels(channel).admins !== "object") {
            SESSION.channels(channel).admins = [];
        }
        if (typeof SESSION.channels(channel).masters !== "object") {
            SESSION.channels(channel).masters = [];
        }
        if (typeof SESSION.channels(channel).members !== "object") {
            SESSION.channels(channel).members = [];
        }
        if (commandData === "~") {
            var data = {
                members: SESSION.channels(channel).members,
                operators: SESSION.channels(channel).operators,
                admins: SESSION.channels(channel).admins,
                owners: SESSION.channels(channel).masters
            };
            sys.sendMessage(src, "+cauth: " + JSON.stringify(data), channel);
            return;
        }
        var x, ownersArr = [], adminsArr = [], modsArr = [], membersArr = [];
        for (x = 0; x < SESSION.channels(channel).masters.length; x++) {
            if (sys.isInChannel(sys.id(SESSION.channels(channel).masters[x]), channel)) {
                ownersArr.push("<b><font color='" + script.getColor(sys.id(SESSION.channels(channel).masters[x])) + "'>" + html_escape(sys.name(sys.id(SESSION.channels(channel).masters[x]))) + "</font></b>");
            } else {
                ownersArr.push(html_escape(SESSION.channels(channel).masters[x]));
            }
        }
        for (x = 0; x < SESSION.channels(channel).admins.length; x++) {
            if (sys.isInChannel(sys.id(SESSION.channels(channel).admins[x]), channel)) {
                adminsArr.push("<b><font color='" + script.getColor(sys.id(SESSION.channels(channel).admins[x])) + "'>" + html_escape(sys.name(sys.id(SESSION.channels(channel).admins[x]))) + "</font></b>");
            } else {
                adminsArr.push(html_escape(SESSION.channels(channel).admins[x]));
            }
        }
        for (x = 0; x < SESSION.channels(channel).operators.length; x++) {
            if (sys.isInChannel(sys.id(SESSION.channels(channel).operators[x]), channel)) {
                modsArr.push("<b><font color='" + script.getColor(sys.id(SESSION.channels(channel).operators[x])) + "'>" + html_escape(sys.name(sys.id(SESSION.channels(channel).operators[x]))) + "</font></b>");
            } else {
                modsArr.push(html_escape(SESSION.channels(channel).operators[x]));
            }
        }
        for (x = 0; x < SESSION.channels(channel).members.length; x++) {
            if (sys.isInChannel(sys.id(SESSION.channels(channel).members[x]), channel)) {
                membersArr.push("<b><font color='" + script.getColor(sys.id(SESSION.channels(channel).members[x])) + "'>" + html_escape(sys.name(sys.id(SESSION.channels(channel).members[x]))) + "</font></b>");
            } else {
                membersArr.push(html_escape(SESSION.channels(channel).members[x]));
            }
        }
        channelbot.sendHtmlMessage(src, "The channel members of " + sys.channel(channel) + " are:", channel);
        channelbot.sendHtmlMessage(src, "Owners: " + ownersArr.join(", "), channel);
        channelbot.sendHtmlMessage(src, "Admins: " + adminsArr.join(", "), channel);
        channelbot.sendHtmlMessage(src, "Mods: " + modsArr.join(", "), channel);
        if (SESSION.channels(channel).inviteonly >= 1 || SESSION.channels(channel).members.length >= 1) {
            channelbot.sendHtmlMessage(src, "Members: " + membersArr.join(", "), channel);
        }
        return;
    }
    if (command === "register") {
        if (!sys.dbRegistered(sys.name(src))) {
            channelbot.sendMessage(src, "You need to register on the server before registering a channel to yourself for security reasons!", channel);
            return;
        }
        if (sys.auth(src) < 1 && script.isOfficialChan(channel)) {
            channelbot.sendMessage(src, "You don't have sufficient authority to register this channel!", channel);
            return;
        }
        if (poChannel.masters.length === 0) {
            if (poChannel.admins.length > 0) {
                if (poChannel.admins.contains(sys.name(src).toLowerCase())) {
                    poChannel.register(sys.name(src));
                    channelbot.sendAll(sys.name(src) + " has taken the empty owner position by admin.", channel);
                    return;
                }
            } else {
                if (poChannel.operators.length > 0) {
                    if (poChannel.operators.contains(sys.name(src).toLowerCase())) {
                        poChannel.register(sys.name(src));
                        channelbot.sendAll(sys.name(src) + " has taken the empty owner position by moderator.", channel);
                        return;
                    }
                } else {
                    if (poChannel.members.length > 0) {
                        if (poChannel.members.contains(sys.name(src).toLowerCase())) {
                            poChannel.register(sys.name(src));
                            channelbot.sendAll(sys.name(src) + " has taken the empty owner position by member.", channel);
                            return;
                        }
                    } else {
                        poChannel.register(sys.name(src));
                        channelbot.sendMessage(src, "You registered this channel successfully. Take a look of /commands channel", channel);
                        channelbot.sendAll(sys.name(src) + " has registered the channel.", channel);
                        return;
                    }
                    channelbot.sendMessage(src, "Only a channel member can register.", channel);
                    return;
                }
                channelbot.sendMessage(src, "Only a channel operator can register.", channel);
                return;
            }
            channelbot.sendMessage(src, "Only a channel admin can register.", channel);
            return;
        }
        channelbot.sendMessage(src, "This channel is already registered.", channel);
        return;
    }
    if (command === "crules" || command === "channelrules") {
        var x, rules = poChannel.getRules();
        if (rules.length === 0) {
            channelbot.sendMessage(src, "No rules defined for this channel, server rules may apply", channel);
            return;
        }
        sys.sendMessage(src, "*** " + sys.channel(channel) + " channel rules ***", channel);
        if (!isNaN(commandData)) {
            var num = parseInt(commandData, 10);
            if (num <= rules.length && num > 0) {
                var rule = rules[num - 1].split("\n");
                sys.sendMessage(src, rule[0], channel);
                if (rule[1].length > 0) {
                    sys.sendMessage(src, rule[1], channel);
                }
                return;
            }
        }
        for (x = 0; x < rules.length; x++) {
            var rule = rules[x].split("\n");
            sys.sendMessage(src, rule[0], channel);
            if (rule[1].length > 0) {
                sys.sendMessage(src, rule[1], channel);
            }
        }
        return;
    }
    if (command === "passcauth") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Use /passcauth [name]", channel);
            return;
        }
        var oldName = sys.name(src).toLowerCase();
        var action = commandData.split("*"); //useless, but doesn't break comptability, can still use /passcauth name*position but position just won't do anything
        var newName = action[0].toLowerCase();
        if (sys.id(newName) === undefined) {
            channelbot.sendMessage(src, "Your target is offline", channel);
            return;
        }
        if (!sys.dbRegistered(newName)) {
            channelbot.sendMessage(src, "That account isn't registered so you can't give it channel authority!", channel);
            return;
        }
        if (sys.ip(sys.id(newName)) !== sys.ip(src)) {
            channelbot.sendMessage(src, "Both accounts must be on the same IP to switch!", channel);
            return;
        }
        if (poChannel.isChannelOwner(src)) {
            if (poChannel.masters.indexOf(newName) > -1) {
                channelbot.sendMessage(src, newName + " is already a Channel Owner!", channel);
                return;
            }
            poChannel.masters.splice(poChannel.masters.indexOf(oldName), 1);
            poChannel.masters.push(newName);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Owner to " + newName + "!", channel);
            return;
        }
        if (poChannel.isChannelAdmin(src)) {
            if (poChannel.admins.indexOf(newName) > -1) {
                channelbot.sendMessage(src, newName + " is already a Channel Admin!", channel);
                return;
            }
            poChannel.admins.splice(poChannel.admins.indexOf(oldName), 1);
            poChannel.admins.push(newName);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Admin to " + newName + "!", channel);
            return;
        }
        if (poChannel.isChannelOperator(src)) {
            if (poChannel.operators.indexOf(newName) > -1) {
                channelbot.sendMessage(src, newName + " is already a Channel Mod!", channel);
                return;
            }
            poChannel.operators.splice(poChannel.operators.indexOf(oldName), 1);
            poChannel.operators.push(newName);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Mod to " + newName + "!", channel);
            return;
        }
        if (poChannel.isChannelMember(src)) {
            if (poChannel.members.indexOf(newName) > -1) {
                channelbot.sendMessage(src, newName + " is already a Channel Member!", channel);
                return;
            }
            poChannel.members.splice(poChannel.members.indexOf(oldName), 1);
            poChannel.members.push(newName);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Membership to " + newName + "!", channel);
            return;
        }
        channelbot.sendMessage(src, "You don't have sufficient channel auth to pass that position.", channel);
        return;
    }

    if (command === "topic") {
        //Mods shouldn't be able to change topic of private channels
        if (poChannel.isChannelOperator(src) || (sys.auth(src) === 1 && script.isPOChannel(channel))) {
            SESSION.channels(channel).setTopic(src, commandData);
        } else {
            SESSION.channels(channel).setTopic(src);
        }
        return;
    }

    if (command === "topicadd") {
        if (commandData !== undefined) {
            if (SESSION.channels(channel).topic.length > 0) {
                SESSION.channels(channel).setTopic(src, SESSION.channels(channel).topic + Config.topic_delimiter + commandData);
            } else {
                SESSION.channels(channel).setTopic(src, commandData);
            }
            return;
        }
        channelbot.sendMessage(src, "Please enter a topic to add after.", channel);
        return;
    }
    if (command === "removepart" || command === "removeparts") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Correct usage is /" + command + " [number]. Separate multiple part numbers with a space.", channel);
            return;
        }
        var i,
            parts = commandData.indexOf(":") !== -1 ? commandData.split(":") : commandData.split(" "),
            topic = SESSION.channels(channel).topic,
            duplicates = [];
        topic = topic.split(Config.topic_delimiter);
        for (i = 0; i < parts.length; i++) {
            var part = parseInt(parts[i], 10),
                pospart = topic.length + part + 1;
            if (part < 0 && pospart > 0) {
                parts.splice(i, 1, pospart);
                duplicates.push(pospart);
                continue;
            }
            if (isNaN(part) || part > topic.length || pospart < 0) {
                channelbot.sendMessage(src, "Parts must be a number from 1 to " + topic.length + "!", channel);
                return;
            }
            if (duplicates.indexOf(part) !== -1) {
                channelbot.sendMessage(src, "You can't remove part " + part + " twice!", channel);
                return;
            }
            duplicates.push(part);
        }
        // Sort by largest numbers first to avoid interfering with earlier parts after removal
        parts.sort(function (a, b) { return b - a; }).forEach(function (part) {
            topic.splice(part - 1, 1);
        });
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command === "topicparts") {
        var topic = SESSION.channels(channel).topic;
        if (typeof topic === "string" && topic !== "") {
            var i = 0;
            topic = topic.split(Config.topic_delimiter).map(function (part) {
                return "<font color='blue'><b>[" + (++i) + "]</b></font> " + part;
            }).join(Config.topic_delimiter);
            // HTML isn't necessary, but it makes the number more obvious
            sys.sendHtmlMessage(src, "<font color='#3DAA68'><timestamp/> <b>±" + Config.channelbot + ":</b></font> Topic for this channel is: " + topic, channel);
        } else {
            channelbot.sendMessage(src, "No topic set for this channel.", channel);
        }
        return;
    }
    if (command === "updatepart") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please enter the topic number spaced with the text to change.", channel);
            return;
        }
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        var pos = commandData.indexOf(" ");
        if (pos === -1) {
            return;
        }
        if (isNaN(commandData.substring(0, pos)) || commandData.substring(0, pos) - 1 < 0 || commandData.substring(0, pos) - 1 > topic.length - 1) {
            return;
        }
        topic[commandData.substring(0, pos) - 1] = commandData.substr(pos + 1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }

    if (!poChannel.isChannelOperator(src)) {
        return "no command";
    }

    if (["ck", "chankick", "lt", "lovetap"].contains(command)) {
        if (tar === undefined || !sys.isInChannel(tar, channel)) {
            normalbot.sendMessage(src, "Choose a valid target to kick", channel);
            return;
        }
        if (!sys.isInChannel(tar, channel)) {
            normalbot.sendMessage(src, "Your target is not in the channel.", channel);
            return;
        }
        if (command === "lt" || command === "lovetap") {
            var colour = script.getColor(src);
            sendChanHtmlAll("<font color='" + colour + "'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> love taps " + commandData + ".</font>", channel);
        } else {
            normalbot.sendAll(sys.name(src) + " kicked " + commandData + " from the channel!", channel);
        }
        sys.kick(tar, channel);
        return;
    }
    if (command === "invite") {
        if (tar === undefined) {
            channelbot.sendMessage(src, "Choose a valid target for invite!", channel);
            return;
        }
        if (sys.isInChannel(tar, channel) && SESSION.channels(channel).canJoin(tar) === "allowed") {
            channelbot.sendMessage(src, "Your target already sits here!", channel);
            return;
        }
        if (SESSION.channels(channel).canJoin(tar) === "banned") {
            channelbot.sendMessage(src, "Your target is banned from this channel!", channel);
            return;
        }
        var now = (new Date()).getTime();
        if (typeof SESSION.users(tar).inviteDelay === "object" && SESSION.users(tar).inviteDelay.hasOwnProperty(sys.ip(src)) && now < SESSION.users(tar).inviteDelay[sys.ip(src)]) {
            channelbot.sendMessage(src, "Please wait before sending another invite!", channel);
            return;
        }
        if (!sys.isInChannel(tar, channel)) {
            channelbot.sendMessage(tar, sys.name(src) + " would like you to join #" + sys.channel(channel) + "!");
        }
        var guardedChans = [staffchannel, sachannel, watchchannel, revchan];
        if ((sys.auth(tar) < SESSION.channels(channel).inviteonly || guardedChans.indexOf(channel) !== -1) && SESSION.channels(channel).canJoin(tar) !== "allowed") {
            poChannel.issueAuth(src, commandData, "member");
        } else {
            channelbot.sendMessage(src, "Your target was invited.", channel);
        }
        if (typeof SESSION.users(tar).inviteDelay !== "object") {
            SESSION.users(tar).inviteDelay = {};
        }
        SESSION.users(tar).inviteDelay[sys.ip(src)] = (new Date()).getTime() + 8000;
        return;
    }
    if (command === "member") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to make a member!", channel);
            return;
        }
        poChannel.issueAuth(src, commandData, "member");
        return;
    }
    if (command === "uninvite" || command === "demember" || command === "deinvite" || command === "dismember") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to remove membership from!", channel);
            return;
        }
        poChannel.takeAuth(src, commandData, "member");
        if (tar !== undefined) {
            if (sys.isInChannel(tar, channel) && (command === "uninvite" || command === "deinvite")) {
                sys.kick(tar, channel);
                channelbot.sendAll("And " + commandData + " was gone!", channel);
            }
        }
        return;
    }
    if (command === "cmeon") {
        script.meon(src, sys.channel(channel));
        return;
    }
    if (command === "cmeoff") {
        /*if (channel === 0 || channel == tourchannel) {
            normalbot.sendMessage(src, "/me can't be turned off here.", channel);
            return;
        }*/
        script.meoff(src, sys.channel(channel));
        return;
    }
    if (command === "csilence" || command === "csilenceoff") {
        if (command === "csilenceoff" || commandData === "off") {
            script.silenceoff(src, sys.channel(channel));
        } else {
            if (commandData === undefined) {
                commandData = "permanent";
            }
            script.silence(src, commandData, sys.channel(channel));
        }
        return;
    }
    if (command === "cmute") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to mute in the channel!", channel);
            return;
        }
        var i = commandData.indexOf(":"),
            j = commandData.lastIndexOf(":"),
            time = 0,
            reason = "",
            tarName = "";
        if (i !== -1) {
            tarName = commandData.substring(0, i);
            var timeString = commandData.substring(j + 1, commandData.length);
            if (timeString !== "" && !isNaN(timeString.replace(/s\s|m\s|h\s|d\s|w\s|s|m|h|d|w/gi, ""))) {
                time = getSeconds(timeString);
            } else {
                time = 0;
                reason = commandData.slice(i + 1);
                j = i;
            }
            if (i !== j) {
                reason = commandData.substring(i + 1, j);
            }
        } else {
            tarName = commandData;
        }
        if (sys.dbIp(tarName) === undefined) {
            normalbot.sendMessage(src, "This user doesn't exist.", channel);
            return;
        }
        poChannel.mute(src, tarName, {"time": time, "reason": reason}, SESSION.users(src).smute.active);
        return;
    }
    if (command === "cunmute") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to unmute in the channel!", channel);
        }
        poChannel.unmute(src, commandData);
        return;
    }
    if (command === "cmutes") {
        var cmutelist = poChannel.getReadableList("mutelist", sys.os(src), commandData);
        if (cmutelist !== "") {
            sys.sendHtmlMessage(src, cmutelist, channel);
        } else if (commandData !== undefined) {
            channelbot.sendMessage(src, "No users muted in this channel have \"" + commandData +  "\" in their name.", channel);
        } else {
            channelbot.sendMessage(src, "No one is muted on this channel.", channel);
        }
        return;
    }
    if (command === "cbans") {
        var cbanlist = poChannel.getReadableList("banlist", sys.os(src), commandData);
        if (cbanlist !== "") {
            sys.sendHtmlMessage(src, cbanlist, channel);
        } else if (commandData !== undefined) {
            channelbot.sendMessage(src, "No users banned in this channel have \"" + commandData +  "\" in their name.", channel);
        } else {
            channelbot.sendMessage(src, "No one is banned on this channel.", channel);
        }
        return;
    }

    if (!poChannel.isChannelAdmin(src)) {
        return "no command";
    }

    if (command === "op") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to give channel operator permissions!", channel);
            return;
        }
        poChannel.issueAuth(src, commandData, "mod");
        return;
    }
    if (command === "deop") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to remove channel operator permissions!", channel);
            return;
        }
        poChannel.takeAuth(src, commandData, "mod");
        return;
    }
    if (command === "inviteonly") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, poChannel.inviteonly === 0 ? "This channel is public!" : "This channel is invite only for users below auth level " + poChannel.inviteonly, channel);
            return;
        }
        var value = -1;
        if (commandData === "off") {
            value = 0;
        } else if (commandData === "on") {
            value = 3;
        } else {
            value = parseInt(commandData, 10);
        }
        var message = poChannel.changeParameter(src, "invitelevel", value);
        normalbot.sendAll(message, channel);
        return;
    }
    if (command === "ctoggleflood") {
        poChannel.ignoreflood = !poChannel.ignoreflood;
        channelbot.sendMessage(src, "Now " + (poChannel.ignoreflood ? "" : "dis") + "allowing excessive flooding.", channel);
        return;
    }
    if (command === "ctoggleswear") {
        poChannel.allowSwear = !poChannel.allowSwear;
        channelbot.sendAll(sys.name(src) + " " + (poChannel.allowSwear ? "" : "dis") + "allowed swearing.", poChannel.id);
        return;
    }
    if (command === "ctogglecaps") {
        poChannel.ignorecaps = !poChannel.ignorecaps;
        channelbot.sendMessage(src, "Now " + (poChannel.ignorecaps ? "" : "dis") + "allowing excessive CAPS-usage.", channel);
        return;
    }
    if (command === "cban") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to ban from the channel!", channel);
            return;
        }
        var i = commandData.indexOf(":"),
            j = commandData.lastIndexOf(":"),
            time = 0,
            reason = "",
            tarName = "";
        if (i !== -1) {
            tarName = commandData.substring(0, i);
            var timeString = commandData.substring(j + 1, commandData.length);
            if (timeString !== "" && !isNaN(timeString.replace(/s\s|m\s|h\s|d\s|w\s|s|m|h|d|w/gi, ""))) {
                time = getSeconds(timeString);
            } else {
                time = 0;
                reason = commandData.slice(i + 1);
                j = i;
            }
            if (i !== j) {
                reason = commandData.substring(i + 1, j);
            }
        } else {
            tarName = commandData;
        }
        if (sys.dbIp(tarName) === undefined) {
            normalbot.sendMessage(src, "This user doesn't exist.", channel);
            return;
        }
        poChannel.ban(src, tarName, {"time": time, "reason": reason});
        return;
    }
    if (command === "cunban") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to unban from the channel!", channel);
            return;
        }
        poChannel.unban(src, commandData);
        return;
    }

    if (!poChannel.isChannelOwner(src) && sys.auth(src) < 2) {
        return "no command";
    }

    if (command === "deregister") {
        if (commandData === undefined) {
            poChannel.takeAuth(src, sys.name(src), "owner");
        } else {
            poChannel.takeAuth(src, commandData, "owner");
        }
        return;
    }

    if (!poChannel.isChannelOwner(src)) {
        return "no command";
    }

    if (command === "admin") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to give channel admin permissions!", channel);
            return;
        }
        poChannel.issueAuth(src, commandData, "admin");
        return;
    }
    if (command === "deadmin") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to remove channel admin permissions!", channel);
            return;
        }
        poChannel.takeAuth(src, commandData, "admin");
        return;
    }
    if (command === "owner") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to give channel owner permissions!", channel);
            return;
        }
        poChannel.issueAuth(src, commandData, "owner");
        return;
    }
    if (command === "deowner") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please specify a valid target to remove channel owner permissions!", channel);
            return;
        }
        poChannel.takeAuth(src, commandData, "owner");
        return;
    }
    if (command === "addrule") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Use /addrule name:description.", channel);
            return;
        }
        commandData = commandData.split(":");
        if (commandData.length !== 2) {
            channelbot.sendMessage(src, "Use /addrule name:description.", channel);
            return;
        }
        var returnVal = poChannel.addRule(commandData[0], commandData[1]);
        if (returnVal) {
            channelbot.sendMessage(src, returnVal, channel);
        } else {
            channelbot.sendMessage(src, "You added a rule", channel);
        }
        return;
    }
    if (command === "removerule") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Please enter a rule number to remove.", channel);
            return;
        }
        var returnVal = poChannel.removeRule(commandData);
        if (returnVal) {
            channelbot.sendMessage(src, returnVal, channel);
        } else {
            channelbot.sendMessage(src, "You removed a rule", channel);
        }
        return;
    }
    if (command === "editrule") {
        if (commandData === undefined) {
            channelbot.sendMessage(src, "Use /editrule index:name:description", channel);
            return;
        }
        commandData = commandData.split(":");
        if (commandData.length !== 3) {
            channelbot.sendMessage(src, "Use /editrule index:name:description", channel);
            return;
        }
        var returnVal = poChannel.editRule(commandData[0], commandData[1], commandData[2]);
        if (returnVal) {
            channelbot.sendMessage(src, returnVal, channel);
        } else {
            channelbot.sendMessage(src, "You edited a rule", channel);
        }
        return;
    }

    return "no command";
};
exports.help = function (src, channel) {
    var poChannel = SESSION.channels(channel);
    sys.sendMessage(src, "/cauth: Shows the auth list for the current channel.", channel);
    sys.sendMessage(src, "/crules: To see a list of the current channel's rules.", channel);
    sys.sendMessage(src, "/register: To register the current channel you're in, if it isn't registered already.", channel);
    sys.sendMessage(src, "/topic [topic]: Displays the current channel topic. Changing the topic requires channel mod or higher.", channel);
    sys.sendMessage(src, "/topicparts: Displays topic with number highlighted parts.", channel);
    if (poChannel.isChannelMember(src) || poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
        sys.sendMessage(src, "*** Channel Member commands ***", channel);
        sys.sendMessage(src, "/passcauth [name]: Passes channel authority to a new alt. New name must be registered, online, and have the same IP as the old name. Valid positions are member, mod (or op), admin, and owner.", channel);
    }
    if (poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
        sys.sendMessage(src, "*** Channel Mod commands ***", channel);
        sys.sendMessage(src, "/topicadd [message]: Uses the topic message separator and adds your message to the end of the current channel topic.", channel);
        sys.sendMessage(src, "/removepart [number]: Removes the part in the channel topic that is identified by the number. You can remove multiple parts at a time if you seperate with a space.", channel);
        sys.sendMessage(src, "/updatepart [number] [message]: Changes the part in the channel topic that is identified by the number to your message.", channel);
        sys.sendMessage(src, "/ck: Kicks someone from current channel.", channel);
        sys.sendMessage(src, "/lt: Love taps and removes someone from current channel.", channel);
        sys.sendMessage(src, "/member: Makes the user a member.", channel);
        sys.sendMessage(src, "/demember: Removes membership from a user.", channel);
        sys.sendMessage(src, "/invite: Makes the user a member and sends them a link to the channel.", channel);
        sys.sendMessage(src, "/uninvite: Kicks the user from the channel and removes their membership.", channel);
        sys.sendMessage(src, "/cmeon: Turns on /me for the channel.", channel);
        sys.sendMessage(src, "/cmeoff: Turns off /me for the channel.", channel);
        sys.sendMessage(src, "/csilence [number]: Prevents authless users from talking in the current channel for the specified number of minutes.", channel);
        sys.sendMessage(src, "/csilenceoff: Allows users to talk in current channel.", channel);
        sys.sendMessage(src, "/cmute: Mutes someone in current channel (reason and time optional). Format name:reason:time", channel);
        sys.sendMessage(src, "/cunmute: Unmutes someone in current channel.", channel);
        sys.sendMessage(src, "/cmutes: Lists users muted in current channel.", channel);
        sys.sendMessage(src, "/cbans: Lists users banned from current channel.", channel);
    }
    if (poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
        sys.sendMessage(src, "*** Channel Admin commands ***", channel);
        sys.sendMessage(src, "/op: Gives a user channel operator status.", channel);
        sys.sendMessage(src, "/deop: Removes channel operator status from a user.", channel);
        sys.sendMessage(src, "/inviteonly [on/off/level]: Makes a channel invite-only or public.", channel);
        sys.sendMessage(src, "/ctogglecaps: Turns on/off the server anti-caps bot in the current channel.", channel);
        sys.sendMessage(src, "/ctoggleflood: Turns on/off the server anti-flood bot in the current channel. However, users can still be kicked for overactivity.", channel);
        sys.sendMessage(src, "/ctoggleswear: Turns on/off the use of some common swear words.", channel);
        sys.sendMessage(src, "/cban: Bans someone from the current channel (reason and time optional). Format name:reason:time", channel);
        sys.sendMessage(src, "/cunban: Unbans someone from the current channel.", channel);
        if (sys.auth(src) >= 2) {
            sys.sendMessage(src, "/deregister: Removes channel owner status from a user.", channel);
        }
    }
    if (poChannel.isChannelOwner(src)) {
        sys.sendMessage(src, "*** Channel Owner commands ***", channel);
        sys.sendMessage(src, "/admin: Gives a user channel admin status.", channel);
        sys.sendMessage(src, "/deadmin: Removes channel admin status from a user.", channel);
        sys.sendMessage(src, "/owner: Gives a user channel owner status.", channel);
        sys.sendMessage(src, "/deowner: Removes channel owner status from a user.", channel);
        sys.sendMessage(src, "/addrule [name]:[description]: Adds a rule to the current channel. Numbers are added automatically and there is a limit of 10 rules.", channel);
        sys.sendMessage(src, "/removerule [number]: Removes the numbered rule.", channel);
        sys.sendMessage(src, "/editrule [number]:[name]:[description]: Edits the numbered rule.", channel);
    }
    if (Array.isArray(SESSION.global().permaTours) && SESSION.global().permaTours.indexOf(channel) > -1) {
        sys.sendMessage(src, "*** Channel Tournaments commands ***", channel);
        sys.sendMessage(src, "/join: Enters you to into the tournament.", channel);
        sys.sendMessage(src, "/unjoin: Withdraws you from the tournament.", channel);
        sys.sendMessage(src, "/viewround: Shows the current pairings for the round.", channel);
        sys.sendMessage(src, "/viewqueue: Shows the current queue.", channel);
        sys.sendMessage(src, "/touralerts [on/off]: Turn on/off your tour alerts (Shows your list of tour alerts if on/off isn't specified).", channel);
        sys.sendMessage(src, "/addtouralert: Adds a tour alert for the specified tier. Add multiple by seperating tiers with *.", channel);
        sys.sendMessage(src, "/removetouralert: Removes a tour alert for the specified tier. Remove multiple by seperating tiers with *.", channel);
        if (poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
            sys.sendMessage(src, "*** Channel Tournaments Admin commands ***", channel);
            sys.sendMessage(src, "/tour: Starts a tournament in set tier for the selected number of players. Format is /tour tier:number:type. Type is optional and can be set to Singles, Doubles or Triples.", channel);
            sys.sendMessage(src, "/queue: Schedules a tournament to automatically start after the current one. Format is /queue tier:number:type.", channel);
            sys.sendMessage(src, "/endtour: Ends the current tournament.", channel);
            sys.sendMessage(src, "/dq: Disqualifies someone from the tournament.", channel);
            sys.sendMessage(src, "/push: Adds a user to the tournament.", channel);
            sys.sendMessage(src, "/changecount: Changes the number of entrants during the signup phase.", channel);
            sys.sendMessage(src, "/sub: Replaces the first user with another in the tournament. Format /sub user1:user2", channel);
            sys.sendMessage(src, "/cancelBattle: Allows the user or their opponent to forfeit without being removed from the tournament. Use it so users can battle again with correct clauses.", channel);
            sys.sendMessage(src, "/rmqueue: Removes a specified tier from the tournament queue.", channel);
        }
    }
};
