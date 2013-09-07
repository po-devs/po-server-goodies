// This is the official Pokemon Online Scripts
// These scripts will only work on 2.0.00 or newer.
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
// You may change these variables as long as you keep the same type
var Config = {
    base_url: "https://raw.github.com/po-devs/po-server-goodies/master/",
    dataDir: "scriptdata/",
    bot: "Dratini",
    kickbot: "Blaziken",
    capsbot: "Exploud",
    channelbot: "Chatot",
    checkbot: "Snorlax",
    coinbot: "Meowth",
    countbot: "CountBot",
    tourneybot: "Typhlosion",
    rankingbot: "Porygon",
    battlebot: "Blastoise",
    commandbot: "CommandBot",
    querybot: "QueryBot",
    hangbot: "Unown",
    bfbot: "Deoxys",
    // suspectvoting.js available, but not in use
    Plugins: ["mafia.js", "amoebagame.js", "tournaments.js", "tourstats.js", "trivia.js", "tours.js", "newtourstats.js", "auto_smute.js", "battlefactory.js", "hangman.js", "blackjack.js"],
    Mafia: {
        bot: "Murkrow",
        norepeat: 11,
        stats_file: "mafia_stats.json",
        max_name_length: 16,
        notPlayingMsg: "±Game: The game is in progress. Please type /join to join the next mafia game."
    },
    League: [
        ["Hikari", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20858-Elite-4-Hikari'>E4 Thread!</a>"],
        ["The Real Elmo", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20483-Current-Gym-Leaders-and-Elite-Four'>E4 Thread!</a>"],
        ["Thatiswhatshesaid", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20483-Current-Gym-Leaders-and-Elite-Four'>E4 Thread!</a>"],
        ["Fitzyhbbe", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20857-Elite-4-Fitzy'>E4 Thread!</a>"],
        ["ZoroDark", "5th Generation WiFi Ubers - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20700-Wifi-Ubers-Gym-ZoroDark'>Gym Thread!</a>"],
        ["Finchinator", "5th Generation WiFi OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20494-Wifi-OU-Gym-Hannah-and-Finchinator'>Gym Thread!</a>"],
        ["Hannah", "5th Generation WiFi OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20494-Wifi-OU-Gym-Hannah-and-Finchinator'>Gym Thread!</a>"],
        ["MeowMix", "5th Generation WiFi UnderUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20502-Wifi-UU-Gym-MeowMix'>Gym Thread!</a> "],
        ["xdevo", "5th Generation WiFi LittleUsed Gym - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20490-Wifi-LU-Gym-Xdevo'>Gym Thread!</a>"],
        ["CasedVictory", "5th Generation WiFi NeverUsed Gym - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20499-Wifi-NU-Gym-CasedVictory'>Gym Thread!</a>"],
        ["Artemisa", "5th Generation WiFi Little Cup - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20495-Wifi-LC-Arte'>Gym Thread!</a>"],
        ["зeлeнoглaзый pyccкий", "All Gen CC - View {0}'s <a href='pokemon-online.eu/forums/showthread.php?20484-Challenge-Cup-Gym-Green-Eyed-Russian-amp-diamondslight'>Gym Thread!</a>"],
        ["diamondslight", "All Gen CC - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20484-Challenge-Cup-Gym-Green-Eyed-Russian-amp-diamondslight'>Gym Thread!</a>"],
        ["sulcata", "Monotype - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20485-sulcata-s-Monotype-gym'>Gym Thread!</a>"],
        ["Pkftmfw", "4th Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20487-DPP-OU-Gym-Pkftmfw'>Gym Thread!</a>"],
        ["Tanner", "3rd Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20489-ADV-OU-GYM-BIG-BAD-BLINGAS'>Gym Thread!</a>"],
        ["HODOR", "2nd Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20821-GSC-OU-Gym-IFM'>Gym Thread!</a>"],
        ["Isa-", "1st Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20534-RBY-OU-Gym-Isa'>Gym Thread!</a>"],
        ["IronStorm", "VGC 2013 - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20528-VGC-2013-Gym-IronStorm'>Gym Thread!</a>"]
    ],
    DreamWorldTiers: ["No Preview OU", "No Preview Ubers", "DW LC", "Monotype", "DW UU", "DW LU", "Gen 5 1v1 Ubers", "Gen 5 1v1", "Challenge Cup", "CC 1v1", "DW Uber Triples", "No Preview OU Triples", "No Preview Uber Doubles", "No Preview OU Doubles", "Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST", "Monocolour", "Clear Skies DW"],
    superAdmins: ["[LD]Jirachier", "Ethan"],
    canJoinStaffChannel: ["Lamperi-", "Peanutsdroid", "QuX", "Ethan-"],
    disallowStaffChannel: [],
    topic_delimiter: " | ",
    registeredLimit: 30
};

// Don't touch anything here if you don't know what you do.
/*global print, script, sys, SESSION*/

var require_cache = typeof require != 'undefined' ? require.cache : {};
require = function require(module_name, retry) {
    if (require.cache[module_name])
        return require.cache[module_name];
    
    var module = {};
    module.module = module;
    module.exports = {};
    module.source = module_name;
    with (module) {
        var content = sys.getFileContent("scripts/"+module_name);
        if (content) {
            try {
                 eval(sys.getFileContent("scripts/"+module_name));
                 sys.writeToFile("scripts/" + module_name + "-b", sys.getFileContent("scripts/" + module_name));
            } catch(e) {
                if (staffchannel)
                    sys.sendAll("Error loading module " + module_name + ": " + e + (e.lineNumber ? " on line: " + e.lineNumber : ""), staffchannel);
                else
                    sys.sendAll("Error loading module " + module_name + ": " + e);
                sys.writeToFile("scripts/"+module_name, sys.getFileContent("scripts/" + module_name + "-b"));
                if (!retry) {
                    require(module_name, true); //prevent loops
                }
            }
        }
    }
    require.cache[module_name] = module.exports;
    return module.exports;
};
require.cache = require_cache;

var updateModule = function updateModule(module_name, callback) {
   var base_url = Config.base_url;
   var url;
   if (/^https?:\/\//.test(module_name))
      url = module_name;
   else
      url = base_url + "scripts/"+ module_name;
   var fname = module_name.split(/\//).pop();
   if (!callback) {
       var resp = sys.synchronousWebCall(url);
       if (resp === "") return {};
       sys.writeToFile("scripts/"+fname, resp);
       delete require.cache[fname];
       var module = require(fname);
       return module;
   } else {
       sys.webCall(url, function updateModule_callback(resp) {
           if (resp === "") return;
           sys.writeToFile("scripts/"+fname, resp);
           delete require.cache[fname];
           var module = require(fname);
           callback(module);
       });
   }
};

var channel, getKey, contributors, mutes, mbans, smutes, detained, hbans, mafiaSuperAdmins, hangmanAdmins, hangmanSuperAdmins, staffchannel, channelbot, normalbot, bot, mafiabot, kickbot, capsbot, checkbot, coinbot, countbot, tourneybot, battlebot, commandbot, querybot, rankingbot, hangbot, bfbot, scriptChecks, lastMemUpdate, bannedUrls, mafiachan, mafiarev, sachannel, tourchannel, dwpokemons, lcpokemons, bannedGSCSleep, bannedGSCTrap, breedingpokemons, rangebans, proxy_ips, mafiaAdmins, rules, authStats, nameBans, isSuperAdmin, cmp, key, saveKey, battlesStopped, lineCount, pokeNatures, maxPlayersOnline, pastebin_api_key, pastebin_user_key, getSeconds, getTimeString, sendChanMessage, sendChanAll, sendMainTour, VarsCreated, authChangingTeam, usingBannedWords, repeatingOneself, capsName, CAPSLOCKDAYALLOW, nameWarns, poScript, revchan, triviachan, watchchannel, lcmoves, hangmanchan, ipbans, battlesFought, lastCleared, blackjackchan, heightList, weightList, powerList, accList, ppList, categoryList, moveEffList, moveFlagList, namesToWatch;

var pokeDir = "db/pokes/";
var moveDir = "db/moves/5G/";
var isMafiaAdmin = require('mafia.js').isMafiaAdmin;
var isMafiaSuperAdmin = require('mafia.js').isMafiaSuperAdmin;
sys.makeDir("scripts");
/* we need to make sure the scripts exist */
var commandfiles = ['commands.js', 'channelcommands.js','ownercommands.js', 'modcommands.js', 'usercommands.js', "admincommands.js"];
var deps = ['crc32.js', 'utilities.js', 'bot.js', 'memoryhash.js', 'tierchecks.js'].concat(commandfiles).concat(Config.Plugins);
var missing = 0;
for (var i = 0; i < deps.length; ++i) {
    if (!sys.getFileContent("scripts/"+deps[i])) {
        if (missing++ === 0) sys.sendAll('Server is updating its script modules, it might take a while...');
        var module = updateModule(deps[i]);
        module.source = deps[i];
    }
}
if (missing) sys.sendAll('Done. Updated ' + missing + ' modules.');


/* To avoid a load of warning for new users of the script,
        create all the files that will be read further on*/
var cleanFile = function(filename) {
    if (typeof sys != 'undefined')
        sys.appendToFile(filename, "");
};
["mafia_stats.json", "suspectvoting.json", "mafiathemes/metadata.json", "channelData.json", "mutes.txt", "mbans.txt", "hbans.txt", "smutes.txt", "rangebans.txt", "contributors.txt", "ipbans.txt", Config.dataDir+"namesToWatch.txt", "hangmanadmins.txt", "hangmansuperadmins.txt", Config.dataDir+"pastebin_user_key", "secretsmute.txt", "ipApi.txt", Config.dataDir + "notice.html"].forEach(cleanFile);

var autosmute = sys.getFileContent("secretsmute.txt").split(':::');
var crc32 = require('crc32.js').crc32;
var MemoryHash = require('memoryhash.js').MemoryHash;
delete require.cache['tierchecks.js'];
var tier_checker = require('tierchecks.js');

/* stolen from here: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format */
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var utilities = require('utilities.js');
var isNonNegative = utilities.is_non_negative;
var Lazy = utilities.Lazy;
var nonFlashing = utilities.non_flashing;
var getSeconds = utilities.getSeconds;
var getTimeString = utilities.getTimeString;

var commands = require('commands.js');

/* Useful for evalp purposes */
function printObject(o) {
  var out = '';
  for (var p in o) {
    if (o.hasOwnProperty(p)) {
        out += p + ': ' + o[p] + '\n';
    }
  }
  sys.sendAll(out);
}

/* Functions using the implicit variable 'channel' set on various events */
// TODO: remove the possibility for implictit channel
// TODO: REMOVE THESE FUNCTIONS THAT LIKE BREAKING AT RANDOM TIMES
function sendChanMessage(id, message, channel) {
    sys.sendMessage(id, message, channel);
}

function sendChanAll(message, chan_id, channel) {
    if((chan_id === undefined && channel === undefined) || chan_id == -1)
    {
        sys.sendAll(message);
    } else if(chan_id === undefined && channel !== undefined)
    {
       sys.sendAll(message, channel);
    } else if(chan_id !== undefined)
    {
        sys.sendAll(message, chan_id);
    }
}

function sendChanHtmlMessage(id, message) {
    sys.sendHtmlMessage(id, message, channel);
}

function sendChanHtmlAll(message, chan_id) {
    if((chan_id === undefined && channel === undefined) || chan_id == -1)
    {
        sys.sendHtmlAll(message);
    } else if(chan_id === undefined && channel !== undefined)
    {
        sys.sendHtmlAll(message, channel);
    } else if(chan_id !== undefined)
    {
        sys.sendHtmlAll(message, chan_id);
    }
}

String.prototype.toCorrectCase = function() {
    if (isNaN(this) && sys.id(this) !== undefined) {
        return sys.name(sys.id(this));
    }
    else {
        return this;
    }
};
function dwCheck(pokemon){
    if (sys.pokeAbility(pokemon,2,5) === 0 && sys.pokeAbility(pokemon,1,5) === 0){
        return false;
    }
    return true;
}

function calcStat (base, IV, EV, level, nature) {
    var stat = Math.floor(Math.floor((IV + (2 * base) + Math.floor(EV / 4)) * level / 100 + 5) * nature);
    return stat;
}

function calcHP (base, IV, EV, level) {
    if (base === 1) {
        return 1;
    }
    var HP = Math.floor((IV + (2 * base) + Math.floor(EV / 4) + 100) * level / 100 + 10);
    return HP;
}

function getDBIndex (pokeId) {
    var id = pokeId % 65536;
    var forme = (pokeId - id) / 65536;
    return id + ":" + forme;
}

function getWeight (pokeId) {
    if (weightList === undefined) {
        weightList = {};
        var data = sys.getFileContent(pokeDir + 'weight.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var id = data[i].substr(0, index);
            var weight = data[i].substr(index + 1);
            weightList[id] = weight;
        }
    }
    var key = getDBIndex(pokeId);
    if (weightList[key] !== undefined) {
        return weightList[key];
    }
    var index = key.indexOf(":") + 1;
    var base = key.substr(0, index);
    return weightList[base + "0"];
}

function getHeight (pokeId) {
    if (heightList === undefined) {
        heightList = {};
        var data = sys.getFileContent(pokeDir + 'height.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var id = data[i].substr(0, index);
            var height = data[i].substr(index + 1);
            heightList[id] = height;
        }
    }
    var key = getDBIndex(pokeId);
    if (heightList[key] !== undefined) {
        return heightList[key];
    }
    var index = key.indexOf(":") + 1;
    var base = key.substr(0, index);
    return heightList[base + "0"];
}

function weightPower (weight) {
    var power = 0;
    if (weight < 10) power = 20;
    if (weight >= 10 && weight < 25) power = 40;
    if (weight >= 25 && weight < 50) power = 60;
    if (weight >= 50 && weight < 100) power = 80;
    if (weight >= 100 && weight < 200) power = 100;
    if (weight >= 200) power = 120;
    return power;
}

function getMoveBP (moveId) {
    if (powerList === undefined) {
        powerList = {};
        var data = sys.getFileContent(moveDir + 'power.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            powerList[key] = power;
        }
    }
    if (powerList[moveId] === undefined || powerList[moveId] === "1") {
        return "---";
    }
    return powerList[moveId];
}

function getMoveCategory (moveId) {
    if (categoryList === undefined) {
        categoryList = {};
        var data = sys.getFileContent(moveDir + 'damage_class.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var category = data[i].substr(index + 1);
            categoryList[key] = category;
        }
    }
    if (categoryList[moveId] === "1") {
        return "Physical";
    }
    if (categoryList[moveId] === "2") {
        return "Special";
    }
    return "Other";
}

function getMoveAccuracy (moveId) {
    if (accList === undefined) {
        accList = {};
        var data = sys.getFileContent(moveDir + 'accuracy.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var accuracy = data[i].substr(index + 1);
            accList[key] = accuracy;
        }
    }
    if (accList[moveId] === "101") {
        return "---";
    }
    return accList[moveId];
}

function getMovePP (moveId) {
    if (ppList === undefined) {
        ppList = {};
        var data = sys.getFileContent(moveDir + 'pp.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var pp = data[i].substr(index + 1);
            ppList[key] = pp;
        }
    }
    return ppList[moveId];
}

function getMoveEffect (moveId) {
    if (moveEffList === undefined) {
        moveEffList = {};
        var data = sys.getFileContent(moveDir + 'effect.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var effect = data[i].substr(index + 1);
            moveEffList[key] = effect;
        }
    }
    if (moveEffList[moveId] === undefined) {
        return "Deals normal damage.";
    }
    return moveEffList[moveId].replace(/[\[\]{}]/g, "");
}

function getMoveContact (moveId) {
    if (moveFlagList === undefined) {
        moveFlagList = {};
        var data = sys.getFileContent(moveDir + 'flags.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var flags = data[i].substr(index + 1);
            moveFlagList[key] = flags;
        }
    }
    return moveFlagList[moveId] % 2 === 1;
}

function updateNotice() {
    var url = Config.base_url + "notice.html";
    sys.webCall(url, function (resp){
        sys.writeToFile(Config.dataDir + "notice.html", resp);
        sendNotice();
    });
}

function sendNotice() {
    var notice = sys.getFileContent(Config.dataDir + "notice.html");
    if (notice) {
        ["Tohjo Falls", "Trivia", "Tournaments", "Indigo Plateau", "Victory Road", "TrivReview", "Mafia", "Hangman"].forEach(function(c) {
            sys.sendHtmlAll(notice, sys.channelId(c));
        });
    }
}

function isAndroid(id) {
    if (sys.os) {
        return sys.os(id) === "android";
    } else {
        return sys.info(id) === "Android player." && sys.avatar(id) === 72;
    }
}

function clearTeamFiles() {
    var files = sys.filesForDirectory("usage_stats/formatted/team");
    for (var x = 0; x < files.length; x++) {
        var time = files[x].split("-")[0];
        if (sys.time() - time > 86400) {
            sys.deleteFile("usage_stats/formatted/team/" + files[x]);
        }
    }
}

var POKEMON_CLEFFA = typeof sys != 'undefined' ? sys.pokeNum("Cleffa") : 173;
function POUser(id)
{
    /* user's id */
    this.id = id;
    this.name = sys.name(id);
    /* whether user is megauser or not */
    this.megauser = false;
    /* whether user is muted or not */
    this.mute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is mafiabanned or not */
    this.mban = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is secrectly muted */
    this.smute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is hangmanbanned or not */
    this.hban = {active: false, by: null, expires: 0, time: null, reason: null};
    /* caps counter for user */
    this.caps = 0;
    /* whether user is impersonating someone */
    this.impersonation = undefined;
    /* last time user said something */
    // TODO replace with the other one
    this.timecount = parseInt(sys.time(), 10);
    /* last time user said something */
    this.talk = (new Date()).getTime();
    /* counter on how many lines user has said recently */
    this.floodcount = 0;
    /* counts coins */
    this.coins = 0;
    /* whether user has enabled battling only in same tier */
    this.sametier = undefined;
    /* name history */
    this.namehistory = [];
    /* last line */
    this.lastline = {message: null, time: 0};
    /* login time */
    this.logintime = parseInt(sys.time(), 10);
    /* tier alerts */
    this.tiers = [];
    /* last time a user PM'd */
    this.lastpm = parseInt(sys.time(), 10);
    /* amount of PM's a user has sent */
    this.pmcount = 0;
    /* stopping spam */
    this.pmwarned = false;
    /* invite delay */
    this.inviteDelay = 0;
    /* tour alert */
    if (getKey('touralertson', id) == "true") {
        this.tiers = getKey("touralerts", id).split("*");
    }
    /* mafia alerts */
    this.mafiathemes = [];
    if (getKey("mafiaalertson", id) == "true") {
        this.mafiaalertson = true;
        this.mafiaalertsany = getKey("mafiaalertsany", id) == "true" ? true : false;
        this.mafiathemes = getKey("mafiathemes", id).split("*");
    }
    /* host name */
    this.hostname = "pending";
    var user = this; // closure
    sys.hostName(sys.ip(id), function(result) {
        try {
            user.hostname = result;
        } catch (e) {}
    });
    this.battles = {};

//    /* android default team check */
//    var android = true;
//    var i;
//    for (i = 0; i < 6; ++i) {
//        if (sys.teamPoke(this.id, i) != POKEMON_CLEFFA) {
//            android = false;
//            break;
//        }
//    }
//    this.android = android;

    var name = sys.name(id);
    if (contributors.hash.hasOwnProperty(name))
        this.contributions = contributors.get(name);

    /* check if user is banned or mafiabanned */
    var data;
    var loopArgs = [["mute", mutes], ["mban", mbans], ["smute", smutes], ["hban", hbans]];
    for (i = 0; i < 4; ++i) {
        var action = loopArgs[i][0];
        if ((data = loopArgs[i][1].get(sys.ip(id))) !== undefined) {
            this[action].active=true;
            var args = data.split(":");
            if (action !== "detained") {
                this[action].time = parseInt(args[0], 10);
                if (args.length == 5) {
                    this[action].by = args[1];
                    this[action].expires = parseInt(args[2], 10);
                    this[action].reason = args.slice(4).join(":");
                }
            } else {
                this[action].by = args[1];
                this[action].games = parseInt(args[0], 10);
                this[action].reason = args.slice(3).join(":");
            }
        }
    }
}


POUser.prototype.toString = function() {
    return "[object POUser]";
};

POUser.prototype.expired = function(thingy) {
    return this[thingy].expires !== 0 && this[thingy].expires < sys.time();
};

POUser.prototype.activate = function(thingy, by, expires, reason, persistent) {
    this[thingy].active = true;
    this[thingy].by = by;
    this[thingy].expires = expires;
    this[thingy].time = parseInt(sys.time(), 10);
    this[thingy].reason = reason;
    if (persistent) {
        var table = {"mute": mutes, "smute": smutes, "mban": mbans, "hban":hbans};
        table[thingy].add(sys.ip(this.id), sys.time() + ":" + by + ":" + expires + ":" + sys.name(this.id) + ":" + reason);
    }

    callplugins("on"+ utilities.capitalize(thingy), this.id);
};

POUser.prototype.un = function(thingy) {
    this[thingy].active = false;
    this[thingy].expires = 0;
    var table = {"mute": mutes, "smute": smutes, "mban": mbans, "hban": hbans};
    table[thingy].remove(sys.ip(this.id));

    callplugins("onUn"+ utilities.capitalize(thingy), this.id);
};


/* POChannel */
function POChannel(id)
{
    this.id = id;
    this.masters = []; // can add admins
    this.admins = []; // can ban, add mods, change invite level
    this.operators = []; // can mute, silence, kick
    this.members = []; // people that can join
    this.perm = false;
    this.inviteonly = 0;
    this.topic = "";
    this.topicSetter = "";
    this.muteall = undefined;
    this.meoff = undefined;
    this.muted = {};
    this.banned = {};
    this.ignorecaps = false;
    this.ignoreflood = false;
    this.allowSwear = true;
}

POChannel.prototype.beforeMessage = function(src, msg) {
};

POChannel.prototype.toString = function() {
    return "[object POChannel]";
};

POChannel.prototype.setTopic = function(src, topicInfo)
{
    var canSetTopic = (sys.auth(src) > 0 || this.isChannelOperator(src));
    if (topicInfo === undefined) {
        if (typeof this.topic != 'undefined') {
            channelbot.sendMessage(src, "Topic for this channel is: " + this.topic, channel);
            if (SESSION.channels(channel).topicSetter) {
                channelbot.sendMessage(src, "Topic was set by " + nonFlashing(this.topicSetter), channel);
            }
        } else {
            channelbot.sendMessage(src, "No topic set for this channel.", channel);
        }
        if (canSetTopic) {
            channelbot.sendMessage(src, "Specify a topic to set one!", channel);
        }
        return;
    }
    if (!canSetTopic) {
        channelbot.sendMessage(src, "You don't have the rights to set topic", channel);
        return;
    }
    this.changeParameter(src, "topic", topicInfo);
    SESSION.global().channelManager.update(this.id);
    channelbot.sendAll("" + sys.name(src) + " changed the topic to: " + topicInfo, channel);
};

POChannel.prototype.isChannelOwner = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if (sys.auth(id) >= 3 || isSuperAdmin(id)) {
        return true;
    }
    if (typeof this.masters != "object") {
        this.masters = [];
    }
    if (this.masters.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};
POChannel.prototype.isChannelAdmin = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if (sys.auth(id) >= 2 || this.isChannelOwner(id)) {
        return true;
    }
    if (typeof this.admins != "object") {
        this.admins = [];
    }
    if (this.admins.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};
POChannel.prototype.isChannelOperator = function(id)
{
    if (!sys.dbRegistered(sys.name(id))) {
        return false;
    }
    if ((sys.auth(id) >= 1 && this.id === 0) || this.isChannelAdmin(id)) {
        return true;
    }
    if (typeof this.operators != "object") {
        this.operators = [];
    }
    if (this.operators.indexOf(sys.name(id).toLowerCase()) > -1) {
        return true;
    }
    return false;
};

POChannel.prototype.addRole = function(src, tar, group, data)
{
    var name = tar.toLowerCase();
    var auth = typeof src == "string" ? src : sys.name(src);
    if (sys.dbIp(tar) === undefined) {
        return ["self", "The user '"+tar.toCorrectCase()+"' doesn't exist!"];
    }
    if (!sys.dbRegistered(tar) && ["owner", "admin", "mod"].indexOf(group) != -1) {
        return ["self", "The user '"+tar.toCorrectCase()+"' is not registered so you can't give them channel authority!"];
    }
    if (typeof this.operators != 'object')
        this.operators = [];
    if (typeof this.admins != 'object')
        this.admins = [];
    if (typeof this.masters != 'object')
        this.masters = [];
    if (typeof this.members != 'object')
        this.members = [];
    if (group == "owner") {
        if (this.masters.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel owner!"];
        }
        if (this.masters.length > 10) {
            return ["self", "There is a limit of 10 owners!"];
        }
        this.masters.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel owner!"];
    }
    if (group == "admin") {
        if (this.admins.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel admin!"];
        }
        if (this.admins.length > 50) {
            return ["self", "There is a limit of 50 admins!"];
        }
        this.admins.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel admin!"];
    }
    if (group == "mod") {
        if (this.operators.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a channel mod!"];
        }
        if (this.operators.length > 100) {
            return ["self", "There is a limit of 100 mods!"];
        }
        this.operators.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a channel mod!"];
    }
    if (group == "member") {
        if (this.members.indexOf(name) > -1) {
            return ["self", tar.toCorrectCase()+" is already a member!"];
        }
        if (this.members.length > 250) {
            return ["self", "There is a limit of 250 members!"];
        }
        this.members.push(name);
        return ["all", sys.name(src)+" made "+tar.toCorrectCase()+" a member!"];
    }
    if (group == "muted") {
        if (this.isPunished(name) === "banned") {
            return ["self", tar.toCorrectCase()+" is already banned from this channel!"];
        }
        if (!this.hasPermission(src, tar)) {
            return ["self", tar.toCorrectCase()+" has equal or higher auth than you, so you can't channel mute them!"];
        }
        if (script.isOfficialChan(this.id) && !this.isChannelOwner(src)) {
            var maxtime = this.isChannelAdmin(src) ? 7*24*60*60 : 24*60*60;
            if (data.time > maxtime || data.time === 0) {
                data.time = maxtime;
            }
            if (data.reason === "") {
                return ["self", "You need to provide a reason for the channel mute!"];
            }
        }
        var already = (this.isPunished(name) === "muted");
        this.muted[name] = {"expiry": data.time === 0 ? "never" : parseInt(sys.time(),10) + data.time, "issuetime": parseInt(sys.time(),10), "auth": auth, "reason": data.reason !== "" ? data.reason : "N/A" };
        var timestring = data.time > 0 ? getTimeString(data.time) : "";
        if (!already) {
            return ["all", auth + " muted " + tar.toCorrectCase() + (timestring === "" ? " permanently" : " for " + timestring) + " in this channel!" + (data.reason !== "" ? " [Reason: " + data.reason + "]" : "")];
        }
        else {
            return ["all", tar.toCorrectCase() + "'s mute time in this channel was changed to " + (timestring === "" ? "forever" : timestring) + " by " + auth + "!" + (data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
        }
    }
    if (group == "banned") {
        if (!this.hasPermission(src, tar)) {
            return ["self", tar.toCorrectCase()+" has equal or higher auth than you, so you can't channel ban them!"];
        }
        if (script.isOfficialChan(this.id) && !this.isChannelOwner(src)) {
            if (data.time > 7*24*60*60 || data.time === 0) {
                data.time = 7*24*60*60;
            }
            if (data.reason === "") {
                return ["self", "You need to provide a reason for the channel ban!"];
            }
        }
        var already = (this.isPunished(name) === "banned");
        this.banned[name] = {"expiry": data.time === 0 ? "never" : parseInt(sys.time(),10) + data.time, "issuetime": parseInt(sys.time(),10), "auth": auth, "reason": data.reason !== "" ? data.reason : "N/A" };
        var timestring = data.time > 0 ? getTimeString(data.time) : "";
        if (!already) {
            return ["all", auth + " banned " + tar.toCorrectCase() + (timestring === "" ? " permanently" : " for " + timestring) + " from this channel!" + (data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
        }
        else {
            return ["all", tar.toCorrectCase() + "'s ban time from this channel was changed to " + (timestring === "" ? "forever" : timestring) + " by " + auth + "!" + (data.reason !== "" ? " [Reason: "+data.reason+"]" : "")];
        }
    }
    return ["self", ""];
};



POChannel.prototype.removeRole = function(src, tar, group)
{
    var name = tar.toLowerCase();
    if (typeof this.operators != 'object')
        this.operators = [];
    if (typeof this.admins != 'object')
        this.admins = [];
    if (typeof this.masters != 'object')
        this.masters = [];
    if (typeof this.members != 'object')
        this.members = [];
    if (group == "owner") {
        if (this.masters.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel owner!"];
        }
        var index = this.masters.indexOf(name);
        this.masters.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel owner list!"];
    }
    if (group == "admin") {
        if (this.admins.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel admin!"];
        }
        var index = this.admins.indexOf(name);
        this.admins.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel admin list!"];
    }
    if (group == "mod") {
        if (this.operators.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a channel mod!"];
        }
        var index = this.operators.indexOf(name);
        this.operators.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel mod list!"];
    }
    if (group == "member") {
        if (this.members.indexOf(name) == -1) {
            return ["self", tar.toCorrectCase()+" is not a member!"];
        }
        var index = this.members.indexOf(name);
        this.members.splice(index,1);
        return ["all", sys.name(src)+" removed "+tar.toCorrectCase()+" from the channel member list!"];
    }
    if (group == "muted") {
        if (!this.muted.hasOwnProperty(name)) {
            return ["self", tar.toCorrectCase()+" is not muted in this channel!"];
        }
        delete this.muted[name];
        return ["all", sys.name(src)+" unmuted "+tar.toCorrectCase()+" in this channel!"];
    }
    if (group == "banned") {
        if (!this.banned.hasOwnProperty(name)) {
            return ["self", tar.toCorrectCase()+" is not banned from this channel!"];
        }
        delete this.banned[name];
        return ["all", sys.name(src)+" unbanned "+tar.toCorrectCase()+" from this channel!"];
    }
    return ["self", ""];
};

POChannel.prototype.issueAuth = function(src, name, group)
{
    var ret = this.addRole(src, name, group, {});
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], channel);
    }
    else {
        channelbot.sendAll(ret[1], channel);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.takeAuth = function(src, name, group)
{
    var ret = this.removeRole(src, name, group);
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], channel);
    }
    else {
        channelbot.sendAll(ret[1], channel);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.register = function(name)
{
    if (this.masters.length === 0) {
        this.masters.push(name.toLowerCase());
        SESSION.global().channelManager.update(this.id);
        return true;
    }
    return false;
};

POChannel.prototype.canJoin = function(id)
{
    if (this.isBanned(id)) {
        return "banned";
    }
    if (this.isChannelOperator(id)) {
        return "allowed";
    }
    if (typeof this.members != "object") {
        this.members = [];
    }
    if (this.members.indexOf(sys.name(id).toLowerCase()) > -1) {
        return "allowed";
    }
    return "nil";
};

POChannel.prototype.canTalk = function(id)
{
    return !this.isMuted(id);
};

POChannel.prototype.ban = function(src, tar, data)
{
    var ret = this.addRole(src, tar, "banned", data);
    if (ret[0] == "self") {
        if (typeof src == "number")
            channelbot.sendMessage(src, ret[1], channel);
    }
    else {
        channelbot.sendAll(ret[1], channel);
        SESSION.global().channelManager.update(this.id);
        // eject the offending user from the channel
        if (sys.id(tar) !== undefined) {
            if (sys.isInChannel(sys.id(tar), this.id)) {
                if (sys.channelsOfPlayer(sys.id(tar)).length <= 1 && !sys.isInChannel(sys.id(tar), 0)) {
                    sys.putInChannel(sys.id(tar), 0);
                }
                sys.kick(sys.id(tar), this.id);
                channelbot.sendAll("And "+tar+" was gone!", channel);
            }
        }
    }
};

POChannel.prototype.unban = function(src, tar)
{
    var ret = this.removeRole(src, tar, "banned");
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], channel);
    }
    else {
        channelbot.sendAll(ret[1], channel);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.mute = function(src, tar, data)
{
    var ret = this.addRole(src, tar, "muted", data);
    if (ret[0] == "self") {
        if (typeof src == "number")
            channelbot.sendMessage(src, ret[1], channel);
    }
    else {
        channelbot.sendAll(ret[1], channel);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.unmute = function(src, tar)
{
    var ret = this.removeRole(src, tar, "muted");
    if (ret[0] == "self") {
        channelbot.sendMessage(src, ret[1], channel);
    }
    else {
        channelbot.sendAll(ret[1], channel);
        SESSION.global().channelManager.update(this.id);
    }
};

POChannel.prototype.isBanned = function(id)
{
    // can't ban chan admins+
    if (this.isChannelAdmin(id)) {
        return false;
    }
    var banlist = this.banned;
    var ip = sys.ip(id);
    var name = sys.name(id);
    for (var x in banlist) {
        if(banlist.hasOwnProperty(x)) {
            if (!banlist[x].hasOwnProperty("expiry")) {
                delete this.banned[x];
                continue;
            }
            if (banlist[x].expiry <= parseInt(sys.time(),10)) {
                delete this.banned[x];
                continue;
            }
            if (cmp(x, name)) {
                return true;
            }
            if (sys.dbIp(x) == ip) {
                return true;
            }
        }
    }
    return false;
};

POChannel.prototype.isMuted = function(id)
{
    if (this.isChannelOperator(id)) {
        return false;
    }
    var mutelist = this.muted;
    var ip = sys.ip(id);
    var name = sys.name(id);
    for (var x in mutelist) {
        if (mutelist.hasOwnProperty(x)) {
            if (!mutelist[x].hasOwnProperty("expiry")) {
                delete this.muted[x];
                continue;
            }
            if (mutelist[x].expiry <= parseInt(sys.time(),10)) {
                delete this.muted[x];
                channelbot.sendAll(x+"'s channel mute expired.", channel);
                continue;
            }
            if (cmp(x, name)) {
                return true;
            }
            if (sys.dbIp(x) == ip) {
                return true;
            }
        }
    }
    return false;
};

POChannel.prototype.isPunished = function(name)
{
    var banlist = this.banned;
    for (var b in banlist) {
        if (banlist.hasOwnProperty(b)) {
            if (cmp(b, name)) {
                return "banned";
            }
            if (sys.dbIp(b) == sys.dbIp(name)) {
                return "banned";
            }
        }
    }
    var mutelist = this.muted;
    for (var m in mutelist) {
        if (mutelist.hasOwnProperty(m)) {
            if (cmp(m, name)) {
                return "muted";
            }
            if (sys.dbIp(m) == sys.dbIp(name)) {
                return "muted";
            }
        }
    }
    return "none";
};

POChannel.prototype.hasPermission = function(src, tar) {
    var srcauth = 0;
    if (typeof src == "string") {
        srcauth = 1;
    }
    else {
        if (this.isChannelOwner(src)) {
            srcauth = 3;
        }
        else if (this.isChannelAdmin(src)) {
            srcauth = 2;
        }
        else if (this.isChannelOperator(src)) {
            srcauth = 1;
        }
    }
    var tarauth = this.chanAuth(tar);
    return srcauth > tarauth;
};

POChannel.prototype.chanAuth = function(name) {
    var maxauth = 0;
    if (sys.dbAuth(name) >= 2 || this.id === 0) {
        maxauth = sys.dbAuth(name);
    }
    var lname = name.toLowerCase();
    if (typeof this.operators != 'object')
        this.operators = [];
    if (typeof this.admins != 'object')
        this.admins = [];
    if (typeof this.masters != 'object')
        this.masters = [];
    if (this.masters.indexOf(lname) > -1) {
        maxauth = 3;
    }
    else if (this.admins.indexOf(lname) > -1 && maxauth < 2) {
        maxauth = 2;
    }
    else if (this.operators.indexOf(lname) > -1 && maxauth < 1) {
        maxauth = 1;
    }
    return maxauth;
};

POChannel.prototype.changeParameter = function(src, parameter, value) {
    if (parameter == "topic") {
        this.topic = value;
        this.topicSetter = sys.name(src);
        return;
    }
    if (parameter == "allowcaps") {
        if (value === true) {
            this.ignorecaps = true;
        }
        else {
            this.ignorecaps = false;
        }
        SESSION.global().channelManager.update(this.id);
        return;
    }
    if (parameter == "allowflood") {
        if (value === true) {
            this.ignoreflood = true;
        }
        else {
            this.ignoreflood = false;
        }
        SESSION.global().channelManager.update(this.id);
        return;
    }
    if (parameter == "allowswear") {
        if (value === true) {
            this.allowSwear = true;
        }
        else {
            this.allowSwear = false;
        }
        SESSION.global().channelManager.update(this.id);
        return;
    }
    if (parameter == "invitelevel") {
        var level = parseInt(value, 10);
        var maxvalue = sys.auth(src) >= 3 ? 3 : sys.auth(src) + 1;
        if (level <= 0 || isNaN(level)) {
            level = 0;
        }
        else if (level > maxvalue) {
            level = maxvalue;
        }
        this.inviteonly = level;
        SESSION.global().channelManager.update(this.id);
        if (level === 0) {
            return sys.name(src)+" made this channel public.";
        }
        else {
            return sys.name(src)+" made this channel invite only for users below auth level "+level+".";
        }
    }
};

POChannel.prototype.getReadableList = function(type)
{
    try {
        var name = "";
        var mh = {};
        if (type == "mutelist") {
            mh = this.muted;
            name = "Channel Muted";
        }
        else if (type == "banlist") {
            mh = this.banned;
            name = "Channel Banned";
        }
        else {
            return "";
        }
        var width=4;
        var max_message_length = 30000;
        var tmp = [];
        var t = parseInt(sys.time(), 10);
        var toDelete = [];
        for (var x in mh) {
            if (mh.hasOwnProperty(x)) {
            if (!mh[x].hasOwnProperty("expiry")) {
                continue;
            }
            var playername = utilities.html_escape(x);
            var expirytime = isNaN(mh[x].expiry) ? "never" : mh[x].expiry-parseInt(sys.time(),10);
            if (expirytime <= 0) {
                continue;
            }
            var issuetime = getTimeString(parseInt(sys.time(),10)-mh[x].issuetime);
            var auth = utilities.html_escape(mh[x].auth);
            var reason = utilities.html_escape(mh[x].reason);
            tmp.push([playername, auth, issuetime, isNaN(mh[x].expiry) ? expirytime : getTimeString(expirytime), reason]);
            }
        }
        tmp.sort(function(a,b) { return a[2] - b[2];});

        // generate HTML
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
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
                // Really need to return multiple tables from this function... return a list??
                // Or give a callback
                // sendChanHtmlMessage(src, table, channel);
                table = table_header;
                send_rows = 0;
            }
            table += line;
            ++send_rows;
        }
        table += table_footer;
        if (send_rows > 0) {
            return table;
        }
        else {
            return "";
        }
    }
    catch (e) {
        return "";
    }
};

/* Object that manages channels */
function POChannelManager(fname)
{
    /* Permanent channels */
    this.channelDataFile = fname;
    try {
        this.channelMap = JSON.parse(sys.getFileContent(this.channelDataFile));
    } catch (err) {
        print('Could not read channelData.');
        print('Error: ' + err);
        this.channelMap = {};
    }
    sys.makeDir("channeldata");
}

POChannelManager.prototype.toString = function()
{
    return "[object POChannelManager]";
};

POChannelManager.prototype.copyAttrs = [
    "topic",
    "topicSetter",
    "perm",
    "members",
    "operators",
    "admins",
    "masters",
    "inviteonly",
    "muteall",
    "meoff",
    "muted",
    "banned",
    "ignorecaps",
    "ignoreflood"
];

POChannelManager.prototype.update = function(channel)
{
    var chan = SESSION.channels(channel);
    var chanData = {};
    this.copyAttrs.forEach(function(attr) {
        chanData[attr] = chan[attr];
    });
    this.saveChan(channel, chanData);
};

POChannelManager.prototype.restoreSettings = function(channel)
{
    var chan = SESSION.channels(channel);
    var chanData = this.loadChan(channel);
    this.copyAttrs.forEach(function(attr) {
        if (chanData !== null && chanData.hasOwnProperty(attr))
            chan[attr] = chanData[attr];
    });
};

POChannelManager.prototype.dataFileFor = function(channel)
{
    var chanName = sys.channel(channel);
    if (!this.channelMap.hasOwnProperty(chanName)) {
       var genName = "channeldata/" + Date.now() + Math.random().toString().substr(2) + ".json";
       this.channelMap[chanName] = genName;
       this.save();
    }
    return this.channelMap[chanName];
};

POChannelManager.prototype.save = function()
{
    sys.writeToFile(this.channelDataFile, JSON.stringify(this.channelMap));
};

POChannelManager.prototype.saveChan = function(channel, channelData)
{
    var channelDataFile = this.dataFileFor(channel);
    sys.writeToFile(channelDataFile, JSON.stringify(channelData));
};

POChannelManager.prototype.loadChan = function(channel)
{
    var channelDataFile = this.dataFileFor(channel);
    var content = sys.getFileContent(channelDataFile);
    if (content) {
        try {
            var data = JSON.parse(content);
            return data;
        } catch(e) {}
    }
    return {};
};

POChannelManager.prototype.createPermChannel = function(name, defaultTopic)
{
    var cid;
    if (sys.existChannel(name)) {
        cid = sys.channelId(name);
    } else {
        cid = sys.createChannel(name);
    }
    this.restoreSettings(cid);
    if (!SESSION.channels(cid).topic) {
        SESSION.channels(cid).topic = defaultTopic;
    }
    SESSION.channels(cid).perm = true;
    return cid;
};

function POGlobal(id)
{
    var plugin_files = Config.Plugins;
    var plugins = [];
    for (var i = 0; i < plugin_files.length; ++i) {
        var plugin = require(plugin_files[i]);
        plugin.source = plugin_files[i];
        plugins.push(plugin);
    }
    this.plugins = plugins;
    this.coins = 0;
    this.channelManager = new POChannelManager('channelHash.json');
    var manager = this.channelManager;
    sys.channelIds().forEach(function(id) {
        manager.restoreSettings(id);
    });
}

POGlobal.prototype.callplugins = function callplugins(event) {
    /* if a plugin wishes to stop event, it should return true */
    var plugins = this.plugins;
    var ret = false;
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < plugins.length; ++i) {
        if (plugins[i].hasOwnProperty(event)) {
            try {
                if (plugins[i][event].apply(plugins[i], args)) {
                    ret = true;
                    break;
                }
            } catch (e) {
                sys.sendAll('Plugins-error on {0}: {1}'.format(plugins[i].source, e + (e.lineNumber ? " on line: " + e.lineNumber : "")), staffchannel);
            }
        }
    }
    return ret;
};

POGlobal.prototype.getplugins = function getplugins(data) {
    var plugins = this.plugins;
    var ret = {};
    for (var i = 0; i < plugins.length; ++i) {
        if (plugins[i].hasOwnProperty(data)) {
            ret[plugins[i].source] = plugins[i][data];
        }
    }
    return ret;
};

function callplugins() {
    return SESSION.global().callplugins.apply(SESSION.global(), arguments);
}
function getplugins() {
    return SESSION.global().getplugins.apply(SESSION.global(), arguments);
}

SESSION.identifyScriptAs("PO Scripts v0.99");
SESSION.registerGlobalFactory(POGlobal);
SESSION.registerUserFactory(POUser);
SESSION.registerChannelFactory(POChannel);

if (typeof SESSION.global() != 'undefined') {
    SESSION.global().channelManager = new POChannelManager('channelHash.json');

    SESSION.global().__proto__ = POGlobal.prototype;
    var plugin_files = Config.Plugins;
    var plugins = [];
    for (var i = 0; i < plugin_files.length; ++i) {
        var plugin = require(plugin_files[i]);
        plugin.source = plugin_files[i];
        plugins.push(plugin);
    }
    SESSION.global().plugins = plugins;

    // uncomment to update either Channel or User
    sys.channelIds().forEach(function(id) {
        if (!SESSION.channels(id))
            sys.sendAll("ScriptUpdate: SESSION storage broken for channel: " + sys.channel(id), staffchannel);
        else
            SESSION.channels(id).__proto__ = POChannel.prototype;
    });
    sys.playerIds().forEach(function(id) {
        if (sys.loggedIn(id)) {
            var user = SESSION.users(id);
            if (!user) {
                sys.sendAll("ScriptUpdate: SESSION storage broken for user: " + sys.name(id), staffchannel);
            } else {
                user.__proto__ = POUser.prototype;
                user.battles = user.battles || {};
            }
        }
    });

}

// Bot.js binds the global variable 'channel' so we cannot re-use it
// since the binding will to the old variable.
delete require.cache['bot.js'];
var Bot = require('bot.js').Bot;

normalbot = bot = new Bot(Config.bot);
mafiabot = new Bot(Config.Mafia.bot);
channelbot = new Bot(Config.channelbot);
kickbot = new Bot(Config.kickbot);
capsbot = new Bot(Config.capsbot);
checkbot = new Bot(Config.checkbot);
coinbot = new Bot(Config.coinbot);
countbot = new Bot(Config.countbot);
tourneybot = new Bot(Config.tourneybot);
rankingbot = new Bot(Config.rankingbot);
battlebot = new Bot(Config.battlebot);
commandbot = new Bot(Config.commandbot);
querybot = new Bot(Config.querybot);
hangbot = new Bot(Config.hangbot);
bfbot = new Bot(Config.bfbot);

/* Start script-object
 *
 * All the events are defined here
 */

var lastStatUpdate = new Date();
poScript=({
/* Executed every second */
step: function() {
    if (typeof callplugins == "function") callplugins("stepEvent");
    
    var date = new Date();
    if (date.getUTCMinutes() === 10 && date.getUTCSeconds() === 0) {
        sys.get_output("nc -z server.pokemon-online.eu 10508", function callback(exit_code) {
            if (exit_code !== 0) {
                sys.sendAll("±NetCat: Cannot reach Webclient Proxy - it may be down.");
            }
        }, function errback(error) {
                sys.sendAll("±NetCat: Cannot reach Webclient Proxy - it may be down: " + error);
        });
        clearTeamFiles();
    }
    if ([0, 6, 12, 18].indexOf(date.getUTCHours()) != -1 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
        sendNotice();
    }
    // Reset stats monthly
    var JSONP_FILE = "usage_stats/formatted/stats.jsonp";
    if (lastCleared != date.getUTCMonth()) {
        lastCleared = date.getUTCMonth();
        battlesFought = 0;
        sys.saveVal("Stats/BattlesFought", 0);
        sys.saveVal("Stats/LastCleared", lastCleared);
        sys.saveVal("Stats/MafiaGamesPlayed", 0);
    }
    if (date - lastStatUpdate > 60) {
        lastStatUpdate = date;
        // QtScript is able to JSON.stringify dates
        var stats = {
            lastUpdate: date,
            usercount: sys.playerIds().filter(sys.loggedIn).length,
            battlesFought: battlesFought,
            mafiaPlayed: +sys.getVal("Stats/MafiaGamesPlayed")
        };
        sys.writeToFile(JSONP_FILE, "setServerStats(" + JSON.stringify(stats) + ");");
    }
},

serverStartUp : function() {
    SESSION.global().startUpTime = +sys.time();
    scriptChecks = 0;
    this.init();
},

init : function() {
    lastMemUpdate = 0;
    bannedUrls = [];
    battlesFought = +sys.getVal("Stats/BattlesFought");
    lastCleared = +sys.getVal("Stats/LastCleared");

    mafiachan = SESSION.global().channelManager.createPermChannel("Mafia", "Use /help to get started!");
    staffchannel = SESSION.global().channelManager.createPermChannel("Indigo Plateau", "Welcome to the Staff Channel! Discuss of all what users shouldn't hear here! Or more serious stuff...");
    sachannel = SESSION.global().channelManager.createPermChannel("Victory Road","Welcome MAs and SAs!");
    tourchannel = SESSION.global().channelManager.createPermChannel("Tournaments", 'Useful commands are "/join" (to join a tournament), "/unjoin" (to leave a tournament), "/viewround" (to view the status of matches) and "/megausers" (for a list of users who manage tournaments). Please read the full Tournament Guidelines: http://pokemon-online.eu/forums/showthread.php?2079-Tour-Rules');
    watchchannel = SESSION.global().channelManager.createPermChannel("Watch", "Alerts displayed here");
    triviachan = SESSION.global().channelManager.createPermChannel("Trivia", "Play trivia here!");
    revchan = SESSION.global().channelManager.createPermChannel("TrivReview", "For Trivia Admins to review questions");
    mafiarev = SESSION.global().channelManager.createPermChannel("Mafia Review", "For Mafia Admins to review themes");
    hangmanchan = SESSION.global().channelManager.createPermChannel("Hangman", "Type /help to see how to play!");
    blackjackchan = SESSION.global().channelManager.createPermChannel("Blackjack", "Play Blackjack here!");

    var dwlist = ["Timburr", "Gurdurr", "Conkeldurr", "Pansage", "Pansear", "Panpour", "Simisear", "Simisage", "Simipour", "Ekans", "Arbok", "Paras", "Parasect", "Happiny", "Chansey", "Blissey", "Munchlax", "Snorlax", "Aipom", "Ambipom", "Pineco", "Forretress", "Wurmple", "Silcoon", "Cascoon", "Beautifly", "Dustox", "Seedot", "Nuzleaf", "Shiftry", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Plusle", "Minun", "Budew", "Roselia", "Gulpin", "Swalot", "Kecleon", "Kricketot", "Kricketune", "Cherubi", "Cherrim", "Carnivine", "Audino", "Throh", "Sawk", "Scraggy", "Scrafty", "Rattata", "Raticate", "Nidoran-F", "Nidorina", "Nidoqueen", "Nidoran-M", "Nidorino", "Nidoking", "Oddish", "Gloom", "Vileplume", "Bellossom", "Bellsprout", "Weepinbell", "Victreebel", "Ponyta", "Rapidash", "Farfetch'd", "Doduo", "Dodrio", "Exeggcute", "Exeggutor", "Lickitung", "Lickilicky", "Tangela", "Tangrowth", "Kangaskhan", "Sentret", "Furret", "Cleffa", "Clefairy", "Clefable", "Igglybuff", "Jigglypuff", "Wigglytuff", "Mareep", "Flaaffy", "Ampharos", "Hoppip", "Skiploom", "Jumpluff", "Sunkern", "Sunflora", "Stantler", "Poochyena", "Mightyena", "Lotad", "Ludicolo", "Lombre", "Taillow", "Swellow", "Surskit", "Masquerain", "Bidoof", "Bibarel", "Shinx", "Luxio", "Luxray", "Psyduck", "Golduck", "Growlithe", "Arcanine", "Scyther", "Scizor", "Tauros", "Azurill", "Marill", "Azumarill", "Bonsly", "Sudowoodo", "Girafarig", "Miltank", "Zigzagoon", "Linoone", "Electrike", "Manectric", "Castform", "Pachirisu", "Buneary", "Lopunny", "Glameow", "Purugly", "Natu", "Xatu", "Skitty", "Delcatty", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Bulbasaur", "Charmander", "Squirtle", "Ivysaur", "Venusaur", "Charmeleon", "Charizard", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Infernape", "Monferno", "Piplup", "Prinplup", "Empoleon", "Treecko", "Sceptile", "Grovyle", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Caterpie", "Metapod", "Butterfree", "Pidgey", "Pidgeotto", "Pidgeot", "Spearow", "Fearow", "Zubat", "Golbat", "Crobat", "Aerodactyl", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Yanma", "Yanmega", "Murkrow", "Honchkrow", "Delibird", "Wingull", "Pelipper", "Swablu", "Altaria", "Starly", "Staravia", "Staraptor", "Gligar", "Gliscor", "Drifloon", "Drifblim", "Skarmory", "Tropius", "Chatot", "Slowpoke", "Slowbro", "Slowking", "Krabby", "Kingler", "Horsea", "Seadra", "Kingdra", "Goldeen", "Seaking", "Magikarp", "Gyarados", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Wooper", "Quagsire", "Qwilfish", "Corsola", "Remoraid", "Octillery", "Mantine", "Mantyke", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Barboach", "Whiscash", "Clamperl", "Gorebyss", "Huntail", "Relicanth", "Luvdisc", "Buizel", "Floatzel", "Finneon", "Lumineon", "Tentacool", "Tentacruel", "Corphish", "Crawdaunt", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Shellos", "Gastrodon", "Lapras", "Dratini", "Dragonair", "Dragonite", "Elekid", "Electabuzz", "Electivire", "Poliwag", "Poliwrath", "Politoed", "Poliwhirl", "Vulpix", "Ninetales", "Musharna", "Munna", "Darmanitan", "Darumaka", "Mamoswine", "Togekiss", "Burmy", "Wormadam", "Mothim", "Pichu", "Pikachu", "Raichu","Abra","Kadabra","Alakazam","Spiritomb","Mr. Mime","Mime Jr.","Meditite","Medicham","Meowth","Persian","Shuppet","Banette","Spinarak","Ariados","Drowzee","Hypno","Wobbuffet","Wynaut","Snubbull","Granbull","Houndour","Houndoom","Smoochum","Jynx","Ralts","Gardevoir","Gallade","Sableye","Mawile","Volbeat","Illumise","Spoink","Grumpig","Stunky","Skuntank","Bronzong","Bronzor","Mankey","Primeape","Machop","Machoke","Machamp","Magnemite","Magneton","Magnezone","Koffing","Weezing","Rhyhorn","Rhydon","Rhyperior","Teddiursa","Ursaring","Slugma","Magcargo","Phanpy","Donphan","Magby","Magmar","Magmortar","Larvitar","Pupitar","Tyranitar","Makuhita","Hariyama","Numel","Camerupt","Torkoal","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Absol","Beldum","Metang","Metagross","Hippopotas","Hippowdon","Skorupi","Drapion","Tyrogue","Hitmonlee","Hitmonchan","Hitmontop","Bagon","Shelgon","Salamence","Seel","Dewgong","Shellder","Cloyster","Chinchou","Lanturn","Smeargle","Porygon","Porygon2","Porygon-Z","Drilbur", "Excadrill", "Basculin", "Basculin-a", "Alomomola", "Stunfisk", "Druddigon", "Foongus", "Amoonguss", "Liepard", "Purrloin", "Minccino", "Cinccino", "Sandshrew", "Sandslash", "Vullaby", "Mandibuzz", "Braviary", "Frillish", "Jellicent", "Weedle", "Kakuna", "Beedrill", "Shroomish", "Breloom", "Zangoose", "Seviper", "Combee", "Vespiquen", "Patrat", "Watchog", "Blitzle", "Zebstrika", "Woobat", "Swoobat", "Mienfoo", "Mienshao", "Bouffalant", "Staryu", "Starmie", "Togepi", "Shuckle", "Togetic", "Rotom", "Sigilyph", "Riolu", "Lucario", "Lugia", "Ho-Oh", "Dialga", "Palkia", "Giratina", "Grimer", "Muk", "Ditto", "Venonat", "Venomoth", "Herdier", "Lillipup", "Stoutland", "Sewaddle", "Swadloon", "Leavanny", "Cubchoo", "Beartic", "Landorus", "Thundurus", "Tornadus","Dunsparce", "Sneasel", "Weavile", "Nosepass", "Probopass", "Karrablast", "Escavalier", "Shelmet", "Accelgor", "Snorunt", "Glalie", "Froslass", "Pinsir", "Emolga", "Heracross", "Trubbish", "Garbodor", "Snover", "Abomasnow","Diglett", "Dugtrio", "Geodude", "Graveler", "Golem", "Onix", "Steelix", "Voltorb", "Electrode", "Cubone", "Marowak", "Whismur", "Loudred", "Exploud", "Aron", "Lairon", "Aggron", "Spheal", "Sealeo", "Walrein", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Gible", "Gabite", "Garchomp", "Pidove", "Tranquill", "Unfezant", "Tympole", "Palpitoad", "Seismitoad", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Ducklett", "Swanna", "Deerling", "Sawsbuck", "Elgyem", "Beheeyem", "Pawniard", "Bisharp", "Heatmor", "Durant","Venipede","Whirlipede", "Scolipede", "Tirtouga", "Carracosta", "Joltik", "Galvantula", "Maractus", "Dwebble", "Crustle", "Roggenrola", "Boldore", "Gigalith", "Vanillite", "Vanillish", "Vanilluxe", "Klink", "Klang", "Klinklang", "Swinub", "Piloswine", "Golett", "Golurk", "Gothitelle", "Gothorita", "Solosis", "Duosion", "Reuniclus", "Deerling-Summer", "Deerling-Autumn", "Deerling-Winter", "Sawsbuck-Summer", "Sawsbuck-Autumn", "Sawsbuck-Winter", "Roserade", "Mewtwo"];

    /* use hash for faster lookup */
    dwpokemons = {};
    var announceChan = (typeof staffchannel == "number") ? staffchannel : 0;
    var dwpok;
    for (dwpok = 0; dwpok < dwlist.length; dwpok++) {
        var num = sys.pokeNum(dwlist[dwpok]);
        if (num === undefined)
            sys.sendAll("Script Check: Unknown poke in dwpokemons: '" +dwlist[dwpok]+"'.", announceChan, channel);
        else if (dwpokemons[num] === true)
            sys.sendAll("Script Check:  dwpokemons contains '" +dwlist[dwpok]+"' multiple times.", announceChan, channel);
        else
            dwpokemons[sys.pokeNum(dwlist[dwpok])] = true;
    }

    var lclist = ["Bulbasaur", "Charmander", "Squirtle", "Croagunk", "Turtwig", "Chimchar", "Piplup", "Treecko","Torchic","Mudkip", "Pansage", "Pansear", "Panpour"];
    lcpokemons = lclist.map(sys.pokeNum);
    lcmoves = {
        "Bronzor":["Iron Defense"],
        "Golett":["Rollout","Shadow Punch","Iron Defense","Mega Punch","Magnitude","DynamicPunch","Night Shade","Curse","Hammer Arm","Focus Punch"],
        "Klink":["Charge","Thundershock","Gear Grind","Bind","Mirror Shot","Screech","Discharge","Metal Sound","Shift Gear","Lock-On","Zap Cannon"],
        "Petilil":["Entrainment"],
        "Rufflet":["Wing Attack","Scary Face","Slash","Defog","Air Slash","Crush Claw","Whirlwind","Brave Bird","Thrash"]
    };
    bannedGSCSleep = [sys.moveNum("Spore"), sys.moveNum("Hypnosis"), sys.moveNum("Lovely Kiss"), sys.moveNum("Sing"), sys.moveNum("Sleep Powder")].sort();
    bannedGSCTrap = [sys.moveNum("Mean Look"), sys.moveNum("Spider Web")].sort();

    var breedingList = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Hitmonlee","Hitmonchan","Hitmontop","Tyrogue", "Porygon", "Porygon2", "Porygon-Z", "Gothorita", "Gothitelle","Pansage", "Pansear", "Panpour", "Simisear", "Simisage", "Simipour"];
    breedingpokemons = breedingList.map(sys.pokeNum);

    /* restore mutes, smutes, mafiabans, rangebans, megausers */
    mutes = new MemoryHash("mutes.txt");
    mbans = new MemoryHash("mbans.txt");
    smutes = new MemoryHash("smutes.txt");
    rangebans = new MemoryHash("rangebans.txt");
    contributors = new MemoryHash("contributors.txt");
    mafiaAdmins = new MemoryHash("mafiaadmins.txt");
    mafiaSuperAdmins = new MemoryHash("mafiasuperadmins.txt");
    hangmanAdmins = new MemoryHash("hangmanadmins.txt");
    hangmanSuperAdmins = new MemoryHash("hangmansuperadmins.txt");
    ipbans = new MemoryHash("ipbans.txt");
    detained = new MemoryHash("detained.txt");
    hbans = new MemoryHash("hbans.txt");
    namesToWatch = new MemoryHash(Config.dataDir+"namesToWatch.txt");
    proxy_ips = {};
    function addProxybans(content) {
        var lines = content.split(/\n/);
        for (var k = 0; k < lines.length; ++k) {
            var proxy_ip = lines[k].split(":")[0];
            if (proxy_ip !== 0) proxy_ips[proxy_ip] = true;
        }
    }
    var PROXY_FILE = "proxy_list.txt";
    var content = sys.getFileContent(PROXY_FILE);
    if (content) { addProxybans(content); }
    else sys.webCall(Config.base_url + PROXY_FILE, addProxybans);

    rules = [ "",
    "*** Pokémon Online Server Rules ***",
    "",
    "1. Pokemon Online is an international server:",
    "- Respect other peoples' cultures and do not demand they speak English. Everyone is welcome at Pokemon Online, as long as they follow the rules.",
    "2. No advertising, excessive messages, inappropriate/obscene links, or text art:",
    "- Do not post links unless they are to notable sites (Youtube, Smogon, Serebii, etc). We are not interested in your start-up community. Do not monopolize the chat with large amounts of messages, or short ones in rapid succession. Posting ASCII art is punishable with a ban, as is posting anything with any type of pornography.",
    "3. Use Find Battle, or join tournaments instead of asking in the main chat:",
    "- The official channels on Pokemon Online have too much activity to allow battle requests in the chat. Use Find Battle or go join the tournaments channel and participate. The only exception is if you are unable to find a battle for a low-played tier, then asking once every 5 minutes or so is acceptable.",
    "4. Do not ask for authority:",
    "- By asking, you may have eliminated your chances of becoming one in the future. If you are genuinely interested in becoming a staff member then a good way to get noticed is to become an active member of the community. Engaging others in intelligent chats and offering to help with graphics, programming, the wiki, or our YouTube channel (among others) is a good way to get noticed.",
    "5. No trolling, flaming, or harassing other players. Do not complain about hax in the chat, beyond a one line comment:",
    "- Inciting responses with inflammatory comments, using verbal abuse against other players, or spamming them via chat/PM/challenges will not be tolerated. Harassing other players by constantly aggravating them or revealing personal information will be severely punished. A one line comment regarding hax after a loss to vent is fine, but excessive bemoaning is not acceptable. Excessive vulgarity will not be tolerated. Wasting the time of the authority will also result in punishment.",
    "6. Do not attempt to circumvent the rules:",
    "- Ignorance of the rules is not a valid reason for breaking them. Do not attempt to find or create any loopholes in these rules, or try to adapt them in order to have a punishment overturned or to justify your actions. Doing so may incur a further punishment. Make valid appeals directly to the authority of the server."
    ];

    if (typeof authStats == 'undefined')
        authStats = {};

    if (typeof nameBans == 'undefined') {
        nameBans = [];
        try {
            var serialized = JSON.parse(sys.getFileContent("nameBans.json"));
            for (var i = 0; i < serialized.nameBans.length; ++i) {
                nameBans.push(new RegExp(serialized.nameBans[i], "i"));
            }
        } catch (e) {
            // ignore
        }
    }
    if (typeof nameWarns == 'undefined') {
        nameWarns = [];
        try {
            var serialized = JSON.parse(sys.getFileContent("nameWarns.json"));
            for (var i = 0; i < serialized.nameWarns.length; ++i) {
                nameWarns.push(new RegExp(serialized.nameWarns[i], "i"));
            }
        } catch (e) {
            // ignore
        }
    }

    if (SESSION.global().battleinfo === undefined) {
        SESSION.global().battleinfo = {};
    }

    if (SESSION.global().BannedUrls === undefined) {
        SESSION.global().BannedUrls = [];
        sys.webCall(Config.base_url + "bansites.txt", function(resp) {
            SESSION.global().BannedUrls = resp.toLowerCase().split(/\n/);
        });
    }

    isSuperAdmin = function(id) {
        if (typeof Config.superAdmins != "object" || Config.superAdmins.length === undefined) return false;
        if (sys.auth(id) != 2) return false;
        var name = sys.name(id);
        for (var i = 0; i < Config.superAdmins.length; ++i) {
            if (cmp(name, Config.superAdmins[i]))
                return true;
        }
        return false;
    };

    if (typeof VarsCreated != 'undefined')
        return;

    key = function(a,b) {
        return a + "*" + sys.ip(b);
    };

    saveKey = function(thing, id, val) {
        sys.saveVal(key(thing,id), val);
    };

    getKey = function(thing, id) {
        return sys.getVal(key(thing,id));
    };

    cmp = function(a, b) {
        return a.toLowerCase() == b.toLowerCase();
    };

    battlesStopped = false;

    maxPlayersOnline = 0;

    lineCount = 0;

    pokeNatures = [];

    var list = "Heatran-Eruption/Quiet=Suicune-ExtremeSpeed/Relaxed|Sheer Cold/Relaxed|Aqua Ring/Relaxed|Air Slash/Relaxed=Raikou-ExtremeSpeed/Rash|Weather Ball/Rash|Zap Cannon/Rash|Aura Sphere/Rash=Entei-ExtremeSpeed/Adamant|Flare Blitz/Adamant|Howl/Adamant|Crush Claw/Adamant=Snivy-Aromatherapy/Hardy|Synthesis/Hardy=Genesect-Extremespeed/Hasty|Blaze Kick/Hasty|Shift Gear/Hasty";
    //this is really awful btw :(
    var sepPokes = list.split('='),
        sepMovesPoke, sepMoves, movenat;
    for (var x = 0; x < sepPokes.length; x++) {
        sepMovesPoke = sepPokes[x].split('-');
        sepMoves = sepMovesPoke[1].split('|');

        var poke = sys.pokeNum(sepMovesPoke[0]);
        pokeNatures[poke] = [];

        for (var y = 0; y < sepMoves.length; ++y) {
            movenat = sepMoves[y].split('/');
            pokeNatures[poke][sys.moveNum(movenat[0])] = sys.natureNum(movenat[1]);
        }
    }

    try {
        pastebin_api_key = sys.getFileContent(Config.dataDir+"pastebin_api_key").replace("\n", "");
        pastebin_user_key = sys.getFileContent(Config.dataDir+"pastebin_user_key").replace("\n", "");
    } catch(e) {
        normalbot.sendAll("Couldn't load api keys: " + e, staffchannel);
    }

    sendMainTour = function(message) {
        sys.sendAll(message, 0, channel);
        sys.sendAll(message, tourchannel, channel);
    };

    callplugins("init");

    VarsCreated = true;
}, /* end of init */


issueBan : function(type, src, tar, commandData, maxTime) {
        var memoryhash = {"mute": mutes, "mban": mbans, "smute": smutes, "hban": hbans}[type];
        var banbot = type == "mban" ? mafiabot : normalbot;
        var verb = {"mute": "muted", "mban": "banned from mafia", "smute": "secretly muted", "hban": "banned from hangman"}[type];
        var nomi = {"mute": "mute", "mban": "ban from mafia", "smute": "secret mute", "hban": "ban from hangman"}[type];
        var sendAll =  {
            "smute": function(line) {
                banbot.sendAll(line, staffchannel);
                line = line.replace(" by " +sys.name(src), "");
                sys.dbAuths().map(sys.id).filter(function(uid) { return uid !== undefined; }).forEach(function(uid) {
                        banbot.sendMessage(uid, line);
                });
            },
            "mban": function(line) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, mafiachan);
                banbot.sendAll(line, sachannel);
            },
            "mute": function(line) {
                banbot.sendAll(line);
            },
            "hban" : function(line) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, hangmanchan);
                banbot.sendAll(line, sachannel);
            }
        }[type];

        var expires = 0;
        var defaultTime = {"mute": "24h", "mban": "1d", "smute": "0", "hban": "1d"}[type];
        var reason = "";
        var timeString = "";
        var tindex = 10;
        var data = [];
        var ip;
        if (tar === undefined) {
            data = commandData.split(":");
            if (data.length > 1) {
                commandData = data[0];
                tar = sys.id(commandData);

                if (data.length > 2 && /http$/.test(data[1])) {
                    reason = data[1] + ":" + data[2];
                    tindex = 3;
                } else {
                    reason = data[1];
                    tindex = 2;
                }
                if (tindex==data.length && reason.length > 0 && reason.charCodeAt(0) >= 48 && reason.charCodeAt(0) <= 57) {
                    tindex-=1;
                    reason="";
                }
            }
        }

        var secs = getSeconds(data.length > tindex ? data[tindex] : defaultTime);
        // limit it!
        if (typeof maxTime == "number") secs = (secs > maxTime || secs === 0 || isNaN(secs)) ? maxTime : secs;
        if (secs > 0) {
            timeString = getTimeString(secs);
            expires = secs + parseInt(sys.time(), 10);
        }
        if (reason === "" && sys.auth(src) < 3) {
           banbot.sendMessage(src, "You need to give a reason to the " + nomi + "!", channel);
           return;
        }
        var tarip = tar !== undefined ? sys.ip(tar) : sys.dbIp(commandData);
        if (tarip === undefined) {
            banbot.sendMessage(src, "Couldn't find " + commandData, channel);
            return;
        }
        var maxAuth = sys.maxAuth(tarip);
        if (maxAuth>=sys.auth(src) && maxAuth > 0) {
            banbot.sendMessage(src, "You don't have sufficient auth to " + nomi + " " + commandData + ".", channel);
            return;
        }
        var active = false;
        if (memoryhash.get(tarip)) {
            if (sys.time() - memoryhash.get(tarip).split(":")[0] < 15) {
                banbot.sendMessage(src, "This person was recently " + verb, channel);
                return;
            }
            active = true;
        }
        if (sys.loggedIn(tar)) {
            if (SESSION.users(tar)[type].active) {
                active = true;
            }
        }
        sys.playerIds().forEach(function(id) {
            if (sys.loggedIn(id) && sys.ip(id) === tarip)
                SESSION.users(id).activate(type, sys.name(src), expires, reason, true);
        });
        if (!sys.loggedIn(tar)) {
            memoryhash.add(tarip, sys.time() + ":" + sys.name(src) + ":" + expires + ":" + commandData + ":" + reason);
        }
        
        sendAll((active ? nonFlashing(sys.name(src)) + " changed " + commandData + "'s " + nomi + " time to " + (timeString === "" ? "forever!" : timeString + " from now!") : commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + (timeString === "" ? "" : " for ") + timeString + "!") + (reason.length > 0 ? " [Reason: " + reason + "]" : "") + " [Channel: "+sys.channel(channel) + "]");
        var authority= sys.name(src).toLowerCase();
        authStats[authority] =  authStats[authority] || {};
        authStats[authority]["latest" + type] = [commandData, parseInt(sys.time(), 10)];
},

importable : function(id, team, compactible) {
/*
Tyranitar (M) @ Choice Scarf
Lvl: 100
Trait: Sand Stream
IVs: 0 Spd
EVs: 4 HP / 252 Atk / 252 Spd
Jolly Nature (+Spd, -SAtk)
- Stone Edge
- Crunch
- Superpower
- Pursuit
*/
    if (compactible === undefined) compactible = false;
    var nature_effects = {"Adamant": "(+Atk, -SAtk)", "Bold": "(+Def, -Atk)"};
    var genders = {0: '', 1: ' (M)', 2: ' (F)'};
    var stat = {0: 'HP', 1: 'Atk', 2: 'Def', 3: 'SAtk', 4: 'SDef', 5:'Spd'};
    var hpnum = sys.moveNum("Hidden Power");
    var ret = [];
    for (var i = 0; i < 6; ++i) {
      var poke = sys.teamPoke(id, team, i);
        if (poke === undefined)
            continue;
        // exclude missingno
        if (poke === 0)
            continue;

        var item = sys.teamPokeItem(id, team, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        ret.push(sys.pokemon(poke) + genders[sys.teamPokeGender(id, team, i)] + " @ " + item );
        ret.push('Trait: ' + sys.ability(sys.teamPokeAbility(id, team, i)));
        var level = sys.teamPokeLevel(id, team, i);
        if (!compactible && level != 100) ret.push('Lvl: ' + level);

        var ivs = [];
        var evs = [];
        var hpinfo = [sys.gen(id, team)];
        for (var j = 0; j < 6; ++j) {
            var iv = sys.teamPokeDV(id, team, i, j);
            if (iv != 31) ivs.push(iv + " " + stat[j]);
            var ev = sys.teamPokeEV(id, team, i, j);
            if (ev !== 0) evs.push(ev + " " + stat[j]);
            hpinfo.push(iv);
        }
        if (!compactible && ivs.length > 0)
            ret.push('IVs: ' + ivs.join(" / "));
        if (evs.length > 0)
            ret.push('EVs: ' + evs.join(" / "));

        ret.push(sys.nature(sys.teamPokeNature(id, team, i)) + " Nature"); // + (+Spd, -Atk)

        for (j = 0; j < 4; ++j) {
            var move = sys.teamPokeMove(id, team, i, j);
            if (move !== undefined) {
                ret.push('- ' + sys.move(move) + (move == hpnum ? ' [' + sys.type(sys.hiddenPowerType.apply(sys, hpinfo)) + ']':''));
            }
        }
        ret.push("");
    }
    return ret;
},

canJoinStaffChannel : function(src) {
    var disallowedNames = Config.disallowStaffChannel;
    if (disallowedNames.indexOf(sys.name(src)) > -1)
        return false;
    if (sys.auth(src) > 0)
        return true;
    if (SESSION.users(src).megauser)
        return true;
    if (SESSION.users(src).contributions !== undefined)
        return true;
    var allowedNames = Config.canJoinStaffChannel;
    if (allowedNames.indexOf(sys.name(src)) > -1)
        return true;
    return false;
},

isOfficialChan : function (chanid) {
    var officialchans = [0, tourchannel, mafiachan, triviachan, hangmanchan];
    if (officialchans.indexOf(chanid) > -1)
        return true;
    else
        return false;
},

kickAll : function(ip) {
    var players = sys.playerIds();
    var players_length = players.length;
    for (var i = 0; i < players_length; ++i) {
        var current_player = players[i];
        if (ip == sys.ip(current_player)) {
            sys.kick(current_player);
        }
    }
    return;
},

beforeChannelJoin : function(src, channel) {
    var poUser = SESSION.users(src);
    var poChannel = SESSION.channels(channel);

    callplugins("beforeChannelJoin", src, channel);

    // Can't ban from main
    if (channel === 0) return;
    
    if (channel == sys.channelId("Mafia Channel")) {
        sys.stopEvent();
        sys.putInChannel(src, sys.channelId("Mafia"));
    }
    if (channel === sys.channelId('Hangman Game')) {
        sys.stopEvent();
        sys.putInChannel(src, hangmanchan);
    }
    /* Tours redirect */
    if (channel == sys.channelId("Tours")) {
        sys.stopEvent();
        sys.putInChannel(src, tourchannel);
        return;
    }
    if (channel == sys.channelId("shanaindigo")) {
        sys.stopEvent();
        sys.putInChannel(src, sachannel);
        return;
    }
    if (sys.auth(src) < 3 && poChannel.canJoin(src) == "banned") {
        channelbot.sendMessage(src, "You are banned from this channel! You can't join unless channel operators and masters unban you.");
        sys.stopEvent();
        return;
    }
    if (poChannel.canJoin(src) == "allowed") {
        return;
    }
    if (poChannel.inviteonly > sys.auth(src)) {
        sys.sendMessage(src, "+Guard: Sorry, but this channel is for higher authority!");
        sys.stopEvent();
        return;
    }
    if ((channel == staffchannel || channel == sachannel) && !this.canJoinStaffChannel(src)) {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
    var channels = [mafiachan, hangmanchan];
    var bans = ["mban", "hban"];
    var type = ["Mafia", "Hangman"];
    for(var x = 0; x < channels.length; x++) {
        if (channel == channels[x] && poUser[bans[x]].active) {
            if (poUser.expired(bans[x])) {
                poUser.un(bans[x]);
                normalbot.sendMessage(src, "Your ban from " + type[x] + " expired.");
            } else {
                var info = poUser[bans[x]];
                sys.sendMessage(src, "+Guard: You are banned from " + type[x] + (info.by ? " by " + info.by : '')+". " + (info.expires > 0 ? "Ban expires in " + getTimeString(info.expires - parseInt(sys.time(), 10)) + ". " : '') + (info.reason ? "[Reason: " + info.reason + "]" : ''));
                sys.stopEvent();
                return;
            }
        }
    }
    if (channel == watchchannel && sys.auth(src) < 1) {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
}, /* end of beforeChannelJoin */

beforeChannelLeave: function(src, channel) {
    callplugins("beforeChannelLeave", src, channel);
}, /* end of beforeChannelLeave */

beforeChannelCreated : function(chan, name, src) {
    if (name == "x") { sys.stopEvent(); }
},

afterChannelCreated : function (chan, name, src) {
    SESSION.global().channelManager.restoreSettings(chan);
}, /* end of afterChannelCreated */


afterChannelJoin : function(player, chan) {
    if (typeof SESSION.channels(chan).topic != 'undefined') {
        sys.sendMessage(player, "Welcome Message: " + SESSION.channels(chan).topic, chan);
        /*if (SESSION.channels(chan).topicSetter)
            sys.sendMessage(player, "Set by: " + SESSION.channels(chan).topicSetter, chan);*/
    }
    if (SESSION.channels(chan).isChannelOperator(player)) {
        sys.sendMessage(player, Config.channelbot + ": use /topic <topic> to change the welcome message of this channel", chan);
    }
    if (SESSION.channels(chan).masters.length <= 0 && !this.isOfficialChan(chan)) {
        sys.sendMessage(player, Config.channelbot + ": This channel is unregistered. If you're looking to own this channel, type /register in order to prevent your channel from being stolen.", chan);
    }
    callplugins("afterChannelJoin", player, chan);
}, /* end of afterChannelJoin */

beforeChannelDestroyed : function(channel) {
    if (channel == tourchannel || (SESSION.channels(channel).perm === true) ) {
        sys.stopEvent();
        return;
    }
}, /* end of beforeChannelDestroyed */

beforePlayerBan : function(src, dest, dur) {
    normalbot.sendAll("Target: " + sys.name(dest) + ", IP: " + sys.ip(dest), staffchannel);
    var authname = sys.name(src).toLowerCase();
    authStats[authname] =  authStats[authname] || {};
    authStats[authname].latestBan = [sys.name(dest), parseInt(sys.time(), 10)];
    callplugins("onBan", src, dest);
},

beforePlayerKick:function(src, dest){
    var authname = sys.name(src).toLowerCase();
    authStats[authname] =  authStats[authname] || {};
    authStats[authname].latestKick = [sys.name(dest), parseInt(sys.time(), 10)];
},

afterNewMessage : function (message) {
    if (message == "Script Check: OK") {
        sys.sendAll("±ScriptCheck: Scripts were updated!", sys.channelId("Indigo Plateau"), channel);
        if (typeof(scriptChecks)=='undefined')
            scriptChecks = 0;
        scriptChecks += 1;
        this.init();
    }
    // Track overactives - though the server now tracks and bans too. Here are template regexps though.
    // var ip_overactive = new RegExp("^IP ([0-9]{1,3}\\.){3}[0-9]{1,3} is being overactive\\.$");
    // var player_overactive = new RegExp("^Player [^:]{1,20} \\(IP ([0-9]{1,3}\\.){3}[0-9]{1,3}\\) is being overactive\\.$");
    // if(ip_overactive.test(message) || player_overactive.test(message))
}, /* end of afterNewMessage */


isRangeBanned : function(ip) {
    for (var subip in rangebans.hash) {
        if (subip.length > 0 && ip.substr(0, subip.length) == subip) {
             return true;
        }
    }
    return false;
},

isIpBanned: function(ip) {
    for (var subip in ipbans.hash) {
        if (subip.length > 0 && ip.substr(0, subip.length) == subip) {
             return true;
        }
    }
    return false;
},

isTempBanned : function(ip) {
    var aliases = sys.aliases(ip);
    for (var x = 0; x < aliases.length; x++) {
        if (sys.dbTempBanTime(aliases[x]) < 2000000000) {
            return true;
        }
    }
    return false;
},

beforeIPConnected : function(ip) { //commands and stuff later for this, just fixing this quickly for now
    if (this.isIpBanned(ip)) {
        sys.stopEvent();
    }
},

beforeLogIn : function(src) {
    var ip = sys.ip(src);
    // auth can evade rangebans and namebans
    if (sys.auth(src) > 0) {
        return;
    }
    //var allowedNames = ["sasukeanditachi", "sasukatandkitachi", "ata", "downpour", "broon89", "ifmltrailers", "probrem?", "salamander94", "realmanofgenius", "Derinsford"];
    var allowedIps = ["74.115.245.16"];
    if (this.isRangeBanned(ip) && allowedIps.indexOf(ip) == -1) {
        normalbot.sendMessage(src, 'You are banned!');
        sys.stopEvent();
        return;
    }
    if (proxy_ips.hasOwnProperty(ip)) {
        normalbot.sendMessage(src, 'You are banned for using proxy!');
        sys.stopEvent();
        return;

    }
    if (this.nameIsInappropriate(src)) {
        sys.stopEvent();
    }
},


nameIsInappropriate: function(src)
{
    var name = (typeof src == "number")
        ? sys.name(src)
        : src;
    function reply(m) {
       if (typeof src == "number") normalbot.sendMessage(src, m);
    }

    var lname = name.toLowerCase();

    /* Name banning related */
    for (var i = 0; i < nameBans.length; ++i) {
        var regexp = nameBans[i];
        if (regexp.test(lname)) {
            reply('This kind of name is banned from the server. (Matching regexp: ' + regexp + ')');
            return true;
        }
    }

    var cyrillic = /\u0430|\u0410|\u0412|\u0435|\u0415|\u041c|\u041d|\u043e|\u041e|\u0440|\u0420|\u0441|\u0421|\u0422|\u0443|\u0445|\u0425|\u0456|\u0406/;
    if (cyrillic.test(name)) {
        reply('You are using cyrillic letters similar to latin letters in your name.');
        return true;
    }
    var greek = /[\u0370-\u03ff]/;
    if (greek.test(name)) {
        reply('You are using Greek letters similar to Latin letters in your name.');
        return true;
    }

    // \u0020 = space
    var space = /[\u0009-\u000D]|\u0085|\u00A0|\u1680|\u180E|\u2000-\u200A|\u2028|\u2029|\u2029|\u202F|\u205F|\u3000|\u3164|\uFEFF|\uFFA0/;
    if (space.test(name)) {
        reply('You are using whitespace letters in your name.');
        return true;
    }

    // \u002D = -
    var dash = /\u058A|\u05BE|\u1400|\u1806|\u2010-\u2015|\u2053|\u207B|\u208B|\u2212|\u2E17|\u2E1A|\u301C|\u3030|\u30A0|[\uFE31-\uFE32]|\uFE58|\uFE63|\uFF0D/;

    if (dash.test(name)) {
        reply('You are using dash letters in your name.');
        return true;
    }

    // special marks
    if (/[\ufff0-\uffff]/.test(name)) {
        reply('You are using SPECIAL characters in your name.');
        return true;
    }

    // COMBINING OVERLINE
    if (/\u0305/.test(name)) {
        reply('You are using COMBINING OVERLINE character in your name.');
        return true;
    }
    if (/\u0CBF/gi.test(name)) {
        return true;
    }
    return false;
},

getColor: function(src) {
    var colour = sys.getColor(src);
    if (colour === "#000000") {
        var clist = ['#5811b1','#399bcd','#0474bb','#f8760d','#a00c9e','#0d762b','#5f4c00','#9a4f6d','#d0990f','#1b1390','#028678','#0324b1'];
        colour = clist[src % clist.length];
    }
    return colour;
},

nameWarnTest : function(src) {
    if (sys.auth(src) > 0)
        return;
    var lname = sys.name(src).toLowerCase();
    for (var i = 0; i < nameWarns.length; ++i) {
        var regexp = nameWarns[i];
        if (regexp.test(lname)) {
            sys.sendAll('Namewarning: Name `' + sys.name(src) + '´ matches the following regexp: `' + regexp + '´ on the IP `' + sys.ip(src) + "´.", watchchannel, channel);
        }
    }
},

startUpTime: function() {
    if (typeof SESSION.global().startUpTime == "number") {
        var diff = parseInt(sys.time(), 10) - SESSION.global().startUpTime;
        var days = parseInt(diff / (60*60*24), 10);
        var hours = parseInt((diff % (60*60*24)) / (60*60), 10);
        var minutes = parseInt((diff % (60*60)) / 60, 10);
        var seconds = (diff % 60);
        return days+"d "+hours+"h "+minutes+"m "+seconds+"s";
    } else {
        return 0;
    }
},

afterLogIn : function(src) {
    sys.sendMessage(src, "*** Type in /Rules to see the rules. ***");
    commandbot.sendMessage(src, "Use !commands to see the commands!");

    if (sys.numPlayers() > maxPlayersOnline) {
        maxPlayersOnline = sys.numPlayers();
    }

    if (maxPlayersOnline > sys.getVal("MaxPlayersOnline")) {
        sys.saveVal("MaxPlayersOnline", maxPlayersOnline);
    }

    countbot.sendMessage(src, "Max number of players online was " + sys.getVal("MaxPlayersOnline") + ".");
    if (typeof(this.startUpTime()) == "string")
    countbot.sendMessage(src, "Server uptime is "+this.startUpTime());
    sys.sendMessage(src, "");

    callplugins("afterLogIn", src);

//   if (SESSION.users(src).android) {
//        sys.changeTier(src, "Challenge Cup");
//        if (sys.existChannel("PO Android")) {
//            var androidChan = sys.channelId("PO Android");
//            sys.putInChannel(src, androidChan);
//            sys.kick(src, 0);
//            sys.sendMessage(src, "*********", androidChan);
//            sys.sendMessage(src, "Message: Hello " + sys.name(src) + "! You seem to be using Pokemon Online for Android. With it you are able to battle with random pokemon. If you want to battle with your own made team, please surf to http://pokemon-online.eu/download with your computer and download the desktop application to your desktop. With it you can export full teams to your Android device! If you using the version with ads from Android Market, download adfree version from http://code.google.com/p/pokemon-online-android/downloads/list", androidChan);
//            sys.sendMessage(src, "*********", androidChan);
//        }
//    }

    if (SESSION.users(src).hostname.toLowerCase().indexOf('tor') !== -1) {
        sys.sendAll('Possible TOR user: ' + sys.name(src), staffchannel);
    }
    
    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as Auth" + "\n");
    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
    this.afterChangeTeam(src);

    if (sys.auth(src) <= 3 && this.canJoinStaffChannel(src))
        sys.putInChannel(src, staffchannel);
    
    if (isAndroid(src)) {
        normalbot.sendMessage(src, "New android version with included teambuilder! See: http://pokemon-online.eu/forums/showthread.php?22137-Android-App-with-Teambuilder");
    }
}, /* end of afterLogin */

beforePlayerRegister : function(src) {
    if (sys.name(src).match(/\bguest[0-9]/i)) {
        sys.stopEvent();
        normalbot.sendMessage(src, "You cannot register guest names!");
        return;
    }
    var limit = Config.registeredLimit;
    if (limit > 0 && sys.numRegistered(sys.ip(src)) >= limit && sys.auth(src) === 0) {
        sys.stopEvent();
        normalbot.sendMessage(src, "You cannot register more than " + limit + " names! Use /myalts to get a list of your alts.");
        return;
    }
},

beforeLogOut : function(src) {
    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Disconnected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Disconnected as Auth" + "\n");
},

afterLogOut : function(src) {
},


beforeChangeTeam : function(src) {
    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
},


afterChangeTeam : function(src)
{
    callplugins("afterChangeTeam", src);
    if (sys.auth(src) === 0 && this.nameIsInappropriate(src)) {
        sys.kick(src);
        return;
    }
    this.nameWarnTest(src);
    var POuser = SESSION.users(src);
    var new_name = sys.name(src);
    if (POuser.name != new_name) {
        var now = parseInt(sys.time(), 10);
        POuser.namehistory.push([new_name, now]);
        POuser.name = new_name;
        var spamcheck = POuser.namehistory[POuser.namehistory.length-3];
        if (spamcheck && spamcheck[1]+10 > now) {
            sys.kick(src);
            return;
        }
    }

    POuser.contributions = contributors.hash.hasOwnProperty(sys.name(src)) ? contributors.get(sys.name(src)) : undefined;
    POuser.mafiaAdmin = mafiaAdmins.hash.hasOwnProperty(sys.name(src));
    if (authChangingTeam === false) {
        if (sys.auth(src) > 0 && sys.auth(src) <= 3)
            sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Changed name to Auth" + "\n");
    } else if (authChangingTeam === true) {
        if (!(sys.auth(src) > 0 && sys.auth(src) <= 3))
            sys.appendToFile("staffstats.txt", "~" + src + "~" + sys.time() + "~" + "Changed name from Auth" + "\n");
    }

    POuser.sametier = getKey("forceSameTier", src) == "1";

    if (getKey("autoIdle", src) == "1") {
        sys.changeAway(src, true);
    }

    for (var team = 0; team < sys.teamCount(src); team++) {
        try {
            // TODO: move this into tierchecks.js
            if (sys.gen(src, team) === 2) {
                pokes:
                for (var i = 0; i <= 6; i++)
                    for (var j = 0; j < bannedGSCSleep.length; ++j)
                        if (sys.hasTeamPokeMove(src, team, i, bannedGSCSleep[j]))
                            for (var k = 0; k < bannedGSCTrap.length; ++k)
                                if (sys.hasTeamPokeMove(src, team, i, bannedGSCTrap[k])) {
                                    checkbot.sendMessage(src, "SleepTrapping is banned in GSC. Pokemon " + sys.pokemon(sys.teamPoke(src,team,i)) + "  removed from your team.");
                                    sys.changePokeNum(src, team, i, 0);
                                    continue pokes;
                                }
            }
        } catch (e) { sys.sendMessage(e, staffchannel); }

        if (!tier_checker.has_legal_team_for_tier(src, team, sys.tier(src, team))) {
            tier_checker.find_good_tier(src, team);
            normalbot.sendMessage(src, "You were placed into '" + sys.tier(src, team) + "' tier.");
        }
    }

}, /* end of afterChangeTeam */



silence: function(src, minutes, chanName) {
    var delay = parseInt(minutes * 60, 10);
    if (isNaN(delay) || delay <= 0) {
        channelbot.sendMessage(src, "Sorry, I couldn't read your minutes.", channel);
    }
    if (!chanName) {
        bot.sendMessage(src, "Sorry, global silence is disabled. Use /silence 5 Channel Name", channel);
    } else {
        var cid = sys.channelId(chanName);
        if (cid !== undefined) {
            channelbot.sendAll("" + sys.name(src) + " called for " + minutes + " Minutes Of Silence in "+chanName+"!", cid);
            SESSION.channels(cid).muteall = true;
            sys.delayedCall(function() {
                if (!SESSION.channels(cid).muteall)
                    return;
                SESSION.channels(cid).muteall = false;
                normalbot.sendAll("Silence is over in "+chanName+".",cid);
            }, delay);
        } else {
            channelbot.sendMessage(src, "Sorry, I couldn't find a channel with that name.", channel);
        }
    }
},

silenceoff: function(src, chanName) {
    if (chanName !== undefined) {
        var cid = sys.channelId(chanName);
        if (!SESSION.channels(cid).muteall) {
            channelbot.sendMessage(src, "The channel is not muted.", channel);
            return;
        }
        channelbot.sendAll("" + sys.name(src) + " cancelled the Minutes of Silence in "+chanName+"!", cid);
        SESSION.channels(cid).muteall = false;
    } else {
        normalbot.sendChanMessage("Use /silenceoff Channel Name");
    }
},

meoff: function(src, commandData) {
    var cid = sys.channelId(commandData);
    if (cid !== undefined) {
        SESSION.channels(cid).meoff = true;
        normalbot.sendAll("" + sys.name(src) + " turned off /me in "+commandData+".", cid);
    } else {
        normalbot.sendMessage(src, "Sorry, that channel is unknown to me.", channel);
    }
    return;
},

meon: function(src, commandData) {
    var cid = sys.channelId(commandData);
    if (cid !== undefined) {
        SESSION.channels(cid).meoff = false;
        normalbot.sendAll("" + sys.name(src) + " turned on /me in "+commandData+".", cid);
    } else {
        normalbot.sendMessage(src, "Sorry, that channel is unknown to me.", channel);
    }
},

beforeNewMessage : function(msg) {
    //Disabling for the moment
   if (0 && msg != "Script Check: OK") {
       sys.stopEvent();
   }
},

beforeNewPM: function(src){
    var user = SESSION.users(src);
    if (user.smute.active){
        sys.stopEvent();
        return;
    }
    if (typeof user.lastpm === "undefined") {
        user.lastpm = parseInt(sys.time(), 10);
    }
    if (user.lastpm > parseInt(sys.time() - 20, 10)) {
        user.pmcount += 1;
    }
    if (user.lastpm < parseInt(sys.time() - 300, 10)) {
        user.pmcount = 0;
        user.pmwarned = false;
    }
    var pmlimit = 20;
    if (user.pmcount > pmlimit){
        sys.stopEvent();
        if (user.pmwarned === false) {
            normalbot.sendAll('User ' + sys.name(src) + ' is potentially spamming through PM', sys.channelId('Indigo Plateau'));
            user.pmwarned = true;
        }
        return;
    }
    user.lastpm = parseInt(sys.time(), 10);
},

beforeChatMessage: function(src, message, chan) {
    if(message.substr(0, 1) == '%')
    {
         if(sys.id('JiraBot') !== undefined)
              sys.sendMessage(sys.id('JiraBot'), sys.name(src)+": "+message, chan);
         if(sys.id('PolkaBot') !== undefined)
             sys.sendMessage(sys.id('PolkaBot'), sys.name(src)+": "+message, chan);
         sys.stopEvent();
         return;
    }
    channel = chan;
    if ((chan === 0 && message.length > 250 && sys.auth(src) < 1)
       || (message.length > 5000 && sys.auth(src) < 2)) {
        normalbot.sendMessage(src, "Hi! Your message is too long, please make it shorter :3", channel);
        sys.stopEvent();
        return;
    }

    if (callplugins("beforeChatMessage", src, message, channel)) {
        sys.stopEvent();
        return;
    }

    if (message == ".") {
        sys.sendMessage(src, sys.name(src)+": .", true, channel);
        sys.stopEvent();
        this.afterChatMessage(src, message, chan);
        return;
    }

    if (message[0] == "#" && undefined !== sys.channelId(message.slice(1)) && !sys.isInChannel(src, sys.channelId(message.slice(1)))) {
        sys.putInChannel(src, sys.channelId(message.slice(1)));
        sys.stopEvent();
        return;
    }

    // Throttling
    var poUser = SESSION.users(src);
    if (channel === 0 && sys.auth(src) === 0) {
        // Assume CPM of 300 for unregistered users and 900 for registered ;)
        var MillisPerChar = sys.dbRegistered(sys.name(src)) ? 50 : 150; // ms
        var now = (new Date()).getTime();
        if (poUser.talk === undefined || poUser.talk + message.length * MillisPerChar < now) {
            poUser.talk = now;
        } else {
            bot.sendMessage(src, "Wait a moment before talking again.", channel);
            sys.stopEvent();
            return;
        }
    }

    var name = sys.name(src).toLowerCase();
    // spamming bots, linking virus sites
    // using lazy points system for minimizing false positives
    if (channel === 0 && sys.auth(src) === 0) {
        //if (/http:\/\/(.*)\.tk(\b|\/)/.test(message)) {
            //bot.sendAll('.tk link pasted at #Tohjo Falls: "' + sys.name(src) + '", ip: ' + sys.ip(src) + ', message: "' + message + '".', staffchannel);
        //}
        var points = 0;

        if (!sys.dbRegistered(name)) {
            var basepoint = (SESSION.users(src).logintime + 60 < parseInt(sys.time(), 10)) ? 2 : 1;
            points += sys.name(src) == name.toUpperCase() ? 1 : 0;
            points += sys.ip(src).split(".")[0] in {'24': true, '64': true, '99': true} ? 1 : 0;
            points += name.indexOf("fuck") > -1 ? 2*basepoint : 0;
            points += name.indexOf("fag") > -1 ? basepoint : 0;
            points += name.indexOf("tom") > -1 ? basepoint : 0;
            points += name.indexOf("blow") > -1 ? 2*basepoint : 0;
            points += name.indexOf("slut") > -1 ? 2*basepoint : 0;
            points += name.indexOf("bot") > -1 ? basepoint : 0;
            points += name.indexOf("smogon") > -1 ? 2*basepoint : 0;
            points += name.indexOf("troll") > -1 ? basepoint : 0;
            points += name.indexOf("69") > -1 ? basepoint : 0;
            points += name.indexOf("con flict") > -1 ? basepoint : 0;
            points += name.indexOf("update") > -1 ? basepoint : 0;
            points += message.indexOf("http://pokemon-online.eu") > -1 ? -5 : 0;
            points += message.indexOf("bit.ly") > -1 ? basepoint : 0;
            points += message.indexOf(".tk") > -1 ? 2*basepoint : 0;
            points += message.indexOf("free") > -1 ? basepoint : 0;
            points += message.indexOf("dildo") > -1 ? basepoint : 0;
            points += message.indexOf("pussy") > -1 ? basepoint : 0;
            points += message.indexOf("buttsex") > -1 ? basepoint : 0;
            points += message.indexOf("SURPREME") > -1 ? basepoint : 0;
        }
        if (points >= 5) {
            normalbot.sendAll('Spammer: "' + sys.name(src) + '", ip: ' + sys.ip(src) + ', message: "' + message + '". Banned.', staffchannel);
            sys.ban(sys.name(src));
            this.kickAll(sys.ip(src));
            sys.stopEvent();
            return;
        }
    }

    if (SESSION.users(src).expired("mute")) {
        SESSION.users(src).un("mute");
        normalbot.sendMessage(src, "your mute has expired.", channel);
    }
    if (sys.auth(src) < 3 && SESSION.users(src).mute.active && message != "!join" && message != "/rules" && message != "/join" && message != "!rules") {
        var muteinfo = SESSION.users(src).mute;
        normalbot.sendMessage(src, "You are muted" + (muteinfo.by ? " by " + muteinfo.by : '')+". " + (muteinfo.expires > 0 ? "Mute expires in " + getTimeString(muteinfo.expires - parseInt(sys.time(), 10)) + ". " : '') + (muteinfo.reason ? "[Reason: " + muteinfo.reason + "]" : ''), channel);
        sys.stopEvent();
        return;
    }
    var poChannel = SESSION.channels(channel);
    if (sys.auth(src) < 1 && !poChannel.canTalk(src)) {
        channelbot.sendMessage(src, "You are muted on this channel! You can't speak unless channel operators and masters unmute you.", channel);
        sys.stopEvent();
        return;
    }

    // text reversing symbols
    // \u0458 = "j"
    if (/[\u0458\u0489\u202a-\u202e\u0300-\u036F\u1dc8\u1dc9\ufffc\u1dc4-\u1dc7\u20d0\u20d1\u0415\u0421]/.test(message)) {
        sys.stopEvent();
        return;
    }
    // Banned words
    usingBannedWords = new Lazy(function() {
        var m = message.toLowerCase();
        var BannedUrls = SESSION.global() ? SESSION.global().BannedUrls : [];
        if (m.indexOf("http://") != -1 || m.indexOf("www.") != -1) {
            for (var i = 0; i < BannedUrls.length; ++i) {
                if (BannedUrls[i].length > 0 && m.indexOf(BannedUrls[i]) != -1) {
                    return true;
                }
            }
        }
        var BanList = [".tk", "nimp.org", "drogendealer", /\u0E49/, /\u00AD/, "nobrain.dk", /\bn[1i]gg+ers*\b/i,  "¦¦", "¦¦", "__", "¯¯", "___", "……", ".....", "¶¶", "¯¯", "----", "╬═╬"];
        for (var i = 0; i < BanList.length; ++i) {
            var filter = BanList[i];
            if (typeof filter == "string" && m.indexOf(filter) != -1 || typeof filter == "function" && filter.test(m)) {
                return true;
            }
        }
        return false;
    });
    repeatingOneself = new Lazy(function() {
        var user = SESSION.users(src);
        var ret = false;
        if (!user.lastline) {
           user.lastline = {message: null, time: 0};
        }
        var time = parseInt(sys.time(), 10);
        if(!script.isOfficialChan(channel)){
            user.lastline.time = time;
            user.lastline.message = message;
            return ret;
        }
        if (!SESSION.channels(channel).isChannelOperator(src) && SESSION.users(src).contributions === undefined && sys.auth(src) < 1 && user.lastline.message == message && user.lastline.time + 15 > time) {
            normalbot.sendMessage(src, "Please do not repeat yourself!", channel);
            ret = true;
        }
        user.lastline.time = time;
        user.lastline.message = message;
        return ret;
    });
    capsName = new Lazy(function() {
        var name = sys.name(src);
        var caps = 0;
        for (var i = name.length-1; i >= 0; --i) {
            if ('A' <= name[i] && name[i] <= 'Z')
                ++caps;
        }
        return (caps > 7 && 2*name.length < 3*caps);
    });
    
    // Commenting out since no Shanai

    /*var shanaiForward = function(msg) {
        var shanai = sys.id("Shanai");
        if (shanai !== undefined) {
            sys.sendMessage(shanai,"CHANMSG " + chan + " " + src + " :" + msg);
        } else {
            sys.sendMessage(src, "+ShanaiGhost: Shanai is offline, your command will not work. Ping nixeagle if he's online.", chan);
        }
        sys.stopEvent();
    };

    // Forward some commands to Shanai
    if (['|', '\\'].indexOf(message[0]) > -1 && !usingBannedWords() && name != 'coyotte508') {
        shanaiForward(message);
        return;
    }*/
    
    var command;
    if ((message[0] == '/' || message[0] == "!") && message.length > 1 && utilities.isLetter(message[1])) {
        if (parseInt(sys.time(), 10) - lastMemUpdate > 500) {
            sys.clearChat();
            lastMemUpdate = parseInt(sys.time(), 10);
        }

        sys.stopEvent();
        print("-- Command: " + sys.name(src) + ": " + message);

        var commandData;
        var pos = message.indexOf(' ');

        if (pos != -1) {
            command = message.substring(1, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(1).toLowerCase();
        }
        var tar = sys.id(commandData);

        // Module commands at the last point.
        if (callplugins("handleCommand", src, message.substr(1), channel)) {
            return;
        }
        commands.handleCommand(src, command, commandData, tar, chan);
        return;
    } /* end of commands */

    // Impersonation
    if (typeof SESSION.users(src).impersonation != 'undefined') {
        sys.stopEvent();
        sys.sendAll(SESSION.users(src).impersonation + ": " + message, channel);
        return;
    }

    // Minutes of Silence
    if (SESSION.channels(channel).muteall && !SESSION.channels(channel).isChannelOperator(src) && sys.auth(src) === 0) {
        normalbot.sendMessage(src, "Respect the minutes of silence!", channel);
        sys.stopEvent();
        return;
    }

    //Swear check
    if (SESSION.channels(channel).allowSwear === false) {
        if(/f[uo]ck|\bass|\bcum|\bdick|\bsex|pussy|bitch|porn|\bfck|nigga|\bcock|\bgay|\bhoe\b|slut|\bshit\b|whore|cunt|clitoris|\bfag/i.test(message)) {
             sys.stopEvent();
             return;
        }
    }

    // Banned words
    if (usingBannedWords()) {
        if (message.indexOf(".tk") != -1){
            normalbot.sendAll(sys.name(src) + " tried to send a .tk link!",staffchannel);
        }
        var aliases = sys.aliases(sys.ip(src));
        for (var x = 0; x < aliases.length; x++){
            var id = sys.id(aliases[x]);
            if(id !== undefined){
                sys.sendMessage(id, sys.name(src)+": " + message, channel);
            }
        }
        sys.stopEvent();
        return;
    }
    if (repeatingOneself()) {
        this.afterChatMessage(src, SESSION.users(src).lastline.message, channel);
        sys.stopEvent();
        return;
    }
    var capsday = false;
    if (typeof CAPSLOCKDAYALLOW != 'undefined') {
        capsday = CAPSLOCKDAYALLOW;
    }
    if (capsName() && !capsday) {
        normalbot.sendMessage(src, "You have too many CAPS letters in your name. Please remove them to speak freely. 7 CAPS letters are allowed. Lowercase name will keep your ladder score.", channel);
        sys.stopEvent();
        return;
    }


    // Secret mute
    if (sys.auth(src) === 0 && SESSION.users(src).smute.active) {
        if (SESSION.users(src).expired("smute")) {
            SESSION.users(src).un("smute");
        } else {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active) {
                    sys.sendMessage(id,  sys.name(src)+": "+message, channel);
                }
            });
            sys.stopEvent();
            this.afterChatMessage(src, message, channel);
        }
        return;
    }

    if (channel === 0 && typeof clanmute != 'undefined') {
       var bracket1 = sys.name(src).indexOf("[");
       var bracket2 = sys.name(src).indexOf("]");
       if (bracket1 >= 0 && bracket2 > 0 && bracket1 < bracket2) {
           normalbot.sendMessage(src, "Sorry, clan members can't speak on the main chat.");
           sys.stopEvent();
           return;
       }
       bracket1 = sys.name(src).indexOf("{");
       bracket2 = sys.name(src).indexOf("}");
       if (bracket1 >= 0 && bracket2 > 0 && bracket1 < bracket2) {
           normalbot.sendMessage(src, "Sorry, clan members can't speak on the main chat.");
           sys.stopEvent();
           return;
       }
    }

    if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW === true) {
    var date = new Date();
    if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
        sys.sendAll(sys.name(src)+": " + message.toUpperCase(), channel, channel);
        sys.stopEvent();
        this.afterChatMessage(src, message, channel);
    }
    }
}, /* end of beforeChatMessage */


afterChatMessage : function(src, message, chan)
{

    var user = SESSION.users(src);
    var poChannel = SESSION.channels(chan);
    channel = chan;
    lineCount+=1;

   // if (channel == sys.channelId("PO Android")) {
       // if (/f[uo]ck|\bass|\bcum|\bdick|\bsex|pussy|bitch|porn|\bfck|nigga|\bcock|\bgay|\bhoe\b|slut|whore|cunt|clitoris/i.test(message) && user.android) {
           // kickbot.sendAll(sys.name(src) + " got kicked for foul language.", channel);
           // sys.kick(src);
           // return;
       // }
   // }

    // hardcoded
    var ignoreChans = [staffchannel, sachannel, sys.channelId("trivreview"), sys.channelId("Watch"), mafiarev];
    var ignoreUsers = ["nixeagle"];
    var userMayGetPunished = sys.auth(src) < 2 && ignoreChans.indexOf(channel) == -1 && ignoreUsers.indexOf(sys.name(src)) == -1 && !poChannel.isChannelOperator(src);
    var officialChan = this.isOfficialChan(chan);
    var capsday = false;
    if (typeof CAPSLOCKDAYALLOW != 'undefined') {
        capsday = CAPSLOCKDAYALLOW;
    }
    if (!poChannel.ignorecaps && this.isMCaps(message) && userMayGetPunished && !capsday) {
        user.caps += 3;
        var maxCaps = channel == sys.channelId("Trivia") ? 12 : 9;
        if (user.caps >= maxCaps && !user.mute.active) {

            if (user.capsmutes === undefined)
                user.capsmutes = 0;
            var time = 900 * Math.pow(2,user.capsmutes);

            var message = "" + sys.name(src) + " was muted for caps for " + (time/60) + " minutes.";
            if (officialChan) {
                ++user.capsmutes;
                if (user.smute.active) {
                    sys.sendMessage(src, message);
                    capsbot.sendAll("" + sys.name(src) + " was muted for caps while smuted.", staffchannel);
                } else {
                    capsbot.sendAll(message, channel);
                    if (channel != staffchannel)
                        capsbot.sendAll(message + "[Channel: "+sys.channel(channel) + "]", staffchannel);
                }
            }
            var endtime = user.mute.active ? user.mute.expires + time : parseInt(sys.time(), 10) + time;
            if (officialChan) {
                user.activate("mute", Config.capsbot, endtime, "Overusing CAPS", true);
                callplugins("onMute", src);
                return;
            }
            else {
                poChannel.mute(Config.capsbot, sys.name(src), {'time': 900, 'reason': "Overusing CAPS"});
            }
        }
    } else if (user.caps > 0) {
        user.caps -= 1;
    }

    if (typeof user.timecount == "undefined") {
        user.timecount = parseInt(sys.time(), 10);
    }
    var linecount = sys.auth(src) === 0 ? 9 : 21;
    if (!poChannel.ignoreflood && userMayGetPunished) {
        user.floodcount += 1;
        var time = parseInt(sys.time(), 10);
        if (time > user.timecount + 7) {
            var dec = Math.floor((time - user.timecount)/7);
            user.floodcount = user.floodcount - dec;
            if (user.floodcount <= 0) {
                user.floodcount = 1;
            }
            user.timecount += dec*7;
        }
        
        linecount = sys.channelId("Mafia") == channel ? linecount + 3 : linecount;

        if (user.floodcount > linecount) {
            var message = "" + sys.name(src) + " was kicked " + (sys.auth(src) === 0 && officialChan ? "and muted " : "") + "for flood.";
            if (officialChan) {
                if (user.smuted) {
                    sys.sendMessage(src, message);
                    kickbot.sendAll("" + sys.name(src) + " was kicked for flood while smuted.", staffchannel);
                } else {
                    kickbot.sendAll(message, channel);
                    if (channel != staffchannel)
                        kickbot.sendAll(message + " [Channel: "+sys.channel(channel)+"]", staffchannel);
                }
            }
            if (officialChan) {
                if (sys.auth(src) === 0) {
                    var endtime = user.mute.active ? user.mute.expires + 3600 : parseInt(sys.time(), 10) + 3600;
                    user.activate("mute", Config.kickbot, endtime, "Flooding", true);
                }
                callplugins("onKick", src);
                sys.kick(src);
                return;
            }
            else {
                poChannel.mute(Config.kickbot, sys.name(src), {'time': 3600, 'reason': "Flooding"});
                sys.kick(src, channel);
            }
        }
    }
    SESSION.channels(channel).beforeMessage(src, message);
    callplugins("afterChatMessage", src, message, channel);
}, /* end of afterChatMessage */

beforeBattleStarted: function(src, dest, clauses, rated, mode, bid, team1, team2) {
    if ((sys.tier(src, team1) == "Battle Factory" || sys.tier(src, team1) == "Battle Factory 6v6") && (sys.tier(dest, team2) == "Battle Factory" || sys.tier(dest, team2) == "Battle Factory 6v6")) {
       callplugins("beforeBattleStarted", src, dest, rated, mode, team1, team2);
    }
},

battleSetup: function(p1,p2,battle) {
    if (sys.auth(p1) > 3 && sys.name(p1) != "Darkness") {
        sys.prepareItems(battle,0,{"124":1});
    }
    if (sys.auth(p2) > 3 && sys.name(p2) != "Darkness") {
        sys.prepareItems(battle,1,{"124":1});
    }
},

afterBattleStarted: function(src, dest, clauses, rated, mode, bid, team1, team2) {
    callplugins("afterBattleStarted", src, dest, clauses, rated, mode, bid, team1, team2);
    var tier = false;
    if (sys.tier(src, team1) === sys.tier(dest, team2)) {
        tier = sys.tier(src, team1);
    }
    var time = parseInt(sys.time(), 10);
    var battle_data = {players: [src, dest], clauses: clauses, rated: rated, mode: mode, tier: tier, time: time};
    SESSION.global().battleinfo[bid] = battle_data;
    SESSION.users(src).battles[bid] = battle_data;
    SESSION.users(dest).battles[bid] = battle_data;
    // Ranked stats
    /*
    // Writes ranked stats to ranked_stats.csv
    // Uncomment to enable
    if (rated) {
        var tier = sys.tier(src);
        var writeRating = function(id) {
            var rating = sys.ladderRating(id, tier);
            var a = ['"'+tier+'"', rating, parseInt(sys.time())];
            for(var i = 0; i < 6; ++i) a.push(sys.teamPoke(id, i));
            sys.appendToFile("ranked_stats.csv", a.join(",")+"\n");
        }
        writeRating(src);
        writeRating(dest);
    }
    */
},


beforeBattleEnded : function(src, dest, desc, bid) {
    var rated = SESSION.users(src).battles[bid].rated;
    var tier = SESSION.users(src).battles[bid].tier;
    var time = SESSION.users(src).battles[bid].time;
    var tie = desc === "tie";
    delete SESSION.global().battleinfo[bid];
    delete SESSION.users(src).battles[bid];
    delete SESSION.users(dest).battles[bid];

    if (!SESSION.users(src).battlehistory) SESSION.users(src).battlehistory=[];
    if (!SESSION.users(dest).battlehistory) SESSION.users(dest).battlehistory=[];
    SESSION.users(src).battlehistory.push([sys.name(dest), tie ? "tie":"win", desc, rated, tier]);
    SESSION.users(dest).battlehistory.push([sys.name(src), tie ? "tie":"lose", desc, rated, tier]);
    if (rated && (namesToWatch.get(sys.name(src).toLowerCase()) || namesToWatch.get(sys.name(dest).toLowerCase()))) {
        if (sys.channelId("Channel")) {
            sys.sendHtmlAll("<b><font color = blue>" + sys.name(src) + " and " + sys.name(dest) + " finished a battle with result " + (tie ? "tie" : sys.name(src) + " winning") + (desc === "forfeit" ? " (forfeit)" : "") + (tier ? " in tier " + tier: "") + (time ? " after " + getTimeString(sys.time() - time) + "." : "." ) + "</font></b>", sys.channelId("Channel"));
            sys.sendAll(sys.name(src) + "'s IP: " + sys.ip(src) + " " + sys.name(dest) + "'s IP: " + sys.ip(dest), sys.channelId("Channel"));
        }
    }
},


afterBattleEnded : function(src, dest, desc) {
    ++battlesFought;
    // TODO: maybe save on script unload / server shutdown too
    if (battlesFought % 100 === 0) sys.saveVal("Stats/BattlesFought", battlesFought);
    callplugins("afterBattleEnded", src, dest, desc);
},


isLCaps: function(letter) {
    return letter >= 'A' && letter <= 'Z';
},


isMCaps : function(message) {
    var count = 0;

    var i = 0;
    while ( i < message.length ) {
        var c = message[i];

        if (this.isLCaps(c)) {
            count += 1;
            if (count == 5)
                return true;
        } else {
            count -= 2;
            if (count < 0)
                count = 0;
        }
        i += 1;
    }

    return false;
},

beforeChangeTier : function(src, team, oldtier, newtier) {
    if (newtier == "Battle Factory" || newtier == "Battle Factory 6v6" || oldtier == "Battle Factory" || oldtier == "Battle Factory 6v6") {
        if (callplugins("beforeChangeTier", src, team, oldtier, newtier)) {
            sys.stopEvent();
            return;
        }
    }
    if (!tier_checker.has_legal_team_for_tier(src, team, newtier)) {
       sys.stopEvent();
       normalbot.sendMessage(src, "Sorry, you can not change into that tier.");
       tier_checker.find_good_tier(src, team);
    }
},

afterChangeTier : function(src, team, oldtier, newtier) {
},

afterPlayerAway : function(src, away) {
},

beforeChallengeIssued : function (src, dest, clauses, rated, mode, team, destTier) {
    if (battlesStopped) {
        battlebot.sendMessage(src, "Battles are now stopped as the server will restart soon.");
        sys.stopEvent();
        return;
    }

    if (SESSION.users(dest).sametier === true && (destTier != sys.tier(src,team))) {
        battlebot.sendMessage(src, "That guy only wants to fight his/her own tier.");
        sys.stopEvent();
        return;
    }

    var isChallengeCup = /*sys.getClauses(sys.tier(src,team))%32 >= 16 ||*/ sys.getClauses(destTier)%32 >= 16;
    var hasChallengeCupClause = (clauses % 32) >= 16;
    if (isChallengeCup && !hasChallengeCupClause) {
        checkbot.sendMessage(src, "Challenge Cup must be enabled in the challenge window for a CC battle");
        sys.stopEvent();
        return;
    }
    /* Oak's request
    else if (!isChallengeCup && hasChallengeCupClause) {
        checkbot.sendMessage(src, "Challenge Cup must not be enabled in the challenge window for a non CC battle");
        sys.stopEvent();
        return;
    }*/

    if (sys.tier(src,team).indexOf("Doubles") != -1 && destTier.indexOf("Doubles") != -1 && mode != 1) {
        battlebot.sendMessage(src, "To fight in doubles, enable doubles in the challenge window!");
        sys.stopEvent();
        return;
    }

    if (sys.tier(src,team).indexOf("Triples") != -1 && destTier.indexOf("Triples") != -1 && mode != 2) {
        battlebot.sendMessage(src, "To fight in triples, enable triples in the challenge window!");
        sys.stopEvent();
        return;
    }

    if (callplugins("beforeChallengeIssued", src, dest, clauses, rated, mode, team, destTier)) {
        sys.stopEvent();
    }

},

/* Tournament "Disallow Spects" bypass for tour admins */
attemptToSpectateBattle : function(src, p1, p2) {
    if (callplugins("allowToSpectate", src, p1, p2)) {
        return "allow";
    }
    return "denied";
},

/* Prevents scouting */
beforeSpectateBattle : function(src, p1, p2) {
    if (callplugins("canSpectate", src, p1, p2)) {
        sys.stopEvent();
    }
},

beforeBattleMatchup : function(src,dest,clauses,rated)
{
    if (battlesStopped) {
        sys.stopEvent();
        return;
    }
    if (callplugins("beforeBattleMatchup", src, dest, clauses, rated)) {
        sys.stopEvent();
    }
    // warn players if their account is unregistered and ladder rating is >1200 or in top 5%
    var players = [src,dest];
    for (var p = 0; p < players.length; p++) {
        var id = players[p];
        if (sys.dbRegistered(sys.name(id))) {
            continue;
        }
        for (var x=0;x<sys.teamCount(id);x++) {
            var tier = sys.tier(id,x);
            if (sys.ladderRating(id,tier) >= 1200 || sys.ranking(id,tier)/sys.totalPlayersByTier(tier) <= 0.05) {
                sys.sendHtmlMessage(id,"<font color=red size=3><b>You currently have a high rating in "+tier+", but your account is not registered! Please register to protect your account from being stolen (click the register button below and follow the instructions)!</b></font><ping/>");
            }
        }
    }
}

});
