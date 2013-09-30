/* mafiastats.js 
    TODO:
    Add starting stats
    Allow for past stats to be saved (currently the data deletes itself every month)
    Add more templates for easier html editing (some done)
    Add table with wins/players for specific themes
*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global updateModule, sys, SESSION, module, require*/
var mafiaDataDir = "scriptData/mafiastats/";
var saveDir = "usage_stats/formatted/mafiathemes/";

/*  Essentially a more lazy way to implement something CSS-like. I could use actual CSS, but I prefer this all being in one file and is easier for others to edit
    Basically {0},{1},etc is what's going to be replaced.
    For page {0} is the title (the thing that will appear at the browser top and tab) {1} is the entire content itself
    For title {0} is the header (Games Played for example)
    For date {0} is the date at the bottom.
    Adding to these strings will change their look the next time the html page is generated (by default, at the top of the hour UTC)
*/
var html = {
    page: "<!doctype html><html lang='en'><head><meta charset='utf-8'><style type='text/css'>td{text-align:center;width:50px;height:30px;}td:nth-of-type(even){background-color:#eee;}th{background:#85AAF5}</style><title>{0}</title></head>{1}</body></html>",
    title: "<b><font size=4>*** {0} ***</font></b>",
    date: "<i><font size=2>Last Updated: {0} </font></i>"
};

function mafiaStats() {
    this.init = function () {
        sys.makeDir(mafiaDataDir);
        sys.makeDir(saveDir);
        var date = new Date();
        var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()];
        this.fileName = month + "_mafiaStats.json";
        if (!sys.fexists(mafiaDataDir + this.fileName)) {
            sys.writeToFile(mafiaDataDir + this.fileName, "{}");
        }
        this.data = JSON.parse(sys.getFileContent(mafiaDataDir + this.fileName));
    };
    this.stepEvent = function () {
        var date = new Date();
        if (date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
            this.compileData();
        }
    };
    this.saveFile = function () {
        var date = new Date();
        sys.writeToFile(mafiaDataDir + this.fileName, JSON.stringify(this.data));
        var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()];
        if (month !== this.fileName.split("_")[0]) {
            if (!sys.fexists(mafiaDataDir + this.filename)) {
                sys.writeToFile(mafiaDataDir + this.fileName, "{}");
            }
        }
        this.data = JSON.parse(sys.getFileContent(mafiaDataDir + this.fileName));
    };
    this.clear = function () {
        this.players = 0;
        this.theme = null;
    };
    this.result = function (result) {
        if (result === "dead") {
            this.clear();
            return;
        }
        this.saveData(result);
    };
    this.saveData = function (result) {
        var data = this.data,
            theme = this.theme,
            players = this.players;
        if (!data[theme]) {
            data[theme] = {};
        }
        if (!data[theme][result]) {
            data[theme][result] = {};
        }
        if (data[theme][result][players]) {
            data[theme][result][players] += 1;
        }
        else {
            data[theme][result][players] = 1;
        }
        if (data[theme].gamesPlayed) {
            data[theme].gamesPlayed += 1;
        }
        else {
            data[theme].gamesPlayed = 1;
        }
        this.saveHourData();
        this.saveFile();
        this.clear();
    };
    this.saveHourData = function () {
        var data = this.data,
            players = this.players;
        if (!data.hoursData) {
            data.hoursData = {};
        }
        for (var x = 0; x < 24; x++) {
            if (!data.hoursData[x]) {
                data.hoursData[x] = {};
                data.hoursData[x].players = 0;
                data.hoursData[x].gamesPlayed = 0;
            }
        }
        var date = new Date();
        data.hoursData[date.getUTCHours()].players += players;
        data.hoursData[date.getUTCHours()].gamesPlayed += 1;
    };
    this.compileData = function () {
        var data = this.getData();
        var gamesPlayed = data[0];
        var total = parseInt(data[1], 10);
        var count = 0;
        var output = [html.title.format("Games Played")];
        output.push("<i>Total Games Played: " + total + "</i>");
        output.push("");
        for (var x = 0; x < gamesPlayed.length; x++) {
            output.push(++count + ": <b><a href = '" + gamesPlayed[x][0].replace(/\ /g, "_") + "_stats.html'> " + gamesPlayed[x][0] + "</a></b>. Played " + gamesPlayed[x][1] + " times. Average players: " + gamesPlayed[x][2]);
            this.compileWinData(gamesPlayed[x][0]);
        }
        output.push("");
        var hourData = this.compileHourData();
        for (var x = 0; x < hourData.length; x++) {
            output.push(hourData[x]);
        }
        output.push("");
        var date = new Date();
        var current = date.getUTCFullYear() + "-" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getUTCDate()).slice(-2) + " " + ("0" + date.getUTCHours()).slice(-2) + ":" + ("0" + date.getUTCMinutes()).slice(-2) + ":" + ("0" + date.getUTCSeconds()).slice(-2) + " (UTC)";
        output.push(html.date.format(current));
        sys.writeToFile(saveDir + "index.html", html.page.format("Mafia Stats", output.join("<br>")));
    };
    this.getData = function () {
        var data = this.data;
        var gamesPlayed = [];
        var keys = Object.keys(data);
        var total = 0;
        for (var x = 0; x < keys.length; x++) {
            if (keys[x] !== "hoursData") { //should have really planned ahead...
                var average = this.getAverage(keys[x]);
                total += data[keys[x]].gamesPlayed;
                gamesPlayed.push([keys[x], data[keys[x]].gamesPlayed, average]);
            }
        }
        gamesPlayed.sort(function (a, b) {
            return b[1] - a[1];
        });
        return [gamesPlayed, total];
    };
    this.getAverage = function (theme) {
        var tData = this.data[theme];
        var keys = Object.keys(tData);
        var totalPlayers = 0;
        for (var x = 0; x < keys.length; x++) {
            if (keys[x] !== "gamesPlayed") {
                var total = 0;
                var tKeys = Object.keys(tData[keys[x]]);
                for (var y = 0; y < tKeys.length; y++) {
                    total += tKeys[y] * tData[keys[x]][tKeys[y]];
                }
                totalPlayers += total;
            }
        }
        return Math.round(totalPlayers / tData.gamesPlayed * 100) / 100;
    };
    this.compileWinData = function (theme, returnval) {
        var tData = this.data[theme];
        if (tData === undefined && returnval) {
            return null;
        }
        var keys = Object.keys(tData);
        var totalTeam = [];
        var gameTotal = 0;
        for (var x = 0; x < keys.length; x++) {
            if (keys[x] !== "gamesPlayed") {
                var total = 0;
                var totalPlayers = 0;
                var tKeys = Object.keys(tData[keys[x]]);
                for (var y = 0; y < tKeys.length; y++) {
                    totalPlayers += tKeys[y] * tData[keys[x]][tKeys[y]];
                    total += tData[keys[x]][tKeys[y]];
                }
                gameTotal += total;
                var average = Math.round(totalPlayers / total * 100) / 100;
                totalTeam.push([keys[x], total, average]);
            }
        }
        totalTeam.sort(function (a, b) {
            return b[1] - a[1];
        });
        if (returnval) {
            return [totalTeam, gameTotal];
        }
        var count = 0;
        var output = [html.title.format("Times Won")];
        output.push("<i>Theme Played: " + gameTotal + " times</i>");
        output.push("");
        for (var x = 0; x < totalTeam.length; x++) {
            output.push(++count + ": <b>" + totalTeam[x][0] + "</b>. Times Won: " + totalTeam[x][1] + ". Average Players per win: " + totalTeam[x][2]);
        }
        output.push("");
        var table = this.createTable(theme);
        if (table) {
            output.push(table);
        }
        sys.writeToFile(saveDir + theme.replace(/\ /g, "_") + "_stats.html", html.page.format(theme, output.join("<br>")));
    };
    this.compileHourData = function () {
        var hData = this.data.hoursData;
        var output = [html.title.format("Games Played Per Hour (UTC)")];
        output.push("");
        for (var x = 0; x < 24; x++) {
            var average = Math.round(hData[x].players / hData[x].gamesPlayed * 100) / 100;
            output.push("Games Played between " + x + ":00 and " + x + ":59, " + hData[x].gamesPlayed + ". Average Players: " + (average ? average : "0"));
        }
        return output;
    };
    this.update = function () {
        var POglobal = SESSION.global();
        var index, source;
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if ("mafiastats.js" == POglobal.plugins[i].source) {
                source = POglobal.plugins[i].source;
                index = i;
            }
        }
        if (index !== undefined) {
            updateModule(source, function (module) {
                POglobal.plugins[index] = module;
                module.source = source;
                module.init();
            });
        }
    };
    this.getTopThemes = function (src, channel, amount) {
        amount = parseInt(amount, 10);
        if (amount === undefined || isNaN(amount) || amount <= 0) {
            amount = 10;
        }
        var data = this.getData();
        var gamesPlayed = data[0];
        var total = parseInt(data[1], 10);
        gamesPlayed = gamesPlayed.slice(0, amount);
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** TOP " + amount + " THEMES ***", channel);
        sys.sendMessage(src, "Games Played: " + total, channel);
        sys.sendMessage(src, "", channel);
        var count = 0;
        for (var x = 0; x < gamesPlayed.length; x++) {
            sys.sendMessage(src, ++count + ": " + gamesPlayed[x][0] + ". Played " + gamesPlayed[x][1] + " times. Average Players: " + gamesPlayed[x][2], channel);
        }
    };
    this.getWinData = function (src, channel, theme) {
        var data = this.compileWinData(theme, true);
        if (data === null) {
            sys.sendMessage(src, "This theme has no data", channel);
            return;
        }
        var totalTeam = data[0];
        var gamesPlayed = data[1];
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "*** " + theme.toUpperCase() + " WIN DATA ***", channel);
        sys.sendMessage(src, "Theme Played: " + gamesPlayed + " times", channel);
        sys.sendMessage(src, "", channel);
        var count = 0;
        for (var x = 0; x < totalTeam.length; x++) {
            sys.sendMessage(src, ++count + ": " + totalTeam[x][0] + ". Times Won: " + totalTeam[x][1] + ". Average Players per win: " + totalTeam[x][2], channel);
        }
        sys.sendMessage(src, "", channel);
        sys.sendMessage(src, "±Stats: For more details, check http://server.pokemon-online.eu/mafiathemes/" + theme + "_stats.html", channel);
    };
    this.createTable = function (theme) {
        var themeData = require("mafia.js").themeManager.themes[theme.toLowerCase()];
        if (!themeData) {
            return null; //not a theme on server
        }
        var start = themeData.minplayers === undefined ? 5 : themeData.minplayers;
        var output = ["<table>"];
        output.push("<tr><th>Sides/Players</th>");
        var end = themeData["roles" + themeData.roleLists].length;
        for (var x = +start; x < +end + 1; x++) {
            output.push("<th><b>" + x + "</b></th>");
        }
        output.push("</tr>");
        var keys = Object.keys(this.data[theme]);
        var overall = {};
        for (var x = 0; x < keys.length; x++) {
            if (keys[x] !== "gamesPlayed") {
                output.push("<tr><th><b>" + keys[x] + "</b></th>");
                for (var y = +start; y < +end + 1; y++) {
                    if (!(y in overall)) {
                        overall[y] = 0;
                    }
                    if (this.data[theme][keys[x]][y] !== undefined) {
                        output.push("<td>" + this.data[theme][keys[x]][y] + "</td>");
                        overall[y] += this.data[theme][keys[x]][y];
                    }
                    else {
                        output.push("<td>" + 0 + "</td>");
                    }
                }
                output.push("</tr>");
            }
        }
        output.push("<tr><th>Games Played</th>");
        for (x = +start; x < +end + 1; x++) {
            output.push("<td><b>" + overall[x] + "</b></td>");
        }
        output.push("</table>");
        
        output.push("<br><table>");
        output.push("<tr><th>Sides/Players</th>");
        for (var x = +start; x < +end + 1; x++) {
            output.push("<th><b>" + x + "</b></th>");
        }
        for (var x = 0; x < keys.length; x++) {
            if (keys[x] !== "gamesPlayed") {
                output.push("<tr><th><b>" + keys[x] + "</b></th>");
                for (var y = +start; y < +end + 1; y++) {
                    if (this.data[theme][keys[x]][y] !== undefined) {
                        output.push("<td>" + Math.round(this.data[theme][keys[x]][y] / overall[y] * 100) + "%</td>");
                    }
                    else {
                        output.push("<td>" + 0 + "</td>");
                    }
                }
                output.push("</tr>");
            }
        }
        output.push("</table>");
        
        return output.join("");
    };
}
module.exports = new mafiaStats();
