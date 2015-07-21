/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys, sendChanHtmlAll, module, SESSION, hangbot, require, script, sachannel, getTimeString */

var nonFlashing = require("utilities.js").non_flashing;
var html_escape = require("utilities.js").html_escape;

function Hangman() {
    var hangman = this;
    var hangchan;

    var defaultChannel = "Hangman";
    var defaultParts = 7;
    var minBodyParts = 5;
    var winnerDelay = 60;
    var answerDelay = 7;
    var maxAnswers = [3, 2];
    var maxGuesses = 3;

    var autoGamesFile = "scriptdata/hangmanq.txt";
    var leaderboardsFile = "scriptdata/hangmanLeaderboards.txt";
    var idleCount = 0;
    var idleLimit = 1800;
    var autoGames;
    var autoGamesEnabled = false;

    var eventLimit = 1800;
    var eventCount = (SESSION.global() && SESSION.global().hangmanEventCount ? SESSION.global().hangmanEventCount : eventLimit);
    var eventGamesEnabled = true;
    var isEventGame;
    var pendingEvent = false;
    var eventDelay = false;
    var delayCount = 0;
    var delayLimit = 1;
    var suddenDeathLimit = 300;

    var host;
    var hostName;
    var winner;
    var nextGame;
    var gameMode;
    var nextGameMode = 0;
    
    var regular = 0;
    var suddenDeath = 1;

    var checked = [];

    var word;
    var currentWord = [];
    var usedLetters = [];
    var hint = "";
    var parts;

    var points;
    var misses;
    var answers;
    var guesses;
    var vowels = ["a", "e", "i", "o", "u"];
	
    var leaderboards = {
        current:{},
        last:{},
        currentMonth: -1
    };


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
        if (commandData === undefined) {
            hangbot.sendMessage(src, "This is not a valid answer!", hangchan);
            return;
        }
        /*if (isEventGame && (this.isHangmanAdmin(src) || this.isHangmanSuperAdmin(src))) {
            hangbot.sendMessage(src, "You are HA or sHA, so you can't participate on Event Games!", hangchan);
            return;
        }*/
        if (checked.indexOf(sys.ip(src)) >= 0) {
            hangbot.sendMessage(src, "You checked the answer, so you can't play!", hangchan);
            return;
        }
        for (var x in points) {
            if (sys.ip(src) === sys.dbIp(x) && sys.name(src)!== x) {
                hangbot.sendAll(x + " changed their name to " + sys.name(src) + "!", hangchan);
                this.switchPlayer(x, sys.name(src));
                break;
            }
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
        if (letter.length !== 1) {
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
        if (gameMode === suddenDeath) {
            if (vowels.indexOf(letter) >= 0) {
                hangbot.sendMessage(src, "This is a Sudden Death game, you can't guess vowels!", hangchan);
                return;
            }
            if (sys.name(src) in guesses && guesses[sys.name(src)] >= maxGuesses) {
                hangbot.sendMessage(src, "You can only use /g " + maxGuesses + " times!", hangchan);
                return;
            }
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
        hangbot.sendAll("" + sys.name(src) + " guessed " + letter.toUpperCase() + " and got it " + (correct ? "right (" + p + (p == 1 ? " point)" : " points)") : "wrong") + "!", hangchan);
        hangbot.sendAll("Current Word: " + currentWord.join(" ") + "", hangchan);

        if (currentWord.indexOf("_") === -1) {
            this.applyPoints(src, p + 2);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " completed the word '" + currentWord.join("") + "'!", hangchan);
            this.countPoints();
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            if (isEventGame) {
                    sys.sendHtmlAll("<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> Suggest more event game categories <a href='http://pokemon-online.eu/threads/31530'>here</a>!", hangchan);
                }
            if (pendingEvent) {
                eventDelay = true;
            } else {
                hangbot.sendAll("Type /start answer:hint to start a new game. If you didn't win then wait " + winnerDelay + " seconds.", hangchan);
            }
        }
        else {
            if (!correct) {
                this.addMiss(src);
                if (gameMode === regular) {
                    parts--;
                }
            }
            if (gameMode === suddenDeath) {
                this.addGuessUse(src);
            }
            if (parts > 0) {
                hangbot.sendAll("[Hint: " + hint + "]  [Letters used: " + usedLetters.map(function (x) {
                    return x.toUpperCase();
                }).join(", ") + "] " + (gameMode === regular ? "[Chances left: " + parts + "] " : ""), hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.applyPoints(src, p);
                SESSION.users(src).hangmanTime = (new Date()).getTime() + answerDelay * 1000;
            }
            else {
                sys.sendAll("*** ************************************************************ ***", hangchan);
                hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' correctly, so " + (!isEventGame && sys.isInChannel(sys.id(hostName), hangchan) ? "the host (" + hostName + ") has won this game!" : "anyone may start a game now!"), hangchan);
                sys.sendAll("*** ************************************************************ ***", hangchan);
                sendChanHtmlAll(" ", hangchan);
                if (isEventGame) {
                    sys.sendHtmlAll("<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> Suggest more event game categories <a href='http://pokemon-online.eu/threads/31530'>here</a>!", hangchan);
                }
                if (sys.isInChannel(sys.id(hostName), hangchan) === true) { // IF HOST WINS AND STILL IN CHANNEL
                    this.setWinner(hostName, (host === null && hostName == hangbot.name));
                }
                else { // IF HOST WINS AND NOT IN CHANNEL
                    this.setWinner(hostName, true); // TRUE SO PLAYER CAN INSTANT START
                }
                if (isEventGame) {
                    eventCount = eventLimit;
                }
                if (pendingEvent) {
                    eventDelay = true;
                }
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
        /*if (isEventGame && (this.isHangmanAdmin(src) || this.isHangmanSuperAdmin(src))) {
            hangbot.sendMessage(src, "You are HA or sHA, so you can't participate on Event Games!", hangchan);
            return;
        }*/
        if (checked.indexOf(sys.ip(src)) >= 0) {
            hangbot.sendMessage(src, "You checked the answer, so you can't play!", hangchan);
            return;
        }
        if (commandData.length < 4) {
            hangbot.sendMessage(src, "The answer must have at least four letters!", hangchan);
            return;
        }
        for (var x in points) {
            if (sys.ip(src) === sys.dbIp(x) && sys.name(src)!== x) {
                hangbot.sendAll(x + " changed their name to " + sys.name(src) + "!", hangchan);
                this.switchPlayer(x, sys.name(src));
                break;
            }
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
        if (sys.name(src) in answers && answers[sys.name(src)] >= maxAnswers[gameMode]) {
            hangbot.sendMessage(src, "You can only use /a " + maxAnswers[gameMode] + " times!", hangchan);
            return;
        }
        var ans = commandData.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g, '').replace(/ {2,}/g," ");
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|dildo|\banus|boner|\btits\b|condom|\brape\b/gi.test(ans)) {
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
            if (isEventGame) {
                sys.sendHtmlAll("<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> Suggest more event game categories <a href='http://pokemon-online.eu/threads/31530'>here</a>!", hangchan);
            }
            if (pendingEvent) {
                eventDelay = true;
            } else {
                hangbot.sendAll("Type /start [answer]:[hint] to start a new game. If you didn't win then wait " + winnerDelay + " seconds.", hangchan);
            }
        }
        else {
            this.addMiss(src);
            this.applyPoints(src, 0);
            this.addAnswerUse(src);
            hangbot.sendAll("" + sys.name(src) + "'s answer was wrong! The game continues!", hangchan);
            sendChanHtmlAll(" ", hangchan);
            SESSION.users(src).hangmanTime = (new Date()).getTime() + answerDelay * 2000;
        }
    };
    this.startGame = function (src, commandData) {
        if (commandData === undefined) {
            hangbot.sendMessage(src, "Use /start Answer:Hint", hangchan);
            return;
        }
        if (word) {
            hangbot.sendMessage(src, "A game is already running! You can start a new one once this game is over!", hangchan);
            return;
        }
        if (eventDelay) {
            hangbot.sendMessage(src, "An event game is about to start!", hangchan);
            return;
        }
        if (SESSION.users(src).smute.active || winner && (new Date()).getTime() < nextGame && sys.name(src).toLowerCase() !== winner.toLowerCase()) {
            hangbot.sendMessage(src, "Only the last winner can start a game! If the winner takes more than " + winnerDelay + " seconds, anyone can start a new game!", hangchan);
            return;
        }
        var data = commandData.split(":");
        var a = this.removeNonEnglish(data[0]);
        var h = data[1];
        //var p = data.length < 3 ? defaultParts : data[2];

        if (!a) {
            hangbot.sendMessage(src, "You need to choose a word!", hangchan);
            return;
        }

        var result = this.validateAnswer(a);
        if (result.errors.length > 0) {
            for (var e in result.errors) {
                hangbot.sendMessage(src, result.errors[e], hangchan);
            }
            return;
        }

        a = result.answer;

        if (!h || !h.trim()) {
            hangbot.sendMessage(src, "You need to write a hint!", hangchan);
            return;
        }
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|dildo|\banus|boner|\btits\b|condom|\brape\b/gi.test(h)) {
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " made the hint '" + h + "' in #Hangman", sys.channelId("Victory Road"));
        }
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|dildo|\banus|boner|\btits\b|condom|\brape\b/gi.test(a)) {
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " made the answer '" + a + "' in #Hangman", sys.channelId("Victory Road"));
        }

        isEventGame = false;
        this.createGame(sys.name(src), a, h, src, regular);
    };

    //adapted from string_to_slug http://dense13.com/blog/2009/05/03/converting-string-to-slug-javascript/
    this.removeNonEnglish = function(str) {
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç";
        var to = "aaaaeeeeiiiioooouuuunc";
        for (var i = 0; i < from.length; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
        return str;
    };

    this.validateAnswer = function(a) {
        var validCharacters = "abcdefghijklmnopqrstuvwxyz",
            validLetters = 0,
            l,
            result = {
                errors: [],
                answer: a
            };

        for (l = 0; l < a.length; l++) {
            if (validCharacters.indexOf(a[l].toLowerCase()) !== -1) {
                validLetters++;
            }
        }
        if (validLetters < 4) {
            result.errors.push("Answer must contain at least 4 valid letters (A-Z characters)!");
        }

        a = a.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g, '').replace(/ {2,}/g," ").toLowerCase();
        if (a.length > 60 || a.length < 4) {
            result.errors.push("Your answer cannot be longer than 60 characters or shorter than 4 characters!");
        }

        result.answer = a;
        return result;
    };

    this.createGame = function (name, a, h, src, mode) {
        var validCharacters = "abcdefghijklmnopqrstuvwxyz";
        sys.saveVal("Stats/HangmanGamesPlayed", 1 + (+sys.getVal("Stats/HangmanGamesPlayed")));
        hint = h;
        word = a;
        //parts = (p && parseInt(p, 10) > 0) ? parseInt(p, 10) : defaultParts;
        //parts = (parts < minBodyParts) ? minBodyParts : parts;
        parts = defaultParts;
        points = {};
        misses = {};
        answers = {};
        gameMode = mode;
        if (gameMode === suddenDeath) {
            guesses = {};
        }

        checked = [];
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
        if (gameMode === suddenDeath) {
            for (e = 0; e < word.length; e++) {
                for (v = 0; v < vowels.length; v++) {
                    if (word[e].toLowerCase() === vowels[v]) {
                        currentWord[e] = word[e].toUpperCase();
                    }
                }
            }
        }

        host = src ? sys.ip(src) : null;
        hostName = name;

        sendChanHtmlAll(" ", hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        if (isEventGame) {
            hangbot.sendAll("A " + (gameMode == suddenDeath ? "Sudden Death":"regular") + " Event Game has started! The winner of this game will receive 1 Leaderboard point!", hangchan);
            suddenDeathLimit = 300;
        } else {
            hangbot.sendAll(hostName + " started a new game of Hangman!", hangchan);
        }
        hangbot.sendAll(currentWord.join(" "), hangchan);
        hangbot.sendAll(hint, hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        sendChanHtmlAll(" ", hangchan);
        if (src) {
            hangbot.sendMessage(src, "You started a Hangman game with the answer '" + word.toUpperCase() + "'. If you misspelled the answer or made some mistake, use /end to stop the game and fix it.", hangchan);
        }
        hangbot.sendAll("Type /g [letter] to guess a letter, and /a [answer] to guess the answer!", hangchan);
        sendChanHtmlAll(" ", hangchan);
        var time = parseInt(sys.time(), 10);
        if (time > this.lastAdvertise + 60 * 20) {
            this.lastAdvertise = time;
            sys.sendAll("", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new game of Hangman with the hint '" + hint + "' started in #Hangman!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            sys.sendAll("", 0);
        }
    };
    this.startAutoGame = function(isEvent, mode) {
        if (autoGames.length === 0) {
            return;
        }
        var randomGame = autoGames[sys.rand(0, autoGames.length)].split(":");
        var a = randomGame[2].toLowerCase(),
            h = randomGame[3],
            p = randomGame.length < 5 ? defaultParts : randomGame[4];
        isEventGame = isEvent;
        this.createGame(hangbot.name, a, h, null, mode);
    };
    this.switchPlayer = function (oldName, newName) {
        if (points[oldName] !== undefined) {
            points[newName] = points[oldName];
            delete points[oldName];
        }
        if (misses[oldName] !== undefined) {
            misses[newName] = misses[oldName];
            delete misses[oldName];
        }
        if (gameMode === suddenDeath) {
            if (guesses[oldName] !== undefined) {
                guesses[newName] = guesses[oldName];
                delete guesses[oldName];
            }
            if (answers[oldName] !== undefined) {
                answers[newName] = answers[oldName];
                delete answers[oldName];
            }
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
    this.addAnswerUse = function (src) {
        if (!answers[sys.name(src)]) {
            answers[sys.name(src)] = 0;
        }
        answers[sys.name(src)] += 1;
        hangbot.sendMessage(src, "You can only use /a " + (maxAnswers[gameMode] - answers[sys.name(src)]) + " more times!", hangchan);
        if (gameMode === suddenDeath && guesses[sys.name(src)] >= maxGuesses && answers[sys.name(src)] >= maxAnswers[suddenDeath]) {
            hangbot.sendAll("" + sys.name(src) + " is out of the game!", hangchan);
        }
    };
    this.addGuessUse = function (src) {
        if (!guesses[sys.name(src)]) {
            guesses[sys.name(src)] = 0;
        }
        guesses[sys.name(src)] += 1;
        hangbot.sendMessage(src, "You can only use /g " + (maxGuesses - guesses[sys.name(src)]) + " more times!", hangchan);
        if (guesses[sys.name(src)] >= maxGuesses && answers[sys.name(src)] >= maxAnswers[suddenDeath]) {
            hangbot.sendAll("" + sys.name(src) + " is out of the game!", hangchan);
        }
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
        if (sys.isInChannel(sys.id(w), hangchan) === true) { // IF THE WINNER IS STILL IN CHANNEL
            this.setWinner(w);
        } else { // IF THE WINNER IS NOT IN CHANNEL
            hangbot.sendAll("The winner isn't currently in the channel, so anyone can start!", hangchan);
            this.setWinner(w, true);
        }

        if (isEventGame) {
            hangbot.sendAll(w + " won an Event Game and received 1 Leaderboard point!", hangchan);
            var win = w.toLowerCase();
            if (!(win in leaderboards.current)) {
                leaderboards.current[win] = 0;
            }
            leaderboards.current[win] += 1;
            sys.write(leaderboardsFile, JSON.stringify(leaderboards));
            eventCount = eventLimit;
        }
    };
    this.setWinner = function (name, immediate) {
        word = undefined;
        winner = name;
        if (immediate !== true) {
            nextGame = (new Date()).getTime() + winnerDelay * 1000;
        }
        this.resetTimers();
    };
    this.viewLeaderboards = function(src, commandData) {
        var cut = 10;

        var fromLastMonth = commandData && commandData.toLowerCase() == "last";
        var lb = fromLastMonth ? leaderboards.last : leaderboards.current;

        var list = Object.keys(lb).sort(function(a, b) {
            return lb[b] - lb[a];
        });
        var top = list.slice(0, cut);

        var name;
        sys.sendMessage(src, "", hangchan);
        sys.sendMessage(src, "*** " + (fromLastMonth ? "LAST MONTH'S " : "") + "HANGMAN LEADERBOARDS ***", hangchan);
        for (var e = 0; e < top.length; e++) {
            name = top[e];
            hangbot.sendMessage(src, (e + 1) + ". " + name + ": " + lb[name] + " point(s)", hangchan);
        }
        name = sys.name(src).toLowerCase();
        if (fromLastMonth !== false && top.indexOf(name) == -1) {
            if (name in lb) {
                hangbot.sendMessage(src, (list.indexOf(name) + 1) + ". " + name + ": " + lb[name] + " point(s)", hangchan);
            } else {
                hangbot.sendMessage(src, "You still have not won any Event Games!", hangchan);
            }
        }
        sys.sendMessage(src, "", hangchan);

    };
    
    this.passLeaderboard = function (src, commandData) {
        if (commandData === undefined) {
            hangbot.sendMessage(src, "Please choose a target user that is logged on the same IP.", hangchan);
            return;
        }
        var currentName = sys.name(src).toLowerCase();
        var targetName = commandData.toLowerCase();
        if (currentName === targetName) { // CHECK IF TARGET ALT IS SAME AS CURRENT ALT
            hangbot.sendMessage(src, "The target user is the same as your current. Please choose a new target that is on the same IP and logged on.", hangchan);
            return;
        }
        if (leaderboards.current.hasOwnProperty(currentName) === false) { // CURRENT NAME NOT ON THE LEADERBOARD
            hangbot.sendMessage(src, "Your currently not rated on the leaderboard.", hangchan);
            return;
        }
        if (sys.id(targetName) === undefined) { // CHECK IF TARGET NAME IS ONLINE
            hangbot.sendMessage(src, "Your target is offline.", hangchan);
            return;
        }
        if (!sys.dbRegistered(targetName)) { // CHECK IF TARGET NAME IS REGISTERED
            hangbot.sendMessage(src, "That user isn't registered. You need to register it first.", hangchan);
            return;
        }
        if (sys.ip(sys.id(targetName)) !== sys.ip(src)) { // CHECK IF TARGET NAME IS ON THE SAME IP
            hangbot.sendMessage(src, "Both accounts must be on the same IP to pass your leaderboard points.", hangchan);
            return;
        }
        if (leaderboards.current.hasOwnProperty(targetName) === false) { // CREATE NEW TARGET NAME IF IT DOESN'T EXIST ON THE LEADERBOARD
            leaderboards.current[targetName] = 0;
        }
        // GET DEEP COPY OF OBJECT VALUES TO AVIOD PROBLEMS
        var currentValue = JSON.parse(JSON.stringify(leaderboards.current[currentName]));
        var targetValue = JSON.parse(JSON.stringify(leaderboards.current[targetName]));
        leaderboards.current[targetName] = currentValue + targetValue;
        delete leaderboards.current[currentName];
        sys.write(leaderboardsFile, JSON.stringify(leaderboards));
        hangbot.sendMessage(src, "You passed your hangman leaderboard points from " + sys.name(sys.id(currentName)) + " to " + sys.name(sys.id(targetName)) + ".", hangchan);
        return;
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
        if (eventDelay) {
            hangbot.sendMessage(src, "An event game is about to start!", hangchan);
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
    this.myAnswer = function (src){
        if (word){
            if (sys.ip(src) === host){
                hangbot.sendMessage(src, "The answer for your game is " + word.toUpperCase() + "!", hangchan);
            }
            else{
                hangbot.sendMessage(src, "You are not the host, so you can't use this command!", hangchan);
            }
        }
        else{
            hangbot.sendMessage(src, "No game is running!", hangchan);
        }
    };
    this.endGame = function (src, endEvent) {
        if (word) {
            if (isEventGame === true && endEvent !== true) {
                hangbot.sendMessage(src, "Cannot stop an Event Game with /end. Use /endevent instead.", hangchan);
                return;
            }
            sendChanHtmlAll(" ", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " stopped the game!", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " stopped " + (sys.name(src) == hostName ? "their" : hostName + "'s") + " game in #Hangman. " + (sys.name(src) !== hostName ? "(Hint: " + hint + ", Answer: " + word + ")" : ""), sys.channelId("Victory Road"));
            word = undefined;
            winner = undefined;
            this.resetTimers();
            if (pendingEvent) {
                eventDelay = true;
            }
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
    this.startEventGame = function(mode) {
        hangman.startAutoGame(true, mode);
        pendingEvent = false;
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
        if (isEventGame) {
            sys.sendHtmlMessage(src, "<font color='red'>This is an Event Game!</font>", hangchan);
        } else {
            sys.sendHtmlMessage(src, "<font color='red'>Current game started by " + hostName + "</font>", hangchan);
        }
    };
    this.showRules = function (src) {
        var rules = [
            "",
            "*** *********************************************************************** ***",
            "±Rules: Do not create inappropriate answers, hints or guesses, or attempt to troll the game in any way. This includes but is not limited to offences such as guessing uncommon letters, deliberately spoiling the answer, or ending the game for reasons other than correcting errors.",
            "±Rules: Make sure all games are accessible, playable and spelled correctly. This includes but is not limited to relevant, non-vague, specific and non-opinionated subjects, games in other languages, suitable hints. Games that are lists e.g \"/start Shellos and Gastrodon:Pokemon\" are not allowed.",
            "±Rules: Remember to act in a cordial manner, both when interacting with channel users and authority, and playing the game.",
            "±Rules: Pay attention to channel and server authority (under /has and /auth respectively). Server /rules apply here too. If you have any doubt or see someone breaking the rules, contact the appropiate person (HA for hangman, auth for server).",
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
            "±Goal: Guessing a correct letter gives a point for each time it appears. If you guess the last letter you get 2 additional points.",
            "±Goal: If you guess the whole word correctly you get an additional point for every 3 letters you fill.",
            "*** *********************************************************************** ***",
            "±Actions: To see the current puzzle, type /view.",
            "±Actions: To guess a character, type /g or /guess [character]. For example, to guess F, type /g F.",
            "±Actions: If you think you already know the answer, you can use /a or /answer [answer] to submit a full answer.",
            "±Actions: If you guess wrong too many times, the host wins!",
            "*** *********************************************************************** ***",
            "±Hosting: To host a game, type /start Answer:Hint. For example, to create a game where the answer is Pikachu and the hint is Pokemon, use /start Pikachu:Pokemon. The host can't guess or answer during their own game.",
            // "±Hosting: You can also type /start Answer:Hint:Number to set how many wrong guesses must be made before you win (minimum of " + minBodyParts + ").",
            "±Hosting: The winner of the previous game has priority for hosting the next game, and may use /pass User to give that priority to another user.",
            "±Hosting: If the user with hosting priority doesn't start a new game within " + winnerDelay + " seconds, anyone can host.",
            "*** *********************************************************************** ***",
            "±Rules: Do not create inappropriate answers, hints or guesses, or attempt to troll the game in any way. This includes but is not limited to offences such as guessing uncommon letters, deliberately spoiling the answer, or ending the game for reasons other than correcting errors.",
            "±Rules: Make sure all games are accessible, playable and spelled correctly. This includes but is not limited to relevant, non-vague, specific and non-opinionated subjects, games in other languages, suitable hints. Games that are lists e.g \"/start Shellos and Gastrodon:Pokemon\" are not allowed.",
            "±Rules: Remember to act in a cordial manner, both when interacting with channel users and authority, and playing the game.",
            "±Rules: Pay attention to channel and server authority (under /has and /auth respectively). Server /rules apply here too. If you have any doubt or see someone breaking the rules, contact the appropiate person (HA for hangman, auth for server).",
            "*** *********************************************************************** ***",
            ""
        ];
        for (x in help) {
            sys.sendMessage(src, help[x], hangchan);
        }
    };

    this.autoGame = function (src, commandData) {
        if(commandData === undefined) {
            if(autoGamesEnabled === true) {
                hangbot.sendMessage(src, "Games are set to automatically start.", hangchan);
                return;
            }
            else {
                hangbot.sendMessage(src, "Games are set to not automatically start.", hangchan);
                return;
            }
        }
        var turning = commandData.toLowerCase();
        if(turning == "off") {
            if(autoGamesEnabled === false) {
                hangbot.sendMessage(src, "Automatic games are already turned off.", hangchan);
                return;
            }
            else {
                autoGamesEnabled = false;
                hangbot.sendMessage(src, "You turned off Automatic games.", hangchan);
                return;
            }
        }
        if(turning == "on") {
            if (autoGamesEnabled === true) {
                hangbot.sendMessage(src, "Automatic games are already turned on.", hangchan);
            }
            else {
                autoGamesEnabled = true;
                hangbot.sendMessage(src, "You turned on Automatic games.", hangchan);
            }
        }
    };

    this.eventGame = function(src, commandData) {
        if(commandData === undefined) {
            if(eventGamesEnabled === true) {
                hangbot.sendMessage(src, "Event Games are set to start.", hangchan);
                return;
            }
            else {
                hangbot.sendMessage(src, "Event Games are not set to start.", hangchan);
                return;
            }
        }
        var some = commandData.toLowerCase();
        if(some == "off") {
            if(eventGamesEnabled === false) {
                hangbot.sendMessage(src, "Event Games are already turned off.", hangchan);
                return;
            }
            else {
                eventGamesEnabled = false;
                hangbot.sendMessage(src, "Event Games have been turned off.", hangchan);
                return;
            }
        }
        if(some == "on") {
            if(eventGamesEnabled === true) {
                hangbot.sendMessage(src, "Event Games are already turned on.", hangchan);
            }
            else {
                eventGamesEnabled = true;
                hangbot.sendMessage(src, "Event games have been turned on.", hangchan);
            }
        }
    };
    
    this.flashAdmins = function(src, commandData, channel) {
        if (channel !== sys.channelId("Victory Road")) {
            hangbot.sendMessage(src, "You can only use this command in Victory Road!", channel);
            return;
        }
        var message = (!commandData ? "Flashing all Hangman Admins!" : commandData);
        sys.sendAll(sys.name(src).toCorrectCase() + ": " + message, channel);
        for (var x in script.hangmanAdmins.hash) {
            var id = sys.id(x);
            if (id) {
                sys.sendHtmlMessage(id, "<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> <b> You have been flashed!</b><ping/>", channel);
            }
        }
        for (var x in script.hangmanSuperAdmins.hash) {
            var id = sys.id(x);
            if (id) {
                sys.sendHtmlMessage(id, "<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> <b> You have been flashed!</b><ping/>", channel);
            }
        }
    };

    this.addQuest = function(src, commandData) {
        if (commandData == "*" || commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format for Hangman game! Proper format is 'answer:hint'.", hangchan);
            return;
        }
        var info = commandData.split(":");
        var newQ = info[0].toLowerCase();
        var newH = info[1];
        //var newC = info.length > 2 ? parseInt(info[2], 10) : 7;

        var result = this.validateAnswer(newQ);

        if (result.errors.length > 0) {
            for (var e in result.errors) {
                hangbot.sendMessage(src, result.errors[e], hangchan);
            }
            return;
        }
        newQ = result.answer;

        /*if (isNaN(newC)) {
            hangbot.sendMessage(src, "Number of chances must be a valid number higher or equal to " + minBodyParts + "!", hangchan);
            return;
        }*/

        var index = autoGames.length + 1;
        var author = sys.name(src);
        autoGames.push(index + ":" + author + ":" + newQ + ":" + newH + ":7");
        sys.write(autoGamesFile, JSON.stringify(autoGames));
        hangbot.sendMessage(src, "You have successfully added a new question!", hangchan);

    };

    this.searchQuest = function(src, commandData) {
        if (word && isEventGame) {
            hangbot.sendMessage(src, "You can't use this command when an Event Game is running!", hangchan);
            return;
        }
        else {
            if (commandData === undefined) {
                hangbot.sendMessage(src, "Invalid format. Proper format is /searchquest query:criteria where criteria is (w)ord (default), (h)int or (i)ndex.", hangchan);
                return;
            }
            if (autoGames.length === 0) {
                hangbot.sendMessage(src, "There are no games in the database.", hangchan);
                return;
            }
            else{
                if (commandData.indexOf(":") === -1) {
                    hangman.searchByWord(src, commandData);
                }
                else {
                    var search = commandData.split(":")[0],
                    method = commandData.split(":")[1];
                    switch (method){
                        case "i":
                            hangman.searchByIndex(src, search);
                            break;
                        case "w":
                            hangman.searchByWord(src, search);
                            break;
                        case "h":
                            hangman.searchByHint(src, search);
                            break;
                            case "e":
                            hangman.searchByEditor(src, search);
                            break;
                        default:
                        hangbot.sendMessage(src, "Select a proper method of searching.", hangchan);
                        return;
                    }
                }
            }
        }
    };

    this.searchByWord = function(src, commandData){
        var found = false;
        for (var e = 0; e < autoGames.length; e++) {
            var game = autoGames[e].split(":");
            var i = game[0],
                u = game[1],
                a = game[2].toUpperCase(),
                h = game[3];
                //c = game.length < 5 ? defaultParts : game[4];
            if (a === commandData.toUpperCase()) {
                hangbot.sendMessage(src, "Index: " + i + " - Word: " + a + " - Hint: " + h + " - User: " + u, hangchan);
                found = true;
            }
        }
        if (!found){
            hangbot.sendMessage(src, "There are no games with that answer.", hangchan);
        }
    };

    this.searchByHint = function(src, commandData){
        var found = false;
        for (var e = 0; e < autoGames.length; e++) {
            var game = autoGames[e].split(":");
            var i = game[0],
                u = game[1],
                a = game[2].toUpperCase(),
                h = game[3];
                //c = game.length < 5 ? defaultParts : game[4];

            if (h.toUpperCase() === commandData.toUpperCase()) {
                hangbot.sendMessage(src, "Index: " + i + " - Word: " + a + " - Hint: " + h + " - User: " + u, hangchan);
                found = true;
            }
        }
        if (!found){
            hangbot.sendMessage(src, "There are no games with that hint.", hangchan);
        }
    };

    this.searchByIndex = function(src, commandData){
        if (isNaN(commandData) || (commandData%1)!==0) {
            hangbot.sendMessage(src, "You need to write an integer number, the index of the question you want to search.", hangchan);
            return;
        }
        if (commandData <= 0){
            hangbot.sendMessage(src, "You can't use 0 or negative numbers.", hangchan);
            return;
        }
        if (commandData > autoGames.length){
            hangbot.sendMessage(src, "There are " + autoGames.length + " games in the database, use a lower number.", hangchan);
            return;
        }
    
        var game = autoGames[commandData-1].split(":");
        var i = game[0],
            u = game[1],
            a = game[2].toUpperCase(),
            h = game[3];
            //c = game.length < 5 ? defaultParts : game[4];
    
        hangbot.sendMessage(src, "Index: " + i + " - Word: " + a + " - Hint: " + h + " - User: " + u, hangchan);
    };
    
    this.searchByEditor = function(src, commandData){
        var found = false;
        for (var e = 0; e < autoGames.length; e++) {
            var game = autoGames[e].split(":");
            var i = game[0],
                u = game[1],
                a = game[2].toUpperCase(),
                h = game[3];
                //c = game.length < 5 ? defaultParts : game[4];
        
            if (u.toUpperCase() === commandData.toUpperCase()) {
                hangbot.sendMessage(src, "Index: " + i + " - Word: " + a + " - Hint: " + h + " - User: " + u, hangchan);
                found = true;
            }
        }
        if (!found){
            hangbot.sendMessage(src, "There are no games last edited by that person.", hangchan);
        }
    };

    this.deleteQuest = function(src, commandData) {
       
        if (autoGames.length === 0) {
            hangbot.sendMessage(src, "There are no games in the database, you can't delete anything.", hangchan);
            return;
        }
        if (isNaN(commandData) || (commandData%1)!==0) {
            hangbot.sendMessage(src, "You need to write an integer number, the index of the question you want to delete.", hangchan);
            return;
        }
        if (commandData <= 0){
            hangbot.sendMessage(src, "You can't use 0 or negative numbers.", hangchan);
            return;
        }
        if (commandData > autoGames.length){
            hangbot.sendMessage(src, "There are " + autoGames.length + " games in the database, use a lower number.", hangchan);
            return;
        }
    
        var del = autoGames[commandData-1].split(":");
        var a = del[2].toUpperCase(),
            h = del[3];
    
        hangbot.sendMessage(src, "The game " + a + " with hint " + h + " will be deleted.", hangchan);
    
        autoGames.splice(commandData - 1, 1);
        var game,
            sub,
            c,
            i;
        for (var e = commandData - 1; e < autoGames.length; e++){
            game = autoGames[e].split(":");
            c = game.length < 5 ? defaultParts : game[4];
            i = e+1;
            sub = i + ":" + game[1] + ":" + game[2] + ":" + game[3] + ":" + c;
            autoGames.splice(e, 1, sub);
        }
        sys.write(autoGamesFile, JSON.stringify(autoGames));
        hangbot.sendMessage(src, "You have successfully deleted the question!", hangchan);
    };

    this.changeWord = function(src, commandData) {
    
        if (autoGames.length === 0) {
            hangbot.sendMessage(src, "There are no games in the database, you can't edit anything.", hangchan);
            return;
        }
    
        if (commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format. Proper format is /changeword index:word.", hangchan);
            return;
        }
    
        var info = commandData.split(":");
        var i = info[0];
        
        if (isNaN(i) || (i%1)!==0) {
            hangbot.sendMessage(src, "You need to write an integer number, the index of the question you want to change.", hangchan);
            return;
        }
        
        if (i <= 0){
            hangbot.sendMessage(src, "You can't use 0 or negative numbers.", hangchan);
            return;
        }
        if (i > autoGames.length){
            hangbot.sendMessage(src, "There are " + autoGames.length + " games in the database, use a lower number.", hangchan);
            return;
        }
    
        var edit = autoGames[i-1].split(":");
        var a = edit[2].toUpperCase(),
            h = edit[3],
            c = edit.length < 5 ? defaultParts : edit[4];
    
        hangbot.sendMessage(src, "(Before) Index: " + i + " - Word: " + a + " - Hint: " + h, hangchan);
    
        a = info[1].toLowerCase();
        var sub = i + ":" + sys.name(src) + ":" + a + ":" + h + ":" + c;
    
        hangbot.sendMessage(src, "(After) Index: " + i + " - Word: " + a.toUpperCase() + " - Hint: " + h, hangchan);
    
        autoGames.splice(i-1, 1, sub);
        sys.write(autoGamesFile, JSON.stringify(autoGames));
    };

    this.changeHint = function(src, commandData) {
    
        if (autoGames.length === 0) {
            hangbot.sendMessage(src, "There are no games in the database, you can't edit anything.", hangchan);
            return;
        }
    
        if (commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format. Proper format is /changeword index:hint.", hangchan);
            return;
        }
    
        var info = commandData.split(":");
        var i = info[0];
        
        if (isNaN(i) || (i%1)!==0) {
            hangbot.sendMessage(src, "You need to write an integer number, the index of the question you want to change.", hangchan);
            return;
        }
        
        if (i <= 0){
            hangbot.sendMessage(src, "You can't use 0 or negative numbers.", hangchan);
            return;
        }
        if (i > autoGames.length){
            hangbot.sendMessage(src, "There are " + autoGames.length + " games in the database, use a lower number.", hangchan);
            return;
        }
    
        var edit = autoGames[i-1].split(":");
        var a = edit[2].toUpperCase(),
            h = edit[3],
            c = edit.length < 5 ? defaultParts : edit[4];
    
        hangbot.sendMessage(src, "(Before) Index: " + i + " - Word: " + a + " - Hint: " + h, hangchan);
    
        h = info[1].toLowerCase();
        var sub = i + ":" + sys.name(src) + ":" + a + ":" + h + ":" + c;
    
        hangbot.sendMessage(src, "(After) Index: " + i + " - Word: " + a + " - Hint: " + h, hangchan);
    
        autoGames.splice(i-1, 1, sub);
        sys.write(autoGamesFile, JSON.stringify(autoGames));
    };

   /* this.changeChances = function(src, commandData) {
    
        if (autoGames.length === 0) {
            hangbot.sendMessage(src, "There are no games in the database, you can't edit anything.", hangchan);
            return;
        }
    
        if (commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format. Proper format is /changeword index:chances.", hangchan);
            return;
        }
    
        var info = commandData.split(":");
        var i = info[0];
        var newc = info[1];
        
        if (isNaN(i) || (i%1)!==0) {
            hangbot.sendMessage(src, "You need to write an integer number, the index of the question you want to change.", hangchan);
            return;
        }
        
        if (isNaN(newc) || (newc%1)!==0) {
            hangbot.sendMessage(src, "Number of chances must be a valid number higher or equal to " + minBodyParts + "!", hangchan);
            return;
        }
    
        if (i <= 0){
            hangbot.sendMessage(src, "You can't use 0 or negative numbers.", hangchan);
            return;
        }
        if (i > autoGames.length){
            hangbot.sendMessage(src, "There are " + autoGames.length + " games in the database, use a lower number.", hangchan);
            return;
        }
    
        var edit = autoGames[i-1].split(":");
        var a = edit[2].toUpperCase(),
            h = edit[3],
            c = edit.length < 5 ? defaultParts : edit[4];
    
        hangbot.sendMessage(src, "(Before) Index: " + i + " - Word: " + a + " - Hint: " + h + " - Chances: " + c, hangchan);
    
        c = newc;
        var sub = i + ":" + sys.name(src) + ":" + a + ":" + h + ":" + c;
    
        hangbot.sendMessage(src, "(After) Index: " + i +" - Word: " + a + " - Hint: " + h + " - Chances: " + c, hangchan);
    
        autoGames.splice(i-1, 1, sub);
        sys.write(autoGamesFile, JSON.stringify(autoGames));
    }; */

    this.checkGame = function (src) {
        if (!word || isEventGame){
            hangbot.sendMessage(src, "There is either no game running, or this is an Event Game!", hangchan);
        }
        else {
            if (checked.indexOf(sys.ip(src)) >= 0){
                hangbot.sendMessage(src, "You already used the command to learn the answer!", hangchan);
            }
            else{
                hangbot.sendMessage(src, "The answer for the current game is " + word.toUpperCase() +"!", hangchan);
                checked.push(sys.ip(src));
                if (sys.existChannel("Victory Road"))
                    hangbot.sendAll("Warning: Player " +sys.name(src) + " checked the answer of " + hostName + "'s game in #Hangman", sys.channelId("Victory Road"));
            }
        }
    };
    
    this.checkNewMonth = function() {
        var date = new Date();
        if (date.getUTCMonth() !== leaderboards.currentMonth) {
            leaderboards.currentMonth = date.getUTCMonth();
            leaderboards.last = leaderboards.current;
            leaderboards.current = {};
            sys.write(leaderboardsFile, JSON.stringify(leaderboards));
            hangbot.sendAll("Hangman's Leaderboards have been reset!", hangchan);
        }
    };
    this.configGame = function (src, commandData) {
        if (commandData === undefined) {
            commandData = "*";
        }
        var param = commandData.split(":")[0];
        var val = commandData.split(":")[1];
        if (!param || !val) {
            hangbot.sendMessage(src, "How to use /config: Use /config [parameter]:[value]. Possible parameters are:", hangchan);
            hangbot.sendMessage(src, "chances: Set default number of chances for any game (currently set to " + defaultParts + " chances). ", hangchan);
            hangbot.sendMessage(src, "delay: Set delay (in seconds) between each guess. Full answers take double the time (currently set to " + answerDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "winner: Set how many seconds the winner of a game have to start a new one before anyone can start (currently set to " + winnerDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "guessessd: Set how many times each player can use /g in a sudden death game (currently set to " + maxGuesses + "). ", hangchan);
            hangbot.sendMessage(src, "answersreg: Set how many times each player can use /a in a regular game (currently set to " + maxAnswers[regular] + "). ", hangchan);
            hangbot.sendMessage(src, "answerssd: Set how many times each player can use /a in a sudden death game (currently set to " + maxAnswers[suddenDeath] + "). ", hangchan);
            hangbot.sendMessage(src, "event: Set how often Event Games happen (currently set to " + eventLimit/60 + " minutes).", hangchan);
            return;
        }
        if (parseInt(val, 10) <= 0) {
            hangbot.sendMessage(src, "Value must be a valid number!", hangchan);
            return;
        }
        val = parseInt(val, 10);

        switch (param.toLowerCase()) {
            case "chances":
                defaultParts = val;
                hangbot.sendMessage(src, "Default chances set to " + val + ".", hangchan);
                break;
            case "delay":
                answerDelay = val;
                hangbot.sendMessage(src, "Delay between guesses set to " + val + " second(s).", hangchan);
                break;
            case "winner":
                winnerDelay = val;
                hangbot.sendMessage(src, "Winner will have " + val + " second(s) to start a new game.", hangchan);
                break;
            case "guessessd":
                maxGuesses = val;
                hangbot.sendMessage(src, "Players can use /g " + val + " times in a sudden death game.", hangchan);
                break;
            case "answersreg":
                maxAnswers[regular] = val;
                hangbot.sendMessage(src, "Players can use /a " + val + " times in a regular game.", hangchan);
                break;
            case "answerssd":
                maxAnswers[suddenDeath] = val;
                hangbot.sendMessage(src, "Players can use /a " + val + " times in a sudden death game.", hangchan);
                break;
            case "event":
                eventLimit = val*60;
                hangbot.sendMessage(src, "Event games will happen every " + val + " minutes.", hangchan);
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
            "/g or /guess: To guess a letter.",
            "/a or /answer: To answer the question.",
            "/hangmanrules: To see the hangman rules.",
            "/view: To view the current game's state.",
            "/start: To start a new game of hangman. Format /start answer:hint. Example: /start Pikachu:Pokémon.",
            "/pass: To pass starting rights to someone else.",
            "/hangmanadmins: To see a list of hangman auth.",
            "/end: To end a game you started.",
            "/leaderboard: To see the event leaderboard. You can type /leaderboard last to see last months leaderboard.",
            "/passleaderboard [user]: Passes all your leaderboard points to another alt on the same IP. Both alts must also be logged on.",
            "/myanswer: To see the answer you submitted (host only)."
        ];
        var adminHelp = [
            "*** Hangman Admin Commands ***",
            "/hangmanban: To ban a user in hangman. Format /hangmanban name:reason:time",
            "/hangmanunban: To hangman unban a user.",
            "/hangmanbans: Searches the hangman banlist, show full list if no search term is entered.",
            "/flashhas: Flashes all Hangman Admins. Use /flashhas [phrase] to use a different message (abuse will be punished for).",
            "/passha: To give your Hangman Admin powers to an alt.",
            "/searchquest: To search a question in the autogame/eventgame data base. Format /searchquest query:criteria where criteria is (w)ord (default), (h)int, (i)ndex or (e)ditor.",
            "/changeword: To change the word in a question in the autogame/eventgame data base. Format /changeword index:word.",
            "/changehint: To change the hint in a question in the autogame/eventgame data base. Format /changeword index:hint.",
            "/checkgame: To see the answer of a game (only once per game). Prevents playing if used."
        ];
        var superAdminHelp = [
            "*** Hangman Super Admin Commands ***",
            "/config: To change the answer delay time and other settings. Format /config parameter:value. Type /config by itself to see more help.",
            "/hangmanadmin: To promote a new Hangman Admin. Use /shangmanadmin for a silent promotion.",
            "/hangmanadminoff: To demote a Hangman Admin or a Hangman Super Admin. Use /shangmanadminoff for a silent demotion.",
            "/addquest: To add a question to the autogame/eventgame data base. Format /addquest Answer:Hint:Guess number.",
            "/deletequest: To delete a question in the autogame/eventgame data base. Format /deletequest index.",
            "/eventgame: To turn eventgames on/off. Format /eventgame on or /eventgame off.",
            "/forceevent: Forces a regular event game to start.",
            "/forcesuddendeath: Forces a Sudden Death event game to start."
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
        if (channel !== hangchan && ["hangmanban", "hangmanunban", "hangmanbans", "hangmanmute", "hangmanunmute", "hangmanmutes", "hangmanadmins", "hadmins", "has", "flashhas", "passha", "hangmanadminoff", "hangmanadmin", "hangmansadmin", "hangmansuperadmin", "shangmanadmin", "shangmansuperadmin", "shangmanadminoff"].indexOf(command) === -1) {
            return false;
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
        if (command === "leaderboard" || command === "leaderboards") {
            hangman.viewLeaderboards(src, commandData);
            return true;
        }
        if (command === "passleaderboard" || command === "passlb" || command === "passscore") {
            hangman.passLeaderboard(src, commandData);
            return true;
        }
        if (command === "hangmanadmins" || command === "hadmins" || command === "has") {
            hangman.hangmanAuth(src, commandData, channel);
            return true;
        }
        if (command === "myanswer") {
            hangman.myAnswer(src);
            return true;
        }

        if (hangman.authLevel(src) < 1 && !(command === "end" && sys.ip(src) === host)) {
            return false;
        }
        var id;
        if (command == "passha") {
            var oldname = sys.name(src).toLowerCase();
            if (commandData === undefined) {
                sys.sendMessage(src, "±Unown: Enter a username!");
                return true;
            }
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
            if (script.hangmanSuperAdmins.hash.hasOwnProperty(oldname)) {
                script.hangmanSuperAdmins.remove(oldname);
                script.hangmanSuperAdmins.add(newname, "");
                sHA = true;
            } else if (script.hangmanAdmins.hash.hasOwnProperty(oldname)) {
                script.hangmanAdmins.remove(oldname);
                script.hangmanAdmins.add(newname, "");
            } else {
                sys.sendMessage(src, "±Unown: You are not Hangman Auth", channel);
                return true;
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
        if (command === "endevent") {
            hangman.endGame(src, true);
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

        /*if (command === "autogame") {
            hangman.autoGame(src, commandData);
            return true;
        }*/

        if (command === "flashhas") {
            hangman.flashAdmins(src, commandData, channel);
            return true;
        }

        /* Test Commands
         if (command == "settime") {
         eventCount = parseInt(commandData, 10);
         hangbot.sendAll("Setting event timer to " + eventCount + "!", hangchan);
         return true;
         }
         if (command == "newmonth") {
         hangman.checkNewMonth();
         return true;
         }
         */

        if (command === "searchquest") {
            hangman.searchQuest(src, commandData);
            return true;
        }

        if (command === "changeword") {
            hangman.changeWord(src, commandData);
            return true;
        }
        
        if (command === "changehint") {
            hangman.changeHint(src, commandData);
            return true;
        }
        
     /*   if(command === "changechances") {
            hangman.changeChances(src, commandData);
            return true;
        } */

        if (command === "hangmanmutes" || command === "hangmanbans") {
            hangman.hangmanMuteList(src, commandData);
            return true;
        }

        if (command === "checkgame") {
            hangman.checkGame(src);
            return true;
        }

        if (hangman.authLevel(src) < 2) {
            return false;
        }

        if (command === "addquest") {
            hangman.addQuest(src, commandData);
            return true;
        }

        if (command === "deletequest") {
            hangman.deleteQuest(src, commandData);
            return true;
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

        if (command === "eventgame") {
            hangman.eventGame(src, commandData);
            return true;
        }
        
        if (command === "forceevent") {
            if (word) {
                hangbot.sendMessage(src, "There is currently a game running!", hangchan);
            }
            else{
                hangman.startEventGame(regular);
            }
            return true;
        }
		if (command === "forcesuddendeath") {
            if (word) {
                hangbot.sendMessage(src, "There is currently a game running!", hangchan);
            }
            else{
                hangman.startEventGame(suddenDeath);
            }
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
    };
    this.hangmanMuteList = function (src, commandData) {
        require("modcommands.js").handleCommand(src, "hangmanmutes", commandData, -1);
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
    };
    this.isHangmanAdmin = function (src) {
        return sys.auth(src) >= 1 || script.hangmanAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase());
    };
    this.isHangmanSuperAdmin = function (src) {
        return sys.auth(src) >= 3 || script.hangmanSuperAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase());
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
        hangman.loadAutoGames();
    };
    this.loadAutoGames = function () {
        try {
            autoGames = JSON.parse(sys.read(autoGamesFile));
        } catch (err) {
            hangbot.sendAll("Unable to load Auto Games.", hangchan);
            autoGames = [];
        }
        try {
            leaderboards = JSON.parse(sys.read(leaderboardsFile));
        } catch (err) {
            hangbot.sendAll("Unable to load Hangman Leaderboards.", hangchan);
            leaderboards = {
                current: {},
                last: {},
                currentMonth: -1
            };
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
            sys.sendMessage(src, "±Unown: Hello, welcome to Hangman. Use the commands /g [letter] to guess a letter, and /a [answer] to guess the whole thing! For more information, use the /help command. Have fun!", channel);
        }
        return false;
    };
    this.beforeChatMessage = function (src, message, channel) {
        var poUser = SESSION.users(src);
        if (channel == hangchan && poUser.hmute.active) {
            if (poUser.expired("hmute")) {
                poUser.un("hmute");
                sys.sendMessage(src, "±Unown: Your Hangman mute expired.", channel);
            } else {
                var info = poUser.hmute;
                sys.sendMessage(src, "±Unown: You are Hangman muted " + (info.by ? " by " + info.by : '')+". " + (info.expires > 0 ? "Mute expires in " + getTimeString(info.expires - parseInt(sys.time(), 10)) + ". " : '') + (info.reason ? "[Reason: " + info.reason + "]" : ''), channel);
                sys.stopEvent();
            }
        }
    };
    this.stepEvent = function () {
        if (eventCount > 0) {
            eventCount--;
        }
        SESSION.global().hangmanEventCount = eventCount;
        if (!word) {
            idleCount++;

            if (idleCount >= idleLimit && autoGamesEnabled) {
                hangman.startAutoGame(false);
            }
        }
        if ((word) && (gameMode === suddenDeath)) {
            if (suddenDeathLimit > 0) {
                suddenDeathLimit--;
            }
            
            else {
                sys.sendAll("*** ************************************************************ ***", hangchan);
                hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' in time, so anyone may start a game now!", hangchan);
                sys.sendAll("*** ************************************************************ ***", hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.setWinner(hostName, (host === null && hostName == hangbot.name));
                eventCount = eventLimit;
                suddenDeathLimit = 300;
            }
        }
        if (eventCount === 0 && eventGamesEnabled) {
            hangman.checkNewMonth();
            eventCount = -1;
            if (word) {
                pendingEvent = true;
            } else {
                hangman.startEventGame(nextGameMode);
                nextGameMode = nextGameMode === regular ? suddenDeath : regular;
            }
        }
        if (eventDelay) {
            if (eventDelay < delayLimit) {
                delayCount++;
            }
            else {
                delayCount = 0;
                eventDelay = false;
                hangman.startEventGame(nextGameMode);
                nextGameMode = nextGameMode === regular ? suddenDeath : regular;
            }
        }
        if (eventCount === 60 && eventGamesEnabled) {
            sys.sendAll("", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new event game of #Hangman will start in about a minute!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            sys.sendAll("", 0);

            sys.sendAll("", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("A new event game of Hangman will start in about a minute!", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sys.sendAll("", hangchan);
        }
    };
    this.onHmute = function (src) {
        if (sys.isInChannel(src, hangchan)) {
            sys.kick(src, hangchan);
        }
    };
}
module.exports = new Hangman();
