/*
Battle Factory Program Script for Pokemon Online

Original coding by Shadowfist 2012
Maintenance by PO Scripters 2013

Requires bfteams.json to work.

Files: bfteams.json
Folders created: submissions, (messagebox may be used in the future, but not now)
*/

// Coding style: semicolon are not required here but great caution is required
/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sendChanAll, bfbot, staffchannel, tier_checker, sendChanHtmlAll, sys, Config, SESSION, require, module*/

// Globals
var bfVersion = "1.100";
var dataDir = "scriptdata/bfdata/";
var submitDir = dataDir+"submit/";
//var messDir = dataDir+"messages/";
var bfSets, working, defaultSets, userQueue, /*messagebox,*/ reviewChannel, submitBans, bfHash, reviewers;
var utilities = require('utilities.js');
var saveInterval = 86400; // autosave every day
var battleFactoryTiers = ["Battle Factory", "Battle Factory 6v6"];

// Will escape "&", ">", and "<" symbols for HTML output.
var html_escape = utilities.html_escape;
var find_tier = utilities.find_tier;

startBF();

function initFactory() {
    reviewChannel = utilities.get_or_create_channel("BF Review");
    sendChanAll("Version " + bfVersion + " of the Battle Factory loaded successfully!", reviewChannel);
    working = true;
}

function startBF() {
    sys.makeDir(dataDir);
    sys.makeDir(submitDir);
    try {
        var file = sys.getFileContent(dataDir + "bfteams.json");
        if (typeof file === "undefined") {
            var url = Config.base_url + "bfdata/bfteams.json";
            bfbot.sendAll("Teams file not found, fetching teams from " + url, reviewChannel);
            sys.webCall(url, function(responseText) {
                if (responseText !== "") {
                    try {
                        var parsedSets = JSON.parse(responseText);
                        var lintResults = setlint(parsedSets, false);
                        if (lintResults.errors.length > 0) {
                            throw "Bad File";
                        }
                        sys.writeToFile(dataDir + "bfteams.json", responseText);
                        defaultSets = parsedSets;
                        sendChanAll("Updated Battle Factory Teams!", reviewChannel);
                    } catch (err) {
                        sendChanAll("FATAL ERROR: " + err, reviewChannel);
                        throw "Battle Factory web file is corrupt!";
                    }
                } else {
                    sendChanAll("Failed to load teams!", reviewChannel);
                    throw "Couldn't load the Battle Factory file!";
                }
            });
        } else {
            defaultSets = JSON.parse(file);
        }
    } catch (e) {
        throw e;
    }
    try {
        userQueue = JSON.parse(sys.getFileContent(submitDir + "index.json"));
    } catch (e) {
        sendChanAll("No Battle Factory queue detected!", reviewChannel);
        userQueue = {};
    }
    try {
        submitBans = JSON.parse(sys.getFileContent(submitDir + "bans.json"));
    } catch (e) {
        submitBans = {};
    }
    try {
        reviewers = JSON.parse(sys.getFileContent(submitDir + "reviewers.json"));
    } catch (e) {
        reviewers = {};
        sys.writeToFile(submitDir + "reviewers.json", JSON.stringify(reviewers));
    }
    try {
        bfHash = JSON.parse(sys.getFileContent(dataDir + "bfhash.json"));
    } catch (e) {
        sendChanAll("Making default bfHash", reviewChannel);
        // name, filepath, whether it is being actively used (human choice), whether it is enabled (automated)
        bfHash = {
            "preset": {
                "path": 'bfteams.json',
                "active": true,
                "enabled": false,
                "url": Config.base_url + "bfdata/bfteams.json"
            }
        };
        sys.writeToFile(dataDir + "bfhash.json", JSON.stringify(bfHash));
    }
    var validsetpacks = 0;
    bfSets = {};
    for (var x in bfHash) {
        var teamPack = sys.getFileContent(dataDir + bfHash[x].path);
        if (typeof teamPack === "undefined") {
            createDefaultEntry(bfHash[x].path, x);
            bfSets[x] = {};
        } else {
            try {
                var teamFile = JSON.parse(teamPack);
                var lintResults = setlint(teamFile, false);
                if (lintResults.errors.length > 0) {
                    throw "Bad File";
                }
                bfSets[x] = teamFile;
                if (numPokes(teamFile) < 12) {
                    throw "Not enough Pokemon";
                }
                bfHash[x].enabled = true;
                validsetpacks += 1;
            } catch (e) {
                sendChanAll("Set pack " + x + " is invalid: " + e, reviewChannel);
                bfHash[x].enabled = false;
            }
        }
    }
    if (validsetpacks === 0) {
        sendChanAll("No valid Battle Factory sets detected!", reviewChannel);
        throw "No valid set packs available";
    }
}

function isInBFTier(src, teamLo, teamHi) {
    return battleFactoryTiers.indexOf(sys.tier(src, teamLo, teamHi)) > -1;
}

function isBFTier(tier) {
    return battleFactoryTiers.indexOf(tier) > -1;
}

function createDefaultEntry(path, desc) {
    var pathname = dataDir + path;
    if (typeof sys.getFileContent(pathname) === "undefined") {
        sys.writeToFile(pathname, JSON.stringify({'desc': desc}));
        return true;
    }
    return false;
}

function createEntry(name, data, srcUrl) {
    var basepathname = "bfteams_" + (name.replace(/ /g, "")).toLowerCase() + ".json";
    if (!data.hasOwnProperty("desc")) {
        data.desc = name;
    }
    if (typeof sys.getFileContent(dataDir + basepathname) === "undefined") {
        sys.writeToFile(dataDir + basepathname, JSON.stringify(data));
        bfHash[name] = {
            "path": basepathname,
            "active": true,
            "enabled": true,
            "url": srcUrl
        };
        bfSets[name] = data;
        return true;
    }
    return false;
}

// Save user generated info periodically as a backup
function autoSave(type, params) {
    if (type === "all") {
        cleanEntries();
        sys.writeToFile(submitDir + "index.json", JSON.stringify(userQueue));
        sys.writeToFile(dataDir + "bfhash.json", JSON.stringify(bfHash));
        for (var x in bfHash) {
            if (bfSets.hasOwnProperty(x)) {
                sys.writeToFile(dataDir + bfHash[x].path, JSON.stringify(bfSets[x]));
            }
        }
    } else if (type === "queue") {
        cleanEntries();
        sys.writeToFile(submitDir + "index.json", JSON.stringify(userQueue));
    } else if (type === "teams") {
        sys.writeToFile(dataDir + "bfhash.json", JSON.stringify(bfHash));
        for (var b in bfHash) {
            if (bfSets.hasOwnProperty(b) && (params === "all" || params === b)) {
                sys.writeToFile(dataDir + bfHash[b].path, JSON.stringify(bfSets[b]));
            }
        }
    }
}

function dumpData(tar, teamLo, teamHi) {
    var sets = [];
    for (var b = 0; b < 6; b++) {
        sets.push(getStats(tar, teamLo, teamHi, b).join("<br/>"));
    }
    var channels = sys.channelsOfPlayer(tar);
    if (sets.length > 0 && channels.length > 0) {
        var sendChannel = sys.isInChannel(tar, 0) ? 0 : channels[0];
        sys.sendHtmlMessage(tar, "<table border='2'><tr><td><pre>" + sets.join("<br/><br/>") + "</pre></td></tr></table>", sendChannel);
    }
}

// Whether the data is readable or not
function isReadable(key) {
    if (!bfSets.hasOwnProperty(key)) {
        return false;
    }
    var file = bfSets[key];
    return file.hasOwnProperty("readable") && file.readable;
}

// An in-place shuffle of the array
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
// Mutates and returns array
// Originally there was a very biased/non-random sort here using Array.sort
function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * i);
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// converts an alphanumeric set code to an object with the Pokemon's data
function pokeCodeToPokemon(pokeCode) {
    return {
        "poke": sys.pokemon(toNumber(pokeCode.substr(0, 2)) + 65536 * toNumber(pokeCode.substr(2, 1))),
        "pokeId": toNumber(pokeCode.substr(0, 2)) + 65536 * toNumber(pokeCode.substr(2, 1)),
        "species": sys.pokemon(toNumber(pokeCode.substr(0, 2))),
        "nature": sys.nature(toNumber(pokeCode.substr(3, 1))),
        "natureId": toNumber(pokeCode.substr(3, 1)),
        "ability": sys.ability(toNumber(pokeCode.substr(4, 2))),
        "abilityId": toNumber(pokeCode.substr(4, 2)),
        "item": sys.item(toNumber(pokeCode.substr(6, 3))),
        "itemId": toNumber(pokeCode.substr(6, 3)),
        "level": toNumber(pokeCode.substr(9, 2)),
        "moves": [
            sys.move(toNumber(pokeCode.substr(11, 2))),
            sys.move(toNumber(pokeCode.substr(13, 2))),
            sys.move(toNumber(pokeCode.substr(15, 2))),
            sys.move(toNumber(pokeCode.substr(17, 2)))
        ],
        "moveIds": [
            toNumber(pokeCode.substr(11, 2)),
            toNumber(pokeCode.substr(13, 2)),
            toNumber(pokeCode.substr(15, 2)),
            toNumber(pokeCode.substr(17, 2))
        ],
        "evs": [
            toNumber(pokeCode.substr(19, 2)),
            toNumber(pokeCode.substr(21, 2)),
            toNumber(pokeCode.substr(23, 2)),
            toNumber(pokeCode.substr(25, 2)),
            toNumber(pokeCode.substr(27, 2)),
            toNumber(pokeCode.substr(29, 2))
        ],
        "dvs": [
            toNumber(pokeCode.substr(31, 1)),
            toNumber(pokeCode.substr(32, 1)),
            toNumber(pokeCode.substr(33, 1)),
            toNumber(pokeCode.substr(34, 1)),
            toNumber(pokeCode.substr(35, 1)),
            toNumber(pokeCode.substr(36, 1))
        ],
        "gen": sys.generation(toNumber(pokeCode.substr(37, 1)),
                              toNumber(pokeCode.substr(38, 1)))
    };
}

// Tests for exact same sets, if exact is selected arr elements must be in correct order and match
function hasSameElements(arr1, arr2, exact) {
    if (test1.length !== test2.length) {
        return false;
    }
    var test1 = exact ? arr1 : arr1.slice().sort();
    var test2 = exact ? arr2 : arr2.slice().sort();
    for (var i = 0; i < test1.length; i++) {
        if (test1[i] !== test2[i]) {
            return false;
        }
    }
    return true;
}

// Checks for equivalence
function isEquivalent(code1, code2) {
    var poke1 = pokeCodeToPokemon(code1);
    var poke2 = pokeCodeToPokemon(code2);
    return (poke1.pokeId === poke2.pokeId
        && poke1.natureId === poke2.natureId
        && poke1.abilityId === poke2.abilityId
        && poke1.itemId === poke2.itemId
        && poke1.level === poke2.level
        && hasSameElements(poke1.moveIds, poke2.moveIds, false)
        && hasSameElements(poke1.evs, poke2.evs, true)
        && hasSameElements(poke1.dvs, poke2.dvs, true)
    );
}

function refresh(key) {
    try {
        if (bfHash.hasOwnProperty(key)) {
            var file = sys.getFileContent(dataDir + bfHash[key].path);
            if (typeof file === "undefined") {
                sendChanAll("The " + key + " pack is missing!", reviewChannel);
                throw "File not found";
            }
            bfSets[key] = JSON.parse(file);
            var message = [];
            var teamFile = bfSets[key];
            if (teamFile.hasOwnProperty("desc")) {
                if (typeof teamFile.desc === "string") {
                    message.push("Successfully loaded the " + teamFile.desc + " pack!");
                    bfHash[key].enabled = true;
                } else {
                    message.push("Warning: Team set description was faulty");
                }
            } else {
                message.push("Successfully loaded the " + key + " pack!");
            }
            if (numPokes(teamFile) < 12) {
                message.push("Not enough Pokemon in the " + key + " pack!");
                bfHash[key].enabled = false;
            } else {
                bfHash[key].enabled = true;
            }
            var totalPokes = 0;
            var totalSets = 0;
            for (var a in teamFile) {
                if (typeof teamFile[a] !== "object") {
                    totalPokes += 1;
                    if (isReadable(key)) {
                        totalSets += Object.keys(teamFile[a]).length;
                    } else {
                        totalSets += teamFile[a].length;
                    }
                }
            }
            message.push("Total: " + totalPokes + " Pokemon and " + totalSets + " sets.");
            if (message.length > 0) {
                sendChanAll(message.join("; "), reviewChannel);
            }
        }
    } catch (err) {
        sendChanAll("Couldn't refresh teams: " + err, reviewChannel);
    }
}

function cleanEntries() {
    var deleted = 0;
    var initialLength = 0;
    for (var tier in userQueue) {
        var initialLength = userQueue[tier].length;
        userQueue[tier] = userQueue[tier].filter(function(set, index, array) {
            return (typeof set === "object" && set !== null
                    && set.hasOwnProperty("ip")
                    && set.hasOwnProperty("name")
                    && set.hasOwnProperty("sets")
                    && set.hasOwnProperty("tier")
                    && set.hasOwnProperty("comment")
                    && set.hasOwnProperty("rating"));
        });
        deleted += initialLength - userQueue[tier].length;
    }
    if (deleted > 0) {
        sendChanAll("Invalid Entries Removed: " + deleted, staffchannel);
    }
}

function toChars(number, maxLength) {
    var base36Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = "";
    for (var i = (maxLength - 1); i >= 0; i--) {
        result += base36Digits.charAt(Math.floor(number / Math.pow(base36Digits.length, i)) % base36Digits.length);
    }
    return result;
}

function toNumber(numberString) {
    var base36Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = 0;
    for (var i = 0; i < numberString.length; i++) {
        result += base36Digits.indexOf(numberString.charAt(numberString.length - 1 - i)) * Math.pow(base36Digits.length, i);
    }
    return result;
}

function sendReviewers(message, tier, html) {
    if (sys.existChannel("BF Review")) {
        sys.playersOfChannel(reviewChannel).forEach(function(player, index, array) {
            if (isTierReviewer(player, tier)) {
                if (html) {
                    sys.sendHtmlMessage(player, message, reviewChannel);
                } else {
                    bfbot.sendMessage(player, message, reviewChannel);
                }
            }
        });
    }
}

function seeQueueItem(index, tier) {
    if (!userQueue.hasOwnProperty(tier)) {
        sendReviewers("Nothing in the " + tier + " queue.", tier, false);
    } else {
        var tierQueue = userQueue[tier];
        if (index >= tierQueue.length || index < 0 || typeof tierQueue[0] === "undefined") {
            sendReviewers("Nothing in the " + tier + " queue" + (index === 0 ? "." : " at index " + index), tier, false);
        } else {
            cleanEntries();
            var submitInfo = tierQueue[0];
            var sets = [];
            sendReviewers("The " + tier + " queue length is currently " + tierQueue.length + ". The set for review is shown below.", tier, false);
            sys.sendAll("", reviewChannel);
            sendReviewers("User: " + submitInfo.name, tier, false);
            bfbot.sendAll("Tier: " + submitInfo.tier, reviewChannel);
            submitInfo.sets.forEach(function(setCode, index, array) {
                sets.push(getReadablePoke(setCode).join("<br/>"));
            });
            sys.sendHtmlAll("<table border='2'><tr><td><pre>" + sets.join("<br/><br/>") + "</pre></td></tr></table>", reviewChannel);
            sys.sendAll("", reviewChannel);
            if (submitInfo.comment !== "") {
                sendReviewers("Comment: " + submitInfo.comment, tier, false);
            }
            sendReviewers("Use /acceptset " + tier + " to accept this submission, /rejectset " + tier + " to reject it, or /nextset " + tier + " to view the next and come back to this later.", tier, false);
        }
    }
}

function sendQueueItem(src, index, tier) {
    if (!userQueue.hasOwnProperty(tier)) {
        bfbot.sendMessage(src, "Nothing in the " + tier + " queue.", reviewChannel);
    } else {
        var tierQueue = userQueue[tier];
        if (index >= tierQueue.length || index < 0 || typeof tierQueue[0] === "undefined") {
            bfbot.sendMessage(src, "Nothing in the " + tier + " queue " + (index === 0 ? "." : " at index " + index), reviewChannel);
        } else {
            var submitInfo = tierQueue[0];
            var sets = [];
            bfbot.sendMessage(src, "The " + tier + " queue length is currently " + tierQueue.length + ". The set for review is shown below.", reviewChannel);
            sys.sendMessage(src, "", reviewChannel);
            bfbot.sendMessage(src, "User: "+submitInfo.name, reviewChannel);
            bfbot.sendMessage(src, "Tier: "+submitInfo.tier, reviewChannel);
            submitInfo.sets.forEach(function(setCode, index, array) {
                sets.push(getReadablePoke(setCode).join("<br/>"));
            });
            sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>" + sets.join("<br/><br/>") + "</pre></td></tr></table>", reviewChannel);
            sys.sendMessage(src, "", reviewChannel);
            if (submitInfo.comment !== "") {
                bfbot.sendMessage(src, "Comment: " + submitInfo.comment, reviewChannel);
            }
            bfbot.sendMessage(src, "Use /acceptset " + tier + " to accept this submission, /rejectset " + tier + " to reject it, or /nextset " + tier + " to view the next and come back to this later.", reviewChannel);
        }
    }
}

function factoryCommand(src, command, commandData, channel) {
    // default
    if (command == "updateteams") {
        var url = Config.base_url+dataDir+"bfteams.json";
        // if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
        //    url = commandData;
        // }
        bfbot.sendMessage(src, "Fetching teams from "+url, channel);
        sys.webCall(url, function(resp) {
            if (resp !== "") {
                try {
                    var test = JSON.parse(resp);
                    var res = setlint(test, false);
                    if (res.errors.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=red>ERRORS</font></th><th>"+res.errors.length+"</th></tr><tr>"+res.errors.join("</tr><tr>")+"</tr></table>", channel);
                        throw "Bad File";
                    }
                    if (res.warnings.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=orange>WARNINGS</font></th><th>"+res.warnings.length+"</th></tr><tr>"+res.warnings.join("</tr><tr>")+"</tr></table>", channel);
                    }
                    if (res.suggestions.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=green>Suggestions</font></th><th>"+res.suggestions.length+"</th></tr><tr>"+res.suggestions.join("</tr><tr>")+"</tr></table>", channel);
                    }
                    sys.writeToFile(dataDir+'bfteams.json', resp);
                    autoSave("teams", "preset");
                    sendChanAll('Updated Battle Factory Teams!', staffchannel);
                    refresh('preset');
                }
                catch (err) {
                    bfbot.sendMessage(src, "FATAL ERROR: "+err, channel);
                }
            }
            else {
                bfbot.sendMessage(src, "Failed to update!", channel);
            }
        });
        return;
    }
    else if (command === "addtier") {
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /addtier [tier]:[mode]", channel);
            return;
        }
        var dataArray = commandData.split(":", 2), tier = find_tier(dataArray[0]);
        if (tier === null) {
            bfbot.sendMessage(src, dataArray[0] + " tier doesn't exist on the server.", channel);
            return;
        }
        if (bfHash.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, tier + " tier already exists.", channel);
            return;
        }
        var template = {"desc": tier};
        if (dataArray.length === 2) {
            template.mode = dataArray[1];
        }
        if (createEntry(tier, template, "No URL for addtier")) {
            autoSave("teams", tier);
            sendChanAll("Added the tier " + tier + "!", reviewChannel);
            refresh(tier);
            reviewers[tier] = [];
            sys.writeToFile(submitDir + "reviewers.json", JSON.stringify(reviewers));
        } else {
            sendChanAll("A pack with that name already exists!", reviewChannel);
        }
        return;
    }
    else if (command == "addpack") {
        var url;
        var tmp = commandData.split(" ~ ",2);
        if (tmp.length != 2) {
            bfbot.sendMessage(src, "Usage: /addteampack [name] ~ [url]", channel);
            return;
        }
        if (tmp[0] === "") {
            bfbot.sendMessage(src, "Please specify a valid name!", channel);
            return;
        }
        if (tmp[1].indexOf("http://") === 0 || tmp[1].indexOf("https://") === 0) {
            url = tmp[1];
        }
        else {
            bfbot.sendMessage(src, "Please specify a valid URL to update from", channel);
            return;
        }
        bfbot.sendMessage(src, "Fetching teams from "+url, channel);
        sys.webCall(url, function(resp) {
            if (resp !== "") {
                try {
                    var test = JSON.parse(resp);
                    var res = setlint(test, false);
                    if (res.errors.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=red>ERRORS</font></th><th>"+res.errors.length+"</th></tr><tr>"+res.errors.join("</tr><tr>")+"</tr></table>", channel);
                        throw "Bad File";
                    }
                    if (res.warnings.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=orange>WARNINGS</font></th><th>"+res.warnings.length+"</th></tr><tr>"+res.warnings.join("</tr><tr>")+"</tr></table>", channel);
                    }
                    if (res.suggestions.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=green>Suggestions</font></th><th>"+res.suggestions.length+"</th></tr><tr>"+res.suggestions.join("</tr><tr>")+"</tr></table>", channel);
                    }
                    if (createEntry(tmp[0],test,url)) {
                        autoSave("teams", tmp[0]);
                        sendChanAll('Added the team pack '+tmp[0]+'!', reviewChannel);
                        refresh(tmp[0]);
                    }
                    else {
                        sendChanAll('A pack with that name already exists!', reviewChannel);
                    }
                }
                catch (err) {
                    bfbot.sendMessage(src, "FATAL ERROR: "+err, channel);
                }
            }
            else {
                bfbot.sendMessage(src, "Failed to add the team pack!", channel);
            }
        });
        return;
    }
    else if (command == "updatepack") {
        var url;
        var tmp = commandData.split(" ~ ",2);
        if (tmp[0] === "" || !bfHash.hasOwnProperty(tmp[0])) {
            bfbot.sendMessage(src, "Please specify a valid pack to update!", channel);
            return;
        }
        if (tmp.length == 2) {
            if (tmp[1].indexOf("http://") === 0 || tmp[1].indexOf("https://") === 0) {
                url = tmp[1];
            }
            else {
                bfbot.sendMessage(src, "Invalid URL!", channel);
                return;
            }
        }
        else if (bfHash[tmp[0]].hasOwnProperty('url')) {
            url = bfHash[tmp[0]].url;
        }
        else {
            bfbot.sendMessage(src, "Please specify a valid URL to update from!", channel);
            return;
        }
        bfbot.sendMessage(src, "Updating "+tmp[0]+" teams from "+url, channel);
        var hash = bfHash[tmp[0]];
        sys.webCall(url, function(resp) {
            if (resp !== "") {
                try {
                    var test = JSON.parse(resp);
                    var res = setlint(test, false);
                    if (res.errors.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=red>ERRORS</font></th><th>"+res.errors.length+"</th></tr><tr>"+res.errors.join("</tr><tr>")+"</tr></table>", channel);
                        throw "Bad File";
                    }
                    if (res.warnings.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=orange>WARNINGS</font></th><th>"+res.warnings.length+"</th></tr><tr>"+res.warnings.join("</tr><tr>")+"</tr></table>", channel);
                    }
                    if (res.suggestions.length > 0) {
                        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=green>Suggestions</font></th><th>"+res.suggestions.length+"</th></tr><tr>"+res.suggestions.join("</tr><tr>")+"</tr></table>", channel);
                    }
                    bfHash[tmp[0]].url = url;
                    sys.writeToFile(dataDir+hash.path, resp);
                    sendChanAll('Updated '+tmp[0]+' Battle Factory Teams!', reviewChannel);
                    refresh(tmp[0]);
                    autoSave("teams", tmp[0]);
                }
                catch (err) {
                    bfbot.sendMessage(src, "FATAL ERROR: "+err, channel);
                }
            }
            else {
                bfbot.sendMessage(src, "Failed to update!", channel);
            }
        });
        return;
    }
    else if (command == "deletepack") {
        if (commandData === "") {
            bfbot.sendMessage(src, "Please specify a team pack to remove!", channel);
            return;
        }
        if (commandData === "preset") {
            bfbot.sendMessage(src, "Can't remove the built in pack!", channel);
            return;
        }
        var delkey = commandData;
        if (bfHash.hasOwnProperty(delkey)) {
            sys.deleteFile(dataDir + bfHash[delkey].path);
            delete bfHash[delkey];
            delete bfSets[delkey];
            if (reviewers.hasOwnProperty(delkey)) {
                delete reviewers[delkey];
                sys.writeToFile(submitDir+"reviewers.json", JSON.stringify(reviewers));
            }
            bfbot.sendAll("Removed the team pack "+delkey+"!", reviewChannel);
            autoSave("teams", "");
        }
        else {
            bfbot.sendMessage(src, "Couldn't find a team pack with the name "+delkey+"!", channel);
        }
        return;
    }
    else if (command == "disablepack") {
        if (!bfHash.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "Please specify a valid team pack to disable!", channel);
            return;
        }
        if (bfHash[commandData].active === false) {
            bfbot.sendMessage(src, "This pack is already disabled!", channel);
            return;
        }
        bfHash[commandData].active = false;
        bfbot.sendAll("Disabled the pack: "+commandData, reviewChannel);
        autoSave("teams", "");
        return;
    }
    else if (command == "enablepack") {
        if (!bfHash.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "Please specify a valid team pack to enable!", channel);
            return;
        }
        if (bfHash[commandData].active === true) {
            bfbot.sendMessage(src, "This pack is already enabled!", channel);
            return;
        }
        bfHash[commandData].active = true;
        bfbot.sendAll("Enabled the pack: "+commandData, reviewChannel);
        autoSave("teams", "");
        return;
    }
    else if (command === "pokeslist") {
        var tfile, tier = find_tier(commandData), tteams = 0, tsets = 0;
        if (commandData === "") {
            tfile = bfSets.preset;
        } else {
            if (tier === null) {
                bfbot.sendMessage(src, "The " + commandData + " tier doesn't exist on this server.", channel);
                return;
            }
            if (!bfSets.hasOwnProperty(tier)) {
                bfbot.sendMessage(src, "Battle Factory doesn't have any " + tier + " sets installed.", channel);
                return;
            }
            tfile = bfSets[tier];
        }
        for (var t in tfile) {
            if (typeof tfile[t] !== "object") {
                continue;
            }
            var poke = sys.pokemon(parseInt(t, 10));
            tteams += 1;
            var setlength = 0;
            if (isReadable(tfile)) {
                var lteams = tfile[t];
                setlength = Object.keys(lteams).length;
            }
            else {
                setlength = tfile[t].length;
            }
            tsets += setlength;
            bfbot.sendMessage(src, poke + ": Has " + setlength + " sets.", channel);
        }
        bfbot.sendMessage(src, "", channel);
        bfbot.sendMessage(src, (tier === null ? "Preset" : tier) + " totals: " + tteams + " pokes and " + tsets + " sets.", channel);
        return;
    }
    else if (command == "pokecode") {
        try {
            var msg = getReadablePoke(commandData);
            sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>"+msg.join("<br/>")+"</pre></td></tr></table>", channel);
            return;
        }
        catch (err) {
            bfbot.sendMessage(src, "Invalid Code: "+err, channel);
            return;
        }
    }
    else if (command == "refresh") {
        if (!bfSets.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "No such pack exists!", channel);
            return;
        }
        autoSave("teams", commandData);
        refresh(commandData);
        bfbot.sendMessage(src, "Refreshed the "+commandData+" pack!", channel);
        return;
    }
    else if (command == "loadfromfile") {
        if (!bfSets.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "No such pack exists!", channel);
            return;
        }
        refresh(commandData);
        bfbot.sendMessage(src, "Loaded " + commandData + " file", channel);
        return;
    }
    else if (command == "pokesets") {
        var tmp = commandData.split(":",2);
        var sets = [];
        var id = sys.pokeNum(tmp[0])%65536;
        var revsets = {};
        if (tmp.length == 2) {
            var pack = utilities.getCorrectPropName(tmp[1], bfSets);
            revsets = bfSets.hasOwnProperty(pack) ? bfSets[pack] : bfSets.preset;
        }
        else {
            revsets = bfSets.preset;
        }
        if (!revsets.hasOwnProperty(id)) {
            bfbot.sendMessage(src, "No sets exist for that pokemon.", channel);
            return;
        }
        var pokesets = revsets[id];
        for (var b in pokesets) {
            try {
                if (isReadable(pokesets)) {
                    sets.push(getReadablePoke(b).join("<br/>"));
                }
                else {
                    if (typeof pokesets[b] == "object") {
                        var newarr = getReadablePoke(pokesets[b].set);
                        newarr.push("Submitted By: "+html_escape(pokesets[b].submitter), "Accepted By: "+html_escape(pokesets[b].auth));
                        sets.push(newarr.join("<br/>"));
                    } else {
                        sets.push(getReadablePoke(pokesets[b]).join("<br/>"));
                    }
                }
            }
            catch (err) {
                bfbot.sendMessage(src, "Error (id: "+pokesets[b]+"): "+err, channel);
            }
        }
        if (sets.length > 0) {
            sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>"+sets.join("<br/><br/>")+"</pre></td></tr></table>", channel);
        }
        return;
    }
    else if (command == "scansets" || command == "scanusersets") {
        var res = {};
        var checkfile;
        var filename = command == "scansets" ? "bfteams.json" : "bfteams_user.json";
        if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
            var url = commandData;
            bfbot.sendMessage(src, "Fetching teams from "+url+" for checking", channel);
            sys.webCall(url, function(resp) {
                var localerr = false;
                if (resp !== "") {
                    try {
                        checkfile = JSON.parse(resp);
                        res = setlint(checkfile, true);
                    }
                    catch (err) {
                        localerr = err;
                    }
                }
                else {
                    localerr = "Web file not found: Invalid URL or web functions are not working";
                }
                if (localerr !== false) {
                    res = {'errors': ["<td>FATAL ERROR</td><td>"+localerr+"</td>"], 'warnings': [], 'suggestions': []};
                }
                if (res.errors.length > 0) {
                    sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=red>ERRORS</font></th><th>"+res.errors.length+"</th></tr><tr>"+res.errors.join("</tr><tr>")+"</tr></table>", channel);
                }
                if (res.warnings.length > 0) {
                    sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=orange>WARNINGS</font></th><th>"+res.warnings.length+"</th></tr><tr>"+res.warnings.join("</tr><tr>")+"</tr></table>", channel);
                }
                if (res.suggestions.length > 0) {
                    sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=green>Suggestions</font></th><th>"+res.suggestions.length+"</th></tr><tr>"+res.suggestions.join("</tr><tr>")+"</tr></table>", channel);
                }
                bfbot.sendMessage(src, "Finished checking.", channel);
            });
        }
        else {
            try {
                if (commandData !== "") {
                    filename = commandData;
                }
                // Only allow search of bfdata directory
                var test = sys.getFileContent(dataDir+filename);
                if (test === undefined) {
                    throw "Invalid File Path: The file '"+filename+"' does not exist or could not be accessed";
                }
                checkfile = JSON.parse(test);
                res = setlint(checkfile, true);
            }
            catch (err) {
                res = {'errors': ["<td>FATAL ERROR</td><td>"+html_escape(err)+"</td>"], 'warnings': [], 'suggestions': []};
            }
            if (res.errors.length > 0) {
                sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=red>ERRORS</font></th><th>"+res.errors.length+"</th></tr><tr>"+res.errors.join("</tr><tr>")+"</tr></table>", channel);
            }
            if (res.warnings.length > 0) {
                sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=orange>WARNINGS</font></th><th>"+res.warnings.length+"</th></tr><tr>"+res.warnings.join("</tr><tr>")+"</tr></table>", channel);
            }
            if (res.suggestions.length > 0) {
                sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=green>Suggestions</font></th><th>"+res.suggestions.length+"</th></tr><tr>"+res.suggestions.join("</tr><tr>")+"</tr></table>", channel);
            }
            bfbot.sendMessage(src, "Finished checking.", channel);
        }
        return;
    }
    else if (command == "bfversion") {
        var tfile = bfSets.hasOwnProperty(commandData) ? bfSets[commandData] : bfSets.preset;
        var tteams = 0;
        var tsets = 0;
        var pokes = [];
        var info = "NO_NAME";
        if (tfile.hasOwnProperty('desc')) {
            if (typeof tfile.desc == "string") {
                info = tfile.desc;
            }
        }
        for (var t in tfile) {
            if (typeof tfile[t] != "object") {
                continue;
            }
            var poke = sys.pokemon(parseInt(t, 10));
            tteams += 1;
            var setlength = 0;
            if (isReadable(tfile[t])) {
                var lteams = tfile[t];
                setlength = Object.keys(lteams).length;
            }
            else {
                setlength = tfile[t].length;
            }
            tsets += setlength;
            pokes.push(poke);
        }
        pokes.sort();
        bfbot.sendMessage(src, "Installed Pokemon: "+pokes.join(", "), channel);
        bfbot.sendMessage(src, "Total: "+tteams+" pokes and "+tsets+" sets.", channel);
        bfbot.sendMessage(src, "Team Pack Description: "+info, channel);
        return;
    }
    else if (command == "viewpacks") {
        var table = "<table><tr><th colspan=4>Battle Factory Packs</th></tr><tr><th>Name</th><th>Enabled</th><th>Working</th><th>URL</th></tr>";
        for (var h in bfHash) {
            table += "<tr><td>"+html_escape(h)+"</td><td>"+(bfHash[h].active ? "Yes" : "No")+"</td><td>"+(bfHash[h].enabled ? "Yes" : "No")+"</td><td>"+(bfHash[h].hasOwnProperty('url') ? "<a href="+bfHash[h].url+">"+html_escape(bfHash[h].url)+"</a></td></tr>" : "Not Specified");
        }
        table += "</table>";
        sys.sendHtmlMessage(src,table,channel);
        return;
    }
    else if (command == "submitsets" || command == "bulksubmit") {
        // This will export the first team to a submission queue
        cleanEntries(); // clean out any invalid entries
        var comment = commandData;
        if (!sys.dbRegistered(sys.name(src))) {
            bfbot.sendMessage(src, "You need to register to submit sets.", channel);
            return;
        }
        if (submitBans.hasOwnProperty(sys.ip(src))) {
            bfbot.sendMessage(src, "You are banned from submitting sets!", channel);
            return;
        }
        var submittier = sys.tier(src, 0);
        if (!bfSets.hasOwnProperty(submittier)) {
            bfbot.sendMessage(src, "No submissions are available for your tier!", channel);
            return;
        }
        var submissions = 0;
        for (var q in userQueue) {
            var tqueue = userQueue[q];
            for (var j in tqueue) {
                if (tqueue[j].ip == sys.ip(src) || tqueue[j].name == sys.name(src)) {
                    submissions += 1;
                }
            }
        }
        var maxsubmissions = sys.auth(src) >= 1 ? 100 : 15;
        if (sys.auth(src) < 2 && submissions >= maxsubmissions) {
            bfbot.sendMessage(src, "You already have "+maxsubmissions+" or more submissions in the queue, please wait until they get reviewed!", channel);
            return;
        }
        var team = [];
        for (var x=0;x<6;x++) {
            var pokecode = "";
            var poke = sys.teamPoke(src, 0, x);
            if (poke === 0) { // don't export missingno.
                continue;
            }
            // This accounts for formes
            var pokenum = poke%65536;
            var formnum = Math.floor(poke/65536);
            var nature = sys.teamPokeNature(src, 0, x);
            var ability = sys.teamPokeAbility(src, 0, x);
            var item = sys.teamPokeItem(src, 0, x);
            var level = sys.teamPokeLevel(src, 0, x);
            if (['Middle Cup'].indexOf(submittier) > -1 && level > 50) {
                bfbot.sendMessage(src, sys.pokemon(poke) + " must not be above Level 50 for Middle Cup.", channel);
                continue;
            }
            if (['LC'].indexOf(submittier) > -1 && level > 5) {
                bfbot.sendMessage(src, sys.pokemon(poke) + " must not be above Level 5 for Little Cup.", channel);
                continue;
            }
            if (['Random Battle'].indexOf(submittier) > -1 && level > 50) {
                bfbot.sendMessage(src, sys.pokemon(poke) + " was scaled down to Level 50 for Random Battle.", channel);
                level = 50;
            }
            pokecode = pokecode + toChars(pokenum,2) + toChars(formnum,1) + toChars(nature,1) + toChars(ability,2) + toChars(item,3) + toChars(level,2);
            var movelist = [];
            for (var m=0; m<4; m++) {
                var move = sys.teamPokeMove(src, 0, x, m);
                var bannedmoves = ['Double Team', 'Minimize', 'Guillotine', 'Horn Drill', 'Sheer Cold', 'Fissure'];
                if (bannedmoves.indexOf(sys.move(move)) > -1 && submittier != "Random Battle") {
                    bfbot.sendMessage(src, "The move "+sys.move(move)+" is not allowed in this tier!", channel);
                    continue;
                }
                movelist.push(sys.move(move));
                pokecode = pokecode + toChars(move, 2);
            }
            var evlist = [];
            for (var e=0; e<6; e++) {
                var ev = sys.teamPokeEV(src, 0, x, e);
                evlist.push(ev);
                pokecode = pokecode + toChars(ev, 2);
            }
            var dvlist = [];
            for (var d=0; d<6; d++) {
                var dv = sys.teamPokeDV(src, 0, x, d);
                dvlist.push(dv);
                pokecode = pokecode + toChars(dv, 1);
            }
            pokecode = pokecode + toChars(sys.gen(src,0), 1) + toChars(sys.subgen(src,0), 1);
            // Getting rid of duplicate entries here
            var pastdb = bfSets[submittier];
            if (pastdb.hasOwnProperty(pokenum)) {
                var arr = pastdb[pokenum];
                var equal = false;
                for (var p in arr) {
                    if (typeof arr[p] == "object") {
                        if (isEquivalent(arr[p].set, pokecode)) {
                            equal = true;
                            break;
                        }
                    }
                    else {
                        if (isEquivalent(arr[p], pokecode)) {
                            equal = true;
                            break;
                        }
                    }
                }
                if (equal) {
                    continue;
                }
            }
            team.push(pokecode);
        }
        // Write the short code for export
        if (team.length === 0) {
            bfbot.sendMessage(src, "You have no Pokemon that can be submitted!", channel);
            return;
        }
        var submitlist = [];
        var submission = {};
        if (command == "submitsets") {
            for (var s in team) {
                submission = {
                    'ip': sys.ip(src),
                    'name': sys.name(src),
                    'sets': [team[s]],
                    'tier': submittier,
                    'comment': comment,
                    'rating': 0
                };
                submitlist.push(submission);
            }
        }
        else {
            submission = {
                'ip': sys.ip(src),
                'name': sys.name(src),
                'sets': team,
                'tier': submittier,
                'comment': comment,
                'rating': 0
            };
            submitlist.push(submission);
        }
        if (userQueue.hasOwnProperty(submittier)) {
            var oldarr = userQueue[submittier];
            userQueue[submittier] = oldarr.concat(submitlist);
        }
        else {
            userQueue[submittier] = submitlist;
        }
        bfbot.sendMessage(src, "Submitted your sets. See your submission below.", channel);
        bfbot.sendAll(sys.name(src)+" submitted some "+submittier+" sets for Battle Factory.", reviewChannel);
        var sets = [];
        for (var b in team) {
            sets.push(getReadablePoke(team[b]).join("<br/>"));
        }
        sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>"+sets.join("<br/><br/>")+"</pre></td></tr></table>", channel);
        return;
    }
    else if (command == 'checkqueue') {
        if (!userQueue.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "Usage: /checkqueue [tier] (tier is case sensitive)", channel);
            return;
        }
        if (userQueue[commandData].length === 0) {
            bfbot.sendMessage(src, "Nothing in the "+commandData+" queue.", channel);
            return;
        }
        seeQueueItem(0, commandData);
        return;
    }
    else if (command == 'acceptset') {
        commandData = find_tier(commandData);
        if (!userQueue.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "Usage: /acceptset [tier] (tier is case sensitive)", channel);
            return;
        }
        if (userQueue[commandData].length === 0) {
            bfbot.sendMessage(src, "Nothing in the "+commandData+" queue.", channel);
            return;
        }
        var accept = userQueue[commandData][0];
        if (accept.ip == sys.ip(src) && !isReviewAdmin(src)) {
            bfbot.sendMessage(src, "Can't accept your own sets.", channel);
            return;
        }
        if (!isTierReviewer(src, accept.tier)) {
            bfbot.sendMessage(src, "You are not authorised to review "+accept.tier+" sets.", channel);
            return;
        }
        var srctier = accept.tier;
        if (!bfSets.hasOwnProperty(srctier)) {
            bfbot.sendMessage(src, "No sets can be accepted for that tier.", channel);
            return;
        }
        bfbot.sendAll(accept.name+"'s submission was accepted by "+sys.name(src),reviewChannel);
        var teamsave = bfSets[srctier];
        var team = accept.sets;
        // Write the short code
        for (var g in team) {
            var set = {'set': team[g], 'submitter': accept.name, 'auth': sys.name(src)};
            var species = toNumber(set.set.substr(0,2));
            if (teamsave.hasOwnProperty(species)) {
                teamsave[species].push(set);
                continue;
            }
            else {
                teamsave[species] = [set];
            }
        }
        bfSets[srctier] = teamsave;
        userQueue[commandData].splice(0,1);
        seeQueueItem(0, commandData);
        return;
    }
    else if (command == 'rejectset') {
        commandData = find_tier(commandData);
        if (!userQueue.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "Usage: /rejectset [tier] (tier is case sensitive)", channel);
            return;
        }
        if (userQueue[commandData].length === 0) {
            bfbot.sendMessage(src, "Nothing in the "+commandData+" queue.", channel);
            return;
        }
        var reject = userQueue[commandData][0];
        // Maybe change the reject mechanics?
        if (!isTierReviewer(src, reject.tier) && reject.name != sys.name(src)) {
            bfbot.sendMessage(src, "You are not authorised to review "+reject.tier+" sets.", channel);
            return;
        }
        bfbot.sendMessage(src, "You rejected the current set.", channel);
        bfbot.sendAll(reject.name+"'s submission was rejected by "+sys.name(src),reviewChannel);
        userQueue[commandData].splice(0,1);
        seeQueueItem(0, commandData);
        return;
    }
    else if (command == 'nextset') {
        commandData = find_tier(commandData);
        if (!userQueue.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "Usage: /nextset [tier] (tier is case sensitive)", channel);
            return;
        }
        if (userQueue[commandData].length === 0) {
            bfbot.sendMessage(src, "Nothing in the "+commandData+" queue.", channel);
            return;
        }
        var shift = (userQueue[commandData].splice(0,1))[0];
        userQueue[commandData].push(shift);
        seeQueueItem(0, commandData);
        return;
    }
    else if (command == 'savesets') {
        autoSave("all", "");
        bfbot.sendMessage(src, "Saved user generated sets!", channel);
        return;
    }
    else if (command == 'deleteset') {
        var found = false;
        var tmp = commandData.split(":", 2);
        if (tmp.length != 2) {
            bfbot.sendMessage(src, "Usage: /deleteset [tier]:[code]", channel);
            return;
        }
        if (!bfSets.hasOwnProperty(tmp[0])) {
            bfbot.sendMessage(src, "No such tier exists!", channel);
            return;
        }
        if (!isTierReviewer(src, tmp[0])) {
            bfbot.sendMessage(src, "You are not authorised to review "+tmp[0]+" sets.", channel);
            return;
        }
        var deletesets = bfSets[tmp[0]];
        for (var u in deletesets) {
            var setlist = deletesets[u];
            if (typeof setlist !== "object") {
                continue;
            }
            var index = -1;
            for (var y=0; y<setlist.length; y++) {
                if (typeof setlist[y] == "object") {
                    if (setlist[y].set === tmp[1]) {
                        index = y;
                        break;
                    }
                }
                else {
                    if (setlist[y] === tmp[1]) {
                        index = y;
                        break;
                    }
                }
            }
            if (index > -1) {
                setlist.splice(index,1);
                if (setlist.length === 0) {
                    delete deletesets[u];
                }
                else {
                    deletesets[u] = setlist;
                }
                found = true;
                break;
            }
        }
        if (!found) {
            bfbot.sendMessage(src, "No such set exists!", channel);
            return;
        }
        var deletemsg = getReadablePoke(tmp[1]);
        bfSets[tmp[0]] = deletesets;
        sendChanHtmlAll("<table border='2'><tr><td style='background-color:#ff7777;'><pre>"+deletemsg.join("<br/>")+"</pre></td></tr></table>",reviewChannel);
        bfbot.sendAll(sys.name(src)+" deleted set id "+tmp[1]+" from "+tmp[0]+"!", reviewChannel);
        return;
    }
    else if (command == 'deletepoke') {
        var found = false;
        var tmp = commandData.split(":", 2);
        if (tmp.length != 2) {
            bfbot.sendMessage(src, "Usage: /deletepoke [poke]:[tier]", channel);
            return;
        }
        if (!bfSets.hasOwnProperty(tmp[1])) {
            bfbot.sendMessage(src, "No such tier exists!", channel);
            return;
        }
        if (!isTierReviewer(src, tmp[1])) {
            bfbot.sendMessage(src, "You are not authorised to review "+tmp[1]+" sets.", channel);
            return;
        }
        var deletesets = bfSets[tmp[1]];
        for (var u in deletesets) {
            if (parseInt(u,10) == sys.pokeNum(tmp[0])) {
                delete deletesets[u];
                found = true;
                break;
            }
        }
        if (!found) {
            bfbot.sendMessage(src, "No such Pokemon exists!", channel);
            return;
        }
        bfSets[tmp[0]] = deletesets;
        bfbot.sendAll(sys.name(src)+" deleted all of "+tmp[0]+"'s sets from "+tmp[1]+"!", reviewChannel);
        return;
    }
    else if (command == 'submitbans') {
        sys.sendMessage(src, "*** SUBMIT BANS ***", channel);
        for (var j in submitBans) {
            sys.sendMessage(src, submitBans[j].user+": Banned by "+submitBans[j].auth, channel);
        }
        sys.sendMessage(src, "*** END OF SUBMIT BANS ***", channel);
    }
    else if (command == 'submitban') {
        if (commandData === "") {
            bfbot.sendMessage(src, "Must specify a user!", channel);
            return;
        }
        var target = commandData;
        var tarip = sys.dbIp(target);
        if (tarip === undefined) {
            bfbot.sendMessage(src, "No such user.", channel);
            return;
        }
        var maxAuth = sys.maxAuth(sys.dbIp(target));
        if (maxAuth >= 1) {
            bfbot.sendMessage(src, "Can't submit ban auth.", channel);
            return;
        }
        if (submitBans.hasOwnProperty(tarip)) {
            bfbot.sendMessage(src, commandData+" is already banned from submitting!", channel);
            return;
        }
        submitBans[tarip] = {'user': commandData.toLowerCase(), 'auth': sys.name(src)};
        bfbot.sendAll(commandData+" was banned from submitting sets by "+sys.name(src)+"!",reviewChannel);
        sys.writeToFile(submitDir+"bans.json", JSON.stringify(submitBans));
        return;
    }
    else if (command == 'submitunban') {
        if (commandData === "") {
            bfbot.sendMessage(src, "Must specify a user!", channel);
            return;
        }
        var target = commandData;
        var tarip = sys.dbIp(target);
        if (tarip === undefined) {
            bfbot.sendMessage(src, "No such user.", channel);
            return;
        }
        if (!submitBans.hasOwnProperty(tarip)) {
            bfbot.sendMessage(src, commandData+" is not banned from submitting!", channel);
            return;
        }
        delete submitBans[tarip];
        bfbot.sendAll(commandData+" was unbanned from submitting sets by "+sys.name(src)+"!",reviewChannel);
        sys.writeToFile(submitDir+"bans.json", JSON.stringify(submitBans));
        return;
    }
    else if (command == "export") {
        if (!bfSets.hasOwnProperty(commandData)) {
            bfbot.sendMessage(src, "No such pack exists!", channel);
            return;
        }
        var content = bfSets[commandData];
        var ret = "<table><tr><td><pre>"+JSON.stringify(content, null, 4)+"</pre></td></tr></table>";
        sys.sendHtmlMessage(src, ret, channel);
        return;
    }
    else if (command == 'addreviewer') {
        var tmp = commandData.split(":", 2);
        if (tmp.length != 2) {
            bfbot.sendMessage(src, "Usage: /addreviewer [name]:[tier] (tier is case sensitive)", channel);
            return;
        }
        if (!reviewers.hasOwnProperty(tmp[1])) {
            bfbot.sendMessage(src, "You can't add reviewers for that tier!", channel);
            return;
        }
        if (sys.dbIp(tmp[0]) === undefined) {
            bfbot.sendMessage(src, "No such user.", channel);
            return;
        }
        if (!sys.dbRegistered(tmp[0])) {
            bfbot.sendMessage(src, "Reviewers must be registered!", channel);
            return;
        }
        var tierrev = reviewers[tmp[1]];
        for (var v in tierrev) {
            if (tmp[0].toLowerCase() === tierrev[v].toLowerCase()) {
                bfbot.sendMessage(src, "They are already a reviewer!", channel);
                return;
            }
        }
        reviewers[tmp[1]].push(tmp[0]);
        bfbot.sendAll(sys.name(src)+" made "+tmp[0]+" an approved reviewer of "+tmp[1]+"!",reviewChannel);
        sys.writeToFile(submitDir+"reviewers.json", JSON.stringify(reviewers));
    }
    else if (command == 'removereviewer') {
        var tmp = commandData.split(":", 2);
        if (tmp.length != 2) {
            bfbot.sendMessage(src, "Usage: /removereviewer [name]:[tier] (tier is case sensitive)", channel);
            return;
        }
        if (!reviewers.hasOwnProperty(tmp[1])) {
            bfbot.sendMessage(src, "You can't remove reviewers for that tier!", channel);
            return;
        }
        var tierrev = reviewers[tmp[1]];
        var removed = false;
        for (var v in tierrev) {
            if (tmp[0].toLowerCase() === tierrev[v].toLowerCase()) {
                removed = true;
                var removeindex = reviewers[tmp[1]].indexOf(tierrev[v]);
                reviewers[tmp[1]].splice(removeindex, 1);
            }
        }
        if (removed) {
            bfbot.sendAll(sys.name(src)+" fired "+tmp[0]+" from reviewing "+tmp[1]+"!",reviewChannel);
            sys.writeToFile(submitDir+"reviewers.json", JSON.stringify(reviewers));
        }
        else {
            bfbot.sendMessage(src, "They are not a reviewer!", channel);
        }
        return;
    }
    else if (command == 'reviewers') {
        sys.sendMessage(src, "*** Current Reviewers ***", channel);
        for (var r in reviewers) {
            sys.sendMessage(src, r+": "+reviewers[r].join(", "), channel);
        }
        return;
    }
    else if (command == "destroyreview") {
        var parr = sys.playersOfChannel(reviewChannel);
        for (var x in parr) {
            if (!isReviewAdmin(parr[x])) {
                sys.kick(parr[x], reviewChannel);
            }
        }
        bfbot.sendMessage(src, "Destroyed Review Channel", channel);
        return;
    }
    else if (command == 'backlog') {
        sys.sendMessage(src, "*** Current Queue Lengths ***", channel);
        for (var a in bfHash) {
            if (a == "preset") {
                continue;
            }
            if (!userQueue.hasOwnProperty(a)) {
                sys.sendMessage(src, a+": 0", channel);
            }
            else {
                sys.sendMessage(src, a+": "+userQueue[a].length, channel);
            }
        }
        return;
    } else if (command == 'forcestart') {
        working = true;
        bfbot.sendMessage(src, "Battle Factory is working again", channel);
        return;
    }

    else return 'no command';
}

// Set file checking
function setlint(checkfile) {
    var errors = [];
    var warnings = [];
    var suggestions = [];
    if (checkfile.hasOwnProperty('desc')) {
        if (typeof checkfile.desc !== "string") {
            warnings.push("<td>Description</td><td>desc property must be a string</td>");
        }
    }
    else {
        suggestions.push("<td>Description</td><td>desc property can be used to give a description for your team pack</td>");
    }
    if (checkfile.hasOwnProperty('mode')) {
        if (typeof checkfile.desc !== "string") {
            warnings.push("<td>Mode</td><td>Mode property must be a string (Singles, Doubles, Triples)</td>");
        }
    }
    else {
        suggestions.push("<td>Mode</td><td>mode property can be used to make a pack dedicated to singles/doubles/triples (default is singles)</td>");
    }
    var readable = false;
    if (checkfile.hasOwnProperty("readable")) {
        warnings.push("<td>Readable Property</td><td>Readable Property is depreciated, avoid using readable set packs where possible</td>");
    }
    var stats = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
    for (var x in checkfile) {
        var setinfo = checkfile[x];
        if (typeof setinfo !== 'object') {
            if (["readable", "desc", "mode", "perfectivs", "maxpokes"].indexOf(x) == -1) {
                warnings.push("<td>Bad property</td><td>'"+html_escape(x)+"' property must be an object</td>");
            }
            continue;
        }
        if (readable) {
            var sets = checkfile[x];
            var available = [];
            var setids = [];
            for (var t in sets) {
                if (typeof sets[t] !== "object") {
                    errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+t+": properties of it must be an object</td>");
                    continue;
                }
                available.push(sets[t]);
                setids.push(t);
            }
            for (var j in available) {
                var prop = available[j];
                var sid = setids[j];
                for (var p in prop) {
                    if (['poke', 'nature', 'ability', 'item'].indexOf(p) != -1) {
                        if (typeof prop[p] !== "string") {
                            errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+": property '"+p+"' must be a string</td>");
                        }
                    }
                    else if (['level'].indexOf(p) != -1) {
                        if (typeof prop[p] !== "number") {
                            errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+": property '"+p+"' must be a number</td>");
                        }
                        else if (prop.level < 1 || prop.level > 100) {
                            errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+": level property must be an integer between 1 and 100 (inclusive)</td>");
                        }
                    }
                    else if (['moves', 'evs', 'dvs'].indexOf(p) != -1) {
                        if (typeof prop[p] !== "object") {
                            errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+": property '"+p+"' must be an array</td>");
                        }
                        else {
                            if (p == 'moves' && prop[p].length != 4) {
                                errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+": property '"+p+"' must be an array of length 4</td>");
                            }
                            if (['evs', 'dvs'].indexOf(p) != -1 && prop[p].length != 6) {
                                errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+": property '"+p+"' must be an array of length 6</td>");
                            }
                            else if (p == 'dvs'){
                                var dvlist = prop.dvs;
                                for (var d in dvlist) {
                                    if (typeof dvlist[d] !== "number" || dvlist[d] < 0 || dvlist[d] > 31) {
                                        errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+"; property '"+p+"'; array values must be integers between 0 and 31 inclusive.</td>");
                                    }
                                }
                            }
                            else if (p == 'evs'){
                                var evlist = prop.evs;
                                var evsum = 0;
                                for (var e in evlist) {
                                    if (typeof evlist[e] !== "number" || evlist[e] < 0 || evlist[e] > 255) {
                                        errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+"; property '"+p+"'; array values must be integers between 0 and 255 inclusive.</td>");
                                    }
                                    else {
                                        evsum += evlist[e];
                                    }
                                }
                                if (evsum > 510) {
                                    errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+"; property '"+p+"'; maximum sum of EVs must not exceed 510.</td>");
                                }
                            }
                            else {
                                var moves = prop.moves;
                                for (var m in moves) {
                                    if (typeof moves[m] !== "string") {
                                        errors.push("<td>Bad set property</td><td>Property '"+html_escape(x)+"'; set "+sid+"; property '"+p+"'; array values must be strings.</td>");
                                    }
                                }
                            }
                        }
                    }
                    else {
                        warnings.push("<td>Unused Property</td><td>Property '"+html_escape(x)+"'; set "+sid+": unused property '"+p+"'</td>");
                    }
                }
                var iserr = false;
                var reqprops = ['poke', 'nature', 'ability', 'item', 'level', 'moves', 'evs', 'dvs'];
                for (var a in reqprops) {
                    if (!prop.hasOwnProperty(reqprops[a])) {
                        errors.push("<td>Missing property</td><td>Property '"+html_escape(x)+"'; set "+sid+": property '"+reqprops[a]+"' is missing</td>");
                        iserr = true;
                    }
                }
                if (iserr) {
                    continue;
                }
                var testprop = {
                    'poke': sys.pokeNum(prop.poke),
                    'nature': sys.natureNum(prop.nature),
                    'ability': sys.abilityNum(prop.ability),
                    'item': sys.itemNum(prop.item),
                    'level': prop.level,
                    'moves': [sys.moveNum(prop.moves[0]),sys.moveNum(prop.moves[1]),sys.moveNum(prop.moves[2]),sys.moveNum(prop.moves[3])],
                    'evs': prop.evs,
                    'dvs': prop.dvs
                };
                if (testprop.poke === 0 || testprop.poke === undefined) {
                    errors.push("<td>Missing Poke</td><td>Property '"+html_escape(x)+"'; set "+sid+": Pokemon detected was Missingno.</td>");
                }
                if (testprop.item === 0 || testprop.item === undefined) {
                    warnings.push("<td>Missing Item</td><td>Property '"+html_escape(x)+"'; set "+sid+": Not holding an item.</td>");
                }
                var nummoves = 0;
                for (var mm = 0; mm < 4; mm++) {
                    if (testprop.moves[mm] === 0 || testprop.moves[mm] === undefined) {
                        warnings.push("<td>Missing Move</td><td>Property '"+html_escape(x)+"'; set "+sid+": Moveslot "+(mm+1)+" is empty.</td>");
                    }
                    else {
                        nummoves += 1;
                    }
                }
                if (nummoves === 0) {
                    errors.push("<td>No Moves</td><td>Property '"+html_escape(x)+"'; set "+sid+": Pokemon has no moves.</td>");
                }
                var ttlevsum = 0;
                for (var ee in testprop.evs) {
                    if (testprop.evs[ee]%4 !== 0) {
                        warnings.push("<td>Wasted EVs</td><td>Property '"+html_escape(x)+"'; set "+sid+": EVs for "+stats[ee]+" are wasted. (Use a multiple of 4)</td>");
                    }
                    ttlevsum += testprop.evs[ee];
                }
                if (ttlevsum < 508) {
                    warnings.push("<td>Unassigned EVs</td><td>Property '"+html_escape(x)+"'; set "+sid+": This Pokemon could have more EVs.</td>");
                }
            }
        }
        else {
            var csets = checkfile[x];
            var cavailable = [];
            for (var ct in csets) {
                if (typeof csets[ct] !== "string") {
                    if (typeof csets[ct] === "object") {
                        cavailable.push(csets[ct].set);
                    }
                    else {
                        errors.push("<td>Bad set</td><td>Property '"+html_escape(x)+"'; array elements must be 39 character alphanumeric strings or objects with a 39 char set property</td>");
                    }
                    continue;
                }
                else {
                    cavailable.push(csets[ct]);
                }
            }
            for (var k in cavailable) {
                var set = cavailable[k];
                if (set.length != 39) {
                    errors.push("<td>Bad set</td><td>Property '"+html_escape(x)+"'; array elements must be 39 character alphanumeric strings</td>");
                    continue;
                }
                var ctestprop = {
                    'poke': sys.pokemon(toNumber(set.substr(0,2))+65536*toNumber(set.substr(2,1))),
                    'nature': sys.nature(toNumber(set.substr(3,1))),
                    'ability': sys.ability(toNumber(set.substr(4,2))),
                    'item': sys.item(toNumber(set.substr(6,3))),
                    'level': toNumber(set.substr(9,2)),
                    'moves': [sys.move(toNumber(set.substr(11,2))),sys.move(toNumber(set.substr(13,2))),sys.move(toNumber(set.substr(15,2))),sys.move(toNumber(set.substr(17,2)))],
                    'evs': [toNumber(set.substr(19,2)),toNumber(set.substr(21,2)),toNumber(set.substr(23,2)),toNumber(set.substr(25,2)),toNumber(set.substr(27,2)),toNumber(set.substr(29,2))],
                    'dvs': [toNumber(set.substr(31,1)),toNumber(set.substr(32,1)),toNumber(set.substr(33,1)),toNumber(set.substr(34,1)),toNumber(set.substr(35,1)),toNumber(set.substr(36,1))]
                };
                if (ctestprop.poke === sys.pokemon(0) || ctestprop.poke === undefined) {
                    errors.push("<td>Missing Poke</td><td>Property '"+html_escape(x)+"'; set "+set+": Pokemon detected was Missingno.</td>");
                }
                if (ctestprop.level < 1 || ctestprop.level > 100) {
                    errors.push("<td>Level out of range</td><td>Property '"+html_escape(x)+"'; set "+set+": level must be an integer between 1 and 100 (inclusive)</td>");
                }
                if (ctestprop.item === sys.item(0) || ctestprop.item === undefined) {
                    warnings.push("<td>Missing Item</td><td>Property '"+html_escape(x)+"'; set "+set+": Not holding an item.</td>");
                }
                if (ctestprop.nature === undefined) {
                    errors.push("<td>Invalid Nature</td><td>Property '"+html_escape(x)+"'; set "+set+": This set has an invalid nature.</td>");
                }
                if ([sys.nature(0), sys.nature(6), sys.nature(12), sys.nature(18), sys.nature(24)].indexOf(ctestprop.nature) > -1) {
                    suggestions.push("<td>Neutral Nature?</td><td>Property '"+html_escape(x)+"'; set "+set+": This set has a Neutral Nature (may not be what you intend).</td>");
                }
                var cnummoves = 0;
                for (var cm = 0; cm < 4; cm++) {
                    if (ctestprop.moves[cm] === sys.move(0) || ctestprop.moves[cm] === undefined) {
                        warnings.push("<td>Missing Move</td><td>Property '"+html_escape(x)+"'; set "+set+": Moveslot "+(cm+1)+" is empty.</td>");
                    }
                    else {
                        cnummoves += 1;
                    }
                }
                if (cnummoves === 0) {
                    errors.push("<td>No Moves</td><td>Property '"+html_escape(x)+"'; set "+set+": Pokemon has no moves.</td>");
                }
                var cttlevsum = 0;
                for (var ce in ctestprop.evs) {
                    if (typeof ctestprop.evs[ce] !== "number" || ctestprop.evs[ce] < 0 || ctestprop.evs[ce] > 255) {
                        errors.push("<td>Bad EV Amount</td><td>Property '"+html_escape(x)+"'; set "+set+"; stat "+stats[ce]+" : EVs must be integers between 0 and 255 inclusive.</td>");
                    }
                    else if (ctestprop.evs[ce]%4 !== 0) {
                        warnings.push("<td>Wasted EVs</td><td>Property '"+html_escape(x)+"'; set "+set+": EVs for "+stats[ce]+" are wasted. (Use a multiple of 4)</td>");
                        cttlevsum += ctestprop.evs[ce];
                    }
                    else {
                        cttlevsum += ctestprop.evs[ce];
                    }
                }
                if (cttlevsum > 510) {
                    errors.push("<td>Too many EVs</td><td>Property '"+html_escape(x)+"'; set "+set+"; maximum sum of EVs must not exceed 510.</td>");
                }
                else if (cttlevsum < 508) {
                    warnings.push("<td>Unassigned EVs</td><td>Property '"+html_escape(x)+"'; set "+set+": This Pokemon could have more EVs.</td>");
                }
                for (var cd in ctestprop.dvs) {
                    if (typeof ctestprop.dvs[cd] !== "number" || ctestprop.dvs[cd] < 0 || ctestprop.dvs[cd] > 31) {
                        errors.push("<td>Bad EV Amount</td><td>Property '"+html_escape(x)+"'; set "+set+"; stat "+stats[cd]+" : IVs must be integers between 0 and 31 inclusive.</td>");
                    }
                }
            }
        }
    }
    if (errors.length > 100) {
        errors = errors.slice(0,100);
        errors.push("<td>TOO MANY ERRORS</td><td>There are more than 100 errors in this file.</td>");
    }
    if (warnings.length > 100) {
        warnings = warnings.slice(0,100);
        errors.push("<td>TOO MANY WARNINGS</td><td>There are more than 100 warnings in this file.</td>");
    }
    return {'errors': errors, 'warnings': warnings, 'suggestions': suggestions};
}

function getReadablePoke(set) {
    if (set.length != 39) {
        throw "Invalid Set, each set should be 39 alphanumeric characters long.";
    }
    var info = {
        'poke': sys.pokemon(toNumber(set.substr(0,2))+65536*toNumber(set.substr(2,1))),
        'species': sys.pokemon(toNumber(set.substr(0,2))),
        'nature': sys.nature(toNumber(set.substr(3,1))),
        'ability': sys.ability(toNumber(set.substr(4,2))),
        'item': sys.item(toNumber(set.substr(6,3))),
        'level': toNumber(set.substr(9,2)),
        'moves': [sys.move(toNumber(set.substr(11,2))),sys.move(toNumber(set.substr(13,2))),sys.move(toNumber(set.substr(15,2))),sys.move(toNumber(set.substr(17,2)))],
        'evs': [toNumber(set.substr(19,2)),toNumber(set.substr(21,2)),toNumber(set.substr(23,2)),toNumber(set.substr(25,2)),toNumber(set.substr(27,2)),toNumber(set.substr(29,2))],
        'dvs': [toNumber(set.substr(31,1)),toNumber(set.substr(32,1)),toNumber(set.substr(33,1)),toNumber(set.substr(34,1)),toNumber(set.substr(35,1)),toNumber(set.substr(36,1))],
        'gen': sys.generation(toNumber(set.substr(37,1)),toNumber(set.substr(38,1)))
    };
    var stats = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
    var msg = [set, info.poke+" @ "+info.item];
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
    var statlist = [];
    var pokeinfo = sys.pokeBaseStats(sys.pokeNum(info.poke));
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
    msg.push("Stats: "+statlist.join(" / "), "Generation: "+info.gen);
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
    };
    return naturetable[nature];
}

// This gets the stats for a Pokemon
function getStats(src, teamLo, teamHi, poke) {
    var movelist = [];
    for (var m=0; m<4; m++) {
        var move = sys.teamPokeMove(src, teamLo, poke, m, teamHi);
        movelist.push(sys.move(move));
    }
    var evlist = [];
    for (var e=0; e<6; e++) {
        var ev = sys.teamPokeEV(src, teamLo, poke, e, teamHi);
        evlist.push(ev);
    }
    var dvlist = [];
    for (var d=0; d<6; d++) {
        var dv = sys.teamPokeDV(src, teamLo, poke, d, teamHi);
        dvlist.push(dv);
    }
    var info = {
        'poke': sys.pokemon(sys.teamPoke(src,teamLo,poke,teamHi)),
        'species': sys.pokemon(sys.teamPoke(src,teamLo,poke,teamHi)%65536),
        'nature': sys.nature(sys.teamPokeNature(src,teamLo,poke,teamHi)),
        'ability': sys.ability(sys.teamPokeAbility(src,teamLo,poke,teamHi)),
        'item': sys.item(sys.teamPokeItem(src,teamLo,poke,teamHi)),
        'level': sys.teamPokeLevel(src,teamLo,poke,teamHi),
        'moves': movelist,
        'evs': evlist,
        'dvs': dvlist
    };
    var stats = ["HP", "Attack", "Defense", "Sp.Atk", "Sp.Def", "Speed"];
    var statlist = [];
    var pokeinfo = sys.pokeBaseStats(sys.teamPoke(src,teamLo,poke,teamHi));
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
    var msg = [];
    msg.push(info.poke+" @ "+info.item+"; Ability: "+info.ability+"; "+info.nature+" Nature; Level "+info.level);
    msg.push(info.moves.join(" / "),"Stats: "+statlist.join(" / "));
    return msg;
}

function generateTeam(src, teamLo, teamHi, mode) {
    try {
        var pokedata = bfSets.hasOwnProperty(mode) ? bfSets[mode] : bfSets.preset;
        var teaminfo = [];
        var pokearray = [];
        var readable = isReadable(pokedata);
        var maxPerfectIVs = 6;
        for (var x in pokedata) {
            if (typeof pokedata[x] == "object") {
                pokearray.push(x);
            }
        }
        if (pokedata.hasOwnProperty("perfectivs")) {
            if (typeof pokedata.perfectivs == "number" && pokedata.perfectivs >= 0 && pokedata.perfectivs <= 6) {
                maxPerfectIVs = pokedata.perfectivs;
            }
        }
        for (var p=0;p<6;p++) {
            if (pokearray.length === 0) {
                bfbot.sendAll("Team file was empty or corrupt, could not import.", staffchannel);
                return;
            }
            var pokes = pokearray.splice(sys.rand(0, pokearray.length),1);
            var sets = pokedata[pokes];
            if (readable) {
                var available = [];
                for (var t in sets) {
                    available.push(sets[t]);
                }
                var prop = available[sys.rand(0, available.length)];
                teaminfo[p] = {
                    'poke': sys.pokeNum(prop.poke),
                    'nature': sys.natureNum(prop.nature),
                    'ability': sys.abilityNum(prop.ability),
                    'item': sys.itemNum(prop.item),
                    'level': prop.level,
                    'moves': [sys.moveNum(prop.moves[0]),sys.moveNum(prop.moves[1]),sys.moveNum(prop.moves[2]),sys.moveNum(prop.moves[3])],
                    'evs': prop.evs,
                    'dvs': prop.dvs
                };
            }
            else {
                var set = sets[sys.rand(0, sets.length)];
                var actualset = "";
                if (typeof set == "object") {
                    actualset = set.set;
                }
                else {
                    actualset = set;
                }
                teaminfo[p] = {
                    'poke': toNumber(actualset.substr(0,2))+65536*toNumber(actualset.substr(2,1)),
                    'nature': toNumber(actualset.substr(3,1)),
                    'ability': toNumber(actualset.substr(4,2)),
                    'item': toNumber(actualset.substr(6,3)),
                    'level': toNumber(actualset.substr(9,2)),
                    'moves': [toNumber(actualset.substr(11,2)),toNumber(actualset.substr(13,2)),toNumber(actualset.substr(15,2)),toNumber(actualset.substr(17,2))],
                    'evs': [toNumber(actualset.substr(19,2)),toNumber(actualset.substr(21,2)),toNumber(actualset.substr(23,2)),toNumber(actualset.substr(25,2)),toNumber(actualset.substr(27,2)),toNumber(actualset.substr(29,2))],
                    'dvs': [toNumber(actualset.substr(31,1)),toNumber(actualset.substr(32,1)),toNumber(actualset.substr(33,1)),toNumber(actualset.substr(34,1)),toNumber(actualset.substr(35,1)),toNumber(actualset.substr(36,1))]
                };
            }
        }
        var ivprioritise = [5,1,3,2,4,0];
        var sortalgorithm = function (a,b) {
                if (pdata.dvs[b.stat] === 0 || pdata.dvs[a.stat] === 0) {
                    return a.value-b.value;
                }
                else if (b.value !== a.value) {
                    return b.value-a.value;
                }
                else {
                    return ivprioritise.indexOf(a.stat) - ivprioritise.indexOf(b.stat);
                }
            };
        for (var s=0;s<6;s++) {
            var pdata = teaminfo[s];
            sys.changePokeNum(src,teamLo,s,pdata.poke,teamHi);
            sys.changePokeName(src,teamLo,s,sys.pokemon(pdata.poke),teamHi);
            sys.changePokeNature(src,teamLo,s,pdata.nature,teamHi);
            sys.changePokeAbility(src,teamLo,s,pdata.ability,teamHi);
            sys.changePokeItem(src,teamLo,s,pdata.item,teamHi);
            var newmoves = shuffle(pdata.moves);
            for (var m=0;m<4;m++) {
                sys.changePokeMove(src,teamLo,s,m,newmoves[m],teamHi);
            }
            for (var c=0;c<6;c++) {
                sys.changeTeamPokeEV(src,teamLo,s,c,0,teamHi); // this resets the EV count
            }
            for (var e=0;e<6;e++) {
                sys.changeTeamPokeEV(src,teamLo,s,e,pdata.evs[e],teamHi);
            }
            var keptIVs = [];
            var EVlist = [];
            for (var l=0; l<6; l++) {
                EVlist.push({'stat': l, 'value': pdata.evs[l]});
            }
           
            EVlist.sort(sortalgorithm);
            keptIVs = [];
            for (var k=0; k<maxPerfectIVs; k++) {
                keptIVs.push(EVlist[k].stat);
            }
            for (var d=0;d<6;d++) {
                if (keptIVs.indexOf(d) > -1) {
                    sys.changeTeamPokeDV(src,teamLo,s,d,pdata.dvs[d],teamHi);
                }
                else {
                    sys.changeTeamPokeDV(src,teamLo,s,d,sys.rand(0,32),teamHi);
                }
            }
            var happiness = sys.rand(0,256);
            // maximise happiness if the poke has Return, minmise if it has frustration
            if (sys.hasTeamPokeMove(src, teamLo, s, sys.moveNum('Return'), teamHi)) {
                happiness = 255;
            }
            else if (sys.hasTeamPokeMove(src, teamLo, s, sys.moveNum('Frustration'), teamHi)) {
                happiness = 0;
            }
            sys.changePokeHappiness(src,teamLo,s,happiness,teamHi);
            var shinechance = 8192;
            if (sys.ladderRating(src, "Battle Factory") !== undefined) {
                shinechance = Math.ceil(8192 * 1000000 / Math.pow(sys.ladderRating(src, "Battle Factory"), 2));
            }
            sys.changePokeShine(src, teamLo, s, sys.rand(0,shinechance) === 0 ? true : false, teamHi);
            var possiblegenders = sys.pokeGenders(pdata.poke);
            var newgender = 0;
            if (possiblegenders.hasOwnProperty("neutral")) {
                newgender = 0;
            }
            else if (possiblegenders.hasOwnProperty("male")) {
                var rand = Math.random()*100;
                if (rand > possiblegenders.male) {
                    newgender = 2;
                }
                else {
                    newgender = 1;
                }
            }
            else {
                newgender = 2;
            }
            sys.changePokeGender(src,teamLo,s,newgender,teamHi);
            sys.changePokeLevel(src,teamLo,s,pdata.level,teamHi);
        }
        sys.updatePlayer(src);
        return;
    }
    catch (err) {
        bfbot.sendMessage(src, "Team file was empty or corrupt, could not generate a team. Please report this issue on forums. [Error: "+err+"]");
        throw "Corrupt Team File: "+err;
    }
}

// tfile is a json object

function numPokes(tfile) {
    var tteams = 0;
    for (var t in tfile) {
        if (typeof tfile[t] != "object") {
            continue;
        }
        tteams += 1;
    }
    return tteams;
}

// Valid Packs
function validPacks() {
    var packs = 0;
    for (var x in bfHash) {
        if (bfHash[x].enabled && bfHash[x].active) {
            packs += 1;
        }
    }
    return packs;
}

function isReviewAdmin(src) {
    return sys.auth(src) >= 3 || SESSION.channels(reviewChannel).isChannelAdmin(src);
}

function isGlobalReviewer(src) {
    return SESSION.channels(reviewChannel).isChannelOperator(src);
}

function isReviewer(src) {
    if (sys.auth(src) >= 3 || isReviewAdmin(src) || isGlobalReviewer(src)) {
        return true;
    }
    for (var r in reviewers) {
        var tierrev = reviewers[r];
        for (var x in tierrev) {
            if (sys.name(src).toLowerCase() === tierrev[x].toLowerCase()) {
                return true;
            }
        }
    }
    return false;
}

function isTierReviewer(src, tier) {
    if (!reviewers.hasOwnProperty(tier)) {
        return false;
    }
    if (isGlobalReviewer(src)) {
        return true;
    }
    var tierrev = reviewers[tier];
    if (isReviewer(src)) {
        for (var x in tierrev) {
            if (sys.name(src).toLowerCase() === tierrev[x].toLowerCase()) {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    handleCommand: function (src, message, channel) {
        var command, commandData = "", split = message.indexOf(" ");
        if (split !== -1) {
            command = message.substring(0, split).toLowerCase();
            commandData = message.substr(split + 1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (isReviewer(src) || ["bfversion", "submitsets", "viewpacks", "reviewers", "backlog", "pokecode", "pokesets", "pokeslist"].indexOf(command) > -1) {
            if (["acceptset", "rejectset", "deleteset", "checkqueue", "nextset"].indexOf(command) > -1 && channel !== reviewChannel) {
                bfbot.sendMessage(src, "These commands will only work in the #BF Review Channel!", channel);
                return true;
            }
            if (["submitban", "submitunban", "submitbans", "scansets"].indexOf(command) > -1 && sys.auth(src) < 1) {
                bfbot.sendMessage(src, "You can't use this command!", channel);
                return true;
            }
            if (["updateteams", "addpack", "updatepack", "deletepack", "enablepack", "disablepack", "addreviewer", "removereviewer", "addtier", "resetladder", "destroyreview", "importold", "forcestart"].indexOf(command) > -1 && !isReviewAdmin(src)) {
                bfbot.sendMessage(src, "You can't use this command!", channel);
                return true;
            }
            if (factoryCommand(src, command, commandData, channel) !== "no command") {
                return true;
            }
        }
        return false;
    },
    stepEvent : function() {
        if ((+sys.time())%saveInterval === 0) {
            autoSave("all", "");
            bfbot.sendAll("Autosaved user generated sets.", reviewChannel);
        }
    },
    init: function() {
        try {
            initFactory();
        }
        catch (err) {
            sendChanAll("Error in starting battle factory: "+err, staffchannel);
            working = false;
        }
    },
    afterChannelJoin : function(player, chan) {
        if (chan === sys.channelId('BF Review') && isReviewer(player)) {
            for (var x in userQueue) {
                if (isTierReviewer(player, x) && userQueue[x].length > 0) {
                    sendQueueItem(player, 0, x);
                }
            }
        }
        if (reviewChannel != sys.channelId("BF Review")) {
            reviewChannel = sys.channelId("BF Review");
        }
    },
    beforeChallengeIssued : function(source, dest, clauses, rated, mode, team, destTier) {
        if (isInBFTier(source, team) && isBFTier(destTier) && (!working || validPacks() === 0)) {
            sys.sendMessage(source, "Battle Factory is not working, so you can't issue challenges in that tier.");
            return true;
        }
        return false;
    },
    beforeChangeTier: function(src, team, oldtier, newtier) { // This shouldn't be needed, but it's here in case
        if (isBFTier(newtier) && (!working || validPacks() === 0)) {
            sys.sendMessage(src, "Battle Factory is not working, so you can't move into that tier. (Your team is now in Challenge Cup.)");
            sys.changeTier(src, team, "Challenge Cup");
            return true;
        }
    },
    beforeBattleStarted: function(src, dest, rated, mode, srcteamLo, srcteamHi, destteamLo, destteamHi) {
        if (isInBFTier(src, srcteamLo, srcteamHi) && isInBFTier(dest, destteamLo, destteamHi)) {
            try {
                var allowedtypes = [];
                var suggestedtypes = [];
                for (var x in bfHash) {
                    if (bfHash[x].enabled && bfHash[x].active) {
                        allowedtypes.push(x);
                        if (bfSets[x].hasOwnProperty('mode')) {
                            var modes = ['Singles', 'Doubles', 'Triples'];
                            if (bfSets[x].mode == modes[mode]) {
                                suggestedtypes.push(x);
                                continue;
                            }
                        }
                        if (bfSets[x].hasOwnProperty('maxpokes')) {
                            if (bfSets[x].maxpokes == 6 && sys.tier(src, srcteamLo, srcteamHi) == sys.tier(dest, destteamLo, destteamHi) && sys.tier(src, srcteamLo, srcteamHi) == "Battle Factory 6v6") {
                                suggestedtypes.push(x);
                                continue;
                            }
                        }
                    }
                }
                if (allowedtypes.length === 0) {
                    throw "ERR404: Couldn't find the team files!";
                }
                var type = allowedtypes.length > 0 ? allowedtypes[sys.rand(0,allowedtypes.length)]: 'preset';
                if (suggestedtypes.length > 0) {
                    type = suggestedtypes[sys.rand(0,suggestedtypes.length)];
                }
                /*if (sys.tier(src, srcteam) == sys.tier(dest, destteam) && sys.tier(src, srcteam) == "Battle Factory") {
                    type = "preset";
                }*/
                generateTeam(src, srcteamLo, srcteamHi, type);
                generateTeam(dest, destteamLo, destteamHi, type);
                /*if (find_tier(type)) {
                    var k = 0;
                    var errsrc, errdest;
                    var srcteam = (srcteamHi << 32) + srcteamLo;
                    var destteam = (destteamHi << 32) + destteamLo;
                    while (!tier_checker.has_legal_team_for_tier(src, srcteam, type, true) || !tier_checker.has_legal_team_for_tier(dest, destteam, type, true)) { //for complex bans like SS+Drizzle
                        generateTeam(src, srcteamLo, srcteamHi, type);
                        generateTeam(dest, destteamLo, destteamHi, type);
                        errsrc = tier_checker.has_legal_team_for_tier(src, srcteam, type, true, true);
                        errdest = tier_checker.has_legal_team_for_tier(dest, destteam, type, true, true);
                        if(++k>100) throw "Cannot generate legal teams after 100 attempts in tier: " + type + (errsrc ? "(Last error: " + errsrc + ")" : errdest ? "(Last error: " + errdest + ")" : "!");
                        
                    }
                }*/
                dumpData(src, srcteamLo, srcteamHi);
                dumpData(dest, destteamLo, destteamHi);
            }
            catch (err) {
                sendChanAll("Error in generating teams: "+err, staffchannel);
            }
        }
    },
    onHelp: function(src, topic, channel) {
        var help = [];
        if (topic == "battlefactory") {
            var adminHelp = [
                "/addpack [name] ~ [url]: Downloads a Battle Factory Pack from the internet",
                "/updatepack [name] ~ [url]: Updates a Battle Factory Pack from the internet, loads from the last known URL if no URL is specified",
                "/deletepack [name]: Deletes a Battle Factory Pack",
                "/enablepack [name]: Allows a Battle Factory Pack to be used in 6v6",
                "/disablepack [name]: Disallows a Battle Factory Pack to be used in 6v6",
                "/addreviewer [name]:[tier]: Allows a user to review for that tier",
                "/removereviewer [name]:[tier]: Removes review powers for that user in that tier",
                "/addtier [tier]:[mode]: Adds a tier to review, mode is optional (Singles/Doubles/Triples)",
                "/updateteams: Update default teams from the web",
                "/forcestart: Allows to get battle factory working again, even after an error"
            ];
            var reviewHelp = [
                "/scansets [url/location]: Scan a set file for any critical errors (scans current if no file specified, /scanusersets scans the user sets)",
                "/checkqueue [tier]: Checks the current set in the queue for that tier",
                "/acceptset [tier]: Accepts the current set in the queue for that tier",
                "/rejectset [tier]: Rejects the current set in the queue for that tier",
                "/deleteset [tier]:[code]: Deletes a faulty set.",
                "/deletepoke [poke]:[tier]: Deletes a faulty Pokemon along with all its sets.",
                "/nextset: Goes to the next set in the queue",
                "/savesets: Saves user generated Battle Factory sets (use before updating/server downtime)",
                "/refresh: Refreshes a team pack (saves and checks if it's working)",
                "/submit[un]ban: [Un]bans players from submitting sets",
                "/submitbans: Views list of submit bans"
            ];
            var userHelp = [
                "/bfversion: Gives information about the battle factory",
                "/viewpacks: Views installed Battle Factory Packs",
                "/reviewers: Views the list of authorised reviewers",
                "/pokeslist [pack]: Views the list of installed Pokemon for that pack.",
                "/pokecode [alpha code]: Converts a code to readable format.",
                "/pokesets [poke]:[pack]: Gets the sets for that pokemon in a Battle Factory Pack in readable format",
                "/backlog: Views the queue length",
                "/submitsets [comment]: Submits your first team in teambuilder for the battle factory, in the tier that team is currently in. Comments are optional."
            ];
            if (isReviewAdmin(src)) {
                help = adminHelp.concat(reviewHelp, userHelp);
            }
            else if (isReviewer(src)) {
                help = reviewHelp.concat(userHelp);
            }
            else {
                help = userHelp;
            }
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
            return bfVersion;
        }
        else if (type == "team") {
            return "Default";
        }
        else {
            return "Invalid Type";
        }
    },
    generateTeam : function(src, teamLo, teamHi) {
        generateTeam(src, teamLo, teamHi, 'preset'); // generates a team for players with no pokes
        return true;
    },
    "help-string": ["battlefactory: To know the battlefactory commands"]
};
