/*
Code for tours.js
Coding done by Shadowfist
*/

if (typeof tourschan !== "string") {
    tourschan = sys.channelId("Tournaments")
}

if (typeof tourserrchan !== "string") {
    tourserrchan = sys.channelId("Indigo Plateau")
}

if (typeof tours !== "object") {
    sys.sendAll("Creating new tournament object", tourschan)
    tours = {"queue": [], "globaltime": -1, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": [], "subscriptions": {}, "activetas": [], "activehistory": [], "tourmutes": {}, "tourbans": [], "eventnames": []}
}

var utilities = require('utilities.js');
var border = "»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»»:";
var htmlborder = "<font color=#3DAA68><b>"+border+"</b></font>";
// Event tournaments highlighted in red
var redborder = "<font color=#FF0000><b>"+border+"</b></font>";
var redhtmlborder = "<font color=#FF0000><timestamp/> <b>"+border+"</b></font>";
var tourcommands = ["join: joins a tournament",
                    "unjoin: unjoins a normal tournament during signups only, leaves an event tour",
                    "queue: lists upcoming tournaments",
                    "viewround: views current round",
                    "history: views recently played tiers",
                    "touradmins: lists all users that can start tournaments",
                    "leaderboard [tier]: shows tournament rankings, tier is optional",
                    "eventleaderboard: shows the event leaderboard",
                    "monthlyleaderboard [month] [year]: shows tour rankings for the current month, or the current month and year if specified",
                    "tourinfo [name]: gives information on a person's recent tour wins",
                    "activeta: lists active tournament admins",
                    "rules: lists the tournament rules",
                    "touralerts [on/off]: Turn on/off your tour alerts (Shows list of Tour Alerts if on/off isn't specified)",
                    "addtouralert [tier] : Adds a tour alert for the specified tier (note that this list is shared with #Tournaments)",
                    "removetouralert [tier] : Removes a tour alert for the specified tier"]
var tourmodcommands = ["*** Parameter Information ***",
                    "Parameters can be used by putting 'gen=x'; 'mode=singles/doubles/triples'; 'type=single/double'.",
                    "For example '/tour CC 1v1:gen=RBY mode=doubles type=double' starts a RBY CC 1v1 double elimination tournament.",
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
                    "configset [var]:[value]: changes config settings",
                    "passta [name]: passes your tour admin to a new name"]
var touradmincommands = ["tourstart [tier]:[parameters]: starts a tier of that tournament immediately, provided one is not in signups.",
                    "shift [tier]:[parameters]: places a tournament in the front of the queue",
                    "tadmin[s] [name]: makes someone a tournament admin - s makes it only show in staff chan",
                    "tdeadmin[s] [name]: fires someone from being tournament admin - s makes it only show in staff chan",
                    // "forcestart: ends signups immediately and starts the first round",
                    "start: starts next tournament in the queue immediately (use sparingly)",
                    "push [player]: pushes a player into a tournament in signups (DON'T USE UNLESS ASKED)",
                    "tahistory [days]: views the activity of tour admins (days is optional, if excluded it will get the last 7 days if possible)",
                    "updatewinmessages: updates win messages from the web",
                    "tourbans: list tour bans",
                    "tourban [name]: bans a problematic player from tournaments",
                    "tourunban [name]: unbans a player from tournaments",
                    "stopautostart: if there are no tournaments running, this will stop new ones from being automatically started by the server until another one is started manually."]
var tourownercommands = ["clearrankings: clears the tour rankings (owner only)",
                    "evalvars: checks the current variable list for tours",
                    "resettours: resets the entire tournament system in the event of a critical failure",
                    "fullleaderboard [tier]: gives the full leaderboard",
                    "getrankings [month] [year]: exports monthly rankings (deletes old rankings as well)",
                    "loadevents: load event tours",
                    "cleantour [key]: removes all byes and subs (DEBUG)"]
var tourrules = ["*** TOURNAMENT GUIDELINES ***",
                "Breaking the following rules may result in a tour mute:",
                "#1: Team revealing or scouting in non CC tiers will result in disqualification.",
                "- Scouting is watching the battle of someone else in the tournament to gain information.",
                "- Team revealing is revealing any information about other entrants' teams.",
                "- Players are always permitted to watch the final match of any tournament.",
                "#2: Have a team and be ready when you join, otherwise you can be disqualified",
                "#3: Tierspamming, repeatedly asking for tournaments in the chat, is not allowed.",
                "#4: Do not abuse the tournament commands.",
                "#5: Do not leave or forfeit in a tournament you are in just so you can join another.",
                "#6: Do not timestall (i.e. deliberately wait until timeout).",
                "#7: Ask someone on the /activeta list if you need help or have problems.",
                "#8: Avoid excessive minimodding.",
                "- Reminding a player of the rules is fine, but doing it excessively is annoying and unwanted.",
                "#9: Do not attempt to circumvent the rules",
                "- Attempting to circumvent the rules through trickery, proxy or other such methods will be punished."]

function sendBotMessage(user, message, chan, html) {
    if (user === undefined) {
        return;
    }
    if (html) {
        if (chan === "all") {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message)
        }
        else {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,chan)
        }
    }
    else {
        if (chan === "all") {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message))
        }
        else {
            sys.sendHtmlMessage(user, "<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),chan)
        }
    }
}

function sendBotAll(message, chan, html) {
    if (html) {
        if (chan === "all") {
            sys.sendHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message)
        }
        else {
            sys.sendHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+message,chan)
        }
    }
    else {
        if (chan === "all") {
            sys.sendHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message))
        }
        else {
            sys.sendHtmlAll("<font color="+tourconfig.tourbotcolour+"><timestamp/><b>"+tourconfig.tourbot+"</b></font>"+html_escape(message),chan)
        }
    }
}

// Debug Messages
function sendDebugMessage(message, chan) {
    if (chan === tourschan && tourconfig.debug && sys.existChannel(sys.channel(tourserrchan))) {
        sendBotAll(message,tourserrchan,false)
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
    if (tours.tour[key].parameters.gen != "default") {
        return getSubgen(tours.tour[key].parameters.gen,true) + " " + tours.tour[key].tourtype
    }
    else return tours.tour[key].tourtype;
}

// Finds a tier
find_tier = utilities.find_tier;

function modeOfTier(tier) {
    if (tier.indexOf("Doubles") != -1 || ["JAA", "VGC 2009", "VGC 2010", "VGC 2011", "VGC 2012"].indexOf(tier) != -1) {
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
    }
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
    var tmp = string.split(" ")
    var totaltime = 0
    try {
        for (var n in tmp) {
            var thestring = tmp[n]
            var lastchar = thestring.charAt(thestring.length - 1).toLowerCase()
            var timestring = parseInt(thestring.substr(0, thestring.length - 1))
            if (isNaN(timestring)) {
                continue;
            }
            else if (lastchar == "y") {
                totaltime += 365*24*60*60*timestring;
            }
            else if (lastchar == "w") {
                totaltime += 7*24*60*60*timestring;
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
    var data = sys.getFileContent("tourscores.txt")
    if (data === undefined) {
        return 0;
    }
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

// This function will get a user's current tournament points in a tier
function getExtraTierPoints(player, tier) {
    var data = sys.getFileContent("tourscores_"+tier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt")
    if (data === undefined) {
        return 0;
    }
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

// saving tour admins list
function saveTourKeys() {
    var tal = tours.touradmins
    sys.writeToFile("touradmins.txt", tal.join(":::"))
    return;
}

// This function will get a tier's clauses in readable format
function getTourClauses(tier) {
    // force Self-KO clause
    var tierclauses = sys.getClauses(tier) > 255 ? sys.getClauses(tier) : sys.getClauses(tier)+256
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
    // force Self-KO clause every time
    var requiredClauses = sys.getClauses(tier) > 255 ? sys.getClauses(tier) : sys.getClauses(tier)+256
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
            sendBotAll("Broken clausecheck...", tourserrchan, false)
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

// Sends a html  message to all tour auth and players that participated in the current tour
function sendHtmlAuthPlayers(message,key) {
    var arr = sys.playersOfChannel(tourschan)
    for (var x in arr) {
        if (isTourAdmin(arr[x]) || tours.tour[key].seeds.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
            // send highlighted name in bracket
            var htmlname = html_escape(sys.name(arr[x]));
            var regex1 = "<td align='right'>"+htmlname+"</td>";
            var newregex1 = "<td align='right'><font style='BACKGROUND-COLOR: #FFAAFF'>"+htmlname+"</font><ping/></td>";
            var regex2 = "<td>"+htmlname+"</td>";
            var newregex2 = "<td><font style='BACKGROUND-COLOR: #FFAAFF'>"+htmlname+"</font><ping/></td>";
            var newmessage = message.replace(regex1,newregex1).replace(regex2,newregex2)
            sys.sendHtmlMessage(arr[x], newmessage, tourschan)
        }
    }
}

// Send a flashing bracket
function sendFlashingBracket(message,key) {
    var arr = sys.playersOfChannel(tourschan)
    for (var x in arr) {
        var newmessage = message;
        if (tours.tour[key].players.indexOf(sys.name(arr[x]).toLowerCase()) != -1) {
            // send highlighted name in bracket
            var htmlname = html_escape(sys.name(arr[x]));
            var regex1 = "<td align='right'>"+htmlname+"</td>";
            var newregex1 = "<td align='right'><font style='BACKGROUND-COLOR: #FFAAFF'>"+htmlname+"</font><ping/></td>";
            var regex2 = "<td>"+htmlname+"</td>";
            var newregex2 = "<td><font style='BACKGROUND-COLOR: #FFAAFF'>"+htmlname+"</font><ping/></td>";
            newmessage = message.replace(regex1,newregex1).replace(regex2,newregex2)
        }
        sys.sendHtmlMessage(arr[x], newmessage, tourschan)
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
            tourbotcolour: "#CC0044",
            minpercent: 5,
            version: "1.500p4.5 [SAFE]",
            tourbot: "\u00B1Genesect: ",
            debug: false,
            points: true
        }
        var configkeys = sys.getValKeys(file)
        if (configkeys.indexOf(key) == -1) {
            sys.sendAll("No tour config data detected for '"+key+"', getting default value", tourschan)
            if (defaultvars.hasOwnProperty(key))
                return defaultvars[key];
            else
                throw "Couldn't find the key!"
        }
        else {
            return sys.getVal(file, key);
        }
    }
    catch (err) {
        sys.sendAll("Error in getting config value '"+key+"': "+err, tourserrchan)
        return null;
    }
}

function initTours() {
    // config object
    tourconfig = {
        maxqueue: parseInt(getConfigValue("tourconfig.txt", "maxqueue")),
        maxarray: 1023,
        maxrunning: parseInt(getConfigValue("tourconfig.txt", "maxrunning")),
        toursignup: parseInt(getConfigValue("tourconfig.txt", "toursignup")),
        tourdq: parseInt(getConfigValue("tourconfig.txt", "tourdq")),
        subtime: parseInt(getConfigValue("tourconfig.txt", "subtime")),
        activity: parseInt(getConfigValue("tourconfig.txt", "touractivity")),
        tourbreak: parseInt(getConfigValue("tourconfig.txt", "breaktime")),
        abstourbreak: parseInt(getConfigValue("tourconfig.txt", "absbreaktime")),
        reminder: parseInt(getConfigValue("tourconfig.txt", "remindertime")),
        channel: "Tournaments",
        errchannel: "Developer's Den",
        tourbotcolour: getConfigValue("tourconfig.txt", "tourbotcolour"),
        minpercent: parseInt(getConfigValue("tourconfig.txt", "minpercent")),
        version: "1.500p4.5 [SAFE]",
        tourbot: getConfigValue("tourconfig.txt", "tourbot"),
        debug: false,
        points: true
    }
    tourschan = utilities.get_or_create_channel(tourconfig.channel)
    tourserrchan = utilities.get_or_create_channel(tourconfig.errchannel)
    if (typeof tours != "object") {
        sys.sendAll("Creating new tournament object", tourschan)
        tours = {"queue": [], "globaltime": -1, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": [], "subscriptions": {}, "activetas": [], "activehistory": [], "tourmutes": {}, "tourbans": [], "eventnames": []}
    }
    else {
        if (!tours.hasOwnProperty('queue')) tours.queue = [];
        if (!tours.hasOwnProperty('globaltime')) tours.globaltime = -1;
        if (!tours.hasOwnProperty('key')) tours.key = [];
        if (!tours.hasOwnProperty('keys')) tours.keys = [];
        if (!tours.hasOwnProperty('tour')) tours.tour = {};
        if (!tours.hasOwnProperty('history')) tours.history = [];
        if (!tours.hasOwnProperty('touradmins')) tours.touradmins = [];
        if (!tours.hasOwnProperty('subscriptions')) tours.subscriptions = {};
        if (!tours.hasOwnProperty('activetas')) tours.activetas = [];
        if (!tours.hasOwnProperty('activehistory')) tours.activehistory = [];
        if (!tours.hasOwnProperty('tourmutes')) tours.tourmutes = {};
        if (!tours.hasOwnProperty('tourbans')) tours.tourbans = [];
        if (!tours.hasOwnProperty('eventnames')) tours.eventnames = [];
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
    var tadata = sys.getFileContent("touradmins.txt")
    if (tadata === undefined) {
        sys.sendAll("No tour admin data detected, leaving blank", tourschan)
    }
    else {
        var data = tadata.split(":::")
        for (var d=0;d<data.length;d++) {
            var info = data[d]
            if (info === undefined || info == "") {
                data.splice(d,1)
            }
        }
        tours.touradmins = data
    }
    loadTourMutes()
    loadEventPlayers()
    sys.sendAll("Version "+tourconfig.version+" of the tournaments system was loaded successfully in this channel!", tourschan)
}

function getEventTour(datestring) {
    var eventfile = sys.getFileContent("eventtours.txt")
    if (eventfile === undefined) {
        return false;
    }
    var events = eventfile.split("\n")
    for (var x in events) {
        if (events[x].length === 0) {
            continue;
        }
        if (events[x].indexOf("#") === 0) {
            continue;
        }
        var data = events[x].split(":")
        if (data.length < 3) {
            continue;
        }
        else {
            if (data[0] == datestring) {
                var thetier = find_tier(data[1]);
                if (thetier === null) {
                    continue;
                }
                var maxplayers = parseInt(data[2]);
                var allowedcounts = [16,32,64,128,256];
                if (allowedcounts.indexOf(maxplayers) == -1) {
                    continue;
                }
                var scoring = true;
                if (data.length == 4) {
                    if (data[3] == "no")
                        scoring = false;
                }
                return [thetier, maxplayers, scoring];
            }
        }
    }
    return false;
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
    var now = new Date()
    if (parseInt(sys.time())%3600 === 0) {
        var comment = now + " ~ " + tours.activetas.join(", ")
        tours.activehistory.unshift(comment)
        if (tours.activehistory.length > 168) {
            tours.activehistory.pop()
        }
        tours.activetas = [];
        // clear out tourmutes list
        for (var m in tours.tourmutes) {
            if (tours.tourmutes[m].expiry <= parseInt(sys.time())) {
                delete tours.tourmutes[m];
                saveTourMutes();
            }
        }
    }
    for (var x in tours.tour) {
        if (tours.tour[x].time-parseInt(sys.time()) <= 10) {
            sendDebugMessage("Time Remaining in the "+getFullTourName(x)+" tournament: "+time_handle(tours.tour[x].time-parseInt(sys.time()))+"; State: "+tours.tour[x].state,tourschan)
        }
        if (tours.tour[x].state == "signups") {
            if (tours.tour[x].time <= parseInt(sys.time())) {
                tourinitiate(x)
                continue;
            }
            if (tours.tour[x].time-parseInt(sys.time()) == 60 && typeof tours.tour[x].maxplayers == "number") {
                sendBotAll("Signups for the "+tours.tour[x].tourtype+" event tournament close in 1 minute.", tourschan, false)
                sendBotAll("Signups for the "+tours.tour[x].tourtype+" event tournament close in 1 minute.", 0, false)
            }
            else if (tours.tour[x].time-parseInt(sys.time()) == 30) {
                sendBotAll("Signups for the "+tours.tour[x].tourtype+" tournament close in 30 seconds.", tourschan, false)
                sendBotAll("Signups for the "+tours.tour[x].tourtype+" tournament close in 30 seconds.", 0, false)
            }
            continue;
        }
        if (tours.tour[x].state == "subround" && tours.tour[x].time <= parseInt(sys.time())) {
            tours.tour[x].time = parseInt(sys.time())+tourconfig.tourdq-tourconfig.subtime
            removesubs(x)
            continue;
        }
        if (tours.tour[x].state == "subround" || tours.tour[x].state == "round" || tours.tour[x].state == "final") {
            if (tours.tour[x].time <= parseInt(sys.time()) && (parseInt(sys.time())-tours.tour[x].time)%60 === 0 && tours.tour[x].state != "subround") {
                removeinactive(x)
                continue;
            }
            if ((tours.tour[x].time-(tours.tour[x].state == "subround" ? tourconfig.subtime : tourconfig.tourdq)+tourconfig.reminder) == parseInt(sys.time())) {
                sendReminder(x)
                continue;
            }
        }
        if (tours.tour[x].state == "signups" || tours.tour[x].state == "subround") {
            canstart = false;
        }
    }
    if (calcPercentage() >= tourconfig.minpercent) {
        canautostart = false;
    }
    var datestring = now.getUTCDate()+"-"+(now.getUTCMonth()+1)+"-"+now.getUTCFullYear();
    var hour = now.getUTCHours();
    var minute = now.getUTCMinutes();
    var second = now.getUTCSeconds();
    var allgentiers = ["Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Metronome"];
    if ([2,8,14,20].indexOf(hour) != -1) {
        if (minute == 45 && second === 0) {
            var details = getEventTour(datestring)
            if (typeof details === "object") {
                var tourtier = details[0];
                var maxplayers = parseInt(details[1]);
                sendBotAll("A "+details[1]+" player <b>"+html_escape(details[0])+"</b> event is starting in about 5 minutes.",tourschan,true)
                sendBotAll("A "+details[1]+" player <b>"+html_escape(details[0])+"</b> event is starting in about 5 minutes.",0,true)
                tours.queue.unshift(tourtier+":::~Pokemon Online~:::"+modeOfTier(tourtier)+":::"+(allgentiers.indexOf(tourtier) != -1 ? "5-1" : "default")+":::double:::"+details[1])
                tours.globaltime = parseInt(sys.time()) + 300
            }
        }
        else if (minute == 30 && second === 0) { // stop tours from auto starting
            var details = getEventTour(datestring)
            if (typeof details === "object") {
                tours.globaltime = -1
                sendBotAll("A "+details[1]+" player <b>"+html_escape(details[0])+"</b> event is starting in about 20 minutes. No more tournaments will start for now.",tourschan,true)
            }
            if (hour == 2) { // clear list of event joined names
                tours.eventnames = [];
            }
        }
    }
    if (canstart && tours.globaltime > 0 && tours.globaltime <= parseInt(sys.time()) && (tourconfig.maxrunning > tours.keys.length || canautostart)) {
        if (tours.queue.length > 0) {
            var data = tours.queue[0].split(":::",6)
            var tourtostart = data[0]
            var starter = data[1]
            var maxplayers = parseInt(data[5])
            if (isNaN(maxplayers)) {
                maxplayers = false;
            }
            var parameters = {"mode": data[2], "gen": data[3], "type": data[4], "maxplayers": maxplayers}
            tours.queue.splice(0,1)
            tourstart(tourtostart,starter,tours.key,parameters)
        }
        else if (tours.keys.length === 0) {
            // start a cycle from tourarray
            var tourarray = ["Challenge Cup", "Wifi NU", "CC 1v1", "Random Battle", "Wifi OU", "Gen 5 1v1", "Wifi UU", "Monotype", "Challenge Cup", "Clear Skies", "Wifi CC 1v1", "Wifi LC", "Wifi OU", "Wifi LU", "Wifi Ubers", "No Preview OU"]
            var doubleelimtiers = ["CC 1v1", "Wifi CC 1v1", "Gen 5 1v1"];
            var tourtostart = tourarray[tours.key%tourarray.length]
            var tourtype = doubleelimtiers.indexOf(tourtostart) != -1 ? "double" : "single"
            tourstart(tourtostart,"~~Server~~",tours.key,{"mode": modeOfTier(tourtostart), "gen": (allgentiers.indexOf(tourtostart) != -1 ? "5-1" : "default"), "type": tourtype, "maxplayers": false})
        }
    }
}

// Battle Start
function tourBattleStart(src, dest, clauses, rated, mode, bid) {
    var name1 = sys.name(src).toLowerCase()
    var name2 = sys.name(dest).toLowerCase()
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
    var index1 = tours.tour[key].players.indexOf(name1)
    var index2 = tours.tour[key].players.indexOf(name2)
    var validBattle = false;
    if (Math.abs(index1 - index2) === 1 && Math.min(index1,index2)%2 === 0) {
        validBattle = true;
    }
    if (validBattle && tours.tour[key].round >= 1) {
        tours.tour[key].battlers.push(name1, name2)
        if (clauses%8 >= 4) {
            tours.tour[key].disallowspecs.push(name1, name2)
        }
        tours.tour[key].active[name1] = "Battle"
        tours.tour[key].active[name2] = "Battle"// this avoids dq later since they made an attempt to start
        if (tours.tour[key].state == "final") {
            sendBotAll("<a href='po:watch/"+bid+"'>The final battle of the "+getFullTourName(key)+" tournament between <b>"+html_escape(sys.name(src))+"</b> and <b>"+html_escape(sys.name(dest))+"</b> just started!</a>",0,true)
            sendBotAll("<a href='po:watch/"+bid+"'>The final battle of the "+getFullTourName(key)+" tournament between <b>"+html_escape(sys.name(src))+"</b> and <b>"+html_escape(sys.name(dest))+"</b> just started!</a>",tourschan,true)
        }
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
        var winindex = tours.tour[key].battlers.indexOf(winname)
        if (winindex != -1) tours.tour[key].battlers.splice(winindex,1)
        var loseindex = tours.tour[key].battlers.indexOf(losename)
        if (loseindex != -1) tours.tour[key].battlers.splice(loseindex,1)
        if (winindex == -1 || loseindex == -1) {
            return;
        }
        if (result == "tie") {
            sendBotAll("The match between "+winname+" and "+losename+" ended in a tie, please rematch!", tourschan, false)
            markActive(winner, "tie")
            markActive(loser, "tie")
            return;
        }
        battleend(winner, loser, key)
    }
}

// Challenge Issuing Functions
function tourChallengeIssued(src, dest, clauses, rated, mode, team, destTier) {
    var key = null
    var srcindex = null
    var destindex = null
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
        srcindex = tours.tour[key].players.indexOf(sys.name(src).toLowerCase())
        destindex = tours.tour[key].players.indexOf(sys.name(dest).toLowerCase())
    }
    if ((srcindex != -1 || destindex != -1) && srcindex != null && destindex != null) {
        var tcomment = isValidTourBattle(src,dest,clauses,mode,team,destTier,key,true)
        if (tcomment != "Valid") {
            sendBotMessage(src, tcomment, "all", false);
            if (tcomment == "Your opponent does not seem to have a team for the tournament.") {
                sendBotMessage(dest, "You need a team in the "+tours.tour[key].tourtype+" tier to participate. Please do this ASAP or you will be disqualified.", "all", false);
                markActive(src, "post")
            }
            return true;
        }
        markActive(src, "post")
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
                sys.writeToFile("tourdetails.txt", "")
                // sys.writeToFile("eventscores.txt", "")
                // sys.writeToFile("eventwinners.txt", "")
                var tiers = sys.getTierList()
                for (var x in tiers) {
                    sys.writeToFile("tourscores_"+tiers[x].replace(/ /g,"_").replace(/\//g,"-slash-")+".txt","")
                }
                sendBotAll(sys.name(src)+" cleared the tour rankings!",tourschan,false)
                return true;
            }
            if (command == "cleareventrankings") {
                sys.writeToFile("eventscores.txt", "")
                sys.writeToFile("eventwinners.txt", "")
                sendBotAll(sys.name(src)+" cleared the event rankings!",tourschan,false)
                return true;
            }
            if (command == "resettours") {
                tours = {"queue": [], "globaltime": -1, "key": 0, "keys": [], "tour": {}, "history": [], "touradmins": [], "subscriptions": {}, "activetas": [], "activehistory": [], "tourmutes": {}, "tourbans": [], "eventnames": []};
                sendBotAll(sys.name(src)+" reset the tour system!",tourschan,false)
                return true;
            }
            if (command == "evalvars") {
                dumpVars(src)
                return true;
            }
            if (command == "cleantour" && sys.name(src) == "Aerith") {
                var key = parseInt(commandData)
                if (!tours.tour.hasOwnProperty(key)) {
                    sendBotMessage(src, "No such tour exists.", tourschan, false);
                    return true;
                }
                removebyes(key);
                sendBotMessage(src, "Cleared tour id "+key, tourschan, false);
                return true;
            }
            if (command == "clearevents") {
                tours.eventnames = [];
                sys.writeToFile("eventplayers.txt", "")
                sendBotMessage(src, 'Cleared event names!', tourschan, false);
                return true;
            }
            if (command == "eventnames") {
                sendBotMessage(src, 'Played today: '+tours.eventnames.join(), tourschan, false);
                return true;
            }
            if (command == "loadevents") {
                var url = "https://raw.github.com/lamperi/po-server-goodies/master/eventtours.txt"
                if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
                    url = commandData;
                }
                sendBotMessage(src, "Fetching event tours from "+url, tourschan, false);
                sys.webCall(url, function(resp) {
                    if (resp !== "") {
                        sys.writeToFile('eventtours.txt', resp);
                        sendBotAll('Updated list of event tours!', tourschan, false);
                    } else {
                        sendBotMessage(src, 'Failed to update!', tourschan, false);
                    }
                });
                return true;
            }
            if (command == "fullleaderboard") {
                try {
                    if (commandData == "") {
                        var rankdata = sys.getFileContent("tourscores.txt")
                    }
                    else {
                        var tourtier = find_tier(commandData)
                        if (tourtier === null) {
                            throw ("Not a valid tier")
                        }
                        var rankdata = sys.getFileContent("tourscores_"+tourtier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt")
                    }
                    if (rankdata === undefined) {
                        throw ("No data")
                    }
                    var rankings = rankdata.split("\n")
                    var list = [];
                    for (var p in rankings) {
                        if (rankings[p] == "") continue;
                        var rankingdata = rankings[p].split(":::",2)
                        if (rankingdata[1] < 1) continue;
                        list.push([rankingdata[1], rankingdata[0]]);
                    }
                    list.sort(function(a,b) { return b[0] - a[0] ; });
                    sys.sendMessage(src, "*** FULL TOURNAMENT RANKINGS "+(commandData != "" ? "("+commandData+") " : "")+"***",tourschan)
                    var rankkey = [0, 0] // rank, points
                    for (var x=0; x<65536; x++) {
                        if (x >= list.length) break;
                        if (rankkey[1] === parseInt((list[x])[0])) {
                            sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                        }
                        else {
                            sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                            rankkey = [x+1, parseInt((list[x])[0])]
                        }
                    }
                }
                catch (err) {
                    if (err == "Not a valid tier") {
                        sendBotMessage(src, commandData+" is not a valid tier!",tourschan, false)
                    }
                    else if (err == "No data") {
                        sendBotMessage(src, "No data exists yet!",tourschan, false)
                    }
                    else {
                        throw(err)
                    }
                }
                return true;
            }
            if (command == "getrankings") {
                try {
                    var now = new Date()
                    var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "decemeber"]
                    if (commandData == "") {
                        var monthlyfile = "tourmonthscore_"+themonths[now.getUTCMonth()]+"_"+now.getUTCFullYear()+".txt"
                    }
                    else {
                        var monthdata = commandData.toLowerCase().split(" ",2)
                        if (monthdata.length == 1) {
                            monthdata.push(now.getUTCFullYear());
                        }
                        var monthlyfile = "tourmonthscore_"+monthdata[0]+"_"+monthdata[1]+".txt"
                    }
                    if (sys.getFileContent(monthlyfile) === undefined) {
                        throw ("No data")
                    }
                    var rankings = sys.getFileContent(monthlyfile).split("\n")
                    var list = [];
                    for (var p in rankings) {
                        if (rankings[p] == "") continue;
                        var rankingdata = rankings[p].split(":::",2)
                        if (rankingdata[1] < 1) continue;
                        list.push([rankingdata[1], rankingdata[0]]);
                    }
                    list.sort(function(a,b) { return b[0] - a[0] ; });
                    var rankkey = [0, 0] // rank, points
                    sys.sendMessage(src, "*** FULL MONTHLY TOURNAMENT RANKINGS "+(commandData != "" ? "("+commandData+") " : "")+"***",tourschan)
                    for (var x=0; x<65536; x++) {
                        if (x >= list.length) break;
                        if (rankkey[1] === parseInt((list[x])[0])) {
                            sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                        }
                        else {
                            sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                            rankkey = [x+1, parseInt((list[x])[0])]
                        }
                    }
                    if (monthlyfile != "tourmonthscore_"+themonths[now.getUTCMonth()]+"_"+now.getUTCFullYear()+".txt") {
                        sys.deleteFile(monthlyfile);
                        sendBotMessage(src, "Cleared old file "+monthlyfile, tourschan, false);
                    }
                }
                catch (err) {
                    if (err == "No data") {
                        sendBotMessage(src, commandData+" is not a valid tier!",tourschan, false)
                    }
                    else {
                        throw(err)
                    }
                }
                return true;
            }
        }
        if (isTourSuperAdmin(src)) {
            /* Tournament Admins etc. */
            if (command == "tadmin" || command == "tadmins") {
                var tadmins = tours.touradmins
                if (sys.dbIp(commandData) === undefined) {
                    sendBotMessage(src,"This user doesn't exist!",tourschan,false)
                    return true;
                }
                if (!sys.dbRegistered(commandData)) {
                    sendBotMessage(src,"They aren't registered so you can't give them authority!",tourschan,false)
                    if (sys.id(commandData) !== undefined) {
                        sendBotMessage(sys.id(commandData), "Please register ASAP, before getting tour authority.","all",false)
                    }
                    return true;
                }
                if (tadmins !== undefined) {
                    for (var t in tadmins) {
                        if (tadmins[t].toLowerCase() == commandData.toLowerCase()) {
                            sendBotMessage(src,"They are already a tour admin!",tourschan,false)
                            return true;
                        }
                    }
                }
                tadmins.push(commandData)
                tours.touradmins = tadmins
                saveTourKeys()
                if (command == "tadmin") {
                    sendBotAll(sys.name(src)+" promoted "+commandData.toLowerCase()+" to a tournament admin!",tourschan,false)
                }
                else {
                    sendBotAll(sys.name(src)+" promoted "+commandData.toLowerCase()+" to a tournament admin!",sys.channelId("Indigo Plateau"),false)
                }
                return true;
            }
            if (command == "tdeadmin" || command == "tdeadmins") {
                var tadmins = tours.touradmins
                if (sys.dbIp(commandData) === undefined) {
                    sendBotMessage(src,"This user doesn't exist!",tourschan,false)
                    return true;
                }
                var index = -1
                if (tadmins !== undefined) {
                    for (var t=0;t<tadmins.length;t++) {
                        if (cmp(tadmins[t],commandData.toLowerCase())) {
                            index = t;
                            break;
                        }
                    }
                }
                if (index == -1) {
                    sendBotMessage(src,"They are not a tour admin!",tourschan,false)
                    return true;
                }
                tadmins.splice(index,1)
                tours.touradmins = tadmins
                saveTourKeys()
                if (command == "tdeadmin") {
                    sendBotAll(sys.name(src)+" fired "+commandData.toLowerCase()+" from running tournaments!",tourschan,false)
                }
                else {
                    sendBotAll(sys.name(src)+" fired "+commandData.toLowerCase()+" from running tournaments!",sys.channelId("Indigo Plateau"),false)
                }
                return true;
            }
            // active history command
            if (command == "tahistory") {
                sys.sendMessage(src, "*** TOUR ADMIN HISTORY ***",tourschan)
                var length = 168;
                if (commandData == "") {
                    length = tours.activehistory.length
                }
                else if (parseInt(commandData)*24 < tours.activehistory.length) {
                    length = parseInt(commandData)*24
                }
                else {
                    length = tours.activehistory.length
                }
                for (var x=0;x<length;x++) {
                    sys.sendMessage(src, tours.activehistory[x],tourschan)
                }
                return true;
            }
            if (command == "stopautostart") {
                tours.globaltime = -1
                sendBotAll(sys.name(src)+" stopped tournaments from auto starting for now, this will be removed when another tour is started.",tourschan,false)
                return true;
            }
            /*if (command == "forcestart") {
                var key = null;
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        key = x;
                    }
                }
                if (key === null) {
                    sendBotMessage(src, "There are no tournaments currently in signups to force start! Use /tour [tier] instead, or /start to start the next tournament in the queue!", tourschan, false)
                    return true;
                }
                if (tours.tour[x].players.length < 3) {
                    sendBotMessage(src, "There are not enough players to start!", tourschan, false)
                    return true;
                }
                tourinitiate(key);
                sendBotAll("The "+tours.tour[x].tourtype+" tour was force started by "+sys.name(src)+".", tourschan, false)
                return true;
            }*/
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
                    sendBotMessage(src,"You can't push anyone into a tournament now!",tourschan,false)
                    return true;
                }
                /* Is already in another tour */
                if (isInTour(target) !== false) {
                    sendBotMessage(src,"You can't push them in another tour!",tourschan,false)
                    return true;
                }
                tours.tour[key].players.push(target)
                tours.tour[key].cpt += 1
                if (tours.tour[key].maxcpt !== undefined) {
                    if (tours.tour[key].cpt > tours.tour[key].maxcpt && tours.tour[key].maxplayers === "default") {
                        tours.tour[key].maxcpt = tours.tour[key].cpt
                        if (tours.tour[key].maxcpt == 5) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/6)
                        }
                        else if (tours.tour[key].maxcpt == 9) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/4)
                        }
                        else if (tours.tour[key].maxcpt == 17) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/3)
                        }
                        else if (tours.tour[key].maxcpt == 33) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/2)
                        }
                        else if (tours.tour[key].maxcpt == 65) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/1.5)
                        }
                        else if (tours.tour[key].maxcpt == 129) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup)
                        }
                    }
                }
                // 256 players for technical reasons
                if (tours.tour[key].maxplayers === "default") {
                    sendBotAll(toCorrectCase(target)+" was added to the "+getFullTourName(key)+" tournament by "+sys.name(src)+" (player #"+tours.tour[key].players.length+"), "+(tours.tour[key].time - parseInt(sys.time()))+" second"+(tours.tour[key].time - parseInt(sys.time()) == 1 ? "" : "s")+" remaining!", tourschan, false)
                    if (tours.tour[key].players.length >= 256) {
                        tours.tour[key].time = parseInt(sys.time())
                    }
                }
                else {
                    sendBotAll(toCorrectCase(target)+" was added to the "+getFullTourName(key)+" tournament by "+sys.name(src)+" (player #"+tours.tour[key].players.length+"), "+(tours.tour[key].maxplayers - tours.tour[key].cpt)+" place"+(tours.tour[key].maxplayers - tours.tour[key].cpt == 1 ? "" : "s")+" remaining!", tourschan, false)
                    if (tours.tour[key].players.length >= tours.tour[key].maxplayers) {
                        tours.tour[key].time = parseInt(sys.time())
                    }
                }

                return true;
            }
            // enabled for now!
            if (command == "updatewinmessages") {
                var url = "https://raw.github.com/lamperi/po-server-goodies/master/tourwinverbs.txt"
                if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
                    url = commandData;
                }
                sendBotMessage(src, "Fetching win messages from "+url, tourschan, false);
                sys.webCall(url, function(resp) {
                    if (resp !== "") {
                        sys.writeToFile('tourwinverbs.txt', resp);
                        getTourWinMessages()
                        sendBotAll('Updated win messages!', tourschan, false);
                    } else {
                        sendBotMessage(src, 'Failed to update!', tourschan, false);
                    }
                });
                return true;
            }
            if (command == "start") {
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        sendBotMessage(src, "A tournament is already in signups!", tourschan, false)
                        return true;
                    }
                }
                if (tours.queue.length != 0) {
                    var data = tours.queue[0].split(":::",6)
                    var tourtostart = data[0]
                    var maxplayers = parseInt(data[5])
                    if (isNaN(maxplayers)) {
                        maxplayers = false;
                    }
                    var parameters = {"mode": data[2], "gen": data[3], "type": data[4], "maxplayers": maxplayers}
                    tours.queue.splice(0,1)
                    tourstart(tourtostart, sys.name(src), tours.key, parameters)
                    sendBotAll(sys.name(src)+" force started the "+tourtostart+" tournament!",tourschan,false)
                    return true;
                }
                else {
                    sendBotMessage(src, "There are no tournaments to force start! Use /tour [tier] instead!", tourschan, false)
                    return true;
                }
            }
            if (command == "tourbans") {
                sys.sendMessage(src, "Active tourbans: "+tours.tourbans.join(", "),tourschan)
                return true;
            }
            if (command == "tourban") {
                var tar = commandData.toLowerCase();
                if (sys.dbIp(tar) === undefined) {
                    sendBotMessage(src, "No such user",tourschan,false)
                    return true;
                }
                if (sys.dbAuth(tar) >= sys.auth(src) || isTourSuperAdmin(sys.id(tar))) {
                    sendBotMessage(src, "Can't ban higher auth",tourschan,false)
                    return true;
                }
                var index = tours.tourbans.indexOf(tar)
                if (index != -1) {
                    sendBotMessage(src, "They are already tourbanned!",tourschan,false)
                    return true;
                }
                sendBotAll(sys.name(src)+" unleashed their wrath on "+toCorrectCase(tar)+"!",tourschan,false)
                if (sys.id(tar) !== undefined) {
                    if (sys.isInChannel(sys.id(tar), tourschan)) {
                        sys.kick(sys.id(tar), tourschan)
                    }
                }
                var key = isInTour(tar);
                if (key !== false) {
                    if (tours.tour[key].state == "signups") {
                        var index = tours.tour[key].players.indexOf(tar.toLowerCase())
                        tours.tour[key].players.splice(index, 1)
                        tours.tour[key].cpt -= 1
                        sendBotAll(toCorrectCase(tar)+" was taken out of the tournament signups by "+sys.name(src)+" from the "+getFullTourName(key)+" tournament!", tourschan, false);
                    }
                    else {
                        disqualify(tar.toLowerCase(), key, false)
                    }
                }
                sendBotAll("And "+toCorrectCase(tar)+" was gone!",tourschan,false)
                tours.tourbans.push(tar)
                return true;
            }
            if (command == "tourunban") {
                var tar = commandData.toLowerCase();
                if (sys.dbIp(tar) === undefined) {
                    sendBotMessage(src, "No such user",tourschan,false)
                    return true;
                }
                var index = tours.tourbans.indexOf(tar)
                if (index == -1) {
                    sendBotMessage(src, "They aren't tourbanned!",tourschan,false)
                    return true;
                }
                tours.tourbans.splice(index,1)
                sendBotMessage(src, "You unbanned "+toCorrectCase(tar)+" from tournaments!",tourschan,false)
                return true;
            }
        }
        if (isTourAdmin(src)) {
            if (command == "tour" || ((command == "tourstart" || command == "shift") && isTourSuperAdmin(src))) {
                var data = commandData.split(":",2)
                var tourtier = find_tier(data[0])
                if (tourtier === null) {
                    sendBotMessage(src, "The tier '"+commandData+"' doesn't exist! Make sure the tier is typed out correctly and that it exists.", tourschan, false)
                    return true;
                }
                if (tourtier.indexOf("Smogon") != -1 && !isTourSuperAdmin(src)) {
                    sendBotMessage(src, "You are not permitted to run Smogon tier tournaments!", tourschan, false)
                    return true;
                }
                var lasttours = getListOfTours(7);
                var lastindex = lasttours.indexOf(tourtier);
                if (lastindex != -1 && !isTourSuperAdmin(src)) {
                    sendBotMessage(src, "A "+tourtier+" tournament is in the queue, is running or was recently run, no repeating!", tourschan, false)
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
                var parameters = {"gen": "default", "mode": modeOfTier(tourtier), "type": detiers.indexOf(tourtier) == -1 ? "single" : "double", "maxplayers": false};
                if (data.length > 1) {
                    var parameterdata = data[1].split("*");
                    for (var p in parameterdata) {
                        var parameterinfo = parameterdata[p].split("=",2);
                        var parameterset = parameterinfo[0]
                        var parametervalue = parameterinfo[1]
                        if (cmp(parameterset, "mode")) {
                            var singlesonlytiers = ["DW 1v1", "DW 1v1 Ubers", "CC 1v1", "Wifi CC 1v1", "GBU Singles", "Adv Ubers", "Adv OU", "DP Ubers", "DP OU", "No Preview OU", "No Preview Ubers", "Wifi OU", "Wifi Ubers"];
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
                            var newgen = getSubgen(parametervalue, false)
                            if (newgen !== false) {
                                parameters.gen = newgen
                            }
                            else {
                                parameters.gen = "5-1" // BW2
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
                        }
                        else if (cmp(parameterset, "event") && isTourOwner(src)) {
                            var players = parseInt(parametervalue)
                            var allowedcounts = [16,32,64,128,256];
                            if (allowedcounts.indexOf(players) == -1) {
                                sendBotMessage(src, "Invalid number of players for event mode!", tourschan, false);
                                return true;
                            }
                            parameters.maxplayers = players;
                            parameters.type = "double"; // events are always doubles
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
                    sendBotMessage(src, "There are already "+tourconfig.maxqueue+" or more tournaments in the queue, so you can't add another one!", tourschan, false)
                    return true;
                }
                else if (isSignups || ((tours.keys.length > 0 || tours.queue.length > 0) && (command == "tour" || command == "shift"))) {
                    if (command == "shift") {
                        tours.queue.unshift(tourtier+":::"+sys.name(src)+":::"+parameters.mode+":::"+parameters.gen+":::"+parameters.type+":::"+parameters.maxplayers)
                    }
                    else {
                        tours.queue.push(tourtier+":::"+sys.name(src)+":::"+parameters.mode+":::"+parameters.gen+":::"+parameters.type+":::"+parameters.maxplayers)
                    }
                    sendBotAll(sys.name(src)+" added a "+tourtier+" tournament into the "+(command == "shift" ? "front of" : "")+" queue! Type /queue to see what is coming up next.",tourschan, false)
                }
                else {
                    tourstart(tourtier, sys.name(src), tours.key, parameters)
                    if (command == "tourstart") {
                        sendBotAll(sys.name(src)+" force started this tournament!", tourschan, false)
                    }
                }
                addTourActivity(src)
                return true;
            }
            if (command == "changecount") {
                var key = null
                for (var x in tours.tour) {
                    if (tours.tour[x].state == "signups") {
                        key = x;
                    }
                }
                if (key === null) {
                    sendBotMessage(src,"No tournament is in signups!",tourschan,false)
                    return true;
                }
                if (tours.tour[key].maxplayers === "default") {
                    sendBotMessage(src,"Cna't change the count of a timed tour!",tourschan,false)
                    return true;
                }
                var players = parseInt(commandData)
                var allowedcounts = [16,32,64,128,256];
                if (allowedcounts.indexOf(players) == -1) {
                    sendBotMessage(src, "Invalid number of players for event mode!", tourschan, false);
                    return true;
                }
                else if (players < tours.tour[key].cpt) {
                    sendBotMessage(src, "There are more players in the tournament then you specified!", tourschan, false);
                    return true;
                }
                else {
                    tours.tour[key].maxplayers = players;
                    sendBotAll(sys.name(src)+" changed the number of places in the "+tours.tour[key].tourtype+" tournament to "+players+"! There are now "+(tours.tour[key].maxplayers - tours.tour[key].cpt)+" place"+(tours.tour[key].maxplayers - tours.tour[key].cpt == 1 ? "" : "s")+" remaining!", tourschan,false)
                }
                return true;
            }
            if (command == "remove") {
                var index = -1
                if (!isNaN(parseInt(commandData))) {
                    index = parseInt(commandData)-1
                }
                else {
                    for (var a = tours.queue.length-1; a>=0; a -= 1) {
                        var tourtoremove = (tours.queue[a].split(":::",1))[0].toLowerCase()
                        if (commandData.toLowerCase() == tourtoremove) {
                            index = a;
                            break;
                        }
                    }
                }
                if (index < 0 || index >= tours.queue.length) {
                    sendBotMessage(src, "The tier '"+commandData+"' doesn't exist in the queue, so it can't be removed! Make sure the tier is typed out correctly.", tourschan, false)
                    return true;
                }
                else {
                    var removedata = tours.queue[index].split(":::",2)
                    var removedtour = removedata[0]
                    var allowed = removedata[1] != "~Pokemon Online~"
                    if (!allowed && !isTourOwner(src)) {
                        sendBotMessage(src, "You are not permitted to remove event tours from the queue!", tourschan, false)
                        return true;
                    }
                    tours.queue.splice(index, 1)
                    sendBotAll("The "+removedtour+" tour (position "+(index+1)+") was removed from the queue by "+sys.name(src)+".", tourschan, false)
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
                    sendBotMessage(src,"The "+commandData+" tournament is not in progress!",tourschan,false)
                    return true;
                }
                sendBotAll("The "+getFullTourName(key)+" tournament was cancelled by "+sys.name(src)+"!", tourschan,false)
                delete tours.tour[key];
                tours.keys.splice(tours.keys.indexOf(key), 1);
                if (tours.globaltime !== -1) {
                    var variance = calcVariance()
                    tours.globaltime = parseInt(sys.time()) + parseInt(tourconfig.abstourbreak/variance) // default 10 mins b/w signups, + 5 secs per user in chan
                }
                return true;
            }
            if (command == "passta") {
                var newname = commandData
                var tadmins = tours.touradmins
                if (sys.dbIp(newname) === undefined) {
                   sendBotMessage(src,"This user doesn't exist!",tourschan,false)
                    return true;
                }
                if (!sys.dbRegistered(newname)) {
                    sendBotMessage(src,"That account isn't registered so you can't give it authority!",tourschan,false)
                    return true;
                }
                if (tadmins !== undefined) {
                    for (var t in tadmins) {
                        if (cmp(tadmins[t].toLowerCase(), newname)) {
                            sendBotMessage(src,"The target is already a tour admin!",tourschan,false)
                            return true;
                        }
                    }
                }
                if (sys.id(newname) === undefined) {
                    sendBotMessage(src,"The target is offline!",tourschan,false)
                    return true;
                }
                if (sys.ip(sys.id(newname)) !== sys.ip(src)) {
                    sendBotMessage(src,"Both accounts must be on the same IP to switch!",tourschan,false)
                    return true;
                }
                var index = -1;
                for (var t=0;t<tadmins.length;t++) {
                    if (cmp(tadmins[t],sys.name(src))) {
                        index = t;
                        break;
                    }
                }
                if (index == -1) {
                    sendBotMessage(src,"You need to be tour auth to pass it!",tourschan,false)
                    return true;
                }
                tadmins.splice(t, 1, toCorrectCase(newname))
                tours.touradmins = tadmins
                saveTourKeys()
                sendBotAll(sys.name(src)+" passed their tour auth to "+toCorrectCase(newname)+"!",tourschan,false)
                sendBotAll(sys.name(src)+" passed their tour auth to "+toCorrectCase(newname)+"!",sys.channelId("Victory Road"),false)
                sendBotAll(sys.name(src)+" passed their tour auth to "+toCorrectCase(newname)+"!",sys.channelId("Indigo Plateau"),false)
                return true;
            }
            if (command == "dq") {
                var key = isInTour(commandData)
                if (key === false) {
                    sendBotMessage(src,"That player isn't in a tournament!",tourschan,false)
                    return true;
                }
                if (tours.tour[key].state == "signups") {
                    var index = tours.tour[key].players.indexOf(commandData.toLowerCase())
                    tours.tour[key].players.splice(index, 1)
                    tours.tour[key].cpt -= 1
                    sendBotAll(toCorrectCase(commandData)+" was taken out of the tournament signups by "+sys.name(src)+" from the "+getFullTourName(key)+" tournament!", tourschan);
                }
                else {
                    sendBotAll(sys.name(src)+" disqualified "+toCorrectCase(commandData)+" from the "+getFullTourName(key)+" tournament!", tourschan, false)
                    disqualify(commandData.toLowerCase(), key, false, true)
                }
                addTourActivity(src)
                return true;
            }
            if (command == "cancelbattle") {
                var key = isInTour(name)
                if (key === false) {
                    sendBotMessage(src,"That player isn't in a tournament!",tourschan,false)
                    return true;
                }
                var index = tours.tour[key].battlers.indexOf(commandData.toLowerCase())
                if (index == -1) {
                    sendBotMessage(src,"That player isn't battling for the tournament!",tourschan,false)
                    return true;
                }
                else {
                    var opponent = index%2 === 0 ? tours.tour[key].battlers[index+1] : tours.tour[key].battlers[index-1]
                    sendBotAll(sys.name(src)+" voided the results of the battle between "+toCorrectCase(commandData)+" and "+toCorrectCase(opponent)+" in the "+getFullTourName(key)+" tournament, please rematch.", tourschan, false)
                    tours.tour[key].battlers.splice(index,1)
                    tours.tour[key].battlers.splice(tours.tour[key].battlers.indexOf(opponent),1)
                }
                addTourActivity(src)
                return true;
            }
            if (command == "sub") {
                var data = commandData.split(":",2)
                var newname = data[0].toLowerCase()
                var oldname = data[1].toLowerCase()
                var key = isInTour(oldname)
                if (sys.id(newname) === undefined) {
                    sendBotMessage(src,"It's not a good idea to sub a player in who isn't on the server at the moment!",tourschan,false)
                    return true;
                }
                if (key === false) {
                    sendBotMessage(src,"Your target doesn't exist in a tournament!",tourschan,false)
                    return true;
                }
                if (isInTour(newname) !== false) {
                    sendBotMessage(src,"Your target is already in a tournament!",tourschan,false)
                    return true;
                }
                tours.tour[key].players.splice(tours.tour[key].players.indexOf(oldname),1,newname)
                sendBotAll(sys.name(src)+" substituted "+toCorrectCase(newname)+" in place of "+toCorrectCase(oldname)+" in the "+getFullTourName(key)+" tournament.", tourschan, false)
                addTourActivity(src)
                return true;
            }
            if (command == "tourmute") {
                var data = commandData.split(":", 3);
                var tar = data[0];
                var reason = data[1];
                var time = 900;
                if (data.length > 2) {
                    var time = converttoseconds(data[2]);
                }
                var ip = sys.dbIp(tar)
                if (sys.id(tar) !== undefined) {
                    if (isTourAdmin(sys.id(tar)) && sys.maxAuth(ip) >= sys.auth(src)) {
                        sendBotMessage(src,"Can't mute higher auth!",tourschan, false)
                        return true;
                    }
                }
                else {
                    if ((tours.touradmins.indexOf(tar.toLowerCase()) > -1 || sys.maxAuth(ip) >= 1) && sys.maxAuth(ip) >= sys.auth(src)) {
                        sendBotMessage(src,"Can't mute higher auth!",tourschan, false)
                        return true;
                    }
                }
                if (ip === undefined) {
                    sendBotMessage(src,"This person doesn't exist!",tourschan,false)
                    return true;
                }
                if (tours.tourmutes.hasOwnProperty(ip)) {
                    sendBotMessage(src,"They are already tourmuted!",tourschan,false)
                    return true;
                }
                if (reason === undefined) {
                    reason = "";
                }
                if (reason === "" && !isTourOwner(src)) {
                    sendBotMessage(src,"You must provide a reason!",tourschan, false)
                    return true;
                }
                if (time <= 0) {
                    sendBotMessage(src,"Can't tourmute someone for less than 1 second!",tourschan, false)
                    return true;
                }
                if (usingBadWords(reason)) {
                    sendBotMessage(src,"'"+reason+"' is not a valid reason!",tourschan,false)
                    return true;
                }
                var maxtime = 0;
                if (isTourOwner(src)) {
                    maxtime = Number.POSITIVE_INFINITY
                }
                else if (isTourSuperAdmin(src)) {
                    maxtime = 2592000
                }
                else if (sys.auth(src) >= 1) {
                    maxtime = 86400
                }
                else {
                    maxtime = 3600
                }
                if (isNaN(time)) {
                    time = 900;
                }
                if (time > maxtime) {
                    time = maxtime;
                }
                var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), tourschan]
                tours.tourmutes[ip] = {'expiry': parseInt(sys.time()) + time, 'reason': reason, 'auth': sys.name(src), 'name': tar.toLowerCase()}
                var key = isInTour(tar);
                if (key !== false) {
                    if (tours.tour[key].state == "signups") {
                        var index = tours.tour[key].players.indexOf(tar.toLowerCase())
                        tours.tour[key].players.splice(index, 1)
                        tours.tour[key].cpt -= 1
                        sendBotAll(toCorrectCase(tar)+" was taken out of the tournament signups by "+sys.name(src)+" from the "+getFullTourName(key)+" tournament!", tourschan, false);
                    }
                    else {
                        disqualify(tar.toLowerCase(), key, false, true)
                    }
                }
                for (var x in channels) {
                    if (sys.existChannel(sys.channel(channels[x]))) {
                        sendBotAll(tar+" was tourmuted by "+sys.name(src)+" for "+time_handle(time)+"! "+(reason !== "" ? "[Reason: "+reason+"]" : ""), channels[x], false)
                    }
                }
                saveTourMutes()
                return true;
            }
            if (command == "tourunmute") {
                var ip = sys.dbIp(commandData)
                if (ip === undefined) {
                    sendBotMessage(src,"This person doesn't exist!",tourschan,false)
                    return true;
                }
                if (!tours.tourmutes.hasOwnProperty(ip)) {
                    sendBotMessage(src,"They aren't tourmuted!",tourschan,false)
                    return true;
                }
                if (ip === sys.ip(src) && !isTourOwner(src)) {
                    sendBotMessage(src,"You can't unmute yourself!",tourschan,false)
                    return true;
                }
                delete tours.tourmutes[ip];
                var channels = [sys.channelId("Indigo Plateau"), sys.channelId("Victory Road"), tourschan]
                for (var x in channels) {
                    if (sys.existChannel(sys.channel(channels[x]))) {
                        sendBotAll(commandData+" was untourmuted by "+sys.name(src)+"!", channels[x], false)
                    }
                }
                saveTourMutes()
                return true;
            }
            if (command == "tourmutes") {
                sys.sendMessage(src,"*** TOURS MUTELIST ***",tourschan)
                for (var t in tours.tourmutes) {
                    if (tours.tourmutes[t].expiry > parseInt(sys.time())) {
                        sys.sendMessage(src, tours.tourmutes[t].name + ": Set by "+tours.tourmutes[t].auth+"; expires in "+time_handle(tours.tourmutes[t].expiry-parseInt(sys.time()))+"; reason: "+tours.tourmutes[t].reason, tourschan)
                    }
                }
                return true;
            }
            if (command == "config") {
                sys.sendMessage(src,"*** CURRENT CONFIGURATION ***",tourschan)
                sys.sendMessage(src,"Maximum Queue Length: "+tourconfig.maxqueue,tourschan)
                sys.sendMessage(src,"Maximum Number of Simultaneous Tours: "+tourconfig.maxrunning,tourschan)
                sys.sendMessage(src,"Tour Sign Ups Length: "+time_handle(tourconfig.toursignup),tourschan)
                sys.sendMessage(src,"Tour Auto DQ length: "+time_handle(tourconfig.tourdq),tourschan)
                sys.sendMessage(src,"Tour Activity Check: "+time_handle(tourconfig.activity),tourschan)
                sys.sendMessage(src,"Substitute Time: "+time_handle(tourconfig.subtime),tourschan)
                sys.sendMessage(src,"Tour Break Time: "+time_handle(tourconfig.tourbreak),tourschan)
                sys.sendMessage(src,"Absolute Tour Break Time: "+time_handle(tourconfig.abstourbreak),tourschan)
                sys.sendMessage(src,"Tour Reminder Time: "+time_handle(tourconfig.reminder),tourschan)
                sys.sendMessage(src,"Auto start when percentage of players is less than: "+tourconfig.minpercent+"%",tourschan)
                sys.sendMessage(src,"Bot Name: "+tourconfig.tourbot,tourschan)
                sys.sendMessage(src,"Colour: "+tourconfig.tourbotcolour,tourschan)
                sys.sendMessage(src,"Channel: "+tourconfig.channel,tourschan)
                sys.sendMessage(src,"Error Channel: "+tourconfig.errchannel,tourschan)
                sys.sendMessage(src,"Scoring system activated: "+tourconfig.points,tourschan)
                sys.sendMessage(src,"Debug: "+tourconfig.debug,tourschan)
                return true;
            }
            if (command == "configset") {
                var pos = commandData.indexOf(":")
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
                    sys.sendMessage(src,"botname: "+tourconfig.tourbot,tourschan);
                    sys.sendMessage(src,"colour: "+tourconfig.tourbotcolour,tourschan);
                    sys.sendMessage(src,"channel: "+tourconfig.channel,tourschan);
                    sys.sendMessage(src,"scoring: "+tourconfig.points,tourschan);
                    sys.sendMessage(src,"debug: "+tourconfig.debug+" (to change this, type /configset debug [0/1] ~ true = 1; false = 0)",tourschan);
                    return true;
                }
                var option = commandData.substr(0,pos).toLowerCase()
                if (["botname", "bot name", "channel", "errchannel", "color", "colour"].indexOf(option) == -1) {
                    var value = parseInt(commandData.substr(pos+1))
                }
                else {
                    var value = commandData.substr(pos+1)
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
                    tourconfig.maxqueue = value
                    sys.saveVal("tourconfig.txt", "maxqueue", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the maximum queue length to "+tourconfig.maxqueue)
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
                    tourconfig.maxrunning = value
                    sys.saveVal("tourconfig.txt", "maxrunning", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the maximum number of simultaneous tours to "+tourconfig.maxrunning)
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
                    tourconfig.toursignup = value
                    sys.saveVal("tourconfig.txt", "toursignup", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the sign up time to "+time_handle(tourconfig.toursignup))
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
                    tourconfig.tourdq = value
                    sys.saveVal("tourconfig.txt", "tourdq", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the disqualification time to "+time_handle(tourconfig.tourdq))
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
                    tourconfig.activity = value
                    sys.saveVal("tourconfig.txt", "touractivity", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the activity time to "+time_handle(tourconfig.activity))
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
                    tourconfig.subtime = value
                    sys.saveVal("tourconfig.txt", "subtime", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the sub time to "+time_handle(tourconfig.subtime))
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
                    tourconfig.tourbreak = value
                    sys.saveVal("tourconfig.txt", "breaktime", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the break time (betweeen cancelled tournaments) to "+time_handle(tourconfig.tourbreak))
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
                    tourconfig.abstourbreak = value
                    sys.saveVal("tourconfig.txt", "absbreaktime", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the absolute break time (base time between starting tours) to "+time_handle(tourconfig.abstourbreak))
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
                    tourconfig.reminder = value
                    sys.saveVal("tourconfig.txt", "remindertime", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the reminder time to "+time_handle(tourconfig.reminder))
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
                    else if (value < 1 || value > 30) {
                        sendBotMessage(src,"Value must be between 1 and 30.",tourschan,false);
                        return true;
                    }
                    tourconfig.minpercent = value
                    sys.saveVal("tourconfig.txt", "minpercent", value)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the auto start percentage to "+tourconfig.minpercent+"%")
                    return true;
                }
                else if (option == 'color' || option == 'colour') {
                    if (!isTourSuperAdmin(src)) {
                        sendBotMessage(src,"Can't change the bot colour, ask an admin for this.",tourschan,false);
                        return true;
                    }
                    else if (value.length !== 6) {
                        sendBotMessage(src,"String must be 6 hexnumbers long",tourschan,false);
                        return true;
                    }
                    for (var x=0;x<6;x++) {
                        var allowedchars = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"]
                        if (allowedchars.indexOf(value.charAt(x)) == -1) {
                            sendBotMessage(src,"There was an error with the colour code you tried to put in.",tourschan,false);
                            return true;
                        }
                    }
                    tourconfig.tourbotcolour = "#"+value
                    sys.saveVal("tourconfig.txt", "tourbotcolour", "#"+value)
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
                    tourconfig.tourbot = value+" "
                    sys.saveVal("tourconfig.txt", "tourbot", value+" ")
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
                    tourconfig.channel = value
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the tournament channel to "+tourconfig.channel,tourschan,false);
                    tourschan = sys.channelId(tourconfig.channel)
                    sys.sendAll("Version "+tourconfig.version+" of tournaments has been loaded successfully in this channel!", tourschan)
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
                    tourconfig.points = (value == 1 ? true : false)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the scoring mode to "+tourconfig.points,tourschan,false);
                    return true;
                }
                else if (option == 'debug') {
                    if (!isTourOwner(src)) {
                        sendBotMessage(src,"Can't turn debug on/off, ask an owner for this.",tourschan,false);
                        return true;
                    }
                    if (value !== 0 && value != 1) {
                        sendBotMessage(src,"Value must be 0 (turns debug off) or 1 (turns it on).",tourschan,false);
                        return true;
                    }
                    tourconfig.debug = (value == 1 ? true : false)
                    sendAllTourAuth(tourconfig.tourbot+sys.name(src)+" set the debug mode to "+tourconfig.debug,tourschan,false);
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
            if (isTourMuted(src) || isTourBanned(src)) {
                sendBotMessage(src, "You are tourmuted so you are prohibited from playing!", tourschan, false);
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
                sendBotMessage(src, "No tournament has signups available at the moment!",tourschan,false)
                return true;
            }
            if (!sys.hasTier(src, tours.tour[key].tourtype)) {
                sendBotMessage(src, "You need to have a team in the "+tours.tour[key].tourtype+" tier to join!",tourschan,false)
                return true;
            }
            var isInCorrectGen = false;
            for (var x=0; x<sys.teamCount(src); x++) {
                if (sys.tier(src, x) === tours.tour[key].tourtype) {
                    if (tours.tour[key].parameters.gen != "default") {
                        var getGenParts = tours.tour[key].parameters.gen.split("-",2)
                        if (parseInt(sys.gen(src,x)) === parseInt(getGenParts[0]) && parseInt(sys.subgen(src,x)) === parseInt(getGenParts[1])) {
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
            if (!isInCorrectGen) {
                sendBotMessage(src, "Your generation must be set to "+getSubgen(tours.tour[key].parameters.gen, true)+". Change it in the teambuilder.",tourschan,false)
                return true;
            }
            /* Is already in another tour */
            var isStillInTour = isInTour(sys.name(src))
            if (isStillInTour !== false) {
                if (tours.tour[isStillInTour].state == "subround" || tours.tour[isStillInTour].state == "signups") {
                    sendBotMessage(src, "You can't join twice!",tourschan,false)
                }
                else {
                    sendBotMessage(src, "You can't join two tournaments at once with the same name!",tourschan,false)
                }
                return true;
            }
            /* Multiple account check */
            for (var a=0; a<tours.tour[key].players.length; a++) {
                var joinedip = sys.dbIp(tours.tour[key].players[a])
                if (sys.ip(src) == joinedip && ((sys.maxAuth(sys.ip(src)) < 2 && tourconfig.debug === true) || (sys.auth(src) < 3 && tourconfig.debug === false))) {
                    sendBotMessage(src, "You already joined the tournament under the name '"+tours.tour[key].players[a]+"'!",tourschan,false)
                    return true;
                }
            }
            /* Event check */
            if (typeof tours.tour[key].maxplayers === "number") {
                var alreadyplayed = tours.eventnames;
                for (var n=0; n<alreadyplayed.length; n++) {
                    var name = alreadyplayed[n]
                    var usedip = sys.dbIp(name)
                    if (sys.ip(src) == usedip || cmp(sys.name(src),name)) {
                        sendBotMessage(src, "You already joined an event tournament today under the name '"+name+"'! Wait until tomorrow to join another one (you can still play normal tournaments)",tourschan,false)
                        return true;
                    }
                }
            }
            if (tours.tour[key].state == "signups") {
                tours.tour[key].players.push(sys.name(src).toLowerCase())
                tours.tour[key].cpt += 1
                if (tours.tour[key].maxcpt !== undefined) {
                    if (tours.tour[key].cpt > tours.tour[key].maxcpt && tours.tour[key].maxplayers === "default") {
                        tours.tour[key].maxcpt = tours.tour[key].cpt
                        if (tours.tour[key].maxcpt == 5) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/6)
                        }
                        else if (tours.tour[key].maxcpt == 9) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/4)
                        }
                        else if (tours.tour[key].maxcpt == 17) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/3)
                            sendBotAll("Over 16 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time()))+" to join!",0,true)
                        }
                        else if (tours.tour[key].maxcpt == 33) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/2)
                            sendBotAll("Over 32 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time()))+" to join!",0,true)
                        }
                        else if (tours.tour[key].maxcpt == 65) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup/1.5)
                            sendBotAll("Over 64 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time()))+" to join!",0,true)
                        }
                        else if (tours.tour[key].maxcpt == 129) {
                            tours.tour[key].time += Math.floor(tourconfig.toursignup)
                            sendBotAll("Over 128 players have joined the "+html_escape(getFullTourName(key))+" tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a>! You still have "+time_handle(tours.tour[key].time - parseInt(sys.time()))+" to join!",0,true)
                        }
                    }
                }
                if (tours.tour[key].maxplayers === "default") {
                    sendBotAll("<b>"+html_escape(sys.name(src))+"</b> is player #"+tours.tour[key].players.length+" to join the "+html_escape(getFullTourName(key))+" tournament! "+(tours.tour[key].time - parseInt(sys.time()))+" second"+(tours.tour[key].time - parseInt(sys.time()) == 1 ? "" : "s")+" remaining!", tourschan, true)
                    // 256 players max
                    if (tours.tour[key].players.length >= 256) {
                        tours.tour[key].time = parseInt(sys.time())
                    }
                }
                else {
                    sendBotAll("<b>"+html_escape(sys.name(src))+"</b> is player #"+tours.tour[key].players.length+" to join the "+html_escape(getFullTourName(key))+" tournament! "+(tours.tour[key].maxplayers - tours.tour[key].cpt)+" place"+(tours.tour[key].maxplayers - tours.tour[key].cpt == 1 ? "" : "s")+" remaining!", tourschan, true)
                    // end signups if maxplayers have been reached
                    if (tours.tour[key].players.length >= tours.tour[key].maxplayers) {
                        tours.tour[key].time = parseInt(sys.time())
                    }
                }
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
                    sendBotMessage(src, "You can't sub in to the "+getFullTourName(key)+" tournament!",tourschan, false)
                    return true;
                }
            }

            if (oldname === null) {
                sendBotMessage(src, "There are no subs remaining in the "+getFullTourName(key)+" tournament!",tourschan, false)
                return true;
            }
            var index = tours.tour[key].players.indexOf(oldname)
            var newname = sys.name(src).toLowerCase()
            tours.tour[key].players.splice(index,1,newname)
            tours.tour[key].seeds.splice(tours.tour[key].cpt,1,newname)
            tours.tour[key].cpt += 1
            var oppname = index%2 == 0 ? toCorrectCase(tours.tour[key].players[index+1]) : toCorrectCase(tours.tour[key].players[index-1])
            sendBotAll("Late entrant "+sys.name(src)+" will play against "+oppname+" in the "+getFullTourName(key)+" tournament. "+(tours.tour[key].players.length - tours.tour[key].cpt)+" sub"+(tours.tour[key].players.length - tours.tour[key].cpt == 1 ? "" : "s") + " remaining.", tourschan, false)
            sendBotMessage(sys.id(oppname),"Late entrant "+html_escape(sys.name(src))+" will play against you in the "+html_escape(getFullTourName(key))+" tournament.<ping/>", tourschan, true)
            markActive(src, "post")
            markActive(sys.id(oppname), "post")
            return true;
        }
        if (command == "unjoin") {
            var key = null
            var atSignups = false;
            for (var x in tours.tour) {
                if (isInTour(sys.name(src)) === x && typeof tours.tour[x].maxplayers == "number" && tours.tour[x].state != "signups") {
                    key = x;
                    break;
                }
                if (tours.tour[x].state == "signups") {
                    key = x;
                    atSignups = true;
                    break;
                }
            }
            if (key === null) {
                sendBotMessage(src, "You can't unjoin now!",tourschan,false)
                return true;
            }
            if (atSignups) {
                var index = tours.tour[key].players.indexOf(sys.name(src).toLowerCase())
                if (index == -1) {
                    sendBotMessage(src, "You aren't in the "+getFullTourName(key)+" tournament!",tourschan,false)
                    return true;
                }
                tours.tour[key].players.splice(index, 1)
                tours.tour[key].cpt -= 1
                sendBotAll(sys.name(src)+" unjoined the "+getFullTourName(key)+" tournament!", tourschan, false)
            }
            else {
                sendBotAll(sys.name(src)+" resigned from the "+getFullTourName(key)+" tournament!", tourschan, false)
                disqualify(sys.name(src).toLowerCase(), key, false, true)
            }
            return true;
        }
        if (command == "queue" || command == "viewqueue") {
            var queue = tours.queue
            sys.sendMessage(src, "*** Upcoming Tours ***", tourschan)
            var nextstart = time_handle(tours.globaltime - parseInt(sys.time()))
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
            for (var e in queue) {
                var queuedata = queue[e].split(":::",6)
                if (firsttour && nextstart != "Pending") {
                    sys.sendMessage(src,"1) "+queuedata[0]+": Set by "+queuedata[1]+"; Parameters: "+queuedata[2]+" Mode"+(queuedata[3] != "default" ? "; Gen: "+getSubgen(queuedata[3],true) : "")+(queuedata[4] == "double" ? "; Double Elimination" : "")+(!isNaN(parseInt(queuedata[5])) ? "; For "+ queuedata[5] +" players": "")+"; Starts in "+time_handle(tours.globaltime-parseInt(sys.time())),tourschan)
                    firsttour = false
                }
                else {
                    sys.sendMessage(src,(parseInt(e)+1)+") "+queuedata[0]+": Set by "+queuedata[1]+"; Parameters: "+queuedata[2]+" Mode"+(queuedata[3] != "default" ? "; Gen: "+getSubgen(queuedata[3],true) : "")+(queuedata[4] == "double" ? "; Double Elimination" : "")+(!isNaN(parseInt(queuedata[5])) ? "; For "+ queuedata[5] +" players": ""), tourschan)
                }
            }
            return true;
        }
        if (command == "viewround") {
            if (tours.keys.length === 0) {
                sendBotMessage(src, "No tournament is running at the moment!",tourschan, false)
                return true;
            }
            var postedrounds = false;
            var rounddata = [];
            for (var y in tours.tour) {
                var battlers = tours.tour[y].battlers
                var winners = tours.tour[y].winners
                if (tours.tour[y].round === 0) continue;
                postedrounds = true;
                var roundtable = "<div style='margin-left: 50px'><b>Round "+tours.tour[y].round+" of the "+tours.tour[y].tourtype+" Tournament</b><table><br/>"
                for (var x=0; x<tours.tour[y].players.length; x+=2) {
                    if (winners.indexOf(tours.tour[y].players[x]) != -1 && tours.tour[y].players[x] != "~Bye~" && tours.tour[y].players[x] != "~DQ~") {
                        roundtable = roundtable + "<tr><td align='right'><font color=green><b>"+toTourName(tours.tour[y].players[x]) +"</b></font></td><td align='center'> won against </td><td>"+ toTourName(tours.tour[y].players[x+1])+"</td>"
                    }
                    else if (winners.indexOf(tours.tour[y].players[x+1]) != -1 && tours.tour[y].players[x+1] != "~Bye~" && tours.tour[y].players[x+1] != "~DQ~") {
                        roundtable = roundtable + "<tr><td align='right'><font color=green><b>"+toTourName(tours.tour[y].players[x+1]) +"</b></font></td><td align='center'> won against </td><td>"+ toTourName(tours.tour[y].players[x])+"</td>"
                    }
                    else if (battlers.indexOf(tours.tour[y].players[x]) != -1) {
                        roundtable = roundtable + "<tr><td align='right'>"+toTourName(tours.tour[y].players[x]) +"</td><td align='center'> <a href='po:watchPlayer/"+sys.id(tours.tour[y].players[x])+"'>is battling</a> </td><td>"+ toTourName(tours.tour[y].players[x+1])+"</td>"
                    }
                    else {
                        roundtable = roundtable + "<tr><td align='right'>"+toTourName(tours.tour[y].players[x]) +"</td><td align='center'> VS </td><td>"+ toTourName(tours.tour[y].players[x+1])+"</td>"
                    }
                }
                rounddata.push(roundtable+"</table></div>")
            }
            if (!postedrounds) {
                sendBotMessage(src, "No tournament is running at the moment!",tourschan,false)
                return true;
            }
            else {
                var roundstosend = htmlborder+rounddata.join(htmlborder)+htmlborder
                sys.sendHtmlMessage(src, roundstosend, tourschan)
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
            sys.sendMessage(src, "",tourschan)
            return true;
        }
        if (command == "tourinfo") {
            try {
                if (commandData == "") {
                    sendBotMessage(src, "Please specify a person!",tourschan,false)
                    return true;
                }
                else {
                    var score = 0;
                    var rankings = sys.getFileContent("tourscores.txt").split("\n")
                    if (rankings === undefined) {
                        throw ("No data")
                    }
                    for (var p in rankings) {
                        if (rankings[p] == "") continue;
                        var rankingdata = rankings[p].split(":::",2)
                        if (cmp(rankingdata[0],commandData)) {
                            score = rankingdata[1]
                            break;
                        }
                    }
                    sys.sendMessage(src, commandData+" currently has "+score+" tour points.",tourschan)
                    if (!isTourOwner(src)) {
                        sendBotMessage(src, "This command is currently restricted!",tourschan,false)
                        return true;
                    }
                    var tourdata = sys.getFileContent("tourdetails.txt")
                    // sys.sendMessage(src, "*** TOURNAMENT DETAILS FOR "+commandData+" (Score: "+score+")***",tourschan)
                    var tourinfopieces = tourdata.split("\n")
                    for (var x in tourinfopieces) {
                        var datatoread = tourinfopieces[x].split(":::",4)
                        if (cmp(datatoread[0],commandData)) {
                            sys.sendMessage(src, datatoread[2]+": Won with "+datatoread[1]+" entrants on "+datatoread[3],tourschan)
                        }
                    }
                }
                sys.sendMessage(src, "",tourschan)
            }
            catch (err) {
                if (err == "No data") {
                    sendBotMessage(src, commandData+" is not a valid tier!",tourschan, false)
                }
                else {
                    throw(err)
                }
            }
            return true;
        }
        if (command == "activeta") {
            sys.sendMessage(src, "",tourschan)
            sys.sendMessage(src, "*** ACTIVE TOURNAMENT ADMINS ***",tourschan)
            var tal = tours.touradmins
            var authlist = sys.dbAuths()
            for (var l in tal) {
                if (sys.id(tal[l]) !== undefined && SESSION.users(sys.id(tal[l])).lastline.time + tourconfig.activity > parseInt(sys.time())) {
                    sys.sendMessage(src, toCorrectCase(tal[l]), tourschan)
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
            var type = commandData.toLowerCase()
            sys.sendMessage(src, border,tourschan);
            sys.sendMessage(src, "*** Tournament Commands ***",tourschan);
            if (type == "" || type == "tournament") {
                for (var t in tourcommands) {
                    sys.sendMessage(src, tourcommands[t],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (isTourAdmin(src) && (type == "mod" || type == "megauser" || type == "")) {
                for (var m in tourmodcommands) {
                    sys.sendMessage(src, tourmodcommands[m],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (isTourSuperAdmin(src) && (type == "admin" || type == "")) {
                for (var a in touradmincommands) {
                    sys.sendMessage(src, touradmincommands[a],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            if (isTourOwner(src) && (type == "owner" || type == "")) {
                for (var o in tourownercommands) {
                    sys.sendMessage(src, tourownercommands[o],tourschan);
                }
                sys.sendMessage(src, border,tourschan);
            }
            return true;
        }
        if (command == "rules" || command == "tourrules") {
            sys.sendMessage(src, border,tourschan);
            for (var t in tourrules) {
                sys.sendMessage(src, tourrules[t],tourschan);
            }
            sys.sendMessage(src, border,tourschan);
            return true;
        }
        if (command == "leaderboard") {
            try {
                if (commandData == "") {
                    var rankdata = sys.getFileContent("tourscores.txt")
                }
                else {
                    var tourtier = find_tier(commandData)
                    if (tourtier === null) {
                        throw ("Not a valid tier")
                    }
                    var rankdata = sys.getFileContent("tourscores_"+tourtier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt")
                }
                if (rankdata === undefined) {
                    throw ("No data")
                }
                var rankings = rankdata.split("\n")
                var list = [];
                for (var p in rankings) {
                    if (rankings[p] == "") continue;
                    var rankingdata = rankings[p].split(":::",2)
                    if (rankingdata[1] < 1) continue;
                    list.push([rankingdata[1], rankingdata[0]]);
                }
                list.sort(function(a,b) { return b[0] - a[0] ; });
                sys.sendMessage(src, "*** TOURNAMENT RANKINGS "+(commandData != "" ? "("+commandData+") " : "")+"***",tourschan)
                var ownnameprinted = false;
                var rankkey = [0, 0] // rank, points
                for (var x=0; x<65536; x++) {
                    if (x >= list.length || (ownnameprinted && rankkey[0]>10)) break;
                    if (rankkey[0] <= 10 || cmp((list[x])[1], sys.name(src))) {
                        if (rankkey[1] === parseInt((list[x])[0])) {
                            sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                        }
                        else {
                            sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                            rankkey = [x+1, parseInt((list[x])[0])]
                        }
                        if (cmp((list[x])[1], sys.name(src))) {
                            ownnameprinted = true;
                        }
                    }
                }
            }
            catch (err) {
                if (err == "Not a valid tier") {
                    sendBotMessage(src, commandData+" is not a valid tier!",tourschan, false)
                }
                else if (err == "No data") {
                    sendBotMessage(src, "No data exists yet!",tourschan, false)
                }
                else {
                    throw(err)
                }
            }
            return true;
        }
        if (command == "monthlyleaderboard") {
            try {
                var now = new Date()
                var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "decemeber"]
                if (commandData == "") {
                    var monthlyfile = "tourmonthscore_"+themonths[now.getUTCMonth()]+"_"+now.getUTCFullYear()+".txt"
                }
                else {
                    var monthdata = commandData.toLowerCase().split(" ",2)
                    if (monthdata.length == 1) {
                        monthdata.push(now.getUTCFullYear());
                    }
                    var monthlyfile = "tourmonthscore_"+monthdata[0]+"_"+monthdata[1]+".txt"
                }
                if (sys.getFileContent(monthlyfile) === undefined) {
                    throw ("No data")
                }
                var rankings = sys.getFileContent(monthlyfile).split("\n")
                var list = [];
                for (var p in rankings) {
                    if (rankings[p] == "") continue;
                    var rankingdata = rankings[p].split(":::",2)
                    if (rankingdata[1] < 1) continue;
                    list.push([rankingdata[1], rankingdata[0]]);
                }
                list.sort(function(a,b) { return b[0] - a[0] ; });
                sys.sendMessage(src, "*** MONTHLY TOURNAMENT RANKINGS "+(commandData != "" ? "("+commandData+") " : "")+"***",tourschan)
                var ownnameprinted = false;
                var rankkey = [0, 0] // rank, points
                for (var x=0; x<65536; x++) {
                    if (x >= list.length || (ownnameprinted && rankkey[0]>10)) break;
                    if (rankkey[0] <= 10 || cmp((list[x])[1], sys.name(src))) {
                        if (rankkey[1] === parseInt((list[x])[0])) {
                            sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                        }
                        else {
                            sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                            rankkey = [x+1, parseInt((list[x])[0])]
                        }
                        if (cmp((list[x])[1], sys.name(src))) {
                            ownnameprinted = true;
                        }
                    }
                }
            }
            catch (err) {
                if (err == "No data") {
                    sendBotMessage(src, commandData+" is not a valid tier!",tourschan, false)
                }
                else {
                    throw(err)
                }
            }
            return true;
        }
        if (command == "eventleaderboard") {
            try {
                if (sys.getFileContent("eventscores.txt") === undefined) {
                    throw ("No data")
                }
                var rankings = sys.getFileContent("eventscores.txt").split("\n")
                var list = [];
                for (var p in rankings) {
                    if (rankings[p] == "") continue;
                    var rankingdata = rankings[p].split(":::",2)
                    if (rankingdata[1] < 1) continue;
                    list.push([rankingdata[1], rankingdata[0]]);
                }
                list.sort(function(a,b) { return b[0] - a[0] ; });
                sys.sendMessage(src, "*** EVENT RANKINGS "+(commandData != "" ? "("+commandData+") " : "")+"***",tourschan)
                var ownnameprinted = false;
                var rankkey = [0, 0] // rank, points
                for (var x=0; x<65536; x++) {
                    if (x >= list.length || (ownnameprinted && rankkey[0]>10)) break;
                    if (rankkey[0] <= 10 || cmp((list[x])[1], sys.name(src))) {
                        if (rankkey[1] === parseInt((list[x])[0])) {
                            sys.sendMessage(src, "#"+rankkey[0]+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                        }
                        else {
                            sys.sendMessage(src, "#"+(x+1)+": "+(list[x])[1]+" ~ "+(list[x])[0]+" point"+((list[x])[0] != 1 ? "s" : ""),tourschan)
                            rankkey = [x+1, parseInt((list[x])[0])]
                        }
                        if (cmp((list[x])[1], sys.name(src))) {
                            ownnameprinted = true;
                        }
                    }
                }
            }
            catch (err) {
                if (err == "No data") {
                    sendBotMessage(src, "No event tournament data exists!",tourschan, false)
                }
                else {
                    throw(err)
                }
            }
            return true;
        }
        if (command == "eventwinners") {
            try {
                if (sys.getFileContent("eventwinners.txt") === undefined) {
                    throw ("No data")
                }
                var rankings = sys.getFileContent("eventwinners.txt").split("\n")
                sys.sendMessage(src, "*** EVENT WINNERS ***",tourschan)
                for (var x in rankings) {
                    if (rankings[x].length >= 1)
                        sys.sendMessage(src, rankings[x],tourschan)
                }
            }
            catch (err) {
                if (err == "No data") {
                    sendBotMessage(src, "No event tournament data exists!",tourschan, false)
                }
                else {
                    throw(err)
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
            if (activelist.hasOwnProperty(player1)) {
                if (activelist[player1] == "Battle" || (typeof activelist[player1] == "number" && activelist[player1]+tourconfig.activity >= parseInt(sys.time()))) {
                    sendDebugMessage(player1+" is active; continuing", tourschan)
                    dq1 = false
                }
            }
            else if (sys.id(player1) !== undefined && sys.id(player2) === undefined) {
                dq1 = false
                sendDebugMessage(player1+"'s opponent is offline; continuing", tourschan)
            }
            else {
                sendDebugMessage(player1+" is not active; disqualifying", tourschan)
            }
            if (activelist.hasOwnProperty(player2)) {
                if (activelist[player2] == "Battle" || (typeof activelist[player2] == "number" && activelist[player2]+tourconfig.activity >= parseInt(sys.time()))) {
                    sendDebugMessage(player2+" is active; continuing", tourschan)
                    dq2 = false
                }
            }
            else if (sys.id(player2) !== undefined && sys.id(player1) === undefined) {
                dq2 = false
                sendDebugMessage(player2+"'s opponent is offline; continuing", tourschan)
            }
            else {
                sendDebugMessage(player2+" is not active; disqualifying", tourschan)
            }
            if (dq1 && dq2) {
                sendBotAll(toCorrectCase(player1)+" and "+toCorrectCase(player2)+" are both disqualified for inactivity in the "+getFullTourName(key)+" tournament!", tourschan, false)
                dqboth(player1, player2, key)
            }
            else if (dq2) {
                sendBotAll(toCorrectCase(player2)+" was disqualified from the "+getFullTourName(key)+" tournament for inactivity!", tourschan, false)
                disqualify(player2,key,false,false)
            }
            else if (dq1) {
                sendBotAll(toCorrectCase(player1)+" was disqualified from the "+getFullTourName(key)+" tournament for inactivity!", tourschan, false)
                disqualify(player1,key,false,false)
            }
            else if ((tours.tour[key].time-parseInt(sys.time()))%60 === 0){
                sendBotAll(toCorrectCase(player1)+" and "+toCorrectCase(player2)+" are both active, please battle in the "+getFullTourName(key)+" tournament ASAP!", tourschan, false)
                sendBotMessage(sys.id(player1),"You need to play against "+html_escape(toCorrectCase(player2))+" in the "+html_escape(getFullTourName(key))+" tournament ASAP.<ping/>", tourschan, true)
                sendBotMessage(sys.id(player2),"You need to play against "+html_escape(toCorrectCase(player1))+" in the "+html_escape(getFullTourName(key))+" tournament ASAP.<ping/>", tourschan, true)
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
                sendBotMessage(sys.id(player), "Your sub will be disqualified in "+time_handle(tours.tour[key].time-parseInt(sys.time())), tourschan, false)
            }
            else if (sys.id(player) !== undefined) {
                if (sys.isInChannel(sys.id(player), tourschan)) {
                    sendBotMessage(sys.id(player), "<ping/><font color=red><timestamp/> "+html_escape(toCorrectCase(player))+", you must battle <b>"+(z%2 === 0 ? html_escape(toCorrectCase(tours.tour[key].players[z+1])) : html_escape(toCorrectCase(tours.tour[key].players[z-1])))+"</b> in the <b>"+html_escape(getFullTourName(key))+"</b> tournament, otherwise you may be disqualified for inactivity! You should talk to your opponent in #"+sys.channel(tourschan)+" to avoid disqualification.</font>", tourschan, true)
                }
                else {
                    sendBotMessage(sys.id(player), "<ping/><font color=red><timestamp/> "+html_escape(toCorrectCase(player))+", you must battle <b>"+(z%2 === 0 ? html_escape(toCorrectCase(tours.tour[key].players[z+1])) : html_escape(toCorrectCase(tours.tour[key].players[z-1])))+"</b> in the <b>"+html_escape(getFullTourName(key))+"</b> tournament, otherwise you may be disqualified for inactivity! You should talk to your opponent in #"+sys.channel(tourschan)+" to avoid disqualification.</font>", "all", true)
                    sendBotMessage(sys.id(player), "Please rejoin the #"+tourconfig.channel+" channel to ensure you do not miss out on information you need!", "all", false)
                }
            }
        }
    }
    catch (err) {
        sys.sendAll("Error in process 'sendReminder': "+err, tourserrchan)
    }
}

// Disqualifies a single player
function disqualify(player, key, silent, hard) {
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
        // splice from brackets as well in double elim
        if (hard && tours.tour[key].parameters.type == "double") {
            var winindex = tours.tour[key].winbracket.indexOf(player)
            if (winindex != -1) {
                if (winindex%2 == 1) {
                    var opponent1 = tours.tour[key].winbracket[winindex-1]
                }
                else {
                    var opponent1 = tours.tour[key].winbracket[winindex+1]
                }
                /* If the opponent is disqualified/is a sub we want to replace with ~Bye~ instead of ~DQ~ so brackets don't stuff up */
                if (opponent1 == "~DQ~") {
                    tours.tour[key].winbracket.splice(winindex,1,"~Bye~")
                }
                else {
                    tours.tour[key].winbracket.splice(winindex,1,"~DQ~")
                }
            }
            var loseindex = tours.tour[key].losebracket.indexOf(player)
            if (loseindex != -1) {
                if (loseindex%2 == 1) {
                    var opponent2 = tours.tour[key].losebracket[loseindex-1]
                }
                else {
                    var opponent2 = tours.tour[key].losebracket[loseindex+1]
                }
                /* If the opponent is disqualified/is a sub we want to replace with ~Bye~ instead of ~DQ~ so brackets don't stuff up */
                if (opponent2 == "~DQ~") {
                    tours.tour[key].losebracket.splice(loseindex,1,"~Bye~")
                }
                else {
                    tours.tour[key].losebracket.splice(loseindex,1,"~DQ~")
                }
            }
        }
        /* We then check if opponent hasn't advanced, and advance them if they're not disqualified. We also remove player from winners if DQ'ed */
        if (opponent != "~DQ~" && winnerindex == -1 && tours.tour[key].winners.indexOf(opponent) == -1) {
            if (!isSub(opponent) && opponent != "~Bye~") {
                tours.tour[key].winners.push(opponent)
                tours.tour[key].losers.push(player)
                if (!silent) {
                    sendBotAll(toCorrectCase(opponent)+" advances to the next round of the "+getFullTourName(key)+" by default!", tourschan, false)
                }
            }
            else {
                tours.tour[key].winners.push("~Bye~")
                tours.tour[key].losers.push(player)
            }
        }
        else if (winnerindex != -1 && opponent != "~Bye~" && opponent != "~DQ~") { /* This is just so the winners list stays the same length */
            tours.tour[key].winners.splice(winnerindex,1,opponent)
            tours.tour[key].losers.splice(tours.tour[key].losers.indexOf(opponent),1,player)
            if (!silent) {
                sendBotAll(toCorrectCase(opponent)+" advances to the next round of the "+getFullTourName(key)+" because "+toCorrectCase(player)+" was disqualified!", tourschan, false)
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
        tours.tour[key].losers.push(player1, player2)
        tours.tour[key].winners.push("~DQ~")
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
                disqualify(tours.tour[key].players[x],key,true,false)
                if (x%2 === 0) {
                    opponent = tours.tour[key].players[x+1]
                }
                else {
                    opponent = tours.tour[key].players[x-1]
                }
                if (!isSub(opponent) && opponent != "~DQ~" && opponent != "~Bye~" && opponent !== null) {
                    advanced.push(toCorrectCase(opponent))
                }
                if (tours.tour[key].round !== 1) {
                    break;
                }
            }
        }
        tours.tour[key].state = "round"
        if (advanced.length > 0) {
            sendBotAll(advanced.join(", ")+(advanced.length == 1 ? " advances" : " advance")+" to the next round! Subs are now gone.", tourschan, false)
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
                disqualify("~Bye~",key,true,false)
            }
            else if (tours.tour[key].players[z+1] == "~Bye~") {
                opponent = tours.tour[key].players[z]
                disqualify("~Bye~",key,true,false)
            }
            if (!isSub(opponent) && opponent != "~DQ~" && opponent != "~Bye~" && opponent !== null) {
                advanced.push(toCorrectCase(opponent))
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
            sendBotAll(advanced.join(", ")+(advanced.length == 1 ? " advances" : " advance")+" to the next round due to a bye!", tourschan, false)
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
        tours.tour[key].losers.push(losename)
        var battlesleft = parseInt(tours.tour[key].players.length/2)-tours.tour[key].winners.length
        if (tours.tour[key].parameters.type == "double") {
            if (tourwinmessages === undefined || tourwinmessages.length == 0) {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> won their match against <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key)
            }
            else {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> "+tourwinmessages[sys.rand(0, tourwinmessages.length)]+" <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key)
            }
            if (tours.tour[key].losebracket.indexOf(losename) != -1) {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font> <b>"+html_escape(sys.name(loser))+"</b> has lost twice and is now out of the "+getFullTourName(key)+" tournament!", key)
            }
        }
        else {
            if (tourwinmessages === undefined || tourwinmessages.length == 0) {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> won their match against <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament and advances to the next round! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key)
            }
            else {
                sendHtmlAuthPlayers("<font color='"+tourconfig.tourbotcolour+"'><timestamp/> <b>"+tourconfig.tourbot+"</b></font><font color=blue>"+html_escape(sys.name(winner))+"</font> "+tourwinmessages[sys.rand(0, tourwinmessages.length)]+" <font color=red>"+html_escape(sys.name(loser))+ "</font> in the "+getFullTourName(key)+" tournament and advances to the next round! "+battlesleft+" battle"+(battlesleft == 1 ? "" : "s") + " remaining.", key)
            }
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
        var doubleelim = tours.tour[key].parameters.type == "double" ? true : false;
        if (doubleelim) {
            var newwinbracket = [];
            var newlosebracket = [];
            if (tours.tour[key].round == 1) {
                for (var x=0;x<tours.tour[key].players.length;x+=2) {
                    if (winners.indexOf(tours.tour[key].players[x]) > -1 && bannednames.indexOf(tours.tour[key].players[x]) == -1) {
                        newwinbracket.push(tours.tour[key].players[x])
                        newlosebracket.push(tours.tour[key].players[x+1])
                    }
                    else if (winners.indexOf(tours.tour[key].players[x+1]) > -1 && bannednames.indexOf(tours.tour[key].players[x+1]) == -1) {
                        newwinbracket.push(tours.tour[key].players[x+1])
                        newlosebracket.push(tours.tour[key].players[x])
                    }
                    else {
                        newwinbracket.push("~Bye~")
                        newlosebracket.push("~Bye~")
                    }
                }
                newlosebracket.reverse()
            }
            else if (tours.tour[key].players.length == 2 && tours.tour[key].round%2 === 0) { // special case for 2 or less players, first battle
                if (winners.indexOf(tours.tour[key].players[0]) > -1 && bannednames.indexOf(tours.tour[key].players[0]) == -1) {
                    newwinbracket.push(tours.tour[key].players[0])
                    if (tours.tour[key].maxplayers !== "default") {
                        tours.tour[key].rankings.push(tours.tour[key].players[1], tours.tour[key].players[0])
                    }
                }
                else if (winners.indexOf(tours.tour[key].players[1]) > -1 && bannednames.indexOf(tours.tour[key].players[1]) == -1) {
                    if (bannednames.indexOf(tours.tour[key].players[0]) == -1) {
                        newlosebracket.push(tours.tour[key].players[0], tours.tour[key].players[1])
                    }
                    else {
                        newlosebracket.push(tours.tour[key].players[1])
                        if (tours.tour[key].maxplayers !== "default") {
                            tours.tour[key].rankings.push(tours.tour[key].players[0], tours.tour[key].players[1])
                        }
                    }
                }
                else {
                    newlosebracket.push("~Bye~");
                }
            }
            else if (tours.tour[key].players.length == 2 && tours.tour[key].round%2 === 1) { // special case for 2 or less players, second battle
                if (winners.indexOf(tours.tour[key].players[0]) > -1 && bannednames.indexOf(tours.tour[key].players[0]) == -1) {
                    newlosebracket.push(tours.tour[key].players[0])
                    if (tours.tour[key].maxplayers !== "default") {
                        tours.tour[key].rankings.push(tours.tour[key].players[1], tours.tour[key].players[0])
                    }
                }
                else if (winners.indexOf(tours.tour[key].players[1]) > -1 && bannednames.indexOf(tours.tour[key].players[1]) == -1) {
                    newlosebracket.push(tours.tour[key].players[1])
                    if (tours.tour[key].maxplayers !== "default") {
                        tours.tour[key].rankings.push(tours.tour[key].players[0], tours.tour[key].players[1])
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
                        winningwinners.push(tours.tour[key].winbracket[x])
                        losingwinners.push(tours.tour[key].winbracket[x+1])
                    }
                    else if (winners.indexOf(tours.tour[key].winbracket[x+1]) > -1 && bannednames.indexOf(tours.tour[key].winbracket[x+1]) == -1) {
                        winningwinners.push(tours.tour[key].winbracket[x+1])
                        losingwinners.push(tours.tour[key].winbracket[x])
                    }
                    else {
                        winningwinners.push("~Bye~")
                        losingwinners.push("~Bye~")
                    }
                }
                for (var l=0;l<tours.tour[key].losebracket.length;l+=2) {
                    if (winners.indexOf(tours.tour[key].losebracket[l]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l])
                    }
                    else if (winners.indexOf(tours.tour[key].losebracket[l+1]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l+1]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l+1])
                    }
                    else {
                        winninglosers.push("~Bye~")
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
                        winningwinners.push(tours.tour[key].winbracket[x])
                    }
                    else if (winners.indexOf(tours.tour[key].winbracket[x+1]) > -1 && bannednames.indexOf(tours.tour[key].winbracket[x+1]) == -1) {
                        winningwinners.push(tours.tour[key].winbracket[x+1])
                    }
                    else {
                        winningwinners.push("~Bye~")
                    }
                }
                for (var l=0;l<tours.tour[key].losebracket.length;l+=2) {
                    if (winners.indexOf(tours.tour[key].losebracket[l]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l])
                        // 3rd Place
                        if (tours.tour[key].maxplayers !== "default" && tours.tour[key].losebracket.length == 2) {
                            tours.tour[key].rankings.push(tours.tour[key].losebracket[l+1])
                        }
                    }
                    else if (winners.indexOf(tours.tour[key].losebracket[l+1]) > -1 && bannednames.indexOf(tours.tour[key].losebracket[l+1]) == -1) {
                        winninglosers.push(tours.tour[key].losebracket[l+1])
                        // 3rd Place
                        if (tours.tour[key].maxplayers !== "default" && tours.tour[key].losebracket.length == 2) {
                            tours.tour[key].rankings.push(tours.tour[key].losebracket[l])
                        }
                    }
                    else {
                        winninglosers.push("~Bye~")
                    }
                }
                newwinbracket = winningwinners;
                newlosebracket = winninglosers.reverse();
            }
            else {
                sys.sendAll("Error in advancing round of tour '"+getFullTourName(key)+"' id "+key+": Broken roundcheck in double elim...", tourserrchan)
            }
        }
        else {
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
        }
        tours.tour[key].winners = []
        tours.tour[key].losers = []
        tours.tour[key].battlers = []
        tours.tour[key].disallowspecs = []
        tours.tour[key].active = {}
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
            tours.tour[key].winbracket = newwinbracket
            tours.tour[key].losebracket = newlosebracket
            tours.tour[key].players = newwinbracket.concat(newlosebracket)
        }
        else {
            tours.tour[key].players = newlist
        }
        tourprintbracket(key)
    }
    catch (err) {
        sys.sendAll("Error in advancing round of tour '"+getFullTourName(key)+"' id "+key+": "+err, tourserrchan)
    }
}

// starts a tournament
function tourstart(tier, starter, key, parameters) {
    try {
        var channels = tourschan === 0 ? [0] : [0, tourschan];
        tours.tour[key] = {}
        tours.tour[key].state = "signups"
        tours.tour[key].tourtype = tier
        tours.tour[key].players = []; // list for the actual tour data
        tours.tour[key].battlers = [];
        tours.tour[key].disallowspecs = []; // list for users who disallowed spects.
        tours.tour[key].winners = [];
        tours.tour[key].losers = []; // this will make de mode easier
        tours.tour[key].round = 0;
        tours.tour[key].cpt = 0;
        tours.tour[key].seeds = [];
        tours.tour[key].maxcpt = 0;
        tours.tour[key].active = {};
        tours.tour[key].parameters = parameters;
        tours.globaltime = 0;
        if (typeof parameters.maxplayers === "number" && !isNaN(parameters.maxplayers)) {
            tours.tour[key].maxplayers = parameters.maxplayers;
            tours.tour[key].time = parseInt(sys.time())+10*60 // 10 mins
            tours.tour[key].rankings = [];
        }
        else {
            tours.tour[key].maxplayers = "default";
            tours.tour[key].time = parseInt(sys.time())+tourconfig.toursignup
        }
        if (tours.tour[key].parameters.type == "double") {
            tours.tour[key].winbracket = [];
            tours.tour[key].losebracket = [];
        }
        for (var x in channels) {
            sys.sendAll("", channels[x])
            if (tours.tour[key].maxplayers === "default") {
                sys.sendAll(border, channels[x])
            }
            else {
                sys.sendHtmlAll(redhtmlborder, channels[x])
            }
            sys.sendHtmlAll("<timestamp/> A <b><a href='http://wiki.pokemon-online.eu/view/"+tier.replace(/ /g,"_")+"'>"+tier+"</a></b> "+(tours.tour[key].maxplayers === "default" ? "tournament" : "event")+" has opened for signups! (Started by <b>"+html_escape(starter)+"</b>)", channels[x])
            sys.sendAll("CLAUSES: "+getTourClauses(tier),channels[x])
            sys.sendAll("PARAMETERS: "+parameters.mode+" Mode"+(parameters.gen != "default" ? "; Gen: "+getSubgen(parameters.gen,true) : "")+(parameters.type == "double" ? "; Double Elimination" : ""), channels[x])
            if (channels[x] == tourschan) {
                sys.sendHtmlAll("<timestamp/> Type <b>/join</b> to enter the tournament, "+(tours.tour[key].maxplayers === "default" ? "you have "+time_handle(tourconfig.toursignup)+" to join!" : tours.tour[key].maxplayers+" places are open!"), channels[x])
            }
            else {
                sys.sendAll(tourconfig.tourbot+"Go to the #"+sys.channel(tourschan)+" channel and type /join to enter the tournament!", channels[x])
                sys.sendAll("*** "+(tours.tour[key].maxplayers === "default" ? "You have "+time_handle(tourconfig.toursignup)+" to join!" : tours.tour[key].maxplayers+" places are open!")+" ***", channels[x])
            }
            if (tours.tour[key].maxplayers === "default") {
                sys.sendAll(border, channels[x])
            }
            else {
                sys.sendHtmlAll(redhtmlborder, channels[x])
            }
            sys.sendAll("", channels[x])
        }
        tours.keys.push(key)
        if (tours.key >= tourconfig.maxarray) {
            tours.key = 0
        }
        else {
            tours.key += 1
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
            if (tours.globaltime !== -1) {
                tours.globaltime = parseInt(sys.time())+tourconfig.tourbreak; // for next tournament
            }
            sendBotAll("The "+getFullTourName(key)+" tournament was cancelled by the server! You need at least 3 players!"+(tours.globaltime > 0 ? " (A new tournament will start in "+time_handle(tourconfig.tourbreak)+")." : ""), tourschan, false)
            delete tours.tour[key];
            tours.keys.splice(tours.keys.indexOf(key), 1)
            return;
        }
        toursortbracket(size, key)
        tourprintbracket(key)
        var variance = calcVariance()
        if (tours.globaltime !== -1) {
            tours.globaltime = parseInt(sys.time()) + parseInt(tourconfig.abstourbreak/variance) // default 10 mins b/w signups, + 5 secs per user in chan
        }
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
        else if (tours.tour[key].players.length <= 128) {
            bracketsize = 128
        }
        else {
            bracketsize = 256
        }
        var subnumber = 1
        // push the players into people in events
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
        else if (size == 256) {
            push256(0, size);
        }
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
        if (tours.tour[key].players.length == 1) { // winner
            var channels = [0, tourschan]
            var winner = toCorrectCase(tours.tour[key].players[0])
            var now = new Date();
            if (winner !== "~Bye~") {
                for (var x in channels) {
                    sys.sendAll("", channels[x])
                    if (tours.tour[key].maxplayers === "default") {
                        sys.sendAll(border, channels[x])
                    }
                    else {
                        sys.sendHtmlAll(redhtmlborder, channels[x])
                    }
                    sys.sendHtmlAll("<timestamp/> The winner of the "+getFullTourName(key)+" tournament is: <b>"+html_escape(winner)+"</b>!", channels[x])
                    sys.sendAll("", channels[x])
                    sendBotAll("Please congratulate "+winner+" on their success!", channels[x], false)
                    if (tours.tour[key].maxplayers === "default") {
                        sys.sendAll(border, channels[x])
                    }
                    else {
                        sys.sendHtmlAll(redhtmlborder, channels[x])
                    }
                    sys.sendAll("", channels[x])
                }
                // award to winner
                if (tours.tour[key].maxplayers === "default") {
                    awardTourPoints(winner.toLowerCase(), tours.tour[key].cpt, tours.tour[key].tourtype, tours.tour[key].parameters.type == "double" ? true : false, 1, false)
                }
                else {
                    var rankingorder = (tours.tour[key].rankings).reverse()
                    for (var p=0; p<rankingorder.length; p++) {
                        if (rankingorder[p] != "~DQ~" && rankingorder[p] != "~Bye~")
                            awardTourPoints(rankingorder[p], tours.tour[key].cpt, tours.tour[key].tourtype, tours.tour[key].parameters.type == "double" ? true : false, p+1, true)
                    }
                    var neweventarray = tours.eventnames.concat(tours.tour[key].seeds);
                    tours.eventnames = neweventarray;
                    var datestring = now.getUTCDate() + "-" + now.getUTCMonth();
                    sys.writeToFile("eventplayers.txt", datestring + ":" + tours.eventnames.join("*"))
                }
            }
            else sendBotAll("The "+getFullTourName(key)+" ended by default!", tourschan, false)
            if (tours.tour[key].maxplayers === "default") {
                tours.history.unshift(getFullTourName(key)+": Won by "+winner+" with "+tours.tour[key].cpt+" players")
            }
            else {
                var rankstring = [];
                for (var r=0; r<rankingorder.length; r++) {
                    rankstring.push("#" + (r+1) + ": " + toCorrectCase(rankingorder[r]))
                }
                var capsmonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                var dateString = now.getUTCDate()+" "+capsmonths[now.getUTCMonth()]
                tours.history.unshift(getFullTourName(key)+": "+rankstring.join("; ")+"; with "+tours.tour[key].cpt+" players")
                sys.appendToFile("eventwinners.txt", dateString + " ~ " +getFullTourName(key)+": "+rankstring.join("; ")+"; with "+tours.tour[key].cpt+" players\n")
            }

            if (tours.history.length > 25) {
                tours.history.pop()
            }
            delete tours.tour[key];
            tours.keys.splice(tours.keys.indexOf(key), 1);
            if (tours.keys.length === 0 && tours.globaltime > 0) {
                tours.globaltime = parseInt(sys.time())+tourconfig.tourbreak; // for next tournament
            }
            return;
        }
        else if (tours.tour[key].players.length == 2) { // finals
            /* Here in case it's ~Bye~ vs ~Bye~ */
            if (tours.tour[key].players[0] == "~Bye~" && tours.tour[key].players[1] == "~Bye~") {
                sendBotAll("The "+getFullTourName(key)+" ended by default!", tourschan, false)
                delete tours.tour[key];
                tours.keys.splice(tours.keys.indexOf(key), 1);
                if (tours.keys.length === 0 && tours.globaltime > 0) {
                    tours.globaltime = parseInt(sys.time())+tourconfig.tourbreak; // for next tournament
                }
                return;
            }
            tours.tour[key].state = "final"
            var channels = [tourschan]
            var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[0])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[0])+"</td>"
            var player2data = "<td>"+toTourName(tours.tour[key].players[1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[1])+1)+")</td>"
            var roundinfo = "<b>"+(tours.tour[key].parameters.type == "double" && tours.tour[key].round%2 == 1 ? "Sudden Death" : "Final")+" Match of the "+getFullTourName(key)+" Tournament in <a href='po:join/"+html_escape(sys.channel(tourschan))+"'>#"+html_escape(sys.channel(tourschan))+"</a></th></tr></b><br/>"
            var roundposting = "<div style='margin-left: 50px'>"+roundinfo+"<table><tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>"
            for (var c in channels) {
                if (channels[c] === tourschan) {
                    sendFlashingBracket("<br/>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+roundposting+"</table></div>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+"<br/>", key)
                }
                else {
                    sys.sendHtmlAll("<br/>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+roundposting+"</table></div>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+"<br/>", channels[c])
                }
            }
            /* Here in case of the hilarious ~Bye~ vs ~Bye~ siutation */
            tours.tour[key].time = parseInt(sys.time())+tourconfig.tourdq
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
                tours.tour[key].time = parseInt(sys.time())+tourconfig.subtime
            }
            else {
                tours.tour[key].state = "round"
                tours.tour[key].time = parseInt(sys.time())+tourconfig.tourdq
            }
            if (tours.tour[key].round == 1) {
                var submessage = "<div style='margin-left: 50px'><br/>Type <b>/join</b> to join late, good while subs last!</div>"
                var roundposting = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" Tournament</b><br/><table>";
                for (var x=0; x<tours.tour[key].players.length; x+=2) {
                    var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[x])+"</td>"
                    var player2data = "<td>"+toTourName(tours.tour[key].players[x+1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")</td>"
                    roundposting = roundposting+"<tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>"
                }
                sendFlashingBracket("<br/>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+roundposting+"</table></div>"+(subsExist ? submessage : "")+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+"<br/>",key)
            }
            else if (tours.tour[key].parameters.type == "double") {
                var roundposting = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" Tournament</b><br/><table><tr><th colspan=5><font color=blue>Winners Bracket</font></th></tr>"
                for (var x=0; x<tours.tour[key].players.length; x+=2) {
                    if (tours.tour[key].parameters.type == "double" && x == tours.tour[key].players.length/2) {
                        roundposting = roundposting + "<tr><td></td></tr><tr><th colspan=5><font color=red>Losers Bracket</font></th></tr>"
                    }
                    var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[x])+"</td>"
                    var player2data = "<td>"+toTourName(tours.tour[key].players[x+1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")</td>"
                    roundposting = roundposting+"<tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>"
                }
                sendHtmlAuthPlayers("<br/>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+roundposting+"</table></div>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+"<br/>", key)
            }
            else {
                var roundposting = "<div style='margin-left: 50px'><b>Round "+tours.tour[key].round+" of the "+getFullTourName(key)+" Tournament</b><br/><table>";
                for (var x=0; x<tours.tour[key].players.length; x+=2) {
                    var player1data = "<td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x])+1)+")</td><td align='right'>"+toTourName(tours.tour[key].players[x])+"</td>"
                    var player2data = "<td>"+toTourName(tours.tour[key].players[x+1])+"</td><td>("+(tours.tour[key].seeds.indexOf(tours.tour[key].players[x+1])+1)+")</td>"
                    roundposting = roundposting+"<tr>"+player1data+"<td align='center'> VS </td>"+player2data+"</tr>"
                }
                sendHtmlAuthPlayers("<br/>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+roundposting+"</table></div>"+(tours.tour[key].maxplayers === "default" ? htmlborder : redborder)+"<br/>", key)
            }
            removebyes(key)
        }
    }
    catch (err) {
        sys.sendAll("Error in printing the bracket, id "+key+": "+err, tourserrchan)
    }
}

// is the tournament battle valid?
function isValidTourBattle(src,dest,clauses,mode,team,destTier,key,challenge) { // challenge is whether it was issued by challenge
    try {
        var srcindex = tours.tour[key].players.indexOf(sys.name(src).toLowerCase())
        var destindex = tours.tour[key].players.indexOf(sys.name(dest).toLowerCase())
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
        var srcbtt = tours.tour[key].battlers.indexOf(sys.name(src).toLowerCase())
        var destbtt= tours.tour[key].battlers.indexOf(sys.name(dest).toLowerCase())
        var srcwin = tours.tour[key].winners.indexOf(sys.name(src).toLowerCase())
        var destwin = tours.tour[key].winners.indexOf(sys.name(dest).toLowerCase())
        var checklist = clauseCheck(tours.tour[key].tourtype, clauses)
        var invalidmsg = ""
        var isInCorrectGen = true;
        if (tours.tour[key].parameters.gen != "default") {
            var getGenParts = tours.tour[key].parameters.gen.split("-",2)
            if (parseInt(sys.gen(src,team)) !== parseInt(getGenParts[0]) || parseInt(sys.subgen(src,team)) !== parseInt(getGenParts[1])) {
                isInCorrectGen = false;
            }
        }
        if (!srcisintour) {
            return "You are not in the tournament."
        }
        else if (!destisintour) {
            return "That player is not in the tournament."
        }
        else if (tours.tour[key].round < 1) {
            return "The tournament hasn't started yet."
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
            return "This match must be played in Doubles mode. Change it in the bottom right hand corner of the challenge window."
        }
        else if (mode != 2 && tours.tour[key].parameters.mode == "Triples") {
            return "This match must be played in Triples mode. Change it in the bottom right hand corner of the challenge window."
        }
        else if (mode !== 0 && tours.tour[key].parameters.mode == "Singles") {
            return "This match must be played in Singles mode. Change it in the bottom right hand corner of the challenge window."
        }
        else if (!isInCorrectGen && tours.tour[key].parameters.gen != "default") {
            return "This match must be played in "+getSubgen(tours.tour[key].parameters.gen, true)+". Change it in the teambuilder."
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
        else if (sys.tier(src, team) != tours.tour[key].tourtype) {
            if (!sys.hasTier(src, tours.tour[key].tourtype)) {
                return "You need a team in the "+tours.tour[key].tourtype+" tier, then challenge using that team."
            }
            else {
                return "You need to challenge using one of your teams in the "+tours.tour[key].tourtype+" tier. Change it in the drop-down box at the bottom left of the challenge window."
            }
        }
        else if (tours.tour[key].tourtype != destTier) {
            if (!sys.hasTier(dest, tours.tour[key].tourtype)) {
                return "Your opponent does not seem to have a team for the tournament."
            }
            else {
                return "You need to select the "+tours.tour[key].tourtype+" tier in the challenge window. Click the button with the correct tier at the top of the challenge window."
            }
        }
        else return "Valid";
    }
    catch (err) {
        sys.sendAll("Error in battle check, id "+key+": "+err, tourserrchan)
        return "Error in clausecheck, please report and wait for an update.";
    }
}

// awards tournament points
function awardTourPoints(player, size, tier, delim, place, event) {
    // each tournament has a 'tier'
    // points for 4-7,8-15,16-31,32-63,64-127,128-255,256 players respectively. Tours with 3 players or less don't score. Double tours score in the higher up bracket
    var tierscore = {
        'a': [1,2,4,8,16,32,64], // for individual tiers scroes or high scoring tiers
        'b': [1,2,3,5,8,12,18], // default
        'c': [0,1,2,3,5,8,12],
        'd': [0,0,1,2,3,5,8],
        'e': [0,0,0,1,2,3,5],
        'f': [0,0,0,0,1,2,3],
        'z': [0,0,0,0,0,0,0]
    }
    var now = new Date()
    var capsmonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    var dateString = now.getUTCDate()+" "+capsmonths[now.getUTCMonth()]
    if (place == 1) {
        sys.appendToFile("tourdetails.txt", player+":::"+size+":::"+tier+":::"+dateString+"\n")
    }
    if (size < 4 || !tourconfig.points) return;
    var scale = 0;
    var points = 0;
    for (var x=3;x<10;x++) {
        if (size < Math.pow(2,x)) {
            scale = x-3;
            break;
        }
    }
    if (delim && scale != 6) {
        scale += 1
    }
    if (place != 1) {
        scale -= (place - 1)
        if (scale < 0) {
            return;
        }
    }
    var tiers_a = []
    var tiers_b = [] // default
    var tiers_c = ["Monotype"]
    var tiers_d = ["Challenge Cup"]
    var tiers_e = ["Wifi CC 1v1", "Gen 5 1v1", "Gen 5 1v1 Ubers"]
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
    var data = sys.getFileContent("tourscores.txt")
    if (data === undefined) {
        sys.appendToFile("tourscores.txt", "")
        data = ""
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
    // writing global monthly scores
    var themonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "decemeber"]
    var monthlyfile = "tourmonthscore_"+themonths[now.getUTCMonth()]+"_"+now.getUTCFullYear()+".txt"
    var data3 = sys.getFileContent(monthlyfile)
    if (data3 === undefined) {
        sys.appendToFile(monthlyfile, "")
        data3 = ""
    }
    var array3 = data3.split("\n")
    var newarray3 = []
    var onscoreboard3 = false
    for (var j in array3) {
        if (array3[j] === "") continue;
        var scores3 = array3[j].split(":::", 2)
        if (player === scores3[0]) {
            var newscore3 = parseInt(scores3[1]) + points
            newarray3.push(scores3[0]+":::"+newscore3)
            onscoreboard3 = true;
        }
        else {
            newarray3.push(array3[j])
        }
    }
    if (!onscoreboard3) {
        newarray3.push(player+":::"+points)
    }
    sys.writeToFile(monthlyfile, newarray3.join("\n"))
    // writing tier scores
    var data2 = sys.getFileContent("tourscores_"+tier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt")
    if (data2 === undefined) {
        sys.appendToFile("tourscores_"+tier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt", "")
        data2 = ""
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
    sys.writeToFile("tourscores_"+tier.replace(/ /g,"_").replace(/\//g,"-slash-")+".txt", newarray2.join("\n"))
    // write event scores if necessary
    if (!event) return;
    var data4 = sys.getFileContent("eventscores.txt")
    if (data4 === undefined) {
        sys.appendToFile("eventscores.txt", "")
        data4 = ""
    }
    var array4 = data4.split("\n")
    var newarray4 = []
    var onscoreboard4 = false
    for (var a in array4) {
        if (array4[a] === "") continue;
        var scores4 = array4[a].split(":::", 2)
        if (player === scores4[0]) {
            var newscore4 = parseInt(scores4[1]) + points
            newarray4.push(scores4[0]+":::"+newscore4)
            onscoreboard4 = true;
        }
        else {
            newarray4.push(array4[a])
        }
    }
    if (!onscoreboard4) {
        newarray4.push(player+":::"+points)
    }
    sys.writeToFile("eventscores.txt", newarray4.join("\n"))
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
        var hasReqTier = sys.hasTier(playerid, tours.tour[tourid].tourtype)
        var htmlname = isNaN(name) ? html_escape(toCorrectCase(name)) : html_escape(name)
        if (hasReqTier) {
            return htmlname;
        }
        else {
            return "<span title='This player does not have a team for the tournament!'><font color=#FF7700>"+htmlname+"</font></span>";
        }
    }
    else {
        return "<span title='Player is not in the Tournament channel!'><font color=#FF0000>"+html_escape(toCorrectCase(name))+"</font></span>"
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
    if (sys.auth(src) < 1 || !sys.dbRegistered(sys.name(src))) {
        return false;
    }
    if (sys.auth(src) >= 2 || isTourOwner(src)) {
        return true;
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
    if (sys.auth(src) < 1 || !sys.dbRegistered(sys.name(src))) {
        return false;
    }
    if (sys.auth(src) >= 3) {
        return true;
    }
    var towners = ["lamperi", "aerith", "zeroality"];
    if (towners !== undefined && towners.length >= 1) {
        for (var t in towners) {
            if (towners[t].toLowerCase() == sys.name(src).toLowerCase()) {
                return true;
            }
        }
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
        if (tours.tourmutes[ip].expiry <= parseInt(sys.time())) {
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

function isTourBanned(src) {
    // can't ban auth 2+
    if (isTourSuperAdmin(src)){
        return false;
    }
    var ip = sys.ip(src);
    if (tours.tourbans.indexOf(sys.name(src).toLowerCase()) != -1) {
        return true;
    }
    for (var x in tours.tourbans) {
        if (sys.dbIp(tours.tourbans[x]) == ip) {
            return true;
        }
    }
    return false;
}

// writes tourmutes to tourmutes.txt
function saveTourMutes() {
    sys.writeToFile("tourmutes.txt", "")
    for (var x in tours.tourmutes) {
        if (tours.tourmutes[x].expiry <= parseInt(sys.time())) {
            delete tours.tourmutes[x];
            continue;
        }
        sys.appendToFile("tourmutes.txt", x+":::"+tours.tourmutes[x].expiry+":::"+tours.tourmutes[x].reason+":::"+tours.tourmutes[x].auth+":::"+tours.tourmutes[x].name+"\n")
    }
}

function loadTourMutes() {
    var mutefile = sys.getFileContent("tourmutes.txt")
    if (mutefile === undefined) {
        return;
    }
    var mutedata = mutefile.split("\n")
    for (var x in mutedata) {
        var data = mutedata[x].split(":::", 5)
        if (data.length < 5) {
            continue;
        }
        var expiry = parseInt(data[1]);
        if (expiry <= parseInt(sys.time())) {
            continue;
        }
        var ip = data[0];
        var reason = data[2];
        var auth = data[3];
        var player = data[4];
        tours.tourmutes[ip] = {'expiry': expiry, 'reason': reason, 'auth': auth, 'name': player}
    }
}

function loadEventPlayers() {
    var now = new Date();
    var datestring = now.getUTCDate() + "-" + now.getUTCMonth();
    var data = sys.getFileContent("eventplayers.txt")
    if (data === undefined) {
        return;
    }
    var edata = data.split(":",2)
    if (datestring != edata[0] || edata.length == 1) {
        return;
    }
    tours.eventnames = edata[1].split("*")
    return;
}

// to prevent silly mute reasons
function usingBadWords(message) {
    if (/f[uo]ck|\bass\b|assh[o0]le|\barse|\bcum\b|\bdick|\bsex\b|pussy|bitch|porn|\bfck|nigga|\bcock\b|\bgay|\bhoe\b|slut|whore|cunt|clit|pen[i1]s|vag|nigger/i.test(message)) {
        return true;
    }
    else return false;
}

function markActive(src, reason) {
    if (src === undefined) {
        return;
    }
    var name = sys.name(src).toLowerCase()
    var key = isInTour(name)
    if (key !== false) {
        if (tours.tour[key].active.hasOwnProperty(name)) {
            if (tours.tour[key].active[name] === "Battle" && reason == "post") {
                return;
            }
        }
        tours.tour[key].active[name] = parseInt(sys.time());
    }
}

function getListOfTours(num) {
    var list = [];
    for (var x=tours.queue.length-1;x>=0;x--) {
        var tourdata = tours.queue[x].split(":::",5)
        list.push(tourdata[0])
        if (list.length >= num) {
            return list;
        }
    }
    for (var t in tours.tour) {
        var tier = tours.tour[t].tourtype
        list.push(tier)
        if (list.length >= num) {
            return list;
        }
    }
    for (var h=0;h<tours.history.length;h++) {
        var historydata = tours.history[h]
        var pos = historydata.indexOf(":")
        var thetour = historydata.substr(0,pos)
        list.push(thetour)
        if (list.length >= num) {
            return list;
        }
    }
    return list;
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

function calcPercentage() { // calc percentage of players in tournaments playing
    var playersInChan = parseInt((sys.playersOfChannel(tourschan)).length)
    var playersInTours = 0;
    var playerList = sys.playersOfChannel(tourschan)
    for (var x in playerList) {
        var playerName = sys.name(playerList[x]);
        if (isInTour(playerName)) {
            playersInTours += 1;
        }
    }
    if (playersInChan === 0) {
        return 100;
    }
    var variance = playersInTours/playersInChan*100
    if (isNaN(variance)) {
        return 100;
    }
    return variance;
}

function sendWelcomeMessage(src, chan) {
    sys.sendMessage(src,border,chan)
    sys.sendMessage(src,"*** Welcome to #"+tourconfig.channel+"; Version "+tourconfig.version+"! ***",chan)
    var now = new Date()
    var datestring = now.getUTCDate()+"-"+(now.getUTCMonth()+1)+"-"+now.getUTCFullYear();
    var details = getEventTour(datestring)
    if (typeof details === "object") {
        sys.sendMessage(src,"Today's Event Tournament: "+details[0]+" for "+details[1]+" players.",chan)
    }
    sys.sendMessage(src,"",chan)
    sys.sendMessage(src,"*** Current Tournaments ***",chan)
    for (var x in tours.tour) {
        if (tours.tour[x].state == "signups") {
            if (tours.tour[x].maxplayers === "default") {
                sys.sendMessage(src, getFullTourName(x)+": Currently in signups, "+time_handle(tours.tour[x].time-parseInt(sys.time()))+" remaining. Type /join to join.", chan)
            }
            else {
                sys.sendMessage(src, getFullTourName(x)+": Currently in signups, "+(tours.tour[x].maxplayers - tours.tour[x].cpt)+" place"+(tours.tour[x].maxplayers - tours.tour[x].cpt == 1 ? "" : "s")+" remaining. Type /join to join.", chan)
            }
        }
        else if (tours.tour[x].state == "subround" && tours.tour[x].players.length - tours.tour[x].cpt !== 0) {
            sys.sendMessage(src, getFullTourName(x)+": Substitute spots are open, type /join to join late.", chan)
        }
        else if (tours.tour[x].state == "final") {
            sys.sendMessage(src, getFullTourName(x)+": Final Round", chan)
        }
        else {
            sys.sendMessage(src, getFullTourName(x)+": Round "+tours.tour[x].round, chan)
        }
    }
    sys.sendMessage(src,"",chan)
    var nextstart = time_handle(tours.globaltime - parseInt(sys.time()))
    for (var x in tours.tour) {
        if (tours.tour[x].state == "signups") {
            nextstart = "Pending";
            break;
        }
    }
    if ((tourconfig.maxrunning <= tours.keys.length && calcPercentage() >= tourconfig.minpercent) || tours.globaltime <= 0) {
        nextstart = "Pending";
    }
    var nextmessage = "???"
    if (tours.queue.length >= 1) {
        var queuedata = tours.queue[0].split(":::",5)
        if (nextstart != "Pending") {
            nextmessage = queuedata[0]+"; Starts in "+nextstart;
        }
        else {
            nextmessage = queuedata[0]+"; Start time TBA";
        }
    }
    sys.sendMessage(src,"Next Tournament: "+nextmessage,chan)
    if (!sys.dbRegistered(sys.name(src))) {
        sendBotMessage(src, "You need to register before playing in #"+sys.channel(chan)+"! Click on the 'Register' button below and follow the instructions!", chan, false);
    }
    sys.sendMessage(src,"*** Use /help to view the commands; and use /rules to view the tournament rules! ***",chan)
    sys.sendMessage(src,border,chan)
}

function dumpVars(src) {
    var activelist = [];
    sys.sendMessage(src, border, tourschan)
    sys.sendMessage(src, "*** Variable Dump ***", tourschan)
    sys.sendMessage(src, "*** Main ***", tourschan)
    sys.sendMessage(src, "GlobalTime: "+tours.globaltime, tourschan)
    sys.sendMessage(src, "CurrentTime: "+sys.time(), tourschan)
    sys.sendMessage(src, "% players in Tours: "+Math.floor(calcPercentage())+"%", tourschan)
    for (var x in tours.tour) {
        activelist = [];
        sys.sendMessage(src, "*** Round "+tours.tour[x].round+"; "+getFullTourName(x)+" Tour (key "+x+")***", tourschan)
        sys.sendMessage(src, "Time: "+tours.tour[x].time, tourschan)
        sys.sendMessage(src, "Players: "+tours.tour[x].players, tourschan)
        sys.sendMessage(src, "Battlers: "+tours.tour[x].battlers, tourschan)
        sys.sendMessage(src, "Winners: "+tours.tour[x].winners, tourschan)
        sys.sendMessage(src, "Losers: "+tours.tour[x].losers, tourschan)
        sys.sendMessage(src, "Total Players: "+tours.tour[x].cpt, tourschan)
        for (var y in tours.tour[x].active) {
            if (tours.tour[x].active[y] === "Battle") {
                activelist.push(y + "(Battle)")
            }
            else if (typeof tours.tour[x].active[y] == "number") {
                if (tours.tour[x].active[y]+tourconfig.activity >= parseInt(sys.time())) {
                    activelist.push(y + "(Post)")
                }
            }
        }
        sys.sendMessage(src, "Active: "+activelist.join("; "), tourschan)
        sys.sendMessage(src, "Seeds: "+tours.tour[x].seeds, tourschan)
    }
    sys.sendMessage(src, border, tourschan)
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
        if (channel === tourschan && !isTourBanned(source)) {
            return tourCommand(source, command, commandData)
        }
        return false;
    },
    init: function() {
        try {
            initTours();
        }
        catch (err) {
            sys.sendAll("Error in event 'init': "+err, tourserrchan)
        }
    },
    afterChannelJoin : function(player, chan) {
        if (chan === tourschan) {
            sendWelcomeMessage(player, chan)
        }
    },
    afterBattleEnded : function(source, dest, desc) {
        try {
            tourBattleEnd(source, dest, desc)
        }
        catch (err) {
            sys.sendAll("Error in event 'tourBattleEnd': "+err, tourserrchan)
        }
    },
    stepEvent : function() {
        tourStep()
    },
    beforeChannelJoin : function (src, channel) {
        if (channel == tourschan) {
            if (isTourBanned(src)) {
                sendBotMessage(src,"You are tourbanned! You can't join unless the tour owners decide to unban you!", "all", false)
                sys.stopEvent();
            }
        }
    },
    beforeChallengeIssued : function(source, dest, clauses, rated, mode, team, destTier) {
        var ret = false;
        ret |= tourChallengeIssued(source, dest, clauses, rated, mode, team, destTier)
        return ret;
    },
    afterBattleStarted : function(source, dest, clauses, rated, mode, bid) {
        return tourBattleStart(source, dest, clauses, rated, mode, bid)
    },
    beforeBattleMatchup : function(source, dest, clauses, rated) {
        var ret = false;
        ret |= (isInTour(sys.name(source)) !== false || isInTour(sys.name(dest)) !== false);
        return ret;
    },
    beforeChatMessage : function(src, message, channel) {
        if (isTourMuted(src) && !isTourAdmin(src) && channel === tourschan) {
            sendBotMessage(src,"You are tourmuted by "+tours.tourmutes[sys.ip(src)].auth+". This expires in "+time_handle(tours.tourmutes[sys.ip(src)].expiry-parseInt(sys.time()))+". [Reason: "+tours.tourmutes[sys.ip(src)].reason+"]",tourschan,false)
            return true;
        }
        else return false;
    },
    afterChatMessage : function(src, message, channel) {
        if (channel === tourschan && !usingBadWords(message)) {
            markActive(src, "post");
        }
    },
    allowToSpectate : function(src, p1, p2) {
        var srctour = isInTour(sys.name(src))
        var p1tour = isInTour(sys.name(p1))
        var p2tour = isInTour(sys.name(p2))
        if (p1tour === false || p2tour === false) {
            return false;
        }
        if (isTourAdmin(src)) {
            if (p1tour !== p2tour) {
                return false;
            }
            if (srctour === p1tour) {
                return false;
            }
            return true;
        }
        /* check for potential scouters */
        var cctiers = ["Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Metronome"]
        var isOkToSpectate = (tours.tour[p1tour].state == "final" || cctiers.indexOf(tours.tour[p1tour].tourtype) != -1)
        var usingDisallowSpecs = false;
        for (var x in tours.tour[p1tour].disallowspecs) {
            if (cmp(tours.tour[p1tour].disallowspecs[x], sys.name(p1))) {
                usingDisallowSpecs = true;
                break;
            }
        }
        if (srctour === p1tour && !isOkToSpectate && !usingDisallowSpecs) {
            sendBotAll(sys.name(src)+" started watching the "+tours.tour[p1tour].tourtype+" tour battle between "+sys.name(p1)+" and "+sys.name(p2)+", so could be potentially scouting.", sys.channelId("Victory Road"), false)
        }
        return false;
    }
}
