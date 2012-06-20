if (typeof tourschan !== "string") {
	tourschan = sys.channelId("Tours")
}

if (typeof tours !== "object") {
	sys.sendAll("Creating new tournament object", tourschan)
	tours = {"queue": [], "globaltime": 0, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": []}
}

var border = "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~:";
var tourcommands = ["join: joins a tournament",
					"unjoin: unjoins a tournament during signups only",
					"queue: lists upcoming tournaments",
					"viewround: views current round",
					"history: views recently played tiers",
					"touradmins: lists all users that can start tournaments",
					"leaderboard [tier]: shows tournament rankings, tier is optional",
					"activeta: lists active tournament admins"]
var touradmincommands = ["*** Parameter Information ***",
					"Parameters can be used by putting 'gen=x' and/or 'mode=singles/doubles/triples'.",
					"For example '/tour Challenge Cup:gen=3 mode=doubles' starts a gen 3 doubles CC tournament.",
					"tour [tier]:[parameters]: starts a tier of that tournament.",
					"endtour [tour]: ends the tour of that tier",
					"sub [newname]:[oldname]: subs newname for oldname",
					"dq [player]: disqualifies a player",
					"remove [tour]: removes a tournament from the queue",
					"start: starts next tournament in the queue immediately",
					"cancelbattle [name]: cancels that player's current battle",
					"config: shows config settings",
					"*** FOLLOWING COMMANDS ARE ADMIN+ COMMANDS ***",
					"touradmin [name]: makes someone a tournament admin",
					"tourdeadmin [name]: fires someone from being tournament admin",
					"configset [var]:[value]: changes config settings",
					"forcestart: ends signups immediately and starts the first round",
					"push [player]: pushes a player into a tournament in signups (DON'T USE UNLESS ASKED)",
					"updatewinmessages: updates win messages from the web",
					"stopautostart: if there are no tournaments running, this will stop new ones from being automatically started by the server until another one is started manually.",
					"clearrankings: clears the tour rankings (owner only)"]
// Debug Messages
function sendDebugMessage(message, chan) {
	if (chan === tourschan && Config.Tours.debug && sys.existChannel(tourserrchan)) {
		sys.sendAll(Config.Tours.tourbot+message,tourserrchan)
	}
}

// Will escape "&", ">", and "<" symbols for HTML output.
function html_escape(text)
{
    var m = text.toString();
    if (m.length > 0) {
        return m.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
    }else{
        return "";
    }
}

function cmp(x1, x2) {
	if (x1.toLowerCase() === x2.toLowerCase()) {
		return true;
	}
	else return false;
}

function modeOfTier(tier) {
	if (tier.indexOf("Doubles") != -1 || ["JAA", "VGC 2009", "VGC 2010", "VGC 2011", "VGC 2012"].indexOf(tier) != -1) {
		return "Doubles";
	}
	else if (tier.indexOf("Triples") != -1) {
		return "Triples";
	}
	return "Singles";
}

// handles time and outputs in d/h/m/s format
function time_handle(time) { //time in seconds
	var day = 60*60*24;
	var hour = 60*60;
	var minute = 60;
	if (time <= 0) {
		return "No time remaining."
	}
	var timedays = parseInt(time/day);
	var timehours = (parseInt(time/hour))%24;
	var timemins = (parseInt(time/minute))%60
	var timesecs = (parseInt(time))%60
	var output = "";
	if (timedays >= 1) {
		if (timedays == 1) {
			output = timedays + " day";
		}
		else {
			output = timedays + " days";
		}
		if (timehours >=1 || timemins >=1 || timesecs >=1) {
			output = output + ", ";
		}
	}
	if (timehours >= 1) {
		if (timehours == 1) {
			output = output + timehours +  " hour";
		}
		else {
			output = output + timehours +  " hours";
		}
		if (timemins >=1 || timesecs >=1) {
			output = output + ", ";
		}
	}
	if (timemins >= 1) {
		if (timemins == 1) {
			output = output + timemins +  " minute";
		}
		else {
			output = output + timemins +  " minutes";
		}
		if (timesecs >=1) {
			output = output + ", ";
		}
	}
	if (timesecs >= 1) {
		if (timesecs == 1) {
			output = output + timesecs +  " second";
		}
		else {
			output = output + timesecs +  " seconds";
		}
	}
	return output;
}

// Tournaments

// This function will get a user's current tournament points overall

function getTourWinMessages() {
	var content = sys.getFileContent("tourwinverbs.txt")
	tourwinmessages = content.split("\n")
}

function getExtraPoints(player) {
	try {
		var data = sys.getFileContent("tourscores.txt")
		var array = data.split("\n")
		var score = 0
		for (var n in array) {
			var scores = array[n].split(":::",2)
			if (player.toLowerCase() === scores[0].toLowerCase()) {
				score = parseInt(scores[1])
				break;
			}
		}
		return score;
	}
	catch (e) {
		return 0;
	}
}

// This function will get a user's current tournament points in a tier
function getExtraTierPoints(player, tier) {
	try {
		var data = sys.getFileContent("tourscores_"+tier.replace(/ /g,"_")+".txt")
		var array = data.split("\n")
		var score = 0
		for (var n in array) {
			var scores = array[n].split(":::",2)
			if (player.toLowerCase() === scores[0].toLowerCase()) {
				score = parseInt(scores[1])
				break;
			}
		}
		return score;
	}
	catch (e) {
		return 0;
	}
}

// saving tour admins list
function saveTourKeys() {
	sys.writeToFile("touradmins.txt", "")
	var tal = tours.touradmins
	for (var n=0;n<tal.length;n++) {
		sys.appendToFile("touradmins.txt", tal[n])
		if (n != tal.length-1) {
			sys.appendToFile("touradmins.txt", ":::")
		}
	}
	return;
}

// This function will get a tier's clauses in readable format
function getTourClauses(tier) {
	var tierclauses = sys.getClauses(tier)
	var clauselist = ["Sleep Clause", "Freeze Clause", "Disallow Spects", "Item Clause", "Challenge Cup", "No Timeout", "Species Clause", "Wifi Battle", "Self-KO Clause"]
	var neededclauses = [];
	for (var c=0;c<9;c++) {
		var denom = Math.pow(2,c+1)
		var num = Math.pow(2,c)
		if (tierclauses%denom >= num) {
			neededclauses.push(clauselist[c])
		}
	}
	return neededclauses.join(", ");
}

function clauseCheck(tier, issuedClauses) {
	var requiredClauses = sys.getClauses(tier)
	var clauselist = ["Sleep Clause", "Freeze Clause", "Disallow Spects", "Item Clause", "Challenge Cup", "No Timeout", "Species Clause", "Wifi Battle", "Self-KO Clause"]
	var clause1 = false;
	var clause2 = false;
	var missing = [];
	var extra = [];
	for (var c=0;c<9;c++) {
		var denom = Math.pow(2,c+1)
		var num = Math.pow(2,c)
		// don't check for disallow spects in non CC tiers , it's checked manually
		if (c == 2 && ["Challenge Cup", "CC 1v1", "Wifi CC 1v1"].indexOf(tier) == -1) {
			continue;
		}
		if (requiredClauses%denom >= num) {
			clause1 = true;
		}
		else {
			clause1 = false;
		}
		if (issuedClauses%denom >= num) {
			clause2 = true;
		}
		else {
			clause2 = false;
		}
		if ((clause1 && clause2) || (!clause1 && !clause2)) {
			continue;
		}
		else if (clause1 && !clause2) {
			missing.push(clauselist[c]);
			continue;
		}
		else if (!clause1 && clause2) {
			extra.push(clauselist[c]);
			continue;
		}
		else {
			sys.sendAll(Config.Tours.tourbot+"Broken clausecheck...", tourserrchan)
			break;
		}
	}
	return {"missing": missing, "extra": extra}
}

// Is name x a sub?
function isSub(name) {
	try {
		if (name === null) {
			return false;
		}
		else if (name.indexOf("~Sub") === 0) {
			return true;
		}
		else return false;
	}
	catch (err) {
		sys.sendAll("Error in determining whether "+name+" is a sub, "+err, tourserrchan)
		return false;
	}
}

// Sends a message to all tour auth and players in the current tour
function sendAuthPlayers(message,key) {
	for (var x in sys.playersOfChannel(tourschan)) {
		var arr = sys.playersOfChannel(tourschan)
		if (isTourAdmin(arr[x]) || tours.tour[key].players.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
			sys.sendMessage(arr[x], message, tourschan)
		}
	}
}

// Sends a html  message to all tour auth and players in the current tour
function sendHtmlAuthPlayers(message,key) {
	for (var x in sys.playersOfChannel(tourschan)) {
		var arr = sys.playersOfChannel(tourschan)
		if (isTourAdmin(arr[x]) || tours.tour[key].players.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
			sys.sendHtmlMessage(arr[x], message, tourschan)
		}
	}
}

// Sends a message to all tour auth
function sendAllTourAuth(message) {
	for (var x in sys.playersOfChannel(tourschan)) {
		var arr = sys.playersOfChannel(tourschan)
		if (isTourAdmin(arr[x])) {
			sys.sendMessage(arr[x], message, tourschan)
		}
	}
}

function initTours() {
	// config object
	try {
		Config.Tours = {
			maxqueue: parseInt(sys.getVal("tourconfig.txt", "maxqueue")),
			maxarray: 1023,
			maxrunning: parseInt(sys.getVal("tourconfig.txt", "maxrunning")),
			toursignup: parseInt(sys.getVal("tourconfig.txt", "toursignup")),
			tourdq: parseInt(sys.getVal("tourconfig.txt", "tourdq")),
			subtime: parseInt(sys.getVal("tourconfig.txt", "subtime")),
			activity: parseInt(sys.getVal("tourconfig.txt", "touractivity")),
			tourbreak: parseInt(sys.getVal("tourconfig.txt", "breaktime")),
			abstourbreak: parseInt(sys.getVal("tourconfig.txt", "absbreaktime")),
			reminder: parseInt(sys.getVal("tourconfig.txt", "remindertime")),
			channel: "Tours",
			errchannel: "Developer's Den",
			tourbotcolour: "#3DAA68",
			version: 0.986,
			debug: false,
			points: true
		}
	}
	catch (e) {
		sys.sendAll("No tour config data detected, getting default values", tourschan)
		Config.Tours = {
			maxqueue: 4,
			maxarray: 1023,
			maxrunning: 3,
			toursignup: 200,
			tourdq: 180,
			subtime: 90,
			activity: 200,
			tourbreak: 120,
			abstourbreak: 600,
			reminder: 30,
			channel: "Tours",
			errchannel: "Developer's Den",
			tourbotcolour: "#3DAA68",
			version: 0.986,
			debug: false,
			points: true
		}
	}
	if (Config.Tours.tourbot === undefined) {
		Config.Tours.tourbot = "\u00B1Tours: "
	}
	tourschan = sys.channelId("Tours");
	tourserrchan = sys.channelId("Indigo Plateau");
	if (sys.existChannel(Config.Tours.channel)) {
		tourschan = sys.channelId(Config.Tours.channel)
	}
	if (sys.existChannel(Config.Tours.errchannel)) {
		tourserrchan = sys.channelId(Config.Tours.errchannel)
	}
	if (typeof tours != "object") {
		sys.sendAll("Creating new tournament object", tourschan)
		tours = {"queue": [], "globaltime": 0, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": []}
	}
	try {
		getTourWinMessages()
		sys.sendAll("Win messages added", tourschan)
	}
	catch (e) {
		// use a sample set of win messages
		tourwinmessages = ["annihilated", "threw a table at", "blasted", "captured the flag from", "FALCON PAAAAWNCHED", "haxed", "outsmarted", "won against", "hung, drew and quartered"];
		sys.sendAll("No win messages detected, using default win messages", tourschan)
	}
	try {
		var data = (sys.getFileContent("touradmins.txt")).split(":::")
		for (var d=0;d<data.length;d++) {
			var info = data[d]
			if (info === undefined || info == "") {
				data.splice(d,1)
			}
		}
		tours.touradmins = data
	}
	catch (e) {
		sys.sendAll("No tour admin data detected, leaving blank", tourschan)
	}
	sys.sendAll("Version "+Config.Tours.version+" of tournaments has been loaded successfully in this channel!", tourschan)
	/* Tournament vars 
	queue: list of upcoming tours, globaltime: global time keeper, keys: identify each tour, tour: holds all tour data, history: tour history */
}

/* Tournament Step Event
Used for things such as
- sending reminders
- starting new tours automatically
- disqualifying/reminding inactive players
- removing subs */
function tourStep() {
	for (var x in tours.tour) {
		if (tours.tour[x].time-parseInt(sys.time()) <= 10) {
			sendDebugMessage("Time Remaining in the "+tours.tour[x].tourtype+" tournament: "+time_handle(tours.tour[x].time-parseInt(sys.time()))+"; State: "+tours.tour[x].state,tourschan)
		}
		if (tours.tour[x].state == "signups") {
			if (tours.tour[x].time <= parseInt(sys.time())) {
				tourinitiate(x)
				continue;
			}
			var variance = calcVariance()
			tours.globaltime = parseInt(sys.time()) + parseInt(Config.Tours.abstourbreak/variance) // default 10 mins b/w signups, + 5 secs per user in chan
			continue;
		}
		if (tours.tour[x].state == "subround" && tours.tour[x].time <= parseInt(sys.time())) {
			tours.tour[x].time = parseInt(sys.time())+Config.Tours.tourdq-Config.Tours.subtime
			removesubs(x)
			continue;
		}
		if (tours.tour[x].state == "subround" || tours.tour[x].state == "round" || tours.tour[x].state == "final") {
			if (tours.tour[x].time <= parseInt(sys.time()) && (parseInt(sys.time())-tours.tour[x].time)%60 === 0 && tours.tour[x].state != "subround") {
				removeinactive(x)
				continue;
			}
			if ((tours.tour[x].time-(tours.tour[x].state == "subround" ? Config.Tours.subtime : Config.Tours.tourdq)+Config.Tours.reminder) == parseInt(sys.time())) {
				sendReminder(x)
				continue;
			}
		}
	}
	if (tours.globaltime <= parseInt(sys.time()) && tours.globaltime != 0 && Config.Tours.maxrunning > tours.keys.length) {
		if (tours.queue.length > 0) {
			var data = tours.queue[0].split(":::",4)
			var tourtostart = data[0]
			var starter = data[1]
			var parameters = {"mode": data[2], "gen": data[3]}
			tours.queue.splice(0,1)
			tourstart(tourtostart,starter,tours.key,parameters)
			tours.globaltime = parseInt(sys.time()) + 1200
		}
		else if (tours.keys.length === 0) {
			// start a random tour from tourarray
			var tourarray = ["Challenge Cup", "Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Wifi OU", "Wifi OU", "Wifi OU", "Wifi UU", "Wifi LU", "Wifi NU", "DW OU", "DW 1v1"]
			var tourtostart = tourarray[sys.rand(0, tourarray.length)]
			tourstart(tourtostart,"~~Server~~",tours.key,{"mode": modeOfTier(tourtostart), "gen": 5})
			tours.globaltime = parseInt(sys.time()) + 1200
		}
	}
}

// Battle Start
function tourBattleStart(src, dest, clauses, rated, mode) {
	var name1 = sys.name(src).toLowerCase()
	var name2 = sys.name(dest).toLowerCase()
	var key = null
	for (var x in tours.tour) {
		if (tours.tour[x].players.indexOf(name1) != -1) {
			key = x;
			break;
		}
		if (tours.tour[x].players.indexOf(name2) != -1) {
			key = x;
			break;
		}
	}
	if (key === null) return false;
	if (rated) return false;
	// checking after start
	var battlecheck = isValidTourBattle(src,dest,clauses,mode,key,false)
	if (battlecheck != "Valid") {
		sys.sendAll(Config.Tours.tourbot+"The match between "+name1+" and "+name2+" was not able to be validated. Please ensure you are using the correct clauses, mode and that you are battling the right player. [Reason: "+battlecheck+"]", tourschan)
		return false;
	}
	if (tours.tour[key].players.indexOf(name1) > -1 && tours.tour[key].players.indexOf(name2) > -1) {
		tours.tour[key].battlers.push(name1, name2)
		tours.tour[key].active.push(name1, name2) // this avoids dq later since they made an attempt to start
		return true;
	}
	return false;
}

// battle ending functions; called from afterBattleEnd
function tourBattleEnd(winner, loser, result) {
	var winname = sys.name(winner).toLowerCase()
	var losename = sys.name(loser).toLowerCase()
	var key = null;
	for (var x in tours.tour) {
		if (tours.tour[x].players.indexOf(winname) != -1) {
			key = x;
			break;
		}
		if (tours.tour[x].players.indexOf(losename) != -1) {
			key = x;
			break;
		}
	}
	if (key === null) return;
	/* For tournament matches */
	if (tours.tour[key].players.indexOf(winname) > -1 && tours.tour[key].players.indexOf(losename) > -1) {
		var winindex = tours.tour[key].battlers.indexOf(winname)
		if (winindex != -1) tours.tour[key].battlers.splice(winindex,1)
		var loseindex = tours.tour[key].battlers.indexOf(losename)
		if (loseindex != -1) tours.tour[key].battlers.splice(loseindex,1)
		if (winindex == -1 || loseindex == -1) {
			return;
		}
		if (result == "tie") {
			sys.sendAll(Config.Tours.tourbot+"The match between "+winname+" and "+losename+" ended in a tie, please rematch!", tourschan)
			return;
		}
		battleend(winner, loser, key)
	}
}

// Challenge Issuing Functions
function tourChallengeIssued(src, dest, clauses, rated, mode) {
	var key = null
	var srcindex = null
	var destindex = null
	for (var x in tours.tour) {
		if (tours.tour[x].players.indexOf(sys.name(src).toLowerCase()) != -1) {
			key = x;
			break;
		}
		if (tours.tour[x].players.indexOf(sys.name(dest).toLowerCase()) != -1) {
			key = x;
			break;
		}
	}
	if (key !== null) {
		srcindex = tours.tour[key].players.indexOf(sys.name(src).toLowerCase())
		destindex = tours.tour[key].players.indexOf(sys.name(dest).toLowerCase())
	}
	if ((srcindex != -1 || destindex != -1) && srcindex != null && destindex != null) {
		var tcomment = isValidTourBattle(src,dest,clauses,mode,key,true)
		if (tcomment != "Valid") {
			sys.sendMessage(src, Config.Tours.tourbot + tcomment);
			if (tcomment == "Your opponent is in the wrong tier.") {
				sys.sendMessage(dest, Config.Tours.tourbot + "You are in the wrong tier, you need to be in the "+tours.tour[key].tourtype+" tier for your battle.");
			}
			return true;
		}
		return false;
	}
	else return false;
}

// Tournament Command Handler
function tourCommand(src, command, commandData) {
	try {
		if (isTourOwner(src)) {
			if (command == "clearrankings") {
				sys.writeToFile("tourscores.txt", "")
				var tiers = sys.getTierList()
				for (var x in tiers) {
					sys.writeToFile("tourscores_"+tiers[x].replace(/ /g,"_")+".txt","")
				}
				sys.sendAll(Config.Tours.tourbot+sys.name(src)+" cleared the tour rankings!",tourschan)
				return true;
			}
		}
		if (isTourSuperAdmin(src)) {
			/* Tournament Admins etc. */
			if (command == "touradmin") {
				var tadmins = tours.touradmins
				if (sys.dbIp(commandData) === undefined) {
					sys.sendMessage(src,Config.Tours.tourbot+"This user doesn't exist!",tourschan)
					return true;
				}
				if (!sys.dbRegistered(commandData)) {
					sys.sendMessage(src,Config.Tours.tourbot+"They aren't registered so you can't give them authority!",tourschan)
					if (sys.id(commandData) !== undefined) {
						sys.sendMessage(sys.id(commandData), Config.Tours.tourbot+"Please register ASAP, before getting tour authority.")
					}
					return true;
				}
				if (sys.dbAuth(commandData) >= 1) {
					sys.sendMessage(src,Config.Tours.tourbot+"They can already start tours!",tourschan)
					return true;
				}
				if (tadmins !== undefined) {
					for (var t in tadmins) {
						if (tadmins[t].toLowerCase() == commandData.toLowerCase()) {
							sys.sendMessage(src,Config.Tours.tourbot+"They are already a tour admin!",tourschan)
							return true;
						}
					}
				}
				tadmins.push(commandData) 
				tours.touradmins = tadmins
				saveTourKeys()
				sys.sendAll(Config.Tours.tourbot+sys.name(src)+" promoted "+commandData.toLowerCase()+" to a tournament admin!",tourschan)
				return true;
			}
			if (command == "tourdeadmin") {
				var tadmins = tours.touradmins
				if (sys.dbIp(commandData) === undefined) {
					sys.sendMessage(src,Config.Tours.tourbot+"This user doesn't exist!",tourschan)
					return true;
				}
				var index = -1
				if (tadmins !== undefined) {
					for (var t=0;t<tadmins.length;t++) {
						if (tadmins[t].toLowerCase() == commandData.toLowerCase()) {
							index = t;
							break;
						}
					}
				}
				if (index == -1) {
					sys.sendMessage(src,Config.Tours.tourbot+"They are not a tour admin!",tourschan)
					return true;
				}
				tadmins.splice(index,1) 
				tours.touradmins = tadmins
				saveTourKeys()
				sys.sendAll(Config.Tours.tourbot+sys.name(src)+" fired "+commandData.toLowerCase()+" from running tournaments!",tourschan)
				return true;
			}
			
			if (command == "stopautostart") {
				tours.globaltime = 0
				sys.sendAll(Config.Tours.tourbot+sys.name(src)+" stopped tournaments from auto starting for now, this will be removed when another tour is started.",tourschan)
				return true;
			}
			if (command == "forcestart") {
				var key = null;
				for (var x in tours.tour) {
					if (tours.tour[x].state == "signups") {
						key = x;
					}
				}
				if (key === null) {
					sys.sendMessage(src, Config.Tours.tourbot+"There are no tournaments currently in signups to force start! Use /tour [tier] instead, or /start to start the next tournament in the queue!", tourschan)
					return true;
				}
				if (tours.tour[x].players.length < 3) {
					sys.sendMessage(src, Config.Tours.tourbot+"There are not enough players to start!", tourschan)
					return true;
				}
				tourinitiate(key);
				sys.sendAll(Config.Tours.tourbot+"The "+tours.tour[x].tourtype+" tour was force started by "+sys.name(src)+".", tourschan)
				return true;
			}
			if (command == "configset") {
				var data = commandData.split(':',2)
				if (commandData.length < 2) {
					sys.sendMessage(src,"*** CONFIG SETTINGS ***",tourschan)
					sys.sendMessage(src,"Usage: /configset [var]:[value]. Variable list and current values are below:",tourschan)
					sys.sendMessage(src,"Example: '/configset maxqueue:3' will set the maximum queue length to 3:",tourschan)
					sys.sendMessage(src,"maxqueue: "+Config.Tours.maxqueue,tourschan)
					sys.sendMessage(src,"maxrunning: "+Config.Tours.maxrunning,tourschan)
					sys.sendMessage(src,"toursignup: "+time_handle(Config.Tours.toursignup),tourschan)
					sys.sendMessage(src,"tourdq: "+time_handle(Config.Tours.tourdq),tourschan)
					sys.sendMessage(src,"touractivity: "+time_handle(Config.Tours.activity),tourschan)
					sys.sendMessage(src,"subtime: "+time_handle(Config.Tours.subtime),tourschan)
					sys.sendMessage(src,"breaktime: "+time_handle(Config.Tours.tourbreak),tourschan)
					sys.sendMessage(src,"absbreaktime: "+time_handle(Config.Tours.abstourbreak),tourschan)
					sys.sendMessage(src,"remindertime: "+time_handle(Config.Tours.reminder),tourschan)
					sys.sendMessage(src,"botname: "+Config.Tours.tourbot,tourschan)
					sys.sendMessage(src,"debug: "+Config.Tours.debug+" (to change this, type /configset debug [0/1] ~ true = 1; false = 0)",tourschan)
					return true;
				}
				var option = data[0].toLowerCase()
				if (["botname", "channel", "errchannel"].indexOf(option) == -1) {
					var value = parseInt(data[1])
				}
				else {
					var value = data[1]
				}
				if (option == 'maxqueue') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value between 1 and 255 that determines the maximum queue length. Admins and owners can bypass this restriction.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.maxqueue,tourschan);
						return true;
					}
					else if (value < 1 || value > 255) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 1 and 255.",tourschan)
						return true;
					}
					Config.Tours.maxqueue = value
					sys.saveVal("tourconfig.txt", "maxqueue", value)
					sendAllTourAuth("Maximum queue length now set to "+Config.Tours.maxqueue)
					return true;
				}
				else if (option == 'maxrunning') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value between 1 and 255 that determines the maximum rumber of simultaneous tours.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.maxrunning,tourschan);
						return true;
					}
					else if (value < 1 || value > 255) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 1 and 255.",tourschan)
						return true;
					}
					Config.Tours.maxrunning = value
					sys.saveVal("tourconfig.txt", "maxrunning", value)
					sendAllTourAuth("Maximum number of simultaneous tours now set to "+Config.Tours.maxrunning)
					return true;
				}
				else if (option == 'toursignup') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) between 10 and 600 that determines the intial signup length.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.toursignup,tourschan);
						return true;
					}
					else if (value < 10 || value > 600) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 10 and 600.",tourschan)
						return true;
					}
					Config.Tours.toursignup = value
					sys.saveVal("tourconfig.txt", "toursignup", value)
					sendAllTourAuth("Sign up now set to "+time_handle(Config.Tours.toursignup))
					return true;
				}
				else if (option == 'tourdq') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) between 30 and 300 that determines how long it is before inactive users are disqualified.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.tourdq,tourschan);
						return true;
					}
					else if (value < 30 || value > 300) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 30 and 300.",tourschan)
						return true;
					}
					Config.Tours.tourdq = value
					sys.saveVal("tourconfig.txt", "tourdq", value)
					sendAllTourAuth("Disqualification time now set to "+time_handle(Config.Tours.tourdq))
					return true;
				}
				else if (option == 'touractivity') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) between 60 and 300 that determines how long it is from a user's last message before a user is considered inactive.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.activity,tourschan);
						return true;
					}
					else if (value < 60 || value > 300) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 60 and 300.",tourschan)
						return true;
					}
					Config.Tours.activity = value
					sys.saveVal("tourconfig.txt", "touractivity", value)
					sendAllTourAuth("Activity time now set to "+time_handle(Config.Tours.activity))
					return true;
				}
				else if (option == 'subtime') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) between 30 and 300 that determines how long it is before subs are disqualified.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.subtime,tourschan);
						return true;
					}
					else if (value < 30 || value > 300) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 30 and 300.",tourschan)
						return true;
					}
					Config.Tours.subtime = value
					sys.saveVal("tourconfig.txt", "subtime", value)
					sendAllTourAuth("Sub time now set to "+time_handle(Config.Tours.subtime))
					return true;
				}
				else if (option == 'breaktime') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) between 30 and 300 that determines how long it is before another tournament is started if one gets cancelled.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.breaktime,tourschan);
						return true;
					}
					else if (value < 30 || value > 300) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 30 and 300.",tourschan)
						return true;
					}
					Config.Tours.tourbreak = value
					sys.saveVal("tourconfig.txt", "breaktime", value)
					sendAllTourAuth("Break time (betweeen the finish of one tour and the start of the next) now set to "+time_handle(Config.Tours.tourbreak))
					return true;
				}
				else if (option == 'absbreaktime') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) between 300 and 1800 that influences how long it is between tournaments starting. The actual time will depend on other factors.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.absbreaktime,tourschan);
						return true;
					}
					else if (value < 300 || value > 1800) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 300 and 1800.",tourschan)
						return true;
					}
					Config.Tours.abstourbreak = value
					sys.saveVal("tourconfig.txt", "absbreaktime", value)
					sendAllTourAuth("Absolute break time (time between starting tours) now set to "+time_handle(Config.Tours.abstourbreak))
					return true;
				}
				else if (option == 'remindertime') {
					if (isNaN(value)) {
						sys.sendMessage(src,Config.Tours.tourbot+"A value (in seconds) that determines how long it is before a battle reminder is sent to players.",tourschan);
						sys.sendMessage(src,Config.Tours.tourbot+"Current Value: "+Config.Tours.reminder,tourschan);
						return true;
					}
					else if (value < 15 || value > (Config.Tours.tourdq-30)) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be between 15 and "+(Config.Tours.tourdq-30)+".",tourschan)
						return true;
					}
					Config.Tours.reminder = value
					sys.saveVal("tourconfig.txt", "remindertime", value)
					sendAllTourAuth("Reminder time now set to "+time_handle(Config.Tours.reminder))
					return true;
				}
				else if (option == 'botname') {
					if (!isTourOwner(src)) {
						sys.sendMessage(src,Config.Tours.tourbot+"Can't change the botname, ask an owner for this.",tourschan)
						return true;
					}
					else if (value.length === 0) {
						sys.sendMessage(src,Config.Tours.tourbot+"Botname can't be empty!",tourschan)
						return true;
					}
					Config.Tours.tourbot = value+" "
					sendAllTourAuth("Tourbot name now set to "+Config.Tours.tourbot,tourschan)
					return true;
				}
				else if (option == 'debug') {
					if (!isTourOwner(src)) {
						sys.sendMessage(src,Config.Tours.tourbot+"Can't turn debug on/off, ask an owner for this.",tourschan)
						return true;
					}
					if (value !== 0 && value != 1) {
						sys.sendMessage(src,Config.Tours.tourbot+"Value must be 0 (turns debug off) or 1 (turns it on).",tourschan)
						return true;
					}
					Config.Tours.debug = (value == 1 ? true : false)
					sendAllTourAuth("Debug mode now set to "+Config.Tours.debug,tourschan)
					return true;
				}
				else {
					sys.sendMessage(src,Config.Tours.tourbot+"The configuration option '"+option+"' does not exist.",tourschan)
					return true;
				}
			}
			if (command == "push") {
				var key = null
				var target = commandData.toLowerCase()
				for (var x in tours.tour) {
					if (tours.tour[x].state == "signups") {
						key = x;
						break;
					}
				}
				if (key === null) {
					sys.sendMessage(src,Config.Tours.tourbot+"You can't push anyone into a tournament now!",tourschan)
					return true;
				}
				/* Is already in another tour */
				for (var x in tours.tour) {
					if (tours.tour[x].players.indexOf(target) != -1) {
						sys.sendMessage(src,Config.Tours.tourbot+"You can't push them in another tour!",tourschan)
						return true;
					}
				}
				tours.tour[key].players.push(target)
				tours.tour[key].cpt += 1
				if (tours.tour[key].maxcpt !== undefined) {
					if (tours.tour[key].cpt > tours.tour[key].maxcpt) {
						tours.tour[key].maxcpt = tours.tour[key].cpt
						if (tours.tour[key].maxcpt == 5) {
							tours.tour[key].time += 30
						}
						else if (tours.tour[key].maxcpt == 9) {
							tours.tour[key].time += 60
						}
						else if (tours.tour[key].maxcpt == 17) {
							tours.tour[key].time += 90
						}
						else if (tours.tour[key].maxcpt == 33) {
							tours.tour[key].time += 120
						}
						else if (tours.tour[key].maxcpt == 65) {
							tours.tour[key].time += 180
						}
						else if (tours.tour[key].maxcpt == 129) {
							tours.tour[key].time += 240
						}
					}
				}
				// 128 players for technical reasons
				if (tours.tour[key].players.length >= 128) {
					tours.tour[key].time = parseInt(sys.time())
				}
				sys.sendAll(Config.Tours.tourbot+toCorrectCase(target)+" was added to the "+tours.tour[key].tourtype+" tournament by "+sys.name(src)+" (player #"+tours.tour[key].players.length+"), "+(tours.tour[key].time - parseInt(sys.time()))+" seconds remaining!", tourschan)
				return true;
			}
			// enabled for now!
			if (command == "updatewinmessages") {
				sys.sendMessage(src, Config.Tours.tourbot, "Fetching win messages...", tourschan);
				sys.webCall("https://raw.github.com/lamperi/po-server-goodies/master/tourwinverbs.txt", function(resp) {
					if (resp !== "") {
						sys.writeToFile('tourwinverbs.txt', resp);
						getTourWinMessages()
						sys.sendMessage(src, Config.Tours.tourbot + 'Updated win messages!', tourschan);
					} else {
						sys.sendMessage(src, Config.Tours.tourbot + 'Failed to update!', tourschan);
					}
				});
				return true;
			}
		}
		if (isTourAdmin(src)) {
			if (command == "tour") {
				var data = commandData.split(":",2)
				var thetier = data[0].toLowerCase()
				var tiers = sys.getTierList()
				var found = false;
				for (var x in tiers) {
					if (tiers[x].toLowerCase() == thetier) {
						var tourtier = tiers[x];
						found = true;
						break;
					}
				}
				if (!found) {
					sys.sendMessage(src, Config.Tours.tourbot+"The tier '"+commandData+"' doesn't exist! Make sure the tier is typed out correctly and that it exists.", tourschan)
					return true;
				}
				var isSignups = false;
				for (var x in tours.tour) {
					if (tours.tour[x].state == "signups") {
						isSignups = true;
					}
				}
				var parameters = {"gen": "default", "mode": modeOfTier(tourtier)}
				var allgentiers = ["Challenge Cup", "Metronome", "CC 1v1", "Wifi CC 1v1"]
				if (data.length > 1) {
					var parameterdata = data[1].split(" ");
					for (var p in parameterdata) {
						var parameterinfo = parameterdata[p].split("=",2);
						var parameterset = parameterinfo[0]
						var parametervalue = parameterinfo[1]
						if (cmp(parameterset, "mode")) {
							var singlesonlytiers = ["DW 1v1", "DW 1v1 Ubers", "CC 1v1", "Wifi CC 1v1", "GBU Singles", "Adv Ubers", "Adv OU", "DP Ubers", "DP OU", "DW OU", "DW Ubers", "Wifi OU", "Wifi Ubers"];
							if ((modeOfTier(tourtier) == "Doubles" || modeOfTier(tourtier) == "Triples" || singlesonlytiers.indexOf(tourtier) != -1) && !cmp(parametervalue, modeOfTier(tourtier))) {
								sys.sendMessage(src, Config.Tours.tourbot+"The "+tourtier+" tier can only be played in " + modeOfTier(tourtier) + " mode!", tourschan);
								return true;
							}
							if (cmp(parametervalue, "singles")) {
								parameters.mode = "Singles";
							}
							else if (cmp(parametervalue, "doubles")) {
								parameters.mode = "Doubles";
							}
							else if (cmp(parametervalue, "triples")) {
								parameters.mode = "Triples";
							}
						}
						else if (cmp(parameterset, "gen")) {
							var gen = parseInt(parametervalue)
							if (gen < 1 || gen > 5) {
								gen = 5
							}
							parameters.gen = gen
						}
						else {
							sys.sendMessage(src, Config.Tours.tourbot+"Warning! The parameter '"+parameterset+"' does not exist!", tourschan);
						}
					}
				}
				if (allgentiers.indexOf(tourtier) != -1 && parameters.gen === "default") {
					parameters.gen = 5;
				}
				if (tours.queue.length >= Config.Tours.maxqueue && !isTourSuperAdmin(src)) {
					sys.sendMessage(src, Config.Tours.tourbot+"There are already "+Config.Tours.maxqueue+" or more tournaments in the queue, so you can't add another one!", tourschan)
					return true;
				}
				else if (tours.keys.length > 0 || tours.queue.length > 0 || isSignups) {
					tours.queue.push(tourtier+":::"+sys.name(src)+":::"+parameters.mode+":::"+parameters.gen)
					sys.sendAll(Config.Tours.tourbot+sys.name(src)+" added a "+tourtier+" tournament into the queue! Type /queue to see what is coming up next.",tourschan)
				}
				else {
					tourstart(tourtier, sys.name(src), tours.key, parameters)
				}
				return true;
			}
			if (command == "remove") {
				var index = -1
				for (var a=0;a<tours.queue.length;a++) {
					var tourtoremove = (tours.queue[a].split(":::",1))[0].toLowerCase()
					if (commandData.toLowerCase() == tourtoremove) {
						index = a
						break;
					}
				}
				if (index == -1) {
					sys.sendMessage(src, Config.Tours.tourbot+"The tier '"+commandData+"' doesn't exist in the queue, so it can't be removed! Make sure the tier is typed out correctly.", tourschan)
					return true;
				}
				else {
					var removedtour = (tours.queue[index].split(":::",1))[0]
					tours.queue.splice(index, 1)
					sys.sendAll(Config.Tours.tourbot+"The "+removedtour+" tour was removed from the queue by "+sys.name(src)+".", tourschan)
					return true;
				}
			}
			if (command == "start") {
				for (var x in tours.tour) {
					if (tours.tour[x].state == "signups") {
						sys.sendMessage(src, Config.Tours.tourbot+"A tournament is already in signups!")
						return true;
					}
				}
				if (tours.queue.length != 0) {
					var data = tours.queue[0].split(":::",4)
					var tourtostart = data[0]
					var parameters = {"mode": data[2], "gen": data[3]}
					tours.queue.splice(0,1)
					tourstart(tourtostart, sys.name(src), tours.key, parameters)
					sys.sendAll(Config.Tours.tourbot+sys.name(src)+" force started the "+tourtostart+" tournament!",tourschan)
					return true;
				}
				else {
					sys.sendMessage(src, Config.Tours.tourbot+"There are no tournaments to force start! Use /tour [tier] instead!", tourschan)
					return true;
				}
			}
			if (command == "endtour") {
				var tier = commandData
				var key = null
				for (var x in tours.tour) {
					if (tours.tour[x].tourtype.toLowerCase() == commandData.toLowerCase()) {
						key = x;
						break;
					}
				}
				if (key === null) {
					sys.sendMessage(src,Config.Tours.tourbot+"The "+commandData+" tournament is not in progress!",tourschan)
					return true;
				}
				sys.sendAll(Config.Tours.tourbot+"The "+tours.tour[x].tourtype+" tournament was cancelled by "+sys.name(src)+"!", tourschan)
				delete tours.tour[key];
				tours.keys.splice(tours.keys.indexOf(key), 1);
				return true;
			}
			if (command == "dq") {
				var key = null
				for (var x in tours.tour) {
					if (tours.tour[x].players.indexOf(commandData.toLowerCase()) != -1) {
						key = x;
						break;
					}
				}
				if (key === null) {
					sys.sendMessage(src,Config.Tours.tourbot+"That player isn't in a tournament!",tourschan)
					return true;
				}
				if (tours.tour[key].state == "signups") {
					var index = tours.tour[key].players.indexOf(commandData.toLowerCase())
					tours.tour[key].players.splice(index, 1)
					tours.tour[key].cpt -= 1
					sys.sendAll(Config.Tours.tourbot+toCorrectCase(commandData)+" was taken out of the tournament signups by "+sys.name(src)+" from the "+tours.tour[key].tourtype+" tournament!", tourschan);
				}
				else {
					sys.sendAll(Config.Tours.tourbot+sys.name(src)+" disqualified "+toCorrectCase(commandData)+" from the "+tours.tour[key].tourtype+" tournament!", tourschan)
					disqualify(commandData.toLowerCase(), key, false)
				}
				return true;
			}
			if (command == "cancelbattle") {
				var key = null
				for (var x in tours.tour) {
					if (tours.tour[x].players.indexOf(commandData.toLowerCase()) != -1) {
						key = x;
						break;
					}
				}
				if (key === null) {
					sys.sendMessage(src,Config.Tours.tourbot+"That player isn't in a tournament!",tourschan)
					return true;
				}
				var index = tours.tour[key].battlers.indexOf(commandData.toLowerCase())
				if (index == -1) {
					sys.sendMessage(src,Config.Tours.tourbot+"That player isn't battling for the tournament!",tourschan)
					return true;
				}
				else {
					var oppindex = index%2 === 0 ? index+1 : index-1
					sys.sendAll(Config.Tours.tourbot+sys.name(src)+" voided the results of the battle between "+toCorrectCase(commandData)+" and "+toCorrectCase(tours.tour[key].battlers[oppindex])+" in the "+tours.tour[key].tourtype+" tournament, please rematch.", tourschan)
					tours.tour[key].battlers.splice(index,1)
					tours.tour[key].battlers.splice(oppindex,1)
				}
				return true;
			}
			if (command == "sub") {
				var data = commandData.split(":",2)
				var newname = data[0].toLowerCase()
				var oldname = data[1].toLowerCase()
				var key = null
				for (var x in tours.tour) {
					if (tours.tour[x].players.indexOf(oldname) != -1 && tours.tour[x].state != "signups") {
						key = x;
						break;
					}
				}
				if (sys.id(newname) === undefined) {
					sys.sendMessage(src,Config.Tours.tourbot+"It's not a good idea to sub a player in who isn't on the server at the moment!",tourschan)
					return true;
				}
				if (key === null) {
					sys.sendMessage(src,Config.Tours.tourbot+"No substitutes can be made!",tourschan)
					return true;
				}
				if (tours.tour[key].players.indexOf(oldname) == -1) {
					sys.sendMessage(src,Config.Tours.tourbot+"Your target doesn't exist in the tournament!",tourschan)
					return true;
				}
				tours.tour[key].players.splice(tours.tour[key].players.indexOf(oldname),1,newname)
				sys.sendAll(Config.Tours.tourbot+sys.name(src)+" substituted "+toCorrectCase(newname)+" in place of "+toCorrectCase(oldname)+" in the "+tours.tour[key].tourtype+" tournament.", tourschan)
				return true;
			}
			if (command == "config") {
				sys.sendMessage(src,"*** CURRENT CONFIGURATION ***",tourschan)
				sys.sendMessage(src,"Maximum Queue Length: "+Config.Tours.maxqueue,tourschan)
				sys.sendMessage(src,"Maximum Number of Simultaneous Tours: "+Config.Tours.maxrunning,tourschan)
				sys.sendMessage(src,"Tour Sign Ups Length: "+time_handle(Config.Tours.toursignup),tourschan)
				sys.sendMessage(src,"Tour Auto DQ length: "+time_handle(Config.Tours.tourdq),tourschan)
				sys.sendMessage(src,"Tour Activity Check: "+time_handle(Config.Tours.activity),tourschan)
				sys.sendMessage(src,"Substitute Time: "+time_handle(Config.Tours.subtime),tourschan)
				sys.sendMessage(src,"Tour Break Time: "+time_handle(Config.Tours.tourbreak),tourschan)
				sys.sendMessage(src,"Absolute Tour Break Time: "+time_handle(Config.Tours.abstourbreak),tourschan)
				sys.sendMessage(src,"Tour Reminder Time: "+time_handle(Config.Tours.reminder),tourschan)
				sys.sendMessage(src,"Bot Name: "+Config.Tours.tourbot,tourschan)
				sys.sendMessage(src,"Channel: "+Config.Tours.channel,tourschan)
				sys.sendMessage(src,"Error Channel: "+Config.Tours.errchannel,tourschan)
				sys.sendMessage(src,"Debug: "+Config.Tours.debug,tourschan)
				return true;
			}
		}
		// Normal User Commands
		if (command == "join") {
			if (!sys.dbRegistered(sys.name(src))) {
				sys.sendMessage(src, Config.Tours.tourbot+"You need to register to play in #Tours! Click on the 'Register' button below and follow the instructions!", tourschan);
				return true;
			}
			var key = null
			for (var x in tours.tour) {
				if (tours.tour[x].state == "subround" || tours.tour[x].state == "signups") {
					key = x;
					break;
				}
			}
			if (key === null) {
				sys.sendMessage(src,Config.Tours.tourbot+"No tournament has signups available at the moment!",tourschan)
				return true;
			}
			if (sys.tier(src) != tours.tour[key].tourtype) {
				sys.sendMessage(src,Config.Tours.tourbot+"You need to be in the "+tours.tour[key].tourtype+" tier to join!",tourschan)
				return true;
			}
			if (sys.gen(src) != parseInt(tours.tour[key].parameters.gen) && tours.tour[key].parameters.gen != "default") {
				sys.sendMessage(src,Config.Tours.tourbot+"You need to be in Gen "+tours.tour[key].parameters.gen+" to join.",tourschan)
				return true;
			}
			/* Is already in another tour */
			for (var x in tours.tour) {
				if (tours.tour[x].players.indexOf(sys.name(src).toLowerCase()) != -1) {
					if (tours.tour[x].state == "subround" || tours.tour[x].state == "signups") {
						sys.sendMessage(src,Config.Tours.tourbot+"You can't join twice!",tourschan)
					}
					else {
						sys.sendMessage(src,Config.Tours.tourbot+"You can't join two tournaments at once with the same name!",tourschan)
					}
					return true;
				}
			}
			/* Multiple account check */
			for (var a=0; a<tours.tour[key].players.length; a++) {
				var joinedip = sys.dbIp(tours.tour[key].players[a])
				if (sys.ip(src) == joinedip && ((sys.maxAuth(sys.ip(src)) < 2 && Config.Tours.debug === true) || (sys.auth(src) < 3 && Config.Tours.debug === false))) {
					sys.sendMessage(src,Config.Tours.tourbot+"You already joined the tournament under the name '"+tours.tour[key].players[a]+"'!",tourschan)
					return true;
				}
			}
			if (tours.tour[key].state == "signups") {
				tours.tour[key].players.push(sys.name(src).toLowerCase())
				tours.tour[key].cpt += 1
				if (tours.tour[key].maxcpt !== undefined) {
					if (tours.tour[key].cpt > tours.tour[key].maxcpt) {
						tours.tour[key].maxcpt = tours.tour[key].cpt
						if (tours.tour[key].maxcpt == 5) {
							tours.tour[key].time += 30
						}
						else if (tours.tour[key].maxcpt == 9) {
							tours.tour[key].time += 60
						}
						else if (tours.tour[key].maxcpt == 17) {
							tours.tour[key].time += 90
						}
						else if (tours.tour[key].maxcpt == 33) {
							tours.tour[key].time += 120
						}
						else if (tours.tour[key].maxcpt == 65) {
							tours.tour[key].time += 180
						}
						else if (tours.tour[key].maxcpt == 129) {
							tours.tour[key].time += 240
						}
					}
				}
				// 128 players for technical reasons
				if (tours.tour[key].players.length >= 128) {
					tours.tour[key].time = parseInt(sys.time())
				}
                sys.sendHtmlAll("<font color='"+Config.Tours.tourbotcolour+"'><timestamp/> <b>"+html_escape(Config.Tours.tourbot)+"</b></font><b>"+html_escape(sys.name(src))+"</b> is player #"+tours.tour[key].players.length+" to join the "+html_escape(tours.tour[key].tourtype)+" tournament! "+(tours.tour[key].time - parseInt(sys.time()))+" seconds remaining!", tourschan)
				return true;
			}
			/* subbing */
			var oldname = null
			for (var n=1;n<=tours.tour[key].players.length;n++) {
				for (var k=0;k<tours.tour[key].players.length;k++) {
					if (tours.tour[key].players[k] == "~Sub "+n+"~") {
						oldname = "~Sub "+n+"~"
						sendDebugMessage("Located Sub! Name: "+oldname, tourschan)
						break;
					}
				}
				if (oldname !== null) break;
			}
			
			for (var s=0;s<tours.tour[key].seeds.length;s++) {
				if (tours.tour[key].seeds[s] == sys.name(src).toLowerCase()) {
					sys.sendMessage(src,Config.Tours.tourbot+"You can't sub in to the "+tours.tour[key].tourtype+" tournament!",tourschan)
					return true;
				}
			}
			
			if (oldname === null) {
				sys.sendMessage(src,Config.Tours.tourbot+"There are no subs remaining in the "+tours.tour[key].tourtype+" tournament!",tourschan)
				return true;
			}
			var index = tours.tour[key].players.indexOf(oldname)
			var newname = sys.name(src).toLowerCase()
			tours.tour[key].players.splice(index,1,newname)
			tours.tour[key].cpt += 1
			sys.sendAll(Config.Tours.tourbot+"Late entrant "+sys.name(src)+" will play against "+(index%2 == 0 ? tours.tour[key].players[index+1] : tours.tour[key].players[index-1])+" in the "+tours.tour[key].tourtype+" tournament. "+(tours.tour[key].players.length - tours.tour[key].cpt)+" sub"+(tours.tour[key].players.length - tours.tour[key].cpt == 1 ? "" : "s") + " remaining.", tourschan)
			return true;
		}
		if (command == "unjoin") {
			var key = null
			for (var x in tours.tour) {
				if (tours.tour[x].state == "signups") {
					key = x;
					break;
				}
			}
			if (key === null) {
				sys.sendMessage(src,Config.Tours.tourbot+"You can't unjoin now!",tourschan)
				return true;
			}
			var index = tours.tour[key].players.indexOf(sys.name(src).toLowerCase())
			if (index == -1) {
				sys.sendMessage(src,Config.Tours.tourbot+"You aren't in the "+tours.tour[key].tourtype+" tournament!",tourschan)
				return true;
			}
			tours.tour[key].players.splice(index, 1)
			tours.tour[key].cpt -= 1
			sys.sendAll(Config.Tours.tourbot+sys.name(src)+" unjoined the "+tours.tour[key].tourtype+" tournament!", tourschan)
			return true;
		}
		if (command == "queue") {
			var queue = tours.queue
			sys.sendMessage(src, "*** Upcoming Tours ***", tourschan)
			var nextstart = time_handle(tours.globaltime - parseInt(sys.time()))
			for (var x in tours.tour) {
				if (tours.tour[x].state == "signups") {
					nextstart = "Pending"
					break;
				}
			}
			var firsttour = true;
			for (var e in queue) {
				var queuedata = queue[e].split(":::",4)
				if (firsttour && nextstart != "Pending") {
					sys.sendMessage(src,queuedata[0]+": Set by "+queuedata[1]+"; Parameters: "+queuedata[2]+" Mode"+(queuedata[3] != "default" ? "; Gen: "+queuedata[3] : "")+"; Starts in "+time_handle(tours.globaltime-parseInt(sys.time())),tourschan)
					firsttour = false
				}
				else {
					sys.sendMessage(src,queuedata[0]+": Set by "+queuedata[1]+"; Parameters: "+queuedata[2]+" Mode"+(queuedata[3] != "default" ? "; Gen: "+queuedata[3] : ""), tourschan)
				}
			}
			return true;
		}
		if (command == "viewround") {
			if (tours.keys.length === 0) {
				sys.sendMessage(src,Config.Tours.tourbot+"No tournament is running at the moment!",tourschan)
				return true;
			}
			var postedrounds = false;
			for (var y in tours.tour) {
				var battlers = tours.tour[y].battlers
				var winners = tours.tour[y].winners
				if (tours.tour[y].round === 0) continue;
				postedrounds = true;
				sys.sendMessage(src,border, tourschan)
				sys.sendMessage(src,"*** Round "+tours.tour[y].round+" of the "+tours.tour[y].tourtype+" Tournament ***", tourschan)
				for (var x=0; x<tours.tour[y].playerlist.length; x+=2) {
					if (winners.indexOf(tours.tour[y].playerlist[x]) != -1 && tours.tour[y].playerlist[x] != "~Bye~") {
						sys.sendHtmlMessage(src,"<timestamp/> <font color=green><b>"+html_escape(toCorrectCase(tours.tour[y].playerlist[x])) +"</b></font> won against "+ html_escape(toCorrectCase(tours.tour[y].playerlist[x+1])), tourschan)
					}
					else if (winners.indexOf(tours.tour[y].playerlist[x+1]) != -1 && tours.tour[y].playerlist[x+1] != "~Bye~") {
						sys.sendHtmlMessage(src,"<timestamp/> <font color=green><b>"+html_escape(toCorrectCase(tours.tour[y].playerlist[x+1])) +"</b></font> won against "+ html_escape(toCorrectCase(tours.tour[y].playerlist[x])), tourschan)
					}
					else if (battlers.indexOf(tours.tour[y].playerlist[x]) != -1) {
						sys.sendHtmlMessage(src,"<timestamp/> <font color=green>"+html_escape(toCorrectCase(tours.tour[y].playerlist[x])) +" VS "+ html_escape(toCorrectCase(tours.tour[y].playerlist[x+1]))+"</font>", tourschan)
					}
					else {
						sys.sendHtmlMessage(src,"<timestamp/> "+html_escape(toCorrectCase(tours.tour[y].playerlist[x])) +" VS "+ html_escape(toCorrectCase(tours.tour[y].playerlist[x+1])), tourschan)
					}
				}
			}
			if (!postedrounds) {
				sys.sendMessage(src,Config.Tours.tourbot+"No tournament is running at the moment!",tourschan)
				return true;
			}
			else {
				sys.sendMessage(src,border, tourschan)
			}
			return true;
		}
		if (command == "touradmins") {
			sys.sendMessage(src, "",tourschan)
			sys.sendMessage(src, "*** TOURNAMENT ADMINS ***",tourschan)
			var tal = tours.touradmins
			var authlist = sys.dbAuths()
			for (var l in tal) {
				if (sys.id(tal[l]) !== undefined) {
					sys.sendMessage(src, toCorrectCase(tal[l]) + " (Online):",tourschan)
				}
				else {
					sys.sendMessage(src, tal[l],tourschan)
				}
			}
			// displays onine auth in "Tours" channel as well
			for (var m in authlist) {
				if (sys.id(authlist[m]) !== undefined && tal.indexOf(authlist[m]) == -1 && sys.isInChannel(sys.id(authlist[m]), tourschan)) {
					sys.sendMessage(src, toCorrectCase(authlist[m]) + " (Online):",tourschan)
				}
			}
			sys.sendMessage(src, "",tourschan)
			return true;
		}
		if (command == "activeta") {
			sys.sendMessage(src, "",tourschan)
			sys.sendMessage(src, "*** ACTIVE TOURNAMENT ADMINS ***",tourschan)
			var tal = tours.touradmins
			var authlist = sys.dbAuths()
			for (var l in tal) {
				if (sys.id(tal[l]) !== undefined && SESSION.users(sys.id(tal[l])).lastline.time + Config.Tours.activity > parseInt(sys.time())) {
					sys.sendMessage(src, toCorrectCase(tal[l]), tourschan)
				}
			}
			// displays online active auth in "Tours" channel as well
			for (var m in authlist) {
				if (sys.id(authlist[m]) !== undefined && tal.indexOf(authlist[m]) == -1 && sys.isInChannel(sys.id(authlist[m]), tourschan)  && SESSION.users(sys.id(authlist[m])).lastline.time + Config.Tours.activity > parseInt(sys.time())) {
					sys.sendMessage(src, toCorrectCase(authlist[m]), tourschan)
				}
			}
			sys.sendMessage(src, "",tourschan)
			return true;
		}
		if (command == "history") {
			sys.sendMessage(src, "*** RECENTLY PLAYED TIERS ***",tourschan)
			for (var x in tours.history) {
				sys.sendMessage(src, tours.history[x],tourschan)
			}
			return true;
		}
		if (command == "help" || command == "commands") {
			sys.sendMessage(src, border,tourschan);
			sys.sendMessage(src, "*** Tournament Commands ***",tourschan);
			for (var t in tourcommands) {
				sys.sendMessage(src, tourcommands[t],tourschan);
			}
			if (isTourAdmin(src)) {
				sys.sendMessage(src, border,tourschan);
				for (var u in touradmincommands) {
					if (touradmincommands[u] == "*** FOLLOWING COMMANDS ARE ADMIN+ COMMANDS ***" && !isTourSuperAdmin(src)) break;
					sys.sendMessage(src, touradmincommands[u],tourschan);
				}
			}
			sys.sendMessage(src, border,tourschan);
			return true;
		}
		if (command == "leaderboard") {
			try {
				if (commandData == "") {
					var rankings = sys.getFileContent("tourscores.txt").split("\n")
				}
				else {
					var tiers = sys.getTierList()
					var found = false;
					for (var x in tiers) {
						if (tiers[x].toLowerCase() == commandData.toLowerCase()) {
							var tourtier = tiers[x];
							found = true;
							break;
						}
					}
					if (!found) {
						throw ("Not a valid tier")
					}
					var rankings = sys.getFileContent("tourscores_"+tourtier.replace(/ /g,"_")+".txt").split("\n")
				}
				var list = [];
				for (var p in rankings) {
					if (rankings[p] == "") continue;
					var rankingdata = rankings[p].split(":::",2)
					if (rankingdata[1] < 1) continue;
					list.push([rankingdata[1], rankingdata[0]]);
				}
				list.sort(function(a,b) { return b[0] - a[0] ; });
				sys.sendMessage(src, "*** TOURNAMENT RANKINGS "+(commandData != "" ? "("+commandData+") " : "")+"***",tourschan)
				for (var x=0; x<20; x++) {
					if (x >= list.length) break;
					sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
				}
			}
			catch (err) {
				if (err == "Not a valid tier") {
					sys.sendMessage(src, Config.Tours.tourbot+commandData+" is not a valid tier!",tourschan)
				}
				else {
					sys.sendMessage(src, Config.Tours.tourbot+"No data exists yet!",tourschan)
				}
			}
			return true;
		}
	}
	catch (err) {
		sys.sendAll("Error in Tournament Command '"+command+"': "+err, tourserrchan)
	}
	return false;
}

// Auto DQs inactive players
function removeinactive(key) {
	try {
		sendDebugMessage("Removing Inactive Players", tourschan)
		var activelist = tours.tour[key].active;
		var playercycle = tours.tour[key].players.length
		var currentround = tours.tour[key].round
		for (var z=0;z<playercycle;z+=2) {
			var player1 = tours.tour[key].players[z]
			var player2 = tours.tour[key].players[z+1]
			var dq1 = true;
			var dq2 = true;
			if (tours.tour[key].winners.indexOf(player1) != -1) {
				sendDebugMessage(player1+" won against "+player2+"; continuing", tourschan)
				continue;
			}
			if (tours.tour[key].winners.indexOf(player2) != -1) {
				sendDebugMessage(player2+" won against "+player1+"; continuing", tourschan)
				continue;
			}
			if (tours.tour[key].battlers.indexOf(player1) != -1 || tours.tour[key].battlers.indexOf(player2) != -1) {
				sendDebugMessage(player1+" is battling against "+player2+"; continuing", tourschan)
				continue;
			}
			if (player1 == "~DQ~" || player2 == "~DQ~" || player1 == "~Bye~" || player2 == "~Bye~") {
				sendDebugMessage("We don't need to check", tourschan)
				continue;
			}
			if (sys.id(player1) !== undefined) {
				if (SESSION.users(sys.id(player1)).lastline.time + Config.Tours.activity > parseInt(sys.time()) || activelist.indexOf(player1) != -1) {
					sendDebugMessage(player1+" is active; continuing", tourschan)
					dq1 = false
				}
				else {
					sendDebugMessage(player1+" is not active; disqualifying", tourschan)
				}
			}
			if (sys.id(player2) !== undefined) {
				if (SESSION.users(sys.id(player2)).lastline.time + Config.Tours.activity > parseInt(sys.time()) || activelist.indexOf(player2) != -1) {
					sendDebugMessage(player2+" is active; continuing", tourschan)
					dq2 = false;
				}
				else {
					sendDebugMessage(player2+" is not active; disqualifying", tourschan)
				}
			}
			if (dq1 && dq2) {
				sys.sendAll(Config.Tours.tourbot+toCorrectCase(player1)+" and "+toCorrectCase(player2)+" are both disqualified for inactivity in the "+tours.tour[key].tourtype+" tournament!", tourschan)
				dqboth(player1, player2, key)
			}
			else if (dq2) {
				sys.sendAll(Config.Tours.tourbot+toCorrectCase(player2)+" was disqualified from the "+tours.tour[key].tourtype+" tournament for inactivity!", tourschan)
				disqualify(player2,key,false)
			}
			else if (dq1) {
				sys.sendAll(Config.Tours.tourbot+toCorrectCase(player1)+" was disqualified from the "+tours.tour[key].tourtype+" tournament for inactivity!", tourschan)
				disqualify(player1,key,false)
			}
			else if ((tours.tour[key].time-parseInt(sys.time()))%60 === 0){
				sys.sendAll(Config.Tours.tourbot+toCorrectCase(player1)+" and "+toCorrectCase(player2)+" are both active, please battle in the "+tours.tour[key].tourtype+" tournament ASAP!", tourschan)
			}
			// if the round advances due to DQ, don't keep checking :x
			if (tours.tour[key].round !== currentround) {
				break;
			}
		}
	}
	catch (err) {
		sys.sendAll("Error in process 'removeinactive': "+err, tourserrchan)
	}
}

// Sends battle reminders
function sendReminder(key) {
	try {
		for (var z=0;z<tours.tour[key].players.length;z++) {
			var player = tours.tour[key].players[z]
			var opponent = z%2 == 0 ? tours.tour[key].players[z+1] : tours.tour[key].players[z-1]
			if (tours.tour[key].winners.indexOf(player) != -1) {
				continue;
			}
			if (tours.tour[key].winners.indexOf(opponent) != -1) {
				continue;
			}
			if (tours.tour[key].battlers.indexOf(player) != -1) {
				continue;
			}
			if ((isSub(player) || isSub(opponent)) && sys.id(player) !== undefined) {
				sys.sendMessage(sys.id(player), Config.Tours.tourbot+"Your sub will be disqualified in "+time_handle(tours.tour[key].time-parseInt(sys.time())), tourschan)
			}
			else if (sys.id(player) !== undefined) {
				if (sys.isInChannel(sys.id(player), tourschan)) {
					sys.sendHtmlMessage(sys.id(player), "<ping/><font color=red><timestamp/> "+Config.Tours.tourbot+html_escape(toCorrectCase(player))+", you must battle <b>"+(z%2 === 0 ? html_escape(toCorrectCase(tours.tour[key].players[z+1])) : html_escape(toCorrectCase(tours.tour[key].players[z-1])))+"</b> in the <b>"+html_escape(tours.tour[key].tourtype)+"</b> tournament, otherwise you may be disqualified for inactivity! You should talk to your opponent in #Tours to avoid disqualification.</font>", tourschan)
				}
				else {
					sys.sendHtmlMessage(sys.id(player), "<ping/><font color=red><timestamp/> "+Config.Tours.tourbot+html_escape(toCorrectCase(player))+", you must battle <b>"+(z%2 === 0 ? html_escape(toCorrectCase(tours.tour[key].players[z+1])) : html_escape(toCorrectCase(tours.tour[key].players[z-1])))+"</b> in the <b>"+html_escape(tours.tour[key].tourtype)+"</b> tournament, otherwise you may be disqualified for inactivity! You should talk to your opponent in #Tours to avoid disqualification.</font>")
					sys.sendMessage(sys.id(player), Config.Tours.tourbot+"Please rejoin the #Tours channel to ensure you do not miss out on information you need!", tourschan)
				}
			}
		}
	}
	catch (err) {
		sys.sendAll("Error in process 'sendReminder': "+err, tourserrchan)
	}
}

// Disqualifies a single player
function disqualify(player, key, silent) {
	try {
		if (tours.tour[key].players.indexOf(player) == -1) {
			return;
		}
		var index = tours.tour[key].players.indexOf(player)
		var winnerindex = tours.tour[key].winners.indexOf(player)
		if (index%2 == 1) {
			var opponent = tours.tour[key].players[index-1]
		}
		else {
			var opponent = tours.tour[key].players[index+1]
		}
		/* If the opponent is disqualified/is a sub we want to replace with ~Bye~ instead of ~DQ~ so brackets don't stuff up */
		if (opponent == "~DQ~") {
			tours.tour[key].players.splice(index,1,"~Bye~")
		}
		else {
			tours.tour[key].players.splice(index,1,"~DQ~")
		}
		/* We then check if opponent hasn't advanced, and advance them if they're not disqualified. We also remove player from winners if DQ'ed */
		if (opponent != "~DQ~" && winnerindex == -1) {
			if (!isSub(opponent) && opponent != "~Bye~") {
				tours.tour[key].winners.push(opponent)
				if (!silent) {
					sys.sendAll(Config.Tours.tourbot+toCorrectCase(opponent)+" advances to the next round of the "+tours.tour[key].tourtype+" by default!", tourschan)
				}
			}
			else {
				tours.tour[key].winners.push("~Bye~")
			}
		}
		else if (winnerindex != -1 && opponent != "~Bye~" && opponent != "~DQ~") { /* This is just so the winners list stays the same length */
			tours.tour[key].winners.splice(winnerindex,1,opponent)
			if (!silent) {
				sys.sendAll(Config.Tours.tourbot+toCorrectCase(opponent)+" advances to the next round of the "+tours.tour[key].tourtype+" because "+toCorrectCase(player)+" was disqualified!", tourschan)
			}
		}
		var battlesleft = parseInt(tours.tour[key].players.length/2)-tours.tour[key].winners.length
		if (battlesleft <= 0) {
			if (tours.tour[key].state == "subround") removesubs(key);
			advanceround(key)
		}
	}
	catch (err) {
		sys.sendAll("Error in process 'disqualify': "+err, tourserrchan)
	}
}

// for when both players are inactive
function dqboth(player1, player2, key) {
	try {
		var index1 = tours.tour[key].players.indexOf(player1)
		tours.tour[key].players.splice(index1,1,"~DQ~")
		var index2 = tours.tour[key].players.indexOf(player2)
		tours.tour[key].players.splice(index2,1,"~DQ~")
		tours.tour[key].winners.push("~Bye~")
		var battlesleft = parseInt(tours.tour[key].players.length/2)-tours.tour[key].winners.length
		if (battlesleft <= 0) {
			if (tours.tour[key].state == "subround") removesubs(key);
			advanceround(key)
		}
	}
	catch (err) {
		sys.sendAll("Error in process 'dqboth': "+err, tourserrchan)
	}
}

// removes subs
function removesubs(key) {
	try {
		var advanced = [];
		var opponent = null;
		for (var x in tours.tour[key].players) {
			if (isSub(tours.tour[key].players[x])) {
				opponent = null;
				disqualify(tours.tour[key].players[x],key,true)
				if (x%2 === 0) {
					opponent = tours.tour[key].players[x+1]
				}
				else {
					opponent = tours.tour[key].players[x-1]
				}
				if (!isSub(opponent) && opponent != "~DQ~" && opponent != "~Bye~" && opponent !== null) {
					advanced.push(opponent)
				}
				if (tours.tour[key].round !== 1) {
					break;
				}
			}
		}
		tours.tour[key].state = "round"
		if (advanced.length > 0) {
			sys.sendAll(Config.Tours.tourbot+advanced.join(", ")+(advanced.length == 1 ? " advances" : " advance")+" to the next round! Subs are now gone.", tourschan)
		}
	}
	catch (err) {
		sys.sendAll("Error in process 'removesubs' for player "+tours.tour[key].players[x]+": "+err, tourserrchan)
	}
}

// removes byes
function removebyes(key) {
	try {
		var advanced = [];
		var playercycle = tours.tour[key].players.length
		var currentround = tours.tour[key].round
		var opponent = null;
		for (var z=0;z<playercycle;z+=2) {
			opponent = null;
			if (tours.tour[key].players[z] == "~Bye~" && tours.tour[key].players[z+1] == "~Bye~") {
				dqboth("~Bye~","~Bye~",key)
			}
			else if (tours.tour[key].players[z] == "~Bye~") {
				opponent = tours.tour[key].players[z+1]
				disqualify("~Bye~",key,true)
			}
			else if (tours.tour[key].players[z+1] == "~Bye~") {
				opponent = tours.tour[key].players[z]
				disqualify("~Bye~",key,true)
			}
			if (!isSub(opponent) && opponent != "~DQ~" && opponent != "~Bye~" && opponent !== null) {
				advanced.push(opponent)
			}
			// if the round advances due to DQ, don't keep checking :x
			if (tours.tour[key].round !== currentround) {
				break;
			}
		}
		if (advanced.length > 0) {
			sys.sendAll(Config.Tours.tourbot+advanced.join(", ")+(advanced.length == 1 ? " advances" : " advance")+" to the next round due to a bye!", tourschan)
		}
	}
	catch (err) {
		sys.sendAll("Error in process 'removebyes': "+err, tourserrchan)
	}
}
	
function battleend(winner, loser, key) {
	try {
		var winname = sys.name(winner).toLowerCase()
		var losename = sys.name(loser).toLowerCase()
		/* We need to check if winner/loser is in the Winners List */
		if (tours.tour[key].winners.indexOf(winname) != -1 || tours.tour[key].winners.indexOf(losename) != -1) {
			return;
		}
		tours.tour[key].winners.push(winname)
		tours.tour[key].players.splice(tours.tour[key].players.indexOf(losename),1,"~DQ~")
		var battlesleft = parseInt(tours.tour[key].players.length/2)-tours.tour[key].winners.length
		if (tourwinmessages === undefined || tourwinmessages.length == 0) {
			sendHtmlAuthPlayers("<font color='"+Config.Tours.tourbotcolour+"'><timestamp/> <b>"+html_escape(Config.Tours.tourbot)+"</b></font><font color=green>"+html_escape(sys.name(winner))+"</font> won their match against <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+tours.tour[key].tourtype+" tournament and advances to the next round! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key)
		}
		else {
			sendHtmlAuthPlayers("<font color='"+Config.Tours.tourbotcolour+"'><timestamp/> <b>"+html_escape(Config.Tours.tourbot)+"</b></font><font color=green>"+html_escape(sys.name(winner))+"</font> "+html_escape(tourwinmessages[sys.rand(0, tourwinmessages.length)])+" <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+tours.tour[key].tourtype+" tournament and advances to the next round! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key)
		}
		if (battlesleft <= 0) {
			advanceround(key)
		}
	}
	catch (err) {
		sys.sendAll("Error in evaluating end of battle results: "+err, tourserrchan)
	}
}

// advances the round
function advanceround(key) {
	try {
		var newlist = []
		var winners = tours.tour[key].winners
		var bannednames = ["~Bye~", "~DQ~"]
		for (var x=0;x<tours.tour[key].players.length;x+=2) {
			if (winners.indexOf(tours.tour[key].players[x]) > -1 && bannednames.indexOf(tours.tour[key].players[x]) == -1) {
				newlist.push(tours.tour[key].players[x])
			}
			else if (winners.indexOf(tours.tour[key].players[x+1]) > -1 && bannednames.indexOf(tours.tour[key].players[x+1]) == -1) {
				newlist.push(tours.tour[key].players[x+1])
			}
			else {
				newlist.push("~Bye~")
			}
		}
		for (var y in newlist) {
			if (isSub(newlist[y])) {
				newlist.splice(y,1,"~Bye~");
			}
		}
		tours.tour[key].winners = []
		tours.tour[key].battlers = []
		tours.tour[key].active = []
		tours.tour[key].players = newlist
		tourprintbracket(key)
	}
	catch (err) {
		sys.sendAll("Error in advancing round of tour '"+tours.tour[key].tourtype+"' id "+key+": "+err, tourserrchan)
	}
}

// starts a tournament
function tourstart(tier, starter, key, parameters) {
	try {
		var channels = [0, tourschan]
		tours.tour[key] = {}
		tours.tour[key].state = "signups"
		tours.tour[key].time = parseInt(sys.time())+Config.Tours.toursignup
		tours.tour[key].tourtype = tier
		tours.tour[key].players = []; // list for the actual tour data
		tours.tour[key].playerlist = []; // the list used for viewround etc.
		tours.tour[key].battlers = [];
		tours.tour[key].winners = [];
		tours.tour[key].round = 0;
		tours.tour[key].cpt = 0;
		tours.tour[key].seeds = [];
		tours.tour[key].maxcpt = 0;
		tours.tour[key].active = [];
		tours.tour[key].parameters = parameters
		for (var x in channels) {
			sys.sendAll("", channels[x])
			sys.sendAll(border, channels[x])
			sys.sendHtmlAll("<timestamp/> A <b><a href='http://wiki.pokemon-online.eu/view/"+tier.replace(/ /g,"_")+"'>"+tier+"</a></b> tournament has opened for signups! (Started by <b>"+html_escape(starter)+"</b>)", channels[x])
			sys.sendAll("CLAUSES: "+getTourClauses(tier),channels[x])
			sys.sendAll("PARAMETERS: "+parameters.mode+" Mode"+(parameters.gen != "default" ? "; Gen "+parameters.gen : ""), channels[x])
			if (channels[x] == tourschan) {
				sys.sendHtmlAll("<timestamp/> Type <b>/join</b> to enter the tournament, you have "+time_handle(Config.Tours.toursignup)+" to join!", channels[x])
			}
			else {
				sys.sendAll(Config.Tours.tourbot+"Go to the #"+sys.channel(tourschan)+" channel and type /join to enter the tournament, you have "+time_handle(Config.Tours.toursignup)+" to join!", channels[x])
			}
			sys.sendAll(border, channels[x])
			sys.sendAll("", channels[x])
		}
		tours.keys.push(key)
		if (tours.key >= Config.Tours.maxarray) {
			tours.key = 0
		}
		else {
			tours.key += 1
		}
	}
	catch (err) {
		sys.sendAll("Error in stating a tournament: "+err, tourserrchan)
	}
}

/* Starts the first round */
function tourinitiate(key) {
	try {
		var size = tourmakebracket(key)
		if (size < 3) {
			sys.sendAll(Config.Tours.tourbot+"The "+tours.tour[key].tourtype+" tournament was cancelled by the server! You need at least 3 players! (A new tournament will start in "+time_handle(Config.Tours.tourbreak)+").", tourschan)
			delete tours.tour[key];
			tours.keys.splice(tours.keys.indexOf(key), 1)
			tours.globaltime = parseInt(sys.time())+Config.Tours.tourbreak; // for next tournament
			return;
		}
		toursortbracket(size, key)
		tourprintbracket(key)
	}
	catch (err) {
		sys.sendAll("Error in initiating a tournament, id "+key+": "+err, tourserrchan)
	}
}

// constructs the bracket
function tourmakebracket(key) {
	try {
		var bracketsize = 1
		if (tours.tour[key].players.length <= 2) {
			bracketsize = 2
		}
		else if (tours.tour[key].players.length <= 4) {
			bracketsize = 4
		}
		else if (tours.tour[key].players.length <= 8) {
			bracketsize = 8
		}
		else if (tours.tour[key].players.length <= 16) {
			bracketsize = 16
		}
		else if (tours.tour[key].players.length <= 32) {
			bracketsize = 32
		}
		else if (tours.tour[key].players.length <= 64) {
			bracketsize = 64
		}
		else /*if (tours.tour[key].players.length <= 128)*/ {
			bracketsize = 128
		}
		// For technical reasons we can only run 128 players at a time
		/*else {
			bracketsize = 256
		}*/
		var subnumber = 1
		for (var p = tours.tour[key].players.length; p<bracketsize; p++) {
			tours.tour[key].players.push("~Sub "+subnumber+"~")
			subnumber += 1
		}
		return bracketsize;
	}
	catch (err) {
		sys.sendAll("Error in making a bracket, id "+key+": "+err, tourserrchan)
	}
}

// tour pushing functions used for constructing the bracket
function push2(x, size) {
	playerlist.push(ladderlist[x])
	playerlist.push(ladderlist[size-x-1])
}

function push4(x, size) {
	push2(x, size)
	push2(size/2-x-1, size)
}

function push8(x, size) {
	push4(x, size)
	push4(size/4-x-1, size)
}

function push16(x, size) {
	push8(x, size)
	push8(size/8-x-1, size)
}

function push32(x, size) {
	push16(x, size)
	push16(size/16-x-1, size)
}

function push64(x, size) {
	push32(x, size)
	push32(size/32-x-1, size)
}

function push128(x, size) {
	push64(x, size)
	push64(size/64-x-1, size)
}

function push256(x, size) {
	push256(x, size)
	push256(size/128-x-1, size)
}

// Sorting the tour bracket
function toursortbracket(size, key) {
	try {
		ladderlist = []
		// This algorithm will sort players by ranking. 1st is tier points, 2nd is overall tour points, 3rd is ladder rankings.
		ladderlist.push(tours.tour[key].players[0]) 
		for (var t=1; t<size; t++) {
			var added = false;
			var ishigher = false;
			var playerranking1 = getExtraTierPoints(tours.tour[key].players[t], tours.tour[key].tourtype)
			var playerranking2 = getExtraPoints(tours.tour[key].players[t])
			var playerranking3 = sys.ranking(tours.tour[key].players[t], tours.tour[key].tourtype) !== undefined ? sys.ranking(tours.tour[key].players[t], tours.tour[key].tourtype) : sys.totalPlayersByTier(tours.tour[key].tourtype)+1
			if (isSub(tours.tour[key].players[t])) {
				ladderlist.push(tours.tour[key].players[t])
				continue;
			}
			for (var n=0; n<ladderlist.length;n++) {
				var otherranking1 = getExtraTierPoints(ladderlist[n], tours.tour[key].tourtype)
				var otherranking2 = getExtraPoints(ladderlist[n])
				var otherranking3 = sys.totalPlayersByTier(tours.tour[key].tourtype)+2
				if (isSub(ladderlist[n])) {
					otherranking1 = -1
				}
				else if (sys.ranking(ladderlist[n], tours.tour[key].tourtype) === undefined) {
					otherranking3 = sys.totalPlayersByTier(tours.tour[key].tourtype) + 1
				}
				else {
					otherranking3 = sys.ranking(ladderlist[n], tours.tour[key].tourtype)
				}
				if (playerranking1 > otherranking1) {
					ishigher = true;
				}
				else if (playerranking1 === otherranking1 && playerranking2 > otherranking2) {
					ishigher = true;
				}
				else if (playerranking1 === otherranking1 && playerranking2 === otherranking2 && ((playerranking3 < otherranking3) || (playerranking3 === otherranking3 && sys.rand(0,2) == 1))) {
					ishigher = true;
				}
				if (ishigher) {
					ladderlist.splice(n,0,tours.tour[key].players[t])
					added = true;
					break;
				}
			}
			if (!added) {
				ladderlist.push(tours.tour[key].players[t])
			}
		}
		playerlist = []
		/* Seed Storage */
		tours.tour[key].seeds = ladderlist
		if (size == 4) {
			push4(0, size);
		}
		else if (size == 8) {
			push8(0, size);
		}
		else if (size == 16) {
			push16(0, size);
		}
		else if (size == 32) {
			push32(0, size);
		}
		else if (size == 64) {
			push64(0, size);
		}
		else if (size == 128) {
			push128(0, size);
		}
		// technical reasons, 128 player limit
		/*else if (size == 256) {
			push256(0, size);
		}*/
		tours.tour[key].players = playerlist
		delete ladderlist;
		delete playerlist;
	}
	catch (err) {
		sys.sendAll("Error in sorting the bracket, id "+key+": "+err, tourserrchan)
	}
}

// this actually prints the bracket
function tourprintbracket(key) {
	try {
		tours.tour[key].round += 1
		tours.tour[key].playerlist = tours.tour[key].players;
		if (tours.tour[key].players.length == 1) { // winner
			var channels = [tourschan]
			var winner = toCorrectCase(tours.tour[key].players[0])
			if (winner !== "~Bye~") {
				for (var x in channels) {
					sys.sendAll("", channels[x])
					sys.sendAll(border, channels[x])
					sys.sendHtmlAll("<timestamp/> The winner of the "+tours.tour[key].tourtype+" tournament is: <b>"+html_escape(winner)+"</b>!", channels[x])
					sys.sendAll("", channels[x])
					sys.sendAll(Config.Tours.tourbot+"Please congratulate "+winner+" on their success!", channels[x])
					sys.sendAll(border, channels[x])
					sys.sendAll("", channels[x])
				}
				awardTourPoints(winner.toLowerCase(), tours.tour[key].cpt, tours.tour[key].tourtype)
			}
			else sys.sendAll(Config.Tours.tourbot+"The "+tours.tour[key].tourtype+" ended by default!", tourschan)
			tours.history.unshift(tours.tour[key].tourtype+": Won by "+winner+" with "+tours.tour[key].cpt+" players")
			if (tours.history.length > 25) {
				tours.history.pop()
			}
			delete tours.tour[key];
			tours.keys.splice(tours.keys.indexOf(key), 1);
			if (tours.keys.length === 0) {
				tours.globaltime = parseInt(sys.time())+Config.Tours.tourbreak; // for next tournament
			}
			return;
		}
		else if (tours.tour[key].players.length == 2) { // finals
			/* Here in case it's ~Bye~ vs ~Bye~ */
			if (tours.tour[key].players[0] == "~Bye~" && tours.tour[key].players[1] == "~Bye~") {
				sys.sendAll(Config.Tours.tourbot+"The "+tours.tour[key].tourtype+" ended by default!", tourschan)
				delete tours.tour[key];
				tours.keys.splice(tours.keys.indexOf(key), 1);
				if (tours.keys.length === 0) {
					tours.globaltime = parseInt(sys.time())+Config.Tours.tourbreak; // for next tournament
				}
				return;
			}
			tours.tour[key].state = "final"
			var channels = [0, tourschan];
			for (var c in channels) {
				sys.sendAll("", channels[c])
				sys.sendAll(border, channels[c])
				sys.sendAll("*** Final Match of the "+tours.tour[key].tourtype+" Tournament in #Tours ***", channels[c])
				sys.sendAll("", channels[c])
				sys.sendAll("("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[0])+1)+") "+toCorrectCase(tours.tour[key].players[0]) +" VS "+ toCorrectCase(tours.tour[key].players[1])+" ("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[1])+1)+")", channels[c])
				sys.sendAll(border, channels[c])
				sys.sendAll("", channels[c])
			}
			/* Here in case of the hilarious ~Bye~ vs ~Bye~ siutation */
			tours.tour[key].time = parseInt(sys.time())+Config.Tours.tourdq
			removebyes(key)
			return;
		}
		else {
			var subsExist = false
			for (var x in tours.tour[key].players) {
				if (isSub(tours.tour[key].players[x])) {
					subsExist = true;
					break;
				}
			}
			if (tours.tour[key].round == 1 && subsExist) {
				tours.tour[key].state = "subround"
				tours.tour[key].time = parseInt(sys.time())+Config.Tours.subtime
			}
			else {
				tours.tour[key].state = "round"
				tours.tour[key].time = parseInt(sys.time())+Config.Tours.tourdq
			}
			if (tours.tour[key].round == 1) {
				sys.sendAll("", tourschan)
				sys.sendAll(border, tourschan)
				sys.sendAll("*** Round "+tours.tour[key].round+" of the "+tours.tour[key].tourtype+" Tournament ***", tourschan)
				for (var x=0; x<tours.tour[key].players.length; x+=2) {
					sys.sendAll("("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+") "+toCorrectCase(tours.tour[key].players[x]) +" VS "+ toCorrectCase(tours.tour[key].players[x+1])+" ("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")", tourschan)
				}
				if (subsExist) {
					sys.sendAll("*** Type /join to join late, good while subs last! ***", tourschan)
				}
				sys.sendAll(border, tourschan)
				sys.sendAll("", tourschan)
			}
			else {
				sendAuthPlayers("", key)
				sendAuthPlayers(border, key)
				sendAuthPlayers("*** Round "+tours.tour[key].round+" of the "+tours.tour[key].tourtype+" Tournament ***", key)
				for (var x=0; x<tours.tour[key].players.length; x+=2) {
					sendAuthPlayers("("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+") "+toCorrectCase(tours.tour[key].players[x]) +" VS "+ toCorrectCase(tours.tour[key].players[x+1])+" ("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")", key)
				}
				sendAuthPlayers(border, key)
				sendAuthPlayers("", key)
			}
			removebyes(key)
		}
	}
	catch (err) {
		sys.sendAll("Error in printing the bracket, id "+key+": "+err, tourserrchan)
	}
}

// is the tournament battle valid?
function isValidTourBattle(src,dest,clauses,mode,key,challenge) { // challenge is whether it was issued by challenge
	try {
		var srcindex = tours.tour[key].players.indexOf(sys.name(src).toLowerCase())
		var destindex = tours.tour[key].players.indexOf(sys.name(dest).toLowerCase())
		var srcbtt = tours.tour[key].battlers.indexOf(sys.name(src).toLowerCase())
		var destbtt= tours.tour[key].battlers.indexOf(sys.name(dest).toLowerCase())
		var srcwin = tours.tour[key].winners.indexOf(sys.name(src).toLowerCase())
		var destwin = tours.tour[key].winners.indexOf(sys.name(dest).toLowerCase())
		var checklist = clauseCheck(tours.tour[key].tourtype, clauses)
		var invalidmsg = ""
		if (srcindex == -1) {
			return "You are not in the tournament."
		}
		else if (destindex == -1) {
			return "That player is not in the tournament."
		}
		else if (srcbtt != -1 && challenge) {
			return "You have already started your battle."
		}
		else if (destbtt != -1 && challenge) {
			return "That player has started their battle."
		}
		else if (srcwin != -1) {
			return "You have already won."
		}
		else if (destwin != -1) {
			return "That player has already won."
		}
		else if ((srcindex%2 === 1 && srcindex-destindex != 1) || (srcindex%2 === 0 && destindex-srcindex != 1)) {
			return "That player is not your opponent."
		}
		else if (mode != 1 && tours.tour[key].parameters.mode == "Doubles") {
			return "This match must be played in Doubles mode."
		}
		else if (mode != 2 && tours.tour[key].parameters.mode == "Triples") {
			return "This match must be played in Triples mode."
		}
		else if (mode !== 0 && tours.tour[key].parameters.mode == "Singles") {
			return "This match must be played in Singles mode."
		}
		else if (sys.gen(src) != parseInt(tours.tour[key].parameters.gen) && tours.tour[key].parameters.gen != "default") {
			return "This match must be played in Gen "+tours.tour[key].parameters.gen+"."
		}
		else if (checklist.missing.length > 0 && checklist.extra.length > 0) {
			invalidmsg = "You must add the following clauses to your challenge: "+checklist.missing.join(", ")+"; and you must not have the following clauses: "+checklist.extra.join(", ")
			return invalidmsg;
		}
		else if (checklist.missing.length > 0) {
			invalidmsg = "You must add the following clauses to your challenge: "+checklist.missing.join(", ")
			return invalidmsg;
		}
		else if (checklist.extra.length > 0) {
			invalidmsg = "You must remove the following clauses from your challenge: "+checklist.extra.join(", ")
			return invalidmsg;
		}
		else if (tours.tour[key].state == "final" && clauses%8 >= 4) {
			/* We allow Disallow Spects to be used for all rounds except finals */
			return "Disallow Spects is prohibited in finals matches."
		}
		else if (sys.tier(src) != tours.tour[key].tourtype) {
			return "You are in the wrong tier, you need to be in the "+tours.tour[key].tourtype+" tier."
		}
		else if (sys.tier(dest) != tours.tour[key].tourtype) {
			return "Your opponent is in the wrong tier."
		}
		else return "Valid";
	}
	catch (err) {
		sys.sendAll("Error in battle check, id "+key+": "+err, tourserrchan)
		return "Error in clausecheck, please report and wait for an update.";
	}
}

// awards tournament points
function awardTourPoints(player, size, tier) {
    // each tournament has a 'tier'
    // points for 4-7,8-15,16-31,32-63,64-127,128 players respectively. Tours with 3 players or less don't score.
    var tierscore = {
        'a': [1,2,4,8,16,32],
        'b': [1,2,4,7,13,25], // default
        'c': [0,1,2,4,7,13],
        'd': [0,0,1,2,4,7],
        'e': [0,0,0,1,2,4],
        'f': [0,0,0,0,1,2],
        'z': [0,0,0,0,0,0]
    }
	if (size < 4) return;
	var scale = 0;
	var points = 0
	for (var x=3;x<9;x++) {
		if (size < Math.pow(2,x)) {
			scale = x-3;
			break;
		}
	}
    var tiers_a = []
    var tiers_b = [] // default
    var tiers_c = ["Monotype"]
    var tiers_d = ["Challenge Cup"]
    var tiers_e = ["Wifi CC 1v1", "DW 1v1", "DW 1v1 Ubers"]
    var tiers_f = ["CC 1v1"]
    var tiers_z = ["Metronome"]
	if (tiers_a.indexOf(tier) != -1) {
		points = tierscore.a[scale]
	}
	else if (tiers_b.indexOf(tier) != -1) {
		points = tierscore.b[scale]
	}
	else if (tiers_c.indexOf(tier) != -1) {
		points = tierscore.c[scale]
	}
	else if (tiers_d.indexOf(tier) != -1) {
		points = tierscore.d[scale]
	}
	else if (tiers_e.indexOf(tier) != -1) {
		points = tierscore.e[scale]
	}
	else if (tiers_f.indexOf(tier) != -1) {
		points = tierscore.f[scale]
	}
	else if (tiers_z.indexOf(tier) != -1) {
		points = tierscore.z[scale]
	}
	else {
		points = tierscore.b[scale]
	}
	// writing global scores
	try {
		var data = sys.getFileContent("tourscores.txt")
	}
	catch (e) {
		var data = ""
	}
	var array = data.split("\n")
	var newarray = []
	var onscoreboard = false
	for (var n in array) {
		if (array[n] === "") continue;
		var scores = array[n].split(":::", 2)
		if (player === scores[0]) {
			var newscore = parseInt(scores[1]) + points
			newarray.push(scores[0]+":::"+newscore)
			onscoreboard = true;
		}
		else {
			newarray.push(array[n])
		}
	}
	if (!onscoreboard) {
		newarray.push(player+":::"+points)
	}
	sys.writeToFile("tourscores.txt", newarray.join("\n"))
	// writing tier scores
	try {
		var data2 = sys.getFileContent("tourscores_"+tier.replace(/ /g,"_")+".txt")
	}
	catch (e) {
		var data2 = ""
	}
	var array2 = data2.split("\n")
	var newarray2 = []
	var onscoreboard2 = false
	for (var k in array2) {
		if (array2[k] === "") continue;
		var scores2 = array2[k].split(":::", 2)
		if (player === scores2[0]) {
			var newscore2 = parseInt(scores2[1]) + tierscore.a[scale]
			newarray2.push(scores2[0]+":::"+newscore2)
			onscoreboard2 = true;
		}
		else {
			newarray2.push(array2[k])
		}
	}
	if (!onscoreboard2) {
		newarray2.push(player+":::"+tierscore.a[scale])
	}
	sys.writeToFile("tourscores_"+tier.replace(/ /g,"_")+".txt", newarray2.join("\n"))
	return;
}

// Displays name in correct case

function toCorrectCase(name) {
	if (isNaN(name) && sys.id(name) !== undefined) {
		return sys.name(sys.id(name));
	}
	else {
		return name;
	}
}

// Tour Auth Functions

function isTourAdmin(src) {
	if (sys.auth(src) >= 1 || isTourSuperAdmin(src)) {
		return true;
	}
	if (sys.auth(src) < 0 || !sys.dbRegistered(sys.name(src))) {
		return false;
	}
	var tadmins = tours.touradmins
	if (tadmins !== undefined && tadmins.length >= 1) {
		for (var t in tadmins) {
			if (tadmins[t].toLowerCase() == sys.name(src).toLowerCase()) {
				return true;
			}
		}
	}
	return false;
}

function isTourSuperAdmin(src) {
	if (sys.auth(src) >= 2 || isTourOwner(src)) {
		return true;
	}
	if (sys.auth(src) < 1 || !sys.dbRegistered(sys.name(src))) {
		return false;
	}
	var tsadmins = [];
	if (tsadmins !== undefined && tsadmins.length >= 1) {
		for (var t in tsadmins) {
			if (tsadmins[t].toLowerCase() == sys.name(src).toLowerCase()) {
				return true;
			}
		}
	}
	return false;
}

function isTourOwner(src) {
	if (sys.auth(src) >= 3) {
		return true;
	}
	if (sys.auth(src) < 1 || !sys.dbRegistered(sys.name(src))) {
		return false;
	}
	var towners = ["lamperi", "aerith gainsborough", "zeroality"];
	if (towners !== undefined && towners.length >= 1) {
		for (var t in towners) {
			if (towners[t].toLowerCase() == sys.name(src).toLowerCase()) {
				return true;
			}
		}
	}
        return false;
}

function isInTour(name) {
	var key = false
	for (var x in tours.tour) {
		if (tours.tour[x].players.indexOf(name.toLowerCase()) != -1) {
			key = true;
			break;
		}
	}
	return key;
}

// variance function that influences time between tournaments. The higher this is, the faster tours will start.
function calcVariance() {
	var playersInChan = parseInt((sys.playersOfChannel(tourschan)).length)
	var playersInTours = 0;
	for (var x in tours.tour) {
		if (tours.tour[x].players !== undefined) {
			playersInTours += parseInt(tours.tour[x].players.length)
		}
	}
	// stupid div/0 error :<
	if (playersInChan === 0) {
		return 0.5;
	}
	if (playersInTours === 0) { // use ln(#players)
		return Math.log(playersInChan);
	}
	var variance = Math.log(playersInChan/playersInTours)
	if (variance <= 0.5 || isNaN(variance)) {
		return 0.5;
	}
	else return variance;
}

// end tournament functions
// module functions

module.exports = {
	handleCommand: function(source, message, channel) {
		var command;
		var commandData = "";
		var pos = message.indexOf(' ');
		if (pos != -1) {
			command = message.substring(0, pos).toLowerCase();
			commandData = message.substr(pos+1);
		} 
		else {
			command = message.substr(0).toLowerCase();
		}
		if (channel === sys.channelId("Tours")) {
			return tourCommand(source, command, commandData)
		}
		return false;
	},
	init: function() {
		initTours();
	},
	afterBattleEnded : function(source, dest, desc) {
		tourBattleEnd(source, dest, desc)
	},
	stepEvent : function() {
		tourStep()
	},
	beforeChallengeIssued : function(source, dest, clauses, rated, mode) {
		var ret = false;
		ret |= tourChallengeIssued(source, dest, clauses, rated, mode)
		return ret;
	},
	afterBattleStarted : function(source, dest, clauses, rated, mode, bid) {
		return tourBattleStart(source, dest, clauses, rated, mode)
	},
	beforeBattleMatchup : function(source, dest, clauses, rated) {
		var ret = false;
		ret |= (isInTour(sys.name(source)) || isInTour(sys.name(dest)));
		return ret;
	}
}
