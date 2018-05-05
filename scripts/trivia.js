/*
    * trivia.js
        - Plugin on Pokémon Online servers for Trivia Games
        - Script done with the help of Ethan, Lamperi, Crystal Moogle, Wriggle Nightbug, and Cirno
    * Files used:
        - trivData.json
        - triviaq.txt
        - trivreview.txt
        - tadmins.txt
        - tsadmins.txt
        - trivialeaderboard.txt
        - questiondata.txt
        - triviaeventsettings.txt
        - eventstats.txt
*/
/*global updateModule, script, sys, SESSION, sendChanAll, sendChanHtmlAll, require, module, sachannel, staffchannel*/
var Bot = require("bot.js").Bot;
var utilities = require("utilities.js");
var html_escape = require("utilities.js").html_escape;
var MemoryHash = require('memoryhash.js').MemoryHash;

var triviachan, revchan;
var triviabot = new Bot("Metagross");

var triviaCategories = ["Anagram: Pokémon", "Anime/Manga", "Animals", "Art", "Base Stats", "Comics", "Food/Drink", "Games", "Geography", "History", "Internet", "Language", "Literature", "Math", "Mental Math", "Miscellaneous", "Movies", "Music", "Mythology", "Pokémon", "Pokémon Online", "Pokémon Without Vowels", "Politics", "Religion", "Science", "Social Science", "Society", "Space", "Sports", "Technology", "Television", "Video Games", "Who's That Pokémon?"];
var specialCategories = ["Mental Math"];
var lastCatGame = 0;
var lastEventType = 'None.';
var lastEventTime = Date.now() / 1000;
var manualEventTime = Date.now() / 1000;
var lastEventTimeStamp = "";
var manualEventTimeStamp = "";
var eventDuration = "";
var eventTimeChangeFlag = true; //for when Trivia restarts or the time is manually adusted
var manualEventFlag = false;
var eventKnowRate = 30;
var eventSpeedRate = 30;
var eventElimSignUp = 90;
var eventModeOn = true;
var lastUsedCats = [];
var eventElimPlayers = [];
var playersForStats = [];
var roundEliminated = [];
var answeredCorrectlyEver = [];
var lastAdvertise = 0;
var defaultKnowEventGoal = '12';
var defaultSpeedEventGoal = '25';
var defaultElimEventGoal = '5';
var firstGoalR = "N/A";
var secondGoalR = "N/A";
var thirdGoalR = "N/A";
var isShiny = false;
var debugMode = false;

var Trivia;
try {
    Trivia = SESSION.global().Trivia;
} catch (e) {
    Trivia = new TriviaGame();
}
if (!Trivia || !Trivia.started) {
    Trivia = new TriviaGame();
}
var extLB = new PointsLB("trivialeaderboard.txt");
var extLastLB = new PointsLastLB("lasttrivialeaderboard.txt");
var triviaq = new QuestionHolder("triviaq.txt");
var trivreview = new QuestionHolder("trivreview.txt");
var tadmin = new TriviaAdmin("tadmins.txt");
var tsadmin = new TriviaAdmin("tsadmins.txt");
var questionData = new MemoryHash("questiondata.txt");
var eventSets = new EventSettings("triviaeventsettings.txt");
var eventStats = new EventStatistics("eventstats.txt");
var trivData;
var month = new Date().getMonth();
try {
    trivData = JSON.parse(sys.getFileContent("trivData.json"));
}
catch (e) {
    trivData = {};
}

var neededData = ["submitBans", "toFlash", "mutes", "leaderBoard", "triviaWarnings", "autostartRange", "equivalentCats","equivalentAns","specialChance","hiddenCategories","votingCooldown","eventCooldown","eventFlag","editMessageFlags","extAnswers","blockCats","debugTime","debugAnswerTime","updateList"];
for (var i = 0; i < neededData.length; ++i) {
    var data = neededData[i];
    if (trivData[data] === undefined) {
        if (data === "leaderBoard" || data === "triviaWarnings" || data === "hiddenCategories" || data === "editMessageFlags" || data === "extAnswers" || data === "blockCats" || data === "updateList") {
            trivData[data] = [];
        }
        else if (data === "autostartRange") {
            trivData[data] = {
                min: 9,
                max: 24
            };
        }
        else if (data === "specialChance") {
            trivData[data] = 0;
        }
        else if (data === "votingCooldown" && data !== "eventCooldown") {
            trivData[data] = 5;
        }
        else if (data === "eventCooldown") {
            trivData[data] = 14400;          //14400 would be every 4 hours
        }
        else if (data === "eventFlag") {     //used to determine if game should be normal or event
            trivData[data] = false;
        }
        else {
            trivData[data] = {};
        }
    }
}

var utilities = require("utilities.js");
var nonFlashing = utilities.non_flashing,
    getSeconds = utilities.getSeconds,
    getTimeString = utilities.getTimeString;

function isTrivia(data, ip) {
    var which = {
        "submitbanned": "submitBans",
        "muted": "mutes"
    }[data];
    if (trivData[which][ip] === undefined) {
        return false;
    }
    if (trivData[which][ip].expires == "never") {
        return true;
    }
    if (trivData[which][ip].expires <= sys.time()) {
        delete trivData[which][ip];
        saveData();
        return false;
    }
    return true;
}

function showTrivia(src, channel, what) {
    var whichName = {
        "mutes": "mutes",
        "submitBans": "Submit Bans"
    }[what];
    var name = "Trivia " + whichName;
    var width = 5;
    var max_message_length = 30000;
    var tmp = [];
    var t = parseInt(sys.time(), 10);
    var current, by, banTime, expires, reason, banned_name;
    for (var ip in trivData[what]) {
        var which = {
            "submitBans": "submitbanned",
            "mutes": "muted"
        }[what];
        if (!isTrivia(which, ip)) continue;
        current = trivData[what][ip], banned_name = current.name, by = current.by, banTime = current.issued, expires = current.expires, reason = current.reason;
        tmp.push([ip, banned_name, by, (banTime === 0 ? "unknown" : getTimeString(t - banTime)), (expires === "never" ? "never" : getTimeString(expires - t)), utilities.html_escape(reason)]);
    }
    tmp.sort(function (a, b) {
        return a[3] - b[3];
    });
    // generate HTML
    var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
    var table_footer = '</table>';
    var table = table_header;
    var line;
    var send_rows = 0;
    while (tmp.length > 0) {
        line = '<tr><td>' + tmp[0].join('</td><td>') + '</td></tr>';
        tmp.splice(0, 1);
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
    if (send_rows > 0)
        sys.sendHtmlMessage(src, table, channel);
}

function runUpdate() {
    eventSets.updateEventSettings();
    if (!Trivia.needsUpdating) return;
    var POglobal = SESSION.global();
    var index, source;
    for (var i = 0; i < POglobal.plugins.length; ++i) {
        if ("trivia.js" == POglobal.plugins[i].source) {
            source = POglobal.plugins[i].source;
            index = i;
        }
    }
    if (index !== undefined) {
        updateModule(source, function (module) {
            POglobal.plugins[index] = module;
            module.source = source;
            module.init();
            sendChanAll("Update complete!", triviachan);
        });
        sendChanAll("Updating trivia...", triviachan);
        Trivia.needsUpdating = false;
    }
    return;
}

function saveData() {
    sys.writeToFile("trivData.json", JSON.stringify(trivData));
}

function orderedCategories() {
    var categories = [];
    var matchFunc = function (object) {
        if (object.category.toLowerCase() === cat.toLowerCase()) {
            object.count++;
            match = true;
        }
    };
    for (var i in triviaq.all()) {
        var cat = triviaq.get(i).category,
            match = false;
        categories.forEach(matchFunc);
        if (!match) {
            categories.push({
                category: cat,
                count: 1
            });
        }
    }
    categories.sort(function (a, b) {
        return b.count - a.count;
    });
    return categories;
}

function isTriviaOwner(src) {
    if (sys.auth(src) >= 3) return true;
    if (tsadmin.isTAdmin(sys.name(src))) return true;
    return false;
}

function hasReviewAccess(name) {
    var id = sys.id(name);
    var contribs = id !== undefined ? SESSION.users(id).contributions !== undefined : false;
    var cauth = false;
    if (id !== undefined) cauth = (SESSION.channels(revchan).canJoin(id) == "allowed" || SESSION.channels(staffchannel).canJoin(id) == "allowed");
    return cauth || contribs;
}

function getSpecialQuestion(category) {
    var q = {};

    category = category.toLowerCase();
    /*if (category === "who's that pokémon?") {

    } else if (category === "pokémon without vowels") {

    } else if (category === "anagram: pokémon") {

    } else */
    if (category === "mental math") {
        var num1 = Math.floor(Math.random() * (13 - 1)) + 1;
        var num2, num3;
        var op1 = Math.random() < 0.5;
        if (op1) num2 = Math.floor(Math.random() * (26 - 1)) + 1;
        else num2 = Math.floor(Math.random() * (11 - 1)) + 1;
        var op2 = Math.random() < 0.5;
        if (op2) num3 = Math.floor(Math.random() * (21 - 1)) + 1;
        else num3 = Math.floor(Math.random() *
            ((op1 ? num1 + num2 : num1 * num2) - 1)) + 1;

        q.question = String(num1) + (op1 ? '+' : '*') + String(num2)
            + (op2 ? '+' : '-') + String(num3);
        q.answer = String(eval(q.question));
    }

    return q;
}

function PMcheckq(src, channel) {
    if (trivreview.questionAmount() === 0) {
        Trivia.sendPM(src, "There are no questions to be reviewed.", channel);
        return;
    }
    var q = trivreview.all();
    var questionId = Object.keys(q).sort(function (a, b) {
            return a - b;
        })[0];
    var questionInfo = trivreview.get(questionId);
    if (questionId === undefined || questionInfo === undefined) {
        Trivia.sendPM(src, "Oops! There was an error.", channel);
        return;
    }
    sys.sendMessage(src, "", channel);
    Trivia.sendPM(src, "This question needs to be reviewed:", channel);
    Trivia.sendPM(src, "Category: " + questionInfo.category, channel);
    Trivia.sendPM(src, "Question: " + questionInfo.question, channel);
    Trivia.sendPM(src, "Answer: " + questionInfo.answer, channel);
    Trivia.sendPM(src, "Questions Approved: " + triviaq.questionAmount() + ". Questions Left: " + trivreview.questionAmount() + ".", channel);
    if (questionInfo.name !== undefined) {
        var message = "Submitted By: ";
        if (+questionId < 0) {
            Trivia.sendPM(src, "Put into edit by: " + questionInfo.name, channel); // was just placed into edit
            trivData.editMessageFlags.push(questionInfo.question); // remember that this was placed into edit
            saveData();
        } else {
            for (var i = 0; i < trivData.editMessageFlags.length; i++) {
                if (questionInfo.question === trivData.editMessageFlags[i]) {
                    message = "Put into edit by: ";
                    break;
                }
            }
            Trivia.sendPM(src, message + questionInfo.name, channel);
        }
    }

    if (questionInfo.notes !== undefined){
        Trivia.sendPM(src, "Notes: " + questionInfo.notes, channel);
    } else {
        Trivia.sendPM(src, "Notes: None.", channel);
    }

    sys.sendMessage(src, "", channel);
}

function time() {
    return Date.now() / 1000;
}

function getStatsTimeStamp() {
    var x = "";
    var d = new Date(); // Day Month DayOfMonth Year hh:mm:ss GMT-[timeZone] ([NameOfTimezone])
    d = d.toString().split(" ");
    x = "(" + d[4] + ")" + " " + d[0] + " " + d[5];
    return x;
}

function trivia_onMute(src, dest) {
    if (!Trivia.started) {
        return;
    }
    var destId = sys.id(dest);
    if (Trivia.playerPlaying(destId)) {
        Trivia.removePlayer(destId);
        Trivia.sendAll(dest + " left the game!", triviachan);
        return;
    }
}

function TriviaGame() {
    this.id = triviachan;
    this.round = 0;
    this.iteration = 0;
    this.started = false;
    this.maxPoints = 0;
    this.scoreType = "";
    this.difficulty = "all";
    this.presetDiff = false;
    this.qSource = [];
    this.catGame = false;
    this.specialCatGame = false;
    this.usingCats = [];
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.roundQuestion = 0;
    this.specialQuestion = false;
    this.specialCatGame = false;
    this.phase = "";
    this.triviaPoints = "";
    this.startoff = false;
//    this.autostart = false; Commented out because you never know
    this.ticks = -1;
    this.suggestion = {};
    this.inactivity = 0;
    this.afkCounter = 0;
    this.lbDisabled = false;
    this.lastvote = 0;
    this.votes = {};
    this.votesType = {};
    this.voters = [];
    this.voting = false;
    this.votingAborted = false;
}

TriviaGame.prototype.htmlAll = function (html) {
    sendChanHtmlAll(this.tBorder() + "<center>" + html + "</center>" + this.tBorder(), triviachan);
};

TriviaGame.prototype.sendPM = function (src, message, channel) {
    triviabot.sendMessage(src, message, channel === undefined ? this.id : channel);
};

TriviaGame.prototype.sendAll = function (message, channel) {
    triviabot.sendAll(message, channel === undefined ? triviachan : channel);
};

TriviaGame.prototype.startGame = function (data, name, difficulty) {
    if (this.started) return;
    if (this.startoff) return;
    if (triviaq.questionAmount() < 1) return;
//    if (name === "" && !this.autostart) return;
    Trivia.suggestion = {};
    data = data.split("*");
    this.maxPoints = data[0];
    var cats = [];
    if (data.length > 1) {
        this.catGame = true;
        this.usingCats = data.slice(1);
    }
    if (this.catGame) {
        for (var x in this.usingCats) {
            cats.push(this.usingCats[x]);
        }
        for (var y = 0; y < cats.length; y++) {
            for (var j = 0; j < trivData.blockCats.length; j++) {
                if (cats[y].toLowerCase() === trivData.blockCats[j].name) {
                    cats.splice(y, 1); //remove name
                    cats = cats.concat(trivData.blockCats[j].cats); //insert categories
                    break;
                }
            }
        }
    }
    if (trivData.eventFlag) {
        for (var i = 0; i < trivData.hiddenCategories.length; i++) {
            if (trivData.hiddenCategories[i].toLowerCase() === "pop quiz") {
                trivData.hiddenCategories.splice(i, 1);
            }
        }
    }
    this.difficulty = difficulty;
    this.startNormalGame(this.maxPoints, cats, name);
};

TriviaGame.prototype.startNormalGame = function (points, cats, name) {
    this.started = true;
    sys.saveVal("Stats/TriviaGamesPlayed", 1 + (+sys.getVal("Stats/TriviaGamesPlayed")));
    var lastCat;
    var catsLength;
    var time = parseInt(sys.time(), 10);
    var ad = "";
    var eventMessage = "";
    var autoJoin = function (n) {
        if (n && !tadmin.isTAdmin(n) && !tsadmin.isTAdmin(n) && sys.auth(sys.id(n)) <= 0) {
            Trivia.addPlayer(sys.id(n));
            Trivia.sendAll(n + " joined the game!", triviachan);
        }
    };
    var diffMessage = "Difficulty: All"; //default
    if (this.difficulty === "easy") { diffMessage = "Difficulty: <font color=blue>Easy</font>"; }
    if (this.difficulty === "intermediate") { diffMessage = "Difficulty: <font color=green>Intermediate</font>"; }
    if (this.difficulty === "hard") { diffMessage = "Difficulty: <font color=red>Hard</font>"; }
    if (this.catGame){
        for (var q in triviaq.all()) {
            if (cats.join("*").toLowerCase().split("*").indexOf(triviaq.get(q).category.toLowerCase()) != -1) {
                this.qSource.push(q);
            }
        }
        catsLength = cats.length;
        if (cats.length > 1) {
            lastCat = cats.splice(-1, 1);
        }
    }
    else {
        for (var q in triviaq.all()) {
            if (trivData.hiddenCategories.join("*").toLowerCase().split("*").indexOf(triviaq.get(q).category.toLowerCase()) == -1) {
                this.qSource.push(q);
            }
        }
    }
    var players = sys.playersOfChannel(triviachan);
    // Flash players who have it enabled
    var player_id, player_ip;
    for (var p in players) {
        player_id = players[p];
        player_ip = sys.ip(player_id);
        if (trivData.toFlash[player_ip]) {
            // Lazy way to flash Webclient people since saying their name should flash.
            // Probably a better way to do this.
            if (sys.os(player_id) === "webclient") {
                Trivia.sendPM(player_id, sys.name(player_id) + ", a game is starting!", triviachan);
            }
            sys.sendHtmlMessage(player_id, "<ping/>", triviachan);
        }
    }
    if (this.scoreType === "elimination" && this.catGame){
        if (trivData.eventFlag) {
            ad = "An EVENT elimination #Trivia game with " + points + " " + (points == 1 ? "life" : "lives") + " is in signups! Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + ".";
            eventMessage = (name ? name + " opened signups for an EVENT elimination game " : "An EVENT elimination game was started ") + "featuring " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! You only have " + points + " " + (points == 1 ? "life" : "lives") + "! Signups end in " + eventElimSignUp + " seconds.";
        }
        else {
            ad = "An elimination #Trivia game with " + points + " " + (points == 1 ? "life" : "lives") + " is in signups! Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "!";
            sendChanAll("",triviachan);
            this.sendAll((name ? name + " opened signups for an elimination game " : "An elimination game was started ") + "featuring " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! You only have " + points + " " + (points == 1 ? "life" : "lives") + "! Signups end in 45 seconds.", triviachan);
            triviabot.sendHtmlAll(diffMessage, triviachan);
            triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
        }
    }
    else if (this.scoreType === "speed" && this.catGame){
        if (trivData.eventFlag) {
            ad = "An EVENT speed #Trivia game was started with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! Score the most points to win!";
            eventMessage = (name ? name + " has started an EVENT Speed Category Game " : "An EVENT Speed Category game was started ") + "with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! Score the most points to win!";
        }
        else {
            ad = "A speed #Trivia game was started! Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! First to " + points + " " + (points == 1 ? "point" : "points") + " wins!";
            sendChanAll("",triviachan);
            this.sendAll((name ? name + " has started a Speed Category Game! " : "A Speed Category game was started! ") + "Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", triviachan);
            triviabot.sendHtmlAll(diffMessage, triviachan);
            triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
        }
    }
    else if (this.catGame) {
        if (trivData.eventFlag){
            ad = "An EVENT Category game has started in #Trivia with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! Score the most points to win!";
            eventMessage = (name ? name + " has started an EVENT Category Game " : "An EVENT Category Game was started ") + "with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! Score the most points to win!";
        }
        else {
            ad = "A Category game has started in #Trivia! Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + "! First to " + points + " " + (points == 1 ? "point" : "points") + " wins!";
            sendChanAll("",triviachan);
            this.sendAll((name ? name + " has started a Category Game! " : "A Category Game was started! ") + "Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + ". First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", triviachan);
            triviabot.sendHtmlAll(diffMessage, triviachan);
            triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
        }
    }
    else if (this.scoreType === "speed") {
        if (trivData.eventFlag){
            ad = "An EVENT speed #Trivia game was started with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Score the most points to win!";
            eventMessage = (name ? name + " started an EVENT Speed Trivia game " : "An EVENT speed trivia game was started ") + "with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Score the most points to win!";
        }
        else {
            ad = "A speed #Trivia game was started! First to " + points + " " + (points == 1 ? "point" : "points") + " wins!";
            sendChanAll("",triviachan);
            this.sendAll((name ? name + " started a Speed Trivia game! " : "A speed trivia game was started! ") + "First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", triviachan);
            triviabot.sendHtmlAll(diffMessage, triviachan);
            triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
            autoJoin(name);
        }
    }
    else if (this.scoreType === "elimination") {
        if (trivData.eventFlag) {
            ad = "An EVENT elimination #Trivia game with " + points + " " + (points == 1 ? "life" : "lives") + " is in signups!";
            eventMessage = (name ? name + " opened signups for an EVENT elimination game! " : "An EVENT elimination game was started! ") + "You only have " + points + " " + (points == 1 ? "life" : "lives") + "! Signups end in " + eventElimSignUp + " seconds!";
        }
        else {
            ad = "An elimination #Trivia game with " + points + " " + (points == 1 ? "life" : "lives") + " is in signups!";
            sendChanAll("",triviachan);
            this.sendAll((name ? name + " opened signups for an elimination game! " : "An elimination game was started! ") + "You only have " + points + " " + (points == 1 ? "life" : "lives") + "! Signups end in 45 seconds!", triviachan);
            triviabot.sendHtmlAll(diffMessage, triviachan);
            triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
        }
    }
    else {
        if (trivData.eventFlag) {
            ad = "An EVENT #Trivia game was started with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Score the most points to win!";
            eventMessage = (name ? name + " started an EVENT Trivia game " : "An EVENT trivia game was started ") + "with a goal of " + points + " " + (points == 1 ? "point!" : "points!") + " Score the most points to win!";
        }
        else {
            ad = "A #Trivia game was started! First to " + points + " " + (points == 1 ? "point" : "points") + " wins!";
            sendChanAll("",triviachan);
            this.sendAll((name ? name + " started a Trivia game! " : "A trivia game was started! ") + "First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", triviachan);
            triviabot.sendHtmlAll(diffMessage, triviachan);
            triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
            autoJoin(name);
        }
    }
    if (this.catGame && this.voters.length !== 0) {
        for (var y in this.voters) { autoJoin(this.voters[y]); }
    }
    if (!trivData.eventFlag) {
        if (time > lastAdvertise + 60 * 10) {
            lastAdvertise = time;
            sendChanAll("", 0);
            sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", 0);
            this.sendAll(ad, 0);
            sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", 0);
            sendChanAll("", 0);
        }
    }
   else {
        var channelsToAd = [0, triviachan, sys.channelId("Safari")];
        for (var d in channelsToAd) {
            var c = channelsToAd[d];
            sendChanAll("", c);
            sendChanHtmlAll("<font color='#232FCF'><timestamp/>? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ?:</font>", c);
            if (c === triviachan) {
                this.sendAll(eventMessage, triviachan);
                triviabot.sendHtmlAll("Type <b><a href=\"po:send//join\">/join</a></b> to join!", triviachan);
                if (this.scoreType !== 'elimination'){
                    triviabot.sendHtmlAll("<b>The game can continue until up to 3 players reach the goal!</b>", triviachan);
                }
                triviabot.sendHtmlAll(diffMessage, triviachan);
            } else {
                this.sendAll(ad, c);
            }
            sendChanHtmlAll("<font color='#232FCF'><timestamp/>? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ?:</font>", c);
            sendChanAll("", c);
        }
    }
    if (this.scoreType === "elimination") {
        this.phase = "signups";
        if (trivData.eventFlag){
            this.ticks = eventElimSignUp;
        }
        else {
            this.ticks = 45;
        }
    }
    else {
        this.phase = "standby";
        this.ticks = 15;
    }
};

TriviaGame.prototype.startTrivia = function (src, data, scoring) { //Data = points / categories / difficulty (extracted before data is split)
    if (this.started) {
        this.sendPM(src, "A trivia game has already started!", triviachan);
        return;
    }
    if (this.startoff) {
        this.sendPM(src, "/start is off. Most likely because Trivia is being updated.", triviachan);
        return;
    }
    if (triviaq.questionAmount() < 1) {
        this.sendPM(src, "There are no questions.", triviachan);
        return;
    }
    /*var x = time() - this.lastStopped;
    if (x < 16) {
        this.sendPM(src, "Sorry, a game was just stopped " + parseInt(x, 10) + " seconds ago.", triviachan);
        return;
    }*/
    this.scoreType = scoring;
    // set difficulty if present
    if (data.toLowerCase().indexOf(":easy") !== -1) {
        this.difficulty = "easy";
        this.presetDiff = true;
        data = data.toLowerCase().replace(":easy", "");
    } else if (data.toLowerCase().indexOf(":int") !== -1) { // allow for abbreviated input
        this.difficulty = "intermediate";
        this.presetDiff = true;
        if (data.toLowerCase().indexOf(":intermediate") !== -1) {
            data = data.toLowerCase().replace(":intermediate", "");
        } else {
            data = data.toLowerCase().replace(":int", "");
        }
    } else if (data.toLowerCase().indexOf(":hard") !== -1) {
        this.difficulty = "hard";
        this.presetDiff = true;
        data = data.toLowerCase().replace(":hard", "");
    }
    data = data.split("*");

    var isTA = (tadmin.isTAdmin(sys.name(src)) || tsadmin.isTAdmin(sys.name(src)) || sys.auth(src) > 0);
    if (this.phase === "countvotes" && !isTA) {
        this.sendPM(src, "Voting is currently in progress!", triviachan);
        return;
    }
    if (!isTA /*|| this.scoreType === "elimination"*/) { //remove cats from user and [elim] games
        data = [data[0]];
    }
    var rand = parseInt(data[0], 10);
    if (rand < 1 || (rand > 60 && !isTA)) {
        this.sendPM(src, "Please do not start a game with more than 60 points, or less than 1 point.", triviachan);
        return;
    }
    for (var i = 1; i < data.length; i++) {
        if (data[i] === "") {
            data.splice(i, 1);
            i--;
        }
    }
    for (var i = 1; i < data.length; i++) {
        for (var j = i + 1; j < data.length; j++) {
            if (data[i].toLowerCase() === data[j].toLowerCase()) {
                data.splice(j, 1);
                j--;
            }
        }
    }
    for (var i = 1; i < data.length; i++) {
       if (trivData.equivalentCats.hasOwnProperty(data[i].toLowerCase())) {
          data[i] = trivData.equivalentCats[data[i].toLowerCase()];
       }
    }
    for (var i = 1; i < data.length; i++) {
        var match = false;

        for (var c in specialCategories) { //still used for mental math
            if (data[i].toLowerCase() === specialCategories[c].toLowerCase()) { match = true; }
        }

        if (data[i].toLowerCase() === "wtp" || data[i].toLowerCase() === "who's that pokemon" || data[i].toLowerCase() === "who's that pokemon?") {
            data[i] = "Who's That Pokémon?";
            match = true;
        }
        if (data[i].toLowerCase() === "anagram" || data[i].toLowerCase() === "anagram: pokemon") {
            data[i] = "Anagram: Pokémon";
            match = true;
        }
        if (data[i].toLowerCase() === "pwv" || data[i].toLowerCase() === "pokemon without vowels") {
            data[i] = "Pokémon Without Vowels";
            match = true;
        }

        for (var q in triviaq.all()) {
            if (data[i].toLowerCase() === triviaq.get(q).category.toLowerCase()) { match = true; }
        }
        for (var jj = 0; jj < trivData.blockCats.length; jj++) {
            if (data[i].toLowerCase() === trivData.blockCats[jj].name) {
                data[i] = trivData.blockCats[jj].cats.join("*");
                match = true;
                break;
            }
        }
        if (!match) {
            this.sendPM(src, "Category " + data[i] + " was removed because it isn't an existing category.", triviachan);
            data.splice(i, 1);
            i--;
        }
    }
    data[0] = (isNaN(rand)) ? sys.rand(trivData.autostartRange.min, parseInt(trivData.autostartRange.max, 10) + 1) : +rand;
    data = data.join("*");
    this.startGame(data, sys.name(src), this.difficulty);
};

TriviaGame.prototype.startTriviaRound = function () {
    if (!this.started)
        return;
    var totalPlayers = 0;
    for (var id in this.triviaPlayers) {
        if (this.triviaPlayers[id].playing) {
           totalPlayers++;
        }
    }
    if (this.scoreType === "elimination" && this.round === 0 && totalPlayers < 2 ) {
        this.htmlAll("The elimination game was cancelled due to a lack of players!");
        this.resetTrivia();
        runUpdate();
        return;
    }
    /* Reset submittedAnswers */
    this.submittedAnswers = {};
    /* Advance round */
    this.round++;

    var category, usingSpecialCats, question;
    if (this.catGame) {
        category = Math.floor(Math.random() * this.usingCats.length);
        usingSpecialCats = this.usingCats.filter(function(n) { return specialCategories.indexOf(n) > -1; });
        if (usingSpecialCats.length) this.specialCatGame = true;
    }
    else {
        category = Math.floor(Math.random() * (orderedCategories().length + specialCategories.length + trivData.specialChance));
        usingSpecialCats = specialCategories;
    }
    if (Trivia.suggestion.id === undefined && category < usingSpecialCats.length) {
        category = usingSpecialCats[category];
        this.specialQuestion = getSpecialQuestion(category);
        question = this.specialQuestion.question;
        this.roundQuestion = 0;
    } else {
        /* Make a random number to get the ID of the (going to be) asked question, or use the suggestion */
        var q, questionNumber;
        if (Trivia.suggestion.id !== undefined) {
            questionNumber = Trivia.suggestion.id;
            Trivia.suggestion.asked = true;
        } // determine the limits for the game difficulty
        else {
            var upperLimit = 1;
            var lowerLimit = 0;
            switch(this.difficulty) {
                case "easy":
                    lowerLimit = 0.6;
                    break;
                case "intermediate":
                    upperLimit = 0.8;
                    lowerLimit = 0.4;
                    break;
                case "hard":
                    upperLimit = 0.5;
                    break;
                default: // default to "all", so the limits don't need to change
            }
            var qOKAY = false;
            var asked, data, rateAnsweredCorrectly, i = 0;
            // pick a question with the appropriate difficulty. merged this with the android and who's that pokemon check.
            while ((!qOKAY || (triviaq.get(questionNumber) === null || (triviaq.get(questionNumber).category.toLowerCase() === "who's that pokémon?" && this.androidPlayers()))) && i !== 300) {
                i++;
                questionNumber = Trivia.randomId();
                q = triviaq.get(questionNumber);
                if (q === null) { continue; }
                if (!questionData.hash.hasOwnProperty(questionNumber)) { continue; }
                data = questionData.get(questionNumber).split(" ");
                // data[0] = times asked, data[1] = answered(players in game at the time), data[2] = answered correctly
                asked = parseInt(data[0], 10);
                if (data[1] === 0 || asked < 5) { // check to see if the question is "new"
                    if (this.difficulty !== "easy") { // don't use "new" questions on easy
                        qOKAY = true;
                        continue;
                    }
                    continue;
                }
                rateAnsweredCorrectly = data[2] / data[1];
                if (rateAnsweredCorrectly <= upperLimit && rateAnsweredCorrectly >= lowerLimit) {
                    qOKAY = true;
                    continue;
                }
                qOKAY = false; // just in case the question was okay, but failed the android + who's that pokemon check
            }

            // try adjusting difficulty before giving up and posting mental math if a question can't be found
            if (i === 300 && this.catGame === true) {
                if (this.difficulty === "easy" || this.difficulty === "intermediate") {
                    this.difficulty = "hard"
                }
            }
            if (i === 600) {
                this.catGame = true;
                this.usingCats = specialCategories;
                this.startTriviaRound();
                return;
            }
        }
        /* Get the category, question, and answer */
        q = triviaq.get(questionNumber);
        category = q.category;
        if (category.indexOf("Anagram") === -1){
            question = q.question;
            if (category === "Who's That Pokémon?") {    
                var rand = sys.rand(1, 1025), dexNum = question;
                if (rand === 7) { isShiny = true; }
                if (isShiny) {
                    question = "<center><img src='pokemon:num=" + dexNum + "&shiny=true&gen=7'></center>";
                } else {
                    question = "<center><img src='pokemon:num=" + dexNum + "&gen=7'></center>";
                }
            }
            if (category === "Pokémon Without Vowels") {
                var yList = ["Yanma", "Hariyama", "Yanmega", "Yamask", "Yungoos"]; // exception list where 'y' is not a vowel
                var z = question.toLowerCase();
                z = z.replace(/[aeiou]/g, "");
                if (yList.indexOf(question) === -1) { z = z.replace(/y/g, ""); }
                question = z; // Just did it this way for clarity.
            }
        } else {
            var name = q.question.split("");
            question = [];
            while (name.length > 0){
                question.push(name.splice(sys.rand(0,name.length),1));
            }
            question = question.join("").toLowerCase();
        }
        this.roundQuestion = questionNumber;
        var index = this.qSource.indexOf(questionNumber);
        this.qSource.splice(index, 1);
    }
    // insert whitespace to prevent Google searches for answers
    if (category !== "Who's That Pokémon?") {
        var htmlTag = false;
        var googleProofQ = question.toString().split("").map(function(e) {
            if (e === "<") { htmlTag = true; }
            if (e === ">") { htmlTag = false; }
            if (htmlTag) {
                return e;
            } else {
                return utilities.non_flashing(e);
            }
        }).join("");
        question = googleProofQ;
    }
    this.phase = "answer";
    if (category.toLowerCase() === "pop quiz") { this.htmlAll(question); }
    else { this.htmlAll("<b>Category:</b> " + category.toUpperCase() + "<br>" + question); }
    for (var f = 0; f < trivData.extAnswers.length; f++) {
        if (this.roundQuestion === trivData.extAnswers[f]) {
            Trivia.ticks = 18;
            return;
        }
    }
    if (!debugMode) {
        Trivia.ticks = 12;
    } else {
        Trivia.ticks = trivData.debugAnswerTime;
    }
};

TriviaGame.prototype.finalizeAnswers = function () {
    if (!this.started)
        return;
    if (Trivia.suggestion.asked) {
        Trivia.suggestion = {};
    }
    var answer, id, equivalentAns = [], answers = [];

    if (this.specialQuestion) {
        answers = [].concat(this.specialQuestion.answer.split(','));
        this.specialQuestion = false;
    }
    else answers = [].concat(triviaq.get(this.roundQuestion).answer.split(","));

    if (isShiny) { // for Who's That Pokemon
        answers.push("Shiny " + triviaq.get(this.roundQuestion).answer);
        isShiny = false;
    }

    for (i = answers.length - 1; i >= 0; i--){
        if (trivData.equivalentAns.hasOwnProperty(answers[i].toLowerCase())){
            equivalentAns = equivalentAns.concat(trivData.equivalentAns[answers[i].toLowerCase()].split(","));
        }
    }
    this.phase = "standby";
    var wrongAnswers = [],
        answeredCorrectly = [];
    var ignoreCaseAnswers = equivalentAns.concat(answers).map(function (s) {
        var answer = String(s).toLowerCase();
        if (['a','an','the'].indexOf(answer) === -1) {
            answer = answer.replace(/\ba|an|the\b ?/g,'');
        }
        if (!answer.match(/^[\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]$/)) {
            answer = answer.replace(/[\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g,'');
        }
        answer = answer.replace(/\s+/g,'');
        return answer;
    });
    for (id in this.triviaPlayers) {
        if (this.triviaPlayers[id].name != sys.name(id) && sys.name(id) !== undefined) {
            this.triviaPlayers[id].name = sys.name(id);
        }
    }
    for (id in this.submittedAnswers) {
        var name = this.submittedAnswers[id].name;
        if (sys.id(name) !== undefined && this.player(name) !== null) {
            answer = this.submittedAnswers[id].answer.toLowerCase().replace(/ {2,}/g, " ");
            if (['a','an','the'].indexOf(answer) === -1) {
                answer = answer.replace(/\ba|an|the\b ?/g,'');
            }
            if (!answer.match(/^[\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]$/)) {
                answer = answer.replace(/[\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g,'');
            }
            answer = answer.replace(/\s+/g,'');
            if (ignoreCaseAnswers.indexOf(answer) != -1) {
                answeredCorrectly.push(this.submittedAnswers[id]);
            }
            else {
                var tanswer = this.submittedAnswers[id].answer;
                wrongAnswers.push("<span title='" + utilities.html_escape(name).replace(/'/g, "&apos;") + "'>" + utilities.html_escape(tanswer) + "</span>");
                for (var i = 0; i < trivData.triviaWarnings.length; ++i) {
                    var regexp = new RegExp(trivData.triviaWarnings[i]);
                    if (regexp.test(tanswer.toLowerCase())) {
                        if (sys.existChannel("Victory Road")) {
                            triviabot.sendAll("Warning: Player " + name + " answered '" + tanswer + "' to the question '" + triviaq.get(this.roundQuestion).question + "' in #Trivia", sys.channelId("Victory Road"));
                        }
                        triviabot.sendAll("Warning: Player " + name + " answered '" + tanswer + "' to the question '" + triviaq.get(this.roundQuestion).question + "' in #Trivia", revchan);
                        break;
                    }
                }
            }
        }
    }
    sendChanAll("", triviachan);
    var incorrectAnswers = wrongAnswers.length > 0 ? " Incorrect answers: " + wrongAnswers.join(", ") : "";
    triviabot.sendHtmlAll("Time's up!" + incorrectAnswers, triviachan);

    var correctNames = [];
    var totalPlayers = 0;
    for (var id in this.triviaPlayers) {
        if (this.triviaPlayers[id].playing) {
            totalPlayers++;
        }
    }
    if (!this.presetDiff && totalPlayers > 0) { // change difficulty based on player responses
        var ansRate = answeredCorrectly.length / totalPlayers;
        var easyChance, intChance, hardChance;
        var easyWeight = 0, intWeight = 0, hardWeight = 0;
        if (ansRate === 1) { // everybody got it right, make the next one harder
            if (this.difficulty === "easy") {
                easyWeight = 100;
            }
            else if (this.difficulty === "intermediate" || this.difficulty === "hard") {
                easyWeight = intWeight = 100;
            }
        }
        else if (ansRate >= 0.6 && ansRate < 1) { // most people got it right, probably make the next one harder
                if (this.difficulty === "easy") {
                    easyWeight = 50;
                }
                else if (this.difficulty === "intermediate") {
                    easyWeight = 75;
                    intWeight = 50;
                }
                else if (this.difficulty === "hard") {
                    easyWeight = 100;
                    intWeight = 50;
                }
        }
        else if (ansRate >= 0.4 && ansRate < 0.6) { // about half and half, probably keep the difficulty the same
            if (this.difficulty === "easy") {
                intWeight = hardWeight = 75;
            }
            else if (this.difficulty === "intermediate") {
                easyWeight = hardWeight = 75;
            }
            else if (this.difficulty === "hard") {
                easyWeight = intWeight = 75;
            }
        }
        else if (ansRate > 0 && ansRate < 0.4) { // most people got it wrong, probably decrease the difficulty
            if (this.difficulty === "easy") {
                intWeight = 50;
                hardWeight = 100;
            }
            else if (this.difficulty === "intermediate") {
                hardWeight = 75;
                intWeight = 50;
            }
            else if (this.difficulty === "hard") {
                hardWeight = 75;
            }
        }
        else if (ansRate === 0) { // everyone got it wrong, make the next one easier
            if (this.difficulty === "easy" || this.difficulty === "intermediate") {
                intWeight = hardWeight = 100;
            }
            else if (this.difficulty === "hard") {
                hardWeight = 100;
            }
        }
        easyChance = (easyWeight === 100) ? 0 : sys.rand(1, (101 - easyWeight));
        intChance = (intWeight ===  100) ? 0 : sys.rand(1, (101 - intWeight));
        hardChance = (hardWeight === 100) ? 0 : sys.rand(1, (101 - hardWeight));
        // highest number wins, ties go to the lower difficulty, three way ties go to intermediate
        if (easyChance > intChance && easyChance > hardChance) {
            this.difficulty = "easy";
        }
        else if (intChance > easyChance && intChance > hardChance) {
            this.difficulty = "intermediate";
        }
        else if (hardChance > easyChance && hardChance > intChance) {
            this.difficulty = "hard";
        }
        else if (easyChance === intChance && easyChance > hardChance) {
            this.difficulty = "easy";
        }
        else if (easyChance === hardChance && easyChance > intChance) {
            this.difficulty = "easy";
        }
        else if (intChance === hardChance && intChance > easyChance) {
            this.difficulty = "intermediate";
        }
        else if (easyChance === intChance && easyChance === hardChance) {
            this.difficulty = "intermediate";
        }
    }
    answeredCorrectly = answeredCorrectly.sort(function (a, b) { return a.time - b.time; });
    if (this.scoreType !== "speed") {
        if (this.scoreType === "elimination") {
            var allCorrect = true;
            var sortArray = [];
            var sortArrayBySpeed = [];
            for (var id in this.triviaPlayers) {
                var name = this.triviaPlayers[id].name;
                var found = false;
                for (var i = 0; i < answeredCorrectly.length; i++) {
                    if (this.triviaPlayers[id].name === answeredCorrectly[i].name) {
                        found = true;
                    }
                }
                if (found || !this.triviaPlayers[id].playing) {
                    continue;
                }
                allCorrect = false;
                this.player(name).points--;
                if (this.player(name).points === 0) {
                    if (trivData.eventFlag) {
                        playersForStats.push(this.triviaPlayers[id].name);
                        if(this.round > this.maxPoints){
                            sortArray.push(this.triviaPlayers[id].name);
                            roundEliminated.push(this.round);
                        }
                    }
                    this.unjoin(id);
                }
            }
            if (allCorrect && this.suddenDeath && answeredCorrectly.length) {
                var name = answeredCorrectly[answeredCorrectly.length - 1].name;
                this.player(name).points--;
                this.sendAll(name + " was the last player to answer the question, so they lose a life!");
                if (this.player(name).points === 0) {
                    for (var id2 in this.triviaPlayers) {
                        if (this.triviaPlayers[id2].name === name) break;
                    }
                    if (trivData.eventFlag){
                        sortArray.push(this.triviaPlayers[id2].name);
                        roundEliminated.push(this.round);
                        playersForStats.push(this.triviaPlayers[id2].name);
                    }
                    this.unjoin(id2);
                }
            }
            if (sortArray.length !== 0) {
                for (var j = 0; j < answeredCorrectlyEver.length; j++) {
                    for (var k = 0; k < sortArray.length; k++) {
                        if (sortArray[k] === answeredCorrectlyEver[j].name) {
                            sortArrayBySpeed.push(sortArray[k]);
                            sortArray.splice(k,1);
                            break;
                        }
                    }
                    if (!sortArray.length) { break; }
                }
                eventElimPlayers = eventElimPlayers.concat(sortArrayBySpeed.reverse());
            }
        }
        else if (answeredCorrectly.length !== 0) {
            var pointAdd = +(1.65 * Math.log(totalPlayers / answeredCorrectly.length) + 1).toFixed(0);
            this.sendAll("Points awarded for this question: " + pointAdd);
            for (var i = 0; i < answeredCorrectly.length; i++) {
                var name = answeredCorrectly[i].name;
                this.player(name).points += pointAdd;
            }
        }
        for (var i = 0; i < answeredCorrectly.length; i++) {
            correctNames[i] = answeredCorrectly[i].name;
        }
        this.sendAll("Answered correctly: " + correctNames.join(", "), triviachan);
    }
    else {
        if (answeredCorrectly.length !== 0) {
            var points = 5;
            for (var i = 0; i < answeredCorrectly.length; i++) {
                var name = answeredCorrectly[i].name;
                this.player(name).points += points;
                correctNames[i] = answeredCorrectly[i].name + " (" + points + ")";
                if (points > 1) points--;
            }
        }

        this.sendAll("In order from fastest to slowest, answered correctly: ");
        this.sendAll(correctNames.join(", "), triviachan);
    }
    questionData.log(this.roundQuestion, totalPlayers, answeredCorrectly.length);
    if (this.roundQuestion) { // Want to avoid mental math
        var q = triviaq.get(this.roundQuestion);
        if (q.category.toLowerCase() === "pop quiz") {
            triviaq.remove(this.roundQuestion);
            questionData.remove(this.roundQuestion);
        }
    }

    var x = answers.length != 1 ? "answers were" : "answer was";
    triviabot.sendHtmlAll("The correct " + x + ": <b>" + utilities.html_escape(answers.join(", ")) + "</b>", triviachan);

    var leaderboard = [];
    var displayboard = [];
    var validParticipants = []; //for safari participation prizes
    var winners = [];
    var winnersNamesOnly = [];      //for safari prizes
    var allRight = false;
    for (id in this.triviaPlayers) {
        if (this.triviaPlayers[id].playing) {
            var regname = this.triviaPlayers[id].name;
            var numPoints = this.triviaPlayers[id].points;
            var nohtmlname = utilities.html_escape(regname);
            leaderboard.push([regname, numPoints]);
           /* if (this.triviaPlayers[id].points >= this.maxPoints && this.scoreType != "elimination") {
                winners.push(nohtmlname + " (" + this.triviaPlayers[id].points + ")");
            }*/ //This code was just causing winners to be out of order.
        }
    }
    if (answeredCorrectly.length === totalPlayers && this.scoreType !== "elimination") {
        allRight = true;
        for (var z2 = 0; z2 < leaderboard.length; z2++) {
            leaderboard[z2][0] = answeredCorrectly[z2].name;
            leaderboard[z2][1] = this.player(answeredCorrectly[z2].name).points;
        }
    }
    leaderboard.sort(function (a, b) {
        return b[1] - a[1];
    });
    /* Store order of players who answered correctly for each round so that ties
      will still be broken even if neither player answered correctly for the current
      round. Overflow shouldn't be a concern for individual games, and this gets
      cleared after each game.*/
    answeredCorrectlyEver = answeredCorrectly.concat(answeredCorrectlyEver);
    var n = 1;
    var z3 = 1;
    var noTies = true;
    while (n < leaderboard.length && this.scoreType !== "elimination") {
        if (!answeredCorrectlyEver.length || allRight) { break; }
        if (leaderboard[z3][1] === leaderboard[z3-1][1] && leaderboard[z3][1] !== 0) {
            noTies = false;
            for (var z4 = 0; z4 < answeredCorrectlyEver.length; z4++) {
                if (leaderboard[z3-1][0] === answeredCorrectlyEver[z4].name) {
                    z3++;
                    break; //tiebreak matches a speed tiebreak
                }
                if (leaderboard[z3][0] === answeredCorrectlyEver[z4].name) {
                    var nameHolder,pointHolder;
                    nameHolder = leaderboard[z3-1][0];
                    pointHolder = leaderboard[z3-1][1];
                    leaderboard[z3-1][0] = leaderboard[z3][0];
                    leaderboard[z3-1][1] = leaderboard[z3][1];
                    leaderboard[z3][0] = nameHolder;
                    leaderboard[z3][1] = pointHolder;
                    z3++;
                    break; //tiebreak changed to match a speed tiebreak
                }
                if (z4 === (answeredCorrectlyEver.length - 1)) {
                    z3++; //infinite loop insurance. shouldn't be needed though.
                }
            }
        }
        if (noTies) { z3++; }
        noTies = true;
        if (z3 === leaderboard.length) {
            n++;
            z3 = 1;
        }
    }
    var i = 0;
    var newMonth = new Date().getMonth();
    if (month !== newMonth){
        extLB.updateLastLB();
        extLB.reset();
        month = newMonth;
    }

    if (!this.lbDisabled) {
        var lastPoints; //points = leaderboard points
        var minPoints = (this.scoreType === "knowledge" ? extLB.minLB : extLB.minSpeedLB);
        if (this.maxPoints >= minPoints && this.scoreType !== "elimination" && !trivData.eventFlag){
            while (leaderboard[i] && leaderboard[i][1] >= this.maxPoints){
                var points = totalPlayers - i;
                if (this.catGame) {points = points / 2;}
                if (i > 0 && leaderboard[i][1] === leaderboard[i-1][1]){points = lastPoints;}
                extLB.updateLeaderboard(utilities.html_escape(leaderboard[i][0]), ((points) > 0 ? points : 1));
                lastPoints = points;
                i++;
            }
        }
    }

    for (var x in leaderboard) {
        displayboard.push(leaderboard[x][0] + " (" + leaderboard[x][1] + ")");
    }
    for (var y in leaderboard) {   //this sorts the winners
        if (leaderboard[y][1] >= this.maxPoints && this.scoreType !== "elimination") {
            if (trivData.eventFlag && winners.length === 3) { break; }
            winners.push(leaderboard[y][0] + " (" + leaderboard[y][1] + ")");
        }
    }
    for (var z in leaderboard) {
        if (leaderboard[z][1] >= this.maxPoints && this.scoreType !== "elimination"){
            winnersNamesOnly.push(leaderboard[z][0]);
        }
    }

    this.sendAll("Leaderboard: " + displayboard.join(", "), triviachan);

    if (this.scoreType === "elimination" && this.round >= Math.min(5 + (this.maxPoints - 1) * 3, 10) && !this.suddenDeath && leaderboard.length > 1) {
        this.suddenDeath = true;
        triviabot.sendHtmlAll("<b>" + this.round + " rounds have passed, so sudden death has started! If all players answer correctly, the last player to answer will lose a life!</b>", triviachan);
    }
    var needed = 1;
    if (trivData.eventFlag) { needed = 2; } // to cancel events if only 1 person
    if (totalPlayers < needed) { this.inactivity++; }
    else { this.inactivity = 0; }
    if (this.inactivity === 4) {
        this.htmlAll("The game automatically ended due to a lack of players.");
        this.resetTrivia();
        runUpdate();
        return;
    }

    if (answeredCorrectly.length === 0 && wrongAnswers.length === 0) {
        this.afkCounter++;
        if (this.afkCounter === 10) { // if 10 rounds pass without anyone answering a question, assume everyone went afk and end the game
            this.htmlAll("The game automatically ended due to inactivity.");
            this.resetTrivia();
            runUpdate();
            return;
        }
    }
    else { this.afkCounter = 0; }

    if ((totalPlayers === 1) && (leaderboard[0]) && (parseInt(leaderboard[0][1]) >= (this.maxPoints / 2))) {
        this.lbDisabled = true;
    }
    if (leaderboard.length === 1 && this.scoreType === "elimination") {
        winners.push(utilities.html_escape(leaderboard[0][0]) + " (" + leaderboard[0][1] + ")");
        winnersNamesOnly.push(utilities.html_escape(leaderboard[0][0]));
        if (!this.lbDisabled && !trivData.eventFlag) {
            extLB.updateLeaderboard(utilities.html_escape(leaderboard[0][0]).toLowerCase(), parseInt(leaderboard[0][1], 10));
        }
    }

    if (trivData.eventFlag && this.iteration < 3 && this.scoreType !== "elimination") {
        var xx = "";
        var yy = "";
        var zz = "";
        if (winnersNamesOnly.length >= 1 && this.iteration === 0) {
            firstGoalR = winnersNamesOnly[this.iteration] + ", Round: " + this.round;
            this.iteration++;
        }
        if (winnersNamesOnly.length >= 2 && this.iteration === 1) {
            secondGoalR = winnersNamesOnly[this.iteration] + ", Round: " + this.round;
            xx = firstGoalR.split(", ");
            yy = secondGoalR.split(", ");
            if (xx[0] === yy[0]) { secondGoalR = winnersNamesOnly[this.iteration - 1] + ", Round: " + this.round; }
            this.iteration++;
        }
        if (winnersNamesOnly.length >= 3 && this.iteration === 2) {
            thirdGoalR = winnersNamesOnly[this.iteration] + ", Round: " + this.round;
            xx = firstGoalR.split(", ");
            yy = secondGoalR.split(", ");
            zz = thirdGoalR.split(", ");
            if (xx[0] === zz[0]) { thirdGoalR = winnersNamesOnly[this.iteration - 2] + ", Round: " + this.round; }
            if (yy[0] === zz[0]) { thirdGoalR = winnersNamesOnly[this.iteration - 1] + ", Round: " + this.round; }
            this.iteration++;
        }
    }

    var neededWinners = 1;             //winners needed to end game, always 1 for non-event games
    if (trivData.eventFlag && this.scoreType !== "elimination"){  //for event know and event speed, extend the game
        neededWinners = 4;
        if(totalPlayers > 3) { neededWinners = 3; }
        if(totalPlayers === 3 && this.round >= 10) { neededWinners = 2; } // include round to give players more time to win if player count drops
        if(totalPlayers === 2 && this.round >= 10) { neededWinners = 1; }
        if(leaderboard.length > 0 && leaderboard[0][1] >= (this.maxPoints*3)) { neededWinners = 1; } // ends games sooner when some people dominate and the rest struggle / afk
    }
     if (winners.length > (neededWinners - 1) || (this.scoreType === "elimination" && leaderboard.length === 0)) {
         /*if (trivData.eventFlag) {
             while (leaderboard[i] && leaderboard[i][1] >= this.maxPoints) {
                 var points = totalPlayers - i;
                 if (this.catGame) {points = points / 2;}
                 if (i > 0 && leaderboard[i][1] === leaderboard[i-1][1]){points = lastPoints;}
                 extLB.updateLeaderboard(utilities.html_escape(leaderboard[i][0]), ((points) > 0 ? points : 1));
                 lastPoints = points;
                 i++;
             }
         }*/

         var w = (winners.length == 1) ? "the winner!" : "our winners!";
         winners.sort(function (a, b) {
             return b[1] - a[1];
         });

        if (Object.keys(Trivia.suggestion).length !== 0) {
            this.sendAll(sys.name(Trivia.suggestion.suggester) + "'s suggestion was cancelled because the game ended before it could be asked.", revchan);
        }
        var allCats = orderedCategories();
        var advertise = "";
        var hidden = true;
        while (hidden) { // Don't advertise hidden cats
            advertise = allCats[sys.rand(0, allCats.length)].category;
            if (advertise === "Pop Quiz") { continue; } //explicitly listed because Pop Quiz questions can currently appear in events
            for (var m = 0; m < trivData.hiddenCategories.length; m++) {
                if (advertise === trivData.hiddenCategories[m]) {
                    hidden = true;
                    break;
                }
            }
            hidden = false;
        }
        if (leaderboard.length === 0) {
            this.htmlAll("<h2>Everyone lost! This is why we can't have nice things!</h2>");
        }
        else {
            this.htmlAll("<h2>Congratulations to " + w + "</h2>" + winners.join(", ") + "");
        }
        triviabot.sendHtmlAll("<font size=5 color='red'>While you're waiting for another game, why not submit a question? <a href='http://pokemon-online.eu/threads/trivia-help-and-guidelines.30233'>Help and Guidelines are here!</a></font>", triviachan);
        //We decided this isn't really need it, but I'm leaving it in case we want to add it back later.
        //triviabot.sendHtmlAll("We could really use more <b>" + advertise + "</b> themed questions!", triviachan);
        triviabot.sendHtmlAll("Never want to miss a Trivia game? Try the <b>/flashme</b> command!", triviachan);
        triviabot.sendHtmlAll("Type <b>/start</b> [goal] to start a new game!", triviachan);
        if (this.catGame) {
            lastCatGame = 1;
            lastUsedCats = this.usingCats;
        }
        else {
            if (lastCatGame !== 0) {
                lastCatGame++;
            }
        }
        if (trivData.eventFlag && leaderboard.length !== 0) {
            var user, score;
            var loop = leaderboard.length;
            var sTierReq = this.maxPoints;
            var aTierReq = this.maxPoints * 0.9;
            var bTierReq = this.maxPoints * 0.7;
            var cTierReq = this.maxPoints * 0.5;
            var dTierReq = this.maxPoints * 0.3;
            var eTierReq = this.maxPoints * 0.1;
            if (this.scoreType === "elimination") {
                eventElimPlayers.push(winnersNamesOnly[0]);
                playersForStats.push(winnersNamesOnly[0]);
                eventElimPlayers.reverse();
                roundEliminated.push(this.round);
                roundEliminated.reverse();
                loop = eventElimPlayers.length;
                aTierReq = parseInt(this.maxPoints) + 6;
                bTierReq = parseInt(this.maxPoints) + 5;
                cTierReq = parseInt(this.maxPoints) + 4;
                dTierReq = parseInt(this.maxPoints) + 3;
                eTierReq = parseInt(this.maxPoints) + 2;
            }
            for (var p = 0; p < loop; p++) {
                if (this.scoreType === "elimination") {
                    user = eventElimPlayers[p];
                    score = roundEliminated[p];
                    if (p < 3 && p < (eventElimPlayers.length - 1)) {
                        validParticipants.push([eventElimPlayers[p], "S"]);
                        continue;
                    }
                } else {
                    user = leaderboard[p][0];
                    score = leaderboard[p][1];
                    if (!score) { continue; }
                    if (score >= sTierReq && p < 3) {
                        validParticipants.push([user, "S"]);
                        continue;
                    }
                }
                if (score >= aTierReq) {
                    validParticipants.push([user, "A"]);
                    continue;
                }
                if (score >= bTierReq) {
                    validParticipants.push([user, "B"]);
                    continue;
                }
                if (score >= cTierReq) {
                    validParticipants.push([user, "C"]);
                    continue;
                }
                if (score >= dTierReq) {
                    validParticipants.push([user, "D"]);
                    continue;
                }
                if (score >= eTierReq) {
                    validParticipants.push([user, "E"]);
                } else {
                    validParticipants.push([user, "F"]); // answered at least one question correctly
                }
            }
        }
        if (trivData.eventFlag) {
            eventDuration = (manualEventFlag ? sys.time() - manualEventTime : sys.time() - lastEventTime);
            eventStats.updateEventStats((this.scoreType === 'elimination' ? playersForStats.reverse() : displayboard), (leaderboard.length !== 0 ? false : true));
            var pointsAwarded = 4;
            for (var v = 0; v < 3 && v < validParticipants.length; v++) {
                pointsAwarded -= 1;
                if (!validParticipants[v]) { break; }
                extLB.updateLeaderboard(utilities.html_escape(validParticipants[v][0]), pointsAwarded);
            }
        }
        if (!this.lbDisabled) { sys.writeToFile(extLB.file, JSON.stringify(extLB.leaderboard)); }
        var wasElim = false;
        if (trivData.eventFlag && this.scoreType === "elimination" && leaderboard.length !== 0) {
            wasElim = true;
        }
        var Safari = require('safari.js');
        if (Safari && trivData.eventFlag) {
            var safchan = sys.channelId("Safari");
            sendChanAll("", safchan);
            sendChanHtmlAll("<font color='#232FCF'><timestamp/>? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ?:</font>", safchan);
            if (leaderboard.length !== 0){
                this.sendAll("The EVENT Trivia game is over! Congratulations to the winners!", safchan);
            } else {
                this.sendAll("The EVENT Trivia game is over! Unfortunately, everyone died!", safchan);
                this.sendAll("The prizes have been donated to the orphanage!", safchan);
            }
            sendChanHtmlAll("<font color='#232FCF'><timestamp/>? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ?:</font>", safchan);

            if (wasElim) {
                var rewarding = eventElimPlayers;
                for (var r = 0; r < 3 && r < rewarding.length; r++) {
                    Safari.triviaPromo(rewarding[r], r+1);
                }
            } else {
                for (var r = 0; r < 3 && r < winnersNamesOnly.length; r++) {
                   Safari.triviaPromo(winnersNamesOnly[r], r+1);
                }
            }
            sendChanAll("", safchan);
        }

        //winnersNamesOnly contains the names of the winners from first to last
        //validParticipants, if you want to give consolation prizes, contains names of all players
        //eventElimPlayers contains the list for event games, used for all prizes
        //if you want to post the scores also (example: player (5)) use winners or displayboard
        //these loops are the ones I used to output the data for testing; I left them in case they would be helpful

      /*  if (trivData.eventFlag){
            if (this.scoreType !== "elimination"){
                for (var d = 0; d < winnersNamesOnly.length; d++){
                    this.sendAll(winnersNamesOnly[d],triviachan);
                }
           }
            else {
                //****NOTE***** that the players are in this array backwards (unless you've used .reverse() already)
                for (var d3 = 0; d3 < eventElimPlayers.length; d3++){
                    this.sendAll(eventElimPlayers[d3],triviachan);
                }
            }
            this.sendAll("Participation reward list",triviachan);
            for (var d2 = 0; d2 < validParticipants.length; d2++){
                this.sendAll(validParticipants[d2][0] + ", " + validParticipants[d2][1], triviachan);
            }
        }*/
        this.resetTrivia();
        runUpdate();
        this.lastvote++;

        if (eventModeOn && ((lastEventTime + trivData.eventCooldown) <= sys.time())) { return; }
        if (this.voting && this.lastvote >= trivData.votingCooldown) {
            this.phase = "voting";
            this.ticks = 5;
        }

/*        if (this.autostart) {
            this.phase = "autostart";
            this.ticks = sys.rand(30, 44);
            Trivia.sendAll("A new trivia game will be started in " + this.ticks + " seconds!", triviachan);
            return;
        }*/
        return;
    }//endif

    if (this.qSource.length === 0 && !(this.catGame && this.specialCatGame)) {
        this.catGame = true;
        this.usingCats = specialCategories;
    }
    if (!debugMode) {
        var rand = sys.rand(15, 21);
        this.sendAll("Please wait " + rand + " seconds until the next question!", triviachan);
        Trivia.ticks = rand;
    } else {
        Trivia.ticks = trivData.debugTime;
    }
};

TriviaGame.prototype.event = function() {
    trivData.eventFlag = true;
    lastEventTimeStamp = getStatsTimeStamp();
    var eventType = sys.rand(1, 101);
    var catEvent = sys.rand(1, 11);
//    var diffRand = sys.rand(1, 101);
    var difficulty = "all";
    var catEventFlag = false;
    var randomCat =  "";

// can be used to allow events to be set to a random difficulty level
/*    if (diffRand >= 1 && diffRand < 41) { // 40 %
        difficulty = "easy";
    } else if (diffRand >= 41 && diffRand < 71) { // 30 %
        difficulty = "intermediate";
    } else if (diffRand >= 71 && diffRand < 81) { // 10 %
        difficulty = "hard";
    } // 20% chance that the difficulty stays "all"
*/
    if (catEvent === 1 && trivData.blockCats.length) {
        var r = sys.rand(0, trivData.blockCats.length);
        randomCat = trivData.blockCats[r].name;
        catEventFlag = true;
    }
    if (eventType >= 1 && eventType <= eventKnowRate) {
        this.scoreType = lastEventType = "knowledge";
        if (!catEventFlag) { Trivia.startGame(defaultKnowEventGoal, false, difficulty); }
        else { Trivia.startGame(defaultKnowEventGoal + "*" + randomCat, false, difficulty); }
    }
    else {
        if (eventType >= (eventKnowRate + 1) && eventType <= (eventKnowRate + eventSpeedRate)) {
            this.scoreType = lastEventType = "speed";
            if (!catEventFlag) { Trivia.startGame(defaultSpeedEventGoal, false, difficulty); }
            else { Trivia.startGame(defaultSpeedEventGoal + "*" + randomCat, false, difficulty); }
        }
        else {
            this.scoreType = lastEventType = "elimination";
            if (!catEventFlag) { Trivia.startGame(defaultElimEventGoal, false, difficulty); }
            else { Trivia.startGame(defaultElimEventGoal + "*" + randomCat, false, difficulty); }
        }
    }
    lastEventTime = sys.time(); //current time in seconds
    eventTimeChangeFlag = false;
};


TriviaGame.prototype.startVoting = function () {
    sendChanAll("", triviachan);
    sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", triviachan);
    this.sendAll("Voting for a category game has begun! Type /vote [category]*[gameType (optional)] to vote for a game!", triviachan);
    this.sendAll("A list of categories can be found by typing /cats.", triviachan);
    sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", triviachan);
    sendChanAll("", triviachan);

    this.lastvote = 0;
    this.votes = {};

    this.phase = "countvotes";
    this.ticks = 30;
};

TriviaGame.prototype.countVotes = function () {

    var catVotes = [];
    var knowTot = 0, speedTot = 0;
    for (var i in triviaCategories) catVotes.push(0);
    for (var p in this.votes) if (this.votes.hasOwnProperty(p)) catVotes[this.votes[p]]++;
    for (var q in this.votesType) {
        if (!this.votesType.hasOwnProperty(q)) { continue; }
        if (this.votesType[q] === "know") {
            knowTot++;
        } else {
            speedTot++;
        }
    }

    var max = Math.max.apply(Math, catVotes);
    var indexes = [], i = -1;

    if (max === 0) {
        Trivia.sendAll("There were no votes, so a category game will not be started.", triviachan);
        Trivia.sendAll("You can use /start [goal] or /speed [goal] to start a new game!", triviachan);
        Trivia.votingAborted = true;
        // The autostarted games proved to be more annoying than helpful as of late, but leaving this here in case the feature is re-enabled later.
        /*if (Math.random() < 0.5) {
            this.scoreType = "knowledge";
            Trivia.startGame("12");
        }
        else {
            this.scoreType = "speed";
            Trivia.startGame("25");
        }*/
        return;
    }

    while ((i = catVotes.indexOf(max, i + 1)) != -1) {
        indexes.push(i);
    }

    var winner = indexes[Math.floor(Math.random() * indexes.length)];
    if (knowTot > speedTot && triviaCategories[winner] !== "Mental Math") {
        this.scoreType = "knowledge";
        Trivia.startGame("14*" + triviaCategories[winner]);
    } else {
        if (speedTot > knowTot){
            this.scoreType = "speed";
            Trivia.startGame("30*" + triviaCategories[winner]);
        } else {
            if (Math.random() < 0.5 && triviaCategories[winner] !== "Mental Math") {
                this.scoreType = "knowledge";
                Trivia.startGame("14*" + triviaCategories[winner]);
            } else {
                this.scoreType = "speed";
                Trivia.startGame("30*" + triviaCategories[winner]);
            }
        }
    }
};

TriviaGame.prototype.voteCat = function (src, cat, type) {
    if (this.votes.hasOwnProperty(this.key(src)) && this.votesType.hasOwnProperty(this.key(src))) {
        if (this.votes[this.key(src)] === cat) {
            Trivia.sendPM(src, "You already voted for " + triviaCategories[cat] + "!", triviachan);
        } else {
            Trivia.sendAll(sys.name(src) + " changed their vote to " + triviaCategories[cat] + ((type === "know") ? " (knowledge)!" : " (speed)!"), triviachan);
        }
    } else {
        Trivia.sendAll(sys.name(src) + " voted for " + triviaCategories[cat] + ((type === "know") ? " (knowledge)!" : " (speed)!"), triviachan);
    }
    this.votes[this.key(src)] = cat;
    this.votesType[this.key(src)] = type;
};

TriviaGame.prototype.resetTrivia = function () {
    this.started = false;
    this.round = 0;
    this.iteration = 0;
    this.maxPoints = 0;
    this.scoreType = "";
    this.difficulty = "all";
    this.presetDiff = false;
    this.qSource = [];
    this.catGame = false;
    this.specialCatGame = false;
    this.usingCats = [];
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.specialQuestion = false;
    this.roundQuestion = 0;
    this.phase = "";
    this.ticks = -1;
    this.suggestion = {};
    this.inactivity = 0;
    this.afkCounter = 0;
    this.lbDisabled = false;
    this.suddenDeath = false;
    this.voters = [];
    this.votingAborted = false;
    if (trivData.eventFlag) { trivData.hiddenCategories.push("Pop Quiz"); }
    trivData.eventFlag = false;
    eventElimPlayers = [];
    roundEliminated = [];
    answeredCorrectlyEver = [];
    playersForStats = [];
    firstGoalR = secondGoalR = thirdGoalR = "N/A";
    isShiny = false;
};

TriviaGame.prototype.key = function (src) {
    var returnval = src;
    if (typeof src === "string") {
        for (var id in this.triviaPlayers) {
            if (this.triviaPlayers[id].name.toLowerCase() === src.toLowerCase()) {
                returnval = id;
            }
        }
    }
    return returnval;
};

TriviaGame.prototype.randomId = function () {
    var questions = this.qSource;
    return questions[Math.floor(Math.random() * questions.length)];
};

TriviaGame.prototype.unjoin = function (src) {
    if (!this.started) {
        this.sendPM(src, "A game hasn't started!", triviachan);
        return;
    }
    if (this.playerPlaying(src)) {
       if (this.scoreType === "elimination") {
           this.removePlayer(src);
           if (this.triviaPlayers[src].points === 0) {
               this.sendAll(sys.name(src) + " has no more lives and is out of the game!", triviachan);
           }
           else {
               if (this.triviaPlayers[src].points === 1) {
                   this.sendAll(sys.name(src) + " left the game with 1 life!", triviachan);
               } else {
                   this.sendAll(sys.name(src) + " left the game with " + this.triviaPlayers[src].points + " lives!", triviachan);
               }
               this.triviaPlayers[src].roundLeft = this.round;
               this.triviaPlayers[src].phaseLeft = this.phase;
           }
       }
       else {
           this.removePlayer(src);
           switch (this.triviaPlayers[src].points) {
           case 0:
               this.sendAll(sys.name(src) + " left the game!", triviachan);
               break;
           case 1:
               this.sendAll(sys.name(src) + " left the game with 1 point!", triviachan);
               break;
           default:
               this.sendAll(sys.name(src) + " left the game with " + this.triviaPlayers[src].points + " points!", triviachan);
           }
       }
    }
    else {
        this.sendPM(src, "You haven't joined the game!", triviachan);
    }
};

TriviaGame.prototype.endTrivia = function (src) {
    if (!this.started) {
        this.sendPM(src, "A game hasn't started.", triviachan);
        return;
    }
    this.resetTrivia();
    runUpdate();
    this.sendAll(sys.name(src) + " ended the current trivia game!", triviachan);
    return;
};

TriviaGame.prototype.tBorder = function () {
    return "<hr><br/>";
};

TriviaGame.prototype.player = function (src) {
    var key = this.key(src);
    if (!this.triviaPlayers.hasOwnProperty(key) || !this.triviaPlayers[key].playing) {
        return null;
    }
    else {
        return this.triviaPlayers[key];
    }
};

TriviaGame.prototype.playerPlaying = function (src) {
    var key = this.key(src);
    return (this.triviaPlayers.hasOwnProperty(key) && this.triviaPlayers[key].playing);
};

TriviaGame.prototype.androidPlayers = function () {
   for (var i in this.triviaPlayers) {
      if (this.triviaPlayers[i].playing && sys.os(i) === "android" && sys.version(i) < 48) {
         return true;
      }
   }
   return false;
};
/* Leaving this here in case it is needed in the future.
TriviaGame.prototype.webclientPlayers = function () {
   for (var i in this.triviaPlayers) {
      if (this.triviaPlayers[i].playing && sys.os(i) === "webclient") {
         return true;
      }
   }
   return false;
};*/

TriviaGame.prototype.addPlayer = function (src) {
    var key = this.key(src);
    if (this.triviaPlayers.hasOwnProperty(key)) {
        this.triviaPlayers[key].playing = true;
    }
    else {
        for (var id in this.triviaPlayers) {
            if (this.triviaPlayers[id].name.toLowerCase() === sys.name(src).toLowerCase()) {
                this.triviaPlayers[key] = this.triviaPlayers[id];
                this.triviaPlayers[key].playing = true;
                delete this.triviaPlayers[id];
            }
        }
    }
    if (!this.triviaPlayers.hasOwnProperty(key)) {
        this.triviaPlayers[key] = {
            name: sys.name(src),
            points: (this.scoreType === "elimination" ? this.maxPoints : 0),
            playing: true,
            roundLeft: 0,
            phaseLeft: ""
        };
    }
};

TriviaGame.prototype.removePlayer = function (src) {
    var key = this.key(src);
    if (this.triviaPlayers.hasOwnProperty(key)) {
        this.triviaPlayers[key].playing = false;
    }
};

TriviaGame.prototype.addAnswer = function (src, answer) {
    var key = this.key(src);
    this.submittedAnswers[key] = {
        name: sys.name(src),
        answer: answer,
        time: time()
    };
};

TriviaGame.prototype.stepHandler = function () {
    if (isNaN(this.ticks) || this.ticks < 0) {
        if (eventModeOn && ((lastEventTime + trivData.eventCooldown) <= sys.time())) {
            this.phase = "event";
            this.phaseHandler();
        } else {
            trivData.eventFlag = false; //if somehow the flag gets set when it shouldn't, fix it.
        }
        return;
    }
    if (this.ticks === 0) {
        this.phaseHandler();
    }
    this.ticks -= 1;
};

TriviaGame.prototype.phaseHandler = function () {
    if (this.phase === "answer") {
        this.finalizeAnswers();
    } else if (this.phase === "standby" || this.phase === "signups") {
        this.startTriviaRound();
    }/* else if (this.phase === "autostart") {
        var startRange = trivData.autostartRange;
        var pointsForGame = sys.rand(startRange.min, parseInt(startRange.max, 10) + 1);
        this.startGame(pointsForGame.toString(), "");
    }*/ else if (this.phase === "voting") {
        this.startVoting();
    } else if (this.phase === "countvotes") {
        this.countVotes();
    }
    else if (this.phase === "event") {
        manualEventFlag = false;
        this.event();
    }
    else { //game probably stopped or error, so stopping repeated attempts
        this.ticks = -1;
    }
};

function QuestionHolder(f) {
    this.file = f;
    this.state = {};
    sys.appendToFile(this.file, ""); //clean file
    var state = new MemoryHash(this.file);
    this.state.questions = state;
    if (Object.keys(state.hash).length !== 0) {
        this.state.freeId = parseInt(Object.keys(state.hash)[Object.keys(state.hash).length - 1], 10) + 1;
    }
    else {
        this.state.freeId = 0;
    }
}

QuestionHolder.prototype.add = function (category, question, answer, name, notes) {
    var id = this.freeId();
    if (name === undefined) {
        this.state.questions.add(id, category + ":::" + question + ":::" + answer);
    }
    else {
        this.state.questions.add(id, category + ":::" + question + ":::" + answer + ":::" + name + ":::" + notes);
    }
    return id;
};

QuestionHolder.prototype.remove = function (id) {
    this.state.questions.remove(id);
};

QuestionHolder.prototype.checkq = function () {
    if (trivreview.questionAmount() === 0) {
        triviabot.sendAll("There are no more questions to be reviewed.", revchan);
        return;
    }
    var q = trivreview.all();
    var questionId = Object.keys(q).sort(function (a, b) {
            return a - b;
        })[0];
    var questionInfo = trivreview.get(questionId);
    if (questionId === undefined || questionInfo === undefined) {
        triviabot.sendAll("Oops! There was an error.", revchan);
        return;
    }
    sendChanAll("", revchan);
    triviabot.sendAll("This question needs to be reviewed:", revchan);
    triviabot.sendAll("Category: " + questionInfo.category, revchan);
    triviabot.sendAll("Question: " + questionInfo.question, revchan);
    triviabot.sendAll("Answer: " + questionInfo.answer, revchan);
    triviabot.sendAll("Questions Approved: " + triviaq.questionAmount() + ". Questions Left: " + trivreview.questionAmount() + ".", revchan);
    if (questionInfo.name !== undefined) {
        var message = "Submitted By: ";
        if (+questionId < 0) {
            triviabot.sendAll("Put into edit by: " + questionInfo.name, revchan); // was just placed into edit
            trivData.editMessageFlags.push(questionInfo.question); // remember that this was placed into edit
            saveData();
        } else {
            for (var i = 0; i < trivData.editMessageFlags.length; i++) {
                if (questionInfo.question === trivData.editMessageFlags[i]) {
                    message = "Put into edit by: ";
                    break;
                }
            }
            triviabot.sendAll(message + questionInfo.name, revchan);
        }
    }
    if (questionInfo.notes !== undefined) {
        triviabot.sendAll("Notes: " + questionInfo.notes, revchan);
    } else {
        triviabot.sendAll("Notes: None.", revchan);
    }
    sendChanAll("", revchan);
};

QuestionHolder.prototype.get = function (id) {
    var q;
    var data = this.state.questions.get(id);
    if (data !== undefined) {
        data = data.split(":::");
        q = {};
        q.category = data[0];
        q.question = data[1];
        q.answer = data[2];
        if (data[3]) {
            q.name = data[3];
        }
        if (data[4]) {
            q.notes = data[4];
        }
    }
    return q === undefined ? null : q;
};

QuestionHolder.prototype.questionAmount = function () {
    return Object.keys(this.state.questions.hash).length;
};

QuestionHolder.prototype.freeId = function () {
    var id = Object.keys(this.all()).sort(function (a, b) {
        return b-a;
    })[0];
    if (isNaN(id)) {
        return 1;
    } else {
        return parseInt(id,10)+1;
    }
};

QuestionHolder.prototype.changeCategory = function (id, category) {
    var data = this.state.questions.get(id).split(":::");
    var q;
    q = {};
    q.category = category;
    q.question = data[1];
    q.answer = data[2];
    if (data[3]) {
        q.name = data[3];
    }
    if (data[4]) {
        q.notes = data[4];
    }
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name + ":::" + q.notes);
};

QuestionHolder.prototype.changeQuestion = function (id, question) {
    var data = this.state.questions.get(id).split(":::");
    for (var i = 0; i < trivData.editMessageFlags.length; i++) {
        if (data[1] === trivData.editMessageFlags[i]) {
            trivData.editMessageFlags.splice(i, 1, question);
            saveData();
            break;
        }
    }
    var q = {};
    q.category = data[0];
    q.question = question;
    q.answer = data[2];
    if (data[3]) {
        q.name = data[3];
    }
    if (data[4]) {
        q.notes = data[4];
    }
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name + ":::" + q.notes);
};

QuestionHolder.prototype.changeAnswer = function (id, answer) {
    var data = this.state.questions.get(id).split(":::");
    var q = {};
    q.category = data[0];
    q.question = data[1];
    q.answer = answer;
    if (data[3]) {
        q.name = data[3];
    }
    if (data[4]) {
        q.notes = data[4];
    }
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name + ":::" + q.notes);
};

QuestionHolder.prototype.changeNotes = function (id, notes, what) {
    var data = this.state.questions.get(id).split(":::");
    var q = {};
    q.category = data[0];
    q.question = data[1];
    q.answer = data[2];
    if (data[3]) {
        q.name = data[3];
    }
    if (what == "add") {
        q.notes = (!data[4] || data[4] == "None." ? notes : data[4] + " | " + notes);
    }
    if (what == "change"){
        q.notes = notes;
    }
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name + ":::" + q.notes);
};

QuestionHolder.prototype.all = function () {
    return this.state.questions.hash;
};

questionData.log = function (id, players, answered) {
    if (questionData.hash.hasOwnProperty(id)) {
        var data = questionData.get(id).split(" ");
        var totalAsked = parseInt(data[0], 10) + 1;
        var totalPlayers = parseInt(data[1], 10) + players;
        var totalAnswered = parseInt(data[2], 10) + answered;
        questionData.hash[id] = totalAsked + " " + totalPlayers + " " + totalAnswered;
        questionData.save();
    } else {
        questionData.add(id, "1 " + players + " " + answered);
    }
};

questionData.sortBy = function (what) {
    var sortingArray = [];
    for (var i in questionData.hash) {
        var q = questionData.get(i).split(" ");
        sortingArray.push([i, q[0], q[1], q[2]]);
    }
    if (what === "asked") {
        sortingArray.sort(function (a, b) {
            if (a[1] === b[1]) {
                if (a[3]/a[2] === b[3]/b[2]) {
                    return b[2] - a[2];
                }
                return b[3]/b[2] - a[3]/a[2];
            }
            return b[1] - a[1];
        });
    }
    if (what === "answered") {
        sortingArray.sort(function (a, b) {
            if (a[3]/a[2] === b[3]/b[2]) {
                if (a[1] === b[1]) {
                    return b[2] - a[2];
                }
                return b[1] - a[1];
            }
            return b[3]/b[2] - a[3]/a[2];
        });
    }
    if (what === "leastanswered") {
        sortingArray.sort(function (a, b) {
            if (a[3]/a[2] === b[3]/b[2]) {
                if (a[1] === b[1]) {
                    return a[2] - b[2];
                }
                return a[1] - b[1];
            }
            return b[3]/b[2] - a[3]/a[2];
        });
    }
    return sortingArray;
};

function TriviaAdmin(file) {
    this.file = file;
    this.admins = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        sys.writeToFile(file, "[]");
    }
    try {
        this.admins = JSON.parse(fileContent);
    }
    catch (e) {
        sys.sendAll("Error loading Trivia Admins: " + e, revchan);
    }
}

TriviaAdmin.prototype.addTAdmin = function (name) {
    if (this.isTAdmin(name))
        return;
    this.admins.push(name.toLowerCase());
    this.saveAdmins();
};

TriviaAdmin.prototype.removeTAdmin = function (name) {
    if (!this.isTAdmin(name))
        return;
    var ind = this.admins.indexOf(name.toLowerCase());
    this.admins.splice(ind, 1);
    this.saveAdmins();
};

TriviaAdmin.prototype.saveAdmins = function () {
    sys.writeToFile(this.file, JSON.stringify(this.admins));
};

TriviaAdmin.prototype.isTAdmin = function (name) {
    return this.admins.indexOf(name.toLowerCase()) != -1;
};

TriviaAdmin.prototype.tAdminList = function (src, id, type) {
    var tadmins = [];
    for (var a in this.admins) {
        tadmins.push(this.admins[a]);
    }
    tadmins.sort();
    if (type.toLowerCase() === "trivia admins") {
        if (script.hasAuthElements(tadmins)) {
            sys.sendMessage(src, "", id);
            sys.sendMessage(src, "*** AUTH TRIVIA ADMINS ***", id);
            for (var b = 0; b < tadmins.length; b++) {
                if (sys.dbAuths().indexOf(tadmins[b]) != -1) {
                    if (sys.id(tadmins[b]) === undefined) {
                        sys.sendMessage(src, tadmins[b], id);
                    }
                    else {
                        sys.sendHtmlMessage(src, "<timestamp/><font color = " + script.getColor(sys.id(tadmins[b])) + "><b>" + html_escape(tadmins[b].toCorrectCase()) + "</b></font color>", id);
                    }
                    tadmins.splice(b, 1);
                    b--;
                }
            }
        }
    }
    sys.sendMessage(src, "", id);
    sys.sendMessage(src, "*** " + type.toUpperCase() + " ***", id);
    for (var b in tadmins) {
        if (sys.id(tadmins[b]) === undefined) {
            sys.sendMessage(src, tadmins[b], id);
        }
        else {
            sys.sendHtmlMessage(src, "<timestamp/><font color = " + script.getColor(sys.id(tadmins[b])) + "><b>" + html_escape(tadmins[b].toCorrectCase()) + "</b></font color>", id);
        }
    }
    sys.sendMessage(src, "", id);
};

function EventSettings(file) {
    this.file = file;
    this.settings = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        sys.writeToFile(file, "[]");
    }
    try {
        this.settings = JSON.parse(fileContent);
    }
    catch (e) {
        sys.sendAll("Error loading saved event settings: " + e, revchan);
    }
}

EventSettings.prototype.loadEventSettings = function () {
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "" || fileContent === "[]") { return; }
    lastEventType = this.settings.lastEventType;
    lastEventTime = this.settings.lastEventTime;
    trivData.eventCooldown = this.settings.lastEventCooldown;
    eventKnowRate = this.settings.eventKnowRate;
    eventSpeedRate = this.settings.eventSpeedRate;
    defaultKnowEventGoal = this.settings.defaultKnowEventGoal;
    defaultSpeedEventGoal = this.settings.defaultSpeedEventGoal;
    defaultElimEventGoal = this.settings.defaultElimEventGoal;
    eventElimSignUp = this.settings.eventElimSignUp;
};

EventSettings.prototype.updateEventSettings = function () {
    this.settings = {'lastEventType' : lastEventType, 'lastEventTime' : lastEventTime, 'lastEventCooldown' : trivData.eventCooldown, 'eventKnowRate' : eventKnowRate, 'eventSpeedRate' : eventSpeedRate, 'defaultKnowEventGoal' : defaultKnowEventGoal, 'defaultSpeedEventGoal' : defaultSpeedEventGoal, 'defaultElimEventGoal' : defaultElimEventGoal, 'eventElimSignUp' : eventElimSignUp};
    sys.writeToFile(this.file, JSON.stringify(this.settings));
};

function EventStatistics(file) {
    this.file = file;
    this.stats = [];
    this.recordedGames = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        sys.writeToFile(file, "[]");
    }
    try {
        this.recordedGames = JSON.parse(fileContent);
    }
    catch (e) {
        sys.sendAll("Error loading saved event settings: " + e, revchan);
    }
}

EventStatistics.prototype.loadEventStats = function () {
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "" || fileContent === "[]") {
        return "No Stats.";
    }
    return this.recordedGames;
};

EventStatistics.prototype.updateEventStats = function (playerArray, noWinners) {
    eventStats.removeOldData();
    var eventTime = (manualEventFlag ? manualEventTime : lastEventTime);
    var timeStamp = (manualEventFlag ? manualEventTimeStamp : lastEventTimeStamp);
    if (Trivia.scoreType !== 'elimination') {
        this.stats = {'gameType' : Trivia.scoreType, 'goal' : Trivia.maxPoints, 'lastGame' : eventTime, 'lastGameTime' : timeStamp, 'players' : playerArray.length, 'rounds' : Trivia.round, 'duration' : eventDuration, 'scoreBoard' : playerArray, 'firstGoalR' : firstGoalR, 'secondGoalR' : secondGoalR, 'thirdGoalR' : thirdGoalR, 'totalServerPlayers' : sys.playerIds().length, 'totalTriviaPlayers' : sys.playersOfChannel(triviachan).length};
    } else {
        this.stats = {'gameType' : Trivia.scoreType, 'goal' : Trivia.maxPoints, 'lastGame' : eventTime, 'lastGameTime' : timeStamp, 'players' : playerArray.length, 'rounds' : Trivia.round, 'duration' : eventDuration, 'participants' : playerArray, 'noWinners' : noWinners, 'totalServerPlayers' : sys.playerIds().length, 'totalTriviaPlayers' : sys.playersOfChannel(triviachan).length};
    }
    this.recordedGames.unshift(this.stats);
    sys.writeToFile(this.file, JSON.stringify(this.recordedGames));
};

EventStatistics.prototype.removeOldData = function() {
    for (var i = 0; i < this.recordedGames.length; i++) {
        var lastGame = sys.time() - this.recordedGames[i].lastGame;
        if (lastGame > getSeconds("30d")) {
            this.recordedGames.splice(i, 1);
        }
    }
    sys.writeToFile(this.file, JSON.stringify(this.recordedGames));
};

EventStatistics.prototype.reset = function() {
    this.recordedGames = [];
    sys.writeToFile(this.file, JSON.stringify(this.recordedGames));
};

function PointsLB(file) {
    this.file = file;
    this.minLB = 7;
    this.minSpeedLB = 25;
    this.leaderboard = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        sys.writeToFile(file, "[]");
    }
    try {
        this.leaderboard = JSON.parse(fileContent);
    }
    catch (e) {
        sys.sendAll("Error loading leaderboard: " + e, revchan);
    }
}

PointsLB.prototype.updateLeaderboard = function (name, points){
    var player;
    if (!trivData.eventFlag) {
        if (Trivia.scoreType === "elimination"){
            player = {"name" : name.toLowerCase(), "livesLeft" : points, "elimWins" : 1, "regPoints": 0, "speedPoints" : 0, "regWins" : 0, "speedWins" : 0, "eventPoints" : 0, "eventWins" : 0 };
        } else if (Trivia.scoreType === "knowledge"){
            player = {"name" : name.toLowerCase(), "livesLeft" : 0, "elimWins" : 0, "regPoints" : points, "speedPoints": 0, "regWins" : 1, "speedWins" : 0, "eventPoints" : 0, "eventWins" : 0 };
        } else if (Trivia.scoreType === "speed"){
            player = {"name" : name.toLowerCase(), "livesLeft" : 0, "elimWins" : 0, "regPoints" : 0, "speedPoints" : points, "regWins" : 0, "speedWins" : 1, "eventPoints" : 0, "eventWins" : 0 };
        }
    } else {
        player = { "name" : name.toLowerCase(), "livesLeft" : 0, "elimWins" : 0, "regPoints" : 0, "speedPoints" : 0, "regWins" : 0, "speedWins" : 0, "eventPoints" : points, "eventWins" : 1 };
    }
    var playerIndex = -1;
    var i;
    for (i = 0; i < this.leaderboard.length; i++){
        if (this.leaderboard[i].name === player.name){
            playerIndex = i;
            break;
        }
    }
    if (playerIndex === -1){
        this.leaderboard.push(player);
    } else {
        if (trivData.eventFlag) {
            this.leaderboard[playerIndex].eventPoints = this.leaderboard[playerIndex].eventPoints + player.eventPoints;
            this.leaderboard[playerIndex].eventWins = this.leaderboard[playerIndex].eventWins + player.eventWins;
        } else {
            if (Trivia.scoreType === "elimination") {
                this.leaderboard[playerIndex].livesLeft = this.leaderboard[playerIndex].livesLeft + player.livesLeft;
                this.leaderboard[playerIndex].elimWins = this.leaderboard[playerIndex].elimWins + 1;
            } else if (Trivia.scoreType === "knowledge") {
                this.leaderboard[playerIndex].regPoints = this.leaderboard[playerIndex].regPoints + player.regPoints;
                this.leaderboard[playerIndex].regWins = this.leaderboard[playerIndex].regWins + 1;
            } else if (Trivia.scoreType === "speed") {
                this.leaderboard[playerIndex].speedPoints = this.leaderboard[playerIndex].speedPoints + player.speedPoints;
                this.leaderboard[playerIndex].speedWins = this.leaderboard[playerIndex].speedWins + 1;
            }
        }
    }
};

PointsLB.prototype.showLeaders = function (src, commandData, id) {
    var scoreTypes = ["elimination", "knowledge", "speed", "event"];
    var lb = [], player = [];
    var i, maxPlace;
    var input = commandData.split('*');
    var scoreType = input[0].toLowerCase();
    if (scoreType === "know"){
        scoreType = "knowledge";
    } else if (scoreType === "elim"){
        scoreType = "elimination";
    }
    if (scoreTypes.indexOf(scoreType) !== -1){
        if (input.length === 1 || isNaN(input[1]) || input[1] <= 0){
            maxPlace = 10;
        } else {maxPlace = input[1];}
        for (i = 0; i < this.leaderboard.length; i++) {
            player = { "name" : this.leaderboard[i].name, "regPoints" : this.leaderboard[i].regPoints, "speedPoints" : this.leaderboard[i].speedPoints, "regWins" : this.leaderboard[i].regWins, "livesLeft" : this.leaderboard[i].livesLeft,"elimWins" : this.leaderboard[i].elimWins, "speedWins" : this.leaderboard[i].speedWins, "eventPoints" : this.leaderboard[i].eventPoints, "eventWins" : this.leaderboard[i].eventWins };
            lb.push(player);
        }
        if (scoreType === "elimination"){
            lb.sort(function (a, b){
                if (b.elimWins === a.elimWins){
                    if (b.livesLeft === a.livesLeft) {
                        if (b.regWins === a.regWins){
                            if (b.speedWins === a.speedWins) {
                                if (b.regPoints === a.regPoints) {
                                    return b.speedPoints - a.speedPoints;
                                } else return b.regPoints - a.regPoints;
                            } else return b.speedWins - a.speedWins;
                        } else return b.regWins - a.regWins;
                    } else return b.livesLeft - a.livesLeft;
                } else return b.elimWins - a.elimWins;
            });
        } else if (scoreType === "knowledge"){
            lb.sort(function (a, b){
                if (b.regPoints === a.regPoints){
                    if (b.regWins === a.regWins){
                        if (b.speedPoints === a.speedPoints) {
                            if (b.speedWins === a.speedWins) {
                                if (b.livesLeft === a.livesLeft){
                                    return b.elimWins - a.elimWins;
                                } else return b.livesLeft - a.livesLeft;
                            } else return b.speedWins - a.speedWins;
                        } else return b.speedPoints - a.speedPoints;
                    } else return b.regWins - a.regWins;
                } else return b.regPoints - a.regPoints;
            });
        } else if (scoreType === "speed"){
            lb.sort(function (a, b){
                if (b.speedPoints === a.speedPoints){
                    if (b.speedWins === a.speedWins){
                        if (b.regPoints === a.regPoints) {
                            if (b.regWins === a.regWins) {
                                if (b.livesLeft === a.livesLeft){
                                    return b.elimWins - a.elimWins;
                                } else return b.livesLeft - a.livesLeft;
                            } else return b.regWins - a.regWins;
                        } else return b.regPoints - a.regPoints;
                    } else return b.speedWins - a.speedWins;
                } else return b.speedPoints - a.speedPoints;
            });
        } else if (scoreType === "event") {
            lb.sort(function (a, b) {
                if (b.eventPoints === a.eventPoints) {
                    if (b.eventWins === a.eventWins) {
                        if (b.regPoints === a.regPoints){
                            if (b.regWins === a.regWins){
                                if (b.speedPoints === a.speedPoints) {
                                    if (b.speedWins === a.speedWins) {
                                        if (b.livesLeft === a.livesLeft){
                                            return b.elimWins - a.elimWins;
                                        } else return b.livesLeft - a.livesLeft;
                                    } else return b.speedWins - a.speedWins;
                                } else return b.speedPoints - a.speedPoints;
                            } else return b.regWins - a.regWins;
                        } else return b.regPoints - a.regPoints;
                    } else return b.eventWins - a.eventWins;
                } else return b.eventPoints - a.eventPoints;
            });
        }
        sys.sendMessage(src, "", id);
        sys.sendMessage(src, "*** Trivia Leaderboard (" + scoreType + ") ***", id);
        for (i = 0; i < lb.length; i++) {
            if (i < maxPlace || lb[i].name === sys.name(src).toLowerCase()) {
                var x = i + 1;
                if (scoreType === "knowledge"){
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].regPoints + " point" + (lb[i].regPoints === 1 ? " and " : "s and ") + lb[i].regWins + " win" + (lb[i].regWins === 1 ? "!" : "s!"), id);
                } else if (scoreType === "speed"){
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].speedPoints + " point" + (lb[i].speedPoints === 1 ? " and " : "s and ") + lb[i].speedWins + " win" + (lb[i].speedWins === 1 ? "!" : "s!"), id);
                } else if (scoreType === "elimination"){
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].livesLeft + " total lives left and " + lb[i].elimWins + " win" + (lb[i].elimWins === 1 ? "!" : "s!"), id);
                } else if (scoreType === "event") {
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].eventPoints + " point" + (lb[i].eventPoints === 1 ? " and " : "s and ") + lb[i].eventWins + " win" + (lb[i].eventWins === 1 ? "!" : "s!"), id);
                }
            }
        }
        sys.sendMessage(src, "", id);
        var y = input.length - 1; //allow maxLength to still be optional
        if (input[y] !== "" || input[y] !== undefined) {
            for (i = 0; i < lb.length; i++) {
                if (lb[i].name === input[y].toLowerCase()) {
                    x = i + 1;
                    if (scoreType === "knowledge"){
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].regPoints + " point" + (lb[i].regPoints === 1 ? " and " : "s and ") + lb[i].regWins + " win" + (lb[i].regWins === 1 ? "!" : "s!"), id);
                    } else if (scoreType === "speed"){
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].speedPoints + " point" + (lb[i].speedPoints === 1 ? " and " : "s and ") + lb[i].speedWins + " win" + (lb[i].speedWins === 1 ? "!" : "s!"), id);
                    } else if (scoreType === "elimination"){
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].livesLeft + " total lives left and " + lb[i].elimWins + " win" + (lb[i].elimWins === 1 ? "!" : "s!"), id);
                    } else if (scoreType === "event") {
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].eventPoints + " point" + (lb[i].eventPoints === 1 ? " and " : "s and ") + lb[i].eventWins + " win" + (lb[i].eventWins === 1 ? "!" : "s!"), id);
                    }
                }
            }
        }
        sys.sendMessage(src, "", id);
    } else {
        Trivia.sendPM(src, "Valid scoring systems are knowledge [know], speed [speed], elimination [elim], and event [event].", id);
    }
};

PointsLB.prototype.updateLastLB = function() {
    extLastLB.update(this.leaderboard);
};

PointsLB.prototype.reset = function() {
    this.leaderboard = [];
    sys.writeToFile(this.file, JSON.stringify(this.leaderboard));
};

function PointsLastLB(file) {
    this.file = file;
    this.minLB = 7;
    this.minSpeedLB = 25;
    this.leaderboard = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        sys.writeToFile(file, "[]");
    }
    try {
        this.leaderboard = JSON.parse(fileContent);
    }
    catch (e) {
        sys.sendAll("Error loading leaderboard: " + e, revchan);
    }
}

PointsLastLB.prototype.showLeaders = function (src, commandData, id) {
    var scoreTypes = ["elimination", "knowledge", "speed", "event"];
    var lb = [], player = [];
    var i, maxPlace;
    var input = commandData.split('*');
    var scoreType = input[0].toLowerCase();
    if (scoreType === "know"){
        scoreType = "knowledge";
    } else if (scoreType === "elim"){
        scoreType = "elimination";
    }
    if (scoreTypes.indexOf(scoreType) !== -1){
        if (input.length === 1 || isNaN(input[1]) || input[1] <= 0){
            maxPlace = 10;
        } else {maxPlace = input[1];}
        for (i = 0; i < this.leaderboard.length; i++) {
            player = { "name" : this.leaderboard[i].name, "regPoints" : this.leaderboard[i].regPoints, "speedPoints" : this.leaderboard[i].speedPoints, "regWins" : this.leaderboard[i].regWins, "livesLeft" : this.leaderboard[i].livesLeft,"elimWins" : this.leaderboard[i].elimWins, "speedWins" : this.leaderboard[i].speedWins, "eventPoints" : this.leaderboard[i].eventPoints, "eventWins" : this.leaderboard[i].eventWins };
            lb.push(player);
        }
        if (scoreType === "elimination"){
            lb.sort(function (a, b){
                if (b.elimWins === a.elimWins){
                    if (b.livesLeft === a.livesLeft) {
                        if (b.regWins === a.regWins){
                            if (b.speedWins === a.speedWins) {
                                if (b.regPoints === a.regPoints) {
                                    return b.speedPoints - a.speedPoints;
                                } else return b.regPoints - a.regPoints;
                            } else return b.speedWins - a.speedWins;
                        } else return b.regWins - a.regWins;
                    } else return b.livesLeft - a.livesLeft;
                } else return b.elimWins - a.elimWins;
            });
        } else if (scoreType === "knowledge"){
            lb.sort(function (a, b){
                if (b.regPoints === a.regPoints){
                    if (b.regWins === a.regWins){
                        if (b.speedPoints === a.speedPoints) {
                            if (b.speedWins === a.speedWins) {
                                if (b.livesLeft === a.livesLeft){
                                    return b.elimWins - a.elimWins;
                                } else return b.livesLeft - a.livesLeft;
                            } else return b.speedWins - a.speedWins;
                        } else return b.speedPoints - a.speedPoints;
                    } else return b.regWins - a.regWins;
                } else return b.regPoints - a.regPoints;
            });
        } else if (scoreType === "speed"){
            lb.sort(function (a, b){
                if (b.speedPoints === a.speedPoints){
                    if (b.speedWins === a.speedWins){
                        if (b.regPoints === a.regPoints) {
                            if (b.regWins === a.regWins) {
                                if (b.livesLeft === a.livesLeft){
                                    return b.elimWins - a.elimWins;
                                } else return b.livesLeft - a.livesLeft;
                            } else return b.regWins - a.regWins;
                        } else return b.regPoints - a.regPoints;
                    } else return b.speedWins - a.speedWins;
                } else return b.speedPoints - a.speedPoints;
            });
        } else if (scoreType === "event") {
            lb.sort(function (a, b) {
                if (b.eventPoints === a.eventPoints) {
                    if (b.eventWins === a.eventWins) {
                        if (b.regPoints === a.regPoints){
                            if (b.regWins === a.regWins){
                                if (b.speedPoints === a.speedPoints) {
                                    if (b.speedWins === a.speedWins) {
                                        if (b.livesLeft === a.livesLeft){
                                            return b.elimWins - a.elimWins;
                                        } else return b.livesLeft - a.livesLeft;
                                    } else return b.speedWins - a.speedWins;
                                } else return b.speedPoints - a.speedPoints;
                            } else return b.regWins - a.regWins;
                        } else return b.regPoints - a.regPoints;
                    } else return b.eventWins - a.eventWins;
                } else return b.eventPoints - a.eventPoints;
            });
        }
        sys.sendMessage(src, "", id);
        sys.sendMessage(src, "*** Trivia Leaderboard (" + scoreType + ") ***", id);
        for (i = 0; i < lb.length; i++) {
            if (i < maxPlace || lb[i].name === sys.name(src).toLowerCase()) {
                var x = i + 1;
                if (scoreType === "knowledge"){
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].regPoints + " point" + (lb[i].regPoints === 1 ? " and " : "s and ") + lb[i].regWins + " win" + (lb[i].regWins === 1 ? "!" : "s!"), id);
                } else if (scoreType === "speed"){
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].speedPoints + " point" + (lb[i].speedPoints === 1 ? " and " : "s and ") + lb[i].speedWins + " win" + (lb[i].speedWins === 1 ? "!" : "s!"), id);
                } else if (scoreType === "elimination"){
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].livesLeft + " total lives left and " + lb[i].elimWins + " win" + (lb[i].elimWins === 1 ? "!" : "s!"), id);
                } else if (scoreType === "event") {
                    Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].eventPoints + " point" + (lb[i].eventPoints === 1 ? " and " : "s and ") + lb[i].eventWins + " win" + (lb[i].eventWins === 1 ? "!" : "s!"), id);
                }
            }
        }
        sys.sendMessage(src, "", id);
        var y = input.length - 1; //allow maxLength to still be optional
        if (input[y] !== "" || input[y] !== undefined) {
            for (i = 0; i < lb.length; i++) {
                if (lb[i].name === input[y].toLowerCase()) {
                    x = i + 1;
                    if (scoreType === "knowledge"){
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].regPoints + " point" + (lb[i].regPoints === 1 ? " and " : "s and ") + lb[i].regWins + " win" + (lb[i].regWins === 1 ? "!" : "s!"), id);
                    } else if (scoreType === "speed"){
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].speedPoints + " point" + (lb[i].speedPoints === 1 ? " and " : "s and ") + lb[i].speedWins + " win" + (lb[i].speedWins === 1 ? "!" : "s!"), id);
                    } else if (scoreType === "elimination"){
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].livesLeft + " total lives left and " + lb[i].elimWins + " win" + (lb[i].elimWins === 1 ? "!" : "s!"), id);
                    } else if (scoreType === "event") {
                        Trivia.sendPM(src, "#" + x + " " + lb[i].name + " with " + lb[i].eventPoints + " point" + (lb[i].eventPoints === 1 ? " and " : "s and ") + lb[i].eventWins + " win" + (lb[i].eventWins === 1 ? "!" : "s!"), id);
                    }
                }
            }
        }
        sys.sendMessage(src, "", id);
    } else {
        Trivia.sendPM(src, "Valid scoring systems are knowledge [know], speed [speed], elimination [elim], and event [event].", id);
    }
};

PointsLastLB.prototype.update = function(oldLB) {
    this.leaderboard = oldLB;
    sys.writeToFile(this.file, JSON.stringify(this.leaderboard));
};

PointsLastLB.prototype.reset = function() {
    this.leaderboard = [];
    sys.writeToFile(this.file, JSON.stringify(this.leaderboard));
};

// Commands
var userCommands = {};
var adminCommands = {};
var ownerCommands = {};
var serverOwnerCommands = {};
var userCommandHelp = [];
var adminCommandHelp = [];
var ownerCommandHelp = [];
var serverOwnerCommandHelp = [];

function addUserCommand(commands, callback, help) {
    commands = [].concat(commands);
        for (var i = 0; i < commands.length; ++i) {
        userCommands[commands[i]] = callback;
    }
    userCommandHelp.push("/" + commands[0] + ": " + (help === undefined ? "no help" : help));
}

function addAdminCommand(commands, callback, help) {
    commands = [].concat(commands);
        for (var i = 0; i < commands.length; ++i) {
        adminCommands[commands[i]] = callback;
    }
    adminCommandHelp.push("/" + commands[0] + ": " + (help === undefined ? "no help" : help));
}

function addOwnerCommand(commands, callback, help) {
    commands = [].concat(commands);
        for (var i = 0; i < commands.length; ++i) {
        ownerCommands[commands[i]] = callback;
    }
    ownerCommandHelp.push("/" + commands[0] + ": " + (help === undefined ? "no help" : help));
}

function addServerOwnerCommand(commands, callback, help) {
    commands = [].concat(commands);
        for (var i = 0; i < commands.length; ++i) {
        serverOwnerCommands[commands[i]] = callback;
    }
    serverOwnerCommandHelp.push("/" + commands[0] + ": " + (help === undefined ? "no help" : help));
}

// USER COMMANDS

addUserCommand(["triviarules"], function (src, commandData, channel) {
    sys.sendMessage(src, "", channel);
    sys.sendMessage(src, "*** Trivia Rules ***", channel);
    sys.sendMessage(src, "1. #Trivia is an official channel, and as such, server rules apply in it:", channel);
    sys.sendMessage(src, "- This means that every offense, whether in chat or in answers, will be handled by a moderator.", channel);
    sys.sendMessage(src, "2. Do not abuse Trivia commands or hamper game progression:", channel);
    sys.sendMessage(src, "- This includes, but is not limited to, joining and unjoining a game repeatedly, joining a game just to answer a single question then immediately leaving multiple times, purposefully getting answers wrong in order to prolong a game from ending, starting games with unreasonable goals or starting them many times in a row when they're stopped due to a lack of players.", channel);
    sys.sendMessage(src, "3. Have good sportsmanship:", channel);
    sys.sendMessage(src, "- Trivia is a game for all to enjoy, and bad sportsmanship can turn that into a less pleasant experience for everyone involved. Do not brag when you get a question right, and do not be a sore loser when you get it wrong. Any form of cheating isn't allowed, whether by gaining an unfair advantage for yourself, or hampering someone else's ability to answer.", channel);
    sys.sendMessage(src, "4. Do not abuse question submission:", channel);
    sys.sendMessage(src, "- This includes, but is not limited to, submitting questions that are plainly wrong, offensive to other users, racist, inappropriate, trolling, spamming the same question multiple times, purposefully submitting questions that are already in the database. Trivia Admins can revoke a user's submitting privileges at any time if they deem it necessary.", channel);
    sys.sendMessage(src, "5. Trivia House Rules apply to all Trivia games:", channel);
    sys.sendHtmlMessage(src, "<timestamp/> - Use <b><a href=\"po:send//houserules\">/houserules</a></b> to view the Trivia House Rules.", channel);
}, "Shows the rules of the Trivia channel.");

addUserCommand(["houserules"], function (src, commandData, channel) {
    sys.sendMessage(src, "", channel);
    sys.sendMessage(src, "*** Trivia House Rules ***", channel);
    sys.sendMessage(src, "1. Smeargle only learns Sketch:", channel);
    sys.sendMessage(src, "- For questions such as 'Name a Pokémon that learns Transform', Smeargle would not be accepted.", channel);
    sys.sendMessage(src, "2. Z-Moves are distinct from, and are not considered to be, moves:", channel);
    sys.sendMessage(src, "- For questions such as 'What Steel-type move has the highest Base Power?', Corkscrew Crash, the Steel-type Z Move, would not be accepted.", channel);
    sys.sendMessage(src, "3. Mythical Pokémon are considered Legendary Pokémon, but Ultra Beasts are not:", channel);
    sys.sendMessage(src, "- The Ultra Beasts, Nihilego, Buzzwole, Pheromosa, Xurkitree, Celesteela, Kartana, and Guzzlord are not considered legendary.", channel);
    sys.sendMessage(src, "4. Assume normal conditions (no Skill Swapped abilities, no type change, etc.):", channel);
    sys.sendMessage(src, "- For questions where battle conditions are relevant, assume the conditions are normal, unless special conditions are stated in the question.", channel);
    sys.sendMessage(src, "5. Mega Evolutions are considered to be Pokémon for questions pertaining to base stats:", channel);
    sys.sendMessage(src, "- For questions such as 'What Poison-type Pokémon has the highest base (insert stat here)?', this includes Mega Evolutions.", channel);
}, "Shows the house rules for Trivia games.");

addUserCommand(["triviaadmins","tadmins","tas"], function (src, commandData, channel) {
    tsadmin.tAdminList(src, channel, "Trivia Super Admins");
    tadmin.tAdminList(src, channel, "Trivia Admins");
}, "Gives a list of current Trivia Admins. /tas and /tadmins also work.");

addUserCommand(["join"], function (src, commandData, channel) {
    if (!Trivia.started) {
        Trivia.sendPM(src, "A game hasn't started!", channel);
        return;
    }
    if (SESSION.users(src).mute.active || isTrivia("muted", sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)) {
        Trivia.sendPM(src, "You cannot join when muted!", channel);
        return;
    }
    if (!sys.dbRegistered(sys.name(src))) {
        Trivia.sendPM(src, "Please register before playing Trivia.", channel);
        return;
    }
    if (Trivia.playerPlaying(src)) {
        Trivia.sendPM(src, "You've already joined the game!", channel);
        return;
    }
    if (Trivia.scoreType === "elimination" && Trivia.phase != "signups") {
        if (Trivia.round > Trivia.maxPoints) {
            var canJoin = false;
            for (var z in Trivia.triviaPlayers) { // if they have joined previously, don't lock them out here
                if (Trivia.triviaPlayers[z].name === sys.name(src)) {
                    canJoin = true;
                    break;
                }
            }
            if (!canJoin) {
                Trivia.sendPM(src, "It is too late to join this game!", channel);
                return; //without this, it tells them that they can't join, but then lets them join anyway
            }
        }
        Trivia.addPlayer(src);
        Trivia.triviaPlayers[src].points = Trivia.triviaPlayers[src].points - (Trivia.round - parseInt(Trivia.triviaPlayers[src].roundLeft));
        if (Trivia.phase === "answer" && Trivia.triviaPlayers[src].roundLeft !== Trivia.round && Trivia.triviaPlayers[src].phaseLeft !== "answer") { Trivia.triviaPlayers[src].points++; } // no need to penalize them twice if they don't answer correctly
        if (Trivia.phase === "standby" && Trivia.triviaPlayers[src].roundLeft === Trivia.round && Trivia.triviaPlayers[src].phaseLeft === "answer") { Trivia.triviaPlayers[src].points--; } // if a player tries to unjoin and join to avoid a question, make sure they get penalized
        if (Trivia.triviaPlayers[src].points <= 0) {
            Trivia.removePlayer(src);
            Trivia.sendPM(src, "It is too late to join this game!", channel);
            return;
        }
        Trivia.sendAll(sys.name(src) + " joined the game late with " + Trivia.triviaPlayers[src].points + (Trivia.triviaPlayers[src].points === 1 ? " life!" : " lives!"), triviachan);
        return;
    }
    if (Trivia.suggestion.suggester === src) {
        Trivia.sendPM(src, "You can't join the game right after suggesting a question, you cheater!", channel);
        return;
    }
    Trivia.addPlayer(src);
    if (Trivia.scoreType === "elimination") {
        Trivia.sendAll(sys.name(src) + " joined the game!", triviachan);
        return;
    }
    else switch (Trivia.triviaPlayers[src].points) {
    case 0:
        Trivia.sendAll(sys.name(src) + " joined the game!", triviachan);
        break;
    case 1:
        Trivia.sendAll(sys.name(src) + " returned to the game with 1 point!", triviachan);
        break;
    default:
        Trivia.sendAll(sys.name(src) + " returned to the game with " + Trivia.triviaPlayers[src].points + " points!", triviachan);
    }
}, "Allows you to join a current game of Trivia.");

addUserCommand(["unjoin"], function (src, commandData, channel) {
    if (channel == triviachan)
        Trivia.unjoin(src);
}, "Allows you to quit a current game of Trivia.");

addUserCommand(["nextevent"], function (src, commandData, channel) {
    if (!eventModeOn) {
        Trivia.sendPM(src, "No events scheduled.", channel);
        return;
    }
    if (trivData.eventFlag) {
        Trivia.sendPM(src, "A Trivia event game is currently running.", channel);
        return;
    }
    if (eventModeOn && ((lastEventTime + trivData.eventCooldown) <= sys.time())) {
        Trivia.sendPM(src, "Starts after this game.", channel);
        return;
    }
    var nextEventTime = (lastEventTime + trivData.eventCooldown) - sys.time();
    Trivia.sendPM(src, "The next event will be " + getTimeString(nextEventTime) + " from now.", channel);
}, "Displays when the next event game will start.");

addUserCommand(["start"], function (src, commandData) {
    if (SESSION.users(src).mute.active || isTrivia("muted", sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)) {
        Trivia.sendPM(src, "You cannot join when muted!", channel);
        return;
    }
    if (!sys.dbRegistered(sys.name(src))) {
        Trivia.sendPM(src, "Please register before playing Trivia.", channel);
        return;
    }
    Trivia.startTrivia(src, commandData, "knowledge");
}, "Allows you to start a trivia game, format /start [number][:difficulty][*category1][*category2][...]. Leave number blank for random. Difficulties are easy, intermediate (int for short), and hard (leave blank to include all difficulty levels). Only Trivia Admins may start category games.");

addUserCommand(["speed"], function (src, commandData) {
    if (SESSION.users(src).mute.active || isTrivia("muted", sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)) {
        Trivia.sendPM(src, "You cannot join when muted!", channel);
        return;
    }
    if (!sys.dbRegistered(sys.name(src))) {
        Trivia.sendPM(src, "Please register before playing Trivia.", channel);
        return;
    }
    Trivia.startTrivia(src, commandData, "speed");
}, "Allows you to start a speed trivia game, format /speed [number][:difficulty][*category1][*category2][...]. Leave number blank for random. Difficulties are easy, intermediate (int for short), and hard (leave blank to include all difficulty levels). Only Trivia Admins may start category games.");

addUserCommand(["goal"], function (src, commandData, channel) {
    if (!Trivia.started) {
        Trivia.sendPM(src, "A trivia game isn't currently running.", channel);
        return;
    }
    var points = Trivia.maxPoints;
    Trivia.sendPM(src, (Trivia.scoreType === "elimination" ? "Everyone started with " + points + (points == 1 ? " life." : " lives.") : "The goal for the current game is: " + points), channel);
}, "Displays the goal for the current Trivia game.");

addUserCommand(["flashme"], function (src, commandData, channel) {
    if (!trivData.toFlash[sys.ip(src)]) {
        trivData.toFlash[sys.ip(src)] = true;
        saveData();
        triviabot.sendMessage(src, "You are now going to be flashed when a game starts.", channel);
    }
    else {
        delete trivData.toFlash[sys.ip(src)];
        saveData();
        triviabot.sendMessage(src, "You are no longer going to be flashed when a game starts.", channel);
    }
}, "Set whether or not to flash you when a game starts.");

addUserCommand(["submitq"], function (src, commandData, channel) {
    var user_ip = sys.ip(src),
        isAdmin = tadmin.isTAdmin(sys.name(src));
    if (isTrivia("submitbanned", user_ip) && !isAdmin) {
        var ban = trivData.submitBans[user_ip];
        Trivia.sendPM(src, "You are banned from submitting questions" + (ban.expires == "never" ? "" : "for  " + getTimeString(ban.expires - sys.time())) + ". " + (ban.reason !== undefined ? "[Reason: " + ban.reason + "]" : ""), channel);
        return;
    }
    commandData = commandData.split("*");
    if (commandData.length != 3) {
        Trivia.sendPM(src, "Oops! Usage of this command is: /submitq category*question*answer(s)", channel);
        Trivia.sendPM(src, "Separate multiple answers with ','.", channel);
        return;
    }
    var category = utilities.html_escape(commandData[0]).trim();
    if (trivData.equivalentCats.hasOwnProperty(category.toLowerCase())) {
       category = trivData.equivalentCats[category.toLowerCase()];
    }
    var question = utilities.html_escape(commandData[1]).trim();
    var fixAnswer = commandData[2].replace(/ *, */gi, ",").replace(/^ +/, "");
    var answer = fixAnswer.split(",");
    var needsreview = false;
    if (trivreview.questionAmount() === 0) {
        needsreview = true;
    }

    var name = sys.name(src);
    var notes = "None.";
    var id = trivreview.add(category, question, answer, name, notes);

    Trivia.sendPM(src, "Your question was submitted.", channel);
    if (needsreview) {
        trivreview.checkq(id);
    }
}, "Allows you to submit a question for review. Format is /submitq Category*Question*Answer1,Answer2,etc.");

addUserCommand(["qamount"], function (src, commandData, channel) {
    if (channel == triviachan || channel == revchan) {
        var qamount = triviaq.questionAmount();
        triviabot.sendMessage(src, "The amount of questions is: " + qamount, channel);
        return;
    }
}, "Shows the current amount of questions");

addUserCommand(["lastcat"], function (src, commandData, channel) {
    if (lastCatGame === 0) {
        Trivia.sendPM(src, "There hasn't been a Category Game since Trivia was last updated.", channel);
        return;
    }
    Trivia.sendPM(src, "The last Category Game occurred " + lastCatGame + " games ago, with categories: " + lastUsedCats.join(", "), channel);
}, "Allows you to check when the last category game occurred.");

addUserCommand(["categories", "cats"], function (src, commandData, channel) {
    if (typeof (triviaCategories) != "object") return;
    triviabot.sendMessage(src, triviaCategories.join(", "), channel);
    /*triviabot.sendMessage(src, "For more information, refer to: http://wiki.pokemon-online.eu/wiki/Trivia_Categories", channel); Rip Wiki*/
}, "Allows you to view the trivia categories");

addUserCommand(["vote"], function (src, commandData, channel) {
    if (Trivia.phase !== "countvotes" || Trivia.votingAborted === true) {
        Trivia.sendPM(src, "Voting is not currently in progress!", channel);
        return;
    }
    if (SESSION.users(src).mute.active || isTrivia("muted", sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)) {
        Trivia.sendPM(src, "You cannot join when muted!", channel);
        return;
    }
    if (!sys.dbRegistered(sys.name(src))) {
        Trivia.sendPM(src, "Please register before playing Trivia.", channel);
        return;
    }
    var category = utilities.html_escape(commandData).toLowerCase().trim();
    var catAndType = "";
    if (category.indexOf("*") !== -1) {
        catAndType = category.split("*");
        if (catAndType[1].toLowerCase() !== "know" && catAndType[1].toLowerCase() !== "knowledge" && catAndType[1].toLowerCase() !== "speed") {
            Trivia.sendPM(src, "'" + catAndType[1] + "' is not a valid game type. Valid game types are 'know' and 'speed'.");
            return;
        }
        category = catAndType[0];
    }

    if (trivData.equivalentCats.hasOwnProperty(category)) {
        category = trivData.equivalentCats[category].toLowerCase();
    }
    var cat = triviaCategories.join("*").toLowerCase().split("*").indexOf(category);

    if (cat === -1) {
        Trivia.sendPM(src, "Please enter a valid category to vote for.", channel);
        return;
    }

    if (lastUsedCats.join("*").toLowerCase().split("*").indexOf(category) > -1) {
        Trivia.sendPM(src, "This category was recently started, choose another!", channel);
        return;
    }

    var key = this.key(src);
    if (Trivia.votes.hasOwnProperty(key) && (Trivia.votes[key] === cat)) {
        Trivia.sendPM(src, "You have already voted for this category!", channel);
        return;
    }
    var alreadyVoted = false;
    for (var y in Trivia.voters) {
        if (Trivia.voters[y] === sys.name(src)) {
            alreadyVoted = true;
            break;
        }
    }
    if (!alreadyVoted) { Trivia.voters.push(sys.name(src)); }
    var type = "";
    if (catAndType === "") { type = "know"; }
    else { type = catAndType[1]; }
    Trivia.voteCat(src, cat, type);
}, "Vote for a category game. Usage is /vote [category]*[gameMode(optional)]");

addUserCommand(["leaderboard", "lb"], function (src, commandData, channel){
    extLB.showLeaders(src, commandData, channel);
}, "Shows the current leaderboard and your standing, format: /leaderboard [type]*[#]*[player]. /lb can also be used. Type is the scoring used (knowledge [know], speed [speed], elimination [elim], event [event]) required. # is the number of places to show; if left blank, shows top 10 and your placement. Player is an optional input that allows you to search for a player's position in the leaderboard.");

addUserCommand(["lastleaderboard", "lastlb"], function (src, commandData, channel) {
    extLastLB.showLeaders(src, commandData, channel);
}, "Shows the leaderboard from last month, format: /lastlb [type]*[#]*[player]. Type is the scoring used (knowledge [know], speed [speed], elimination [elim], event [event]) required. # is the number of places to show; if left blank, shows top 10 and your placement. Player is an optional input that allows you to search for a player's position in the leaderboard.");

/*** TRIVIA ADMIN COMMANDS ***/

// General Commands

addAdminCommand(["elimination", "elim"], function (src, commandData) {
    Trivia.startTrivia(src, commandData, "elimination");
}, "Allows you to start an elimination game. Format is /elimination [number][:difficulty][*category1][*category2][...]. Leave number blank for random. Difficulties are easy, intermediate (int for short), and hard (leave blank to include all difficulty levels).");

addAdminCommand(["changegoal"], function (src, commandData, channel) {
    if (!Trivia.started) {
        Trivia.sendPM(src, "A trivia game isn't currently running.", channel);
        return;
    }
    if (Trivia.scoreType === "elimination") {
        Trivia.sendPM(src, "This doesn't make much sense in an elimination game.", channel);
        return;
    }
    commandData = parseInt(commandData, 10);
    if (isNaN(commandData)) {
        Trivia.sendPM(src, "The goal must be a valid number.", channel);
        return;
    }
    if (commandData < 1 || commandData > 60) {
        Trivia.sendPM(src, "The goal must not be lower than 1 or higher than 60.", channel);
        return;
    }
    triviabot.sendAll(sys.name(src) + " changed the goal of the current game to " + commandData + ".", triviachan);
    Trivia.maxPoints = commandData;
    return;
}, "Allows you to change the goal for the current game.");

addAdminCommand(["end"], function (src) {
    Trivia.endTrivia(src);
}, "Allows you to end a current trivia game.");

addAdminCommand(["submitpopq"], function (src, commandData, channel) {
    commandData = commandData.split("*");
    if (commandData.length != 3) {
        Trivia.sendPM(src, "Oops! Usage of this command is: /submitpopq category*question*answer(s)", channel);
        Trivia.sendPM(src, "Separate multiple answers with ','.", channel);
        return;
    }
    var category = "Pop Quiz";
    var displayCat = "<b>Category:</b> " + commandData[0].toUpperCase() + "<br>";
    var question = displayCat + utilities.html_escape(commandData[1]).trim();
    var fixAnswer = commandData[2].replace(/ *, */gi, ",").replace(/^ +/, "");
    var answer = fixAnswer.split(",");
    triviaq.add(category, question, answer);

    var all = triviaq.all(),
            qid;
    for (var b in all) {
        var qu = triviaq.get(b);
        if (qu.question === question) {
            qid = b;
        }
    }
    Trivia.sendPM(src, "Your question was submitted with the id: " + qid, channel);
},"Allows you to submit a pop quiz question. Format is /submitpopq Category*Question*Answer1,Answer2,etc.");

addAdminCommand(["suggest"], function (src, commandData, channel) {
    if (!Trivia.started) {
        Trivia.sendPM(src, "A game hasn't started!", channel);
        return;
    }
    if (Trivia.playerPlaying(src)) {
        Trivia.sendPM(src, "Don't cheat, you cheater!", channel);
        return;
    }
    if (Trivia.qSource.indexOf(commandData) === -1) {
        Trivia.sendPM(src, "The ID you specified is invalid for this Trivia game.", channel);
        return;
    }
    Trivia.suggestion.id = commandData;
    Trivia.suggestion.suggester = src;
    Trivia.suggestion.asked = false;
    Trivia.sendAll(sys.name(src) + " made a suggestion for the next question to be asked in Trivia.", revchan);
}, "Allows you to suggest a question to be asked next in Trivia. Format is /suggest [ID].");

addAdminCommand(["say"], function (src, commandData, channel) {
    if (commandData === "") {
        Trivia.sendPM(src, "Please enter a message.", channel);
        return;
    }
    Trivia.sendAll("(" + sys.name(src) + "): " + commandData, channel);
}, "Allows you to talk during the answer period.");

addAdminCommand(["lastevent"], function (src, commandData, channel) {
    if (trivData.eventFlag) {
        Trivia.sendPM(src, "A Trivia event game is currently running.", channel);
        return;
    }
    if (manualEventFlag){
        var manualEventOutputTime = sys.time() - manualEventTime;
        Trivia.sendPM(src, "The last event was of type " + lastEventType + " and was played " + getTimeString(manualEventOutputTime) + " ago.", channel);
        return;
    }
    var lastEventOutputTime = sys.time() - lastEventTime;
    if (lastEventType === "None.") {
        Trivia.sendPM(src, "No events have been played since Trivia was restarted.", channel);
    }
    if (eventTimeChangeFlag) {
        Trivia.sendPM(src, "The event cooldown was last set " + getTimeString(lastEventOutputTime) + " ago.", channel);
        return;
    }
    Trivia.sendPM(src, "The last event was of type " + lastEventType + " and was played " + getTimeString(lastEventOutputTime) + " ago.", channel);
}, "Displays what the last event type was and how long ago it was played.");

addAdminCommand(["flashtas"], function (src, commandData, channel) {
    if ([triviachan, revchan, sachannel].indexOf(channel) === -1) {
        Trivia.sendPM(src, "Please only use /flashtas in Trivia, TrivReview, or Victory Road!", channel);
        return;
    }
    var message = (commandData === "" ? "Flashing all Trivia Admins!" : commandData);
    sys.sendAll(sys.name(src).toCorrectCase() + ": " + message, channel);
    var admins = [tadmin, tsadmin];
    for (var auth = 0; auth < admins.length; auth++) {
        for (var i = 0; i < admins[auth].admins.length; i++) {
            if (sys.id(admins[auth].admins[i]) !== undefined) {
                triviabot.sendHtmlMessage(sys.id(admins[auth].admins[i]), "<b>You're needed in this channel!</b><ping/>", channel);
            }
        }
    }
}, "Pings all online Trivia Admins. Use with /flashtas [phrase]. Abuse will be punished.");

addAdminCommand(["submitban"], function (src, commandData, channel) {
    if (commandData === undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: name:reason:time", channel);
        return;
    }
    commandData = commandData.split(":");
    var user = commandData[0],
        reason = commandData[1],
        time = commandData[2];
    if (sys.dbIp(user) === undefined) {
        triviabot.sendMessage(src, "Couldn't find " + user, channel);
        return;
    }
    var tarip = sys.id(user) === undefined ? sys.dbIp(user) : sys.ip(sys.id(user));
    var ok = sys.auth(src) <= 0 && sys.maxAuth(tarip) <= 0 && !tadmin.isTAdmin(user);
    if (sys.maxAuth(tarip) >= sys.auth(src) && !ok) {
        triviabot.sendMessage(src, "Can't do that to higher auth!", channel);
        return;
    }
    if (time === undefined) {
        time = 0;
    }
    var seconds = getSeconds(time);
    if (isNaN(seconds)) {
        triviabot.sendMessage(src, "The time is a bit odd...", channel);
        return;
    }
    if (seconds < 1) {
        if (!isTriviaOwner(src)) {
            triviabot.sendMessage(src, "Please specify time!", channel);
            return;
        }
        time = "forever";
    }
    var already = false;
    if (isTrivia("submitbanned", tarip)) {
        if (sys.time() - trivData.submitBans[tarip].issued < 15) {
            triviabot.sendMessage(src, "This person was recently banned!", channel);
            return;
        }
        already = true;
    }
    var timestring = (time === "forever" ? "forever" : getTimeString(seconds));
    var expires = (time == "forever") ? "never" : parseInt(sys.time(), 10) + parseInt(seconds, 10);
    trivData.submitBans[tarip] = {
        'name': user,
        'reason': reason,
        'by': sys.name(src),
        'issued': parseInt(sys.time(), 10),
        'expires': expires
    };
    var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), revchan];
    for (var x in channels) {
        if (sys.existChannel(sys.channel(channels[x]))) {
            triviabot.sendAll(already? sys.name(src) + " changed " + user + "'s submit ban time to " + (timestring === "forever" ? timestring : timestring + " from now") + "!" : (sys.name(src) + " banned " + user + " from submitting questions " + (timestring === "forever" ? "" : "for ") + timestring + "!") + " [Reason: " + reason + "]", channels[x]);
        }
    }
    saveData();
}, "Ban a user from submitting. Format is /submitban user:reason:time.");

addAdminCommand(["submitunban"], function (src, commandData, channel) {
    if (commandData === undefined) {
        triviabot.sendMessage(src, "Specify a user!", channel);
        return;
    }
    if (sys.dbIp(commandData) === undefined) {
        triviabot.sendMessage(src, "Couldn't find " + commandData);
        return;
    }
    var ip = (sys.id(commandData) !== undefined) ? sys.ip(sys.id(commandData)) : sys.dbIp(commandData);
    if (!isTrivia("submitbanned", ip)) {
        triviabot.sendMessage(src, commandData + " isn't banned from submitting.", channel);
        return;
    }
    delete trivData.submitBans[ip];
    saveData();
    var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), revchan];
    for (var x in channels) {
        if (sys.existChannel(sys.channel(channels[x]))) {
            triviabot.sendAll(sys.name(src) + " unbanned " + commandData + " from submitting questions.", channels[x]);
        }
    }
    return;
}, "Unban a user from submitting.");

addAdminCommand(["submitbans"], function (src, commandData, channel) {
    showTrivia(src, channel, "submitBans");
}, "View submit bans.");

addAdminCommand(["wordwarns"], function (src, commandData, channel) {
    var table = '';
    table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Trivia Warnings</strong></center></td></tr>';
    for (var i = 0; i < trivData.triviaWarnings.length; i += 5) {
        table += '<tr>';
        for (var j = 0; j < 5 && i + j < trivData.triviaWarnings.length; ++j) {
            table += '<td>' + trivData.triviaWarnings[i + j].toString() + '</td>';
        }
        table += '</tr>';
    }
    table += '</table>';
    sys.sendHtmlMessage(src, table, channel);
    return;
}, "View word warnings.");

addAdminCommand(["triviamute"], function (src, commandData, channel) {
    if (commandData === undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: name:reason:time", channel);
        return;
    }
    commandData = commandData.split(":");
    var user = commandData[0],
        reason = commandData[1],
        time = commandData[2];
    if (sys.dbIp(user) === undefined) {
        triviabot.sendMessage(src, "Couldn't find " + user, channel);
        return;
    }
    var tarip = sys.id(user) === undefined ? sys.dbIp(user) : sys.ip(sys.id(user));
    var ok = sys.auth(src) <= 0 && sys.maxAuth(tarip) <= 0 && !tadmin.isTAdmin(user);
    if (sys.maxAuth(tarip) >= sys.auth(src) && !ok) {
        triviabot.sendMessage(src, "Can't do that to higher auth!", channel);
        return;
    }
    if (time === undefined) {
        time = 0;
    }
    var seconds = getSeconds(time);
    if (isNaN(seconds)) {
        triviabot.sendMessage(src, "The time is a bit odd...", channel);
        return;
    }
    if (seconds < 1) {
        if (!isTriviaOwner(src)) {
            triviabot.sendMessage(src, "Please specify time!", channel);
            return;
        }
        time = "forever";
    }

    var already = false;
    if (isTrivia("muted", tarip)) {
        if (sys.time() - trivData.mutes[tarip].issued < 15) {
            triviabot.sendMessage(src, "This person was recently muted!", channel);
            return;
        }
        already = true;
    }
    var timestring = (time === "forever" ? "forever" : getTimeString(seconds));
    var expires = (time == "forever") ? "never" : parseInt(sys.time(), 10) + parseInt(seconds, 10);
    trivData.mutes[tarip] = {
        'name': user,
        'reason': reason,
        'by': sys.name(src),
        'issued': parseInt(sys.time(), 10),
        'expires': expires
    };
    var chans = [triviachan, revchan, sachannel, staffchannel];
    for (var x in chans) {
        var current = chans[x];
        triviabot.sendAll((already ? nonFlashing(sys.name(src)) + " changed " + user + "'s triviamute time to " + (timestring === "forever" ? "forever" : timestring + " from now") : user + " was trivia muted by " + nonFlashing(sys.name(src)) + (timestring === "forever" ? " forever" : " for " + timestring)) + "! [Reason: " + reason + "]", current);
    }
    if (sys.id(user) !== undefined && Trivia.playerPlaying(sys.id(user))) {
        Trivia.removePlayer(sys.id(user));
        triviabot.sendAll(user + " was removed from the game!", triviachan);
    }
    saveData();
}, "Trivia mute a user. Format is /triviamute user:reason:time.");

addAdminCommand(["triviaunmute"], function (src, commandData, channel) {
    if (commandData === undefined) {
        triviabot.sendMessage(src, "Specify a user!", channel);
        return;
    }
    if (sys.dbIp(commandData) === undefined) {
        triviabot.sendMessage(src, "Couldn't find " + commandData, channel);
        return;
    }
    var tarip = sys.id(commandData) === undefined ? sys.dbIp(commandData) : sys.ip(sys.id(commandData));
    if (!isTrivia("muted", tarip)) {
        triviabot.sendMessage(src, commandData + " isn't trivia muted!", channel);
        return;
    }
    if (tarip == sys.ip(src) && isTrivia("muted", tarip)) {
        triviabot.sendMessage(src, "You may not trivia unmute yourself!", channel);
        return;
    }
    delete trivData.mutes[tarip];
    var chans = [triviachan, revchan, sachannel, staffchannel];
    for (var x in chans) {
        var current = chans[x];
        triviabot.sendAll(commandData + " was trivia unmuted by " + nonFlashing(sys.name(src)) + "!", current);
    }
    saveData();
}, "Trivia unmute a user.");

addAdminCommand(["triviamutes"], function (src, commandData, channel) {
    showTrivia(src, channel, "mutes");
}, "View Trivia mutes.");

addAdminCommand(["startrange"], function (src, commandData, channel) {
    if (commandData === "") {
        triviabot.sendMessage(src, "The current start range is " + trivData.autostartRange.min + "-" + trivData.autostartRange.max + ".", channel);
        return;
    }
    var data = commandData.split("-");
    if (data.length != 2) {
        triviabot.sendMessage(src, "That's not how this command works. To change the start range, use /startrange min-max.", channel);
        return;
    }
    if (isNaN(data[0]) || isNaN(data[1])) {
        triviabot.sendMessage(src, "Both the minimum and maximum for the point range have to be numbers!", channel);
        return;
    }
    trivData.autostartRange.min = data[0];
    trivData.autostartRange.max = data[1];
    saveData();
    triviabot.sendAll(nonFlashing(sys.name(src)) + " changed the start range to " + data[0] + "-" + data[1] + ".", revchan);
}, "Checks the start range, and lets you modify it. Use /startrange min-max to change it.");

addAdminCommand(["passta"], function (src, commandData, channel) {
    var oldname = sys.name(src).toLowerCase();
    var newname = commandData.toLowerCase();
    var sTA = false;
    if (sys.dbIp(newname) === undefined) {
        triviabot.sendMessage(src, "This user doesn't exist!", channel);
        return;
    }
    if (!sys.dbRegistered(newname)) {
        triviabot.sendMessage(src, "That account isn't registered so you can't give it authority!", channel);
        return;
    }
    if (sys.id(newname) === undefined) {
        triviabot.sendMessage(src, "Your target is offline!", channel);
        return;
    }
    if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
        triviabot.sendMessage(src, "Both accounts must be on the same IP to switch!", channel);
        return;
    }
    /* Can't figure out syntax to allow it to check properly, but it really doesn't matter at this point in the code.
    if (tadmin.isTAdmin(newname) || isTriviaOwner(newname)) {
        triviabot.sendMessage(src, "Your target is already a Trivia Admin!", channel);
        return;
    }*/
    if (tsadmin.isTAdmin(oldname)) {
        tsadmin.removeTAdmin(oldname);
        tsadmin.addTAdmin(newname);
        sTA = true;
    } else if (tadmin.isTAdmin(oldname)){
        tadmin.removeTAdmin(oldname);
        tadmin.addTAdmin(newname);
    } else {
        triviabot.sendMessage(src, "You are not Trivia Auth", channel);
        return;
    }
    Trivia.sendAll(sys.name(src) + " passed their " + (sTA ? "Trivia Owner powers" : "Trivia auth") + " to " + commandData, sachannel);
    Trivia.sendAll(sys.name(src) + " passed their " + (sTA ? "Trivia Owner powers" : "Trivia auth") + " to " + commandData, revchan);
    triviabot.sendMessage(src, "You passed your Trivia auth to " + commandData.toCorrectCase() + "!", channel);
    return;
}, "To give your Trivia Admin powers to an alt.");

// Review Commands

addAdminCommand(["removeq"], function (src, commandData, channel) {
    var q = triviaq.get(commandData);
    if (q !== null) {
        triviabot.sendAll(sys.name(src) + " removed question: id " + commandData + ", category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, revchan);
        triviaq.remove(commandData);
        questionData.remove(commandData);
        for (var i = 0; i < trivData.extAnswers.length; i++) {
            if (commandData === trivData.extAnswers[i]) {
                trivData.extAnswers.splice(i, 1);
                saveData();
                break;
            }
        }
        return;
    }
    Trivia.sendPM(src, "Oops! Question doesn't exist", channel);
}, "Allows you to remove a question that has already been submitted. Format is /removeq [ID].");

addAdminCommand(["checkq"], function (src, commandData, channel) {
    PMcheckq(src, channel);
}, "Displays the current question in review.");

addAdminCommand(["changea"], function (src, commandData) {
    if (trivreview.editingMode) {
        trivreview.editingAnswer = commandData.split(",");
        triviabot.sendAll("The answer for the question in edit was changed to " + trivreview.editingAnswer + " by " + sys.name(src), revchan);
        trivreview.checkq();
        return;
    }
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var answer = commandData.split(",");
        trivreview.changeAnswer(id, answer);
        triviabot.sendAll("The answer for the current question was changed to " + answer + " by " + sys.name(src), revchan);
        trivreview.checkq(id);
        return;
    }
    triviabot.sendMessage(src, "No question", revchan);
}, "Allows you to change an answer to a question in review. Format is /changea newanswer.");

addAdminCommand(["changeq"], function (src, commandData) {
    if (trivreview.editingMode) {
        trivreview.editingQuestion = commandData;
        triviabot.sendAll("The question for the question in edit was changed to " + trivreview.editingQuestion + " by " + sys.name(src), revchan);
        trivreview.checkq();
        return;
    }
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var question = commandData;
        trivreview.changeQuestion(id, question);
        triviabot.sendAll("The question for the current question was changed to " + question + " by " + sys.name(src), revchan);
        trivreview.checkq(id);
        return;
    }
    triviabot.sendMessage(src, "No question", revchan);
}, "Allows you to change the question to a question in review. Format is /changeq newquestion.");

addAdminCommand(["changec"], function (src, commandData) {
    if (trivreview.editingMode) {
        trivreview.editingCategory = commandData;
        triviabot.sendAll("The category for the question in edit was changed to " + trivreview.editingCategory + " by " + sys.name(src), revchan);
        trivreview.checkq();
        return;
    }
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var category = commandData;
        trivreview.changeCategory(id, category);
        triviabot.sendAll("The category for the current question was changed to " + category + " by " + sys.name(src), revchan);
        trivreview.checkq(id);
        return;
    }
    triviabot.sendMessage(src, "No question", revchan);
}, "Allows you to change the category to a question in review. Format is /changec newcategory.");

addAdminCommand(["changenotes"], function (src, commandData) {
    if (trivreview.editingMode) {
        trivreview.editingNotes = commandData + " - " + sys.name(src);
        triviabot.sendAll("The notes for the question in edit were changed to " + trivreview.editingNotes + " by " + sys.name(src), revchan);
        trivreview.checkq();
        return;
    }
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var notes = commandData + " - " + sys.name(src);
        trivreview.changeNotes(id, notes, "change");
        triviabot.sendAll("The notes for the current question were changed to " + notes + " by " + sys.name(src), revchan);
        trivreview.checkq(id);
        return;
    }
    triviabot.sendMessage(src, "No question");
}, "Allows you to change the notes to a question in review. Format is /changenotes notes.");

addAdminCommand(["addnotes", "addnote"], function (src, commandData) {
    if (trivreview.editingMode) {
        trivreview.editingNotes = commandData + " - " + nonFlashing(sys.name(src));
        triviabot.sendAll("The following notes regarding the question in edit were added: " + trivreview.editingNotes + " by " + sys.name(src), revchan);
        trivreview.checkq();
        return;
    }
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var notes = commandData + " - " + sys.name(src);
        trivreview.changeNotes(id, notes, "add");
        triviabot.sendAll("The following notes regarding the current question were added: " + notes + " by " + sys.name(src), revchan);
        trivreview.checkq(id);
        return;
    }
    triviabot.sendMessage(src, "No question");
}, "Allows you to add notes to a question in review. Format is /addnotes notes.");

addAdminCommand(["pushback"], function (src, commandData, channel) {
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        if ((time() - trivreview.declineTime) <= 2) {
            triviabot.sendMessage(src, "Please wait before pushing back a question", channel);
            return;
        }
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var q = trivreview.get(id);
        triviabot.sendAll(sys.name(src) + " pushed back the current question to the end of review", revchan);
        trivreview.declineTime = time();
        trivreview.add(q.category, q.question, q.answer, q.name, q.notes);
        trivreview.remove(id);
        trivreview.checkq(id + 1);
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Allows you to push back a question in review.");

addAdminCommand(["showreview"], function (src, commandData, channel) {
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        var ids = Object.keys(tr).sort(function (a, b) {
            return a - b;
        });
        for (var id in ids) {
            var q = trivreview.get(ids[id]);
            Trivia.sendPM(src, "Question #" + (parseInt(id) + 1) + " under review: '" +
                q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "'", channel);
        }
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Shows the current questions in review");

addAdminCommand(["review"], function (src, commandData, channel) {
    var tr = trivreview.all();
    var ids = Object.keys(tr).sort(function (a, b) {
        return a - b;
    });
    if (commandData.length === 0 || isNaN(commandData) || commandData < 1 ||
        commandData > ids.length) {
        triviabot.sendMessage(src, "Specified review id is invalid", channel);
        return;
    }

    for (var i = 0; i < commandData - 1; i++) {
        var q = trivreview.get(ids[i]);
        trivreview.add(q.category, q.question, q.answer, q.name, q.notes);
        trivreview.remove(ids[i]);
    }
    triviabot.sendAll(sys.name(src) + " jumped to question #" + commandData + " in review", revchan);
    trivreview.checkq(commandData - 1);
}, "Jumps to the question with the specified id in review.");

addAdminCommand(["accept"], function (src, commandData, channel) {
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        if ((time() - trivreview.declineTime) <= 2) {
            triviabot.sendMessage(src, "Please wait before accepting a question", channel);
            return;
        }
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var q = trivreview.get(id);
        triviaq.add(q.category, q.question, q.answer);
        var all = triviaq.all(),
            qid;
        for (var b in all) {
            var qu = triviaq.get(b);
            if (qu.question === q.question) {
                qid = b;
            }
        }
        for (var i = 0; i < trivData.editMessageFlags.length; i++) {
            if (q.question === trivData.editMessageFlags[i]) {
                trivData.editMessageFlags.splice(i, 1);
                saveData();
            }
        }
        triviabot.sendAll(sys.name(src) + " accepted question: id: " + qid + ", category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, revchan);
        trivreview.declineTime = time();
        trivreview.remove(id);
        trivreview.checkq(id + 1);
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Allows you to accept the current question in review.");

addAdminCommand(["showq"], function (src, commandData, channel) {
    var q = triviaq.get(commandData);
    if (q !== null) {
        var asked = questionData.hash.hasOwnProperty(commandData);
        var data;
        if (asked) {
            data = questionData.get(commandData).split(" ");
        }
        sys.sendMessage(src, "", channel);
        triviabot.sendMessage(src, "Category: " + q.category, channel);
        triviabot.sendMessage(src, "Question: " + q.question, channel);
        triviabot.sendMessage(src, "Answer: " + q.answer, channel);
        triviabot.sendMessage(src, "Times asked: " + (asked ? data[0] + ". Answered: " + data[1] + ". Answered correctly: " + data[2] : "0") + ".", channel);
        sys.sendMessage(src, "", channel);
        return;
    }
    triviabot.sendMessage(src, "This question does not exist", channel);
}, "Displays an already submitted question.");

addAdminCommand(["editq"], function (src, commandData, channel) {
    commandData = commandData.split("*");
    commandData[0] = commandData[0].trim();
    var q = triviaq.get(commandData[0]);
    var id = -1;
    if (trivreview.get(id)) {
        id = Object.keys(trivreview.all()).sort(function (a, b) {
            return a - b;
        })[0] - 1;
    }
    if (Trivia.roundQuestion === commandData[0]) {
        triviabot.sendMessage(src, "This question is currently being asked. Please wait before editing.", channel);
        return;
    }
    if (q !== null) {
        triviaq.remove(commandData[0]);
        questionData.remove(commandData[0]);
        trivreview.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + sys.name(src) + ":::" + (commandData[1] ? commandData[1] + " - " + sys.name(src) : "None."));
        triviabot.sendAll(sys.name(src) + " placed a question at the top of the review queue.", revchan);
        for (var i = 0; i < trivData.extAnswers.length; i++) {
            if (commandData[0] === trivData.extAnswers[i]) {
                trivData.extAnswers.splice(i, 1);
                saveData();
                var notes = "ALERT! This question has been removed from the extended answer time list. - ±" + triviabot.name;
                trivreview.changeNotes(id, notes, "add");
                break;
            }
        }
        trivreview.checkq();
        return;
    }
    triviabot.sendMessage(src, "This question does not exist", channel);
}, "Allows you to place an existing question into review.");

addAdminCommand(["markq"], function (src, commandData, channel) {
    if (!Trivia.started) {
        Trivia.sendPM(src, "A game hasn't started!", channel);
        return;
    }
    if (Trivia.roundQuestion === 0) {
        Trivia.sendPM(src, "Either a question has not been asked yet, or the last question is a special question!", channel);
        return;
    }
    if (Trivia.phase === "answer") {
        Trivia.sendPM(src, "Wait for the question to finish being asked!", channel);
        return;
    }
    var q = triviaq.get(Trivia.roundQuestion);
    var id = -1;
    if (trivreview.get(id)) {
        id = Object.keys(trivreview.all()).sort(function (a, b) {
            return a - b;
        })[0] - 1;
    }
    if (q !== null) {
        triviaq.remove(Trivia.roundQuestion);
        questionData.remove(Trivia.roundQuestion);
        trivreview.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + sys.name(src) + ":::" + (commandData[0] ? commandData[0] + " - " + sys.name(src) : "None."));
        triviabot.sendAll(sys.name(src) + " placed a question at the top of the review queue.", revchan);
        trivreview.checkq();
        return;
    }
}, "Puts the most recently asked question into review.");

addAdminCommand(["decline"], function (src, commandData, channel) {
    var tr = trivreview.all();
    if (trivreview.questionAmount() !== 0) {
        if ((time() - trivreview.declineTime) <= 2) {
            triviabot.sendMessage(src, "Please wait before declining a question", channel);
            return;
        }
        var id = Object.keys(tr).sort(function (a, b) {
            return a - b;
        })[0];
        var q = trivreview.get(id);
        for (var i = 0; i < trivData.editMessageFlags.length; i++) {
            if (q.question === trivData.editMessageFlags[i]) {
                trivData.editMessageFlags.splice(i, 1);
                saveData();
            }
        }
        triviabot.sendAll(sys.name(src) + " declined question: category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, revchan);
        trivreview.declineTime = time();
        trivreview.remove(id);
        trivreview.checkq(id + 1);
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Allows you to decline the current question in review.");

addAdminCommand(["equivalentans","ea"], function (src, commandData, channel) {
    if (commandData === ""){
        for (var i in trivData.equivalentAns) {
           Trivia.sendPM(src, i + ": " + trivData.equivalentAns[i], channel);
        }
    } else {
        commandData = commandData.toLowerCase();
        if (trivData.equivalentAns.hasOwnProperty(commandData)){
            Trivia.sendPM(src, commandData + ": " + trivData.equivalentAns[commandData], channel);
        } else {
            Trivia.sendPM(src, commandData + " has no synonyms.");
        }
    }
    return;
}, "View synonyms of answers.");

addAdminCommand(["extanswers"], function (src, commandData, channel) {
    if (commandData === undefined) {
        Trivia.sendPM(src, "Please enter a valid question ID.", channel);
        return;
    }
    var i, q, count = 0, linkUsed = false;
    if (commandData.indexOf(":") !== -1) {
        commandData = commandData.split(":");
        i = parseInt(commandData[1]);
        linkUsed = true;
    }
    if (!commandData.length || linkUsed) {
        Trivia.sendPM(src, "The questions with extended answer times are: ", channel);
        if (!commandData.length) { i = 0; }
        for (i; i < trivData.extAnswers.length; i++) {
            if (count >= 50) {
                Trivia.sendPM(src, "List contains more than 50 questions.", channel);
                triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//extanswers filler:" + i + "\">Show more questions</a></b>", channel);
                break;
            }
            count++;
            q = triviaq.get(trivData.extAnswers[i]);
            if (q !== null) {
                Trivia.sendPM(src, parseInt(i + 1) + ". question id: " + trivData.extAnswers[i] + ", category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, channel);
            } else {
                trivData.extAnswers.splice(i, 1); //If somehow this question doesn't exist anymore and is still in the list, delete it from the list.
                saveData();
            }
        }
        return;
    }
    q = triviaq.get(commandData);
    if (q !== null) {
        for (var j = 0; j < trivData.extAnswers.length; j++) {
            if (commandData === trivData.extAnswers[j]) {
                Trivia.sendPM(src, "Question ID: '" + commandData + "' already has a longer answer time.", channel);
                return;
            }
        }
        trivData.extAnswers.push(commandData);
        saveData();
        triviabot.sendAll(sys.name(src) + " added question id: " + commandData + ", category: " + q.category + ", question: " + q.question + ", answer: " + q.answer + " to the extended answers list.", revchan);
    } else {
        Trivia.sendPM(src, "Your input: '" + commandData + "' is not a valid question id.", channel);
    }
}, "Use to add questions (by ID number) to the list of questions that should have a longer answer time when asked.");

addAdminCommand(["removeextanswers"], function (src, commandData, channel) {
    if (!commandData.length || commandData === undefined) {
        Trivia.sendPM(src, "Please enter a valid question ID.", channel);
        return;
    }
    var q = triviaq.get(commandData);
    if (q !== null) {
        for (var i = 0; i < trivData.extAnswers.length; i++) {
            if (commandData === trivData.extAnswers[i]) {
                trivData.extAnswers.splice(i, 1);
                saveData();
                triviabot.sendAll(sys.name(src) + " removed question: id " + commandData + ", category: " + q.category + ", question: " + q.question + ", answer: " + q.answer + " from the extended answers list.", revchan);
                break;
            }
        }
    } else {
        Trivia.sendPM(src, "Your input: '" + commandData + "' is not a valid question id.", channel);
    }
}, "Use to remove questions (by ID number) to the list of questions that should have a longer answer time when asked.");

addAdminCommand(["updatelist"], function (src, commandData, channel) {
    if (commandData.length === 0 && trivData.updateList.length === 0) {
        Trivia.sendPM(src, "There are no questions listed.", channel);
        return;
    }
    var b, q, output = [], index = 0;
    if (!isNaN(commandData) && commandData.length !== 0) {
        index = parseInt(commandData);
    }
    if (commandData.length === 0 || !isNaN(commandData)) {
        for (var i = 0; i < trivData.updateList.length; i++) {
            b = trivData.updateList[i];
            q = triviaq.get(b);
            try {
                output.push("Question: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + b + "')");
            }
            catch (e) {
                trivData.updateList.splice(i, 1);
                saveData();
                triviabot.sendAll("Warning: Question number " + b + " was removed from the updateList because it could not be found.", revchan);
            }
        }
        var x = 0;
        while (index < output.length && x !== 50) {
            Trivia.sendPM(src, output[index], channel);
            index++;
            x += 1;
        }
        if (x === 50 && index < output.length) {
            Trivia.sendPM(src, "Over 50 questions were found.", channel);
            triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//updatelist " + index + "\">Show more questions</a></b>", channel);
        }
        return;
    }
    var format = "The correct usage is /updatelist or /updatelist add:[question ID] or /updatelist remove:[question ID].";
    if (commandData.indexOf(":") !== -1) {
        commandData = commandData.split(":");
        if (commandData[0] === "add" || commandData[0] === "remove") { var option = commandData[0]; }
        else {
            Trivia.sendPM(src, format, channel);
            return;
        }
        if (!isNaN(commandData[1])) { var qID = commandData[1]; }
        else {
            Trivia.sendPM(src, format, channel);
            return;
        }
        q = triviaq.get(qID);
        if (option === "add") {
            for (var k = 0; k < trivData.updateList.length; k++) {
                if (trivData.updateList[k] === qID) {
                    Trivia.sendPM(src, "Question number " + qID + " is already on the list of questions that need updating.", channel);
                    return;
                }
            }
            trivData.updateList.push(qID);
            saveData();
            Trivia.sendPM(src, "The following question was added to the list of questions that need updating:", channel);
            try {
            Trivia.sendPM(src, "Question: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + qID + "')", channel);
            }
            catch (e) {
                trivData.updateList.splice(trivData.updateList.indexOf(qID), 1);
                saveData();
                Trivia.sendPM(src, "Error: Question number " + qID + " was not added because it could not be found.", revchan);
            }
            return;
        } else { // for remove
            for (var j = 0; j < trivData.updateList.length; j++) {
                if (trivData.updateList[j] === qID) {
                    trivData.updateList.splice(j, 1);
                    saveData();
                    Trivia.sendPM(src, "The following question was removed from the list of questions that need updating:", channel);
                    Trivia.sendPM(src, "Question: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + qID + "')", channel);
                    return;
                }
            }
            Trivia.sendPM(src, "Question number " + qID + " could not be found in the list of questions that need updating.", channel);
        }
    } else { Trivia.sendPM(src, format, channel); }
}, "Lists questions that may require updating from time to time. Format is /updatelist to view the list; /updatelist add:qID to add a question to the list; /updatelist remove:qID to remove a question from the list.");

// Search and Statistical Commands

addAdminCommand(["apropos"], function (src, commandData, channel) {
    if (commandData === undefined) { return; }
    var search = commandData, index = 0;
    if (commandData.indexOf("*") !== -1) {
        commandData = commandData.split("*");
        search = commandData[0];
        if (!isNaN(commandData[1])) { index = commandData[1]; }
        else { index = 0; }
    }
    if (Trivia.playerPlaying(src) && Trivia.round) {
        var z1 = Trivia.roundQuestion;
        var z2 = (z1 > 0) ? triviaq.get(z1).question : z2 = "Mental Math";
        triviabot.sendAll("Warning: Player " + sys.name(src) + (trivData.eventFlag ? " tried to use" : " used") + " /apropos to search '" + search + (z2 !== "Mental Math" ? "' during the question '" + z2 + "' ": "' during a '" + z2 + "' question ") + "while playing #Trivia", sys.channelId("Victory Road"));
        triviabot.sendAll("Warning: Player " + sys.name(src) + (trivData.eventFlag ? " tried to use" : " used") + " /apropos to search '" + search + (z2 !== "Mental Math" ? "' during the question '" + z2 + "' ": "' during a '" + z2 + "' question ") + "while playing #Trivia", revchan);
        if (trivData.eventFlag) {
            Trivia.sendPM(src, "You cannot use /apropos during event games!", channel);
            return;
        }
    }
    triviabot.sendHtmlMessage(src, "<b>Matching questions with '" + search + "' are: </b>", channel);
    var all = triviaq.all(),
        b, q, output = [], answer;
    for (b in all) {
        q = triviaq.get(b);
        answer = String(q.answer);
        if (q.question.toLowerCase().indexOf(search.toLowerCase()) > -1 || answer.toLowerCase().indexOf(search.toLowerCase()) > -1) {
            output.push("Question: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + b + "')");
        }
    }
    all = trivreview.all();
    for (b in all) {
        q = trivreview.get(b);
        answer = String(q.answer);
        if (q.question.toLowerCase().indexOf(search.toLowerCase()) > -1 || answer.toLowerCase().indexOf(search.toLowerCase()) > -1) {
            output.push("Question under review: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "'");
        }
    }
    var x = 0;
    while (index < output.length && x !== 50) {
        Trivia.sendPM(src, output[index], channel);
        index++;
        x += 1;
    }
    if (x === 50 && index < output.length) {
        Trivia.sendPM(src, "Over 50 results were found for this query", channel);
        triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//apropos " + search + "*" + index + "\">Show more results</a></b>", channel);
    }

}, "Allows you to search through the questions. Format is /apropos [query]. Matches incomplete parts of words.");

addAdminCommand(["search"], function (src, commandData, channel) {
    if (commandData === undefined) { return; }
    var search = commandData, index = 0;
    if (commandData.indexOf("*") !== -1) {
        commandData = commandData.split("*");
        search = commandData[0];
        if (!isNaN(commandData[1])) { index = commandData[1]; }
        else { index = 0; }
    }
    if (Trivia.playerPlaying(src) && Trivia.round) {
        var z1 = Trivia.roundQuestion;
        var z2 = (z1 > 0) ? triviaq.get(z1).question : z2 = "Mental Math";
        triviabot.sendAll("Warning: Player " + sys.name(src) + (trivData.eventFlag ? " tried to use" : " used") + " /search to search '" + search + (z2 !== "Mental Math" ? "' during the question '" + z2 + "' ": "' during a '" + z2 + "' question ") + "while playing #Trivia", sys.channelId("Victory Road"));
        triviabot.sendAll("Warning: Player " + sys.name(src) + (trivData.eventFlag ? " tried to use" : " used") + " /search to search '" + search + (z2 !== "Mental Math" ? "' during the question '" + z2 + "' ": "' during a '" + z2 + "' question ") + "while playing #Trivia", revchan);
        if (trivData.eventFlag) {
            Trivia.sendPM(src, "You cannot use /search during event games!", channel);
            return;
        }
    }
    triviabot.sendHtmlMessage(src, "<b>Matching questions with '" + search + "' are: </b>", channel);
    var all = triviaq.all(),
        b, q, output = [];
    var re = new RegExp("\\b" + search + "\\b", "i");
    var answer;
    for (b in all) {
        q = triviaq.get(b);
        answer = String(q.answer);
        if (re.test(q.question) || re.test(answer)) {
            output.push("Question: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + b + "')");
        }
    }
    all = trivreview.all();
    for (b in all) {
        q = trivreview.get(b);
        answer = String(q.answer);
        if (re.test(q.question) || re.test(answer)) {
            output.push("Question under review: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "'");
        }
    }
    var x = 0;
    while (index < output.length && x !== 50) {
        Trivia.sendPM(src, output[index], channel);
        index++;
        x += 1;
    }
    if (x === 50 && index < output.length) {
        Trivia.sendPM(src, "Over 50 results were found for this query", channel);
        triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//search " + search + "*" + index + "\">Show more results</a></b>", channel);
    }

}, "Allows you to search through the questions. Format is /search [query]. Only matches whole words.");

addAdminCommand(["searchcount"], function (src, commandData, channel) {
    if (commandData === undefined) {
        return;
    }
    var count = 0;
    for (var x in triviaq.all()) {
        var q = triviaq.get(x);
        var answer = String(q.answer);
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase()) > -1 || answer.toLowerCase().indexOf(commandData.toLowerCase()) > -1) {
            count++;
        }
    }
    Trivia.sendPM(src, "There are " + count + " questions matching with '" + commandData + "'.", channel);
}, "Counts how many questions fit a /search query");

addAdminCommand(["askedqamount"], function (src, commandData, channel) {
    triviabot.sendMessage(src, "There are " + Object.keys(questionData.hash).length + " questions with logged answer data.", channel);
}, "Shows how many questions have their answer data logged.");

addAdminCommand(["mostasked"], function (src, commandData, channel) {
    var sortedQs = questionData.sortBy("asked");
    var count = (commandData) ? commandData : 30;
    triviabot.sendMessage(src, "Most asked questions:", channel);
    for (var i = 0; i < count && i < sortedQs.length; i++) {
        var q = sortedQs[i];
        triviabot.sendMessage(src, "ID: " + q[0] + ". Times asked: " + q[1] + ". Answered: " + q[2] + ". Answered correctly: " + q[3] + ".", channel);
    }
}, "Lists the N most asked questions. Format is /mostasked N. The default value for N is 30.");

addAdminCommand(["leastasked"], function (src, commandData, channel) {
    var sortedQs = questionData.sortBy("asked");
    var count = (commandData) ? commandData : 30;
    triviabot.sendMessage(src, "Least asked questions:", channel);
    for (var i = 0; i < count && i < sortedQs.length; i++) {
        var q = sortedQs[sortedQs.length - 1 - i];
        triviabot.sendMessage(src, "ID: " + q[0] + ". Times asked: " + q[1] + ". Answered: " + q[2] + ". Answered correctly: " + q[3] + ".", channel);
    }
}, "Lists the N least asked questions. Format is /leastasked N. The default value for N is 30.");

addAdminCommand(["mostanswered"], function (src, commandData, channel) {
    var sortedQs = questionData.sortBy("answered");
    var count = (commandData) ? commandData : 30;
    triviabot.sendMessage(src, "Questions answered correctly the most:", channel);
    for (var i = 0; i < count && i < sortedQs.length; i++) {
        var q = sortedQs[i];
        triviabot.sendMessage(src, "ID: " + q[0] + ". Times asked: " + q[1] + ". Answered: " + q[2] + ". Answered correctly: " + q[3] + ".", channel);
    }
}, "Lists the N questions answered correctly the most. Format is /mostanswered N. The default value for N is 30.");

addAdminCommand(["leastanswered"], function (src, commandData, channel) {
    var sortedQs = questionData.sortBy("leastanswered");
    var count = 30, minTimesAsked = 0;
    if (commandData.indexOf(":") === -1) {
        count = (commandData) ? commandData : 30;
    } else {
        commandData = commandData.split(":");
        count = (commandData[0]) ? commandData[0] : 30;
        minTimesAsked = (commandData[1]) ? commandData[1] : 30;
    }
    triviabot.sendMessage(src, "Questions answered correctly the least:", channel);
    for (var i = 0; i < count && i < sortedQs.length; i++) {
        var q = sortedQs[sortedQs.length - 1 - i];
        if (q[1] < minTimesAsked) { continue; }
        triviabot.sendMessage(src, "ID: " + q[0] + ". Times asked: " + q[1] + ". Answered: " + q[2] + ". Answered correctly: " + q[3] + ".", channel);
    }
}, "Lists the N questions answered correctly the least. Format is /leastanswered N. The default value for N is 30. Additionally, an extra input can be added to set the min # of times a question has been asked such as /leastanswered 30:30.");

addAdminCommand(["eventstats"], function (src, commandData, channel) {
    var stats = eventStats.loadEventStats();
    if (stats === "No Stats.") {
        triviabot.sendMessage(src, "There are no stats recorded yet.", channel);
        return;
    } else {
        var gameMode = "";
        var bookMark = 0;
        if (commandData.length > 0) {
            if (commandData.indexOf(":") === -1) {
                if (isNaN(commandData)) {
                    gameMode = commandData;
                    if (gameMode === "know") { commandData = gameMode = "knowledge"; }
                    if (gameMode === "elim") { commandData = gameMode = "elimination"; }
                } else {
                    bookMark = commandData;
                }
            } else {
                commandData = commandData.split(":");
                if (commandData[0] === "know") { commandData[0] = gameMode = "knowledge"; }
                if (commandData[0] === "elim") { commandData[0] = gameMode = "elimination"; }
                gameMode = commandData[0];
                if (isNaN(commandData[1])) {
                    triviabot.sendMessage(src, "The book mark must be a number.", channel);
                    return;
                }
                bookMark = commandData[1];
            }
        }
        if (gameMode !== "knowledge" && gameMode !== "speed" && gameMode !== "elimination" && gameMode !== "" && commandData.length !== 0) {
            triviabot.sendMessage(src, "Please enter a valid game type.", channel);
            return;
        }
        sys.sendMessage(src, "***Event Stats***", channel);
        var i = 0;
        var j = 0;
        var x = 1;
        var z = "";
        if (!commandData.length) {
            j = 0;
        } else if (commandData === bookMark) {
            j = parseInt(bookMark);
        } else if (commandData === gameMode) {
            j = 0;
            z = gameMode;
        } else {
            j = parseInt(bookMark);
            z = gameMode;
        }
            for (i = j; i < stats.length; i++) {
                if (x > 5) { break; }
                if (z !== stats[i].gameType && z !== "") { continue; }
                x++;
                if (stats[i].totalServerPlayers === undefined) { stats[i].totalServerPlayers = "No data recorded."; }
                if (stats[i].totalTriviaPlayers === undefined) { stats[i].totalTriviaPlayers = "No data recorded."; }
                sys.sendHtmlMessage(src, "<font color='#3daa68'><b>Event Index: </b></font>" + i + "<br><font color='#3daa68'><b>Type: </b></font>" + stats[i].gameType + "<br><font color='#3daa68'><b>Goal: </b></font>" + stats[i].goal + "<br><font color='#3daa68'><b>Time Since Played: </b></font>" + getTimeString((sys.time() - stats[i].lastGame)) + "<br><font color='#3daa68'><b>Time Started: </b></font>" + stats[i].lastGameTime + "<br><font color='#3daa68'><b>Players: </b></font>" + stats[i].players + "<br><font color='#3daa68'><b>Rounds: </b></font>" + stats[i].rounds + "<br><font color='#3daa68'><b>Duration: </b></font>" + (isNaN(stats[i].duration) ? stats[i].duration : getTimeString(stats[i].duration)) + "<br><font color='#3daa68'><b>Server Players Online: </b></font>" + stats[i].totalServerPlayers + "<br><font color='#3daa68'><b>Players in Trivia Channel: </b></font>" + stats[i].totalTriviaPlayers, channel);
                if (stats[i].gameType !== 'elimination') {
                    sys.sendHtmlMessage(src, "<font color='#3daa68'><b>Score Board: </b></font>" + stats[i].scoreBoard.join(", "), channel);
                    sys.sendHtmlMessage(src, "<font color='#3daa68'><b>First Player past Goal: </b></font>" + stats[i].firstGoalR + ", <font color='#3daa68'><b>Second Player past Goal: </b></font>" + stats[i].secondGoalR + ", <font color='#3daa68'><b>Third Player past Goal: </b></font>" + stats[i].thirdGoalR, channel);
                } else {
                    if (stats[i].noWinners) {
                        sys.sendHtmlMessage(src, "<font color='red'><b>Everyone Lost!</b></font>", channel);
                    } else {
                        sys.sendHtmlMessage(src, "<font color='#3daa68'><b>Participants: </b></font>" + stats[i].participants.join(", "), channel);
                        sys.sendHtmlMessage(src, "<font color='#3daa68'><b>Winner: </b></font>" + stats[i].participants[0], channel);
                    }
                }
                sys.sendMessage(src, "", channel);
            }
            if ((!commandData.length || commandData === bookMark) && i < stats.length) {
                triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//eventstats " + i + "\">Show next page</a></b>", channel);
                return;
            }
            if ((commandData === gameMode || z === gameMode) && i < stats.length) {
                triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//eventstats " + gameMode + ":" + i + "\">Show next page</a></b>", channel);
            }
    }
}, "For viewing event statistics. Format is /eventstats, /eventstats [gameType], /eventstats [eventIndex], or /eventstats [gameType]:[eventIndex].");

addAdminCommand(["averageeventstats"], function (src, commandData, channel) {
    var stats = eventStats.loadEventStats();
    if (stats === "No Stats.") {
        triviabot.sendMessage(src, "There are no stats recorded yet.", channel);
        return;
    } else {
        var avgKnowGoalT = 0, avgKnowPlayersT = 0, avgKnowRoundsT = 0, avgKnowDurationT = 0,
                avgKnow1stRoundsT = 0, avgKnow2ndRoundsT = 0, avgKnow3rdRoundsT = 0,
                knowCount = 0, know2ndCount = 0, know3rdCount = 0, knowDurationCount = 0;

        var avgSpeedGoalT = 0, avgSpeedPlayersT = 0, avgSpeedRoundsT = 0, avgSpeedDurationT = 0,
                avgSpeed1stRoundsT = 0, avgSpeed2ndRoundsT = 0, avgSpeed3rdRoundsT = 0,
                speedCount = 0, speed2ndCount = 0, speed3rdCount = 0, speedDurationCount = 0;

        var avgElimGoalT = 0, avgElimPlayersT = 0, avgElimRoundsT = 0, avgElimDurationT = 0,
                elimCount = 0, noWinnersCount = 0, elimDurationCount = 0;

        var avgServerPlayersT = 0, avgChannelPlayersT = 0, serverPlayerCount = 0, channelPlayerCount = 0;

        var justRound = "";

        for (var i = 0; i < stats.length; i++) {
            if (stats[i].totalServerPlayers !== undefined && !isNaN(stats[i].totalServerPlayers)) {
                avgServerPlayersT += stats[i].totalServerPlayers;
                serverPlayerCount++;
            }
            if (stats[i].totalTriviaPlayers !== undefined && !isNaN(stats[i].totalServerPlayers)) {
                avgChannelPlayersT += stats[i].totalTriviaPlayers;
                channelPlayerCount++;
            }
            if (stats[i].gameType === "knowledge") {
                avgKnowGoalT += parseInt(stats[i].goal);
                avgKnowPlayersT += stats[i].players;
                avgKnowRoundsT += stats[i].rounds;
                if (!isNaN(stats[i].duration)) {
                    avgKnowDurationT += stats[i].duration;
                    knowDurationCount++;
                }
                justRound = stats[i].firstGoalR; //This is a string in the form "Player, Round: #"
                justRound = justRound.split("Round: ");
                avgKnow1stRoundsT += parseInt(justRound[1]);
                if (stats[i].secondGoalR !== "N/A") {
                    justRound = stats[i].secondGoalR;
                    justRound = justRound.split("Round: ");
                    avgKnow2ndRoundsT += parseInt(justRound[1]);
                } else {
                    know2ndCount++;
                }
                if (stats[i].thirdGoalR !== "N/A") {
                    justRound = stats[i].thirdGoalR;
                    justRound = justRound.split("Round: ");
                    avgKnow3rdRoundsT += parseInt(justRound[1]);
                } else {
                    know3rdCount++;
                }
                knowCount++;
            } else if (stats[i].gameType === "speed") {
                avgSpeedGoalT += parseInt(stats[i].goal);
                avgSpeedPlayersT += stats[i].players;
                avgSpeedRoundsT += stats[i].rounds;
                if (!isNaN(stats[i].duration)) {
                    avgSpeedDurationT += stats[i].duration;
                    speedDurationCount++;
                }
                justRound = stats[i].firstGoalR;
                justRound = justRound.split("Round: ");
                avgSpeed1stRoundsT += parseInt(justRound[1]);
                if (stats[i].secondGoalR !== "N/A") {
                    justRound = stats[i].secondGoalR;
                    justRound = justRound.split("Round: ");
                    avgSpeed2ndRoundsT += parseInt(justRound[1]);
                } else {
                    speed2ndCount++;
                }
                if (stats[i].thirdGoalR !== "N/A") {
                    justRound = stats[i].thirdGoalR;
                    justRound = justRound.split("Round: ");
                    avgSpeed3rdRoundsT += parseInt(justRound[1]);
                } else {
                    speed3rdCount++;
                }
                speedCount++;
            } else {
                avgElimGoalT += parseInt(stats[i].goal);
                if (stats[i].noWinners) {
                    noWinnersCount++;
                } else {
                    avgElimPlayersT += stats[i].players;
                }
                avgElimRoundsT += stats[i].rounds;
                if (!isNaN(stats[i].duration)) {
                    avgElimDurationT += stats[i].duration;
                    elimDurationCount++;
                }
                elimCount++;
            }
        }
        sys.sendMessage(src, "***Average Event Stats***", channel);
        if (serverPlayerCount !== 0) {
            sys.sendHtmlMessage(src, "<font color='#3daa68'><b><u>Players Online</u>", channel);
            var avgServerPlayers = avgServerPlayersT / serverPlayerCount;
            sys.sendHtmlMessage(src, "<font color='#3daa68'><b>Server Players Online: </b></font>" + avgServerPlayers.toFixed(2), channel);
        }
        if (channelPlayerCount !== 0) {
            if (!serverPlayerCount) { sys.sendHtmlMessage(src, "<font color='#3daa68'><b><u>Players Online</u>", channel); }
            var avgChannelPlayers = avgChannelPlayersT / channelPlayerCount;
            sys.sendHtmlMessage(src, "<font color='#3daa68'><b>Players in Trivia Channel: </b></font>" + avgChannelPlayers.toFixed(2), channel);
        }
        if (knowCount !== 0) {
            var avgKnowGoal = avgKnowGoalT / knowCount;
            var avgKnowPlayers = avgKnowPlayersT / knowCount;
            var avgKnowRounds = avgKnowRoundsT / knowCount;
            var xKnow = (!knowDurationCount ? 0 : avgKnowDurationT / knowDurationCount);
            var avgKnowDuration = (xKnow === 0 ? "Not enough data." : getTimeString(parseInt(xKnow)));
            var avgKnow1stRounds = avgKnow1stRoundsT / knowCount;
            var avgKnow2ndRounds = "N/A";
            var avgKnow3rdRounds = "N/A";
            if ((knowCount - know2ndCount) !== 0) { avgKnow2ndRounds = avgKnow2ndRoundsT / (knowCount - know2ndCount); }
            if ((knowCount - know3rdCount) !== 0) { avgKnow3rdRounds = avgKnow3rdRoundsT / (knowCount - know3rdCount); }
            sys.sendHtmlMessage(src, "<br><font color='#3daa68'><b><u>Knowledge Events</u><br>Goal: </b></font>" + avgKnowGoal.toFixed(2) + "<br><font color='#3daa68'><b>Players: </b></font>" + avgKnowPlayers.toFixed(2) + "<br><font color='#3daa68'><b>Number of Rounds: </b></font>" + avgKnowRounds.toFixed(2) + "<br><font color='#3daa68'><b>Duration: </b></font>" + avgKnowDuration + "<br><font color='#3daa68'><b>Round 1st Player Reached Goal: </b></font>" + avgKnow1stRounds.toFixed(2) + "<br><font color='#3daa68'><b>Round 2nd Player Reached Goal: </b></font>" + (isNaN(avgKnow2ndRounds) ? avgKnow2ndRounds : avgKnow2ndRounds.toFixed(2)) + "<br><font color='#3daa68'><b>Round 3rd Player Reached Goal: </b></font>" + (isNaN(avgKnow3rdRounds) ? avgKnow3rdRounds : avgKnow3rdRounds.toFixed(2)) + "<br>", channel);
        }
        if (speedCount !== 0) {
            var avgSpeedGoal = avgSpeedGoalT / speedCount;
            var avgSpeedPlayers = avgSpeedPlayersT / speedCount;
            var avgSpeedRounds = avgSpeedRoundsT / speedCount;
            var xSpeed = (!speedDurationCount ? 0 : avgSpeedDurationT / speedDurationCount);
            var avgSpeedDuration = (xSpeed === 0 ? "Not enough data." : getTimeString(parseInt(xSpeed)));
            var avgSpeed1stRounds = avgSpeed1stRoundsT / speedCount;
            var avgSpeed2ndRounds = "N/A";
            var avgSpeed3rdRounds = "N/A";
            if ((speedCount - speed2ndCount) !== 0) { avgSpeed2ndRounds = avgSpeed2ndRoundsT / (speedCount - speed2ndCount); }
            if ((speedCount - speed3rdCount) !== 0) { avgSpeed3rdRounds = avgSpeed3rdRoundsT / (speedCount - speed3rdCount); }
            sys.sendHtmlMessage(src, "<font color='#3daa68'><b><u>Speed Events</u><br>Goal: </b></font>" + avgSpeedGoal.toFixed(2) + "<br><font color='#3daa68'><b>Players: </b></font>" + avgSpeedPlayers.toFixed(2) + "<br><font color='#3daa68'><b>Number of Rounds: </b></font>" + avgSpeedRounds.toFixed(2) + "<br><font color='#3daa68'><b>Duration: </b></font>" + avgSpeedDuration + "<br><font color='#3daa68'><b>Round 1st Player Reached Goal: </b></font>" + avgSpeed1stRounds.toFixed(2) + "<br><font color='#3daa68'><b>Round 2nd Player Reached Goal: </b></font>" + (isNaN(avgSpeed2ndRounds) ? avgSpeed2ndRounds : avgSpeed2ndRounds.toFixed(2)) + "<br><font color='#3daa68'><b>Round 3rd Player Reached Goal: </b></font>" + (isNaN(avgSpeed3rdRounds) ? avgSpeed3rdRounds : avgSpeed3rdRounds.toFixed(2)) + "<br>", channel);
        }
        if (elimCount !== 0) {
            var avgElimGoal = avgElimGoalT / elimCount;
            var avgElimPlayers = "No player data because no games were won.";
            if ((elimCount - noWinnersCount) !== 0) { avgElimPlayers = avgElimPlayersT / (elimCount - noWinnersCount); }
            var avgElimRounds = avgElimRoundsT / elimCount;
            var xElim = (!elimDurationCount ? 0 : avgElimDurationT / elimDurationCount);
            var avgElimDuration = (xElim === 0 ? "Not enough data." : getTimeString(parseInt(xElim)));
            sys.sendHtmlMessage(src, "<font color='#3daa68'><b><u>Elimination Events</u><br>Goal: </b></font>" + avgElimGoal.toFixed(2) + "<br><font color='#3daa68'><b>Players: </b></font>" + (isNaN(avgElimPlayers) ? avgElimPlayers : avgElimPlayers.toFixed(2)) + "<br><font color='#3daa68'><b>Number of Rounds: </b></font>" + avgElimRounds.toFixed(2) + "<br><font color='#3daa68'><b>Duration: </b></font>" + avgElimDuration + "<br>", channel);
        }
    }
}, "Displays event stat averages.");

// Category Commands

addAdminCommand(["setvotecooldown"], function (src, commandData, channel) {
    if (commandData.length === 0 || isNaN(commandData)){
        triviabot.sendMessage(src, trivData.votingCooldown + " rounds is the current vote cooldown", channel);
    } else {
        trivData.votingCooldown = commandData;
        Trivia.sendAll(trivData.votingCooldown + " rounds is the new vote cooldown", revchan);
    }
}, "Set the number of rounds between each vote.");

addAdminCommand(["enablevoting"], function (src, commandData, channel) {
    Trivia.voting = true;
    triviabot.sendAll("Voting for category games is enabled!", revchan);
}, "Enable voting for category games.");

addAdminCommand(["disablevoting"], function (src, commandData, channel) {
    Trivia.voting = false;
    triviabot.sendAll("Voting for category games is disabled!", revchan);
}, "Disable voting for category games.");

addAdminCommand(["searchcategory"], function (src, commandData, channel) {
    if (commandData === undefined) { return; }
    var search = commandData, index = 0;
    if (commandData.indexOf("*") !== -1) {
        commandData = commandData.split("*");
        search = commandData[0];
        if (!isNaN(commandData[1])) { index = commandData[1]; }
        else { index = 0; }
    }
    if (Trivia.playerPlaying(src) && Trivia.round) {
        var z1 = Trivia.roundQuestion;
        var z2 = (z1 > 0) ? triviaq.get(z1).question : z2 = "Mental Math";
        triviabot.sendAll("Warning: Player " + sys.name(src) + (trivData.eventFlag ? " tried to use" : " used") + " /searchcategory to search the category: '" + search + (z2 !== "Mental Math" ? "' during the question '" + z2 + "' ": "' during a '" + z2 + "' question ") + "while playing #Trivia", sys.channelId("Victory Road"));
        triviabot.sendAll("Warning: Player " + sys.name(src) + (trivData.eventFlag ? " tried to use" : " used") + " /searchcategory to search the category: '" + search + (z2 !== "Mental Math" ? "' during the question '" + z2 + "' ": "' during a '" + z2 + "' question ") + "while playing #Trivia", revchan);
        if (trivData.eventFlag) {
            Trivia.sendPM(src, "You cannot use /searchcategory during event games!", channel);
            return;
        }
    }
    Trivia.sendPM(src, "Questions in " + search + " category are:", channel);
    var count = 0;
    for (var i in triviaq.all()) {
        var q = triviaq.get(i);
        if (search.toLowerCase() === q.category.toLowerCase() && parseInt(i) > index) {
            Trivia.sendPM(src, "Question: '" + q.question + "' Answer: '" + q.answer + "' (id='" + i + "')", channel);
            count++;
            if (count === 50) { //maybe add a configurable value in the future
                index = i;
                Trivia.sendPM(src, "Over 50 results were found for this query", channel);
                triviabot.sendHtmlMessage(src, "<b><a href=\"po:send//searchcategory " + search + "*" + index + "\">Show more results</a></b>", channel);
                break;
            }
        }
    }
}, "Lists every question in the specified category.");

addAdminCommand(["categorycount"], function (src, commandData, channel) {
    if (commandData === undefined)
        return;
    var all = triviaq.all(),
        b, q;
    var count = 0;
    for (b in all) {
        q = triviaq.get(b);
        if (q.category.toLowerCase() == commandData.toLowerCase())
            count += 1;
    }
    Trivia.sendPM(src, "There are " + count + " questions with the category " + commandData + ".", channel);
}, "Shows how many questions are in a specified category.");

addAdminCommand(["listc"], function (src, commandData, channel) {
    var categories = orderedCategories();
    Trivia.sendPM(src, "All currently used categories:", channel);
    for (var x = 0; x < categories.length; x++) {
        var object = categories[x];
        Trivia.sendPM(src, object.category + " - " + object.count + " questions.", channel);
    }
}, "Lists every category currently used and the amount of questions in each.");

addAdminCommand(["blockcats"], function (src, commandData, channel) {
    sys.sendMessage(src, "", channel);
    Trivia.sendPM(src, "Block Categories: ", channel);
    var j = 0;
    for (var i = 0; i < trivData.blockCats.length; i++) {
        j = i + 1;
        Trivia.sendPM(src, j + ". " + trivData.blockCats[i].name + " (" + trivData.blockCats[i].cats.join(", ") + ").", channel);
    }
    sys.sendMessage(src, "", channel);
}, "Displays the block categories and the categories of which they consist.");

addAdminCommand(["addblockcats"], function (src, commandData, channel) {
    if (!commandData.length || commandData === undefined || commandData.indexOf("*") === -1 || commandData.indexOf(",") === -1) {
        Trivia.sendPM(src, "The correct usage is /addblockcats name*category1,category2,category3,etc.", channel);
        return;
    }
    commandData = commandData.split("*");
    if (commandData.length !== 2) {
        Trivia.sendPM(src, "The correct usage is /addblockcats name*category1,category2,category3,etc.", channel);
        return;
    }
    var categories = commandData[1].split(",");
    var validCats = orderedCategories();
    var c, valid = false;
    for (var j = 0; j < categories.length; j++) {
        for (var i = 0; i < validCats.length; i++) {
            c = validCats[i];
            if (c.category.toLowerCase() === categories[j].toLowerCase() || categories[j].toLowerCase() === "mental math") {
                valid = true;
                break;
            }
        }
        if (!valid) {
            Trivia.sendPM(src, "The category '" + categories[j] + "' does not exist.", channel);
            return;
        }
        valid = false;
    }
    var newBlockCat = {'name' : commandData[0].toLowerCase(), 'cats' : categories};
    Trivia.sendAll(sys.name(src) + " added the block category '" + commandData[0] + "' which consists of the categories (" + categories.join(", ") + ").", revchan);
    trivData.blockCats.push(newBlockCat);
    saveData();
}, "Adds a new block category. Format is /addblockcats name*category1,category2,category3,etc.");

addAdminCommand(["removeblockcats"], function (src, commandData, channel) {
    if (!commandData.length || commandData === undefined) {
        Trivia.sendPM(src, "Please enter a valid block category.", channel);
        return;
    }
    for (var i in trivData.blockCats) {
        if (trivData.blockCats[i].name === commandData) {
            Trivia.sendAll(sys.name(src) + " deleted the block category '" + commandData + "'.", revchan);
            trivData.blockCats.splice(i, 1);
            saveData();
            return;
        }
    }
    Trivia.sendPM(src, "'" + commandData + "' is not a valid block category.", channel);
}, "Deletes a block category.");

addAdminCommand(["hiddencats"], function (src, commandData, channel) {
    triviabot.sendMessage(src, "Hidden categories are: " + trivData.hiddenCategories.join(", "), channel);
}, "Displays hidden categories.");

addAdminCommand(["setspecialchance"], function (src, commandData, channel) {
    if (!isNaN(commandData)) {
        trivData.specialChance = parseInt(commandData);
        saveData();
        triviabot.sendMessage(src, "Special chance set to " + commandData, channel);
    }
}, "Allows you to modify the chance of special categories appearing.");

addAdminCommand(["equivalentcats"], function (src, commandData, channel) {
    var sortingArray = [];
    for (var i in trivData.equivalentCats) {
        sortingArray.push([i, trivData.equivalentCats[i]]);
    }
    sortingArray.sort(function(a, b) {return (a[1] > b[1] || (a[1] === b[1] && a[0] > b[0]) ? 1 : -1);});
    var table = "<table border = 1 cellpadding = 5 cellspacing = 0><tr><th>Category</th><th>Acts like</th><th>Category</th><th>Acts like</th><th>Category</th><th>Acts like</th></tr>";
    for (var x = 0; x < Math.ceil(sortingArray.length / 3); x++) {
        table += "<tr>";
        for (var y = 0; y < 3; y++) {
            if (sortingArray[3*x+y]) {
                table += "<td>" + sortingArray[3*x+y][0] + "</td><td>" + sortingArray[3*x+y][1] + "</td>";
            }
        }
        table += "</tr>";
    }
    table += "</table>";
    sys.sendHtmlMessage(src, table, channel);
    return;
}, "View what categories act as synonyms for category games and submissions.");

addOwnerCommand(["cleareventstats"], function (src, commandData, channel) {
    eventStats.reset();
    triviabot.sendMessage(src, "The event stats were cleared.", channel);
}, "Clears all data from the event stats.");

addOwnerCommand(["eventstart"], function (src, commandData) {
    if (!Trivia.started) {
        trivData.eventFlag = true;
        manualEventFlag = true;
        manualEventTime = sys.time();
        manualEventTimeStamp = getStatsTimeStamp();
        lastEventType = "knowledge";
    }
    Trivia.startTrivia(src, commandData, "knowledge");
}, "Allows you to start an Event trivia game, format /start [number][:difficulty][*category1][*category2][...]. Leave number blank for random. Difficulties are easy, intermediate (int for short), and hard (leave blank to include all difficulty levels).");

/*** OWNER COMMANDS ***/

addOwnerCommand(["eventspeed"], function (src, commandData) {
    if (!Trivia.started) {
        trivData.eventFlag = true;
        manualEventFlag = true;
        manualEventTime = sys.time();
        manualEventTimeStamp = getStatsTimeStamp();
        lastEventType = "speed";
    }
    Trivia.startTrivia(src, commandData, "speed");
}, "Allows you to start an event speed trivia game. Format is /speed [number][:difficulty][*category1][*category2][...]. Leave number blank for random. Difficulties are easy, intermediate (int for short), and hard (leave blank to include all difficulty levels).");

addOwnerCommand(["eventelimination", "eventelim"], function (src, commandData) {
    if (!Trivia.started) {
        trivData.eventFlag = true;
        manualEventFlag = true;
        manualEventTime = sys.time();
        manualEventTimeStamp = getStatsTimeStamp();
        lastEventType = "elimination";
    }
    Trivia.startTrivia(src, commandData, "elimination");
}, "Allows you to start an Event elimination game. Format is /elimination [number][:difficulty][*category1][*category2][...]. Leave number blank for random. Difficulties are easy, intermediate (int for short), and hard (leave blank to include all difficulty levels).");

addOwnerCommand(["setdefaulteventgoal"], function (src, commandData, channel) {
    if (commandData === undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: game type:new goal", channel);
        return;
    }
    commandData = commandData.split(":");
    var gameType = commandData[0],
        newGoal = commandData[1],
        goalCheck = parseInt(newGoal, 10);
    if (isNaN(goalCheck)) {
        Trivia.sendPM(src, "The goal must be a valid number.", channel);
        return;
    }
    if (goalCheck < 1 || goalCheck > 60) {
        Trivia.sendPM(src, "The goal must not be lower than 1 or higher than 60.", channel);
        return;
    }
    if (gameType.toLowerCase() === "know" || gameType.toLowerCase() === "knowledge"){
        defaultKnowEventGoal = newGoal;
        eventSets.updateEventSettings();
        triviabot.sendMessage(src, "The new default goal for event " + gameType + " games is " + newGoal, channel);
        return;
    }
    if (gameType.toLowerCase() === "speed"){
        defaultSpeedEventGoal = newGoal;
        eventSets.updateEventSettings();
        triviabot.sendMessage(src, "The new default goal for event " + gameType + " games is " + newGoal, channel);
        return;
    }
    if (gameType.toLowerCase() === "elimination" || gameType.toLowerCase() === "elim"){
        defaultElimEventGoal = newGoal;
        eventSets.updateEventSettings();
        triviabot.sendMessage(src, "The new default goal for event " + gameType + " games is " + newGoal, channel);
        return;
    }
    triviabot.sendMessage(src, "Valid game types are know, speed, and elim.", channel);
}, "Allows you adjust the default goals for events. Format is /setdefaulteventgoal gametype:newgoal(example /setdefaulteventgoal know:15)");

addOwnerCommand(["eventrates"], function (src, commandData, channel) {
    if (commandData.length === 0) {
        var elimRate = 100 - (eventKnowRate + eventSpeedRate);
        Trivia.sendPM(src, "Event Knowledge Rate: " + eventKnowRate + " %", channel);
        Trivia.sendPM(src, "Event Speed Rate: " + eventSpeedRate + " %", channel);
        Trivia.sendPM(src, "Event Elimination Rate: " + elimRate + " %", channel);
        return;
    }
    if (commandData === undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: know rate:speed rate", channel);
        return;
    }
    commandData = commandData.split(":");
    var knowRate = commandData[0],
        speedRate = commandData[1],
        knowRateCheck = parseInt(knowRate, 10),
        speedRateCheck = parseInt(speedRate, 10);
    if (isNaN(knowRateCheck) || isNaN(speedRateCheck)) {
        Trivia.sendPM(src, "The rate must be a valid number.", channel);
        return;
    }
    if (knowRateCheck < 0 || knowRateCheck > 100 || speedRateCheck < 0 || speedRateCheck > 100) {
        Trivia.sendPM(src, "The rate must not be lower than 0 or higher than 100.", channel);
        return;
    }
    eventKnowRate = knowRateCheck;
    eventSpeedRate = speedRateCheck;
    var elimRate = 100 - (eventKnowRate + eventSpeedRate);
    eventSets.updateEventSettings();
    Trivia.sendPM(src, "New Event Knowledge Rate: " + eventKnowRate + " %", channel);
    Trivia.sendPM(src, "New Event Speed Rate: " + eventSpeedRate + " %", channel);
    Trivia.sendPM(src, "New Event Elimination Rate: " + elimRate + " %", channel);
}, "Allows you to see or set the rates for the game types of events. The rate for elimination games will be the percent that remains. Format is /eventrates knowrate:speedrate.");

addOwnerCommand(["seteventcooldown"], function (src, commandData, channel) {
    if (commandData.length === 0) {
        Trivia.sendPM(src, getTimeString(trivData.eventCooldown) + " is the current event cooldown", channel);
        return;
    }
    var cooldown = getSeconds(commandData);
    if (isNaN(cooldown)) {
        Trivia.sendPM(src, "The correct usage is no arguments or something such as 3h 30m 45s");
        return;
    }
    trivData.eventCooldown = cooldown;
    Trivia.sendPM(src, getTimeString(trivData.eventCooldown) + " is the new event cooldown", channel);
    lastEventTime = sys.time(); //reset timer
    eventTimeChangeFlag = true;
    eventSets.updateEventSettings();
}, "Set or check the cooldown time between each event. Example: /seteventcooldown 3h 30m 45s");

addOwnerCommand(["enableevents"], function (src, commandData, channel) {
    eventModeOn = true;
    lastEventTime = sys.time(); // reset timer
    eventTimeChangeFlag = true;
    eventSets.updateEventSettings();
    Trivia.sendPM(src, "Event elimination games are enabled!", channel);
}, "Enables event games.");

addOwnerCommand(["disableevents"], function (src, commandData, channel) {
    eventModeOn = false;
    Trivia.sendPM(src, "Event elimination games are disabled!", channel);
}, "Disables event games.");

addOwnerCommand(["seteventelimsignup"], function (src, commandData, channel) {
    if (commandData.length === 0) {
        Trivia.sendPM(src, "The current signup duration is " + eventElimSignUp + " seconds.", channel);
        return;
    }
    if (isNaN(commandData)) {
        Trivia.sendPM(src, "Please enter a valid number.", channel);
        return;
    }
    if (commandData < 45 || commandData > 600) {
        Trivia.sendPM(src, "The duration must be at least 45 seconds and no more than 600 seconds.", channel);
        return;
    }
    eventElimSignUp = parseInt(commandData);
    eventSets.updateEventSettings();
    Trivia.sendPM(src, "The new signup duration is " + eventElimSignUp + " seconds.", channel);
}, "Set the signup duration for event elimination games. Using no command fields allows you to view the current duration.");

addOwnerCommand(["declinecatqs"], function (src, commandData, channel) {
    var counter = 0;
    for (var i in triviaq.all()) {
        var q = triviaq.get(i);
        if (commandData.toLowerCase() === q.category.toLowerCase()) {
            if (i === trivData.extAnswers[i]) {
                trivData.extAnswers.splice(i, 1);
                saveData();
            }
            triviaq.remove(i);
            questionData.remove(i);
            counter++;
        }
    }
    if (!counter) {
        triviabot.sendMessage(src, "The " + commandData + " category contains no questions to be deleted.", channel);
    } else {
        triviabot.sendMessage(src, "The questions (" + counter + " total) in the " + commandData + " category have been deleted.", channel);
    }
}, "Delete all of the questions for a given category.");

addOwnerCommand(["saybold"], function (src, commandData, channel) {
    if (commandData === "") {
        Trivia.sendPM(src, "Please enter a message.", channel);
        return;
    }
    triviabot.sendHtmlAll("(" + utilities.html_escape(sys.name(src)) + "): <b>" + utilities.html_escape(commandData) + "</b>", channel);
}, "Allows you to talk in bold during the answer period.");

addOwnerCommand(["triviaadmin", "striviaadmin"], function (src, commandData, channel, command) {
    if (!commandData) {
        return;
    }
    if (tadmin.isTAdmin(commandData)) {
        Trivia.sendPM(src, "That person is already a Trivia Admin.", channel);
        return;
    }
    tadmin.addTAdmin(commandData);
    if (command === "triviaadmin") {
        Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Trivia Admin.", triviachan);
    }
    Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Trivia Admin.", revchan);
    Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Trivia Admin.", sachannel);
}, "Allows you to promote a new Trivia Admin. Use /striviaadmin for a silent promotion.");

addOwnerCommand(["triviaadminoff", "striviaadminoff"], function (src, commandData, channel, command) {
    if (!commandData) {
        return;
    }
    if (!tadmin.isTAdmin(commandData) && !tsadmin.isTAdmin(commandData)) {
        Trivia.sendPM(src, "That person isn't a Trivia auth.", channel);
        return;
    }
    var isTA = tadmin.isTAdmin(commandData);
    var oldAuth = (isTA ? "Trivia Admin" : "Super Trivia Admin");
    if (isTA) {
        tadmin.removeTAdmin(commandData);
    }
    else {
        tsadmin.removeTAdmin(commandData);
    }
    if (command === "triviaadminoff") {
        Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from " + oldAuth + ".", triviachan);
    }
    Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from " + oldAuth + ".", revchan);
    Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from " + oldAuth + ".", sachannel);
}, "Allows you to demote a current Trivia Admin or Super Trivia Admin. Use /striviaadminoff for a silent demotion.");

/*addOwnerCommand(["makebackup"], function(src, commandData, channel) {
    commandData = commandData.split(":");
    var fileTrivia = commandData[0], fileTrivReview = commandData[1];
    if (fileTrivia == undefined || fileTrivReview == undefined) {
        fileTrivia = "backupQuestions.json", fileTrivReview = "backupReview.json";
    }
    if (fileTrivia.indexOf(".json") == -1 || fileTrivReview.indexOf(".json") == -1) {
        triviabot.sendMessage(src, 'Please add .json to make sure you are specifying a valid file.', channel);
        return;
    }
    sys.writeToFile(fileTrivia, JSON.stringify(triviaq.state));
    sys.writeToFile(fileTrivReview, JSON.stringify(trivreview.state));
    triviabot.sendMessage(src, "Backup made!", channel);
},"Makes a backup of current questions.");*/

addOwnerCommand(["updateafter"], function (src, commandData, channel) {
    triviabot.sendMessage(src, "Trivia will update after the game", channel);
//    Trivia.autostart = false;
    Trivia.needsUpdating = true;
    if (!Trivia.started) {
        runUpdate();
    }
    return;
}, "Updates Trivia after the current game is over.");

addOwnerCommand(["clearlb"], function (src, commandData, channel) {
    extLB.reset();
    triviabot.sendMessage(src, "The Trivia leaderboard was cleared.", channel);
}, "Clears all data from the leaderboard.");

addOwnerCommand(["clearlastlb"], function (src, commandData, channel) {
    extLastLB.reset();
    triviabot.sendMessage(src, "The Trivia leaderboard from last month was cleared.", channel);
}, "Clears all data from the leaderboard from the previous month.");

addOwnerCommand(["lbmin"], function (src, commandData, channel) {
    if (commandData.length === 0 || isNaN(commandData)){
        triviabot.sendMessage(src, extLB.minLB + " points are currently required for a game to count towards the leaderboard.", channel);
    } else {
        extLB.minLB = commandData;
        Trivia.sendAll("A minimum of " + commandData + " point(s) is now required for a knowledge game to count towards the leaderboard.",revchan);
    }
}, "Changes the minimum points needed for a knowledge-based game to count for the leaderboard. Format /lbmin #.");

addOwnerCommand(["lbspeedmin"], function (src, commandData, channel) {
    if (commandData.length === 0 || isNaN(commandData)){
        triviabot.sendMessage(src, extLB.minSpeedLB + " points are currently required for a speed trivia game to count towards the leaderboard.", channel);
    } else {
        extLB.minSpeedLB = commandData;
        Trivia.sendAll("A minimum of " + commandData + " point(s) is now required for a speed trivia game to count towards the leaderboard.",revchan);
    }
}, "Changes the minimum points needed for a speed-based game to count for the leaderboard. Format /lbspeedmin #.");

addOwnerCommand(["cleardata"], function (src, commandData, channel) {
    questionData.clear();
    triviabot.sendMessage(src, "Stored question data was cleared.", channel);
}, "Clears all stored question data");

addOwnerCommand(["addwordwarn"], function (src, commandData) {
    if (commandData === undefined) {
        triviabot.sendChanMessage(src, "Can't add warnings for blank words");
        return;
    }
    var regex;
    try {
        regex = new RegExp(commandData.toLowerCase()); // incase sensitive
    }
    catch (e) {
        triviabot.sendChanMessage(src, "Sorry, your regular expression '" + commandData + "' fails. (" + e + ")");
    }
    trivData.triviaWarnings.push(regex.source);
    saveData();
    triviabot.sendChanMessage(src, "You added a warning for: " + regex.source);
    return;
}, "Adds an answer warning to Trivia.");

addOwnerCommand(["removewordwarn"], function (src, commandData) {
    if (commandData === undefined) {
        triviabot.sendChanMessage(src, "Can't remove warnings for blank words");
        return;
    }
    if (trivData.triviaWarnings.indexOf(commandData) !== -1) {
        trivData.triviaWarnings.splice(trivData.triviaWarnings.indexOf(commandData), 1);
        saveData();
        triviabot.sendChanMessage(src, "You removed a warning for: " + commandData);
    }
    else {
        triviabot.sendChanMessage(src, commandData + " is not on the warning list");
    }
}, "Removes a warning from Trivia.");

addOwnerCommand(["addequivalentcat"], function (src, commandData, channel) {
   var data = commandData.split("*");
   if (data.length != 2) {
      triviabot.sendMessage(src, "Incorrect syntax! Format for this command is /addequivalentcat [category]*[category to change to].", channel);
      return;
   }
   if (data[0] === "" || data[1] === "") {
      triviabot.sendMessage(src, "Blank categories make little sense!", channel);
      return;
   }
   var toChange = data[0].toLowerCase();
   var changeTo = data[1];
   if (trivData.equivalentCats.hasOwnProperty(toChange)) {
      triviabot.sendMessage(src, data[0] + " is already a synonym for a category!", channel);
      return;
   }
   trivData.equivalentCats[toChange] = changeTo;
   saveData();
   triviabot.sendMessage(src, "Added " + toChange + " as a synonym for " + changeTo + ".", channel);
}, "Adds a pair of equivalent categories. Format is /addequivalentcat [category]*[category to change to].");

addOwnerCommand(["removeequivalentcat"], function (src, commandData, channel) {
   if (commandData === "") {
      triviabot.sendMessage(src, "Please specify a synonym to remove!", channel);
   }
   commandData = commandData.toLowerCase();
   if (!trivData.equivalentCats.hasOwnProperty(commandData)) {
      triviabot.sendMessage(src, commandData + " is not acting as a synonym for a category!", channel);
      return;
   }
   delete trivData.equivalentCats[commandData];
   saveData();
   triviabot.sendMessage(src, "You removed " + commandData + " from the list of synonyms.", channel);
}, "Removes a synonym for a category.");

addOwnerCommand(["addequivalentans","aea"], function (src, commandData, channel) {
   var data = commandData.split("*");
   if (data.length != 2) {
      triviabot.sendMessage(src, "Incorrect syntax! Format for this command is /addequivalentans [answer]*[answers to change to].", channel);
      return;
   }
   if (data[0] === "" || data[1] === "") {
      triviabot.sendMessage(src, "Blank answers make little sense!", channel);
      return;
   }
   var toChange = data[0].toLowerCase();
   var changeTo = data[1];
   trivData.equivalentAns[toChange] = changeTo;
   saveData();
   triviabot.sendMessage(src, "Added synonyms for " + toChange + ".", channel);
}, "Adds synonyms for an answer. Format is /addequivalentans answer*newanswer1,newanswer2,etc.");

addOwnerCommand(["removeequivalentans","rea"], function (src, commandData, channel) {
   if (commandData === "") {
      triviabot.sendMessage(src, "Please specify an answer's synonyms to remove!", channel);
   }
   commandData = commandData.toLowerCase();
   if (!trivData.equivalentAns.hasOwnProperty(commandData)) {
      triviabot.sendMessage(src, commandData + " has no synonyms.", channel);
      return;
   }
   delete trivData.equivalentAns[commandData];
   saveData();
   triviabot.sendMessage(src, "You deleted " + commandData + "'s synonyms.", channel);
}, "Removes synonyms for an answer.");

addOwnerCommand(["addhiddencat"], function (src, commandData, channel) {
    var cats = orderedCategories().map(function (x) { return x.category; });
    var i = cats.join("*").toLowerCase().split("*").indexOf(commandData.toLowerCase());
    if (i === -1) {
        triviabot.sendMessage(src, "Specify a valid category to hide.", channel);
    }
    else {
        trivData.hiddenCategories.push(cats[i]);
        saveData();
        triviabot.sendMessage(src, cats[i] + " was hidden.", channel);
    }
}, "Hide a category from showing (except in category games).");

addOwnerCommand(["removehiddencat"], function (src, commandData, channel) {
    var i = trivData.hiddenCategories.join("*").toLowerCase().split("*").indexOf(commandData.toLowerCase());
    if (i === -1) {
        triviabot.sendMessage(src, "Specify a valid category to unhide.", channel);
    }
    else {
        triviabot.sendMessage(src, trivData.hiddenCategories.splice(i, 1)[0] + " was unhidden.", channel);
        saveData();
    }
}, "Unhide a category.");

/*addOwnerCommand(["revertfrom"], function(src, commandData, channel) {
    commandData = commandData.split(":");
    var fileTrivia = commandData[0], fileTrivReview = commandData[1];
    if (fileTrivia == undefined || fileTrivReview == undefined) {
        fileTrivia = "backupQuestions.json", fileTrivReview = "backupReview.json";
    }
    var content1 = sys.getFileContent(fileTrivia), content2 = sys.getFileContent(fileTrivReview);
    if (content1 == undefined || content1 == '' || content2 == undefined || content2 == '') {
        triviabot.sendMessage(src, 'The content of either file is undefined or blank.', channel);
        return;
    }
    if (fileTrivia.indexOf(".json") == -1 || fileTrivReview.indexOf(".json") == -1) {
        triviabot.sendMessage(src, 'Please add .json to make sure you are specifying a valid file.', channel);
        return;
    }
    try {
        var parsed = JSON.parse(content1), parsed2 = JSON.parse(content2);
    } catch (e) {
        triviabot.sendMessage(src, "Couldn't revert: "+e, channel);
        return;
    }
    sys.writeToFile("triviaq.json", content1);
    triviaq.state = parsed;
    sys.writeToFile("trivreview.json", content2);
    trivreview.state = parsed2;
    triviabot.sendMessage(src, "Successfully reverted questions!", channel);
    return;
},"Revert questions.");*/

addOwnerCommand(["changeallc"], function (src, commandData, channel) {
    commandData = commandData.split("*");
    if (commandData.length != 2) {
        Trivia.sendPM(src, "Syntax error! This command's format is /changeallc oldcat*newcat", channel);
        return;
    }
    var changed = false;
    var oldCat = commandData[0].toLowerCase();
    var newCat = commandData[1];
    for (var i in triviaq.all()) {
        var c = triviaq.get(i).category.toLowerCase();
        if (c === oldCat) {
            changed = true;
            triviaq.changeCategory(i, newCat);
        }
    }
    if (!changed) {
        Trivia.sendPM(src, "No questions with that category were found! Try using /category first.", channel);
    }
    else {
        Trivia.sendAll("All questions under category " + oldCat + " were changed to the category " + newCat + "!", revchan);
    }
}, "Changes all questions from one category to another. Format is /changeallc oldcat*newcat.");

addOwnerCommand(["debugmode"], function (src, commandData, channel) {
    // May add more later as needed.
    if (commandData.length === 0) {
        debugMode = !debugMode;
        Trivia.sendPM(src, "Debug mode is " + (debugMode ? "on." : "off."), channel);
        return;
    }
    if (!debugMode) {
        Trivia.sendPM(src, "Please turn on debug mode before adjusting times.", channel);
        return;
    }
    commandData = commandData.split(":");
    var variable = commandData[0];
    var time = commandData[1];
    if (variable.toLowerCase() !== "between" && variable.toLowerCase() !== "answer") {
        Trivia.sendPM(src, "Valid variables are 'between' and 'answer'.", channel);
        return;
    }
    if (isNaN(time)) {
        Trivia.sendPM(src, "Please input the number of seconds.", channel);
        return;
    }
    if (variable === "between") {
        trivData.debugTime = time;
        Trivia.sendPM(src, "The time between rounds is now " + trivData.debugTime + " seconds for debug mode.", channel);
    } else {
        trivData.debugAnswerTime = time;
        Trivia.sendPM(src, "The answer time is now " + trivData.debugAnswerTime + " seconds for debug mode.", channel);
    }
    saveData();
}, "Use /debugmode to toggle on / off. Use /debugmode [variable]:[time] to set times in games. Variables are 'between' and 'answer' for the time between rounds and the answer time, respectively.")

/*** The following three commands are very expensive and cause too much server lag.
  Now that everything has a uniform format, these can be modified to only add new Pokemon in future generations.

addOwnerCommand(["createwtp"], function (src, commandData, channel) {
    var pokeList = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran-f", "Nidorina", "Nidoqueen", "Nidoran-m", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos", "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish", "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank", "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh", "Celebi", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Poochyena", "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Lotad", "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts", "Kirlia", "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", "Skitty", "Delcatty", "Sableye", "Mawile", "Aron", "Lairon", "Aggron", "Meditite", "Medicham", "Electrike", "Manectric", "Plusle", "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Numel", "Camerupt", "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava", "Flygon", "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose", "Seviper", "Lunatone", "Solrock", "Barboach", "Whiscash", "Corphish", "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Castform", "Kecleon", "Shuppet", "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol", "Wynaut", "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock", "Regice", "Registeel", "Latias", "Latios", "Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos", "Gastrodon", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Mismagius", "Honchkrow", "Glameow", "Purugly", "Chingling", "Stunky", "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mime Jr.", "Happiny", "Chatot", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Riolu", "Lucario", "Hippopotas", "Hippowdon", "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke", "Snover", "Abomasnow", "Weavile", "Magnezone", "Lickilicky", "Rhyperior", "Tangrowth", "Electivire", "Magmortar", "Togekiss", "Yanmega", "Leafeon", "Glaceon", "Gliscor", "Mamoswine", "Porygon-Z", "Gallade", "Probopass", "Dusknoir", "Froslass", "Rotom", "Uxie", "Mesprit", "Azelf", "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia", "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus", "Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar", "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog", "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard", "Pansage", "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Munna", "Musharna", "Pidove", "Tranquill", "Unfezant", "Blitzle", "Zebstrika", "Roggenrola", "Boldore", "Gigalith", "Woobat", "Swoobat", "Drilbur", "Excadrill", "Audino", "Timburr", "Gurdurr", "Conkeldurr", "Tympole", "Palpitoad", "Seismitoad", "Throh", "Sawk", "Sewaddle", "Swadloon", "Leavanny", "Venipede", "Whirlipede", "Scolipede", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Basculin", "Sandile", "Krokorok", "Krookodile", "Darumaka", "Darmanitan", "Maractus", "Dwebble", "Crustle", "Scraggy", "Scrafty", "Sigilyph", "Yamask", "Cofagrigus", "Tirtouga", "Carracosta", "Archen", "Archeops", "Trubbish", "Garbodor", "Zorua", "Zoroark", "Minccino", "Cinccino", "Gothita", "Gothorita", "Gothitelle", "Solosis", "Duosion", "Reuniclus", "Ducklett", "Swanna", "Vanillite", "Vanillish", "Vanilluxe", "Deerling", "Sawsbuck", "Emolga", "Karrablast", "Escavalier", "Foongus", "Amoonguss", "Frillish", "Jellicent", "Alomomola", "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", "Klink", "Klang", "Klinklang", "Tynamo", "Eelektrik", "Eelektross", "Elgyem", "Beheeyem", "Litwick", "Lampent", "Chandelure", "Axew", "Fraxure", "Haxorus", "Cubchoo", "Beartic", "Cryogonal", "Shelmet", "Accelgor", "Stunfisk", "Mienfoo", "Mienshao", "Druddigon", "Golett", "Golurk", "Pawniard", "Bisharp", "Bouffalant", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Heatmor", "Durant", "Deino", "Zweilous", "Hydreigon", "Larvesta", "Volcarona", "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram", "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect", "Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox", "Froakie", "Frogadier", "Greninja", "Bunnelby", "Diggersby", "Fletchling", "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", "Litleo", "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat", "Pancham", "Pangoro", "Furfrou", "Espurr", "Meowstic", "Honedge", "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge", "Clauncher", "Clawitzer", "Helioptile", "Heliolisk", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink", "Goomy", "Sliggoo", "Goodra", "Klefki", "Phantump", "Trevenant", "Pumpkaboo", "Gourgeist", "Bergmite", "Avalugg", "Noibat", "Noivern", "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion", "Rowlet", "Dartrix", "Decidueye", "Litten", "Torracat", "Incineroar", "Popplio", "Brionne", "Primarina", "Pikipek", "Trumbeak", "Toucannon", "Yungoos", "Gumshoos", "Grubbin", "Charjabug", "Vikavolt", "Crabrawler", "Crabominable", "Orcorio", "Cutiefly", "Ribombee", "Rockruff", "Lycanroc", "Wishiwashi", "Mareanie", "Toxapex", "Mudbray", "Mudsdale", "Dewpider", "Araquanid", "Fomantis", "Lurantis", "Morelull", "Shiinotic", "Salandit", "Salazzle", "Stufful", "Bewear", "Bounsweet", "Steenee", "Tsareena", "Comfey", "Oranguru", "Passimian", "Wimpod", "Golisopod", "Sandygast", "Palossand", "Pyukumuku", "Type: Null", "Silvally", "Minior", "Komala", "Turtonator", "Togedemaru", "Mimikyu", "Bruxish", "Drampa", "Dhelmise", "Jangmo-o", "Hakamo-o", "Kommo-o", "Tapu Koko", "Tapu Lele", "Tapu Bulu", "Tapu Fini", "Cosmog", "Cosmoem", "Solgaleo", "Lunala", "Nihilego", "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord", "Necrozma", "Magearna"];
    var category = "Who's That Pokémon?", question = "", answer = "";
    for (var i = 0; i < pokeList.length; i++) {
        question = i + 1;
        answer = pokeList[i];
        triviaq.add(category, question, answer);
        var all = triviaq.all(), qid, qu;
        for (var b in all) {
            qu = triviaq.get(b);
            if (qu.question === question) {
                qid = b;
            }
        }
    }
    saveData();
    Trivia.sendAll("The Who's That Pokémon category has been created.", revchan);
}, "Creates and fills the Who's That Pokémon category.");

addOwnerCommand(["createanagram"], function (src, commandData, channel) {
    var pokeList = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran-f", "Nidorina", "Nidoqueen", "Nidoran-m", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos", "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish", "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank", "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh", "Celebi", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Poochyena", "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Lotad", "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts", "Kirlia", "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", "Skitty", "Delcatty", "Sableye", "Mawile", "Aron", "Lairon", "Aggron", "Meditite", "Medicham", "Electrike", "Manectric", "Plusle", "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Numel", "Camerupt", "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava", "Flygon", "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose", "Seviper", "Lunatone", "Solrock", "Barboach", "Whiscash", "Corphish", "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Castform", "Kecleon", "Shuppet", "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol", "Wynaut", "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock", "Regice", "Registeel", "Latias", "Latios", "Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos", "Gastrodon", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Mismagius", "Honchkrow", "Glameow", "Purugly", "Chingling", "Stunky", "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mime Jr.", "Happiny", "Chatot", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Riolu", "Lucario", "Hippopotas", "Hippowdon", "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke", "Snover", "Abomasnow", "Weavile", "Magnezone", "Lickilicky", "Rhyperior", "Tangrowth", "Electivire", "Magmortar", "Togekiss", "Yanmega", "Leafeon", "Glaceon", "Gliscor", "Mamoswine", "Porygon-Z", "Gallade", "Probopass", "Dusknoir", "Froslass", "Rotom", "Uxie", "Mesprit", "Azelf", "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia", "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus", "Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar", "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog", "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard", "Pansage", "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Munna", "Musharna", "Pidove", "Tranquill", "Unfezant", "Blitzle", "Zebstrika", "Roggenrola", "Boldore", "Gigalith", "Woobat", "Swoobat", "Drilbur", "Excadrill", "Audino", "Timburr", "Gurdurr", "Conkeldurr", "Tympole", "Palpitoad", "Seismitoad", "Throh", "Sawk", "Sewaddle", "Swadloon", "Leavanny", "Venipede", "Whirlipede", "Scolipede", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Basculin", "Sandile", "Krokorok", "Krookodile", "Darumaka", "Darmanitan", "Maractus", "Dwebble", "Crustle", "Scraggy", "Scrafty", "Sigilyph", "Yamask", "Cofagrigus", "Tirtouga", "Carracosta", "Archen", "Archeops", "Trubbish", "Garbodor", "Zorua", "Zoroark", "Minccino", "Cinccino", "Gothita", "Gothorita", "Gothitelle", "Solosis", "Duosion", "Reuniclus", "Ducklett", "Swanna", "Vanillite", "Vanillish", "Vanilluxe", "Deerling", "Sawsbuck", "Emolga", "Karrablast", "Escavalier", "Foongus", "Amoonguss", "Frillish", "Jellicent", "Alomomola", "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", "Klink", "Klang", "Klinklang", "Tynamo", "Eelektrik", "Eelektross", "Elgyem", "Beheeyem", "Litwick", "Lampent", "Chandelure", "Axew", "Fraxure", "Haxorus", "Cubchoo", "Beartic", "Cryogonal", "Shelmet", "Accelgor", "Stunfisk", "Mienfoo", "Mienshao", "Druddigon", "Golett", "Golurk", "Pawniard", "Bisharp", "Bouffalant", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Heatmor", "Durant", "Deino", "Zweilous", "Hydreigon", "Larvesta", "Volcarona", "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram", "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect", "Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox", "Froakie", "Frogadier", "Greninja", "Bunnelby", "Diggersby", "Fletchling", "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", "Litleo", "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat", "Pancham", "Pangoro", "Furfrou", "Espurr", "Meowstic", "Honedge", "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge", "Clauncher", "Clawitzer", "Helioptile", "Heliolisk", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink", "Goomy", "Sliggoo", "Goodra", "Klefki", "Phantump", "Trevenant", "Pumpkaboo", "Gourgeist", "Bergmite", "Avalugg", "Noibat", "Noivern", "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion", "Rowlet", "Dartrix", "Decidueye", "Litten", "Torracat", "Incineroar", "Popplio", "Brionne", "Primarina", "Pikipek", "Trumbeak", "Toucannon", "Yungoos", "Gumshoos", "Grubbin", "Charjabug", "Vikavolt", "Crabrawler", "Crabominable", "Orcorio", "Cutiefly", "Ribombee", "Rockruff", "Lycanroc", "Wishiwashi", "Mareanie", "Toxapex", "Mudbray", "Mudsdale", "Dewpider", "Araquanid", "Fomantis", "Lurantis", "Morelull", "Shiinotic", "Salandit", "Salazzle", "Stufful", "Bewear", "Bounsweet", "Steenee", "Tsareena", "Comfey", "Oranguru", "Passimian", "Wimpod", "Golisopod", "Sandygast", "Palossand", "Pyukumuku", "Type: Null", "Silvally", "Minior", "Komala", "Turtonator", "Togedemaru", "Mimikyu", "Bruxish", "Drampa", "Dhelmise", "Jangmo-o", "Hakamo-o", "Kommo-o", "Tapu Koko", "Tapu Lele", "Tapu Bulu", "Tapu Fini", "Cosmog", "Cosmoem", "Solgaleo", "Lunala", "Nihilego", "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord", "Necrozma", "Magearna"];
    var category = "Anagram: Pokémon", question = "", answer = "";
    for (var i = 0; i < pokeList.length; i++) {
        question = answer = pokeList[i];
        triviaq.add(category, question, answer);
        var all = triviaq.all(), qid, qu;
        for (var b in all) {
            qu = triviaq.get(b);
            if (qu.question === question) {
                qid = b;
            }
        }
    }
    saveData();
    Trivia.sendAll("The Anagram: Pokémon category has been created.", revchan);
}, "Creates and fills the Anagram: Pokémon category."    )

addOwnerCommand(["createpwv"], function (src, commandData, channel) {
    var pokeList = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran-f", "Nidorina", "Nidoqueen", "Nidoran-m", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo", "Mew", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Sentret", "Furret", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat", "Chinchou", "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi", "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos", "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip", "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora", "Yanma", "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking", "Misdreavus", "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress", "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish", "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring", "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola", "Remoraid", "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom", "Kingdra", "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle", "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank", "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar", "Tyranitar", "Lugia", "Ho-Oh", "Celebi", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Poochyena", "Mightyena", "Zigzagoon", "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox", "Lotad", "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry", "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts", "Kirlia", "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Shedinja", "Whismur", "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass", "Skitty", "Delcatty", "Sableye", "Mawile", "Aron", "Lairon", "Aggron", "Meditite", "Medicham", "Electrike", "Manectric", "Plusle", "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Numel", "Camerupt", "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava", "Flygon", "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose", "Seviper", "Lunatone", "Solrock", "Barboach", "Whiscash", "Corphish", "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Castform", "Kecleon", "Shuppet", "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol", "Wynaut", "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Bagon", "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock", "Regice", "Registeel", "Latias", "Latios", "Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor", "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio", "Luxray", "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", "Combee", "Vespiquen", "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos", "Gastrodon", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny", "Mismagius", "Honchkrow", "Glameow", "Purugly", "Chingling", "Stunky", "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mime Jr.", "Happiny", "Chatot", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax", "Riolu", "Lucario", "Hippopotas", "Hippowdon", "Skorupi", "Drapion", "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke", "Snover", "Abomasnow", "Weavile", "Magnezone", "Lickilicky", "Rhyperior", "Tangrowth", "Electivire", "Magmortar", "Togekiss", "Yanmega", "Leafeon", "Glaceon", "Gliscor", "Mamoswine", "Porygon-Z", "Gallade", "Probopass", "Dusknoir", "Froslass", "Rotom", "Uxie", "Mesprit", "Azelf", "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia", "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus", "Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite", "Emboar", "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog", "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard", "Pansage", "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Munna", "Musharna", "Pidove", "Tranquill", "Unfezant", "Blitzle", "Zebstrika", "Roggenrola", "Boldore", "Gigalith", "Woobat", "Swoobat", "Drilbur", "Excadrill", "Audino", "Timburr", "Gurdurr", "Conkeldurr", "Tympole", "Palpitoad", "Seismitoad", "Throh", "Sawk", "Sewaddle", "Swadloon", "Leavanny", "Venipede", "Whirlipede", "Scolipede", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Basculin", "Sandile", "Krokorok", "Krookodile", "Darumaka", "Darmanitan", "Maractus", "Dwebble", "Crustle", "Scraggy", "Scrafty", "Sigilyph", "Yamask", "Cofagrigus", "Tirtouga", "Carracosta", "Archen", "Archeops", "Trubbish", "Garbodor", "Zorua", "Zoroark", "Minccino", "Cinccino", "Gothita", "Gothorita", "Gothitelle", "Solosis", "Duosion", "Reuniclus", "Ducklett", "Swanna", "Vanillite", "Vanillish", "Vanilluxe", "Deerling", "Sawsbuck", "Emolga", "Karrablast", "Escavalier", "Foongus", "Amoonguss", "Frillish", "Jellicent", "Alomomola", "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", "Klink", "Klang", "Klinklang", "Tynamo", "Eelektrik", "Eelektross", "Elgyem", "Beheeyem", "Litwick", "Lampent", "Chandelure", "Axew", "Fraxure", "Haxorus", "Cubchoo", "Beartic", "Cryogonal", "Shelmet", "Accelgor", "Stunfisk", "Mienfoo", "Mienshao", "Druddigon", "Golett", "Golurk", "Pawniard", "Bisharp", "Bouffalant", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Heatmor", "Durant", "Deino", "Zweilous", "Hydreigon", "Larvesta", "Volcarona", "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram", "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect", "Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox", "Froakie", "Frogadier", "Greninja", "Bunnelby", "Diggersby", "Fletchling", "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", "Litleo", "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat", "Pancham", "Pangoro", "Furfrou", "Espurr", "Meowstic", "Honedge", "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge", "Clauncher", "Clawitzer", "Helioptile", "Heliolisk", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink", "Goomy", "Sliggoo", "Goodra", "Klefki", "Phantump", "Trevenant", "Pumpkaboo", "Gourgeist", "Bergmite", "Avalugg", "Noibat", "Noivern", "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion", "Rowlet", "Dartrix", "Decidueye", "Litten", "Torracat", "Incineroar", "Popplio", "Brionne", "Primarina", "Pikipek", "Trumbeak", "Toucannon", "Yungoos", "Gumshoos", "Grubbin", "Charjabug", "Vikavolt", "Crabrawler", "Crabominable", "Orcorio", "Cutiefly", "Ribombee", "Rockruff", "Lycanroc", "Wishiwashi", "Mareanie", "Toxapex", "Mudbray", "Mudsdale", "Dewpider", "Araquanid", "Fomantis", "Lurantis", "Morelull", "Shiinotic", "Salandit", "Salazzle", "Stufful", "Bewear", "Bounsweet", "Steenee", "Tsareena", "Comfey", "Oranguru", "Passimian", "Wimpod", "Golisopod", "Sandygast", "Palossand", "Pyukumuku", "Type: Null", "Silvally", "Minior", "Komala", "Turtonator", "Togedemaru", "Mimikyu", "Bruxish", "Drampa", "Dhelmise", "Jangmo-o", "Hakamo-o", "Kommo-o", "Tapu Koko", "Tapu Lele", "Tapu Bulu", "Tapu Fini", "Cosmog", "Cosmoem", "Solgaleo", "Lunala", "Nihilego", "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord", "Necrozma", "Magearna"];
    var category = "Pokémon Without Vowels", question = "", answer = "";
    for (var i = 0; i < pokeList.length; i++) {
        question = answer = pokeList[i];
        triviaq.add(category, question, answer);
        var all = triviaq.all(), qid, qu;
        for (var b in all) {
            qu = triviaq.get(b);
            if (qu.question === question) {
                qid = b;
            }
        }
    }
    saveData();
    Trivia.sendAll("The Pokémon Without Vowels category has been created.", revchan);
}, "Creates and fills the Pokémon Without Vowels category."    )
*/

/*** SERVER OWNER COMMANDS ***/

addServerOwnerCommand(["triviasuperadmin", "striviasuperadmin"], function (src, commandData, channel, command) {
    if (!commandData) {
        return;
    }
    if (tsadmin.isTAdmin(commandData)) {
        Trivia.sendPM(src, "That person is already a Super Trivia Admin.", channel);
        return;
    }
    tsadmin.addTAdmin(commandData);
    if (command === "triviasuperadmin") {
        Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Trivia Admin.", triviachan);
    }
    Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Trivia Admin.", revchan);
    Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Trivia Admin.", sachannel);
}, "Allows you to promote a new Trivia Super Admin. Use /striviasuperadmin for a silent promotion.");

addServerOwnerCommand(["triviasuperadminoff", "striviasuperadminoff"], function (src, commandData, channel, command) {
    if (!commandData) {
        return;
    }
    if (!tsadmin.isTAdmin(commandData)) {
        Trivia.sendPM(src, "That person isn't a Super Trivia Admin.", channel);
        return;
    }
    tsadmin.removeTAdmin(commandData);
    if (command === "triviasuperadminoff") {
        Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from Super Trivia Admin.", triviachan);
    }
    Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from Super Trivia Admin.", revchan);
    Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from Super Trivia Admin.", sachannel);
}, "Allows you to demote a current Trivia Super Admin. Use /striviasuperadminoff for a silent demotion.");


module.exports = {
    // Normal command handling.
    handleCommand: function trivia_handleCommand(src, command, channel) {
        var commandData;
        var indx = command.indexOf(' ');
        if (indx != -1) {
            commandData = command.substr(indx + 1);
            command = command.substr(0, indx).toLowerCase();
        }
        else {
            command = command.toLowerCase();
            commandData = ""; // sane default to avoid undefined errors
        }
        // Only care about trivia channels
        if (channel != triviachan && channel != revchan && ["triviamute", "triviaunmute", "flashtas", "triviaadmins", "tadmins", "tas", "triviarules", "triviamutes"].indexOf(command) == -1)
            return;

        try {
            // Trivia user commands
            if (userCommands.hasOwnProperty(command)) {
                userCommands[command].call(null, src, commandData, channel, command);
                return true;
            }
            // Trivia admin commands
            if (sys.auth(src) > 0 || tadmin.isTAdmin(sys.name(src)) || isTriviaOwner(src)) {
                if (adminCommands.hasOwnProperty(command)) {
                    adminCommands[command].call(null, src, commandData, channel, command);
                    return true;
                }
            }
            // Trivia owner commands
            if (isTriviaOwner(src)) {
                if (ownerCommands.hasOwnProperty(command)) {
                    ownerCommands[command].call(null, src, commandData, channel, command);
                    return true;
                }
            }
            // Server owner trivia commands
            if (sys.auth(src) >= 3) {
                if (serverOwnerCommands.hasOwnProperty(command)) {
                    serverOwnerCommands[command].call(null, src, commandData, channel, command);
                    return true;
                }
            }
        }
        catch (e) {
            sys.sendMessage(src, "Error in your trivia command: " + e + " on line " + e.lineNumber, channel);
        }
    },

    onHelp: function trivia_onHelp(src, commandData, channel) {
        if (commandData.toLowerCase() == "trivia") {
            sys.sendMessage(src, "", channel);
            sys.sendMessage(src, "*** Trivia commands ***", channel);
            userCommandHelp.forEach(function (h) {
                sys.sendMessage(src, h, channel);
            });
            if (sys.auth(src) > 0 || tadmin.isTAdmin(sys.name(src)) || isTriviaOwner(src)) {
                sys.sendMessage(src, "*** Trivia Admin commands ***", channel);
                adminCommandHelp.forEach(function (h) {
                    if (h.indexOf("/elimination") !== -1) { sys.sendHtmlMessage(src, "<font color='blue'><timestamp/>**General TA commands**</font>", channel); }
                    if (h.indexOf("/removeq") !== -1) { sys.sendHtmlMessage(src, "<font color='blue'><timestamp/>**Review TA commands**</font>", channel); }
                    if (h.indexOf("/apropos") !== -1) { sys.sendHtmlMessage(src, "<font color='blue'><timestamp/>**Search and Statistical TA commands**</font>", channel); }
                    if (h.indexOf("/setvotecooldown") !== -1) { sys.sendHtmlMessage(src, "<font color='blue'><timestamp/>**Category TA commands**</font>", channel); }
                    sys.sendMessage(src, h, channel);
                });
            }
            if (isTriviaOwner(src)) {
                sys.sendMessage(src, "*** Trivia Owner commands ***", channel);
                ownerCommandHelp.forEach(function (h) {
                    sys.sendMessage(src, h, channel);
                });
            }
            if (sys.auth(src) >= 3) {
                sys.sendMessage(src, "*** Server owner Trivia commands ***", channel);
                serverOwnerCommandHelp.forEach(function (h) {
                    sys.sendMessage(src, h, channel);
                });
            }
        }
    },

    onMute: trivia_onMute,
    onKick: trivia_onMute,
    onBan: trivia_onMute,

    beforeChannelJoin: function trivia_beforeChannelJoin(src, channel) {
        /* Prevent channel join */
        if (channel == revchan && sys.auth(src) < 1 && !tadmin.isTAdmin(sys.name(src).toLowerCase()) && !hasReviewAccess(sys.name(src))) {
            sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
            sys.stopEvent();
            return;
        }
    },

    afterChannelJoin: function trivia_afterChannelJoin(src, channel) {
        if (channel === revchan) {
            PMcheckq(src, channel);
        }
        if (channel === triviachan || channel === revchan){
            var border = "<font color='#3daa68'><timestamp/><b>»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:</b></font>";
            sys.sendHtmlMessage(src, border, channel);
            sys.sendMessage(src, "*** NEXT TRIVIA EVENT ***", channel);
            if (eventModeOn) {
                if (trivData.eventFlag) {
                    triviabot.sendHtmlMessage(src, "A Trivia event game is currently running. <a href=\"po:send//join\">Click here to join!</a>", channel);
                    sys.sendHtmlMessage(src, border, channel);
                    return;
                }
                if (eventModeOn && ((lastEventTime + trivData.eventCooldown) <= sys.time())) {
                    Trivia.sendPM(src, "Starts after this game.", channel);
                    sys.sendHtmlMessage(src, border, channel);
                    return;
                }
                var nextEventTime = (lastEventTime + trivData.eventCooldown) - sys.time();
                Trivia.sendPM(src, "Starts in " + getTimeString(nextEventTime), channel);
            }
            else {
                Trivia.sendPM(src, "No events scheduled.", channel);
            }
            sys.sendHtmlMessage(src, border, channel);
        }
    },

    beforeChannelLeave: function trivia_beforeChannelLeave(src, channel) {
        if (Trivia.started && channel === triviachan) {
            Trivia.unjoin(src);
        }
    },

    beforeChatMessage: function trivia_beforeChatMessage(src, message, channel) {
        if (channel !== triviachan)
            return;

        if (message.substr(0, 5) == "\\join") {
            Trivia.sendPM(src, "You must use /join to join a Trivia game!", channel);
            return true;
        }

        if (utilities.is_command(message) && message.substr(1, 2).toLowerCase() != "me")
            return;

        /* Trivia checks */
        var joined = Trivia.playerPlaying(src);
        if (Trivia.started) {
            if (!joined && Trivia.phase === "answer") {
                if (SESSION.users(src).mute.active || isTrivia("muted", sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)) {
                    Trivia.sendPM(src, "You cannot join when muted!", channel);
                    return true;
                }
                if (!sys.dbRegistered(sys.name(src))) {
                    Trivia.sendPM(src, "Please register before playing Trivia.", channel);
                    return true;
                }
                if (Trivia.scoreType === "elimination" && Trivia.phase === "answer") {
                    if (Trivia.round > Trivia.maxPoints) {
                        var canJoin = false;
                        for (var z in Trivia.triviaPlayers) { // if they have joined previously, don't lock them out here
                            if (Trivia.triviaPlayers[z].name === sys.name(src)) {
                                canJoin = true;
                                break;
                            }
                        }
                        if (!canJoin) {
                            Trivia.sendPM(src, "It is too late to join this game!", channel);
                            return true; //without this, it tells them that they can't join, but then lets them join anyway
                        }
                    }
                    Trivia.addPlayer(src);
                    Trivia.triviaPlayers[src].points = Trivia.triviaPlayers[src].points - (Trivia.round - parseInt(Trivia.triviaPlayers[src].roundLeft));
                    if (Trivia.triviaPlayers[src].roundLeft !== Trivia.round) { Trivia.triviaPlayers[src].points++; } // no need to penalize them twice if the don't answer correctly
                    if (Trivia.triviaPlayers[src].points <= 0) {
                        Trivia.removePlayer(src);
                        Trivia.sendPM(src, "It is too late to join this game!", channel);
                        return true;
                    }
                    Trivia.sendAll(sys.name(src) + " joined the game late with " + Trivia.triviaPlayers[src].points + (Trivia.triviaPlayers[src].points === 1 ? " life!" : " lives!"), triviachan);
                    Trivia.addAnswer(src, message.replace(/,/gi, ""));
                    Trivia.sendPM(src, "Your answer was submitted: " + message, channel);
                    return true;
                } else {
                    Trivia.addPlayer(src);
                    Trivia.sendAll(sys.name(src) + " joined the game!", channel);
                }
                Trivia.addAnswer(src, message.replace(/,/gi, ""));
                Trivia.sendPM(src, "Your answer was submitted: " + message, channel);
                return true;
            }
        }
        if (joined && Trivia.started && Trivia.phase === "answer") {
            if (message.length > 60) {
                Trivia.sendPM(src, "Sorry! Your answer is too long.", channel);
                return true;
            }
            // Remove commas so the listing looks better
            // This is fine as no answers should include comma.
            if (SESSION.users(src).smute.active && sys.auth(src) < 1) {
                return true;
            }
            Trivia.addAnswer(src, message.replace(/,/gi, ""));
            Trivia.sendPM(src, "Your answer was submitted: " + message, triviachan);
            return true;
        }
        if (isTrivia("muted", sys.ip(src))) {
            var mute = trivData.mutes[sys.ip(src)];
            triviabot.sendMessage(src, "You are trivia muted by " + mute.by + (mute.expires == "never" ? "" : " for " + getTimeString(mute.expires - sys.time())) + "! [Reason: " + mute.reason + "]", channel);
            return true;
        }
    },

    init: function trivia_init() {
        triviachan = sys.channelId('Trivia');
        revchan = sys.channelId('TrivReview');
        Trivia = SESSION.global().Trivia;
        if (!Trivia || !Trivia.started) {
            Trivia = new TriviaGame();
            triviaq = new QuestionHolder("triviaq.txt");
            trivreview = new QuestionHolder("trivreview.txt");
            tadmin = new TriviaAdmin("tadmins.txt");
            extLB = new PointsLB("trivialeaderboard.txt");
            extLastLB = new PointsLastLB("lasttrivialeaderboard.txt");
            eventSets = new EventSettings("triviaeventsettings.txt");
            eventStats = new EventStatistics("triviaeventstats.txt");
        }
        eventSets.loadEventSettings();
        //Trivia.sendAll("Trivia is now running!");
    },

    stepEvent: function trivia_step() {
        SESSION.global().Trivia = Trivia;
        Trivia.stepHandler();
    },

    isChannelAdmin: function(src) {
        return tadmin.isTAdmin(sys.name(src)) ? true : tsadmin.isTAdmin(sys.name(src));
    },

    "help-string": ["trivia: To know the trivia commands"]
};
