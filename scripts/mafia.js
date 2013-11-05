/*
* mafia.js
*
* Contains code for server side mafia game.
* Original code by unknown.
*/

// Global variables inherited from scripts.js
/*global mafiabot, getTimeString, updateModule, script, sys, SESSION, sendChanAll, require, Config, module, sachannel*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true,eqnull:true*/
var MAFIA_CHANNEL = "Mafia";

var is_command = require("utilities.js").is_command;
var nonFlashing = require("utilities.js").non_flashing;
var html_escape = require("utilities.js").html_escape;

function Mafia(mafiachan) {
    // Remember to update this if you are updating mafia
    // Otherwise mafia game won't get reloaded
    this.version = "2012-12-15";
    var mafia = this;
    
    this.mafiaStats = require("mafiastats.js");
    this.mafiaChecker = require("mafiachecker.js");
    
    var noPlayer = '*',
        CurrentGame,
        PreviousGames,
        MAFIA_SAVE_FILE = Config.Mafia.stats_file,
        MAFIA_LOG_FILE = "mafialogs.txt",
        stalkLogs = [],
        currentStalk = [],
        phaseStalk = {},
        featuredTheme,
        featuredLink,
        featuredText = "Please read and follow the /mafiarules! Also, be mindful of your caps, flooding, and insulting other users.";

    var DEFAULT_BORDER = "***************************************************************************************";
    var border;

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

    function dump(src, mess, channel) {
        if (channel === undefined) {
            channel = mafiachan;
        }
        for (var x in mess) {
            sys.sendMessage(src, mess[x], channel);
        }
    }
    function msg(src, mess) {
        mafiabot.sendMessage(src, mess, mafiachan);
    }
    function msgAll(mess) {
        mafiabot.sendAll(mess, mafiachan);
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

    /* format arrays so that it looks fine to humans
* also accepts a string, in which case just returns it */
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
    function needsBot(msg, botName) {
        if (msg.indexOf(":") === -1 && msg.indexOf("***") === -1) {
            return "±" + (botName ? botName : "Game") + ": " + msg;
        }
        return msg;
    }
    function casedtheme(themename) {
        if (mafia.themeManager.themes.hasOwnProperty(themename)) {
            return mafia.themeManager.themes[themename].name;
        }
        return themename;
    }
    function dualBroadcast(msg) {
        sendChanAll(msg, mafiachan);
        sendChanAll(msg, sachannel);
        return true;
    }
    
    var defaultTheme = {
        name: "Default",
        sides: [
          {
              "side": "mafia", "translation": "Mafia"
          },
          {
              "side": "mafia1", "translation": "French Canadian Mafia"
          },
          {
              "side": "mafia2", "translation": "Italian Mafia"
          },
          {
              "side": "village", "translation": "Good people"
          },
          {
              "side": "werewolf", "translation": "WereWolf"
          },
          {
              "side": "godfather", "translation": "Godfather"
          }
        ],
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
                "startup": "role-reveal"
            }
        }, {
            "role": "mafia",
            "translation": "Mafia",
            "side": "mafia",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team" } },
                "startup": "team-reveal"
            }
        }, {
            "role": "werewolf",
            "translation": "WereWolf",
            "side": "werewolf",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButSelf", "common": "Self", "priority": 10 } },
                "distract": { "mode": "ChangeTarget", "hookermsg": "You tried to distract the Werewolf (what an idea, srsly), you were ravishly devoured, yum!", "msg": "The ~Distracter~ came to you last night! You devoured her instead!" },
                "avoidHax": ["kill"]
            }
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
                "avoidHax": ["kill"]
            }
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
                "startup": "team-reveal"
            }
        }, {
            "role": "mafia2",
            "translation": "Italian Mafia",
            "side": "mafia2",
            "help": "Type /Kill [name] to kill someone!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team" } },
                "startup": "team-reveal"
            }
        }, {
            "role": "conspirator1",
            "translation": "French Canadian Conspirator",
            "side": "mafia1",
            "help": "You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!",
            "actions": {
                "inspect": { "revealAs": "villager" },
                "startup": "team-reveal"
            }
        }, {
            "role": "conspirator2",
            "translation": "Italian Conspirator",
            "side": "mafia2",
            "help": "You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!",
            "actions": {
                "inspect": { "revealAs": "villager" },
                "startup": "team-reveal"
            }
        }, {
            "role": "mafiaboss1",
            "translation": "Don French Canadian Mafia",
            "side": "mafia1",
            "help": "Type /Kill [name] to kill someone! You can't be distracted!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team" } },
                "distract": { "mode": "ignore" },
                "startup": "team-reveal"
            }
        }, {
            "role": "mafiaboss2",
            "translation": "Don Italian Mafia",
            "side": "mafia2",
            "help": "Type /Kill [name] to kill someone! You can't be distracted!",
            "actions": {
                "night": { "kill": { "target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team" } },
                "distract": { "mode": "ignore" },
                "startup": "team-reveal"
            }
        }, {
            "role": "samurai",
            "translation": "Samurai",
            "side": "village",
            "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people.",
            "actions": {
                "standby": {
                    "kill": {
                        "target": "AnyButSelf", "msg": "You can kill now using /kill [name] :",
                        "killmsg": "~Self~ pulls out a sword and strikes it through ~Target~'s chest!"
                    }
                }
            }
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
        roles1: ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "truemiller",
                 "villager", "mafia", "villager", "mayor"],
        roles2: ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2",
                 "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "villager",
                 "miller1", "miller2", "mafiaboss1", "villager", "vigilante", "villager", "godfather",
                 "mafiaboss2", "samurai", "villager", "villager", "werewolf", "mafia1",
                 "mafia2", "bodyguard"],
        villageCantLoseRoles: ["mayor", "vigilante", "samurai"]
    };

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
    
    /* ThemeManager is a object taking care of saving and loading themes
     * in mafia game */
    function ThemeManager() {
        this.themeInfo = [];
        this.themes = {};
    }
    
    ThemeManager.prototype.toString = function () { return "[object ThemeManager]"; };

    ThemeManager.prototype.save = function (name, url, resp) {
        var fname = "mafiathemes/theme_" + name.replace("/", "").toLowerCase();
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
        sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
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
        var content = sys.getFileContent("mafiathemes/metadata.json");
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
                msgAll("Error loading cached theme \"" + this.themeInfo[i][0] + "\": " + err);
            }
        }
    };
    ThemeManager.prototype.saveToFile = function (plain_theme) {
        if (typeof sys != "object") return;
        var fname = "mafiathemes/theme_" + plain_theme.name.toLowerCase();
        sys.writeToFile(fname, JSON.stringify(plain_theme));
        this.themeInfo.push([plain_theme.name, "", fname, true]);
        sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
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
                }
                if (needsDisable) {
                    msg(src, "This theme was previously disabled. Speak to a Mafia Admin to request enabling.");
                    mafia.themeManager.disable(src, lower, true);
                }
            } catch (err) {
                msgAll("Couldn't download theme from " + url);
                msgAll("" + err);
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
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            if (silent) {
                sys.sendMessage(src, "±Murkrow: You removed the theme " + broadcastname + ".", mafiachan);
            } else {
                mafiabot.sendAll(nonFlashing(sys.name(src)) + " removed the theme " + broadcastname + ".", mafiachan);
            }
            mafiabot.sendAll(nonFlashing(sys.name(src)) + " removed the theme " + broadcastname + ".", sachannel);
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
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            var broadcastname = casedtheme(name);
            if (!silent) {
                dualBroadcast("±Murkrow: " + nonFlashing(sys.name(src)) + " enabled theme " + broadcastname + ".");
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
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            var broadcastname = casedtheme(name);
            if (!silent) {
                if (src !== Config.Mafia.bot) {
                    dualBroadcast("±Murkrow: " + nonFlashing(sys.name(src)) + " disabled theme " + broadcastname + ".");
                } else {
                    dualBroadcast("±Murkrow: " + Config.Mafia.bot + " disabled theme " + broadcastname + ".");
                }
            }
            if (featuredTheme && name === featuredTheme.toLowerCase()){
                mafiabot.sendAll(broadcastname + " was the Featured Theme. Please select a new one to feature!", sachannel);
                featuredTheme = undefined;
            }
        }
    };

    /* Theme is a small helper to organize themes
* inside the mafia game */
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
                            abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") + " during the night. ";
                            if ("avoidHax" in role.actions && role.actions.avoidHax.indexOf(a) != -1) {
                                abilities += "(Can't be detected by spies.) ";
                            }
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
                    msgAll("Error adding role " + role.translation + "(" + role.role + ") to /roles");
                else
                    msgAll("Error making rolelist with role id: " + role_i);
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
                msgAll("Error adding role " + role.translation + "(" + role.role + ") to /sides");
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
                msgAll("Error adding side " + this.trside(side) + "(" + side + ") to /sides");
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
    // End of Theme

    this.isInGame = function (player) {
        if (this.state == "entry") {
            return this.signups.indexOf(player) != -1;
        }
        return player in this.players;
    };
    // init
    this.themeManager = new ThemeManager();

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
        this.usersToShove = {};
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
        }
    };
    this.clearVariables();
    this.advertiseToChannel = function(channel) {
        sendChanAll("", channel);
        sendChanAll(border, channel);
        if (this.theme.name == "default") {
            sendChanAll("±Game: A new mafia game was started at #" + sys.channel(mafiachan) + "!", channel);
        } else {
            sendChanAll("±Game: A new " + (this.theme.altname ? this.theme.altname : this.theme.name) + "-themed mafia game was started at #" + sys.channel(mafiachan) + "!", channel);
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
        if (ftime > this.lastFeaturedAd + 60 * 60) {
            this.lastFeaturedAd = ftime;
            if (adOkay || featuredText) {
                sendChanAll(DEFAULT_BORDER, mafiachan);
                if (adOkay) {
                    sys.sendHtmlAll("<font color=#3daa68><timestamp/> <b>±Murkrow: </b></font> Looking for a theme to play? Try out the Featured Theme: <b>" + featured + "</b>!", mafiachan);
                }
                if (featuredText) {
                    sys.sendHtmlAll("<font color=#3daa68><timestamp/> <b>±Murkrow: </b></font> " + (featuredLink ? '<a href="' + html_escape(featuredLink) + '">' + featuredText + '</a>' : featuredText), mafiachan);
                }
                sendChanAll(DEFAULT_BORDER, mafiachan);
            }
        }
    };
    this.userVote = function (src, commandData) {
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            sys.sendMessage(src, "±Game: You can't start a voting when the channel is silenced.", mafiachan);
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
            sendChanAll("±Game: " + sys.name(src) + " started a voting for next game's theme!. You have " + this.ticks + " seconds to vote with /vote or /votetheme!", mafiachan);
            var casedThemes = [];
            for (var x in this.possibleThemes) {
                casedThemes.push(this.themeManager.themes[x].name);
            }
            sendChanAll("±Game: Choose from these themes: " + casedThemes.join(", ") + " !", mafiachan);
            sendChanAll(border, mafiachan);
            sendChanAll("", mafiachan);
        }
        if (this.state != "voting") {
            sys.sendMessage(src, "±Game: This command makes no sense during a game, right?!", mafiachan);
            return;
        }
        if (this.canJoin(src) !== true) {
            return;
        }
        if (!this.possibleThemes.hasOwnProperty(themeName)) {
            if (themeName !== '*') {
                sys.sendMessage(src, "±Game: You can not vote this theme" + (reason ? " because " + reason : "") + "!", mafiachan);
                reason = undefined;
            }
            return;
        }
        var ip = sys.ip(src);
        if (this.votes.hasOwnProperty(ip)) {
            if (this.numvotes[sys.ip(src)] >= 3) {
                sys.sendMessage(src, "±Game: You can't change your vote more than 3 times!", mafiachan);
                return;
            } else if (this.votes[ip] != themeName) {
                sendChanAll("±Game: " + sys.name(src) + " changed their vote to " + this.themeManager.themes[themeName].name + "!", mafiachan);
                this.numvotes[sys.ip(src)] += 1;
            }
        } else {
            sendChanAll("±Game: " + sys.name(src) + " voted for " + this.themeManager.themes[themeName].name + "!", mafiachan);
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
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            sys.sendMessage(src, "±Game: You can't start a game when the channel is silenced.", mafiachan);
            return;
        }
        var now = (new Date()).getTime();
        if (src !== null) {
            if (SESSION.users(src).mafia_start !== undefined && SESSION.users(src).mafia_start + 5000 > now && !this.isMafiaSuperAdmin(src)) {
                sys.sendMessage(src, "±Game: Wait a moment before trying to start again!", mafiachan);
                return;
            }
            SESSION.users(src).mafia_start = now;
        }
        if (this.state != "blank") {
            sys.sendMessage(src, "±Game: A game is going on. Wait until it's finished to start another one", mafiachan);
            sys.sendMessage(src, "±Game: You can join the game by typing /join !", mafiachan);
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
                        sys.sendMessage(src, "±Game: Sorry, you have started a game " + (i + 1) + " games ago, let someone else have a chance!", mafiachan);
                        return;
                    }
                    if (what == themeName) {
                        sys.sendMessage(src, "±Game: This theme was started " + (i + 1) + " games ago! No repeat!", mafiachan);
                        return;
                    }
                }
            }

            if (themeName in this.themeManager.themes) {
                if (!this.themeManager.themes[themeName].enabled) {
                    sys.sendMessage(src, "±Game: This theme is disabled!", mafiachan);
                    return;
                }
                this.theme = this.themeManager.themes[themeName];
            } else {
                sys.sendMessage(src, "±Game: No such theme!", mafiachan);
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
                sendChanAll("±Game: " + sys.name(src) + " started a game!", mafiachan);
            } else {
                sendChanAll("±Game: " + sys.name(src) + " started a game with theme " + this.theme.name + (this.theme.altname ? " (" + this.theme.altname + ")" : "")+ "!", mafiachan);
            }
            sendChanAll("±Game: Type /Join to enter the game!", mafiachan);
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

        if (this.theme.summary === undefined) {
            sendChanAll("±Game: Consider adding a summary field to this theme that describes the setting of the game and points out the odd quirks of the theme!", mafiachan);
        } else {
            sendChanAll("±Game: " + this.theme.summary, mafiachan);
        }

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
                sys.sendMessage(src, "±Game: " + name + " joined the game!", mafiachan);
                mafia.shoveUser("Murkrow", sys.name(src), true);
            } else {
                sendChanAll("±Game: " + name + " joined the game!", mafiachan);
            }
        }
    };
    this.endGame = function (src) {
        if (mafia.state == "blank") {
            if (src) {
                sys.sendMessage(src, "±Game: No game is going on.", mafiachan);
            }
            return;
        }
        sendChanAll(border, mafiachan);
        sendChanAll("±Game: " + (src ? sys.name(src) : Config.Mafia.bot) + " has stopped the game!", mafiachan);
        sendChanAll(border, mafiachan);
        sendChanAll("", mafiachan);
        if (sys.id('PolkaBot') !== undefined) {
            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
        }
        //mafiabot.sendAll("GAME ENDED", mafiachan);
        mafia.mafiaStats.result("dead");
        mafia.clearVariables();
        runUpdate();
        this.advertiseFeaturedTheme();
    };
    /* called every second */
    this.tickDown = function () {
        if (this.ticks <= 0) {
            return;
        }
        this.ticks = this.ticks - 1;
        if (this.ticks === 0) {
            this.callHandler(this.state);
        } else {
            if (this.ticks == 30 && this.state == "entry") {
                sendChanAll("", mafiachan);
                sendChanAll("±Game: Hurry up, you only have " + this.ticks + " seconds more to join!", mafiachan);
                sendChanAll("", mafiachan);
            }
        }
    };
    this.sendPlayer = function (player, message) {
        var id = sys.id(player);
        if (id === undefined)
            return;
        sys.sendMessage(id, message, mafiachan);
    };
    
    // Grab a list of all roles belonging to a given team.
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
        //sys.sendAll("removing player " + player.name, mafiachan);
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
    this.actionBeforeDeath = function (player) {
        if (player.role.actions.hasOwnProperty("onDeath")) {
            var onDeath = player.role.actions.onDeath;
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
                            actionMessage = onDeath.killmsg ? onDeath.killmsg : "±Kill: Because ~Self~ died, ~Target~ (~Role~) died too!";
                            sendChanAll(needsBot(actionMessage, "Kill").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r])), mafiachan);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    sendChanAll(needsBot(onDeath.singlekillmsg, "Kill").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
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
                            actionMessage = onDeath.poisonmsg ? onDeath.poisonmsg : "±Game: Because ~Self~ died, the ~Role~ was poisoned!";
                            sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(r)).replace(/~Count~/, count), mafiachan);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    sendChanAll(needsBot(onDeath.singlepoisonmsg).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
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
                            actionMessage = onDeath.convertmsg ? onDeath.convertmsg : "±Game: Because ~Self~ died, the ~Old~ became a ~New~!";
                            sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/, mafia.theme.trrole(newRole)), mafiachan);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    sendChanAll(needsBot(onDeath.singleconvertmsg).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
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
                            actionMessage = onDeath.cursemsg ? onDeath.cursemsg : "±Game: Because ~Self~ died, the ~Old~ got cursed and will become a ~New~ soon!";
                            sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/g, mafia.theme.trrole(cursedRole)).replace(/~Count~/g, count || 2), mafiachan);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    sendChanAll(needsBot(onDeath.singlecursemsg).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
                }
            }
            if ("exposeRoles" in onDeath) {
                targetRoles = onDeath.exposeRoles;
                for (r = 0; r < targetRoles.length; ++r) {
                    targetPlayers = this.getPlayersForRole(targetRoles[r]);
                    if (targetPlayers.length > 0) {
                        actionMessage = onDeath.exposemsg ? onDeath.exposemsg : "±Game: Before dying, ~Self~ exposed ~Target~ as the ~Role~!";
                        sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(targetPlayers, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r])), mafiachan);
                        needSeparator = true;
                    }
                }
            }
            if (this.state == "day" && needSeparator) {
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
            convertmsg = (player.role.actions.onDeadRoles.convertmsg || "±Game: Due to the latest deaths, ~Old~ became ~New~!").replace(/~Self~/gi, player.name).replace(/~Old~/gi, mafia.theme.trrole(player.role.role)).replace(/~New~/gi, mafia.theme.trrole(convertPlayers[p]));
            this.setPlayerRole(player, convertPlayers[p]);
            sendChanAll(needsBot(convertmsg), mafiachan);
            this.showOwnRole(sys.id(p));
        }
    };
    this.kill = function (player) {
        if (this.theme.killmsg) {
            sendChanAll(needsBot(this.theme.killmsg, "Kill").replace(/~Player~/g, player.name).replace(/~Role~/g, player.role.translation), mafiachan);
        } else {
            sendChanAll("±Kill: " + player.name + " (" + player.role.translation + ") died!", mafiachan);
        }
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
        if (list.indexOf(target.name) == -1) {
            list.push(target.name);
            if (list.length > limit) {
                list.splice(0, 1);
            }
        }
        if (this.ticks > 0 && limit > 1)
            this.sendPlayer(player.name, "±Game: Your target(s) are " + list.join(', ') + "!");
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
            sendChanAll("±Game: " + (mafia.theme.drawmsg ? mafia.theme.drawmsg : "Everybody died! This is why we can't have nice things :("), mafiachan);
            sendChanAll(border, mafiachan);
            
            mafia.compilePhaseStalk("GAME END");
            currentStalk.push("Winners: None (game ended in a draw).");
            mafia.mafiaStats.result("Tie");
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
                sendChanAll(needsBot(mafia.theme.sideWinMsg[winSide]).replace(/~Players~/g, readable(players, "and")), mafiachan);
            } else {
                sendChanAll("±Game: The " + mafia.theme.trside(winSide) + " (" + readable(players, "and") + ") wins!", mafiachan);
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
                    sendChanAll("±Game: The " + readable(losingSides, "and") + " lose!", mafiachan);
                    currentStalk.push("Losers: " + readable(losingSides, "and"));
                }
            } else if (goodPeople.length > 0) {
                sendChanAll("±Game: The " + mafia.theme.trside('village') + " (" + readable(goodPeople, "and") + ") lose!", mafiachan);
                currentStalk.push("Losers: " + readable(goodPeople, "and"));
            }
            sendChanAll(border, mafiachan);
            
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

    this.handlers = {
        entry: function () {
            sendChanAll(border, mafiachan);
            sendChanAll("Times Up! :", mafiachan);

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
                sendChanAll("Well, Not Enough Players! :", mafiachan);
                sendChanAll("You need at least "+minp+" players to join (Current; " + mafia.signups.length + ").", mafiachan);
                sendChanAll(border, mafiachan);
                mafia.clearVariables();
                mafia.mafiaStats.result("dead");
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
                mafia.players[mafia.signups[i]] = { 'name': mafia.signups[i], 'role': mafia.theme.roles[playerRole], 'targets': {}, 'recharges': {}, 'dayrecharges': {}, 'charges' : {}, 'daycharges': {}, "restrictions": [] };
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

            sendChanAll("The Roles have been Decided! :", mafiachan);
            var p, player;
            for (p in mafia.players) {
                player = mafia.players[p];
                var role = player.role;

                if (typeof role.actions.startup == "object" && typeof role.actions.startup.revealAs == "string") {
                    mafia.sendPlayer(player.name, "±Game: You are a " + mafia.theme.trrole(role.actions.startup.revealAs) + "!");
                } else {
                    if (typeof role.startupmsg == "string") {
                        mafia.sendPlayer(player.name, needsBot(role.startupmsg, "Game").replace(/~Role~/gi, role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side)));
                    } else {
                        mafia.sendPlayer(player.name, "±Game: You are a " + role.translation + "!");
                    }
                }
                mafia.sendPlayer(player.name, "±Game: " + role.help.replace(/~Side~/gi, mafia.theme.trside(player.role.side)));

                if (role.actions.startup == "team-reveal") {
                    mafia.sendPlayer(player.name, "±Game: Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                }
                if (role.actions.startup == "team-reveal-with-roles") {
                    var playersRole = mafia.getPlayersForTeam(role.side).map(name_trrole, mafia.theme);
                    mafia.sendPlayer(player.name, "±Game: Your team is " + readable(playersRole, "and") + ".");
                }
                if (typeof role.actions.startup == "object" && Array.isArray(role.actions.startup["team-revealif"])) {
                    if (role.actions.startup["team-revealif"].indexOf(role.side) != -1) {
                        mafia.sendPlayer(player.name, "±Game: Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                    }
                }
                if (role.actions.startup == "role-reveal") {
                    mafia.sendPlayer(player.name, "±Game: People with your role are " + mafia.getPlayersForRoleS(role.role) + ".");
                }

                if (typeof role.actions.startup == "object") {
                    if (role.actions.startup.revealRole) {
                        if (typeof role.actions.startup.revealRole == "string") {
                            if (mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) !== "")
                                mafia.sendPlayer(player.name, "±Game: The " + mafia.theme.roles[role.actions.startup.revealRole].translation + " is " + mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) + "!");
                        } else if (Array.isArray(role.actions.startup.revealRole)) {
                            for (var s = 0, l = role.actions.startup.revealRole.length; s < l; ++s) {
                                var revealrole = role.actions.startup.revealRole[s];
                                if (mafia.getPlayersForRoleS(revealrole) !== "")
                                    mafia.sendPlayer(player.name, "±Game: The " + mafia.theme.roles[revealrole].translation + " is " + mafia.getPlayersForRoleS(revealrole) + "!");
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
                        msg = "revealPlayersMsg" in role.actions.startup ? role.actions.startup.revealPlayersMsg : msg;
                        mafia.sendPlayer(player.name, "±Game: " + msg.replace(/~Players~/g, list));
                    }
                }
            }
            sendChanAll("±Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("±Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            if (mafia.theme.closedSetup !== true) {
                // Send players all roles sided with them
                for (p in mafia.players) {
                    player = mafia.players[p];
                    mafia.sendPlayer(player.name, "±Current Team: " + mafia.getRolesForTeamS(player.role.side));
                }
            }
            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.night;
            }

            mafia.time.nights++;
            mafia.state = "night";

            sendChanAll("±Time: Night " + mafia.time.nights, mafiachan);
            sendChanAll("Make your moves, you only have " + mafia.ticks + " seconds! :", mafiachan);
            sendChanAll(border, mafiachan);
            mafia.resetTargets();
            mafia.reduceRecharges();
        },
        night: function () {
            sendChanAll(border, mafiachan);
            sendChanAll("Times Up! :", mafiachan);

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
            
            var player, names, j;
            var getPlayerRoleId = function(x) { return this.players[x].role.role; };
            for (var i in mafia.theme.nightPriority) {
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
                            mafia.sendPlayer(names[f], "±Game: You couldn't " + o.action + " this night!");
                        }
                    }
                    continue;
                }
                var rolecheck;
                var teamcheck;
                for (j = 0; j < names.length; ++j) {
                    if (!mafia.isInGame(names[j])) continue;
                    player = mafia.players[names[j]];
                    var targets = mafia.getTargetsFor(player, o.action);
                    var target, t; // current target

                    //Fail chance for common:Self
                    if (Action.common == "Self" && "failChance" in Action && Action.failChance > Math.random()) {
                        if (targets.length > 0) {
                            mafia.sendPlayer(player.name, "±Game: You couldn't " + o.action + " this night!");
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
                        var chargetxt = "You have " + charge + " charges remaining";
                        if (Action.chargesmsg) {
                            chargetxt = Action.chargesmsg.replace(/~Charges~/g, charge);
                        }
                        mafia.sendPlayer(player.name, "±Game: " + chargetxt);
                    }
                    outer:
                    for (t in targets) {
                        var evadeChance = Math.random();
                        var targetName = targets[t];
                        
                        if (mafia.isInGame(targetName) && mafia.players[targetName].redirectTo !== undefined && (mafia.players[targetName].redirectActions === "*" || mafia.players[targetName].redirectActions.indexOf(o.action) !== -1)) {
                            targetName = mafia.players[targetName].redirectTo;
                            mafia.sendPlayer(player.name, "±Game: Your " + o.action + " was shielded by " + targetName + "!");
                        }
                        
                        for (var c in commandList) {
                            var targetMode = null;
                            var revenge = false, revengetext;
                            var revengetext = "±Game: You were killed during the night!";
                            var poisonrevenge = 0, poisonDeadMessage;
                            var poisonrevengetext = "±Game: Your target poisoned you!";
                            var finalPoisonCount = Action.count || 2;
                            var finalCurseCount = Action.curseCount || 2;
                            command = commandList[c];
                            target = targetName;
                            if (["kill", "protect", "inspect", "distract", "poison", "safeguard", "stalk", "convert", "copy", "curse", "detox", "dispel", "shield", "dummy", "dummy2", "dummy3"].indexOf(command) == -1) {
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
                                if (piercing !== true && ((target.guarded && command == "kill") || (target.safeguarded && ["distract", "inspect", "stalk", "poison", "convert", "copy", "curse", "detox", "dispel", "dummy", "dummy2", "dummy3"].indexOf(command) !== -1))) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was " + (command == "kill" ? "protected" : "guarded") + "!");
                                    // Action can be countered even if target is protected/guarded
                                    if (command in target.role.actions) {
                                        targetMode = target.role.actions[command];
                                        if (targetMode.mode == "killattackerevenifprotected") {
                                            if (targetMode.msg)
                                                revengetext = targetMode.msg;
                                            mafia.sendPlayer(player.name, revengetext);
                                            mafia.kill(player);
                                            nightkill = true;
                                            continue outer;
                                        } else if (targetMode.mode == "poisonattackerevenifprotected") {
                                            poisonrevenge = targetMode.count || 2;
                                            if (player.poisoned === undefined || player.poisonCount - player.poisoned >= poisonrevenge) {
                                                if (targetMode.msg)
                                                    poisonrevengetext = targetMode.msg;
                                                mafia.sendPlayer(player.name, poisonrevengetext);
                                                player.poisoned = 1;
                                                player.poisonCount = poisonrevenge;
                                                player.poisonDeadMessage = targetMode.poisonDeadMessage;
                                            }
                                        }
                                    }
                                    continue;
                                }
    
                                // Defensive Modes
                                if (command in target.role.actions) {
                                    targetMode = target.role.actions[command];
                                    if (targetMode.mode == "ignore") {
                                        if (command == "distract") {
                                            var distractMsg = targetMode.msg || "The ~Distracter~ came to you last night, but you ignored her!";
                                            mafia.sendPlayer(target.name, "±Game: " + distractMsg.replace(/~Distracter~/g, player.role.translation));
                                        } else {
                                            if (targetMode.silent !== true) {
                                                if (targetMode.msg) {
                                                    mafia.sendPlayer(player.name, targetMode.msg.replace(/~Self~/g, target.name));
                                                } else {
                                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded your " + o.action + "!");
                                                }
                                            }
                                        }
                                        continue;
                                    }
                                    if (targetMode.mode == "ChangeTarget") {
                                        if (targetMode.targetmsg) {
                                            mafia.sendPlayer(player.name, "±Game: " + targetMode.targetmsg);
                                        } else if (targetMode.hookermsg) {
                                            mafia.sendPlayer(player.name, "±Game: " + targetMode.hookermsg);
                                        }
                                        mafia.sendPlayer(target.name, "±Game: " + targetMode.msg.replace(/~Distracter~/g, player.role.translation).replace(/~User~/g, player.role.translation));
                                        mafia.kill(player);
                                        nightkill = true;
                                        mafia.removeTargets(target);
                                        updateStalkTargets();
                                        continue outer;
                                    }
                                    else if (targetMode.mode == "killattacker" || targetMode.mode == "killattackerevenifprotected") {
                                        revenge = true;
                                        if (targetMode.msg)
                                            revengetext = targetMode.msg;
                                    }
                                    else if (targetMode.mode == "poisonattacker" || targetMode.mode == "poisonattackerevenifprotected") {
                                        poisonrevenge = targetMode.count || 2;
                                        poisonDeadMessage = targetMode.poisonDeadMessage;
                                        if (targetMode.msg)
                                            poisonrevengetext = targetMode.msg;
                                    }
                                    else if (targetMode.mode == "identify") {
                                        if (!targetMode.msg) {
                                            mafia.sendPlayer(target.name, "±Game: You identified " + player.name + " as the " + mafia.theme.trrole(player.role.role) + " that tried to " + o.action + " you!");
                                        } else {
                                            mafia.sendPlayer(target.name, "±Game: " + targetMode.msg.replace(/~Target~/g, player.name).replace(/~Role~/g, mafia.theme.trrole(player.role.role)).replace(/~Action~/g, o.action));
                                        }
                                    }
                                    else if (targetMode.mode == "die") {
                                        if (!targetMode.msg) {
                                            mafia.sendPlayer(target.name, "±Game: " + player.name + " tried to " + o.action + " you, but you got scared and died!");
                                        } else {
                                            mafia.sendPlayer(target.name, "±Game: " + targetMode.msg.replace(/~Target~/g, player.name).replace(/~Role~/g, mafia.theme.trrole(player.role.role)).replace(/~Action~/g, o.action));
                                        }
                                        if (!targetMode.targetmsg) {
                                            mafia.sendPlayer(player.name, "±Game: You tried to " + o.action + " " + target.name + ", but they got scared and died!");
                                        } else {
                                            mafia.sendPlayer(player.name, "±Game: " + targetMode.targetmsg.replace(/~Self~/g, target.name).replace(/~Action~/g, o.action));
                                        }
                                        mafia.kill(target);
                                        nightkill = true;
                                        continue;
                                    }
                                    else if (typeof targetMode.mode == "object") {
                                        if ("evadeChance" in targetMode.mode && targetMode.mode.evadeChance > evadeChance) {
                                            if (targetMode.silent !== true) {
                                                if (targetMode.msg) {
                                                    mafia.sendPlayer(player.name, targetMode.msg.replace(/~Self~/g, target.name));
                                                } else {
                                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded your " + o.action + "!");
                                                }
                                            }
                                            continue;
                                        }
                                        if ("ignore" in targetMode.mode && targetMode.mode.ignore.indexOf(player.role.role) != -1) {
                                            if (command == "distract") {
                                                var distractMsg = targetMode.msg || "The ~Distracter~ came to you last night, but you ignored her!";
                                                mafia.sendPlayer(target.name, "±Game: " + distractMsg.replace(/~Distracter~/g, player.role.translation).replace(/~User~/g, player.role.translation));
                                            } else {
                                                if (targetMode.silent !== true) {
                                                    if (targetMode.msg) {
                                                        mafia.sendPlayer(player.name, targetMode.msg.replace(/~Self~/g, target.name));
                                                    } else {
                                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded your " + o.action + "!");
                                                    }
                                                }
                                            }
                                            continue;
                                        }
                                        if ("killif" in targetMode.mode && targetMode.mode.killif.indexOf(player.role.role) != -1) {
                                            if (targetMode.targetmsg) {
                                                mafia.sendPlayer(player.name, "±Game: " + targetMode.targetmsg);
                                            } else if (targetMode.hookermsg) {
                                                mafia.sendPlayer(player.name, "±Game: " + targetMode.hookermsg);
                                            }
                                            mafia.sendPlayer(target.name, "±Game: " + targetMode.msg.replace(/~Distracter~/g, player.role.translation).replace(/~User~/g, player.role.translation));
                                            mafia.kill(player);
                                            nightkill = true;
                                            mafia.removeTargets(target);
                                            updateStalkTargets();
                                            continue outer;
                                        }
                                        if ("identify" in targetMode.mode && targetMode.mode.identify.indexOf(player.role.role) != -1) {
                                            if (!targetMode.identifymsg) {
                                                mafia.sendPlayer(target.name, "±Game: You identified " + player.name + " as the " + mafia.theme.trrole(player.role.role) + " that tried to " + o.action + " you!");
                                            } else {
                                                mafia.sendPlayer(target.name, "±Game: " + targetMode.identifymsg.replace(/~Target~/g, player.name).replace(/~Role~/g, mafia.theme.trrole(player.role.role)).replace(/~Action~/g, o.action));
                                            }
                                        }
                                    }
                                    else if (targetMode.mode == "resistance") {
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
    
                            if (command == "distract") {
                                // enables custom distracter message
                                var distractCustomMsg = Action.distractmsg;
                                // "distractmsg" item under "night" { "distract" }
                                if (typeof distractCustomMsg == "string") {
                                    mafia.sendPlayer(target.name, "±Game: " + distractCustomMsg.replace(/~Distracter~/g, player.role.translation));
                                }
                                else {
                                    mafia.sendPlayer(target.name, "±Game: The " + player.role.translation + " came to you last night! You were too busy being distracted!");
                                }
                                mafia.removeTargets(target);
                                updateStalkTargets();
    
                                /* warn role / teammates */
                                var teamMsg = Action.teammsg;
                                // above defined "distract": { "teammsg": <string> }
                                if ("night" in target.role.actions) {
                                    for (var action in target.role.actions.night) {
                                        var team = getTeam(target.role, target.role.actions.night[action].common);
                                        for (var x in team) {
                                            if (team[x] != target.name) {
                                                // now we check if teammsg was defined for the role
                                                if (teamMsg === undefined) {
                                                    mafia.sendPlayer(team[x], "±Game: Your teammate was too busy with the " + player.role.translation + " during the night, you decided not to " + action + " anyone during the night!");
                                                }
                                                else if (typeof teamMsg == "string") {
                                                    mafia.sendPlayer(team[x], "±Game: " + teamMsg.replace(/~Distracter~/g, player.role.translation).replace(/~Action~/g, action));
                                                }
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
                                    mafia.sendPlayer(player.name, "±Info: " + target.name + " is sided with the " + revealedSide
                                    + "!!");
                                } else if (typeof Sight == "object") {
                                    var srole = randomSample(Sight);
                                    mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole((srole == "true") ? target.role.role : srole) + "!!");
                                } else if (targetMode.revealAs !== undefined) {
                                    if (typeof targetMode.revealAs == "string") {
                                        if (targetMode.revealAs == "*") {
                                            var rrole = Object.keys(mafia.players).map(getPlayerRoleId, mafia);
                                            mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(rrole[Math.floor(Math.random() * rrole.length)]) + "!!");
                                        } else {
                                            mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(targetMode.revealAs) + "!!");
                                        }
                                    } else if (Array.isArray(targetMode.revealAs)) {
                                        mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(targetMode.revealAs[Math.floor(Math.random() * targetMode.revealAs.length)]) + "!!");
                                    }
                                } else {
                                    mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + target.role.translation + "!!");
                                }
                            }
                            else if (command == "kill") {
                                if (!Action.msg) {
                                    var killMessage = mafia.theme.killusermsg ? mafia.theme.killusermsg : "±Game: You were killed during the night!";
                                    mafia.sendPlayer(target.name, needsBot(killMessage));
                                } else {
                                    mafia.sendPlayer(target.name, needsBot(Action.msg)); // custom kill message for the killer
                                }
                                mafia.kill(target);
                                nightkill = true;
                            }
                            else if (command == "poison") {
                                if (target.poisoned === undefined || target.poisonCount - target.poisoned >= finalPoisonCount) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was poisoned!");
                                    var team = getTeam(player.role, Action.common);
                                    for (var x in team) {
                                        if (team[x] != player.name) {
                                            mafia.sendPlayer(team[x], "±Game: Your target (" + target.name + ") was poisoned!");
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
                                        if (!Action.stalkmsg) {
                                            mafia.sendPlayer(player.name, "±Game: Your target (" + target + ") visited " + readable(visited, "and") + " this night!");
                                        } else {
                                            mafia.sendPlayer(player.name, needsBot(Action.stalkmsg).replace(/~Target~/gi, target).replace(/~Visit~/gi, readable(visited, "and")));
                                        }
                                    } else {
                                        if (!Action.novisitmsg) {
                                            mafia.sendPlayer(player.name, "±Game: Your target (" + target + ") didn't visit anyone this night!");
                                        } else {
                                            mafia.sendPlayer(player.name, needsBot(Action.novisitmsg).replace(/~Target~/gi, target));
                                        }
                                    }
                                }
                            }
                            else if (command == "convert") {
                                if ("canConvert" in Action && Action.canConvert != "*" && Action.canConvert.indexOf(target.role.role) == -1) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be converted!");
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
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be converted!");
                                    } else {
                                        mafia.setPlayerRole(target, newRole);
                                        if (!Action.silent) {
                                            if ("convertmsg" in Action) {
                                                sendChanAll("±Game: " + Action.convertmsg.replace(/~Target~/g, target.name).replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation), mafiachan);
                                            } else {
                                                sendChanAll("±Game: A " + oldRole.translation + " has been converted into a " + target.role.translation + "!", mafiachan);
                                            }
                                        }
                                        if (target !== player) {
                                            if ("usermsg" in Action) {
                                                mafia.sendPlayer(player.name, "±Game: " + Action.usermsg.replace(/~Target~/g, target.name).replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation), mafiachan);
                                            } else {
                                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") has been converted and is now a " + target.role.translation + "!");
                                            }
                                        }
                                        if (!Action.silentConvert) {
                                            mafia.sendPlayer(target.name, "±Game: You have been converted and changed roles!");
                                            mafia.showOwnRole(sys.id(target.name));
                                        }
                                    }
                                }
                            }
                            else if (command == "copy") {
                                if (typeof Action.copyAs == "string" && "canCopy" in Action && Action.canCopy != "*" && Action.canCopy.indexOf(target.role.role) == -1) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") can't be copied!");
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
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") can't be copied!");
                                    } else {
                                    mafia.setPlayerRole(player, newRole);
                                        if (!Action.silent) {
                                            if ("copymsg" in Action) {
                                                sendChanAll("±Game: " + Action.copymsg.replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Old~/g, oldRole.translation).replace(/~New~/g, player.role.translation), mafiachan);
                                            } else {
                                                sendChanAll("±Game: A " + oldRole.translation + " has been converted into a " + player.role.translation + "!", mafiachan);
                                            }
                                        }
                                        if (!Action.silentCopy) {
                                            mafia.sendPlayer(player.name, "±Game: You copied someone and changed roles!");
                                            mafia.showOwnRole(sys.id(player.name));
                                        }
                                    }
                                }
                            }
                            else if (command == "curse") {
                                if ("canCurse" in Action && Action.canCurse != "*" && Action.canCurse.indexOf(target.role.role) == -1) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be cursed!");
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
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be cursed!");
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was cursed!");
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
                                        if ("detoxmsg" in Action) {
                                            sendChanAll("±Game: " + Action.detoxmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Role~/g, player.role.translation), mafiachan);
                                        } else {
                                            sendChanAll("±Game: A player was cured of poison!", mafiachan);
                                        }
                                    }
                                    if ("msg" in Action) {
                                        mafia.sendPlayer(player.name,"±Game: " + Action.msg.replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation));
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was cured of poison!");
                                    }
                                    if ("targetmsg" in Action) {
                                        mafia.sendPlayer(target.name,"±Game: " + Action.targetmsg.replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation));
                                    } else {
                                        mafia.sendPlayer(target.name, "±Game: You were cured of poison!");
                                    }
                                } else {
                                    if ("failmsg" in Action) {
                                        mafia.sendPlayer(player.name,"±Game: " + Action.failmsg.replace(/~Target~/g, target.name));
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") isn't poisoned!");
                                    }
                                }
                            }
                            else if (command == "dispel") {
                                if (target.cursed !== undefined) {
                                    target.cursed =  undefined;
                                    if (!Action.silent) {
                                        if ("dispelmsg" in Action) {
                                            sendChanAll("±Game: " + Action.dispelmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Role~/g, player.role.translation), mafiachan);
                                        } else {
                                            sendChanAll("±Game: A player's curse was dispelled!", mafiachan);
                                        }
                                    }
                                    if ("msg" in Action) {
                                        mafia.sendPlayer(player.name,"±Game: " + Action.msg.replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation));
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was freed from their curse!");
                                    }
                                    if ("targetmsg" in Action) {
                                        mafia.sendPlayer(target.name,"±Game: " + Action.targetmsg.replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation));
                                    } else {
                                        mafia.sendPlayer(target.name, "±Game: You were freed from your curse!");
                                    }
                                } else {
                                    if ("failmsg" in Action) {
                                        mafia.sendPlayer(player.name,"±Game: " + Action.failmsg.replace(/~Target~/g, target.name));
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") isn't cursed!");
                                    }
                                }
                            } else if (command == "shield") {
                                target.redirectTo = player.name;
                                target.redirectActions = Action.shieldActions || "*";
                            } else if (command == "dummy" || command == "dummy2" || command == "dummy3") {
                                //Dummy actions to trigger modes without replacing useful commands. Great for large themes that want more freedom.
                                if (Action[command + "usermsg"]) {
                                    mafia.sendPlayer(player.name, needsBot(Action[command + "usermsg"]).replace(/~Self~/gi, player.name).replace(/~Target~/gi, target.name).replace(/~Role~/gi, player.role.translation).replace(/~TargetRole~/gi, target.role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side)).replace(/~TargetSide~/gi, mafia.theme.trside(target.role.side)));
                                }
                                if (Action[command + "targetmsg"]) {
                                    mafia.sendPlayer(target.name, needsBot(Action[command + "targetmsg"]).replace(/~Self~/gi, player.name).replace(/~Target~/gi, target.name).replace(/~Role~/gi, player.role.translation).replace(/~TargetRole~/gi, target.role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side)).replace(/~TargetSide~/gi, mafia.theme.trside(target.role.side)));
                                }
                                if (Action[command + "broadcastmsg"]) {
                                    sendChanAll(needsBot(Action[command + "broadcastmsg"]).replace(/~Self~/gi, player.name).replace(/~Target~/gi, target.name).replace(/~Role~/gi, player.role.translation).replace(/~TargetRole~/gi, target.role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side)).replace(/~TargetSide~/gi, mafia.theme.trside(target.role.side)), mafiachan);
                                }
                            }
    
                            //Post-Action effects here
                            if (revenge) {
                                mafia.sendPlayer(player.name, revengetext);
                                mafia.kill(player);
                                nightkill = true;
                                continue outer;
                            } else if (poisonrevenge > 0) {
                                if (player.poisoned === undefined || player.poisonCount - player.poisoned >= poisonrevenge) {
                                    mafia.sendPlayer(player.name, poisonrevengetext);
                                    player.poisoned = 1;
                                    player.poisonCount = poisonrevenge;
                                    player.poisonDeadMessage = poisonDeadMessage;
                                }
                            }
                        }
                    }
                    if ("suicideChance" in Action && mafia.isInGame(player.name) && targets.length > 0) {
                        if (Action.suicideChance > Math.random()) {
                            if ("suicidemsg" in Action) {
                                mafia.sendPlayer(player.name, "±Game: " + Action.suicidemsg);
                            } else {
                                mafia.sendPlayer(player.name, "±Game: You died while trying to " + o.action + " during this night!");
                            }
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
                var poisonCount = player.poisonCount;
                if (poisonCount !== undefined) {
                    if (player.poisoned < poisonCount) {
                        mafia.sendPlayer(player.name, "±Game: You have " + (player.poisonCount - player.poisoned) + " days to live.");
                        player.poisoned++;
                    } else if (player.poisoned >= poisonCount) {
                        mafia.sendPlayer(player.name, "±Game: " + (player.poisonDeadMessage ? player.poisonDeadMessage : "You died because of Poison!"));
                        mafia.kill(player);
                        nightkill = true; // kinda night kill
                    }
                }
                var curseCount = player.curseCount;
                if (curseCount !== undefined) {
                    if (player.cursed < curseCount) {
                        if (!player.silentCurse) {
                            mafia.sendPlayer(player.name, "±Game: You will convert in " + (player.curseCount - player.cursed) + " days.");
                        }
                        player.cursed++;
                    } else if (player.cursed >= curseCount) {
                        if (player.curseConvertMessage) {
                            sendChanAll("±Game: " + player.curseConvertMessage.replace(/~Target~/g, player.name).replace(/~Player~/g, player.name).replace(/~Old~/g, player.role.translation).replace(/~New~/g, mafia.theme.roles[player.cursedRole].translation), mafiachan);
                            player.curseConvertMessage = undefined;
                        }
                        player.curseCount = undefined;
                        mafia.setPlayerRole(player, player.cursedRole);
                        if (!player.silentCurse) {
                            mafia.sendPlayer(player.name, "±Game: Your curse took effect and you changed roles!");
                            mafia.showOwnRole(sys.id(player.name));
                        }
                    }
                }
            }
            if (!nightkill) {
                sendChanAll("No one died! :", mafiachan);
            }
            mafia.runusersToSlay();
            mafia.runusersToSlayMsg();
            mafia.usersToSlay = {};
            mafia.reduceRecharges();
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
            sendChanAll("±Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("±Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            if (mafia.theme.closedSetup !== true) {
                // Send players all roles sided with them
                for (p in mafia.players) {
                    player = mafia.players[p];
                    var side = player.role.side;
                    mafia.sendPlayer(player.name, "±Current Team: " + mafia.getRolesForTeamS(side));
                }
            }
            mafia.time.days++;
            mafia.state = "standby";
            
            sendChanAll("±Time: Day " + mafia.time.days, mafiachan);
            sendChanAll("You have " + mafia.ticks + " seconds to debate who are the bad guys! :", mafiachan);
            for (var role in mafia.theme.standbyRoles) {
                names = mafia.getPlayersForRole(mafia.theme.standbyRoles[role]);
                for (j = 0; j < names.length; ++j) {
                    for (var k in mafia.players[names[j]].role.actions.standby) {
                        if (mafia.players[names[j]].role.actions.standby[k].msg) {
                            mafia.sendPlayer(names[j], mafia.players[names[j]].role.actions.standby[k].msg);
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
            mafia.runusersToSlay();
            mafia.runusersToSlayMsg();
            mafia.usersToSlay = {};
            if (mafia.testWin()) {
                return;
            }
            sendChanAll(border, mafiachan);
            sendChanAll("±Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("±Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            
            
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
                    mafia.sendPlayer(player.name, "±Current Team: " + mafia.getRolesForTeamS(side));
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
                sendChanAll("±Time: Day " + mafia.time.days, mafiachan);
                sendChanAll("It's time to vote someone off, type /Vote [name], you only have " + mafia.ticks + " seconds! :", mafiachan);
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
                
                sendChanAll("±Time: Night " + mafia.time.nights, mafiachan);
                sendChanAll("Make your moves, you only have " + mafia.ticks + " seconds! :", mafiachan);
                sendChanAll(border, mafiachan);
                mafia.resetTargets();
            }
        },
        day: function () {
            sendChanAll(border, mafiachan);
            sendChanAll("Times Up! :", mafiachan);
            
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

            if (tie) {
                sendChanAll("No one was voted off! :", mafiachan);
                mafia.runusersToSlay();
                mafia.runusersToSlayMsg();
                mafia.usersToSlay = {};
                if (mafia.testWin()) {
                    return;
                }
                sendChanAll(border, mafiachan);
            } else {
                var lynched = mafia.players[downed];
                if ("lynch" in lynched.role.actions) {
                    var lyn = lynched.role.actions.lynch;
                    var targetRoles, targetPlayers, r, k, target, affected, singleAffected, actionMessage = false;
                    if ("killRoles" in lyn) {
                        targetRoles = lyn.killRoles;
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
                                if ("singlekillmsg" in lyn) {
                                    singleAffected = singleAffected.concat(affected);
                                } else {
                                    actionMessage = lyn.killmsg ? lyn.killmsg : "±Kill: Because ~Self~ was lynched, ~Target~ (~Role~) died!";
                                    sendChanAll(needsBot(actionMessage, "Kill").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r])), mafiachan);
                                }
                            }
                        }
                        if (singleAffected.length > 0) {
                            sendChanAll(needsBot(lyn.singlekillmsg, "Kill").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
                        }
                    }
                    if ("killVoters" in lyn) {
                        var first = lyn.killVoters.first || 1,
                            last =  lyn.killVoters.last || 0,
                            votersList = voters[downed].concat();
                            
                        if (votersList.indexOf(downed) !== -1) {
                            votersList.splice(votersList.indexOf(downed), 1);
                        }
                        votersList = removeDuplicates(votersList.slice(0, first).concat(votersList.slice(-last)));
                        
                        actionMessage = lyn.killVoters.message ? lyn.killVoters.message : "~Target~ died for having voted for ~Self~!";
                        sendChanAll(needsBot(actionMessage).replace(/~Self~/g, lynched.name).replace(/~Target~/g, readable(votersList, "and")), mafiachan);
                        for (r in votersList) {
                            target = votersList[r];
                            if (this.isInGame(target)) {
                                mafia.kill(this.players[target]);
                            }
                        }
                    }
                    if ("poisonRoles" in lyn) {
                        targetRoles = lyn.poisonRoles;
                        singleAffected = [];
                        for (r in targetRoles) {
                            var count;
                            targetPlayers = this.getPlayersForRole(r);
                            affected = [];
                            for (k = 0; k < targetPlayers.length; ++k) {
                                target = this.players[targetPlayers[k]];
                                count = lyn.poisonRoles[r];
                                if (target.poisoned === undefined || target.poisonCount - target.poisoned >= (count ? count : 2)) {
                                    target.poisoned = 1;
                                    target.poisonCount = count || 2;
                                    target.poisonDeadMessage = lyn.poisonDeadMessage;
                                    affected.push(targetPlayers[k]);
                                }
                            }
                            if (affected.length > 0) {
                                if ("singlepoisonmsg" in lyn) {
                                    singleAffected = singleAffected.concat(affected);
                                } else {
                                    actionMessage = lyn.poisonmsg ? lyn.poisonmsg : "±Game: Because ~Self~ was lynched, the ~Role~ was poisoned!";
                                    sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(r)).replace(/~Count~/, count), mafiachan);
                                }
                            }
                        }
                        if (singleAffected.length > 0) {
                            sendChanAll((needsBot(lyn.singlepoisonmsg).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and"))), mafiachan);
                        }
                    }
                    if ("convertRoles" in lyn) {
                        targetRoles = lyn.convertRoles;
                        singleAffected = [];
                        for (r in targetRoles) {
                            var newRole = lyn.convertRoles[r];
                            targetPlayers = this.getPlayersForRole(r);
                            affected = [];
                            for (k = 0; k < targetPlayers.length; ++k) {
                                if (this.players[targetPlayers[k]] != player) {
                                    affected.push(targetPlayers[k]);
                                    target = this.players[targetPlayers[k]];
                                    mafia.setPlayerRole(target, newRole);
                                    if (!lyn.silentConvert) {
                                        mafia.showOwnRole(sys.id(targetPlayers[k]));
                                    }
                                }
                            }
                            if (affected.length > 0) {
                                if ("singleconvertmsg" in lyn) {
                                    singleAffected = singleAffected.concat(affected);
                                } else {
                                    actionMessage = lyn.convertmsg ? lyn.convertmsg : "±Game: Because ~Self~ was lynched, the ~Old~ became a ~New~!";
                                    sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/, mafia.theme.trrole(newRole)), mafiachan);
                                }
                            }
                        }
                        if (singleAffected.length > 0) {
                            sendChanAll(needsBot(lyn.singleconvertmsg).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
                        }
                    }
                    if ("curseRoles" in lyn) {
                        targetRoles = lyn.curseRoles;
                        singleAffected = [];
                        for (r in targetRoles) {
                            var cursedRole = lyn.curseRoles[r], count = lyn.curseCount;
                            targetPlayers = this.getPlayersForRole(r);
                            affected = [];
                            for (k = 0; k < targetPlayers.length; ++k) {
                                if (this.players[targetPlayers[k]] != player) {
                                    affected.push(targetPlayers[k]);
                                    target = this.players[targetPlayers[k]];
                                    target.cursedRole = cursedRole;
                                    target.cursed = 1;
                                    target.curseCount = count || 2;
                                    target.curseConvertMessage = lyn.curseConvertMessage;
                                    target.silentCurse = lyn.silentCurse || false;
                                }
                            }
                            if (affected.length > 0) {
                                if ("singlecursemsg" in lyn) {
                                    singleAffected = singleAffected.concat(affected);
                                } else {
                                    actionMessage = lyn.cursemsg ? lyn.cursemsg : "±Game: Because ~Self~ was lynched, the ~Old~ got cursed and will become a ~New~ soon!";
                                    sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/g, mafia.theme.trrole(cursedRole)).replace(/~Count~/g, count || 2), mafiachan);
                                }
                            }
                        }
                        if (singleAffected.length > 0) {
                            sendChanAll(needsBot(lyn.singlecursemsg).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), mafiachan);
                        }
                    }
                    if ("exposeRoles" in lyn) {
                        targetRoles = lyn.exposeRoles;
                        for (r = 0; r < targetRoles.length; ++r) {
                            targetPlayers = this.getPlayersForRole(targetRoles[r]);
                            if (targetPlayers.length > 0) {
                                actionMessage = lyn.exposemsg ? lyn.exposemsg : "±Game: Before getting lynched, ~Self~ revealed ~Target~ as the ~Role~!";
                                sendChanAll(needsBot(actionMessage).replace(/~Self~/g, player.name).replace(/~Target~/g, readable(targetPlayers, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r])), mafiachan);
                            }
                        }
                    }
                }
                
                if ("lynch" in lynched.role.actions && "convertTo" in lynched.role.actions.lynch) {
                    var newRole = lynched.role.actions.lynch.convertTo;
                    if ("lynchmsg" in lynched.role.actions.lynch) {
                         sendChanAll("±Game: " + lynched.role.actions.lynch.lynchmsg.replace(/~Self~/g, downed).replace(/~Old~/g, lynched.role.translation).replace(/~New~/g, mafia.theme.trrole(newRole)).replace(/~Count~/g, Math.round(maxi * 100) / 100), mafiachan);
                    } else if ("convertmsg" in lynched.role.actions.lynch && !("convertRoles" in lynched.role.actions.lynch)) {
                         sendChanAll("±Game: " + lynched.role.actions.lynch.convertmsg.replace(/~Self~/g, downed).replace(/~Old~/g, lynched.role.translation).replace(/~New~/g, mafia.theme.trrole(newRole)).replace(/~Count~/g, Math.round(maxi * 100) / 100), mafiachan);
                    }  else {
                        sendChanAll("±Game: " + downed + ", the " + lynched.role.translation + " survived the lynch and became a " + mafia.theme.trrole(newRole) + "!", mafiachan);
                    }
                    mafia.setPlayerRole(lynched, newRole);
                    mafia.showOwnRole(sys.id(downed));
                } else {
                    var roleName = typeof mafia.players[downed].role.actions.lynch == "object" && typeof mafia.players[downed].role.actions.lynch.revealAs == "string" ? mafia.theme.trrole(mafia.players[downed].role.actions.lynch.revealAs) : mafia.players[downed].role.translation;
                    var lynchmsg = mafia.theme.lynchmsg ? mafia.theme.lynchmsg : "±Game: ~Player~ (~Role~) was removed from the game!";
                    sendChanAll(needsBot(lynchmsg).replace(/~Player~/g, downed).replace(/~Role~/g, roleName).replace(/~Side~/g, mafia.theme.trside(mafia.players[downed].role.side)).replace(/~Count~/g, Math.round(maxi * 100) / 100), mafiachan);
                    if (!("lynch" in lynched.role.actions)){
                        mafia.actionBeforeDeath(lynched);
                    }
                    mafia.removePlayer(mafia.players[downed]);
                }
                
                mafia.runusersToSlay();
                mafia.runusersToSlayMsg();
                mafia.usersToSlay = {};
                mafia.onDeadRoles();
                if (mafia.testWin()) {
                    return;
                }
                sendChanAll(border, mafiachan);
            }
            
            sendChanAll("±Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("±Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);

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
                    mafia.sendPlayer(player.name, "±Current Team: " + mafia.getRolesForTeamS(side));
                }
            }

            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.night;
            }

            mafia.time.nights++;
            mafia.state = "night";

            sendChanAll("±Time: Night " + mafia.time.nights, mafiachan);
            sendChanAll("Make your moves, you only have " + mafia.ticks + " seconds! :", mafiachan);
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
                sendChanAll("±Game: Theme " + this.themeManager.themes[winner.theme].name + " won with " + winner.votes + " votes!", mafiachan);
                sendChanAll("±Game: Type /Join to enter the game!", mafiachan);
                sendChanAll("", mafiachan);
                this.startGame(null, winner.theme);
                this.signups = players[winner.theme];
                this.ips = ips[winner.theme];
                mafia.ticks = 40;
                sendChanAll("±Game: " + this.signups.join(", ") + " joined the game!", mafiachan);
                for (var x = 0; x < this.signups.length; x++) {
                    if (SESSION.users(sys.id(this.signups[x]))) {
                        if (SESSION.users(sys.id(this.signups[x])).smute.active) {
                            mafia.shoveUser("Murkrow", this.signups[x], true);
                        }
                    }
                }
            } else {
                sendChanAll("±Game: Really? No votes, so no game.", mafiachan);
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
    this.showOwnRole = function (src) {
        var name = sys.name(src);
        if (mafia.state != "blank" && mafia.state != "entry") {
            if (mafia.isInGame(name)) {
                var player = mafia.players[name];
                var role = player.role;

                if (typeof role.actions.startup == "object" && typeof role.actions.startup.revealAs == "string") {
                    mafia.sendPlayer(player.name, "±Game: You are a " + mafia.theme.trrole(role.actions.startup.revealAs) + "!");
                } else {
                    if (typeof role.startupmsg == "string") {
                        mafia.sendPlayer(player.name, needsBot(role.startupmsg, "Game").replace(/~Role~/gi, role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side)));
                    } else {
                        mafia.sendPlayer(player.name, "±Game: You are a " + role.translation + "!");
                    }
                }
                mafia.sendPlayer(player.name, "±Game: " + role.help.replace(/~Side~/gi, mafia.theme.trside(player.role.side)));

                if (role.actions.startup == "team-reveal") {
                    mafia.sendPlayer(player.name, "±Game: Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                }
                if (role.actions.startup == "team-reveal-with-roles") {
                    var playersRole = mafia.getPlayersForTeam(role.side).map(name_trrole, mafia.theme);
                    mafia.sendPlayer(player.name, "±Game: Your team is " + readable(playersRole, "and") + ".");
                }
                if (typeof role.actions.startup == "object" && Array.isArray(role.actions.startup["team-revealif"])) {
                    if (role.actions.startup["team-revealif"].indexOf(role.side) != -1) {
                        mafia.sendPlayer(player.name, "±Game: Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                    }
                }
                if (typeof role.actions.startup == "object" && Array.isArray(role.actions.startup["team-revealif-with-roles"])) {
                    if (role.actions.startup["team-revealif-with-roles"].indexOf(role.side) != -1) {
                        var playersRole = mafia.getPlayersForTeam(role.side).map(name_trrole, mafia.theme);
                        mafia.sendPlayer(player.name, "±Game: Your team is " + readable(playersRole, "and") + ".");
                    }
                }
                if (role.actions.startup == "role-reveal") {
                    mafia.sendPlayer(player.name, "±Game: People with your role are " + mafia.getPlayersForRoleS(role.role) + ".");
                }

                if (typeof role.actions.startup == "object") {
                    if (role.actions.startup.revealRole) {
                        if (typeof role.actions.startup.revealRole == "string") {
                            if (mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) !== "")
                                mafia.sendPlayer(player.name, "±Game: The " + mafia.theme.roles[role.actions.startup.revealRole].translation + " is " + mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) + "!");
                        } else if (Array.isArray(role.actions.startup.revealRole)) {
                            for (var s = 0, l = role.actions.startup.revealRole.length; s < l; ++s) {
                                var revealrole = role.actions.startup.revealRole[s];
                                if (mafia.getPlayersForRoleS(revealrole) !== "")
                                    mafia.sendPlayer(player.name, "±Game: The " + mafia.theme.roles[revealrole].translation + " is " + mafia.getPlayersForRoleS(revealrole) + "!");
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
                        msg = "revealPlayersMsg" in role.actions.startup ? role.actions.startup.revealPlayersMsg : msg;
                        mafia.sendPlayer(player.name, "±Game: " + msg.replace(/~Players~/g, list));
                    }
                }
            } else {
                sys.sendMessage(src, "±Game: You are not in the game!", mafiachan);
            }
        } else {
            sys.sendMessage(src, "±Game: No game running!", mafiachan);
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
        if (this.state == "entry" || this.state == "voting") {
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
                sys.sendMessage(src, "±Slay: " + player.name + " is already going to be slain after the phase ends!", mafiachan);
                return;
            }
            sendChanAll("±Slay: " + player.name + " will be slain by " + slayer + " after the phase ends!", mafiachan);
            var player = this.players[name],
                role = player.role;
            mafia.usersToSlay[name] = [slayer, role];
            return;
        }
        msg(src, "No such target.");
    };
    
    this.slayUserMsg = function (src, name, role) {
        var slayer = typeof src == "string" ? src : sys.name(src);
        dualBroadcast("±Slay: " + name + " (" + role.translation + ") was slain by " + nonFlashing(slayer) + "!");
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

    this.shoveUser = function (src, name, silent) {
        var shover = typeof src == "string" ? src : sys.name(src);
        if (this.state == "entry" || this.state == "voting") {
            for (var i = 0; i < this.signups.length; ++i) {
                if (name.toLowerCase() == this.signups[i].toLowerCase()) {
                    if (!silent) {
                        msgAll(" " + this.signups[i] + " was taken out from the game by " + nonFlashing(shover) + "!");
                        mafiabot.sendAll(" " + this.signups[i] + " was taken out from the game by " + nonFlashing(shover) + "!", sachannel);
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
            "/playedgames: To view recently played games",
            "/topthemes: To view top themes. Default amount is 10, however other numbers can be used (higher numbers may cause lag)",
            "/windata: To view the win data of a theme",
            "/update: To update a Mafia Theme!",
            "/featured: To view the currently featured Mafia Theme"],
        ma: ["/slay: To slay users in a Mafia game.",
            "/shove: To remove users before a game starts.",
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
        sma: ["/aliases: To check a user's known alts.",
            "/push: To force a user into the current theme during sign ups.",
            "/remove: To remove a Mafia Theme!",
            "/mafiaadmin: To promote a user to Mafia Admin. Use /smafiaadmin for a silent promotion.",
            "/mafiaadminoff: To strip a user of all Mafia authority. Use /smafiaadminoff for a silent demotion.",
            "/updateafter: To update mafia after current game!",
            "/updatestats: To update the mafia stats webpage (Use after mafiastat script changes)",
            "/featuretheme: To change the currently featured theme (Leave blank to disable Feature Themes)",
            "/featuretext: To set a customizable message that follows the Featured theme (Leave blank to clear).",
            "/featurelink: To change the link used for Featured Theme Text. (Leave blank to clear)",
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
        if (channel != mafiachan && ["mafiaban", "mafiaunban", "mafiabans", "mafiaadmins", "madmins", "mas", "roles", "priority", "sides", "themeinfo", "readlog", "targetlog", "disable", "enable", "enablenonpeak", "disablenonpeak", "mafiarules", "mafiaadminoff", "mafiaadmin", "mafiasadmin", "mafiasuperadmin", "mafiasuperadminoff", "smafiaadmin", "smafiasuperadmin", "smafiaadminoff", "smafiasuperadminoff", "passma", "windata", "topthemes", "updatestats"].indexOf(command) === -1)
            return;
        try {
            mafia.handleCommandOld(src, command, commandData, channel);
            return true;
        } catch (e) {
            if (e != "no valid command") {
                sendChanAll("Error on mafia command: " + e + (e.lineNumber ? " on line " + e.lineNumber : ""), mafiachan);
                return true;
            }
        }
    };
    this.invalidName = function (src) {
        var name = sys.name(src);
        for (var x = 0; x < name.length; x++) {
            var code = name.charCodeAt(x);
            if (name[x] != ' ' && name[x] != '.' && (code < 'a'.charCodeAt(0) || code > 'z'.charCodeAt(0))
                && (code < 'A'.charCodeAt(0) || code > 'Z'.charCodeAt(0)) && name[x] != '-' && name[x] != '_' && name[x] != '<' && name[x] != '>' && (code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0))) {
                sys.sendMessage(src, "±Name: You're not allowed to have the following character in your name: " + name[x] + ".", mafiachan);
                sys.sendMessage(src, "±Rule: You must change it if you want to play!", mafiachan);
                return true;
            }
        }
        
        if (name.length > Config.Mafia.max_name_length) {
            sys.sendMessage(src, "±Name: You're not allowed to have more than " + Config.Mafia.max_name_length + " letters in your name!", mafiachan);
            sys.sendMessage(src, "±Rule: You must change it if you want to join!", mafiachan);
            return true;
        }
    };
    this.canJoin = function (src) {
        if (this.isInGame(sys.name(src))) {
            sys.sendMessage(src, "±Game: You already joined!", mafiachan);
            return;
        }
        if (this.ips.indexOf(sys.ip(src)) != -1) {
            sys.sendMessage(src, "±Game: This IP is already in list. You cannot register two times!", mafiachan);
            return;
        }
        if (SESSION.users(src).mute.active) {
            sys.sendMessage(src, "±Game: You are muted!", mafiachan);
            return;
        }
        if (SESSION.users(src).android === true) {
            sys.sendMessage(src, "±Game: Android users can not play mafia!", mafiachan);
            return;
        }
        if (!sys.dbRegistered(sys.name(src))) {
            sys.sendMessage(src, "±Game: You need to register to play mafia here! Click on the 'Register' button below and follow the instructions!", mafiachan);
            return;
        }
        if (this.numjoins[sys.ip(src)] >= 2) {
            sys.sendMessage(src, "±Game: You can't join/unjoin more than 3 times!", mafiachan);
            return;
        }
        if (this.invalidName(src)) {
            return;
        }
        /* Requirement of laddering before joining..
        if ((sys.auth(src) == 0) && sys.ratedBattles(src) == 0 ||
            (sys.ranking(src) <= 1000 && sys.ratedBattles(src) < 5) ||
            SESSION.users(src).smute.active) {
            sys.sendMessage(src, "±Game: You need to ladder before playing mafia!", mafiachan);
            return;
        } */
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
    this.showRules = function(src, channel) {
        var mrules = [
            "",
            " Game Rules: ",
            "±Rules: All server rules apply in this channel. Type /rules to view them.",
            "±Rules: After you have died, don't discuss the game with anyone else in the game. This is also known as 'deadtalking'.",
            "±Rules: Do not quote any of the game bots. This includes in private messages.",
            "±Rules: Do not copy other peoples' names or make your name similar to someone else's.",
            "±Rules: Make sure you can stay active for the entire game if you join. If you must leave, ask a Mafia Admin for a ''slay'' in the game chat. Leaving without asking for a slay will result in punishment.",
            "±Rules: If you ask to be removed from a game (slain), do not join the next game. Do not attempt to get yourself killed or go inactive because you don't like your role.",
            "±Rules: A valid reason must be given for a slay. Being in a tour, not paying attention, not liking your role, and not liking your teammates are not valid reasons.",
            "±Rules: Do not attempt to get your teammate removed from the game without their consent.",
            "±Rules: Do not reveal any members of your team for any reason. This includes publicly stating that someone teamvoted or teamkilled.",
            "±Rules: Do not target a certain user or group of users repeatedly.",
            "±Rules: Do not stall the game for any reason.",
            "±Rules: Only team up with players from another team if it is the only way to achieve your team's win condition.",
            "±Rules: Do not flash multiple people needlessly, including trying to get them to play. If they wish to play, they will join of their own will.",
            "±Rules: Do not insult themes. If you have a legitimate complaint about a certain theme, post it in that theme's forum thread.",
            "±Rules: Do not insult players if they make a mistake. Helping them to learn the game instead of insulting them will make the game a lot more enjoyable for all.",
            "±Rules: If you choose to play on Android, you are not able to use it to justify rule breaking.",
            "±Rules: Mafia is a game that involves heavy communication. Do not disable private messages (PMs) if you wish to play Mafia, else you may ruin the game for others.",
            "±Rules: Do not attempt to ruin the game by any other means.",
            "±Rules: Mafia Admins, or MAs are here for the benefit of the channel. If you are asked to do something by an MA, it is advised you do so.",
            "±Rules: PM an MA to report an instance of rulebreaking. Shouting out \"BAN\" and \"teamvote!\" and such in the chat is pointless and disrupts the game. You can use /mafiaadmins or /madmins to get a listing of who is an MA.",
            "±Rules: Just because someone else breaks a rule, it does not justify you breaking the same rule.",
            "±Rules: Ignorance of the rules does not justify breaking them.",
            ""
        ];
        dump(src, mrules, channel);
    };
    this.handleCommandOld = function (src, command, commandData, channel) {
        var name, x, player, target;
        if (this.state == "entry") {
            if (command == "join") {
                if (this.canJoin(src) !== true) {
                    return;
                }
                name = sys.name(src);
                if (this.signups.length >= this.theme["roles" + this.theme.roleLists].length){
                    sys.sendMessage(src, "±Game: This theme only supports a maximum of " + this.theme["roles" + this.theme.roleLists].length + " players!", mafiachan);
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
                    sys.sendMessage(src, "±Game: " + name + " joined the game!", mafiachan);
                    mafia.shoveUser("Murkrow", sys.name(src), true);
                } else {
                    sendChanAll("±Game: " + name + " joined the game!", mafiachan);
                }
                if (name in this.usersToShove) {
                    var name = name;
                    var shover = this.usersToShove[name];
                    this.shoveUser(shover, name, false);
                }
                if (this.signups.length == this.theme["roles" + this.theme.roleLists].length) {
                    this.ticks = 1;
                }
                return;
            }
            if (command == "unjoin") {
                if (this.isInGame(sys.name(src))) {
                    name = sys.name(src);
                    delete this.ips[this.ips.indexOf(sys.ip(src))];
                    this.signups.splice(this.signups.indexOf(name), 1);
                    sendChanAll("±Game: " + name + " unjoined the game!", mafiachan);
                    return;
                } else {
                    sys.sendMessage(src, "±Game: You haven't even joined!", mafiachan);
                    return;
                }
            }
        } else if (this.state == "night") {
            name = sys.name(src);
            if (this.isInGame(name) && this.hasCommand(name, command, "night")) {
                commandData = this.correctCase(commandData);
                player = mafia.players[name];
                if (commandData == '*' && ["OnlySelf"].indexOf(player.role.actions.night[command].target) !== -1) {
                    commandData = name;
                }
                else if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Hint: That person is not playing!", mafiachan);
                    return;
                }
                target = mafia.players[commandData];

                this.addPhaseStalkAction(name, command, target.name);

                if (["Any", "Self", "OnlySelf"].indexOf(player.role.actions.night[command].target) == -1 && commandData == name) {
                    sys.sendMessage(src, "±Hint: Nope, this wont work... You can't target yourself!", mafiachan);
                    return;
                } else if (player.role.actions.night[command].target == "OnlySelf" && commandData != name) {
                    sys.sendMessage(src, "±Hint: You can only use this action on yourself!", mafiachan);
                    return;
                } else if (player.role.actions.night[command].target == 'AnyButTeam' && player.role.side == target.role.side
                 || player.role.actions.night[command].target == 'AnyButRole' && player.role.role == target.role.role) {
                    sys.sendMessage(src, "±Hint: Nope, this wont work... You can't target your partners!", mafiachan);
                    return;
                }

                var recharge = mafia.getRecharge(player, "night", command);
                if (recharge !== undefined && recharge > 0) {
                    sys.sendMessage(src, "±Game: You cannot use this action for " + recharge + " night(s)!", mafiachan);
                    return;
                }
                var charges = mafia.getCharges(player, "night", command);
                if (charges !== undefined && charges === 0) {
                    sys.sendMessage(src, "±Game: You are out of uses for this action!", mafiachan);
                    return;
                }
                if ((player.restrictions.indexOf(command) != -1) || (this.roleRestrictions[player.role.role] && this.roleRestrictions[player.role.role].indexOf(command) != -1) || (this.teamRestrictions[player.role.side] && this.teamRestrictions[player.role.side].indexOf(command) != -1)) {
                    sys.sendMessage(src, "±Game: You cannot use this action during this night!", mafiachan);
                    return;
                }
                sys.sendMessage(src, "±Game: You have chosen to " + command + " " + commandData + "!", mafiachan);
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
                            this.sendPlayer(team[x], needsBot(broadcastmsg).replace(/~Player~/g, name).replace(/~Target~/g, commandData).replace(/~Action~/, command).replace(/~Role~/, player.role.translation));
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
                                this.sendPlayer(haxPlayer, "±Game: The " + roleName + " are going to " + command + " " + commandData + "!");
                            } else {
                                this.sendPlayer(haxPlayer, "±Game: The " + roleName + " is going to " + command + " " + commandData + "!");
                            }
                            haxTypes.push("revealTeam");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealPlayer) {
                            if (team.length > 1) {
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is one of The " + roleName + "!");
                            } else {
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is The " + roleName + "!");
                            }
                            haxTypes.push("revealPlayer");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealRole) {
                            this.sendPlayer(haxPlayer, "±Game: " + name + " is " + playerRole + "!");
                            haxTypes.push("revealRole");
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
        } else if (this.state == "day") {
            if (this.isInGame(sys.name(src)) && command == "vote") {
                commandData = this.correctCase(commandData);
                var silentVote = mafia.theme.silentVote;
                name = sys.name(src);
                if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                    return;
                }
                if (name in this.votes) {
                    sys.sendMessage(src, "±Rule: You already voted!", mafiachan);
                    return;
                }
                if (mafia.players[name].role.actions && mafia.players[name].role.actions.noVote === true) {
                    sys.sendMessage(src, "±Game: " + (mafia.players[name].role.actions.noVoteMsg ? mafia.players[name].role.actions.noVoteMsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData) : "You cannot vote!"), mafiachan);
                    this.votes[name] = null;
                    this.voteCount += 1;
                    return;
                }
                if (silentVote !== undefined && silentVote !== false) {
                    sys.sendMessage(src, "±Game: You voted for " + commandData + "!", mafiachan);
                    sendChanAll("±Game: " + name + " voted!", mafiachan);
                } else {
                    var votemsg = mafia.theme.votemsg ? mafia.theme.votemsg : "~Player~ voted for ~Target~!";
                    if ((votemsg.indexOf("~Target~") === -1) || (votemsg.indexOf("~Player~") === -1) )
                        sys.sendMessage(src, "±Game: You voted for " + commandData + "!", mafiachan);
                    sendChanAll("±Game: " + votemsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData), mafiachan);
                }
                this.addPhaseStalkAction(name, "vote", commandData);
                this.votes[sys.name(src)] = commandData;
                this.voteCount += 1;

                if (this.voteCount == Object.keys(mafia.players).length) {
                    mafia.ticks = 1;
                } else if (mafia.ticks < 8 && (mafia.theme.votesniping === undefined || mafia.theme.votesniping === false)) {
                    mafia.ticks = 8;
                }
                return;
            }
        } else if (mafia.state == "standby") {
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
                        sys.sendMessage(src, "±Hint: Nope, this wont work... You can't target yourself!", mafiachan);
                        return;
                    } else if (commandObject.target == 'AnyButTeam' && player.role.side == target.role.side
                        || commandObject.target == 'AnyButRole' && player.role.role == target.role.role) {
                        sys.sendMessage(src, "±Hint: Nope, this wont work... You can't target your partners!", mafiachan);
                        return;
                    }
                }
                this.addPhaseStalkAction(name, command, commandData);

                var recharge = mafia.getRecharge(player, "standby", commandName);
                if (recharge !== undefined && recharge > 0) {
                    sys.sendMessage(src, "±Game: You cannot use this action for " + recharge + " day(s)!", mafiachan);
                    return;
                }
                
                var charges = mafia.getCharges(player, "standby", commandName);
                if (charges !== undefined && charges === 0) {
                    sys.sendMessage(src, "±Game: You are out of uses for this action!", mafiachan);
                    return;
                }
                
                var dayChargesMessage = function(player, commandName, action) {
                    if (mafia.getCharges(player, "standby", commandName) !== undefined) {
                        var charge = mafia.getCharges(player, "standby", commandName);
                        var chargetxt = "You have " + charge + " charges remaining";
                        if (action.chargesmsg) {
                            chargetxt = action.chargesmsg.replace(/~Charges~/g, charge);
                        }
                        mafia.sendPlayer(player.name, "±Game: " + chargetxt);
                    }
                };
                    
                if (command == "kill") {
                    if (player.dayKill >= (commandObject.limit || 1)) {
                        sys.sendMessage(src, "±Game: You already killed!", mafiachan);
                        return;
                    }
                    if (target === null) {
                        sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                        return;
                    }
                    var revenge = false;
                    if (target.role.actions.hasOwnProperty("daykill")) {
                        if (target.role.actions.daykill == "evade") {
                            if (target.role.actions.daykillevademsg !== undefined && typeof target.role.actions.daykillevademsg == "string") {
                                sys.sendMessage(src, needsBot(target.role.actions.daykillevademsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), "Game"), mafiachan);
                                return;
                            } else {
                                sys.sendMessage(src, "±Game: That person cannot be killed right now!", mafiachan);
                                return;
                            }
                        } else if (target.role.actions.daykill == "revenge" || target.role.actions.daykill == "bomb" || (typeof target.role.actions.daykill.mode == "object" && "revenge" in target.role.actions.daykill.mode && target.role.actions.daykill.mode.revenge.indexOf(player.role.role) != -1)) {
                            revenge = true;
                        } else if (typeof target.role.actions.daykill.mode == "object" && target.role.actions.daykill.mode.evadeChance > sys.rand(0, 100) / 100) {
                            if (player.role.actions.daykillmissmsg !== undefined && typeof player.role.actions.daykillmissmsg == "string") {
                                sys.sendMessage(src, needsBot(player.role.actions.daykillmissmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), "Game"), mafiachan);
                            } else {
                                sys.sendMessage(src, "±Game: Your kill was evaded!", mafiachan);
                            }
                            if (target.role.actions.daykill.mode.evasionmsg !== undefined && typeof target.role.actions.daykill.mode.evasionmsg == "string") {
                                sys.sendMessage(sys.id(target.name), needsBot(target.role.actions.daykill.mode.evasionmsg.replace(/~Target~/g, name).replace(/~Self~/g, commandData), "Game"), mafiachan);
                            } else {
                                sys.sendMessage(sys.id(target.name), "±Game: You evaded a kill!", mafiachan);
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
                                if (targetMode.msg) {
                                    mafia.sendPlayer(player.name, needsBot(targetMode.msg.replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation), "Game"));
                                } else {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded your " + commandName + "!");
                                }
                                if (targetMode.targetmsg) {
                                    mafia.sendPlayer(target.name, needsBot(targetMode.targetmsg.replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation), "Game"));
                                } else {
                                    mafia.sendPlayer(target.name, "±Game: You evaded a " + commandName + "!");
                                }
                                return;
                            }
                            return;
                        }
                    }
                    sendChanAll(border, mafiachan);
                    if (!revenge) {
                        sendChanAll(needsBot(commandObject.killmsg).replace(/~Self~/g, name).replace(/~Target~/g, commandData).replace(/~Role~/g, mafia.players[name].role.translation).replace(/~TargetRole~/g, mafia.players[commandData].role.translation), mafiachan);
                        if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0, 100) / 100) {
                            if (commandObject.revealmsg !== undefined && typeof commandObject.revealmsg == "string") {
                                sendChanAll(needsBot(commandObject.revealmsg.replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), "Game"), mafiachan);
                            } else {
                                sendChanAll("±Game: While attacking, " + name + " (" + mafia.players[name].role.translation + ") made a mistake and was revealed!", mafiachan);
                            }
                        }
                        if ("daykill" in target.role.actions && target.role.actions.daykill === "revealkiller") {
                            if ("daykillrevengemsg" in target.role.actions) {
                                sendChanAll(needsBot(target.role.actions.daykillrevengemsg.replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), "Game"), mafiachan);
                            } else {
                                sendChanAll("±Game: Before dying, " + target.name + " revealed that " + name + " is the " + mafia.players[name].role.translation + "!", mafiachan);
                            }
                        }
                        player.dayKill = player.dayKill + 1 || 1;
                        if (sys.id('PolkaBot') !== undefined) {
                            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+target.name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[commandData]);
                    } else {
                        if (target.role.actions.daykillrevengemsg !== undefined && typeof target.role.actions.daykillrevengemsg == "string") {
                            sendChanAll(needsBot(target.role.actions.daykillrevengemsg.replace(/~Self~/g, commandData).replace(/~Target~/g, name), "Game"), mafiachan);
                        } else {
                            sendChanAll("±Game: ~Target~ tries to attack ~Self~, but ~Self~ fights back and kills ~Target~!".replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);
                        }
                        
                        if (sys.id('PolkaBot') !== undefined) {
                                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[name]);
                        if (target.role.actions.daykill === "bomb")
                            this.kill(mafia.players[commandData]);
                    }
                    
                    this.onDeadRoles();
                    
                    if (this.testWin()) {
                        return;
                    }
                    sendChanAll(border, mafiachan);
                } else if (command == "reveal") {
                    if (player.revealUse >= (commandObject.limit || 1)) {
                        sys.sendMessage(src, "±Game: You already used this command!", mafiachan);
                        return;
                    }
                    var revealMessage = commandObject.revealmsg ? commandObject.revealmsg : "~Self~ is revealed to be a ~Role~!";
                    sendChanAll(border, mafiachan);
                    sendChanAll("±Game: " + revealMessage.replace(/~Self~/g, name).replace(/~Role~/g, player.role.translation), mafiachan);
                    sendChanAll(border, mafiachan);
                    player.revealUse = player.revealUse + 1 || 1;
                } else if (command == "expose") {
                    if (player.exposeUse >= (commandObject.limit || 1)) {
                        sys.sendMessage(src, "±Game: You already used this command!", mafiachan);
                        return;
                    }
                    if (target === null) {
                        sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                        return;
                    }
                    var revenge = false;
                    if (target.role.actions.hasOwnProperty("expose")) {
                        if (target.role.actions.expose == "evade") {
                            if (target.role.actions.exposeevademsg !== undefined && typeof target.role.actions.exposeevademsg == "string") {
                                sys.sendMessage(src, "±Game: " + target.role.actions.exposeevademsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), mafiachan);
                                return;
                            } else {
                                sys.sendMessage(src, "±Game: That person cannot be exposed right now!", mafiachan);
                                return;
                            }
                        } else if (target.role.actions.expose == "revenge" || (typeof target.role.actions.expose.mode == "object" && "revenge" in target.role.actions.expose.mode && target.role.actions.expose.mode.revenge.indexOf(player.role.role) != -1)) {
                            revenge = true;
                        } else if (typeof target.role.actions.expose.mode == "object" && target.role.actions.expose.mode.evadeChance > sys.rand(0, 100) / 100) {
                            if (player.role.actions.exposemissmsg !== undefined && typeof player.role.actions.exposemissmsg == "string") {
                                sys.sendMessage(src, needsBot(player.role.actions.exposemissmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), "Game"), mafiachan);
                            } else {
                                sys.sendMessage(src, "±Game: Your " + commandName + " was evaded!", mafiachan);
                            }
                            if (target.role.actions.expose.mode.evasionmsg !== undefined && typeof target.role.actions.expose.mode.evasionmsg == "string") {
                                sys.sendMessage(sys.id(target.name), needsBot(target.role.actions.expose.mode.evasionmsg.replace(/~Target~/g, name).replace(/~Self~/g, commandData), "Game"), mafiachan);
                            } else {
                                sys.sendMessage(sys.id(target.name), "±Game: You evaded an expose!", mafiachan);
                            }
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
                                if (targetMode.msg) {
                                    mafia.sendPlayer(player.name, needsBot(targetMode.msg.replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation), "Game"));
                                } else {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded your " + commandName + "!");
                                }
                                if (targetMode.targetmsg) {
                                    mafia.sendPlayer(target.name, needsBot(targetMode.targetmsg.replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation)), "Game");
                                } else {
                                    mafia.sendPlayer(target.name, "±Game: You evaded a " + commandName + "!");
                                }
                                return;
                            }
                            return;
                        }
                    }
                    var exposeMessage = commandObject.exposemsg ? commandObject.exposemsg : "~Self~ revealed that ~Target~ is the ~Role~!";
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
                    sendChanAll("±Game: " + exposeMessage.replace(/~Self~/g, name).replace(/~Target~/g, target.name).replace(/~Role~/g, revealedRole).replace(/~Side~/g, revealedSide), mafiachan);
                    if (!revenge) {
                        if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0, 100) / 100) {
                            if (commandObject.revealmsg !== undefined && typeof commandObject.revealmsg == "string") {
                                sendChanAll("±Game: " + commandObject.revealmsg.replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
                            } else {
                                sendChanAll("±Game: While exposing, " + name + " (" + mafia.players[name].role.translation + ") made a mistake and was revealed!", mafiachan);
                            }
                        }
                        if ("expose" in target.role.actions && target.role.actions.expose == "revealexposer") {
                            if ("revealexposermsg" in target.role.actions) {
                                sendChanAll("±Game: " + target.role.actions.revealexposermsg.replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
                            } else {
                                sendChanAll("±Game: However, " + target.name + " revealed that " + name + " is the " + mafia.players[name].role.translation + "!", mafiachan);
                            }
                        }
                        player.exposeUse = player.exposeUse + 1 || 1;
                        
                    } else {
                        if (target.role.actions.exposerevengemsg !== undefined && typeof target.role.actions.exposerevengemsg == "string") {
                            sendChanAll("±Game: " + target.role.actions.exposerevengemsg.replace(/~Self~/g, commandData).replace(/~Target~/g, name).replace(/~Role~/g, player.role.translation), mafiachan);
                        } else {
                            sendChanAll("±Game: " + name + " tries to expose " + commandData + ", but " + commandData + " gets startled and kills " + name + " (" + player.role.translation +")!", mafiachan);
                        }
                        
                        if (sys.id('PolkaBot') !== undefined) {
                                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[name]);
                    }
                    
                    if ("exposedtargetmsg" in commandObject && typeof commandObject.exposedtargetmsg == "string") {
                        sys.sendMessage(src, "±Game: " + exposeTargetMessage.replace(/~Role~/g, revealedRole).replace(/~Target~/g, commandData), mafiachan);
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
                            this.sendPlayer(haxPlayer, "±Game: The " + roleName + " used " + commandName + " on " + commandData + "!");
                            haxTypes.push("revealTeam");
                        }
                        if (r < mafia.theme.roles[role].actions.standbyHax[commandName].revealPlayer) {
                            if (team.length > 1)
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is one of The " + roleName + "!");
                            else
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is The " + roleName + "!");
                            haxTypes.push("revealPlayer");
                        }
                        if (r < mafia.theme.roles[role].actions.standbyHax[commandName].revealRole) {
                            this.sendPlayer(haxPlayer, "±Game: " + name + " is " + playerRole + "!");
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
                        mafia.sendPlayer(partners[x], name + ": [Team] " + commandData);
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
            if (mafia.state != "blank") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (data[0] != noPlayer && data[0] !== "") {
                themeName = data[0].toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    sys.sendMessage(src, "±Game: No such theme!", channel);
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
            if (mafia.state != "blank") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    sys.sendMessage(src, "±Game: No such theme!", channel);
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
            if (mafia.state != "blank") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    sys.sendMessage(src, "±Game: No such theme!", mafiachan);
                    return;
                }
            }

            var theme = mafia.themeManager.themes[themeName];
            if (!theme.changelog) {
                sys.sendMessage(src, "±Game: " + theme.name + " doesn't have a changelog!", mafiachan);
                return;
            }

            sys.sendMessage(src, "", mafiachan);
            sys.sendMessage(src, "±Game: " + theme.name + "'s changelog: ", mafiachan);

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
            if (mafia.theme && mafia.state != "blank") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    sys.sendMessage(src, "±Game: No such theme!", mafiachan);
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
            if (mafia.state != "blank") {
                themeName = mafia.theme.name.toLowerCase();
            }
            if (commandData != noPlayer) {
                themeName = commandData.toLowerCase();
                if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                    sys.sendMessage(src, "±Game: No such theme!", channel);
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
        
        if (command === "playedgames") {
            var mess = [];
            mess.push("<table><tr><th>Theme</th><th>Who started</th><th>When</th><th>Players</th></tr>");
            var recentGames = PreviousGames.slice(-10);
            var t = parseInt(sys.time(), 10);
            for (var i = 0; i < recentGames.length; ++i) {
                var game = recentGames[i];
                mess.push('<tr><td>' + casedtheme(game.what) + '</td><td>' + game.who + '</td><td>' + getTimeString(t - game.when) + ' ago </td><td>' + game.playerCount + '</td></tr>');
            }
            mess.push("</table>");
            sys.sendHtmlMessage(src, mess.join(""), mafiachan);
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
                if (mafia.theme && mafia.state != "blank") {
                    themeName = mafia.theme.name.toLowerCase();
                }
            } else {
                themeName = commandData.toLowerCase();
            }
            if (mafia.themeManager.themes[themeName]) {
                mafia.mafiaStats.getWinData(src, channel, casedtheme(themeName));
                return;
            } else {
                mafiabot.sendMessage(src, commandData + " is not a theme", channel);
            }
            return;
        }
        
        if (command === "update") {
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
                mafia.themeManager.loadWebTheme(dlurl, true, true, authorMatch ? theme.name.toLowerCase() : null, src, false);
            }
            return;
        }
        
        if (command == "join") {
            sys.sendMessage(src, "±Game: You can't join now!", mafiachan);
            return;
        }
        if (command == "featured") {
            if (featuredTheme) {
                msg(src, casedtheme(featuredTheme) + " is currently being featured!");
            } else {
                msg(src, "No theme is currently being featured!");
            }
            return;
        }
        if (command == "mafiaadmins" || command == "madmins" || command ===  "mas") {
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
                sys.sendMessage(src, "±Info: This is not a valid number!", channel);
                return;
            }
            if (num < 1 || num > stalkLogs.length) {
                sys.sendMessage(src, "±Info: There's no log with this id!", channel);
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
                sys.sendMessage(src, "±Info: This is not a valid number!", channel);
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
        if (command == "mafiaban") {
            var bantime;
            if (sys.auth(src) > 0 || this.isMafiaSuperAdmin(src)) {
                bantime = undefined;
            } else {
                bantime = 86400;
            }
            script.issueBan("mban", src, tar, commandData, bantime);
            return;
        }
        if (command == "mafiaunban") {
            script.unban("mban", src, tar, commandData);
            return;
        }
        var id;
        if (command == "passma") { //partially copied from tours.js
            var oldname = sys.name(src).toLowerCase();
            var newname = commandData.toLowerCase();
            var sMA = false;
            if (sys.dbIp(newname) === undefined) {
                sys.sendMessage(src, "±Murkrow: This user doesn't exist!");
                return true;
            }
            if (!sys.dbRegistered(newname)) {
                sys.sendMessage(src, "±Murkrow: That account isn't registered so you can't give it authority!");
                return true;
            }
            if (sys.id(newname) === undefined) {
                sys.sendMessage(src, "±Murkrow: Your target is offline!");
                return true;
            }
            if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                sys.sendMessage(src, "±Murkrow: Both accounts must be on the same IP to switch!");
                return true;
            }
            if (script.mafiaAdmins.hash.hasOwnProperty(newname)|| script.mafiaSuperAdmins.hash.hasOwnProperty(newname)) {
                sys.sendMessage(src, "±Murkrow: Your target is already a Mafia Admin!");
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
            sys.sendAll("±Murkrow: " + sys.name(src) + " passed their " + (sMA ? "Super Mafia Admin powers" : "Mafia auth") + " to " + commandData, sachannel);
            return;
        }
        
        if (command === "enablenonpeak" || command === "disablenonpeak") {
            var themes = mafia.themeManager.themes;
            var npThemes = [];
            var enable = command === "enablenonpeak";
            for (var x in themes) {
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
                dualBroadcast("±Murkrow: " + nonFlashing(sys.name(src)) + (enable ? " enabled " : " disabled ") + "non-peak themes (" + npThemes.join(", ") + ").");
            } else {
                sys.sendMessage(src, "±Murkrow: No non-peak themes found", mafiachan);
            }
            return;
        }
        /*if (command == "mafiabans") {
            try {
                if (script.modCommand(src, command, commandData, tar) == "no command") {
                    msg(src, "Sorry, you are not authorized to use this command.");
                }
            } catch (e) {
                msg(src, "[DEBUG] Exception occurred: " + e);
            }
            return;
        }*/
        
        if (!this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        if (command == "mafiaadmin" || command == "mafiasadmin" || command == "mafiasuperadmin" || command == "smafiaadmin" || command == "smafiasadmin" || command == "smafiasuperadmin") {
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
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " promoted " + commandData.toCorrectCase() + " to " + (sMA ? "Super " : "") + "Mafia Admin.", mafiachan);
            }
            sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " promoted " + commandData.toCorrectCase() + " to " + (sMA ? "Super " : "") + "Mafia Admin.", sachannel);
            return;
        }
        if (command == "mafiaadminoff" || command == "smafiaadminoff") {
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
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from " + (sMA ? "Super " : "") + "Mafia Admin.", mafiachan);
            }
            sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from " + (sMA ? "Super " : "") + "Mafia Admin.", sachannel);
            return;
        }
        if (command === "mafiasadminoff" || command === "mafiasuperadminoff" || command === "smafiasadminoff" || command === "smafiasuperadminoff") {
            var silent = (command === "smafiasuperadminoff" || command === "smafiasadminoff");
            script.mafiaSuperAdmins.remove(commandData.toLowerCase());
            if (id !== undefined) {
                SESSION.users(id).mafiaAdmin = false;
            }
            if (!silent) {
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from Super Mafia Admin.", mafiachan);
            }
            sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase()  + " from Super Mafia Admin.", sachannel);
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
                sys.sendMessage(src, "±Game: This theme only supports a maximum of " + this.theme["roles" + this.theme.roleLists].length + " players!", mafiachan);
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
            mafiabot.sendMessage(src, "Mafia stats page was updated!");
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
                featuredText = undefined;
                msg(src, "You cleared the current Featured Theme Text.");
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

    this.beforeChatMessage = function (src, message, channel) {
        if (channel !== 0 && channel == mafiachan && mafia.ticks > 0 && ["blank", "voting", "entry"].indexOf(mafia.state) == -1 && !mafia.isInGame(sys.name(src)) && sys.auth(src) <= 0 && !mafia.isMafiaAdmin(src)) {
            if (!(is_command(message) && message.substr(1, 2).toLowerCase() != "me")) {
                sys.sendMessage(src, Config.Mafia.notPlayingMsg, mafiachan);
                return true;
            }
        }
    };
    
    this.afterChannelJoin = function(src, channel) {
        if (channel == mafiachan) {
            switch (mafia.state) {
                case "blank":
                    sys.sendMessage(src, "±Info: No game is running! You can start a game by typing /start or /starttheme.", mafiachan);
                    break;
                case "voting":
                    sys.sendMessage(src, "±Info: A voting for the next game is running now! Type /start [theme name] to vote for " + readable(Object.keys(this.possibleThemes), "or") + "!", mafiachan);
                    break;
                case "entry":
                    sys.sendMessage(src, "±Info: You can join a " + (mafia.theme.name == "default" ? "" : mafia.theme.name + "-themed ") + "mafia game now by typing /join! ", mafiachan);
                    break;
                default:
                    sys.sendMessage(src, "±Info: A " + (mafia.theme.name == "default" ? "" : mafia.theme.name + "-themed ") + "mafia game is in progress! You can join the next game by typing /join! ", mafiachan);
            }
            return false;
        }
    };

    // we can always slay them :3
    this.onMute = function (src) {
        var id = sys.name(src);
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser("Murkrow", id, false);
        } else if (this.isInGame(id)) {
            this.slayUser("Murkrow", id, false);
        }
    };
    
    this.onMban = function (src) {
        var id = sys.name(src);
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser("Murkrow", id, false);
        } else if (this.isInGame(id)) {
            this.slayUser("Murkrow", id, false);
        }
        if (sys.isInChannel(src, mafiachan)) {
            sys.kick(src, mafiachan);
        }
    };
    
    //Only for Control panel bans
    this.onBan = function (src, dest) {
        var dest = sys.name(dest);
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser("Murkrow", dest, false);
        } else if (this.isInGame(dest)) {
            this.slayUser("Murkrow", dest, false);
        }
    };
    
    /*Not sure what this is for, onMute is called for Blaziken.. Whatever it is, I can't test if it works or not.
    this.onKick = function (src) {
        if (this.state == "entry" || this.state == "voting") {
            this.shoveUser("Blaziken", src, false);
        } else if (this.isInGame(src)) {
            this.slayUser("Blaziken", src, false);
        }
    };*/

    this.stepEvent = function () {
        try {
            this.tickDown();
        } catch (err) {
            msgAll("error occurred: " + err);
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
