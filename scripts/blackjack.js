/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global print, sys*/

//imported functions from main scripts and other plugins. Variables from here are prefixed with "mainScripts"
var mainScripts = {
    cleanFile:cleanFile,
    Bot:require("bot.js").Bot,
    dataDir: Config.dataDir
};

//blackjack global defines
var blackjackbot, deck;

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
    var returnVal = false;
    try {
        testCommand(src, commandLine, channel);
        returnVal = true;
    } catch(e) {
        if (e === "Command doesn't exist") {
            returnVal = false;
        } else {
            blackjackbot.sendMessage(src, e);
        }
    }
    return returnVal;
}

function testCommand(src, commandLine, channel) {
    var index = commandLine.indexOf(' ');
    var command, commandData;
    if (index !== -1) {
        command = commandLine.substr(0, index);
        commandData = commandLine.substr(index+1);
    } else {
        command = commandLine;
    }
    if (command === "blackjackcommands" || command === "bjcommands") {
        onHelp(src, "blackjack", channel);
        return;
    }
    if (command === "start") {
        startGame();
        return;
    }
    if (command === "test") {
        if (commandData === "deck") {
            sys.sendMessage(src, JSON.stringify(deck));
        }
        if (commandData === "card") {
            sys.sendMessage(src, getCard());
        }
        if (commandData === "totals") {
            var card1 = getCard();
            var card2 = getCard();
            var total = checkTotal([card1,card2]);
            sys.sendMessage(src, card1 + " " + card2 + " " + total);
        }
        return;
    }
    throw "Command doesn't exist";
}

function onHelp(src, commandData, channel) {
    if (commandData === "blackjack") {
    }
}

function createDeck() {
    deck = [];
    var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    var suits = ["♠", "♣", "♦", "♥"];
    for(var a = 0; a < 4; a++) {
        for(var b = 0; b < 13; b++) {
            deck.push(cards[b] + suits[a])
        }
    }
    shuffle();
}

function shuffle() {
    var decklength = deck.length;
    for(var i = 0; i < 3; i++) {
        for(var j = 0; j < decklength; j++) {
            var k = sys.rand(0, decklength);
            var temp = deck[j];
            deck[j] = deck[k];
            deck[k] = temp;
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

function getCard() {
    var card = deck[0];
    deck.push(deck.shift());
    return card
}

function checkTotal(cards) {
    var fcards = ["J", "Q", "K"];
    var ace = 0;
    var total = 0;
    for(var y = 0; y < cards.length; y++) {
        var cardadd;
        if(cards[y][1] == "0") {
            cardadd = cards[y][0] + cards[y][1];
        } else {
            cardadd = cards[y][0];
        }
        if(fcards.indexOf(cardadd) !== -1) {
            cardadd = 10;
        }
        if(cardadd == "A") {
            ace = ace + 1;
            cardadd = 11;
        }
        total = total + parseInt(cardadd)
    }
    while(ace > 0 && total > 21) {
        ace = ace - 1;
        total = total - 10;
    }
    return total;
}

function startGame() {
    if (blackJack.started === true) {
        throw "Game has already started";
    }
    blackjackbot.sendAll("A new blackjack game has started!", config.channel);
    blackjackbot.sendAll("You have 30 seconds to join!", config.channel);
    blackJack.started = true;
}
//exports to main script
module.exports = {
    init:init,
    handleCommand:handleCommand,
    onHelp:onHelp
};