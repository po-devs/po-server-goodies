/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global print, sys*/

//imported functions from main scripts and other plugins. Variables from here are prefixed with "mainScripts"
var mainScripts = {
    cleanFile:cleanFile,
    Bot:require("bot.js").Bot,
    dataDir: Config.dataDir
};

//blackjack global defines
var blackjackbot, deck, lastkey;

var config = {
    bot: "Scrafty", //name of channel bot
    channel: "Blackjack", //channel Blackjack to be played in
    hitlimit: 16, //Upper limit dealer can hit on
    owner: "Crystal Moogle" //default channel owner
};

var blackJack = {
    started: false,
    players: {}
};

//blackjack functions
function init() {
    config = getConfig();
    blackjackbot = new mainScripts.Bot(config.bot);
    createDeck();
}

function handleCommand(src, commandLine, channel) {
    if (channel !== sys.channelId(config.channel)) {
        return false;
    }
    var index = commandLine.indexOf(' ')
    var command, commandData;
    var isCommand = false;
    if (index !== -1) {
        command = commandLine.substr(0, index);
        commandData = commandLine.substr(index+1);
    } else {
        command = commandLine;
    }
    if (command === "blackjackcommands" || "bjcommands") {
        onHelp(src, "blackjack", channel);
        isCommand = true;
    }
    return isCommand;
}

function onHelp(src, commandData, channel) {
    if (commandData === "blackjack") {
    }
}

function createDeck() {
    if(typeof (deck) === "undefined") {
        deck = {};
        var scard = [];
        var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var suits = ["♠", "♣", "♦", "♥"];
        for(var a = 0; a < 4; a++) {
            for(var b = 0; b < 13; b++) {
                scard.push(cards[b] + suits[a])
            }
        }
        for(var x = 0; x < scard.length; x++) {
            deck[x] = {
                card: scard[x]
            }
        }
        lastkey = (parseInt(Object.keys(deck).length) + 1, 10);
        shuffle();
    }
}

function shuffle() {
    var decklength = Object.keys(deck).length;
    for(var i = 0; i < 3; i++) {
        for(var j = 0; j < decklength; j++) {
            var k = sys.rand(0, decklength);
            var temp = deck[j].card;
            deck[j].card = deck[k].card;
            deck[k].card = temp;
        }
    }
}

function getConfig() {
    mainScripts.cleanFile(mainScripts.dataDir+"blackjack.json");
    var configFile = sys.getFileContent(mainScripts.dataDir + "blackjack.json");
    if (configFile === "") {
        return config;
    }
    try {
        return JSON.parse(configFile)
    } catch (e) {
        print("Error in config:" + e);
        return config;
    }
}

//exports to main script
module.exports = {
    init:init,
    handleCommand:handleCommand,
    onHelp:onHelp
};