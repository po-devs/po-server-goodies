/*
* mafia.js
*
* Contains code for server side mafia game.
* Original code by unknown.
*/

// Global variables inherited from scripts.js
/*global mafiabot, getTimeString, updateModule, script, sys, SESSION, sendChanAll, require, Config, module, sachannel, sendChanHtmlAll*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true,eqnull:true*/
var MAFIA_CHANNEL = "Mafia";

var is_command = require("utilities.js").is_command;
var nonFlashing = require("utilities.js").non_flashing;
var html_escape = require("utilities.js").html_escape;

function Mafia(mafiachan) {
    this.version = "2012-12-15";
    var mafia = this;

    this.mafiaStats = require("mafiastats.js");
    this.mafiaChecker = require("mafiachecker.js");
    sys.makeDir(Config.dataDir + "mafiathemes/");

    var DEFAULT_BORDER = "***************************************************************************************",
        GREEN_BORDER = " " + DEFAULT_BORDER + ":",
        border,
        noPlayer = '*',
        CurrentGame,
        PreviousGames,
        MAFIA_SAVE_FILE = Config.Mafia.stats_file,
        MAFIA_LOG_FILE = "mafialogs.txt",
        stalkLogs = [],
        currentStalk = [],
        phaseStalk = {},
        isDummyCommand = /^dummy(?:\d+)?$/,
        featuredTheme,
        featuredLink,
        featuredInterval = 60,
        featuredText = "Please read and follow the /mafiarules! Also, be mindful of your caps, flooding, and insulting other users.",
        deadTime = 0,
        peak,
        npcutoff = 13,
        timesBeforeNonPeak = 3, //number of dead games before enabling non-peak
        numPlayersBeforeDead = 10; //number of players before game is counted as not dead

    var savePlayedGames = function () {
        sys.writeToFile(MAFIA_SAVE_FILE, JSON.stringify(PreviousGames));
        sys.saveVal("Stats/MafiaGamesPlayed", 1 + (+sys.getVal("Stats/MafiaGamesPlayed")));
    };
    var loadPlayedGames = function () {
        try {
            PreviousGames = JSON.parse(sys.getFileContent(MAFIA_SAVE_FILE));
        } catch (e) {
            PreviousGames = [];
        }
        try {
            stalkLogs = sys.getFileContent(MAFIA_LOG_FILE).split("::@@::");
        } catch (e) {
            stalkLogs = [];
        }
    };
    loadPlayedGames();

    /*Dumps a typically large message to a user in any channel*/
    function dump(src, mess, channel) {
        if (channel === undefined) {
            channel = mafiachan;
        }
        for (var x in mess) {
            sys.sendMessage(src, mess[x], channel);
        }
    }
    /*Sends a Mafia bot message*/
    function msg(src, mess, channel) {
        if (channel === undefined) {
            channel = mafiachan;
        }
        mafiabot.sendMessage(src, mess, channel);
        return true;
    }
    function msgAll(mess, channel) {
        if (channel === undefined) {
            channel = mafiachan;
        }
        mafiabot.sendAll(mess, channel);
        return true;
    }
    /*Sends a Game bot message, if no bot name is defined, it adds "±Game"
    * Note: use "srcname" instead of "src" as src holds the player's ID*/
    function gamemsg(src, mess, botName, channel) {
        if (mess === undefined || mess.length === 0) {
            return;
        }
        var id = sys.id(src);
        if (id === undefined) {
            return;
        }
        if (mess.indexOf("***") === -1 && mess.indexOf("±") === -1 && mess.lastIndexOf(":") !== (parseInt(mess.length, 10) - 1) && mess.substring(0, Config.Mafia.max_name_length + 1).indexOf(":") === -1) {
            mess = "±" + (botName ? botName : "Game") + ": " + mess;
        }
        if (channel === undefined) {
            channel = mafiachan;
        }
        sys.sendMessage(id, mess, channel);
        return true;
    }
    function gamemsgAll(mess, botName, channel) {
        if (mess === undefined || mess.length === 0) {
            return;
        }
        if (mess.indexOf("***") === -1 && mess.indexOf("±") === -1 && mess.lastIndexOf(":") !== (parseInt(mess.length, 10) - 1) && mess.substring(0, Config.Mafia.max_name_length + 1).indexOf(":") === -1) {
            mess = "±" + (botName ? botName : "Game") + ": " + mess;
        }
        if (channel === undefined) {
            channel = mafiachan;
        }
        sendChanAll(mess, channel);
        return true;
    }
    /* Replaces keywords in messages */
    function formatArgs(mess, args) {
        if (mess === undefined || mess.length === 0) {
            return;
        }
        for (var i in args) {
            mess = mess.replace(new RegExp(i, "g"), args[i]);
        }
        return mess;
    }
    /*Sends a message to Mafia and Victory Road*/
    function dualBroadcast(mess) {
        sendChanAll(mess, mafiachan);
        sendChanAll(mess, sachannel);
        return true;
    }
    /* stolen from here: http://snippets.dzone.com/posts/show/849 */
    function shuffle(o) {
        for (var j, x, i = o.length; i; j = parseInt(Math.random() * i, 10), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }
    /* stolen from here: http://stackoverflow.com/questions/1026069/capitalize-first-letter-of-string-in-javascript */
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    /*Determines if "a" or "an" is required*/
    function an(string) {
        var vowels = "aeioux";
        if (vowels.indexOf(string.charAt(0)) > -1) {
            string = "an " + string;
        } else {
            string = "a " + string;
        }
        return string;
    }
    /* format arrays so that it looks fine to humans. also accepts a string, in which case just returns it */
    function readable(arr, last_delim) {
        if (!Array.isArray(arr))
            return arr;
        if (arr.length > 1) {
            return arr.slice(0, arr.length - 1).join(", ") + " " + last_delim + " " + arr.slice(-1)[0];
        } else if (arr.length == 1) {
            return arr[0];
        } else {
            return "";
        }
    }
    function removeDuplicates(arr) {
        var result = {};
        for (var x in arr) {
            result[arr[x]] = 1;
        }
        return Object.keys(result);
    }
    function casedtheme(themename) {
        if (mafia.themeManager.themes.hasOwnProperty(themename)) {
            return mafia.themeManager.themes[themename].name;
        }
        return themename;
    }
    function assignVariable(master, index, prop, variables) {
        var variable, len, j, val;
        
        if (typeof prop === 'string' && prop.slice(0, 9) === 'variable:') {
            variable = prop.slice(9);
            master[index] = variables[variable];
        } else if (Array.isArray(prop)) {
            for (j = 0, len = prop.length; j < len; j += 1) {
                val = prop[j];
                assignVariable(prop, j, val, variables);
            }
        } else if (Object.prototype.toString.call(prop) === '[object Object]') {
            for (j in prop) {
                assignVariable(prop, j, prop[j], variables);
            }
        }
    }
    function randomSample(hash) {
        var cum = 0;
        var val = Math.random();
        var psum = 0.0;
        var x;
        var count = 0;
        for (x in hash) {
            psum += hash[x];
            count += 1;
        }
        if (psum === 0.0) {
            var j = 0;
            for (x in hash) {
                cum = (++j) / count;
                if (cum >= val) {
                    return x;
                }
            }
        } else {
            for (x in hash) {
                cum += hash[x] / psum;
                if (cum >= val) {
                    return x;
                }
            }
        }
    }
    
    function runUpdate() {
        if (mafia.needsUpdating !== true) return;
        var POglobal = SESSION.global();
        var index, source;
        mafia.mafiaStats.update();
        mafia.mafiaChecker.update();
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if ("mafia.js" == POglobal.plugins[i].source) {
                source = POglobal.plugins[i].source;
                index = i;
            }
        }
        if (index !== undefined) {
            updateModule(source, function (module) {
                POglobal.plugins[index] = module;
                module.source = source;
                module.init();
                mafia.endGame(false);
                sendChanAll("Update Complete!", mafiachan);
            });
            sendChanAll("Updating Mafia Script...", mafiachan);
            mafia.needsUpdating = false;
        }
    }
    
    var defaultTheme = { name: "Default",
        sides: [
          {"side": "mafia", "translation": "Mafia"},
          {"side": "mafia1", "translation": "French Canadian Mafia"},
          {"side": "mafia2", "translation": "Italian Mafia"},
          {"side": "village", "translation": "Good people"},
          {"side": "werewolf", "translation": "WereWolf"},
          {"side": "godfather", "translation": "Godfather"}],
        roles: [{
            "role": "villager",
            "translation": "Villager",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day!",
            "actions": {}
        }, {
            "role": "inspector",
            "translation": "Inspector",
            "side": "village",
            "help": "Type /Inspect [name] to find his/her identity!",
            "actions": { "night": { "inspect": { "target": "AnyButSelf", "common": "Self", "priority": 30 } } }
        }, {
            "role": "bodyguard",
            "translation": "Bodyguard",
            "side": "village",
            "help": "Type /Protect [name] to protect someone!",
            "actions": {
                "night": { "protect": { "target": "AnyButSelf", "common": "Role", "priority": 5, "broadcast": "role" } },
                "startup": "role-reveal"}
        }, {
            "role": "mafia",
            "translation": "Mafia",
            "side": "mafia",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team" } },
                "startup": "team-reveal"}
        }, {
            "role": "werewolf",
            "translation": "WereWolf",
            "side": "werewolf",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButSelf", "common": "Self", "priority": 10 } },
                "distract": { "mode": "ChangeTarget", "hookermsg": "You tried to distract the Werewolf (what an idea, srsly), you were ravishly devoured, yum!", "msg": "The ~Distracter~ came to you last night! You devoured her instead!" },
                "avoidHax": ["kill"]}
        }, {
            "role": "hooker",
            "translation": "Pretty Lady",
            "side": "village",
            "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!",
            "actions": { "night": { "distract": { "target": "AnyButSelf", "common": "Self", "priority": 1 } } }
        }, {
            "role": "mayor",
            "translation": "Mayor",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day! (your vote counts as 2)",
            "actions": { "vote": 2 }
        }, {
            "role": "spy",
            "translation": "Spy",
            "side": "village",
            "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!",
            "actions": { "hax": { "kill": { "revealTeam": 0.33, "revealPlayer": 0.1 } } }
        }, {
            "role": "godfather",
            "translation": "Godfather",
            "side": "godfather",
            "help": "Type /Kill [name] to kill someone! You can kill 2 targets, Type /kill [name2] again to select your second target!",
            "actions": {
                "night": { "kill": { "target": "AnyButSelf", "common": "Self", "priority": 20, "limit": 2 } },
                "distract": { "mode": "ChangeTarget", "hookermsg": "You tried to seduce the Godfather... you were killed instead!", "msg": "The ~Distracter~ came to you last night! You killed her instead!" },
                "avoidHax": ["kill"]}
        }, {
            "role": "vigilante",
            "translation": "Vigilante",
            "side": "village",
            "help": "Type /Kill [name] to kill someone!(dont kill the good people!)",
            "actions": { "night": { "kill": { "target": "AnyButSelf", "common": "Self", "priority": 19 } } }
        }, {
            "role": "mafia1",
            "translation": "French Canadian Mafia",
            "side": "mafia1",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team" } },
                "startup": "team-reveal"}
        }, {
            "role": "mafia2",
            "translation": "Italian Mafia",
            "side": "mafia2",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team" } },
                "startup": "team-reveal"}
        }, {
            "role": "conspirator1",
            "translation": "French Canadian Conspirator",
            "side": "mafia1",
            "help": "You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!",
            "actions": {
                "inspect": { "revealAs": "villager" },
                "startup": "team-reveal"}
        }, {
            "role": "conspirator2",
            "translation": "Italian Conspirator",
            "side": "mafia2",
            "help": "You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!",
            "actions": {
                "inspect": { "revealAs": "villager" },
                "startup": "team-reveal"}
        }, {
            "role": "mafiaboss1",
            "translation": "Don French Canadian Mafia",
            "side": "mafia1",
            "help": "Type /Kill [name] to kill someone! You can't be distracted!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team" } },
                "distract": { "mode": "ignore" },
                "startup": "team-reveal"}
        }, {
            "role": "mafiaboss2",
            "translation": "Don Italian Mafia",
            "side": "mafia2",
            "help": "Type /Kill [name] to kill someone! You can't be distracted!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team" } },
                "distract": { "mode": "ignore" },
                "startup": "team-reveal"}
        }, {
            "role": "samurai",
            "translation": "Samurai",
            "side": "village",
            "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people.",
            "actions": {
                "standby": {"kill": {"target": "AnyButSelf", "msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ pulls out a sword and strikes it through ~Target~'s chest!"}}}
        }, {
            "role": "miller",
            "translation": "Miller",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day! Oh, and insp sees you as Mafia",
            "actions": { "inspect": { "revealAs": "mafia" } }
        }, {
            "role": "truemiller",
            "translation": "Miller",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day!",
            "actions": { "inspect": { "revealAs": "mafia" }, "lynch": { "revealAs": "truemiller" }, "startup": { "revealAs": "villager" }, "onlist": "mafia" }
        }, {
            "role": "miller1",
            "translation": "Miller",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day!",
            "actions": { "inspect": { "revealAs": "mafia1" }, "lynch": { "revealAs": "miller1" }, "startup": { "revealAs": "villager" }, "onlist": "mafia1" }
        }, {
            "role": "miller2",
            "translation": "Miller",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day!",
            "actions": { "inspect": { "revealAs": "mafia2" }, "lynch": { "revealAs": "miller2" }, "startup": { "revealAs": "villager" }, "onlist": "mafia2" }
        }],
        roles1: ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "truemiller", "villager", "mafia", "villager", "mayor"],
        roles2: ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "villager","miller1", "miller2", "mafiaboss1", "villager", "vigilante", "villager", "godfather","mafiaboss2", "samurai", "villager", "villager", "werewolf", "mafia1", "mafia2", "bodyguard"],
        villageCantLoseRoles: ["mayor", "vigilante", "samurai"]
    };
    
    /* ThemeManager is a object taking care of saving and loading themes in mafia game */
    function ThemeManager() {
        this.themeInfo = [];
        this.themes = {};
    }
    ThemeManager.prototype.toString = function () { return "[object ThemeManager]"; };
    ThemeManager.prototype.save = function (name, url, resp) {
        var fname = "scriptdata/mafiathemes/theme_" + name.replace("/", "").toLowerCase();
        sys.writeToFile(fname, resp);
        var done = false;
        for (var i = 0; i < this.themeInfo.length; ++i) {
            if (script.cmp(name, this.themeInfo[i][0])) {
                done = true;
                this.themeInfo[i] = [name, url, fname, true];
                break;
            }
        }
        if (!done) {
            this.themeInfo.push([name, url, fname, true]);
        }
        sys.writeToFile("scriptdata/mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
    };
    ThemeManager.prototype.loadTheme = function (plain_theme) {
        var theme = new Theme();
        try {
            theme.sideTranslations = {};
            theme.sideWinMsg = {};
            theme.roles = {};
            theme.nightPriority = [];
            theme.standbyRoles = [];
            theme.haxRoles = {};
            theme.standbyHaxRoles = {};
            theme.randomSideRoles = {};

            // Parse variables first - so we can extract the actual value later.
            theme.variables = plain_theme.variables;
            
            var i;
            // This is only done when variables are available.
            if (Object.prototype.toString.call(theme.variables) === '[object Object]') {
                // Iterate over the entire theme, parsing variable:(name) strings.
                for (i in plain_theme) {
                    var prop = plain_theme[i];
                    assignVariable(plain_theme, i, prop, theme.variables);
                }
            }
            
            // Init from the theme
            for (i in plain_theme.sides) {
                theme.addSide(plain_theme.sides[i]);
            }
            for (i in plain_theme.roles) {
                theme.addRole(plain_theme.roles[i]);
            }
            theme.roles1 = plain_theme.roles1;
            i = 2;
            while ("roles" + i in plain_theme) {
                theme["roles" + i] = plain_theme["roles" + i];
                ++i;
            }
            theme.roleLists = i - 1;
            if (theme.roleLists === 0)
                throw "This theme has no roles1, it can not be played.";
            theme.villageCantLoseRoles = plain_theme.villageCantLoseRoles;
            theme.minplayers = plain_theme.minplayers;
            theme.nolynch = plain_theme.nolynch;
            theme.ticks = plain_theme.ticks;
            theme.votesniping = plain_theme.votesniping;
            theme.silentVote = plain_theme.silentVote;
            theme.votemsg = plain_theme.votemsg;
            theme.name = plain_theme.name;
            theme.altname = plain_theme.altname;
            theme.author = plain_theme.author;
            theme.nonPeak = plain_theme.nonPeak;
            theme.closedSetup = plain_theme.closedSetup;
            theme.threadlink = plain_theme.threadlink;
            theme.summary = plain_theme.summary;
            theme.changelog = plain_theme.changelog;
            theme.killmsg = plain_theme.killmsg;
            theme.killusermsg = plain_theme.killusermsg;
            theme.drawmsg = plain_theme.drawmsg;
            theme.lynchmsg = plain_theme.lynchmsg;
            theme.noplur = plain_theme.noplur;
            theme.border = plain_theme.border;
            theme.generateRoleInfo();
            theme.generateSideInfo();
            theme.generatePriorityInfo();
            if (theme.enabled === undefined) {
                theme.enabled = true;
            }
            return theme;
        } catch (err) {
            msgAll("Couldn't use theme " + plain_theme.name + ": " + err + ".");
        }
    };
    ThemeManager.prototype.loadThemes = function () {
        if (typeof sys !== "object") return;
        this.themes = {};
        this.themes["default"] = this.loadTheme(defaultTheme);
        var content = sys.getFileContent("scriptdata/mafiathemes/metadata.json");
        if (!content) return;
        var parsed = JSON.parse(content);
        if (parsed.hasOwnProperty("meta")) {
            this.themeInfo = parsed.meta;
        }
        for (var i = 0; i < this.themeInfo.length; ++i) {
            try {
                var theme = this.loadTheme(JSON.parse(sys.getFileContent(this.themeInfo[i][2])));
                this.themes[theme.name.toLowerCase()] = theme;
                if (!this.themeInfo[i][3]) theme.enabled = false;
            } catch (err) {
                dualBroadcast("Error loading cached theme \"" + this.themeInfo[i][0] + "\": " + err);
            }
        }
    };
    ThemeManager.prototype.saveToFile = function (plain_theme) {
        if (typeof sys != "object") return;
        var fname = "scriptdata/mafiathemes/theme_" + plain_theme.name.toLowerCase();
        sys.writeToFile(fname, JSON.stringify(plain_theme));
        this.themeInfo.push([plain_theme.name, "", fname, true]);
        sys.writeToFile("scriptdata/mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
    };
    ThemeManager.prototype.loadWebTheme = function (url, announce, update, updatename, src, isNew) {
        if (typeof sys != 'object') return;
        var manager = this;
        url = mafia.checkLink(url);
        sys.webCall(url, function (resp) {
            try {
                var plain_theme = JSON.parse(resp);
                
                // Create a copy to prevent the checker from changing the theme.
                var errors = mafia.mafiaChecker.checkTheme(JSON.parse(resp));
                if (errors.fatal.length > 0) {
                    sys.sendMessage(src, "", mafiachan);
                    msg(src, "Fatal Errors found in the theme: ");
                    for (var e = 0; e < 5 && e < errors.fatal.length; e++) {
                        sys.sendHtmlMessage(src, "-" + errors.fatal[e], mafiachan);
                    }
                    if (errors.fatal.length > 5) {
                        msg(src, "And " + (errors.fatal.length - 5) + " other errors.");
                    }
                }
                if (errors.minor.length > 0) {
                    sys.sendMessage(src, "", mafiachan);
                    msg(src, "Minor Errors found in the theme: ");
                    for (var e = 0; e < 5 && e < errors.minor.length; e++) {
                        sys.sendHtmlMessage(src, "-" + errors.minor[e], mafiachan);
                    }
                    if (errors.minor.length > 5) {
                        msg(src, "And " + (errors.minor.length - 5) + " other errors.");
                    }
                }
                if (errors.fatal.length > 0) {
                    sys.sendMessage(src, "", mafiachan);
                    msg(src, "Theme contains fatal errors, unable to load it.");
                    return;
                }
                
                // Don't care about loadTheme changing plain_theme as it's not being reused.
                var theme = manager.loadTheme(plain_theme);
                var lower = theme.name.toLowerCase();
                var needsDisable = false;
                if (manager.themes.hasOwnProperty(lower) && !mafia.themeManager.themes[lower].enabled){
                    needsDisable = true;
                }
                if (manager.themes.hasOwnProperty(lower) && !update) {
                    msgAll("Won't update " + theme.name + " with /add, use /update to force an update");
                    return;
                }
                if (manager.themes.hasOwnProperty(lower) && update && updatename && updatename != lower) {
                    msgAll("Won't update '" + updatename + "' to '" + theme.name + "', use the old name.");
                    return;
                }
                manager.themes[lower] = theme;
                manager.save(theme.name, url, resp, update);
                if (announce) {
                    msgAll(sys.name(src) + (isNew ? " added " : " updated ") + "the theme " + theme.name + ".");
                } else {
                    msg(src, "You silently added/updated the theme " + theme.name);
                }
                if (needsDisable) {
                    msg(src, "This theme is disabled." + (mafia.isMafiaAdmin(src) ? "" : "Speak to a Mafia Admin to request enabling if your update addressed any concerns."));
                    mafia.themeManager.disable(src, lower, true);
                }
            } catch (err) {
                msg(src, "Couldn't download theme from " + url);
                msg(src, "" + err);
            }
        });
    };
    ThemeManager.prototype.remove = function (src, name, silent) {
        name = name.toLowerCase();
        var broadcastname = casedtheme(name);
        if (name in this.themes) {
            delete this.themes[name];
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (script.cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo.splice(i, 1);
                    break;
                }
            }
            sys.writeToFile("scriptdata/mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            if (silent) {
                msg(src, "You removed the theme " + broadcastname + ".");
            } else {
                msgAll(nonFlashing(sys.name(src)) + " removed the theme " + broadcastname + ".");
            }
            msgAll(nonFlashing(sys.name(src)) + " removed the theme " + broadcastname + ".", sachannel);
        }
    };
    ThemeManager.prototype.enable = function (src, name, silent) {
        name = name.toLowerCase();
        if (name in this.themes) {
            this.themes[name].enabled = true;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (script.cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = true;
                    break;
                }
            }
            sys.writeToFile("scriptdata/mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            var broadcastname = casedtheme(name);
            if (!silent) {
                dualBroadcast("±" + mafiabot.name + ": " + nonFlashing(sys.name(src)) + " enabled theme " + broadcastname + ".");
            }
        }
    };
    ThemeManager.prototype.disable = function (src, name, silent) {
        name = name.toLowerCase();
        if (name in this.themes) {
            this.themes[name].enabled = false;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (script.cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = false;
                    break;
                }
            }
            sys.writeToFile("scriptdata/mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            var broadcastname = casedtheme(name);
            if (!silent) {
                if (src !== Config.Mafia.bot) {
                    dualBroadcast("±" + mafiabot.name + ": " + nonFlashing(sys.name(src)) + " disabled theme " + broadcastname + ".");
                } else {
                    dualBroadcast("±" + mafiabot.name + ": " + Config.Mafia.bot + " disabled theme " + broadcastname + ".");
                }
            }
            if (featuredTheme && name === featuredTheme.toLowerCase()){
                msgAll(broadcastname + " was the Featured Theme. Please select a new one to feature!", sachannel);
                featuredTheme = undefined;
            }
        }
    };

    /* Theme is a small helper to organize themes inside the mafia game */
    function Theme() { }
    Theme.prototype.toString = function () { return "[object Theme]"; };
    Theme.prototype.addSide = function (obj) {
        this.sideTranslations[obj.side] = obj.translation;
        if ("winmsg" in obj) {
            this.sideWinMsg[obj.side] = obj.winmsg;
        }
    };
    Theme.prototype.addRole = function (obj) {
        this.roles[obj.role] = obj;
        if (!obj.actions) {
            obj.actions = {};
        }
        if (typeof obj.side == "object") {
            this.randomSideRoles[obj.role] = obj.side;
        }

        var i, action;
        if ("hax" in obj.actions) {
            for (i in obj.actions.hax) {
                action = i;
                if (!(action in this.haxRoles)) {
                    this.haxRoles[action] = [];
                }
                this.haxRoles[action].push(obj.role);
            }
        }
        if ("standbyHax" in obj.actions) {
            for (i in obj.actions.standbyHax) {
                action = i;
                if (!(action in this.standbyHaxRoles)) {
                    this.standbyHaxRoles[action] = [];
                }
                this.standbyHaxRoles[action].push(obj.role);
            }
        }
        if ("night" in obj.actions) {
            for (i in obj.actions.night) {
                var priority = obj.actions.night[i].priority;
                action = i;
                var role = obj.role;
                var hide = obj.actions.night[action].hide || false;
                this.nightPriority.push({ 'priority': priority, 'action': action, 'role': role, 'hide': hide });
            }
            this.nightPriority.sort(function (a, b) { return a.priority - b.priority; });
        }
        if ("standby" in obj.actions) {
            this.standbyRoles.push(obj.role);
        }
    };
    
    function name_trrole(x) { return x + " (" + this.trrole(mafia.players[x].role.role) + ")"; }
    Theme.prototype.generateRoleInfo = function () {
        var sep = "*** *********************************************************************** ***";
        var roles = [sep];
        var role;
        var role_i = null;
        var role_order = Object.keys(this.roles);
        var this_roles = this.roles;
        role_order.sort(function (a, b) {
            var tra = this_roles[a].translation;
            var trb = this_roles[b].translation;
            if (tra == trb)
                return 0;
            else if (tra < trb)
                return -1;
            else
                return 1;
        });

        function trrole(s) { return this.trrole(s); }
        function trside(s) { return this.trside(s); }
        for (var r = 0; r < role_order.length; ++r) {
            try {
                role = this.roles[role_order[r]];
                  // Don't add this role to /roles
                    if ((role.hide && role.hide !== "side") || role.hide == "both") {
                        continue;
                    }
                roles.push("±Role: " + role.translation);

                // check which abilities the role has
                var abilities = "", a, ability;
                if ("info" in role) {
                    abilities += role.info;
                } else {
                    if (role.actions.night) {
                        for (a in role.actions.night) {
                            ability = role.actions.night[a];
                            abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") + " during the night";
                            if ("bypass" in ability) {
                                abilities += " bypassing the modes " + readable(ability.bypass, "and");
                            }
                            if ("avoidHax" in role.actions && role.actions.avoidHax.indexOf(a) != -1) {
                                abilities += "(Cannot be detected by spies) ";
                            }
                            abilities += ". ";
                        }
                    }
                    if (role.actions.standby) {
                        for (a in role.actions.standby) {
                            ability = role.actions.standby[a];
                            abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") + " during the standby. ";
                        }
                    }
                    if ("vote" in role.actions) {
                        if (typeof role.actions.vote === "number") {
                            abilities += "Vote counts as " + role.actions.vote + ". ";
                        } else if (Array.isArray(role.actions.vote)) {
                            abilities += "Vote counts randomly between " + role.actions.vote[0] + " (inclusive) and " + role.actions.vote[1] + " (exclusive). ";
                        }
                    }
                    if ("voteshield" in role.actions) {
                        if (typeof role.actions.voteshield === "number") {
                            abilities += "Receives " + role.actions.voteshield + " extra votes if voted for at all. ";
                        } else if (Array.isArray(role.actions.voteshield)) {
                            abilities += "Receives between " + role.actions.voteshield[0] + " (inclusive) and " + role.actions.voteshield[1] + " (exclusive) extra votes randomly if voted for at all. ";
                        }
                    }
                    if ("kill" in role.actions) {
                        if (role.actions.kill.mode == "ignore") {
                            abilities += "Can't be nightkilled. ";
                        }
                        else if (role.actions.kill.mode == "killattackerevenifprotected") {
                            abilities += "Revenges nightkills (even when protected). ";
                        }
                        else if (role.actions.kill.mode == "killattacker") {
                            abilities += "Revenges nightkills. ";
                        }
                        else if (role.actions.kill.mode == "poisonattacker" || role.actions.kill.mode == "poisonattackerevenifprotected") {
                            abilities += "Poison attacker when killed. ";
                        }
                        else if (typeof role.actions.kill.mode == "object") {
                            if ("ignore" in role.actions.kill.mode) {
                                var ignoreRoles = role.actions.kill.mode.ignore.map(trrole, this);
                                abilities += "Can't be nightkilled by " + readable(ignoreRoles, "and") + ". ";
                            }
                            if ("evadeChance" in role.actions.kill.mode && role.actions.kill.mode.evadeChance > 0) {
                                abilities += "Has a " + Math.floor(role.actions.kill.mode.evadeChance * 100) + "% chance of evading nightkills. ";
                            }
                        }
                    }
                    if ("daykill" in role.actions) {
                        if (role.actions.daykill == "evade") {
                            abilities += "Can't be daykilled. ";
                        }
                        else if (role.actions.daykill == "revenge") {
                            abilities += "Counter daykills. ";
                        }
                        else if (role.actions.daykill == "bomb") {
                            abilities += "Revenges daykills. ";
                        }
                        else if (typeof role.actions.daykill == "object" && typeof role.actions.daykill.mode == "object" && role.actions.daykill.mode.evadeChance > 0) {
                            abilities += "Has a " + Math.floor(role.actions.daykill.mode.evadeChance * 100) + "% chance of evading daykills. ";
                        }
                        else if (role.actions.daykill == "revealkiller") {
                            abilities += "Reveals killer when daykilled. ";
                        }
                    }
                    if ("poison" in role.actions) {
                        if (role.actions.poison.mode == "ignore") {
                            abilities += "Can't be poisoned. ";
                        }
                        else if (typeof role.actions.poison.mode == "object" && role.actions.poison.mode.evadeChance > 0) {
                            abilities += "Has a " + Math.floor(role.actions.poison.mode.evadeChance * 100) + "% chance of evading poison. ";
                        } else if (role.actions.poison.mode == "resistance") {
                            if (typeof role.actions.poison.rate == "number") {
                                if (role.actions.poison.rate > 1) {
                                    abilities += "Dies " + role.actions.poison.rate + " times faster from poison. ";
                                } else {
                                    abilities += "Dies " + Math.round(1 / role.actions.poison.rate) + " times slower from poison. ";
                                }
                            } else {
                                if (role.actions.poison.constant > 0 || role.actions.poison.constant === undefined) {
                                    abilities += "Dies " + (role.actions.poison.constant ? role.actions.poison.constant : 1) + " nights slower from poison. ";
                                } else {
                                    abilities += "Dies " + Math.abs(role.actions.poison.constant) + " nights faster from poison. ";
                                }
                            }
                        }
                    }
                    if ("curse" in role.actions) {
                        if (role.actions.curse.mode == "resistance") {
                            if (typeof role.actions.curse.rate == "number") {
                                if (role.actions.curse.rate > 1) {
                                    abilities += "Converts " + role.actions.curse.rate  + " times faster from curses. ";
                                } else {
                                    abilities += "Converts " + Math.round(1 / role.actions.curse.rate)  + " times slower from curses. ";
                                }
                            } else {
                                if (role.actions.curse.constant > 0 || role.actions.curse.constant === undefined) {
                                    abilities += "Converts " + (role.actions.curse.constant ? role.actions.curse.constant : 1) + " nights slower from curses. ";
                                } else {
                                    abilities += "Converts " + Math.abs(role.actions.curse.constant) + " nights faster from curses. ";
                                }
                            }
                        }
                    }
                    if ("hax" in role.actions && Object.keys) {
                        var haxy = Object.keys(role.actions.hax);
                        abilities += "Gets hax on " + readable(haxy, "and") + ". ";
                    }
                    if ("inspect" in role.actions) {
                        if ("revealAs" in role.actions.inspect) {
                            if (Array.isArray(role.actions.inspect.revealAs)) {
                                var revealAs = role.actions.inspect.revealAs.map(trrole, this);
                                abilities += "Reveals as " + readable(revealAs, "or") + " when inspected. ";
                            } else if (role.actions.inspect.revealAs == "*") {
                                abilities += "Reveals as a random role when inspected. ";
                            } else {
                                abilities += "Reveals as " + this.roles[role.actions.inspect.revealAs].translation + " when inspected. ";
                            }
                        }
                    }
                    if ("distract" in role.actions) {
                        if (role.actions.distract.mode == "ChangeTarget")
                            abilities += "Kills any distractors. ";
                        if (role.actions.distract.mode == "ignore")
                            abilities += "Ignores any distractors. ";
                    }
                    if ("initialCondition" in role.actions) {
                        if ("poison" in role.actions.initialCondition) {
                            abilities += "Dies at the end of night " + (role.actions.initialCondition.poison.count || 2) + ". ";
                        }
                    }
                    if (typeof role.side == "string") {
                        abilities += "Sided with " + this.trside(role.side) + ". ";
                    } else if (typeof role.side == "object") {
                        var plop = Object.keys(role.side.random);
                        var tran = [];
                        for (var p = 0; p < plop.length; ++p) {
                            tran.push(this.trside(plop[p]));
                        }
                        abilities += "Sided with " + readable(tran, "or") + ". ";
                    }
                    if (role.hasOwnProperty("winningSides")) {
                        if (role.winningSides == "*") {
                            abilities += "Wins the game in any case. ";
                        } else if (Array.isArray(role.winningSides)) {
                                // Argh give me Function.bind already ;~;
                            abilities += "Wins the game with " + readable(role.winningSides.map(trside, this), "or");
                        }
                    }
                }
                roles.push("±Ability: " + abilities);

                // check on which player counts the role appears
                var playerCount = '';
                var roleplayers = role.players;
                
                if (roleplayers !== false) { // players: false
                    var parts = [];
                    var end = 0;
                    if (typeof roleplayers === "string") { // players: "Convert" -> Convert
                        playerCount = roleplayers;
                    } else if (typeof roleplayers === "number") { // players: 30 -> 30 Players
                        playerCount = roleplayers + " Players";
                    } else if (typeof roleplayers === "array") { // players: [20, 30] -> 20-30 Players
                        playerCount = roleplayers.join("-") + " Players";
                    } else {
                        for (var i = 1; i <= this.roleLists; ++i) {
                            role_i = "roles" + i;
                            var start = -1, v;
                            for (var e = 0; e < this[role_i].length; e++) {
                                v = this[role_i][e];
                                if ((typeof v == "string" && v == role.role) || (typeof v == "object" && role.role in v)) {
                                    start = e;
                                    break;
                                }
                            }
                            var last = end;
                            end = this[role_i].length;
                            if (start >= 0) {
                                ++start;
                                start = start > last ? start : 1 + last;
                                if (parts.length > 0 && parts[parts.length - 1][1] == start - 1) {
                                    parts[parts.length - 1][1] = end;
                                } else {
                                    parts.push([start, end]);
                                    if (parts.length > 1) {
                                        parts[parts.length - 2] = parts[parts.length - 2][0] < parts[parts.length - 2][1] ? parts[parts.length - 2].join("-") : parts[parts.length - 2][1];
                                    }
                                }
                            }
                        }
                        if (parts.length > 0) {
                            parts[parts.length - 1] = parts[parts.length - 1][0] < parts[parts.length - 1][1] ? parts[parts.length - 1].join("-") : parts[parts.length - 1][1];
                        }
                        playerCount = parts.join(", ") + " Players";
                    }

                    roles.push("±Players: " + playerCount);
                }

                roles.push(sep);
            } catch (err) {
                if (role_i === null)
                    dualBroadcast("Error adding role " + role.translation + "(" + role.role + ") to /roles");
                else
                    dualBroadcast("Error making rolelist with role id: " + role_i);
                throw err;
            }
        }
        this.roleInfo = roles;
    };
    Theme.prototype.generateSideInfo = function () {
        var sep = "*** *********************************************************************** ***";
        var sides = [sep];
        var side;
        var side_order = Object.keys(this.sideTranslations);
        var this_sideTranslations = this.sideTranslations;
        // sort sides by name
        side_order.sort(function (a, b) {
            var tra = this_sideTranslations[a];
            var trb = this_sideTranslations[b];
            if (tra == trb)
                return 0;
            else if (tra < trb)
                return -1;
            else
                return 1;
        });
        // sort roles by name
        var role;
        var role_order = Object.keys(this.roles);
        var this_roles = this.roles;
        role_order.sort(function (a, b) {
            var tra = this_roles[a].translation;
            var trb = this_roles[b].translation;
            if (tra == trb)
                return 0;
            else if (tra < trb)
                return -1;
            else
                return 1;
        });
        // check each role for its side
        var side_list = {};
        var randomSide_list = [];
        for (var r = 0; r < role_order.length; ++r) {
            try {
                role = this.roles[role_order[r]];
                //Don't add this role
                if ((role.hide && role.hide !== "role") || role.hide == "both") {
                        continue;
                }
                if (typeof role.side == "string") {
                    if (side_list[role.side] === undefined)
                        side_list[role.side] = [];
                    side_list[role.side].push(role.translation);
                } else if (typeof role.side == "object" && role.side.random) {
                    var plop = Object.keys(role.side.random);
                    var tran = [];
                    for (var p = 0; p < plop.length; ++p) {
                        tran.push(this.trside(plop[p]));
                    }
                    randomSide_list.push("±Role: " + role.translation + " can be sided with " + readable(tran, "or") + ". ");
                }
            } catch (err) {
                dualBroadcast("Error adding role " + role.translation + "(" + role.role + ") to /sides");
                throw err;
            }
        }
        // writes the list of roles for each side
        for (var s = 0; s < side_order.length; ++s) {
            try {
                side = side_order[s];
                if (side_list[side] !== undefined)
                    sides.push("±Side: The " + this.trside(side) + (side == "village" ? " (Village)" : "") + " consists of: " + side_list[side].join(", ") + ".");
            } catch (err) {
                dualBroadcast("Error adding side " + this.trside(side) + "(" + side + ") to /sides");
                throw err;
            }
        }
        if (randomSide_list.length > 0)
            sides = sides.concat(randomSide_list);
        sides.push(sep);
        this.sideInfo = sides;
    };
    Theme.prototype.generatePriorityInfo = function () {
        var priority = [];
        for (var p = 0; p < this.nightPriority.length; ++p) {
            var prio = this.nightPriority[p];
            if (!prio.hide) {
                priority.push("[" + prio.priority + "] " + this.roles[prio.role].translation + " (" + cap(prio.action) + ")");
            }
        }
        priority = removeDuplicates(priority);
        this.priorityInfo = priority;
    };

    /* Theme Loading and Storing */
    Theme.prototype.trside = function (side) {
        return this.sideTranslations[side];
    };
    Theme.prototype.trrole = function (role) {
        return this.roles[role].translation;
    };
    Theme.prototype.getHaxRolesFor = function (command) {
        if (command in this.haxRoles) {
            return this.haxRoles[command];
        }
        return [];
    };
    Theme.prototype.getStandbyHaxRolesFor = function (command) {
        if (command in this.standbyHaxRoles) {
            return this.standbyHaxRoles[command];
        }
        return [];
    };
    /* End of Theme */

    this.isInGame = function (player) {
        if (this.state == "entry") {
            return this.signups.indexOf(player) != -1;
        }
        return player in this.players;
    };
    this.themeManager = new ThemeManager(); // init
    this.hasCommand = function (name, command, state) {
        var player = this.players[name];
        return (state in player.role.actions && command in player.role.actions[state]);
    };
    this.correctCase = function (string) {
        var lstring = string.toLowerCase();
        for (var x in this.players) {
            if (x.toLowerCase() == lstring)
                return this.players[x].name;
        }
        // try to trim around if there's extra whitespace
        lstring = lstring.replace(/^\s+|\s+$/g, '');
        for (var y in this.players) {
            if (y.toLowerCase() == lstring)
                return this.players[y].name;
        }
        return noPlayer;
    };
    this.saveStalkLog = function () {
        if (this.state == "standby") {
            this.compilePhaseStalk("STANDBY " + mafia.time.days);
        }
        if (this.state !== "blank" && this.state !== "voting" && currentStalk.length > 0) {
            var lastLog = currentStalk.join("::**::");
            stalkLogs.unshift(lastLog);
            if (stalkLogs.length > 20) {
                stalkLogs.pop();
            }
            sys.writeToFile(MAFIA_LOG_FILE, stalkLogs.join("::@@::"));
        }
        phaseStalk = {};
        currentStalk = [];
    };
    this.clearVariables = function () {
        /* hash : playername => playerstruct */
        this.saveStalkLog();
        this.players = {};
        this.signups = [];
        this.state = "blank";
        this.ticks = 0;
        this.votes = {};
        this.voteCount = 0;
        this.ips = [];
        this.numjoins = {};
        this.numvotes = [];
        this.resetTargets();
        // Recharges shouldn't be cleared between nights
        this.teamRecharges = {};
        this.roleRecharges = {};
        this.dayRecharges = {};
        this.teamCharges = {};
        this.roleCharges = {};
        this.teamRestrictions = {};
        this.roleRestrictions = {};
        this.usersToSlay = {};
        this.time = {
            "nights": 0,
            "days": 0
        };
    };
    this.lastAdvertise = 0;
    this.lastFeaturedAd = 0;
    this.reduceRecharges = function () {
        var o, a;
        for (o in this.teamRecharges) {
            for (a in this.teamRecharges[o]) {
                if (this.teamRecharges[o][a] > 0)--this.teamRecharges[o][a];
            }
        }
        for (o in this.roleRecharges) {
            for (a in this.roleRecharges[o]) {
                if (this.roleRecharges[o][a] > 0)--this.roleRecharges[o][a];
            }
        }
        for (var p in this.players) {
            for (o in this.players[p].recharges) {
                if (this.players[p].recharges[o] > 0)--this.players[p].recharges[o];
            }
            for (o in this.players[p].dayrecharges) {
                if (this.players[p].dayrecharges[o] > 0)--this.players[p].dayrecharges[o];
            }
        }
    };
    this.resetTargets = function () {
        this.teamTargets = {};
        this.roleTargets = {};
        this.dayRecharges = {};
        this.teamRestrictions = {};
        this.roleRestrictions = {};
        for (var p in this.players) {
            this.players[p].targets = {};
            this.players[p].dayKill = undefined;
            this.players[p].revealUse = undefined;
            this.players[p].exposeUse = undefined;
            this.players[p].guarded = undefined;
            this.players[p].safeguarded = undefined;
            this.players[p].restrictions = [];
            this.players[p].redirectTo = undefined;
            this.players[p].redirectActions = undefined;
            this.players[p].shieldmsg = undefined;
        }
    };
    this.clearVariables();
    this.usersToShove = {};
    this.advertiseToChannel = function(channel) {
        sendChanAll("", channel);
        sendChanAll(border, channel);
        if (this.theme.name == "default") {
            gamemsgAll("A new mafia game was started at #" + sys.channel(mafiachan) + "!", false, channel);
        } else {
            gamemsgAll("A new " + (this.theme.altname ? this.theme.altname : this.theme.name) + "-themed mafia game was started at #" + sys.channel(mafiachan) + "!", false, channel);
        }
        sendChanAll(border, channel);
        sendChanAll("", channel);
    };
    this.advertiseFeaturedTheme = function () {
        var ftime = parseInt(sys.time(), 10),
            adOkay = false,
            featured;
        if (featuredTheme !== undefined && mafia.themeManager.themes.hasOwnProperty(featuredTheme)) {
            var ftheme = casedtheme(featuredTheme),
                flink = mafia.themeManager.themes[featuredTheme].threadlink,
                faltname = mafia.themeManager.themes[featuredTheme].altname;
            featured = (flink ? '<a href="' + flink + '">' + html_escape(ftheme + (faltname ? " (" + faltname + ")" : "")) + '</a>' : html_escape(ftheme));
            adOkay = true;
        }
        if (ftime > this.lastFeaturedAd + featuredInterval * 60) {
            this.lastFeaturedAd = ftime;
            if (adOkay || featuredText) {
                sendChanAll(GREEN_BORDER, mafiachan);
                if (adOkay) {
                    sendChanHtmlAll("<font color=#3daa68><timestamp/> <b>±" + mafiabot.name + ": </b></font> Looking for a theme to play? Try out the Featured Theme: <b>" + featured + "</b>!", mafiachan);
                }
                if (featuredText) {
                    sendChanHtmlAll("<font color=#3daa68><timestamp/> <b>±" + mafiabot.name + ": </b></font> " + (featuredLink ? '<a href="' + html_escape(featuredLink) + '">' + featuredText + '</a>' : featuredText), mafiachan);
                }
                sendChanAll(GREEN_BORDER, mafiachan);
            }
        }
    };
    this.userVote = function (src, commandData) {
        var srcname = sys.name(src);
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            gamemsg(srcname, "You can't start a voting when the channel is silenced.");
            return;
        }
        if (this.invalidName(src))
            return;

        var themeName = commandData.toLowerCase();
        var reason;
        if (this.state == "blank") {
            this.state = "voting";
            this.ticks = 20;
            this.votes = {};
            this.possibleThemes = {};
            var total = 5;
            
            this.possibleThemes["default"] = 0;
            
            var lastGames = PreviousGames.slice(-3),
                noFeatured = false;
            for (var z in lastGames) {
                if (lastGames[z].what === featuredTheme) {
                    noFeatured = true;
                    break;
                }
            }
            if (!noFeatured && featuredTheme in this.themeManager.themes) {
                this.possibleThemes[featuredTheme] = 0;
                --total;
            }
            
            var allThemes = Object.keys(this.themeManager.themes);
            var Check = PreviousGames.slice(-5)
                        .reverse()
                        .map(function (g) { return g.what; });

            if (themeName in this.themeManager.themes) {
                if (this.themeManager.themes[themeName].enabled) {
                    if (Check.indexOf(themeName) == -1) {
                        if (!(themeName in this.possibleThemes)) {
                            this.possibleThemes[themeName] = 0;
                            --total;
                        }
                    } else {
                        reason = " it was recently started";
                    }
                } else {
                    reason = " it is disabled";
                }
            } else {
                if (themeName !== '*') {
                    reason = " it is not a valid theme";
                }
            }

            while (allThemes.length > 0 && total > 0) {
                var indx = Math.floor(allThemes.length * Math.random());
                var name = allThemes[indx];
                allThemes.splice(indx, 1);
                // exclude themes played recently
                if (name != "default" && Check.indexOf(name) !== -1) {
                    continue;
                }
                // exclude disabled themes
                if (this.themeManager.themes[name].enabled && !(name in this.possibleThemes)) {
                    this.possibleThemes[name] = 0;
                    --total;
                }
            }
            border = DEFAULT_BORDER;
            sendChanAll("", mafiachan);
            sendChanAll(border, mafiachan);
            gamemsgAll(sys.name(src) + " started a voting for next game's theme! You have " + this.ticks + " seconds to vote with /vote or /votetheme!");
            var casedThemes = [];
            for (var x in this.possibleThemes) {
                casedThemes.push(this.themeManager.themes[x].name);
            }
            gamemsgAll("Choose from these themes: " + casedThemes.join(", ") + " !");
            sendChanAll(border, mafiachan);
            sendChanAll("", mafiachan);
        }
        if (this.state != "voting") {
            gamemsg(srcname, "You can only vote during the voting phase!");
            return;
        }
        if (this.canJoin(src) !== true) {
            return;
        }
        if (!this.possibleThemes.hasOwnProperty(themeName)) {
            if (themeName !== '*') {
                gamemsg(srcname, "You can not vote this theme" + (reason ? " because " + reason : "") + "!");
                reason = undefined;
            }
            return;
        }
        var ip = sys.ip(src);
        if (this.votes.hasOwnProperty(ip)) {
            if (this.numvotes[sys.ip(src)] >= 3) {
                gamemsg(srcname, "You can't change your vote more than 3 times!");
                return;
            } else if (this.votes[ip] != themeName) {
                gamemsgAll(sys.name(src) + " changed their vote to " + this.themeManager.themes[themeName].name + "!");
                this.numvotes[sys.ip(src)] += 1;
            }
        } else {
            gamemsgAll(sys.name(src) + " voted for " + this.themeManager.themes[themeName].name + "!");
            this.numvotes[sys.ip(src)] = 1;
        }
        this.votes[sys.ip(src)] = { theme: themeName, who: sys.name(src) };
    };
    this.getThemeName = function (data) {
        var themes = mafia.themeManager.themes;
        var data = data.toLowerCase();
        for (var x in themes) {
            if (themes[x].altname && themes[x].altname.toLowerCase() === data) {
                data = themes[x].name.toLowerCase();
            }
        }
        return data;
    };
    this.startGame = function (src, commandData) {
        var srcname = sys.name(src);
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            gamemsg(srcname, "You can't start a game when the channel is silenced.");
            return;
        }
        var now = (new Date()).getTime();
        if (src !== null) {
            if (SESSION.users(src).mafia_start !== undefined && SESSION.users(src).mafia_start + 5000 > now && !this.isMafiaSuperAdmin(src)) {
                gamemsg(srcname, "Wait a moment before trying to start again!");
                return;
            }
            SESSION.users(src).mafia_start = now;
        }
        if (this.state != "blank") {
            gamemsg(srcname, "A game is going on. Wait until it's finished before trying to start another one");
            if (this.state == "voting" || this.state == "entry") {
                gamemsg(srcname, "You can join the current game by typing /join !");
            }
            return;
        }

        var themeName = commandData == noPlayer ? "default" : this.getThemeName(commandData);

        // Prevent a single player from dominating the theme selections.
        // We exclude mafia admins from this.
        var i;
        if (src) {
            if (this.invalidName(src))
                return;

            var PlayerCheck = PreviousGames.slice(-5).reverse();
            if (!this.isMafiaAdmin(src)) {
                for (i = 0; i < PlayerCheck.length; i++) {
                    var who = PlayerCheck[i].who;
                    var what = PlayerCheck[i].what;
                    if (who == sys.name(src)) {
                        gamemsg(srcname, "Sorry, you have started a game " + (i + 1) + " games ago, let someone else have a chance!");
                        return;
                    }
                    if (what == themeName) {
                        gamemsg(srcname, "This theme was started " + (i + 1) + " games ago! No repeat!");
                        return;
                    }
                }
            }

            if (themeName in this.themeManager.themes) {
                if (!this.themeManager.themes[themeName].enabled) {
                    gamemsg(srcname, "This theme is disabled!");
                    return;
                }
                this.theme = this.themeManager.themes[themeName];
            } else {
                gamemsg(srcname, "No such theme!");
                return;
            }
        } else {
            this.theme = this.themeManager.themes[themeName];
        }

        border = this.theme.border ? this.theme.border : DEFAULT_BORDER;
        CurrentGame = { who: src !== null ? sys.name(src) : "voted", what: themeName, when: parseInt(sys.time(), 10), playerCount: 0 };

        if (src !== null) {
            sendChanAll("", mafiachan);
            sendChanAll(border, mafiachan);
            if (this.theme.name == "default") {
                gamemsgAll(sys.name(src) + " started a game!");
            } else {
                gamemsgAll(sys.name(src) + " started a game with theme " + this.theme.name + (this.theme.altname ? " (" + this.theme.altname + ")" : "")+ "!");
            }
            gamemsgAll("Type /Join to enter the game!");
            sendChanAll(border, mafiachan);
            sendChanAll("", mafiachan);
        }

        var playerson = sys.playerIds();
        for (var x = 0; x < playerson.length; ++x) {
            var id = playerson[x];
            var user = SESSION.users(id);
            if (sys.loggedIn(id) && user && user.mafiaalertson && (user.mafiaalertsany || user.mafiathemes.indexOf(this.theme.name.toLowerCase()) != -1)) {
                if (sys.isInChannel(id, mafiachan)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", mafiachan);
                    continue;
                } else if (sys.isInChannel(id, 0)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", 0);
                    continue;
                } else if (sys.existChannel("Mafia Social") && sys.isInChannel(id, sys.channelId("Mafia Social"))) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", sys.channelId("Mafia Social"));
                    continue;
                }
                sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!");
            }
        }

        //Have to add ±Game manually to theme summary to prevent URLs from breaking
        gamemsgAll(this.theme.summary ? ("±Game: " + this.theme.summary) : "Consider adding a summary field to this theme that describes the setting of the game and points out the odd quirks of the theme!");

        if (sys.playersOfChannel(mafiachan).length < 150) {
            var time = parseInt(sys.time(), 10);
            if (time > this.lastAdvertise + 60 * 15) {
                this.lastAdvertise = time;
                this.advertiseToChannel(0);
                if (sys.existChannel("Mafia Tutoring")) {
                    this.advertiseToChannel(sys.channelId('Mafia Tutoring'));
                }
                if (sys.existChannel("Mafia Social")) {
                    this.advertiseToChannel(sys.channelId('Mafia Social'));
                }
            }
        }
        this.clearVariables();
        mafia.state = "entry";

        mafia.ticks = 60;
        
        if (src !== null) {
            if (this.canJoin(src) !== true) {
                return;
            }
            var name = sys.name(src);

            this.signups.push(name);
            this.ips.push(sys.ip(src));
            if (this.numjoins.hasOwnProperty(sys.ip(src))) {
                this.numjoins[sys.ip(src)] += 1;
            }
            else {
                this.numjoins[sys.ip(src)] = 1;
            }
            if (SESSION.users(src).smute.active) {
                gamemsg(srcname, name + " joined the game!");
                mafia.shoveUser(mafiabot.name, sys.name(src), true);
            } else {
                gamemsgAll(name + " joined the game!");
            }
            if (name in this.usersToShove) {
                var name = name;
                var shover = this.usersToShove[name];
                this.shoveUser(shover, name, false);
                delete this.usersToShove[name];
            }
        }
    };
    this.endGame = function (src) {
        var srcname = sys.name(src);
        if (mafia.state == "blank") {
            gamemsg(srcname, "No game is going on.");
            return;
        }
        sendChanAll(border, mafiachan);
        gamemsgAll((src ? sys.name(src) : Config.Mafia.bot) + " has stopped the game!");
        sendChanAll(border, mafiachan);
        sendChanAll("", mafiachan);
        if (sys.id('PolkaBot') !== undefined) {
            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
        }
        //mafiabot.sendAll("GAME ENDED", mafiachan);
        mafia.mafiaStats.result("dead");
        mafia.checkDead(CurrentGame.playerCount);
        mafia.clearVariables();
        runUpdate();
        this.advertiseFeaturedTheme();
    };
    this.tickDown = function () { /* called every second */
        if (this.ticks <= 0) {
            return;
        }
        this.ticks = this.ticks - 1;
        if (this.ticks === 0) {
            this.callHandler(this.state);
        } else {
            if (this.ticks == 30 && this.state == "entry") {
                sendChanAll("", mafiachan);
                gamemsgAll("Hurry up, you only have " + this.ticks + " seconds more to join!");
                sendChanAll("", mafiachan);
            }
        }
    };
    
    /*Grab a list of all roles belonging to a given team.*/
    this.getRolesForTeam = function (side) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.side == side) {
                if (typeof player.role.actions.onteam === "string")
                    team.push(this.theme.trrole(player.role.actions.onteam));
                else
                    team.push(player.role.translation);
            }
        }
        return team.sort(); // Sort as to not give out the order.
    };
    this.getRolesForTeamS = function (side) {
        return mafia.getRolesForTeam(side).join(", ");
    };
    this.getPlayersForTeam = function (side) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.side == side) {
                team.push(player.name);
            }
        }
        return team;
    };
    this.getPlayersForTeamS = function (side) {
        return mafia.getPlayersForTeam(side).join(", ");
    };
    this.getPlayersForRole = function (role) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.role == role) {
                team.push(player.name);
            }
        }
        return team;
    };
    this.getPlayersForRoleS = function (role) {
        return mafia.getPlayersForRole(role).join(", ");
    };
    this.getCurrentRoles = function () {
        var list = [];
        for (var p in this.players) {
            if (typeof this.players[p].role.actions.onlist === "string")
                list.push(this.theme.trrole(this.players[p].role.actions.onlist));
            else
                list.push(this.players[p].role.translation);
        }
        /* Sorting to not give out the order of the roles per player */
        return list.sort().join(", ");
    };
    this.getCurrentPlayers = function () {
        var list = [];
        for (var p in this.players) {
            list.push(this.players[p].name);
        }
        return list.sort().join(", ");

    };
    this.getPlayersForBroadcast = function () {
        var team = [];
        for (var p in this.players) {
            team.push(this.players[p].name);
        }
        return team;
    };
    
    this.player = function (role) {
        for (var p in this.players) {
            if (mafia.players[p].role.role == role) //Checks sequentially all roles to see if this is the good one
                return p;
        }
        return noPlayer;
    };
    this.removePlayer = function (player) {
        for (var action in player.role.actions.night) {
            var targetMode = player.role.actions.night[action].common;
            var team = this.getPlayersForTeam(player.role.side);
            var role = this.getPlayersForRole(player.role.role);
            if ((targetMode == 'Self')
             || (targetMode == 'Team' && team.length == 1)
             || (targetMode == 'Role' && role.length == 1)) {
                this.removeTarget(player, action);
            }
        }
        if (mafia.votes.hasOwnProperty(player.name))
            delete mafia.votes[player.name];
        delete this.players[player.name];
    };
    this.actionBeforeDeath = function (player, onLynch, showborder) {
        if (player.role.actions.hasOwnProperty("onDeath") || onLynch === true) {
            var onDeath = player.role.actions.onDeath,
                verb = "died";
            if (onLynch === true) {
                onDeath = player.role.actions.lynch;
                verb = "was lynched";
            }
            var targetRoles, targetPlayers, r, k, target, affected, singleAffected, actionMessage, needSeparator = false;
            if ("killRoles" in onDeath) {
                targetRoles = onDeath.killRoles;
                singleAffected = [];
                for (r = 0; r < targetRoles.length; ++r) {
                    targetPlayers = this.getPlayersForRole(targetRoles[r]);
                    affected = [];
                    for (k = 0; k < targetPlayers.length; ++k) {
                        if (this.players[targetPlayers[k]] != player) {
                            affected.push(targetPlayers[k]);
                            this.removePlayer(this.players[targetPlayers[k]]);
                        }
                    }
                    if (affected.length > 0) {
                        if ("singlekillmsg" in onDeath) {
                            singleAffected = singleAffected.concat(affected);
                        } else {
                            actionMessage = (onDeath.killmsg || "Because ~Self~ "+verb+", ~Target~ (~Role~) died too!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r]));
                            gamemsgAll(actionMessage, "Kill");
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    gamemsgAll(onDeath.singlekillmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), "Kill");
                }
            }
            if ("poisonRoles" in onDeath) {
                targetRoles = onDeath.poisonRoles;
                singleAffected = [];
                for (r in targetRoles) {
                    var count;
                    targetPlayers = this.getPlayersForRole(r);
                    affected = [];
                    for (k = 0; k < targetPlayers.length; ++k) {
                        target = this.players[targetPlayers[k]];
                        count = onDeath.poisonRoles[r];
                        if (target.poisoned === undefined || target.poisonCount - target.poisoned >= (count ? count : 2)) {
                            target.poisoned = 1;
                            target.poisonCount = count || 2;
                            target.poisonDeadMessage = onDeath.poisonDeadMessage;
                            affected.push(targetPlayers[k]);
                        }
                    }
                    if (affected.length > 0) {
                        if ("singlepoisonmsg" in onDeath) {
                            singleAffected = singleAffected.concat(affected);
                        } else {
                            actionMessage = (onDeath.poisonmsg || "Because ~Self~ "+verb+", the ~Role~ was poisoned!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(r)).replace(/~Count~/, count);
                            gamemsgAll(actionMessage);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    gamemsgAll(onDeath.singlepoisonmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")));
                }
            }
            if ("convertRoles" in onDeath) {
                targetRoles = onDeath.convertRoles;
                singleAffected = [];
                for (r in targetRoles) {
                    var newRole = onDeath.convertRoles[r];
                    targetPlayers = this.getPlayersForRole(r);
                    affected = [];
                    for (k = 0; k < targetPlayers.length; ++k) {
                        if (this.players[targetPlayers[k]] != player) {
                            affected.push(targetPlayers[k]);
                            target = this.players[targetPlayers[k]];
                            mafia.setPlayerRole(target, newRole);
                            if (!onDeath.silentConvert) {
                                mafia.showOwnRole(sys.id(targetPlayers[k]));
                            }
                        }
                    }
                    if (affected.length > 0) {
                        if ("singleconvertmsg" in onDeath) {
                            singleAffected = singleAffected.concat(affected);
                        } else {
                            actionMessage = (onDeath.convertmsg || "Because ~Self~ "+verb+", the ~Old~ became a ~New~!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/, mafia.theme.trrole(newRole));
                            gamemsgAll(actionMessage);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    gamemsgAll(onDeath.singleconvertmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")));
                }
            }
            if ("curseRoles" in onDeath) {
                targetRoles = onDeath.curseRoles;
                singleAffected = [];
                for (r in targetRoles) {
                    var cursedRole = onDeath.curseRoles[r], count = onDeath.curseCount;
                    targetPlayers = this.getPlayersForRole(r);
                    affected = [];
                    for (k = 0; k < targetPlayers.length; ++k) {
                        if (this.players[targetPlayers[k]] != player) {
                            affected.push(targetPlayers[k]);
                            target = this.players[targetPlayers[k]];
                            target.cursedRole = cursedRole;
                            target.cursed = 1;
                            target.curseCount = count || 2;
                            target.curseConvertMessage = onDeath.curseConvertMessage;
                            target.silentCurse = onDeath.silentCurse || false;
                        }
                    }
                    if (affected.length > 0) {
                        if ("singlecursemsg" in onDeath) {
                            singleAffected = singleAffected.concat(affected);
                        } else {
                            actionMessage = (onDeath.cursemsg || "Because ~Self~ "+verb+", the ~Old~ got cursed and will become a ~New~ soon!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/g, mafia.theme.trrole(cursedRole)).replace(/~Count~/g, count || 2);
                            gamemsgAll(actionMessage);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    gamemsgAll(onDeath.singlecursemsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")));
                }
            }
            if ("exposeRoles" in onDeath) {
                targetRoles = onDeath.exposeRoles;
                for (r = 0; r < targetRoles.length; ++r) {
                    targetPlayers = this.getPlayersForRole(targetRoles[r]);
                    if (targetPlayers.length > 0) {
                        actionMessage = (onDeath.exposemsg || "Before " + (onLynch ? "being lynched" : "dying") + ", ~Self~ exposed ~Target~ as the ~Role~!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(targetPlayers, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r]));
                        gamemsgAll(actionMessage);
                        needSeparator = true;
                    }
                }
            }
            if (this.state == "day" && needSeparator && showborder) {
                sendChanAll(border, mafiachan);
            }
        }
    };
    this.onDeadRoles = function() {
        var convertPlayers = {},
            player,
            needConvert,
            p,
            r,
            e,
            action,
            convertmsg;
            
        for (p in this.players) {
            player = this.players[p];
            if ("onDeadRoles" in player.role.actions) {
                action = player.role.actions.onDeadRoles;
                for (r in action.convertTo) {
                    needConvert = true;
                    for (e in action.convertTo[r]) {
                        if (this.getPlayersForRole(action.convertTo[r][e]).length > 0) {
                            needConvert = false;
                            break;
                        }
                    }
                    if (needConvert) {
                        convertPlayers[p] = r;
                    }
                }
            }
        }
        for (p in convertPlayers) {
            player = this.players[p];
            convertmsg = (player.role.actions.onDeadRoles.convertmsg || "Due to the latest deaths, ~Old~ became ~New~!").replace(/~Self~/gi, player.name).replace(/~Old~/gi, mafia.theme.trrole(player.role.role)).replace(/~New~/gi, mafia.theme.trrole(convertPlayers[p]));
            this.setPlayerRole(player, convertPlayers[p]);
            gamemsgAll(convertmsg);
            this.showOwnRole(sys.id(p));
        }
    };
    this.kill = function (player) {
        var killmsg = (this.theme.killmsg || "~Player~ (~Role~) died!").replace(/~Player~/g, player.name).replace(/~Role~/g, player.role.translation);
        gamemsgAll(killmsg, "Kill");
        this.actionBeforeDeath(player);
        this.removePlayer(player);
    };
    this.removeTargets = function (player) {
        for (var action in player.role.actions.night) {
            this.removeTarget(player, action);
        }
    };
    this.removeTarget = function (player, action) {
        var targetMode = player.role.actions.night[action].common;
        if (targetMode == 'Self') {
            player.targets[action] = [];
        } else if (targetMode == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            this.teamTargets[player.role.side][action] = [];
        } else if (targetMode == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            this.roleTargets[player.role.role][action] = [];
        }
    };
    this.setRechargeFor = function (player, phase, action, count) {
        var commonTarget = phase == 'standby' ? 'Standby' : player.role.actions[phase][action].common;
        if (commonTarget == 'Self') {
            player.recharges[action] = count;
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamRecharges)) {
                this.teamRecharges[player.role.side] = {};
            }
            this.teamRecharges[player.role.side][action] = count;
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleRecharges)) {
                this.roleRecharges[player.role.role] = {};
            }
            this.roleRecharges[player.role.role][action] = count;
        } else if (commonTarget == 'Standby') {
            player.dayrecharges[action] = count;
        }
    };
    this.getRecharge = function (player, phase, action) {
        var commonTarget = phase == 'standby' ? 'Standby' : player.role.actions[phase][action].common;
        if (commonTarget == 'Self') {
            return player.recharges[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamRecharges)) {
                this.teamRecharges[player.role.side] = {};
            }
            return this.teamRecharges[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleRecharges)) {
                this.roleRecharges[player.role.role] = {};
            }
            return this.roleRecharges[player.role.role][action];
        } else if (commonTarget == 'Standby') {
            return player.dayrecharges[action];
        }
    };
    this.setChargesFor = function (player, phase, action, count) {
        var commonTarget = phase == 'standby' ? 'Standby' : player.role.actions[phase][action].common;
        if (commonTarget == 'Self') {
            player.charges[action] = count;
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamCharges)) {
                this.teamCharges[player.role.side] = {};
            }
            this.teamCharges[player.role.side][action] = count;
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleCharges)) {
                this.roleCharges[player.role.role] = {};
            }
            this.roleCharges[player.role.role][action] = count;
        } else if (commonTarget == 'Standby') {
            player.daycharges[action] = count;
        }
    };
    this.getCharges = function (player, phase, action) {
        var commonTarget = phase == 'standby' ? 'Standby' : player.role.actions[phase][action].common;
        if (commonTarget == 'Self') {
            return player.charges[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamCharges)) {
                this.teamCharges[player.role.side] = {};
            }
            return this.teamCharges[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleCharges)) {
                this.roleCharges[player.role.role] = {};
            }
            return this.roleCharges[player.role.role][action];
        } else if (commonTarget == 'Standby') {
            return player.daycharges[action];
        }
    };
    this.removeCharge = function (player, phase, action) {
        var commonTarget = phase == 'standby' ? 'Standby' : player.role.actions[phase][action].common;
        if (commonTarget == 'Self') {
            player.charges[action] = player.charges[action] - 1;
        } else if (commonTarget == 'Team') {
            this.teamCharges[player.role.side][action] =  this.teamCharges[player.role.side][action] - 1;
        } else if (commonTarget == 'Role') {
            this.roleCharges[player.role.role][action] = this.roleCharges[player.role.role][action] - 1;
        } else if (commonTarget == 'Standby') {
            player.daycharges[action] = player.daycharges[action] -1;
        }
    };
    this.getTargetsFor = function (player, action) {
        var commonTarget = player.role.actions.night[action].common;
        if (commonTarget == 'Self') {
            if (!(action in player.targets)) {
                player.targets[action] = [];
            }
            return player.targets[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            if (!(action in this.teamTargets[player.role.side])) {
                this.teamTargets[player.role.side][action] = [];
            }
            return this.teamTargets[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action] = [];
            }
            return this.roleTargets[player.role.role][action];
        }
    };
    this.setTarget = function (player, target, action) {
        var commonTarget = player.role.actions.night[action].common;
        var limit = 1;
        if (player.role.actions.night[action].limit !== undefined) {
            limit = player.role.actions.night[action].limit;
        }
        var charges = mafia.getCharges(player, "night", action);
        if (charges !== undefined && charges < limit) {
            limit = charges; //this is to stop it from potentially getting around the charge limit
        }
        var list;
        if (commonTarget == 'Self') {
            if (!(action in player.targets)) {
                player.targets[action] = [];
            }
            list = player.targets[action];
            if ("restrict" in player.role.actions.night[action]) {
                player.restrictions = player.restrictions.concat(player.role.actions.night[action].restrict);
            }
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            if (!(action in this.teamTargets[player.role.side])) {
                this.teamTargets[player.role.side][action] = [];
            }
            list = this.teamTargets[player.role.side][action];
            if ("restrict" in player.role.actions.night[action]) {
                if (!(player.role.side in this.teamRestrictions)) {
                    this.teamRestrictions[player.role.side] = [];
                }
                this.teamRestrictions[player.role.side] = this.teamRestrictions[player.role.side].concat(player.role.actions.night[action].restrict);
            }
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action] = [];
            }
            list = this.roleTargets[player.role.role][action];
            if ("restrict" in player.role.actions.night[action]) {
                if (!(player.role.role in this.roleRestrictions)) {
                    this.roleRestrictions[player.role.role] = [];
                }
                this.roleRestrictions[player.role.role] = this.roleRestrictions[player.role.role].concat(player.role.actions.night[action].restrict);
            }
        }
        if ("cancel" in player.role.actions.night[action]) {
            var cancelList = player.role.actions.night[action].cancel;
            for (var c in cancelList) {
                if (this.hasCommand(player.name, cancelList[c], "night")) {
                    this.removeTarget(player, cancelList[c]);
                }
            }
        }
        if (list.indexOf(target.name) == -1) {
            list.push(target.name);
            if (list.length > limit) {
                list.splice(0, 1);
            }
        }
        if (this.ticks > 0 && limit > 1)
            gamemsg(player.name, "Your target(s) are " + list.join(', ') + "!");
    };
    this.setPlayerRole = function (player, role) {
        var act;
        player.role = mafia.theme.roles[role];
        if (typeof mafia.theme.roles[role].side == "object") {
            player.role.side = randomSample(mafia.theme.roles[role].side.random);
        }
        if ("night" in player.role.actions) {
            for (act in player.role.actions.night) {
                if ("initialrecharge" in player.role.actions.night[act]) {
                    mafia.setRechargeFor(player, "night", act, player.role.actions.night[act].initialrecharge);
                }
                if ("charges" in player.role.actions.night[act]) {
                    mafia.setChargesFor(player, "night", act, player.role.actions.night[act].charges);
                }
            }
        }
        if ("standby" in player.role.actions) {
            for (act in player.role.actions.standby) {
                if ("initialrecharge" in player.role.actions.standby[act]) {
                    mafia.setRechargeFor(player, "standby", act, player.role.actions.standby[act].initialrecharge);
                }
                if ("charges" in player.role.actions.standby[act]) {
                    mafia.setChargesFor(player, "standby", act, player.role.actions.standby[act].charges);
                }
            }
        }
        for (act in player.role.actions) {
            var action = player.role.actions[act];
            if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                player.evadeCharges[act] = action.mode.evadeCharges;
            }
        }
        if ("initialCondition" in player.role.actions) {
            var condition = player.role.actions.initialCondition;
            if ("poison" in condition) {
                player.poisoned = 1;
                player.poisonCount = condition.poison.count || 2;
                player.poisonDeadMessage = condition.poison.poisonDeadMessage;
            }
            if ("clearPoison" in condition) {
                player.poisoned = undefined;
            }
            if ("curse" in condition) {
                player.cursed = 1;
                player.curseCount = condition.curse.curseCount || 2;
                player.cursedRole = condition.curse.cursedRole;
                player.curseConvertMessage = condition.curse.curseConvertMessage;
                player.silentCurse = condition.curse.silentCurse || false;
            }
            if ("clearCurse" in condition) {
                player.cursed = undefined;
            }
        }
    };
    this.testWin = function (slay) {
        if (Object.keys(mafia.players).length === 0) {
            gamemsgAll(mafia.theme.drawmsg || "Everybody died! This is why we can't have nice things :(");
            sendChanAll(border, mafiachan);
            
            mafia.compilePhaseStalk("GAME END");
            currentStalk.push("Winners: None (game ended in a draw).");
            mafia.mafiaStats.result("Tie");
            mafia.checkDead(CurrentGame.playerCount);
            if (sys.id('PolkaBot') !== undefined) {
                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
            }
            //mafiabot.sendAll("GAME ENDED", mafiachan);
            mafia.clearVariables();
            runUpdate();
            this.advertiseFeaturedTheme();
            return true;
        }
        
        var x, ws;
        
        var isNotIn = function makeIsNotIn(array) {
            return function isNotIn(x) { return array.indexOf(x) == -1; };
        };
        var winByDeadRoles;
        var winSide;
        var players = [];
        var goodPeople = [];
        var gameFinished = function gameFinished() {
            if (slay) {
                sendChanAll(border, mafiachan);
            }
            mafia.compilePhaseStalk("GAME END");
            if (winSide in mafia.theme.sideWinMsg) {
                gamemsgAll(mafia.theme.sideWinMsg[winSide].replace(/~Players~/g, readable(players, "and")));
            } else {
                gamemsgAll("The " + mafia.theme.trside(winSide) + " (" + readable(players, "and") + ") wins!");
            }
            mafia.mafiaStats.result(mafia.theme.trside(winSide));
            currentStalk.push("Winners: " + mafia.theme.trside(winSide) + " (" + readable(players, "and") + ")");
            if (winByDeadRoles) {
                var losingSides = [];
                var isNotAWinningPlayer = isNotIn(players);
                for (var tr in mafia.theme.sideTranslations) {
                    if (tr !== winSide && mafia.getPlayersForTeamS(tr) !== "") {
                        var lp = mafia.getPlayersForTeam(tr).filter(isNotAWinningPlayer);
                        if (lp.length > 0) {
                            losingSides.push(mafia.theme.trside(tr) + " (" + readable(lp, "and") + ")");
                        }
                    }
                }
                if (losingSides.length > 0) {
                    gamemsgAll("The " + readable(losingSides, "and") + " lose!");
                    currentStalk.push("Losers: " + readable(losingSides, "and"));
                }
            } else if (goodPeople.length > 0) {
                gamemsgAll("The " + mafia.theme.trside('village') + " (" + readable(goodPeople, "and") + ") lose!");
                currentStalk.push("Losers: " + readable(goodPeople, "and"));
            }
            sendChanAll(border, mafiachan);
            mafia.checkDead(CurrentGame.playerCount);
            mafia.clearVariables();
            if (sys.id('PolkaBot') !== undefined) {
                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
            }
            //mafiabot.sendAll("GAME ENDED", mafiachan);
            mafia.advertiseFeaturedTheme();
        };
        outer:
            for (var p in mafia.players) {
                //Roles which win when certain roles are dead
                if (mafia.players[p].role.hasOwnProperty("winIfDeadRoles")) {
                    var deadRoles = mafia.players[p].role.winIfDeadRoles;
                    winByDeadRoles = true;
                    for (var t = 0; t < deadRoles.length; ++t) {
                        if (mafia.getPlayersForRoleS(deadRoles[t]) !== "") {
                            winByDeadRoles = false;
                            break;
                        }
                    }
                }
                winSide = mafia.players[p].role.side;
                players = [];
                goodPeople = [];
                if (winByDeadRoles) {
                    players = mafia.getPlayersForTeam(winSide);
                    for (x in mafia.players) {
                        if (mafia.players[x].role.hasOwnProperty("winningSides")) {
                            ws = mafia.players[x].role.winningSides;
                            if (players.indexOf(x) == -1 && (ws == "*" || (Array.isArray(ws) && ws.indexOf(winSide) >= 0))) {
                                players.push(x);
                            }
                        }
                    }
                } else {
                    if (winSide != 'village') {
                        for (var i in mafia.theme.villageCantLoseRoles) {
                            if (mafia.player(mafia.theme.villageCantLoseRoles[i]) != noPlayer)
                                // baddies shouldn't win if vigi, mayor or samurai is alive
                                continue outer;
                        }
                    }
                    for (x in mafia.players) {
                        // Roles which win with multiple sides
                        if (mafia.players[x].role.hasOwnProperty("winningSides")) {
                            ws = mafia.players[x].role.winningSides;
                            if (ws == "*" || (Array.isArray(ws) && ws.indexOf(winSide) >= 0)) {
                                players.push(x);
                                continue; // inner
                            }
                        }
                        if (mafia.players[x].role.side == winSide) {
                            players.push(x);
                        } else if (winSide == 'village') {
                                // if winSide = villy all people must be good people
                            continue outer;
                        } else if (mafia.players[x].role.side == 'village' && (!mafia.players[p].role.hasOwnProperty("winningSides") || (mafia.players[p].role.winningSides != "*" && mafia.players[p].role.winningSides.indexOf("village") == -1))) {
                            goodPeople.push(x);
                        } else {
                            // some other baddie team alive
                            continue outer;
                        }
                    }
                }

                if (winByDeadRoles || players.length >= goodPeople.length) {
                    gameFinished();
                    runUpdate();
                    return true;
                }
            }
        return false;
    };

    this.handlers = {
        entry: function () {
            sendChanAll(border, mafiachan);
            gamemsgAll("Times Up! :");

            // Save stats if the game was played
            CurrentGame.playerCount = mafia.signups.length;
            PreviousGames.push(CurrentGame);
            savePlayedGames();
            mafia.mafiaStats.players = mafia.signups.length;
            mafia.mafiaStats.theme = mafia.theme.name;
            
            currentStalk.push("*** ::: ::: Log for " + mafia.theme.name + "-themed mafia game ::: ::: ***");
            var minp;
            if (mafia.theme.minplayers === undefined || isNaN(mafia.theme.minplayers) || mafia.theme.minplayers < 3) {
                minp = 5;
            } else {
                minp = mafia.theme.minplayers;
            }
            if (mafia.signups.length < minp) {
                gamemsgAll("Well, Not Enough Players! :");
                gamemsgAll("You need at least "+minp+" players to join (Current: " + mafia.signups.length + ").");
                sendChanAll(border, mafiachan);
                mafia.clearVariables();
                mafia.usersToShove = {};
                mafia.mafiaStats.result("dead");
                mafia.checkDead(CurrentGame.playerCount);
                return;
            }

            /* Resetting the Random Sides Object */
            for (var x in mafia.theme.randomSideRoles) {
                mafia.theme.roles[x].side = mafia.theme.randomSideRoles[x];
            }

            /* Creating the roles list */
            var i = 1;
            while (mafia.signups.length > mafia.theme["roles" + i].length) {
                ++i;
            }
            var srcArray = mafia.theme["roles" + i].slice(0, mafia.signups.length);

            srcArray = shuffle(srcArray);

            for (i = 0; i < srcArray.length; ++i) {
                var playerRole = typeof srcArray[i] == "string" ? srcArray[i] : randomSample(srcArray[i]);
                mafia.players[mafia.signups[i]] = { 'name': mafia.signups[i], 'role': mafia.theme.roles[playerRole], 'targets': {}, 'recharges': {}, 'dayrecharges': {}, 'charges' : {}, 'daycharges': {}, 'evadeCharges': {}, "restrictions": [] };
                var initPlayer = mafia.players[mafia.signups[i]];
                if ("night" in initPlayer.role.actions) {
                    for (var act in initPlayer.role.actions.night) {
                        if ("initialrecharge" in initPlayer.role.actions.night[act]) {
                            mafia.setRechargeFor(initPlayer, "night", act, initPlayer.role.actions.night[act].initialrecharge);
                        }
                        if ("charges" in initPlayer.role.actions.night[act]) {
                            mafia.setChargesFor(initPlayer, "night", act, initPlayer.role.actions.night[act].charges);
                        }
                    }
                }
                if ("standby" in initPlayer.role.actions) {
                    for (var act in initPlayer.role.actions.standby) {
                        if ("initialrecharge" in initPlayer.role.actions.standby[act]) {
                            mafia.setRechargeFor(initPlayer, "standby", act, initPlayer.role.actions.standby[act].initialrecharge);
                        }
                        if ("charges" in initPlayer.role.actions.standby[act]) {
                            mafia.setChargesFor(initPlayer, "standby", act, initPlayer.role.actions.standby[act].charges);
                        }
                    }
                }
                for (var act in initPlayer.role.actions) {
                    var action = initPlayer.role.actions[act];
                    if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                        initPlayer.evadeCharges[act] = action.mode.evadeCharges;
                    }
                }
                if ("initialCondition" in initPlayer.role.actions) {
                    var condition = initPlayer.role.actions.initialCondition;
                    if ("poison" in condition) {
                        initPlayer.poisoned = 1;
                        initPlayer.poisonCount = condition.poison.count || 2;
                        initPlayer.poisonDeadMessage = condition.poison.poisonDeadMessage;
                    }
                    if ("curse" in condition) {
                        initPlayer.cursed = 1;
                        initPlayer.curseCount = condition.curse.curseCount || 2;
                        initPlayer.cursedRole = condition.curse.cursedRole;
                        initPlayer.curseConvertMessage = condition.curse.curseConvertMessage;
                        initPlayer.silentCurse = condition.curse.silentCurse || false;
                    }
                }
                if (typeof mafia.theme.roles[playerRole].side == "object") {
                    if ("random" in mafia.theme.roles[playerRole].side) {
                        var side = randomSample(mafia.theme.roles[playerRole].side.random);
                        mafia.players[mafia.signups[i]].role.side = side;
                    }
                }
            }

            currentStalk.push("Players: " + Object.keys(mafia.players).map(name_trrole, mafia.theme).join(", "));

            gamemsgAll("The Roles have been Decided! :");
            mafia.usersToShove = {};

            var p, player;
            for (p in mafia.players) {
                mafia.showOwnRole(p, true);
            }
            gamemsgAll("±Current Roles: " + mafia.getCurrentRoles() + ".");
            gamemsgAll("±Current Players: " + mafia.getCurrentPlayers() + ".");
            if (mafia.theme.closedSetup !== true) {
                // Send players all roles sided with them
                for (p in mafia.players) {
                    player = mafia.players[p];
                    gamemsg(player.name, "±Current Team: " + mafia.getRolesForTeamS(player.role.side));
                }
            }
            
            /*Added 10 seconds to the first night to give users a chance to read their role and connect with team mates */
            if (mafia.theme.ticks === undefined || (isNaN(mafia.theme.ticks.night1) && isNaN(mafia.theme.ticks.night)) || mafia.theme.ticks.night1 < 1 || mafia.theme.ticks.night1 > 60) {
                mafia.ticks = 40;
            } else {
                mafia.ticks = mafia.theme.ticks.night1 || mafia.theme.ticks.night + 10;
            }
            mafia.time.nights++;
            mafia.state = "night";
            gamemsgAll("±Time: Night " + mafia.time.nights);
            gamemsgAll("Make your moves, you only have " + mafia.ticks + " seconds! :");
            sendChanAll(border, mafiachan);
            mafia.resetTargets();
            mafia.reduceRecharges();
        },
        night: function () {
            sendChanAll(border, mafiachan);
            gamemsgAll("Times Up! :");

            this.compilePhaseStalk("NIGHT PHASE " + mafia.time.nights);

            var nightkill = false;
            var getTeam = function (role, commonTarget) {
                var team = [];
                if (commonTarget == 'Role') {
                    team = mafia.getPlayersForRole(role.role);
                } else if (commonTarget == 'Team') {
                    team = mafia.getPlayersForTeam(role.side);
                }
                return team;
            };
            var stalkTargets;
            var updateStalkTargets = function() {
                stalkTargets = {};
                for (var s in mafia.players) {
                    stalkTargets[s] = {};
                    if (!("night" in mafia.players[s].role.actions)) continue;
                    var targetActions = Object.keys(mafia.players[s].role.actions.night);
                    for (var act = 0; act < targetActions.length; ++act) {
                        var foundTargets = mafia.getTargetsFor(mafia.players[s], targetActions[act]);
                        for (var f = 0; f < foundTargets.length; ++f) {
                            stalkTargets[s][foundTargets[f]] = 1;
                        }
                    }
                }
            };
            updateStalkTargets();

            var player, names, j, evadeCharges = {};
            var selfConverted = [];
            var getPlayerRoleId = function(x) { return this.players[x].role.role; };
            for (var i in mafia.theme.nightPriority) {
                var failedmsg, pmsg, tarmsg, tarmsg2, allmsg;
                var o = mafia.theme.nightPriority[i];
                names = mafia.getPlayersForRole(o.role);
                var command = o.action;
                var Action = mafia.theme.roles[o.role].actions.night[o.action];
                var commandList = [];
                if ("command" in Action) {
                    if (Array.isArray(Action.command)) {
                        commandList = Action.command;
                    } else if (typeof Action.command == "object") {
                        commandList.push(randomSample(Action.command));
                    } else if (typeof Action.command == "string") {
                        commandList.push(Action.command);
                    }
                } else {
                    commandList.push(o.action);
                }
                var rechargeCount = 0;
                if ("recharge" in Action) { // a command that can only be used once every X nights
                    rechargeCount = Action.recharge;
                }
                //Fail chance for common:Role and Team
                if (["Role", "Team"].indexOf(Action.common) != -1 && "failChance" in Action && Action.failChance > Math.random()) {
                    for (var f in names) {
                        if (mafia.getTargetsFor(mafia.players[names[f]], o.action).length > 0) {
                             failedmsg = (Action.failmsg || "You couldn't ~Action~ this night!").replace(/~Action~/g, o.action);
                            gamemsg(names[f], failedmsg);
                        }
                    }
                    continue;
                }
                var rolecheck;
                var teamcheck;
                for (j = 0; j < names.length; ++j) {
                    if (!mafia.isInGame(names[j]) || this.hasCommand(names[j], o.action, "night") === false) continue;
                    player = mafia.players[names[j]];
                    var targets = mafia.getTargetsFor(player, o.action);
                    var target, t; // current target

                    //Fail chance for common:Self
                    if (Action.common == "Self" && "failChance" in Action && Action.failChance > Math.random()) {
                        if (targets.length > 0) {
                            failedmsg = (Action.failmsg || "You couldn't ~Action~ this night!").replace(/~Action~/g, o.action);
                            gamemsg(player.name, failedmsg);
                        }
                        continue;
                    }
                    // Limit the use of this command for the following nights
                    if (rechargeCount > 0 && targets.length > 0) {
                        // set the recharge period
                        mafia.setRechargeFor(player, "night", o.action, rechargeCount);
                    }
                    var charges = mafia.getCharges(player, "night", o.action);
                    
                    if (charges !== undefined && targets.length > 0 && rolecheck !== player.role.role && teamcheck !== player.role.side) {
                        for (var x = 0; x < targets.length; x++) {
                            mafia.removeCharge(player, "night", o.action);
                        }
                        if (Action.common == "Role" && rolecheck === undefined) {
                            rolecheck = player.role.role;
                        }
                        if (Action.common == "Team" && teamcheck === undefined) {
                            teamcheck = player.role.side;
                        }
                    }
                    if (mafia.getCharges(player, "night", o.action) !== undefined && targets.length > 0) {
                        var charge = mafia.getCharges(player, "night", o.action);
                        var chargetxt = ( Action.chargesmsg || "You have ~Charges~ charges remaining").replace(/~Charges~/g, charge);
                        gamemsg(player.name, chargetxt);
                    }
                    outer:
                    for (t in targets) {
                        var evadeChance = Math.random();
                        var targetName = targets[t];
                        
                        if (mafia.isInGame(targetName) && mafia.players[targetName].redirectTo !== undefined && (mafia.players[targetName].redirectActions === "*" || mafia.players[targetName].redirectActions.indexOf(o.action) !== -1)) {
                            var shieldmsg = (mafia.players[targetName].shieldmsg);
                            targetName = mafia.players[targetName].redirectTo;
                            gamemsg(player.name, shieldmsg.replace(/~Action~/g, o.action).replace(/~Self~/g, targetName).replace(/~Target~/g, targets[t]));
                        }
                        
                        for (var c in commandList) {
                            command = commandList[c];
                            target = targetName;

                            var targetMode = null;
                            var revenge = false, revengetext = "You were killed during the night!";
                            var poisonrevenge = 0, poisonDeadMessage;
                            var poisonrevengetext = "Your target poisoned you!";
                            var finalPoisonCount = Action.count || 2;
                            var finalCurseCount = Action.curseCount || 2;
                            var commandIsDummy = isDummyCommand.test(command);

                            if (["kill", "protect", "inspect", "distract", "poison", "safeguard", "stalk", "convert", "copy", "curse", "detox", "dispel", "shield", "massconvert"].indexOf(command) === -1 && !commandIsDummy) {
                                continue;
                            }
                            if (!mafia.isInGame(target)) {
                                if (command != "stalk")
                                    continue;
                            } else {
                                target = mafia.players[target];
                                // Action blocked by Protect or Safeguard
                                var piercing = false;
                                if (("pierceChance" in Action && Action.pierceChance > Math.random()) || Action.pierce === true) {
                                    piercing = true;
                                }
                                if (piercing !== true && ((target.guarded && command == "kill") || (target.safeguarded && (["distract", "inspect", "stalk", "poison", "convert", "copy", "curse", "detox", "dispel", "massconvert"].indexOf(command) !== -1 || commandIsDummy)))) {
                                    gamemsg(player.name, "Your target (" + target.name + ") was " + (command == "kill" ? "protected" : "guarded") + "!");
                                    // Action can be countered even if target is protected/guarded
                                    if (command in target.role.actions) {
                                        targetMode = target.role.actions[command];
                                        if (targetMode.mode == "killattackerevenifprotected") {
                                            if (targetMode.msg)
                                                revengetext = targetMode.msg;
                                            gamemsg(player.name, revengetext);
                                            mafia.kill(player);
                                            nightkill = true;
                                            continue outer;
                                        } else if (targetMode.mode == "poisonattackerevenifprotected") {
                                            poisonrevenge = targetMode.count || 2;
                                            if (player.poisoned === undefined || player.poisonCount - player.poisoned >= poisonrevenge) {
                                                if (targetMode.msg)
                                                    poisonrevengetext = targetMode.msg;
                                                gamemsg(player.name, poisonrevengetext);
                                                player.poisoned = 1;
                                                player.poisonCount = poisonrevenge;
                                                player.poisonDeadMessage = targetMode.poisonDeadMessage;
                                            }
                                        }
                                    }
                                    continue;
                                }
                                var modeargs = { //Common Args used in defensive moves
                                    '~Distracter~': player.role.translation,
                                    '~User~': player.role.translation,
                                    '~Self~': target.name,
                                    '~Target~': player.name,
                                    '~Role~': mafia.theme.trrole(player.role.role),
                                    '~Action~': o.action
                                };
                                // Defensive Modes
                                if (command in target.role.actions) {
                                    targetMode = target.role.actions[command];
                                    var bp = Action.bypass || [];
                                    if (targetMode.mode == "ignore" && bp.indexOf("ignore") === -1) {
                                        if (command == "distract") {
                                            var distractmsg = targetMode.msg || "The ~Distracter~ came to you last night, but you ignored her!";
                                            gamemsg(target.name, formatArgs(distractmsg, modeargs));
                                        } else {
                                            if (targetMode.silent !== true) {
                                                var targetmsg = targetMode.msg || "Your target (~Self~) evaded your ~Action~!";
                                                gamemsg(player.name, formatArgs(targetmsg, modeargs));
                                            }
                                        }
                                        continue;
                                    }
                                    if (targetMode.mode == "ChangeTarget"  && bp.indexOf("ChangeTarget") == -1) {
                                        tarmsg = (targetMode.targetmsg || targetMode.hookermsg || false);
                                        if (tarmsg) {
                                            gamemsg(player.name, tarmsg);
                                        }
                                        gamemsg(target.name, formatArgs(targetMode.msg, modeargs));
                                        mafia.kill(player);
                                        nightkill = true;
                                        mafia.removeTargets(target);
                                        updateStalkTargets();
                                        continue outer;
                                    }
                                    else if ((targetMode.mode == "killattacker" || targetMode.mode == "killattackerevenifprotected") && bp.indexOf("killattacker") === -1) {
                                        revenge = true;
                                        if (targetMode.msg)
                                            revengetext = targetMode.msg;
                                    }
                                    else if ((targetMode.mode == "poisonattacker" || targetMode.mode == "poisonattackerevenifprotected") && bp.indexOf("poisonattacker") === -1) {
                                        poisonrevenge = targetMode.count || 2;
                                        poisonDeadMessage = targetMode.poisonDeadMessage;
                                        if (targetMode.msg)
                                            poisonrevengetext = targetMode.msg;
                                    }
                                    else if (targetMode.mode == "identify" && bp.indexOf("identify") === -1) {
                                        tarmsg = targetMode.msg || "You identified ~Target~ as the ~Role~ that tried to ~Action~ you!";
                                        gamemsg(target.name, formatArgs(tarmsg, modeargs));
                                    }
                                    else if (targetMode.mode == "die" && bp.indexOf("die") === -1) {
                                        tarmsg = targetMode.msg || "~Target~ tried to ~Action~ you, but you got scared and died!";
                                        tarmsg2 = targetMode.targetmsg || "You tried to ~Action~ ~Self~, but they got scared and died!";
                                        gamemsg(target.name, formatArgs(tarmsg, modeargs));
                                        gamemsg(player.name, formatArgs(tarmsg2, modeargs));
                                        mafia.kill(target);
                                        nightkill = true;
                                        continue;
                                    }
                                    else if (typeof targetMode.mode == "object") {
                                        if ("identify" in targetMode.mode && targetMode.mode.identify.indexOf(player.role.role) !== -1  && bp.indexOf("identify") === -1) {
                                            tarmsg = targetMode.identifymsg || "You identified ~Target~ as the ~Role~ that tried to ~Action~ you!";
                                            gamemsg(target.name, formatArgs(tarmsg,  modeargs));
                                        }
                                        if ("evadeCharges" in targetMode.mode && command in target.evadeCharges && bp.indexOf("evadeCharges") === -1) {
                                            var evdCharges = target.evadeCharges[command], evaded = false, ec, targetEvd, evdObj;
                                            
                                            if (!(target.name in evadeCharges)) {
                                                evadeCharges[target.name] = [];
                                            }
                                            for (ec in evadeCharges[target.name]) {
                                                targetEvd = evadeCharges[target.name][ec];
                                                if (targetEvd.command === command && ((Action.common === "Role" && targetEvd.role === player.role.role) || (Action.common === "Team" && targetEvd.side === player.role.side))) {
                                                    evaded = true;
                                                    break;
                                                }
                                            }
                                            
                                            if (evaded === false && evdCharges > 0) {
                                                target.evadeCharges[command] -= 1;
                                                tarmsg = (targetMode.evadechargemsg || "You evaded a ~Action~ (you still can evade ~EvadeCharges~ more times)!").replace(/~Action~/g, command).replace(/~EvadeCharges~/g, target.evadeCharges[command]);
                                                gamemsg(target.name, formatArgs(tarmsg, modeargs));
                                                
                                                if (Action.common !== "Self") {
                                                    evdObj = {
                                                        command: command
                                                    };
                                                    if (Action.common === "Role") {
                                                        evdObj.role = player.role.role;
                                                    } else if (Action.common === "Team") {
                                                        evdObj.side = player.role.side;
                                                    }
                                                    evadeCharges[target.name].push(evdObj);
                                                }
                                                evaded = true;
                                            }
                                            if (evaded) {
                                                if (targetMode.silent !== true) {
                                                    tarmsg = (targetMode.msg || "Your target (~Self~) evaded your ~Action~!").replace(/~EvadeCharges~/g, target.evadeCharges[command]);
                                                    gamemsg(player.name, formatArgs(tarmsg, modeargs));
                                                }
                                                continue;
                                            }
                                        }
                                        if ("evadeChance" in targetMode.mode && targetMode.mode.evadeChance > evadeChance && bp.indexOf("evadeChance") === -1) {
                                            if (targetMode.silent !== true) {
                                                tarmsg = targetMode.msg || "Your target (~Self~) evaded your ~Action~!";
                                                gamemsg(player.name, formatArgs(tarmsg, modeargs));
                                            }
                                            continue;
                                        }
                                        if ("ignore" in targetMode.mode && targetMode.mode.ignore.indexOf(player.role.role) !== -1  && bp.indexOf("ignore") === -1) {
                                            if (command == "distract") {
                                                var distractmsg = targetMode.msg || "The ~Distracter~ came to you last night, but you ignored her!";
                                                gamemsg(target.name, formatArgs(distractmsg, modeargs));
                                            } else {
                                                if (targetMode.silent !== true) {
                                                    tarmsg = targetMode.msg || "Your target (~Self~) evaded your ~Action~!";
                                                    gamemsg(player.name, formatArgs(tarmsg, modeargs));
                                                }
                                            }
                                            continue;
                                        }
                                        if ("killif" in targetMode.mode && targetMode.mode.killif.indexOf(player.role.role) !== -1 && bp.indexOf("killif") === -1) {
                                            tarmsg = (targetMode.targetmsg || targetMode.hookermsg || false);
                                            if (tarmsg) {
                                                gamemsg(player.name, tarmsg);
                                            }
                                            tarmsg2 = targetMode.msg;
                                            gamemsg(target.name, formatArgs(tarmsg2, modeargs));
                                            mafia.kill(player);
                                            nightkill = true;
                                            mafia.removeTargets(target);
                                            updateStalkTargets();
                                            continue outer;
                                        }
                                    }
                                    else if (targetMode.mode == "resistance" && bp.indexOf("resistance") === -1) {
                                        if (command == "poison") {
                                            if (typeof targetMode.rate == "number") {
                                                finalPoisonCount = Math.round(finalPoisonCount * targetMode.rate);
                                            } else {
                                                finalPoisonCount = finalPoisonCount + (targetMode.constant || 1);
                                            }
                                        }
                                        if (command == "curse") {
                                            if (typeof targetMode.rate == "number") {
                                                finalCurseCount = Math.round(finalCurseCount * targetMode.rate);
                                            } else {
                                                finalCurseCount = finalCurseCount + (targetMode.constant || 1);
                                            }
                                        }
                                    }
                                }
                            }
                            
                            var nightargs = { //Common Args used in commands and counters
                                '~Self~': player.name,
                                '~Player~': player.name,
                                '~User~': player.name,
                                '~Target~': (typeof target == "string" ? target : target.name),
                                '~Role~': player.role.translation,
                                '~Distracter~': player.role.translation,
                                '~TargetRole~': (typeof target == "string" ? target :target.role.translation),
                                '~Side~': mafia.theme.trside(player.role.side),
                                '~TargetSide~': (typeof target == "string" ? target : mafia.theme.trside(target.role.side)),
                                '~Action~': o.action
                            };
                            if (command == "distract") {
                                tarmsg = Action.distractmsg || "The ~Distracter~ came to you last night! You were too busy being distracted!";
                                gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                mafia.removeTargets(target);
                                updateStalkTargets();
    
                                /* warn role / teammates... No args because messes up very easily */
                                var teamMsg = Action.teammsg || "Your teammate was too busy with the ~Distracter~ during the night, you decided not to ~Action~ anyone during the night!";
                                if ("night" in target.role.actions) {
                                    for (var action in target.role.actions.night) {
                                        var team = getTeam(target.role, target.role.actions.night[action].common);
                                        for (var x in team) {
                                            if (team[x] != target.name) {
                                                gamemsg(team[x], formatArgs(teamMsg.replace(/~Action~/g, action), nightargs));
                                            }
                                        }
                                    }
                                }
                            }
                            else if (command == "protect") {
                                target.guarded = true;
                            }
                            else if (command == "safeguard") {
                                target.safeguarded = true;
                            }
                            else if (command == "inspect") {
                                var Sight = Action.Sight;
                                targetMode = targetMode || {};
                                var inspectMode = target.role.actions.inspect || {};
                                if (targetMode.revealSide !== undefined || Sight === "Team") {
                                    var revealedSide = mafia.theme.trside(target.role.side);
                                    if (typeof inspectMode.seenSide == "string" && inspectMode.seenSide in mafia.theme.sideTranslations) {
                                        revealedSide = mafia.theme.trside(inspectMode.seenSide);
                                    }
                                    gamemsg(player.name, target.name + " is sided with the " + revealedSide
                                    + "!!", "Info");
                                } else if (typeof Sight == "object") {
                                    var srole = randomSample(Sight);
                                    gamemsg(player.name, target.name + " is the " + mafia.theme.trrole((srole == "true") ? target.role.role : srole) + "!!", "Info");
                                } else if (targetMode.revealAs !== undefined) {
                                    if (typeof targetMode.revealAs == "string") {
                                        if (targetMode.revealAs == "*") {
                                            var rrole = Object.keys(mafia.players).map(getPlayerRoleId, mafia);
                                            gamemsg(player.name, target.name + " is the " + mafia.theme.trrole(rrole[Math.floor(Math.random() * rrole.length)]) + "!!", "Info");
                                        } else {
                                            gamemsg(player.name, target.name + " is the " + mafia.theme.trrole(targetMode.revealAs) + "!!", "Info");
                                        }
                                    } else if (Array.isArray(targetMode.revealAs)) {
                                        gamemsg(player.name, target.name + " is the " + mafia.theme.trrole(targetMode.revealAs[Math.floor(Math.random() * targetMode.revealAs.length)]) + "!!", "Info");
                                    }
                                } else {
                                    gamemsg(player.name, target.name + " is the " + target.role.translation + "!!", "Info");
                                }
                            }
                            else if (command == "kill") {
                                var killMessage = (Action.msg || mafia.theme.killusermsg || "You were killed during the night!"); //Custom message || Theme's message || Default message
                                gamemsg(target.name, killMessage);
                                mafia.kill(target);
                                nightkill = true;
                            }
                            else if (command == "poison") {
                                if (target.poisoned === undefined || target.poisonCount - target.poisoned >= finalPoisonCount) {
                                    var poisonmsg = Action.poisonmsg || "Your target (~Target~) was poisoned!";
                                    var poisontarmsg = Action.poisontarmsg || "";
                                    gamemsg(player.name, formatArgs(poisonmsg, nightargs));
                                    gamemsg(target.name, formatArgs(poisontarmsg, nightargs));
                                    var team = getTeam(player.role, Action.common);
                                    for (var x in team) {
                                        if (team[x] != player.name) {
                                            gamemsg(team[x], formatArgs(poisonmsg, nightargs));
                                        }
                                    }
                                    target.poisoned = 1;
                                    target.poisonCount = finalPoisonCount;
                                    target.poisonDeadMessage = Action.poisonDeadMessage;
                                }
                            }
                            else if (command == "stalk") {
                                target = typeof target == "object" ? target.name : target;
                                if (target in stalkTargets) {
                                    targetMode = targetMode || {};
                                    var visited = Object.keys(stalkTargets[target]).sort();
                                    if (visited.length > 0 && targetMode.mode !== "noVisit") {
                                        tarmsg = (Action.stalkmsg || "Your target (~Target~) visited " + readable(visited, "and") + " this night!").replace(/~Target~/gi, target).replace(/~Visit~/gi, readable(visited, "and"));
                                        gamemsg(player.name, tarmsg);
                                    } else {
                                        tarmsg = (Action.novisitmsg || "Your target (~Target~) didn't visit anyone this night!").replace(/~Target~/gi, target);
                                        gamemsg(player.name, tarmsg);
                                    }
                                }
                            }
                            else if (command == "convert") {
                                if(target.name == player.name) {
                                    if(selfConverted.indexOf(player.name) != -1) {
                                        continue outer;
                                    }
                                    selfConverted.push(player.name);
                                }
                                failedmsg = Action.convertfailmsg || "Your target (~Target~) couldn't be converted!";
                                if ("canConvert" in Action && Action.canConvert != "*" && Action.canConvert.indexOf(target.role.role) == -1) {
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                } else {
                                    var oldRole = target.role, newRole = null;
                                    if (typeof Action.newRole == "object") {
                                        if ("random" in Action.newRole && !Array.isArray(Action.newRole.random) && typeof Action.newRole.random === "object" && Action.newRole.random !== null) {
                                            newRole = randomSample(Action.newRole.random);
                                        } else {
                                            var possibleRoles = shuffle(Object.keys(Action.newRole));
                                            for (var nr in possibleRoles) {
                                                if (Action.newRole[possibleRoles[nr]].indexOf(oldRole.role) != -1) {
                                                    newRole = possibleRoles[nr];
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        newRole = Action.newRole;
                                    }
                                    if (newRole === null) {
                                        gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                    } else {
                                        mafia.setPlayerRole(target, newRole);
                                        if (!Action.silent) {
                                            allmsg = (Action.convertmsg ||"A ~Old~ has been converted into a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation);
                                            gamemsgAll(formatArgs(allmsg, nightargs));
                                        }
                                        if (target !== player) {
                                            pmsg = (Action.usermsg || "Your target (~Target~) has been converted and is now a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation);
                                            gamemsg(player.name, formatArgs(pmsg, nightargs));
                                        }
                                        if (!Action.silentConvert) {
                                            tarmsg = (Action.tarmsg || "You have been converted and changed roles!");
                                            gamemsg(target.name, tarmsg);
                                            mafia.showOwnRole(sys.id(target.name));
                                        }
                                    }
                                }
                            }
                            else if (command == "copy") {
                                failedmsg = Action.copyfailmsg || "Your target (~Target~) can't be copied!";
                                if (typeof Action.copyAs == "string" && "canCopy" in Action && Action.canCopy != "*" && Action.canCopy.indexOf(target.role.role) == -1) {
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                } else {
                                    var oldRole = player.role, newRole = null;
                                    if (typeof Action.copyAs == "object") {
                                        var possibleRoles = shuffle(Object.keys(Action.copyAs));
                                        for (var nr in possibleRoles) {
                                            if (Action.copyAs[possibleRoles[nr]].indexOf(target.role.role) != -1) {
                                                newRole = possibleRoles[nr];
                                                break;
                                            }
                                        }
                                    } else if (typeof Action.copyAs == "string") {
                                        if (Action.copyAs == "*") {
                                            newRole = target.role.role;
                                        } else {
                                            newRole = Action.copyAs;
                                        }
                                    }
                                    if (newRole === null) {
                                        gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                    } else {
                                        mafia.setPlayerRole(player, newRole);
                                        if (!Action.silent) {
                                            allmsg = (Action.copymsg || "A ~Old~ has been converted into a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, player.role.translation); //Can't replace ~New~ with nightargs due to different target
                                            gamemsgAll(formatArgs(allmsg, nightargs));
                                        }
                                        if (!Action.silentCopy) {
                                            pmsg = (Action.usermsg || "You copied someone and changed roles!");
                                            gamemsg(player.name, pmsg);
                                            mafia.showOwnRole(sys.id(player.name));
                                        }
                                    }
                                }
                            }
                            else if (command == "curse") {
                                failedmsg = Action.cursefailmsg || "Your target (~Target~) couldn't be cursed!";
                                if ("canCurse" in Action && Action.canCurse != "*" && Action.canCurse.indexOf(target.role.role) == -1) {
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                } else {
                                    var oldRole = target.role, cursedRole = null;
                                    if (typeof Action.cursedRole == "object") {
                                        if ("random" in Action.cursedRole && !Array.isArray(Action.cursedRole.random) && typeof Action.cursedRole.random === "object" && Action.cursedRole.random !== null) {
                                            cursedRole = randomSample(Action.cursedRole.random);
                                        } else {
                                            var possibleRoles = shuffle(Object.keys(Action.cursedRole));
                                            for (var nr in possibleRoles) {
                                                if (Action.cursedRole[possibleRoles[nr]].indexOf(oldRole.role) != -1) {
                                                    cursedRole = possibleRoles[nr];
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        cursedRole = Action.cursedRole;
                                    }
                                    if (cursedRole === null) {
                                        gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                    } else {
                                        pmsg = Action.cursemsg || "Your target (~Target~) was cursed!";
                                        gamemsg(player.name, formatArgs(pmsg, nightargs));
                                        target.cursed = 1;
                                        target.curseCount = finalCurseCount;
                                        target.cursedRole = cursedRole;
                                        target.silentCurse = Action.silentCurse || false;
                                        if (!Action.silent) {
                                            target.curseConvertMessage = Action.curseConvertMessage || "~Target~ has been converted into a ~New~!";
                                        }
                                    }
                                }
                            }
                            else if (command == "detox") {
                                if (target.poisoned !== undefined) {
                                    target.poisoned = undefined;
                                    if (!Action.silent) {
                                        allmsg = Action.detoxmsg || "A player was cured of poison!";
                                        gamemsgAll(formatArgs(allmsg, nightargs));
                                    }
                                    pmsg = Action.msg || "Your target (~Target~) was cured of poison!";
                                    tarmsg = Action.targetmsg || "You were cured of poison!";
                                    gamemsg(player.name, formatArgs(pmsg, nightargs));
                                    gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                } else {
                                    failedmsg = Action.detoxfailmsg || "Your target (~Target~) isn't poisoned!";
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                }
                            }
                            else if (command == "dispel") {
                                if (target.cursed !== undefined) {
                                    target.cursed = undefined;
                                    if (!Action.silent) {
                                        allmsg = Action.dispelmsg || "A player's curse was dispelled!";
                                        gamemsgAll(formatArgs(allmsg, nightargs));
                                    }
                                    pmsg = Action.msg || "Your target (~Target~) was freed from their curse!";
                                    tarmsg = Action.targetmsg || "You were freed from your curse!";
                                    gamemsg(player.name, formatArgs(pmsg, nightargs));
                                    gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                } else {
                                    failedmsg = Action.dispelfailmsg || "Your target (~Target~) isn't cursed!";
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                }
                            }
                            else if (command == "shield") {
                                target.redirectTo = player.name;
                                target.redirectActions = Action.shieldActions || "*";
                                target.shieldmsg = Action.shieldmsg || "Your ~Action~ was shielded by ~Self~!";
                            }
                            else if (commandIsDummy) {
                                //Dummy actions to trigger modes without replacing useful commands. Great for large themes that want more freedom.
                                pmsg = Action[command + "usermsg"] || "";
                                tarmsg = Action[command + "targetmsg"] || "";
                                allmsg = Action[command + "broadcastmsg"] || "";
                                gamemsg(player.name, formatArgs(pmsg, nightargs));
                                gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                gamemsgAll(formatArgs(allmsg, nightargs));
                            }
                            else if (command == "massconvert") {
                                var convertRoles = Action.convertRoles, nr, k, singleAffected = [], affected, newRole, targetPlayers, convertedPlayer, newRole;
                                for (nr in convertRoles) {
                                    targetPlayers = this.getPlayersForRole(nr);
                                    newRole = convertRoles[nr];
                                    affected = [];
                                    for (k in targetPlayers) {
                                        affected.push(targetPlayers[k]);
                                        convertedPlayer = this.players[targetPlayers[k]];
                                        mafia.setPlayerRole(convertedPlayer, newRole);
                                        if (!Action.silentMassConvert) {
                                            mafia.showOwnRole(sys.id(targetPlayers[k]));
                                        }
                                    }
                                    if (affected.length > 0 && Action.silent !== true) {
                                        if ("singlemassconvertmsg" in Action) {
                                            singleAffected = singleAffected.concat(affected);
                                        } else {
                                            var actionMessage = (Action.massconvertmsg || "The ~Old~ became a ~New~!").replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(nr)).replace(/~New~/, mafia.theme.trrole(newRole));
                                            gamemsgAll(formatArgs(actionMessage, nightargs));
                                        }
                                    }
                                }
                                if (singleAffected.length > 0) {
                                    gamemsgAll(Action.singlemassconvertmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and"))); //No args here to prevent conflicting replacements
                                }
                            }
    
                            //Post-Action effects here
                            if (revenge) {
                                gamemsg(player.name, revengetext);
                                mafia.kill(player);
                                nightkill = true;
                                continue outer;
                            } else if (poisonrevenge > 0) {
                                if (player.poisoned === undefined || player.poisonCount - player.poisoned >= poisonrevenge) {
                                    gamemsg(player.name, poisonrevengetext);
                                    player.poisoned = 1;
                                    player.poisonCount = poisonrevenge;
                                    player.poisonDeadMessage = poisonDeadMessage;
                                }
                            }
                        }
                    }
                    if ("suicideChance" in Action && mafia.isInGame(player.name) && targets.length > 0) {
                        if (Action.suicideChance > Math.random()) {
                            pmsg = (Action.suicidemsg || "You died while trying to ~Action~ during this night!").replace(/~Action~/g, o.action);
                            gamemsg(player.name, pmsg);
                            mafia.kill(player);
                            nightkill = true;
                            continue;
                        }
                    }
                }
            }
            // decrease counters
            for (var p in mafia.players) {
                player = mafia.players[p];
                var curseCount = player.curseCount;
                if (curseCount !== undefined && mafia.isInGame(p)) {
                    if (player.cursed < curseCount) {
                        if (!player.silentCurse) {
                            gamemsg(player.name, "You will convert in " + (player.curseCount - player.cursed) + " days.");
                        }
                        player.cursed++;
                    } else if (player.cursed >= curseCount) {
                        if (player.curseConvertMessage) {
                            gamemsgAll(player.curseConvertMessage.replace(/~Old~/g, player.role.translation).replace(/~New~/g, mafia.theme.roles[player.cursedRole].translation).replace(/~Target~/g, player.name).replace(/~Player~/g, player.name).replace(/~Side~/g, mafia.theme.trside(player.role.side)));
                            player.curseConvertMessage = undefined;
                        }
                        player.curseCount = undefined;
                        mafia.setPlayerRole(player, player.cursedRole);
                        if (!player.silentCurse) {
                            gamemsg(player.name, "Your curse took effect and you changed roles!");
                            mafia.showOwnRole(sys.id(player.name));
                        }
                    }
                }
                var poisonCount = player.poisonCount;
                if (poisonCount !== undefined) {
                    if (player.poisoned < poisonCount) {
                        gamemsg(player.name, "You have " + (player.poisonCount - player.poisoned) + " days to live.");
                        player.poisoned++;
                    } else if (player.poisoned >= poisonCount) {
                        gamemsg(player.name, (player.poisonDeadMessage ? player.poisonDeadMessage : "You died because of poison!"));
                        mafia.kill(player);
                        nightkill = true; // kinda night kill
                    }
                }
            }
            if (!nightkill) {
                gamemsgAll("No one died! :");
            }
            mafia.reduceRecharges();
            mafia.collectedSlay();
            mafia.onDeadRoles();
            if (mafia.testWin()) {
                return;
            }

            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.standby) || mafia.theme.ticks.standby < 1 || mafia.theme.ticks.standby > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.standby;
            }
            if (mafia.players.length >= 15) {
                mafia.ticks = parseInt(mafia.ticks * 1.33, 10);
            } else if (mafia.players.length <= 4) {
                mafia.ticks = parseInt(mafia.ticks * 0.5, 10);
                if (mafia.ticks < 1) {
                    mafia.ticks = 1;
                }
            }
            sendChanAll(border, mafiachan);
            gamemsgAll("±Current Roles: " + mafia.getCurrentRoles() + ".");
            gamemsgAll("±Current Players: " + mafia.getCurrentPlayers() + ".");
            if (mafia.theme.closedSetup !== true) {
                // Send players all roles sided with them
                for (p in mafia.players) {
                    player = mafia.players[p];
                    var side = player.role.side;
                    gamemsg(player.name, "±Current Team: " + mafia.getRolesForTeamS(side));
                }
            }
            mafia.time.days++;
            mafia.state = "standby";
            
            gamemsgAll("±Time: Day " + mafia.time.days);
            gamemsgAll("You have " + mafia.ticks + " seconds to debate who are the bad guys! :");
            //Sends a help message to anyone with a standby action
            for (var role in mafia.theme.standbyRoles) {
                names = mafia.getPlayersForRole(mafia.theme.standbyRoles[role]);
                for (j = 0; j < names.length; ++j) {
                    for (var k in mafia.players[names[j]].role.actions.standby) {
                        if (mafia.players[names[j]].role.actions.standby[k].msg) {
                            gamemsg(names[j], mafia.players[names[j]].role.actions.standby[k].msg);
                        }
                    }
                }
            }
            sendChanAll(border, mafiachan);
        },
        standby: function () {
            mafia.ticks = 30;
            
            this.compilePhaseStalk("STANDBY PHASE " + mafia.time.days);
            
            if (Object.keys(mafia.usersToSlay).length !== 0) {
                sendChanAll(border, mafiachan);
            }
            mafia.collectedSlay();
            if (mafia.testWin()) {
                return;
            }
            sendChanAll(border, mafiachan);
            gamemsgAll("±Current Roles: " + mafia.getCurrentRoles() + ".");
            gamemsgAll("±Current Players: " + mafia.getCurrentPlayers() + ".");
            
            
            // Send players all roles sided with them
            var p, r, role, side, check,
                themecs = mafia.theme.closedSetup != null;
            for (p in mafia.players) {
                var player = mafia.players[p];
                role = player.role;
                side = role.side;
                check = false;
                
                // != null checks for undefined and null
                if (role.closedSetup != null) {
                    check = role.closedSetup;
                } else if (side.closedSetup != null) {
                    check = side.closedSetup;
                } else if (themecs) {
                    check = mafia.theme.closedSetup;
                }
                
                if (!check) {
                    gamemsg(player.name, "±Current Team: " + mafia.getRolesForTeamS(side));
                }

                if (p in mafia.dayRecharges) {
                    for (r in mafia.dayRecharges[p]) {
                        mafia.setRechargeFor(player, "standby", r, mafia.dayRecharges[p][r]);
                    }
                }
            }
            
            var nolyn = false;
            if (mafia.theme.nolynch !== undefined && mafia.theme.nolynch !== false) {
                nolyn = true;
            }
            if (nolyn === false) {
                gamemsgAll("±Time: Day " + mafia.time.days);
                gamemsgAll("It's time to vote someone off, type /Vote [name], you only have " + mafia.ticks + " seconds! :");
                sendChanAll(border, mafiachan);
                
                mafia.state = "day";
                mafia.votes = {};
                mafia.voteCount = 0;
            } else {
                if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                    mafia.ticks = 30;
                } else {
                    mafia.ticks = mafia.theme.ticks.night;
                }

                mafia.time.nights++;
                mafia.state = "night";
                
                gamemsgAll("±Time: Night " + mafia.time.nights);
                gamemsgAll("Make your moves, you only have " + mafia.ticks + " seconds! :");
                sendChanAll(border, mafiachan);
                mafia.resetTargets();
            }
        },
        day: function () {
            sendChanAll(border, mafiachan);
            gamemsgAll("Times Up! :");
            
            this.compilePhaseStalk("VOTING PHASE " + mafia.time.days);

            var voted = {}, voters = {}, player, vote;
            for (var pname in mafia.votes) {
                player = mafia.players[pname];
                var target = mafia.votes[pname];
                // target play have been killed meanwhile by slay
                if (!mafia.isInGame(target)) continue;
                if (!(target in voted)) {
                    voted[target] = 0;
                    voters[target] = [];
                }
                vote = player.role.actions.vote;
                if (vote !== undefined) {
                    if (typeof vote === "number") {
                        voted[target] += vote;
                    } else {
                        voted[target] += vote[sys.rand(0, vote.length)];
                    }
                } else {
                    voted[target] += 1;
                }
                voters[target].push(pname);
            }
            var tie = true, maxi = 0, downed = noPlayer, voteshield;
            for (var x in voted) {
                player = mafia.players[x];
                voteshield = player.role.actions.voteshield;
                if (voteshield !== undefined) {
                    if (typeof voteshield === "number") {
                        voted[x] += voteshield;
                    } else {
                        voted[x] += voteshield[sys.rand(0, voteshield.length)];
                    }
                }
                if (voted[x] == maxi) {
                    tie = true;
                } else if (voted[x] > maxi) {
                    tie = false;
                    maxi = voted[x];
                    downed = x;
                }
            }
            
            if (mafia.theme.noplur === true && Object.keys(mafia.players).length/2 >= maxi) { //Checks if someone actually gets lynched
                tie = true;
                downed = noPlayer;
            }

            if (tie) {
                if (mafia.theme.noplur === true) {
                    gamemsgAll("A majority vote was not reached so no one was voted off!:");
                } else {
                    gamemsgAll("No one was voted off!:");
                }
                mafia.collectedSlay();
                if (mafia.testWin()) {
                    return;
                }
                sendChanAll(border, mafiachan);
            } else {
                var lynched = mafia.players[downed];
                if ("lynch" in lynched.role.actions) {
                    //Handled the same, no reason to duplicate code
                    mafia.actionBeforeDeath(lynched, true);
                    //Then we run only lynch things
                    var lyn = lynched.role.actions.lynch;
                    if ("killVoters" in lyn) {
                        var first = lyn.killVoters.first || 1,
                            last =  lyn.killVoters.last  || 0,
                            votersList = voters[downed].concat(),
                            firstList,
                            lastList,
                            r,
                            target;
                            
                        if (votersList.indexOf(downed) !== -1) {
                            votersList.splice(votersList.indexOf(downed), 1);
                        }
                        firstList = votersList.slice(0, first);
                        lastList = last > 0 ? votersList.slice(-last) : [];
                            
                        votersList = removeDuplicates(firstList.concat(lastList));
                        
                        var actionMessage = (lyn.killVoters.message || "~Target~ died for having voted for ~Self~!").replace(/~Self~/g, lynched.name).replace(/~Target~/g, readable(votersList, "and"));
                        gamemsgAll(actionMessage, "Kill");
                        for (r in votersList) {
                            target = votersList[r];
                            if (this.isInGame(target)) {
                                mafia.kill(this.players[target]);
                            }
                        }
                    }
                }
                
                if ("lynch" in lynched.role.actions && "convertTo" in lynched.role.actions.lynch) {
                    var newRole = lynched.role.actions.lynch.convertTo;
                    var allmsg = (lynched.role.actions.lynch.lynchmsg || lynched.role.actions.lynch.convertmsg || "~Self~, the ~Old~ survived the lynch and became a ~New~!").replace(/~Self~/g, downed).replace(/~Old~/g, lynched.role.translation).replace(/~New~/g, mafia.theme.trrole(newRole)).replace(/~Count~/g, Math.round(maxi * 100) / 100);
                    gamemsgAll(allmsg); //lynchmsg || convertmsg || default msg. Will still allow convertTo and convertRoles in same object, but would require lynchmsg
                    mafia.setPlayerRole(lynched, newRole);
                    mafia.showOwnRole(sys.id(downed));
                } else {
                    var roleName = typeof mafia.players[downed].role.actions.lynch == "object" && typeof mafia.players[downed].role.actions.lynch.revealAs == "string" ? mafia.theme.trrole(mafia.players[downed].role.actions.lynch.revealAs) : mafia.players[downed].role.translation;
                    var lynchmsg = (mafia.theme.lynchmsg || "~Player~ (~Role~) was removed from the game!").replace(/~Player~/g, downed).replace(/~Role~/g, roleName).replace(/~Side~/g, mafia.theme.trside(mafia.players[downed].role.side)).replace(/~Count~/g, Math.round(maxi * 100) / 100);
                    gamemsgAll(lynchmsg);
                    if (!("lynch" in lynched.role.actions)){
                        //Now we run it so it checks for onDeath if there was no onLynch
                        mafia.actionBeforeDeath(lynched, false);
                    }
                    mafia.removePlayer(mafia.players[downed]);
                }
                
                mafia.collectedSlay();
                mafia.onDeadRoles();
                if (mafia.testWin()) {
                    return;
                }
                sendChanAll(border, mafiachan);
            }
            
            gamemsgAll("±Current Roles: " + mafia.getCurrentRoles() + ".");
            gamemsgAll("±Current Players: " + mafia.getCurrentPlayers() + ".");

            // Send players all roles sided with them
            var p, role, side, check,
                themecs = mafia.theme.closedSetup != null;
            for (p in mafia.players) {
                player = mafia.players[p];
                role = player.role;
                side = role.side;
                check = false;
                
                // != null checks for undefined and null
                if (role.closedSetup != null) {
                    check = role.closedSetup;
                } else if (side.closedSetup != null) {
                    check = side.closedSetup;
                } else if (themecs) {
                    check = mafia.theme.closedSetup;
                }
                
                if (!check) {
                    gamemsg(player.name, "±Current Team: " + mafia.getRolesForTeamS(side));
                }
            }

            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.night;
            }

            mafia.time.nights++;
            mafia.state = "night";

            gamemsgAll("±Time: Night " + mafia.time.nights);
            gamemsgAll("Make your moves, you only have " + mafia.ticks + " seconds! :");
            sendChanAll(border, mafiachan);
            mafia.runusersToSlayMsg();
            mafia.usersToSlay = {};
            mafia.resetTargets();
        },
        voting: function () {
            this.state = "blank";
            var res = {}, theme, players = {}, ips = {};
            for (var ip in this.votes) {
                theme = this.votes[ip].theme;
                res[theme] = ++res[theme] || 1;
                players[theme] = players[theme] || [];
                players[theme].push(this.votes[ip].who);
                ips[theme] = ips[theme] || [];
                ips[theme].push(ip);
            }
            var winner = { votes: -1, theme: null };
            for (theme in res) {
                if (res[theme] > winner.votes) {
                    winner.votes = res[theme];
                    winner.theme = theme;
                }
            }
            if (winner.theme !== null) {
                sendChanAll("", mafiachan);
                gamemsgAll("Theme " + this.themeManager.themes[winner.theme].name + " won with " + winner.votes + " votes!");
                gamemsgAll("Type /Join to enter the game!");
                sendChanAll("", mafiachan);
                this.startGame(null, winner.theme);
                this.signups = players[winner.theme];
                this.ips = ips[winner.theme];
                mafia.ticks = 40;
                gamemsgAll(this.signups.join(", ") + " joined the game!");
                for (var x = 0; x < this.signups.length; x++) {
                    if (SESSION.users(sys.id(this.signups[x]))) {
                        if (SESSION.users(sys.id(this.signups[x])).smute.active) {
                            mafia.shoveUser(mafiabot.name, this.signups[x], true);
                        }
                    }
                    if (this.signups[x] in this.usersToShove) {
                        var name = this.signups[x];
                        var shover = this.usersToShove[name];
                        mafia.shoveUser(shover, name, false);
                        delete this.usersToShove[name];
                        x--;
                    }
                }
            } else {
                gamemsgAll("Really? No votes, so no game.");
            }
        }
    };
    this.callHandler = function (state) {
        try {
            if (state in this.handlers)
                this.handlers[state].call(this);
        } catch (e) {
            dualBroadcast("Error occurred in mafia while handling the end of '" + state + "' phase" + (e.lineNumber ? " on line " + e.lineNumber : "") +  ": " + e);
            mafia.endGame(false);
            mafia.themeManager.disable(Config.Mafia.bot, mafia.theme.name, false);
        }
    };
    this.showOwnRole = function (src, rolepm) {
        var name = rolepm ? src : sys.name(src);
        if ((mafia.state != "blank" && mafia.state != "entry") || rolepm) {
            if (mafia.isInGame(name) || rolepm) {
                var player = mafia.players[name];
                var role = player.role;

                if (typeof role.actions.startup == "object" && typeof role.actions.startup.revealAs == "string") {
                    gamemsg(player.name, "You are a " + mafia.theme.trrole(role.actions.startup.revealAs) + "!");
                } else {
                    var startmsg = (role.startupmsg || "You are a ~Role~!").replace(/~Role~/gi, role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side));
                    gamemsg(player.name, startmsg);
                }
                gamemsg(player.name, role.help.replace(/~Side~/gi, mafia.theme.trside(player.role.side)));
                var help2msg = (role.help2 || "");
                gamemsg(player.name, help2msg);

                if (role.actions.startup == "team-reveal") {
                    gamemsg(player.name, "Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                }
                if (role.actions.startup == "team-reveal-with-roles") {
                    var playersRole = mafia.getPlayersForTeam(role.side).map(name_trrole, mafia.theme);
                    gamemsg(player.name, "Your team is " + readable(playersRole, "and") + ".");
                }
                if (typeof role.actions.startup == "object" && Array.isArray(role.actions.startup["team-revealif"])) {
                    if (role.actions.startup["team-revealif"].indexOf(role.side) != -1) {
                        gamemsg(player.name, "Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                    }
                }
                if (typeof role.actions.startup == "object" && Array.isArray(role.actions.startup["team-revealif-with-roles"])) {
                    if (role.actions.startup["team-revealif-with-roles"].indexOf(role.side) != -1) {
                        var playersRole = mafia.getPlayersForTeam(role.side).map(name_trrole, mafia.theme);
                        gamemsg(player.name, "Your team is " + readable(playersRole, "and") + ".");
                    }
                }
                if (role.actions.startup == "role-reveal") {
                    gamemsg(player.name, "People with your role are " + mafia.getPlayersForRoleS(role.role) + ".");
                }

                if (typeof role.actions.startup == "object") {
                    if (role.actions.startup.revealRole) {
                        if (typeof role.actions.startup.revealRole == "string") {
                            if (mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) !== "")
                                gamemsg(player.name, "The " + mafia.theme.roles[role.actions.startup.revealRole].translation + " is " + mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) + "!");
                        } else if (Array.isArray(role.actions.startup.revealRole)) {
                            for (var s = 0, l = role.actions.startup.revealRole.length; s < l; ++s) {
                                var revealrole = role.actions.startup.revealRole[s];
                                if (mafia.getPlayersForRoleS(revealrole) !== "") {
                                    gamemsg(player.name, "The " + mafia.theme.roles[revealrole].translation + " is " + mafia.getPlayersForRoleS(revealrole) + "!");
                                }
                            }
                        }
                    }
                    if (role.actions.startup.revealPlayers) {
                        var list = [], msg = "Your team is: ~Players~";
                        if (typeof role.actions.startup.revealPlayers == "string") {
                            list = mafia.getPlayersForRole(role.actions.startup.revealPlayers);
                        } else if (Array.isArray(role.actions.startup.revealPlayers)) {
                            for (var r in role.actions.startup.revealPlayers) {
                                list = list.concat(mafia.getPlayersForRole(role.actions.startup.revealPlayers[r]));
                            }
                            list = list.sort().join(", ");
                        }
                        msg = ("revealPlayersMsg" in role.actions.startup ? role.actions.startup.revealPlayersMsg : msg).replace(/~Players~/g, list);
                        gamemsg(player.name, msg);
                    }
                }
            } else {
                gamemsg(name, "You are not in the game!");
            }
        } else {
            gamemsg(name, "No game running!");
        }
    };
    
    // Auth commands
    this.isMafiaAdmin = function (src) {
        return sys.auth(src) >= 1 || mafia.isMafiaSuperAdmin(src) || script.mafiaAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase());
    };
    this.isMafiaSuperAdmin = function (src) {
        return (sys.auth(src) >= 3 || script.mafiaSuperAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase()));
    };
    
    this.slayUser = function (src, name, delayed) {
        var slayer = typeof src == "string" ? src : sys.name(src);
        if (this.state == "entry" || this.state == "voting" || this.state == "blank") {
            msg(src, "The game has not yet started. Use /shove to prevent the player from playing.");
            return;
        }
        name = this.correctCase(name);
        var player = this.players[name];
        if (delayed) {
            if (this.isInGame(name)) {
                role = mafia.usersToSlay[name][1];
                if (role.actions.hasOwnProperty("onDeath")) {
                    if (role.actions.onDeath.onslay !== false) {
                        this.actionBeforeDeath(player);
                    }
                }
                this.removePlayer(player);
                this.onDeadRoles();
            }
            return;
        }
        if (this.isInGame(name)) {
            if (name in mafia.usersToSlay) {
                gamemsg(slayer, player.name + " is already going to be sla" + "\u200b" + "in after the phase ends!", "Slay");
                return;
            }
            gamemsgAll(player.name + " will be sla" + "\u200b" + "in by " + slayer + " after the phase ends!", "Slay");
            var player = this.players[name],
                role = player.role;
            mafia.usersToSlay[name] = [slayer, role];
            return;
        }
        gamemsg(slayer, "No such target.", "Slay");
    };
    this.slayUserMsg = function (src, name, role) {
        var slayer = typeof src == "string" ? src : sys.name(src);
        dualBroadcast("±Slay: " + name + " (" + role.translation + ") was sla" + "\u200b" + "in by " + nonFlashing(slayer) + "!");
    };
    this.runusersToSlay = function () {
        for (var x in mafia.usersToSlay) {
            var name = x,
                slayer = mafia.usersToSlay[name][0];
            this.slayUser(slayer, name, true);
        }
    };
    this.runusersToSlayMsg = function () {
        for (var x in mafia.usersToSlay) {
            var name = x;
            var slayer = mafia.usersToSlay[name][0],
                role = mafia.usersToSlay[name][1];
            mafia.slayUserMsg(slayer, name, role);
        }
    };
    this.collectedSlay = function () {
        mafia.runusersToSlay();
        mafia.runusersToSlayMsg();
        mafia.usersToSlay = {};
    };
    this.shoveUser = function (src, name, silent) {
        var shover = typeof src == "string" ? src : sys.name(src);
        if (this.state == "entry" || this.state == "voting" || this.state == "blank") {
            for (var i = 0; i < this.signups.length; ++i) {
                if (name.toLowerCase() == this.signups[i].toLowerCase()) {
                    if (!silent) {
                        msgAll(this.signups[i] + " was taken out from the game by " + nonFlashing(shover) + "!");
                        msgAll(this.signups[i] + " was taken out from the game by " + nonFlashing(shover) + "!", sachannel);
                    }
                    this.signups.splice(i, 1);
                    return;
                }
            }
            if (name in this.usersToShove) {
                msg(src, name + " is already going to be shoved if they attempt to join!");
                return;
            }
            this.usersToShove[name] = shover;
            msg(src, "Your target " + name + " will be shoved if they attempt to join!");
        } else {
            msg(src, "A game is currently in progress. Use /slay to remove the player.");
        }
    };
    
    this.checkLink = function (url) {
        var dlurl = url;
        if (url.indexOf("pastebin") !== -1 && url.indexOf("raw") === -1) {
            dlurl = url.replace(/http:\/\/pastebin.com\/(.*)/i, "http://pastebin.com/raw.php?i=$1");
        }
        return dlurl;
    };
    this.checkDead = function (players) {
        if (players < numPlayersBeforeDead && deadTime < timesBeforeNonPeak) {
            deadTime += 1;
        } else if (players >= numPlayersBeforeDead && deadTime > 0) {
            deadTime -= 1;
        }
        if (deadTime >= timesBeforeNonPeak) {
            mafia.nonPeak(false, true);
        } else if (deadTime === 0) {
            mafia.nonPeak(false, false);
        }
    };
    this.nonPeak = function (src, enable) {
        if (peak !== undefined && enable !== peak) {
            if (src) {
                msg(src, "Non-peaks themes are already " + (peak ? " disabled!" : " enabled!"));
            }
            return;
        }
        var name = src ? sys.name(src) : mafiabot.name;
        var themes = mafia.themeManager.themes;
        var npThemes = [];
        for (var x in themes) {
            var each = themes[x];
            if (each["roles" + each.roleLists].length > npcutoff) {
                continue;
            }
            if (themes[x].nonPeak) {
                if (enable) {
                    mafia.themeManager.enable(src, x, true);
                } else {
                    mafia.themeManager.disable(src, x, true);
                }
                npThemes.push(themes[x].name);
            }
        }
        if (npThemes.length) {
            dualBroadcast("±" + mafiabot.name + ": " + nonFlashing(name) + (enable ? " enabled " : " disabled ") + "non-peak themes (" + npThemes.join(", ") + ").");
            peak = enable === false;
            deadTime = (peak ? 0 : timesBeforeNonPeak);
        } else {
            if (src) {
                msg(src, "No non-peak themes found");
            }
        }
        return;
    };
    
    this.invalidName = function (src) {
        var name = sys.name(src);
        for (var x = 0; x < name.length; x++) {
            var code = name.charCodeAt(x);
            if (name[x] != ' ' && name[x] != '.' && (code < 'a'.charCodeAt(0) || code > 'z'.charCodeAt(0))
                && (code < 'A'.charCodeAt(0) || code > 'Z'.charCodeAt(0)) && name[x] != '-' && name[x] != '_' && name[x] != '<' && name[x] != '>' && (code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0))) {
                msg(src, "You're not allowed to have the following character in your name: " + name[x] + ".");
                msg(src, "You must change it if you want to play!");
                return true;
            }
        }
        
        var botNames = ["Kill", "Slay", "Game", "Murkrow", "Rule", "Rules", "Hint", "Dratini", "Exploud", "Blaziken"];
        if (botNames.indexOf(name) !== -1) {
            msg(src, "Your name is too similar to a common bot used by the script and can be confusing to other players.");
            msg(src, "You must change it if you want to play!");
            return true;
        }
        
        if (name.length > Config.Mafia.max_name_length) {
            msg(src, "You're not allowed to have more than " + Config.Mafia.max_name_length + " letters in your name!");
            msg(src, "You must change it if you want to join!");
            return true;
        }
        
        //Prevents names with too many capital letters (7 in total, 5 consecutive)
        if (name.length >= 5) {
            var caps = 0;
            var ccaps = 0;
            for (var i = name.length-1; i >= 0; --i) {
                if ('A' <= name[i] && name[i] <= 'Z') {
                    ++caps;
                    ++ccaps;
                    if (ccaps == 5 || caps == 7) {
                        msg(src, "You're not allowed to have more than 5 consecutive or 7 total capital letters in your name!");
                        msg(src, "You must change it if you want to join!");
                        return true;
                    }
                } else {
                    ccaps = 0;
                }
            }
        }
        return false;
    };
    this.canJoin = function (src) {
        var user = sys.name(src);
        if (this.isInGame(sys.name(src))) {
            gamemsg(user, "You already joined!");
            return;
        }
        if (this.invalidName(src)) {
            return;
        }
        if (this.ips.indexOf(sys.ip(src)) != -1) {
            gamemsg(user, "This IP is already in list. You cannot register two times!");
            return;
        }
        if (this.numjoins[sys.ip(src)] >= 2) {
            gamemsg(user, "You can't join/unjoin more than 3 times!");
            return;
        }
        if (SESSION.users(src).mute.active) {
            gamemsg(user, "You are muted!");
            return;
        }
        if (!sys.dbRegistered(sys.name(src))) {
            gamemsg(user, "You need to register to play mafia here! Click on the 'Register' button below and follow the instructions!");
            return;
        }
        return true;
    };
    
    this.addPhaseStalkAction = function (user, action, target) {
        if (!(user in phaseStalk)) phaseStalk[user] = [];
        phaseStalk[user].push("/" + action + " " + target);
    };
    this.addPhaseStalkHax = function (user, action, target, haxer) {
        phaseStalk[user][phaseStalk[user].length - 1] += " (Haxed by " + haxer.join(", ") + ")";
    };
    this.compilePhaseStalk = function (phase) {
        currentStalk.push("*** " + phase + " ***");
        for (var u in phaseStalk) {
            currentStalk.push(u + " used: " + phaseStalk[u].join(", "));
        }
        phaseStalk = {};
    };
    
    this.commands = {
        user: ["/mafiaadmins: To get a list of current Mafia Admins.",
            "/start: Starts a Game of Mafia with specified theme. Can also use /starttheme.",
            "/vote: Start voting for a new game theme or vote! Can also use /votetheme.",
            "/join: To join a Mafia game.",
            "/unjoin: To unjoin a Mafia game during signups.",
            "/help: For info on how to win in a game.",
            "/roles: For info on all the Roles in the game.",
            "/sides: For info on all teams in the game.",
            "/myrole: To view again your role, help text and teammates.",
            "/mafiarules: To see the Rules for the Game.",
            "/themes: To view installed themes.",
            "/themeinfo: To view installed themes (more details).",
            "/changelog: To view a theme's changelog (if it has one)",
            "/details: To view info about a specific theme.",
            "/priority: To view the priority list of a theme. ",
            "/flashme: To get a alert when a new mafia game starts. Type /flashme help for more info.",
            "/playedgames: To view recently played games. Can also use /pg.",
            "/topthemes: To view top themes. Default amount is 10, however other numbers can be used (higher numbers may cause lag)",
            "/windata: To view the win data of a theme",
            "/update: To update a Mafia Theme. /update themename::newurl if changing the url. Contact an sMA if the theme name is changed to prevent conflicts.",
            "/featured: To view the currently featured Mafia Theme and Text."],
        ma: ["/slay: To slay users in a Mafia game.",
            "/unslay: To cancel a slay on a user.",
            "/shove: To remove users before a game starts.",
            "/unshove: To cancel a shove on a user.",
            "/mafiaban: To ban a user from the Mafia channel, format /mafiaban user:reason:time",
            "/mafiaunban: To unban a user from the Mafia channel.",
            "/end: To cancel a Mafia game!",
            "/readlog: To read the log of actions from a previous game",
            "/targetlog: To read the log of Turn 1 actions from a set of previous games.",
            "/passma: To give your Mafia Admin powers to an alt of yours.",
            "/add: To add a Mafia Theme!",
            "/enable: To enable a disabled Mafia Theme!",
            "/disable: To disable a Mafia Theme!",
            "/enablenonpeak: To enable all non-peak Mafia Themes.",
            "/disablenonpeak: To disable all non-peak Mafia Themes."],
        sma: ["/push: To force a user into the current theme during sign ups.",
            "/remove: To remove a Mafia Theme!",
            "/mafiaadmin: To promote a user to Mafia Admin. Use /smafiaadmin for a silent promotion.",
            "/mafiaadminoff: To strip a user of all Mafia authority. Use /smafiaadminoff for a silent demotion.",
            "/updateafter: To update mafia after current game!",
            "/updatestats: To update the mafia stats webpage (Use after mafiastat script changes)",
            "/featuretheme: To change the currently featured theme (Leave blank to disable Feature Themes)",
            "/featuretext: To set a customizable message that follows the Featured theme (Leave blank to reset to default).",
            "/featurelink: To change the link used for Featured Theme Text. (Leave blank to clear)",
            "/featureint: To change how often the \"Featured Theme\" message displays. Time is in minutes between 30 and 240. Leave blank to reset to 60 minutes.",
            "/forcefeature: To force the \"Featured Theme\" message to display."],
        owner: ["/mafiasuperadmin: To promote a user to Super Mafia Admin. Use /smafiasuperadmin for a silent promotion.",
            "/mafiasuperadminoff: To demote a user from Super Mafia Admin. Use /smafiasuperadminoff for a silent demotion."]
    };
    this.handleCommand = function (src, message, channel) {
        var command;
        var commandData = '*';
        var pos = message.indexOf(' ');
        if (pos != -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (channel != mafiachan && ["mafiaban", "mafiaunban", "mafiabans", "mafiaadmins", "madmins", "mas", "roles", "priority", "sides", "themeinfo", "readlog", "targetlog", "disable", "enable", "enablenonpeak", "disablenonpeak", "mafiarules", "mafiaadminoff", "mafiaadmin", "mafiasadmin", "mafiasuperadmin", "mafiasuperadminoff", "smafiaadmin", "smafiasuperadmin", "smafiaadminoff", "smafiasuperadminoff", "passma", "windata", "topthemes", "updatestats", "playedgames", "pg"].indexOf(command) === -1)
            return;
        try {
            mafia.handleCommandOld(src, command, commandData, channel);
            return true;
        } catch (e) {
            if (e != "no valid command") {
                dualBroadcast("Error on mafia command: " + e + (e.lineNumber ? " on line " + e.lineNumber : ""));
                return true;
            }
        }
    };
    this.handleCommandOld = function (src, command, commandData, channel) {
        var name, x, player, target;
        var srcname = sys.name(src);
        if (this.state == "entry") {
            if (command == "join") {
                if (this.canJoin(src) !== true) {
                    return;
                }
                name = sys.name(src);
                if (this.signups.length >= this.theme["roles" + this.theme.roleLists].length){
                    gamemsg(srcname, "This theme only supports a maximum of " + this.theme["roles" + this.theme.roleLists].length + " players!");
                    return;
                }
                
                this.signups.push(name);
                this.ips.push(sys.ip(src));
                if (this.numjoins.hasOwnProperty(sys.ip(src))) {
                    this.numjoins[sys.ip(src)] += 1;
                }
                else {
                    this.numjoins[sys.ip(src)] = 1;
                }
                if (SESSION.users(src).smute.active) {
                    gamemsg(srcname, name + " joined the game!");
                    mafia.shoveUser(mafiabot.name, sys.name(src), true);
                } else {
                    gamemsgAll(name + " joined the game!");
                }
                if (name in this.usersToShove) {
                    var name = name;
                    var shover = this.usersToShove[name];
                    this.shoveUser(shover, name, false);
                    delete this.usersToShove[name];
                }
                if (this.signups.length == this.theme["roles" + this.theme.roleLists].length) {
                    dualBroadcast("±" + mafiabot.name + ": " + this.theme.name + " started " + this.ticks + " second" + (this.ticks == 1 ? "" : "s") + " early due to reaching capacity!");
                    this.ticks = 1;
                }
                return;
            }
            if (command == "unjoin") {
                if (this.isInGame(sys.name(src))) {
                    name = sys.name(src);
                    delete this.ips[this.ips.indexOf(sys.ip(src))];
                    this.signups.splice(this.signups.indexOf(name), 1);
                    gamemsgAll(name + " unjoined the game!");
                    return;
                } else {
                    gamemsg(srcname, "You haven't even joined!");
                    return;
                }
            }
        }
        else if (this.state == "night") {
            name = sys.name(src);
            if (this.isInGame(name) && this.hasCommand(name, command, "night")) {
                commandData = this.correctCase(commandData);
                player = mafia.players[name];
                if (commandData == '*' && ["OnlySelf"].indexOf(player.role.actions.night[command].target) !== -1) {
                    commandData = name;
                }
                else if (!this.isInGame(commandData)) {
                    gamemsg(srcname, "That person is not playing!", "Hint");
                    return;
                }
                target = mafia.players[commandData];
                var canTarget = player.role.actions.night[command].target;

                this.addPhaseStalkAction(name, command, target.name);

                if (["Any", "Self", "OnlySelf", "OnlyTeam"].indexOf(canTarget) == -1 && commandData == name) {
                    gamemsg(srcname, "Nope, this wont work... You can't target yourself!", "Hint");
                    return;
                } else if (canTarget == "OnlySelf" && commandData != name) {
                    gamemsg(srcname, "You can only use this action on yourself!", "Hint");
                    return;
                } else if (canTarget == 'AnyButTeam' && player.role.side == target.role.side
                 || canTarget == 'AnyButRole' && player.role.role == target.role.role) {
                    gamemsg(srcname, "Nope, this wont work... You can't target your partners!", "Hint");
                    return;
                } else if ((canTarget == "OnlyTeammates" && player == target)
                 || (["OnlyTeam", "OnlyTeammates"].indexOf(canTarget) !== -1 && player.role.side != target.role.side)) {
                    gamemsg(srcname, "You can only use this action on your teammates!", "Hint");
                    return;
                }

                var recharge = mafia.getRecharge(player, "night", command);
                if (recharge !== undefined && recharge > 0) {
                    gamemsg(srcname, "You cannot use this action for " + recharge + " night(s)!");
                    return;
                }
                var charges = mafia.getCharges(player, "night", command);
                if (charges !== undefined && charges === 0) {
                    gamemsg(srcname, "You are out of uses for this action!");
                    return;
                }
                if ((player.restrictions.indexOf(command) != -1) || (this.roleRestrictions[player.role.role] && this.roleRestrictions[player.role.role].indexOf(command) != -1) || (this.teamRestrictions[player.role.side] && this.teamRestrictions[player.role.side].indexOf(command) != -1)) {
                    gamemsg(srcname, "You cannot use this action during this night!");
                    return;
                }
                gamemsg(srcname, "You have chosen to " + command + " " + commandData + "!");
                this.setTarget(player, target, command);
                var team;
                var broadcast = player.role.actions.night[command].broadcast;
                var broadcastmsg = player.role.actions.night[command].broadcastmsg ? player.role.actions.night[command].broadcastmsg : "Your partner (~Player~) has decided to ~Action~ '~Target~'!";
                if (broadcast !== undefined) {
                    team = [];
                    if (broadcast == "team") {
                        team = this.getPlayersForTeam(player.role.side);
                    } else if (broadcast == "role") {
                        team = this.getPlayersForRole(player.role.role);
                    } else if (broadcast == "*" || broadcast == "all") {
                        broadcastmsg = player.role.actions.night[command].broadcastmsg ? player.role.actions.night[command].broadcastmsg : "The ~Role~ is going to ~Action~ ~Target~";
                        team = this.getPlayersForBroadcast();
                    } else if (Array.isArray(broadcast)) {
                        for (var z in mafia.players) {
                            if (broadcast.indexOf(mafia.players[z].role.role) != -1) {
                                team.push(mafia.players[z].name);
                            }
                        }
                    }
                    for (x in team) {
                        if (team[x] != name) {
                            gamemsg(team[x], broadcastmsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData).replace(/~Action~/, command).replace(/~Role~/, player.role.translation));
                        }
                    }
                }

                /* Hax-related to command */
                // some roles can get "hax" from other people using some commands...
                // however, roles can have avoidHax: ["kill", "distract"] in actions..
                if ("avoidHax" in player.role.actions && player.role.actions.avoidHax.indexOf(command) != -1) {
                    return;
                }
                var haxRoles = mafia.theme.getHaxRolesFor(command);
                var haxers = [], haxTypes;
                for (var i in haxRoles) {
                    var role = haxRoles[i];
                    var haxPlayers = this.getPlayersForRole(role);
                    for (var j in haxPlayers) {
                        var haxPlayer = haxPlayers[j];
                        haxTypes = [];
                        var r = Math.random();
                        var roleName = this.theme.trside(player.role.side);
                        team = this.getPlayersForRole(player.role.side);
                        var playerRole = this.theme.trrole(player.role.role);
                        if (r < mafia.theme.roles[role].actions.hax[command].revealTeam) {
                            if (team.length > 1) {
                                gamemsg(haxPlayer, "The " + roleName + " are going to " + command + " " + commandData + "!");
                            } else {
                                gamemsg(haxPlayer, "The " + roleName + " is going to " + command + " " + commandData + "!");
                            }
                            haxTypes.push("revealTeam");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealPlayer) {
                            if (team.length > 1) {
                                gamemsg(haxPlayer, name + " is one of The " + roleName + "!");
                            } else {
                                gamemsg(haxPlayer, name + " is The " + roleName + "!");
                            }
                            haxTypes.push("revealPlayer");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealRole) {
                            gamemsg(haxPlayer, name + " is " + playerRole + "!");
                            haxTypes.push("revealRole");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealTarget) {
                            gamemsg(haxPlayer, commandData + " is being targeted by " + an(command) + "!");
                        }
                        if (haxTypes.length > 0) {
                            haxers.push(haxPlayer + " [" + haxTypes.join("/") + "]");
                        }
                    }
                }
                if (haxers.length > 0) {
                    this.addPhaseStalkHax(name, command, target.name, haxers);
                }
                return;
            }
        }
        else if (this.state == "day") {
            if (this.isInGame(sys.name(src)) && command == "vote") {
                commandData = this.correctCase(commandData);
                var silentVote = mafia.theme.silentVote;
                name = sys.name(src);
                if (!this.isInGame(commandData)) {
                    gamemsg(srcname, "That person is not playing!");
                    return;
                }
                if (name in this.votes) {
                    gamemsg(srcname, "You already voted!");
                    return;
                }
                if (mafia.players[name].role.actions && mafia.players[name].role.actions.noVote === true) {
                    gamemsg(srcname, (mafia.players[name].role.actions.noVoteMsg ? mafia.players[name].role.actions.noVoteMsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData) : "You cannot vote!"));
                    this.votes[name] = null;
                    this.voteCount += 1;
                    return;
                }
                if (silentVote !== undefined && silentVote !== false) {
                    gamemsg(srcname, "You voted for " + commandData + "!");
                    gamemsgAll(name + " voted!");
                } else {
                    var votemsg = mafia.theme.votemsg ? mafia.theme.votemsg : "~Player~ voted for ~Target~!";
                    if ((votemsg.indexOf("~Target~") === -1) || (votemsg.indexOf("~Player~") === -1) )
                        gamemsg(srcname, "You voted for " + commandData + "!");
                    gamemsgAll(votemsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData));
                }
                this.addPhaseStalkAction(name, "vote", commandData);
                this.votes[sys.name(src)] = commandData;
                this.voteCount += 1;
                
                var noplur = false, totalPlayers = Object.keys(mafia.players).length;
                if (this.voteCount * 2 > totalPlayers && mafia.theme.noplur === true) {
                    var npvoted = {}, npvoters = {};
                    for (var pname in mafia.votes) {
                        var target = mafia.votes[pname];
                        if (!(target in npvoted)) {
                            npvoted[target] = 0;
                            npvoters[target] = [];
                        }
                        npvoted[target] += 1;
                        npvoters[target].push(pname);
                    }
                    var half = totalPlayers/2;
                    for (var x in npvoted) {
                        if ((npvoted[x] > half) || (half - npvoted[x] > totalPlayers - Object.keys(npvoters).length)) { //Checks if there is a majority or if one is no longer possible
                            noplur = true;
                            break;
                        }
                    }
                }

                if (this.voteCount == totalPlayers || noplur === true) {
                    mafia.ticks = 1;
                } else if (mafia.ticks < 8 && (mafia.theme.votesniping === undefined || mafia.theme.votesniping === false)) {
                    mafia.ticks = 8;
                }
                return;
            }
        }
        else if (mafia.state == "standby") {
            name = sys.name(src);
            if (this.isInGame(name) && this.hasCommand(name, command, "standby")) {
                player = mafia.players[name];
                commandData = this.correctCase(commandData);
                target = commandData != noPlayer ? mafia.players[commandData] : null;
                var commandObject = player.role.actions.standby[command];
                var commandName = command;
                if (commandObject.hasOwnProperty("command"))
                    command = commandObject.command;

                if (target !== null) {
                    if ((commandObject.target === undefined || ["Self", "Any"].indexOf(commandObject.target) == -1) && player == target) {
                        gamemsg(srcname, "Nope, this wont work... You can't target yourself!", "Hint");
                        return;
                    } else if (commandObject.target == 'AnyButTeam' && player.role.side == target.role.side
                        || commandObject.target == 'AnyButRole' && player.role.role == target.role.role) {
                        gamemsg(srcname, "Nope, this wont work... You can't target your partners!", "Hint");
                        return;
                    }
                }
                this.addPhaseStalkAction(name, command, commandData);

                var recharge = mafia.getRecharge(player, "standby", commandName);
                if (recharge !== undefined && recharge > 0) {
                    gamemsg(srcname, "You cannot use this action for " + recharge + " day(s)!");
                    return;
                }
                var charges = mafia.getCharges(player, "standby", commandName);
                if (charges !== undefined && charges === 0) {
                    gamemsg(srcname, "You are out of uses for this action!");
                    return;
                }
                var dayChargesMessage = function(player, commandName, action) {
                    if (mafia.getCharges(player, "standby", commandName) !== undefined) {
                        if (!mafia.isInGame(player)){
                            return;
                        }
                        var charge = mafia.getCharges(player, "standby", commandName);
                        var chargetxt = (action.chargesmsg || "You have ~Charges~ charges remaining").replace(/~Charges~/g, charge);
                        gamemsg(player.name, chargetxt);
                    }
                };
                
                
                if (command == "kill") {
                    if (player.dayKill >= (commandObject.limit || 1)) {
                        gamemsg(srcname, "You already killed!");
                        return;
                    }
                    if (target === null) {
                        gamemsg(srcname, "That person is not playing!");
                        return;
                    }
                    var revenge = false;
                    if (target.role.actions.hasOwnProperty("daykill")) {
                        if (target.role.actions.daykill == "evade") {
                            if (target.role.actions.daykillevademsg !== undefined && typeof target.role.actions.daykillevademsg == "string") {
                                gamemsg(srcname, target.role.actions.daykillevademsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData));
                                return;
                            } else {
                                gamemsg(srcname, "That person cannot be killed right now!");
                                return;
                            }
                        } else if (target.role.actions.daykill == "revenge" || target.role.actions.daykill == "bomb" || (typeof target.role.actions.daykill.mode == "object" && "revenge" in target.role.actions.daykill.mode && target.role.actions.daykill.mode.revenge.indexOf(player.role.role) != -1)) {
                            revenge = true;
                        } else if (typeof target.role.actions.daykill.mode == "object" && target.role.actions.daykill.mode.evadeChance > sys.rand(0, 100) / 100) {
                            if (player.role.actions.daykillmissmsg !== undefined && typeof player.role.actions.daykillmissmsg == "string") {
                                gamemsg(srcname, player.role.actions.daykillmissmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData));
                            } else {
                                gamemsg(srcname, "Your kill was evaded!");
                            }
                            if (target.role.actions.daykill.mode.evasionmsg !== undefined && typeof target.role.actions.daykill.mode.evasionmsg == "string") {
                                gamemsg(sys.id(target.name), target.role.actions.daykill.mode.evasionmsg.replace(/~Target~/g, name).replace(/~Self~/g, commandData));
                            } else {
                                gamemsg(sys.id(target.name), "You evaded a kill!");
                            }
                            player.dayKill = player.dayKill + 1 || 1;
                            if ("recharge" in commandObject) {
                                if (!(player.name in this.dayRecharges)) {
                                    this.dayRecharges[player.name] = {};
                                }
                                this.dayRecharges[player.name][commandName] = commandObject.recharge;
                            }
                            if (charges !== undefined) {
                                mafia.removeCharge(player, "standby", commandName);
                            }
                            dayChargesMessage(player, commandName, commandObject);
                            return;
                        } else if (typeof target.role.actions.daykill.mode == "object" && "ignore" in target.role.actions.daykill.mode && target.role.actions.daykill.mode.ignore.indexOf(player.role.role) != -1) {
                            var targetMode = target.role.actions.daykill;
                            if (targetMode.expend === true) {
                                player.dayKill = player.dayKill + 1 || 1;
                            }
                            if (targetMode.silent !== true) {
                                var pmsg = (targetMode.msg || "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = (targetMode.targetmsg || "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
                                gamemsg(player.name, pmsg);
                                gamemsg(target.name, tmsg);
                                return;
                            }
                            return;
                        }
                    }
                    sendChanAll(border, mafiachan);
                    if (!revenge) {
                        gamemsgAll(commandObject.killmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData).replace(/~Role~/g, mafia.players[name].role.translation).replace(/~TargetRole~/g, mafia.players[commandData].role.translation));
                        if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0, 100) / 100) {
                            var rmsg = (commandObject.revealmsg || "While attacking, ~Self~ (~Role~) made a mistake and was revealed!").replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation);
                            gamemsgAll(rmsg);
                        }
                        if ("daykill" in target.role.actions && target.role.actions.daykill === "revealkiller") {
                            var dkr = (target.role.actions.daykillrevengemsg || "Before dying, ~Self~ revealed that ~Target~ is the ~Role~!").replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Role~/g, mafia.players[name].role.translation).replace(/~Side~/g, mafia.theme.trside(mafia.players[name].role.side));
                            gamemsgAll(dkr);
                        }
                        player.dayKill = player.dayKill + 1 || 1;
                        if (sys.id('PolkaBot') !== undefined) {
                            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+target.name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[commandData]);
                    } else {
                        var rmsg = (target.role.actions.daykillrevengemsg ||
                        "~Target~ tries to attack ~Self~, but ~Self~ fights back and kills ~Target~!").replace(/~Self~/g, commandData).replace(/~Target~/g, name);
                        gamemsgAll(rmsg);
                        
                        if (sys.id('PolkaBot') !== undefined) {
                            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[name]);
                        if (target.role.actions.daykill === "bomb") {
                            this.kill(mafia.players[commandData]);
                            if (sys.id('PolkaBot') !== undefined) {
                                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+commandData+" DIED", mafiachan);
                            }
                        }
                    }
                    
                    this.onDeadRoles();
                    
                    if (this.testWin()) {
                        return;
                    }
                    sendChanAll(border, mafiachan);
                } else if (command == "reveal") {
                    if (player.revealUse >= (commandObject.limit || 1)) {
                        gamemsg(srcname, "You already used this command!");
                        return;
                    }
                    var revealMessage = (commandObject.revealmsg || "~Self~ is revealed to be a ~Role~!").replace(/~Self~/g, name).replace(/~Role~/g, player.role.translation);
                    sendChanAll(border, mafiachan);
                    gamemsgAll(revealMessage);
                    sendChanAll(border, mafiachan);
                    player.revealUse = player.revealUse + 1 || 1;
                } else if (command == "expose") {
                    if (player.exposeUse >= (commandObject.limit || 1)) {
                        gamemsg(srcname, "You already used this command!");
                        return;
                    }
                    if (target === null) {
                        gamemsg(srcname, "That person is not playing!");
                        return;
                    }
                    var revenge = false;
                    if (target.role.actions.hasOwnProperty("expose")) {
                        if (target.role.actions.expose == "evade") {
                            var eemsg = (target.role.actions.exposeevademsg || "That person cannot be exposed right now!").replace(/~Self~/g, name).replace(/~Target~/g, commandData);
                            gamemsg(srcname, eemsg);
                        } else if (target.role.actions.expose == "revenge" || (typeof target.role.actions.expose.mode == "object" && "revenge" in target.role.actions.expose.mode && target.role.actions.expose.mode.revenge.indexOf(player.role.role) != -1)) {
                            revenge = true;
                        } else if (typeof target.role.actions.expose.mode == "object" && target.role.actions.expose.mode.evadeChance > sys.rand(0, 100) / 100) {
                            var emmsg = (player.role.actions.exposemissmsg || "Your ~Action~ was evaded!").replace(/~Self~/g, name).replace(/~Target~/g, commandData).replace(/~Action~/g, commandName);
                            var emsg = (target.role.actions.expose.mode.evasionmsg || "You evaded an expose!").replace(/~Target~/g, name).replace(/~Self~/g, commandData);
                            gamemsg(srcname, emmsg);
                            gamemsg(sys.id(target.name), emsg);
                            player.exposeUse = player.exposeUse + 1 || 1;
                            if ("recharge" in commandObject) {
                                if (!(player.name in this.dayRecharges)) {
                                    this.dayRecharges[player.name] = {};
                                }
                                this.dayRecharges[player.name][commandName] = commandObject.recharge;
                            }
                            if (charges !== undefined) {
                                mafia.removeCharge(player, "standby", commandName);
                            }
                            dayChargesMessage(player, commandName, commandObject);
                            return;
                        } else if (typeof target.role.actions.expose.mode == "object" && "ignore" in target.role.actions.expose.mode && target.role.actions.expose.mode.ignore.indexOf(player.role.role) != -1) {
                            var targetMode = target.role.actions.expose;
                            if (targetMode.expend === true) {
                                player.exposeUse = player.exposeUse + 1 || 1;
                            }
                            if (targetMode.silent !== true) {
                                var pmsg = (targetMode.msg || "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = (targetMode.targetmsg || "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
                                gamemsg(player.name, pmsg);
                                gamemsg(target.name, tmsg);
                                return;
                            }
                            return;
                        }
                    }
                    var exposeMessage = (commandObject.exposemsg || "~Self~ revealed that ~Target~ is the ~Role~!");
                    var exposeTargetMessage = commandObject.exposedtargetmsg;
                    var inspectMode = target.role.actions.inspect || {};
                    var revealedRole;
                    var revealedSide;
                    if (inspectMode.revealAs !== undefined) {
                        if (typeof inspectMode.revealAs == "string") {
                            if (inspectMode.revealAs == "*") {
                                var rr = 1;
                                while (mafia.signups.length > mafia.theme["roles" + rr].length) {
                                    ++rr;
                                }
                                var rrole = mafia.theme["roles" + rr].slice(0, mafia.signups.length);
                                revealedRole = mafia.theme.trrole(rrole[Math.floor(Math.random() * rrole.length)]);
                            } else {
                                revealedRole = mafia.theme.trrole(inspectMode.revealAs);
                            }
                        } else if (Array.isArray(inspectMode.revealAs)) {
                            revealedRole = mafia.theme.trrole(inspectMode.revealAs[Math.floor(Math.random() * inspectMode.revealAs.length)]);
                        }
                    } else {
                        revealedRole = target.role.translation;
                    }
                    if (typeof inspectMode.seenSide == "string" && inspectMode.seenSide in mafia.theme.sideTranslations) {
                        revealedSide = mafia.theme.trside(inspectMode.seenSide);
                    } else {
                        revealedSide = mafia.theme.trside(target.role.side);
                    }
                    sendChanAll(border, mafiachan);
                    gamemsgAll(exposeMessage.replace(/~Self~/g, name).replace(/~Target~/g, target.name).replace(/~Role~/g, revealedRole).replace(/~Side~/g, revealedSide));
                    if (!revenge) {
                        if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0, 100) / 100) {
                            var rmsg = (commandObject.revealmsg || "While exposing, ~Self~ (~Role~) made a mistake and was revealed!").replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation);
                            gamemsgAll(rmsg);
                        }
                        if ("expose" in target.role.actions && target.role.actions.expose == "revealexposer") {
                            var remsg = (target.role.actions.revealexposermsg || "However, ~Self~ revealed that ~Target~ is the ~Role~!").replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Role~/g, mafia.players[name].role.translation);
                            gamemsgAll(remsg);
                        }
                        if (target.role.actions.expose == "die") {
                            var diemsg = (target.role.actions.exposediemsg || "~Self~ could not live with being exposed to everyone and killed themselves!").replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Action~/g, commandName);
                            gamemsgAll(diemsg);
                            this.kill(mafia.players[commandData]);
                            if (sys.id('PolkaBot') !== undefined) {
                                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+commandData+" DIED", mafiachan);
                            }
                            
                        }
                        player.exposeUse = player.exposeUse + 1 || 1;
                        
                    } else {
                        var ermsg = (target.role.actions.exposerevengemsg || "~Target~ (~Role~) tries to expose, but their target gets startled and kills them in retaliation!").replace(/~Self~/g, commandData).replace(/~Target~/g, name).replace(/~Role~/g, player.role.translation);
                        gamemsgAll(ermsg);
                        
                        if (sys.id('PolkaBot') !== undefined) {
                            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[name]);
                    }
                    
                    if ("exposedtargetmsg" in commandObject && typeof commandObject.exposedtargetmsg == "string") {
                        gamemsg(srcname, exposeTargetMessage.replace(/~Role~/g, revealedRole).replace(/~Target~/g, commandData));
                    }
                    sendChanAll(border, mafiachan);
                    //player.exposeUse = player.exposeUse + 1 || 1;
                }
                if ("recharge" in commandObject) {
                    if (!(player.name in this.dayRecharges)) {
                        this.dayRecharges[player.name] = {};
                    }
                    this.dayRecharges[player.name][commandName] = commandObject.recharge;
                }
                if (charges !== undefined) {
                    mafia.removeCharge(player, "standby", commandName);
                }
                dayChargesMessage(player, commandName, commandObject);
                
                /* Hax-related to command */
                // some roles can get "hax" from other people using some commands...
                // however, roles can have avoidStandbyHax: ["kill", "reveal"] in actions..
                if ("avoidStandbyHax" in player.role.actions && player.role.actions.avoidStandbyHax.indexOf(commandName) != -1) {
                    return;
                }
                var haxRoles = mafia.theme.getStandbyHaxRolesFor(commandName);
                var haxers = [], haxTypes;
                for (var i in haxRoles) {
                    var role = haxRoles[i];
                    var haxPlayers = this.getPlayersForRole(role);
                    for (var j in haxPlayers) {
                        var haxPlayer = haxPlayers[j];
                        haxTypes = [];
                        var r = Math.random();
                        var roleName = this.theme.trside(player.role.side);
                        var team = this.getPlayersForRole(player.role.side);
                        var playerRole = this.theme.trrole(player.role.role);
                        if (r < mafia.theme.roles[role].actions.standbyHax[commandName].revealTeam) {
                            gamemsg(haxPlayer, "The " + roleName + " used " + commandName + " on " + commandData + "!");
                            haxTypes.push("revealTeam");
                        }
                        if (r < mafia.theme.roles[role].actions.standbyHax[commandName].revealPlayer) {
                            if (team.length > 1) {
                                gamemsg(haxPlayer, name + " is one of The " + roleName + "!");
                            } else {
                                gamemsg(haxPlayer, name + " is The " + roleName + "!");
                            }
                            haxTypes.push("revealPlayer");
                        }
                        if (r < mafia.theme.roles[role].actions.standbyHax[commandName].revealRole) {
                            gamemsg(haxPlayer, name + " is " + playerRole + "!");
                            haxTypes.push("revealRole");
                        }
                        if (haxTypes.length > 0) {
                            haxers.push(haxPlayer + " [" + haxTypes.join("/") + "]");
                        }
                    }
                }
                if (haxers.length > 0) {
                    this.addPhaseStalkHax(name, command, commandData, haxers);
                }
                return;
            }
        }
        if (command === "tt" || command === "teamtalk") {
            if (mafia.isInGame(sys.name(src)) && ["night", "day", "standby"].indexOf(mafia.state) !== -1)  {
                name = sys.name(src);
                player = mafia.players[name];
                if (player.role.actions && "teamTalk" in player.role.actions) {
                    var partners = [];
                    if (Array.isArray(player.role.actions.teamTalk)) {
                        for (x in player.role.actions.teamTalk) {
                            partners = partners.concat(mafia.getPlayersForRole(player.role.actions.teamTalk[x]));
                        }
                        partners.push(name);
                        partners = removeDuplicates(partners);
                    } else {
                        partners = mafia.getPlayersForTeam(player.role.side);
                    }
                    for (x in partners) {
                        gamemsg(partners[x], name + ": [Team] " + commandData);
                    }
                    return;
                }
            }
        }
        if (command === "vote" || command === "votetheme") {
            mafia.userVote(src, commandData);
            return;
        }
        if (command === "start" || command === "starttheme") {
            mafia.startGame(src, commandData);
            return;
        }
        if (command === "help") {
            if (commandData == "commands") {
                var helpcommands = [
                "*** *********************************************************************** ***",
                "±Game: Commands can have a custom name but you will be told what the command does if it does have a different name than below.",
                "*** *********************************************************************** ***",
                "±Command: Inspect",
                "±Explanation: Allows the user to find out the role of the person they target.",
                "*** *********************************************************************** ***",
                "±Command: Protect",
                "±Explanation: Allows the user keep their target from being killed.",
                "*** *********************************************************************** ***",
                "±Command: Kill",
                "±Explanation: Kills the target taking them out of the game.",
                "*** *********************************************************************** ***",
                "±Command: Poison",
                "±Explanation: Causes the target to die a specific number of days later. Different for each theme.",
                "*** *********************************************************************** ***",
                "±Command: Safeguard",
                "±Explanation: Allows the user to keep their target from getting poisoned, inspected, converted, cursed, stalked, and copied.",
                "*** *********************************************************************** ***",
                "±Command: Distract",
                "±Explanation: Allows the user to stop their target from performing their action at night.",
                "*** *********************************************************************** ***",
                "±Command: Stalk",
                "±Explanation: Allows the user to find out who their target visited at night.",
                "*** *********************************************************************** ***",
                "±Command: Convert",
                "±Explanation: Allows the user to change the role of their target.",
                "*** *********************************************************************** ***",
                "±Command: Expose",
                "±Explanation: Allows the user to tell everyone in the game their targets role.",
                "*** *********************************************************************** ***",
                "±Command: Reveal",
                "±Explanation: Allows the user to tell everyone in the game their role.",
                "*** *********************************************************************** ***",
                "±Command: Curse",
                "±Explanation: Allows the user to make the target changed roles in a certain number of days.  The number of days is different in each theme.",
                "*** *********************************************************************** ***",
                "±Command: Copy",
                "±Explanation: Allows the user to convert based on the target's role. Example: Kirby.",
                "*** *********************************************************************** ***",
                ""
                ];
                dump(src, helpcommands);
            }
            else if (commandData == "roles") {
                var helproles = [
                "*** *********************************************************************** ***",
                "±Game: Not all roles are named what is below but they are all based off of them.",
                "±Game: Power Roles, or PRs, are what people say when they are talking about any non-villager role on the village's side.",
                "*** *********************************************************************** ***",
                "±Role: Villager",
                "±Explanation: This role doesn't do anything special. It is just able to vote during the day.",
                "*** *********************************************************************** ***",
                "±Role: Inspector",
                "±Explanation: This role is able to use the inspect command to find someone's role.",
                "*** *********************************************************************** ***",
                "±Role: Vigilante",
                "±Explanation: This role is able to kill someone at night.",
                "*** *********************************************************************** ***",
                "±Role: Bodyguard",
                "±Explanation: This role is able to use the protect command to stop your target from getting killed.  Often referred to as the BG.",
                "*** *********************************************************************** ***",
                "±Role: Spy",
                "±Explanation: This role is able to get hax on commands. This means they are sometimes able to tell who is getting killed and if lucky get to see who is killing.",
                "*** *********************************************************************** ***",
                "±Role: Mayor",
                "±Explanation: This role has a vote higher than 1 allowing them a greater influence in the voting phase.",
                "*** *********************************************************************** ***",
                "±Role: Hooker",
                "±Explanation: This role is able to use the distract command to stop their target from doing their night action.  Often referred to as the PL.",
                "*** *********************************************************************** ***",
                "±Role: Safeguarder",
                "±Explanation: This role is able to use the safeguard command to stop their target from being poisoned, inspected, stalked, converted, copied and cursed.",
                "*** *********************************************************************** ***",
                "±Role: Poisoner",
                "±Explanation: This role is able to use the poison command to cause their target to die a certain number of days later.",
                "*** *********************************************************************** ***",
                "±Role: Stalker",
                "±Explanation: This role is able to use the stalk command to find out who their target visited.",
                "*** *********************************************************************** ***",
                "±Role: Converter",
                "±Explanation: This role is able to use the convert command to change the role of their target.",
                "*** *********************************************************************** ***",
                "±Role: Curser",
                "±Explanation: This role is able to use the curse command to change their target to a different role in a certain number of days.",
                "*** *********************************************************************** ***",
                "±Role: Samurai",
                "±Explanation: This role is able to use the kill command during the day.",
                "*** *********************************************************************** ***",
                "±Role: Exposer",
                "±Explanation: This role is able to use the expose command to reveal the role of their target to the whole game.",
                "*** *********************************************************************** ***",
                "±Role: WereWolf",
                "±Explanation: This role is able to use the kill command and bypasses protect.  Often referred to as the WW.",
                "*** *********************************************************************** ***",
                "±Role: Bomb",
                "±Explanation: This role kills the person who killed them.",
                "*** *********************************************************************** ***",
                ""
                ];
                dump(src, helproles);
            }
            else if (commandData == "hints") {
                var helphints = [
                "*** *********************************************************************** ***",
                "±Hint: When you are mafia if your teammate is guaranteed to be voted out you are allowed to vote them so you don't look suspicious.",
                "±Hint: In general if you are the inspector it is a good idea to claim so that you can be protected.",
                "±Hint: When you find your teammates it is a good idea to PM them so you remember who they are and so you can talk strategy.",
                "±Hint: Don't claim as a villager because it exposes the Power Roles.",
                "±Hint: Don't stay to quiet because the people who are silent tend to be voted out a lot.",
                "±Hint: A rand is when someone choses who to vote/kill randomly with no real logic behind it.",
                "±Hint: Communication with your team is the key to victory.",
                "*** *********************************************************************** ***",
                ""
                ];
                dump(src, helphints);
            }
            else {
                var help = [
                "*** *********************************************************************** ***",
                "Type /help commands to get an explanation about what each mafia command does.",
                "Type /help roles to get an outline of the most common roles in mafia.",
                "Type /help hints to get advice that will help you do better in mafia games.",
                "*** *********************************************************************** ***"
            ];
                dump(src, help);
            }
            return;
        }
        if (command === "roles") {
            var themeName = "default";
            var data = commandData.split(":");
            if (mafia.state != "blank" && mafia.state != "voting") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (data[0] != noPlayer && data[0] !== "") {
                themeName = data[0].toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    gamemsg(srcname, "No such theme!", false, channel);
                    return;
                }
            }
            var roles = mafia.themeManager.themes[themeName].roleInfo;
            if (data[1]) {
                var sep = "*** *********************************************************************** ***";
                var filterRoles = [sep];
                var roleTranslation = data[1].toLowerCase();
                for (var i = 0; i < roles.length; ++i) {
                    if (roles[i].search(/±role:/i) > -1 && roles[i].toLowerCase().search(roleTranslation) > -1) {
                        filterRoles.push(roles[i]);
                        filterRoles.push(roles[i + 1]);
                        if (roles[i + 2].substr(0, 9) === "±Players:") {
                            filterRoles.push(roles[i + 2]);
                        }
                        filterRoles.push(sep);
                    }
                }
                if (filterRoles.length == 1) {
                    filterRoles.push("±Game: No such role in this theme!");
                    filterRoles.push(sep);
                }
                filterRoles.push("");
                roles = filterRoles;
            }
            dump(src, roles, channel);
            return;
        }
        if (command === "sides") {
            var themeName = "default";
            if (mafia.state != "blank" && mafia.state != "voting") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    gamemsg(srcname, "No such theme!", false, channel);
                    return;
                }
            }
            var sides = mafia.themeManager.themes[themeName].sideInfo;
            dump(src, sides, channel);
            return;

        }
        if (command === "myrole") {
            mafia.showOwnRole(src);
            return;
        }
        if (command === "mafiarules") {
            mafia.showRules(src, channel);
            return;
        }
        if (command === "themes") {
            var l = [];
            for (var t in mafia.themeManager.themes) {
                l.push(casedtheme(t));
            }
            msg(src, "Installed themes are: " + l.join(", "));
            return;
        }
        if (command === "themeinfo") {
            var data = commandData.toLowerCase();
            mafia.themeManager.themeInfo.sort(function (a, b) { return a[0].localeCompare(b[0]); });
            var mess = [];
            mess.push("<table><tr><th>Theme</th><th>URL</th><th>Author</th><th>Enabled</th></tr>");
            for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
                var info = mafia.themeManager.themeInfo[i];
                var theme = mafia.themeManager.themes[info[0].toLowerCase()];
                if (!theme) continue;
                if (data == noPlayer || data.indexOf(theme.name.toLowerCase()) != -1) {
                    mess.push('<tr><td>' + theme.name + '</td><td><a href="' + info[1] + '">' + info[1] + '</a></td><td>' + (theme.author ? readable(theme.author, "and") : "Unknown") + '</td><td>' + (theme.enabled ? "Yes" : "No") + '</td></tr>');
                }
            }
            mess.push("</table>");
            sys.sendHtmlMessage(src, mess.join(""), channel);
            return;
        }
        if (command === "changelog") {
            var themeName = "default";
            if (mafia.state != "blank" && mafia.state != "voting") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    gamemsg(srcname, "No such theme!");
                    return;
                }
            }

            var theme = mafia.themeManager.themes[themeName];
            if (!theme.changelog) {
                gamemsg(srcname, theme.name + " doesn't have a changelog!");
                return;
            }

            sys.sendMessage(src, "", mafiachan);
            gamemsg(srcname, theme.name + "'s changelog: ");

            if (Array.isArray(theme.changelog)) {
                theme.changelog.forEach(function (line) {
                    sys.sendMessage(src, line, mafiachan);
                });
            } else if (typeof theme.changelog === "object") {
                for (var x in theme.changelog) {
                    sys.sendMessage(src, x + ": " + theme.changelog[x], mafiachan);
                }
            }

            sys.sendMessage(src, "", mafiachan);
            return;
        }
        if (command === "details") {
            var themeName = "default";
            if (mafia.state != "blank" && mafia.state != "voting") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    gamemsg(srcname, "No such theme!");
                    return;
                }
            }
            var theme = mafia.themeManager.themes[themeName];
            var link = "No link found";
            for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
                if (mafia.themeManager.themeInfo[i][0].toLowerCase() == themeName) {
                    link = mafia.themeManager.themeInfo[i][1];
                    break;
                }
            }
            var mess = [];
            mess.push("");
            mess.push("<b>Theme: </b>" + theme.name + (theme.altname ? "<i> (" + theme.altname + ")</i>" : "" ));
            mess.push("<b>Author: </b>" + (theme.author ? readable(theme.author, "and") : "Unknown"));
            mess.push("<b>Enabled: </b>" + (theme.enabled ? "Yes" : "No"));
            mess.push("<b>Number of Players: </b>" + (theme.minplayers === undefined ? "5" : theme.minplayers) + " to " + (theme["roles" + theme.roleLists].length) + " players");
            if (theme.threadlink) {
                mess.push('<b>Thread Link: </b><a href="' + theme.threadlink + '">' + theme.threadlink + '</a>');
            }
            mess.push("<b>Summary: </b>" + (theme.summary ? theme.summary : "No summary available."));
            
            var features = [];
            if (theme.nolynch === true) {
                features.push("-No Voting Phase");
            } else {
                if (theme.votesniping === true) {
                    features.push("-Vote Sniping");
                }
                if (theme.silentVote === true) {
                    features.push("-Silent Vote");
                }
            }
            if (theme.ticks !== undefined) {
                if (theme.ticks.night !== undefined && theme.ticks.night != 30) {
                    features.push("-Night Phase: " + theme.ticks.night + " seconds");
                }
                if (theme.ticks.standby !== undefined && theme.ticks.standby != 30) {
                    features.push("-Standby Phase: " + theme.ticks.standby + " seconds");
                }
            }
            if (features.length > 0) {
                mess.push("<b>Special Features:</b>");
                for (i = 0; i < features.length; ++i) {
                    mess.push(features[i]);
                }
            }
            
            mess.push("(For more information about this theme, type <b>/roles " + theme.name + "</b>, <b>/sides " + theme.name + "</b>, <b>/priority " + theme.name + "</b> and <b>/changelog " + theme.name + "</b>)");
            if (link == "No link found") {
                mess.push('<b>Code: </b>' + link);
            } else {
                mess.push('<b>Code: </b><a href="' + link + '">' + link + '</a>');
            }
            mess.push("");
            for (var x in mess) {
                sys.sendHtmlMessage(src, mess[x], mafiachan);
            }
            return;
        }
        if (command === "priority") {
            var themeName = "default";
            if (mafia.state != "blank" && mafia.state != "voting") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    gamemsg(srcname, "No such theme!", false, channel);
                    return;
                }
            }
            var theme = mafia.themeManager.themes[themeName];
            sys.sendMessage(src, "", channel);
            sys.sendHtmlMessage(src, "Priority List for theme <b>" + html_escape(theme.name) + ":</b>", channel);
            for (var p = 0; p < theme.priorityInfo.length; ++p) {
                sys.sendHtmlMessage(src, html_escape(theme.priorityInfo[p]), channel);
            }
            sys.sendMessage(src, "", channel);
            return;
        }
        if (command === "flashme") {
            var user = SESSION.users(src);
            var data = commandData.split(":");
            var action = data[0].toLowerCase();
            var t; // loop index
            var themeName; // loop variable
            if (action == "on") {
                msg(src, "Alert for mafia games is now on!");
                user.mafiaalertson = true;
                script.saveKey("mafiaalertson", src, true);
                if (user.mafiaalertsany === undefined) {
                    user.mafiaalertsany = true;
                    msg(src, "You will get alerts for any theme. To only receive alerts for specific themes, use /flashme add:theme name");
                    script.saveKey("mafiaalertsany", src, user.mafiaalertsany);
                }
                return;
            }
            else if (action == "off") {
                msg(src, "Alert for mafia games is now off!");
                user.mafiaalertson = false;
                script.saveKey("mafiaalertson", src, false);
                return;
            }
            else if (action == "any") {
                user.mafiaalertsany = !user.mafiaalertsany;
                msg(src, "You'll get alerts for " + (user.mafiaalertsany ? "any theme" : "specific themes only") + "!");
                script.saveKey("mafiaalertsany", src, user.mafiaalertsany);
                return;
            }
            else if (action == "add") {
                var themesAdded = [];
                var themesNotAdded = [];
                var repeatedThemes = [];
                for (t = 1; t < data.length; ++t) {
                    themeName = data[t].toLowerCase();
                    if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                        themesNotAdded.push(themeName);
                        continue;
                    }
                    if (user.mafiathemes === undefined) {
                        user.mafiathemes = [];
                    }
                    if (user.mafiathemes.indexOf(themeName) != -1) {
                        repeatedThemes.push(themeName);
                        continue;
                    }
                    themesAdded.push(themeName);
                    user.mafiathemes.push(themeName);
                }
                if (themesAdded.length > 0) {
                    msg(src, "Added alert for the themes: " + readable(themesAdded, "and") + ". ");
                    script.saveKey("mafiathemes", src, user.mafiathemes.join("*"));
                    
                    user.mafiaalertsany = false;
                    msg(src, "You will get alerts for specific themes only. To only receive alerts for any theme, use /flashme any.");
                    script.saveKey("mafiaalertsany", src, user.mafiaalertsany);
                }
                if (repeatedThemes.length > 0) {
                    msg(src, "You already have alerts for the themes: " + readable(repeatedThemes, "and") + ". ");
                }
                if (themesNotAdded.length > 0) {
                    msg(src, "Couldn't add alert for the themes: " + readable(themesNotAdded, "and") + ". ");
                }
                return;
            }
            else if (action == "remove") {
                if (user.mafiathemes === undefined || user.mafiathemes.length === 0) {
                    msg(src, "You have no alerts to remove!");
                    return;
                }
                var themesRemoved = [];
                var themesNotRemoved = [];
                for (t = 1; t < data.length; ++t) {
                    themeName = data[t].toLowerCase();
                    if (user.mafiathemes.indexOf(themeName) != -1) {
                        user.mafiathemes.splice(user.mafiathemes.indexOf(themeName), 1);
                        themesRemoved.push(themeName);
                    } else {
                        themesNotRemoved.push(themeName);
                    }
                }
                if (themesRemoved.length > 0) {
                    msg(src, "Removed alert for the themes: " + readable(themesRemoved, "and") + ". ");
                    script.saveKey("mafiathemes", src, user.mafiathemes.join("*"));
                }
                if (themesNotRemoved.length > 0) {
                    msg(src, "Couldn't remove alert for the themes: " + readable(themesNotRemoved, "and") + ". ");
                }
                return;
            }
            else if (action == "help") {
                var mess = [
                    "",
                    "<b>How to use the Flash Me:</b>",
                    "Type <b>/flashme</b> to see your current alerts.",
                    "Type <b>/flashme on</b> or <b>/flashme off</b> to turn your alerts on or off.",
                    "Type <b>/flashme any</b> to receive alerts for any new mafia game. Type again to receive alerts for specific themes.",
                    "Type <b>/flashme add:theme1:theme2</b> to add alerts for specific themes.",
                    "Type <b>/flashme remove:theme1:theme2</b> to remove alerts you added.",
                    ""
                ];
                for (var x in mess) {
                    sys.sendHtmlMessage(src, mess[x], mafiachan);
                }
            }
            else {
                if (!user.mafiaalertson) {
                    msg(src, "You currently have /flashme deactivated (you can enable it by typing /flashme on).");
                } else if (user.mafiaalertsany) {
                    msg(src, "You currently get alerts for any theme. ");
                } else if (user.mafiathemes === undefined || user.mafiathemes.length === 0) {
                    msg(src, "You currently have no alerts for mafia themes activated.");
                } else {
                    msg(src, "You currently get alerts for the following themes: " + readable(user.mafiathemes.sort(), "and") + ". ");
                }
                msg(src, "To learn how to set alerts, type /flashme help");
            }
            return;
        }
        if (command === "playedgames" || command === "pg") {
            var mess = [];
            mess.push("<table><tr><th>Theme</th><th>Who started</th><th>When</th><th>Players</th></tr>");
            var recentGames = PreviousGames.slice(-10);
            var t = parseInt(sys.time(), 10);
            for (var i = 0; i < recentGames.length; ++i) {
                var game = recentGames[i];
                mess.push('<tr><td>' + casedtheme(game.what) + '</td><td>' + game.who + '</td><td>' + getTimeString(t - game.when) + ' ago </td><td>' + game.playerCount + '</td></tr>');
            }
            mess.push("</table>");
            sys.sendHtmlMessage(src, mess.join(""), channel);
            return;
        }
        if (command === "topthemes") {
            mafia.mafiaStats.getTopThemes(src, channel, commandData);
            return;
        }
        if (command === "windata") {
            var themeName;
            if (commandData === noPlayer) {
                themeName = "default";
                if (mafia.state != "blank" && mafia.state != "voting") {
                    themeName = mafia.theme.name.toLowerCase();
                }
            } else {
                themeName = commandData.toLowerCase();
            }
            if (mafia.themeManager.themes[themeName]) {
                mafia.mafiaStats.getWinData(src, channel, casedtheme(themeName));
                return;
            } else {
                msg(src, commandData + " is not a theme", channel);
            }
            return;
        }
        if (command === "update" || command === "supdate") {
            /*Silent Update to be used for mass adding themes after crash
             *Restricted to sMA because the command allows for silently adding themes as well*/
            var sup = command === "supdate";
            if (sup && !this.isMafiaSuperAdmin(src)) {
                msg(src, "You must be Super Mafia Admin to silently add or update themes.");
                return;
            }
            var url = commandData, name = commandData;
            if (commandData.indexOf("::") >= 0) {
                var parts = url.split("::");
                name = parts[0];
                url = parts[1];
            }
            var theme = mafia.themeManager.themes[name.toLowerCase()];
            // theme.author can be either string or Array of strings
            var authorMatch = theme !== undefined && (typeof theme.author == "string" && theme.author.toLowerCase() == sys.name(src).toLowerCase() || Array.isArray(theme.author) && theme.author.map(function (s) { return s.toLowerCase(); }).indexOf(sys.name(src).toLowerCase()) >= 0);

            if (!mafia.isMafiaAdmin(src) && !authorMatch) {
                msg(src, "You need to be admin or the author of this theme.");
                return;
            }
            var dlurl;
            if (url.substr(0, 7) != "http://" && url.substr(0, 8) != "https://") {
                for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
                    if (mafia.themeManager.themeInfo[i][0].toLowerCase() == name.toLowerCase()) {
                        dlurl = mafia.themeManager.themeInfo[i][1];
                        break;
                    }
                }
            } else {
                dlurl = url;
            }
            msg(src, "Download url: " + dlurl);
            if (dlurl) {
                mafia.themeManager.loadWebTheme(dlurl, (sup ? false : true), true, authorMatch ? theme.name.toLowerCase() : null, src, false);
            }
            return;
        }
        if (command === "join") {
            gamemsg(srcname, "You can't join now!");
            return;
        }
        if (command === "featured") {
            sys.sendMessage(src, GREEN_BORDER, mafiachan);
            if (featuredTheme) {
                sys.sendHtmlMessage(src, "<font color=#3daa68><timestamp/> <b>±" + mafiabot.name + ": </b></font> Looking for a theme to play? Try out the Featured Theme: <b>" + casedtheme(featuredTheme) + "</b>!", mafiachan);
            }
            sys.sendHtmlMessage(src, "<font color=#3daa68><timestamp/> <b>±" + mafiabot.name + ": </b></font> " + (featuredLink ? '<a href="' + html_escape(featuredLink) + '">' + featuredText + '</a>' : featuredText), mafiachan);
            sys.sendMessage(src, GREEN_BORDER, mafiachan);
            return;
        }
        if (command === "mafiaadmins" || command === "madmins" || command ===  "mas") {
            var smas = [];
            for (var y in script.mafiaSuperAdmins.hash) {
                smas.push(y);
            }
            smas = smas.sort();
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** MAFIA SUPER ADMINS ***", channel);
            for (var i = 0; i < smas.length; i++) {
                var id = sys.id(smas[i]);
                if (!id) {
                    sys.sendMessage(src, smas[i], channel);
                }
                else {
                    sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
                }
            }
            var mas = [];
            for (var x in script.mafiaAdmins.hash) {
                mas.push(x);
            }
            mas = mas.sort();
            if (script.hasAuthElements(mas)) {
                sys.sendMessage(src, "", channel);
                sys.sendMessage(src, "*** AUTH MAFIA ADMINS ***", channel);
                for (var i = 0; i < mas.length; i++) {
                    if (sys.dbAuths().indexOf(mas[i]) != -1) {
                        var id = sys.id(mas[i]);
                        if (!id) {
                            sys.sendMessage(src, mas[i], channel);
                        }
                        else {
                            sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
                        }
                        mas.splice(i, 1);
                        i--;
                    }
                }
            }
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** MAFIA ADMINS ***", channel);
            for (var i = 0; i < mas.length; i++) {
                var id = sys.id(mas[i]);
                if (!id) {
                    sys.sendMessage(src, mas[i], channel);
                }
                else {
                    sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
                }
            }
            sys.sendMessage(src, "", channel);
            return;
        }

        if (!this.isMafiaAdmin(src) && !this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        var tar = sys.id(commandData);
        if (command === "slay") {
            this.slayUser(src, commandData);
            return;
        }
        if (command === "shove") {
            this.shoveUser(src, commandData);
            return;
        }
        if (command === "end") {
            mafia.endGame(src);
            return;
        }
        if (command === "readlog") {
            var num = parseInt(commandData, 10);
            if (!num) {
                gamemsg(srcname, "This is not a valid number!", "Info", channel);
                return;
            }
            if (num < 1 || num > stalkLogs.length) {
                gamemsg(srcname, "There's no log with this id!", "Info", channel);
                return;
            }
            sys.sendMessage(src, "", channel);
            var stalkLog = stalkLogs[num - 1].split("::**::");
            for (var c = 0; c < stalkLog.length; ++c) {
                sys.sendMessage(src, stalkLog[c], channel);
            }
            sys.sendMessage(src, "", channel);
            return;
        }
        if (command === "targetlog") {
            var num = parseInt(commandData, 10);
            if (!num) {
                gamemsg(srcname, "This is not a valid number!", "Info", channel);
                return;
            }
            if (num < 1) {
                num = 1;
            } else if (num > stalkLogs.length) {
                num = stalkLogs.length;
            }
            var result = [], stalkLog, index;
            for (var c = 0; c < num; ++c) {
                stalkLog = stalkLogs[c].split("::**::");
                index = stalkLog.indexOf("*** NIGHT PHASE 2 ***");
                if (index === -1) {
                    index = stalkLog.length - 1;
                }
                if (index !== -1) {
                    if (stalkLog.length === 1) {
                        stalkLog.push("Not enough players.");
                    } else {
                        stalkLog = stalkLog.splice(0, index + 1);
                    }
                    stalkLog.push("");
                    result = stalkLog.concat(result);
                }
            }
            sys.sendMessage(src, "", channel);
            for (c = 0; c < result.length; ++c) {
                sys.sendMessage(src, result[c], channel);
            }
            sys.sendMessage(src, "", channel);
            return;
        }
        if (command === "add") {
            mafia.themeManager.loadWebTheme(commandData, true, false, null, src, true);
            return;
        }
        if (command === "disable") {
            mafia.themeManager.disable(src, commandData);
            return;
        }
        if (command === "enable") {
            mafia.themeManager.enable(src, commandData);
            return;
        }
        if (command === "mafiaban") {
            var bantime;
            if (sys.auth(src) > 0 || this.isMafiaSuperAdmin(src)) {
                bantime = undefined;
            } else {
                bantime = 86400;
            }
            script.issueBan("mban", src, tar, commandData, bantime);
            return;
        }
        if (command === "mafiaunban") {
            script.unban("mban", src, tar, commandData);
            return;
        }
        var id;
        if (command === "passma") {
            var oldname = sys.name(src).toLowerCase();
            var newname = commandData.toLowerCase();
            var sMA = false;
            if (sys.id(newname) === undefined) {
                msg(src, "Your target is offline!");
                return true;
            }
            if (!sys.dbRegistered(newname)) {
                msg(src, "That account isn't registered so you can't give it authority!");
                return true;
            }
            if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                msg(src, "Both accounts must be on the same IP to switch!");
                return true;
            }
            if (script.mafiaAdmins.hash.hasOwnProperty(newname)|| script.mafiaSuperAdmins.hash.hasOwnProperty(newname)) {
                msg(src, "Your target is already a Mafia Admin!");
                return true;
            }
            if (this.isMafiaSuperAdmin(src)) {
                script.mafiaSuperAdmins.remove(oldname);
                script.mafiaSuperAdmins.add(newname, "");
                sMA = true;
            } else {
                script.mafiaAdmins.remove(oldname);
                script.mafiaAdmins.add(newname, "");
            }
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).mafiaAdmin = true;
            msgAll(sys.name(src) + " passed their " + (sMA ? "Super Mafia Admin powers" : "Mafia auth") + " to " + commandData, sachannel);
            return;
        }
        if (command === "enablenonpeak" || command === "disablenonpeak") {
            mafia.nonPeak(src, command === "enablenonpeak");
            return;
        }
        if (command === "unshove") {
            var name = commandData.toCorrectCase();
            if (name in mafia.usersToShove) {
                msgAll(nonFlashing(sys.name(src)) + " cancelled the shove on " + name + ".", sachannel);
                msg(src, "You cancelled the shove on " + name + ".", channel);
                delete mafia.usersToShove[name];
                return;
            }
            msg(src, name + " isn't set to be shoved!");
            return;
        }
        if (command === "unslay") {
            var name = commandData.toCorrectCase();
            if (name in mafia.usersToSlay) {
                dualBroadcast("±Slay: " + nonFlashing(sys.name(src)) + " cancelled the sl" + "\u200b" + "ay on " + name + ".");
                delete mafia.usersToSlay[name];
                return;
            }
            msg(src, name + " isn't set to be slain!");
            return;
        }
        
        if (!this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        if (command === "mafiaadmin" || command === "mafiasadmin" || command === "mafiasuperadmin" || command === "smafiaadmin" || command === "smafiasadmin" || command === "smafiasuperadmin") {
            var ma = commandData.toLowerCase();
            var sMA = false;
            var silent = false;
            if (command == "smafiaadmin" || command == "smafiasadmin" || command == "smafiasuperadmin") {
                command = command.substr(1);
                silent = true;
            }
            if ((command == "mafiasadmin" || command == "mafiasuperadmin") && sys.auth(src) >= 3) {
                script.mafiaSuperAdmins.add(ma, "");
                script.mafiaAdmins.remove(ma);
                sMA = true;
            } else {
                script.mafiaAdmins.add(ma, "");
            }
            id = sys.id(commandData);
            if (id !== undefined) {
                SESSION.users(id).mafiaAdmin = true;
            }
            if (!silent) {
                msgAll(nonFlashing(sys.name(src)) + " promoted " + commandData.toCorrectCase() + " to " + (sMA ? "Super " : "") + "Mafia Admin.");
            }
            msgAll(nonFlashing(sys.name(src)) + " promoted " + commandData.toCorrectCase() + " to " + (sMA ? "Super " : "") + "Mafia Admin.", sachannel);
            return;
        }
        if (command === "mafiaadminoff" || command === "smafiaadminoff") {
            var ma = commandData.toLowerCase();
            var sMA = false;
            var silent = (command === "smafiaadminoff");
            if (script.mafiaSuperAdmins.hash.hasOwnProperty(ma) && sys.auth(src) >= 3) {
                script.mafiaSuperAdmins.remove(ma);
                sMA = true;
            }
            script.mafiaAdmins.remove(ma);
            id = sys.id(commandData);
            if (id !== undefined) {
                SESSION.users(id).mafiaAdmin = false;
            }
            if (!silent) {
                msgAll(nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from " + (sMA ? "Super " : "") + "Mafia Admin.");
            }
            msgAll(nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from " + (sMA ? "Super " : "") + "Mafia Admin.", sachannel);
            return;
        }
        if (command === "mafiasadminoff" || command === "mafiasuperadminoff" || command === "smafiasadminoff" || command === "smafiasuperadminoff") {
            var silent = (command === "smafiasuperadminoff" || command === "smafiasadminoff");
            script.mafiaSuperAdmins.remove(commandData.toLowerCase());
            if (id !== undefined) {
                SESSION.users(id).mafiaAdmin = false;
            }
            if (!silent) {
                msgAll(nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from Super Mafia Admin.");
            }
            msgAll(nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from Super Mafia Admin.", sachannel);
            return;
        }
        if (command === "remove" || command === "sremove"){
            var silent = (command === "sremove");
            mafia.themeManager.remove(src, commandData, silent);
            return;
        }
        if (command === "updateafter") {
            msg(src, "Mafia will update after the game");
            mafia.needsUpdating = true;
            if (mafia.state == "blank") {
                runUpdate();
            }
            return;
        }
        if (command === "push") {
            var name = commandData;
            if (this.state != "entry") {
                msg(src, "Pushing makes no sense outside entry...");
                return;
            }
            if (this.signups.length >= this.theme["roles" + this.theme.roleLists].length) {
                gamemsg(srcname, "This theme only supports a maximum of " + this.theme["roles" + this.theme.roleLists].length + " players!");
                return;
            }
            var id = sys.id(name);
            if (id) {
                name = sys.name(id);
                this.signups.push(name);
                this.ips.push(sys.ip(id));
            } else {
                this.signups.push(name);
            }
            dualBroadcast("±Game: " + name + " joined the game! (pushed by " + nonFlashing(sys.name(src)) + ")");
            if (name in this.usersToShove) {
                delete this.usersToShove[name];
            }
            return;
        }
        if (command === "updatestats") {
            mafia.mafiaStats.compileData();
            msg(src, "Mafia stats page was updated!");
            return;
        }
        if (command === "featuretheme") {
            featuredTheme = commandData.toLowerCase();
            if (commandData == '*') {
                msg(src, "You cleared the current Featured Theme.");
                featuredTheme = undefined;
            } else if (!mafia.themeManager.themes.hasOwnProperty(featuredTheme)) {
                msg(src, featuredTheme + "is not a valid Mafia theme.");
                featuredTheme = undefined;
            } else if (mafia.themeManager.themes.hasOwnProperty(featuredTheme) && !mafia.themeManager.themes[featuredTheme].enabled) {
                msg(src, featuredTheme + " is currently disabled and cannot be featured.");
                featuredTheme = undefined;
            } else {
                msg(src, casedtheme(featuredTheme) + " is now being featured.");
            }
            return;
        }
        if (command === "featuretext") {
            if (commandData == '*') {
                featuredText = "Please read and follow the /mafiarules! Also, be mindful of your caps, flooding, and insulting other users.";
                msg(src, "You reset the current Featured Theme Text.");
                return;
            }
            featuredText = commandData;
            msg(src, "You updated the Featured Theme text to: " + featuredText + ".");
            return;
        }
        if (command === "featurelink") {
            if (commandData == '*') {
                featuredLink = undefined;
                msg(src, "You cleared the current Featured Theme Thread.");
                return;
            }
            featuredLink = commandData;
            msg(src, "You updated the Featured Theme text link to: " + featuredLink + ".");
            return;
        }
        if (command === "featureint") {
            var num = parseInt(commandData, 10);
            if (!num) {
                num = 60;
                msg(src, "Interval reset to 60 minutes.", channel);
                return;
            }
            if (num < 30) {
                num = 30;
                msg(src, "You cannot set the interval to less than 30 minutes!", channel);
            } else if (num > 240) {
                num = 240;
                msg(src, "You cannot set the interval to more than 240 minutes!", channel);
            }
            msg(src, "Interval changed to " + num + " minutes.", channel);
            return;
        }
        if (command === "forcefeature") {
            if (!mafia.themeManager.themes.hasOwnProperty(featuredTheme) &&featuredText === undefined) {
                msg(src, "No Featured Theme or Featured Text was found.");
            } else {
                this.lastFeaturedAd = 0;
                this.advertiseFeaturedTheme();
                msg(src, "You forced the Featured Theme message to display!");
            }
            return;
        }
        throw ("no valid command");
    };
    this.showRules = function(src, channel) {
        var mrules = [
            "",
            "*** Mafia Game Rules ***",
            "",
            "±Rule 1- All server rules apply in this channel. Type /rules to view them:",
            "Ignorance of the rules does not justify breaking them. Someone else breaking a rule does not justify you breaking the same rule. If you choose to play on Android, you are not able to use it to justify rule breaking.",
            "",
            "±Rule 2- Mafia Admins, or MAs are here for the benefit of the channel. You can use /mas to get a listing of them:",
            "If you are told something by an MA, it is advised you listen. PM an MA to report an instance of rulebreaking. Shouting out \"BAN\" and \"teamvote!\" and such in the chat is pointless and disrupts the game. If any MA is breaking a rule, contact a Mafia Super Admin or any Server Auth immediately.",
            "",
            "±Rule 3- Be respectful to your fellow players:",
            "Do not insult players if they make a mistake. Helping them to learn the game instead of insulting them will make the game a lot more enjoyable for all. Do not flash multiple people needlessly, including trying to get them to play. Do not insult themes. If you have a legitimate complaint about a certain theme, post it in that theme's forum thread.",
            "",
            "±Rule 4- Make sure you can stay active for the entire game if you join, otherwise, /unjoin before the game starts:",
            "If you must leave, you can ask a Mafia Admin in the chat for a \"slay\" in order to be removed from the game. A valid reason must be supplied with your request. Not liking any part of the game or participating in other channels are not valid reasons. Asking for a slay within the first few phases of the game, or leaving without asking for a slay, will result in punishment.",
            "",
            "±Rule 5- Do not attempt to ruin the game in any way, shape, or form:",
            "Do not intentionally reveal, vote, or kill your teammates without their consent. Do not quote any of the game bots, including in private messages. Do not target a certain user or group of users repeatedly. If you are not currently alive in the game, do not discuss the game with anyone still playing. Do not copy other peoples' names or make your name similar to someone else's. Do not disable private messages (PMs) or ignore other players as Mafia is a game of heavy communication. Do not stall the game for any reason. Do not attempt to fake \"Team Talk\".",
            ""
        ];
        dump(src, mrules, channel);
        if (this.isMafiaAdmin(src)) {
            var marules = [
                "±Rule 6- You are an MA and are expected to set an example:",
                "You are expected to follow all of the aforementioned rules and are subject to the same, if not harsher punishments for breaking them, including the possibility of termination. All ban discussion is expected to go on in #Victory Road. Do not discuss private or sensitive information with anyone whom it does not concern. You should always make reasonable effort to PM users you are about to ban to let them know why they are being banned. Don't be afraid to shove players if they broke a rule-- it is much easier to sort out a problem if you have their full attention.",
                ""
            ];
            dump(src, marules, channel);
        }
    };

    this.beforeChatMessage = function (src, message, channel) {
        if (channel !== 0 && channel == mafiachan && mafia.ticks > 0 && ["blank", "voting", "entry"].indexOf(mafia.state) == -1) {
            if (!mafia.isInGame(sys.name(src)) && sys.auth(src) <= 0 && !mafia.isMafiaAdmin(src)) {
                if (!(is_command(message) && message.substr(1, 2).toLowerCase() != "me")) {
                    sys.sendMessage(src, Config.Mafia.notPlayingMsg, mafiachan);
                    return true;
                }
            }
            if (message.indexOf("[Team]") === 0) {
                msg(src, "Please don't fake a Team Talk message!", mafiachan);
                return true;
            }
        }
    };
    this.afterChannelJoin = function(src, channel) {
        if (channel == mafiachan) {
            var srcname = sys.name(src);
            switch (mafia.state) {
                case "blank":
                    gamemsg(srcname, "No game is running! You can start a game by typing /start [theme name].", "Info");
                    break;
                case "voting":
                    gamemsg(srcname, "A voting for the next game is running now! Type /vote [theme name] to vote for " + readable(Object.keys(this.possibleThemes), "or") + "!", "Info");
                    break;
                case "entry":
                    gamemsg(srcname, "You can join a " + (mafia.theme.name == "default" ? "" : mafia.theme.name + "-themed ") + "mafia game now by typing /join! ", "Info");
                    break;
                default:
                    gamemsg(srcname, "A " + (mafia.theme.name == "default" ? "" : mafia.theme.name + "-themed ") + "mafia game is in progress! You can join the next game by typing /join! ", "Info");
            }
            return false;
        }
    };
    this.beforeChannelLeave = function(src, channel) {
        if (channel == mafiachan) {
            var name = sys.name(src);
            if (name in this.usersToShove) {
                msgAll(name + " left the channel and was removed from the shove list!", sachannel);
                delete this.usersToShove[name];
            }
            
            if ((this.isInGame(name) && sys.id('PolkaBot') === undefined) || name in this.signups) {
                gamemsgAll("PolkaBot: Mafia: Player " + name + " left whilst in a game!", false, sachannel);
            }
            return true;
        }
    };
    
    this.onMute = function (src) {
        var id = sys.name(src);
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser(mafiabot.name, id, false);
        } else if (this.isInGame(id)) {
            this.slayUser(mafiabot.name, id, false);
        }
    };
    this.onMban = function (src) {
        var id = sys.name(src);
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser(mafiabot.name, id, false);
        } else if (this.isInGame(id)) {
            this.slayUser(mafiabot.name, id, false);
        }
        delete mafia.usersToShove[id];
        if (sys.isInChannel(src, mafiachan)) {
            sys.kick(src, mafiachan);
        }
    };
    this.onBan = function (src, dest) {//Only for Control panel bans
        var dest = sys.name(dest);
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser(mafiabot.name, dest, false);
        } else if (this.isInGame(dest)) {
            this.slayUser(mafiabot.name, dest, false);
        }
        delete mafia.usersToShove[dest];
    };
    
    this.stepEvent = function () {
        try {
            this.tickDown();
        } catch (err) {
            dualBroadcast("error occurred: " + err);
        }
    };
    this.init = function () {
        this.themeManager.loadThemes();
        mafiachan = sys.channelId(MAFIA_CHANNEL);
        /*msgAll("Mafia was reloaded, please start a new game!");*/
    };
    this.onHelp = function (src, commandData, channel) {
        if (commandData.toLowerCase() === "mafia") {
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** Mafia commands ***", channel);
            this.commands.user.forEach(function (x) {
                sys.sendMessage(src, x, channel);
            });
            if (this.isMafiaAdmin(src)) {
                sys.sendMessage(src, "*** Mafia Admin commands ***", channel);
                this.commands.ma.forEach(function (x) {
                    sys.sendMessage(src, x, channel);
                });
            }
            if (this.isMafiaSuperAdmin(src)) {
                sys.sendMessage(src, "*** Super Mafia Admin commands ***", channel);
                this.commands.sma.forEach(function (x) {
                    sys.sendMessage(src, x, channel);
                });
            }
            if (sys.auth(src) >= 3) {
                sys.sendMessage(src, "*** Super Mafia Admin commands ***", channel);
                this.commands.owner.forEach(function (x) {
                    sys.sendMessage(src, x, channel);
                });
            }
        }
    };
    this["help-string"] = ["mafia: To know the mafia commands"];
}
/* Functions defined by mafia which should be called from main script:
* - init
* - stepEvent
* - onKick, onMute, onMban, onBan
* - beforeChatMessage
* - handleCommand
* - onHelp
*/

module.exports = new Mafia(sys.channelId(MAFIA_CHANNEL));
