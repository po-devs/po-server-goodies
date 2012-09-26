/*
Battle Factory Script

Coding done by Shadowfist

Requires bfteams.json to work, exportteam.json is optional.
*/

// Globals
var bfversion = "0.70";
var bfsets, pokedb;

function initFactory() {
    try {
        var file = sys.getFileContent("bfteams.json");
        if (file === undefined) {
            var url = Config.base_url+"bfteams.json";
            normalbot.sendChanMessage(src, "Teams file not found, fetching teams from "+url);
            sys.webCall(url, function(resp) {
                if (resp !== "") {
                    try {
                        var test = JSON.parse(resp);
                        sys.writeToFile('bfteams.json', resp);
                        sendChanAll('Updated Battle Factory Teams!', staffchannel);
                    }
                    catch (err) {
                        sendChanAll("FATAL ERROR: "+err, staffchannel);
                        throw "Battle Factory web file is corrupt!";
                    }
                }
                else {
                    sendChanAll("Failed to load teams!", staffchannel);
                    throw "Couldn't load the Battle Factory file!";
                }
            });
        }
        bfsets = JSON.parse(file);
        getPokeDb();
    }
    catch (e) {
        throw e;
    }
    sendChanAll("Version "+bfversion+" of the Battle Factory loaded successfully!", staffchannel);
}

function getPokeDb() {
    var pokelist = sys.getFileContent("db/pokes/stats.txt");
    var pokes = pokelist.split("\n");
    pokedb = {};
    for (var x in pokes) {
        var data = pokes[x].split(" ");
        if (data.length != 7) {
            continue;
        }
        var thepokeid = data[0].split(":");
        var thepoke = sys.pokemon(parseInt(thepokeid[0]) + 65536*parseInt(thepokeid[1]));
        pokedb[thepoke] = [parseInt(data[1]), parseInt(data[2]), parseInt(data[3]), parseInt(data[4]), parseInt(data[5]), parseInt(data[6])];
    }
}

function dumpData(tar, team) {
    var sets = [];
    for (var b=0;b<6;b++) {
        sets.push(getStats(tar, team, b).join("<br/>"));
    }
    if (sets.length > 0) {
        sys.sendHtmlMessage(tar, "<table border='2'><tr><td><pre>"+sets.join("<br/><br/>")+"</pre></td></tr></table>");
    }
    return;
}

function refresh() {
    try {
        var file = sys.getFileContent("bfteams.json");
        bfsets = JSON.parse(file);
        var message = [];
        if (bfsets.hasOwnProperty('desc')) {
            if (typeof bfsets.desc == "string") {
                message.push("Successfully loaded the team pack '"+bfsets.desc+"'");
            }
            else {
                message.push("Warning: Team set description was faulty");
            }
        }
        else {
            message.push("Successfully loaded the team pack");
        }
        var tteams = 0;
        var tsets = 0;
        for (var a in bfsets) {
            if (typeof bfsets[a] != "object") {
                continue;
            }
            tteams += 1;
            var setlength = bfsets[a].length;
            tsets += setlength;
        }
        message.push("Total: "+tteams+" pokes and "+tsets+" sets.");
        if (message.length > 0) {
            sendChanAll(message.join("; "), staffchannel);
        }
    }
    catch (err) {
        sendChanAll("Couldn't refresh teams: "+err, staffchannel);
    }
}

function toChars(number, maxchars) {
    var digits = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    var result = '';
    for (var h=(maxchars-1); h>=0; h--) {
        result = result + digits[Math.floor(number/Math.pow(digits.length,h))%digits.length];
    }
    return result;
}

function toNumber(charstring) {
    var digits = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
    var result = 0;
    if (charstring.length == 3) {
        result = Math.pow(digits.length,2)*digits.indexOf(charstring.charAt(0)) + digits.length*digits.indexOf(charstring.charAt(1)) + digits.indexOf(charstring.charAt(2));
    }
    if (charstring.length == 2) {
        result = digits.length*digits.indexOf(charstring.charAt(0)) + digits.indexOf(charstring.charAt(1));
    }
    if (charstring.length == 1) {
        result = digits.indexOf(charstring.charAt(0));
    }
    return result;
}

function factoryCommand(src, command, commandData) {
    // This can add sets through GUI, but it's hard to see the potential results.
    if (command == "exportteam") {
        normalbot.sendChanMessage(src, "This command is disabled, edit the sets externally.");
        return;
        /*var team = {};
        for (var n=0;n<sys.teamCount(src);n++) {
            for (var x=0;x<6;x++) {
                var pokecode = "";
                var poke = sys.teamPoke(src, n, x);
                if (poke === 0) { // don't export missingno.
                    continue;
                }
                // This accounts for formes
                var pokenum = poke%65536;
                var formnum = Math.floor(poke/65536);
                var nature = sys.teamPokeNature(src, n, x);
                var ability = sys.teamPokeAbility(src, n, x);
                var item = sys.teamPokeItem(src, n, x);
                var level = sys.teamPokeLevel(src, n, x);
                pokecode = pokecode + toChars(pokenum,2) + toChars(formnum,1) + toChars(nature,1) + toChars(ability,2) + toChars(item,3) + toChars(level,2);
                var movelist = [];
                for (var m=0; m<4; m++) {
                    var move = sys.teamPokeMove(src, n, x, m);
                    movelist.push(sys.move(move));
                    pokecode = pokecode + toChars(move, 2);
                }
                var evlist = [];
                for (var e=0; e<6; e++) {
                    var ev = sys.teamPokeEV(src, n, x, e);
                    evlist.push(ev);
                    pokecode = pokecode + toChars(ev, 2);
                }
                var dvlist = [];
                for (var d=0; d<6; d++) {
                    var dv = sys.teamPokeDV(src, n, x, d);
                    dvlist.push(dv);
                    pokecode = pokecode + toChars(dv, 1);
                }
                var gender = sys.teamPokeGender(src, n, x);
                pokecode = pokecode + toChars(gender, 1);
                team[pokecode] = {
                    'poke': sys.pokemon(poke),
                    'species': pokenum,
                    'nature': sys.nature(nature),
                    'ability': sys.ability(ability),
                    'item': sys.item(item),
                    'level': level,
                    'moves': movelist,
                    'evs': evlist,
                    'dvs': dvlist,
                    'gender': gender
                };
            }
        }
        var teamsave = {};
        var exportfile = sys.getFileContent("bfteams.json");
        if (exportfile !== undefined) {
            try {
                teamsave = JSON.parse(exportfile);
            }
            catch (err) {
                normalbot.sendChanMessage(src, "Teamsave data was corrupt.");
                return;
            }
        }
        // Write the short code
        for (var t in team) {
            var species = team[t].species;
            if (teamsave.hasOwnProperty(species)) {
                if (teamsave[species].indexOf(t) == -1) {
                    teamsave[species].push(t);
                }
                continue;
            }
            else {
                teamsave[species] = [t];
            }
        }
        sys.writeToFile("bfteams.json", JSON.stringify(teamsave, null, 4));
        // Write the instant export
        sys.writeToFile("exportteam.json", JSON.stringify(team, null, 4));
        normalbot.sendChanMessage(src, "Exported the team.");
        refresh();
        return;*/
    }
    if (command == "importteam") {
        var teamfile = sys.getFileContent("exportteam.json");
        try {
            var team = JSON.parse(teamfile);
            var teaminfo = [];
            for (var x in team) {
                teaminfo.push(team[x]);
                if (teaminfo.length >= 6) {
                    break;
                }
            }
            for (var s=0;s<6;s++) {
                var pdata = teaminfo[s];
                sys.changePokeNum(src,0,s,sys.pokeNum(pdata.poke));
                sys.changePokeNature(src,0,s,sys.natureNum(pdata.nature));
                sys.changePokeAbility(src,0,s,sys.abilityNum(pdata.ability));
                sys.changePokeItem(src,0,s,sys.itemNum(pdata.item));
                for (var m=0;m<4;m++) {
                    sys.changePokeMove(src,0,s,m,sys.moveNum(pdata.moves[m]));
                }
                for (var c=0;c<6;c++) {
                    sys.changeTeamPokeEV(src,0,s,c,0); // this resets the EV count
                }
                for (var e=0;e<6;e++) {
                    sys.changeTeamPokeEV(src,0,s,e,pdata.evs[e]);
                }
                for (var d=0;d<6;d++) {
                    sys.changeTeamPokeDV(src,0,s,d,pdata.dvs[d]);
                }
                var happiness = sys.rand(0,256);
                // maximise happiness if the poke has Return, minmise if it has frustration
                if (sys.hasTeamPokeMove(src, 0, x, sys.moveNum('Return'))) {
                    happiness = 255;
                }
                else if (sys.hasTeamPokeMove(src, 0, x, sys.moveNum('Frustration'))) {
                    happiness = 0;
                }
                sys.changePokeHappiness(src,0,s,happiness);
                sys.changePokeShine(src, 0, s, sys.rand(0,8192) === 0 ? true : false);
                sys.changePokeGender(src,0,s,pdata.gender);
                sys.changePokeLevel(src,0,s,pdata.level);
            }
            sys.updatePlayer(src);
        }
        catch (err) {
            normalbot.sendChanMessage(src, "Team file was empty or corrupt, could not import.");
            return;
        }
        normalbot.sendChanMessage(src, "Imported the team.");
        return;
    }
    if (command == "updateteams") {
        var url = Config.base_url+"bfteams.json";
        if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
            url = commandData;
        }
        normalbot.sendChanMessage(src, "Fetching teams from "+url);
        sys.webCall(url, function(resp) {
            if (resp !== "") {
                try {
                    var test = JSON.parse(resp);
                    sys.writeToFile('bfteams.json', resp);
                    sendChanAll('Updated Battle Factory Teams!', staffchannel);
                    refresh();
                }
                catch (err) {
                    normalbot.sendChanMessage(src, "FATAL ERROR: "+err);
                }
            }
            else {
                normalbot.sendChanMessage(src, "Failed to update!");
            }
        });
        return;
    }
    if (command == "pokeslist") {
        var tfile = bfsets;
        var tteams = 0;
        var tsets = 0;
        for (var t in tfile) {
            if (typeof tfile[t] != "object") {
                continue;
            }
            var poke = sys.pokemon(parseInt(t, 10));
            tteams += 1;
            var setlength = tfile[t].length;
            tsets += setlength;
            normalbot.sendChanMessage(src, poke+": Has "+setlength+" sets.");
        }
        normalbot.sendChanMessage(src, "");
        normalbot.sendChanMessage(src, "Total: "+tteams+" pokes and "+tsets+" sets.");
        return;
    }
    if (command == "pokecode") {
        try {
            var msg = getReadablePoke(commandData);
            sendChanHtmlMessage(src, "<table border='2'><tr><td><pre>"+msg.join("<br/>")+"</pre></td></tr></table>");
            return;
        }
        catch (err) {
            normalbot.sendChanMessage(src, "Invalid Code: "+err);
            return;
        }
    }
    if (command == "pokesets") {
        var sets = [];
        var id = sys.pokeNum(commandData);
        if (!bfsets.hasOwnProperty(id)) {
            normalbot.sendChanMessage(src, "No sets exist for that pokemon.");
            return;
        }
        var pokesets = bfsets[id];
        for (var b in pokesets) {
            try {
                sets.push(getReadablePoke(pokesets[b]).join("<br/>"));
            }
            catch (err) {
                normalbot.sendChanMessage(src, "Error (id: "+pokesets[b]+"): "+err);
            }
        }
        if (sets.length > 0) {
            sendChanHtmlMessage(src, "<table border='2'><tr><td><pre>"+sets.join("<br/><br/>")+"</pre></td></tr></table>");
        }
        return;
    }
    return 'no command';
}

function getReadablePoke(set) {
    if (set.length != 38) {
        throw "Invalid Set, each set should be 38 alphanumeric characters long.";
    }
    var info = {
        'poke': sys.pokemon(toNumber(set.substr(0,2))+65536*toNumber(set.substr(2,1))),
        'nature': sys.nature(toNumber(set.substr(3,1))),
        'ability': sys.ability(toNumber(set.substr(4,2))),
        'item': sys.item(toNumber(set.substr(6,3))),
        'level': toNumber(set.substr(9,2)),
        'moves': [sys.move(toNumber(set.substr(11,2))),sys.move(toNumber(set.substr(13,2))),sys.move(toNumber(set.substr(15,2))),sys.move(toNumber(set.substr(17,2)))],
        'evs': [toNumber(set.substr(19,2)),toNumber(set.substr(21,2)),toNumber(set.substr(23,2)),toNumber(set.substr(25,2)),toNumber(set.substr(27,2)),toNumber(set.substr(29,2))],
        'dvs': [toNumber(set.substr(31,1)),toNumber(set.substr(32,1)),toNumber(set.substr(33,1)),toNumber(set.substr(34,1)),toNumber(set.substr(35,1)),toNumber(set.substr(36,1))],
        'gender': toNumber(set.substr(37,1))
    };
    var genders = ['', '(M) ', '(F) '];
    var stats = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
    var msg = [info.poke+" "+genders[info.gender]+"@ "+info.item];
    msg.push("Ability: "+info.ability, info.nature+" Nature, Level "+info.level);
    var evlist = [];
    var dvlist = [];
    for (var j in info.evs) {
        if (info.evs[j] > 0) {
            evlist.push(info.evs[j]+" "+stats[j]);
        }
    }
    for (var k in info.dvs) {
        if (info.dvs[k] < 31) {
            dvlist.push(info.dvs[k]+" "+stats[k]);
        }
    }
    if (dvlist.length === 0) {
        dvlist = ["All 31"];
    }
    msg.push(info.moves.join(" / "),"EVs: "+evlist.join(" / "),"IVs: "+dvlist.join(" / "));
    if (info.moves.indexOf("Hidden Power") != -1) {
        var hptype = sys.hiddenPowerType(5,info.dvs[0],info.dvs[1],info.dvs[2],info.dvs[3],info.dvs[4],info.dvs[5]);
        msg.push("Hidden Power "+sys.type(hptype));
    }
    return msg;
}


// Gets stat boost/drop of natures
// 1=Atk, 2=Def, 3=SpA, 4=SpD, 5=Spe
// reutnrs [up, down] or "";
function getNature(nature) {
    var naturetable = {
        'Hardy': [0,0],
        'Lonely': [1,2],
        'Brave': [1,5],
        'Adamant': [1,3],
        'Naughty': [1,4],
        'Bold': [2,1],
        'Docile': [0,0],
        'Relaxed': [2,5],
        'Impish': [2,3],
        'Lax': [2,4],
        'Timid': [5,1],
        'Hasty': [5,2],
        'Serious': [0,0],
        'Jolly': [5,3],
        'Naive': [5,4],
        'Modest': [3,1],
        'Mild': [3,2],
        'Quiet': [3,5],
        'Bashful': [0,0],
        'Rash': [3,4],
        'Calm': [4,1],
        'Gentle': [4,2],
        'Sassy': [4,5],
        'Careful': [4,3],
        'Quirky': [0,0]
    }
    return naturetable[nature];
}

// This gets the stats for a Pokemon
function getStats(src, team, poke) {
    var movelist = [];
    for (var m=0; m<4; m++) {
        var move = sys.teamPokeMove(src, team, poke, m);
        movelist.push(sys.move(move));
    }
    var evlist = [];
    for (var e=0; e<6; e++) {
        var ev = sys.teamPokeEV(src, team, poke, e);
        evlist.push(ev);
    }
    var dvlist = [];
    for (var d=0; d<6; d++) {
        var dv = sys.teamPokeDV(src, team, poke, d);
        dvlist.push(dv);
    }
    var genders = ["", "(M) ", "(F) "]
    var info = {
        'poke': sys.pokemon(sys.teamPoke(src,team,poke)),
        'species': sys.pokemon(sys.teamPoke(src,team,poke)%65536),
        'nature': sys.nature(sys.teamPokeNature(src,team,poke)),
        'ability': sys.ability(sys.teamPokeAbility(src,team,poke)),
        'item': sys.item(sys.teamPokeItem(src,team,poke)),
        'level': sys.teamPokeLevel(src,team,poke),
        'moves': movelist,
        'evs': evlist,
        'dvs': dvlist,
        'gender': genders[sys.teamPokeGender(src,team,poke)]
    };
    var stats = ["HP", "Attack", "Defense", "Sp.Atk", "Sp.Def", "Speed"];
    var statlist = [];
    var pokeinfo = [];
    if (pokedb.hasOwnProperty(info.poke)) {
        pokeinfo = pokedb[info.poke];
    }
    else if (pokedb.hasOwnProperty(info.species)) {
        pokeinfo = pokedb[info.species];
    }
    else {
        throw "UNHANDLED EXCEPTION";
    }
    for (var s=0; s<6; s++) {
        var natureboost = getNature(info.nature);
        if (s === 0) { // HP Stat
            if (pokeinfo[s] == 1) { // Shedinja
                statlist.push("1 HP");
            }
            else {
                var hstat = 10 + Math.floor(Math.floor(info.dvs[s]+2*pokeinfo[s]+info.evs[s]/4+100)*info.level/100);
                statlist.push(hstat+" HP");
            }
        }
        else {
            var bstat = 5 + Math.floor(Math.floor(info.dvs[s]+2*pokeinfo[s]+info.evs[s]/4)*info.level/100);
            var newstat = 0;
            if (natureboost[0] === s) {
                newstat = Math.floor(bstat*1.1);
            }
            else if (natureboost[1] === s) {
                newstat = Math.floor(bstat*0.9);
            }
            else {
                newstat = bstat;
            }
            statlist.push(newstat+" "+stats[s]);
        }
    }
    var msg = [info.poke+" "+info.gender+"@ "+info.item];
    msg.push("Ability: "+info.ability, info.nature+" Nature, Level "+info.level);
    msg.push(info.moves.join(" / "),"Stats: "+statlist.join(" / "));
    return msg;
}

function generateTeam(src, team) {
    try {
        var pokedata = bfsets;
        var teaminfo = [];
        var pokearray = [];
        for (var x in pokedata) {
            if (typeof pokedata[x] == "object") {
                pokearray.push(x);
            }
        }
        for (var p=0;p<6;p++) {
            if (pokearray.length === 0) {
                normalbot.sendAll("Team file was empty or corrupt, could not import.", staffchannel);
                return;
            }
            var pokes = pokearray.splice(sys.rand(0, pokearray.length),1);
            var sets = pokedata[pokes];
            var set = sets[sys.rand(0, sets.length)]
            teaminfo[p] = {
                'poke': toNumber(set.substr(0,2))+65536*toNumber(set.substr(2,1)),
                'nature': toNumber(set.substr(3,1)),
                'ability': toNumber(set.substr(4,2)),
                'item': toNumber(set.substr(6,3)),
                'level': toNumber(set.substr(9,2)),
                'moves': [toNumber(set.substr(11,2)),toNumber(set.substr(13,2)),toNumber(set.substr(15,2)),toNumber(set.substr(17,2))],
                'evs': [toNumber(set.substr(19,2)),toNumber(set.substr(21,2)),toNumber(set.substr(23,2)),toNumber(set.substr(25,2)),toNumber(set.substr(27,2)),toNumber(set.substr(29,2))],
                'dvs': [toNumber(set.substr(31,1)),toNumber(set.substr(32,1)),toNumber(set.substr(33,1)),toNumber(set.substr(34,1)),toNumber(set.substr(35,1)),toNumber(set.substr(36,1))],
                'gender': toNumber(set.substr(37,1))
            };
        }
        for (var s=0;s<6;s++) {
            var pdata = teaminfo[s];
            sys.changePokeNum(src,team,s,pdata.poke);
            sys.changePokeName(src,team,s,sys.pokemon(pdata.poke))
            sys.changePokeNature(src,team,s,pdata.nature);
            sys.changePokeAbility(src,team,s,pdata.ability);
            sys.changePokeItem(src,team,s,pdata.item);
            for (var m=0;m<4;m++) {
                sys.changePokeMove(src,team,s,m,pdata.moves[m]);
            }
            for (var c=0;c<6;c++) {
                sys.changeTeamPokeEV(src,team,s,c,0); // this resets the EV count
            }
            for (var e=0;e<6;e++) {
                sys.changeTeamPokeEV(src,team,s,e,pdata.evs[e]);
            }
            for (var d=0;d<6;d++) {
                sys.changeTeamPokeDV(src,team,s,d,pdata.dvs[d]);
            }
            var happiness = sys.rand(0,256);
            // maximise happiness if the poke has Return, minmise if it has frustration
            if (sys.hasTeamPokeMove(src, team, x, sys.moveNum('Return'))) {
                happiness = 255;
            }
            else if (sys.hasTeamPokeMove(src, team, x, sys.moveNum('Frustration'))) {
                happiness = 0;
            }
            sys.changePokeHappiness(src,team,s,happiness);
            sys.changePokeShine(src, team, s, sys.rand(0,8192) === 0 ? true : false);
            sys.changePokeGender(src,team,s,pdata.gender);
            sys.changePokeLevel(src,team,s,pdata.level);
        }
        sys.updatePlayer(src);
        return;
    }
    catch (err) {
        normalbot.sendMessage(src, "Team file was empty or corrupt, could not generate a team. Please report this issue on forums. [Error: "+err+"]");
        return;
    }
}

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
        if ((sys.auth(source) > 2 || (sys.name(source) === 'Aerith' && sys.auth(source) >= 1)) || command == "pokeslist") {
            if (factoryCommand(source, command, commandData) != 'no command') {
                return true;
            }
        }
        return;
    },
    init: function() {
        try {
            initFactory();
        }
        catch (err) {
            sendChanAll("Error in starting battle factory: "+err, staffchannel);
        }
    },
    afterChangeTier: function(src, team, newtier) { // This shouldn't be needed, but it's here in case
        if (newtier == "Battle Factory") {
            generateTeam(src, team);
        }
    },
    beforeBattleStarted: function(src, dest, srcteam, destteam) {
        if (sys.tier(src, srcteam) == "Battle Factory" && sys.tier(dest, destteam) == "Battle Factory") {
            generateTeam(src, srcteam);
            generateTeam(dest, destteam);
            dumpData(src, srcteam);
            dumpData(dest, destteam);
        }
    },
    onHelp: function(src, topic, channel) {
        var help = [];
        if (topic == "battlefactory" && (sys.auth(src) > 2 || (sys.name(src) === 'Aerith' && sys.auth(src) >= 1))) {
            help = [
                "/pokeslist: Views the list of installed Pokemon",
                "/pokecode [alpha code]: Converts a code to readable format.",
                "/pokesets [poke]: Gets the sets for that pokemon in readable format",
                "/exportteam: Exports your current team to code.",
                "/importteam: Imports the last team made",
                "/updateteams: Update teams from the web"
            ];
        }
        if (help.length > 0) {
            sys.sendMessage(src, "*** Battle Factory Operator Commands ***", channel);
            for (var i = 0; i < help.length; ++i) {
                sys.sendMessage(src, help[i], channel);
            }
            return true;
        }
        return false;
    },
    getVersion: function(type) {
        if (type == "script") {
            return bfversion;
        }
        else if (type == "team") {
            if (bfsets.hasOwnProperty('desc')) {
                if (typeof bfsets.desc == "string") {
                    return bfsets.desc;
                }
                else {
                    return "Default";
                }
            }
            else {
                return "Default";
            }
        }
        else {
            return "Invalid Type";
        }
    }
}
