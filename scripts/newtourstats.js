// newtourstats.js
// plugin for tours.js
// To use this:
// require("newtourstats.js")

var dataDir = "scriptdata/tourdata/";
var utilities = require('utilities.js');
var find_tier = utilities.find_tier;

var tourwinners, leaderboard, eventleaderboard, tourschan, tourserrchan, tourseeds, eventwinners;


function statInit() {
    tourschan = sys.channelId("Tournaments");
    tourserrchan = sys.channelId("Developer's Den");
    try {
        var winners = sys.getFileContent(dataDir+"winners.txt").split("\n");
        tourwinners = {};
        for (var player in winners) {
            var line = winners[player].split("*");
            var key = line.splice(0, 1);
            var value = line.join("*");
            tourwinners[key] = {};
            var dates = value.split(";;;");
            for (var x in dates) {
                var playerData = dates[x].split(":::");
                tourwinners[key][playerData[0]] = {
                    'tier': playerData[1],
                    'size': playerData[2],
                    'points': parseInt(playerData[3]),
                    'month': playerData[4]
                };
            }
        }
    }
    catch (err) {
        tourwinners = {};
        sendChanAll('No tour winners detected.', tourschan);
    }
    try {
        var winners = sys.getFileContent(dataDir+"eventwinners.txt").split("\n");
        eventwinners = {};
        for (var player in winners) {
            var line = winners[player].split("*");
            var key = line.splice(0, 1);
            var value = line.join("*");
            eventwinners[key] = {};
            var dates = value.split(";;;");
            for (var x in dates) {
                var playerData = dates[x].split(":::");
                eventwinners[key][playerData[0]] = {
                    'tier': playerData[1],
                    'size': playerData[2],
                    'points': parseInt(playerData[3]),
                    'ranking':playerData[4]
                };
            }
        }
    }
    catch (err) {
        eventwinners = {};
        sendChanAll('No event winners detected.', tourschan);
    }
    try {
        var tiers = sys.getFileContent(dataDir+"leaderboard.txt").split("\n");
        leaderboard = {};
        for (var tier in tiers) {
            var line = tiers[tier].split("*");
            var key = line.splice(0, 1);
            var value = line.join("*");
            leaderboard[key] = {};
            var dates = value.split(";;;");
            for (var x in dates) {
                var leaderData = dates[x].split(":::");
                if (!leaderboard[key][leaderData[0]]) {
                    leaderboard[key][leaderData[0]] = {};
                }
                leaderboard[key][leaderData[0]][leaderData[1]] = parseInt(leaderData[2]);
            }
        }
    }
    catch (err) {
        leaderboard = {'general': {}};
        sendChanAll('No leaderboard detected.', tourschan);
    }
    try {
        var players = sys.getFileContent(dataDir+"eventdata.txt").split("\n");
        eventleaderboard = {};
        for (var player in players) {
            var line = players[player].split("*");
            var key = line.splice(0, 1);
            var value = line.join("*");
            eventleaderboard[key] = {};
            var dates = value.split(";;;");
            for (var x in dates) {
                var playerData = dates[x].split(":::");
                eventleaderboard[key][playerData[0]] = parseInt(playerData[1]);
            }
        }
    }
    catch (err) {
        eventleaderboard = {};
        sendChanAll('No event leaderboard detected.', tourschan);
    }
    try {
        var tiers = sys.getFileContent(dataDir+"tourseeds.txt").split("\n");
        tourseeds = {};
        for (var tier in tiers) {
            var line = tiers[tier].split("*");
            var key = line.splice(0, 1);
            var value = line.join("*");
            tourseeds[key] = {};
            var players = value.split(";;;");
            for (var x in players) {
                var playerData = players[x].split(":::");
                tourseeds[key][playerData[0]] = {
                    'points': parseInt(playerData[1]),
                    'lastwin': parseInt(playerData[2])
                };
            }
        }
    }
    catch (err) {
        tourseeds = {};
        sendChanAll('No tour seeds detected.', tourschan);
    }
    sendChanAll('Tournament stats are ready.', tourschan);
}

function saveWinners() {
    sys.writeToFile(dataDir+"winners.txt", "");
    for (var x in tourwinners) {
        var value = [];
        for (var y in tourwinners[x]) {
            var z = tourwinners[x][y];
            value.push(y + ":::" + z.tier + ":::" + z.size + ":::" + z.points + ":::" + z.month);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"winners.txt", x +'*' + value + '\n');
    }
}

function saveEventWinners() {
    sys.writeToFile(dataDir+"eventwinners.txt", "");
    for (var x in eventwinners) {
        var value = [];
        for (var y in eventwinners [x]) {
            var z = eventwinners[x][y];
            value.push(y + ":::" + z.tier + ":::" + z.size + ":::" + z.points + ":::" + z.ranking);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"eventwinners.txt", x +'*' + value + '\n');
    }
}

function saveLeaderboard() {
    sys.writeToFile(dataDir+"leaderboard.txt", "");
    for (var x in leaderboard) {
        var value = [];
        for (var y in leaderboard[x]) {
            for (var z in leaderboard[x][y]) {
                var w = leaderboard[x][y][z];
                value.push(y + ":::" + z + ":::" + w);
            }
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"leaderboard.txt", x +'*' + value + '\n');
    }
}

function saveEventData() {
    sys.writeToFile(dataDir+"eventdata.txt", "");
    for (var x in eventleaderboard) {
        value = [];
        for (var y in eventleaderboard[x]) {
            value.push(y + ":::" + eventleaderboard[x][y]);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"eventdata.txt", x +'*' + value + '\n');
    }
}

function saveTourSeeds() {
    sys.writeToFile(dataDir+"tourseeds.txt", "");
    for (var x in tourseeds) {
        value = [];
        for (var y in tourseeds[x]) {
            var z = tourseeds[x][y];
            value.push(y + ":::" + z.points + ":::" + z.lastwin);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"tourseeds.txt", x +'*' + value + '\n');
    }
}

function saveStats(elements) {
    if (elements == "all") {
        saveWinners();
        saveLeaderboard();
        saveEventData();
        saveTourSeeds();
        saveEventWinners();
    }
    else {
        for (var e in elements) {
            var sfile = elements[e];
            if (sfile == 'winners') {
                saveWinners();
            }
            else if (sfile == 'leaderboard') {
                saveLeaderboard();
            }
            else if (sfile == 'eventleaderboard') {
                saveEventData();
            }
            else if (sfile == 'seeds') {
                saveTourSeeds();
            }
            else if (sfile == 'eventwinners') {
                saveEventWinners();
            }
        }
    }
    return;
}

function conversion() {
    sys.writeToFile(dataDir+"winners.txt", "");
    sys.writeToFile(dataDir+"eventwinners.txt", "");
    sys.writeToFile(dataDir+"leaderboard.txt", "");
    sys.writeToFile(dataDir+"eventdata.txt", "");
    sys.writeToFile(dataDir+"tourseeds.txt", "");
    var value, x, y, z;
    for (x in tourwinners) {
        value = [];
        for (y in tourwinners[x]) {
            z = tourwinners[x][y];
            value.push(y + ":::" + z.tier + ":::" + z.size + ":::" + z.points + ":::" + z.month);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"winners.txt", x +'*' + value + '\n');
    }
    sendBotAll("Successfully created winners.txt", "tachan", false);
    for (x in eventwinners) {
        value = [];
        for (y in eventwinners [x]) {
            z = eventwinners[x][y];
            value.push(y + ":::" + z.tier + ":::" + z.size + ":::" + z.points + ":::" + z.ranking);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"eventwinners.txt", x +'*' + value + '\n');
    }
    sendBotAll("Successfully created eventwinners.txt", "tachan", false);
    for (x in leaderboard) {
        value = [];
        for (y in leaderboard[x]) {
            for (z in leaderboard[x][y]) {
                var w = leaderboard[x][y][z];
                value.push(y + ":::" + z + ":::" + w);
            }
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"leaderboard.txt", x +'*' + value + '\n');
    }
    sendBotAll("Successfully created leaderboard.txt", "tachan", false);
    for (x in eventleaderboard) {
        value = [];
        for (y in eventleaderboard[x]) {
            value.push(y + ":::" + eventleaderboard[x][y]);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"eventdata.txt", x +'*' + value + '\n');
    }
    sendBotAll("Successfully created eventdata.txt", "tachan", false);
    for (x in tourseeds) {
        value = [];
        for (y in tourseeds[x]) {
            z = tourseeds[x][y];
            value.push(y + ":::" + z.points + ":::" + z.lastwin);
        }
        value = value.join(";;;");
        sys.appendToFile(dataDir+"tourseeds.txt", x +'*' + value + '\n');
    }
    sendBotAll("Successfully created tourseeds.txt", "tachan", false);
}

// Utility Functions

function parseTimer(time) {
    if (isNaN(time) || time < 0) {
        return "0:00";
    }
    var minutes = Math.floor(time/60);
    var seconds = time%60;
    if (seconds >= 10) {
        return minutes+":"+seconds;
    }
    else {
        return minutes+":0"+seconds;
    }
}

function toCorrectCase(name) {
    if (isNaN(name) && sys.id(name) !== undefined) {
        return sys.name(sys.id(name));
    }
    else {
        return name;
    }
}

// Converts stuff like dd-mm into actual readable text. Note months go from 0-11
function toDateString(dmstring) {
    var themonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var dmparts = dmstring.split("-",2);
    return dmparts[0] + " " + themonths[parseInt(dmparts[1], 10)];
}

function cmp(x1, x2) {
    if (typeof x1 !== typeof x2) {
        return false;
    }
    else if (typeof x1 === "string") {
        if (x1.toLowerCase() === x2.toLowerCase()) {
            return true;
        }
    }
    else if (x1 === x2) {
        return true;
    }
    else return false;
}

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
        sendChanAll("Error in determining whether "+name+" is a sub, "+err, tourserrchan);
        return false;
    }
}

function isEmptyObject(obj) {
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            return false;
        }
    }
    return true;
}

function sendBotMessage(user, message, chan, html) {
    if (user === undefined) {
        return;
    }
    if (html) {
        if (chan === "all") {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message);
        }
        else {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,chan);
        }
    }
    else {
        if (chan === "all") {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message));
        }
        else {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),chan);
        }
    }
}

// Functions to send bot messages to channels
// "all" sends to every channel, "~mt" sends to main channel and tours, "~st" sends to staff channels and tours.
function sendBotAll(message, chan, html) {
    var staffchan = sys.channelId("Indigo Plateau");
    var tachan = sys.channelId("Victory Road");
    if (html) {
        if (chan === "all") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,-1);
        }
        else if (chan === "~mt") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,tourschan);
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,0);
        }
        else if (chan === "~st") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,tourschan);
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,staffchan);
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,tachan);
        }
        else if (chan === "tachan") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,tachan);
        }
        else {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,chan);
        }
    }
    else {
        if (chan === "all") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),-1);
        }
        else if (chan === "~mt") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),tourschan);
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),0);
        }
        else if (chan === "~st") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),tourschan);
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),staffchan);
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),tachan);
        }
        else if (chan === "tachan") {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,tachan);
        }
        else {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),chan);
        }
    }
}

// End Utility Functions

function addWinner(player, size, tier, date, points, month) {
    if (!tourwinners.hasOwnProperty(player)) {
        tourwinners[player] = {};
    }
    tourwinners[player][date] = {
        'tier': tier,
        'size': size,
        'points': points,
        'month': month
    };
}

function addEventResult(player, size, tier, datestring, ranking, points) {
    if (!eventwinners.hasOwnProperty(player)) {
        eventwinners[player] = {};
    }
    var pscore = eventwinners[player];
    if (pscore.hasOwnProperty(datestring)){
        if (pscore[datestring].points < points) {
            eventwinners[player][datestring] = {
                'tier': tier,
                'size': size,
                'points': points,
                'ranking': ranking
            };
        }
    }
    else {
        eventwinners[player][datestring] = {
            'tier': tier,
            'size': size,
            'points': points,
            'ranking': ranking
        };
    }
}

function awardEventPoints(playername, size, ranking, tier, datestring) {
    var points = detEventPoints(size, ranking, tier);
    if (points <= 0) {
        return;
    }
    if (playername == "~Bye~" || playername == "~DQ~" || isSub(playername)) {
        return;
    }
    if (eventleaderboard.hasOwnProperty(playername)) {
        var pscore = eventleaderboard[playername];
        if (pscore.hasOwnProperty(datestring)){
            if (pscore[datestring] < points) {
                eventleaderboard[playername][datestring] = points;
            }
        }
        else {
            eventleaderboard[playername][datestring] = points;
        }
    }
    else {
        eventleaderboard[playername] = {};
        eventleaderboard[playername][datestring] = points;
    }
    addEventResult(playername, size, tier, datestring, ranking, points);
}

function awardTourPoints(player, size, tier, delim, place) {
    // each tournament has a 'tier'
    // points for 4-7,8-15,16-31,32-63,64-127,128-255,256-511,512 players respectively. Tours with 3 players or less don't score. Double tours score in the higher up bracket
    var tierscore = {
        'a': [1,2,4,8,16,32,64,128], // for individual tiers scroes or high scoring tiers
        'b': [2,4,6,8,10,10,10,10], // default
        'c': [1,2,2,3,4,4,4,4],
        'd': [1,1,2,2,3,3,3,3],
        'e': [0,0,0,1,2,3,5,8],
        'f': [0,0,0,0,1,2,3,5],
        'z': [0,0,0,0,0,0,0,0]
    };
    var now = new Date();
    var capsmonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dateString = now.getUTCDate()+" "+capsmonths[now.getUTCMonth()]+", "+parseTimer(now.getUTCHours()*60+now.getUTCMinutes())+" GMT";
    var month = now.getUTCMonth();
    var scale = 0;
    var points = 0;
    if (size < 4 || !tourconfig.points) {
        if (place == 1) {
            addWinner(player,size,tier,dateString,points,month);
        }
        return;
    }
    for (var x=3;x<12;x++) {
        if (size < Math.pow(2,x)) {
            scale = x-3;
            break;
        }
    }
    if (delim) {
        scale += 1;
    }
    if (scale > 7) {
        scale = 7;
    }
    if (place != 1) {
        scale -= (place*2 - 2);
        if (scale < 0) {
            return;
        }
    }
    var tiers_a = [];
    var tiers_b = []; // default
    var tiers_c = ["Battle Factory", "Battle Factory 6v6", "ORAS 1v1", "Challenge Cup",
                   "Inverted Challenge Cup", "Wifi CC 1v1", "Hackmons Wifi CC 1v1",
                   "Hackmons Challenge Cup", "Hackmons Inverted CC", "Flash Clash"];
    var tiers_d = ["CC 1v1", "Hackmons CC 1v1", "Metronome",
                   "Anything Goes", "Random Battle", "Red/Blue", "Yellow", "Stadium",
                   "Stadium w/ Tradebacks", "Gold/Silver", "Crystal", "Stadium 2",
                   "Ruby/Sapphire", "Colosseum", "Fire Red/Leaf Green", "Emerald", "XD",
                   "Diamond/Pearl", "Platinum", "Heart Gold/Soul Silver", "Black/White",
                   "Black/White 2", "X/Y", "Omega Ruby/Alpha Sapphire", "GBU Singles",
                   "GBU Doubles", "GBU Triples"];
    var tiers_e = [];
    var tiers_f = [];
    var tiers_z = [];
    if (tiers_a.indexOf(tier) != -1) {
        points = tierscore.a[scale];
    }
    else if (tiers_b.indexOf(tier) != -1) {
        points = tierscore.b[scale];
    }
    else if (tiers_c.indexOf(tier) != -1) {
        points = tierscore.c[scale];
    }
    else if (tiers_d.indexOf(tier) != -1) {
        points = tierscore.d[scale];
    }
    else if (tiers_e.indexOf(tier) != -1) {
        points = tierscore.e[scale];
    }
    else if (tiers_f.indexOf(tier) != -1) {
        points = tierscore.f[scale];
    }
    else if (tiers_z.indexOf(tier) != -1) {
        points = tierscore.z[scale];
    }
    else {
        points = tierscore.b[scale];
    }
    if (place == 1) {
        addWinner(player,size,tier,dateString,points,month);
    }
    var scoreboard = leaderboard.general;
    if (!scoreboard.hasOwnProperty(player)) {
        leaderboard.general[player] = {};
        leaderboard.general[player][month] = points;
    }
    else if (!leaderboard.general[player].hasOwnProperty(month)) {
        leaderboard.general[player][month] = points;
    }
    else {
        leaderboard.general[player][month] += points;
    }
    if (!leaderboard.hasOwnProperty(tier)) {
        leaderboard[tier] = {};
    }
    var tierboard = leaderboard[tier];
    var tierpoints = tierscore.a[scale];
    if (!tierboard.hasOwnProperty(player)) {
        leaderboard[tier][player] = {};
        leaderboard[tier][player][month] = tierpoints;
    }
    else if (!leaderboard[tier][player].hasOwnProperty(month)) {
        leaderboard[tier][player][month] = tierpoints;
    }
    else {
        leaderboard[tier][player][month] += tierpoints;
    }
    return;
}

function awardSeedPoints(playername, tier, points) {
    try {
        // don't award any points to placeholders, or 0 points
        if (points <= 0) {
            return;
        }
        if (playername == "~Bye~" || playername == "~DQ~" || isSub(playername)) {
            return;
        }
        if (tourseeds.hasOwnProperty(tier)) {
            var tierinfo = tourseeds[tier];
            if (tierinfo.hasOwnProperty(playername)) {
                tourseeds[tier][playername].points += points;
                tourseeds[tier][playername].lastwin = parseInt(sys.time(), 10);
            }
            else {
                tourseeds[tier][playername] = {'points': points, 'lastwin': parseInt(sys.time(), 10)};
            }
        }
        else {
            tourseeds[tier] = {};
            tourseeds[tier][playername] = {'points': points, 'lastwin': parseInt(sys.time(), 10)};
        }
    }
    catch (err) {
        sendChanAll("Error in seed calculation, "+err, tourserrchan);
    }
}

function detEventPoints(size, ranking, tier) {
    var rank = Math.floor(ranking);
    var mag = Math.floor(Math.log(size)/Math.LN2);
    var tiers = [1,2,3,4,6,8,12,16,24];
    var scale = tiers.indexOf(rank);
    if (scale == -1) {
        return 0;
    }
    else if (["Battle Factory", "Battle Factory 6v6", "ORAS 1v1", "Challenge Cup",
              "Inverted Challenge Cup", "Wifi CC 1v1", "Hackmons Wifi CC 1v1",
              "Hackmons Challenge Cup", "Hackmons Inverted CC", "Flash Clash"].indexOf(tier) > -1) {
        mag -= 1;
    }
    else if (["CC 1v1", "Hackmons CC 1v1", "Metronome",
              "Anything Goes", "Random Battle", "Red/Blue", "Yellow", "Stadium",
              "Stadium w/ Tradebacks", "Gold/Silver", "Crystal", "Stadium 2",
              "Ruby/Sapphire", "Colosseum", "Fire Red/Leaf Green", "Emerald", "XD",
              "Diamond/Pearl", "Platinum", "Heart Gold/Soul Silver", "Black/White",
              "Black/White 2", "X/Y", "Omega Ruby/Alpha Sapphire", "GBU Singles",
              "GBU Doubles", "GBU Triples"].indexOf(tier) > -1) {
        mag -= 2;
    }
    if (mag < 2) {
        return 0;
    }
    var scorearr = [0];
    switch (mag) {
        case 2:
            scorearr = [1];
            break;
        case 3:
            scorearr = [2,1];
            break;
        case 4:
            scorearr = [4,2,1];
            break;
        case 5:
            scorearr = [7,3,2,1];
            break;
        case 6:
            scorearr = [11,5,3,2,1];
            break;
        case 7:
            scorearr = [16,8,5,4,2,1];
            break;
        case 8:
            scorearr = [22,11,7,5,3,2,1];
            break;
        case 9:
            scorearr = [29,14,9,7,4,3,2,1];
            break;
        case 10:
            scorearr = [37,18,12,9,6,4,3,2,1];
            break;
    }
    if (scale < scorearr.length) {
        return scorearr[scale];
    }
    else {
        return 0;
    }
}

/* This uses 3 factors
decayrate: % that a user's seed ranking is decayed by
decaytime: number of days before decay is applied since winning/placing
decayglobalrate: % of the total of all seed rankings, that will be deducted from all decaying users
*/
function seedDecay(tier) {
    try {
        if (!tourseeds.hasOwnProperty(tier)) {
            return;
        }
        var tierdecay = tourseeds[tier];
        var totalpoints = 0;
        for (var t in tierdecay) {
            totalpoints += tourseeds[tier][t].points;
        }
        var totaldecay = Math.floor(totalpoints*tourconfig.decayglobalrate/100); // this will be an integer
        for (var x in tierdecay) {
            if (parseInt(sys.time(), 10)-tierdecay[x].lastwin > tourconfig.decaytime*24*60*60) {
                tourseeds[tier][x].lastwin += tourconfig.decaytime*24*60*60; // add decay time back on
                var newpoints = (Math.floor(tierdecay[x].points*(100-tourconfig.decayrate)/10)/10)-totaldecay; // to 1dp
                if (newpoints <= 0) {
                    delete tourseeds[tier][x];
                }
                else {
                    tourseeds[tier][x].points = newpoints;
                }
            }
        }
    }
    catch (err) {
        sendChanAll("Error in rank decay, "+err, tourserrchan);
    }
}

// Gets the top seed
function topSeed(tier) {
    try {
        if (!tourseeds.hasOwnProperty(tier)) {
            return "~Pokemon Online~";
        }
        var tierseeds = tourseeds[tier];
        var leader = ["~Pokemon Online~", 0];
        for (var x in tierseeds) {
            if (tierseeds[x].points > leader[1]) {
                leader = [x, tierseeds[x].points];
            }
        }
        return toCorrectCase(leader[0]);
    }
    catch (err) {
        sendChanAll("Error in determining top seed, "+err, tourserrchan);
        return "~Pokemon Online~";
    }
}

// This function gets the tier points
function getExtraPoints(player, tier) {
    var data;
    if (!leaderboard.hasOwnProperty(tier)) {
        return 0;
    }
    else {
        data = leaderboard[tier];
    }
    var score = 0;
    for (var n in data) {
        if (player.toLowerCase() === n) {
            score = data[n];
            break;
        }
    }
    return score;
}

// This function will get a user's current seed points in a tier
function getExtraTierPoints(player, tier) {
    var score = 0;
    if (tourseeds.hasOwnProperty(tier)) {
        var tierinfo = tourseeds[tier];
        if (tierinfo.hasOwnProperty(player)) {
            return tierinfo[player].points;
        }
    }
    return score;
}

// Leaderboard
function getLeaderBoard(src, tier, full, month) {
    var rankdata, tourtier;
    try {
        if (tier === "") {
            rankdata = leaderboard.general;
        }
        else {
            tourtier = find_tier(tier);
            if (tourtier === null) {
                throw ("Not a valid tier");
            }
            rankdata = leaderboard[tourtier];
        }
        if (rankdata === undefined) {
            throw ("No data");
        }
        var list = [];
        for (var p in rankdata) {
            var userscores = rankdata[p];
            var totalscore = 0;
            for (var j in userscores) {
                if (month == "all") {
                    totalscore += userscores[j];
                }
                else if (j == month) {
                    totalscore += userscores[j];
                }
            }
            if (totalscore > 0) {
                list.push([totalscore, p]);
            }
        }
        list.sort(function(a,b) { return b[0] - a[0] ; });
        sys.sendMessage(src, "*** TOURNAMENT RANKINGS "+(tier !== "" ? "("+tourtier+") " : "")+"***",tourschan);
        var ownnameprinted = false;
        var rankkey = [0, 0]; // rank, points
        for (var x=0; x<65536; x++) {
            if (x >= list.length) break;
            if (rankkey[0] <= 10 || cmp((list[x])[1], sys.name(src)) || full) {
                if (rankkey[1] === parseInt((list[x])[0], 10)) {
                    sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan);
                }
                else {
                    sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan);
                    rankkey = [x+1, parseInt((list[x])[0], 10)];
                }
                if (cmp((list[x])[1], sys.name(src))) {
                    ownnameprinted = true;
                }
            }
            if (ownnameprinted && rankkey[0]>10 && !full) break;
        }
    }
    catch (err) {
        if (err == "Not a valid tier") {
            sendBotMessage(src, tier+" is not a valid tier!",tourschan, false);
        }
        else if (err == "No data") {
            sendBotMessage(src, "No data exists yet!",tourschan, false);
        }
        else {
            throw(err);
        }
    }
}

// Tourinfo
function getWinners(name) {
    if (!tourwinners.hasOwnProperty(name)) {
        return "";
    }
    else {
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="4"><center><strong> Tournament Details for ' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>Date</th><th>Tier</th><th># Players</th><th>Points</th></tr>';
        var table_footer = '</table>';
        var table = table_header;
        var line;
        var send_rows = 0;
        var rankkey = [0, 0]; // rank, points
        var tmp = [];
        var windata = tourwinners[name];
        var totalpoints = 0;
        for (var x in windata) {
            tmp.push({'date': x, 'tier': windata[x].tier, 'size': windata[x].size, 'points': windata[x].points});
            totalpoints += windata[x].points;
        }
        while(tmp.length > 0) {
            line = '<tr><td>'+tmp[0].date+'</td><td>'+tmp[0].tier+'</td><td>'+tmp[0].size+'</td><td align="right">'+tmp[0].points+'</td></tr>';
            tmp.splice(0,1);
            table += line;
            ++send_rows;
        }
        table += '<tr><td></td><td></td><td><b>Total</b></td><td align="right">'+totalpoints+'</td></tr>';
        table += table_footer;
        if (send_rows > 0) {
            return table;
        }
        else {
            return "";
        }
    }
}

function getEventLeaderboard(src, full, month) {
    try {
        var rankings = eventleaderboard;
        var list = [];
        var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        var now = new Date();
        var thismonth = now.getUTCMonth();
        var mindex = months.indexOf(month.toLowerCase());
        if (mindex != -1) {
            thismonth = mindex;
        }
        for (var p in rankings) {
            var pdata = rankings[p];
            var cscore = 0;
            for (var h in pdata) {
                var dstring = h.split("-",2);
                if (parseInt(dstring[1], 10) != thismonth) {
                    continue;
                }
                if (typeof pdata[h] == "number" && pdata[h] > 0) {
                    cscore += pdata[h];
                }
            }
            list.push([cscore,p]);
        }
        list.sort(function(a,b) { return b[0] - a[0] ; });
        sys.sendMessage(src, "*** EVENT RANKINGS "+(month !== "" ? "("+month+") " : "")+"***",tourschan);
        var ownnameprinted = false;
        var rankkey = [0, 0]; // rank, points
        for (var x=0; x<65536; x++) {
            if (x >= list.length || (ownnameprinted && rankkey[0]>10)) break;
            if (rankkey[0] <= 10 && list[x][0] > 0|| cmp((list[x])[1], sys.name(src))) {
                if (rankkey[1] === parseInt((list[x])[0], 10)) {
                    sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan);
                }
                else {
                    sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan);
                    rankkey = [x+1, parseInt((list[x])[0], 10)];
                }
                if (cmp((list[x])[1], sys.name(src))) {
                    ownnameprinted = true;
                }
            }
        }
    }
    catch (err) {
        if (err == "No data") {
            sendBotMessage(src, "No event tournament data exists!",tourschan, false);
        }
        else {
            throw(err);
        }
    }
}

// Tourinfo
function getEventWinners(name) {
    if (!eventwinners.hasOwnProperty(name)) {
        return "";
    }
    else {
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="5"><center><strong> Event Results for ' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>Date</th><th>Tier</th><th># Players</th><th>Points</th><th>Ranking</th></tr>';
        var table_footer = '</table>';
        var table = table_header;
        var line;
        var send_rows = 0;
        var rankkey = [0, 0]; // rank, points
        var tmp = [];
        var windata = eventwinners[name];
        for (var x in windata) {
            tmp.push({'date': x, 'tier': windata[x].tier, 'size': windata[x].size, 'points': windata[x].points, 'ranking': windata[x].ranking});
        }
        while(tmp.length > 0) {
            line = '<tr><td>'+toDateString(tmp[0].date)+'</td><td>'+tmp[0].tier+'</td><td>'+tmp[0].size+'</td><td>'+tmp[0].points+'</td><td>#'+tmp[0].ranking+'</td></tr>';
            tmp.splice(0,1);
            table += line;
            ++send_rows;
        }
        table += table_footer;
        if (send_rows > 0) {
            return table;
        }
        else {
            return "";
        }
    }
}

function clearRankings(month) {
    if (!month) {
        return false;
    }
    if (month == "all") {
        tourwinners = {};
        leaderboard = {'general': {}};
    }
    else {
        for (var x in tourwinners) {
            var playerwins = tourwinners[x];
            for (var y in playerwins) {
                var datewins = playerwins[y];
                if (datewins.month === month) {
                    delete tourwinners[x][y];
                    continue;
                }
            }
            if (isEmptyObject(tourwinners[x])) {
                delete tourwinners[x];
                continue;
            }
        }
        for (var a in leaderboard) {
            var tierwins = leaderboard[a];
            for (var b in tierwins) {
                var pscores = tierwins[b];
                for (var c in pscores) {
                    if (c == month) {
                        delete leaderboard[a][b][c];
                        continue;
                    }
                }
                if (isEmptyObject(leaderboard[a][b])) {
                    delete leaderboard[a][b];
                    continue;
                }
            }
            if (isEmptyObject(leaderboard[a])) {
                delete leaderboard[a];
                continue;
            }
        }
    }
    saveStats(['winners', 'leaderboard']);
    return true;
}

function clearEventRankings(month) {
    if (!month) {
        return false;
    }
    if (month == "all") {
        eventwinners = {};
        eventleaderboard = {};
    }
    else {
        for (var x in eventwinners) {
            var playerwins = eventwinners[x];
            for (var y in playerwins) {
                var dstring = y.split("-",2);
                if (parseInt(dstring[1], 10) === month) {
                    delete eventwinners[x][y];
                    continue;
                }
            }
            if (isEmptyObject(eventwinners[x])) {
                delete eventwinners[x];
                continue;
            }
        }
        for (var a in eventleaderboard) {
            var pwins = eventleaderboard[a];
            for (var b in pwins) {
                var dstring2 = b.split("-",2);
                if (parseInt(dstring2[1], 10) === month) {
                    delete eventleaderboard[a][b];
                    continue;
                }
            }
            if (isEmptyObject(eventleaderboard[a])) {
                delete eventleaderboard[a];
                continue;
            }
        }
    }
    saveStats(['eventwinners', 'eventleaderboard']);
    return true;
}

// Imports from old txt files, but loses some compatibility
function importOld() {
    // details
    var tdetails = sys.getFileContent(dataDir+"tourdetails.txt");
    var detaillist = tdetails.split("\n");
    for (var t in detaillist) {
        var parts = detaillist[t].split(":::");
        if (parts.length != 4) {
            continue;
        }
        var capsmonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var monthstr = parts[3].split(" ");
        var tmonth = (monthstr[1]).substr(0,3);
        addWinner(parts[0], parseInt(parts[1], 10), parts[2], parts[3], "Unknown", capsmonths.indexOf(tmonth));
    }
    var scoredetails = sys.getFileContent(dataDir+"tourscores.txt");
    var scorelist = scoredetails.split("\n");
    var mscoredetails = sys.getFileContent(dataDir+"tourmonthscore_november_2012.txt");
    var mscorelist;
    if (mscoredetails !== undefined) {
        mscorelist = mscoredetails.split("\n");
    }
    else {
        mscorelist = [];
    }
    var monthscores = {};
    for (var m in mscorelist) {
        var mparts = mscorelist[m].split(":::");
        if (mparts.length != 2) {
            continue;
        }
        monthscores[mparts[0]] = parseInt(mparts[1], 10);
    }
    for (var j in scorelist) {
        var sparts = scorelist[j].split(":::");
        if (sparts.length != 2) {
            continue;
        }
        var sname = sparts[0];
        leaderboard.general[sname] = {};
        var lastmonth = parseInt(sparts[1], 10);
        var thismonth = 0;
        if (monthscores.hasOwnProperty(sname)) {
            thismonth = monthscores[sname];
            lastmonth -= thismonth;
        }
        leaderboard.general[sname]['10'] = thismonth;
        leaderboard.general[sname]['9'] = lastmonth;
    }
    // Final thing: Import tier scores:
    var tiers = sys.getTierList();
    for (var x in tiers) {
        var scorefile = sys.getFileContent(dataDir+"tourscores_"+tiers[x].replace(/ /g,"_").replace(/\//g,"-slash-")+".txt");
        if (scorefile === undefined) continue;
        var tscorelist = scorefile.split("\n");
        for (var n in tscorelist) {
            var tparts = tscorelist[n].split(":::");
            if (tparts.length != 2) {
                continue;
            }
            var tname = tparts[0];
            leaderboard[tiers[x]] = {};
            leaderboard[tiers[x]][tname] = {};
            leaderboard[tiers[x]][tname]['10'] = parseInt(tparts[1], 10);
        }
    }
    saveStats("all");
    return true;
}

module.exports = {
    init: function() {
        try {
            statInit();
        }
        catch (err) {
            sendChanAll("Error in event 'init': "+err, tourserrchan);
        }
    },
    savestats: function (elements) {
        saveStats(elements);
    },
    rankings: function(src, tier, full, month) {
        getLeaderBoard(src, tier, full, month);
    },
    erankings: function(src, full, month) {
        getEventLeaderboard(src, full, month);
    },
    topseed: function(tier) {
        return topSeed(tier);
    },
    seedpoints: function(player, tier) {
        return getExtraTierPoints(player, tier);
    },
    tierpoints: function(player, tier) {
        return getExtraPoints(player, tier);
    },
    decay: function (tier) {
        seedDecay(tier);
    },
    addeventpoints: function (playername, size, ranking, tier, datestring) {
        awardEventPoints(playername, size, ranking, tier, datestring);
    },
    addtourpoints: function (player, size, tier, delim, place) {
        awardTourPoints(player, size, tier, delim, place);
    },
    addseedpoints: function (playername, tier, points) {
        awardSeedPoints(playername, tier, points);
    },
    getseeds: function () {
        return tourseeds;
    },
    clearrank: function (month) {
        return clearRankings(month);
    },
    cleareventrank: function (month) {
        return clearEventRankings(month);
    },
    getwinners: function (name) {
        return getWinners(name);
    },
    geteventwinners: function (name) {
        return getEventWinners(name);
    },
    importold: function () {
        return importOld();
    },
    converttours: function() {
        conversion();
    }
};
