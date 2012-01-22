function Tournament(channel, globalObject)
{
	var self = this;

	self.channel = channel;
	self.running = false;
	self.main = false;
	self.count = 0;
	self.tier = "";
	self.phase = "";
	self.starter = "";
	self.round = 0;
	self.battlesStarted = [];
	self.battlesLost = [];

	var entrants = {};
	var members = [];
	var battlers = [];

	var border = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:";

	function sendPM(id,message) {
		sys.sendMessage(id, Config.tourneybot + ": " + message, self.channel);
	}

	function broadcast(message, bot) {
		var bot = arguments.length == 1 ? false : bot;

		if (bot) {
			sys.sendAll(Config.tourneybot + ": " + message, self.channel);
		} else {
			sys.sendAll(message, self.channel);
		}
	}

	function wall(message) {
		sys.sendAll(message, self.channel);
		if (self.main) {
			sys.sendAll(message, 0);
		}
	}

	function start(source, data) {
		if (self.running) {
			sendPM(source, "A tournament is already running!");
			return;
		}

		if (data.indexOf(':') == -1)
			var commandpart = data.split(' ');
		else
			var commandpart = data.split(':');

		self.count = parseInt(commandpart[1]);

		if (isNaN(self.count) || count <= 2){
			sendPM(src, "You must specify a tournament size of 3 or more.");
			return;
		}

		var tiers = sys.getTierList();
		var found = false;
		for (var x in tiers) {
			if (cmp(tiers[x], commandpart[0])) {
				self.tier = tiers[x];
				found = true;
				break;
			}
		}
		if (!found) {
			sendPM(src, "Sorry, the server does not recognise the " + commandpart[0] + " tier.");
			return;
		}

		wall(border);
		wall("*** A Tournament was started by " + sys.name(source) + "! ***");
		wall("PLAYERS: " + self.count);
		wall("TYPE: Single Elimination");
		wall("TIER: " + self.tier);
		wall("");
		wall("*** Go in the #"+sys.channel(self.channel) + " channel and type /join or !join to enter the tournament! ***");
		wall(border);

		self.running = true;
		self.phase = "entry";
		self.starter = sys.name(src);
		self.round = 0;

		entrants = {};
		members = [];
	}

	function isInTour(name) {
		return name.toLowerCase() in entrants;
	}

	function remainingEntrants() {
		return self.count - members.count;
	}

	/* Precondition: isInTour(name) is false */
	function addEntrant(name) {
		entrants[name.toLowerCase()] = name;
		members.push(name.toLowerCase());
	}

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

		addEntrant(name);
		broadcast("~~Server~~: " + name + " joined the tournament! " + remainingEntrants()  + "more spot(s) left!");

		if (remainingEntrants() == 0) {
			startTournament();
		}
	}

	function startTournament() {
		self.phase = "playing";

		roundPairing();
	}

	function firstPlayer() {
		return members[0];
	}

	function memberCount() {
		return members.length;
	}

	function casedName(name) {
		return entrants[name];
	}

	function roundPairing() {
		self.round += 1;

		battlesStarted = [];
		battlers = [];
		battlesLost = [];

		if (memberCount() == 1) {
			wall("");
			wall(border);
			wall("");
			wall("THE WINNER OF THE " + self.tier.toUpperCase() + " TOURNAMENT IS : " + firstPlayer());
			wall("");
			wall("*** Congratulations, " + firstPlayer() + ", on your success! ***");
			wall("");
			wall(border);
			wall("");

			self.running = false;

			// tier, time, number of participants, winner
			if (self.main) {
				var tier = self.tier;
				var time = sys.time();
				var winner = firstPlayer();
				var num = self.count;
				var noPoints = cmp(winner,self.starter) && sys.auth(sys.id(winner)) == 0;
				globalObject.updateTourStats(tier, time, winner, num, noPoints);
			}

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
		while (members.length >= 2) {
			i += 1;
			var x1 = sys.rand(0, members.length);
			battlers.push(members[x1]);
			var name1 = casedName(members[x1]);
			members.splice(x1,1);


			x1 = sys.rand(0, members.length);
			battlers.push(members[x1]);
			var name2 = casedName(members[x1]);
			members.splice(x1,1);

			if (!finals)
				broadcast(i + "." + this.padd(name1) + " VS " + name2);
			else {
				wall ("  " + this.padd(name1) + " VS " + name2);
			}
		}

		if (members.length > 0) {
			broadcast("");
			broadcast("*** " + casedName(members[0]) + " is randomly selected to go to next round!");
		}

		var f = finals ? wall : broadcast;

		f(border);
		f("");
	}
}
