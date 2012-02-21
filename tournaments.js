/*
 * tournaments.js
 *
 * Contains code for pokemon online server scripted tournaments.
 */
if (typeof Config == "undefined")
    Config = {}
if (!Config.tourneybot) Config.tourneybot = '±TourneyBot';

var tournamentData, permaTours;

var SLEEP_CLAUSE="Sleep Clause",
    FREEZE_CLAUSE="Freeze Clause",
    DISALLOW_SPECS="Disallow Spectators",
    ITEM_CLAUSE="Item Clause",
    CHALLENGE_CUP="Challenge Cup",
    NO_TIMEOUT="No Timeout",
    SPECIES_CLAUSE="Species Clause",
    WIFI_CLAUSE="Wifi Clause",
    SELF_KO_CLAUSE="Self KO Clause";

var clauseMap = {
	1: SLEEP_CLAUSE,
	2: FREEZE_CLAUSE,
	4: DISALLOW_SPECS,
	8: ITEM_CLAUSE,
	16: CHALLENGE_CUP,
	32: NO_TIMEOUT,
	64: SPECIES_CLAUSE,
	128: WIFI_CLAUSE,
	256: SELF_KO_CLAUSE	
}

function hasClause(clauses, clause) {
	return (clauses % clause) > 0;
}

function clauseList(clauses) {
	var names = [];
	for (var bit in clauseMap) {
		if ((bit & clauses) > 0) {
			names.push(clauseMap[bit]);
		}
	} 
	return names;
}

function clauseError(battleClauses, tierClauses) {
	var missing = [],
	    extra = [];	
	for (var bit in clauseMap) {
		if ((bit & tierClauses) > 0 && (bit & battleClauses) == 0) {
			missing.push(clauseMap[bit]);
		} else if ((bit & tierClauses) == 0 && (bit & battleClauses) > 0) {
			extra.push(clauseMap[bit]);
		}
	} 
	return {'missing': missing, 'extra': extra};
}

function tierClauses(tier) {
	var clauses = sys.getClauses(tier);
	if (clauses !== undefined)
		return clauseList(clauses);
	else
		return null;
}

function Tournament(channel)
{

	/* reuse variables from SESSION memory if possible */
	if (!tournamentData.hasOwnProperty(channel)) {

		this.channel = channel;
		this.running = false;
		this.main = false;
		this.count = 0;
		this.tier = "";
		this.phase = "";
		this.starter = "";
		this.round = 0;
		this.battlesStarted = [];
		this.battlesLost = [];
		this.entrants = {};
		this.members = [];
		this.battlers = [];

		tournamentData[channel] = {
			self: this,
		};
	}

	// Save everything that should be retained after script update
	// to self
	var self = tournamentData[channel].self;

	var border = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:";

	function sendPM(id, message, bot) {
		var bot = arguments.length == 1 ? false : bot;

		if (bot) {
			message = Config.tourneybot + ": " + message;
		}
		sys.sendMessage(id, message, self.channel);
	}

	function broadcast(message, bot) {
		var bot = arguments.length == 1 ? false : bot;

		if (bot) {
			message = Config.tourneybot + ": " + message;
		}
		sys.sendAll(message, self.channel);
	}

	function wall(message) {
		sys.sendAll(message, self.channel);
		if (self.main) {
			sys.sendAll(message, 0);
		}
	}

        // Command start
	function start(source, data) {
		if (self.running) {
			sendPM(source, "A tournament is already running!");
			return;
		}

		if (data.indexOf(':') == -1)
			var commandpart = data.split(' ');
		else
			var commandpart = data.split(':');

		var count = parseInt(commandpart[1]);

		if (isNaN(count) || count <= 2){
			sendPM(source, "You must specify a tournament size of 3 or more.");
			return;
		}
		self.count = count;


		var tiers = sys.getTierList();
		var found = false;
		for (var i = 0; i < tiers.length; ++i) {
			if (cmp(tiers[i], commandpart[0])) {
				self.tier = tiers[i];
				found = true;
				break;
			}
		}
		if (!found) {
			sendPM(source, "Sorry, the server does not recognise the " + commandpart[0] + " tier.");
			return;
		}

		wall(border);
		wall("*** A Tournament was started by " + sys.name(source) + "! ***");
		wall("PLAYERS: " + self.count);
		wall("TYPE: Single Elimination");
		wall("TIER: " + self.tier);
		broadcast("CLAUSES: " + tierClauses(self.tier).join(", "));
		wall("");
		wall("*** Go in the #" + sys.channel(self.channel) + " channel and type /join or !join to enter the tournament! ***");
		wall(border);

		self.running = true;
		self.phase = "entry";
		self.starter = sys.name(source);
		self.round = 0;

		self.entrants = {};
		self.members = [];
	}

	function isInTour(name) {
		return name.toLowerCase() in self.entrants;
	}

	function remainingEntrants() {
		return self.count - self.members.length;
	}

	function playingPhase() {
		return self.phase == "playing" || self.phase == "finals";
	}

	/* Precondition: isInTour(name) is false */
	function addEntrant(name) {
		self.entrants[name.toLowerCase()] = name;
		self.members.push(name.toLowerCase());
	}

	function removeEntrant(name) {
		delete self.entrants[name.toLowerCase()];
		self.members.splice(self.members.indexOf(name.toLowerCase()), 1);
	}

        // Command join
	function join(source) {
		if (self.phase != "entry") {
			sendPM(source, "The tournament is not in signup phase at the moment");
			return;
		}

		var name = sys.name(source);

		if (isInTour(name)) {
			sendPM(source, "You already joined the tournament!");
			return;
		}

		var srctier = sys.tier(source);
		if (!cmp(srctier, self.tier)){
			sendPM(source, "You are currently not battling in the " + self.tier + " tier. Change your tier to " + self.tier + " to be able to join.");
			return;
		}

		addEntrant(name);
		broadcast("~~Server~~: " + name + " joined the tournament! " + remainingEntrants()  + " more spot(s) left!");

		if (remainingEntrants() == 0) {
			startTournament();
		}
	}

	// Command unjoin
	function unjoin(source) {
		if (!self.running) {
			sendPM(source, "Wait till the tournament has started.");
			return;
		}

		var name = sys.name(source);

		if (isInTour(name)) {
			if (self.phase == "entry") {
				removeEntrant(name);
				broadcast("~~Server~~: " + name + " left the tournament!");
			} else if (playingPhase()) {
				setBattleStarted(name);
				broadcast("~~Server~~: " + name + " left the tournament!");
				// end battle?
				endBattle(tourOpponent(name), name);
			}
		}
	}

	/* Command viewround */
	function viewround(source) {
		if (!playingPhase()) {
			sendPM(source, "Sorry, you are unable to view the round because a tournament is not currently running or is in signing up phase.");
			return;
		}
		
		sendPM(source, "", false);
		sendPM(source, border, false);
		sendPM(source, "", false);
		sendPM(source, "*** ROUND " + self.round + " OF " + self.tier.toUpperCase() + " TOURNAMENT ***", false);

		if (self.battlesLost.length > 0) {
			sendPM(source, "", false);
			sendPM(source, "*** Battles finished ***", false);
			sendPM(source, "", false);
			for (var i = 0; i < self.battlesLost.length; i+= 2) {
				sendPM(source, self.battlesLost[i] + " won against " + self.battlesLost[i+1], false);
			}
			sendPM(source, "", false);
		}

		if (self.battlers.length > 0) {
			if (self.battlesStarted.indexOf(true) != -1) {
				sendPM(source, "", false);
				sendPM(source, "*** Ongoing battles ***", false);
				sendPM(source, "", false);
				for (var i = 0; i < self.battlers.length; i+=2) {
					if (self.battlesStarted[i/2]) {
						sendPM(source, padd(self.entrants[self.battlers[i]]) + " VS " + self.entrants[self.battlers[i+1]], false);
					}
				}
				sendPM(source, "", false);
			}
			if (self.battlesStarted.indexOf(false) != -1) {
				sendPM(source, "", false);
				sendPM(source, "*** Yet to start battles ***", false);
				sendPM(source, "", false);
				for (var i = 0; i < self.battlers.length; i+=2) {
					if (!self.battlesStarted[i/2]) {
						sendPM(source, padd(self.entrants[self.battlers[i]]) + " VS " + self.entrants[self.battlers[i+1]], false);
					}
				}
				sendPM(source, "", false);
			}
		}
		if (self.members.length > 0) {
			sendPM(source, "", false);
			sendPM(source, "*** Members to the next round ***", false);
			sendPM(source, "", false);
			var s = [];
			for (var i = 0; i < self.members.length; ++i) {
				s.push(self.entrants[self.members[i]]);
			}
			sendPM(source, s.join(", "), false);
			sendPM(source, "", false);
		}

		sendPM(source, border, false);
		sendPM(source, "", false);
	}

	// Command dq (disqualify)
	function dq(source, name) {
		if (!self.running) {
			sendPM(source, "Wait till the tournament has started.");
		}

		var authority = sys.name(source);

		if (isInTour(name)) {
			if (self.phase == "entry" || self.members.indexOf(name.toLowerCase()) >= 0) {
				removeEntrant(name);
				broadcast("~~Server~~: " + name + " was removed from the tournament by " + authority + "!");
			} else if (playingPhase()) {
				broadcast("~~Server~~: " + name + " was removed from the tournament by " + authority + "!");
				endBattle(tourOpponent(name), name);
			}
		} else {
			sendPM(source, name + " is not in the tournament.");
		}
	}

	// Command push
	function push(source, name) {
		if (!self.running) {
			sendPM(source, "Wait till the tournament has started.");
			return;
		}

		var authority = sys.name(source);

		if (isInTour(name)) {
			sendPM(source, name + " is already in the tournament.");
			return;
		}

		addEntrant(name);
		if (self.phase == "playing") {
			broadcast(name + " was added to the tournament by " + sys.name(source) + ".");
		} else if (self.phase == "entry") {
			broadcast(name + " was added to the tournament by " + sys.name(source) + ". " + remainingEntrants() + " more spot(s) left!");

			if (remainingEntrants() == 0) {
				startTournament();
			}
		}
	}

	// command cancelBattle
	function cancelBattle(source, name) {
		if (!playingPhase()) {
			sendPM(source, "Wait until a tournament starts!");
			return;
		}

		if (isBattling(name)) {
			sendPM(source, name + " can forfeit their battle and rematch now.");
			sendPM(sys.id(name), "You can forfeit your battle and rematch now.");
			sendPM(sys.id(tourOpponent(name)), "You can forfeit your battle and rematch now.");
			setBattleStarted(name, false);
		} else {
			sendPM(source, name + " is not battling.")
			setBattleStarted(name, false);
		}
	}

	// Command sub
	function sub(source, data) {
		if (!playingPhase()) {
			sendPM(source, "Wait until a tournament starts!");
			return;
		}

		var players = data.split(":");
		if (!isInTour(players[0]) && !isInTour(players[1])) {
			sendPM(source, "Neither are in the tournament.");
			return;
		}

		broadcast(players[0] + " and " + players[1] + " were exchanged places in the ongoing tournament by "  + sys.name(source));

		var p1 = players[0].toLowerCase();
		var p2 = players[1].toLowerCase();

		/*broadcast("Contents of variables before subbing:");
		broadcast("self.members: [" + self.members.map(function (i) { return i.toString(); }).join(", ") + "]");
		broadcast("self.battlers: [" + self.battlers.map(function (i) { return i.toString(); }).join(", ") + "]");
		broadcast("self.battlesStarted: [" + self.battlesStarted.map(function (i) { return i.toString(); }).join(", ") + "]");
		var e = []; for (var x in self.entrants) { e.push("" +x + ": " + self.entrants[x]);}
		broadcast("self.entrants: {" + e.join(", ") + "}");*/

		if (isBattling(p1))
			setBattleStarted(p1, false);
		if (isBattling(p2))
			setBattleStarted(p2, false);

		// Sub in arrays
		function subInArray(arr) {
			for (var i = 0; i < arr.length; ++i) {
				if (arr[i] == p1) {
					arr[i] = p2;
				} else if (arr[i] == p2) {
					arr[i] = p1;
				}
			}
		}
		subInArray(self.members);
		subInArray(self.battlers);
		subInArray(self.battlesLost);

		// change in self.entrants
		if (!isInTour(players[0])) {
			self.entrants[p1] = players[0];
			delete self.entrants[p2];
		} else if (!isInTour(players[1])) {
			self.entrants[p2] = players[1];
			delete self.entrants[p1];
		}


		/*broadcast("Contents of variables before subbing:");
		broadcast("self.members: [" + self.members.map(function (i) { return i.toString(); }).join(", ") + "]");
		broadcast("self.battlers: [" + self.battlers.map(function (i) { return i.toString(); }).join(", ") + "]");
		broadcast("self.battlesStarted: [" + self.battlesStarted.map(function (i) { return i.toString(); }).join(", ") + "]");
		var e = []; for (var x in self.entrants) { e.push("" +x + ": " + self.entrants[x]);}
		broadcast("self.entrants: {" + e.join(", ") + "}");*/


	}

	// Command changeCount
	function changeCount(source, data) {
		if (self.phase != "entry") {
			sendPM(source, "Can only change count during signups.");
			return;
		}

		var count = parseInt(data);

		if (isNaN(count) || count <= 2){
			sendPM(source, "You must specify a tournament size of 3 or more.");
			return;
		}

		if (count < memberCount()) {
			sendPM(source, "There are more than that people registered");
			return;
		}

		self.count = count;

		broadcast("");
		broadcast(border);
		broadcast("~~Server~~: " + sys.name(source) + " changed the number of self.entrants to " + count + "!");
		broadcast(border);
		broadcast("");

		if (remainingEntrants() == 0) {
			startTournament();
		}
	}

	function endTour(source, data) {
		if (self.running) {
                        resetTourVars()
			broadcast("");
			broadcast(border);
			broadcast("~~Server~~: The tournament was cancelled by " + sys.name(source) + "!");
			broadcast(border);
			broadcast("");
			
		} else {
			sendPM(source, "Sorry, you are unable to end a tournament because one is not currently running.");
		}
	}

	function startTournament() {
		self.phase = "playing";

		roundPairing();
	}

	function firstPlayer() {
		return self.members[0];
	}

	function memberCount() {
		return self.members.length;
	}

	function casedName(name) {
		return self.entrants[name];
	}

        function padd(name) {
		var ret = name;
		while (ret.length < 20) ret = ' ' + ret;
		return ret;
	}

	function cmp(s1, s2) {
		return s1.toLowerCase() == s2.toLowerCase();
	}

	function setBattleStarted(name, started) {
		if (started === undefined) started = true;
		self.battlesStarted[Math.floor(self.battlers.indexOf(name.toLowerCase())/2)] = started;
	}

	function removeBattle(name) {
		var index = Math.floor(self.battlers.indexOf(name.toLowerCase())/2);
		self.battlesStarted.splice(index, 1);
		self.battlers.splice(2*index, 2);
	}

	function isBattling(name) {
		var indx = self.battlers.indexOf(name.toLowerCase());
		if (indx == -1) return false;
		return self.battlesStarted[Math.floor(indx/2)];
	}

	function areOpponents(name1, name2) {
		var indx1 = self.battlers.indexOf(name1.toLowerCase()),
		    indx2 = self.battlers.indexOf(name2.toLowerCase());
		return indx1 >= 0 && Math.floor(indx1/2) == Math.floor(indx2/2);
	}

	function tourOpponent(name) {
		var index = self.battlers.indexOf(name.toLowerCase());
		if (index == -1)
			return null;
		else if ((index % 2) == 0)
			return self.battlers[index + 1];
		else 
			return self.battlers[index - 1];
	}


	function roundPairing() {
		self.round += 1;

		self.battlesStarted = [];
		self.battlers = [];
		self.battlesLost = [];

		if (memberCount() == 1) {
			broadcast("");
			broadcast(border);
			broadcast("");
			broadcast("THE WINNER OF THE " + self.tier.toUpperCase() + " TOURNAMENT IS : " + casedName(firstPlayer()));
			broadcast("");
                        broadcast("*** Congratulations, " + casedName(firstPlayer()) + ", on your success! ***");
			broadcast("");
			broadcast(border);
			broadcast("");

			// tier, time, number of participants, winner
			if (self.main) {
				var tier = self.tier;
				var time = sys.time();
				var winner = firstPlayer();
				var num = self.count;
				var noPoints = cmp(winner,self.starter) && sys.auth(sys.id(winner)) == 0;
				if (typeof script == "object" && script.updateTourStats)
					script.updateTourStats(tier, time, winner, num, noPoints);
			}
                        resetTourVars()
			return;
		}

		var finals = memberCount() == 2;

		if (finals) {
			self.phase = "finals";
		}

		if (!finals) {
			broadcast("");
			broadcast(border);
			broadcast("*** Round " + self.round + " of " + self.tier + " tournament ***");
			broadcast("");
		}
		else {
			wall("");
			wall(border);
			wall("*** FINALS OF " + self.tier.toUpperCase() + " TOURNAMENT ***");
			wall("");
		}

		var i = 0;
		while (self.members.length >= 2) {
			i += 1;
			var x1 = sys.rand(0, self.members.length);
			self.battlers.push(self.members[x1]);
			var name1 = casedName(self.members[x1]);
			self.members.splice(x1,1);


			x1 = sys.rand(0, self.members.length);
			self.battlers.push(self.members[x1]);
			var name2 = casedName(self.members[x1]);
			self.members.splice(x1,1);

			if (!finals)
				broadcast(i + "." + padd(name1) + " VS " + name2);
			else {
				wall ("  " + padd(name1) + " VS " + name2);
			}
			self.battlesStarted.push(false);
		}

		if (self.members.length > 0) {
			broadcast("");
			broadcast("*** " + casedName(self.members[0]) + " is randomly selected to go to next round!");
		}

		var f = finals ? wall : broadcast;

		f(border);
		f("");
	}

	// event battleStart
	function battleStart(source, dest) {
		if (areOpponents(sys.name(source), sys.name(dest))) {
			setBattleStarted(sys.name(source));
		}
	}

	// event battleEnd
	function battleEnd(source, dest, desc) {
		var winner = sys.name(source), loser = sys.name(dest);
		if (!areOpponents(winner, loser)) {
			return;
		}
		if (!isBattling(winner)) {
			// Cancel battle sets winner to be not battling
			// We don't want to proceed into endBattle then
			return
		}
                endBattle(winner, loser);
	}

	// common function for /dq, /unjoin and natural battle end
        function endBattle(winner, loser) {
		self.battlesLost.push(winner);
		self.battlesLost.push(loser);
		
		removeBattle(winner);
		self.members.push(winner.toLowerCase());
		delete self.entrants[loser.toLowerCase()];	

		if (self.battlers.length != 0 || self.members.length > 1) {
			broadcast("");
			broadcast(border);
			broadcast("~~Server~~: " + winner + " advances to the next round.");
			broadcast("~~Server~~: " + loser + " is out of the tournament.");
		}
		if (self.battlers.length > 0) {
			broadcast("*** " + self.battlers.length/2 + " battle(s) remaining.");
			broadcast(border);
			broadcast("");
			return;
		}

		roundPairing();
	}

	// event beforeChallenge
	function beforeChallenge(source, dest, clauses) {
		if (!playingPhase())
			return;
		var name1 = sys.name(source),
		    name2 = sys.name(dest);
		if (isInTour(name1)) {
			if (!areOpponents(name1, name2)) {
				sendPM(source, "This guy isn't your opponent in the tourney.");
				return true;
			}
			if (sys.tier(source) != sys.tier(dest) || !cmp(sys.tier(source), self.tier)) {
				sendPM(source, "You must be both in the tier " + self.tier + " to battle in the tourney.");
				return true;
			}
			var tierClauses = sys.getClauses(self.tier);
			if (clauses != tierClauses) {
				var errors = clauseError(clauses, tierClauses);
				var ignoreExtra = [FREEZE_CLAUSE, DISALLOW_SPECS];
				var allowMissing = [NO_TIMEOUT, DISALLOW_SPECS];
				var extra = errors.extra.filter(function (e) { return ignoreExtra.indexOf(e) == -1; });
				var missing = errors.missing.filter(function (e) { return allowMissing.indexOf(e) == -1; });
				if (extra.length > 0)
					sendPM(source, "You must remove following clauses from your challenge: " + extra.join(", "));
				if (missing.length > 0)
					sendPM(source, "You must add following clauses to your challenge: " + missing.join(", "));
				if (extra.length > 0 || missing.length > 0)
					return true;
			}
			if (self.phase == "finals" && hasClause(clauses, DISALLOW_SPECS)) {
				sendPM(source, "You must not use \"disallow specs\" in finals.");
				return true;
			}
		} else if (isInTour(name2)) {
			sendPM(source, "This guy isn't your opponent in the tourney.");
			return true;
		}
	}

	// event battleMatchup
	function battleMatchup(source, dest, clauses, rated) {
		// return true if one of the players is in tournament
		// will stop the FindBattle match
		return playingPhase() && (isInTour(sys.name(source)) || isInTour(sys.name(dest)));
	}

	function afterLogIn(source) {
		if (self.main && self.phase == "entry") {
			sys.sendMessage(src,"*** A " + self.tier + " tournament is in its signup phase, " + remainingEntrants() + " spot(s) are left!");
			sys.sendMessage(src, "");
			sys.sendMessage(src, border);
			sys.sendMessage(src, "");
		}
	}

        // resetting tournament variables when a tournament is finished

        function resetTourVars() {
            self.running = false;
            self.count = 0;
            self.tier = "";
            self.phase = "";
            self.starter = "";
            self.round = 0;
            self.battlesStarted = [];
            self.battlesLost = [];
            self.entrants = {};
            self.members = [];
            self.battlers = [];
        }

	this.announceInit = function announceInit() {
		broadcast("Tournaments are now running on #" + sys.channel(self.channel) + "!");
	}

	this.commands = {
		join: join,
		unjoin: unjoin,
		viewround: viewround
	}
	this.authCommands = {
		tour: start,
		dq: dq,
		push: push,
		cancelbattle: cancelBattle,
		sub: sub,
		changecount: changeCount,
		endtour: endTour
	}

	this.events = {
		afterBattleStarted: battleStart,
		afterBattleEnded: battleEnd,
		beforeChallengeIssued: beforeChallenge,
		beforeBattleMatchup: battleMatchup
	}
}

module.tournaments = {}

module.exports = {
	init: function() {
		/* use SESSION.global() to save data across script reloads*/
		if (!SESSION.global().hasOwnProperty("tournamentData"))
			SESSION.global().tournamentData = {};
		tournamentData = SESSION.global().tournamentData;

		if (!SESSION.global().hasOwnProperty("permaTours"))
			SESSION.global().permaTours = [];
		permaTours = SESSION.global().permaTours;

		var tourchannel, channelname = "Tournaments";
		if (sys.existChannel(channelname)) {
			tourchannel = sys.channelId(channelname);
		} else {
			tourchannel = sys.createChannel(channelname);
		}

		// Do not reinitialize - in case init is called many times
		if (module.tournaments[tourchannel])
			return;

		var tournament = new Tournament(tourchannel);
		tournament.main = true;
		tournament.announceInit();
		module.tournaments[tourchannel] = tournament;

		for (var i = 0; i < permaTours.length; ++i) {
			if (sys.channel(permaTours[i]) !== undefined) {
				tournament = new Tournament(permaTours[i]);
				tournament.announceInit();
				module.tournaments[permaTours[i]] = tournament;
			}
		}
		// TODO: afterChannelDestroyed delete from SESSION
	},

	// debug for evaling private variables
	tournament : function(channel_name) {
		return module.tournaments[sys.channelId(channel_name)];
	},	

	handleCommand: function(source, message, channel) {
       		var command;
       		var commandData = "";
       		var pos = message.indexOf(' ');
		if (pos != -1) {
			command = message.substring(0, pos).toLowerCase();
			commandData = message.substr(pos+1);
		} else {
			command = message.substr(0).toLowerCase();
		}

		if (module.tournaments[channel] !== undefined) {
			if (command in module.tournaments[channel].commands) {
				module.tournaments[channel].commands[command](source, commandData);
			        return true;
			} else if (command in module.tournaments[channel].authCommands) {
				var isChanOp = SESSION.channels(channel).isChannelOperator && SESSION.channels(channel).isChannelOperator(source);
				if (sys.auth(source) == 0 && !SESSION.users(source).megauser && !isChanOp) {
					sys.sendMessage(source, "Sorry, you do not have access to this Tournament command.");
					return true;
				}
				module.tournaments[channel].authCommands[command](source, commandData);
			        return true;
			}
			if (command == "disabletours" && sys.auth(source) >= 2 && channel != tourchannel) {
				delete module.tournaments[channel];
				var ind = SESSION.global().permaTours.indexOf(channel);
				if (ind >= 0) {
					SESSION.global().permaTours.splice(ind, 1);
				}
				return true;
			}
		} else if (command == "enabletours" && sys.auth(source) >= 2) {
			module.tournaments[channel] = new Tournament(channel);
			module.tournaments[channel].announceInit();
			SESSION.global().permaTours.push(channel);
			return true;
		}
		return false;
	},

	afterBattleStarted : function(source, dest, clauses, rated, mode, bid) {
		for (channel in module.tournaments) {
			module.tournaments[channel].events.afterBattleStarted(source, dest, clauses, rated, mode, bid);
		}
	},

	afterBattleEnded : function(source, dest, desc) {
		if (desc == "tie")
			return;
		for (channel in module.tournaments) {
			module.tournaments[channel].events.afterBattleEnded(source, dest, desc);
		}
	},

	beforeChallengeIssued : function(source, dest, clauses, rated, mode) {
		var ret = false;
		for (channel in module.tournaments) {
			ret |= module.tournaments[channel].events.beforeChallengeIssued(source, dest, clauses, rated, mode);
		}
		return ret;
	},

	beforeBattleMatchup : function(source, dest, clauses, rated) {
		var ret = false;
		for (channel in module.tournaments) {
			ret |= module.tournaments[channel].events.beforeBattleMatchup(source, dest, clauses, rated);
		}
		return ret;
	},

        "help-string": ["tournaments: To know the tournament commands"],

        onHelp: function(src, topic, channel) {
            var help = [];
            if (topic == "tournaments") {
                help = [
                  "/join: Enters you to in a tournament.",,
                  "/unjoin: Withdraws you from a tournament.",
                  "/viewround: Shows the current pairings for the round.",
                ];
            }
            else if (topic == "megauser") {
                help = [
                  "/tour [tier]:[number]: Starts a tournament in set tier for the selected number of players.",
                  "/endtour: Ends the current tournament.",
                  "/dq name: Disqualifies someone in the tournament.",
                  "/push name: Adds a user to the tournament.",
                  "/changecount [self.entrants]: Changes the number of self.entrants during the signup phase.",
                  "/sub name1:name2: Replaces name1 with name2 in the tournament.",
                  "/cancelBattle name1: Allows the user or their opponent to forfeit without leaving the tournament their current battle so they can battle again with correct clauses."
                ];
            }
            if (help.length > 0) {
                for (var i = 0; i < help.length; ++i) {
                   sys.sendMessage(src, help[i], channel);
                }
                return true;
            }
            return false;
        }
}
