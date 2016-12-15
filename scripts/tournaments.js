/*
 * tournaments.js
 *
 * Contains code for pokemon online server scripted tournaments.
 * Original code by coyotte508/Lutra.
 */

/*global sendChanAll*/
if (typeof Config == "undefined")
    Config = {};
if (!Config.tourneybot) Config.tourneybot = 'TourneyBot';

var tournamentData, permaTours;

var SLEEP_CLAUSE="Sleep Clause",
    FREEZE_CLAUSE="Freeze Clause",
    DISALLOW_SPECS="Disallow Spectators",
    ITEM_CLAUSE="Item Clause",
    CHALLENGE_CUP="Challenge Cup",
    NO_TIMEOUT="No Timeout",
    SPECIES_CLAUSE="Species Clause",
    WIFI_CLAUSE="Team Preview",
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
};

// build reverse mapping
var clauseToId={};
for (var x in clauseMap)
    clauseToId[clauseMap[x]] = x;

function hasClause(clauses, clause) {
    if (clauseToId[clause] !== undefined) {
        clause = clauseToId[clause];
    }
    return (clauses & clause) > 0;
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
    var missing = [], extra = [];
    for (var bit in clauseMap) {
        if ((bit & tierClauses) > 0 && (bit & battleClauses) === 0) {
            missing.push(clauseMap[bit]);
        } else if ((bit & tierClauses) === 0 && (bit & battleClauses) > 0) {
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
        this.queue = [];
        this.ips = [];
        this.mode = "";

        tournamentData[channel] = {
            self: this
        };
    }

    // Save everything that should be retained after script update
    // to self
    var self = tournamentData[channel].self;
    if (self.ips === undefined) self.ips = [];

    var border = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:";

    function sendPM(id, message, bot) {
        bot = arguments.length == 1 ? false : bot;

        if (bot) {
            message = "±" + Config.tourneybot + ": " + message;
        }
        sys.sendMessage(id, message, self.channel);
    }

    function broadcast(message, bot) {
        bot = arguments.length == 1 ? false : bot;

        if (bot) {
            message = "±" + Config.tourneybot + ": " + message;
        }
        sendChanAll(message, self.channel);
    }

    function wall(message) {
        sendChanAll(message, self.channel);
        if (self.main && self.channel !== 0) {
            sendChanAll(message, 0);
        }
    }

    function advertise(message) {
        if (self.main && self.channel !== 0) {
            sendChanAll(message, 0);
        }
    }

    function findTier(tier_name) {
        var tiers = sys.getTierList();
        for (var i = 0; i < tiers.length; ++i) {
            if (cmp(tiers[i], tier_name)) {
                return tiers[i];
            }
        }
        return null;
    }

    function parseTierAndCount(source, data) {
        var commandpart = (data.indexOf(':') == -1) ? data.split(' ') : data.split(':');

        var count = parseInt(commandpart[1], 10);

        if (isNaN(count) || count <= 2 || count > 256){
            sendPM(source, "You must specify a tournament size of 3 or more (and not more than 256 players).");
            return;
        }

        var tier = findTier(commandpart[0]);
        if (tier === null) {
            sendPM(source, "Sorry, the server does not recognise the " + commandpart[0] + " tier.");
            return;
        }
        
        var mode = "Singles";
        
        if (commandpart[2] === undefined) {
            mode = modeOfTier(tier);
        }
        else {
            var singlesonlytiers = ["DW 1v1", "DW 1v1 Ubers", "CC 1v1", "Wifi CC 1v1", "GBU Singles", "Adv Ubers", "Adv OU", "DP Ubers", "DP OU", "DW OU", "DW Ubers", "Wifi OU", "Wifi Ubers"];
            if ((modeOfTier(tier) == "Doubles" || modeOfTier(tier) == "Triples" || singlesonlytiers.indexOf(tier) != -1) && !cmp(commandpart[2], modeOfTier(tier))) {
                sendPM(source, "The "+tier+" tier can only be played in " + modeOfTier(tier) + " mode!");
                return;
            }
            else if (cmp(commandpart[2], "singles")) {
                mode = "Singles";
            }
            else if (cmp(commandpart[2], "doubles")) {
                mode = "Doubles";
            }
            else if (cmp(commandpart[2], "triples")) {
                mode = "Triples";
            }
            else mode = modeOfTier(tier);
        }
        
        return {starter: sys.name(source), tier: tier, count: count, mode: mode};
    }

    // Command start
    function start(source, data) {
        if (self.running) {
            sendPM(source, "A tournament is already running!");
            return;
        }
        var res = parseTierAndCount(source, data);

        if (!res) return;

        initTournament(res.starter, res.tier, res.count, res.mode);
    }

    function initTournament(starter, tier, count, mode) {
        self.starter = starter;
        self.tier = tier;
        self.count = count;
        self.mode = mode;

        wall(border);
        wall("*** A Tournament was started by " + self.starter + "! ***");
        wall("PLAYERS: " + self.count);
        wall("TIER: " + self.tier);
        wall("MODE: " + self.mode);
        broadcast("CLAUSES: " + tierClauses(self.tier).join(", "));
        wall("");
        advertise("*** Go in the #" + sys.channel(self.channel) + " channel and type /join or !join to enter the tournament! ***");
        broadcast("***Type /join or !join to enter the tournament! ***");
        wall(border);
        /* flash players */
        if (self.main) {
            var playerson = sys.playerIds();
            for (var x = 0; x < playerson.length; ++x) {
                var id = playerson[x];
                var poUser = SESSION.users(id);
                if (sys.loggedIn(id) && poUser && poUser.tiers && poUser.tiers.indexOf(self.tier) != -1) {
                    if(sys.isInChannel(id, self.channel)) {
                        sys.sendHtmlMessage(playerson[x], "A "+ self.tier+" tournament is starting, " + sys.name(playerson[x]) +"<ping/>!", self.channel);
                        continue;
                    } else if(sys.isInChannel(id, 0)) {
                        sys.sendHtmlMessage(playerson[x], "A "+ self.tier+" tournament is starting, " + sys.name(playerson[x]) +"<ping/>!",0);
                        continue;
                    }
                    sys.sendHtmlMessage(id, "A "+ self.tier+" tournament is starting, " + sys.name(playerson[x]) +"<ping/>!");
                }
            }
        }
        self.running = true;
        self.phase = "entry";
        self.round = 0;

        self.entrants = {};
        self.members = [];
        self.starttime = Date.now();
    }

    // command viewqueue
    function viewQueue(source) {
        if (self.queue.length > 0) {
            sendPM(source, "Following tournaments are in the queue: " +
                self.queue.map(function(e) {
                    return e.starter + " added tier '" + e.tier + "' "+(e.mode != modeOfTier(e.tier) ? "("+e.mode+")" : "")+"with initial count " + e.count;
                }).join(", "));
        } else {
            sendPM(source, "The tournament queue is empty.");
        }
    }

    // command queue
    function queue(source, data) {

        var res = parseTierAndCount(source, data);

        if (!res) return;

        var QUEUE_MAX_SIZE = 3;
        if (self.queue.length > QUEUE_MAX_SIZE) {
            sendPM(source, "Sorry, we already have " + QUEUE_MAX_SIZE + " tournaments in the queue.");
            return;
        }
        for (var i = 0, l = self.queue.length; i < l; ++i) {
            if (self.queue[i].tier == res.tier) {
                sendPM(source, "We already have that tier in the queue.");
                return;
            }
        }

        self.queue.push(res);

        broadcast(res.starter + " added a new tier to the queue!");

        scheduleTournamentFromQueue();
    }

    function rmQueue(source, data) {
        var tier = findTier(data);
        if (tier === null) {
            sendPM(source, "Sorry, " + data + " is not a tier.");
            return;
        }

        for (var i = 0, l = self.queue.length; i < l; ++i) {
            if (self.queue[i].tier == tier) {
                self.queue.splice(i,1);
                sendPM(source, "One tier removed from the queue.");
                return;
            }
        }
        sendPM(source, "That tier is not in the queue.");
    }

    function isInTour(name) {
        return (name || "").toLowerCase() in self.entrants;
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

    function findPlaceholder() {
        var placeholder = null;
        for (var p in self.entrants) {
            if (isPlaceholder(p)) {
                placeholder = self.entrants[p];
                break;
            }
        }
        return placeholder;
    }
    
    function isPlaceholder(p) {
        return (/~/).test(p);
    }

    // Command join
    function join(source) {
        if (self.phase != "entry") {
            subme(source);
            //sendPM(source, "The tournament is not in signup phase at the moment");
            return;
        }

        var name = sys.name(source);

        if (isInTour(name)) {
            sendPM(source, "You already joined the tournament!");
            return;
        }
        if (self.ips.indexOf(sys.ip(source)) != -1) {
            sendPM(source, "You already joined the tournament!");
            return;
        }

        if (!sys.hasTier(source, self.tier)){
            sendPM(source, "You are currently not battling in the " + self.tier + " tier. Change your tier to " + self.tier + " to be able to join.");
            return;
        }

        self.ips.push(sys.ip(source));
        addEntrant(name);
        broadcast("~~Server~~: " + name + " joined the tournament! " + remainingEntrants()  + " more spot(s) left!");

        if (remainingEntrants() > 0 && remainingEntrants() <= self.count/8) {
            // Give time 20 seconds plus 5 seconds per slot for "fast signups"
            if ((Date.now() - self.startTime)/1000 < 40 + self.count*5) {
                self.count = Math.pow(2, Math.floor(Math.log(self.count)/Math.log(2))+1);
                broadcast("~~Server~~: This tournament is now open for " + self.count + " players!");
            } else {
                while (remainingEntrants() > 0) {
                    name = freeSub();
                    addEntrant(name);
                }
                broadcast("~~Server~~: Substitutes were added and the tournament was started!");
            }
        }

        if (remainingEntrants() === 0) {
            startTournament();
        }
    }
    // Command subme
    function subme(source) {
        if (!playingPhase()) {
            sendPM(source, "Wait until a tournament starts!");
            return;
        }

        if (isInTour(sys.name(source))) {
            sendPM(source, "You already joined the tournament!");
            return;
        }

        if (self.ips.indexOf(sys.ip(source)) != -1) {
            sendPM(source, "You already joined the tournament!");
            return;
        }
        
        if (self.round != 1) {
            sendPM(source, "Subs are only open in round 1!");
            return;
        }

        if (!sys.hasTier(source, self.tier)){
            sendPM(source, "You are currently not battling in the " + self.tier + " tier. Change your tier to " + self.tier + " to be able to join.");
            return;
        }

        if (typeof SESSION.users(source).battles === "object" && Object.keys(SESSION.users(source).battles).length > 0) {
            sendPM(source, "You can not sub in if you are battling!");
            return;
        }

        var placeholder = findPlaceholder();
        var players = [sys.name(source), placeholder];
        if (placeholder) {
            self.ips.push(sys.ip(source));
            broadcast("~~Server~~: " + players[0] + " joined the tournament! (bye " + players[1] + "!)");
            switchPlayers(players);
        } else {
            sendPM(source, "No more placeholders!");
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
            if (self.phase == "entry"|| self.members.indexOf(name.toLowerCase()) >= 0) {
                removeEntrant(name);
                broadcast("~~Server~~: " + name + " left the tournament!");
                var ind = self.ips.indexOf(sys.ip(source));
                if (ind != -1)
                    self.ips.splice(ind, 1);
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

        var i;
        if (self.battlesLost.length > 0) {
            sendPM(source, "", false);
            sendPM(source, "*** Battles finished ***", false);
            sendPM(source, "", false);
            for (i = 0; i < self.battlesLost.length; i+= 2) {
                sendPM(source, self.battlesLost[i] + " won against " + self.battlesLost[i+1], false);
            }
            sendPM(source, "", false);
        }

        if (self.battlers.length > 0) {
            if (self.battlesStarted.indexOf(true) != -1) {
                sendPM(source, "", false);
                sendPM(source, "*** Ongoing battles ***", false);
                sendPM(source, "", false);
                for (i = 0; i < self.battlers.length; i+=2) {
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
                for (i = 0; i < self.battlers.length; i+=2) {
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
            for (i = 0; i < self.members.length; ++i) {
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
                var ind = self.ips.indexOf(sys.ip(sys.id(name)));
                if (ind != -1)
                    self.ips.splice(ind, 1);
            } else if (playingPhase()) {
                broadcast("~~Server~~: " + name + " was removed from the tournament by " + authority + "!");
                endBattle(tourOpponent(name), name);
            }
        } else {
            sendPM(source, name + " is not in the tournament.");
        }
    }

    function freeSub(basename) {
        var name = basename === undefined ? "~Sub" : basename[0] == "~" ? basename : "~" + basename;
        if (!isInTour(name))
            return name;
        var i = 1;
        while (isInTour(name + i)) { ++i; }
        return name + i;
    }

    // Command push
    function push(source, name) {
        if (!self.running) {
            sendPM(source, "Wait till the tournament has started.");
            return;
        }

        var authority = sys.name(source);

        name = freeSub(name);

        addEntrant(name);
        if (self.phase == "playing") {
            broadcast(name + " was added to the tournament by " + sys.name(source) + ".");
        } else if (self.phase == "entry") {
            broadcast(name + " was added to the tournament by " + sys.name(source) + ". " + remainingEntrants() + " more spot(s) left!");

            if (remainingEntrants() === 0) {
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
            sendPM(source, name + " is not battling.");
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
        switchPlayers(players);
    }

    function switchPlayers(players) {
        var p1 = players[0].toLowerCase();
        var p2 = players[1].toLowerCase();

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

    }

    // Command changeCount
    function changeCount(source, data) {
        if (self.phase != "entry") {
            sendPM(source, "Can only change count during signups.");
            return;
        }

        var count = parseInt(data, 10);

        if (isNaN(count) || count <= 2 || count > 256){
            sendPM(source, "You must specify a tournament size of 3 or more (and not more than 256 players).");
            return;
        }

        if (count < memberCount()) {
            sendPM(source, "There are more than that people registered");
            return;
        }

        self.count = count;

        broadcast("");
        broadcast(border);
        broadcast("~~Server~~: " + sys.name(source) + " changed the number of entrants to " + count + "!");
        broadcast(border);
        broadcast("");

        if (remainingEntrants() === 0) {
            startTournament();
        }
    }
    
    // Returns whether the default tier of a mode is singles, doubles or triples
    
    function modeOfTier(tier) {
        if (tier.indexOf("Doubles") != -1 || ["JAA", "VGC 2009", "VGC 2010", "VGC 2011", "VGC 2012"].indexOf(tier) != -1) {
            return "Doubles";
        }
        else if (tier.indexOf("Triples") != -1) {
            return "Triples";
        }
        return "Singles";
    }

    function endTour(source, data) {
        if (self.running) {
            resetTourVars();
            broadcast("");
            broadcast(border);
            broadcast("~~Server~~: The tournament was cancelled by " + sys.name(source) + "!");
            broadcast(border);
            broadcast("");
            
            scheduleTournamentFromQueue();
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
        if (name === undefined) name = "~Unknown~";
        var index = self.battlers.indexOf(toString(name.toLowerCase()));
        if (index === -1) return false;
        return self.battlesStarted[Math.floor(index / 2)];
    }

    function pingAuth() {
        var p = sys.playersOfChannel(self.channel);
        for (var i = 0; i < p.length; ++i) {
            var id = p[i];
            if (self.main && sys.auth(id) > 0 || SESSION.channels(self.channel).isChannelOperator(id)) {
                sys.sendHtmlMessage(id, "±Tourneybot: There are unstarted matches!<ping />" ,self.channel);
                
            }
        }
    }

    function getUnstarted() {
        var ret = [];
        for (var i = 0; i < self.battlers.length; i+=2) {
            if (!isBattling(i)) {
                ret.push(self.battlers[i]);
                ret.push(self.battlers[i+1]);
            }
        }
        return ret;
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
        else if ((index % 2) === 0)
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
                var noPoints = cmp(winner,self.starter) && sys.auth(sys.id(winner)) === 0;
                require("tourstats.js").updateTourStats(tier, time, winner, num, noPoints);
            }
            resetTourVars();

            scheduleTournamentFromQueue();
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
            advertise("*** Go to #" + sys.channel(self.channel) + " channel to spectate them! ***");
            wall("");
        }

        var i = 0;
        var indices = function(v,i) { return i; };
        var subFilter = function(i) { return isPlaceholder(self.members[i]); };
        var playerFilter = function(i) { return !isPlaceholder(self.members[i]); };
        while (self.members.length >= 2) {
            i += 1;

            // Select random player if we still have them
            var playerIndices = self.members.map(indices).filter(playerFilter);
            var x1 = playerIndices.length > 0 ? playerIndices[sys.rand(0, playerIndices.length)] : sys.rand(0, self.members.length);
            self.battlers.push(self.members[x1]);
            var name1 = casedName(self.members[x1]);
            self.members.splice(x1,1);

            // Select random sub if we still have them
            var subIndices = self.members.map(indices).filter(subFilter);
            x1 = subIndices.length > 0 ? subIndices[sys.rand(0, subIndices.length)] : sys.rand(0, self.members.length);
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

        var current_round = self.round;
        sys.delayedCall(function RemoveInactiveAndSubs() {
            if (self.running && self.round == current_round) {
                var placeholder;
                while (null !== (placeholder = findPlaceholder())) {
                    setBattleStarted(placeholder);
                    endBattle(tourOpponent(placeholder), placeholder);
                    broadcast("~~Server~~: " + placeholder + " was removed from the tournament!");
                }
                var unstarted = getUnstarted();
                for (var i = 0; i < unstarted; i+=2) {
                    var online = [sys.id(unstarted[i]) !== undefined, sys.id(unstarted[i+1]) !== undefined];
                    if (online[0] && online[1]) {
                        broadcast("~~Server~~: There is a problem with the " + self.tier + " match between " + unstarted[i] + " and " + unstarted[i+1] +". Please resolve it.");
                        pingAuth();
                    } else if (!online[0] && !online[1]) {
                        broadcast("~~Server~~: Both " + unstarted[i] + " and " + unstarted[i+1] +" are offline. Please resolve.");
                        pingAuth();
                    } else {
                        var loser = !online[0] ? unstarted[i] : unstarted[i+1];
                        var winner = online[0] ? unstarted[i] : unstarted[i+1];
                        setBattleStarted(loser);
                        endBattle(winner, loser);
                        broadcast("~~Server~~: " + loser + " was removed from the tournament for being offline!");
                    }
                }
            }
        }, 240);
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
            return;
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

        if (self.battlers.length !== 0 || self.members.length > 1) {
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
    function beforeChallenge(source, dest, clauses, rated, mode, team, destTier) {
        if (!playingPhase())
            return;
        if (!sys.isInChannel(source, self.channel) || !sys.isInChannel(dest, self.channel)) {
            return;
        }
        var name1 = sys.name(source),
            name2 = sys.name(dest);
        if (isInTour(name1)) {
            if (!areOpponents(name1, name2)) {
                sendPM(source, "This guy isn't your opponent in the tourney.");
                return true;
            }
            var srcTier = sys.tier(source, team);
            if (srcTier != destTier || !cmp(srcTier, self.tier)) {
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
            if ((self.mode == "Singles" && mode !== 0) || (self.mode == "Doubles" && mode != 1) || (self.mode == "Triples" && mode != 2)) {
                sendPM(source, "Your match must be played in "+self.mode+" format. Change it in the challenge window.");
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
        if (!sys.isInChannel(source, self.channel) || !sys.isInChannel(dest, self.channel)) {
            return;
        }
        // return true if one of the players is in tournament
        // will stop the FindBattle match
        return playingPhase() && (isInTour(sys.name(source)) || isInTour(sys.name(dest)));
    }

    function afterChannelJoin(source, channel) {
        if (self.phase == "entry") {
            sys.sendMessage(source,"*** A " + self.tier + " tournament is in its signup phase, " + remainingEntrants() + " spot(s) are left!",channel);
            sys.sendMessage(source, "", channel);
            sys.sendMessage(source, border, channel);
            sys.sendMessage(source, "", channel);
        } else if (playingPhase()) {
            viewround(source);
        }
    }

    function scheduleTournamentFromQueue() {
        if (self.queue.length === 0) {
            return;
        }

        sys.delayedCall(function() {
            if (!self.running) {
                var tour = self.queue.shift();
                if (tour) {
                    initTournament(tour.starter, tour.tier, tour.count, tour.mode);
                }
            }
        }, 120);
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
        self.ips = [];
        self.queue = self.queue || [];
        self.mode = "";
    }
    this.commands = {
        join: join,
        unjoin: unjoin,
        viewround: viewround,
        viewqueue: viewQueue,
        subme: subme
    };
    this.authCommands = {
        tour: start,
        queue: queue,
        rmqueue: rmQueue,
        dq: dq,
        push: push,
        cancelbattle: cancelBattle,
        sub: sub,
        changecount: changeCount,
        endtour: endTour
    };
    this.events = {
        afterBattleStarted: battleStart,
        afterBattleEnded: battleEnd,
        beforeChallengeIssued: beforeChallenge,
        beforeBattleMatchup: battleMatchup,
        afterChannelJoin: afterChannelJoin
    };
}

module.tournaments = {};

module.exports = {
    init: function() {
        /* use SESSION.global() to save data across script reloads*/
        if (!SESSION.global().hasOwnProperty("tournamentData"))
            SESSION.global().tournamentData = {};
        tournamentData = SESSION.global().tournamentData;

        if (!SESSION.global().hasOwnProperty("permaTours")) {
            SESSION.global().permaTours = [];
            try {
            SESSION.global().permaTours = JSON.parse(sys.getVal("tournaments*permaTours")) || [];
            } catch(e) { }
        }
        permaTours = SESSION.global().permaTours;

        var tourchannel, channelname = "Tournaments";
        if (sys.existChannel(channelname)) {
            tourchannel = sys.channelId(channelname);
        } else {
            tourchannel = sys.createChannel(channelname);
        }

        module.tourchannel = tourchannel;

        // Do not reinitialize - in case init is called many times
        if (module.tournaments[tourchannel])
            return;

        for (var i = 0; i < permaTours.length; ++i) {
            if (sys.channel(permaTours[i]) !== undefined) {
                var tournament = new Tournament(permaTours[i]);
                //tournament.announceInit();
                module.tournaments[permaTours[i]] = tournament;
            }
        }
        /*TODO: afterChannelDestroyed delete from SESSION*/
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

        function sendTourBotMsg(playerId, message, channelId) {
            sys.sendMessage(playerId, "±" + Config.tourneybot + ": " + message, channelId);
        }
        
        if (module.tournaments[channel] !== undefined) {
            if (command in module.tournaments[channel].commands) {
                module.tournaments[channel].commands[command](source, commandData);
                return true;
            } else if (command in module.tournaments[channel].authCommands) {
                var isChanOp = SESSION.channels(channel).isChannelOperator && SESSION.channels(channel).isChannelOperator(source);
                if (sys.auth(source) === 0 && !SESSION.users(source).megauser && !isChanOp) {
                    sys.sendMessage(source, "Sorry, you do not have access to this Tournament command.");
                    return true;
                }
                module.tournaments[channel].authCommands[command](source, commandData);
                return true;
            }
        }
        if (command == "disabletours" && (sys.auth(source) >= 2 || SESSION.channels(channel).isChannelAdmin(source))) {
            if (module.tournaments[channel] !== undefined) {
                delete module.tournaments[channel];
                tourneybot.sendAll(sys.name(source) + " disabled Tournaments in this channel!", channel);
                var ind = SESSION.global().permaTours.indexOf(channel);
                if (ind >= 0) {
                    SESSION.global().permaTours.splice(ind, 1);
                }
                return true;
            } else {
                sendTourBotMsg(source, "Tournaments are already disabled in " + sys.channel(channel), channel);
                return true;
            }
        }
        if (command == "enabletours" && (sys.auth(source) >= 2 || SESSION.channels(channel).isChannelAdmin(source))) {
            if (module.tournaments[channel] === undefined) {
                module.tournaments[channel] = new Tournament(channel);
                tourneybot.sendAll(sys.name(source) + " enabled Tournaments in this channel!", channel);
                SESSION.global().permaTours.push(channel);
                sys.saveVal("tournaments*permaTours", JSON.stringify(SESSION.global().permaTours));
                return true;
            } else {
                sendTourBotMsg(source, "Tournaments are already enabled in " + sys.channel(channel), channel);
                return true;
            }
        }
        return false;
    },

    afterChannelJoin : function(source, channel) {
        if (module.tournaments[channel] !== undefined) {
            module.tournaments[channel].events.afterChannelJoin(source, channel);
        }
    },

    afterBattleStarted : function(source, dest, clauses, rated, mode, bid) {
        for (var channel in module.tournaments) {
            module.tournaments[channel].events.afterBattleStarted(source, dest, clauses, rated, mode, bid);
        }
    },

    afterBattleEnded : function(source, dest, desc) {
        if (desc == "tie")
            return;
        for (var channel in module.tournaments) {
            module.tournaments[channel].events.afterBattleEnded(source, dest, desc);
        }
    },

    beforeChallengeIssued : function(source, dest, clauses, rated, mode, team, destTier) {
        var ret = false;
        for (var channel in module.tournaments) {
            ret |= module.tournaments[channel].events.beforeChallengeIssued(source, dest, clauses, rated, mode, team, destTier);
        }
        return ret;
    },

    beforeBattleMatchup : function(source, dest, clauses, rated) {
        var ret = false;
        for (var channel in module.tournaments) {
            ret |= module.tournaments[channel].events.beforeBattleMatchup(source, dest, clauses, rated);
        }
        return ret;
    }
};
