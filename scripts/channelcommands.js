exports.handleCommand = function(src, command, commandData, tar) {
    var poChannel = SESSION.channels(channel);
    if (poChannel.operators === undefined)
        poChannel.operators = [];
    if (command == "lt" || command == "lovetap") {
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Choose a valid target for your love!");
            return;
        }
        var colour = this.getColor(src);
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
        this.meon(src, sys.channel(channel));
        return;
    }
    if (command == "cmeoff") {
        if (channel === 0 || channel == tourchannel) {
            normalbot.sendChanMessage(src, "/me can't be turned off here.");
            return;
        }
        this.meoff(src, sys.channel(channel));
        return;
    }
    if (command == "csilence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        this.silence(src, commandData, sys.channel(channel));
        return;
    }
    if (command == "csilenceoff") {
        this.silenceoff(src, sys.channel(channel));
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
exports.help = 
    [
        "/register: To register the current channel you're on.",
        "/topic [topic]: Sets the topic of a channel. Only works if you're the first to log on a channel or have auth there. Displays current topic instead if no new one is given.",
        "/lt [name]: Kick someone from current channel.",
        "/member [name]: Makes the user a member.",
        "/demember [name]: Removes membership from a user.",
        "/csilence [minutes]: Prevents authless users from talking in current channel specified time.",
        "/csilenceoff: Allows users to talk in current channel.",
        "/cmute [name]:[reason]:[time]: Mutes someone in current channel (reason and time optional).",
        "/cunmute [name]: Unmutes someone in current channel.",
        "/cmutes: Lists users muted in current channel.",
        "/cbans: Lists users banned from current channel.",
        "*** Only channel admins may use the following commands ***",
        "/op [name]: Gives a user channel operator status.",
        "/deop [name]: Removes channel operator status from a user.",
        "/inviteonly [on/off/level]: Makes a channel invite-only or public.",
        "/ctogglecaps: Turns on/off the server anti-caps bot in current channel.",
        "/ctoggleflood: Turns on/off the server anti-flood bot in current channel. Overactive still in effect.",
        "/ctoggleswear: Turns on/off the use of some common swear words.",
        "/cban [name]:[reason]:[time]: Bans someone from current channel (reason and time optional).",
        "/cunban [name]: Unbans someone from current channel.",
        "/enabletours: Allows tours to be run in the channel.",
        "/disabletours: Stops tours being run in the channel.",
        "*** Only channel owners may use the following commands ***",
        "/admin [name]: Gives a user channel admin status.",
        "/deadmin [name]: Removes channel admin status from a user.",
        "/owner [name]: Gives a user channel owner status.",
        "/deowner [name]: Removes channel owner status from a user."
    ];