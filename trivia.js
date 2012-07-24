/* TRIVIA FUNCTIONS */

var Bot = require("bot.js").Bot;

var utilities = require("utilities.js");

var triviachan, revchan;
var triviabot = new Bot("Psyduck"),
	Trivia = new TriviaGame(),
	triviaq = new QuestionHolder("triviaq.json"),
	trivreview = new QuestionHolder("trivreview.json"),
	tadmin = new TriviaAdmin("tadmins.txt");
	
// TODO: Load these from utilities.js

function getSeconds(s) {
        var parts = s.split(" ");
        var secs = 0;
        for (var i = 0; i < parts.length; ++i) {
            var c = (parts[i][parts[i].length-1]).toLowerCase();
            var mul = 60;
            if (c == "s") { mul = 1; }
            else if (c == "m") { mul = 60; }
            else if (c == "h") { mul = 60*60; }
            else if (c == "d") { mul = 24*60*60; }
            else if (c == "w") { mul = 7*24*60*60; }
            secs += mul * parseInt(parts[i], 10);
        }
        return secs;
}

function getTimeString(sec) {
        var s = [];
        var n;
        var d = [[7*24*60*60, "week"], [24*60*60, "day"], [60*60, "hour"], [60, "minute"], [1, "second"]];
        for (var j = 0; j < 5; ++j) {
            n = parseInt(sec / d[j][0], 10);
            if (n > 0) {
                s.push((n + " " + d[j][1] + (n > 1 ? "s" : "")));
                sec -= n * d[j][0];
                if (s.length >= 2) break;
            }
        }
        return s.join(", ");
}

try {
	trivData = JSON.parse(sys.getFileContent("trivData.json"));
} catch (e) {
	trivData = {};
}

if (trivData.submitBans == undefined) trivData.submitBans = {}; // submit bans
if (trivData.toFlash == undefined) trivData.toFlash = {}; // who to flash when a game starts

function saveData()
{
	sys.writeToFile("trivData.json", JSON.stringify(trivData));
}

function time()
{
    // Date.now() returns milliseconds since epoch,
    // by dividing by 1000 we get seconds.
    return Date.now()/1000
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
    sys.sendHtmlAll(this.tBorder() + "<center>" + html + "</center>" + this.tBorder(), triviachan);
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
	// just some checks
	try {
		if (this.started == true) return;
		if (this.startoff == true) return;
		if (triviaq.questionAmount() < 1) return;
		var x = time() - this.lastStopped;
		if (x < 16) return;
		if (name == "" && this.autostart == false) return;
		this.maxPoints = points;
	    	this.started = true;
	    	sys.sendAll("", 0);
		sys.sendAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:",0)
	    	this.sendAll("A #Trivia game was started! First to "+points+" points wins!",0);
		sys.sendAll("»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:",0)
		sys.sendAll("", 0);
		this.sendAll((name != "" ? name+" started a Trivia game! " : "A trivia game was started! ") + " First to "+points+" points wins!",triviachan);
		this.answeringQuestion = false;
	    	sys.delayedCall(function() { Trivia.startTriviaRound(); },15);
	} catch (e) {
		triviabot.sendMessage(sys.id("Ethan"), "Error in startGame: "+e, triviachan);
	}
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
	if (rand > 102 || rand < 2 )
    {
        this.sendPM(src,"Please do not start a game with more than 102 points, or lower than 2 points.", triviachan);
        return;
    }
    rand = (isNaN(rand)) ? sys.rand(2,102) : +rand;
    this.startGame(rand, sys.name(src));
    var players = sys.playersOfChannel(triviachan);
    // flash players
    for (p in players) {
    	player_id = players[p], player_ip = sys.ip(player_id);
    	if (trivData.toFlash[player_ip] !== undefined)
    	sys.sendHtmlMessage(player_id, "<ping/>", triviachan);
    }
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
try { // Do not indent this, it is only until this starts to work
    // use concat to convert into array
    var answer,
        id,
		answers = [].concat(triviaq.get(this.roundQuestion).answer);
    
    this.answeringQuestion = false;
    /* We're going to judge points based on response time */
    var wrongAnswers = [],
        answeredCorrectly = [];
    var ignoreCaseAnswers = answers.map(function(s) {
        return String(s).toLowerCase();
		});
    for (id in this.submittedAnswers)
    {
        // if they are still online and using their name..
        var name = this.submittedAnswers[id].name;
        // is it required for them to be online?
        if (sys.id(name) !== undefined && this.player(name) !== null) {
            answer = this.submittedAnswers[id].answer.toLowerCase();
            if (ignoreCaseAnswers.indexOf(answer) != -1)
            {
                var responseTime = this.submittedAnswers[id].time;
                var realTime = time();
                var minus = realTime - responseTime;
                var pointAdd = minus > 6 ? 5 : (minus < 7 && minus > 3 ? 3 : 2);
                //sys.sendMessage(sys.id("Crystal Moogle"), "TriviaPointDebug: " + name + " took" + minus + " seconds, point add is " + pointAdd + ".", triviachan);
                // TODO: check answer length, and base pointAdd off of that?

                answeredCorrectly.push(name);
                this.player(name).points += pointAdd;
            } else {
                wrongAnswers.push("<span title='" + utilities.html_escape(name) + "'>" + utilities.html_escape(this.submittedAnswers[id].answer) + "</span>");
            }
        }
    }

    sys.sendAll("", triviachan);
    var incorrectAnswers  = wrongAnswers.length > 0 ? " Incorrect answers: "+ wrongAnswers.join(", ") : "";
    sys.sendHtmlAll("<font color='#3daa68'><timestamp/> <font size='3'><b>±Psyduck:</b></font></font> Time's up!" + incorrectAnswers, triviachan);
    this.sendAll("Answered correctly: " + answeredCorrectly.join(", "),triviachan);
    var x = answers.length != 1 ? "answers were" : "answer was";
    this.sendAll("The correct "+x+": "+answers.join(", "),triviachan);

    var leaderboard = [];
    var displayboard = []
    var winners = [];
    for (id in this.triviaPlayers)
    {
        var nohtmlname = utilities.html_escape(this.triviaPlayers[id].name);
        leaderboard.push([nohtmlname,this.triviaPlayers[id].points]);
        if (this.triviaPlayers[id].points >= this.maxPoints)
        {
            winners.push(nohtmlname + " (" + this.triviaPlayers[id].points + ")");
        }
    }
	leaderboard.sort(function(a,b) { return b[1]-a[1]; });
    for(x in leaderboard){
        displayboard.push(leaderboard[x][0] + " (" + leaderboard[x][1] + ")")
    }
    this.sendAll("Leaderboard: "+displayboard.join(", "),triviachan);

    if (winners.length > 0) {
        var w = (winners.length == 1) ? "the winner!" : "our winners!";
        this.htmlAll("<h2>Congratulations to "+w+"</h2>"+winners.join(", ")+"");
		//Trivia.sendAll("Check the /topic for how to submit a question!", triviachan);
        this.resetTrivia();
        if (this.autostart == true) {
        	pointsForGame = sys.rand(7,56), toStart = sys.rand(20,30);
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
        return;
    }
    // initialize next questions
    var rand = sys.rand(17,30);
    this.sendAll("Please wait " + rand + " seconds until the next question!",triviachan);
    sys.delayedCall(function() {
        Trivia.startTriviaRound();
    }, rand);
} catch(e) {
// TODO REMOVE the catch block when this works
    sys.sendAll("script error: " + e, triviachan);
}
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

TriviaGame.prototype.addAllPokemon = function()
{
    // TODO restrict pokemon questions so that they can't be added multiple times..
    for (var b = 1;b<650;b++)
    {
        var pokenum = b;
        var pokemon = sys.pokemon(b);
        var shiny = sys.rand(1,15);
        var isShiny = (shiny == 1) ? "&shiny=true" : "";
        triviaq.add("POKEMON : WHO'S THAT POKEMON?","<center><img src='pokemon:num="+pokenum+""+isShiny+"'></center>", pokemon);
    }
    this.sendAll("All pokemon were added to the list of questions!");
    return;
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
        //this.save();
		sys.writeToFile(this.file,JSON.stringify(this.state));
    } else {
        try
        {
            var state = JSON.parse(fileContent);
            if (state.questions !== undefined && state.freeId !== undefined)
            {
                this.state = state;
            }
        }
        catch(e)
        {
            // TODO: error
        }
    }
}

QuestionHolder.prototype.add = function(category,question,answer,name)
{
    var id = this.freeId();
    var q = this.state.questions[id] = {};
    q.category = category;
    q.question = question;
    q.answer = [].concat(answer);
	if(typeof(name)!==undefined){
		q.name = name;
	}
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.state));
    return id;
};

QuestionHolder.prototype.remove = function(id)
{
    delete this.state.questions[id];
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.state));
};
QuestionHolder.prototype.checkq = function(id)
{
	if(trivreview.editingMode === true){
		sys.sendAll("", revchan);
		triviabot.sendAll("This question needs to be reviewed:",revchan);
		triviabot.sendAll("EDITING MODE: USE THE CHANGE COMMANDS TO EDIT AND THEN /ACCEPT OR /DECLINE TO DELETE",revchan);
		triviabot.sendAll("Category: "+trivreview.editingCategory,revchan);
		triviabot.sendAll("Question: "+trivreview.editingQuestion,revchan);
		triviabot.sendAll("Answer: "+trivreview.editingAnswer,revchan);
		triviabot.sendAll("Questions Approved: "+triviaq.questionAmount()+". Questions Left: "+ trivreview.questionAmount()+".", revchan);
		sys.sendAll("",revchan);
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
	sys.sendAll("",revchan);
	triviabot.sendAll("This question needs to be reviewed:",revchan);
	triviabot.sendAll("ID: "+questionId,revchan);
	triviabot.sendAll("Category: "+questionInfo.category,revchan);
	triviabot.sendAll("Question: "+questionInfo.question,revchan);
	triviabot.sendAll("Answer: "+questionInfo.answer,revchan);
	triviabot.sendAll("Questions Approved: "+triviaq.questionAmount()+". Questions Left: "+ trivreview.questionAmount()+".", revchan);
	if(questionInfo.name !== undefined){
		triviabot.sendAll("Submitted By: "+questionInfo.name,revchan);
	}
	sys.sendAll("",revchan);
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
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.state));
};

QuestionHolder.prototype.changeQuestion = function(id,question)
{
    this.state.questions[id].question = question;
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.state));
};

QuestionHolder.prototype.changeAnswer = function(id,answer)
{
    this.state.questions[id].answer = answer;
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.state));
};

QuestionHolder.prototype.all = function(src)
{
    return this.state.questions;
};

// TODO: kinda useless prototype
function TriviaAdmin(file)
{
    this.file = file;
    this.admins = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
        sys.writeToFile(this.file, JSON.stringify(this.admins));
    } else {
        try {
            this.admins = JSON.parse(fileContent);
        } catch(e) {
            // TODO: recovery
        }
    }
}

TriviaAdmin.prototype.addTAdmin = function(name)
{
    if (this.isTAdmin(name))
    return;
    this.admins.push(name.toLowerCase());
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.admins));
};

TriviaAdmin.prototype.removeTAdmin = function(name)
{
    if (!this.isTAdmin(name))
        return;
    var ind = this.admins.indexOf(name.toLowerCase());
    this.admins.splice(ind, 1);
    //this.save();
	sys.writeToFile(this.file,JSON.stringify(this.admins));
};

TriviaAdmin.prototype.isTAdmin = function(name)
{
    return this.admins.indexOf(name) != -1;
};

TriviaAdmin.prototype.tAdminList = function(src,id)
{
    sys.sendMessage(src, "" ,id);
    sys.sendMessage(src, "*** TRIVIA ADMINS ***" ,id);
    sys.sendMessage(src, "" ,id);
    for (var a in this.admins) {
    	sys.sendMessage(src, this.admins[a] + (sys.id(this.admins[a]) == undefined ? "" : ":"),id);
    }
    sys.sendMessage(src, "" ,id);
};

// Commands
var userCommands = {};
var adminCommands = {};
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

addUserCommand("flashme", function(src,commandData,channel) {
	if (trivData.toFlash[sys.ip(src)] == undefined) {
		trivData.toFlash[sys.ip(src)] = {};
		saveData();
		triviabot.sendMessage(src, "You are now going to be flashed when a game starts.", channel);
		return;
	} else {
		delete trivData.toFlash[sys.ip(src)];
		saveData();
		triviabot.sendMessage(src, "You are no longer going to be flashed when a game starts.", channel);
		return;
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
    var user_ip = sys.ip(src), user_ban = trivData.submitBans[user_ip];
    if (user_ban !== undefined) {
	Trivia.sendPM(src, "Sorry, you are banned from submitting.", channel);
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
    if (question.indexOf("?")==-1)
    {
        Trivia.sendPM(src,"Your question should have a question mark.", channel);
        return;
     }
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
	// Enable if needed, but this might spam trivreview...
    // Trivia.sendAll(sys.name(src)+" submitted a question with id " + id +" !",revchan);
},"Allows you to submit a question for review, format /submitq Category*Question*Answer1,Answer2,etc");

addUserCommand("join", function(src, commandData, channel) {
    if(SESSION.users(src).mute.active || !SESSION.channels(triviachan).canTalk(src)){
        Trivia.sendPM(src, "You cannot join when muted!",channel);
        return;
    }
    if (Trivia.started === false)
    {
        Trivia.sendPM(src,"A game hasn't started!",channel);
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
        sys.sendHtmlMessage(src,"<timestamp/> The amount of questions is: <b>"+qamount+"</b>",channel);
        return;
    }
},"Shows you the current amount of questions");

addUserCommand("tadmins", function(src, commandData, channel) {
    tadmin.tAdminList(src,channel);
},"Gives a list of current trivia admins");

addAdminCommand("tadmin", function(src, commandData, channel) {
    if (tadmin.isTAdmin(commandData))
    {
		Trivia.sendPM(src,"That person is already a trivia admin.",channel);
		return;
	}
    tadmin.addTAdmin(commandData);
    Trivia.sendPM(src,"That person is now a trivia admin!",channel);
},"Allows you to promote a new trivia admin, format /tadmin [name]");

addAdminCommand("tadminoff", function(src, commandData, channel) {
    if (!tadmin.isTAdmin(commandData))
	{
		Trivia.sendPM(src,"That person isn't a trivia admin.",channel);
		return;
	}
    tadmin.removeTAdmin(commandData);
    Trivia.sendPM(src,"That person is no longer a trivia admin!",channel);
},"Allows you to demote a current trivia admin, format /adminoff [name]");

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

addAdminCommand("addallpokemon", function(src, commandData, channel) {
    if (sys.name(src).toLowerCase() == "lamperi" || sys.name(src).toLowerCase() == "ethan"|| sys.name(src).toLowerCase() == "crystal moogle")
	Trivia.addAllPokemon();
},"Adds all the \"Who's that pokémon?\" questions");

/*addAdminCommand("erasequestions", function(src, commandData, channel) {
	if (sys.name(src).toLowerCase() == "lamperi" || sys.name(src).toLowerCase() == "ethan"|| sys.name(src).toLowerCase() == "crystal moogle")
	{
		sys.writeToFile("triviaq.json","");
		QuestionHolder.state = {freeId: 0, questions: {}};
	}
},"Erases all current questions");*/

addAdminCommand("apropos", function(src, commandData, channel) {
    if (commandData === undefined)
        return;
    Trivia.sendPM(src,"Matching questions with '"+commandData+"' are: ",channel);
    var all = triviaq.all(), b, q;
    for (b in all)
    {
        q = all[b];
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase())>-1)
        Trivia.sendPM(src,"Question: '"+q.question+"' (id='" + b + "')", channel);
    }
    all = trivreview.all();
    for (b in all)
    {
        q = all[b];
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase())>-1)
        Trivia.sendPM(src,"Question under review: '"+q.question+"' (id='" + b + "')", channel);
    }

},"Allows you to search through the questions, format /apropos [query]");


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
    /*Trivia.sendPM(src,"Question IDs: " + Object.keys(q).join(", "), channel);
    Trivia.sendPM(src,"Type /checkq [id] to view and review a question!", channel);*/
	// Let's review the first question
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

/*addAdminCommand("checkq", function(src, commandData, channel) {
    var q = trivreview.get(commandData);
    Trivia.sendPM(src,"ID #"+commandData+":", channel);
    Trivia.sendPM(src,"Category: "+q.category, channel);
    Trivia.sendPM(src,"Question: "+q.question, channel);
    Trivia.sendPM(src,"Answer: "+q.answer, channel);
});*/

// TODO: are these well named? also do versions for already accepted questions
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

// TODO: Maybe announce globally to trivreview when somebody accepts a question?

addAdminCommand("accept", function(src, commandData, channel) {
	if(trivreview.editingMode === true){
		triviaq.add(trivreview.editingCategory, trivreview.editingQuestion, trivreview.editingAnswer);
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
		triviaq.add(q.category,q.question,q.answer);
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
    // triviabot.sendMessage(src,"You accepted question ID #"+commandData+"!", channel);
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
		triviaq.remove(commandData);
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
addAdminCommand("resetvars", function(src, commandData, channel) {
	if(sys.name(src).toLowerCase() !== "lamperi" && sys.name(src).toLowerCase() !== "ethan" && sys.name(src).toLowerCase() !== "crystal moogle"){
		return;
	}
	Trivia.resetTrivia();
	Trivia = new TriviaGame();
	triviaq = new QuestionHolder("triviaq.json");
	trivreview = new QuestionHolder("trivreview.json");
	tadmin = new TriviaAdmin("tadmins.txt");
	triviabot.sendMessage(src, "Trivia vars were reset");
}, "Allows you to reset variables");

addAdminCommand("startoff", function(src, commandData, channel) {
	if(sys.name(src).toLowerCase() !== "lamperi" && sys.name(src).toLowerCase() !== "ethan" && sys.name(src).toLowerCase() !== "crystal moogle"){
		return;
	}
	Trivia.startoff = !Trivia.startoff;
	x = (Trivia.startoff == true) ? "off" : "on";
	triviabot.sendMessage(src, "Start is now "+x, channel);
}, "Disallow use of start");

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
	var name = commandData;
	if (sys.dbIp(name) == undefined) {
		triviabot.sendMessage(src, "He/She doesn't exist!");
		return;
	}
	var ableToBan = sys.dbAuth(name) < 1 && !tadmin.isTAdmin(name.toLowerCase());
	var ip = (sys.id(name) !== undefined) ? sys.ip(sys.id(name)) : sys.dbIp(name);
	if (trivData.submitBans[ip] !== undefined) {
		triviabot.sendMessage(src, commandData+" is already banned from submitting.", channel);
		return;
	}
	if (ableToBan) {
		trivData.submitBans[ip] = {
			'by' : sys.name(src),
			'name' : name
		};
		triviabot.sendAll(sys.name(src)+" banned "+name+" from submitting questions.", revchan);
		saveData();
		return;
	} else {
		triviabot.sendMessage(src, "Sorry, you are unable to ban "+name+" from submitting.", channel);
		return;
	}
}, "Ban a user from submitting.");

addAdminCommand("submitunban", function(src, commandData, channel) {
	if (sys.dbIp(commandData) == undefined) {
		triviabot.sendMessage(src, "He/She doesn't exist!");
		return;
	}
	var ip = (sys.id(commandData) !== undefined) ? sys.ip(sys.id(commandData)) : sys.dbIp(commandData);
	if (trivData.submitBans[ip] === undefined) {
		triviabot.sendMessage(src, commandData+" isn't banned from submitting.",channel);
		return;
	}
	delete trivData.submitBans[ip];
	saveData();
	triviabot.sendAll(sys.name(src)+" unbanned "+commandData+" from submitting questions.", revchan);
	return;
}, "Unban a user from submitting.");

addAdminCommand("submitbans", function(src, commandData, channel) {
	if (Object.keys(trivData.submitBans) <= 0) {
		triviabot.sendMessage(src, "There are no submit bans.", channel);
		return;
	}
	// TODO: Make this look nicer later.
	triviabot.sendMessage(src, "Current submit bans:", channel);
	for (b in trivData.submitBans) {
		ip = b;
		who = trivData.submitBans[b].name;
		by = trivData.submitBans[b].by;
		triviabot.sendMessage(src, ip+" ("+who+"). Banned by "+by+".", channel);
	}
	return;
}, "View submit bans.");

addAdminCommand("autostart", function(src, commandData, channel) {
	if (sys.name(src).toLowerCase() != "ethan") return;
	Trivia.autostart = !Trivia.autostart;
	triviabot.sendMessage(src, "Autostart is now " + (Trivia.autostart == true ? "on" : "off") + ".");
	return;
}, "View submit bans.");

// Normal command handling.
exports.handleCommand = function trivia_handleCommand(src, command, channel)
{
    // Only care about trivia channels
    if (channel != triviachan && channel != revchan)
        return;
try { // Debug only, do not indent
    var commandData;
    var indx = command.indexOf(' ');
    if (indx != -1) {
        commandData = command.substr(indx+1);
        command = command.substr(0, indx).toLowerCase();
    } else {
        commandData = ""; // sane default to avoid undefined errors
    }

    // Trivia user commands
    if (userCommands.hasOwnProperty(command)) {
        userCommands[command].call(null, src, commandData, channel);
        return true;
    }

    // Trivia admin commands
    if (sys.auth(src) > 0 || tadmin.isTAdmin(sys.name(src).toLowerCase())) {
        if (adminCommands.hasOwnProperty(command)) {
            adminCommands[command].call(null, src, commandData, channel);
            return true;
        }
    }
} catch(e) {
    sys.sendMessage(src, "Error in your trivia command: " + e, channel);
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
    if (channel == revchan && sys.auth(src) < 1 && !tadmin.isTAdmin(sys.name(src).toLowerCase()))
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

try { // debug only, do not indent
    // allow commands, except me
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
} catch(e) {
    sys.sendMessage(src, "Error in beforeChatMessage: " + e, channel);
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

    Trivia.sendAll("Trivia is now running!");
};
