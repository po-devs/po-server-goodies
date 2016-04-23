/*global battlebot, bot, callplugins, channelbot, coinbot, countbot, exports, getplugins, isNonNegative, isSuperAdmin, normalbot, pokedex, querybot, rankingbot, require, script, sendChanHtmlAll, sys, tier_checker, utilities, CAPSLOCKDAYALLOW, Config, SESSION*/
/*jshint strict: false, shadow: true, evil: true, laxcomma: true*/
/*jslint sloppy: true, vars: true, evil: true, plusplus: true*/
exports.handleCommand = function (src, command, commandData, tar, channel) {
    var arraySlice = require("utilities.js").arraySlice;
    var getTimeString = require("utilities.js").getTimeString;
    var find_tier = require("utilities.js").find_tier;
    // loop indices
    var i, x;
    // temp array
    var ar;
    if (command === "commands" || command === "command") {
        if (commandData === undefined) {
            sys.sendMessage(src, "*** Commands ***", channel);
            for (x = 0; x < this.help.length; ++x) {
                sys.sendMessage(src, this.help[x], channel);
            }
            sys.sendMessage(src, "*** Other Commands ***", channel);
            sys.sendMessage(src, "/commands channel: To know of channel commands", channel);
            if (sys.auth(src) > 0 || SESSION.users(src).tempMod) {
                sys.sendMessage(src, "/commands mod: To know of moderator commands", channel);
            }
            if (sys.auth(src) > 1 || SESSION.users(src).tempAdmin) {
                sys.sendMessage(src, "/commands admin: To know of admin commands", channel);
            }
            if (sys.auth(src) > 2 || isSuperAdmin(src)) {
                sys.sendMessage(src, "/commands owner: To know of owner commands", channel);
            }
            if (require("autoteams.js").isAutoTeamsAuth(src)) {
                sys.sendMessage(src, "/commands autoteams: To know of autoteams commands", channel);
            }
            var module, pluginhelps = getplugins("help-string");
            for (module in pluginhelps) {
                if (pluginhelps.hasOwnProperty(module)) {
                    var help = typeof pluginhelps[module] === "string" ? [pluginhelps[module]] : pluginhelps[module];
                    for (i = 0; i < help.length; ++i) {
                        sys.sendMessage(src, "/commands " + help[i], channel);
                    }
                }
            }
            return;
        }

        commandData = commandData.toLowerCase();
        if ( (commandData === "mod" && sys.auth(src) > 0 || SESSION.users(src).tempMod) ||
             (commandData === "admin" && sys.auth(src) > 1 || SESSION.users(src).tempAdmin) ||
             (commandData === "owner" && (sys.auth(src) > 2  || isSuperAdmin(src))) ||
             (commandData === "channel") ) {
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** " + utilities.capitalize(commandData.toLowerCase()) + " commands ***", channel);
            var list = require(commandData + "commands.js").help;
            if (typeof list !== "function") {
                list.forEach(function (help) {
                    sys.sendMessage(src, help, channel);
                });
            } else {
                list(src, channel);
            }
        }
        callplugins("onHelp", src, commandData, channel);
        return;
    }
    if (command === "intier") {
        if (commandData === undefined) {
            battlebot.sendMessage(src, "Please enter a tier.", channel);
            return;
        }
        if (find_tier(commandData) === null) {
            battlebot.sendMessage(src, commandData + " tier doesn't exist on the server.", channel);
            return;
        }
        var x,
            tierInput = find_tier(commandData),
            playerIdArray = sys.playerIds(),
            usersFoundArray = [];
        for (x = 0; x < playerIdArray.length; x++) {
            if (!sys.loggedIn(playerIdArray[x]) || sys.away(playerIdArray[x])) {
                continue;
            }
            if (sys.hasTier(playerIdArray[x], tierInput)) {
                usersFoundArray.push(sys.name(playerIdArray[x]));
            }
        }
        if (usersFoundArray.length === 0) {
            battlebot.sendMessage(src, "No unidled players found in that tier.", channel);
        } else {
            var sliceAmount = 10,
                users = arraySlice(usersFoundArray.shuffle(), sliceAmount).join(", ");
            battlebot.sendMessage(src, "Found " + usersFoundArray.length + "/" + sliceAmount + " unidled random players in " + tierInput + ": " + users, channel);
        }
        return;
    }
    if ((command === "me" || command === "rainbow") && !SESSION.channels(channel).muteall) {
        if (SESSION.channels(channel).meoff) {
            normalbot.sendMessage(src, "/me was turned off.", channel);
            return;
        }
        if (commandData === undefined) {
            return;
        }
        if (channel === sys.channelId("Trivia") && SESSION.channels(channel).triviaon) {
            sys.sendMessage(src, "±Trivia: Answer using \\a, /me not allowed now.", channel);
            return;
        }
        if (usingBannedWords() || repeatingOneself() || capsName()) {
            sys.stopEvent();
            return;
        }
        if (SESSION.users(src).smute.active) {
            sys.playerIds().forEach(function (id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active && sys.isInChannel(src, channel)) {
                    var colour = script.getColor(src);
                    sys.sendHtmlMessage(id, "<font color='" + colour + "'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + commandData + "</font>", channel);
                }
            });
            sys.stopEvent();
            script.afterChatMessage(src, "/" + command + " " + commandData, channel);
            return;
        }
        SESSION.channels(channel).beforeMessage(src, "/me " + commandData);
        commandData = utilities.html_escape(commandData);
        var messagetosend = commandData;
        if (typeof CAPSLOCKDAYALLOW !== "undefined" && CAPSLOCKDAYALLOW) {
            var date = new Date();
            if ((date.getDate() === 22 && date.getMonth() === 9) || (date.getDate() === 28 && date.getMonth() === 5)) { // October 22nd & June 28th
                messagetosend = messagetosend.toUpperCase();
            }
        }
        if (channel === sys.channelId("Tohjo Falls") && script.reverseTohjo) {
            messagetosend = messagetosend.split("").reverse().join("");
        }
        if (command === "me") {
            var colour = script.getColor(src);
            sendChanHtmlAll("<font color='" + colour + "'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + messagetosend + "</font>", channel);
        } else if (command === "rainbow") {
            if (script.isOfficialChan(channel) && sys.auth(src) < 1) {
                return;
            }
            var auth = 1 <= sys.auth(src) && sys.auth(src) <= 3;
            var coloursArray = ["#F85888", "#F08030", "#F8D030", "#78C850", "#98D8D8", "#A890F0", "#C183C1"];
            var colour = sys.rand(0, coloursArray.length);
            var randColour = function () {
                var returnVal = coloursArray[colour];
                colour = colour + 1;
                if (colour === coloursArray.length) {
                    colour = 0;
                }
                return returnVal;
            };
            var toSend = ["<timestamp/><b>"];
            if (auth) {
                toSend.push("<span style='color:" + randColour() + "'>+</span><i>");
            }
            var i, name = sys.name(src);
            for (i = 0; i < name.length; ++i) {
                toSend.push("<span style='color:" + randColour() + "'>" + utilities.html_escape(name[i]) + "</span>");
            }
            toSend.push("<span style='color:" + randColour() + "'>:</b></span> ");
            if (auth) {
                toSend.push("</i>");
            }
            toSend.push(messagetosend);
            sendChanHtmlAll(toSend.join(""), channel);
        }
        script.afterChatMessage(src, "/" + command + " " + commandData, channel);
        return;
    }
    if (command === "contributors") {
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** CONTRIBUTORS ***", channel);
        sys.sendMessage(src, "", channel);
        var x;
        for (x in script.contributors.hash) {
            if (script.contributors.hash.hasOwnProperty(x)) {
                sys.sendMessage(src, x + "'s contributions: " + script.contributors.get(x), channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    }
    if (command === "league") {
        if (!Object.keys(script.league).length) {
            return;
        }
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** Pokemon Online League ***", channel);
        sys.sendMessage(src, "", channel);
        ar = script.league;
        for (x = 0; x < ar.length; ++x) {
            if (ar[x].length > 0) {
                sys.sendHtmlMessage(src, "<span style='font-weight: bold'>" + utilities.html_escape(ar[x][0].toCorrectCase()) + "</span> - " + ar[x][1].format(utilities.html_escape(ar[x][0])) + " " + (sys.id(ar[x][0]) !== undefined ? "<span style='color: green'>(online)</span>" : "<span style='color: red'>(offline)</span>"), channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    }
    if (command === "rules" || command === "rule") {
        if (commandData === "mafia") {
            require("mafia.js").showRules(src, channel);
            return;
        }
        var norules = (rules.length - 1) / 2; //formula for getting the right amount of rules
        if (commandData !== undefined && !isNaN(commandData) && commandData > 0 && commandData < norules) {
            var num = parseInt(commandData, 10);
            num = (2 * num) + 1; //gets the right rule from the list since it isn't simply y=x it's y=2x+1
            sys.sendMessage(src, rules[num], channel);
            sys.sendMessage(src, rules[num + 1], channel);
            return;
        }
        var rule;
        for (rule = 0; rule < rules.length; rule++) {
            sys.sendMessage(src, rules[rule], channel);
        }
        return;
    }
    if (command === "players") {
        if (commandData) {
            commandData = commandData.toLowerCase();
        }
        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var count = 0;
            sys.playerIds().forEach(function (id) {
                if (sys.os(id) === commandData) {
                    count += 1;
                }
            });
            countbot.sendMessage(src, "There are  " + count + " " + commandData + " players online", channel);
            return;
        }
        if (commandData === "top" || commandData === "max") {
            countbot.sendMessage(src, "Max number of players online was " + sys.getVal("MaxPlayersOnline") + ".", channel);
            return;
        }
        countbot.sendMessage(src, "There are " + sys.numPlayers() + " players online.", channel);
        return;
    }
    if (command === "ranking") {
        var announceTier = function (tier) {
            var rank = sys.ranking(sys.name(src), tier);
            if (rank === undefined) {
                rankingbot.sendMessage(src, "You are not ranked in " + tier + " yet!", channel);
            } else {
                var wins = sys.ratedWins(sys.name(src), tier);
                rankingbot.sendMessage(src, "Your rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ladderRating(src, tier) + " points / " + sys.ratedBattles(sys.name(src), tier) + " battles, " + wins + " win" + (wins !== 1 ? "s" : "") + "]!", channel);
            }
        };
        if (commandData !== undefined) {
            commandData = utilities.find_tier(commandData);
            if (sys.totalPlayersByTier(commandData) === 0) {
                rankingbot.sendMessage(src, commandData + " is not even a tier.", channel);
            } else {
                announceTier(commandData);
            }
        } else {
            [0, 1, 2, 3, 4, 5].slice(0, sys.teamCount(src))
                .map(function (i) { return sys.tier(src, i); })
                .filter(function (tier) { return tier !== undefined; })
                .sort()
                .filter(function (tier, index, array) { return tier !== array[index - 1]; })
                .forEach(announceTier);
        }
        return;
    }
    if (command === "battlecount") {
        if (!commandData || commandData.indexOf(":") === -1) {
            rankingbot.sendMessage(src, "Usage: /battlecount name:tier", channel);
            return;
        }
        var stuff = commandData.split(":");
        var name = stuff[0];
        var tier = utilities.find_tier(stuff[1]);
        var rank = sys.ranking(name, tier);
        if (!tier) {
            rankingbot.sendMessage(stuff[1] + " is not a tier", channel);
            return;
        }
        if (rank === undefined) {
            rankingbot.sendMessage(src, "They are not ranked in " + tier + " yet!", channel);
        } else {
            var wins = sys.ratedWins(name, tier);
            rankingbot.sendMessage(src, name + "'s rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ratedBattles(name, tier) + " battles, " + wins + " win" + (wins !== 1 ? "s" : "") + "]!", channel);
        }
        return;
    }
    if (command === "auth") {
        var doNotShowIfOffline = ["loseyourself", "oneballjay"];
        var filterByAuth = function (level) {
            return function (name) {
                return sys.dbAuth(name) === level;
            };
        };
        var printOnlineOffline = function (name) {
            if (sys.id(name) === undefined) {
                if (doNotShowIfOffline.indexOf(name) === -1) {
                    sys.sendMessage(src, name, channel);
                }
            } else {
                sys.sendHtmlMessage(src, "<timestamp/><font color = " + script.getColor(sys.id(name)) + "><b>" + name.toCorrectCase() + "</b></font>", channel);
            }
        };
        var authListArray = sys.dbAuths().sort();
        if (commandData !== "~") {
            sys.sendMessage(src, "", channel);
        }
        switch (commandData) {
        case "owners":
            sys.sendMessage(src, "*** Owners ***", channel);
            authListArray.filter(filterByAuth(3)).forEach(printOnlineOffline);
            break;
        case "admins":
        case "administrators":
            sys.sendMessage(src, "*** Administrators ***", channel);
            authListArray.filter(filterByAuth(2)).forEach(printOnlineOffline);
            break;
        case "mods":
        case "moderators":
            sys.sendMessage(src, "*** Moderators ***", channel);
            authListArray.filter(filterByAuth(1)).forEach(printOnlineOffline);
            break;
        case "~":
            var ret = {};
            ret.owners = authListArray.filter(filterByAuth(3));
            ret.administrators = authListArray.filter(filterByAuth(2));
            ret.moderators = authListArray.filter(filterByAuth(1));
            sys.sendMessage(src, "+auth: " + JSON.stringify(ret), channel);
            return;
        default:
            sys.sendMessage(src, "*** Owners ***", channel);
            authListArray.filter(filterByAuth(3)).forEach(printOnlineOffline);
            sys.sendMessage(src, '', channel);
            sys.sendMessage(src, "*** Administrators ***", channel);
            authListArray.filter(filterByAuth(2)).forEach(printOnlineOffline);
            sys.sendMessage(src, '', channel);
            sys.sendMessage(src, "*** Moderators ***", channel);
            authListArray.filter(filterByAuth(1)).forEach(printOnlineOffline);
        }
        sys.sendMessage(src, '', channel);
        return;
    }
    if (command === "sametier") {
        if (commandData === "on") {
            battlebot.sendMessage(src, "You enforce same tier in your battles.", channel);
            SESSION.users(src).sametier = true;
        } else if (commandData === "off") {
            battlebot.sendMessage(src, "You allow different tiers in your battles.", channel);
            SESSION.users(src).sametier = false;
        } else {
            battlebot.sendMessage(src, "Currently: " + (SESSION.users(src).sametier ? "enforcing same tier" : "allow different tiers") + ". Use /sametier on/off to change it!", channel);
        }
        script.saveKey("forceSameTier", src, SESSION.users(src).sametier * 1);
        return;
    }
    if (command === "idle") {
        if (commandData === undefined) {
            battlebot.sendMessage(src, "You are currently " + (sys.away(src) ? "idling" : "here and ready to battle") + ". Use /idle on/off to change it.", channel);
            return;
        }
        if (commandData.toLowerCase() === "on") {
            battlebot.sendMessage(src, "You are now idling.", channel);
            script.saveKey("autoIdle", src, 1);
            sys.changeAway(src, true);
            return;
        }
        if (commandData.toLowerCase() === "off") {
            battlebot.sendMessage(src, "You are back and ready for battles!", channel);
            script.saveKey("autoIdle", src, 0);
            sys.changeAway(src, false);
            return;
        }
        battlebot.sendMessage(src, "You are currently " + (sys.away(src) ? "idling" : "here and ready to battle") + ". Use /idle on/off to change it.", channel);
        return;
    }
    if (command === "selfkick") {
        var i, srcIp = sys.ip(src), playersArray = sys.playerIds();
        for (i = 0; i < playersArray.length; ++i) {
            if (src !== playersArray[i] && srcIp === sys.ip(playersArray[i])) {
                sys.kick(playersArray[i]);
                normalbot.sendMessage(src, "Your ghost was kicked...");
            }
        }
        return;
    }
    if (command === "uptime") {
        if (typeof (script.startUpTime()) !== "string") {
            countbot.sendMessage(src, "Somehow the server uptime is messed up...", channel);
            return;
        }
        countbot.sendMessage(src, "Server uptime is " + script.startUpTime(), channel);
        return;
    }
    if (command === "topchannels" || command === "topchannel") {
        var i, chanIdArr = sys.channelIds(), listArr = [],
            limit = (commandData && !isNaN(commandData) ? parseInt(commandData, 10) : 10);
        for (i = 0; i < chanIdArr.length; ++i) {
            listArr.push([chanIdArr[i], sys.playersOfChannel(chanIdArr[i]).length]);
        }
        listArr.sort(function (a, b) { return b[1] - a[1]; });
        listArr = listArr.slice(0, limit);
        channelbot.sendMessage(src, "Most used channels:", channel);
        for (i = 0; i < listArr.length; ++i) {
            sys.sendHtmlMessage(src, "<timestamp/>" + (i + 1) + " <a href='po:join/" + sys.channel(listArr[i][0]) + "'>#" + sys.channel(listArr[i][0]) + "</a> with " + listArr[i][1] + " players.", channel);
        }
        return;
    }
    if (command === "resetpass") {
        if (!sys.dbRegistered(sys.name(src))) {
            normalbot.sendMessage(src, "You are not registered!", channel);
            return;
        }
        sys.clearPass(sys.name(src));
        normalbot.sendMessage(src, "Your password was cleared!", channel);
        sys.sendNetworkCommand(src, 14); // make the register button active again
        return;
    }
    if (command === "importable") {
        var teamNumber = 0;
        if (!isNaN(commandData) && commandData >= 0 && commandData < sys.teamCount(src)) {
            teamNumber = commandData;
        }
        var team = script.importable(src, teamNumber, true).join("\n");
        var fileName = sys.time() + "-" + sys.rand(1000, 10000) + ".txt";
        sys.writeToFile("usage_stats/formatted/team/" + fileName, team);
        normalbot.sendMessage(src, "You team can be found here: http://server.pokemon-online.eu/team/" + fileName + " Remember this will be deleted in 24 hours", channel);
        return;
    }
    if (command === "cjoin") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Please enter a channel name after the command.", channel);
            return;
        }
        var i, chan, name = commandData.toLowerCase(), regexp;
        if (commandData.length > 20) {
            normalbot.sendMessage(src, "The channel name you entered is too long. Please make it 20 characters or shorter. Currently using: " + commandData.length, channel);
            return;
        }
        if (sys.existChannel(commandData)) {
            chan = sys.channelId(commandData);
        } else {
            for (i = 0; i < script.chanNameBans.length; ++i) {
                regexp = script.chanNameBans[i];
                if (regexp.test(name)) {
                    normalbot.sendMessage(src, "This kind of channel name is banned from the server. (Matching regexp: " + regexp + ")", channel);
                    return;
                }
            }
            chan = sys.createChannel(commandData);
            normalbot.sendMessage(src, "#" + commandData + " created. Click the link to enter.", channel);
        }
        if (sys.isInChannel(src, chan)) {
            normalbot.sendMessage(src, "You are already in #" + commandData, channel);
        } else {
            sys.putInChannel(src, chan);
        }
        return;
    }
    // Tour alerts
    if (command === "touralerts") {
        if (commandData === "on") {
            SESSION.users(src).tiers = script.getKey("touralerts", src).split("*");
            normalbot.sendMessage(src, "You have turned tour alerts on!", channel);
            script.saveKey("touralertson", src, "true");
            return;
        }
        if (commandData === "off") {
            delete SESSION.users(src).tiers;
            normalbot.sendMessage(src, "You have turned tour alerts off!", channel);
            script.saveKey("touralertson", src, "false");
            return;
        }
        if (commandData === "clear") {
            if (typeof SESSION.users(src).tiers === "undefined") {
                SESSION.users(src).tiers = [];
            }
            if (typeof SESSION.users(src).tiers === "string") {
                SESSION.users(src).tiers = SESSION.users(src).tiers.split("*");
            }
            SESSION.users(src).tiers = [];
            script.saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
            normalbot.sendMessage(src, "All tour alerts cleared.", channel);
            return;
        }
        if (typeof (SESSION.users(src).tiers) === "undefined" || SESSION.users(src).tiers.length === 0) {
            normalbot.sendMessage(src, "You currently have no alerts activated", channel);
            return;
        }
        normalbot.sendMessage(src, "You currently get alerted for the tiers:", channel);
        var x, spl = SESSION.users(src).tiers;
        for (x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                normalbot.sendMessage(src, spl[x], channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    }
    if (command === "addtouralert" || command === "addtouralerts" || command === "removetouralert" || command === "removetouralerts") {
        var x, inputArray = [], foundArray = [], invalidArray = [], existArray = [];
        var verb = "add", verbtensed = "added", adverb = "already", remove = false;
        if (command === "removetouralert" || command === "removetouralerts") {
            verb = "remove";
            verbtensed = "removed";
            adverb = "don't";
            remove = true;
        }
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Please enter a tier to " + verb + " to your tour alerts. Can " + verb + " multiple at the same time by separating each one with *.", channel);
            return;
        }
        if (commandData.indexOf("*") === -1) {
            inputArray[0] = commandData;
        } else {
            inputArray = commandData.split("*");
        }
        if (typeof SESSION.users(src).tiers === "undefined") {
            SESSION.users(src).tiers = [];
        }
        if (typeof SESSION.users(src).tiers === "string") {
            SESSION.users(src).tiers = SESSION.users(src).tiers.split("*");
        }
        for (x = 0; x < inputArray.length; x++) {
            if (utilities.find_tier(inputArray[x]) === null) {
                invalidArray.push(inputArray[x]);
            } else if ((!remove && SESSION.users(src).tiers.indexOf(utilities.find_tier(inputArray[x])) !== -1) ||
                       (remove && SESSION.users(src).tiers.indexOf(utilities.find_tier(inputArray[x])) === -1)) {
                existArray.push(inputArray[x]);
            } else {
                foundArray.push(inputArray[x]);
                if (!remove) {
                    SESSION.users(src).tiers.push(utilities.find_tier(inputArray[x]));
                } else {
                    SESSION.users(src).tiers.splice(SESSION.users(src).tiers.indexOf(utilities.find_tier(inputArray[x])), 1);
                }
            }
        }
        script.saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        normalbot.sendMessage(src, (foundArray.length > 0 ? "You " + verbtensed + " the following tour alerts: " + foundArray.join(", ") + ". " : "") + (existArray.length > 0 ? "Tiers that " + adverb + " have alerts: " + existArray.join(", ") + ". " : "") + (invalidArray.length > 0 ? "Invalid tiers: " + invalidArray.join(", ") + "." : ""), channel);
        return;
    }
    if (command === "coin" || command === "flip") {
        coinbot.sendMessage(src, "You flipped a coin. It's " + (Math.random() < 0.5 ? "Tails" : "Heads") + "!", channel);
        return;
    }
    if (command === "myalts") {
        var ip = sys.ip(src), alts = [];
        sys.aliases(ip).forEach(function (alias) {
            if (sys.dbRegistered(alias)) {
                alts.push(alias + " (Registered)");
            } else {
                alts.push(alias);
            }
        });
        bot.sendMessage(src, "Your alts are: " + alts.join(", "), channel);
        return;
    }
    if (command === "seen") {
        if (commandData === undefined) {
            querybot.sendMessage(src, "Please provide a username.", channel);
            return;
        }
        var lastLogin = sys.dbLastOn(commandData);
        if (lastLogin === undefined) {
            querybot.sendMessage(src, "No such user.", channel);
            return;
        }
        if (sys.id(commandData) !== undefined) {
            querybot.sendMessage(src, commandData + " is currently online!", channel);
            return;
        }
        var index = lastLogin.indexOf("T"), date, time;
        if (index !== -1) {
            date = lastLogin.substr(0, index);
            time = lastLogin.substr(index + 1);
        } else {
            date = lastLogin;
        }
        var d, currentDate = new Date();
        if (time) {
            var date = date.split("-"), time = time.split(":");
            d = new Date(parseInt(date[0], 10), parseInt(date[1], 10) - 1, parseInt(date[2], 10), parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10));
        } else {
            var date = date.split("-");
            d = new Date(parseInt(date[0], 10), parseInt(date[1], 10) - 1, parseInt(date[2], 10));
        }
        querybot.sendMessage(src, commandData + " was last seen: " + d.toUTCString() + " [" + getTimeString((currentDate - d) / 1000) + " ago.]", channel);
        return;
    }
    /*
    Broke in Tierchecks line and below. Useless command, ain't debugging.
    if (command === "dwreleased") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Please enter a Pokémon!", channel);
            return;
        }
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendMessage(src, "No such pokemon!", channel);
            return;
        }
        var pokeName = sys.pokemon(poke);
        if (!pokedex.dwCheck(poke)) {
            normalbot.sendMessage(src, pokeName + ": has no DW ability!", channel);
            return;
        }
            var tierchecks = require('tierchecks.js');
        if (poke in tierchecks.dwpokemons) {
            if (tierchecks.breedingpokemons.indexOf(poke) === -1) {
                normalbot.sendMessage(src, pokeName + ": Released fully!", channel);
            } else {
                normalbot.sendMessage(src, pokeName + ": Released as a Male only, can't have egg moves or previous generation moves!", channel);
            }
        } else {
            normalbot.sendMessage(src, pokeName + ": Not released, only usable on Dream World tiers!", channel);
        }
        return;
    }*/
    //Messy but who really cares?
    function translate(commandData) {
        switch (commandData.toLowerCase()) {
            case "darmanitan-z": commandData = "Darmanitan-D"; break;
            case "meloetta-p": commandData = "Meloetta-S"; break;
            case "hoopa-u": commandData = "Hoopa-B"; break;
            case "rotom-wash": commandData = "Rotom-W"; break;
            case "rotom-fan": commandData = "Rotom-S"; break;
            case "rotom-frost": commandData = "Rotom-F"; break;
            case "rotom-heat": commandData = "Rotom-H"; break;
            case "rotom-mow": commandData = "Rotom-C"; break;
            case "giratina-origin": commandData = "Giratina-O"; break;
            case "shaymin-sky": commandData = "Shaymin-S"; break;
            case "deoxys-attack": commandData = "Deoxys-A"; break;
            case "deoxys-defense": commandData = "Deoxys-D"; break;
            case "deoxys-speed": commandData = "Deoxys-S"; break;
            case "tornadus-therian": commandData = "Tornadus-T"; break;
            case "thundurus-therian": commandData = "Thundurus-T"; break;
            case "landorus-therian": commandData = "Landorus-T"; break;
            case "kyurem-black": commandData = "Kyurem-B"; break;
            case "kyurem-white": commandData = "Kyurem-W"; break;
            case "porygonz":
            case "porygon z": commandData = "Porygon-Z"; break;
            case "porygon-2":
            case "porygon 2": commandData = "Porygon2"; break;
            default: commandData = commandData.replace(/flabebe/i, "Flabébé");
        }
        return commandData;
    }
    
    if (command === "pokemon") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Please specify a Pokémon!", channel);
            return;
        }
        commandData = translate(commandData).split(":");
        var forme = !isNaN(commandData[1]) ? commandData[1] : 0;
        commandData = commandData[0];
        var pokeId;
        if (isNaN(commandData)) {
            switch (commandData.toLowerCase()) {
                case ("darmanitan-z") :
                    commandData = "Darmanitan-D";
                    break;
                case ("meloetta-p") :
                    commandData = "Meloetta-S";
                    break;
                case ("hoopa-u") :
                    commandData = "Hoopa-B";
                    break;
                default:
                    commandData=commandData;
            }
            pokeId = sys.pokeNum(commandData);
        } else {
            if (commandData < 1 || commandData > 721) {
                normalbot.sendMessage(src, commandData + " is not a valid Pokédex number!", channel);
                return;
            }
            pokeId = parseInt(commandData, 10) + (forme << 16);
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
        sys.sendHtmlMessage(src, "<b>Height:</b> " + pokedex.getHeight(pokeId) + " m", channel);
        sys.sendHtmlMessage(src, "<b>Weight:</b> " + pokedex.getWeight(pokeId) + " kg", channel);
        sys.sendHtmlMessage(src, "<b>Base Power of Low Kick/Grass Knot:</b> " + pokedex.weightPower(pokedex.getWeight(pokeId)), channel);
        if (sys.os(src) !== "android") {
            var table = "<table border = 1 cellpadding = 3>";
            table += "<tr><th rowspan = 2 valign = middle><font size = 5>Stats</font></th><th rowspan = 2 valign = middle>Base</th><th colspan = 3>Level 5</th><th colspan = 3>Level 50</th><th colspan = 3>Level 100</th></tr>";
            table += "<tr><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th>";
            for (var x = 0; x < stats.length; x++) {
                var baseStat = baseStats[x];
                table += "<tr><td valign = middle><b>" + stats[x] + "</b></td><td><center><font size = 4>" + baseStat + "</font></center></td>";
                for (var i = 0; i < levels.length; i++) {
                    if (x === 0) {
                        table += "<td valign = middle><center>" + pokedex.calcHP(baseStat, 31, 0, levels[i]) + "</center></td><td valign = middle><center>" + pokedex.calcHP(baseStat, 31, 252, levels[i]) + "</center></td><td valign = middle><center>-</center></td>";
                    } else {
                        table += "<td valign = middle><center>" + pokedex.calcStat(baseStat, 31, 0, levels[i], 1) + "</center></td><td valign = middle><center>" + pokedex.calcStat(baseStat, 31, 252, levels[i], 1) + "</center></td><td valign = middle><center>" + pokedex.calcStat(baseStat, 31, 252, levels[i], 1.1) + "</center></td>";
                    }
                }
                table += "</tr>";
            }
            table += "</table>";
            sys.sendHtmlMessage(src, table, channel);
        } else {
            var data = [];
            for (var x = 0; x < stats.length; x++) {
                var baseStat = baseStats[x];
                data.push("<b>" + stats[x] + ": " + baseStat + "</b>");
                if (x === 0) {
                    data.push("Min: " + pokedex.calcHP(baseStat, 31, 0, 100) + " | Max: " + pokedex.calcHP(baseStat, 31, 252, 100));
                } else {
                    data.push("Min: " + pokedex.calcStat(baseStat, 31, 0, 100, 1) + " | Max: " + pokedex.calcStat(baseStat, 31, 252, 100, 1) + " | Max (+): " + pokedex.calcStat(baseStat, 31, 252, 100, 1.1));
                }
            }
            for (var x = 0; x < data.length; x++) {
                sys.sendHtmlMessage(src, data[x], channel);
            }
        }

        var stone = 0, aforme;
        if (commandData.indexOf(" ") !== -1) {
            stone = sys.stoneForForme(pokeId);
            aforme = commandData.split(" ");
            pokeId = sys.pokeNum(aforme[1]);
        } else {
            aforme = commandData.split("-");
            if (sys.isAesthetic(pokeId)) {
                pokeId = sys.pokeNum(aforme[0]);
            }
        }
        var tiers = ["ORAS Ubers", "ORAS OU", "ORAS UU", "ORAS LU", "ORAS NU", "ORAS LC"];
        var allowed = [];
        for (var x = 0; x < tiers.length; x++) {
            if (sys.isItemBannedFromTier(stone, tiers[x])) {
                break;
            }
            if (!sys.isPokeBannedFromTier(pokeId, tiers[x])) {
                allowed.push(tiers[x]);
            }
        }
        sys.sendHtmlMessage(src, "<b>Allowed in tiers: </b>" + allowed.join(", "), channel);
        return;
    }
    if (command === "tier") {
        commandData = translate(commandData);
        var pokeId = sys.pokeNum(commandData);
        if (!pokeId) {
            normalbot.sendMessage(src, "No such pokemon!", channel);
            return;
        }

        var stone = 0, aforme;
        if (commandData.indexOf(" ") !== -1) {
            stone = sys.stoneForForme(pokeId);
            aforme = commandData.split(" ");
            pokeId = sys.pokeNum(aforme[1]);
        } else {
            aforme = commandData.split("-");
            if (sys.isAesthetic(pokeId)) {
                pokeId = sys.pokeNum(aforme[0]);
            }
        }
        var tiers = ["ORAS Ubers", "ORAS OU", "ORAS UU", "ORAS LU", "ORAS NU", "ORAS LC"];
        var allowed = [];
        for (var x = 0; x < tiers.length; x++) {
            if (sys.isItemBannedFromTier(stone, tiers[x])) {
                break;
            }
            if (!sys.isPokeBannedFromTier(pokeId, tiers[x])) {
                allowed.push(tiers[x]);
            }
        }
        sys.sendHtmlMessage(src, "<b>" + sys.pokemon(sys.pokeNum(commandData)) + " is allowed in tiers: </b>" + allowed.join(", "), channel);
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
        var category = pokedex.getMoveCategory(moveId);
        var BP = pokedex.getMoveBP(moveId);
        var accuracy = pokedex.getMoveAccuracy(moveId);
        var PP = pokedex.getMovePP(moveId);
        var contact = (pokedex.getMoveContact(moveId) ? "Yes" : "No");
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.move(moveId) + "</font></b>", channel);
        var table = "<table border = 1 cellpadding = 2>";
        table += "<tr><th>Type</th><th>Category</th><th>Power</th><th>Accuracy</th><th>PP (Max)</th><th>Contact</th></tr>";
        table += "<tr><td><center>" + type + "</center></td><td><center>" + category + "</center></td><td><center>" + BP + "</center></td><td><center>" + accuracy + "</center></td><td><center>" + PP + " (" + PP * 8 / 5 + ")</center></td><td><center>" + contact + "</center></td></tr>";
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + pokedex.getMoveEffect(moveId), channel);
        sys.sendHtmlMessage(src, "", channel);
        return;
    }
    if (command === "ability") {
        sys.stopEvent();
        if (commandData === undefined) {
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
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + pokedex.getAbility(abilityId), channel);
        sys.sendHtmlMessage(src, "", channel);
        return;
    }
    if (command === "item") {
        sys.stopEvent();
        if (commandData === undefined) {
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
        var flingPower = (isBerry ? "10" : pokedex.getFlingPower(itemId));
        var isGSC = false;
        if (itemId >= 9000 || itemId === 1000 || itemId === 1001 || itemId === 304) {
            isGSC = true;
        }
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.item(itemId) + "</font></b>", channel);
        if (!isGSC) {
            sys.sendHtmlMessage(src, "<img src=item:" + itemId + ">", channel);
        }
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + (isBerry ? pokedex.getBerry(berryId) : pokedex.getItem(itemId)), channel);
        if (!isGSC) {
            if (flingPower !== undefined) {
                sys.sendHtmlMessage(src, "<b>Fling base power:</b> " + flingPower, channel);
            }
            if (isBerry) {
                sys.sendHtmlMessage(src, "<b>Natural Gift type:</b> " + pokedex.getBerryType(berryId), channel);
                sys.sendHtmlMessage(src, "<b>Natural Gift base power:</b> " + pokedex.getBerryPower(berryId), channel);
            }
        }
        sys.sendHtmlMessage(src, "", channel);
        return;
    }
    if (command === "nature" || command === "natures") {
        sys.stopEvent();
        if (commandData) {
            var stats = ["Attack", "Defense", "Special Attack", "Special Defense", "Speed"];
            var effect = pokedex.getNatureEffect(commandData);
            var nature = pokedex.natures[effect[0]][effect[1]];
            if (!nature) {
                normalbot.sendMessage(src, commandData + " is not a valid nature!", channel);
                return;
            }
            var raised = stats[effect[0]];
            var lowered = stats[effect[1]];
            normalbot.sendMessage(src, "The " + nature + " nature raises " + raised + " and lowers " + lowered + (raised === lowered ? ", it's a neutral nature" : "") + ".", channel);
            return;
        }
        var i, x, y,
            stats = ["Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"],
            table = "<table border = 1 cellpadding = 3>";
        table += "<tr><th rowspan = 2 colspan = 2 valign = middle><font size = 5>Natures</font></th><th colspan = 5 valign = middle><font size = 4>Raises</font></th></tr>";
        table += "<tr>";
        for (i = 0; i < 5; i++) {
            table += "<th valign = middle>" + stats[i] + "</th>";
        }
        table += "</tr>";
        for (x = 0; x < 5; x++) {
            table += "<tr>" + (x === 0 ? "<th valign = middle rowspan = 5><font size = 4>Lowers</font></th>" : "") + "<th>" + stats[x] + "</th>";
            for (y = 0; y < 5; y++) {
                table += "<td><center>" + pokedex.natures[y][x] + "</center></td>";
            }
            table += "</tr>";
        }
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command === "canlearn") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Format for this command is: /canlearn Pokemon:move", channel);
            return;
        }
        commandData = commandData.split(":");
        if (commandData.length !== 2) {
            normalbot.sendMessage(src, "Incorrect syntax! Format for this command is: /canlearn Pokemon:move", channel);
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
        var allMoves = pokedex.getAllMoves(pokeId);
        var canLearn = (allMoves.indexOf(moveId) !== -1);
        normalbot.sendMessage(src, sys.pokemon(pokeId) + " " + (canLearn ? "can" : "can't") + " learn " + sys.move(moveId) + ".", channel);
        return;
    }
    if (command === "wiki") {
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendMessage(src, "No such pokemon!", channel);
            return;
        }
        var pokeName = sys.pokemon(poke);
        normalbot.sendMessage(src, pokeName + "'s wikipage is here: http://wiki.pokemon-online.eu/page/" + pokeName, channel);
        return;
    }
    if (command === "wall") {
        if (!isNonNegative(SESSION.global().coins)) {
            SESSION.global().coins = 0;
        }
        if (!isNonNegative(SESSION.users(src).coins)) {
            SESSION.users(src).coins = 1;
        }
        if (SESSION.global().coins < 100) {
            return;
        }
        coinbot.sendAll(sys.name(src) + " found " + SESSION.global().coins + " coins besides the wall!", channel);
        SESSION.users(src).coins += SESSION.global().coins;
        SESSION.global().coins = 0;
        return;
    }
    if (command === "shades") {
        if (sys.name(src).toLowerCase() !== "pokemonnerd") {
            return;
        }
        sys.changeName(src, "(⌐■_■)");
        return;
    }
    if (command === "changetier") {
        if (commandData === undefined) {
            normalbot.sendMessage(src, "Please input a tier to switch to.", channel);
            return;
        }
        commandData = commandData.split(":");
        var tier = utilities.find_tier(commandData[0]), team = 0;
        if (commandData[1] && commandData[1] < sys.teamCount(src) - 1) {
            team = commandData[1];
        }
        if (tier && tier_checker.has_legal_team_for_tier(src, team, tier)) {
            sys.changeTier(src, team, tier);
            if (tier === "Battle Factory" || tier === "Battle Factory 6v6") {
                require("battlefactory.js").generateTeam(src, team);
            }
            normalbot.sendMessage(src, "You switched to " + tier, channel);
            return;
        }
        normalbot.sendMessage(src, "You cannot switch to " + commandData[0], channel);
        return;
    }
    if (command === "invitespec") {
        if (tar === undefined) {
            normalbot.sendMessage(src, "Choose a valid target to watch your battle!");
            return;
        }
        if (!sys.battling(src)) {
            normalbot.sendMessage(src, "You are not currently battling!");
            return;
        }
        /*if (sys.away(tar)) {
            normalbot.sendMessage(src, "You cannot ask idle players to watch your battle.");
            return;
        }*/
        var now = (new Date()).getTime();
        if (typeof SESSION.users(tar).inviteBattleDelay === "object" && SESSION.users(tar).inviteBattleDelay.hasOwnProperty(sys.ip(src)) && now < SESSION.users(tar).inviteBattleDelay[sys.ip(src)]) {
            normalbot.sendMessage(src, "Please wait before sending another battle invite!", channel);
            return;
        }
        normalbot.sendMessage(src, "You invited " + sys.name(tar) + " to watch your battle.", channel);
        sys.sendHtmlMessage(tar, "<font color='brown'><timestamp/><b>±Sentret: </b></font><a href='po:watchplayer/" + sys.name(src) + "'><b>" + utilities.html_escape(sys.name(src)) + "</b> would like you to watch their battle!</a>");
        if (typeof SESSION.users(tar).inviteBattleDelay !== "object") {
            SESSION.users(tar).inviteBattleDelay = {};
        }
        SESSION.users(tar).inviteBattleDelay[sys.ip(src)] = (new Date()).getTime() + 10000;
        return;
    }
    if (command === "notice") {
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

exports.help = [
    "*** Server ***",
    "/rules [x]: Shows the rules (x is optionally parameter to show a specific rule).",
    "/auth [owners/admins/mods]: Lists auth of given level, shows all auth if left blank.",
    "/contributors: Lists contributors to Pokémon Online.",
    "/intier [tier]: Displays all unidled players in a specific tier.",
    "/league: Lists gym leaders and elite four of the PO league.",
    "/notice: Allows you to view current events.",
    "/players: Shows the number of players online. Can accept an operating system as argument to see how many users are using it.",
    "/topchannels: To view the most populated channels.",
    "/uptime: Shows time since the server was last offline.",
    "*** Pokémon Info ***",
    "/ability [ability]: Displays basic information for that ability.",
    "/canlearn: Shows if a Pokémon can learn a certain move. Format is /canlearn [Pokémon]:[move].",
    "/dwreleased [Pokémon]: Shows the released status of a Pokémon's Dream World Ability.",
    "/item [item]: Displays basic information for that item.",
    "/move [move]: Displays basic information for that move.",
    "/nature [nature]: Shows the effects of a nature. Leave blank to show all natures.",
    "/pokemon [Pokémon]: Displays basic information for that Pokémon. Pokédex number can also be used.",
    "/tier [Pokémon]: Displays the tiers a pokémon is allowed in.",
    "/wiki [Pokémon]: Shows that Pokémon's wiki page.",
    "*** User Info ***",
    "/battlecount: Shows the ranking of another user. Format is /battlecount name:tier.",
    "/myalts: Lists your alts.",
    "/ranking: Shows your ranking in your current tier, or a specified tier.",
    "*** Message ***",
    "/me [message]: Sends a message with *** before your name.",
    "/rainbow [message]: Sends a message with your name rainbow-coloured.",
    "*** Options ***",
    "/changetier: Allows you to switch tier. Format is /changetier [tier]:[team]. Team is a number between 0-5 indicating loaded teams. Default is 0.",
    "/cjoin [channel]: Makes you join an existing channel, or create a new one if it doesn't exist.",
    "/idle [on/off]: Makes you idle, which automatically reject all challenges, or not.",
    "/importable: Posts an importable of your team to the Pokemon Online website. Can be used with a number to specify the team to use.",
    "/invitespec [name]: Allows you to invite someone to watch your battle.",
    "/resetpass: Clears your password (unregisters you, remember to reregister).",
    "/sameTier [on/off]: Turn on/off auto-rejection of challenges from players in a different tier from you.",
    "/seen [name]: Allows you to see the last login of a user.",
    "/selfkick: Kicks all other accounts with your same IP."
];