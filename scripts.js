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
    bfbot: "Goomy",
    // suspectvoting.js available, but not in use
    Plugins: ["mafia.js", "amoebagame.js", "tournaments.js", "tourstats.js", "trivia.js", "tours.js", "newtourstats.js", "auto_smute.js", "battlefactory.js", "hangman.js", "blackjack.js", "mafiastats.js", "mafiachecker.js"],
    Mafia: {
        bot: "Murkrow",
        norepeat: 5,
        stats_file: "scriptdata/mafia_stats.json",
        max_name_length: 16,
        notPlayingMsg: "±Game: The game is in progress. Please type /join to join the next mafia game."
    },
    League: [
        ["ßasedVictory", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23098-Elite-Four-CasedVictory'>E4 Thread!</a>"],
        ["Xdevo", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23119-Elite-Four-Xdevo'>E4 Thread!</a>"],
        ["ThatIsWhatSheSaid", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20979-Elite-4-ThatIsWhatSheSaid'>E4 Thread!</a>"],
        ["fitzyhbbe", "Elite Four - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?20857-Elite-4-Fitzy'>E4 Thread!</a>"],
        ["ZoroDark", "5th Generation Ubers - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23122-BW2-Ubers-Gym-ZoroDark'>Gym Thread!</a>"],
        ["Z+V", "5th Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23084-BW2-OU-Gym-Z-V-and-Hannah'>Gym Thread!</a>"],
        ["Hannah", "5th Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23084-BW2-OU-Gym-Z-V-and-Hannah'>Gym Thread!</a>"],
        ["Toby", "5th Generation UnderUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23334-BW2-UU-Gym-Toby'>Gym Thread!</a> "],
        ["Celestial phantom", "5th Generation LittleUsed Gym - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23120-BW-2-LU-Gym-Celestial-Phantom'>Gym Thread!</a>"],
        ["meeps", "5th Generation NeverUsed Gym - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23083-BW2-NU-Gym-meeps'>Gym Thread!</a>"],
        ["Mylo Xyloto", "5th Generation Little Cup - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23136-BW2-LC-Gym-Mylo-Xyloto'>Gym Thread!</a>"],
        ["зeлeнoглaзый pyccкий", "All Gen CC - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23099-Challenge-Cup-Gym-Green-Eyed-Russian-amp-diamondslight'>Gym Thread!</a>"],
        ["diamondslight", "All Gen CC - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23099-Challenge-Cup-Gym-Green-Eyed-Russian-amp-diamondslight'>Gym Thread!</a>"],
        ["Raducan", "Battle Factory 6v6 - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23123-Battle-Factory-6v6-Gym-Raducan-and-Dasdardly'>Gym Thread!</a>"],
        ["Dasdardly", "Battle Factory 6v6 - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23123-Battle-Factory-6v6-Gym-Raducan-and-Dasdardly'>Gym Thread!</a>"],
        ["D4RR3N", "4th Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23129-DPP-OU-Gym-D4RR3N'>Gym Thread!</a>"],
        ["Colchonero", "3rd Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23243-ADV-OU-Gym-Colchonero'>Gym Thread!</a>"],
        ["Blimlax", "2nd Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23141-GSC-OU-Gym-Blimlax'>Gym Thread!</a>"],
        ["Isa-", "1st Generation OverUsed - View {0}'s <a href='http://pokemon-online.eu/forums/showthread.php?23110-RBY-OU-Gym-Isa'>Gym Thread!</a>"]
    ],
    DreamWorldTiers: ["No Preview OU", "No Preview Ubers", "DW LC", "DW UU", "DW LU", "Gen 5 1v1 Ubers", "Gen 5 1v1", "Challenge Cup", "CC 1v1", "DW Uber Triples", "No Preview OU Triples", "No Preview Uber Doubles", "No Preview OU Doubles", "Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST", "Monocolour", "Clear Skies DW"],
    superAdmins: ["[LD]Jirachier", "Ethan"],
    canJoinStaffChannel: ["Lamperi-"],
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

var channel, contributors, mutes, mbans, smutes, detained, hmutes, mafiaSuperAdmins, hangmanAdmins, hangmanSuperAdmins, staffchannel, channelbot, normalbot, bot, mafiabot, kickbot, capsbot, checkbot, coinbot, countbot, tourneybot, battlebot, commandbot, querybot, rankingbot, hangbot, bfbot, scriptChecks, lastMemUpdate, bannedUrls, mafiachan, mafiarev, sachannel, tourchannel, dwpokemons, hapokemons, lcpokemons, bannedGSCSleep, bannedGSCTrap, breedingpokemons, rangebans, proxy_ips, mafiaAdmins, rules, authStats, nameBans, chanNameBans, isSuperAdmin, cmp, key, battlesStopped, lineCount, pokeNatures, pokeAbilities, maxPlayersOnline, pastebin_api_key, pastebin_user_key, getSeconds, getTimeString, sendChanMessage, sendChanAll, sendMainTour, VarsCreated, authChangingTeam, usingBannedWords, repeatingOneself, capsName, CAPSLOCKDAYALLOW, nameWarns, poScript, revchan, triviachan, watchchannel, lcmoves, hangmanchan, ipbans, battlesFought, lastCleared, blackjackchan, heightList, weightList, powerList, accList, ppList, categoryList, moveEffList, moveFlagList, abilityList, itemList, berryList, flingPowerList, berryPowerList, berryTypeList, allMovesList, allGenMovesList, namesToWatch, allowedRangeNames;

var pokeDir = "db/pokes/";
var moveDir = "db/moves/6G/";
var abilityDir = "db/abilities/";
var itemDir = "db/items/";
sys.makeDir("scripts");
/* we need to make sure the scripts exist */
var commandfiles = ['commands.js', 'channelcommands.js','ownercommands.js', 'modcommands.js', 'usercommands.js', "admincommands.js"];
var deps = ['crc32.js', 'utilities.js', 'bot.js', 'memoryhash.js', 'tierchecks.js', "globalfunctions.js", "userfunctions.js", "channelfunctions.js", "channelmanager.js"].concat(commandfiles).concat(Config.Plugins);
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
[Config.dataDir+"mafia_stats.json", Config.dataDir+"suspectvoting.json", Config.dataDir+"mafiathemes/metadata.json", Config.dataDir+"channelData.json", Config.dataDir+"mutes.txt", Config.dataDir+"mbans.txt", Config.dataDir+"hmutes.txt", Config.dataDir+"smutes.txt", Config.dataDir+"rangebans.txt", Config.dataDir+"contributors.txt", Config.dataDir+"ipbans.txt", Config.dataDir+"namesToWatch.txt", Config.dataDir+"hangmanadmins.txt", Config.dataDir+"hangmansuperadmins.txt", Config.dataDir+"pastebin_user_key", Config.dataDir+"secretsmute.txt", Config.dataDir+"ipApi.txt", Config.dataDir + "notice.html", Config.dataDir + "rangewhitelist.txt"].forEach(cleanFile);

var autosmute = sys.getFileContent(Config.dataDir+"secretsmute.txt").split(':::');
var crc32 = require('crc32.js').crc32;
var MemoryHash = require('memoryhash.js').MemoryHash;
var POChannelManager = require('channelmanager.js').POChannelManager;
var POChannel = require('channelfunctions.js').POChannel;
var POUser = require('userfunctions.js').POUser;
var POGlobal = require('globalfunctions.js').POGlobal;
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

function getAbility (abilityId) {
    if (abilityList === undefined) {
        abilityList = {};
        var data = sys.getFileContent(abilityDir + 'ability_battledesc.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var ability = data[i].substr(index + 1);
            abilityList[key] = ability;
        }
    }
    return abilityList[abilityId];
}

function getItem (itemId) {
    if (itemList === undefined) {
        itemList = {};
        var data = sys.getFileContent(itemDir + 'items_description.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var item = data[i].substr(index + 1);
            itemList[key] = item;
        }
    }
    return itemList[itemId];
}

function getBerry (berryId) {
    if (berryList === undefined) {
        berryList = {};
        var data = sys.getFileContent(itemDir + 'berries_description.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var berry = data[i].substr(index + 1);
            berryList[key] = berry;
        }
    }
    return berryList[berryId];
}

function getFlingPower (itemId) {
    if (flingPowerList === undefined) {
        flingPowerList = {};
        var data = sys.getFileContent(itemDir + 'items_pow.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            flingPowerList[key] = power;
        }
    }
    return flingPowerList[itemId];
}

function getBerryPower (berryId) {
    if (berryPowerList === undefined) {
        berryPowerList = {};
        var data = sys.getFileContent(itemDir + 'berry_pow.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            berryPowerList[key] = power;
        }
    }
    return +berryPowerList[berryId] + 20;
}

function getBerryType (berryId) {
    if (berryTypeList === undefined) {
        berryTypeList = {};
        var data = sys.getFileContent(itemDir + 'berry_type.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var type = data[i].substr(index + 1);
            berryTypeList[key] = sys.type(type);
        }
    }
    return berryTypeList[berryId];
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
function callplugins() {
    return SESSION.global().callplugins.apply(SESSION.global(), arguments);
}
function getplugins() {
    return SESSION.global().getplugins.apply(SESSION.global(), arguments);
}

SESSION.identifyScriptAs("PO Scripts v0.991");
SESSION.registerChannelFactory(POChannel);
SESSION.registerUserFactory(POUser);
SESSION.registerGlobalFactory(POGlobal);

if (typeof SESSION.global() != 'undefined') {
    SESSION.global().channelManager = new POChannelManager('scriptdata/channelHash.txt');

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
                sys.sendAll("±NetCat: Cannot reach Webclient Proxy - it may be down.", sys.channelId("Indigo Plateau"));
            }
        }, function errback(error) {
                sys.sendAll("±NetCat: Cannot reach Webclient Proxy - it may be down: " + error, sys.channelId("Indigo Plateau"));
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

    var dwlist = ["Timburr", "Gurdurr", "Conkeldurr", "Pansage", "Pansear", "Panpour", "Simisear", "Simisage", "Simipour", "Ekans", "Arbok", "Paras", "Parasect", "Happiny", "Chansey", "Blissey", "Munchlax", "Snorlax", "Aipom", "Ambipom", "Pineco", "Forretress", "Wurmple", "Silcoon", "Cascoon", "Beautifly", "Dustox", "Seedot", "Nuzleaf", "Shiftry", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Plusle", "Minun", "Budew", "Roselia", "Gulpin", "Swalot", "Kecleon", "Kricketot", "Kricketune", "Cherubi", "Cherrim", "Carnivine", "Audino", "Throh", "Sawk", "Scraggy", "Scrafty", "Rattata", "Raticate", "Nidoran-F", "Nidorina", "Nidoqueen", "Nidoran-M", "Nidorino", "Nidoking", "Oddish", "Gloom", "Vileplume", "Bellossom", "Bellsprout", "Weepinbell", "Victreebel", "Ponyta", "Rapidash", "Farfetch'd", "Doduo", "Dodrio", "Exeggcute", "Exeggutor", "Lickitung", "Lickilicky", "Tangela", "Tangrowth", "Kangaskhan", "Sentret", "Furret", "Cleffa", "Clefairy", "Clefable", "Igglybuff", "Jigglypuff", "Wigglytuff", "Mareep", "Flaaffy", "Ampharos", "Hoppip", "Skiploom", "Jumpluff", "Sunkern", "Sunflora", "Stantler", "Poochyena", "Mightyena", "Lotad", "Ludicolo", "Lombre", "Taillow", "Swellow", "Surskit", "Masquerain", "Bidoof", "Bibarel", "Shinx", "Luxio", "Luxray", "Psyduck", "Golduck", "Growlithe", "Arcanine", "Scyther", "Scizor", "Tauros", "Azurill", "Marill", "Azumarill", "Bonsly", "Sudowoodo", "Girafarig", "Miltank", "Zigzagoon", "Linoone", "Electrike", "Manectric", "Castform", "Pachirisu", "Buneary", "Lopunny", "Glameow", "Purugly", "Natu", "Xatu", "Skitty", "Delcatty", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Bulbasaur", "Charmander", "Squirtle", "Ivysaur", "Venusaur", "Charmeleon", "Charizard", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Infernape", "Monferno", "Piplup", "Prinplup", "Empoleon", "Treecko", "Sceptile", "Grovyle", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Caterpie", "Metapod", "Butterfree", "Pidgey", "Pidgeotto", "Pidgeot", "Spearow", "Fearow", "Zubat", "Golbat", "Crobat", "Aerodactyl", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Yanma", "Yanmega", "Murkrow", "Honchkrow", "Delibird", "Wingull", "Pelipper", "Swablu", "Altaria", "Starly", "Staravia", "Staraptor", "Gligar", "Gliscor", "Drifloon", "Drifblim", "Skarmory", "Tropius", "Chatot", "Slowpoke", "Slowbro", "Slowking", "Krabby", "Kingler", "Horsea", "Seadra", "Kingdra", "Goldeen", "Seaking", "Magikarp", "Gyarados", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Wooper", "Quagsire", "Qwilfish", "Corsola", "Remoraid", "Octillery", "Mantine", "Mantyke", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Barboach", "Whiscash", "Clamperl", "Gorebyss", "Huntail", "Relicanth", "Luvdisc", "Buizel", "Floatzel", "Finneon", "Lumineon", "Tentacool", "Tentacruel", "Corphish", "Crawdaunt", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Shellos", "Gastrodon", "Lapras", "Dratini", "Dragonair", "Dragonite", "Elekid", "Electabuzz", "Electivire", "Poliwag", "Poliwrath", "Politoed", "Poliwhirl", "Vulpix", "Ninetales", "Musharna", "Munna", "Darmanitan", "Darumaka", "Mamoswine", "Togekiss", "Burmy", "Wormadam", "Mothim", "Pichu", "Pikachu", "Raichu","Abra","Kadabra","Alakazam","Spiritomb","Mr. Mime","Mime Jr.","Meditite","Medicham","Meowth","Persian","Shuppet","Banette","Spinarak","Ariados","Drowzee","Hypno","Wobbuffet","Wynaut","Snubbull","Granbull","Houndour","Houndoom","Smoochum","Jynx","Ralts", "Kirlia", "Gardevoir","Gallade","Sableye","Mawile","Volbeat","Illumise","Spoink","Grumpig","Stunky","Skuntank","Bronzong","Bronzor","Mankey","Primeape","Machop","Machoke","Machamp","Magnemite","Magneton","Magnezone","Koffing","Weezing","Rhyhorn","Rhydon","Rhyperior","Teddiursa","Ursaring","Slugma","Magcargo","Phanpy","Donphan","Magby","Magmar","Magmortar","Larvitar","Pupitar","Tyranitar","Makuhita","Hariyama","Numel","Camerupt","Torkoal","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Absol","Beldum","Metang","Metagross","Hippopotas","Hippowdon","Skorupi","Drapion","Tyrogue","Hitmonlee","Hitmonchan","Hitmontop","Bagon","Shelgon","Salamence","Seel","Dewgong","Shellder","Cloyster","Chinchou","Lanturn","Smeargle","Porygon","Porygon2","Porygon-Z","Drilbur", "Excadrill", "Basculin", "Basculin-a", "Alomomola", "Stunfisk", "Druddigon", "Foongus", "Amoonguss", "Liepard", "Purrloin", "Minccino", "Cinccino", "Sandshrew", "Sandslash", "Vullaby", "Mandibuzz", "Braviary", "Frillish", "Jellicent", "Weedle", "Kakuna", "Beedrill", "Shroomish", "Breloom", "Zangoose", "Seviper", "Combee", "Vespiquen", "Patrat", "Watchog", "Blitzle", "Zebstrika", "Woobat", "Swoobat", "Mienfoo", "Mienshao", "Bouffalant", "Staryu", "Starmie", "Togepi", "Shuckle", "Togetic", "Rotom", "Sigilyph", "Riolu", "Lucario", "Lugia", "Ho-Oh", "Dialga", "Palkia", "Giratina", "Grimer", "Muk", "Ditto", "Venonat", "Venomoth", "Herdier", "Lillipup", "Stoutland", "Sewaddle", "Swadloon", "Leavanny", "Cubchoo", "Beartic", "Landorus", "Thundurus", "Tornadus","Dunsparce", "Sneasel", "Weavile", "Nosepass", "Probopass", "Karrablast", "Escavalier", "Shelmet", "Accelgor", "Snorunt", "Glalie", "Froslass", "Pinsir", "Emolga", "Heracross", "Trubbish", "Garbodor", "Snover", "Abomasnow","Diglett", "Dugtrio", "Geodude", "Graveler", "Golem", "Onix", "Steelix", "Voltorb", "Electrode", "Cubone", "Marowak", "Whismur", "Loudred", "Exploud", "Aron", "Lairon", "Aggron", "Spheal", "Sealeo", "Walrein", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Gible", "Gabite", "Garchomp", "Pidove", "Tranquill", "Unfezant", "Tympole", "Palpitoad", "Seismitoad", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Ducklett", "Swanna", "Deerling", "Sawsbuck", "Elgyem", "Beheeyem", "Pawniard", "Bisharp", "Heatmor", "Durant","Venipede","Whirlipede", "Scolipede", "Tirtouga", "Carracosta", "Joltik", "Galvantula", "Maractus", "Dwebble", "Crustle", "Roggenrola", "Boldore", "Gigalith", "Vanillite", "Vanillish", "Vanilluxe", "Klink", "Klang", "Klinklang", "Swinub", "Piloswine", "Golett", "Golurk", "Gothitelle", "Gothorita", "Solosis", "Duosion", "Reuniclus", "Deerling-Summer", "Deerling-Autumn", "Deerling-Winter", "Sawsbuck-Summer", "Sawsbuck-Autumn", "Sawsbuck-Winter", "Roserade", "Mewtwo"];
    var halist = dwlist.concat(["Gothita", "Rufflet", "Klefki", "Phantump", "Trevenant", "Axew", "Fraxure", "Haxorus", "Carbink", "Scatterbug", "Spewpa", "Vivillon", "Sandile", "Krokorok", "Krookodile", "Inkay", "Malamar", "Noibat", "Noivern", "Goomy", "Sliggoo", "Goodra", "Dedenne", "Helioptile", "Heliolisk", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", "Flabébé", "Floette", "Florges", "Pancham", "Pangoro", "Larvesta", "Volcarona", "Litleo", "Pyroar", "Fennekin", "Braixen", "Delphox", "Fletchling", "Fletchinder", "Talonflame", "Hawlucha", "Litwick", "Lampent", "Chandelure", "Pumpkaboo", "Pumpkaboo-S", "Pumpkaboo-L", "Pumpkaboo-XL", "Gourgeist", "Gourgeist-S", "Gourgeist-L", "Gourgeist-XL", "Duskull", "Dusclops", "Dusknoir", "Chespin", "Quilladin", "Chesnaught", "Skiddo", "Gogoat", "Bunnelby", "Diggersby", "Bergmite", "Avalugg", "Espurr", "Meowstic", "Binacle", "Barbaracle", "Froakie", "Frogadier", "Greninja", "Sylveon"]);
    //two lists for gen 5 and gen 6
    /* use hash for faster lookup */
    dwpokemons = {};
    script.hapokemons = {};
    var announceChan = (typeof staffchannel == "number") ? staffchannel : 0;
    var dwpok;
    for (dwpok = 0; dwpok < halist.length; dwpok++) {
        var num = sys.pokeNum(halist[dwpok]);
        if (halist[dwpok] === "Gourgeist-XL" || halist[dwpok] === "Pumpkaboo-XL") { //temporary until pokeNum is fixed
            num = (halist[dwpok] === "Gourgeist-XL" ? (65536*3)+711 : (65536*3)+710);
        }
        if (num === undefined)
            sys.sendAll("Script Check: Unknown poke in hapokemons: '" +halist[dwpok]+"'.", announceChan);
        else if (script.hapokemons[num] === true)
            sys.sendAll("Script Check:  hapokemons contains '" +halist[dwpok]+"' multiple times.", announceChan);
        else {
            script.hapokemons[num] = true;
            if (dwlist.indexOf(halist[dwpok]) > -1) {
                dwpokemons[num] = true;
            }
        }
    }

    var lclist = ["Bulbasaur", "Charmander", "Squirtle", "Croagunk", "Turtwig", "Chimchar", "Piplup", "Treecko", "Torchic", "Mudkip", "Pansage", "Pansear", "Panpour"];
    lcpokemons = lclist.map(sys.pokeNum);
    lcmoves = {
        "Bronzor":["Iron Defense"],
        "Golett":["Rollout","Shadow Punch","Iron Defense","Mega Punch","Magnitude","DynamicPunch","Night Shade","Curse","Hammer Arm","Focus Punch"],
        "Klink":["Charge","Thundershock","Gear Grind","Bind","Mirror Shot","Screech","Discharge","Metal Sound","Shift Gear","Lock-On","Zap Cannon"],
        "Petilil":["Entrainment"],
        "Rufflet":["Wing Attack","Scary Face","Slash","Defog","Air Slash","Crush Claw","Whirlwind","Brave Bird","Thrash"]
    };
    bannedGSCSleep
