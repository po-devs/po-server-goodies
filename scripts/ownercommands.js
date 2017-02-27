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
    if (command == "perm") {
        if (channel == staffchannel || channel === 0) {
            channelbot.sendMessage(src, "you can't do that here.", channel);
            return;
        }

        SESSION.channels(channel).perm = (commandData.toLowerCase() == 'on');
        SESSION.global().channelManager.update(channel);
        channelbot.sendAll("" + sys.name(src) + (SESSION.channels(channel).perm ? " made the channel permanent." : " made the channel a temporary channel again."), channel);
        return;
    }
    if (command == "changerating") {
        var data =  commandData.split(':::');
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
    if (command == "rangeban") {
        var subip;
        var comment;
        /*Temporary work around for IP issue*/
        var ffff = commandData.indexOf("::ffff:");
        var prepend = "";
        if (ffff != -1) {
            commandData = commandData.replace("::ffff:", "");
            prepend = "::ffff:";
        }
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
        script.rangebans.add(prepend + subip, script.rangebans.escapeValue(comment) + " --- " + sys.name(src));
        normalbot.sendAll("Rangeban added successfully for IP subrange: " + prepend + subip, staffchannel);
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
    if (command == "sendhtmlall") {
        sys.sendHtmlAll(commandData, channel);
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
            SESSION.users(sys.id(name)).activate("smute", "Script", parseInt(sys.time(), 10) + 86400, "Evader", true);
        }
        sys.writeToFile(Config.dataDir + 'secretsmute.txt', autosmute.join(":::"));
        normalbot.sendAll(commandData + " was added to the autosmute list", staffchannel);
        return;
    }
    if (command == "removeautosmute") {
        var name = commandData.toLowerCase();
        var i = autosmute.indexOf(name);
        if (i > -1) {
            normalbot.sendAll(autosmute[i] + " was removed from the autosmute list.", staffchannel);
            autosmute.splice(i, 1);
            sys.writeToFile(Config.dataDir + "secretsmute.txt", autosmute.join(":::"));
            return;
        }
        normalbot.sendMessage(src, "No such user in the autosmute list!");
        return;
    }
    if (command == "periodicsay" || command == "periodichtml") {
        var sayer = src;
        var args = commandData.split(":::");
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
        if (!SESSION.users(src).endcalls) {
            SESSION.users(src).endcalls = true;
            normalbot.sendMessage(src, "Next periodic call called will end.");
        } else {
            SESSION.users(src).endcalls = false;
            normalbot.sendMessage(src, "Cancelled the ending of periodic calls.");
        }
        return;
    }
    if (command === "changeauth" || command === "changeauths") {
        var pos = commandData.indexOf(" ");
        if (pos === -1) return;
        var newAuth = commandData.substring(0, pos),
            name = commandData.substr(pos + 1),
            tar = sys.id(name),
            silent = command === "changeauths";
        if (!isNaN(newAuth)) {
            newAuth = (newAuth < 0 ? 0 : newAuth);
        }
        if (newAuth > 0 && !sys.dbRegistered(name)) {
            normalbot.sendMessage(src, "This person is not registered");
            normalbot.sendMessage(tar, "Please register, before getting auth");
            return;
        }
        if (tar !== undefined) sys.changeAuth(tar, newAuth);
        else sys.changeDbAuth(name, newAuth);
        if (!silent) normalbot.sendAll(sys.name(src) + " changed auth of " + name + " to " + newAuth);
        else normalbot.sendAll(sys.name(src) + " changed auth of " + name + " to " + newAuth, staffchannel);
        return;
    }
    if (command == "variablereset") {
        VarsCreated = undefined;
        script.init();
        return;
    }
    if (sys.ip(src) == sys.dbIp("coyotte508") || sys.name(src).toLowerCase() == "steve" || sys.ip(src) == sys.dbIp("fuzzysqurl") || sys.ip(src) == sys.dbIp("professor oak") || sys.ip(src) == sys.dbIp("strudels")) {
        if (command === "eval") {
            if (commandData === undefined) {
                normalbot.sendMessage(src, "Define code to execute. Proceed with caution as you can break stuff.", channel);
                return;
            }
            try {
                eval(commandData);
            } catch (error) {
                normalbot.sendMessage(src, error, channel);
            }
            return;
        }
        if (command === "evalp") {
            if (commandData === undefined) {
                normalbot.sendMessage(src, "Define code to execute. Proceed with caution as you can break stuff.", channel);
                return;
            }
            try {
                var result = eval(commandData);
                normalbot.sendMessage(src, "Type: '" + (typeof result) + "'", channel);
                normalbot.sendMessage(src, "Got from eval: '" + result + "'", channel);
            } catch (error) {
                normalbot.sendMessage(src, "Error in eval: " + error, channel);
            }
            return;
        }
        if (command === "evalobj" || command === "evalobjp") {
            if (commandData === undefined) {
                normalbot.sendMessage(src, "Enter an object to print. Example: global or sys.", channel);
                return;
            }
            try {
                var x, objKeys = Object.keys(eval(commandData)), listArray = [];
                normalbot.sendMessage(src, "Printing " + commandData + ".keys", channel);
                for (x = 0; x < objKeys.length; x++) {
                    sys.sendMessage(src, "." + objKeys[x] + (command === "objp" ? ": " + eval(commandData)[objKeys[x]] : ""), channel);
                }
                normalbot.sendMessage(src, "Done.", channel);
            } catch (error) {
                normalbot.sendMessage(src, error, channel);
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
    if (command == "stopbattles") {
        script.battlesStopped = !script.battlesStopped;
        if (script.battlesStopped)  {
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
        if (!commandData || !sys.dbRegistered(commandData)) {
            return;
        }
        var mod = sys.name(src);

        if (sys.dbAuth(commandData) > 2) {
            normalbot.sendMessage(src, commandData + "'s password could not be cleared as it is an owner account!", channel);
            return;
        }
        sys.clearPass(commandData);
        normalbot.sendAll(commandData + "'s password was cleared by " + nonFlashing(mod) + "!", staffchannel);
        if (tar !== undefined) {
            normalbot.sendMessage(tar, "Your password was cleared by " + mod + "!");
            sys.sendNetworkCommand(tar, 14); // make the register button active again
        }
        return;
    }
    if (command === "updatenotice" || command === "updatenoticesilent") {
        var url = Config.base_url + "notice.html";
        sys.webCall(url, function (resp){
            if (resp !== "") {
                sys.writeToFile(Config.dataDir + "notice.html", resp);
                normalbot.sendMessage(src, "Notice updated!", channel);
                if (command === "updatenotice") {
                    sendNotice();
                }
            } else {
                normalbot.sendAll("Failed to update notice!", staffchannel);
            }
        });
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
    if (command === "updatefile") {
        var files = ["crc32.js", "utilities.js", "bot.js", "memoryhash.js", "pokedex.js"];
        if (commandData === "" || files.indexOf(commandData.toLowerCase()) === -1) {
            normalbot.sendMessage(src, "File '" + commandData + "' not found.", channel);
            return;
        }
        var fileName = files[files.indexOf(commandData.toLowerCase())];
        var module = updateModule(fileName);
        module.source = fileName;
        delete require.cache[fileName];
        switch (fileName) {
            case "crc32.js":
                crc32 = require(fileName).crc32;
                break;
            case "utilities.js":
                utilities = require(fileName);
                break;
            case "bot.js":
                Bot = require(fileName).Bot;
                break;
            case "memoryhash.js":
                MemoryHash = require(fileName).MemoryHash;
                break;
            case "pokedex.js":
                pokedex = require(fileName);
                break;
        }
        normalbot.sendAll("File " + fileName + " was updated!", staffchannel);
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
                normalbot.sendAll(err + (err.lineNumber ? " on line: " + err.lineNumber : "") + ". Using old scripts instead!", staffchannel);
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
                normalbot.sendAll(e + (e.lineNumber ? " on line: " + e.lineNumber : ""), staffchannel);
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
        var POglobal = SESSION.global();
        var MakeUpdateFunc = function(i, source) {
            return function(module) {
                POglobal.plugins[i] = module;
                module.source = source;
                module.init();
                normalbot.sendAll("Module " + source + " updated!", staffchannel);
            };
        };
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if (commandData == POglobal.plugins[i].source) {
                if (commandData === "battlefactory.js") {
                    require("battlefactory.js").saveSets();
                }
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
        sys.loadBattlePlugin("battleserverplugins/libusagestats_debug.so");
        normalbot.sendMessage(src, "Usage Stats plugin loaded", channel);
        return;
    }
    if (command == "loadreplays") {
        sys.loadBattlePlugin("battleserverplugins/libbattlelogs_debug.so");
        normalbot.sendMessage(src, "Replay plugin loaded", channel);
        return;
    }
    if (command == "unloadstats") {
        sys.unloadBattlePlugin("Usage Statistics");
        normalbot.sendMessage(src, "Usage Stats plugin unloaded", channel);
        return;
    }
    if (command == "unloadreplays") {
        sys.unloadBattlePlugin("Battle Logs");
        normalbot.sendMessage(src, "Replay plugin unloaded", channel);
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
        /*["Tohjo Falls", "Trivia", "Tournaments", "Indigo Plateau", "Victory Road", "TrivReview", "Mafia", "Hangman"].forEach(function(c) {
            sys.sendHtmlAll("<font size = 4><b>"+commandData+"</b></font>", sys.channelId(c));
        });*/
        sys.sendHtmlAll("<font size = 4><b>"+commandData+"</b></font>");
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
    if (command == "setwebannouncement" || command == "setannouncement") {
        var updateURL = Config.base_url + "announcement.html";
        sys.webCall(updateURL, function(resp) {
            sys.changeAnnouncement(resp);
        });
        return;
    }
    if (command == "testwebannouncement" || command == "testannouncement") {
        var updateURL = Config.base_url + "announcement.html";
        sys.webCall(updateURL, function(resp) {
            sys.setAnnouncement(resp, src);
        });
        return;
    }
    if (command == "updateleague") {
        var updateURL = Config.base_url + "league.json";
        sys.webCall(updateURL, function(resp) {
            try { 
                script.league = JSON.parse(resp).league;
                sys.write(Config.dataDir+"league.json", resp);
                normalbot.sendMessage(src, "League file updated!", channel);
            }
            catch (e) {
                normalbot.sendMessage(src, "There was an error with the league file", channel);
            }
        });
        return;
    }
    if (command === "whoviewed") {
        if (!commandData) {
            normalbot.sendMessage(src, "No name entered", channel);
            return;
        }
        var banned = sys.getFileContent("scriptdata/showteamlog.txt").split("\n").filter(function(s) {
            return s.toLowerCase().indexOf(commandData.toLowerCase()) != -1;
        });
        normalbot.sendMessage(src, banned.length > 1 ? banned.join(", ") : commandData + " has no current teamviews", channel);
        return;
    }
    return "no command";
};
exports.help = 
    [
        "/changerating: Changes the rating of a rating abuser. Format is /changerating user:::tier::rating.",
        "/stopbattles: Stops all new battles to allow for server restart with less problems for users.",
        "/hiddenauth: Displays all users with more higher auth than 3.",
        "/imp[off]: Lets you speak as someone",
        "/perm [on/off]: Make the current permanent channel or not (permanent channels remain listed when they have no users).",
        "/sendmessage: Sends a chat message to a user. Format is /sendmessage user:::message:::channel. Use /sendhtmlmessage for a message with HTML Format.",
        "/contributor[off]: Adds contributor status (for indigo access) to a user, with reason. Format is /contributor user:reason.",
        "/clearpass: Clears a user's password.",
        "/autosmute: Adds a user to the autosmute list",
        "/removeautosmute: Removes a user from the autosmute list",
        "/periodicsay: Sends a message to specified channels periodically. Format is /periodicsay minutes:::channel1,channel2,...:::message. Use /periodichtml for a message with HTML formatting.",
        "/endcalls: Ends the next periodic message.",
        "/sendall: Sends a message to everyone. Use /sendhtmlall for a message with HTML formatting.",
        "/changeauth[s]: Changes the auth of a user. Format is /changeauth auth user. If using /changeauths, the change will be silent.",
        "/ip[un]ban: Bans an IP. Format is /ipban ip comment.",
        "/range[un]ban: Makes a range ban. Format is /rangeban ip comment.",
        "/purgemutes: Purges mutes older than the given time in seconds. Default is 4 weeks.",
        "/purgesmutes: Purges smutes older than the given time in seconds. Default is 4 weeks.",
        "/purgembans: Purges mafiabans older than the given time in seconds. Default is 1 week.",
        "/clearprofiling: Clears all profiling info.",
        "/addplugin: Add a plugin from the web.",
        "/removeplugin: Removes a plugin.",
        "/updateplugin: Updates plugin from the web.",
        "/updatenotice[silent]: Updates notice from the web. Silent updates but doesn't force it to rebroadcast.",
        "/updatescripts: Updates scripts from the web.",
        "/variablereset: Resets scripts variables.",
        "/updatebansites: To update ban sites.",
        "/updatetierchecks: To update tier checks.",
        "/updatecommands: To update command files. Update scripts afterwards for full effect.",
        "/updatetiers[soft]: To update tiers. Soft saves to file only without reloading.",
        "/[un]loadstats: Loads the usage stats plugin.",
        "/[un]loadreplays: Loads the replay plugin.",
        "/warnwebclients: Sends a big alert with your message to webclient users.",
        "/clearladder: Clears rankings from a tier.",
        "/advertise: Sends a html message to the main channels",
        "/tempmod/admin: Gives temporary auth to a user. Lasts until they log out",
        "/detempauth: Removes temporary auth given to a user",
        "/testannouncement: Test the current announcement on Github (only shows for the command user)",
        "/setannouncement: Sets the announcement to the one on Github",
        "/updateleague: Updates the league data from Github",
        "/whoviewed: Lists who viewed the team of another player and when it was done."
    ];