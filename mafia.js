/*
* mafia.js
*
* Contains code for server side mafia game.
* Original code by unknown.
*/

// Global variables inherited from scripts.js
/*global cmp, mafiabot, getTimeString, mafiaAdmins, updateModule, script, saveKey*/

var MAFIA_CHANNEL = "Mafia Channel";

var is_command = require("utilities.js").is_command;

function Mafia(mafiachan) {
    // Remember to update this if you are updating mafia
    // Otherwise mafia game won't get reloaded
    this.version = "2012-08-13.1";
    var mafia = this;

    var noPlayer = '*';
    var CurrentGame;
    var PreviousGames;
    var MAFIA_SAVE_FILE = Config.Mafia.stats_file;
var MAFIA_LOG_FILE = "mafialogs.txt";
    var MAFIA_VILLIFIED_FILE = "mafiavillified.json";
var stalkLogs = [];
var currentStalk = [];
var phaseStalk = {};

    var villifiedPlayers = [];

    var DEFAULT_BORDER = "***************************************************************************************";
    var border;

    var saveVillifiedPlayers = function {
    sys.writeToFile(MAFIA_VILLIFIED_FILE, JSON.stringify(villifiedPlayers));
    };
    var savePlayedGames = function() {
        sys.writeToFile(MAFIA_SAVE_FILE, JSON.stringify(PreviousGames));
    };
    var loadPlayedGames = function() {
        try {
            PreviousGames = JSON.parse(sys.getFileContent(MAFIA_SAVE_FILE));
        } catch(e) {
            PreviousGames = [];
        }
try {
stalkLogs = sys.getFileContent(MAFIA_LOG_FILE).split("::@@::");
} catch (e) {
stalkLogs = [];
}
try {
villifiedPlayers = JSON.parse(sys.getFileContent(MAFIA_VILLIFIED_FILE));
} catch (e) {
villifiedPlayers = [];
}
    };
    loadPlayedGames();

    function dump(src, mess) {
        for (var x in mess) {
           sys.sendMessage(src, mess[x], mafiachan);
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
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i, 10), x = o[--i], o[i] = o[j], o[j] = x);
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
            return arr.slice(0, arr.length-1).join(", ") + " " + last_delim + " " + arr.slice(-1)[0];
        } else if (arr.length == 1) {
            return arr[0];
        } else {
            return "";
        }
    }


    var defaultTheme = {
      name: "default",
      sides: [
        { "side": "mafia", "translation": "Mafia"
        },
        { "side": "mafia1", "translation": "French Canadian Mafia"
        },
        { "side": "mafia2", "translation": "Italian Mafia"
        },
        { "side": "village", "translation": "Good people"
        },
        { "side": "werewolf", "translation": "WereWolf"
        },
        { "side": "godfather", "translation": "Godfather"
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
          "actions": { "night": {"inspect": {"target": "AnyButSelf", "common": "Self", "priority": 30} } }
      }, {
          "role": "bodyguard",
          "translation": "Bodyguard",
          "side": "village",
          "help": "Type /Protect [name] to protect someone!",
          "actions": { "night": {"protect": {"target": "AnyButSelf", "common": "Role", "priority": 5, "broadcast": "role"} },
                       "startup": "role-reveal"}
      }, {
          "role": "mafia",
          "translation": "Mafia",
          "side": "mafia",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team"} },
                       "startup": "team-reveal"}
      }, {
          "role": "werewolf",
          "translation": "WereWolf",
          "side": "werewolf",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButSelf", "common": "Self", "priority": 10} },
                       "distract": {"mode": "ChangeTarget", "hookermsg": "You tried to distract the Werewolf (what an idea, srsly), you were ravishly devoured, yum!", "msg": "The ~Distracter~ came to you last night! You devoured her instead!"},
                       "avoidHax": ["kill"] }
      }, {
          "role": "hooker",
          "translation": "Pretty Lady",
          "side": "village",
          "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!",
          "actions": { "night": {"distract": {"target": "AnyButSelf", "common": "Self", "priority": 1} } }
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
          "actions": { "hax": {"kill": { "revealTeam": 0.33, "revealPlayer": 0.1} } }
      }, {
          "role": "godfather",
          "translation": "Godfather",
          "side": "godfather",
          "help": "Type /Kill [name] to kill someone! You can kill 2 targets, Type /kill [name2] again to select your second target!",
          "actions": { "night": {"kill": {"target": "AnyButSelf", "common": "Self", "priority": 20, "limit": 2} },
                       "distract": {"mode": "ChangeTarget", "hookermsg": "You tried to seduce the Godfather... you were killed instead!", "msg": "The ~Distracter~ came to you last night! You killed her instead!"},
                       "avoidHax": ["kill"] }
      }, {
          "role": "vigilante",
          "translation": "Vigilante",
          "side": "village",
          "help": "Type /Kill [name] to kill someone!(dont kill the good people!)",
          "actions": { "night": {"kill": {"target": "AnyButSelf", "common": "Self", "priority": 19} } }
      }, {
          "role": "mafia1",
          "translation": "French Canadian Mafia",
          "side": "mafia1",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team"} },
                       "startup": "team-reveal"}
      }, {
          "role": "mafia2",
          "translation": "Italian Mafia",
          "side": "mafia2",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team"} },
                       "startup": "team-reveal"}
      }, {
          "role": "conspirator1",
          "translation": "French Canadian Conspirator",
          "side": "mafia1",
          "help": "You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "villager"},
                       "startup": "team-reveal"}
      }, {
          "role": "conspirator2",
          "translation": "Italian Conspirator",
          "side": "mafia2",
          "help": "You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "villager"},
                       "startup": "team-reveal"}
      }, {
          "role": "mafiaboss1",
          "translation": "Don French Canadian Mafia",
          "side": "mafia1",
          "help": "Type /Kill [name] to kill someone! You can't be distracted!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team"} },
                      "distract": {"mode": "ignore"},
                      "startup": "team-reveal"}
      }, {
          "role": "mafiaboss2",
          "translation": "Don Italian Mafia",
          "side": "mafia2",
          "help": "Type /Kill [name] to kill someone! You can't be distracted!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team"} },
                      "distract": {"mode": "ignore"},
                      "startup": "team-reveal"}
      }, {
          "role": "samurai",
          "translation": "Samurai",
          "side": "village",
          "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people.",
          "actions": { "standby": {"kill": {"target": "AnyButSelf", "msg": "You can kill now using /kill [name] :",
                                   "killmsg": "~Self~ pulls out a sword and strikes it through ~Target~'s chest!"} } }
      }, {
          "role": "miller",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day! Oh, and insp sees you as Mafia",
          "actions": { "inspect": {"revealAs": "mafia"} }
      }, {
          "role": "truemiller",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "mafia"}, "lynch": {"revealAs": "mafia"}, "startup": {"revealAs": "villager"}, "onlist": "mafia" }
      }, {
          "role": "miller1",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "mafia1"}, "lynch": {"revealAs": "mafia1"}, "startup": {"revealAs": "villager"}, "onlist": "mafia1" }
      }, {
          "role": "miller2",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "mafia2"}, "lynch": {"revealAs": "mafia2"}, "startup": {"revealAs": "villager"}, "onlist": "mafia2" }
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
    ThemeManager.prototype.toString = function() { return "[object ThemeManager]"; };

    ThemeManager.prototype.save = function(name, url, resp) {
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
        sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
    };

    ThemeManager.prototype.loadTheme = function(plain_theme) {
        var theme = new Theme();
        try {
            theme.sideTranslations = {};
            theme.sideWinMsg = {};
            theme.roles = {};
            theme.nightPriority = [];
            theme.standbyRoles = [];
            theme.haxRoles = {};
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
            while ("roles"+i in plain_theme) {
                theme["roles"+i] = plain_theme["roles"+i];
              ++i;
            }
            theme.roleLists = i-1;
            if (theme.roleLists === 0)
                throw "This theme has no roles1, it can not be played.";
            theme.villageCantLoseRoles = plain_theme.villageCantLoseRoles;
            theme.name = plain_theme.name;
            theme.author = plain_theme.author;
            theme.summary = plain_theme.summary;
            theme.killmsg = plain_theme.killmsg;
            theme.killusermsg = plain_theme.killusermsg;
            theme.border = plain_theme.border;
            theme.generateRoleInfo();
            theme.generateSideInfo();
            theme.enabled = true;
            return theme;
        } catch (err) {
            msgAll("Couldn't use theme " + plain_theme.name + ": "+err+".");
        }
    };

    ThemeManager.prototype.loadThemes = function() {
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
            } catch(err) {
                msgAll("Error loading cached theme \"" + this.themeInfo[i][0] + "\": " + err);
            }
        }
    };
    ThemeManager.prototype.saveToFile = function(plain_theme) {
        if (typeof sys != "object") return;
        var fname = "mafiathemes/theme_" + plain_theme.name.toLowerCase();
        sys.writeToFile(fname, JSON.stringify(plain_theme));
        this.themeInfo.push([plain_theme.name, "", fname, true]);
        sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
    };

    ThemeManager.prototype.loadWebTheme = function(url, announce, update, updatename) {
        if (typeof sys != 'object') return;
        var manager = this;
        sys.webCall(url, function(resp) {
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
                msgAll("Couldn't download theme from "+url);
                msgAll("" + err);
                return;
            }
        });
    };

    ThemeManager.prototype.remove = function(src, name) {
        name = name.toLowerCase();
        if (name in this.themes) {
            delete this.themes[name];
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo.splice(i,1);
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
            msg(src, "theme " + name + " removed.");
        }
    };

    ThemeManager.prototype.enable = function(src, name) {
        name = name.toLowerCase();
        if (name in this.themes) {
            this.themes[name].enabled = true;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = true;
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
            msg(src, "theme " + name + " enabled.");
        }
    };

    ThemeManager.prototype.disable = function(src, name) {
        name = name.toLowerCase();
        if (name in this.themes) {
            this.themes[name].enabled = false;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = false;
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
            msg(src, "theme " + name + " disabled.");
        }
    };

    /* Theme is a small helper to organize themes
* inside the mafia game */
    function Theme() {}
    Theme.prototype.toString = function() { return "[object Theme]"; };

    Theme.prototype.addSide = function(obj) {
        this.sideTranslations[obj.side] = obj.translation;
        if ("winmsg" in obj){
            this.sideWinMsg[obj.side] = obj.winmsg;
        }
    };
    Theme.prototype.addRole = function(obj) {
        this.roles[obj.role] = obj;
        if (!obj.actions) {
            obj.actions = {};
        }
        if (typeof obj.side == "object") {
            this.randomSideRoles[obj.role] = obj.side;
        }

        var i, action;
        if ("hax" in obj.actions) {
            for(i in obj.actions.hax) {
                action = i;
                if (!(action in this.haxRoles)) {
                    this.haxRoles[action] = [];
                }
                this.haxRoles[action].push(obj.role);
            }
        }
        if ("night" in obj.actions) {
            for (i in obj.actions.night) {
                var priority = obj.actions.night[i].priority;
                action = i;
                var role = obj.role;
                this.nightPriority.push({'priority': priority, 'action': action, 'role': role});
            }
            this.nightPriority.sort(function(a,b) { return a.priority - b.priority; });
        }
        if ("standby" in obj.actions) {
            this.standbyRoles.push(obj.role);
        }
    };
    function name_trrole(x) { return x + " (" + this.trrole(mafia.players[x].role.role) + ")"; }
    Theme.prototype.generateRoleInfo = function() {
        var sep = "*** *********************************************************************** ***";
        var roles = [sep];
        var role;
        var role_i = null;
        var role_order = Object.keys(this.roles);
        var this_roles = this.roles;
        role_order.sort(function(a,b) {
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
                        abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") +" during the night. ";
                        if ("avoidHax" in role.actions && role.actions.avoidHax.indexOf(a) != -1) {
                            abilities += "(Can't be detected by spies.) ";
                        }
                    }
                }
                if (role.actions.standby) {
                    for (a in role.actions.standby) {
                        ability = role.actions.standby[a];
                        abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") +" during the standby. ";
                    }
                }
                if ("vote" in role.actions) {
                    abilities += "Vote counts as " + role.actions.vote + ". ";
                }
                if ("voteshield" in role.actions) {
                    abilities += "Receives " + role.actions.voteshield + " extra votes if voted for at all. ";
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
                            abilities += "Has a " + Math.floor(role.actions.kill.mode.evadeChance*100) + "% chance of evading nightkills. ";
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
                    else if (typeof role.actions.daykill == "object" && typeof role.actions.daykill.mode == "object" && role.actions.daykill.mode.evadeChance > 0){
                        abilities += "Has a " + Math.floor(role.actions.daykill.mode.evadeChance*100) + "% chance of evading daykills. ";
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
                        abilities += "Has a " + Math.floor(role.actions.poison.mode.evadeChance*100) + "% chance of evading poison. ";
                    }
                }
                if ("hax" in role.actions && Object.keys) {
                    var haxy = Object.keys(role.actions.hax);
                    abilities += "Gets hax on " + readable(haxy, "and") + ". ";
                }
                if ("inspect" in role.actions) {
                    if (Array.isArray(role.actions.inspect.revealAs)) {
                        var revealAs = role.actions.inspect.revealAs.map(trrole, this);
                        abilities += "Reveals as " + readable(revealAs, "or") + " when inspected. ";
                    } else if (role.actions.inspect.revealAs == "*") {
                        abilities += "Reveals as a random role when inspected. ";
                    } else {
                        abilities += "Reveals as " + this.roles[role.actions.inspect.revealAs].translation + " when inspected. ";
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
                    for(var p = 0; p < plop.length; ++p) {
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
            for(var i = 1; i <= this.roleLists; ++i) {
                role_i = "roles"+i;
                var start = this[role_i].indexOf(role.role);
                var last = end;
                end = this[role_i].length;
                if (start >= 0) {
                    ++start;
                    start = start > last ? start : 1+last;
                    if(parts.length > 0 && parts[parts.length-1][1] == start-1) {
                        parts[parts.length-1][1] = end;
                    } else {
                        parts.push([start,end]);
                        if (parts.length > 1) {
                            parts[parts.length-2] = parts[parts.length-2][0] < parts[parts.length-2][1] ? parts[parts.length-2].join("-") : parts[parts.length-2][1];
                        }
                    }
                }
            }
            if (parts.length > 0) {
                parts[parts.length-1] = parts[parts.length-1][0] < parts[parts.length-1][1] ? parts[parts.length-1].join("-") : parts[parts.length-1][1];
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
    Theme.prototype.generateSideInfo = function() {
        var sep = "*** *********************************************************************** ***";
        var sides = [sep];
        var side;
        var side_order = Object.keys(this.sideTranslations);
        var this_sideTranslations = this.sideTranslations;
        // sort sides by name
        side_order.sort(function(a,b) {
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
        role_order.sort(function(a,b) {
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
                    for(var p = 0; p < plop.length; ++p) {
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
    Theme.prototype.trside = function(side) {
        return this.sideTranslations[side];
    };
    Theme.prototype.trrole = function(role) {
        return this.roles[role].translation;
    };
    Theme.prototype.getHaxRolesFor = function(command) {
        if (command in this.haxRoles) {
            return this.haxRoles[command];
        }
        return [];
    };
    // End of Theme

    this.isInGame = function(player) {
        if (this.state == "entry") {
            return this.signups.indexOf(player) != -1;
        }
        return player in this.players;
    };
    // init
    this.themeManager = new ThemeManager();

    this.hasCommand = function(name, command, state) {
        var player = this.players[name];
        return (state in player.role.actions && command in player.role.actions[state]);
    };
    this.correctCase = function(string) {
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
this.saveStalkLog = function() {
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
    this.clearVariables = function() {
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
    };
    this.lastAdvertise = 0;
    this.reduceRecharges = function() {
        var o, a;
        for (o in this.teamRecharges) {
            for (a in this.teamRecharges[o]) {
                if (this.teamRecharges[o][a] > 0) --this.teamRecharges[o][a];
            }
        }
        for (o in this.roleRecharges) {
            for (a in this.roleRecharges[o]) {
                if (this.roleRecharges[o][a] > 0) --this.roleRecharges[o][a];
            }
        }
        for (var p in this.players) {
            for (o in this.players[p].recharges) {
                if (this.players[p].recharges[o] > 0) --this.players[p].recharges[o];
            }
        }
    };
    this.resetTargets = function() {
        this.teamTargets = {};
        this.roleTargets = {};
        for (var p in this.players) {
            this.players[p].targets = {};
            this.players[p].dayKill = undefined;
            this.players[p].revealUse = undefined;
            this.players[p].exposeUse = undefined;
            this.players[p].guarded = undefined;
            this.players[p].safeguarded = undefined;
        }
    };
    this.clearVariables();
    /* callback for /start */
    this.userVote = function(src, commandData) {
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
                        .map(function(g) { return g.what; });
            // Disable player selection of themes.
            /*
if (themeName in this.themeManager.themes && this.themeManager.themes[themeName].enabled) {
if (Check.indexOf(themeName) == -1 && themeName != "default") {
if (!(themeName in this.possibleThemes)) {
this.possibleThemes[themeName] = 0;
--total;
}
}
}
*/
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
            sys.sendAll("", mafiachan);
            sys.sendAll(border, mafiachan);
            sys.sendAll("±Game: " + sys.name(src) + " started a voting for next game's theme!. You have " + this.ticks + " seconds to vote with /votetheme!", mafiachan);
            sys.sendAll("±Game: Choose from these themes: " + Object.keys(this.possibleThemes).join(", ") +" !", mafiachan);
            sys.sendAll(border, mafiachan);
            sys.sendAll("", mafiachan);
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
                sys.sendAll("±Game: " + sys.name(src) + " changed their vote to "+ this.themeManager.themes[themeName].name + "!", mafiachan);
        } else {
            sys.sendAll("±Game: " + sys.name(src) + " voted for "+ this.themeManager.themes[themeName].name + "!", mafiachan);
        }
        this.votes[sys.ip(src)] = {theme: themeName, who: sys.name(src)};
    };
    /* callback for /realstart */
    this.startGame = function(src, commandData) {
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
                        sys.sendMessage(src, "±Game: Sorry, you have started a game " + (i + 1) + " games ago, let someone else have a chance!",mafiachan);
                        return;
                    }
                    if (themeName !== "default" && what == themeName) {
                        sys.sendMessage(src, "±Game: This theme was started " + (i + 1) + " games ago! No repeat!",mafiachan);
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
       sys.sendMessage(src, "±Game: Command is currently disabled for testing. Try using /start instead!", mafiachan);
            return;
        } else {
            this.theme = this.themeManager.themes[themeName];
        }

        border = this.theme.border ? this.theme.border : DEFAULT_BORDER;
        CurrentGame = {who: src !== null ? sys.name(src) : "voted", what: themeName, when: parseInt(sys.time(), 10), playerCount: 0};

        if (src !== null) {
            sys.sendAll("", mafiachan);
            sys.sendAll(border, mafiachan);
            if (this.theme.name == "default") {
                sys.sendAll("±Game: " + sys.name(src) + " started a game!", mafiachan);
            } else {
                sys.sendAll("±Game: " + sys.name(src) + " started a game with theme "+this.theme.name+"!", mafiachan);
            }
            sys.sendAll("±Game: Type /Join to enter the game!", mafiachan);
            sys.sendAll(border, mafiachan);
            sys.sendAll("", mafiachan);
        }
        
        var playerson = sys.playerIds();
        for (var x = 0; x < playerson.length; ++x) {
            var id = playerson[x];
            var user = SESSION.users(id);
            if (sys.loggedIn(id) && user && user.mafiaalertson && (user.mafiaalertsany || user.mafiathemes.indexOf(this.theme.name.toLowerCase()) != -1)) {
                if (sys.isInChannel(id, mafiachan)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) +"<ping/>!", mafiachan);
                    continue;
                } else if (sys.isInChannel(id, 0)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) +"<ping/>!", 0);
                    continue;
                } else if (sys.existChannel("Project Mafia") && sys.isInChannel(id, sys.channelId("Project Mafia"))) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) +"<ping/>!", sys.channelId("Project Mafia"));
                    continue;
                }
                sys.sendHtmlMessage(id, "A " + (this.theme.name == "default" ? "" : this.theme.name + "-themed ") + "mafia game is starting, " + sys.name(id) +"<ping/>!");
            }
        }

        if (this.theme.summary === undefined) {
            sys.sendAll("±Game: Consider adding a summary field to this theme that describes the setting of the game and points out the odd quirks of the theme!",mafiachan);
        } else {
            sys.sendAll("±Game: " + this.theme.summary,mafiachan);
        }

        if (sys.playersOfChannel(mafiachan).length < 150) {
            var time = parseInt(sys.time(), 10);
            if (time > this.lastAdvertise + 60*15) {
                this.lastAdvertise = time;
                sys.sendAll("", 0);
                sys.sendAll(border, 0);
                if (this.theme.name == "default") {
                    sys.sendAll("±Game: A new mafia game was started at #" + sys.channel(mafiachan) + "!", 0);
                } else {
                    sys.sendAll("±Game: A new " + this.theme.name + "-themed mafia game was started at #" + sys.channel(mafiachan) + "!", 0);
                }
                sys.sendAll(border, 0);
                sys.sendAll("", 0);
                if(sys.existChannel("Project Mafia")){
                    var PM = sys.channelId("Project Mafia");
                    sys.sendAll("", PM);
                    sys.sendAll(border, PM);
                    if (this.theme.name == "default") {
                        sys.sendAll("±Game: A new mafia game was started at #" + sys.channel(mafiachan) + "!", PM);
                    } else {
                        sys.sendAll("±Game: A new " + this.theme.name + "-themed mafia game was started at #" + sys.channel(mafiachan) + "!", PM);
                    }
                    sys.sendAll(border, PM);
                    sys.sendAll("", PM);
                }
            }
        }
        this.clearVariables();
        mafia.state = "entry";

        mafia.ticks = 60;
    };
    /* callback for /end */
    this.endGame = function(src) {
        if (mafia.state == "blank") {
            sys.sendMessage(src, "±Game: No game is going on.",mafiachan);
            return;
        }
        sys.sendAll(border, mafiachan);

        sys.sendAll("±Game: " + (src ? sys.name(src) : Config.Mafia.bot) + " has stopped the game!", mafiachan);
        sys.sendAll(border, mafiachan);
        sys.sendAll("", mafiachan);

        mafia.clearVariables();
        runUpdate();
    };
    /* called every second */
    this.tickDown = function() {
        if (this.ticks <= 0) {
            return;
        }
        this.ticks = this.ticks - 1;
        if (this.ticks === 0) {
            this.callHandler(this.state);
        } else {
            if (this.ticks == 30 && this.state == "entry") {
                sys.sendAll("", mafiachan);
                sys.sendAll("±Game: Hurry up, you only have "+this.ticks+" seconds more to join!", mafiachan);
                sys.sendAll("", mafiachan);
            }
        }
    };
    this.sendPlayer = function(player, message) {
        var id = sys.id(player);
        if (id === undefined)
            return;
        sys.sendMessage(id, message, mafiachan);
    };
    // Grab a list of all roles belonging to a given team.
    this.getRolesForTeam = function(side) {
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

    this.getPlayersForTeam = function(side) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.side == side) {
                team.push(player.name);
            }
        }
        return team;
    };
    this.getPlayersForTeamS = function(side) {
        return mafia.getPlayersForTeam(side).join(", ");
    };
    this.getPlayersForRole = function(role) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.role == role) {
                team.push(player.name);
            }
        }
        return team;
    };
    this.getPlayersForRoleS = function(role) {
        return mafia.getPlayersForRole(role).join(", ");
    };
    this.getCurrentRoles = function() {
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
    this.getCurrentPlayers = function() {
        var list = [];
        for (var p in this.players) {
            list.push(this.players[p].name);
        }
        return list.sort().join(", ");

    };
    this.player = function(role) {
        for (var p in this.players) {
            if (mafia.players[p].role.role == role) //Checks sequentially all roles to see if this is the good one
                return p;
        }
        return noPlayer;
    };
    this.removePlayer = function(player) {
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
    this.kill = function(player) {
        if (this.theme.killmsg) {
            sys.sendAll(this.theme.killmsg.replace(/~Player~/g, player.name).replace(/~Role~/g, player.role.translation), mafiachan);
        } else {
            sys.sendAll("±Kill: " + player.name + " (" + player.role.translation + ") died!", mafiachan);
        }
        this.removePlayer(player);
    };
    this.removeTargets = function(player) {
        for (var action in player.role.actions.night) {
            this.removeTarget(player, action);
        }
    };
    this.removeTarget = function(player, action) {
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
    this.setRechargeFor = function(player, phase, action, count) {
        var commonTarget = player.role.actions[phase][action].common;
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
        }
    };
    this.getRecharge = function(player, phase, action) {
        var commonTarget = player.role.actions[phase][action].common;
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
        }
    };
    this.getTargetsFor = function(player, action) {
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
                this.teamTargets[player.role.side][action]= [];
            }
            return this.teamTargets[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action]= [];
            }
            return this.roleTargets[player.role.role][action];
        }
    };
    this.setTarget = function(player, target, action) {
        var commonTarget = player.role.actions.night[action].common;
        var limit = 1;
        if (player.role.actions.night[action].limit !== undefined) {
            limit = player.role.actions.night[action].limit;
        }
        var list;
        if (commonTarget == 'Self') {
            if (!(action in player.targets)) {
                player.targets[action] = [];
            }
            list = player.targets[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            if (!(action in this.teamTargets[player.role.side])) {
                this.teamTargets[player.role.side][action]= [];
            }
            list = this.teamTargets[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action]= [];
            }
            list = this.roleTargets[player.role.role][action];
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
this.setPlayerRole = function(player, role) {
player.role = mafia.theme.roles[role];
if (typeof mafia.theme.roles[role].side == "object") {
            player.role.side = randomSample(mafia.theme.roles[role].side.random);
}
if ("night" in player.role.actions) {
for (var act in player.role.actions.night) {
if ("initialrecharge" in player.role.actions.night[act]) {
mafia.setRechargeFor(player, "night", act, player.role.actions.night[act].initialrecharge);
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
}
};
    this.testWin = function() {

        if (Object.keys(mafia.players).length === 0) {
            sys.sendAll("±Game: Everybody died! This is why we can't have nice things :(", mafiachan);
            sys.sendAll(border, mafiachan);
            mafia.clearVariables();
            runUpdate();
            return true;

        }
        outer:
        for (var p in mafia.players) {
            var winSide = mafia.players[p].role.side;
            if (winSide != 'village') {
                for (var i in mafia.theme.villageCantLoseRoles) {
                     if (mafia.player(mafia.theme.villageCantLoseRoles[i]) != noPlayer)
                        // baddies shouldn't win if vigi, mayor or samurai is alive
                        continue outer;
                }
            }
            //Roles which win when certain roles are dead
            var winByDeadRoles;
            if (mafia.players[p].role.hasOwnProperty("winIfDeadRoles")) {
                var deadRoles = mafia.players[p].role.winIfDeadRoles;
                winByDeadRoles = true;
                for(var t = 0; t < deadRoles.length; ++t) {
                    if (mafia.getPlayersForRoleS(deadRoles[t]) !== "") {
                        winByDeadRoles = false;
                        break;
                    }
                }
            }
            var players = [];
            var goodPeople = [];
            if (winByDeadRoles) {
                players = mafia.getPlayersForTeam(mafia.players[p].role.side);
            } else {
                for (var x in mafia.players) {
                    // Roles which win with multiple sides
                    if (mafia.players[x].role.hasOwnProperty("winningSides")) {
                        var ws = mafia.players[x].role.winningSides;
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
                    } else if (mafia.players[x].role.side == 'village') {
                        goodPeople.push(x);
                    } else {
                        // some other baddie team alive
                        continue outer;
                    }
                }
            }

            if (winByDeadRoles || players.length >= goodPeople.length) {
                if(winSide in mafia.theme.sideWinMsg){
                    sys.sendAll(mafia.theme.sideWinMsg[winSide].replace(/~Players~/g, readable(players, "and")) , mafiachan);
                } else {
                    sys.sendAll("±Game: The " + mafia.theme.trside(winSide) + " (" + readable(players, "and") + ") wins!", mafiachan);
                }
                if (winByDeadRoles) {
                    var losingSides = [];
                    for (var tr in mafia.theme.sideTranslations) {
                        if (tr !== winSide && mafia.getPlayersForTeamS(tr) !== "") {
                            losingSides.push(mafia.theme.trside(tr) + " (" + readable(mafia.getPlayersForTeam(tr), "and") + ")");
                        }
                    }
                    sys.sendAll("±Game: The " + readable(losingSides, "and") + " lose!", mafiachan);
                } else if (goodPeople.length > 0) {
                    sys.sendAll("±Game: The " + mafia.theme.trside('village') + " (" + readable(goodPeople, "and") + ") lose!", mafiachan);
                }
                sys.sendAll(border, mafiachan);
                mafia.clearVariables();
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
        for(x in hash) {
            psum += hash[x];
            count += 1;
        }
        if (psum === 0.0) {
            var j = 0;
            for (x in hash) {
                cum = (++j)/count;
                if (cum >= val) {
                    return x;
                }
            }
        } else {
        for (x in hash) {
                cum += hash[x]/psum;
                if (cum >= val) {
                    return x;
                }
            }
        }
    }

    this.handlers = {
        entry: function () {
            sys.sendAll(border, mafiachan);
            sys.sendAll("Times Up! :", mafiachan);

            // Save stats if the game was played
            CurrentGame.playerCount = mafia.signups.length;
            PreviousGames.push(CurrentGame);
            savePlayedGames();

currentStalk.push("*** ::: ::: Log for " + mafia.theme.name + "-themed mafia game ::: ::: ***");

            if (mafia.signups.length < 5) {
                sys.sendAll("Well, Not Enough Players! :", mafiachan);
                sys.sendAll("You need at least 5 players to join (Current; " + mafia.signups.length + ").", mafiachan);
                sys.sendAll(border, mafiachan);
                mafia.clearVariables();
                return;
            }
            
            /* Resetting the Random Sides Object */
            for (var x in mafia.theme.randomSideRoles) {
                mafia.theme.roles[x].side = mafia.theme.randomSideRoles[x];
            }

            /* Creating the roles list */
            var i = 1;
            while (mafia.signups.length > mafia.theme["roles"+i].length) {
               ++i;
            }
            var srcArray = mafia.theme["roles"+i].slice(0, mafia.signups.length);

            srcArray = shuffle(srcArray);

            for (i = 0; i < srcArray.length; ++i) {
                mafia.players[mafia.signups[i]] = {'name': mafia.signups[i], 'role': mafia.theme.roles[srcArray[i]], 'targets': {}, 'recharges': {}};
                var rechargeplayer = mafia.players[mafia.signups[i]];
                var initPlayer = mafia.players[mafia.signups[i]];
                if ("night" in initPlayer.role.actions) {
                    for (var act in initPlayer.role.actions.night) {
                        if ("initialrecharge" in initPlayer.role.actions.night[act]) {
                            mafia.setRechargeFor(initPlayer, "night", act, initPlayer.role.actions.night[act].initialrecharge);
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
                }
                if (typeof mafia.theme.roles[srcArray[i]].side == "object") {
                    if ("random" in mafia.theme.roles[srcArray[i]].side) {
                        var side = randomSample(mafia.theme.roles[srcArray[i]].side.random);
                        mafia.players[mafia.signups[i]].role.side = side;
                    }
                }
            }

currentStalk.push("Players: " + Object.keys(mafia.players).map(name_trrole, mafia.theme).join(", "));

            sys.sendAll("The Roles have been Decided! :", mafiachan);
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
            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (p in mafia.players) {
                player = mafia.players[p];
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(player.role.side));
            }
            sys.sendAll("Time: Night", mafiachan);
            sys.sendAll("Make your moves, you only have 30 seconds! :", mafiachan);
            sys.sendAll(border, mafiachan);

            mafia.ticks = 30;
            mafia.state = "night";
            mafia.resetTargets();
            mafia.reduceRecharges();
        },
        night : function() {
            sys.sendAll(border, mafiachan);
            sys.sendAll("Times Up! :", mafiachan);

this.compilePhaseStalk("NIGHT");

            var nightkill = false;
            var getTeam = function(role, commonTarget) {
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
            for (var i in mafia.theme.nightPriority) {
                var o = mafia.theme.nightPriority[i];
                names = mafia.getPlayersForRole(o.role);
                var command = o.action;
                var Action = mafia.theme.roles[o.role].actions.night[o.action];
                if ("command" in Action) {
                    command = Action.command; // translate to real command
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
                    if (command == "distract") {
                        for (t in targets) {
                            target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            var distractMode = target.role.actions.distract;
                            if (distractMode === undefined) {}
                            else if (target.safeguarded) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                            } else if (distractMode.mode == "ChangeTarget") {
                                mafia.sendPlayer(player.name, "±Game: " + distractMode.hookermsg);
                                mafia.sendPlayer(target.name, "±Game: " + distractMode.msg.replace(/~Distracter~/g, player.role.translation));
                                mafia.kill(player);
                                nightkill = true;
                                mafia.removeTargets(target);
                                stalkTargets[target.name] = {};
                                continue;
                            } else if (distractMode.mode == "ignore") {
                                if (distractMode.msg)
                                    mafia.sendPlayer(target.name, "±Game: " + distractMode.msg.replace(/~Distracter~/g, player.role.translation));
                                continue;
                            } else if (typeof distractMode.mode == "object" && (distractMode.mode.ignore == player.role.role || Array.isArray(distractMode.mode.ignore) && distractMode.mode.ignore.indexOf(player.role.role) > -1)) {
                                if (distractMode.msg)
                                    mafia.sendPlayer(target.name, "±Game: " + distractMode.msg.replace(/~Distracter~/g, player.role.translation));
                                continue;
                            } else if (typeof distractMode.mode == "object" && Array.isArray(distractMode.mode.killif) && distractMode.mode.killif.indexOf(player.role.role) > -1) {
                                if (distractMode.hookermsg)
                                    mafia.sendPlayer(player.name, "±Game: " + distractMode.hookermsg);
                                if (distractMode.msg)
                                    mafia.sendPlayer(target.name, "±Game: " + distractMode.msg.replace(/~Distracter~/g, player.role.translation));
                                mafia.kill(player);
                                nightkill = true;
                                mafia.removeTargets(target);
                                stalkTargets[target.name] = {};
                                continue;
                            }
                            // enables custom distracter message
                            var distractCustomMsg = Action.distractmsg;
                            // "distractmsg" item under "night" { "distract" }
                            if (typeof distractCustomMsg == "string") {
                                 mafia.sendPlayer(target.name, "±Game: " + distractCustomMsg.replace(/~Distracter~/g, player.role.translation));
                            }
                            else {
                                 mafia.sendPlayer(target.name, "±Game: The " + player.role.translation +" came to you last night! You were too busy being distracted!");
                            } mafia.removeTargets(target);
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
                    }
                    else if (command == "protect") {
                        for (t in targets) {
                            target = targets[t];
                            if (mafia.isInGame(target)) {
                                target = mafia.players[target];
                                if (!("protect" in target.role.actions && target.role.actions.protect.mode == "ignore")) {
                                    target.guarded = true;
                                } else if (target.role.actions.protect.silent !== true){
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was not affected by the protect!");
                                }
                            }
                        }
                    }
                    else if (command == "inspect") {
                        for (t in targets) {
                            target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            var inspectMode = target.role.actions.inspect || {};
                            var Sight = Action.Sight;
                            if (target.safeguarded) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                            } else if (inspectMode.revealSide !== undefined || Sight === "Team") {
                                mafia.sendPlayer(player.name, "±Info: " + target.name + " is sided with the " + mafia.theme.trside(target.role.side) + "!!");
                            } else if (inspectMode.revealAs !== undefined) {
                                if (typeof inspectMode.revealAs == "string") {
                                    if (inspectMode.revealAs == "*") {
                                        var rr = 1;
                                        while (mafia.signups.length > mafia.theme["roles"+rr].length) {
                                            ++rr;
                                        }
                                        var rrole = mafia.theme["roles"+rr].slice(0, mafia.signups.length);
                                        mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(rrole[Math.floor(Math.random() * rrole.length)]) + "!!");
                                    } else {
                                        mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(inspectMode.revealAs) + "!!");
                                    }
                                } else if (Array.isArray(inspectMode.revealAs)) {
                                    mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(inspectMode.revealAs[Math.floor(Math.random() * inspectMode.revealAs.length)]) + "!!");
                                }
                            } else if (typeof Sight == "object") {
                                var srole = randomSample(Sight);
                                mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole((srole == "true") ? target.role.role : srole) + "!!");
                            } else {
                                mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + target.role.translation + "!!");
                            }
                        }
                    }
                    else if (command == "poison") {
                        for (t in targets) {
                            target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            if (target.safeguarded) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                            } else if ("poison" in target.role.actions && target.role.actions.poison.mode == "ignore") {
                                  mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was immune to the poison!");
                            } else if ("poison" in target.role.actions && typeof target.role.actions.poison.mode == "object" && target.role.actions.poison.mode.evadeChance > sys.rand(0,100)/100) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded the poison! Somehow.");
                            } else if (target.poisoned === undefined || target.poisonCount - target.poisoned >= (Action.count ? Action.count : 2)) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was poisoned!");
                                target.poisoned = 1;
                                target.poisonCount = Action.count || 2;
                                target.poisonDeadMessage = Action.poisonDeadMessage;
                            }
                        }
                    }
                    else if (command == "safeguard") {
                        for (t in targets) {
                            target = targets[t];
                            if (mafia.isInGame(target)) {
                                target = mafia.players[target];
                                if (!("safeguard" in target.role.actions && target.role.actions.safeguard.mode == "ignore")) {
                                    target.safeguarded = true;
                                } else if (target.role.actions.safeguard.silent !== true) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was not affected by the safeguard!");
                                }
                            }
                        }
                    }
                    else if (command == "kill") {
                        for (t in targets) {
                            target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            var revenge = false;
                            var revengetext = "±Game: You were killed during the night!";
                            if ("kill" in target.role.actions && (target.role.actions.kill.mode == "killattacker" && !target.guarded || target.role.actions.kill.mode == "killattackerevenifprotected")) {
                                revenge = true;
                                if (target.role.actions.kill.msg)
                                    revengetext = target.role.actions.kill.msg;
                            } else if ("kill" in target.role.actions && (target.role.actions.kill.mode == "poisonattacker" && !target.guarded || target.role.actions.kill.mode == "poisonattackerevenifprotected")) {
                                var targetAction = target.role.actions.kill;
                                if (player.poisoned === undefined || player.poisonCount - player.poisoned >= (targetAction.count ? targetAction.count : 2)) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") poisoned you before dying!");
                                    player.poisoned = 1;
                                    player.poisonCount = targetAction.count || 2;
                                    player.poisonDeadMessage = targetAction.poisonDeadMessage;
                                }
                            }
                            if (target.guarded) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was protected!");
                            } else if ("kill" in target.role.actions && target.role.actions.kill.mode == "ignore") {
                                if (!target.role.actions.kill.msg)
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded the kill!");
                                    else mafia.sendPlayer(player.name, target.role.actions.kill.msg.replace(/~Self~/g, target.name));
                            } else if ("kill" in target.role.actions && typeof target.role.actions.kill.mode == "object" && target.role.actions.kill.mode.evadeChance > sys.rand(0,100)/100) {
                                if (!target.role.actions.kill.msg)
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded the kill!");
                                    else mafia.sendPlayer(player.name, target.role.actions.kill.msg.replace(/~Self~/g, target.name));
                            } else if ("kill" in target.role.actions && typeof target.role.actions.kill.mode == "object" && Array.isArray(target.role.actions.kill.mode.ignore) && target.role.actions.kill.mode.ignore.indexOf(player.role.role) != -1) {
                                if (!target.role.actions.kill.msg)
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded the kill!");
                                    else mafia.sendPlayer(player.name, target.role.actions.kill.msg.replace(/~Self~/g, target.name));
                            } else {
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
                            if (revenge) {
                                mafia.sendPlayer(player.name, revengetext);
                                mafia.kill(player);
                                nightkill = true;
                            }
                        }
                    }
                    else if (command == "stalk") {
                        for (t in targets) {
                            target = targets[t];
                            if (mafia.isInGame(target) && target.safeguarded){
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                            } else {
                                var visited = Object.keys(stalkTargets[target]).sort();
                                if (visited.length > 0) {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target + ") visited " + readable(visited, "and") + " this night!");
                                } else {
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target + ") didn't visit anyone this night!");
                                }
                            }
                        }
                    }
                    else if (command == "convert") {
                        for (t in targets) {
                            target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            if (mafia.isInGame(target) && target.safeguarded){
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                            } else if ("convert" in target.role.actions && target.role.actions.convert.mode == "ignore") {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be converted!");
                            } else if ("canConvert" in Action && Action.canConvert != "*" && Action.canConvert.indexOf(target.role.role) == -1) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") couldn't be converted!");
                            } else {
                                var oldRole = target.role;
                                var newRole;
                                if (typeof Action.newRole == "object") {
                                    for (var nr in Action.newRole) {
                                        if (Action.newRole[nr].indexOf(oldRole.role) != -1) {
                                            newRole = nr;
                                            break;
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
                                        if("convertmsg" in Action) {
                                            sys.sendAll("±Game: " + Action.convertmsg.replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation), mafiachan);
                                        } else {
                                            sys.sendAll("±Game: A " + oldRole.translation + " has been converted into a " + target.role.translation + "!", mafiachan);
                                        }
                                    }
                                    mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") has been converted and is now a " + target.role.translation + "!");
                                    mafia.sendPlayer(target.name, "±Game: You have been converted and changed roles!");
                                    mafia.showOwnRole(sys.id(target.name));
                                }
                            }
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
            }
            this.reduceRecharges();

            if (!nightkill) {
                sys.sendAll("No one died! :", mafiachan);
            }

            if (mafia.testWin()) {
                return;
            }

            mafia.ticks = 30;
            if (mafia.players.length >= 15) {
                mafia.ticks = 40;
            } else if (mafia.players.length <= 4) {
                mafia.ticks = 15;
            }

            sys.sendAll(border, mafiachan);

            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (p in mafia.players) {
                player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Day", mafiachan);
            sys.sendAll("You have " + mafia.ticks + " seconds to debate who are the bad guys! :", mafiachan);
            for (var role in mafia.theme.standbyRoles) {
                names = mafia.getPlayersForRole(mafia.theme.standbyRoles[role]);
                for (j = 0; j < names.length; ++j) {
                    for (var k in mafia.players[names[j]].role.actions.standby) {
                        mafia.sendPlayer(names[j], mafia.players[names[j]].role.actions.standby[k].msg);
                    }
                }
            }
            sys.sendAll(border, mafiachan);

            mafia.state = "standby";
        },
        standby : function() {
            mafia.ticks = 30;

this.compilePhaseStalk("STANDBY");

            sys.sendAll(border, mafiachan);

            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Day", mafiachan);
            sys.sendAll("It's time to vote someone off, type /Vote [name], you only have " + mafia.ticks + " seconds! :", mafiachan);
            sys.sendAll(border, mafiachan);

            mafia.state = "day";
            mafia.votes = {};
            mafia.voteCount = 0;
        },
        day : function() {
            sys.sendAll(border, mafiachan);
            sys.sendAll("Times Up! :", mafiachan);

            var voted = {}, player;
            for (var pname in mafia.votes) {
                player = mafia.players[pname];
                var target = mafia.votes[pname];
                // target play have been killed meanwhile by slay
                if (!mafia.isInGame(target)) continue;
                if (!(target in voted)) {
                    voted[target] = 0;
                }
                if (player.role.actions.vote !== undefined) {
                    voted[target] += player.role.actions.vote;
                } else {
                    voted[target] += 1;
                }
            }
            var tie = true;
            var maxi = 0;
            var downed = noPlayer;
            for (var x in voted) {
                player = mafia.players[x];
                if (player.role.actions.voteshield !== undefined)
                    voted[x] += player.role.actions.voteshield;
                if (voted[x] == maxi) {
                    tie = true;
                } else if (voted[x] > maxi) {
                    tie = false;
                    maxi = voted[x];
                    downed = x;
                }
            }

            if (tie) {
                sys.sendAll("No one was voted off! :", mafiachan);
                sys.sendAll(border, mafiachan);
            } else {
                var roleName = typeof mafia.players[downed].role.actions.lynch == "object" && typeof mafia.players[downed].role.actions.lynch.revealAs == "string" ? mafia.theme.trrole(mafia.players[downed].role.actions.lynch.revealAs) : mafia.players[downed].role.translation;
                sys.sendAll("±Game: " + downed + " (" + roleName + ") was removed from the game!", mafiachan);
                mafia.removePlayer(mafia.players[downed]);

                if (mafia.testWin())
                    return;
            }

            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Night", mafiachan);
            sys.sendAll("Make your moves, you only have 30 seconds! :", mafiachan);
            sys.sendAll(border, mafiachan);

            mafia.ticks = 30;
            mafia.state = "night";
            mafia.resetTargets();
        },
        voting: function() {
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
            var winner = {votes: -1, theme: null};
            for (theme in res) {
                 if (res[theme] > winner.votes) {
                     winner.votes = res[theme];
                     winner.theme = theme;
                 }
            }
            if (winner.theme !== null) {
                sys.sendAll("", mafiachan);
                sys.sendAll("±Game: Theme " + winner.theme + " won with " + winner.votes + " votes!", mafiachan);
                sys.sendAll("±Game: Type /Join to enter the game!", mafiachan);
                sys.sendAll("", mafiachan);
                this.startGame(null, winner.theme);
                this.signups = players[winner.theme];
                this.ips = ips[winner.theme];
                mafia.ticks = 40;
                sys.sendAll("±Game: " + this.signups.join(", ") + " joined the game!", mafiachan);
            } else {
                sys.sendAll("Really? No votes, so no game.", mafiachan);
            }
        }
    };
    this.callHandler = function(state) {
        try {
            if (state in this.handlers)
                this.handlers[state].call(this);
        } catch(e) {
            sys.sendAll("Error occurred in mafia while handling the end of '" + state + "' phase: " + e, mafiachan);
        }
    };
    this.showCommands = function(src) {
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
    this.showHelp = function(src) {
        var help = [
            "*** *********************************************************************** ***",
            "±Game: The objective in this game on how to win depends on the role you are given.",
            "*** *********************************************************************** ***",
            "±Role: Mafia",
            "±Win: Eliminate the WereWolf and the Good People!",
            "*** *********************************************************************** ***",
            "±Role: WereWolf",
            "±Win: Eliminate everyone else in the game!",
            "*** *********************************************************************** ***",
            "±Role: Good people (Inspector, Bodyguard, Pretty Lady, Villager, Mayor, Spy, Vigilante, Samurai)",
            "±Win: Eliminate the WereWolf, Mafia (French and Italian if exists) and the Godfather!",
            "*** *********************************************************************** ***",
            "±Role: French Canadian Mafia, Don French Canadian Mafia",
            "±Win: Eliminate the Italian Mafia, Godfather and the Good People!",
            "*** *********************************************************************** ***",
            "±Role: Italian Mafia, Don Italian Mafia",
            "±Win: Eliminate the French Canadian Mafia, Godfather and the Good People!",
            "*** *********************************************************************** ***",
            "±More: Type /roles for more info on the characters in the game!",
            "±More: Type /rules to see some rules you should follow during a game!",
            "*** *********************************************************************** ***",
            ""
        ];
        dump(src, help);
    };
    this.showRoles = function(src, commandData) {
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
    this.showSides = function(src, commandData) {
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
    this.showRules = function(src) {
        var rules = [
            "",
            " Server Rules: ",
            "±Rule: No spamming / flooding ",
            "±Rule: No insulting - especially not auth. ",
            "±Rule: No trolling.",
            "±Tip: Type /rules on another channel to see the full rules.",
            "",
            " Game Rules: ",
            "±Rule: Do not quote any of the Bots, removing the \"bot\" part is still botquoting.",
            "±Rule: Do not quit the game before you are dead.",
            "±Rule: Ask to be slain by a mafia admin if you must leave, but do not join the next game if you do so.",
            "±Rule: Do not vote yourself / get yourself killed on purpose",
            "±Rule: Do not reveal any information about the game once you're dead or voted off. ",
            "±Rule: Do not repeatedly target a user, as it ruins the fun for that user",
            "±Rule: Do not group together to ruin the game",
            "±Rule: Do not reveal roles in order to harm your team's chances of winning.",
            "",
            "±Game: Disobey them and you will be banned from mafia/muted according to the MA/auth's wishes!",
            ""
        ];
        dump(src, rules);
    };
    this.showThemes = function(src) {
        var l = [];
        for (var t in mafia.themeManager.themes) {
            l.push(mafia.themeManager.themes[t].name);
        }
        msg(src, "Installed themes are: " + l.join(", "));
    };
    this.showThemeInfo = function(src, data) {
        data = data.toLowerCase();
        mafia.themeManager.themeInfo.sort(function(a,b) {return a[0].localeCompare(b[0]);});
        var mess = [];
        mess.push("<table><tr><th>Theme</th><th>URL</th><th>Author</th><th>Enabled</th></tr>");
        for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
            var info = mafia.themeManager.themeInfo[i];
            var theme = mafia.themeManager.themes[info[0].toLowerCase()];
            if (!theme) continue;
            if (data == noPlayer || data.indexOf(theme.name.toLowerCase()) != -1) {
                mess.push('<tr><td>' + theme.name + '</td><td><a href="' + info[1] + '">' + info[1] + '</a></td><td>' + (theme.author ? readable(theme.author, "and") : "unknown") + '</td><td>' + (theme.enabled ? "yes" : "no")+ '</td></tr>');
            }
        }
        mess.push("</table>");
        sys.sendHtmlMessage(src, mess.join(""), mafiachan);
    };
    this.showThemeDetails = function(src, commandData) {
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
        for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i){
            if (mafia.themeManager.themeInfo[i][0].toLowerCase() == themeName){
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
        if (link == "No link found"){
            mess.push('<b>Code: </b>' + link);
        } else {
            mess.push('<b>Code: </b><a href="' + link + '">' + link + '</a>');
        }
        mess.push("");
        for (var x in mess){
            sys.sendHtmlMessage(src, mess[x], mafiachan);
        }
    };

    this.showPlayedGames = function(src) {
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
    
    this.showOwnRole = function(src) {
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
    this.flashPlayer = function(src, commandData) {
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
            if (repeatedThemes.length > 0 ) {
                msg(src, "You already have alerts for the themes: " + readable(repeatedThemes, "and") + ". ");
            }
            if (themesNotAdded.length > 0 ) {
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
    this.showPriority = function(src, commandData) {
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
    this.isMafiaAdmin = function(src) {
        if (sys.auth(src) >= 1)
            return true;
        if (mafiaAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase())) {
            return true;
        }
        return false;
    };
    this.isMafiaSuperAdmin = function(src) {
        if (sys.auth(src) >= 2)
            return true;
        if (['serpentine', 'steeledges'].indexOf(sys.name(src).toLowerCase()) >= 0) {
            return true;
        }
        return false;
    };
    this.pushUser = function(src, name) {
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
        sys.sendAll("±Game: " + name + " joined the game! (pushed by " + sys.name(src) + ")", mafiachan);
    };
    this.slayUser = function(src, name) {
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
                sys.sendAll("±Kill: " + player.name + " (" + player.role.translation + ") was slayed by " + slayer + "!", mafiachan);
                this.removePlayer(player);
                return;
            }
        }
        msg(src, "No such target.");
    };
this.readStalkLog = function(src, data) {
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
if (outputChan == undefined) {
sys.sendMessage(src, "±Info: This is not a valid channel!", mafiachan);
return;
}
if (num < 1 || num > stalkLogs.length) {
sys.sendMessage(src, "±Info: There's no log with this id!", mafiachan);
return;
}

sys.sendMessage(src, "", outputChan);
var stalkLog = stalkLogs[num -1].split("::**::");
for (var c=0; c < stalkLog.length; ++c) {
sys.sendMessage(src, stalkLog[c], outputChan);
}
sys.sendMessage(src, "", outputChan);
if (outputChan != mafiachan) {
sys.sendMessage(src, "±Info: Game log was printed in channel " + sys.channel(outputChan), mafiachan);
}
};
    this.addTheme = function(src, url) {
        if (!mafia.isMafiaAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.loadWebTheme(url, true, false);
    };
    this.updateTheme = function(src, data) {
        var url = data, name = data;
        if (data.indexOf("::") >= 0) {
            var parts = url.split("::");
            name = parts[0];
            url = parts[1];
        }
        var theme = mafia.themeManager.themes[name.toLowerCase()];
        // theme.author can be either string or Array of strings
        var authorMatch = theme !== undefined && (typeof theme.author == "string" && theme.author.toLowerCase() == sys.name(src).toLowerCase() || Array.isArray(theme.author) && theme.author.map(function(s) { return s.toLowerCase(); }).indexOf(sys.name(src).toLowerCase()) >= 0);

        if (!mafia.isMafiaAdmin(src) && !authorMatch) {
            msg(src, "You need to be admin or the author of this theme.");
            return;
        }
        var dlurl;
        if (url.substr(0,7) != "http://") {
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
    this.removeTheme = function(src, name) {
        if (!mafia.isMafiaSuperAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.remove(src, name);
    };
    this.disableTheme = function(src, name) {
        if (!mafia.isMafiaAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.disable(src, name);
    };
    this.enableTheme = function(src, name) {
        if (!mafia.isMafiaAdmin(src)) {
            msg(src, "admin+ command.");
            return;
        }
        mafia.themeManager.enable(src, name);
    };
    this.updateAfter = function(src) {
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
            updateModule(source, function(module) {
                POglobal.plugins[i] = module;
                module.source = source;
                module.init();
                sys.sendAll("Update complete!", mafiachan);
            });
            sys.sendAll("Updating mafia game...", mafiachan);
            mafia.needsUpdating = false;
        }
        return;
    }

    this.importOld = function(src, name) {
        msgAll("Importing old themes", mafiachan);
        mafia.themeManager.loadTheme(defaultTheme);
        mafia.themeManager.saveToFile(defaultTheme);
    };

    this.commands = {
        user: {
            commands : [this.showCommands, "To see the various commands."],
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
readlog: [this.readStalkLog, "To read the log of actions from a previous game"],
            add: [this.addTheme, "To add a Mafia Theme!"],
            remove: [this.removeTheme, "To remove a Mafia Theme!"],
            disable: [this.disableTheme, "To disable a Mafia Theme!"],
            enable: [this.enableTheme, "To enable a disabled Mafia Theme!"],
            updateafter: [this.updateAfter, "To update mafia after current game!"],
            importold: [this.importOld, ""]
        }
    };
    this.handleCommand = function(src, message, channel) {
        // only on mafia channel
        if (channel != mafiachan)
            return;
        try {
            mafia.handleCommandOld(src, message, channel);
            return true;
        } catch(e) {
            if (e != "no valid command") {
                sys.sendAll("Error on mafia command: " + e, mafiachan);
                return true;
            }
        }
    };
    this.canJoin = function(src) {
        if (this.isInGame(sys.name(src))) {
            sys.sendMessage(src, "±Game: You already joined!", mafiachan);
            return;
        }
        if (this.ips.indexOf(sys.ip(src))!=-1) {
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
        var name = sys.name(src);
        for (var x in name) {
            var code = name.charCodeAt(x);
            if (name[x] != ' ' && name[x] != '.' && (code < 'a'.charCodeAt(0) || code > 'z'.charCodeAt(0))
                && (code < 'A'.charCodeAt(0) || code > 'Z'.charCodeAt(0)) && name[x] != '-' && name[x] != '_' && name[x] !='<' && name[x] != '>' && (code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0)))
            {
                sys.sendMessage(src, "±Name: You're not allowed to have the following character in your name: " + name[x] + ".", mafiachan);
                sys.sendMessage(src, "±Rule: You must change it if you want to join!", mafiachan);
                return;
            }
        }
        if (name.length > Config.Mafia.max_name_length) {
            sys.sendMessage(src, "±Name: You're not allowed to have more than "+Config.Mafia.max_name_length+" letters in your name!", mafiachan);
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
this.addPhaseStalkAction = function(user, action, target) {
if (!(user in phaseStalk)) phaseStalk[user] = [];
phaseStalk[user].push("/" + action + " " + target);
};
this.compilePhaseStalk = function(phase) {
currentStalk.push("*** " + phase + " ***");
for (var u in phaseStalk) {
currentStalk.push(u + " used: " + phaseStalk[u].join(", "));
}
phaseStalk = {};
};
    this.handleCommandOld = function(src, message, channel) {

        var command;
        var commandData = '*';
        var pos = message.indexOf(' ');

        if (pos != -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (command in this.commands.user) {
            this.commands.user[command][0].call(this, src, commandData);
            return true;
        }
        var name, x, player, target;
        if (this.state == "entry") {
            if (command == "join") {
                if (this.canJoin(src) !== true) {
                    return;
                }
                if (this.signups.length >= this.theme["roles"+this.theme.roleLists].length) {
                    sys.sendMessage(src, "±Game: There can't be more than " + this.theme["roles"+this.theme.roleLists].length + " players!", mafiachan);
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
                sys.sendAll("±Game: " + name + " joined the game!", mafiachan);
                if (this.signups.length == this.theme["roles"+this.theme.roleLists].length) {
                    this.ticks = 1;
                }
                return;
            }
            if (command == "unjoin") {
                if (this.isInGame(sys.name(src))) {
                    name = sys.name(src);
                    delete this.ips[this.ips.indexOf(sys.ip(src))];
                    this.signups.splice(this.signups.indexOf(name), 1);
                    sys.sendAll("±Game: " + name + " unjoined the game!", mafiachan);
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
                if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                    return;
                }
                if (sys.name(src) in this.votes) {
                    sys.sendMessage(src, "±Rule: You already voted!", mafiachan);
                    return;
                }
                sys.sendAll("±Game:" + sys.name(src) + " voted for " + commandData + "!", mafiachan);
                this.votes[sys.name(src)] = commandData;
                this.voteCount+=1;

                if (this.voteCount == Object.keys(mafia.players).length) {
                    mafia.ticks = 1;
                } else if (mafia.ticks < 8) {
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
                        } else if (typeof target.role.actions.daykill.mode == "object" && target.role.actions.daykill.mode.evadeChance > sys.rand(0,100)/100) {
                            sys.sendMessage(src, "±Game: Your kill was evaded!", mafiachan);
                            sys.sendMessage(sys.id(target.name), "±Game: You evaded a kill!", mafiachan);
                            player.dayKill = player.dayKill+1 || 1;
                            return;
                        }
                    }
                    sys.sendAll(border, mafiachan);
                    if (!revenge) {
                        sys.sendAll("±Game: " + commandObject.killmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), mafiachan);
                        if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0,100)/100) {
                            if (commandObject.revealmsg !== undefined && typeof commandObject.revealmsg == "string") {
                                sys.sendAll("±Game: " + commandObject.revealmsg.replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
                            } else {
                                sys.sendAll("±Game: While attacking, " + name + " (" + mafia.players[name].role.translation + ") made a mistake and was revealed!", mafiachan);
                            }
                        }
                        if ("daykill" in target.role.actions && target.role.actions.daykill === "revealkiller") {
                            if ("daykillrevengemsg" in target.role.actions) {
                                sys.sendAll("±Game: " + target.role.actions.daykillrevengemsg.replace(/~Self~/g, target.name).replace(/~Target~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
                            } else {
                                sys.sendAll("±Game: Before dying, " + target.name + " revealed that " + name + " is the " + mafia.players[name].role.translation + "!", mafiachan);
                            }
                        }
                        player.dayKill = player.dayKill+1 || 1;
                        this.kill(mafia.players[commandData]);
                    } else {
                        if (target.role.actions.daykillrevengemsg !== undefined && typeof target.role.actions.daykillrevengemsg == "string") {
                            sys.sendAll("±Game: " + target.role.actions.daykillrevengemsg.replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);
                        } else {
                            sys.sendAll("±Game: ~Target~ tries to attack ~Self~, but ~Self~ fights back and kills ~Target~!".replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);

                        }
                        this.kill(mafia.players[name]);
                        if (target.role.actions.daykill === "bomb")
                            this.kill(mafia.players[commandData]);
                    }

                    if (this.testWin()) {
                        return;
                    }
                    sys.sendAll(border, mafiachan);
                } else if (command == "reveal") {
                    if (player.revealUse >= (commandObject.limit || 1)) {
                        sys.sendMessage(src, "±Game: You already used this command!", mafiachan);
                        return;
                    }
                    var revealMessage = commandObject.revealmsg ? commandObject.revealmsg : "~Self~ is revealed to be a ~Role~!";
                    sys.sendAll(border, mafiachan);
                    sys.sendAll("±Game: " + revealMessage.replace(/~Self~/g, name).replace(/~Role~/g, player.role.translation), mafiachan);
                    sys.sendAll(border, mafiachan);
                    player.revealUse = player.revealUse+1||1;
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
while (mafia.signups.length > mafia.theme["roles"+rr].length) {
++rr;
}
var rrole = mafia.theme["roles"+rr].slice(0, mafia.signups.length);
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
sys.sendAll(border, mafiachan);
sys.sendAll("±Game: " + exposeMessage.replace(/~Self~/g, name).replace(/~Target~/g, target.name).replace(/~Role~/g, revealedRole), mafiachan);
if ("revealChance" in commandObject && commandObject.revealChance > sys.rand(0,100)/100) {
if (commandObject.revealmsg !== undefined && typeof commandObject.revealmsg == "string") {
sys.sendAll("±Game: " + commandObject.revealmsg.replace(/~Self~/g, name).replace(/~Role~/g, mafia.players[name].role.translation), mafiachan);
} else {
sys.sendAll("±Game: While exposing, " + name + " (" + mafia.players[name].role.translation + ") made a mistake and was revealed!", mafiachan);
}
}
sys.sendAll(border, mafiachan);
player.exposeUse = player.exposeUse+1||1;
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
                "*** MAFIA ADMINS ***",
                ""];
            for (x in mafiaAdmins.hash) {
                out.push(x + (sys.id(x) !== undefined ? ":" : ""));
            }
            out.push("");
            dump(src, out);
            return;
        }

        if (!this.isMafiaAdmin(src))
            throw ("no valid command");

        if (command in this.commands.auth) {
            this.commands.auth[command][0].call(this, src, commandData);
            return;
        }
        var tar = sys.id(commandData);
        if (command == "mafiaban") {
            script.issueBan("mban", src, tar, commandData, sys.auth(src) > 0 ? undefined : 86400);
            return;
        }
        if(command == "mafiaunban"){
            script.modCommand(src, command, commandData, tar)
            return;
        }
        if (command == "mafiabans") {
            try {
                if (script.modCommand(src, command, commandData, tar) == "no command") {
                    msg(src, "Sorry, you are not authorized to use this command.");
                }
            } catch (e) {
                msg(src, "[DEBUG] Exception occurred: " + e);
            }
            return;
        }
        if (!this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        var id;
        if (command == "mafiaadmin") {
            mafiaAdmins.add(commandData.toLowerCase(), "");
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).mafiaAdmin = true;
            sys.sendMessage(src, "±Game: That person is now a mafia admin!", mafiachan);
            return;
        }
        if (command == "mafiaadminoff") {
            mafiaAdmins.remove(commandData);
            mafiaAdmins.remove(commandData.toLowerCase());
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).mafiaAdmin = false;
            sys.sendMessage(src, "±Game: That person is no more a mafia admin!", mafiachan);
            return;
        }

        throw ("no valid command");
    };

    this.beforeChatMessage = function(src, message, channel) {
        if (channel !== 0 && channel == mafiachan && mafia.ticks > 0 && ["blank", "voting", "entry"].indexOf(mafia.state) == -1 && !mafia.isInGame(sys.name(src)) && sys.auth(src) <= 0 && !mafia.isMafiaAdmin(src)) {
            if (!(is_command(message) && message.substr(1,2).toLowerCase() != "me")) {
                sys.sendMessage(src, Config.Mafia.notPlayingMsg, mafiachan);
                return true;
            }
        }
    };

    // we can always slay them :3
    this.onMute = function(src) {
        if (this.state != "day")
            this.slayUser(Config.capsbot, sys.name(src));
    };

    this.onMban = function(src) {
        this.slayUser(Config.Mafia.bot, sys.name(src));
        sys.kick(src, mafiachan);
    };

    this.onKick = function(src) {
        this.slayUser(Config.floodbot, sys.name(src));
    };

    this.stepEvent = function() {
        try {
            this.tickDown();
        } catch(err) {
            msgAll("error occurred: " + err);
        }
    };

    this.init = function() {
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