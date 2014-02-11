/* hangman.js
    TODO:
    Check if Auto-Game answers have no invalid character
    Make sure submitted games are valid
*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys:true, sendChanHtmlAll:true, module:true, SESSION:true, hangmanchan, hangbot, require, script, sachannel, getTimeString */

var nonFlashing = require("utilities.js").non_flashing;
var html_escape = require("utilities.js").html_escape;

module.exports = function () {
    var hangman = this;
    var hangchan;

    var defaultChannel = "Hangman";
    var defaultParts = 7;
    var minBodyParts = 5;
    var winnerDelay = 60;
    var answerDelay = 7;
    var maxAnswers = 3;
    
    var autoGamesFile = "hangmanq.txt";
    var idleCount = 0;
    var idleLimit = 1800;
    var eventCount = 0;
    var eventLimit = 1800;
    var autoGames;
    var eventGames = false;

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


    this.lastAdvertise = 0;
    this.guessCharacter = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
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
        if (SESSION.users(src).smute.active) {
            hangbot.sendMessage(src, "You need to wait for another 9 seconds before submitting another guess!", hangchan);
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

        var p = 0,
            correct = false,
            e;
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
        hangbot.sendAll("" + sys.name(src) + " guessed " + letter.toUpperCase() + " and got it " + (correct ? "right (" + p + (p == 1 ? " point)" : " points)") : "wrong") + "! Current Word: " + currentWord.join(" ") + "", hangchan);

        if (currentWord.indexOf("_") === -1) {
            this.applyPoints(src, p + 2);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " completed the word '" + currentWord.join("") + "'!", hangchan);
            this.countPoints();
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            hangbot.sendAll("Type /start [answer]:[hint] to start a new game. If you didn't win then wait " + winnerDelay + " seconds.", hangchan);
        }
        else {
            if (!correct) {
                this.addMiss(src);
                parts--;
            }
            if (parts > 0) {
                hangbot.sendAll("[Hint: " + hint + "]  [Letters used: " + usedLetters.map(function (x) {
                    return x.toUpperCase();
                }).join(", ") + "]  [Chances left: " + parts + "] ", hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.applyPoints(src, p);
                SESSION.users(src).hangmanTime = (new Date()).getTime() + answerDelay * 1000;
            }
            else {
                sys.sendAll("*** ************************************************************ ***", hangchan);
                hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' correctly, so the host (" + hostName + ") has won this game!", hangchan);
                sys.sendAll("*** ************************************************************ ***", hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.setWinner(hostName, (host === null && hostName == hangbot.name));
            }
        }
    };
    this.submitAnswer = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
        if (sys.ip(src) === host) {
            hangbot.sendMessage(src, "You started the game, so you can't answer!", hangchan);
            return;
        }
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        if (commandData.length < 4) {
            hangbot.sendMessage(src, "The answer must have at least four letters!", hangchan);
            return;
        }
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).hangmanTime) {
            hangbot.sendMessage(src, "You need to wait for another " + (Math.floor((SESSION.users(src).hangmanTime - now) / 1000) + 1) + " seconds before submitting another guess!", hangchan);
            return;
        }
        if (SESSION.users(src).smute.active) {
            hangbot.sendMessage(src, "You need to wait for another 9 seconds before submitting another guess!", hangchan);
            return;
        }
        if (sys.name(src) in answers && answers[sys.name(src)] >= maxAnswers) {
            hangbot.sendMessage(src, "You can only use /a " + maxAnswers + " times!", hangchan);
            return;
        }
        var ans = commandData.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g, '');
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|\banus|boner|\btits\b|condom|\brape\b/gi.test(ans)) {
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " answered '" + ans + "' in #Hangman", sys.channelId("Victory Road"));
        }
        sendChanHtmlAll(" ", hangchan);


        sendChanHtmlAll(" ", hangchan);
        hangbot.sendAll("" + sys.name(src) + " answered " + ans + "!", hangchan);
        if (ans.toLowerCase() === word.toLowerCase()) {
            var p = 0,
                e;
            for (e in currentWord) {
                if (currentWord[e] === "_") {
                    p++;
                }
            }
            p = Math.floor(p * 1.34);
            this.applyPoints(src, p);

            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " answered correctly and got " + p + " points!", hangchan);
            this.countPoints();
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            hangbot.sendAll("Type /start [answer]:[hint] to start a new game. If you didn't win then wait " + winnerDelay + " seconds.", hangchan);
        }
        else {
            this.addMiss(src);
            this.addAnswerUse(src);
            hangbot.sendAll("" + sys.name(src) + "'s answer was wrong! The game continues!", hangchan);
            sendChanHtmlAll(" ", hangchan);
            SESSION.users(src).hangmanTime = (new Date()).getTime() + answerDelay * 2000;
        }
    };
    this.startGame = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
        if (word) {
            hangbot.sendMessage(src, "A game is already running! You can start a new one once this game is over!", hangchan);
            return;
        }
        if (SESSION.users(src).smute.active || winner && (new Date()).getTime() < nextGame && sys.name(src).toLowerCase() !== winner.toLowerCase()) {
            hangbot.sendMessage(src, "Only the last winner can start a game! If the winner takes more than " + winnerDelay + " seconds, anyone can start a new game!", hangchan);
            return;
        }
        var data = commandData.split(":");
        var a = data[0];
        var h = data[1];
        var p = data.length < 3 ? defaultParts : data[2];

        if (!a) {
            hangbot.sendMessage(src, "You need to choose a word!", hangchan);
            return;
        }
        var validCharacters = "abcdefghijklmnopqrstuvwxyz",
            validAnswer = false,
            l;
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
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|\banus|boner|\btits\b|condom|\brape\b/gi.test(h)) {
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " made the hint '" + h + "' in #Hangman", sys.channelId("Victory Road"));
        }
        a = a.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g, '').toLowerCase();
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|\banus|boner|\btits\b|condom|\brape\b/gi.test(a)) {
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " made the answer '" + a + "' in #Hangman", sys.channelId("Victory Road"));
        }
        if (a.length > 60 || a.length < 4) {
            hangbot.sendMessage(src, "Your answer cannot be longer than 60 characters or shorter than 4 characters!", hangchan);
            return;
        }
        
        
        this.createGame(sys.name(src), a, h, p, src);
    };
    
    this.createGame = function (name, a, h, p, src) {
        var validCharacters = "abcdefghijklmnopqrstuvwxyz";
        
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
            }
            else if (validCharacters.indexOf(word[e]) !== -1) {
                currentWord.push("_");
            }
            else {
                currentWord.push(word[e].toUpperCase());
            }
        }

        host = src ? sys.ip(src) : null;
        hostName = name;

        sendChanHtmlAll(" ", hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        hangbot.sendAll(hostName + " started a new game of Hangman!", hangchan);
        hangbot.sendAll(currentWord.join(" "), hangchan);
        hangbot.sendAll(hint, hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        sendChanHtmlAll(" ", hangchan);
        if (src) {
            hangbot.sendMessage(src, "You started a Hangman game with the answer '" + word.toUpperCase() + "'. If you mispelled the answer or made some mistake, use /end to stop the game and fix it.", hangchan);
        }
        hangbot.sendAll("Type /g [letter] to guess a letter, and /a [answer] to guess the answer!", hangchan);
        sendChanHtmlAll(" ", hangchan);
        var time = parseInt(sys.time(), 10);
        if (time > this.lastAdvertise + 60 * 20) {
            this.lastAdvertise = time;
            sys.sendAll("", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new game of Hangman started in #Hangman!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            sys.sendAll("", 0);
        }
    };
    this.startAutoGame = function() {
        var randomGame = autoGames[sys.rand(0, autoGames.length)].split(":");
        var a = randomGame[0].toLowerCase(),
            h = randomGame[1],
            p = randomGame.length < 3 ? defaultParts : randomGame[2];
        this.createGame(hangbot.name, a, h, p, null);
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
    this.addAnswerUse = function (src) {
        if (!answers[sys.name(src)]) {
            answers[sys.name(src)] = 0;
        }
        answers[sys.name(src)] += 1;
        hangbot.sendMessage(src, "You can only use /a " + (maxAnswers - answers[sys.name(src)]) + " more times!", hangchan);
    };
    this.countPoints = function () {
        var maxPoints = 0,
            winners = [],
            w;
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
            var m, miss = [],
                nomiss = [],
                minMiss = Number.MAX_VALUE;
            for (m in winners) {
                var n = winners[m];
                if (n in misses) {
                    if (misses[n] < minMiss) {
                        miss = [];
                        minMiss = misses[n];
                    }
                    miss.push(n);
                }
                else {
                    nomiss.push(n);
                }
            }
            if (nomiss.length > 0) {
                if (nomiss.length === 1) {
                    w = nomiss[0];
                }
                else {
                    w = nomiss[0];
                }
            }
            else {
                if (miss.length === 1) {
                    w = miss[0];
                }
                else {
                    w = miss[0];
                }
            }
        }
        else {
            w = winners[0];
        }
        hangbot.sendAll("" + w + " has won this game with " + maxPoints + " points!", hangchan);
        var ranking = [],
            p;
        for (p in points) {
            ranking.push(p + " (" + points[p] + " points" + (p in misses ? ", " + misses[p] + " miss(es)" : "") + ")");
        }
        sys.sendAll("±Results: " + ranking.join(", "), hangchan);
        this.setWinner(w);
    };
    this.setWinner = function (name, immediate) {
        word = undefined;
        winner = name;
        if (immediate !== true) {
            nextGame = (new Date()).getTime() + winnerDelay * 1000;
        }
        this.resetTimers();
    };
    this.passWinner = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
        if (word !== undefined) {
            hangbot.sendMessage(src, "A game is already running!", hangchan);
            return;
        }
        if (sys.name(src) !== winner && hangman.authLevel(src) < 1) {
            hangbot.sendMessage(src, "You are not the last winner or auth!", hangchan);
            return;
        }
        if (hangman.authLevel(src) < 1 && (new Date()).getTime() > nextGame) {
            hangbot.sendMessage(src, winnerDelay + " seconds already passed! Anyone can start a game now!", hangchan);
            return;
        }
        if (sys.id(commandData) === undefined || !sys.isInChannel(sys.id(commandData), hangchan) || sys.name(sys.id(commandData)) == winner) {
            hangbot.sendMessage(src, "You cannot pass start rights to this person!", hangchan);
            return;
        }
        this.setWinner(sys.name(sys.id(commandData)));
        hangbot.sendAll("" + sys.name(src) + " has passed starting rights to " + commandData + "!", hangchan);
    };
    this.endGame = function (src) {
        if (word) {
            sendChanHtmlAll(" ", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " stopped the game!", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " stopped the game in #Hangman", sys.channelId("Victory Road"));
            word = undefined;
            winner = undefined;
            this.resetTimers();
        }
        else {
            hangbot.sendMessage(src, "No game is running!", hangchan);
        }
    };
    this.resetTimers = function () {
        var p, players = sys.playersOfChannel(hangchan),
            now = (new Date()).getTime();
        for (p in players) {
            SESSION.users(players[p]).hangmanTime = now;
        }
        idleCount = 0;
    };
    this.viewGame = function (src) {
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        sys.sendMessage(src, " ", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'><b>Current Word</b>: " + currentWord.join(" ") + "</font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>[Hint: " + hint + "]  [Letters used: " + usedLetters.map(function (x) {
            return x.toUpperCase();
        }).join(", ") + "]  [Chances left: " + parts + "] </font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>Current game started by " + hostName + "</font>", hangchan);
        hangbot.sendMessage(src, "Type /g [letter] to guess a letter, and /a [answer] to guess the answer!", hangchan);
        sys.sendMessage(src, " ", hangchan);
    };
    this.showRules = function (src) {
        var rules = [
            "",
            "*** *********************************************************************** ***",
            "±Rules: Do not ask the person with hosting priority to use /pass so that you may host a game.",
            "±Rules: Do not create inappropriate answers, hints or guesses.",
            "±Rules: Do not complain if another user guesses a letter, word or answer before you do.",
            "±Rules: Do not attempt to troll the game in any way, shape or form, such as guessing uncommon letters for the sole purpose of spoiling the game.",
            "±Rules: Using multiple alts in an attempt to spoil the game is prohibited, and will be infracted heavily.",
            "±Rules: Do not create an answer that is impossible for other people to guess, such as a personal nickname or an opinion.",
            "±Rules: Always create a satisfactory hint for the game in question – never leave this intentionally blank or vague.",
            "±Rules: Make sure that your game is spelled correctly before submitting it.",
            "±Rules: Creating complex games in other languages is not encouraged. Simple games are fine (eg. the word ‘fraise’ with the hint of ‘French fruit’), but games of a more difficult nature should be avoided to make the game accessible.",
            "±Rules: All games have a minimum character amount of 4, and a maximum of 50 characters. Any games that breach on either side of this limit will be ended, and you may be infracted.",
            "±Rules: Do not spoil the answer for the rest of the channel, as that ruins the game.",
            "±Rules: Hangman Admins, or HAs, are here for the benefit of the channel. If you are asked to do something by a HA, it is advised you do so. Insulting of HAs will result in punishment.",
            "±Rules: All server rules apply in this channel too - type /rules to view them.",
            "±Rules: If you have doubts or think someone is breaking the rules, use /hadmins to see a list of people who may help!",
            "*** *********************************************************************** ***",
            ""
        ];
        for (var x = 0; x < rules.length; x++) {
            sys.sendMessage(src, rules[x], hangchan);
        }
    };
    this.showHelp = function (src) {
        var x, help = [
            "",
            "*** *********************************************************************** ***",
            "±Goal: Your goal is to guess a word on a letter by letter basis. A hint and the number of characters will be provided as a help.",
            "±Goal: Whenever someone guess a letter correctly, that letter will be filled in the word.",
            "*** *********************************************************************** ***",
            "±Actions: To see the current puzzle, type /view.",
            "±Actions: To guess a character, type /g or /guess [character]. For example, to guess F, type /g F.",
            "±Actions: If you think you already know the answer, you can use /a or /answer [answer] to submit a full answer.",
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
            "±Rules: Do not attempt to troll the game in any way, shape or form, such as guessing uncommon letters for the sole purpose of spoiling the game.",
            "±Rules: Using multiple alts in an attempt to spoil the game is prohibited, and will be infracted heavily.",
            "±Rules: Do not create an answer that is impossible for other people to guess, such as a personal nickname or an opinion.",
            "±Rules: Always create a satisfactory hint for the game in question – never leave this intentionally blank or vague.",
            "±Rules: Make sure that your game is spelled correctly before submitting it.",
            "±Rules: Creating complex games in other languages is not encouraged. Simple games are fine (eg. the word ‘fraise’ with the hint of ‘French fruit’), but games of a more difficult nature should be avoided to make the game accessible.",
            "±Rules: All games have a minimum character amount of 4, and a maximum of 50 characters. Any games that breach on either side of this limit will be ended, and you may be infracted.",
            "±Rules: Do not spoil the answer for the rest of the channel, as that ruins the game.",
            "±Rules: Hangman Admins, or HAs, are here for the benefit of the channel. If you are asked to do something by a HA, it is advised you do so. Insulting of HAs will result in punishment.",
            "±Rules: All server rules apply in this channel too - type /rules to view them.",
            "±Rules: If you have doubts or think someone is breaking the rules, use /hadmins to see a list of people who may help!",
            "*** *********************************************************************** ***",
            ""
            ];
        for (x in help) {
            sys.sendMessage(src, help[x], hangchan);
        }
    };
    
    this.autoGame = function (commandData) {
        if(commandData === undefined) {
            if(autoGames === true) {
                hangman.sendMessage("Games are set to automatically start.");
                return;
            }
            else {
                hangman.sendMessage("Games are set to not automatically start.");
                return;
            }
        }
        var turning = commandData.toLowerCase();
        if(turning == "off") {
            if(autoGames === false) {
                hangman.sendMessage("Automatic games are already turned off.");
                return;
            }
            else {
                autoGames = false;
                hangman.sendMessage("You turned off Automatic games.");
                return;
            }
        }
        if(turning == "on") {
            if (autoGames === true) {
                hangman.sendMessage("Automatic games are already turned on.");
                return;
            }
            else {
                autoGames = true;
                hangman.sendMessage("You turned on Automatic games.");
                return;
            }
        }
    };
    
    this.eventGame = function(commandData) {
        if(commandData === undefined) {
            if(eventGame === true) {
                hangman.sendMessage("Event Games are set to start.");
                return;
            }
            else {
                hangman.sendMessage("Event Games are not set to start.");
                return;
            }
        }
        var some = commandData.toLowerCase();
        if(some == "off") {
            if(eventGames === false) {
                hangman.sendMessage("Event Games are already turned off.");
                return;
            }
            else {
                eventGames = false;
                hangman.sendMessage("Event Games have been turned off.");
                return;
            }
        }
        if(some == "on") {
            if(eventGames === true) {
                hangman.sendMessage("Event Games are already turned on.");
                return;
            }
            else {
                eventGames = false;
                hangman.sendMessage("Event games have been turned on.");
                return;
            }
        }
    };
    
    this.addQuest = function(src, commandData) {
        if(commandData === undefined) {
            return;
        }
        var newQ = commandData.toLowerCase();
        autoGames.push(newQ);
        sys.write("hangmanq.txt", JSON.stringify(quests));
        hangabot.sendMessage(src, "You have successfully added a new question!");
        return;
        }
    };
    
      this.configGame = function (src, commandData) {
        if (commandData === undefined) {
            commandData = "*";
        }
        var param = commandData.split(":")[0];
        var val = commandData.split(":")[1];
        if (!param || !val) {
            sys.sendMessage(src, " ", hangchan);
            hangbot.sendMessage(src, "How to use /config: Use /config [parameter]:[value]. Possible parameters are:", hangchan);
            hangbot.sendMessage(src, "chances: Set minimum number of chances for any game (currently set to " + minBodyParts + " chances). ", hangchan);
            hangbot.sendMessage(src, "delay: Set delay (in seconds) between each guess. Full answers take double the time (currently set to " + answerDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "winner: Set how many seconds the winner of a game have to start a new one before anyone can start (currently set to " + winnerDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "answers: Set how many times each player can use /a (currently set to " + maxAnswers + " seconds). ", hangchan);
            hangbot.sendMessage(src, "idle: Set how many minutes the channel must be idle for game to automatically start. (currently set to " + idleLimit/60 + " minutes).", hangchan);
            hangbot.sendMessage(src, "event: Set how often Event Games happen.(currently set to" + eventLimit/60 + " minutes).", hangchan);
            sys.sendMessage(src, " ", hangchan);
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
        case "idle":
            idleLimit = val*60;
            hangbot.sendMessage(src, "Game will auto start after " + val + " minutes.", hangchan);
            break;
        case "event":
            eventLimit = val*60;
            hangbot.sendMessage(src, "Event games with happen ever " + val + " minutes.", hangchan);
        }
    };
    this.onHelp = function (src, topic, channel) {
        if (topic === "hangman") {
            hangman.showCommands(src, channel);
            return true;
        }
        return false;
    };
    this.showCommands = function (src, channel) {
        var userHelp = [
            "",
            "*** Hangman Commands ***",
            "/help: For a how-to-play guide.",
            "/guess: To guess a letter.",
            "/answer: To answer the question.",
            "/hangmanrules: To see the hangman rules.",
            "/view: To view the current game's state.",
            "/start: To start a new game of hangman. Format /start answer:hint:number",
            "/pass: To pass starting rights to someone else.",
            "/hangmanadmins: To see a list of hangman auth.",
            "/end: To end a game you started."
        ];
        var adminHelp = [
            "*** Hangman Admin Commands ***",
            "/hangmanban: To ban a user in hangman. Format /hangmanmute name:reason:time",
            "/hangmanunban: To hangman unban a user.",
            "/hangmanbans: Searches the hangman banlist, show full list if no search term is entered.",
            "/passha: To give your Hangman Admin powers to an alt.",
            "/autogame: To turn autogames on/off. Format /autogame on or /autogame off."
        ];
        var superAdminHelp = [
            "*** Hangman Super Admin Commands ***",
            "/config: To change the answer delay time and other settings. Format /config parameter:value. Type /config by itself to see more help.",
            "/hangmanadmin: To promote a new Hangman Admin. Use /shangmanadmin for a silent promotion.",
            "/hangmanadminoff: To demote a Hangman Admin or a Hangman Super Admin. Use /shangmanadminoff for a silent demotion.",
            "/eventgame: To turn eventgames on/off. Format /eventgame on or /eventgame off."
        ];
        var ownerHelp = [
            "*** Server owner Hangman Commands ***",
            "/hangmansuperadmin: To promote a new Hangman Super Admin. Use /shangmansuperadmin for a silent promotion.",
            "/hangmansuperadminoff: To demote a Hangman Super Admin. Use /shangmansuperadminoff for a silent demotion."
        ];
        var help = userHelp;
        if (this.authLevel(src) > 0) {
            help.push.apply(help, adminHelp);
        }
        if (this.authLevel(src) > 1) {
            help.push.apply(help, superAdminHelp);
        }
        if (this.authLevel(src) > 2) {
            help.push.apply(help, ownerHelp);
        }
        for (var x = 0; x < help.length; x++) {
            sys.sendMessage(src, help[x], channel);
        }
    };
    this["help-string"] = ["hangman: To know the hangman commands"];
    
    this.handleCommand = function (src, message, channel) {
        var command;
        var commandData;
        var pos = message.indexOf(' ');
        if (pos !== -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        }
        else {
            command = message.substr(0).toLowerCase();
        }
        if (channel !== hangchan && ["hangmanban", "hangmanunban", "hangmanbans", "hangmanmute", "hangmanunmute", "hangmanmutes", "hangmanadmins", "hadmins", "has", "passha", "hangmanadminoff", "hangmanadmin", "hangmansadmin", "hangmansuperadmin", "shangmanadmin", "shangmansuperadmin", "shangmanadminoff"].indexOf(command) === -1) {
            return;
        }
        if (command === "help") {
            hangman.showHelp(src);
            return true;
        }
        if (command === "g" || command === "guess") {
            hangman.guessCharacter(src, commandData);
            return true;
        }
        if (command === "hangmanrules" || command === "hrules") {
            hangman.showRules(src);
            return true;
        }
        if (command === "a" || command === "answer") {
            hangman.submitAnswer(src, commandData);
            return true;
        }
        if (command === "view") {
            hangman.viewGame(src);
            return true;
        }
        if (command === "start") {
            hangman.startGame(src, commandData);
            return true;
        }
        if (command === "pass") {
            hangman.passWinner(src, commandData);
            return true;
        }
        if (command === "hangmanadmins" || command === "hadmins" || command === "has") {
            hangman.hangmanAuth(src, commandData, channel);
            return true;
        }

        if (hangman.authLevel(src) < 1 && !(command === "end" && sys.ip(src) === host)) {
            return false;
        }
        var id;
        if (command == "passha") {
            var oldname = sys.name(src).toLowerCase();
            var newname = commandData.toLowerCase();
            var sHA = false;
            if (sys.dbIp(newname) === undefined) {
                sys.sendMessage(src, "±Unown: This user doesn't exist!");
                return true;
            }
            if (!sys.dbRegistered(newname)) {
                sys.sendMessage(src, "±Unown: That account isn't registered so you can't give it authority!");
                return true;
            }
            if (sys.id(newname) === undefined) {
                sys.sendMessage(src, "±Unown: Your target is offline!");
                return true;
            }
            if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                sys.sendMessage(src, "±Unown: Both accounts must be on the same IP to switch!");
                return true;
            }
            if (hangman.isHangmanAdmin(sys.id(newname)) || hangman.isHangmanSuperAdmin(sys.id(newname))) {
                sys.sendMessage(src, "±Unown: Your target is already a Hangman Admin!");
                return true;
            }
            if (hangman.isHangmanSuperAdmin(src)) {
                script.hangmanSuperAdmins.remove(oldname);
                script.hangmanSuperAdmins.add(newname, "");
                sHA = true,
            } else {
                script.hangmanAdmins.remove(oldname);
                script.hangmanAdmins.add(newname, "");
            }
            id = sys.id(commandData);
            if (id !== undefined) {
                SESSION.users(id).hangmanAdmin = true;
            }
            sys.sendAll("±Unown: " + sys.name(src) + " passed their " + (sHA ? "Super Hangman Admin powers" : "Hangman auth") + " to " + commandData.toCorrectCase(), sachannel);
            sys.sendMessage(src, "±Unown: You passed your Hangman auth to " + commandData.toCorrectCase() + "!");
            return true;
        }

        if (command === "end") {
            hangman.endGame(src);
            return true;
        }

        if (command === "hangmanmute" || command === "hangmanban") {
            hangman.hangmanMute(src, commandData);
            return true;
        }

        if (command === "hangmanunmute" || command === "hangmanunban") {
            script.unban("hmute", src, sys.id(commandData), commandData);
            return true;
        }
        
        if(command === "autogame") {
            hangman.autoGame(commandData);
            return true;
        }
        
        if(command === "eventgame") {
            hangman.eventGame(commandData);
            return;
        }
        
        if(command === "addQuest") {
            hangman.addQuest(commandData);
            return true;
        }

        if (command === "hangmanmutes" || command === "hangmanbans") {
            hangman.hangmanMuteList(src, commandData);
            return true;
        }

        if (hangman.authLevel(src) < 2) {
            return false;
        }

        if (command === "config") {
            hangman.configGame(src, commandData);
            return true;
        }

        if (command === "hangmanadmin" || command === "shangmanadmin") {
            hangman.promoteAdmin(src, commandData, channel, (command === "shangmanadmin"));
            return true;
        }

        if (command === "hangmanadminoff" || command === "shangmanadminoff") {
            hangman.demoteAdmin(src, commandData, channel, (command === "shangmanadminoff"));
            return true;
        }

        if (hangman.authLevel(src) < 3) {
            return false;
        }
        if (command === "hangmansuperadmin" || command === "shangmansuperadmin") {
            hangman.promoteSuperAdmin(src, commandData, channel, (command === "shangmansuperadmin"));
            return true;
        }

        if (command === "hangmansuperadminoff" || command === "shangmansuperadminoff") {
            hangman.demoteSuperAdmin(src, commandData, channel, (command === "shangmansuperadminoff"));
            return true;
        }
        return false;
    };
    this.hangmanMute = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
        var tar = sys.id(commandData);
        var mutetime;
        if (this.authLevel(src) > 1 || sys.auth(src) > 0) {
            mutetime = undefined;
        }
        else {
            mutetime = 86400;
        }
        script.issueBan("hmute", src, tar, commandData, mutetime);
        return;
    };
    this.hangmanMuteList = function (src, commandData) {
        require("modcommands.js").handleCommand(src, "hangmanmutes", commandData, -1);
        return;
    };
    this.hangmanAuth = function (src, commandData, channel) {
        var shas = [];
        for (var y in script.hangmanSuperAdmins.hash) {
            shas.push(y);
        }
        shas = shas.sort();
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** SUPER HANGMAN ADMINS ***", channel);
        for (var i = 0; i < shas.length; i++) {
            var id = sys.id(shas[i]);
            if(!id) {
                sys.sendMessage(src, shas[i], channel);
            }
            else {
                sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
            }
        }
        var has = [];
        for (var x in script.hangmanAdmins.hash) {
            has.push(x);
        }
        has = has.sort();
        if (script.hasAuthElements(has)) {
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** AUTH HANGMAN ADMINS ***", channel);
            for (var i = 0; i < has.length; i++) {
                if (sys.dbAuths().indexOf(has[i]) != -1) {
                    var id = sys.id(has[i]);
                    if(!id) {
                        sys.sendMessage(src, has[i], channel);
                    }
                    else {
                        sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
                    }
                    has.splice(i, 1);
                    i--;
                }
            }
        }
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** HANGMAN ADMINS ***", channel);
        for (var i = 0; i < has.length; i++) {
            var id = sys.id(has[i]);
            if(!id) {
                sys.sendMessage(src, has[i], channel);
            }
            else {
                sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
            }
        }
        sys.sendMessage(src, "", channel);
        return;
    };
    this.promoteAdmin = function (src, commandData, channel, silent) {
        if (commandData === undefined) {
            return;
        }
        if (script.hangmanAdmins.hash.hasOwnProperty(commandData.toLowerCase())) {
            sys.sendMessage(src, "±Unown: " + commandData + " is already a Hangman Admin!", channel);
            return;
        }
        script.hangmanAdmins.add(commandData.toLowerCase(), "");
        if (!silent) {
            sys.sendAll("±Unown: " + sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Hangman Admin.", hangchan);
        }
        sys.sendAll("±Unown: " + sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Hangman Admin.", sys.channelId('Victory Road'));
        return;
    };
    this.promoteSuperAdmin = function (src, commandData, channel, silent) {
        if (commandData === undefined) {
            return;
        }
        if (script.hangmanSuperAdmins.hash.hasOwnProperty(commandData.toLowerCase())) {
            sys.sendMessage(src, "±Unown: " + commandData + " is already a Super Hangman Admin!", channel);
            return;
        }
        script.hangmanSuperAdmins.add(commandData.toLowerCase(), "");
        if (!silent) {
            sys.sendAll("±Unown: " + sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Hangman Admin.", hangchan);
        }
        sys.sendAll("±Unown: " + sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Hangman Admin.", sys.channelId('Victory Road'));
        return;
    };
    this.demoteAdmin = function (src, commandData, channel, silent) {
        if (commandData === undefined) {
            return;
        }
        var isHA = script.hangmanAdmins.hash.hasOwnProperty(commandData.toLowerCase());
        var isSHA = script.hangmanSuperAdmins.hash.hasOwnProperty(commandData.toLowerCase());
        if (!isHA && !isSHA) {
            sys.sendMessage(src, "±Unown: " + commandData + " is not a Hangman auth!", channel);
            return;
        }
        if (isSHA && sys.auth(src) < 3) {
            sys.sendMessage(src, "±Unown: You don't have enough auth!", channel);
            return;
        }
        var oldAuth = (isHA ? "Hangman Admin" : "Super Hangman Admin");
        script.hangmanAdmins.remove(commandData);
        script.hangmanAdmins.remove(commandData.toLowerCase());
        script.hangmanSuperAdmins.remove(commandData);
        script.hangmanSuperAdmins.remove(commandData.toLowerCase());
        if (!silent) {
            sys.sendAll("±Unown: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase() + " from " + oldAuth + ".", hangchan);
        }
        sys.sendAll("±Unown: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase() + " from " + oldAuth + ".", sys.channelId('Victory Road'));
        return;
    };
    this.demoteSuperAdmin = function (src, commandData, channel, silent) {
        if (commandData === undefined) {
            return;
        }
        if (!script.hangmanSuperAdmins.hash.hasOwnProperty(commandData.toLowerCase())) {
            sys.sendMessage(src, "±Unown: " + commandData + " is not a Super Hangman Admin!", channel);
            return;
        }
        script.hangmanSuperAdmins.remove(commandData);
        script.hangmanSuperAdmins.remove(commandData.toLowerCase());
        if (!silent) {
            sys.sendAll("±Unown: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase() + " from Super Hangman Admin.", hangchan);
        }
        sys.sendAll("±Unown: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase() + " from Super Hangman Admin.", sys.channelId('Victory Road'));
        return;
    };
    this.isHangmanAdmin = function (src) {
        if (sys.auth(src) >= 1 || script.hangmanAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase()))
            return true;
        return false;
    };
    this.isHangmanSuperAdmin = function (src) {
        if (sys.auth(src) >= 3 || script.hangmanSuperAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase()))
            return true;
        return false;
    };
    this.authLevel = function (src) {
        if (sys.auth(src) > 2) {
            return 3;
        }
        else if (this.isHangmanSuperAdmin(src)) {
            return 2;
        }
        else if (this.isHangmanAdmin(src)) {
            return 1;
        }
        return 0;
    };
    this.init = function () {
        var name = defaultChannel;
        if (sys.existChannel(name)) {
            hangchan = sys.channelId(name);
        }
        else {
            hangchan = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(hangchan);
        SESSION.channels(hangchan).perm = true;
        hangman.loadAutoGames(autoGamesFile);
    };
    this.loadAutoGames = function (url) {
            try {
                autoGames = JSON.parse(sys.read(url));
            } catch (err) {
                hangbot.sendAll("Unable to load Auto Games", hangchan);
                autoGames = [];
            }
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
    this.afterChannelJoin = function (src, channel) {
        if (channel == hangchan) {
            hangman.viewGame(src);
        }
        return false;
    };
    this.beforeChatMessage = function (src, message, channel) {
        var poUser = SESSION.users(src);
        if (poUser["hmute"]) { //THIS IS WHY YOU DON'T RENAME SESSION VARIABLES
            if (channel == hangchan && poUser["hmute"].active) {
                if (poUser.expired("hmute")) {
                    poUser.un("hmute");
                    sys.sendMessage(src, "±Unown: Your Hangman mute expired.", channel);
                } else {
                    var info = poUser["hmute"];
                    sys.sendMessage(src, "±Unown: You are Hangman muted " + (info.by ? " by " + info.by : '')+". " + (info.expires > 0 ? "Mute expires in " + getTimeString(info.expires - parseInt(sys.time(), 10)) + ". " : '') + (info.reason ? "[Reason: " + info.reason + "]" : ''), channel);
                    sys.stopEvent();
                    return;
                }
            }
        }
    };
    this.stepEvent = function () {
        eventCount++;
        if (!word) {
            idleCount++;
            
            if (idleCount >= idleLimit && autoGames) {
                hangman.startAutoGame();
            }
        }
        if(eventCount === eventLimit-60 && eventGames) {
            sys.sendAll("", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new event game of Hangman will start in about a minute in #Hangman!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            sys.sendAll("", 0);
            return;
        }
        if(eventCount >= eventLimit && eventGames) {
            hangman.startAutoGame();
        }
    };
    this.onHmute = function (src) {
        if (sys.isInChannel(src, hangchan)) {
            sys.kick(src, hangchan);
        }
    };
    
    function toCorrectCase(name) {
        if (isNaN(name) && sys.id(name) !== undefined) {
            return sys.name(sys.id(name));
        }
        else {
            return name;
        }
    }
    return {
        init: hangman.init,
        handleCommand: hangman.handleCommand,
        beforeChannelJoin: hangman.beforeChannelJoin,
        afterChannelJoin: hangman.afterChannelJoin,
        beforeChatMessage: hangman.beforeChatMessage,
        stepEvent: hangman.stepEvent,
        onHmute: hangman.onHmute,
        onHelp: hangman.onHelp
    };
}();
