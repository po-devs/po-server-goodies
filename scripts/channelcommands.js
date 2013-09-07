exports.handleCommand = function(src, command, commandData, tar) {
    var poChannel = SESSION.channels(channel);
    if (poChannel.operators === undefined)
        poChannel.operators = [];
    if (command == "lt" || command == "lovetap") {
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Choose a valid target for your love!");
            return;
        }
        var colour = script.getColor(src);
        sendChanHtmlAll("<font color='"+colour+"'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> love taps " + commandData + ".</font>", channel);
        sys.kick(tar, channel);
        return;
    }
    if (command == "ck" || command == "chankick") {
        if (tar === undefined || !sys.isInChannel(tar, channel)) {
            normalbot.sendChanMessage(src, "Choose a valid target to kick");
            return;
        }
        normalbot.sendChanAll(sys.name(src) + " kicked "+commandData+" from the channel!");
        sys.kick(tar, channel);
        return;
    }
    if (command == "invite") {
        if (tar === undefined) {
            channelbot.sendChanMessage(src, "Choose a valid target for invite!");
            return;
        }
        if (sys.isInChannel(tar, channel) && SESSION.channels(channel).canJoin(tar) == "allowed") {
            channelbot.sendChanMessage(src, "Your target already sits here!");
            return;
        }
        if (SESSION.channels(channel).canJoin(tar) == "banned") {
            channelbot.sendChanMessage(src, "Your target is banned from this channel!");
            return;
        }
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).inviteDelay) {
            channelbot.sendMessage(src, "Please wait before sending another invite!");
            return;
        }
        if (!sys.isInChannel(tar, channel)) {
            channelbot.sendMessage(tar, "" + sys.name(src) + " would like you to join #" + sys.channel(channel) + "!");
        }
        var guardedChans = [staffchannel, sachannel, watchchannel, revchan];
        if ((sys.auth(tar) < SESSION.channels(channel).inviteonly || guardedChans.indexOf(channel) !== -1) && SESSION.channels(channel).canJoin(tar) != "allowed") {
            poChannel.issueAuth(src, commandData, "member");
        } else {
            channelbot.sendChanMessage(src, "Your target was invited.");
        }
        SESSION.users(src).inviteDelay = (new Date()).getTime() + 8000;
        return;
    }
    if (command == "member") {
        poChannel.issueAuth(src, commandData, "member");
        return;
    }
    if (command == "deinvite" || command == "demember") {
        poChannel.takeAuth(src, commandData, "member");
        if (tar !== undefined) {
            if (sys.isInChannel(tar, channel) && command == "deinvite") {
                sys.kick(tar, channel);
                channelbot.sendChanAll("And "+commandData+" was gone!");
            }
        }
        return;
    }
    if (command == "cmeon") {
        script.meon(src, sys.channel(channel));
        return;
    }
    if (command == "cmeoff") {
        if (channel === 0 || channel == tourchannel) {
            normalbot.sendChanMessage(src, "/me can't be turned off here.");
            return;
        }
        script.meoff(src, sys.channel(channel));
        return;
    }
    if (command == "csilence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        script.silence(src, commandData, sys.channel(channel));
        return;
    }
    if (command == "csilenceoff") {
        script.silenceoff(src, sys.channel(channel));
        return;
    }
    if (command == "cmute") {
        var tmp = commandData.split(":",3);
        var tarname = tmp[0];
        var time = 0;
        var reason = "";
        if (tmp.length >= 2) {
            reason = tmp[1];
            if (tmp.length >= 3) {
                time = getSeconds(tmp[2]);
                if (isNaN(time)) {
                    time = 0;
                }
            }
        }
        if (sys.dbIp(tarname) === undefined) {
            normalbot.sendChanMessage(src, "This user doesn't exist.");
            return;
        }
        poChannel.mute(src, tarname, {'time': time, 'reason': reason});
        return;
    }
    if (command == "cunmute") {
        poChannel.unmute(src, commandData);
        return;
    }
    if (command == "cmutes") {
        var cmutelist = poChannel.getReadableList("mutelist");
        if (cmutelist !== "") {
            sys.sendHtmlMessage(src, cmutelist, channel);
        }
        else {
            channelbot.sendChanMessage(src, "No one is muted on this channel.");
        }
        return;
    }
    if (command == "cbans") {
        var cbanlist = poChannel.getReadableList("banlist");
        if (cbanlist !== "") {
            sys.sendHtmlMessage(src, cbanlist, channel);
        }
        else {
            channelbot.sendChanMessage(src, "No one is banned on this channel.");
        }
        return;
    }

    if (!poChannel.isChannelAdmin(src)) {
        return "no command";
    }

    if (command == "op") {
        poChannel.issueAuth(src, commandData, "mod");
        return;
    }
    if (command == "deop") {
        poChannel.takeAuth(src, commandData, "mod");
        return;
    }
    if (command == "inviteonly") {
        if (commandData === undefined) {
            channelbot.sendChanMessage(src,poChannel.inviteonly === 0 ? "This channel is public!" : "This channel is invite only for users below auth level "+poChannel.inviteonly);
            return;
        }
        var value = -1;
        if (commandData == "off") {
            value = 0;
        }
        else if (commandData == "on") {
            value = 3;
        }
        else {
            value = parseInt(commandData,10);
        }
        var message = poChannel.changeParameter(src, "invitelevel", value);
        normalbot.sendChanAll(message);
        return;
    }
    if (command == "ctoggleflood") {
        poChannel.ignoreflood = !poChannel.ignoreflood;
        channelbot.sendChanMessage(src, "Now " + (poChannel.ignoreflood ? "" : "dis") + "allowing excessive flooding.");
        return;
    }
    if (command == "ctoggleswear") {
        poChannel.allowSwear = !poChannel.allowSwear;
        channelbot.sendAll(sys.name(src) + " " + (poChannel.allowSwear ? "" : "dis") + "allowed swearing.", poChannel.id);
        return;
    }
    if (command == "ctogglecaps") {
        poChannel.ignorecaps = !poChannel.ignorecaps;
        channelbot.sendChanMessage(src, "Now " + (poChannel.ignorecaps ? "" : "dis") + "allowing excessive CAPS-usage.");
        return;
    }
    if (command == "cban") {
        var tmp = commandData.split(":",3);
        var tarname = tmp[0];
        var time = 0;
        var reason = "";
        if (tmp.length >= 2) {
            reason = tmp[1];
            if (tmp.length >= 3) {
                time = getSeconds(tmp[2]);
                if (isNaN(time)) {
                    time = 0;
                }
            }
        }
        if (sys.dbIp(tarname) === undefined) {
            normalbot.sendChanMessage(src, "This user doesn't exist.");
            return;
        }
        poChannel.ban(src, tarname, {'time': time, 'reason': reason});
        return;
    }
    if (command == "cunban") {
        poChannel.unban(src, commandData);
        return;
    }
    // auth 2 can deregister channel for administration purposes
    if (!poChannel.isChannelOwner(src) && sys.auth(src) < 2) {
        return "no command";
    }
    if (command == "deregister") {
        if (commandData === undefined) {
            poChannel.takeAuth(src, sys.name(src), "owner");
        }
        else {
            poChannel.takeAuth(src, commandData, "owner");
        }
        return;
    }
    if (!poChannel.isChannelOwner(src)) {
        return "no command";
    }
    if (command == "admin") {
        poChannel.issueAuth(src, commandData, "admin");
        return;
    }
    if (command == "deadmin") {
        poChannel.takeAuth(src, commandData, "admin");
        return;
    }
    if (command == "owner") {
        poChannel.issueAuth(src, commandData, "owner");
        return;
    }
    if (command == "deowner") {
        poChannel.takeAuth(src, commandData, "owner");
        return;
    }
    return "no command";
};
exports.onHelp = function(src, commandData, channel) {
    if (commandData === "channel") {
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** Channel commands ***", channel);
            sys.sendMessage(src, "/cauth: Shows a list of channel auth.", channel);
            if (poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
                sys.sendMessage(src, "*** Channel Mod commands ***", channel);
                sys.sendMessage(src, "/register: To register the current channel you're on.", channel);
                sys.sendMessage(src, "/topic [topic]: Sets the topic of a channel. Only works if you're the first to log on a channel or have auth there. Displays current topic instead if no new one is given.", channel);
                sys.sendMessage(src, "/ck: Kicks someone from current channel.", channel);
                sys.sendMessage(src, "/member: Makes the user a member.", channel);
                sys.sendMessage(src, "/demember: Removes membership from a user.", channel);
                sys.sendMessage(src, "/invite: Makes the user a member and sends them a link to the channel.", channel);
                sys.sendMessage(src, "/deinvite: Kicks the user from the channel and removes their membership.", channel);
                sys.sendMessage(src, "/cmeon: Turns on /me for the channel.", channel);
                sys.sendMessage(src, "/cmeoff: Turns off /me for the channel.", channel);
                sys.sendMessage(src, "/csilence: Prevents authless users from talking in current channel specified time.", channel);
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
                sys.sendMessage(src, "/ctogglecaps: Turns on/off the server anti-caps bot in current channel.", channel);
                sys.sendMessage(src, "/ctoggleflood: Turns on/off the server anti-flood bot in current channel. Overactive still in effect.", channel);
                sys.sendMessage(src, "/ctoggleswear: Turns on/off the use of some common swear words.", channel);
                sys.sendMessage(src, "/cban: Bans someone from current channel (reason and time optional). Format name:reason:time", channel);
                sys.sendMessage(src, "/cunban: Unbans someone from current channel.", channel);
                sys.sendMessage(src, "/enabletours: Allows tours to be run in the channel.", channel);
                sys.sendMessage(src, "/disabletours: Stops tours being run in the channel.", channel);
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
            }
            if (module.tournaments[channel]) {
                sys.sendMessage(src, "*** Channel Tournaments commands ***", channel);
                sys.sendMessage(src, "/join: Enters you to in a tournament.", channel);
				sys.sendMessage(src, "/unjoin: Withdraws you from a tournament.", channel);
				sys.sendMessage(src, "/viewround: Shows the current pairings for the round.", channel);
				sys.sendMessage(src, "/viewqueue: Shows the current queue", channel);
				sys.sendMessage(src, "/touralerts [on/off]: Turn on/off your tour alerts (Shows list of Tour Alerts if on/off isn't specified)", channel);
				sys.sendMessage(src, "/addtouralert: Adds a tour alert for the specified tier", channel);
				sys.sendMessage(src, "/removetouralert: Removes a tour alert for the specified tier", channel);
                if (poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
                    sys.sendMessage(src, "*** Channel Tournaments Admin commands ***", channel);
                    sys.sendMessage(src, "/tour: Starts a tournament in set tier for the selected number of players. Format is /tour tier:number:type. Type is optional and can be set to Singles, Doubles or Triples.", channel);
                    sys.sendMessage(src, "/queue: Schedules a tournament to automatically start after the current one. Format is /queue tier:number:type.", channel);
                    sys.sendMessage(src, "/endtour: Ends the current tournament.", channel);
                    sys.sendMessage(src, "/dq: Disqualifies someone in the tournament.", channel);
                    sys.sendMessage(src, "/push: Adds a user to the tournament.", channel);
                    sys.sendMessage(src, "/changecount: Changes the number of entrants during the signup phase.", channel);
                    sys.sendMessage(src, "/sub: Replaces the first user with another in the tournament. Format /sub user1:user2", channel);
                    sys.sendMessage(src, "/cancelBattle: Allows the user or their opponent to forfeit without leaving the tournament their current battle so they can battle again with correct clauses.", channel);
                    sys.sendMessage(src, "/rmqueue: Removes a specified tier from the tournament queue.", channel);
                }
            }
        }
    };