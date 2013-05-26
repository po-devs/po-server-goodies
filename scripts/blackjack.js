/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global print, sys, SESSION, Config, cleanFile*/

//imported functions from main scripts and other plugins. Variables from here are prefixed with "mainScripts"
var mainScripts = {
    cleanFile: cleanFile,
    Bot: require("bot.js").Bot,
    dataDir: Config.dataDir
};

//blackjack global defines
var blackjackbot, deck, blackjackchan;

var config = {
    bot: "Scrafty", //name of channel bot
    channel: "Blackjack", //channel Blackjack to be played in
    hitlimit: 16, //Upper limit dealer can hit on
    owner: "Crystal Moogle" //default channel owner
};

var blackJack = {
    phase: "",
    players: {}
};

//blackjack functions

function init() {
    config = getConfig();
    blackjackbot = new mainScripts.Bot(config.bot);
    blackjackchan = sys.channelId(config.channel);
    createDeck();
}

function handleCommand(src, commandLine, channel) {
    if (channel !== blackjackchan) {
        return false;
    }
    var returnVal = false;
    try {
        testCommand(src, commandLine, channel);
        returnVal = true;
    }
    catch (e) {
        if (e === "Command doesn't exist") {
            returnVal = false;
        }
        else {
            blackjackbot.sendMessage(src, e, channel);
        }
    }
    return returnVal;
}

function testCommand(src, commandLine, channel) {
    var index = commandLine.indexOf(' ');
    var command, commandData;
    if (index !== -1) {
        command = commandLine.substr(0, index);
        commandData = commandLine.substr(index + 1);
    }
    else {
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
    if (command === "join") {
        joinGame(src);
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
            var total = checkTotal([card1, card2]);
            sys.sendMessage(src, card1 + " " + card2 + " " + total);
        }
        return;
    }
    throw "Command doesn't exist";
}

function onHelp(src, commandData, channel) {
    if (commandData === "blackjack") {
        sys.sendMessage(src, "/bjcommands: Allows you to see the blackjack commands", channel);
        sys.sendMessage(src, "/start: Starts a blackjack game", channel);
    }
}

function createDeck() {
    deck = [];
    var cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    var suits = ["♠", "♣", "♦", "♥"];
    for (var a = 0; a < 4; a++) {
        for (var b = 0; b < 13; b++) {
            deck.push(cards[b] + suits[a])
        }
    }
    shuffle();
}

function shuffle() {
    var decklength = deck.length;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < decklength; j++) {
            var k = sys.rand(0, decklength);
            var temp = deck[j];
            deck[j] = deck[k];
            deck[k] = temp;
        }
    }
}

function getConfig() {
    mainScripts.cleanFile(mainScripts.dataDir + "blackjack.json");
    var configFile = sys.getFileContent(mainScripts.dataDir + "blackjack.json");
    if (configFile === "") {
        return config;
    }
    try {
        return JSON.parse(configFile)
    }
    catch (e) {
        print("Error in config:" + e);
        return config;
    }
}

function getCard() {
    var card = deck[0];
    deck.push(deck.shift());
    return card;
}

function checkTotal(cards) {
    var fcards = ["J", "Q", "K"];
    var ace = 0;
    var total = 0;
    for (var y = 0; y < cards.length; y++) {
        var cardadd;
        if (cards[y][1] == "0") {
            cardadd = cards[y][0] + cards[y][1];
        }
        else {
            cardadd = cards[y][0];
        }
        if (fcards.indexOf(cardadd) !== -1) {
            cardadd = 10;
        }
        if (cardadd == "A") {
            ace = ace + 1;
            cardadd = 11;
        }
        total = total + parseInt(cardadd)
    }
    while (ace > 0 && total > 21) {
        ace = ace - 1;
        total = total - 10;
    }
    return total;
}

function startGame() {
    if (blackJack.phase !== "") {
        throw "Game has already started";
    }
    blackjackbot.sendAll("A new blackjack game has started!", blackjackchan);
    blackjackbot.sendAll("You have 30 seconds to join!", blackjackchan);
    blackJack.phase = "joining";
    sys.setTimer(function () {
        startRound()
    }, 30000, false);
}

function joinGame(src) {
    if (blackJack.phase !== "joining") {
        throw "You cannot join now!";
    }
    if (blackJack.players.hasOwnProperty(src)) {
        throw "You already joined!";
    }
    blackJack.players[src] = {
        name: sys.name(src),
        cards: [],
        out: false,
        total: 0,
        type: "normal"
    };
    blackjackbot.sendAll(sys.name(src) + " joined the game!");
}

function startRound() {
    if (blackJack.phase !== "joining") {
        return;
    }
    if (Object.keys(blackJack.players).length < 1) {
        blackjackbot.sendAll("Not enough players", blackjackchan);
        return;
    }
    blackJack.phase = "playing";
    for (var x in blackJack.players) {
        if (blackJack.players.hasOwnProperty(x)) {
            var player = blackJack.players[x];
            var name = player.name;
            var cards = player.cards.push(getCard(), getCard());
            var total = checkTotal(cards);
            player.total = total;
            blackjackbot.sendAll(name + "'s cards are " + cards + ". Total: " + total + ".");
            if (total == 21) {
                blackjackbot.sendAll(name + " got blackjack!");
                player.type = "blackjack";
                player.out = true;
                //checkGame();
            }
        }
    }
}


//exports to main script
module.exports = {
    init: init,
    handleCommand: handleCommand,
    onHelp: onHelp
};