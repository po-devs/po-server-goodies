exports.handleCommand = function(src, command, commandData, tar, channel) {
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
            normalbot.sendMessage(src, "The IP address looks strange, you might want to correct it: " + subip, channel);
            return;
        }
        script.ipbans.add(subip, "Name: " +sys.name(src) + " Comment: " + script.rangebans.escapeValue(comment));
        normalbot.sendAll("IP ban added successfully for IP subrange: " + subip + " by "+ sys.name(src),staffchannel);
        return;
    }
    if (command == "ipunban") {
        var subip = commandData;
        if (script.ipbans.get(subip) !== undefined) {
            script.ipbans.remove(subip);
            normalbot.sendMessage(src, "IP ban removed successfully for IP subrange: " + subip, channel);
        } else {
            normalbot.sendMessage(src, "No such IP ban.", channel);
        }
        return;
    }
    if (command == "changerating") {
        var data =  commandData.split(' -- ');
        if (data.length != 3) {
            normalbot.sendMessage(src, "You need to give 3 parameters.", channel);
            return;
        }
        var player = data[0];
        var tier = data[1];
        var rating = parseInt(data[2], 10);

        sys.changeRating(player, tier, rating);
        normalbot.sendMessage(src, "Rating of " + player + " in tier " + tier + " was changed to " + rating, channel);
        return;
    }
    if (command == "hiddenauth") {
        sys.sendMessage(src, "*** Hidden Auth ***", channel);
        sys.dbAuths().sort().filter(function(name) { return sys.dbAuth(name) > 3; }).forEach(function(name) {
            sys.sendMessage(src, name + " " + sys.dbAuth(name), channel);
        });
        sys.sendMessage(src, "",channel);
        return;
    }
    if (command == "capslockday") {
        if (commandData == "off") {
            CAPSLOCKDAYALLOW = false;
            normalbot.sendMessage(src, "You turned caps lock day off!", channel);
        }
        else if (commandData == "on") {
            CAPSLOCKDAYALLOW = true;
            normalbot.sendMessage(src, "You turned caps lock day on!", channel);
        }
        return;
    }
    if (command == "contributor") {
        var s = commandData.split(":");
        var name = s[0], reason = s[1];
        if (sys.dbIp(name) === undefined) {
            normalbot.sendMessage(src, name + " couldn't be found.", channel);
            return;
        }
        normalbot.sendMessage(src, name + " is now a contributor!", channel);
        script.contributors.add(name, reason);
        return;
    }
    if (command == "contributoroff") {
        var contrib = "";
        for (var x in script.contributors.hash) {
            if (x.toLowerCase() == commandData.toLowerCase())
            contrib = x;
        }
        if (contrib === "") {
            normalbot.sendMessage(src, commandData + " isn't a contributor.", channel);
            return;
        }
        script.contributors.remove(contrib);
        normalbot.sendMessage(src, commandData + " is no longer a contributor!", channel);
        return;
    }
    if (command == "showteam") {
        var teams = [0,1,2,3,4,5].map(function(index) {
            return script.importable(tar, index);
        }, this).filter(function(data) {
            return data.length > 0;
        }).map(function(team) {
            return "<tr><td><pre>" + team.join("<br>") + "</pre></td></tr>";
        }).join("");
        if (teams) {
            sys.sendHtmlMessage(src, "<table border='2'>" + teams + "</table>",channel);
            normalbot.sendAll(sys.name(src) + " just viewed " + sys.name(tar) + "'s team.", staffchannel);
        } else {
            normalbot.sendMessage(src, "That player has no teams with valid pokemon.", channel);
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
            normalbot.sendMessage(src, "The IP address looks strange, you might want to correct it: " + subip, channel);
            return;
        }

        /* add rangeban */
        script.rangebans.add(subip, script.rangebans.escapeValue(comment) + " --- " + sys.name(src));
        normalbot.sendAll("Rangeban added successfully for IP subrange: " + subip, staffchannel);
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
            sys.sendAll("±Jirachi: "+names.join(", ") + " got range banned by " + sys.name(src), staffchannel);
        }
        return;
    }
    if (command == "rangeunban") {
        var subip = commandData;
        if (script.rangebans.get(subip) !== undefined) {
            script.rangebans.remove(subip);
            normalbot.sendAll("Rangeban removed successfully for IP subrange: " + subip, staffchannel);
        } else {
            normalbot.sendMessage(src, "No such rangeban.", channel);
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
        script.mutes.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0], 10) < limit || (data.length > 3 && parseInt(data[2], 10) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendMessage(src, "" + removed.length + " mutes purged successfully.", channel);
        } else {
            normalbot.sendMessage(src, "No mutes were purged.", channel);
        }
        return;
    }
    if (command == "purgesmutes") {
        var time = parseInt(commandData, 10);
        if (isNaN(time)) {
            time = 60*60*24*7*4;
        }
        var limit = parseInt(sys.time(), 10) - time;
        var removed = [];
        script.smutes.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0], 10) < limit) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendMessage(src, "" + removed.length + " smutes purged successfully.", channel);
            script.smutes.save();
        } else {
            normalbot.sendMessage(src, "No smutes were purged.", channel);
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
        script.mbans.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0], 10) < limit || (data.length > 3 && parseInt(data[2], 10) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendMessage(src, "" + removed.length + " mafiabans purged successfully.", channel);
        } else {
            normalbot.sendMessage(src, "No mafiabans were purged.", channel);
        }
        return;
    }
    if (command == "clearprofiling") {
        sys.resetProfiling();
        normalbot.sendMessage(src, "Profiling information successfully cleared.", channel);
        return;
    }
    if (command == "sendall") {
        sys.sendAll(commandData, channel);
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
        normalbot.sendMessage(src, "Now you are " + SESSION.users(src).impersonation + "!", channel);
        return;
    }
    if (command == "impoff") {
        delete SESSION.users(src).impersonation;
        normalbot.sendMessage(src, "Now you are yourself!", channel);
        return;
    }
    if (command == "autosmute") {
        if(sys.dbIp(commandData) === undefined) {
            normalbot.sendMessage(src, "No player exists by this name!", channel);
            return;
        }
        if (sys.maxAuth(sys.dbIp(commandData))>=sys.auth(src)) {
           normalbot.sendMessage(src, "Can't do that to higher auth!", channel);
           return;
        }
        var name = commandData.toLowerCase();
        if (autosmute.indexOf(name) !== -1) {
            normalbot.sendMessage(src, "This person is already on the autosmute list", channel);
            return;
        }
        autosmute.push(name);
        if (sys.id(name) !== undefined) {
            SESSION.users(sys.id(name)).activate("smute", "Script", 0, "Evader", true);
        }
        sys.writeToFile(Config.dataDir + 'secretsmute.txt', autosmute.join(":::"));
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
        sys.writeToFile(Config.dataDir + 'secretsmute.txt', autosmute.join(":::"));
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
                        sys.sendAll(sys.name(sayer) + ": " + what, cid);
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
        script.init();
        return;
    }
    if (sys.ip(src) == sys.dbIp("coyotte508") || sys.name(src).toLowerCase() == "lamperi" || sys.ip(src) == sys.dbIp("crystal moogle") || sys.name(src).toLowerCase() == "steve") {
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
    if (command == "clearladder" || command == "resetladder") {
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
            sys.sendAll("");
            sys.sendAll("*** ********************************************************************** ***");
            battlebot.sendAll("The battles are now stopped. The server will restart soon.");
            sys.sendAll("*** ********************************************************************** ***");
            sys.sendAll("");
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
        normalbot.sendMessage(src, "" + commandData + "'s password was cleared!", channel);
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
        normalbot.sendMessage(src, "Fetching ban sites...", channel);
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
        sys.playerIds().forEach(function(id) {
            for (var team = 0; team < sys.teamCount(id); team++) {
                if (!tier_checker.has_legal_team_for_tier(id, team, sys.tier(id, team))) {
                    tier_checker.find_good_tier(id, team);
                    normalbot.sendMessage(id, "You were placed into '" + sys.tier(id, team) + "' tier.");
                }
            }
        });
        return;
    }
    if (command == "updatecommands") {
        var commandFiles = ["usercommands.js", "modcommands.js", "admincommands.js", "ownercommands.js", "channelcommands.js", "commands.js"];
        commandFiles.forEach(function(file) {
            var module = updateModule(file);
            module.source = file;
            delete require.cache[file];
            if (file === "commands.js") {
                commands = require('commands.js');
            }
        });
        normalbot.sendAll("Updated commands!", staffchannel);
        return;
    }
    if (command == "updatechannels") {
        var commandFiles = ["channelfunctions.js", "channelmanager.js"];
        commandFiles.forEach(function(file) {
            var module = updateModule(file);
            module.source = file;
            delete require.cache[file];
            if (file === "channelfunctions.js") { 
                POChannel = require(file).POChannel;
            }
            if (file === "channelmanager.js") { 
                POChannelManager = require(file).POChannelManager;
            }
        });
        normalbot.sendAll("Updated channel functions!", staffchannel);
        return;
    }
    if (command == "updateusers") {
        var file = "userfunctions.js";
        var module = updateModule(file);
        module.source = file;
        delete require.cache[file];
        POUser = require(file).POUser;
        normalbot.sendAll("Updated user functions!", staffchannel);
        return;
    }
    if (command == "updateglobal") {
        var file = "globalfunctions.js";
        var module = updateModule(file);
        module.source = file;
        delete require.cache[file];
        POGlobal = require(file).POGlobal;
        normalbot.sendAll("Updated global functions!", staffchannel);
        return;
    }
    if (command == "updatescripts") {
        normalbot.sendMessage(src, "Fetching scripts...", channel);
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
        normalbot.sendMessage(src, "Fetching scripts from " + updateURL, channel);
        sys.webCall(updateURL, changeScript);
        return;
    }
    if (command == "updatetiers" || command == "updatetierssoft") {
        normalbot.sendMessage(src, "Fetching tiers...", channel);
        var updateURL = Config.base_url + "tiers.xml";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        normalbot.sendMessage(src, "Fetching tiers from " + updateURL, channel);
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
                normalbot.sendMessage(src, "ERROR: "+e, channel);
                return;
            }
        };
        sys.webCall(updateURL, updateTiers);
        return;
    }
    if (command == "updategenmoves") {
        sys.webCall(Config.base_url + Config.dataDir + 'all_gen_moves.txt', function (resp) {
            sys.writeToFile(Config.dataDir + "all_gen_moves.txt", resp);
            allGenMovesList = false;
            normalbot.sendAll("Updated pokebank moves!", staffchannel);
        });
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
        normalbot.sendMessage(src, "Downloading module " + commandData + "!", channel);
        return;
    }
    if (command == "removeplugin") {
        var POglobal = SESSION.global();
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if (commandData == POglobal.plugins[i].source) {
                normalbot.sendMessage(src, "Module " + POglobal.plugins[i].source + " removed!", channel);
                POglobal.plugins.splice(i,1);
                return;
            }
        }
        normalbot.sendMessage(src, "Module not found, can not remove.", channel);
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
                normalbot.sendMessage(src, "Downloading module " + source + "!", channel);
                return;
            }
        }
        normalbot.sendMessage(src, "Module not found, can not update.", channel);
        return;
    }
    if (command == "loadstats") {
        sys.loadBattlePlugin("serverplugins/libusagestats_debug.so");
        normalbot.sendMessage(src, "Usage Stats plugin loaded", channel);
        return;
    }
    if (command == "unloadstats") {
        sys.unloadBattlePlugin("Usage Statistics");
        normalbot.sendMessage(src, "Usage Stats plugin unloaded", channel);
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
    if (command == "advertise") {
        if (!commandData) {
            return;
        }
        ["Tohjo Falls", "Trivia", "Tournaments", "Indigo Plateau", "Victory Road", "TrivReview", "Mafia", "Hangman"].forEach(function(c) {
            sys.sendHtmlAll("<font size = 4><b>"+commandData+"</b></font>", sys.channelId(c));
        });
        return;
    }
    
    if (command == "tempmod" || command == "tempadmin") {
        if (!commandData || !sys.loggedIn(sys.id(commandData))) {
            normalbot.sendMessage(src, "Target must be logged in", channel);
            return;
        }
        var tar = sys.id(commandData);
        var type = (command === "tempmod" ? "mod" : "admin");
        if (sys.auth(tar) > 0 && type === "mod" || sys.auth(tar) > 1 && type === "admin") {
            normalbot.sendMessage(src, "They are already " + type, channel);
            return;
        }
        if (sys.auth(tar) < 1 && type === "admin") { 
            normalbot.sendMessage(src, "Can only use on current mods", channel);
            return;
        }
        if (type === "mod") {
            SESSION.users(tar).tempMod = true;
        } else {
            SESSION.users(tar).tempAdmin = true;
        }
        normalbot.sendAll(commandData.toCorrectCase() + " was made temp " + type, staffchannel);
        return;
    }
    
    if (command == "detempmod" || command == "detempadmin" || command == "detempauth") {
        if (!commandData || !sys.loggedIn(sys.id(commandData))) {
            normalbot.sendMessage(src, "Target must be logged in", channel);
            return;
        }
        var tar = sys.id(commandData);
        delete SESSION.users(tar).tempMod;
        delete SESSION.users(tar).tempAdmin;
        normalbot.sendAll(commandData.toCorrectCase() + "'s temp auth was removed", staffchannel);
        return;
    }
    return "no command";
};
exports.help = 
    [
        "/changerating: Changes the rating of a rating abuser. Format is /changerating user -- tier -- rating.",
        "/stopbattles: Stops all new battles to allow for server restart with less problems for users.",
        "/hiddenauth: Displays all users with more higher auth than 3.",
        "/imp: Lets you speak as someone",
        "/impoff: Stops your impersonating.",
        "/sendmessage: Sends a chat message to a user. Format is /sendmessage user:::message:::channel.",
        "/sendhtmlmessage: Sends an HTML chat message to a user. Format is /sendmessage user:::message:::channel.",
        "/contributor: Adds contributor status (for indigo access) to a user, with reason. Format is /contributor user:reason.",
        "/contributoroff: Removes contributor status from a user.",
        "/clearpass: Clears a user's password.",
        "/autosmute: Adds a user to the autosmute list",
        "/removeautosmute: Removes a user from the autosmute list",
        "/periodicsay: Sends a message to specified channels periodically. Format is /periodicsay minutes:channel1,channel2,...:message",
        "/periodichtml: Sends a message to specified channels periodically, using HTML formatting. Format is /periodichtml minutes:channel1,channel2,...:message",
        "/endcalls: Ends the next periodic message.",
        "/sendall: Sends a message to everyone.",
        "/changeauth[s]: Changes the auth of a user. Format is /changeauth auth user. If using /changeauths, the change will be silent.",
        "/showteam: Displays the team of a user (to help people who have problems with event moves or invalid teams).",
        "/ipban: Bans an IP. Format is /ipban ip comment.",
        "/ipunban: Unbans an IP.",
        "/rangeban: Makes a range ban. Format is /rangeban ip comment.",
        "/rangeunban: Removes a rangeban.",
        "/purgemutes: Purges mutes older than the given time in seconds. Default is 4 weeks.",
        "/purgesmutes: Purges smutes older than the given time in seconds. Default is 4 weeks.",
        "/purgembans: Purges mafiabans older than the given time in seconds. Default is 1 week.",
        "/clearprofiling: Clears all profiling info.",
        "/addplugin: Add a plugin from the web.",
        "/removeplugin: Removes a plugin.",
        "/updateplugin: Updates plugin from the web.",
        "/updatenotice: Updates notice from the web.",
        "/updatescripts: Updates scripts from the web.",
        "/variablereset: Resets scripts variables.",
        "/capslockday [on/off]: To turn caps lock day on or off.",
        "/indigo [on/off]: To create or destroy staff channel.",
        "/updatebansites: To update ban sites.",
        "/updatetierchecks: To update tier checks.",
        "/updatecommands: To update command files.",
        "/updatetiers[soft]: To update tiers. Soft saves to file only without reloading.",
        "/loadstats: Loads the usage stats plugin.",
        "/unloadstats: Unloads the usage stats plugin.",
        "/warnwebclients: Sends a big alert with your message to webclient users.",
        "/clearladder: Clears rankings from a tier.",
        "/advertise: Sends a html message to the main channels",
        "/tempmod/admin: Gives temporary auth to a user. Lasts until they log out",
        "/detempauth: Removes temporary auth given to a user"
    ];
