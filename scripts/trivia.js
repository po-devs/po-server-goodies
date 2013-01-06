/*
    * trivia.js
        - Plugin on Pokémon Online servers for Trivia Games
        - Script done with the help of Ethan, Lamperi, and Crystal Moogle
    * Files used:
        - trivData.json
        - triviaq.json
        - trivreview.json
        - tadmins.txt
        - backupQuestions.json, backupReview.json
*/

var Bot = require("bot.js").Bot;
var utilities = require("utilities.js");

var triviachan, revchan;
var triviabot = new Bot("Psyduck");

var triviaCategories = ['Anime/Manga','Animals','Art','Comics','Economics','Food/Drink','Games','Geography','History','Internet','Language','Literature','Math','Misc','Movies','Music','Mythology','Philosophy','PO','Pokemon','Politics','Psychology','Religion','Science','Society','Space','Sports','Technology','TV','Video Games'];

var neededFiles = ["triviaq.json", "trivreview.json"];
for (var i in neededFiles) {
    var fileName = neededFiles[i];
	if (sys.getFileContent(fileName) == "" || sys.getFileContent(fileName) == undefined) {
		sys.writeToFile(fileName, "{}");
	}
}

if (typeof(Trivia) != 'object' || Trivia.started == false) {
	Trivia = new TriviaGame();
}

triviaq = new QuestionHolder("triviaq.json"),
trivreview = new QuestionHolder("trivreview.json"),
tadmin = new TriviaAdmin("tadmins.txt");

try {
	trivData = JSON.parse(sys.getFileContent("trivData.json"));
} catch (e) {
	trivData = {};
}

var neededData = ["submitBans", "toFlash", "mutes", "leaderBoard"];
for (var i = 0; i < neededData.length; ++i) {
    var data = neededData[i];
    if (trivData[data] == undefined) {
        switch(data) {
            case 'leaderBoard':
                trivData[data] = [];
            break;
            default:
                trivData[data] = {};
        }
    }
}

var utilities = require("utilities.js");
var nonFlashing = utilities.non_flashing,
getSeconds = utilities.getSeconds,
getTimeString = utilities.getTimeString;

/*function calculateLeaderboardPoints(place, goal) {
    var first = place == 1, second = place == 2, third = place == 3;
    var ret = 0;
    if (goal > 1 && goal < 16) {
        if (first) ret = 1;
        if (second) ret = 0;
        if (third) ret = 0;
    } else if (goal > 15 && goal < 31) {
        if (first) ret = 2;
        if (second) ret = 1;
        if (third) ret = 0;
    } else if (goal > 30 && goal < 46) {
        if (first) ret = 3;
        if (second) ret = 2;
        if (third) ret = 1;
    } else if (goal > 45 && goal < 61) {
        if (first) ret = 4;
        if (second) ret = 3;
        if (third) ret = 2;
    } else if (goal > 60 && goal < 75) {
        if (first) ret = 6;
        if (second) ret = 4;
        if (third) ret = 2;
    } else {
        if (first) ret = 8;
        if (second) ret = 5;
        if (third) ret = 3;
    }
    return ret;
};*/

function isTrivia(data, ip) {
    var which = {"submitbanned" : "submitBans", "muted" : "mutes"}[data];
    if (trivData[which][ip] == undefined) {
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
    var whichName = {"mutes" : "mutes", "submitBans" : "Submit Bans"}[what];
    var name = "Trivia " + whichName;
    var width = 5;
    var max_message_length = 30000;
    var tmp = [];
    var t = parseInt(sys.time(), 10);
    var toDelete = [];
    for (ip in trivData[what]) {
        var which = {"submitBans" : "submitbanned", "mutes" : "muted"}[what];
        if (!isTrivia(which, ip)) continue;
        current = trivData[what][ip], banned_name = current.name, by = current.by, banTime = current.issued, expires = current.expires, reason = current.reason;
        tmp.push([ip, banned_name, by, (banTime === 0 ? "unknown" : getTimeString(t-banTime)), (expires === "never" ? "never" : getTimeString(expires-t)), utilities.html_escape(reason)]);
    }
    tmp.sort(function(a,b) { return a[3] - b[3];});
    // generate HTML
    var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
    var table_footer = '</table>';
    var table = table_header;
    var line;
    var send_rows = 0;
    while(tmp.length > 0) {
        line = '<tr><td>'+tmp[0].join('</td><td>')+'</td></tr>';
        tmp.splice(0,1);
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

/*function updateLeaderboard(game) {
    if (typeof(game.winners) === "undefined") throw "";
    var winners = game.winners, goal = game.goal;
    var currentLeaderboard = trivData.leaderBoard;
    var currentLeaderboardIps = {};
    var currentGamePoints = {};
    var newLeaderboard = [];
    var wereInGame = [];
    for (var i = 0; i < winners.length; ++i) { wereInGame.push(sys.dbIp(winners[i][0])); }
    for (var i = 0; i < currentLeaderboard.length; ++i) { currentLeaderboardIps[sys.dbIp(currentLeaderboard[i][0])] = currentLeaderboard[i][1]; }
    var sorted = winners.sort(function(a,b) { return b[1]-a[1]; });
    if (currentLeaderboard.length > 0) {
        for (var i = 0; i < currentLeaderboard.length; ++i) {
            var current = currentLeaderboard[i];
            var name = current[0], points = current[1];
            if (wereInGame.indexOf(sys.dbIp(name)) == -1) newLeaderboard.push([name, points]);
        }
    }
    var end = winners.length > 3 ? 3 : winners.length;
    for (var i = 0; i < end; ++i) {
        var j = i+1;
        var current = sorted[i];
        var place = j, name = current[0], points = current[1];
        if (currentLeaderboardIps[sys.dbIp(name)] == undefined)
        var oldPoints = 0;
            else
        var oldPoints = parseInt(currentLeaderboardIps[sys.dbIp(name)]);
        var points = calculateLeaderboardPoints(place, goal);
        newLeaderboard.push([name, oldPoints + points]);
    }
    trivData.leaderBoard = newLeaderboard;
    saveData();
}*/

function saveData()
{
	sys.writeToFile("trivData.json", JSON.stringify(trivData));
}

function isTriviaOwner(src) {
	var lname = sys.name(src).toLowerCase();
    var triviaOwners = ['ethan', 'steeledges', 'redjoker25'];
	if (sys.auth(src) >= 3) return true;
	if (triviaOwners.indexOf(lname) > -1) return true;
	return false;
}

function canUseReviewCommands(name) {
    var id = sys.id(name);
    var contribs = id != undefined ? SESSION.users(id).contributions !== undefined : false;
    var cauth = false;
    if (id !== undefined) cauth = SESSION.channels(revchan).canJoin(id) == "allowed";
    return cauth == true || contribs == true;
}

/*function canShowOnLeaderboard(ip) {
    if (sys.maxAuth(ip) > 0) return false;
    var aliases = sys.aliases(ip);
    for (var i = 0; i < aliases.length; ++i) {
        var alt = aliases[i];
        if (canUseReviewCommands(alt) || tadmin.isTAdmin(alt)) return false;
    }
    return true;
}*/

function time()
{
    return Date.now()/1000;
}

function TriviaGame()
{
    this.id = triviachan;
    this.round = 0;
    this.started = false;
    this.maxPoints = 0;
    this.alreadyUsed = {};
	//this.alreadyUsedCat = {}; //uncomment when proper defined categories are added
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.roundQuestion = 0;
    this.answeringQuestion = false;
    this.triviaPoints = "";
    this.startoff = false;
    this.autostart = false;
    if (this.lastStopped === undefined)
        this.lastStopped = time();
}

TriviaGame.prototype.htmlAll = function(html)
{
    sendChanHtmlAll(this.tBorder() + "<center>" + html + "</center>" + this.tBorder(), triviachan);
};

TriviaGame.prototype.sendPM = function(src, message, channel)
{
    triviabot.sendMessage(src, message, channel === undefined ? this.id : channel);
};

TriviaGame.prototype.sendAll = function(message, channel)
{
   triviabot.sendAll(message, channel === undefined ? triviachan : channel);
};

TriviaGame.prototype.startGame = function(points, name)
{
	if (this.started == true) return;
	if (this.startoff == true) return;
	if (triviaq.questionAmount() < 1) return;
	var x = time() - this.lastStopped;
	if (x < 16) return;
	if (name == "" && this.autostart == false) return;
	this.maxPoints = points;
	this.started = true;
	sendChanAll("", 0);
	sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:",0)
	this.sendAll("A #Trivia game was started! First to "+points+" points wins!",0);
	sendChanAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:",0)
	sendChanAll("", 0);
	this.sendAll((name != "" ? name+" started a Trivia game! " : "A trivia game was started! ") + " First to "+points+" points wins!",triviachan);
    var players = sys.playersOfChannel(triviachan);
    // Flash players who have it enabled
    for (var p in players) {
    	player_id = players[p], player_ip = sys.ip(player_id);
    	if (trivData.toFlash[player_ip] !== undefined)
    	sys.sendHtmlMessage(player_id, "<ping/>", triviachan);
    }
    this.answeringQuestion = false;
	sys.delayedCall(function() { Trivia.startTriviaRound(); },15);
};

TriviaGame.prototype.startTrivia = function(src,rand)
{
    if (this.started === true)
    {
        this.sendPM(src,"A trivia game has already started!", triviachan);
        return;
    }
    if (this.startoff == true) {
    	this.sendPM(src, "/start is off. Most likely because Trivia is being updated.", triviachan);
    	return;
    }
    var x = time() - this.lastStopped;
    if (x < 16){
        this.sendPM(src,"Sorry, a game was just stopped "+parseInt(x)+" seconds ago.", triviachan);
        return;
    }
    if (triviaq.questionAmount() < 1)
    {
        this.sendPM(src,"There are no questions.", triviachan);
        return;
    }
    rand = parseInt(rand, 10);
	if (rand > 102 || rand < 2)
    {
        this.sendPM(src,"Please do not start a game with more than 102 points, or lower than 2 points.", triviachan);
        return;
    }
    rand = (isNaN(rand)) ? sys.rand(2,102) : +rand;
    this.startGame(rand, sys.name(src));
};

TriviaGame.prototype.startTriviaRound = function()
{
    if (this.started === false)
        return;
    /* Reset submittedAnswers */
    this.submittedAnswers = {};
    /* Advance round */
    this.round++;
    /* Make a random number to get the ID of the (going to be) asked question */
    var questionNumber = triviaq.randomId();
    if (this.alreadyUsed.hasOwnProperty(questionNumber)) {
        sys.delayedCall(function() { Trivia.startTriviaRound(); }, 1);
        return;
    }
    /* Get the category, question, and answer */
    var q = triviaq.get(questionNumber);
    var category = q.category,
        question = q.question,
        answer = q.answer;
	/*if(this.alreadyUsedCat.hasOwnProperty(category)){
		sys.delayedCall(function() { Trivia.startTriviaRound(); }, 1);
        return;
    }*/
	this.answeringQuestion = true;
    this.roundQuestion = questionNumber;
    this.htmlAll("<b>Category:</b> "+category.toUpperCase()+"<br>"+question);
    this.alreadyUsed[questionNumber] = true;
	//this.alreadyUsedCat[category] = true
	/*sys.delayedCall(function() {
		if(Trivia.started !== false){
			delete(Trivia.alreadyUsedCat[category])
		}
	},240)*/ //time is placeholder, maybe make it by round number instead?
    sys.delayedCall(function() {
        Trivia.finalizeAnswers();
    }, 10);
};

TriviaGame.prototype.finalizeAnswers = function()
{
    if (this.started === false)
        return; 
    var answer, id,answers = [].concat(triviaq.get(this.roundQuestion).answer);        
    this.answeringQuestion = false;
    var wrongAnswers = [],
        answeredCorrectly = [];
    var ignoreCaseAnswers = answers.map(function(s) {
        return String(s).toLowerCase();
	});
    for (id in this.submittedAnswers)
    {
        var name = this.submittedAnswers[id].name;
        if (sys.id(name) !== undefined && this.player(name) !== null) {
            answer = this.submittedAnswers[id].answer.toLowerCase();
            if (ignoreCaseAnswers.indexOf(answer) != -1)
            {
                var responseTime = this.submittedAnswers[id].time;
                var realTime = time();
                var minus = realTime - responseTime;
                var pointAdd = minus > 6 ? 5 : (minus < 7 && minus > 3 ? 3 : 2);
                answeredCorrectly.push(name);
                this.player(name).points += pointAdd;
            } else {
            	var tanswer = this.submittedAnswers[id].answer;
                wrongAnswers.push("<span title='" + utilities.html_escape(name) + "'>" + utilities.html_escape(tanswer) + "</span>");
                if (/asshole|\bdick\b|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger|fuck|\banus|boner|\btits\b|condom|\brape\b/gi.test(tanswer)) {
                    if (sys.existChannel("Victory Road"))
                        triviabot.sendAll("Warning: Player "+name+" answered '"+tanswer+"' to the question '"+triviaq.get(this.roundQuestion).question+"' in #Trivia", sys.channelId("Victory Road"));
                    triviabot.sendAll("Warning: Player "+name+" answered '"+tanswer+"' to the question '"+triviaq.get(this.roundQuestion).question+"' in #Trivia", revchan);
                }
            }
        }
    }
    sendChanAll("", triviachan);
    var incorrectAnswers  = wrongAnswers.length > 0 ? " Incorrect answers: "+ wrongAnswers.join(", ") : "";
    sendChanHtmlAll("<font color='#3daa68'><timestamp/> <b>±Psyduck:</b></font> Time's up!" + incorrectAnswers, triviachan);
    this.sendAll("Answered correctly: " + answeredCorrectly.join(", "),triviachan);
    var x = answers.length != 1 ? "answers were" : "answer was";
    sendChanHtmlAll("<font color='#3daa68'><timestamp/> <b>±Psyduck:</b></font> The correct "+x+": <b>"+answers.join(", ")+"</b>",triviachan);

    var leaderboard = [];
    var displayboard = [];
    var winners = [];
    /*var obj = {};
    obj.winners = [];
    obj.goal = this.maxPoints;*/
    for (id in this.triviaPlayers)
    {
        var regname = this.triviaPlayers[id].name;
        var numPoints = this.triviaPlayers[id].points;
        var nohtmlname = utilities.html_escape(regname);
        leaderboard.push([regname,numPoints]);
        if (this.triviaPlayers[id].points >= this.maxPoints)
        {
            winners.push(nohtmlname + " (" + this.triviaPlayers[id].points + ")");
            //obj.winners.push([regname, numPoints]);
        }
    }
	leaderboard.sort(function(a,b) { return b[1]-a[1]; });
    for (var x in leaderboard){
        displayboard.push(leaderboard[x][0] + " (" + leaderboard[x][1] + ")")
    }
    this.sendAll("Leaderboard: "+displayboard.join(", "),triviachan);

    if (winners.length > 0) {
        var w = (winners.length == 1) ? "the winner!" : "our winners!";
        winners.sort(function(a,b) { return b[1]-a[1]; });
        this.htmlAll("<h2>Congratulations to "+w+"</h2>"+winners.join(", ")+"");
		sendChanHtmlAll("<font size=5><font color='#3daa68'><timestamp/> <b>±Psyduck: </b><font color='red'>While you're waiting for another game, why not submit a question? <a href='http://wiki.pokemon-online.eu/wiki/Community:Trivia#Submitting_Questions'>Help and Guidelines are here!</a></font></font></font>", triviachan);
        //updateLeaderboard(obj);
        this.resetTrivia();
        runUpdate();
        if (this.autostart == true) {
        	pointsForGame = sys.rand(5,45), toStart = sys.rand(30,44);
        	Trivia.sendAll("A new trivia game will be started in "+toStart+" seconds!", triviachan);
        	sys.delayedCall(function() {
        		Trivia.startGame(pointsForGame, "");
        	}, toStart);
        	return;
        }
        return;
    }
    if (Object.keys(this.alreadyUsed).length >= triviaq.questionAmount())
    {
        this.htmlAll("There are no more questions to show! Ask a TA to add more!<br/>The game automatically ended.");
        this.resetTrivia();
        runUpdate();
        return;
    }
    var rand = sys.rand(17,30);
    this.sendAll("Please wait " + rand + " seconds until the next question!",triviachan);
    sys.delayedCall(function() {
        Trivia.startTriviaRound();
    }, rand);
};

TriviaGame.prototype.resetTrivia = function()
{
    this.started = false;
    this.round = 0;
    this.maxPoints = 0;
    this.alreadyUsed = {};
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.roundQuestion = 0;
    this.answeringQuestion = false;
    this.lastStopped = time();
};

TriviaGame.prototype.key = function(src)
{
    if (typeof src == "string")
        return src.toLowerCase();
    else
        return sys.name(src).toLowerCase();
};

TriviaGame.prototype.unjoin = function(src)
{
    if (this.started === false)
    {
        this.sendPM(src,"A game hasn't started!",triviachan);
        return;
    }
    if (this.playerPlaying(src)) {
        this.removePlayer(src);
        this.sendAll(sys.name(src) + " left the game!",triviachan);
    } else {
        this.sendPM(src,"You haven't joined the game!",triviachan);
    }
};

TriviaGame.prototype.endTrivia = function(src)
{
    if (this.started === false)
    {
        this.sendPM(src,"A game hasn't started.",triviachan);
        return;
    }
    this.resetTrivia();
    runUpdate();
    this.sendAll(sys.name(src)+" stopped the current trivia game!",triviachan);
    return;
};

TriviaGame.prototype.tBorder = function()
{
    return "<hr><br/>";
};

TriviaGame.prototype.player = function(src)
{
    var key  = this.key(src);
    return this.triviaPlayers.hasOwnProperty(key) ? this.triviaPlayers[key] : null;
};

TriviaGame.prototype.playerPlaying = function(src)
{
    var key = this.key(src);
    return this.triviaPlayers.hasOwnProperty(key);
};

TriviaGame.prototype.addPlayer = function(src)
{
    var key = this.key(src);
    if (!this.triviaPlayers.hasOwnProperty(key)) {
        this.triviaPlayers[key] = {name: sys.name(src), points: 0};
    }
};

TriviaGame.prototype.removePlayer = function(src)
{
    var key = this.key(src);
    if (this.triviaPlayers.hasOwnProperty(key)) {
        delete this.triviaPlayers[key];
    }
};

TriviaGame.prototype.addAnswer = function(src, answer) {
    var key = this.key(src);
    this.submittedAnswers[key] = {name: sys.name(src), answer: answer, time: time()};
};

function QuestionHolder(f)
{
    this.file = f;
    this.state = {freeId: 0, questions: {}};
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        this.saveQuestions();
    } else {
        try
        {
            var state = JSON.parse(fileContent);
            if (state.questions !== undefined && state.freeId !== undefined)
            {
                this.state = state;
            }
        }
        catch(e) {
            sys.sendAll("Error loading Trivia questions: "+e, revchan);
        }
    }
}

QuestionHolder.prototype.add = function(category,question,answer,name)
{
	var id = this.unsafeAdd(category,question,answer,name);
	this.saveQuestions();
	return id;
};

QuestionHolder.prototype.unsafeAdd = function(category,question,answer,name)
{
	var id = this.freeId();
    var q = this.state.questions[id] = {};
    q.category = category;
    q.question = question;
    q.answer = [].concat(answer);
	if(typeof(name)!==undefined){
		q.name = name;
	}
    return id;
};

QuestionHolder.prototype.remove = function(id)
{
    delete this.state.questions[id];
    this.saveQuestions();
};

QuestionHolder.prototype.unsafeRemove = function(id)
{
    delete this.state.questions[id];
};

QuestionHolder.prototype.checkq = function(id)
{
	if(trivreview.editingMode === true){
		sendChanAll("", revchan);
		triviabot.sendAll("This question needs to be reviewed:",revchan);
		triviabot.sendAll("EDITING MODE: USE THE CHANGE COMMANDS TO EDIT AND THEN /ACCEPT OR /DECLINE TO DELETE",revchan);
		triviabot.sendAll("Category: "+trivreview.editingCategory,revchan);
		triviabot.sendAll("Question: "+trivreview.editingQuestion,revchan);
		triviabot.sendAll("Answer: "+trivreview.editingAnswer,revchan);
		triviabot.sendAll("Questions Approved: "+triviaq.questionAmount()+". Questions Left: "+ trivreview.questionAmount()+".", revchan);
		sendChanAll("",revchan);
        return;
	}
	if (trivreview.questionAmount() === 0)
    {
        triviabot.sendAll("There are no more questions to be reviewed.", revchan);
        return;
    }
	var q = trivreview.all();
	var questionId = Object.keys(q)[0];
	var questionInfo = trivreview.get(questionId);
	if (questionId === undefined || questionInfo === undefined)
	{
		triviabot.sendAll("Oops! There was an error.",revchan);
		return;
	}
	sendChanAll("",revchan);
	triviabot.sendAll("This question needs to be reviewed:",revchan);
	triviabot.sendAll("ID: "+questionId,revchan);
	triviabot.sendAll("Category: "+questionInfo.category,revchan);
	triviabot.sendAll("Question: "+questionInfo.question,revchan);
	triviabot.sendAll("Answer: "+questionInfo.answer,revchan);
	triviabot.sendAll("Questions Approved: "+triviaq.questionAmount()+". Questions Left: "+ trivreview.questionAmount()+".", revchan);
	if(questionInfo.name !== undefined){
		triviabot.sendAll("Submitted By: "+questionInfo.name,revchan);
	}
	sendChanAll("",revchan);
};

QuestionHolder.prototype.get = function(id)
{
    var q = this.state.questions[id];
    return q === undefined ? null : q;
};

QuestionHolder.prototype.questionAmount = function()
{
    return Object.keys(this.state.questions).length;
};

QuestionHolder.prototype.freeId = function()
{
    return this.state.freeId++;
};

QuestionHolder.prototype.randomId = function()
{
    var keys = Object.keys(this.state.questions);
    return keys[Math.floor(Math.random() * keys.length)];
};

QuestionHolder.prototype.changeCategory = function(id,category)
{
    this.state.questions[id].category = category;
    this.saveQuestions();
};

QuestionHolder.prototype.changeQuestion = function(id,question)
{
    this.state.questions[id].question = question;
    this.saveQuestions();
};

QuestionHolder.prototype.changeAnswer = function(id,answer)
{
    this.state.questions[id].answer = answer;
    this.saveQuestions();
};

QuestionHolder.prototype.saveQuestions = function() {
	sys.writeToFile(this.file, JSON.stringify(this.state));
}

QuestionHolder.prototype.all = function(src)
{
    return this.state.questions;
};

function TriviaAdmin(file)
{
    this.file = file;
    this.admins = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
		sys.writeToFile(file, "[]");
    }
    try {
        this.admins = JSON.parse(fileContent);
    } catch(e) {
        sys.sendAll("Error loading Trivia Admins: "+e, revchan);
    }
}

TriviaAdmin.prototype.addTAdmin = function(name)
{
    if (this.isTAdmin(name))
    return;
    this.admins.push(name.toLowerCase());
    this.saveAdmins();
};

TriviaAdmin.prototype.removeTAdmin = function(name)
{
    if (!this.isTAdmin(name))
        return;
    var ind = this.admins.indexOf(name.toLowerCase());
    this.admins.splice(ind, 1);
    this.saveAdmins();
};

TriviaAdmin.prototype.saveAdmins = function() {
	sys.writeToFile(this.file, JSON.stringify(this.admins));
}

TriviaAdmin.prototype.isTAdmin = function(name)
{
    return this.admins.indexOf(name.toLowerCase()) != -1;
};

TriviaAdmin.prototype.tAdminList = function(src,id)
{
    var tadmins = []
    for (var a in this.admins) {
        tadmins.push(this.admins[a] + (sys.id(this.admins[a]) == undefined ? "" : ":"));
    }
	tadmins.sort()
    sys.sendMessage(src, "" ,id);
    sys.sendMessage(src, "*** TRIVIA ADMINS ***" ,id);
    sys.sendMessage(src, "" ,id);
    for(var b in tadmins){
        sys.sendMessage(src, tadmins[b], id)
    }
    sys.sendMessage(src, "" ,id);
};

// Commands
var userCommands = {};
var adminCommands = {};
var ownerCommands = {};
var commandHelp = [];
function addCommand(ds, commands, callback, help)
{
    commands = [].concat(commands);
    for (var i = 0; i < commands.length; ++i) {
        ds[commands[i]] = callback;
    }
    commandHelp.push("/" + commands[0] + ": " + (help === undefined ? "no help": help));
}

function addUserCommand(commands, callback, help)
{
    return addCommand(userCommands, commands, callback, help);
}
function addAdminCommand(commands, callback, help)
{
    return addCommand(adminCommands, commands, callback, help);
}
function addOwnerCommand(commands, callback, help) {
    return addCommand(ownerCommands, commands, callback, help);
}

addOwnerCommand("resetleaderboard", function(src,commandData,channel){
    triviabot.sendMessage(src, "The trivia leaderboard was reset!", channel);
    trivData.leaderBoard = [];
    saveData();
},"Reset the Trivia leaderboard.");

/*addUserCommand("leaderboard", function(src, commandData, channel) {
    sys.sendMessage(src, "*** TRIVIA LEADERBOARD ***", channel);
    var leaderboard = trivData.leaderBoard;
    if (leaderboard.length < 1) return;
    leaderboard.sort(function(a,b) { return b[1]-a[1]; });
    var limit = leaderboard.length > 10 ? 10 : leaderboard.length;
    var usedIps = []; // Leaderboard now should disclude multiple IPs, but this is here just in case
    for (var i = 0; i < limit; ++i) {
        var current = leaderboard[i];
        var name = current[0];
        var points = parseInt(current[1]);
        var plural = points == 1 ? "" : "s";
        var ip = sys.dbIp(name);
        var num = i;
        if (name == undefined || points == undefined || isNaN(points) || points < 1 || usedIps.indexOf(ip) > -1 || !canShowOnLeaderboard(sys.dbIp(name))) {
            num--;
            continue;
        }
        sys.sendMessage(src, "#"+parseInt(num+1) + ": " + name + " ~ " + points + " point" + plural, channel);
        usedIps.push(ip);
    }
}, "View the Trivia leaderboard");*/

addUserCommand("categories", function(src,commandData,channel) {
	if (typeof(triviaCategories) != "object") return;
    triviabot.sendMessage(src, triviaCategories.join(", "), channel);
    triviabot.sendMessage(src, "For more information, refer to: http://wiki.pokemon-online.eu/wiki/Trivia_Categories", channel);
},"Allows you to view the trivia categories");

addUserCommand("flashme", function(src,commandData,channel) {
    switch(trivData.toFlash[sys.ip(src)]) {
        case undefined:
            trivData.toFlash[sys.ip(src)] = {};
            saveData();
            triviabot.sendMessage(src, "You are now going to be flashed when a game starts.", channel);
        break;
        default:
            delete trivData.toFlash[sys.ip(src)];
            saveData();
            triviabot.sendMessage(src, "You are no longer going to be flashed when a game starts.", channel);
    }
},"Whether or not to flash you when a game starts");

addUserCommand("goal", function(src,commandData,channel) {
	if (Trivia.started === false)
	{
		Trivia.sendPM(src,"A trivia game isn't currently running.",channel);
		return;
	}
	Trivia.sendPM(src,"The goal for the current game is: "+Trivia.maxPoints, channel);
},"Allows you to see the current target for the trivia game");

addAdminCommand("changegoal", function(src,commandData,channel) {
	if (Trivia.started == false) {
		Trivia.sendPM(src,"A trivia game isn't currently running.",channel);
		return;
	}
	commandData = parseInt(commandData, 10);
	if (isNaN(commandData)) {
		Trivia.sendPM(src,"The goal must be a valid number.", channel);
		return;
	}
	if (commandData < 2 || commandData > 102) {
		Trivia.sendPM(src,"The goal must not be lower than 2 or higher than 102.",channel);
		return;
	}
	triviabot.sendAll(sys.name(src)+" changed the goal of the current game to "+commandData+".", triviachan);
	Trivia.maxPoints = commandData;
	return;
}, "Allows you to change the goal for the current game");

addAdminCommand("removeq", function(src,commandData,channel) {
	var q = triviaq.get(commandData);
	if(q !== null){
		triviabot.sendAll(sys.name(src)+" removed question: id, "+commandData +" category: "+q.category+", question: "+q.question+", answer: "+q.answer,revchan);
		triviaq.remove(commandData);
		return;
	}
	Trivia.sendPM(src,"Oops! Question doesn't exist",channel);
},"Allows you to remove a question that has already been submitted, format /removeq [ID]");

addUserCommand("submitq", function(src, commandData, channel) {
    var user_ip = sys.ip(src), user_ban = trivData.submitBans[user_ip], isAdmin = tadmin.isTAdmin(sys.name(src));
    if (isTrivia("submitbanned", user_ip) && !isAdmin) {
        var ban = trivData.submitBans[ip];
        Trivia.sendPM(src, "You are banned from submitting questions"+(ban.expires == "never" ? "" : "for  "+getTimeString(ban.expires - sys.time()))+". "+(ban.reason!==undefined?"[Reason: "+ban.reason+"]" : ""), channel);
        return;
    }
    commandData = commandData.split("*");
    if (commandData.length!=3)
    {
        Trivia.sendPM(src,"Oops! Usage of this command is: /submitq category*question*answer(s)", channel);
        Trivia.sendPM(src,"Separate multiple answers with ','.", channel);
        return;
    }
    var category = utilities.html_escape(commandData[0]);
    var question = utilities.html_escape(commandData[1]);
	var fixAnswer = commandData[2].replace(/ *, */gi, ",").replace(/^ +/, "");
    var answer = fixAnswer.split(",");
	var needsreview = false;
	if (trivreview.questionAmount() === 0){
		needsreview = true;
	}

	var name = sys.name(src);
    var id = trivreview.add(category,question,answer,name);

    Trivia.sendPM(src,"Your question was submitted.", channel);
	if (needsreview){
		trivreview.checkq(id);
	}
},"Allows you to submit a question for review, format /submitq Category*Question*Answer1,Answer2,etc");

addUserCommand("join", function(src, commandData, channel) {
    if (Trivia.started === false)
    {
        Trivia.sendPM(src,"A game hasn't started!",channel);
        return;
    }
    if (SESSION.users(src).mute.active || isTrivia("muted", sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)){
        Trivia.sendPM(src, "You cannot join when muted!",channel);
        return;
    }
    if (!sys.dbRegistered(sys.name(src)))
    {
        Trivia.sendPM(src,"Please register before playing Trivia.",channel);
        return;
    }
    if (Trivia.playerPlaying(src)) {
        Trivia.sendPM(src,"You've already joined the game!",channel);
        return;
    }
    Trivia.addPlayer(src);
    Trivia.sendAll(sys.name(src)+" joined the game!",triviachan);
},"Allows you to join a current game of trivia");

addUserCommand("unjoin", function(src, commandData, channel) {
    if (channel == triviachan)
        Trivia.unjoin(src);
},"Allows you to quit a current game of trivia");

addUserCommand("qamount", function(src, commandData, channel) {
    if (channel == triviachan || channel == revchan) {
        var qamount = triviaq.questionAmount();
        triviabot.sendMessage(src, "The amount of questions is: "+qamount,channel);
        return;
    }
},"Shows you the current amount of questions");

addUserCommand("tadmins", function(src, commandData, channel) {
    tadmin.tAdminList(src,channel);
},"Gives a list of current trivia admins");

addOwnerCommand("triviaadmin", function(src, commandData, channel) {
    if (tadmin.isTAdmin(commandData))
    {
		Trivia.sendPM(src,"That person is already a trivia admin.",channel);
		return;
	}
    tadmin.addTAdmin(commandData);
    Trivia.sendPM(src,"That person is now a trivia admin!",channel);
},"Allows you to promote a new trivia admin, format /triviaadmin [name]");

addOwnerCommand("triviaadminoff", function(src, commandData, channel) {
    if (!tadmin.isTAdmin(commandData))
	{
		Trivia.sendPM(src,"That person isn't a trivia admin.",channel);
		return;
	}
    tadmin.removeTAdmin(commandData);
    Trivia.sendPM(src,"That person is no longer a trivia admin!",channel);
},"Allows you to demote a current trivia admin, format /triviaadminoff [name]");

addAdminCommand("start", function(src, commandData, channel) {
    Trivia.startTrivia(src,commandData);
},"Allows you to start a trivia game, format /start [number] leave number blank for random");

addAdminCommand("stop", function(src, commandData, channel) {
    Trivia.endTrivia(src);
},"Allows you to stop a current trivia game");

addAdminCommand("say", function(src, commandData, channel) {
    if (commandData === undefined)
    return;
    Trivia.sendAll("("+sys.name(src)+"): "+commandData,channel);
},"Allows you to talk during the answer period");

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

addOwnerCommand("updateafter", function(src, commandData, channel) {
    triviabot.sendMessage(src, "Trivia will update after the game",channel);
    Trivia.autostart = false;
    Trivia.needsUpdating = true;
    if (Trivia.started === false) {
        runUpdate();
    }
    return;
}, "Updates trivia after the current game is over");

addOwnerCommand("basestatquestions", function(src, commandData, channel) { //this should maybe be removed later!
    var pokemon = ["Terrakion","Politoed","Ferrothorn","Tentacruel","Espeon","Mamoswine","Gyarados","Heatran","Ninetales","Tyranitar","Darmanitan","Snorlax","Mienshao","Chandelure","Raikou","Nidoking","Kingdra","Arcanine","Crobat","Gligar","Slowking","Sceptile","Steelix","Tangrowth","Gallade","Clefable","Tornadus","Sandslash","Miltank","Qwilfish","Crustle","Sawk","Exeggutor","Bisharp","Torkoal","Emboar","Klinklang","Regirock","Tauros","Pinsir","Mienfoo","Porygon","Abra","Houndour","Snover"];
    var baseStats = ["HP","Attack","Defense","Special Attack","Special Defense","Speed"];
    var pokenum = pokemon.map(sys.pokeNum);
    pokenum.forEach(function(num) {
        for (var x = 0; x < 6; x++) {
            triviaq.unsafeAdd("Pokemon", "What is " + sys.pokemon(num) + "'s base " + baseStats[x] + " stat?", sys.pokeBaseStats(num)[x]);
        }
    });
    triviabot.sendMessage(src, "Base stat questions added! Remember to /savedb");
    return;
}, "Adds the base stat questions to trivia");

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

addAdminCommand("apropos", function(src, commandData, channel) {
    if (commandData === undefined)
        return;
    Trivia.sendPM(src,"Matching questions with '"+commandData+"' are: ",channel);
    var all = triviaq.all(), b, q;
    for (b in all)
    {
        q = triviaq.get(b)
		var answer = String(q.answer)
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase())>-1||answer.toLowerCase().indexOf(commandData.toLowerCase())>-1)
        Trivia.sendPM(src,"Question: '"+q.question+ "' Answer: '"+q.answer+"' (id='" + b + "')", channel);
    }
    all = trivreview.all();
    for (b in all)
    {	
        q = trivreview.get(b);
		var answer = String(q.answer)
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase())>-1||answer.toLowerCase().indexOf(commandData.toLowerCase())>-1)
        Trivia.sendPM(src,"Question under review: '"+q.question+ "' Answer: '"+q.answer+"' (id='" + b + "')", channel);
    }

},"Allows you to search through the questions, format /apropos [query]");

addAdminCommand("category", function(src, commandData, channel){
	if (commandData === undefined)
        return;
	Trivia.sendPM(src, "Questions in category: "+commandData, channel);
	var all = triviaq.all(), b, q;
    for (b in all)
    {
        q = triviaq.get(b)
		var answer = String(q.answer)
        if (q.category.toLowerCase()==commandData.toLowerCase())
        Trivia.sendPM(src,"Question: '"+q.question+ "' Answer: '"+q.answer+"' (id='" + b + "')", channel);
    }
}, "Allows you to view questions from a category");

addAdminCommand("checkq", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		sys.sendMessage(src, "", channel);
		triviabot.sendMessage(src, "This question needs to be reviewed:",channel);
		triviabot.sendMessage(src, "EDITING MODE: USE THE CHANGE COMMANDS TO EDIT AND THEN /ACCEPT OR /DECLINE TO DELETE",channel);
		triviabot.sendMessage(src, "Category: "+trivreview.editingCategory,channel);
		triviabot.sendMessage(src, "Question: "+trivreview.editingQuestion,channel);
		triviabot.sendMessage(src, "Answer: "+trivreview.editingAnswer,channel);
		triviabot.sendMessage(src, "Questions Approved: "+triviaq.questionAmount()+". Questions Left: "+ trivreview.questionAmount()+".", channel);
		sys.sendMessage(src, "",channel);
		return;
	}
    if (trivreview.questionAmount() === 0)
    {
        Trivia.sendPM(src,"There are no questions to be reviewed.", channel);
        return;
    }
    var q = trivreview.all();
	var questionId = Object.keys(q)[0];
	var questionInfo = trivreview.get(questionId);
	if (questionId === undefined || questionInfo === undefined)
	{
		Trivia.sendPM(src,"Oops! There was an error.",channel);
		return;
	}
	sys.sendMessage(src,"",channel);
	Trivia.sendPM(src,"This question needs to be reviewed:",channel);
	Trivia.sendPM(src,"ID: "+questionId,channel);
	Trivia.sendPM(src,"Category: "+questionInfo.category,channel);
	Trivia.sendPM(src,"Question: "+questionInfo.question,channel);
	Trivia.sendPM(src,"Answer: "+questionInfo.answer,channel);
	Trivia.sendPM(src, "Questions Approved: "+triviaq.questionAmount()+". Questions Left: "+ trivreview.questionAmount()+".", channel);
	if(questionInfo.name !==undefined){
		Trivia.sendPM(src,"Submitted By:" +questionInfo.name,channel);
	}
	sys.sendMessage(src,"",channel);
},"Allows you to check the current question in review");

addAdminCommand("changea", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		trivreview.editingAnswer = commandData.split(",");
		triviabot.sendAll("The answer for the current question in edit was changed to "+trivreview.editingAnswer+" by " + sys.name(src), channel);
		trivreview.checkq();
		return;
	}
	var tr = trivreview.all();
	if (trivreview.questionAmount() !== 0) {
		var id = Object.keys(tr)[0];
		var answer = commandData.split(",");
		trivreview.changeAnswer(id, answer);
		triviabot.sendAll("The answer for ID #"+id+" was changed to "+answer+" by "+sys.name(src), channel);
		trivreview.checkq(id);
		return;
	}
	triviabot.sendMessage(src, "No question");
},"Allows you to change an answer to a question in review, format /changea newanswer");

addAdminCommand("changeq", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		trivreview.editingQuestion = commandData;
		triviabot.sendAll("The question for the current question in edit was changed to "+trivreview.editingQuestion+" by " +sys.name(src), channel);
		trivreview.checkq();
		return;
	}
   var tr = trivreview.all();
	if (trivreview.questionAmount() !== 0) {
		var id = Object.keys(tr)[0];
		var question = commandData;
		trivreview.changeQuestion(id, question);
		triviabot.sendAll("The question for ID #"+id+" was changed to "+question+" by "+sys.name(src), channel);
		trivreview.checkq(id);
		return;
	}
	triviabot.sendMessage(src, "No question");
},"Allows you to change the question to a question in review, format /changeq newquestion");

addAdminCommand("changec", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		trivreview.editingCategory = commandData;
		triviabot.sendAll("The category for the current question in edit was changed to "+trivreview.editingCategory+" by " + sys.name(src), channel);
		trivreview.checkq();
		return;
	}
    var tr = trivreview.all();
	if (trivreview.questionAmount() !== 0) {
		var id = Object.keys(tr)[0];
		var category = commandData;
		trivreview.changeCategory(id, category);
		triviabot.sendAll("The category for ID #"+id+" was changed to "+category+" by "+sys.name(src), channel);
		trivreview.checkq(id);
		return;
	}
	triviabot.sendMessage(src, "No question");
},"Allows you to change the category to a question in review, format /changec newcategory");

addAdminCommand("savedb", function(src, commandData, channel) {
	triviabot.sendAll("Saving trivia database...", channel);
	triviaq.saveQuestions();
	triviabot.sendAll("Trivia database saved!", channel);
}, "Forces a save of the trivia database. Do so after accepting questions.");

addAdminCommand("pushback", function(src, commandData, channel) {
	var tr = trivreview.all();
	if (trivreview.questionAmount() !== 0) {
		if((time()-trivreview.declineTime)<=2){
			triviabot.sendMessage(src, "Please wait before pushing back a question",channel);
			return;
		}
		var id = Object.keys(tr)[0];
		var q = trivreview.get(id);
		triviabot.sendAll(sys.name(src)+" pushed back the current question to the end of review",revchan);
		trivreview.declineTime = time();
        trivreview.add(q.category,q.question,q.answer,q.name);
		trivreview.remove(id);
		trivreview.checkq(id+1);
		return;
	}
	triviabot.sendMessage(src, "No more questions!",channel);
},"Allows you to push back a question");

addAdminCommand("accept", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		triviaq.unsafeAdd(trivreview.editingCategory, trivreview.editingQuestion, trivreview.editingAnswer);
		trivreview.editingMode = false;
		triviabot.sendAll("The question in edit was saved",channel);
		trivreview.checkq(trivreview.currentId);
		return;
	}
	var tr = trivreview.all();
	if (trivreview.questionAmount() !== 0) {
		if((time()-trivreview.declineTime)<=2){
			triviabot.sendMessage(src, "Please wait before accepting a question",channel);
			return;
		}
		var id = Object.keys(tr)[0];
		var q = trivreview.get(id);
		triviaq.unsafeAdd(q.category,q.question,q.answer);
		var all = triviaq.all(), qid;
		for (var b in all){
			var qu = triviaq.get(b);
			if(qu.question===q.question){
				qid = b;
			}
		}
		triviabot.sendAll(sys.name(src)+" accepted question: id, "+qid+" category: "+q.category+", question: "+q.question+", answer: "+q.answer,revchan);
		trivreview.declineTime = time();
		trivreview.remove(id);
		trivreview.checkq(id+1);
		return;
	}
	triviabot.sendMessage(src, "No more questions!",channel);
},"Allows you to accept the current question in review");

addAdminCommand("showq", function(src, commandData, channel){
	var q = triviaq.get(commandData);
	if(q !== null){
		triviabot.sendMessage(src, "Question ID: "+ commandData +", Question: "+ q.question + ", Category: "+ q.category + ", Answer(s): " + q.answer, channel);
		return;
	}
	triviabot.sendMessage(src, "This question does not exist",channel);
},"Allows you to see an already submitted question");

addAdminCommand("editq", function(src, commandData, channel){
	var q = triviaq.get(commandData);
	if(trivreview.editingMode === true){
		triviabot.sendMessage(src, "A question is already in edit, use /checkq to see it!");
		return;
	}
	if(q !== null){
		trivreview.editingMode = true;
		trivreview.editingQuestion = q.question;
		trivreview.editingCategory = q.category;
		trivreview.editingAnswer = q.answer; //Moving it to front of queue seemed like a tedious job, so let's cheat it in, instead :3
		triviaq.unsafeRemove(commandData);
		var tr = trivreview.all();
		var id = Object.keys(tr)[0];
		trivreview.currentId = id;
		trivreview.checkq(); //id isn't needed or shouldn't be needed
		return;
	}
	triviabot.sendMessage(src, "This question does not exist", channel);
},"Allows you to edit an already submitted question");

addAdminCommand("decline", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		trivreview.editingMode = false;
		triviabot.sendAll("The question in edit was deleted",channel);
		trivreview.checkq(trivreview.currentId);
		return;
	}
	var tr = trivreview.all();
	if (trivreview.questionAmount() !== 0) {
		if((time()-trivreview.declineTime)<=2){
			triviabot.sendMessage(src, "Please wait before declining a question",channel);
			return;
		}
		var id = Object.keys(tr)[0];
		var q = trivreview.get(id);
		triviabot.sendAll(sys.name(src)+" declined question: id, "+id+" category: "+q.category+", question: "+q.question+", answer: "+q.answer,revchan);
		trivreview.declineTime = time();
        trivreview.remove(id);
		trivreview.checkq(id+1);
		return;
	}
	triviabot.sendMessage(src, "No more questions!",channel);
},"Allows you to decline the current question in review");

addAdminCommand("shove", function(src, commandData, channel){
	var tar = sys.id(commandData);
	if(tar === undefined){
		return;
	}
	if (Trivia.started === false)
    {
        Trivia.sendPM(src,"A game hasn't started!");
        return;
    }
    if (Trivia.playerPlaying(tar)) {
        Trivia.removePlayer(tar);
        Trivia.sendAll(sys.name(tar) + " was removed from the game by "+sys.name(src)+"!",triviachan);
		return;
	}
	Trivia.sendPM(src, "That person isn't playing!");
}, "Allows you to remove a player from the game");

addAdminCommand("submitban", function(src, commandData, channel) {
    if (commandData == undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: name:reason:time", channel);
        return;
    }
    commandData = commandData.split(":");
    var user = commandData[0], reason = commandData[1], time = commandData[2];
    if (sys.dbIp(user) == undefined) {
        triviabot.sendMessage(src, "Couldn't find "+user, channel);
        return;
    }
    var tarip = sys.id(user) == undefined ? sys.dbIp(user) : sys.ip(sys.id(user));
    var ok = sys.auth(src) <= 0 && sys.maxAuth(tarip) <= 0 && !tadmin.isTAdmin(user) && !canUseReviewCommands(user.toLowerCase());
    if (sys.maxAuth(tarip) >= sys.auth(src) && !ok) {
        triviabot.sendMessage(src, "Can't do that to higher auth!", channel);
        return;
    }
    if (isTrivia("submitbanned", tarip)) {
        triviabot.sendMessage(src, user+" is already submit banned!", channel);
        return;
    }
    timestring = "for ";
    seconds = getSeconds(time);
    if (isNaN(seconds)) {
        triviabot.sendMessage(src, "The time is a bit odd...", channel);
        return;
    }
    if (!time || seconds < 1) {
        if (!isTriviaOwner(src)) {
            triviabot.sendMessage(src, "Please specify time!", channel);
            return;
        }
        time = "forever";
    }
    timestring += getTimeString(seconds);
    expires = (time == "forever") ? "never" : parseInt(sys.time()) + parseInt(seconds);
    trivData.submitBans[tarip] = {
        'name': user,
        'reason': reason,
        'by': sys.name(src),
        'issued': parseInt(sys.time()),
        'expires': expires
    };
    saveData();
    var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), revchan]
    for (var x in channels) {
        if (sys.existChannel(sys.channel(channels[x]))) {
            triviabot.sendAll(sys.name(src)+" banned "+user+" from submitting questions "+timestring+"! [Reason: "+reason+"]", channels[x]);
        }
    }
    saveData();
}, "Ban a user from submitting.");

addAdminCommand("submitunban", function(src, commandData, channel) {
    if (commandData == undefined) {
        triviabot.sendMessage(src, "Specify a user!", channel);
        return;
    }
	if (sys.dbIp(commandData) == undefined) {
		triviabot.sendMessage(src, "Couldn't find "+commandData);
		return;
	}
	var ip = (sys.id(commandData) !== undefined) ? sys.ip(sys.id(commandData)) : sys.dbIp(commandData);
	if (!isTrivia("submitbanned", ip)) {
		triviabot.sendMessage(src, commandData+" isn't banned from submitting.",channel);
		return;
	}
	delete trivData.submitBans[ip];
	saveData();
	var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), revchan]
	for (var x in channels) {
		if (sys.existChannel(sys.channel(channels[x]))) {
			triviabot.sendAll(sys.name(src)+" unbanned "+commandData+" from submitting questions.", channels[x]);
		}
	}
	return;
}, "Unban a user from submitting.");

addAdminCommand("submitbans", function(src, commandData, channel) {
    showTrivia(src, channel, "submitBans");
}, "View submit bans.");

addAdminCommand("triviamute", function(src, commandData, channel) {
    if (commandData == undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: name:reason:time", channel);
        return;
    }
    commandData = commandData.split(":");
    var user = commandData[0], reason = commandData[1], time = commandData[2];
    if (sys.dbIp(user) == undefined) {
        triviabot.sendMessage(src, "Couldn't find "+user, channel);
        return;
    }
    var tarip = sys.id(user) == undefined ? sys.dbIp(user) : sys.ip(sys.id(user));
    var ok = sys.auth(src) <= 0 && sys.maxAuth(tarip) <= 0 && !tadmin.isTAdmin(user) && !canUseReviewCommands(user.toLowerCase());
    if (sys.maxAuth(tarip) >= sys.auth(src) && !ok) {
        triviabot.sendMessage(src, "Can't do that to higher auth!", channel);
        return;
    }
    if (isTrivia("muted", tarip)) {
        triviabot.sendMessage(src, user+" is already trivia muted!", channel);
        return;
    }
    timestring = "for ";
    seconds = getSeconds(time);
    if (isNaN(seconds)) {
        triviabot.sendMessage(src, "The time is a bit odd...", channel);
        return;
    }
    if (!time || seconds < 1) {
        if (!isTriviaOwner(src)) {
            triviabot.sendMessage(src, "Please specify time!", channel);
            return;
        }
        time = "forever";
    }
    timestring += getTimeString(seconds);
    expires = (time == "forever") ? "never" : parseInt(sys.time()) + parseInt(seconds);
    trivData.mutes[tarip] = {
        'name': user,
        'reason': reason,
        'by': sys.name(src),
        'issued': parseInt(sys.time()),
        'expires': expires
    };
    var chans = [triviachan, revchan, sachannel];
    for (x in chans) {
        var current = chans[x];
        triviabot.sendAll(user+" was trivia muted by "+nonFlashing(sys.name(src))+ (time!="forever"? " " + timestring : "") + "! [Reason: "+reason+"]", current);
    }
    if (sys.id(user) != undefined && Trivia.playerPlaying(sys.id(user))) {
        Trivia.removePlayer(sys.id(user));
        triviabot.sendAll(user+" was removed from the game!", triviachan);
    }
    saveData();
}, "Trivia mute a user.");

addAdminCommand("triviaunmute", function(src, commandData, channel) {
    if (commandData == undefined) {
        triviabot.sendMessage(src, "Specify a user!", channel);
        return;
    }
    if (sys.dbIp(commandData) == undefined) {
        triviabot.sendMessage(src, "Couldn't find "+commandData, channel);
        return;
    }
    var tarip = sys.id(commandData) == undefined ? sys.dbIp(commandData) : sys.ip(sys.id(commandData));
    if (!isTrivia("muted", tarip)) {
        triviabot.sendMessage(src, commandData+" isn't trivia muted!", channel);
        return;
    }
    if (tarip == sys.ip(src) && isTrivia("muted", tarip)) {
        triviabot.sendMessage(src, "You may not trivia unmute yourself!", channel);
        return;
    }
    delete trivData.mutes[tarip];
    var chans = [triviachan, revchan, sachannel];
    for (x in chans) {
        var current = chans[x];
        triviabot.sendAll(commandData+" was trivia unmuted by "+nonFlashing(sys.name(src))+ "!", current);
    }
    saveData();
}, "Trivia unmute a user.");

addAdminCommand("triviamutes", function(src, commandData, channel) {
    showTrivia(src, channel, "mutes");
}, "View trivia mutes.");

addAdminCommand("autostart", function(src, commandData, channel) {
	Trivia.autostart = !Trivia.autostart;
	triviabot.sendAll("" + sys.name(src) + " turned auto start " + (Trivia.autostart == true ? "on" : "off") + ".", revchan);
}, "Auto start games.");

// Normal command handling.
exports.handleCommand = function trivia_handleCommand(src, command, channel)
{
    var commandData;
    var indx = command.indexOf(' ');
    if (indx != -1) {
        commandData = command.substr(indx+1);
        command = command.substr(0, indx).toLowerCase();
    } else {
        commandData = ""; // sane default to avoid undefined errors
    }
    // Only care about trivia channels
    if (channel != triviachan && channel != revchan && ["triviamute","triviaunmute"].indexOf(command) == -1)
        return;
    try {
        // Trivia user commands
        if (userCommands.hasOwnProperty(command)) {
            userCommands[command].call(null, src, commandData, channel);
            return true;
        }
        // Trivia admin commands
        if (sys.auth(src) > 0 || tadmin.isTAdmin(sys.name(src)) || canUseReviewCommands(sys.name(src).toLowerCase())) {
            if (adminCommands.hasOwnProperty(command)) {
                adminCommands[command].call(null, src, commandData, channel);
                return true;
            }
        }
        // Trivia owner commands
        if (isTriviaOwner(src)) {
            if (ownerCommands.hasOwnProperty(command)) {
                ownerCommands[command].call(null, src, commandData, channel);
                return true;
            }
        }
    } catch(e) {
        sys.sendMessage(src, "Error in your trivia command: " + e + " on line " + e.lineNumber, channel);
    }
};

exports.onHelp = function trivia_onHelp(src, commandData, channel)
{
    if (commandData.toLowerCase() == "trivia")
    {
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "Trivia commands", channel);
        sys.sendMessage(src, "", channel);
        commandHelp.forEach(function(h) {
           sys.sendMessage(src, h, channel);
        });
    }
};

exports.onMute = function trivia_onMute(src){
    if (Trivia.started === false) {
        return;
    }
    if (Trivia.playerPlaying(src)) {
        Trivia.removePlayer(src);
        Trivia.sendAll(sys.name(src) + " left the game!",triviachan);
		return;
	}
};

exports.beforeChannelJoin = function trivia_beforeChannelJoin(src, channel) {
    /* Prevent channel join */
    if (channel == revchan && sys.auth(src) < 1 && !tadmin.isTAdmin(sys.name(src).toLowerCase()) && !canUseReviewCommands(sys.name(src)))
    {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
};

exports.beforeLogOut = function trivia_beforeLogOut(src)
{
    if (Trivia.started === true) {
        Trivia.removePlayer(src);
    }
};

exports.beforeChatMessage = function trivia_beforeChatMessage(src, message, channel)
{
    if (channel !== triviachan)
        return;
        
    if (message.substr(0,5) == "\\join") {
    	Trivia.sendPM(src, "You must use /join to join a Trivia game!", channel);
    	return true;
    }

    if (utilities.is_command(message) && message.substr(1,2).toLowerCase() != "me")
    return;

    /* Trivia checks */
    var joined = Trivia.playerPlaying(src);
    if (Trivia.started === true)
    {
        if (joined === false && Trivia.answeringQuestion === true)
        {
            Trivia.sendPM(src, "You haven't joined, so you are unable to submit an answer.", channel);
            return true;
        }
    }
    if (joined === true && Trivia.started === true && Trivia.answeringQuestion === true)
    {
        if (message.length > 60)
        {
            Trivia.sendPM(src,"Sorry! Your answer is too long.", channel);
            return true;
        }
        // Remove commas so the listing looks better
        // This is fine as no answers should include comma.
        Trivia.addAnswer(src, message.replace(/,/gi,""));
        Trivia.sendPM(src, "Your answer was submitted.", triviachan);
        return true;
   }
   if (isTrivia("muted", sys.ip(src))) {
      var mute = trivData.mutes[sys.ip(src)];
      triviabot.sendMessage(src, "You are trivia muted by "+mute.by+ (mute.expires == "never" ? "" : " for "+getTimeString(mute.expires - sys.time()))+"! [Reason: "+mute.reason+"]", channel);
      return true;
   }
};

exports.init = function trivia_init()
{
	triviachan = sys.channelId('Trivia');
	revchan = sys.channelId('TrivReview');
	if (typeof Trivia === "undefined" || typeof Trivia != "object") {
			Trivia = new TriviaGame();
			triviaq = new QuestionHolder("triviaq.json");
			trivreview = new QuestionHolder("trivreview.json");
			tadmin = new TriviaAdmin("tadmins.txt");
	}
    //Trivia.sendAll("Trivia is now running!");
};