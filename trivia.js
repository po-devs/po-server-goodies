/* TRIVIA FUNCTIONS */

var Bot = require("bot.js").Bot;

var utilities = require("utilities.js");

var triviabot = new Bot("TriviaBot"),
    triviachan,
    revchan;

var Trivia, triviaq, trivreview, tadmin;

function time()
{
    return Date.now() * 1000;
}

function TriviaGame()
{
    this.id = triviachan;
    this.round = 0;
    this.started = false;
    this.maxPoints = 0;
    this.alreadyUsed = {};
    this.triviaPlayers = {};
    this.submittedAnswers = {};
    this.roundQuestion = 0;
    this.answeringQuestion = false;
    this.triviaPoints = "";
    if (this.lastStopped === undefined)
        this.lastStopped = time();
}

TriviaGame.prototype.htmlAll = function(html)
{
    sys.sendHtmlAll(this.tBorder() + "<center>" + html + "</center>" + this.tBorder(), this.id);
};

TriviaGame.prototype.sendPM = function(src, message, channel)
{
    triviabot.sendMessage(src, message, channel === undefined ? this.id : channel);
};

TriviaGame.prototype.sendAll = function(message, channel)
{
    triviabot.sendAll(message, channel === undefined ? this.id : channel);
};

TriviaGame.prototype.startTrivia = function(src,rand)
{
    if (this.started === true)
    {
        this.sendPM(src,"A trivia game has already started!");
        return;
    }
    var x = time() - this.lastStopped;
    if (x < 16){
        this.sendPM(src,"Sorry, a game was just stopped "+x+" seconds ago.");
        return;
    }
    if (triviaq.questionAmount() < 1)
    {
        this.sendPM(src,"There are no questions.");
        return;
    }
    rand = parseInt(rand, 10);
	if (rand > 102 || rand < 2 )
    {
        this.sendPM(src,"Please do not start a game with more than 102 points, or lower than 2 points.");
        return;
    }
    rand = (isNaN(rand)) ? sys.rand(2,102) : +rand;
    this.maxPoints = rand;
    this.started = true;
    // TODO: enable when working
    // this.sendAll("A #Trivia game was started! First to "+rand+" points wins!",0);
    this.sendAll(sys.name(src)+" started a trivia game! First to "+rand+" points wins!");
    this.answeringQuestion = false;
    sys.delayedCall(function() { Trivia.startTriviaRound(); },15);
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
    this.answeringQuestion = true;
    /* Get the category, question, and answer */
    var q = triviaq.get(questionNumber);
    var category = q.category,
        question = q.question,
        answer = q.answer;
    this.roundQuestion = questionNumber;
    this.htmlAll("<b>Category:</b> "+category.toUpperCase()+"<br>"+question);
    this.alreadyUsed[questionNumber] = true;
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
                var minus = (realTime - responseTime) / 1000; // returns milliseconds so multiply by 1000
                var pointAdd = minus > 6 ? 5 : (minus < 7 && minus > 3 ? 3 : 2);
				// TODO: check answer length, and base pointAdd off of that?

                answeredCorrectly.push(name);
                this.player(name).points += pointAdd;
            } else {
                wrongAnswers.push("<span title='" + utilities.html_escape(name) + "'>" + utilities.html_escape(this.submittedAnswers[id].answer) + "</span>");
            }
        }
    }

    sys.sendAll("",this.id);
    var incorrectAnswers  = wrongAnswers.length > 0 ? " Incorrect answers: "+ wrongAnswers.join(", ") : "";
    sys.sendHtmlAll("<font color='#3daa68'><timestamp/> <font size='3'><b>±TriviaBot:</b></font></font> Time's up!" + incorrectAnswers, this.id);
    this.sendAll("Answered correctly: " + answeredCorrectly.join(", "));
    var x = answers.length != 1 ? "answers were" : "answer was";
    this.sendAll("The correct "+x+": "+answers.join(", "));

    var leaderboard = [];
    var winners = [];
    for (id in this.triviaPlayers)
    {
        var nohtmlname = utilities.html_escape(this.triviaPlayers[id].name);
        leaderboard.push(nohtmlname + " (" + this.triviaPlayers[id].points + ")");
        if (this.triviaPlayers[id].points >= this.maxPoints)
        {
            winners.push(nohtmlname + " (" + this.triviaPlayers[id].points + ")");
        }
    }

    this.sendAll("Leaderboard: "+leaderboard.join(", "));

    if (winners.length > 0) {
        var w = (winners.length == 1) ? "the winner!" : "our winners!";
        this.htmlAll("<h2>Congratulations to "+w+"</h2>"+winners.join(", ")+"");
		Trivia.sendAll("Check the /topic for how to submit a question!",this.id);
        this.resetTrivia();
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
    this.sendAll("Please wait " + rand + " seconds until the next question!");
    sys.delayedCall(function() {
        Trivia.startTriviaRound();
    }, rand);
} catch(e) {
// TODO REMOVE the catch block when this works
    sys.sendAll("script error: " + e, this.id);
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
        this.sendPM(src,"A game hasn't started!");
        return;
    }
    if (this.playerPlaying(src)) {
        this.removePlayer(src);
        this.sendAll(sys.name(src) + " left the game!");
    } else {
        this.sendPM(src,"You haven't joined the game!");
    }
};

TriviaGame.prototype.endTrivia = function(src)
{
    if (this.started === false)
    {
        this.sendPM(src,"A game hasn't started.");
        return;
    }
    this.resetTrivia();
    this.sendAll(sys.name(src)+" stopped the current trivia game!");
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
        this.save();
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

QuestionHolder.prototype.add = function(category,question,answer)
{
    var id = this.freeId();
    var q = this.state.questions[id] = {};
    q.category = category;
    q.question = question;
    q.answer = [].concat(answer);
    this.save();
    return id;
};

QuestionHolder.prototype.remove = function(id)
{
    delete this.state.questions[id];
    this.save();
};

QuestionHolder.prototype.get = function(id)
{
    var q = this.state.questions[id];
    return q === undefined ? null : q;
};

QuestionHolder.prototype.save = function()
{
    sys.writeToFile(this.file,JSON.stringify(this.state));
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
    this.save();
};

QuestionHolder.prototype.changeQuestion = function(id,question)
{
    this.state.questions[id].question = question;
    this.save();
};

QuestionHolder.prototype.changeAnswer = function(id,answer)
{
    this.state.questions[id].answer = answer;
    this.save();
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
    this.save();
};

TriviaAdmin.prototype.removeTAdmin = function(name)
{
    if (!this.isTAdmin(name))
        return;
    var ind = this.admins.indexOf(name.toLowerCase());
    this.admins.splice(ind, 1);
    this.save();
};

TriviaAdmin.prototype.isTAdmin = function(name)
{
    return this.admins.indexOf(name) != -1;
};

TriviaAdmin.prototype.tAdminList = function(src,id)
{
    sys.sendMessage(src,"Current trivia admins are: "+ this.admins.join(","),id);
};

TriviaAdmin.prototype.save = function()
{
	sys.writeToFile(this.file,JSON.stringify(this.admins));
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

addUserCommand("goal", function(src,commandData,channel) {
	if (Trivia.started === false)
	{
		Trivia.sendPM(src,"A trivia game isn't currently running.");
		return;
	}
	
	Trivia.sendPM(src,"The goal for the current game is: "+Trivia.maxPoints);
});

addAdminCommand("removeq", function(src,commandData,channel) {
	var all = triviaq.all();
	for (var b in all)
	{
		var id = b;
		if (commandData === b)
		{
			triviaq.remove(b);
			Trivia.sendPM(src,"Removed question successfully.");
			return;
		}
	}
	
	Trivia.sendPM(src,"Oops! Question doesn't exist");
});

addUserCommand("submitq", function(src, commandData, channel) {
    commandData = commandData.split("*");
    if (commandData.length!=3)
    {
        Trivia.sendPM(src,"Oops! Usage of this command is: /submitq category*question*answer(s)", channel);
        Trivia.sendPM(src,"Separate multiple answers with ','.", channel);
        return;
    }
    var category = utilities.html_escape(commandData[0]);
    var question = utilities.html_escape(commandData[1]);
    var answer = commandData[2].split(",");
    if (question.indexOf("?")==-1)
    {
        Trivia.sendPM(src,"Your question should have a question mark.", channel);
        return;
     }
    var id = trivreview.add(category,question,answer);
    Trivia.sendPM(src,"Your question was submitted.", channel);
	// Enable if needed, but this might spam trivreview...
    // Trivia.sendAll(sys.name(src)+" submitted a question with id " + id +" !",revchan);
});

addUserCommand("join", function(src, commandData, channel) {
    if (Trivia.started === false)
    {
        Trivia.sendPM(src,"A game hasn't started!");
        return;
    }
    if (!sys.dbRegistered(sys.name(src)))
    {
        Trivia.sendPM(src,"Please register before playing Trivia.");
        return;
    }
    if (Trivia.playerPlaying(src)) {
        Trivia.sendPM(src,"You've already joined the game!");
        return;
    }
    Trivia.addPlayer(src);
    Trivia.sendAll(sys.name(src)+" joined the game!");
});

addUserCommand("unjoin", function(src, commandData, channel) {
    if (channel == triviachan)
        Trivia.unjoin(src);
});

addUserCommand("qamount", function(src, commandData, channel) {
    if (channel == triviachan) {
        var qamount = triviaq.questionAmount();
        sys.sendHtmlMessage(src,"<timestamp/> The amount of questions is: <b>"+qamount+"</b>",triviachan);
        return;
    }
});

addUserCommand("tadmins", function(src, commandData, channel) {
    tadmin.tAdminList(src,channel);
});

addAdminCommand("tadmin", function(src, commandData, channel) {
    if (tadmin.isTAdmin(commandData))
    {
		Trivia.sendPM(src,"That person is already a trivia admin.",channel);
		return;
	}
    tadmin.addTAdmin(commandData);
    Trivia.sendPM(src,"That person is now a trivia admin!",channel);
});

addAdminCommand("tadminoff", function(src, commandData, channel) {
    if (!tadmin.isTAdmin(commandData))
	{
		Trivia.sendPM(src,"That person isn't a trivia admin.",channel);
		return;
	}
    tadmin.removeTAdmin(commandData);
    Trivia.sendPM(src,"That person is no longer a trivia admin!",channel);
});

addAdminCommand("triviaban", function(src, commandData, channel) {
	script.issueBan("tban", src, sys.id(commandData), commandData);	
});

addAdminCommand("start", function(src, commandData, channel) {
    Trivia.startTrivia(src,commandData);
});

addAdminCommand("stop", function(src, commandData, channel) {
    Trivia.endTrivia(src);
});

addAdminCommand("say", function(src, commandData, channel) {
    if (commandData === undefined)
    return;
    Trivia.sendAll("("+sys.name(src)+"): "+commandData,channel);
});

addAdminCommand("addallpokemon", function(src, commandData, channel) {
    if (sys.name(src).toLowerCase() == "lamperi" || sys.name(src).toLowerCase() == "ethan"|| sys.name(src).toLowerCase() == "crystal moogle")
	Trivia.addAllPokemon();
});

addAdminCommand("erasequestions", function(src, commandData, channel) {
	if (sys.name(src).toLowerCase() == "lamperi" || sys.name(src).toLowerCase() == "ethan")
	{
		sys.writeToFile("triviaq.json","");
		QuestionHolder.state = {freeId: 0, questions: {}};
	}
});

addAdminCommand("apropos", function(src, commandData, channel) {
    if (commandData === undefined)
        return;
    Trivia.sendPM(src,"Matching questions with '"+commandData+"' are: ",channel);
    var all = triviaq.all(), b, q;
    for (b in all)
    {
        q = all[b];
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase())>-1)
        this.sendPM(src,"Question: '"+q.question+"' (id='" + b + "')", channel);
    }
    all = trivreview.all();
    for (b in all)
    {
        q = all[b];
        if (q.question.toLowerCase().indexOf(commandData.toLowerCase())>-1)
        this.sendPM(src,"Question under review: '"+q.question+"' (id='" + b + "')", channel);
    }

});


addAdminCommand("checkq", function(src, commandData, channel) {
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
	sys.sendMessage(src,"",channel);
});

/*addAdminCommand("checkq", function(src, commandData, channel) {
    var q = trivreview.get(commandData);
    Trivia.sendPM(src,"ID #"+commandData+":", channel);
    Trivia.sendPM(src,"Category: "+q.category, channel);
    Trivia.sendPM(src,"Question: "+q.question, channel);
    Trivia.sendPM(src,"Answer: "+q.answer, channel);
});*/

// TODO: are these well named? also do versions for already accepted questions
addAdminCommand("changea", function(src, commandData, channel) {
    if (commandData === undefined)
        return;
    commandData = commandData.split("*");
    trivreview.changeAnswer(commandData[0],commandData[1]);
    triviabot.sendMessage(src,"The answer for ID #"+commandData[0]+" was changed to "+commandData[1]+"", channel);
});

addAdminCommand("changeq", function(src, commandData, channel) {
    if (commandData === undefined)
        return;
    commandData = commandData.split("*");
    trivreview.changeQuestion(commandData[0],commandData[1]);
    triviabot.sendMessage(src,"The question for ID #"+commandData[0]+" was changed to "+commandData[1], channel);
});

addAdminCommand("changec", function(src, commandData, channel) {
    if (commandData === undefined)
        return;
    commandData = commandData.split("*");
    trivreview.changeAnswer(commandData[0],commandData[1]);
    triviabot.sendMessage(src,"The category for ID #"+commandData[0]+" was changed to "+commandData[1], channel);
});

// TODO: Maybe announce globally to trivreview when somebody accepts a question?

addAdminCommand("accept", function(src, commandData, channel) {
    var q = trivreview.get(commandData);
	if (q !== undefined) {
        triviabot.sendAll(sys.name(src)+" accepted question: id, "+triviaq.questionAmount()+1 /* TODO: get id in a better way */+" category: "+q.category+", question: "+q.question+", answer: "+q.answer,revchan);
        triviaq.add(q.category,q.question,q.answer);
        trivreview.remove(commandData);
	}
    // triviabot.sendMessage(src,"You accepted question ID #"+commandData+"!", channel);
});

addAdminCommand("decline", function(src, commandData, channel) {
    if (trivreview.get(commandData) !== undefined) {
        trivreview.remove(commandData);
        triviabot.sendAll(sys.name(src)+" declined the question.", channel);
	}
});

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

exports.beforeChannelJoin = function trivia_beforeChannelJoin(src, channel) {
    /* Prevent channel join */
    if (channel == revchan
        && sys.auth(src) < 1
        && !tadmin.isTAdmin(sys.name(src)))
    {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        return true;
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
            Trivia.sendPM(src, "You haven't joined, so you are unable to submit an answer.");
            return true;
        }
    }
    if (joined === true && Trivia.started === true && Trivia.answeringQuestion === true)
    {
        if (message.length > 60)
        {
            Trivia.sendPM(src,"Sorry! Your answer is too long.");
            return true;
        }
		
        // Remove commas so the listing looks better
        // This is fine as no answers should include comma.
        Trivia.addAnswer(src, message.replace(/,/gi,""));
        Trivia.sendPM(src,"Your answer was submitted.");
        return true;
    }
} catch(e) {
    sys.sendMessage(src, "Error in beforeChatMessage: " + e, channel);
}
};

exports.init = function trivia_init()
{
    triviachan = utilities.get_or_create_channel("Trivia");
    revchan = utilities.get_or_create_channel("TrivReview");

    if (typeof Trivia === "undefined" || Trivia.started === false)
        Trivia = new TriviaGame();
    triviaq = new QuestionHolder("triviaq.json");
    trivreview = new QuestionHolder("trivreview.json");
    tadmin = new TriviaAdmin("tadmins.txt");

    Trivia.sendAll("Trivia is now running!");
};
