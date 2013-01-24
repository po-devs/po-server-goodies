/*
* mafia.js
*
* Contains code for server side mafia game.
* Original code by unknown.
*/

// Global variables inherited from scripts.js
/*global cmp, mafiabot, getTimeString, mafiaAdmins, updateModule, script, sys, saveKey, SESSION, sendChanAll, require, Config, module, nonFlashing, sachannel, detained, staffchannel, mafiaSuperAdmins*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
var MAFIA_CHANNEL = "Mafia";

var is_command = require("utilities.js").is_command;
var utilities = require("utilities.js");

function Mafia(mafiachan) {
    // Remember to update this if you are updating mafia
    // Otherwise mafia game won't get reloaded
    this.version = "2012-12-15";
    var mafia = this;

    var noPlayer = '*';
    var CurrentGame;
    var PreviousGames;
    var MAFIA_SAVE_FILE = Config.Mafia.stats_file;
    var MAFIA_LOG_FILE = "mafialogs.txt";
    var stalkLogs = [];
    var currentStalk = [];
    var phaseStalk = {};

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


    var defaultTheme = {
        name: "default",
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
            "actions": { "inspect": { "revealAs": "mafia" }, "lynch": { "revealAs": "mafia" }, "startup": { "revealAs": "villager" }, "onlist": "mafia" }
        }, {
            "role": "miller1",
            "translation": "Miller",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day!",
            "actions": { "inspect": { "revealAs": "mafia1" }, "lynch": { "revealAs": "mafia1" }, "startup": { "revealAs": "villager" }, "onlist": "mafia1" }
        }, {
            "role": "miller2",
            "translation": "Miller",
            "side": "village",
            "help": "You dont have any special commands during the night! Vote to remove people in the day!",
            "actions": { "inspect": { "revealAs": "mafia2" }, "lynch": { "revealAs": "mafia2" }, "startup": { "revealAs": "villager" }, "onlist": "mafia2" }
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
            if (cmp(name, this.themeInfo[i][0])) {
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

            // Init from the theme
            var i;
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
            theme.name = plain_theme.name;
            theme.author = plain_theme.author;
            theme.summary = plain_theme.summary;
            theme.changelog = plain_theme.changelog;
            theme.killmsg = plain_theme.killmsg;
            theme.killusermsg = plain_theme.killusermsg;
            theme.drawmsg = plain_theme.drawmsg;
            theme.lynchmsg = plain_theme.lynchmsg;
            theme.border = plain_theme.border;
            theme.generateRoleInfo();
            theme.generateSideInfo();
            theme.enabled = true;
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

    ThemeManager.prototype.loadWebTheme = function (url, announce, update, updatename) {
        if (typeof sys != 'object') return;
        var manager = this;
        sys.webCall(url, function (resp) {
            try {
                var plain_theme = JSON.parse(resp);
                var theme = manager.loadTheme(plain_theme);
                var lower = theme.name.toLowerCase();
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
                    msgAll("Loaded theme " + theme.name);
                }
            } catch (err) {
                msgAll("Couldn't download theme from " + url);
                msgAll("" + err);
                return;
            }
        });
    };

    ThemeManager.prototype.remove = function (src, name) {
        name = name.toLowerCase();
        if (name in this.themes) {
            delete this.themes[name];
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo.splice(i, 1);
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            msg(src, "theme " + name + " removed.");
        }
    };

    ThemeManager.prototype.enable = function (src, name) {
        name = name.toLowerCase();
        if (name in this.themes) {
            this.themes[name].enabled = true;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = true;
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            msg(src, "theme " + name + " enabled.");
        }
    };

    ThemeManager.prototype.disable = function (src, name) {
        name = name.toLowerCase();
        if (name in this.themes) {
            this.themes[name].enabled = false;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = false;
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({ 'meta': this.themeInfo }));
            msg(src, "theme " + name + " disabled.");
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
                this.nightPriority.push({ 'priority': priority, 'action': action, 'role': role });
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
                var parts = [];
                var end = 0;
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
                roles.push("±Game: " + parts.join(", ") + " Players");

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
                    sides.push("±Side: The " + this.trside(side) + " consists of " + side_list[side].join(", ") + ".");
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
        if (this.state !== "blank" && this.state !== "voting" && currentStalk.length > 0) {
            var lastLog = currentStalk.join("::**::");
            stalkLogs.unshift(lastLog);
            if (stalkLogs.length > 10) {
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
        this.resetTargets();
        // Recharges shouldn't be cleared between nights
        this.teamRecharges = {};
        this.roleRecharges = {};
        this.dayRecharges = {};
        this.teamCharges = {};
        this.roleCharges = {};
        this.teamRestrictions = {};
        this.roleRestrictions = {};
        this.usersToSlay = [];
        this.time = {
            "nights": 0,
            "days": 0
        };
    };
    this.lastAdvertise = 0;
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
        }
    };
    this.advertiseToChannel = function(channel) {
        sendChanAll("", channel);
        sendChanAll(border, channel);
        if (this.theme.name == "default") {
            sendChanAll("±Game: A new mafia game was started at #" + sys.channel(mafiachan) + "!", channel);
        } else {
            sendChanAll("±Game: A new " + this.theme.name + "-themed mafia game was started at #" + sys.channel(mafiachan) + "!", channel);
        }
        sendChanAll(border, channel);
        sendChanAll("", channel);
    };
    this.clearVariables();
    /* callback for /start */
    this.userVote = function (src, commandData) {
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            sys.sendMessage(src, "±Game: You can't start a voting when the channel is silenced.", mafiachan);
            return;
        }
        var themeName = commandData.toLowerCase();

        if (this.state == "blank") {
            this.state = "voting";
            this.ticks = 20;
            this.votes = {};
            this.possibleThemes = {};
            var total = 5;
            var i;
            if (PreviousGames.length === 0 || PreviousGames.slice(-1)[0].what != "default") {
                this.possibleThemes["default"] = 0;
                --total;
            }
            var allThemes = Object.keys(this.themeManager.themes);
            var Check = PreviousGames.slice(-Config.Mafia.norepeat)
                        .reverse()
                        .map(function (g) { return g.what; });

            if (themeName in this.themeManager.themes && this.themeManager.themes[themeName].enabled) {
                if (Check.indexOf(themeName) == -1 && themeName != "default") {
                    if (!(themeName in this.possibleThemes)) {
                        this.possibleThemes[themeName] = 0;
                        --total;
                    }
                }
            }

            while (allThemes.length > 0 && total > 0) {
                var indx = Math.floor(allThemes.length * Math.random());
                var name = allThemes[indx];
                allThemes.splice(indx, 1);
                // exclude themes played recently
                if (name != "default" && Check.indexOf(name) != -1) {
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
            sendChanAll("±Game: " + sys.name(src) + " started a voting for next game's theme!. You have " + this.ticks + " seconds to vote with /votetheme!", mafiachan);
            sendChanAll("±Game: Choose from these themes: " + Object.keys(this.possibleThemes).join(", ") + " !", mafiachan);
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
            sys.sendMessage(src, "±Game: You can not vote this theme!", mafiachan);
            return;
        }
        var ip = sys.ip(src);
        if (this.votes.hasOwnProperty(ip)) {
            if (this.votes[ip] != themeName)
                sendChanAll("±Game: " + sys.name(src) + " changed their vote to " + this.themeManager.themes[themeName].name + "!", mafiachan);
        } else {
            sendChanAll("±Game: " + sys.name(src) + " voted for " + this.themeManager.themes[themeName].name + "!", mafiachan);
        }
        this.votes[sys.ip(src)] = { theme: themeName, who: sys.name(src) };
    };
    /* callback for /realstart */
    this.startGame = function (src, commandData) {
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            sys.sendMessage(src, "±Game: You can't start a game when the channel is silenced.", mafiachan);
            return;
        }
        var now = (new Date()).getTime();
        if (src !== null) {
            if (SESSION.users(src).mafia_start !== undefined && SESSION.users(src).mafia_start + 5000 > now) {
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

        var previous = this.theme ? this.theme.name : undefined;
        var themeName = commandData == noPlayer ? "default" : commandData.toLowerCase();

        // Prevent a single player from dominating the theme selections.
        // We exclude mafia admins from this.
        var i;
        if (src) {
            var PlayerCheck = PreviousGames.slice(-5).reverse();
            if (!this.isMafiaAdmin(src)) {
                for (i = 0; i < PlayerCheck.length; i++) {
                    var who = PlayerCheck[i].who;
                    var what = PlayerCheck[i].what;
                    if (who == sys.name(src)) {
                        sys.sendMessage(src, "±Game: Sorry, you have started a game " + (i + 1) + " games ago, let someone else have a chance!", mafiachan);
                        return;
                    }
                    if (themeName !== "default" && what == themeName) {
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
                sendChanAll("±Game: " + sys.name(src) + " started a game with theme " + this.theme.name + "!", mafiachan);
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
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", mafiachan);
                    continue;
                } else if (sys.isInChannel(id, 0)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", 0);
                    continue;
                } else if (sys.existChannel("Project Mafia") && sys.isInChannel(id, sys.channelId("Project Mafia"))) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", sys.channelId("Project Mafia"));
                    continue;
                }
                sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!");
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
                if (sys.existChannel("Project Mafia")) {
                    this.advertiseToChannel(sys.channelId('Project Mafia'));
                }
                if (sys.existChannel("Mafia Tutoring")) {
                    this.advertiseToChannel(sys.channelId('Mafia Tutoring'));
                }
            }
        }
        this.clearVariables();
        mafia.state = "entry";

        mafia.ticks = 60;
    };
    /* callback for /end */
    this.endGame = function (src) {
        if (mafia.state == "blank") {
            sys.sendMessage(src, "±Game: No game is going on.", mafiachan);
            return;
        }
        sendChanAll(border, mafiachan);

        sendChanAll("±Game: " + (src ? sys.name(src) : Config.Mafia.bot) + " has stopped the game!", mafiachan);
        sendChanAll(border, mafiachan);
        sendChanAll("", mafiachan);
        if (sys.id('PolkaBot') !== undefined) {
            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
        }
        mafia.clearVariables();
        runUpdate();
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
            var targetMode = player.role.actions.night[action].target;
            var team = this.getPlayersForTeam(player.role.side);
            var role = this.getPlayersForRole(player.role.role);
            if ((targetMode == 'AnyButSelf' || targetMode == 'Any')
             || (targetMode == 'AnyButTeam' && team.length == 1)
             || (targetMode == 'AnyButRole' && role.length == 1)) {
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
            var targetRoles, targetPlayers, r, k, target, affected, actionMessage, needSeparator = false;
            if ("killRoles" in onDeath) {
                targetRoles = onDeath.killRoles;
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
                        actionMessage = onDeath.killmsg ? onDeath.killmsg : "±Game: Because ~Self~ died, ~Target~ (~Role~) died too!";
                        sendChanAll(actionMessage.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r])), mafiachan);
                        needSeparator = true;
                    }
                }
            }
            if ("poisonRoles" in onDeath) {
                targetRoles = onDeath.poisonRoles;
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
                        actionMessage = onDeath.poisonmsg ? onDeath.poisonmsg : "±Game: Because ~Self~ died, the ~Role~ was poisoned!";
                        sendChanAll(actionMessage.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(r)).replace(/~Count~/, count), mafiachan);
                        needSeparator = true;
                    }
                }
            }
            if ("convertRoles" in onDeath) {
                targetRoles = onDeath.convertRoles;
                for (r in targetRoles) {
                    var newRole = onDeath.convertRoles[r];
                    targetPlayers = this.getPlayersForRole(r);
                    affected = [];
                    for (k = 0; k < targetPlayers.length; ++k) {
                        if (this.players[targetPlayers[k]] != player) {
                            affected.push(targetPlayers[k]);
                            target = this.players[targetPlayers[k]];
                            mafia.setPlayerRole(target, newRole);
                            mafia.showOwnRole(sys.id(targetPlayers[k]));
                        }
                    }
                    if (affected.length > 0) {
                        actionMessage = onDeath.convertmsg ? onDeath.convertmsg : "±Game: Because ~Self~ died, the ~Old~ became a ~New~!";
                        sendChanAll(actionMessage.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/, mafia.theme.trrole(newRole)), mafiachan);
                        needSeparator = true;
                    }
                }
            }
            if ("curseRoles" in onDeath) {
                targetRoles = onDeath.curseRoles;
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
                        }
                    }
                    if (affected.length > 0) {
                        actionMessage = onDeath.cursemsg ? onDeath.cursemsg : "±Game: Because ~Self~ died, the ~Old~ got cursed and will become a ~New~ soon!";
                        sendChanAll(actionMessage.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(r)).replace(/~New~/g, mafia.theme.trrole(cursedRole)).replace(/~Count~/g, count || 2), mafiachan);
                        needSeparator = true;
                    }
                }
            }
            if ("exposeRoles" in onDeath) {
                targetRoles = onDeath.exposeRoles;
                for (r = 0; r < targetRoles.length; ++r) {
                    targetPlayers = this.getPlayersForRole(targetRoles[r]);
                    if (targetPlayers.length > 0) {
                        actionMessage = onDeath.exposemsg ? onDeath.exposemsg : "±Game: Before dying, ~Self~ exposed ~Target~ as the ~Role~!";
                        sendChanAll(actionMessage.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(targetPlayers, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r])), mafiachan);
                        needSeparator = true;
                    }
                }
            }
            if (this.state == "day" && needSeparator) {
                sendChanAll(border, mafiachan);
            }
        }
    };
    this.kill = function (player) {
        if (this.theme.killmsg) {
            sendChanAll(this.theme.killmsg.replace(/~Player~/g, player.name).replace(/~Role~/g, player.role.translation), mafiachan);
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
            }
            if ("clearCurse" in condition) {
                player.cursed = undefined;
            }
        }
    };
    this.testWin = function () {
        if (Object.keys(mafia.players).length === 0) {
            sendChanAll("±Game: " + (mafia.theme.drawmsg ? mafia.theme.drawmsg : "Everybody died! This is why we can't have nice things :("), mafiachan);
            sendChanAll(border, mafiachan);
            if (sys.id('PolkaBot') !== undefined) {
                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
            }
            mafia.clearVariables();
            runUpdate();
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
            if (winSide in mafia.theme.sideWinMsg) {
                sendChanAll(mafia.theme.sideWinMsg[winSide].replace(/~Players~/g, readable(players, "and")), mafiachan);
            } else {
                sendChanAll("±Game: The " + mafia.theme.trside(winSide) + " (" + readable(players, "and") + ") wins!", mafiachan);
            }
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
                }
            } else if (goodPeople.length > 0) {
                sendChanAll("±Game: The " + mafia.theme.trside('village') + " (" + readable(goodPeople, "and") + ") lose!", mafiachan);
            }
            sendChanAll(border, mafiachan);
            mafia.clearVariables();
            if (sys.id('PolkaBot') !== undefined) {
                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
            }
            sys.playersOfChannel(mafiachan).forEach(function(id) {
                var detain = SESSION.users(id).detained;
                if (detain) {
                    if (detain.active) {
                        detain.games = detain.games - 1;
                        if (detain.games < 1) {
                            SESSION.users(id).detained.active = false;
                            SESSION.users(id).detained.games = 0;
                            detained.remove(sys.ip(id));
                            sys.sendMessage(id, "±Game: You are no longer detained from mafia!");
                        } else {
                            detained.add(sys.ip(id), detain.games + ":" + detain.by + ":" + sys.name(id) + ":"  + detain.reason);
                        }
                    }
                }
            });
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
                mafia.players[mafia.signups[i]] = { 'name': mafia.signups[i], 'role': mafia.theme.roles[playerRole], 'targets': {}, 'recharges': {}, 'dayrecharges': {}, 'charges' : {}, "restrictions": [] };
                var rechargeplayer = mafia.players[mafia.signups[i]];
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
                    mafia.sendPlayer(player.name, "±Game: You are a " + role.translation + "!");
                }
                mafia.sendPlayer(player.name, "±Game: " + role.help);

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

                if (typeof role.actions.startup == "object" && role.actions.startup.revealRole) {
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
            }
            sendChanAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (p in mafia.players) {
                player = mafia.players[p];
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(player.role.side));
            }
            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.night;
            }

            mafia.time.nights++;

            sendChanAll("Time: Night " + mafia.time.nights, mafiachan);
            sendChanAll("Make your moves, you only have " + mafia.ticks + " seconds! :", mafiachan);
            sendChanAll(border, mafiachan);
            mafia.state = "night";
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
            var stalkTargets = {};
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
                        for (var c in commandList) {
                            var targetMode;
                            var revenge = false, revengetext;
                            var revengetext = "±Game: You were killed during the night!";
                            var poisonrevenge, poisonDeadMessage;
                            var poisonrevengetext = "±Game: Your target poisoned you!";
                            target = targets[t];
                            command = commandList[c];
                            if (["kill", "protect", "inspect", "distract", "poison", "safeguard", "stalk", "convert", "copy", "curse"].indexOf(command) == -1) {
                                continue;
                            }
                            if (!mafia.isInGame(target)) {
                                if (command != "stalk")
                                    continue;
                            } else {
                                target = mafia.players[target];

                                // Action blocked by Protect or Safeguard
                                if ((target.guarded && command == "kill") || (target.safeguarded && ["distract", "inspect", "stalk", "poison", "convert", "copy", "curse"].indexOf(command) !== -1)) {
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
                                    else if (targetMode.mode == "ChangeTarget") {
                                        if (targetMode.targetmsg) {
                                            mafia.sendPlayer(player.name, "±Game: " + targetMode.targetmsg);
                                        } else if (targetMode.hookermsg) {
                                            mafia.sendPlayer(player.name, "±Game: " + targetMode.hookermsg);
                                        }
                                        mafia.sendPlayer(target.name, "±Game: " + targetMode.msg.replace(/~Distracter~/g, player.role.translation).replace(/~User~/g, player.role.translation));
                                        mafia.kill(player);
                                        nightkill = true;
                                        mafia.removeTargets(target);
                                        stalkTargets[target.name] = {};
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
                                            mafia.sendPlayer(player.name, "±Game: " + targetMode.targetmsg.replace(/~Self~/g, player.name).replace(/~Action~/g, o.action));
                                        }
                                        mafia.kill(target);
                                        nightkill = true;
                                        continue;
                                    }
                                    else if (typeof targetMode.mode == "object") {
                                        if ("evadeChance" in targetMode.mode && targetMode.mode.evadeChance > Math.random()) {
                                            mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded your " + o.action + "!");
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
                                            stalkTargets[target.name] = {};
                                            continue outer;
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
                                stalkTargets[target.name] = {};
    
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
                                if (targetMode.revealSide !== undefined || Sight === "Team") {
                                    mafia.sendPlayer(player.name, "±Info: " + target.name + " is sided with the " + mafia.theme.trside(target.role.side) + "!!");
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
                                    if (mafia.theme.killusermsg) {
                                        mafia.sendPlayer(target.name, mafia.theme.killusermsg);
                                    } else {
                                        mafia.sendPlayer(target.name, "±Game: You were killed during the night!");
                                    }
                                } else {
                                    mafia.sendPlayer(target.name, Action.msg); // custom kill message for the killer
                                }
                                mafia.kill(target);
                                nightkill = true;
                            }
                            else if (command == "poison") {
                                if (target.poisoned === undefined || target.poisonCount - target.poisoned >= (Action.count ? Action.count : 2)) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was poisoned!");
                                    var team = getTeam(player.role, Action.common);
                                    for (var x in team) {
                                        if (team[x] != player.name) {
                                            mafia.sendPlayer(team[x], "±Game: Your target (" + target.name + ") was poisoned!");
                                        }
                                    }
                                    target.poisoned = 1;
                                    target.poisonCount = Action.count || 2;
                                    target.poisonDeadMessage = Action.poisonDeadMessage;
                                }
                            }
                            else if (command == "stalk") {
                                target = typeof target == "object" ? target.name : target;
                                if (target in stalkTargets) {
                                    var visited = Object.keys(stalkTargets[target]).sort();
                                    if (visited.length > 0) {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target + ") visited " + readable(visited, "and") + " this night!");
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target + ") didn't visit anyone this night!");
                                    }
                                }
                            }
                            else if (command == "convert") {
                                if ("canConvert" in Action && Action.canConvert != "*" && Action.canConvert.indexOf(target.role.role) == -1) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be converted!");
                                } else {
                                    var oldRole = target.role, newRole;
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
                                    if (newRole === undefined) {
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
                                        mafia.sendPlayer(target.name, "±Game: You have been converted and changed roles!");
                                        mafia.showOwnRole(sys.id(target.name));
                                    }
                                }
                            }
                            else if (command == "copy") {
                                if (Action.copyAs == "*" && "canCopy" in Action && Action.canCopy != "*" && Action.canCopy.indexOf(target.role.role) == -1) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") can't be copied!");
                                } else {
                                    var oldRole = player.role, newRole;
                                    if (typeof Action.copyAs == "object") {
                                        var possibleRoles = shuffle(Object.keys(Action.copyAs));
                                        for (var nr in possibleRoles) {
                                            if (Action.copyAs[possibleRoles[nr]].indexOf(target.role.role) != -1) {
                                                newRole = possibleRoles[nr];
                                                break;
                                            }
                                        }
                                    } else if (Action.copyAs == "*") {
                                        newRole = target.role.role;
                                    }
                                    if (newRole === undefined) {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") can't be copied!");
                                    } else {
                                    mafia.setPlayerRole(player, newRole);
                                        if (!Action.silent) {
                                            if ("copymsg" in Action) {
                                                sendChanAll("±Game: " + Action.copymsg.replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation), mafiachan);
                                            } else {
                                                sendChanAll("±Game: A " + oldRole.translation + " has been converted into a " + player.role.translation + "!", mafiachan);
                                            }
                                        }
                                        mafia.sendPlayer(player.name, "±Game: You copied someone and changed roles!");
                                        mafia.showOwnRole(sys.id(player.name));
                                    }
                                }
                            }
                            else if(command == "curse") {
                                if ("canCurse" in Action && Action.canCurse != "*" && Action.canCurse.indexOf(target.role.role) == -1) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be cursed!");
                                } else {
                                    var oldRole = target.role, cursedRole;
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
                                    if (cursedRole === undefined) {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be cursed!");
                                    } else {
                                        mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was cursed!");
                                        target.cursed = 1;
                                        target.curseCount = Action.curseCount || 2;
                                        target.cursedRole = cursedRole;
                                        if (!Action.silent) {
                                            target.curseConvertMessage = Action.curseConvertMessage || "~Target~'s has been converted into a ~New~!";
                                        }
                                    }
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
                        mafia.sendPlayer(player.name, "±Game: You will convert in " + (player.curseCount - player.cursed) + " days.");
                        player.cursed++;
                    } else if (player.cursed >= curseCount) {
                        if (player.curseConvertMessage) {
                            sendChanAll("±Game: " + player.curseConvertMessage.replace(/~Target~/g, player.name).replace(/~Player~/g, player.name).replace(/~Old~/g, player.role.translation).replace(/~New~/g, mafia.theme.roles[player.cursedRole].translation), mafiachan);
                            player.curseConvertMessage = undefined;
                        }
                        mafia.sendPlayer(player.name, "±Game: Your curse took effect and you changed roles!");
                        mafia.setPlayerRole (player, player.cursedRole);
                        mafia.showOwnRole(sys.id(player.name));
                        player.curseCount = undefined;
                    }
                }
            }
            this.reduceRecharges();

            if (!nightkill) {
                sendChanAll("No one died! :", mafiachan);
            }

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

            sendChanAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (p in mafia.players) {
                player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }

            mafia.time.days++;

            sendChanAll("Time: Day " + mafia.time.days, mafiachan);
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

            mafia.state = "standby";
        },
        standby: function () {
            mafia.ticks = 30;
            
            this.compilePhaseStalk("STANDBY PHASE " + mafia.time.days);

            sendChanAll(border, mafiachan);

            sendChanAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
                if (p in mafia.dayRecharges) {
                    for (var r in mafia.dayRecharges[p]) {
                        mafia.setRechargeFor(player, "standby", r, player.role.actions.standby[r].recharge);
                    }
                }
            }
            var nolyn = false;
            if (mafia.theme.nolynch !== undefined && mafia.theme.nolynch !== false) {
                nolyn = true;
            }
            if (nolyn === false) {
                sendChanAll("Time: Day " + mafia.time.days, mafiachan);
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

                sendChanAll("Time: Night " + mafia.time.nights, mafiachan);
                sendChanAll("Make your moves, you only have " + mafia.ticks + " seconds! :", mafiachan);
                sendChanAll(border, mafiachan);
                for (var x = 0; x < mafia.usersToSlay.length; x++) {
                    var i = mafia.usersToSlay[x];
                    mafia.slayUser(Config.capsbot, i);
                }
                mafia.usersToSlay = [];

                mafia.state = "night";
                mafia.resetTargets();
            }
        },
        day: function () {
            sendChanAll(border, mafiachan);
            sendChanAll("Times Up! :", mafiachan);
            
            this.compilePhaseStalk("VOTING PHASE " + mafia.time.days);

            var voted = {}, player, vote;
            for (var pname in mafia.votes) {
                player = mafia.players[pname];
                var target = mafia.votes[pname];
                // target play have been killed meanwhile by slay
                if (!mafia.isInGame(target)) continue;
                if (!(target in voted)) {
                    voted[target] = 0;
                }
                vote = player.role.actions.vote;
                if (vote !== undefined) {
                    if (typeof vote === "number") {
                        voted[target] += vote;
                    } else {
                        voted[target] += sys.rand(vote[0], vote[1]);
                    }
                } else {
                    voted[target] += 1;
                }
            }
            var tie = true, maxi = 0, downed = noPlayer, voteshield;
            for (var x in voted) {
                player = mafia.players[x];
                voteshield = player.role.actions.voteshield;
                if (voteshield !== undefined) {
                    if (typeof voteshield === "number") {
                        voted[x] += voteshield;
                    } else {
                        voted[x] += sys.rand(voteshield[0], voteshield[1]);
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
                sendChanAll(border, mafiachan);
            } else {
                var lynched = mafia.players[downed];
                if ("lynch" in lynched.role.actions && "convertTo" in lynched.role.actions.lynch) {
                    var newRole = lynched.role.actions.lynch.convertTo;
                    if ("convertmsg" in lynched.role.actions.lynch) {
                        sendChanAll("±Game: " + lynched.role.actions.lynch.convertmsg.replace(/~Self~/g, downed).replace(/~Old~/g, lynched.role.translation).replace(/~New~/g, mafia.theme.trrole(newRole)).replace(/~Count~/g, maxi), mafiachan);
                    } else {
                        sendChanAll("±Game: " + downed + ", the " + lynched.role.translation + " survived the lynch and became a " + mafia.theme.trrole(newRole) + "!", mafiachan);
                    }
                    mafia.setPlayerRole(lynched, newRole);
                    mafia.showOwnRole(sys.id(downed));
                } else {
                    var roleName = typeof mafia.players[downed].role.actions.lynch == "object" && typeof mafia.players[downed].role.actions.lynch.revealAs == "string" ? mafia.theme.trrole(mafia.players[downed].role.actions.lynch.revealAs) : mafia.players[downed].role.translation;
                    var lynchmsg = mafia.theme.lynchmsg ? mafia.theme.lynchmsg : "±Game: ~Player~ (~Role~) was removed from the game!";
                    sendChanAll(lynchmsg.replace(/~Player~/g, downed).replace(/~Role~/g, roleName).replace(/~Side~/g, mafia.theme.trside(mafia.players[downed].role.side)).replace(/~Count~/g, maxi), mafiachan);
                    mafia.actionBeforeDeath(lynched);
                    mafia.removePlayer(mafia.players[downed]);
                }

                if (mafia.testWin())
                    return;
            }

            sendChanAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sendChanAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.night;
            }

            mafia.time.nights++;

            sendChanAll("Time: Night " + mafia.time.nights, mafiachan);
            sendChanAll("Make your moves, you only have " + mafia.ticks + " seconds! :", mafiachan);
            sendChanAll(border, mafiachan);
            for (var x = 0; x < mafia.usersToSlay.length; x++) {
                var i = mafia.usersToSlay[x];
                mafia.slayUser(Config.capsbot, i);
            }
            mafia.usersToSlay = [];
            mafia.state = "night";
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
                sendChanAll("±Game: Theme " + winner.theme + " won with " + winner.votes + " votes!", mafiachan);
                sendChanAll("±Game: Type /Join to enter the game!", mafiachan);
                sendChanAll("", mafiachan);
                this.startGame(null, winner.theme);
                this.signups = players[winner.theme];
                this.ips = ips[winner.theme];
                mafia.ticks = 40;
                sendChanAll("±Game: " + this.signups.join(", ") + " joined the game!", mafiachan);
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
            sendChanAll("Error occurred in mafia while handling the end of '" + state + "' phase: " + e, mafiachan);
        }
    };
    this.showCommands = function (src) {
        sys.sendMessage(src, "", mafiachan);
        sys.sendMessage(src, "Server Commands:", mafiachan);
        for (var x in mafia.commands.user) {
            sys.sendMessage(src, "/" + cap(x) + " - " + mafia.commands.user[x][1], mafiachan);
        }
        if (sys.auth(src) > 0 || this.isMafiaAdmin(src)) {
            sys.sendMessage(src, "Authority Commands:", mafiachan);
            for (x in mafia.commands.auth) {
                sys.sendMessage(src, "/" + cap(x) + " - " + mafia.commands.auth[x][1], mafiachan);
            }
        }
        sys.sendMessage(src, "", mafiachan);
    };
    this.showHelp = function (src, commandData) {
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
            "±Explanation: Allows the user to stop their target from doing their action at night.",
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
            ""
            ];
            dump(src, helproles);
        }
        else if (commandData == "hints") {
            var helphints = [
            "±Game: When you are mafia if your teammate is guaranteed to be voted out you are allowed to vote them so you don't look suspicious.",
            "±Game: In general if you are the inspector it is a good idea to claim so that you can be protected.",
            "±Game: When you find your teammates it is a good idea to PM them so you remember who they are and so you can talk strategy.",
            "±Game: Don't claim as a villager because it exposes the Power Roles.",
            "±Game: Don't say to quiet because the people who are silent tend to be voted out a lot.",
            "±Game: A rand is when someone choses who to vote/kill randomly with no real logic behind it.",
            "±Game: Communication with your team is the key to victory.",
            ""
            ];
            dump(src, helphints);
        }
        else {
            var help = [
            "Type /help commands to get an explanation about what each mafia command does.",
            "Type /help roles to get an outline of the most common roles in mafia.",
            "Type /help hints to get advice that will help you do better in mafia games."
        ];
            dump(src, help);
        }
    };
    this.showRoles = function (src, commandData) {
        var themeName = "default";
        var data = commandData.split(":");
        if (mafia.state != "blank") {
            themeName = mafia.theme.name.toLowerCase();
        }
        if (data[0] != noPlayer && data[0] !== "") {
            themeName = data[0].toLowerCase();
            if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                sys.sendMessage(src, "±Game: No such theme!", mafiachan);
                return;
            }
        }
        var roles;
        if (themeName == "default2") {
            roles = [
            "*** *********************************************************************** ***",
            "±Role: Villager",
            "±Ability: The Villager has no command during night time. They can only vote during the day!",
            "±Game: 6-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Inspector",
            "±Ability: The Inspector can find out the identity of a player during the Night. ",
            "±Game: 5-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Bodyguard",
            "±Ability: The Bodyguard can protect one person during the night from getting killed, but the bodyguard cant protect itself.",
            "±Game: 5-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Pretty Lady",
            "±Ability: The Pretty Lady can distract people during the night thus cancelling their move, unless it's the WereWolf.",
            "±Game: 5-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Samurai",
            "±Ability: The Samurai can kill people during the standby phase, but he will be revealed when doing so.",
            "±Game: 25-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Mafia",
            "±Ability: The Mafia is a group of 2 people. They get one kill each night. They strike after the WereWolf.",
            "±Game: 5-12 Players",
            "*** *********************************************************************** ***",
            "±Role: WereWolf",
            "±Ability: The WereWolf is solo. To win it has to kill everyone else in the game. The Werewolf strikes first.",
            "±Game: 5-12 27-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Italian Mafia",
            "±Ability: The Italian Mafia is a group of 2-3 people. They get one kill each night. They strike before the French Canadian Mafia.",
            "±Game: 12-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Italian Conspirator",
            "±Ability: Italian Conspirator is sided with Italian Mafia, but doesn't have any special commands. Shows up as a Villager to inspector.",
            "±Game: -",
            "*** *********************************************************************** ***",
            "±Role: Don Italian Mafia",
            "±Ability: Don Italian Mafia is sided with Italian Mafia. He kills with Italian mafia each night. He can't be distracted.",
            "±Game: 24-30 Players",
            "*** *********************************************************************** ***",
            "±Role: French Canadian Mafia",
            "±Ability: The French Canadian Mafia is a group of 2-4 people. They get one kill each night. They strike after the Italian Mafia.",
            "±Game: 12-30 Players",
            "*** *********************************************************************** ***",
            "±Role: French Canadian Conspirator",
            "±Ability: French Canadian Conspirator is sided with French Canadian Mafia, but doesn't have any special commands. Shows up as a Villager to inspector.",
            "±Game: -",
            "*** *********************************************************************** ***",
            "±Role: Don French Canadian Mafia",
            "±Ability: Don French Canadian Mafia is sided with French Canadian Mafia. He kills with French Canadian mafia each night. He can't be distracted.",
            "±Game: 18-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Mayor",
            "±Ability: The Mayor has no command during the night but his/her vote counts as 2.",
            "±Game: 10-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Spy",
            "±Ability: The Spy has 33% chance of finding out who is going to get killed by The Italian or French Canadian Mafia during the night. And 10% chance to find out who is the killer!",
            "±Game: 13-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Vigilante",
            "±Ability: The Vigilante can kill a person during the night! He/she strikes after The French Canadian and Italian Mafia.",
            "±Game: 20-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Godfather",
            "±Ability: The Godfather can kill 2 people during the night! He/she strikes Last!",
            "±Game: 22-30 Players",
            "*** *********************************************************************** ***",
            ""
            ];
        } else {
            roles = mafia.themeManager.themes[themeName].roleInfo;
        }
        if (data[1]) {
            var sep = "*** *********************************************************************** ***";
            var filterRoles = [sep];
            var roleTranslation = data[1].toLowerCase();
            for (var i = 0; i < roles.length; ++i) {
                if (roles[i].search(/±role:/i) > -1 && roles[i].toLowerCase().search(roleTranslation) > -1) {
                    filterRoles.push(roles[i]);
                    filterRoles.push(roles[i + 1]);
                    filterRoles.push(roles[i + 2]);
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
        dump(src, roles);
    };
    this.showSides = function (src, commandData) {
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
        var sides = mafia.themeManager.themes[themeName].sideInfo;
        dump(src, sides);
    };
    this.showRules = function (src, commandData, channel) {
        var rules = [
            "",
            " Server Rules: ",
            "±Rule: No spamming / flooding ",
            "±Rule: No insulting - especially not auth. ",
            "±Rule: No trolling.",
            "±Tip: Type /rules on another channel to see the full rules.",
            "",
            " Game Rules: ",
            "±Rule: Do not intentionally harm your team's chances of winning. Voting yourself when you have no hope of surviving is one thing, voting out your confirmed ally is quite another.",
            "±Rule: Do not deadtalk. After dying, you are out of the game and should consider it done with. Do not relay any information you may have retained during the course of the game to anyone else until the game is officially over.",
            "±Rule: Do not join a game if you know you will have to leave soon. Often, mafia games take longer than one would expect, make time for it. If something unexpected happens, feel free to ask for a slay. Please do not abuse this privilege.",
            "±Rule: Do not botquote. Mafia is about convincing your fellow players of your role and working together, it defeats the purpose if you simply botquote.",
            "±Rule: Do not whine or rage. This is simply a game. If a theme comes up that you dislike, simply do not join it. No need to announce your dislike for it in the main chat. Additionally, childlike displays of anger will not be tolerated. Playful banter or taunting is one thing, outbursts of unpleasant words are another.",
            "±Rule: Do not ruin the game for others. Very straightforward. Ask yourself: Do my actions consistently prevent another user from enjoying this game? If the answer is yes, stop it. Do not group together, target others or be unpleasant.",
            "±Rule: When joining make sure that your name is not able to be confused with someone else's.  Trying to impersonate someone is something that should not be done because this will ruin the game and can cause confusion.",
            "±Rule: Use your head. Again, this is straightforward and ties in with the above rules. By giving some foresight to your actions, you'll be able to eliminate virtually all negative incidents and be able to enjoy mafia with ease.",
            "",
            "±Game: Failure to obey these rules may result in punishment at the discretion of the mafia admins or authority members.",
            ""
        ];
        dump(src, rules, channel);
    };
    this.showThemes = function (src) {
        var l = [];
        for (var t in mafia.themeManager.themes) {
            l.push(mafia.themeManager.themes[t].name);
        }
        msg(src, "Installed themes are: " + l.join(", "));
    };
    this.showThemeInfo = function (src, data) {
        data = data.toLowerCase();
        mafia.themeManager.themeInfo.sort(function (a, b) { return a[0].localeCompare(b[0]); });
        var mess = [];
        mess.push("<table><tr><th>Theme</th><th>URL</th><th>Author</th><th>Enabled</th></tr>");
        for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
            var info = mafia.themeManager.themeInfo[i];
            var theme = mafia.themeManager.themes[info[0].toLowerCase()];
            if (!theme) continue;
            if (data == noPlayer || data.indexOf(theme.name.toLowerCase()) != -1) {
                mess.push('<tr><td>' + theme.name + '</td><td><a href="' + info[1] + '">' + info[1] + '</a></td><td>' + (theme.author ? readable(theme.author, "and") : "unknown") + '</td><td>' + (theme.enabled ? "yes" : "no") + '</td></tr>');
            }
        }
        mess.push("</table>");
        sys.sendHtmlMessage(src, mess.join(""), mafiachan);
    };
    this.showThemeChangelog = function (src, commandData) {
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

        var theme = mafia.themeManager.themes[themeName],
            name = theme.name;

        if (!theme.changelog) {
            sys.sendMessage(src, "±Game: " + name + " doesn't have a changelog!", mafiachan);
            return;
        }

        sys.sendMessage(src, "±Game: " + name + "'s changelog: ", mafiachan);

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
    };
    this.showThemeDetails = function (src, commandData) {
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
        var link = "No link found";
        for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
            if (mafia.themeManager.themeInfo[i][0].toLowerCase() == themeName) {
                link = mafia.themeManager.themeInfo[i][1];
                break;
            }
        }
        var mess = [];
        mess.push("");
        mess.push("<b>Theme: </b>" + theme.name);
        mess.push("<b>Author: </b>" + (theme.author ? readable(theme.author, "and") : "Unknown"));
        mess.push("<b>Enabled: </b>" + (theme.enabled ? "Yes" : "No"));
        mess.push("<b>Number of Players: </b> Up to " + (theme["roles" + theme.roleLists].length) + " players");
        mess.push("<b>Summary: </b>" + (theme.summary ? theme.summary : "No summary available."));
        mess.push("(For more information about this theme, type <b>/roles " + theme.name + "</b>)");
        if (link == "No link found") {
            mess.push('<b>Code: </b>' + link);
        } else {
            mess.push('<b>Code: </b><a href="' + link + '">' + link + '</a>');
        }
        mess.push("");
        for (var x in mess) {
            sys.sendHtmlMessage(src, mess[x], mafiachan);
        }
    };

    this.showPlayedGames = function (src) {
        var mess = [];
        mess.push("<table><tr><th>Theme</th><th>Who started</th><th>When</th><th>Players</th></tr>");
        var recentGames = PreviousGames.slice(-10);
        var t = parseInt(sys.time(), 10);
        for (var i = 0; i < recentGames.length; ++i) {
            var game = recentGames[i];
            mess.push('<tr><td>' + game.what + '</td><td>' + game.who + '</td><td>' + getTimeString(game.when - t) + '</td><td>' + game.playerCount + '</td></tr>');
        }
        mess.push("</table>");
        sys.sendHtmlMessage(src, mess.join(""), mafiachan);
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
                    mafia.sendPlayer(player.name, "±Game: You are a " + role.translation + "!");
                }
                mafia.sendPlayer(player.name, "±Game: " + role.help);

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

                if (typeof role.actions.startup == "object" && role.actions.startup.revealRole) {
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
            } else {
                sys.sendMessage(src, "±Game: You are not in the game!", mafiachan);
            }
        } else {
            sys.sendMessage(src, "±Game: No game running!", mafiachan);
        }
    };
    this.flashPlayer = function (src, commandData) {
        var user = SESSION.users(src);
        var data = commandData.split(":");
        var action = data[0].toLowerCase();
        var t; // loop index
        var themeName; // loop variable
        if (action == "on") {
            msg(src, "Alert for mafia games is now on!");
            user.mafiaalertson = true;
            saveKey("mafiaalertson", src, true);
            return;
        }
        else if (action == "off") {
            msg(src, "Alert for mafia games is now off!");
            user.mafiaalertson = false;
            saveKey("mafiaalertson", src, false);
            return;
        }
        else if (action == "any") {
            user.mafiaalertsany = !user.mafiaalertsany;
            msg(src, "You'll get alerts for " + (user.mafiaalertsany ? "any theme" : "specific themes only") + "!");
            saveKey("mafiaalertsany", src, user.mafiaalertsany);
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
                saveKey("mafiathemes", src, user.mafiathemes.join("*"));
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
                    continue;
                } else {
                    themesNotRemoved.push(themeName);
                    continue;
                }
            }
            if (themesRemoved.length > 0) {
                msg(src, "Removed alert for the themes: " + readable(themesRemoved, "and") + ". ");
                saveKey("mafiathemes", src, user.mafiathemes.join("*"));
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
        }
    };
    this.showPriority = function (src, commandData) {
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
        sys.sendHtmlMessage(src, "", mafiachan);
        sys.sendHtmlMessage(src, "Priority List for theme <b>" + theme.name + ":</b>", mafiachan);
        for (var p = 0; p < theme.nightPriority.length; ++p) {
            var prio = theme.nightPriority[p];
            sys.sendHtmlMessage(src, "[" + prio.priority + "] " + theme.roles[prio.role].translation + " (" + cap(prio.action) + ")", mafiachan);
        }
        sys.sendHtmlMessage(src, "", mafiachan);
    };

    // Auth commands
    this.isMafiaAdmin = function (src) {
        if (sys.auth(src) >= 1)
            return true;
        
        if (mafia.isMafiaSuperAdmin(src)) {
            return true;
        }
        
        if (mafiaAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase())) {
            return true;
        }
        return false;
    };
    this.isMafiaSuperAdmin = function (src) {
        if (sys.auth(src) >= 2)
            return true;

        if (mafiaSuperAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase())) {
            return true;
        }
        return false;
    };
    
    this.pushUser = function (src, name) {
        if (!mafia.isMafiaSuperAdmin(src)) {
            msg(src, "Super Admin Command.");
            return;
        }
        if (this.state != "entry") {
            msg(src, "Pushing makes no sense outside entry...");
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
        sendChanAll("±Game: " + name + " joined the game! (pushed by " + sys.name(src) + ")", mafiachan);
    };
    this.slayUser = function (src, name) {
        var slayer = typeof src == "string" ? src : sys.name(src);
        if (this.state == "entry") {
            for (var i = 0; i < this.signups.length; ++i) {
                if (name.toLowerCase() == this.signups[i].toLowerCase()) {
                    msgAll(" " + this.signups[i] + " was taken out from the game by " + slayer + "!");
                    this.signups.splice(i, 1);
                    return;
                }
            }
        } else {
            name = this.correctCase(name);
            if (this.isInGame(name)) {
                var player = this.players[name];
                sendChanAll("±Kill: " + player.name + " (" + player.role.translation + ") was slain by " + slayer + "!", mafiachan);
                this.removePlayer(player);
                return;
            }
        }
        msg(src, "No such target.");
    };
    this.readStalkLog = function (src, data) {
        var num, outputChan = mafiachan;
        if (data.indexOf(":") >= 0) {
            var splitData = data.split(":");
            num = Number(splitData[0]);
            outputChan = sys.channelId(splitData[1]);
        } else {
            num = Number(data);
        }
        if (!num) {
            sys.sendMessage(src, "±Info: This is not a valid number!", mafiachan);
            return;
        }
        if (outputChan === undefined) {
            sys.sendMessage(src, "±Info: This is not a valid channel!", mafiachan);
            return;
        }
        if (num < 1 || num > stalkLogs.length) {
            sys.sendMessage(src, "±Info: There's no log with this id!", mafiachan);
            return;
        }

        sys.sendMessage(src, "", outputChan);
        var stalkLog = stalkLogs[num - 1].split("::**::");
        for (var c = 0; c < stalkLog.length; ++c) {
            sys.sendMessage(src, stalkLog[c], outputChan);
        }
        sys.sendMessage(src, "", outputChan);
        if (outputChan != mafiachan) {
            sys.sendMessage(src, "±Info: Game log was printed in channel " + sys.channel(outputChan), mafiachan);
        }
    };
    this.addTheme = function (src, url) {
        if (!mafia.isMafiaAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.loadWebTheme(url, true, false);
    };
    this.updateTheme = function (src, data) {
        var url = data, name = data;
        if (data.indexOf("::") >= 0) {
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
            mafia.themeManager.loadWebTheme(dlurl, true, true, authorMatch ? theme.name.toLowerCase() : null);
        }
    };
    this.announceTest = function (src, name) {
        sendChanAll("", mafiachan);
        sendChanAll(DEFAULT_BORDER, mafiachan);
        sendChanAll("±Murkrow: A " + name + " mafia theme is being tested on the Pokemon Online 2 server! Get over there to participate on the testing yourself.", mafiachan);
        sendChanAll(DEFAULT_BORDER, mafiachan);
        sendChanAll("", mafiachan);
    };
    this.removeTheme = function (src, name) {
        if (!mafia.isMafiaSuperAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.remove(src, name);
    };
    this.disableTheme = function (src, name) {
        if (!mafia.isMafiaAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.disable(src, name);
    };
    this.enableTheme = function (src, name) {
        if (!mafia.isMafiaAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.enable(src, name);
    };
    this.updateAfter = function (src) {
        msg(src, "Mafia will update after the game");
        mafia.needsUpdating = true;
        if (mafia.state == "blank") {
            runUpdate();
        }
        return;
    };

    function runUpdate() {
        if (mafia.needsUpdating !== true) return;
        var POglobal = SESSION.global();
        var index, source;
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
                sendChanAll("Update complete!", mafiachan);
            });
            sendChanAll("Updating mafia game...", mafiachan);
            mafia.needsUpdating = false;
        }
        return;
    }

    this.importOld = function (src, name) {
        msgAll("Importing old themes", mafiachan);
        mafia.themeManager.loadTheme(defaultTheme);
        mafia.themeManager.saveToFile(defaultTheme);
    };

    this.commands = {
        user: {
            commands: [this.showCommands, "To see the various commands."],
            start: [this.userVote, "Start voting for a new game theme / or vote!"],
            votetheme: [this.userVote, "Start voting for a new game theme / or vote!"],
            starttheme: [this.startGame, "Starts a Game of Mafia with specified theme."],
            help: [this.showHelp, "For info on how to win in a game."],
            roles: [this.showRoles, "For info on all the Roles in the game."],
            sides: [this.showSides, "For info on all teams in the game."],
            myrole: [this.showOwnRole, "To view again your role, help text and teammates."],
            rules: [this.showRules, "To see the Rules for the Game/Server."],
            themes: [this.showThemes, "To view installed themes."],
            themeinfo: [this.showThemeInfo, "To view installed themes (more details)."],
            changelog: [this.showThemeChangelog, "To view a theme's changelog (if it has one)"],
            details: [this.showThemeDetails, "To view info about a specific theme."],
            priority: [this.showPriority, "To view the priority list of a theme. "],
            flashme: [this.flashPlayer, "To get a alert when a new mafia game starts. Type /flashme help for more info."],
            playedgames: [this.showPlayedGames, "To view recently played games"],
            update: [this.updateTheme, "To update a Mafia Theme!"]
        },
        auth: {
            push: [this.pushUser, "To push users to a Mafia game."],
            slay: [this.slayUser, "To slay users in a Mafia game."],
            shove: [this.slayUser, "To remove users before a game starts."],
            end: [this.endGame, "To cancel a Mafia game!"],
            mafiatest: [this.announceTest, "To gather people to test a theme on PO2."],
            readlog: [this.readStalkLog, "To read the log of actions from a previous game"],
            add: [this.addTheme, "To add a Mafia Theme!"],
            remove: [this.removeTheme, "To remove a Mafia Theme!"],
            disable: [this.disableTheme, "To disable a Mafia Theme!"],
            enable: [this.enableTheme, "To enable a disabled Mafia Theme!"],
            updateafter: [this.updateAfter, "To update mafia after current game!"],
            importold: [this.importOld, ""]
        }
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
        if (channel != mafiachan && ["detain","undetain","release","mafiaban","mafiaunban","mafiabans","detained","detainlist"].indexOf(command) === -1)
            return;
        try {
            mafia.handleCommandOld(src, command, commandData, channel);
            return true;
        } catch (e) {
            if (e != "no valid command") {
                sendChanAll("Error on mafia command: " + e, mafiachan);
                return true;
            }
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
        if (SESSION.users(src).detained.active) {
            sys.sendMessage(src, "±Game: You are detained for " + SESSION.users(src).detained.games + " more games", mafiachan);
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
        var name = sys.name(src);
        for (var x in name) {
            var code = name.charCodeAt(x);
            if (name[x] != ' ' && name[x] != '.' && (code < 'a'.charCodeAt(0) || code > 'z'.charCodeAt(0))
                && (code < 'A'.charCodeAt(0) || code > 'Z'.charCodeAt(0)) && name[x] != '-' && name[x] != '_' && name[x] != '<' && name[x] != '>' && (code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0))) {
                sys.sendMessage(src, "±Name: You're not allowed to have the following character in your name: " + name[x] + ".", mafiachan);
                sys.sendMessage(src, "±Rule: You must change it if you want to join!", mafiachan);
                return;
            }
        }
        if (name.length > Config.Mafia.max_name_length) {
            sys.sendMessage(src, "±Name: You're not allowed to have more than " + Config.Mafia.max_name_length + " letters in your name!", mafiachan);
            sys.sendMessage(src, "±Rule: You must change it if you want to join!", mafiachan);
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
    this.compilePhaseStalk = function (phase) {
        currentStalk.push("*** " + phase + " ***");
        for (var u in phaseStalk) {
            currentStalk.push(u + " used: " + phaseStalk[u].join(", "));
        }
        phaseStalk = {};
    };
    this.handleCommandOld = function (src, command, commandData, channel) {
        if (command in this.commands.user) {
            this.commands.user[command][0].call(this, src, commandData, channel);
            return true;
        }
        var name, x, player, target;
        if (this.state == "entry") {
            if (command == "join") {
                if (this.canJoin(src) !== true) {
                    return;
                }
                if (this.signups.length >= this.theme["roles" + this.theme.roleLists].length) {
                    sys.sendMessage(src, "±Game: There can't be more than " + this.theme["roles" + this.theme.roleLists].length + " players!", mafiachan);
                    return;
                }
                name = sys.name(src);

                this.signups.push(name);
                this.ips.push(sys.ip(src));
                if (this.numjoins.hasOwnProperty(sys.ip(src))) {
                    this.numjoins[sys.ip(src)] += 1;
                }
                else {
                    this.numjoins[sys.ip(src)] = 1;
                }
                sendChanAll("±Game: " + name + " joined the game!", mafiachan);
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
                if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Hint: That person is not playing!", mafiachan);
                    return;
                }
                player = mafia.players[name];
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
                if (broadcast !== undefined) {
                    team = [];
                    if (broadcast == "team") {
                        team = this.getPlayersForTeam(player.role.side);
                    } else if (broadcast == "role") {
                        team = this.getPlayersForRole(player.role.role);
                    } else if (Array.isArray(broadcast)) {
                        for (var z in mafia.players) {
                            if (broadcast.indexOf(mafia.players[z].role.role) != -1) {
                                team.push(mafia.players[z].name);
                            }
                        }
                    }
                    
                    var broadcastmsg = "±Game: Your partner(s) have decided to " + command + " '" + commandData + "'!";
                    if (player.role.actions.night[command].broadcastmsg) {
                        broadcastmsg = player.role.actions.night[command].broadcastmsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData).replace(/~Action~/, command);
                    }
                    for (x in team) {
                        if (team[x] != name) {
                            this.sendPlayer(team[x], broadcastmsg);
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
                for (var i in haxRoles) {
                    var role = haxRoles[i];
                    var haxPlayers = this.getPlayersForRole(role);
                    for (var j in haxPlayers) {
                        var haxPlayer = haxPlayers[j];
                        var r = Math.random();
                        var roleName = this.theme.trside(player.role.side);
                        team = this.getPlayersForRole(player.role.side);
                        var playerRole = this.theme.trrole(player.role.role);
                        if (r < mafia.theme.roles[role].actions.hax[command].revealTeam) {
                            if (team.length > 1)
                                this.sendPlayer(haxPlayer, "±Game: The " + roleName + " are going to " + command + " " + commandData + "!");
                            else
                                this.sendPlayer(haxPlayer, "±Game: The " + roleName + " is going to " + command + " " + commandData + "!");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealPlayer) {
                            if (team.length > 1)
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is one of The " + roleName + "!");
                            else
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is The " + roleName + "!");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealRole) {
                            this.sendPlayer(haxPlayer, "±Game: " + name + " is " + playerRole + "!");
                        }

                    }
                }
                return;
            }
        } else if (this.state == "day") {
            if (this.isInGame(sys.name(src)) && command == "vote") {
                commandData = this.correctCase(commandData);
                var silentVote = mafia.theme.silentVote;
                if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                    return;
                }
                if (sys.name(src) in this.votes) {
                    sys.sendMessage(src, "±Rule: You already voted!", mafiachan);
                    return;
                }
                if (silentVote !== undefined && silentVote !== false) {
                    sys.sendMessage(src, "±Game: You voted for " + commandData + "!", mafiachan);
                    sendChanAll("±Game:" + sys.name(src) + " voted!", mafiachan);
                } else {
                    sendChanAll("±Game:" + sys.name(src) + " voted for " + commandData + "!", mafiachan);
                }
                this.addPhaseStalkAction(sys.name(src), "vote", commandData);
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
                    this.addPhaseStalkAction(name, command, target.name);
                }

                var recharge = mafia.getRecharge(player, "standby", commandName);
                if (recharge !== undefined && recharge > 0) {
                    sys.sendMessage(src, "±Game: You cannot use this action for " + recharge + " day(s)!", mafiachan);
                    return;
                }
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
                            sys.sendMessage(src, "±Game: That person is gone, you can't kill them!", mafiachan);
                            return;
                        } else if (target.role.actions.daykill == "revenge" || target.role.actions.daykill == "bomb") {
                            revenge = true;
                        } else if (typeof target.role.actions.daykill.mode == "object" && target.role.actions.daykill.mode.evadeChance > sys.rand(0, 100) / 100) {
                            sys.sendMessage(src, "±Game: Your kill was evaded!", mafiachan);
                            sys.sendMessage(sys.id(target.name), "±Game: You evaded a kill!", mafiachan);
                            player.dayKill = player.dayKill + 1 || 1;
                            if ("recharge" in commandObject) {
                                if (!(player.name in this.dayRecharges)) {
                                    this.dayRecharges[player.name] = {};
                                }
                                this.dayRecharges[player.name][commandName] = 1;
                            }
                            return;
                        }
                    }
                    sendChanAll(border, mafiachan);
                    if (!revenge) {
                        sendChanAll("±Game: " + commandObject.killmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), mafiachan);
                        if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0, 100) / 100) {
                            if (commandObject.revealmsg !== undefined && typeof commandObject.revealmsg == "string") {
                                sendChanAll("±Game: " + commandObject.revealmsg.replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
                            } else {
                                sendChanAll("±Game: While attacking, " + name + " (" + mafia.players[name].role.translation + ") made a mistake and was revealed!", mafiachan);
                            }
                        }
                        if ("daykill" in target.role.actions && target.role.actions.daykill === "revealkiller") {
                            if ("daykillrevengemsg" in target.role.actions) {
                                sendChanAll("±Game: " + target.role.actions.daykillrevengemsg.replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
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
                            sendChanAll("±Game: " + target.role.actions.daykillrevengemsg.replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);
                        } else {
                            sendChanAll("±Game: ~Target~ tries to attack ~Self~, but ~Self~ fights back and kills ~Target~!".replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);
                            if (sys.id('PolkaBot') !== undefined) {
                                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+name+" DIED", mafiachan);
                            }
                        }
                        this.kill(mafia.players[name]);
                        if (target.role.actions.daykill === "bomb")
                            this.kill(mafia.players[commandData]);
                    }

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
                    var exposeMessage = commandObject.exposemsg ? commandObject.exposemsg : "~Self~ revealed that ~Target~ is the ~Role~!";
                    var inspectMode = target.role.actions.inspect || {};
                    var revealedRole;
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
                    sendChanAll(border, mafiachan);
                    sendChanAll("±Game: " + exposeMessage.replace(/~Self~/g, name).replace(/~Target~/g, target.name).replace(/~Role~/g, revealedRole), mafiachan);
                    if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0, 100) / 100) {
                        if (commandObject.revealmsg !== undefined && typeof commandObject.revealmsg == "string") {
                            sendChanAll("±Game: " + commandObject.revealmsg.replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
                        } else {
                            sendChanAll("±Game: While exposing, " + name + " (" + mafia.players[name].role.translation + ") made a mistake and was revealed!", mafiachan);
                        }
                    }
                    sendChanAll(border, mafiachan);
                    player.exposeUse = player.exposeUse + 1 || 1;
                }
                if ("recharge" in commandObject) {
                    if (!(player.name in this.dayRecharges)) {
                        this.dayRecharges[player.name] = {};
                    }
                    this.dayRecharges[player.name][commandName] = 1;
                }
                
                
                /* Hax-related to command */
                // some roles can get "hax" from other people using some commands...
                // however, roles can have avoidStandbyHax: ["kill", "reveal"] in actions..
                if ("avoidStandbyHax" in player.role.actions && player.role.actions.avoidStandbyHax.indexOf(command) != -1) {
                    return;
                }
                var haxRoles = mafia.theme.getStandbyHaxRolesFor(command);
                for (var i in haxRoles) {
                    var role = haxRoles[i];
                    var haxPlayers = this.getPlayersForRole(role);
                    for (var j in haxPlayers) {
                        var haxPlayer = haxPlayers[j];
                        var r = Math.random();
                        var roleName = this.theme.trside(player.role.side);
                        var team = this.getPlayersForRole(player.role.side);
                        var playerRole = this.theme.trrole(player.role.role);
                        if (r < mafia.theme.roles[role].actions.standbyHax[command].revealTeam) {
                            this.sendPlayer(haxPlayer, "±Game: The " + roleName + " used " + command + " on " + commandData + "!");
                        }
                        if (r < mafia.theme.roles[role].actions.standbyHax[command].revealPlayer) {
                            if (team.length > 1)
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is one of The " + roleName + "!");
                            else
                                this.sendPlayer(haxPlayer, "±Game: " + name + " is The " + roleName + "!");
                        }
                        if (r < mafia.theme.roles[role].actions.standbyHax[command].revealRole) {
                            this.sendPlayer(haxPlayer, "±Game: " + name + " is " + playerRole + "!");
                        }

                    }
                }
                return;
            }
        }
        if (command == "join") {
            sys.sendMessage(src, "±Game: You can't join now!", mafiachan);
            return;
        }

        if (command == "mafiaadmins") {
            var out = [
                "",
                "*** MAFIA SUPER ADMINS ***",
                ""];
            var smas = [];
            for (var y in mafiaSuperAdmins.hash) {
                smas.push(y + (sys.id(y) !== undefined ? ":" : ""));
            }
            smas = smas.sort();
            for (var i = 0; i < smas.length; i++) {
                out.push(smas[i]);
            }
            out.push.apply(out,[
                "",
                "*** MAFIA ADMINS ***",
                ""]);
            var mas = [];
            for (var x in mafiaAdmins.hash) {
                mas.push(x + (sys.id(x) !== undefined ? ":" : ""));
            }
            mas = mas.sort();
            for (var i = 0; i < mas.length; i++) {
                out.push(mas[i]);
            }
            out.push("");
            dump(src, out);
            return;
        }

        if (!this.isMafiaAdmin(src) && !this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        if (command in this.commands.auth) {
            this.commands.auth[command][0].call(this, src, commandData);
            return;
        }
        var tar = sys.id(commandData);
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
            script.modCommand(src, command, commandData, tar);
            return;
        }
        var id;
        if (command == "passma") { //partially copied from tours.js
            var newname = commandData.toLowerCase();
            if (sys.dbIp(newname) === undefined) {
                sys.sendMessage(src,"This user doesn't exist!");
                return true;
            }
            if (!sys.dbRegistered(newname)) {
                sys.sendMessage(src,"That account isn't registered so you can't give it authority!");
                return true;
            }
            if (sys.id(newname) === undefined) {
                sys.sendMessage(src,"The target is offline!");
                return true;
            }
            if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                sys.sendMessage(src,"Both accounts must be on the same IP to switch!");
                return true;
            }
            if (this.isMafiaAdmin(sys.id(newname))) {
                sys.sendMessage(src,"The target is already MA!");
                return true;
            }
            // now copied from /mafiaadmin and /mafiaadminoff
            mafiaAdmins.remove(sys.name(src));
            mafiaAdmins.remove(sys.name(src).toLowerCase());
            mafiaAdmins.add(commandData.toLowerCase(), "");
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).mafiaAdmin = true;
            sys.sendMessage(src, "±Game: Your auth has been transferred!", mafiachan);
            sys.sendAll("±Murkrow: " + sys.name(src) + " passed their Mafia auth to " + commandData, sys.channelId('Victory Road'));
            return;
        }
        
        if (command == "detain") {
            var name = commandData.split(':')[0];
            var reason = commandData.split(':')[1];
            var val = commandData.split(':')[2];
            if (reason === undefined && !this.isMafiaSuperAdmin(src)) {
                sys.sendMessage(src, "±Murkrow: You must provide a reason");
                return;
            }
            if (val === undefined || isNaN(val) || val <= 0) {
                val = 3;
            }
            var tar = sys.id(name);
            if (tar) {
                if (sys.auth(tar) > 0 || this.isMafiaAdmin(tar)) {
                    sys.sendMessage(src, "±Murkrow: Cannot detain someone with auth");
                    return;
                }
                if (!SESSION.users(tar)) {
                    SESSION.users(tar).detained = {active: false, by: null, games: 0, reason: null};
                }
                SESSION.users(tar).detained.active = true;
                SESSION.users(tar).detained.by = sys.name(src);
                SESSION.users(tar).detained.games = val;
                SESSION.users(tar).detained.reason = reason;
                detained.add(sys.ip(tar), val + ":" + sys.name(src) + ":" + sys.name(tar) + ":"  + reason);
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " detained " + nonFlashing(sys.name(tar)) + " for " + val + " games [Reason: " + reason + "]", staffchannel);
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " detained " + nonFlashing(sys.name(tar)) + " for " + val + " games [Reason: " + reason + "]", sachannel);
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " detained " + nonFlashing(sys.name(tar)) + " for " + val + " games [Reason: " + reason + "]", mafiachan);
                return;
            }
            var ip = sys.dbIp(name);
            if (ip) {
                if (sys.maxAuth(ip) > 0) {
                    sys.sendMessage(src, "±Murkrow: Cannot detain someone with auth");
                    return;
                }
                detained.add(ip, val + ":" + sys.name(src) + ":" + name + ":" + reason);
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " detained " + name + " for " + val + " games [Reason: " + reason + "]", staffchannel);
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " detained " + name + " for " + val + " games [Reason: " + reason + "]", sachannel);
                sys.sendAll("±Murkrow: " + nonFlashing(sys.name(src)) + " detained " + name + " for " + val + " games [Reason: " + reason + "]", mafiachan);
                return;
            }
            sys.sendMessage(src, "±Murkrow: Player not found");
            return;
        }
        
        if (command == "undetain" || command == "release") { //"undetain" is terrible! :3
            var tar = sys.id(commandData);
            if (!tar) {
                if (detained.get(commandData)) {
                    sys.sendAll("±Murkrow: IP Address " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                    sys.sendAll("±Murkrow: IP Address " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", sachannel);
                    detained.remove(commandData);
                    return;
                }
                var ip = sys.dbIp(commandData);
                if (ip && detained.get(ip)) {
                    sys.sendAll("±Murkrow: " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                    sys.sendAll("±Murkrow: " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", sachannel);
                    detained.remove(ip);
                    return;
                }
                sys.sendMessage(src, "±Murkrow: They are not detained");
                return;
            }
            if (!SESSION.users(tar).detained) {
                SESSION.users(tar).detained = {active: false, by: null, games: 0, reason: null};
            }
            if (!SESSION.users(tar).detained.games) {
                sys.sendMessage(src, "±Murkrow: They are not detained");
                return;
            }
            sys.sendAll("±Murkrow: " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", staffchannel);
            sys.sendAll("±Murkrow: " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", sachannel);
            sys.sendAll("±Murkrow: " + commandData + " was released by " + nonFlashing(sys.name(src)) + "!", mafiachan);
            SESSION.users(tar).detained.active = false;
            SESSION.users(tar).detained.games = 0;
            detained.remove(sys.ip(tar));
            return;
        }
        
        if (command == "detained" || command == "detainlist") {
            var mh = detained;
            var name = "Detained";
            var width=5;
            var max_message_length = 30000;
            var tmp = [];
            var toDelete = [];
            for (var ip in mh.hash) {
                if (mh.hash.hasOwnProperty(ip)) {
                    var values = mh.hash[ip].split(":");
                    var games = 0;
                    var by = "";
                    var banned_name;
                    var reason = "";
                    if (values.length >= 4) {
                        games = parseInt(values[0], 10);
                        by = values[1];
                        banned_name = values[2];
                        reason = values.slice(3);
                        if (games === 0) {
                            toDelete.push(ip);
                            continue;
                        }
                    }
                    if(commandData != "*" && (!banned_name || banned_name.toLowerCase().indexOf(commandData.toLowerCase()) == -1))
                        continue;
                    tmp.push([ip, banned_name, by, games, utilities.html_escape(reason)]);
                }
            }
            for (var k = 0; k < toDelete.length; ++k)
                delete mh.hash[toDelete[k]];
            if (toDelete.length > 0)
                mh.save();

            tmp.sort(function(a,b) { return a[3] - b[3];});

            // generate HTML
            var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Games until expiry</th><th>Reason</th>';
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

        if (command == "mafiaadmin") {
            mafiaAdmins.add(commandData.toLowerCase(), "");
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).mafiaAdmin = true;
            sys.sendMessage(src, "±Game: That person is now a mafia admin!", mafiachan);
            sys.sendAll("±Murkrow: " + sys.name(src) + " promoted " + commandData, sys.channelId('Victory Road'));
            return;
        }
        if (command == "mafiaadminoff") {
            mafiaAdmins.remove(commandData);
            mafiaAdmins.remove(commandData.toLowerCase());
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).mafiaAdmin = false;
            sys.sendMessage(src, "±Game: That person is no longer a mafia admin!", mafiachan);
            sys.sendAll("±Murkrow: " + sys.name(src) + " demoted " + commandData, sys.channelId('Victory Road'));
            return;
        }
        
        if (sys.auth(src) < 3) {
            throw ("no valid command");
        }
        if (command == "mafiasadmin" || command == "mafiasuperadmin") {
            mafiaSuperAdmins.add(commandData.toLowerCase(), "");
            sys.sendMessage(src, "±Game: That person is now a mafia super admin!", mafiachan);
            sys.sendAll("±Murkrow: " + sys.name(src) + " promoted " + commandData, sys.channelId('Victory Road'));
            return;
        }
        
        if (command == "mafiasadminoff" || command == "mafiasuperadminoff") {
            mafiaSuperAdmins.remove(commandData);
            mafiaSuperAdmins.remove(commandData.toLowerCase());
            sys.sendMessage(src, "±Game: That person is no longer a mafia super admin!", mafiachan);
            sys.sendAll("±Murkrow: " + sys.name(src) + " demoted " + commandData, sys.channelId('Victory Road'));
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
        if (this.isInGame(sys.name(src))) {
            if (this.state != "day") {
                this.slayUser(Config.capsbot, sys.name(src));
            } else {
                mafia.usersToSlay.push(sys.name(src));
            }
        }
    };

    this.onMban = function (src) {
        if (this.isInGame(sys.name(src))) {
            this.slayUser(Config.Mafia.bot, sys.name(src));
        }
        if (sys.isInChannel(src, mafiachan)) {
            sys.kick(src, mafiachan);
        }
    };

    this.onKick = function (src) {
        if (this.isInGame(sys.name(src))) {
            if (this.state != "day") {
                this.slayUser(Config.kickbot, sys.name(src));
            } else {
                mafia.usersToSlay.push(sys.name(src));
            }
        }
    };

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
        msgAll("Mafia was reloaded, please start a new game!");
    };

}
/* Functions defined by mafia which should be called from main script:
* - init
* - stepEvent
* - onKick, onMute, onMban
* - beforeChatMessage
* - handleCommand
*/

module.exports = new Mafia(sys.channelId(MAFIA_CHANNEL));
