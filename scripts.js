// This is the official Pokemon Online Scripts
// These scripts will only work on 1.0.23 or newer.

// You may change these variables as long as you keep the same type
var Config = {
    base_url: "https://raw.github.com/lamperi/po-server-goodies/master/",
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
    // suspectvoting.js available, but not in use
    Plugins: ["mafia.js", "amoebagame.js", "tournaments.js", "tourstats.js"],
    Mafia: {
        bot: "Murkrow",
        norepeat: 6,
        stats_file: "mafia_stats.json",
        max_name_length: 14,
        notPlayingMsg: "±Game: The game is in progress. Please type /join to join the next mafia game."
    },
    League: [
        ["M Dragon", "Elite Four"],
        ["Jedgi", "Elite Four"],
        ["Amarillo Caballero", "Elite Four"],
        ["Deria", "Elite Four"],
        ["mibuchiha", "5th Generation WiFi Ubers"],
        ["IFM", "5th Generation WiFi OverUsed"],
        ["1996ITO", "5th Generation Dream World OverUsed"],
        ["Stofil", "5th Generation LittleUsed Gym"],
        ["Psykout22", "5th Generation WiFi Little Cup"],
        ["Marmoteo", "5th Generation OU Triples"],
        ["ZIAH", "5th Generation Monotype"],
        ["Manaphy", "4th Generation Ubers"],
        ["Fakes", "4th Generation OverUsed"],
        ["HSOWA", "4th Generation NeverUsed"],
        ["CALLOUS", "3rd Generation OverUsed"],
        ["Jorgen", "2nd Generation OverUsed"],
        ["Platinum", "Mixed Generation Challenge Cup"]
    ],
    DreamWorldTiers: ["DW OU", "DW Ubers", "DW LC", "Monotype", "DW UU", "DW LU", "DW 1v1 Ubers", "DW 1v1", "Challenge Cup", "CC 1v1", "DW Uber Triples", "DW OU Triples", "DW Uber Doubles", "DW OU Doubles", "Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST", "Monocolour", "Clear Skies DW"],
    superAdmins: ["Lamperi", "Professor Oak", "zeroality", "[LD]Jirachier", "nixeagle"],
    canJoinStaffChannel: ["Lamperi-", "Peanutsdroid", "QuX"],
    disallowStaffChannel: [],
}

// Don't touch anything here if you don't know what you do.

if (typeof require === "undefined")
    require = function require(module_name) {
        if (require.cache[module_name])
            return require.cache[module_name];

        var module = {};
        module.module = module;
        module.exports = {};
        module.source = module_name;
        with (module) {
            var content = sys.getFileContent(module_name)
            if (content) {
                try {
                     eval(sys.getFileContent(module_name));
                } catch(e) {
                     sys.sendAll("Error loading module " + module_name + ": " + e);
                }
            }
        }
        require.cache[module_name] = module.exports;
        return module.exports;
    }
    if (!require.cache)
        require.cache = {};

//if (typeof updateModule === "undefined")
    updateModule = function updateModule(module_name, callback) {
       var base_url = Config.base_url;
       var url;
       if (/^https?:\/\//.test(module_name))
          url = module_name;
       else
          url = base_url + module_name;
       var fname = module_name.split(/\//).pop();
       if (!callback) {
           var resp = sys.synchronousWebCall(url);
           if (resp == "") return {};
           sys.writeToFile(fname, resp);
           delete require.cache[fname];
           var module = require(fname);
           return module;
       } else {
           sys.webCall(url, function updateModule_callback(resp) {
               if (resp == "") return;
               sys.writeToFile(fname, resp);
               delete require.cache[fname];
               var module = require(fname);
               callback(module);
           });
       }
    }

{
    /* we need to make sure the scripts exist */
    var deps = ['crc32.js', 'utilities.js', 'bot.js', 'memoryhash.js', 'tierchecks.js'].concat(Config.Plugins);
    var missing = 0;
    for (var i = 0; i < deps.length; ++i) {
        if (!sys.getFileContent(deps[i])) {
            if (missing++ == 0) sys.sendAll('Server is updating its script modules, it might take a while...')
            var module = updateModule(deps[i]);
            module.source = deps[i];
        }
    }
    if (missing) sys.sendAll('Done. Updated ' + missing + ' modules.')
}


/* To avoid a load of warning for new users of the script,
        create all the files that will be read further on*/
var cleanFile = function(filename) {
    if (typeof sys != 'undefined')
        sys.appendToFile(filename, "");
};
cleanFile("mafia_stats.json");
cleanFile("suspectvoting.json");
cleanFile("wfbset.json");
cleanFile("mafiathemes/metadata.json");
cleanFile("channelData.json");
cleanFile("mutes.txt");
cleanFile("mbans.txt");
cleanFile("smutes.txt");
cleanFile("rangebans.txt");
cleanFile("contributors.txt");
cleanFile("pastebin_user_key");


var crc32 = require('crc32.js').crc32;
var MemoryHash = require('memoryhash.js').MemoryHash;
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
    /* caps counter for user */
    this.caps = 0;
    /* whether user is impersonating someone */
    this.impersonation = undefined;
    /* last time user said something */
    this.timecount = parseInt(sys.time());
    /* counter on how many lines user has said recently */
    this.floodcount = 0;
    /* counts coins */
    this.coins = 0;
    /* whether user has enabled battling only in same tier */
    this.sametier = undefined;
    /* name history */
    this.namehistory = [];
    /* channels watched */
    this.watched = [];
    /* last line */
    this.lastline = {message: null, time: 0};
    /* login time */
    this.logintime = parseInt(sys.time());
    /* tier alerts */	
    this.tiers = ""
    /* host name */
    this.hostname = "pending";
    var user = this; // closure
    sys.hostName(sys.ip(id), function(result) {
        try {
            user.hostname = result;
        } catch (e) {}
    });

    // warn find battle custom message
    this.reloadwfb();

    /* android default team check */
    var android = true
    for (var i = 0; i < 6; ++i) {
        if (sys.teamPoke(this.id, i) != POKEMON_CLEFFA) {
            android = false;
            break;
        }
    }
    this.android = android;

    var name = sys.name(id);
    /* check if user is megauser */
    if (megausers.indexOf("*" + name + "*") != -1)
        this.megauser = true;
    if (contributors.hash.hasOwnProperty(name))
        this.contributions = contributors.get(name);

    /* check if user is banned or mafiabanned */
    var data;
    var loopArgs = [["mute", mutes], ["mban", mbans], ["smute", smutes]];
    for (var i = 0; i < 3; ++i) {
        var action = loopArgs[i][0];
        if (data = loopArgs[i][1].get(sys.ip(id))) {
            this[action].active=true;
            var args = data.split(":");
            this[action].time = parseInt(args[0]);
            if (args.length == 5) {
                this[action].by = args[1];
                this[action].expires = parseInt(args[2]);
                this[action].reason = args.slice(4).join(":");
            }
        }
    }
}


POUser.prototype.toString = function() {
    return "[object POUser]";
}

POUser.prototype.expired = function(thingy) {
    return this[thingy].expires != 0 && this[thingy].expires < sys.time();
}

POUser.prototype.activate = function(thingy, by, expires, reason, persistent) {
    this[thingy].active = true;
    this[thingy].by = by;
    this[thingy].expires = expires;
    this[thingy].time = parseInt(sys.time());
    this[thingy].reason = reason;
    if (persistent) {
        var table = {"mute": mutes, "smute": smutes, "mban": mbans}
        table[thingy].add(sys.ip(this.id), sys.time() + ":" + by + ":" + expires + ":" + sys.name(this.id) + ":" + reason);
    }
    if (thingy == "mute") {
        if (typeof trollchannel != "undefined" && sys.channel(trollchannel) !== undefined && !sys.isInChannel(this.id, trollchannel)) {
            sys.putInChannel(this.id, trollchannel);
        }
    }

    callplugins("on"+ utilities.capitalize(thingy), this.id);
}

POUser.prototype.un = function(thingy) {
    this[thingy].active = false;
    this[thingy].expires = 0;
    var table = {"mute": mutes, "smute": smutes, "mban": mbans}
    table[thingy].remove(sys.ip(this.id));

    if (thingy == "mute") {
        if (typeof trollchannel != "undefined" && sys.channel(trollchannel) !== undefined && sys.isInChannel(this.id, trollchannel)) {
            sys.kick(this.id, trollchannel);
            if (sys.isInChannel(this.id, 0) != true) {
                sys.putInChannel(this.id, 0)
            }
        }
    }
    callplugins("onUn"+ utilities.capitalize(thingy), this.id);
}

POUser.prototype.reloadwfb = function() {
    if (SESSION.global() === undefined)
        return;
    var n = sys.name(this.id).toLowerCase();
    this.wfbmsg = SESSION.global().wfbset && SESSION.global().wfbset.hasOwnProperty(n)
        ?  SESSION.global().wfbset[n] : undefined;
}

/* POChannel */
function POChannel(id)
{
    this.id = id;
    this.masters = [];
    this.operators = [];
    this.perm = false;
    this.inviteonly = 0;
    this.invitelist = [];
    this.topic = "";
    this.topicSetter = "";
    this.muteall = undefined;
    this.meoff = undefined;
    this.muted = {ips: {}};
    this.banned = {ips: {}};
    this.watchers = [];
    this.ignorecaps = false;
    this.ignoreflood = false;
}

POChannel.prototype.beforeMessage = function(src, msg) {
   this.watchers = this.watchers || [];
   for (var i = 0; i < this.watchers.length; i++) {
        sys.sendMessage(this.watchers[i], "[#" + sys.channel(this.id) + "] " + sys.name(src) + " -- " + msg, staffchannel);
   }
}

POChannel.prototype.removeWatcher = function (id) {
    if (this.watchers != undefined && this.watchers.indexOf(id) != -1) {
        var index = this.watchers.indexOf(id);
        this.watchers = this.watchers.slice(0, index) + this.watchers.slice(index+1);
    }
}

POChannel.prototype.toString = function() {
    return "[object POChannel]";
}

POChannel.prototype.setTopic = function(src, topicInfo)
{
    var canSetTopic = (sys.auth(src) > 0 || this.isChannelOperator(src));
    if (topicInfo == undefined) {
        if (typeof this.topic != 'undefined') {
            channelbot.sendChanMessage(src, "Topic for this channel is: " + this.topic);
            if (SESSION.channels(channel).topicSetter) {
                channelbot.sendChanMessage(src, "Topic was set by " + nonFlashing(this.topicSetter));
            }
        } else {
            channelbot.sendChanMessage(src, "No topic set for this channel.");
        }
        if (canSetTopic) {
            channelbot.sendChanMessage(src, "Specify a topic to set one!");
        }
        return;
    }
    if (!canSetTopic) {
        channelbot.sendChanMessage(src, "You don't have the rights to set topic");
        return;
    }
    this.topic = topicInfo;
    this.topicSetter = sys.name(src);
    SESSION.global().channelManager.updateChannelTopic(sys.channel(this.id), topicInfo, sys.name(src));
    channelbot.sendChanAll("" + sys.name(src) + " changed the topic to: " + topicInfo);
}

POChannel.prototype.isChannelMaster = function(id)
{
    return this.masters.indexOf(sys.name(id).toLowerCase()) > -1;
}
POChannel.prototype.isChannelOperator = function(id)
{
    return this.isChannelMaster(id) || this.operators.indexOf(sys.name(id).toLowerCase()) != -1;
}
POChannel.prototype.issueAuth = function(src, name, authlist)
{
    var lname;
    var role = authlist.substring(0, authlist.length-1);
    var tar = sys.id(name);
    if (tar !== undefined) {
        name = sys.name(tar);
        lname = name.toLowerCase();
        if (this[authlist].indexOf(lname) == -1) {
            this[authlist].push(lname);
            channelbot.sendChanMessage(src, "" + name + " is now a channel " + role + ".");
            channelbot.sendChanMessage(tar, "You are now a channel " + role + ".");
            channelbot.sendChanAll(name + " is now a channel " + role + ".");
        } else {
            channelbot.sendChanMessage(src, "" + name + " is already a channel " + role + ".");
        }
    } else {
        name = lname = name.toLowerCase();
        if (this[authlist].indexOf(lname) == -1) {
            this[authlist].push(lname);
            channelbot.sendChanMessage(src, "" + name + " is now a channel " + role + ".");
            channelbot.sendChanAll(name + " is now a channel " + role + ".");
        } else {
            channelbot.sendChanMessage(src, "" + name + " is already a channel " + role + ".");
        }
    }
}

POChannel.prototype.takeAuth = function(src, name, authlist)
{
    var role = authlist.substring(0, authlist.length-1);
    name = name.toLowerCase();
    var index = this[authlist].indexOf(name);
    if (index == -1 && name[0] == "~") {
        index = parseInt(name.substr(1));
        name = this[authlist][index];
    }
    if (index != -1) {
        this[authlist].splice(index,1);
        channelbot.sendChanMessage(src, "" + name + " is no more a channel " + role +".");
        channelbot.sendChanAll(name + " is no more a channel " + role + ".");
    } else {
        channelbot.sendChanMessage(src, "" + name + ": no such "+ role +".");
    }
}

POChannel.prototype.addOperator = function(src, name)
{
    this.issueAuth(src, name, "operators");
    SESSION.global().channelManager.updateOperators(sys.channel(this.id), this.operators);
}
POChannel.prototype.removeOperator = function(src, name)
{
    this.takeAuth(src, name, "operators");
    SESSION.global().channelManager.updateOperators(sys.channel(this.id), this.operators);
}

POChannel.prototype.addOwner = function(src, name)
{
    this.issueAuth(src, name, "masters");
    SESSION.global().channelManager.updateMasters(sys.channel(this.id), this.masters);
}
POChannel.prototype.removeOwner = function(src, name)
{
    this.takeAuth(src, name, "masters");
    SESSION.global().channelManager.updateMasters(sys.channel(this.id), this.masters);
}

POChannel.prototype.register = function(name)
{
    if (this.masters.length == 0) {
        this.masters.push(name.toLowerCase());
        return true;
    }
    return false;
}

POChannel.prototype.allowed = function(id, what)
{
    if (sys.auth(id) > 0)
        return true;
    if (this[what]) {
        var ip = sys.ip(id);
        if (this[what].ips.hasOwnProperty(ip))
            return false;
    }
    return true;
}
POChannel.prototype.canJoin = function(id)
{
    return this.allowed(id, "banned") || this.isChannelOperator(id);
}

POChannel.prototype.canTalk = function(id)
{
    return this.allowed(id, "muted") || this.isChannelOperator(id);
}

POChannel.prototype.disallow = function(data, what)
{
    var id = sys.id(data);
    var ip = id ? sys.ip(id) : sys.dbIp(data);
    if (ip) {
        this[what].ips[ip] = data;
        return true;
    }
    return false;
}

POChannel.prototype.allow = function(data, what)
{
    var id = sys.id(data);
    var ip = id ? sys.ip(id) : sys.dbIp(data);
    if (this[what].ips.hasOwnProperty(ip)) {
        delete this[what].ips[ip];
        return true;
    }
    if (this[what].ips.hasOwnProperty(data)) {
        delete this[what].ips[data];
        return true;
    }
    return false;
}

POChannel.prototype.ban = function(data)
{
    return this.disallow(data, "banned");
}

POChannel.prototype.unban = function(data)
{
    return this.allow(data, "banned");
}

POChannel.prototype.mute = function(data)
{
    return this.disallow(data, "muted");
}

POChannel.prototype.unmute = function(data)
{
    return this.allow(data, "muted");
}

/* Object that manages channels */
function POChannelManager(fname)
{
    /* Permanent channels */
    this.channelDataFile = fname;
    try {
        this.channelData = JSON.parse(sys.getFileContent(this.channelDataFile));
    } catch (err) {
        print('Could not read channelData.');
        print('Error: ' + err);
        this.channelData = {};
    }
}

POChannelManager.prototype.toString = function()
{
    return "[object POChannelManager]";
}

POChannelManager.prototype.updateChannelTopic = function(channelName, topic, name)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].topic = topic;
    this.channelData[channelName].topicSetter = name;
    this.save();
}

POChannelManager.prototype.updateChannelPerm = function(channelName, perm)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].perm = perm;
    this.save();
}

POChannelManager.prototype.updateOperators = function(channelName, operators)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].operators = operators;
    this.save();
}

POChannelManager.prototype.updateMasters = function(channelName, masters)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].masters = masters;
    this.save();
}

POChannelManager.prototype.update = function(channelName, chan)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].topic = chan.topic;
    this.channelData[channelName].topicSetter = chan.topicSetter;
    this.channelData[channelName].perm = chan.perm;
    this.channelData[channelName].masters = chan.masters;
    this.channelData[channelName].operators = chan.operators;
    this.save();
}

POChannelManager.prototype.save = function()
{
    sys.writeToFile(this.channelDataFile, JSON.stringify(this.channelData));
}

POChannelManager.prototype.ensureChannel = function(channelName)
{
    if (!(channelName in this.channelData)) {
        this.channelData[channelName] = {};
        this.channelData[channelName].topic = '';
        this.channelData[channelName].topicSetter = '';
        this.channelData[channelName].perm = false;
        this.channelData[channelName].masters = [];
        this.channelData[channelName].operators = [];
    }
}

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
}

POChannelManager.prototype.restoreSettings = function(cid)
{
    var chan = SESSION.channels(cid);
    var name = sys.channel(cid)
    if (name in this.channelData) {
        var data = this.channelData[name];
        ['topic', 'topicSetter', 'operators', 'masters', 'perm'].forEach(
            function(attr) {
                if (data[attr] !== undefined)
                    chan[attr] = data[attr];
            }
        );
    }
}

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
    this.channelManager = new POChannelManager('channelData.json');
    var manager = this.channelManager;
    sys.channelIds().forEach(function(id) {
        manager.restoreSettings(id);
    });
    try {
        this.wfbset = JSON.parse(sys.getFileContent('wfbset.json'));
    } catch (e) {
        this.wfbset = {};
    }
    sys.playerIds().forEach(function(id) {
        SESSION.players(id).reloadwfb();
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
                sys.sendAll('Plugins-error on {0}: {1}'.format(plugins[i].source, e));
            }
        }
    }
    return ret;
}

POGlobal.prototype.getplugins = function getplugins(data) {
    var plugins = this.plugins;
    var ret = {};
    for (var i = 0; i < plugins.length; ++i) {
        if (plugins[i].hasOwnProperty(data)) {
            ret[plugins[i].source] = plugins[i][data];
        }
    }
    return ret;
}

function callplugins() {
    return SESSION.global().callplugins.apply(SESSION.global(), arguments);
}
function getplugins() {
    return SESSION.global().getplugins.apply(SESSION.global(), arguments);
}

SESSION.identifyScriptAs("PO Scripts v0.004");
SESSION.registerGlobalFactory(POGlobal);
SESSION.registerUserFactory(POUser);
SESSION.registerChannelFactory(POChannel);

if (typeof SESSION.global() != 'undefined') {
    SESSION.global().channelManager = new POChannelManager('channelData.json');

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
            if (!SESSION.users(id))
                sys.sendAll("ScriptUpdate: SESSION storage broken for user: " + sys.name(id), staffchannel);
            else
                SESSION.users(id).__proto__ = POUser.prototype;
        }
    });

}

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

var commands = {
    user:
    [
        "/rules: Shows the rules",
        "/ranking: Shows your ranking in your current tier.",
        "/myalts: Lists your alts.",
        "/me [message]: Sends a message with *** before your name.",
        "/selfkick: Kicks all other accounts with IP.",
        "/importable: Posts an importable of your team to pastebin.",
        "/dwreleased [Pokemon]: Shows the released status of a Pokemon's Dream World Ability",
        "/register: Registers a channel with you as owner.",
        "/resetpass: Clears your password (unregisters you, remember to reregister).",
        "/auth [owners/admins/mods]: Lists auth of given level, shows all auth if left blank.",
        "/cauth: Lists all users with channel auth in the current channel.",
        "/megausers: Lists megausers.",
        "/contributors: Lists contributors.",
        "/league: Lists gym leaders and elite four of the PO league.",
        "/uptime: Shows time since the server was last offline.",
        "/players: Shows the number of players online.",
        "/sameTier [on/off]: Turn on/off auto-rejection of challenges from players in a different tier from you.",
        "/touralerts [on/off]: Turn on/off your tour alerts (Shows list of Tour Alerts if on/off isn't specified)",
	"/addtouralert [tier] : Adds a tour alert for the specified tier",
	"/removetouralert [tier] : Removes a tour alert for the specified tier",
    ],
    channel:
    [
        "/topic [topic]: Sets the topic of a channel. Only works if you're the first to log on a channel or have auth there. Displays current topic instead if no new one is given.",
        "/lt [name]: Kick someone from current channel.",
        "/inviteonly [on|off]: Makes a channel invite-only or public.",
        "/invite [name]: Invites a user to current channel.",
        "/op [name]: Gives a user operator status.",
        "/deop [name]: Removes operator status from a user.",
        "/csilence [minutes]: Prevents authless users from talking in current channel specified time.",
        "/csilenceoff: Allows users to talk in current channel.",
        "/cmute [name]: Mutes someone in current channel.",
        "/cunmute [name]: Unmutes someone in current channel.",
        "/cmutes: Lists users muted in current channel.",
        "/cbans: Lists users banned from current channel.",
        "Only channel masters may use the following commands:",
        "/ctogglecaps: Turns on/off the server anti-caps bot in current channel.",
        "/ctoggleflood: Turns on/off the server anti-flood bot in current channel. Overactive still in effect.",
        "/cban [name]: Bans someone from current channel.",
        "/cunban [name]: Unbans someone from current channel.",
        "/owner [name]: Gives a user owner status.",
        "/deowner [name]: Removes owner status from a user.",
    ],
    mod:
    [
        "/k [name]: Kicks someone.",
        "/mute [name]:[reason]:[time]: Mutes someone. Time is optional and defaults to 12 hours.",
        "/unmute [name]: Unmutes someone.",
        "/wfb [target]: Warns a user about asking for battles.",
        "/wfbset [message]: Sets your personal warning message, {{user}} will be replaced by the target.",
        "/silence [minutes]:[channel]: Prevents authless users from talking in a channel for specified time. Affects all official channels if no channel is given.",
        "/silenceoff [channel]: Removes silence from a channel. Affects all official channels if none is specified.",
        "/meoff [channel], /meon [channel]: Disables/enables the /me command. Affects all channels if no channel is specified.",
        "/perm [on/off]: Make the current permanent channel or not (permanent channels remain listed when they have no users).",
        "/userinfo [name]: Displays information about a user (pretty display).",
        "/whois [name]: Displays information about a user (one line, slightly more info).",
        "/aliases [IP/name]: Shows the aliases of an IP or name.",
        "/tempban [name]:[minutes]: Bans someone for an hour or less.",
        "/tempunban [name]: Unbans a temporary banned user (standard unban doesn't work).",
        "/mafiaban [name]:[reason]:[time]: Bans a player from Mafia. Time is optional and defaults to 7 days.",
        "/mafiaunban [name]: Unbans a player from Mafia.",
        "/passauth [target]: Passes your mods to another megauser (only for mega-mods) or to your online alt.",
        "/passauths [target]: Passes your mods silently.",
        "/banlist [search term]: Searches the banlist, shows full list if no search term is entered.",
        "/mutelist [search term]: Searches the mutelist, shows full list if no search term is entered.",
        "/smutelist [search term]: Searches the smutelist, shows full list if no search term is entered.",
        "/mafiabans [search term]: Searches the mafiabanlist, shows full list if no search team is entered.",
        "/rangebans: Lists range bans.",
        "/tempbans: Lists temp bans.",
        "/namebans: Lists name bans.",
        "/endcalls: Ends the next periodic message.",
    ],
    admin:
    [
        "/ban [name]: Bans a user.",
        "/unban [name]: Unbans a user.",
        "/smute xxx: Secretly mutes a user. Can't smute auth.",
        "/sunmute xxx: Removes secret mute from a user.",
        "/megauser[off] xxx: Adds or removes megauser powers from someone.",
        "/memorydump: Shows the state of the memory.",
        "/nameban regexp: Adds a regexp ban on usernames.",
        "/nameunban full_regexp: Removes a regexp ban on usernames.",
        "/destroychan [channel]: Destroy a channel (official channels are protected).",
        "/channelusers [channel]: Lists users on a channel.",
        "/[un]watch [channel]: See the chat of a channel"
    ],
    owner:
    [
        "/changeRating [player] -- [tier] -- [rating]: Changes the rating of a rating abuser.",
        "/stopBattles: Stops all new battles to allow for server restart with less problems for users.",
        "/imp [name]: Lets you speak as someone",
        "/impOff: Stops your impersonating.",
        "/contributor[off] xxx:what: Adds or removes contributor status (for indigo access) from someone, with reason.",
        "/clearpass [name]: Clears a user's password.",
        "/periodicsay minutes:channel1,channel2,...:[message]: Sends a message to specified channels periodically.",
        "/sendAll [message]: Sends a message to everyone.",
        "/changeAuth [auth] [name]: Changes the auth of a user.",
        "/showteam xxx: Displays the team of a user (to help people who have problems with event moves or invalid teams).",
        "/rangeban [ip] [comment]: Makes a range ban.",
        "/rangeunban: [ip]: Removes a rangban.",
        "/purgemutes [time]: Purges old mutes. Time is given in seconds. Defaults is 4 weeks.",
        "/purgembans [time]: Purges old mafiabans. Time is given in seconds. Default is 1 week.",
        "/updateScripts: Updates scripts from the web."
    ]
};

/* Start script-object
 *
 * All the events are defined here
 */

({
/* Executed every second */
stepEvent: function() {
    if (typeof callplugins == "function") callplugins("stepEvent");
}
,

repeatStepEvent: function(globalCounter) {
    if (stepCounter != globalCounter) {
        return;
    }

    stepCounter = stepCounter+1;
    sys.callQuickly("script.repeatStepEvent(" + stepCounter + ")", 1000);

    /* Using script. instead of this. so as to stop it when this function is removed */
    script.stepEvent();
}

,
startStepEvent: function() {
    stepCounter = 0;

    this.repeatStepEvent(0);
}
,
serverStartUp : function() {
    startUpTime = parseInt(sys.time());
    scriptChecks = 0;
    this.init();
}

,
init : function() {
    lastMemUpdate = 0;
    this.startStepEvent();

    callplugins("init");
    bannedUrls = [];

    mafiachan = SESSION.global().channelManager.createPermChannel("Mafia Channel", "Use /help to get started!");
    staffchannel = SESSION.global().channelManager.createPermChannel("Indigo Plateau", "Welcome to the Staff Channel! Discuss of all what users shouldn't hear here! Or more serious stuff...");
    sachannel = SESSION.global().channelManager.createPermChannel("shanaindigo","Welcome MAs and SAs!");
    tourchannel = SESSION.global().channelManager.createPermChannel("Tournaments", 'Useful commands are "/join" (to join a tournament), "/unjoin" (to leave a tournament), "/viewround" (to view the status of matches) and "/megausers" (for a list of users who manage tournaments). Please read the full Tournament Guidelines: http://pokemon-online.eu/forums/showthread.php?2079-Tour-Rules');
    shanaitourchannel = tourchannel; //SESSION.global().channelManager.createPermChannel("Tours", 'Shanai Tours');
    //SESSION.global().channelManager.createPermChannel("League", "Challenge the PO League here! For more information, please visit this link: http://pokemon-online.eu/forums/forumdisplay.php?36-PO-League");
    trollchannel = SESSION.global().channelManager.createPermChannel("Mute City", 'This is a place to talk if you have been muted! Please behave, next stop will be bans.');

    var dwlist = ["Rattata", "Raticate", "Nidoran-F", "Nidorina", "Nidoqueen", "Nidoran-M", "Nidorino", "Nidoking", "Oddish", "Gloom", "Vileplume", "Bellossom", "Bellsprout", "Weepinbell", "Victreebel", "Ponyta", "Rapidash", "Farfetch'd", "Doduo", "Dodrio", "Exeggcute", "Exeggutor", "Lickitung", "Lickilicky", "Tangela", "Tangrowth", "Kangaskhan", "Sentret", "Furret", "Cleffa", "Clefairy", "Clefable", "Igglybuff", "Jigglypuff", "Wigglytuff", "Mareep", "Flaaffy", "Ampharos", "Hoppip", "Skiploom", "Jumpluff", "Sunkern", "Sunflora", "Stantler", "Poochyena", "Mightyena", "Lotad", "Ludicolo", "Lombre", "Taillow", "Swellow", "Surskit", "Masquerain", "Bidoof", "Bibarel", "Shinx", "Luxio", "Luxray", "Psyduck", "Golduck", "Growlithe", "Arcanine", "Scyther", "Scizor", "Tauros", "Azurill", "Marill", "Azumarill", "Bonsly", "Sudowoodo", "Girafarig", "Miltank", "Zigzagoon", "Linoone", "Electrike", "Manectric", "Castform", "Pachirisu", "Buneary", "Lopunny", "Glameow", "Purugly", "Natu", "Xatu", "Skitty", "Delcatty", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Bulbasaur", "Charmander", "Squirtle", "Ivysaur", "Venusaur", "Charmeleon", "Charizard", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Infernape", "Monferno", "Piplup", "Prinplup", "Empoleon", "Treecko", "Sceptile", "Grovyle", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Caterpie", "Metapod", "Butterfree", "Pidgey", "Pidgeotto", "Pidgeot", "Spearow", "Fearow", "Zubat", "Golbat", "Crobat", "Aerodactyl", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Yanma", "Yanmega", "Murkrow", "Honchkrow", "Delibird", "Wingull", "Pelipper", "Swablu", "Altaria", "Starly", "Staravia", "Staraptor", "Gligar", "Gliscor", "Drifloon", "Drifblim", "Skarmory", "Tropius", "Chatot", "Slowpoke", "Slowbro", "Slowking", "Krabby", "Kingler", "Horsea", "Seadra", "Kingdra", "Goldeen", "Seaking", "Magikarp", "Gyarados", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Wooper", "Quagsire", "Qwilfish", "Corsola", "Remoraid", "Octillery", "Mantine", "Mantyke", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Barboach", "Whiscash", "Clamperl", "Gorebyss", "Huntail", "Relicanth", "Luvdisc", "Buizel", "Floatzel", "Finneon", "Lumineon", "Tentacool", "Tentacruel", "Corphish", "Crawdaunt", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Shellos", "Gastrodon", "Lapras", "Dratini", "Dragonair", "Dragonite", "Elekid", "Electabuzz", "Electivire", "Poliwag", "Poliwrath", "Politoed", "Poliwhirl", "Vulpix", "Ninetales", "Musharna", "Munna", "Darmanitan", "Darumaka", "Mamoswine", "Togekiss", "Burmy", "Wormadam", "Mothim", "Pichu", "Pikachu", "Raichu","Abra","Kadabra","Alakazam","Spiritomb","Mr. Mime","Mime Jr.","Meditite","Medicham","Meowth","Persian","Shuppet","Banette","Spinarak","Ariados","Drowzee","Hypno","Wobbuffet","Wynaut","Snubbull","Granbull","Houndour","Houndoom","Smoochum","Jynx","Ralts","Gardevoir","Gallade","Sableye","Mawile","Volbeat","Illumise","Spoink","Grumpig","Stunky","Skuntank","Bronzong","Bronzor","Mankey","Primeape","Machop","Machoke","Machamp","Magnemite","Magneton","Magnezone","Koffing","Weezing","Rhyhorn","Rhydon","Rhyperior","Teddiursa","Ursaring","Slugma","Magcargo","Phanpy","Donphan","Magby","Magmar","Magmortar","Larvitar","Pupitar","Tyranitar","Makuhita","Hariyama","Numel","Camerupt","Torkoal","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Absol","Beldum","Metang","Metagross","Hippopotas","Hippowdon","Skorupi","Drapion","Tyrogue","Hitmonlee","Hitmonchan","Hitmontop","Bagon","Shelgon","Salamence","Seel","Dewgong","Shellder","Cloyster","Chinchou","Lanturn","Smeargle","Porygon","Porygon2","Porygon-Z"];
    /* use hash for faster lookup */
    dwpokemons = {};
    var announceChan = (typeof staffchannel == "number") ? staffchannel : 0;
    for(var dwpok in dwlist) {
        var num = sys.pokeNum(dwlist[dwpok]);
        if (num === undefined)
            sys.sendAll("Script Check: Unknown poke in dwpokemons: '" +dwlist[dwpok]+"'.", announceChan);
        else if (dwpokemons[num] === true)
            sys.sendAll("Script Check: dwpokemons contains '" +dwlist[dwpok]+"' multiple times.", announceChan);
        else
            dwpokemons[sys.pokeNum(dwlist[dwpok])] = true;
    }

    var lclist = ["Bulbasaur", "Charmander", "Squirtle", "Croagunk", "Turtwig", "Chimchar", "Piplup", "Treecko","Torchic","Mudkip"]
    lcpokemons = [];
    for(var dwpok in lclist) {
        lcpokemons.push(sys.pokeNum(lclist[dwpok]));
    }
    bannedGSCSleep = [sys.moveNum("Spore"), sys.moveNum("Hypnosis"), sys.moveNum("Lovely Kiss"), sys.moveNum("Sing"), sys.moveNum("Sleep Powder")].sort();
    bannedGSCTrap = [sys.moveNum("Mean Look"), sys.moveNum("Spider Web")].sort();

    var breedingList = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Mamoswine", "Togekiss","Hitmonlee","Hitmonchan","Hitmontop","Tyrogue", "Porygon", "Porygon2", "Porygon-Z"];
    breedingpokemons = [];
    for(var inpok in breedingList) {
        breedingpokemons.push(sys.pokeNum(breedingList[inpok]));
    }

    /* restore mutes, smutes, mafiabans, rangebans, megausers */
    mutes = new MemoryHash("mutes.txt");
    mbans = new MemoryHash("mbans.txt");
    smutes = new MemoryHash("smutes.txt");
    rangebans = new MemoryHash("rangebans.txt");
    contributors = new MemoryHash("contributors.txt");
    mafiaAdmins = new MemoryHash("mafiaadmins.txt");

    rules = [ "",
    "*** Rules ***",
    "",
    "Rule #1 - Do Not Abuse CAPS:",
    "- The occasional word in CAPS is acceptable, however repeated use is not.",
    "Rule #2 - No Flooding the Chat:",
    "- Please do not post a large amount of short messages when you can easily post one or two long messages.",
    "Rule #3 - Do not Challenge Spam:",
    "- If a person refuses your challenge, this means they do not want to battle you. Find someone else to battle with.",
    "Rule #4 - Don't ask for battles in the main chat:",
    "- There is a 'Find Battle' tab that you can use to find a battle immediately. If after a while you cannot find a match, then you can ask for one in the chat.",
    "Rule #5 - No Trolling/Flaming/Insulting of Any kind:",
    "- Behaving stupidly and excessive vulgarity will not be tolerated, using words including 'fuck' is a bad starting point.",
    "Rule #6 - Be Respectable of Each Others Cultures:",
    "- Not everyone speaks the same language. This server is not an English-Only Server. Do not tell someone to only speak a certain language.",
    "Rule #7 - No Advertising:",
    "- There will be absolutely no advertising on the server.",
    "Rule #8 - No Obscene or Pornographic Content Allowed:",
    "- This includes links, texts, images, and any other kind of media. This will result in an instant ban.",
    "Rule #9 - Do not ask for Auth:",
    "- Authority is given upon merit. By asking you have pretty much eliminated your chances at becoming an Auth in the future.",
    "Rule #10 - Do not Insult Auth:",
    "- Insulting an authority figure can result in immediate punishment, even if it's not in one of the official channels.",
    "Rule #11 - No minimodding:",
    "- Server has moderators for a reason. If someone breaks the rules, alert the auth, do not try to moderate yourself.",
    "Rule #12 - Do not share other people's personal information without their permission:",
    "- Violation of personal privacy is not nice at all, and you wouldn't want it happening to you. If found out, you will be permanently banned."
    ];

    if (typeof authStats == 'undefined')
        authStats = {};

    if (typeof tempBans == 'undefined') {
        tempBans = {};
    }
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
    }

    if (typeof VarsCreated != 'undefined')
        return;

    key = function(a,b) {
        return a + "*" + sys.ip(b);
    }

    saveKey = function(thing, id, val) {
        sys.saveVal(key(thing,id), val);
    }

    getKey = function(thing, id) {
        return sys.getVal(key(thing,id));
    }

    cmp = function(a, b) {
        return a.toLowerCase() == b.toLowerCase();
    }

    battlesStopped = false;

    megausers = sys.getVal("megausers");

    muteall = false;

    maxPlayersOnline = 0;

    lineCount = 0;

    pokeNatures = [];

    var list = "Heatran-Eruption/Quiet=Suicune-ExtremeSpeed/Relaxed|Sheer Cold/Relaxed|Aqua Ring/Relaxed|Air Slash/Relaxed=Raikou-ExtremeSpeed/Rash|Weather Ball/Rash|Zap Cannon/Rash|Aura Sphere/Rash=Entei-ExtremeSpeed/Adamant|Flare Blitz/Adamant|Howl/Adamant|Crush Claw/Adamant=Snivy-Aromatherapy/Hardy|Synthesis/Hardy";

    var sepPokes = list.split('=');
    for (var x in sepPokes) {
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
        pastebin_api_key = sys.getFileContent("pastebin_api_key").replace("\n", "");
        pastebin_user_key = sys.getFileContent("pastebin_user_key").replace("\n", "");
    } catch(e) {
        normalbot.sendAll("Couldn't load api keys: " + e, staffchannel);
    }


    /* global utility helpers */
    getSeconds = function(s) {
        var parts = s.split(" ")
        var secs = 0;
        for (var i = 0; i < parts.length; ++i) {
            var c = (parts[i][parts[i].length-1]).toLowerCase();
            var mul = 60;
            if (c == "s") { mul = 1; }
            else if (c == "m") { mul = 60; }
            else if (c == "h") { mul = 60*60; }
            else if (c == "d") { mul = 24*60*60; }
            else if (c == "w") { mul = 7*24*60*60; }
            secs += mul * parseInt(parts[i]);
        }
        return secs;
    };
    getTimeString = function(sec) {
        s = [];
        var n;
        var d = [[7*24*60*60, "week"], [24*60*60, "day"], [60*60, "hour"], [60, "minute"], [1, "second"]];
        for (j = 0; j < 5; ++j) {
            n = parseInt(sec / d[j][0]);
            if (n > 0) {
                s.push((n + " " + d[j][1] + (n > 1 ? "s" : "")));
                sec -= n * d[j][0];
                if (s.length >= 2) break;
            }
        }
        return s.join(", ");
    };

    sendChanMessage = function(id, message) {
        sys.sendMessage(id, message, channel);
    }

    sendChanAll = function(message) {
        sys.sendAll(message, channel);
    }

    sendMainTour = function(message) {
        sys.sendAll(message, 0);
        sys.sendAll(message, tourchannel);
    }

    VarsCreated = true;
} /* end of init */

,

issueBan : function(type, src, tar, commandData, maxTime) {
        var memoryhash = {"mute": mutes, "mban": mbans, "smute": smutes}[type];
        var banbot = type == "mban" ? mafiabot : normalbot;
        var verb = {"mute": "muted", "mban": "banned from mafia", "smute": "secretly muted"}[type];
        var nomi = {"mute": "mute", "mban": "ban from mafia", "smute": "secret mute"}[type];
        var sendAll =  {
            "smute": function(line) {
                banbot.sendAll(line, staffchannel);
				var authlist = sys.dbAuths()
				line = line.replace(" by " +sys.name(src), "")
				 for(x in authlist) {
					if(sys.id(authlist[x]) != undefined){
					var chanlist = sys.channelsOfPlayer(sys.id(authlist[x]))
						for(y in chanlist) {
							if(chanlist[y] != staffchannel) {
								banbot.sendMessage(sys.id(authlist[x]), line, chanlist[y])
						}	}
					}
				}
            },
            "mban": function(line) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, mafiachan);
                banbot.sendAll(line, sys.channelId("shanaindigo"));
            },
            "mute": function(line) {
                banbot.sendAll(line);
            }
        }[type];

        var expires = 0;
        var defaultTime = {"mute": "24h", "mban": "7d", "smute": "0"}[type];
        var reason = "";
        var timeString = "";
        var tindex = 10;
        var data = [];
        var ip;
        if (tar == undefined) {
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
        if (typeof maxTime == "number") secs = secs > maxTime ? maxTime : secs;
        if (secs > 0) {
            timeString = " for " + getTimeString(secs);
            expires = secs + parseInt(sys.time());
        }

        if (reason == "" && sys.auth(src) < 3) {
           banbot.sendChanMessage(src, "You need to give a reason to the " + nomi + "!");
           return;
        }

        var bannedReasons = ["idiot", "shut up", "fuck"];
        var lreason = reason.toLowerCase();
        for (var i = 0; i < bannedReasons.length; ++i) {
            if (lreason.indexOf(bannedReasons[i]) > -1) {
               banbot.sendChanMessage(src, "Including '" + bannedReasons[i] + "' in the reason is not a good practice!");
               return;
            }
        }

        if (tar == undefined) {
            ip = sys.dbIp(commandData);
            var maxAuth = sys.maxAuth(ip);
            if(maxAuth>=sys.auth(src) && maxAuth > 0) {
               banbot.sendChanMessage(src, "Can't do that to higher auth!");
               return;
            }
            if(ip != undefined) {
                if (memoryhash.get(ip)) {
                    banbot.sendChanMessage(src, "He/she's already " + verb + ".");
                    return;
                }
                sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + timeString + "! [Reason: " + reason + "] [Channel: "+sys.channel(channel) + "]");
                memoryhash.add(ip, sys.time() + ":" + sys.name(src) + ":" + expires + ":" + commandData + ":" + reason);
                var authname = sys.name(src).toLowerCase();
                authStats[authname] =  authStats[authname] || {};
                authStats[authname]["latest" + type] = [commandData, parseInt(sys.time())];
                return;
            }

            banbot.sendChanMessage(src, "Couldn't find " + commandData);
            return;
        }
        if (SESSION.users(tar)[type].active) {
            banbot.sendChanMessage(src, "He/she's already " + verb + ".");
            return;
        }
        if (sys.auth(tar) >= sys.auth(src) && sys.auth(tar) > 0) {
            banbot.sendChanMessage(src, "You dont have sufficient auth to " + nomi + " " + commandData + ".");
            return;
        }
        SESSION.users(tar).activate(type, sys.name(src), expires, reason, true);
        if (reason.length > 0)
            sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + timeString + "! [Reason: " + reason + "] [Channel: "+sys.channel(channel) + "]");
        else
            sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + timeString + "! [Channel: "+sys.channel(channel) + "]");

        var authname = sys.name(src).toLowerCase();
        authStats[authname] =  authStats[authname] || {}
        authStats[authname]["latest" + type] = [commandData, parseInt(sys.time())];
}

,

importable : function(id, compactible) {
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
    var nature_effects = {"Adamant": "(+Atk, -SAtk)", "Bold": "(+Def, -Atk)"}
    var genders = {0: '', 1: ' (M)', 2: ' (F)'};
    var stat = {0: 'HP', 1: 'Atk', 2: 'Def', 3: 'SAtk', 4: 'SDef', 5:'Spd'};
    var hpnum = sys.moveNum("Hidden Power");
    var ret = [];
    for (var i = 0; i < 6; ++i) {
        var poke = sys.teamPoke(id, i);
        if (poke === undefined)
            continue;

        var item = sys.teamPokeItem(id, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        ret.push(sys.pokemon(poke) + genders[sys.teamPokeGender(id, i)] + " @ " + item );
        ret.push('Trait: ' + sys.ability(sys.teamPokeAbility(id, i)));
        var level = sys.teamPokeLevel(id, i);
        if (!compactible && level != 100) ret.push('Lvl: ' + level);

        var ivs = [];
        var evs = [];
        var hpinfo = [sys.gen(id)];
        for (var j = 0; j < 6; ++j) {
            var iv = sys.teamPokeDV(id, i, j);
            if (iv != 31) ivs.push(iv + " " + stat[j]);
            var ev = sys.teamPokeEV(id, i, j);
            if (ev != 0) evs.push(ev + " " + stat[j]);
            hpinfo.push(iv);
        }
        if (!compactible && ivs.length > 0)
            ret.push('IVs: ' + ivs.join(" / "));
        if (evs.length > 0)
            ret.push('EVs: ' + evs.join(" / "));

        ret.push(sys.nature(sys.teamPokeNature(id, i)) + " Nature"); // + (+Spd, -Atk)

        for (var j = 0; j < 4; ++j) {
            var move = sys.teamPokeMove(id, i, j);
            if (move !== undefined) {
                ret.push('- ' + sys.move(move) + (move == hpnum ? ' [' + sys.type(sys.hiddenPowerType.apply(sys, hpinfo)) + ']':''));
            }
        }
        ret.push("")
    }
    return ret;
}

,

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
}

,

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
}

,

beforeChannelJoin : function(src, channel) {
    var poUser = SESSION.users(src);
    var poChannel = SESSION.channels(channel);

    callplugins("beforeChannelJoin", src, channel);

    if (poChannel.isChannelOperator(src)){
        return;
    }
    // Can't ban from main
    if (channel == 0) return;

    // Torus redirect
    if (sys.auth(src) == 0 && channel == sys.channelId("Tours")) {
        sys.stopEvent();
        sys.putInChannel(src, tourchannel);
        return;
    }

    var index = poChannel.invitelist.indexOf(src);
    if (index != -1) {
        // allow to bypass all limits if invited
        poChannel.invitelist.splice(index, 1);
        return;
    }
    if (sys.auth(src) < 3 && !poChannel.canJoin(src)) {
        channelbot.sendMessage(src, "You are banned from this channel! You can't join unless channel operators and masters unban you.");
        sys.stopEvent();
        return;
    }
    if (poChannel.inviteonly > sys.auth(src)) {
        sys.sendMessage(src, "+Guard: Sorry, but this channel is for higher authority!")
        sys.stopEvent();
        return;
    }
    if (channel == trollchannel && (!poUser.mute.active && sys.auth(src) <= 1)) {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
    if ((channel == staffchannel || channel == sys.channelId("shanaindigo")) && !this.canJoinStaffChannel(src)) {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
    if (channel == mafiachan && poUser.mban.active) {
        if (poUser.expired("mban")) {
            poUser.un("mban");
            mafiabot.sendMessage(src, "Your ban from Mafia expired.");
            mafiabot.sendAll("" + sys.name(src) + "'s ban from Mafia expired.", mafiachan);
        } else {

            var mbaninfo = poUser.mban;
            sendChanMessage(src, "+Guard: You are banned from Mafia" + (mbaninfo.by ? " by " + mbaninfo.by : '')+". " + (mbaninfo.expires > 0 ? "Ban expires in " + getTimeString(mbaninfo.expires - parseInt(sys.time())) + ". " : '') + (mbaninfo.reason ? "[Reason: " + mbaninfo.reason + "]" : ''));
            sys.stopEvent();
            return;
        }
    }
} /* end of beforeChannelJoin */

,
beforeChannelCreated : function(chan, name, src) {
    if (name == "x") { sys.stopEvent(); }
},

afterChannelCreated : function (chan, name, src) {
    SESSION.global().channelManager.restoreSettings(chan);
} /* end of afterChannelCreated */

,

afterChannelJoin : function(player, chan) {
    if (typeof SESSION.channels(chan).topic != 'undefined') {
        sys.sendMessage(player, "Welcome Message: " + SESSION.channels(chan).topic, chan);
        /*if (SESSION.channels(chan).topicSetter)
            sys.sendMessage(player, "Set by: " + SESSION.channels(chan).topicSetter, chan);*/
    }
    if (SESSION.channels(chan).isChannelOperator(player)) {
        sys.sendMessage(player, Config.channelbot + ": use /topic <topic> to change the welcome message of this channel", chan);
        return;
    }
} /* end of afterChannelJoin */

,

beforeChannelDestroyed : function(channel) {
    if (channel == tourchannel || (SESSION.channels(channel).perm == true) ) {
        sys.stopEvent();
        return;
    }
} /* end of beforeChannelDestroyed */
,

beforePlayerBan : function(src, dest) {
    var authname = sys.name(src).toLowerCase();
    authStats[authname] =  authStats[authname] || {}
    authStats[authname].latestBan = [sys.name(dest), parseInt(sys.time())];
}
,

afterNewMessage : function (message) {
    if (message == "Script Check: OK") {
        sys.sendAll("±ScriptCheck: Scripts were updated!");
        if (typeof(scriptChecks)=='undefined')
            scriptChecks = 0;
        scriptChecks += 1;
        this.init();
    }
} /* end of afterNewMessage */

,

isRangeBanned : function(ip) {
    for (var subip in rangebans.hash) {
        if (subip.length > 0 && ip.substr(0, subip.length) == subip) {
             return true;
        }
    }
    return false;
}

,

isTempBanned : function(ip) {
    if (ip in tempBans) {
        var time = parseInt(sys.time());
        if (time > parseInt(tempBans[ip].time)) {
            delete tempBans[ip];
        } else {
            return true;
        }
    }
    return false;
}

,

beforeLogIn : function(src) {

    var ip = sys.ip(src);
    if (this.isTempBanned(ip) && sys.auth(src) < 2) {
        normalbot.sendMessage(src, 'You are banned!');
        sys.stopEvent();
        return;
    }
    // auth can evade rangebans and namebans
    if (sys.auth(src) > 0) {
        return;
    }
    var allowedNames = ["sasukeanditachi", "sasukatandkitachi", "ata", "downpour", "broon89", "ifmltrailers", "probrem?", "salamander94", "realmanofgenius"];
    var name = sys.name(src).toLowerCase();
    if (this.isRangeBanned(ip) && allowedNames.indexOf(name) == -1) {
            normalbot.sendMessage('You are banned!');
            sys.stopEvent();
            return;
    }
    var arr =  ["172.", "72.20.", "199.255.",
                "199.58.", "188.227.", "174.129.",
                "174.36.", "174.37.", "94.46.",
                "142.16", "156.34.", "67.228.",
                "183.173.180.", "66.199.",
                "216.169.110.", "31.3.",
                "216.169.",
                "109.200.",
                "86.187.",
                "98.226.", /* skarm */
                "85.17.",
                "187.65.", /* retyples and hax re */
                "99.140.2" /* gaffpot, the gaff */];
    for (var i = 0; i < arr.length; i++) {
        if (ip.substr(0, arr[i].length) == arr[i] &&
            !sys.dbRegistered(sys.name(src))) {
            sys.sendAll("Potential ban evader: " + sys.name(src) + " on IP: " + ip, staffchannel);
        }
    }
    if (this.nameIsInappropriate(src)) {
        sys.stopEvent();
    }
}

,

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
    var creek = /[\u0370-\u03ff]/;
    if (creek.test(name)) {
        reply('You are using creek letters similar to latin letters in your name.');
        return true;
    }

    // \u0020 = space
    var space = /[\u0009-\u000D]|\u0085|\u00A0|\u1680|\u180E|[]\u2000-\u200A|\u2028|\u2029|\u2029|\u202F|\u205F|\u3000/;
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
    return false;
}
,

afterLogIn : function(src) {
    sys.sendMessage(src, "*** Type in /Rules to see the rules. ***");
    commandbot.sendMessage(src, "Use !commands to see the commands!");

    if (sys.numPlayers() > maxPlayersOnline) {
        maxPlayersOnline = sys.numPlayers();
    }
    if (sys.getColor(src) == "#ff007f" && /doj/i.test(sys.name(src))) {
        normalbot.sendAll("Smute based on color: " + sys.name(src) + ", IP: " + sys.ip(src), staffchannel);
        var endtime = parseInt(sys.time()) + 86400;
        SESSION.users(src).activate("smute", "Script", endtime, "User is probably Doj; color based auto smute", true);
        sys.delayedCall(function () {
            if (sys.id(src)) {
                sys.ban(sys.name(src));
                sys.kick(src);
            }
        }, sys.rand(10, 75));
    }

    if (maxPlayersOnline > sys.getVal("MaxPlayersOnline")) {
        sys.saveVal("MaxPlayersOnline", maxPlayersOnline);
    }

    countbot.sendMessage(src, "Max number of players online was " + sys.getVal("MaxPlayersOnline") + ".");
    if (typeof startUpTime == "number") {
        var diff = parseInt(sys.time()) - startUpTime;
        var days = parseInt(diff / (60*60*24));
        var hours = parseInt((diff % (60*60*24)) / (60*60));
        var minutes = parseInt((diff % (60*60)) / 60);
        var seconds = (diff % 60);
        countbot.sendMessage(src, "Server uptime is "+days+"d "+hours+"h "+minutes+"m "+seconds+"s");
    }
    sys.sendMessage(src, "");

    callplugins("afterLogIn", src);

   if (SESSION.users(src).android) {
        sys.changeTier(src, "Challenge Cup");
        if (sys.existChannel("PO Android")) {
            var androidChan = sys.channelId("PO Android");
            sys.putInChannel(src, androidChan);
            sys.kick(src, 0);
            sys.sendMessage(src, "*********", androidChan);
            sys.sendMessage(src, "Message: Hello " + sys.name(src) + "! You seem to be using Pokemon Online for Android. With it you are able to battle with random pokemon. If you want to battle with your own made team, please surf to http://pokemon-online.eu/download with your computer and download the desktop application to your desktop. With it you can export full teams to your Android device! If you using the version with ads from Android Market, download adfree version from http://code.google.com/p/pokemon-online-android/downloads/list", androidChan);
            sys.sendMessage(src, "*********", androidChan);
        }
    }


    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as Auth" + "\n");
    if(getKey('touralertson', src) == "true"){
	SESSION.users(src).tiers= getKey("touralerts", src)
    }	
    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
    this.afterChangeTeam(src);

    if (SESSION.users(src).mute.active)
        sys.putInChannel(src, trollchannel);
    if (sys.auth(src) <= 3 && this.canJoinStaffChannel(src))
        sys.putInChannel(src, staffchannel);
} /* end of afterLogin */

,

beforeLogOut : function(src) {
    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Disconnected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Disconnected as Auth" + "\n");
    var w = SESSION.users(src).watched;
    if (w != undefined) {
       for (i in w) {
           var c = SESSION.channels(w[i]);
           if (c != undefined) {
               c.removeWatcher(src);
           }
       }
    }
}

,

beforeChangeTeam : function(src) {
    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
}

,

afterChangeTeam : function(src)
{
    if (sys.auth(src) == 0 && this.nameIsInappropriate(src)) {
        sys.kick(src);
        return;
    }
    var POuser = SESSION.users(src);
    var new_name = sys.name(src);
    if (POuser.name != new_name) {
        var now = parseInt(sys.time());
        POuser.namehistory.push([new_name, now]);
        POuser.name = new_name;
        var spamcheck = POuser.namehistory[POuser.namehistory.length-3];
        if (spamcheck && spamcheck[1]+10 > now) {
            sys.kick(src);
            return;
        }
    }

    if (megausers.indexOf("*" + sys.name(src) + "*") != -1) {
        if(!POuser.megauser) {
            sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Changed name to MU" + "\n");
        }
        POuser.megauser = true;
    } else {
        if(POuser.megauser) {
            sys.appendToFile("staffstats.txt", "~" + src + "~" + sys.time() + "~" + "Changed name from MU" + "\n");
        }
        POuser.megauser = false;
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

    if (sys.gen(src) >= 4) {
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, i);
        if (poke in pokeNatures) {
            for (x in pokeNatures[poke]) {
                if (sys.hasTeamPokeMove(src, i, x) && sys.teamPokeNature(src, i) != pokeNatures[poke][x])
                {
                    checkbot.sendMessage(src, "" + sys.pokemon(poke) + " with " + sys.move(x) + " must be a " + sys.nature(pokeNatures[poke][x]) + " nature. Change it in the teambuilder.");
                    sys.changePokeNum(src, i, 0);
                }
            }
        }
    }
   }
   try {
   if (sys.gen(src) == 2) {
   pokes:
        for (var i = 0; i <= 6; i++)
            for (var j = 0; j < bannedGSCSleep.length; ++j)
                if (sys.hasTeamPokeMove(src, i, bannedGSCSleep[j]))
                    for (var k = 0; k < bannedGSCTrap.length; ++k)
                        if (sys.hasTeamPokeMove(src, i, bannedGSCTrap[k])) {
                            checkbot.sendMessage(src, "SleepTrapping is banned in GSC. Pokemon " + sys.pokemon(sys.teamPoke(src,i)) + "  removed from your team.");
                            sys.changePokeNum(src, i, 0);
                            continue pokes;
                        }

    }
    } catch (e) { sys.sendMessage(e, staffchannel); }
    if (sys.name(src) != "Lamperi-") {
    this.eventMovesCheck(src);
    this.dreamWorldAbilitiesCheck(src);
    this.littleCupCheck(src);
    this.evioliteCheck(src);
    this.inconsistentCheck(src);
    this.monotypecheck(src);
    this.monoGenCheck(src);
    this.weatherlesstiercheck(src);
    this.shanaiAbilityCheck(src)
    this.monoColourCheck(src)
    this.swiftSwimCheck(src)
    this.droughtCheck(src)
    this.snowWarningCheck(src)
    this.advance200Check(src);
    } else {
    if (!tier_checker.check_if_valid_for(src, sys.tier(src))) {
       tier_checker.find_good_tier(src);
       normalbot.sendMessage(src, "You were placed into '" + sys.tier(src) + "' tier.");
    }
    }

} /* end of afterChangeTeam */

,
userCommand: function(src, command, commandData, tar) {
    if (command == "commands" || command == "command") {
        if (commandData == undefined) {
            sendChanMessage(src, "*** Commands ***");
            for(var x = 0; x < commands["user"].length; ++x) {
                sendChanMessage(src, commands["user"][x]);
            }
            sendChanMessage(src, "*** Other Commands ***");
            sendChanMessage(src, "/commands channel: To know of channel commands");
            if (sys.auth(src) > 0) {
                sendChanMessage(src, "/commands mod: To know of moderator commands");
            }
            if (sys.auth(src) > 1) {
                sendChanMessage(src, "/commands admin: To know of admin commands");
            }
            if (sys.auth(src) > 2 || isSuperAdmin(src)) {
                sendChanMessage(src, "/commands owner: To know of owner commands");
            }
            var pluginhelps = getplugins("help-string");
            for (var module in pluginhelps) {
                var help = typeof pluginhelps[module] == "string" ? [pluginhelps[module]] : pluginhelps[module];
                for (var i = 0; i < help.length; ++i)
                    sendChanMessage(src, "/commands " + help[i]);
            }
            sendChanMessage(src, "");
            sendChanMessage(src, "Commands starting with \"\\\" will be forwarded to Shanai if she's online.");
            sendChanMessage(src, "");
            return;
        }

        commandData = commandData.toLowerCase();
        if ( (commandData == "mod" && sys.auth(src) > 0)
            || (commandData == "admin" && sys.auth(src) > 1)
            || (commandData == "owner" && (sys.auth(src) > 2  || isSuperAdmin(src)))
            || (commandData == "megauser" && (sys.auth(src) > 0 || SESSION.users(src).megauser || SESSION.channels(tourchannel).isChannelOperator(src)))
            || (commandData == "channel") ) {
            sendChanMessage(src, "*** " + commandData.toUpperCase() + " Commands ***");
            for(x in commands[commandData]) {
                sendChanMessage(src, commands[commandData][x]);
            }
        }
	callplugins("onHelp", src, commandData, channel);

        return;
    }
    if ((command == "me" || command == "rainbow") && !muteall && !SESSION.channels(channel).muteall) {
        if (sys.auth(src) == 0 && ((typeof meoff != "undefined" && meoff != false && (channel == tourchannel || channel == 0))
            || SESSION.channels(channel).meoff === true)) {
            normalbot.sendChanMessage(src, "/me was turned off.");
            return;
        }
        if (commandData === undefined || command == "rainbow")
            return;

        if (channel == sys.channelId("Trivia") && SESSION.channels(channel).triviaon) {
            sys.sendMessage(src, "±Trivia: Answer using \a, /me not allowed now.", channel);
            return;
        }

        if (usingBannedWords() || repeatingOneself() || capsName()) {
            sys.stopEvent();
            return;
        }

        if (sys.auth(src) == 0 && SESSION.users(src).smute.active) {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active) {
                    sendChanMessage(id,  "*** " + sys.name(src) + " " + commandData);
                }
            });
            sys.stopEvent();
            this.afterChatMessage(src, '/'+command+ ' '+commandData);
            return;
        }


        SESSION.channels(channel).beforeMessage(src, "/me " + commandData);
        commandData=this.html_escape(commandData)
        if (command == "me") {
            sys.sendHtmlAll("<font color='#0483c5'><timestamp/> *** <b>" + this.html_escape(sys.name(src)) + "</b> " + commandData + "</font>", channel);
        } else if (command == "rainbow" && SESSION.global().allowRainbow) {
            var auth = 1 <= sys.auth(src) && sys.auth(src) <= 3;
            var colours = ["red", "blue", "yellow", "cyan", "black", "orange", "green"];
            var randColour = function() { return colours[sys.rand(0,colours.length-1)]; }
            var toSend = ["<timestamp/><b>"];
            if (auth) toSend.push("<span style='color:" + randColour() + "'>+</span><i>");
            var name = sys.name(src);
            for (var i = 0; i < name.length; ++i)
                toSend.push("<span style='color:" + randColour() + "'>" + this.html_escape(name[i]) + "</span>");
            toSend.push("<span style='color:" + randColour() + "'>:</b></span> ");
            if (auth) toSend.push("</i>");
            toSend.push(commandData);
            sys.sendHtmlAll(toSend.join(""), channel);
        }
        this.afterChatMessage(src, '/'+command+' '+commandData);
        return;
    }
    if (command == "megausers") {
        sendChanMessage(src, "");
        sendChanMessage(src, "*** MEGA USERS ***");
        sendChanMessage(src, "");
        var spl = megausers.split('*');
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                sendChanMessage(src, spl[x] + " " + (sys.id(spl[x]) !== undefined ? "(online):" : "(offline)"));
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "contributors") {
        sendChanMessage(src, "");
        sendChanMessage(src, "*** CONTRIBUTORS ***");
        sendChanMessage(src, "");
        for (var x in contributors.hash) {
            sendChanMessage(src, x + "'s contributions: " + contributors.get(x));
        }
        sendChanMessage(src, "");
        return;
    }
    /*if (command == "league") {
        if (!Config.League) return;

        sendChanMessage(src, "");
        sendChanMessage(src, "*** Pokemon Online League ***");
        sendChanMessage(src, "");
        var spl = Config.League;
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                sendChanMessage(src, spl[x][0] + " - " + spl[x][1] + " " + (sys.id(spl[x][0]) !== undefined ? "(online):" : "(offline)"));
            }
        }
        sendChanMessage(src, "");
        return;
    }*/
    if (command == "rules") {
        for (rule in rules) {
            sendChanMessage(src, rules[rule]);
        }
        return;
    }
    if (command == "players") {
        countbot.sendChanMessage(src, "There are " + sys.numPlayers() + " players online.");
        return;
    }
    if (command == "ranking") {
        var tier = sys.totalPlayersByTier(commandData) > 0 ? commandData : sys.tier(src);
        var rank = sys.ranking(sys.name(src), tier);
        if (rank == undefined) {
            rankingbot.sendChanMessage(src, "You are not ranked in " + tier + " yet!");
        } else {
            rankingbot.sendChanMessage(src, "Your rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ladderRating(src, tier) + " points / " + sys.ratedBattles(sys.name(src), tier) +" battles]!");
        }
        return;
    }
    if (command == "battlecount") {
        if (!commandData || commandData.indexOf(":") == -1) {
            rankingbot.sendChanMessage(src, "Usage: /battlecount name:tier");
            return;
        }
        var stuff = commandData.split(":");
        var name = stuff[0];
        var tier = stuff[1];
        var rank = sys.ranking(name, tier);
        if (rank == undefined) {
            rankingbot.sendChanMessage(src, "They are not ranked in " + tier + " yet!");
        } else {
            rankingbot.sendChanMessage(src, name + "'s rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ratedBattles(name, tier) +" battles]!");
        }
        return;
    }
    if (command == "auth") {
        var DoNotShowIfOffline = ["loseyourself", "oneballjay"]
        var authlist = sys.dbAuths().sort()
        sendChanMessage(src, "");
        if(commandData == "owners") {
            sendChanMessage(src, "*** Owners ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 3) {
                    if(sys.id(authlist[x]) == undefined) {
                       sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sendChanMessage(src, "",channel);
        }
        if(commandData == "admins" || commandData == "administrators") {
            sendChanMessage(src, "*** Administrators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 2) {
                    if(sys.id(authlist[x]) == undefined) {
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sys.sendMessage(src, "",channel);
        }
        if(commandData == "mods" || commandData == "moderators") {
            sendChanMessage(src, "*** Moderators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 1) {
                    if(sys.id(authlist[x]) == undefined) {
                        if (DoNotShowIfOffline.indexOf(authlist[x]) == -1)
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sys.sendMessage(src, "",channel);
        }

        if(commandData != "moderators" && commandData != "mods" && commandData != "administrators" && commandData != "admins" && commandData != "owners") {

            sendChanMessage(src, "*** Owners ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 3) {
                    if(sys.id(authlist[x]) == undefined) {
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sendChanMessage(src, "");
            sendChanMessage(src, "*** Administrators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 2) {
                    if(sys.id(authlist[x]) == undefined) {
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }

            }
            sendChanMessage(src, "");
            sendChanMessage(src, "*** Moderators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 1) {
                    if(sys.id(authlist[x]) == undefined) {
                        if (DoNotShowIfOffline.indexOf(authlist[x]) == -1)
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
        }
        return;
    }
    if (command == "sametier") {
        if (commandData == "on")
            battlebot.sendChanMessage(src, "You enforce same tier in your battles.");
        else
            battlebot.sendChanMessage(src, "You allow different tiers in your battles.");
        SESSION.users(src).sametier = commandData == "on";
        saveKey("forceSameTier", src, SESSION.users(src).sametier * 1);
        return;
    }
    if (command == "unjoin") {
        if (channel == sys.channelId("Trivia")) {
            sendChanMessage(src, "±TriviaBot: You must use \\unjoin to unjoin a Trivia game!");
            return;
        }
        return;
    }
    if (command == "selfkick" || command == "sk") {
        var src_ip = sys.ip(src);
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if ((src != current_player) && (src_ip == sys.ip(current_player))) {
                sys.kick(current_player);
                normalbot.sendMessage(src, "Your ghost was kicked...")
            }
        }
        return;
    }

    if (command == "join"){
        if (channel == sys.channelId("Trivia")) {
            sendChanMessage(src, "±TriviaBot: You must use \\join to join a Trivia game!");
            return;
        }
    }
    if (command == "topic") {
        SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "uptime") {
        if (typeof startUpTime != "number") {
            countbot.sendChanMessage(src, "Somehow the server uptime is messed up...");
            return;
        }
        var diff = parseInt(sys.time()) - startUpTime;
        var days = parseInt(diff / (60*60*24));
        var hours = parseInt((diff % (60*60*24)) / (60*60));
        var minutes = parseInt((diff % (60*60)) / 60);
        var seconds = (diff % 60);

        countbot.sendChanMessage(src, "Server uptime is "+days+"d "+hours+"h "+minutes+"m "+seconds+"s");
        return;
    }
    if (command == "resetpass") {
        sys.clearPass(sys.name(src));
        normalbot.sendChanMessage(src, "Your password was cleared!");
        return;
    }

    if (command == "importable") {
        normalbot.sendChanMessage(src, "Sorry, currently disabled for today due to our api key hitting max pastes for a day.");
        return;
        //var path = "user_importables/{id}.txt".replace("{id}", src);
        //var url = "http://188.165.249.120/i/{id}.txt".replace("{id}", src);
        //bot.sendChanMessage(src, "Your team is available at " + url);
        //sys.writeToFile(path, this.importable(src, true).join("\n"));
        var name = sys.name(src) + '\'s '+sys.tier(src)+' team';
        var team = this.importable(src, true).join("\n");
        var post = {};
        post['api_option']            = 'paste';            //  paste, duh
        post['api_dev_key']           = pastebin_api_key;   //  Developer's personal key, set in the beginning
        //post['api_user_key']          = pastebin_user_key;  //  Pastes are marked to our account
        post['api_paste_private']     = 1;                  //  private
        post['api_paste_name']        = name;               //  name
        post['api_paste_code']        = team;               //  text itself
        post['api_paste_expire_date'] = '1M';               //  expires in 1 month
        sys.webCall('http://pastebin.com/api/api_post.php', function(resp) {
            if (/^http:\/\//.test(resp))
                normalbot.sendChanMessage(src, "Your team is available at: " + resp); // success
            else {
                normalbot.sendChanMessage(src, "Sorry, unexpected error: "+resp);    // an error occured
                normalbot.sendAll("" + sys.name(src) + "'s /importable failed: "+resp, staffchannel); // message to indigo
            }
        }, post);
        return;
    }
    if (command == "cjoin") {
        var chan;
        if (sys.existChannel(commandData)) {
            chan = sys.channelId(commandData);
        } else {
            chan = sys.createChannel(commandData);
        }
        sys.putInChannel(src, chan);
        return;
    }

    if (command == "register") {
        if (SESSION.channels(channel).register(sys.name(src))) {
            channelbot.sendChanMessage(src, "You registered this channel successfully. Take a look of /commands channel");
        } else {
            channelbot.sendChanMessage(src, "This channel is already registered!");
        }
        return;
    }
    if (command == "cauth") {
        if (typeof SESSION.channels(channel).operators != 'object')
            SESSION.channels(channel).operators = [];
        if (typeof SESSION.channels(channel).masters != 'object')
            SESSION.channels(channel).masters = [];
        channelbot.sendChanMessage(src, "The channel auth of " + sys.channel(channel) + " are:");
        channelbot.sendChanMessage(src, "Masters: " + SESSION.channels(channel).masters.join(", "));
        channelbot.sendChanMessage(src, "Operators: " + SESSION.channels(channel).operators.join(", "));
        return;
    }
    	// Tour alerts
	if(command == "touralerts") {
		if(commandData == "on"){
			SESSION.users(src).tiers = getKey("touralerts", src)
			normalbot.sendChanMessage(src, "You have turned tour alerts on!")
			saveKey("touralertson", src, "true")
			return;
		}
		if(commandData == "off") {
			delete SESSION.users(src).tiers
			normalbot.sendChanMessage(src, "You have turned tour alerts off!")
			saveKey("touralertson", src, "false")
			return;
		}
		if(typeof(SESSION.users(src).tiers) == "undefined" || SESSION.users(src).tiers.length == 0){
			normalbot.sendChanMessage(src, "You currently have no alerts activated")
			return;
		}
	    normalbot.sendChanMessage(src, "You currently get alerted for the tiers:");
        var spl = SESSION.users(src).tiers.split('*');
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                normalbot.sendChanMessage(src, spl[x]);
            }
        }
        sendChanMessage(src, "");
        return;
    }
	
		
	if(command == "addtouralert") {
		var tiers = sys.getTierList();
		var tier;
		var found = false;
		for (var i = 0; i < tiers.length; ++i) {
			if (cmp(tiers[i], commandData)) {
				tier = tiers[i];
				found = true;
				break;
			}
		}
		if (!found) {
			normalbot.sendChanMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.");
			return;
		}
		if(typeof(SESSION.users(src).tiers) == "undefined"){
			SESSION.users(src).tiers = "*" + tier + "*"
			saveKey("touralerts", src, SESSION.users(src).tiers)
			normalbot.sendChanMessage(src, "Added a tour alert for the tier: " + tier + "!")
			return;
		}
		SESSION.users(src).tiers+= "*" + tier + "*"
		saveKey("touralerts", src, SESSION.users(src).tiers)
		normalbot.sendChanMessage(src, "Added a tour alert for the tier: " + tier + "!")
	return;
	}
	if(command == "removetouralert") {
		SESSION.users(src).tiers = getKey("touralerts", src)
		if(typeof(SESSION.users(src).tiers) == "undefined" || SESSION.users(src).tiers.length == 0){
		normalbot.sendChanMessage(src, "You currently have no alerts")
		return;
		}
		var tiers = sys.getTierList();
		var tier;
		var found = false;
		for (var i = 0; i < tiers.length; ++i) {
			if (cmp(tiers[i], commandData)) {
				tier = tiers[i]
				found = true;
				break;
			}
		}
		if (!found) {
			normalbot.sendChanMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.");
			return;
		}
		
		SESSION.users(src).tiers = SESSION.users(src).tiers.split("*" + tier + "*").join("")
		saveKey("touralerts", src, SESSION.users(src).tiers)
		normalbot.sendChanMessage(src, "Removed a tour alert for the tier: " + tier + "!")
	return;
	}
    // The Stupid Coin Game
    if (command == "coin" || command == "flip") {
        coinbot.sendChanMessage(src, "You flipped a coin. It's " + (Math.random() < 0.5 ? "Tails" : "Heads") + "!");
        if (!isNonNegative(SESSION.users(src).coins))
            SESSION.users(src).coins = 0;
        SESSION.users(src).coins++;
        return;
    }
    if (command == "throw") {
        if (channel != sys.channelId("Coins")) {
            coinbot.sendChanMessage(src, "No throwing here!");
            return;
        }
        if (sys.auth(src) == 0 && (muteall ||  SESSION.channels(channel).muteall) && !SESSION.channels(channel).isChannelOperator(src)) {
            if (SESSION.channels(channel).muteallmessages) {
                sendChanMessage(src, SESSION.channels(channel).muteallmessage);
            } else {
                coinbot.sendChanMessage(src, "Respect the minutes of silence!");
            }
            return;
        }

        if (!isNonNegative(SESSION.users(src).coins) || SESSION.users(src).coins < 1) {
            coinbot.sendChanMessage(src, "Need more coins? Use /flip!");
            return;
        }
        if (tar === undefined) {
            if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins = 0;
            coinbot.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at the wall!");
            SESSION.global().coins += SESSION.users(src).coins
        } else if (tar == src) {
            coinbot.sendChanMessage(src, "No way...");
            return;
        } else {
            coinbot.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at " + sys.name(tar) + "!");
            if (!isNonNegative(SESSION.users(tar).coins)) SESSION.users(tar).coins = 0;
            SESSION.users(tar).coins += SESSION.users(src).coins;
        }
        SESSION.users(src).coins = 0;
        return;
    }
    if (command == "casino") {
        var bet = parseInt(commandData);
        if (isNaN(bet)) {
            coinbot.sendChanMessage(src, "Use it like /casino [coinamount]!");
            return;
        }
        if (bet < 5) {
            coinbot.sendChanMessage(src, "Mininum bet 5 coins!");
            return;
        }
        if (bet > SESSION.users(src).coins) {
            coinbot.sendChanMessage(src, "You don't have enough coins!");
            return;
        }
        coinbot.sendChanMessage(src, "You inserted the coins into the Fruit game!");
        SESSION.users(src).coins -= bet;
        var res = Math.random();

        if (res < 0.8) {
            coinbot.sendChanMessage(src, "Sucks! You lost " + bet + " coins!");
            return;
        }
        if (res < 0.88) {
            coinbot.sendChanMessage(src, "You doubled the fun! You got " + 2*bet + " coins!");
            SESSION.users(src).coins += 2*bet;
            return;
        }
        if (res < 0.93) {
            coinbot.sendChanMessage(src, "Gratz! Tripled! You got " + 3*bet + " coins ");
            SESSION.users(src).coins += 3*bet;
            return;
        }
        if (res < 0.964) {
            coinbot.sendChanMessage(src, "Woah! " + 5*bet + " coins GET!");
            SESSION.users(src).coins += 5*bet;
            return;
        }
        if (res < 0.989) {
            coinbot.sendChanMessage(src, "NICE job! " + 10*bet + " coins acquired!");
            SESSION.users(src).coins += 10*bet;
            return;
        }
        if (res < 0.999) {
            coinbot.sendChanMessage(src, "AWESOME LUCK DUDE! " + 20*bet + " coins are yours!");
            SESSION.users(src).coins += 20*bet;
            return;
        } else {
            coinbot.sendChanMessage(src, "YOU HAVE BEATEN THE CASINO! " + 50*bet + " coins are yours!");
            SESSION.users(src).coins += 50*bet;
            return;
        }
    }
    if (command == "myalts") {
        var ip = sys.ip(src);
        var alts = sys.aliases(ip);
        bot.sendChanMessage(src, "Your alts are: " + alts);
        return;
    }
    if (command == "dwreleased") {
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendChanMessage(src, "No such pokemon!"); return;
        }
        var pokename = sys.pokemon(poke);
        if (poke in dwpokemons) {
            if (breedingpokemons.indexOf(poke) == -1) {
                normalbot.sendChanMessage(src, pokename + ": Released fully!");
            } else {
                normalbot.sendChanMessage(src, pokename + ": Released as a Male only, can't have egg moves or previous generation moves!");
            }
        } else {
            normalbot.sendChanMessage(src, pokename + ": Not released, only usable on Dream World tiers!");
        }
        return;
    }
    if (-crc32(command, crc32(sys.name(src))) == 22 || command == "wall") {
        if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins=0;
        if (!isNonNegative(SESSION.users(src).coins)) SESSION.users(src).coins=1;
        if (SESSION.global().coins < 100) return;
        coinbot.sendChanAll("" + sys.name(src) + " found " + SESSION.global().coins + " coins besides the wall!");
        SESSION.users(src).coins += SESSION.global().coins;
        SESSION.global().coins = 0;
        return;
    }
    return "no command";
}
,

modCommand: function(src, command, commandData, tar) {
    if (command == "topchannels") {
        var cids = sys.channelIds();
        var l = [];
        for (var i = 0; i < cids.length; ++i) {
            l.push([cids[i], sys.playersOfChannel(cids[i])]);
        }
        l.sort(function(a,b) { return b[1]-a[1]; });
        var topchans = l.slice(-10);
        channelbot.sendChanMessage(src, "Most used channels:")
        for (var i = 0; i < topchans.lenth; ++i) {
            sendChanMessage(src, "" + sys.channel(topchans[i][0]) + " with " + topchans[i][1] + " players.");
        }
        return;
    }
    if (command == "perm") {
        if (channel == staffchannel || channel == 0) {
            channelbot.sendChanMessage(src, "you can't do that here.");
            return;
        }

        SESSION.channels(channel).perm = (commandData.toLowerCase() == 'on');
        SESSION.global().channelManager.updateChannelPerm(sys.channel(channel), SESSION.channels(channel).perm);
        channelbot.sendChanAll("" + sys.name(src) + (SESSION.channels(channel).perm ? " made the channel permanent." : " made the channel a temporary channel again."));
        return;
    }
    if (command == "meoff") {
        this.meoff(src, commandData);
        return;
    }
    if (command == "meon") {
        this.meon(src, commandData);
        return;
    }
    if (command == "silence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        var minutes;
        var chanName;
        var space = commandData.indexOf(' ');
        if (space != -1) {
            minutes = commandData.substring(0,space);
            chanName = commandData.substring(space+1);
        } else {
            minutes = commandData;
            chanName = sys.channel(channel);
        }
        this.silence(src, minutes, chanName);
        return;
    }
    if (command == "silenceoff") {
        this.silenceoff(src, commandData);
        return;
    }
    if (command == "mafiaban") {
        script.issueBan("mban", src, sys.id(commandData), commandData);
        return;
    }
    if (command == "mafiaunban") {
        if (tar == undefined) {
            if (mbans.get(commandData)) {
                mafiabot.sendAll("IP address " + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                mbans.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData)
            if(ip != undefined && mbans.get(ip)) {
                mafiabot.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!");
                mbans.remove(ip);
                return;
            }
            mafiabot.sendChanMessage(src, "He/she's not banned from Mafia.");
            return;
        }
        if (!SESSION.users(tar).mban.active) {
            mafiabot.sendChanMessage(src, "He/she's not banned from Mafia.");
            return;
        }
        if(SESSION.users(src).mban.active && tar==src) {
           mafiabot.sendChanMessage(src, "You may not unban yourself from Mafia");
           return;
        }
        mafiabot.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!");
        SESSION.users(tar).un("mban");
        return;
    }

    if (command == "impoff") {
        delete SESSION.users(src).impersonation;
        normalbot.sendChanMessage(src, "Now you are yourself!");
        return;
    }
    if (command == "k") {
        if (tar == undefined) {
            return;
        }
        normalbot.sendAll("" + commandData + " was mysteriously kicked by " + nonFlashing(sys.name(src)) + "!");
        sys.kick(tar);
        return;
    }

    if (command == "mute") {
        script.issueBan("mute", src, tar, commandData);
        return;
    }
    if (command == "banlist") {
        list=sys.banList();
        list.sort();
        var nbr_banned=5;
        var max_message_length = 30000;
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan='+nbr_banned+'><center><strong>Banned list</strong></center></td></tr><tr>';
        var table_footer = '</tr></table>';
        var table=table_header;
        var j=0;
        var line = ''
        for (var i=0; i<list.length; ++i){
            if (typeof commandData == 'undefined' || list[i].toLowerCase().indexOf(commandData.toLowerCase()) != -1){
                ++j;
                line += '<td>'+list[i]+'</td>';
                if(j == nbr_banned &&  i+1 != list.length){
                    if (table.length + line.length + table_footer.length > max_message_length) {
                        if (table.length + table_footer.length <= max_message_length)
                            sys.sendHtmlMessage(src, table + table_footer, channel);
                        table = table_header;
                    }
                    table += line + '</tr><tr>';
                    line = '';
                    j=0;
                }
            }
        }
        table += table_footer;
        sys.sendHtmlMessage(src, table.replace('</tr><tr></tr></table>', '</tr></table>'),channel);
        return;

    }
    if (command == "mutelist" || command == "smutelist" || command == "mafiabans") {
        var mh;
        var name;
        if (command == "mutelist") {
            mh = mutes;
            name = "Muted list";
        } else if (command == "smutelist") {
            mh = smutes;
            name = "Secretly muted list";
        } else if (command == "mafiabans") {
            mh = mbans;
            name = "Mafiabans";
        }

        var width=5;
        var max_message_length = 30000;
        var tmp = [];
        var t = parseInt(sys.time());
        var toDelete = [];
        for (var ip in mh.hash) {
            var values = mh.hash[ip].split(":");
            var banTime = 0;
            var by = "";
            var expires = 0;
            var banned_name;
            var reason = "";
            if (values.length >= 5) {
                banTime = parseInt(values[0]);
                by = values[1];
                expires = parseInt(values[2]);
                banned_name = values[3];
                reason = values.slice(4);
                if (expires != 0 && expires < t) {
                    toDelete.push(ip);
                    continue;
                }
            } else if (command == "smutelist") {
                var aliases = sys.aliases(ip);
                if (aliases[0] !== undefined) {
                    banned_name = aliases[0];
                } else {
                    banned_name = "~Unknown~";
                }
            } else {
                banTime = parseInt(values[0]);
            }
            if(typeof commandData != 'undefined' && (!banned_name || banned_name.toLowerCase().indexOf(commandData.toLowerCase()) == -1))
                continue;
            tmp.push([ip, banned_name, by, (banTime == 0 ? "unknown" : getTimeString(t-banTime)), (expires == 0 ? "never" : getTimeString(expires-t)), this.html_escape(reason)]);
        }
        for (var k = 0; k < toDelete.length; ++k)
           delete mh.hash[toDelete[k]];
        if (toDelete.length > 0)
            mh.save();

        tmp.sort(function(a,b) { a[3] - b[3]});

        // generate HTML
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + this.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
        var table_footer = '</table>';
        var table = table_header;
        var line;
        var send_rows = 0;
        while(tmp.length > 0) {
            line = '<tr><td>'+tmp[0].join('</td><td>')+'</td></tr>';
            tmp.splice(0,1);
            if (table.length + line.length + table_footer.length > max_message_length) {
                if (send_rows == 0) continue; // Can't send this line!
                table += table_footer
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
    if (command == "rangebans") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
           TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Range banned</strong></center></td></tr><tr><th>IP subaddress</th><th>Comment on rangeban</th></tr>';
           TABLE_LINE = '<tr><td>{0}</td><td>{1}</td></tr>';
           TABLE_END = '</table>';
        } else {
           TABLE_HEADER = 'Range banned: IP subaddress, Command on rangeban';
           TABLE_LINE = ' || {0} / {1}';
           TABLE_END = '';
        }
        try {
        var table = TABLE_HEADER;
        var tmp = [];
        for (var key in rangebans.hash) {
            tmp.push([key, rangebans.get(key)]);
        }
        tmp.sort(function(a,b) { return a[0] < b[0] ? -1 : 1; });
        for (var row = 0; row < tmp.length; ++row) {
            table += TABLE_LINE.format(tmp[row][0], tmp[row][1]);
        }
        table += TABLE_END;
        sys.sendHtmlMessage(src, table, channel);
        } catch (e) { sys.sendMessage(src, e, channel); }
        return;
    }
    if (command == "tempbans") {
        var t = parseInt(sys.time());
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="6"><center><strong>Temp banned</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Length</th><th>Expires in</th><th>Reason</th></tr>';
        for (var ip in tempBans) {
            var ban_length = tempBans[ip].length === undefined ? "undefined" : getTimeString(tempBans[ip].length * 60);
            var auth = tempBans[ip].auth === undefined ? "undefined" : tempBans[ip].auth;
            var time = tempBans[ip].time === undefined ? "undefined" : tempBans[ip].time;
            var expire_time = tempBans[ip].time === undefined ? "undefined" : getTimeString(tempBans[ip].time - t);
            var reason = tempBans[ip].reason === undefined ? "undefined" : tempBans[ip].reason;
            var target = tempBans[ip].target === undefined ? "undefined" : tempBans[ip].target;
            table += '<tr><td>' + ip +
                '</td><td>'     + target +
                '</td><td>'     + auth +
                '</td><td>'     + ban_length +
                '</td><td>'     + expire_time +
                '</td><td>'     + reason +
                '</td><td>'     + time +
                '</td></tr>';
        }
        table += '</table>'
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "namebans") {
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Name banned</strong></center></td></tr>';
        for (var i = 0; i < nameBans.length; i+=5) {
            table += '<tr>';
            for (var j = 0; j < 5 && i+j < nameBans.length; ++j) {
                table += '<td>'+nameBans[i+j].toString()+'</td>';
            }
            table += '</tr>';
        }
        table += '</table>'
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "unmute") {
        if (tar == undefined) {
            if (mutes.get(commandData)) {
                normalbot.sendAll("IP address " + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                mutes.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData)
            if(ip != undefined && mutes.get(ip)) {
                normalbot.sendAll("" + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!");
                mutes.remove(ip);
                return;
            }
            normalbot.sendChanMessage(src, "He/she's not muted.");
            return;
        }
        if (!SESSION.users(sys.id(commandData)).mute.active) {
            normalbot.sendChanMessage(src, "He/she's not muted.");
            return;
        }
        if(SESSION.users(src).mute.active && tar==src) {
           normalbot.sendChanMessage(src, "You may not unmute yourself!");
           return;
        }
        SESSION.users(tar).un("mute");
        normalbot.sendAll("" + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!");
        return;
    }
    if (command == "battlehistory") {
        if (tar === undefined) {
            querybot.sendChanMessage(src, "Usage: /battleHistory username. Only works on online users.");
            return;
        }
        var hist = SESSION.users(tar).battlehistory;
        if (!hist) {
            querybot.sendChanMessage(src, "Your target has not battled after logging in.");
            return;
        }
        var res = []
        for (var i = 0; i < hist.length; ++i) {
             res.push("Battle against <b>" + hist[i][0] + "</b>, result <b>" + hist[i][1] + "</b>" + (hist[i][2] == "forfeit" ? " <i>due to forfeit</i>." : "."));
        }
        sys.sendHtmlMessage(src, res.join("<br>"), channel);
        return;
    }
    if (command == "userinfo" || command == "whois" || command == "whoistxt") {
        if (commandData == undefined) {
            querybot.sendChanMessage(src, "Please provide a username.");
            return;
        }
        var name = commandData;
        var isbot = false;
        if (commandData[0] == "~") {
            name = commandData.substring(1);
            tar = sys.id(name);
            isbot = true;
        }
        var lastLogin = sys.dbLastOn(name);
        if (lastLogin === undefined) {
            querybot.sendChanMessage(src, "No such user.");
            return;
        }

        var registered = sys.dbRegistered(name);
        var megauser = (megausers.toLowerCase().indexOf("*" + name.toLowerCase() + "*") != -1);
        var contribution = contributors.hash.hasOwnProperty(name) ? contributors.get(name) : "no";
        var authLevel;
        var ip;
        var online;
        var channels = [];
        if (tar !== undefined) {
            name = sys.name(tar); // fixes case
            authLevel = sys.auth(tar);
            ip = sys.ip(tar);
            online = true;
            var chans = sys.channelsOfPlayer(tar);
            for (var i = 0; i < chans.length; ++i) {
                channels.push("#"+sys.channel(chans[i]));
            }
        } else {
            authLevel = sys.dbAuth(name);
            ip = sys.dbIp(name);
            online = false;
        }
        var isBanned = false;
        var banlist=sys.banList()
        for(a in banlist) {
            if(ip == sys.dbIp(banlist[a])) {
                isBanned = true;
                break;
            }
        }
        var nameBanned = this.nameIsInappropriate(name);
        var rangeBanned = this.isRangeBanned(ip);
        var tempBanned = this.isTempBanned(ip);
        var bans = [];
        if (isBanned) bans.push("normal ban");
        if (nameBanned) bans.push("nameban");
        if (rangeBanned) bans.push("rangeban");
        if (tempBanned) bans.push("tempban");

        if (isbot) {
            var userJson = {'type': 'UserInfo', 'id': tar ? tar : -1, 'username': name, 'auth': authLevel, 'megauser': megauser, 'contributor': contribution, 'ip': ip, 'online': online, 'registered': registered, 'lastlogin': lastLogin };
            sendChanMessage(src, ":"+JSON.stringify(userJson));
        } else if (command == "userinfo") {
            querybot.sendChanMessage(src, "Username: " + name + " ~ auth: " + authLevel + " ~ megauser: " + megauser + " ~ contributor: " + contribution + " ~ ip: " + ip + " ~ online: " + (online ? "yes" : "no") + " ~ registered: " + (registered ? "yes" : "no") + " ~ last login: " + lastLogin + " ~ banned: " + (isBanned ? "yes" : "no"));
        } else if (command == "whois") {
            var authName = function() {
                switch (authLevel) {
                case 3: return "owner"; break;
                case 2: return "admin"; break;
                case 1: return "moderator"; break;
                default: return megauser ? "megauser" : contribution != "no" ? "contributor" : "user";
                }
            }();

            var logintime = false;
            if (online) logintime = SESSION.users(tar).logintime;
            var data = [
               "User: " + name + " @ " + ip,
               "Auth: " + authName,
               "Online: " + (online ? "yes" : "no"),
               "Registered name: " + (registered ? "yes" : "no"),
               "Last Login: " + (online && logintime ? new Date(logintime*1000).toUTCString() : lastLogin),
                bans.length > 0 ? "Bans: " + bans.join(", ") : "Bans: none",
            ];
            if (online) {
                if (SESSION.users(tar).hostname != ip)
                    data[0] += " (" + SESSION.users(tar).hostname + ")";
                data.push("Idle for: " + getTimeString(parseInt(sys.time()) - SESSION.users(tar).lastline.time));
                data.push("Channels: " + channels.join(", "));
                data.push("Names during current session: " + (online && SESSION.users(tar).namehistory ? SESSION.users(tar).namehistory.map(function(e){return e[0]}).join(", ") : name));
            }
            if (authLevel > 0) {
               var stats = authStats[name.toLowerCase()] || {};
               for (var key in stats) {
                   data.push("Latest " + key.substr(6).toLowerCase() + ": " + stats[key][0] + " on " + new Date(stats[key][1]*1000).toUTCString());
               }
            }
            for (var j = 0; j < data.length; ++j) {
                sendChanMessage(src, data[j]);
            }
        }

        return;
    }
    if (command == "aliases") {
        var max_message_length = 30000;
        var uid = sys.id(commandData);
        var ip = commandData;
        if (uid != undefined) {
            ip = sys.ip(uid);
        } else if (sys.dbIp(commandData) !== undefined) {
            ip = sys.dbIp(commandData);
        }
        var smessage = "The aliases for the IP " + ip + " are: "
        var aliases = sys.aliases(ip);
        var prefix = "";
        for(var i = 0; i < aliases.length; ++i) {
            var id = sys.id(aliases[i]);
            var status = (id != undefined) ? "online" : "Last Login: " + sys.dbLastOn(aliases[i]);
            smessage = smessage + aliases[i] + " ("+status+"), ";
            if (smessage.length > max_message_length) {
                querybot.sendChanMessage(src, prefix + smessage + " ...");
                prefix = "... ";
                smessage = "";
            }
        }
        querybot.sendChanMessage(src, prefix + smessage);
        return;
    }
    if (command == "tempban") {
        var tmp = commandData.split(":");
        if (tmp.length != 3) {
            normalbot.sendChanMessage(src, "Usage /tempban name:reason:minutes.");
            return;
        }
        var target_name = tmp[0];
        var reason = tmp[1];
        var minutes = tmp[2];
        tar = sys.id(target_name);
        minutes = parseInt(minutes);
        if (typeof minutes != "number" || isNaN(minutes) || minutes < 1 || (sys.auth(src) < 2 && minutes > 1440) ) {
            normalbot.sendChanMessage(src, "Minutes must be in the interval [1,1440].");
            return;
        }

        var ip;
        var name;
        if (tar === undefined) {
            ip = sys.dbIp(target_name);
            name = target_name;
            if (ip === undefined) {
                normalbot.sendChanMessage(src, "No such name online / offline.");
                return;
            }
        } else {
            ip = sys.ip(tar);
            name = sys.name(tar);
        }

        if (sys.maxAuth(ip)>=sys.auth(src)) {
            normalbot.sendChanMessage(src, "Can't do that to higher auth!");
            return;
        }
        var authname = sys.name(src).toLowerCase();
        tempBans[ip] = {'auth': authname,
                        'time': parseInt(sys.time()) + 60*minutes,
                        'length': minutes,
                        'reason': reason,
                        'target': target_name};
        normalbot.sendAll("" + nonFlashing(sys.name(src)) + " banned " + name + " on " + ip + " for " + minutes + " minutes! [Reason: " + reason + "]");
        sys.kick(tar);
        this.kickAll(ip);


        authStats[authname] =  authStats[authname] || {}
        authStats[authname].latestTempBan = [name, parseInt(sys.time())];
        return;
    }
    if (command == "tempunban") {
        var ip = sys.dbIp(commandData);
        if (ip === undefined) {
            normalbot.sendChanMessage(src, "No such user!");
            return;
        }
        if (!(ip in tempBans)) {
            normalbot.sendChanMessage(src, "No such user tempbanned!");
            return;
        }
        var now = parseInt(sys.time());
        normalbot.sendAll("" + commandData + " was released from their cell by " + nonFlashing(sys.name(src)) + " just " + ((tempBans[ip].time - now)/60).toFixed(2) + " minutes beforehand!");
        delete tempBans[ip];
        return;
    }
    if (command == "wfbset") {
        SESSION.users(src).wfbmsg = commandData;
        SESSION.global().wfbset[sys.name(src).toLowerCase()] = commandData;
        sys.writeToFile('wfbset.json', JSON.stringify(SESSION.global().wfbset));
        normalbot.sendChanMessage(src, "Your message is set to '" + commandData + "'.");
        return;
    }
    if (command == "wfb") {
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Please use this command to warn / automute someone. Use /wfb name");
            return;
        }
        if (sys.auth(tar) > 0) {
            normalbot.sendChanMessage(src, "Please use this command only on users.");
            return;
        }
        var poTarget = SESSION.users(tar);
        var poAuth = SESSION.users(src);
        if (!poTarget.warned) {
            poTarget.warned = parseInt(sys.time());
            var warning = poAuth.wfbmsg ? poAuth.wfbmsg : "{{user}}: Please do not ask for battles in the chat. Refer to http://findbattlebutton.info to find more about the find battle button!";
            warning = warning.replace("{{user}}", sys.name(tar));
            sys.sendAll(sys.name(src) + ": " + warning, 0);
        } else if (parseInt(sys.time()) - poTarget.warned < 10) {
            normalbot.sendChanMessage(src, "Please wait 10 seconds between wfbs.");
        } else {
            poTarget.activate("mute", sys.name(src), parseInt(sys.time()) + 900, "Asking for battles in the chat; http://findbattlebutton.info", true);
            normalbot.sendAll("" + sys.name(tar) + " was muted by " + nonFlashing(sys.name(src)) + " for 15 minutes! [Reason: Asking for battles in the chat]");
        }
        return;
    }
    if (command == "passauth" || command == "passauths") {
        //normalbot.sendChanMessage(src, "Ask Oak/Lamp/Zero instead, plox.");
        //return;
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "The target is offline.");
            return;
        }
        if (sys.ip(src) == sys.ip(tar) && sys.auth(tar) == 0) {
            // fine
        }
        else {
            if (sys.auth(src) != 0 || !SESSION.users(src).megauser) {
                normalbot.sendChanMessage(src, "You need to be mega-auth to pass auth.");
                return;
            }
            if (!SESSION.users(tar).megauser || sys.auth(tar) > 0) {
                normalbot.sendChanMessage(src, "The target must be megauser and not auth, or from your IP.");
                return;
            }
        }
        if (!sys.dbRegistered(sys.name(tar))) {
            normalbot.sendChanMessage(src, "The target name must be registered.");
            return;
        }
        var current = sys.auth(src);
        sys.changeAuth(src, 0);
        sys.changeAuth(tar, current);
        if (command == "passauth")
            normalbot.sendAll(sys.name(src) + " passed their auth to " + sys.name(tar) + "!", staffchannel);
        return;
    }
    if (sys.name(src) == "Viderizer" && (command == "ban" || command == "unban")) {
        return this.adminCommand(src, command, commandData, tar);
    }
    if (command == "skmute" && (sys.auth(src) >= 1 || [/* insert mod list here when this goes to admin+ */].indexOf(sys.name(src).toLowerCase()) >= 0)) {
        if (tar === undefined)
            normalbot.sendMessage(src, "use only for online target ", channel);
        else {
            normalbot.sendAll("Target: " + sys.name(tar) + ", IP: " + sys.ip(tar), staffchannel);
            script.issueBan("smute", src, undefined, "" + sys.name(tar) + ":skarmpiss:2h");
        }
        return;
    }
    if (cmp(sys.name(src),"ethan") && ["setannouncement", "testannouncement", "getannouncement"].indexOf(command) != -1) {
       return this.ownerCommand(src, command, commandData, tar);
    }
    return "no command";
}
,

silence: function(src, minutes, chanName) {
    var delay = parseInt(minutes * 60);
    if (isNaN(delay) || delay <= 0) {
        channelbot.sendChanMessage(src, "Sorry, I couldn't read your minutes.");
    }

    if (!chanName) {
        bot.sendChanMessage(src, "Sorry, global silence is disabled. Use /silence 5 Channel Name");
        /*
        normalbot.sendMainTour("" + sys.name(src) + " called for " + minutes + " Minutes of Silence!");
        muteall = true;
        sys.callLater('if (!muteall) return; muteall = false; normalbot.sendMainTour("Silence is over.");', delay);
        */
    } else {
        var cid = sys.channelId(chanName);
        if (cid !== undefined) {
            channelbot.sendAll("" + sys.name(src) + " called for " + minutes + " Minutes Of Silence in "+chanName+"!", cid);
            SESSION.channels(cid).muteall = true;
            sys.callLater('if (!SESSION.channels('+cid+').muteall) return; SESSION.channels('+cid+').muteall = false; normalbot.sendAll("Silence is over in '+chanName+'.",'+cid+');', delay);
        } else {
            channelbot.sendChanMessage(src, "Sorry, I couldn't find a channel with that name.");
        }
    }
}
,

silenceoff: function(src, chanName) {
    if (chanName !== undefined) {
        var cid = sys.channelId(chanName);
        if (!SESSION.channels(cid).muteall) {
            channelbot.sendChanMessage(src, "Nah.");
            return;
        }
        channelbot.sendAll("" + sys.name(src) + " cancelled the Minutes of Silence in "+chanName+"!", cid)
        SESSION.channels(cid).muteall = false;
    } else {
        if (!muteall) {
            normalbot.sendChanMessage(src, "Nah.");
            return;
        }
        normalbot.sendMainTour("" + sys.name(src) + " cancelled the Minutes of Silence!");
        muteall = false;
    }
}
,
meoff: function(src, commandData) {
    if (commandData === undefined) {
        meoff=true;
        normalbot.sendMainTour("" + sys.name(src) + " turned off /me.");
    } else {
        var cid = sys.channelId(commandData);
        if (cid !== undefined) {
            SESSION.channels(cid).meoff = true;
            normalbot.sendAll("" + sys.name(src) + " turned off /me in "+commandData+".", cid);
        } else {
            normalbot.sendChanMessage(src, "Sorry, that channel is unknown to me.");
        }
    }
    return;
}
,
meon: function(src, commandData) {
    if (commandData === undefined) {
        meoff=false;
        normalbot.sendMainTour("" + sys.name(src) + " turned on /me.");
    } else {
        var cid = sys.channelId(commandData);
        if (cid !== undefined) {
            SESSION.channels(cid).meoff = false;
            normalbot.sendAll("" + sys.name(src) + " turned on /me in "+commandData+".", cid);
        } else {
            normalbot.sendChanMessage(src, "Sorry, that channel is unknown to me.");
        }
    }
}
,
adminCommand: function(src, command, commandData, tar) {
    if (command == "memorydump") {
        sendChanMessage(src, sys.memoryDump());
        return;
    }
    if (command == "megauser") {
        if (tar != undefined) {
            SESSION.users(tar).megauser = true;
            normalbot.sendAll("" + sys.name(tar) + " was megausered by " + nonFlashing(sys.name(src)) + ".");
            megausers += "*" + sys.name(tar) + "*";
            sys.saveVal("megausers", megausers);
        }
        return;
    }
    if (command == "watch") {
        var cid = sys.channelId(commandData);
        if (cid != undefined) {
            SESSION.channels(cid).watchers.push(src);
            channelbot.sendChanMessage(src, "You're now watching " + sys.channel(cid) + "!");
            this.watched = this.watched || [];
            this.watched.push(cid);
            return;
        }
    }
    if (command == "unwatch") {
        var cid = sys.channelId(commandData);
        if (cid != undefined) {
            SESSION.channels(cid).removeWatcher(src);
            channelbot.sendChanMessage(src, "You've stopped watching " + sys.channel(cid) + "!");
            return;
        }
    }
     if (command == "megauseroff") {
        if (tar != undefined) {
            SESSION.users(tar).megauser = false;
            normalbot.sendAll("" + sys.name(tar) + " was removed megauser by " + nonFlashing(sys.name(src)) + ".");
            megausers = megausers.split("*" + sys.name(tar) + "*").join("");
            sys.saveVal("megausers", megausers);
        } else {
            normalbot.sendAll("" + commandData + " was removed megauser.");
            megausers = megausers.split("*" + commandData + "*").join("");
            sys.saveVal("megausers", megausers);
        }
        return;
    }
    if (command == "indigoinvite") {

        if (channel != staffchannel && channel != sys.id("shanaindigo")) {
            normalbot.sendChanMessage(src, "Can't use on this channel.");
            return;
        }
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Your target is not online.");
            return;
        }
        if (SESSION.users(tar).megauser || SESSION.users(tar).contributions || sys.auth(tar) > 0) {
            normalbot.sendChanMessage(src, "They have already access.");
            return;
        }
        normalbot.sendAll("" + sys.name(src) + " summoned " + sys.name(tar) + " to this channel!", channel);
        SESSION.channels(channel).invitelist.push(tar);
        sys.putInChannel(tar, channel);
        normalbot.sendChanMessage(tar, "" + sys.name(src) + " made you join this channel!");
        return;
    }
    if (command == "indigodeinvite") {
        var count = 0;
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if (sys.isInChannel(current_player, staffchannel) && !this.canJoinStaffChannel(current_player)) {
                sys.kick(current_player, staffchannel);
                count = 1;
            }
        }
        normalbot.sendAll("" + count + " unwanted visitors were kicked...", staffchannel);
        return;
    }
    if (command == "destroychan") {
        var ch = commandData
        var chid = sys.channelId(ch)
        if(sys.existChannel(ch) != true) {
            normalbot.sendChanMessage(src, "No channel exists by this name!");
            return;
        }
        if (chid == 0 || chid == staffchannel ||  chid == tourchannel || (SESSION.channels(chid).perm == true) ) {
            normalbot.sendChanMessage(src, "This channel cannot be destroyed!");
            return;
        }
        var players = sys.playersOfChannel(chid)
        for(x in players) {
            sys.kick(players[x], chid)
            if (sys.isInChannel(players[x], 0) != true) {
                sys.putInChannel(players[x], 0)
            }
        }
        return;
    }
    if (command == "ban") {
        if(sys.dbIp(commandData) == undefined) {
            normalbot.sendChanMessage(src, "No player exists by this name!");
            return;
        }
        if (sys.maxAuth(sys.ip(tar))>=sys.auth(src)) {
           normalbot.sendChanMessage(src, "Can't do that to higher auth!");
           return;
        }

        var ip = sys.dbIp(commandData);
        var alias=sys.aliases(ip)
        var y=0;
        var z;
        for(var x in alias) {
            z = sys.dbAuth(alias[x])
            if (z > y) {
                y=z
            }
        }
        if(y>=sys.auth(src)) {
           normalbot.sendChanMessage(src, "Can't do that to higher auth!");
           return;
        }
        var banlist=sys.banList()
        for(a in banlist) {
            if(ip == sys.dbIp(banlist[a])) {
                normalbot.sendChanMessage(src, "He/she's already banned!");
                return;
            }
        }

        normalbot.sendAll("Target: " + commandData + ", IP: " + ip, staffchannel);
        sys.sendHtmlAll('<b><font color=red>' + commandData + ' was banned by ' + nonFlashing(sys.name(src)) + '!</font></b>');
        sys.ban(commandData);
        this.kickAll(ip);
        sys.appendToFile('bans.txt', sys.name(src) + ' banned ' + commandData + "\n")
        return;
    }
    if (command == "unban") {
        if(sys.dbIp(commandData) == undefined) {
            normalbot.sendChanMessage(src, "No player exists by this name!");
            return;
        }
        var banlist=sys.banList()
        for(a in banlist) {
            if(sys.dbIp(commandData) == sys.dbIp(banlist[a])) {
                sys.unban(commandData)
                normalbot.sendChanMessage(src, "You unbanned " + commandData + "!");
                sys.appendToFile('bans.txt', sys.name(src) + ' unbanned ' + commandData + "n")
                return;
            }
        }
        normalbot.sendChanMessage(src, "He/she's not banned!");
        return;
    }

    if (command == "smute") {
        script.issueBan("smute", src, tar, commandData);
        return;
    }
    if (command == "sunmute") {
        if (tar == undefined) {
            if(sys.dbIp(commandData) != undefined) {
                if (smutes.get(commandData)) {
                    normalbot.sendAll("IP address " + commandData + " was secretly unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                    smutes.remove(commandData);
                    return;
                }
                var ip = sys.dbIp(commandData)
                if (smutes.get(ip)) {
                    normalbot.sendAll("" + commandData + " was secretly unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                    smutes.remove(ip);
                    return;
                }
                normalbot.sendChanMessage(src, "He/she's not secretly muted.");
                return;
            }
            return;
        }
        if (!SESSION.users(sys.id(commandData)).smute.active) {
            normalbot.sendChanMessage(src, "He/she's not secretly muted.");
            return;
        }
        normalbot.sendAll("" + commandData + " was secretly unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
        SESSION.users(sys.id(commandData)).un("smute");

        return;
    }
    if (command == "nameban") {
        if (commandData === undefined) {
            normalbot.sendChanMessage(src, "Sorry, can't name ban empty names.");
            return;
        }
        var regex;
        try {
            regex = new RegExp(commandData.toLowerCase()); // incase sensitive
        } catch (e) {
            normalbot.sendChanMessage(src, "Sorry, your regular expression '" +commandData + "' fails. (" + e + ")");
        }
        nameBans.push(regex);
        var serialized = {nameBans: []};
        for (var i = 0; i < nameBans.length; ++i) {
            serialized.nameBans.push(nameBans[i].source);
        }
        sys.writeToFile("nameBans.json", JSON.stringify(serialized));
        normalbot.sendChanMessage(src, "You banned: " + regex.toString());
        return;
    }
    if (command == "nameunban") {
        var toDelete = -1;
        for (var i = 0; i < nameBans.length; ++i) {
            if (nameBans[i].toString() == commandData) {
                toDelete = i;
                break;
            }
        }
        if (toDelete >= 0) {
            normalbot.sendChanMessage(src, "You unbanned: " + nameBans[toDelete].toString());
            nameBans.splice(toDelete,1);
        } else {
            normalbot.sendChanMessage(src, "No match.");
        }
        return;
    }
    if (command == "channelusers") {
        if (commandData === undefined) {
            normalbot.sendChanMessage(src, "Please give me a channelname!");
            return;
        }
        var chanid;
        var isbot;
        if (commandData[0] == "~") {
            chanid = sys.channelId(commandData.substring(1));
            isbot = true;
        } else {
            chanid = sys.channelId(commandData);
            isbot = false;
        }
        if (chanid === undefined) {
            channelbot.sendChanMessage(src, "Such a channel doesn't exist!");
            return;
        }
        var chanName = sys.channel(chanid);
        var players = sys.playersOfChannel(chanid);
        var objectList = [];
        var names = [];
        for (var i = 0; i < players.length; ++i) {
            var name = sys.name(players[i]);
            if (isbot)
                objectList.push({'id': players[i], 'name': name});
            else
                names.push(name);
        }
        if (isbot) {
            var channelData = {'type': 'ChannelUsers', 'channel-id': chanid, 'channel-name': chanName, 'players': objectList};
            sendChanMessage(src, ":"+JSON.stringify(channelData));
        } else {
            channelbot.sendChanMessage(src, "Users of channel #" + chanName + " are: " + names.join(", "));
        }
        return;
    }
    // hack, for allowing some subset of the owner commands for super admins
    if (isSuperAdmin(src)) {
       if (["eval"].indexOf(command) != -1 && sys.name(src).toLowerCase() != "lamperi") {
           normalbot.sendChanMessage(src, "Can't aboos some commands");
           return;
       }
       return this.ownerCommand(src, command, commandData, tar);
    }

    return "no command";
}
,
ownerCommand: function(src, command, commandData, tar) {
    if (command == "changerating") {
        var data =  commandData.split(' -- ');
        if (data.length != 3) {
            normalbot.sendChanMessage(src, "You need to give 3 parameters.");
            return;
        }
        var player = data[0];
        var tier = data[1];
        var rating = parseInt(data[2]);

        sys.changeRating(player, tier, rating);
        normalbot.sendChanMessage(src, "Rating of " + player + " in tier " + tier + " was changed to " + rating);
        return;
    }
    if (command == "getannouncement") {
        sendChanMessage(src, sys.getAnnouncement());
        return;
    }
    if (command == "testannouncement") {
        sys.setAnnouncement(commandData, src);
        return;
    }
    if (command == "setannouncement") {
        sys.changeAnnouncement(commandData);
        return;
    }
    if (command == "testwebannouncement") {
        var updateURL = Config.base_url + "announcement.html";
        sys.webCall(updateURL, function(resp) {
            sys.setAnnouncement(resp, src);
        });
    }
    if (command == "setwebannouncement") {
        var updateURL = Config.base_url + "announcement.html";
        sys.webCall(updateURL, function(resp) {
            sys.changeAnnouncement(resp);
        });
    }
    if (command == "capslockday") {
        if (commandData == "off")
            CAPSLOCKDAYALLOW = false;
        else
            CAPSLOCKDAYALLOW = true;
        return;
    }
    if (command == "contributor") {
        var s = commandData.split(":");
        contributors.add(s[0], s[1]);
        return;
    }
    if (command == "contributoroff") {
        contributors.remove(commandData);
        return;
    }
    if (command == "showteam") {
        sendChanMessage(src, "");
        var info = this.importable(tar);
        for (var x=0; x < info.length; ++x) {
            sys.sendMessage(src, info[x], channel);
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "onrange") {
        var subip = commandData;
        var players = sys.playerIds();
        var players_length = players.length;
        var names = [];
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            var ip = sys.ip(current_player);
            if (ip.substr(0, subip.length) == subip) {
                names.push(current_player);
            }
        }
        // Tell about what is found.
        if (names.length > 0) {
            var msgs = [];
            for (var i = 0; i < names.length; i++) {
                msgs.push(sys.name(names[i]) + " (" + sys.ip(names[i]) + ")");
            }
            sys.sendMessage(src,"Players: on range " + subip + " are: " + msgs.join(", "), channel);
        } else {
            sys.sendMessage(src,"Players: Nothing interesting here!",channel);
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
            } else if (c == '.' && nums == 0) {
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
            normalbot.sendChanMessage(src, "The IP address looks strange, you might want to correct it: " + subip);
            return;
        }

        /* add rangeban */
        rangebans.add(subip, rangebans.escapeValue(comment));
        normalbot.sendChanMessage(src, "Rangeban added successfully for IP subrange: " + subip);
        /* kick them */
        var players = sys.playerIds();
        var players_length = players.length;
        var names = [];
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            var ip = sys.ip(current_player);
            if (sys.auth(current_player) > 0) continue;
            if (ip.substr(0, subip.length) == subip && allowedNames.indexOf(name) == -1) {
                names.push(sys.name(current_player));
                sys.kick(current_player);
                return;
            }
        }
        if (names.length > 0) {
            sys.sendAll(names.join(", ") + " got range banned by " + sys.name(src));
        }
        return;
    }
    if (command == "rangeunban") {
        var subip = commandData;
        if (rangebans.get(subip) !== undefined) {
            rangebans.remove(subip);
            normalbot.sendChanMessage(src, "Rangeban removed successfully for IP subrange: " + subip);
        } else {
            normalbot.sendChanMessage(src, "No such rangeban.");
        }
        return;
    }
    if (command == "purgemutes") {
        var time = parseInt(commandData);
        if (isNaN(time)) {
            time = 60*60*24*7*4;
        }
        var limit = parseInt(sys.time()) - time;
        var removed = [];
        mutes.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0]) < limit || (data.length > 3 && parseInt(data[2]) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendChanMessage(src, "" + removed.length + " mutes purged successfully.");
        } else {
            normalbot.sendChanMessage(src, "No mutes were purged.");
        }
        return;
    }
    if (command == "purgembans") {
        var time = parseInt(commandData);
        if (isNaN(time)) {
            time = 60*60*24*7;
        }
        var limit = parseInt(sys.time()) - time;
        var removed = [];
        mbans.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0]) < limit || (data.length > 3 && parseInt(data[2]) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendChanMessage(src, "" + removed.length + " mafiabans purged successfully.");
        } else {
            normalbot.sendChanMessage(src, "No mafiabans were purged.");
        }
        return;
    }
    if (command == "sendall") {
        sendChanAll(commandData);
        return;
    }
    if (command == "imp") {
        SESSION.users(src).impersonation = commandData;
        normalbot.sendChanMessage(src, "Now you are " + SESSION.users(src).impersonation + "!");
        return;
    }
    if (command == "periodicsay") {
        var sayer = src;
        var args = commandData.split(":");
        var minutes = parseInt(args[0]);
        if (minutes < 3) {
            return;
        }
        var channels = args[1].split(",");
        var cids = [];
        for (var i = 0; i < channels.length; ++i) {
            var cid = sys.channelId(channels[i].replace(/(^\s*)|(\s*$)/g, ""));
            if (cid !== undefined) cids.push(cid);
        }
        if (cids.length == 0) return;
        var what = args.slice(2).join(":");
        var count = 1;
        var callback = function(sayer, minutes, cids, what, count) {
            var name = sys.name(sayer);
            if (name === undefined) return;
            SESSION.users(sayer).callcount--;
            if (SESSION.users(sayer).endcalls) {
                normalbot.sendMessage(src, "Periodic say of '"+what+"' has ended.");
                SESSION.users(sayer).endcalls = false;
                return;
            }
            for (var i = 0; i < cids.length; ++i) {
                var cid = cids[i];
                if (sys.isInChannel(sayer, cid))
                    sys.sendAll(sys.name(sayer) + ": " + what, cid);
            }
            if (++count > 100) return; // max repeat is 100
            SESSION.users(sayer).callcount++;
            sys.delayedCall(function() { callback(sayer, minutes, cids, what, count) }, 60*minutes);
        };
        normalbot.sendMessage(src, "Starting a new periodicsay");
        SESSION.users(sayer).callcount = SESSION.users(sayer).callcount || 0;
        SESSION.users(sayer).callcount++;
        callback(sayer, minutes, cids, what, count);

        return;
    }
    if (command == "endcalls") {
        if (SESSION.users(src).callcount == 0 || SESSION.users(src).callcount === undefined) {
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
    if (command == "changeauth") {
        var pos = commandData.indexOf(' ');
        if (pos == -1) {
            return;
        }

        var newauth = commandData.substring(0, pos);
        var name = commandData.substr(pos+1);
        var tar = sys.id(name);
        if(newauth>0 && sys.dbRegistered(name)==false){
            normalbot.sendMessage(src, "This person is not registered")
            normalbot.sendMessage(tar, "Please register, before getting auth")
            return;
        }
        if (tar !== undefined) {
            sys.changeAuth(tar, newauth);
            normalbot.sendAll("" + sys.name(src) + " changed auth of " + sys.name(tar) + " to " + newauth);
        } else {
            sys.changeDbAuth(name, newauth);
            normalbot.sendAll("" + sys.name(src) + " changed auth of " + name + " to " + newauth);
        }

        return;
    }
    if (command == "variablereset") {
        delete VarsCreated
        this.init()
        return;
    }

    if (command == "eval" && (sys.ip(src) == sys.dbIp("coyotte508") || sys.name(src).toLowerCase() == "darkness" || sys.name(src).toLowerCase() == "lamperi" || sys.name(src).toLowerCase() == "emperor elements" || sys.name(src).toLowerCase() == "crystal moogle")) {
        sys.eval(commandData);
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
            normalbot.sendMessage(src, "Staff channel was remade!")
            return;
            }
        if (commandData == "off") {
            SESSION.channels(staffchannel).perm = false;
            players = sys.playersOfChannel(staffchannel)
            for(x in players) {
                sys.kick(players[x], staffchannel)
                if (sys.isInChannel(players[x], 0) != true) {
                    sys.putInChannel(players[x], 0)
                }
            }
            normalbot.sendMessage(src, "Staff channel was destroyed!")
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
        normalbot.sendChanMessage(src, "" + commandData + "'s password was cleared!");
        if (tar !== undefined)
            normalbot.sendMessage(tar, "Your password was cleared by " + mod + "!");
        return;
    }
    if (command == "updatebansites") {
        normalbot.sendChanMessage(src, "Fetching ban sites...");
        sys.webCall(Config.base_url + "bansites.txt", function(resp) {
            if (resp != "") {
                sys.writeToFile('bansites.txt', resp);
                SESSION.global().BannedUrls = resp.toLowerCase().split(/\n/);
                normalbot.sendAll('Updated banned sites!', staffchannel);
            } else {
                normalbot.sendAll('Failed to update!', staffchannel);
            }
        });
        return;
    }
    if (command == "updatescripts") {
        normalbot.sendChanMessage(src, "Fetching scripts...");
        var updateURL = Config.base_url + "scripts.js";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        var changeScript = function(resp) {
            if (resp == "") return;
            try {
                sys.changeScript(resp);
                sys.writeToFile('scripts.js', resp);
            } catch (err) {
                sys.changeScript(sys.getFileContent('scripts.js'));
                normalbot.sendAll('Updating failed, loaded old scripts!', staffchannel);
                sendChanMessage(src, "ERROR: " + err);
                print(err);
            }
        };
        normalbot.sendChanMessage(src, "Fetching scripts from " + updateURL);
        sys.webCall(updateURL, changeScript);
        return;
    }
    if (command == "updatetiers") {
        normalbot.sendChanMessage(src, "Fetching tiers...");
        var updateURL = Config.base_url + "tiers.xml";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        normalbot.sendChanMessage(src, "Fetching tiers from " + updateURL);
        sys.webCall(updateURL, "sys.writeToFile('tiers.xml', resp); sys.reloadTiers();");
        return;
    }
    if (command == "addplugin") {
        var POglobal = SESSION.global();
        updateModule(commandData, function(module) {
            POglobal.plugins.push(module);
            module.source = commandData;
            module.init();
            normalbot.sendChanMessage(src, "Module " + commandData + " updated!");
        });
        normalbot.sendChanMessage(src, "Downloading module " + commandData + "!");
        return;
    }
    if (command == "removeplugin") {
        var POglobal = SESSION.global();
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if (commandData == POglobal.plugins[i].source) {
                normalbot.sendChanMessage(src, "Module " + POglobal.plugins[i].source + " removed!!");
                plugins.splice(i,1);
                break;
            }
        }
        normalbot.sendChanMessage(src, "Module not found, can not remove.");
        return;
    }
    if (command == "updateplugin") {
        var POglobal = SESSION.global();
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if (commandData == POglobal.plugins[i].source) {
		var source = POglobal.plugins[i].source;
                updateModule(source, function(module) {
                    POglobal.plugins[i] = module;
                    module.source = source;
                    module.init();
                    normalbot.sendChanMessage(src, "Module " + source + " updated!");
                });
                normalbot.sendChanMessage(src, "Downloading module " + source + "!");
                return;
            }
        }
        normalbot.sendChanMessage(src, "Module not found, can not update.");
        return;
    }

    return "no command";
}
,
channelCommand: function(src, command, commandData, tar) {
    var poChannel = SESSION.channels(channel);
    if (poChannel.operators === undefined)
        poChannel.operators = [];
    if (command == "lt" || command == "lovetap") {
        if (tar == undefined) {
            normalbot.sendChanMessage(src, "Choose a valid target for your love!");
            return;
        }
        sys.sendHtmlAll("<font color='#0483c5'><timestamp/> *** <b>" + this.html_escape(sys.name(src)) + "</b> love taps " + commandData + ".</font>", channel);
        sys.kick(tar, channel);
        return;
    }
    if (command == "invitelist") {
        var names = [];
        var toRemove = [];
        for (var i = 0; i < poChannel.invitelist.length; ++i) {
            var name = sys.name(parseInt(poChannel.invitelist[i]));
            if (name) names.push(name);
            else toRemove.push(i);
        }
        while (toRemove.length > 0) {
            var j = toRemove.pop();
            poChannel.invitelist.splice(j,1);
        }
        normalbot.sendChanMessage(src, "Invited people: " + names.join(", "));
        return;
    }
    if (command == "invite") {
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Choose a valid target for invite!");
            return;
        }
        if (sys.isInChannel(tar, channel)) {
            normalbot.sendChanMessage(src, "Your target already sits here!");
            return;
        }
        normalbot.sendMessage(tar, "" + sys.name(src) + " would like you to join #" + sys.channel(channel) + "!");
        if (poChannel.inviteonly) {
            poChannel.invitelist.push(tar);
            if (poChannel.invitelist.length > 25) {
                poChannel.invitelist.splice(0,1);
                normalbot.sendChanMessage(src, "Your target was invited, but the invitelist was truncated to 25 players.");
                return;
            }
        }
        normalbot.sendChanMessage(src, "Your target was invited.");
        return;
    }

    if (command == "inviteonly") {
        var level = sys.auth(src) >= 3 ? 3 : sys.auth(src) + 1;
        if (commandData == "on") {
            poChannel.inviteonly = level;
            normalbot.sendChanAll("This channel was made inviteonly with level " + level + ".");
        } else if (commandData == "off") {
            poChannel.inviteonly = 0;
            normalbot.sendChanAll("This channel is not inviteonly anymore.");
        } else {
            if (poChannel.inviteonly) {
                normalbot.sendChanMessage(src, "This channel is inviteonly with level " + poChannel.inviteonly + ".");
            } else {
                normalbot.sendChanMessage(src, "This channel is not inviteonly.");
            }
        }
        return;
    }
    if (command == "op") {
        poChannel.addOperator(src, commandData);
        return;
    }

    if (command == "deop") {
        poChannel.removeOperator(src, commandData);
        return;
    }
    if (command == "topicadd") {
        if (poChannel.topic.length > 0)
            poChannel.setTopic(src, poChannel.topic + " | " + commandData);
        else
            poChannel.setTopic(src, commandData);
        return;
    }
    if (command == "cmeon") {
        this.meon(src, sys.channel(channel));
        return;
    }
    if (command == "cmeoff") {
        this.meoff(src, sys.channel(channel));
        return;
    }

    if (command == "csilence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        this.silence(src, commandData, sys.channel(channel));
        return;
    }
    if (command == "csilenceoff") {
        this.silenceoff(src, sys.channel(channel));
        return;
    }

    if (command == "cmute") {
        if (poChannel.mute(commandData)) {
            channelbot.sendChanAll(commandData + " was channel muted by " + nonFlashing(sys.name(src)));
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }
    if (command == "cunmute") {
        if (poChannel.unmute(commandData)) {
            channelbot.sendChanAll(commandData + " was channel unmuted by " + nonFlashing(sys.name(src)));
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }

    if (command == "cmutes") {
        var data = ["Following mutes in effect: "];
        for (var ip in poChannel.muted.ips) {
            data.push(ip + ", ");
        }
        channelbot.sendChanMessage(src, data.join(""));
        return;
    }

    if (command == "cbans") {
        var data = ["Following bans in effect: "];
        for (var ip in poChannel.banned.ips) {
            data.push(ip + ", ");
        }
        channelbot.sendChanMessage(src, data.join(""));
        return;
    }

    // followign commands only for Channel Masters
    if (!poChannel.isChannelMaster(src) && sys.auth(src) != 3 && !isSuperAdmin(src))
        return "no command";

    if (command == "ctoggleflood") {
        poChannel.ignoreflood = !poChannel.ignoreflood;
        channelbot.sendChanMessage(src, "Now " + (poChannel.ignoreflood ? "" : "dis") + "allowing excessive flooding.");
        return;
    }

    if (command == "ctogglecaps") {
        poChannel.ignorecaps = !poChannel.ignorecaps;
        channelbot.sendChanMessage(src, "Now " + (poChannel.ignorecaps ? "" : "dis") + "allowing excessive CAPS-usage.");
        return;
    }

    if (command == "cban") {
        if (poChannel.ban(commandData)) {
            channelbot.sendChanMessage(src, "Your target was channel banned.");
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }

    if (command == "cunban") {
        if (poChannel.unban(commandData)) {
            channelbot.sendChanMessage(src, "Your target was channel unbanned.");
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }

    if (command == "owner") {
        poChannel.addOwner(src, commandData);
        return;
    }
    if (command == "deowner") {
        poChannel.removeOwner(src, commandData);
        return;
    }

    return "no command";
}
,
beforeChatMessage: function(src, message, chan) {
    channel = chan;
    if ((chan == 0 && message.length > 250 && sys.auth(src) < 1)
       || (message.length > 5000 && sys.auth(src) < 2)) {
        normalbot.sendChanMessage(src, "Hi! Your message is too long, please make it shorter :3")
        sys.stopEvent();
        return;
    }

    if (callplugins("beforeChatMessage", src, message, channel)) {
        sys.stopEvent();
        return;
    }

    if (message == ".") {
        sendChanMessage(src, sys.name(src)+": .", true);
        sys.stopEvent();
        this.afterChatMessage(src, message, chan);
        return;
    }

    if (message[0] == "#" && undefined !== sys.channelId(message.slice(1))) {
        sys.putInChannel(src, sys.channelId(message.slice(1)));
        sys.stopEvent();
        return;
    }

    var name = sys.name(src).toLowerCase();
    // spamming bots, linking virus sites
    // using lazy points system for minimizing false positives
    if (channel == 0 && sys.auth(src) == 0) {
        //if (/http:\/\/(.*)\.tk(\b|\/)/.test(message)) {
            //bot.sendAll('.tk link pasted at #Tohjo Falls: "' + sys.name(src) + '", ip: ' + sys.ip(src) + ', message: "' + message + '".', staffchannel);
        //}
        var points = 0;

        if (!sys.dbRegistered(name)) {
            var basepoint = (SESSION.users(src).logintime + 60 < parseInt(sys.time())) ? 2 : 1;
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
            sys.ban(sys.name(src))
            this.kickAll(sys.ip(src));
            sys.stopEvent();
            return;
        }
    }

    if (SESSION.users(src).expired("mute")) {
        SESSION.users(src).un("mute");
        normalbot.sendChanMessage(src, "your mute has expired.");
        normalbot.sendAll("" + sys.name(src) + "'s mute has expired.", trollchannel);
    }
    if (sys.auth(src) < 3 && SESSION.users(src).mute.active && message != "!join" && message != "/rules" && message != "/join" && message != "!rules" && channel != trollchannel && !(["\\join", "\\subme", "\\unjoin"].indexOf(message) >= 0 && channel == shanaitourchannel)) {
        var muteinfo = SESSION.users(src).mute;
        normalbot.sendChanMessage(src, "You are muted" + (muteinfo.by ? " by " + muteinfo.by : '')+". " + (muteinfo.expires > 0 ? "Mute expires in " + getTimeString(muteinfo.expires - parseInt(sys.time())) + ". " : '') + (muteinfo.reason ? "[Reason: " + muteinfo.reason + "]" : ''));
        sys.stopEvent();
        return;
    }
    var poChannel = SESSION.channels(channel);
    if (sys.auth(src) < 1 && !poChannel.canTalk(src)) {
        channelbot.sendChanMessage(src, "You are muted on this channel! You can't speak unless channel operators and masters unmute you.");
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
        var BanList = [".tk", "nimp.org", "drogendealer", /\u0E49/, "nobrain.dk", /\bn[1i]gg+ers*\b/i, "penis", "vagina", "fuckface", /\bhur+\b/, /\bdur+\b/, "hurrdurr", /\bherp\b/, /\bderp\b/, "░░", "██", "▄▄", "▀▀", "___", "……", ".....", "¶¶", "¯¯", "----"];
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
        var time = parseInt(sys.time());
        if (sys.auth(src) < 1 && user.lastline.message == message && user.lastline.time + 15 > time) {
            normalbot.sendChanMessage(src, "Please do not repeat yourself!");
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

    shanaiForward = function(msg) {
        var shanai = sys.id("Shanai");
        if (shanai !== undefined) {
            sys.sendMessage(shanai,"CHANMSG " + chan + " " + src + " :" + msg);
        } else {
            sys.sendMessage(src, "+ShanaiGhost: Shanai is offline, your command will not work. Ping nixeagle if he's online.", chan);
        }
        sys.stopEvent();
    }

    // Forward some commands to Shanai
    if (['|', '\\'].indexOf(message[0]) > -1 && !usingBannedWords() && name != 'coyotte508') {
        shanaiForward(message);
        return;
    }

    if ((message[0] == '/' || message[0] == '!') && message.length > 1) {
        if (parseInt(sys.time()) - lastMemUpdate > 500) {
            sys.clearChat();
            lastMemUpdate = parseInt(sys.time());
        }

        sys.stopEvent();

        var commandData = undefined;
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

        // Forward some commands to shanai in case she is online and the command character is "/"
        var forwardShanaiCommands = ["join", "subme", "unjoin", "viewround", "queue", "dq", "myflashes", "flashme", "unflashme", "tour", "iom", "ipm", "viewtiers", "tourrankings", "sub", "endtour", "queuerm", "start", "pushtour", "push", "salist", "activesa", "activesas", "tourranking", "tourdetails", "start", "lastwinners"];
	if (sys.id("shanai") !== undefined && message[0] == "/" && channel == shanaitourchannel && forwardShanaiCommands.indexOf(command) > -1) {
            shanaiForward("\\" + message.substr(1));
            return;
        }

        if (this.userCommand(src, command, commandData, tar) != "no command") {
            return;
        }

        if (sys.auth(src) > 0) {
            if (this.modCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) > 1) {
            if (this.adminCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) > 2) {
            if (this.ownerCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) == 3 || SESSION.channels(channel).isChannelOperator(src)) {
            if (this.channelCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }
        // Shanai commands
        if ((sys.auth(src) > 3 && sys.name(src) == "Shanai") || (command == "silencetriviaoff" && sys.auth(src) > 1)) {
            if (command == "sendhtmlall") {
                sys.sendHtmlAll(commandData,channel);
                return;
            }
            if (command == "sendhtmlmessage") {
                var channelToSend = parseInt(commandData.split(":::")[0]);
                var targets = commandData.split(":::")[1].split(":");
                var htmlToSend = commandData.split(":::")[2];
                for (var i=0; i<targets.length; ++i) {
                    var id = sys.id(targets[i]);
                    if (id !== undefined && sys.isInChannel(id, channelToSend))
                        sys.sendHtmlMessage(id,htmlToSend,channelToSend);
                }
                return;
            }
            if (command == "silencetrivia") {
                var id = sys.channelId("Trivia");
                if (id === undefined) return;
                SESSION.channels(id).triviaon = true;
                return;
            }
            if (command == "silencetriviaoff") {
                var id = sys.channelId("Trivia");
                if (id === undefined) return;
                SESSION.channels(id).triviaon = false;
                return;
            }
            if (command == "teaminfo") {
                var id = sys.id(commandData);
                if (id) {
                    var data = {type: 'TeamInfo', id: id, name: sys.name(id), gen: sys.gen(id), tier: sys.tier(id), importable: this.importable(id).join("\n"), registered: sys.dbRegistered(sys.name(id)), ip: sys.ip(id)};
                    sendChanMessage(src, ":"+JSON.stringify(data));
                }
            }
        }


        var command;
        commandbot.sendChanMessage(src, "The command " + command + " doesn't exist");
        return;
    } /* end of commands */

    // Trivia answers
    if (chan == sys.channelId("Trivia") && SESSION.channels(chan).triviaon && !usingBannedWords()) {
        var shanai = sys.id("Shanai");
        if (src != shanai) {
            if (shanai !== undefined) {
                sys.sendMessage(shanai,"CHANMSG " + chan + " " + src + " :\\a " + message);
                sys.sendMessage(src, "±Trivia: Your answer was submitted.", chan);
            }
            sys.stopEvent();
            return;
        }
    }

    var ignorechans = ["Tohjo Falls", "PO Android", "Indigo Plateau", "Mafia Channel", "Tournaments", "League", "PO Wiki", "Trivia", "TrivReview", "Academy", "Oak's Lab", "winning", "Elm's Lab", "Developer's Den", "shanaindigo", "PO Stream", "Project NU", "Evolution Game", "Side Metagames"];
    var watch_msg = true;
    for(var i = 0; i < ignorechans.length; i++) {
        var ignorechan = ignorechans[i];
        if(sys.existChannel(ignorechan) && channel == sys.channelId(ignorechan)) {
            watch_msg = false;
            break;
        }
    }
    if (watch_msg && sys.existChannel("Elm's Lab")) {
        sys.sendAll("(#" + sys.channel(channel) + ") " + sys.name(src) + ": " + message, sys.channelId("Elm's Lab"));
    }

    // Impersonation
    if (typeof SESSION.users(src).impersonation != 'undefined') {
        sys.stopEvent();
        sendChanAll(SESSION.users(src).impersonation + ": " + message);
        return;
    }

    // Minutes of Silence
    if (sys.auth(src) == 0 && ((muteall && channel != staffchannel && channel != mafiachan && channel != sys.channelId("Trivia"))
        || SESSION.channels(channel).muteall) && !SESSION.channels(channel).isChannelOperator(src)) {
        normalbot.sendChanMessage(src, "Respect the minutes of silence!");
        sys.stopEvent();
        return;
    }

    // Banned words
    if (usingBannedWords()) {
            if (message.indexOf(".tk") != -1){
                normalbot.sendAll(sys.name(src) + " tried to send a .tk link!",staffchannel)
            }
            var aliases = sys.aliases(sys.ip(src))
                for(x in aliases){
                var id = sys.id(aliases[x])
                if(id != undefined){
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
    if (capsName()) {
        normalbot.sendChanMessage(src, "You have too many CAPS letters in your name. Please remove them to speak freely. 7 CAPS letters are allowed. Lowercase name will keep your ladder score.");
        sys.stopEvent();
        return;
    }


    // Secret mute
    if (sys.auth(src) == 0 && SESSION.users(src).smute.active) {
        if (SESSION.users(src).expired("smute")) {
            SESSION.users(src).un("smute");
        } else {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active) {
                    sendChanMessage(id,  sys.name(src)+": "+message);
                }
            });
            sys.stopEvent();
            this.afterChatMessage(src, '/'+command+ ' '+commandData, channel);
        }
        return;
    }

    if (channel == 0 && typeof clanmute != 'undefined') {
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

    if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW == true) {
    var date = new Date();
    if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
        sys.sendAll(sys.name(src)+": " + message.toUpperCase(), channel);
        sys.stopEvent();
    }
    }
} /* end of beforeChatMessage, also 1100+ lines ._. */

,

afterChatMessage : function(src, message, chan)
{

    var user = SESSION.users(src);
    var poChannel = SESSION.channels(chan);
    channel = chan;
    lineCount+=1;

    if (channel == sys.channelId("PO Android")) {
        if (/f[uo]ck|\bass|\bcum|\bdick|\bsex|pussy|bitch|porn|\bfck|nigga|\bcock|\bgay|\bhoe\b|slut|whore|cunt|clitoris/i.test(message) && user.android) {
            kickbot.sendAll(sys.name(src) + " got kicked for foul language.", channel);
            sys.kick(src);
            return;
        }
    }

    // hardcoded
    var ignoreChans = [staffchannel, sys.channelId("shanai"), sys.channelId("trivreview")];
    var ignoreUsers = ["nixeagle"];
    var userMayGetPunished = sys.auth(src) < 2 && ignoreChans.indexOf(channel) == -1 && ignoreUsers.indexOf(sys.name(src)) == -1 && !poChannel.isChannelOperator(src);
    if (!poChannel.ignorecaps && this.isMCaps(message) && userMayGetPunished) {
        user.caps += 3;
        if (user.caps >= 9 && !user.mute.active) {

            if (user.capsmutes === undefined)
                user.capsmutes = 0;
            var time = 900 * Math.pow(2,user.capsmutes);
            ++user.capsmutes;

            var message = "" + sys.name(src) + " was muted for caps for " + (time/60) + " minutes.";
            if (user.smute.active) {
                sys.sendMessage(src, message);
                capsbot.sendAll("" + sys.name(src) + " was muted for caps while smuted.", staffchannel);
            } else {
                capsbot.sendChanAll(message);
                if (channel != staffchannel)
                    capsbot.sendAll(message + "[Channel: "+sys.channel(channel) + "]", staffchannel);
            }
            var endtime = user.mute.active ? user.mute.expires + time : parseInt(sys.time()) + time;
            user.activate("mute", Config.capsbot, endtime, "Overusing CAPS", true);
            callplugins("onMute", src);
            return;
        }
    } else if (user.caps > 0) {
        user.caps -= 1;
    }

    if (typeof user.timecount == "undefined") {
        user.timecount = parseInt(sys.time());
    }


    var linecount = sys.auth(src) == 0 ? 9 : 21;
    if (!poChannel.ignoreflood && userMayGetPunished) {
        user.floodcount += 1;
        var time = parseInt(sys.time());
        if (time > user.timecount + 7) {
            var dec = Math.floor((time - user.timecount)/7);
            user.floodcount = user.floodcount - dec;
            if (user.floodcount <= 0) {
                user.floodcount = 1;
            }
            user.timecount += dec*7;
        }

        if (user.floodcount > linecount) {
            var message = "" + sys.name(src) + " was kicked " + (sys.auth(src) == 0 ? "and muted " : "") + "for flood.";
            if (user.smuted) {
                sys.sendMessage(src, message);
                kickbot.sendAll("" + sys.name(src) + " was kicked for flood while smuted.", staffchannel);
            } else {
                kickbot.sendChanAll(message);
                if (channel != staffchannel)
                    kickbot.sendAll(message + " [Channel: "+sys.channel(channel)+"]", staffchannel);
            }
            if (sys.auth(src) == 0) {
                 var endtime = user.mute.active ? user.mute.expires + 3600 : parseInt(sys.time()) + 3600;
                 user.activate("mute", Config.kickbot, endtime, "Flooding", true);
            }
            callplugins("onKick", src);
            sys.kick(src);
            return;
        }
    }
    SESSION.channels(channel).beforeMessage(src, message);
} /* end of afterChatMessage */

,

afterBattleStarted: function(src, dest, clauses, rated, mode, bid) {
    callplugins("afterBattleStarted", src, dest, clauses, rated, mode, bid);

    SESSION.global().battleinfo[bid] = {players: [src, dest], clauses: clauses, rated: rated, mode: mode};
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
}

,

beforeBattleEnded : function(src, dest, desc, bid) {
    if (SESSION.global().battleinfo[bid] && SESSION.global().battleinfo[bid].rated && desc == "forfeit"
       && sys.ratedBattles(dest) <= 1 && sys.isInChannel(dest, mafiachan)) {
        //normalbot.sendAll(sys.name(dest) + " just forfeited their first battle and is on mafia channel. Troll?", staffchannel)
    }
    delete SESSION.global().battleinfo[bid];

    if (!SESSION.users(src).battlehistory) SESSION.users(src).battlehistory=[];
    if (!SESSION.users(dest).battlehistory) SESSION.users(dest).battlehistory=[];
    SESSION.users(src).battlehistory.push([sys.name(dest), "win", desc]);
    SESSION.users(dest).battlehistory.push([sys.name(src), "lose", desc]);
}

,

afterBattleEnded : function(src, dest, desc) {
    callplugins("afterBattleEnded", src, dest, desc);
}

,

isLCaps: function(letter) {
    return letter >= 'A' && letter <= 'Z';
}

,

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
}

,
beforeChangeTier : function(src, oldtier, newtier) {
    if (sys.name(src) != "Lamperi-") {
    if(newtier == "Challenge Cup") return;

    this.eventMovesCheck(src);
    this.dreamWorldAbilitiesCheck(src, newtier);
    this.littleCupCheck(src, newtier);
    this.evioliteCheck(src, newtier);
    this.inconsistentCheck(src, newtier);
    this.monotypecheck(src, newtier);
    this.monoGenCheck(src, newtier);
    this.weatherlesstiercheck(src, newtier);
    this.shanaiAbilityCheck(src, newtier);
    this.monoColourCheck(src, newtier);
    this.swiftSwimCheck(src, newtier);
    this.snowWarningCheck(src, newtier);
    this.droughtCheck(src, newtier);
    this.advance200Check(src, newtier);
    } else {
    if (!tier_checker.check_if_valid_for(src, newtier)) {
       sys.stopEvent();
       normalbot.sendMessage(src, "Sorry, you can not change into that tier.");
       tier_checker.find_good_tier(src);
    }
    }
}
,
beforeChallengeIssued : function (src, dest, clauses, rated, mode) {
    if (battlesStopped) {
        battlebot.sendMessage(src, "Battles are now stopped as the server will restart soon.");
        sys.stopEvent();
        return;
    }

    if (SESSION.users(dest).sametier == true && (sys.tier(dest) != sys.tier(src))) {
        battlebot.sendMessage(src, "That guy only wants to fight his/her own tier.");
        sys.stopEvent();
        return;
    }

    var isChallengeCup = (sys.tier(src) == "Challenge Cup" && sys.tier(dest) == "Challenge Cup") || (sys.tier(src) == "1v1 Challenge Cup" && sys.tier(dest) == "1v1 Challenge Cup");
    var hasChallengeCupClause = (clauses % 32) >= 16;
    if (isChallengeCup && !hasChallengeCupClause) {
        checkbot.sendMessage(src, "Challenge Cup must be enabled in the challenge window for a CC battle");
        sys.stopEvent();
        return;
    } else if (!isChallengeCup && hasChallengeCupClause) {
        return;
    }

    if (sys.tier(src).indexOf("Doubles") != -1 && sys.tier(dest).indexOf("Doubles") != -1 && mode != 1) {
        battlebot.sendMessage(src, "To fight in doubles, enable doubles in the challenge window!");
        sys.stopEvent();
        return;
    }

    if (sys.tier(src).indexOf("Triples") != -1 && sys.tier(dest).indexOf("Triples") != -1 && mode != 2) {
        battlebot.sendMessage(src, "To fight in triples, enable triples in the challenge window!");
        sys.stopEvent();
        return;
    }

    if (callplugins("beforeChallengeIssued", src, dest, clauses, rated)) {
        sys.stopEvent();
    }

}

,

beforeBattleMatchup : function(src,dest,clauses,rated)
{
    if (battlesStopped) {
        sys.stopEvent();
        return;
    }
    if (callplugins("beforeBattleMatchup", src, dest, clauses, rated)) {
        sys.stopEvent();
    }
}
,

eventMovesCheck : function(src)
{
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, i);
        if (poke in pokeNatures) {
            for (x in pokeNatures[poke]) {
                if (sys.hasTeamPokeMove(src, i, x) && sys.teamPokeNature(src, i) != pokeNatures[poke][x])
                {
                    checkbot.sendMessage(src, "" + sys.pokemon(poke) + " with " + sys.move(x) + " must be a " + sys.nature(pokeNatures[poke][x]) + " nature. Change it in the teambuilder.");
                    sys.stopEvent();
                    sys.changePokeNum(src, i, 0);
                }

            }
        }
    }
}
,
littleCupCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Wifi LC", "Wifi LC Ubers", "Wifi UU LC"].indexOf(tier) == -1) {
        return; // only care about these tiers
    }
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        if (x != 0 && sys.hasDreamWorldAbility(src, i) && lcpokemons.indexOf(x) != -1 ) {
            checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with a Dream World ability in this tier. Change it in the teambuilder.");

            if (sys.tier(src) == "Wifi LC" && sys.hasLegalTeamForTier(src, "DW LC") || sys.tier(src) == "Wifi LC Ubers" && sys.hasLegalTeamForTier(src, "DW OU")) {
                sys.changeTier(src, "DW LC");
            } else {
                sys.changePokeNum(src, i, 0);
            }
            sys.stopEvent();
        }
    }
}
,
evioliteCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Wifi NU"].indexOf(tier) == -1) {
        return; // only care about these tiers
    }
    var evioliteLimit = 6;
    var eviolites = 0;
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        var item = sys.teamPokeItem(src, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        if (item == "Eviolite" && ++eviolites > evioliteLimit) {
            checkbot.sendMessage(src, "Only 1 pokemon is allowed with eviolite in " + tier + " tier. Please remove extra evioites in teambuilder.");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
        }
    }
}
,
dreamWorldAbilitiesCheck : function(src, tier) {
    if (sys.gen(src) < 5)
        return;

    if (!tier) tier = sys.tier(src);
    if (Config.DreamWorldTiers.indexOf(tier) > -1) {
        return; // don't care about these tiers
    }

    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        if (x != 0 && sys.hasDreamWorldAbility(src, i) && (!(x in dwpokemons) || (breedingpokemons.indexOf(x) != -1 && sys.compatibleAsDreamWorldEvent(src, i) != true))) {
            if (!(x in dwpokemons))
                checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with a Dream World ability in " + tier + " tier. Change it in the teambuilder.");
            else
                checkbot.sendMessage(src, "" + sys.pokemon(x) + " has to be Male and have no egg moves with its Dream World ability in  " + tier + " tier. Change it in the teambuilder.");
            /*
            if (sys.tier(src) == "Wifi OU" && sys.hasLegalTeamForTier(src, "DW OU")) {
                sys.changeTier(src, "DW OU");
            } else if (sys.tier(src) == "Wifi OU" && sys.hasLegalTeamForTier(src, "DW Ubers")) {
                sys.changeTier(src, "DW Ubers");
            } else if (sys.tier(src) == "Wifi Ubers") {
                sys.changeTier(src, "DW Ubers");
            }
            else if (sys.tier(src) == "DW 1v1" && sys.hasLegalTeamForTier(src, "DW OU")) {
                sys.changeTier(src, "DW OU");
            }
            else if (sys.tier(src) == "DW 1v1" && sys.hasLegalTeamForTier(src, "DW Ubers")) {
                sys.changeTier(src, "DW Ubers");
            }
            else if (sys.tier(src) == "Wifi UU" && sys.hasLegalTeamForTier(src, "DW UU")) {
                sys.changeTier(src, "DW UU");
            } else if (sys.tier(src) == "Wifi LU" && sys.hasLegalTeamForTier(src, "DW LU")) {
                sys.changeTier(src, "DW LU");
            }
            else if (sys.tier(src) == "Wifi LC" && sys.hasLegalTeamForTier(src, "Wifi LC") || sys.tier(src) == "Wifi LC Ubers" && sys.hasLegalTeamForTier(src, "Wifi LC Ubers")) {
                sys.changeTier(src, "DW LC");
            }else {
                sys.changePokeNum(src, i, 0);
            }
            */
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
        }
    }
}
,

inconsistentCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["DW OU", "DW UU", "DW LU", "Wifi OU", "Wifi UU", "Wifi LU", "Wifi LC", "DW LC", "Wifi Ubers", "DW Ubers", "Clear Skies", "Clear Skies DW", "Monotype", "Monocolour", "Monogen", "Smogon OU", "Smogon UU", "Smogon RU", "Wifi NU"].indexOf(tier) == -1) {
        return; // only care about these tiers
    }
    var moody = sys.abilityNum("Moody");
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);

        if (x != 0 && sys.teamPokeAbility(src, i) == moody) {
            checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with Moody in " + tier + ". Change it in the teambuilder.");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
        }
    }
}
,
weatherlesstiercheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Clear Skies" && tier != "Clear Skies DW") return;
    for (var i = 0; i < 6; i++){
        ability = sys.ability(sys.teamPokeAbility(src, i))
        if(ability.toLowerCase() == "drizzle" || ability.toLowerCase() == "drought" || ability.toLowerCase() == "snow warning" || ability.toLowerCase() == "sand stream") {
            normalbot.sendMessage(src, "Your team has a pokemon with the ability: " + ability + ", please remove before entering " +tier+" tier.");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent()
            return;
        }
    }
} /* end of weatherlesstiercheck */
,
// Will escape "&", ">", and "<" symbols for HTML output.
html_escape : function(text)
{
    var m = text.toString();
    if (m.length > 0) {
        var amp = "&am" + "p;";
        var lt = "&l" + "t;";
        var gt = "&g" + "t;";
        return m.replace(/&/g, amp).replace(/\</g, lt).replace(/\>/g, gt);
    }else{
        return "";
    }
}
,
monotypecheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Monotype") return; // Only interested in monotype
    var TypeA = sys.pokeType1(sys.teamPoke(src, 0), 5);
    var TypeB = sys.pokeType2(sys.teamPoke(src, 0), 5);
    var k;
    var checkType;
    for (var i = 1; i < 6 ; i++) {
        if (sys.teamPoke(src, i) == 0) continue;
        var temptypeA = sys.pokeType1(sys.teamPoke(src, i), 5);
        var temptypeB = sys.pokeType2(sys.teamPoke(src, i), 5);

        if(checkType != undefined) {
            k=3;
        }
        if(i==1){
            k=1;
        }
        if(TypeB !=17){
            if(temptypeA == TypeA && temptypeB == TypeB && k == 1 || temptypeA == TypeB && temptypeB == TypeA && k == 1){
                k=2;
            }
        }
        if (temptypeA == TypeA && k == 1 || temptypeB == TypeA && k == 1) {
            checkType=TypeA;
        }
        if (temptypeA == TypeB && k == 1 || temptypeB == TypeB && k == 1) {
           if(TypeB != 17){
                   checkType=TypeB;
                   }
                   if(TypeB == 17)
                   checkType=TypeA
        }
        if(i>1 && k == 2) {
            k=1;
            if(temptypeA == TypeA && temptypeB == TypeB && k == 1 || temptypeA == TypeB && temptypeB == TypeA && k == 1){
                k=2;
            }
            if (temptypeA == TypeA && k == 1 || temptypeB == TypeA && k == 1) {
                checkType=TypeA;
            }
            if (temptypeA == TypeB && k == 1 || temptypeB == TypeB && k == 1) {
                 if(TypeB != 17){
                   checkType=TypeB;
                   }
                   if(TypeB == 17)
                   checkType=TypeA
            }
        }
        if(k==3){

            if(temptypeA != checkType && temptypeB != checkType) {

                normalbot.sendMessage(src, "Team not Monotype as " + sys.pokemon(sys.teamPoke(src, i)) + " is not " + sys.type(checkType) + "!");
                /*
                if(sys.hasLegalTeamForTier(src, "DW OU")) {
                    if(sys.hasLegalTeamForTier(src,"Wifi OU")) {
                        sys.changeTier(src, "Wifi OU");
                        sys.stopEvent()
                        return;
                    }
                    sys.changeTier(src, "DW OU");
                    sys.stopEvent()
                    return;
                }
                if(sys.hasLegalTeamForTier(src,"Wifi Ubers")) {
                    sys.changeTier(src, "Wifi Ubers");
                    sys.stopEvent()
                    return;
                }
                sys.changeTier(src, "DW Ubers");
                */
                sys.changeTier(src, "Challenge Cup");
                sys.stopEvent()
                return;
            }
        }

        if(k==1) {
                    if(TypeB == 17){
                        TypeB = TypeA
                        }
            if (temptypeA != TypeA && temptypeB != TypeA && temptypeA != TypeB && temptypeB != TypeB) {
                normalbot.sendMessage(src, "Team not Monotype as " + sys.pokemon(sys.teamPoke(src, i)) + " does not share a type with " + sys.pokemon(sys.teamPoke(src, 0)) + "!")

                if(sys.hasLegalTeamForTier(src, "DW OU")) {
                    if(sys.hasLegalTeamForTier(src,"Wifi OU")) {
                        sys.changeTier(src, "Wifi OU");
                        sys.stopEvent()
                        return;
                    }
                    sys.changeTier(src, "DW OU");
                    sys.stopEvent()
                    return;
                }
                if(sys.hasLegalTeamForTier(src,"Wifi Ubers")) {
                    sys.changeTier(src, "Wifi Ubers");
                    sys.stopEvent()
                    return;
                }
                sys.changeTier(src, "DW Ubers");
                sys.stopEvent()
                return;
            }

        }
    }

    // Baton Pass Blaziken banned on 2011-09-19
    /*
    var blaziken = sys.pokeNum("Blaziken");
    var bp = sys.moveNum("Baton Pass");
    for (var i = 0; i < 6; ++i)
        if (sys.teamPoke(src,i) == blaziken && sys.hasDreamWorldAbility(src,i) && sys.hasTeamPokeMove(src,i,bp)) {

            normalbot.sendMessage(src, "Blaziken with Baton Pass and Speed Boost is banned on Monotype");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
            return
        }
    */
}
,

monoGenCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Monogen") return;

    var GEN_MAX = [0, 151, 252, 386, 493, 646];
    var gen = 0;
    for (var i = 0; i < 6; ++i) {
        var pokenum = sys.teamPoke(src, i);
        var species = pokenum % 65536; // remove alt formes
        if (species == 0) continue;
        if (gen == 0) {
            while (species > GEN_MAX[gen]) ++gen; // Search for correct gen for first poke
        } else if (!(GEN_MAX[gen-1] < species && species <= GEN_MAX[gen])) {
            normalbot.sendMessage(src, sys.pokemon(pokenum) + " is not from gen " + gen);
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
}
,

monoColourCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Monocolour") return;
    var colours = {
        'Red': ['Charmander', 'Charmeleon', 'Charizard', 'Vileplume', 'Paras', 'Parasect', 'Krabby', 'Kingler', 'Voltorb', 'Electrode', 'Goldeen', 'Seaking', 'Jynx', 'Magikarp', 'Magmar', 'Flareon', 'Ledyba', 'Ledian', 'Ariados', 'Yanma', 'Scizor', 'Slugma', 'Magcargo', 'Octillery', 'Delibird', 'Porygon2', 'Magby', 'Ho-Oh', 'Torchic', 'Combusken', 'Blaziken', 'Wurmple', 'Medicham', 'Carvanha', 'Camerupt', 'Solrock', 'Corphish', 'Crawdaunt', 'Latias', 'Groudon', 'Deoxys', 'Deoxys-A', 'Deoxys-D', 'Deoxys-S', 'Kricketot', 'Kricketune', 'Magmortar', 'Porygon-Z', 'Rotom', 'Rotom-H', 'Rotom-F', 'Rotom-W', 'Rotom-C', 'Rotom-S', 'Tepig', 'Pignite', 'Emboar', 'Pansear', 'Simisear', 'Throh', 'Venipede', 'Scolipede', 'Krookodile', 'Darumaka', 'Darmanitan', 'Dwebble', 'Crustle', 'Scrafty', 'Shelmet', 'Accelgor', 'Druddigon', 'Pawniard', 'Bisharp', 'Braviary', 'Heatmor', ],
        'Blue': ['Squirtle', 'Wartortle', 'Blastoise', 'Nidoran?', 'Nidorina', 'Nidoqueen', 'Oddish', 'Gloom', 'Golduck', 'Poliwag', 'Poliwhirl', 'Poliwrath', 'Tentacool', 'Tentacruel', 'Tangela', 'Horsea', 'Seadra', 'Gyarados', 'Lapras', 'Vaporeon', 'Omanyte', 'Omastar', 'Articuno', 'Dratini', 'Dragonair', 'Totodile', 'Croconaw', 'Feraligatr', 'Chinchou', 'Lanturn', 'Marill', 'Azumarill', 'Jumpluff', 'Wooper', 'Quagsire', 'Wobbuffet', 'Heracross', 'Kingdra', 'Phanpy', 'Suicune', 'Mudkip', 'Marshtomp', 'Swampert', 'Taillow', 'Swellow', 'Surskit', 'Masquerain', 'Loudred', 'Exploud', 'Azurill', 'Meditite', 'Sharpedo', 'Wailmer', 'Wailord', 'Swablu', 'Altaria', 'Whiscash', 'Chimecho', 'Wynaut', 'Spheal', 'Sealeo', 'Walrein', 'Clamperl', 'Huntail', 'Bagon', 'Salamence', 'Beldum', 'Metang', 'Metagross', 'Regice', 'Latios', 'Kyogre', 'Piplup', 'Prinplup', 'Empoleon', 'Shinx', 'Luxio', 'Luxray', 'Cranidos', 'Rampardos', 'Gible', 'Gabite', 'Garchomp', 'Riolu', 'Lucario', 'Croagunk', 'Toxicroak', 'Finneon', 'Lumineon', 'Mantyke', 'Tangrowth', 'Glaceon', 'Azelf', 'Phione', 'Manaphy', 'Oshawott', 'Dewott', 'Samurott', 'Panpour', 'Simipour', 'Roggenrola', 'Boldore', 'Gigalith', 'Woobat', 'Swoobat', 'Tympole', 'Palpitoad', 'Seismitoad', 'Sawk', 'Tirtouga', 'Carracosta', 'Ducklett', 'Karrablast', 'Eelektrik', 'Eelektross', 'Elgyem', 'Cryogonal', 'Deino', 'Zweilous', 'Hydreigon', 'Cobalion', 'Thundurus', ],
        'Green': ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Caterpie', 'Metapod', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Scyther', 'Chikorita', 'Bayleef', 'Meganium', 'Spinarak', 'Natu', 'Xatu', 'Bellossom', 'Politoed', 'Skiploom', 'Larvitar', 'Tyranitar', 'Celebi', 'Treecko', 'Grovyle', 'Sceptile', 'Dustox', 'Lotad', 'Lombre', 'Ludicolo', 'Breloom', 'Electrike', 'Roselia', 'Gulpin', 'Vibrava', 'Flygon', 'Cacnea', 'Cacturne', 'Cradily', 'Kecleon', 'Tropius', 'Rayquaza', 'Turtwig', 'Grotle', 'Torterra', 'Budew', 'Roserade', 'Bronzor', 'Bronzong', 'Carnivine', 'Yanmega', 'Leafeon', 'Shaymin', 'Shaymin-S', 'Snivy', 'Servine', 'Serperior', 'Pansage', 'Simisage', 'Swadloon', 'Cottonee', 'Whimsicott', 'Petilil', 'Lilligant', 'Basculin', 'Maractus', 'Trubbish', 'Garbodor', 'Solosis', 'Duosion', 'Reuniclus', 'Axew', 'Fraxure', 'Golett', 'Golurk', 'Virizion', 'Tornadus', ],
        'Yellow': ['Kakuna', 'Beedrill', 'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Ninetales', 'Meowth', 'Persian', 'Psyduck', 'Ponyta', 'Rapidash', 'Drowzee', 'Hypno', 'Exeggutor', 'Electabuzz', 'Jolteon', 'Zapdos', 'Moltres', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Pichu', 'Ampharos', 'Sunkern', 'Sunflora', 'Girafarig', 'Dunsparce', 'Shuckle', 'Elekid', 'Raikou', 'Beautifly', 'Pelipper', 'Ninjask', 'Makuhita', 'Manectric', 'Plusle', 'Minun', 'Numel', 'Lunatone', 'Jirachi', 'Mothim', 'Combee', 'Vespiquen', 'Chingling', 'Electivire', 'Uxie', 'Cresselia', 'Victini', 'Sewaddle', 'Leavanny', 'Scraggy', 'Cofagrigus', 'Archen', 'Archeops', 'Deerling', 'Joltik', 'Galvantula', 'Haxorus', 'Mienfoo', 'Keldeo', ],
        'Purple': ['Rattata', 'Ekans', 'Arbok', 'Nidoran?', 'Nidorino', 'Nidoking', 'Zubat', 'Golbat', 'Venonat', 'Venomoth', 'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Koffing', 'Weezing', 'Starmie', 'Ditto', 'Aerodactyl', 'Mewtwo', 'Crobat', 'Aipom', 'Espeon', 'Misdreavus', 'Forretress', 'Gligar', 'Granbull', 'Mantine', 'Tyrogue', 'Cascoon', 'Delcatty', 'Sableye', 'Illumise', 'Swalot', 'Grumpig', 'Lileep', 'Shellos', 'Gastrodon', 'Ambipom', 'Drifloon', 'Drifblim', 'Mismagius', 'Stunky', 'Skuntank', 'Spiritomb', 'Skorupi', 'Drapion', 'Gliscor', 'Palkia', 'Purrloin', 'Liepard', 'Gothita', 'Gothorita', 'Gothitelle', 'Mienshao', 'Genesect', ],
'Pink': ['Clefairy', 'Clefable', 'Jigglypuff', 'Wigglytuff', 'Slowpoke', 'Slowbro', 'Exeggcute', 'Lickitung', 'Chansey', 'Mr. Mime', 'Porygon', 'Mew', 'Cleffa', 'Igglybuff', 'Flaaffy', 'Hoppip', 'Slowking', 'Snubbull', 'Corsola', 'Smoochum', 'Miltank', 'Blissey', 'Whismur', 'Skitty', 'Milotic', 'Gorebyss', 'Luvdisc', 'Cherubi', 'Cherrim', 'Mime Jr.', 'Happiny', 'Lickilicky', 'Mesprit', 'Munna', 'Musharna', 'Audino', 'Alomomola', ],
        'Brown': ['Weedle', 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Raticate', 'Spearow', 'Fearow', 'Vulpix', 'Diglett', 'Dugtrio', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Abra', 'Kadabra', 'Alakazam', 'Geodude', 'Graveler', 'Golem', 'Farfetch\'d', 'Doduo', 'Dodrio', 'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan', 'Kangaskhan', 'Staryu', 'Pinsir', 'Tauros', 'Eevee', 'Kabuto', 'Kabutops', 'Dragonite', 'Sentret', 'Furret', 'Hoothoot', 'Noctowl', 'Sudowoodo', 'Teddiursa', 'Ursaring', 'Swinub', 'Piloswine', 'Stantler', 'Hitmontop', 'Entei', 'Zigzagoon', 'Seedot', 'Nuzleaf', 'Shiftry', 'Shroomish', 'Slakoth', 'Slaking', 'Shedinja', 'Hariyama', 'Torkoal', 'Spinda', 'Trapinch', 'Baltoy', 'Feebas', 'Regirock', 'Chimchar', 'Monferno', 'Infernape', 'Starly', 'Staravia', 'Staraptor', 'Bidoof', 'Bibarel', 'Buizel', 'Floatzel', 'Buneary', 'Lopunny', 'Bonsly', 'Hippopotas', 'Hippowdon', 'Mamoswine', 'Heatran', 'Patrat', 'Watchog', 'Lillipup', 'Conkeldurr', 'Sandile', 'Krokorok', 'Sawsbuck', 'Beheeyem', 'Stunfisk', 'Bouffalant', 'Vullaby', 'Mandibuzz', 'Landorus', ],
         'Black': ['Snorlax', 'Umbreon', 'Murkrow', 'Unown', 'Sneasel', 'Houndour', 'Houndoom', 'Mawile', 'Spoink', 'Seviper', 'Claydol', 'Shuppet', 'Banette', 'Duskull', 'Dusclops', 'Honchkrow', 'Chatot', 'Munchlax', 'Weavile', 'Dusknoir', 'Giratina', 'Darkrai', 'Blitzle', 'Zebstrika', 'Sigilyph', 'Yamask', 'Chandelure', 'Zekrom', ],
        'Gray': ['Machop', 'Machoke', 'Machamp', 'Magnemite', 'Magneton', 'Onix', 'Rhyhorn', 'Rhydon', 'Pineco', 'Steelix', 'Qwilfish', 'Remoraid', 'Skarmory', 'Donphan', 'Pupitar', 'Poochyena', 'Mightyena', 'Nincada', 'Nosepass', 'Aron', 'Lairon', 'Aggron', 'Volbeat', 'Barboach', 'Anorith', 'Armaldo', 'Snorunt', 'Glalie', 'Relicanth', 'Registeel', 'Shieldon', 'Bastiodon', 'Burmy', 'Wormadam', 'Wormadam-G', 'Wormadam-S', 'Glameow', 'Purugly', 'Magnezone', 'Rhyperior', 'Probopass', 'Arceus', 'Herdier', 'Stoutland', 'Pidove', 'Tranquill', 'Unfezant', 'Drilbur', 'Excadrill', 'Timburr', 'Gurdurr', 'Whirlipede', 'Zorua', 'Zoroark', 'Minccino', 'Cinccino', 'Escavalier', 'Ferroseed', 'Ferrothorn', 'Klink', 'Klang', 'Klinklang', 'Durant', 'Terrakion', 'Kyurem', ],
        'White': ['Butterfree', 'Seel', 'Dewgong', 'Togepi', 'Togetic', 'Mareep', 'Smeargle', 'Lugia', 'Linoone', 'Silcoon', 'Wingull', 'Ralts', 'Kirlia', 'Gardevoir', 'Vigoroth', 'Zangoose', 'Castform', 'Absol', 'Shelgon', 'Pachirisu', 'Snover', 'Abomasnow', 'Togekiss', 'Gallade', 'Froslass', 'Dialga', 'Regigigas', 'Swanna', 'Vanillite', 'Vanillish', 'Vanilluxe', 'Emolga', 'Foongus', 'Amoonguss', 'Frillish', 'Jellicent', 'Tynamo', 'Litwick', 'Lampent', 'Cubchoo', 'Beartic', 'Rufflet', 'Larvesta', 'Volcarona', 'Reshiram', 'Meloetta', 'Meloetta-S' ],
    }
    var poke = sys.pokemon(sys.teamPoke(src, 0));
    var thecolour = '';
    for (var colour in colours) {
        if (colours[colour].indexOf(poke) > -1) {
            thecolour = colour;
        }
    }
    if (thecolour == '') {
        normalbot.sendMessage(src, "Bug! " + poke + " has not a colour in checkMonocolour :(");
        sys.changeTier(src, "Challenge Cup")
        sys.stopEvent()
        return;
    }
    for (var i = 1; i < 6; ++i) {
        var poke = sys.pokemon(sys.teamPoke(src, i));
        if (colours[thecolour].indexOf(poke) == -1 && poke != "Missingno") {
            normalbot.sendMessage(src, "" + poke + " has not the colour: " + thecolour);
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
    //normalbot.sendMessage(src, "Your team is a good monocolour team with colour: " + thecolour);
},

swiftSwimCheck : function(src, tier){
    if (!tier) tier = sys.tier(src);
    //if (tier != "Smogon OU") return;
    if (["Smogon OU", "Wifi OU", "DW OU"].indexOf(tier) == -1) return;
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Drizzle"){
            for(var j = 0; j <6; ++j){
                if(sys.ability(sys.teamPokeAbility(src, j)) == "Swift Swim"){
                    normalbot.sendMessage(src, "You cannot have the combination of Swift Swim and Drizzle in OU")
                    sys.stopEvent()
                    sys.changeTier(src, "Challenge Cup")
                    return;
                }
            }
        }
    }
}
,
droughtCheck : function(src, tier){
    if (!tier) tier = sys.tier(src);
    if (tier != "Smogon UU") return;
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Drought"){
            normalbot.sendMessage(src, "Drought is not allowed in Smogon UU")
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
}
,

snowWarningCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Wifi UU", "Wifi LU", "Wifi NU"].indexOf(tier) == -1) return;
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Snow Warning"){
            normalbot.sendMessage(src, "Snow Warning is not allowed in " + tier + ".")
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
}
,

shanaiAbilityCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST"].indexOf(tier) == -1) {
        return; // only intereted in shanai battling
    }
    var bannedAbilities = {
        'treecko': ['overgrow'],
        'chimchar': ['blaze'],
        'totodile': ['torrent'],
        'spearow': ['sniper'],
        'skorupi': ['battle armor', 'sniper'],
        'spoink': ['thick fat'],
        'golett': ['iron fist'],
        'magnemite': ['magnet pull', 'analytic'],
        'electrike': ['static', 'lightningrod'],
        'nosepass': ['sturdy', 'magnet pull'],
        'axew': ['rivalry'],
        'croagunk': ['poison touch', 'dry skin'],
        'cubchoo': ['rattled'],
        'joltik': ['swarm'],
        'shroomish': ['effect spore', 'quick feet'],
        'pidgeotto': ['big pecks'],
        'karrablast': ['swarm']
    };
    var valid = true;
    for (var i = 0; i < 6; ++i) {
        var ability = sys.ability(sys.teamPokeAbility(src, i));
        var lability = ability.toLowerCase();
        var poke = sys.pokemon(sys.teamPoke(src, i));
        var lpoke = poke.toLowerCase();
        if (lpoke in bannedAbilities && bannedAbilities[lpoke].indexOf(lability) != -1) {
            checkbot.sendMessage(src, "" + poke + " is not allowed to have ability " + ability + " in this tier. Please change it in Teambuilder (You are now in Challenge Cup).")
            valid = false;
        }
    }
    if (!valid) {
        sys.changeTier(src, "Challenge Cup")
        sys.stopEvent();
    }
}
,

advance200Check: function(src, tier){
    if (!tier) tier = sys.tier(src);
    if (tier != "Adv 200") return;

    if (typeof advance200Banlist === 'undefined') {
        var pokes = {
        "Sceptile": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Thunderpunch", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Counter", "Seismic Toss", "Mimic", "Substitute"],
        "Torchic": ["Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide"],
        "Combusken": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Blaziken": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Mudkip": ["Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Defense Curl"],
        "Marshtomp": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl"],
        "Swampert": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl"],
        "Poochyena": ["Psych Up", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Body Slam", "Double-edge", "Counter", "Mimic", "Substitute"],
        "Mightyena": ["Psych Up", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Body Slam", "Double-edge", "Counter", "Mimic", "Substitute"],
        "Zigzagoon": ["Body Slam", "Double-edge", "Mimic", "Thunder Wave", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Linoone": ["Body Slam", "Double-edge", "Mimic", "Thunder Wave", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Wurmple":[],
        "Silcoon":[],
        "Cascoon":[],
        "Beautifly": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Dustox": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Lotad": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk"],

        "Lombre": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Dynamicpunch", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Ludicolo": ["Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Seedot": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl"],
        "Nuzleaf": ["Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Shiftry": ["Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Taillow": ["Double-edge", "Counter", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Swellow": ["Double-edge", "Counter", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Wingull": ["Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Pelipper": ["Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Ralts": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Kirlia": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Gardevoir": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Surskit": ["Double-edge", "Mimic", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Masquerain": ["Double-edge", "Mimic", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Shroomish": ["Swords Dance", "Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Sleep Talk"],
        "Breloom": ["Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Thunderpunch", "Fury Cutter"],
        "Slakoth": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Vigoroth": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Slaking": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Abra": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Kadabra": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Alakazam": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Nincada": ["Double-edge", "Mimic", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Ninjask": ["Double-edge", "Mimic", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Shedinja": ["Double-edge", "Mimic", "Dream Eater", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Whismur": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Loudred": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Exploud": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Makuhita": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Hariyama": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Goldeen": ["Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Swift", "Psybeam", "Haze"],
        "Seaking": ["Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Swift", "Psybeam", "Haze"],
        "Magikarp": [],
        "Gyarados": ["Body Slam", "Double-Edge", "Mimic", "Thunder Wave", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk"],
        "Azurill": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl"],
        "Marill": ["Mega Punch", "Mega Kick", "Body Slam", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Present", "Belly Drum", "Perish Song"],
        "Azumarill": ["Mega Punch", "Mega Kick", "Body Slam", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Present", "Belly Drum", "Perish Song"],
        "Geodude": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Mega Punch"],
        "Graveler": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Mega Punch"],
        "Golem": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Fury Cutter", "Mega Punch"],
        "Nosepass": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Skitty": ["Body Slam", "Mimic", "Dream Eater", "Thunder Wave", "Rollout", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Wish"],
        "Delcatty": ["Body Slam", "Mimic", "Dream Eater", "Thunder Wave", "Rollout", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Wish"],
        "Zubat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Golbat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Crobat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Tentacool": ["Swords Dance", "Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Aurora Beam", "Rapid Spin", "Haze"],
        "Tentacruel": ["Swords Dance", "Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Aurora Beam", "Rapid Spin", "Haze"],
        "Sableye": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Mawile": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch"],
        "Aron": ["Mimic", "Rock Slide", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl", "Fury Cutter"],
        "Lairon": ["Mimic", "Rock Slide", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl", "Fury Cutter"],
        "Aggron": ["Mega Punch", "Mega Kick", "Counter", "Seismic Toss", "Mimic", "Thunder Wave", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Machop": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Machoke": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Machamp": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Meditite": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Medicham": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Electrike": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk"],
        "Manectric": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk"],
        "Plusle": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Minun": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Magnemite": ["Double-Edge", "Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Magneton": ["Double-Edge", "Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Voltorb": ["Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Electrode": ["Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Volbeat": ["Body Slam", "Counter", "DynamicPunch", "Endure", "Ice Punch", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Illumise": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Ice Punch", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Oddish": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Gloom": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Vileplume": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Substitute", "Swagger", "Swords Dance"],
        "Bellossom": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Doduo": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Faint Attack", "Flail"],
        "Dodrio": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Faint Attack", "Flail"],
        "Roselia": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Swords Dance"],
        "Gulpin": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch", "Pain Split"],
        "Swalot": ["Counter", "Defense Curl", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch", "Pain Split"],
        "Carvanha": ["Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Sharpedo": ["Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Wailmer": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Wailord": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Numel": ["Body Slam", "Defense Curl", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Camerupt": ["Body Slam", "Defense Curl", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Slugma": ["Defense Curl", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Heat Wave"],
        "Magcargo": ["Defense Curl", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Heat Wave"],
        "Torkoal": ["Double-Edge", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Grimer": ["Body Slam", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch"],
        "Muk": ["Body Slam", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch"],
        "Koffing": ["Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Psybeam", "Pain Split"],
        "Weezing": ["Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Psybeam", "Pain Split"],
        "Spoink": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Swagger", "Swift"],
        "Grumpig": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Swagger", "Swift", "Thunderpunch"],
        "Sandshrew": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Sandslash": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Skarmory": ["Counter", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Whirlwind", "Curse"],
        "Spinda": ["Body Slam", "Counter", "Defense Curl", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Trapinch": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Vibrava": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Flygon": ["Body Slam", "Double-Edge", "Earth Power", "Endure", "Fire Punch", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Cacnea": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swords Dance", "ThunderPunch"],
        "Cacturne": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Low Kick", "Magic Coat", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swords Dance", "ThunderPunch"],
        "Swablu": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Altaria": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Zangoose": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Fire Punch", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Swords Dance", "Thunder Wave", "ThunderPunch"],
        "Seviper": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swift"],
        "Lunatone": ["Body Slam", "Defense Curl", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Solrock": ["Body Slam", "Defense Curl", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Barboach": ["Double-Edge", "Endure", "icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Substitute", "Swagger"],
        "Whiscash": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Substitute", "Swagger"],
        "Corphish": ["Body Slam", "Counter", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Crawdaunt": ["Body Slam", "Counter", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Baltoy": ["Double-Edge", "Dream Eater", "Endure", "Explosion", "Mimic", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Claydol": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Lileep": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Cradily": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Anorith": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Rapid Spin"],
        "Armaldo": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Rapid Spin"],
        "Igglybuff": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "Perish Song", "Present", "Wish"],
        "Jigglypuff": ["Body Slam", "Counter", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch", "Perish Song", "Present", "Wish"],
        "Wigglytuff": ["Body Slam", "Counter", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch", "Perish Song", "Present", "Wish"],
        "Feebas": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Milotic": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Castform": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave"],
        "Staryu": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Starmie": ["Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Kecleon": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Fire Punch", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Shuppet": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Banette": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Duskull": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Pain Split"],
        "Dusclops": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunderpunch", "Pain Split"],
        "Tropius": ["Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Chimecho": ["Defense Curl", "Endure", "Icy Wind", "Mimic", "Psych Up", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Absol": ["Body Slam", "Counter", "Dream Eater", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Swagger", "Swift", "Thunder Wave"],
        "Vulpix": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Spite"],
        "Ninetales": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Spite"],
        "Pichu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "Present", "Wish"],
        "Pikachu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Present", "Wish"],
        "Raichu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Present", "Wish"],
        "Psyduck": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Golduck": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Natu": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "Faint Attack", "Featherdance"],
        "Xatu": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave"],
        "Girafarig": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Beat Up", "Wish"],
        "Phanpy": ["Body Slam", "Counter", "Double-Edge", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Donphan": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Pinsir": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Flail"],
        "Heracross": ["Body Slam", "Counter", "Double-Edge", "Fury Cutter", "Mimic", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Bide", "Flail"],
        "Rhyhorn": ["Body Slam", "Counter", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Rhydon": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "fire Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "ThunderPunch"],
        "Snorunt": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Glalie": ["Body Slam", "Double-Edge", "Explosion", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Spheal": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute", "Swagger"],
        "Sealeo": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute"],
        "Walrein": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute"],
        "Clamperl": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Huntail": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Gorebyss": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Relicanth": ["Body Slam", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Corsola": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Icicle Spear"],
        "Chinchou": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Lanturn": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Luvdisc": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Horsea": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Seadra": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Kingdra": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Bagon": ["Body Slam", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Shelgon": ["Body Slam", "Defense Curl", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Salamence": ["Body Slam", "Defense Curl", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Beldum": [],
        "Metang": ["Body Slam", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fury Cutter", "Ice Punch", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swift", "Thunderpunch"],
        "Metagross": ["Body Slam", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fury Cutter", "Ice Punch", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swift", "Thunderpunch"],
        "Regirock": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"],
        "Regice": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"],
        "Registeel": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"]
        }
        advance200Banlist = {};
        for (var poke in pokes) {
            var pokeNum = sys.pokeNum(poke);
            if (!pokeNum) {
                sys.sendAll("Script Error: pokemon " + poke + " is unknown in 200 banlist", staffchannel)
                continue;
            }
            advance200Banlist[pokeNum] = [];
            for (var k = 0; k < pokes[poke].length; ++k) {
                var moveNum = sys.moveNum(pokes[poke][k]);
                if (!moveNum) {

                    sys.sendAll("Script Error: move " + pokes[poke][k] + " for pokemon " + poke + " is unknown in 200 banlist", staffchannel)
                    continue;
                }
                advance200Banlist[pokeNum].push(moveNum);
            }
        }

    } // end of building the banlist
    var valid = true;
    var debug = function(msg) { if (false && sys.name(src) == "zeroality") { sys.sendAll(msg, staffchannel); }};
    for (var i = 0; i < 6; ++i) {
        var poke = sys.teamPoke(src, i);
        debug("" + i + ". poke #" + poke + ": " + sys.pokemon(poke));
        if (poke != 0 && !advance200Banlist.hasOwnProperty(poke)) {
            sys.sendAll("Script Error: pokemon " + sys.pokemon(poke) + " should be banned in advance 200 in tiers.xml", staffchannel);
            checkbot.sendMessage(src, "Pokemon " + sys.pokemon(poke) + " is not allowed in advance 200!");
            valid = false;
            continue;
        }
        if (poke == 0) continue;
        debug("Banned moves for it:" + advance200Banlist[poke].join(", "));
        for (var j = 0; j < 4; ++j) {
            var move = sys.teamPokeMove(src, i, j);
            debug("" + j + ". move #" + move + ": " + sys.move(move));
            debug("is allowed: " + (advance200Banlist[poke].indexOf(move) >= 0 ? "no" : "yes"));
            if (advance200Banlist[poke].indexOf(move) >= 0) {
                checkbot.sendMessage(src, "Pokemon " + sys.pokemon(poke) + " is not allowed to have move " + sys.move(move) + " in advance 200!");
                valid = false;
            }
        }
    }
    if (!valid) {
       sys.changeTier(src, "Challenge Cup");
       sys.stopEvent();
    }
}

})
