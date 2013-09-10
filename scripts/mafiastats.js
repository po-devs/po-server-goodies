/* mafiastats.js 
    TODO:
    Add starting stats
    Add ability to see stats on server
    Allow for past stats to be saved (currently the data deletes itself every month)
    Add more templates for easier html editing
*/
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global cmp, mafiabot, getTimeString, mafiaAdmins, updateModule, script, sys, saveKey, SESSION, sendChanAll, require, Config, module, detained, mafiaSuperAdmins, sachannel*/
var mafiaDataDir = "scriptData/mafiastats/";
var saveDir = "usage_stats/formatted/mafiathemes/";
var template = "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{0}</title></head>{1}</body></html>";

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
            this.saveFile();
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
        var count = 0;
        var output = ["<b><font size=4>*** Games Played ***</b></font>"];
        output.push("");
        output.push("<i>Total Games Played: " + total + "</i>");
        output.push("");
        for (var x = 0; x < gamesPlayed.length; x++) {
            output.push(++count + ": <b><a href = '" + gamesPlayed[x][0].replace(/\ /g, "_") + "_stats.html'> " + gamesPlayed[x][0] + "</a></b>. Played " + gamesPlayed[x][1] + " times. Average players : " + gamesPlayed[x][2]);
            this.compileWinData(gamesPlayed[x][0]);
        }
        output.push("");
        var hourData = this.compileHourData();
        for (var x = 0; x < hourData.length; x++) {
            output.push(hourData[x]);
        }
        output.push("");
        var date = new Date();
        var current = date.getUTCFullYear() + "-" + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getUTCDate()).slice(-2) + " " + ("0" + date.getUTCHours()).slice(-2) + ":" + ("0" + date.getUTCMinutes()).slice(-2) + ":" + ("0" + date.getUTCSeconds()).slice(-2)+ " (UTC)";
        output.push("<i><font size=2>Last Updated: " + current + "</font></i>");
        sys.writeToFile(saveDir + "index.html", template.format("Mafia Stats", output.join("<br>")));
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
    this.compileWinData = function (theme) {
        var tData = this.data[theme];
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
        var count = 0;
        var output = ["<b><font size=4>*** Times Won ***</font></b>"];
        output.push("");
        output.push("<i>Theme Played: " + gameTotal + " times</i>");
        output.push("");
        for (var x = 0; x < totalTeam.length; x++) {
            output.push(++count + ": <b>" + totalTeam[x][0] + "</b>. Times Won: " + totalTeam[x][1] + ". Average Players per win " + totalTeam[x][2]);
        }
        sys.writeToFile(saveDir + theme.replace(/\ /g, "_") + "_stats.html", template.format(theme, output.join("<br>")));
    };
    this.compileHourData = function () {
        var hData = this.data.hoursData;
        var output = ["<b><font size=4>*** Games Played Per Hour (UTC) ***</font></b>"];
        for (var x = 0; x < 24; x++) {
            var average = Math.round(hData[x].players / hData[x].gamesPlayed * 100) / 100;
            output.push("Games Played between " + x + ":00 and " + x + ":59, " + hData[x].gamesPlayed + ". Average Players : " + (average ? average : "0"));
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
}
module.exports = new mafiaStats();