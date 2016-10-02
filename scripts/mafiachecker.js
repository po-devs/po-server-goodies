/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global module, SESSION, updateModule*/
function mafiaChecker() {
    this.init = function() {}; //just so it can be updated without sending an error (see auto_smute.js)
    var theme,
        minorErrors,
        fatalErrors,
        noMinor,
        noFatal,
        globalStats,
        possibleNightActions = ["kill", "protect", "inspect", "distract", "poison", "safeguard", "stalk", "watch", "convert", "curse", "copy", "detox", "dispel", "shield", "guard", "massconvert", "disguise", "redirect", "dummy", "dummy2", "dummy3", "dummy4", "dummy5", "dummy6", "dummy7", "dummy8", "dummy9", "dummy10" ],
        badCommands = ["me", "commands", "start", "votetheme", "starttheme", "help", "roles", "sides", "myrole", "mafiarules", "themes", "themeinfo", "changelog", "details", "priority", "flashme", "playedgames", "update", "join", "unjoin", "mafiaadmins", "mafiaban", "mafiaunban", "passma", "mafiaadmin", "mafiaadminoff", "mafiasadmin", "mafiasuperadmin", "mafiasadminoff", "mafiasuperadminoff", "push", "slay", "shove", "end", "readlog", "add", "remove", "disable", "enable", "updateafter", "importold", "mafiaban", "mafiaunban", "mafiabans", "detained", "detainlist", "ban", "mute", "kick", "k", "mas", "ck", "cmute", "admin", "op", "owner", "invite", "member", "deadmin", "deregister", "deop", "demember", "deadmin", "lt", "featured", "featuretheme", "featurelink", "featuretext", "forcefeature", "ctogglecaps", "ctoggleflood", "topic", "cauth", "register", "deinvite", "cmeon", "cmeoff", "csilence", "csilenceoff", "cunmute", "cmutes", "cbans", "inviteonly", "ctoggleswear", "enabletours", "disabletours", "tempban", "say", "pokemon", "nature", "natures", "item", "ability", "notice", "featuredtheme"];
    
    this.checkTheme = function(raw) {
        minorErrors = [];
        fatalErrors = [];
        noMinor = true;
        noFatal = true;
        

        theme = new Theme();
        theme.correctRoles = [];
        theme.lowerCaseRoles = [];
        theme.correctSides = [];
        theme.lowerCaseSides = [];
        globalStats = raw.stats || {};
        
        for (var st in globalStats) {
        	possibleNightActions = possibleNightActions.concat("stat:" + st);
        }

        // Parse variables first - so we can extract the actual value later.
        theme.variables = raw.variables;
        
        var it, prop;
        // This is only done when variables are available.
        if (Object.prototype.toString.call(theme.variables) === '[object Object]') {
            // Iterate over the entire theme, parsing variable:(name) strings.
            for (it in raw) {
                prop = raw[it];
                assignVariable(raw, it, prop, theme.variables, "Global");
            }
        }
        
        try {
            var i=2, lists = [];
            while ("roles"+i in raw) {
                lists.push("roles"+i);
                ++i;
            }
            checkAttributes(raw, ["name", "sides", "roles", "roles1"], ["villageCantLoseRoles", "author", "summary", "border", "killmsg", "killusermsg", "votemsg", "lynchmsg", "tiedvotemsg", "novotemsg", "drawmsg", "minplayers", "noplur", "nolynch", "votesniping", "checkNoVoters", "quickOnDeadRoles", "ticks", "silentVote", "delayedConversionMsg", "nonPeak", "changelog", "changelog2", "threadlink", "altname", "tips", "closedSetup", "macro", "variables", "spawnPacks", "silentNight", "rolesAreNames", "bot", "borderColor", "stats"].concat(lists), "Your theme");

            if (checkType(raw.name, ["string"], "'theme.name'")) {
                if (raw.name[raw.name.length - 1] == " ") {
                    addFatalError("Your theme has an extra whitespace at the end of its name, which will make it impossible to update.");
                }
                if (raw.name.indexOf("  ") >= 0) {
                    addFatalError("Your theme has a double whitespace on its name, which will make it impossible to update.");
                }
            }
            checkType(raw.sides, ["array"], "'theme.sides'");
            checkType(raw.roles, ["array"], "'theme.roles'");

            
            if (checkType(raw.author, ["string", "array"], "'theme.author'")) {
                if (Array.isArray(raw.author)) {
                    for (i in raw.author) {
                        if (!checkType(raw.author[i], ["string"], "All names in 'theme.author'")) {
                            break;
                        }
                    }
                }
            }
            
            checkType(raw.summary, ["string"], "'theme.summary'");
            checkType(raw.borderColor, ["string"], "'theme.borderColor'");
            checkType(raw.border, ["string"], "'theme.border'");
            checkType(raw.killmsg, ["string"], "'theme.killmsg'");
            checkType(raw.killusermsg, ["string"], "'theme.killusermsg'");
            checkType(raw.votemsg, ["string"], "'theme.votemsg'");
            checkType(raw.lynchmsg, ["string"], "'theme.lynchmsg'");
            checkType(raw.tiedvotemsg, ["string"], "'theme.tiedvotemsg'");
            checkType(raw.novotemsg, ["string"], "'theme.novotemsg'");
            checkType(raw.drawmsg, ["string"], "'theme.drawmsg'");
            checkType(raw.minplayers, ["number"], "'theme.minplayers'");
            checkType(raw.threadlink, ["string"], "'theme.threadlink'");
            checkType(raw.altname, ["string"], "'theme.altname'");
            checkType(raw.variables, ["object"], "'theme.variables'");
            checkType(raw.stats, ["object"], "'theme.stats'");
            checkValidValue(raw.nolynch, [true, false], "theme.nolynch");
            checkValidValue(raw.noplur, [true, false], "theme.noplur");
            checkValidValue(raw.votesniping, [true, false], "theme.votesniping");
            checkValidValue(raw.silentVote, [true, false], "theme.silentVote");
            checkValidValue(raw.checkNoVoters, [true, false], "theme.checkNoVoters");
            checkValidValue(raw.quickOnDeadRoles, [true, false], "theme.quickOnDeadRoles");
            checkValidValue(raw.delayedConversionMsg, [true, false], "theme.delayedConversionMsg");
            checkValidValue(raw.nonPeak, [true, false], "theme.nonPeak");
            checkValidValue(raw.closedSetup, [true, false, "full", "team"], "theme.closedSetup");
            checkValidValue(raw.macro, [true, false], "theme.macro");
            checkValidValue(raw.silentNight, [true, false], "theme.silentNight");
            checkValidValue(raw.rolesAreNames, [true, false], "theme.rolesAreNames");
            
            if (checkType(raw.changelog, ["object", "array"], "'theme.changelog'")) {
                for (i in raw.changelog) {
                    if (!checkType(raw.changelog[i], ["string"], "All values for 'theme.changelog'")) {
                        break;
                    }
                }
            }
            if (checkType(raw.tips, ["object", "array"], "'theme.tips'")) {
                for (i in raw.tips) {
                    if (!checkType(raw.tips[i], ["string"], "All values for 'theme.tips'")) {
                        break;
                    }
                }
            }
            
            if (checkType(raw.ticks, ["object"], "'theme.ticks'")) {
                checkAttributes(raw.ticks, [], ["night", "night1", "standby"], "theme.ticks");
                checkType(raw.ticks.night, ["number"], "'theme.ticks.night'");
                checkType(raw.ticks.night1, ["number"], "'theme.ticks.night1'");
                checkType(raw.ticks.standby, ["number"], "'theme.ticks.standby'");
            }
            
            if (checkType(raw.bot, ["object"], "'theme.bot'")) {
                checkAttributes(raw.bot, [], ["name", "color"], "theme.bot");
                checkType(raw.bot.name, ["string"], "'theme.bot.name'");
                checkType(raw.bot.color, ["string"], "'theme.bot.color'");
            }

            theme.sideTranslations = {};
            theme.roles = {};

            // Init from the theme
            for (i in raw.sides) {
                theme.addSide(raw.sides[i]);
            }
            for (i in raw.roles) {
                theme.addRole(raw.roles[i]);
            }

            i = 1;
            var roleList, e;
            while ("roles"+i in raw) {
                roleList = raw["roles" + i];
                if (checkType(roleList, ["array"], "'theme.roles" + i + "'")) {
                    for (e = 0; e < roleList.length; ++e) {
                        if (typeof roleList[e] == "object") {
                            for (var c in roleList[e]) {
                                checkValidRole(c, "theme.roles" + i);
                            }
                        } else {
                            if (roleList[e].indexOf("pack:") === 0) {
                                if (!("spawnPacks" in raw)) {
                                    addFatalError("Your theme use spawnPacks. but no 'spawnPack' object was found in your theme.");
                                } else if (!(roleList[e].substr(5) in raw.spawnPacks)) {
                                    addFatalError("Invalid spawnPack '" + roleList[e].substr(5) + "' found on theme.roles" + i + ".");
                                }
                            } else {
                                checkValidRole(roleList[e], "theme.roles" + i);
                            }
                        }
                    }
                }
                ++i;
            }

            if (!raw.roles1) {
                addFatalError("This theme has no roles1, it can not be played.");
            }
            
            if (checkType(raw.spawnPacks, ["object"], "'theme.spawnPacks'")) {
                var pack, p;
                for (e in raw.spawnPacks) {
                    pack = raw.spawnPacks[e];
                    checkAttributes(pack, ["roles"], ["chance"], "theme.spawnPacks." + e);
                    
                    if (checkType(pack.roles, ["array"], "'theme.spawnPacks." + e + ".roles'")) {
                        for (i in pack.roles) {
                            if (checkType(pack.roles[i], ["array"], "All values for 'theme.spawnPacks." + e + ".roles'")) {
                                if (pack.roles[i].length === 0) {
                                    addFatalError("spawnPack '" + e + ".roles." + i + "' must have at least 1 role.");
                                } else {
                                    for (p in pack.roles[i]) {
                                        checkValidRole(pack.roles[i][p], "theme.spawnPacks." + e + ".roles." + p);
                                    }
                                }
                            }
                        }
                    }
                    if (checkType(pack.chance, ["array"], "'theme.spawnPacks." + e + ".chance'")) {
                        for (i in pack.chance) {
                            if (!checkType(pack.chance[i], ["number"], "All values for 'theme.spawnPacks." + e + ".chance'")) {
                                break;
                            }
                        }
                    }
                    
                    if (pack.roles && pack.chance && pack.roles.length !== pack.chance.length) {
                        addFatalError("spawnPack '" + e + "' must have the same number of lists and values under 'roles' and 'chance'.");
                    }
                }
            }
            
            if ("villageCantLoseRoles" in raw) {
                var cantLose = raw.villageCantLoseRoles;
                if (checkType(cantLose, ["array"], "'theme.villageCantLoseRoles'")) {
                    for (e = 0; e < cantLose.length; ++e) {
                        checkValidRole(cantLose[e], "theme.villageCantLoseRoles");
                    }
                }
            }

            theme.addActions();
            theme.checkActions();
        } catch (err) {
            addFatalError("Couldn't check the entire code. The following error has occured: " +  err + (err.lineNumber ? " on line: " + err.lineNumber : ""));
        }
        
        return {fatal: fatalErrors, minor: minorErrors};

    };
    this.update = function () {
        var POglobal = SESSION.global();
        var index, source;
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if ("mafiachecker.js" == POglobal.plugins[i].source) {
                source = POglobal.plugins[i].source;
                index = i;
            }
        }
        if (index !== undefined) {
            updateModule(source, function (module) {
                POglobal.plugins[index] = module;
                module.source = source;
                module.init();
            });
        }
    };
    
    function Theme(){}
    Theme.prototype.addSide = function(obj) {
        var yourSide = (obj.side) ? 'Your side "' + obj.side + '"'  : 'One of your sides';
        checkAttributes(obj, ["side", "translation"], ["winmsg", "color", "hide"], yourSide);
        if (obj.side in this.sideTranslations) {
            addFatalError("Your theme has a repeated side \"" + obj.side + "\".");
        }
        this.sideTranslations[obj.side] = obj.translation;
        
        checkType(obj.side, ["string"], yourSide + "'s 'side' attribute");
        checkType(obj.translation, ["string"], yourSide + "'s 'translation' attribute");
        checkType(obj.winmsg, ["string"], yourSide + "'s 'winmsg' attribute");
        checkType(obj.color, ["string"], yourSide + "'s 'color' attribute");
        
        if (obj.side) {
            this.correctSides.push(obj.side);
            this.lowerCaseSides.push(obj.side.toLowerCase());
        }
    };
    Theme.prototype.addRole = function(obj) {
        var yourRole = (obj.role) ? 'your role "' + obj.role + '"' : 'one of your roles';
        checkAttributes(obj, ["role", "translation", "side", "help"], ["actions", "help2", "info", "infoName", "winningSides", "winIfDeadRoles", "hide", "startupmsg", "players"], cap(yourRole));
        if (!obj.actions) {
            obj.actions = {};
        }
        if (obj.role in this.roles) {
            addFatalError("Your theme has a repeated role '" + obj.role + "'.");
        }
        this.roles[obj.role] = obj;

        checkType(obj.role, ["string"], yourRole + "'s 'role' attribute");
        checkType(obj.translation, ["string"], yourRole + "'s 'translation' attribute");
        checkType(obj.help, ["string"], yourRole + "'s 'help' attribute");
        checkType(obj.help2, ["string"], yourRole + "'s 'help2' attribute");
        checkType(obj.info, ["string"], yourRole + "'s 'info' attribute");
        checkType(obj.infoName, ["string"], yourRole + "'s 'infoName' attribute");
        checkType(obj.startupmsg, ["string"], yourRole + "'s 'startupmsg' attribute");
        checkType(obj.players, ["string", "number", "array", "boolean"], yourRole + "'s 'players' attribute");
        checkValidValue(obj.hide, [true, false, "role", "side", "both"], yourRole + "'s 'hide' attribute");
        
        if (checkType(obj.side, ["string", "object"], yourRole + "'s 'side' attribute")) {
            if (typeof obj.side == "string") {
                checkValidSide(obj.side, yourRole + "'s 'side' attribute");
            } else if (typeof obj.side == "object") {
                if (checkType(obj.side.random, ["object"], yourRole + "'s 'side.random' attribute")) {
                    for (var e in obj.side.random) {
                        checkValidSide(e, yourRole + "'s 'side' attribute");
                        checkType(obj.side.random[e], ["number"], yourRole + "'s 'side.random.'" + e);
                    }
                } else {
                    addFatalError(cap(yourRole) + " has an invalid Object as its side");
                }
            }
        }
        if (obj.role) {
            this.correctRoles.push(obj.role);
            this.lowerCaseRoles.push(obj.role.toLowerCase());
        }
    };
    Theme.prototype.addActions = function() {
        var r, e, i, o, role, action, command, yourRole, c, commonMandatory, commonOptional, commandList, requiredAtt, mode, extraModes, possibleStandbyActions, act, comm;
        for (r in  this.roles) {
            role = this.roles[r];
            yourRole = "<b>" + role.role + "</b>";

            if (checkType(role.winningSides, ["array", "string"], "'" + yourRole + ".winningSides'")) {
                if (Array.isArray(role.winningSides)) {
                    for (e in role.winningSides) {
                        checkValidSide(role.winningSides[e], yourRole + ".winningSides");
                    }
                } else {
                    if (role.winningSides !== "*") {
                        addFatalError("Role " + yourRole + ".winningSides must be either an Array of sides or \"*\".");
                    }
                }
            }
            if (checkType(role.winIfDeadRoles, ["array"], "'" + yourRole + ".winIfDeadRoles'")) {
                for (e in role.winIfDeadRoles) {
                    checkValidRole(role.winIfDeadRoles[e], yourRole + ".winIfDeadRoles");
                }
            }
            
            if (checkType(role.actions, ["object"], "'" + yourRole + ".actions")) {
                act = "Role " + yourRole + ".actions";
                checkAttributes(role.actions, [], ["night", "standby", "hax", "standbyHax", "onDeath", "onDeadRoles", "initialCondition", "stats", "avoidHax", "avoidStandbyHax", "daykill", "daykillrevengemsg", "daykillevademsg", "daykillmissmsg", "revealexposermsg", "expose", "exposerevengemsg", "exposeevademsg", "exposemissmsg", "vote", "voteshield", "voteMultiplier", "addVote", "setVote", "addVoteshield", "setVoteshield", "startup", "onlist", "onteam", "lynch", "teamTalk", "noVote", "noVoteMsg", "preventTeamvote", "updateTeam", "teamUtilities", "updateCharges", "updateVote"].concat(possibleNightActions), act);

                if (checkType(role.actions.night, ["object"], act + ".night")) {
                    for (e in role.actions.night) {
                        action = role.actions.night[e];
                        comm = act + ".night." + e;
                        if (checkType(action, ["object"], comm)) {
                            command = e;
                            commonMandatory = ["target", "common", "priority"];
                            commonOptional = ["broadcast", "command", "limit", "msg", "failChance", "charges", "recharge", "initialrecharge", "broadcastmsg", "inputmsg", "chargesmsg", "clearCharges", "addCharges", "suicideChance", "suicidemsg", "restrict", "cancel", "ignoreDistract", "compulsory", "noRepeat", "pierce", "pierceChance", "noFollow", "haxMultiplier", "maxHax", "userMustBeVisited", "targetMustBeVisited", "userMustVisit", "targetMustVisit", "bypass", "hide", "macro", "pinpoint", "pinpointFailMsg", "pinpointBroadcastFailMsg"];
                            commandList = [];
                            if ("command" in action) {
                                if (Array.isArray(action.command)) {
                                    commandList = action.command;
                                } else if (typeof action.command == "object") {
                                    for (c in action.command) {
                                        commandList.push(c);
                                    }
                                } else if (typeof action.command == "string") {
                                    commandList.push(action.command);
                                }
                            } else {
                                commandList.push(command);
                            }
                            if (commandList.indexOf("kill") !== -1)
                                commonOptional = commonOptional.concat(["msg", "killmsg"]);
                            if (commandList.indexOf("inspect") !== -1)
                                commonOptional = commonOptional.concat(["Sight", "inspectMsg"]);
                            if (commandList.indexOf("distract") !== -1)
                                commonOptional = commonOptional.concat(["distractmsg", "teammsg", "onlyUser"]);
                            if (commandList.indexOf("protect") !== -1)
                                commonOptional = commonOptional.concat(["protectmsg"]);
                            if (commandList.indexOf("safeguard") !== -1)
                                commonOptional = commonOptional.concat(["safeguardmsg"]);
                            if (commandList.indexOf("poison") !== -1)
                                commonOptional = commonOptional.concat(["count", "poisonDeadMessage", "poisonmsg", "poisontarmsg"]);
                            if (commandList.indexOf("stalk") !== -1) {
                                commonOptional = commonOptional.concat(["stalkmsg", "novisitmsg"]);
                            }
                            if (commandList.indexOf("watch") !== -1) {
                                commonOptional = commonOptional.concat(["watchmsg", "watchFirst", "watchLast", "watchRandom"]);
                            }
                            if (commandList.indexOf("convert") !== -1) {
                                commonMandatory = commonMandatory.concat(["newRole"]);
                                commonOptional = commonOptional.concat(["canConvert", "convertmsg", "usermsg", "convertusermsg", "tarmsg", "convertfailmsg", "silent", "silentConvert", "unlimitedSelfConvert"]);
                            }
                            if (commandList.indexOf("massconvert") !== -1) {
                                commonMandatory = commonMandatory.concat(["convertRoles"]);
                                commonOptional = commonOptional.concat(["silentMassConvert", "massconvertmsg", "singlemassconvertmsg", "silent"]);
                            }
                            if (commandList.indexOf("copy") !== -1) {
                                commonMandatory = commonMandatory.concat(["copyAs"]);
                                commonOptional = commonOptional.concat(["canCopy", "copymsg", "copyfailmsg", "usermsg", "copyusermsg", "silent", "silentCopy"]);
                            }
                            if (commandList.indexOf("curse") !== -1) {
                                commonMandatory = commonMandatory.concat(["cursedRole"]);
                                commonOptional = commonOptional.concat(["curseCount", "canCurse", "curseConvertMessage", "cursemsg", "cursefailmsg", "silent", "silentCurse"]);
                            }
                            if (commandList.indexOf("detox") !== -1) {
                                commonOptional = commonOptional.concat(["msg", "targetmsg", "detoxmsg", "detoxfailmsg", "silent"]);
                            }
                            if (commandList.indexOf("dispel") !== -1) {
                                commonOptional = commonOptional.concat(["msg", "targetmsg", "dispelmsg", "dispelfailmsg", "silent"]);
                            }
                            if (commandList.indexOf("shield") !== -1) {
                                commonOptional = commonOptional.concat(["shieldActions", "shieldmsg"]);
                            }
                            if (commandList.indexOf("guard") !== -1) {
                                commonMandatory = commonMandatory.concat(["guardActions"]);
                                commonOptional = commonOptional.concat(["guardmsg"]);
                            }
                            if (commandList.indexOf("disguise") !== -1) {
                                commonMandatory = commonMandatory.concat(["disguiseRole"]);
                                commonOptional = commonOptional.concat(["disguisemsg", "disguiseCount"]);
                            }
                            if (commandList.indexOf("redirect") !== -1) {
                                commonMandatory = commonMandatory.concat(["redirectTarget"]);
                                commonOptional = commonOptional.concat(["redirectMsg", "redirectTargetMsg", "redirectActions"]);
                            }
                            for (var st in globalStats) {
                            	if (commandList.indexOf("stat:" + st) !== -1) {
                                	commonMandatory = commonMandatory.concat("stat:" + st);
                            	}
                            }
                            if (commandList.indexOf("dummy") !== -1) {
                                commonOptional = commonOptional.concat(["dummyusermsg", "dummytargetmsg", "dummybroadcastmsg", "dummyPierce"]);
                            }
                            if (commandList.indexOf("dummy2") !== -1) {
                                commonOptional = commonOptional.concat(["dummy2usermsg", "dummy2targetmsg", "dummy2broadcastmsg", "dummy2Pierce"]);
                            }
                            if (commandList.indexOf("dummy3") !== -1) {
                                commonOptional = commonOptional.concat(["dummy3usermsg", "dummy3targetmsg", "dummy3broadcastmsg", "dummy3Pierce"]);
                            }
                            if (commandList.indexOf("dummy4") !== -1) {
                                commonOptional = commonOptional.concat(["dummy4usermsg", "dummy4targetmsg", "dummy4broadcastmsg", "dummy4Pierce"]);
                            }
                            if (commandList.indexOf("dummy5") !== -1) {
                                commonOptional = commonOptional.concat(["dummy5usermsg", "dummy5targetmsg", "dummy5broadcastmsg", "dummy5Pierce"]);
                            }
                            if (commandList.indexOf("dummy6") !== -1) {
                                commonOptional = commonOptional.concat(["dummy6usermsg", "dummy6targetmsg", "dummy6broadcastmsg", "dummy6Pierce"]);
                            }
                            if (commandList.indexOf("dummy7") !== -1) {
                                commonOptional = commonOptional.concat(["dummy7usermsg", "dummy7targetmsg", "dummy7broadcastmsg", "dummy7Pierce"]);
                            }
                            if (commandList.indexOf("dummy8") !== -1) {
                                commonOptional = commonOptional.concat(["dummy8usermsg", "dummy8targetmsg", "dummy8broadcastmsg", "dummy8Pierce"]);
                            }
                            if (commandList.indexOf("dummy9") !== -1) {
                                commonOptional = commonOptional.concat(["dummy9usermsg", "dummy9targetmsg", "dummy9broadcastmsg", "dummy9Pierce"]);
                            }
                            if (commandList.indexOf("dummy10") !== -1) {
                                commonOptional = commonOptional.concat(["dummy10usermsg", "dummy10targetmsg", "dummy10broadcastmsg", "dummy10Pierce"]);
                            }
                            

                            commonNightActions(act, action, e);
                            checkAttributes(action, commonMandatory, commonOptional, comm);
                            for (c in commandList) {
                                command = commandList[c];
                                if (command == "kill") {
                                    checkType(action.msg, ["string"], comm + ".msg");
                                    checkType(action.killmsg, ["string"], comm + ".killmsg");
                                } else if (command == "inspect") {
                                    if (checkType(action.Sight, ["string", "object"], comm + ".Sight")) {
                                        if (typeof action.Sight == "string") {
                                            checkValidValue(action.Sight, ["Team"], comm + ".Sight");
                                        } else if (typeof action.Sight == "object") {
                                            for (i in action.Sight) {
                                                if (i !== "true") {
                                                    checkValidRole(i, comm + ".Sight");
                                                }
                                                checkType(action.Sight[i], ["number"], comm + ".Sight." + i);
                                            }
                                        }
                                    }
                                } else if (command == "distract") {
                                    checkType(action.distractmsg, ["string"], comm + ".distractmsg");
                                    checkType(action.teammsg, ["string"], comm + ".teammsg");
                                } else if (command == "redirect") {
                                    checkType(action.redirectActions, ["array"], comm + ".redirectActions");
                                    checkValidValue(action.redirectTarget, ["OnlySelf", "AnyButSelf", "OnlyTarget", "AnyButTarget", "Any"], comm + ".redirectActions");
                                } else if (command == "protect") {
                                    checkType(action.protectmsg, ["string"], comm + ".protectmsg");
                                } else if (command == "safeguard") {
                                    checkType(action.safeguardmsg, ["string"], comm + ".safeguardmsg");
                                } else if (command == "poison") {
                                    checkType(action.count, ["number"], comm + ".count");
                                    checkType(action.poisonDeadMessage, ["string"], comm + ".poisonDeadMessage");
                                    checkType(action.poisontarmsg, ["string"], comm + ".poisontarmsg");
                                    checkType(action.poisonmsg, ["string"], comm + ".poisonmsg");
                                } else if (command == "stalk") {
                                    checkType(action.stalkmsg, ["string"], comm + ".stalkmsg");
                                    checkType(action.novisitmsg, ["string"], comm + ".novisitmsg");
                                } else if (command == "watch") {
                                    checkType(action.watchmsg, ["string"], comm + ".watchmsg");
                                    checkType(action.watchFirst, ["number"], comm + ".watchFirst");
                                    checkType(action.watchLast, ["number"], comm + ".watchLast");
                                    checkType(action.watchRandom, ["number"], comm + ".watchRandom");
                                } else if (command == "convert") {
                                    checkValidValue(action.silent, [true, false], comm + ".silent");
                                    checkValidValue(action.silentConvert, [true, false], comm + ".silentConvert");
                                    checkValidValue(action.unlimitedSelfConvert, [true, false], comm + ".unlimitedSelfConvert");
                                    
                                    if (checkType(action.newRole, ["string", "object"], comm + ".newRole")) {
                                        if (typeof action.newRole == "string") {
                                            checkValidRole(action.newRole, comm + ".newRole");
                                        } else if (typeof action.newRole == "object") {
                                            if ("random" in action.newRole && typeof action.newRole.random == "object") {
                                                for (i in action.newRole.random) {
                                                    checkValidRole(i, comm + ".newRole.random");
                                                    checkType(action.newRole.random[i], ["number"], comm + ".newRole.random." + i);
                                                }
                                            } else {
                                                for (i in action.newRole) {
                                                    checkValidRole(i, comm + ".newRole");
                                                    if (checkType(action.newRole[i], ["array"], comm + ".newRole." + i)) {
                                                        for (o in action.newRole[i]) {
                                                            checkValidRole(action.newRole[i][o], comm + ".newRole." + i);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (checkType(action.canConvert, ["string", "array"], comm + ".canConvert")) {
                                        if (typeof action.canConvert == "string") {
                                            checkValidValue(action.canConvert, ["*"], comm + ".canConvert");
                                        } else {
                                            for (i in action.canConvert) {
                                                checkValidRole(action.canConvert[i], comm + ".canConvert");
                                            }
                                        }
                                    }
                                    checkType(action.convertmsg, ["string"], comm + ".convertmsg");
                                    checkType(action.usermsg, ["string"], comm + ".usermsg");
                                    checkType(action.convertusermsg, ["string"], comm + ".convertusermsg");
                                    checkType(action.tarmsg, ["string"], comm + ".tarmsg");
                                    checkType(action.convertfailmsg, ["string"], comm + ".convertfailmsg");
                                } else if (command == "massconvert") {
                                    if (checkType(action.convertRoles, ["object"], comm + ".convertRoles")) {
                                        for (i in action.convertRoles) {
                                            checkValidRole(i, comm + ".convertRoles");
                                            checkValidRole(action.convertRoles[i], comm + ".convertRoles." + i);
                                        }
                                    }
                                    
                                    checkType(action.massconvertmsg, ["string"], comm + ".massconvertmsg");
                                    checkType(action.singlemassconvertmsg, ["string"], comm + ".singlemassconvertmsg");
                                    checkType(action.silentMassConvert, ["boolean"], comm + ".silentMassConvert");
                                    checkType(action.silent, ["boolean"], comm + ".silent");
                                } else if (command == "copy") {
                                    checkValidValue(action.silent, [true, false], comm + ".silent");
                                    checkValidValue(action.silentCopy, [true, false], comm + ".silentCopy");
                                    
                                    if (checkType(action.copyAs, ["string", "object"], comm + ".copyAs")) {
                                        if (typeof action.copyAs == "string") {
                                            if (!isRole(action.copyAs) && action.copyAs !== "*") {
                                                addFatalError(comm + ".copyAs must be a role or \"*\"." );
                                            }
                                        } else if (typeof action.copyAs == "object") {
                                            for (i in action.copyAs) {
                                                checkValidRole(i, comm + ".copyAs." + i);
                                                if (checkType(action.copyAs[i], ["array"], comm + ".copyAs." + i)) {
                                                    for (o in action.copyAs[i]) {
                                                        checkValidRole(action.copyAs[i][o], comm + ".copyAs." + i);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (checkType(action.canCopy, ["string", "array"], comm + ".canCopy")) {
                                        if (typeof action.canCopy == "string") {
                                            checkValidValue(action.canCopy, ["*"], comm + ".canCopy");
                                        } else {
                                            for (i in action.canCopy) {
                                                checkValidRole(action.canCopy[i], comm + ".canCopy");
                                            }
                                        }
                                    }
                                    checkType(action.copymsg, ["string"], comm + ".copymsg");
                                    checkType(action.copyfailmsg, ["string"], comm + ".copyfailmsg");
                                    checkType(action.usermsg, ["string"], comm + ".usermsg");
                                    checkType(action.copyusermsg, ["string"], comm + ".copyusermsg");
                                } else if (command == "curse") {
                                    checkValidValue(action.silent, [true, false], comm + ".silent");
                                    checkValidValue(action.silentCurse, [true, false], comm + ".silentCurse");
                                    
                                    if (checkType(action.cursedRole, ["string", "object"], comm + ".cursedRole")) {
                                        if (typeof action.cursedRole == "string") {
                                            checkValidRole(action.cursedRole, comm + ".cursedRole");
                                        } else {
                                            for (i in action.cursedRole) {
                                                checkValidRole(i, comm + ".cursedRole");
                                                if (checkType(action.cursedRole[i], ["array"], comm + ".cursedRole." + i)) {
                                                    for (o in action.cursedRole[i]) {
                                                        checkValidRole(action.cursedRole[i][o], comm + ".cursedRole." + i);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (checkType(action.canCurse, ["string", "array"], comm + ".canCurse")) {
                                        if (typeof action.canCurse == "string") {
                                            checkValidValue(action.canCurse, ["*"], comm + ".canCurse");
                                        } else {
                                            for (i in action.canCurse) {
                                                checkValidRole(action.canCurse[i], comm + ".canCurse");
                                            }
                                        }
                                    }
                                    checkType(action.curseCount, ["number"], comm + ".curseCount");
                                    checkType(action.curseConvertMessage, ["string"], comm + ".curseConvertMessage");
                                    checkType(action.cursefailmsg, ["string"], comm + ".cursefailmsg");
                                    checkType(action.cursemsg, ["string"], comm + ".cursemsg");
                                } else if (command == "detox") {
                                    checkType(action.msg, ["string"], comm + ".msg");
                                    checkType(action.targetmsg, ["string"], comm + ".targetmsg");
                                    checkType(action.detoxmsg, ["string"], comm + ".detoxmsg");
                                    checkType(action.detoxfailmsg, ["string"], comm + ".detoxfailmsg");
                                } else if (command == "dispel") {
                                    checkType(action.msg, ["string"], comm + ".msg");
                                    checkType(action.targetmsg, ["string"], comm + ".targetmsg");
                                    checkType(action.dispelmsg, ["string"], comm + ".dispelmsg");
                                    checkType(action.dispelfailmsg, ["string"], comm + ".dispelfailmsg");
                                } else if (command == "shield") {
                                    if (checkType(action.shieldActions, ["string", "array"], comm + ".shieldActions")) {
                                        if (typeof action.shieldActions === "string") {
                                            checkValidValue(action.shieldActions, ["*"], comm + ".shieldActions");
                                        }
                                    }
                                    checkType(action.shieldmsg, ["string"], comm + ".shieldmsg");
                                } else if (command == "guard") {
                                    checkType(action.guardActions, ["array"], comm + ".guardActions");
                                    checkType(action.guardmsg, ["string"], comm + ".guardmsg");
                                } else if (command == "disguise") {
                                    if (checkType(action.disguiseRole, ["string", "object"], comm + ".disguiseRole")) {
                                        if (typeof action.disguiseRole == "string") {
                                            checkValidRole(action.disguiseRole, comm + ".disguiseRole");
                                        } else {
                                            if ("random" in action.disguiseRole && typeof action.disguiseRole.random == "object") {
                                                for (i in action.disguiseRole.random) {
                                                    checkValidRole(i, comm + ".disguiseRole.random");
                                                    checkType(action.disguiseRole.random[i], ["number"], comm + ".disguiseRole.random." + i);
                                                }
                                            } else {
                                                if (!("auto" in action.disguiseRole)) {
                                                    addFatalError(comm + ".disguiseRole must have a property named 'auto'.");
                                                }
                                                for (i in action.disguiseRole) {
                                                    if (i == "auto") {
                                                        checkValidRole(action.disguiseRole.auto, comm + ".disguiseRole.auto");
                                                    } else {
                                                        checkValidRole(i, comm + ".disguiseRole");
                                                        if (checkType(action.disguiseRole[i], ["array"], comm + ".disguiseRole." + i)) {
                                                            for (o in action.disguiseRole[i]) {
                                                                checkValidRole(action.disguiseRole[i][o], comm + ".disguiseRole." + i);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    checkType(action.disguiseCount, ["number"], comm + ".disguiseCount");
                                    checkType(action.disguisemsg, ["string"], comm + ".disguisemsg");
                                } else if (command == "dummy" || command == "dummy2" || command == "dummy3" || command == "dummy4" || command == "dummy5" || command == "dummy6" || command == "dummy7" || command == "dummy8" || command == "dummy9" || command == "dummy10") {
                                    checkType(action[command + "usermsg"], ["string"], comm + "." + command + "usermsg");
                                    checkType(action[command + "targetmsg"], ["string"], comm + "." + command + "targetmsg");
                                    checkType(action[command + "broadcastmsg"], ["string"], comm + "." + command + "broadcastmsg");
                                    checkType(action[command + "Pierce"], ["boolean"], comm + "." + command + "Pierce");
                                }
                            }
                        }
                    }
                }
                if (checkType(role.actions.standby, ["object"], act + ".standby")) {
                    var appendActions = ["newRole", "canConvert", "silent", "convertmsg", "convertusermsg", "tarmsg", "copyAs", "canCopy", "copymsg", "copyusermsg", "convertRoles", "singlemassconvertmsg", "massconvertmsg", "macro" ];
                    for (e in role.actions.standby) {
                        action = role.actions.standby[e];
                        comm = act + ".standby." + e;
                        if (checkType(action, ["object"], comm)) {
                            possibleStandbyActions = ["kill", "reveal", "expose"];
                            command = e;
                            if (checkType(action.command, ["string"], comm + ".command")) {
                                command = action.command;
                            }
                            if (command == "kill") {
                                checkAttributes(action, ["target", "killmsg"], ["command", "limit", "msg", "revealChance", "revealmsg", "recharge", "initialrecharge", "charges", "chargesmsg", "clearCharges", "addCharges"].concat(appendActions), comm);
                                
                                checkValidValue(action.target, ["Any", "Self", "AnyButTeam", "AnyButRole", "AnyButSelf", "OnlySelf", "OnlyTeam", "OnlyTeammates"], comm + ".target");
                                checkType(action.limit, ["number"], comm + ".limit");
                                checkType(action.msg, ["string"], comm + ".msg");
                                checkType(action.killmsg, ["string"], comm + ".killmsg");
                                checkType(action.revealChance, ["number"], comm + ".revealChance");
                                checkType(action.revealmsg, ["string"], comm + ".revealmsg");
                                checkType(action.recharge, ["number"], comm + ".recharge");
                                checkType(action.initialrecharge, ["number"], comm + ".initialrecharge");
                                checkType(action.charges, ["number"], comm + ".charges");
                                checkType(action.chargesmsg, ["string"], comm + ".chargesmsg");
                                checkType(action.clearCharges, ["boolean"], comm + ".clearCharges");
                                checkType(action.addCharges, ["number"], comm + ".addCharges");
                            } else if (command == "expose") {
                                checkAttributes(action, ["target"], ["command", "limit", "msg", "exposemsg", "revealChance", "revealmsg", "recharge", "initialrecharge", "exposedtargetmsg", "charges", "chargesmsg", "clearCharges", "addCharges"].concat(appendActions), comm);
                                
                                checkValidValue(action.target, ["Any", "Self", "AnyButTeam", "AnyButRole", "AnyButSelf"], comm + ".target");
                                checkType(action.limit, ["number"], comm + ".limit");
                                checkType(action.msg, ["string"], comm + ".msg");
                                checkType(action.exposemsg, ["string"], comm + ".exposemsg");
                                checkType(action.exposedtargetmsg, ["string"], comm + ".exposedtargetmsg");
                                checkType(action.revealChance, ["number"], comm + ".revealChance");
                                checkType(action.revealmsg, ["string"], comm + ".revealmsg");
                                checkType(action.recharge, ["number"], comm + ".recharge");
                                checkType(action.initialrecharge, ["number"], comm + ".initialrecharge");
                                checkType(action.charges, ["number"], comm + ".charges");
                                checkType(action.chargesmsg, ["string"], comm + ".chargesmsg");
                                checkType(action.clearCharges, ["boolean"], comm + ".clearCharges");
                                checkType(action.addCharges, ["number"], comm + ".addCharges");
                            } else if (command == "reveal") {
                                checkAttributes(action, [], ["command", "limit", "msg", "revealmsg", "recharge", "initialrecharge", "charges", "chargesmsg", "clearCharges", "addCharges"].concat(appendActions), comm);
                                
                                checkType(action.limit, ["number"], comm + ".limit");
                                checkType(action.msg, ["string"], comm + ".msg");
                                checkType(action.revealmsg, ["string"], comm + ".revealmsg");
                                checkType(action.recharge, ["number"], comm + ".recharge");
                                checkType(action.initialrecharge, ["number"], comm + ".initialrecharge");
                                checkType(action.charges, ["number"], comm + ".charges");
                                checkType(action.chargesmsg, ["string"], comm + ".chargesmsg");
                                checkType(action.clearCharges, ["boolean"], comm + ".clearCharges");
                                checkType(action.addCharges, ["number"], comm + ".addCharges");
                            } else {
                                addMinorError("Role " + yourRole + "'s standby action \"" + e + "\" is not a valid action (Valid standby actions are " + possibleStandbyActions.join(", ") + ")");
                            }
                            
                            
                            if ("newRole" in action) {
                                if (checkType(action.newRole, ["string", "object"], comm + ".newRole")) {
                                    if (typeof action.newRole == "string") {
                                        checkValidRole(action.newRole, comm + ".newRole");
                                    } else if (typeof action.newRole == "object") {
                                        if ("random" in action.newRole && typeof action.newRole.random == "object") {
                                            for (i in action.newRole.random) {
                                                checkValidRole(i, comm + ".newRole.random");
                                                checkType(action.newRole.random[i], ["number"], comm + ".newRole.random." + i);
                                            }
                                        } else {
                                            for (i in action.newRole) {
                                                checkValidRole(i, comm + ".newRole");
                                                if (checkType(action.newRole[i], ["array"], comm + ".newRole." + i)) {
                                                    for (o in action.newRole[i]) {
                                                        checkValidRole(action.newRole[i][o], comm + ".newRole." + i);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if (checkType(action.canConvert, ["string", "array"], comm + ".canConvert")) {
                                    if (typeof action.canConvert == "string") {
                                        checkValidValue(action.canConvert, ["*"], comm + ".canConvert");
                                    } else {
                                        for (i in action.canConvert) {
                                            checkValidRole(action.canConvert[i], comm + ".canConvert");
                                        }
                                    }
                                }
                                checkValidValue(action.silent, [true, false], comm + ".silent");
                                checkValidValue(action.silentConvert, [true, false], comm + ".silentConvert");
                                checkType(action.convertmsg, ["string"], comm + ".convertmsg");
                                checkType(action.convertusermsg, ["string"], comm + ".convertusermsg");
                                checkType(action.tarmsg, ["string"], comm + ".tarmsg");
                            }
                            if ("canCopy" in action) {
                                if (checkType(action.copyAs, ["string", "object"], comm + ".copyAs")) {
                                    if (typeof action.copyAs == "string") {
                                        if (!isRole(action.copyAs) && action.copyAs !== "*") {
                                            addFatalError(comm + ".copyAs must be a role or \"*\"." );
                                        }
                                    } else if (typeof action.copyAs == "object") {
                                        for (i in action.copyAs) {
                                            checkValidRole(i, comm + ".copyAs." + i);
                                            if (checkType(action.copyAs[i], ["array"], comm + ".copyAs." + i)) {
                                                for (o in action.copyAs[i]) {
                                                    checkValidRole(action.copyAs[i][o], comm + ".copyAs." + i);
                                                }
                                            }
                                        }
                                    }
                                }
                                if (checkType(action.canCopy, ["string", "array"], comm + ".canCopy")) {
                                    if (typeof action.canCopy == "string") {
                                        checkValidValue(action.canCopy, ["*"], comm + ".canCopy");
                                    } else {
                                        for (i in action.canCopy) {
                                            checkValidRole(action.canCopy[i], comm + ".canCopy");
                                        }
                                    }
                                }
                                checkValidValue(action.silent, [true, false], comm + ".silent");
                                checkValidValue(action.silentCopy, [true, false], comm + ".silentCopy");
                                checkType(action.copymsg, ["string"], comm + ".copymsg");
                                checkType(action.copyusermsg, ["string"], comm + ".copyusermsg");
                            }
                            if ("convertRoles" in action) {
                                if (checkType(action.convertRoles, ["object"], comm + ".convertRoles")) {
                                    for (i in action.convertRoles) {
                                        checkValidRole(i, comm + ".convertRoles");
                                        checkValidRole(action.convertRoles[i], comm + ".convertRoles." + i);
                                    }
                                }
                                
                                checkType(action.massconvertmsg, ["string"], comm + ".massconvertmsg");
                                checkType(action.singlemassconvertmsg, ["string"], comm + ".singlemassconvertmsg");
                                checkType(action.silentMassConvert, ["boolean"], comm + ".silentMassConvert");
                                checkType(action.silent, ["boolean"], comm + ".silent");
                            }
                        }
                    }
                }
                if (checkType(role.actions.hax, ["object"], act + ".hax")) {
                    for (e in role.actions.hax) {
                        comm = act + ".hax." + e;
                        for (i in role.actions.hax[e]) {
                            checkType(role.actions.hax[e][i], ["number"], comm + (["revealTeam", "revealPlayer", "revealRole", "revealTarget"].indexOf(i) == -1 ? "['" + i + "']" : "." + i));
                        }
                    }
                }
                if (checkType(role.actions.standbyHax, ["object"], act + ".standbyHax")) {
                    for (e in role.actions.standbyHax) {
                        comm = act + ".standbyHax." + e;
                        for (i in role.actions.standbyHax[e]) {
                            checkType(role.actions.standbyHax[e][i], ["number"], comm + (["revealTeam", "revealPlayer", "revealRole"].indexOf(i) == -1 ? "['" + i + "']" : "." + i));
                        }
                    }
                }
                if (checkType(role.actions.onDeath, ["object"], act + ".onDeath")) {
                    action = role.actions.onDeath;
                    comm = act + ".onDeath";
                    this.checkOnDeath(action, comm, ["onslay"]);
                }
                if (checkType(role.actions.onDeadRoles, ["object"], act + ".onDeadRoles")) {
                    action = role.actions.onDeadRoles;
                    comm = act + ".onDeadRoles";
                    
                    checkAttributes(action, ["convertTo"], ["convertmsg", "silentConvert"], comm);
                    
                    checkType(action.convertmsg, ["string"], comm + ".convertmsg");
                    checkType(action.silentConvert, ["boolean"], comm + ".silentConvert");
                    
                    if (checkType(action.convertTo, ["object"], comm + ".convertTo")) {
                        for (e in action.convertTo) {
                            checkValidRole(e, comm + ".convertTo");
                            if (checkType(action.convertTo[e], ["array"], comm + ".convertTo." + e)) {
                                for (c in action.convertTo[e]) {
                                    checkValidRole(action.convertTo[e][c], comm + ".convertTo." + e);
                                }
                            }
                        }
                    }
                    
                }
                if (checkType(role.actions.vote, ["number", "array"], act + ".vote")) {
                    if (Array.isArray(role.actions.vote)) {
                        for (e in role.actions.vote) {
                            if (!checkType(role.actions.vote[e], ["number"], "All values for " + act + ".vote")) {
                                break;
                            }
                        }
                    }
                }
                if (checkType(role.actions.voteshield, ["number", "array"], act + ".voteshield")) {
                    if (Array.isArray(role.actions.voteshield)) {
                        for (e in role.actions.voteshield) {
                            if (!checkType(role.actions.voteshield[e], ["number"], "All values for " + act + ".voteshield")) {
                                break;
                            }
                        }
                    }
                }
                if (checkType(role.actions.voteMultiplier, ["number", "array"], act + ".voteMultiplier")) {
                    if (Array.isArray(role.actions.voteMultiplier)) {
                        for (e in role.actions.voteMultiplier) {
                            if (!checkType(role.actions.voteMultiplier[e], ["number"], "All values for " + act + ".voteMultiplier")) {
                                break;
                            }
                        }
                    }
                }
                checkType(role.actions.addVote, ["number"], act + ".addVote");
                checkType(role.actions.addVoteshield, ["number"], act + ".addVoteshield");
                checkType(role.actions.setVote, ["number"], act + ".setVote");
                checkType(role.actions.setVoteshield, ["number"], act + ".setVoteshield");

                if (checkType(role.actions.preventTeamvote, ["boolean", "array"], act + ".preventTeamvote")) {
                    if (Array.isArray(role.actions.preventTeamvote)) {
                        for (e in role.actions.preventTeamvote) {
                            checkValidRole(role.actions.preventTeamvote[e], act + ".preventTeamvote");
                        }
                    }
                }
                checkType(role.actions.noVote, ["boolean"], act + ".noVote");
                checkType(role.actions.noVoteMsg, ["string"], act + ".noVoteMsg");
                
                //Defensive Modes
                for (e in possibleNightActions) {
                    if (possibleNightActions[e] in role.actions && typeof role.actions[possibleNightActions[e]] !== "function" && checkType(role.actions[possibleNightActions[e]], ["object"], act + "." + possibleNightActions[e])) {
                        command = possibleNightActions[e];
                        action = role.actions[command];
                        comm = act + "." + command;
                        if (command == "inspect") {
                            checkAttributes(action, [], ["mode", "broadcastMsg", "seenSide", "revealSide", "revealAs", "msg", "targetmsg", "hookermsg", "evadechargemsg", "count", "poisonDeadMessage", "silent"], comm);
                            
                            checkValidValue(action.revealSide, [true, false], comm + ".revealSide");
                            
                            if (checkType(action.seenSide, ["string"], comm + ".seenSide")) {
                                checkValidSide(action.seenSide, comm + ".seenSide");
                            }
                            
                            if (checkType(action.revealAs, ["string", "array", "number"], comm + ".revealAs")) {
                                if (typeof action.revealAs == "string") {
                                    if ((action.revealAs.charAt(0) !== "*") && (action.revealAs !== "~Inspect~")) {
                                        checkValidRole(action.revealAs, comm + ".revealAs");
                                    }
                                } else if (Array.isArray(action.revealAs)) {
                                    for (e in action.revealAs) {
                                        checkValidRole(action.revealAs[e], comm + ".revealAs");
                                    }
                                }
                            }
                        } else {
                            requiredAtt = [];
                            if ("mode" in action && typeof action.mode == "object" && "killif" in action.mode) {
                                requiredAtt = ["msg"];
                            }
                            checkAttributes(action, [].concat(requiredAtt), ["mode", "broadcastMsg", "msg", "targetmsg", "hookermsg", "evadechargemsg", "count", "poisonDeadMessage", "rate", "constant", "silent", "identifymsg", "diemsg", "targetdiemsg"], comm);
                        }
                        if (checkType(action.mode, ["string", "object"], comm + ".mode")) {
                            mode = action.mode;
                            if (typeof mode == "string") {
                                extraModes = [];
                                
                                if (command === "stalk") {
                                    extraModes.push("noVisit");
                                }
                                if (command === "poison" || command == "curse") {
                                    extraModes.push("resistance");
                                }
                                
                                checkValidValue(mode, ["ignore", "broadcastMsg", "ChangeTarget", "killattacker", "killattackerevenifprotected", "poisonattacker", "poisonattackerevenifprotected", "identify", "die"].concat(extraModes), comm + ".mode");
                            } else if  (typeof mode == "object") {
                                checkAttributes(action.mode, [], ["evadeCharges", "evadeChance", "ignore", "killif", "identify", "broadcastMsg", "die"], comm + ".mode");
                                
                                if (checkType(mode.evadeCharges, ["number", "string"], comm + ".mode.evadeCharges")) {
                                    if (typeof mode.evadeCharges == "string") {
                                        checkValidValue(mode.evadeCharges, ["*"], comm + ".mode.evadeCharges");
                                    }
                                }
                                checkType(mode.evadeChance, ["number"], comm + ".mode.evadeChance");
                                
                                if (checkType(mode.ignore, ["array"], comm + ".mode.ignore")) {
                                    for (e in mode.ignore) {
                                        checkValidRole(mode.ignore[e], comm + ".mode.ignore");
                                    }
                                }
                                if (checkType(mode.killif, ["array"], comm + ".mode.killif")) {
                                    for (e in mode.killif) {
                                        checkValidRole(mode.killif[e], comm + ".mode.killif");
                                    }
                                }
                                if (checkType(mode.identify, ["array"], comm + ".mode.identify")) {
                                    for (e in mode.identify) {
                                        checkValidRole(mode.identify[e], comm + ".mode.identify");
                                    }
                                }
                                if (checkType(mode.die, ["array"], comm + ".mode.die")) {
                                    for (e in mode.die) {
                                        checkValidRole(mode.die[e], comm + ".mode.die");
                                    }
                                }
                            }
                        }
                        
                        checkType(action.msg, ["string"], comm + ".msg");
                        checkType(action.hookermsg, ["string"], comm + ".hookermsg");
                        checkType(action.targetmsg, ["string"], comm + ".targetmsg");
                        checkType(action.evadechargemsg, ["string"], comm + ".evadechargemsg");
                        checkType(action.broadcastMsg, ["string"], comm + ".broadcastMsg");
                        checkType(action.poisonDeadMessage, ["string"], comm + ".poisonDeadMessage");
                        checkType(action.count, ["number"], comm + ".count");
                        checkType(action.rate, ["number"], comm + ".rate");
                        checkType(action.constant, ["number"], comm + ".constant");
                        checkValidValue(action.silent, [true, false], comm + ".silent");
                    }
                }
                if (checkType(role.actions.daykill, ["object", "string"], act + ".daykill")) {
                    action = role.actions.daykill;
                    comm = act + ".daykill";
                    
                    if (checkType(action, ["string", "object"], comm)) {
                        if (typeof action == "string") {
                            checkValidValue(action, ["evade", "revenge", "bomb", "revealkiller"], comm);
                        } else {
                            checkAttributes(action, ["mode"], ["msg", "targetmsg", "expend"], comm);
                            if (checkType(action.mode, ["object"], comm + ".mode")) {
                                checkAttributes(action.mode, [], ["evadeCharges", "evadeChance", "ignore", "ignoreChance", "revenge", "evasionmsg"], comm + ".mode");
                                
                                checkType(action.mode.evadeChance, ["number"], comm + ".mode.evadeChance");
                                
                                if (checkType(action.mode.ignoreChance, ["object"], comm + ".mode.ignoreChance")) {
                                    for (var rr in action.mode.ignoreChance) {
                                        checkType(rr, ["number"], comm + ".mode.ignoreChance." + rr);
                                        checkType(action.mode.ignoreChance[rr], ["array"], comm + ".mode.ignoreChance." + action.mode.ignoreChance[rr]);
                                    }
                                }
                                
                                if (checkType(action.mode.evadeCharges, ["number", "string"], comm + ".mode.evadeCharges")) {
                                    if (typeof action.mode.evadeCharges == "string") {
                                        checkValidValue(action.mode.evadeCharges, ["*"], comm + ".mode.evadeCharges");
                                    }
                                }
                                if (checkType(action.mode.ignore, ["array"], comm + ".mode.ignore")) {
                                    for (i in action.mode.ignore) {
                                        checkValidRole(action.mode.ignore[i], comm + ".mode.ignore");
                                    }
                                }
                                if (checkType(action.mode.revenge, ["array"], comm + ".mode.revenge")) {
                                    for (i in action.mode.revenge) {
                                        checkValidRole(action.mode.revenge[i], comm + ".mode.revenge");
                                    }
                                }
                                checkType(action.mode.evasionmsg, ["string"], comm + ".mode.evasionmsg");
                            }
                            
                            checkType(action.expend, ["boolean"], comm + ".expend");
                            checkType(action.msg, ["string"], comm + ".msg");
                            checkType(action.targetmsg, ["string"], comm + ".targetmsg");
                        }
                    }
                }
                if (checkType(role.actions.daykillevademsg, ["string"], act + ".daykillevademsg")) {
                    if (!("daykill" in role.actions)) {
                        addMinorError("'daykillevademsg' found at " + act + ", but there's no '" + act + ".daykill'");
                    }
                }
                if (checkType(role.actions.daykillrevengemsg, ["string"], act + ".daykillrevengemsg")) {
                    if (!("daykill" in role.actions)) {
                        addMinorError("'daykillrevengemsg' found at " + act + ", but there's no '" + act + ".daykill'");
                    }
                }
                if (checkType(role.actions.daykillmissmsg, ["string"], act + ".daykillmissmsg")) {
                    if (!("daykill" in role.actions)) {
                        addMinorError("'daykillmissmsg' found at " + act + ", but there's no '" + act + ".daykill'");
                    }
                }
                if (checkType(role.actions.expose, ["object", "string"], act + ".expose")) {
                    action = role.actions.expose;
                    comm = act + ".expose";
                    
                    if (typeof action == "string") {
                        checkValidValue(action, ["evade", "die", "revenge", "revealexposer"], comm);
                    } else if (typeof action == "object") {
                        checkAttributes(action, ["mode"], ["msg", "targetmsg", "expend"], comm);
                        if (checkType(action.mode, ["object"], comm + ".mode")) {
                            checkAttributes(action.mode, [], ["evadeCharges", "evadeChance", "ignore", "revenge", "evasionmsg"], comm + ".mode");
                            
                            checkType(action.mode.evadeChance, ["number"], comm + ".mode.evadeChance");
                            
                            if (checkType(action.mode.evadeCharges, ["number", "string"], comm + ".mode.evadeCharges")) {
                                    if (typeof action.mode.evadeCharges == "string") {
                                        checkValidValue(action.mode.evadeCharges, ["*"], comm + ".mode.evadeCharges");
                                    }
                                }
                            if (checkType(action.mode.ignore, ["array"], comm + ".mode.ignore")) {
                                for (i in action.mode.ignore) {
                                    checkValidRole(action.mode.ignore[i], comm + ".mode.ignore");
                                }
                            }
                            if (checkType(action.mode.revenge, ["array"], comm + ".mode.revenge")) {
                                for (i in action.mode.revenge) {
                                    checkValidRole(action.mode.revenge[i], comm + ".mode.revenge");
                                }
                            }
                            
                            checkType(action.mode.evasionmsg, ["string"], comm + ".mode.evasionmsg");
                        }
                        checkType(action.expend, ["boolean"], comm + ".expend");
                        checkType(action.msg, ["string"], comm + ".msg");
                        checkType(action.targetmsg, ["string"], comm + ".targetmsg");
                    }
                }
                if (checkType(role.actions.revealexposermsg, ["string"], act + ".revealexposermsg")) {
                    if (!("expose" in role.actions)) {
                        addMinorError("'revealexposermsg' found at " + act + ", but there's no '" + act + ".expose'");
                    }
                }
                if (checkType(role.actions.exposerevengemsg, ["string"], act + ".exposerevengemsg")) {
                    if (!("expose" in role.actions)) {
                        addMinorError("'exposerevengemsg' found at " + act + ", but there's no '" + act + ".expose'");
                    }
                }
                if (checkType(role.actions.exposeevademsg, ["string"], act + ".exposeevademsg")) {
                    if (!("expose" in role.actions)) {
                        addMinorError("'exposeevademsg' found at " + act + ", but there's no '" + act + ".expose'");
                    }
                }
                if (checkType(role.actions.exposemissmsg, ["string"], act + ".exposemissmsg")) {
                    if (!("expose" in role.actions)) {
                        addMinorError("'exposemissmsg' found at " + act + ", but there's no '" + act + ".expose'");
                    }
                }
                if (checkType(role.actions.exposediemsg , ["string"], act + ".exposediemsg ")) {
                    if (!("expose" in role.actions)) {
                        addMinorError("'exposediemsg ' found at " + act + ", but there's no '" + act + ".expose'");
                    }
                }
                if (checkType(role.actions.avoidHax, ["array"], act + ".avoidHax")) {
                    action = role.actions.avoidHax;
                    if (checkType(action, ["array"], act + ".avoidHax")) {
                        for (e in action) {
                            if (!checkType(action[e], ["string"], "All values for " + act + ".avoidHax")) {
                                break;
                            }
                        }
                    }
                }
                if (checkType(role.actions.avoidStandbyHax, ["array"], act + ".avoidStandbyHax")) {
                    action = role.actions.avoidStandbyHax;
                    if (checkType(action, ["array"], act + ".avoidStandbyHax")) {
                        for (e in action) {
                            if (!checkType(action[e], ["string"], "All values for " + act + ".avoidStandbyHax")) {
                                break;
                            }
                        }
                    }
                }
                if (checkType(role.actions.initialCondition, ["object"], act + ".initialCondition")) {
                    action = role.actions.initialCondition;
                    comm = act + ".initialCondition";
                    
                    checkAttributes(action, [], ["poison", "clearPoison", "curse", "clearCurse"], comm);
                    
                    if (checkType(action.poison, ["object"], comm + ".poison")) {
                        checkAttributes(action.poison, [], ["count", "poisonDeadMessage"], comm + ".poison");
                        checkType(action.poison.count, ["number"], comm + ".poison.count");
                        checkType(action.poison.poisonDeadMessage, ["string"], comm + ".poison.poisonDeadMessage");
                    }
                    
                    checkValidValue(action.clearPoison, [true, false], comm + ".clearPoison");
                    
                    if (checkType(action.curse, ["object"], comm + ".curse")) {
                        checkAttributes(action.curse, ["cursedRole"], ["curseCount", "curseConvertMessage", "silentCurse"], comm + ".curse");
                        
                        if (checkType(action.curse.cursedRole, ["string"], comm + ".curse.cursedRole")) {
                            checkValidRole(action.curse.cursedRole, comm + ".curse.cursedRole");
                        }
                        checkType(action.curse.curseCount, ["number"], comm + ".curse.curseCount");
                        checkType(action.curse.curseConvertMessage, ["string"], comm + ".curse.curseConvertMessage");
                        checkType(action.curse.silentCurse, ["boolean"], comm + ".curse.silentCurse");
                    }
                    
                    checkValidValue(action.clearCurse, [true, false], comm + ".clearCurse");
                }
                if (checkType(role.actions.startup, ["string", "object"], act + ".startup")) {
                    action = role.actions.startup;
                    comm = act + ".startup";
                    
                    if (typeof action == "string") {
                        checkValidValue(action, ["team-reveal", "role-reveal", "team-reveal-with-roles"], act + ".startup");
                    } else if (typeof action == "object") {
                        checkAttributes(action, [], ["revealRole", "team-revealif", "team-revealif-with-roles", "revealAs", "revealPlayers", "revealPlayersMsg"], act + ".startup");
                        
                        if (checkType(action.revealAs, ["string"], comm + ".revealAs")){
                            checkValidRole(action.revealAs, comm + ".revealAs");
                        }
                        
                        if (checkType(action.revealRole, ["string", "array"], comm + ".revealRole")) {
                            if (typeof action.revealRole == "string") {
                                checkValidRole(action.revealRole, comm + ".revealRole");
                            } else if (Array.isArray(action.revealRole)) {
                                for (e in action.revealRole) {
                                    checkValidRole(action.revealRole[e], comm + ".revealRole");
                                }
                            }
                        }
                        
                        if (checkType(action.revealPlayers, ["string", "array"], comm + ".revealPlayers")) {
                            if (typeof action.revealPlayers == "string") {
                                checkValidRole(action.revealPlayers, comm + ".revealPlayers");
                            } else if (Array.isArray(action.revealPlayers)) {
                                for (e in action.revealPlayers) {
                                    checkValidRole(action.revealPlayers[e], comm + ".revealPlayers");
                                }
                            }
                        }
                        checkType(action.revealPlayersMsg, ["string"], comm + ".revealPlayersMsg");
                    
                        if (checkType(action["team-revealif"], ["array"], comm + ".team-revealif")) {
                            for (e in action["team-revealif"]) {
                                checkValidSide(action["team-revealif"][e], comm + ".team-revealif");
                            }
                        }
                    
                        if (checkType(action["team-revealif-with-roles"], ["array"], comm + ".team-revealif-with-roles")) {
                            for (e in action["team-revealif-with-roles"]) {
                                checkValidSide(action["team-revealif-with-roles"][e], comm + ".team-revealif-with-roles");
                            }
                        }
                    }
                }
                
                checkType(role.actions.updateCharges, ["boolean"], act + ".updateCharges");
                checkType(role.actions.updateVote, ["boolean"], act + ".updateVote");
                checkType(role.actions.updateTeam, ["boolean"], act + ".updateTeam");
                checkType(role.actions.teamUtilities, ["boolean"], act + ".teamUtilities");
                
                if (checkType(role.actions.onlist, ["string"], act + ".onlist")) {
                    checkValidRole(role.actions.onlist, act + ".onlist");
                }
                if (checkType(role.actions.onteam, ["string"], act + ".onteam")) {
                    checkValidRole(role.actions.onteam, act + ".onteam");
                }
                if (checkType(role.actions.lynch, ["object"], act + ".lynch")) {
                    action = role.actions.lynch;
                    comm = act + ".lynch";
                    var lynchActions = ["revealAs", "convertTo", "convertmsg", "lynchmsg", "killVoters", "convertVoters"];
                    this.checkOnDeath(action, comm, lynchActions, true);
                    
                    if (checkType(action.revealAs, ["string"], comm + ".revealAs")) {
                        checkValidRole(role.actions.lynch.revealAs, comm + ".revealAs");
                    }
                    if (checkType(action.convertTo, ["string"], comm + ".convertTo")) {
                        checkValidRole(role.actions.lynch.convertTo, comm + ".convertTo");
                    }
                    if (checkType(action.lynchmsg, ["string"], comm + ".lynchmsg")) {
                        if (!("convertTo" in action)) {
                            addMinorError("'lynchmsg' found at " + comm + ", but there's no '" + comm + ".convertTo'");
                        }
                    }
                    if (checkType(action.killVoters, ["object"], comm + ".killVoters")) {
                        checkAttributes(action.killVoters, [], ["first", "last", "random", "message"], comm + ".killVoters");
                        
                        checkType(action.killVoters.first, ["number"], comm + ".killVoters.first");
                        checkType(action.killVoters.last, ["number"], comm + ".killVoters.last");
                        checkType(action.killVoters.random, ["number"], comm + ".killVoters.random");
                        checkType(action.killVoters.message, ["string"], comm + ".killVoters.message");
                    }
                    if (checkType(action.convertVoters, ["object"], comm + ".convertVoters")) {
                        checkAttributes(action.convertVoters, ["newRole"], ["first", "last", "random", "message"], comm + ".convertVoters");
                        
                        if (checkType(action.convertVoters.newRole, ["object"], comm + ".convertVoters.newRole")) {
                            for (e in action.convertVoters.newRole) {
                                checkValidRole(e, comm + ".convertVoters.newRole");
                                if (checkType(action.convertVoters.newRole[e], ["array"], comm + ".convertVoters.newRole." + e)) {
                                    for (i in action.convertVoters.newRole[e]) {
                                        checkValidRole(action.convertVoters.newRole[e][i], comm + ".convertVoters.newRole." + e);
                                    }
                                }
                            }
                        }
                        checkType(action.convertVoters.first, ["number"], comm + ".convertVoters.first");
                        checkType(action.convertVoters.last, ["number"], comm + ".convertVoters.last");
                        checkType(action.convertVoters.random, ["number"], comm + ".convertVoters.random");
                        checkType(action.convertVoters.message, ["string"], comm + ".convertVoters.message");
                    }
                }
                if (checkType(role.actions.teamTalk, ["boolean", "array"], act + ".teamTalk")) {
                    if (Array.isArray(role.actions.teamTalk)) {
                        action = role.actions.teamTalk;
                        for (e in action) {
                            checkValidRole(action[e], act + ".teamTalk");
                        }
                    }
                }
            }
        }
    };
    Theme.prototype.checkOnDeath = function(action, comm, extra, isLynch) {
        var e;
        
        checkAttributes(action, [], ["killRoles", "poisonRoles", "convertRoles", "curseRoles", "exposeRoles", "killmsg", "convertmsg", "curseCount", "cursemsg", "curseConvertMessage", "poisonmsg", "poisonDeadMessage", "exposemsg", "singlekillmsg", "singlepoisonmsg", "singleconvertmsg", "singlecursemsg", "silentConvert", "silentCurse"].concat(extra), comm);
                    
        checkType(action.onslay, ["boolean"], comm + ".onslay");
        
        /* onDeath.killRoles related attributes */
        if (checkType(action.killRoles, ["array"], comm + ".killRoles")) {
            for (e in action.killRoles) {
                checkValidRole(action.killRoles[e], comm + ".killRoles");
            }
        }
        
        if (checkType(action.killmsg, ["string"], comm + ".killmsg")) {
            if (!("killRoles" in action)) {
                addMinorError("'killmsg' found at " + comm + ", but there's no 'killRoles'");
            }
        }
        if (checkType(action.singlekillmsg, ["string"], comm + ".singlekillmsg")) {
            if (!("killRoles" in action)) {
                addMinorError("'singlekillmsg' found at " + comm + ", but there's no 'singlekillmsg'");
            }
            if ("killmsg" in action) {
                addMinorError(comm + " has both 'killmsg' and 'singlekillmsg', so 'killmsg' won't be used");
            }
        }
        
        /* onDeath.poisonRoles related attributes */
        if (checkType(action.poisonRoles, ["object"], comm + ".poisonRoles")) {
            for (e in action.poisonRoles) {
                checkValidRole(e, comm + ".poisonRoles");
                checkType(action.poisonRoles[e], ["number"], comm + ".poisonRoles." + e);
            }
        }
        if (checkType(action.poisonDeadMessage, ["string"], comm + ".poisonDeadMessage")) {
            if (!("poisonRoles" in action)) {
                addMinorError("'poisonDeadMessage' found at " + comm + ", but there's no 'poisonRoles'");
            }
        }
        if (checkType(action.poisonmsg, ["string"], comm + ".poisonmsg")) {
            if (!("poisonRoles" in action)) {
                addMinorError("'poisonmsg' found at " + comm + ", but there's no 'poisonRoles'");
            }
        }
        if (checkType(action.singlepoisonmsg, ["string"], comm + ".singlepoisonmsg")) {
            if (!("poisonRoles" in action)) {
                addMinorError("'singlepoisonmsg' found at " + comm + ", but there's no 'singlepoisonmsg'");
            }
            if ("poisonmsg" in action) {
                addMinorError(comm + " has both 'poisonmsg' and 'singlepoisonmsg', so 'poisonmsg' won't be used");
            }
        }
        
        /* onDeath.detoxRoles related attributes */
        if (checkType(action.detoxRoles, ["array"], comm + ".detoxRoles")) {
            for (var i = 0; i < action.detoxRoles.length; ++i) {
                checkValidRole(action.detoxRoles[i], comm + ".detoxRoles");
            }
        }
        if (checkType(action.detoxMsg, ["string"], comm + ".detoxMsg")) {
            if (!("detoxRoles" in action)) {
                addMinorError("'detoxMsg' found at " + comm + ", but there's no 'detoxRoles'");
            }
        }
        
        /* onDeath.convertRoles related attributes */
        if (checkType(action.convertRoles, ["object"], comm + ".convertRoles")) {
            for (e in action.convertRoles) {
                checkValidRole(e, comm + ".convertRoles");
                checkValidRole(action.convertRoles[e], comm + ".convertRoles." + e);
            }
        }
        if (checkType(action.convertmsg, ["string"], comm + ".convertmsg")) {
            if (!("convertRoles" in action) && (!isLynch || !("convertTo" in action))) {
                addMinorError("'convertmsg' found at " + comm + ", but there's no 'convertRoles'" + (isLynch ? " or 'convertTo'" : ""));
            }
        }
        if (checkType(action.singleconvertmsg, ["string"], comm + ".singleconvertmsg")) {
            if (!("convertRoles" in action)) {
                addMinorError("'singleconvertmsg' found at " + comm + ", but there's no 'singleconvertmsg'");
            }
            if ("convertmsg" in action) {
                addMinorError(comm + " has both 'convertmsg' and 'singleconvertmsg', so 'convertmsg' won't be used");
            }
        }
        checkType(action.silentConvert, ["boolean"], comm + ".silentConvert");
        
        /* onDeath.curseRoles related attributes */
        if (checkType(action.curseRoles, ["object"], comm + ".curseRoles")) {
            for (e in action.curseRoles) {
                checkValidRole(e, comm + ".curseRoles");
                checkValidRole(action.curseRoles[e], comm + ".curseRoles." + e);
            }
        }
        if (checkType(action.curseCount, ["number"], comm + ".curseCount")) {
            if (!("curseRoles" in action)) {
                addMinorError("'curseCount' found at " + comm + ", but there's no 'curseRoles'");
            }
        }
        if (checkType(action.curseConvertMessage, ["string"], comm + ".curseConvertMessage")) {
            if (!("curseRoles" in action)) {
                addMinorError("'curseConvertMessage' found at " + comm + ", but there's no 'curseRoles'");
            }
        }
        if (checkType(action.cursemsg, ["string"], comm + ".cursemsg")) {
            if (!("curseRoles" in action)) {
                addMinorError("'cursemsg' found at " + comm + ", but there's no 'curseRoles'");
            }
        }
        if (checkType(action.singlecursemsg, ["string"], comm + ".singlecursemsg")) {
            if (!("curseRoles" in action)) {
                addMinorError("'singlecursemsg' found at " + comm + ", but there's no 'singlecursemsg'");
            }
            if ("cursemsg" in action) {
                addMinorError(comm + " has both 'cursemsg' and 'singlecursemsg', so 'cursemsg' won't be used");
            }
        }
        checkType(action.silentCurse, ["boolean"], comm + ".silentCurse");
        
        /* onDeath.exposeRoles related attributes */
        if (checkType(action.exposeRoles, ["array"], comm + ".exposeRoles")) {
            for (e in action.exposeRoles) {
                checkValidRole(action.exposeRoles[e], comm + ".exposeRoles");
            }
        }
        if (checkType(action.exposemsg, ["string"], comm + ".exposemsg")) {
            if (!("exposeRoles" in action)) {
                addMinorError("'exposemsg' found at " + comm + ", but there's no 'exposeRoles'");
            }
        }
    };
    Theme.prototype.checkActions = function() {
        var r, e, i, role, act;
        var night = [], standby = [];
        for (r in  this.roles) {
            role = this.roles[r];
            if ("night" in role.actions) {
                for (e in role.actions.night) {
                    if (night.indexOf(e) == -1) {
                        night.push(e);
                    }
                    if (badCommands.indexOf(e.toLowerCase()) !== -1) {
                        addMinorError("Command '" + e + "' found at " + role.role + ".actions.night is not advised as it's a channel/server command." );
                    }
                }
            }
            if ("standby" in role.actions) {
                for (e in role.actions.standby) {
                    if (standby.indexOf(e) == -1) {
                        standby.push(e);
                    }
                    if (badCommands.indexOf(e.toLowerCase()) !== -1) {
                        addMinorError("Command '" + e + "' found at " + role.role + ".actions.standby is not advised as it's a channel/server command." );
                    }
                }
            }
        }

        for (r in this.roles) {
            role = this.roles[r];
            if ("night" in role.actions) {
                for (e in role.actions.night) {
                    if ("cancel" in role.actions.night[e]) {
                        act = role.actions.night[e].cancel;
                        for (i in act) {
                            if (night.indexOf(act[i]) == -1) {
                                addMinorError("Your role <b>" + r + "</b> has an invalid command " + act[i] + " night action " + e + ".cancel.");
                            }
                        }
                    }
                    if ("restrict" in role.actions.night[e]) {
                        act = role.actions.night[e].restrict;
                        for (i in act) {
                            if (night.indexOf(act[i]) == -1) {
                                addMinorError("Your role <b>" + r + "</b> has an invalid command " + act[i] + " night action " + e + ".restrict.");
                            }
                        }
                    }
                }
            }
            if ("hax" in role.actions) {
                for (e in role.actions.hax) {
                    if (night.indexOf(e) == -1) {
                        addMinorError("Your role <b>" + r + "</b> gets hax on an inexistent " + e + " night action.");
                    }
                }
            }
            if ("avoidHax" in role.actions) {
                for (e in role.actions.avoidHax) {
                    if (!("night" in role.actions) || !(role.actions.avoidHax[e] in role.actions.night)) {
                        addMinorError("Your role <b>" + r + "</b> avoids hax from an inexistent " + role.actions.avoidHax[e] + " night action.");
                    }
                }
            }
            if ("standbyHax" in role.actions) {
                for (e in role.actions.standbyHax) {
                    if (standby.indexOf(e) == -1) {
                        addMinorError("Your role <b>" + r + "</b> gets hax on an inexistent " + e + " standby action.");
                    }
                }
            }
            if ("avoidStandbyHax" in role.actions) {
                for (e in role.actions.avoidStandbyHax) {
                    if (!("standby" in role.actions) || !(role.actions.avoidStandbyHax[e] in role.actions.standby)) {
                        addMinorError("Your role <b>" + r + "</b> avoids hax from an inexistent " + role.actions.avoidStandbyHax[e] + " standby action.");
                    }
                }
            }
        }
    };

    function isRole(role) {
        return role in theme.roles;
    }
    function isSide(side) {
        return side in theme.sideTranslations;
    }
    function checkValidSide(side, what) {
        if (!isSide(side)) {
            if (theme.lowerCaseSides.indexOf(side.toLowerCase()) !== -1) {
                addFatalError("Invalid side \"" + side + "\" found in " + what + ". Did you mean '" + theme.correctSides[theme.lowerCaseSides.indexOf(side.toLowerCase())] + "'?");
            } else {
                addFatalError("Invalid side \"" + side + "\" found in " + what + ". ");
            }
        }
    }
    function checkValidRole(role, what) {
        if (!isRole(role)) {
            if (theme.lowerCaseRoles.indexOf(role.toLowerCase()) !== -1) {
                addFatalError("Invalid role \"" + role + "\" found in " + what + ". Did you mean '" + theme.correctRoles[theme.lowerCaseRoles.indexOf(role.toLowerCase())] + "'?");
            } else {
                addFatalError("Invalid role \"" + role + "\" found in " + what + ". ");
            }
        }
    }
    function checkValidValue(attr, valid, msg) {
        if (attr === undefined) {
            return false;
        }
        var fullValid = valid.concat();
        if (valid.indexOf(true) !== -1) {
            fullValid.push("true");
        }
        if (valid.indexOf(false) !== -1) {
            fullValid.push("false");
        }
        if (fullValid.indexOf(attr) === -1) {
            addMinorError("Invalid value '" + attr + "' found at " + msg + " (Valid values are " + valid.join(", ") + ")");
            return false;
        }
        return true;
    }
    function checkType(atr, types, what) {
        if (atr === undefined) {
            return false;
        }
        if (types.indexOf(typeof atr) !== -1) {
            return true;
        }
        if (types.indexOf("array") !== -1 && Array.isArray(atr)) {
            return true;
        }

        addFatalError(what + " must be a valid " + readable(types, "or") + ".");
        return false;
    }
    function checkAttributes(obj, mandatory, optional, what) {
        var e;
        var correct = mandatory.concat(optional);
        var lower = correct.map(function(x) { return x.toLowerCase(); });
        if (typeof obj == "object") {
            for (e in mandatory) {
                if (!(mandatory[e] in obj)) {
                    addFatalError(what + ' is missing the attribute "' + mandatory[e] + '".');
                }
            }
            for (e in obj) {
                if (mandatory.indexOf(e) == -1 && optional.indexOf(e) == -1) {
                    if (lower.indexOf(e.toLowerCase()) !== -1) {
                        addMinorError('Attribute "' + e + '" for "' + what + '" should be written as "' + correct[lower.indexOf(e.toLowerCase())]+ '".');
                    } else {
                        addMinorError(what + ' has an extra attribute "' + e + '".');
                    }
                }
            }
        } else {
            addFatalError(what + ' is not a valid object.');
        }
    }
    function commonNightActions(yourRole, action, command) {
        var act = yourRole + ".night." + command, c;
        
        checkValidValue(action.target, ["Any", "Self", "AnyButTeam", "AnyButRole", "AnyButSelf", "OnlySelf", "OnlyTeam", "OnlyTeammates"], act + ".target");
        checkValidValue(action.common, ["Self", "Team", "Role"], act + ".common");
        checkType(action.priority, ["number"], act + ".priority");

        if (checkType(action.broadcast, ["string", "array"], act + ".broadcast")) {
            if (Array.isArray(action.broadcast)) {
                for (var e in action.broadcast) {
                    checkValidRole(action.broadcast[e], act + ".broadcast");
                }
            } else {
                checkValidValue(action.broadcast, ["none", "team", "role", "all", "*"], act + ".broadcast");
            }
        }
        
        if (checkType(action.command, ["string", "array", "object"], act + ".command")) {
            if (Array.isArray(action.command)) {
                for (c in action.command) {
                    checkValidValue(action.command[c], possibleNightActions, act + ".command");
                }
            } else if (typeof action.command === "object") {
                for (c in action.command) {
                    checkValidValue(c, possibleNightActions, act + ".command");
                }
            } else if (typeof action.command === "string") {
                checkValidValue(action.command, possibleNightActions, act + ".command");
            }
        } else {
            checkValidValue(command, possibleNightActions, yourRole + ".night");
        }
        checkType(action.limit, ["number"], act + ".limit");
        checkType(action.failChance, ["number"], act + ".failChance");
        checkType(action.recharge, ["number"], act + ".recharge");
        checkType(action.initialrecharge, ["number"], act + ".initialrecharge");
        checkType(action.broadcastmsg, ["string"], act + ".broadcastmsg");
        checkType(action.inputmsg, ["string"], act + ".inputmsg");
        checkType(action.charges, ["number"], act + ".charges");
        checkType(action.chargesmsg, ["string"], act + ".chargesmsg");
        checkType(action.clearCharges, ["boolean"], act + ".clearCharges");
        checkType(action.addCharges, ["number"], act + ".addCharges");
        checkType(action.suicideChance, ["number"], act + ".suicideChance");
        checkType(action.suicidemsg, ["string"], act + ".suicidemsg");
        checkType(action.redirectActions, ["array"], act + ".redirectActions");
        checkType(action.restrict, ["array"], act + ".restrict");
        checkType(action.cancel, ["array"], act + ".cancel");
        checkType(action.pinpointFailMsg, ["string"], act + ".pinpointFailMsg");
        checkType(action.pinpointBroadcastFailMsg, ["string"], act + ".pinpointBroadcastFailMsg");
        checkType(action.ignoreDistract, ["boolean"], act + ".ignoreDistract");
        checkType(action.onlyUser, ["boolean"], act + ".onlyUser");
        checkType(action.noRepeat, ["boolean"], act + ".noRepeat");
        checkType(action.pierce, ["boolean"], act + ".pierce");
        checkType(action.pierceChance, ["number"], act + ".pierceChance");
        checkType(action.maxHax, ["number"], act + ".maxHax");
        checkType(action.haxMultiplier, ["number"], act + ".haxMultiplier");
        checkType(action.compulsory, ["boolean"], act + ".compulsory");
        checkType(action.noFollow, ["boolean"], act + ".noFollow");
        checkType(action.userMustBeVisited, ["boolean"], act + ".userMustBeVisited");
        checkType(action.targetMustBeVisited, ["boolean"], act + ".targetMustBeVisited");
        checkType(action.targetMustVisit, ["boolean"], act + ".targetMustVisit");
        checkType(action.userMustVisit, ["boolean"], act + ".userMustVisit");
        if (checkType(action.bypass, ["array"], act + ".bypass")) {
            for (c in action.bypass) {
                checkValidValue(action.bypass[c], ["ignore", "ChangeTarget", "killattacker", "poisonattacker", "identify", "die", "evadeChance", "evadeCharges", "killif", "resistance"], act + ".bypass");
            }
        }
    }
    function addMinorError(msg) {
        minorErrors.push(msg);
        noMinor = false;
    }
    function addFatalError(msg) {
        fatalErrors.push(msg);
        noFatal = false;
    }
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function readable(arr, last_delim) {
        if (!Array.isArray(arr))
        return arr;
        if (arr.length > 1) {
            return arr.slice(0, arr.length-1).join(", ") + " " + last_delim + " " + arr.slice(-1)[0];
        } else if (arr.length == 1) {
            return arr[0];
        } else {
            return "";
        }
    }
    function assignVariable(master, index, prop, variables, path) {
        var variable, len, j, val;
        
        if (typeof prop === 'string' && prop.slice(0, 9) === 'variable:') {
            variable = prop.slice(9);
            // Check for undefined variable here.
            if (!(variable in variables)) {
                addFatalError("Invalid variable " + variable + " found at " + path + "." + index + ".");
            } else {
                master[index] = variables[variable];
            }
        } else if (Array.isArray(prop)) {
            for (j = 0, len = prop.length; j < len; j += 1) {
                val = prop[j];
                assignVariable(prop, j, val, variables, path + "." + index);
            }
        } else if (Object.prototype.toString.call(prop) === '[object Object]') {
            for (j in prop) {
                assignVariable(prop, j, prop[j], variables, path + "." + index);
            }
        }
    }
}
module.exports = new mafiaChecker();
