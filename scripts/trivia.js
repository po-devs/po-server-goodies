/*
    * trivia.js
        - Plugin on Pokémon Online servers for Trivia Games
        - Script done with the help of Ethan, Lamperi, Crystal Moogle, and Wriggle Nightbug
    * Files used:
        - trivData.json
        - triviaq.txt
        - trivreview.txt
        - tadmins.txt
        - tsadmins.txt
*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global updateModule, script, sys, SESSION, sendChanAll, sendChanHtmlAll, require, module, sachannel, staffchannel*/
var Bot = require("bot.js").Bot;
var utilities = require("utilities.js");
var html_escape = require("utilities.js").html_escape;
var MemoryHash = require('memoryhash.js').MemoryHash;

var triviachan, revchan;
var triviabot = new Bot("Metagross");

var triviaCategories = ['Anime/Manga', 'Animals', 'Art', 'Comics', 'Food/Drink', 'Games', 'Geography', 'History', 'Internet', 'Language', 'Literature', 'Math', 'Misc', 'Movies', 'Music', 'Mythology', 'Pokemon', 'Pokemon Online', 'Politics', 'Religion', 'Science', 'Social Science', 'Society', 'Space', 'Sports', 'Technology', 'TV', 'Video Games'];
var lastCatGame = 0;
var lastUsedCats = [];

var Trivia;
try {
    Trivia = SESSION.global().Trivia;
} catch (e) {
    Trivia = new TriviaGame();
}
if (!Trivia || !Trivia.started) {
    Trivia = new TriviaGame();
}

var triviaq = new QuestionHolder("triviaq.txt");
var trivreview = new QuestionHolder("trivreview.txt");
var tadmin = new TriviaAdmin("tadmins.txt");
var tsadmin = new TriviaAdmin("tsadmins.txt");
var trivData;
try {
    trivData = JSON.parse(sys.getFileContent("trivData.json"));
}
catch (e) {
    trivData = {};
}

var neededData = ["submitBans", "toFlash", "mutes", "leaderBoard", "triviaWarnings", "autostartRange"];
for (var i = 0; i < neededData.length; ++i) {
    var data = neededData[i];
    if (trivData[data] === undefined) {
        if (data === 'leaderBoard' || data === 'triviaWarnings') {
            trivData[data] = [];
        }
        if (data === "autostartRange") {
            trivData[data] = {
                min: 9,
                max: 24
            };
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
    if (Trivia.needsUpdating !== true) return;
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
    return cauth === true || contribs === true;
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
        if (+questionId < 0) {
            Trivia.sendPM(src, "Put into edit by: " + questionInfo.name, channel);
        } else {
            Trivia.sendPM(src, "Submitted By: " + questionInfo.name, channel);
        }
    }
    sys.sendMessage(src, "", channel);
}

function time() {
    return Date.now() / 1000;
}

function trivia_onMute(src) {
    if (Trivia.started === false) {
        return;
    }
    if (Trivia.playerPlaying(src)) {
        Trivia.removePlayer(src);
        Trivia.sendAll(sys.name(src) + " left the game!", triviachan);
        return;
    }
}

function TriviaGame() {
    this.id = triviachan;
    this.round = 0;
    this.started = false;
    this.maxPoints = 0;
    this.qSource = [];
    this.catGame = false;
    this.usingCats = [];
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.roundQuestion = 0;
    this.phase = "";
    this.triviaPoints = "";
    this.startoff = false;
//    this.autostart = false; Commented out because you never know
    this.ticks = -1;
    this.suggestion = {};
    this.inactivity = 0;
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

TriviaGame.prototype.startGame = function (data, name) {
    if (this.started === true) return;
    if (this.startoff === true) return;
    if (triviaq.questionAmount() < 1) return;
//    if (name === "" && this.autostart === false) return;
    Trivia.suggestion = {};
    data = data.split("*");
    this.maxPoints = data[0];
    if (data.length > 1) {
        this.catGame = true;
        this.usingCats = data.slice(1);
    }
    if (this.catGame) {
        var cats = [];
        for (var x in this.usingCats) {
            cats.push(this.usingCats[x]);
        }
        this.startCatGame(this.maxPoints, cats, name);
    }
    else {
        this.startNormalGame(this.maxPoints, name);
    }
};

TriviaGame.prototype.startNormalGame = function (points, name) {
    this.started = true;
    sendChanAll("", 0);
    sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", 0);
    this.sendAll("A #Trivia game was started! First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", 0);
    sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", 0);
    sendChanAll("", 0);
    this.sendAll((name !== "" ? name + " started a Trivia game! " : "A trivia game was started! ") + " First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", triviachan);
    sendChanHtmlAll("<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> Type <b>/join</b> to join!", triviachan);
    var players = sys.playersOfChannel(triviachan);
    // Flash players who have it enabled
    var player_id, player_ip;
    for (var p in players) {
        player_id = players[p], player_ip = sys.ip(player_id);
        if (trivData.toFlash[player_ip])
            sys.sendHtmlMessage(player_id, "<ping/>", triviachan);
    }
    for (var q in triviaq.all()) {
        this.qSource.push(q);
    }
    this.phase = "standby";
    this.ticks = 15;
};

TriviaGame.prototype.startCatGame = function (points, cats, name) {
    for (var q in triviaq.all()) {
        if (cats.join("*").toLowerCase().split("*").indexOf(triviaq.get(q).category.toLowerCase()) != -1) {
            this.qSource.push(q);
        }
    }
    this.started = true;
    var lastCat;
    var catsLength = cats.length;
    if (cats.length > 1) {
        lastCat = cats.splice(-1, 1);
    }
    sendChanAll("", 0);
    sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", 0);
    this.sendAll("A Category game has started in #Trivia! Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + ". First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", 0);
    sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:", 0);
    sendChanAll("", 0);
    this.sendAll(name + " has started a Category Game! Test your knowledge on " + (catsLength > 1 ? cats.join(", ") + " and " + lastCat : cats[0]) + ". First to " + points + " " + (points == 1 ? "point" : "points") + " wins!", triviachan);
    sendChanHtmlAll("<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> Type <b>/join</b> to join!", triviachan);
    var players = sys.playersOfChannel(triviachan);
    // Flash players who have it enabled
    var player_id, player_ip;
    for (var p in players) {
        player_id = players[p], player_ip = sys.ip(player_id);
        if (trivData.toFlash[player_ip])
            sys.sendHtmlMessage(player_id, "<ping/>", triviachan);
    }
    this.phase = "standby";
    this.ticks = 15;
};

TriviaGame.prototype.startTrivia = function (src, data) {
    if (this.started === true) {
        this.sendPM(src, "A trivia game has already started!", triviachan);
        return;
    }
    if (this.startoff === true) {
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
    data = data.split("*");
    if (!(tadmin.isTAdmin(sys.name(src)) || tsadmin.isTAdmin(sys.name(src)) || sys.auth(src) > 0)) {
        data = [data[0]];
    }
    var rand = parseInt(data[0], 10);
    if (rand > 102 || rand < 1) {
        this.sendPM(src, "Please do not start a game with more than 102 points, or less than 1 point.", triviachan);
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
        var match = false;
        for (var q in triviaq.all()) {
            if (data[i].toLowerCase() === triviaq.get(q).category.toLowerCase()) {
                match = true;
            }
        }
        if (match === false) {
            this.sendPM(src, "Category " + data[i] + " was removed because it isn't an existing category.", triviachan);
            data.splice(i, 1);
            i--;
        }
    }
    data[0] = (isNaN(rand)) ? sys.rand(trivData.autostartRange.min, trivData.autostartRange.max) : +rand;
    data = data.join("*");
    this.startGame(data, sys.name(src));
};

TriviaGame.prototype.startTriviaRound = function () {
    if (this.started === false)
        return;
    /* Reset submittedAnswers */
    this.submittedAnswers = {};
    /* Advance round */
    this.round++;
    /* Make a random number to get the ID of the (going to be) asked question, or use the suggestion */
    var questionNumber;
    if (Trivia.suggestion.id !== undefined) {
        questionNumber = Trivia.suggestion.id;
        Trivia.suggestion.asked = true;
    }
    else {
        questionNumber = Trivia.randomId();
        var i = 0;
        while (triviaq.get(questionNumber) === null && i !== 200) {
            questionNumber = Trivia.randomId();
            i++;
        }
        if (i === 200) {
            this.htmlAll("There are no more questions to show! This is the perfect chance to submit more!<br/>The game automatically ended.");
            this.resetTrivia();
            runUpdate();
            return;
        }
    }
    /* Get the category, question, and answer */
    var q = triviaq.get(questionNumber);
    var category = q.category,
        question = q.question;
    
    this.phase = "answer";
    this.roundQuestion = questionNumber;
    this.htmlAll("<b>Category:</b> " + category.toUpperCase() + "<br>" + question);
    var index = this.qSource.indexOf(questionNumber);
    this.qSource.splice(index, 1);
    Trivia.ticks = 10;
};

TriviaGame.prototype.finalizeAnswers = function () {
    if (this.started === false)
        return;
    if (Trivia.suggestion.asked === true) {
        Trivia.suggestion = {};
    }
    var answer, id, answers = [].concat(triviaq.get(this.roundQuestion).answer.split(","));
    this.phase = "standby";
    var wrongAnswers = [],
        answeredCorrectly = [];
    var ignoreCaseAnswers = answers.map(function (s) {
        return String(s).toLowerCase();
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
            if (ignoreCaseAnswers.indexOf(answer) != -1) {
                answeredCorrectly.push(name);
            }
            else {
                var tanswer = this.submittedAnswers[id].answer;
                wrongAnswers.push("<span title='" + utilities.html_escape(name) + "'>" + utilities.html_escape(tanswer) + "</span>");
                for (var i = 0; i < trivData.triviaWarnings.length; ++i) {
                    var regexp = new RegExp(trivData.triviaWarnings[i]);
                    if (regexp.test(tanswer.toLowerCase())) {
                        if (sys.existChannel("Victory Road")) {
                            triviabot.sendAll("Warning: Player " + name + " answered '" + tanswer + "' to the question '" + triviaq.get(this.roundQuestion).question + "' in #Trivia", sys.channelId("Victory Road"));
                        }
                        triviabot.sendAll("Warning: Player " + name + " answered '" + tanswer + "' to the question '" + triviaq.get(this.roundQuestion).question + "' in #Trivia", revchan);
                    }
                }
            }
        }
    }
    sendChanAll("", triviachan);
    var incorrectAnswers = wrongAnswers.length > 0 ? " Incorrect answers: " + wrongAnswers.join(", ") : "";
    sendChanHtmlAll("<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> Time's up!" + incorrectAnswers, triviachan);
    this.sendAll("Answered correctly: " + answeredCorrectly.join(", "), triviachan);
    var x = answers.length != 1 ? "answers were" : "answer was";
    sendChanHtmlAll("<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> The correct " + x + ": <b>" + utilities.html_escape(answers.join(", ")) + "</b>", triviachan);
    var totalPlayers = 0;
    for (var id in this.triviaPlayers) {
        if (this.triviaPlayers[id].playing === true) {
            totalPlayers++;
        }
    }
    if (answeredCorrectly.length !== 0) {
        var pointAdd = +(1.65 * Math.log(totalPlayers / answeredCorrectly.length) + 1).toFixed(0);
        this.sendAll("Points awarded for this question: " + pointAdd);
        for (var i = 0; i < answeredCorrectly.length; i++) {
            var name = answeredCorrectly[i];
            this.player(name).points += pointAdd;
        }
    }

    var leaderboard = [];
    var displayboard = [];
    var winners = [];
    for (id in this.triviaPlayers) {
        if (this.triviaPlayers[id].playing === true) {
            var regname = this.triviaPlayers[id].name;
            var numPoints = this.triviaPlayers[id].points;
            var nohtmlname = utilities.html_escape(regname);
            leaderboard.push([regname, numPoints]);
            if (this.triviaPlayers[id].points >= this.maxPoints) {
                winners.push(nohtmlname + " (" + this.triviaPlayers[id].points + ")");
            }
        }
    }
    leaderboard.sort(function (a, b) {
        return b[1] - a[1];
    });
    for (var x in leaderboard) {
        displayboard.push(leaderboard[x][0] + " (" + leaderboard[x][1] + ")");
    }
    this.sendAll("Leaderboard: " + displayboard.join(", "), triviachan);
    if (totalPlayers < 2) {
        this.inactivity++;
    }
    else {
        this.inactivity = 0;
    }
    if (this.inactivity === 4) {
        this.htmlAll("The game automatically ended due to a lack of players.");
        this.resetTrivia();
        runUpdate();
        return;
    }

    if (winners.length > 0) {
        var w = (winners.length == 1) ? "the winner!" : "our winners!";
        winners.sort(function (a, b) {
            return b[1] - a[1];
        });
        if (Object.keys(Trivia.suggestion).length !== 0) {
            this.sendAll(sys.name(Trivia.suggestion.suggester) + "'s suggestion was cancelled because the game ended before it could be asked.", revchan);
        }
        var allCats = orderedCategories();
        this.htmlAll("<h2>Congratulations to " + w + "</h2>" + winners.join(", ") + "");
        sendChanHtmlAll("<font size=5><font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b> <font color='red'>While you're waiting for another game, why not submit a question? <a href='http://wiki.pokemon-online.eu/wiki/Community:Trivia#Submitting_Questions'>Help and Guidelines are here!</a></font></font></font>", triviachan);
        sendChanHtmlAll("<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> We could really use more <b>" + allCats[allCats.length - sys.rand(1, 6)].category + "</b> themed questions!", triviachan);
        sendChanHtmlAll("<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> Never want to miss a Trivia game? Try the <b>/flashme</b> command!", triviachan);
        //updateLeaderboard(obj);
        if (this.catGame) {
            lastCatGame = 1;
            lastUsedCats = this.usingCats;
        }
        else {
            if (lastCatGame !== 0) {
                lastCatGame++;
            }
        }
        this.resetTrivia();
        runUpdate();
/*        if (this.autostart === true) {
            this.phase = "autostart";
            this.ticks = sys.rand(30, 44);
            Trivia.sendAll("A new trivia game will be started in " + this.ticks + " seconds!", triviachan);
            return;
        }*/
        return;
    }
    if (this.qSource.length === 0) {
        this.htmlAll("There are no more questions to show! This is the perfect chance to submit more!<br/>The game automatically ended.");
        this.resetTrivia();
        runUpdate();
        return;
    }
    var rand = sys.rand(17, 30);
    this.sendAll("Please wait " + rand + " seconds until the next question!", triviachan);
    Trivia.ticks = rand;
};

TriviaGame.prototype.resetTrivia = function () {
    this.started = false;
    this.round = 0;
    this.maxPoints = 0;
    this.qSource = [];
    this.catGame = false;
    this.usingCats = [];
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.roundQuestion = 0;
    this.phase = "";
    this.ticks = -1;
    this.suggestion = {};
    this.inactivity = 0;
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
    if (this.started === false) {
        this.sendPM(src, "A game hasn't started!", triviachan);
        return;
    }
    if (this.playerPlaying(src)) {
        this.removePlayer(src);
        switch (Trivia.triviaPlayers[src].points) {
        case 0:
            Trivia.sendAll(sys.name(src) + " left the game!", triviachan);
            break;
        case 1:
            Trivia.sendAll(sys.name(src) + " left the game with 1 point!", triviachan);
            break;
        default:
            Trivia.sendAll(sys.name(src) + " left the game with " + Trivia.triviaPlayers[src].points + " points!", triviachan);
        }
    }
    else {
        this.sendPM(src, "You haven't joined the game!", triviachan);
    }
};

TriviaGame.prototype.endTrivia = function (src) {
    if (this.started === false) {
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
            points: 0,
            playing: true
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
    } else if (this.phase === "standby") {
        this.startTriviaRound();
    }/* else if (this.phase === "autostart") {
        var startRange = trivData.autostartRange;
        var pointsForGame = sys.rand(startRange.min, parseInt(startRange.max, 10) + 1);
        this.startGame(pointsForGame.toString(), "");
    }*/ else { //game probably stopped or error, so stopping repeated attempts
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

QuestionHolder.prototype.add = function (category, question, answer, name) {
    var id = this.freeId();
    if (name === undefined) {
        this.state.questions.add(id, category + ":::" + question + ":::" + answer);
    }
    else {
        this.state.questions.add(id, category + ":::" + question + ":::" + answer + ":::" + name);
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
        if (+questionId < 0) {
            triviabot.sendAll("Put into edit by: " + questionInfo.name, revchan);
        } else {
            triviabot.sendAll("Submitted By: " + questionInfo.name, revchan);
        }
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
    }
    return q === undefined ? null : q;
};

QuestionHolder.prototype.questionAmount = function () {
    return Object.keys(this.state.questions.hash).length;
};

QuestionHolder.prototype.freeId = function () {
    return this.state.freeId++;
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
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name);
};

QuestionHolder.prototype.changeQuestion = function (id, question) {
    var data = this.state.questions.get(id).split(":::");
    var q = {};
    q.category = data[0];
    q.question = question;
    q.answer = data[2];
    if (data[3]) {
        q.name = data[3];
    }
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name);
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
    this.state.questions.remove(id);
    this.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + q.name);
};

QuestionHolder.prototype.all = function () {
    return this.state.questions.hash;
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

addUserCommand("triviarules", function (src, commandData, channel) {
    sys.sendMessage(src, "", channel);
    sys.sendMessage(src, "*** Trivia rules ***", channel);
    sys.sendMessage(src, "1. #Trivia is an official channel, and as such, server rules apply in it:", channel);
    sys.sendMessage(src, "- This means that every offense, whether in chat or in answers, will be handled by a moderator.", channel);
    sys.sendMessage(src, "2. Do not abuse Trivia commands or hamper game progression:", channel);
    sys.sendMessage(src, "- This includes, but is not limited to, joining and unjoining a game repeatedly, joining a game just to answer a single question then immediately leaving multiple times, purposefully getting answers wrong in order to prolong a game from ending, starting games with unreasonable goals or starting them many times in a row when they're stopped due to a lack of players.", channel);
    sys.sendMessage(src, "3. Have good sportsmanship:", channel);
    sys.sendMessage(src, "- Trivia is a game for all to enjoy, and bad sportsmanship can turn that into a less pleasant experience for everyone involved. Do not brag when you get a question right, and do not be a sore loser when you get it wrong. Any form of cheating isn't allowed, whether by gaining an unfair advantage for yourself, or hampering someone else's ability to answer.", channel);
    sys.sendMessage(src, "4. Do not abuse question submission:", channel);
    sys.sendMessage(src, "- This includes, but is not limited to, submitting questions that are plainly wrong, offensive to other users, racist, inappropriate, trolling, spamming the same question multiple times, purposefully submitting questions that are already in the database. Trivia Admins can revoke a user's submitting privileges at any time if they deem it necessary.", channel);
}, "Shows the rules of the Trivia channel");

addUserCommand("categories", function (src, commandData, channel) {
    if (typeof (triviaCategories) != "object") return;
    triviabot.sendMessage(src, triviaCategories.join(", "), channel);
    triviabot.sendMessage(src, "For more information, refer to: http://wiki.pokemon-online.eu/wiki/Trivia_Categories", channel);
}, "Allows you to view the trivia categories");

addUserCommand("flashme", function (src, commandData, channel) {
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
}, "Whether or not to flash you when a game starts");

addUserCommand("goal", function (src, commandData, channel) {
    if (Trivia.started === false) {
        Trivia.sendPM(src, "A trivia game isn't currently running.", channel);
        return;
    }
    Trivia.sendPM(src, "The goal for the current game is: " + Trivia.maxPoints, channel);
}, "Allows you to see the current target for the trivia game");

addAdminCommand("changegoal", function (src, commandData, channel) {
    if (Trivia.started === false) {
        Trivia.sendPM(src, "A trivia game isn't currently running.", channel);
        return;
    }
    commandData = parseInt(commandData, 10);
    if (isNaN(commandData)) {
        Trivia.sendPM(src, "The goal must be a valid number.", channel);
        return;
    }
    if (commandData < 1 || commandData > 102) {
        Trivia.sendPM(src, "The goal must not be lower than 1 or higher than 102.", channel);
        return;
    }
    triviabot.sendAll(sys.name(src) + " changed the goal of the current game to " + commandData + ".", triviachan);
    Trivia.maxPoints = commandData;
    return;
}, "Allows you to change the goal for the current game");

addAdminCommand("removeq", function (src, commandData, channel) {
    var q = triviaq.get(commandData);
    if (q !== null) {
        triviabot.sendAll(sys.name(src) + " removed question: id, " + commandData + " category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, revchan);
        triviaq.remove(commandData);
        return;
    }
    Trivia.sendPM(src, "Oops! Question doesn't exist", channel);
}, "Allows you to remove a question that has already been submitted, format /removeq [ID]");

addUserCommand("submitq", function (src, commandData, channel) {
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
    var question = utilities.html_escape(commandData[1]).trim();
    var fixAnswer = commandData[2].replace(/ *, */gi, ",").replace(/^ +/, "");
    var answer = fixAnswer.split(",");
    var needsreview = false;
    if (trivreview.questionAmount() === 0) {
        needsreview = true;
    }

    var name = sys.name(src);
    var id = trivreview.add(category, question, answer, name);

    Trivia.sendPM(src, "Your question was submitted.", channel);
    if (needsreview) {
        trivreview.checkq(id);
    }
}, "Allows you to submit a question for review, format /submitq Category*Question*Answer1,Answer2,etc");

addUserCommand("join", function (src, commandData, channel) {
    if (Trivia.started === false) {
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
    if (Trivia.suggestion.suggester === src) {
        Trivia.sendPM(src, "You can't join the game right after suggesting a question, you cheater!", channel);
        return;
    }
    Trivia.addPlayer(src);
    switch (Trivia.triviaPlayers[src].points) {
    case 0:
        Trivia.sendAll(sys.name(src) + " joined the game!", triviachan);
        break;
    case 1:
        Trivia.sendAll(sys.name(src) + " returned to the game with 1 point!", triviachan);
        break;
    default:
        Trivia.sendAll(sys.name(src) + " returned to the game with " + Trivia.triviaPlayers[src].points + " points!", triviachan);
    }
}, "Allows you to join a current game of trivia");

addUserCommand("unjoin", function (src, commandData, channel) {
    if (channel == triviachan)
        Trivia.unjoin(src);
}, "Allows you to quit a current game of trivia");

addUserCommand("qamount", function (src, commandData, channel) {
    if (channel == triviachan || channel == revchan) {
        var qamount = triviaq.questionAmount();
        triviabot.sendMessage(src, "The amount of questions is: " + qamount, channel);
        return;
    }
}, "Shows you the current amount of questions");

addUserCommand(["triviaadmins","tadmins","tas"], function (src, commandData, channel) {
    tsadmin.tAdminList(src, channel, "Trivia Super Admins");
    tadmin.tAdminList(src, channel, "Trivia Admins");
}, "Gives a list of current trivia admins");

addOwnerCommand(["triviaadmin", "striviaadmin"], function (src, commandData, channel, command) {
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
}, "Allows you to promote a new trivia admin, use /striviaadmin for a silent promotion.");

addOwnerCommand(["triviaadminoff", "striviaadminoff"], function (src, commandData, channel, command) {
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
}, "Allows you to demote a current trivia admin or super trivia admin, use /striviaadminoff for a silent demotion.");

addServerOwnerCommand(["triviasuperadmin", "striviasuperadmin"], function (src, commandData, channel, command) {
    if (tsadmin.isTAdmin(commandData)) {
        Trivia.sendPM(src, "That person is already a Trivia Super Admin.", channel);
        return;
    }
    tsadmin.addTAdmin(commandData);
    if (command === "triviasuperadmin") {
        Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Trivia Admin.", triviachan);
    }
    Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Trivia Admin.", revchan);
    Trivia.sendAll(sys.name(src) + " promoted " + commandData.toCorrectCase() + " to Super Trivia Admin.", sachannel);
}, "Allows you to promote a new trivia super admin, use /striviasuperadmin for a silent promotion.");

addServerOwnerCommand(["triviasuperadminoff", "striviasuperadminoff"], function (src, commandData, channel, command) {
    if (!tsadmin.isTAdmin(commandData)) {
        Trivia.sendPM(src, "That person isn't a Trivia Super Admin.", channel);
        return;
    }
    tsadmin.removeTAdmin(commandData);
    if (command === "triviasuperadminoff") {
        Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from Super Trivia Admin.", triviachan);
    }
    Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from Super Trivia Admin.", revchan);
    Trivia.sendAll(sys.name(src) + " demoted " + commandData.toCorrectCase() + " from Super Trivia Admin.", sachannel);
}, "Allows you to demote a current trivia super admin, use /striviasuperadminoff for a silent demotion.");

addUserCommand("start", function (src, commandData) {
    Trivia.startTrivia(src, commandData);
}, "Allows you to start a trivia game, format /start [number][*category1][*category2][...] leave number blank for random. Only Trivia Admins may start Category Games");

addUserCommand("lastcat", function (src, commandData, channel) {
    if (lastCatGame === 0) {
        Trivia.sendPM(src, "There hasn't been a Category Game since Trivia was last updated.", channel);
        return;
    }
    Trivia.sendPM(src, "The last Category Game occurred " + lastCatGame + " games ago, with categories: " + lastUsedCats.join(", "), channel);
}, "Allows you to check when the last Category Game occurred");

addAdminCommand("end", function (src) {
    Trivia.endTrivia(src);
}, "Allows you to end a current trivia game");

addAdminCommand("suggest", function (src, commandData, channel) {
    if (Trivia.started === false) {
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
}, "Allows you to suggest a question to be asked next in Trivia. Format /suggest ID.");

addAdminCommand("say", function (src, commandData, channel) {
    if (commandData === "")
        return;
    Trivia.sendAll("(" + sys.name(src) + "): " + commandData, channel);
}, "Allows you to talk during the answer period");

/*addOwnerCommand("makebackup", function(src, commandData, channel) {
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

addOwnerCommand("updateafter", function (src, commandData, channel) {
    triviabot.sendMessage(src, "Trivia will update after the game", channel);
//    Trivia.autostart = false;
    Trivia.needsUpdating = true;
    if (Trivia.started === false) {
        runUpdate();
    }
    return;
}, "Updates trivia after the current game is over");

/*addOwnerCommand("basestatquestions", function (src, commandData, channel) { //this should maybe be removed later!
    var pokemon = ["Terrakion", "Politoed", "Ferrothorn", "Tentacruel", "Espeon", "Mamoswine", "Gyarados", "Heatran", "Ninetales", "Tyranitar", "Darmanitan", "Snorlax", "Mienshao", "Chandelure", "Raikou", "Nidoking", "Kingdra", "Arcanine", "Crobat", "Gligar", "Slowking", "Sceptile", "Steelix", "Tangrowth", "Gallade", "Clefable", "Tornadus", "Sandslash", "Miltank", "Qwilfish", "Crustle", "Sawk", "Exeggutor", "Bisharp", "Torkoal", "Emboar", "Klinklang", "Regirock", "Tauros", "Pinsir", "Mienfoo", "Porygon", "Abra", "Houndour", "Snover"];
    var baseStats = ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"];
    var pokenum = pokemon.map(sys.pokeNum);
    pokenum.forEach(function (num) {
        for (var x = 0; x < 6; x++) {
            triviaq.add("Pokemon", "What is " + sys.pokemon(num) + "'s base " + baseStats[x] + " stat?", sys.pokeBaseStats(num)[x]);
        }
    });
    triviabot.sendMessage(src, "Base stat questions added! Remember to /savedb");
    return;
}, "Adds the base stat questions to trivia"); */

addOwnerCommand("addwordwarn", function (src, commandData) {
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
}, "Adds an answer warning to trivia");

addOwnerCommand("removewordwarn", function (src, commandData) {
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
}, "Removes a warning from trivia");

addAdminCommand("flashtas", function (src, commandData, channel) {
    if ([revchan, sachannel].indexOf(channel) === -1) {
        Trivia.sendPM(src, "Please only use /flashtas in TrivReview or Victory Road!", channel);
        return;
    }
    var message = (commandData === "" ? "Flashing all Trivia Admins!" : commandData);
    sys.sendAll(sys.name(src).toCorrectCase() + ": " + message, channel);
    var admins = [tadmin, tsadmin];
    for (var auth = 0; auth < admins.length; auth++) {
        for (var i = 0; i < admins[auth].admins.length; i++) {
            if (sys.id(admins[auth].admins[i]) !== undefined) {
                sys.sendHtmlMessage(sys.id(admins[auth].admins[i]), "<font color='#3DAA68'><timestamp/> <b>±" + triviabot.name + ":</b></font> <b>You're needed in this channel!</b><ping/>", channel);
            }
        }
    }
}, "Pings all online Trivia Admins. Use with /flashtas [phrase]. Abuse will be punished");

/*addOwnerCommand("revertfrom", function(src, commandData, channel) {
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

addAdminCommand("apropos", function (src, commandData, channel) {
    if (commandData === undefined)
        return;
    Trivia.sendPM(src, "Matching questions with '" + commandData + "' are: ", channel);
    var all = triviaq.all(),
        b, q, output = [];
    for (b in all) {
        q = triviaq.get(b);
        var answer = String(q.answer);
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase()) > -1 || answer.toLowerCase().indexOf(commandData.toLowerCase()) > -1) {
            output.push("Question: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + b + "')");
        }
    }
    all = trivreview.all();
    for (b in all) {
        q = trivreview.get(b);
        var answer = String(q.answer);
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase()) > -1 || answer.toLowerCase().indexOf(commandData.toLowerCase()) > -1) {
            output.push("Question under review: '" + q.question + "' Category: '" + q.category + "' Answer: '" + q.answer + "' (id='" + b + "')");
        }
    }
    var x = 0;
    while (x < output.length && x !== 50) {
        Trivia.sendPM(src, output[x], channel);
        x += 1;
    }
    if (x === 50) { //maybe add a configurable value in the future
        Trivia.sendPM(src, "Too many results were found for this query", channel); //possibly add a way to show more results
    }

}, "Allows you to search through the questions, format /apropos [query]");

addAdminCommand("apnumber", function (src, commandData, channel) {
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
}, "Counts how many questions fit an /apropos search");

addAdminCommand("category", function (src, commandData, channel) {
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
}, "Shows how many questions are in a specified category");

addAdminCommand("listc", function (src, commandData, channel) {
    var categories = orderedCategories();
    Trivia.sendPM(src, "All currently used categories:", channel);
    for (var x = 0; x < categories.length; x++) {
        var object = categories[x];
        Trivia.sendPM(src, object.category + " - " + object.count + " questions.", channel);
    }
}, "Lists every category currently used and the amount of questions in each.");

addAdminCommand("showqinc", function (src, commandData, channel) {
    if (commandData === undefined)
        return;
    Trivia.sendPM(src, "Questions in " + commandData + " category are:", channel);
    var count = 0;
    for (var i in triviaq.all()) {
        var q = triviaq.get(i);
        if (commandData.toLowerCase() === q.category.toLowerCase()) {
            Trivia.sendPM(src, "Question: '" + q.question + "' Answer: '" + q.answer + "' (id='" + i + "')", channel);
            count++;
            if (count === 50) {
                Trivia.sendPM(src, "Too many results were found for this query.", channel);
                return;
            }
        }
    }
}, "Lists every question in the specified category.");

addOwnerCommand("changeallc", function (src, commandData, channel) {
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
}, "Changes all questions from one category to another. Format: /changeallc oldcat*newcat.");

addAdminCommand("checkq", function (src, commandData, channel) {
    PMcheckq(src, channel);
}, "Allows you to check the current question in review");

addAdminCommand("changea", function (src, commandData) {
    if (trivreview.editingMode === true) {
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
    triviabot.sendMessage(src, "No question");
}, "Allows you to change an answer to a question in review, format /changea newanswer");

addAdminCommand("changeq", function (src, commandData) {
    if (trivreview.editingMode === true) {
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
    triviabot.sendMessage(src, "No question");
}, "Allows you to change the question to a question in review, format /changeq newquestion");

addAdminCommand("changec", function (src, commandData) {
    if (trivreview.editingMode === true) {
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
    triviabot.sendMessage(src, "No question");
}, "Allows you to change the category to a question in review, format /changec newcategory");

addAdminCommand("pushback", function (src, commandData, channel) {
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
        trivreview.add(q.category, q.question, q.answer, q.name);
        trivreview.remove(id);
        trivreview.checkq(id + 1);
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Allows you to push back a question");

addAdminCommand("accept", function (src, commandData, channel) {
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
        triviabot.sendAll(sys.name(src) + " accepted question: id: " + qid + ", category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, revchan);
        trivreview.declineTime = time();
        trivreview.remove(id);
        trivreview.checkq(id + 1);
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Allows you to accept the current question in review");

addAdminCommand("showq", function (src, commandData, channel) {
    var q = triviaq.get(commandData);
    if (q !== null) {
        triviabot.sendMessage(src, "Question ID: " + commandData + ", Question: " + q.question + ", Category: " + q.category + ", Answer(s): " + q.answer, channel);
        return;
    }
    triviabot.sendMessage(src, "This question does not exist", channel);
}, "Allows you to see an already submitted question");

addAdminCommand("editq", function (src, commandData, channel) {
    var q = triviaq.get(commandData);
    var id = -1;
    if (trivreview.get(id)) {
        id = Object.keys(trivreview.all()).sort(function (a, b) {
            return a - b;
        })[0] - 1;
    }
    if (Trivia.roundQuestion === commandData) {
        triviabot.sendMessage(src, "This question is currently being asked. Please wait before editing");
        return;
    }
    if (q !== null) {
        triviaq.remove(commandData);
        trivreview.state.questions.add(id, q.category + ":::" + q.question + ":::" + q.answer + ":::" + sys.name(src));
        triviabot.sendAll(sys.name(src) + " placed a question at the top of the review queue.", revchan);
        trivreview.checkq();
        return;
    }
    triviabot.sendMessage(src, "This question does not exist", channel);
}, "Allows you to edit an already submitted question");

addAdminCommand("decline", function (src, commandData, channel) {
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
        triviabot.sendAll(sys.name(src) + " declined question: category: " + q.category + ", question: " + q.question + ", answer: " + q.answer, revchan);
        trivreview.declineTime = time();
        trivreview.remove(id);
        trivreview.checkq(id + 1);
        return;
    }
    triviabot.sendMessage(src, "No more questions!", channel);
}, "Allows you to decline the current question in review");

addAdminCommand("submitban", function (src, commandData, channel) {
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
}, "Ban a user from submitting, format /submitban user:reason:time.");

addAdminCommand("submitunban", function (src, commandData, channel) {
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

addAdminCommand("submitbans", function (src, commandData, channel) {
    showTrivia(src, channel, "submitBans");
}, "View submit bans.");

addAdminCommand("wordwarns", function (src, commandData, channel) {
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

addAdminCommand("triviamute", function (src, commandData, channel) {
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
}, "Trivia mute a user, format /triviamute user:reason:time.");

addAdminCommand("triviaunmute", function (src, commandData, channel) {
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

addAdminCommand("triviamutes", function (src, commandData, channel) {
    showTrivia(src, channel, "mutes");
}, "View trivia mutes.");

addAdminCommand("startrange", function (src, commandData, channel) {
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

addAdminCommand("passta", function (src, commandData, channel) {
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
    if (isTriviaOwner(src)) {
        tsadmin.removeTAdmin(oldname);
        tsadmin.addTAdmin(newname);
        sTA = true,
    } else {
        tadmin.removeTAdmin(oldname);
        tadmin.addTAdmin(newname);
    }
    Trivia.sendAll(sys.name(src) + " passed their " + (sTA ? "Trivia Owner powers" : "Trivia auth") + " to " + commandData, sachannel);
    Trivia.sendAll(sys.name(src) + " passed their " + (sTA ? "Trivia Owner powers" : "Trivia auth") + " to " + commandData, revchan);
    triviabot.sendMessage(src, "You passed your Trivia auth to " + commandData.toCorrectCase() + "!", channel);
    return;
}, "To give your Trivia Admin powers to an alt.");


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
            commandData = ""; // sane default to avoid undefined errors
        }
        // Only care about trivia channels
        if (channel != triviachan && channel != revchan && ["triviamute", "triviaunmute", "flashtas", "triviaadmins", "tadmins", "tas"].indexOf(command) == -1)
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
    },

    beforeChannelLeave: function trivia_beforeChannelLeave(src, channel) {
        if (Trivia.started === true && channel === triviachan) {
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
        if (Trivia.started === true) {
            if (joined === false && Trivia.phase === "answer") {
                Trivia.sendPM(src, "You haven't joined, so you are unable to submit an answer. Type /join to join.", channel);
                return true;
            }
        }
        if (joined === true && Trivia.started === true && Trivia.phase === "answer") {
            if (message.length > 60) {
                Trivia.sendPM(src, "Sorry! Your answer is too long.", channel);
                return true;
            }
            // Remove commas so the listing looks better
            // This is fine as no answers should include comma.
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
        }
        //Trivia.sendAll("Trivia is now running!");
    },
    
    stepEvent: function trivia_step() {
        SESSION.global().Trivia = Trivia;
        Trivia.stepHandler();
    },
    
    "help-string": ["trivia: To know the trivia commands"]
};
