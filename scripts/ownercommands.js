exports.handleCommand = function(src, command, commandData, tar) {
    if (command == "ipban") {
        var subip;
        var comment;
        var space = commandData.indexOf(' ');
        if (space != -1) {
            subip = commandData.substring(0,space);
            comment = commandData.substring(space+1);
        } else {
            subip = commandData;
            comment = '';
        }
        /* check ip */
        var i = 0;
        var nums = 0;
        var dots = 0;
        var correct = (subip.length > 0); // zero length ip is baaad
        while (i < subip.length) {
            var c = subip[i];
            if (c == '.' && nums > 0 && dots < 3) {
                nums = 0;
                ++dots;
                ++i;
            } else if (c == '.' && nums === 0) {
                correct = false;
                break;
            } else if (/^[0-9]$/.test(c) && nums < 3) {
                ++nums;
                ++i;
            } else {
                correct = false;
                break;
            }
        }
        if (!correct) {
            normalbot.sendChanMessage(src, "The IP address looks strange, you might want to correct it: " + subip);
            return;
        }
        ipbans.add(subip, "Name: " +sys.name(src) + " Comment: " + rangebans.escapeValue(comment));
        normalbot.sendChanAll("IP ban added successfully for IP subrange: " + subip + " by "+ sys.name(src),staffchannel);
        return;
    }
    if (command == "ipunban") {
        var subip = commandData;
        if (ipbans.get(subip) !== undefined) {
            ipbans.remove(subip);
            normalbot.sendChanMessage(src, "IP ban removed successfully for IP subrange: " + subip);
        } else {
            normalbot.sendChanMessage(src, "No such IP ban.");
        }
        return;
    }
    if (command == "changerating") {
        var data =  commandData.split(' -- ');
        if (data.length != 3) {
            normalbot.sendChanMessage(src, "You need to give 3 parameters.");
            return;
        }
        var player = data[0];
        var tier = data[1];
        var rating = parseInt(data[2], 10);

        sys.changeRating(player, tier, rating);
        normalbot.sendChanMessage(src, "Rating of " + player + " in tier " + tier + " was changed to " + rating);
        return;
    }
    if(command == "hiddenauth"){
        sendChanMessage(src, "*** Hidden Auth ***");
        sys.dbAuths().sort().filter(function(name) { return sys.dbAuth(name) > 3; }).forEach(function(name) {
            sendChanMessage(src, name + " " + sys.dbAuth(name));
        });
        sendChanMessage(src, "",channel);
        return;
    }
    if (command == "capslockday") {
        if (commandData == "off") {
            CAPSLOCKDAYALLOW = false;
            normalbot.sendChanMessage(src, "You turned caps lock day off!");
        }
        else if (commandData == "on") {
            CAPSLOCKDAYALLOW = true;
            normalbot.sendChanMessage(src, "You turned caps lock day on!");
        }
        return;
    }
    if (command == "contributor") {
        var s = commandData.split(":");
        var name = s[0], reason = s[1];
        if (sys.dbIp(name) === undefined) {
            normalbot.sendChanMessage(src, name + " couldn't be found.");
            return;
        }
        normalbot.sendChanMessage(src, name + " is now a contributor!");
        contributors.add(name, reason);
        return;
    }
    if (command == "contributoroff") {
        var contrib = "";
        for (var x in contributors.hash) {
            if (x.toLowerCase() == commandData.toLowerCase())
            contrib = x;
        }
        if (contrib === "") {
            normalbot.sendChanMessage(src, commandData + " isn't a contributor.", channel);
            return;
        }
        contributors.remove(contrib);
        normalbot.sendChanMessage(src, commandData + " is no longer a contributor!");
        return;
    }
    if (command == "showteam") {
        var teams = [0,1,2,3,4,5].map(function(index) {
            return this.importable(tar, index);
        }, this).filter(function(data) {
            return data.length > 0;
        }).map(function(team) {
            return "<tr><td><pre>" + team.join("<br>") + "</pre></td></tr>";
        }).join("");
        if (teams) {
            sys.sendHtmlMessage(src, "<table border='2'>" + teams + "</table>",channel);
            normalbot.sendAll(sys.name(src) + " just viewed " + sys.name(tar) + "'s team.", staffchannel);
        } else {
            normalbot.sendChanMessage(src, "That player has no teams with valid pokemon.");
        }
        return;
    }
    if (command == "rangeban") {
        var subip;
        var comment;
        var space = commandData.indexOf(' ');
        if (space != -1) {
            subip = commandData.substring(0,space);
            comment = commandData.substring(space+1);
        } else {
            subip = commandData;
            comment = '';
        }
        /* check ip */
        var i = 0;
        var nums = 0;
        var dots = 0;
        var correct = (subip.length > 0); // zero length ip is baaad
        while (i < subip.length) {
            var c = subip[i];
            if (c == '.' && nums > 0 && dots < 3) {
                nums = 0;
                ++dots;
                ++i;
            } else if (c == '.' && nums === 0) {
                correct = false;
                break;
            } else if (/^[0-9]$/.test(c) && nums < 3) {
                ++nums;
                ++i;
            } else {
                correct = false;
                break;
            }
        }
        if (!correct) {
            normalbot.sendChanMessage(src, "The IP address looks strange, you might want to correct it: " + subip);
            return;
        }

        /* add rangeban */
        rangebans.add(subip, rangebans.escapeValue(comment));
        normalbot.sendChanMessage(src, "Rangeban added successfully for IP subrange: " + subip);
        /* kick them */
        var players = sys.playerIds();
        var players_length = players.length;
        var names = [];
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            var ip = sys.ip(current_player);
            if (sys.auth(current_player) > 0) continue;
            if (ip.substr(0, subip.length) == subip) {
                names.push(sys.name(current_player));
                sys.kick(current_player);
                continue;
            }
        }
        if (names.length > 0) {
            sendChanAll("±Jirachi: "+names.join(", ") + " got range banned by " + sys.name(src), staffchannel);
        }
        return;
    }
    if (command == "rangeunban") {
        var subip = commandData;
        if (rangebans.get(subip) !== undefined) {
            rangebans.remove(subip);
            normalbot.sendChanMessage(src, "Rangeban removed successfully for IP subrange: " + subip);
        } else {
            normalbot.sendChanMessage(src, "No such rangeban.");
        }
        return;
    }
    if (command == "purgemutes") {
        var time = parseInt(commandData, 10);
        if (isNaN(time)) {
            time = 60*60*24*7*4;
        }
        var limit = parseInt(sys.time(), 10) - time;
        var removed = [];
        mutes.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0], 10) < limit || (data.length > 3 && parseInt(data[2], 10) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendChanMessage(src, "" + removed.length + " mutes purged successfully.");
        } else {
            normalbot.sendChanMessage(src, "No mutes were purged.");
        }
        return;
    }
    if (command == "purgembans") {
        var time = parseInt(commandData, 10);
        if (isNaN(time)) {
            time = 60*60*24*7;
        }
        var limit = parseInt(sys.time(), 10) - time;
        var removed = [];
        mbans.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0], 10) < limit || (data.length > 3 && parseInt(data[2], 1) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendChanMessage(src, "" + removed.length + " mafiabans purged successfully.");
        } else {
            normalbot.sendChanMessage(src, "No mafiabans were purged.");
        }
        return;
    }
    if (command == "sendall") {
        sendChanAll(commandData);
        return;
    }
    if(command == "sendmessage"){
        var para = commandData.split(':::');
        if(para.length < 3){
            return;
        }
        var tar = sys.id(para[0]);
        var mess =  para[1];
        var chan = sys.channelId(para[2]);
        sys.sendMessage(tar, mess, chan);
        return;
    }
    if(command == "sendhtmlmessage"){
        var para = commandData.split(':::');
        if(para.length < 3){
            return;
        }
        var tar = sys.id(para[0]);
        var mess =  para[1];
        var chan = sys.channelId(para[2]);
        sys.sendHtmlMessage(tar, mess, chan);
        return;
    }
    if (command == "imp") {
        SESSION.users(src).impersonation = commandData;
        normalbot.sendChanMessage(src, "Now you are " + SESSION.users(src).impersonation + "!");
        return;
    }
    if (command == "impoff") {
        delete SESSION.users(src).impersonation;
        normalbot.sendChanMessage(src, "Now you are yourself!");
        return;
    }
    if (command == "autosmute") {
        if(sys.dbIp(commandData) === undefined) {
            normalbot.sendChanMessage(src, "No player exists by this name!");
            return;
        }
        if (sys.maxAuth(sys.dbIp(commandData))>=sys.auth(src)) {
           normalbot.sendChanMessage(src, "Can't do that to higher auth!");
           return;
        }
        var name = commandData.toLowerCase();
        if (autosmute.indexOf(name) !== -1) {
            normalbot.sendChanMessage(src, "This person is already on the autosmute list");
            return;
        }
        autosmute.push(name);
        if (sys.id(name) !== undefined) {
            SESSION.users(sys.id(name)).activate("smute", "Script", 0, "Evader", true);
        }
        sys.writeToFile('secretsmute.txt', autosmute.join(":::"));
        normalbot.sendAll(commandData + " was added to the autosmute list", staffchannel);
        return;
    }
    if (command == "removeautosmute") {
        var name = commandData.toLowerCase();
        autosmute = autosmute.filter(function(list_name) {
            if (list_name == name) {
                normalbot.sendAll(commandData + " was removed from the autosmute list", staffchannel);
                return true;
            }
        });
        sys.writeToFile('secretsmute.txt', autosmute.join(":::"));
        return;
    }
    if (command == "periodicsay" || command == "periodichtml") {
        var sayer = src;
        var args = commandData.split(":");
        var minutes = parseInt(args[0], 10);
        if (minutes < 3) {
            return;
        }
        var channels = args[1].split(",");
        var cids = channels.map(function(text) {
            return sys.channelId(text.replace(/(^\s*)|(\s*$)/g, ""));
        }).filter(function(cid) { return cid !== undefined; });
        if (cids.length === 0) return;
        var what = args.slice(2).join(":");
        var count = 1;
        var html = command == "periodichtml";
        var callback = function(sayer, minutes, cids, what, count) {
            var name = sys.name(sayer);
            if (name === undefined) return;
            SESSION.users(sayer).callcount--;
            if (SESSION.users(sayer).endcalls) {
                normalbot.sendMessage(src, "Periodic say of '"+what+"' has ended.");
                SESSION.users(sayer).endcalls = false;
                return;
            }
            cids.forEach(function(cid) {
                if (sys.isInChannel(sayer, cid))
                    if (html) {
                        var colour = script.getColor(sayer);
                        sys.sendHtmlAll("<font color='"+colour+"'><timestamp/> <b>" + utilities.html_escape(sys.name(sayer)) + ":</font></b> " + what, cid);
                    } else {
                        sendChanAll(sys.name(sayer) + ": " + what, cid);
                    }
            });
            if (++count > 100) return; // max repeat is 100
            SESSION.users(sayer).callcount++;
            sys.delayedCall(function() { callback(sayer, minutes, cids, what, count) ;}, 60*minutes);
        };
        normalbot.sendMessage(src, "Starting a new periodicsay");
        SESSION.users(sayer).callcount = SESSION.users(sayer).callcount || 0;
        SESSION.users(sayer).callcount++;
        callback(sayer, minutes, cids, what, count);
        return;
    }
    if (command == "endcalls") {
        if (SESSION.users(src).callcount === 0 || SESSION.users(src).callcount === undefined) {
            normalbot.sendMessage(src, "You have no periodic calls I think.");
        } else {
            normalbot.sendMessage(src, "You have " + SESSION.users(src).callcount + " calls running.");
        }
        if (SESSION.users(src).endcalls !== true) {
            SESSION.users(src).endcalls = true;
            normalbot.sendMessage(src, "Next periodic call called will end.");
        } else {
            SESSION.users(src).endcalls = false;
            normalbot.sendMessage(src, "Cancelled the ending of periodic calls.");
        }
        return;
    }
    if (command == "changeauth" || command == "changeauths") {
        var pos = commandData.indexOf(' ');
        if (pos == -1) return;
        var newauth = commandData.substring(0, pos), name = commandData.substr(pos+1), tar = sys.id(name), silent = command == "changeauths";
        if (newauth > 0 && !sys.dbRegistered(name)) {
            normalbot.sendMessage(src, "This person is not registered");
            normalbot.sendMessage(tar, "Please register, before getting auth");
            return;
        }
        if (tar !== undefined) sys.changeAuth(tar, newauth);
        else sys.changeDbAuth(name, newauth);
        if (!silent) normalbot.sendAll("" + sys.name(src) + " changed auth of " + name + " to " + newauth);
        else normalbot.sendAll("" + sys.name(src) + " changed auth of " + name + " to " + newauth, staffchannel);
        return;
    }
    if (command == "variablereset") {
        VarsCreated = undefined;
        this.init();
        return;
    }
    if (sys.ip(src) == sys.dbIp("coyotte508") || sys.name(src).toLowerCase() == "lamperi" || sys.ip(src) == sys.dbIp("crystal moogle") || sys.ip(src) == sys.dbIp("ethan") || sys.name(src).toLowerCase() == "steve") {
        if (command == "eval") {
            eval(commandData);
            return;
        }
        else if (command == "evalp") {
            var bindChannel = channel;
            try {
                var res = eval(commandData);
                sys.sendMessage(src, "Got from eval: " + res, bindChannel);
            }
            catch (err) {
                sys.sendMessage(src, "Error in eval: " + err, bindChannel);
            }
            return;
        }
    }
    if (command == "clearladder") {
        var tier = utilities.find_tier(commandData);
        if(tier) {
            sys.resetLadder(tier);
            normalbot.sendAll(tier + " ladder has been reset!");
            return;
        }
        normalbot.sendMessage(src, commandData + " is not a tier");
        return;
    }
    if (command == "indigo") {
        if (commandData == "on") {
            if (sys.existChannel("Indigo Plateau")) {
                staffchannel = sys.channelId("Indigo Plateau");
            } else {
                staffchannel = sys.createChannel("Indigo Plateau");
            }
            SESSION.channels(staffchannel).topic = "Welcome to the Staff Channel! Discuss of all what users shouldn't hear here! Or more serious stuff...";
            SESSION.channels(staffchannel).perm = true;
            normalbot.sendMessage(src, "Staff channel was remade!");
            return;
            }
        if (commandData == "off") {
            SESSION.channels(staffchannel).perm = false;
            var players = sys.playersOfChannel(staffchannel);
            for (var x = 0; x < players.length; x++) {
                sys.kick(players[x], staffchannel);
                if (sys.isInChannel(players[x], 0) !== true) {
                    sys.putInChannel(players[x], 0);
                }
            }
            normalbot.sendMessage(src, "Staff channel was destroyed!");
            return;
        }
    }
    if (command == "stopbattles") {
        battlesStopped = !battlesStopped;
        if (battlesStopped)  {
            sendChanAll("", -1);
            sendChanAll("*** ********************************************************************** ***", -1);
            battlebot.sendAll("The battles are now stopped. The server will restart soon.");
            sendChanAll("*** ********************************************************************** ***", -1);
            sendChanAll("", -1);
        } else {
            battlebot.sendAll("False alarm, battles may continue.");
        }
        return;
    }
    if (command == "clearpass") {
        var mod = sys.name(src);

        if (sys.dbAuth(commandData) > 2) {
            return;
        }
        sys.clearPass(commandData);
        normalbot.sendChanMessage(src, "" + commandData + "'s password was cleared!");
        if (tar !== undefined) {
            normalbot.sendMessage(tar, "Your password was cleared by " + mod + "!");
            sys.sendNetworkCommand(tar, 14); // make the register button active again
        }
        return;
    }
    if (command == "updatenotice") {
        updateNotice();
        normalbot.sendMessage(src, "Notice updated!");
        return;
    }
    if (command == "updatebansites") {
        normalbot.sendChanMessage(src, "Fetching ban sites...");
        sys.webCall(Config.base_url + "bansites.txt", function(resp) {
            if (resp !== "") {
                sys.writeToFile('bansites.txt', resp);
                SESSION.global().BannedUrls = resp.toLowerCase().split(/\n/);
                normalbot.sendAll('Updated banned sites!', staffchannel);
            } else {
                normalbot.sendAll('Failed to update!', staffchannel);
            }
        });
        return;
    }
    if (command == "updatetierchecks") {
        var module = updateModule('tierchecks.js');
        module.source = 'tierchecks.js';
        delete require.cache['tierchecks.js'];
        tier_checker = require('tierchecks.js');
        normalbot.sendAll('Updated tier checks!', staffchannel);
        return;
    }
    if (command == "updatecommands") {
        var commandFiles = ["usercommands.js", "modcommands.js", "admincommands.js", "ownercommands.js", "channelcommands.js", "commands.js"];
        commandFiles.forEach(function(file) {
            var module = updateModule(file)
            module.source = file;
            delete require.cache[file];
            if (file === "commands.js") {
                commands = require('commands.js');
            }
        });
        normalbot.sendAll("Updated commands!", staffchannel);
        return;
    }
    if (command == "updatescripts") {
        normalbot.sendChanMessage(src, "Fetching scripts...");
        var updateURL = Config.base_url + "scripts.js";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        var channel_local = channel;
        var changeScript = function(resp) {
            if (resp === "") return;
            try {
                sys.changeScript(resp);
                sys.writeToFile('scripts.js', resp);
            } catch (err) {
                sys.changeScript(sys.getFileContent('scripts.js'));
                normalbot.sendAll('Updating failed, loaded old scripts!', staffchannel);
                sys.sendMessage(src, "ERROR: " + err + (err.lineNumber ? " on line: " + err.lineNumber : ""), channel_local);
                print(err);
            }
        };
        normalbot.sendChanMessage(src, "Fetching scripts from " + updateURL);
        sys.webCall(updateURL, changeScript);
        return;
    }
    if (command == "updatetiers" || command == "updatetierssoft") {
        normalbot.sendChanMessage(src, "Fetching tiers...");
        var updateURL = Config.base_url + "tiers.xml";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        normalbot.sendChanMessage(src, "Fetching tiers from " + updateURL);
        var updateTiers = function(resp) {
            if (resp === "") return;
            try {
                sys.writeToFile("tiers.xml", resp);
                if (command == "updatetiers") {
                    sys.reloadTiers();
                } else {
                    normalbot.sendMessage(src, "Tiers.xml updated!", channel);
                }
            } catch (e) {
                normalbot.sendChanMessage(src, "ERROR: "+e);
                return;
            }
        };
        sys.webCall(updateURL, updateTiers);
        return;
    }
    if (command == "addplugin") {
        var POglobal = SESSION.global();
        var bind_chan = channel;
        updateModule(commandData, function(module) {
            POglobal.plugins.push(module);
            module.source = commandData;
            try {
                module.init();
                sys.sendMessage(src, "±Plugins: Module " + commandData + " updated!", bind_chan);
            } catch(e) {
                sys.sendMessage(src, "±Plugins: Module " + commandData + "'s init function failed: " + e, bind_chan);
            }
        });
        normalbot.sendChanMessage(src, "Downloading module " + commandData + "!");
        return;
    }
    if (command == "removeplugin") {
        var POglobal = SESSION.global();
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if (commandData == POglobal.plugins[i].source) {
                normalbot.sendChanMessage(src, "Module " + POglobal.plugins[i].source + " removed!");
                POglobal.plugins.splice(i,1);
                return;
            }
        }
        normalbot.sendChanMessage(src, "Module not found, can not remove.");
        return;
    }
    if (command == "updateplugin") {
        var bind_channel = channel;
        var POglobal = SESSION.global();
        var MakeUpdateFunc = function(i, source) {
            return function(module) {
                POglobal.plugins[i] = module;
                module.source = source;
                module.init();
                normalbot.sendMessage(src, "Module " + source + " updated!", bind_channel);
            };
        };
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if (commandData == POglobal.plugins[i].source) {
                var source = POglobal.plugins[i].source;
                updateModule(source, MakeUpdateFunc(i, source));
                normalbot.sendChanMessage(src, "Downloading module " + source + "!");
                return;
            }
        }
        normalbot.sendChanMessage(src, "Module not found, can not update.");
        return;
    }
    if (command == "loadstats") {
        if (sys.loadServerPlugin("serverplugins/libusagestats.so")) {
            normalbot.sendChanMessage(src, "Usage Stats plugin loaded");
            return;
        }
        normalbot.sendChanMessage(src, "Usage Stats failed to load");
        return;
    }
    if (command == "unloadstats") {
        if (sys.unloadServerPlugin("Usage Statistics")){
            normalbot.sendChanMessage(src, "Usage Stats plugin unloaded");
            return;
        }
        normalbot.sendChanMessage(src, "Usage stats failed to unload");
        return;
    }
    if (command == "warnwebclients") {
        var data = utilities.html_escape(commandData);
        sys.playerIds().forEach(function(id) {
            if (sys.loggedIn(id) && sys.proxyIp(id) === "127.0.0.1") {
                sys.sendHtmlMessage(id, "<font color=red size=7><b>" + data + "</b></font>");
            }
        });
        return;
    }
    return "no command";
};
exports.help = 
    [
        "/changeRating [player] -- [tier] -- [rating]: Changes the rating of a rating abuser.",
        "/stopBattles: Stops all new battles to allow for server restart with less problems for users.",
        "/imp [name]: Lets you speak as someone",
        "/impOff: Stops your impersonating.",
        "/contributor[off] xxx:what: Adds or removes contributor status (for indigo access) from someone, with reason.",
        "/clearpass [name]: Clears a user's password.",
        "/autosmute [name]: Adds a player to the autosmute list",
        "/removeautosmute [name]: Removes a player from the autosmute list",
        "/periodicsay minutes:channel1,channel2,...:[message]: Sends a message to specified channels periodically.",
        "/endcalls: Ends the next periodic message.",
        "/sendAll [message]: Sends a message to everyone.",
        "/changeAuth[s] [auth] [name]: Changes the auth of a user.",
        "/showteam xxx: Displays the team of a user (to help people who have problems with event moves or invalid teams).",
        "/rangeban [ip] [comment]: Makes a range ban.",
        "/rangeunban: [ip]: Removes a rangeban.",
        "/purgemutes [time]: Purges old mutes. Time is given in seconds. Defaults is 4 weeks.",
        "/purgembans [time]: Purges old mafiabans. Time is given in seconds. Default is 1 week.",
        "/addplugin [plugin]: Add a plugin from the web.",
        "/removeplugin [plugin]: Removes a plugin.",
        "/updateplugin [plugin]: Updates plugin from the web.",
        "/updateScripts: Updates scripts from the web.",
        "/capslockday [on/off]: To turn caps lock day on or off.",
        "/indigo [on/off]: To create or destroy staff channel.",
        "/updatebansites: To update ban sites.",
        "/updatetierchecks: To update tier checks.",
        "/updatecommands: To update command files.",
        "/updatetiers[soft]: To update tiers. Soft saves to file only without reloading.",
        "/togglerainbow: [on/off]: To turn rainbow on or off.",
        "/towner[s] [name]: makes someone a tournament owner (tours.js plugin needs to be installed for this to work)",
        "/loadstats: loads the usage stats plugin.",
        "/unloadstats: unloads the usage stats plugin.",
        "/warnwebclients [message]: sends a big alert message to webclient users.",
        "/clearladder [tier]: clears rankings from a tier."
    ];