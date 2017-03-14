exports.handleCommand = function (src, command, commandData, tar, channel) {
    if (command === "channelusers") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Please give me a channelname!", channel);
            return;
        }
        var chanid, isbot;
        var data = commandData.split(":");
        var filterOS = data.length === 2;
        if (data[0][0] == "~") {
            chanid = sys.channelId(data[0].substring(1));
            isbot = true;
        } else {
            chanid = sys.channelId(data[0]);
            isbot = false;
        }
        if (chanid === undefined) {
            channelbot.sendMessage(src, "Such a channel doesn't exist!", channel);
            return;
        }
        if (filterOS && !["windows", "linux", "android", "mac", "webclient"].contains(data[1].toLowerCase())) {
            channelbot.sendMessage(src, data[1] + " is not a valid OS!", channel);
            return;
        }
        var playerIDs = sys.playersOfChannel(chanid).filter(function (id) {
            if (filterOS) {
                return sys.os(id) === data[1];
            } else {
                return id;
            }
        });
        var chanName = sys.channel(chanid);
        if (!isbot) {
            var names = playerIDs.map(sys.name);
            channelbot.sendMessage(src, (filterOS ? data[1][0].toUpperCase() + data[1].slice(1).toLowerCase() + " " : "") + "Users of channel #" + chanName + " are: " + names.join(", "), channel);
        } else {
            var objectList = [];
            for (var i = 0; i < playerIDs.length; ++i) {
                objectList.push({'id': playerIDs[i], 'name': sys.name(playerIDs[i])});
            }
            var channelData = {'type': 'ChannelUsers', 'channel-id': chanid, 'channel-name': chanName, 'players': objectList};
            if (filterOS) {
                channelData["os"] = data[1];
            }
            sys.sendMessage(src, "+ChannelUsers:"+JSON.stringify(channelData), channel);
        }
        return;
    }
    if (command == "onrange") {
        var subip = commandData.replace("::ffff:", "");
        var players = sys.playerIds();
        var players_length = players.length;
        var names = [];
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if (!sys.loggedIn(current_player)) continue;
            var ip = sys.ip(current_player).replace("::ffff:", "");
            if (ip.substr(0, subip.length) == subip) {
                names.push(current_player);
            }
        }
        // Tell about what is found.
        if (names.length > 0) {
            var msgs = [];
            for (var i = 0; i < names.length; i++) {
                msgs.push(sys.name(names[i]) + " (" + sys.ip(names[i]).replace("::ffff:", "") + ")");
            }
            sys.sendMessage(src,"Players: on range " + subip + " are: " + msgs.join(", "), channel);
        } else {
            sys.sendMessage(src,"Players: Nothing interesting here!",channel);
        }
        return;
    }
    if (command == "onos") {
        commandData = commandData.toLowerCase();
        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var output = sys.playerIds().filter(function (id) {
                return sys.os(id) === commandData;
            }).map(sys.name);
            querybot.sendMessage(src, "Players on OS " + commandData + " are: " + output.join(", "), channel);
            return;
        }
        normalbot.sendMessage(src, commandData + " is not a valid OS", channel);
        return;
    }
    if (command == "onversion") {
        var lt = commandData.indexOf("<") > -1;
        commandData = parseInt(commandData.replace(/</g, ""), 10);
        if (isNaN(commandData)) {
            normalbot.sendMessage(src, commandData + " is not a valid version number", channel);
            return;
        }
        var isAndroid = commandData < 2000;
        var output;
        if (lt) {
           output = sys.playerIds().filter(function (id) {
                var ver = sys.version(id);
                //Ignore webclient (ver 1) and try to filter based on Android or PC.
                return  ver <= commandData && ver > 1 && sys.loggedIn(id) && (isAndroid ? ver < 2000 : ver >= 2000);
            }).map(sys.name); 
        } else {
            output = sys.playerIds().filter(function (id) {
                return sys.version(id) === commandData && sys.loggedIn(id);
            }).map(sys.name);
        }
        querybot.sendMessage(src, "Players on version " + commandData + (lt ? " or earlier " : "") + " are: " + output.join(", "), channel);
        return;
    }
    if (command === "tiers") {
        if (tar === undefined) {
            querybot.sendChanMessage(src,"No such user online.");
            return;
        }
        var i, count = sys.teamCount(tar), tiers = [];
        for (i = 0; i < count; ++i) {
            var ctier = sys.tier(tar, i);
            if (tiers.indexOf(ctier) == -1) {
                tiers.push(ctier);
            }
        }
        querybot.sendMessage(src,sys.name(tar) + " is in tier" + (tiers.length <= 1 ? "" : "s") + ": " + tiers.join(", "), channel);
        return;
    }
    if (command == "silence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        var minutes;
        var chanName;
        var space = commandData.indexOf(' ');
        if (space != -1) {
            minutes = commandData.substring(0,space);
            chanName = commandData.substring(space+1);
        } else {
            minutes = commandData;
            chanName = sys.channel(channel);
        }
        script.silence(src, minutes, chanName);
        return;
    }
    if (command == "silenceoff") {
        var chanName;
        if (commandData === undefined) {
            chanName = sys.channel(channel);
        } else {
            chanName = commandData;
        }
        script.silenceoff(src, chanName);
        return;
    }
    if (command === "k" || command === "sk") {
        if (!tar) {
            normalbot.sendMessage(src, "No such user.", channel);
            return;
        }
        if (!isSuperAdmin(src)) {
            if (sys.auth(tar) >= sys.auth(src) && sys.auth(src) < 3) {
                normalbot.sendMessage(src, "Let's not kick another auth and give us a bad reputation now. :)", channel);
                return;
            }
        }
        if (command === "k") {
            normalbot.sendAll(commandData + " was mysteriously kicked by " + nonFlashing(sys.name(src)) + "! [Channel: " + sys.channel(channel) + "]");
            sys.kick(tar);
        } else {
            if (sys.auth(src) > 1) {
                sys.dbAuths().map(sys.id).filter(function (authId) {
                    return authId !== undefined;
                }).forEach(function (authId) {
                    normalbot.sendMessage(authId, commandData + " was silently kicked by " + nonFlashing(sys.name(src)) + "! [Channel: " + sys.channel(channel) + "]");
                });
                sys.kick(tar);
            } else {
                normalbot.sendMessage(src, "Only admins and owners can use this.", channel);
                return;
            }
        }
        var authName = sys.name(src).toLowerCase();
        script.authStats[authName] = script.authStats[authName] || {};
        script.authStats[authName].latestKick = [commandData, parseInt(sys.time(), 10)];
        return;
    }
    if (command === "mute") {
        var tarId = sys.id(commandData.split(":")[0]);
        if (!isSuperAdmin(src)) {
            if (sys.auth(tarId) >= sys.auth(src) && sys.auth(src) < 3) {
                normalbot.sendMessage(src, "Let's not mute another auth and give us a bad reputation now. :)", channel);
                return;
            }
        }
        script.issueBan("mute", src, tar, commandData);
        return;
    }
    if (command == "bans" || command == "banlist") {
        var list=sys.banList();
        list.sort();
        var nbr_banned=5;
        var max_message_length = 30000;
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan='+nbr_banned+'><center><strong>Banned list</strong></center></td></tr><tr>';
        var table_footer = '</tr></table>';
        var table=table_header;
        var j=0;
        var line = '';
        for (var i=0; i<list.length; ++i){
            if (typeof commandData == 'undefined' || list[i].toLowerCase().indexOf(commandData.toLowerCase()) != -1){
                ++j;
                line += '<td>'+list[i]+'</td>';
                if(j == nbr_banned &&  i+1 != list.length){
                    if (table.length + line.length + table_footer.length > max_message_length) {
                        if (table.length + table_footer.length <= max_message_length)
                            sys.sendHtmlMessage(src, table + table_footer, channel);
                        table = table_header;
                    }
                    table += line + '</tr><tr>';
                    line = '';
                    j=0;
                }
            }
        }
        table += table_footer;
        sys.sendHtmlMessage(src, table.replace('</tr><tr></tr></table>', '</tr></table>'),channel);
        return;

    }
    if (command == "mutes" || command == "mutelist" || command == "smutelist" || command == "mafiabans" || command == "hangmanmutes" || command == "hangmanbans" || command === "safaribans") {
        script.banList(src, command, commandData);
        return;
    }
    if (command == "rangebans") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
           TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Range banned</strong></center></td></tr><tr><th>IP subaddress</th><th>Comment on rangeban</th><th>By</th></tr>';
           TABLE_LINE = '<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>';
           TABLE_END = '</table>';
        } else {
           TABLE_HEADER = 'Range banned: IP subaddress, Comment on rangeban';
           TABLE_LINE = ' || {0} / {1}';
           TABLE_END = '';
        }
        try {
        var table = TABLE_HEADER;
        var tmp = [];
        for (var key in script.rangebans.hash) {
            if (script.rangebans.hash.hasOwnProperty(key)) {
                var comment = script.rangebans.get(key).split(" --- ");
                tmp.push([key, comment[0], comment[1]]);
            }
        }
        tmp.sort(function(a,b) { return a[0] < b[0] ? -1 : 1; });
        for (var row = 0; row < tmp.length; ++row) {
            table += TABLE_LINE.format(tmp[row][0], tmp[row][1], tmp[row][2] ? tmp[row][2] : "");
        }
        table += TABLE_END;
        sys.sendHtmlMessage(src, table, channel);
        } catch (e) { sys.sendMessage(src, e, channel); }
        return;
    }
    if (command == "profiling") {
        sys.profileDump().split("\n").forEach(function(string) {sys.sendMessage(src, string, channel);});
        return;
    }
    if (command == "ipbans") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
           TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Ip Banned</strong></center></td></tr><tr><th>IP subaddress</th><th>Comment on ipban</th></tr>';
           TABLE_LINE = '<tr><td>{0}</td><td>{1}</td></tr>';
           TABLE_END = '</table>';
        } else {
           TABLE_HEADER = 'Ip Banned: IP subaddress, Comment on ipban';
           TABLE_LINE = ' || {0} / {1}';
           TABLE_END = '';
        }
        try {
        var table = TABLE_HEADER;
        var tmp = [];
        for (var key in script.ipbans.hash) {
            if (script.ipbans.hash.hasOwnProperty(key)) {
                tmp.push([key, script.ipbans.get(key)]);
            }
        }
        tmp.sort(function(a,b) { return a[0] < b[0] ? -1 : 1; });
        for (var row = 0; row < tmp.length; ++row) {
            table += TABLE_LINE.format(tmp[row][0], tmp[row][1]);
        }
        table += TABLE_END;
        sys.sendHtmlMessage(src, table, channel);
        } catch (e) { sys.sendMessage(src, e, channel); }
        return;
    }
    if (command == "autosmutelist") {
        sys.sendMessage(src, "*** AUTOSMUTE LIST ***", channel);
        for (var x = 0; x < autosmute.length; x++) {
            sys.sendMessage(src, autosmute[x], channel);
        }
        return;
    }
    if (command == "namebans") {
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Name banned</strong></center></td></tr>';
        for (var i = 0; i < nameBans.length; i+=5) {
            table += '<tr>';
            for (var j = 0; j < 5 && i+j < nameBans.length; ++j) {
                table += '<td>'+nameBans[i+j].toString()+'</td>';
            }
            table += '</tr>';
        }
        table += '</table>';
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "channamebans" || command == "channelnamebans") {
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Name banned</strong></center></td></tr>';
        for (var i = 0; i < script.chanNameBans.length; i+=5) {
            table += '<tr>';
            for (var j = 0; j < 5 && i+j < script.chanNameBans.length; ++j) {
                table += '<td>'+script.chanNameBans[i+j].toString()+'</td>';
            }
            table += '</tr>';
        }
        table += '</table>';
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "namewarns") {
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Namewarnings</strong></center></td></tr>';
        for (var i = 0; i < nameWarns.length; i+=5) {
            table += '<tr>';
            for (var j = 0; j < 5 && i+j < nameWarns.length; ++j) {
                table += '<td>'+nameWarns[i+j].toString()+'</td>';
            }
            table += '</tr>';
        }
        table += '</table>';
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "watchlist") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
           TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="3"><center><strong>Watch list</strong></center></td></tr><tr><th>Name</th><th>Comment</th><th>By</th></tr>';
           TABLE_LINE = '<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>';
           TABLE_END = '</table>';
        } else {
           TABLE_HEADER = 'Watch list: Name, Comment';
           TABLE_LINE = ' || {0} / {1}';
           TABLE_END = '';
        }
        try {
        var table = TABLE_HEADER;
        var tmp = [];
        for (var key in script.namesToWatch.hash) {
            if (script.namesToWatch.hash.hasOwnProperty(key)) {
                var comment = script.namesToWatch.get(key).split(" ~ ");
                tmp.push([key, comment[0], comment[1]]);
            }
        }
        tmp.sort(function(a,b) { return a[0] < b[0] ? -1 : 1; });
        for (var row = 0; row < tmp.length; ++row) {
            table += TABLE_LINE.format(tmp[row][0], tmp[row][1], tmp[row][2] ? tmp[row][2] : "");
        }
        table += TABLE_END;
        sys.sendHtmlMessage(src, table, channel);
        } catch (e) { sys.sendMessage(src, e, channel); }
        return;
    }
    if (command == "idbans") {
        //steal from rangebans
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        var text = commandData === "-text";
        if (!text) {
            if (sys.auth(src) > 1) {
                TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="5"><center><strong>ID Bans</strong></center></td></tr><tr><th>ID</th><th>Type</th><th>Name</th><th>IP</th><th>By</th></tr>';
                TABLE_LINE = '<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td></tr>';
            } else {
                TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="4"><center><strong>ID Bans</strong></center></td></tr><tr><th>Type</th><th>Name</th><th>IP</th><th>By</th></tr>';
                TABLE_LINE = '<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>';
            }
           TABLE_END = '</table>';
        } else {
           TABLE_HEADER = (sys.auth(src) > 1 ? 'ID banned: ID, type' : 'ID banned: type, name');
           TABLE_LINE = ' || {0} / {1}';
           TABLE_END = '';
        }
        try {
        var table = TABLE_HEADER;
        var tmp = [];
        for (var key in script.idBans.hash) {
            if (script.idBans.hash.hasOwnProperty(key)) {
                var comment = JSON.parse(script.idBans.get(key));
                var toPush = [comment.type, comment.name, comment.ip, comment.banner];
                if (sys.auth(src) > 1) {
                    toPush.unshift(key);
                }
                if (commandData && !text) {
                    if (comment.name.toLowerCase().indexOf(commandData.toLowerCase()) > -1) {
                        tmp.push(toPush);
                    }
                    else {
                        continue;
                    }
                }
                else {
                    tmp.push(toPush);
                }
            }
        }
        tmp.sort(function(a,b) { return a[0] < b[0] ? -1 : 1; });
        for (var row = 0; row < tmp.length; ++row) {
            if (sys.auth(src) > 1) {
                table += TABLE_LINE.format(tmp[row][0], tmp[row][1], tmp[row][2], tmp[row][3], tmp[row][4]);
            } else {
                table += TABLE_LINE.format(tmp[row][0], tmp[row][1], tmp[row][2], tmp[row][3]);
            }
        }
        table += TABLE_END;
        sys.sendHtmlMessage(src, table, channel);
        } catch (e) { sys.sendMessage(src, e, channel); }
        return;
    }
    if (command == "unmute") {
        script.unban("mute", src, tar, commandData);
        return;
    }
    if (command == "battlehistory") {
        if (tar === undefined) {
            querybot.sendMessage(src, "Usage: /battleHistory username. Only works on online users.", channel);
            return;
        }
        var hist = SESSION.users(tar).battlehistory;
        if (!hist) {
            querybot.sendMessage(src, "Your target has not battled after logging in.", channel);
            return;
        }
        var res = [];
        for (var i = 0; i < hist.length; ++i) {
             res.push("Battle against <b>" + hist[i][0] + "</b>, result <b>" + hist[i][1] + "</b>" + (hist[i][2] == "forfeit" ? " <i>due to forfeit</i>" : "") + (hist[i][3] ? " (<b>rated</b>)" : "") + (hist[i][4] ? " Tier: " + hist[i][4] + "." : "."));
        }
        sys.sendHtmlMessage(src, res.join("<br>"), channel);
        return;
    }
    if (command == "userinfo" || command == "whois" || command == "whereis") {
        var bindChannel = channel;
        if (commandData === undefined) {
            querybot.sendMessage(src, "Please provide a username.", channel);
            return;
        }
        var name = commandData;
        var isbot = false;
        if (commandData[0] == "~") {
            name = commandData.substring(1);
            tar = sys.id(name);
            isbot = true;
        }
        var lastLogin = sys.dbLastOn(name);
        if (lastLogin === undefined) {
            querybot.sendMessage(src, "No such user.", channel);
            return;
        }

        var registered = sys.dbRegistered(name);
        var contribution = script.contributors.hash.hasOwnProperty(name) ? script.contributors.get(name) : "no";
        var authLevel;
        var ip;
        var online;
        var channels = [];
        if (tar !== undefined) {
            name = sys.name(tar); // fixes case
            authLevel = sys.auth(tar);
            ip = sys.ip(tar);
            online = true;
            var chans = sys.channelsOfPlayer(tar);
            for (var i = 0; i < chans.length; ++i) {
                channels.push("#"+sys.channel(chans[i]));
            }
        } else {
            authLevel = sys.dbAuth(name);
            ip = sys.dbIp(name);
            online = false;
        }
        var isBanned = sys.banned(ip);
        var nameBanned = script.nameIsInappropriate(name);
        var rangeBanned = script.isRangeBanned(ip);
        var tempBanned = script.isTempBanned(ip);
        var ipBanned = script.isIpBanned(ip);
        var isSmuted = script.smutes.get(ip);
        var bans = [];
        if (isBanned && !tempBanned) bans.push("normal ban");
        if (nameBanned) bans.push("nameban");
        if (rangeBanned) bans.push("rangeban");
        if (tempBanned) bans.push("tempban (" + getTimeString(sys.dbTempBanTime(name)) + ")");
        if (ipBanned) bans.push("ip ban");
        if (isSmuted) bans.push("smuted");

        if (isbot) {
            var teams = [];
            for (var t = 0; t < sys.teamCount(tar); t++) {
                teams.push(sys.md5(script.importable(tar, t, true)));
            }
            var userJson = {
                'type': 'UserInfo',
                'id': tar ? tar : -1,
                'username': name,
                'auth': authLevel,
                'contributor': contribution,
                'ip': ip.replace("::ffff:", "") + (tar ? " (" + SESSION.users(tar).hostname.replace("::ffff:", "") + ")" : ""),
                'online': online,
                'registered': registered,
                'lastlogin': lastLogin,
                'channels' : channels,
                'bans' : bans,
                'client' : tar ? sys.os(tar) : "Unknown",
                'version' : tar ? sys.version(tar) : "Unknown",
                'teams' : tar && (sys.auth(src) > 2 || isSuperAdmin(src)) ? teams : "Unknown",
                'uniqueid' : tar && (sys.auth(src) > 2 || isSuperAdmin(src)) && sys.uniqueId(tar) ? sys.uniqueId(tar).id : "Unknown"
            };
            sys.sendMessage(src, "+UserInfo: "+JSON.stringify(userJson), channel);
        } else if (command == "userinfo") {
            querybot.sendMessage(src, "Username: " + name + " ~ auth: " + authLevel + " ~ contributor: " + contribution + " ~ ip: " + ip.replace("::ffff:", "") + " ~ online: " + (online ? "yes" : "no") + " ~ registered: " + (registered ? "yes" : "no") + " ~ last login: " + lastLogin + " ~ banned: " + (isBanned ? "yes" : "no"), channel);
        } else if (command == "whois" || command == "whereis") {
            var whois = function(resp) {
                /* May have dced, this being an async call */
                online = sys.loggedIn(tar);
                var authName = function() {
                    switch (authLevel) {
                    case 3: return "owner";
                    case 2: return "admin";
                    case 1: return "moderator";
                    default: return contribution != "no" ? "contributor" : "user";
                    }
                }();
                var ipInfo = "";
                if (resp !== undefined) {
                    resp = JSON.parse(resp);
                    var countryName = resp.countryName;
                    var countryTag =  resp.countryCode;
                    var regionName = resp.regionName;
                    var cityName = resp.cityName;
                    if (countryName !== "" && countryName !== "-") {
                        ipInfo += "Country: " + countryName + " (" + countryTag + "), ";
                    }
                    if (regionName !== "" && regionName !== "-") {
                        ipInfo += "Region: " + regionName + ", ";
                    }
                    if(cityName !== "" && cityName !== "-"){
                        ipInfo += "City: " + cityName;
                    }
                    if (online) SESSION.users(tar).ipinfo = ipInfo;
                } else if (online) {
                    ipInfo = SESSION.users(tar).ipinfo || "";
                }
                var logintime = false;
                if (online) logintime = SESSION.users(tar).logintime;
                var data = [
                    "User: " + name + " @ " + ip.replace("::ffff:", ""),
                    "Auth: " + authName,
                    "Online: " + (online ? "yes" : "no"),
                    "Registered name: " + (registered ? "yes" : "no"),
                    "Last Login: " + (online && logintime ? new Date(logintime*1000).toUTCString() : lastLogin),
                    bans.length > 0 ? "Bans: " + bans.join(", ") : "Bans: none",
                    ipInfo !== ""  ? "IP Details: " + ipInfo : ""
                ];
                if (online) {
                    if (SESSION.users(tar).hostname != ip)
                        data[0] += " (" + SESSION.users(tar).hostname + ")";
                    var realTime = SESSION.users(tar).lastline.time ? SESSION.users(tar).lastline.time : SESSION.users(tar).logintime;
                    data.push("Idle for: " + getTimeString(parseInt(sys.time(), 10) - realTime));
                    data.push("Channels: " + channels.join(", "));
                    data.push("Names during current session: " + (online && SESSION.users(tar).namehistory ? SESSION.users(tar).namehistory.map(function(e){return e[0];}).join(", ") : name));
                    var version = sys.version(tar);
                    if (sys.os(tar) === "windows" || sys.os(tar) === "mac" || sys.os(tar) === "linux") {
                        version = version + ""; //convert to string for charAt
                        version = " (v" + version.charAt(0) + "." + version.charAt(1) + "." + version.charAt(2) + (version.charAt(3) != 0 ? version.charAt(3) : "") + ")";
                    } else if (sys.os(tar) === "android") {
                        //could be redone better probably
                        var verArr = ["7.1", "7.0", "6.3","6.1","6.0","5.2","5.1","5.0","4.4"];
                        var x = 45 + verArr.length - version; //45 is essentially the last google play version
                        if (x < 0) {
                            version = " (later than v2.6.2)";
                        } else if (x > verArr.length) {
                            version = " (earlier than v2.4.4 [" + version + "])";
                        } else {
                            version = " (v2." + verArr[x] + ")";
                        }
                    } else {
                        version = ""; //dead things like webclient
                    }
                    data.push("Client Type: " + utilities.capitalize(sys.os(tar)) + version);
                }
                if (authLevel > 0) {
                    var stats = script.authStats[name.toLowerCase()] || {};
                    for (var key in stats) {
                        if (stats.hasOwnProperty(key)) {
                            data.push("Latest " + key.substr(6).toLowerCase() + ": " + stats[key][0] + " on " + new Date(stats[key][1]*1000).toUTCString());
                        }
                    }
                }
                if (sys.isInChannel(src, bindChannel)) {
                    for (var j = 0; j < data.length; ++j) {
                        sys.sendMessage(src, data[j], bindChannel);
                    }
                }
            };
            var ipcheck = true;
            if (online) ipcheck = SESSION.users(tar).ipinfo === undefined;
            if (command === "whereis" && ipcheck) {
                var ipApi = sys.getFileContent(Config.dataDir+'ipApi.txt');
                sys.webCall('http://api.ipinfodb.com/v3/ip-city/?key=' + ipApi + '&ip='+ ip + '&format=json', whois);
            } else {
                whois();
            }
        }
        return;
    }
    if (command === "isbanned" || command === "checkbantime") {
        if (!commandData) {
            querybot.sendMessage(src, "Please use a valid name/ip", channel);
            return;
        }
        // steal from aliases
        var uid = sys.id(commandData);
        var ip = commandData;
        if (uid !== undefined) {
            ip = sys.ip(uid);
        } else if (sys.dbIp(commandData) !== undefined) {
            ip = sys.dbIp(commandData);
        }
        // from whois
        var bans = [];
        if (sys.banned(ip) && !script.isTempBanned(ip)) { bans.push("Normal Ban"); }
        if (script.isRangeBanned(ip)) { bans.push("Range Ban"); }
        if (script.isTempBanned(ip)) { bans.push("Temporary Ban (" + getTimeString(sys.dbTempBanTime(commandData)) + ")"); }
        if (script.isIpBanned(ip)) { bans.push("IP Ban"); }
        if (script.smutes.get(ip)) { bans.push("Smuted"); }
        if (bans.length > 0) {
            querybot.sendMessage(src, commandData + "'s bans: " + bans.join(", "), channel);
        } else {
            querybot.sendMessage(src, "No bans found for " + commandData + ".", channel);
        }
        return;
    }
    if (command == "aliases") {
        var max_message_length = 30000;
        var noDates = false;
        if (commandData[0] == "~") {
            commandData = commandData.substring(1);
            noDates = true;
        }
        var uid = sys.id(commandData);
        var ip = commandData;
        if (uid !== undefined) {
            ip = sys.ip(uid);
        } else if (sys.dbIp(commandData) !== undefined) {
            ip = sys.dbIp(commandData);
        }
        if (!ip) {
            querybot.sendMessage(src, "Unknown user or IP.", channel);
            return;
        }
        var myAuth = sys.auth(src);
        var allowedToAlias = function(target) {
            return !(myAuth < 3 && sys.dbAuth(target) > myAuth);
        };

        /* Higher auth: don't give the alias list
        Literally bypassable by using /whois or /showip then using the IP in /aliases
        if (!allowedToAlias(commandData)) {
            querybot.sendMessage(src, "Not allowed to alias higher auth: " + commandData, channel);
            return;
        }*/

        ip = ip.indexOf("::ffff:") > -1 ? ip : "::ffff:" + ip; //allows using IP to search aliases again
        var smessage = "The aliases for the IP " + ip.replace("::ffff:", "") + " are: ";
        var prefix = "";
        sys.aliases(ip).map(function(name) {
            return [sys.dbLastOn(name), name];
        }).sort().forEach(function(alias_tuple) {
            var last_login = alias_tuple[0],
                alias = alias_tuple[1];
            if (!allowedToAlias(alias)) {
                return;
            }
            var status = (sys.id(alias) !== undefined) ? "online, " + sys.os(sys.id(alias)) : /*"Last Login: " +*/ last_login;
            smessage = smessage + alias + (noDates ? "" : " ("+status+")") + ", ";
            if (smessage.length > max_message_length) {
                querybot.sendMessage(src, prefix + smessage + " ...", channel);
                prefix = "... ";
                smessage = "";
            }
        });
        querybot.sendMessage(src, prefix + smessage, channel);
        return;
    }
    if (command === "showip") {
        var name = commandData;
        var ip;
        if (sys.dbIp(name) !== undefined) {
            ip = sys.dbIp(name);
        }
        if (!ip) {
            querybot.sendMessage(src, "This user does not have a valid IP.", channel);
            return;
        }
        querybot.sendMessage(src, "User: " + name + " | IP: " + ip.replace("::ffff:", "") + ".", channel);
        return;
    }
    if (command === "tempban") {
        var tmp = commandData.split(":");
        if (tmp.length === 0) {
            normalbot.sendMessage(src, "Usage /tempban name:minutes.", channel);
            return;
        }
        var tarId = sys.id(commandData.split(":")[0]);
        if (!isSuperAdmin(src)) {
            if (sys.auth(tarId) >= sys.auth(src) && sys.auth(src) < 3) {
                normalbot.sendMessage(src, "Let's not ban another auth and give us a bad reputation now. :)", channel);
                return;
            }
        }
        var targetName = tmp[0];
        if (tmp[1] === undefined || isNaN(tmp[1][0])) {
            var minutes = 86400;
        } else {
            var minutes = getSeconds(tmp[1]);
        }
        var minutes = parseInt(minutes, 10);
        if (sys.auth(src) < 2 && minutes > 86400) {
            normalbot.sendMessage(src, "Cannot ban for longer than a day!", channel);
            return;
        }
        var ip = sys.dbIp(targetName);
        if (ip === undefined) {
            normalbot.sendMessage(src, "No such user!", channel);
            return;
        }
        if (sys.maxAuth(ip) >= sys.auth(src)) {
           normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
           return;
        }
        if (sys.banned(ip) && !script.isTempBanned(ip)) {
            normalbot.sendMessage(src, "He/she's already banned!", channel);
            return;
        }
        if (script.isTempBanned(ip)) {
            if (sys.dbTempBanTime(targetName) > 86400 && sys.auth(src) < 2) {
                normalbot.sendMessage(src, "You cannot change the ban time on people who are banned for longer than a day!", channel);
                return;
            }
            normalbot.sendAll(targetName + " was initially tempbanned for another " + getTimeString(sys.dbTempBanTime(targetName)) + ".", staffchannel);
            sys.unban(targetName);
        }
        normalbot.sendAll("Target: " + targetName + ", IP: " + ip.replace("::ffff:", ""), staffchannel);
        sys.sendHtmlAll("<b><font color=red>" + targetName + " was banned by " + nonFlashing(sys.name(src)) + " for " + getTimeString(minutes) + "!</font></b>");
        callplugins("onBan", src, targetName);
        sys.tempBan(targetName, parseInt(minutes/60, 10));
        script.kickAll(ip);
        var authName = sys.name(src);
        script.authStats[authName] = script.authStats[authName] || {};
        script.authStats[authName].latestTempBan = [targetName, parseInt(sys.time(), 10)];
        return;
    }
    if (command == "tempunban") {
        var ip = sys.dbIp(commandData);
        if (ip === undefined) {
            normalbot.sendMessage(src, "No such user!", channel);
            return;
        }
        if (sys.dbTempBanTime(commandData) > 86400 && sys.auth(src) < 2) {
            normalbot.sendMessage(src, "You cannot unban people who are banned for longer than a day!", channel);
            return;
        }
        normalbot.sendAll(sys.name(src) + " unbanned " + commandData, staffchannel);
        sys.unban(commandData);
        return;
    }
    if (command == "passauth" || command == "passauths") {
        if (tar === undefined) {
            normalbot.sendMessage(src, "The target is offline.", channel);
            return;
        }
        if (sys.ip(src) == sys.ip(tar) && sys.auth(tar) === 0) {
            if (!sys.dbRegistered(sys.name(tar))) {
                normalbot.sendMessage(src, "The target name must be registered.", channel);
                return;
            }
            var current = sys.auth(src);
            sys.changeAuth(src, 0);
            sys.changeAuth(tar, current);
            if (command == "passauth")
                normalbot.sendAll(sys.name(src) + " passed their auth to " + sys.name(tar) + "!", staffchannel);
        } else {
            normalbot.sendMessage(src, "You must have the same IP as your target and your target cannot already have auth.", channel);
        }
        return;
    }
    if (command == "smute") {
        script.issueBan("smute", src, tar, commandData);
        return;
    }
    if (command == "sunmute") {
        script.unban("smute", src, tar, commandData);
        return;
    }
    if (command == "showteam") {
        var teamCount = sys.teamCount(tar);
        var index = [];
        for (var i = 0; i < teamCount; i++) {
            index.push(i);
        }
        var teams = index.map(function(index) {
            return script.importable(tar, index, false, true);
        }, this).filter(function(data) {
            return data.length > 0;
        }).map(function(team) {
            return "<tr><td><pre>" + team.join("<br>") + "</pre></td></tr>";
        }).join("");
        if (teams) {
            sys.sendHtmlMessage(src, "<table border='2'>" + teams + "</table>",channel);
            normalbot.sendAll(sys.name(src) + " just viewed " + sys.name(tar) + "'s team.", staffchannel);
            if (sys.auth(src) < 2) {
                normalbot.sendMessage(tar, sys.name(src) + " just viewed your currently loaded teams."); //all channels so they dont miss it hopefully
            }
        } else {
            normalbot.sendMessage(src, "That player has no teams with valid pokemon.", channel);
        }
        sys.appendToFile("scriptdata/showteamlog.txt", "{0} viewed the team of {1} -- ({2})\n".format(sys.name(src), sys.name(tar), new Date().toUTCString()));
        return;
    }
    return "no command";
};
exports.help =
    [
        "/k: Kicks someone. /sk for silent.",
        "/mute: Mutes someone. Format is /mute name:reason:time. Time is optional and defaults to 1 day.",
        "/unmute: Unmutes someone.",
        "/smute: Secretly mutes a user. Can't smute auth. Format is same as mute. Default time is permanent.",
        "/sunmute: Removes secret mute from a user.",
        "/silence: Prevents authless users from talking in a channel for specified time. Format is /silence minutes channel. Affects current channel if no channel is given.",
        "/silenceoff: Removes silence from a channel. Affects current channel if none is specified.",
        "/userinfo: Displays basic information about a user on a single line.",
        "/whois: Displays detailed information about a user.",
        "/aliases: Shows the aliases of an IP or name.",
        "/tempban: Bans someone for 24 hours or less. Format is /tempban name:time Time is optional and defaults to 1 day",
        "/tempunban: Unbans a temporary banned user (standard unban doesn't work).",
        "/isbanned: Checks how long a user is banned for.",
        "/passauth: Passes your mods to an online alt of yours.",
        "/passauths: Passes your mods silently.",
        "/bans: Searches the banlist for a string, shows full list if no search term is entered.",
        "/mutes: Searches the mutelist for a string, shows full list if no search term is entered.",
        "/smutelist: Searches the smutelist for a string, shows full list if no search term is entered.",
        "/rangebans: Lists range bans.",
        "/ipbans: Lists ip bans.",
        "/profiling: Shows the profiling dump.",
        "/autosmutelist: Lists the names in the auto-smute list.",
        "/namebans: Lists name bans.",
        "/namewarns: Lists name warnings.",
        "/channelnamebans: Lists banned channel names.",
        "/watchlist: Lists users having their battle activity tracked.",
        "/onrange: To view who is on an IP range.",
        "/onos: Lists players on a certain operating system (May lag a little with certain OS)",
        "/onversion: Lists players on a certain version. Use \"<\" to include users on previous versions too.",
        "/tiers: To view the tier(s) of a user.",
        "/battlehistory: To view a user's battle history.",
        "/channelusers: Lists users on a channel. Use /channelusers channel:os to filter results by operating system.",      
        "/showteam: Displays the team of a user (to help people who have problems with event moves or invalid teams)."
    ];
