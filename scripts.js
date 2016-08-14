// This is the official Pokemon Online Scripts
// These scripts will only work on 2.0.00 or newer.
/*jshint laxbreak:true,shadow:true,undef:true,evil:true,trailing:true,proto:true,withstmt:true*/
// You may change these variables as long as you keep the same type
var Config = {
    base_url: "https://raw.githubusercontent.com/po-devs/po-server-goodies/master/",
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
    safaribot: "Tauros",
    teamsbot: "Minun",
    // suspectvoting.js available, but not in use
    Plugins: ["mafia.js", "amoebagame.js", "tourstats.js", "trivia.js", "tours.js", "newtourstats.js", "auto_smute.js", "battlefactory.js", "hangman.js", "blackjack.js", "mafiastats.js", "mafiachecker.js", "safari.js", "youtube.js", "autoteams.js"],
    Mafia: {
        bot: "Murkrow",
        norepeat: 5,
        stats_file: "scriptdata/mafia_stats.json",
        max_name_length: 16,
        notPlayingMsg: "±Game: A game is in progress. Please type /join to join the next mafia game."
    },
    DreamWorldTiers: ["All Gen Hackmons", "ORAS Hackmons", "ORAS Balanced Hackmons", "No Preview OU", "No Preview Ubers", "DW LC", "DW UU", "DW LU", "Gen 5 1v1 Ubers", "Gen 5 1v1", "Challenge Cup", "CC 1v1", "DW Uber Triples", "No Preview OU Triples", "No Preview Uber Doubles", "No Preview OU Doubles", "Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST", "Monocolour", "Clear Skies DW"],
    canJoinStaffChannel: [],
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

var channel, contributors, mutes, mbans, safbans, smutes, detained, hmutes, mafiaSuperAdmins, hangmanAdmins, hangmanSuperAdmins, staffchannel, channelbot, normalbot, bot, mafiabot, kickbot, capsbot, checkbot, coinbot, countbot, tourneybot, battlebot, commandbot, querybot, rankingbot, hangbot, bfbot, scriptChecks, lastMemUpdate, bannedUrls, mafiachan, sachannel, tourchannel, rangebans, proxy_ips, mafiaAdmins, authStats, nameBans, chanNameBans, isSuperAdmin, cmp, key, battlesStopped, lineCount, maxPlayersOnline, pastebin_api_key, pastebin_user_key, getSeconds, getTimeString, sendChanMessage, sendChanAll, sendMainTour, VarsCreated, authChangingTeam, usingBannedWords, repeatingOneself, capsName, CAPSLOCKDAYALLOW, nameWarns, poScript, revchan, triviachan, watchchannel, lcmoves, hangmanchan, ipbans, battlesFought, lastCleared, blackjackchan, namesToWatch, allowedRangeNames, reverseTohjo, safaribot, safarichan, tourconfig, teamsbot;

var pokeDir = "db/pokes/";
var moveDir = "db/moves/6G/";
var abilityDir = "db/abilities/";
var itemDir = "db/items/";
sys.makeDir("scripts");
/* we need to make sure the scripts exist */
var commandfiles = ['commands.js', 'channelcommands.js','ownercommands.js', 'modcommands.js', 'usercommands.js', "admincommands.js"];
var deps = ['crc32.js', 'utilities.js', 'bot.js', 'memoryhash.js', 'tierchecks.js', "globalfunctions.js", "userfunctions.js", "channelfunctions.js", "channelmanager.js", "pokedex.js"].concat(commandfiles).concat(Config.Plugins);
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
[Config.dataDir+"mafia_stats.json", Config.dataDir+"suspectvoting.json", Config.dataDir+"mafiathemes/metadata.json", Config.dataDir+"channelData.json", Config.dataDir+"mutes.txt", Config.dataDir+"mbans.txt", Config.dataDir+"safbans.txt", Config.dataDir+"hmutes.txt", Config.dataDir+"smutes.txt", Config.dataDir+"rangebans.txt", Config.dataDir+"contributors.txt", Config.dataDir+"ipbans.txt", Config.dataDir+"namesToWatch.txt", Config.dataDir+"watchNamesLog.txt", Config.dataDir+"hangmanadmins.txt", Config.dataDir+"hangmansuperadmins.txt", Config.dataDir+"pastebin_user_key", Config.dataDir+"secretsmute.txt", Config.dataDir+"ipApi.txt", Config.dataDir + "notice.html", Config.dataDir + "rangewhitelist.txt", Config.dataDir + "idbans.txt", Config.dataDir+"league.json"].forEach(cleanFile);

var autosmute = sys.getFileContent(Config.dataDir+"secretsmute.txt").split(':::');
var crc32 = require('crc32.js').crc32;
var MemoryHash = require('memoryhash.js').MemoryHash;
var POChannelManager = require('channelmanager.js').POChannelManager;
var POChannel = require('channelfunctions.js').POChannel;
var POUser = require('userfunctions.js').POUser;
var POGlobal = require('globalfunctions.js').POGlobal;
delete require.cache['tierchecks.js'];
var tier_checker = require('tierchecks.js');
delete require.cache['pokedex.js'];
var pokedex = require('pokedex.js');

// declare prototypes
Object.defineProperty(Array.prototype, "contains", {
    configurable: true,
    enumerable: false,
    value: function (value) {
        return this.indexOf(value) > -1;
    }
});
Object.defineProperty(Array.prototype, "random", {
    configurable: true,
    enumerable: false,
    value: function () {
        return this[sys.rand(0, this.length)];
    }
});
Object.defineProperty(Array.prototype, "shuffle", {
    configurable: true,
    enumerable: false,
    value: function () {
        for (var i = this.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = this[i];
            this[i] = this[j];
            this[j] = temp;
        }
        return this;
    }
});
/* stolen from here: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format */
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};
String.prototype.htmlEscape = function () {
    return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
String.prototype.htmlStrip = function () {
    return this.replace(/(<([^>]+)>)/gi, "");
};
String.prototype.toCorrectCase = function() {
    if (isNaN(this) && sys.id(this) !== undefined) {
        return sys.name(sys.id(this));
    } else {
        return this;
    }
};

var utilities = require('utilities.js');
var isNonNegative = utilities.is_non_negative;
var Lazy = utilities.Lazy;
var nonFlashing = utilities.non_flashing;
var getSeconds = utilities.getSeconds;
var getTimeString = utilities.getTimeString;
var is_command = utilities.is_command;

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

/*function updateNotice(silent) {
    var url = Config.base_url + "notice.html";
    sys.webCall(url, function (resp){
        sys.writeToFile(Config.dataDir + "notice.html", resp);
    });
    sendNotice(silent);
}*/

function sendNotice(silent) {
    var notice = sys.getFileContent(Config.dataDir + "notice.html");
    if (notice && !silent) {
        ["Tohjo Falls", "Trivia", "Tournaments", "Indigo Plateau", "Victory Road", "Mafia", "Hangman", "Safari"].forEach(function(c) {
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
safaribot = new Bot(Config.safaribot);
teamsbot = new Bot(Config.teamsbot);

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
    if (date.getUTCMinutes() === 10 && date.getUTCSeconds() === 0 && sys.os() !== "windows") {
        /*sys.get_output("nc -z server.pokemon-online.eu 10508", function callback(exit_code) {
            if (exit_code !== 0) {
                sys.sendAll("±NetCat: Cannot reach Webclient Proxy - it may be down.", sys.channelId("Indigo Plateau"));
            }
        }, function errback(error) {
                sys.sendAll("±NetCat: Cannot reach Webclient Proxy - it may be down: " + error, sys.channelId("Indigo Plateau"));
        });*/
        clearTeamFiles();
    }
    if (date.getUTCHours() % 3 === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
        sendNotice();
    }
    if (date.getUTCHours() % 1 === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
        print("CURRENT SERVER TIME: " + date.toUTCString()); //helps when looking through logs
    }
    // Reset stats monthly
    var JSONP_FILE = "usage_stats/formatted/stats.jsonp";
    if (lastCleared != date.getUTCMonth()) {
        lastCleared = date.getUTCMonth();
        battlesFought = 0;
        sys.saveVal("Stats/BattlesFought", 0);
        sys.saveVal("Stats/LastCleared", lastCleared);
        sys.saveVal("Stats/MafiaGamesPlayed", 0);
        sys.saveVal("Stats/TriviaGamesPlayed", 0);
        sys.saveVal("Stats/HangmanGamesPlayed", 0);
    }
    if (date - lastStatUpdate > 60) {
        lastStatUpdate = date;
        // QtScript is able to JSON.stringify dates
        var stats = {
            lastUpdate: date,
            usercount: sys.playerIds().filter(sys.loggedIn).length,
            battlesFought: battlesFought,
            mafiaPlayed: +sys.getVal("Stats/MafiaGamesPlayed"),
            triviaPlayed: +sys.getVal("Stats/TriviaGamesPlayed"),
            hangmanPlayed: + sys.getVal("Stats/HangmanGamesPlayed")
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
    script.superAdmins = ["Mahnmut"];
    script.rules = {
        "1": {
            "english": [
                "1. Pokémon Online is an international server:",
                "- Respect other peoples' cultures and do not demand they speak English. Everyone is welcome at Pokemon Online, as long as they follow the rules. However, if your username is in a language that reads text from right-to-left, we ask that you do not speak in the main chat, as this can reverse the entire chatroom. We may mute you or ask you to change your name if this happens."
            ],
            "spanish": [
                "1. Pokémon Online es un servidor internacional:",
                "- Respeta las culturas ajenas y no demandes que hablen inglés o algun otro idioma que entiendas. Todos estan bienvenidos en Pokémon Online, siempre y cuando sigan las reglas, si tu nombre de usuario esta en un idioma que se lee de derecha a izquierda, te sugerimos que no hables en el chat, ya que esto puede revertir todo el cuadro de chat. Te silenciaremos o te pediremos que cambies de nombre si esto llega a pasar."
            ],
            "chinese": [
                "1.PO官服是一个国际服务器:",
                "尊重其他民族的文化，不要歧视其他的语种。PO欢迎每一个遵守相关规定的玩家，无论他们来自何方，说着何种语言。但请注意，如果您的语言系统是自右向左读取文本，我们要求您不要在主频道聊天，因为这可能使整个聊天室混乱。如果发生这种情况，我们可能会对您禁言或要求您改变您的名字。"
            ],
            "french": [
                "1. Pokémon est un serveur international:",
                "Il faut respecter la culture des autres et ne pas demander s'ils parlent Anglais. Tout le monde est bienvenue à Pokémon Online, tant que vous respectez les règles. Cependant, si votre nom d'utilisateur est un nom qui se lit de droite à gauche, on vous demandera de le changer parce qu'il amène la discussion entière à se renverser. On peut vous rendre muet ou vous demander de changer de nom si cela arrive."
            ]
        },
        "2": {
            "english": [
                "2. No advertising, excessive messages or caps, or inappropriate/obscene content:",
                "- Do not post links unless they are to notable sites (Youtube, Smogon, Serebii, etc). Do not monopolize the chat with large amounts of messages, or short ones in rapid succession. You may advertise private channels provided you do not do it excessively. Posting pornographic or obscene content is punishable with a ban. Posting social media (Twitter/Facebook/kik) accounts is also punishable."         
            ],
            "spanish": [
                "2. Nada de publicidad, mensajes excesivamente largos y sin sentido o abuso de mayusculas, nada de contenido inapropiado u obsceno:",
                "- No publiques ningun enlace a menos que haga referencia a sitios conocidos y seguros (Youtube, Smogon, Serebii, etc). No trates de invadir el chat con mensajes extremadamente largos, o con mensajes cortos publicados de forma muy rápida. Puedes publicar tu canal siempre y cuando no lo hagas en exceso. Publicar contenido pornográfico o contenido obsceno se castiga con un ban. Publicar páginas de redes sociales que no sean de Pokémon Online (Facebook/Twitter/Kik) también esta prohibido y se castiga con un ban."               
            ],
            "chinese": [
                "2. 不要发送广告、冗余信息、大写刷屏、淫秽信息:",
                "不要在主聊天频道内发送链接，除非他们来自著名的网站（YouTube，Smogon，Serebii等）。不要试图以自我为中心，左右整个聊天室的话题；不要发送无意义的信息如连续发送省略号和无规则无意义的一串字母（测试网络情使用一个小写字母t 不要使用多个ttt也不是大写的T）你可以适当的宣传PO的某个频道，让大家参与其中，但要有度。发布色情或淫秽内容的将会被封禁。发布社交媒体账号/服务器地址（微博/ Facebook/QQ群号等/其他PO服务器地址 ）也将受到处理。"
            ],
            "french": [
                "2. Pas de publicité , des messages ou des lettres capitales excessives, ou du contenu inapproprié/obscène:",
                "Ne pas publier des liens à moins qu'ils soient notables (Youtube, Smogon, Serebii, etc). Ne pas prendre le monopole de la discussion avec beaucoup de messages, ou de courts messages rapidement. Vous pouvez faire la publicité à votre chaîne tant que ce n'est pas excessif. Tout contenu pornographique ou obscène peut vous faire banir. Partager des réseaux sociaux (Twitter/Facebook/kik) est également interdit."
            ]
        },
        "3": {
            "english": [
                "3. Use Find Battle, or join tournaments instead of asking in the main chat:",
                "- The official channels on Pokemon Online have too much activity to allow battle requests in the chat. Use Find Battle or go join the tournaments channel and participate. The only exception is if you are unable to find a battle for a low-played tier, then asking once every 5 minutes or so is acceptable."
            ],
            "spanish": [
                "3. Usa el botón de buscar batalla, unete a los torneos en lugar de estar constantemente solicitando batallas en el chat:",
                "- Los canales oficiales en Pokémon Online tienen demasiada actividad como para permitir que cualquiera solicite batallas en el chat. Utiliza el boton de buscar batallas o únete a los torneos en el canal oficial de torneos. La única excepción es si no eres capaz de encontrar una batalla a través del buscador debido a estar en una categoria poco jugada, entonces se te permite solicitar batallas una vez cada 5 minutos, y de forma educada."
            ],
            "chinese": [
                "3. 使用寻找对战按钮，或加入Tournaments频道的比赛，而不要问在主聊天频道求战:",
                "出于PO主聊天频道的聊天内容繁杂，求战不被允许；请使用find battle寻找对战按钮，或者参与Tournaments频道的比赛；不过，如果你在一个没什么人的分级（如LC）可以允许每隔5分钟左右求战一下。"
            ],
            "french": [
                "3. Utilisez Find Battle, ou rejoignez les tournois au lieu de demander dans la discussion:",
                "Les chaînes officielles de Pokémon Online ont beaucoup d'activités pour autoriser de faire ces demandes dans la discussion. Utilisez Find Battle ou rejoignez la chaîne des tournois et participer. La seule exception est si vous jouez un tiers peu joué, à ce moment là demander chaque 5 minutes est acceptable."
            ]
        },
        "4": {
            "english": [
                "4. Do not ask for authority:",
                "- By asking, you may have eliminated your chances of becoming one in the future. If you are genuinely interested in becoming a staff member, a good way to get noticed is to become an active member of the community. Engaging others in intelligent chats and offering to help with graphics, programming, or tiering (among others) is a good way to get noticed. Repeated harrasment for auth will be punished."
            ],
            "spanish": [
                "4. No solicites autoridad:",
                "- Al preguntar, es posible que hayas eliminado completamente tus oportunidades de ser una autoridad en el futuro. Si estas interesado en volverte parte del Staff, entonces una buena forma de empezar es ser un miembro activo en la comunidad. Motiva a otros a tener conversaciones inteligentes o productivas, ofrece tu ayuda si tienes habilidad con el arte, programación, las tiers (entre otras cosas) es lo que puedes hacer para que te tomemos en cuenta. El constante acoso a las autoridades para pedir ser tal será sancionado."
            ],
            "chinese": [
                "4.不要索取权限:",
                "向管理索取权限很可能将让你失去未来成为权限的机会。如果你对成为一名PO管理真正感兴趣的话，最好的方式是积极的帮助他人，让管理们注意到你对他人的帮助。活跃聊天气氛、帮助PO客户端的编程或者参与平衡分级的讨论等等，是得到注意的好方法。不断地索要权限将会被处罚。"
            ],
            "french": [
                "4. Ne pas demander à recevoir l'autorité:",
                "En demandant, vous perdez vos chances d'en devenir un dans le future. Si vous êtes vraiment interessés de faire parti de l'équipe, une bonne façon de se faire remarquer est devenir un membre actif dans la communauté. Lancer des discussions intelligentes et offrir des aides graphiques, de programmation, ou encore nous aider à rendre nos tiers meilleurs est une bonne façon de se faire remarquer. L'harcèlement continue aux autorités sera punie."
            ]
        },
        "5": {
            "english": [
                "5. No trolling, flaming, or harassing other players. Do not complain about hax in the chat, beyond a one line comment:",
                "- Inciting responses with inflammatory comments, using verbal abuse against other players, or spamming them via chat/PM/challenges will not be tolerated. Harassing other players by constantly aggravating them or revealing personal information will be severely punished. A one line comment regarding hax after a loss to vent is fine, but excessive bemoaning is not acceptable. Excessive vulgarity will not be tolerated. Wasting the time of the authority will also result in punishment."
            ],
            "spanish": [
                "5. Nada de Trollear, insultar o acosar a otros jugadores. No te quejes constantemente del hax en el chat, no más allá de una linea:",
                "- Incitar a otros jugadores con comentarios provocativos, usar el abuso verbal contra otros jugadores, o spammearlos a traves del chat/Mensajes Privados/Solicitudes de batalla no será tolerado. Acosar a otros jugadores al revelar su información personal será severamente penalizado. Una linea de comentario concerniente al hax luego de perder para deshagoarte esta bien, pero las quejas constantes no son aceptadas. La vulgaridad excesiva tampoco sera tolerada. Desperdiciar el tiempo de las autoridades también resultará en una sanción."
            ],
            "chinese": [
                "5.禁止钓鱼，恶言相向，或骚扰其他玩家。在主聊天室抱怨被Hax时，最多不要超出一句话:",
                "通过煽动性的言语激起他人的回复、对他人进行辱骂等人身攻击、持续对他人发出不受欢迎的评论/挑战/私信都是禁止的行为。持续骚扰、恶意激怒、甚至人肉其他玩家将遭到严厉惩处；在被因为脸黑被hax以后发送一句抱怨的话是可以理解的，但是持续不断的抱怨和过分粗鲁的行为是不被允许的；恶意浪费管理的时间同样会受到处理。"
            ],
            "french": [
                "5. Ne pas troller, provoquer ou harceler les autres joueurs. Ne vous plaignez pas dans la discussion générale, à part une ligne:",
                "Les réponses provocatives, les insultes à l'égard d'autres joueurs, ou le spammage par discussion/message privé/challenges ne sera pas accepter. Harceler les autres de façon exagérée ou réveler des informations personelles sera sévèrement puni. Une ligne pour se plaindre de la malchance est passable, mais ne pas en abuser. Trop de vulgarités ne sera pas permis. Ne faites pas perdre le temps des autorités."
            ]
        },
        "6": {
            "english": [
                "6. Do not misuse the server nor its guidelines:",
                "- Stealing accounts or channels is prohibited. Any attempt to undermine the legitimacy of ladder rankings or tournaments (server or forum) counts as misuse. DDoS and other \"cyber attacks\" will not be tolerated. Evading and trying to find loop-holes for malicious intent both violate the guidelines. All ban appeals should be made directly in the Disciplinary Committee on the forums. Use of the server as a dating service or other various web services that it is not may also count as abuse."
            ],
            "spanish": [
                "6. No hagas un uso inadecuado de las reglas o las normativas:",
                "- Robar cuentas o canales esta prohibido. Cualquier intento de alterar los rankings del servidor en general o los rankings del torneo, o los del foro también cuenta como un uso inadecuado. DDoS o cualquier otro \"ataque cibernético\" no será tolerado. Evadir las sanciones y tratar de buscar cualquier hueco o excusa dentro de las mismas reglas para fines maliciosos también violan las normativas. Todas las apelaciones para remover un ban se deben hacer directamente en el Comité Disciplinario (Disciplinary Committee) en el foro. El uso del servidor como un sitio de citas o cualquier otro servicio web también cuenta como un abuso de las reglas."
            ],
            "chinese": [
                "6. 其他常规的禁止事项:",
                "严禁盗取他人账号和频道；禁止任何试图通过不公平的手段进行ladder刷分或赚取Tournaments积分；DDoS以及其他任何对服务器的网络攻击都将遭到严惩；通过改变IP等手段避开封禁、禁言将遭到进一步处罚；所有对于封禁的申诉请直接反馈到论坛专门的帖子里；将PO视作约会工具或是其他并非PO本意的功能也是被禁止的。"
            ],
            "french": [
                "6. Ne pas mal utiliser le serveur ni ses règles:",
                "Voler des comptes ou des chaînes est interdit. Toute tentatives de devier la légitimité du rang ou des tournois (serveur et forum) compte comme mal utilisation. DDos et autres \"cyber attaques\" ne sont pas tolérées. Ne pas contourner un ban et ne pas tenter de trouver des échapatoires pour mal utiliser et violer les règles. Pour demander à être débanni, vous devez le faire sur les forums dans l'espace Disciplinary Committee. Le serveur n'est pas un site de rencontre ou autre services alors ne pas abuser de ceci."
            ]
        }
    };
    lastMemUpdate = 0;
    bannedUrls = [];
    battlesFought = +sys.getVal("Stats/BattlesFought");
    lastCleared = +sys.getVal("Stats/LastCleared");

    mafiachan = SESSION.global().channelManager.createPermChannel("Mafia", "Use /help to get started!");
    staffchannel = SESSION.global().channelManager.createPermChannel("Indigo Plateau", "Welcome to the main staff channel! Discuss things that other users shouldn't hear here!");
    sachannel = SESSION.global().channelManager.createPermChannel("Victory Road", "Welcome to all channel staff!");
    tourchannel = SESSION.global().channelManager.createPermChannel("Tournaments", 'Useful commands are "/join" (to join a tournament), "/unjoin" (to leave a tournament), "/viewround" (to view the status of matches) and "/megausers" (for a list of users who manage tournaments). Please read the full Tournament Guidelines: http://pokemon-online.eu/forums/showthread.php?2079-Tour-Rules');
    watchchannel = SESSION.global().channelManager.createPermChannel("Watch", "Alerts are displayed here.");
    triviachan = SESSION.global().channelManager.createPermChannel("Trivia", "Play trivia here!");
    revchan = SESSION.global().channelManager.createPermChannel("TrivReview", "For Trivia Admins to review questions");
    //mafiarev = SESSION.global().channelManager.createPermChannel("Mafia Review", "For Mafia Admins to review themes");
    hangmanchan = SESSION.global().channelManager.createPermChannel("Hangman", "Type /help to see how to play!");
    blackjackchan = SESSION.global().channelManager.createPermChannel("Blackjack", "Play Blackjack here!");
    safarichan = SESSION.global().channelManager.createPermChannel("Safari", "Type /help to see how to play!");

    /* restore mutes, smutes, mafiabans, rangebans, megausers */
    script.mutes = new MemoryHash(Config.dataDir+"mutes.txt");
    script.mbans = new MemoryHash(Config.dataDir+"mbans.txt");
    script.smutes = new MemoryHash(Config.dataDir+"smutes.txt");
    script.rangebans = new MemoryHash(Config.dataDir+"rangebans.txt");
    script.contributors = new MemoryHash(Config.dataDir+"contributors.txt");
    script.mafiaAdmins = new MemoryHash(Config.dataDir+"mafiaadmins.txt");
    script.mafiaSuperAdmins = new MemoryHash(Config.dataDir+"mafiasuperadmins.txt");
    script.hangmanAdmins = new MemoryHash(Config.dataDir+"hangmanadmins.txt");
    script.hangmanSuperAdmins = new MemoryHash(Config.dataDir+"hangmansuperadmins.txt");
    script.safbans = new MemoryHash(Config.dataDir+"safbans.txt");
    script.ipbans = new MemoryHash(Config.dataDir+"ipbans.txt");
    script.detained = new MemoryHash(Config.dataDir+"detained.txt");
    script.hmutes = new MemoryHash(Config.dataDir+"hmutes.txt");
    script.namesToWatch = new MemoryHash(Config.dataDir+"namesToWatch.txt");
    script.namesToUnban = new MemoryHash(Config.dataDir+"namesToCookieUnban.txt");
    script.idBans = new MemoryHash(Config.dataDir+"idbans.txt");
    try {
        script.league = JSON.parse(sys.read(Config.dataDir+"league.json")).league;
    } catch (e) {
        script.league = {};
    }

    var announceChan = (typeof staffchannel == "number") ? staffchannel : 0;
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

    if (typeof script.authStats == 'undefined')
        script.authStats = {};

    if (typeof nameBans == 'undefined') {
        script.refreshNamebans();
    }
    if (typeof nameWarns == 'undefined') {
        nameWarns = [];
        try {
            var serialized = JSON.parse(sys.getFileContent("scriptdata/nameWarns.json"));
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

    if (typeof VarsCreated != 'undefined')
        return;

    key = function(a,b) {
        return a + "*" + sys.ip(b);
    };

    script.saveKey = function(thing, id, val) {
        sys.saveVal(key(thing,id), val);
    };

    script.getKey = function(thing, id) {
        var temp = key(thing,id);
        if (temp) {
            return sys.getVal(temp);
        } else {
            return false;
        }
    };

    script.cmp = function(a, b) {
        return a.toLowerCase() == b.toLowerCase();
    };
    //script.isMafiaAdmin = require('mafia.js').isMafiaAdmin;
    //script.isMafiaSuperAdmin = require('mafia.js').isMafiaSuperAdmin;
    //script.isSafariAdmin = require('safari.js').isChannelAdmin;
    isSuperAdmin = function(id) {
        if (typeof script.superAdmins != "object" || script.superAdmins.length === undefined) return false;
        if (sys.auth(id) != 2) return false;
        var name = sys.name(id);
        for (var i = 0; i < script.superAdmins.length; ++i) {
            if (script.cmp(name, script.superAdmins[i]))
                return true;
        }
        return false;
    };

    script.battlesStopped = false;

    maxPlayersOnline = 0;

    lineCount = 0;

    if (typeof script.chanNameBans == 'undefined') {
        script.chanNameBans = [];
        try {
            var serialized = JSON.parse(sys.getFileContent(Config.dataDir+"chanNameBans.json"));
            for (var i = 0; i < serialized.chanNameBans.length; ++i) {
                script.chanNameBans.push(new RegExp(serialized.chanNameBans[i], "i"));
            }
        } catch (e) {
            // ignore
        }
    }
    try {
        pastebin_api_key = sys.getFileContent(Config.dataDir+"pastebin_api_key").replace("\n", "");
        pastebin_user_key = sys.getFileContent(Config.dataDir+"pastebin_user_key").replace("\n", "");
    } catch(e) {
        normalbot.sendAll("Couldn't load api keys: " + e, staffchannel);
    }

    sendMainTour = function(message) {
        sys.sendAll(message, 0);
        sys.sendAll(message, tourchannel);
    };

    script.allowedRangeNames = sys.getFileContent(Config.dataDir + "rangewhitelist.txt").split("\n");
    callplugins("init");

    VarsCreated = true;
}, /* end of init */


issueBan : function(type, src, tar, commandData, maxTime) {
        var memoryhash = {"mute": script.mutes, "mban": script.mbans, "smute": script.smutes, "hmute": script.hmutes, "safban": script.safbans}[type];
        var banbot;
        if (type == "mban") {
            banbot = mafiabot;
        }
        else if (type == "hmute") {
            banbot = hangbot;
        }
        else if (type == "safban") {
            banbot = safaribot;
        }
        else {
            banbot = normalbot;
        }
        var verb = {"mute": "muted", "mban": "banned from Mafia", "smute": "secretly muted", "hmute": "banned from Hangman", "safban": "banned from Safari"}[type];
        var nomi = {"mute": "mute", "mban": "mafia ban", "smute": "secret mute", "hmute": "hangman ban", "safban": "safari ban"}[type];
        var sendAll =  {
            "smute": function(line) {
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
            "hmute" : function(line) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, hangmanchan);
                banbot.sendAll(line, sachannel);
            },
            "safban" : function(line) {
                banbot.sendAll(line, safarichan);
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, sachannel);
            }
        }[type];

        var expires = 0;
        var defaultTime = {"mute": "1d", "mban": "1d", "smute": "1d", "hmute": "1d", "safban": "1d"}[type];
        var reason = "";
        var timeString = "";
        var data = commandData;
        var ip;
        var i = -1, j = -1, time = "";
        if (data !== undefined) {
            i = data.indexOf(":");
            j = data.lastIndexOf(":");
            time = data.substring(j + 1, data.length);
        }
        if (tar === undefined) {
            if (i !== -1) {
                commandData = data.substring(0, i);
                tar = sys.id(commandData);
                if (time === "" || isNaN(time.replace(/s\s|m\s|h\s|d\s|w\s|s|m|h|d|w/gi, ""))) {
                    time = defaultTime;
                    reason = data.slice(i + 1);
                } else if (i !== j) {
                    reason = data.substring(i + 1, j);
                }
            }
        }

        var secs = getSeconds(time !== "" ? time : defaultTime);
        // limit it!
        if (typeof maxTime == "number") secs = (secs > maxTime || secs === 0 || isNaN(secs)) ? maxTime : secs;
        if (secs > 0) {
            timeString = getTimeString(secs);
            expires = secs + parseInt(sys.time(), 10);
        }
        if (reason === "" && sys.auth(src) < 3) {
           banbot.sendMessage(src, "You need to give a reason for the " + nomi + "!", channel);
           return;
        }
        var tarip = tar !== undefined ? sys.ip(tar) : sys.dbIp(commandData);
        if (tarip === undefined) {
            banbot.sendMessage(src, "Couldn't find " + commandData, channel);
            return;
        }
        var maxAuth = (tar ? sys.auth(tar) : sys.maxAuth(tarip));
        if ((maxAuth>=sys.auth(src) && maxAuth > 0) || (type === "smute" && script.getMaxAuth(tar) > 0))  {
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
        sendAll((active ? nonFlashing(sys.name(src)) + " changed " + commandData + "'s " + nomi + " time to " + (timeString === "" ? "forever!" : timeString + " from now!") : commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + (timeString === "" ? "" : " for ") + timeString + "!") + (reason.length > 0 ? " [Reason: " + reason + "]" : "") + " [Channel: "+sys.channel(channel) + "]");

        sys.playerIds().forEach(function(id) {
            if (sys.loggedIn(id) && sys.ip(id) === tarip)
                SESSION.users(id).activate(type, sys.name(src), expires, reason, true);
        });
        if (!sys.loggedIn(tar)) {
            memoryhash.add(tarip, sys.time() + ":" + sys.name(src) + ":" + expires + ":" + commandData + ":" + reason);
        }

        var authority= sys.name(src).toLowerCase();
        script.authStats[authority] =  script.authStats[authority] || {};
        script.authStats[authority]["latest" + type] = [commandData, parseInt(sys.time(), 10)];
},

unban: function(type, src, tar, commandData) {
    var memoryhash = {"mute": script.mutes, "mban": script.mbans, "smute": script.smutes, "hmute": script.hmutes, "safban": script.safbans}[type];
    var banbot;
        if (type == "mban") {
            banbot = mafiabot;
        }
        else if (type == "hmute") {
            banbot = hangbot;
        }
        else if (type == "safban") {
            banbot = safaribot;
        }
        else {
            banbot = normalbot;
        }
    var verb = {"mute": "unmuted", "mban": "unbanned from Mafia", "smute": "secretly unmuted", "hmute": "unbanned from Hangman", "safban": "unbanned from Safari"}[type];
    var nomi = {"mute": "unmute", "mban": "mafia unban", "smute": "secret unmute", "hmute": "hangman unban", "safban": "safari unban"}[type];
    var past = {"mute": "muted", "mban": "mafia banned", "smute": "secretly muted", "hmute": "hangman banned", "safban": "safari banned"}[type];
    var sendAll =  {
        "smute": function(line) {
            banbot.sendAll(line, staffchannel);
        },
        "mban": function(line, ip) {
            if (ip) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, sachannel);
            } else {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, mafiachan);
                banbot.sendAll(line, sachannel);
            }
        },
        "mute": function(line, ip) {
            if (ip) {
                banbot.sendAll(line, staffchannel);
            } else {
                banbot.sendAll(line);
            }
        },
        "hmute" : function(line, ip) {
            if (ip) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, sachannel);
            } else {
                banbot.sendAll(line, hangmanchan);
                banbot.sendAll(line, sachannel);
                banbot.sendAll(line, staffchannel);
            }
        },
        "safban" : function(line, ip) {
            if (ip) {
                banbot.sendAll(line, staffchannel);
                banbot.sendAll(line, sachannel);
            } else {
                banbot.sendAll(line, safarichan);
                banbot.sendAll(line, sachannel);
                banbot.sendAll(line, staffchannel);
            }
        }
    }[type];
    if (tar === undefined) {
        if (memoryhash.get(commandData)) {
            sendAll("IP address " + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + "!", true);
            memoryhash.remove(commandData);
            return;
        }
        var ip = sys.dbIp(commandData);
        if(ip !== undefined && memoryhash.get(ip)) {
            sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + "!");
            memoryhash.remove(ip);
            return;
        }
        banbot.sendMessage(src, "He/she's not " + past, channel);
        return;
    }
    if (!SESSION.users(sys.id(commandData))[type].active) {
        banbot.sendMessage(src, "He/she's not " + past, channel);
        return;
    }
    if(SESSION.users(src)[type].active && tar == src) {
       banbot.sendMessage(src, "You may not " + nomi + " yourself!", channel);
       return;
    }
    SESSION.users(tar).un(type);
    sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + "!");
},

banList: function (src, command, commandData) {
    var mh;
    var name;
    if (command == "mutes" || command == "mutelist") {
        mh = script.mutes;
        name = "Muted list";
    } else if (command == "smutelist") {
        mh = script.smutes;
        name = "Secretly muted list";
    } else if (command == "mafiabans") {
        mh = script.mbans;
        name = "Mafiabans";
    } else if (command == "hangmanmutes" || command == "hangmanbans") {
        mh = script.hmutes;
        name = "Hangman Bans";
    } else if (command == "safaribans") {
        mh = script.safbans;
        name = "Safari Bans";
    }

    var width=5;
    var max_message_length = 30000;
    var tmp = [];
    var t = parseInt(sys.time(), 10);
    var toDelete = [];
    for (var ip in mh.hash) {
        if (mh.hash.hasOwnProperty(ip)) {
            var values = mh.hash[ip].split(":");
            var banTime = 0;
            var by = "";
            var expires = 0;
            var banned_name;
            var reason = "";
            if (values.length >= 5) {
                banTime = parseInt(values[0], 10);
                by = values[1];
                expires = parseInt(values[2], 10);
                banned_name = values[3];
                reason = values.slice(4);
                if (expires !== 0 && expires < t) {
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
                banTime = parseInt(values[0], 10);
            }
            if(typeof commandData != 'undefined' && (!banned_name || banned_name.toLowerCase().indexOf(commandData.toLowerCase()) == -1))
                continue;
            tmp.push([ip, banned_name, by, (banTime === 0 ? "unknown" : getTimeString(t-banTime)), (expires === 0 ? "never" : getTimeString(expires-t)), utilities.html_escape(reason)]);
        }
    }
    for (var k = 0; k < toDelete.length; ++k)
       delete mh.hash[toDelete[k]];
    if (toDelete.length > 0)
        mh.save();
    tmp.sort(function(a,b) { return a[3] - b[3];});
    // generate HTML
    var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
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
    if (send_rows > 0) {
        sys.sendHtmlMessage(src, table, channel);
    } else {
        normalbot.sendMessage(src, "There are no active " + name + ".", channel);
    }
    return;
},

refreshNamebans: function() {
    nameBans = [];
    try {
        var serialized = JSON.parse(sys.getFileContent("scriptdata/nameBans.json"));
        for (var i = 0; i < serialized.nameBans.length; ++i) {
            nameBans.push(new RegExp(serialized.nameBans[i], "i"));
        }
    } catch (e) {
        // ignore
    }
},

importable : function(id, team, compactible, extras) {
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
    if (extras) {
        ret.push("Gen: {0}, Subgen: {1}".format(sys.gen(id, team), sys.subgen(id, team)));
    }
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

isChannelStaff : function(src) {
    return callplugins('isChannelAdmin', src);
},

isOfficialChan : function (chanid) {
    var officialchans = [0, tourchannel, mafiachan, triviachan, hangmanchan, safarichan];
    if (officialchans.indexOf(chanid) > -1)
        return true;
    else
        return false;
},

isPOChannel : function (chanid) {
    var pochans = [0, tourchannel, mafiachan, triviachan, hangmanchan, safarichan, staffchannel, revchan, sachannel, watchchannel, blackjackchan];
    if (pochans.indexOf(chanid) > -1)
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

    if (sys.auth(src) < 3 && poChannel.canJoin(src) == "banned") {
        if (poChannel.banned.hasOwnProperty(sys.name(src).toLowerCase())) {
            var auth = poChannel.banned[sys.name(src).toLowerCase()].auth,
                expiry = poChannel.banned[sys.name(src).toLowerCase()].expiry,
                reason = poChannel.banned[sys.name(src).toLowerCase()].reason;
            if (isNaN(expiry)) {
                expiry = "forever";
            } else {
                expiry = "for " + getTimeString(expiry - parseInt(sys.time(), 10), 10);
            }
            channelbot.sendMessage(src, "You are banned from this channel " + expiry + " by " + auth + "." + (reason === "N/A" ? "" : " [Reason: " + reason + "]"));
        } else {
            channelbot.sendMessage(src, "You are banned from this channel.");
        }
        sys.stopEvent();
        return;
    }
    if (this.isChannelStaff(src) && sachannel === channel) { // Allows game staff to enter VR without member
        return;
    }
    if (channel === staffchannel && script.isContrib(src) && !sys.dbRegistered(sys.name(src))) {
        var contribName = utilities.getCorrectPropName(sys.name(src), script.contributors.hash);
        normalbot.sendAll(contribName + " was removed from contributors due to their alt being unregistered. [Contributions: " + script.contributors.get(contribName) + "]", staffchannel);
        sys.sendMessage(src, "±Guard: Sorry, access to that place is restricted!");
        script.contributors.remove(contribName);
        sys.stopEvent();
        return;
    }
    if (poChannel.canJoin(src) == "allowed") {
        return;
    }
    if (poChannel.inviteonly > sys.auth(src)) {
        sys.sendMessage(src, "±Guard: Sorry, but this channel is for higher authority!");
        sys.stopEvent();
        return;
    }
    if ((channel == staffchannel || channel == sachannel) && !this.canJoinStaffChannel(src)) {
        sys.sendMessage(src, "±Guard: Sorry, access to that place is restricted!");
        sys.stopEvent();
        return;
    }
    var channels = [mafiachan, hangmanchan, safarichan];
    var bans = ["mban", "hmute", "safban"];
    var type = ["Mafia", "Hangman", "Safari"];
    var found = false;
    for (var x = 0; x < bans.length; x++) {
        if (channel == channels[x]) {
            var hash = script[bans[x] + "s"].hash;
            for (var ip in hash) {
                found = script.cmp(hash[ip].split(":")[3], sys.name(src));
                if (found) {
                    break;
                }
            }
            if (poUser[bans[x]].active || found) {
                if (poUser.expired(bans[x])) {
                    poUser.un(bans[x]);
                    normalbot.sendMessage(src, "Your ban from " + type[x] + " expired.");
                } else {
                    var info = poUser[bans[x]];
                    sys.sendMessage(src, "±Guard: You are banned from " + type[x] + (info.by ? " by " + info.by : '')+". " + (info.expires > 0 ? "Ban expires in " + getTimeString(info.expires - parseInt(sys.time(), 10)) + ". " : '') + (info.reason ? "[Reason: " + info.reason + "]" : ''));
                    sys.stopEvent();
                    return;
                }
            }
        }
    }
    if (channel == watchchannel && sys.auth(src) < 1) {
        sys.sendMessage(src, "±Guard: Sorry, access to that place is restricted!");
        sys.stopEvent();
        return;
    }
}, /* end of beforeChannelJoin */

beforeChannelLeave: function(src, channel) {
    callplugins("beforeChannelLeave", src, channel);
}, /* end of beforeChannelLeave */

beforeChannelCreated : function(chan, name, src) {
    if (name == "x") { sys.stopEvent(); }
    if (src) {
        name = name.toLowerCase();
        for (var i = 0; i < script.chanNameBans.length; ++i) {
            var regexp = script.chanNameBans[i];
            if (regexp.test(name)) {
                sys.sendMessage(src, 'This kind of channel name is banned from the server. (Matching regexp: ' + regexp + ')');
                sys.stopEvent();
            }
        }
    }
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
        sys.sendMessage(player, "±" + Config.channelbot + ": use /topic <topic> to change the welcome message of this channel", chan);
    }
    if (SESSION.channels(chan).masters.length <= 0 && !this.isOfficialChan(chan)) {
        sys.sendMessage(player, "±" + Config.channelbot + ": This channel is unregistered. If you're looking to own this channel, type /register in order to prevent your channel from being stolen.", chan);
    }
    if (sys.aliases(sys.ip(player)).length < 2 && !sys.dbRegistered(sys.name(player)) && script.userGuides(sys.os(player)) && chan === 0) {
        var unsupported = sys.os(player) === "android" && sys.version(player) < 52;
        if (unsupported) {
            sys.sendMessage(player, "New to PO? Check out our user guides: " + script.userGuides(sys.os(player), unsupported) + "!", chan);
        }
        else {
            sys.sendHtmlMessage(player, "<font size=4><b>New to PO? Check out our user guides: " + script.userGuides(sys.os(player)) + "!</b></font>", chan);
        }
    }
    callplugins("afterChannelJoin", player, chan);
}, /* end of afterChannelJoin */

beforeChannelDestroyed : function(channel) {
    if (channel == tourchannel || (SESSION.channels(channel).perm) ) {
        sys.stopEvent();
        return;
    }
}, /* end of beforeChannelDestroyed */

beforePlayerBan : function(src, dest, dur) {
    normalbot.sendAll("Target: " + sys.name(dest) + ", IP: " + sys.ip(dest), staffchannel);
    var authname = sys.name(src).toLowerCase();
    script.authStats[authname] =  script.authStats[authname] || {};
    script.authStats[authname].latestBan = [sys.name(dest), parseInt(sys.time(), 10)];
    callplugins("onBan", src, dest);
},

beforePlayerKick:function(src, dest){
    var authname = sys.name(src).toLowerCase();
    script.authStats[authname] =  script.authStats[authname] || {};
    script.authStats[authname].latestKick = [sys.name(dest), parseInt(sys.time(), 10)];
},

afterNewMessage : function (message) {
    if (message == "Script Check: OK") {
        sys.sendAll("±ScriptCheck: Scripts were updated!", sys.channelId("Indigo Plateau"));
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
    for (var subip in script.rangebans.hash) {
        if (subip.length > 0 && ip.substr(0, subip.length) == subip) {
             return true;
        }
    }
    return false;
},

isIpBanned: function(ip) {
    for (var subip in script.ipbans.hash) {
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
    var allowedIps = ["74.115.245.16","74.115.245.26"];
    if (this.isRangeBanned(ip) && allowedIps.indexOf(ip) == -1 && script.allowedRangeNames.indexOf(sys.name(src).toLowerCase()) == -1) {
        normalbot.sendMessage(src, 'You are banned!');
        sys.stopEvent();
        return;
    }
    if (proxy_ips.hasOwnProperty(ip)) {
        normalbot.sendMessage(src, 'You are banned for using a proxy!');
        sys.stopEvent();
        return;

    }
    if (this.nameIsInappropriate(src)) {
        sys.stopEvent();
    }
    

},

isContrib: function(id) {
    var name = sys.name(id);
    if (!name) {
        return;
    }
    for (var contrib in script.contributors.hash) {
        if (script.cmp(name, contrib)) {
            return true;
        }
    }
    return false;
},

userGuides: function(os, unsupported) {
    var ret = [];
    var guides = {
        "windows": {
            "English": "http://pokemon-online.eu/threads/34171/",
            "Español": "http://pokemon-online.eu/threads/34234/",
            "中文": "http://tieba.baidu.com/p/4324437820",
            "Português": "http://pokemon-online.eu/threads/34370/"
        },
        "android": {
            "English": "http://pokemon-online.eu/threads/30992/",
            "Español": "http://pokemon-online.eu/threads/26525/",
            "中文": "http://tieba.baidu.com/p/4302246727",
            "Français": "http://pokemon-online.eu/threads/31584/"
        },
        "webclient": {
            "English": "http://pokemon-online.eu/threads/34372/",
            "Español": "http://pokemon-online.eu/threads/34379/",
            "中文": "http://tieba.baidu.com/p/4324437820"
        }
    };
    if (!guides.hasOwnProperty(os)) {
        return;
    }
    for (var p in guides) {
        if (os === p) {
            for (var l in guides[p]) {
                ret.push(unsupported ? l + ": " + guides[p][l] : "<a href='" + guides[p][l] + "'>" + l + "</a>");
            }
        }
    }
    return ret.join(" | ");
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

    var cyrillic = /\u0455|\u04ae|\u04c0|\u04cf|\u050c|\u051a|\u051b|\u051c|\u051d|\u0405|\u0408|\u0430|\u0410|\u0412|\u0435|\u0415|\u041c|\u041d|\u043e|\u041e|\u0440|\u0420|\u0441|\u0421|\u0422|\u0443|\u0445|\u0425|\u0456|\u0406/;
    if (cyrillic.test(name)) {
        reply('You are using Cyrillic letters similar to Latin letters in your name.');
        return true;
    }
    var greek = /[\u0370-\u03ff]/;
    if (greek.test(name)) {
        reply('You are using Greek letters similar to Latin letters in your name.');
        return true;
    }

    // \u0020 = space
    var space = /[\u0009-\u000D]|\u0085|\u00A0|\u1680|\u180E|[\u2000-\u200A]|\u2028|\u2029|\u2029|\u202F|\u205F|\u3000|\u3164|\uFEFF|\uFFA0|\u2009|\u2008/;
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
    if (/\u0305|\u0336/.test(name)) {
        reply('You are using COMBINING OVERLINE character in your name.');
        return true;
    }
    if (/\u0CBF|\u1D0F/gi.test(name)) {
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

getMaxAuth: function(targetId) {
    if (targetId) {
        return sys.maxAuth(sys.ip(targetId));
    }
    return 0;
},

nameWarnTest : function(src) {
    if (sys.auth(src) > 0)
        return;
    var lname = sys.name(src).toLowerCase();
    for (var i = 0; i < nameWarns.length; ++i) {
        var regexp = nameWarns[i];
        if (regexp.test(lname)) {
            sys.sendAll('Namewarning: Name `' + sys.name(src) + '´ matches the following regexp: `' + regexp + '´ on the IP `' + sys.ip(src) + "´.", watchchannel);
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

cookieBanned: function(src) {
    if (sys.auth(src) > 0) {
        return;
    }
    var cookie = sys.cookie(src) ? sys.cookie(src) : "none";
    if (script.namesToUnban.get(sys.name(src).toLowerCase()) === "true") {
        kickbot.sendAll(sys.name(src) + " was unbanned by cookie", staffchannel);
        sys.removeCookie(src);
        script.namesToUnban.remove(sys.name(src).toLowerCase());
    } else if (cookie === "banned" || cookie.substr(0, 6) === "banned") { //backwards compatability
        var name;
        if (cookie.indexOf(" ") > 1) {
            name = cookie.substr(cookie.indexOf(" ")+1);
        }
        kickbot.sendAll(nonFlashing(sys.name(src)) + " was banned by cookie" + (name ? " [Original Name: " + nonFlashing(name) + "]." : "."), watchchannel);
        normalbot.sendMessage(src, "You are currently banned from the server. If you believe this to be an error, post here: http://pokemon-online.eu/forums/disciplinary-committee.43/");
        sys.kick(src);
        return true;
    } else if (cookie === "muted" || cookie.substr(0, 5) === "muted") {
        var name;
        if (cookie.indexOf(" ") > 1) {
            name = cookie.substr(cookie.indexOf(" ")+1);
        }
        SESSION.users(src).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "Cookie", true);
        kickbot.sendAll(nonFlashing(sys.name(src)) + " was smuted by cookie" + (name ? " [Original Name: " + nonFlashing(name) + "]." : "."), watchchannel);
        return;
    }
    if (!sys.uniqueId(src)) {
        return;
    }
    var id = sys.uniqueId(src).id;
    var idInfo = script.idBans.get(id);
    if (idInfo) {
        idInfo = JSON.parse(idInfo);
        var name = idInfo.name;
        var type = idInfo.type;
        kickbot.sendAll(nonFlashing(sys.name(src)) + " was " + (type == "banned" ? "banned" : "smuted") + " by ID" + (name ? " [Original Name: " + nonFlashing(name) + "]." : "."), watchchannel);
        if (type == "muted") {
            SESSION.users(src).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 86400, "ID", true);
            return;
        } else {
            normalbot.sendMessage(src, "You are currently banned from the server. If you believe this to be an error, post here: http://pokemon-online.eu/forums/disciplinary-committee.43/");
            sys.kick(src);
            return true;
        }
    }
    return;
},

afterLogIn : function(src) {
    if (script.cookieBanned(src)) { //prevents errors from "no id" from the rest of the function
        return;
    }
    if (sys.os(src) !== "android" && sys.os(src) !== "webclient" && sys.version(src) < 2500) {
        sys.sendMessage(src, "Your client version is no longer compatible with the current server version. Please download the most recent update at http://pokemon-online.eu/pages/download/ in order to connect and battle properly!");
        sys.sendMessage(src, "Tu versión del programa ya no es compatible con la versión actual del servidor. Por favor descarga la versión más reciente en http://pokemon-online.eu/pages/download/ para poder conectarte y tener tus combates!");
        sys.sendMessage(src, "po2.62（PC自带计算器）： http://tieba.baidu.com/p/4210534593?share=9105&fr=share");
        sys.kick(src);
        return;
    }
    /* Right now its useless with a Gen 6 cut off... */
    /*if (sys.os(src) === "android" && sys.version(src) > 45 && sys.version(src) < 46) {
            sys.sendMessage(src, "Your client version is no longer compatible with the current server version. Please download the update at ?????");
            sys.kick(src);
            return;
        }
    }*/
    sys.sendMessage(src, "*** Type in /rules to see the rules and /commands to see the commands! ***");
    sys.sendMessage(src, "±Official Side Channels: #Tournaments | #Safari | #Hangman | #Trivia | #Mafia");

    maxPlayersOnline = Math.max(sys.numPlayers(), maxPlayersOnline);
    if (maxPlayersOnline > sys.getVal("MaxPlayersOnline")) {
        sys.saveVal("MaxPlayersOnline", maxPlayersOnline);
    }
    countbot.sendMessage(src, (typeof(this.startUpTime()) == "string" ?  "Server Uptime: " + this.startUpTime() + ".  " : "")  + "Max Players Online: " + sys.getVal("MaxPlayersOnline") + ".");
    sys.sendMessage(src, "");

    callplugins("afterLogIn", src);

   /*if (SESSION.users(src).android) {
        sys.changeTier(src, "Challenge Cup");
        if (sys.existChannel("PO Android")) {
            var androidChan = sys.channelId("PO Android");
            sys.putInChannel(src, androidChan);
            sys.kick(src, 0);
            sys.sendMessage(src, "*********", androidChan);
            sys.sendMessage(src, "Message: Hello " + sys.name(src) + "! You seem to be using Pokemon Online for Android. With it you are able to battle with random pokemon. If you want to battle with your own made team, please surf to http://pokemon-online.eu/download with your computer and download the desktop application to your desktop. With it you can export full teams to your Android device! If you using the version with ads from Android Market, download adfree version from http://code.google.com/p/pokemon-online-android/downloads/list", androidChan);
            sys.sendMessage(src, "*********", androidChan);
        }
    }*/

    if (SESSION.users(src).hostname && SESSION.users(src).hostname.toLowerCase().indexOf('tor') !== -1) {
        sys.sendAll('Possible TOR user: ' + sys.name(src), staffchannel);
    }

    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as Auth" + "\n");
    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
    this.afterChangeTeam(src);

    if (this.canJoinStaffChannel(src) && !sys.isInChannel(src, staffchannel))
        sys.putInChannel(src, staffchannel);

    /*if (isAndroid(src)) {
        normalbot.sendMessage(src, "New android version back on Play Store! See: http://pokemon-online.eu/threads/po-android-play-store-revival.29571/");
    }*/
}, /* end of afterLogin */

beforePlayerRegister : function(src) {
    if (sys.name(src).match(/\bguest[0-9]/i)) {
        sys.stopEvent();
        normalbot.sendMessage(src, "You cannot register guest names!");
        return;
    }
    /*
    var limit = Config.registeredLimit;
    if (limit > 0 && sys.numRegistered(sys.ip(src)) >= limit && sys.auth(src) === 0) {
        sys.stopEvent();
        normalbot.sendMessage(src, "You cannot register more than " + limit + " names! Use /myalts to get a list of your alts.");
        return;
    }
    */
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
        if (!POuser.namehistory) {
            POuser.namehistory = [];
        }
        POuser.namehistory.push([new_name, now]);
        POuser.name = new_name;
        var spamcheck = POuser.namehistory[POuser.namehistory.length-3];
        if (spamcheck && spamcheck[1]+10 > now) {
            sys.kick(src);
            return;
        }
    }
    if (script.isContrib(src)) {
        var contribName = utilities.getCorrectPropName(sys.name(src), script.contributors.hash);
        if (sys.dbRegistered(sys.name(src))) {
            POuser.contributions = script.contributors.get(contribName);
        }
        else {
            normalbot.sendAll(contribName + " was removed from contributors due to their alt being unregistered. [Contributions: " + script.contributors.get(contribName) + "]", staffchannel);
            script.contributors.remove(contribName);
        }
    }

    POuser.mafiaAdmin = script.mafiaAdmins.hash.hasOwnProperty(sys.name(src));
    if (!authChangingTeam) {
        if (sys.auth(src) > 0 && sys.auth(src) <= 3)
            sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Changed name to Auth" + "\n");
    } else if (authChangingTeam) {
        if (!(sys.auth(src) > 0 && sys.auth(src) <= 3))
            sys.appendToFile("staffstats.txt", "~" + src + "~" + sys.time() + "~" + "Changed name from Auth" + "\n");
    }

    POuser.sametier = script.getKey("forceSameTier", src) == "1";

    if (script.getKey("autoIdle", src) == "1") {
        sys.changeAway(src, true);
    }

    for (var team = 0; team < sys.teamCount(src); team++) {
        if (!tier_checker.has_legal_team_for_tier(src, team, sys.tier(src, team))) {
            tier_checker.find_good_tier(src, team);
            normalbot.sendMessage(src, "You were placed into '" + sys.tier(src, team) + "' tier.");
        }
    }

}, /* end of afterChangeTeam */



silence: function(src, minutes, chanName) {
    if (!chanName) {
        bot.sendMessage(src, "Sorry, global silence is disabled. Use /silence 5 Channel Name", channel);
        return;
    }
    var duration = minutes;
    var doCall, delay;
    if (duration !== "permanent") {
        delay = parseInt(minutes * 60, 10);
        if (isNaN(delay) || delay <= 0) {
            channelbot.sendMessage(src, "Your have not specified a valid number. The channel will be permanently silenced.", channel);
        } else {
            duration += " minutes of";
            doCall = true;
        }
    }
    var cid = sys.channelId(chanName);
    if (cid !== undefined) {
        channelbot.sendAll(sys.name(src) + " called for " + duration + " silence in "+chanName+"!", cid);
        SESSION.channels(cid).muteall = true;
        if (doCall) {
            sys.delayedCall(function() {
                if (!SESSION.channels(cid).muteall)
                    return;
                SESSION.channels(cid).muteall = false;
                normalbot.sendAll("Silence is over in "+chanName+".",cid);
            }, delay);
        }
    } else {
        channelbot.sendMessage(src, "Sorry, I couldn't find a channel with that name.", channel);
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
        normalbot.sendAll("" + sys.name(src) + " turned /me off in "+commandData+".", cid);
    } else {
        normalbot.sendMessage(src, "Sorry, I couldn't find a channel with that name.", channel);
    }
    return;
},

meon: function(src, commandData) {
    var cid = sys.channelId(commandData);
    if (cid !== undefined) {
        SESSION.channels(cid).meoff = false;
        normalbot.sendAll("" + sys.name(src) + " turned /me on in "+commandData+".", cid);
        SESSION.global().channelManager.update(cid);
    } else {
        normalbot.sendMessage(src, "Sorry, I couldn't find a channel with that name.", channel);
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
    if (user.smute.active && script.getMaxAuth(src) < 1){
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
        if (!user.pmwarned) {
            normalbot.sendAll('User ' + sys.name(src) + ' is potentially spamming through PM', sys.channelId('Indigo Plateau'));
            user.pmwarned = true;
        }
        return;
    }
    user.lastpm = parseInt(sys.time(), 10);
},

beforeChatMessage: function(src, message, chan) {
    message = message.trim().replace(/\s{2,}/g, " ");
    /*if(message.substr(0, 1) == '%')
    {
         if(sys.id('JiraBot') !== undefined)
              sys.sendMessage(sys.id('JiraBot'), sys.name(src)+": "+message, chan);
         if(sys.id('PolkaBot') !== undefined)
             sys.sendMessage(sys.id('PolkaBot'), sys.name(src)+": "+message, chan);
         sys.stopEvent();
         return;
    }*/
    channel = chan;

    var throttleMsg = false;
    if (script.isOfficialChan(chan)) {
        if ((!SESSION.channels(channel).isChannelOperator(src) && message.length > 250)
         || (!SESSION.channels(channel).isChannelAdmin(src) && message.length > 3000)) {
            throttleMsg = true;
        }
    } else if (message.length > 3000 && sys.auth(src) < 2) {
        throttleMsg = true;
    }
    if (throttleMsg) {
        normalbot.sendMessage(src, "Hi! Your message is too long, please make it shorter :3", channel);
        sys.stopEvent();
        return;
    }

    if ((message === "." || message === "t" || message === "。") && !callplugins("beforeChatMessage", src, message, channel)) {
        sys.sendMessage(src, sys.name(src) + ": " + message, channel);
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
            bot.sendMessage(src, "Please wait a moment before talking again.", channel);
            sys.stopEvent();
            return;
        }
    }

    var name = sys.name(src).toLowerCase();
    // spamming bots, linking virus sites
    // using lazy points system for minimizing false positives
    /*if (channel === 0 && sys.auth(src) === 0) {
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
    }*/

    if (SESSION.users(src).expired("mute")) {
        SESSION.users(src).un("mute");
        normalbot.sendMessage(src, "your mute has expired.", channel);
    }

    var isBlocked = true, command, commandData;
    if (is_command(message)) {
        //Used further down too
        var pos = message.indexOf(' ');
        if (pos != -1) {
            command = message.substring(1, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(1).toLowerCase();
        }

        if (command.indexOf("rules") === -1 && command.indexOf("admins") === -1) {
            if (["commands", "topic", "cjoin", "auth", "contributors", "intier", "league", "players", "topchannels", "uptime", "notice", "changetier", "idle", "importable", "sametier", "resetpass", "seen", "myalts", "ranking", "battlecount", "ability", "canlearn", "dwreleased", "item", "move", "ability", "nature", "pokemon", "tier", "wiki", "mas", "has", "mus", "tas", "cauth", "selfkick"].contains(command)) {
                isBlocked = false;
            }
        } else {
            isBlocked = false;
        }
    }

    if (sys.auth(src) < 3 && SESSION.users(src).mute.active && isBlocked) {
        var muteinfo = SESSION.users(src).mute;
        normalbot.sendMessage(src, "You are muted" + (muteinfo.by ? " by " + muteinfo.by : '')+". " + (muteinfo.expires > 0 ? "Mute expires in " + getTimeString(muteinfo.expires - parseInt(sys.time(), 10)) + ". " : '') + (muteinfo.reason ? "[Reason: " + muteinfo.reason + "]" : ''), channel);
        sys.stopEvent();
        return;
    }
    var poChannel = SESSION.channels(channel);
    if (sys.auth(src) < 1 && !poChannel.canTalk(src) && isBlocked) {
        if (poChannel.muted.hasOwnProperty(sys.name(src).toLowerCase())) {
            var auth = poChannel.muted[sys.name(src).toLowerCase()].auth,
                expiry = poChannel.muted[sys.name(src).toLowerCase()].expiry,
                reason = poChannel.muted[sys.name(src).toLowerCase()].reason;
            if (isNaN(expiry)) {
                expiry = "forever";
            } else {
                expiry = "for " + getTimeString(expiry - parseInt(sys.time(), 10), 10);
            }
            channelbot.sendMessage(src, "You are muted on this channel " + expiry + " by " + auth + "." + (reason === "N/A" ? "" : " [Reason: " + reason + "]"), channel);
        } else {
            channelbot.sendMessage(src, "You are muted on this channel.", channel);
        }
        sys.stopEvent();
        return;
    }

    if (callplugins("beforeChatMessage", src, message, channel)) {
        sys.stopEvent();
        return;
    }
    // text reversing symbols
    // \u0458 = "j"
    if (/[\u0458\u0489\u202a-\u202e\u0300-\u036F\u1dc8\u1dc9\ufffc\u1dc4-\u1dc7\u20d0\u20d1\u0415\u0421]/.test(message) && !is_command(message)) {
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
        var BanList = [".tk", "nimp.org", "drogendealer", /\u0E49/, /\u00AD/, "nobrain.dk", /\bn[1i]gg+ers*\b/i,  "¦¦", "¦¦", "__", "¯¯", "___", "……", ".....", "¶¶", "¯¯", "----", "╬═╬", "fukov"];
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
            if (script.isLCaps(name[i])) {
                ++caps;
                if (caps > 6)
                    return true;
            } else {
                caps -= 2;
                if (caps < 0)
                    caps = 0;
            }
        }
        return false;
    });

    if (is_command(message) && message.length > 1 && utilities.isLetter(message[1])) {
        if (parseInt(sys.time(), 10) - lastMemUpdate > 500) {
            sys.clearChat();
            lastMemUpdate = parseInt(sys.time(), 10);
        }

        sys.stopEvent();
        print("-- Command: " + sys.name(src) + ": " + message);

        var tar = sys.id(commandData);

        // Module commands at the last point.
        if (callplugins("handleCommand", src, message.substr(1), channel)) {
            return;
        }
        //Topic can be way to communicate while muted
        if (["topic", "topicadd", "updatepart", "removepart"].contains(command) && (!poChannel.canTalk(src) || (SESSION.users(src).smute.active && sys.auth(src) < 1) || SESSION.users(src).mute.active)) {
            command = "topic";
            commandData = undefined;
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
    if (!SESSION.channels(channel).allowSwear) {
        if(/f[uo]ck|\bass|\bcum|\bdick|\bsex|pussy|bitch|porn|\bfck|nigga|\bcock|\bgay|\bhoe\b|slut|\bshit\b|whore|cunt|clitoris|\bfag/i.test(message)) {
             sys.stopEvent();
             return;
        }
    }

    // Banned words
    if (usingBannedWords()) {
        var match = message.match(/https?:\/\/[^\s]+\.tk[^\s]*/ig);  //regex isn't my strong point so this probably needs improving...
        if (match){
            normalbot.sendAll(sys.name(src) + " tried to send a .tk link in the channel " + sys.channel(channel) + " [Message content: " + match + "]!",staffchannel);
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
        normalbot.sendMessage(src, "You have too many capital letters in your name. Please reduce the amount of them to speak freely. A lowercase name will keep your ladder score.", channel);
        sys.stopEvent();
        return;
    }
    /*
    if (sys.auth(src) === 0 && message.toLowerCase().indexOf(".onion") != -1) {
        SESSION.users(src).activate("smute", Config.kickbot, parseInt(sys.time(), 10) + 7200, "Onion Link", true);
        kickbot.sendAll(sys.name(src) + " was smuted for 2 hours because they tried to send an Onion Link in the channel " + sys.channel(channel) + " [Message content: " + message + "]!", staffchannel);
    }
    */
    // Secret mute
    if (SESSION.users(src).smute.active) {
        if (SESSION.users(src).expired("smute") || script.getMaxAuth(src) > 0) {
            SESSION.users(src).un("smute");
        } else {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active) {
                    var color = script.getColor(id);
                    if (sys.isInChannel(id, channel)) {
                        if (isAndroid(id)) {
                            sys.sendHtmlMessage(id, "<font color=" + color + "><timestamp/><b>" + sys.name(src) + ":</b></font> " + utilities.html_escape(message), channel);
                        } else {
                            sys.sendMessage(id,  sys.name(src) + ": " + message, channel);
                        }
                    }
                }
            });
            sys.sendHtmlAll("<timestamp/>[#" + sys.channel(channel) + "] <font color=" + script.getColor(src) + "><b>" + sys.name(src) + ":</b></font> " + utilities.html_escape(message), watchchannel);
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

    if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW) {
    var date = new Date();
    if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
        sys.sendAll(sys.name(src)+": " + message.toUpperCase(), channel);
        sys.stopEvent();
        this.afterChatMessage(src, message, channel);
        return;
    }
    }
    if (channel === sys.channelId("Tohjo Falls") && script.reverseTohjo) {
        sys.sendAll(sys.name(src) + ": " + message.split("").reverse().join(""), channel);
        sys.stopEvent();
        this.afterChatMessage(src, message, channel);
        return;
    }

    if (SESSION.global().blockWebLinks && script.isOfficialChan(channel) && sys.auth(src) === 0 && sys.os(src) === "webclient") {
        if (message.toLowerCase().indexOf("http") !== -1) {
            kickbot.sendAll(sys.name(src) + " is attempting to send a link on Webclient in the channel " + sys.channel(channel) + " [(May be NSFW) Message content: " + message + " ]!", staffchannel);
            //message = message.replace("http", "ht\u200btp");
            //sys.sendAll(sys.name(src) + ": " + message, channel);
            sys.sendMessage(src, sys.name(src) + ": " + message, channel);
            sys.stopEvent();
            this.afterChatMessage(src, message, channel);
            return;
        }
    }

    //Special donator
    /*if (name == "fear") {
        sys.sendHtmlAll("<span style='color: " + sys.getColor(src) + "'><timestamp/><b>±Fear: </b></span>" + message.replace("&", "&amp;").replace("<", "&lt;"),  channel);
        sys.stopEvent();
        this.afterChatMessage(src, message, channel);
        return;
    }*/
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
    var ignoreChans = [staffchannel, sachannel, sys.channelId("trivreview"), sys.channelId("Watch")];
    var userMayGetPunished = sys.auth(src) < 2 && ignoreChans.indexOf(channel) == -1 && !poChannel.isChannelOperator(src);
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
                    capsbot.sendAll("" + sys.name(src) + " was muted for caps while smuted.", watchchannel);
                } else {
                    capsbot.sendAll(message, channel);
                    if (channel != staffchannel)
                        capsbot.sendAll(message + " [Channel: "+sys.channel(channel) + "]", staffchannel);
                    if (channel != watchchannel)
                        capsbot.sendAll(message + " [Channel: "+sys.channel(channel) + "]", watchchannel);
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
    if (!poChannel.ignoreflood && userMayGetPunished && !(message === "." || message === "t" || message === "。")) {
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
            var message = "" + sys.name(src) + " was kicked " + (sys.auth(src) === 0 && officialChan ? "and muted for 1 hour " : "") + "for flood";
            if (officialChan) {
                if (user.smute.active) {
                    sys.sendMessage(src, message);
                    kickbot.sendAll("" + sys.name(src) + " was kicked for flood whilst smuted.", staffchannel);
                    kickbot.sendAll("" + sys.name(src) + " was kicked for flood whilst smuted.", watchchannel);
                }
                else if (user.mute.active) {
                    kickbot.sendAll(message + " whilst muted. [Channel: "+sys.channel(channel)+"]", staffchannel);
                    kickbot.sendAll(message + " whilst muted.  [Channel: "+sys.channel(channel)+"]", watchchannel);
                } else {
                    kickbot.sendAll(message, channel);
                    if (channel != staffchannel)
                        kickbot.sendAll(message + ". [Channel: "+sys.channel(channel)+"]", staffchannel);
                    if (channel != watchchannel)
                        kickbot.sendAll(message + ". [Channel: "+sys.channel(channel)+"]", watchchannel);
                }
            }
            if (officialChan) {
                if (sys.auth(src) === 0) {
                    var endtime = user.mute.active ? user.mute.expires + 3600 : parseInt(sys.time(), 10) + 3600;
                    user.activate("mute", Config.kickbot, endtime, "Flooding", true);
                }
                callplugins("onKick", src);
                script.kickAll(sys.ip(src));
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

afterBattleStarted: function(src, dest, clauses, rated, mode, bid, team1, team2) {
    callplugins("afterBattleStarted", src, dest, clauses, rated, mode, bid, team1, team2);
    var tier = false;
    if (sys.tier(src, team1) === sys.tier(dest, team2)) {
        tier = sys.tier(src, team1);
    }
    var time = parseInt(sys.time(), 10);
    var battle_data = {players: [sys.name(src), sys.name(dest)], clauses: clauses, rated: rated, mode: mode, tier: tier, time: time};
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
    var rated = SESSION.global().battleinfo[bid].rated;
    var tier = SESSION.global().battleinfo[bid].tier;
    var time = SESSION.global().battleinfo[bid].time;
    var srcname = sys.loggedIn(src) ? sys.name(src) : SESSION.global().battleinfo[bid].players[0];
    var destname = sys.loggedIn(dest) ? sys.name(dest) : (SESSION.global().battleinfo[bid].players[1] === srcname ? SESSION.global().battleinfo[bid].players[0] : SESSION.global().battleinfo[bid].players[1]); //will still break occasionally on ties, but meh
    var tie = desc === "tie";
    delete SESSION.global().battleinfo[bid];

    if (sys.loggedIn(src)) {
        if (!SESSION.users(src).battlehistory) SESSION.users(src).battlehistory=[];
        SESSION.users(src).battlehistory.push([destname, tie ? "tie" + (sys.loggedIn(dest) ? "" : " by d/c") : "win", desc, rated, tier]);
        delete SESSION.users(src).battles[bid];
    }
    if (sys.loggedIn(dest)) {
        if (!SESSION.users(dest).battlehistory) SESSION.users(dest).battlehistory=[];
        SESSION.users(dest).battlehistory.push([srcname, tie ? "tie" + (sys.loggedIn(src) ? "" : " by d/c") : "lose", desc, rated, tier]);
        delete SESSION.users(dest).battles[bid];
    }
    if (rated && (script.namesToWatch.get(srcname.toLowerCase()) || script.namesToWatch.get(destname.toLowerCase()))) {
        if (sys.existChannel("Watch")) {
            sys.sendHtmlAll("<b><font color = blue>" + srcname + " and " + destname + " finished a battle with result " + (tie ? "tie" : srcname + " winning") + (desc === "forfeit" ? " (forfeit)" : "") + (tier ? " in tier " + tier: "") + (time ? " after " + getTimeString(sys.time() - time) + "." : "." ) + "</font></b>", watchchannel);
            normalbot.sendAll(srcname + "'s IP: " + sys.dbIp(srcname) + " | " + destname + "'s IP: " + sys.dbIp(destname), watchchannel);
            sys.appendToFile(Config.dataDir + "watchNamesLog.txt", srcname + ":::" + destname + ":::" + (tie ? "tie" : srcname) + ":::" + (desc === "forfeit" ? "Forfeit" : "N/A") + ":::" + (tier ? tier: "N/A") + "::: " + (time ? getTimeString(sys.time() - time) : "N/A") + ":::" + sys.dbIp(srcname) + ":::" + sys.dbIp(destname) + "\n");
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
            if (count > 5)
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

/*
afterChangeTier : function(src, team, oldtier, newtier) {
},

afterPlayerAway : function(src, away) {
},
*/

beforeChallengeIssued : function (src, dest, clauses, rated, mode, team, destTier) {
    if (script.battlesStopped) {
        battlebot.sendMessage(src, "Battles are now stopped as the server will restart soon.");
        sys.stopEvent();
        return;
    }

    if (SESSION.users(dest).sametier && (destTier != sys.tier(src,team))) {
        battlebot.sendMessage(src, "That guy only wants to battle people in his/her own tier.");
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
    if (callplugins("canSpectate", src, p1, p2) || SESSION.users(src).smute.active) {
        sys.stopEvent();
    }

},

beforeBattleMatchup : function(src,dest,clauses,rated)
{
    if (script.battlesStopped) {
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
            if (sys.ladderRating(id,tier) >= 1200) {
                sys.sendHtmlMessage(id,"<font color=red size=3><b>You currently have a high rating in "+tier+", but your account is not registered! Please register to protect your account from being stolen (click the register button below and follow the instructions)!</b></font><ping/>");
            }
        }
    }
},

battleConnectionLost : function() {
    battlebot.sendAll("Connection to Battle Server lost!", staffchannel);
},

hasAuthElements: function (array) {
    if (!Array.isArray(array)) {
        return;
    }
    for (var i = 0; i < array.length; i++) {
        if (sys.dbAuths().indexOf(array[i]) != -1) {
            return true;
        }
    }
    return false;
}
});