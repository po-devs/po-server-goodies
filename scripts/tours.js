/*
Code for tours.js
Original coding by Shadowfist 2012
Maintenance by PO Scripters 2013

Files used: tourscores.txt, eventscores.txt, tourscores_tier.txt, tourwinverbs.txt, tourconfig.txt, eventtours.json,
tourdetails.txt, eventwinners.txt, eventplayers.txt, tourmonthscore_month.txt, tourmutes.txt,
touradmins.json, tastats.json, tourseeds.json, tourhistory.json, tours_cache.json, tourwarns.json
*/

/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global print, script, sys, SESSION, sendChanAll, sendChanHtmlAll, require, Config, module*/

if (typeof tourschan !== "string") {
    tourschan = sys.channelId("Tournaments");
}

if (typeof tourserrchan !== "string") {
    tourserrchan = sys.channelId("Indigo Plateau");
}

if (typeof tours !== "object") {
    try {
        load_cache();
        sendChanAll("Loaded cached tournament object", tourschan);
    }
    catch (e) {
        sendChanAll("Creating new tournament object", tourschan);
        tours = {"queue": [], "globaltime": -1, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": {}, "subscriptions": {}, "activetas": [], "activehistory": [], "tourmutes": {}, "metrics": {}, "eventticks": -1, "working": true};
    }
    var refresh = true;
    for (var x in tours.tour) {
        if (tours.tour[x].event) {
            refresh = false;
        }
    }
    if (refresh) {
        refreshTicks(true);
    }
}

var configDir = "tourconfig/";
var dataDir = "tourdata/";
var utilities = require('utilities.js');
var tstats = require("newtourstats.js");
var border = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:";
var htmlborder = "<font color=#3DAA68><b>"+border+"</b></font>";
var blueborder = "<font color=#0044BB><b>"+border+"</b></font>";
var flashtag = "<!--f-->"; // This is used to check for flashes in the html code
// Event tournaments highlighted in red
var redborder = "<font color=#FF0000><b>"+border+"</b></font>";
var redhtmlborder = "<font color=#FF0000><timestamp/> <b>"+border+"</b></font>";
var tourcommands = ["join: joins a tournament",
                    "unjoin: unjoins a tournament during signups only",
                    "queue: lists upcoming tournaments",
                    "viewround: views current round",
                    "iom: views list of ongoing matches",
                    "ipm: views list of matches yet to start",
                    "history: views recently played tiers",
                    "touradmins: lists all users that can start tournaments",
                    "leaderboard [tier]: shows tournament rankings, tier is optional",
                    "eventleaderboard [month]: shows the event leaderboard (month is optional)",
                    "monthlyleaderboard [month]: shows tour rankings for the current month",
                    "tourinfo [name]: gives information on a person's recent tour wins",
                    "eventinfo [name]: gives information on a person's recent event wins",
                    "viewstats: views tournament stats",
                    "viewseeds [tier]: views seed rankings for that tier",
                    "activeta: lists active tournament admins",
                    "rules: lists the tournament rules",
                    "touralerts [on/off]: Turn on/off your tour alerts (Shows list of Tour Alerts if on/off isn't specified)",
                    "addtouralert [tier] : Adds a tour alert for the specified tier",
                    "removetouralert [tier] : Removes a tour alert for the specified tier"];
var tourmodcommands = ["*** Parameter Information ***",
                    "Parameters can be used by putting 'gen=x'; 'mode=singles/doubles/triples'; 'type=single/double'; 'wifi=on/off'.",
                    "For example '/tour Challenge Cup:gen=RBY:mode=triples:type=double:wifi=on' starts a RBY Challenge Cup double elimination tournament (in Triples mode) with Team Preview.",
                    "tour [tier]:[parameters]: starts a tier of that tournament.",
                    "tourmute [player]:[reason]:[time]: tourmutes a problematic player.",
                    "tourunmute [player]: untourmutes a player.",
                    "tourmutes: list tour mutes.",
                    "changecount [number]: changed the number of players for an event tournament",
                    "endtour [tour]: ends the tour of that tier",
                    "sub [newname]:[oldname]: subs newname for oldname",
                    "dq [player]: disqualifies a player",
                    "remove [tour/number]: removes a tournament from the queue. If a number is put in, it will remove the tour in the queue with the corresponding number. If a tier is put in, it will remove the tournament of that tier (starting from the back)",
                    "cancelbattle [name]: cancels that player's current battle",
                    "config: shows config settings",
                    "start: starts next tournament in the queue immediately (use sparingly)",
                    "viewstaffstats [name]: views tournament staff stats for a user",
                    "configset [var]:[value]: changes config settings",
                    "passta [name]: passes your tour admin to a new name"];
var touradmincommands = ["tourstart [tier]:[parameters]: starts a tier of that tournament immediately, provided one is not in signups.",
                    "shift [tier]:[parameters]: places a tournament in the front of the queue",
                    "megauser / tadmin[s] [name]: makes someone a megauser - s makes it only show in staff chan",
                    "megauseroff / tdeadmin[s] [name]: fires someone from being tournament authority - s makes it only show in staff chan",
                    "forcestart: ends signups immediately and starts the first round",
                    "push [player]: pushes a player into a tournament in signups (DON'T USE UNLESS ASKED)",
                    "tahistory [days]: views the activity of tour admins (days is optional, if excluded it will get the last 7 days if possible)",
                    "updatewinmessages: updates win messages from the web",
                    "stopautostart: if there are no tournaments running, this will stop new ones from being automatically started by the server until another one is started manually."];
var tourownercommands = ["tsadmin[s] [name]: makes someone a tournament admin - s makes it only show in staff chan",
                    "clearrankings [all/month]: clears the tour rankings, 'all' clears all history, [month] will only clear a particular month (eg /clearrankings January)",
                    "addrangewarning [ip range]: adds a range warning",
                    "removerangewarning [ip range]: removes a range warning",
                    "rangewarns: checks the current range warnings",
                    "evalvars: checks the current variable list for tours",
                    "resettours: resets the entire tournament system in the event of a critical failure",
                    "starttours: reverts effect of /stoptours",
                    "stoptours: stops the tournament system for maintenance",
                    "fullleaderboard [tier]: gives the full leaderboard",
                    "loadevents: load event tours"];
var tourrules = ["*** TOURNAMENT GUIDELINES ***",
                "Breaking the following rules may result in punishment:",
                "#1: Team revealing or scouting in tiers other than CC, Battle Factory or Metronome will result in disqualification.",
                "- Scouting is watching the battle of someone else in the tournament to gain information.",
                "- Team revealing is revealing any information about other entrants' teams.",
                "- Players are always permitted to watch the final match of any tournament.",
                "#2: Have a team and be ready when you join, otherwise you can be disqualified",
                "#3: Tierspamming, repeatedly asking for tournaments in the chat, is not allowed.",
                "#4: Do not abuse the tournament commands.",
                "#5: Do not leave or forfeit in a tournament you are in just so you can join another or to give your opponent a 'free' win.",
                "#6: Do not timestall (i.e. deliberately wait until timeout).",
                "#7: Inactive/Idle players will automatically be disqualified.",
                "- Post a message and make sure you are not idle, otherwise you risk being disqualified.",
                "#8: If there is a problem with your match, contact a megauser as soon as possible.",
                "- Deliberately drawing your matches using the Suggest Draw button is not permitted unless you have permission from a megauser to restart.",
                "- Your team is expected to be ready before the match starts - loading the wrong team is not a valid reason to restart.",
                "#9: Ask someone on the /activeta list if you need help or have problems.",
                "#10: Event tournaments (marked by red borders)",
                "- Be aware that these are all double elimination. Breaking or attempting to break the above rules will result in immediate disqualification.",
                "#11: Respecting other players, sportsmanship and integrity:",
                "- Avoid complaining about hax, luck or other such things as much as possible.",
                "- Avoid making inflammatory remarks/taunts towards other users - treat other users the way you would like to be treated.",
                "- Any deliberate attempt to undermine the integrity of tournaments will result in a permanent ban from tournaments.",
                "#12: Do not join multiple tours even if you are using a different alt.",
                "#13: Do not attempt to circumvent the rules",
                "- Attempting to circumvent the rules through trickery, proxy or other such methods will be punished."];

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
        else {
            sendChanHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),chan);
        }
    }
}

// Bot forwarding, for data sending
function sendBotData(message, user, html) {
    if (!sys.isInChannel(user, tourschan)) {
        return;
    }
    if (message === "") {
        return;
    }
    if (html) {
        sys.sendHtmlMessage(user, message, tourschan);
    }
    else {
        sys.sendMessage(user, "TOURSBOT: "+message, tourschan);
    }
}

// for sending to the bot
function getReadableList(type, parameter) {
    try {
        var name = "";
        var list = [];
        if (type == "leaderboard") {
            var rankdata;
            if (parameter === "") {
                rankdata = sys.getFileContent(dataDir+"tourscores.txt");
                name = "General Leaderboard";
            }
            else if (parameter == "eventscores") {
                rankdata = sys.getFileContent(dataDir+"eventscores.txt");
                name = "Event Leaderboard";
            }
            else {
                var tourtier = find_tier(parameter);
                if (tourtier === null) {
                    throw ("Not a valid tier");
                }
                rankdata = sys.getFileContent(dataDir+"tourscores_"+tourtier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt");
                name = tourtier+" Leaderboard";
            }
            if (rankdata === undefined) {
                throw ("No data");
            }
            var rankings = rankdata.split("\n");
            for (var p in rankings) {
                if (rankings[p] === "") continue;
                var rankingdata = rankings[p].split(":::",2);
                if (rankingdata[1] < 1) continue;
                list.push([rankingdata[0], rankingdata[1]]);
            }
            list.sort(function(a,b) { return b[1] - a[1] ; });
        }
        else {
            return "";
        }
        var width=3;
        var max_message_length = 30000;

        // generate HTML
        var table_header = '<table border="1" cellpadding="5" cellspacing="0"><tr><td colspan="' + width + '"><center><strong>' + utilities.html_escape(name) + '</strong></center></td></tr><tr><th>Ranking</th><th>Name</th><th>Points</th></tr>';
        var table_footer = '</table>';
        var table = table_header;
        var line;
        var send_rows = 0;
        var rankkey = [0, 0]; // rank, points
        var tmp = list;
        while(tmp.length > 0) {
            if (rankkey[1] === parseInt((tmp[0])[1], 10)) {
                line = '<tr><td>#'+rankkey[0]+'</td><td>'+tmp[0].join('</td><td>')+'</td></tr>';
            }
            else {
                line = '<tr><td>#'+(send_rows+1)+'</td><td>'+tmp[0].join('</td><td>')+'</td></tr>';
                rankkey = [send_rows+1, parseInt((tmp[0])[1], 10)];
            }
            tmp.splice(0,1);
            if (table.length + line.length + table_footer.length > max_message_length) {
                break;
            }
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
    catch (e) {
        return "ERROR: "+e;
    }
}

// Debug Messages
function sendDebugMessage(message, chan) {
    if (chan === tourschan && typeof tourconfig.debug == "string" && sys.existChannel(sys.channel(tourserrchan))) {
        if (sys.id(tourconfig.debug) !== undefined && sys.isInChannel(sys.id(tourconfig.debug), tourserrchan))
            sendBotMessage(sys.id(tourconfig.debug),message,tourserrchan,false);
    }
}

// Tour Admin Activity
function addTourActivity(src) {
    if (tours.activetas.indexOf(sys.name(src).toLowerCase()) == -1) {
        tours.activetas.push(sys.name(src).toLowerCase());
    }
}

// Will escape "&", ">", and "<" symbols for HTML output.
html_escape = utilities.html_escape;

// Channel function
getChan = utilities.get_or_create_channel;

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

function getFullTourName(key) {
    var mode = tours.tour[key].parameters.mode;
    var type = tours.tour[key].tourtype;
    var wifi = tours.tour[key].parameters.wifi;
    var isEvent = tours.tour[key].event;
    var ret = type;
    if (tours.tour[key].parameters.gen != "default") {
        ret = getSubgen(tours.tour[key].parameters.gen,true) + " " + ret;
    }
    if ((sys.getClauses(type)%256 >= 128 && wifi === false) || (sys.getClauses(type)%256 < 128 && wifi === true)) {
        ret = ret + " " + (wifi ? "Preview" : "No Preview");
    }
    if (mode != modeOfTier(type)) {
        ret = ret + " ["+mode+"]";
    }
    if (isEvent) {
        ret = ret + " Event";
    }
    return ret;
}

// Finds a tier
find_tier = utilities.find_tier;

function modeOfTier(tier) {
    if (tier.indexOf("Doubles") != -1 || ["JAA", "VGC 2009", "VGC 2010", "VGC 2011", "VGC 2012", "VGC 2013"].indexOf(tier) != -1) {
        return "Doubles";
    }
    else if (tier.indexOf("Triples") != -1) {
        return "Triples";
    }
    return "Singles";
}

/* Gets subgen. Name is data being converted, getLongName is a boolean value.
If getLongName is true it will convert to the readable format, otherwise it will return the short format
Returns false if not found */
function getSubgen(name, getLongName) {
    var subgens = {
        "Red/Blue": "1-0",
        "RB": "1-0",
        "Yellow": "1-1",
        "RBY": "1-1",
        "RBY Stadium": "1-2",
        "Stadium": "1-2",
        "RBY Tradebacks": "1-3",
        "Gold/Silver": "2-0",
        "GS": "2-0",
        "Crystal": "2-1",
        "GSC": "2-1",
        "GSC Stadium": "2-2",
        "Stadium 2": "2-2",
        "Stadium2": "2-2",
        "Ruby/Sapphire": "3-0",
        "RS": "3-0",
        "Colosseum": "3-1",
        "FireRed/LeafGreen": "3-2",
        "FRLG": "3-2",
        "RSE": "3-3",
        "Emerald": "3-3",
        "XD": "3-4",
        "Diamond/Pearl": "4-0",
        "DP": "4-0",
        "Platinum": "4-1",
        "DPPt": "4-1",
        "HeartGold/SoulSilver": "4-2",
        "HGSS": "4-2",
        "Black/White": "5-0",
        "BW": "5-0",
        "Black/White 2": "5-1",
        "BW2": "5-1",
        "1": "1-3",
        "2": "2-2",
        "3": "3-4",
        "4": "4-2",
        "5": "5-1"
    };
    if (getLongName) {
        for (var x in subgens) {
            if (cmp(name,subgens[x])) {
                return x;
            }
        }
    }
    else {
        for (var y in subgens) {
            if (cmp(name,y)) {
                return subgens[y];
            }
        }
    }
    return false;
}

// handles time and outputs in d/h/m/s format
// eg 3d 5h 16m 22s
function converttoseconds(string) {
    var tmp = string.split(" ");
    var totaltime = 0;
    try {
        for (var n in tmp) {
            var thestring = tmp[n];
            var lastchar = thestring.charAt(thestring.length - 1).toLowerCase();
            var timestring = parseInt(thestring.substr(0, thestring.length - 1), 10);
            if (isNaN(timestring)) {
                continue;
            }
            else if (lastchar == "d") {
                totaltime += 24*60*60*timestring;
            }
            else if (lastchar == "h") {
                totaltime += 60*60*timestring;
            }
            else if (lastchar == "m") {
                totaltime += 60*timestring;
            }
            else if (lastchar == "s") {
                totaltime += timestring;
            }
            else {
                continue;
            }
        }
    }
    catch (err) {
        return "Not a number";
    }
    return totaltime;
}

// handles time and outputs in d/h/m/s format
function time_handle(time) { //time in seconds
    var day = 60*60*24;
    var hour = 60*60;
    var minute = 60;
    if (time <= 0) {
        return "No time remaining.";
    }
    var timedays = parseInt(time/day, 10);
    var timehours = (parseInt(time/hour, 10))%24;
    var timemins = (parseInt(time/minute, 10))%60;
    var timesecs = (parseInt(time, 10))%60;
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

// Tournaments

// 1v1 tiers have shorter notification times.
function is1v1Tour(key) {
    if ((tours.tour[key].tourtype).indexOf("1v1") != -1) {
        return true;
    }
    else return false;
}

// This function will get a user's current tournament points overall

function getTourWinMessages() {
    var content = sys.getFileContent(configDir+"tourwinverbs.txt");
    tourwinmessages = content.split("\n");
}

function detSeedPoints(size, ranking) {
    var rank = Math.floor(Math.log(size)/Math.LN2)-Math.floor(ranking);
    if (rank < 0) {
        return 0;
    }
    return Math.pow(2,rank);
}

// This function gets the tier points
function getExtraPoints(player, tier) {
    return tstats.tierpoints(player, tier);
}

// This function will get a user's current seed points in a tier
function getExtraTierPoints(player, tier) {
    return tstats.seedpoints(player, tier);
}

// saving tour admins list
function saveTourKeys() {
    var tal = JSON.stringify(tours.touradmins);
    sys.writeToFile(configDir+"touradmins.json", tal);
    return;
}

function saveTourHistory() {
    var history = {'tours': tours.history, 'staff': tours.activehistory};
    sys.writeToFile(dataDir+"tourhistory.json", JSON.stringify(history));
    return;
}

// This function will get a tier's clauses in readable format
function getTourClauses(key) {
    // force Self-KO clause
    var tier = tours.tour[key].tourtype;
    var tierclauses = sys.getClauses(tier) > 255 ? sys.getClauses(tier) : sys.getClauses(tier)+256;
    if (tours.tour[key].parameters.wifi && tierclauses%256 < 128) {
        tierclauses += 128;
    }
    else if (!tours.tour[key].parameters.wifi && tierclauses%256 >= 128) {
        tierclauses -= 128;
    }
    var clauselist = ["Sleep Clause", "Freeze Clause", "Disallow Spects", "Item Clause", "Challenge Cup", "No Timeout", "Species Clause", "Wifi Battle", "Self-KO Clause"];
    var neededclauses = [];
    for (var c=0;c<9;c++) {
        var denom = Math.pow(2,c+1);
        var num = Math.pow(2,c);
        if (tierclauses%denom >= num) {
            neededclauses.push(clauselist[c]);
        }
    }
    return neededclauses.join(", ");
}

function clauseCheck(key, issuedClauses) {
    var tier = tours.tour[key].tourtype;
    // force Self-KO clause every time
    var requiredClauses = sys.getClauses(tier) > 255 ? sys.getClauses(tier) : sys.getClauses(tier)+256;
    if (tours.tour[key].parameters.wifi === true && requiredClauses%256 < 128) {
        requiredClauses += 128;
    }
    else if (tours.tour[key].parameters.wifi === false && requiredClauses%256 >= 128) {
        requiredClauses -= 128;
    }
    var clauselist = ["Sleep Clause", "Freeze Clause", "Disallow Spects", "Item Clause", "Challenge Cup", "No Timeout", "Species Clause", "Wifi Battle", "Self-KO Clause"];
    var clause1 = false;
    var clause2 = false;
    var missing = [];
    var extra = [];
    for (var c=0;c<9;c++) {
        var denom = Math.pow(2,c+1);
        var num = Math.pow(2,c);
        // don't check for disallow spects in non CC tiers , it's checked manually
        if (c == 2 && ["Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Battle Factory", "Battle Factory 6v6"].indexOf(tier) == -1) {
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
            sendBotAll("Broken clausecheck...", tourserrchan, false);
            break;
        }
    }
    return {"missing": missing, "extra": extra};
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
        sendChanAll("Error in determining whether "+name+" is a sub, "+err, tourserrchan);
        return false;
    }
}

function battlesLeft(key) {
    if (!tours.tour.hasOwnProperty(key)) {
        return NaN;
    }
    else {
        return parseInt(tours.tour[key].players.length/2, 10)-tours.tour[key].winners.length;
    }
}

// Sends a message to all tour auth and players in the current tour
function sendAuthPlayers(message,key) {
    for (var x in sys.playersOfChannel(tourschan)) {
        var arr = sys.playersOfChannel(tourschan);
        if (isTourAdmin(arr[x]) || tours.tour[key].players.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
            var newmessage = message;
            var htmlname = html_escape(sys.name(arr[x]));
            var regex = flashtag+htmlname+flashtag;
            var newregex1 = "<font style='BACKGROUND-COLOR: #FFBB00'>"+htmlname+"</font><ping/>";
            var flashregex = new RegExp(flashtag,"g");
            newmessage = message.replace(regex,newregex1).replace(flashregex,"");
            sendBotMessage(arr[x], newmessage, tourschan, true);
        }
    }
}

// Sends a html  message to all tour auth and players that participated in the current tour
function sendHtmlAuthPlayers(message,key) {
    var arr = sys.playersOfChannel(tourschan);
    for (var x in arr) {
        if (isTourAdmin(arr[x]) || tours.tour[key].seeds.indexOf(sys.name(arr[x]).toLowerCase()) != -1 || tours.tour[key].players.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
            // send highlighted name in bracket
            var htmlname = html_escape(sys.name(arr[x]));
            var regex = flashtag+htmlname+flashtag;
            var newregex1 = "<font style='BACKGROUND-COLOR: #FFAAFF'>"+htmlname+"</font><ping/>";
            var flashregex = new RegExp(flashtag,"g");
            var borderregex = new RegExp(htmlborder, "g");
            var newmessage = message.replace(regex,newregex1).replace(flashregex,"");
            if (!isInSpecificTour(sys.name(arr[x]),key) && tours.tour[key].seeds.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
                newmessage = newmessage.replace(borderregex, blueborder);
            }
            sys.sendHtmlMessage(arr[x], newmessage, tourschan);
            if (isInSpecificTour(sys.name(arr[x]),key) && sys.away(arr[x])) {
                sys.changeAway(arr[x], false);
                sendBotMessage(arr[x],"You are no longer idle!",tourschan,false);
            }
        }
    }
}

// Send a flashing bracket
function sendFlashingBracket(message,key) {
    var arr = sys.playersOfChannel(tourschan);
    for (var x in arr) {
        var newmessage = message;
        if (tours.tour[key].players.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
            // send highlighted name in bracket
            var htmlname = html_escape(sys.name(arr[x]));
            var regex = flashtag+htmlname+flashtag;
            var newregex1 = "<font style='BACKGROUND-COLOR: #FFAAFF'>"+htmlname+"</font><ping/>";
            var flashregex = new RegExp(flashtag,"g");
            newmessage = message.replace(regex,newregex1).replace(flashregex,"");
        }
        sys.sendHtmlMessage(arr[x], newmessage, tourschan);
        if (isInSpecificTour(sys.name(arr[x]),key) && sys.away(arr[x])) {
            sys.changeAway(arr[x], false);
            sendBotMessage(arr[x],"You are no longer idle!",tourschan,false);
        }
    }
}

// Sends a message to all tour auth
function sendAllTourAuth(message) {
    for (var x in sys.playersOfChannel(tourschan)) {
        var arr = sys.playersOfChannel(tourschan);
        if (isTourAdmin(arr[x])) {
            sys.sendMessage(arr[x], message, tourschan);
        }
    }
}

// Saving for server reloads
function save_cache() {
    sys.writeToFile(dataDir+"tours_cache.json", JSON.stringify(tours));
}

function load_cache() {
    var test = JSON.parse(sys.getFileContent(dataDir+"tours_cache.json"));
    tours = test;
    tours.globaltime = 0;
    tours.eventticks = -1;
    for (var x in tours.tour) {
        // don't reload tournaments that haven't started.
        if (tours.tour[x].round === 0) {
            delete tours.tour[x];
            purgeKeys();
            continue;
        }
        tours.tour[x].time = parseInt(sys.time(), 10)+600;
        tours.tour[x].battlers = {};
        tours.tour[x].active = {};
    }
}

function purgeKeys() {
    for (var k=0; k < tours.keys.length; k++) {
        var keynum = tours.keys[k];
        if (!tours.tour.hasOwnProperty(keynum)) {
            tours.keys.splice(tours.keys.indexOf(keynum), 1);
            k -= 1;
        }
    }
}

/* Get a config value
Returns default if value doesn't exist*/
function getConfigValue(file, key) {
    try {
        var defaultvars = {
            maxqueue: 4,
            maxarray: 1023,
            maxrunning: 3,
            toursignup: 200,
            tourdq: 180,
            subtime: 90,
            touractivity: 200,
            breaktime: 120,
            absbreaktime: 600,
            remindertime: 30,
            channel: "Tournaments",
            errchannel: "Developer's Den",
            tourbotcolour: "#3DAA68",
            minpercent: 5,
            minplayers: 3,
            decayrate: 10,
            decaytime: 2,
            norepeat: 7,
            decayglobalrate: 2,
            version: "2.107",
            tourbot: "\u00B1"+Config.tourneybot+": ",
            debug: false,
            points: true,
            winmessages: true
        };
        var configkeys = sys.getValKeys(configDir+file);
        if (configkeys.indexOf(key) == -1) {
            sendChanAll("No tour config data detected for '"+key+"', getting default value", tourschan);
            if (defaultvars.hasOwnProperty(key))
                return defaultvars[key];
            else
                throw "Couldn't find the key!";
        }
        else {
            return sys.getVal(configDir+file, key);
        }
    }
    catch (err) {
        sendChanAll("Error in getting config value '"+key+"': "+err, tourserrchan);
        return null;
    }
}

function initTours() {
    // config object
    sys.makeDir("tourconfig");
    sys.makeDir("tourdata");
    tourconfig = {
        maxqueue: parseInt(getConfigValue("tourconfig.txt", "maxqueue"), 10),
        maxarray: 1023,
        maxrunning: parseInt(getConfigValue("tourconfig.txt", "maxrunning"), 10),
        toursignup: parseInt(getConfigValue("tourconfig.txt", "toursignup"), 10),
        tourdq: parseInt(getConfigValue("tourconfig.txt", "tourdq"), 10),
        subtime: parseInt(getConfigValue("tourconfig.txt", "subtime"), 10),
        activity: parseInt(getConfigValue("tourconfig.txt", "touractivity"), 10),
        tourbreak: parseInt(getConfigValue("tourconfig.txt", "breaktime"), 10),
        abstourbreak: parseInt(getConfigValue("tourconfig.txt", "absbreaktime"), 10),
        reminder: parseInt(getConfigValue("tourconfig.txt", "remindertime"), 10),
        channel: "Tournaments",
        errchannel: "Developer's Den",
        tourbotcolour: getConfigValue("tourconfig.txt", "tourbotcolour"),
        minpercent: parseFloat(getConfigValue("tourconfig.txt", "minpercent")),
        minplayers: parseInt(getConfigValue("tourconfig.txt", "minplayers"), 10),
        decayrate: parseFloat(getConfigValue("tourconfig.txt", "decayrate")),
        decaytime: parseFloat(getConfigValue("tourconfig.txt", "decaytime")),
        norepeat: parseInt(getConfigValue("tourconfig.txt", "norepeat"), 10),
        decayglobalrate: parseFloat(getConfigValue("tourconfig.txt", "decayglobalrate")),
        version: "2.107",
        tourbot: getConfigValue("tourconfig.txt", "tourbot"),
        debug: false,
        points: true,
        winmessages: getConfigValue("tourconfig.txt", "winmessages") === "off" ? false : true
    };
    tourschan = utilities.get_or_create_channel(tourconfig.channel);
    tourserrchan = utilities.get_or_create_channel(tourconfig.errchannel);
    if (typeof tours != "object") {
        try {
            load_cache();
            sendChanAll("Loaded cached tournament object", tourschan);
        }
        catch (e) {
            sendChanAll("Creating new tournament object", tourschan);
            tours = {"queue": [], "globaltime": -1, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": {}, "subscriptions": {}, "activetas": [], "activehistory": [], "tourmutes": {}, "metrics": {}, "eventticks": -1, "working": true};
        }
        var refresh = true;
        for (var x in tours.tour) {
            if (tours.tour[x].event) {
                refresh = false;
            }
        }
        if (refresh) {
            refreshTicks(true);
        }
    }
    else {
        if (!tours.hasOwnProperty('queue')) tours.queue = [];
        if (!tours.hasOwnProperty('globaltime')) tours.globaltime = -1;
        if (!tours.hasOwnProperty('key')) tours.key = [];
        if (!tours.hasOwnProperty('keys')) tours.keys = [];
        if (!tours.hasOwnProperty('tour')) tours.tour = {};
        if (!tours.hasOwnProperty('history')) tours.history = [];
        if (!tours.hasOwnProperty('touradmins')) tours.touradmins = {};
        if (!tours.hasOwnProperty('subscriptions')) tours.subscriptions = {};
        if (!tours.hasOwnProperty('activetas')) tours.activetas = [];
        if (!tours.hasOwnProperty('activehistory')) tours.activehistory = [];
        if (!tours.hasOwnProperty('tourmutes')) tours.tourmutes = {};
        if (!tours.hasOwnProperty('metrics')) tours.metrics = {};
        if (!tours.hasOwnProperty('eventticks')) tours.eventticks = -1;
        if (!tours.hasOwnProperty('working')) tours.working = true;
    }
    tours.metrics = {'failedstarts': 0};
    try {
        getTourWinMessages();
        sendChanAll(tourconfig.winmessages ? "Win messages loaded" : "Using default win message", tourschan);
    }
    catch (e) {
        // use a sample set of win messages
        tourwinmessages = [];
        sendChanAll("No win messages detected, using default win message.", tourschan);
    }
    var tadata = sys.getFileContent(configDir+"touradmins.json");
    if (tadata === undefined) {
        sendChanAll("No tour admin data detected, leaving blank", tourschan);
    }
    else {
        try {
            tours.touradmins = JSON.parse(tadata);
        }
        catch (e) {
            sendChanAll("No tour admin data detected, leaving blank", tourschan);
        }
    }
    if (typeof tourstats != "object") {
        sendChanAll("Creating tournament stats object", tourschan);
        var tourstatdata = sys.getFileContent(dataDir+'tastats.json');
        if (tourstatdata === undefined || tourstatdata === "") {
            tourstats = {'general': {}, 'staff': {}};
        }
        else {
            try {
                tourstats = JSON.parse(tourstatdata);
            }
            catch (err) {
                tourstats = {'general': {}, 'staff': {}};
            }
        }
    }
    try {
        var history = sys.getFileContent(dataDir+'tourhistory.json');
        var parseData = JSON.parse(history);
        tours.history = parseData.tours;
        tours.activehistory = parseData.staff;
    }
    catch (err) {
        sendChanAll("No tour history detected.", tourschan);
    }
    try {
        var twarns = sys.getFileContent(dataDir+'tourwarns.json');
        tourwarnings = JSON.parse(twarns);
    }
    catch (err) {
        tourwarnings = {'ranges': []};
    }
    loadTourMutes();
    sendChanAll("Version "+tourconfig.version+" of the tournaments system was loaded successfully in this channel!", tourschan);
}

function getEventTour(datestring) {
    var eventfile = sys.getFileContent(dataDir+"eventtours.json");
    var events;
    if (eventfile === undefined) {
        return false;
    }
    try {
        events = JSON.parse(eventfile);
    }
    catch (e) {
        return false;
    }
    for (var x in events) {
        if (x == datestring) {
            var eventdata = events[x];
            var tierstr = eventdata.tier;
            var thetier = find_tier(tierstr);
            if (thetier === null) {
                continue;
            }
            var allgentiers = ["Challenge Cup", "Metronome", "CC 1v1", "Wifi CC 1v1"];
            var parameters = {"gen": "default", "mode": modeOfTier(thetier), "type": "double", "maxplayers": false, "event": true, "wifi": sys.getClauses(thetier)%256 >= 128 ? true : false};
            if (eventdata.hasOwnProperty('settings')) {
                var parameterdata = eventdata.settings;
                for (var p in parameterdata) {
                    var parameterset = p;
                    var parametervalue = parameterdata[p];
                    if (cmp(parameterset, "mode")) {
                        var singlesonlytiers = ["Gen 5 1v1", "Gen 5 1v1 Ubers", "CC 1v1", "Wifi CC 1v1", "GBU Singles", "Adv Ubers", "Adv OU", "DP Ubers", "DP OU", "No Preview OU", "No Preview Ubers", "Wifi OU", "Wifi Ubers"];
                        if ((modeOfTier(thetier) == "Doubles" || modeOfTier(thetier) == "Triples" || singlesonlytiers.indexOf(thetier) != -1) && !cmp(parametervalue, modeOfTier(thetier))) {
                            sendBotAll("The "+thetier+" tier can only be played in " + modeOfTier(thetier) + " mode!", tourserrchan, false);
                        }
                        else if (cmp(parametervalue, "singles")) {
                            parameters.mode = "Singles";
                        }
                        else if (cmp(parametervalue, "doubles")) {
                            parameters.mode = "Doubles";
                        }
                        else if (cmp(parametervalue, "triples")) {
                            parameters.mode = "Triples";
                        }
                    }
                    else if (cmp(parameterset, "gen") && allgentiers.indexOf(thetier) != -1) { // only allgentours can change gen
                        var newgen = getSubgen(parametervalue, false);
                        if (newgen !== false) {
                            parameters.gen = newgen;
                        }
                        else {
                            parameters.gen = "5-1"; // BW2
                            sendBotAll("Warning! The subgen '"+parametervalue+"' does not exist! Used BW2 instead!", tourserrchan, false);
                        }
                    }
                    else if (cmp(parameterset, "maxplayers")) {
                        var players = parseInt(parametervalue, 10);
                        var allowedcounts = [8,16,32,64,128,256,512,1024];
                        if (allowedcounts.indexOf(players) == -1) {
                            sendBotAll("Invalid number of maximum players!", tourserrchan, false);
                            return false;
                        }
                        parameters.maxplayers = players;
                    }
                    else if (cmp(parameterset, "wifi")) {
                        if (cmp(parametervalue, "on")) {
                            parameters.wifi = true;
                        }
                        else if (cmp(parametervalue, "off")) {
                            parameters.wifi = false;
                        }
                        else {
                            sendBotMessage("Parameter Usage: wifi=on or wifi=off", tourserrchan, false);
                            return true;
                        }
                    }
                    else if (cmp(parameterset, "type")) {
                        if (cmp(parametervalue, "single")) {
                            parameters.type = "single";
                        } else {
                            parameters.type = "double";
                        }
                    }
                    else {
                        sendBotAll("Warning! The parameter '"+parameterset+"' does not exist!", tourserrchan, false);
                    }
                }
            }
            if (allgentiers.indexOf(thetier) != -1 && parameters.gen === "default") {
                parameters.gen = "5-1";
            }
            return [thetier, parameters];
        }
    }
    return false;
}

function refreshTicks(override) {
    var time = parseInt(sys.time(), 10);
    time -= 9900; // offset
    var frequency = 6*60*60; // every 6 hours
    var newtime = frequency-time%frequency;
    var oldtime = tours.eventticks;
    if (override || newtime < oldtime) {
        tours.eventticks = newtime;
    }
}

/* Tournament Step Event
Used for things such as
- sending reminders
- starting new tours automatically
- disqualifying/reminding inactive players
- removing subs */
function tourStep() {
    var canstart = true;
    var canautostart = true;
    var now = new Date();
    if (parseInt(sys.time(), 10)%3600 === 0) {
        var comment = now + " ~ " + tours.activetas.join(", ");
        tours.activehistory.unshift(comment);
        if (tours.activehistory.length > 72) {
            tours.activehistory.pop();
        }
        saveTourHistory();
        tours.activetas = [];
        // clear out tourmutes list
        for (var m in tours.tourmutes) {
            if (tours.tourmutes[m].expiry <= parseInt(sys.time(), 10)) {
                delete tours.tourmutes[m];
                saveTourMutes();
            }
        }
        refreshTicks(false);
    }
    if (tours.eventticks > 0) {
        tours.eventticks -= 1;
    }
    for (var x in tours.tour) {
        var rtime = tours.tour[x].time-parseInt(sys.time(), 10);
        if ((rtime <= 10 && rtime >= 0) || rtime%30 === 0) {
            sendDebugMessage("Time Remaining in the "+getFullTourName(x)+" tournament: "+time_handle(tours.tour[x].time-parseInt(sys.time(), 10))+"; State: "+tours.tour[x].state,tourschan);
        }
        if (tours.tour[x].state == "signups") {
            if (tours.tour[x].time <= parseInt(sys.time(), 10)) {
                tourinitiate(x);
                continue;
            }
            if (tours.tour[x].time-parseInt(sys.time(), 10) == 60 && tours.tour[x].parameters.event) {
                sendBotAll("Signups for the "+getFullTourName(x)+" tournament close in 1 minute.", "~mt", false);
            }
            else if (tours.tour[x].time-parseInt(sys.time(), 10) == 30) {
                sendBotAll("Signups for the "+getFullTourName(x)+" tournament close in 30 seconds.", "~mt", false);
            }
            continue;
        }
        if (tours.tour[x].state == "subround" && tours.tour[x].time <= parseInt(sys.time(), 10)) {
            tours.tour[x].time = parseInt(sys.time(), 10)+tourconfig.tourdq-tourconfig.subtime;
            removesubs(x);
            continue;
        }
        if (tours.tour[x].state == "subround" || tours.tour[x].state == "round" || tours.tour[x].state == "final") {
            if (tours.tour[x].time <= parseInt(sys.time(), 10) && (parseInt(sys.time(), 10)-tours.tour[x].time)%60 === 0 && tours.tour[x].state != "subround") {
                removeinactive(x);
                continue;
            }
            if ((tours.tour[x].time-(tours.tour[x].state == "subround" ? tourconfig.subtime : (is1v1Tour(x) ? Math.floor(tourconfig.tourdq*2/3) : tourconfig.tourdq))+tourconfig.reminder) == parseInt(sys.time(), 10)) {
                sendReminder(x);
                continue;
            }
        }
        if (tours.tour[x].state == "signups" || tours.tour[x].state == "subround") {
            canstart = false;
        }
    }
    if (!tours.working) {
        canstart = false;
    }
    if (calcPercentage() >= tourconfig.minpercent) {
        canautostart = false;
    }
    var datestring = now.getUTCDate()+"-"+(now.getUTCMonth()+1)+"-"+now.getUTCFullYear();
    var hour = now.getUTCHours();
    var allgentiers = ["Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Metronome"];
    if (tours.eventticks === 0) {
        var details = getEventTour(datestring);
        if (typeof details === "object") {
            var tourtier = details[0];
            sendBotAll("A <b>"+html_escape(details[0])+"</b> event is starting soon.",tourschan,true);
            sendBotAll("A <b>"+html_escape(details[0])+"</b> event is starting soon.",0,true);
            tours.queue.unshift({'tier': tourtier, 'starter': "~Pokemon Online~", 'parameters': details[1]});
            tours.globaltime = parseInt(sys.time(), 10)+300;
            tours.eventticks = -1;
        }
        else {
            tours.eventticks = -1;
        }
    }
    if (canstart && tours.globaltime > 0 && tours.globaltime <= parseInt(sys.time(), 10) && (tourconfig.maxrunning > tours.keys.length || canautostart)) {
        if (tours.queue.length > 0) {
            var data = tours.queue[0];
            var tourtostart = data.tier;
            var starter = data.starter;
            var params = data.parameters;
            if (params.event && tours.keys.length > 0) {
                if ([3,9,15,21].indexOf(hour) == -1)
                    return;
            }
            tours.queue.splice(0,1);
            tourstart(tourtostart,starter,tours.key,params);
        }
        else if (tours.keys.length === 0) {
            // start a cycle from tourarray
            var tourarray = ["Challenge Cup", "Wifi NU", "CC 1v1", "Random Battle", "Wifi OU", "Gen 5 1v1", "Wifi UU", "Monotype", "Challenge Cup", "Clear Skies", "Wifi CC 1v1", "Wifi LC", "Wifi OU", "Wifi LU", "Wifi Ubers", "No Preview OU"];
            var doubleelimtiers = ["CC 1v1", "Wifi CC 1v1", "Gen 5 1v1"];
            var tourtostart = tourarray[tours.key%tourarray.length];
            var tourtype = doubleelimtiers.indexOf(tourtostart) != -1 ? "double" : "single";
            tourstart(tourtostart,"~~Server~~",tours.key,{"mode": modeOfTier(tourtostart), "gen": (allgentiers.indexOf(tourtostart) != -1 ? "5-1" : "default"), "type": tourtype, "maxplayers": false, "event": false,  "wifi": sys.getClauses(tourtostart)%256 >= 128 ? true : false});
        }
    }
}

// Battle Start
function tourBattleStart(src, dest, clauses, rated, mode, bid) {
    var name1 = sys.name(src).toLowerCase();
    var name2 = sys.name(dest).toLowerCase();
    var key = null;
    for (var x in tours.tour) {
        if (tours.tour[x].players.indexOf(sys.name(src).toLowerCase()) != -1) {
            var srcisintour = false;
            if (tours.tour[x].losers.indexOf(sys.name(src).toLowerCase()) == -1) {
                srcisintour = true;
            }
            if (tours.tour[x].parameters.type == "double") {
                if (tours.tour[x].winbracket.indexOf(sys.name(src).toLowerCase()) != -1 || tours.tour[x].round == 1) {
                    srcisintour = true;
                }
            }
            if (srcisintour) {
                key = x;
                break;
            }
        }
        if (tours.tour[x].players.indexOf(sys.name(dest).toLowerCase()) != -1) {
            var destisintour = false;
            if (tours.tour[x].losers.indexOf(sys.name(dest).toLowerCase()) == -1) {
                destisintour = true;
            }
            if (tours.tour[x].parameters.type == "double") {
                if (tours.tour[x].winbracket.indexOf(sys.name(dest).toLowerCase()) != -1 || tours.tour[x].round == 1) {
                    destisintour = true;
                }
            }
            if (destisintour) {
                key = x;
                break;
            }
        }
    }
    if (key === null) return false;
    if (rated) return false;
    // only recognise a battle from round 1 onwards, against the correct players
    var index1 = tours.tour[key].players.indexOf(name1);
    var index2 = tours.tour[key].players.indexOf(name2);
    var validBattle = false;
    if (Math.abs(index1 - index2) === 1 && Math.min(index1,index2)%2 === 0) {
        validBattle = true;
    }
    if (validBattle && tours.tour[key].round >= 1) {
        tours.tour[key].battlers[name1] = {'battleId': bid, 'time': parseInt(sys.time(), 10), 'noSpecs': clauses%8 >= 4};
        tours.tour[key].battlers[name2] = {'battleId': bid, 'time': parseInt(sys.time(), 10), 'noSpecs': clauses%8 >= 4};
        tours.tour[key].active[name1] = "Battle";
        tours.tour[key].active[name2] = "Battle";// this avoids dq later since they made an attempt to start
        if (tours.tour[key].state == "final") {
            sendBotAll("<a href='po:watch/"+bid+"'>The final battle of the "+getFullTourName(key)+" tournament between <b>"+html_escape(sys.name(src))+"</b> and <b>"+html_escape(sys.name(dest))+"</b> just started!</a>",0,true);
            sendBotAll("<a href='po:watch/"+bid+"'>The final battle of the "+getFullTourName(key)+" tournament between <b>"+html_escape(sys.name(src))+"</b> and <b>"+html_escape(sys.name(dest))+"</b> just started!</a>",tourschan,true);
        }
        return true;
    }
    return false;
}

// battle ending functions; called from afterBattleEnd
function tourBattleEnd(winner, loser, result) {
    var winname = sys.name(winner).toLowerCase();
    var losename = sys.name(loser).toLowerCase();
    var key = null;
    for (var x in tours.tour) {
        if (isInSpecificTour(winname, x)) {
            key = x;
            break;
        }
        if (isInSpecificTour(losename, x)) {
            key = x;
            break;
        }
    }
    if (key === null) return;
    /* For tournament matches */
    if (tours.tour[key].players.indexOf(winname) > -1 && tours.tour[key].players.indexOf(losename) > -1) {
        var winindex = tours.tour[key].battlers.hasOwnProperty(winname);
        if (winindex) {
            var battletime = parseInt(sys.time(), 10)-tours.tour[key].battlers[winname].time;
            if (result == "forfeit" && ((battletime < 30 && !is1v1Tour(key)) || battletime < 5)) {
                sendBotAll(sys.name(loser)+" forfeited against "+sys.name(winner)+" in a "+getFullTourName(key)+" match after "+battletime+" seconds.",sys.channelId("Victory Road"), false);
            }
            delete tours.tour[key].battlers[winname];
        }
        var loseindex = tours.tour[key].battlers.hasOwnProperty(losename);
        if (loseindex) delete tours.tour[key].battlers[losename];
        if (!winindex || !loseindex) {
            return;
        }
        if (result == "tie") {
            sendBotAll("The match between "+winname+" and "+losename+" ended in a tie, please rematch!", tourschan, false);
            markActive(winner, "tie");
            markActive(loser, "tie");
            if (tours.tour[key].draws.indexOf(winname) == -1) {
                tours.tour[key].draws.push(winname, losename);
            }
            else {
                sendBotAll(winname+" and "+losename+" drew more than once! Please check their match!", sys.channelId("Victory Road"), false);
            }
            return;
        }
        battleend(winner, loser, key);
        save_cache();
    }
}

// Challenge Issuing Functions
function tourChallengeIssued(src, dest, clauses, rated, mode, team, destTier) {
    var key = null;
    var srcindex = null;
    var destindex = null;
    for (var x in tours.tour) {
        if (tours.tour[x].players.indexOf(sys.name(src).toLowerCase()) != -1) {
            var srcisintour = false;
            if (tours.tour[x].losers.indexOf(sys.name(src).toLowerCase()) == -1) {
                srcisintour = true;
            }
            if (tours.tour[x].parameters.type == "double") {
                if (tours.tour[x].winbracket.indexOf(sys.name(src).toLowerCase()) != -1 || tours.tour[x].round == 1) {
                    srcisintour = true;
                }
            }
            if (srcisintour) {
                key = x;
                break;
            }
        }
        if (tours.tour[x].players.indexOf(sys.name(dest).toLowerCase()) != -1) {
            var destisintour = false;
            if (tours.tour[x].losers.indexOf(sys.name(dest).toLowerCase()) == -1) {
                destisintour = true;
            }
            if (tours.tour[x].parameters.type == "double") {
                if (tours.tour[x].winbracket.indexOf(sys.name(dest).toLowerCase()) != -1 || tours.tour[x].round == 1) {
                    destisintour = true;
                }
            }
            if (destisintour) {
                key = x;
                break;
            }
        }
    }
    if (key !== null) {
        srcindex = tours.tour[key].players.indexOf(sys.name(src).toLowerCase());
        destindex = tours.tour[key].players.indexOf(sys.name(dest).toLowerCase());
    }
    if ((srcindex != -1 || destindex != -1) && srcindex !== null && destindex !== null) {
        var tcomment = isValidTourBattle(src,dest,clauses,mode,team,destTier,key,true);
        if (tcomment != "Valid") {
            sendBotMessage(src, tcomment, "all", false);
            if (tcomment == "Your opponent does not seem to have a team for the tournament.") {
                sendBotMessage(dest, "You need a team in the "+tours.tour[key].tourtype+" tier to participate. Please do this ASAP or you will be disqualified.", "all", false);
                markActive(src, "post");
            }
            return true;
        }
        markActive(src, "post");
        return false;
    }
    else return false;
}

// Tournament Command Handler
function tourCommand(src, command, commandData) {
    try {
        if (isTourOwner(src)) {
            if (command == "clearrankings") {
                var month = false;
                var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
                var mindex = themonths.indexOf(commandData.toLowerCase());
                if (mindex > -1) {
                    month = mindex;
                }
                else if (commandData == "all") {
                    month = "all";
                }
                if (tstats.clearrank(month)) {
                    sendBotAll(sys.name(src)+" cleared the tour rankings"+(commandData == "all" ? "" : " for "+commandData)+"!",tourschan,false);
                }
                return true;
            }
            if (command == "cleareventrankings") {
                var month = false;
                var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
                var mindex = themonths.indexOf(commandData.toLowerCase());
                if (mindex > -1) {
                    month = mindex;
                }
                else if (commandData == "all") {
                    month = "all";
                }
                if (tstats.cleareventrank(month)) {
                    sendBotAll(sys.name(src)+" cleared the event rankings"+(commandData == "all" ? "" : " for "+commandData)+"!",tourschan,false);
                }
                return true;
            }
            if (command == "clearmetric") {
                if (commandData == "stats") {
                    tourstats = {'general': {}, 'staff': {}};
                    sendBotAll(sys.name(src)+" cleared the tour stats!",tourschan,false);
                }
                return true;
            }
            if (command == "importold") {
                sendBotMessage(src,"This command is obsolete!",tourschan,false);
                // tstats.importold();
                return true;
            }
            if (command == "rundecay") {
                var tierlist = sys.getTierList();
                for (var x in tierlist) {
                    tstats.decay(tierlist[x]);
                }
                sendBotMessage(src,"Decay calculation successful",tourschan,false);
                return true;
            }
            if (command == "stoptours") {
                if (!tours.working) {
                    sendBotMessage(src,"Tournaments are already disabled!",tourschan,false);
                    return true;
                }
                tours.working = false;
                sendChanAll(border, tourschan);
                sendBotAll(sys.name(src)+" disabled the tournaments system as it is undergoing maintenance. No new tournaments will start.",tourschan,false);
                sendChanAll(border, tourschan);
                return true;
            }
            if (command == "starttours") {
                if (tours.working) {
                    sendBotMessage(src,"Tournaments are already enabled!",tourschan,false);
                    return true;
                }
                tours.working = true;
                sendChanAll(border, tourschan);
                sendBotAll(sys.name(src)+" re-enabled the tournaments system.",tourschan,false);
                sendChanAll(border, tourschan);
                return true;
            }
            if (command == "resettours") {
                tours = {"queue": [], "globaltime": -1, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": {}, "subscriptions": {}, "activetas": [], "activehistory": [], "tourmutes": {}, "metrics": {}, "eventticks": -1, "working": false};
                refreshTicks(true);
                sendBotAll(sys.name(src)+" reset the tour system!",tourschan,false);
                return true;
            }
            if (command == "purgekeys") {
                purgeKeys();
                sendBotMessage(src,"Purged non-usable keys!",tourschan,false);
                return true;
            }
            if (command == "addrangewarning") {
                var tmp = commandData.split(".",4);
                var ret = [];
                for (var m in tmp) {
                    var num = parseInt(tmp[m], 10);
                    if (isNaN(num) || num < 0 || num > 255) {
                        sendBotMessage(src,"Invalid IP Range!",tourschan,false);
                        return true;
                    }
                    ret.push(num);
                }
                if (ret.length === 0) {
                    sendBotMessage(src,"Can't ban empty ranges!",tourschan,false);
                    return true;
                }
                var iprange = ret.join(".") + (ret.length === 4 ? "" : ".");
                if (tourwarnings.ranges.indexOf(iprange) > -1) {
                    sendBotMessage(src,"This range is already banned!",tourschan,false);
                    return true;
                }
                tourwarnings.ranges.push(iprange);
                sys.writeToFile(dataDir+'tourwarns.json', JSON.stringify(tourwarnings));
                sendBotMessage(src,"Added range warning for the range: "+iprange,tourschan,false);
                return true;
            }
            if (command == "removerangewarning") {
                var windex = tourwarnings.ranges.indexOf(commandData);
                if (windex == -1) {
                    sendBotMessage(src,"This range is not banned!",tourschan,false);
                    return true;
                }
                tourwarnings.ranges.splice(windex, 1);
                sys.writeToFile('tourwarns.json', JSON.stringify(tourwarnings));
                sendBotMessage(src,"Removed range warning for the range: "+commandData,tourschan,false);
                return true;
            }
            if (command == "rangewarns") {
                var twarns = tourwarnings.ranges;
                sys.sendMessage(src,"*** RANGE WARNS ***",tourschan);
                for (var t in twarns) {
                    sys.sendMessage(src,twarns[t],tourschan);
                }
                return true;
            }
            if (command == "changepoints") {
                sendBotMessage(src,"This command is obsolete!",tourschan,false);
                return true;
            }
            if (command == "evalvars") {
                dumpVars(src);
                return true;
            }
            if (command == "exportrankings") {
                sendBotMessage(src,"This command is obsolete!",tourschan,false);
                return true;
            }
            if (command == "loadevents") {
                var url = Config.base_url + "tourdata/eventtours.json";
                if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
                    url = commandData;
                }
                sendBotMessage(src, "Fetching event tours from "+url, tourschan, false);
                sys.webCall(url, function(resp) {
                    if (resp !== "") {
                        try {
                            JSON.parse(resp);
                            sys.writeToFile(dataDir+'eventtours.json', resp);
                            sendBotAll('Updated list of event tours!', tourschan, false);
                        }
                        catch (err) {
                            sendBotMessage(src, 'Failed to update! [Error: '+err+']', tourschan, false);
                        }
                    } else {
                        sendBotMessage(src, 'Failed to update!', tourschan, false);
                    }
                });
                return true;
            }
            if (command == "fulleventleaderboard") {
                tstats.erankings(src, true, commandData);
                return true;
            }
            if (command == "fullmonthlyleaderboard" || command == "fullleaderboard") {
                var month = false;
                var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
                var mindex = themonths.indexOf(commandData.toLowerCase());
                if (mindex > -1) {
                    month = mindex;
                }
                if (month === false) {
                    var date = new Date();
                    var mindex = date.getMonth();
                }
                tstats.rankings(src, "", true, mindex);
                return true;
            }
        }
        if (isTourSuperAdmin(src)) {
            /* Tournament Admins etc. */
            if (command == "tadmin" || command == "tadmins" || command == "megauser" || (isTourOwner(src) && (command == "tsadmin" || command == "tsadmins")) || (sys.auth(src) >= 3 && (command == "towner" || command == "towners"))) {
                var tadmins = tours.touradmins;
                if (sys.dbIp(commandData) === undefined) {
                    sendBotMessage(src,"This user doesn't exist!",tourschan,false);
                    return true;
                }
                if (!sys.dbRegistered(commandData)) {
                    sendBotMessage(src,"They aren't registered so you can't give them authority!",tourschan,false);
                    if (sys.id(commandData) !== undefined) {
                        sendBotMessage(sys.id(commandData), "Please register ASAP, before getting tour authority.","all",false);
                    }
                    return true;
                }
                var silent = command.charAt(command.length-1) == "s";
                var authority = silent ? command.substr(0, command.length-1) : command;
                var readauth = "megauser";
                var desc = "mu";
                var newauth = 1;
                if (authority == "tsadmin") {
                    desc = "ta";
                    newauth = 2;
                    readauth = "tournament admin";
                }
                if (authority == "towner") {
                    desc = "to";
                    newauth = 3;
                    readauth = "tournament owner";
                }
                var lname = commandData.toLowerCase();
                var oldauth = 0;
                if (tadmins.hasOwnProperty(lname)) {
                    if (tadmins[lname] == desc) {
                        sendBotMessage(src,"They are already a "+readauth+"!",tourschan,false);
                        return true;
                    }
                    oldauth = ["none", "mu", "ta", "hidden", "to"].indexOf(tadmins[lname]);
                    if ((oldauth > 1 && !isTourOwner(src)) || (oldauth > 2 && sys.auth(src) < 3)) {
                        sendBotMessage(src,"You don't have sufficient authority!",tourschan,false);
                        return true;
                    }
                }
                tadmins[lname] = desc;
                tours.touradmins = tadmins;
                var changeword = newauth > oldauth ? " promoted " : " demoted ";
                saveTourKeys();
                if (silent) {
                    sendBotAll(sys.name(src)+changeword+commandData.toLowerCase()+" to a "+readauth+"!",sys.channelId("Indigo Plateau"),false);
                }
                else {
                    sendBotAll(sys.name(src)+changeword+commandData.toLowerCase()+" to a "+readauth+"!","~st",false);
                }
                return true;
            }
            if (command == "tdeadmin" || command == "tdeadmins" || command == "megauseroff") {
                var tadmins = tours.touradmins;
                if (sys.dbIp(commandData) === undefined) {
                    sendBotMessage(src,"This user doesn't exist!",tourschan,false);
                    return true;
                }
                var lname = commandData.toLowerCase();
                if (!tadmins.hasOwnProperty(lname)) {
                    sendBotMessage(src,"They don't have tour authority!",tourschan,false);
                    return true;
                }
                if ((tadmins[lname] == "to" || tadmins[lname] == "hidden")  && sys.auth(src) < 3) {
                    sendBotMessage(src,"You don't have sufficient authority!",tourschan,false);
                    return true;
                }
                if (tadmins[lname] == "ta" && !isTourOwner(src)) {
                    sendBotMessage(src,"You don't have sufficient authority!",tourschan,false);
                    return true;
                }
                delete tadmins[lname];
                tours.touradmins = tadmins;
                saveTourKeys();
                if (command != "tdeadmins") {
                    sendBotAll(sys.name(src)+" fired "+commandData.toLowerCase()+" from running tournaments!","~st",false);
                }
                else {
                    sendBotAll(sys.name(src)+" fired "+commandData.toLowerCase()+" from running tournaments!",sys.channelId("Indigo Plateau"),false);
                }
                return true;
            }
            // active history command
            if (command == "tahistory") {
                sys.sendMessage(src, "*** TOUR ADMIN HISTORY ***",tourschan);
                var length = 168;
                if (commandData === "") {
                    length = tours.activehistory.length;
                }
                else if (parseInt(commandData, 10)*24 < tours.activehistory.length) {
                    length = parseInt(commandData, 10)*24;
                }
                else {
                    length = tours.activehistory.length;
                }
                for (var x=0;x<length;x++) {
                    sys.sendMessage(src, tours.activehistory[x],tourschan);
                }
                return true;
            }
            if (command == "stopautostart") {
                tours.globaltime = -1;
                sendBotAll(sys.name(src)+" stopped tournaments from auto starting for now, this will be removed when another tour is started.",tourschan,false);
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
                    sendBotMessage(src, "There are no tournaments currently in signups to force start! Use /tour [tier] instead, or /start to start the next tournament in the queue!", tourschan, false);
                    return true;
                }
                if (tours.tour[x].players.length < tourconfig.minplayers) {
                    sendBotMessage(src, "There are not enough players to start!", tourschan, false);
                    return true;
                }
                tourinitiate(key);
                sendBotAll("The "+tours.tour[x].tourtype+" tour was force started by "+sys.name(src)+".", tourschan, false);
                return true;
            }
            if (command == "push") {
                var key = null;
                var target = commandData.toLowerCase();
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        key = x;
                        break;
                    }
                }
                if (key === null) {
                    sendBotMessage(src,"You can't push anyone into a tournament now!",tourschan,false);
                    return true;
                }
                /* Is already in another tour */
                if (isInTour(target) !== false) {
                    sendBotMessage(src,"You can't push them in another tour!",tourschan,false);
                    return true;
                }
                tours.tour[key].players.push(target);
                tours.tour[key].cpt += 1;
                if (tours.tour[key].maxcpt !== undefined) {
                    if (tours.tour[key].cpt > tours.tour[key].maxcpt && tours.tour[key].maxplayers === "default") {
                        tours.tour[key].maxcpt = tours.tour[key].cpt;
                        if (tours.tour[key].maxcpt == 9) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/6);
                        }
                        else if (tours.tour[key].maxcpt == 17) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/4);
                        }
                        else if (tours.tour[key].maxcpt == 33) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/3);
                        }
                        else if (tours.tour[key].maxcpt == 65) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/2);
                        }
                        else if (tours.tour[key].maxcpt == 129) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/1.5);
                        }
                        else if (tours.tour[key].maxcpt == 257) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup);
                        }
                        else if (tours.tour[key].maxcpt == 513) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup*2);
                        }
                    }
                }
                // 1024 players for technical reasons
                if (tours.tour[key].maxplayers === "default") {
                    sendBotAll(toCorrectCase(target)+" was added to the "+getFullTourName(key)+" tournament by "+sys.name(src)+" (player #"+tours.tour[key].players.length+"), "+(tours.tour[key].time - parseInt(sys.time(), 10))+" second"+(tours.tour[key].time - parseInt(sys.time(), 10) == 1 ? "" : "s")+" remaining!", tourschan, false);
                    if (tours.tour[key].players.length >= 1024) {
                        tours.tour[key].time = parseInt(sys.time(), 10);
                    }
                }
                else {
                    sendBotAll(toCorrectCase(target)+" was added to the "+getFullTourName(key)+" tournament by "+sys.name(src)+" (player #"+tours.tour[key].players.length+"), "+(tours.tour[key].maxplayers - tours.tour[key].cpt)+" place"+(tours.tour[key].maxplayers - tours.tour[key].cpt == 1 ? "" : "s")+" remaining!", tourschan, false);
                    if (tours.tour[key].players.length >= tours.tour[key].maxplayers) {
                        tours.tour[key].time = parseInt(sys.time(), 10);
                    }
                }
                return true;
            }
            // enabled for now!
            if (command == "updatewinmessages") {
                var url = "https://raw.github.com/lamperi/po-server-goodies/master/tourwinverbs.txt";
                if ((commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) && sys.auth(src) > 2) {
                    url = commandData;
                }
                sendBotMessage(src, "Fetching win messages from "+url, tourschan, false);
                sys.webCall(url, function(resp) {
                    if (resp !== "") {
                        sys.writeToFile(configDir+'tourwinverbs.txt', resp);
                        getTourWinMessages();
                        sendBotAll('Updated win messages!', tourschan, false);
                    } else {
                        sendBotMessage(src, 'Failed to update!', tourschan, false);
                    }
                });
                return true;
            }
        }
        if (isTourAdmin(src)) {
            if (command == "tour" || ((command == "tourstart" || command == "shift") && isTourSuperAdmin(src))) {
                if (!tours.working) {
                    sendBotMessage(src, 'Tournaments are disabled!', tourschan, false);
                    return true;
                }
                var splitpoint = commandData.indexOf(":");
                var data = splitpoint != -1 ? [commandData.substr(0,splitpoint), commandData.substr(splitpoint+1)] : [commandData, false];
                var tourtier = find_tier(data[0]);
                if (tourtier === null) {
                    sendBotMessage(src, "The tier '"+commandData+"' doesn't exist! Make sure the tier is typed out correctly and that it exists.", tourschan, false);
                    return true;
                }
                if (tourtier.indexOf("Smogon") != -1 && !isTourSuperAdmin(src)) {
                    sendBotMessage(src, "You are not permitted to run Smogon tier tournaments!", tourschan, false);
                    return true;
                }
                var lasttours = getListOfTours(tourconfig.norepeat);
                var lastindex = lasttours.indexOf(tourtier);
                if (lastindex != -1 && !isTourSuperAdmin(src)) {
                    sendBotMessage(src, "A "+tourtier+" tournament is in the queue, is running or was recently run, no repeating!", tourschan, false);
                    return true;
                }
                var cqueue = tours.queue;
                var selftours = 0;
                var maxtours = sys.auth(src) > 0 ? 6 : 3;
                if (cqueue.length > 0) {
                    for (var c in cqueue) {
                        var tmpq = cqueue[c].starter;
                        if (cmp(tmpq, sys.name(src))) {
                            selftours += 1;
                        }
                    }
                }
                if (selftours >= maxtours && !isTourSuperAdmin(src)) {
                    sendBotMessage(src, "You already have "+maxtours+" of your own tournaments in the queue, so you can't add anymore!", tourschan, false);
                    return true;
                }
                var isSignups = false;
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        isSignups = true;
                    }
                }
                var detiers = ["CC 1v1", "Wifi CC 1v1", "Gen 5 1v1", "Gen 5 1v1 Ubers"];
                var allgentiers = ["Challenge Cup", "Metronome", "CC 1v1", "Wifi CC 1v1"];
                var parameters = {"gen": "default", "mode": modeOfTier(tourtier), "type": detiers.indexOf(tourtier) == -1 ? "single" : "double", "maxplayers": false, "event": false, "wifi": (sys.getClauses(tourtier)%256 >= 128 ? true : false)};
                if (data[1] !== false) {
                    var parameterdata = data[1].split(":");
                    for (var p in parameterdata) {
                        var parameterinfo = parameterdata[p].split("=",2);
                        var parameterset = parameterinfo[0];
                        var parametervalue = parameterinfo[1];
                        if (cmp(parameterset, "mode")) {
                            var singlesonlytiers = ["Gen 5 1v1", "Gen 5 1v1 Ubers", "CC 1v1", "Wifi CC 1v1", "GBU Singles", "Adv Ubers", "Adv OU", "DP Ubers", "DP OU", "No Preview OU", "No Preview Ubers", "Wifi OU", "Wifi Ubers"];
                            if ((modeOfTier(tourtier) == "Doubles" || modeOfTier(tourtier) == "Triples" || singlesonlytiers.indexOf(tourtier) != -1) && !cmp(parametervalue, modeOfTier(tourtier))) {
                                sendBotMessage(src, "The "+tourtier+" tier can only be played in " + modeOfTier(tourtier) + " mode!", tourschan, false);
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
                        else if (cmp(parameterset, "gen") && allgentiers.indexOf(tourtier) != -1) { // only allgentours can change gen
                            var newgen = getSubgen(parametervalue, false);
                            if (newgen !== false) {
                                parameters.gen = newgen;
                            }
                            else {
                                parameters.gen = "5-1"; // BW2
                                sendBotMessage(src, "Warning! The subgen '"+parametervalue+"' does not exist! Used BW2 instead!", tourschan, false);
                            }
                        }
                        else if (cmp(parameterset, "type")) {
                            if (cmp(parametervalue, "double")) {
                                parameters.type = "double";
                            }
                            else if (cmp(parametervalue, "single")) {
                                parameters.type = "single";
                            }
                            else if (cmp(parametervalue, "event") && isTourOwner(src)) {
                                parameters.event = true;
                                parameters.type = "double";
                            }
                        }
                        else if (cmp(parameterset, "maxplayers")) {
                            var players = parseInt(parametervalue, 10);
                            var allowedcounts = [8,16,32,64,128,256,512,1024];
                            if (allowedcounts.indexOf(players) == -1) {
                                sendBotMessage(src, "Invalid number of maximum players!", tourschan, false);
                                return true;
                            }
                            parameters.maxplayers = players;
                        }
                        else if (cmp(parameterset, "wifi")) {
                            if (['CC 1v1', 'Wifi CC 1v1', 'Wifi Ubers', 'Wifi OU', 'No Preview Ubers', 'No Preview OU', 'Wifi Triples', 'Wifi Uber Triples', 'No Preview OU Triples', 'No Preview Uber Triples', 'Wifi OU Doubles', 'Wifi Uber Doubles', 'No Preview OU Doubles', 'No Preview Uber Doubles'].indexOf(tourtier) > -1) {
                                sendBotMessage(src, "You cannot change the Team Preview Setting for the "+tourtier+" tier!", tourschan, false);
                                return true;
                            }
                            else if (cmp(parametervalue, "on")) {
                                parameters.wifi = true;
                            }
                            else if (cmp(parametervalue, "off")) {
                                parameters.wifi = false;
                            }
                            else {
                                sendBotMessage(src, "Parameter Usage: wifi=on or wifi=off", tourschan, false);
                                return true;
                            }
                        }
                        else {
                            sendBotMessage(src, "Warning! The parameter '"+parameterset+"' does not exist!", tourschan, false);
                        }
                    }
                }
                if (allgentiers.indexOf(tourtier) != -1 && parameters.gen === "default") {
                    parameters.gen = "5-1";
                }
                if (tours.queue.length >= tourconfig.maxqueue && !isTourSuperAdmin(src) && command == "tour") {
                    sendBotMessage(src, "There are already "+tourconfig.maxqueue+" or more tournaments in the queue, so you can't add another one!", tourschan, false);
                    return true;
                }
                else if (isSignups || ((tours.keys.length > 0 || tours.queue.length > 0) && (command == "tour" || command == "shift"))) {
                    if (command == "shift") {
                        tours.queue.unshift({'tier': tourtier, 'starter': sys.name(src), 'parameters': parameters});
                    }
                    else {
                        tours.queue.push({'tier': tourtier, 'starter': sys.name(src), 'parameters': parameters});
                    }
                    sendBotAll(sys.name(src)+" added a "+tourtier+" tournament into the "+(command == "shift" ? "front of" : "")+" queue! Type /queue to see what is coming up next.",tourschan, false);
                }
                else {
                    tourstart(tourtier, sys.name(src), tours.key, parameters);
                    if (command == "tourstart") {
                        sendBotAll(sys.name(src)+" force started this tournament!", tourschan, false);
                    }
                }
                addTourActivity(src);
                return true;
            }
            if (command == "start") {
                if (!tours.working) {
                    sendBotMessage(src, 'Tournaments are disabled!', tourschan, false);
                    return true;
                }
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        sendBotMessage(src, "A tournament is already in signups!", tourschan, false);
                        return true;
                    }
                    if (tours.tour[x].event === true && !isTourOwner(src)) {
                        sendBotMessage(src, "An event tournament is running, so you can't force start the next tournament!", tourschan, false);
                        return true;
                    }
                }
                if (calcPercentage() > tourconfig.minpercent/2 && !isTourSuperAdmin(src)) {
                    sendBotMessage(src, "Too many players are in tours now!", tourschan, false);
                    return true;
                }
                if (tours.queue.length !== 0) {
                    var data = tours.queue[0];
                    var tourtostart = data.tier;
                    var originalstarter = data.starter;
                    var parameters = data.parameters;
                    tours.queue.splice(0,1);
                    tourstart(tourtostart, originalstarter, tours.key, parameters);
                    sendBotAll(sys.name(src)+" force started the "+tourtostart+" tournament!",tourschan,false);
                    return true;
                }
                else {
                    sendBotMessage(src, "There are no tournaments to force start! Use /tour [tier] instead!", tourschan, false);
                    return true;
                }
            }
            if (command == "changecount") {
                var key = null;
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        key = x;
                    }
                }
                if (key === null) {
                    sendBotMessage(src,"No tournament is in signups!",tourschan,false);
                    return true;
                }
                if (tours.tour[key].maxplayers === "default") {
                    sendBotMessage(src,"Can't change the count of a timed tour!",tourschan,false);
                    return true;
                }
                var players = parseInt(commandData, 10);
                var allowedcounts = [8,16,32,64,128,256,512,1024];
                if (allowedcounts.indexOf(players) == -1) {
                    sendBotMessage(src, "Invalid number of players!", tourschan, false);
                    return true;
                }
                else if (players < tours.tour[key].cpt) {
                    sendBotMessage(src, "There are more players in the tournament then you specified!", tourschan, false);
                    return true;
                }
                else {
                    tours.tour[key].maxplayers = players;
                    sendBotAll(sys.name(src)+" changed the number of places in the "+tours.tour[key].tourtype+" tournament to "+players+"! There are now "+(tours.tour[key].maxplayers - tours.tour[key].cpt)+" place"+(tours.tour[key].maxplayers - tours.tour[key].cpt == 1 ? "" : "s")+" remaining!", tourschan,false);
                }
                return true;
            }
            if (command == "remove") {
                var index = -1;
                if (!isNaN(parseInt(commandData, 10))) {
                    index = parseInt(commandData, 10)-1;
                }
                else {
                    for (var a = tours.queue.length-1; a>=0; a -= 1) {
                        var tourtoremove = tours.queue[a].tier;
                        if (cmp(commandData,tourtoremove)) {
                            index = a;
                            break;
                        }
                    }
                }
                if (index < 0 || index >= tours.queue.length) {
                    sendBotMessage(src, "The tier '"+commandData+"' doesn't exist in the queue, so it can't be removed! Make sure the tier is typed out correctly.", tourschan, false);
                    return true;
                }
                else {
                    var removedata = tours.queue[index];
                    var removedtour = removedata.tier;
                    var allowed = removedata.starter != "~Pokemon Online~";
                    if (!allowed && !isTourOwner(src)) {
                        sendBotMessage(src, "You are not permitted to remove event tours from the queue!", tourschan, false);
                        return true;
                    }
                    tours.queue.splice(index, 1);
                    sendBotAll("The "+removedtour+" tour (position "+(index+1)+") was removed from the queue by "+sys.name(src)+".", tourschan, false);
                    return true;
                }
            }
            if (command == "endtour") {
                var key = null;
                for (var x in tours.tour) {
                    if (tours.tour[x].tourtype.toLowerCase() == commandData.toLowerCase()) {
                        key = x;
                        break;
                    }
                }
                if (key === null) {
                    sendBotMessage(src,"The "+commandData+" tournament is not in progress!",tourschan,false);
                    return true;
                }
                sendBotAll("The "+getFullTourName(key)+" tournament was cancelled by "+sys.name(src)+"!", tourschan,false);
                if (tours.tour[key].event) {
                    refreshTicks(true);
                }
                delete tours.tour[key];
                purgeKeys();
                if (tours.globaltime !== -1) {
                    var variance = calcVariance();
                    tours.globaltime = parseInt(sys.time(), 10) + parseInt(tourconfig.abstourbreak/variance, 10); // default 10 mins b/w signups, + 5 secs per user in chan
                }
                save_cache();
                return true;
            }
            if (command == "passta" || (command == "passtas" && sys.auth(src) >= 1)) {
                /*if (sys.auth(src) === 0) {
                    sendBotMessage(src,"This command has been disabled, please ask one of the tournament owners.",tourschan,false)
                    return true;
                }*/
                var newname = commandData.toLowerCase();
                var tadmins = tours.touradmins;
                if (sys.dbIp(newname) === undefined) {
                    sendBotMessage(src,"This user doesn't exist!",tourschan,false);
                    return true;
                }
                if (!sys.dbRegistered(newname)) {
                    sendBotMessage(src,"That account isn't registered so you can't give it authority!",tourschan,false);
                    return true;
                }
                if (tadmins.hasOwnProperty(newname)) {
                    sendBotMessage(src,"The target is already a tour admin!",tourschan,false);
                    return true;
                }
                if (sys.id(newname) === undefined) {
                    sendBotMessage(src,"The target is offline!",tourschan,false);
                    return true;
                }
                if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                    sendBotMessage(src,"Both accounts must be on the same IP to switch!",tourschan,false);
                    return true;
                }
                if (!tadmins.hasOwnProperty(sys.name(src).toLowerCase())) {
                    sendBotMessage(src,"You need to be tour auth to pass it!",tourschan,false);
                    return true;
                }
                var desc = tadmins[sys.name(src).toLowerCase()];
                delete tadmins[sys.name(src).toLowerCase()];
                tadmins[newname] = desc;
                tours.touradmins = tadmins;
                saveTourKeys();
                sendBotAll(sys.name(src)+" passed their tour auth to "+toCorrectCase(newname)+"!",command == "passta" ? "~st" : sys.channelId("Indigo Plateau"),false);
                return true;
            }
            if (command == "dq") {
                var key = isInTour(commandData);
                if (key === false) {
                    sendBotMessage(src,"That player isn't in a tournament!",tourschan,false);
                    return true;
                }
                if (tours.tour[key].state == "signups") {
                    var index = tours.tour[key].players.indexOf(commandData.toLowerCase());
                    tours.tour[key].players.splice(index, 1);
                    tours.tour[key].cpt -= 1;
                    sendBotAll(toCorrectCase(commandData)+" was taken out of the tournament signups by "+sys.name(src)+" from the "+getFullTourName(key)+" tournament!", tourschan);
                }
                else {
                    sendBotAll(sys.name(src)+" disqualified "+toCorrectCase(commandData)+" from the "+getFullTourName(key)+" tournament!", tourschan, false);
                    disqualify(commandData.toLowerCase(), key, false, true);
                }
                addTourActivity(src);
                return true;
            }
            if (command == "cancelbattle") {
                var key = isInTour(commandData);
                if (key === false) {
                    sendBotMessage(src,"That player isn't in a tournament!",tourschan,false);
                    return true;
                }
                var lname = commandData.toLowerCase();
                var isBattling = tours.tour[key].battlers.hasOwnProperty(lname);
                if (!isBattling) {
                    sendBotMessage(src,"That player isn't battling for the tournament!",tourschan,false);
                    return true;
                }
                else {
                    var index = tours.tour[key].battlers[lname].battleId;
                    var opponent = null;
                    for (var o in tours.tour[key].battlers) {
                        if (tours.tour[key].battlers[o].battleId === index && !cmp(o, lname)) {
                            opponent = o;
                            break;
                        }
                    }
                    if (opponent === null) {
                        sendBotMessage(src,"That player isn't battling for the tournament!",tourschan,false);
                        return true;
                    }
                    sendBotAll(sys.name(src)+" voided the results of the battle between "+toCorrectCase(commandData)+" and "+toCorrectCase(opponent)+" in the "+getFullTourName(key)+" tournament, please rematch.", tourschan, false);
                    delete tours.tour[key].battlers[lname];
                    delete tours.tour[key].battlers[opponent];
                }
                addTourActivity(src);
                return true;
            }
            if (command == "sub") {
                var data = commandData.split(":",2);
                var newname = data[0].toLowerCase();
                var oldname = data[1].toLowerCase();
                var key = isInTour(oldname);
                if (sys.id(newname) === undefined) {
                    sendBotMessage(src,"It's not a good idea to sub a player in who isn't on the server at the moment!",tourschan,false);
                    return true;
                }
                if (key === false) {
                    sendBotMessage(src,"Your target doesn't exist in a tournament!",tourschan,false);
                    return true;
                }
                if (isInTour(newname) !== false) {
                    sendBotMessage(src,"Your target is already in a tournament!",tourschan,false);
                    return true;
                }
                tours.tour[key].players.splice(tours.tour[key].players.indexOf(oldname),1,newname);
                sendBotAll(sys.name(src)+" substituted "+toCorrectCase(newname)+" in place of "+toCorrectCase(oldname)+" in the "+getFullTourName(key)+" tournament.", tourschan, false);
                addTourActivity(src);
                return true;
            }
            if (command == "tourmute" || (command == "toursmute" && isTourOwner(src))) {
                var data = commandData.split(":", 3);
                var tar = data[0];
                var reason = data[1];
                var time = 900;
                if (data.length > 2) {
                    var time = converttoseconds(data[2]);
                }
                var ip = sys.dbIp(tar);
                if (sys.id(tar) !== undefined) {
                    if (isTourAdmin(sys.id(tar)) && sys.maxAuth(ip) >= sys.auth(src)) {
                        sendBotMessage(src,"Can't mute higher auth!",tourschan, false);
                        return true;
                    }
                }
                else {
                    if ((tours.touradmins.hasOwnProperty(tar.toLowerCase()) || sys.maxAuth(ip) >= 1) && sys.maxAuth(ip) >= sys.auth(src)) {
                        sendBotMessage(src,"Can't mute higher auth!",tourschan, false);
                        return true;
                    }
                }
                if (ip === undefined) {
                    sendBotMessage(src,"This person doesn't exist!",tourschan,false);
                    return true;
                }
                if (tours.tourmutes.hasOwnProperty(ip)) {
                    sendBotMessage(src,"They are already tourmuted!",tourschan,false);
                    return true;
                }
                if (reason === undefined) {
                    reason = "";
                }
                if (reason === "" && !isTourOwner(src)) {
                    sendBotMessage(src,"You must provide a reason!",tourschan, false);
                    return true;
                }
                if (time <= 0) {
                    sendBotMessage(src,"Can't tourmute someone for less than 1 second!",tourschan, false);
                    return true;
                }
                if (usingBadWords(reason)) {
                    sendBotMessage(src,"'"+reason+"' is not a valid reason!",tourschan,false);
                    return true;
                }
                var maxtime = 0;
                if (isTourOwner(src)) {
                    maxtime = Number.POSITIVE_INFINITY;
                }
                else if (isTourSuperAdmin(src) && sys.auth(src) >= 1) {
                    maxtime = 2592000;
                }
                else if (sys.auth(src) >= 1 || isTourSuperAdmin(src)) {
                    maxtime = 86400;
                }
                else {
                    maxtime = 3600;
                }
                if (isNaN(time)) {
                    time = 900;
                }
                if (time > maxtime) {
                    time = maxtime;
                }
                tours.tourmutes[ip] = {'expiry': parseInt(sys.time(), 10) + time, 'reason': reason, 'auth': sys.name(src), 'name': tar.toLowerCase()};
                var key = isInTour(tar);
                if (key !== false) {
                    if (tours.tour[key].state == "signups") {
                        var index = tours.tour[key].players.indexOf(tar.toLowerCase());
                        tours.tour[key].players.splice(index, 1);
                        tours.tour[key].cpt -= 1;
                        sendBotAll(toCorrectCase(tar)+" was taken out of the tournament signups by "+sys.name(src)+" from the "+getFullTourName(key)+" tournament!", tourschan, false);
                    }
                    else {
                        disqualify(tar.toLowerCase(), key, false, true);
                    }
                }
                if (command == "toursmute") {
                    sendBotAll(tar+" was tourmuted [secretly] by "+sys.name(src)+" for "+time_handle(time)+"! "+(reason !== "" ? "[Reason: "+reason+"]" : ""), sys.channelId("Indigo Plateau"), false);
                }
                else {
                    sendBotAll(tar+" was tourmuted by "+sys.name(src)+" for "+time_handle(time)+"! "+(reason !== "" ? "[Reason: "+reason+"]" : ""), "~st", false);
                }
                saveTourMutes();
                return true;
            }
            if (command == "tourunmute") {
                var ip = sys.dbIp(commandData);
                if (ip === undefined) {
                    sendBotMessage(src,"This person doesn't exist!",tourschan,false);
                    return true;
                }
                if (!tours.tourmutes.hasOwnProperty(ip)) {
                    sendBotMessage(src,"They aren't tourmuted!",tourschan,false);
                    return true;
                }
                if (ip === sys.ip(src) && !isTourOwner(src)) {
                    sendBotMessage(src,"You can't unmute yourself!",tourschan,false);
                    return true;
                }
                delete tours.tourmutes[ip];
                sendBotAll(commandData+" was untourmuted by "+sys.name(src)+"!", "~st", false);
                saveTourMutes();
                return true;
            }
            if (command == "tourmutes") {
                sys.sendMessage(src,"*** TOURS MUTELIST ***",tourschan);
                for (var t in tours.tourmutes) {
                    if (tours.tourmutes[t].expiry > parseInt(sys.time(), 10)) {
                        sys.sendMessage(src, tours.tourmutes[t].name + ": Set by "+tours.tourmutes[t].auth+"; expires in "+time_handle(tours.tourmutes[t].expiry-parseInt(sys.time(), 10))+"; reason: "+tours.tourmutes[t].reason, tourschan);
                    }
                }
                return true;
            }
            if (command == "viewstaffstats") {
                if (commandData === "") {
                    sendBotMessage(src, "Please specify a user", tourschan, false);
                    return;
                }
                var stats = tourstats.staff;
                var lname = commandData.toLowerCase();
                if (stats.hasOwnProperty(lname)) {
                    sys.sendMessage(src, "*** TOUR STAFF STATS for "+lname+" ***", tourschan);
                    var statfile = stats[lname];
                    for (var s in statfile) {
                        sys.sendMessage(src, s+": Started "+statfile[s].started+" times; actually ran "+statfile[s].run+" times", tourschan);
                    }
                }
                else {
                    sendBotMessage(src, "No data exists for this user", tourschan, false);
                }
                return true;
            }
            if (command == "config") {
                sys.sendMessage(src,"*** CURRENT CONFIGURATION ***",tourschan);
                sys.sendMessage(src,"Maximum Queue Length: "+tourconfig.maxqueue,tourschan);
                sys.sendMessage(src,"Maximum Number of Automatic Simultaneous Tours: "+tourconfig.maxrunning,tourschan);
                sys.sendMessage(src,"Tour Sign Ups Length: "+time_handle(tourconfig.toursignup),tourschan);
                sys.sendMessage(src,"Tour Auto DQ length: "+time_handle(tourconfig.tourdq),tourschan);
                sys.sendMessage(src,"Tour Activity Check: "+time_handle(tourconfig.activity),tourschan);
                sys.sendMessage(src,"Substitute Time: "+time_handle(tourconfig.subtime),tourschan);
                sys.sendMessage(src,"Tour Break Time: "+time_handle(tourconfig.tourbreak),tourschan);
                sys.sendMessage(src,"Absolute Tour Break Time: "+time_handle(tourconfig.abstourbreak),tourschan);
                sys.sendMessage(src,"Tour Reminder Time: "+time_handle(tourconfig.reminder),tourschan);
                sys.sendMessage(src,"Auto start when percentage of players is less than: "+tourconfig.minpercent+"%",tourschan);
                sys.sendMessage(src,"Minimum number of players: "+tourconfig.minplayers,tourschan);
                sys.sendMessage(src,"Decay Rate: "+tourconfig.decayrate+"%",tourschan);
                sys.sendMessage(src,"Decay Time: "+tourconfig.decaytime+" days",tourschan);
                sys.sendMessage(src,"Decay Global Rate: "+tourconfig.decayglobalrate+"%",tourschan);
                sys.sendMessage(src,"Same tier restrictions: "+tourconfig.norepeat+" tournaments",tourschan);
                sys.sendMessage(src,"Bot Name: "+tourconfig.tourbot,tourschan);
                sys.sendMessage(src,"Colour: "+tourconfig.tourbotcolour,tourschan);
                sys.sendMessage(src,"Channel: "+tourconfig.channel,tourschan);
                sys.sendMessage(src,"Error Channel: "+tourconfig.errchannel,tourschan);
                sys.sendMessage(src,"Scoring system activated: "+tourconfig.points,tourschan);
                sys.sendMessage(src,"Using winmessages: "+tourconfig.winmessages,tourschan);
                sys.sendMessage(src,"Debug: "+tourconfig.debug,tourschan);
                return true;
            }
            if (command == "configset") {
                var pos = commandData.indexOf(":");
                if (pos == -1) {
                    sys.sendMessage(src,"*** CONFIG SETTINGS ***",tourschan);
                    sys.sendMessage(src,"Usage: /configset [var]:[value]. Variable list and current values are below:",tourschan);
                    sys.sendMessage(src,"Example: '/configset maxqueue:3' will set the maximum queue length to 3:",tourschan);
                    sys.sendMessage(src,"maxqueue: "+tourconfig.maxqueue,tourschan);
                    sys.sendMessage(src,"maxrunning: "+tourconfig.maxrunning,tourschan);
                    sys.sendMessage(src,"toursignup: "+time_handle(tourconfig.toursignup),tourschan);
                    sys.sendMessage(src,"tourdq: "+time_handle(tourconfig.tourdq),tourschan);
                    sys.sendMessage(src,"touractivity: "+time_handle(tourconfig.activity),tourschan);
                    sys.sendMessage(src,"subtime: "+time_handle(tourconfig.subtime),tourschan);
                    sys.sendMessage(src,"breaktime: "+time_handle(tourconfig.tourbreak),tourschan);
                    sys.sendMessage(src,"absbreaktime: "+time_handle(tourconfig.abstourbreak),tourschan);
                    sys.sendMessage(src,"remindertime: "+time_handle(tourconfig.reminder),tourschan);
                    sys.sendMessage(src,"minpercent: "+tourconfig.minpercent,tourschan);
                    sys.sendMessage(src,"minplayers: "+tourconfig.minplayers,tourschan);
                    sys.sendMessage(src,"decayrate: "+tourconfig.decayrate,tourschan);
                    sys.sendMessage(src,"decaytime: "+tourconfig.decaytime,tourschan);
                    sys.sendMessage(src,"decayglobalrate: "+tourconfig.decayglobalrate,tourschan);
                    sys.sendMessage(src,"norepeat: "+tourconfig.norepeat,tourschan);
                    sys.sendMessage(src,"botname: "+tourconfig.tourbot,tourschan);
                    sys.sendMessage(src,"colour: "+tourconfig.tourbotcolour,tourschan);
                    sys.sendMessage(src,"channel: "+tourconfig.channel,tourschan);
                    sys.sendMessage(src,"scoring: "+tourconfig.points,tourschan);
                    sys.sendMessage(src,"winmessages: "+tourconfig.winmessages,tourschan);
                    sys.sendMessage(src,"debug: "+tourconfig.debug+" (to change this, type /debug [on/off])",tourschan);
                    return true;
                }
                var option = commandData.substr(0,pos).toLowerCase();
                var value;
                if (["botname", "bot name", "channel", "errchannel", "color", "colour", "debug", "winmessages"].indexOf(option) == -1) {
                    if (['minpercent', 'decayrate', 'decaytime', 'decayglobalrate'].indexOf(option) != -1) {
                        value = parseFloat(commandData.substr(pos+1));
                    }
                    else {
                        value = parseInt(commandData.substr(pos+1), 10);
                    }
                }
                else {
                    var value = commandData.substr(pos+1);
                }
                if (option == 'maxqueue' || option == "maximum queue length") {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value between 1 and 255 that determines the maximum queue length. Admins and owners can bypass this restriction.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.maxqueue,tourschan,false);
                        return true;
                    }
                    else if (value < 1 || value > 255) {
                        sendBotMessage(src,"Value must be between 1 and 255.",tourschan,false);
                        return true;
                    }
                    tourconfig.maxqueue = value;
                    sys.saveVal(configDir+"tourconfig.txt", "maxqueue", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the maximum queue length to "+tourconfig.maxqueue);
                    return true;
                }
                else if (option == 'maxrunning' || option == 'maximum number of simultaneous tours') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value between 1 and 255 that determines the maximum rumber of simultaneous tours.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.maxrunning,tourschan,false);
                        return true;
                    }
                    else if (value < 1 || value > 255) {
                        sendBotMessage(src,"Value must be between 1 and 255.",tourschan,false);
                        return true;
                    }
                    tourconfig.maxrunning = value;
                    sys.saveVal(configDir+"tourconfig.txt", "maxrunning", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the maximum number of simultaneous tours to "+tourconfig.maxrunning);
                    return true;
                }
                else if (option == 'toursignup' || option == 'tour sign ups length') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) between 10 and 600 that determines the intial signup length.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.toursignup,tourschan,false);
                        return true;
                    }
                    else if (value < 10 || value > 600) {
                        sendBotMessage(src,"Value must be between 10 and 600.",tourschan,false);
                        return true;
                    }
                    tourconfig.toursignup = value;
                    sys.saveVal(configDir+"tourconfig.txt", "toursignup", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the sign up time to "+time_handle(tourconfig.toursignup));
                    return true;
                }
                else if (option == 'tourdq' || option == 'tour auto dq length') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) between 30 and 300 that determines how long it is before inactive users are disqualified.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.tourdq,tourschan,false);
                        return true;
                    }
                    else if (value < 30 || value > 300) {
                        sendBotMessage(src,"Value must be between 30 and 300.",tourschan,false);
                        return true;
                    }
                    tourconfig.tourdq = value;
                    sys.saveVal(configDir+"tourconfig.txt", "tourdq", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the disqualification time to "+time_handle(tourconfig.tourdq));
                    return true;
                }
                else if (option == 'touractivity' || option == 'tour activity check') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) between 60 and 300 that determines how long it is from a user's last message before a user is considered inactive.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.activity,tourschan,false);
                        return true;
                    }
                    else if (value < 60 || value > 300) {
                        sendBotMessage(src,"Value must be between 60 and 300.",tourschan,false);
                        return true;
                    }
                    tourconfig.activity = value;
                    sys.saveVal(configDir+"tourconfig.txt", "touractivity", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the activity time to "+time_handle(tourconfig.activity));
                    return true;
                }
                else if (option == 'subtime' || option == 'substitute time') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) between 30 and 300 that determines how long it is before subs are disqualified.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.subtime,tourschan,false);
                        return true;
                    }
                    else if (value < 30 || value > 300) {
                        sendBotMessage(src,"Value must be between 30 and 300.",tourschan,false);
                        return true;
                    }
                    tourconfig.subtime = value;
                    sys.saveVal(configDir+"tourconfig.txt", "subtime", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the sub time to "+time_handle(tourconfig.subtime));
                    return true;
                }
                else if (option == 'breaktime' || option == 'tour break time') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) between 30 and 300 that determines how long it is before another tournament is started if one gets cancelled.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.tourbreak,tourschan,false);
                        return true;
                    }
                    else if (value < 30 || value > 300) {
                        sendBotMessage(src,"Value must be between 30 and 300.",tourschan,false);
                        return true;
                    }
                    tourconfig.tourbreak = value;
                    sys.saveVal(configDir+"tourconfig.txt", "breaktime", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the break time (betweeen cancelled tournaments) to "+time_handle(tourconfig.tourbreak));
                    return true;
                }
                else if (option == 'absbreaktime' || option == 'absolute tour break time') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) between 300 and 1800 that influences how long it is between tournaments starting. The actual time will depend on other factors.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.abstourbreak,tourschan,false);
                        return true;
                    }
                    else if (value < 300 || value > 1800) {
                        sendBotMessage(src,"Value must be between 300 and 1800.",tourschan,false);
                        return true;
                    }
                    tourconfig.abstourbreak = value;
                    sys.saveVal(configDir+"tourconfig.txt", "absbreaktime", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the absolute break time (base time between starting tours) to "+time_handle(tourconfig.abstourbreak));
                    return true;
                }
                else if (option == 'remindertime' || option == 'tour reminder time') {
                    if (isNaN(value)) {
                        sendBotMessage(src,"A value (in seconds) that determines how long it is before a battle reminder is sent to players from the start of the round",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.reminder,tourschan,false);
                        return true;
                    }
                    else if (value < 15 || value > (tourconfig.tourdq-30)) {
                        sendBotMessage(src,"Value must be between 15 and "+(tourconfig.tourdq-30)+".",tourschan,false);
                        return true;
                    }
                    tourconfig.reminder = value;
                    sys.saveVal(configDir+"tourconfig.txt", "remindertime", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the reminder time to "+time_handle(tourconfig.reminder));
                    return true;
                }
                else if (option == 'minpercent') {
                    if (!isTourSuperAdmin(src)) {
                        sendBotMessage(src,"Can't change this config setting, ask an admin for this.",tourschan,false);
                        return true;
                    }
                    if (isNaN(value)) {
                        sendBotMessage(src,"When the percentage of players drops below this value, a new tournament will start if possible. Overides maximum number of simultaneous tours.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.minpercent+"%",tourschan,false);
                        return true;
                    }
                    else if (value < 0 || value > 30) {
                        sendBotMessage(src,"Value must be between 0 and 30.",tourschan,false);
                        return true;
                    }
                    tourconfig.minpercent = value;
                    sys.saveVal(configDir+"tourconfig.txt", "minpercent", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the auto start percentage to "+tourconfig.minpercent+"%");
                    return true;
                }
                else if (option == 'norepeat') {
                    if (!isTourSuperAdmin(src)) {
                        sendBotMessage(src,"Can't change this config setting, ask an admin for this.",tourschan,false);
                        return true;
                    }
                    if (isNaN(value)) {
                        sendBotMessage(src,"Minimum number of tours that must run before another one of the same tier can run.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.norepeat+" tournaments.",tourschan,false);
                        return true;
                    }
                    else if (value < 0 || value > (sys.getTierList().length - 1)) {
                        sendBotMessage(src,"Value must be between 0 and "+(sys.getTierList().length - 1)+".",tourschan,false);
                        return true;
                    }
                    tourconfig.norepeat = value;
                    sys.saveVal(configDir+"tourconfig.txt", "norepeat", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the repeat limit to "+tourconfig.norepeat+" tournaments");
                    return true;
                }
                else if (option == 'minplayers') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change minimum number of players, ask a tour owner.",tourschan,false);
                        return true;
                    }
                    if (isNaN(value)) {
                        sendBotMessage(src,"Minimum muber of players required to start a tournament.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.minplayers,tourschan,false);
                        return true;
                    }
                    if (value < 3 || value > 255) {
                        sendBotMessage(src,"Value must be between 3 and 255.",tourschan,false);
                        return true;
                    }
                    tourconfig.minplayers = value;
                    sys.saveVal(configDir+"tourconfig.txt", "minplayers", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the minimum number of players to "+tourconfig.minplayers,tourschan,false);
                    return true;
                }
                else if (option == 'winmessages') {
                    if (!isTourSuperAdmin(src)) {
                        sendBotMessage(src,"Can't turn win messages on/off, ask an admin.",tourschan,false);
                        return true;
                    }
                    if (value === "") {
                        sendBotMessage(src,"Using winmessages.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.winmessages,tourschan,false);
                        return true;
                    }
                    if (value !== "off") {
                        value = "on";
                    }
                    tourconfig.winmessages = value === "off" ? false : true;
                    sys.saveVal(configDir+"tourconfig.txt", "winmessages", value);
                    sendBotAll(sys.name(src)+" "+(tourconfig.winmessages ? "enabled" : "disabled")+" custom win messages.",tourschan,false);
                    return true;
                }
                else if (option == 'color' || option == 'colour') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change the bot colour, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    else if (value.length !== 6) {
                        sendBotMessage(src,"String must be 6 hexnumbers long",tourschan,false);
                        return true;
                    }
                    for (var x=0;x<6;x++) {
                        var allowedchars = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
                        if (allowedchars.indexOf(value.charAt(x)) == -1) {
                            sendBotMessage(src,"There was an error with the colour code you tried to put in.",tourschan,false);
                            return true;
                        }
                    }
                    tourconfig.tourbotcolour = "#"+value;
                    sys.saveVal(configDir+"tourconfig.txt", "tourbotcolour", "#"+value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the tourbot colour to "+tourconfig.tourbotcolour,tourschan,false);
                    return true;
                }
                else if (option == 'botname' || option == 'bot name') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change the botname, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    else if (value.length === 0) {
                        sendBotMessage(src,"Botname can't be empty!",tourschan,false);
                        return true;
                    }
                    tourconfig.tourbot = value+" ";
                    sys.saveVal(configDir+"tourconfig.txt", "tourbot", value+" ");
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the tourbot name to "+tourconfig.tourbot,tourschan,false);
                    return true;
                }
                else if (option == 'channel') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change the channel, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    else if (!sys.existChannel(value)) {
                        sendBotMessage(src,"The channel needs to exist!",tourschan,false);
                        return true;
                    }
                    tourconfig.channel = value;
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the tournament channel to "+tourconfig.channel,tourschan,false);
                    tourschan = sys.channelId(tourconfig.channel);
                    sendChanAll("Version "+tourconfig.version+" of tournaments has been loaded successfully in this channel!", tourschan);
                    return true;
                }
                else if (option == 'scoring') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't turn scoring on/off, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    if (value !== 0 && value != 1) {
                        sendBotMessage(src,"Value must be 0 (turns debug off) or 1 (turns it on).",tourschan,false);
                        return true;
                    }
                    tourconfig.points = (value == 1 ? true : false);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the scoring mode to "+tourconfig.points,tourschan,false);
                    return true;
                }
                else if (option == 'debug') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't turn debug on/off, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    if (cmp(value, "on")) {
                        sendBotMessage(src,"You turned debug mode on!",tourschan,false);
                        tourconfig.debug = sys.name(src);
                        return true;
                    }
                    tourconfig.debug = false;
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" turned debug off.",tourschan,false);
                    return true;
                }
                else if (option == 'decayrate') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change this config setting, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    if (isNaN(value)) {
                        sendBotMessage(src,"Decay rate of seed rankings, in %.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.decayrate+"%",tourschan,false);
                        return true;
                    }
                    else if (value < 0 || value > 100) {
                        sendBotMessage(src,"Value must be between 0 and 100.",tourschan,false);
                        return true;
                    }
                    tourconfig.decayrate = value;
                    sys.saveVal(configDir+"tourconfig.txt", "decayrate", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the decay percentage to "+tourconfig.decayrate+"%");
                    return true;
                }
                else if (option == 'decaytime') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change this config setting, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    if (isNaN(value)) {
                        sendBotMessage(src,"Frequency of decay, in days.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.decaytime+" days",tourschan,false);
                        return true;
                    }
                    else if (value < 0 || value > 30) {
                        sendBotMessage(src,"Value must be between 0 and 30.",tourschan,false);
                        return true;
                    }
                    tourconfig.decaytime = value;
                    sys.saveVal(configDir+"tourconfig.txt", "decaytime", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the decay time to "+tourconfig.decaytime+" days.");
                    return true;
                }
                else if (option == 'decayglobalrate') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't change this config setting, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    if (isNaN(value)) {
                        sendBotMessage(src,"Global decay rate of seed rankings, in %.",tourschan,false);
                        sendBotMessage(src,"Current Value: "+tourconfig.decayglobalrate+"%",tourschan,false);
                        return true;
                    }
                    else if (value < 0 || value > 100) {
                        sendBotMessage(src,"Value must be between 0 and 100.",tourschan,false);
                        return true;
                    }
                    tourconfig.decayglobalrate = value;
                    sys.saveVal(configDir+"tourconfig.txt", "decayglobalrate", value);
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the global decay percentage to "+tourconfig.decayglobalrate+"%");
                    return true;
                }
                else {
                    sendBotMessage(src,"The configuration option '"+option+"' does not exist.",tourschan,false);
                    return true;
                }
            }
        }
        // Normal User Commands
        if (command == "join") {
            if (!sys.dbRegistered(sys.name(src))) {
                sendBotMessage(src, "You need to register to play in #"+sys.channel(tourschan)+"! Click on the 'Register' button below and follow the instructions!", tourschan, false);
                return true;
            }
            if (SESSION.users(src).mute.active) {
                sendBotMessage(src, "You are server muted so you are prohibited from playing!", tourschan, false);
                return true;
            }
            if (isTourMuted(src)) {
                sendBotMessage(src, "You are tourmuted so you are prohibited from playing!", tourschan, false);
                return true;
            }
            var key = null;
            for (var x in tours.tour) {
                if (tours.tour[x].state == "subround" || tours.tour[x].state == "signups") {
                    key = x;
                    break;
                }
            }
            if (key === null) {
                sendBotMessage(src, "No tournament has signups available at the moment!",tourschan,false);
                return true;
            }
            if (!sys.hasTier(src, tours.tour[key].tourtype)) {
                var needsteam = ["Challenge Cup", "Wifi CC 1v1", "CC 1v1", "Battle Factory", "Battle Factory 6v6"].indexOf(tours.tour[key].tourtype) == -1;
                sendBotMessage(src, "You need to "+(needsteam ? "have a team for" : "change your tier to")+" the "+tours.tour[key].tourtype+" tier to join!",tourschan,false);
                return true;
            }
            var isInCorrectGen = false;
            for (var x=0; x<sys.teamCount(src); x++) {
                if (sys.tier(src, x) === tours.tour[key].tourtype) {
                    if (tours.tour[key].parameters.gen != "default") {
                        var getGenParts = tours.tour[key].parameters.gen.split("-",2);
                        if (parseInt(sys.gen(src,x), 10) === parseInt(getGenParts[0], 10) && parseInt(sys.subgen(src,x), 10) === parseInt(getGenParts[1], 10)) {
                            isInCorrectGen = true;
                            break;
                        }
                    }
                    else {
                        isInCorrectGen = true;
                        break;
                    }
                }
            }
            if (sys.battling(src)) {
                sendBotMessage(src, "You can't join while battling! Finish your battle first!",tourschan,false);
                return true;
            }
            if (!isInCorrectGen) {
                sendBotMessage(src, "Your generation must be set to "+getSubgen(tours.tour[key].parameters.gen, true)+". Change it in the teambuilder.",tourschan,false);
                return true;
            }
            /* Is already in another tour */
            var isStillInTour = isInTour(sys.name(src));
            if (isStillInTour !== false) {
                if (tours.tour[isStillInTour].state == "subround" || tours.tour[isStillInTour].state == "signups") {
                    sendBotMessage(src, "You can't join twice!",tourschan,false);
                }
                else {
                    sendBotMessage(src, "You can't join two tournaments at once with the same name!",tourschan,false);
                }
                return true;
            }
            /* Multiple account check */
            for (var a=0; a<tours.tour[key].players.length; a++) {
                var joinedip = sys.dbIp(tours.tour[key].players[a]);
                if (sys.ip(src) == joinedip && sys.auth(src) < 3) {
                    sendBotMessage(src, "You already joined the tournament under the name '"+tours.tour[key].players[a]+"'!",tourschan,false);
                    return true;
                }
            }
            var joinlist = tours.tour[key].numjoins;
            if (joinlist.hasOwnProperty(sys.ip(src))) {
                if (joinlist[sys.ip(src)] > 2) {
                    sendBotMessage(src, "You can't join/unjoin more than 3 times!",tourschan,false);
                    return true;
                }
            }
            if (tours.tour[key].state == "signups") {
                tours.tour[key].players.push(sys.name(src).toLowerCase());
                tours.tour[key].cpt += 1;
                if (tours.tour[key].maxcpt !== undefined) {
                    if (tours.tour[key].cpt > tours.tour[key].maxcpt && tours.tour[key].maxplayers === "default") {
                        tours.tour[key].maxcpt = tours.tour[key].cpt;
                        if (tours.tour[key].maxcpt == 9) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/6);
                        }
                        else if (tours.tour[key].maxcpt == 17) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/4);
                            sendBotAll("Over 16 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time(), 10))+" to join!",0,true);
                        }
                        else if (tours.tour[key].maxcpt == 33) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/3);
                            sendBotAll("Over 32 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time(), 10))+" to join!",0,true);
                        }
                        else if (tours.tour[key].maxcpt == 65) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/2);
                            sendBotAll("Over 64 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time(), 10))+" to join!",0,true);
                        }
                        else if (tours.tour[key].maxcpt == 129) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/1.5);
                            sendBotAll("Over 128 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time(), 10))+" to join!",0,true);
                        }
                        else if (tours.tour[key].maxcpt == 257) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup);
                            sendBotAll("Over 256 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time(), 10))+" to join!",0,true);
                        }
                        else if (tours.tour[key].maxcpt == 513) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup*2);
                            sendBotAll("Over 512 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time(), 10))+" to join!",0,true);
                        }
                    }
                }
                if (tours.tour[key].maxplayers === "default") {
                    sendBotAll("<b>"+html_escape(sys.name(src))+"</b> is player #"+tours.tour[key].players.length+" to join the "+html_escape(getFullTourName(key))+" tournament! "+(tours.tour[key].time - parseInt(sys.time(), 10))+" second"+(tours.tour[key].time - parseInt(sys.time(), 10) == 1 ? "" : "s")+" remaining!", tourschan, true);
                    // 1024 players max
                    if (tours.tour[key].players.length >= 1024) {
                        tours.tour[key].time = parseInt(sys.time(), 10);
                    }
                }
                else {
                    sendBotAll("<b>"+html_escape(sys.name(src))+"</b> is player #"+tours.tour[key].players.length+" to join the "+html_escape(getFullTourName(key))+" tournament! "+(tours.tour[key].maxplayers - tours.tour[key].cpt)+" place"+(tours.tour[key].maxplayers - tours.tour[key].cpt == 1 ? "" : "s")+" remaining!", tourschan, true);
                    // end signups if maxplayers have been reached
                    if (tours.tour[key].players.length >= tours.tour[key].maxplayers) {
                        tours.tour[key].time = parseInt(sys.time(), 10);
                    }
                }
                if (joinlist.hasOwnProperty(sys.ip(src))) {
                    tours.tour[key].numjoins[sys.ip(src)] += 1;
                }
                else {
                    tours.tour[key].numjoins[sys.ip(src)] = 1;
                }
                return true;
            }
            /* subbing */
            var oldname = null;
            for (var n=1;n<=tours.tour[key].players.length;n++) {
                for (var k=0;k<tours.tour[key].players.length;k++) {
                    if (tours.tour[key].players[k] == "~Sub "+n+"~") {
                        oldname = "~Sub "+n+"~";
                        sendDebugMessage("Located Sub! Name: "+oldname, tourschan);
                        break;
                    }
                }
                if (oldname !== null) break;
            }

            for (var s=0;s<tours.tour[key].seeds.length;s++) {
                if (tours.tour[key].seeds[s] == sys.name(src).toLowerCase()) {
                    sendBotMessage(src, "You can't sub in to the "+getFullTourName(key)+" tournament!",tourschan, false);
                    return true;
                }
            }

            if (oldname === null) {
                sendBotMessage(src, "There are no subs remaining in the "+getFullTourName(key)+" tournament!",tourschan, false);
                return true;
            }
            var index = tours.tour[key].players.indexOf(oldname);
            var newname = sys.name(src).toLowerCase();
            tours.tour[key].players.splice(index,1,newname);
            tours.tour[key].seeds.splice(tours.tour[key].cpt,1,newname);
            tours.tour[key].cpt += 1;
            var oppname = index%2 === 0 ? toCorrectCase(tours.tour[key].players[index+1]) : toCorrectCase(tours.tour[key].players[index-1]);
            sendBotAll("Late entrant "+sys.name(src)+" will play against "+oppname+" in the "+getFullTourName(key)+" tournament. "+(tours.tour[key].players.length - tours.tour[key].cpt)+" sub"+(tours.tour[key].players.length - tours.tour[key].cpt == 1 ? "" : "s") + " remaining.", tourschan, false);
            sendBotMessage(sys.id(oppname),"Late entrant "+html_escape(sys.name(src))+" will play against you in the "+html_escape(getFullTourName(key))+" tournament.<ping/>", tourschan, true);
            markActive(src, "post");
            markActive(sys.id(oppname), "post");
            return true;
        }
        if (command == "unjoin") {
            var key = null;
            var atSignups = false;
            for (var x in tours.tour) {
                /*if (isInTour(sys.name(src)) === x && typeof tours.tour[x].maxplayers == "number" && tours.tour[x].round > 4 && tours.tour[x].state == "round") {
                    key = x;
                    break;
                }*/
                if (tours.tour[x].state == "signups") {
                    key = x;
                    atSignups = true;
                    break;
                }
            }
            if (key === null) {
                sendBotMessage(src, "You can't unjoin now!",tourschan,false);
                return true;
            }
            if (atSignups) {
                var index = tours.tour[key].players.indexOf(sys.name(src).toLowerCase());
                if (index == -1) {
                    sendBotMessage(src, "You aren't in the "+getFullTourName(key)+" tournament!",tourschan,false);
                    return true;
                }
                tours.tour[key].players.splice(index, 1);
                tours.tour[key].cpt -= 1;
                sendBotAll(sys.name(src)+" unjoined the "+getFullTourName(key)+" tournament!", tourschan, false);
            }
            else {
                sendBotAll(sys.name(src)+" resigned from the "+getFullTourName(key)+" tournament!", tourschan, false);
                disqualify(sys.name(src).toLowerCase(), key, false, true);
            }
            return true;
        }
        if (command == "queue" || command == "viewqueue") {
            var queue = tours.queue;
            sys.sendMessage(src, "*** Upcoming Tours ***", tourschan);
            var nextstart = time_handle(tours.globaltime - parseInt(sys.time(), 10));
            for (var x in tours.tour) {
                if (tours.tour[x].state == "signups") {
                    nextstart = "Pending";
                    break;
                }
            }
            if ((tourconfig.maxrunning <= tours.keys.length && calcPercentage() >= tourconfig.minpercent) || tours.globaltime <= 0) {
                nextstart = "Pending";
            }
            var firsttour = true;
            if (queue.length === 0) {
                sys.sendMessage(src, "No tournaments in the queue.", tourschan);
            }
            for (var e in queue) {
                var queuedata = queue[e];
                var params = queuedata.parameters;
                var wifiuse = "default";
                if ((sys.getClauses(queuedata.tier)%256 >= 128 && !params.wifi) || (sys.getClauses(queuedata.tier)%256 < 128 && params.wifi)) {
                    wifiuse = params.wifi ? "Preview Mode" : "No Preview Mode";
                }
                if (firsttour && nextstart != "Pending" && !(params.event && tours.keys.length > 0) && tours.working) {
                    sys.sendMessage(src,"1) "+queuedata.tier+": Set by "+queuedata.starter+"; Parameters: "+params.mode+" Mode"+(params.gen != "default" ? "; Gen: "+getSubgen(params.gen,true) : "")+(params.type == "double" ? "; Double Elimination" : "")+(!isNaN(parseInt(params.maxplayers, 10)) ? "; For "+ params.maxplayers +" players": "")+(wifiuse != "default" ? "; "+wifiuse : "")+(params.event ? "; Event Mode": "")+"; Starts in "+time_handle(tours.globaltime-parseInt(sys.time(), 10)),tourschan);
                }
                else {
                    sys.sendMessage(src,(parseInt(e, 10)+1)+") "+queuedata.tier+": Set by "+queuedata.starter+"; Parameters: "+params.mode+" Mode"+(params.gen != "default" ? "; Gen: "+getSubgen(params.gen,true) : "")+(params.type == "double" ? "; Double Elimination" : "")+(!isNaN(parseInt(params.maxplayers, 10)) ? "; For "+ params.maxplayers +" players": "")+(wifiuse != "default" ? "; "+wifiuse : "")+(params.event ? "; Event Mode": ""), tourschan);
                }
                firsttour = false;
            }
            return true;
        }
        if (command == "viewround" || command == "iom" || command == "ipm") {
            if (tours.keys.length === 0) {
                sendBotMessage(src, "No tournament is running at the moment!",tourschan, false);
                return true;
            }
            var postedrounds = false;
            var rounddata = [];
            for (var y in tours.tour) {
                var battlers = tours.tour[y].battlers;
                var winners = tours.tour[y].winners;
                if (tours.tour[y].round === 0) continue;
                postedrounds = true;
                var roundtable = "<div style='margin-left: 50px'><b>Round "+tours.tour[y].round+" of the "+tours.tour[y].tourtype+" Tournament</b><table><br/>";
                for (var x=0; x<tours.tour[y].players.length; x+=2) {
                    if (winners.indexOf(tours.tour[y].players[x]) != -1 && tours.tour[y].players[x] != "~Bye~" && tours.tour[y].players[x] != "~DQ~") {
                        if (command == "viewround")
                            roundtable = roundtable + "<tr><td align='right'><font color=green><b>"+toTourName(tours.tour[y].players[x]) +"</b></font></td><td align='center'> won against </td><td>"+ toTourName(tours.tour[y].players[x+1])+"</td></tr>";
                    }
                    else if (winners.indexOf(tours.tour[y].players[x+1]) != -1 && tours.tour[y].players[x+1] != "~Bye~" && tours.tour[y].players[x+1] != "~DQ~") {
                        if (command == "viewround")
                            roundtable = roundtable + "<tr><td align='right'><font color=green><b>"+toTourName(tours.tour[y].players[x+1]) +"</b></font></td><td align='center'> won against </td><td>"+ toTourName(tours.tour[y].players[x])+"</td></tr>";
                    }
                    else if (battlers.hasOwnProperty(tours.tour[y].players[x])) {
                        if (command != "ipm") {
                            var elapsedtime = parseTimer(parseInt(sys.time(), 10)-battlers[tours.tour[y].players[x]].time);
                            roundtable = roundtable + "<tr><td align='right'>"+toTourName(tours.tour[y].players[x]) +"</td><td align='center'> "+(isInSpecificTour(sys.name(src), y) || (battlers[tours.tour[y].players[x]].noSpecs && !isTourAdmin(src)) ? "is battling" : "<a href='po:watch/"+battlers[tours.tour[y].players[x]].battleId+"'>is battling</a>")+" </td><td>"+ toTourName(tours.tour[y].players[x+1])+"</td><td> ["+elapsedtime+"]</td></tr>";
                        }
                    }
                    else {
                        if (command != "iom")
                            roundtable = roundtable + "<tr><td align='right'>"+toTourName(tours.tour[y].players[x]) +"</td><td align='center'> VS </td><td>"+ toTourName(tours.tour[y].players[x+1])+"</td></tr>";
                    }
                }
                rounddata.push(roundtable+"</table></div>");
            }
            if (!postedrounds) {
                sendBotMessage(src, "No tournament is running at the moment!",tourschan,false);
                return true;
            }
            else {
                var roundstosend = htmlborder+rounddata.join(htmlborder)+htmlborder;
                sys.sendHtmlMessage(src, roundstosend, tourschan);
            }
            return true;
        }
        if (command == "viewstats") {
            sys.sendMessage(src,"*** TOUR STATS ***",tourschan);
            var gstats = tourstats.general;
            var totalplayers = 0;
            var totaltours = 0;
            for (var x in gstats) {
                sys.sendMessage(src, x+": Played "+gstats[x].played+" times; average of "+Math.floor(gstats[x].players/gstats[x].played)+" players per tournament.", tourschan);
                totalplayers += gstats[x].players;
                totaltours += gstats[x].played;
            }
            sys.sendMessage(src, "", tourschan);
            sys.sendMessage(src, "Overall: Played "+totaltours+" tours; total of "+totalplayers+" places.", tourschan);
            return true;
        }
        if (command == "viewseeds") {
            var thetier = find_tier(commandData);
            if (commandData === "") {
                sendBotMessage(src, "Please specify a tier", tourschan, false);
                return;
            }
            if (thetier === null) {
                sendBotMessage(src,"No such tier exists.",tourschan,false);
                return true;
            }
            var seeddata = tstats.getseeds();
            if (!seeddata.hasOwnProperty(thetier)) {
                sendBotMessage(src,"No data exists.",tourschan,false);
                return true;
            }
            var htmltosend = "<table><tr><th colspan=3>Tour seeds for "+html_escape(thetier)+"</th></tr><tr><th>Name</th><th>Seed Points</th><th>Decays in</th></tr>";
            var seedstats = seeddata[thetier];
            var endarray = [];
            for (var x in seedstats) {
                endarray.push([x, seedstats[x].points, time_handle(tourconfig.decaytime*24*60*60-(parseInt(sys.time(), 10)-seedstats[x].lastwin))]);
            }
            endarray.sort(function(a,b) {return b[1]-a[1];});
            for (var z=0; z<32; z++) {
                if (endarray.length <= z) break;
                htmltosend = htmltosend+"<tr><td>"+html_escape(endarray[z][0])+"</td><td>"+(Math.round(endarray[z][1]*10)/10)+"</td><td>"+endarray[z][2]+"</td></tr>";
            }
            sys.sendHtmlMessage(src, htmltosend+"</table>", tourschan);
            return true;
        }
        if (command == "touradmins" || command == "megausers") {
            sys.sendMessage(src, "",tourschan);
            sys.sendMessage(src, "*** TOURNAMENT STAFF ***",tourschan);
            var tal = tours.touradmins;
            var tos = [];
            var tas = [];
            var mus = [];
            var hidden = [];
            for (var l in tal) {
                if (tal[l] == "to") {
                    tos.push(l);
                }
                else if (tal[l] == "ta") {
                    tas.push(l);
                }
                else if (tal[l] == "hidden") {
                    hidden.push(l);
                }
                else {
                    mus.push(l);
                }
            }
            tos.sort();
            tas.sort();
            mus.sort();
            hidden.sort();
            sys.sendMessage(src, "",tourschan);
            sys.sendMessage(src, "*** TOURNAMENT OWNERS ***",tourschan);
            for (var o in tos) {
                if (sys.isInChannel(sys.id(tos[o]), tourschan)) {
                    sys.sendMessage(src, toCorrectCase(tos[o]) + " (Online):",tourschan);
                }
                else {
                    sys.sendMessage(src, tos[o],tourschan);
                }
            }
            if (isTourOwner(src)) {
                sys.sendMessage(src, "",tourschan);
                sys.sendMessage(src, "*** HIDDEN STAFF ***",tourschan);
                for (var h in hidden) {
                    sys.sendMessage(src, hidden[h],tourschan);
                }
            }
            sys.sendMessage(src, "",tourschan);
            sys.sendMessage(src, "*** TOURNAMENT ADMINS ***",tourschan);
            for (var a in tas) {
                if (sys.isInChannel(sys.id(tas[a]), tourschan)) {
                    sys.sendMessage(src, toCorrectCase(tas[a]) + " (Online):",tourschan);
                }
                else {
                    sys.sendMessage(src, tas[a],tourschan);
                }
            }
            sys.sendMessage(src, "",tourschan);
            sys.sendMessage(src, "*** MEGAUSERS ***",tourschan);
            for (var m in mus) {
                if (sys.isInChannel(sys.id(mus[m]), tourschan)) {
                    sys.sendMessage(src, toCorrectCase(mus[m]) + " (Online):",tourschan);
                }
                else {
                    sys.sendMessage(src, mus[m],tourschan);
                }
            }
            sys.sendMessage(src, "",tourschan);
            return true;
        }
        if (command == "tourinfo") {
            var table = tstats.getwinners(commandData.toLowerCase());
            if (table === "") {
                sendBotMessage(src,commandData+" has no tournament wins yet!",tourschan,false);
            }
            else {
                sys.sendHtmlMessage(src, table, tourschan);
            }
            return true;
        }
        if (command == "activeta") {
            sys.sendMessage(src, "",tourschan);
            sys.sendMessage(src, "*** ACTIVE TOURNAMENT ADMINS ***",tourschan);
            var tal = tours.touradmins;
            for (var l in tal) {
                if (sys.id(l) !== undefined && SESSION.users(sys.id(l)).lastline.time + tourconfig.activity*3 > parseInt(sys.time(), 10)) {
                    sys.sendMessage(src, toCorrectCase(l), tourschan);
                }
            }
            sys.sendMessage(src, "",tourschan);
            return true;
        }
        if (command == "history") {
            sys.sendMessage(src, "*** RECENTLY PLAYED TIERS ***",tourschan);
            for (var x in tours.history) {
                sys.sendMessage(src, tours.history[x],tourschan);
            }
            return true;
        }
        if (command == "help" || command == "commands") {
            var type = commandData.toLowerCase();
            var headersent = false;
            var sendHeader = function() {
                if (!headersent) {
                    sys.sendMessage(src, border,tourschan);
                    sys.sendMessage(src, "*** Tournament Commands ***",tourschan);
                    headersent = true;
                }
            };
            if (type === "" || type == "tournament") {
                sendHeader();
                for (var t in tourcommands) {
                    sys.sendMessage(src, tourcommands[t],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (isTourAdmin(src) && (type == "mod" || type == "megauser" || type === "")) {
                sendHeader();
                for (var m in tourmodcommands) {
                    sys.sendMessage(src, tourmodcommands[m],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (isTourSuperAdmin(src) && (type == "admin" || type === "")) {
                sendHeader();
                for (var a in touradmincommands) {
                    sys.sendMessage(src, touradmincommands[a],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (isTourOwner(src) && (type == "owner" || type === "")) {
                sendHeader();
                for (var o in tourownercommands) {
                    sys.sendMessage(src, tourownercommands[o],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (headersent) return true;
        }
        if (command == "rules" || command == "tourrules") {
            sys.sendMessage(src, border,tourschan);
            for (var t in tourrules) {
                sys.sendMessage(src, tourrules[t],tourschan);
            }
            sys.sendMessage(src, border,tourschan);
            return true;
        }
        if (command == "monthlyleaderboard" || command == "leaderboard") {
            var month = false;
            var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
            var mindex = themonths.indexOf(commandData.toLowerCase());
            if (mindex > -1) {
                month = mindex;
            }
            if (month === false) {
                var date = new Date();
                var mindex = date.getMonth();
            }
            tstats.rankings(src, "", false, mindex);
            return true;
        }
        if (command == "eventleaderboard") {
            tstats.erankings(src, false, commandData);
            return true;
        }
        if (command == "eventinfo") {
            var etable = tstats.geteventwinners(commandData.toLowerCase());
            if (etable === "") {
                sendBotMessage(src,commandData+" has no significant event results yet!",tourschan,false);
            }
            else {
                sys.sendHtmlMessage(src, etable, tourschan);
            }
            return true;
        }
    }
    catch (err) {
        sendChanAll("Error in Tournament Command '"+command+"': "+err, tourserrchan);
    }
    return false;
}

// Auto DQs inactive players
function removeinactive(key) {
    try {
        sendDebugMessage("Removing Inactive Players", tourschan);
        var activelist = tours.tour[key].active;
        var playercycle = tours.tour[key].players.length;
        var currentround = tours.tour[key].round;
        for (var z=0;z<playercycle;z+=2) {
            var player1 = tours.tour[key].players[z];
            var player2 = tours.tour[key].players[z+1];
            var dq1 = true;
            var dq2 = true;
            if (tours.tour[key].winners.indexOf(player1) != -1) {
                sendDebugMessage(player1+" won against "+player2+"; continuing", tourschan);
                continue;
            }
            if (tours.tour[key].winners.indexOf(player2) != -1) {
                sendDebugMessage(player2+" won against "+player1+"; continuing", tourschan);
                continue;
            }
            if (tours.tour[key].battlers.hasOwnProperty(player1) || tours.tour[key].battlers.hasOwnProperty(player2)) {
                sendDebugMessage(player1+" is battling against "+player2+"; continuing", tourschan);
                continue;
            }
            if (player1 == "~DQ~" || player2 == "~DQ~" || player1 == "~Bye~" || player2 == "~Bye~") {
                sendDebugMessage("We don't need to check", tourschan);
                continue;
            }
            if (activelist.hasOwnProperty(player1)) {
                if (activelist[player1] == "Battle" || (typeof activelist[player1] == "number" && activelist[player1]+tourconfig.activity >= parseInt(sys.time(), 10))) {
                    sendDebugMessage(player1+" is active; continuing", tourschan);
                    dq1 = false;
                }
            }
            else if (sys.id(player1) !== undefined && sys.id(player2) === undefined) {
                dq1 = false;
                sendDebugMessage(player1+"'s opponent is offline; continuing", tourschan);
            }
            else if (sys.hasTier(sys.id(player1), tours.tour[key].tourtype) && !sys.hasTier(sys.id(player2), tours.tour[key].tourtype)) {
                dq1 = false;
                sendDebugMessage(player1+"'s opponent does not have a team; continuing", tourschan);
            }
            else if (!sys.away(sys.id(player1)) && sys.away(sys.id(player2))) {
                dq1 = false;
                sendDebugMessage(player1+"'s opponent is idle; continuing", tourschan);
            }
            else {
                sendDebugMessage(player1+" is not active; disqualifying", tourschan);
            }
            if (activelist.hasOwnProperty(player2)) {
                if (activelist[player2] == "Battle" || (typeof activelist[player2] == "number" && activelist[player2]+tourconfig.activity >= parseInt(sys.time(), 10))) {
                    sendDebugMessage(player2+" is active; continuing", tourschan);
                    dq2 = false;
                }
            }
            else if (sys.id(player2) !== undefined && sys.id(player1) === undefined) {
                dq2 = false;
                sendDebugMessage(player2+"'s opponent is offline; continuing", tourschan);
            }
            else if (sys.hasTier(sys.id(player2), tours.tour[key].tourtype) && !sys.hasTier(sys.id(player1), tours.tour[key].tourtype)) {
                dq2 = false;
                sendDebugMessage(player2+"'s opponent does not have a team; continuing", tourschan);
            }
            else if (!sys.away(sys.id(player2)) && sys.away(sys.id(player1))) {
                dq2 = false;
                sendDebugMessage(player2+"'s opponent is idle; continuing", tourschan);
            }
            else {
                sendDebugMessage(player2+" is not active; disqualifying", tourschan);
            }
            if (dq1 && dq2) {
                sendAuthPlayers(flashtag+html_escape(toCorrectCase(player1))+flashtag+" and "+flashtag+html_escape(toCorrectCase(player2))+flashtag+" are both disqualified for inactivity in the "+html_escape(getFullTourName(key))+" tournament!", key);
                dqboth(player1, player2, key);
            }
            else if (dq2) {
                sendAuthPlayers(flashtag+html_escape(toCorrectCase(player2))+flashtag+" was disqualified from the "+html_escape(getFullTourName(key))+" tournament for inactivity!", key);
                disqualify(player2,key,false,false);
            }
            else if (dq1) {
                sendAuthPlayers(flashtag+html_escape(toCorrectCase(player1))+flashtag+" was disqualified from the "+html_escape(getFullTourName(key))+" tournament for inactivity!", key);
                disqualify(player1,key,false,false);
            }
            else if ((tours.tour[key].time-parseInt(sys.time(), 10))%60 === 0){
                sendAuthPlayers(flashtag+html_escape(toCorrectCase(player1))+flashtag+" and "+flashtag+html_escape(toCorrectCase(player2))+flashtag+" are both active, please battle in the "+html_escape(getFullTourName(key))+" tournament ASAP!", key);
            }
            // if the round advances due to DQ, don't keep checking :x
            if (!tours.tour.hasOwnProperty(key)) {
                break;
            }
            if (tours.tour[key].round !== currentround) {
                break;
            }
        }
    }
    catch (err) {
        sendChanAll("Error in process 'removeinactive': "+err, tourserrchan);
    }
}

// Sends battle reminders
function sendReminder(key) {
    try {
        for (var z=0;z<tours.tour[key].players.length;z++) {
            var player = tours.tour[key].players[z];
            var opponent = z%2 === 0 ? tours.tour[key].players[z+1] : tours.tour[key].players[z-1];
            if (tours.tour[key].winners.indexOf(player) != -1) {
                continue;
            }
            if (tours.tour[key].winners.indexOf(opponent) != -1) {
                continue;
            }
            if (tours.tour[key].battlers.hasOwnProperty(player)) {
                continue;
            }
            var activelist = tours.tour[key].active;
            if ((isSub(player) || isSub(opponent)) && sys.id(player) !== undefined) {
                sendBotMessage(sys.id(player), "Your sub will be disqualified in "+time_handle(tours.tour[key].time-parseInt(sys.time(), 10)), tourschan, false);
            }
            else if (sys.id(player) !== undefined) {
                var msg = "<ping/><font color=red>"+html_escape(toCorrectCase(player))+", you must battle <b>"+(z%2 === 0 ? html_escape(toCorrectCase(tours.tour[key].players[z+1])) : html_escape(toCorrectCase(tours.tour[key].players[z-1])))+"</b> in the <b>"+html_escape(getFullTourName(key))+"</b> tournament, otherwise you may be disqualified for inactivity! You should talk to your opponent in #"+sys.channel(tourschan)+" to avoid disqualification - if they are not on, post a message in tournaments about it and contact a megauser if necessary.</font>";
                var activemsg = "<ping/>"+html_escape(toCorrectCase(player))+", this is a reminder to battle <b>"+(z%2 === 0 ? html_escape(toCorrectCase(tours.tour[key].players[z+1])) : html_escape(toCorrectCase(tours.tour[key].players[z-1])))+"</b> in the <b>"+html_escape(getFullTourName(key))+"</b> tournament. You should talk to your opponent in #"+sys.channel(tourschan)+" ASAP - if they are not on, post a message in tournaments about it and contact a megauser if necessary.";
                var active = activelist.hasOwnProperty(player);
                if (sys.isInChannel(sys.id(player), tourschan)) {
                    sendBotMessage(sys.id(player), active ? activemsg : msg, tourschan, true);
                }
                else {
                    sendBotMessage(sys.id(player), msg, "all", true);
                    sendBotMessage(sys.id(player), "Please rejoin the #"+tourconfig.channel+" channel to ensure you do not miss out on information you need!", "all", false);
                }
            }
        }
    }
    catch (err) {
        sendChanAll("Error in process 'sendReminder': "+err, tourserrchan);
    }
}

// Disqualifies a single player
function disqualify(player, key, silent, hard) {
    try {
        if (tours.tour[key].players.indexOf(player) == -1) {
            return;
        }
        var index = tours.tour[key].players.indexOf(player);
        var winnerindex = tours.tour[key].winners.indexOf(player);
        var opponent;
        if (index%2 == 1) {
            opponent = tours.tour[key].players[index-1];
        }
        else {
            opponent = tours.tour[key].players[index+1];
        }
        /* If the opponent is disqualified/is a sub we want to replace with ~Bye~ instead of ~DQ~ so brackets don't stuff up */
        if (opponent == "~DQ~") {
            tours.tour[key].players.splice(index,1,"~Bye~");
        }
        else {
            tours.tour[key].players.splice(index,1,"~DQ~");
        }
        // splice from brackets as well in double elim
        if (hard && tours.tour[key].parameters.type == "double" && tours.tour[key].round >= 2) {
            var winindex = tours.tour[key].winbracket.indexOf(player);
            var opponent1;
            if (winindex != -1) {
                if (winindex%2 == 1) {
                    opponent1 = tours.tour[key].winbracket[winindex-1];
                }
                else {
                    opponent1 = tours.tour[key].winbracket[winindex+1];
                }
                /* If the opponent is disqualified/is a sub we want to replace with ~Bye~ instead of ~DQ~ so brackets don't stuff up */
                if (opponent1 == "~DQ~") {
                    tours.tour[key].winbracket.splice(winindex,1,"~Bye~");
                }
                else {
                    tours.tour[key].winbracket.splice(winindex,1,"~DQ~");
                }
            }
            var loseindex = tours.tour[key].losebracket.indexOf(player);
            if (loseindex != -1) {
                var opponent2;
                if (loseindex%2 == 1) {
                    opponent2 = tours.tour[key].losebracket[loseindex-1];
                }
                else {
                    opponent2 = tours.tour[key].losebracket[loseindex+1];
                }
                /* If the opponent is disqualified/is a sub we want to replace with ~Bye~ instead of ~DQ~ so brackets don't stuff up */
                if (opponent2 == "~DQ~") {
                    tours.tour[key].losebracket.splice(loseindex,1,"~Bye~");
                }
                else {
                    tours.tour[key].losebracket.splice(loseindex,1,"~DQ~");
                }
            }
        }
        /* We then check if opponent hasn't advanced, and advance them if they're not disqualified. We also remove player from winners if DQ'ed */
        if (opponent != "~DQ~" && winnerindex == -1 && tours.tour[key].winners.indexOf(opponent) == -1) {
            if (!isSub(opponent) && opponent != "~Bye~") {
                tours.tour[key].winners.push(opponent);
                tours.tour[key].losers.push(player);
                if (!silent) {
                    sendAuthPlayers(flashtag+html_escape(toCorrectCase(opponent))+flashtag+" advances to the next round of the "+html_escape(getFullTourName(key))+" by default!", key);
                }
            }
            else {
                tours.tour[key].winners.push("~Bye~");
                tours.tour[key].losers.push(player);
            }
        }
        else if (winnerindex != -1 && opponent != "~Bye~" && opponent != "~DQ~" && (isInTour(opponent) === false || isInTour(opponent) === key)) { /* This is just so the winners list stays the same length */
            tours.tour[key].winners.splice(winnerindex,1,opponent);
            tours.tour[key].losers.splice(tours.tour[key].losers.indexOf(opponent),1,player);
            if (!silent) {
                sendAuthPlayers(flashtag+html_escape(toCorrectCase(opponent))+flashtag+" advances to the next round of the "+html_escape(getFullTourName(key))+" because "+html_escape(toCorrectCase(player))+" was disqualified!", key);
            }
        }
        var battlesleft = parseInt(tours.tour[key].players.length/2, 10)-tours.tour[key].winners.length;
        save_cache();
        if (battlesleft <= 0) {
            if (tours.tour[key].state == "subround") removesubs(key);
            advanceround(key);
        }
    }
    catch (err) {
        sendChanAll("Error in process 'disqualify': "+err, tourserrchan);
    }
}

// for when both players are inactive
function dqboth(player1, player2, key) {
    try {
        var index1 = tours.tour[key].players.indexOf(player1);
        tours.tour[key].players.splice(index1,1,"~DQ~");
        var index2 = tours.tour[key].players.indexOf(player2);
        tours.tour[key].players.splice(index2,1,"~DQ~");
        tours.tour[key].losers.push(player1, player2);
        tours.tour[key].winners.push("~DQ~");
        var battlesleft = parseInt(tours.tour[key].players.length/2, 10)-tours.tour[key].winners.length;
        save_cache();
        if (battlesleft <= 0) {
            if (tours.tour[key].state == "subround") removesubs(key);
            advanceround(key);
        }
    }
    catch (err) {
        sendChanAll("Error in process 'dqboth': "+err, tourserrchan);
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
                disqualify(tours.tour[key].players[x],key,true,false);
                if (x%2 === 0) {
                    opponent = tours.tour[key].players[x+1];
                }
                else {
                    opponent = tours.tour[key].players[x-1];
                }
                if (!isSub(opponent) && opponent != "~DQ~" && opponent != "~Bye~" && opponent !== null) {
                    advanced.push(toCorrectCase(opponent));
                }
                if (tours.tour[key].round !== 1) {
                    break;
                }
            }
        }
        tours.tour[key].state = "round";
        if (advanced.length > 0) {
            sendBotAll(advanced.join(", ")+(advanced.length == 1 ? " advances" : " advance")+" to the next round! Subs are now gone.", tourschan, false);
        }
    }
    catch (err) {
        sendChanAll("Error in process 'removesubs' for player "+tours.tour[key].players[x]+": "+err, tourserrchan);
    }
}

// removes byes
function removebyes(key) {
    try {
        var advanced = [];
        var playercycle = tours.tour[key].players.length;
        var currentround = tours.tour[key].round;
        var opponent = null;
        for (var z=0;z<playercycle;z+=2) {
            opponent = null;
            if (tours.tour[key].players[z] == "~Bye~" && tours.tour[key].players[z+1] == "~Bye~") {
                dqboth("~Bye~","~Bye~",key);
            }
            else if (tours.tour[key].players[z] == "~Bye~") {
                opponent = tours.tour[key].players[z+1];
                disqualify("~Bye~",key,true,false);
            }
            else if (tours.tour[key].players[z+1] == "~Bye~") {
                opponent = tours.tour[key].players[z];
                disqualify("~Bye~",key,true,false);
            }
            if (!isSub(opponent) && opponent != "~DQ~" && opponent != "~Bye~" && opponent !== null) {
                advanced.push(html_escape(toCorrectCase(opponent)));
            }
            // if the round advances due to DQ, don't keep checking :x
            if (!tours.tour.hasOwnProperty(key)) {
                break;
            }
            if (tours.tour[key].round !== currentround) {
                break;
            }
        }
        if (advanced.length > 0) {
            sendAuthPlayers(advanced.join(", ")+(advanced.length == 1 ? " advances" : " advance")+" to the next round due to a bye!", key);
        }
    }
    catch (err) {
        sendChanAll("Error in process 'removebyes': "+err, tourserrchan);
    }
}

function battleend(winner, loser, key) {
    try {
        var winname = sys.name(winner).toLowerCase();
        var losename = sys.name(loser).toLowerCase();
        /* We need to check if winner/loser is in the Winners List */
        if (tours.tour[key].winners.indexOf(winname) != -1 || tours.tour[key].winners.indexOf(losename) != -1) {
            return;
        }
        tours.tour[key].winners.push(winname);
        tours.tour[key].losers.push(losename);
        var battlesleft = parseInt(tours.tour[key].players.length/2, 10)-tours.tour[key].winners.length;
        if (tours.tour[key].parameters.type == "double") {
            if (tourwinmessages === undefined || tourwinmessages.length === 0 || !tourconfig.winmessages) {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> won against <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key);
            }
            else {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> "+tourwinmessages[sys.rand(0, tourwinmessages.length)]+" <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key);
            }
            if (tours.tour[key].losebracket.indexOf(losename) != -1) {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font> <b>"+html_escape(sys.name(loser))+"</b> has lost twice and is now out of the "+getFullTourName(key)+" tournament!", key);
            }
        }
        else {
            if (tourwinmessages === undefined || tourwinmessages.length === 0 || !tourconfig.winmessages) {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> won against <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament and advances to the next round! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key);
            }
            else {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> "+tourwinmessages[sys.rand(0, tourwinmessages.length)]+" <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament and advances to the next round! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key);
            }
        }
        if (battlesleft <= 0) {
            advanceround(key);
        }
    }
    catch (err) {
        sendChanAll("Error in evaluating end of battle results: "+err, tourserrchan);
    }
}

// advances the round
function advanceround(key) {
    try {
        var newlist = [];
        var winners = tours.tour[key].winners;
        var round = tours.tour[key].round;
        var type = tours.tour[key].tourtype;
        var mplayers = tours.tour[key].cpt;
        var cplayers = tours.tour[key].players.length;
        var cdate = tours.tour[key].date;
        var bannednames = ["~Bye~", "~DQ~"];
        var doubleelim = tours.tour[key].parameters.type == "double" ? true : false;
        var newwinbracket = [];
        var newlosebracket = [];
        if (doubleelim) {
            if (tours.tour[key].round == 1) {
                for (var x=0;x<cplayers;x+=2) {
                    if (winners.indexOf(tours.tour[key].players[x]) > -1 && bannednames.indexOf(tours.tour[key].players[x]) == -1) {
                        newwinbracket.push(tours.tour[key].players[x]);
                        newlosebracket.push(tours.tour[key].players[x+1]);
                    }
                    else if (winners.indexOf(tours.tour[key].players[x+1]) > -1 && bannednames.indexOf(tours.tour[key].players[x+1]) == -1) {
                        newwinbracket.push(tours.tour[key].players[x+1]);
                        newlosebracket.push(tours.tour[key].players[x]);
                    }
                    else {
                        newwinbracket.push("~Bye~");
                        newlosebracket.push("~Bye~");
                    }
                }
                newlosebracket.reverse();
            }
            else if (cplayers == 2 && tours.tour[key].round%2 === 0) { // special case for 2 or less players, first battle
                if (winners.indexOf(tours.tour[key].players[0]) > -1 && bannednames.indexOf(tours.tour[key].players[0]) == -1) {
                    newwinbracket.push(tours.tour[key].players[0]);
                    tstats.addseedpoints(tours.tour[key].players[0], type, detSeedPoints(mplayers,0));
                    tstats.addseedpoints(tours.tour[key].players[1], type, detSeedPoints(mplayers,1));
                    if (tours.tour[key].event) {
                        tstats.addeventpoints(tours.tour[key].players[0],mplayers,1,type,cdate);
                        tstats.addeventpoints(tours.tour[key].players[1],mplayers,2,type,cdate);
                        tours.tour[key].rankings.push(tours.tour[key].players[1], tours.tour[key].players[0]);
                    }
                }
                else if (winners.indexOf(tours.tour[key].players[1]) > -1 && bannednames.indexOf(tours.tour[key].players[1]) == -1) {
                    if (bannednames.indexOf(tours.tour[key].players[0]) == -1) {
                        newlosebracket.push(tours.tour[key].players[0], tours.tour[key].players[1]);
                    }
                    else {
                        newlosebracket.push(tours.tour[key].players[1]);
                        tstats.addseedpoints(tours.tour[key].players[1], type, detSeedPoints(mplayers,0));
                        if (tours.tour[key].event) {
                            tstats.addeventpoints(tours.tour[key].players[1],mplayers,1,type,cdate);
                            tours.tour[key].rankings.push(tours.tour[key].players[0], tours.tour[key].players[1]);
                        }
                    }
                }
                else {
                    newlosebracket.push("~Bye~");
                }
            }
            else if (cplayers == 2 && tours.tour[key].round%2 === 1) { // special case for 2 or less players, second battle
                if (winners.indexOf(tours.tour[key].players[0]) > -1 && bannednames.indexOf(tours.tour[key].players[0]) == -1) {
                    newlosebracket.push(tours.tour[key].players[0]);
                    tstats.addseedpoints(tours.tour[key].players[0], type, detSeedPoints(mplayers,0));
                    tstats.addseedpoints(tours.tour[key].players[1], type, detSeedPoints(mplayers,1));
                    if (tours.tour[key].event) {
                        tstats.addeventpoints(tours.tour[key].players[0],mplayers,1,type,cdate);
                        tstats.addeventpoints(tours.tour[key].players[1],mplayers,2,type,cdate);
                        tours.tour[key].rankings.push(tours.tour[key].players[1], tours.tour[key].players[0]);
                    }
                }
                else if (winners.indexOf(tours.tour[key].players[1]) > -1 && bannednames.indexOf(tours.tour[key].players[1]) == -1) {
                    newlosebracket.push(tours.tour[key].players[1]);
                    tstats.addseedpoints(tours.tour[key].players[1], type, detSeedPoints(mplayers,0));
                    tstats.addseedpoints(tours.tour[key].players[0], type, detSeedPoints(mplayers,1));
                    if (tours.tour[key].event) {
                        tstats.addeventpoints(tours.tour[key].players[1],mplayers,1,type,cdate);
                        tstats.addeventpoints(tours.tour[key].players[0],mplayers,2,type,cdate);
                        tours.tour[key].rankings.push(tours.tour[key].players[0], tours.tour[key].players[1]);
                    }
                }
                else {
                    newlosebracket.push("~Bye~");
                }
            }
            else if (tours.tour[key].round%2 === 0) {
                var losingwinners = []; // winner's bracket losers
                var winninglosers = []; // loser's bracket winners
                var winningwinners = []; // winners bracket winners
                for (var x=0;x<tours.tour[key].winbracket.length;x+=2) {
                    if (winners.indexOf(tours.tour[key].winbracket[x]) > -1 && bannednames.indexOf(tours.tour[key].winbracket[x]) == -1) {
                        winningwinners.push(tours.tour[key].winbracket[x]);
                        losingwinners.push(tours.tour[key].winbracket[x+1]);
                    }
                    else if (winners.indexOf(tours.tour[key].winbracket[x+1]) > -1 && bannednames.indexOf(tours.tour[key].winbracket[x+1]) == -1) {
                        winningwinners.push(tours.tour[key].winbracket[x+1]);
                        losingwinners.push(tours.tour[key].winbracket[x]);
                    }
                    else {
                        winningwinners.push("~Bye~");
                        losingwinners.push("~Bye~");
                    }
                }
                for (var l=0;l<tours.tour[key].losebracket.length;l+=2) {
                    if (winners.indexOf(tours.tour[key].losebracket[l]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l]);
                        if (round > 3) tstats.addseedpoints(tours.tour[key].losebracket[l+1], type, detSeedPoints(mplayers,cplayers-1));
                        if (tours.tour[key].event) tstats.addeventpoints(tours.tour[key].losebracket[l+1],mplayers,cplayers,type,cdate);
                    }
                    else if (winners.indexOf(tours.tour[key].losebracket[l+1]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l+1]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l+1]);
                        if (round > 3) tstats.addseedpoints(tours.tour[key].losebracket[l], type, detSeedPoints(mplayers,cplayers-1));
                        if (tours.tour[key].event) tstats.addeventpoints(tours.tour[key].losebracket[l],mplayers,cplayers,type,cdate);
                    }
                    else {
                        winninglosers.push("~Bye~");
                    }
                }
                for (var t=0; t<winningwinners.length; t++) {
                    newwinbracket.push(winningwinners[t]);
                    newwinbracket.push("~Bye~");
                }
                for (var s=0; s<losingwinners.length; s++) {
                    newlosebracket.push(losingwinners[s]);
                    newlosebracket.push(winninglosers[s]);
                }
            }
            else if (tours.tour[key].round%2 === 1) {
                var winninglosers = []; // loser's bracket winners
                var winningwinners = []; // winners bracket winners
                for (var x=0;x<tours.tour[key].winbracket.length;x+=2) {
                    if (winners.indexOf(tours.tour[key].winbracket[x]) > -1 && bannednames.indexOf(tours.tour[key].winbracket[x]) == -1) {
                        winningwinners.push(tours.tour[key].winbracket[x]);
                    }
                    else if (winners.indexOf(tours.tour[key].winbracket[x+1]) > -1 && bannednames.indexOf(tours.tour[key].winbracket[x+1]) == -1) {
                        winningwinners.push(tours.tour[key].winbracket[x+1]);
                    }
                    else {
                        winningwinners.push("~Bye~");
                    }
                }
                for (var l=0;l<tours.tour[key].losebracket.length;l+=2) {
                    if (winners.indexOf(tours.tour[key].losebracket[l]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l]);
                        if (round > 3) tstats.addseedpoints(tours.tour[key].losebracket[l+1], type, detSeedPoints(mplayers,(cplayers*3/4)-1));
                        if (tours.tour[key].event) tstats.addeventpoints(tours.tour[key].losebracket[l+1],mplayers,cplayers*3/4,type,cdate);
                        // 3rd Place
                        if (tours.tour[key].event && tours.tour[key].losebracket.length == 2) {
                            tours.tour[key].rankings.push(tours.tour[key].losebracket[l+1]);
                        }
                    }
                    else if (winners.indexOf(tours.tour[key].losebracket[l+1]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l+1]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l+1]);
                        if (round > 3) tstats.addseedpoints(tours.tour[key].losebracket[l], type, detSeedPoints(mplayers,(cplayers*3/4)-1));
                        if (tours.tour[key].event) tstats.addeventpoints(tours.tour[key].losebracket[l],mplayers,cplayers*3/4,type,cdate);
                        // 3rd Place
                        if (tours.tour[key].event && tours.tour[key].losebracket.length == 2) {
                            tours.tour[key].rankings.push(tours.tour[key].losebracket[l]);
                        }
                    }
                    else {
                        winninglosers.push("~Bye~");
                    }
                }
                newwinbracket = winningwinners;
                newlosebracket = winninglosers.reverse();
            }
            else {
                sendChanAll("Error in advancing round of tour '"+getFullTourName(key)+"' id "+key+": Broken roundcheck in double elim...", tourserrchan);
            }
        }
        else {
            for (var x=0;x<cplayers;x+=2) {
                if (winners.indexOf(tours.tour[key].players[x]) > -1 && bannednames.indexOf(tours.tour[key].players[x]) == -1) {
                    newlist.push(tours.tour[key].players[x]);
                    if (cplayers == 2) {
                        tstats.addseedpoints(tours.tour[key].players[x+1], type, detSeedPoints(mplayers,2));
                        tstats.addseedpoints(tours.tour[key].players[x], type, detSeedPoints(mplayers,1));
                    }
                    else if (round > 2) tstats.addseedpoints(tours.tour[key].players[x+1], type, detSeedPoints(mplayers,cplayers));
                }
                else if (winners.indexOf(tours.tour[key].players[x+1]) > -1 && bannednames.indexOf(tours.tour[key].players[x+1]) == -1) {
                    newlist.push(tours.tour[key].players[x+1]);
                    if (cplayers == 2) {
                        tstats.addseedpoints(tours.tour[key].players[x], type, detSeedPoints(mplayers,2));
                        tstats.addseedpoints(tours.tour[key].players[x+1], type, detSeedPoints(mplayers,1));
                    }
                    else if (round > 2) tstats.addseedpoints(tours.tour[key].players[x], type, detSeedPoints(mplayers,cplayers));
                }
                else {
                    newlist.push("~Bye~");
                }
            }
            for (var y in newlist) {
                if (isSub(newlist[y])) {
                    newlist.splice(y,1,"~Bye~");
                }
            }
        }
        tours.tour[key].winners = [];
        tours.tour[key].losers = [];
        tours.tour[key].draws = [];
        tours.tour[key].battlers = {};
        tours.tour[key].active = {};
        // Clean bracket for double elimination
        if (doubleelim) {
            for (var p in newwinbracket) {
                if (isSub(newwinbracket[p]) || newwinbracket[p] == "~DQ~") {
                    newwinbracket.splice(p,1,"~Bye~");
                }
            }
            for (var j in newlosebracket) {
                if (isSub(newlosebracket[j]) || newlosebracket[j] == "~DQ~") {
                    newlosebracket.splice(j,1,"~Bye~");
                }
            }
            tours.tour[key].winbracket = newwinbracket;
            tours.tour[key].losebracket = newlosebracket;
            tours.tour[key].players = newwinbracket.concat(newlosebracket);
        }
        else {
            tours.tour[key].players = newlist;
        }
        tourprintbracket(key);
    }
    catch (err) {
        sendChanAll("Error in advancing round of tour '"+getFullTourName(key)+"' id "+key+": "+err, tourserrchan);
    }
}

// starts a tournament
function tourstart(tier, starter, key, parameters) {
    try {
        var channels = tourschan === 0 ? [0] : [0, tourschan];
        var now = new Date();
        var datestring = now.getUTCDate()+"-"+now.getUTCMonth();
        tours.tour[key] = {};
        tours.tour[key].state = "signups";
        tours.tour[key].tourtype = tier;
        tours.tour[key].players = []; // list for the actual tour data
        tours.tour[key].battlers = {};
        tours.tour[key].winners = [];
        tours.tour[key].losers = []; // this will make de mode easier
        tours.tour[key].round = 0;
        tours.tour[key].cpt = 0;
        tours.tour[key].seeds = [];
        tours.tour[key].maxcpt = 0;
        tours.tour[key].active = {};
        tours.tour[key].starter = starter.toLowerCase();
        tours.tour[key].parameters = parameters;
        tours.tour[key].leader = tstats.topseed(tier); // best seed
        tours.tour[key].event = false;
        tours.tour[key].date = datestring; // used to identify event tours
        tours.tour[key].draws = [];
        tours.tour[key].numjoins = {};
        tours.globaltime = 0;
        if (typeof parameters.maxplayers === "number" && parameters.event) {
            tours.tour[key].maxplayers = parameters.maxplayers;
            tours.tour[key].time = parseInt(sys.time(), 10)+10*60; // 10 mins
            tours.tour[key].event = true;
            tours.tour[key].rankings = [];
        }
        else if (parameters.event) { // double the signup length for events
            tours.tour[key].time = parseInt(sys.time(), 10)+tourconfig.toursignup*2;
            tours.tour[key].maxplayers = "default";
            tours.tour[key].event = true;
            tours.tour[key].rankings = [];
        }
        else if (typeof parameters.maxplayers === "number") {
            tours.tour[key].maxplayers = parameters.maxplayers;
            tours.tour[key].time = parseInt(sys.time(), 10)+5*60; // 5 mins
        }
        else {
            tours.tour[key].maxplayers = "default";
            tours.tour[key].time = parseInt(sys.time(), 10)+tourconfig.toursignup;
        }
        if (tours.tour[key].parameters.type == "double") {
            tours.tour[key].winbracket = [];
            tours.tour[key].losebracket = [];
        }
        var wifiuse = "default";
        if ((sys.getClauses(tier)%256 >= 128 && !parameters.wifi) || (sys.getClauses(tier)%256 < 128 && parameters.wifi)) {
            wifiuse = parameters.wifi ? "Preview Mode" : "No Preview Mode";
        }
        for (var x in channels) {
            sendChanAll("", channels[x]);
            if (!parameters.event) {
                sendChanAll(border, channels[x]);
            }
            else {
                sendChanHtmlAll(redhtmlborder, channels[x]);
            }
            sendChanHtmlAll("<timestamp/> A <b><a href='http://wiki.pokemon-online.eu/view/"+tier.replace(/ /g,"_")+"'>"+tier+"</a></b> "+(!tours.tour[key].event ? "tournament" : "event")+" has opened for signups! (Started by <b>"+html_escape(starter)+"</b>)", channels[x]);
            sendChanAll("CLAUSES: "+getTourClauses(key),channels[x]);
            sendChanAll("PARAMETERS: "+parameters.mode+" Mode"+(parameters.gen != "default" ? "; Gen: "+getSubgen(parameters.gen,true) : "")+(parameters.type == "double" ? "; Double Elimination" : "")+(parameters.event ? "; Event Tournament" : "")+(wifiuse != "default" ? "; "+wifiuse : ""), channels[x]);
            if (channels[x] == tourschan) {
                sendChanHtmlAll("<timestamp/> Type <b>/join</b> to enter the tournament, "+(tours.tour[key].maxplayers === "default" ? "you have "+time_handle(parameters.event ? tourconfig.toursignup*2 : tourconfig.toursignup)+" to join!" : tours.tour[key].maxplayers+" places are open!"), channels[x]);
            }
            else {
                sendChanAll(tourconfig.tourbot+"Go to the #"+sys.channel(tourschan)+" channel and type /join to enter the tournament!", channels[x]);
                sendChanAll("*** "+(tours.tour[key].maxplayers === "default" ? "You have "+time_handle(parameters.event ? tourconfig.toursignup*2 : tourconfig.toursignup)+" to join!" : tours.tour[key].maxplayers+" places are open!")+" ***", channels[x]);
            }
            if (!parameters.event) {
                sendChanAll(border, channels[x]);
            }
            else {
                sendChanHtmlAll(redhtmlborder, channels[x]);
            }
            sendChanAll("", channels[x]);
        }
        tours.keys.push(key);
        if (tours.key >= tourconfig.maxarray) {
            tours.key = 0;
        }
        else {
            tours.key += 1;
        }
        var playerson = sys.playerIds();
        for (var x=0; x < playerson.length; ++x) {
            var id = playerson[x];
            var poUser = SESSION.users(id);
            if (sys.loggedIn(id) && poUser && poUser.tiers && poUser.tiers.indexOf(tier) != -1 && isInTour(sys.name(id)) === false) {
                if (sys.isInChannel(id, tourschan)) {
                    sys.sendHtmlMessage(playerson[x], "<font color=red>You are currently alerted when a "+tier+" tournament is started!</font><ping/>",tourschan);
                    continue;
                }
            }
        }
        var lstarter = tours.tour[key].starter;
        if (tourstats.staff.hasOwnProperty(lstarter)) {
            var tstat = tourstats.staff[lstarter];
            if (tstat.hasOwnProperty(tier)) {
                tourstats.staff[lstarter][tier].started += 1;
            }
            else {
                tourstats.staff[lstarter][tier] = {'started': 1, 'run': 0};
            }
        }
        else {
            tourstats.staff[lstarter] = {};
            tourstats.staff[lstarter][tier] = {'started': 1, 'run': 0};
        }
    }
    catch (err) {
        sendChanAll("Error in stating a tournament: "+err, tourserrchan);
    }
}

/* Starts the first round */
function tourinitiate(key) {
    try {
        var size = tourmakebracket(key);
        if (tours.tour[key].cpt < tourconfig.minplayers) {
            if (tours.globaltime !== -1 && tours.metrics.failedstarts < 3) {
                tours.globaltime = parseInt(sys.time(), 10)+tourconfig.tourbreak; // for next tournament
            }
            sendBotAll("The "+getFullTourName(key)+" tournament was cancelled by the server! You need at least "+tourconfig.minplayers+" players!"+(tours.globaltime > 0 ? " (A new tournament will start in "+time_handle(tourconfig.tourbreak)+")." : ""), tourschan, false);
            if (tours.tour[key].event) {
                refreshTicks(true);
            }
            delete tours.tour[key];
            tours.metrics.failedstarts += 1;
            purgeKeys();
            return;
        }
        toursortbracket(size, key);
        tourprintbracket(key);
        var starter = tours.tour[key].starter;
        var tier = tours.tour[key].tourtype;
        if (tourstats.staff.hasOwnProperty(starter)) {
            var tstat = tourstats.staff[starter];
            if (tstat.hasOwnProperty(tier)) {
                tourstats.staff[starter][tier].run += 1;
            }
            else {
                tourstats.staff[starter][tier] = {'started': 1, 'run': 1};
            }
        }
        else {
            tourstats.staff[starter] = {};
            tourstats.staff[starter][tier] = {'started': 1, 'run': 1};
        }
        var variance = calcVariance();
        if (tours.globaltime !== -1) {
            var timeradd = parseInt(tourconfig.abstourbreak/variance, 10);
            tours.globaltime = tours.tour[key].event ? parseInt(sys.time(), 10) + 3600 : parseInt(sys.time(), 10) + parseInt(timeradd, 10); // default 10 mins b/w signups, + 5 secs per user in chan
        }
        tours.metrics.failedstarts = 0;
    }
    catch (err) {
        sendChanAll("Error in initiating a tournament, id "+key+": "+err, tourserrchan);
    }
}

// constructs the bracket
function tourmakebracket(key) {
    try {
        var bracketsize = 1;
        if (tours.tour[key].players.length <= 2) {
            bracketsize = 2;
        }
        else if (tours.tour[key].players.length <= 4) {
            bracketsize = 4;
        }
        else if (tours.tour[key].players.length <= 8) {
            bracketsize = 8;
        }
        else if (tours.tour[key].players.length <= 16) {
            bracketsize = 16;
        }
        else if (tours.tour[key].players.length <= 32) {
            bracketsize = 32;
        }
        else if (tours.tour[key].players.length <= 64) {
            bracketsize = 64;
        }
        else if (tours.tour[key].players.length <= 128) {
            bracketsize = 128;
        }
        else if (tours.tour[key].players.length <= 256) {
            bracketsize = 256;
        }
        else if (tours.tour[key].players.length <= 512) {
            bracketsize = 512;
        }
        else {
            bracketsize = 1024;
        }
        var subnumber = 1;
        // push the players into people in events
        for (var p = tours.tour[key].players.length; p<bracketsize; p++) {
            tours.tour[key].players.push("~Sub "+subnumber+"~");
            subnumber += 1;
        }
        return bracketsize;
    }
    catch (err) {
        sendChanAll("Error in making a bracket, id "+key+": "+err, tourserrchan);
    }
}

// tour pushing functions used for constructing the bracket
function push2(x, size) {
    playerlist.push(ladderlist[x]);
    playerlist.push(ladderlist[size-x-1]);
}

function push4(x, size) {
    push2(x, size);
    push2(size/2-x-1, size);
}

function push8(x, size) {
    push4(x, size);
    push4(size/4-x-1, size);
}

function push16(x, size) {
    push8(x, size);
    push8(size/8-x-1, size);
}

function push32(x, size) {
    push16(x, size);
    push16(size/16-x-1, size);
}

function push64(x, size) {
    push32(x, size);
    push32(size/32-x-1, size);
}

function push128(x, size) {
    push64(x, size);
    push64(size/64-x-1, size);
}

function push256(x, size) {
    push128(x, size);
    push128(size/128-x-1, size);
}

function push512(x, size) {
    push256(x, size);
    push256(size/256-x-1, size);
}

function push1024(x, size) {
    push512(x, size);
    push512(size/512-x-1, size);
}

// Sorting the tour bracket
function toursortbracket(size, key) {
    try {
        ladderlist = [];
        var templist = [];
        var players = tours.tour[key].players;
        var ttype = tours.tour[key].tourtype;
        // This algorithm will sort players by ranking. 1st is tier points, 2nd is overall tour points, 3rd is ladder rankings.
        for (var t in players) {
            var pl = players[t];
            if (isSub(pl)) {
                templist.push([pl, -1, -1, t]);
                continue;
            }
            var pr1 = getExtraTierPoints(pl, ttype);
            var pr2 = getExtraPoints(pl, ttype);
            var pr3 = sys.ranking(pl, ttype) !== undefined ? sys.ranking(pl, ttype) : sys.totalPlayersByTier(ttype)+1;
            templist.push([pl, pr1, pr2, pr3]);
        }
        var sortalgorithim = function(a,b) {
            if (a[1] !== b[1]) {
                return b[1]-a[1];
            }
            else if (a[2] !== b[2]) {
                return b[2]-a[2];
            }
            else if (a[3] !== b[3]) {
                return a[3]-b[3];
            }
            else {
                return 0.5-Math.random();
            }
        };
        templist.sort(sortalgorithim);
        for (var s in templist) {
            ladderlist.push(templist[s][0]);
        }
        playerlist = [];
        /* Seed Storage */
        tours.tour[key].seeds = ladderlist;
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
        else if (size == 256) {
            push256(0, size);
        }
        else if (size == 512) {
            push512(0, size);
        }
        else if (size == 1024) {
            push1024(0, size);
        }
        tours.tour[key].players = playerlist;
    }
    catch (err) {
        sendChanAll("Error in sorting the bracket, id "+key+": "+err, tourserrchan);
    }
}

// this actually prints the bracket
function tourprintbracket(key) {
    try {
        tours.tour[key].round += 1;
        if (tours.tour[key].players.length == 1) { // winner
            var channels = [0, tourschan];
            var winner = toCorrectCase(tours.tour[key].players[0]);
            var isevent = tours.tour[key].event;
            var rankingorder;
            if (winner !== "~Bye~") {
                for (var x in channels) {
                    sendChanAll("", channels[x]);
                    if (!tours.tour[key].event) {
                        sendChanAll(border, channels[x]);
                    }
                    else {
                        sendChanHtmlAll(redhtmlborder, channels[x]);
                    }
                    sendChanHtmlAll("<timestamp/> The winner of the "+getFullTourName(key)+" tournament is: <b>"+html_escape(winner)+"</b>!", channels[x]);
                    sendChanAll("", channels[x]);
                    sendBotAll("Please congratulate "+winner+" on their success!", channels[x], false);
                    if (!isevent) {
                        sendChanAll(border, channels[x]);
                    }
                    else {
                        sendChanHtmlAll(redhtmlborder, channels[x]);
                    }
                    sendChanAll("", channels[x]);
                }
                // award to winner
                if (!isevent) {
                    tstats.addtourpoints(winner.toLowerCase(), tours.tour[key].cpt, tours.tour[key].tourtype, tours.tour[key].parameters.type == "double" ? true : false, 1);
                }
                else {
                    rankingorder = (tours.tour[key].rankings).reverse();
                    for (var p=0; p<rankingorder.length; p++) {
                        if (rankingorder[p] != "~DQ~" && rankingorder[p] != "~Bye~")
                            tstats.addtourpoints(rankingorder[p], tours.tour[key].cpt, tours.tour[key].tourtype, tours.tour[key].parameters.type == "double" ? true : false, p+1);
                    }
                }
            }
            else sendBotAll("The "+getFullTourName(key)+" ended by default!", tourschan, false);
            if (!isevent) {
                tours.history.unshift(getFullTourName(key)+": Won by "+winner+" with "+tours.tour[key].cpt+" players");
            }
            else {
                var rankstring = [];
                for (var r=0; r<rankingorder.length; r++) {
                    rankstring.push("#" + (r+1) + ": " + toCorrectCase(rankingorder[r]));
                }
                tours.history.unshift(getFullTourName(key)+": "+rankstring.join("; ")+"; with "+tours.tour[key].cpt+" players");
            }
            if (tours.history.length > 25) {
                tours.history.pop();
            }
            saveTourHistory();
            try {
                var garray = tourstats.general;
                var tier = tours.tour[key].tourtype;
                var players = tours.tour[key].cpt;
                if (garray.hasOwnProperty(tier)) {
                    garray[tier].played += 1;
                    garray[tier].players += players;
                }
                else {
                    garray[tier] = {'played': 1, 'players': players};
                }
                tstats.decay(tours.tour[key].tourtype);
                if (tstats.topseed(tier) !== tours.tour[key].leader) {
                    sendBotAll(tstats.topseed(tier) + " is now the top seed for "+tier+"!", tourschan, false);
                }
                // write tour stat data for reload
                if (typeof tourstats == "object") {
                    sys.writeToFile(dataDir+'tastats.json', JSON.stringify(tourstats));
                }
            }
            catch (err) {
                sendChanAll("Error in saving tour stats, id "+key+": "+err, tourserrchan);
            }
            delete tours.tour[key];
            tstats.savestats("all");
            purgeKeys();
            if (tours.keys.length === 0 && tours.globaltime > 0) {
                tours.globaltime = parseInt(sys.time(), 10)+tourconfig.tourbreak; // for next tournament
            }
            var signups = false;
            for (var x in tours.tour) {
                if (tours.tour[x].state == "signups") {
                    signups = true;
                    break;
                }
            }
            if (isevent) {
                if (!signups) {
                    tours.globaltime = parseInt(sys.time(), 10)+tourconfig.tourbreak; // for next tournament
                }
                refreshTicks(true);
            }
            save_cache();
            return;
        }
        else if (tours.tour[key].players.length == 2) { // finals
            /* Here in case it's ~Bye~ vs ~Bye~ */
            if (tours.tour[key].players[0] == "~Bye~" && tours.tour[key].players[1] == "~Bye~") {
                sendBotAll("The "+getFullTourName(key)+" ended by default!", tourschan, false);
                if (tours.tour[key].event) {
                    refreshTicks(true);
                }
                delete tours.tour[key];
                purgeKeys();
                if (tours.keys.length === 0 && tours.globaltime > 0) {
                    tours.globaltime = parseInt(sys.time(), 10)+tourconfig.tourbreak; // for next tournament
                }
                save_cache();
                return;
            }
            tours.tour[key].state = "final";
            var channels = [tourschan];
            var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[0])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[0])+"</td>";
            var player2data = "<td>"+toTourName(tours.tour[key].players[1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[1])+1)+")</td>";
            var roundinfo = "<b>"+(tours.tour[key].parameters.type == "double" && tours.tour[key].round%2 == 1 ? "Sudden Death" : "Final")+" Match of the "+getFullTourName(key)+" Tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a></th></tr></b><br/>";
            var roundposting = "<div style='margin-left: 50px'>"+roundinfo+"<table><tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>";
            for (var c in channels) {
                if (channels[c] === tourschan) {
                    sendFlashingBracket("<br/>"+(!tours.tour[key].event ? htmlborder : redborder)+roundposting+"</table></div>"+(!tours.tour[key].event ? htmlborder : redborder)+"<br/>", key);
                }
                else {
                    sendChanHtmlAll("<br/>"+(!tours.tour[key].event ? htmlborder : redborder)+roundposting+"</table></div>"+(!tours.tour[key].event ? htmlborder : redborder)+"<br/>", channels[c]);
                }
            }
            /* Here in case of the hilarious ~Bye~ vs ~Bye~ siutation */
            tours.tour[key].time = parseInt(sys.time(), 10)+tourconfig.tourdq;
            removebyes(key);
            return;
        }
        else {
            var subsExist = false;
            for (var x in tours.tour[key].players) {
                if (isSub(tours.tour[key].players[x])) {
                    subsExist = true;
                    break;
                }
            }
            if (tours.tour[key].round == 1 && subsExist) {
                tours.tour[key].state = "subround";
                tours.tour[key].time = parseInt(sys.time(), 10)+tourconfig.subtime;
            }
            else {
                tours.tour[key].state = "round";
                tours.tour[key].time = parseInt(sys.time(), 10)+(is1v1Tour(key) ? Math.floor(tourconfig.tourdq*2/3) : tourconfig.tourdq);
            }
            if (tours.tour[key].round == 1) {
                var submessage = "<div style='margin-left: 50px'><br/>Type <b>/join</b> to join late, good while subs last!</div>";
                var roundposting = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" Tournament</b><br/><table>";
                for (var x=0; x<tours.tour[key].players.length; x+=2) {
                    var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[x])+"</td>";
                    var player2data = "<td>"+toTourName(tours.tour[key].players[x+1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")</td>";
                    roundposting = roundposting+"<tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>";
                }
                sendFlashingBracket("<br/>"+(!tours.tour[key].event ? htmlborder : redborder)+roundposting+"</table></div>"+(subsExist ? submessage : "")+(!tours.tour[key].event ? htmlborder : redborder)+"<br/>",key);
            }
            else if (tours.tour[key].parameters.type == "double") {
                var roundposting = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" Tournament</b><br/><table><tr><th colspan=5><font color=blue>Winners Bracket</font></th></tr>";
                for (var x=0; x<tours.tour[key].players.length; x+=2) {
                    if (tours.tour[key].parameters.type == "double" && x == tours.tour[key].players.length/2) {
                        roundposting = roundposting + "<tr><td></td></tr><tr><th colspan=5><font color=red>Losers Bracket</font></th></tr>";
                    }
                    var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[x])+"</td>";
                    var player2data = "<td>"+toTourName(tours.tour[key].players[x+1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")</td>";
                    roundposting = roundposting+"<tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>";
                }
                sendBotAll("Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" tour has started. Type /viewround to view the round bracket.",tourschan,false);
                sendHtmlAuthPlayers("<br/>"+(!tours.tour[key].event ? htmlborder : redborder)+roundposting+"</table></div>"+(!tours.tour[key].event ? htmlborder : redborder)+"<br/>", key);
            }
            else {
                var roundposting = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" Tournament</b><br/><table>";
                for (var x=0; x<tours.tour[key].players.length; x+=2) {
                    var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[x])+"</td>";
                    var player2data = "<td>"+toTourName(tours.tour[key].players[x+1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")</td>";
                    roundposting = roundposting+"<tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>";
                }
                sendBotAll("Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" tour has started. Type /viewround to view the round bracket.",tourschan,false);
                sendHtmlAuthPlayers("<br/>"+(!tours.tour[key].event ? htmlborder : redborder)+roundposting+"</table></div>"+(!tours.tour[key].event ? htmlborder : redborder)+"<br/>", key);
            }
            removebyes(key);
        }
    }
    catch (err) {
        sendChanAll("Error in printing the bracket, id "+key+": "+err, tourserrchan);
    }
}

// is the tournament battle valid?
function isValidTourBattle(src,dest,clauses,mode,team,destTier,key,challenge) { // challenge is whether it was issued by challenge
    try {
        var srcindex = tours.tour[key].players.indexOf(sys.name(src).toLowerCase());
        var destindex = tours.tour[key].players.indexOf(sys.name(dest).toLowerCase());
        var srcisintour = false;
        var destisintour = false;
        if (srcindex != -1) {
            if (tours.tour[key].losers.indexOf(sys.name(src).toLowerCase()) == -1) {
                srcisintour = true;
            }
            if (tours.tour[key].parameters.type == "double") {
                if (tours.tour[key].winbracket.indexOf(sys.name(src).toLowerCase()) != -1 || tours.tour[key].round == 1) {
                    srcisintour = true;
                }
            }
        }
        if (destindex != -1) {
            if (tours.tour[key].losers.indexOf(sys.name(dest).toLowerCase()) == -1) {
                destisintour = true;
            }
            if (tours.tour[key].parameters.type == "double") {
                if (tours.tour[key].winbracket.indexOf(sys.name(dest).toLowerCase()) != -1 || tours.tour[key].round == 1) {
                    destisintour = true;
                }
            }
        }
        var srcbtt = tours.tour[key].battlers.hasOwnProperty(sys.name(src).toLowerCase());
        var destbtt= tours.tour[key].battlers.hasOwnProperty(sys.name(dest).toLowerCase());
        var srcwin = tours.tour[key].winners.indexOf(sys.name(src).toLowerCase());
        var destwin = tours.tour[key].winners.indexOf(sys.name(dest).toLowerCase());
        var checklist = clauseCheck(key, clauses);
        var invalidmsg = "";
        var isInCorrectGen = true;
        if (tours.tour[key].parameters.gen != "default") {
            var getGenParts = tours.tour[key].parameters.gen.split("-",2);
            if (parseInt(sys.gen(src,team), 10) !== parseInt(getGenParts[0], 10) || parseInt(sys.subgen(src,team), 10) !== parseInt(getGenParts[1], 10)) {
                isInCorrectGen = false;
            }
        }
        if (!srcisintour) {
            return "You are not in the tournament.";
        }
        else if (!destisintour) {
            return "That player is not in the tournament.";
        }
        else if (tours.tour[key].round < 1) {
            return "The tournament hasn't started yet.";
        }
        else if (srcbtt && challenge) {
            return "You have already started your battle.";
        }
        else if (destbtt && challenge) {
            return "That player has started their battle.";
        }
        else if (srcwin != -1) {
            return "You have already won.";
        }
        else if (destwin != -1) {
            return "That player has already won.";
        }
        else if ((srcindex%2 === 1 && srcindex-destindex != 1) || (srcindex%2 === 0 && destindex-srcindex != 1)) {
            return "That player is not your opponent.";
        }
        else if (mode != 1 && tours.tour[key].parameters.mode == "Doubles") {
            return "This match must be played in Doubles mode. Change it in the bottom right hand corner of the challenge window.";
        }
        else if (mode != 2 && tours.tour[key].parameters.mode == "Triples") {
            return "This match must be played in Triples mode. Change it in the bottom right hand corner of the challenge window.";
        }
        else if (mode !== 0 && tours.tour[key].parameters.mode == "Singles") {
            return "This match must be played in Singles mode. Change it in the bottom right hand corner of the challenge window.";
        }
        else if (!isInCorrectGen && tours.tour[key].parameters.gen != "default") {
            return "This match must be played in "+getSubgen(tours.tour[key].parameters.gen, true)+". Change it in the teambuilder.";
        }
        else if (checklist.missing.length > 0 && checklist.extra.length > 0) {
            invalidmsg = "You must add the following clauses to your challenge: "+checklist.missing.join(", ")+"; and you must not have the following clauses: "+checklist.extra.join(", ");
            return invalidmsg;
        }
        else if (checklist.missing.length > 0) {
            invalidmsg = "You must add the following clauses to your challenge: "+checklist.missing.join(", ");
            return invalidmsg;
        }
        else if (checklist.extra.length > 0) {
            invalidmsg = "You must remove the following clauses from your challenge: "+checklist.extra.join(", ");
            return invalidmsg;
        }
        else if (tours.tour[key].state == "final" && clauses%8 >= 4) {
            /* We allow Disallow Spects to be used for all rounds except finals */
            return "Disallow Spects is prohibited in finals matches.";
        }
        else if (sys.tier(src, team) != tours.tour[key].tourtype) {
            if (!sys.hasTier(src, tours.tour[key].tourtype)) {
                return "You need a team in the "+tours.tour[key].tourtype+" tier, then challenge using that team.";
            }
            else {
                return "You need to challenge using one of your teams in the "+tours.tour[key].tourtype+" tier. Change it in the drop-down box at the bottom left of the challenge window.";
            }
        }
        else if (tours.tour[key].tourtype != destTier) {
            if (!sys.hasTier(dest, tours.tour[key].tourtype)) {
                return "Your opponent does not seem to have a team for the tournament.";
            }
            else {
                return "You need to select the "+tours.tour[key].tourtype+" tier in the challenge window. Click the button with the correct tier at the top of the challenge window.";
            }
        }
        else return "Valid";
    }
    catch (err) {
        sendChanAll("Error in battle check, id "+key+": "+err, tourserrchan);
        return "Error in clausecheck, please report and wait for an update.";
    }
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

// Displays name in the html brackets correctly
function toTourName(name) {
    if (typeof name === undefined) {
        return "";
    }
    var playerid = sys.id(name);
    var tourid = isInTour(name);
    if (name == "~DQ~" || name == "~Bye~") {
        return "<span title='Disqualified, opponent advances!'><s>"+name+"</s></span>";
    }
    else if (isSub(name)) {
        return "<span title='This player is a sub!'><font color=#777777>"+name+"</font></span>";
    }
    else if (tourid === false) {
        return "<span title='This player is out of the tournament!'><s>"+name+"</s></span>";
    }
    else if (sys.isInChannel(playerid, tourschan) && tourid !== false) {
        var hasReqTier = sys.hasTier(playerid, tours.tour[tourid].tourtype);
        var htmlname = isNaN(name) ? html_escape(toCorrectCase(name)) : html_escape(name);
        if (hasReqTier) {
            return flashtag+htmlname+flashtag;
        }
        else {
            return "<span title='This player does not have a team for the tournament!'><font color=#FF7700>"+flashtag+htmlname+flashtag+"</font></span>";
        }
    }
    else {
        return "<span title='Player is not in the Tournament channel!'><font color=#FF0000>"+html_escape(toCorrectCase(name))+"</font></span>";
    }
}

// Tour Auth Functions

function isTourAdmin(src) {
    if (sys.auth(src) < 0 || !sys.dbRegistered(sys.name(src))) {
        return false;
    }
    if (sys.auth(src) >= 1 || isTourSuperAdmin(src)) {
        return true;
    }
    var tadmins = tours.touradmins;
    if (tadmins.hasOwnProperty(sys.name(src).toLowerCase())) {
        return true;
    }
    return false;
}

function isTourSuperAdmin(src) {
    if (!sys.dbRegistered(sys.name(src))) {
        return false;
    }
    if (sys.auth(src) >= 2 || isTourOwner(src)) {
        return true;
    }
    var tadmins = tours.touradmins;
    var lname = sys.name(src).toLowerCase();
    if (tadmins.hasOwnProperty(lname)) {
        if (tadmins[lname] == "ta") return true;
    }
    return false;
}

function isTourOwner(src) {
    if (!sys.dbRegistered(sys.name(src))) {
        return false;
    }
    if (sys.auth(src) >= 3) {
        return true;
    }
    var lname = sys.name(src).toLowerCase();
    var tadmins = tours.touradmins;
    if (tadmins.hasOwnProperty(lname)) {
        if (tadmins[lname] == "to" || tadmins[lname] == "hidden") return true;
    }
    return false;
}

function isInSpecificTour(name, key) {
    var srcisintour = false;
    if (tours.tour[key].players.indexOf(name.toLowerCase()) != -1) {
        if (tours.tour[key].losers.indexOf(name.toLowerCase()) == -1) {
            srcisintour = true;
        }
        if (tours.tour[key].parameters.type == "double") {
            if (tours.tour[key].winbracket.indexOf(name.toLowerCase()) != -1 || tours.tour[key].round == 1) {
                srcisintour = true;
            }
        }
    }
    return srcisintour;
}

function isInTour(name) {
    var key = false;
    for (var x in tours.tour) {
        var srcisintour = false;
        if (tours.tour[x].players.indexOf(name.toLowerCase()) != -1) {
            if (tours.tour[x].losers.indexOf(name.toLowerCase()) == -1) {
                srcisintour = true;
            }
            if (tours.tour[x].parameters.type == "double" && tours.tour[x].round == 1) {
                srcisintour = true;
            }
        }
        if (tours.tour[x].parameters.type == "double") {
            if (tours.tour[x].winbracket.indexOf(name.toLowerCase()) != -1) {
                srcisintour = true;
            }
        }
        if (srcisintour) {
            key = x;
            break;
        }
    }
    return key;
}

function isTourMuted(src) {
    var ip = sys.ip(src);
    if (tours.tourmutes.hasOwnProperty(ip)) {
        if (tours.tourmutes[ip].expiry <= parseInt(sys.time(), 10)) {
            delete tours.tourmutes[ip];
            saveTourMutes();
            return false;
        }
        return true;
    }
    else {
        return false;
    }
}

// writes tourmutes to tourmutes.txt
function saveTourMutes() {
    sys.writeToFile(dataDir+"tourmutes.txt", "");
    for (var x in tours.tourmutes) {
        if (tours.tourmutes[x].expiry <= parseInt(sys.time(), 10)) {
            delete tours.tourmutes[x];
            continue;
        }
        sys.appendToFile(dataDir+"tourmutes.txt", x+":::"+tours.tourmutes[x].expiry+":::"+tours.tourmutes[x].reason+":::"+tours.tourmutes[x].auth+":::"+tours.tourmutes[x].name+"\n");
    }
}

function loadTourMutes() {
    var mutefile = sys.getFileContent(dataDir+"tourmutes.txt");
    if (mutefile === undefined) {
        return;
    }
    var mutedata = mutefile.split("\n");
    for (var x in mutedata) {
        var data = mutedata[x].split(":::", 5);
        if (data.length < 5) {
            continue;
        }
        var expiry = parseInt(data[1], 10);
        if (expiry <= parseInt(sys.time(), 10)) {
            continue;
        }
        var ip = data[0];
        var reason = data[2];
        var auth = data[3];
        var player = data[4];
        tours.tourmutes[ip] = {'expiry': expiry, 'reason': reason, 'auth': auth, 'name': player};
    }
}

// to prevent silly mute reasons
function usingBadWords(message) {
    if (/f[uo]ck|\bass\b|assh[o0]le|\barse|\bcum\b|\bdick|\bsex\b|pussy|bitch|porn|\bfck|nigga|\bcock\b|\bgay|\bhoe\b|slut|whore|cunt|clit|pen[i1]s|vag|nigger|8=+d/i.test(message)) {
        return true;
    }
    else return false;
}

function markActive(src, reason) {
    if (src === undefined) {
        return;
    }
    var name = sys.name(src).toLowerCase();
    var key = isInTour(name);
    if (key !== false) {
        if (tours.tour[key].active.hasOwnProperty(name)) {
            if (tours.tour[key].active[name] === "Battle" && reason == "post") {
                return;
            }
        }
        tours.tour[key].active[name] = parseInt(sys.time(), 10);
    }
}

function getListOfTours(num) {
    var list = [];
    for (var x=tours.queue.length-1;x>=0;x--) {
        var tourdata = tours.queue[x];
        list.push(tourdata.tier);
        if (list.length >= num) {
            return list;
        }
    }
    for (var t in tours.tour) {
        var tier = tours.tour[t].tourtype;
        list.push(tier);
        if (list.length >= num) {
            return list;
        }
    }
    for (var h=0;h<tours.history.length;h++) {
        var historydata = tours.history[h];
        var pos = historydata.indexOf(":");
        var thetour = historydata.substr(0,pos);
        list.push(thetour);
        if (list.length >= num) {
            return list;
        }
    }
    return list;
}

// variance function that influences time between tournaments. The higher this is, the faster tours will start.
function calcVariance() {
    var playersInChan = parseInt((sys.playersOfChannel(tourschan)).length, 10);
    var playersInTours = 0;
    for (var x in tours.tour) {
        if (tours.tour[x].players !== undefined) {
            playersInTours += parseInt(tours.tour[x].players.length, 10);
        }
    }
    // To escape unintended div/0 errs, because ln(1) = 0 and ln(0) = undef
    if (playersInChan < 2) {
        return 0.5;
    }
    if (playersInTours === 0) { // use ln(#players)
        return Math.log(playersInChan);
    }
    var variance = Math.log(playersInChan/playersInTours);
    if (variance <= 0.5 || isNaN(variance)) {
        return 0.5;
    }
    else return variance;
}

function calcPercentage() { // calc percentage of players in tournaments playing
    var playersInChan = parseInt((sys.playersOfChannel(tourschan)).length, 10);
    var playersInTours = 0;
    var playerList = sys.playersOfChannel(tourschan);
    for (var x in playerList) {
        var playerName = sys.name(playerList[x]);
        if (isInTour(playerName)) {
            playersInTours += 1;
        }
    }
    if (playersInChan === 0) {
        return 100;
    }
    var variance = playersInTours/playersInChan*100;
    if (isNaN(variance)) {
        return 100;
    }
    return variance;
}

function sendWelcomeMessage(src, chan) {
    sys.sendMessage(src,border,chan);
    sys.sendMessage(src,"*** Welcome to #"+tourconfig.channel+"; Version "+tourconfig.version+"! ***",chan);
    var now = new Date();
    var datestring = now.getUTCDate()+"-"+(now.getUTCMonth()+1)+"-"+now.getUTCFullYear();
    var tomorrow = new Date();
    tomorrow.setTime(Date.parse(now) + 86400*1000);
    var details = getEventTour(datestring);
    var datestring2 = tomorrow.getUTCDate()+"-"+(tomorrow.getUTCMonth()+1)+"-"+tomorrow.getUTCFullYear();
    if (typeof details === "object") {
        sys.sendMessage(src,"Today's Event Tournament: "+details[0]+(tours.eventticks > 0 ? "; starts in "+time_handle(tours.eventticks) : ""),chan);
    }
    var details2 = getEventTour(datestring2);
    if (typeof details2 === "object") {
        sys.sendMessage(src,"Tomorrow's Event Tournament: "+details2[0],chan);
    }
    sys.sendMessage(src,"",chan);
    sys.sendMessage(src,"*** Current Tournaments ***",chan);
    for (var x in tours.tour) {
        if (tours.tour[x].state == "signups") {
            if (tours.tour[x].maxplayers === "default") {
                sys.sendMessage(src, getFullTourName(x)+": Currently in signups, "+time_handle(tours.tour[x].time-parseInt(sys.time(), 10))+" remaining. Type /join to join.", chan);
            }
            else {
                sys.sendMessage(src, getFullTourName(x)+": Currently in signups, "+(tours.tour[x].maxplayers - tours.tour[x].cpt)+" place"+(tours.tour[x].maxplayers - tours.tour[x].cpt == 1 ? "" : "s")+" remaining. Type /join to join.", chan);
            }
        }
        else if (tours.tour[x].state == "subround" && tours.tour[x].players.length - tours.tour[x].cpt !== 0) {
            sys.sendMessage(src, getFullTourName(x)+": Substitute spots are open, type /join to join late.", chan);
        }
        else if (tours.tour[x].state == "final") {
            sys.sendMessage(src, getFullTourName(x)+": Final Round", chan);
        }
        else {
            sys.sendMessage(src, getFullTourName(x)+": Round "+tours.tour[x].round, chan);
        }
    }
    sys.sendMessage(src,"",chan);
    var nextstart = time_handle(tours.globaltime - parseInt(sys.time(), 10));
    for (var x in tours.tour) {
        if (tours.tour[x].state == "signups") {
            nextstart = "Pending";
            break;
        }
    }
    if ((tourconfig.maxrunning <= tours.keys.length && calcPercentage() >= tourconfig.minpercent) || tours.globaltime <= 0) {
        nextstart = "Pending";
    }
    var nextmessage = "???";
    if (tours.queue.length >= 1) {
        var queuedata = tours.queue[0];
        if (nextstart != "Pending" && !(queuedata.parameters.event && tours.keys.length > 0) && tours.working) {
            nextmessage = queuedata.tier+"; Starts in "+nextstart;
        }
        else {
            nextmessage = queuedata.tier+"; Start time TBA";
        }
    }
    sys.sendMessage(src,"Next Tournament: "+nextmessage,chan);
    if (!sys.dbRegistered(sys.name(src))) {
        sendBotMessage(src, "You need to register before playing in #"+sys.channel(chan)+"! Click on the 'Register' button below and follow the instructions!", chan, false);
    }
    sys.sendMessage(src,"*** Use /help to view the commands; and use /rules to view the tournament rules! ***",chan);
    sys.sendMessage(src,border,chan);
    var key = isInTour(sys.name(src));
    if (key !== false) {
        var battlers = tours.tour[key].battlers;
        var winners = tours.tour[key].winners;
        var players = tours.tour[key].players;
        if (tours.tour[key].round === 0) {
            return;
        }
        var roundtable = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+tours.tour[key].tourtype+" Tournament</b><table><br/>";
        for (var j=0; j<players.length; j+=2) {
            if (winners.indexOf(players[j]) != -1 && players[j] != "~Bye~" && players[j] != "~DQ~") {
                roundtable = roundtable + "<tr><td align='right'><font color=green><b>"+toTourName(players[j]) +"</b></font></td><td align='center'> won against </td><td>"+ toTourName(players[j+1])+"</td></tr>";
            }
            else if (winners.indexOf(players[j+1]) != -1 && players[j+1] != "~Bye~" && players[j+1] != "~DQ~") {
                roundtable = roundtable + "<tr><td align='right'><font color=green><b>"+toTourName(players[j+1]) +"</b></font></td><td align='center'> won against </td><td>"+ toTourName(players[j])+"</td></tr>";
            }
            else if (battlers.hasOwnProperty(players[j])) {
                var elapsedtime = parseTimer(parseInt(sys.time(), 10)-battlers[players[j]].time);
                roundtable = roundtable + "<tr><td align='right'>"+toTourName(players[j]) +"</td><td align='center'> "+(isInSpecificTour(sys.name(src), key) || (battlers[players[j]].noSpecs && !isTourAdmin(src)) ? "is battling" : "<a href='po:watch/"+battlers[players[j]].battleId+"'>is battling</a>")+" </td><td>"+ toTourName(players[j+1])+"</td><td> ["+elapsedtime+"]</td></tr>";
            }
            else {
                roundtable = roundtable + "<tr><td align='right'>"+toTourName(players[j]) +"</td><td align='center'> VS </td><td>"+ toTourName(players[j+1])+"</td></tr>";
            }
        }
        var rounddata = (roundtable+"</table></div>");
        sys.sendHtmlMessage(src, htmlborder+rounddata+htmlborder, chan);
    }
}

function dumpVars(src) {
    var activelist = [];
    var battlelist = [];
    sys.sendMessage(src, border, tourschan);
    sys.sendMessage(src, "*** Variable Dump ***", tourschan);
    sys.sendMessage(src, "*** Main ***", tourschan);
    sys.sendMessage(src, "GlobalTime: "+tours.globaltime, tourschan);
    sys.sendMessage(src, "CurrentTime: "+sys.time(), tourschan);
    sys.sendMessage(src, "CurrentKeys: "+tours.keys.join(", "), tourschan);
    sys.sendMessage(src, "% players in Tours: "+Math.floor(calcPercentage())+"%", tourschan);
    for (var x in tours.tour) {
        activelist = [];
        battlelist = [];
        sys.sendMessage(src, "*** Round "+tours.tour[x].round+"; "+getFullTourName(x)+" Tour (key "+x+")***", tourschan);
        sys.sendMessage(src, "Time: "+tours.tour[x].time, tourschan);
        sys.sendMessage(src, "Players: "+tours.tour[x].players, tourschan);
        for (var b in tours.tour[x].battlers) {
            var battleString = b;
            if (tours.tour[x].battlers[b].noSpecs === true) {
                battleString = battleString + " (No Specs)";
            }
            if (typeof tours.tour[x].battlers[b].time == "number") {
                battleString = battleString + " ["+(parseInt(sys.time(), 10)-tours.tour[x].battlers[b].time)+" seconds]";
            }
            battlelist.push(battleString);
        }
        sys.sendMessage(src, "Battlers: "+battlelist.join("; "), tourschan);
        sys.sendMessage(src, "Winners: "+tours.tour[x].winners, tourschan);
        sys.sendMessage(src, "Losers: "+tours.tour[x].losers, tourschan);
        sys.sendMessage(src, "Total Players: "+tours.tour[x].cpt, tourschan);
        for (var y in tours.tour[x].active) {
            if (tours.tour[x].active[y] === "Battle") {
                activelist.push(y + "(Battle)");
            }
            else if (typeof tours.tour[x].active[y] == "number") {
                if (tours.tour[x].active[y]+tourconfig.activity >= parseInt(sys.time(), 10)) {
                    activelist.push(y + "(Post)");
                }
            }
        }
        sys.sendMessage(src, "Active: "+activelist.join("; "), tourschan);
        sys.sendMessage(src, "Seeds: "+tours.tour[x].seeds, tourschan);
    }
    sys.sendMessage(src, border, tourschan);
}

// end tournament functions

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
        var globalcommands = ["tadmin", "tadmins", "tsadmin", "tsadmins", "towner", "towners", "tdeadmin", "tdeadmins", "megauser", "megauseroff"];
        if ((channel === tourschan && !SESSION.channels(tourschan).isBanned(source)) || globalcommands.indexOf(command) > -1) {
            return tourCommand(source, command, commandData);
        }
        return false;
    },
    init: function() {
        try {
            initTours();
        }
        catch (err) {
            sendChanAll("Error in event 'init': "+err, tourserrchan);
        }
    },
    afterChannelJoin : function(player, chan) {
        if (chan === tourschan) {
            var ranges = [];
            if (tourwarnings.hasOwnProperty('ranges')) {
                ranges = tourwarnings.ranges;
            }
            for (var r in ranges) {
                if (sys.ip(player).indexOf(ranges[r]) === 0 && sys.existChannel('Indigo Plateau') && !isTourAdmin(player))  {
                    sendChanAll("Possible tourban evader: "+sys.name(player)+" on "+sys.ip(player), sys.channelId("Indigo Plateau"));
                    break;
                }
            }
            sendWelcomeMessage(player, chan);
        }
    },
    afterBattleEnded : function(source, dest, desc) {
        try {
            tourBattleEnd(source, dest, desc);
        }
        catch (err) {
            sendChanAll("Error in event 'tourBattleEnd': "+err, tourserrchan);
        }
    },
    stepEvent : function() {
        tourStep();
    },
    beforeChallengeIssued : function(source, dest, clauses, rated, mode, team, destTier) {
        var ret = false;
        ret |= tourChallengeIssued(source, dest, clauses, rated, mode, team, destTier);
        return ret;
    },
    afterBattleStarted : function(source, dest, clauses, rated, mode, bid) {
        return tourBattleStart(source, dest, clauses, rated, mode, bid);
    },
    beforeBattleMatchup : function(source, dest, clauses, rated) {
        var ret = false;
        ret |= (isInTour(sys.name(source)) !== false || isInTour(sys.name(dest)) !== false);
        return ret;
    },
    beforeChatMessage : function(src, message, channel) {
        if (isTourMuted(src) && !isTourAdmin(src) && channel === tourschan) {
            sendBotMessage(src,"You are tourmuted by "+tours.tourmutes[sys.ip(src)].auth+". This expires in "+time_handle(tours.tourmutes[sys.ip(src)].expiry-parseInt(sys.time(), 10))+". [Reason: "+tours.tourmutes[sys.ip(src)].reason+"]",tourschan,false);
            return true;
        }
        else if (/f[uo]ck|assh[o0]le|arseh[o0]le|\bpussy\b|\bfck|nigga|\bcunt|pen[i1]s|vag|nigger|8=+d/i.test(message) && channel === tourschan && !utilities.is_command(message)) {
            sys.sendMessage(src, sys.name(src)+": "+message, channel);
            script.afterChatMessage(src, message, channel);
            return true;
        }
        else return false;
    },
    afterChatMessage : function(src, message, channel) {
        if (channel === tourschan && !usingBadWords(message) && !SESSION.users(src).smute.active && !sys.away(src)) {
            markActive(src, "post");
        }
    },
    // returns true if disallowed by the way...
    canSpectate : function (src, p1, p2) {
        var srctour = isInTour(sys.name(src));
        var p1tour = isInTour(sys.name(p1));
        var p2tour = isInTour(sys.name(p2));
        if (p1tour === false || p2tour === false || src === p1 || src === p2) {
            return false;
        }
        if (SESSION.channels(tourschan).isBanned(src) || isTourMuted(src)) {
            sendBotMessage(src,"You are banned from spectating tournaments!","all",false);
            return true;
        }
        var proxy = false;
        if (srctour === false) {
            var srcip = sys.ip(src);
            var playerlist = tours.tour[p1tour].players;
            for (var x in playerlist) {
                if (sys.dbIp(playerlist[x]) == srcip && isInTour(playerlist[x]) === p1tour) {
                    srctour = p1tour;
                    proxy = toCorrectCase(playerlist[x]);
                    break;
                }
            }
        }
        /* check for potential scouters */
        var cctiers = ["Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Metronome", "Battle Factory", "Battle Factory 6v6"];
        var isOkToSpectate = (tours.tour[p1tour].state == "final" || cctiers.indexOf(tours.tour[p1tour].tourtype) != -1);
        if (srctour === p1tour && !isOkToSpectate) {
            sendBotMessage(src, "You can't watch this match because you are in the same tournament!","all", false);
            return true;
        }
        return false;
    },
    // This is for tour admins only.
    allowToSpectate : function(src, p1, p2) {
        var srctour = isInTour(sys.name(src));
        var p1tour = isInTour(sys.name(p1));
        var p2tour = isInTour(sys.name(p2));
        if (p1tour === false || p2tour === false || src === p1 || src === p2) {
            return false;
        }
        if (isTourAdmin(src)) {
            if (p1tour !== p2tour) {
                return false;
            }
            if (srctour !== p1tour) {
                return true;
            }
        }
        return false;
    }
};
