/*jshint noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50 */
/*global sys:true, hangbot.sendAll:true, sendChanHtmlAll:true, module:true, SESSION:true */
module.exports = function () {
    var hangman = this;
    var hangchan;

    var defaultMaster = "RiceKirby";
    var defaultChannel = "Hangman";
    var defaultParts = 7;
    var minBodyParts = 5;
    var winnerDelay = 60;
    var answerDelay = 10;
    var maxAnswers = 3;

    var host;
    var hostName;
    var winner;
    var nextGame;

    var word;
    var currentWord = [];
    var usedLetters = [];
    var hint = "";
    var parts;

    var points;
    var misses;
    var answers;
    
    var Bot = require("bot.js").Bot;
    var hangbot = new Bot("Unown");
    
    this.lastAdvertise = 0;
    this.guessCharacter = function (src, commandData) {
        if (sys.ip(src) === host) {
            hangbot.sendMessage(src, "You started the game, so you can't answer!", hangchan);
            return;
        }
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).hangmanTime) {
            hangbot.sendMessage(src, "You need to wait for another " + (Math.floor((SESSION.users(src).hangmanTime - now) / 1000) + 1) + " seconds before submitting another guess!", hangchan);
            return;
        }
        var letter = commandData.toLowerCase();
        if (letter.length > 1) {
            hangbot.sendMessage(src, "This is not a valid answer!", hangchan);
            return;
        }
        if ("abcdefghijklmnopqrstuvwxyz".indexOf(letter) === -1) {
            hangbot.sendMessage(src, "This is not a valid answer!", hangchan);
            return;
        }
        if (usedLetters.indexOf(letter) >= 0) {
            hangbot.sendMessage(src, "This letter was already used!", hangchan);
            return;
        }

        if (!points[sys.name(src)]) {
            points[sys.name(src)] = 0;
        }

        var p = 0, correct = false, e;
        if (word.indexOf(letter) >= 0) {
            correct = true;
            for (e = 0; e < word.length; e++) {
                if (word[e].toLowerCase() === letter) {
                    currentWord[e] = letter.toUpperCase();
                    ++p;
                }
            }
        }

        usedLetters.push(commandData.toLowerCase());
        sendChanHtmlAll(" ", hangchan);
        hangbot.sendAll("" + sys.name(src) + " guessed " + letter.toUpperCase() + " and got it " + (correct ? "right (" + p + " points)" :"wrong") + "! Current Word: " + currentWord.join(" ") + "", hangchan);

        if (currentWord.indexOf("_") === -1) {
            this.applyPoints(src, p + 2);
            hangbot.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " completed the word '" + currentWord.join("") + "'!", hangchan);
            this.countPoints();
            hangbot.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
        } else {
            if (!correct) {
                this.addMiss(src);
                parts--;
            }
            if (parts > 0) {
                hangbot.sendAll("[Hint: " + hint + "]  [Letters used: " +  usedLetters.map(function (x) { return x.toUpperCase(); }).join(", ") + "]  [Chances left: " + parts + "] ", hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.applyPoints(src, p);
                SESSION.users(src).hangmanTime = (new Date()).getTime() + answerDelay * 1000;
            } else {
                hangbot.sendAll("*** ************************************************************ ***", hangchan);
                hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' correctly, so the host (" + hostName + ") has won this game!", hangchan);
                hangbot.sendAll("*** ************************************************************ ***", hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.setWinner(hostName);
            }
        }
    };
    this.submitAnswer = function (src, commandData) {
        if (sys.ip(src) === host) {
            hangbot.sendMessage(src, "You started the game, so you can't answer!", hangchan);
            return;
        }
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).hangmanTime) {
            hangbot.sendMessage(src, "You need to wait for another " + (Math.floor((SESSION.users(src).hangmanTime - now) / 1000) + 1) + " seconds before submitting another guess!", hangchan);
            return;
        }
        if (sys.name(src) in answers && answers[sys.name(src)] >= maxAnswers) {
            hangbot.sendMessage(src, "You can only use /a " + maxAnswers + " times!", hangchan);
            return;
        }
        var ans = commandData.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g,'');

        sendChanHtmlAll(" ", hangchan);
        hangbot.sendAll("" + sys.name(src) + " answered " + ans + "!", hangchan);
        if (ans.toLowerCase() === word.toLowerCase()) {
            var p = 0, e;
            for (e in currentWord) {
                if (currentWord[e] === "_") {
                    p++;
                }
            }
            p = Math.floor(p * 1.34);
            this.applyPoints(src, p);

            hangbot.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " answered correctly and got " + p + " points!", hangchan);
            this.countPoints();
            hangbot.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
        } else {
            this.addMiss(src);
            this.addAnswerUse(src);
            hangbot.sendAll("" + sys.name(src) + "'s answer was wrong! The game continues!", hangchan);
            sendChanHtmlAll(" ", hangchan);
            SESSION.users(src).hangmanTime = (new Date()).getTime() + answerDelay * 2000;
        }
    };
    this.startGame = function (src, commandData) {
        if (word) {
            hangbot.sendMessage(src, "A game is already running! You can start a new one once this game is over!", hangchan);
            return;
        }
        if (winner && (new Date()).getTime() < nextGame && sys.name(src).toLowerCase() !== winner.toLowerCase()) {
            hangbot.sendMessage(src, "Only the last winner can start a game! If the winner takes more than " + winnerDelay + " seconds, anyone can start a new game!", hangchan);
            return;
        }
        var a = commandData.split(":")[0];
        var h = commandData.split(":")[1];
        var p = commandData.split(":")[2];

        if (!a) {
            hangbot.sendMessage(src, "You need to choose a word!", hangchan);
            return;
        }
        var validCharacters = "abcdefghijklmnopqrstuvwxyz", validAnswer = false, l;
        for (l = 0; l < a.length; l++) {
            if (validCharacters.indexOf(a[l].toLowerCase()) !== -1) {
                validAnswer = true;
                break;
            }
        }
        if (!validAnswer) {
            hangbot.sendMessage(src, "Answer must containt at least one valid letter (A-Z characters)!", hangchan);
            return;
        }
        if (!h) {
            hangbot.sendMessage(src, "You need to write a hint!", hangchan);
            return;
        }
        a = a.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g,'').toLowerCase();
        if (a.length > 60 || a.length < 4) {
            hangbot.sendMessage(src, "Your answer cannot be longer than 60 characters or shorter than 4 characters!", hangchan);
            return;
        }
        hint = h;
        word = a;
        parts = (p && parseInt(p, 10) > 0) ? parseInt(p, 10) : defaultParts;
        parts = (parts < minBodyParts) ? minBodyParts : parts;
        points = {};
        misses = {};
        answers = {};

        usedLetters = [];
        currentWord = [];
        var e;
        for (e = 0; e < word.length; e++) {
            if (word[e] === " " || word[e] === "-") {
                currentWord.push("-");
            } else if (validCharacters.indexOf(word[e]) !== -1) {
                currentWord.push("_");
            } else {
                currentWord.push(word[e].toUpperCase());
            }
        }

        host = sys.ip(src);
        hostName = sys.name(src);

        sendChanHtmlAll(" ", hangchan);
        hangbot.sendAll("*** ************************************************************ ***", hangchan);
        hangbot.sendAll(sys.name(src) + " started a new game of Hangman!", hangchan);
        hangbot.sendAll(currentWord.join(" "), hangchan);
        hangbot.sendAll(hint, hangchan);
        hangbot.sendAll("*** ************************************************************ ***", hangchan);
        sendChanHtmlAll(" ", hangchan);
        var time = parseInt(sys.time(), 10);
        if (time > this.lastAdvertise + 60 * 20) {
            this.lastAdvertise = time;
            hangbot.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new game of Hangman started in #Hangman!", 0)
            hangbot.sendAll("*** ************************************************************ ***", 0);
        }
    };
    this.applyPoints = function (src, p) {
        if (!points[sys.name(src)]) {
            points[sys.name(src)] = 0;
        }
        points[sys.name(src)] += p;
    };
    this.addMiss = function (src) {
        if (!misses[sys.name(src)]) {
            misses[sys.name(src)] = 0;
        }
        misses[sys.name(src)] += 1;
    };
    this.addAnswerUse = function(src) {
        if (!answers[sys.name(src)]) {
            answers[sys.name(src)] = 0;
        }
        answers[sys.name(src)] += 1;
    };
    this.countPoints = function () {
        var maxPoints = 0, winners = [], w;
        for (w in points) {
            if (points[w] > maxPoints) {
                winners = [];
                maxPoints = points[w];
            }
            if (points[w] === maxPoints) {
                winners.push(w);
            }
        }
        if (winners.length > 1) {
            var m, miss = [], nomiss = [], minMiss = Number.MAX_VALUE;
            for (m in winners) {
                var n = winners[m];
                if (n in misses) {
                    if (misses[n] < minMiss) {
                        miss = [];
                        minMiss = misses[n];
                    }
                    miss.push(n);
                } else {
                    nomiss.push(n);
                }
            }
            if (nomiss.length > 0) {
                if (nomiss.length === 1) {
                    w = nomiss[0];
                } else {
                    w = nomiss[0];
                }
            } else {
                if (miss.length === 1) {
                    w = miss[0];
                } else {
                    w = miss[0];
                }
            }
        } else {
            w = winners[0];
        }
        hangbot.sendAll("" + w + " has won this game with " + maxPoints + " points!", hangchan);
        var ranking = [], p;
        for (p in points) {
            ranking.push(p + " (" + points[p] + " points" + (p in misses ? ", " + misses[p] + " miss(es)" : "") + ")");
        }
        hangbot.sendAll("±Results: " + ranking.join(", "), hangchan);
        this.setWinner(w);
    };
    this.setWinner = function (name) {
        word = undefined;
        winner = name;
        nextGame = (new Date()).getTime() + winnerDelay * 1000;
        this.resetTimers();
    };
    this.passWinner = function(src, commandData) {
        if (word !== undefined) {
            hangbot.sendMessage(src, "A game is already running!", hangchan);
            return;
        }
        if (sys.name(src) !== winner && hangman.authLevel(src) < 1) {
            hangbot.sendMessage(src, "You are not the last winner or auth!", hangchan);
            return;
        }
        if (hangman.authLevel(src)< 1 && (new Date()).getTime() > nextGame) {
            hangbot.sendMessage(src, winnerDelay + " seconds already passed! Anyone can start a game now!", hangchan);
            return;
        }
        if (sys.id(commandData) == undefined || !sys.isInChannel(sys.id(commandData), hangchan) || sys.name(sys.id(commandData)) == winner) {
            hangbot.sendMessage(src, "You cannot pass start rights to this person!", hangchan);
            return;
        }
        this.setWinner(sys.name(sys.id(commandData)));
        hangbot.sendAll("" + sys.name(src) + " has passed starting rights to " + commandData + "!", hangchan);
    };
    this.endGame = function (src) {
        if (word) {
            sendChanHtmlAll(" ", hangchan);
            hangbot.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " stopped the game!", hangchan);
            hangbot.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            word = undefined;
            winner = undefined;
            this.resetTimers();
        } else {
            hangbot.sendMessage(src, "No game is running!", hangchan);
        }
    };
    this.resetTimers = function () {
        var p, players = sys.playersOfChannel(hangchan), now = (new Date()).getTime();
        for (p in players) {
            SESSION.users(players[p]).hangmanTime = now;
        }
    };
    this.viewGame = function (src) {
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        sys.sendHtmlMessage(src, " ", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'><b>Current Word</b>: " + currentWord.join(" ") + "</font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>[Hint: " + hint + "]  [Letters used: " +  usedLetters.map(function (x) { return x.toUpperCase(); }).join(", ") + "]  [Chances left: " + parts + "] </font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>Current game started by " + hostName + "</font>", hangchan);
        sys.sendHtmlMessage(src, " ", hangchan);
    };
    this.showHelp = function (src) {
        var x, help = [
            "",
            "*** *********************************************************************** ***",
            "±Goal: Your goal is to guess a word on a letter by letter basis. A hint and the number of characters will be provided as a help.",
            "±Goal: Whenever someone guess a letter correctly, that letter will be filled in the word.",
            "*** *********************************************************************** ***",
            "±Actions: To see the current puzzle, type /view.",
            "±Actions: To guess a character, type /g [character]. For example, to guess F, type /g F.",
            "±Actions: If you think you already know the answer, you can use /a [answer] to submit a full answer.",
            "±Actions: If you guess wrong too many times, the host wins!",
            "*** *********************************************************************** ***",
            "±Hosting: To host a game, type /start Answer:Hint. The host can't guess or answer during their own game.",
            "±Hosting: You can also type /start Answer:Hint:Number to set how many wrong guesses must be made before you win (minimum of " + minBodyParts + ").",
            "±Hosting: The winner of the previous game has priority for hosting the next game, and may use /pass User to give that priority to another user.",
            "±Hosting: If the user with hosting priority doesn't start a new game within " + winnerDelay + " seconds, anyone can host.",
            "*** *********************************************************************** ***",
            "±Rules: Do not ask the person with hosting priority to use /pass so that you may host a game.",
            "±Rules: Do not create inappropriate answers, hints or guesses.",
            "±Rules: Do not complain if another user guesses a letter, word or answer before you do.",
            "±Rules: Do not create an answer that is impossible for other people to guess, such as a personal nickname.",
            "±Rules: All server rules apply in this channel too - type /rules to view them.",
            "*** *********************************************************************** ***",
            ""
        ];
        for (x in help) {
            hangbot.sendMessage(src, help[x], hangchan);
        }
    };
    this.configGame = function (src, commandData) {
        var param = commandData.split(":")[0];
        var val = commandData.split(":")[1];
        if (!param || !val) {
            sys.sendHtmlMessage(src, " ", hangchan);
            hangbot.sendMessage(src, "±How to use /config: Use /config [parameter]:[value]. Possible parameters are:", hangchan);
            hangbot.sendMessage(src, "chances: Set minimum number of chances for any game (currently set to " + minBodyParts + " chances). ", hangchan);
            hangbot.sendMessage(src, "delay: Set delay (in seconds) between each guess. Full answers take double the time (currently set to " + answerDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "winner: Set how many seconds the winner of a game have to start a new one before anyone can start (currently set to " + winnerDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "answers: Set how many times each player can use /a (currently set to " + maxAnswers + " seconds). ", hangchan);
            sys.sendHtmlMessage(src, " ", hangchan);
            return;
        }
        if (parseInt(val, 10) <= 0) {
            hangbot.sendMessage(src, "Value must be a valid number!", hangchan);
            return;
        }
        val = parseInt(val, 10);

        switch (param.toLowerCase()) {
        case "chances":
            minBodyParts = val;
            hangbot.sendMessage(src, "Minimum chances set to " + val + ".", hangchan);
            break;
        case "delay":
            answerDelay = val;
            hangbot.sendMessage(src, "Delay between guesses set to " + val + " second(s).", hangchan);
            break;
        case "winner":
            winnerDelay = val;
            hangbot.sendMessage(src, "Winner will have " + val + " second(s) to start a new game.", hangchan);
            break;
        case "answers":
            maxAnswers = val;
            hangbot.sendMessage(src, "Players can use /a " + val + " time per game.", hangchan);
            break;
        }
    };
    this.hangcommands = {
        user: {
            help: [this.showHelp, "For a how-to-play guide"],
            g: [this.guessCharacter, "To guess a letter."],
            a: [this.submitAnswer, "To answer the question."],
            view: [this.viewGame, "To view the current game's state."],
            start: [this.startGame, "To start a new game of Hangman."],
            pass: [this.passWinner, "To pass start rights to someone else. "]
        },
        op: {
            end: [this.endGame, "To stop a game."]
        },
        admin: {
            config: [this.configGame, "To change the answer delay time and other settings."]
        }
    };
    this.handleCommand = function (src, message, channel) {
        if (channel !== hangchan) {
            return;
        }
        try {
            var command;
            var commandData = '*';
            var pos = message.indexOf(' ');
            if (pos !== -1) {
                command = message.substring(0, pos).toLowerCase();
                commandData = message.substr(pos + 1);
            } else {
                command = message.substr(0).toLowerCase();
            }
            if (command in hangman.hangcommands.user) {
                hangman.hangcommands.user[command][0].call(hangman, src, commandData);
                return true;
            }

            if (sys.ip(src) === host && command === "end") {
                hangman.hangcommands.op[command][0].call(hangman, src, commandData);
                return true;
            }

            if (hangman.authLevel(src) < 1) {
                throw ("No valid command");
            }

            if (command in hangman.hangcommands.op) {
                hangman.hangcommands.op[command][0].call(hangman, src, commandData);
                return true;
            }

            if (hangman.authLevel(src) < 2) {
                throw ("No valid command");
            }

            if (command in hangman.hangcommands.admin) {
                hangman.hangcommands.admin[command][0].call(hangman, src, commandData);
                return true;
            }

            throw ("No valid command");
        } catch (e) {
            if (e !== "No valid command") {
                hangbot.sendAll("Error on hangman command: " + e, hangchan);
                return true;
            }
        }
    };
    this.authLevel = function (src) {
        if (sys.auth(src) > 0) {
            return 3;
        } else if (SESSION.channels(hangchan).masters.indexOf(sys.name(src).toLowerCase()) !== -1) {
            return 3;
        } else if (SESSION.channels(hangchan).admins.indexOf(sys.name(src).toLowerCase()) !== -1) {
            return 2;
        } else if (SESSION.channels(hangchan).operators.indexOf(sys.name(src).toLowerCase()) !== -1) {
            return 1;
        }
        return 0;
    };
    this.init = function () {
        var name = defaultChannel;
        if (sys.existChannel(name)) {
            hangchan = sys.channelId(name);
        } else {
            hangchan = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(hangchan);
        SESSION.channels(hangchan).perm = true;
        SESSION.channels(hangchan).master = defaultMaster;
    };
    this.beforeChannelJoin = function (src, channel) {
        if (channel !== hangchan) {
            return false;
        }
        if (SESSION.users(src).hangmanTime === undefined) {
            SESSION.users(src).hangmanTime = (new Date()).getTime();
        }
        return false;
    };
    this.afterChannelJoin = function(src, channel) {
        if (channel == hangchan) {
            hangman.viewGame(src);
        }
        return false;
    };
    return {
        init: hangman.init,
        handleCommand: hangman.handleCommand,
        beforeChannelJoin: hangman.beforeChannelJoin,
        afterChannelJoin: hangman.afterChannelJoin
    };
}();