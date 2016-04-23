/* POChannel */
function POChannel(id)
{
    this.id = id;
    this.masters = []; // can add admins
    this.admins = []; // can ban, add mods, change invite level
    this.operators = []; // can mute, silence, kick
    this.members = []; // people that can join
    this.perm = false;
    this.inviteonly = 0;
    this.topic = "";
    this.topicSetter = "";
    this.muteall = undefined;
    this.meoff = undefined;
    this.muted = {};
    this.banned = {};
    this.ignorecaps = false;
    this.ignoreflood = false;
    this.allowSwear = true;
    this.rules = [];
}

POChannel.prototype.beforeMessage = function(src, msg) {
};

POChannel.prototype.toString = function() {
    return "[object POChannel]";
};

POChannel.prototype.setTopic = function(src, topicInfo)
{
    var canSetTopic = (sys.auth(src) > 0 || this.isChannelOperator(src));
    if (topicInfo === undefined) {
        if (typeof this.topic != 'undefined') {
            channelbot.sendMessage(src, "Topic for this channel is: " + this.topic, this.id);
            if (SESSION.channels(this.id).topicSetter) {
                channelbot.sendMessage(src, "Topic was set by " + nonFlashing(this.topicSetter) + (SESSION.channels(this.id).topicDate ? " ("+SESSION.channels(this.id).topicDate+")" : ""), this.id);
            }
        } else {
            channelbot.sendMessage(src, "No topic set for this channel.", this.id);
        }
        if (canSetTopic) {
            channelbot.sendMessage(src, "Specify a topic to set one!", this.id);
        }
        return;
    }
    if (!canSetTopic) {
        channelbot.sendMessage(src, "You don't have the rights to set topic", this.id);
        return;
    }
    this.changeParameter(src, "topic", topicInfo);
    SESSION.global().channelManager.update(this.id);
    channelbot.sendAll("" + sys.name(src) + " changed the topic to: " + topicInfo, this.id);
};

POChannel.prototype.isChannelOwner = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if (sys.auth(id) >= 3 || isSuperAdmin(id)) {
        return true;
    }
    if (typeof this.masters != "object") {
        this.masters = [];
    }
    if (this.masters.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};
POChannel.prototype.isChannelAdmin = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if (sys.auth(id) >= 2 || this.isChannelOwner(id)) {
        return true;
    }
    if (typeof this.admins != "object") {
        this.admins = [];
    }
    if (this.admins.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};
POChannel.prototype.isChannelOperator = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if ((sys.auth(id) >= 1 && script.isPOChannel(this.id)) || this.isChannelAdmin(id)) {
        return true;
    }
    if (typeof this.operators != "object") {
        this.operators = [];
    }
    if (this.operators.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};
POChannel.prototype.isChannelMember = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if ((sys.auth(id) >= 1 && this.id === 0) || this.isChannelOperator(id) || this.isChannelAdmin(id) || this.isChannelOwner(id)) {
        return true;
    }
    if (typeof this.members != "object") {
        this.members = [];
    }
    if (this.members.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};

POChannel.prototype.addRole = function(src, tar, group, data)
{
    var name = tar.toLowerCase();
    var auth = typeof src == "string" ? src : sys.name(src);
    if (sys.dbIp(tar) === undefined) {
        return ["self", "The user '"+tar.toCorrectCase()+"' doesn't exist!"];
    }
    if (!sys.dbRegistered(tar) && ["owner", "admin", "mod"].indexOf(group) != -1) {
        return ["self", "The user '"+tar.toCorrectCase()+"' is not registered so you can't give them channel authority!"];
    }
    if (typeof this.operators != 'object')
        this.operators = [];
    if (typeof this.admins != 'object')
        this.admins = [];
    if (typeof this.masters != 'object')
        this.masters = [];
    if (typeof this.members != 'object')
        this.members = [];
    if (group == "owner") {
        if (this.masters.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel owner!"];
        }
        if (this.masters.length > 10) {
            return ["self", "There is a limit of 10 owners!"];
        }
        this.masters.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel owner!"];
    }
    if (group == "admin") {
        if (this.admins.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel admin!"];
        }
        if (this.admins.length > 50) {
            return ["self", "There is a limit of 50 admins!"];
        }
        this.admins.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel admin!"];
    }
    if (group == "mod") {
        if (this.operators.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel mod!"];
        }
        if (this.operators.length > 100) {
            return ["self", "There is a limit of 100 mods!"];
        }
        this.operators.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel mod!"];
    }
    if (group == "member") {
        if (this.members.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a member!"];
        }
        if (this.members.length > 250) {
            return ["self", "There is a limit of 250 members!"];
        }
        this.members.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a member!"];
    }
    if (group == "muted") {
        if (this.isPunished(name) === "banned") {
            return ["self", tar.toCorrectCase()+" is already banned from this channel!"];
        }
        if (!this.hasPermission(src, tar)) {
            return ["self", tar.toCorrectCase()+" has equal or higher auth than you, so you can't channel mute them!"];
        }
        if (script.isOfficialChan(this.id) && !this.isChannelOwner(src)) {
            var maxtime = this.isChannelAdmin(src) ? 7*24*60*60 : 24*60*60;
            if (data.time > maxtime || data.time === 0) {
                data.time = maxtime;
            }
            if (data.reason === "") {
                return ["self", "You need to provide a reason for the channel mute!"];
            }
        }
        var already = (this.isPunished(name) === "muted");
        this.muted[name] = {"expiry": data.time === 0 ? "never" : parseInt(sys.time(),10) + data.time, "issuetime": parseInt(sys.time(),10), "auth": auth, "reason": data.reason !== "" ? data.reason : "N/A" };
        var timestring = data.time > 0 ? getTimeString(data.time) : "";
        if (!already) {
            return ["all", auth + " muted " + tar.toCorrectCase() + (timestring === "" ? " permanently" : " for " + timestring) + " in this channel!" + (data.reason !== "" ? " [Reason: " + data.reason + "]" : "")];
        }
        else {
            return ["all", tar.toCorrectCase() + "'s mute time in this channel was changed to " + (timestring === "" ? "forever" : timestring) + " by " + auth + "!" + (data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
        }
    }
    if (group == "banned") {
        if (!this.hasPermission(src, tar)) {
            return ["self", tar.toCorrectCase()+" has equal or higher auth than you, so you can't channel ban them!"];
        }
        if (script.isOfficialChan(this.id) && !this.isChannelOwner(src)) {
            if (data.time > 7*24*60*60 || data.time === 0) {
                data.time = 7*24*60*60;
            }
            if (data.reason === "") {
                return ["self", "You need to provide a reason for the channel ban!"];
            }
        }
        var already = (this.isPunished(name) === "banned");
        this.banned[name] = {"expiry": data.time === 0 ? "never" : parseInt(sys.time(),10) + data.time, "issuetime": parseInt(sys.time(),10), "auth": auth, "reason": data.reason !== "" ? data.reason : "N/A" };
        var timestring = data.time > 0 ? getTimeString(data.time) : "";
        if (!already) {
            return ["all", auth + " banned " + tar.toCorrectCase() + (timestring === "" ? " permanently" : " for " + timestring) + " from this channel!" + (data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
        }
        else {
            return ["all", tar.toCorrectCase() + "'s ban time from this channel was changed to " + (timestring === "" ? "forever" : timestring) + " by " + auth + "!" + (data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
        }
    }
    return ["self", ""];
};



POChannel.prototype.removeRole = function(src, tar, group)
{
    var name = tar.toLowerCase();
    if (typeof this.operators != 'object')
        this.operators = [];
    if (typeof this.admins != 'object')
        this.admins = [];
    if (typeof this.masters != 'object')
        this.masters = [];
    if (typeof this.members != 'object')
        this.members = [];
    if (group == "owner") {
        if (this.masters.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel owner!"];
        }
        var index = this.masters.indexOf(name);
        this.masters.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel owner list!"];
    }
    if (group == "admin") {
        if (this.admins.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel admin!"];
        }
        var index = this.admins.indexOf(name);
        this.admins.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel admin list!"];
    }
    if (group == "mod") {
        if (this.operators.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel mod!"];
        }
        var index = this.operators.indexOf(name);
        this.operators.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel mod list!"];
    }
    if (group == "member") {
        if (this.members.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a member!"];
        }
        var index = this.members.indexOf(name);
        this.members.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel member list!"];
    }
    if (group == "muted") {
        if (!this.muted.hasOwnProperty(name)) {
            return ["self", tar.toCorrectCase()+" is not muted in this channel!"];
        }
        delete this.muted[name];
        return ["all", sys.name(src)+" unmuted "+tar.toCorrectCase()+" in this channel!"];
    }
    if (group == "banned") {
        if (!this.banned.hasOwnProperty(name)) {
            return ["self", tar.toCorrectCase()+" is not banned from this channel!"];
        }
        delete this.banned[name];
        return ["all", sys.name(src)+" unbanned "+tar.toCorrectCase()+" from this channel!"];
    }
    return ["self", ""];
};

POChannel.prototype.issueAuth = function(src, name, group)
{
    var ret = this.addRole(src, name, group, {});
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], this.id);
    }
    else {
        channelbot.sendAll(ret[1], this.id);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.takeAuth = function(src, name, group)
{
    var ret = this.removeRole(src, name, group);
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], this.id);
    }
    else {
        channelbot.sendAll(ret[1], this.id);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.register = function(name)
{
    if (this.masters.length === 0) {
        this.masters.push(name.toLowerCase());
        SESSION.global().channelManager.update(this.id);
        return true;
    }
    return false;
};

POChannel.prototype.canJoin = function(id)
{
    if (this.isBanned(id)) {
        return "banned";
    }
    if (this.isChannelOperator(id)) {
        return "allowed";
    }
    if (typeof this.members != "object") {
        this.members = [];
    }
    if (this.members.indexOf(sys.name(id).toLowerCase()) > -1) {
        return "allowed";
    }
    return "nil";
};

POChannel.prototype.canTalk = function(id)
{
    return !this.isMuted(id);
};

POChannel.prototype.ban = function(src, tar, data)
{
    var ret = this.addRole(src, tar, "banned", data);
    if (ret[0] == "self") {
        if (typeof src == "number")
            channelbot.sendMessage(src, ret[1], this.id);
    }
    else {
        channelbot.sendAll(ret[1], this.id);
        SESSION.global().channelManager.update(this.id);
        // eject the offending user from the channel
        if (sys.id(tar) !== undefined) {
            if (sys.isInChannel(sys.id(tar), this.id)) {
                if (sys.channelsOfPlayer(sys.id(tar)).length <= 1 && !sys.isInChannel(sys.id(tar), 0)) {
                    sys.putInChannel(sys.id(tar), 0);
                }
                sys.kick(sys.id(tar), this.id);
                channelbot.sendAll("And "+tar+" was gone!", this.id);
            }
        }
    }
};

POChannel.prototype.unban = function(src, tar)
{
    var ret = this.removeRole(src, tar, "banned");
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], this.id);
    }
    else {
        channelbot.sendAll(ret[1], this.id);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.mute = function(src, tar, data, smuted)
{
    var ret = this.addRole(src, tar, "muted", data);
    if (ret[0] == "self") {
        if (typeof src == "number")
            channelbot.sendMessage(src, ret[1], this.id);
    }
    else {
        if (smuted) {
            channelbot.sendMessage(src, ret[1], this.id);
        } else {
            channelbot.sendAll(ret[1], this.id);
        }
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.unmute = function(src, tar)
{
    var ret = this.removeRole(src, tar, "muted");
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], this.id);
    }
    else {
        channelbot.sendAll(ret[1], this.id);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.isBanned = function(id)
{
    // can't ban chan admins+
    if (this.isChannelAdmin(id)) {
        return false;
    }
    var banlist = this.banned;
    var ip = sys.ip(id);
    var name = sys.name(id);
    for (var x in banlist) {
        if(banlist.hasOwnProperty(x)) {
            if (!banlist[x].hasOwnProperty("expiry")) {
                delete this.banned[x];
                continue;
            }
            if (banlist[x].expiry <= parseInt(sys.time(),10)) {
                delete this.banned[x];
                continue;
            }
            if (script.cmp(x, name)) {
                return true;
            }
            if (sys.dbIp(x) == ip) {
                return true;
            }
        }
    }
    return false;
};

POChannel.prototype.isMuted = function(id)
{
    if (this.isChannelOperator(id)) {
        return false;
    }
    var mutelist = this.muted;
    var ip = sys.ip(id);
    var name = sys.name(id);
    for (var x in mutelist) {
        if (mutelist.hasOwnProperty(x)) {
            if (!mutelist[x].hasOwnProperty("expiry")) {
                delete this.muted[x];
                continue;   
            }
            if (mutelist[x].expiry <= parseInt(sys.time(),10)) {
                delete this.muted[x];
                channelbot.sendAll(x+"'s channel mute expired.", this.id);
                SESSION.global().channelManager.update(this.id);
                continue;
            }
            if (script.cmp(x, name)) {
                return true;
            }
            if (sys.dbIp(x) == ip) {
                return true;
            }
        }
    }
    return false;
};

POChannel.prototype.isPunished = function(name)
{
    var banlist = this.banned;
    for (var b in banlist) {
        if (banlist.hasOwnProperty(b)) {
            if (script.cmp(b, name)) {
                return "banned";
            }
            if (sys.dbIp(b) == sys.dbIp(name)) {
                return "banned";
            }
        }
    }
    var mutelist = this.muted;
    for (var m in mutelist) {
        if (mutelist.hasOwnProperty(m)) {
            if (script.cmp(m, name)) {
                return "muted";
            }
            if (sys.dbIp(m) == sys.dbIp(name)) {
                return "muted";
            }
        }
    }
    return "none";
};

POChannel.prototype.hasPermission = function(src, tar) {
    var srcauth = 0;
    if (typeof src == "string") {
        srcauth = 1;
    }
    else {
        if (this.isChannelOwner(src)) {
            srcauth = 3;
        }
        else if (this.isChannelAdmin(src)) {
            srcauth = 2;
        }
        else if (this.isChannelOperator(src)) {
            srcauth = 1;
        }
    }
    var tarauth = this.chanAuth(tar);
    return srcauth > tarauth;
};

POChannel.prototype.chanAuth = function(name) {
    var maxauth = 0;
    if (sys.dbAuth(name) >= 2 || this.id === 0) {
        maxauth = sys.dbAuth(name);
    }
    var lname = name.toLowerCase();
    if (typeof this.operators != 'object')
        this.operators = [];
    if (typeof this.admins != 'object')
        this.admins = [];
    if (typeof this.masters != 'object')
        this.masters = [];
    if (this.masters.indexOf(lname) > -1) {
        maxauth = 3;
    }
    else if (this.admins.indexOf(lname) > -1 && maxauth < 2) {
        maxauth = 2;
    }
    else if (this.operators.indexOf(lname) > -1 && maxauth < 1) {
        maxauth = 1;
    }
    return maxauth;
};

POChannel.prototype.changeParameter = function(src, parameter, value) {
    if (parameter == "topic") {
        this.topic = value;
        this.topicSetter = sys.name(src);
        this.topicDate = new Date().toUTCString();
        return;
    }
    if (parameter == "allowcaps") {
        if (value) {
            this.ignorecaps = true;
        }
        else {
            this.ignorecaps = false;
        }
        SESSION.global().channelManager.update(this.id);
        return;
    }
    if (parameter == "allowflood") {
        if (value) {
            this.ignoreflood = true;
        }
        else {
            this.ignoreflood = false;
        }
        SESSION.global().channelManager.update(this.id);
        return;
    }
    if (parameter == "allowswear") {
        if (value) {
            this.allowSwear = true;
        }
        else {
            this.allowSwear = false;
        }
        SESSION.global().channelManager.update(this.id);
        return;
    }
    if (parameter == "invitelevel") {
        var level = parseInt(value, 10);
        var maxvalue = sys.auth(src) >= 3 ? 3 : sys.auth(src) + 1;
        if (level <= 0 || isNaN(level)) {
            level = 0;
        }
        else if (level > maxvalue) {
            level = maxvalue;
        }
        this.inviteonly = level;
        SESSION.global().channelManager.update(this.id);
        if (level === 0) {
            return sys.name(src)+" made this channel public.";
        }
        else {
            return sys.name(src)+" made this channel invite only for users below auth level "+level+".";
        }
    }
};

POChannel.prototype.getReadableList = function (type, os, searchData) {
    try {
        var entries = {}, name = "";
        if (type == "mutelist") {
            entries = this.muted;
            name = "Channel Muted";
        } else if (type == "banlist") {
            entries = this.banned;
            name = "Channel Banned";
        } else {
            return "";
        }
        if (os === undefined) {
            os = "windows";
        }
        var width = 5, maxMessageLength = 30000, tmp = [];
        for (var x in entries) {
                if (entries.hasOwnProperty(x)) {
                if (!entries[x].hasOwnProperty("expiry")) {
                    continue;
                }
                if (searchData !== undefined && x.toLowerCase().indexOf(searchData.toLowerCase()) === -1) {
                    continue;
                }
                var playername = utilities.html_escape(x);
                var expirytime = isNaN(entries[x].expiry) ? "never" : entries[x].expiry-parseInt(sys.time(),10);
                if (expirytime <= 0) {
                    continue;
                }
                var issuetime = getTimeString(parseInt(sys.time(),10)-entries[x].issuetime);
                var auth = utilities.html_escape(entries[x].auth);
                var reason = utilities.html_escape(entries[x].reason);
                tmp.push([playername, auth, issuetime, isNaN(entries[x].expiry) ? expirytime : getTimeString(expirytime), reason]);
            }
        }
        tmp.sort(function(a,b) { return a[2] - b[2];});
        if (os === "android") {
            if (tmp.length === 0) {
                return "";
            }
            var x, html = "<b>*** " + utilities.html_escape(name) + " ***</b><br />";
            for (x = 0; x < tmp.length; x++) {
                html += "<b>" + utilities.html_escape(tmp[x][0]) + "</b> ~ by: " + utilities.html_escape(tmp[x][1]) + " ~ issued: " + tmp[x][2] + " ~ expires in: " + tmp[x][3] + " ~ reason: " + utilities.html_escape(tmp[x][4]) + "<br />";
            }
            return html;
        } else {
            var tableHeader = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>',
                tableFooter = '</table>',
                table = tableHeader,
                line,
                sendRows = 0;
            while (tmp.length > 0) {
                line = '<tr><td>' + tmp[0].join('</td><td>') + '</td></tr>';
                tmp.splice(0, 1);
                if (table.length + line.length + tableFooter.length > maxMessageLength) {
                    if (sendRows === 0) continue;
                    table += tableFooter;
                    table = tableHeader;
                    sendRows = 0;
                }
                table += line;
                ++sendRows;
            }
            table += tableFooter;
            if (sendRows > 0) {
                return table;
            } else {
                return "";
            }
        }
    } catch (error) {
        return "";
    }
};

POChannel.prototype.addRule = function(name, description) {
    var index = this.rules.length + 1;
    if (this.rules.length >= 10) {
        return "Too many rules already, currently limited to 10";
    }
    if (name.length > 200 || description.length > 600) {
        return "Name/Description too long. Limit is 200 characters for name and 600 for description";
    }
    this.rules.push(index + ":::::" + name.replace(/:::::/g, ":") + ":::::" + description.replace(/:::::/g, ":")); //preventing silly things happening
    SESSION.global().channelManager.update(this.id);
};

POChannel.prototype.removeRule = function(index) {
    if (!(index-1 in this.rules)) {
        return "Not a rule";
    }
    this.rules.splice(index - 1, 1);
    for (var x = 0; x < this.rules.length; x++) {
        var rules = this.rules[x].split(":::::");
        if (parseInt(rules[0], 10) > parseInt(index)) {
            rules[0] -= 1;
            this.rules[x] = rules.join(":::::");
        }
    }
    SESSION.global().channelManager.update(this.id);
};
POChannel.prototype.editRule = function(index, name, description) {
    if (!(index-1 in this.rules)) {
        return "Not a rule";
    }
    if (name.length > 200 || description.length > 600) {
        return "Name/Description too long. Limit is 200 characters for name and 600 for description";
    }
    this.rules[index-1] = index + ":::::" + name.replace(/:::::/g, ":") + ":::::" + description.replace(/:::::/g, ":");
    SESSION.global().channelManager.update(this.id);
};

POChannel.prototype.getRules = function() {
    var output = [];
    for (var x = 0; x < this.rules.length; x++) {
        var rule = this.rules[x].split(":::::");
        output.push(rule[0] + ". " + rule[1] + ": \n"+ rule[2]);
    }
    return output;
};

exports.POChannel = POChannel;