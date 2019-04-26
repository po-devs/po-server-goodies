var utilities = require("utilities.js");
var find_tier = utilities.find_tier;
var html_escape = utilities.html_escape;

var AutoTeams = {
    dataDirectory: "scriptdata/autoteams/",
    teams: {
        /*
        "ORAS OU": {
            "Team 1": {
                "submitter": "username",
                "team": [
                    {
                        "poke": 0,
                        "ability": 0,
                        "item": 0,
                        "nature": 0,
                        "level": 100,
                        "gender": 0,
                        "shiny": false,
                        "ivs": [...],
                        "evs": [...],
                        "moves": [...]
                    },
                    ...
                ]
            },
            ...
        },
        ...
        */
    },
    tiers: {
        /*
        "ORAS OU": {
            "fileName": "oras_ou.json"
            ... we might want to save more info in the future
        },
        ...
        */
    },
    stats: ["HP", "Atk", "Def", "SAtk", "SDef", "Spd"],
    genders: ["", "(M)", "(F)"]
};

AutoTeams.init = function() {
    sys.mkdir(this.dataDirectory);
    sys.mkdir(this.dataDirectory + "teams/");
    if (!sys.fileExists(this.dataDirectory + "tiers.json")) {
        sys.writeToFile(this.dataDirectory + "tiers.json", "{}");
        this.tiers = {};
    } else {
        try {
            this.tiers = JSON.parse(sys.getFileContent(this.dataDirectory + "tiers.json"));
        } catch (error) {
            this.tiers = {};
        }
    }
    this.teams = {};
    this.tierList().forEach(function(tier) {
        try {
            this.teams[tier] = JSON.parse(sys.getFileContent(
                this.dataDirectory + "teams/" + this.tiers[tier].fileName));
        } catch (error) {
            this.teams[tier] = {};
        }
    }, this);
};

AutoTeams.tierList = function() {
    return Object.keys(this.tiers);
};

AutoTeams.teamList = function(tier) {
    if (tier === undefined) {
        var list = [];
        this.tierList().forEach(function(tier) {
            var teams = Object.keys(this.teams[tier]);
            for (var i = 0; i < teams.length; i++) {
                list.push(teams[i] + " [" + tier + "]");
            }
        }, this);
        return list;
    } else {
        tier = find_tier(tier);
        if (!this.tiers.hasOwnProperty(tier)) {
            return [];
        }
        return Object.keys(this.teams[tier]);
    }
};

AutoTeams.teamsAvailable = function(tier) {
    return this.teamList(tier).length > 0;
};

AutoTeams.natureInfo = function(nature) {
    var stats2 = [this.stats[1], this.stats[2], this.stats[5], this.stats[3], this.stats[4]];
    var info = sys.nature(nature) + " Nature";
    var boosted = Math.floor(nature / 5);
    var lowered = nature % 5;
    if (boosted !== lowered) {
        return info + " (+" + stats2[boosted] + ", -" + stats2[lowered] + ")";
    }
    return info;
};

AutoTeams.moveInfo = function(move, ivs, gen, hpType) {
    var info = sys.move(move);
    if (info === "Hidden Power") {
        info += " [" + (hpType && gen >= 7 ? sys.type(hpType) : sys.type(sys.hiddenPowerType(gen, ivs[0], ivs[1], ivs[2], ivs[3], ivs[4], ivs[5]))) + "]";
    }
    return "- " + info;
};

AutoTeams.evInfo = function(evs) {
    var info = [];
    for (var i = 0; i < 6; i++) {
        if (evs[i] > 0) {
            info.push(evs[i] + " " + this.stats[i]);
        }
    }
    return "EVs: " + info.join(" / ");
};

AutoTeams.ivInfo = function(ivs) {
    var info = [];
    for (var i = 0; i < 6; i++) {
        if (ivs[i] < 31) {
            info.push(ivs[i] + " " + this.stats[i]);
        }
    }
    return "IVs: " + info.join(" / ");
};

AutoTeams.teamImportable = function(teamName, tier) {
    tier = find_tier(tier);
    teamName = teamName.toLowerCase();
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot make an importable for a team in a tier which doesn't exist!";
    }
    if (!this.teams[tier].hasOwnProperty(teamName)) {
        throw "Cannot make an importable for a team which doesn't exist!";
    }
    var team = this.teams[tier][teamName].team;
    var gen = sys.generationOfTier(tier);
    var importable = "";
    for (var p = 0; p < 6; p++) {
        importable += "\n" + sys.pokemon(team[p].poke);
        importable += " " + this.genders[team[p].gender];
        importable += " @ " + sys.item(team[p].item) + "\n";
        if (team[p].level !== 100) {
            importable += "Level: " + team[p].level + "\n";
        }
        if (team[p].shiny) {
            importable += "Shiny: Yes\n";
        }
        importable += "Trait: " + sys.ability(team[p].ability) + "\n";
        if (gen > 2) {
            importable += this.evInfo(team[p].evs) + "\n";
            var perfectIvs = true;
            for (var s = 0; s < 6; s++) {
                perfectIvs &= team[p].ivs[s] === 31;
            }
            if (!perfectIvs) {
                importable += this.ivInfo(team[p].ivs) + "\n";
            }
        }
        importable += this.natureInfo(team[p].nature) + "\n";
        for (var m = 0; m < 4; m++) {
            if (team[p].moves[m] !== 0) {
                importable += this.moveInfo(
                    team[p].moves[m], team[p].ivs, gen, team[p].hiddenpower) + "\n";
            }
        }
    }
    return importable;
};

AutoTeams.saveTier = function(tier) {
    tier = find_tier(tier);
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot save a tier which has not been added!";
    }
    sys.writeToFile(this.dataDirectory + "teams/" + this.tiers[tier].fileName,
        JSON.stringify(this.teams[tier]));
    sys.writeToFile(this.dataDirectory + "tiers.json",
        JSON.stringify(this.tiers));
};

AutoTeams.saveAll = function() {
    this.tierList().forEach(saveTier, this);
    sys.writeToFile(this.dataDirectory + "tiers.json",
        JSON.stringify(this.tiers));
};

AutoTeams.addTier = function(tier) {
    tier = find_tier(tier);
    if (tier === null) {
        throw "Cannot add a tier which does not exist!";
    }
    if (this.tiers.hasOwnProperty(tier)) {
        throw "Cannot add a tier which has already been added!";
    }
    if (sys.allowsIllegal(tier)) {
        throw "Hackmons autoteams are not currently supported!";
    }
    this.teams[tier] = {};
    this.tiers[tier] = {
        "fileName": tier.replace(/\s/g, "_").toLowerCase() + ".json"
    };
    this.saveTier(tier);
};

AutoTeams.removeTier = function(tier) {
    tier = find_tier(tier);
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot remove a tier which has not been added!";
    }
    sys.rm(this.dataDirectory + "teams/" + this.tiers[tier].fileName);
    delete this.teams[tier];
    delete this.tiers[tier];
};

AutoTeams.addTeam = function(teamName, tier, player) {
    tier = find_tier(tier);
    teamName = teamName.toLowerCase();
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot add to a tier which has not been added!";
    }
    if (!sys.hasTier(player, tier)) {
        throw "Could not find any valid " + tier + " teams loaded!";
    }
    if (this.teams[tier].hasOwnProperty(teamName)) {
        throw "A team with that name already exists in " + tier + "!";
    }
    var teamIndex = -1;
    for (var i = sys.teamCount(player) - 1; i >= 0; i--) {
        if (sys.hasLegalTeamForTier(player, i, tier)) {
            teamIndex = i;
        }
    }
    var team = [];
    for (var p = 0; p < 6; p++) {
        var pokemon = {
            "poke": sys.teamPoke(player, teamIndex, p),
            "ability": sys.teamPokeAbility(player, teamIndex, p),
            "item": sys.teamPokeItem(player, teamIndex, p),
            "nature": sys.teamPokeNature(player, teamIndex, p),
            "level": sys.teamPokeLevel(player, teamIndex, p),
            "gender": sys.teamPokeGender(player, teamIndex, p),
            "shiny": sys.teamPokeShine(player, teamIndex, p),
            "ivs": [31, 31, 31, 31, 31, 31],
            "evs": [0, 0, 0, 0, 0, 0],
            "moves": [],
            "hiddenpower": sys.teamPokeHiddenPower(player, teamIndex, p)
        };
        for (var s = 0; s < 6; s++) {
            pokemon.evs.push(sys.teamPokeEV(player, teamIndex, p, s));
            pokemon.ivs.push(sys.teamPokeDV(player, teamIndex, p, s));
        }
        for (var m = 0; m < 4; m++) {
            pokemon.moves.push(sys.teamPokeMove(player, teamIndex, p, m));
        }
        team.push(pokemon);
    }
    this.teams[tier][teamName] = {
        "submitter": sys.name(player),
        "team": team
    };
    this.saveTier(tier);
};

AutoTeams.addTeam2 = function(teamName, tier, player, data) {
    tier = find_tier(tier);
    teamName = teamName.toLowerCase();
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot add to a tier which has not been added!";
    }
    if (this.teams[tier].hasOwnProperty(teamName)) {
        throw "A team with that name already exists in " + tier + "!";
    }
    var team = [];

    var info = data.replace(/\r/g, "").split("\n");
    
    teamsbot.sendMessage(player, info, channel);
    
    var gen = sys.generationOfTier(tier);
    for (var p = 0; p < 6; p++) {
        var pokemon = {
            "poke": 0,
            "ability": null,
            "item": null,
            "nature": 0,
            "level": 100,
            "gender": 0,
            "shiny": false,
            "ivs": [31, 31, 31, 31, 31, 31],
            "evs": [0, 0, 0, 0, 0, 0],
            "moves": [],
            "hiddenpower": ""
        };
        if (gen < 3) {
            pokemon.ivs = [15, 15, 15, 15, 15, 15];
            pokemon.evs = [252, 252, 252, 252, 252, 252];
        }
        team.push(pokemon);
    }
    teamsbot.sendMessage(player, "The importable is " + info.length + " lines long.", channel);    
    var index = 0, parcel, piece, value, i = 0, j = 0, d;
    while (index < 6) {
        j++;
        if (j > 20000) {
            throw "Autoteam failed to load.";
        }
        if (i >= info.length) {
            break;
        }
        try {
            parcel = info[i];
            piece = parcel.split(" ");
        }
        catch (error) {
            teamsbot.sendMessage(player, "Couldn't seperate the parcel. [" + error + (error.lineNumber ? " at line " + error.lineNumber : "") + ". Parcel: " + parcel + " at loop: " + j + " where i = " + i + "]", channel);
            return;
        };
        teamsbot.sendMessage(player, "Adding parcel: " + parcel + ".", channel); 
        value = sys.pokeNum(piece[0]);   
        d = 0; //displacement for other data in this line, such as gender/item
        if (((!value) || value < 1) && piece.length > 1) {
            value = sys.pokeNum(piece[0] + " " + piece[1]);
            d = 1;
        }
        if (((!value) || value < 1) && piece.length > 2) {
            value = sys.pokeNum(piece[0] + " " + piece[1] + " " + piece[2]);
            d = 2;
        }
        if (value && value > 0 && (!(sys.pokemon(value) == "Missingno"))) {
            team[index].poke = value;
            var itemdata;
            if (piece[d + 1] === "(M)") {
                team[index].gender = 1;
            }
            else if (piece[d + 1] === "(F)") {
                team[index].gender = 2;
            }
            else if (piece[d + 1] === "@" && piece.length > d + 2) {
                itemdata = piece[d + 2];
                if (piece.length > d + 3) {
                    itemdata += " " + piece[d + 3];
                }
                if (piece.length > d + 4) {
                    itemdata += " " + piece[d + 4];
                }
            }
            if (piece.length > d + 3 && piece[d + 2] === "@") {
                itemdata = piece[d + 3];
                if (piece.length > d + 4) {
                    itemdata += " " + piece[d + 4];
                }
                if (piece.length > d + 5) {
                    itemdata += " " + piece[d + 5];
                }
            }
            value = sys.itemNum(itemdata);
            if (!value) {
                continue;
            }
            if (value === 0) {
                continue;
            }
            team[index].item = value;
            i++;
            continue;
        }
        if (piece[0] == "Ability:" || piece[0] == "Trait:" && piece.length > 1) {
            value = sys.abilityNum(piece[1]);
            if ((!value) && piece.length > 2) {
                value = sys.abilityNum(piece[1] + " " + piece[2]);
            }
            if ((!value) && piece.length > 3) {
                value = sys.abilityNum(piece[1] + " " + piece[2] + " " + piece[3]);
            }
            if (value) {
                team[index].ability = value;
                i++;
                continue;
            }
        }
        if (piece[0] == "Lvl:" || piece[0] == "Level:" && piece.length > 1) {
            value = parseInt(piece[1], 10);
            if (value) {
                team[index].level = value;
                i++;
                continue;
            }
        }
        if (piece[0] == "EVs:" && piece.length > 1) {
            var evs = {}, out = [], base = 252;
            if (gen > 2) {
                base = 0;
            }
            if (piece.length > 2) {
                evs[piece[2].toLowerCase()] = piece[1];
            }
            if (piece.length > 5) {
                evs[piece[5].toLowerCase()] = piece[4];
            }
            if (piece.length > 8) {
                evs[piece[8].toLowerCase()] = piece[7];
            }
            if (piece.length > 11) {
                evs[piece[11].toLowerCase()] = piece[10];
            }
            if (piece.length > 14) {
                evs[piece[14].toLowerCase()] = piece[13];
            }
            if (piece.length > 17) {
                evs[piece[17].toLowerCase()] = piece[16];
            }
            value = (evs.hasOwnProperty("hp") ? parseInt(evs.hp, 10) : base);
            out.push(value);
            value = (evs.hasOwnProperty("atk") ? parseInt(evs.atk, 10) : base);
            out.push(value);
            value = (evs.hasOwnProperty("def") ? parseInt(evs.def, 10) : base);
            out.push(value);
            value = (evs.hasOwnProperty("satk") ? parseInt(evs.satk, 10) : base);
            out.push(value);
            value = (evs.hasOwnProperty("sdef") ? parseInt(evs.sdef, 10) : base);
            out.push(value);
            value = (evs.hasOwnProperty("spd") ? parseInt(evs.spd, 10) : base);
            out.push(value);
            team[index].evs = out;
            i++;
            continue;
        }
        if (piece[0] == "IVs:" && piece.length > 1) {
            var ivs = {}, out = [], base = 15;
            if (gen > 2) {
                base = 31;
            }
            if (piece.length > 2) {
                ivs[piece[2].toLowerCase()] = piece[1];
            }
            if (piece.length > 5) {
                ivs[piece[5].toLowerCase()] = piece[4];
            }
            if (piece.length > 8) {
                ivs[piece[8].toLowerCase()] = piece[7];
            }
            if (piece.length > 11) {
                ivs[piece[11].toLowerCase()] = piece[10];
            }
            if (piece.length > 14) {
                ivs[piece[14].toLowerCase()] = piece[13];
            }
            if (piece.length > 17) {
                ivs[piece[17].toLowerCase()] = piece[16];
            }
            value = (ivs.hasOwnProperty("hp") ? parseInt(ivs.hp, 10) : base);
            out.push(value);
            value = (ivs.hasOwnProperty("atk") ? parseInt(ivs.atk, 10) : base);
            out.push(value);
            value = (ivs.hasOwnProperty("def") ? parseInt(ivs.def, 10) : base);
            out.push(value);
            value = (ivs.hasOwnProperty("satk") ? parseInt(ivs.satk, 10) : base);
            out.push(value);
            value = (ivs.hasOwnProperty("sdef") ? parseInt(ivs.sdef, 10) : base);
            out.push(value);
            value = (ivs.hasOwnProperty("spd") ? parseInt(ivs.spd, 10) : base);
            out.push(value);
            team[index].ivs = out;
            i++;
            continue;
        }
        if (piece.length > 1 && piece[1] == "Nature") {
            value = sys.natureNum(piece[0]);
            if (value) {
                team[index].nature = value;
                i++;
                continue;
            }
        }
        if (piece.length > 1 && piece[0] == "-") {
            var move = piece[1];
            if (piece.length > 2) {
                move += " " + piece[2];
            }
            if (move == "Hidden Power" && piece.length > 3) {
                var hptype = piece[3].replace(/[\[\]']+/g, '');
                if (sys.type(hptype)) {
                    team[index].hiddenpower = sys.type(hptype);
                }
            }
            else if (piece.length > 3) {
                move += " " + piece[3];
            }
            else if (piece.length > 4) {
                move += " " + piece[4];
            }
            value = sys.moveNum(move);
            if (team[index].moves.length < 4 && value && value > 0) {
                team[index].moves.push(value);
                i++;
                continue;
            }
        }
        else if (piece[0] == "") {
            //Empty string when split returns array with empty string
            i++;
            index++;
            continue;
        }
        
        teamsbot.sendMessage(player, piece, channel);
        throw "Error while loading autoteam.";
    }
    this.teams[tier][teamName] = {
        "submitter": sys.name(player),
        "team": team
    };
    this.saveTier(tier);
};

AutoTeams.removeTeam = function(teamName, tier) {
    tier = find_tier(tier);
    teamName = teamName.toLowerCase();
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot remove from a tier which has not been added!";
    }
    if (!this.teams[tier].hasOwnProperty(teamName)) {
        throw "Cannot remove a team which does not exist!";
    }
    delete this.teams[tier][teamName];
    this.saveTier(tier);
};

AutoTeams.giveTeam = function(player, slot, tier) {
    tier = find_tier(tier);
    var gen = sys.generationOfTier(tier);
    var subgen = sys.subGenerationOfTier(tier);
    sys.changeGen(player, slot, gen, subgen);
    if (!this.tiers.hasOwnProperty(tier)) {
        throw "Cannot give a team for tier which has not been added!";
    }
    if (this.teams[tier].length === 0) {
        throw "Cannot give a team from a tier which has no teams!";
    }
    if (slot < 0 || slot >= sys.teamCount(player)) {
        throw "Invalid team slot!";
    }
    var tries = 0;
    var hasValidTeam = false;
    var teamList = this.teamList(tier);
    while (!hasValidTeam && teamList.length > 0) {
        var teamName = teamList.splice(
            Math.floor(Math.random() * teamList.length), 1)[0];
        var team = this.teams[tier][teamName].team;
        for (var i = 0; i < 6; i++) {
            sys.changePokeNum(player, slot, i, team[i].poke);
            sys.changePokeName(player, slot, i, sys.pokemon(team[i].poke));
            sys.changePokeAbility(player, slot, i, team[i].ability);
            sys.changePokeItem(player, slot, i, team[i].item);
            sys.changePokeNature(player, slot, i, team[i].nature);
            sys.changePokeLevel(player, slot, i,
                Math.max(1, Math.min(sys.maxLevelOfTier(tier), team[i].level)));
            sys.changePokeShine(player, slot, i, team[i].shiny);
            sys.changePokeGender(player, slot, i, team[i].gender);
            if (team[i].hasOwnProperty("hiddenpower")) {
                sys.changePokeHiddenPower(player, slot, i, team[i].hiddenpower);
            }
            if (team[i].moves.indexOf(216) > -1) {
                // Return
                sys.changePokeHappiness(player, slot, i, 255);
            } else {
                sys.changePokeHappiness(player, slot, i, 0);
            }
            for (var m = 0; m < 4; m++) {
                sys.changePokeMove(player, slot, i, m, team[i].moves[m]);
            }
            for (var s = 0; s < 6; s++) {
                sys.changeTeamPokeEV(player, slot, i, s, team[i].evs[s]);
                sys.changeTeamPokeDV(player, slot, i, s, team[i].ivs[s]);
            }
        }
        if (tier_checker.has_legal_team_for_tier(player, slot, tier, true)) {
            sys.changeTier(player, slot, tier);
            hasValidTeam = true;
        }
    }
    if (!hasValidTeam) {
        throw "Cannot retrieve a valid team, please alert the staff!";
    }
};

AutoTeams.isAutoTeamsAuth = function(player) {
    return require("tours.js").isTourOwner(player) || (sys.auth(player) >= 2 && sys.dbRegistered(sys.name(player)));
};

AutoTeams.isAutoTeamsReviewer = function(player) {
    return this.isAutoTeamsAuth(player) || script.autoteamsAuth.has(sys.name(player).toLowerCase());
};

AutoTeams.changeReviewers = function(name, remove) {
    if (!name) {
        throw "Enter a valid user!";
    }
    if (!sys.dbIp(name)) {
        throw "This user doesn't exist.";
    }
    if (!sys.dbRegistered(name)) {
        throw "This user isn't registered!";
    }
    
    var hasName = script.autoteamsAuth.has(name.toLowerCase());
    if (remove) {
        if (!hasName) {
            throw "This user is not an autoteam reviewer.";
        }
        script.autoteamsAuth.remove(name.toLowerCase());
        return "Removed " + name.toCorrectCase() + " from autoteam reviewers.";
    }
    if (hasName) {
        throw "This user is already an autoteam reviewer.";
    }
    script.autoteamsAuth.add(name.toLowerCase(), "");
    return "Added " + name.toCorrectCase() + " to autoteam reviewers.";
};

AutoTeams.handleCommand = function(player, message, channel) {
    var authCommands = [
        "addautoreviewer",
        "removeautoreviewer",
        "addautotier",
        "removeautotier"
    ];

    var reviewCommands = [
        "autoteamsreview",
        "autotiers",
        "autoteams",
        "addautoteam",
        "addautoteam2",
        "removeautoteam",
        "viewautoteam",
        "setautoteam"
    ];

    var command, commandData;
    var split = message.indexOf(" ");
    if (split > -1) {
        command = message.substring(0, split).toLowerCase();
        commandData = message.substring(split + 1);
    } else {
        command = message.toLowerCase();
        commandData = "";
    }

    if (!(reviewCommands.indexOf(command) > -1 && this.isAutoTeamsReviewer(player)) &&
        !(authCommands.indexOf(command) > -1 && this.isAutoTeamsAuth(player))) {
        return false;
    }

    var commandData2 = commandData.split(",");
    commandData = commandData.split(":");
    var team, tier;
    try {
        if (command === "addautoreviewer" || command === "removeautoreviewer") {
            teamsbot.sendMessage(player, this.changeReviewers(commandData[0], command === "removeautoreviewer"), channel);   
        } else if (command === "autoteamsreview") {
            var reviewers = [], x;
            for (x in script.autoteamsAuth.hash) {
                reviewers.push(x);
            }
            sys.sendMessage(player, "±Reviewers: " + reviewers.sort().join(", "), channel);
        } else if (command === "addautoteam") {
            if (commandData.length !== 2) {
                throw "Usage: /addautoteam [team name]:[tier]";
            }
            this.addTeam(commandData[0], commandData[1], player);
            team = commandData[0].toLowerCase();
            tier = find_tier(commandData[1]);
            teamsbot.sendMessage(player, "Added " + team + " to " + find_tier(tier) + " autoteams.", channel);
        } else if (command === "addautoteam2") {
            if (commandData2.length !== 3) {
                throw "Usage: /addautoteam2 [team name],[tier],[url]";
            }
            var data = "";
            try {
                sys.webCall(commandData2[2], function (resp) {
                    if (resp === "") {
                        throw "Web file not found: Invalid URL or web functions are not working.";
                    }
                    data = resp;
                    
                    //teamsbot.sendMessage(player, data, channel);
                    
                    try {
                        AutoTeams.addTeam2(commandData2[0], commandData2[1], player, data);
                    }
                    catch (error) {
                        teamsbot.sendMessage(player, "Unable to create autoteam from provided importable. [" + error + (error.lineNumber ? " at line " + error.lineNumber : "") + "]", channel);
                    };
                });
            }
            catch (error) {
                teamsbot.sendMessage(player, "Unable to load autoteam from url.", channel);
            };

            team = commandData2[0].toLowerCase();
            tier = find_tier(commandData2[1]);
            teamsbot.sendMessage(player, "Added " + team + " to " + find_tier(tier) + " autoteams.", channel);
        } else if (command === "removeautoteam") {
            if (commandData.length !== 2) {
                throw "Usage: /removeautoteam [team name]:[tier]";
            }
            this.removeTeam(commandData[0], commandData[1]);
            team = commandData[0].toLowerCase();
            tier = find_tier(commandData[1]);
            teamsbot.sendMessage(player, "Removed " + team + " from " + tier + " autoteams.", channel);
        } else if (command === "addautotier") {
            if (commandData.length !== 1) {
                throw "Usage: /addautotier [tier]";
            }
            this.addTier(commandData[0]);
            tier = find_tier(commandData[0]);
            teamsbot.sendMessage(player, "Created autoteams tier " + tier + ".", channel);
        } else if (command === "removeautotier") {
            if (commandData.length !== 1) {
                throw "Usage: /removeautotier [tier]";
            }
            this.removeTier(commandData[0]);
            tier = find_tier(commandData[0]);
            teamsbot.sendMessage(player, "Removed autoteams tier " + tier + ".", channel);
        } else if (command === "autotiers") {
            teamsbot.sendMessage(player, "AutoTeam Tiers: " + this.tierList().join(", "), channel);
        } else if (command === "autoteams") {
            if (commandData.length !== 1) {
                throw "Usage: /autoteams [tier]";
            }
            if (commandData[0] === "") {
                teamsbot.sendMessage(player, this.teamList().join(", "), channel);
            } else {
                tier = find_tier(commandData[0]);
                teamsbot.sendMessage(player, tier + ": " + this.teamList(tier).join(", "), channel);
            }
        } else if (command === "viewautoteam") {
            if (commandData.length !== 2) {
                throw "Usage: /viewautoteam [team name]:[tier]";
            }
            sys.sendHtmlMessage(player,
                "<table border='2'><tr><td><pre>" +
                html_escape(this.teamImportable(
                    commandData[0], commandData[1])).replace(/\n/g, "<br>") +
                "</pre></td></tr></table>",
                channel);
        } else if (command === "setautoteam") {
            if (commandData.length !== 1) {
                throw "Usage: /setautoteam [tier]";
            }
            this.giveTeam(player, 0, commandData[0]);
            tier = find_tier(commandData[0]);
            teamsbot.sendMessage(player, "Your first team was set to a random " + tier + " team.", channel);
        } else {
            return false;
        }
    } catch (error) {
        teamsbot.sendMessage(player, error, channel);
    }
    return true;
};

AutoTeams.authHelp = [
    "*** AutoTeams Auth Commands ***",
    "/[add/remove]autoreviewer [user]: Adds/removes a user from autoteam reviewers.",
    "/[add/remove]autotier [tier]: Adds/removes a tier for autoteams."
];

AutoTeams.reviewHelp = [
    "*** AutoTeams Reviewer Commands ***",
    "/autoteamsreview: Lists users who may add autoteams.",
    "/autotiers: Lists tiers with autoteams.",
    "/autoteams [tier]: Lists autoteams for a tier. Includes all tiers when no tier is specified.",
    "/[add/remove]autoteam [team name]:[tier]: Adds/removes an autoteam.",
    "/viewautoteam [team name]:[tier]: Displays an autoteam as an importable.",
    "/setautoteam [tier]: Sets a random autoteam to your first team slot (debug use)."
];

// AutoTeams["help-string"] = ["autoteams: To know the autoteams commands"];

AutoTeams.onHelp = function(player, topic, channel) {
    if (topic !== "autoteams" || !this.isAutoTeamsReviewer(player)) {
        return false;
    }
    
    var help = [""].concat(this.reviewHelp);
    if (this.isAutoTeamsAuth(player)) {
        help = help.concat(this.authHelp);
    }
    
    help.forEach(function(line) {
        sys.sendMessage(player, line, channel);
    });
    return true;
};

module.exports = AutoTeams;
