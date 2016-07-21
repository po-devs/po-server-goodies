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
    var tossUpDelay = 4;
    var maxAnswers = [3, 2, 4];
    var maxGuesses = 3;
    var cutOff = 75;
    var idleCount = 0;
    var idleLimit = 1800;
    var eventLimit = 1800;    
    var delayCount = 0;
    var delayLimit = 3;
    var passCount = 0;
    var passLimit = 4;
    var suddenDeathLimit = 300;
    var suddenDeathTime = suddenDeathLimit;    
    var suddenDeathChanceTime = 120;
    var tossUpCount;
    var tossUpGuess;    
    
    var autoGamesFile = "scriptdata/hangmanq.txt";
    var leaderboardsFile = "scriptdata/hangmanLeaderboards.txt";
    var changeLogFile = "scriptdata/hangmanchangelog.txt";
    var flashlistFile = "scriptdata/hangmanflashlist.txt";

    var autoGames;
    var autoGamesEnabled = false;    
    var eventCount = (SESSION.global() && SESSION.global().hangmanEventCount ? SESSION.global().hangmanEventCount : eventLimit);
    var eventGamesEnabled = true;
    var isEventGame;
    var pendingEvent = false;
    var eventDelay = false;

    var hostIpArray = [];
    var hostName = "";
    var winner;
    
    var regular = 0;
    var suddenDeath = 1;
    var tossUp = 2;
    var gameMode;
    var nextGame;
    var nextGameMode = 0;

    var word;
    var inputWord;
    var checked = [];    
    var currentWord = [];
    var usedLetters = [];
    var usedAnswers = [];
    var tossUpOrder = [];
    var usedTossUps = []; 
    var validFills = [];
    var vowels = ["a", "e", "i", "o", "u"];
    var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    
    var hint = "";
    var parts;
    var points;
    var misses;
    var answers;
    var guesses;
    var countMax;    
	
    var leaderboards = {
        current: {},
        last: {},
        currentMonth: -1
    };
    var flashlist = {
        ip: {},
        name: {}
    };
  
    this.lastAdvertise = 0;
    
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function getRange(input) {
        var range = input.split("-"), lower, upper;
        if (range.length > 1) {
            lower = parseInt(range[0], 10);
            upper = parseInt(range[1], 10);
        } else {
            lower = 0;
            upper = parseInt(range[0], 10);
        }
        if (isNaN(lower) || isNaN(upper)) {
            return null;
        }
        if (lower === 0) {
            lower = 1;
        }
        return { lower: lower, upper: upper};
    }
    function getArrayRange(arr, lower, upper) {
        var result = arr.concat();
        if (lower >= 0) {
            return result.slice(Math.max(lower - 1, 0), upper);
        } else {
            return result.slice(-upper, -lower);
        }
    }

    this.unownGuess = function () {     
        var i, x, y, z, count = 0;

        x = Math.floor(Math.random() * validFills.length);
        y = validFills[x];
        validFills.splice(x, 1);
        usedTossUps.push(y);
        currentWord[tossUpOrder[y]] = word[tossUpOrder[y]].toUpperCase();
        for (z = 0; z < currentWord.length; z++) {
            if (currentWord[z] == "_") {
                count += 1;
            }
        }
        i = 100 - (Math.floor(((count * 10000) / countMax)) / 100);
        if (i < cutOff) {
            sendChanHtmlAll(" ", hangchan);
            hangbot.sendAll("Unown has added the letter " + currentWord[tossUpOrder[y]].toUpperCase() + " to the game!", hangchan);
            hangbot.sendAll("Current Word: " + currentWord.join(" "), hangchan);
            hangbot.sendAll("[Hint: " + hint + "] [Completion: " + i.toFixed(2) + "%]", hangchan);
            sendChanHtmlAll(" ", hangchan);
        } else {
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' correctly, so the host (" + hostName + ") has won this game! [Completion: " + i.toFixed(2) + "%]", hangchan);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            this.concludeGame();
        }
    };
    
    this.guessCharacter = function (src, commandData) {
        if (sys.name(src).toLowerCase() === hostName.toLowerCase()) { // CHECK IF HOST CHANGED IP
            if (hostIpArray.indexOf(sys.ip(src)) === -1) {
                hostIpArray.push(sys.ip(src));
            }
        }
        if (hostIpArray.indexOf(sys.ip(src)) !== -1) {
            hangbot.sendMessage(src, "You started the game, so you can't answer!", hangchan);
            return;
        }
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        if (gameMode === tossUp) {
            hangbot.sendMessage(src, "You can't guess letters in Toss Up!", hangchan);
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
        var letter = commandData.toLowerCase();
        if (letter.length !== 1) {
            hangbot.sendMessage(src, "This is not a valid answer!", hangchan);
            return;
        }
        if (alphabet.indexOf(letter) === -1) {
            hangbot.sendMessage(src, "This is not a valid answer!", hangchan);
            return;
        }
        if (usedLetters.indexOf(letter) >= 0) {
            hangbot.sendMessage(src, "This letter was already used!", hangchan);
            return;
        }
        for (var x in points) {
            if (sys.ip(src) === sys.dbIp(x) && sys.name(src)!== x) {
                hangbot.sendAll(x + " changed their name to " + sys.name(src) + "!", hangchan);
                this.switchPlayer(x, sys.name(src));
                if (sys.id(x) !== undefined) {
                    SESSION.users(src).hangmanGuessTime = SESSION.users(sys.id(x)).hangmanGuessTime;
                }                    
                break;
            }
        }
        if ((SESSION.users(src).smute.active && sys.auth(src) < 1)) {
            hangbot.sendMessage(src, "You need to wait for another 9 seconds before submitting another guess!", hangchan);
            return;
        }
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).hangmanGuessTime) {
            hangbot.sendMessage(src, "You need to wait for another " + (Math.floor((SESSION.users(src).hangmanGuessTime - now) / 1000) + 1) + " seconds before using /g again!", hangchan);
            return;
        }        
        var thing = "";
        if (gameMode === suddenDeath) {
            if (vowels.indexOf(letter) >= 0) {
                hangbot.sendMessage(src, "This is a Sudden Death game, you can't guess vowels!", hangchan);
                return;
            }
            if (sys.name(src) in guesses && guesses[sys.name(src)] >= maxGuesses) {
                hangbot.sendMessage(src, "You can only use /g " + maxGuesses + " times!", hangchan);
                return;
            }
            if (suddenDeathTime < suddenDeathChanceTime) {
                suddenDeathTime = suddenDeathChanceTime;
                thing = "The time limit was restored to " + suddenDeathTime / 60 + " minute(s)!";
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
        if (currentWord.indexOf("_") === -1) {
            p++;
        }
        usedLetters.push(commandData.toLowerCase());
        sendChanHtmlAll(" ", hangchan);
        hangbot.sendAll("" + sys.name(src) + " guessed " + letter.toUpperCase() + " and got it " + (correct ? "right (" + p + (p == 1 ? " point)" : " points)") : "wrong") + "! " + thing, hangchan);
        hangbot.sendAll("Current Word: " + currentWord.join(" ") + "", hangchan);

        if (currentWord.indexOf("_") === -1) {
            this.applyPoints(src, p);
            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " completed the word '" + currentWord.join("") + "'!", hangchan);
            var w = this.countPoints();
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            if (isEventGame) {
                sys.sendHtmlAll("<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> Suggest more event game categories <a href='http://pokemon-online.eu/threads/31530'>here</a>!", hangchan);
            }
            if (!pendingEvent) {
                hangbot.sendAll("Type /start answer:hint to start a new game. If you didn't win then wait " + winnerDelay + " seconds.", hangchan);
            }
            this.concludeGame(w);
        } else {
            if (!correct) {
                this.addMiss(src);
                if (gameMode === regular) {
                    parts--;
                }
            }
            if (parts > 0) {
                hangbot.sendAll("[Hint: " + hint + "]  [Letters used: " + usedLetters.map(function (x) {
                    return x.toUpperCase();
                }).join(", ") + "] " + (gameMode === regular ? "[Chances left: " + parts + "] " : ""), hangchan);
                if (gameMode === suddenDeath) {
                    this.addGuessUse(src);
                    if (guesses[sys.name(src)] >= maxGuesses && answers[sys.name(src)] >= maxAnswers[suddenDeath]) {
                        hangbot.sendAll("" + sys.name(src) + " is out of the game!", hangchan);
                    }
                }  
                sendChanHtmlAll(" ", hangchan);                
                this.applyPoints(src, p);
                SESSION.users(src).hangmanGuessTime = (new Date()).getTime() + answerDelay * 1000;
            } else {
                sys.sendAll("*** ************************************************************ ***", hangchan);
                hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' correctly, so the host (" + hostName + ") has won this game!", hangchan);
                sys.sendAll("*** ************************************************************ ***", hangchan);
                sendChanHtmlAll(" ", hangchan);
                if (isEventGame) {
                    sys.sendHtmlAll("<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> Suggest more event game categories <a href='http://pokemon-online.eu/threads/31530'>here</a>!", hangchan);
                }
                this.concludeGame();
            }
        }
    };
    this.submitAnswer = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
        var ans = commandData.replace(/\-/g, " ").replace(/[^A-Za-z0-9\s']/g, "").replace(/^\s+|\s+$/g, '').replace(/ {2,}/g," ");        
        if (sys.name(src).toLowerCase() === hostName.toLowerCase()) { // CHECK IF HOST CHANGED IP
            if (hostIpArray.indexOf(sys.ip(src)) === -1) {
                hostIpArray.push(sys.ip(src));
            }
        }
        if (hostIpArray.indexOf(sys.ip(src)) !== -1) {
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
        if (ans.length < 4) {
            hangbot.sendMessage(src, "The answer must have at least four letters!", hangchan);
            return;
        }
        if (sys.name(src) in answers && answers[sys.name(src)] >= maxAnswers[gameMode]) {
            hangbot.sendMessage(src, "You can only use /a " + maxAnswers[gameMode] + " times!", hangchan);
            return;
        }
        if (usedAnswers.indexOf(ans.toLowerCase()) >= 0) {
            hangbot.sendMessage(src, "This answer was already used!", hangchan);
            return;
        }
        for (var x in points) {
            if (sys.ip(src) === sys.dbIp(x) && sys.name(src)!== x) {
                hangbot.sendAll(x + " changed their name to " + sys.name(src) + "!", hangchan);
                this.switchPlayer(x, sys.name(src));
                if (sys.id(x) !== undefined) {                
                    SESSION.users(src).hangmanAnswerTime = SESSION.users(sys.id(x)).hangmanAnswerTime;
                }
                break;
            }
        }   
        if ((SESSION.users(src).smute.active && sys.auth(src) < 1)) {
            hangbot.sendMessage(src, "You need to wait for another 9 seconds before submitting another guess!", hangchan);
            return;
        }
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).hangmanAnswerTime) {
            hangbot.sendMessage(src, "You need to wait for another " + (Math.floor((SESSION.users(src).hangmanAnswerTime - now) / 1000) + 1) + " seconds before using /a again!", hangchan);
            return;
        }        
        if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|dildo|\banus|boner|\btits\b|condom|\brape\b/gi.test(ans)) {
            if (sys.existChannel("Victory Road"))
                hangbot.sendAll("Warning: Player " + sys.name(src) + " answered '" + ans + "' in #Hangman", sys.channelId("Victory Road"));
        }
        sendChanHtmlAll(" ", hangchan);
        var thing = "";
        if (gameMode === suddenDeath) {
            if (suddenDeathTime < suddenDeathChanceTime) {
                suddenDeathTime = suddenDeathChanceTime;
                thing = "The time limit was restored to " + suddenDeathTime / 60 + " minute(s)!";
            }
        }        
        usedAnswers.push(ans.toLowerCase());        
        if (ans.toLowerCase() === word.toLowerCase()) {
            hangbot.sendAll("" + sys.name(src) + " answered " + ans + "!", hangchan);            
            var p = 0,
                e;
            for (e in currentWord) {
                if (currentWord[e] === "_") {
                    p++;
                }
            }
            p = Math.floor((p * 1.34) + 1);
            this.applyPoints(src, p);

            sys.sendAll("*** ************************************************************ ***", hangchan);
            hangbot.sendAll("" + sys.name(src) + " answered correctly and got " + p + " points!", hangchan);
            var w = this.countPoints();
            sys.sendAll("*** ************************************************************ ***", hangchan);
            sendChanHtmlAll(" ", hangchan);
            if (isEventGame) {
                sys.sendHtmlAll("<font color=#3DAA68><timestamp/> <b>±" + hangbot.name + ":</b></font> Suggest more event game categories <a href='http://pokemon-online.eu/threads/31530'>here</a>!", hangchan);
            }
            if (!pendingEvent) {
                hangbot.sendAll("Type /start [answer]:[hint] to start a new game. If you didn't win then wait " + winnerDelay + " seconds.", hangchan);
            }
            this.concludeGame(w);
        } else {
            hangbot.sendAll("" + sys.name(src) + " answered " + ans + "! " + thing, hangchan);               
            this.addMiss(src);
            this.applyPoints(src, 0);
            this.addAnswerUse(src);
            hangbot.sendAll("" + sys.name(src) + "'s answer was wrong! The game continues!", hangchan);
            if (gameMode === suddenDeath) {
                if (guesses[sys.name(src)] >= maxGuesses && answers[sys.name(src)] >= maxAnswers[suddenDeath]) {
                    hangbot.sendAll("" + sys.name(src) + " is out of the game!", hangchan);
                }
            }            
            sendChanHtmlAll(" ", hangchan);
            SESSION.users(src).hangmanAnswerTime = (new Date()).getTime() + answerDelay * 2000;
            if (gameMode === tossUp) {
                SESSION.users(src).hangmanAnswerTime = (new Date()).getTime() + tossUpDelay * 1000;
            }
        }
    };
    this.startGame = function (src, commandData, command) {
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
        if ((SESSION.users(src).smute.active && sys.auth(src) < 1) || winner && (new Date()).getTime() < nextGame && sys.name(src).toLowerCase() !== winner.toLowerCase()) {
            hangbot.sendMessage(src, "Only the last winner can start a game! If the winner takes more than " + winnerDelay + " seconds, anyone can start a new game!", hangchan);
            return;
        }
        var data = commandData.split(":");
        inputWord = data[0];
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
        if (script.cmp(a, h)) {
            hangbot.sendMessage(src, "You can't have your answer the same as the hint!");
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

        if (command === "startsd" || command === "startsuddendeath") {
            var vowelCount = 0;
            for (var x = 0; x < a.length; x++) {
                for (var y in vowels) {
                    if (a.split("")[x] === vowels[y]) {
                        vowelCount += 1;
                    }
                }
            }
            if (vowelCount === a.length) {
                hangbot.sendMessage(src, "You can't have a Sudden Death answer with only vowels!", hangchan);
                return;
            }
            gameMode = suddenDeath;
        }
        else if (command === "starttossup" || command == "starttu") {
            gameMode = tossUp;
        }
        else {
            gameMode = regular;
        }
        isEventGame = false;
        this.createGame(sys.name(src), a, h, src, gameMode);
    };

    this.concludeGame = function (winner) {
        if (winner && !script.cmp(winner, hostName)) {
            if (sys.isInChannel(sys.id(winner), hangchan)) {
                this.setWinner(winner, false);
            } 
            else {
                this.setWinner(undefined, true);
            }
        } 
        else if (sys.isInChannel(sys.id(hostName), hangchan)) {
            this.setWinner(hostName, (hostIpArray.indexOf(null) !== -1 && hostName == hangbot.name));
        }
        else if (!pendingEvent) {
            hangbot.sendAll((isEventGame ? "A":"The winner isn't in the channel, so a") + "nyone may start a game now!", hangchan);                
            this.setWinner(undefined, true);
        }
        if (gameMode === suddenDeath) {
            suddenDeathTime = suddenDeathLimit;
        }
        if (isEventGame) {
            eventCount = eventLimit;
        }
        if (pendingEvent) {
            eventDelay = true;
        }        
    };

    //adapted from string_to_slug http://dense13.com/blog/2009/05/03/converting-string-to-slug-javascript/
    this.removeNonEnglish = function (str) {
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
        var validCharacters = alphabet,
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
        if ((a.length > 60 || a.length < 4) && result.errors.push.length === 0) {
            result.errors.push("Your answer cannot be longer than 60 characters or shorter than 4 characters!");
        }
        var unlosable = function(ans) {
            return alphabet.every(function(e) {
                return ans.indexOf(e) > -1;
            });
        }
        var _a = a.replace(/ /g, "").split("");
        if (unlosable(_a)) {
            result.errors.push("Your answer cannot contain every letter of the alphabet!");
        }
        else if ((this.removeDupes(_a).length + defaultParts - 1) >= 26) {
            result.errors.push("Your game is impossible to lose given " + defaultParts + " chances. Please change your answer!");
        }
        result.answer = a;
        return result;
    };

    this.createGame = function (name, a, h, src, mode) {
        var validCharacters = alphabet;
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
        passCount = 0;
        
        if (gameMode === suddenDeath) {
            guesses = {};
        }
        if (gameMode === tossUp) {
            tossUpCount = 0;
            tossUpGuess = 7;
        }
        checked = [];
        usedLetters = [];
        usedAnswers = [];
        currentWord = [];
        usedTossUps = [];
        tossUpOrder = [];
        validFills = [];    
        
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
        if (gameMode === tossUp) {          
            var x, y, i = 0, total = word.length, keys = [];        
            while (i < total) {
                x = Math.floor(Math.random() * word.length);
                if (keys[x] == undefined) {
                    if (word[x] != " " && isNaN(word[x])) {
                        keys[x] = word[x];
                        i++;
                    }
                    else {
                        keys[x] = "-";
                        i++;
                    }
                }
            }       
            for (y in keys) {
                if (keys[y] != "-") {
                    validFills.push(y);
                }
                tossUpOrder.push(y);
            }
            x = Math.floor(Math.random() * validFills.length);
            y = validFills[x];
            currentWord[tossUpOrder[y]] = word[tossUpOrder[y]].toUpperCase();
            validFills.splice(x, 1);
            usedTossUps.push(y);
            countMax = (currentWord.join("").match(/_/g) || []).length; 
        }
        hostIpArray = [];
        hostIpArray[0] = src ? sys.ip(src) : null;
        hostName = name;

        sendChanHtmlAll(" ", hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        if (isEventGame) {
            hangbot.sendAll("A " + (gameMode == regular ? "regular":gameMode == suddenDeath ? "Sudden Death":"Toss Up") + " Event Game has started! The winner of this game will receive 1 Leaderboard point!", hangchan);
        } else {
            hangbot.sendAll(hostName + " started a new " + (gameMode == regular ? "":gameMode == suddenDeath ? "Sudden Death":"Toss Up") + " game of Hangman!", hangchan);
        }
        suddenDeathTime = suddenDeathLimit;
        hangbot.sendAll(currentWord.join(" "), hangchan);
        hangbot.sendAll(hint, hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        sendChanHtmlAll(" ", hangchan);
        if (src) {
            hangbot.sendMessage(src, "You started a Hangman game with the answer '" + word.toUpperCase() + "'. If you misspelled the answer or made some mistake, use /end to stop the game and fix it.", hangchan);
        }
        hangbot.sendAll("Type " + (gameMode !== tossUp ? "/g [letter] to guess a letter, and ":"") + "/a [answer] to guess the answer!", hangchan);
        if (gameMode === suddenDeath) {
            hangbot.sendAll("Guess the answer within " + (suddenDeathLimit / 60) + " minute(s)!", hangchan);
        }
        if (gameMode === tossUp) {
            hangbot.sendAll("Guess the answer before the game reaches " + cutOff + "%!", hangchan);
        }
        sendChanHtmlAll(" ", hangchan);
        var time = parseInt(sys.time(), 10);
        if (time > this.lastAdvertise + 60 * 20) {
            this.lastAdvertise = time;
            sys.sendAll("", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new " + (isEventGame ? "Event G":"g") + "ame of Hangman with the hint '" + hint.trim() + "' started in #Hangman!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            sys.sendAll("", 0);
        }
	var playerlist = sys.playersOfChannel(hangchan);
        var playerId;
        if (isEventGame) {
            for (var player in playerlist) {
                playerId = playerlist[player];
                if (flashlist.ip[sys.ip(playerId)]) {
                    sys.sendHtmlMessage(playerId, "<ping/>", hangchan);
                }
                else if (flashlist.name[sys.name(playerId)]) {
                    sys.sendHtmlMessage(playerId, "<ping/>", hangchan);
                }
            } 
        }            
    };
    this.startAutoGame = function (isEvent, mode) {
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
    };
    this.addGuessUse = function (src) {
        if (!guesses[sys.name(src)]) {
            guesses[sys.name(src)] = 0;
        }
        guesses[sys.name(src)] += 1;
        hangbot.sendMessage(src, "You can only use /g " + (maxGuesses - guesses[sys.name(src)]) + " more times!", hangchan);
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
        hangbot.sendAll("" + w + " has won " + nonFlashing(hostName) + "'s game with " + maxPoints + " points!", hangchan);
        var ranking = [],
            p;
        for (p in points) {
            ranking.push(p + " (" + points[p] + " points" + (p in misses ? ", " + misses[p] + " miss(es)" : "") + ")");
        }
        sys.sendAll("±Results: " + ranking.join(", "), hangchan);
        if (isEventGame) {
            hangbot.sendAll(w + " won an Event Game and received 1 Leaderboard point!", hangchan);
            var lbWon = this.getPropCase(leaderboards.current, w),
                lbScore = (!leaderboards.current[lbWon] ? 0 : leaderboards.current[lbWon]);
            if (!lbWon) {
                leaderboards.current[w] = 0;
            }
            if (lbWon !== w) {
                delete leaderboards.current[lbWon];
            }
            leaderboards.current[w] = lbScore + 1;
            sys.write(leaderboardsFile, JSON.stringify(leaderboards));
        }
        return w;
    };
    this.getPropCase = function (obj, prop) {
        var key;
        for (key in obj) {
            if (key.toLowerCase() === prop.toLowerCase()) {
                return key;
            }
        }
        return false;
    };
    this.setWinner = function (name, immediate) {
        word = undefined;
        winner = name;
        if (!immediate) {
            nextGame = (new Date()).getTime() + winnerDelay * 1000;
        }
        this.resetTimers();
    };
    this.viewLeaderboards = function(src, commandData, last) {
        var cut = 10;
        var fromLastMonth = last;
        var lb = fromLastMonth ? leaderboards.last : leaderboards.current;
        var list = Object.keys(lb).sort(function(a, b) {
            return lb[b] - lb[a];
        });
        var name, top = list.slice(0, cut);
        sys.sendMessage(src, "", hangchan);
        sys.sendMessage(src, "*** " + (fromLastMonth ? "LAST MONTH'S " : "") + "HANGMAN LEADERBOARDS ***", hangchan);
        for (var e = 0; e < top.length; e++) {
            name = top[e];
            hangbot.sendMessage(src, (e + 1) + ". " + name + ": " + lb[name] + " point(s)", hangchan);
        }
        var nameCased = this.getPropCase(lb, sys.name(src));
        name = (!nameCased ? commandData : nameCased);
        if (commandData) {
            var reqCased = this.getPropCase(lb, commandData);
            var req = (!reqCased ? commandData : reqCased);
            if (req in lb) {
                hangbot.sendMessage(src, (list.indexOf(req) + 1) + ". " + req + ": " + lb[req] + " point(s)", hangchan);
            }
        } else if (name in lb) {
            if (top.indexOf(name) === -1) {
                hangbot.sendMessage(src, (list.indexOf(name) + 1) + ". " + name + ": " + lb[name] + " point(s)", hangchan);
            } 
        } else if (!fromLastMonth) {
            hangbot.sendMessage(src, "You still have not won any Event Games!", hangchan);
        }
        sys.sendMessage(src, "", hangchan);
    };
    this.passLeaderboard = function (src, commandData) {
        if (commandData === undefined) {
            hangbot.sendMessage(src, "Please choose a target user that is logged on the same IP.", hangchan);
            return;
        }
        var currentName = sys.name(src);
        var targetName = commandData.toCorrectCase();         
        var lbUser = this.getPropCase(leaderboards.current, currentName),
            lbScore = (!leaderboards.current[lbUser] ? 0:leaderboards.current[lbUser]),
            lbTar = this.getPropCase(leaderboards.current, targetName);
            
        if (currentName.toLowerCase() === targetName.toLowerCase()) {
            return;
        }            
        if (!lbUser) {
            hangbot.sendMessage(src, "You're not rated on the leaderboard!", hangchan);
            return;
        }
        if (lbScore === 0) {
            hangbot.sendMessage(src, "You don't have any points to transfer!", hangchan);
            return;
        }
        if (sys.id(targetName) === undefined) {
            hangbot.sendMessage(src, "Your target is offline!", hangchan);
            return;
        }
        if (!sys.dbRegistered(targetName)) {
            hangbot.sendMessage(src, "That user isn't registered. You need to register it first!", hangchan);
            return;
        }
        if (sys.ip(sys.id(targetName)) !== sys.ip(src)) {
            hangbot.sendMessage(src, "Both accounts must be on the same IP to pass your leaderboard points!", hangchan);
            return;
        }
        if (!lbTar) {
            leaderboards.current[targetName] = lbScore;
        }
        else {
            leaderboards.current[lbTar] += lbScore;
        }
        delete leaderboards.current[lbUser];
        sys.write(leaderboardsFile, JSON.stringify(leaderboards));
        hangbot.sendAll(currentName + " passed their hangman leaderboard points to " + targetName + "!", hangchan);
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
        if (winner && sys.name(src) !== winner && hangman.authLevel(src) < 1) {
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
            hangbot.sendMessage(src, "You cannot pass starting rights to this person!", hangchan);
            return;
        }
        if (passCount >= passLimit) {
            hangbot.sendMessage(src, "You can't keep passing the rights around!", hangchan);
            return;
        }
        this.setWinner(sys.name(sys.id(commandData)));
        hangbot.sendAll("" + sys.name(src) + " has passed starting rights to " + commandData + "!", hangchan);
        passCount += 1;
    };
    this.myAnswer = function (src){
        if (word) {
            if (hostIpArray.indexOf(sys.ip(src)) !== -1) {
                hangbot.sendMessage(src, "The answer for your game is " + word.toUpperCase() + "!", hangchan);
            } else{
                hangbot.sendMessage(src, "You are not the host, so you can't use this command!", hangchan);
            }
        } else {
            hangbot.sendMessage(src, "No game is running!", hangchan);
        }
    };
    this.endGame = function (src, endEvent) {
        if (word) {
            if (isEventGame && !endEvent) {
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
        } else {
            hangbot.sendMessage(src, "No game is running!", hangchan);
        }
    };
    this.resetTimers = function () {
        var p, players = sys.playersOfChannel(hangchan),
            now = (new Date()).getTime();
        for (p in players) {
            SESSION.users(players[p]).hangmanAnswerTime = now;
            SESSION.users(players[p]).hangmanGuessTime = now;
        }
        idleCount = 0;
    };
    this.startEventGame = function(mode) {
        hangman.startAutoGame(true, mode);
        pendingEvent = false;
    };
    this.viewGame = function (src) {
        if (gameMode === 1) {
            if (!guesses[sys.name(src)]) { // guesses for sudden death
                guesses[sys.name(src)] = 0;
            }
        }
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        sys.sendHtmlMessage(src, "<font color='red'><b>Current Word</b>: " + currentWord.join(" ") + "</font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>[Hint: " + hint + "]  [Letters used: " + usedLetters.map(function (x) {
            return x.toUpperCase();
        }).join(", ") + "]  [Chances left: " + (gameMode !== 1 ? parts : (maxGuesses - guesses[sys.name(src)])) + "] </font>", hangchan);
        if (isEventGame) {
            if (gameMode === regular) {
                sys.sendHtmlMessage(src, "<b><font color='purple'>*** Regular Event Game ***</font></b>", hangchan);
            }
            if (gameMode === suddenDeath) {
                sys.sendHtmlMessage(src, "<b><font color='purple'>*** Sudden Death Event Game ***</font></b>", hangchan);
            }
            if (gameMode === tossUp) {
                sys.sendHtmlMessage(src, "<b><font color='purple'>*** Toss Up Event Game ***</font></b>", hangchan);
            }
        } else {
            sys.sendHtmlMessage(src, "<font color='red'>Current " + (gameMode === regular ? "":(gameMode === suddenDeath ? "Sudden Death":"Toss Up")) + " game started by " + hostName + "</font>", hangchan);
        }
    };
    this.removeDupes = function (arr) {
        var result = {};
        for (var x in arr) {
            result[arr[x]] = 1;
        }
        return Object.keys(result);
    };
    this.showRules = function (src) {
        var x, rules = [
            "",
            "*** *********************************************************************** ***",
            "±Rules: Do not create inappropriate answers, hints or guesses, or attempt to troll the game in any way. This includes but is not limited to offences such as guessing uncommon letters, deliberately spoiling the answer, or ending the game for reasons other than correcting errors.",
            "±Rules: Make sure all games are accessible, playable and spelled correctly. This includes but is not limited to specific and non-opinionated hints/answers as well as having a relevant hint for the answer. If the answer is not in English, the language of the answer should be stated in the hint. Games that are lists e.g \"/start Bulbasaur Chikorita Treecko:Grass-type Pokemon\" are not allowed.",
            "±Rules: Remember to act in a cordial manner, both when interacting with channel users and authority, and playing the game.",
            "±Rules: Pay attention to channel and server authority (under /has and /auth respectively). Server /rules apply here too. If you have any doubt or see someone breaking the rules, contact the appropriate person (HA for hangman, auth for server).",
            "*** *********************************************************************** ***",
            ""
        ];
        for (x = 0; x < rules.length; x++) {
            sys.sendMessage(src, rules[x], hangchan);
        }
    };
    this.showHelp = function (src) {
        var x, help = [
            "",
            "*** *********************************************************************** ***",
            "±Actions: To see the current puzzle, type /view.",
            "±Actions: To guess a character, type /g [character]. For example, to guess F, type /g F.",
            "±Actions: If you think you already know the answer, you can use /a [answer] to submit a full answer. For example, if you think the answer is Pikachu, type /a Pikachu.",
            "±Actions: If you guess wrong too many times, the host wins!",
            "*** *********************************************************************** ***",
            "±Goal: Your goal is to guess a word on a letter by letter basis. A hint and the number of characters will be provided as a help.",
            "±Goal: Whenever someone guesses a letter correctly, that letter will be filled in the word.",
            "±Goal: Guessing a correct letter(use /g) gives a point for each time it appears. If you guess the last letter you get 1 additional point.",
            "±Goal: If you guess the whole word correctly(use /a) you get 1 point for each letter filled, 1 extra point for winning and an additional point for every 3 letters filled.",
            "*** *********************************************************************** ***",
            "±Hosting: To host a game, type /start Answer:Hint. For example, to create a game where the answer is Pikachu and the hint is Pokémon, use /start Pikachu:Pokémon. The host can't guess or answer during their own game.",
            "±Hosting: The winner of the previous game has the starting rights for hosting the next game, and may use /pass User to give those rights to another user. For example, /pass guest1234.",
            "±Hosting: If the user with starting rights doesn't start a new game within " + winnerDelay + " seconds, anyone can host a new game.",
            "*** *********************************************************************** ***",
            "±Rules: Do not create inappropriate answers, hints or guesses, or attempt to troll the game in any way. This includes but is not limited to offences such as guessing uncommon letters, deliberately spoiling the answer, or ending the game for reasons other than correcting errors.",
            "±Rules: Make sure all games are accessible, playable and spelled correctly. This includes but is not limited to relevant, non-vague, specific and non-opinionated subjects, games in other languages, suitable hints. Games that are lists are not allowed. For example, \"/start Pichu Pikachu and Raichu:Pokémon\" are not allowed as the answer is a list of Pokémon.",
            "±Rules: Remember to act in a cordial manner, both when interacting with channel users and authority, and playing the game.",
            "±Rules: Pay attention to channel and server authority (under /has and /auth respectively). Server /rules apply here too. If you have any doubt or see someone breaking the rules, contact the appropiate person (HA for hangman, auth for server).",
            "*** *********************************************************************** ***",
            "±Unown: For more information on Sudden Death, visit http://pokemon-online.eu/threads/30665/",
            "±Unown: For more information on Toss Up, visit http://pokemon-online.eu/threads/33517/",
            "*** *********************************************************************** ***",
            ""
        ];
        for (x in help) {
            sys.sendMessage(src, help[x], hangchan);
        }
    };

    this.autoGame = function (src, commandData) {
        if (commandData === undefined) {
            if (autoGamesEnabled) {
                hangbot.sendMessage(src, "Games are set to automatically start.", hangchan);
                return;
            } else {
                hangbot.sendMessage(src, "Games are set to not automatically start.", hangchan);
                return;
            }
        }
        var turning = commandData.toLowerCase();
        if (turning === "off") {
            if (!autoGamesEnabled) {
                hangbot.sendMessage(src, "Automatic games are already turned off.", hangchan);
                return;
            } else {
                autoGamesEnabled = false;
                hangbot.sendMessage(src, "You turned off Automatic games.", hangchan);
                return;
            }
        }
        if (turning === "on") {
            if (autoGamesEnabled) {
                hangbot.sendMessage(src, "Automatic games are already turned on.", hangchan);
            }
            else {
                autoGamesEnabled = true;
                hangbot.sendMessage(src, "You turned on Automatic games.", hangchan);
            }
        }
    };

    this.eventGame = function (src, commandData) {
        if (commandData === undefined) {
            if(eventGamesEnabled) {
                hangbot.sendMessage(src, "Event Games are set to start.", hangchan);
                return;
            }
            else {
                hangbot.sendMessage(src, "Event Games are not set to start.", hangchan);
                return;
            }
        }
        var some = commandData.toLowerCase();
        if (some === "off") {
            if(!eventGamesEnabled) {
                hangbot.sendMessage(src, "Event Games are already turned off.", hangchan);
                return;
            } else {
                eventGamesEnabled = false;
                hangbot.sendMessage(src, "Event Games have been turned off.", hangchan);
                return;
            }
        }
        if (some === "on") {
            if (eventGamesEnabled) {
                hangbot.sendMessage(src, "Event Games are already turned on.", hangchan);
            } else {
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
    
    this.flashlist = function (src) {
        if (flashlist.ip[sys.ip(src)] || flashlist.name[sys.name(src)]) {       
            if (flashlist.ip[sys.ip(src)]) {
                delete flashlist.ip[sys.ip(src)];
            }
            if (flashlist.name[sys.name(src)]) {
                delete flashlist.name[sys.name(src)];
            }
            hangbot.sendMessage(src, "You have been removed from the flash list.", hangchan);           
        } else {
            flashlist.ip[sys.ip(src)] = true;
            flashlist.name[sys.name(src)] = true;
            hangbot.sendMessage(src, "You have been added to the flash list.", hangchan);
        }
        sys.write(flashlistFile, JSON.stringify(flashlist));
    };
    
    this.addQuest = function (src, commandData) {
        if (commandData == "*" || commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format for Hangman game! Proper format is 'answer:hint'.", hangchan);
            return;
        }
        var info = commandData.split(":"),
            newQ = info[0].toLowerCase(),
            newH = info[1];
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

        var index = autoGames.length + 1,
            author = sys.name(src);
        autoGames.push(index + ":" + author + ":" + newQ + ":" + newH + ":7");
        sys.write(autoGamesFile, JSON.stringify(autoGames));
        sys.appendToFile(changeLogFile, new Date().getTime() + "|||" + index + "::" + newQ + "::" + newH +  "::added::" + sys.name(src) + "::\n");
        hangbot.sendMessage(src, "You have successfully added a new question!", hangchan);
    };

    this.searchQuest = function (src, commandData) {
        if (word && isEventGame) {
            hangbot.sendMessage(src, "You can't use this command when an Event Game is running!", hangchan);
            return;
        } else {
            if (commandData === undefined) {
                hangbot.sendMessage(src, "Invalid format. Proper format is /searchquest query:criteria where criteria is (w)ord (default), (h)int or (i)ndex.", hangchan);
                return;
            }
            if (autoGames.length === 0) {
                hangbot.sendMessage(src, "There are no games in the database.", hangchan);
                return;
            } else{
                if (commandData.indexOf(":") === -1) {
                    hangman.searchByWord(src, commandData);
                } else {
                    var search = commandData.split(":")[0],
                        method = commandData.split(":")[1];
                    switch (method) {
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

    this.searchByWord = function (src, commandData){
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

    this.searchByHint = function (src, commandData){
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

    this.searchByIndex = function (src, commandData){
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
    
    this.searchByEditor = function (src, commandData){
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

    this.deleteQuest = function (src, commandData) {
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
        var del = autoGames[commandData - 1].split(":"),
            a = del[2].toUpperCase(),
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
            i = e + 1;
            sub = i + ":" + game[1] + ":" + game[2] + ":" + game[3] + ":" + c;
            autoGames.splice(e, 1, sub);
        }
        sys.write(autoGamesFile, JSON.stringify(autoGames));
        sys.appendToFile(changeLogFile, new Date().getTime() + "|||" + commandData + "::" + a + "::" + h + "::deleted::" + sys.name(src) + "::\n");
        hangbot.sendMessage(src, "You have successfully deleted the question!", hangchan);
    };

    this.changeWord = function (src, commandData) {
        if (autoGames.length === 0) {
            hangbot.sendMessage(src, "There are no games in the database, you can't edit anything.", hangchan);
            return;
        }
        if (commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format. Proper format is /changeword index:word.", hangchan);
            return;
        }
        var info = commandData.split(":"),
            i = info[0];
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
    
        var edit = autoGames[i - 1].split(":"),
            a = edit[2].toUpperCase(),
            h = edit[3],
            c = edit.length < 5 ? defaultParts : edit[4];
        hangbot.sendMessage(src, "(Before) Index: " + i + " - Word: " + a + " - Hint: " + h, hangchan);

        a = info[1].toLowerCase();
        var sub = i + ":" + sys.name(src) + ":" + a + ":" + h + ":" + c;
    
        hangbot.sendMessage(src, "(After) Index: " + i + " - Word: " + a.toUpperCase() + " - Hint: " + h, hangchan);
    
        autoGames.splice(i - 1, 1, sub);
        sys.write(autoGamesFile, JSON.stringify(autoGames));
        sys.appendToFile(changeLogFile, new Date().getTime() + "|||" + i + "::" + h + "::" + a +  "::word changed::" + sys.name(src) + "::\n");
    };

    this.changeHint = function (src, commandData) {
        if (autoGames.length === 0) {
            hangbot.sendMessage(src, "There are no games in the database, you can't edit anything.", hangchan);
            return;
        }
        if (commandData.indexOf(":") === -1) {
            hangbot.sendMessage(src, "Invalid format. Proper format is /changeword index:hint.", hangchan);
            return;
        }
        var info = commandData.split(":"),
            i = info[0];
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
        sys.appendToFile(changeLogFile, new Date().getTime() + "|||" + i + "::" + a + "::" + h +  "::hint changed::" + sys.name(src) + "::\n");
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
            hangbot.sendMessage(src, "answerssd: Set how many times each player can use /a in a Sudden Death game (currently set to " + maxAnswers[suddenDeath] + "). ", hangchan);
            hangbot.sendMessage(src, "answerstossup: Set how many times each player can use /a in a Toss Up game (currently set to " + maxAnswers[tossUp] + "). ", hangchan);
            hangbot.sendMessage(src, "sdlimit: Set the initial time limit for Sudden Death games. (currently set to " + suddenDeathLimit / 60 + " minutes). ", hangchan);
            hangbot.sendMessage(src, "sdchancetime: Set the chance time given when Sudden Death timers go below \"sdlimit\". (currently set to " + suddenDeathChanceTime / 60 + " minutes). ", hangchan);
            hangbot.sendMessage(src, "tossupdelay: Set the cooldown of /a for Toss Up games. (currently set to " + tossUpDelay + " seconds). ", hangchan);
            hangbot.sendMessage(src, "cutoff: Set the % completion of Toss Up games before they fail. (currently set to " + cutOff + "%). ", hangchan);
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
                hangbot.sendMessage(src, "Winner will now have " + val + " second(s) to start a new game.", hangchan);
                break;
            case "guessessd":
                maxGuesses = val;
                hangbot.sendMessage(src, "Players can now use /g " + val + " times in a sudden death game.", hangchan);
                break;
            case "answersreg":
                maxAnswers[regular] = val;
                hangbot.sendMessage(src, "Players can now use /a " + val + " times in a regular game.", hangchan);
                break;
            case "answerssd":
                maxAnswers[suddenDeath] = val;
                hangbot.sendMessage(src, "Players can now use /a " + val + " times in a Sudden Death game.", hangchan);
                break;
            case "answerstossup":
                maxAnswers[tossUp] = val;
                hangbot.sendMessage(src, "Players can now use /a " + val + " times in a Toss Up game.", hangchan);
                break;
            case "sdlimit":
                if (word && gameMode == suddenDeath) {
                    hangbot.sendMessage(src, "You can't use this during Sudden Death games.", hangchan);
                    return;
                }
                if (val < suddenDeathChanceTime / 60) {
                    hangbot.sendMessage(src, "Sudden Death time limit must be more than or equal to the chance time!", hangchan);
                    return;
                }
                suddenDeathLimit = val * 60;
                hangbot.sendMessage(src, "Sudden Death games now have a " + val + " minute time limit.", hangchan);
                break;
            case "sdchancetime":
                if (word && gameMode == suddenDeath) {
                    hangbot.sendMessage(src, "You can't use this during Sudden Death games.", hangchan);
                    return;
                }
                if (val > suddenDeathLimit / 60) {
                    hangbot.sendMessage(src, "Sudden Death chance time must be less than or equal to the initial time limit!", hangchan);
                    return;
                }
                suddenDeathChanceTime = val * 60;
                hangbot.sendMessage(src, "Sudden Death chance time is now at " + val + " minute(s).", hangchan);
                break;
            case "cutoff":
                cutOff = val;
                hangbot.sendMessage(src, "Toss Up games now fail at " + val + "% and above.", hangchan);
                break;
            case "tossupdelay":
                tossUpDelay = val;
                hangbot.sendMessage(src, "Players can now use /a every " + val + " seconds in a Toss Up game.", hangchan);
                break;
            case "event":
                eventLimit = val * 60;
                hangbot.sendMessage(src, "Event games will now happen every " + val + " minutes.", hangchan);
                break;
            default:
                break;
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
            "/hrules or /hangmanrules: To see the hangman rules.",
            "/view: To view the current game's state.",
            "/start: To start a new game of hangman. Format /start answer:hint. Example: /start Pikachu:Pokémon. Use /startsd or /startsuddendeath for Sudden Death games and /starttu or /starttossup Toss Up games.",
            "/pass: To pass starting rights to someone else.",
            "/has or /hangmanadmins: To see a list of hangman auth.",
            "/end: To end a game you started.",
            "/lb or /leaderboard: To see the event leaderboard. You can type /lblast or /leaderboardlast to see last months leaderboard.",
            "/passlb [user] or /passleaderboard [user]: Passes all your leaderboard points to another alt on the same IP. Both alts must also be logged on.",
            "/myanswer: To see the answer you submitted (host only).",
            "/flashme: Toggle Event Game flashes on or off."
        ];
        var adminHelp = [
            "*** Hangman Admin Commands ***",
            "/hangmanban: To ban a user in hangman. Format /hangmanban name:reason:time",
            "/hangmanunban: To hangman unban a user.",
            "/hangmanbans: Searches the hangman banlist, show full list if no search term is entered.",
            "/flashhas: Flashes all Hangman Admins. Use /flashhas [phrase] to use a different message (abuse will be punished for).",
            "/passha: To give your Hangman Admin powers to an alt.",
            "/searchquest: To search a question in the autogame/eventgame data base. Format /searchquest query:criteria where criteria is (w)ord (default), (h)int, (i)ndex or (e)ditor.",
            "/checkgame: To see the answer of a game (only once per game). Prevents playing if used.",
            "/changelog: Display event game edit logs. Format /changelog range:criteria"
        ];
        var superAdminHelp = [
            "*** Hangman Super Admin Commands ***",
            "/config: To change the answer delay time and other settings. Format /config parameter:value. Type /config by itself to see more help.",
            "/hangmanadmin: To promote a new Hangman Admin. Use /shangmanadmin for a silent promotion.",
            "/hangmanadminoff: To demote a Hangman Admin or a Hangman Super Admin. Use /shangmanadminoff for a silent demotion.",
            "/addquest: To add a question to the autogame/eventgame data base. Format /addquest Answer:Hint:Guess number.",
            "/deletequest: To delete a question in the autogame/eventgame data base. Format /deletequest index.",
            "/changeword: To change the word in a question in the autogame/eventgame data base. Format /changeword index:word.",
            "/changehint: To change the hint in a question in the autogame/eventgame data base. Format /changeword index:hint.",
            "/eventgame: To turn eventgames on/off. Format /eventgame on or /eventgame off.",
            "/forceevent: Forces a regular event game to start.",
            "/forcesd or /forcesuddendeath: Forces a Sudden Death event game to start.",
            "/forcetu or /forcetossup: Forces a Toss Up event game to start."
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
    this.isChannelAdmin = function (src) {
        return hangman.isHangmanAdmin(src) ? true : hangman.isHangmanSuperAdmin(src);
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
        if (command === "start" || command === "startsuddendeath" || command === "startsd" || command === "starttossup" || command === "starttu") {
            hangman.startGame(src, commandData, command);
            return true;
        }
        if (command === "pass") {
            hangman.passWinner(src, commandData);
            return true;
        }
        if (command === "leaderboard" || command === "lb" || command === "leaderboardlast" || command === "lblast") {
            hangman.viewLeaderboards(src, commandData, (command === "leaderboardlast" || command === "lblast"));
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
        if (command === "flashme") {
            hangman.flashlist(src);
            return true;
        }
        if (hangman.authLevel(src) < 1 && !(command === "end" && hostIpArray.indexOf(sys.ip(src)) !== -1)) {
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
        
        if (command === "changelog") {
            if (commandData === undefined) {
                hangbot.sendMessage(src, "Command syntax: /changelog range:criteria", hangchan);
                return true;
            }
            hangman.showLog(src, commandData, changeLogFile, "Event Game Changes", function(x) {
                var info = x.split("|||"),
                    time = new Date(parseInt(info[0], 10)).toUTCString(),
                    p1Info = info[1].split("::"),
                    index = p1Info[0],
                    q = p1Info[1] + ":" + p1Info[2],
                    act = p1Info[3],
                    who = p1Info[4];
                return "[" + index + "] " + q + " was " + act + " by " + who + " --- (" + time + ")";
            });
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
        
        if (command === "changeword") {
            hangman.changeWord(src, commandData);
            return true;
        }
        
        if (command === "changehint") {
            hangman.changeHint(src, commandData);
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
                hangbot.sendMessage(src, "A game is already running!", hangchan);
            }
            else{
                hangman.startEventGame(regular);
            }
            return true;
        }
		if (command === "forcesuddendeath" || command === "forcesd") {
            if (word) {
                hangbot.sendMessage(src, "A game is already running!", hangchan);
            } else {
                hangman.startEventGame(suddenDeath);
            }
            return true;
        }
	if (command === "forcetossup" || command === "forcetu") {
            if (word) {
                hangbot.sendMessage(src, "A game is already running!", hangchan)
            }
            else {
                hangman.startEventGame(tossUp);
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
                sys.sendHtmlMessage(src, "<font color=" + script.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
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
                        sys.sendHtmlMessage(src, "<font color=" + script.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
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
                sys.sendHtmlMessage(src, "<font color=" + script.getColor(id) + "><timestamp/> <b>" + html_escape(sys.name(id)) + "</b></font>", channel);
            }
        }
        sys.sendMessage(src, "", channel);
    };
    this.promoteAdmin = function (src, commandData, channel, silent) {
        if (commandData === undefined) {
            hangbot.sendMessage(src, "Please enter a valid user to promote.", channel);
            return;
        }
        if (sys.dbIp(commandData) === undefined) {
            hangbot.sendMessage(src, "This user doesn't exist.", channel);
            return;
        }
        if (!sys.dbRegistered(commandData)) {
            hangbot.sendMessage(src, "They aren't registered so you can't give them authority.", hangchan);
            if (sys.id(commandData) !== undefined) {
                hangbot.sendMessage(sys.id(commandData), "Please register ASAP, before getting hangman authority.", channel);
            }
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
            hangbot.sendMessage(src, "Please enter a valid user to promote.", channel);
            return;
        }
        if (sys.dbIp(commandData) === undefined) {
            hangbot.sendMessage(src, "This user doesn't exist.", channel);
            return true;
        }
        if (!sys.dbRegistered(commandData)) {
            hangbot.sendMessage(src, "They aren't registered so you can't give them authority.", channel);
            if (sys.id(commandData) !== undefined) {
                hangbot.sendMessage(sys.id(commandData), "Please register ASAP, before getting hangman authority.", channel);
            }
            return true;
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
        try {
            flashlist = JSON.parse(sys.read(flashlistFile));
        } catch (err) {
            hangbot.sendAll("Unable to load Hangman Flashlist.", hangchan);
            flashlist = {
                ip: {},
                name: {}
            };
        }
    };
    this.beforeChannelJoin = function (src, channel) {
        if (channel !== hangchan) {
            return false;
        }
        if (SESSION.users(src).hangmanGuessTime === undefined) {
            SESSION.users(src).hangmanGuessTime = (new Date()).getTime();
        }
        if (SESSION.users(src).hangmanAnswerTime === undefined) {
            SESSION.users(src).hangmanAnswerTime = (new Date()).getTime();
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
        if (word && gameMode === suddenDeath) {
            if (suddenDeathTime > 0) {
                suddenDeathTime--;
                if (suddenDeathTime === suddenDeathChanceTime || suddenDeathTime === suddenDeathChanceTime / 2) {
                    hangbot.sendAll("You only have " + (suddenDeathTime / 60) + " minute(s) left!", hangchan);
                }
            } else {
                sys.sendAll("*** ************************************************************ ***", hangchan);
                hangbot.sendAll("HANGED! No one guessed the word '" + word.toUpperCase() + "' in time, so the host (" + hostName + ") has won this game!", hangchan);
                sys.sendAll("*** ************************************************************ ***", hangchan);
                sendChanHtmlAll(" ", hangchan);
                this.concludeGame();
            }
        }      
        if (word && gameMode === tossUp){
            tossUpCount++;
            if (tossUpCount === tossUpGuess) {
                tossUpCount = 0;
                tossUpGuess += 1;
                this.unownGuess();
            }
        }        
        if (eventCount === 0 && eventGamesEnabled) {
            hangman.checkNewMonth();
            eventCount = -1;
            if (word) {
                pendingEvent = true;
            } else {
                hangman.startEventGame(nextGameMode);
                switch (nextGameMode) {
                    case regular:
                        nextGameMode = suddenDeath;
                        break;
                    case suddenDeath:
                        nextGameMode = tossUp;
                        break;
                    case tossUp:
                        nextGameMode = regular;
                        break;
                    default:
                        break;
                }
            }
        }
        if (eventDelay) {
            if (delayCount < delayLimit) {
                delayCount++;
            }
            else {
                delayCount = 0;
                eventDelay = false;
                hangman.startEventGame(nextGameMode);
                switch (nextGameMode) {
                    case regular:
                        nextGameMode = suddenDeath;
                        break;
                    case suddenDeath:
                        nextGameMode = tossUp;
                        break;
                    case tossUp:
                        nextGameMode = regular;
                        break;
                    default:
                        break;
                }
            }
        }
        if (winner && (new Date()).getTime() > nextGame && !word) {
            this.setWinner(undefined, true);
            hangbot.sendAll("Anyone may start a game now!", hangchan);
        }
        if (eventCount === 60 && eventGamesEnabled) {
            var lb = leaderboards.current,
                list = Object.keys(lb).sort(function (a, b) {
                return lb[b] - lb[a];
            });

            sys.sendAll("", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
   //       hangbot.sendAll("The top player on the Hangman Leaderboard is " + (list[0] !== undefined ? nonFlashing(list[0]) : "~No Top Player Yet~") + "! Challenge them by winning Event Games in #Hangman!", 0);
            hangbot.sendAll(list[0] !== undefined ? "The top player on the Hangman Leaderboard is " + nonFlashing(list[0]) + "! Challenge them by winning Event Games in #Hangman!":"A new event game of #Hangman will start in about a minute!", 0);
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
    this.showLog = function (src, commandData, file, name, parser) {
        var log = sys.getFileContent(file);
        if (log) {
            log = log.split("\n");
            this.showLogList(src, commandData, log, name, parser);
        } else {
            hangbot.sendMessage(src, cap(name) + " Log not found!", hangchan);
        }
    };
    this.showLogList = function (src, commandData, log, name, parser) {
        var info = commandData.split(":"),
            range = getRange(info[0]),
            term = info.length > 1 ? info[1] : "",
            e;
        if (log.indexOf("") !== -1) {
            log.splice(log.indexOf(""), 1);
        }
        if (!range) {
            range = { lower: 0, upper: 10 };
        }
        log = getArrayRange(log.reverse(), range.lower, range.upper).reverse();
        if (term) {
            var exp = new RegExp(term, "i");
            for (e = log.length - 1; e >= 0; e--) {
                if (!exp.test(log[e])) {
                    log.splice(e, 1);
                }
            }
        }
        if (log.length <= 0) {
            hangbot.sendMessage(src, "No " + name + " log found for this query!", hangchan);
        } else {
            sys.sendMessage(src, "", hangchan);
            sys.sendMessage(src, cap(name) + " (last " + (range.lower > 1 ? range.lower + "~" : "") + range.upper + " entries" + (term ? ", only including entries with the term " + term : "") + "):", hangchan);
            for (e in log) {
                if (!log[e]) {
                    continue;
                }
                hangbot.sendMessage(src, parser(log[e]), hangchan);
            }
            sys.sendMessage(src, "", hangchan);
        }
    };
}
module.exports = new Hangman();