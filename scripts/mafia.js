/*
* mafia.js
*
* Contains code for server side mafia game.
* Original code by unknown.
*/

// Global variables inherited from scripts.js
/*global mafiabot, getTimeString, updateModule, script, sys, SESSION, sendChanAll, require, Config, module, sachannel, staffchannel, sendChanHtmlAll, isSuperAdmin*/
/*jshint laxbreak:true,shadow:true,undef:true,evil:true,trailing:true,proto:true,withstmt:true,eqnull:true*/
var MAFIA_CHANNEL = "Mafia";

var is_command = require("utilities.js").is_command;
var nonFlashing = require("utilities.js").non_flashing;
var html_escape = require("utilities.js").html_escape;

function Mafia(mafiachan) {
    this.version = "2012-12-15";
    var mafia = this;
    var defaultThemeName = "default"; //stored as lowercase

    this.mafiaStats = require("mafiastats.js");
    this.mafiaChecker = require("mafiachecker.js");
    sys.makeDir(Config.dataDir + "mafiathemes/");
    if (!this.nextEventTime) {this.nextEventTime = new Date().getTime() + 1 * 60 * 60 * 1000;}
    if (!this.eventQueue) {this.eventQueue = [defaultThemeName];}
    if (!this.eventThemePool) {this.eventThemePool = [defaultThemeName];}
    if (!this.warningLog) {this.warningLog = {};}
    this.isEvent = false;
    this.warningLog = {};
    this.eventsEnabled = true;
    this.defaultWarningPoints = {
        "afk": 1,
        "slay abuse": 2,
        "teamvote": 3,
        "botquote": 3,
        "deadtalk": 6,
        "trolling": 6
    };

    var DEFAULT_BORDER = "***************************************************************************************",
        GREEN_BORDER = " " + DEFAULT_BORDER + ":",
        border,
        globalDefaultSideColors = ["#0099ff", "#cc00ff", "red", "#33cc33", "#ff00ff", "#660066", "#ff9933", "#0099cc", "#cc9900", "#cc0066", "#006666", "#666699", "#990033", "#663300", "#6666ff"],
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
        numPlayersBeforeDead = 10, //number of players before game is counted as not dead
        timeForWarningErase = (1000 * 60 * 60 * 24 * 7), // 1 week
        defaultGameBot = {
            name: "Game",
            color: "#3DAA68"
        };

    var savePlayedGames = function (entry) {
        sys.writeToFile(MAFIA_SAVE_FILE, JSON.stringify(PreviousGames));
        if (entry) {
            sys.saveVal("Stats/MafiaGamesPlayed", 1 + (+sys.getVal("Stats/MafiaGamesPlayed")));
        }
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
    function htmlLink(mess, append) {
        if (append) {
            return "<a href=\"po:appendmsg/" + mess + (mess[0] === "/" && mess.indexOf(" ") === -1 ? " " : "") + "\">" + html_escape(mess) + "</a>";
        }
        return "<a href=\"po:setmsg/" + mess + (mess[0] === "/" && mess.indexOf(" ") === -1 ? " " : "") +  "\">" + html_escape(mess) + "</a>";
    }
    function htmlVoteTheme(mess) {
        return("<a href=\"po:send//votetheme " + mess + "\">" + mess + "</a>");
    }
    /*Sends a Game bot message, if no bot name is defined, it adds "±Game"
    * Note: use "srcname" instead of "src" as src holds the player's ID*/
    function gamemsg(src, mess, botName, channel, html) {
        if (mess === undefined || mess === "") {
            return false;
        }
        var id = sys.id(src);
        if (id === undefined) {
            return false;
        }
        if (mess === null) {
            mess = "";
        }
        if (channel === undefined) {
            channel = mafiachan;
        }
        if ((!botName && mess.indexOf("±") === -1 && mess.indexOf(":") !== (parseInt(mess.length, 10) - 1) && mess.substring(0, Config.Mafia.max_name_length + 2).indexOf(": ") !== -1) || mess.indexOf("***") === 0) {
            sys.sendMessage(id, mess, channel);
        } else {
            var colon = mess.indexOf(":");
            if (!botName && !html && colon !== -1) {
                botName = mess.substring(0, colon);
                mess = mess.slice(colon + 2);
            }
            sys.sendHtmlMessage(id, "<font color='" + mafia.bot.color + "'><timestamp/> <b>" + (botName ? botName : "±" + mafia.bot.name) + ":</b></font> " + (html ? mess : html_escape(mess)), channel);
        }
        return true;
    }
    function gamemsgAll(mess, botName, channel, html) {
        if (mess === undefined || mess === "") {
            return false;
        }
        if (mess === null) {
            mess = "";
        }
        if (channel === undefined) {
            channel = mafiachan;
        }
        if ((!botName && mess.indexOf("±") === -1 && mess.indexOf(":") !== (parseInt(mess.length, 10) - 1) && mess.substring(0, Config.Mafia.max_name_length + 2).indexOf(": ") !== -1) || mess.indexOf("***") === 0) {
            sys.sendAll(mess, channel);
        } else {
            var colon = mess.indexOf(":");
            if (!botName && !html && colon !== -1) {
                botName = mess.substring(0, colon);
                mess = mess.slice(colon + 2);
            }
            sys.sendHtmlAll("<font color='" + mafia.bot.color + "'><timestamp/> <b>" + (botName ? botName : "±" + mafia.bot.name) + ":</b></font> " + (html ? mess : html_escape(mess)), channel);
        }
        return true;
    }
    /* Replaces keywords in messages */
    function formatArgs(mess, args) {
        if (mess === undefined || mess.length === 0) {
            return mess;
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
    /* stolen from here: http://stackoverflow.com/questions/1026069/capitalize-first-letter-of-string-in-javascript */
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    /*Determines if "a" or "an" is required*/
    function an(string) {
        var vowels = "aeioux";
        if (vowels.indexOf(string.charAt(0).toLowerCase()) > -1) {
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
    function getFirstLast(arr, first, last, random) {
        var firstList = arr.slice(0, first),
            lastList = last > 0 ? arr.slice(-last) : [];

        var picked = removeDuplicates(firstList.concat(lastList));
        if (random > 0) {
            var p, i, list = arr.concat();
            for (p = list.length -1; p >= 0; p--) {
                if (picked.indexOf(list[p]) !== -1) {
                    list.splice(p, 1);
                }
            }
            for (p = random; p > 0 && list.length > 0; p--) {
                i = sys.rand(0, list.length);
                picked.push(list[i]);
                list.splice(i, 1);
            }
        }

        return picked;
    }
    function delimSplit(delim, string) {
        var div = [], p1, p2;
        var pos = string.indexOf(delim);
        if (pos != -1) {
            p1 = string.substring(0, pos);
            p2 = string.substr(pos + 1);
        } else {
            p1 = string;
            p2 = '*';
        }
        div.push(p1); div.push(p2);
        return div;
    }
    function sendBorder(channel) {
        if (channel === undefined) {
            channel = mafiachan;
        }
        sys.sendHtmlAll(border, channel);
    }
    function runUpdate() {
        if (!mafia.needsUpdating) {return;}
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

    var defaultTheme = { name: defaultThemeName,
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
            theme.sideColor = {};

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
                theme.addSide(plain_theme.sides[i], i);
            }
            for (i in plain_theme.roles) {
                theme.addRole(plain_theme.roles[i]);
            }
            theme.nightPriority.sort(function (a, b) { return a.priority - b.priority; });
            theme.roles1 = plain_theme.roles1;
            i = 2;
            while ("roles" + i in plain_theme) {
                theme["roles" + i] = plain_theme["roles" + i];
                ++i;
            }
            theme.roleLists = i - 1;
            if (theme.roleLists === 0)
                throw "This theme has no roles1, it can not be played.";
            theme.spawnPacks = plain_theme.spawnPacks;
            theme.villageCantLoseRoles = plain_theme.villageCantLoseRoles;
            theme.minplayers = plain_theme.minplayers;
            theme.nolynch = plain_theme.nolynch;
            theme.ticks = plain_theme.ticks;
            theme.votesniping = plain_theme.votesniping;
            theme.silentVote = plain_theme.silentVote;
            theme.votemsg = plain_theme.votemsg;
            theme.checkNoVoters = plain_theme.checkNoVoters;
            theme.quickOnDeadRoles = plain_theme.quickOnDeadRoles;
            theme.name = plain_theme.name;
            theme.altname = plain_theme.altname;
            theme.author = plain_theme.author;
            theme.nonPeak = plain_theme.nonPeak;
            theme.closedSetup = plain_theme.closedSetup;
            theme.silentNight = plain_theme.silentNight;
            theme.threadlink = plain_theme.threadlink;
            theme.bot = plain_theme.bot;
            if (typeof theme.bot !== "object") {
                theme.bot = defaultGameBot;
            }
            if (theme.bot.name === undefined) {
                theme.bot.name = defaultGameBot.name;
            }
            if (theme.bot.color === undefined) {
                theme.bot.color = defaultGameBot.color;
            }
            theme.summary = plain_theme.summary;
            theme.changelog = plain_theme.changelog;
            theme.tips = plain_theme.tips;
            theme.killmsg = plain_theme.killmsg;
            theme.killusermsg = plain_theme.killusermsg;
            theme.drawmsg = plain_theme.drawmsg;
            theme.lynchmsg = plain_theme.lynchmsg;
            theme.tiedvotemsg = plain_theme.tiedvotemsg;
            theme.novotemsg = plain_theme.novotemsg;
            theme.delayedConversionMsg = plain_theme.delayedConversionMsg || false;
            theme.noplur = plain_theme.noplur;
            theme.rolesAreNames = plain_theme.rolesAreNames;
            theme.macro = plain_theme.macro === undefined ? true : plain_theme.macro;
            theme.generateRoleInfo();
            theme.generateSideInfo();
            theme.generatePriorityInfo();
            theme.generateSpawnInfo();
            if (theme.enabled === undefined) {
                theme.enabled = true;
            }
            if (plain_theme.borderColor) {
                theme.borderColor = plain_theme.borderColor;
            } else if (plain_theme.border && plain_theme.border.slice(-1) === ":") {
                theme.borderColor = "#3DAA68";
            } else {
                theme.borderColor = "magenta";
            }
            theme.border = "<span style='color:" + theme.borderColor + "'><timestamp/> " + (plain_theme.border ? html_escape(plain_theme.border) : DEFAULT_BORDER) + "</span>";
            return theme;
        } catch (err) {
            msgAll("Couldn't use theme " + plain_theme.name + ": " + err + ".");
        }
    };
    ThemeManager.prototype.loadThemes = function () {
        if (typeof sys !== "object") return;
        this.themes = {};
        this.themes[defaultThemeName] = this.loadTheme(defaultTheme);
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
                    msg(src, "Won't update " + theme.name + " with /add, use /update to force an update");
                    return;
                }
                if (manager.themes.hasOwnProperty(lower) && update && updatename && updatename != lower) {
                    msg(src, "Won't update '" + updatename + "' to '" + theme.name + "', use the old name.");
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
    Theme.prototype.addSide = function (obj, num) {
        this.sideTranslations[obj.side] = obj.translation;
        if ("winmsg" in obj) {
            this.sideWinMsg[obj.side] = obj.winmsg;
        }
        if ("color" in obj && typeof obj.color === "string") {
            this.sideColor[obj.side] = obj.color;
        } else {
            this.sideColor[obj.side] = globalDefaultSideColors[num % globalDefaultSideColors.length];
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
        function sideName(r, obj) {
            var out = "";
            if (typeof r.side == "string") {
                out += "Sided with " + obj.trside(r.side) + ". ";
            } else if (typeof r.side == "object") {
                var plop = Object.keys(r.side.random);
                var tran = [];
                for (var p = 0; p < plop.length; ++p) {
                    tran.push(obj.trside(plop[p]));
                }
                out += "Sided with " + readable(tran, "or") + ". ";
            }
            if (r.hasOwnProperty("winningSides")) {
                if (r.winningSides == "*") {
                    out += "Wins the game in any case. ";
                } else if (Array.isArray(r.winningSides)) {
                    out += "Wins the game with " + readable(r.winningSides.map(trside, obj), "or");
                }
            }
            return out;
        }
        function spawnAt(role, list, index, theme) {
            var slot = list[index];
            if (typeof slot == "object" && role in slot) {
                return true;
            }
            if (typeof slot == "string") {
                if (slot.indexOf("pack:") === 0) {
                    var count = 0;
                    for (var s = 0; s <= index; s++) {
                        if (list[index] == slot) {
                            count++;
                        }
                    }
                    var pack = theme.spawnPacks[slot.substr(5)],
                        list;
                    for (s in pack.roles) {
                        list = pack.roles[s];
                        if (list[count % list.length] == role) {
                            return true;
                        }
                    }
                } else if (slot == role) {
                    return true;
                }
            }
            return false;
        }
        for (var r = 0; r < role_order.length; ++r) {
            try {
                role = this.roles[role_order[r]];
                  // Don't add this role to /roles
                if ((role.hide && role.hide !== "side") || role.hide == "both") {
                    continue;
                }
                if ("infoName" in role) {
                    roles.push("±Role: " + role.infoName);
                } else {
                    roles.push("±Role: " + role.translation);
                }

                // check which abilities the role has
                var abilities = "", a, ability;
                if ("info" in role) {
                    abilities += role.info.replace(/~Sided~/g, sideName(role, this));
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
                            abilities += "Vote counts randomly as " + readable(role.actions.vote, "or") + ". ";
                        }
                    }
                    if ("voteshield" in role.actions) {
                        if (typeof role.actions.voteshield === "number") {
                            abilities += "Receives " + role.actions.voteshield + " extra votes if voted for at all. ";
                        } else if (Array.isArray(role.actions.voteshield)) {
                            abilities += "Receives " + readable(role.actions.voteshield, "or") + " extra votes randomly if voted for at all. ";
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
                    abilities += sideName(role, this);
                }
                roles.push("±Ability: " + abilities);

                // check on which player counts the role appears
                var playerCount = '';
                var roleplayers = role.players;

                if (roleplayers !== false) { //you can set "players: false" as an option to hide when it spawns on /roles (but you can just use /spawn ??)
                    var parts = [];
                    var end = 0;
                    if (typeof roleplayers === "string") { // players: "Convert" -> Convert
                        playerCount = roleplayers;
                    } else if (typeof roleplayers === "number") { // players: 30 -> 30 Players
                        playerCount = roleplayers + " Players";
                    } else if (Array.isArray(roleplayers)) { // players: [20, 30] -> 20-30 Players
                        playerCount = roleplayers.join("-") + " Players";
                    } else {
                        for (var i = 1; i <= this.roleLists; ++i) {
                            role_i = "roles" + i;
                            var start = -1, v;
                            for (var e = 0; e < this[role_i].length; e++) {
                                v = this[role_i][e];
                                if (spawnAt(role.role, this[role_i], e, this)) {
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
            var tra = "infoName" in this_roles[a] ? this_roles[a].infoName : this_roles[a].translation;
            var trb = "infoName" in this_roles[b] ? this_roles[b].infoName : this_roles[b].translation;
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
                    side_list[role.side].push("infoName" in role ? role.infoName : role.translation);
                } else if (typeof role.side == "object" && role.side.random) {
                    var plop = Object.keys(role.side.random);
                    var tran = [];
                    for (var p = 0; p < plop.length; ++p) {
                        tran.push(this.trside(plop[p]));
                    }
                    randomSide_list.push("±Role: " + ("infoName" in role ? role.infoName : role.translation) + " can be sided with " + readable(tran, "or") + ". ");
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
                    sides.push("±Side: The " + this.trside(side) + (side == "village" ? " (Village)" : "") + " consists of: " + removeDuplicates(side_list[side]).join(", ") + ".");
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
                priority.push("[" + prio.priority + "] " + ("infoName" in this.roles[prio.role] ? this.roles[prio.role].infoName : this.roles[prio.role].translation) + " (" + cap(prio.action) + ")");
            }
        }
        priority = removeDuplicates(priority);
        this.priorityInfo = priority;
    };
    Theme.prototype.generateSpawnInfo = function () {
        var spawn = [],
            obj = this;
        var i = 1, list, r, id, packs, packName, pInfo, out, e, chance, name, limit,
            last = ("minplayers" in obj) ? obj.minplayers : 5;

        var side, inner;

        var randomSampleText = function(randomObj) {
            var total = 0, count = 0, list = [], s;
            for (s in randomObj) {
                total += randomObj[s];
                count++;
            }
            for (s in randomObj) {
                if (randomObj[s] > 0) {
                    list.push(obj.roles[s].translation + " [" + (total === 0 ? count/100 : (randomObj[s] / total * 100).toFixed(2)) + "%]");
                }
            }
            return readable(list, "or");
        };

        while ("roles" + i in obj) {
            inner = [];
            list = obj["roles" + i];
            limit = last;
            last = list.length + 1;
            packs = {};
            for (r = 0; r < list.length; ++r) {
                id = list[r];
                if (typeof id == "object") {
                    inner.push(randomSampleText(id));
                } else {
                    if (id.indexOf("pack:") === 0) {
                        packName = id.substr(5);

                        pInfo = obj.spawnPacks[packName];
                        if (!(packName in packs)) {
                            packs[packName] = 0;
                        }

                        out = [];

                        if (!("chance" in pInfo)) {
                            pInfo.chance = [];
                            for (e in pInfo.roles) {
                                pInfo.chance.push(1);
                            }
                        }
                        chance = 0;
                        for (e in pInfo.chance) {
                            chance += pInfo.chance[e];
                        }
                        for (e in pInfo.roles) {
                            name = pInfo.roles[e][packs[packName] % pInfo.roles[e].length];
                            out.push((parseInt(e, 10) + 1) + ". " + this.roles[name].translation + " [" + (chance === 0 ? pInfo.chance.length/100 : (pInfo.chance[e] / chance * 100).toFixed(2)) + "%]");
                            side = this.roles[name].side;
                        }
                        packs[packName] += 1;

                        inner.push("Pack " + packName + ": " + out.join(" | "));
                    } else {
                        inner.push(this.roles[id].translation);
                    }
                }
            }
            spawn.push(inner);
            ++i;
        }
        this.spawnInfo = spawn;
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
    this.getCommands = function (name, state) {
        var player = this.players[name], cmds = [];
        if (state in player.role.actions) {
            var data = player.role.actions[state];
            for (var c in data) {
                if (data[c].hasOwnProperty("macro")) {
                    if (data[c].macro) {
                        if (sys.os(player) === "android") {
                            cmds.push("/" + c);
                        }
                        else {
                            cmds.push(htmlLink("/" + c));
                        }
                    }
                    continue;
                }
                if (mafia.theme.macro) {
                    if (sys.os(player) === "android") {
                        cmds.push("/" + c);
                    }
                    else {
                        cmds.push(htmlLink("/" + c));
                    }
                }
            }
        }
        return cmds.length > 0 ? "Your commands are: " + readable(cmds, "and") + "." : null;
    };
    this.correctCase = function (string) {
        var lstring = string.toLowerCase();
        for (var x in this.players) {
            if (x.toLowerCase() == lstring)
                return this.players[x].name;
        }
        for (var x in this.dead) {
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
    this.unloadAWOL = function () {
        if (Object.keys(mafia.AWOLusers).length !== 0) {
            msgAll("The following users left the Mafia game and did not return: " + Object.keys(mafia.AWOLusers).join(", "), sachannel);
        }
    };
    this.clearVariables = function () {
        /* hash : playername => playerstruct */
        this.saveStalkLog();
        this.players = {};
        this.signups = [];
        this.dead = [];
        this.nodead = [];
        this.state = "blank";
        this.ticks = 0;
        this.votes = {};
        this.votedBy = {};
        this.votedByArchive = {};
        this.voteCount = 0;
        this.lynchees = [];
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
        this.AWOLusers = {};
        this.time = {
            "nights": 0,
            "days": 0
        };
        this.bot = defaultGameBot;
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
        this.teamTargetsData = {};
        this.roleTargetsData = {};
        this.dayRecharges = {};
        this.teamRestrictions = {};
        this.roleRestrictions = {};
        this.needsConvertMsg = [];
        this.teamVoters = {};
        for (var p in this.players) {
            this.players[p].targets = {};
            this.players[p].targetsData = {};
            this.players[p].dayKill = undefined;
            this.players[p].revealUse = undefined;
            this.players[p].exposeUse = undefined;
            this.players[p].guarded = undefined;
            this.players[p].safeguarded = undefined;
            this.players[p].restrictions = [];
            this.players[p].redirectTo = undefined;
            this.players[p].redirectActions = undefined;
            this.players[p].guardActions = [];
            this.players[p].shieldmsg = undefined;
            this.players[p].protectmsg = undefined;
            this.players[p].safeguardmsg = undefined;
            this.players[p].guardmsg= undefined;
            this.players[p].haxCount = {};
        }
    };
    this.clearVariables();
    this.usersToShove = {};
    this.advertiseToChannel = function(channel, event) {
        sendChanAll("", channel);
        sendBorder(channel);
        mafiabot.sendHtmlAll("A" + (event ? "n <b>Event</b>" : " new") + (this.theme.name != defaultThemeName ? (event ? " <b><font color='blue'>" : " ") + (this.theme.altname ? this.theme.altname : this.theme.name) + (event ? "</font></b>" : "") + "</font>-themed" : "") + " mafia game was started at <a href='po:join/" + sys.channel(mafiachan) + "'>#" + sys.channel(mafiachan) + "</a>!", channel);
        sendBorder(channel);
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
    this.eventTimeBoost = function () {
        if (mafia.isEvent) this.ticks = Math.floor(this.ticks * 1.5);
    };
    this.getRandom = function (arr) {
        if (!Array.isArray(arr)) return arr;
        var indx = Math.floor(arr.length * Math.random());
        return arr[indx];
    };
    this.tryEventTheme = function () { //checked at end of a game and during blank every 2 hours.
        if (!(this.eventsEnabled)) return;
        if (this.nextEventTime > new Date().getTime()) {
            return;
        }
        this.startEvent();
    };
    this.enableEvent = function (src, enable) {
        var srcname = sys.name(src);
        if (this.eventsEnabled === enable) {
            gamemsg(srcname, "Event themes are already " + (this.eventsEnabled ? "en" : "dis") + "abled!");
            return;
        }
        this.eventsEnabled = enable;
        gamemsg(srcname, "Event themes " + (this.eventsEnabled ? "en" : "dis") + "abled!");
        return;
    };
    this.startEvent = function (forced) { //can be force started by sMA
        if ((this.state !== "blank") || (mafia.needsUpdating)) {
            return;
        }
        if (forced) {
            this.nextEventTime = new Date().getTime() + 2 * 60 * 60 * 1000;
        }
        else {
            while (this.nextEventTime < new Date().getTime()) {
                this.nextEventTime += 2 * 60 * 60 * 1000;
            }
        }
        if (!(this.eventQueue)) {
            this.eventQueue = [defaultThemeName];
        }
        var etheme = this.eventQueue[0];
        this.startGame("Event", etheme);
        this.eventQueue.splice(0,1);
        if (this.eventQueue.length < 3) {
            this.eventQueue.push(this.getRandom(this.eventThemePool));
        }
        mafia.isEvent = true;
    };
    this.addEventTheme = function (src,theme,place) {
        var srcname = sys.name(src);
        var theme = this.getThemeName(theme);
        if (!(theme)) {
            gamemsg(srcname, "That isn't a theme...");
            return;
        }
        if (place === "first") {
            this.eventQueue.reverse();
            this.eventQueue.push(theme);
            this.eventQueue.reverse();
        }
        else {
            this.eventQueue.push(theme);
        }
        gamemsg(srcname, "Theme " + theme + " added to the Event Queue.");
        this.showEventQueue(src);
    };
    this.removeEventTheme = function (src,theme,place) {
        var srcname = sys.name(src);
        var theme = this.getThemeName(theme);
        var indx = this.eventQueue.indexOf(theme);
        if (indx === -1) {
            gamemsg(srcname, "That theme isn't in the queue!");
            return;
        }
        if (place === "last") {
            this.eventQueue.reverse();
            indx = this.eventQueue.indexOf(theme);
            this.eventQueue.splice(indx,1);
            this.eventQueue.reverse();
        }
        else {
            this.eventQueue.splice(indx,1);
        }
        gamemsg(srcname, "Theme " + theme + " removed from the Event Queue.");
        this.showEventQueue(src);
    };
    this.shuffleEventQueue = function(src) {
        var srcname = sys.name(src);
        this.eventQueue.shuffle();
        gamemsg(srcname, "Event Queue shuffled!");
        this.showEventQueue(src);
    };
    this.showEventQueue = function(src) {
        var srcname = sys.name(src);
        gamemsg(srcname, "Event Queue is " + readable(this.eventQueue,"and") + ".");
    };
    this.addToEventPool = function(src,theme) {
        var srcname = sys.name(src);
        var theme = this.getThemeName(theme);
        if (!(theme)) {
            gamemsg(srcname, "That isn't a theme...");
            return;
        }
        this.eventThemePool.push(theme);
        gamemsg(srcname, "Theme " + theme + " added to Event Pool.");
        this.showEventPool(src);
    };
    this.removeFromEventPool = function (src,theme) {
        var srcname = sys.name(src);
        var theme = this.getThemeName(theme);
        var indx = this.eventThemePool.indexOf(theme);
        if (indx === -1) {
             gamemsg(srcname, "That theme isn't in the queue!");
             return;
        }
        this.eventThemePool.splice(indx,1);
        gamemsg(srcname, "Theme " + theme + " removed from Event Pool.");
        this.showEventPool(src);
    };
    this.showEventPool = function(src) {
        var srcname = sys.name(src);
        gamemsg(srcname, "Themes in Event Pool are " + readable(this.eventThemePool,"and") + ".");
    };
    this.userVote = function (src, commandData) {
        var srcname = sys.name(src);
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            gamemsg(srcname, "You can't start a voting when the channel is silenced.");
            return;
        }
        if (this.invalidName(src))
            return;

        var now = (new Date()).getTime();

        var themeName = commandData.toLowerCase();
        var reason;
        if (this.state == "blank") {
            if (SESSION.users(src).mafia_start !== undefined && SESSION.users(src).mafia_start + 5000 > now && !this.isMafiaSuperAdmin(src)) {
                gamemsg(srcname, "Wait a moment before trying to start again!");
                return;
            }
            SESSION.users(src).mafia_start = now;
            this.state = "voting";
            this.ticks = 20;
            this.votes = {};
            this.possibleThemes = {};
            var total = 5;

            this.possibleThemes[defaultThemeName] = 0;

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
                if (name != defaultThemeName && Check.indexOf(name) !== -1) {
                    continue;
                }
                // exclude disabled themes
                if (this.themeManager.themes[name].enabled && !(name in this.possibleThemes)) {
                    this.possibleThemes[name] = 0;
                    --total;
                }
            }
            border = "<span style='color:magenta'><timestamp/>" + DEFAULT_BORDER + "</span>";
            sendChanAll("", mafiachan);
            sendBorder();
            mafiabot.sendHtmlAll(sys.name(src) + " started a voting for next game's theme! You have " + this.ticks + " seconds to vote with /vote or /votetheme!", mafiachan);
            var casedThemes = [];
            for (var x in this.possibleThemes) {
                casedThemes.push(htmlVoteTheme(this.themeManager.themes[x].name));
            }
            mafiabot.sendHtmlAll("Choose from these themes: " + casedThemes.join(", ") + " !", mafiachan);
            sendBorder();
            sendChanAll("", mafiachan);
        }
        if (this.state != "voting") {
            if (SESSION.users(src).mafia_start !== undefined && SESSION.users(src).mafia_start + 5000 > now && !this.isMafiaSuperAdmin(src)) {
                gamemsg(srcname, "Wait a moment before trying to start again!");
                return;
            }
            SESSION.users(src).mafia_start = now;
            gamemsg(srcname, "You can only vote during the voting phase!");
            return;
        }
        if (!this.canJoin(src)) {
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
            } else if (this.votes[ip].theme != themeName) {
                gamemsgAll(sys.name(src) + " changed their vote to " + this.themeManager.themes[themeName].name + "!");
                this.numvotes[sys.ip(src)] += 1;
            } else {
                gamemsg(srcname, "You already voted for this theme!");
                return;
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
            if ((themes[x].altname && themes[x].altname.toLowerCase() === data) || (themes[x].name.toLowerCase() === data)) {
                data = themes[x].name.toLowerCase();
                return data;
            }
        }
        return false;
    };
    this.getCurrentTheme = function(data) {
        var themeName = defaultThemeName;
        if (mafia.state != "blank" && mafia.state != "voting") {
            themeName = mafia.theme.name.toLowerCase();
        }
        if (data != noPlayer && data !== "") {
            themeName = this.getThemeName(data.toLowerCase());
            if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                return null;
            }
        }

        return themeName;
    };
    this.startGame = function (src, commandData) {
        var srcname = (src === "Event" ? "Event": sys.name(src));
        if (SESSION.channels(mafiachan).muteall && !SESSION.channels(mafiachan).isChannelOperator(src) && sys.auth(src) === 0) {
            gamemsg(srcname, "You can't start a game when the channel is silenced.");
            return;
        }
        var now = (new Date()).getTime();
        if (src !== null && src !== "Event") {
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

        var themeName = commandData == noPlayer ? defaultThemeName : this.getThemeName(commandData);

        // Prevent a single player from dominating the theme selections.
        // We exclude mafia admins from this.
        var i;
        if (src && src !== "Event") {
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
                this.bot = this.theme.bot;
            } else {
                gamemsg(srcname, "No such theme!");
                return;
            }
        } else {
            if (themeName in this.themeManager.themes) {
                this.theme = this.themeManager.themes[themeName];
                this.bot = this.theme.bot;
            } else {
                this.theme = this.themeManager.themes[defaultThemeName];
                this.bot = this.theme.bot;
            }
        }

        border = this.theme.border ? this.theme.border : DEFAULT_BORDER;
        CurrentGame = { who: src !== null ? srcname : "voted", what: themeName, when: parseInt(sys.time(), 10), playerCount: 0 };

        if ((src !== null) && (src !== "Event")) {
            sendChanAll("", mafiachan);
            sendBorder();
            if (this.theme.name == defaultThemeName) {
                gamemsgAll(sys.name(src) + " started a game!");
            } else {
                gamemsgAll(sys.name(src) + " started a game with theme " + this.theme.name + (this.theme.altname ? " (" + this.theme.altname + ")" : "") + "!");
            }
            gamemsgAll("Type <a href=\"po:send//join\">/Join</a> to enter the game!", undefined, undefined, true);
            sendBorder();
            sendChanAll("", mafiachan);
        }
        if (src == "Event") {
            sendBorder();
            if (this.theme.name == defaultThemeName) {
                mafiabot.sendHtmlAll("An <b>Event</b> Mafia game is starting!", mafiachan);
            } else {
                mafiabot.sendHtmlAll("An Event <b>" + html_escape(this.theme.name + (this.theme.altname ? " (" + this.theme.altname + ")" : "")) + "</b>-themed Mafia game is starting!", mafiachan);
            }
            gamemsgAll("Type <a href=\"po:send//join\">/Join</a> to enter the game!", undefined, undefined, true);
            sendBorder();
            sendChanAll("", mafiachan);
        }

        var playerson = sys.playerIds();
        for (var x = 0; x < playerson.length; ++x) {
            var id = playerson[x];
            var user = SESSION.users(id);
            if (sys.loggedIn(id) && user && user.mafiaalertson && (user.mafiaalertsany || user.mafiathemes.indexOf(this.theme.name.toLowerCase()) != -1)) {
                if (sys.isInChannel(id, mafiachan)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == defaultThemeName ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", mafiachan);
                    continue;
                } else if (sys.isInChannel(id, 0)) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == defaultThemeName ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", 0);
                    continue;
                } else if (sys.existChannel("Mafia Social") && sys.isInChannel(id, sys.channelId("Mafia Social"))) {
                    sys.sendHtmlMessage(id, "A " + (this.theme.name == defaultThemeName ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!", sys.channelId("Mafia Social"));
                    continue;
                }
                sys.sendHtmlMessage(id, "A " + (this.theme.name == defaultThemeName ? "" : html_escape(this.theme.name) + "-themed ") + "mafia game is starting, " + sys.name(id) + "<ping/>!");
            }
        }
        var summary = this.theme.summary ? html_escape(this.theme.summary) : "";
        gamemsgAll(summary.replace(/(https?:\/\/[^\s]+)/gi, "<a href='$1'>$1</a>"), "±" + mafia.bot.name, undefined, true);
        if (sys.playersOfChannel(mafiachan).length < 150) {
            var time = parseInt(sys.time(), 10);
            if (time > this.lastAdvertise + 60 * 15 || src === "Event") {
                this.lastAdvertise = time;
                this.advertiseToChannel(0, src === "Event");
                if (sys.existChannel("Mafia Tutoring")) {
                    this.advertiseToChannel(sys.channelId('Mafia Tutoring'), src === "Event");
                }
                if (sys.existChannel("Mafia Social")) {
                    this.advertiseToChannel(sys.channelId('Mafia Social'), src === "Event");
                }
            }
        }
        this.clearVariables();
        this.bot = this.theme.bot;
        mafia.state = "entry";
        mafia.ticks = src === "Event" ? 150 : 60;

        if (src !== null && src !== "Event") {
            if (!this.canJoin(src)) {
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
            if (SESSION.users(src).smute.active && sys.auth(src) < 1) {
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
        sendBorder();
        mafiabot.sendAll((src ? sys.name(src) : Config.Mafia.bot) + " has stopped the game!", mafiachan);
        sendBorder();
        sendChanAll("", mafiachan);
        if (sys.id('PolkaBot') !== undefined) {
            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
        }
        //mafiabot.sendAll("GAME ENDED", mafiachan);
        mafia.saveCurrentGame("None");
        mafia.mafiaStats.result("dead");
        mafia.checkDead(CurrentGame.playerCount);
        mafia.unloadAWOL();
        mafia.clearVariables();
        mafia.usersToShove = [];
        runUpdate();
        this.advertiseFeaturedTheme();
        mafia.isEvent = false;
        mafia.tryEventTheme();
    };
    this.tickDown = function () { /* called every second */
        if (this.state == "blank") {
            this.tryEventTheme();
            return;
        }
        if (this.ticks <= 0) {
            return;
        }
        this.ticks = this.ticks - 1;
        if (this.ticks === 0) {
            this.callHandler(this.state);
        } else {
            if ((this.ticks == 30 || this.ticks == 90) && this.state == "entry") {
                sendChanAll("", mafiachan);
                gamemsgAll("Hurry up, you only have " + this.ticks + " seconds more to join!");
                sendChanAll("", mafiachan);
            }
        }
    };
    this.playerCount = function () {
        return Object.keys(mafia.players).length;
    };
    this.saveCurrentGame = function(winner) {
        CurrentGame.winner = winner;
        CurrentGame.duration = mafia.time.nights > mafia.time.days ? "Night " + mafia.time.nights : "Day " + mafia.time.days;
        savePlayedGames();
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
        return Object.keys(this.players).map(function(name) {
                return this.players[name].role;
            }, mafia).sort(function(a, b) { /* Sorting to not give out the order of the roles per player */
                var tra = typeof a.actions.onlist === "string" ? mafia.theme.trrole(a.actions.onlist) : a.translation;
                var trb = typeof b.actions.onlist === "string" ? mafia.theme.trrole(b.actions.onlist) : b.translation;
                if (tra == trb)
                    return 0;
                else if (tra < trb)
                    return -1;
                else
                    return 1;
            }).map(function(role) {
                if (typeof role.actions.onlist === "string") {
                    var onlistRole = role.actions.onlist,
                        roleName = html_escape(this.theme.trrole(onlistRole)),
                        color = this.theme.sideColor[mafia.theme.roles[onlistRole].side];
                    return "<a href=\"po:send//roles " + mafia.theme.name + ":" + roleName + "\" style=\"color:" + color + "\">" + roleName + "</a>";
                } else {
                    var roleName = html_escape(role.translation),
                        color = this.theme.sideColor[role.side];
                    return "<a href=\"po:send//roles " + mafia.theme.name + ":" + roleName + "\" style=\"color:" + color + "\">" + roleName + "</a>";
                }
            }, mafia).join(", ");
    };
    this.sendCurrentPlayers = function () {
        var channelUsers = sys.playersOfChannel(mafiachan),
            players = Object.keys(this.players).sort(),
            list = players.map(function(player) {
                return htmlLink(player, true);
            });
        for (var i = 0; i < channelUsers.length; i++) {
            var name = sys.name(channelUsers[i]);
            if (this.isInGame(name) && (sys.os(channelUsers[i]) !== "android")) {
                var n = players.indexOf(name);
                list[n] = "<a href=\"po:appendmsg/" + name + "\" style=\"color:" + script.getColor(channelUsers[i]) + "\">" + html_escape(name) + "</a><ping/>";
                gamemsg(name, list.join(", ") + ".", "±Current Players", undefined, true);
                list[n] = htmlLink(name, true); // Remove color
            } else {
                gamemsg(name, players.join(", ") + ".", "±Current Players");
            }
        }
    };
    this.getPlayersForBroadcast = function () {
        var team = [];
        for (var p in this.players) {
            team.push(this.players[p].name);
        }
        return team;
    };

    this.gameInProgress = function () {
        return ["blank", "voting", "entry"].indexOf(mafia.state) == -1;
    };

    this.authorMatch = function (src, name) {
        var theme = mafia.themeManager.themes[name.toLowerCase()];
        return (mafia.isMafiaAdmin(src) || theme !== undefined && (typeof theme.author == "string" && theme.author.toLowerCase() == sys.name(src).toLowerCase() || Array.isArray(theme.author) && theme.author.map(function (s) { return s.toLowerCase(); }).indexOf(sys.name(src).toLowerCase()) >= 0));
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
        this.dead.push(player.name.toLowerCase());
        if (mafia.votes.hasOwnProperty(player.name))
            delete mafia.votes[player.name];
        delete this.players[player.name];
    };
    this.actionBeforeDeath = function (player, onLynch, showborder) {
        if (player.role.actions.hasOwnProperty("onDeath") || onLynch) {
            var onDeath = player.role.actions.onDeath,
                verb = "died";
            if (onLynch) {
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
                            actionMessage = (onDeath.killmsg || "±Kill: Because ~Self~ " + verb + ", ~Target~ (~Role~) died too!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Role~/g, mafia.theme.trrole(targetRoles[r]));
                            if (actionMessage.indexOf(":") === -1) {
                                actionMessage = "±Kill: " + actionMessage;
                            }
                            gamemsgAll(actionMessage);
                        }
                        needSeparator = true;
                    }
                }
                if (singleAffected.length > 0) {
                    gamemsgAll(onDeath.singlekillmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")), "±Kill");
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
            if ("detoxRoles" in onDeath) {
                targetRoles = onDeath.detoxRoles;
                singleAffected = [];
                for (var i = 0; i < targetRoles.length; ++i) {
                    targetPlayers = this.getPlayersForRole(targetRoles[i]);
                    affected = [];
                    for (k = 0; k < targetPlayers.length; ++k) {
                        target = this.players[targetPlayers[k]];
                        if (target.poisoned !== undefined) {
                            target.poisoned = undefined;
                            affected.push(targetPlayers[k]);
                        }
                    }
                    if (affected.length > 0) {
                        if ("detoxmsg" in onDeath) {
                            actionMessage = (onDeath.detoxmsg || "Because ~Self~ "+verb+", ~Target~ was detoxed!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and"));
                            gamemsgAll(actionMessage);
                        }
                    }
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
                                if (mafia.state == "night" && mafia.theme.delayedConversionMsg) {
                                    mafia.needsConvertMsg.push(targetPlayers[k]);
                                } else {
                                    mafia.showOwnRole(sys.id(targetPlayers[k]));
                                }
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
                sendBorder();
            }
        }
    };
    this.compulsoryActions = function() {
        var p, player, role, a, e, action, users, list, target, command, limit, picked, charges,
            selfUsers = {}, roleUsers = {}, teamUsers = {};
        for (p in this.players) {
            player = this.players[p];
            role = player.role;
            if ("actions" in role && "night" in role.actions) {
                for (a in role.actions.night) {
                    action = role.actions.night[a];
                    if (action.compulsory) {
                        if (action.common == "Self") {
                            if (!(player.name in selfUsers)) {
                                selfUsers[player.name] = [];
                            }
                            selfUsers[player.name].push(a);
                        } else if (action.common == "Role") {
                            if (!(role.role in roleUsers)) {
                                roleUsers[role.role] = [];
                            }
                            roleUsers[role.role].push(a);
                        } else if (action.common == "Team") {
                            if (!(role.side in teamUsers)) {
                                teamUsers[role.side] = [];
                            }
                            teamUsers[role.side].push(a);
                        }
                    }
                }
            }
        }

        //Compulsory actions for unshared actions
        for (p in selfUsers) {
            player = this.players[p];
            role = player.role;
            for (a in selfUsers[p]) {
                command = selfUsers[p][a];
                action = role.actions.night[command];
                list = this.findPossibleTargets(player, action.target);
                if (list.length > 0) {
                    limit = action.limit || 1;
                    charges = mafia.getCharges(player, "night", command);
                    if (charges !== undefined && limit > charges) {
                        limit = charges;
                    }
                    for (e = 0; e < limit; e++) {
                        picked = sys.rand(0, list.length);
                        target = list[picked];
                        list.splice(picked, 1);
                        this.inputNightCommand(player.name, command, target);
                        if (list.length === 0) {
                            break;
                        }
                    }
                }
            }
        }
        //Compulsory actions for actions shared with role
        for (p in roleUsers) {
            users = this.getPlayersForRole(p);
            player = this.players[users[0]];
            roleUsers[p] = removeDuplicates(roleUsers[p]);
            role = player.role;
            for (a in roleUsers[p]) {
                command = roleUsers[p][a];
                action = role.actions.night[command];
                list = this.findPossibleTargets(player, action.target);
                if (list.length > 0) {
                    limit = action.limit || 1;
                    charges = mafia.getCharges(player, "night", command);
                    if (charges !== undefined && limit > charges) {
                        limit = charges;
                    }
                    for (e = 0; e < limit; e++) {
                        picked = sys.rand(0, list.length);
                        target = list[picked];
                        list.splice(picked, 1);
                        this.inputNightCommand(player.name, command, target);
                        if (list.length === 0) {
                            break;
                        }
                    }
                }
            }
        }
        //Compulsory actions for actions shared with team
        for (p in teamUsers) {
            users = this.getPlayersForTeam(p);
            teamUsers[p] = removeDuplicates(teamUsers[p]);
            for (a in teamUsers[p]) {
                command = teamUsers[p][a];
                player = null;
                for (var k in users) {
                    if (this.hasCommand(users[k], command, "night")) {
                        player = this.players[users[k]];
                        break;
                    }
                }
                if (player == null) {
                    continue;
                }
                role = player.role;
                action = role.actions.night[command];
                list = this.findPossibleTargets(player, action.target);
                if (list.length > 0) {
                    limit = action.limit || 1;
                    charges = mafia.getCharges(player, "night", command);
                    if (charges !== undefined && limit > charges) {
                        limit = charges;
                    }
                    for (e = 0; e < limit; e++) {
                        picked = sys.rand(0, list.length);
                        target = list[picked];
                        list.splice(picked, 1);
                        this.inputNightCommand(player.name, command, target);
                        if (list.length === 0) {
                            break;
                        }
                    }
                }
            }
        }
    };
    this.findPossibleTargets = function(player, target) {
        var out;
        if (target == "AnyButSelf") {
            out = Object.keys(this.players);
            out.splice(out.indexOf(player.name), 1);
        }
        else if (target == "AnyButRole") {
            out = Object.keys(this.players);
            for (var i = out.length-1; i >= 0; i--) {
                if (this.players[out[i]].role.role == player.role.role) {
                    out.splice(i, 1);
                }
            }
        }
        else if (target == "AnyButTeam") {
            out = Object.keys(this.players);
            for (var i = out.length -1; i >= 0; i--) {
                if (this.players[out[i]].role.side == player.role.side) {
                    out.splice(i, 1);
                }
            }
        }
        else if (target == "OnlySelf") {
            out = [player.name];
        }
        else if (target == "OnlyTeam") {
            out = this.getPlayersForTeam(player.role.side);
        }
        else if (target == "OnlyTeammates") {
            out = this.getPlayersForTeam(player.role.side);
            out.splice(out.indexOf(player.name), 1);
        }
        else {
            out = Object.keys(this.players);
        }

        return out;
    };
    this.onDeadRoles = function() {
        var convertPlayers = {},
            player,
            needConvert,
            p,
            r,
            e,
            action,
            convertmsg,
            list;

        for (p in this.players) {
            player = this.players[p];
            if ("onDeadRoles" in player.role.actions) {
                action = player.role.actions.onDeadRoles;
                for (r in action.convertTo) {
                    needConvert = true;
                    for (e in action.convertTo[r]) {
                        list = this.getPlayersForRole(action.convertTo[r][e]);
                        if (list.length > 0 && !(list.length == 1 && list[0] == player.name)) {
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
            convertmsg = ("convertmsg" in player.role.actions.onDeadRoles ? player.role.actions.onDeadRoles.convertmsg : "Due to the latest deaths, ~Old~ became ~New~!").replace(/~Self~/gi, player.name).replace(/~Old~/gi, mafia.theme.trrole(player.role.role)).replace(/~New~/gi, mafia.theme.trrole(convertPlayers[p]));
            var silent = player.role.actions.onDeadRoles.silentConvert;
            this.setPlayerRole(player, convertPlayers[p]);
            gamemsgAll(convertmsg);
            if (!silent) {
                if (mafia.state == "night" && mafia.theme.delayedConversionMsg) {
                    mafia.needsConvertMsg.push(player.name);
                } else {
                    this.showOwnRole(sys.id(p));
                }
            }
        }
    };
    this.revealAsRole = function (appearAs, role, inspector) {
        if (typeof appearAs == "string") {
            if (appearAs.charAt(0) == "*") {
                var rrole = Object.keys(mafia.players).map(function(x) { return mafia.players[x].role.role; }, mafia);
                var exdata, exrole, excludeRoles = appearAs.substring(1, appearAs.length);
                while (excludeRoles.indexOf(":") !== -1) {
                    exdata = delimSplit(":", excludeRoles);
                    exrole = exdata[0];
                    while (rrole.indexOf(exrole) !== -1) {
                        rrole.splice(rrole.indexOf(exrole), 1);
                    }
                    if (exrole == "~Inspector~") {
                        while (rrole.indexOf(inspector) !== -1) {
                            rrole.splice(rrole.indexOf(inspector), 1);
                        }
                    }
                    excludeRoles = exdata[1];
                }
                if (rrole.length > 0) {
                    return rrole[sys.rand(0, rrole.length)] ;
                }
                return role;
            } else if (appearAs === "~Inspector~") {
                return inspector;
            } else {
                return appearAs;
            }
        } else if (Array.isArray(appearAs)) {
            return appearAs[sys.rand(0, appearAs.length)];
        }
        return role;
    };
    this.kill = function (player, msg) {
        var killmsg = (msg || this.theme.killmsg || "~Player~ (~Role~) died!").replace(/~Player~/g, player.name).replace(/~Role~/g, player.role.translation);
        var bn = killmsg.indexOf("±") === -1 ? "±Kill" : undefined;
        gamemsgAll(killmsg, bn);
        this.actionBeforeDeath(player);
        this.removePlayer(player);
    };
    this.removeTargets = function (player, checkIgnore, onlyUser) {
        var removed = false;
        for (var action in player.role.actions.night) {
            if (this.removeTarget(player, action, checkIgnore, onlyUser)) {
                removed = true;
            }
        }
        return removed;
    };
    this.removeTarget = function (player, action, checkIgnore, onlyUser) {
        var targetMode = player.role.actions.night[action].common;
        var keepTargets = [];
        var blocked, tarData, userInputAction;
        if (checkIgnore && player.role.actions.night[action].ignoreDistract) {
            return false;
        }
        if (targetMode == 'Self') {
            player.targetsData[action] = [];
            return true;
        } else if (targetMode == 'Team') {
            if (!(player.role.side in this.teamTargetsData)) {
                this.teamTargetsData[player.role.side] = {};
            }
            if (onlyUser) {
            for (var tar in this.teamTargetsData[player.role.side][action]) {
                tarData = delimSplit("/", this.teamTargetsData[player.role.side][action][tar] );
                userInputAction = tarData[1];
                if (userInputAction !== player.name) {
                    keepTargets[tar] = this.teamTargetsData[player.role.side][action][tar];
                    continue;
                    }
                blocked = true;
                }
            }
            this.teamTargetsData[player.role.side][action] = keepTargets;
            return (blocked);
        } else if (targetMode == 'Role') {
            if (!(player.role.role in this.roleTargetsData)) {
                this.roleTargetsData[player.role.role] = {};
            }
            if (onlyUser) {
            for (var tar in this.roleTargetsData[player.role.role][action]) {
                tarData = delimSplit("/", this.roleTargetsData[player.role.role][action][tar] );
                userInputAction = tarData[1];
                if (userInputAction !== player.name) {
                    keepTargets[tar] = this.roleTargetsData[player.role.role][action][tar];
                    continue;
                    }
                blocked = true;
                }
            }
            this.roleTargetsData[player.role.role][action] = keepTargets;
            return (blocked);
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
            if (!(action in player.targetsData)) {
                player.targetsData[action] = [];
            }
            return player.targetsData[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargetsData)) {
                this.teamTargetsData[player.role.side] = {};
            }
            if (!(action in this.teamTargetsData[player.role.side])) {
                this.teamTargetsData[player.role.side][action] = [];
            }
            return this.teamTargetsData[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargetsData)) {
                this.roleTargetsData[player.role.role] = {};
            }
            if (!(action in this.roleTargetsData[player.role.role])) {
                this.roleTargetsData[player.role.role][action] = [];
            }
            return this.roleTargetsData[player.role.role][action];
        }
    };
    this.setTarget = function (player, target, action, extra, redirect) {
        if (extra === undefined) {
            extra = "*";
        }
        if (redirect === undefined) {
            redirect = "*";
        }
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
        var targetsDataList;
        if (commonTarget == 'Self') {
            if (!(action in player.targets)) {
                player.targets[action] = [];
                player.targetsData[action] = [];
            }
            list = player.targets[action];
            targetsDataList = player.targetsData[action];
            if ("restrict" in player.role.actions.night[action]) {
                player.restrictions = player.restrictions.concat(player.role.actions.night[action].restrict);
            }
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
                this.teamTargetsData[player.role.side] = {};
            }
            if (!(action in this.teamTargets[player.role.side])) {
                this.teamTargets[player.role.side][action] = [];
                this.teamTargetsData[player.role.side][action] = [];
            }
            list = this.teamTargets[player.role.side][action];
            targetsDataList = this.teamTargetsData[player.role.side][action];
            if ("restrict" in player.role.actions.night[action]) {
                if (!(player.role.side in this.teamRestrictions)) {
                    this.teamRestrictions[player.role.side] = [];
                }
                this.teamRestrictions[player.role.side] = this.teamRestrictions[player.role.side].concat(player.role.actions.night[action].restrict);
            }
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
                this.roleTargetsData[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action] = [];
                this.roleTargetsData[player.role.role][action] = [];
            }
            list = this.roleTargets[player.role.role][action];
            targetsDataList = this.roleTargetsData[player.role.role][action];
        }
        if ("cancel" in player.role.actions.night[action]) {
            var cancelList = player.role.actions.night[action].cancel;
            for (var c in cancelList) {
                if (this.hasCommand(player.name, cancelList[c], "night")) {
                    this.removeTarget(player, cancelList[c]);
                }
            }
        }
        var targetsData = target.name.concat(":",extra); //This data is saved for pinpoint
        targetsData = targetsData.concat("@",redirect); //This is for redirect
        targetsData = targetsData.concat("/",player.name); //keeps track of who input the action (for userOnly on distract)
        if (targetsDataList.indexOf(targetsData) === -1) {
            if (list.indexOf(target.name) !== -1) {
                targetsDataList.splice(list.indexOf(target.name),1);
                list.splice(list.indexOf(target.name),1);
            }
            list.push(target.name);
            targetsDataList.push(targetsData);
            if (list.length > limit) {
                list.splice(0, 1);
                targetsDataList.splice(0, 1);
            }
        }
        if (this.ticks > 0 && limit > 1) {
            gamemsg(player.name, "Your target(s) are " + list.join(', ') + "!");
        }
    };
    this.changeTargets = function (target, redirectTarget, redirectActions) {
        var newTar = {}, newTar2 = {}, newTar3 = {}, act, newData;
        for (var action in target.targetsData) {
            if ((redirectActions !== "*") && (redirectActions.indexOf(action) === -1)) {
                newTar[action] = target.targetsData[action];
            }
            else {
                act = delimSplit(":", target.targetsData[action]);
                newData = (redirectTarget + ":" + act[1] + "@*" + "/" + target.name );
                newTar[action] = [newData];
            }
        }
        for (var action in this.teamTargetsData[target.role.side]) {
            if ((redirectActions !== "*") && (redirectActions.indexOf(action) === -1)) {
                newTar2[action] = this.teamTargetsData[target.role.side][action];
            }
            else {
                act = delimSplit(":", this.teamTargetsData[target.role.side][action]);
                newData = (redirectTarget + ":" + act[1] + "@*"  + "/" + target.name );
                newTar2[action] = [newData];
            }
        }
        for (var action in this.roleTargetsData[target.role.role]) {
            if ((redirectActions !== "*") && (redirectActions.indexOf(action) === -1)) {
                newTar3[action] = this.roleTargetsData[target.role.role][action];
            }
            else {
                act = delimSplit(":", this.roleTargetsData[target.role.role][action]);
                newData = (redirectTarget + ":" + act[1] + "@*"  + "/" + target.name );
                newTar3[action] = [newData];
            }
        }
        target.targetsData = newTar;
        this.teamTargetsData[target.role.side] = newTar2;
        this.roleTargetsData[target.role.role] = newTar3;
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
                else if ("addCharges" in player.role.actions.night[act]) {
                    if (mafia.getCharges(player, "night", act) !== undefined) {
                        mafia.setChargesFor(player, "night", act, mafia.getCharges(player, "night", act) + player.role.actions.night[act].addCharges);
                    }
                }
                else if (player.role.actions.night[act].clearCharges) {
                    mafia.setChargesFor(player, "night", act, undefined);
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
                else if ("addCharges" in player.role.actions.standby[act]) {
                    if (mafia.getCharges(player, "standby", act) !== undefined) {
                        mafia.setChargesFor(player, "standby", act, mafia.getCharges(player, "standby", act) + player.role.actions.standby[act].addCharges);
                    }
                }
                else if (player.role.actions.standby[act].clearCharges) {
                    mafia.setChargesFor(player, "standby", act, undefined);
                }
            }
        }
        for (act in player.role.actions) {
            var action = player.role.actions[act];
            if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                if (action.mode.evadeCharges == "*") {
                    if (!(act in player.evadeCharges)) {
                        player.evadeCharges[act] = 0;
                    }
                } else {
                    player.evadeCharges[act] = action.mode.evadeCharges;
                }
            }
        }
        if ("daykill" in player.role.actions) {
            var action = player.role.actions.daykill;
            if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                if (action.mode.evadeCharges == "*") {
                    if (!("daykill" in player.evadeCharges)) {
                        player.evadeCharges.daykill = 0;
                    }
                } else {
                    player.evadeCharges.daykill = action.mode.evadeCharges;
                }
            }
        }
        if ("expose" in player.role.actions) {
            var action = player.role.actions.expose;
            if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                if (action.mode.evadeCharges == "*") {
                    if (!("expose" in player.evadeCharges)) {
                        player.evadeCharges.expose = 0;
                    }
                } else {
                    player.evadeCharges.expose = action.mode.evadeCharges;
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

        if ("setVote" in player.role.actions) {
            player.extraVote = player.role.actions.setVote;
        }
        if ("addVote" in player.role.actions) {
            player.extraVote += player.role.actions.addVote;
        }
        if ("setVoteshield" in player.role.actions) {
            player.extraVoteshield = player.role.actions.setVoteshield;
        }
        if ("addVoteshield" in player.role.actions) {
            player.extraVoteshield += player.role.actions.addVoteshield;
        }
    };
    this.voteForPlayer = function(src, commandData, canVoteTeam) {
        var silentVote = mafia.theme.silentVote;
        var name = sys.name(src);
        SESSION.users(src).mafia_start = (new Date()).getTime();
        if (!this.isInGame(commandData)) {
            gamemsg(name, "That person is not playing!");
            return;
        }
        if (name in this.votes) {
            gamemsg(name, "You already voted!");
            return;
        }
        var player = mafia.players[name];
        if (player.role.actions && player.role.actions.noVote) {
            gamemsg(name, (player.role.actions.noVoteMsg ? player.role.actions.noVoteMsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData) : "You cannot vote!"));
            this.votes[name] = null;
            this.voteCount += 1;
            return;
        }
        if (!canVoteTeam && player.role.actions) {
            var teamvote;
            if ("preventTeamvote" in player.role.actions) {
                teamvote = player.role.actions.preventTeamvote;
            } else if ("teamUtilities" in player.role.actions && player.role.actions.teamUtilities) {
                teamvote = true;
            }

            if (name in mafia.teamVoters && mafia.teamVoters[name] == commandData) {
                teamvote = false;
            }

            if (teamvote) {
                var target = mafia.players[commandData];
                if (teamvote === true && player.role.side == target.role.side) {
                    gamemsg(name, "This person is your teammate! To vote them, use " + htmlLink("/Teamvote " + commandData.toCorrectCase()) + " or simply " + htmlLink("/Vote " + commandData.toCorrectCase())  + " again.", undefined, undefined, true);
                    mafia.teamVoters[name] = commandData;
                    return;
                } else if (Array.isArray(teamvote) && teamvote.indexOf(target.role.role) !== -1) {
                    gamemsg(name, "This person is your teammate! To vote them, use " + htmlLink("/Teamvote" + commandData.toCorrectCase()) + " or simply " + htmlLink("/Vote " + commandData.toCorrectCase())  + "  again.", undefined, undefined, true);
                    mafia.teamVoters[name] = commandData;
                    return;
                }
            }
        }
        if (silentVote !== undefined && silentVote) {
            var votemsg = mafia.theme.votemsg ? mafia.theme.votemsg : "~Player~ voted!";
            gamemsg(name, "You voted for " + commandData + "!");
            gamemsgAll(votemsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData));
        } else {
            var votemsg = mafia.theme.votemsg ? mafia.theme.votemsg : "~Player~ voted for ~Target~!";
            if ((votemsg.indexOf("~Target~") === -1) || (votemsg.indexOf("~Player~") === -1) )
                gamemsg(name, "You voted for " + commandData + "!");
            gamemsgAll(votemsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData));
        }
        if (canVoteTeam) {
            this.addPhaseStalkAction(name, "teamvote", commandData);
        } else {
            this.addPhaseStalkAction(name, "vote", commandData);
        }
        this.votes[sys.name(src)] = commandData;
        if (!(commandData in this.votedBy)) {
            this.votedBy[commandData] = [];
        }
        this.votedBy[commandData].push(sys.name(src));
        this.voteCount += 1;

        var noplur = false, totalPlayers = mafia.playerCount();
        if (this.voteCount * 2 > totalPlayers && mafia.theme.noplur) {
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

        var votersLeft = false;
        for (var p in mafia.players) {
            var pVoter = mafia.players[p];
            if (!(pVoter.name in mafia.votes) && pVoter.role.actions && !pVoter.role.actions.noVote) {
                votersLeft = true;
                break;
            }
        }

        if (this.voteCount == totalPlayers || noplur || (mafia.theme.checkNoVoters && !votersLeft)) {
            mafia.ticks = 1;
        } else if (mafia.ticks < 8 && (mafia.theme.votesniping === undefined || !mafia.theme.votesniping)) {
            mafia.ticks = 8;
        }
    };
    this.whisperMessage = function (sentName,commandArray) {
        if (sentName === commandArray[0]) return;
        if ((commandArray[1] === "*") || (commandArray[1] === "")) {
            gamemsg(sentName, "Please whisper an actual message. Syntax is /whisper [name]:[message]");
            return;
        }
        var id = sys.id(sentName);
        if (id !== undefined && sys.isInChannel(id, mafiachan)) {
            sys.sendMessage(id, sentName + ": " + "[Whisper to " + commandArray[0] + "] " + commandArray[1], mafiachan);
        }
        var tarid = sys.id(commandArray[0]);
        if (tarid !== undefined && sys.isInChannel(tarid, mafiachan)) {
            sys.sendMessage(tarid, sentName + ": " + "[Whisper] " + commandArray[1], mafiachan);
        }
    };
    this.showVoteCount = function (sentName,commandArray) {
        var checkPlayer = commandArray[0];
        var checkDay = commandArray[1];
        var pastDay = false;
        var voteData = {};
        if (checkDay === "*" || +checkDay === mafia.time.nights) {
            voteData = this.votedBy;
            gamemsg(sentName, "*** Votecount ***");
        } else {
            if ((checkDay > mafia.time.nights) || (checkDay <= 0)) {
                gamemsg(sentName, "Please enter a valid day to search for!", "Vote");
                return;
            }
            if (checkDay < mafia.time.nights) {
                pastDay = true;
            }
            gamemsg(sentName, "*** Votecount for Day " + checkDay + " ***");
            voteData = this.votedByArchive[checkDay];
        }
        checkPlayer = mafia.isInGame(checkPlayer) ? this.correctCase(checkPlayer) : checkPlayer;
        if (checkPlayer === noPlayer || checkPlayer === "") {
            if (pastDay) {
                gamemsg(sentName, this.lynchees[checkDay-1] + " was voted off!", "Vote");
            }
            var sortable = [];
            for (var target in voteData) {
                sortable.push([target, voteData[target].length]);
            }
            if (sortable.length === 0) {
                if (!(pastDay)) {
                    gamemsg(sentName,"No votes have been cast yet!", "Vote");
                }
                return;
            }
            sortable.sort(function(a, b) {return b[1] - a[1];});
            var votedUser;
            for (var s in sortable) {
                votedUser = sortable[s][0];
                gamemsg(sentName,votedUser + (pastDay ? " was " : " has been ") + "voted by " + readable( voteData[votedUser], "and" ) + ".","Vote");
            }
            return;
        }
        if (!(checkPlayer in voteData)) {
            gamemsg(sentName,checkPlayer + (pastDay ? " was not " : " has not been ") + "voted for!","Vote");
            return;
        }
        gamemsg(sentName,checkPlayer + (pastDay ? " was " : " has been ") + "voted by " + readable( voteData[checkPlayer], "and" ) + ".","Vote");
    };
    this.testWin = function (slay) {
        if (mafia.playerCount() === 0) {
            gamemsgAll(mafia.theme.drawmsg || "Everybody died! This is why we can't have nice things :(");
            sendBorder();

            mafia.compilePhaseStalk("GAME END");
            currentStalk.push("Winners: None (game ended in a draw).");
            mafia.mafiaStats.result("Tie");
            mafia.saveCurrentGame("Tie");
            mafia.checkDead(CurrentGame.playerCount);
            if (sys.id('PolkaBot') !== undefined) {
                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
            }
            //mafiabot.sendAll("GAME ENDED", mafiachan);
            mafia.unloadAWOL();
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
                sendBorder();
            }
            mafia.compilePhaseStalk("GAME END");
            if (winSide in mafia.theme.sideWinMsg) {
                gamemsgAll(mafia.theme.sideWinMsg[winSide].replace(/~Players~/g, readable(players, "and")));
            } else {
                gamemsgAll("The " + mafia.theme.trside(winSide) + " (" + readable(players, "and") + ") wins!");
            }
            mafia.saveCurrentGame(mafia.theme.trside(winSide));
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
            sendBorder();
            mafia.checkDead(CurrentGame.playerCount);
            mafia.unloadAWOL();
            mafia.clearVariables();
            if (sys.id('PolkaBot') !== undefined) {
                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: GAME ENDED", mafiachan);
            }
            //mafiabot.sendAll("GAME ENDED", mafiachan);
            mafia.advertiseFeaturedTheme();
            mafia.isEvent = false;
            mafia.tryEventTheme();
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
            sendBorder();
            gamemsgAll(null, "Times Up! ");

            // Save stats if the game was played
            CurrentGame.playerCount = mafia.signups.length;
            PreviousGames.push(CurrentGame);
            savePlayedGames(true);
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
                gamemsgAll(null, "Well, Not Enough Players! ");
                gamemsgAll("You need at least "+minp+" players to join (Current: " + mafia.signups.length + ").", "±Game");
                sendBorder();
                mafia.clearVariables();
                mafia.usersToShove = {};
                mafia.mafiaStats.result("dead");
                mafia.checkDead(CurrentGame.playerCount);
                mafia.isEvent = false;
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
            srcArray.shuffle();
            mafia.signups = mafia.signups.shuffle();

            var spawnPacks = mafia.theme.spawnPacks,
                packs = {},
                packName, sp, pIndex, pInfo;

            for (i = 0; i < srcArray.length; ++i) {
                sp = srcArray[i];
                var playerRole;

                if (typeof sp == "string") {
                    if (sp.indexOf("pack:") === 0) {
                        packName = sp.substr(5);

                        if (!(packName in packs)) {
                            if ("chance" in spawnPacks[packName]) {
                                pIndex = randomSample(spawnPacks[packName].chance);
                            } else {
                                pIndex = sys.rand(0, spawnPacks[packName].roles.length);
                            }
                            packs[packName] = [pIndex, 0];
                        }
                        pIndex = packs[packName][0];
                        pInfo = packs[packName][1] % spawnPacks[packName].roles[pIndex].length;
                        packs[packName][1]++;
                        playerRole = spawnPacks[packName].roles[pIndex][pInfo];
                    } else {
                        playerRole = sp;
                    }
                } else {
                    playerRole = randomSample(sp);
                }

                mafia.players[mafia.signups[i]] = { 'name': mafia.signups[i], 'role': mafia.theme.roles[playerRole], 'targets': {}, 'recharges': {}, 'dayrecharges': {}, 'charges' : {}, 'daycharges': {}, 'evadeCharges': {}, "restrictions": [], "extraVote": 0, "extraVoteshield": 0 };
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
                        if (action.mode.evadeCharges == "*") {
                            initPlayer.evadeCharges[act] = 0;
                        } else {
                            initPlayer.evadeCharges[act] = action.mode.evadeCharges;
                        }

                    }
                }
                if ("daykill" in initPlayer.role.actions) {
                    var action = initPlayer.role.actions.daykill;
                    if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                        if (action.mode.evadeCharges == "*") {
                            initPlayer.evadeCharges.daykill = 0;
                        } else {
                            initPlayer.evadeCharges.daykill = action.mode.evadeCharges;
                        }
                    }
                }
                if ("expose" in initPlayer.role.actions) {
                    var action = initPlayer.role.actions.expose;
                    if (typeof action === "object" && "mode" in action && typeof action.mode === "object" && "evadeCharges" in action.mode) {
                        if (action.mode.evadeCharges == "*") {
                            initPlayer.evadeCharges.expose = 0;
                        } else {
                            initPlayer.evadeCharges.expose = action.mode.evadeCharges;
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

            gamemsgAll(null, "The Roles have been Decided! ");
            mafia.usersToShove = {};

            var p, player;
            for (p in mafia.players) {
                mafia.showOwnRole(p, true);
            }
            if (mafia.theme.closedSetup !== "full") {
                gamemsgAll(mafia.getCurrentRoles() + ".", "±Current Roles", undefined, true);
            }
            mafia.sendCurrentPlayers();
            if ((mafia.theme.closedSetup !== "team") && !mafia.theme.closedSetup && (mafia.theme.closedSetup !== "full")) {
                // Send players all roles sided with them
                for (p in mafia.players) {
                    player = mafia.players[p];
                    gamemsg(player.name, mafia.getRolesForTeamS(player.role.side), "±Current Team");
                }
            }

            /*Added 10 seconds to the first night to give users a chance to read their role and connect with team mates */
            if (mafia.theme.ticks === undefined || (isNaN(mafia.theme.ticks.night1) && isNaN(mafia.theme.ticks.night)) || mafia.theme.ticks.night1 < 1 || mafia.theme.ticks.night1 > 60) {
                mafia.ticks = 40;
            } else {
                mafia.ticks = mafia.theme.ticks.night1 || mafia.theme.ticks.night + 10;
            }
            this.eventTimeBoost();
            mafia.time.nights++;
            mafia.state = "night";
            gamemsgAll("Night " + mafia.time.nights, "±Time");
            gamemsgAll(null, "Make your moves, you only have " + mafia.ticks + " seconds! ");
            sendBorder();
            for (var p in mafia.players) {
                var commands = mafia.getCommands(p, mafia.state);
                if (commands !== null) {
                    gamemsg(mafia.players[p].name, commands, undefined, undefined, true);
                }
            }
            mafia.resetTargets();
            mafia.reduceRecharges();

            mafia.compulsoryActions();

            var lower = Object.keys(mafia.players).map(function(x) { return x.toLowerCase(); }),
                malist = [];
            for (var y in script.mafiaSuperAdmins.hash) {
                if (lower.indexOf(y) == -1) {
                    malist.push(y);
                }
            }
            for (y in script.mafiaAdmins.hash) {
                if (lower.indexOf(y) == -1) {
                    malist.push(y);
                }
            }
            var auths = sys.dbAuths();
            for (y in auths) {
                if (lower.indexOf(auths[y]) == -1) {
                    malist.push(auths[y]);
                }
            }
            this.dead = this.dead.concat(removeDuplicates(malist));
        },
        night: function () {
            sendBorder();
            gamemsgAll(null, "Times Up! ");

            mafia.compilePhaseStalk("NIGHT PHASE " + mafia.time.nights);

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
            var watchTargets = {};
            var addStalkMove = function(user, target) {
                if (!(user in stalkTargets)) {
                    stalkTargets[user] = {};
                }
                stalkTargets[user][target] = 1;

                if (!(target in watchTargets)) {
                    watchTargets[target] = {};
                }
                watchTargets[target][user] = 1;
            };

            var teammates = {};
            for (var t in mafia.players) {
                teammates[t] = mafia.getPlayersForTeam(mafia.players[t].role.side);
            }

            var player, names, j, evadeCharges = {}, evadeChances = {}, noRepeat = {};
            var selfConverted = [];
            var getPlayerRoleId = function(x) { return mafia.players[x].role.role; };
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
                    if (!mafia.isInGame(names[j]) || !mafia.hasCommand(names[j], o.action, "night") || mafia.players[names[j]].role.role !== o.role) continue;
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

                    if (player.name in noRepeat && noRepeat[player.name].indexOf(o.action) !== -1) {
                        continue;
                    }
                    if (Action.noRepeat) {
                        if (!(player.name in noRepeat)) {
                            noRepeat[player.name] = [];
                        }
                        noRepeat[player.name].push(o.action);
                    }

                    outer:
                    for (t in targets) {
                        var evadeChance = Math.random();
                        var targetName = targets[t];
                        var pos = targetName.indexOf(':');
                        var pos2 = targetName.indexOf('@');
                        var pos3 = targetName.indexOf('/');
                        //var userInputAction = targetName.substring(pos3); //keeps track of who input the action
                        var targetName = targetName.substring(0, pos3);
                        var targetData, targetRedirect;
                        if (pos === -1) {
                            targetData = "*";
                            targetRedirect = targetName.substring(pos2 + 1);
                            targetName = targetName.substring(0, pos);
                        }
                        else {
                            targetRedirect = targetName.substring(pos2 + 1);
                            targetName = targetName.substring(0, pos2);
                            targetData = targetName.substring(pos + 1);
                            targetName = targetName.substring(0, pos);
                        }

                        if (!(targetName in mafia.players)) {continue;}

                        if (mafia.isInGame(targetName) && mafia.players[targetName].redirectTo !== undefined && (mafia.players[targetName].redirectActions === "*" || mafia.players[targetName].redirectActions.indexOf(o.action) !== -1)) {
                            var shieldmsg = (mafia.players[targetName].shieldmsg);
                            targetName = mafia.players[targetName].redirectTo;
                            gamemsg(player.name, shieldmsg.replace(/~Action~/g, o.action).replace(/~Self~/g, targetName).replace(/~Target~/g, targets[t]));
                        }

                        var failmsg, pinpointBroadcastFailMsg;
                        if ("pinpoint" in Action) {
                            if ((Action.pinpoint) && (targetData.toLowerCase() !== mafia.players[targetName].role.translation.toLowerCase() )) {
                                failmsg = "pinpointFailMsg" in Action ? Action.pinpointFailMsg : "Your ~Command~ didn't work because you guessed ~Target~'s role incorrectly!";
                                failmsg = failmsg.replace(/~Command~/g, o.action).replace(/~Target~/g, targetName).replace(/~GuessedRole~/g, targetData);
                                gamemsg(player.name,failmsg);
                                if ("pinpointBroadcastFailMsg" in Action) {
                                    pinpointBroadcastFailMsg = Action.pinpointBroadcastFailMsg.replace(/~Command~/g, o.action).replace(/~Target~/g, targetName).replace(/~GuessedRole~/g, targetData);
                                    gamemsgAll(pinpointBroadcastFailMsg);
                                    }
                                continue;
                            }
                        }
                        if ("userMustBeVisited" in Action) {
                            if (Action.userMustBeVisited != player.name in watchTargets) {
                                gamemsg(player.name, "Your " + o.action + " didn't work because you were " + (Action.userMustBeVisited ? "not " : "") + "visited during the night!");
                                continue;
                            }
                        }
                        // Will not work well for shared actions
                        if ("targetMustBeVisited" in Action) {
                            if (Action.targetMustBeVisited != targetName in watchTargets) {
                                gamemsg(player.name, "Your " + o.action + " didn't work because your target (" + targetName + ") was " + (Action.targetMustBeVisited ? "not " : "") + "visited during the night!");
                                continue;
                            }
                        }
                        if ("targetMustVisit" in Action) {
                            if (Action.targetMustVisit != targetName in stalkTargets) {
                                gamemsg(player.name, "Your " + o.action + " didn't work because your target (" + targetName + ") was " + (Action.targetMustVisit ? "not " : "") + "visiting someone else during the night!");
                                continue;
                            }
                        }
                        //Coded, but this is mostly useless; leaving it here in case someone find an use to this
                        if ("userMustVisit" in Action) {
                            if (Action.userMustVisit != player.name in stalkTargets) {
                                gamemsg(player.name, "Your " + o.action + " didn't work because you were " + (Action.userMustVisit ? "not " : "") + "visiting someone else during the night!");
                                continue;
                            }
                        }

                        if (!Action.noFollow) {
                            addStalkMove(player.name, targetName);
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

                            if (["kill", "protect", "inspect", "distract", "poison", "safeguard", "stalk", "watch", "convert", "copy", "curse", "detox", "dispel", "shield", "guard", "massconvert", "disguise", "redirect"].indexOf(command) === -1 && !commandIsDummy) {
                                continue;
                            }
                            if (!mafia.isInGame(target)) {
                                if (command != "stalk" && command != "watch")
                                    continue;
                            } else {
                                target = mafia.players[target];
                                // Action blocked by Protect or Safeguard
                                var piercing = false;
                                if (("pierceChance" in Action && Action.pierceChance > Math.random()) || Action.pierce) {
                                    piercing = true;
                                }
                                if (commandIsDummy && (command + "Pierce") in Action && Action[command + "Pierce"]) {
                                    piercing = true;
                                }
                                if (!piercing && target.guardActions.indexOf(o.action) !== -1) {
                                    gamemsg(player.name, target.guardmsg.replace(/~Command~/g, o.action));
                                    continue outer;
                                }
                                if (!piercing && ((target.guarded && command == "kill") || (target.safeguarded && (["distract", "inspect", "stalk", "watch", "poison", "convert", "copy", "curse", "detox", "dispel", "massconvert", "disguise"].indexOf(command) !== -1 || commandIsDummy)))) {
                                    gamemsg(player.name, (command == "kill" ? target.protectmsg : target.safeguardmsg));
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
                                    '~Action~': o.action,
                                    '~GuessedRole~': targetData
                                };
                                // Defensive Modes
                                if (command in target.role.actions) {
                                    targetMode = target.role.actions[command];
                                    var bp = Action.bypass || [];
                                    if (targetMode.mode == "ignore" && bp.indexOf("ignore") === -1) {
                                        if (command == "distract") {
                                            var distractmsg = "msg" in targetMode ? targetMode.msg : "The ~Distracter~ came to you last night, but you ignored her!";
                                            gamemsg(target.name, formatArgs(distractmsg, modeargs));
                                        } else {
                                            if (!targetMode.silent) {
                                                var targetmsg = "msg" in targetMode ? targetMode.msg : "Your target (~Self~) evaded your ~Action~!";
                                                gamemsg(player.name, formatArgs(targetmsg, modeargs));
                                                var broadcastMsg = "broadcastMsg" in targetMode ? targetMode.broadcastMsg : "";
                                                gamemsgAll(formatArgs(broadcastMsg, modeargs));
                                            }
                                        }
                                        continue;
                                    }
                                    if (targetMode.mode == "ChangeTarget"  && bp.indexOf("ChangeTarget") == -1) {
                                        tarmsg = "targetmsg" in targetMode ? targetMode.targetmsg : ("hookermsg" in targetMode ? targetMode.hookermsg : false) ;
                                        if (tarmsg) {
                                            gamemsg(player.name, tarmsg);
                                        }
                                        gamemsg(target.name, formatArgs(targetMode.msg, modeargs));
                                        mafia.kill(player);
                                        nightkill = true;
                                        mafia.removeTargets(target);
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
                                        tarmsg = "msg" in targetMode ? targetMode.msg : "You identified ~Target~ as the ~Role~ that tried to ~Action~ you!";
                                        gamemsg(target.name, formatArgs(tarmsg, modeargs));
                                    }
                                    else if (targetMode.mode == "die" && bp.indexOf("die") === -1) {
                                        tarmsg = "msg" in targetMode ? targetMode.msg :  "~Target~ tried to ~Action~ you, but you got scared and died!";
                                        tarmsg2 = "targetmsg" in targetMode ? targetMode.targetmsg : "You tried to ~Action~ ~Self~, but they got scared and died!";
                                        gamemsg(target.name, formatArgs(tarmsg, modeargs));
                                        gamemsg(player.name, formatArgs(tarmsg2, modeargs));
                                        mafia.kill(target);
                                        nightkill = true;
                                        continue;
                                    }
                                    else if (typeof targetMode.mode == "object") {
                                        if ("identify" in targetMode.mode && targetMode.mode.identify.indexOf(player.role.role) !== -1  && bp.indexOf("identify") === -1) {
                                            tarmsg = "identifymsg" in targetMode ? targetMode.identifymsg : "You identified ~Target~ as the ~Role~ that tried to ~Action~ you!";
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

                                            if (!evaded && evdCharges > 0) {
                                                target.evadeCharges[command] -= 1;
                                                tarmsg = ("evadechargemsg" in targetMode ? targetMode.evadechargemsg : "You evaded a ~Action~ (you still can evade ~EvadeCharges~ more times)!").replace(/~Action~/g, command).replace(/~EvadeCharges~/g, target.evadeCharges[command]);
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
                                                if (!targetMode.silent) {
                                                    tarmsg = ("msg" in targetMode ? targetMode.msg : "Your target (~Self~) evaded your ~Action~!").replace(/~EvadeCharges~/g, target.evadeCharges[command]);
                                                    gamemsg(player.name, formatArgs(tarmsg, modeargs));
                                                }
                                                continue;
                                            }
                                        }
                                        if ("evadeChance" in targetMode.mode && bp.indexOf("evadeChance") === -1) {
                                            var evdObj, evaded = false, ec, targetEvd, exists = false;

                                            if (!(target.name in evadeChances)) {
                                                evadeChances[target.name] = [];
                                            }
                                            for (ec in evadeChances[target.name]) {
                                                targetEvd = evadeChances[target.name][ec];
                                                if (targetEvd.command === command && ((Action.common === "Role" && targetEvd.role === player.role.role) || (Action.common === "Team" && targetEvd.side === player.role.side))) {
                                                    evaded = targetEvd.evaded;
                                                    exists = true;
                                                    break;
                                                }
                                            }
                                            if (!exists) {
                                                if (targetMode.mode.evadeChance > evadeChance) {
                                                    evaded = true;
                                                }
                                                if (Action.common !== "Self") {
                                                    evdObj = {
                                                        command: command,
                                                        evaded: evaded
                                                    };
                                                    if (Action.common === "Role") {
                                                        evdObj.role = player.role.role;
                                                    } else if (Action.common === "Team") {
                                                        evdObj.side = player.role.side;
                                                    }
                                                    evadeChances[target.name].push(evdObj);
                                                }
                                            }

                                            if (evaded) {
                                                if (!targetMode.silent) {
                                                    tarmsg = "msg" in targetMode ? targetMode.msg : "Your target (~Self~) evaded your ~Action~!";
                                                    gamemsg(player.name, formatArgs(tarmsg, modeargs));
                                                }
                                                continue;
                                            }
                                        }
                                        if ("ignore" in targetMode.mode && targetMode.mode.ignore.indexOf(player.role.role) !== -1  && bp.indexOf("ignore") === -1) {
                                            if (command == "distract") {
                                                var distractmsg = "msg" in targetMode ? targetMode.msg : "The ~Distracter~ came to you last night, but you ignored her!";
                                                gamemsg(target.name, formatArgs(distractmsg, modeargs));
                                            } else {
                                                if (!targetMode.silent) {
                                                    tarmsg = "msg" in targetMode ? targetMode.msg : "Your target (~Self~) evaded your ~Action~!";
                                                    gamemsg(player.name, formatArgs(tarmsg, modeargs));
                                                }
                                            }
                                            continue;
                                        }
                                        if ("killif" in targetMode.mode && targetMode.mode.killif.indexOf(player.role.role) !== -1 && bp.indexOf("killif") === -1) {
                                            tarmsg = "targetmsg" in targetMode ? targetMode.targetmsg : ("hookermsg" in targetMode ? targetMode.hookermsg : false) ;
                                            if (tarmsg) {
                                                gamemsg(player.name, tarmsg);
                                            }
                                            tarmsg2 = targetMode.msg;
                                            gamemsg(target.name, formatArgs(tarmsg2, modeargs));
                                            mafia.kill(player);
                                            nightkill = true;
                                            mafia.removeTargets(target);
                                            continue outer;
                                        }
                                        if ("die" in targetMode.mode && targetMode.mode.die.indexOf(player.role.role) !== -1  && bp.indexOf("die") === -1) {
                                            tarmsg = "diemsg" in targetMode ? targetMode.diemsg :  "~Target~ tried to ~Action~ you, but you got scared and died!";
                                            tarmsg2 = "targetdiemsg" in targetMode ? targetMode.targetdiemsg : "You tried to ~Action~ ~Self~, but they got scared and died!";
                                            gamemsg(target.name, formatArgs(tarmsg, modeargs));
                                            gamemsg(player.name, formatArgs(tarmsg2, modeargs));
                                            mafia.kill(target);
                                            nightkill = true;
                                            continue;
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
                                '~Action~': o.action,
                                '~RedirectTarget~': targetRedirect
                            };
                            var onlyUser;
                            if (command == "distract") {
                                tarmsg = "distractmsg" in Action ? Action.distractmsg : "The ~Distracter~ came to you last night! You were too busy being distracted!";
                                gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                onlyUser = "onlyUser" in Action ? Action.onlyUser : false; //if true, only blocks actions input by the target (not teammates)
                                if (mafia.removeTargets(target, true, onlyUser)) {
                                    /* warn role / teammates... No args because messes up very easily */
                                    var teamMsg = "teammsg" in Action ? Action.teammsg : "Your teammate was too busy with the ~Distracter~ during the night, you decided not to ~Action~ anyone during the night!";
                                    if ("night" in target.role.actions) {
                                        for (var action in target.role.actions.night) {
                                            if (!target.role.actions.night[action].ignoreDistract) {
                                                var team = getTeam(target.role, target.role.actions.night[action].common);
                                                for (var x in team) {
                                                    if (team[x] != target.name) {
                                                        gamemsg(team[x], formatArgs(teamMsg.replace(/~Action~/g, action), nightargs));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else if (command == "protect") {
                                target.guarded = true;
                                target.protectmsg = formatArgs(("protectmsg" in Action ? Action.protectmsg : "Your target (~Target~) was protected!"), nightargs);
                            }
                            else if (command == "safeguard") {
                                target.safeguarded = true;
                                target.safeguardmsg = formatArgs(("safeguardmsg" in Action ? Action.safeguardmsg : "Your target (~Target~) was guarded!"), nightargs);
                            }
                            else if (command == "redirect") {
                                var redirectmsg;
                                var redirectActions = ("redirectActions" in Action ? Action.redirectActions : "*" );
                                this.changeTargets( target,targetRedirect,redirectActions );
                                redirectmsg = formatArgs(("redirectMsg" in Action ? Action.redirectMsg : "Your target (~Target~) was redirected to ~RedirectTarget~!"), nightargs);
                                gamemsg(player.name, redirectmsg);
                                redirectmsg = formatArgs(("redirectTargetMsg" in Action ? Action.redirectTargetMsg : "You were redirected to ~RedirectTarget~!"), nightargs);
                                gamemsg(target.name, redirectmsg);
                            }
                            else if (command == "inspect") {
                                var Sight = Action.Sight;
                                targetMode = targetMode || {};
                                var inspectMode = target.role.actions.inspect || {};
                                var disguise = target.disguiseRole;
                                var inspectedRole = target.role.role, inspectedSide = target.role.side;
                                var inspectSide = Sight == "Team" || targetMode.revealSide !== undefined;

                                if (typeof Sight == "object") {
                                    var srole = randomSample(Sight);
                                    if (srole != "true") {
                                        if (disguise !== undefined) {
                                            inspectedRole = disguise;
                                        } else {
                                            inspectedRole = srole;
                                        }
                                    }
                                } else if (disguise !== undefined) {
                                    inspectedRole = disguise;
                                } else if (targetMode.revealAs !== undefined) {
                                    inspectedRole = this.revealAsRole(targetMode.revealAs, target.role, player.role.role);
                                }

                                if (typeof inspectMode.seenSide == "string") {
                                    inspectedSide = inspectMode.seenSide;
                                } else if (Sight == "Team" && disguise !== undefined) {
                                    inspectedSide = mafia.theme.roles[disguise].side;
                                }
                                var inspMsg;
                                if (inspectSide) {
                                    inspMsg = ("inspectMsg" in Action ? Action.inspectMsg : "~Target~ is sided with the ~Result~!!");
                                    gamemsg(player.name, inspMsg.replace(/~Target~/g, target.name).replace(/~Result~/g, mafia.theme.trside(inspectedSide)), "±Info");
                                } else {
                                    inspMsg = ("inspectMsg" in Action ? Action.inspectMsg : "~Target~ is the ~Result~!!");
                                    gamemsg(player.name, inspMsg.replace(/~Target~/g, target.name).replace(/~Result~/g, mafia.theme.trrole(inspectedRole)), "±Info");
                                }
                            }
                            else if (command == "kill") {
                                var killMessage = "msg" in Action ? Action.msg : (mafia.theme.killusermsg || "You were killed during the night!"); //Custom message || Theme's message || Default message
                                var deathmsg = "killmsg" in Action ? formatArgs(Action.killmsg, nightargs) : null;
                                gamemsg(target.name, killMessage);
                                mafia.kill(target, deathmsg);
                                nightkill = true;
                            }
                            else if (command == "poison") {
                                if (target.poisoned === undefined || target.poisonCount - target.poisoned >= finalPoisonCount) {
                                    var poisonmsg = "poisonmsg" in Action ? Action.poisonmsg : "Your target (~Target~) was poisoned!";
                                    var poisontarmsg = "poisontarmsg" in Action ? Action.poisontarmsg : "";
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
                                targetMode = targetMode || {};
                                if (target in stalkTargets) {
                                    var visited = Object.keys(stalkTargets[target]).sort();
                                    if (visited.length > 0 && targetMode.mode !== "noVisit") {
                                        tarmsg = ("stalkmsg" in Action ? Action.stalkmsg : "Your target (~Target~) visited ~Visit~ this night!").replace(/~Target~/gi, target).replace(/~Visit~/gi, readable(visited, "and"));
                                        gamemsg(player.name, tarmsg);
                                    } else {
                                        tarmsg = ("novisitmsg" in Action ? Action.novisitmsg : "Your target (~Target~) didn't visit anyone this night!").replace(/~Target~/gi, target);
                                        gamemsg(player.name, tarmsg);
                                    }
                                } else {
                                    tarmsg = ("novisitmsg" in Action ? Action.novisitmsg : "Your target (~Target~) didn't visit anyone this night!").replace(/~Target~/gi, target);
                                    gamemsg(player.name, tarmsg);
                                }
                            }
                            else if (command == "watch") {
                                target = typeof target == "object" ? target.name : target;
                                targetMode = targetMode || {};
                                if (target in watchTargets) {
                                    var visited = Object.keys(watchTargets[target]);
                                    if (visited.indexOf(player.name) !== -1) {
                                        visited.splice(visited.indexOf(player.name), 1);
                                    }
                                    visited = getFirstLast(visited, ("watchFirst" in Action ? Action.watchFirst : 1), Action.watchLast || 0, Action.watchRandom || 0);

                                    if (visited.length > 0) {
                                        tarmsg = ("watchmsg" in Action ? Action.watchmsg : "Your target (~Target~) was visited by ~Visit~ this night!").replace(/~Target~/gi, target).replace(/~Visit~/gi, readable(visited, "and"));
                                        gamemsg(player.name, tarmsg);
                                    } else {
                                        tarmsg = ("Your target (~Target~) was not visited by anyone this night!").replace(/~Target~/gi, target);
                                        gamemsg(player.name, tarmsg);
                                    }
                                } else {
                                    tarmsg = ("Your target (~Target~) was not visited by anyone this night!").replace(/~Target~/gi, target);
                                    gamemsg(player.name, tarmsg);
                                }
                            }
                            else if (command == "convert") {
                                if(target.name !== player.name && Action.unlimitedSelfConvert) {
                                    if(selfConverted.indexOf(player.name) != -1) {
                                        continue outer;
                                    }
                                    selfConverted.push(player.name);
                                }
                                failedmsg = "convertfailmsg" in Action ? Action.convertfailmsg : "Your target (~Target~) couldn't be converted!";
                                if ("canConvert" in Action && Action.canConvert != "*" && Action.canConvert.indexOf(target.role.role) == -1) {
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                } else {
                                    var oldRole = target.role, newRole = null;
                                    if (typeof Action.newRole == "object") {
                                        if ("random" in Action.newRole && !Array.isArray(Action.newRole.random) && typeof Action.newRole.random === "object" && Action.newRole.random !== null) {
                                            newRole = randomSample(Action.newRole.random);
                                        } else {
                                            var possibleRoles = Object.keys(Action.newRole).shuffle();
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
                                            allmsg = ("convertmsg" in Action ? Action.convertmsg : "A ~Old~ has been converted into a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation);
                                            gamemsgAll(formatArgs(allmsg, nightargs));
                                        }
                                        if (target !== player) {
                                            pmsg = ("convertusermsg" in Action ? Action.convertusermsg : ("usermsg" in Action ? Action.usermsg : "Your target (~Target~) has been converted and is now a ~New~!")).replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation);
                                            gamemsg(player.name, formatArgs(pmsg, nightargs));
                                        }
                                        if (!Action.silentConvert) {
                                            tarmsg = ("tarmsg" in Action ? Action.tarmsg : "You have been converted and changed roles!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation);
                                            gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                            if (mafia.theme.delayedConversionMsg) {
                                                mafia.needsConvertMsg.push(target.name);
                                            } else {
                                                mafia.showOwnRole(sys.id(target.name));
                                            }
                                        }
                                    }
                                }
                            }
                            else if (command == "copy") {
                                failedmsg = "copyfailmsg" in Action ? Action.copyfailmsg : "Your target (~Target~) can't be copied!";
                                if (typeof Action.copyAs == "string" && "canCopy" in Action && Action.canCopy != "*" && Action.canCopy.indexOf(target.role.role) == -1) {
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                } else {
                                    var oldRole = player.role, newRole = null;
                                    if (typeof Action.copyAs == "object") {
                                        var possibleRoles = Object.keys(Action.copyAs).shuffle();
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
                                            allmsg = ("copymsg" in Action ? Action.copymsg : "A ~Old~ has been converted into a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, player.role.translation); //Can't replace ~New~ with nightargs due to different target
                                            gamemsgAll(formatArgs(allmsg, nightargs));
                                        }
                                        if (!Action.silentCopy) {
                                            pmsg = ("copyusermsg" in Action ? Action.copyusermsg : ("usermsg" in Action ? Action.usermsg : "You copied someone and changed roles!")).replace(/~Old~/g, oldRole.translation).replace(/~New~/g, player.role.translation);
                                            gamemsg(player.name, formatArgs(pmsg, nightargs));
                                            if (mafia.theme.delayedConversionMsg) {
                                                mafia.needsConvertMsg.push(player.name);
                                            } else {
                                                mafia.showOwnRole(sys.id(player.name));
                                            }
                                        }
                                    }
                                }
                            }
                            else if (command == "curse") {
                                failedmsg = "cursefailmsg" in Action ? Action.cursefailmsg : "Your target (~Target~) couldn't be cursed!";
                                if ("canCurse" in Action && Action.canCurse != "*" && Action.canCurse.indexOf(target.role.role) == -1) {
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                } else {
                                    var oldRole = target.role, cursedRole = null;
                                    if (typeof Action.cursedRole == "object") {
                                        if ("random" in Action.cursedRole && !Array.isArray(Action.cursedRole.random) && typeof Action.cursedRole.random === "object" && Action.cursedRole.random !== null) {
                                            cursedRole = randomSample(Action.cursedRole.random);
                                        } else {
                                            var possibleRoles = Object.keys(Action.cursedRole).shuffle();
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
                                        pmsg = "cursemsg" in Action ? Action.cursemsg : "Your target (~Target~) was cursed!";
                                        gamemsg(player.name, formatArgs(pmsg, nightargs));
                                        target.cursed = 1;
                                        target.curseCount = finalCurseCount;
                                        target.cursedRole = cursedRole;
                                        target.silentCurse = Action.silentCurse || false;
                                        if (!Action.silent) {
                                            target.curseConvertMessage = "curseConvertMessage" in Action ? Action.curseConvertMessage : "~Target~ has been converted into a ~New~!";
                                        } else {
                                            target.curseConvertMessage = "";
                                        }
                                    }
                                }
                            }
                            else if (command == "detox") {
                                if (target.poisoned !== undefined) {
                                    target.poisoned = undefined;
                                    if (!Action.silent) {
                                        allmsg = "detoxmsg" in Action ? Action.detoxmsg : "A player was cured of poison!";
                                        gamemsgAll(formatArgs(allmsg, nightargs));
                                    }
                                    pmsg = "msg" in Action ? Action.msg : "Your target (~Target~) was cured of poison!";
                                    tarmsg = "targetmsg" in Action ? Action.targetmsg : "You were cured of poison!";
                                    gamemsg(player.name, formatArgs(pmsg, nightargs));
                                    gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                } else {
                                    failedmsg = "detoxfailmsg" in Action ? Action.detoxfailmsg : "Your target (~Target~) isn't poisoned!";
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                }
                            }
                            else if (command == "dispel") {
                                if (target.cursed !== undefined) {
                                    target.cursed = undefined;
                                    if (!Action.silent) {
                                        allmsg = "dispelmsg" in Action ? Action.dispelmsg : "A player's curse was dispelled!";
                                        gamemsgAll(formatArgs(allmsg, nightargs));
                                    }
                                    pmsg = "msg" in Action ? Action.msg : "Your target (~Target~) was freed from their curse!";
                                    tarmsg = "targetmsg" in Action ? Action.targetmsg : "You were freed from your curse!";
                                    gamemsg(player.name, formatArgs(pmsg, nightargs));
                                    gamemsg(target.name, formatArgs(tarmsg, nightargs));
                                } else {
                                    failedmsg = "dispelfailmsg" in Action ? Action.dispelfailmsg : "Your target (~Target~) isn't cursed!";
                                    gamemsg(player.name, formatArgs(failedmsg, nightargs));
                                }
                            }
                            else if (command == "shield") {
                                target.redirectTo = player.name;
                                target.redirectActions = Action.shieldActions || "*";
                                target.shieldmsg = "shieldmsg" in Action ? Action.shieldmsg : "Your ~Action~ was shielded by ~Self~!";
                            }
                            else if (command == "guard") {
                                target.guardActions = removeDuplicates(target.guardActions.concat(Action.guardActions));
                                target.guardmsg = formatArgs(("guardmsg" in Action ? Action.guardmsg : "Your target (~Target~) was guarded from your ~Command~!"), nightargs);
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
                                    targetPlayers = mafia.getPlayersForRole(nr);
                                    newRole = convertRoles[nr];
                                    affected = [];
                                    for (k in targetPlayers) {
                                        affected.push(targetPlayers[k]);
                                        convertedPlayer = this.players[targetPlayers[k]];
                                        mafia.setPlayerRole(convertedPlayer, newRole);
                                        if (!Action.silentMassConvert) {
                                            if (mafia.theme.delayedConversionMsg) {
                                                mafia.needsConvertMsg.push(targetPlayers[k]);
                                            } else {
                                                mafia.showOwnRole(sys.id(targetPlayers[k]));
                                            }
                                        }
                                    }
                                    if (affected.length > 0 && !Action.silent) {
                                        if ("singlemassconvertmsg" in Action) {
                                            singleAffected = singleAffected.concat(affected);
                                        } else {
                                            var actionMessage = ("massconvertmsg" in Action ? Action.massconvertmsg : "The ~Old~ became a ~New~!").replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(nr)).replace(/~New~/g, mafia.theme.trrole(newRole)).replace(/~Number~/g, affected.length);
                                            gamemsgAll(formatArgs(actionMessage, nightargs));
                                        }
                                    }
                                }
                                if (singleAffected.length > 0) {
                                    gamemsgAll(Action.singlemassconvertmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")).replace(/~Number~/g, singleAffected.length)); //No args here to prevent conflicting replacements
                                }
                            }
                            else if (command == "disguise") {
                                if (typeof Action.disguiseRole == "string") {
                                    target.disguiseRole = Action.disguiseRole;
                                } else if (typeof Action.disguiseRole == "object") {
                                    if ("random" in Action.disguiseRole && !Array.isArray(Action.disguiseRole.random) && typeof Action.disguiseRole.random === "object" && Action.disguiseRole.random !== null) {
                                        target.disguiseRole = randomSample(Action.disguiseRole.random);
                                    } else {
                                        var foundDisguise = false;
                                        var possibleRoles = Object.keys(Action.disguiseRole).shuffle();
                                        for (var nr in possibleRoles) {
                                            if (possibleRoles[nr] != "auto" && Action.disguiseRole[possibleRoles[nr]].indexOf(target.role.role) != -1) {
                                                target.disguiseRole = possibleRoles[nr];
                                                foundDisguise = true;
                                                break;
                                            }
                                        }
                                        if (!foundDisguise) {
                                            target.disguiseRole = Action.disguiseRole.auto;
                                        }
                                    }
                                }

                                target.disguised = 1;
                                target.disguiseCount = Action.disguiseCount || 1;
                                var disguisemsg = ("disguisemsg" in Action ? Action.disguisemsg : "You disguised your target (~Target~) as ~Disguise~!").replace(/~Disguise~/g, mafia.theme.trrole(target.disguiseRole));
                                gamemsg(player.name, formatArgs(disguisemsg, nightargs));
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
                            pmsg = ("suicidemsg" in Action ? Action.suicidemsg : "You died while trying to ~Action~ during this night!").replace(/~Action~/g, o.action);
                            gamemsg(player.name, pmsg);
                            mafia.kill(player);
                            nightkill = true;
                        }
                    }
                    if (mafia.theme.quickOnDeadRoles) {
                        mafia.onDeadRoles();
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
                            if (mafia.theme.delayedConversionMsg) {
                                mafia.needsConvertMsg.push(player.name);
                            } else {
                                mafia.showOwnRole(sys.id(player.name));
                            }
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
                if (player.disguiseRole !== undefined) {
                    if (player.disguised < player.disguiseCount) {
                        player.disguised++;
                    } else if (player.disguised >= player.disguiseCount) {
                        player.disguiseRole = undefined;
                    }
                }
            }
            if (!nightkill) {
                gamemsgAll(null, "No one died! ");
            }
            mafia.reduceRecharges();
            mafia.collectedSlay();
            mafia.onDeadRoles();

            if (mafia.theme.delayedConversionMsg) {
                var msglist = removeDuplicates(mafia.needsConvertMsg);
                for (var n in msglist) {
                    if (mafia.isInGame(msglist[n])) {
                        mafia.showOwnRole(sys.id(msglist[n]));
                    }
                }
            }
            for (t in mafia.players) {
                var tplayer = mafia.players[t];
                if (mafia.theme.delayedConversionMsg && mafia.needsConvertMsg.indexOf(t) !== -1) {
                    continue;
                }
                if (tplayer.role.actions && (tplayer.role.actions.updateTeam || tplayer.role.actions.teamUtilities)) {
                    var oldTeam = teammates[t],
                        newTeam = mafia.getPlayersForTeam(tplayer.role.side);

                    for (var tm in newTeam) {
                        if (oldTeam.indexOf(newTeam[tm]) == -1) {
                            mafia.showTeammates(tplayer);
                            break;
                        }
                    }
                }
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
            this.eventTimeBoost();
            sendBorder();
            if (mafia.theme.closedSetup !== "full") {
                gamemsgAll(mafia.getCurrentRoles() + ".", "±Current Roles", undefined, true);
            }
            mafia.sendCurrentPlayers();
            if (mafia.theme.closedSetup !== "team" && !mafia.theme.closedSetup && mafia.theme.closedSetup !== "full") {
                // Send players all roles sided with them
                for (p in mafia.players) {
                    player = mafia.players[p];
                    var side = player.role.side;
                    gamemsg(player.name, mafia.getRolesForTeamS(side), "±Current Team");
                }
            }
            mafia.time.days++;
            mafia.state = "standby";

            gamemsgAll("Day " + mafia.time.days + " (Standby)", "±Time");
            gamemsgAll(null, "You have " + mafia.ticks + " seconds to debate who are the bad guys! ");
            //Sends a help message to anyone with a standby action
            var act, role, player, charges;
            for (role in mafia.theme.standbyRoles) {
                names = mafia.getPlayersForRole(mafia.theme.standbyRoles[role]);
                for (j = 0; j < names.length; ++j) {
                    player = mafia.players[names[j]];
                    for (var k in player.role.actions.standby) {
                        act = player.role.actions.standby[k];
                        charges = mafia.getCharges(player, "standby", k);
                        if (act.msg && (charges === undefined || charges > 0)) {
                            var msg = html_escape(act.msg),
                                colon = msg.indexOf(":"),
                                botName = "";
                            if (colon !== -1) {
                                botName = msg.substring(0, colon);
                                msg = msg.slice(colon + 2);
                            }
                            botName = botName.replace(/\s(\/[A-Z]+[0-9]*)([^A-Z])/gi, " <a href=\"po:setmsg/$1 \">$1</a>$2");
                            msg = msg.replace(/\s(\/[A-Z]+[0-9]*)([^A-Z])/gi, " <a href=\"po:setmsg/$1 \">$1</a>$2");
                            gamemsg(names[j], msg !== "" ? msg : null, botName, undefined, true);
                        }
                    }
                }
            }
            sendBorder();
            for (var p in mafia.players) {
                var commands = mafia.getCommands(p, mafia.state);
                if (commands !== null) {
                    gamemsg(mafia.players[p].name, commands, undefined, undefined, true);
                }
            }
        },
        standby: function () {
            mafia.ticks = 30;
            this.eventTimeBoost();

            mafia.compilePhaseStalk("STANDBY PHASE " + mafia.time.days);

            if (Object.keys(mafia.usersToSlay).length !== 0) {
                sendBorder();
            }
            mafia.collectedSlay();
            if (mafia.testWin()) {
                return;
            }
            sendBorder();
            if (mafia.theme.closedSetup !== "full") {
                gamemsgAll(mafia.getCurrentRoles() + ".", "±Current Roles", undefined, true);
            }
            mafia.sendCurrentPlayers();


            // Send players all roles sided with them
            var p, r, role, side, check,
                playersWithVote = 0,
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
                if (role.actions && !role.actions.noVote) {
                    playersWithVote++;
                }
                if (!check && check !== "full" && check !== "team") {
                    gamemsg(player.name, mafia.getRolesForTeamS(side), "±Current Team");
                }

                if (p in mafia.dayRecharges) {
                    for (r in mafia.dayRecharges[p]) {
                        mafia.setRechargeFor(player, "standby", r, mafia.dayRecharges[p][r]);
                    }
                }
            }

            var nolyn = false;
            if ((mafia.theme.nolynch !== undefined && mafia.theme.nolynch) || (mafia.theme.checkNoVoters && playersWithVote === 0)) {
                nolyn = true;
            }
            if (!nolyn) {
                gamemsgAll("Day " + mafia.time.days + " (Voting)", "±Time");
                gamemsgAll(null, "It's time to vote someone off, type " + htmlLink("/Vote") + " [name], you only have " + mafia.ticks + " seconds! ", undefined, true);
                if (mafia.theme.noplur) {
                    gamemsgAll(null, "A majority vote must be reached otherwise no lynch occurs. With " + mafia.playerCount() + " alive, it's " + (Math.floor(mafia.playerCount()/2)+1) + " to lynch!");
                }
                sendBorder();

                mafia.state = "day";
                mafia.votes = {};
                mafia.votedBy = {};
                mafia.voteCount = 0;
            } else {
                if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                    mafia.ticks = 30;
                } else {
                    mafia.ticks = mafia.theme.ticks.night;
                }
                this.eventTimeBoost();
                mafia.time.nights++;
                mafia.state = "night";

                gamemsgAll("Night " + mafia.time.nights, "±Time");
                gamemsgAll(null, "Make your moves, you only have " + mafia.ticks + " seconds! ");
                sendBorder();
                for (var p in mafia.players) {
                    var commands = mafia.getCommands(p, mafia.state);
                    if (commands !== null) {
                        gamemsg(mafia.players[p].name, commands, undefined, undefined, true);
                    }
                }
                mafia.resetTargets();
                mafia.compulsoryActions();
            }
        },
        day: function () {
            sendBorder();
            gamemsgAll(null, "Times Up! ");

            mafia.compilePhaseStalk("VOTING PHASE " + mafia.time.days);

            var voted = {}, voters = {}, multipliers = {}, player, vote;
            for (var pname in mafia.votes) {
                player = mafia.players[pname];
                var target = mafia.votes[pname];
                // target play have been killed meanwhile by slay
                if (!mafia.isInGame(target)) continue;
                if (!(target in voted)) {
                    voted[target] = 0;
                    voters[target] = [];
                    multipliers[target] = [];
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
                voted[target] += player.extraVote;

                vote = player.role.actions.voteMultiplier;
                if (vote !== undefined) {
                    if (typeof vote === "number") {
                        multipliers[target].push(vote);
                    } else {
                        multipliers[target].push(sys.rand(0, vote.length));
                    }
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
                voted[x] += player.extraVoteshield;
                for (var m in multipliers[x]) {
                    voted[x] *= multipliers[x][m];
                }
                if (voted[x] == maxi) {
                    tie = true;
                } else if (voted[x] > maxi) {
                    tie = false;
                    maxi = voted[x];
                    downed = x;
                }
            }

            if (mafia.theme.noplur && mafia.playerCount()/2 >= maxi) { //Checks if someone actually gets lynched
                tie = true;
                downed = noPlayer;
            }

            if (tie) {
                this.lynchees.push("No one");
                currentStalk.push("Lynched: No one");
                var votetiemsg = maxi > 0 ? mafia.theme.tiedvotemsg : mafia.theme.novotemsg;
                var tiedPlayers = [];
                if (maxi > 0) {
                    for (x in voted) {
                        if (voted[x] == maxi) {
                            tiedPlayers.push(x);
                        }
                    }
                }

                if (mafia.theme.noplur) {
                    votetiemsg = (votetiemsg || "A majority vote was not reached so no one was voted off!").replace(/~Players~/g, readable(tiedPlayers, "and")).replace(/~Count~/g, maxi);
                } else {
                    votetiemsg = (votetiemsg || "No one was voted off!").replace(/~Players~/g, readable(tiedPlayers, "and")).replace(/~Count~/g, maxi) ;
                }
                gamemsgAll(null, votetiemsg);

                mafia.collectedSlay();
                if (mafia.testWin()) {
                    return;
                }
                sendBorder();
            } else {
                this.lynchees.push(downed);
                var lynched = mafia.players[downed];
                currentStalk.push("Lynched: " + lynched.name + " (" + lynched.role.translation + ")");
                if ("lynch" in lynched.role.actions) {
                    //Handled the same, no reason to duplicate code
                    mafia.actionBeforeDeath(lynched, true);
                    //Then we run only lynch things
                    var lyn = lynched.role.actions.lynch;
                    if ("killVoters" in lyn) {
                        var votersList = voters[downed].concat(),
                            r,
                            target;

                        if (votersList.indexOf(downed) !== -1) {
                            votersList.splice(votersList.indexOf(downed), 1);
                        }

                        votersList = getFirstLast(votersList, ("first" in lyn.killVoters ? lyn.killVoters.first : 1), lyn.killVoters.last  || 0, lyn.killVoters.random  || 0);

                        var actionMessage = (lyn.killVoters.message || "±Kill: ~Target~ died for having voted for ~Self~!").replace(/~Self~/g, lynched.name).replace(/~Target~/g, readable(votersList, "and"));
                        if (actionMessage.indexOf(":") === -1) {
                            actionMessage = "±Kill: " + actionMessage;
                        }
                        gamemsgAll(actionMessage);
                        for (r in votersList) {
                            target = votersList[r];
                            if (mafia.isInGame(target)) {
                                mafia.kill(mafia.players[target]);
                            }
                        }
                    }
                    if ("convertVoters" in lyn) {
                        var votersList = voters[downed].concat(),
                            convertList = lyn.convertVoters.newRole,
                            r,
                            target;

                        if (votersList.indexOf(downed) !== -1) {
                            votersList.splice(votersList.indexOf(downed), 1);
                        }
                        votersList = getFirstLast(votersList, ("first" in lyn.convertVoters ? lyn.convertVoters.first : 1), lyn.convertVoters.last  || 0, lyn.convertVoters.random  || 0);

                        for (r in votersList) {
                            target = votersList[r];
                            if (mafia.isInGame(target)) {
                                target = mafia.players[target];

                                var possibleRoles = Object.keys(convertList).shuffle();
                                for (var nr in possibleRoles) {
                                    if (convertList[possibleRoles[nr]].indexOf(target.role.role) != -1) {
                                        mafia.setPlayerRole(target, possibleRoles[nr]);
                                        break;
                                    }
                                }
                            } else {
                                votersList.splice(votersList.indexOf(target), 1);
                            }
                        }
                        if (votersList.length > 0) {
                            var actionMessage = ("message" in lyn.convertVoters ? lyn.convertVoters.message : "~Target~ transformed for having voted for ~Self~!").replace(/~Self~/g, lynched.name).replace(/~Target~/g, readable(votersList, "and"));
                            gamemsgAll(actionMessage);

                            for (r in votersList) {
                                mafia.showOwnRole(sys.id(votersList[r]));
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
                sendBorder();
            }

            if (mafia.theme.closedSetup !== "full") {
                gamemsgAll(mafia.getCurrentRoles() + ".", "±Current Roles", undefined, true);
            }
            mafia.sendCurrentPlayers();

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

                if (!check && mafia.theme.closedSetup !== "full") {
                    gamemsg(player.name, mafia.getRolesForTeamS(side), "±Current Team");
                }
            }

            if (mafia.theme.ticks === undefined || isNaN(mafia.theme.ticks.night) || mafia.theme.ticks.night < 1 || mafia.theme.ticks.night > 60) {
                mafia.ticks = 30;
            } else {
                mafia.ticks = mafia.theme.ticks.night;
            }
            this.eventTimeBoost();

            this.votedByArchive[mafia.time.days] = this.votedBy;

            mafia.time.nights++;
            mafia.state = "night";

            gamemsgAll("Night " + mafia.time.nights, "±Time");
            gamemsgAll(null, "Make your moves, you only have " + mafia.ticks + " seconds! ");
            sendBorder();
            for (var p in mafia.players) {
                var commands = mafia.getCommands(p, mafia.state);
                if (commands !== null) {
                    gamemsg(mafia.players[p].name, commands, undefined, undefined, true);
                }
            }
            mafia.runusersToSlayMsg();
            mafia.usersToSlay = {};
            mafia.resetTargets();
            mafia.compulsoryActions();
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
                gamemsgAll("Theme " + mafia.themeManager.themes[winner.theme].name + " won with " + winner.votes + " votes!");
                gamemsgAll("Type <a href=\"po:send//join\">/Join</a> to enter the game!", undefined, undefined, true);
                sendChanAll("", mafiachan);
                mafia.startGame(null, winner.theme);
                mafia.signups = players[winner.theme];
                mafia.ips = ips[winner.theme];
                mafia.ticks = 40;
                gamemsgAll(mafia.signups.join(", ") + " joined the game!");
                for (var x = 0; x < mafia.signups.length; x++) {
                    if (SESSION.users(sys.id(mafia.signups[x]))) {
                        if (SESSION.users(sys.id(mafia.signups[x])).smute.active && sys.auth(sys.id(mafia.signups[x])) < 1) {
                            mafia.shoveUser(mafiabot.name, mafia.signups[x], true);
                        }
                    }
                    if (mafia.signups[x] in mafia.usersToShove) {
                        var name = mafia.signups[x];
                        var shover = mafia.usersToShove[name];
                        mafia.shoveUser(shover, name, false);
                        delete mafia.usersToShove[name];
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
                var strIntro = "You are a ";
                if (("rolesAreNames" in mafia.theme) && (mafia.theme.rolesAreNames)) {
                    strIntro = "You are ";
                }
                if (typeof role.actions.startup == "object" && typeof role.actions.startup.revealAs == "string") {
                    gamemsg(player.name, strIntro + mafia.theme.trrole(role.actions.startup.revealAs) + "!");
                } else {
                    var startmsg = (role.startupmsg || strIntro + "~Role~!").replace(/~Role~/gi, role.translation).replace(/~Side~/gi, mafia.theme.trside(player.role.side));
                    gamemsg(player.name, startmsg);
                }
                var help = html_escape(role.help).replace(/~Side~/gi, mafia.theme.trside(player.role.side)).replace(/\s(\/[A-Z]+[0-9]*)([^A-Z])/gi, " <a href=\"po:setmsg/$1 \">$1</a>$2");
                gamemsg(player.name, help, undefined, undefined, true);
                var help2msg = (role.help2 || "");
                gamemsg(player.name, help2msg);

                if (role.actions.updateCharges) {
                    var charges = [], e, c;
                    if ("night" in role.actions) {
                        for (e in role.actions.night) {
                            c = mafia.getCharges(player, "night", e);
                            if (c !== undefined && c > 0) {
                                charges.push(c + "x " + cap(e));
                            }
                        }
                    }
                    if ("standby" in role.actions) {
                        for (e in role.actions.standby) {
                            c = mafia.getCharges(player, "standby", e);
                            if (c !== undefined && c > 0) {
                                charges.push(c + "x " + cap(e) + " (Standby)");
                            }
                        }
                    }
                    if (charges.length > 0) {
                        gamemsg(player.name, charges.join(", ") + ". ", "Charges left");
                    }
                }
                if (role.actions.updateVote) {
                    var msg = [];
                    if (player.extraVote !== 0) {
                        msg.push((player.extraVote > 0 ? "+" : "") + player.extraVote + " votes");
                    }
                    if (player.extraVoteshield !== 0) {
                        msg.push((player.extraVoteshield > 0 ? "+" : "") + player.extraVoteshield + " votesshield");
                    }
                    if (msg.length > 0) {
                        gamemsg(player.name, msg.join(", ") + ". ", "Vote modifiers");
                    }
                }

                mafia.showTeammates(player);
            } else {
                gamemsg(name, "You are not in the game!");
            }
        } else {
            gamemsg(name, "No game running!");
        }
    };
    this.showTeammates = function(player) {
        var role = player.role;
        if (role.actions.startup == "team-reveal") {
            gamemsg(player.name, "Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
        }
        if (role.actions.startup == "team-reveal-with-roles" || role.actions.teamUtilities) {
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
                if (list.length > 0) {
                    msg = ("revealPlayersMsg" in role.actions.startup ? role.actions.startup.revealPlayersMsg : msg).replace(/~Players~/g, list);
                    gamemsg(player.name, msg);
                }
            }
        }
    };

    // Auth commands
    this.isMafiaAdmin = function (src) {
        return sys.auth(src) >= 1 || mafia.isMafiaSuperAdmin(src) || script.mafiaAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase());
    };
    this.isMafiaSuperAdmin = function (src) {
        return sys.auth(src) >= 3 || script.mafiaSuperAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase()) || isSuperAdmin(src);
    };

    this.slayUser = function (src, name, delayed) {
        var slayer = typeof src == "string" ? src : sys.name(src);
        if (!mafia.gameInProgress()) {
            msg(src, "The game has not yet started. Use /shove to prevent the player from playing.");
            return;
        }
        name = this.correctCase(name);
        var player = this.players[name];
        if (delayed) {
            if (this.isInGame(name)) {
                role = mafia.usersToSlay[name][1];
                if (role.actions.hasOwnProperty("onDeath")) {
                    if (role.actions.onDeath.onslay) {
                        this.actionBeforeDeath(player);
                    }
                }
                this.removePlayer(player);
                this.onDeadRoles();
                delete this.AWOLusers[player.name];
            }
            return;
        }
        if (this.isInGame(name)) {
            if (name in mafia.usersToSlay) {
                sys.sendMessage(sys.id(slayer), "±Slay: " + player.name + " is already going to be sla" + "\u200b" + "in after the phase ends!", mafiachan);
                return;
            }
            sys.sendAll("±Slay: " + player.name + " will be sla" + "\u200b" + "in by " + slayer + " after the phase ends!", mafiachan);
            var player = this.players[name],
                role = player.role;
            mafia.usersToSlay[name] = [slayer, role];
            return;
        }
        sys.sendMessage(sys.id(slayer), "±Slay: No such target.", mafiachan);
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
        if (!mafia.gameInProgress()) {
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
                if (src) {
                    msg(src, name + " is already going to be shoved if they attempt to join!");
                }
                return;
            }
            this.usersToShove[name] = shover;
            if (src) {
                msg(src, "Your target " + name + " will be shoved if they attempt to join!");
            }
        } else {
            msg(src, "A game is currently in progress. Use /slay to remove the player.");
        }
    };
    this.warnUser = function (src, commandData) { // /warn [target]:[rule]:[pts]:[comments]:[shove]
        var warner = typeof src == "string" ? src : sys.name(src);
        var cmd = commandData.split(":");
        var name = cmd[0].toLowerCase();
        var rule = cmd[1];
        if (commandData === "*") {
            gamemsg(src, "Syntax is /warn <user>:<rule>:<duration>:<comments>:<shove>.");
            return;
        } else if (sys.dbIp(name) === undefined) {
            gamemsg(src, "That user does not exist!");
            return;
        } else if (rule === undefined) {
            gamemsg(src,"Please specify a rule that has been violated.");
            return;
        }
        var pts = cmd[2];
        var comments = cmd[3];
        var shove = cmd[4];
        if ((pts === undefined) && (rule.toLowerCase() in this.defaultWarningPoints)) {
            pts = this.defaultWarningPoints[rule];
            rule = cap(rule);
        }
        if (isNaN(pts)) {
            gamemsg(src,"Please specify an amount of warning points.");
            return;
        }
        if (pts <= 0) {
            pts = 1;
        }
        this.clearOldWarnings( name );
        var expirationTime = ((new Date()).getTime() + (timeForWarningErase * pts) );
        if (typeof mafia.warningLog[name] !== "object") {
            mafia.warningLog[name] = {};
        }
        mafia.warningLog[name][expirationTime] = [warner,rule,comments];
        dualBroadcast("±" + mafiabot.name + ": " + name + " was warned for " + rule + " by " + nonFlashing(warner) + ".");
        if ((shove === "shove") || (shove === "true")) {
            this.shoveUser(src,name);
        }
    };
    this.clearOldWarnings = function( name ) {
        if (!(name in mafia.warningLog)) {
            mafia.warningLog[name] = {};
            return;
        }
        for (var n in mafia.warningLog[name]) {
            if (n < (new Date()).getTime()) {
                delete mafia.warningLog[name][n];
            }
        }
    };
    this.checkWarns = function (src, commandData) {
        //var warner = typeof src == "string" ? src : sys.name(src);
        commandData = commandData.toLowerCase();
        this.clearOldWarnings( commandData );
        gamemsg(src, "*** Warnings for " + commandData); // otherwise messages are the same as an actual warn
        var hasWarns;
        for (var v in mafia.warningLog[commandData]) {
            var inst = mafia.warningLog[commandData][v];
            var msg = (commandData + " was warned by " + inst[0] + " for " + inst[1] + ".");
            if (inst[2] !== undefined) {
                msg += " (Comments: " + inst[2] + ")";
            }
            gamemsg(src, msg);
            hasWarns = true;
        }
        if (!hasWarns) {
            gamemsg(src, commandData + " has no standing rule violations.");
        }
    };
    this.myWarns = function (src ) {
        var name = typeof src == "string" ? src : sys.name(src);
        name = name.toLowerCase();
        this.clearOldWarnings( name );
        var hasWarns, msg;
        for (var v in mafia.warningLog[name]) {
            var inst = mafia.warningLog[name][v];
            msg = ("You have a warning for " + inst[1] + ".");
            gamemsg(src,msg);
            hasWarns = true;
        }
        if (!hasWarns) gamemsg(src,"You have no standing rule violations!");
    };
    this.possibleBotquote = function (mess) {
        var taboo = ["±Kill:", "±Game:", "±Info:", "±Murkrow:", "±Hint:"];
        if (("theme" in mafia) && (mafia.theme !== undefined)) {
            if ("bot" in mafia.theme && "name" in mafia.theme.bot) {
                taboo.push("±" + mafia.theme.bot.name + ":");
            }
        }
        for (var t = 0; t < taboo.length; t++) {
            if (mess.indexOf(taboo[t]) !== -1) {
                return true;
            }
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
            peak = !enable;
            deadTime = (enable ? timesBeforeNonPeak : 0);
        } else {
            if (src) {
                msg(src, "No non-peak themes found");
            }
        }
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

        var botNames = ["Kill", "Slay", "Game", "Murkrow", "Rule", "Rules", "Hint", "Dratini", "Exploud", "Blaziken", "Chatot"];
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
            return false;
        }
        if (this.invalidName(src)) {
            return false;
        }
        if (this.ips.indexOf(sys.ip(src)) != -1) {
            gamemsg(user, "This IP is already in list. You cannot register two times!");
            return false;
        }
        if (this.numjoins[sys.ip(src)] >= 2) {
            gamemsg(user, "You can't join/unjoin more than 3 times!");
            return false;
        }
        if (SESSION.users(src).mute.active) {
            gamemsg(user, "You are muted!");
            return false;
        }
        if (!sys.dbRegistered(sys.name(src))) {
            gamemsg(user, "You need to register to play mafia here! Click on the 'Register' button below and follow the instructions!");
            return false;
        }
        return true;
    };

    this.addPhaseStalkAction = function (user, action, target, after, redir) {
        if (after !== "*" && after !== undefined) {
            after = ":" + after;
        } else {
            after = "";
        }
        if (redir !== "*" && redir !== undefined) {
            redir = "@" + redir;
        } else {
            redir = "";
        }
        if (!(user in phaseStalk)) phaseStalk[user] = [];
        phaseStalk[user].push("/" + action + " " + target + after + redir);
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

    this.inputNightCommand = function(name, command, commandData, afterCommandData, redirectData) {
        if (afterCommandData === undefined) {
            afterCommandData = "*";
        }
        if (redirectData === undefined) {
            redirectData = "*";
        }
        if (!this.isInGame(commandData) && this.isInGame(decodeURIComponent(commandData))) {
            commandData = decodeURIComponent(commandData); // HTML links for player names changes > to %3E; this changes %3E back to >
        }
        commandData = this.correctCase(commandData);
        var player = mafia.players[name];
        if (commandData == '*' && ["OnlySelf"].indexOf(player.role.actions.night[command].target) !== -1) {
            commandData = name;
        }
        if (!this.isInGame(commandData)) {
            gamemsg(name, "That person is not playing!", "±Hint");
            return;
        }
        var target = mafia.players[commandData];
        var canTarget = player.role.actions.night[command].target;

        this.addPhaseStalkAction(name, command, target.name, afterCommandData, redirectData);

        if (["Any", "Self", "OnlySelf", "OnlyTeam"].indexOf(canTarget) == -1 && commandData == name) {
            gamemsg(name, "Nope, this wont work... You can't target yourself!", "±Hint");
            return;
        } else if (canTarget == "OnlySelf" && commandData != name) {
            gamemsg(name, "You can only use this action on yourself!", "±Hint");
            return;
        } else if (canTarget == 'AnyButTeam' && player.role.side == target.role.side
         || canTarget == 'AnyButRole' && player.role.role == target.role.role) {
            gamemsg(name, "Nope, this wont work... You can't target your partners!", "±Hint");
            return;
        } else if ((canTarget == "OnlyTeammates" && player == target)
         || (["OnlyTeam", "OnlyTeammates"].indexOf(canTarget) !== -1 && player.role.side != target.role.side)) {
            gamemsg(name, "You can only use this action on your teammates!", "±Hint");
            return;
        }

        var recharge = mafia.getRecharge(player, "night", command);
        if (recharge !== undefined && recharge > 0) {
            gamemsg(name, "You cannot use this action for " + recharge + " night(s)!");
            return;
        }
        var charges = mafia.getCharges(player, "night", command);
        if (charges !== undefined && charges === 0) {
            gamemsg(name, "You are out of uses for this action!");
            return;
        }
        if ((player.restrictions.indexOf(command) != -1) || (this.roleRestrictions[player.role.role] && this.roleRestrictions[player.role.role].indexOf(command) != -1) || (this.teamRestrictions[player.role.side] && this.teamRestrictions[player.role.side].indexOf(command) != -1)) {
            gamemsg(name, "You cannot use this action during this night!");
            return;
        }

        var pinpoint = "pinpoint" in player.role.actions.night[command] ? player.role.actions.night[command].pinpoint : false;
        if (pinpoint) {
            var isRoleInTheme = false;
            if (afterCommandData !== "*") {
                for (var roleName in mafia.theme.roles) {
                    if (mafia.theme.roles[roleName].translation.toLowerCase() === afterCommandData.toLowerCase()) {
                        isRoleInTheme = true;
                        afterCommandData = mafia.theme.roles[roleName].translation;
                        break;
                        }
                    }
                }
            if (!isRoleInTheme) {
                gamemsg(name, "Please supply a valid role name! The format is /" + command + ' [name]:[role name].' );
                return;
            }
            var prevTarget = mafia.getTargetsFor(player,command);
            for (var t in prevTarget) {
                var inputTarget = delimSplit(":", prevTarget[t]);
                var guessedRole = inputTarget[1];
                guessedRole = delimSplit("@", guessedRole)[0];
                if (guessedRole === afterCommandData) {
                    gamemsg(name, "You already used this command (" + command + ") on " + afterCommandData + " (you can only target each role once!)." );
                    return;
                }
            }
        }
        var redi = command === "redirect";
        if (("command" in player.role.actions.night[command]) && (player.role.actions.night[command].command === "redirect")) {
            redi = true;
        }
        if (("command" in player.role.actions.night[command]) && (Array.isArray(player.role.actions.night[command].command)) && (player.role.actions.night[command].command.indexOf("redirect") !== -1)) {
            redi = true;
        }

        if (redi) {
            var redirectTarget = player.role.actions.night[command].redirectTarget;
            redirectData = this.correctCase(redirectData);
            if ((redirectData !== commandData) && (redirectTarget=== "OnlyTarget")) {
                if (redirectData === "*") {
                    redirectData = commandData;
                } else {
                    gamemsg(name, "Nope, you can only redirect a target onto themselves!");
                    return;
                }
            }
            if ((redirectData !== player.name) && (redirectTarget=== "OnlySelf")) {
                if (redirectData === "*") {
                    redirectData = player.name;
                } else {
                    gamemsg(name, "Nope, you can only redirect a target onto yourself!");
                    return;
                }
            }
            if (redirectData === "*") {
                gamemsg(name, "Please supply a target for redirect! The syntax is /" + command + " [target]@[redirectTarget]!");
                return;
            }
            if (!(redirectData in this.players)) {
                gamemsg(name, "Please choose a valid target for redirect! The syntax is /" + command + " [target]@[redirectTarget]!");
                return;
            }
            if ((redirectData === commandData) && ((redirectTarget=== "AnyButTarget") || (redirectTarget === "OnlySelf"))) {
                gamemsg(name, "Nope, you can't redirect a target onto themselves!");
                return;
            }
            if ((redirectData === player.name) && ((redirectTarget=== "AnyButSelf") || (redirectTarget === "OnlyTarget"))) {
                gamemsg(name, "Nope, you can't redirect a target onto yourself!");
                return;
            }
        }

        var inputmsg = "inputmsg" in player.role.actions.night[command] ? player.role.actions.night[command].inputmsg : "You have chosen to ~Action~ ~Target~!";
        gamemsg(name, inputmsg.replace(/~Action~/g, command).replace(/~Self~/g, name).replace(/~Target~/g, commandData).replace(/~GuessedRole~/g, afterCommandData));

        this.setTarget(player, target, command, afterCommandData, redirectData);
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
            for (var x in team) {
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

        if (!(command in player.haxCount)) {
            player.haxCount[command] = 0;
        }
        player.haxCount[command] += 1;
        if ("maxHax" in player.role.actions.night[command] && player.haxCount[command] > player.role.actions.night[command].maxHax) {
            return;
        }

        var haxMultiplier = player.role.actions.night[command].haxMultiplier || 1;
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
                var haxObj = mafia.theme.roles[role].actions.hax;
                if (r < haxObj[command].revealTeam * haxMultiplier) {
                    if (team.length > 1) {
                        gamemsg(haxPlayer, "The " + roleName + " are going to " + command + " " + commandData + "!");
                    } else {
                        gamemsg(haxPlayer, "The " + roleName + " is going to " + command + " " + commandData + "!");
                    }
                    haxTypes.push("revealTeam");
                }
                if (r < haxObj[command].revealPlayer * haxMultiplier) {
                    if (team.length > 1) {
                        gamemsg(haxPlayer, name + " is one of The " + roleName + "!");
                    } else {
                        gamemsg(haxPlayer, name + " is The " + roleName + "!");
                    }
                    haxTypes.push("revealPlayer");
                }
                if (r < haxObj[command].revealRole * haxMultiplier) {
                    gamemsg(haxPlayer, name + " is " + playerRole + "!");
                    haxTypes.push("revealRole");
                }
                if (r < haxObj[command].revealTarget * haxMultiplier) {
                    gamemsg(haxPlayer, commandData + " is being targeted by " + an(command) + "!");
                    haxTypes.push("revealTarget");
                }
                for (var k in haxObj[command]) {
                    if (["revealTeam", "revealPlayer", "revealRole", "revealTarget"].indexOf(k) == -1 && r < haxObj[command][k]) {
                        gamemsg(haxPlayer, k.replace(/~Player~/g, name).replace(/~Role~/g, playerRole).replace(/~Side~/g, roleName).replace(/~Action~/g, command).replace(/~Target~/g, commandData).replace(/~TargetRole~/g, mafia.players[commandData].role.translation).replace(/~TargetSide~/g, this.theme.trside(mafia.players[commandData].role.side)));
                        haxTypes.push("custom");
                    }
                }
                if (haxTypes.length > 0) {
                    haxers.push(haxPlayer + " [" + haxTypes.join("/") + "]");
                }
            }
        }

        if (haxers.length > 0) {
            this.addPhaseStalkHax(name, command, target.name, haxers);
        }
    };

    this.commands = {
        user: ["/mafiaadmins: To get a list of current Mafia Admins.",
            "/start: Starts a Game of Mafia with specified theme. Can also use /starttheme.",
            "/vote: Start voting for a new game theme or vote! Can also use /votetheme.",
            "/join: To join a Mafia game.",
            "/unjoin: To unjoin a Mafia game during signups.",
            "/help: For info on how to win in a game.",
            "/mywarns: To check your criminal record.",
            "/roles: For info on all the Roles in the game. Can also use \"/roles :<string>\" to list all roles with <string> in their role name.",
            "/sides: For info on all teams in the game.",
            "/myrole: To view again your role, help text and teammates.",
            "/mafiarules: To see the Rules for the Game.",
            "/themes: To view installed themes.",
            "/themeinfo: To view installed themes (more details).",
            "/changelog: To view a theme's changelog (if it has one).",
            "/tips: To view a tips for a theme (if available).",
            "/details: To view info about a specific theme.",
            "/priority: To view the priority list of a theme. ",
            "/whisper: To send a private message to another user in the game. Also /w.",
            "/votecount: To see who has been voted. Can also use /vc. To check a specific user, use /votecount <player>. To check a specific day, use /votecount <player>:<day> or /votecount :<day>.",
            "/spawn: To view the spawn list of a theme. To see a specific size, use \"/spawn <theme>:<number>\".",
            "/flashme: To get a alert when a new mafia game starts. Type /flashme help for more info.",
            "/playedgames: To view recently played games. Can also use /pg.",
            "/topthemes: To view top themes. Default amount is 10, however other numbers can be used (higher numbers may cause lag).",
            "/windata: To view the win data of a theme.",
            "/update: To update a Mafia Theme. /update themename::newurl if changing the url. Contact an sMA if the theme name is changed to prevent conflicts.",
            "/featured: To view the currently featured Mafia Theme and/or Text.",
            "/disable: To disable a Mafia Theme. Only the Theme Author or an MA can disable a theme.",
            "/disabledc: To opt out of dead chat for the current game only. Use /enabledc to re-enable.",
            "/seedisabled: Lists all disabled themes (excluding non-peak).",
            "/nonpeaks: Lists all non-peak themes. Also states the status of non-peak themes as a whole."],
        ma: ["/slay: To slay users in a Mafia game. Use /unslay to cancel.",
            "/shove: To remove users before a game starts. Use /unshove to cancel.",
            "/warn: To warn a user for violation of a rule. Syntax is /warn <user>:<rule>:<duration>:<comments>:<shove>.",
            "/warnlog: To check relevant warnings for a user. Consider this record before banning.",
            "/mafiaban: To ban a user from the Mafia channel, format /mafiaban user:reason:time",
            "/mafiaunban: To unban a user from the Mafia channel.",
            "/mafiabans: To search the mafiabanlist for a string, shows full list if no search term is entered.",
            "/end: To end a Mafia game.",
            "/say: To bypass Dead Chat and/or talk normally to the channel.",
            "/readlog X: To read the log of actions from game X games ago.",
            "/targetlog X: To read the log of Turn 1 actions from the previous X games.",
            "/passma: To give your Mafia Admin powers to an alt of yours.",
            "/add: To add a Mafia Theme.",
            "/enable: To enable a previously disabled Mafia Theme.",
            "/enablenonpeak: To enable all non-peak Mafia Themes. Disable with /disablenonpeak.",
            "/disableunder X: Disables all themes that support less than X players. (X must be over 30). You will need to manually re-enable."],
        sma: ["/push: To force a user into the current theme during sign ups.",
            "/supdate: To silently add or update a theme.",
            "/remove: To remove a Mafia Theme! Use /sremove for a silent removal.",
            "/mafiaadmin: To promote a user to Mafia Admin. Use /smafiaadmin for a silent promotion.",
            "/mafiaadminoff: To strip a user of all Mafia authority. Use /smafiaadminoff for a silent demotion.",
            "/updateafter: To update mafia after current game!",
            "/updatestats: To update the mafia stats webpage. Use after mafiastat script changes.",
            "/featuretheme: To change the currently featured theme. Leave blank to disable Feature Themes.",
            "/featuretext: To set a customizable message that follows the Featured theme. Leave blank to reset to default.",
            "/featurelink: To change the link used for Featured Theme Text. Leave blank to clear.",
            "/featureint: To change how often the \"Featured Theme\" message displays. Time is in minutes between 30 and 240. Leave blank to reset to 60 minutes.",
            "/forcefeature: To force the \"Featured Theme\" message to display.",
            "/enableall: Enables all disabled themes, excluding non-peak."],
        owner: ["/mafiasuperadmin: To promote a user to Super Mafia Admin. Use /smafiasuperadmin for a silent promotion.",
            "/mafiasuperadminoff: To demote a user from Super Mafia Admin. Use /smafiasuperadminoff for a silent demotion."]
    };
    this.handleCommand = function (src, message, channel) {
        var command;
        var commandData = '*';
        var pos = message.indexOf(" ");
        if (pos != -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (channel != mafiachan) {
            if (["mafiabans", "mafiaadmins", "madmins", "mas", "roles", "priority", "spawn", "sides", "themeinfo", "readlog", "targetlog", "mafiarules", "passma", "windata", "topthemes", "playedgames", "pg"].indexOf(command) === -1) {
                if (channel == staffchannel || channel == sachannel) {
                    if (["mafiaban", "mafiaunban", "disable", "enable", "enablenonpeak", "disablenonpeak", "mafiaadminoff", "mafiaadmin", "mafiasadmin", "mafiasuperadmin", "mafiasuperadminoff", "smafiaadmin", "smafiasuperadmin", "smafiaadminoff", "smafiasuperadminoff", "updatestats", "themes"].indexOf(command) === -1) {
                        return;
                    }
                } else {
                    return;
                }
            }
        }
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
                if (!this.canJoin(src)) {
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
                if (SESSION.users(src).smute.active && sys.auth(src) < 1) {
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
                var newData = delimSplit("@", commandData);
                var redirectData = newData[1];
                commandData = newData[0];
                newData = delimSplit(":", commandData);
                commandData = newData[0];
                var afterCommandData = newData[1];
                mafia.inputNightCommand(name, command, commandData, afterCommandData, redirectData);
                return;
            }
        }
        else if (this.state == "day") {
            if (this.isInGame(sys.name(src)) && command == "vote") {
                if (!this.isInGame(commandData) && this.isInGame(decodeURIComponent(commandData))) {
                    commandData = decodeURIComponent(commandData); // HTML links for player names changes > to %3E; this changes %3E back to >
                }
                commandData = this.correctCase(commandData);
                mafia.voteForPlayer(src, commandData, false);
                return;
            }
            if (this.isInGame(sys.name(src)) && command == "teamvote") {
                if (!this.isInGame(commandData) && this.isInGame(decodeURIComponent(commandData))) {
                    commandData = decodeURIComponent(commandData); // HTML links for player names changes > to %3E; this changes %3E back to >
                }
                commandData = this.correctCase(commandData);
                mafia.voteForPlayer(src, commandData, true);
                return;
            }
        }
        else if (mafia.state == "standby") {
            name = sys.name(src);
            if (this.isInGame(name) && this.hasCommand(name, command, "standby")) {
                player = mafia.players[name];
                if (!this.isInGame(commandData) && this.isInGame(decodeURIComponent(commandData))) {
                    commandData = decodeURIComponent(commandData); // HTML links for player names changes > to %3E; this changes %3E back to >
                }
                commandData = this.correctCase(commandData);
                target = commandData != noPlayer ? mafia.players[commandData] : null;
                var commandObject = player.role.actions.standby[command];
                var commandName = command;
                var tRole, tSide;
                if (commandObject.hasOwnProperty("command"))
                    command = commandObject.command;

                if (target !== null) {
                    if ((commandObject.target === undefined || ["Self", "Any", "OnlySelf", "OnlyTeam"].indexOf(commandObject.target) == -1) && player == target) {
                        gamemsg(srcname, "Nope, this wont work... You can't target yourself!", "±Hint");
                        return;
                    } else if (commandObject.target == 'AnyButTeam' && player.role.side == target.role.side
                        || commandObject.target == 'AnyButRole' && player.role.role == target.role.role) {
                        gamemsg(srcname, "Nope, this wont work... You can't target your partners!", "±Hint");
                        return;
                    } else if (commandObject.target == "OnlySelf" && target != player) {
                        gamemsg(srcname, "You can only use this action on yourself!", "±Hint");
                        return;
                    } else if ((commandObject.target == "OnlyTeammates" && player == target)
                     || (["OnlyTeam", "OnlyTeammates"].indexOf(commandObject.target) !== -1 && player.role.side != target.role.side)) {
                        gamemsg(name, "You can only use this action on your teammates!", "±Hint");
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
                        if (!mafia.isInGame(player.name)){
                            return;
                        }
                        var charge = mafia.getCharges(player, "standby", commandName);
                        var chargetxt = (action.chargesmsg || "You have ~Charges~ charges remaining").replace(/~Charges~/g, charge);
                        gamemsg(player.name, chargetxt);
                    }
                };

                var convertTo = function(player, target, Action) {
                    if ("canConvert" in Action && Action.canConvert != "*" && Action.canConvert.indexOf(target.role.role) == -1) {
                        return;
                    }
                    var oldRole = target.role, newRole;
                    if (typeof Action.newRole == "object") {
                        if ("random" in Action.newRole && !Array.isArray(Action.newRole.random) && typeof Action.newRole.random === "object" && Action.newRole.random !== null) {
                            newRole = randomSample(Action.newRole.random);
                        } else {
                            var possibleRoles = Object.keys(Action.newRole).shuffle();
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
                        return;
                    } else {
                        mafia.setPlayerRole(target, newRole);
                        if (!Action.silent) {
                            var allmsg = ("convertmsg" in Action ? Action.convertmsg : "A ~Old~ has been converted into a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation).replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Role~/g, player.role.translation);
                            gamemsgAll(allmsg);
                        }

                        if (target !== player) {
                            pmsg = ("convertusermsg" in Action ? Action.convertusermsg : "Your target (~Target~) has been converted and is now a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation).replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Role~/g, player.role.translation);
                            gamemsg(player.name, pmsg);
                        }

                        if (!Action.silentConvert) {
                            var tarmsg = ("tarmsg" in Action ? Action.tarmsg : "You have been converted and changed roles!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, target.role.translation).replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~Role~/g, player.role.translation);
                            gamemsg(target.name, tarmsg);
                            mafia.showOwnRole(sys.id(target.name));
                        }
                    }
                };
                var copyAs = function(player, target, Action) {
                    if (typeof Action.copyAs == "string" && "canCopy" in Action && Action.canCopy != "*" && Action.canCopy.indexOf(target.role.role) == -1) {
                        return;
                    } else {
                        var oldRole = player.role, newRole = null;
                        if (typeof Action.copyAs == "object") {
                            var possibleRoles = Object.keys(Action.copyAs).shuffle();
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
                            return;
                        } else {
                            mafia.setPlayerRole(player, newRole);
                            if (!Action.silent) {
                                var allmsg = ("copymsg" in Action ? Action.copymsg : "A ~Old~ has been converted into a ~New~!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, player.role.translation).replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~TargetRole~/g, target.role.translation);
                                gamemsgAll(allmsg);
                            }
                            if (!Action.silentCopy) {
                                var pmsg = ("copyusermsg" in Action ? Action.copyusermsg : "You copied someone and changed roles!").replace(/~Old~/g, oldRole.translation).replace(/~New~/g, player.role.translation).replace(/~Self~/g, player.name).replace(/~Target~/g, target.name).replace(/~TargetRole~/g, target.role.translation);
                                gamemsg(player.name, pmsg);
                                mafia.showOwnRole(sys.id(player.name));
                            }
                        }
                    }
                };
                var massConvert = function(player, Action) {
                    var convertRoles = Action.convertRoles, nr, k, singleAffected = [], affected, newRole, targetPlayers, convertedPlayer, newRole;
                    for (nr in convertRoles) {
                        targetPlayers = mafia.getPlayersForRole(nr);
                        newRole = convertRoles[nr];
                        affected = [];
                        for (k in targetPlayers) {
                            affected.push(targetPlayers[k]);
                            convertedPlayer = mafia.players[targetPlayers[k]];
                            mafia.setPlayerRole(convertedPlayer, newRole);
                            if (!Action.silentMassConvert) {
                                mafia.showOwnRole(sys.id(targetPlayers[k]));
                            }
                        }
                        if (affected.length > 0 && !Action.silent) {
                            if ("singlemassconvertmsg" in Action) {
                                singleAffected = singleAffected.concat(affected);
                            } else {
                                var actionMessage = ("massconvertmsg" in Action ? Action.massconvertmsg : "The ~Old~ became a ~New~!").replace(/~Self~/g, player.name).replace(/~Target~/g, readable(affected, "and")).replace(/~Old~/g, mafia.theme.trrole(nr)).replace(/~New~/g, mafia.theme.trrole(newRole)).replace(/~Number~/g, affected.length);
                                gamemsgAll(actionMessage);
                            }
                        }
                    }
                    if (singleAffected.length > 0) {
                        gamemsgAll(Action.singlemassconvertmsg.replace(/~Self~/g, player.name).replace(/~Target~/g, readable(singleAffected, "and")).replace(/~Number~/g, singleAffected.length));
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
                    tRole = target.role.translation;
                    tSide = mafia.theme.trside(target.role.side);
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
                        } else if (typeof target.role.actions.daykill.mode == "object" && "evadeCharges" in target.role.actions.daykill.mode && target.evadeCharges.daykill > 0) {
                            var targetMode = target.role.actions.daykill;

                            player.dayKill = player.dayKill + 1 || 1;
                            target.evadeCharges.daykill--;

                            if (!targetMode.silent) {
                                var pmsg = ("msg" in targetMode ? targetMode.msg : "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = ("targetmsg" in targetMode ? targetMode.targetmsg : "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
                                gamemsg(player.name, pmsg);
                                gamemsg(target.name, tmsg);
                                gamemsg(target.name, "You can still evade " + target.evadeCharges.daykill + " more time(s)!");
                                return;
                            }
                            return;
                        } else if (typeof target.role.actions.daykill.mode == "object" && "ignore" in target.role.actions.daykill.mode && target.role.actions.daykill.mode.ignore.indexOf(player.role.role) != -1) {
                            var targetMode = target.role.actions.daykill;
                            if (targetMode.expend) {
                                player.dayKill = player.dayKill + 1 || 1;
                            }
                            if (!targetMode.silent) {
                                var pmsg = ("msg" in targetMode ? targetMode.msg : "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = ("targetmsg" in targetMode ? targetMode.targetmsg : "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
                                gamemsg(player.name, pmsg);
                                gamemsg(target.name, tmsg);
                                return;
                            }
                            return;
                        } else if (typeof target.role.actions.daykill.mode == "object" && "ignoreChance" in target.role.actions.daykill.mode) {
                            var attackerRole = player.role.role;
                            var evChance = 0;
                            for (var ignoreNumber in target.role.actions.daykill.mode.ignoreChance) {
                                var rr = target.role.actions.daykill.mode.ignoreChance[ignoreNumber];
                                if (rr.indexOf(attackerRole) != -1) {
                                    evChance = ignoreNumber;
                                    break;
                                }
                            }
                            if (evChance > sys.rand(0, 100) / 100) {
                                var targetMode = target.role.actions.daykill;
                                var pmsg = ("msg" in targetMode ? targetMode.msg : "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = ("targetmsg" in targetMode ? targetMode.targetmsg : "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
                                gamemsg(player.name, pmsg);
                                gamemsg(target.name, tmsg);
                                return;
                            }
                        }

                    }
                    sendBorder();
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
                        if ("copyAs" in commandObject) {
                            copyAs(player, target, commandObject);
                        }
                        if ("newRole" in commandObject) {
                            convertTo(player, target, commandObject);
                        }
                        if ("convertRoles" in commandObject) {
                            massConvert(player, commandObject);
                        }
                        if (sys.id('PolkaBot') !== undefined) {
                            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+target.name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[commandData]);
                    } else {
                        var rmsg = (target.role.actions.daykillrevengemsg ||
                        "~Target~ tries to attack ~Self~, but ~Self~ fights back and kills ~Target~!").replace(/~Self~/g, commandData).replace(/~Role~/g, mafia.players[commandData].role).replace(/~Target~/g, name).replace(/~TargetRole~/g,mafia.players[name].role.translation);
                        gamemsgAll(rmsg);

                        if ("copyAs" in commandObject) {
                            copyAs(player, target, commandObject);
                        }
                        if ("newRole" in commandObject) {
                            convertTo(player, target, commandObject);
                        }
                        if ("convertRoles" in commandObject) {
                            massConvert(player, commandObject);
                        }

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
                    sendBorder();
                } else if (command == "reveal") {
                    if (player.revealUse >= (commandObject.limit || 1)) {
                        gamemsg(srcname, "You already used this command!");
                        return;
                    }
                    tRole = player.role.translation;
                    tSide = mafia.theme.trside(player.role.side);
                    var revealMessage = (commandObject.revealmsg || "~Self~ is revealed to be a ~Role~!").replace(/~Self~/g, name).replace(/~Role~/g, player.role.translation);
                    sendBorder();
                    gamemsgAll(revealMessage);
                    if ("newRole" in commandObject) {
                        convertTo(player, player, commandObject);
                    }
                    if ("convertRoles" in commandObject) {
                        massConvert(player, commandObject);
                    }
                    sendBorder();
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
                    tRole = target.role.translation;
                    tSide = mafia.theme.trside(target.role.side);
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
                        } else if (typeof target.role.actions.expose.mode == "object" && "evadeCharges" in target.role.actions.expose.mode && target.evadeCharges.expose > 0) {
                            var targetMode = target.role.actions.expose;

                            player.exposeUse = player.exposeUse + 1 || 1;
                            target.evadeCharges.expose--;

                            if (!targetMode.silent) {
                                var pmsg = ("msg" in targetMode ? targetMode.msg : "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = ("targetmsg" in targetMode ? targetMode.targetmsg : "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
                                gamemsg(player.name, pmsg);
                                gamemsg(target.name, tmsg);
                                gamemsg(target.name, "You can still evade " + target.evadeCharges.expose + " more time(s)!");
                                return;
                            }
                            return;
                        }else if (typeof target.role.actions.expose.mode == "object" && "ignore" in target.role.actions.expose.mode && target.role.actions.expose.mode.ignore.indexOf(player.role.role) != -1) {
                            var targetMode = target.role.actions.expose;
                            if (targetMode.expend) {
                                player.exposeUse = player.exposeUse + 1 || 1;
                            }
                            if (!targetMode.silent) {
                                var pmsg = ("msg" in targetMode ? targetMode.msg : "Your target (~Target~) evaded your ~Action~!").replace(/~Target~/g, target.name).replace(/~Role~/g, target.role.translation).replace(/~Action~/g, commandName);
                                var tmsg = ("targetmsg" in targetMode ? targetMode.targetmsg : "You evaded a ~Action~!").replace(/~Self~/g, player.name).replace(/~Role~/g, player.role.translation).replace(/~Action~/g, commandName);
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
                    if (target.disguiseRole !== undefined) {
                        revealedRole = mafia.theme.trrole(target.disguiseRole);
                    } else if (inspectMode.revealAs !== undefined) {
                        revealedRole = mafia.theme.trrole(this.revealAsRole(inspectMode.revealAs, target.role, mafia.players[name].role.role));
                    } else {
                        revealedRole = target.role.translation;
                    }
                    if (typeof inspectMode.seenSide == "string" && inspectMode.seenSide in mafia.theme.sideTranslations) {
                        revealedSide = mafia.theme.trside(inspectMode.seenSide);
                    } else {
                        revealedSide = mafia.theme.trside(target.role.side);
                    }
                    sendBorder();
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
                            if ("copyAs" in commandObject) {
                                copyAs(player, target, commandObject);
                            }
                            if ("newRole" in commandObject) {
                                convertTo(player, target, commandObject);
                            }
                            if ("convertRoles" in commandObject) {
                                massConvert(player, commandObject);
                            }
                            this.kill(mafia.players[commandData]);
                            if (sys.id('PolkaBot') !== undefined) {
                                sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+commandData+" DIED", mafiachan);
                            }
                        } else {
                            if ("copyAs" in commandObject) {
                                copyAs(player, target, commandObject);
                            }
                            if ("newRole" in commandObject) {
                                convertTo(player, target, commandObject);
                            }
                            if ("convertRoles" in commandObject) {
                                massConvert(player, commandObject);
                            }
                        }
                        player.exposeUse = player.exposeUse + 1 || 1;

                    } else {
                        var ermsg = (target.role.actions.exposerevengemsg || "~Target~ (~Role~) tries to expose, but their target gets startled and kills them in retaliation!").replace(/~Self~/g, commandData).replace(/~Target~/g, name).replace(/~Role~/g, player.role.translation);
                        gamemsgAll(ermsg);

                        if ("copyAs" in commandObject) {
                            copyAs(player, target, commandObject);
                        }
                        if ("newRole" in commandObject) {
                            convertTo(player, target, commandObject);
                        }
                        if ("convertRoles" in commandObject) {
                            massConvert(player, commandObject);
                        }

                        if (sys.id('PolkaBot') !== undefined) {
                            sys.sendMessage(sys.id('PolkaBot'), "±Luxray: "+name+" DIED", mafiachan);
                        }
                        this.kill(mafia.players[name]);
                    }

                    if ("exposedtargetmsg" in commandObject && typeof commandObject.exposedtargetmsg == "string") {
                        gamemsg(srcname, exposeTargetMessage.replace(/~Role~/g, revealedRole).replace(/~Target~/g, commandData));
                    }
                    sendBorder();
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
                        var haxObj = mafia.theme.roles[role].actions.standbyHax;
                        if (r < haxObj[commandName].revealTeam) {
                            gamemsg(haxPlayer, "The " + roleName + " used " + commandName + " on " + commandData + "!");
                            haxTypes.push("revealTeam");
                        }
                        if (r < haxObj[commandName].revealPlayer) {
                            if (team.length > 1) {
                                gamemsg(haxPlayer, name + " is one of The " + roleName + "!");
                            } else {
                                gamemsg(haxPlayer, name + " is The " + roleName + "!");
                            }
                            haxTypes.push("revealPlayer");
                        }
                        if (r < haxObj[commandName].revealRole) {
                            gamemsg(haxPlayer, name + " is " + playerRole + "!");
                            haxTypes.push("revealRole");
                        }
                        for (var k in haxObj[command]) {
                            if (["revealTeam", "revealPlayer", "revealRole"].indexOf(k) == -1 && r < haxObj[command][k]) {
                                gamemsg(haxPlayer, k.replace(/~Player~/g, name).replace(/~Role~/g, playerRole).replace(/~Side~/g, roleName).replace(/~Action~/g, command).replace(/~Target~/g, commandData).replace(/~TargetRole~/g, tRole).replace(/~TargetSide~/g, tSide));
                                haxTypes.push("custom");
                            }
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
        var messageInfo;
        if (this.isInGame(sys.name(src)) && (command == "votecount" || command == "vc")) {
            if (mafia.theme.silentVote && mafia.theme.silentVote) {
                gamemsg(sys.name(src),"Vote count is disabled for this theme!");
                return;
            }
            messageInfo = delimSplit(":", commandData);
            mafia.showVoteCount(sys.name(src), messageInfo);
            return;
        }
        if (this.isInGame(sys.name(src)) && (command == "whisper" || command == "w")) {
            messageInfo = delimSplit(":", commandData);
            messageInfo[0] = this.correctCase(messageInfo[0]);
            if (!(this.isInGame(messageInfo[0]))) {
                gamemsg(sys.name(src),"You can't whisper to someone who isn't in the game!");
                return;
            }
            mafia.whisperMessage(sys.name(src), messageInfo);
            return;
        }
        if (command === "tt" || command === "teamtalk") {
            if (mafia.isInGame(sys.name(src)) && ["night", "day", "standby"].indexOf(mafia.state) !== -1)  {
                name = sys.name(src);
                player = mafia.players[name];
                if (player.role.actions && ("teamTalk" in player.role.actions || "teamUtilities" in player.role.actions)) {
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
                        var id = sys.id(partners[x]);
                        if (id !== undefined && sys.isInChannel(id, mafiachan)) {
                            sys.sendMessage(id, name + ": [Team] " + commandData, mafiachan);
                        }
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
                "±Command: Redirect",
                "±Explanation: Allows the user to change the targets of another player's action.",
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
                "±Role: Distractor",
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
                "±Role: Samurai",
                "±Explanation: This role is able to use the kill command during the day.",
                "*** *********************************************************************** ***",
                "±Role: Exposer",
                "±Explanation: This role is able to use the expose command to reveal the role of their target to the whole game.",
                "*** *********************************************************************** ***",
                "±Role: WereWolf",
                "±Explanation: This role is able to use the kill command and bypasses protect and/or kills distractors. Often referred to as the WW.",
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
                "±Hint: Learn who the safe claimers are for a theme. If you are the role that the theme is centered on, like Link in Zelda, claim and ask for protection!",
                "±Hint: When you are mafia if your teammate is going to be lynched, you are allowed to vote them, using /teamvote or /vote twice, to avoid suspicion. This is called bussing, and a valid tactic to keep yourself hidden.",
                "±Hint: When you find your teammates, it is a good idea to PM them, or use /tt if you're Mafia, so you remember who they are and so you can coordinate your actions.",
                "±Hint: Don't claim as a villager because it exposes the Power Roles. Sometimes meatshielding is a better strategy.",
                "±Hint: Communication with your team is the key to victory.",
                "*** *********************************************************************** ***",
                ""
                ];
                dump(src, helphints);
            }
            else {
                var help = [
                "*** *********************************************************************** ***",
                "Figure out who the bad guys are, and /vote them off during the day!",
                "If you're one of the bad guys, kill everyone off, and don't get caught!",
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
            var data = commandData.split(":");
            var themeName = mafia.getCurrentTheme(data[0]);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
            }
            var roles = mafia.themeManager.themes[themeName].roleInfo;
            if (data[1]) {
                var sep = "*** *********************************************************************** ***";
                var filterRoles = [sep];
                var roleTranslation = data[1].toLowerCase();
                for (var i = 0; i < roles.length; ++i) {
                    if (roles[i].search(/±role:/i) > -1 && (roles[i].toLowerCase().search(roleTranslation) > -1 || roles[i].toLowerCase().search(decodeURIComponent(roleTranslation)) > -1 )) {
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
            var themeName = mafia.getCurrentTheme(commandData);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
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
            mafiabot.sendHtmlMessage(src, "Installed themes are: " + l.map(function(theme) { return "<a href=\"po:setmsg//start " + theme + "\">" + theme + "</a>"; }).join(", "), channel);
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
            var themeName = mafia.getCurrentTheme(commandData);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
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
        if (command === "spawn") {
            var data = commandData.split(":");
            var themeName = mafia.getCurrentTheme(data[0]);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
            }

            var theme = mafia.themeManager.themes[themeName];
            var min = theme.minplayers === undefined ? 5 : theme.minplayers;
            var count = mafia.gameInProgress() && mafia.theme == theme ? mafia.signups.length : min;
            var c;

            if (data[1]) {
                c = parseInt(data[1], 10);
                count = typeof c == "number" ? (c > min ? c : min) : count;
            }

            if (count > theme["roles" + theme.roleLists].length) {
                count = theme["roles" + theme.roleLists].length;
            }

            c = 1;
            while (count > theme["roles" + c].length) {
                ++c;
            }
            var list = theme.spawnInfo[c - 1].slice(0, count);

            sys.sendMessage(src, "", mafiachan);
            gamemsg(srcname, theme.name + "'s spawn at " + count + " players: ");

            for (c = 0; c < list.length; c++) {
                sys.sendMessage(src, (c + 1) + ": " + list[c], mafiachan);
            }

            sys.sendMessage(src, "", mafiachan);
            return;
        }
        if (command === "tips") {
            //Stuff
            var themeName = mafia.getCurrentTheme(commandData);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
            }

            var theme = mafia.themeManager.themes[themeName];
            if (!theme.tips) {
                gamemsg(srcname, theme.name + " doesn't have a tips section!");
                return;
            }

            sys.sendMessage(src, "", mafiachan);
            gamemsg(srcname, "*** Tips for " + theme.name + " ***");

            if (Array.isArray(theme.tips)) {
                theme.tips.forEach(function (line) {
                    sys.sendMessage(src, line, mafiachan);
                });
            } else if (typeof theme.tips === "object") {
                for (var x in theme.tips) {
                    sys.sendMessage(src, x + ": " + theme.tips[x], mafiachan);
                }
            }

            sys.sendMessage(src, "", mafiachan);
            return;
        }
        if (command === "details") {
            var themeName = mafia.getCurrentTheme(commandData);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
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
            mess.push("<b>Summary: </b>" + (theme.summary ? theme.summary.replace(/(https?:\/\/[^\s]+)/gi, "<a href='$1'>$1</a>") : "No summary available."));

            var features = [];
            if (theme.nolynch) {
                features.push("-No Voting Phase");
            } else {
                if (theme.votesniping) {
                    features.push("-Vote Sniping");
                }
                if (theme.silentVote) {
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
            var themeName = mafia.getCurrentTheme(commandData);
            if (themeName == null) {
                gamemsg(srcname, "No such theme!", false, channel);
                return;
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
            mess.push("<table><tr><th>Theme</th><th>Who started</th><th>When</th><th>Players</th><th>Finished at</th><th>Winner</th></tr>");
            var recentGames = PreviousGames.slice(-10);
            var t = parseInt(sys.time(), 10);
            for (var i = 0; i < recentGames.length; ++i) {
                var game = recentGames[i];
                mess.push('<tr><td>' + casedtheme(game.what) + '</td><td>' + game.who + '</td><td>' + getTimeString(t - game.when) + ' ago </td><td>' + game.playerCount + '</td><td>' + (game.duration ? game.duration : "") + '</td><td>' + (game.winner ? game.winner : "") + '</td></tr>');
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
                themeName = defaultThemeName;
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
            if (!mafia.authorMatch(src, name)) {
                msg(src, "You need to be a Mafia Admin or the author of this theme in order to update it.");
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
            var theme = mafia.themeManager.themes[name.toLowerCase()];
            if (dlurl && theme) {
                mafia.themeManager.loadWebTheme(dlurl, (!sup), true, mafia.authorMatch(src, name) ? theme.name.toLowerCase() : null, src, false);
            } else {
                msg(src, "URL or Theme name is not defined. Use /add [url].");
            }
            return;
        }
        if (command === "join") {
            gamemsg(srcname, "You can't join now!");
            return;
        }
        if (command === "nextevent") {
            var timer =  this.nextEventTime - new Date().getTime();
            if (timer <= 0) {
                mafiabot.sendHtmlMessage(src, "<b>Next Mafia Event begins as soon as the next game ends</b>!", mafiachan);
                return;
            }
            var sec = Math.floor((timer/1000)%60);
            var mins = Math.floor((timer/1000)/60);
            mafiabot.sendHtmlMessage(src, "Next Mafia Event begins in <b>" + mins + " minute(s) and " + sec + " second(s)</b>!", mafiachan);
            return;
        }
        if (command === "featured") {
            sys.sendMessage(src, GREEN_BORDER, mafiachan);
            if (featuredTheme) {
                mafiabot.sendHtmlMessage(src, "Looking for a theme to play? Try out the Featured Theme: <b>" + casedtheme(featuredTheme) + "</b>!", mafiachan);
            }
            mafiabot.sendHtmlMessage(src, (featuredLink ? '<a href="' + html_escape(featuredLink) + '">' + featuredText + '</a>' : featuredText), mafiachan);
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
                    sys.sendHtmlMessage(src, "<font color=" + script.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
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
                            sys.sendHtmlMessage(src, "<font color=" + script.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
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
                    sys.sendHtmlMessage(src, "<font color=" + script.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
                }
            }
            sys.sendMessage(src, "", channel);
            return;
        }
        if (command === "disabledc") {
            srcname = srcname.toLowerCase();
            if (mafia.isInGame(sys.name(src))) {
                msg(src, "You can't disable dead chat while in game!");
                return;
            }
            if (mafia.nodead.indexOf(srcname) !== -1) {
                msg(src, "Dead chat is already disabled!");
                return;
            }
            if (mafia.dead.indexOf(srcname) === -1 ) {
                msg(src, "You can't disable dead chat unless you played in the game!");
                return;
            }
            mafia.nodead.push(srcname);
            mafia.dead.splice(mafia.dead.indexOf(srcname), 1);
            msg(src, "You disabled dead chat.");
            return;
        }
        if (command === "enabledc") {
            srcname = srcname.toLowerCase();
            if (mafia.isInGame(sys.name(src))) {
                msg(src, "You can't enable dead chat while in game!");
                return;
            }
            if (mafia.dead.indexOf(srcname) !== -1 ) {
                msg(src, "Dead chat is already enabled");
                return;
            }
            if (mafia.nodead.indexOf(srcname) === -1 ) {
                msg(src, "You can't enable dead chat unless you played in the game!");
                return;
            }
            mafia.nodead.splice(mafia.nodead.indexOf(srcname), 1);
            mafia.dead.push(srcname);
            msg(src, "You enabled dead chat.");
            return;
        }

        if (command === "disable") {
            if (!mafia.authorMatch(src, commandData)) {
                return;
            }
            mafia.themeManager.disable(src, commandData);
            return;
        }
        if (command === "seedisabled") {
            var themes = mafia.themeManager.themes;
            var disabledThemes = [];
            for (var x in themes) {
                if (themes[x].nonPeak || mafia.themeManager.themes[x].enabled) {
                    continue;
                }
                disabledThemes.push(themes[x].name);
            }
            if (disabledThemes.length) {
                msg(src, "The following themes are disabled: " + disabledThemes.join(", ") + ".");
            } else {
                msg(src, "No peak themes are disabled.");
            }
            return;
        }
        if (command === "nonpeaks") {
            var themes = mafia.themeManager.themes;
            var nonpeaks = [];
            for (var x in themes) {
                if (themes[x].nonPeak) {
                    nonpeaks.push(themes[x].name);
                }
            }
            if (nonpeaks.length) {
                msg(src, "The following themes are non-peak: " + nonpeaks.join(", ") + ". Non-peaks are currently " + (peak ? " disabled." : " enabled."));
            } else {
                msg(src, "No non-peaks found.");
            }
            return;
        }
        if (command === "mywarns") {
            this.myWarns(srcname);
            return;
        }

        if (!this.isMafiaAdmin(src) && !this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        if (command === "warn") {
            this.warnUser(srcname, commandData);
            return;
        }
        if (command === "warnlog") {
            this.checkWarns(srcname, commandData);
            return;
        }
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
        if (command === "say") {
            sys.sendAll(sys.name(src) + ": " + commandData, mafiachan);
            return;
        }
        if (command === "readlog") {
            var num = parseInt(commandData, 10);
            if (!num) {
                gamemsg(srcname, "This is not a valid number!", "±Info", channel);
                return;
            }
            if (num < 1 || num > stalkLogs.length) {
                gamemsg(srcname, "There's no log with this id!", "±Info", channel);
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
                gamemsg(srcname, "This is not a valid number!", "±Info", channel);
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
                msg(src, "Your target is offline!", channel);
                return true;
            }
            if (!sys.dbRegistered(newname)) {
                msg(src, "That account isn't registered so you can't give it authority!", channel);
                return true;
            }
            if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                msg(src, "Both accounts must be on the same IP to switch!", channel);
                return true;
            }
            if (script.mafiaAdmins.hash.hasOwnProperty(newname)|| script.mafiaSuperAdmins.hash.hasOwnProperty(newname)) {
                msg(src, "Your target is already a Mafia Admin!", channel);
                return true;
            }
            if (script.mafiaSuperAdmins.hash.hasOwnProperty(oldname)) {
                script.mafiaSuperAdmins.remove(oldname);
                script.mafiaSuperAdmins.add(newname, "");
                sMA = true;
            } else if (script.mafiaAdmins.hash.hasOwnProperty(oldname)) {
                script.mafiaAdmins.remove(oldname);
                script.mafiaAdmins.add(newname, "");
            } else {
                msg(src, "You are not a Mafia Admin", channel);
                return;
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
            if (this.ips.indexOf(sys.dbIp(name)) != -1) {
                delete this.ips[this.ips.indexOf(sys.dbIp(name))];
                msgAll(nonFlashing(sys.name(src)) + " lifted the join restrictions on " + name + ".", sachannel);
                msg(src, "You allowed " + name + " to rejoin the game.", channel);
                msg(sys.id(name), "You can rejoin the game if you would like to!", mafiachan);
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
        if (command === "disableunder") {
            if (commandData > 45 || commandData < 30) {
                msg(src, "You must specify a number over 30 and under 45 for mass disabling.");
                return;
            }
            var themes = mafia.themeManager.themes;
            var disableThemes = [];
            for (var x in themes) {
                var each = themes[x];
                if (each["roles" + each.roleLists].length >+ commandData) {
                    continue;
                }
                mafia.themeManager.disable(src, x, true);
                disableThemes.push(themes[x].name);
            }
            if (disableThemes.length) {
                dualBroadcast("±" + mafiabot.name + ": " + nonFlashing(sys.name(src)) + " disabled all themes under " + commandData + " players (" + disableThemes.join(", ") + ").");
            } else {
                msg(src, "No themes matching that criteria found.");
            }
            return;
        }

        if (!this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        if (command === "mafiaadmin" || command === "mafiasadmin" || command === "mafiasuperadmin" || command === "smafiaadmin" || command === "smafiasadmin" || command === "smafiasuperadmin") {
            if (sys.dbIp(commandData) === undefined) {
                msg(src, "This user doesn't exist.");
                return;
            }
            if (!sys.dbRegistered(commandData)) {
                msg(src, "They aren't registered so you can't give them authority.");
                if (sys.id(commandData) !== undefined) {
                    msg(sys.id(commandData), "Please register ASAP, before getting mafia authority.");
                }
                return;
            }
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
            if (mafia.gameInProgress() && commandData.toLowerCase() == this.getCurrentTheme(noPlayer)) {
                msg(src, "You cannot remove a theme currently in progress!");
                return;
            }
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

            gamemsgAll(name + " joined the game! (pushed by " + nonFlashing(sys.name(src)) + ")");
            sys.sendAll("±Game: " + name + " joined the game! (pushed by " + nonFlashing(sys.name(src)) + ")", sachannel);
            if (name in this.usersToShove) {
                delete this.usersToShove[name];
            }
            return;
        }
        if (command === "event") {
            if ((commandData === "*") || (commandData === "show")) {
                this.showEventQueue(src);
                msg(src, "Use /event add:[theme] to add to queue, /event remove:[theme] to remove, /event jump:[theme] to add a theme to the front of the queue, /event trim:[theme] to cut the last, or /event shuffle to shuffle the queue.");
                msg(src, "Edit the themes added to the event queue by default with /event addpool:[theme] and /event removepool:[theme].");
                msg(src, "Use /event forcestart to set the event time to now.");
                return;
            }
            var data = commandData.split(":");
            if (data[0] === "enable") {
                this.enableEvent(src, true);
                return;
            }
            if (data[0] === "disable") {
                this.enableEvent(src, false);
                return;
            }
            if (data[0] === "add") {
                this.addEventTheme(src, data[1], "");
                return;
            }
            if (data[0] === "jump") {
                this.addEventTheme(src, data[1], "first");
                return;
            }
            if (data[0] === "remove") {
                this.removeEventTheme(src, data[1], "");
                return;
            }
            if (data[0] === "trim") {
                this.removeEventTheme(src, data[1], "last");
                return;
            }
            if (data[0] === "shuffle") {
                this.shuffleEventQueue(src);
                return;
            }
            if (data[0] === "addpool") {
                this.addToEventPool(src, data[1]);
                return;
            }
            if (data[0] === "removepool") {
                this.removeFromEventPool(src, data[1]);
                return;
            }
            if (data[0] === "forcestart") {
                this.startEvent(true);
                return;
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
                msg(src, featuredTheme + " is not a valid Mafia theme.");
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
        if (command === "enableall") {
            var themes = mafia.themeManager.themes;
            var enableThemes = [];
            for (var x in themes) {
                if (themes[x].nonPeak || mafia.themeManager.themes[x].enabled) {
                    continue;
                }
                mafia.themeManager.enable(src, x, true);
                enableThemes.push(themes[x].name);
            }
            if (enableThemes.length) {
                dualBroadcast("±" + mafiabot.name + ": " + nonFlashing(sys.name(src)) + " enabled all themes (" + enableThemes.join(", ") + ").");
            } else {
                msg(src, "No peak themes are disabled.");
            }
            return;
        }
        throw ("no valid command");
    };
    this.showRules = function(src, channel) {
        var mrules = [
            "",
            "*** Mafia Game Rules (Last updated July 2014) ***",
            "",
            "±Rule 1- All server rules and social etiquette apply in this channel. Type /rules to view them:",
            "Ignorance of any rules and playing on Android are not a justification for rule breaking. Someone else breaking a rule does not grant you permission to break them yourself either. Help each other out instead of resorting to insults. If you have a problem with a theme, let the author know in a civilized manner by posting in that theme's forum thread.",
            "",
            "±Rule 2- Mafia Admins, or MAs are here for the benefit of the channel. You can use /mas to get a listing of them:",
            "Listen to any MA that gives direction about behavior in the channel. If a player is breaking a rule, please PM an MA instead of disrupting the game trying to bring attention to the situation. If an MA is breaking a rule, contact a Mafia Super Admin or Server Auth immediately.",
            "",
            "±Rule 3- Make all reasonable attempts to stay active for the entire game if you decide to join, otherwise, /unjoin before the game starts:",
            "If you must leave, ask for a \"slay\" in the main chat to be removed from the game. Please supply a valid reason for needing to leave. For example, not liking any part of the game is not a valid reason for a slay, nor is participating in battles or other channels. Asking for a slay in the first few phases of the game, or leaving without asking for a slay, will result in punishment.",
            "",
            "±Rule 4- Do not attempt to ruin the game in any way, shape, or form. Always make every reasonable attempt to win.:",
            "Do not reveal, vote, or kill your known teammates without their consent. If you are not currently playing, do not discuss the game with those that are. Do not quote any of the game bots, including in PMs. Do not repeatedly target a certain player or group of players. Forming external alliances is strictly prohibited. Communication is key in Mafia so do not ignore other players or disable PMs. Do not fake \"Team Talk,\" \"Dead Chat,\" or bot quotes. Do not delay the progression of the game for any reason. Do not select a name too similar to another player's name. Intentionally playing poorly is also prohibited. This includes playing against the intended progression of a theme.",
            ""
        ];
        dump(src, mrules, channel);
    };

this.beforeChatMessage = function (src, message, channel) {
        if (channel !== 0 && channel == mafiachan && mafia.ticks > 0 && mafia.gameInProgress()) {
            if (mafia.dead.indexOf(sys.name(src).toLowerCase()) !== -1) {
                if (!(is_command(message) && message.substr(1, 2).toLowerCase() != "me")) {
                    if (SESSION.users(src).smute.active && sys.auth(src) < 1) {
                        sys.sendMessage(src, sys.name(src) + ": [Dead] " + message, mafiachan);
                    } else {
                        for (var x in mafia.dead) {
                            var id = sys.id(mafia.dead[x]);
                            if (id !== undefined && sys.isInChannel(id, mafiachan)) {
                                sys.sendMessage(id, sys.name(src) + ": [Dead] " + message, mafiachan);
                            }
                        }
                    }
                    return true;
                }
            }
            if (!mafia.isInGame(sys.name(src))) {
                if (!(is_command(message) && message.substr(1, 2).toLowerCase() != "me")) {
                    sys.sendMessage(src, Config.Mafia.notPlayingMsg, mafiachan);
                    return true;
                }
            }
            if (mafia.possibleBotquote(message)) {
                msg(src, "Please do not send any messages copied and pasted from one of the game bots!");
                return true;
            }
            if (("theme" in mafia) && ("silentNight" in mafia.theme)) {
                if ((mafia.theme.silentNight) && (this.state === "night") && (!(is_command(message)) || (message.substr(1, 2).toLowerCase() == "me"))) {
                    msg(src, "Shh! Everyone's asleep right now! You can talk out loud during the day. If you have to send someone a message, use /Whisper [name]:[message]!", mafiachan);
                    return true;
                }
            }
            if (message.indexOf("[Team]") != -1) {
                msg(src, "Please don't fake a Team Talk message!", mafiachan);
                return true;
            }
            if (message.indexOf("[Dead]") != -1) {
                msg(src, "Please don't fake a Dead Chat message!", mafiachan);
                return true;
            }
            if (message.indexOf("[Whisper]") != -1) {
                msg(src, "Please don't fake a Whisper message!", mafiachan);
                return true;
            }
        }
        return false;
    };
    this.afterChannelJoin = function(src, channel) {
        if (channel == mafiachan) {
            var srcname = sys.name(src);
            delete mafia.AWOLusers[srcname];
            switch (mafia.state) {
                case "blank":
                    gamemsg(srcname, "No game is running! You can start a game by typing /start [theme name].", "±Info");
                    break;
                case "voting":
                    gamemsg(srcname, "A voting for the next game is running now! Type /vote [theme name] to vote for " + readable(Object.keys(this.possibleThemes), "or") + "!", "±Info");
                    break;
                case "entry":
                    gamemsg(srcname, "You can join a " + (mafia.theme.name == defaultThemeName ? "" : mafia.theme.name + "-themed ") + "mafia game now by typing /join! ", "±Info");
                    break;
                default:
                    gamemsg(srcname, "A " + (mafia.theme.name == defaultThemeName ? "" : mafia.theme.name + "-themed ") + "mafia game is in progress! You can join the next game by typing /join during signups after the game finishes!", "±Info");
            }
        }
        return false;
    };
    this.beforeChannelLeave = function(src, channel) {
        if (channel == mafiachan) {
            var name = sys.name(src);
            if (name in this.usersToShove) {
                msgAll(name + " left the channel and was removed from the shove list!", sachannel);
                delete this.usersToShove[name];
            }

            if ((this.isInGame(name) || name in this.signups)) {
                this.AWOLusers[name] = 1;
            }
            return true;
        }
        return false;
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
            dualBroadcast("Error occurred in Mafia step on line " + (err.lineNumber ? " on line " + err.lineNumber : "") + ": " + err);
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
                sys.sendMessage(src, "*** Mafia Owner commands ***", channel);
                this.commands.owner.forEach(function (x) {
                    sys.sendMessage(src, x, channel);
                });
            }
        }
    };
    this.isChannelAdmin = function (src) {
        return mafia.isMafiaAdmin(src) ? true : mafia.isMafiaSuperAdmin(src);
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
