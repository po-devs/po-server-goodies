// This is the official Pokemon Online Scripts
// These scripts will only work on 1.0.23 or newer.

/* To avoid a load of warning for new users of the script,
        create all the files that will be read further on*/
var cleanFile = function(filename) {
    if (typeof sys != 'undefined')
        sys.appendToFile(filename, "");
};
cleanFile("mafia_stats.json");
cleanFile("suspectvoting.json");
cleanFile("wfbset.json");
cleanFile("mafiathemes/metadata.json");
cleanFile("channelData.json");
cleanFile("mutes.txt");
cleanFile("mbans.txt");
cleanFile("smutes.txt");
cleanFile("rangebans.txt");
cleanFile("contributors.txt");
cleanFile("pastebin_user_key");

// You may change these variables as long as you keep the same type
var Config = {
    bot: "Dratini",
    kickbot: "Blaziken",
    capsbot: "Exploud",
    channelbot: "Chatot",
    checkbot: "Snorlax",
    coinbot: "Meowth",
    countbot: "CountBot",
    tourneybot: "Typhlosion",
    rankingbot: "Porygon",
    battlebot: "Blastoise",
    commandbot: "CommandBot",
    querybot: "QueryBot",
    Mafia: {
        bot: "Murkrow",
        norepeat: 6,
        stats_file: "mafia_stats.json",
        max_name_length: 14,
        notPlayingMsg: "±Game: The game is in progress. Please type /join to join the next mafia game."
    },
    League: [
        ["M Dragon", "Elite Four"],
        ["Jedgi", "Elite Four"],
        ["Amarillo Caballero", "Elite Four"],
        ["Deria", "Elite Four"],
        ["mibuchiha", "5th Generation WiFi Ubers"],
        ["IFM", "5th Generation WiFi OverUsed"],
        ["1996ITO", "5th Generation Dream World OverUsed"],
        ["Stofil", "5th Generation LittleUsed Gym"],
        ["Psykout22", "5th Generation WiFi Little Cup"],
        ["Marmoteo", "5th Generation OU Triples"],
        ["ZIAH", "5th Generation Monotype"],
        ["Manaphy", "4th Generation Ubers"],
        ["Fakes", "4th Generation OverUsed"],
        ["HSOWA", "4th Generation NeverUsed"],
        ["CALLOUS", "3rd Generation OverUsed"],
        ["Jorgen", "2nd Generation OverUsed"],
        ["Platinum", "Mixed Generation Challenge Cup"]
    ],
    DreamWorldTiers: ["DW OU", "DW Ubers", "DW LC", "Monotype", "DW UU", "DW LU", "DW 1v1", "Challenge Cup" , "CC 1v1", "DW Uber Triples", "DW OU Triples", "DW Uber Doubles", "DW OU Doubles", "Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST", "Monocolour", "Clear Skies DW"],
    superAdmins: ["Lamperi", "Professor Oak", "zeroality", "[LD]Jirachier", "nixeagle"],
    canJoinStaffChannel: ["Lamperi-", "Peanutsdroid"],
    disallowStaffChannel: [],
}

// Don't touch anything here if you don't know what you do.

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

var noPlayer = '*';
var mafia = new function() {
    // Remember to update this if you are updating mafia
    // Otherwise mafia game won't get reloaded
    this.version = "2012-01-07.2";

    var CurrentGame;
    var PreviousGames;
    var MAFIA_SAVE_FILE = Config.Mafia.stats_file;

    var savePlayedGames = function() {
        sys.writeToFile(MAFIA_SAVE_FILE, JSON.stringify(PreviousGames));
    }
    var loadPlayedGames = function() {
        try {
            PreviousGames = JSON.parse(sys.getFileContent(MAFIA_SAVE_FILE));
        } catch(e) {
            PreviousGames = [];
        }
    }
    loadPlayedGames();

    var defaultTheme = {
      name: "default",
      sides: [
        { "side": "mafia", "translation": "Mafia"
        },
        { "side": "mafia1", "translation": "French Canadian Mafia"
        },
        { "side": "mafia2", "translation": "Italian Mafia"
        },
        { "side": "village", "translation": "Good people"
        },
        { "side": "werewolf", "translation": "WereWolf"
        },
        { "side": "godfather", "translation": "Godfather"
        }
      ],
      roles: [{
          "role": "villager",
          "translation": "Villager",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": {}
      }, {
          "role": "inspector",
          "translation": "Inspector",
          "side": "village",
          "help": "Type /Inspect [name] to find his/her identity!",
          "actions": { "night": {"inspect": {"target": "AnyButSelf", "common": "Self", "priority": 30} } }
      }, {
          "role": "bodyguard",
          "translation": "Bodyguard",
          "side": "village",
          "help": "Type /Protect [name] to protect someone!",
          "actions": { "night": {"protect": {"target": "AnyButSelf", "common": "Role", "priority": 5, "broadcast": "role"} },
                       "startup": "role-reveal"}
      }, {
          "role": "mafia",
          "translation": "Mafia",
          "side": "mafia",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team"} },
                       "startup": "team-reveal"}
      }, {
          "role": "werewolf",
          "translation": "WereWolf",
          "side": "werewolf",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButSelf", "common": "Self", "priority": 10} },
                       "distract": {"mode": "ChangeTarget", "hookermsg": "You tried to distract the Werewolf (what an idea, srsly), you were ravishly devoured, yum!", "msg": "The ~Distracter~ came to you last night! You devoured her instead!"},
                       "avoidHax": ["kill"] }
      }, {
          "role": "hooker",
          "translation": "Pretty Lady",
          "side": "village",
          "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!",
          "actions": { "night": {"distract": {"target": "AnyButSelf", "common": "Self", "priority": 1} } }
      }, {
          "role": "mayor",
          "translation": "Mayor",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day! (your vote counts as 2)",
          "actions": { "vote": 2 }
      }, {
          "role": "spy",
          "translation": "Spy",
          "side": "village",
          "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!",
          "actions": { "hax": {"kill": { "revealTeam": 0.33, "revealPlayer": 0.1} } }
      }, {
          "role": "godfather",
          "translation": "Godfather",
          "side": "godfather",
          "help": "Type /Kill [name] to kill someone! You can kill 2 targets, Type /kill [name2] again to select your second target!",
          "actions": { "night": {"kill": {"target": "AnyButSelf", "common": "Self", "priority": 20, "limit": 2} },
                       "distract": {"mode": "ChangeTarget", "hookermsg": "You tried to seduce the Godfather... you were killed instead!", "msg": "The ~Distracter~ came to you last night! You killed her instead!"},
                       "avoidHax": ["kill"] }
      }, {
          "role": "vigilante",
          "translation": "Vigilante",
          "side": "village",
          "help": "Type /Kill [name] to kill someone!(dont kill the good people!)",
          "actions": { "night": {"kill": {"target": "AnyButSelf", "common": "Self", "priority": 19} } }
      }, {
          "role": "mafia1",
          "translation": "French Canadian Mafia",
          "side": "mafia1",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team"} },
                       "startup": "team-reveal"}
      }, {
          "role": "mafia2",
          "translation": "Italian Mafia",
          "side": "mafia2",
          "help": "Type /Kill [name] to kill someone!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team"} },
                       "startup": "team-reveal"}
      }, {
          "role": "conspirator1",
          "translation": "French Canadian Conspirator",
          "side": "mafia1",
          "help": "You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "villager"},
                       "startup": "team-reveal"}
      }, {
          "role": "conspirator2",
          "translation": "Italian Conspirator",
          "side": "mafia2",
          "help": "You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "villager"},
                       "startup": "team-reveal"}
      }, {
          "role": "mafiaboss1",
          "translation": "Don French Canadian Mafia",
          "side": "mafia1",
          "help": "Type /Kill [name] to kill someone! You can't be distracted!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 12, "broadcast": "team"} },
                      "distract": {"mode": "ignore"},
                      "startup": "team-reveal"}
      }, {
          "role": "mafiaboss2",
          "translation": "Don Italian Mafia",
          "side": "mafia2",
          "help": "Type /Kill [name] to kill someone! You can't be distracted!",
          "actions": { "night": {"kill": {"target": "AnyButTeam", "common": "Team", "priority": 11, "broadcast": "team"} },
                      "distract": {"mode": "ignore"},
                      "startup": "team-reveal"}
      }, {
          "role": "samurai",
          "translation": "Samurai",
          "side": "village",
          "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people.",
          "actions": { "standby": {"kill": {"target": "AnyButSelf", "msg": "You can kill now using /kill [name] :",
                                   "killmsg": "~Self~ pulls out a sword and strikes it through ~Target~'s chest!"} } }
      }, {
          "role": "miller",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day! Oh, and insp sees you as Mafia",
          "actions": { "inspect": {"revealAs": "mafia"} }
      }, {
          "role": "truemiller",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "mafia"}, "lynch": {"revealAs": "mafia"}, "startup": {"revealAs": "villager"}, "onlist": "mafia" }
      }, {
          "role": "miller1",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "mafia1"}, "lynch": {"revealAs": "mafia1"}, "startup": {"revealAs": "villager"}, "onlist": "mafia2" }
      }, {
          "role": "miller2",
          "translation": "Miller",
          "side": "village",
          "help": "You dont have any special commands during the night! Vote to remove people in the day!",
          "actions": { "inspect": {"revealAs": "mafia2"}, "lynch": {"revealAs": "mafia2"}, "startup": {"revealAs": "villager"}, "onlist": "mafia1" }
      }],
      roles1: ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "truemiller",
               "villager", "mafia", "villager", "mayor"],
      roles2: ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2",
               "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "villager",
               "miller1", "miller2", "mafiaboss1", "villager", "vigilante", "villager", "godfather",
               "mafiaboss2", "samurai", "villager", "villager", "werewolf", "mafia1",
               "mafia2", "bodyguard"],
      villageCantLoseRoles: ["mayor", "vigilante", "samurai"]
    };

    // Street Fighter is on a break.
    var sfTheme = {"name":"Street Fighter IV","sides":[{"side":"mafia","translation":"Gen's"},{"side":"mafia1","translation":"Juri's"},{"side":"mafia2","translation":"Evil Ryu's"},{"side":"village","translation":"Good people"},{"side":"werewolf","translation":"Akuma"},{"side":"godfather","translation":"M.Bison"}],"roles":[{"role":"villager","translation":"Dan","side":"village","help":"You dont have any special commands during the night! Vote to remove people in the day!","actions":{}},{"role":"inspector","translation":"Chun-Li","side":"village","help":"Type /Inspect [name] to find his/her identity!","actions":{"night":{"inspect":{"target":"AnyButSelf","common":"Self","priority":30}}}},{"role":"bodyguard","translation":"Rufus","side":"village","help":"Type /Protect [name] to protect someone!","actions":{"night":{"protect":{"target":"AnyButSelf","common":"Role","priority":5,"broadcast":"role"}},"startup":"role-reveal"}},{"role":"mafia","translation":"Gen","side":"mafia","help":"Type /Kill [name] to kill someone!","actions":{"night":{"kill":{"target":"AnyButTeam","common":"Team","priority":11,"broadcast":"team"}},"startup":"team-reveal"}},{"role":"werewolf","translation":"Akuma","side":"werewolf","help":"Type /Kill [name] to kill someone!","actions":{"night":{"kill":{"target":"AnyButSelf","common":"Self","priority":10}},"distract":{"mode":"ChangeTarget","hookermsg":"You tried to distract AKUMA! (what an idea, srsly), you were killed with a lot of violence o.o !","msg":"The ~Distracter~ came to you last night! You devoured her instead !"},"avoidHax":["kill"]}},{"role":"hooker","translation":"Candy","side":"village","help":"Type /Distract [name] to distract someone! Vote to remove people in the day!","actions":{"night":{"distract":{"target":"AnyButSelf","common":"Self","priority":1}}}},{"role":"mayor","translation":"Ryu","side":"village","help":"You dont have any special commands during the night! Vote to remove people in the day! (your vote counts as 2)","actions":{"vote":2}},{"role":"spy","translation":"C.Viper","side":"village","help":"You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!","actions":{"hax":{"kill":{"revealTeam":0.33,"revealPlayer":0.1}}}},{"role":"godfather","translation":"M.Bison","side":"godfather","help":"Type /Kill [name] to kill someone! You can kill 2 targets, Type /kill [name2] again to select your second target!","actions":{"night":{"kill":{"target":"AnyButSelf","common":"Self","priority":20,"limit":2}},"distract":{"mode":"ChangeTarget","hookermsg":"You tried to seduce M.Bison, you just were killed!","msg":"The ~Distracter~ came to you last night! You killed her instead!"},"avoidHax":["kill"]}},{"role":"vigilante","translation":"Dhalsim","side":"village","help":"Type /Kill [name] to kill someone!(dont kill the good people!)","actions":{"night":{"kill":{"target":"AnyButSelf","common":"Self","priority":19}}}},{"role":"mafia1","translation":"Juri","side":"mafia1","help":"Type /Kill [name] to kill someone!","actions":{"night":{"kill":{"target":"AnyButTeam","common":"Team","priority":12,"broadcast":"team"}},"startup":"team-reveal"}},{"role":"mafia2","translation":"Evil Ryu","side":"mafia2","help":"Type /Kill [name] to kill someone!","actions":{"night":{"kill":{"target":"AnyButTeam","common":"Team","priority":11,"broadcast":"team"}},"startup":"team-reveal"}},{"role":"conspirator1","translation":"French Canadian Conspirator","side":"mafia1","help":"You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!","actions":{"inspect":{"revealAs":"villager"},"startup":"team-reveal"}},{"role":"conspirator2","translation":"Italian Conspirator","side":"mafia2","help":"You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!","actions":{"inspect":{"revealAs":"villager"},"startup":"team-reveal"}},{"role":"mafiaboss1","translation":"Don Juri's boss","side":"mafia1","help":"Type /Kill [name] to kill someone! You can't be distracted!","actions":{"night":{"kill":{"target":"AnyButTeam","common":"Team","priority":12,"broadcast":"team"}},"distract":{"mode":"ignore"},"startup":"team-reveal"}},{"role":"mafiaboss2","translation":"Don Evil Ryu's boss","side":"mafia2","help":"Type /Kill [name] to kill someone! You can't be distracted!","actions":{"night":{"kill":{"target":"AnyButTeam","common":"Team","priority":11,"broadcast":"team"}},"distract":{"mode":"ignore"},"startup":"team-reveal"}},{"role":"samurai","translation":"Fei Long","side":"village","help":"Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people.","actions":{"standby":{"kill":{"target":"AnyButSelf","msg":"You can kill now using /kill [name] :","killmsg":"~Self~ pulls out a sword and strikes it through ~Target~'s chest!"}}}},{"role":"miller","translation":"Lolrole","side":"village","help":"You dont have any special commands during the night! Vote to remove people in the day! Oh, and insp sees you as Mafia","actions":{"inspect":{"revealAs":"mafia"}}}],"roles1":["bodyguard","mafia","inspector","werewolf","hooker","villager","mafia","villager","miller","villager","mayor"],"roles2":["bodyguard","mafia1","mafia1","inspector","hooker","villager","mafia2","mafia2","villager","villager","villager","mayor","villager","spy","villager","villager","villager","mafiaboss1","villager","vigilante","villager","godfather","mafiaboss2","samurai","villager","villager","werewolf","mafia1","mafia2","bodyguard"],"villageCantLoseRoles":["mayor","vigilante","samurai"]};

    var hpTheme = {"villageCantLoseRoles": ["mayor", "hooker", "samurai"], "name": "Harry Potter", "roles": [{"translation": "Muggle", "role": "villager", "side": "village", "actions": {}, "help": "You have no magical powers, so all you can do is vote to remove people in the day!"}, {"translation": "Harry Potter", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Inspect [name] to cast a spell to figure out a person\'s role!"}, {"translation": "Hagrid", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "Type /Protect [name] to protect someone, you large oaf you!"}, {"translation": "Snape", "role": "werewolf", "side": "werewolf", "actions": {"vote": 2, "avoidHax": ["kill"], "kill": {"mode": "ignore"}, "distract": {"msg": "The ~Distracter~ came to you last night! You killed the fool.", "mode": "ChangeTarget", "hookermsg": "You tried to distract Severus Snape (what an idea, srsly), and were promptly killed, sorry!"}}, "help": "You can not be killed at night. Your vote counts as two during the day, and you are immune to the charms of the Pretty Lady.  You are all alone in the world!"}, {"translation": "Hermione Granger", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Distract [name] at night to Stupify them! Vote to remove people in the day!"}, {"translation": "Dumbledore", "role": "mayor", "side": "village", "actions": {"vote": 3}, "help": "You dont have any special commands during the night. Pull your rank during the day, as your votes count as three. "}, {"translation": "Argus Filch", "role": "spy", "side": "village", "actions": {"hax": {"kill": {"revealPlayer": 0.14999999999999999, "revealTeam": 0.40000000000000002}}}, "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day. Being superbly creepy, you can a bonus to detection over normal spies."}, {"translation": "Fred Weasley", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] at night to dispose of someone!"}, {"translation": "George Weasley", "role": "mafia1.5", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] at night to dispose of someone!"}, {"translation": "Momma Weasley", "role": "mafia1.6", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "Type /Kill [name] at night to dispose of someone!  You are working with Fred and George (Not Ron), and you can protect one of the two per night."}, {"translation": "Death Eater", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Head Death Eater", "role": "mafia2.5", "side": "mafia2", "actions": {"vote": -1, "inspect": {"revealAs": "villager"}, "startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!  You are seen to the inspector as a Muggle.  Your vote counts as -1.  Use it to save your fellow Death Eaters!"}, {"translation": "Auror", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ whips out his wand and points it at ~Target~, causing ~Target~ to drop dead!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people."}, {"translation": "Voldemort", "role": "evilsamurai", "side": "mafia2", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "Voldemort casts Avada Kedavra, and ~Target~ falls to the ground dead!", "target": "AnyButSelf"}}, "startup": "team-reveal"}, "help": "Type /Kill [name] during the day phase to kill someone! You may only kill once per day, but you will not be revealed.  You are allied with the Death Eaters."}, {"translation": "Nearly Headless Nick", "role": "miller", "side": "village", "actions": {"inspect": {"revealAs": "mafia1"}}, "help": "You dont have any special commands during the night! Unfortunately, though, people are afraid of your flopping head and so the Inspector sees you as evil."}, {"translation": "Peeves", "role": "miller1.5", "side": "village", "actions": {"inspect": {"revealAs": "mafia2"}}, "help": "You dont have any special commands during the night! Unfortunately, though, everyone hates you and so the Inspector sees you as evil."}, {"translation": "Draco Malfoy", "role": "mafia3", "side": "mafia3", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 2, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! Even the Bodyguard cannot stop you!"}, {"translation": "Lucius Malfoy", "role": "mafia3.5", "side": "mafia3", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 2, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! Even the Bodyguard cannot stop you!"}], "sides": [{"translation": "Weasley Brothers", "side": "mafia1"}, {"translation": "Death Eaters", "side": "mafia2"}, {"translation": "Malfoys", "side": "mafia3"}, {"translation": "Hogwarts", "side": "village"}, {"translation": "Snape", "side": "werewolf"}], "roles2": ["bodyguard", "mafia1", "mafia1.5", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "villager", "werewolf", "mayor", "evilsamurai", "spy", "samurai", "villager", "miller", "mafia1.6", "mafia2.5", "samurai", "villager", "villager", "miller1.5", "villager", "villager", "mafia3", "mafia3.5"], "roles1": ["bodyguard", "mafia1", "inspector", "mafia1.5", "hooker", "villager", "villager", "miller", "villager", "mayor"]};

    var potatoTheme = {"villageCantLoseRoles": ["mayor", "vigilante", "samurai"], "name": "Potato", "roles": [{"translation": "Potato", "role": "villager", "side": "village", "actions": {}, "help": "You are delicious victim. You dont have any special commands during the night! Vote to remove people in the day!"}, {"translation": "Mr. Potato", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Thanks to the fact you have eyes, you check out who is bad and who\'s good. Type /Inspect [name] to find his/her identity!"}, {"translation": "Ms. Potato", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "You are the lovely Mr. Potato wife. You love him so much, you can even protect him from dying. Thankfully, you can use this abilities on other people as well. Type /Protect [name] to protect someone!"}, {"translation": "Rabbit", "role": "mafia", "side": "mafia", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "You LOVE potatos. Type /Kill [name] to eat someone!"}, {"translation": "Mean Rabbit", "role": "werewolf", "side": "werewolf", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The French Fries came to you last night! You devoured her instead !", "mode": "ChangeTarget", "hookermsg": "You tried to distract the Mean Rabbit (what an idea, srsly), you were ravishly devoured, yum !"}, "night": {"kill": {"priority": 10, "target": "AnyButSelf", "common": "Self"}}}, "help": "You look like innocent rabbit, but you ADORE potatos. Type /kill to kill. If you see the delicous French Fries, you eat her instead."}, {"translation": "French Fries", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Thanks to your AMAZING tanning, you look like an adorable potato. Type /Distract [name] to distract someone! Vote to remove people in the day! Note: You are part of the good people - the potatos"}, {"translation": "Sweet Potato", "role": "mayor", "side": "village", "actions": {"vote": 4}, "help": "You have an amazing taste. Thanks to this, you can attract many people to vote with you off. You dont have any special commands during the night! Vote to remove people in the day! (your vote counts as 4)"}, {"translation": "Watermelon", "role": "godfather", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "You are the orange\'s biggest enemy. You are the only one to know that the orange role is a bad person, who the inspector sees as a French Fries. You must tell him that he is bad. But how? You are able to inspect people, to find out who is the orange. But make sure you are not confusing the real pl with the orange!"}, {"translation": "Orange", "role": "godfather1", "side": "godfather", "actions": {"inspect": {"revealAs": "hooker"}, "kill": {"mode": "ignore"}, "night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "You just look like a potato. however, your shell is really bitter. Thanks to this, you can\'t die. Your partner is the Mean deer(godfather). You must find him yourself, which may be hard. But don\'t worry, /inspect will help you doing the. when you get inspected you are seen as the French Fries (pl)"}, {"translation": "Mean Deer", "role": "godfather2", "side": "godfather1", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You killed her instead!", "mode": "ChangeTarget", "hookermsg": "You tried to seduce the Godfather, you just were killed!"}, "night": {"kill": {"priority": 20, "limit": 2, "target": "AnyButSelf", "common": "Self"}}}, "help": "You look like an innocent dear, but you are evil deer who likes potatos and rabbits. Type /Kill [name] to kill someone! You are able to kill 2 people a day. Your partner is the Orange. He don\'t know who you are and he don\'t know who he is. he can find you using his inspecting skills."}, {"translation": "outlaw", "role": "vigilante", "side": "village", "actions": {"night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}}}, "help": "You love the potatoes, but hate see them dying. You decide by your own to kill (/kill) someone each night, hoping it\'s a bad guy."}, {"translation": "French Rabbits", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "You LOVE potatoes. Type /Kill [name] to kill someone!"}, {"translation": "Italian Deers", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "You LOVE potatoes. Type /Kill [name] to kill someone!"}, {"translation": "French Rabbit Conspirator", "role": "conspirator1", "side": "mafia1", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You LOVE potatoes. You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!"}, {"translation": "Italian Deer Conspirator", "role": "conspirator2", "side": "mafia2", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You LOVE potatoes. You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!"}, {"translation": "Don French Rabbit Mafia", "role": "mafiaboss1", "side": "mafia1", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "You LOVE potatoes. Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Don Italian Deer Mafia", "role": "mafiaboss2", "side": "mafia2", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "You LOVE potatoes. Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Potato Cowboy", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ pulls out a sword and strikes it through ~Target~\'s chest!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people."}, {"translation": "Potato Sadface", "role": "miller", "side": "village", "actions": {"inspect": {"revealAs": "mafia"}, "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "and insp sees you as Mafia, However, you protect him."}], "sides": [{"translation": "Rabbit", "side": "mafia"}, {"translation": "French Rabbits", "side": "mafia1"}, {"translation": "Italian Deers", "side": "mafia2"}, {"translation": "Potatoes", "side": "village"}, {"translation": "Mean Rabbit", "side": "werewolf"}, {"translation": "Mean Deer", "side": "godfather"}], "roles2": ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "villager", "villager", "villager", "mafiaboss1", "villager", "vigilante", "villager", "godfather2", "godfather1", "godfather0", "mafiaboss2", "samurai", "villager", "villager", "werewolf", "mafia1", "mafia2", "bodyguard"], "roles1": ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "mafia", "villager", "miller", "villager", "mayor"]};

    var ssbbTheme = {"villageCantLoseRoles": ["mayor", "vigilante", "samurai", "samus"], "name": "SSBB", "roles": [{"translation": "Mario", "role": "villager", "side": "village", "actions": {}, "help": "You dont have any special commands during the night! Vote to remove people in the day!"}, {"translation": "Lucas", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Inspect [name] to find his/her identity!"}, {"translation": "Donkey Kong", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "Type /Protect [name] to protect someone!"}, {"translation": "Bowser", "role": "mafia", "side": "mafia", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Wolf", "role": "werewolf", "side": "wolf", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You devoured her instead !", "mode": "ChangeTarget", "hookermsg": "You tried to distract Wolf (what an idea, srsly), you were ravishly shot at!"}, "night": {"kill": {"priority": 10, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Peach", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!"}, {"translation": "Captain Falcon", "role": "mayor", "side": "village", "actions": {"vote": 3, "standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ pulls out a fist and punches it through ~Target~\'s chest!", "target": "AnyButSelf"}}}, "help": "You dont have any special commands during the night! Vote to remove people in the day! /Kill To remove people people with a falcon punch! (your vote counts as 3)"}, {"translation": "Snake", "role": "spy", "side": "village", "actions": {"hax": {"kill": {"revealPlayer": 0.20000000000000001, "revealTeam": 0.40000000000000002}}}, "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!"}, {"translation": "Jigglypuff", "role": "godfather", "side": "godfather", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You killed her instead!", "mode": "ChangeTarget", "hookermsg": "You tried to seduce the Marshmallow, you just were rested!"}, "night": {"kill": {"priority": 20, "limit": 2, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone! You can kill 2 targets, Type /kill [name2] again to select your second target!"}, {"translation": "Ike", "role": "vigilante", "side": "village", "actions": {"night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone using a sword!(dont kill the good people!)"}, {"translation": "Samus", "role": "samus", "side": "village", "actions": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}, "night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone using a missile! (dont kill the good people!) Type /distract to distract someone"}, {"translation": "Ganondorf", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Wario", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Waddle Doo", "role": "mafia3", "side": "mafia3", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Moblin", "role": "conspirator1", "side": "mafia1", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided Hyrulian Mafia. Vote to remove people in the day!"}, {"translation": "Waluigi", "role": "conspirator2", "side": "mafia2", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!"}, {"translation": "WaddleDee", "role": "conspirator3", "side": "mafia3", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided Penguin Mafia. Vote to remove people in the day!"}, {"translation": "Ganon", "role": "mafiaboss1", "side": "mafia1", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Wario-Man", "role": "mafiaboss2", "side": "mafia2", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "King Dedede", "role": "mafiaboss3", "side": "mafia3", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Marth", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "Marth pulls out a sword and strikes it through ~Target~\'s chest!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You will not be revealed when you kill! You are allied with the Good people."}, {"translation": "MetaKnight", "role": "miller", "side": "village", "actions": {"inspect": {"revealAs": "mafia"}}, "help": "You dont have any special commands during the night! Vote to remove people in the day! Oh, and insp sees you as Mafia"}], "sides": [{"translation": "Koopa", "side": "mafia"}, {"translation": "Hyrulian Mafia", "side": "mafia1"}, {"translation": "Italian Mafia", "side": "mafia2"}, {"translation": "Penguin Mafia", "side": "mafia3"}, {"translation": "Good people", "side": "village"}, {"translation": "Wolf", "side": "wolf"}, {"translation": "Marshmellow", "side": "godfather"}], "roles2": ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "mafia3", "mafia3", "villager", "mafiaboss1", "villager", "vigilante", "samus", "godfather", "mafiaboss2", "samurai", "villager", "mafiaboss3", "werewolf", "mafia1", "mafia2", "bodyguard"], "roles1": ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "mafia", "villager", "miller", "villager", "mayor"]};

    var ffTheme = {"villageCantLoseRoles": ["mayor", "vigilante", "samurai"], "name": "FF", "roles": [{"translation": "Moogle", "role": "villager", "side": "village", "actions": {}, "help": "As a moogle, it is your job to get the village to win by voting during the day!"}, {"translation": "Locke", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Inspect [name] to find his/her identity! Be careful to not die!"}, {"translation": "Auron", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "Type /Protect [name] to protect someone! Try to survive!"}, {"translation": "Garland", "role": "mafia", "side": "mafia", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 15, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You, Garland, will knock them all down!"}, {"translation": "Kefka", "role": "werewolf", "side": "werewolf", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You destroyed her instead !", "mode": "ChangeTarget", "hookermsg": "You tried to distract Kefka (how foolish...), you were killed instead !"}, "night": {"kill": {"priority": 3, "target": "AnyButTeam", "common": "Self"}}}, "help": "With insane agility, you outspeed even bodyguards. Strike hard with /kill [name]!"}, {"translation": "Tifa", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 2, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Distract [name] to fool around with someone! Those you mess with can do nothing!"}, {"translation": "Cecil", "role": "mayor", "side": "village", "actions": {"vote": -1}, "help": "Conflicted to the core, your vote counts as -1. Use this to lead the village to victory."}, {"translation": "Kuja", "role": "mayor2", "side": "werewolf", "actions": {"vote": 2}, "help": "You\'re just here for a bit of fun. If you can find and partner up with Kefka, hopefully you can screw the heroes over! Your vote counts as 2."}, {"translation": "Zidane", "role": "spy", "side": "village", "actions": {"hax": {"kill": {"revealPlayer": 0.14999999999999999, "revealTeam": 0.40000000000000002}}}, "help": "You have the ability to sense danger. Use these skills to figure out who is going to die!"}, {"translation": "Sephiroth", "role": "godfather", "side": "godfather", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "Sephiroth pulls out a sword and swiftly strikes it through ~Target~\'s chest!", "target": "AnyButSelf"}}, "avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You killed her instead!", "mode": "ChangeTarget", "hookermsg": "You tried to mess with Sephiroth, you just were killed!"}, "night": {"kill": {"priority": 20, "limit": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone! You can kill twice, once during standby and once at night. You will not be revealed, so have fun! "}, {"translation": "Lightning", "role": "vigilante", "side": "village", "actions": {"night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}}}, "help": "Allied with the heroes, it is your goal to assist them and win! Type /kill [name] during the night."}, {"translation": "Jecht", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Team up with Seymour and Yunalesca to bring Sin to victory! Type /kill [name] during the night!"}, {"translation": "Larsa Solidor", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "House Solidor unite! Use /kill [name] to weaken the heroes."}, {"translation": "Yunalesca", "role": "conspirator1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Stop those who threaten to ruin Sin\'s plans. Type /distract [name] during the night."}, {"translation": "Judge Gabranth", "role": "conspirator2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"protect": {"priority": 4, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "You\'re House Solidor\'s personal bodyguard. Type /protect [name] to defend Larsa or Vayne!"}, {"translation": "Seymour", "role": "mafiaboss1", "side": "mafia1", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted by foolish mortals."}, {"translation": "Vayne Solidor", "role": "mafiaboss2", "side": "mafia2", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "As head of House Solidor, it is your duty to crush the heroes. Type /kill [name]. You cannot be distracted."}, {"translation": "Cloud", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ pulls out a Buster Sword and strikes it through ~Target~\'s chest!", "target": "AnyButSelf"}}}, "help": "Lead the heroes to victory by typing /kill [name] during a standby phase! "}, {"translation": "Cactuar", "role": "miller", "side": "village", "actions": {"inspect": {"revealAs": "werewolf"}}, "help": "You dont have any special commands during the night! Vote to remove people in the day! Inspector will think you\'re a bad guy!"}], "sides": [{"translation": "Garland", "side": "mafia"}, {"translation": "Sin", "side": "mafia1"}, {"translation": "House Solidor", "side": "mafia2"}, {"translation": "Heroes", "side": "village"}, {"translation": "Kefka\'s Posse", "side": "werewolf"}, {"translation": "Sephiroth", "side": "godfather"}], "roles2": ["bodyguard", "mafia1", "conspirator1", "inspector", "hooker", "villager", "mafia2", "conspirator2", "villager", "miller", "vigilante", "mayor", "werewolf", "spy", "villager", "villager", "mafia", "mafiaboss1", "mafiaboss2", "godfather", "villager", "samurai", "mayor2", "miller", "villager", "villager", "villager", "miller", "miller", "mafia"], "roles1": ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "mafia", "mayor", "miller", "villager", "villager"]};

    var darknessTheme = {"villageCantLoseRoles": ["mayor", "vigilante", "samurai"], "name": "Darkness", "roles": [{"translation": "Scared People", "role": "villager", "side": "village", "actions": {}, "help": "You dont have any special commands during the night of course you are so frightened! Vote to remove people in the day!"}, {"translation": "Detective", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Inspect [name] to find his/her identity!"}, {"translation": "Charm", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "Type /Protect [name] to protect someone and hope not to die!"}, {"translation": "Ghosts", "role": "mafia", "side": "mafia", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone with your scream!"}, {"translation": "Anubis", "role": "werewolf", "side": "werewolf", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You devoured her instead and was delighted!", "mode": "ChangeTarget", "hookermsg": "You tried to distract Anubis (what an idea, srsly), you were ravishly devoured, for a treat and tributed to Anubis!"}, "night": {"kill": {"priority": 10, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone with your dark underworld powers of Egypt!"}, {"translation": "Lady Ghastly", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!"}, {"translation": "President", "role": "mayor", "side": "village", "actions": {"vote": 5}, "help": "You dont have any special commands during the night! Vote to remove people in the day! (your vote counts as 5)"}, {"translation": "Sneaky", "role": "spy", "side": "village", "actions": {"hax": {"kill": {"revealPlayer": 0.10000000000000001, "revealTeam": 0.33000000000000002}}}, "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!"}, {"translation": "Grim Reaper", "role": "godfather", "side": "godfather", "actions": {"vote": 5, "avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You killed her instead and sent her below!", "mode": "ChangeTarget", "hookermsg": "You tried to seduce the Grim Reaper, you just were killed and sent to the Underworld!"}, "night": {"kill": {"priority": 20, "limit": 2, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone! You can kill 2 targets, Type /kill [name2] again to select your second target! (your vote counts as 5)"}, {"translation": "Angels", "role": "vigilante", "side": "village", "actions": {"night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}, "distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone with holy engergy!(dont kill the scared people!) You are also cute enough to distract people! Type /Distract [name] to distract someone!"}, {"translation": "Vampires", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone with your fangs!"}, {"translation": "Deadly Ghosts", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone with an evil laughter and a scream!"}, {"translation": "Prince Vamp", "role": "conspirator1", "side": "mafia1", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night of course you are a good looking bat/vampire! You are sided Vampires. Vote to remove people in the day!"}, {"translation": "Prince Ghost", "role": "conspirator2", "side": "mafia2", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night of course your scared of the night but you aren\'t of the day! You are sided Deadly Ghosts. Vote to remove people in the day!"}, {"translation": "Lord Vamp", "role": "mafiaboss1", "side": "mafia1", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted, meaning your teeth keep you safe!"}, {"translation": "Lord Ghost", "role": "mafiaboss2", "side": "mafia2", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted of course it goes just straight through your heart!"}, {"translation": "Holy Orb", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ A light comes out and strikes it through ~Target~\'s body!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people."}, {"translation": "Holy Orb", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ A holy light comes out and strikes it through ~Target~\'s body!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people."}, {"translation": "Hades", "role": "samurai", "side": "mafia2", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Hades~ A dark blade is pulled out and is thrust through ~Target~\'s body with an evil laugh!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You not will be revealed when you kill, so make wise choices! You are allied with mafia2."}, {"translation": "Mr. Ghost", "role": "miller", "side": "village", "actions": {"inspect": {"revealAs": "mafia"}}, "help": "You dont have any special commands during the night of course your just a ghost and love the daylight! Vote to remove people in the day! Oh, and insp sees you as Mafia"}], "sides": [{"translation": "Ghosts", "side": "mafia"}, {"translation": "Vampires", "side": "mafia1"}, {"translation": "Deadly Ghosts", "side": "mafia2"}, {"translation": "Scared People", "side": "village"}, {"translation": "Anubis", "side": "werewolf"}, {"translation": "Grim Reaper", "side": "godfather"}], "roles2": ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "villager", "villager", "villager", "mafiaboss1", "villager", "vigilante", "villager", "godfather", "mafiaboss2", "samurai", "villager", "villager", "werewolf", "mafia1", "mafia2", "bodyguard"], "roles1": ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "mafia", "villager", "miller", "villager", "mayor"]};

    var internetTheme = {"villageCantLoseRoles": ["mayor", "vigilante", "samurai"], "name": "Internet", "roles": [{"translation": "Fish", "role": "villager", "side": "village", "actions": {}, "help": "Your cannon fodder! Vote to remove people in the day!"}, {"translation": "PRO", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Inspect [name] to find his/her identity!"}, {"translation": "Scapegoat", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "I\'m sure you know what this means. Type /Protect [name] to protect someone!"}, {"translation": "Mooks", "role": "mafia", "side": "mafia", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Munchkin", "role": "werewolf", "side": "werewolf", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You pwned them instead !", "mode": "ChangeTarget", "hookermsg": "You tried to edit the Munchkin, and he crushed you with his cheapness!"}, "night": {"kill": {"priority": 10, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to pwn someone! FUNTIME!"}, {"translation": "Ninja Editor", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!"}, {"translation": "Big Fish", "role": "mayor", "side": "village", "actions": {"vote": 3}, "help": "You lead the cannon fodder! Vote to remove people in the day! (your vote counts as 3)"}, {"translation": "Haxer", "role": "spy", "side": "village", "actions": {"hax": {"kill": {"revealPlayer": 0.14999999999999999, "revealTeam": 0.53000000000000003}}}, "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!"}, {"translation": "Ubertroll", "role": "godfather", "side": "godfather", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You killed her instead!", "mode": "ChangeTarget", "hookermsg": "You tried to edit the Ubertroll, how dumb can you be?! You got trolled!"}, "night": {"kill": {"priority": 20, "limit": 3, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone! You can kill 3 targets!"}, {"translation": "Noob Hunter", "role": "vigilante", "side": "village", "actions": {"night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone!(dont kill the users!)"}, {"translation": "Noobs", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Trolls", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Noob Worshipper", "role": "conspirator1", "side": "mafia1", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided with the Noobs. Vote to remove people in the day!"}, {"translation": "Troll Worshipper", "role": "conspirator2", "side": "mafia2", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided with the Trolls. Vote to remove people in the day!"}, {"translation": "Noob Supreme", "role": "mafiaboss1", "side": "mafia1", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Troll Supreme", "role": "mafiaboss2", "side": "mafia2", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Troll Hunter", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ deletes ~Target~ from the current mafia game!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to delete someone! You will be revealed when you delete, so make wise choices! You are allied with the Good people."}, {"translation": "Unlucky Sap", "role": "miller", "side": "village", "actions": {"vote": 0, "inspect": {"revealAs": "mafia"}}, "help": "You dont have any special commands during the night! And you can\'t vote in the day! Oh, and PRO sees you as Mook. You really drew the short straw!"}, {"translation": "Pathetic Sap", "role": "sap", "side": "village", "actions": {"vote": 0, "inspect": {"revealAs": "godfather"}}, "help": "You dont have any special commands during the night! And you can\'t vote in the day! Oh, and PRO sees you as Ubertroll. You really drew the short straw!"}, {"translation": "Administrator", "role": "admin", "side": "authority", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ bans ~Target~ from the current mafia game!", "target": "Any"}}}, "help": "Type /Kill [name] during the day phase to ban someone! You will be revealed when you ban, so make wise choices! You are allied with the Authority! You can\'t see the mod, but he can see you."}, {"translation": "Moderator", "role": "mod", "side": "authority", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"protect": {"priority": 2, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}, "kill": {"priority": 21, "broadcast": "role", "target": "Any", "common": "Role"}}}, "help": "Use /protect to protect the Admin! You are allied with authority! You can also /kill someone in the same night that you protect the admin [you strike last]. The Ninja Editor can\'t distract you either!"}], "sides": [{"translation": "Mooks", "side": "mafia"}, {"translation": "Noobs", "side": "mafia1"}, {"translation": "Trolls", "side": "mafia2"}, {"translation": "Users", "side": "village"}, {"translation": "Auth", "side": "authority"}, {"translation": "Munchkin", "side": "werewolf"}, {"translation": "Ubertroll", "side": "godfather"}], "roles2": ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "sap", "villager", "mayor", "villager", "spy", "admin", "villager", "vigilante", "mod", "mafiaboss1", "vigilante", "villager", "godfather", "samurai", "mafiaboss2", "villager", "villager", "werewolf", "mafia1", "mafia2", "bodyguard", "villager", "conspiritor1", "conspiritor2"], "roles1": ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "mafia", "villager", "miller", "villager", "mayor"]};

    //var mafiaTheme = {"villageCantLoseRoles": ["Mayor", "Vigilante", "Samurai"], "name": "Mafia", "roles": [{"translation": "Fish", "role": "villager", "side": "village", "actions": {}, "help": "Your cannon fodder! Vote to remove people in the day!"}, {"translation": "PRO", "role": "inspector", "side": "village", "actions": {"night": {"inspect": {"priority": 30, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Inspect [name] to find his/her identity!"}, {"translation": "Meat Shield", "role": "bodyguard", "side": "village", "actions": {"startup": "role-reveal", "night": {"protect": {"priority": 5, "broadcast": "role", "target": "AnyButSelf", "common": "Role"}}}, "help": "I\'m sure you know what this means. Type /Protect [name] to protect someone!"}, {"translation": "Mooks", "role": "mafia", "side": "mafia", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Munchkin", "role": "werewolf", "side": "werewolf", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You devoured her instead !", "mode": "ChangeTarget", "hookermsg": "You tried to distract the Munchkin,and he crushed you with his cheapness!"}, "night": {"kill": {"priority": 10, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone! DINNERTIME!"}, {"translation": "Rand Bait", "role": "hooker", "side": "village", "actions": {"night": {"distract": {"priority": 1, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Distract [name] to distract someone! Vote to remove people in the day!"}, {"translation": "Big Fish", "role": "mayor", "side": "village", "actions": {"vote": 3}, "help": "You lead the cannon fodder! Vote to remove people in the day! (your vote counts as 3)"}, {"translation": "Haxer", "role": "spy", "side": "village", "actions": {"hax": {"kill": {"revealPlayer": 0.14999999999999999, "revealTeam": 0.53000000000000003}}}, "help": "You can find out who is going to get killed next!(no command for this ability) Vote to remove people in the day!"}, {"translation": "Ubertroll", "role": "godfather", "side": "godfather", "actions": {"avoidHax": ["kill"], "distract": {"msg": "The ~Distracter~ came to you last night! You killed her instead!", "mode": "ChangeTarget", "hookermsg": "You tried to seduce the Ubertroll, how dumb can you be?! You got trolled!"}, "night": {"kill": {"priority": 20, "limit": 3, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone! You can kill 3 targets!"}, {"translation": "Noob Hunter", "role": "vigilante", "side": "village", "actions": {"night": {"kill": {"priority": 19, "target": "AnyButSelf", "common": "Self"}}}, "help": "Type /Kill [name] to kill someone!(dont kill the good people!)"}, {"translation": "Noobs", "role": "mafia1", "side": "mafia1", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Trolls", "role": "mafia2", "side": "mafia2", "actions": {"startup": "team-reveal", "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone!"}, {"translation": "Noob Worshipper", "role": "conspirator1", "side": "mafia1", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided French Canadian Mafia. Vote to remove people in the day!"}, {"translation": "Troll Worshipper", "role": "conspirator2", "side": "mafia2", "actions": {"inspect": {"revealAs": "villager"}, "startup": "team-reveal"}, "help": "You dont have any special commands during the night! You are sided Italian Mafia. Vote to remove people in the day!"}, {"translation": "Noob Supreme", "role": "mafiaboss1", "side": "mafia1", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 12, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Troll Supreme", "role": "mafiaboss2", "side": "mafia2", "actions": {"startup": "team-reveal", "distract": {"mode": "ignore"}, "night": {"kill": {"priority": 11, "broadcast": "team", "target": "AnyButTeam", "common": "Team"}}}, "help": "Type /Kill [name] to kill someone! You can\'t be distracted!"}, {"translation": "Troll Hunter", "role": "samurai", "side": "village", "actions": {"standby": {"kill": {"msg": "You can kill now using /kill [name] :", "killmsg": "~Self~ bans ~Target~ from the current mafia game!", "target": "AnyButSelf"}}}, "help": "Type /Kill [name] during the day phase to kill someone! You will be revealed when you kill, so make wise choices! You are allied with the Good people."}, {"translation": "Unlucky Sap", "role": "miller", "side": "village", "actions": {"vote": 0, "inspect": {"revealAs": "mafia"}}, "help": "You dont have any special commands during the night! And you can\'t vote in the day! Oh, and insp sees you as Mook. You really drew the short straw!"}, {"translation": "Pathetic Sap", "role": "sap", "side": "village", "actions": {"vote": 0, "inspect": {"revealAs": "godfather"}}, "help": "You dont have any special commands during the night! And you can\'t vote in the day! Oh, and insp sees you as Ubertroll. You really drew the short straw!"}], "sides": [{"translation": "Mooks", "side": "mafia"}, {"translation": "Noobs", "side": "mafia1"}, {"translation": "Trolls", "side": "mafia2"}, {"translation": "PROs", "side": "village"}, {"translation": "Munchkin", "side": "werewolf"}, {"translation": "Ubertroll", "side": "godfather"}], "roles2": ["bodyguard", "mafia1", "mafia1", "inspector", "hooker", "villager", "mafia2", "mafia2", "villager", "villager", "villager", "mayor", "villager", "spy", "villager", "villager", "villager", "mafiaboss1", "villager", "vigilante", "villager", "godfather", "mafiaboss2", "samurai", "villager", "villager", "werewolf", "mafia1", "mafia2", "bodyguard", "sap", "conspiritor1", "conspiritor2"], "roles1": ["bodyguard", "mafia", "inspector", "werewolf", "hooker", "villager", "mafia", "villager", "miller", "villager", "mayor"]};

    /* ThemeManager is a object taking care of saving and loading themes
     * in mafia game */
    function ThemeManager() {
        this.themeInfo = [];
        this.themes = {};
    }
    ThemeManager.prototype.toString = function() { return "[object ThemeManager]"; }

    ThemeManager.prototype.save = function(name, url, resp) {
        var fname = "mafiathemes/theme_" + name.replace("/", "").toLowerCase();
        sys.writeToFile(fname, resp);
        var done = false;
        for (var i = 0; i < this.themeInfo.length; ++i) {
            if (cmp(name, this.themeInfo[i][0])) {
                done = true;
                this.themeInfo[i] = [name, url, fname, true];
                break;
            }
        }
        if (!done) {
            this.themeInfo.push([name, url, fname, true]);
        }
        sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
    }

    ThemeManager.prototype.loadTheme = function(plain_theme) {
        var theme = new Theme();
        try {
            theme.sideTranslations = {};
            theme.roles = {};
            theme.nightPriority = [];
            theme.standbyRoles = [];
            theme.haxRoles = {};

            // Init from the theme
            for (var i in plain_theme.sides) {
                theme.addSide(plain_theme.sides[i]);
            }
            for (var i in plain_theme.roles) {
                theme.addRole(plain_theme.roles[i]);
            }
            theme.roles1 = plain_theme.roles1;
            var i = 2;
            while ("roles"+i in plain_theme) {
                theme["roles"+i] = plain_theme["roles"+i];
              ++i;
            }
            theme.roleLists = i-1;
            theme.villageCantLoseRoles = plain_theme.villageCantLoseRoles;
            theme.name = plain_theme.name;
            theme.author = plain_theme.author;
            theme.killmsg = plain_theme.killmsg;
            theme.killusermsg = plain_theme.killusermsg;
            theme.generateRoleInfo();
            theme.enabled = true;
            return theme;
        } catch (err) {
            if (typeof sys == 'object')
                mafiabot.sendAll("Couldn't use theme " + plain_theme.name + ": "+err+".", mafiachan);
            else
                print(Config.Mafia.bot + ": Couldn't use theme: " + plain_theme.name + ": "+err+".");
        }
    }

    ThemeManager.prototype.loadThemes = function() {
        if (typeof sys !== "object") return;
        this.themes = {};
        this.themes["default"] = this.loadTheme(defaultTheme);
        var content = sys.getFileContent("mafiathemes/metadata.json");
        if (!content) return;
        var parsed = JSON.parse(content);
        if (parsed.hasOwnProperty("meta")) {
            this.themeInfo = parsed.meta;
        }
        for (var i = 0; i < this.themeInfo.length; ++i) {
            try {
                var theme = this.loadTheme(JSON.parse(sys.getFileContent(this.themeInfo[i][2])));
                this.themes[theme.name.toLowerCase()] = theme;
                if (!this.themeInfo[i][3]) theme.enabled = false;
            } catch(err) {
                mafiabot.sendAll("Error loading cached theme \"" + this.themeInfo[i][0] + "\": " + err, mafiachan);
            }
        }
    }
    ThemeManager.prototype.saveToFile = function(plain_theme) {
        if (typeof sys != "object") return;
        var fname = "mafiathemes/theme_" + plain_theme.name.toLowerCase();
        sys.writeToFile(fname, JSON.stringify(plain_theme));
        this.themeInfo.push([plain_theme.name, "", fname, true]);
        sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
    }

    ThemeManager.prototype.loadWebTheme = function(url, announce, update) {
        if (typeof sys != 'object') return;
        var manager = this;
        sys.webCall(url, function(resp) {
            try {
                var plain_theme = JSON.parse(resp);
                var theme = manager.loadTheme(plain_theme);
                var lower = theme.name.toLowerCase();
                if (manager.themes.hasOwnProperty(lower) && !update) {
                    mafiabot.sendAll("Won't update " + theme.name + " with /add, use /update to force an update", mafiachan);
                    return;
                }
                manager.themes[lower] = theme;
                manager.save(theme.name, url, resp, update);
                if (announce) {
                    mafiabot.sendAll("Loaded theme " + theme.name, mafiachan);
                }
            } catch (err) {
                mafiabot.sendAll("Couldn't download theme from "+url, mafiachan);
                mafiabot.sendAll("" + err, mafiachan);
                return;
            }
        });
    }

    ThemeManager.prototype.remove = function(src, name) {
        name = name.toLowerCase()
        if (name in this.themes) {
            delete this.themes[name];
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo.splice(i,1);
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
            mafiabot.sendChanMessage(src, "theme " + name + " removed.");
        }
    }

    ThemeManager.prototype.enable = function(src, name) {
        name = name.toLowerCase()
        if (name in this.themes) {
            this.themes[name].enabled = true;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = true;
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
            mafiabot.sendChanMessage(src, "theme " + name + " enabled.");
        }
    }

    ThemeManager.prototype.disable = function(src, name) {
        name = name.toLowerCase()
        if (name in this.themes) {
            this.themes[name].enabled = false;
            for (var i = 0; i < this.themeInfo.length; ++i) {
                if (cmp(name, this.themeInfo[i][0])) {
                    this.themeInfo[i][3] = ffffalse;
                    break;
                }
            }
            sys.writeToFile("mafiathemes/metadata.json", JSON.stringify({'meta': this.themeInfo}));
            mafiabot.sendChanMessage(src, "theme " + name + " disabled.");
        }
    }

    /* Theme is a small helper to organize themes
     * inside the mafia game */
    function Theme() {}
    Theme.prototype.toString = function() { return "[object Theme]"; }

    Theme.prototype.addSide = function(obj) {
        this.sideTranslations[obj.side] = obj.translation;
    }
    Theme.prototype.addRole = function(obj) {
        this.roles[obj.role] = obj;

        if ("hax" in obj.actions) {
            for(var i in obj.actions.hax) {
                var action = i;
                if (!(action in this.haxRoles)) {
                    this.haxRoles[action] = [];
                }
                this.haxRoles[action].push(obj.role);
            }
        }
        if ("night" in obj.actions) {
            for (var i in obj.actions.night) {
                var priority = obj.actions.night[i].priority;
                var action = i;
                var role = obj.role;
                this.nightPriority.push({'priority': priority, 'action': action, 'role': role});
            }
            this.nightPriority.sort(function(a,b) { return a.priority - b.priority });
        }
        if ("standby" in obj.actions) {
            for (var i in obj.actions.standby) {
                this.standbyRoles.push(obj.role);
            }
        }
    }
    Theme.prototype.generateRoleInfo = function() {
        var sep = "*** *********************************************************************** ***";
        var roles = [sep];
        for (var r in this.roles) {
          try {
            var role = this.roles[r];
            roles.push("±Role: " + role.translation);

            // check which abilities the role has
            var abilities = "";
            if (role.actions.night) {
                for (var a in role.actions.night) {
                    var ability = role.actions.night[a];
                    abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") +" during the night. ";
                    if ("avoidHax" in role.actions && role.actions.avoidHax.indexOf(a) != -1) {
                        abilities += "(Can't be detected by spies.) ";
                    }
                }
            }
            if (role.actions.standby) {
                for (var a in role.actions.standby) {
                    var ability = role.actions.standby[a];
                    abilities += "Can " + a + " " + ("limit" in ability ? ability.limit + " persons" : "one person") +" during the standby. ";
                }
            }
            if ("vote" in role.actions) {
                abilities += "Vote counts as " + role.actions.vote + ". ";
            }
            if ("kill" in role.actions && role.actions.kill.mode == "ignore") {
                abilities += "Can't be nightkilled. ";
            }
            if ("hax" in role.actions && Object.keys) {
                var haxy = Object.keys(role.actions.hax);
                abilities += "Gets hax on " + (haxy.length > 1 ? haxy.splice(0,haxy.length-1).join(", ")+" and ":"") + haxy + ". ";
            }
            if ("inspect" in role.actions) {
                abilities += "Reveals as " + this.roles[role.actions.inspect.revealAs].translation + " when inspected. ";
            }
            if ("distract" in role.actions) {
                if (role.actions.distract.mode == "ChangeTarget")
                    abilities += "Kills any distractors. ";
                if (role.actions.distract.mode == "ignore")
                    abilities += "Ignores any distractors. ";
            }
            if (typeof role.side == "string") {
                abilities += "Sided with " + this.trside(role.side) + ". ";
            } else if (typeof role.side == "object") {
                var plop = Object.keys(role.side.random);
                var tran = [];
                for(var p in plop) {
                   tran.push(this.trside(p));
                }
                abilities += "Sided with " + (tran.length > 1 ? tran.splice(0,tran.length-1).join(", ")+" or ":"") + tran + ". ";
            }
            roles.push("±Ability: " + abilities);

            // check on which player counts the role appears
            var parts = [];
            var end = 0;
            for(var i = 1; i <= this.roleLists; ++i) {
                var r = "roles"+i;
                var start = this[r].indexOf(role.role);
                var last = end;
                end = this[r].length;
                if (start >= 0) {
                    ++start;
                    start = start > last ? start : 1+last;
                    if(parts.length > 0 && parts[parts.length-1][1] == start-1) {
                        parts[parts.length-1][1] = end;
                    } else {
                        parts.push([start,end]);
                        if (parts.length > 1) {
                            parts[parts.length-2] = parts[parts.length-2][0] < parts[parts.length-2][1] ? parts[parts.length-2].join("-") : parts[parts.length-2][1];
                        }
                    }
                }
            }
            if (parts.length > 0) {
                parts[parts.length-1] = parts[parts.length-1][0] < parts[parts.length-1][1] ? parts[parts.length-1].join("-") : parts[parts.length-1][1];
            }
            roles.push("±Game: " + parts.join(", ") + " Players");

            roles.push(sep);
          } catch (err) {
            mafiabot.sendAll("Error adding role " + role.translation + "(" + role.role + ") to /roles", mafiachan);
            throw err;
          }
        }
        this.roleInfo = roles;
    }

    /* Theme Loading and Storing */
    Theme.prototype.trside = function(side) {
        return this.sideTranslations[side];
    }
    Theme.prototype.trrole = function(role) {
        return this.roles[role].translation;
    }
    Theme.prototype.getHaxRolesFor = function(command) {
        if (command in this.haxRoles) {
            return this.haxRoles[command];
        }
        return [];
    }
       this.isInGame = function(player) {
        if (mafia.state == "entry") {
            return this.signups.indexOf(player) != -1;
        }
        return player in this.players;
    };
    // init
    this.themeManager = new ThemeManager();

    this.hasCommand = function(name, command, state) {
        var player = this.players[name];
        return (state in player.role.actions && command in player.role.actions[state]);
    };
    this.correctCase = function(string) {
        var lstring = string.toLowerCase();
        for (var x in this.players) {
            if (x.toLowerCase() == lstring)
                return this.players[x].name;
        }
        return noPlayer;
    };
    this.clearVariables = function() {
        /* hash : playername => playerstruct */
        this.players = {};
        this.signups = [];
        this.state = "blank";
        this.ticks = 0;
        this.votes = {};
        this.voteCount = 0;
        this.ips = [];
        this.resetTargets();
    };
    this.lastAdvertise = 0;
    this.resetTargets = function() {
        this.teamTargets = {};
        this.roleTargets = {};
        for (var p in this.players) {
            this.players[p].targets = {};
            this.players[p].dayKill = undefined;
            this.players[p].guarded = undefined;
            this.players[p].safeguarded = undefined;
        }
    };
    this.clearVariables();
    /* callback for /start */
    this.startGame = function(src, commandData) {
        if (mafia.state != "blank") {
            sys.sendMessage(src, "±Game: A game is going on. Wait until it's finished to start another one", mafiachan);
            sys.sendMessage(src, "±Game: You can join the game by typing /join !", mafiachan);
            return;
        }
        /* // No banned combos currently since we don't have the author of every theme
        var bannedCombos = {'deria': ['ff', 'castle']};
        if (bannedCombos.hasOwnProperty(sys.name(src).toLowerCase()) && bannedCombos[sys.name(src).toLowerCase()].indexOf(commandData.toLowerCase()) != -1) {
            sys.sendMessage(src, "±Game: Sorry, you aren't allowed to choose this theme!", mafiachan);
            return;
        }
        */

        var previous = mafia.theme ? mafia.theme.name : undefined;
        var themeName = commandData == noPlayer ? "default" : commandData.toLowerCase();
        // games need to go default, theme, default, theme...
        /*
        if (sys.auth(src) < 1 && previous !== undefined) {
            if (previous == "default" && themeName == "default") {
                sys.sendMessage(src, "±Game: Can't repeat normal game!", mafiachan);
                return;
            }
            else if (previous !== "default" && themeName !== "default") {
                sys.sendMessage(src, "±Game: Can't repeat themed game!", mafiachan);
                return;
            }
        }
        */
        // Prevent a single player from dominating the theme selections.
        // We exclude mafia admins from this.
        var PlayerCheck = PreviousGames.slice(-5).reverse();
        if (!mafia.isMafiaAdmin(src)) {
            for (var i = 0; i < PlayerCheck.length; i++) {
                var who = PlayerCheck[i].who;
                if (who == sys.name(src)) {
                    sys.sendMessage(src, "±Game: Sorry, you have started a game " + i + " games ago, let someone else have a chance!",mafiachan);
                    return;
                }
            }
        }
        var Check = PreviousGames.slice(-Config.Mafia.norepeat).reverse();
        for (var i = 0; i < Check.length; ++i) {
            if (Check[i].what == themeName && themeName != "default") {
                sys.sendMessage(src, "±Game: This was just played " + i + " games ago, no repeating!", mafiachan);
                return;
            }
        }

        if (themeName in mafia.themeManager.themes) {
            if (!mafia.themeManager.themes[themeName].enabled) {
                sys.sendMessage(src, "±Game: This theme is disabled!", mafiachan);
                return;
            }
            mafia.theme = mafia.themeManager.themes[themeName];
        } else {
            sys.sendMessage(src, "±Game: No such theme!", mafiachan);
            return;
        }

        CurrentGame = {who: sys.name(src), what: themeName, when: parseInt(sys.time()), playerCount: 0};

        // For random theme
        //mafia.theme = mafia.themeManager.themes[Object.keys(mafia.themeManager.themes)[parseInt(Object.keys(mafia.themeManager.themes).length * Math.random())]];


        sys.sendAll("", mafiachan);
        sys.sendAll("*** ************************************************************************************", mafiachan);
        if (mafia.theme.name == "default") {
            sys.sendAll("±Game: " + sys.name(src) + " started a game!", mafiachan);
        } else {
            sys.sendAll("±Game: " + sys.name(src) + " started a game with theme "+mafia.theme.name+"!", mafiachan);
        }
        sys.sendAll("±Game: Type /Join to enter the game!", mafiachan);
        sys.sendAll("*** ************************************************************************************", mafiachan);
        sys.sendAll("", mafiachan);

        //if (sys.playersOfChannel(mafiachan).length < 25) {
            var time = parseInt(sys.time());
            if (time > mafia.lastAdvertise + 60*15) {
                mafia.lastAdvertise = time;
                sys.sendAll("", 0);
                sys.sendAll("*** ************************************************************************************", 0);
                sys.sendAll("±Game: " + sys.name(src) + " started a mafia game!", 0);
                sys.sendAll("±Game: Go in the #" + sys.channel(mafiachan) + " and type /Join to enter the game!", 0);
                sys.sendAll("*** ************************************************************************************", 0);
                sys.sendAll("", 0);
            }
        //}
        mafia.clearVariables();
        mafia.state = "entry";

        mafia.ticks = 60;
    };
    /* callback for /end */
    this.endGame = function(src) {
        if (mafia.state == "blank") {
            sys.sendMessage(src, "±Game: No game is going on.",mafiachan);
            return;
        }
        sys.sendAll("*** ************************************************************************************", mafiachan);

        sys.sendAll("±Game: " + (src ? sys.name(src) : Config.Mafia.bot) + " has stopped the game!", mafiachan);
        sys.sendAll("*** ************************************************************************************", mafiachan);
        sys.sendAll("", mafiachan);

        mafia.clearVariables();
    };
    /* called every second */
    this.tickDown = function() {
        if (this.ticks <= 0) {
            return;
        }
        this.ticks = this.ticks - 1;
        if (this.ticks == 0)
            this.callHandler(this.state);
        else {
            if (this.ticks == 30 && this.state == "entry") {
                sys.sendAll("", mafiachan);
                sys.sendAll("±Game: Hurry up, you only have "+this.ticks+" seconds more to join!", mafiachan);
                sys.sendAll("", mafiachan);
            }
        }
    };
    this.sendPlayer = function(player, message) {
        var id = sys.id(player);
        if (id == undefined)
            return;
        sys.sendMessage(id, message, mafiachan);
    };
    // Grab a list of all roles belonging to a given team.
    this.getRolesForTeam = function(side) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.side == side) {
                team.push(player.role.translation);
            }
        }
        return team.sort(); // Sort as to not give out the order.
    };
    this.getRolesForTeamS = function (side) {
        return mafia.getRolesForTeam(side).join(", ");
    };

    this.getPlayersForTeam = function(side) {
        var team = [];
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.side == side) {
                team.push(player.name);
            }
        }
        return team;
    };
    this.getPlayersForTeamS = function(side) {
        return mafia.getPlayersForTeam(side).join(", ");
    };
    this.getPlayersForRole = function(role) {
        var team = []
        for (var p in this.players) {
            var player = this.players[p];
            if (player.role.role == role) {
                team.push(player.name);
            }
        }
        return team;
    };
    this.getPlayersForRoleS = function(role) {
        return mafia.getPlayersForRole(role).join(", ");
    };
    this.getCurrentRoles = function() {
        var list = []
        for (var p in this.players) {
            if (typeof this.players[p].role.actions.onlist === "string")
                list.push(this.theme.trrole(this.players[p].role.actions.onlist));
            else
                list.push(this.players[p].role.translation);
        }
         /* Sorting to not give out the order of the roles per player */
        return list.sort().join(", ");
    };
    this.getCurrentPlayers = function() {
        var list = [];
        for (var p in this.players) {
            list.push(this.players[p].name);
        }
        return list.sort().join(", ");

    }
    this.player = function(role) {
        for (var p in this.players) {
            if (mafia.players[p].role.role == role) //Checks sequentially all roles to see if this is the good one
                return x;
        }
        return noPlayer;
    };
    this.removePlayer = function(player) {
        //sys.sendAll("removing player " + player.name, mafiachan);
        for (var action in player.role.actions.night) {
            var targetMode = player.role.actions.night[action].target;
            var team = this.getPlayersForTeam(player.role.side);
            var role = this.getPlayersForRole(player.role.role);
            if ((targetMode == 'AnyButSelf' || targetMode == 'Any')
             || (targetMode == 'AnyButTeam' && team.length == 1)
             || (targetMode == 'AnyButRole' && role.length == 1)) {
                this.removeTarget(player, action);
            }
        }
        if (mafia.votes.hasOwnProperty(player.name))
            delete mafia.votes[player.name];
        delete this.players[player.name];
    };
    this.kill = function(player) {
        if (this.theme.killmsg) {
            sys.sendAll(this.theme.killmsg.replace(/~Player~/g, player.name).replace(/~Role~/g, player.role.translation), mafiachan);
        } else {
            sys.sendAll("±Kill: " + player.name + " (" + player.role.translation + ") died!", mafiachan);
        }
        this.removePlayer(player);
    };
    this.removeTargets = function(player) {
        for (var action in player.role.actions.night) {
            this.removeTarget(player, action);
        }
    };
    this.removeTarget = function(player, action) {
        var targetMode = player.role.actions.night[action].common;
        if (targetMode == 'Self') {
            player.targets[action] = [];
        } else if (targetMode == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            this.teamTargets[player.role.side][action] = [];
        } else if (targetMode == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            this.roleTargets[player.role.role][action] = [];
        }
    };
    this.removeTarget2 = function(player, target) {
        // TODO: implement
    };
    this.getTargetsFor = function(player, action) {
        var commonTarget = player.role.actions.night[action].common;
        if (commonTarget == 'Self') {
            if (!(action in player.targets)) {
                player.targets[action] = [];
            }
            return player.targets[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            if (!(action in this.teamTargets[player.role.side])) {
                this.teamTargets[player.role.side][action]= [];
            }
            return this.teamTargets[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action]= [];
            }
            return this.roleTargets[player.role.role][action];
        }
    };
    this.setTarget = function(player, target, action) {
        var commonTarget = player.role.actions.night[action].common;
        var limit = 1;
        if (player.role.actions.night[action].limit !== undefined) {
            limit = player.role.actions.night[action].limit;
        }
        var list;
        if (commonTarget == 'Self') {
            if (!(action in player.targets)) {
                player.targets[action] = [];
            }
            list = player.targets[action];
        } else if (commonTarget == 'Team') {
            if (!(player.role.side in this.teamTargets)) {
                this.teamTargets[player.role.side] = {};
            }
            if (!(action in this.teamTargets[player.role.side])) {
                this.teamTargets[player.role.side][action]= [];
            }
            list = this.teamTargets[player.role.side][action];
        } else if (commonTarget == 'Role') {
            if (!(player.role.role in this.roleTargets)) {
                this.roleTargets[player.role.role] = {};
            }
            if (!(action in this.roleTargets[player.role.role])) {
                this.roleTargets[player.role.role][action]= [];
            }
            list = this.roleTargets[player.role.role][action];
        }
        if (list.indexOf(target.name) == -1) {
            list.push(target.name);
            if (list.length > limit) {
                list.splice(0, 1);
            }
        }
        if (this.ticks > 0 && limit > 1)
            this.sendPlayer(player.name, "±Game: Your target(s) are " + list.join(', ') + "!");
    };
    this.testWin = function() {

        if (Object.keys(mafia.players).length == 0) {
            sys.sendAll("±Game: Everybody died! This is why we can't have nice things :(", mafiachan);
            sys.sendAll("*** ************************************************************************************", mafiachan);
            mafia.clearVariables();
            return true;

        }
        outer:
        for (var p in mafia.players) {
            var winSide = mafia.players[p].role.side;
            if (winSide != 'village') {
                for (var i in mafia.theme.villageCantLoseRoles) {
                     if (mafia.player(mafia.theme.villageCantLoseRoles[i]) != noPlayer)
                        // baddies shouldn't win if vigi, mayor or samurai is alive
                        continue outer;
                }
            }
            var players = [];
            var goodPeople = [];
            for (var x in mafia.players) {
                if (mafia.players[x].role.side == winSide) {
                    players.push(x);
                } else if (winSide == 'village') {
                    // if winSide = villy all people must be good people
                    continue outer;
                } else if (mafia.players[x].role.side == 'village') {
                    goodPeople.push(x);
                } else {
                    // some other baddie team alive
                    return false;
                }
            }

            if (players.length >= goodPeople.length) {
                sys.sendAll("±Game: The " + mafia.theme.trside(winSide) + " (" + players.join(', ') + ") wins!", mafiachan);
                if (goodPeople.length > 0) {
                    sys.sendAll("±Game: The " + mafia.theme.trside('village') + " (" + goodPeople.join(', ') + ") lose!", mafiachan);
                }
                sys.sendAll("*** ************************************************************************************", mafiachan);
                mafia.clearVariables();
                return true;
            }
        }
        return false;
    };
    this.handlers = {
        entry: function () {
            sys.sendAll("*** ************************************************************************************", mafiachan);
            sys.sendAll("Times Up! :", mafiachan);

            // Save stats if the game was played
            CurrentGame.playerCount = mafia.signups.length;
            PreviousGames.push(CurrentGame);
            savePlayedGames();

            if (mafia.signups.length < 5) {
                sys.sendAll("Well, Not Enough Players! :", mafiachan);
                sys.sendAll("You need at least 5 players to join (Current; " + mafia.signups.length + ").", mafiachan);
                sys.sendAll("*** ************************************************************************************", mafiachan);
                mafia.clearVariables();
                return;
            }

            /* Creating the roles list */
            var i = 1;
            while (mafia.signups.length > mafia.theme["roles"+i].length) {
               ++i;
            }
            var srcArray = mafia.theme["roles"+i].slice(0, mafia.signups.length);

            srcArray = shuffle(srcArray);

            for (var i = 0; i < srcArray.length; ++i) {
                mafia.players[mafia.signups[i]] = {'name': mafia.signups[i], 'role': mafia.theme.roles[srcArray[i]], 'targets': {}};
                if (typeof mafia.theme.roles[srcArray[i]].side == "object") {
                    if ("random" in mafia.theme.roles[srcArray[i]].side) {
                        var cum = 0;
                        var val = sys.rand(1,100)/100;
                        for(var side in mafia.theme.roles[srcArray[i]].side.random) {
                            cum += mafia.theme.roles[srcArray[i]].side.random[side];
                            if (cum >= val) {
                                mafia.players[mafia.signups[i]].role.side = side;
                                break;
                            }
                        }
                        if (typeof mafia.players[mafia.signups[i]].role.side == "object") {
                            mafiabot.sendAll("Broken theme...", mafiachan);
                            return;
                        }
                    } else {
                        mafiabot.sendAll("Broken theme...", mafiachan);
                        return;
                    }
                }
            }

            sys.sendAll("The Roles have been Decided! :", mafiachan);
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var role = player.role;

                if (typeof role.actions.startup == "object" && typeof role.actions.startup.revealAs == "string") {
                    mafia.sendPlayer(player.name, "±Game: You are a " + mafia.theme.trrole(role.actions.startup.revealAs) + "!");
                } else {
                    mafia.sendPlayer(player.name, "±Game: You are a " + role.translation + "!");
                }
                mafia.sendPlayer(player.name, "±Game: " + role.help);

                if (role.actions.startup == "team-reveal") {
                    mafia.sendPlayer(player.name, "±Game: Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                }
                if (role.actions.startup == "team-revealif") {
                    if (role.actions.startup["team-revealif"].indexOf(role.side) != -1) {
                        mafia.sendPlayer(player.name, "±Game: Your team is " + mafia.getPlayersForTeamS(role.side) + ".");
                    }
                }
                if (role.actions.startup == "role-reveal") {
                    mafia.sendPlayer(player.name, "±Game: People with your role are " + mafia.getPlayersForRoleS(role.role) + ".");
                }

                if (typeof role.actions.startup == "object" && role.actions.startup.revealRole) {
                    mafia.sendPlayer(player.name, "±Game: The " + mafia.theme.roles[role.actions.startup.revealRole].translation + " is " + mafia.getPlayersForRoleS(player.role.actions.startup.revealRole) + "!");
                }
            }
            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Night", mafiachan);
            sys.sendAll("Make your moves, you only have 30 seconds! :", mafiachan);
            sys.sendAll("*** ************************************************************************************", mafiachan);

            mafia.ticks = 30;
            mafia.state = "night";
            mafia.resetTargets();
        }
    ,
        night : function() {
            sys.sendAll("*** ************************************************************************************", mafiachan);
            sys.sendAll("Times Up! :", mafiachan);

            var nightkill = false;
            var getTeam = function(role, commonTarget) {
                var team = [];
                if (commonTarget == 'Role') {
                    team = mafia.getPlayersForRole(role.role);
                } else if (commonTarget == 'Team') {
                    team = mafia.getPlayersForTeam(role.side);
                }
                return team;
            }

            for (var i in mafia.theme.nightPriority) {
                var o = mafia.theme.nightPriority[i];
                var names = mafia.getPlayersForRole(o.role);
                var command = o.action;
                if ("command" in mafia.theme.roles[o.role].actions.night[o.action]) {
                    command = mafia.theme.roles[o.role].actions.night[o.action].command; // translate to real command
                }
                for (var j = 0; j < names.length; ++j) {
                    if (!mafia.isInGame(names[j])) continue;
                    var player = mafia.players[names[j]];
                    var targets = mafia.getTargetsFor(player, o.action);

                    if (command == "distract") {
                        if (targets.length == 0) continue;
                        var target = targets[0];
                        if (!mafia.isInGame(target)) continue;
                        target = mafia.players[target];
                        var distractMode = target.role.actions.distract;
                        if (distractMode === undefined) {}
                        else if (target.safeguarded) {
                            mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                        } else if (distractMode.mode == "ChangeTarget") {
                            mafia.sendPlayer(player.name, "±Game: " + distractMode.hookermsg);
                            mafia.sendPlayer(target.name, "±Game: " + distractMode.msg.replace(/~Distracter~/g, player.role.translation));
                            mafia.kill(player);
                            nightkill = true;
                            mafia.removeTargets(target);
                            continue;
                        } else if (distractMode.mode == "ignore") {
                            mafia.sendPlayer(target.name, "±Game: " + distractMode.msg);
                            continue;
                        } else if (typeof distractMode.mode == "object" && (typeof distractMode.mode.ignore == "string" && distractMode.mode.ignore == player.role.role || typeof distractMode.mode.ignore == "object" && typeof distractMode.mode.ignore.indexOf == "function" && distractMode.mode.ignore.indexOf(player.role.role) > -1)) {
                            if (distractMode.msg)
                                mafia.sendPlayer(target.name, "±Game: " + distractMode.msg);
                            continue;
                        } else if (typeof distractMode.mode == "object" && typeof distractMode.mode.killif == "object" && typeof distractMode.mode.killif.indexOf == "function" && distractMode.mode.killif.indexOf(player.role.role) > -1) {
                            if (distractMode.hookermsg)
                                mafia.sendPlayer(player.name, "±Game: " + distractMode.hookermsg);
                            if (distractMode.msg)
                                mafia.sendPlayer(target.name, "±Game: " + distractMode.msg.replace(/~Distracter~/g, player.role.translation));
                            mafia.kill(player);
                            nightkill = true;
                            mafia.removeTargets(target);
                            continue;
                        }
                            mafia.sendPlayer(target.name, "±Game: The " + player.role.translation +" came to you last night! You were too busy being distracted!");
                        mafia.removeTargets(target);
                        /* warn role / teammates */
                        if ("night" in target.role.actions) {
                            for (var action in target.role.actions.night) {
                                var team = getTeam(target.role, target.role.actions.night[action].common);
                                for (var x in team) {
                                    if (team[x] != target.name) {
                                        mafia.sendPlayer(team[x], "±Game: Your teammate was too busy with the " + player.role.translation + " during the night, you decided not to " + action + " anyone during the night!");
                                    }
                                }
                            }
                        }
                    }
                    else if (command == "protect") {
                        for (var t in targets) {
                            var target = targets[t];
                            if (mafia.isInGame(target)) {
                                mafia.players[target].guarded = true;
                            }
                        }
                    }
                    else if (command == "inspect") {
                        if (targets.length == 0) continue;
                        var target = targets[0];
                        if (!mafia.isInGame(target)) continue;
                        target = mafia.players[target];
                        var inspectMode = target.role.actions.inspect;
                        if (target.safeguarded) {
                            mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                        } else if (inspectMode === undefined) {
                            mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + target.role.translation + "!!");
                        } else {
                            if (inspectMode.revealAs !== undefined) {
                                mafia.sendPlayer(player.name, "±Info: " + target.name + " is the " + mafia.theme.trrole(inspectMode.revealAs) + "!!");
                            }
                            if (inspectMode.revealSide !== undefined) {
                                mafia.sendPlayer(player.name, "±Info: " + target.name + " is sided with the " + mafia.theme.trside(target.role.side) + "!!");
                            }
                        }
                    }
                    else if (command == "poison") {
                        for (var t in targets) {
                            var target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            if (target.safeguarded) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was guarded!");
                            } else if (target.poisoned == undefined) {
                                target.poisoned = 1;
                            }
                        }
                    }
                    else if (command == "safeguard") {
                        for (var t in targets) {
                            var target = targets[t];
                            if (mafia.isInGame(target)) {
                                mafia.players[target].safeguarded = true;
                            }
                        }
                    }
                    else if (command == "kill") {
                        for (var t in targets) {
                            var target = targets[t];
                            if (!mafia.isInGame(target)) continue;
                            target = mafia.players[target];
                            var revenge = false;
                            var revengetext = "±Game: You were killed during the night!";
                            if ("kill" in target.role.actions && target.role.actions.kill.mode == "killattacker") {
                                revenge = true;
                                if (target.role.actions.kill.msg)
                                    revengetext = target.role.actions.kill.msg;
                            }
                            if (target.guarded) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") was protected!");
                            } else if ("kill" in target.role.actions && target.role.actions.kill.mode == "ignore") {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded the kill!");
                            } else if ("kill" in target.role.actions && typeof target.role.actions.kill.mode == "object" && typeof target.role.actions.kill.mode.evadeChance < sys.rand(1,100)/100) {
                                mafia.sendPlayer(player.name, "±Game: Your target (" + target.name + ") evaded the kill!");
                            } else {
                                if (mafia.theme.killusermsg) {
                                    mafia.sendPlayer(target.name, mafia.theme.killusermsg);
                                } else {
                                    mafia.sendPlayer(target.name, "±Game: You were killed during the night!");
                                }
                                mafia.kill(target);
                                nightkill = true;
                            }
                            if (revenge) {
                                mafia.sendPlayer(player.name, revengetext);
                                mafia.kill(player);
                                nightkill = true;
                            }
                        }
                    }
                }
            }
            for (var p in mafia.players) {
                var player = mafia.players[p];
                if (player.poisoned == 1) {
                    player.poisoned = 2;
                } else if (player.poisoned == 2) {
                    mafia.sendPlayer(player.name, "±Game: You died because of Poison!");
                    mafia.kill(player);
                    nightkill = true; // kinda night kill
                }
            }

            if (!nightkill) {
                sys.sendAll("No one died! :", mafiachan);
            }

            if (mafia.testWin()) {
                return;
            }

            mafia.ticks = 30;
            if (mafia.players.length >= 15) {
                mafia.ticks = 40;
            } else if (mafia.players.length <= 4) {
                mafia.ticks = 15;
            }

            sys.sendAll("*** ************************************************************************************", mafiachan);

            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Day", mafiachan);
            sys.sendAll("You have " + mafia.ticks + " seconds to debate who are the bad guys! :", mafiachan);
            for (var role in mafia.theme.standbyRoles) {
                var names = mafia.getPlayersForRole(mafia.theme.standbyRoles[role]);
                for (var j = 0; j < names.length; ++j) {
                    for (var k in mafia.players[names[j]].role.actions.standby) {
                        mafia.sendPlayer(names[j], mafia.players[names[j]].role.actions.standby[k].msg);
                    }
                }
            }
            sys.sendAll("*** ************************************************************************************", mafiachan);

            mafia.state = "standby";
        }
    ,
        standby : function() {
            mafia.ticks = 30;

            sys.sendAll("*** ************************************************************************************", mafiachan);

            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Day", mafiachan);
            sys.sendAll("It's time to vote someone off, type /Vote [name],  you only have " + mafia.ticks + " seconds! :", mafiachan);
            sys.sendAll("*** ************************************************************************************", mafiachan);

            mafia.state = "day";
            mafia.votes = {};
            mafia.voteCount = 0;
        }
    ,
        day : function() {
            sys.sendAll("*** ************************************************************************************", mafiachan);
            sys.sendAll("Times Up! :", mafiachan);

            var voted = {};
            for (var pname in mafia.votes) {
                var player = mafia.players[pname];
                var target = mafia.votes[pname];
                // target play have been killed meanwhile by slay
                if (!mafia.isInGame(target)) continue;
                if (!(target in voted)) {
                    voted[target] = 0;
                }
                if (player.role.actions.vote !== undefined) {
                    voted[target] += player.role.actions.vote;
                } else {
                    voted[target] += 1;
                }
            }
            var tie = true;
            var maxi = 0;
            var downed = noPlayer;
            for (var x in voted) {
                if (voted[x] == maxi) {
                    tie = true;
                } else if (voted[x] > maxi) {
                    tie = false;
                    maxi = voted[x];
                    downed = x;
                }
            }

            if (tie) {
                sys.sendAll("No one was voted off! :", mafiachan);
                sys.sendAll("*** ************************************************************************************", mafiachan);
            } else {
                var roleName = typeof mafia.players[downed].role.actions.lynch == "object" && typeof mafia.players[downed].role.actions.lynch.revealAs == "string" ? mafia.theme.trrole(mafia.players[downed].role.actions.lynch.revealAs) : mafia.players[downed].role.translation
                sys.sendAll("±Game: " + downed + " (" + roleName + ") was removed from the game!", mafiachan);
                mafia.removePlayer(mafia.players[downed]);

                if (mafia.testWin())
                    return;
            }

            sys.sendAll("Current Roles: " + mafia.getCurrentRoles() + ".", mafiachan);
            sys.sendAll("Current Players: " + mafia.getCurrentPlayers() + ".", mafiachan);
            // Send players all roles sided with them
            for (var p in mafia.players) {
                var player = mafia.players[p];
                var side = player.role.side;
                mafia.sendPlayer(player.name, "Current Team: " + mafia.getRolesForTeamS(side));
            }
            sys.sendAll("Time: Night", mafiachan);
            sys.sendAll("Make your moves, you only have 30 seconds! :", mafiachan);
            sys.sendAll("*** ************************************************************************************", mafiachan);

            mafia.ticks = 30;
            mafia.state = "night";
            mafia.resetTargets();
        }
    };
    this.callHandler = function(state) {
        if (state in this.handlers)
            this.handlers[state]();
    };
    this.showCommands = function(src) {
        sys.sendMessage(src, "", mafiachan);
        sys.sendMessage(src, "Server Commands:", mafiachan);
        for (x in mafia.commands["user"]) {
            sys.sendMessage(src, "/" + cap(x) + " - " + mafia.commands["user"][x][1], mafiachan);
        }
        if (sys.auth(src) > 0) {
            sys.sendMessage(src, "Authority Commands:", mafiachan);
            for (x in mafia.commands["auth"]) {
                sys.sendMessage(src, "/" + cap(x) + " - " + mafia.commands["auth"][x][1], mafiachan);
            }
        }
        sys.sendMessage(src, "", mafiachan);
    };
    this.showHelp = function(src) {
        var help = [
            "*** *********************************************************************** ***",
            "±Game: The objective in this game on how to win depends on the role you are given.",
            "*** *********************************************************************** ***",
            "±Role: Mafia",
            "±Win: Eliminate the WereWolf and the Good People!",
            "*** *********************************************************************** ***",
            "±Role: WereWolf",
            "±Win: Eliminate everyone else in the game!",
            "*** *********************************************************************** ***",
            "±Role: Good people (Inspector, Bodyguard, Pretty Lady, Villager, Mayor, Spy, Vigilante, Samurai)",
            "±Win: Eliminate the WereWolf, Mafia (French and Italian if exists) and the Godfather!",
            "*** *********************************************************************** ***",
            "±Role: French Canadian Mafia, Don French Canadian Mafia",
            "±Win: Eliminate the Italian Mafia, Godfather and the Good People!",
            "*** *********************************************************************** ***",
            "±Role: Italian Mafia, Don Italian Mafia",
            "±Win: Eliminate the French Canadian Mafia, Godfather and the Good People!",
            "*** *********************************************************************** ***",
            "±More: Type /roles for more info on the characters in the game!",
            "±More: Type /rules to see some rules you should follow during a game!",
            "*** *********************************************************************** ***",
            ""
        ];
        dump(src, help);
    };
    this.showRoles = function(src, commandData) {
        var themeName = "default";
        if (mafia.state != "blank") {
            themeName = mafia.theme.name.toLowerCase();
        }
        if (commandData != noPlayer) {
            themeName = commandData.toLowerCase();
            if (!mafia.themeManager.themes.hasOwnProperty(themeName)) {
                sys.sendMessage(src, "±Game: No such theme!", mafiachan);
                return;
            }
        }
        if (themeName == "default2") {
        var roles = [
            "*** *********************************************************************** ***",
            "±Role: Villager",
            "±Ability: The Villager has no command during night time. They can only vote during the day!",
            "±Game: 6-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Inspector",
            "±Ability: The Inspector can find out the identity of a player during the Night. ",
            "±Game: 5-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Bodyguard",
            "±Ability: The Bodyguard can protect one person during the night from getting killed, but the bodyguard cant protect itself.",
            "±Game: 5-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Pretty Lady",
            "±Ability: The Pretty Lady can distract people during the night thus cancelling their move, unless it's the WereWolf.",
            "±Game: 5-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Samurai",
            "±Ability: The Samurai can kill people during the standby phase, but he will be revealed when doing so.",
            "±Game: 25-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Mafia",
            "±Ability: The Mafia is a group of 2 people. They get one kill each night. They strike after the WereWolf.",
            "±Game: 5-12 Players",
            "*** *********************************************************************** ***",
            "±Role: WereWolf",
            "±Ability: The WereWolf is solo. To win it has to kill everyone else in the game. The Werewolf strikes first.",
            "±Game: 5-12 27-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Italian Mafia",
            "±Ability: The Italian Mafia is a group of 2-3 people. They get one kill each night. They strike before the French Canadian Mafia.",
            "±Game: 12-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Italian Conspirator",
            "±Ability: Italian Conspirator is sided with Italian Mafia, but doesn't have any special commands. Shows up as a Villager to inspector.",
            "±Game: -",
            "*** *********************************************************************** ***",
            "±Role: Don Italian Mafia",
            "±Ability: Don Italian Mafia is sided with Italian Mafia. He kills with Italian mafia each night. He can't be distracted.",
            "±Game: 24-30 Players",
            "*** *********************************************************************** ***",
            "±Role: French Canadian Mafia",
            "±Ability: The French Canadian Mafia is a group of 2-4 people. They get one kill each night. They strike after the Italian Mafia.",
            "±Game: 12-30 Players",
            "*** *********************************************************************** ***",
            "±Role: French Canadian Conspirator",
            "±Ability: French Canadian Conspirator is sided with French Canadian Mafia, but doesn't have any special commands. Shows up as a Villager to inspector.",
            "±Game: -",
            "*** *********************************************************************** ***",
            "±Role: Don French Canadian Mafia",
            "±Ability: Don French Canadian Mafia is sided with French Canadian Mafia. He kills with French Canadian mafia each night. He can't be distracted.",
            "±Game: 18-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Mayor",
            "±Ability: The Mayor has no command during the night but his/her vote counts as 2.",
            "±Game: 10-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Spy",
            "±Ability: The Spy has 33% chance of finding out who is going to get killed by The Italian or French Canadian Mafia during the night. And 10% chance to find out who is the killer!",
            "±Game: 13-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Vigilante",
            "±Ability: The Vigilante can kill a person during the night! He/she strikes after The French Canadian and Italian Mafia.",
            "±Game: 20-30 Players",
            "*** *********************************************************************** ***",
            "±Role: Godfather",
            "±Ability: The Godfather can kill 2 people during the night! He/she strikes Last!",
            "±Game: 22-30 Players",
            "*** *********************************************************************** ***",
            ""
        ];
        } else {
            roles = mafia.themeManager.themes[themeName].roleInfo;
        }
        dump(src, roles);
    };
    this.showRules = function(src) {
        var rules = [
            "",
            "     Server Rules: ",
            "±Rule: No spamming / flooding ",
            "±Rule: No insulting - especially not auth. ",
            "±Rule: No trolling.",
            "±Tip: Type /rules on other channel to see full rules.",
            "",
            "     Game Rules: ",
            "±Rule: Do not quote any of the Bots.",
            "±Rule: Do not quit the game before you are dead.",
            "±Rule: Do not vote yourself / get yourself killed on purpose",
            "±Rule: Do not talk once you're dead or voted off. ",
            "±Rule: Do not use a hard to type name.",
            "±Rule: Do not group together to ruin the game",
            "±Rule: DO NOT REVEAL YOUR PARTNER IF YOU ARE MAFIA",
            "",
            "±Game: Disobey them and you will be banned from mafia/muted according to the mod/admin's wishes!",
            ""
        ];
        dump(src, rules);
    };
    this.showThemes = function(src) {
        var l = [];
        for (var t in mafia.themeManager.themes) {
            l.push(mafia.themeManager.themes[t].name);
        }
        mafiabot.sendChanMessage(src, "Installed themes are: " + l.join(", "));
    };
    this.showThemeInfo = function(src) {
        mafia.themeManager.themeInfo.sort(function(a,b) {return a[0].localeCompare(b[0]);});
        var mess = [];
        mess.push("<table><tr><th>Theme</th><th>URL</th><th>Author</th><th>Enabled</th></tr>")
        for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
            var info = mafia.themeManager.themeInfo[i];
            var theme = mafia.themeManager.themes[info[0].toLowerCase()];
            if (!theme) continue;
            mess.push('<tr><td>' + theme.name + '</td><td><a href="' + info[1] + '">' + info[1] + '</a></td><td>' + (theme.author ? theme.author : "unknown") + '</td><td>' + (theme.enabled ? "yes" : "no")+ '</td></tr>');
        }
        mess.push("</table>");
        sys.sendHtmlMessage(src, mess.join(""), mafiachan);
    }

    this.showPlayedGames = function(src) {
        var mess = [];
        mess.push("<table><tr><th>Theme</th><th>Who started</th><th>When</th><th>Players</th></tr>");
        var recentGames = PreviousGames.slice(-10);
        var t = parseInt(sys.time());
        for (var i = 0; i < recentGames.length; ++i) {
            var game = recentGames[i];
            mess.push('<tr><td>' + game.what + '</td><td>' + game.who + '</td><td>' + getTimeString(game.when - t) + '</td><td>' + game.playerCount + '</td></tr>');
        }
        mess.push("</table>");
        sys.sendHtmlMessage(src, mess.join(""), mafiachan);
    }

    // Auth commands
    this.isMafiaAdmin = function(src) {
        if (sys.auth(src) >= 1)
            return true;
        if (mafiaAdmins.hash.hasOwnProperty(sys.name(src).toLowerCase())) {
            return true;
        }
        return false;
    }
    this.isMafiaSuperAdmin = function(src) {
        if (sys.auth(src) >= 2)
            return true;
        if (['viderizer'].indexOf(sys.name(src).toLowerCase()) >= 0) {
            return true;
        }
        return false;
    }
    this.pushUser = function(src, name) {
        if (sys.auth(src) < 2) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }
        var id = sys.id(name);
        if (id) {
            name = sys.name(id);
            mafia.signups.push(name);
            mafia.ips.push(sys.ip(id));
        } else {
            mafia.signups.push(name);
        }
        sys.sendAll("±Game: " + name + " joined the game! (pushed by " + sys.name(src) + ")", mafiachan);
    };
    this.slayUser = function(src, name) {
        /*if (sys.auth(src) < 2) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }*/
        name = mafia.correctCase(name);
        if (mafia.isInGame(name)) {
            var slayer = typeof src == "string" ? src : sys.name(src);
            var player = mafia.players[name];
            sys.sendAll("±Kill: " + player.name + " (" + player.role.translation + ") was slayed by " + slayer + "!", mafiachan);
            mafia.removePlayer(player);
        } else {
            mafiabot.sendChanMessage(src, "No such target.");
        }
    };
    this.addTheme = function(src, url) {
        if (!mafia.isMafiaAdmin(src)) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }
        mafia.themeManager.loadWebTheme(url, true, false);
    }
    this.updateTheme = function(src, url) {
        if (!mafia.isMafiaAdmin(src)) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }
        var dlurl;
        if (url.substr(0,7) != "http://") {
            for (var i = 0; i < mafia.themeManager.themeInfo.length; ++i) {
                if (mafia.themeManager.themeInfo[i][0].toLowerCase() == url.toLowerCase()) {
                    dlurl = mafia.themeManager.themeInfo[i][1];
                    break;
                }
            }
        } else {
            dlurl = url;
        }
        mafiabot.sendChanMessage(src, "Download url: " + dlurl);
        if (dlurl) {
            mafia.themeManager.loadWebTheme(dlurl, true, true);
        }
    };
    this.removeTheme = function(src, name) {
        if (!mafia.isMafiaSuperAdmin(src)) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }
        mafia.themeManager.remove(src, name);
    };
    this.disableTheme = function(src, name) {
        if (!mafia.isMafiaAdmin(src)) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }
        mafia.themeManager.disable(src, name);
    };
    this.enableTheme = function(src, name) {
        if (!mafia.isMafiaAdmin(src)) {
            mafiabot.sendChanMessage(src, "admin+ command.");
            return;
        }
        mafia.themeManager.enable(src, name);
    };


    this.importOld = function(src, name) {
    (function() {
mafiabot.sendAll("Importing old themes", mafiachan)
    this.themeManager.loadTheme(defaultTheme);
    this.themeManager.saveToFile(defaultTheme);

    this.themeManager.loadTheme(sfTheme);
    this.themeManager.saveToFile(sfTheme);

    this.themeManager.loadTheme(hpTheme);
    this.themeManager.saveToFile(hpTheme);

    this.themeManager.loadTheme(potatoTheme);
    this.themeManager.saveToFile(potatoTheme);

    this.themeManager.loadTheme(ssbbTheme);
    this.themeManager.saveToFile(ssbbTheme);

    this.themeManager.loadTheme(ffTheme);
    this.themeManager.saveToFile(ffTheme);

    this.themeManager.loadTheme(darknessTheme);
    this.themeManager.saveToFile(darknessTheme);

    this.themeManager.loadTheme(internetTheme);
    this.themeManager.saveToFile(internetTheme);

    this.themeManager.loadThemes();
    }).apply(mafia, []);
    }

    this.commands = {
        user: {
            commands : [this.showCommands, "To see the various commands."],
            start: [this.startGame, "Starts a Game of Mafia."],
            help: [this.showHelp, "For info on how to win in a game."],
            roles: [this.showRoles, "For info on all the Roles in the game."],
            rules: [this.showRules, "To see the Rules for the Game/Server."],
            themes: [this.showThemes, "To view installed themes."],
            themeinfo: [this.showThemeInfo, "To view installed themes (more details)."],
            playedgames: [this.showPlayedGames, "To view recently played games"]
        },
        auth: {
            push: [this.pushUser, "To push users to a Mafia game."],
            //slay: [this.slayUser, "To slay users in a Mafia game."],
            end: [this.endGame, "To cancel a Mafia game!"],
            add: [this.addTheme, "To add a Mafia Theme!"],
            update: [this.updateTheme, "To update a Mafia Theme!"],
            remove: [this.removeTheme, "To remove a Mafia Theme!"],
            disable: [this.disableTheme, "To disable a Mafia Theme!"],
            enable: [this.enableTheme, "To enable a disabled Mafia Theme!"],
            importold: [this.importOld, ""]
        }
    };
    this.handleCommand = function(src, message) {
        var command;
        var commandData = '*';
        var pos = message.indexOf(' ');

        if (pos != -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (command in this.commands["user"]) {
            this.commands["user"][command][0](src, commandData);
            return;
        }
        if (this.state == "entry") {
            if (command == "join") {
                if (this.isInGame(sys.name(src))) {
                    sys.sendMessage(src, "±Game: You already joined!", mafiachan);
                    return;
                }
                if (this.ips.indexOf(sys.ip(src))!=-1) {
                    sys.sendMessage(src, "±Game: This IP is already in list. You cannot register two times!", mafiachan);
                    return;
                }
                if (this.signups.length >= this.theme["roles"+this.theme.roleLists].length) {
                    sys.sendMessage(src, "±Game: There can't be more than " + this.theme["roles"+this.theme.roleLists].length + " players!", mafiachan);
                    return;
                }
                var name = sys.name(src);
                for (x in name) {
                    var code = name.charCodeAt(x);
                    if (name[x] != ' ' && name[x] != '.' && (code < 'a'.charCodeAt(0) || code > 'z'.charCodeAt(0))
                        && (code < 'A'.charCodeAt(0) || code > 'Z'.charCodeAt(0)) && name[x] != '-' && name[x] != '_' && name[x] !='<' && name[x] != '>' && (code < '0'.charCodeAt(0) || code > '9'.charCodeAt(0)))
                    {
                        sys.sendMessage(src, "±Name: You're not allowed to have the following character in your name: " + name[x] + ".", mafiachan);
                        sys.sendMessage(src, "±Rule: You must change it if you want to join!", mafiachan);
                        return;
                    }
                }
                if (name.length > Config.Mafia.max_name_length) {
                    sys.sendMessage(src, "±Name: You're not allowed to have more than 12 letters in your name!", mafiachan);
                    sys.sendMessage(src, "±Rule: You must change it if you want to join!", mafiachan);
                    return;
                }
                this.signups.push(name);
                this.ips.push(sys.ip(src));
                sys.sendAll("±Game: " + name + " joined the game!", mafiachan);

                if (this.signups.length == this.theme["roles"+this.theme.roleLists].length) {
                    this.ticks = 1;
                }
                return;
            }
            if (command == "unjoin") {
                if (this.isInGame(sys.name(src))) {
                    var name = sys.name(src);
                    delete this.ips[this.ips.indexOf(sys.ip(src))];
                    this.signups.splice(this.signups.indexOf(name), 1);
                    sys.sendAll("±Game: " + name + " unjoined the game!", mafiachan);
                    return;
                } else {
                    sys.sendMessage(src, "±Game: You haven't even joined!", mafiachan);
                    return;
                }
            }
        } else if (this.state == "night") {
            var name = sys.name(src);
            //sys.sendAll(name + " used /" + command + " on " + commandData, mafiachan);
            if (this.isInGame(name) && this.hasCommand(name, command, "night")) {
                commandData = this.correctCase(commandData);
                if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Hint: That person is not playing!", mafiachan);
                    return;
                }
                var player = mafia.players[name];
                var target = mafia.players[commandData];

                if (["Self", "Any"].indexOf(player.role.actions.night[command].target) == -1 && commandData == name) {
                    sys.sendMessage(src, "±Hint: Nope, this wont work... You can't target yourself!", mafiachan);
                    return;
                }
                else if (player.role.actions.night[command].target == 'AnyButTeam' && player.role.side == target.role.side
                 || player.role.actions.night[command].target == 'AnyButRole' && player.role.role == target.role.role) {
                    sys.sendMessage(src, "±Hint: Nope, this wont work... You can't target your partners!", mafiachan);
                    return;
                }

                sys.sendMessage(src, "±Game: You have chosen to " + command + " " + commandData + "!", mafiachan);
                this.setTarget(player, target, command);

                var broadcast = player.role.actions.night[command].broadcast;
                if (broadcast !== undefined) {
                    var team = [];
                    if (broadcast == "team") {
                        team = this.getPlayersForTeam(player.role.side);
                    } else if (broadcast == "role") {
                        team = this.getPlayersForRole(player.role.role);
                    }
                    var broadcastmsg = "±Game: Your partner(s) have decided to " + command + " '" + commandData + "'!";
                    if (player.role.actions.night[command].broadcastmsg) {
                        broadcastmsg = player.role.actions.night[command].broadcastmsg.replace(/~Player~/g, name).replace(/~Target~/g, commandData).replace(/~Action~/, command);
                    }
                    for (x in team) {
                        if (team[x] != name) {
                            this.sendPlayer(team[x], "±Game: Your partner(s) have decided to " + command + " '" + commandData + "'!");
                        }
                    }
                }

                /* Hax-related to command */
                // some roles can get "hax" from other people using some commands...
                // however, roles can have avoidHax: ["kill", "distract"] in actions..
                if ("avoidHax" in player.role.actions && player.role.actions.avoidHax.indexOf(command) != -1) {
                    return
                }
                var haxRoles = mafia.theme.getHaxRolesFor(command);
                for (var i in haxRoles) {
                    var role = haxRoles[i];
                    var haxPlayers = this.getPlayersForRole(role);
                    for (j in haxPlayers) {
                        var haxPlayer = haxPlayers[j];
                        var r = Math.random();
                        var roleName = this.theme.trside(player.role.side);
                        if (r < mafia.theme.roles[role].actions.hax[command].revealTeam) {
                            this.sendPlayer(haxPlayer, "±Game: The " + roleName + " are going to kill " + commandData + "!");
                        }
                        if (r < mafia.theme.roles[role].actions.hax[command].revealPlayer) {
                            this.sendPlayer(haxPlayer, "±Game: " + name + " is one of The " + roleName + "!");
                        }
                    }
                }

                return;
            }
        } else if (this.state == "day") {
            if (this.isInGame(sys.name(src)) && command == "vote") {
                commandData = this.correctCase(commandData);
                if (!this.isInGame(commandData)) {
                    sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                    return;
                }
                if (sys.name(src) in this.votes) {
                    sys.sendMessage(src, "±Rule: You already voted!", mafiachan);
                    return;
                }
                sys.sendAll("±Game:" + sys.name(src) + " voted for " + commandData + "!", mafiachan);
                this.votes[sys.name(src)] = commandData;
                this.voteCount+=1;

                if (this.voteCount == Object.keys(mafia.players).length) {
                    mafia.ticks = 1;
                } else if (mafia.ticks < 8) {
                    mafia.ticks = 8;
                }
                return;
            }
        } else if (mafia.state == "standby") {
            var name = sys.name(src);
            if (this.isInGame(name) && this.hasCommand(name, command, "standby")) {
                var player = mafia.players[name];
                var commandObject = player.role.actions.standby[command];
                if (commandObject.hasOwnProperty("command"))
                    command = commandObject.command
                if (command == "kill") {
                    if (player.dayKill >= (commandObject.limit || 1)) {
                        sys.sendMessage(src, "±Game: You already killed!", mafiachan);
                        return;
                    }
                    commandData = this.correctCase(commandData);
                    if (!this.isInGame(commandData)) {
                        sys.sendMessage(src, "±Game: That person is not playing!", mafiachan);
                        return;
                    }
                    var target = mafia.players[commandData];
                    var revenge = false;
                    if (target.role.actions.hasOwnProperty("daykill")) {
                        if (target.role.actions.daykill == "evade") {
                            sys.sendMessage(src, "±Game: That person is gone, you can't kill them!", mafiachan);
                            return;
                        } else if (target.role.actions.daykill == "revenge") {
                            revenge = true;
                            return;
                        }
                    }
                    sys.sendAll("*** ************************************************************************************", mafiachan);
                    if (!revenge) {
                        sys.sendAll("±Game: " + commandObject.killmsg.replace(/~Self~/g, name).replace(/~Target~/g, commandData), mafiachan);
                        player.dayKill = player.dayKill+1 || 1;
                        this.kill(mafia.players[commandData]);
                    } else {
                        if (target.role.actions.daykillrevengemsg !== undefined && typeof target.role.actions.daykillrevengemsg == "string") {
                            sys.sendAll("±Game: " + target.role.actions.daykillrevengemsg.replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);
                        } else {
                            sys.sendAll("±Game: ~Target~ tries to attack ~Self~, but ~Self~ fights back and kills ~Target~!".replace(/~Self~/g, commandData).replace(/~Target~/g, name), mafiachan);

                        }
                        this.kill(mafia.players[name]);
                    }

                    if (this.testWin()) {
                        return;
                    }
                    sys.sendAll("*** ************************************************************************************", mafiachan);
                }
                return;
            }
        }
        if (command == "join") {
            sys.sendMessage(src, "±Game: You can't join now!", mafiachan);
            return;
        }

        if (command == "mafiaadmins") {
            sendChanMessage(src, "");
            sendChanMessage(src, "*** MAFIA ADMINS ***");
            sendChanMessage(src, "");
            for (var x in mafiaAdmins.hash) {
                sendChanMessage(src, x + (sys.id(x) != undefined ? ":" : ""));
            }
            sendChanMessage(src, "");
            return;
        }

        if (!this.isMafiaAdmin(src))
            throw ("no valid command");

        if (command in this.commands["auth"]) {
            this.commands["auth"][command][0](src, commandData);
            return;
        }
        var tar = sys.id(commandData);
        if (command == "mafiaban") {
            script.issueBan("mban", src, tar, commandData, sys.auth(src) > 0 ? undefined : 86400);
            return;
        }
        if (command == "mafiabans") {
            try {
                mafiabot.sendMessage(src, "Before mafiabans.", channel);
                if (script.modCommand(src, command, commandData, tar) == "no command") {
                    mafiabot.sendMessage(src, "Sorry, you are not authorized to use this command.", channel);
                }
                mafiabot.sendMessage(src, "After mafiabans.", channel);
            } catch (e) {
                mafiabot.sendMessage(src, "[DEBUG] Exception occurred: " + e, channel);
            }
            return;
        }
        if (!this.isMafiaSuperAdmin(src))
            throw ("no valid command");

        if (command == "mafiaadmin") {
            mafiaAdmins.add(commandData.toLowerCase(), "");
            var id = sys.id(commandData);
            if (id != undefined)
                SESSION.users(id).mafiaAdmin = true;
            sys.sendMessage(src, "±Game: That person is now a mafia admin!", mafiachan);
            return;
        }
        if (command == "mafiaadminoff") {
            mafiaAdmins.remove(commandData);
            mafiaAdmins.remove(commandData.toLowerCase());
            var id = sys.id(commandData);
            if (id != undefined)
                SESSION.users(id).mafiaAdmin = false;
            sys.sendMessage(src, "±Game: That person is no more a mafia admin!", mafiachan);
            return;
        }

        throw ("no valid command");
    }
}();


/* stolen from here: http://snippets.dzone.com/posts/show/849 */
function shuffle(o) {
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

/* stolen from here: http://stackoverflow.com/questions/1026069/capitalize-first-letter-of-string-in-javascript */
function cap(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function dump(src, mess) {
    for (x in mess) {
        sys.sendMessage(src, mess[x], mafiachan);
    }
}

/* stolen from here: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format */
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};


function isNonNegative(n) {
    return typeof n == 'number' && !isNaN(n) && n >= 0;
}

(function() {
        var strTable = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";

        var table = new Array();
        for (var i = 0; i < strTable.length; ++i) {
          table[i] = parseInt("0x" + strTable[i]);
        }


        /* Number */
        crc32 = function(str, crc ) {
                if( crc === undefined ) crc = 0;
                var n = 0; //a number between 0 and 255
                var x = 0; //an hex number

                crc = crc ^ (-1);
                for( var i = 0, iTop = str.length; i < iTop; i++ ) {
                        n = ( crc ^ str.charCodeAt( i ) ) & 0xFF;
                        x = "0x" + table[n];
                        crc = ( crc >>> 8 ) ^ x;
                }
                return crc ^ (-1);
        };
})();

var suspectVoting = new function() {
    var canVote = function(src) {
        if (!sys.dbRegistered(sys.name(src))) {
            return false;
        }
        if (sys.ratedBattles(sys.name(src), poll.tier) < 75) {
            return false;
        }
        if (sys.ladderRating(src, poll.tier) <= 1000) {
            return false;
        }
        return true;
    }
    var getVote = function(src) {
         var name = sys.name(src).toLowerCase();
         for (var i in poll.voters) {
             if (name == poll.voters[i].name) {
                 return poll.voters[i];
             }
         }
    }
    poll = {
        'running': false,
        'subject': 'Chandelure',
        'answers': ['ban', 'no ban'],
        'tier': 'DW OU',
        'voters': [],
    };
    poll.canVote = canVote;
    poll.getVote = getVote;
    var savePoll = function() {
        delete poll.canVote;
        delete poll.getVote;
        var s = JSON.stringify(poll);
        sys.writeToFile('suspectvoting.json',s);
        poll.canVote = canVote;
        poll.getVote = getVote;
    }
    var loadPoll = function(name) {
        try {
            poll = JSON.parse(sys.getFileContent(name));
            poll.canVote = canVote;
            poll.getVote = getVote;
        } catch (err) {}
    }
    loadPoll('suspectvoting.json');

    var userCommands = {
        'votinghelp': function(src, commandData) {
            sendChanMessage(src, "*** Suspect Voting commands ***");
            sendChanMessage(src, "/vote [subject] [answer]: to vote in a suspect voting");
            sendChanMessage(src, "/removeVote [subject]: to remove your vote in a suspect voting");
            if (sys.auth(src) < 3 && Config.superAdmins.index) return;
            sendChanMessage(src, "*** Owner commands ***");
            sendChanMessage(src, "/whiteList [person]: to approve one's vote in suspect voting");
            sendChanMessage(src, "/startVoting: to start a suspect voting");
            sendChanMessage(src, "/stopVoting: to stop running suspect voting");
            sendChanMessage(src, "/getResults [subject]: to get results of a suspect voting");
            sendChanMessage(src, "/newPoll [subject:tier:answer1:answer2:...]: to make a new voting");
        },
        'vote': function(src, commandData) {
             if (!poll.running) {
                 normalbot.sendChanMessage(src, "There's no poll running.");
                 return;
             }
             if (commandData.substr(0, poll.subject.length).toLowerCase() != poll.subject.toLowerCase()) {
                 normalbot.sendChanMessage(src, "The subject of this poll is: " + poll.subject + ". Please do /vote " + poll.subject + " [your answer]");
                 return;
             }
             var answer = commandData.substr(poll.subject.length+1);
             if (poll.canVote(src)) {
                 if (answer == '') {
                     var vote = poll.getVote(src);
                     if (vote !== undefined) {
                         var d = new Date();
                         d.setTime(vote.time*1000);
                         normalbot.sendChanMessage(src, "You have previously voted '" + vote.answer + "' from IP " + vote.ip + " with rating " + vote.rating + " on " + d.toUTCString());
                         return;
                     }
                     normalbot.sendChanMessage(src, "You haven't voted yet. Valid votes in this poll are: " + poll.answers.join(", "));
                     return;
                 }
                 if (poll.answers.indexOf(answer) == -1) {
                     normalbot.sendChanMessage(src, "Only valid votes in this poll are: " + poll.answers.join(", "));
                     return;
                 }
                 var ip = sys.ip(src);
                 var name = sys.name(src).toLowerCase();
                 for (var i in poll.voters) {
                     if (ip == poll.voters[i].ip) {
                         if (name != poll.voters[i].name) {
                             normalbot.sendChanMessage(src, "Sorry, your IP address has already voted as " + poll.voters[i].name+". The vote will not change.");
                             return;
                         }
                         poll.voters[i].rating = sys.ladderRating(src, poll.tier);
                         poll.voters[i].answer = answer;
                         poll.voters[i].time = parseInt(sys.time());
                         savePoll();
                         normalbot.sendChanMessage(src, "Your vote has been updated.");
                         return;
                     } else if (name == poll.voters[i].name) {
                         poll.voters[i].ip = sys.ip(src);
                         poll.voters[i].rating = sys.ladderRating(src, poll.tier);
                         poll.voters[i].answer = answer;
                         poll.voters[i].time = parseInt(sys.time());
                         savePoll();
                         normalbot.sendChanMessage(src, "Your vote has been updated.");
                         return;
                     }
                 }
                 var o = {
                     'ip': ip,
                     'name': name,
                     'rating': sys.ladderRating(src, poll.tier),
                     'answer': answer,
                     'time': parseInt(sys.time()),
                     'whitelisted': false
                 };
                 poll.voters.push(o);
                 savePoll();
                 normalbot.sendChanMessage(src, "Your vote has been registered. Don't forget to post on the associated topic on the forum saying you voted. If you aren't going to post, do /removeVote " + poll.subject + " now!");
                 return;
             } else {
                 normalbot.sendChanMessage(src, "Sorry, you can't take part in this poll. Your name needs to be registered, you must have over 1000 points and enough battles (you have " + sys.ratedBattles(sys.name(src), poll.tier) + "/75 battles.");
             }
        } ,
        'removevote': function(src, commandData) {
            if (commandData.substr(0, poll.subject.length).toLowerCase() != poll.subject.toLowerCase()) {
                normalbot.sendChanMessage(src, "The subject of this poll is: " + poll.subject + ". Do /removeVote " + poll.subject + " to remove your vote.");
                return;
            }
            var name = sys.name(src).toLowerCase();
            for (var i in poll.voters) {
                    if (name == poll.voters[i].name) {
                        poll.voters.splice(i,1);
                        savePoll();
                        normalbot.sendChanMessage(src, "Your vote has been removed.");
                        return;
                    }
            }
            normalbot.sendChanMessage(src, "You haven't voted with that name.");
        }
    };

    var ownerCommands = {
        'whitelist': function(src, commandData) {
        var target = commandData.toLowerCase();
            for (var i = 0; i < poll.voters.length; ++i) {
                var voter = poll.voters[i];
                if (voter.name == target) {
                    if (voter.whitelisted) {
                        voter.whitelisted = false;
                        normalbot.sendChanMessage(src, '' + voter.name + "'s vote was disapproved.");
                    } else {
                        voter.whitelisted = true;
                        normalbot.sendChanMessage(src, '' + voter.name + "'s vote was approved.");
                    }
                    return;
                }
            }
            normalbot.sendChanMessage(src, '' + commandData + ' has not voted.');
            savePoll();
        },
        'startvoting': function(src, commandData) {
            normalbot.sendChanMessage(src, 'The Poll is running again.');
            sys.sendAll('');
            normalbot.sendAll('The Suspect Voting of ' + cap(poll.subject) +' (' + poll.tier + ') is now running!');
            sys.sendAll('');
            poll.running = true;
            savePoll();
        },
        'stopvoting': function(src, commandData) {
            normalbot.sendChanMessage(src, 'The Votes are frozen now.');
            sys.sendAll('');
            normalbot.sendAll('The Suspect Voting of ' + cap(poll.subject) +' (' + poll.tier + ') has ended!');
            sys.sendAll('');
            poll.running = false;
            savePoll();
        },
        'loadpoll': function(src, commandData) {
            normalbot.sendChanMessage(src, 'Loading ' + commandData);
            loadPoll(commandData);
        },
        'tier': function(src, commandData) {
            normalbot.sendChanMessage(src, "Current tier is '" + poll.tier + "' with " + sys.totalPlayersByTier(poll.tier) + " players.");
            var p = sys.totalPlayersByTier(commandData);
            if (p > 0) {
                poll.tier = commandData;
                normalbot.sendChanMessage(src, "New tier is '" + poll.tier + "' with " + p + " players.");
            }
        },
        'getresults': function(src, commandData) {
            var results = {};
            var unscaled = {};
            for (var i = 0; i < poll.answers.length; ++i) {
                results[poll.answers[i]] = 0;
                unscaled[poll.answers[i]] = 0;
            }
            var countAll = commandData.indexOf("--all") > -1;
            var useOld = commandData.indexOf("--old") > -1;
            var useNew = commandData.indexOf("--new") > -1;
            var verbose = commandData.indexOf("--summarize") == -1;
            var total_users = poll.voters.length;
            var vote_count = 0;
            var p = sys.totalPlayersByTier(poll.tier);
            var divider1 = Math.log(p/2);
            var divider2 = Math.exp(1/divider1);
            if (verbose)
                normalbot.sendChanMessage(src, "Following people voted:")
            for (var i = 0; i < total_users; ++i) {
                var voter = poll.voters[i];
                if (verbose)
                    normalbot.sendChanMessage(src, "" + voter.name+" ("+(voter.ip ? voter.ip : "unknown ip")+") voted for "+voter.answer+" with rating " + voter.rating + ". Approved: " + voter.whitelisted);
                if (voter.whitelisted === false && !countAll) continue;
                var x = voter.rating;
//                if (x>1700) x = 1700;
                var votes;
                if (useOld) {
                    votes = (Math.exp( Math.pow(x/1000,4) / divider1 ) / divider2 - 1) * 10;
                } else if (useNew) {
                    votes = 161.404254079125 - 0.5559179487175973*x + 0.0007211727855474324*x*x - 4.1836247086231597*Math.pow(10,-7)*x*x*x + 9.175407925405417*Math.pow(10,-11)*x*x*x*x;
                } else {
                    votes = 2.2071678321675907*Math.pow(10,-11)*Math.pow(x,4) - 8.358100233098689*Math.pow(10,-8)*Math.pow(x,3)+0.0001190843531468168*Math.pow(x,2) - 0.07185052447548725*x + 14.260635198121216;
                }
                if (votes < 0) votes = 0;
                results[voter.answer] += votes;
                unscaled[voter.answer] += 1;
                ++vote_count;
            }
            var sum = 0;
            for (var i = 0; i < poll.answers.length; ++i) {
                sum += results[poll.answers[i]];
            }
            if (sum > 0) {
                normalbot.sendChanMessage(src, 'The Results of Suspect Voting of ' + cap(poll.subject) + ' is:');
                for (var i = 0; i < poll.answers.length; ++i) {
                    var v = results[poll.answers[i]];
                    var u = unscaled[poll.answers[i]];
                    sendChanMessage(src, 'Option "' + poll.answers[i] + '" had ' + v + ' votes. (' + 100*v/sum + '%, '+u+' persons)');
                }
                sendChanMessage(src, 'Total of ' + total_users + ' took part and ' + vote_count + ' were approved. Total sum of the votes is ' + sum + '.');
            } else {
                if (total_users == 0) {
                    normalbot.sendChanMessage(src, 'No one has voted yet.');
                } else {
                    normalbot.sendChanMessage(src, 'No one has been approved. Use /whitelist [username] to approve votes.');
                }
            }
        },
        'clearpoll': function(src, commandData) {
            normalbot.sendChanMessage(src, 'Sorry, not implemented! Just use /eval poll.voters=[]')
        },
        'newpoll': function(src, commandData) {
            var params = commandData.split(":");
            if (params.length < 4) {
                normalbot.sendChanMessage(src, 'Usage: /newPoll subject:tier:answer1:answer2:...');
                return;
            }
            var s = JSON.stringify(poll);
            var fn = 'oldSuspectVoting'+sys.time()+'.json';
            sys.writeToFile(fn,s);
            normalbot.sendChanMessage(src, 'Old poll saved to '+fn);

            var newSubject = params[0];
            var newTier = params[1];
            var newAnswers = params.splice(2);
            poll.subject = newSubject;
            poll.tier = newTier;
            poll.answers = newAnswers;
            poll.voters = [];
            poll.running = false;
            savePoll();
            normalbot.sendChanMessage(src, 'The poll successfully updated!');
        }
    };

    this.afterLogIn = function(src) {
        if (poll.running) {
            if (poll.canVote(src) && poll.getVote(src) === undefined) {
                normalbot.sendChanMessage(src, 'A Suspect Voting is going on! Use /vote ' + poll.subject + ' [answer] to vote!');
            }
        }
    }

    this.handleCommand = function(src, message) {
        var command;
        var commandData = '';
        var pos = message.indexOf(' ');

        if (pos != -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (command in userCommands) {
            userCommands[command](src, commandData);
            return;
        }
        if (command in ownerCommands && (sys.auth(src) >= 3 || isSuperAdmin(src))) {
            ownerCommands[command](src, commandData);
            return;
        }
        throw "no valid command";
    };

}();

var amoebaGame = function() {
    var id;
    var name = "Evolution Game";
    var species = ['Solosis', 'Lilligant', 'Kokorok', 'Minccino', 'Mankey', 'Arceus'];
    var messages = ['solosis solosis', 'lilli-lilligant', 'kokokokokorok!', 'minccino?', 'ma-mankey mankey!', '-'];
    var battles = {};

    var init = function() {
        if (sys.existChannel(name)) {
            id = sys.channelId(name);
        } else {
            id = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(id);
        SESSION.channels(id).perm = true;
        SESSION.channels(id).master = "lamperi";
    };

    var beforeChatMessage = function(src, message, chan) {
        if (chan != id) return false;
        var role = SESSION.users(src).amoeba.role;
        if (sys.auth(src) > 0 && ["/","!"].indexOf(message[0]) > -1) return false;
        if (role != species.length - 1) {
            sys.sendAll(sys.name(src) + ": " + messages[role], id);
            if (battles[role] && battles[role] != src && sys.isInChannel(battles[role], id)) {
                var winner = sys.rand(0,2) > 0 ? battles[role] : src;
                var loser = winner == src ? battles[role] : src;
                SESSION.users(winner).amoeba.role++;
                if (SESSION.users(loser).amoeba.role > 0) SESSION.users(loser).amoeba.role--;
                sys.sendAll("+EvolutionBot: Two " + species[role] + "s, "
                    + sys.name(battles[role]) + " and " + sys.name(src) + " engaged in a fierce battle! "
                    + sys.name(winner) + " won and is now a " + species[SESSION.users(winner).amoeba.role] + ". "
                    + sys.name(loser) + " lost and is now a " + species[SESSION.users(loser).amoeba.role] + ".",
                id);
                delete battles[role];
            } else {
                battles[role] = src;
            }
            sys.stopEvent();
            return true;
        }
        return false;
    }

    var beforeChannelJoin = function(src, channel) {
        if (channel != id) return false;
        SESSION.users(src).amoeba = {};
        SESSION.users(src).amoeba.role = 0;
        return false;
    }

    return {
        init: init,
        beforeChatMessage: beforeChatMessage,
        beforeChannelJoin: beforeChannelJoin
    }
}();


/*
 * Prototype: MemoryHash
 * Functions:
 *  - add(key,value)
 *  - get(key)
 *  - remove(key)
 *  - removeIf(callBack)
 *  - clear()
 *  - save()
 *  - escapeValue(val)
 *
 *  All keys and values must be strings.
 */
function MemoryHash(filename)
{
    this.hash = {};
    this.fname = filename;

    var contents = sys.getFileContent(this.fname);
    if (contents !== undefined) {
        var lines = contents.split("\n");
        for(var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            var key_value = line.split("*");
            var key = key_value[0];
            var value = key_value[1];
            if (key.length > 0) {
                if (value === undefined)
                    value = '';
                this.hash[key] = value;
            }
        }
    }
}

MemoryHash.prototype.add = function(key, value)
{
    this.hash[key] = value;
    // it doesn't matter if we add a duplicate,
    // when we remove something eventually,
    // duplicates will be deleted
    sys.appendToFile(this.fname, key +'*' + value + '\n');
}

MemoryHash.prototype.get = function(key)
{
    return this.hash[key];
}

MemoryHash.prototype.remove = function(key)
{
    delete this.hash[key];
    this.save();
}

MemoryHash.prototype.removeIf = function(test)
{
    var i;
    var toDelete = []
    for (i in this.hash) {
        if (test(this, i)) {
            toDelete.push(i);
        }
    }
    for (i in toDelete) {
        delete this.hash[toDelete[i]];
    }
}

MemoryHash.prototype.clear = function()
{
    this.hash = {};
    this.save();
}

MemoryHash.prototype.save = function()
{
    var lines = [];
    for (var i in this.hash) {
        lines.push(i +'*' + this.hash[i] + '\n');
    }
    sys.writeToFile(this.fname, lines.join(""))
}

MemoryHash.prototype.escapeValue = function(value)
{
    return value.replace(/\*\n/g,'');
}

/* End of prototype MemoryHash */

function Lazy(func)
{
    var done = false;
    return function() {
        if (done)
            return this._value
        else {
            done = true;
            return this._value = func.apply(arguments.callee, arguments);
        }
    }
}

var POKEMON_CLEFFA = typeof sys != 'undefined' ? sys.pokeNum("Cleffa") : 173;
function POUser(id)
{
    /* user's id */
    this.id = id;
    /* whether user is megauser or not */
    this.megauser = false;
    /* whether user is muted or not */
    this.mute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is mafiabanned or not */
    this.mban = {active: false, by: null, expires: 0, time: null, reason: null};
    /* whether user is secrectly muted */
    this.smute = {active: false, by: null, expires: 0, time: null, reason: null};
    /* caps counter for user */
    this.caps = 0;
    /* whether user is impersonating someone */
    this.impersonation = undefined;
    /* last time user said something */
    this.timecount = parseInt(sys.time());
    /* counter on how many lines user has said recently */
    this.floodcount = 0;
    /* counts coins */
    this.coins = 0;
    /* whether user has enabled battling only in same tier */
    this.sametier = undefined;
    /* last line */
    this.lastline = {message: null, time: 0};
    /* login time */
    this.logintime = parseInt(sys.time());

    // warn find battle custom message
    this.reloadwfb();

    /* android default team check */
    var android = true
    for (var i = 0; i < 6; ++i) {
        if (sys.teamPoke(this.id, i) != POKEMON_CLEFFA) { 
            android = false;
            break; 
        }
    }
    this.android = android;
 
    var name = sys.name(id);
    /* check if user is megauser */
    if (megausers.indexOf("*" + name + "*") != -1)
        this.megauser = true;
    if (contributors.hash.hasOwnProperty(name))
        this.contributions = contributors.get(name);

    /* check if user is banned or mafiabanned */
    var data;
    var loopArgs = [["mute", mutes], ["mban", mbans], ["smute", smutes]];
    for (var i = 0; i < 3; ++i) {
        var action = loopArgs[i][0];
        if (data = loopArgs[i][1].get(sys.ip(id))) {
            this[action].active=true;
            var args = data.split(":");
            this[action].time = parseInt(args[0]);
            if (args.length == 5) {
                this[action].by = args[1];
                this[action].expires = parseInt(args[2]);
                this[action].reason = args.slice(4).join(":");
            }
        }
    }
}


POUser.prototype.toString = function() {
    return "[object POUser]";
}

POUser.prototype.expired = function(thingy) {
    return this[thingy].expires != 0 && this[thingy].expires < sys.time();
}

POUser.prototype.activate = function(thingy, by, expires, reason, persistent) {
    this[thingy].active = true;
    this[thingy].by = by;
    this[thingy].expires = expires;
    this[thingy].time = parseInt(sys.time());
    this[thingy].reason = reason;
    if (persistent) {
        var table = {"mute": mutes, "smute": smutes, "mban": mbans}
        table[thingy].add(sys.ip(this.id), sys.time() + ":" + by + ":" + expires + ":" + sys.name(this.id) + ":" + reason);
    }
    if (thingy == "mute") {
        if (typeof trollchannel != "undefined" && sys.channel(trollchannel) !== undefined && !sys.isInChannel(this.id, trollchannel)) {
            sys.putInChannel(this.id, trollchannel);
        }
    }
    if (thingy == "mban") {
        sys.kick(this.id, mafiachan);
        var name = mafia.correctCase(sys.name(this.id));
        if (mafia.isInGame(name)) {
            mafia.removePlayer(name);
            mafia.testWin();
        }
    }
}

POUser.prototype.un = function(thingy) {
    this[thingy].active = false;
    this[thingy].expires = 0;
    var table = {"mute": mutes, "smute": smutes, "mban": mbans}
    table[thingy].remove(sys.ip(this.id));

    if (thingy == "mute") {
        if (typeof trollchannel != "undefined" && sys.channel(trollchannel) !== undefined && sys.isInChannel(this.id, trollchannel)) {
            sys.kick(this.id, trollchannel);
            if (sys.isInChannel(this.id, 0) != true) {
                sys.putInChannel(this.id, 0)
            }
        }
    }
}

POUser.prototype.reloadwfb = function() {
    if (SESSION.global() === undefined)
        return;
    var n = sys.name(this.id).toLowerCase();
    this.wfbmsg = SESSION.global().wfbset && SESSION.global().wfbset.hasOwnProperty(n)
        ?  SESSION.global().wfbset[n] : undefined;
}

/* POChannel */
function POChannel(id)
{
    this.id = id;
    this.masters = [];
    this.operators = [];
    this.perm = false;
    this.inviteonly = 0;
    this.invitelist = [];
    this.topic = "";
    this.topicSetter = "";
    this.muteall = undefined;
    this.meoff = undefined;
    this.muted = {ips: {}};
    this.banned = {ips: {}};
    this.ignorecaps = false;
    this.ignoreflood = false;
}

POChannel.prototype.toString = function() {
    return "[object POChannel]";
}

POChannel.prototype.setTopic = function(src, topicInfo)
{
    var canSetTopic = (sys.auth(src) > 0 || this.isChannelOperator(src));
    if (topicInfo == undefined) {
        if (typeof this.topic != 'undefined') {
            channelbot.sendChanMessage(src, "Topic for this channel is: " + this.topic);
            if (SESSION.channels(channel).topicSetter) {
                channelbot.sendChanMessage(src, "Topic was set by " + nonFlashing(this.topicSetter));
            }
        } else {
            channelbot.sendChanMessage(src, "No topic set for this channel.");
        }
        if (canSetTopic) {
            channelbot.sendChanMessage(src, "Specify a topic to set one!");
        }
        return;
    }
    if (!canSetTopic) {
        channelbot.sendChanMessage(src, "You don't have the rights to set topic");
        return;
    }
    this.topic = topicInfo;
    this.topicSetter = sys.name(src);
    SESSION.global().channelManager.updateChannelTopic(sys.channel(this.id), topicInfo, sys.name(src));
    channelbot.sendChanAll("" + sys.name(src) + " changed the topic to: " + topicInfo);
}

POChannel.prototype.isChannelMaster = function(id)
{
    return this.masters.indexOf(sys.name(id).toLowerCase()) > -1;
}
POChannel.prototype.isChannelOperator = function(id)
{
    return this.isChannelMaster(id) || this.operators.indexOf(sys.name(id).toLowerCase()) != -1;
}
POChannel.prototype.issueAuth = function(src, name, authlist)
{
    var lname;
    var role = authlist.substring(0, authlist.length-1);
    var tar = sys.id(name);
    if (tar !== undefined) {
        name = sys.name(tar);
        lname = name.toLowerCase();
        if (this[authlist].indexOf(lname) == -1) {
            this[authlist].push(lname);
            channelbot.sendChanMessage(src, "" + name + " is now a channel " + role + ".");
            channelbot.sendChanMessage(tar, "You are now a channel " + role + ".");
            channelbot.sendChanAll(name + " is now a channel " + role + ".");
        } else {
            channelbot.sendChanMessage(src, "" + name + " is already a channel " + role + ".");
        }
    } else {
        name = lname = name.toLowerCase();
        if (this[authlist].indexOf(lname) == -1) {
            this[authlist].push(lname);
            channelbot.sendChanMessage(src, "" + name + " is now a channel " + role + ".");
            channelbot.sendChanAll(name + " is now a channel " + role + ".");
        } else {
            channelbot.sendChanMessage(src, "" + name + " is already a channel " + role + ".");
        }
    }
}

POChannel.prototype.takeAuth = function(src, name, authlist)
{
    var role = authlist.substring(0, authlist.length-1);
    name = name.toLowerCase();
    var index = this[authlist].indexOf(name);
    if (index == -1 && name[0] == "~") {
        index = parseInt(name.substr(1));
        name = this[authlist][index];
    }
    if (index != -1) {
        this[authlist].splice(index,1);
        channelbot.sendChanMessage(src, "" + name + " is no more a channel " + role +".");
        channelbot.sendChanAll(name + " is no more a channel " + role + ".");
    } else {
        channelbot.sendChanMessage(src, "" + name + ": no such "+ role +".");
    }
}

POChannel.prototype.addOperator = function(src, name)
{
    this.issueAuth(src, name, "operators");
    SESSION.global().channelManager.updateOperators(sys.channel(this.id), this.operators);
}
POChannel.prototype.removeOperator = function(src, name)
{
    this.takeAuth(src, name, "operators");
    SESSION.global().channelManager.updateOperators(sys.channel(this.id), this.operators);
}

POChannel.prototype.addOwner = function(src, name)
{
    this.issueAuth(src, name, "masters");
    SESSION.global().channelManager.updateMasters(sys.channel(this.id), this.masters);
}
POChannel.prototype.removeOwner = function(src, name)
{
    this.takeAuth(src, name, "masters");
    SESSION.global().channelManager.updateMasters(sys.channel(this.id), this.masters);
}

POChannel.prototype.register = function(name)
{
    if (this.masters.length == 0) {
        this.masters.push(name.toLowerCase());
        return true;
    }
    return false;
}

POChannel.prototype.allowed = function(id, what)
{
    if (sys.auth(id) > 0)
        return true;
    if (this[what]) {
        var ip = sys.ip(id);
        if (this[what].ips.hasOwnProperty(ip))
            return false;
    }
    return true;
}
POChannel.prototype.canJoin = function(id)
{
    return this.allowed(id, "banned") || this.isChannelOperator(id);
}

POChannel.prototype.canTalk = function(id)
{
    return this.allowed(id, "muted") || this.isChannelOperator(id);
}

POChannel.prototype.disallow = function(data, what)
{
    var id = sys.id(data);
    var ip = id ? sys.ip(id) : sys.dbIp(data);
    if (ip) {
        this[what].ips[ip] = data;
        return true;
    }
    return false;
}

POChannel.prototype.allow = function(data, what)
{
    var id = sys.id(data);
    var ip = id ? sys.ip(id) : sys.dbIp(data);
    if (this[what].ips.hasOwnProperty(ip)) {
        delete this[what].ips[ip];
        return true;
    }
    if (this[what].ips.hasOwnProperty(data)) {
        delete this[what].ips[data];
        return true;
    }
    return false;
}

POChannel.prototype.ban = function(data)
{
    return this.disallow(data, "banned");
}

POChannel.prototype.unban = function(data)
{
    return this.allow(data, "banned");
}

POChannel.prototype.mute = function(data)
{
    return this.disallow(data, "muted");
}

POChannel.prototype.unmute = function(data)
{
    return this.allow(data, "muted");
}

/* Object that manages channels */
function POChannelManager(fname)
{
    /* Permanent channels */
    this.channelDataFile = fname;
    try {
        this.channelData = JSON.parse(sys.getFileContent(this.channelDataFile));
    } catch (err) {
        print('Could not read channelData.');
        print('Error: ' + err);
        this.channelData = {};
    }
}

POChannelManager.prototype.toString = function()
{
    return "[object POChannelManager]";
}

POChannelManager.prototype.updateChannelTopic = function(channelName, topic, name)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].topic = topic;
    this.channelData[channelName].topicSetter = name;
    this.save();
}

POChannelManager.prototype.updateChannelPerm = function(channelName, perm)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].perm = perm;
    this.save();
}

POChannelManager.prototype.updateOperators = function(channelName, operators)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].operators = operators;
    this.save();
}

POChannelManager.prototype.updateMasters = function(channelName, masters)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].masters = masters;
    this.save();
}

POChannelManager.prototype.update = function(channelName, chan)
{
    this.ensureChannel(channelName);
    this.channelData[channelName].topic = chan.topic;
    this.channelData[channelName].topicSetter = chan.topicSetter;
    this.channelData[channelName].perm = chan.perm;
    this.channelData[channelName].masters = chan.masters;
    this.channelData[channelName].operators = chan.operators;
    this.save();
}

POChannelManager.prototype.save = function()
{
    sys.writeToFile(this.channelDataFile, JSON.stringify(this.channelData));
}

POChannelManager.prototype.ensureChannel = function(channelName)
{
    if (!(channelName in this.channelData)) {
        this.channelData[channelName] = {};
        this.channelData[channelName].topic = '';
        this.channelData[channelName].topicSetter = '';
        this.channelData[channelName].perm = false;
        this.channelData[channelName].masters = [];
        this.channelData[channelName].operators = [];
    }
}

POChannelManager.prototype.createPermChannel = function(name, defaultTopic)
{
    var cid;
    if (sys.existChannel(name)) {
        cid = sys.channelId(name);
    } else {
        cid = sys.createChannel(name);
    }
    this.restoreSettings(cid);
    if (!SESSION.channels(cid).topic) {
        SESSION.channels(cid).topic = defaultTopic;
    }
    SESSION.channels(cid).perm = true;
    return cid;
}

POChannelManager.prototype.restoreSettings = function(cid)
{
    var chan = SESSION.channels(cid);
    var name = sys.channel(cid)
    if (name in this.channelData) {
        var data = this.channelData[name];
        ['topic', 'topicSetter', 'operators', 'masters', 'perm'].forEach(
            function(attr) {
                if (data[attr] !== undefined)
                    chan[attr] = data[attr];
            }
        );
    }
}

function POGlobal(id)
{
    this.mafia = undefined;
    this.coins = 0;
    this.channelManager = new POChannelManager('channelData.json');
    var manager = this.channelManager;
    sys.channelIds().forEach(function(id) {
        manager.restoreSettings(id);
    });
    try {
        this.wfbset = JSON.parse(sys.getFileContent('wfbset.json'));
    } catch (e) {
        this.wfbset = {};
    }
    sys.playerIds().forEach(function(id) {
        SESSION.players(id).reloadwfb();
    });
}

SESSION.identifyScriptAs("PO Scripts v0.004");
SESSION.registerGlobalFactory(POGlobal);
SESSION.registerUserFactory(POUser);
SESSION.registerChannelFactory(POChannel);

if (typeof SESSION.global() != 'undefined') {
    // keep the state of mafia if it hasn't been updated
    if (SESSION.global().mafia === undefined || SESSION.global().mafia.version !== undefined && SESSION.global().mafia.version < mafia.version) {
        SESSION.global().mafia = mafia;
        if (typeof mafiachan != 'undefined') {
            mafiabot.sendAll("Mafia game was updated!", mafiachan);
            mafia.themeManager.loadThemes();
        }
    } else {
        mafia = SESSION.global().mafia;
    }
    SESSION.global().channelManager = new POChannelManager('channelData.json');

    // uncomment to update either Channel or User


    sys.channelIds().forEach(function(id) {
        if (!SESSION.channels(id))
            sys.sendAll("ScriptUpdate: SESSION storage broken for channel: " + sys.channel(id), staffchannel);
        else
            SESSION.channels(id).__proto__ = POChannel.prototype;
    });


    sys.playerIds().forEach(function(id) {
        if (sys.loggedIn(id)) {
            if (!SESSION.users(id))
                sys.sendAll("ScriptUpdate: SESSION storage broken for user: " + sys.name(id), staffchannel);
            else
                SESSION.users(id).__proto__ = POUser.prototype;
        }
    });

}

function nonFlashing(name) {
    return name[0] + '\u200b' + name.substr(1)
}

/* Bots */
function Bot(name) {
    this.name = name;
}
Bot.prototype.formatMsg = function(message)
{
    return "±" + this.name + ": " + message;
}
/* Shortcuts to sys functions */
Bot.prototype.sendAll = function(message, channel)
{
    if (channel === undefined)
        sys.sendAll(this.formatMsg(message));
    else
        sys.sendAll(this.formatMsg(message), channel);
}
Bot.prototype.sendMessage = function(tar, message, channel)
{
    if (channel === undefined)
        sys.sendMessage(tar, this.formatMsg(message));
    else
        sys.sendMessage(tar, this.formatMsg(message), channel);
}
/* Shortcuts to shortcut functions */
Bot.prototype.sendMainTour = function(message)
{
    sendMainTour(this.formatMsg(message));
}
Bot.prototype.sendChanMessage = function(tar, message)
{
    sendChanMessage(tar, this.formatMsg(message));
}
Bot.prototype.sendChanAll = function(message)
{
    sendChanAll(this.formatMsg(message));
}

normalbot = bot = new Bot(Config.bot);
mafiabot = new Bot(Config.Mafia.bot);
channelbot = new Bot(Config.channelbot);
kickbot = new Bot(Config.kickbot);
capsbot = new Bot(Config.capsbot);
checkbot = new Bot(Config.checkbot);
coinbot = new Bot(Config.coinbot);
countbot = new Bot(Config.countbot);
tourneybot = new Bot(Config.tourneybot);
rankingbot = new Bot(Config.rankingbot);
battlebot = new Bot(Config.battlebot);
commandbot = new Bot(Config.commandbot);
querybot = new Bot(Config.querybot);

var commands = {
    user:
    [
        "/rules: Shows the rules",
        "/join: Enters you to in a tournament.",,
        "/ranking: Shows your ranking in your current tier.",
        "/myalts: Lists your alts.",
        "/me [message]: Sends a message with *** before your name.",
        "/selfkick: Kicks all other accounts with IP.",
        "/importable: Posts an importable of your team to pastebin.",
        "/dwreleased [Pokemon]: Shows the released status of a Pokemon's Dream World Ability",
        "/register: Registers a channel with you as owner.",
        "/resetpass: Clears your password (unregisters you, remember to reregister).",
        "/auth [owners/admins/mods]: Lists auth of given level, shows all auth if left blank.",
        "/cauth: Lists all users with channel auth in the current channel.",
        "/megausers: Lists megausers.",
        "/contributors: Lists contributors.",
        "/league: Lists gym leaders and elite four of the PO league.",
        "/uptime: Shows time since the server was last offline.",
        "/players: Shows the number of players online.",
        "/unjoin: Withdraws you from a tournament.",
        "/viewround: Shows the current pairings for the round.",
        "/viewtiers: Shows the recently played tournaments, which can't be started currently.",
        "/sameTier [on/off]: Turn on/off auto-rejection of challenges from players in a different tier from you.",
        "/tourrankings: Shows recent tournament winners.",
        "/tourranking [tier]: Shows recent tourney winners in a specific tier.",
        "/tourdetails [name]: Shows a user's tourney stats.",
        "/lastwinners: Shows details about recent tournaments.",
    ],
    megauser:
    [
        "/tour [tier]:[number]: Starts a tournament in set tier for the selected number of players.",
        "/endtour: Ends the current tournament.",
        "/dq name: Disqualifies someone in the tournament.",
        "/push name: Adds a user to the tournament.",
        "/changecount [entrants]: Changes the number of entrants during the signup phase.",
        "/sub name1:name2: Replaces name1 with name2 in the tournament.",
        "/cancelBattle name1: Allows the user or their opponent to forfeit without leaving the tournament their current battle so they can battle again with correct clauses."
    ],
    channel:
    [
        "/topic [topic]: Sets the topic of a channel. Only works if you're the first to log on a channel or have auth there. Displays current topic instead if no new one is given.",
        "/ck [name]: Kick someone from current channel.",
        "/inviteonly [on|off]: Makes a channel invite-only or public.",
        "/invite [name]: Invites a user to current channel.",
        "/op [name]: Gives a user operator status.",
        "/deop [name]: Removes operator status from a user.",
        "/csilence [minutes]: Prevents authless users from talking in current channel specified time.",
        "/csilenceoff: Allows users to talk in current channel.",
        "/cmute [name]: Mutes someone in current channel.",
        "/cunmute [name]: Unmutes someone in current channel.",
        "/cmutes: Lists users muted in current channel.",
        "/cbans: Lists users banned from current channel.",
        "Only channel masters may use the following commands:",
        "/ctogglecaps: Turns on/off the server anti-caps bot in current channel.",
        "/ctoggleflood: Turns on/off the server anti-flood bot in current channel. Overactive still in effect.",
        "/cban [name]: Bans someone from current channel.",
        "/cunban [name]: Unbans someone from current channel.",
        "/owner [name]: Gives a user owner status.",
        "/deowner [name]: Removes owner status from a user.",
    ],
    mod:
    [
        "/k [name]: Kicks someone.",
        "/mute [name]:[reason]:[time]: Mutes someone. Time is optional and defaults to 12 hours.",
        "/unmute [name]: Unmutes someone.",
        "/wfb [target]: Warns a user about asking for battles.",
        "/wfbset [message]: Sets your personal warning message, {{user}} will be replaced by the target.",
        "/silence [minutes]:[channel]: Prevents authless users from talking in a channel for specified time. Affects all official channels if no channel is given.",
        "/silenceoff [channel]: Removes silence from a channel. Affects all official channels if none is specified.",
        "/meoff [channel], /meon [channel]: Disables/enables the /me command. Affects all channels if no channel is specified.",
        "/perm [on/off]: Make the current permanent channel or not (permanent channels remain listed when they have no users).",
        "/userinfo [name]: Displays information about a user (pretty display).",
        "/whois [name]: Displays information about a user (one line, slightly more info).",
        "/aliases [IP]: Shows the aliases of an IP.",
        "/tempban [name]:[minutes]: Bans someone for an hour or less.",
        "/tempunban [name]: Unbans a temporary banned user (standard unban doesn't work).",
        "/mafiaban [name]:[reason]:[time]: Bans a player from Mafia. Time is optional and defaults to 7 days.",
        "/mafiaunban [name]: Unbans a player from Mafia.",
        "/passauth [target]: Passes your mods to another megauser (only for mega-mods) or to your online alt.",
        "/passauths [target]: Passes your mods silently.",
        "/banlist [search term]: Searches the banlist, shows full list if no search term is entered.",
        "/mutelist [search term]: Searches the mutelist, shows full list if no search term is entered.",
        "/smutelist [search term]: Searches the smutelist, shows full list if no search term is entered.",
        "/mafiabans [search term]: Searches the mafiabanlist, shows full list if no search team is entered.",
        "/rangebans: Lists range bans.",
        "/tempbans: Lists temp bans.",
        "/namebans: Lists name bans.",
        "/endcalls: Ends the next periodic message.",
    ],
    admin:
    [
        "/ban [name]: Bans a user.",
        "/unban [name]: Unbans a user.",
        "/smute xxx: Secretly mutes a user. Can't smute auth.",
        "/sunmute xxx: Removes secret mute from a user.",
        "/megauser[off] xxx: Adds or removes megauser powers from someone.",
        "/memorydump: Shows the state of the memory.",
        "/nameban regexp: Adds a regexp ban on usernames.",
        "/nameunban full_regexp: Removes a regexp ban on usernames.",
        "/destroychan [channel]: Destroy a channel (official channels are protected).",
        "/channelusers [channel]: Lists users on a channel."
    ],
    owner:
    [
        "/changeRating [player] -- [tier] -- [rating]: Changes the rating of a rating abuser.",
        "/stopBattles: Stops all new battles to allow for server restart with less problems for users.",
        "/imp [name]: Lets you speak as someone",
        "/impOff: Stops your impersonating.",
        "/contributor[off] xxx:what: Adds or removes contributor status (for indigo access) from someone, with reason.",
        "/clearpass [name]: Clears a user's password.",
        "/periodicsay minutes:channel1,channel2,...:[message]: Sends a message to specified channels periodically.",
        "/sendAll [message]: Sends a message to everyone.",
        "/changeAuth [auth] [name]: Changes the auth of a user.",
        "/showteam xxx: Displays the team of a user (to help people who have problems with event moves or invalid teams).",
        "/rangeban [ip] [comment]: Makes a range ban.",
        "/rangeunban: [ip]: Removes a rangban.",
        "/purgemutes [time]: Purges old mutes. Time is given in seconds. Defaults is 4 weeks.",
        "/purgembans [time]: Purges old mafiabans. Time is given in seconds. Default is 1 week.",
        "/writetourstats: Forces a writing of tour stats to tourstats.json.",
        "/reloadtourstats: Forces a reload of tour stats from tourstats.json.",
        "/resettourstats: Resets tournament winners.",
        "/updateScripts: Updates scripts from the web."
    ]
};

({
/* Executed every second */
stepEvent: function() {
    try {
        mafia.tickDown();
    } catch(err) {
        mafiabot.sendAll("error occurred: " + err, mafiachan);
    }
}
,

repeatStepEvent: function(globalCounter) {
    if (stepCounter != globalCounter) {
        return;
    }

    stepCounter = stepCounter+1;
    sys.callQuickly("script.repeatStepEvent(" + stepCounter + ")", 1000);

    /* Using script. instead of this. so as to stop it when this function is removed */
    script.stepEvent();
}

,
startStepEvent: function() {
    stepCounter = 0;

    this.repeatStepEvent(0);
}
,
serverStartUp : function() {
    startUpTime = parseInt(sys.time());
    scriptChecks = 0;
    this.init();
}

,
init : function() {
    lastMemUpdate = 0;
    this.startStepEvent();

    mafiachan = SESSION.global().channelManager.createPermChannel("Mafia Channel", "Use /help to get started!");
    staffchannel = SESSION.global().channelManager.createPermChannel("Indigo Plateau", "Welcome to the Staff Channel! Discuss of all what users shouldn't hear here! Or more serious stuff...");
    tourchannel = SESSION.global().channelManager.createPermChannel("Tournaments", 'Useful commands are "/join" (to join a tournament), "/unjoin" (to leave a tournament), "/viewround" (to view the status of matches) and "/megausers" (for a list of users who manage tournaments). Please read the full Tournament Guidelines: http://pokemon-online.eu/forums/showthread.php?2079-Tour-Rules');
    shanaitourchannel = tourchannel; //SESSION.global().channelManager.createPermChannel("Tours", 'Shanai Tours');
    SESSION.global().channelManager.createPermChannel("League", "Challenge the PO League here! For more information, please visit this link: http://pokemon-online.eu/forums/forumdisplay.php?36-PO-League");
    trollchannel = SESSION.global().channelManager.createPermChannel("Mute City", 'This is a place to talk if you have been muted! Please behave, next stop will be bans.');

    var dwlist = ["Rattata", "Raticate", "Nidoran-F", "Nidorina", "Nidoqueen", "Nidoran-M", "Nidorino", "Nidoking", "Oddish", "Gloom", "Vileplume", "Bellossom", "Bellsprout", "Weepinbell", "Victreebel", "Ponyta", "Rapidash", "Farfetch'd", "Doduo", "Dodrio", "Exeggcute", "Exeggutor", "Lickitung", "Lickilicky", "Tangela", "Tangrowth", "Kangaskhan", "Sentret", "Furret", "Cleffa", "Clefairy", "Clefable", "Igglybuff", "Jigglypuff", "Wigglytuff", "Mareep", "Flaaffy", "Ampharos", "Hoppip", "Skiploom", "Jumpluff", "Sunkern", "Sunflora", "Stantler", "Poochyena", "Mightyena", "Lotad", "Ludicolo", "Lombre", "Taillow", "Swellow", "Surskit", "Masquerain", "Bidoof", "Bibarel", "Shinx", "Luxio", "Luxray", "Psyduck", "Golduck", "Growlithe", "Arcanine", "Scyther", "Scizor", "Tauros", "Azurill", "Marill", "Azumarill", "Bonsly", "Sudowoodo", "Girafarig", "Miltank", "Zigzagoon", "Linoone", "Electrike", "Manectric", "Castform", "Pachirisu", "Buneary", "Lopunny", "Glameow", "Purugly", "Natu", "Xatu", "Skitty", "Delcatty", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Bulbasaur", "Charmander", "Squirtle", "Ivysaur", "Venusaur", "Charmeleon", "Charizard", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Infernape", "Monferno", "Piplup", "Prinplup", "Empoleon", "Treecko", "Sceptile", "Grovyle", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Caterpie", "Metapod", "Butterfree", "Pidgey", "Pidgeotto", "Pidgeot", "Spearow", "Fearow", "Zubat", "Golbat", "Crobat", "Aerodactyl", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Yanma", "Yanmega", "Murkrow", "Honchkrow", "Delibird", "Wingull", "Pelipper", "Swablu", "Altaria", "Starly", "Staravia", "Staraptor", "Gligar", "Gliscor", "Drifloon", "Drifblim", "Skarmory", "Tropius", "Chatot", "Slowpoke", "Slowbro", "Slowking", "Krabby", "Kingler", "Horsea", "Seadra", "Kingdra", "Goldeen", "Seaking", "Magikarp", "Gyarados", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Wooper", "Quagsire", "Qwilfish", "Corsola", "Remoraid", "Octillery", "Mantine", "Mantyke", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Barboach", "Whiscash", "Clamperl", "Gorebyss", "Huntail", "Relicanth", "Luvdisc", "Buizel", "Floatzel", "Finneon", "Lumineon", "Tentacool", "Tentacruel", "Corphish", "Crawdaunt", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Shellos", "Gastrodon", "Lapras", "Dratini", "Dragonair", "Dragonite", "Elekid", "Electabuzz", "Electivire", "Poliwag", "Poliwrath", "Politoed", "Poliwhirl", "Vulpix", "Ninetales", "Musharna", "Munna", "Darmanitan", "Darumaka", "Mamoswine", "Togekiss", "Burmy", "Wormadam", "Mothim", "Pichu", "Pikachu", "Raichu","Abra","Kadabra","Alakazam","Spiritomb","Mr. Mime","Mime Jr.","Meditite","Medicham","Meowth","Persian","Shuppet","Banette","Spinarak","Ariados","Drowzee","Hypno","Wobbuffet","Wynaut","Snubbull","Granbull","Houndour","Houndoom","Smoochum","Jynx","Ralts","Gardevoir","Gallade","Sableye","Mawile","Volbeat","Illumise","Spoink","Grumpig","Stunky","Skuntank","Bronzong","Bronzor","Mankey","Primeape","Machop","Machoke","Machamp","Magnemite","Magneton","Magnezone","Koffing","Weezing","Rhyhorn","Rhydon","Rhyperior","Teddiursa","Ursaring","Slugma","Magcargo","Phanpy","Donphan","Magby","Magmar","Magmortar","Larvitar","Pupitar","Tyranitar","Makuhita","Hariyama","Numel","Camerupt","Torkoal","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Absol","Beldum","Metang","Metagross","Hippopotas","Hippowdon","Skorupi","Drapion","Tyrogue","Hitmonlee","Hitmonchan","Hitmontop","Bagon","Shelgon","Salamence","Seel","Dewgong","Shellder","Cloyster","Chinchou","Lanturn","Smeargle"];
    /* use hash for faster lookup */
    dwpokemons = {};
    var announceChan = (typeof staffchannel == "number") ? staffchannel : 0;
    for(var dwpok in dwlist) {
        var num = sys.pokeNum(dwlist[dwpok]);
        if (num === undefined)
            sys.sendAll("Script Check: Unknown poke in dwpokemons: '" +dwlist[dwpok]+"'.", announceChan);
        else if (dwpokemons[num] === true)
            sys.sendAll("Script Check: dwpokemons contains '" +dwlist[dwpok]+"' multiple times.", announceChan);
        else
            dwpokemons[sys.pokeNum(dwlist[dwpok])] = true;
    }
    // Set these manually as older version have problems with spaces in pokemon names
    dwpokemons[122] = true; // Mr Mime
    dwpokemons[439] = true; // Mime Jr

    var lclist = ["Bulbasaur", "Charmander", "Squirtle", "Croagunk", "Turtwig", "Chimchar", "Piplup", "Treecko","Torchic","Mudkip"]
    lcpokemons = [];
    for(var dwpok in lclist) {
        lcpokemons.push(sys.pokeNum(lclist[dwpok]));
    }
    bannedGSCSleep = [sys.moveNum("Spore"), sys.moveNum("Hypnosis"), sys.moveNum("Lovely Kiss"), sys.moveNum("Sing"), sys.moveNum("Sleep Powder")].sort();
    bannedGSCTrap = [sys.moveNum("Mean Look"), sys.moveNum("Spider Web")].sort();

    var breedingList = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Mamoswine", "Togekiss","Hitmonlee","Hitmonchan","Hitmontop","Tyrogue"];
    breedingpokemons = [];
    for(var inpok in breedingList) {
        breedingpokemons.push(sys.pokeNum(breedingList[inpok]));
    }

    /* restore mutes, smutes, mafiabans, rangebans, megausers */
    mutes = new MemoryHash("mutes.txt");
    mbans = new MemoryHash("mbans.txt");
    smutes = new MemoryHash("smutes.txt");
    rangebans = new MemoryHash("rangebans.txt");
    contributors = new MemoryHash("contributors.txt");
    mafiaAdmins = new MemoryHash("mafiaadmins.txt");

            rules = [ "",
    "*** Rules ***",
    "",
    "Rule #1 - Do Not Abuse CAPS:",
    "- The occasional word in CAPS is acceptable, however repeated use is not.",
    "Rule #2 - No Flooding the Chat:",
    "- Please do not post a large amount of short messages when you can easily post one or two long messages.",
    "Rule #3 - Do not Challenge Spam:",
    "- If a person refuses your challenge, this means they do not want to battle you. Find someone else to battle with.",
    "Rule #4 - Don't ask for battles in the main chat:",
    "- There is a 'Find Battle' tab that you can use to find a battle immediately. If after a while you cannot find a match, then you can ask for one in the chat.",
    "Rule #5 - No Trolling/Flaming/Insulting of Any kind:",
    "- Behaving stupidly and excessive vulgarity will not be tolerated, using words including 'fuck' is a bad starting point.",
    "Rule #6 - Be Respectable of Each Others Cultures:",
    "- Not everyone speaks the same language. This server is not an English-Only Server. Do not tell someone to only speak a certain language.",
    "Rule #7 - No Advertising:",
    "- There will be absolutely no advertising on the server.",
    "Rule #8 - No Obscene or Pornographic Content Allowed:",
    "- This includes links, texts, images, and any other kind of media. This will result in an instant ban.",
    "Rule #9 - Do not ask for Auth:",
    "- Authority is given upon merit. By asking you have pretty much eliminated your chances at becoming an Auth in the future.",
    "Rule #10 - Do not Insult Auth:",
    "- Insulting Auth will result in immediate punishment. ",
    "Rule #11 - No minimodding:",
    "- Server has moderators for a reason. If someone breaks the rules, alert the auth, do not try to moderate yourself."
    ];

    if (typeof authStats == 'undefined')
        authStats = {};

    if (typeof tempBans == 'undefined') {
        tempBans = {};
    }
    if (typeof nameBans == 'undefined') {
        nameBans = [];
        try {
            var serialized = JSON.parse(sys.getFileContent("nameBans.json"));
            for (var i = 0; i < serialized.nameBans.length; ++i) {
                nameBans.push(new RegExp(serialized.nameBans[i], "i"));
            }
        } catch (e) {
            // ignore
        }
    }

    isSuperAdmin = function(id) {
        if (typeof Config.superAdmins != "object" || Config.superAdmins.length === undefined) return false;
        if (sys.auth(id) != 2) return false;
        var name = sys.name(id);
        for (var i = 0; i < Config.superAdmins.length; ++i) {
            if (cmp(name, Config.superAdmins[i]))
                return true;
        }
        return false;
    }

    if (typeof VarsCreated != 'undefined')
        return;

    key = function(a,b) {
        return a + "*" + sys.name(b);
    }

    saveKey = function(thing, id, val) {
        sys.saveVal(key(thing,id), val);
    }

    getKey = function(thing, id) {
        return sys.getVal(key(thing,id));
    }

    cmp = function(a, b) {
        return a.toLowerCase() == b.toLowerCase();
    }

    battlesStopped = false;

    megausers = sys.getVal("megausers");

    muteall = false;

    maxPlayersOnline = 0;

    lineCount = 0;
    tourmode = 0;

    tourwinners = [];
    tourstats = {};
    tourrankingsbytier = {};
    try {
        var jsonObject = JSON.parse(sys.getFileContent('tourstats.json'));
        tourwinners = jsonObject.tourwinners;
        tourstats = jsonObject.tourstats;
        tourrankingsbytier = jsonObject.tourrankingsbytier;
    } catch (err) {
        print('Could not read tourstats, initing to null stats.');
        print('Error: ' + err);
    }

    border = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:";

    pokeNatures = [];

    var list = "Heatran-Eruption/Quiet=Suicune-ExtremeSpeed/Relaxed|Sheer Cold/Relaxed|Aqua Ring/Relaxed|Air Slash/Relaxed=Raikou-ExtremeSpeed/Rash|Weather Ball/Rash|Zap Cannon/Rash|Aura Sphere/Rash=Entei-ExtremeSpeed/Adamant|Flare Blitz/Adamant|Howl/Adamant|Crush Claw/Adamant=Snivy-Aromatherapy/Hardy|Synthesis/Hardy";

    var sepPokes = list.split('=');
    for (var x in sepPokes) {
        sepMovesPoke = sepPokes[x].split('-');
        sepMoves = sepMovesPoke[1].split('|');

        var poke = sys.pokeNum(sepMovesPoke[0]);
        pokeNatures[poke] = [];

        for (var y = 0; y < sepMoves.length; ++y) {
            movenat = sepMoves[y].split('/');
            pokeNatures[poke][sys.moveNum(movenat[0])] = sys.natureNum(movenat[1]);
        }
    }

    amoebaGame.init();

    try {
        pastebin_api_key = sys.getFileContent("pastebin_api_key").replace("\n", "");
        pastebin_user_key = sys.getFileContent("pastebin_user_key").replace("\n", "");
    } catch(e) {
        normalbot.sendAll("Couldn't load api keys: " + e, staffchannel);
    }


    /* global utility helpers */
    getSeconds = function(s) {
        var parts = s.split(" ")
        var secs = 0;
        for (var i = 0; i < parts.length; ++i) {
            var c = (parts[i][parts[i].length-1]).toLowerCase();
            var mul = 60;
            if (c == "s") { mul = 1; }
            else if (c == "m") { mul = 60; }
            else if (c == "h") { mul = 60*60; }
            else if (c == "d") { mul = 24*60*60; }
            else if (c == "w") { mul = 7*24*60*60; }
            secs += mul * parseInt(parts[i]);
        }
        return secs;
    };
    getTimeString = function(sec) {
        s = [];
        var n;
        var d = [[7*24*60*60, "week"], [24*60*60, "day"], [60*60, "hour"], [60, "minute"], [1, "second"]];
        for (j = 0; j < 5; ++j) {
            n = parseInt(sec / d[j][0]);
            if (n > 0) {
                s.push((n + " " + d[j][1] + (n > 1 ? "s" : "")));
                sec -= n * d[j][0];
                if (s.length >= 2) break;
            }
        }
        return s.join(", ");
    };

    sendChanMessage = function(id, message) {
        sys.sendMessage(id, message, channel);
    }

    sendChanAll = function(message) {
        sys.sendAll(message, channel);
    }

    sendMainTour = function(message) {
        sys.sendAll(message, 0);
        sys.sendAll(message, tourchannel);
    }

    mafia.themeManager.loadThemes();
    VarsCreated = true;
} /* end of init */

,

issueBan : function(type, src, tar, commandData, maxTime) {
        var memoryhash = {"mute": mutes, "mban": mbans, "smute": smutes}[type];
        var banbot = type == "mban" ? mafiabot : normalbot;
        var verb = {"mute": "muted", "mban": "banned from mafia", "smute": "secretly muted"}[type];
        var nomi = {"mute": "mute", "mban": "ban from mafia", "smute": "secret mute"}[type];
        var sendAll = (type == "smute") ? function(line) { banbot.sendAll(line, staffchannel); } : function(line) { banbot.sendAll(line); };

        var expires = 0;
        var defaultTime = {"mute": "24h", "mban": "7d", "smute": "0"}[type];
        var reason = "";
        var timeString = "";
        var tindex = 10;
        var data = [];
        var ip;
        if (tar == undefined) {
            data = commandData.split(":");
            if (data.length > 1) {
                commandData = data[0];
                tar = sys.id(commandData);

                if (data.length > 2 && /http$/.test(data[1])) {
                    reason = data[1] + ":" + data[2];
                    tindex = 3;
                } else {
                    reason = data[1];
                    tindex = 2;
                }
                if (tindex==data.length && reason.length > 0 && reason.charCodeAt(0) >= 48 && reason.charCodeAt(0) <= 57) {
                    tindex-=1;
                    reason="";
                }
            }
        }

        var secs = getSeconds(data.length > tindex ? data[tindex] : defaultTime);
        // limit it!
        if (typeof maxTime == "number") secs = secs > maxTime ? maxTime : secs;
        if (secs > 0) {
            timeString = " for " + getTimeString(secs);
            expires = secs + parseInt(sys.time());
        }

        if (reason == "" && sys.auth(src) < 3) {
           banbot.sendChanMessage(src, "You need to give a reason to the " + nomi + "!");
           return;
        }

        var bannedReasons = ["idiot", "shut up", "fuck"];
        var lreason = reason.toLowerCase();
        for (var i = 0; i < bannedReasons.length; ++i) {
            if (lreason.indexOf(bannedReasons[i]) > -1) {
               banbot.sendChanMessage(src, "Including '" + bannedReasons[i] + "' in the reason is not a good practice!");
               return;
            }
        }

        if (tar == undefined) {
            ip = sys.dbIp(commandData);
            var maxAuth = sys.maxAuth(ip);
            if(maxAuth>=sys.auth(src) && maxAuth > 0) {
               banbot.sendChanMessage(src, "Can't do that to higher auth!");
               return;
            }
            if(ip != undefined) {
                if (memoryhash.get(ip)) {
                    banbot.sendChanMessage(src, "He/she's already " + verb + ".");
                    return;
                }
                sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + timeString + "! [Reason: " + reason + "] [Channel: "+sys.channel(channel) + "]");
                memoryhash.add(ip, sys.time() + ":" + sys.name(src) + ":" + expires + ":" + commandData + ":" + reason);
                var authname = sys.name(src).toLowerCase();
                authStats[authname] =  authStats[authname] || {};
                authStats[authname]["latest" + type] = [commandData, parseInt(sys.time())];
                if (mafia.isInGame(mafia.correctCase(commandData))) {
                    mafia.slayUser(src, commandData);
                }
                return;
            }

            banbot.sendChanMessage(src, "Couldn't find " + commandData);
            return;
        }
        if (SESSION.users(tar)[type].active) {
            banbot.sendChanMessage(src, "He/she's already " + verb + ".");
            return;
        }
        if (sys.auth(tar) >= sys.auth(src) && sys.auth(tar) > 0) {
            banbot.sendChanMessage(src, "You dont have sufficient auth to " + nomi + " " + commandData + ".");
            return;
        }
        // Only slay if the user is actually in the game.
        if (mafia.isInGame(mafia.correctCase(sys.name(tar)))) {
            mafia.slayUser(src, sys.name(tar));
        }
        SESSION.users(tar).activate(type, sys.name(src), expires, reason, true);
        if (reason.length > 0)
            sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + timeString + "! [Reason: " + reason + "] [Channel: "+sys.channel(channel) + "]");
        else
            sendAll("" + commandData + " was " + verb + " by " + nonFlashing(sys.name(src)) + timeString + "! [Channel: "+sys.channel(channel) + "]");

        var authname = sys.name(src).toLowerCase();
        authStats[authname] =  authStats[authname] || {}
        authStats[authname]["latest" + type] = [commandData, parseInt(sys.time())];
}

,

importable : function(id, compactible) {
/*
Tyranitar (M) @ Choice Scarf
Lvl: 100
Trait: Sand Stream
IVs: 0 Spd
EVs: 4 HP / 252 Atk / 252 Spd
Jolly Nature (+Spd, -SAtk)
- Stone Edge
- Crunch
- Superpower
- Pursuit
*/
    if (compactible === undefined) compactible = false;
    var nature_effects = {"Adamant": "(+Atk, -SAtk)", "Bold": "(+Def, -Atk)"}
    var genders = {0: '', 1: ' (M)', 2: ' (F)'};
    var stat = {0: 'HP', 1: 'Atk', 2: 'Def', 3: 'SAtk', 4: 'SDef', 5:'Spd'};
    var hpnum = sys.moveNum("Hidden Power");
    var ret = [];
    for (var i = 0; i < 6; ++i) {
        var poke = sys.teamPoke(id, i);
        if (poke === undefined)
            continue;

        var item = sys.teamPokeItem(id, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        ret.push(sys.pokemon(poke) + genders[sys.teamPokeGender(id, i)] + " @ " + item );
        ret.push('Trait: ' + sys.ability(sys.teamPokeAbility(id, i)));
        var level = sys.teamPokeLevel(id, i);
        if (!compactible && level != 100) ret.push('Lvl: ' + level);

        var ivs = [];
        var evs = [];
        var hpinfo = [sys.gen(id)];
        for (var j = 0; j < 6; ++j) {
            var iv = sys.teamPokeDV(id, i, j);
            if (iv != 31) ivs.push(iv + " " + stat[j]);
            var ev = sys.teamPokeEV(id, i, j);
            if (ev != 0) evs.push(ev + " " + stat[j]);
            hpinfo.push(iv);
        }
        if (!compactible && ivs.length > 0)
            ret.push('IVs: ' + ivs.join(" / "));
        if (evs.length > 0)
            ret.push('EVs: ' + evs.join(" / "));

        ret.push(sys.nature(sys.teamPokeNature(id, i)) + " Nature"); // + (+Spd, -Atk)

        for (var j = 0; j < 4; ++j) {
            var move = sys.teamPokeMove(id, i, j);
            if (move !== undefined) {
                ret.push('- ' + sys.move(move) + (move == hpnum ? ' [' + sys.type(sys.hiddenPowerType.apply(sys, hpinfo)) + ']':''));
            }
        }
        ret.push("")
    }
    return ret;
}

,

canJoinStaffChannel : function(src) {
    var disallowedNames = Config.disallowStaffChannel;
    if (disallowedNames.indexOf(sys.name(src)) > -1)
        return false;

    if (sys.auth(src) > 0)
        return true;
    if (SESSION.users(src).megauser)
        return true;
    if (SESSION.users(src).contributions !== undefined)
        return true;

    var allowedNames = Config.canJoinStaffChannel;
    if (allowedNames.indexOf(sys.name(src)) > -1)
        return true;
    return false;
}

,

kickAll : function(ip) {
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if (ip == sys.ip(current_player)) {
                sys.kick(current_player);
            }
        }
        return;
}

,

beforeChannelJoin : function(src, channel) {
    var poUser = SESSION.users(src);
    var poChannel = SESSION.channels(channel);
    if (amoebaGame.beforeChannelJoin(src, channel))
        return;

    if (poChannel.isChannelOperator(src)){
        return;
    }
    // Can't ban from main
    if (channel == 0) return;

    // Torus redirect
    if (sys.auth(src) == 0 && channel == sys.channelId("Tours")) {
        sys.stopEvent();
        sys.putInChannel(src, tourchannel);
        return;
    }

    var index = poChannel.invitelist.indexOf(src);
    if (index != -1) {
        // allow to bypass all limits if invited
        poChannel.invitelist.splice(index, 1);
        return;
    }
    if (sys.auth(src) < 3 && !poChannel.canJoin(src)) {
        channelbot.sendMessage(src, "You are banned from this channel! You can't join unless channel operators and masters unban you.");
        sys.stopEvent();
        return;
    }
    if (poChannel.inviteonly > sys.auth(src)) {
        sys.sendMessage(src, "+Guard: Sorry, but this channel is for higher authority!")
        sys.stopEvent();
        return;
    }
    if (channel == trollchannel && (!poUser.mute.active && sys.auth(src) <= 1)) {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
    if ((channel == staffchannel || channel == sys.channelId("shanaindigo")) && !this.canJoinStaffChannel(src)) {
        sys.sendMessage(src, "+Guard: Sorry, the access to that place is restricted!");
        sys.stopEvent();
        return;
    }
    if (channel == mafiachan && poUser.mban.active) {
        if (poUser.expired("mban")) {
            poUser.un("mban");
            mafiabot.sendMessage(src, "Your ban from Mafia expired.");
            mafiabot.sendAll("" + sys.name(src) + "'s ban from Mafia expired.", mafiachan);
        } else {

            var mbaninfo = poUser.mban;
            sendChanMessage(src, "+Guard: You are banned from Mafia" + (mbaninfo.by ? " by " + mbaninfo.by : '')+". " + (mbaninfo.expires > 0 ? "Ban expires in " + getTimeString(mbaninfo.expires - parseInt(sys.time())) + ". " : '') + (mbaninfo.reason ? "[Reason: " + mbaninfo.reason + "]" : ''));
            sys.stopEvent();
            return;
        }
    }
} /* end of beforeChannelJoin */

,
beforeChannelCreated : function(chan, name, src) {
    if (name == "x") { sys.stopEvent(); }
},

afterChannelCreated : function (chan, name, src) {
    SESSION.global().channelManager.restoreSettings(chan);
} /* end of afterChannelCreated */

,

afterChannelJoin : function(player, chan) {
    if (typeof SESSION.channels(chan).topic != 'undefined') {
        sys.sendMessage(player, "Welcome Message: " + SESSION.channels(chan).topic, chan);
        /*if (SESSION.channels(chan).topicSetter)
            sys.sendMessage(player, "Set by: " + SESSION.channels(chan).topicSetter, chan);*/
    }
    if (SESSION.channels(chan).isChannelOperator(player)) {
        sys.sendMessage(player, Config.channelbot + ": use /topic <topic> to change the welcome message of this channel", chan);
        return;
    }
} /* end of afterChannelJoin */

,

beforeChannelDestroyed : function(channel) {
    if (channel == tourchannel || (SESSION.channels(channel).perm == true) ) {
        sys.stopEvent();
        return;
    }
} /* end of beforeChannelDestroyed */
,

beforePlayerBan : function(src, dest) {
    var authname = sys.name(src).toLowerCase();
    authStats[authname] =  authStats[authname] || {}
    authStats[authname].latestBan = [sys.name(dest), parseInt(sys.time())];
}
,

afterNewMessage : function (message) {
    if (message == "Script Check: OK") {
        amoebaGame.init();
        sys.sendAll("±ScriptCheck: Scripts were updated!");
        if (typeof(scriptChecks)=='undefined')
            scriptChecks = 0;
        scriptChecks += 1;
        this.init();
    }
} /* end of afterNewMessage */

,

beforeLogIn : function(src) {

    var ip = sys.ip(src);
    if (ip in tempBans) {
        var time = parseInt(sys.time());
        if (time > parseInt(tempBans[ip].time)) {
            delete tempBans[ip];
        } else if (sys.auth(src) < 2) {
            normalbot.sendMessage(src, 'You are banned!');
            sys.stopEvent();
            return;
        }
    }
    // auth can evade rangebans and namebans
    if (sys.auth(src) > 0) {
        return;
    }
    var allowedNames = ["sasukeanditachi", "sasukatandkitachi", "ata", "downpour", "broon89", "ifmltrailers", "probrem?"];
    var name = sys.name(src).toLowerCase();

    for (var subip in rangebans.hash) {
        if (ip.substr(0, subip.length) == subip && allowedNames.indexOf(name) == -1) {
            normalbot.sendMessage('You are banned!');
            sys.stopEvent();
            return;
        }
    }
    var arr =  ["77.182.", "77.9."];
    for (var i = 0; i < arr.length; i++) {
        if (ip.substr(0, arr[i].length) == arr[i]) {
            sys.sendAll("Potential ban evader: " + sys.name(src) + " on IP: " + ip, staffchannel);
        }
    }
    if (this.nameIsInappropriate(src)) {
        sys.stopEvent();
    }
}

,

nameIsInappropriate: function(src)
{
    var name = (typeof src == "number")
        ? sys.name(src)
        : src;

    var lname = name.toLowerCase();

    /* Name banning related */
    for (var i = 0; i < nameBans.length; ++i) {
        var regexp = nameBans[i];
        if (regexp.test(lname)) {
            normalbot.sendMessage(src, 'This kind of name is banned from the server. (Matching regexp: ' + regexp + ')');
            return true;
        }
    }

    var cyrillic = /\u0430|\u0410|\u0412|\u0435|\u0415|\u041c|\u041d|\u043e|\u041e|\u0440|\u0420|\u0441|\u0421|\u0422|\u0443|\u0445|\u0425|\u0456|\u0406/;
    if (cyrillic.test(name)) {
        normalbot.sendMessage('You are using cyrillic letters similar to latin letters in your name.');
        return true;
    }
    var creek = /[\u0370-\u03ff]/;
    if (creek.test(name)) {
        normalbot.sendMessage('You are using creek letters similar to latin letters in your name.');
        return true;
    }

    // \u0020 = space
    var space = /[\u0009-\u000D]|\u0085|\u00A0|\u1680|\u180E|[]\u2000-\u200A|\u2028|\u2029|\u2029|\u202F|\u205F|\u3000/;
    if (space.test(name)) {
        normalbot.sendMessage('You are using whitespace letters in your name.');
        return true;
    }

    // \u002D = -
    var dash = /\u058A|\u05BE|\u1400|\u1806|\u2010-\u2015|\u2053|\u207B|\u208B|\u2212|\u2E17|\u2E1A|\u301C|\u3030|\u30A0|[\uFE31-\uFE32]|\uFE58|\uFE63|\uFF0D/;

    if (dash.test(name)) {
        normalbot.sendMessage('You are using dash letters in your name.');
        return true;
    }

    // special marks
    if (/[\ufff0-\uffff]/.test(name)) {
        normalbot.sendMessage('You are using SPECIAL characters in your name.');
        return true;
    }

    // COMBINING OVERLINE
    if (/\u0305/.test(name)) {
        normalbot.sendMessage('You are using COMBINING OVERLINE character in your name.');
        return true;
    }
    return false;
}
,

afterLogIn : function(src) {
    sys.sendMessage(src, "*** Type in /Rules to see the rules. ***");
    commandbot.sendMessage(src, "Use !commands to see the commands!");

    if (sys.numPlayers() > maxPlayersOnline) {
        maxPlayersOnline = sys.numPlayers();
    }

    if (maxPlayersOnline > sys.getVal("MaxPlayersOnline")) {
        sys.saveVal("MaxPlayersOnline", maxPlayersOnline);
    }

    countbot.sendMessage(src, "Max number of players online was " + sys.getVal("MaxPlayersOnline") + ".");
    if (typeof startUpTime == "number") {
        var diff = parseInt(sys.time()) - startUpTime;
        var days = parseInt(diff / (60*60*24));
        var hours = parseInt((diff % (60*60*24)) / (60*60));
        var minutes = parseInt((diff % (60*60)) / 60);
        var seconds = (diff % 60);
        countbot.sendMessage(src, "Server uptime is "+days+"d "+hours+"h "+minutes+"m "+seconds+"s");
    }
    sys.sendMessage(src, "");
    if (tourmode == 1){
        sys.sendMessage(src,"*** A " + tourtier + " tournament is in its signup phase, " + this.tourSpots() + " space(s) are left!");
        sys.sendMessage(src, "");
        sys.sendMessage(src, border);
        sys.sendMessage(src, "");

    } else if (tourmode == 2){
        sys.sendMessage(src, "");
        sys.sendMessage(src, border);
        sys.sendMessage(src, "");
        sys.sendMessage(src, "~~Server~~: A tournament (" + tourtier + ") is currently running.");
        sys.sendMessage(src, "");
        sys.sendMessage(src, border);
        sys.sendMessage(src, "");
    }
    suspectVoting.afterLogIn(src);

   if (SESSION.users(src).android) {
        sys.sendMessage(src, "*********", 0);
        sys.sendMessage(src, "Message: Hello " + sys.name(src) + "! You seem to be using Pokemon Online for Android. With it you are able to battle with random pokemon. If you want to battle with your own made team, please surf to http://pokemon-online.eu/download with your computer and download the desktop application to your desktop. With it you can export full teams to your Android device! If you using the version with ads from Android Market, download adfree version from http://code.google.com/p/pokemon-online-android/downloads/list", 0);
        sys.sendMessage(src, "*********", 0);
       
        sys.changeTier(src, "Challenge Cup");
        if (sys.existChannel("PO Android")) {
            var androidChan = sys.channelId("PO Android");
            sys.putInChannel(src, androidChan);
            sys.sendMessage(src, "*********", androidChan);
            sys.sendMessage(src, "Message: Hello " + sys.name(src) + "! You seem to be using Pokemon Online for Android. With it you are able to battle with random pokemon. If you want to battle with your own made team, please surf to http://pokemon-online.eu/download with your computer and download the desktop application to your desktop. With it you can export full teams to your Android device! If you using the version with ads from Android Market, download adfree version from http://code.google.com/p/pokemon-online-android/downloads/list", androidChan);
            sys.sendMessage(src, "*********", androidChan);
        }
    }


    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Connected as Auth" + "\n");

    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
    this.afterChangeTeam(src);

    if (SESSION.users(src).mute.active)
        sys.putInChannel(src, trollchannel);
    if (sys.auth(src) <= 3 && this.canJoinStaffChannel(src))
        sys.putInChannel(src, staffchannel);
} /* end of afterLogin */

,

beforeLogOut : function(src) {
    if (SESSION.users(src).megauser)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Disconnected as MU" + "\n");
    if (sys.auth(src) > 0 && sys.auth(src) <= 3)
        sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Disconnected as Auth" + "\n");
}

,

beforeChangeTeam : function(src) {
    authChangingTeam = (sys.auth(src) > 0 && sys.auth(src) <= 3);
}

,

afterChangeTeam : function(src)
{
    if (sys.auth(src) == 0 && this.nameIsInappropriate(src)) {
        sys.kick(src);
        return;
    }

    if (megausers.indexOf("*" + sys.name(src) + "*") != -1) {
        if(!SESSION.users(src).megauser) {
            sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Changed name to MU" + "\n");
        }
        SESSION.users(src).megauser = true;
    } else {
        if(SESSION.users(src).megauser) {
            sys.appendToFile("staffstats.txt", "~" + src + "~" + sys.time() + "~" + "Changed name from MU" + "\n");
        }
        SESSION.users(src).megauser = false;
    }
    SESSION.users(src).contributions = contributors.hash.hasOwnProperty(sys.name(src)) ? contributors.get(sys.name(src)) : undefined;
    SESSION.users(src).mafiaAdmin = mafiaAdmins.hash.hasOwnProperty(sys.name(src));
    if (authChangingTeam === false) {
        if (sys.auth(src) > 0 && sys.auth(src) <= 3)
            sys.appendToFile("staffstats.txt", sys.name(src) + "~" + src + "~" + sys.time() + "~" + "Changed name to Auth" + "\n");
    } else if (authChangingTeam === true) {
        if (!(sys.auth(src) > 0 && sys.auth(src) <= 3))
            sys.appendToFile("staffstats.txt", "~" + src + "~" + sys.time() + "~" + "Changed name from Auth" + "\n");
    }

    SESSION.users(src).sametier = getKey("forceSameTier", src) == "1";

    if (sys.gen(src) >= 4) {
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, i);
        if (poke in pokeNatures) {
            for (x in pokeNatures[poke]) {
                if (sys.hasTeamPokeMove(src, i, x) && sys.teamPokeNature(src, i) != pokeNatures[poke][x])
                {
                    checkbot.sendMessage(src, "" + sys.pokemon(poke) + " with " + sys.move(x) + " must be a " + sys.nature(pokeNatures[poke][x]) + " nature. Change it in the teambuilder.");
                    sys.changePokeNum(src, i, 0);
                }
            }
        }
    }
   }
   try {
   if (sys.gen(src) == 2) {
   pokes:
        for (var i = 0; i <= 6; i++)
            for (var j = 0; j < bannedGSCSleep.length; ++j)
                if (sys.hasTeamPokeMove(src, i, bannedGSCSleep[j]))
                    for (var k = 0; k < bannedGSCTrap.length; ++k)
                        if (sys.hasTeamPokeMove(src, i, bannedGSCTrap[k])) {
                            checkbot.sendMessage(src, "SleepTrapping is banned in GSC. Pokemon " + sys.pokemon(sys.teamPoke(src,i)) + "  removed from your team.");
                            sys.changePokeNum(src, i, 0);
                            continue pokes;
                        }

    }
    } catch (e) { sys.sendMessage(e, staffchannel); }
    this.eventMovesCheck(src);
    this.dreamWorldAbilitiesCheck(src);
    this.littleCupCheck(src);
    this.evioliteCheck(src);
    this.inconsistentCheck(src);
    this.monotypecheck(src);
    this.monoGenCheck(src);
    this.weatherlesstiercheck(src);
    this.shanaiAbilityCheck(src)
    this.monoColourCheck(src)
    this.swiftSwimCheck(src)
    this.droughtCheck(src)
    this.snowWarningCheck(src)
    this.advance200Check(src);

} /* end of afterChangeTeam */

,
userCommand: function(src, command, commandData, tar) {
    if (command == "commands" || command == "command") {
        if (commandData == undefined) {
            sendChanMessage(src, "*** Commands ***");
            for(var x = 0; x < commands["user"].length; ++x) {
                sendChanMessage(src, commands["user"][x]);
            }
            sendChanMessage(src, "*** Other Commands ***");
            sendChanMessage(src, "/commands channel: To know of channel commands");
            if (SESSION.users(src).megauser || sys.auth(src) > 0 || SESSION.channels(tourchannel).isChannelOperator(src)) {
                sendChanMessage(src, "/commands megauser: To know of megauser commands");
            }
            if (sys.auth(src) > 0) {
                sendChanMessage(src, "/commands mod: To know of moderator commands");
            }
            if (sys.auth(src) > 1) {
                sendChanMessage(src, "/commands admin: To know of admin commands");
            }
            if (sys.auth(src) > 2 || isSuperAdmin(src)) {
                sendChanMessage(src, "/commands owner: To know of owner commands");
            }
            sendChanMessage(src, "/commands suspectVoting: To know the commands of suspect voting");
            sendChanMessage(src, "");
            sendChanMessage(src, "Commands starting with \"\\\" will be forwarded to Shanai if she's online.");
            sendChanMessage(src, "");
            return;
        }

        commandData = commandData.toLowerCase();
        if ( (commandData == "mod" && sys.auth(src) > 0)
            || (commandData == "admin" && sys.auth(src) > 1)
            || (commandData == "owner" && (sys.auth(src) > 2  || isSuperAdmin(src)))
            || (commandData == "megauser" && (sys.auth(src) > 0 || SESSION.users(src).megauser || SESSION.channels(tourchannel).isChannelOperator(src)))
            || (commandData == "channel") ) {
            sendChanMessage(src, "*** " + commandData.toUpperCase() + " Commands ***");
            for(x in commands[commandData]) {
                sendChanMessage(src, commands[commandData][x]);
            }
        }
        if (commandData == "suspectvoting") {
            suspectVoting.handleCommand(src, "votinghelp");
        }

        return;
    }
    if ((command == "me" || command == "rainbow") && !muteall && !SESSION.channels(channel).muteall) {
        if (sys.auth(src) == 0 && ((typeof meoff != "undefined" && meoff != false && (channel == tourchannel || channel == 0))
            || SESSION.channels(channel).meoff === true)) {
            normalbot.sendChanMessage(src, "/me was turned off.");
            return;
        }
        if (commandData === undefined)
            return;

        if (channel == sys.channelId("Trivia") && SESSION.channels(channel).triviaon) {
            sys.sendMessage(src, "±Trivia: Answer using \a, /me not allowed now.", channel);
            return;
        }
        if (channel != 0 && channel == mafiachan && mafia.ticks > 0 && mafia.state!="blank" && !mafia.isInGame(sys.name(src)) && sys.auth(src) <= 0) {
            sys.sendMessage(src, Config.Mafia.notPlayingMsg, mafiachan);
            return;
        }

        if (usingBannedWords() || repeatingOneself() || capsName()) {
            sys.stopEvent();
            return;
        }

        if (sys.auth(src) == 0 && SESSION.users(src).smute.active) {
            sendChanMessage(src, "*** " + sys.name(src) + " " + commandData);
            sys.stopEvent();
            this.afterChatMessage(src, '/'+command+ ' '+commandData);
            return;
        }
        commandData=this.html_escape(commandData)
        if (command == "me") {
            sys.sendHtmlAll("<font color='#0483c5'><timestamp/> *** <b>" + this.html_escape(sys.name(src)) + "</b> " + commandData + "</font>", channel);
        } else if (command == "rainbow" && sys.auth(src) >= 3) {
            var auth = 1 <= sys.auth(src) && sys.auth(src) <= 3;
            var colours = ["red", "blue", "yellow", "cyan", "black", "orange", "green"];
            var randColour = function() { return colours[sys.rand(0,colours.length-1)]; }
            var toSend = ["<timestamp/><b>"];
            if (auth) toSend.push("<span style='color:" + randColour() + "'>+</span><i>");
            var name = sys.name(src);
            for (var i = 0; i < name.length; ++i)
                toSend.push("<span style='color:" + randColour() + "'>" + this.html_escape(name[i]) + "</span>");
            toSend.push("<span style='color:" + randColour() + "'>:</b></span> ");
            if (auth) toSend.push("</i>");
            toSend.push(commandData);
            sys.sendHtmlAll(toSend.join(""), channel);
        }
        this.afterChatMessage(src, '/'+command+' '+commandData);
        return;
    }
    if (command == "megausers") {
        sendChanMessage(src, "");
        sendChanMessage(src, "*** MEGA USERS ***");
        sendChanMessage(src, "");
        var spl = megausers.split('*');
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                sendChanMessage(src, spl[x] + " " + (sys.id(spl[x]) !== undefined ? "(online):" : "(offline)"));
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "contributors") {
        sendChanMessage(src, "");
        sendChanMessage(src, "*** CONTRIBUTORS ***");
        sendChanMessage(src, "");
        for (var x in contributors.hash) {
            sendChanMessage(src, x + "'s contributions: " + contributors.get(x));
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "league") {
        if (!Config.League) return;

        sendChanMessage(src, "");
        sendChanMessage(src, "*** Pokemon Online League ***");
        sendChanMessage(src, "");
        var spl = Config.League;
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                sendChanMessage(src, spl[x][0] + " - " + spl[x][1] + " " + (sys.id(spl[x][0]) !== undefined ? "(online):" : "(offline)"));
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "rules") {
        for (rule in rules) {
            sendChanMessage(src, rules[rule]);
        }
        return;
    }
    if (command == "players") {
        countbot.sendChanMessage(src, "There are " + sys.numPlayers() + " players online.");
        return;
    }
    if (command == "ranking") {
        var tier = sys.totalPlayersByTier(commandData) > 0 ? commandData : sys.tier(src);
        var rank = sys.ranking(sys.name(src), tier);
        if (rank == undefined) {
            rankingbot.sendChanMessage(src, "You are not ranked in " + tier + " yet!");
        } else {
            rankingbot.sendChanMessage(src, "Your rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ladderRating(src, tier) + " points / " + sys.ratedBattles(sys.name(src), tier) +" battles]!");
        }
        return;
    }
    if (command == "battlecount") {
        if (!commandData || commandData.indexOf(":") == -1) {
            rankingbot.sendChanMessage(src, "Usage: /battlecount name:tier");
            return;
        }
        var stuff = commandData.split(":");
        var name = stuff[0];
        var tier = stuff[1];
        var rank = sys.ranking(name, tier);
        if (rank == undefined) {
            rankingbot.sendChanMessage(src, "They are not ranked in " + tier + " yet!");
        } else {
            rankingbot.sendChanMessage(src, name + "'s rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ratedBattles(name, tier) +" battles]!");
        }
        return;
    }
    if (command == "auth") {
        var DoNotShowIfOffline = ["loseyourself", "oneballjay"]
        var authlist = sys.dbAuths().sort()
        sendChanMessage(src, "");
        if(commandData == "owners") {
            sendChanMessage(src, "*** Owners ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 3) {
                    if(sys.id(authlist[x]) == undefined) {
                       sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sendChanMessage(src, "");
        }
        if(commandData == "admins" || commandData == "administrators") {
            sendChanMessage(src, "*** Administrators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 2) {
                    if(sys.id(authlist[x]) == undefined) {
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sys.sendMessage(src, "");
        }
        if(commandData == "mods" || commandData == "moderators") {
            sendChanMessage(src, "*** Moderators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 1) {
                    if(sys.id(authlist[x]) == undefined) {
                        if (DoNotShowIfOffline.indexOf(authlist[x]) == -1)
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sys.sendMessage(src, "");
        }

        if(commandData != "moderators" && commandData != "mods" && commandData != "administrators" && commandData != "admins" && commandData != "owners") {

            sendChanMessage(src, "*** Owners ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 3) {
                    if(sys.id(authlist[x]) == undefined) {
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
            sendChanMessage(src, "");
            sendChanMessage(src, "*** Administrators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 2) {
                    if(sys.id(authlist[x]) == undefined) {
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }

            }
            sendChanMessage(src, "");
            sendChanMessage(src, "*** Moderators ***")
            for(x in authlist) {
                if(sys.dbAuth(authlist[x]) == 1) {
                    if(sys.id(authlist[x]) == undefined) {
                        if (DoNotShowIfOffline.indexOf(authlist[x]) == -1)
                        sendChanMessage(src, authlist[x] + " (Offline)")
                    }
                    if(sys.id(authlist[x]) != undefined) {
                        sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + sys.name(sys.id(authlist[x])) + ' (Online)</font>',channel)
                    }
                }
            }
        }
        return;
    }
    if (command == "sametier") {
        if (commandData == "on")
            battlebot.sendChanMessage(src, "You enforce same tier in your battles.");
        else
            battlebot.sendChanMessage(src, "You allow different tiers in your battles.");
        SESSION.users(src).sametier = commandData == "on";
        saveKey("forceSameTier", src, SESSION.users(src).sametier * 1);
        return;
    }
    if (command == "unjoin") {
        if (channel == sys.channelId("Trivia")) {
            sendChanMessage(src, "±TriviaBot: You must use \\unjoin to unjoin a Trivia game!");
            return;
        }
        if (tourmode == 0) {
            tourneybot.sendChanMessage(src, "Wait till the tournament has started.");
            return;
        }
        var name2 = sys.name(src).toLowerCase();

        if (tourmembers.indexOf(name2) != -1) {
            tourmembers.splice(tourmembers.indexOf(name2),1);
            delete tourplayers[name2];
            tourneybot.sendAll("" + sys.name(src) + " left the tournament!", tourchannel);
            return;
        }
        if (tourbattlers.indexOf(name2) != -1) {
            battlesStarted[Math.floor(tourbattlers.indexOf(name2)/2)] = true;
            tourneybot.sendAll("" + sys.name(src) + " left the tournament!", tourchannel);
            this.tourBattleEnd(this.tourOpponent(name2), name2);
        }
        return;
    }
    if (command == "selfkick" || command == "sk") {
        var src_ip = sys.ip(src);
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if ((src != current_player) && (src_ip == sys.ip(current_player))) {
                sys.kick(current_player);
                normalbot.sendMessage(src, "Your ghost was kicked...")
            }
        }
        return;
    }

    if (command == "join"){
        if (channel == sys.channelId("Trivia")) {
            sendChanMessage(src, "±TriviaBot: You must use \\join to join a Trivia game!");
            return;
        }

        if (!sys.isInChannel(src, tourchannel)) {
            tourneybot.sendChanMessage(src, "You must be in the #Tournamentss channel to join a tournament!");
            return;
        }
        if (tourmode != 1){
            sendChanMessage(src, "Sorry, you are unable to join because a tournament is not currently running or has passed the signups phase.");
            return;
        }
        var name = sys.name(src).toLowerCase();
        if (tourmembers.indexOf(name.toLowerCase()) != -1){
            sendChanMessage(src, "Sorry, you are already in the tournament. You are not able to join more than once.");
            return;
        }
        var srctier = sys.tier(src);
        if (!cmp(srctier, tourtier)){
            sendChanMessage(src, "You are currently not battling in the " + tourtier + " tier. Change your tier to " + tourtier + " to be able to join.");
            return;
        }
        if (this.tourSpots() > 0){
            tourmembers.push(name);
            tourplayers[name] = sys.name(src);
            sys.sendAll("~~Server~~: " + sys.name(src) + " joined the tournament! " + this.tourSpots() + " more spot(s) left!", tourchannel);
            if (this.tourSpots() == 0){
                tourmode = 2;
                roundnumber = 0;
                this.roundPairing();
            }
        }
        return;
    }
    if (command == "viewtiers") {
        var cycleLength = 12;
        var a = [];
        for (var i = tourwinners.length-1; i >= tourwinners.length-cycleLength && i >= 0; --i) {
            a.push(tourwinners[i][0]);
        }
        tourneybot.sendChanMessage(src, "Recently played tiers are: " + a.join(", "));
        return;
    }
    if (command == "lastwinners") {
        // tourwinners.push([tier, time, num, winner]);
        var cycleLength = 12;
        var now = sys.time();
        for (var i = tourwinners.length-1; i >= tourwinners.length-cycleLength && i >= 0; --i) {
            var dayDiff = parseInt((now-tourwinners[i][1])/(60*60*24));
            sys.sendHtmlMessage(src, "<timestamp/>" + tourwinners[i][3] + green("won on")+ tourwinners[i][0] + green("tournament with") + tourwinners[i][2] + green("entrants") + (dayDiff > 1 ? '' + dayDiff + green("days ago") : dayDiff == 1 ? green("yesterday") : dayDiff == 0 ? green('today') : green('in the future')), channel);
        }
        return;
    }
    if (command == "viewround"){
        if (tourmode != 2){
            sendChanMessage(src, "Sorry, you are unable to view the round because a tournament is not currently running or is in signing up phase.");
            return;
        }

        sendChanMessage(src, "");
        sendChanMessage(src, border);
        sendChanMessage(src, "");
        sendChanMessage(src, "*** ROUND " + roundnumber + " OF " + tourtier.toUpperCase() + " TOURNAMENT ***");

        if (battlesLost.length > 0) {
            sendChanMessage(src, "");
            sendChanMessage(src, "*** Battles finished ***");
            sendChanMessage(src, "");
            for (var i = 0; i < battlesLost.length; i+=2) {
                sendChanMessage(src, battlesLost[i] + " won against " + battlesLost[i+1]);
            }
            sendChanMessage(src, "");
        }

        if (tourbattlers.length > 0) {
            if (battlesStarted.indexOf(true) != -1) {
                sendChanMessage(src, "", channel);
                sendChanMessage(src, "*** Ongoing battles ***");
                sendChanMessage(src, "");
                for (var i = 0; i < tourbattlers.length; i+=2) {
                    if (battlesStarted [i/2] == true)
                        sendChanMessage(src, this.padd(tourplayers[tourbattlers[i]]) + " VS " + tourplayers[tourbattlers[i+1]]);
                }
                sendChanMessage(src, "");
            }
            if (battlesStarted.indexOf(false) != -1) {
                sendChanMessage(src, "");
                sendChanMessage(src, "*** Yet to start battles ***");
                sendChanMessage(src, "");
                for (var i = 0; i < tourbattlers.length; i+=2) {
                    if (battlesStarted [i/2] == false)
                        sendChanMessage(src, tourplayers[tourbattlers[i]] + " VS " + tourplayers[tourbattlers[i+1]]);
                }
                sendChanMessage(src, "");
            }
        }

        if (tourmembers.length > 0) {
            sendChanMessage(src, "");
            sendChanMessage(src, "*** Members to the next round ***");
            sendChanMessage(src, "");
            var str = "";

            for (x in tourmembers) {
                str += (str.length == 0 ? "" : ", ") + tourplayers[tourmembers[x]];
            }
            sendChanMessage(src, str);
            sendChanMessage(src, "");
        }

        sendChanMessage(src, border);
        sendChanMessage(src, "");

        return;
    }
    if (command == "tourrankings") {
        var list = [];
        for (var p in tourstats) {
            list.push([tourstats[p].points, p]);
        }
        list.sort(function(a,b) { return b[0] - a[0] ; });
        sendChanMessage(src, "*** Global tourney points ***");
        if (list.length > 0) {
            for (var i in list) {
                if (i == 10) break;
                var data = list[i];
                var pos = parseInt(i)+1;
                sys.sendHtmlMessage(src, "<timestamp/><b>" + pos + ".</b> " + data[1] + " <b>-</b> " + data[0] + " points", channel);
            }
        } else {
            sendChanMessage(src, "No tourney wins!");
        }
        return;
    }
    if (command == "tourranking") {
        if (commandData === undefined) {
            rankingbot.sendChanMessage(src, "You must specify tier!");
            return;
        }
        var rankings;
        var tierName;
        for (var t in tourrankingsbytier) {
           if (t.toLowerCase() == commandData.toLowerCase()) {
               tierName = t;
               rankings = tourrankingsbytier[t];
               break;
           }
        }
        if (tierName === undefined) {
            rankingbot.sendChanMessage(src, "No statistics exist for that tier!");
            return;
        }
        var list = [];
        for (var p in rankings) {
            list.push([rankings[p], p]);
        }
        list.sort(function(a,b) { return b[0] - a[0] ; });
        sendChanMessage(src, "*** "+tierName+" tourney points ***");
        if (list.length > 0) {
            for (var i in list) {
                if (i == 10) break;
                var data = list[i];
                var pos = parseInt(i)+1;
                sys.sendHtmlMessage(src, "<timestamp/><b>" + pos + ".</b> " + data[1] + " <b>-</b> " + data[0] + " points", channel);
            }
        } else {
            sendChanMessage(src, "No tourney wins in this tier!");
        }
        return;
    }
    if (command == "tourdetails") {
        if (commandData === undefined) {
            rankingbot.sendChanMessage(src, "You must specify user!");
            return;
        }
        function green(s) {
            return " <span style='color:#3daa68'><b>"+s+"</b></span> ";
        }
        var name = commandData.toLowerCase();
        if (name in tourstats) {
            sendChanMessage(src, "*** Tournament details for user " + commandData);
            var points = tourstats[name].points;
            var details = tourstats[name].details;
            var now = sys.time();
            for (var i in details) {
                var dayDiff = parseInt((now-details[i][1])/(60*60*24));
                sys.sendHtmlMessage(src, "<timestamp/>" + green("Win on")+ details[i][0] + green("tournament with") + details[i][2] + green("entrants") + (dayDiff > 1 ? '' + dayDiff + green("days ago") : dayDiff == 1 ? green("yesterday") : dayDiff == 0 ? green('today') : green('in the future')), channel);
            }
        } else {
            rankingbot.sendChanMessage(src, commandData+" has not won any tournaments recently.");
        }
        return;
    }
    if (command == "topic") {
        SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "uptime") {
        if (typeof startUpTime != "number") {
            countbot.sendChanMessage(src, "Somehow the server uptime is messed up...");
            return;
        }
        var diff = parseInt(sys.time()) - startUpTime;
        var days = parseInt(diff / (60*60*24));
        var hours = parseInt((diff % (60*60*24)) / (60*60));
        var minutes = parseInt((diff % (60*60)) / 60);
        var seconds = (diff % 60);

        countbot.sendChanMessage(src, "Server uptime is "+days+"d "+hours+"h "+minutes+"m "+seconds+"s");
        return;
    }
    if (command == "resetpass") {
        sys.clearPass(sys.name(src));
        normalbot.sendChanMessage(src, "Your password was cleared!");
        return;
    }

    if (command == "importable") {
        normalbot.sendChanMessage(src, "Sorry, currently disabled for today due to our api key hitting max pastes for a day.");
        return;
        //var path = "user_importables/{id}.txt".replace("{id}", src);
        //var url = "http://188.165.249.120/i/{id}.txt".replace("{id}", src);
        //bot.sendChanMessage(src, "Your team is available at " + url);
        //sys.writeToFile(path, this.importable(src, true).join("\n"));
        var name = sys.name(src) + '\'s '+sys.tier(src)+' team';
        var team = this.importable(src, true).join("\n");
        var post = {};
        post['api_option']            = 'paste';            //  paste, duh
        post['api_dev_key']           = pastebin_api_key;   //  Developer's personal key, set in the beginning
        //post['api_user_key']          = pastebin_user_key;  //  Pastes are marked to our account
        post['api_paste_private']     = 1;                  //  private
        post['api_paste_name']        = name;               //  name
        post['api_paste_code']        = team;               //  text itself
        post['api_paste_expire_date'] = '1M';               //  expires in 1 month
        sys.webCall('http://pastebin.com/api/api_post.php', function(resp) {
            if (/^http:\/\//.test(resp))
                normalbot.sendChanMessage(src, "Your team is available at: " + resp); // success
            else {
                normalbot.sendChanMessage(src, "Sorry, unexpected error: "+resp);    // an error occured
                normalbot.sendAll("" + sys.name(src) + "'s /importable failed: "+resp, staffchannel); // message to indigo
            }
        }, post);
        return;
    }
    if (command == "cjoin") {
        var chan;
        if (sys.existChannel(commandData)) {
            chan = sys.channelId(commandData);
        } else {
            chan = sys.createChannel(commandData);
        }
        sys.putInChannel(src, chan);
        return;
    }

    if (command == "register") {
        if (SESSION.channels(channel).register(sys.name(src))) {
            channelbot.sendChanMessage(src, "You registered this channel successfully. Take a look of /commands channel");
        } else {
            channelbot.sendChanMessage(src, "This channel is already registered!");
        }
        return;
    }
    if (command == "cauth") {
        if (typeof SESSION.channels(channel).operators != 'object')
            SESSION.channels(channel).operators = [];
        if (typeof SESSION.channels(channel).masters != 'object')
            SESSION.channels(channel).masters = [];
        channelbot.sendChanMessage(src, "The channel auth of " + sys.channel(channel) + " are:");
        channelbot.sendChanMessage(src, "Masters: " + SESSION.channels(channel).masters.join(", "));
        channelbot.sendChanMessage(src, "Operators: " + SESSION.channels(channel).operators.join(", "));
        return;
    }

    // The Stupid Coin Game
    if (command == "coin" || command == "flip") {
        coinbot.sendChanMessage(src, "You flipped a coin. It's " + (Math.random() < 0.5 ? "Tails" : "Heads") + "!");
        if (!isNonNegative(SESSION.users(src).coins))
            SESSION.users(src).coins = 0;
        SESSION.users(src).coins++;
        return;
    }
    if (command == "throw") {
        if (channel != sys.channelId("Coins")) {
            coinbot.sendChanMessage(src, "No throwing here!");
            return;
        }
        if (sys.auth(src) == 0 && (muteall ||  SESSION.channels(channel).muteall) && !SESSION.channels(channel).isChannelOperator(src)) {
            if (SESSION.channels(channel).muteallmessages) {
                sendChanMessage(src, SESSION.channels(channel).muteallmessage);
            } else {
                coinbot.sendChanMessage(src, "Respect the minutes of silence!");
            }
            return;
        }

        if (!isNonNegative(SESSION.users(src).coins) || SESSION.users(src).coins < 1) {
            coinbot.sendChanMessage(src, "Need more coins? Use /flip!");
            return;
        }
        if (tar === undefined) {
            if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins = 0;
            coinbot.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at the wall!");
            SESSION.global().coins += SESSION.users(src).coins
        } else if (tar == src) {
            coinbot.sendChanMessage(src, "No way...");
            return;
        } else {
            coinbot.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at " + sys.name(tar) + "!");
            if (!isNonNegative(SESSION.users(tar).coins)) SESSION.users(tar).coins = 0;
            SESSION.users(tar).coins += SESSION.users(src).coins;
        }
        SESSION.users(src).coins = 0;
        return;
    }
    if (command == "casino") {
        var bet = parseInt(commandData);
        if (isNaN(bet)) {
            coinbot.sendChanMessage(src, "Use it like /casino [coinamount]!");
            return;
        }
        if (bet < 5) {
            coinbot.sendChanMessage(src, "Mininum bet 5 coins!");
            return;
        }
        if (bet > SESSION.users(src).coins) {
            coinbot.sendChanMessage(src, "You don't have enough coins!");
            return;
        }
        coinbot.sendChanMessage(src, "You inserted the coins into the Fruit game!");
        SESSION.users(src).coins -= bet;
        var res = Math.random();

        if (res < 0.8) {
            coinbot.sendChanMessage(src, "Sucks! You lost " + bet + " coins!");
            return;
        }
        if (res < 0.88) {
            coinbot.sendChanMessage(src, "You doubled the fun! You got " + 2*bet + " coins!");
            SESSION.users(src).coins += 2*bet;
            return;
        }
        if (res < 0.93) {
            coinbot.sendChanMessage(src, "Gratz! Tripled! You got " + 3*bet + " coins ");
            SESSION.users(src).coins += 3*bet;
            return;
        }
        if (res < 0.964) {
            coinbot.sendChanMessage(src, "Woah! " + 5*bet + " coins GET!");
            SESSION.users(src).coins += 5*bet;
            return;
        }
        if (res < 0.989) {
            coinbot.sendChanMessage(src, "NICE job! " + 10*bet + " coins acquired!");
            SESSION.users(src).coins += 10*bet;
            return;
        }
        if (res < 0.999) {
            coinbot.sendChanMessage(src, "AWESOME LUCK DUDE! " + 20*bet + " coins are yours!");
            SESSION.users(src).coins += 20*bet;
            return;
        } else {
            coinbot.sendChanMessage(src, "YOU HAVE BEATEN THE CASINO! " + 50*bet + " coins are yours!");
            SESSION.users(src).coins += 50*bet;
            return;
        }
    }
    if (command == "myalts") {
        var ip = sys.ip(src);
        var alts = sys.aliases(ip);
        bot.sendChanMessage(src, "Your alts are: " + alts);
        return;
    }
    if (command == "dwreleased") {
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendChanMessage(src, "No such pokemon!"); return;
        }
        var pokename = sys.pokemon(poke);
        if (poke in dwpokemons) {
            if (breedingpokemons.indexOf(poke) == -1) {
                normalbot.sendChanMessage(src, pokename + ": Released fully!");
            } else {
                normalbot.sendChanMessage(src, pokename + ": Released as a Male only, can't have egg moves or previous generation moves!");
            }
        } else {
            normalbot.sendChanMessage(src, pokename + ": Not released, only usable on Dream World tiers!");
        }
        return;
    }
    if (-crc32(command, crc32(sys.name(src))) == 22 || command == "wall") {
        if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins=0;
        if (!isNonNegative(SESSION.users(src).coins)) SESSION.users(src).coins=1;
        if (SESSION.global().coins < 100) return;
        coinbot.sendChanAll("" + sys.name(src) + " found " + SESSION.global().coins + " coins besides the wall!");
        SESSION.users(src).coins += SESSION.global().coins;
        SESSION.global().coins = 0;
        return;
    }
    return "no command";
}
,
megauserCommand: function(src, command, commandData, tar) {
    if (channel != tourchannel && ["dq", "push", "cancelbattle", "sub", "changecount", "endtour"].indexOf(command) != -1) {
        tourneybot.sendChanMessage(src, "Tournaments commands should be issued in #Tournaments channel.");
        return;
    }
    if (command == "dq") {
        if (tourmode == 0) {
            tourneybot.sendChanMessage(src, "Wait till the tournament has started.");
            return;
        }
        var name2 = commandData.toLowerCase();

        if (tourmembers.indexOf(name2) != -1) {
            tourmembers.splice(tourmembers.indexOf(name2),1);
            delete tourplayers[name2];
            tourneybot.sendAll("" + commandData + " was removed from the tournament by " + nonFlashing(sys.name(src)) + "!", tourchannel);
            return;
        }
        if (tourbattlers.indexOf(name2) != -1) {
            battlesStarted[Math.floor(tourbattlers.indexOf(name2)/2)] = true;
            tourneybot.sendAll("" + commandData + " was removed from the tournament by " + nonFlashing(sys.name(src)) + "!", tourchannel);
            this.tourBattleEnd(this.tourOpponent(name2), name2);
        }
        return;
    }
    if (command == "push") {
        if (tourmode == 0) {
            tourneybot.sendChanMessage(src, "Wait untill the tournament has started.");
            return;
        }
        if (this.isInTourney(commandData.toLowerCase())) {
            tourneybot.sendChanMessage(src, "" +commandData + " is already in the tournament.");
            return;
        }
        if (tourmode == 2) {
            tourneybot.sendAll("" +commandData + " was added to the tournament by " + nonFlashing(sys.name(src)) + ".", tourchannel);
            tourmembers.push(commandData.toLowerCase());
            tourplayers[commandData.toLowerCase()] = commandData;
        }
        if (tourmode == 1) {
            tourmembers.push(commandData.toLowerCase());
            tourplayers[commandData.toLowerCase()] = commandData;
            tourneybot.sendAll("" +commandData + " was added to the tournament by " + nonFlashing(sys.name(src)) + ". " + this.tourSpots() + " more spot(s) left!", tourchannel);

        }
        if (tourmode == 1  && this.tourSpots() == 0) {
            tourmode = 2;
            roundnumber = 0;
            this.roundPairing();
        }
        return;
    }
    if (command == "cancelbattle") {
        if (tourmode != 2) {
            sendChanMessage(src, "Wait until a tournament starts");
            return;
        }
        var name = commandData.toLowerCase();

        if (tourbattlers.indexOf(name) != -1) {
            battlesStarted[Math.floor(tourbattlers.indexOf(name)/2)] = false;
            tourneybot.sendChanMessage(src, "" + commandData + " can forfeit their battle and rematch now.");
        }

        return;
    }
    if (command == "sub") {
        if (tourmode != 2) {
            sendChanMessage(src, "Wait until a tournament starts");
            return;
        }
        var players = commandData.split(':');

        if (!this.isInTourney(players[0]) && !this.isInTourney(players[1])) {
            tourneybot.sendChanMessage(src, "Neither are in the tourney.");
            return;
        }
        tourneybot.sendAll("" + players[0] + " and " + players[1] + " were exchanged places in the ongoing tournament by " + nonFlashing(sys.name(src)) + ".", tourchannel);

        var p1 = players[0].toLowerCase();
        var p2 = players[1].toLowerCase();

        for (x in tourmembers) {
            if (tourmembers[x] == p1) {
                tourmembers[x] = p2;
            } else if (tourmembers[x] == p2) {
                tourmembers[x] = p1;
            }
        }
        for (x in tourbattlers) {
            if (tourbattlers[x] == p1) {
                tourbattlers[x] = p2;
                battlesStarted[Math.floor(x/2)] = false;
            } else if (tourbattlers[x] == p2) {
                tourbattlers[x] = p1;
                battlesStarted[Math.floor(x/2)] = false;
            }
        }

        if (!this.isInTourney(p1)) {
            tourplayers[p1] = players[0];
            delete tourplayers[p2];
        } else if (!this.isInTourney(p2)) {
            tourplayers[p2] = players[1];
            delete tourplayers[p1];
        }

        return;
    }
    if (command == "tour"){
        if (typeof(tourmode) != "undefined" && tourmode > 0){
            sendChanMessage(src, "Sorry, you are unable to start a tournament because one is still currently running.");
            return;
        }
        /*if (sys.auth(src) < 2 && sys.id("shanai") !== undefined) {
            sendChanMessage(src, "Sorry, but script tourneys can't be run when Shanai is here.");
            return;
        }*/

        if (commandData.indexOf(':') == -1)
            commandpart = commandData.split(' ');
        else
            commandpart = commandData.split(':');

        tournumber = parseInt(commandpart[1]);

        if (isNaN(tournumber) || tournumber <= 2){
            sendChanMessage(src, "You must specify a tournament size of 3 or more.");
            return;
        }

        var tier = sys.getTierList();
        var found = false;
        for (var x in tier) {
            if (cmp(tier[x], commandpart[0])) {
                tourtier = tier[x];
                found = true;
                break;
            }
        }
        if (!found) {
            sendChanMessage(src, "Sorry, the server does not recognise the " + commandpart[0] + " tier.");
            return;
        }

        var cycleLength = 9;
        for (var i = tourwinners.length-1; i >= tourwinners.length-cycleLength && i >= 0; --i) {
            if (cmp(tourwinners[i][0], commandpart[0])) {
                var ago = tourwinners.length-i-1;
                sendChanMessage(src, "This tier was just played " + ago + " tournaments ago. To to keep different tourneys running!");
                break;
            }
        }

        tourmode = 1;
        tourmembers = [];
        tourbattlers = [];
        tourplayers = [];
        battlesStarted = [];
        battlesLost = [];
        tourstarter = sys.name(src);

        var chans = [0, tourchannel];

        for (var x in chans) {
            var y = chans[x];
            sys.sendAll("", y);
            sys.sendAll(border, y);
            sys.sendAll("*** A Tournament was started by " + nonFlashing(sys.name(src)) + "! ***", y);
            sys.sendAll("PLAYERS: " + tournumber, y);
            sys.sendAll("TYPE: Single Elimination", y);
            sys.sendAll("TIER: " + tourtier, y);
            sys.sendAll("", y);
            sys.sendAll("*** Go in the #Tournaments channel and type /join or !join to enter the tournament! ***", y);
            sys.sendAll(border, y);
            sys.sendAll("", y);
        }
        return;
    }

    if (command == "changecount") {
        if (tourmode != 1) {
            sendChanMessage(src, "Sorry, you are unable to join because the tournament has passed the sign-up phase.");
            return;
        }
        var count = parseInt(commandData);

        if (isNaN(count) || count < 3) {
            return;
        }

        if (count < tourmembers.length) {
            sendChanMessage(src, "There are more than that people registered");
            return;
        }

        tournumber = count;

        sys.sendAll("", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("~~Server~~: " +  sys.name(src) + " changed the numbers of entrants to " + count + "!", tourchannel);
        sys.sendAll("*** " + this.tourSpots() + " more spot(s) left!", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("", tourchannel);

        if (this.tourSpots() == 0 ){
            tourmode = 2;
            roundnumber = 0;
            this.roundPairing();
        }

        return;
    }
    if (command == "endtour"){
        if (tourmode != 0){
            tourmode = 0;
            sys.sendAll("", tourchannel);
            sys.sendAll(border, tourchannel);
            sys.sendAll("~~Server~~: The tournament was cancelled by " + nonFlashing(sys.name(src)) + "!", tourchannel);
            sys.sendAll(border, tourchannel);
            sys.sendAll("", tourchannel);
        } else
            sendChanMessage(src, "Sorry, you are unable to end a tournament because one is not currently running.");
        return;
    }
    return "no command";
}
,
modCommand: function(src, command, commandData, tar) {
    if (command == "topchannels") {
        var cids = sys.channelIds();
        var l = [];
        for (var i = 0; i < cids.length; ++i) {
            l.push([cids[i], sys.playersOfChannel(cids[i])]);
        }
        l.sort(function(a,b) { return b[1]-a[1]; });
        var topchans = l.slice(-10);
        channelbot.sendChanMessage(src, "Most used channels:")
        for (var i = 0; i < topchans.lenth; ++i) {
            sendChanMessage(src, "" + sys.channel(topchans[i][0]) + " with " + topchans[i][1] + " players.");
        }
        return;
    }
    if (command == "perm") {
        if (channel == staffchannel || channel == 0) {
            channelbot.sendChanMessage(src, "you can't do that here.");
            return;
        }

        SESSION.channels(channel).perm = (commandData.toLowerCase() == 'on');
        SESSION.global().channelManager.updateChannelPerm(sys.channel(channel), SESSION.channels(channel).perm);
        channelbot.sendChanAll("" + sys.name(src) + (SESSION.channels(channel).perm ? " made the channel permanent." : " made the channel a temporary channel again."));
        return;
    }
    if (command == "meoff") {
        this.meoff(src, commandData);
        return;
    }
    if (command == "meon") {
        this.meon(src, commandData);
        return;
    }
    if (command == "silence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        var minutes;
        var chanName;
        var space = commandData.indexOf(' ');
        if (space != -1) {
            minutes = commandData.substring(0,space);
            chanName = commandData.substring(space+1);
        } else {
            minutes = commandData;
            chanName = sys.channel(channel);
        }
        this.silence(src, minutes, chanName);
        return;
    }
    if (command == "silenceoff") {
        this.silenceoff(src, commandData);
        return;
    }
    if (command == "mafiaban") {
        script.issueBan("mban", src, sys.id(commandData), commandData);
        return;
    }
    if (command == "mafiaunban") {
        if (tar == undefined) {
            if (mbans.get(commandData)) {
                mafiabot.sendAll("IP address " + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                mbans.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData)
            if(ip != undefined && mbans.get(ip)) {
                mafiabot.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!");
                mbans.remove(ip);
                return;
            }
            mafiabot.sendChanMessage(src, "He/she's not banned from Mafia.");
            return;
        }
        if (!SESSION.users(tar).mban.active) {
            mafiabot.sendChanMessage(src, "He/she's not banned from Mafia.");
            return;
        }
        if(SESSION.users(src).mban.active && tar==src) {
           mafiabot.sendChanMessage(src, "You may not unban yourself from Mafia");
           return;
        }
        mafiabot.sendAll("" + commandData + " was unbanned from Mafia by " + nonFlashing(sys.name(src)) + "!");
        SESSION.users(tar).un("mban");
        return;
    }

    if (command == "impoff") {
        delete SESSION.users(src).impersonation;
        normalbot.sendChanMessage(src, "Now you are yourself!");
        return;
    }
    if (command == "k") {
        if (tar == undefined) {
            return;
        }
        normalbot.sendAll("" + commandData + " was mysteriously kicked by " + nonFlashing(sys.name(src)) + "!");
        sys.kick(tar);
        return;
    }

    if (command == "mute") {
        script.issueBan("mute", src, tar, commandData);
        return;
    }
    if (command == "banlist") {
        list=sys.banList();
        list.sort();
        var nbr_banned=5;
        var max_message_length = 30000;
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan='+nbr_banned+'><center><strong>Banned list</strong></center></td></tr><tr>';
        var table_footer = '</tr></table>';
        var table=table_header;
        var j=0;
        var line = ''
        for (var i=0; i<list.length; ++i){
            if (typeof commandData == 'undefined' || list[i].toLowerCase().indexOf(commandData.toLowerCase()) != -1){
                ++j;
                line += '<td>'+list[i]+'</td>';
                if(j == nbr_banned &&  i+1 != list.length){
                    if (table.length + line.length + table_footer.length > max_message_length) {
                        if (table.length + table_footer.length <= max_message_length)
                            sys.sendHtmlMessage(src, table + table_footer, channel);
                        table = table_header;
                    }
                    table += line + '</tr><tr>';
                    line = '';
                    j=0;
                }
            }
        }
        table += table_footer;
        sys.sendHtmlMessage(src, table.replace('</tr><tr></tr></table>', '</tr></table>'),channel);
        return;

    }
    if (command == "mutelist" || command == "smutelist" || command == "mafiabans") {
        var mh;
        var name;
        if (command == "mutelist") {
            mh = mutes;
            name = "Muted list";
        } else if (command == "smutelist") {
            mh = smutes;
            name = "Secretly muted list";
        } else if (command == "mafiabans") {
            mh = mbans;
            name = "Mafiabans";
        }

        var width=5;
        var max_message_length = 30000;
        var tmp = [];
        var t = parseInt(sys.time());
        var toDelete = [];
        for (var ip in mh.hash) {
            var values = mh.hash[ip].split(":");
            var banTime = 0;
            var by = "";
            var expires = 0;
            var banned_name;
            var reason = "";
            if (values.length >= 5) {
                banTime = parseInt(values[0]);
                by = values[1];
                expires = parseInt(values[2]);
                banned_name = values[3];
                reason = values.slice(4);
                if (expires != 0 && expires < t) {
                    toDelete.push(ip);
                    continue;
                }
            } else if (command == "smutelist") {
                var aliases = sys.aliases(ip);
                if (aliases[0] !== undefined) {
                    banned_name = aliases[0];
                } else {
                    banned_name = "~Unknown~";
                }
            } else {
                banTime = parseInt(values[0]);
            }
            if(typeof commandData != 'undefined' && (!banned_name || banned_name.toLowerCase().indexOf(commandData.toLowerCase()) == -1))
                continue;
            tmp.push([ip, banned_name, by, (banTime == 0 ? "unknown" : getTimeString(t-banTime)), (expires == 0 ? "never" : getTimeString(expires-t)), this.html_escape(reason)]);
        }
        for (var k = 0; k < toDelete.length; ++k)
           delete mh.hash[toDelete[k]];
        if (toDelete.length > 0)
            mh.save();

        tmp.sort(function(a,b) { a[3] - b[3]});

        // generate HTML
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + this.html_escape(name) + '</strong></center></td></tr><tr><th>IP</th><th>Name</th><th>By</th><th>Issued ago</th><th>Expires in</th><th>Reason</th>';
        var table_footer = '</table>';
        var table = table_header;
        var line;
        var send_rows = 0;
        while(tmp.length > 0) {
            line = '<tr><td>'+tmp[0].join('</td><td>')+'</td></tr>';
            tmp.splice(0,1);
            if (table.length + line.length + table_footer.length > max_message_length) {
                if (send_rows == 0) continue; // Can't send this line!
                table += table_footer
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
    }
    if (command == "rangebans") {
        var TABLE_HEADER, TABLE_LINE, TABLE_END;
        if (!commandData || commandData.indexOf('-text') == -1) {
           TABLE_HEADER = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Range banned</strong></center></td></tr><tr><th>IP subaddress</th><th>Comment on rangeban</th></tr>';
           TABLE_LINE = '<tr><td>{0}</td><td>{1}</td></tr>';
           TABLE_END = '</table>';
        } else {
           TABLE_HEADER = 'Range banned: IP subaddress, Command on rangeban';
           TABLE_LINE = ' || {0} / {1}';
           TABLE_END = '';
        }
        try {
        var table = TABLE_HEADER;
        var tmp = [];
        for (var key in rangebans.hash) {
            tmp.push([key, rangebans.get(key)]);
        }
        tmp.sort(function(a,b) { return a[0] < b[0] ? -1 : 1; });
        for (var row = 0; row < tmp.length; ++row) {
            table += TABLE_LINE.format(tmp[row][0], tmp[row][1]);
        }
        table += TABLE_END;
        sys.sendHtmlMessage(src, table, channel);
        } catch (e) { sys.sendMessage(src, e, channel); }
        return;
    }
    if (command == "tempbans") {
        var t = parseInt(sys.time());
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="3"><center><strong>Temp banned</strong></center></td></tr><tr><th>IP address</th><th>Expires in</th><th>By Whom</th></tr>';
        for (var ip in tempBans) {
            table += '<tr><td>'+ip+'</td><td>'+getTimeString(tempBans[ip].time - t)+'</td><td>' + tempBans[ip].auth +'</td><td>' + tempBans[ip].time + '</td></tr>';
        }
        table += '</table>'
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "namebans") {
        var table = '';
        table += '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="2"><center><strong>Name banned</strong></center></td></tr>';
        for (var i = 0; i < nameBans.length; i+=5) {
            table += '<tr>';
            for (var j = 0; j < 5 && i+j < nameBans.length; ++j) {
                table += '<td>'+nameBans[i+j].toString()+'</td>';
            }
            table += '</tr>';
        }
        table += '</table>'
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command == "unmute") {
        if (tar == undefined) {
            if (mutes.get(commandData)) {
                normalbot.sendAll("IP address " + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                mutes.remove(commandData);
                return;
            }
            var ip = sys.dbIp(commandData)
            if(ip != undefined && mutes.get(ip)) {
                normalbot.sendAll("" + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!");
                mutes.remove(ip);
                return;
            }
            normalbot.sendChanMessage(src, "He/she's not muted.");
            return;
        }
        if (!SESSION.users(sys.id(commandData)).mute.active) {
            normalbot.sendChanMessage(src, "He/she's not muted.");
            return;
        }
        if(SESSION.users(src).mute.active && tar==src) {
           normalbot.sendChanMessage(src, "You may not unmute yourself!");
           return;
        }
        SESSION.users(tar).un("mute");
        normalbot.sendAll("" + commandData + " was unmuted by " + nonFlashing(sys.name(src)) + "!");
        return;
    }
    if (command == "userinfo" || command == "whois" || command == "whoistxt") {
        if (commandData == undefined) {
            querybot.sendChanMessage(src, "Please provide a username.");
            return;
        }
        var name = commandData;
        var isbot = false;
        if (commandData[0] == "~") {
            name = commandData.substring(1);
            tar = sys.id(name);
            isbot = true;
        }
        var lastLogin = sys.dbLastOn(name);
        if (lastLogin === undefined) {
            querybot.sendChanMessage(src, "No such user.");
            return;
        }

        var registered = sys.dbRegistered(name);
        var megauser = (megausers.toLowerCase().indexOf("*" + name.toLowerCase() + "*") != -1);
        var contribution = contributors.hash.hasOwnProperty(name) ? contributors.get(name) : "no";
        var authLevel;
        var ip;
        var online;
        var channels = [];
        if (tar !== undefined) {
            name = sys.name(tar); // fixes case
            authLevel = sys.auth(tar);
            ip = sys.ip(tar);
            online = true;
            var chans = sys.channelsOfPlayer(tar);
            for (var i = 0; i < chans.length; ++i) {
                channels.push("#"+sys.channel(chans[i]));
            }
        } else {
            authLevel = sys.dbAuth(name);
            ip = sys.dbIp(name);
            online = false;
        }

        if (isbot) {
            var userJson = {'type': 'UserInfo', 'id': tar ? tar : -1, 'username': name, 'auth': authLevel, 'megauser': megauser, 'contributor': contribution, 'ip': ip, 'online': online, 'registered': registered, 'lastlogin': lastLogin };
            sendChanMessage(src, ":"+JSON.stringify(userJson));
        } else if (command == "userinfo") {
            querybot.sendChanMessage(src, "Username: " + name + " ~ auth: " + authLevel + " ~ megauser: " + megauser + " ~ contributor: " + contribution + " ~ ip: " + ip + " ~ online: " + (online ? "yes" : "no") + " ~ registered: " + (registered ? "yes" : "no") + " ~ last login: " + lastLogin);
        } else if (command == "whois") {
            var authName = function() {
                switch (authLevel) {
                case 3: return "owner"; break;
                case 2: return "admin"; break;
                case 1: return "moderator"; break;
                default: return megauser ? "megauser" : contribution != "no" ? "contributor" : "user";
                }
            }();

            var logintime = false;
            if (online) logintime = SESSION.users(tar).logintime;
            var data = [
               "User: " + name + " @ " + ip,
               "Auth: " + authName,
               "Online: " + (online ? "yes" : "no"),
               "Registered name: " + (registered ? "yes" : "no"),
               "Last Login: " + (online && logintime ? new Date(logintime*1000).toUTCString() : lastLogin),
            ];
            if (online) data.push("Channels: " + channels.join(", "));
            if (authLevel > 0) {
               var stats = authStats[name.toLowerCase()] || {};
               for (var key in stats) {
                   data.push("Latest " + key.substr(6).toLowerCase() + ": " + stats[key][0] + " on " + new Date(stats[key][1]*1000).toUTCString());
               }
            }
            for (var j = 0; j < data.length; ++j) {
                sendChanMessage(src, data[j]);
            }
        }

        return;
    }
    if (command == "aliases") {
        var max_message_length = 30000;
        var smessage = "The aliases for the IP " + commandData + " are: "
        var aliases = sys.aliases(commandData);
        var prefix = "";
        for(var i = 0; i < aliases.length; ++i) {
            var id = sys.id(aliases[i]);
            var status = (id != undefined) ? "online" : "Last Login: " + sys.dbLastOn(aliases[i]);
            smessage = smessage + aliases[i] + " ("+status+"), ";
            if (smessage.length > max_message_length) {
                querybot.sendChanMessage(src, prefix + smessage + " ...");
                prefix = "... ";
                smessage = "";
            }
        }
        querybot.sendChanMessage(src, prefix + smessage);
        return;
    }
    if (command == "tempban") {
        var tmp = commandData.split(":");
        if (tmp.length != 2) {
            normalbot.sendChanMessage(src, "Usage /tempban name:minutes.");
            return;
        }
        tar = sys.id(tmp[0]);
        var minutes = parseInt(tmp[1]);
        if (typeof minutes != "number" || isNaN(minutes) || minutes < 1 || (sys.auth(src) < 2 && minutes > 1440) ) {
            normalbot.sendChanMessage(src, "Minutes must be in the interval [1,1440].");
            return;
        }

        var ip;
        var name;
        if (tar === undefined) {
            ip = sys.dbIp(tmp[0]);
            name = tmp[0];
            if (ip === undefined) {
                normalbot.sendChanMessage(src, "No such name online / offline.");
                return;
            }
        } else {
            ip = sys.ip(tar);
            name = sys.name(tar);
        }

        if (sys.maxAuth(ip)>=sys.auth(src)) {
            normalbot.sendChanMessage(src, "Can't do that to higher auth!");
            return;
        }
        tempBans[ip] = {'auth': sys.name(src), 'time': parseInt(sys.time()) + 60*minutes};
        normalbot.sendAll("" + nonFlashing(sys.name(src)) + " banned " + name + " for " + minutes + " minutes!");
        sys.kick(tar);
        this.kickAll(ip);

        var authname = sys.name(src).toLowerCase();
        authStats[authname] =  authStats[authname] || {}
        authStats[authname].latestTempBan = [name, parseInt(sys.time())];
        return;
    }
    if (command == "tempunban") {
        var ip = sys.dbIp(commandData);
        if (ip === undefined) {
            normalbot.sendChanMessage(src, "No such user!");
            return;
        }
        if (!(ip in tempBans)) {
            normalbot.sendChanMessage(src, "No such user tempbanned!");
            return;
        }
        var now = parseInt(sys.time());
        normalbot.sendAll("" + commandData + " was released from their cell by " + nonFlashing(sys.name(src)) + " just " + ((tempBans[ip].time - now)/60).toFixed(2) + " minutes beforehand!");
        delete tempBans[ip];
        return;
    }
    if (command == "wfbset") {
        SESSION.users(src).wfbmsg = commandData;
        SESSION.global().wfbset[sys.name(src).toLowerCase()] = commandData;
        sys.writeToFile('wfbset.json', JSON.stringify(SESSION.global().wfbset));
        normalbot.sendChanMessage(src, "Your message is set to '" + commandData + "'.");
        return;
    }
    if (command == "wfb") {
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Please use this command to warn / automute someone. Use /wfb name");
            return;
        }
        if (sys.auth(tar) > 0) {
            normalbot.sendChanMessage(src, "Please use this command only on users.");
            return;
        }
        var poTarget = SESSION.users(tar);
        var poAuth = SESSION.users(src);
        if (!poTarget.warned) {
            poTarget.warned = parseInt(sys.time());
            var warning = poAuth.wfbmsg ? poAuth.wfbmsg : "{{user}}: Please do not ask for battles in the chat. Refer to http://findbattlebutton.info to find more about the find battle button!";
            warning = warning.replace("{{user}}", sys.name(tar));
            sys.sendAll(sys.name(src) + ": " + warning, 0);
        } else if (parseInt(sys.time()) - poTarget.warned < 10) {
            normalbot.sendChanMessage(src, "Please wait 10 seconds between wfbs.");
        } else {
            poTarget.activate("mute", sys.name(src), parseInt(sys.time()) + 900, "Asking for battles in the chat; http://findbattlebutton.info", true);
            normalbot.sendAll("" + sys.name(tar) + " was muted by " + nonFlashing(sys.name(src)) + " for 15 minutes! [Reason: Asking for battles in the chat]");
        }
        return;
    }
    if (command == "passauth" || command == "passauths") {
        //normalbot.sendChanMessage(src, "Ask Oak/Lamp/Zero instead, plox.");
        //return;
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "The target is offline.");
            return;
        }
        if (sys.ip(src) == sys.ip(tar) && sys.auth(tar) == 0) {
            // fine
        }
        else {
            if (sys.auth(src) != 0 || !SESSION.users(src).megauser) {
                normalbot.sendChanMessage(src, "You need to be mega-auth to pass auth.");
                return;
            }
            if (!SESSION.users(tar).megauser || sys.auth(tar) > 0) {
                normalbot.sendChanMessage(src, "The target must be megauser and not auth, or from your IP.");
                return;
            }
        }
        if (!sys.dbRegistered(sys.name(tar))) {
            normalbot.sendChanMessage(src, "The target name must be registered.");
            return;
        }
        var current = sys.auth(src);
        sys.changeAuth(src, 0);
        sys.changeAuth(tar, current);
        if (command == "passauth")
            normalbot.sendAll(sys.name(src) + " passed their auth to " + sys.name(tar) + "!", staffchannel);
        return;
    }
    //if (sys.name(src) == "Ozma" && (command == "ban" || command == "unban")) {
    //    return this.adminCommand(src, command, commandData, tar);
    //}
    if (cmp(sys.name(src),"nixeagle") && ["showteam"].indexOf(command) != -1) {
       return this.ownerCommand(src, command, commandData, tar);
    }
    return "no command";
}
,

silence: function(src, minutes, chanName) {
    var delay = parseInt(minutes * 60);
    if (isNaN(delay) || delay <= 0) {
        channelbot.sendChanMessage(src, "Sorry, I couldn't read your minutes.");
    }

    if (!chanName) {
        bot.sendChanMessage(src, "Sorry, global silence is disabled. Use /silence 5 Channel Name");
        /*
        normalbot.sendMainTour("" + sys.name(src) + " called for " + minutes + " Minutes of Silence!");
        muteall = true;
        sys.callLater('if (!muteall) return; muteall = false; normalbot.sendMainTour("Silence is over.");', delay);
        */
    } else {
        var cid = sys.channelId(chanName);
        if (cid !== undefined) {
            channelbot.sendAll("" + sys.name(src) + " called for " + minutes + " Minutes Of Silence in "+chanName+"!", cid);
            SESSION.channels(cid).muteall = true;
            sys.callLater('if (!SESSION.channels('+cid+').muteall) return; SESSION.channels('+cid+').muteall = false; normalbot.sendAll("Silence is over in '+chanName+'.",'+cid+');', delay);
        } else {
            channelbot.sendChanMessage(src, "Sorry, I couldn't find a channel with that name.");
        }
    }
}
,

silenceoff: function(src, chanName) {
    if (chanName !== undefined) {
        var cid = sys.channelId(chanName);
        if (!SESSION.channels(cid).muteall) {
            channelbot.sendChanMessage(src, "Nah.");
            return;
        }
        channelbot.sendAll("" + sys.name(src) + " cancelled the Minutes of Silence in "+chanName+"!", cid)
        SESSION.channels(cid).muteall = false;
    } else {
        if (!muteall) {
            normalbot.sendChanMessage(src, "Nah.");
            return;
        }
        normalbot.sendMainTour("" + sys.name(src) + " cancelled the Minutes of Silence!");
        muteall = false;
    }
}
,
meoff: function(src, commandData) {
    if (commandData === undefined) {
        meoff=true;
        normalbot.sendMainTour("" + sys.name(src) + " turned off /me.");
    } else {
        var cid = sys.channelId(commandData);
        if (cid !== undefined) {
            SESSION.channels(cid).meoff = true;
            normalbot.sendAll("" + sys.name(src) + " turned off /me in "+commandData+".", cid);
        } else {
            normalbot.sendChanMessage(src, "Sorry, that channel is unknown to me.");
        }
    }
    return;
}
,
meon: function(src, commandData) {
    if (commandData === undefined) {
        meoff=false;
        normalbot.sendMainTour("" + sys.name(src) + " turned on /me.");
    } else {
        var cid = sys.channelId(commandData);
        if (cid !== undefined) {
            SESSION.channels(cid).meoff = false;
            normalbot.sendAll("" + sys.name(src) + " turned on /me in "+commandData+".", cid);
        } else {
            normalbot.sendChanMessage(src, "Sorry, that channel is unknown to me.");
        }
    }
}
,
adminCommand: function(src, command, commandData, tar) {
    if (command == "memorydump") {
        sendChanMessage(src, sys.memoryDump());
        return;
    }
    if (command == "megauser") {
        if (tar != "undefined") {
            SESSION.users(tar).megauser = true;
            normalbot.sendAll("" + sys.name(tar) + " was megausered by " + nonFlashing(sys.name(src)) + ".");
            megausers += "*" + sys.name(tar) + "*";
            sys.saveVal("megausers", megausers);
        }
        return;
    }
     if (command == "megauseroff") {
        if (tar != undefined) {
            SESSION.users(tar).megauser = false;
            normalbot.sendAll("" + sys.name(tar) + " was removed megauser by " + nonFlashing(sys.name(src)) + ".");
            megausers = megausers.split("*" + sys.name(tar) + "*").join("");
            sys.saveVal("megausers", megausers);
        } else {
            normalbot.sendAll("" + commandData + " was removed megauser.");
            megausers = megausers.split("*" + commandData + "*").join("");
            sys.saveVal("megausers", megausers);
        }
        return;
    }
    if (command == "indigoinvite") {

        if (channel != staffchannel && channel != sys.id("shanaindigo")) {
            normalbot.sendChanMessage(src, "Can't use on this channel.");
            return;
        }
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Your target is not online.");
            return;
        }
        if (SESSION.users(tar).megauser || SESSION.users(tar).contributions || sys.auth(tar) > 0) {
            normalbot.sendChanMessage(src, "They have already access.");
            return;
        }
        normalbot.sendAll("" + sys.name(src) + " summoned " + sys.name(tar) + " to this channel!", channel);
        SESSION.channels(channel).invitelist.push(tar);
        sys.putInChannel(tar, channel);
        normalbot.sendChanMessage(tar, "" + sys.name(src) + " made you join this channel!");
        return;
    }
    if (command == "indigodeinvite") {
        var count = 0;
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if (sys.isInChannel(current_player, staffchannel) && !this.canJoinStaffChannel(current_player)) {
                sys.kick(current_player, staffchannel);
                count = 1;
            }
        }
        normalbot.sendAll("" + count + " unwanted visitors were kicked...", staffchannel);
        return;
    }
    if (command == "destroychan") {
        var ch = commandData
        var chid = sys.channelId(ch)
        if(sys.existChannel(ch) != true) {
            normalbot.sendChanMessage(src, "No channel exists by this name!");
            return;
        }
        if (chid == 0 || chid == staffchannel ||  chid == tourchannel || (SESSION.channels(chid).perm == true) ) {
            normalbot.sendChanMessage(src, "This channel cannot be destroyed!");
            return;
        }
        var players = sys.playersOfChannel(chid)
        for(x in players) {
            sys.kick(players[x], chid)
            if (sys.isInChannel(players[x], 0) != true) {
                sys.putInChannel(players[x], 0)
            }
        }
        return;
    }
    if (command == "ban") {
        if(sys.dbIp(commandData) == undefined) {
            normalbot.sendChanMessage(src, "No player exists by this name!");
            return;
        }
        if (sys.maxAuth(sys.ip(tar))>=sys.auth(src)) {
           normalbot.sendChanMessage(src, "Can't do that to higher auth!");
           return;
        }

        var ip = sys.dbIp(commandData);
        var alias=sys.aliases(ip)
        var y=0;
        var z;
        for(var x in alias) {
            z = sys.dbAuth(alias[x])
            if (z > y) {
                y=z
            }
        }
        if(y>=sys.auth(src)) {
           normalbot.sendChanMessage(src, "Can't do that to higher auth!");
           return;
        }
        var banlist=sys.banList()
        for(a in banlist) {
            if(ip == sys.dbIp(banlist[a])) {
                normalbot.sendChanMessage(src, "He/she's already banned!");
                return;
            }
        }

        sys.sendHtmlAll('<b><font color=red>' + commandData + ' was banned by ' + nonFlashing(sys.name(src)) + '!</font></b>');
        sys.ban(commandData);
        this.kickAll(ip);
        sys.appendToFile('bans.txt', sys.name(src) + ' banned ' + commandData + "\n")
        return;
    }
    if (command == "unban") {
        if(sys.dbIp(commandData) == undefined) {
            normalbot.sendChanMessage(src, "No player exists by this name!");
            return;
        }
        var banlist=sys.banList()
        for(a in banlist) {
            if(sys.dbIp(commandData) == sys.dbIp(banlist[a])) {
                sys.unban(commandData)
                normalbot.sendChanMessage(src, "You unbanned " + commandData + "!");
                sys.appendToFile('bans.txt', sys.name(src) + ' unbanned ' + commandData + "n")
                return;
            }
        }
        normalbot.sendChanMessage(src, "He/she's not banned!");
        return;
    }

    if (command == "smute") {
        script.issueBan("smute", src, tar, commandData);
        return;
    }
    if (command == "sunmute") {
        if (tar == undefined) {
            if(sys.dbIp(commandData) != undefined) {
                if (smutes.get(commandData)) {
                    normalbot.sendAll("IP address " + commandData + " was secretly unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                    smutes.remove(commandData);
                    return;
                }
                var ip = sys.dbIp(commandData)
                if (smutes.get(ip)) {
                    normalbot.sendAll("" + commandData + " was secretly unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
                    smutes.remove(ip);
                    return;
                }
                normalbot.sendChanMessage(src, "He/she's not secretly muted.");
                return;
            }
            return;
        }
        if (!SESSION.users(sys.id(commandData)).smute.active) {
            normalbot.sendChanMessage(src, "He/she's not secretly muted.");
            return;
        }
        normalbot.sendAll("" + commandData + " was secretly unmuted by " + nonFlashing(sys.name(src)) + "!", staffchannel);
        SESSION.users(sys.id(commandData)).un("smute");

        return;
    }
    if (command == "nameban") {
        if (commandData === undefined) {
            normalbot.sendChanMessage(src, "Sorry, can't name ban empty names.");
            return;
        }
        var regex;
        try {
            regex = new RegExp(commandData.toLowerCase()); // incase sensitive
        } catch (e) {
            normalbot.sendChanMessage(src, "Sorry, your regular expression '" +commandData + "' fails. (" + e + ")");
        }
        nameBans.push(regex);
        var serialized = {nameBans: []};
        for (var i = 0; i < nameBans.length; ++i) {
            serialized.nameBans.push(nameBans[i].source);
        }
        sys.writeToFile("nameBans.json", JSON.stringify(serialized));
        normalbot.sendChanMessage(src, "You banned: " + regex.toString());
        return;
    }
    if (command == "nameunban") {
        var toDelete = -1;
        for (var i = 0; i < nameBans.length; ++i) {
            if (nameBans[i].toString() == commandData) {
                toDelete = i;
                break;
            }
        }
        if (toDelete >= 0) {
            normalbot.sendChanMessage(src, "You unbanned: " + nameBans[toDelete].toString());
            nameBans.splice(toDelete,1);
        } else {
            normalbot.sendChanMessage(src, "No match.");
        }
        return;
    }
    if (command == "channelusers") {
        if (commandData === undefined) {
            normalbot.sendChanMessage(src, "Please give me a channelname!");
            return;
        }
        var chanid;
        var isbot;
        if (commandData[0] == "~") {
            chanid = sys.channelId(commandData.substring(1));
            isbot = true;
        } else {
            chanid = sys.channelId(commandData);
            isbot = false;
        }
        if (chanid === undefined) {
            channelbot.sendChanMessage(src, "Such a channel doesn't exist!");
            return;
        }
        var chanName = sys.channel(chanid);
        var players = sys.playersOfChannel(chanid);
        var objectList = [];
        var names = [];
        for (var i = 0; i < players.length; ++i) {
            var name = sys.name(players[i]);
            if (isbot)
                objectList.push({'id': players[i], 'name': name});
            else
                names.push(name);
        }
        if (isbot) {
            var channelData = {'type': 'ChannelUsers', 'channel-id': chanid, 'channel-name': chanName, 'players': objectList};
            sendChanMessage(src, ":"+JSON.stringify(channelData));
        } else {
            channelbot.sendChanMessage(src, "Users of channel #" + chanName + " are: " + names.join(", "));
        }
        return;
    }
    // hack, for allowing some subset of the owner commands for super admins
    if (isSuperAdmin(src)) {
       if (["eval"].indexOf(command) != -1 && sys.name(src).toLowerCase() != "lamperi") {
           normalbot.sendChanMessage(src, "Can't aboos some commands");
           return;
       }
       return this.ownerCommand(src, command, commandData, tar);
    }

    return "no command";
}
,
ownerCommand: function(src, command, commandData, tar) {
    if (command == "changerating") {
        var data =  commandData.split(' -- ');
        if (data.length != 3) {
            normalbot.sendChanMessage(src, "You need to give 3 parameters.");
            return;
        }
        var player = data[0];
        var tier = data[1];
        var rating = parseInt(data[2]);

        sys.changeRating(player, tier, rating);
        normalbot.sendChanMessage(src, "Rating of " + player + " in tier " + tier + " was changed to " + rating);
        return;
    }
    if (command == "getannouncement") {
        sendChanMessage(src, sys.getAnnouncement());
        return;
    }
    if (command == "testannouncement") {
        sys.setAnnouncement(commandData, src);
        return;
    }
    if (command == "setannouncement") {
        sys.changeAnnouncement(commandData);
        return;
    }
    if (command == "capslockday") {
        if (commandData == "off")
            CAPSLOCKDAYALLOW = false;
        else
            CAPSLOCKDAYALLOW = true;
        return;
    }
    if (command == "contributor") {
        var s = commandData.split(":");
        contributors.add(s[0], s[1]);
        return;
    }
    if (command == "contributoroff") {
        contributors.remove(commandData);
        return;
    }
    if (command == "showteam") {
        sendChanMessage(src, "");
        var info = this.importable(tar);
        for (var x=0; x < info.length; ++x) {
            sys.sendMessage(src, info[x], channel);
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "rangeban") {
        var subip;
        var comment;
        var space = commandData.indexOf(' ');
        if (space != -1) {
            subip = commandData.substring(0,space);
            comment = commandData.substring(space+1);
        } else {
            subip = commandData;
            comment = '';
        }
        /* check ip */
        var i = 0;
        var nums = 0;
        var dots = 0;
        var correct = true;
        while (i < subip.length) {
            var c = subip[i];
            if (c == '.' && nums > 0 && dots < 3) {
                nums = 0;
                ++dots;
                ++i;
            } else if (c == '.' && nums == 0) {
                correct = false;
                break;
            } else if (/^[0-9]$/.test(c) && nums < 3) {
                ++nums;
                ++i;
            } else {
                correct = false;
                break;
            }
        }
        if (!correct) {
            normalbot.sendChanMessage(src, "The IP address looks strange, you might want to correct it: " + subip);
            return;
        }

        /* add rangeban */
        rangebans.add(subip, rangebans.escapeValue(comment));
        normalbot.sendChanMessage(src, "Rangeban added successfully for IP subrange: " + subip);
        /* kick them */
        var players = sys.playerIds();
        var players_length = players.length;
        var names = [];
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            var ip = sys.ip(current_player);
            if (sys.auth(current_player) > 0) continue;
            if (ip.substr(0, subip.length) == subip && allowedNames.indexOf(name) == -1) {
                names.append(sys.name(current_player));
                sys.kick(current_player);
                return;
            }
        }
        if (names.length > 0) {
            sys.sendAll(names.join(", ") + " got range banned by " + sys.name(src));
        }
        return;
    }
    if (command == "rangeunban") {
        var subip = commandData;
        if (rangebans.get(subip) !== undefined) {
            rangebans.remove(subip);
            normalbot.sendChanMessage(src, "Rangeban removed successfully for IP subrange: " + subip);
        } else {
            normalbot.sendChanMessage(src, "No such rangeban.");
        }
        return;
    }
    if (command == "purgemutes") {
        var time = parseInt(commandData);
        if (isNaN(time)) {
            time = 60*60*24*7*4;
        }
        var limit = parseInt(sys.time()) - time;
        var removed = [];
        mutes.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0]) < limit || (data.length > 3 && parseInt(data[2]) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendChanMessage(src, "" + removed.length + " mutes purged successfully.");
        } else {
            normalbot.sendChanMessage(src, "No mutes were purged.");
        }
        return;
    }
    if (command == "purgembans") {
        var time = parseInt(commandData);
        if (isNaN(time)) {
            time = 60*60*24*7;
        }
        var limit = parseInt(sys.time()) - time;
        var removed = [];
        mbans.removeIf(function(memoryhash, item) {
            var data = memoryhash.get(item).split(":");
            if (parseInt(data[0]) < limit || (data.length > 3 && parseInt(data[2]) < limit)) {
                removed.push(item);
                return true;
            }
            return false;
        });
        if (removed.length > 0) {
            normalbot.sendChanMessage(src, "" + removed.length + " mafiabans purged successfully.");
        } else {
            normalbot.sendChanMessage(src, "No mafiabans were purged.");
        }
        return;
    }
    if (command == "sendall") {
        sendChanAll(commandData);
        return;
    }
    if (command == "imp") {
        SESSION.users(src).impersonation = commandData;
        normalbot.sendChanMessage(src, "Now you are " + SESSION.users(src).impersonation + "!");
        return;
    }
    if (command == "periodicsay") {
        var sayer = src;
        var args = commandData.split(":");
        var minutes = parseInt(args[0]);
        if (minutes < 3) {
            return;
        }
        var channels = args[1].split(",");
        var cids = [];
        for (var i = 0; i < channels.length; ++i) {
            var cid = sys.channelId(channels[i].replace(/(^\s*)|(\s*$)/g, ""));
            if (cid !== undefined) cids.push(cid);
        }
        if (cids.length == 0) return;
        var what = args.slice(2).join(":");
        var count = 1;
        var callback = function(sayer, minutes, cids, what, count) {
            var name = sys.name(sayer);
            if (name === undefined) return;
            SESSION.users(sayer).callcount--;
            if (SESSION.users(sayer).endcalls) {
                normalbot.sendMessage(src, "Periodic say of '"+what+"' has ended.");
                SESSION.users(sayer).endcalls = false;
                return;
            }
            for (var i = 0; i < cids.length; ++i) {
                var cid = cids[i];
                if (sys.isInChannel(sayer, cid))
                    sys.sendAll(sys.name(sayer) + ": " + what, cid);
            }
            if (++count > 100) return; // max repeat is 100
            SESSION.users(sayer).callcount++;
            sys.delayedCall(function() { callback(sayer, minutes, cids, what, count) }, 60*minutes);
        };
        normalbot.sendMessage(src, "Starting a new periodicsay");
        SESSION.users(sayer).callcount = SESSION.users(sayer).callcount || 0;
        SESSION.users(sayer).callcount++;
        callback(sayer, minutes, cids, what, count);

        return;
    }
    if (command == "endcalls") {
        if (SESSION.users(src).callcount == 0 || SESSION.users(src).callcount === undefined) {
            normalbot.sendMessage(src, "You have no periodic calls I think.");
        } else {
            normalbot.sendMessage(src, "You have " + SESSION.users(src).callcount + " calls running.");
        }
        if (SESSION.users(src).endcalls !== true) {
            SESSION.users(src).endcalls = true;
            normalbot.sendMessage(src, "Next periodic call called will end.");
        } else {
            SESSION.users(src).endcalls = false;
            normalbot.sendMessage(src, "Cancelled the ending of periodic calls.");
        }
        return;
    }
    if (command == "changeauth") {
        var pos = commandData.indexOf(' ');
        if (pos == -1) {
            return;
        }

        var newauth = commandData.substring(0, pos);
        var name = commandData.substr(pos+1);
        var tar = sys.id(name);
        if(newauth>0 && sys.dbRegistered(name)==false){
            normalbot.sendMessage(src, "This person is not registered")
            normalbot.sendMessage(tar, "Please register, before getting auth")
            return;
        }
        if (tar !== undefined) {
            sys.changeAuth(tar, newauth);
            normalbot.sendAll("" + sys.name(src) + " changed auth of " + sys.name(tar) + " to " + newauth);
        } else {
            sys.changeDbAuth(name, newauth);
            normalbot.sendAll("" + sys.name(src) + " changed auth of " + name + " to " + newauth);
        }

        return;
    }
    if (command == "variablereset") {
        delete VarsCreated
        this.init()
        return;
    }
    if (command == "writetourstats") {
        var jsonObject = {};
        jsonObject.tourwinners = tourwinners
        jsonObject.tourstats = tourstats
        jsonObject.tourrankingsbytier = tourrankingsbytier
        sys.writeToFile('tourstats.json', JSON.stringify(jsonObject));
        normalbot.sendChanMessage(src, 'Tournament stats were saved!');
        return;
    }
    if (command == "reloadtourstats") {
        try {
            var jsonObject = JSON.parse(sys.getFileContent('tourstats.json'));
            tourwinners = jsonObject.tourwinners;
            tourstats = jsonObject.tourstats;
            tourrankingsbytier = jsonObject.tourrankingsbytier;
            normalbot.sendChanMessage(src, 'Tournament stats were reloaded!');
        } catch (err) {
            normalbot.sendChanMessage(src, 'Reloading tournament stats failed!');
            print('Could not read tourstats, initing to null stats.');
            print('Error: ' + err);
        }
        return;
    }
    if (command == "resettourstats") {
        tourwinners = [];
        tourstats = {};
        tourrankings = {};
        tourrankingsbytier = {};
        normalbot.sendAll('Tournament winners were cleared!');
        return;
    }
    if (command == "eval" && (sys.ip(src) == sys.dbIp("coyotte508") || sys.name(src).toLowerCase() == "darkness" || sys.name(src).toLowerCase() == "lamperi")) {
        sys.eval(commandData);
        return;
    }
    if (command == "indigo") {

        if (commandData == "on") {
            if (sys.existChannel("Indigo Plateau")) {
                staffchannel = sys.channelId("Indigo Plateau");
            } else {
                staffchannel = sys.createChannel("Indigo Plateau");
            }
            SESSION.channels(staffchannel).topic = "Welcome to the Staff Channel! Discuss of all what users shouldn't hear here! Or more serious stuff...";
            SESSION.channels(staffchannel).perm = true;
            normalbot.sendMessage(src, "Staff channel was remade!")
            return;
            }
        if (commandData == "off") {
            SESSION.channels(staffchannel).perm = false;
            players = sys.playersOfChannel(staffchannel)
            for(x in players) {
                sys.kick(players[x], staffchannel)
                if (sys.isInChannel(players[x], 0) != true) {
                    sys.putInChannel(players[x], 0)
                }
            }
            normalbot.sendMessage(src, "Staff channel was destroyed!")
            return;
        }
    }
    if (command == "stopbattles") {
        battlesStopped = !battlesStopped;
        if (battlesStopped)  {
            sys.sendAll("");
            sys.sendAll("*** ********************************************************************** ***");
            battlebot.sendAll("The battles are now stopped. The server will restart soon.");
            sys.sendAll("*** ********************************************************************** ***");
            sys.sendAll("");
        } else {
            battlebot.sendAll("False alarm, battles may continue.");
        }
        return;
    }
    if (command == "clearpass") {
        var mod = sys.name(src);

        if (sys.dbAuth(commandData) > 2) {
            return;
        }
        sys.clearPass(commandData);
        normalbot.sendChanMessage(src, "" + commandData + "'s password was cleared!");
        if (tar !== undefined)
            normalbot.sendMessage(tar, "Your password was cleared by " + mod + "!");
        return;
    }
    if (command == "updatescripts") {
        normalbot.sendChanMessage(src, "Fetching scripts...");
        var updateURL = "https://raw.github.com/lamperi/po-server-goodies/master/scripts.js";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        var changeScript = function(resp) {
            if (resp == "") return;
            try {
                sys.changeScript(resp);
                sys.writeToFile('scripts.js', resp);
            } catch (err) {
                sys.changeScript(sys.getFileContent('scripts.js'));
                normalbot.sendAll('Updating failed, loaded old scripts!', staffchannel);
                sendChanMessage(src, "ERROR: " + err);
                print(err);
            }
        };
        normalbot.sendChanMessage(src, "Fetching scripts from " + updateURL);
        sys.webCall(updateURL, changeScript);
        return;
    }
    if (command == "updatetiers") {
        normalbot.sendChanMessage(src, "Fetching tiers...");
        var updateURL = "https://raw.github.com/lamperi/po-server-goodies/master/tiers.xml";
        if (commandData !== undefined && (commandData.substring(0,7) == 'http://' || commandData.substring(0,8) == 'https://')) {
            updateURL = commandData;
        }
        normalbot.sendChanMessage(src, "Fetching tiers from " + updateURL);
        sys.webCall(updateURL, "sys.writeToFile('tiers.xml', resp); sys.reloadTiers();");
        return;
    }
    if (command == "setmafiachannel") {
        if (sys.existChannel(commandData))
            mafiachan = sys.channelId(commandData);
        return;
    }
    return "no command";
}
,
channelCommand: function(src, command, commandData, tar) {
    var poChannel = SESSION.channels(channel);
    if (poChannel.operators === undefined)
        poChannel.operators = [];
    if (command == "ck" || command == "channelkick") {
        if (tar == undefined) {
            normalbot.sendChanMessage(src, "Choose a valid target for your wrath!");
            return;
        }
        normalbot.sendChanAll("" + sys.name(src) + " kicked " + commandData + " from this channel.");
        sys.kick(tar, channel);
        return;
    }
    if (command == "invitelist") {
        var names = [];
        var toRemove = [];
        for (var i = 0; i < poChannel.invitelist.length; ++i) {
            var name = sys.name(parseInt(poChannel.invitelist[i]));
            if (name) names.push(name);
            else toRemove.push(i);
        }
        while (toRemove.length > 0) {
            var j = toRemove.pop();
            poChannel.invitelist.splice(j,1);
        }
        normalbot.sendChanMessage(src, "Invited people: " + names.join(", "));
        return;
    }
    if (command == "invite") {
        if (tar === undefined) {
            normalbot.sendChanMessage(src, "Choose a valid target for invite!");
            return;
        }
        if (sys.isInChannel(tar, channel)) {
            normalbot.sendChanMessage(src, "Your target already sits here!");
            return;
        }
        normalbot.sendMessage(tar, "" + sys.name(src) + " would like you to join #" + sys.channel(channel) + "!");
        if (poChannel.inviteonly) {
            poChannel.invitelist.push(tar);
            if (poChannel.invitelist.length > 25) {
                poChannel.invitelist.splice(0,1);
                normalbot.sendChanMessage(src, "Your target was invited, but the invitelist was truncated to 25 players.");
                return;
            }
        }
        normalbot.sendChanMessage(src, "Your target was invited.");
        return;
    }

    if (command == "inviteonly") {
        var level = sys.auth(src) >= 3 ? 3 : sys.auth(src) + 1;
        if (commandData == "on") {
            poChannel.inviteonly = level;
            normalbot.sendChanAll("This channel was made inviteonly with level " + level + ".");
        } else if (commandData == "off") {
            poChannel.inviteonly = 0;
            normalbot.sendChanAll("This channel is not inviteonly anymore.");
        } else {
            if (poChannel.inviteonly) {
                normalbot.sendChanMessage(src, "This channel is inviteonly with level " + poChannel.inviteonly + ".");
            } else {
                normalbot.sendChanMessage(src, "This channel is not inviteonly.");
            }
        }
        return;
    }
    if (command == "op") {
        poChannel.addOperator(src, commandData);
        return;
    }

    if (command == "deop") {
        poChannel.removeOperator(src, commandData);
        return;
    }
    if (command == "topicadd") {
        if (poChannel.topic.length > 0)
            poChannel.setTopic(src, poChannel.topic + " | " + commandData);
        else
            poChannel.setTopic(src, commandData);
        return;
    }
    if (command == "cmeon") {
        this.meon(src, sys.channel(channel));
        return;
    }
    if (command == "cmeoff") {
        this.meoff(src, sys.channel(channel));
        return;
    }

    if (command == "csilence") {
        if (typeof(commandData) == "undefined") {
            return;
        }
        this.silence(src, commandData, sys.channel(channel));
        return;
    }
    if (command == "csilenceoff") {
        this.silenceoff(src, sys.channel(channel));
        return;
    }

    if (command == "cmute") {
        if (poChannel.mute(commandData)) {
            channelbot.sendChanAll(commandData + " was channel muted by " + nonFlashing(sys.name(src)));
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }
    if (command == "cunmute") {
        if (poChannel.unmute(commandData)) {
            channelbot.sendChanAll(commandData + " was channel unmuted by " + nonFlashing(sys.name(src)));
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }

    if (command == "cmutes") {
        var data = ["Following mutes in effect: "];
        for (var ip in poChannel.muted.ips) {
            data.push(ip + ", ");
        }
        channelbot.sendChanMessage(src, data.join(""));
        return;
    }

    if (command == "cbans") {
        var data = ["Following bans in effect: "];
        for (var ip in poChannel.banned.ips) {
            data.push(ip + ", ");
        }
        channelbot.sendChanMessage(src, data.join(""));
        return;
    }

    // followign commands only for Channel Masters
    if (!poChannel.isChannelMaster(src) && sys.auth(src) != 3 && !isSuperAdmin(src))
        return "no command";

    if (command == "ctoggleflood") {
        poChannel.ignoreflood = !poChannel.ignoreflood;
        channelbot.sendChanMessage(src, "Now " + (poChannel.ignoreflood ? "" : "dis") + "allowing excessive flooding.");
        return;
    }

    if (command == "ctogglecaps") {
        poChannel.ignorecaps = !poChannel.ignorecaps;
        channelbot.sendChanMessage(src, "Now " + (poChannel.ignorecaps ? "" : "dis") + "allowing excessive CAPS-usage.");
        return;
    }

    if (command == "cban") {
        if (poChannel.ban(commandData)) {
            channelbot.sendChanMessage(src, "Your target was channel banned.");
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }

    if (command == "cunban") {
        if (poChannel.unban(commandData)) {
            channelbot.sendChanMessage(src, "Your target was channel unbanned.");
        } else {
            channelbot.sendChanMessage(src, "Couldn't find: "+commandData+".");
        }
        return;
    }

    if (command == "owner") {
        poChannel.addOwner(src, commandData);
        return;
    }
    if (command == "deowner") {
        poChannel.removeOwner(src, commandData);
        return;
    }

    return "no command";
}
,
beforeChatMessage: function(src, message, chan) {
    channel = chan;
    if ((chan == 0 && message.length > 250 && sys.auth(src) < 1)
       || (message.length > 650 && sys.auth(src) < 2)) {
        normalbot.sendChanMessage(src, "Hi! Your message is too long, please make it shorter :3")
        sys.stopEvent();
        return;
    }

    /* Stops shanai's tourney messages from flooding the main chat */
    /* Disabled by Lam - nixeagle made the announcement box a lot shorter */
    /* Reenabled by coyo - mafia games only appear not often, so do regular tournaments, so should shanai */
    /* Disabled By Lam 2011-10-10
    if (message.length > 150 && sys.name(src) == "Shanai" && chan == 0) {
       if (typeof shanaimessage == 'undefined') {
          shanaimessage = parseInt(sys.time());
       } else {
          var shanaitime = parseInt(sys.time());
          if ((shanaitime - shanaimessage) < 500) {
            sys.stopEvent();
            return;
          } else {
            shanaimessage = shanaitime;
          }
       }
    }
    */

    if (message == ".") {
        sendChanMessage(src, sys.name(src)+": .", true);
        sys.stopEvent();
        this.afterChatMessage(src, message, chan);
        return;
    }

    var name = sys.name(src).toLowerCase();
    // spamming bots, linking virus sites
    // using lazy points system for minimizing false positives
    if (channel == 0 && sys.auth(src) == 0) {
        //if (/http:\/\/(.*)\.tk(\b|\/)/.test(message)) {
            //bot.sendAll('.tk link pasted at #Tohjo Falls: "' + sys.name(src) + '", ip: ' + sys.ip(src) + ', message: "' + message + '".', staffchannel);
        //}
        var points = 0;

        if (!sys.dbRegistered(name)) {
            points += sys.name(src) == name.toUpperCase() ? 1 : 0;
            points += sys.ip(src).split(".")[0] in {'24': true, '64': true, '99': true} ? 1 : 0;
            points += name.indexOf("fuck") > -1 ? 2 : 0;
            points += name.indexOf("fag") > -1 ? 1 : 0;
            points += name.indexOf("tom") > -1 ? 1 : 0;
            points += name.indexOf("blow") > -1 ? 2 : 0;
            points += name.indexOf("slut") > -1 ? 2 : 0;
            points += name.indexOf("bot") > -1 ? 1 : 0;
            points += name.indexOf("smogon") > -1 ? 2 : 0;
            points += name.indexOf("troll") > -1 ? 1 : 0;
            points += name.indexOf("69") > -1 ? 1 : 0;
            points += name.indexOf("update") > -1 ? 1 : 0;
            points += message.indexOf("http://pokemon-online.eu") > -1 ? -5 : 0;
            points += message.indexOf("bit.ly") > -1 ? 1 : 0;
            points += message.indexOf(".tk") > -1 ? 2 : 0;
            points += message.indexOf("free") > -1 ? 1 : 0;
        }
        if (points >= 4) {
            normalbot.sendAll('Spammer: "' + sys.name(src) + '", ip: ' + sys.ip(src) + ', message: "' + message + '". Banned.', staffchannel);
            sys.ban(sys.name(src))
            this.kickAll(sys.ip(src));
            sys.stopEvent();
            return;
        }
    }
    if (SESSION.users(src).expired("mute")) {
        SESSION.users(src).un("mute");
        normalbot.sendChanMessage(src, "your mute has expired.");
        normalbot.sendAll("" + sys.name(src) + "'s mute has expired.", trollchannel);
    }
    if (sys.auth(src) < 3 && SESSION.users(src).mute.active && message != "!join" && message != "/rules" && message != "/join" && message != "!rules" && channel != trollchannel && !(["\\join", "\\subme", "\\unjoin"].indexOf(message) >= 0 && channel == shanaitourchannel)) {
        var muteinfo = SESSION.users(src).mute;
        normalbot.sendChanMessage(src, "You are muted" + (muteinfo.by ? " by " + muteinfo.by : '')+". " + (muteinfo.expires > 0 ? "Mute expires in " + getTimeString(muteinfo.expires - parseInt(sys.time())) + ". " : '') + (muteinfo.reason ? "[Reason: " + muteinfo.reason + "]" : ''));
        sys.stopEvent();
        return;
    }
    var poChannel = SESSION.channels(channel);
    if (sys.auth(src) < 1 && !poChannel.canTalk(src)) {
        channelbot.sendChanMessage(src, "You are muted on this channel! You can't speak unless channel operators and masters unmute you.");
        sys.stopEvent();
        return;
    }

    // text reversing symbols
    // \u0458 = "j"
    if (/[\u0458\u0489\u202a-\u202e\u0300-\u036F\u1dc8\u1dc9\ufffc\u1dc4-\u1dc7\u20d0\u20d1]/.test(message)) {
        sys.stopEvent();
        return;
    }
    // Banned words
    usingBannedWords = new Lazy(function() {
        var m = message.toLowerCase();
        var BannedUrls = ["meatspin.com", "smogonscouting.tk", "lovethecock.com"];
        var BanList = [".tk", "nimp.org", "drogendealer", /\u0E49/, "nobrain.dk", /\bn[1i]gg+ers*\b/i, "penis", "vagina", "fuckface", /\bhur+\b/, /\bdur+\b/, "hurrdurr", /\bherp\b/, /\bderp\b/];
        if (m.indexOf("http") != -1) {
            for (var i = 0; i < BannedUrls.length; ++i) {
                if (m.indexOf(BannedUrls[i]) != -1) {
                    return true;
                }
            }
        }
        for (var i = 0; i < BanList.length; ++i) {
            var filter = BanList[i];
            if (typeof filter == "string" && m.indexOf(filter) != -1 || typeof filter == "function" && filter.test(m)) {
                return true;
            }
        }
        return false;
    });
    repeatingOneself = new Lazy(function() {
        var user = SESSION.users(src);
        var ret = false;
        if (!user.lastline) {
           user.lastline = {message: null, time: 0};
        }
        var time = parseInt(sys.time());
        if (sys.auth(src) < 1 && user.lastline.message == message && user.lastline.time + 15 > time) {
            normalbot.sendChanMessage(src, "Please do not repeat yourself!");
            ret = true;
        }
        user.lastline.time = time;
        user.lastline.message = message;
        return ret;he
    });
    capsName = new Lazy(function() {
        var name = sys.name(src);
        var caps = 0;
        for (var i = name.length-1; i >= 0; --i) {
            if ('A' <= name[i] && name[i] <= 'Z')
                ++caps;
        }
        return (caps > 7 && 2*name.length < 3*caps);
    });

    shanaiForward = function(msg) {
        var shanai = sys.id("Shanai");
        if (shanai !== undefined) {
            sys.sendMessage(shanai,"CHANMSG " + chan + " " + src + " :" + msg);
        } else {
            sys.sendMessage(src, "+ShanaiGhost: Shanai is offline, your command will not work. Ping nixeagle if he's online.", chan);
        }
        sys.stopEvent();
    }

    // Forward some commands to Shanai
    if (['|', '\\'].indexOf(message[0]) > -1 && !usingBannedWords() && name != 'coyotte508') {
        shanaiForward(message);
        return;
    }

    if (amoebaGame.beforeChatMessage(src, message, chan)) return;

    if ((message[0] == '/' || message[0] == '!') && message.length > 1) {
        if (parseInt(sys.time()) - lastMemUpdate > 500) {
            sys.clearChat();
            lastMemUpdate = parseInt(sys.time());
        }

        sys.stopEvent();

        if (channel == mafiachan && !SESSION.users(src).mute.active) {
            try {
                mafia.handleCommand(src, message.substr(1));
                return;
            } catch (err) {
                if (err != "no valid command") {
                    mafiabot.sendAll("error occurred: " + err, mafiachan);
                    mafia.endGame(0);
                    mafia.themeManager.disable(0, mafia.theme.name)
                    return;
                }
            }
        }

        if (!SESSION.users(src).mute.active) {
            try {
               suspectVoting.handleCommand(src, message.substr(1));
               return;
            } catch (err) {
                if (err != "no valid command")
                    return;
            }
        }


        var command;
        var commandData = undefined;
        var pos = message.indexOf(' ');

        if (pos != -1) {
            command = message.substring(1, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(1).toLowerCase();
        }
        var tar = sys.id(commandData);

        // Forward some commands to shanai in case she is online and the command character is "/"
        var forwardShanaiCommands = ["join", "subme", "unjoin", "viewround", "queue", "dq", "myflashes", "flashme", "unflashme", "tour", "iom", "ipm", "viewtiers", "tourrankings", "sub", "endtour", "queuerm", "start", "pushtour", "push", "salist", "activesa", "activesas", "tourranking", "tourdetails", "start", "lastwinners"];
		if (sys.id("shanai") !== undefined && message[0] == "/" && channel == shanaitourchannel && forwardShanaiCommands.indexOf(command) > -1) {
            shanaiForward("\\" + message.substr(1));
            return;
        }

        if (this.userCommand(src, command, commandData, tar) != "no command") {
            return;
        }

        if (SESSION.users(src).megauser == true || sys.auth(src) > 0 || SESSION.channels(tourchannel).isChannelOperator(src)) {
            if (this.megauserCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) > 0) {
            if (this.modCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) > 1) {
            if (this.adminCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) > 2) {
            if (this.ownerCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }

        if (sys.auth(src) == 3 || SESSION.channels(channel).isChannelOperator(src)) {
            if (this.channelCommand(src, command, commandData, tar) != "no command") {
                return;
            }
        }
        // Shanai commands
        if ((sys.auth(src) > 3 && sys.name(src) == "Shanai") || (command == "silencetriviaoff" && sys.auth(src) > 1)) {
            if (command == "sendhtmlall") {
                sys.sendHtmlAll(commandData,channel);
                return;
            }
            if (command == "sendhtmlmessage") {
                var channelToSend = parseInt(commandData.split(":::")[0]);
                var targets = commandData.split(":::")[1].split(":");
                var htmlToSend = commandData.split(":::")[2];
                for (var i=0; i<targets.length; ++i) {
                    var id = sys.id(targets[i]);
                    if (id !== undefined && sys.isInChannel(id, channelToSend))
                        sys.sendHtmlMessage(id,htmlToSend,channelToSend);
                }
                return;
            }
            if (command == "silencetrivia") {
                var id = sys.channelId("Trivia");
                if (id === undefined) return;
                SESSION.channels(id).triviaon = true;
                return;
            }
            if (command == "silencetriviaoff") {
                var id = sys.channelId("Trivia");
                if (id === undefined) return;
                SESSION.channels(id).triviaon = false;
                return;
            }
            if (command == "teaminfo") {
                var id = sys.id(commandData);
                if (id) {
                    var data = {type: 'TeamInfo', id: id, name: sys.name(id), gen: sys.gen(id), tier: sys.tier(id), importable: this.importable(id).join("\n"), registered: sys.dbRegistered(sys.name(id)), ip: sys.ip(id)};
                    sendChanMessage(src, ":"+JSON.stringify(data));
                }
            }
        }
        commandbot.sendChanMessage(src, "The command " + command + " doesn't exist");
        return;
    } /* end of commands */

    // Trivia answers
    if (chan == sys.channelId("Trivia") && SESSION.channels(chan).triviaon && !usingBannedWords()) {
        var shanai = sys.id("Shanai");
        if (src != shanai) {
            if (shanai !== undefined) {
                sys.sendMessage(shanai,"CHANMSG " + chan + " " + src + " :\\a " + message);
                sys.sendMessage(src, "±Trivia: Your answer was submitted.", chan);
            }
            sys.stopEvent();
            return;
        }
    }

    // Mafia Silence when dead
    if (channel != 0 && channel == mafiachan && mafia.ticks > 0 && mafia.state!="blank" && !mafia.isInGame(sys.name(src)) && sys.auth(src) <= 0) {
        sys.stopEvent();
        sys.sendMessage(src, Config.Mafia.notPlayingMsg, mafiachan);
        return;
    }

    // Impersonation
    if (typeof SESSION.users(src).impersonation != 'undefined') {
        sys.stopEvent();
        sendChanAll(SESSION.users(src).impersonation + ": " + message);
        return;
    }

    // Minutes of Silence
    if (sys.auth(src) == 0 && ((muteall && channel != staffchannel && channel != mafiachan && channel != sys.channelId("Trivia"))
        || SESSION.channels(channel).muteall) && !SESSION.channels(channel).isChannelOperator(src)) {
        normalbot.sendChanMessage(src, "Respect the minutes of silence!");
        sys.stopEvent();
        return;
    }

    // Banned words
    if (usingBannedWords()) {
            if (message.indexOf(".tk") != -1){
                normalbot.sendAll(sys.name(src) + " tried to send a .tk link!",staffchannel)
            }
            var aliases = sys.aliases(sys.ip(src))
                for(x in aliases){
                var id = sys.id(aliases[x])
                if(id != undefined){
        sys.sendMessage(id, sys.name(src)+": " + message, channel);
                }
                }
                sys.stopEvent();
        return;
    }
    if (repeatingOneself()) {
        this.afterChatMessage(src, SESSION.users(src).lastline.message, channel);
        sys.stopEvent();
        return;
    }
    if (capsName()) {
        normalbot.sendChanMessage(src, "You have too many CAPS letters in your name. Please remove them to speak freely. 7 CAPS letters are allowed. Lowercase name will keep your ladder score.");
        sys.stopEvent();
        return;
    }


    // Secret mute
    if (sys.auth(src) == 0 && SESSION.users(src).smute.active) {
        if (SESSION.users(src).expired("smute")) {
            SESSION.users(src).un("smute");
        } else {
            sendChanMessage(src, sys.name(src)+": "+message, true);
            sys.stopEvent();
            this.afterChatMessage(src, '/'+command+ ' '+commandData, channel);
        }
        return;
    }

    if (channel == 0 && typeof clanmute != 'undefined') {
       var bracket1 = sys.name(src).indexOf("[");
       var bracket2 = sys.name(src).indexOf("]");
       if (bracket1 >= 0 && bracket2 > 0 && bracket1 < bracket2) {
           normalbot.sendMessage(src, "Sorry, clan members can't speak on the main chat.");
           sys.stopEvent();
           return;
       }
       bracket1 = sys.name(src).indexOf("{");
       bracket2 = sys.name(src).indexOf("}");
       if (bracket1 >= 0 && bracket2 > 0 && bracket1 < bracket2) {
           normalbot.sendMessage(src, "Sorry, clan members can't speak on the main chat.");
           sys.stopEvent();
           return;
       }
    }

    //fuck filter
    /*if (/fuck/i.test(message)) {
        sys.sendMessage(src, sys.name(src)+": " + message.replace(/fuck/ig, "freak"), channel);
        sys.stopEvent();
        return;
    }*/

    if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW == true) {
    var date = new Date();
    if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
        sys.sendAll(sys.name(src)+": " + message.toUpperCase(), channel);
        sys.stopEvent();
    }
    }
} /* end of beforeChatMessage, also 1100+ lines ._. */

,

afterChatMessage : function(src, message, chan)
{

    var user = SESSION.users(src);
    var poChannel = SESSION.channels(chan);
    channel = chan;
    lineCount+=1;

    // hardcoded
    var ignoreChans = [staffchannel, sys.channelId("shanai"), sys.channelId("trivreview")];
    var ignoreUsers = ["nixeagle"];
    if (!poChannel.ignorecaps && this.isMCaps(message) && sys.auth(src) < 2 && ignoreChans.indexOf(channel) == -1 && ignoreUsers.indexOf(sys.name(src)) == -1) {
        user.caps += 3;
        if (user.caps >= 9 && !user.mute.active) {

            if (user.capsmutes === undefined)
                user.capsmutes = 0;
            var time = 900 * Math.pow(2,user.capsmutes);
            ++user.capsmutes;

            var message = "" + sys.name(src) + " was muted for caps for " + (time/60) + " minutes.";
            if (user.smute.active) {
                sys.sendMessage(src, message);
                capsbot.sendAll("" + sys.name(src) + " was muted for caps while smuted.", staffchannel);
            } else {
                capsbot.sendChanAll(message);
                if (channel != staffchannel)
                    capsbot.sendAll(message + "[Channel: "+sys.channel(channel) + "]", staffchannel);
            }
            var endtime = user.mute.active ? user.mute.expires + time : parseInt(sys.time()) + time;
            user.activate("mute", Config.capsbot, endtime, "Overusing CAPS", true);
            mafia.slayUser(Config.capsbot, sys.name(src));
            return;
        }
    } else if (user.caps > 0) {
        user.caps -= 1;
    }

    if (typeof user.timecount == "undefined") {
        user.timecount = parseInt(sys.time());
    }


    var linecount = sys.auth(src) == 0 ? 7 : 21;
    if (!poChannel.ignoreflood && sys.auth(src) < 2 && ignoreChans.indexOf(channel) == -1 && ignoreUsers.indexOf(sys.name(src)) == -1) {
        user.floodcount += 1;
        var time = parseInt(sys.time());
        if (time > user.timecount + 7) {
            var dec = Math.floor((time - user.timecount)/7);
            user.floodcount = user.floodcount - dec;
            if (user.floodcount <= 0) {
                user.floodcount = 1;
            }
            user.timecount += dec*7;
        }
        var message = "" + sys.name(src) + " was kicked " + (sys.auth(src) == 0 ? "and muted " : "") + "for flood.";
        if (user.floodcount > linecount) {
            if (user.smuted) {
                sys.sendMessage(src, message);
                kickbot.sendAll("" + sys.name(src) + " was kicked for flood while smuted.", staffchannel);
            } else {
                kickbot.sendChanAll(message);
                if (channel != staffchannel)
                    kickbot.sendAll(message + " [Channel: "+sys.channel(channel)+"]", staffchannel);
            }
            if (sys.auth(src) == 0) {
                 var endtime = user.mute.active ? user.mute.expires + 3600 : parseInt(sys.time()) + 3600;
                 user.activate("mute", Config.kickbot, endtime, "Flooding", true);
            }
            mafia.slayUser(Config.kickbot, sys.name(src));
            sys.kick(src);
            return;
        }
    }

} /* end of afterChatMessage */

,

/* Tournament script */
tourSpots : function() {
    return tournumber - tourmembers.length;
}
,

roundPairing : function() {
    roundnumber += 1;

    battlesStarted = [];
    tourbattlers = [];
    battlesLost = [];

    if (tourmembers.length == 1) {

        sys.sendAll("", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("", tourchannel);
        sys.sendAll("THE WINNER OF THE " + tourtier.toUpperCase() + " TOURNAMENT IS : " + tourplayers[tourmembers[0]], tourchannel);
        sys.sendAll("", tourchannel);
        sys.sendAll("*** Congratulations, " + tourplayers[tourmembers[0]] + ", on your success! ***", tourchannel);
        sys.sendAll("", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("", tourchannel);
        tourmode = 0;

        // tier, time, number of participants, winner
        var tier = tourtier;
        var time = sys.time();
        var winner = tourplayers[tourmembers[0]];
        var num = tournumber;
        var noPoints = cmp(winner,tourstarter) && sys.auth(sys.id(winner)) == 0;
        this.updateTourStats(tier, time, winner, num, noPoints);
        return;
    }

    var finals = tourmembers.length == 2;
    tourfinals = finals;

    if (!finals) {
        sys.sendAll("", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("*** Round " + roundnumber + " of " + tourtier + " tournament ***", tourchannel);
        sys.sendAll("", tourchannel);
    }
    else {
        sys.sendAll("", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("*** FINALS OF " + tourtier.toUpperCase() + " TOURNAMENT ***", tourchannel);
        sys.sendAll("", tourchannel);
        sys.sendAll("", 0);
        sys.sendAll(border, 0);
        sys.sendAll("*** FINALS OF " + tourtier.toUpperCase() + " TOURNAMENT ***", 0);
        sys.sendAll("", 0);
    }

    var i = 0;
    while (tourmembers.length >= 2) {
        i += 1;
        var x1 = sys.rand(0, tourmembers.length);
        tourbattlers.push(tourmembers[x1]);
        var name1 = tourplayers[tourmembers[x1]];
        tourmembers.splice(x1,1);


        x1 = sys.rand(0, tourmembers.length);
        tourbattlers.push(tourmembers[x1]);
        var name2 = tourplayers[tourmembers[x1]];
        tourmembers.splice(x1,1);

        battlesStarted.push(false);

        if (!finals)
            sys.sendAll (i + "." + this.padd(name1) + " VS " + name2, tourchannel);
        else {
            sys.sendAll ("  " + this.padd(name1) + " VS " + name2, tourchannel);
            sys.sendAll ("  " + this.padd(name1) + " VS " + name2, 0);
        }
    }

    if (tourmembers.length > 0) {
        sys.sendAll ("", tourchannel);
        sys.sendAll ("*** " + tourplayers[tourmembers[0]] + " is randomly selected to go to next round!", tourchannel);
    }

    sys.sendAll(border, tourchannel);
    sys.sendAll("", tourchannel);
    if (finals) {
        sys.sendAll(border, 0);
        sys.sendAll("", 0);
    }
} /* end of roundPairing */

,

updateTourStats : function(tier, time, winner, num, purgeTime, noPoints) {
    var numToPoints = function() {
        if (noPoints) return 0;
        // First index: points for 1-7 players,
        // Second index: points for 8-15 players,
        // Third index: points for 16-31 players,
        // Fourth index: points for 32-63 players,
        // Fifth index: points for 64+ players
        var pointsDistributions = {
            "1v1 Challenge Cup": [0, 0, 0, 0, 1],
            "Challenge Cup": [0, 0, 0, 1, 2],
            "1v1 Gen 5": [0, 0, 0, 0, 1],
            "Metronome": [0, 0, 0, 0, 0],
            "Monotype": [0, 0, 1, 2, 3],
            "default": [0, 1, 2, 4, 6],
        }
        var d = pointsDistributions[tier in pointsDistributions ? tier : "default"];
        if (num < 8) return d[0];
        else if (8 <= num && num < 16) return d[1];
        else if (16 <= num && num < 32) return d[2];
        else if (32 <= num && num < 64) return d[3];
        else return d[4];
    };
    var isEmptyObject = function(o) {
        for (var k in o) {
            if (o.hasOwnProperty(k)) {
                return false;
            }
        }
        return true;
    };
    var points = numToPoints();
    if (purgeTime === undefined)
        purgeTime = 60*60*24*31; // 31 days
    time = parseInt(time); // in case time is date or string
    winner = winner.toLowerCase();
    tourwinners.push([tier, time, num, winner]);
    if (points > 0) {

        if (tourstats[winner] === undefined) {
            tourstats[winner] = {'points': 0, 'details': []};
        }
        tourstats[winner].points += points;
        tourstats[winner].details.push([tier, time, num]);

        if (tourrankingsbytier[tier] === undefined) {
            tourrankingsbytier[tier] = {};
        }
        if (tourrankingsbytier[tier][winner] === undefined) {
            tourrankingsbytier[tier][winner] = 0;
        }
        tourrankingsbytier[tier][winner] += points;

        var jsonObject = {};
        jsonObject.tourwinners = tourwinners
        jsonObject.tourstats = tourstats
        jsonObject.tourrankingsbytier = tourrankingsbytier
        sys.writeToFile('tourstats.json', JSON.stringify(jsonObject));
    }

    var player;
    while (tourwinners.length > 0 && (parseInt(tourwinners[0][1]) + purgeTime) < time) {
        tier = tourwinners[0][0];
        points = numToPoints(tourwinners[0][2]);
        player = tourwinners[0][3];
        tourstats[player].points -= points;
        tourstats[player].details.pop();
        if (tourstats[player].points == 0) {
            delete tourstats[player];
        }
        tourrankingsbytier[tier][player] -= points;
        if (tourrankingsbytier[tier][player] == 0) {
            delete tourrankingsbytier[tier][player];
            if (isEmptyObject(tourrankingsbytier[tier])) {
                delete tourrankingsbytier[tier];
            }
        }
        tourwinners.pop();
    }
}

,

padd : function(name) {
    var ret = name;

    while (ret.length < 20) ret = ' ' + ret;

    return ret;
}
,

isInTourney : function (name) {
    var name2 = name.toLowerCase();
    return name2 in tourplayers;
}

,

tourOpponent : function (nam) {
    var name = nam.toLowerCase();

    var x = tourbattlers.indexOf(name);

    if (x != -1) {
        if (x % 2 == 0) {
            return tourbattlers[x+1];
        } else {
            return tourbattlers[x-1];
        }
    }

    return "";
}

,

areOpponentsForTourBattle : function(src, dest) {
    return this.isInTourney(sys.name(src)) && this.isInTourney(sys.name(dest)) && this.tourOpponent(sys.name(src)) == sys.name(dest).toLowerCase();
}
,

areOpponentsForTourBattle2 : function(src, dest) {
    return this.isInTourney(src) && this.isInTourney(dest) && this.tourOpponent(src) == dest.toLowerCase();
}
,

ongoingTourneyBattle : function (name) {
    return tourbattlers.indexOf(name.toLowerCase()) != -1 && battlesStarted[Math.floor(tourbattlers.indexOf(name.toLowerCase())/2)] == true;
}

,

afterBattleStarted: function(src, dest, clauses, rated, mode, bid) {
    if (tourmode == 2) {
        if (this.areOpponentsForTourBattle(src, dest)) {
            if (sys.tier(src) == sys.tier(dest) && cmp(sys.tier(src), tourtier))
                battlesStarted[Math.floor(tourbattlers.indexOf(sys.name(src).toLowerCase())/2)] = true;
        }
    }
    // Ranked stats
    /*
    // Writes ranked stats to ranked_stats.csv
    // Uncomment to enable
    if (rated) {
        var tier = sys.tier(src);
        var writeRating = function(id) {
            var rating = sys.ladderRating(id, tier);
            var a = ['"'+tier+'"', rating, parseInt(sys.time())];
            for(var i = 0; i < 6; ++i) a.push(sys.teamPoke(id, i));
            sys.appendToFile("ranked_stats.csv", a.join(",")+"\n");
        }
        writeRating(src);
        writeRating(dest);
    }
    */
}

,

beforeBattleEnded : function(src, dest, desc, bid) {
}

,

afterBattleEnded : function(src, dest, desc) {
    if (tourmode != 2 ||desc == "tie")
        return;
    this.tourBattleEnd(sys.name(src), sys.name(dest));
}

,

tourBattleEnd : function(src, dest) {
    if (!this.areOpponentsForTourBattle2(src, dest) || !this.ongoingTourneyBattle(src))
        return;
    battlesLost.push(src);
    battlesLost.push(dest);

    var srcL = src.toLowerCase();
    var destL = dest.toLowerCase();

    battlesStarted.splice(Math.floor(tourbattlers.indexOf(srcL)/2), 1);
    tourbattlers.splice(tourbattlers.indexOf(srcL), 1);
    tourbattlers.splice(tourbattlers.indexOf(destL), 1);
    tourmembers.push(srcL);
    delete tourplayers[destL];

    if (tourbattlers.length != 0 || tourmembers.length > 1) {
        sys.sendAll("", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("~~Server~~: " + src + " advances to the next round.", tourchannel);
        sys.sendAll("~~Server~~: " + dest + " is out of the tournament.", tourchannel);
    }

    if (tourbattlers.length > 0) {
        sys.sendAll("*** " + tourbattlers.length/2 + " battle(s) remaining.", tourchannel);
        sys.sendAll(border, tourchannel);
        sys.sendAll("", tourchannel);
        return;
    }

    this.roundPairing();
}

,

isLCaps: function(letter) {
    return letter >= 'A' && letter <= 'Z';
}

,

isMCaps : function(message) {
    var count = 0;

    var i = 0;
    while ( i < message.length ) {
        var c = message[i];

        if (this.isLCaps(c)) {
            count += 1;
            if (count == 5)
                return true;
        } else {
            count -= 2;
            if (count < 0)
                count = 0;
        }
        i += 1;
    }

    return false;
}

,
beforeChangeTier : function(src, oldtier, newtier) {
    if(newtier == "Challenge Cup") return;

    this.eventMovesCheck(src);
    this.dreamWorldAbilitiesCheck(src, newtier);
    this.littleCupCheck(src, newtier);
    this.evioliteCheck(src, newtier);
    this.inconsistentCheck(src, newtier);
    this.monotypecheck(src, newtier);
    this.monoGenCheck(src, newtier);
    this.weatherlesstiercheck(src, newtier);
    this.shanaiAbilityCheck(src, newtier);
    this.monoColourCheck(src, newtier);
    this.swiftSwimCheck(src, newtier);
    this.snowWarningCheck(src, newtier);
    this.droughtCheck(src, newtier);
    this.advance200Check(src, newtier);
}
,
beforeChallengeIssued : function (src, dest, clauses, rated, mode) {
    if (battlesStopped) {
        battlebot.sendMessage(src, "Battles are now stopped as the server will restart soon.");
        sys.stopEvent();
        return;
    }

    if (SESSION.users(dest).sametier == true && (sys.tier(dest) != sys.tier(src))) {
        battlebot.sendMessage(src, "That guy only wants to fight his/her own tier.");
        sys.stopEvent();
        return;
    }

    if ((sys.tier(src) == "Challenge Cup" && sys.tier(dest) == "Challenge Cup" || sys.tier(src) == "1v1 Challenge Cup" && sys.tier(dest) == "1v1 Challenge Cup") && (clauses % 32 < 16)) {
        checkbot.sendMessage(src, "Challenge Cup must be enabled in the challenge window for a CC battle");
        sys.stopEvent();
        return;
    }

    if (tourmode == 2) {
        var name1 = sys.name(src);
        var name2 = sys.name(dest);

        if (this.isInTourney(name1)) {
            if (this.isInTourney(name2)) {
                if (this.tourOpponent(name1) != name2.toLowerCase()) {
                    tourneybot.sendMessage(src, "This guy isn't your opponent in the tourney.");
                    sys.stopEvent();
                    return;
                }
            } else {
                tourneybot.sendMessage(src, "This guy isn't your opponent in the tourney.");
                sys.stopEvent();
                return;
            }
            if (sys.tier(src) != sys.tier(dest) || !cmp(sys.tier(src),tourtier)) {
                tourneybot.sendMessage(src, "You must be both in the tier " + tourtier+ " to battle in the tourney.");
                sys.stopEvent();
                return;
            }
            if (tourfinals && clauses % 8 >= 4) {
                tourneybot.sendMessage(src, "You must not use \"disallow specs\" in finals.");
                sys.stopEvent();
                return;
            }
        } else {
            if (this.isInTourney(name2)) {
                tourneybot.sendMessage(src, "This guy is in the tournament and you are not, so you can't battle him/her.");
                sys.stopEvent();
                return;
            }
        }
    }

    /* Challenge Cup Clause */
    if ( (clauses % 32) >= 16)
        return;


    if (sys.tier(src).indexOf("Doubles") != -1 && sys.tier(dest).indexOf("Doubles") != -1 && mode != 1) {
        battlebot.sendMessage(src, "To fight in doubles, enable doubles in the challenge window!");
        sys.stopEvent();
        return;
    }

    if (sys.tier(src).indexOf("Triples") != -1 && sys.tier(dest).indexOf("Triples") != -1 && mode != 2) {
        battlebot.sendMessage(src, "To fight in triples, enable triples in the challenge window!");
        sys.stopEvent();
        return;
    }

}

,

beforeBattleMatchup : function(src,dest,clauses,rated)
{
    if (battlesStopped) {
        sys.stopEvent();
        return;
    }
/*
    if (rated) {
        if(sys.tier(src).indexOf("1v1") == -1) {
            sys.sendMessage(src, "Lamperi: Please battle only 1v1 battles on ladder until a bug is fixed");
            sys.sendMessage(dest, "Lamperi: Please battle only 1v1 battles on ladder until a bug is fixed");
            //bot.sendAll("" + sys.name(src) + " and " + sys.name(dest) + " tried to ladder. Denied.", staffchannel);
            sys.stopEvent();
            return;
        }
    }
*/
    if (tourmode == 2 && (this.isInTourney(sys.name(src)) || this.isInTourney(sys.name(dest)) )) {
        sys.stopEvent();
        return;
    }

}
,

eventMovesCheck : function(src)
{
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, i);
        if (poke in pokeNatures) {
            for (x in pokeNatures[poke]) {
                if (sys.hasTeamPokeMove(src, i, x) && sys.teamPokeNature(src, i) != pokeNatures[poke][x])
                {
                    checkbot.sendMessage(src, "" + sys.pokemon(poke) + " with " + sys.move(x) + " must be a " + sys.nature(pokeNatures[poke][x]) + " nature. Change it in the teambuilder.");
                    sys.stopEvent();
                    sys.changePokeNum(src, i, 0);
                }

            }
        }
    }
}
,
littleCupCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Wifi LC", "Wifi LC Ubers", "Wifi UU LC"].indexOf(tier) == -1) {
        return; // only care about these tiers
    }
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        if (x != 0 && sys.hasDreamWorldAbility(src, i) && lcpokemons.indexOf(x) != -1 ) {
            checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with a Dream World ability in this tier. Change it in the teambuilder.");

            if (sys.tier(src) == "Wifi LC" && sys.hasLegalTeamForTier(src, "DW LC") || sys.tier(src) == "Wifi LC Ubers" && sys.hasLegalTeamForTier(src, "DW OU")) {
                sys.changeTier(src, "DW LC");
            } else {
                sys.changePokeNum(src, i, 0);
            }
            sys.stopEvent();
        }
    }
}
,
evioliteCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Wifi NU"].indexOf(tier) == -1) {
        return; // only care about these tiers
    }
    var evioliteLimit = 6;
    var eviolites = 0;
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        var item = sys.teamPokeItem(src, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        if (item == "Eviolite" && ++eviolites > evioliteLimit) {
            checkbot.sendMessage(src, "Only 1 pokemon is allowed with eviolite in " + tier + " tier. Please remove extra evioites in teambuilder.");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
        }
    }
}
,
dreamWorldAbilitiesCheck : function(src, tier) {
    if (sys.gen(src) < 5)
        return;

    if (!tier) tier = sys.tier(src);
    if (Config.DreamWorldTiers.indexOf(tier) > -1) {
        return; // don't care about these tiers
    }

    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        if (x != 0 && sys.hasDreamWorldAbility(src, i) && (!(x in dwpokemons) || (breedingpokemons.indexOf(x) != -1 && sys.compatibleAsDreamWorldEvent(src, i) != true))) {
            if (!(x in dwpokemons))
                checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with a Dream World ability in " + tier + " tier. Change it in the teambuilder.");
            else
                checkbot.sendMessage(src, "" + sys.pokemon(x) + " has to be Male and have no egg moves with its Dream World ability in  " + tier + " tier. Change it in the teambuilder.");
            /*
            if (sys.tier(src) == "Wifi OU" && sys.hasLegalTeamForTier(src, "DW OU")) {
                sys.changeTier(src, "DW OU");
            } else if (sys.tier(src) == "Wifi OU" && sys.hasLegalTeamForTier(src, "DW Ubers")) {
                sys.changeTier(src, "DW Ubers");
            } else if (sys.tier(src) == "Wifi Ubers") {
                sys.changeTier(src, "DW Ubers");
            }
            else if (sys.tier(src) == "DW 1v1" && sys.hasLegalTeamForTier(src, "DW OU")) {
                sys.changeTier(src, "DW OU");
            }
            else if (sys.tier(src) == "DW 1v1" && sys.hasLegalTeamForTier(src, "DW Ubers")) {
                sys.changeTier(src, "DW Ubers");
            }
            else if (sys.tier(src) == "Wifi UU" && sys.hasLegalTeamForTier(src, "DW UU")) {
                sys.changeTier(src, "DW UU");
            } else if (sys.tier(src) == "Wifi LU" && sys.hasLegalTeamForTier(src, "DW LU")) {
                sys.changeTier(src, "DW LU");
            }
            else if (sys.tier(src) == "Wifi LC" && sys.hasLegalTeamForTier(src, "Wifi LC") || sys.tier(src) == "Wifi LC Ubers" && sys.hasLegalTeamForTier(src, "Wifi LC Ubers")) {
                sys.changeTier(src, "DW LC");
            }else {
                sys.changePokeNum(src, i, 0);
            }
            */
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
        }
    }
}
,

inconsistentCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["DW OU", "DW UU", "DW LU", "Wifi OU", "Wifi UU", "Wifi LU", "Wifi LC", "DW LC", "Wifi Ubers", "DW Ubers", "Clear Skies", "Clear Skies DW", "Monotype", "Monocolour", "Monogen", "Smogon OU", "Smogon UU", "Smogon RU", "Wifi NU"].indexOf(tier) == -1) {
        return; // only care about these tiers
    }
    var moody = sys.abilityNum("Moody");
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);

        if (x != 0 && sys.teamPokeAbility(src, i) == moody) {
            checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with Moody in " + tier + ". Change it in the teambuilder.");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
        }
    }
}
,
weatherlesstiercheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Clear Skies" && tier != "Clear Skies DW") return;
    for (var i = 0; i < 6; i++){
        ability = sys.ability(sys.teamPokeAbility(src, i))
        if(ability.toLowerCase() == "drizzle" || ability.toLowerCase() == "drought" || ability.toLowerCase() == "snow warning" || ability.toLowerCase() == "sand stream") {
            normalbot.sendMessage(src, "Your team has a pokemon with the ability: " + ability + ", please remove before entering " +tier+" tier.");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent()
            return;
        }
    }
} /* end of weatherlesstiercheck */
,
// Will escape "&", ">", and "<" symbols for HTML output.
html_escape : function(text)
{
    var m = text.toString();
    if (m.length > 0) {
        var amp = "&am" + "p;";
        var lt = "&l" + "t;";
        var gt = "&g" + "t;";
        return m.replace(/&/g, amp).replace(/\</g, lt).replace(/\>/g, gt);
    }else{
        return "";
    }
}
,
monotypecheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Monotype") return; // Only interested in monotype
    var TypeA = sys.pokeType1(sys.teamPoke(src, 0), 5);
    var TypeB = sys.pokeType2(sys.teamPoke(src, 0), 5);
    var k;
    var checkType;
    for (var i = 1; i < 6 ; i++) {
        if (sys.teamPoke(src, i) == 0) continue;
        var temptypeA = sys.pokeType1(sys.teamPoke(src, i), 5);
        var temptypeB = sys.pokeType2(sys.teamPoke(src, i), 5);

        if(checkType != undefined) {
            k=3;
        }
        if(i==1){
            k=1;
        }
        if(TypeB !=17){
            if(temptypeA == TypeA && temptypeB == TypeB && k == 1 || temptypeA == TypeB && temptypeB == TypeA && k == 1){
                k=2;
            }
        }
        if (temptypeA == TypeA && k == 1 || temptypeB == TypeA && k == 1) {
            checkType=TypeA;
        }
        if (temptypeA == TypeB && k == 1 || temptypeB == TypeB && k == 1) {
           if(TypeB != 17){
                   checkType=TypeB;
                   }
                   if(TypeB == 17)
                   checkType=TypeA
        }
        if(i>1 && k == 2) {
            k=1;
            if(temptypeA == TypeA && temptypeB == TypeB && k == 1 || temptypeA == TypeB && temptypeB == TypeA && k == 1){
                k=2;
            }
            if (temptypeA == TypeA && k == 1 || temptypeB == TypeA && k == 1) {
                checkType=TypeA;
            }
            if (temptypeA == TypeB && k == 1 || temptypeB == TypeB && k == 1) {
                 if(TypeB != 17){
                   checkType=TypeB;
                   }
                   if(TypeB == 17)
                   checkType=TypeA
            }
        }
        if(k==3){

            if(temptypeA != checkType && temptypeB != checkType) {

                normalbot.sendMessage(src, "Team not Monotype as " + sys.pokemon(sys.teamPoke(src, i)) + " is not " + sys.type(checkType) + "!");
                /*
                if(sys.hasLegalTeamForTier(src, "DW OU")) {
                    if(sys.hasLegalTeamForTier(src,"Wifi OU")) {
                        sys.changeTier(src, "Wifi OU");
                        sys.stopEvent()
                        return;
                    }
                    sys.changeTier(src, "DW OU");
                    sys.stopEvent()
                    return;
                }
                if(sys.hasLegalTeamForTier(src,"Wifi Ubers")) {
                    sys.changeTier(src, "Wifi Ubers");
                    sys.stopEvent()
                    return;
                }
                sys.changeTier(src, "DW Ubers");
                */
                sys.changeTier(src, "Challenge Cup");
                sys.stopEvent()
                return;
            }
        }

        if(k==1) {
                    if(TypeB == 17){
                        TypeB = TypeA
                        }
            if (temptypeA != TypeA && temptypeB != TypeA && temptypeA != TypeB && temptypeB != TypeB) {
                normalbot.sendMessage(src, "Team not Monotype as " + sys.pokemon(sys.teamPoke(src, i)) + " does not share a type with " + sys.pokemon(sys.teamPoke(src, 0)) + "!")

                if(sys.hasLegalTeamForTier(src, "DW OU")) {
                    if(sys.hasLegalTeamForTier(src,"Wifi OU")) {
                        sys.changeTier(src, "Wifi OU");
                        sys.stopEvent()
                        return;
                    }
                    sys.changeTier(src, "DW OU");
                    sys.stopEvent()
                    return;
                }
                if(sys.hasLegalTeamForTier(src,"Wifi Ubers")) {
                    sys.changeTier(src, "Wifi Ubers");
                    sys.stopEvent()
                    return;
                }
                sys.changeTier(src, "DW Ubers");
                sys.stopEvent()
                return;
            }

        }
    }

    // Baton Pass Blaziken banned on 2011-09-19
    /*
    var blaziken = sys.pokeNum("Blaziken");
    var bp = sys.moveNum("Baton Pass");
    for (var i = 0; i < 6; ++i)
        if (sys.teamPoke(src,i) == blaziken && sys.hasDreamWorldAbility(src,i) && sys.hasTeamPokeMove(src,i,bp)) {

            normalbot.sendMessage(src, "Blaziken with Baton Pass and Speed Boost is banned on Monotype");
            sys.changeTier(src, "Challenge Cup");
            sys.stopEvent();
            return
        }
    */
}
,

monoGenCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Monogen") return;

    var GEN_MAX = [0, 151, 252, 386, 493, 646];
    var gen = 0;
    for (var i = 0; i < 6; ++i) {
        var pokenum = sys.teamPoke(src, i);
        var species = pokenum % 65536; // remove alt formes
        if (species == 0) continue;
        if (gen == 0) {
            while (species > GEN_MAX[gen]) ++gen; // Search for correct gen for first poke
        } else if (!(GEN_MAX[gen-1] < species && species <= GEN_MAX[gen])) {
            normalbot.sendMessage(src, sys.pokemon(pokenum) + " is not from gen " + gen);
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
}
,

monoColourCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (tier != "Monocolour") return;
    var colours = {
        'Red': ['Charmander', 'Charmeleon', 'Charizard', 'Vileplume', 'Paras', 'Parasect', 'Krabby', 'Kingler', 'Voltorb', 'Electrode', 'Goldeen', 'Seaking', 'Jynx', 'Magikarp', 'Magmar', 'Flareon', 'Ledyba', 'Ledian', 'Ariados', 'Yanma', 'Scizor', 'Slugma', 'Magcargo', 'Octillery', 'Delibird', 'Porygon2', 'Magby', 'Ho-Oh', 'Torchic', 'Combusken', 'Blaziken', 'Wurmple', 'Medicham', 'Carvanha', 'Camerupt', 'Solrock', 'Corphish', 'Crawdaunt', 'Latias', 'Groudon', 'Deoxys', 'Deoxys-A', 'Deoxys-D', 'Deoxys-S', 'Kricketot', 'Kricketune', 'Magmortar', 'Porygon-Z', 'Rotom', 'Rotom-H', 'Rotom-F', 'Rotom-W', 'Rotom-C', 'Rotom-S', 'Tepig', 'Pignite', 'Emboar', 'Pansear', 'Simisear', 'Throh', 'Venipede', 'Scolipede', 'Krookodile', 'Darumaka', 'Darmanitan', 'Dwebble', 'Crustle', 'Scrafty', 'Shelmet', 'Accelgor', 'Druddigon', 'Pawniard', 'Bisharp', 'Braviary', 'Heatmor', ],
        'Blue': ['Squirtle', 'Wartortle', 'Blastoise', 'Nidoran?', 'Nidorina', 'Nidoqueen', 'Oddish', 'Gloom', 'Golduck', 'Poliwag', 'Poliwhirl', 'Poliwrath', 'Tentacool', 'Tentacruel', 'Tangela', 'Horsea', 'Seadra', 'Gyarados', 'Lapras', 'Vaporeon', 'Omanyte', 'Omastar', 'Articuno', 'Dratini', 'Dragonair', 'Totodile', 'Croconaw', 'Feraligatr', 'Chinchou', 'Lanturn', 'Marill', 'Azumarill', 'Jumpluff', 'Wooper', 'Quagsire', 'Wobbuffet', 'Heracross', 'Kingdra', 'Phanpy', 'Suicune', 'Mudkip', 'Marshtomp', 'Swampert', 'Taillow', 'Swellow', 'Surskit', 'Masquerain', 'Loudred', 'Exploud', 'Azurill', 'Meditite', 'Sharpedo', 'Wailmer', 'Wailord', 'Swablu', 'Altaria', 'Whiscash', 'Chimecho', 'Wynaut', 'Spheal', 'Sealeo', 'Walrein', 'Clamperl', 'Huntail', 'Bagon', 'Salamence', 'Beldum', 'Metang', 'Metagross', 'Regice', 'Latios', 'Kyogre', 'Piplup', 'Prinplup', 'Empoleon', 'Shinx', 'Luxio', 'Luxray', 'Cranidos', 'Rampardos', 'Gible', 'Gabite', 'Garchomp', 'Riolu', 'Lucario', 'Croagunk', 'Toxicroak', 'Finneon', 'Lumineon', 'Mantyke', 'Tangrowth', 'Glaceon', 'Azelf', 'Phione', 'Manaphy', 'Oshawott', 'Dewott', 'Samurott', 'Panpour', 'Simipour', 'Roggenrola', 'Boldore', 'Gigalith', 'Woobat', 'Swoobat', 'Tympole', 'Palpitoad', 'Seismitoad', 'Sawk', 'Tirtouga', 'Carracosta', 'Ducklett', 'Karrablast', 'Eelektrik', 'Eelektross', 'Elgyem', 'Cryogonal', 'Deino', 'Zweilous', 'Hydreigon', 'Cobalion', 'Thundurus', ],
        'Green': ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Caterpie', 'Metapod', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Scyther', 'Chikorita', 'Bayleef', 'Meganium', 'Spinarak', 'Natu', 'Xatu', 'Bellossom', 'Politoed', 'Skiploom', 'Larvitar', 'Tyranitar', 'Celebi', 'Treecko', 'Grovyle', 'Sceptile', 'Dustox', 'Lotad', 'Lombre', 'Ludicolo', 'Breloom', 'Electrike', 'Roselia', 'Gulpin', 'Vibrava', 'Flygon', 'Cacnea', 'Cacturne', 'Cradily', 'Kecleon', 'Tropius', 'Rayquaza', 'Turtwig', 'Grotle', 'Torterra', 'Budew', 'Roserade', 'Bronzor', 'Bronzong', 'Carnivine', 'Yanmega', 'Leafeon', 'Shaymin', 'Shaymin-S', 'Snivy', 'Servine', 'Serperior', 'Pansage', 'Simisage', 'Swadloon', 'Cottonee', 'Whimsicott', 'Petilil', 'Lilligant', 'Basculin', 'Maractus', 'Trubbish', 'Garbodor', 'Solosis', 'Duosion', 'Reuniclus', 'Axew', 'Fraxure', 'Golett', 'Golurk', 'Virizion', 'Tornadus', ],
        'Yellow': ['Kakuna', 'Beedrill', 'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Ninetales', 'Meowth', 'Persian', 'Psyduck', 'Ponyta', 'Rapidash', 'Drowzee', 'Hypno', 'Exeggutor', 'Electabuzz', 'Jolteon', 'Zapdos', 'Moltres', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Pichu', 'Ampharos', 'Sunkern', 'Sunflora', 'Girafarig', 'Dunsparce', 'Shuckle', 'Elekid', 'Raikou', 'Beautifly', 'Pelipper', 'Ninjask', 'Makuhita', 'Manectric', 'Plusle', 'Minun', 'Numel', 'Lunatone', 'Jirachi', 'Mothim', 'Combee', 'Vespiquen', 'Chingling', 'Electivire', 'Uxie', 'Cresselia', 'Victini', 'Sewaddle', 'Leavanny', 'Scraggy', 'Cofagrigus', 'Archen', 'Archeops', 'Deerling', 'Joltik', 'Galvantula', 'Haxorus', 'Mienfoo', 'Keldeo', ],
        'Purple': ['Rattata', 'Ekans', 'Arbok', 'Nidoran?', 'Nidorino', 'Nidoking', 'Zubat', 'Golbat', 'Venonat', 'Venomoth', 'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Koffing', 'Weezing', 'Starmie', 'Ditto', 'Aerodactyl', 'Mewtwo', 'Crobat', 'Aipom', 'Espeon', 'Misdreavus', 'Forretress', 'Gligar', 'Granbull', 'Mantine', 'Tyrogue', 'Cascoon', 'Delcatty', 'Sableye', 'Illumise', 'Swalot', 'Grumpig', 'Lileep', 'Shellos', 'Gastrodon', 'Ambipom', 'Drifloon', 'Drifblim', 'Mismagius', 'Stunky', 'Skuntank', 'Spiritomb', 'Skorupi', 'Drapion', 'Gliscor', 'Palkia', 'Purrloin', 'Liepard', 'Gothita', 'Gothorita', 'Gothitelle', 'Mienshao', 'Genesect', ],
'Pink': ['Clefairy', 'Clefable', 'Jigglypuff', 'Wigglytuff', 'Slowpoke', 'Slowbro', 'Exeggcute', 'Lickitung', 'Chansey', 'Mr. Mime', 'Porygon', 'Mew', 'Cleffa', 'Igglybuff', 'Flaaffy', 'Hoppip', 'Slowking', 'Snubbull', 'Corsola', 'Smoochum', 'Miltank', 'Blissey', 'Whismur', 'Skitty', 'Milotic', 'Gorebyss', 'Luvdisc', 'Cherubi', 'Cherrim', 'Mime Jr.', 'Happiny', 'Lickilicky', 'Mesprit', 'Munna', 'Musharna', 'Audino', 'Alomomola', ],
        'Brown': ['Weedle', 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Raticate', 'Spearow', 'Fearow', 'Vulpix', 'Diglett', 'Dugtrio', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Abra', 'Kadabra', 'Alakazam', 'Geodude', 'Graveler', 'Golem', 'Farfetch\'d', 'Doduo', 'Dodrio', 'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan', 'Kangaskhan', 'Staryu', 'Pinsir', 'Tauros', 'Eevee', 'Kabuto', 'Kabutops', 'Dragonite', 'Sentret', 'Furret', 'Hoothoot', 'Noctowl', 'Sudowoodo', 'Teddiursa', 'Ursaring', 'Swinub', 'Piloswine', 'Stantler', 'Hitmontop', 'Entei', 'Zigzagoon', 'Seedot', 'Nuzleaf', 'Shiftry', 'Shroomish', 'Slakoth', 'Slaking', 'Shedinja', 'Hariyama', 'Torkoal', 'Spinda', 'Trapinch', 'Baltoy', 'Feebas', 'Regirock', 'Chimchar', 'Monferno', 'Infernape', 'Starly', 'Staravia', 'Staraptor', 'Bidoof', 'Bibarel', 'Buizel', 'Floatzel', 'Buneary', 'Lopunny', 'Bonsly', 'Hippopotas', 'Hippowdon', 'Mamoswine', 'Heatran', 'Patrat', 'Watchog', 'Lillipup', 'Conkeldurr', 'Sandile', 'Krokorok', 'Sawsbuck', 'Beheeyem', 'Stunfisk', 'Bouffalant', 'Vullaby', 'Mandibuzz', 'Landorus', ],
         'Black': ['Snorlax', 'Umbreon', 'Murkrow', 'Unown', 'Sneasel', 'Houndour', 'Houndoom', 'Mawile', 'Spoink', 'Seviper', 'Claydol', 'Shuppet', 'Banette', 'Duskull', 'Dusclops', 'Honchkrow', 'Chatot', 'Munchlax', 'Weavile', 'Dusknoir', 'Giratina', 'Darkrai', 'Blitzle', 'Zebstrika', 'Sigilyph', 'Yamask', 'Chandelure', 'Zekrom', ],
        'Gray': ['Machop', 'Machoke', 'Machamp', 'Magnemite', 'Magneton', 'Onix', 'Rhyhorn', 'Rhydon', 'Pineco', 'Steelix', 'Qwilfish', 'Remoraid', 'Skarmory', 'Donphan', 'Pupitar', 'Poochyena', 'Mightyena', 'Nincada', 'Nosepass', 'Aron', 'Lairon', 'Aggron', 'Volbeat', 'Barboach', 'Anorith', 'Armaldo', 'Snorunt', 'Glalie', 'Relicanth', 'Registeel', 'Shieldon', 'Bastiodon', 'Burmy', 'Wormadam', 'Wormadam-G', 'Wormadam-S', 'Glameow', 'Purugly', 'Magnezone', 'Rhyperior', 'Probopass', 'Arceus', 'Herdier', 'Stoutland', 'Pidove', 'Tranquill', 'Unfezant', 'Drilbur', 'Excadrill', 'Timburr', 'Gurdurr', 'Whirlipede', 'Zorua', 'Zoroark', 'Minccino', 'Cinccino', 'Escavalier', 'Ferroseed', 'Ferrothorn', 'Klink', 'Klang', 'Klinklang', 'Durant', 'Terrakion', 'Kyurem', ],
        'White': ['Butterfree', 'Seel', 'Dewgong', 'Togepi', 'Togetic', 'Mareep', 'Smeargle', 'Lugia', 'Linoone', 'Silcoon', 'Wingull', 'Ralts', 'Kirlia', 'Gardevoir', 'Vigoroth', 'Zangoose', 'Castform', 'Absol', 'Shelgon', 'Pachirisu', 'Snover', 'Abomasnow', 'Togekiss', 'Gallade', 'Froslass', 'Dialga', 'Regigigas', 'Swanna', 'Vanillite', 'Vanillish', 'Vanilluxe', 'Emolga', 'Foongus', 'Amoonguss', 'Frillish', 'Jellicent', 'Tynamo', 'Litwick', 'Lampent', 'Cubchoo', 'Beartic', 'Rufflet', 'Larvesta', 'Volcarona', 'Reshiram', 'Meloetta', 'Meloetta-S' ],
    }
    var poke = sys.pokemon(sys.teamPoke(src, 0));
    var thecolour = '';
    for (var colour in colours) {
        if (colours[colour].indexOf(poke) > -1) {
            thecolour = colour;
        }
    }
    if (thecolour == '') {
        normalbot.sendMessage(src, "Bug! " + poke + " has not a colour in checkMonocolour :(");
        sys.changeTier(src, "Challenge Cup")
        sys.stopEvent()
        return;
    }
    for (var i = 1; i < 6; ++i) {
        var poke = sys.pokemon(sys.teamPoke(src, i));
        if (colours[thecolour].indexOf(poke) == -1 && poke != "Missingno") {
            normalbot.sendMessage(src, "" + poke + " has not the colour: " + thecolour);
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
    //normalbot.sendMessage(src, "Your team is a good monocolour team with colour: " + thecolour);
},

swiftSwimCheck : function(src, tier){
    if (!tier) tier = sys.tier(src);
    //if (tier != "Smogon OU") return;
    if (["Smogon OU", "Wifi OU", "DW OU"].indexOf(tier) == -1) return;
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Drizzle"){
            for(var j = 0; j <6; ++j){
                if(sys.ability(sys.teamPokeAbility(src, j)) == "Swift Swim"){
                    normalbot.sendMessage(src, "You cannot have the combination of Swift Swim and Drizzle in OU")
                    sys.stopEvent()
                    sys.changeTier(src, "Challenge Cup")
                    return;
                }
            }
        }
    }
}
,
droughtCheck : function(src, tier){
    if (!tier) tier = sys.tier(src);
    if (tier != "Smogon UU") return;
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Drought"){
            normalbot.sendMessage(src, "Drought is not allowed in Smogon UU")
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
}
,

snowWarningCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Wifi UU", "Wifi LU", "Wifi NU"].indexOf(tier) == -1) return;
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Snow Warning"){
            normalbot.sendMessage(src, "Snow Warning is not allowed in " + tier + ".")
            sys.changeTier(src, "Challenge Cup")
            sys.stopEvent()
            return;
        }
    }
}
,

shanaiAbilityCheck : function(src, tier) {
    if (!tier) tier = sys.tier(src);
    if (["Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST"].indexOf(tier) == -1) {
        return; // only intereted in shanai battling
    }
    var bannedAbilities = {
        'treecko': ['overgrow'],
        'chimchar': ['blaze'],
        'totodile': ['torrent'],
        'spearow': ['sniper'],
        'skorupi': ['battle armor', 'sniper'],
        'spoink': ['thick fat'],
        'golett': ['iron fist'],
        'magnemite': ['magnet pull', 'analytic'],
        'electrike': ['static', 'lightningrod'],
        'nosepass': ['sturdy', 'magnet pull'],
        'axew': ['rivalry'],
        'croagunk': ['poison touch', 'dry skin'],
        'cubchoo': ['rattled'],
        'joltik': ['swarm'],
        'shroomish': ['effect spore', 'quick feet'],
        'pidgeotto': ['big pecks'],
        'karrablast': ['swarm']
    };
    var valid = true;
    for (var i = 0; i < 6; ++i) {
        var ability = sys.ability(sys.teamPokeAbility(src, i));
        var lability = ability.toLowerCase();
        var poke = sys.pokemon(sys.teamPoke(src, i));
        var lpoke = poke.toLowerCase();
        if (lpoke in bannedAbilities && bannedAbilities[lpoke].indexOf(lability) != -1) {
            checkbot.sendMessage(src, "" + poke + " is not allowed to have ability " + ability + " in this tier. Please change it in Teambuilder (You are now in Challenge Cup).")
            valid = false;
        }
    }
    if (!valid) {
        sys.changeTier(src, "Challenge Cup")
        sys.stopEvent();
    }
}
,

advance200Check: function(src, tier){
    if (!tier) tier = sys.tier(src);
    if (tier != "Adv 200") return;

    if (typeof advance200Banlist === 'undefined') {
        var pokes = {
        "Sceptile": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Thunderpunch", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Counter", "Seismic Toss", "Mimic", "Substitute"],
        "Torchic": ["Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide"],
        "Combusken": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Blaziken": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Mudkip": ["Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Defense Curl"],
        "Marshtomp": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl"],
        "Swampert": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl"],
        "Poochyena": ["Psych Up", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Body Slam", "Double-edge", "Counter", "Mimic", "Substitute"],
        "Mightyena": ["Psych Up", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Body Slam", "Double-edge", "Counter", "Mimic", "Substitute"],
        "Zigzagoon": ["Body Slam", "Double-edge", "Mimic", "Thunder Wave", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Linoone": ["Body Slam", "Double-edge", "Mimic", "Thunder Wave", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Wurmple":[],
        "Silcoon":[],
        "Cascoon":[],
        "Beautifly": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Dustox": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Lotad": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk"],

        "Lombre": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Dynamicpunch", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Ludicolo": ["Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Seedot": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl"],
        "Nuzleaf": ["Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Shiftry": ["Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Taillow": ["Double-edge", "Counter", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Swellow": ["Double-edge", "Counter", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Wingull": ["Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Pelipper": ["Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Ralts": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Kirlia": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Gardevoir": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Surskit": ["Double-edge", "Mimic", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Masquerain": ["Double-edge", "Mimic", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Shroomish": ["Swords Dance", "Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Sleep Talk"],
        "Breloom": ["Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Thunderpunch", "Fury Cutter"],
        "Slakoth": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Vigoroth": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Slaking": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Abra": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Kadabra": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Alakazam": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Nincada": ["Double-edge", "Mimic", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Ninjask": ["Double-edge", "Mimic", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Shedinja": ["Double-edge", "Mimic", "Dream Eater", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Whismur": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Loudred": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Exploud": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Makuhita": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Hariyama": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Goldeen": ["Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Swift", "Psybeam", "Haze"],
        "Seaking": ["Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Swift", "Psybeam", "Haze"],
        "Magikarp": [],
        "Gyarados": ["Body Slam", "Double-Edge", "Mimic", "Thunder Wave", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk"],
        "Azurill": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl"],
        "Marill": ["Mega Punch", "Mega Kick", "Body Slam", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Present", "Belly Drum", "Perish Song"],
        "Azumarill": ["Mega Punch", "Mega Kick", "Body Slam", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Present", "Belly Drum", "Perish Song"],
        "Geodude": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Mega Punch"],
        "Graveler": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Mega Punch"],
        "Golem": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Fury Cutter", "Mega Punch"],
        "Nosepass": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Skitty": ["Body Slam", "Mimic", "Dream Eater", "Thunder Wave", "Rollout", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Wish"],
        "Delcatty": ["Body Slam", "Mimic", "Dream Eater", "Thunder Wave", "Rollout", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Wish"],
        "Zubat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Golbat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Crobat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Tentacool": ["Swords Dance", "Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Aurora Beam", "Rapid Spin", "Haze"],
        "Tentacruel": ["Swords Dance", "Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Aurora Beam", "Rapid Spin", "Haze"],
        "Sableye": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Mawile": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch"],
        "Aron": ["Mimic", "Rock Slide", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl", "Fury Cutter"],
        "Lairon": ["Mimic", "Rock Slide", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl", "Fury Cutter"],
        "Aggron": ["Mega Punch", "Mega Kick", "Counter", "Seismic Toss", "Mimic", "Thunder Wave", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Machop": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Machoke": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Machamp": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Meditite": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Medicham": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Electrike": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk"],
        "Manectric": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk"],
        "Plusle": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Minun": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Magnemite": ["Double-Edge", "Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Magneton": ["Double-Edge", "Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Voltorb": ["Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Electrode": ["Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Volbeat": ["Body Slam", "Counter", "DynamicPunch", "Endure", "Ice Punch", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Illumise": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Ice Punch", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Oddish": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Gloom": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Vileplume": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Substitute", "Swagger", "Swords Dance"],
        "Bellossom": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Doduo": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Faint Attack", "Flail"],
        "Dodrio": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Faint Attack", "Flail"],
        "Roselia": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Swords Dance"],
        "Gulpin": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch", "Pain Split"],
        "Swalot": ["Counter", "Defense Curl", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch", "Pain Split"],
        "Carvanha": ["Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Sharpedo": ["Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Wailmer": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Wailord": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Numel": ["Body Slam", "Defense Curl", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Camerupt": ["Body Slam", "Defense Curl", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Slugma": ["Defense Curl", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Heat Wave"],
        "Magcargo": ["Defense Curl", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Heat Wave"],
        "Torkoal": ["Double-Edge", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Grimer": ["Body Slam", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch"],
        "Muk": ["Body Slam", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch"],
        "Koffing": ["Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Psybeam", "Pain Split"],
        "Weezing": ["Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Psybeam", "Pain Split"],
        "Spoink": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Swagger", "Swift"],
        "Grumpig": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Swagger", "Swift", "Thunderpunch"],
        "Sandshrew": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Sandslash": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Skarmory": ["Counter", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Whirlwind", "Curse"],
        "Spinda": ["Body Slam", "Counter", "Defense Curl", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Trapinch": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Vibrava": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Flygon": ["Body Slam", "Double-Edge", "Earth Power", "Endure", "Fire Punch", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Cacnea": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swords Dance", "ThunderPunch"],
        "Cacturne": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Low Kick", "Magic Coat", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swords Dance", "ThunderPunch"],
        "Swablu": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Altaria": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Zangoose": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Fire Punch", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Swords Dance", "Thunder Wave", "ThunderPunch"],
        "Seviper": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swift"],
        "Lunatone": ["Body Slam", "Defense Curl", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Solrock": ["Body Slam", "Defense Curl", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Barboach": ["Double-Edge", "Endure", "icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Substitute", "Swagger"],
        "Whiscash": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Substitute", "Swagger"],
        "Corphish": ["Body Slam", "Counter", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Crawdaunt": ["Body Slam", "Counter", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Baltoy": ["Double-Edge", "Dream Eater", "Endure", "Explosion", "Mimic", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Claydol": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Lileep": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Cradily": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Anorith": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Rapid Spin"],
        "Armaldo": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Rapid Spin"],
        "Igglybuff": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "Perish Song", "Present", "Wish"],
        "Jigglypuff": ["Body Slam", "Counter", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch", "Perish Song", "Present", "Wish"],
        "Wigglytuff": ["Body Slam", "Counter", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch", "Perish Song", "Present", "Wish"],
        "Feebas": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Milotic": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Castform": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave"],
        "Staryu": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Starmie": ["Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Kecleon": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Fire Punch", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Shuppet": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Banette": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Duskull": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Pain Split"],
        "Dusclops": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunderpunch", "Pain Split"],
        "Tropius": ["Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Chimecho": ["Defense Curl", "Endure", "Icy Wind", "Mimic", "Psych Up", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Absol": ["Body Slam", "Counter", "Dream Eater", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Swagger", "Swift", "Thunder Wave"],
        "Vulpix": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Spite"],
        "Ninetales": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Spite"],
        "Pichu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "Present", "Wish"],
        "Pikachu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Present", "Wish"],
        "Raichu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Present", "Wish"],
        "Psyduck": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Golduck": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Natu": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "Faint Attack", "Featherdance"],
        "Xatu": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave"],
        "Girafarig": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Beat Up", "Wish"],
        "Phanpy": ["Body Slam", "Counter", "Double-Edge", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Donphan": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Pinsir": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Flail"],
        "Heracross": ["Body Slam", "Counter", "Double-Edge", "Fury Cutter", "Mimic", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Bide", "Flail"],
        "Rhyhorn": ["Body Slam", "Counter", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Rhydon": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "fire Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "ThunderPunch"],
        "Snorunt": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Glalie": ["Body Slam", "Double-Edge", "Explosion", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Spheal": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute", "Swagger"],
        "Sealeo": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute"],
        "Walrein": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute"],
        "Clamperl": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Huntail": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Gorebyss": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Relicanth": ["Body Slam", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Corsola": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Icicle Spear"],
        "Chinchou": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Lanturn": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Luvdisc": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Horsea": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Seadra": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Kingdra": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Bagon": ["Body Slam", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Shelgon": ["Body Slam", "Defense Curl", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Salamence": ["Body Slam", "Defense Curl", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Beldum": [],
        "Metang": ["Body Slam", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fury Cutter", "Ice Punch", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swift", "Thunderpunch"],
        "Metagross": ["Body Slam", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fury Cutter", "Ice Punch", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swift", "Thunderpunch"],
        "Regirock": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"],
        "Regice": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"],
        "Registeel": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"]
        }
        advance200Banlist = {};
        for (var poke in pokes) {
            var pokeNum = sys.pokeNum(poke);
            if (!pokeNum) {
                sys.sendAll("Script Error: pokemon " + poke + " is unknown in 200 banlist", staffchannel)
                continue;
            }
            advance200Banlist[pokeNum] = [];
            for (var k = 0; k < pokes[poke].length; ++k) {
                var moveNum = sys.moveNum(pokes[poke][k]);
                if (!moveNum) {

                    sys.sendAll("Script Error: move " + pokes[poke][k] + " for pokemon " + poke + " is unknown in 200 banlist", staffchannel)
                    continue;
                }
                advance200Banlist[pokeNum].push(moveNum);
            }
        }

    } // end of building the banlist
    var valid = true;
    var debug = function(msg) { if (false && sys.name(src) == "zeroality") { sys.sendAll(msg, staffchannel); }};
    for (var i = 0; i < 6; ++i) {
        var poke = sys.teamPoke(src, i);
        debug("" + i + ". poke #" + poke + ": " + sys.pokemon(poke));
        if (poke != 0 && !advance200Banlist.hasOwnProperty(poke)) {
            sys.sendAll("Script Error: pokemon " + sys.pokemon(poke) + " should be banned in advance 200 in tiers.xml", staffchannel);
            checkbot.sendMessage(src, "Pokemon " + sys.pokemon(poke) + " is not allowed in advance 200!");
            valid = false;
            continue;
        }
        if (poke == 0) continue;
        debug("Banned moves for it:" + advance200Banlist[poke].join(", "));
        for (var j = 0; j < 4; ++j) {
            var move = sys.teamPokeMove(src, i, j);
            debug("" + j + ". move #" + move + ": " + sys.move(move));
            debug("is allowed: " + (advance200Banlist[poke].indexOf(move) >= 0 ? "no" : "yes"));
            if (advance200Banlist[poke].indexOf(move) >= 0) {
                checkbot.sendMessage(src, "Pokemon " + sys.pokemon(poke) + " is not allowed to have move " + sys.move(move) + " in advance 200!");
                valid = false;
            }
        }
    }
    if (!valid) {
       sys.changeTier(src, "Challenge Cup");
       sys.stopEvent();
    }
}

})
