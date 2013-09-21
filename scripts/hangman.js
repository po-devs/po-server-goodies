/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys:true, sendChanHtmlAll:true, module:true, SESSION:true, hangmanchan, hangbot, require, script, hasAuthElements */

var nonFlashing = require("utilities.js").non_flashing;

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
    this.autoGame = false;
    var quests = [];
    quests = sys.getFileContent("hangmanq.txt");

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
                this.setWinner(hostName);
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

        host = sys.ip(src);
        hostName = sys.name(src);

        sendChanHtmlAll(" ", hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        hangbot.sendAll(sys.name(src) + " started a new game of Hangman!", hangchan);
        hangbot.sendAll(currentWord.join(" "), hangchan);
        hangbot.sendAll(hint, hangchan);
        sys.sendAll("*** ************************************************************ ***", hangchan);
        sendChanHtmlAll(" ", hangchan);
        hangbot.sendAll("Type /g [letter] to guess a letter, and /a [answer] to guess the answer!", hangchan);
        sendChanHtmlAll(" ", hangchan);
        var time = parseInt(sys.time(), 10);
        if (time > this.lastAdvertise + 60 * 20) {
            this.lastAdvertise = time;
            sys.sendAll("*** ************************************************************ ***", 0);
            hangbot.sendAll("A new game of Hangman started in #Hangman!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
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
    this.setWinner = function (name) {
        word = undefined;
        winner = name;
        nextGame = (new Date()).getTime() + winnerDelay * 1000;
        this.resetTimers();
        this.autoGames(src);
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
    };
    this.viewGame = function (src) {
        if (!word) {
            hangbot.sendMessage(src, "No game is running!", hangchan);
            return;
        }
        sys.sendHtmlMessage(src, " ", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'><b>Current Word</b>: " + currentWord.join(" ") + "</font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>[Hint: " + hint + "]  [Letters used: " + usedLetters.map(function (x) {
            return x.toUpperCase();
        }).join(", ") + "]  [Chances left: " + parts + "] </font>", hangchan);
        sys.sendHtmlMessage(src, "<font color='red'>Current game started by " + hostName + "</font>", hangchan);
        hangbot.sendMessage(src, "Type /g [letter] to guess a letter, and /a [answer] to guess the answer!", hangchan);
        sys.sendHtmlMessage(src, " ", hangchan);
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
    this.configGame = function (src, commandData) {
        if (commandData === undefined) {
            commandData = "*";
        }
        var param = commandData.split(":")[0];
        var val = commandData.split(":")[1];
        if (!param || !val) {
            sys.sendHtmlMessage(src, " ", hangchan);
            hangbot.sendMessage(src, "How to use /config: Use /config [parameter]:[value]. Possible parameters are:", hangchan);
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
    this.turnOnGames = function() {
	    if (this.autoGame === true) {
		    autoGame = false;
		    return;
	    }
	    else if {this.autoGame === false) {
		    autoGame = true;
		    return;
	    }
    };
    this.autoGames = function (src) {
	    if (this.autoGame === true) {
		    sys.delayedCall(function () {
                hangman.startGame(src, quests[sys.rand(0, quests.length)]);
            }, 120);
		    return;
		}
	    else {
		    return;
		}
	};
    this.addQuest = function(commandData) {
	    if (commandData === undefined) {
            return;
        }
	    var newQ = commandData.toLowerCase();
    	    sys.append("hangmanq.txt", commandData);
	    hangbot.sendMessage("You have successfully added a new question!");
	    return;
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
            "/hangmanban: To ban a user from hangman. Format /hangmanban name:reason:time",
            "/hangmanunban: To unban a user from hangman.",
            "/hangmanbans: Searches the hangman banlist, show full list if no search term is entered.",
            "/passha: To give your Hangman Admin powers to an alt of yours."
        ];
        var superAdminHelp = [
            "*** Hangman Super Admin Commands ***",
            "/config: To change the answer delay time and other settings. Format /config parameter:value. Type /config by itself to see more help.",
            "/hangmanadmin: To promote a new Hangman admin. Use /shangmanadmin for a silent promotion.",
            "/hangmanadminoff: To demote a Hangman admin. Use /shangmanadminoff for a silent demotion."
        ];
        var ownerHelp = [
            "*** Hangman Owner Commands ***",
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
        if (channel !== hangchan && ["hangmanban", "hangmanunban", "hangmanbans", "hangmanadmins", "hadmins", "has", "passha", "hangmanadminoff", "hangmanadmin", "hangmansadmin", "hangmansuperadmin", "shangmanadmin", "shangmansuperadmin", "shangmanadminoff", ].indexOf(command) === -1) {
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
            if (this.isHangmanAdmin(sys.id(newname)) || this.isHangmanSuperAdmin(sys.id(newname))) {
                sys.sendMessage(src, "±Unown: Your target is already a Hangman Admin!");
                return true;
            }
            if (this.isHangmanSuperAdmin(src)) {
                script.hangmanSuperAdmins.remove(oldname);
                script.hangmanSuperAdmins.add(newname, "");
                sHA = true,
            } else {
                script.hangmanAdmins.remove(oldname);
                script.hangmanAdmins.add(newname, "");
            }
            id = sys.id(commandData);
            if (id !== undefined)
                SESSION.users(id).hangmanAdmin = true;
            sys.sendAll("±Unown: " + sys.name(src) + " passed their " + (sHA ? "Super Hangman Admin powers" : "Hangman auth") + " to " + commandData, sachannel);
            return;
        }

        if (command === "end") {
            hangman.endGame(src);
            return true;
        }

        if (command === "hangmanban") {
            hangman.hangmanBan(src, commandData);
            return true;
        }

        if (command === "hangmanunban") {
            script.unban("hban", src, sys.id(commandData), commandData);
            return true;
        }

        if (command === "hangmanbans") {
            hangman.hangmanBanList(src, commandData);
            return true;
        }
       
        if (command === "newq") {
	        this.addQuest(commandData);
	        return true;
        }

        if (command === "autogames") {
	        this.turnOnGames();
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

        if (command === "hangmanadminoff" || command === "hangmanadminoffs") {
            hangman.demoteAdmin(src, commandData, channel, (command === "shangmanadminoff"));
            return true;
        }

        if (hangman.authLevel(src) < 3) {
            return false;
        }
        if (command === "hangmansuperadmin" || command === "hangmansuperadmins") {
            hangman.promoteSuperAdmin(src, commandData, channel, (command === "shangmansuperadmin"));
            return true;
        }

        if (command === "hangmansuperadminoff" || command === "hangmansuperadminoffs") {
            hangman.demoteSuperAdmin(src, commandData, channel, (command === "shangmansuperadminoff"));
            return true;
        }
        return false;
    };
    this.onHban = function (src) {
        if (sys.isInChannel(src, hangmanchan)) {
            sys.kick(src, hangmanchan);
        }
    };
    this.hangmanBan = function (src, commandData) {
        if (commandData === undefined) {
            return;
        }
        var tar = sys.id(commandData);
        var bantime;
        if (this.authLevel(src) > 1 || sys.auth(src) > 0) {
            bantime = undefined;
        }
        else {
            bantime = 86400;
        }
        script.issueBan("hban", src, tar, commandData, bantime);
        return;
    };
    this.hangmanBanList = function (src, commandData) {
        require("modcommands.js").handleCommand(src, "hangmanbans", commandData, -1);
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
        sys.sendMessage(src, "", channel);
        for (var i = 0; i < shas.length; i++) {
            var id = sys.id(shas[i]);
            if(!id) {
                sys.sendMessage(src, shas[i], channel);
            }
            else {
                sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + sys.name(id) + "</b></font>", channel);
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
            sys.sendMessage(src, "", channel);
            for (var i = 0; i < has.length; i++) {
                if (sys.dbAuths().indexOf(has[i]) != -1) {
                    var id = sys.id(has[i]);
                    if(!id) {
                        sys.sendMessage(src, has[i], channel);
                    }
                    else {
                        sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + sys.name(id) + "</b></font>", channel);
                    }
                    has.splice(i, 1);
                    i--;
                }
            }
        }
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** HANGMAN ADMINS ***", channel);
        sys.sendMessage(src, "", channel);
        for (var i = 0; i < has.length; i++) {
            var id = sys.id(has[i]);
            if(!id) {
                sys.sendMessage(src, has[i], channel);
            }
            else {
                sys.sendHtmlMessage(src, "<font color=" + sys.getColor(id) + "><timestamp/> <b>" + sys.name(id) + "</b></font>", channel);
            }
        }
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
        if (!script.hangmanAdmins.hash.hasOwnProperty(commandData.toLowerCase())) {
            sys.sendMessage(src, "±Unown: " + commandData + " is not a Hangman Admin!", channel);
            return;
        }
        script.hangmanAdmins.remove(commandData);
        script.hangmanAdmins.remove(commandData.toLowerCase());
        if (!silent) {
            sys.sendAll("±Unown: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase() + " from Hangman Admin.", hangchan);
        }
        sys.sendAll("±Unown: " + nonFlashing(sys.name(src)) + " demoted " + commandData.toCorrectCase() + " from Hangman Admin.", sys.channelId('Victory Road'));
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
    this.afterChannelJoin = function (src, channel) {
        if (channel == hangchan) {
            hangman.viewGame(src);
        }
        return false;
    };
    return {
        init: hangman.init,
        handleCommand: hangman.handleCommand,
        beforeChannelJoin: hangman.beforeChannelJoin,
        afterChannelJoin: hangman.afterChannelJoin,
        onHban: hangman.onHban,
        onHelp: hangman.onHelp
    };
}();
