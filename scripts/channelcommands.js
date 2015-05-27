exports.handleCommand = function(src, command, commandData, tar, channel) {
    var poChannel = SESSION.channels(channel);
    if (poChannel.operators === undefined)
        poChannel.operators = [];
    if (command == "crules" || command == "channelrules") { 
        var rules = poChannel.getRules();
        if (rules.length === 0) {
            channelbot.sendMessage(src, "No rules defined for this channel, server rules may apply", channel);
            return;
        }
        sys.sendMessage(src, "*** " + sys.channel(channel) + " channel rules ***", channel);
        for (var x = 0; x < rules.length; x++) {
            rule = rules[x].split("\n");
            sys.sendMessage(src, rule[0], channel);
            sys.sendMessage(src, rule[1], channel);
         }
         return;
    }
    if (command == "passcauth") {
        if (!commandData) {
            channelbot.sendMessage(src, "Use /passcauth [name]", channel);
            return;
        }
        var oldname = sys.name(src).toLowerCase();
        var action = commandData.split("*"); //useless, but doesn't break comptability, can still use /passcauth name*position but position just won't do anything
        var newname = action[0].toLowerCase();
        if (sys.id(newname) === undefined) {
            channelbot.sendMessage(src, "Your target is offline", channel);
            return;
        }
        if (!sys.dbRegistered(newname)) {
            channelbot.sendMessage(src, "That account isn't registered so you can't give it channel authority!", channel);
            return;
        }
        if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
            channelbot.sendMessage(src, "Both accounts must be on the same IP to switch!", channel);
            return;
        }
        if (poChannel.isChannelOwner(src)) {
            if (poChannel.masters.indexOf(newname) > -1) {
                channelbot.sendMessage(src, newname + " is already a Channel Owner!", channel);
                return;
            }
            poChannel.masters.splice(poChannel.masters.indexOf(oldname),1);
            poChannel.masters.push(newname);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Owner to " + newname + "!", channel);
            return;
        }
        if (poChannel.isChannelAdmin(src)) {
            if (poChannel.admins.indexOf(newname) > -1) {
                channelbot.sendMessage(src, newname + " is already a Channel Admin!", channel);
                return;
            }
            poChannel.admins.splice(poChannel.admins.indexOf(oldname),1);
            poChannel.admins.push(newname);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Admin to " + newname + "!", channel);
            return;
        }
        if (poChannel.isChannelOperator(src)) {
            if (poChannel.operators.indexOf(newname) > -1) {
                channelbot.sendMessage(src, newname + " is already a Channel Mod!", channel);
                return;
            }
            poChannel.operators.splice(poChannel.operators.indexOf(oldname),1);
            poChannel.operators.push(newname);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Mod to " + newname + "!", channel);
            return;
        }
        if (poChannel.isChannelMember(src)) {
            if (poChannel.members.indexOf(newname) > -1) {
                channelbot.sendMessage(src, newname + " is already a Channel Member!", channel);
                return;
            }
            poChannel.members.splice(poChannel.members.indexOf(oldname),1);
            poChannel.members.push(newname);
            channelbot.sendAll(sys.name(src) + " transferred their Channel Membership to " + newname + "!", channel);
            return;
        }
        channelbot.sendMessage(src, "You don't have sufficient channel auth to pass that position.", channel);
        return;
    }
    
    if (!poChannel.isChannelOperator(src)) {
        return "no command";
    }
    
    if (command == "lt" || command == "lovetap") {
        if (tar === undefined) {
            normalbot.sendMessage(src, "Choose a valid target for your love!", channel);
            return;
        }
        var colour = script.getColor(src);
        sendChanHtmlAll("<font color='"+colour+"'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> love taps " + commandData + ".</font>", channel);
        sys.kick(tar, channel);
        return;
    }
    if (command == "ck" || command == "chankick") {
        if (tar === undefined || !sys.isInChannel(tar, channel)) {
            normalbot.sendMessage(src, "Choose a valid target to kick", channel);
            return;
        }
        normalbot.sendAll(sys.name(src) + " kicked "+commandData+" from the channel!", channel);
        sys.kick(tar, channel);
        return;
    }
    if (command == "invite") {
        if (tar === undefined) {
            channelbot.sendMessage(src, "Choose a valid target for invite!", channel);
            return;
        }
        if (sys.isInChannel(tar, channel) && SESSION.channels(channel).canJoin(tar) == "allowed") {
            channelbot.sendMessage(src, "Your target already sits here!", channel);
            return;
        }
        if (SESSION.channels(channel).canJoin(tar) == "banned") {
            channelbot.sendMessage(src, "Your target is banned from this channel!", channel);
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
            channelbot.sendMessage(src, "Your target was invited.", channel);
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
                channelbot.sendAll("And "+commandData+" was gone!", channel);
            }
        }
        return;
    }
    if (command == "cmeon") {
        script.meon(src, sys.channel(channel));
        return;
    }
    if (command == "cmeoff") {
        /*if (channel === 0 || channel == tourchannel) {
            normalbot.sendMessage(src, "/me can't be turned off here.", channel);
            return;
        }*/
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
            normalbot.sendMessage(src, "This user doesn't exist.", channel);
            return;
        }
        poChannel.mute(src, tarname, {'time': time, 'reason': reason}, SESSION.users(src).smute.active);
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
            channelbot.sendMessage(src, "No one is muted on this channel.", channel);
        }
        return;
    }
    if (command == "cbans") {
        var cbanlist = poChannel.getReadableList("banlist");
        if (cbanlist !== "") {
            sys.sendHtmlMessage(src, cbanlist, channel);
        }
        else {
            channelbot.sendMessage(src, "No one is banned on this channel.", channel);
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
            channelbot.sendMessage(src,poChannel.inviteonly === 0 ? "This channel is public!" : "This channel is invite only for users below auth level "+poChannel.inviteonly, channel);
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
        normalbot.sendAll(message, channel);
        return;
    }
    if (command == "ctoggleflood") {
        poChannel.ignoreflood = !poChannel.ignoreflood;
        channelbot.sendMessage(src, "Now " + (poChannel.ignoreflood ? "" : "dis") + "allowing excessive flooding.", channel);
        return;
    }
    if (command == "ctoggleswear") {
        poChannel.allowSwear = !poChannel.allowSwear;
        channelbot.sendAll(sys.name(src) + " " + (poChannel.allowSwear ? "" : "dis") + "allowed swearing.", poChannel.id);
        return;
    }
    if (command == "ctogglecaps") {
        poChannel.ignorecaps = !poChannel.ignorecaps;
        channelbot.sendMessage(src, "Now " + (poChannel.ignorecaps ? "" : "dis") + "allowing excessive CAPS-usage.", channel);
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
            normalbot.sendMessage(src, "This user doesn't exist.", channel);
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
    if (command == "addrule") {
        commandData = commandData.split(":");
        if (commandData.length !== 2) {
            channelbot.sendMessage(src, "Use /addrule name:description", channel);
            return;
        }
        var returnVal = poChannel.addRule(commandData[0], commandData[1]);
        if (returnVal) {    
            channelbot.sendMessage(src, returnVal);
        } else {
            channelbot.sendMessage(src, "You added a rule", channel);
         }
        return;
    }
    if (command == "removerule") {
        var returnVal = poChannel.removeRule(commandData);
        if (returnVal) {    
            channelbot.sendMessage(src, returnVal, channel);
        } else {
            channelbot.sendMessage(src, "You removed a rule", channel);
        }
        return;
    }
     
    return "no command";
};
exports.help = function(src, channel) {
    var poChannel = SESSION.channels(channel);
    sys.sendMessage(src, "/cauth: Shows a list of channel auth.", channel);
    sys.sendMessage(src, "/register: To register the current channel you're on if it isn't registered already.", channel);
    sys.sendMessage(src, "/crules: To see a list of the current channels rules", channel);
    if (poChannel.isChannelMember(src) || poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
        sys.sendMessage(src, "*** Channel Member commands ***", channel);
        sys.sendMessage(src, "/passcauth [name]: Passes channel authority to a new alt. New name must be registered, online, and have the same IP as the old name. Valid positions are member, mod (or op), admin, and owner.", channel);
    }
    if (poChannel.isChannelOperator(src) || poChannel.isChannelAdmin(src) || poChannel.isChannelOwner(src)) {
        sys.sendMessage(src, "*** Channel Mod commands ***", channel);
        sys.sendMessage(src, "/topic [topic]: Sets the topic of a channel. Only works if you're the first to log on a channel or have auth there. Displays current topic instead if no new one is given.", channel);
        sys.sendMessage(src, "/topicadd [message]: Uses the topic message separator and adds your message to the end of the current channel topic.", channel);
        sys.sendMessage(src, "/removepart [number]: Removes the part in the channel topic that is identified by the number.", channel);
        sys.sendMessage(src, "/updatepart [number] [message]: Changes the part in the channel topic that is identified by the number to your message.", channel);
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
        sys.sendMessage(src, "/addrule [name]:[description]: Adds a rule to the current channel. Numbers are added automatically and there is a limit of 10 rules", channel);
        sys.sendMessage(src, "/removerule [number]: Remove a rule [number]", channel);
    }
    if (SESSION.global().permaTours.indexOf(channel) > -1) {
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
};
