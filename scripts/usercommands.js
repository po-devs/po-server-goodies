exports.handleCommand = function(src, command, commandData, tar, channel) {
    // loop indices
    var i, x;
    // temp array
    var ar;
    if (command == "commands" || command == "command") {
        if (commandData === undefined) {
            sys.sendMessage(src, "*** Commands ***", channel);
            for (x = 0; x < this.help.length; ++x) {
                sys.sendMessage(src, this.help[x], channel);
            }
            sys.sendMessage(src, "*** Other Commands ***", channel);
            sys.sendMessage(src, "/commands channel: To know of channel commands", channel);
            if (sys.auth(src) > 0) {
                sys.sendMessage(src, "/commands mod: To know of moderator commands", channel);
            }
            if (sys.auth(src) > 1) {
                sys.sendMessage(src, "/commands admin: To know of admin commands", channel);
            }
            if (sys.auth(src) > 2 || isSuperAdmin(src)) {
                sys.sendMessage(src, "/commands owner: To know of owner commands", channel);
            }
            var pluginhelps = getplugins("help-string");
            for (var module in pluginhelps) {
                if (pluginhelps.hasOwnProperty(module)) {
                    var help = typeof pluginhelps[module] == "string" ? [pluginhelps[module]] : pluginhelps[module];
                    for (i = 0; i < help.length; ++i)
                        sys.sendMessage(src, "/commands " + help[i], channel);
                }
            }
            return;
        }

        commandData = commandData.toLowerCase();
        if ( (commandData == "mod" && sys.auth(src) > 0)
            || (commandData == "admin" && sys.auth(src) > 1)
            || (commandData == "owner" && (sys.auth(src) > 2  || isSuperAdmin(src)))
            || (commandData == "channel") ) {
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** " + utilities.capitalize(commandData.toLowerCase()) + " commands ***", channel);
            var list = require(commandData+"commands.js").help;
            if (typeof list !== "function") {
                list.forEach(function(help) {
                    sys.sendMessage(src, help, channel);
                });
            } else {
                list(src, channel);
            }
        }
        callplugins("onHelp", src, commandData, channel);

        return;
    }
    if ((command == "me" || command == "rainbow") && !SESSION.channels(channel).muteall) {
        if (SESSION.channels(channel).meoff === true) {
            normalbot.sendMessage(src, "/me was turned off.", channel);
            return;
        }
        if (commandData === undefined)
            return;
        if (channel == sys.channelId("Trivia") && SESSION.channels(channel).triviaon) {
            sys.sendMessage(src, "±Trivia: Answer using \\a, /me not allowed now.", channel);
            return;
        }
        if (usingBannedWords() || repeatingOneself() || capsName()) {
            sys.stopEvent();
            return;
        }
        if (SESSION.users(src).smute.active) {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active && sys.isInChannel(src, channel)) {
                    var colour = script.getColor(src);
                    sys.sendHtmlMessage(id, "<font color='"+colour+"'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + commandData + "</font>", channel);
                }
            });
            sys.stopEvent();
            script.afterChatMessage(src, '/'+command+ ' '+commandData,channel);
            return;
        }
        SESSION.channels(channel).beforeMessage(src, "/me " + commandData);
        commandData=utilities.html_escape(commandData);
        var messagetosend = commandData;
        if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW === true) {
            var date = new Date();
            if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
                messagetosend = messagetosend.toUpperCase();
            }
        }
        if (command == "me") {
            var colour = script.getColor(src);
            sendChanHtmlAll("<font color='" + colour + "'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + messagetosend + "</font>", channel);
        }
        else if (command == "rainbow" && SESSION.global().allowRainbow && channel !== 0 && channel !== tourchannel && channel !== mafiachan && channel != sys.channelId("Trivia")) {
            var auth = 1 <= sys.auth(src) && sys.auth(src) <= 3;
            var colours = ["#F85888", "#F08030", "#F8D030", "#78C850", "#98D8D8", "#A890F0", "#C183C1"];
            var colour = sys.rand(0, colours.length);
            var randColour = function () {
                var returnVal = colours[colour];
                colour = colour + 1;
                if (colour === colours.length) {
                    colour = 0;
                }
                return returnVal;
            };
            var toSend = ["<timestamp/><b>"];
            if (auth) toSend.push("<span style='color:" + randColour() + "'>+</span><i>");
            var name = sys.name(src);
            for (var j = 0; j < name.length; ++j)
                toSend.push("<span style='color:" + randColour() + "'>" + utilities.html_escape(name[j]) + "</span>");
            toSend.push("<span style='color:" + randColour() + "'>:</b></span> ");
            if (auth) toSend.push("</i>");
            toSend.push(messagetosend);
            sendChanHtmlAll(toSend.join(""), channel);
        }
        script.afterChatMessage(src, '/' + command + ' ' + commandData, channel);
        return;
    }
    if (command == "contributors") {
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** CONTRIBUTORS ***", channel);
        sys.sendMessage(src, "", channel);
        for (var x in script.contributors.hash) {
            if (script.contributors.hash.hasOwnProperty(x)) {
                sys.sendMessage(src, x + "'s contributions: " + script.contributors.get(x), channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    }
    if (command == "league") {
        if (!Config.League) return;
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** Pokemon Online League ***", channel);
        sys.sendMessage(src, "", channel);
        ar = Config.League;
        for (x = 0; x < ar.length; ++x) {
            if (ar[x].length > 0) {
                sys.sendHtmlMessage(src, "<span style='font-weight: bold'>" + utilities.html_escape(ar[x][0]) + "</span> - " + ar[x][1].format(utilities.html_escape(ar[x][0])) + " " + (sys.id(ar[x][0]) !== undefined ? "<span style='color: green'>(online)</span>" : "<span style='color: red'>(offline)</span>"), channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    }
    if (command == "rules") {
        if (commandData === "mafia") {
            require('mafia.js').showRules(src, channel);
            return;
        }
        var norules = (rules.length-1)/2; //formula for getting the right amount of rules
        if(commandData !== undefined && !isNaN(commandData) && commandData >0 && commandData < norules){
            var num = parseInt(commandData, 10);
            num = (2*num)+1; //gets the right rule from the list since it isn't simply y=x it's y=2x+1
            sys.sendMessage(src, rules[num], channel);
            sys.sendMessage(src, rules[num+1], channel);
            return;
        }
        for (var rule = 0; rule < rules.length; rule++) {
            sys.sendMessage(src, rules[rule], channel);
        }
        return;
    }
    if (command == "players") {
        if (commandData) {
            commandData = commandData.toLowerCase();
        }
        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var android = 0;
            sys.playerIds().forEach(function (id) {
                if (sys.os(id) === commandData) {
                    android += 1;
                }
            });
            countbot.sendMessage(src, "There are  " + android + " " + commandData + " players online", channel);
            return;
        }
        countbot.sendMessage(src, "There are " + sys.numPlayers() + " players online.", channel);
        return;
    }
    if (command == "ranking") {
        var announceTier = function(tier) {
            var rank = sys.ranking(sys.name(src), tier);
            if (rank === undefined) {
                rankingbot.sendMessage(src, "You are not ranked in " + tier + " yet!", channel);
            } else {
                rankingbot.sendMessage(src, "Your rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ladderRating(src, tier) + " points / " + sys.ratedBattles(sys.name(src), tier) +" battles]!", channel);
            }
        };
        if (commandData !== undefined) {
            if (sys.totalPlayersByTier(commandData) === 0)
                rankingbot.sendMessage(src, commandData + " is not even a tier.", channel);
            else
                announceTier(commandData);
        } else {
            [0,1,2,3,4,5].slice(0, sys.teamCount(src))
                .map(function(i) { return sys.tier(src, i); })
                .filter(function(tier) { return tier !== undefined; })
                .sort()
                .filter(function(tier, index, array) { return tier !== array[index-1]; })
                .forEach(announceTier);
        }
        return;
    }
    if (command == "battlecount") {
        if (!commandData || commandData.indexOf(":") == -1) {
            rankingbot.sendMessage(src, "Usage: /battlecount name:tier", channel);
            return;
        }
        var stuff = commandData.split(":");
        var name = stuff[0];
        var tier = utilities.find_tier(stuff[1]);
        var rank = sys.ranking(name, tier);
        if (!tier) {
            rankbot.sendMessage(stuff[1] + " is not a tier", channel);
            return;
        }
        if (rank === undefined) {
            rankingbot.sendMessage(src, "They are not ranked in " + tier + " yet!", channel);
        } else {
            rankingbot.sendMessage(src, name + "'s rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ratedBattles(name, tier) +" battles]!", channel);
        }
        return;
    }
    if (command == "auth") {
        var DoNotShowIfOffline = ["loseyourself", "oneballjay"];
        var filterByAuth = function(level) { return function(name) { return sys.dbAuth(name) == level; }; };
        var printOnlineOffline = function(name) {
            if (sys.id(name) === undefined) {
                if (DoNotShowIfOffline.indexOf(name) == -1) sys.sendMessage(src, name, channel);
            } else {
                sys.sendHtmlMessage(src, "<timestamp/><font color = " + sys.getColor(sys.id(name)) + "><b>" + name.toCorrectCase() + "</b></font>", channel);
            }
        };
        var authlist = sys.dbAuths().sort();
        sys.sendMessage(src, "", channel);
        switch (commandData) {
        case "owners":
            sys.sendMessage(src, "*** Owners ***", channel);
            authlist.filter(filterByAuth(3)).forEach(printOnlineOffline);
            break;
        case "admins":
        case "administrators":
            sys.sendMessage(src, "*** Administrators ***", channel);
            authlist.filter(filterByAuth(2)).forEach(printOnlineOffline);
            break;
        case "mods":
        case "moderators":
            sys.sendMessage(src, "*** Moderators ***", channel);
            authlist.filter(filterByAuth(1)).forEach(printOnlineOffline);
            break;
        default:
            sys.sendMessage(src, "*** Owners ***", channel);
            authlist.filter(filterByAuth(3)).forEach(printOnlineOffline);
            sys.sendMessage(src, '', channel);
            sys.sendMessage(src, "*** Administrators ***", channel);
            authlist.filter(filterByAuth(2)).forEach(printOnlineOffline);
            sys.sendMessage(src, '', channel);
            sys.sendMessage(src, "*** Moderators ***", channel);
            authlist.filter(filterByAuth(1)).forEach(printOnlineOffline);
        }
        sys.sendMessage(src, '', channel);
        return;
    }
    if (command == "sametier") {
        if (commandData == "on") {
            battlebot.sendMessage(src, "You enforce same tier in your battles.", channel);
            SESSION.users(src).sametier = true;
        } else if (commandData == "off") {
            battlebot.sendMessage(src, "You allow different tiers in your battles.", channel);
            SESSION.users(src).sametier = false;
        } else {
            battlebot.sendMessage(src, "Currently: " + (SESSION.users(src).sametier ? "enforcing same tier" : "allow different tiers") + ". Use /sametier on/off to change it!", channel);
        }
        script.saveKey("forceSameTier", src, SESSION.users(src).sametier * 1);
        return;
    }
    if (command == "idle") {
        if (commandData == "on") {
            battlebot.sendMessage(src, "You are now idling.", channel);
            script.saveKey("autoIdle", src, 1);
            sys.changeAway(src, true);
        } else if (commandData == "off") {
            battlebot.sendMessage(src, "You are back and ready for battles!", channel);
            script.saveKey("autoIdle", src, 0);
            sys.changeAway(src, false);
        } else {
            battlebot.sendMessage(src, "You are currently " + (sys.away(src) ? "idling" : "here and ready to battle") + ". Use /idle on/off to change it.", channel);
        }
        return;
    }
    if (command == "selfkick" || command == "sk") {
        var src_ip = sys.ip(src);
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if ((src != current_player) && (src_ip == sys.ip(current_player))) {
                sys.kick(current_player);
                normalbot.sendMessage(src, "Your ghost was kicked...");
            }
        }
        return;
    }
    if (command == "topic") {
        SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "topicadd") {
        if (SESSION.channels(channel).topic.length > 0)
            SESSION.channels(channel).setTopic(src, SESSION.channels(channel).topic + Config.topic_delimiter + commandData);
        else
            SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "removepart") {
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        if (isNaN(commandData) || commandData > topic.length) {
            return;
        }
        var part = commandData;
        if (part > 0) {
            part = part -1;
        }
        topic.splice(part, 1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command == "updatepart") {
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        var pos = commandData.indexOf(" ");
        if (pos === -1) {
            return;
        }
        if (isNaN(commandData.substring(0, pos)) || commandData.substring(0, pos) - 1 < 0 || commandData.substring(0, pos) - 1 > topic.length - 1) {
            return;
        }
        topic[commandData.substring(0, pos) - 1] = commandData.substr(pos+1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command == "uptime") {
        if (typeof(script.startUpTime()) != "string") {
            countbot.sendMessage(src, "Somehow the server uptime is messed up...", channel);
            return;
        }
        countbot.sendMessage(src, "Server uptime is "+script.startUpTime(), channel);
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
        channelbot.sendMessage(src, "Most used channels:", channel);
        for (var i = 0; i < topchans.length; ++i) {
            sys.sendMessage(src, "" + sys.channel(topchans[i][0]) + " with " + topchans[i][1] + " players.", channel);
        }
        return;
    }
    if (command == "resetpass") {
        if (!sys.dbRegistered(sys.name(src))) {
            normalbot.sendMessage(src, "You are not registered!", channel);
            return;
        }
        sys.clearPass(sys.name(src));
        normalbot.sendMessage(src, "Your password was cleared!", channel);
        sys.sendNetworkCommand(src, 14); // make the register button active again
        return;
    }
    if (command == "importable") {
        var teamNumber = 0;
        var bind_channel = channel;
        if (!isNaN(commandData) && commandData >= 0 && commandData < sys.teamCount(src)) {
            teamNumber = commandData;
        }
        var team = script.importable(src, teamNumber, true).join("\n");
        /* commenting out instead so I don't have to write it again later if needed :(
        var name = sys.name(src) + '\'s ' + sys.tier(src, teamNumber) + ' team';
        var post = {};
        post['api_option'] = 'paste'; // paste, duh
        post['api_dev_key'] = pastebin_api_key; // Developer's personal key, set in the beginning
        //post['api_user_key'] = pastebin_user_key; // Pastes are marked to our account
        post['api_paste_private'] = 1; // private
        post['api_paste_name'] = name; // name
        post['api_paste_code'] = team; // text itself
        post['api_paste_expire_date'] = '1M'; // expires in 1 month
        sys.webCall('https://api.github.com/gists?client_id=10d28edcfdd2ccaf111d&client_secret=baf5fa2720d8d55d47ad9f280d8f4733024635e5', function (resp) {
            if (/^http:\/\//.test(resp))
                normalbot.sendMessage(src, "Your team is available at: " + resp, bind_channel); // success
            else {
                normalbot.sendMessage(src, "Sorry, unexpected error: " + resp, bind_channel); // an error occured
                normalbot.sendAll("" + sys.name(src) + "'s /importable failed: " + resp, staffchannel); // message to indigo
            }
        }, post);*/
        var filename = sys.time() + "-" + sys.rand(1000, 10000) + ".txt";
        sys.writeToFile("usage_stats/formatted/team/"+filename, team);
        normalbot.sendMessage(src, "You team can be found here: http://server.pokemon-online.eu/team/" + filename + " Remember this will be deleted in 24 hours", channel);
        return;
    }
    if (command == "cjoin") {
        var chan;
        if (sys.existChannel(commandData)) {
            chan = sys.channelId(commandData);
        } else {
            chan = sys.createChannel(commandData);
        }
        if (sys.isInChannel(src, chan)) {
            normalbot.sendMessage(src, "You are already on #" + commandData, channel);
        } else {
            sys.putInChannel(src, chan);
        }
        return;
    }

    if (command == "register") {
        if (!sys.dbRegistered(sys.name(src))) {
            channelbot.sendMessage(src, "You need to register on the server before registering a channel to yourself for security reasons!", channel);
            return;
        }
        if (sys.auth(src) < 1 && script.isOfficialChan(channel)) {
            channelbot.sendMessage(src, "You don't have sufficient authority to register this channel!", channel);
            return;
        }
        if (SESSION.channels(channel).register(sys.name(src))) {
            channelbot.sendMessage(src, "You registered this channel successfully. Take a look of /commands channel", channel);
        } else {
            channelbot.sendMessage(src, "This channel is already registered!", channel);
        }
        return;
    }
    if (command == "cauth") {
        if (typeof SESSION.channels(channel).operators != 'object')
            SESSION.channels(channel).operators = [];
        if (typeof SESSION.channels(channel).admins != 'object')
            SESSION.channels(channel).admins = [];
        if (typeof SESSION.channels(channel).masters != 'object')
            SESSION.channels(channel).masters = [];
        if (typeof SESSION.channels(channel).members != 'object')
            SESSION.channels(channel).members = [];
        channelbot.sendMessage(src, "The channel members of " + sys.channel(channel) + " are:", channel);
        channelbot.sendMessage(src, "Owners: " + SESSION.channels(channel).masters.join(", "), channel);
        channelbot.sendMessage(src, "Admins: " + SESSION.channels(channel).admins.join(", "), channel);
        channelbot.sendMessage(src, "Mods: " + SESSION.channels(channel).operators.join(", "), channel);
        if (SESSION.channels(channel).inviteonly >= 1 || SESSION.channels(channel).members.length >= 1) {
            channelbot.sendMessage(src, "Members: " + SESSION.channels(channel).members.join(", "), channel);
        }
        return;
    }
    // Tour alerts
    if(command == "touralerts") {
        if(commandData == "on"){
            SESSION.users(src).tiers = script.getKey("touralerts", src).split("*");
            normalbot.sendMessage(src, "You have turned tour alerts on!", channel);
            script.saveKey("touralertson", src, "true");
            return;
        }
        if(commandData == "off") {
            delete SESSION.users(src).tiers;
            normalbot.sendMessage(src, "You have turned tour alerts off!", channel);
            script.saveKey("touralertson", src, "false");
            return;
        }
        if(typeof(SESSION.users(src).tiers) == "undefined" || SESSION.users(src).tiers.length === 0){
            normalbot.sendMessage(src, "You currently have no alerts activated", channel);
            return;
        }
        normalbot.sendMessage(src, "You currently get alerted for the tiers:", channel);
        var spl = SESSION.users(src).tiers;
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                normalbot.sendMessage(src, spl[x], channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    }

    if(command == "addtouralert") {
        var tier = utilities.find_tier(commandData);
        if (tier === null) {
            normalbot.sendMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.", channel);
            return;
        }
        if (typeof SESSION.users(src).tiers == "undefined") {
            SESSION.users(src).tiers = [];
        }
        if (typeof SESSION.users(src).tiers == "string") {
            SESSION.users(src).tiers = SESSION.users(src).tiers.split("*");
        }
        SESSION.users(src).tiers.push(tier);
        script.saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        normalbot.sendMessage(src, "Added a tour alert for the tier: " + tier + "!", channel);
        return;
    }
    if(command == "removetouralert") {
        if(typeof SESSION.users(src).tiers == "undefined" || SESSION.users(src).tiers.length === 0){
            normalbot.sendMessage(src, "You currently have no alerts.", channel);
            return;
        }
        var tier = utilities.find_tier(commandData);
        if (tier === null) {
            normalbot.sendMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.", channel);
            return;
        }
        var idx = -1;
        while ((idx = SESSION.users(src).tiers.indexOf(tier)) != -1) {
            SESSION.users(src).tiers.splice(idx, 1);
        }
        script.saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        normalbot.sendMessage(src, "Removed a tour alert for the tier: " + tier + "!", channel);
        return;
    }
    // The Stupid Coin Game
    if (command == "coin" || command == "flip") {
        coinbot.sendMessage(src, "You flipped a coin. It's " + (Math.random() < 0.5 ? "Tails" : "Heads") + "!", channel);
        if (!isNonNegative(SESSION.users(src).coins))
            SESSION.users(src).coins = 0;
        SESSION.users(src).coins++;
        return;
    }
    if (command == "throw") {
        if (channel != sys.channelId("Coins")) {
            coinbot.sendMessage(src, "No throwing here!", channel);
            return;
        }
        if (sys.auth(src) === 0 && SESSION.channels(channel).muteall && !SESSION.channels(channel).isChannelOperator(src)) {
            if (SESSION.channels(channel).muteallmessages) {
                sys.sendMessage(src, SESSION.channels(channel).muteallmessage, channel);
            } else {
                coinbot.sendMessage(src, "Respect the minutes of silence!", channel);
            }
            return;
        }

        if (!isNonNegative(SESSION.users(src).coins) || SESSION.users(src).coins < 1) {
            coinbot.sendMessage(src, "Need more coins? Use /flip!", channel);
            return;
        }
        if (tar === undefined) {
            if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins = 0;
            coinbot.sendAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at the wall!", channel);
            SESSION.global().coins += SESSION.users(src).coins;
        } else if (tar == src) {
            coinbot.sendMessage(src, "No way...", channel);
            return;
        } else {
            coinbot.sendAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at " + sys.name(tar) + "!", channel);
            if (!isNonNegative(SESSION.users(tar).coins)) SESSION.users(tar).coins = 0;
            SESSION.users(tar).coins += SESSION.users(src).coins;
        }
        SESSION.users(src).coins = 0;
        return;
    }
    if (command == "casino") {
        var bet = parseInt(commandData, 10);
        if (isNaN(bet)) {
            coinbot.sendMessage(src, "Use it like /casino [coinamount]!", channel);
            return;
        }
        if (bet < 5) {
            coinbot.sendMessage(src, "Mininum bet 5 coins!", channel);
            return;
        }
        if (bet > SESSION.users(src).coins) {
            coinbot.sendMessage(src, "You don't have enough coins!", channel);
            return;
        }
        coinbot.sendMessage(src, "You inserted the coins into the Fruit game!", channel);
        SESSION.users(src).coins -= bet;
        var res = Math.random();

        if (res < 0.8) {
            coinbot.sendMessage(src, "Sucks! You lost " + bet + " coins!", channel);
            return;
        }
        if (res < 0.88) {
            coinbot.sendMessage(src, "You doubled the fun! You got " + 2*bet + " coins!", channel);
            SESSION.users(src).coins += 2*bet;
            return;
        }
        if (res < 0.93) {
            coinbot.sendMessage(src, "Gratz! Tripled! You got " + 3*bet + " coins ", channel);
            SESSION.users(src).coins += 3*bet;
            return;
        }
        if (res < 0.964) {
            coinbot.sendMessage(src, "Woah! " + 5*bet + " coins GET!", channel);
            SESSION.users(src).coins += 5*bet;
            return;
        }
        if (res < 0.989) {
            coinbot.sendMessage(src, "NICE job! " + 10*bet + " coins acquired!", channel);
            SESSION.users(src).coins += 10*bet;
            return;
        }
        if (res < 0.999) {
            coinbot.sendMessage(src, "AWESOME LUCK DUDE! " + 20*bet + " coins are yours!", channel);
            SESSION.users(src).coins += 20*bet;
            return;
        } else {
            coinbot.sendMessage(src, "YOU HAVE BEATEN THE CASINO! " + 50*bet + " coins are yours!", channel);
            SESSION.users(src).coins += 50*bet;
            return;
        }
    }
    if (command == "myalts") {
        var ip = sys.ip(src);
        var alts = [];
        sys.aliases(ip).forEach(function (alias) {
            if (sys.dbRegistered(alias)) {
                alts.push(alias + " (Registered)");
            }
            else {
                alts.push(alias);
            }
        });
        bot.sendMessage(src, "Your alts are: " + alts.join(", "), channel);
        return;
    }
    if (command == "seen") {
        if (commandData === undefined) {
            querybot.sendMessage(src, "Please provide a username.", channel);
            return;
        }
        var lastLogin = sys.dbLastOn(commandData);
        if(lastLogin === undefined){
            querybot.sendMessage(src, "No such user.", channel);
            return;
        }
        if(sys.id(commandData)!== undefined){
            querybot.sendMessage(src, commandData + " is currently online!", channel);
            return;
        }
        var indx = lastLogin.indexOf("T");
        var date,time;
        if (indx !== -1) {
            date = lastLogin.substr(0, indx);
            time = lastLogin.substr(indx + 1);
        } else {
            date = lastLogin;
        }
        var d;
        if (time) {
            var date = date.split("-");
            var time = time.split(":");
            d = new Date(parseInt(date[0], 10), parseInt(date[1], 10)-1, parseInt(date[2], 10), parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10));
        } else {
            var parts = date.split("-");
            d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10)-1, parseInt(parts[2], 10));
        }
        querybot.sendMessage(src, commandData + " was last seen: "+ d.toUTCString(), channel);
        return;
    }
    if (command == "dwreleased") {
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendMessage(src, "No such pokemon!", channel); return;
        }
        var pokename = sys.pokemon(poke);
        if (dwCheck(poke) === false){
            normalbot.sendMessage(src, pokename + ": has no DW ability!", channel);
            return;
        }
        if (poke in dwpokemons) {
            if (breedingpokemons.indexOf(poke) == -1) {
                normalbot.sendMessage(src, pokename + ": Released fully!", channel);
            } else {
                normalbot.sendMessage(src, pokename + ": Released as a Male only, can't have egg moves or previous generation moves!", channel);
            }
        } else {
            normalbot.sendMessage(src, pokename + ": Not released, only usable on Dream World tiers!", channel);
        }
        return;
    }
    if (command === "pokemon") {
        if (!commandData) {
            normalbot.sendMessage(src, "Please specify a Pokémon!", channel);
            return;
        }
        var pokeId;
        if (isNaN(commandData)) {
            pokeId = sys.pokeNum(commandData);
        }
        else {
            if (commandData < 1 || commandData > 718) {
                normalbot.sendMessage(src, commandData + " is not a valid Pokédex number!", channel);
                return;
            } 
            pokeId = commandData;
        }
        if (!pokeId) {
            normalbot.sendMessage(src, commandData + " is not a valid Pokémon!", channel);
            return;
        }
        var type1 = sys.type(sys.pokeType1(pokeId));
        var type2 = sys.type(sys.pokeType2(pokeId));
        var ability1 = sys.ability(sys.pokeAbility(pokeId, 0));
        var ability2 = sys.ability(sys.pokeAbility(pokeId, 1));
        var ability3 = sys.ability(sys.pokeAbility(pokeId, 2));
        var baseStats = sys.pokeBaseStats(pokeId);
        var stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var levels = [5, 50, 100];
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4># " + pokeId % 65536 + " " + sys.pokemon(pokeId) + "</font></b>", channel);
        sys.sendHtmlMessage(src, "<img src='pokemon:num=" + pokeId + "&gen=6'><img src='pokemon:num=" + pokeId + "&shiny=true&gen=6'>", channel);
        sys.sendHtmlMessage(src, "<b>Type:</b> " + type1 + (type2 === "???" ? "" : "/" + type2), channel);
        sys.sendHtmlMessage(src, "<b>Abilities:</b> " + ability1 + (sys.pokemon(pokeId).substr(0, 5) === "Mega " ? "" : (ability2 === "(No Ability)" ? "" : ", " + ability2) + (ability3 === "(No Ability)" ? "" : ", " + ability3 + " (Hidden Ability)")), channel);
        sys.sendHtmlMessage(src, "<b>Height:</b> " + getHeight(pokeId) + " m", channel);
        sys.sendHtmlMessage(src, "<b>Weight:</b> " + getWeight(pokeId) + " kg", channel);
        sys.sendHtmlMessage(src, "<b>Base Power of Low Kick/Grass Knot:</b> " + weightPower(getWeight(pokeId)), channel);
        var table = "<table border = 1 cellpadding = 3>";
        table += "<tr><th rowspan = 2 valign = middle><font size = 5>Stats</font></th><th rowspan = 2 valign = middle>Base</th><th colspan = 3>Level 5</th><th colspan = 3>Level 50</th><th colspan = 3>Level 100</th></tr>";
        table += "<tr><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th>";
        for (var x = 0; x < stats.length; x++) {
            var baseStat = baseStats[x];
            table += "<tr><td valign = middle><b>" + stats[x] + "</b></td><td><center><font size = 4>" + baseStat + "</font></center></td>";
            for (var i = 0; i < levels.length; i++) {
                if (x === 0) {
                    table += "<td valign = middle><center>" + calcHP(baseStat, 31, 0, levels[i]) + "</center></td><td valign = middle><center>" + calcHP(baseStat, 31, 252, levels[i]) + "</center></td><td valign = middle><center>-</center></td>";
                }
                else {
                    table += "<td valign = middle><center>" + calcStat(baseStat, 31, 0, levels[i], 1) + "</center></td><td valign = middle><center>" + calcStat(baseStat, 31, 252, levels[i], 1) + "</center></td><td valign = middle><center>" + calcStat(baseStat, 31, 252, levels[i], 1.1) + "</center></td>";
                }
            }
            table += "</tr>";
        }
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command === "move") {
        if (!commandData) {
            normalbot.sendMessage(src, "Please specify a move!", channel);
            return;
        }
        var moveId = sys.moveNum(commandData);
        if (!moveId) {
            normalbot.sendMessage(src, commandData + " is not a valid move!", channel);
            return;
        }
        var type = sys.type(sys.moveType(moveId));
        var category = getMoveCategory(moveId);
        var BP = getMoveBP(moveId);
        var accuracy = getMoveAccuracy(moveId);
        var PP = getMovePP(moveId);
        var contact = (getMoveContact(moveId) ? "Yes" : "No");
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.move(moveId) + "</font></b>", channel);
        var table = "<table border = 1 cellpadding = 2>";
        table += "<tr><th>Type</th><th>Category</th><th>Power</th><th>Accuracy</th><th>PP (Max)</th><th>Contact</th></tr>";
        table += "<tr><td><center>" + type + "</center></td><td><center>" + category + "</center></td><td><center>" + BP + "</center></td><td><center>" + accuracy + "</center></td><td><center>" + PP + " (" + PP * 8/5 + ")</center></td><td><center>" + contact + "</center></td></tr>";
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + getMoveEffect(moveId), channel);
        sys.sendHtmlMessage(src, "", channel);
        return;
    }
    if (command === "ability") {
        sys.stopEvent();
        if (commandData === "") {
            normalbot.sendMessage(src, "Please specify an ability!", channel);
            return;
        }
        var abilityId = sys.abilityNum(commandData);
        if (!abilityId) {
            normalbot.sendMessage(src, commandData + " is not a valid ability!", channel);
            return;
        }
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.ability(abilityId) + "</font></b>", channel);
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + getAbility(abilityId), channel);
        sys.sendHtmlMessage(src, "", channel);
        return;
    }
    if (command === "item") {
        sys.stopEvent();
        if (commandData === "") {
            normalbot.sendMessage(src, "Please specify an item!", channel);
            return;
        }
        var itemId = sys.itemNum(commandData);
        var berryId = itemId - 8000;
        if (!itemId) {
            normalbot.sendMessage(src, commandData + " is not a valid item!", channel);
            return;
        }
        var isBerry = (commandData.toLowerCase().substr(commandData.length - 5) === "berry");
        var flingPower = isBerry ? "10" : getFlingPower(itemId);
        var isGSC = false;
        if (itemId >= 9000 || itemId === 1000 || itemId === 1001 || itemId === 304) {
            isGSC = true;
        }
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.item(itemId) + "</font></b>", channel);
        if (!isGSC) {
            sys.sendHtmlMessage(src, "<img src=item:" + itemId + ">", channel);
        }
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + (isBerry ? getBerry(berryId) : getItem(itemId)), channel);
        if (!isGSC) {
            if (flingPower != undefined) {
                sys.sendHtmlMessage(src, "<b>Fling base power:</b> " + flingPower, channel);
            }
            if (isBerry) {
                sys.sendHtmlMessage(src, "<b>Natural Gift type:</b> " + getBerryType(berryId), channel);
                sys.sendHtmlMessage(src, "<b>Natural Gift base power:</b> " + getBerryPower(berryId), channel);
            }
        }
    sys.sendHtmlMessage(src, "", channel);
    return;
    }
    if (command === "nature" || command === "natures") {
        sys.stopEvent();
        if (commandData) {
            var stats = ["Attack", "Defense", "Special Attack", "Special Defense", "Speed"];
            var effect = script.getNatureEffect(commandData);
            var nature = script.natures[effect[0]][effect[1]];
            if (!nature) {
                normalbot.sendMessage(src, commandData + " is not a valid nature!", channel);
                return;
            }
            var raised = stats[effect[0]];
            var lowered = stats[effect[1]];
            normalbot.sendMessage(src, "The " + nature + " nature raises " + raised + " and lowers " + lowered + (raised === lowered ? ", it's a neutral nature" : "") + ".", channel);
            return;
        }
        var stats = ["Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var table = "<table border = 1 cellpadding = 3>";
        table += "<tr><th rowspan = 2 colspan = 2 valign = middle><font size = 5>Natures</font></th><th colspan = 5 valign = middle><font size = 4>Raises</font></th></tr>";
        table += "<tr>";
        for (var i = 0; i < 5; i++) {
            table += "<th valign = middle>" + stats[i] + "</th>";
        }
        table += "</tr>";
        for (var x = 0; x < 5; x++) {
            table += "<tr>" + (x === 0 ? "<th valign = middle rowspan = 5><font size = 4>Lowers</font></th>" : "") + "<th>" + stats[x] + "</th>";
            for (var y = 0; y < 5; y++) {
                table += "<td><center>" + script.natures[y][x] + "</center></td>";
            }
            table += "</tr>";
        }
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command === "canlearn") {
        commandData = commandData.split(":");
        if (commandData.length != 2) {
            normalbot.sendMessage(src, "Incorrect syntax! Format for this command is /canlearn Pokemon:move", channel);
            return;
        }
        var pokeId = sys.pokeNum(commandData[0]);
        var moveId = sys.moveNum(commandData[1]);
        if (!pokeId) {
            if (!moveId) {
                normalbot.sendMessage(src, "Neither the Pokémon nor the move actually exist!", channel);
                return;
            }
            normalbot.sendMessage(src, commandData[0] + " is not a valid Pokémon!", channel);
            return;
        }
        if (!moveId) {
            normalbot.sendMessage(src, commandData[1] + " is not a valid move!", channel);
            return;
        }
        moveId = moveId.toString();
        var allMoves = script.getAllMoves(pokeId);
        var canLearn = (allMoves.indexOf(moveId) != -1);
        normalbot.sendMessage(src, sys.pokemon(pokeId) + " " + (canLearn ? "can" : "can't") + " learn " + sys.move(moveId) + ".", channel);
        return;
    }
    if (command == "wiki"){
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendMessage(src, "No such pokemon!", channel);
            return;
        }
        var pokename = sys.pokemon(poke);
        normalbot.sendMessage(src, pokename+"'s wikipage is here: http://wiki.pokemon-online.eu/wiki/"+pokename, channel);
        return;
    }
    if (-crc32(command, crc32(sys.name(src))) == 22 || command == "wall") {
        if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins=0;
        if (!isNonNegative(SESSION.users(src).coins)) SESSION.users(src).coins=1;
        if (SESSION.global().coins < 100) return;
        coinbot.sendAll("" + sys.name(src) + " found " + SESSION.global().coins + " coins besides the wall!", channel);
        SESSION.users(src).coins += SESSION.global().coins;
        SESSION.global().coins = 0;
        return;
    }
    if(command == "shades"){
        if(sys.name(src).toLowerCase() !== "pokemonnerd"){
            return;
        }
        sys.changeName(src, "(⌐■_■)");
        return;
    }
    if (command == "changetier") {
        commandData = commandData.split(":");
        var tier = utilities.find_tier(commandData[0]);
        var team = 0;
        if (commandData[1] && commandData[1] < sys.teamCount(src) -1) {
            team = commandData[1];
        }
        if (tier && tier_checker.has_legal_team_for_tier(src, team, tier)) {
            sys.changeTier(src, team, tier);
            if (tier == "Battle Factory" || tier == "Battle Factory 6v6") {
                require('battlefactory.js').generateTeam(src, team);
            }
            normalbot.sendMessage(src, "You switched to " + tier, channel);
            return;
        }
        normalbot.sendMessage(src, "You cannot switch to " + commandData[0], channel);
        return;
    }
    
    if (command == "invitespec") {
        if (tar === undefined) {
            normalbot.sendMessage(src, "Choose a valid target to watch your battle!");
            return;
        }
        if (!sys.battling(src)) {
            normalbot.sendMessage(src, "You are not currently battling!");
            return;
        }
        
        if (sys.away(tar)) {
            normalbot.sendMessage(src, "You cannot ask idle players to watch your battle.");
            return;
        }
        
        /*Delay code ripped from Hangman */
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).inviteDelay) {
            normalbot.sendMessage(src, "Please wait before sending another invite!");
            return;
        }
        sys.sendHtmlMessage(tar, "<font color='brown'><timestamp/><b>±Sentret:  </b></font><a href='po:watchplayer/"+ sys.name(src) +"'><b>"+utilities.html_escape(sys.name(src))+"</b> would like you to watch their battle!</a>");
        SESSION.users(src).inviteDelay = (new Date()).getTime() + 15000;
        return;
    }
    if (command == "notice") {
        var notice = sys.getFileContent(Config.dataDir + "notice.html");
        if (notice) {
            sys.sendHtmlMessage(src, notice, channel);
        } else {
            sys.sendMessage(src, "There's no notice to show");
        }
        return;
    }
    return "no command";
};

exports.help =
    [
        "/rules [x]: Shows the rules (x is optionally parameter to show a specific rule).",
        "/ranking: Shows your ranking in your current tier, or a specified tier.",
        "/myalts: Lists your alts.",
        "/me [message]: Sends a message with *** before your name.",
        "/rainbow [message]: Sends a message with your name rainbow-coloured.",
        "/selfkick: Kicks all other accounts with your same IP.",
        "/importable: Posts an importable of your team to the Pokemon Online website. Can be used with a number to specify the team to use.",
        "/dwreleased [Pokémon]: Shows the released status of a Pokémon's Dream World Ability.",
        "/wiki [Pokémon]: Shows that Pokémon's wiki page.",
        "/pokemon [Pokémon]: Displays basic information for that Pokémon. Pokédex number can also be used.",
        "/move [move]: Displays basic information for that move.",
        "/ability [ability]: Displays basic information for that ability.",
        "/item [item]: Displays basic information for that item.",
        "/nature [nature]: Shows the effects of a nature. Leave blank to show all natures.",
        "/canlearn: Shows if a Pokémon can learn a certain move. Format is /canlearn [Pokémon]:[move].",
        "/resetpass: Clears your password (unregisters you, remember to reregister).",
        "/auth [owners/admins/mods]: Lists auth of given level, shows all auth if left blank.",
        "/contributors: Lists contributors to Pokémon Online.",
        "/league: Lists gym leaders and elite four of the PO league.",
        "/uptime: Shows time since the server was last offline.",
        "/players: Shows the number of players online. Can accept an operating system as argument to see how many users are using it.",
        "/topchannels: To view the most populated channels.",
        "/idle [on/off]: Makes you idle, which automatically reject all challenges, or not.",
        "/sameTier [on/off]: Turn on/off auto-rejection of challenges from players in a different tier from you.",
        "/cjoin [channel]: Makes you join an existing channel, or create a new one if it doesn't exist.",
        "/seen [name]: Allows you to see the last login of a user.",
        "/changetier: Allows you to switch tier. Format is /changetier [tier]:[team]. Team is a number between 0-5 indicating loaded teams. Default is 0.",
        "/invitespec [name]: Allows you to invite someone to watch your battle.",
        "/notice: Allows you to view current events"
    ];
