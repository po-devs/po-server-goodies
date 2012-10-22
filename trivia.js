/* TRIVIA FUNCTIONS */

var Bot = require("bot.js").Bot;

var utilities = require("utilities.js");

var triviachan, revchan;
var triviabot = new Bot("Psyduck");

var testfiles = ['triviaq.json', 'trivreview.json', 'tadmins.txt'];

var triviaCategories = [
    'Anime/Manga',
    'Animals',
    'Art',
    'Comics',
    'Economics',
    'Food/Drink',
    'Games',
    'Geography',
    'History',
    'Internet',
    'Language',
    'Literature',
    'Math',
    'Misc',
    'Movies',
    'Music',
    'Mythology',
    'Philosophy',
    'PO',
    'Pokemon',
    'Politics',
    'Psychology',
    'Religion',
    'Science',
    'Society',
    'Space',
    'Sports',
    'Technology',
    'TV',
    'Video Games'
];

// TO-DO: Read from file

for (t in testfiles) {
	if (sys.getFileContent(testfiles[t]) == "" || sys.getFileContent(testfiles[t]) == undefined) {
		sys.writeToFile(testfiles[t], "{}");
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

if (trivData.submitBans == undefined) trivData.submitBans = {};
if (trivData.toFlash == undefined) trivData.toFlash = {};
if (trivData.mutes == undefined) trivData.mutes = {};
//TODO:Load from utilities.js
getSeconds = function(s) {
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
};
getTimeString = function(sec) {
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
};

function isTriviaMuted(ip) {
    if (trivData.mutes[ip] == undefined) {
        return false;
    }
    if (trivData.mutes[ip].expires == "never") {
        return true;
    }
    if (trivData.mutes[ip].expires <= sys.time()) {
        delete trivData.mutes[ip];
        return false;
    }
    return true;
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
function saveData()
{
	sys.writeToFile("trivData.json", JSON.stringify(trivData));
}

function isTriviaOwner(src) {
	lname = sys.name(src).toLowerCase(), owners = ['ethan'];
	if (sys.auth(src) < 1) return false;
	if (sys.auth(src) >= 3) return true;
	if (owners.indexOf(lname) > -1) return true;
	return false;
}

function time()
{
    // Date.now() returns milliseconds since epoch,
    // by dividing by 1000 we get seconds.
    return Date.now()/1000
}

/* Functions for non vowel pokemon questions, to make sure we have all possible pokemon */

function removeVowels(str) {
	return str.replace(/a/gi, '').replace(/e/gi, '').replace(/i/gi, '').replace(/o/gi, '').replace(/u/gi, '');
}

function checkNonVowels(poke) {
	var arr = [];
	for (var b = 1; b < 650; b++) {
		var pokemon = sys.pokemon(b);
		var pokemonwithoutvowels = removeVowels(pokemon), pokewithoutvowels = removeVowels(poke);
		if (pokemonwithoutvowels.toLowerCase() == pokewithoutvowels.toLowerCase()) {
			arr.push(pokemon);
		}
	}
	return arr;
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
    for (p in players) {
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
                // TODO: check answer length, and base time allowed for the question off that?

                answeredCorrectly.push(name);
                this.player(name).points += pointAdd;
            } else {
            	var tanswer = this.submittedAnswers[id].answer;
                wrongAnswers.push("<span title='" + utilities.html_escape(name) + "'>" + utilities.html_escape(tanswer) + "</span>");
                if (/asshole|\bdick|pussy|bitch|porn|nigga|\bcock\b|\bgay|slut|whore|cunt|penis|vagina|nigger/gi.test(tanswer) && !/dickens/gi.test(tanswer)) {
                    if (sys.existChannel("Victory Road"))
                    triviabot.sendAll("Warning: Player "+name+" answered '"+tanswer+"' to the question '"+triviaq.get(this.roundQuestion).question+"' in #Trivia", sys.channelId("Victory Road"));
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
    var displayboard = []
    var winners = [];
    for (id in this.triviaPlayers)
    {
        var regname = this.triviaPlayers[id].name;
        var nohtmlname = utilities.html_escape(regname);
        leaderboard.push([regname,this.triviaPlayers[id].points]);
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
		sendChanHtmlAll("<font size=5><font color='#3daa68'><timestamp/> <b>±Psyduck: </b><font color='red'>While you're waiting for another game, why not submit a question? <a href='http://wiki.pokemon-online.eu/wiki/Community:Trivia#Submitting_Questions'>Help and Guidelines are here!</a></font></font></font>", triviachan);
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
    // initialize next questions
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

TriviaGame.prototype.addAllPokemon = function(src, chan)
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
    this.sendPM(src, "All pokemon were added to the list of questions!", chan);
    return;
};

TriviaGame.prototype.withoutVowels = function(src, chan)
{
    for (var b = 1;b<650;b++)
    {
        var pokemon = sys.pokemon(b);
        var withoutvowels = removeVowels(pokemon);
        var possibleAnswers = checkNonVowels(pokemon);
        triviaq.add("POKEMON : WITHOUT VOWELS","<center><b>"+withoutvowels.toLowerCase()+"</b></center>", String(possibleAnswers.join(',')));
    }
    this.sendPM(src, "All pokemon questions without vowels were added to the list of questions!", chan);
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
        catch(e)
        {
            // TODO: error
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

// TODO: kinda useless prototype
function TriviaAdmin(file)
{
    this.file = file;
    this.admins = [];
    var fileContent = sys.getFileContent(this.file);
    if (fileContent === undefined || fileContent === "") {
		this.saveAdmins();
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
    var contribs = (sys.id(name) !== undefined) ? SESSION.users(sys.id(name)).contributions !== undefined : false;
    var cauth = false;
    if (sys.id(name) !== undefined) {
        cauth = SESSION.channels(revchan).canJoin(sys.id(name)) == "allowed";
    }
    return this.admins.indexOf(name) != -1 || contribs == true || cauth == true
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

addUserCommand("categories", function(src,commandData,channel) {
	if (typeof(triviaCategories) != "object") return;
    triviabot.sendMessage(src, triviaCategories.join(", "), channel);
    triviabot.sendMessage(src, "For more information, refer to: http://wiki.pokemon-online.eu/wiki/Trivia_Categories", channel);
},"Allows you to view the trivia categories");

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
    var user_ip = sys.ip(src), user_ban = trivData.submitBans[user_ip], isAdmin = tadmin.isTAdmin(sys.name(src).toLowerCase());
    if (user_ban !== undefined && !isAdmin) {
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
    if (Trivia.started === false)
    {
        Trivia.sendPM(src,"A game hasn't started!",channel);
        return;
    }
    if(SESSION.users(src).mute.active || isTriviaMuted(sys.ip(src)) || !SESSION.channels(triviachan).canTalk(src)){
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

addOwnerCommand("addallpokemon", function(src, commandData, channel) {
	Trivia.addAllPokemon(src, channel);
},"Adds all the \"Who's that pokémon?\" questions");

addOwnerCommand("addallwithoutvowels", function(src, commandData, channel) {
	Trivia.withoutVowels(src, channel);
},"Adds all the \"Who's that pokémon?\" questions without vowels");

addOwnerCommand("erasequestions", function(src, commandData, channel) {
	if (commandData == undefined || commandData !== 'confirm') {
		triviabot.sendMessage(src, 'Please confirm that you want to erase all questions by typing /erasequestions confirm.', channel);
		return;
	} else {
		sys.writeToFile("triviaq.json", "");
		triviaq.state = {freeId: 0, questions: {}};
		triviabot.sendMessage(src, "Questions erased!", channel);
	}
},"Erases all current questions");

addOwnerCommand("makebackup", function(src, commandData, channel) {
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
},"Makes a backup of current questions.");

addOwnerCommand("updateafter", function(src, commandData, channel) {
    triviabot.sendMessage(src, "Trivia will update after the game",channel);
    Trivia.autostart = false;
    Trivia.needsUpdating = true;
    if (Trivia.started === false) {
        runUpdate();
    }
    return;
}, "Updates trivia after the current game is over");

addOwnerCommand("revertfrom", function(src, commandData, channel) {
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
},"Revert questions.");

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
		/*triviaq.unsafeAdd(q.category,q.question,q.answer);
		var all = triviaq.all(), qid;
		for (var b in all){
			var qu = triviaq.get(b);
			if(qu.question===q.question){
				qid = b;
			}
		}*/
		triviabot.sendAll(sys.name(src)+" pushed back the current question to the end of review",revchan);
		trivreview.declineTime = time();
        trivreview.add(q.category,q.question,q.answer,q.name);
		trivreview.remove(id);
		trivreview.checkq(id+1);
		return;
	}
	triviabot.sendMessage(src, "No more questions!",channel);
},"Allows you to push back a question");

// TODO: Maybe announce globally to trivreview when somebody accepts a question?

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
addOwnerCommand("resetvars", function(src, commandData, channel) {
	Trivia = new TriviaGame();
	triviaq = new QuestionHolder("triviaq.json");
	trivreview = new QuestionHolder("trivreview.json");
	tadmin = new TriviaAdmin("tadmins.txt");
	triviabot.sendMessage(src, "Trivia variables were reset.", channel);
}, "Allows you to reset variables");

addOwnerCommand("startoff", function(src, commandData, channel) {
	Trivia.startoff = !Trivia.startoff;
	triviabot.sendMessage(src, "Start is now " + (Trivia.startoff == true ? "off" : "on"), channel);
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
		var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), revchan]
		for (var x in channels) {
			if (sys.existChannel(sys.channel(channels[x]))) {
				triviabot.sendAll(sys.name(src)+" banned "+name+" from submitting questions.", channels[x]);
			}
		}
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
	var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), revchan]
	for (var x in channels) {
		if (sys.existChannel(sys.channel(channels[x]))) {
			triviabot.sendAll(sys.name(src)+" unbanned "+commandData+" from submitting questions.", channels[x]);
		}
	}
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

addAdminCommand("triviamute", function(src, commandData, channel) {
    if (commandData == undefined || commandData.indexOf(":") == -1) {
        triviabot.sendMessage(src, "Usage: name:reason:time", channel);
        return;
    }
    commandData = commandData.split(":");
    var user = commandData[0], reason = commandData[1], time = commandData[2];
    if (sys.dbIp(user) == undefined) {
        triviabot.sendMessage(src, "Couldn't find "+commandData, channel);
        return;
    }
    var tarip = sys.id(user) == undefined ? sys.dbIp(user) : sys.ip(sys.id(user));
    var ok = sys.auth(src) <= 0 && sys.maxAuth(tarip) <= 0;
    if (sys.maxAuth(tarip) >= sys.auth(src) && !ok) {
        triviabot.sendMessage(src, "Can't do that to higher auth!", channel);
        return;
    }
    if (isTriviaMuted(tarip)) {
        triviabot.sendMessage(src, user+" is already trivia muted!", channel);
        return;
    }
    timestring = "for ";
    seconds = getSeconds(time);
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
        triviabot.sendAll(user+" was trivia muted by "+sys.name(src)+ (time!="forever"? " " + timestring : "") + "! [Reason: "+reason+"]", current);
    }
    if (sys.id(user) != undefined && trivia.PlayerPlaying(src)) {
        trivia.removePlayer(src);
        Trivia.sendAll(user + " was removed from the game!",triviachan);
    }
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
    if (!isTriviaMuted(tarip)) {
        triviabot.sendMessage(src, commandData+" isn't trivia muted!", channel);
        return;
    }
    if (tarip == sys.ip(src) && isTriviaMuted(tarip)) {
        triviabot.sendMessage(src, "You may not trivia unmute yourself!", channel);
        return;
    }
    delete trivData.mutes[tarip];
    var chans = [triviachan, revchan, sachannel];
    for (x in chans) {
        var current = chans[x];
        triviabot.sendAll(commandData+" was trivia unmuted by "+sys.name(src)+ "!", current);
    }
}, "Trivia unmute a user.");

addAdminCommand("triviamutes", function(src, commandData, channel) {
        var name = "Trivia mutes";
        var width=5;
        var max_message_length = 30000;
        var tmp = [];
        var t = parseInt(sys.time(), 10);
        var toDelete = [];
        
        for (ip in trivData.mutes) {
            if (!isTriviaMuted(ip)) continue;
            cmute = trivData.mutes[ip], banned_name = cmute.name, by = cmute.by, banTime = cmute.issued, expires = cmute.expires, reason = cmute.reason;
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
        return;
}, "View trivia mutes.");

addAdminCommand("autostart", function(src, commandData, channel) {
	Trivia.autostart = !Trivia.autostart;
	triviabot.sendMessage(src, "Autostart is now " + (Trivia.autostart == true ? "on" : "off") + ".", channel);
	return;
}, "Auto start games.");

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
    // Trivia owner commands
    if (isTriviaOwner(src)) {
    	if (ownerCommands.hasOwnProperty(command)) {
    		ownerCommands[command].call(null, src, commandData, channel);
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
   
   if (isTriviaMuted(sys.ip(src))) {
      var mute = trivData.mutes[sys.ip(src)];
      triviabot.sendMessage(src, "You are trivia muted by "+mute.by+ (mute.expires == "never" ? "" : " for "+getTimeString(mute.expires - sys.time()))+"! [Reason: "+reason+"]", channel);
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
