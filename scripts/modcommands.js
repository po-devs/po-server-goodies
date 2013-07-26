exports.modCommand = function(src, command, commandData, tar) {
    if (command == "channelusers") {
        if (commandData === undefined) {
            bots.normal.sendChanMessage(src, "Please give me a channelname!");
            return;
        }
        var chanid;
        var isbot;
        if (commandData[0] == "~") {
            chanid = sys.channelId(commandData.substring(1));
            isbot = true;
        } else {
            chanid = sys.channelId(commandData);
            isbot = false;
        }
        if (chanid === undefined) {
            bots.channel.sendChanMessage(src, "Such a channel doesn't exist!");
            return;
        }
        var chanName = sys.channel(chanid);
        var players = sys.playersOfChannel(chanid);
        var objectList = [];
        var names = [];
        for (var i = 0; i < players.length; ++i) {
            var name = sys.name(players[i]);
            if (isbot)
                objectList.push({'id': players[i], 'name': name});
            else
                names.push(name);
        }
        if (isbot) {
            var channelData = {'type': 'ChannelUsers', 'channel-id': chanid, 'channel-name': chanName, 'players': objectList};
            sendChanMessage(src, ":"+JSON.stringify(channelData));
        } else {
            bots.channel.sendChanMessage(src, "Users of channel #" + chanName + " are: " + names.join(", "));
        }
        return;
    }
    if (command == "topchannels") {
        var cids = sys.channelIds();
        var l = [];
        for (var i = 0; i < cids.length; ++i) {
            l.push([cids[i], sys.playersOfChannel(cids[i]).length]);
        }
        l.sort(function(a,b) { return b[1]-a[1]; });
        var topchans = l.slice(0,10);
        bots.channel.sendChanMessage(src, "Most used channels:");
        for (var i = 0; i < topchans.length; ++i) {
            sendChanMessage(src, "" + sys.channel(topchans[i][0]) + " with " + topchans[i][1] + " players.");
        }
        return;
    }
    if (command == "onrange") {
        var subip = commandData;
        var players = sys.playerIds();
        var players_length = players.length;
        var names = [];
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if (!sys.loggedIn(current_player)) continue;
            var ip = sys.ip(current_player);
            if (ip.substr(0, subip.length) == subip) {
                names.push(current_player);
            }
        }
        // Tell about what is found.
        if (names.length > 0) {
            var msgs = [];
            for (var i = 0; i < names.length; i++) {
                msgs.push(sys.name(names[i]) + " (" + sys.ip(names[i]) + ")");
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
            bots.query.sendMessage(src, "Players on OS " + commandData + " are: " + output.join(", "), channel);
            return;
        }
        bots.normal.sendMessage(src, commandData + " is not a valid OS", channel);
        return;
    }
    if (command == "tier")
    {
        if (tar === undefined){
            bots.query.sendChanMessage(src,"No such user online.");
            return;
        }
        var count = sys.teamCount(tar), tiers = [];
        for (var i = 0; i < count; ++i) {
            var ctier = sys.tier(tar, i);
            if (tiers.indexOf(ctier) == -1)
                tiers.push(ctier);
        }
        bots.query.sendChanMessage(src,sys.name(tar)+" is in tier"+(tiers.length <= 1?"":"s")+": "+tiers.join(", "));
        return;
    }
    if (command == "perm") {
        if (channel == staffchannel || channel === 0) {
            bots.channel.sendChanMessage(src, "you can't do that here.");
            return;
        }

        SESSION.channels(channel).perm = (commandData.toLowerCase() == 'on');
        SESSION.global().channelManager.update(channel);
        bots.channel.sendChanAll("" + sys.name(src) + (SESSION.channels(channel).perm ? " made the channel permanent." : " made the channel a temporary channel again."));
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
        script.silenceoff(src, commandData);
        return;
    }
    if (command == "hangmanban") {
        script.issueBan("hban", src, sys.id(commandData), commandData);
        return;
    }
    if (command == "hangmanunban") {
        if (tar === undefined) {
            if (hbans.get(commandData)) {
                bots.hang.sendAll("IP address " + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                bots.hang.sendAll("IP address " + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!", sachannel);
                hbans.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData);
            if(ip !== undefined && hbans.get(ip)) {
                bots.hang.sendAll("" + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!",staffchannel);
                bots.hang.sendAll("" + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!",hangmanchan);
                bots.hang.sendAll("" + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!",sachannel);
                hbans.remove(ip);
                return;
            }
            bots.hang.sendChanMessage(src, "He/she's not banned from hangman.");
            return;
        }
        if (!SESSION.users(tar).hban.active) {
            bots.hang.sendChanMessage(src, "He/she's not banned from hangman.");
            return;
        }
        if(SESSION.users(src).hban.active && tar==src) {
            bots.hang.sendChanMessage(src, "You may not unban yourself from hangman");
            return;
        }
        bots.hang.sendAll("" + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!",staffchannel);
        bots.hang.sendAll("" + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!",hangmanchan);
        bots.hang.sendAll("" + commandData + " was unbanned from hangman by " + nonFlashing(sys.name(src)) + "!",sachannel);
        SESSION.users(tar).un("hban");
        return;
    }
    if (command == "mafiaban") {
        script.issueBan("mban", src, sys.id(commandData), commandData);
        return;
    }
    if (command == "mafiaunban") {
        if (tar === undefined) {
            if (mbans.get(commandData)) {
                bots.mafia.sendAll("IP address " + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                bots.mafia.sendAll("IP address " + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!", sachannel);
                mbans.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData);
            if(ip !== undefined && mbans.get(ip)) {
                bots.mafia.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!",staffchannel);
                bots.mafia.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!",mafiachan);
                bots.mafia.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!",sachannel);
                mbans.remove(ip);
                return;
            }
            bots.mafia.sendChanMessage(src, "He/she's not banned from Mafia.");
            return;
        }
        if (!SESSION.users(tar).mban.active) {
            bots.mafia.sendChanMessage(src, "He/she's not banned from Mafia.");
            return;
        }
        if(SESSION.users(src).mban.active && tar==src) {
            bots.mafia.sendChanMessage(src, "You may not unban yourself from Mafia");
            return;
        }
        bots.mafia.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!",staffchannel);
        bots.mafia.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!",mafiachan);
        bots.mafia.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!",sachannel);
        SESSION.users(tar).un("mban");
        return;
    }
    if (command == "k") {
        if (tar === undefined) {
            bots.normal.sendMessage(src, "No such user", channel);
            return;
        }
        bots.normal.sendAll("" + commandData + " was mysteriously kicked by " + nonFlashing(sys.name(src)) + "!");
        sys.kick(tar);
        var authname = sys.name(src).toLowerCase();
        authStats[authname] =  authStats[authname] || {};
        authStats[authname].latestKick = [commandData, parseInt(sys.time(), 10)];
        return;
    }

    if (command == "mute") {
        script.issueBan("mute", src, tar, commandData);
        return;
    }
    if (command == "banlist") {
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
    if (command == "mutelist" || command == "smutelist" || command == "mafiabans" || command == "hangmanbans") {
        var mh;
        var name;
        if (command == "mutelist") {
            mh = mutes;
            name = "Muted list";
        } else if (command == "smutelist") {
            mh = smutes;
            name = "Secretly muted list";
        } else if (command == "mafiabans") {
            mh = mbans;
            name = "Mafiabans";
        } else if (command == "hangmanbans") {
            mh = hbans;
            name = "Hangman Bans";
        }

        var width=5;
        var max_message_length = 30000;
        var tmp = [];
        var t = parseInt(sys.time(), 10);
        var toDelete = [];
        for (var ip in mh.hash) {
            if (mh.hash.hasOwnProperty(ip)) {
                var values = mh.hash[ip].split(":");
                var banTime = 0;
                var by = "";
                var expires = 0;
                var banned_name;
                var reason = "";
                if (values.length >= 5) {
                    banTime = parseInt(values[0], 10);
                    by = values[1];
                    expires = parseInt(values[2], 10);
                    banned_name = values[3];
                    reason = values.slice(4);
                    if (expires !== 0 && expires < t) {
                        toDelete.push(ip);
                        continue;
                    }
                } else if (command == "smutelist") {
                    var aliases = sys.aliases(ip);
                    if (aliases[0] !== undefined) {
                        banned_name = aliases[0];
                    } else {
                        banned_name = "~Unknown~";
                    }
                } else {
                    banTime = parseInt(values[0], 10);
                }
                if(typeof commandData != 'undefined' && (!banned_name || banned_name.toLowerCase().indexOf(commandData.toLowerCase()) == -1))
                    continue;
                tmp.push([ip, banned_name, by, (banTime === 0 ? "unknown" : getTimeString(t-banTime)), (expires === 0 ? "never" : getTimeString(expires-t)), utilities.html_escape(reason)]);
            }
        }
        for (var k = 0; k < toDelete.length; ++k)
            delete mh.hash[toDelete[k]];
        if (toDelete.length > 0)
            mh.save();

        tmp.sort(function(a,b) { return a[3] - b[3];});

        // generate HTML
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
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
        if (send_rows > 0)
            sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "rangebans") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
            TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Range banned</strong></center></td></tr><tr><th>IP subaddress</th><th>Comment on rangeban</th></tr>';
            TABLE_LINE = '<tr><td>{0}</td><td>{1}</td></tr>';
            TABLE_END = '</table>';
        } else {
            TABLE_HEADER = 'Range banned: IP subaddress, Command on rangeban';
            TABLE_LINE = ' || {0} / {1}';
            TABLE_END = '';
        }
        try {
            var table = TABLE_HEADER;
            var tmp = [];
            for (var key in rangebans.hash) {
                if (rangebans.hash.hasOwnProperty(key)) {
                    tmp.push([key, rangebans.get(key)]);
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
    if (command == "ipbans") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
            TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Ip Banned</strong></center></td></tr><tr><th>IP subaddress</th><th>Comment on ipban</th></tr>';
            TABLE_LINE = '<tr><td>{0}</td><td>{1}</td></tr>';
            TABLE_END = '</table>';
        } else {
            TABLE_HEADER = 'Ip Banned: IP subaddress, Command on ipban';
            TABLE_LINE = ' || {0} / {1}';
            TABLE_END = '';
        }
        try {
            var table = TABLE_HEADER;
            var tmp = [];
            for (var key in ipbans.hash) {
                if (ipbans.hash.hasOwnProperty(key)) {
                    tmp.push([key, ipbans.get(key)]);
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
    if (command == "unmute") {
        if (tar === undefined) {
            if (mutes.get(commandData)) {
                bots.normal.sendAll("IP address " + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                mutes.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData);
            if(ip !== undefined && mutes.get(ip)) {
                bots.normal.sendAll("" + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!");
                mutes.remove(ip);
                return;
            }
            bots.normal.sendChanMessage(src, "He/she's not muted.");
            return;
        }
        if (!SESSION.users(sys.id(commandData)).mute.active) {
            bots.normal.sendChanMessage(src, "He/she's not muted.");
            return;
        }
        if(SESSION.users(src).mute.active && tar==src) {
            bots.normal.sendChanMessage(src, "You may not unmute yourself!");
            return;
        }
        SESSION.users(tar).un("mute");
        bots.normal.sendAll("" + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!");
        return;
    }
    if (command == "battlehistory") {
        if (tar === undefined) {
            bots.query.sendChanMessage(src, "Usage: /battleHistory username. Only works on online users.");
            return;
        }
        var hist = SESSION.users(tar).battlehistory;
        if (!hist) {
            bots.query.sendChanMessage(src, "Your target has not battled after logging in.");
            return;
        }
        var res = [];
        for (var i = 0; i < hist.length; ++i) {
            res.push("Battle against <b>" + hist[i][0] + "</b>, result <b>" + hist[i][1] + "</b>" + (hist[i][2] == "forfeit" ? " <i>due to forfeit</i>." : "."));
        }
        sys.sendHtmlMessage(src, res.join("<br>"), channel);
        return;
    }
    if (command == "userinfo" || command == "whois" || command == "whoistxt" || command == "whereis") {
        var bindChannel = channel;
        if (commandData === undefined) {
            bots.query.sendChanMessage(src, "Please provide a username.");
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
            bots.query.sendChanMessage(src, "No such user.");
            return;
        }

        var registered = sys.dbRegistered(name);
        var contribution = contributors.hash.hasOwnProperty(name) ? contributors.get(name) : "no";
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
        var isBanned = sys.banList().filter(function(name) { return ip == sys.dbIp(name); }).length > 0;
        var nameBanned = script.nameIsInappropriate(name);
        var rangeBanned = script.isRangeBanned(ip);
        var tempBanned = script.isTempBanned(ip);
        var ipBanned = script.isIpBanned(ip);
        var bans = [];
        if (isBanned && !tempBanned) bans.push("normal ban");
        if (nameBanned) bans.push("nameban");
        if (rangeBanned) bans.push("rangeban");
        if (tempBanned) bans.push("tempban");
        if(ipBanned) bans.push("ip ban");

        if (isbot) {
            var userJson = {'type': 'UserInfo', 'id': tar ? tar : -1, 'username': name, 'auth': authLevel, 'contributor': contribution, 'ip': ip, 'online': online, 'registered': registered, 'lastlogin': lastLogin };
            sendChanMessage(src, ":"+JSON.stringify(userJson));
        } else if (command == "userinfo") {
            bots.query.sendChanMessage(src, "Username: " + name + " ~ auth: " + authLevel + " ~ contributor: " + contribution + " ~ ip: " + ip + " ~ online: " + (online ? "yes" : "no") + " ~ registered: " + (registered ? "yes" : "no") + " ~ last login: " + lastLogin + " ~ banned: " + (isBanned ? "yes" : "no"));
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
                }
                var logintime = false;
                if (online) logintime = SESSION.users(tar).logintime;
                var data = [
                    "User: " + name + " @ " + ip,
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
                    data.push("Idle for: " + getTimeString(parseInt(sys.time(), 10) - SESSION.users(tar).lastline.time));
                    data.push("Channels: " + channels.join(", "));
                    data.push("Names during current session: " + (online && SESSION.users(tar).namehistory ? SESSION.users(tar).namehistory.map(function(e){return e[0];}).join(", ") : name));
                    data.push("Client Type: " + utilities.capitalize(sys.os(tar)));
                }
                if (authLevel > 0) {
                    var stats = authStats[name.toLowerCase()] || {};
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
            if (command === "whereis") {
                var ipApi = sys.getFileContent(Config.dataDir+'ipApi.txt');
                sys.webCall('http://api.ipinfodb.com/v3/ip-city/?key=' + ipApi + '&ip='+ ip + '&format=JSON', whois);
            } else {
                whois();
            }
        }
        return;
    }
    if (command == "aliases") {
        var max_message_length = 30000;
        var uid = sys.id(commandData);
        var ip = commandData;
        if (uid !== undefined) {
            ip = sys.ip(uid);
        } else if (sys.dbIp(commandData) !== undefined) {
            ip = sys.dbIp(commandData);
        }
        if (!ip) {
            bots.query.sendChanMessage(src, "Unknown user or IP.");
            return;
        }
        var myAuth = sys.auth(src);
        var allowedToAlias = function(target) {
            return !(myAuth < 3 && sys.dbAuth(target) > myAuth);
        };

        /* Higher auth: don't give the alias list */
        if (!allowedToAlias(commandData)) {
            bots.query.sendChanMessage(src, "Not allowed to alias higher auth: " + commandData);
            return;
        }

        var smessage = "The aliases for the IP " + ip + " are: ";
        var prefix = "";
        sys.aliases(ip).map(function(name) {
            return [sys.dbLastOn(name), name];
        }).sort().forEach(function(alias_tuple) {
                var last_login = alias_tuple[0],
                    alias = alias_tuple[1];
                if (!allowedToAlias(alias)) {
                    return;
                }
                var status = (sys.id(alias) !== undefined) ? "online" : "Last Login: " + last_login;
                smessage = smessage + alias + " ("+status+"), ";
                if (smessage.length > max_message_length) {
                    bots.query.sendChanMessage(src, prefix + smessage + " ...");
                    prefix = "... ";
                    smessage = "";
                }
            });
        bots.query.sendChanMessage(src, prefix + smessage);
        return;
    }
    if (command == "tempban") {
        var tmp = commandData.split(":");
        if (tmp.length === 0) {
            bots.normal.sendChanMessage(src, "Usage /tempban name:minutes.");
            return;
        }

        var target_name = tmp[0];
        if (tmp[1] === undefined || isNaN(tmp[1][0])) {
            var minutes = 86400;
        } else {
            var minutes = getSeconds(tmp[1]);
        }
        tar = sys.id(target_name);
        var minutes = parseInt(minutes, 10);
        if (sys.auth(src) < 2 && minutes > 86400) {
            bots.normal.sendChanMessage(src, "Cannot ban for longer than a day!");
            return;
        }
        var ip = sys.dbIp(target_name);
        if (ip === undefined) {
            bots.normal.sendChanMessage(src, "No such user!");
            return;
        }
        if (sys.maxAuth(ip)>=sys.auth(src)) {
            bots.normal.sendChanMessage(src, "Can't do that to higher auth!");
            return;
        }
        var banlist=sys.banList();
        for (var a in banlist) {
            if (ip == sys.dbIp(banlist[a])) {
                bots.normal.sendChanMessage(src, "He/she's already banned!");
                return;
            }
        }
        bots.normal.sendAll("Target: " + target_name + ", IP: " + ip, staffchannel);
        sys.sendHtmlAll('<b><font color=red>' + target_name + ' was banned by ' + nonFlashing(sys.name(src)) + ' for ' + getTimeString(minutes) + '!</font></b>');
        sys.tempBan(target_name, parseInt(minutes/60, 10));
        script.kickAll(ip);
        var authname = sys.name(src);
        authStats[authname] = authStats[authname] || {};
        authStats[authname].latestTempBan = [target_name, parseInt(sys.time(), 10)];
        return;
    }
    if (command == "tempunban") {
        var ip = sys.dbIp(commandData);
        if (ip === undefined) {
            bots.normal.sendChanMessage(src, "No such user!");
            return;
        }
        if (sys.dbTempBanTime(commandData) > 86400 && sys.auth(src) < 2) {
            bots.normal.sendChanMessage(src, "You cannot unban people who are banned for longer than a day!");
            return;
        }
        bots.normal.sendAll(sys.name(src) + " unbanned " + commandData, staffchannel);
        sys.unban(commandData);
        return;
    }
    if (command == "checkbantime") {
        var ip = sys.dbIp(commandData);
        if (ip === undefined) {
            bots.normal.sendChanMessage(src, "No such user!");
            return;
        }
        if (sys.dbTempBanTime(commandData) > 2000000000) { //it returns a high number if the person is either not banned or permantly banned
            bots.normal.sendChanMessage(src, "User is not tempbanned");
            return;
        }
        bots.normal.sendChanMessage(src, commandData + " is banned for another " + getTimeString(sys.dbTempBanTime(commandData)));
        return;
    }
    if (command == "passauth" || command == "passauths") {
        if (tar === undefined) {
            bots.normal.sendChanMessage(src, "The target is offline.");
            return;
        }
        if (sys.ip(src) == sys.ip(tar) && sys.auth(tar) === 0) {
            // fine
        }
        else {
            if (sys.auth(src) !== 0 || !SESSION.users(src).megauser) {
                bots.normal.sendChanMessage(src, "You need to be mega-auth to pass auth.");
                return;
            }
            if (!SESSION.users(tar).megauser || sys.auth(tar) > 0) {
                bots.normal.sendChanMessage(src, "The target must be megauser and not auth, or from your IP.");
                return;
            }
        }
        if (!sys.dbRegistered(sys.name(tar))) {
            bots.normal.sendChanMessage(src, "The target name must be registered.");
            return;
        }
        var current = sys.auth(src);
        sys.changeAuth(src, 0);
        sys.changeAuth(tar, current);
        if (command == "passauth")
            bots.normal.sendAll(sys.name(src) + " passed their auth to " + sys.name(tar) + "!", staffchannel);
        return;
    }
    if (command == "skmute" && (sys.auth(src) >= 1 || [/* insert mod list here when this goes to admin+ */].indexOf(sys.name(src).toLowerCase()) >= 0)) {
        if (tar === undefined)
            bots.normal.sendMessage(src, "use only for online target ", channel);
        else {
            bots.normal.sendAll("Target: " + sys.name(tar) + ", IP: " + sys.ip(tar) + ", Auth: "+ sys.name(src), staffchannel);
            script.issueBan("smute", src, undefined, "" + sys.name(tar) + ":skarmpiss:2h");
        }
        return;
    }
    return "no command";
};