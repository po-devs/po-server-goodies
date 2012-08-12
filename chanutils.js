/* Channel functions */

var utilities = require('utilities.js');

function cmp(x1, x2) {
    if (typeof x1 !== typeof x2) {
        return false;
    }
    else if (typeof x1 === "string") {
        if (x1.toLowerCase() === x2.toLowerCase()) {
            return true;
        }
    }
    else if (x1 === x2) {
        return true;
    }
    else return false;
}

String.prototype.toCorrectCase = function() {
    if (isNaN(this) && sys.id(this) !== undefined) {
        return sys.name(sys.id(this));
    }
    else {
        return this;
    }
}

function isChannelOwner(playerId, chanId) {
    if (!sys.dbRegistered(sys.name(playerId))) {
        return false;
    }
    if (sys.auth(playerId) >= 3) {
        return true;
    }
    if (typeof SESSION.channels(chanId).masters != "object") {
        SESSION.channels(chanId).masters = [];
    }
    if (SESSION.channels(chanId).masters.indexOf(sys.name(playerId).toLowerCase()) > -1) {
        return true;
    }
    return false;
}

function isChannelAdmin(playerId, chanId) {
    if (!sys.dbRegistered(sys.name(playerId))) {
        return false;
    }
    if (sys.auth(playerId) >= 2 || isChannelOwner(playerId, chanId)) {
        return true;
    }
    if (typeof SESSION.channels(chanId).admins != "object") {
        SESSION.channels(chanId).admins = [];
    }
    if (SESSION.channels(chanId).admins.indexOf(sys.name(playerId).toLowerCase()) > -1) {
        return true;
    }
    return false;
}

function isChannelMod(playerId, chanId) {
    if (!sys.dbRegistered(sys.name(playerId))) {
        return false;
    }
    if ((sys.auth(playerId) >= 1 && chanId === 0) || isChannelAdmin(playerId, chanId)) {
        return true;
    }
    if (typeof SESSION.channels(chanId).operators != "object") {
        SESSION.channels(chanId).operators = [];
    }
    if (SESSION.channels(chanId).operators.indexOf(sys.name(playerId).toLowerCase()) > -1) {
        return true;
    }
    return false;
}

function canJoin(playerId, chanId) {
    // can't ban from main channel
    if (chanId === 0) {
        return "allowed";
    }
    if (isChannelBanned(playerId, chanId)) {
        return "banned";
    }
    if (isChannelMod(playerId, chanId)) {
        return "allowed";
    }
    if (typeof SESSION.channels(chanId).members != "object") {
        SESSION.channels(chanId).members = [];
    }
    if (SESSION.channels(chanId).members.indexOf(sys.name(playerId).toLowerCase()) > -1) {
        return "allowed";
    }
    return "nil";
}

function canSpeak(playerId, chanId) {
    if (isChannelMuted(playerId, chanId)) {
        return false;
    }
    return true;
}

function isChannelBanned(playerId, chanId) {
    // can't ban owners
    if (isChannelOwner(playerId, chanId)) {
        return false;
    }
    var banlist = getChannelBanList(chanId);
    var ip = sys.ip(playerId);
    var name = sys.name(playerId);
    for (var x in banlist) {
        if (!banlist[x].hasOwnProperty("expiry")) {
            delete SESSION.channels(chanId).banned[x];
            continue;
        }
        if (banlist[x].expiry <= parseInt(sys.time())) {
            delete SESSION.channels(chanId).banned[x];
            continue;
        }
        if (cmp(x, name)) {
            return true;
        }
        if (sys.dbIp(x) == ip) {
            return true;
        }
    }
    return false;
}

function isChannelMuted(playerId, chanId) {
    if (isChannelMod(playerId, chanId)) {
        return false;
    }
    var mutelist = getChannelMuteList(chanId);
    var ip = sys.ip(playerId);
    var name = sys.name(playerId);
    for (var x in mutelist) {
        if (!mutelist[x].hasOwnProperty("expiry")) {
            delete SESSION.channels(chanId).muted[x];
            continue;
        }
        if (mutelist[x].expiry <= parseInt(sys.time())) {
            delete SESSION.channels(chanId).muted[x];
            continue;
        }
        if (cmp(x, name)) {
            return true;
        }
        if (sys.dbIp(x) == ip) {
            return true;
        }
    }
    return false;
}

function isPunished(name, chanId) {
    var banlist = getChannelBanList(chanId);
    for (var b in banlist) {
        if (cmp(b, name)) {
            return "banned";
        }
        if (sys.dbIp(b) == sys.dbIp(name)) {
            return "banned";
        }
    }
    var mutelist = getChannelMuteList(chanId);
    for (var m in mutelist) {
        if (cmp(m, name)) {
            return "muted";
        }
        if (sys.dbIp(m) == sys.dbIp(name)) {
            return "muted";
        }
    }
    return "none";
}

function getChannelBanList(chanId) {
    try {
        var banlist = SESSION.channels(chanId).banned;
        return banlist;
    }
    catch (e) {
        return {};
    }
}

function getChannelMuteList(chanId) {
    try {
        var mutelist = SESSION.channels(chanId).muted;
        return mutelist;
    }
    catch (e) {
        return {};
    }
}

function getReadableList(type, chanId) {
    try {
        var name = "";
        var mh = {};
        if (type == "mutelist") {
            mh = SESSION.channels(chanId).muted;
            name = "Channel Muted";
        }
        else if (type == "banlist") {
            mh = SESSION.channels(chanId).banned;
            name = "Channel Banned";
        }
        else {
            return "";
        }
        var width=4;
        var max_message_length = 30000;
        var tmp = [];
        var t = parseInt(sys.time(), 10);
        var toDelete = [];
        for (var x in mh) {
            if (!mh[x].hasOwnProperty("expiry")) {
                continue;
            }
            var playername = utilities.html_escape(x);
            var expirytime = isNaN(mh[x].expiry) ? "never" : mh[x].expiry-parseInt(sys.time());
            if (expirytime <= 0) {
                continue;
            }
            var issuetime = getTimeString(parseInt(sys.time())-mh[x].issuetime);
            var auth = utilities.html_escape(mh[x].auth);
            var reason = utilities.html_escape(mh[x].reason);
            tmp.push([playername, auth, issuetime, isNaN(mh[x].expiry) ? expirytime : getTimeString(expirytime), reason])
        }
        tmp.sort(function(a,b) { return a[2] - b[2];});

        // generate HTML
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
        var table_footer = '</table>';
        var table = table_header;
        var line;
        var send_rows = 0;
        while(tmp.length > 0) {
            line = '<tr><td>'+tmp[0].join('</td><td>')+'</td></tr>';
            tmp.splice(0,1);
            if (table.length + line.length + table_footer.length > max_message_length) {
                if (send_rows === 0) continue; // Can't send this line!
                table += table_footer;
                sys.sendHtmlMessage(src, table, channel);
                table = table_header;
                send_rows = 0;
            }
            table += line;
            ++send_rows;
        }
        table += table_footer;
        if (send_rows > 0) {
            return table;
        }
        else {
            return "";
        }
    }
    catch (e) {
        return "";
    }
}

function changeParameter(src, parameter, value, chanId) {
    if (parameter == "topic") {
        SESSION.channels(chanId).topic = value;
        SESSION.channels(chanId).topicSetter = sys.name(src);
        return;
    }
    if (parameter == "allowcaps") {
        if (value === true) {
            SESSION.channels(chanId).ignorecaps = true;
        }
        else {
            SESSION.channels(chanId).ignorecaps = false;
        }
        return;
    }
    if (parameter == "allowflood") {
        if (value === true) {
            SESSION.channels(chanId).ignoreflood = true;
        }
        else {
            SESSION.channels(chanId).ignoreflood = false;
        }
        return;
    }
    if (parameter == "invitelevel") {
        var level = parseInt(value);
        var maxvalue = sys.auth(src) >= 3 ? 3 : sys.auth(src) + 1;
        if (level <= 0 || isNaN(level)) {
            level = 0;
        }
        else if (level > maxvalue) {
            level = maxvalue;
        }
        SESSION.channels(chanId).inviteonly = level;
        if (level === 0) {
            return sys.name(src)+" made this channel public.";
        }
        else {
            return sys.name(src)+" made this channel invite only for users below auth level "+level+".";
        }
    }
}

function addGroup(src, tar, group, chanId, data) {
    var name = tar.toLowerCase();
    var poChannel = SESSION.channels(chanId);
    var auth = typeof src == "string" ? src : sys.name(src);
    if (sys.dbIp(tar) === undefined) {
        return ["self", "The user '"+tar.toCorrectCase()+"' doesn't exist!"];
    }
    if (!sys.dbRegistered(tar) && ["owner", "admin", "mod"].indexOf(group) != -1) {
        return ["self", "The user '"+tar.toCorrectCase()+"' is not registered so you can't give them channel authority!"];
    }
    if (typeof SESSION.channels(chanId).operators != 'object')
        SESSION.channels(chanId).operators = [];
    if (typeof SESSION.channels(chanId).admins != 'object')
        SESSION.channels(chanId).admins = [];
    if (typeof SESSION.channels(chanId).masters != 'object')
        SESSION.channels(chanId).masters = [];
    if (typeof SESSION.channels(chanId).members != 'object')
        SESSION.channels(chanId).members = [];
    if (group == "owner") {
        if (poChannel.masters.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel owner!"];
        }
        if (poChannel.masters.length > 10) {
            return ["self", "There is a limit of 10 owners!"];
        }
        poChannel.masters.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel owner!"];
    }
    if (group == "admin") {
        if (poChannel.admins.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel admin!"];
        }
        if (poChannel.admins.length > 50) {
            return ["self", "There is a limit of 50 admins!"];
        }
        poChannel.admins.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel admin!"];
    }
    if (group == "mod") {
        if (poChannel.operators.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel mod!"];
        }
        if (poChannel.operators.length > 100) {
            return ["self", "There is a limit of 100 mods!"];
        }
        poChannel.operators.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel mod!"];
    }
    if (group == "member") {
        if (poChannel.members.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a member!"];
        }
        if (poChannel.members.length > 250) {
            return ["self", "There is a limit of 250 members!"];
        }
        poChannel.members.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a member!"];
    }
    if (group == "muted") {
        if (isPunished(name, chanId) !== "none") {
            return ["self", tar.toCorrectCase()+" is already "+isPunished(name, chanId)+" from this channel!"];
        }
        if (!hasPermission(src, tar, chanId)) {
            return ["self", tar.toCorrectCase()+" has equal or higher auth than you, so you can't channel mute them!"];
        }
        poChannel.muted[name] = {"expiry": data.time === 0 ? "never" : parseInt(sys.time()) + data.time, "issuetime": parseInt(sys.time()), "auth": auth, "reason": data.reason !== "" ? data.reason : "N/A" };
        var timestring = data.time > 0 ? " for "+getTimeString(data.time) : " permanently";
        return ["all", auth+" muted "+tar.toCorrectCase()+timestring+" in this channel!"+(data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
    }
    if (group == "banned") {
        if (isPunished(name, chanId) === "banned") {
            return ["self", tar.toCorrectCase()+" is already banned from this channel!"];
        }
        if (!hasPermission(src, tar, chanId)) {
            return ["self", tar.toCorrectCase()+" has equal or higher auth than you, so you can't channel ban them!"];
        }
        poChannel.banned[name] = {"expiry": data.time === 0 ? "never" : parseInt(sys.time()) + data.time, "issuetime": parseInt(sys.time()), "auth": auth, "reason": data.reason !== "" ? data.reason : "N/A" };
        var timestring = data.time > 0 ? " for "+getTimeString(data.time) : " permanently";
        return ["all", auth+" banned "+tar.toCorrectCase()+timestring+" from this channel!"+(data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
    }
}

function removeGroup(src, tar, group, chanId) {
    var name = tar.toLowerCase();
    var poChannel = SESSION.channels(chanId);
    if (typeof SESSION.channels(chanId).operators != 'object')
        SESSION.channels(chanId).operators = [];
    if (typeof SESSION.channels(chanId).admins != 'object')
        SESSION.channels(chanId).admins = [];
    if (typeof SESSION.channels(chanId).masters != 'object')
        SESSION.channels(chanId).masters = [];
    if (typeof SESSION.channels(chanId).members != 'object')
        SESSION.channels(chanId).members = [];
    if (group == "owner") {
        if (poChannel.masters.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel owner!"];
        }
        var index = poChannel.masters.indexOf(name);
        poChannel.masters.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel owner list!"];
    }
    if (group == "admin") {
        if (poChannel.admins.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel admin!"];
        }
        var index = poChannel.admins.indexOf(name);
        poChannel.admins.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel admin list!"];
    }
    if (group == "mod") {
        if (poChannel.operators.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel mod!"];
        }
        var index = poChannel.operators.indexOf(name);
        poChannel.operators.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel mod list!"];
    }
    if (group == "member") {
        if (poChannel.members.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a member!"];
        }
        var index = poChannel.members.indexOf(name);
        poChannel.members.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel member list!"];
    }
    if (group == "muted") {
        if (!poChannel.muted.hasOwnProperty(name)) {
            return ["self", tar.toCorrectCase()+" is not muted in this channel!"];
        }
        delete poChannel.muted[name];
        return ["all", sys.name(src)+" unmuted "+tar.toCorrectCase()+" in this channel!"];
    }
    if (group == "banned") {
        if (!poChannel.banned.hasOwnProperty(name)) {
            return ["self", tar.toCorrectCase()+" is not banned from this channel!"];
        }
        delete poChannel.banned[name];
        return ["all", sys.name(src)+" unbanned "+tar.toCorrectCase()+" from this channel!"];
    }
}

// src is a player id, tar is name
function hasPermission(src, tar, chan) {
    var srcauth = 0;
    if (typeof src == "string") {
        srcauth = 1;
    }
    else {
        if (isChannelOwner(src, chan)) {
            srcauth = 3;
        }
        else if (isChannelAdmin(src, chan)) {
            srcauth = 2;
        }
        else if (isChannelMod(src, chan)) {
            srcauth = 1;
        }
    }
    var tarauth = chanMaxAuth(sys.dbIp(tar), chan);
    return srcauth > tarauth;
}

function chanMaxAuth(ip, chan) {
    var maxauth = 0;
    if (sys.maxAuth(ip) >= 2 || chan === 0) {
        maxauth = sys.maxAuth(ip);
    }
    var aliases = sys.aliases(ip);
    if (typeof SESSION.channels(chanId).operators != 'object')
        SESSION.channels(chanId).operators = [];
    if (typeof SESSION.channels(chanId).admins != 'object')
        SESSION.channels(chanId).admins = [];
    if (typeof SESSION.channels(chanId).masters != 'object')
        SESSION.channels(chanId).masters = [];
    for (var x in aliases) {
        if (SESSION.channels(chan).masters.indexOf(aliases[x]) > -1) {
            maxauth = 3;
        }
        else if (SESSION.channels(chan).admins.indexOf(aliases[x]) > -1 && maxauth < 2) {
            maxauth = 2;
        }
        else if (SESSION.channels(chan).operators.indexOf(aliases[x]) > -1 && maxauth < 1) {
            maxauth = 1;
        }
        if (maxauth >= 3) break;
    }
    return maxauth;
}

exports = {
    canSpeak: function(src, chan) {
        return canSpeak(src, chan);
    },
    addGroup: function(src, tar, group, chanId, data) {
        return addGroup(src, tar, group, chanId, data);
    },
    removeGroup: function(src, tar, group, chanId, data) {
        return removeGroup(src, tar, group, chanId, data);
    },
    getList: function(type, chanId) {
        return getReadableList(type, chanId);
    },
    changeParameter: function(src, parameter, value, chanId) {
        return changeParameter(src, parameter, value, chanId);
    },
    isChanOwner: function(src, chan) {
        return isChannelOwner(src, chan);
    },
    isChanAdmin: function(src, chan) {
        return isChannelAdmin(src, chan);
    },
    isChanMod: function(src, chan) {
        return isChannelMod(src, chan);
    },
    canJoin: function(src, chan) {
        return canJoin(src, chan);
    },
    getReadableList: function(type, chanId) {
        return getReadableList(type, chanId);
    }
}
