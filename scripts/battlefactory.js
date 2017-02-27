/*
Battle Factory Program Script for Pokemon Online

Original coding by Shadowfist 2012
Maintenance by PO Scripters 2015

Requires bfteams.json to work.

Files: bfteams.json
*/

// Coding style: semicolons mandatory
/* jshint laxbreak: true, sub: true */
/* globals sendChanAll, bfbot, staffchannel, tier_checker, sendChanHtmlAll, sys, Config, SESSION, require, module */

// Globals
var bfVersion = "1.300";
var dataDir = "scriptdata/bfdata/";
var submitDir = dataDir + "submit/";
var bfSets, working, defaultSets, userQueue, reviewChannel, submitBans, bfHash, reviewers;
var utilities = require("utilities.js");
var saveInterval = 86400; // autosave every day
var battleFactoryTiers = ["Battle Factory", "Battle Factory 6v6"];
var lcTiers = [
    "RBY LC", "GSC LC", "Adv LC",
    "HGSS LC", "HGSS LC Ubers", "BW2 LC",
    "BW2 LC Ubers", "ORAS LC", "SM LC"
];

// Will escape "&", ">", and "<" symbols for HTML output.
var html_escape = utilities.html_escape;
var find_tier = utilities.find_tier;

startBF();

function initFactory() {
    reviewChannel = utilities.get_or_create_channel("BF Review");
    bfbot.sendAll("Version " + bfVersion + " of Battle Factory loaded successfully!", reviewChannel);
    working = true;
}

function startBF() {
    sys.makeDir(dataDir);
    sys.makeDir(submitDir);
    var file = sys.getFileContent(dataDir + "bfteams.json");
    if (typeof file === "undefined") {
        var url = Config.base_url + "bfdata/bfteams.json";
        sendReviewersAll("Teams file not found, fetching teams from " + url);
        sys.webCall(url, function (response) {
            if (response !== "") {
                try {
                    var parsedSets = JSON.parse(response);
                    var lintResults = setLint(parsedSets);
                    if (lintResults.errors.length > 0) {
                        throw "Bad File";
                    }
                    sys.writeToFile(dataDir + "bfteams.json", response);
                    defaultSets = parsedSets;
                    sendReviewersAll("Updated Battle Factory Teams!");
                } catch (err) {
                    sendStaff(err);
                    throw "Battle Factory web file is corrupt!";
                }
            } else {
                sendStaff("Failed to load teams!");
                throw "Couldn't load the Battle Factory file!";
            }
        });
    } else {
        defaultSets = JSON.parse(file);
    }
    try {
        userQueue = JSON.parse(sys.getFileContent(submitDir + "index.json"));
    } catch (e) {
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
    }
    try {
        bfHash = JSON.parse(sys.getFileContent(dataDir + "bfhash.json"));
    } catch (e) {
        // name, filepath, whether it is being actively used (human choice), whether it is enabled (automated)
        bfHash = {
            "preset": {
                "path": "bfteams.json",
                "active": true,
                "enabled": false,
                "url": Config.base_url + "bfdata/bfteams.json"
            }
        };
        sys.writeToFile(dataDir + "bfhash.json", JSON.stringify(bfHash));
    }
    var validSetPacks = 0;
    bfSets = {};
    for (var x in bfHash) {
        var teamPack = sys.getFileContent(dataDir + bfHash[x].path);
        if (typeof teamPack === "undefined") {
            createDefaultEntry(bfHash[x].path, x);
            bfSets[x] = {};
        } else {
            try {
                var teamFile = JSON.parse(teamPack);
                var lintResults = setLint(teamFile);
                if (lintResults.errors.length > 0) {
                    throw "Bad File";
                }
                bfSets[x] = teamFile;
                if (countPokes(x) < 12) {
                    throw "Not enough Pokemon";
                }
                bfHash[x].enabled = true;
                validSetPacks += 1;
            } catch (e) {
                sendReviewersAll("Set pack " + x + " is invalid: " + e);
                bfHash[x].enabled = false;
            }
        }
    }
    if (validSetPacks === 0) {
        sendStaff("No valid Battle Factory sets detected!");
        throw "No valid set packs available";
    }
}

function isInBFTier(src, team) {
    return battleFactoryTiers.indexOf(sys.tier(src, team)) > -1;
}

function isBFTier(tier) {
    return battleFactoryTiers.indexOf(tier) > -1;
}

function isLCTier(tier) {
    return lcTiers.indexOf(tier) > -1;
}

function createDefaultEntry(path, desc) {
    var pathName = dataDir + path;
    if (typeof sys.getFileContent(pathName) === "undefined") {
        sys.writeToFile(pathName, JSON.stringify({"desc": desc}));
        return true;
    }
    return false;
}

function createEntry(name, data, srcUrl) {
    var basePathName = "bfteams_" + (name.replace(/ /g, "")).toLowerCase() + ".json";
    if (!data.hasOwnProperty("desc")) {
        data.desc = name;
    }
    if (typeof sys.getFileContent(dataDir + basePathName) === "undefined") {
        sys.writeToFile(dataDir + basePathName, JSON.stringify(data));
        bfHash[name] = {
            "path": basePathName,
            "active": true,
            "enabled": true,
            "url": srcUrl
        };
        bfSets[name] = data;
        return true;
    }
    return false;
}

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

function dumpData(tar, team) {
    var sets = [];
    for (var b = 0; b < 6; b++) {
        sets.push(getPokePreview(tar, team, b));
    }
    var channels = sys.channelsOfPlayer(tar);
    if (sets.length > 0 && channels.length > 0) {
        var sendChannel = (sys.isInChannel(tar, 0) ? 0 : channels[0]);
        sys.sendHtmlMessage(tar, "<table border='2'><tr><td><pre>" + sets.join("<br/><br/>") + "</pre></td></tr></table>", sendChannel);
    }
}

// converts an alphanumeric set code to an object with the Pokemon's data
function pokeCodeToPokemon(pokeCode) {
    return {
        "poke": sys.pokemon(toNumber(pokeCode.substr(0, 2)) + 65536 * toNumber(pokeCode.substr(2, 1))),
        "pokeId": toNumber(pokeCode.substr(0, 2)) + 65536 * toNumber(pokeCode.substr(2, 1)),
        "speciesNum": toNumber(pokeCode.substr(0, 2)),
        "formNum": toNumber(pokeCode.substr(2, 1)),
        "species": sys.pokemon(toNumber(pokeCode.substr(0, 2))),
        "nature": sys.nature(toNumber(pokeCode.substr(3, 1))),
        "natureId": toNumber(pokeCode.substr(3, 1)),
        "natureInfo": getNature(sys.nature(toNumber(pokeCode.substr(3, 1)))),
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
                              toNumber(pokeCode.substr(38, 1))),
        "genNum": toNumber(pokeCode.substr(37, 1)),
        "subgenNum": toNumber(pokeCode.substr(38, 1)),
        "hiddenPowerType": pokeCode.length === 40 ? toNumber(pokeCode.substr(39, 1)) : 16
    };
}

function pokemonToPokeCode(pokemon) {
    var pokeCode = "";
    pokeCode += toChars(pokemon.pokeId % 65536, 2); // species
    pokeCode += toChars(Math.floor(pokemon.pokeId / 65536), 1); // form
    pokeCode += toChars(pokemon.natureId, 1);
    pokeCode += toChars(pokemon.abilityId, 2);
    pokeCode += toChars(pokemon.itemId, 3);
    pokeCode += toChars(pokemon.level, 2);
    for (var m = 0; m < 4; m++) {
        pokeCode += toChars(pokemon.moveIds[m], 2);
    }
    for (var e = 0; e < 6; e++) {
        pokeCode += toChars(pokemon.evs[e], 2);
    }
    for (var d = 0; d < 6; d++) {
        pokeCode += toChars(pokemon.dvs[d], 1);
    }
    pokeCode += toChars(pokemon.genNum, 1) + toChars(pokemon.subgenNum, 1);
    pokeCode += toChars(pokemon.hiddenPowerType, 1);
    return pokeCode;
}

// Tests for exact same sets, if exact is selected arr elements must be in correct order and match
function hasSameElements(arr1, arr2, exact) {
    if (arr1.length !== arr2.length) {
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
    // sometimes we can save some time just using already parsed objects
    // instead of alphanumeric codes.
    var poke1 = typeof code1 === "object" ? code1 : pokeCodeToPokemon(code1);
    var poke2 = typeof code2 === "object" ? code2 : pokeCodeToPokemon(code2);
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
                sendStaff("The " + key + " pack is missing!");
                throw "File not found";
            }
            bfSets[key] = JSON.parse(file);
            var message = [];
            var teamFile = bfSets[key];
            if (teamFile.hasOwnProperty("desc")) {
                message.push("Successfully loaded the " + teamFile.desc + " pack!");
                bfHash[key].enabled = true;
            } else {
                message.push("Successfully loaded the " + key + " pack!");
            }
            var totalPokes = countPokes(key);
            var totalSets = countSets(key);
            if (totalPokes < 12) {
                message.push("Not enough Pokemon in the " + key + " pack!");
                bfHash[key].enabled = false;
            } else {
                bfHash[key].enabled = true;
            }
            message.push("Total: " + totalPokes + " Pokemon and " + totalSets + (totalSets > 1 ? " sets." : " set."));
            if (message.length > 0) {
                sendReviewersAll(message.join("; "));
            }
        }
    } catch (err) {
        sendStaff("Couldn't refresh teams: " + err);
    }
}

function cleanEntries() {
    var deleted = 0;
    function entryCleaner(set) {
        return (typeof set === "object" && set !== null
                && set.hasOwnProperty("ip")
                && set.hasOwnProperty("name")
                && set.hasOwnProperty("sets")
                && set.hasOwnProperty("tier")
                && set.hasOwnProperty("comment")
                && set.hasOwnProperty("rating"));
    }
    for (var tier in userQueue) {
        var initialLength = userQueue[tier].length;
        userQueue[tier] = userQueue[tier].filter(entryCleaner);
        deleted += initialLength - userQueue[tier].length;
    }
    if (deleted > 0) {
        sendReviewersAll("Invalid Entries Removed: " + deleted);
    }
}

function setIsDuplicate(setCode, tier) {
    var checkSet = pokeCodeToPokemon(setCode);
    var pokeNum = checkSet.speciesNum;
    if (bfSets[tier].hasOwnProperty(pokeNum) && bfSets[tier][pokeNum].length > 0) {
        for (var i = 0; i < bfSets[tier][pokeNum].length; i++) {
            var currentSetCode = typeof bfSets[tier][pokeNum][i] === "object" ? bfSets[tier][pokeNum][i].set : bfSets[tier][pokeNum][i];
            if (isEquivalent(checkSet, currentSetCode)) {
                return true;
            }
        }
    }
    return false;
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
    var players = sys.playersOfChannel(reviewChannel);
    for (var i = 0; i < players.length; i++) {
        if (isTierReviewer(players[i], tier)) {
            if (html) {
                sys.sendHtmlMessage(players[i], message, reviewChannel);
            } else {
                bfbot.sendMessage(players[i], message, reviewChannel);
            }
        }
    }
}

function sendReviewersAll(message, html) {
    var players = sys.playersOfChannel(reviewChannel);
    for (var i = 0; i < players.length; i++) {
        if (sys.auth(players[i]) > 0 || isReviewer(players[i])) {
            if (html) {
                sys.sendHtmlMessage(players[i], message, reviewChannel);
            } else {
                bfbot.sendMessage(players[i], message, reviewChannel);
            }
        }
    }
}

function sendStaff(message) {
    var players = sys.playersOfChannel(reviewChannel);
    for (var i = 0; i < players.length; i++) {
        if (sys.auth(players[i]) > 0 || isReviewer(players[i])) {
            bfbot.sendMessage(players[i], message, reviewChannel);
        }
    }
    bfbot.sendAll(message, staffchannel);
}

function seeQueueItem(index, tier) {
    if (!userQueue.hasOwnProperty(tier)) {
        sendReviewers("Nothing in the " + tier + " queue.", tier, false);
    } else {
        var tierQueue = userQueue[tier];
        if (typeof tierQueue === "undefined" || index >= tierQueue.length || index < 0) {
            sendReviewers("Nothing in the " + tier + " queue" + (index === 0 ? "." : " at index " + index), tier, false);
        } else {
            cleanEntries();
            var submitInfo = tierQueue[0];
            sendReviewers("The " + tier + " queue length is currently " + tierQueue.length + ". The set for review is shown below.", tier, false);
            sys.sendAll("", reviewChannel);
            bfbot.sendAll("User: " + submitInfo.name, reviewChannel);
            bfbot.sendAll("Tier: " + submitInfo.tier, reviewChannel);
            var setString = submitInfo.sets.map(getReadablePoke).join("<br/><br/>");
            sys.sendHtmlAll("<table border='2'><tr><td><pre>" + setString + "</pre></td></tr></table>", reviewChannel);
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
        if (typeof tierQueue === "undefined" || index >= tierQueue.length || index < 0) {
            bfbot.sendMessage(src, "Nothing in the " + tier + " queue " + (index === 0 ? "." : " at index " + index), reviewChannel);
        } else {
            var submitInfo = tierQueue[0];
            bfbot.sendMessage(src, "The " + tier + " queue length is currently " + tierQueue.length + ". The set for review is shown below.", reviewChannel);
            sys.sendMessage(src, "", reviewChannel);
            bfbot.sendMessage(src, "User: " + submitInfo.name, reviewChannel);
            bfbot.sendMessage(src, "Tier: " + submitInfo.tier, reviewChannel);
            var setString = submitInfo.sets.map(getReadablePoke).join("<br/><br/>");
            sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>" + setString + "</pre></td></tr></table>", reviewChannel);
            sys.sendMessage(src, "", reviewChannel);
            if (submitInfo.comment !== "") {
                bfbot.sendMessage(src, "Comment: " + submitInfo.comment, reviewChannel);
            }
            bfbot.sendMessage(src, "Use /acceptset " + tier + " to accept this submission, /rejectset " + tier + " to reject it, or /nextset " + tier + " to view the next and come back to this later.", reviewChannel);
        }
    }
}

function find_pack(packName) {
    if (packName) {
        return packName.toLowerCase() === "preset" ? "preset" : find_tier(packName);
    }
    return null;
}

function factoryCommand(src, command, commandData, channel) {
    var args = [];
    var tier;
    var url;
    if (command === "updateteams") {
        url = Config.base_url + dataDir + "bfteams.json";
        bfbot.sendMessage(src, "Fetching teams from " + url + ".", channel);
        sys.webCall(url, function(response) {
            if (response !== "") {
                try {
                    var parsedSets = JSON.parse(response);
                    var lintResults = setLint(parsedSets);
                    printLintResults(src, lintResults, channel);
                    if (lintResults.errors.length > 0) {
                        throw "Bad File";
                    }
                    sys.writeToFile(dataDir + "bfteams.json", response);
                    autoSave("teams", "preset");
                    bfbot.sendMessage(src, "Updated Battle Factory teams!", channel);
                    refresh("preset");
                } catch (err) {
                    bfbot.sendMessage(src, "Error in parsing teams!", channel);
                }
            } else {
                bfbot.sendMessage(src, "Could not retrieve teams!", channel);
            }
        });
    } else if (command === "addtier") {
        args = commandData.split(":");
        tier = find_tier(args[0]);
        if (args.length > 2) {
            bfbot.sendMessage(src, "Usage: /addtier [tier]:[mode]", channel);
        } else if (tier === null) {
            bfbot.sendMessage(src, "Please specify a valid tier.", channel);
        } else if (bfHash.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "A Battle Factory pack already exists for this tier!", channel);
        } else {
            var template = {
                "desc": tier
            };
            if (args.length === 2) {
                template.mode = args[1];
            } else {
                template.mode = "Singles";
            }
            createEntry(tier, template, "No URL for addtier");
            autoSave("teams", tier);
            refresh(tier);
            reviewers[tier] = [];
            userQueue[tier] = [];
            sys.writeToFile(submitDir + "reviewers.json", JSON.stringify(reviewers));
            bfbot.sendMessage(src, "Added the tier " + tier + "!", channel);
        }
    } else if (command === "addpack") {
        args = commandData.split(" ~ ");
        if (args.length !== 2) {
            bfbot.sendMessage(src, "Usage: /addpack [pack] ~ [url]", channel);
        } else if (args[0] === "") {
            bfbot.sendMessage(src, "Please specify a valid pack.", channel);
        } else if (args[1].indexOf("http://") !== 0 && args[1].indexOf("https://") !== 0) {
            bfbot.sendMessage(src, "Please specify a valid URL to update from.", channel);
        } else {
            bfbot.sendMessage(src, "Fetching teams from " + args[1], channel);
            sys.webCall(args[1], function(response) {
                if (response !== "") {
                    try {
                        var parsedSets = JSON.parse(response);
                        var lintResults = setLint(parsedSets);
                        printLintResults(src, lintResults, channel);
                        if (lintResults.errors.length > 0) {
                            throw "Bad File";
                        }
                        if (createEntry(args[0], parsedSets, args[1])) {
                            autoSave("teams", args[0]);
                            bfbot.sendMessage(src, "Added the team pack " + args[0] + "!", channel);
                            refresh(args[0]);
                        } else {
                            bfbot.sendMessage(src, "A pack with that name already exists!", channel);
                        }
                    } catch (err) {
                        bfbot.sendMessage(src, "Error in parsing teams!", channel);
                    }
                } else {
                    bfbot.sendMessage(src, "Could not retrieve teams!", channel);
                }
            });
        }
    } else if (command === "updatepack") {
        args = commandData.split(" ~ ");
        tier = find_pack(args[0]);
        if (args.length > 2) {
            bfbot.sendMessage(src, "Usage: /updatepack [pack] ~ [url]", channel);
        } else if (!bfHash.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Please specify a valid pack to update.", channel);
        } else if (args[1].indexOf("http://") !== 0 && args[1].indexOf("https://") !== 0) {
            bfbot.sendMessage(src, "Invalid URL!", channel);
        } else {
            if (args.length === 1 && bfHash[tier].hasOwnProperty("url")) {
                url = bfHash[tier].url;
            } else {
                url = args[1];
            }
            bfbot.sendMessage(src, "Updating " + tier + " teams from " + url, channel);
            sys.webCall(url, function(response) {
                if (response !== "") {
                    try {
                        var parsedSets = JSON.parse(response);
                        var lintResults = setLint(parsedSets);
                        printLintResults(src, lintResults, channel);
                        if (lintResults.errors.length > 0) {
                            throw "Bad File";
                        }
                        bfHash[tier].url = url;
                        sys.writeToFile(dataDir + bfHash[tier].path, JSON.stringify(parsedSets));
                        bfbot.sendMessage(src, "Updated " + tier + " Battle Factory Teams!", channel);
                        refresh(tier);
                        autoSave("teams", tier);
                    } catch (err) {
                        bfbot.sendMessage(src, "Error in parsing teams!", channel);
                    }
                } else {
                    bfbot.sendMessage(src, "Could not retrieve teams!", channel);
                }
            });
        }
    } else if (command === "deletepack") {
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /deletepack [pack]", channel);
        } else if (tier === "preset") {
            bfbot.sendMessage(src, "Can't remove the built in pack!", channel);
        } else if (!bfHash.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Please specify a valid team pack to remove!", channel);
        } else {
            sys.deleteFile(dataDir + bfHash[tier].path);
            delete bfHash[tier];
            delete bfSets[tier];
            if (reviewers.hasOwnProperty(tier)) {
                delete reviewers[tier];
                sys.writeToFile(submitDir + "reviewers.json", JSON.stringify(reviewers));
            }
            bfbot.sendMessage(src, "Removed the team pack " + tier + "!", channel);
            autoSave("teams", "");
        }
    } else if (command === "disablepack") {
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /disablepack [pack]", channel);
        } else if (!bfHash.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Please specify a valid team pack to disable.", channel);
        } else if (!bfHash[tier].active) {
            bfbot.sendMessage(src, "This pack is already disabled!", channel);
        } else {
            bfHash[tier].active = false;
            bfbot.sendMessage(src, "Disabled the pack: " + tier, channel);
            autoSave("teams", "");
        }
    } else if (command === "enablepack") {
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /enablepack [pack]", channel);
        } else if (!bfHash.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Please specify a valid team pack to enable.", channel);
        } else if (bfHash[tier].active) {
            bfbot.sendMessage(src, "This pack is already enabled!", channel);
        } else {
            bfHash[tier].active = true;
            bfbot.sendMessage(src, "Enabled the pack: " + tier, channel);
            autoSave("teams", "");
        }
    } else if (command === "pokeslist") {
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /pokeslist [tier]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "That is not a valid tier!", channel);
        } else {
            var totalSets = 0;
            for (var poke in bfSets[tier]) {
                if (typeof bfSets[tier][poke] === "object") {
                    var pokeName = sys.pokemon(parseInt(poke, 10));
                    var pokeSets = countSets(tier, parseInt(poke, 10));
                    totalSets += pokeSets;
                    bfbot.sendMessage(src, pokeName + ": " + pokeSets + (pokeSets > 1 ? " sets" : " set"), channel);
                }
            }
            bfbot.sendMessage(src, "", channel);
            bfbot.sendMessage(src, tier + " totals " + countPokes(tier) + " Pokemon and " + totalSets + (totalSets > 1 ? " sets." : " set."), channel);
        }
    } else if (command === "pokecode") {
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /pokecode [code]", channel);
        } else {
            try {
                var msg = getReadablePoke(commandData);
                sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>" + msg + "</pre></td></tr></table>", channel);
            } catch (err) {
                bfbot.sendMessage(src, "Invalid Code: " + err, channel);
            }
        }
    } else if (command === "refresh") {
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /refresh [pack]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "No such pack exists!", channel);
        } else {
            autoSave("teams", tier);
            refresh(tier);
            bfbot.sendMessage(src, "Refreshed the " + tier + " pack!", channel);
        }
    } else if (command === "loadfromfile") {
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /loadfromfile [pack]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "No such pack exists!", channel);
        } else {
            refresh(tier);
            bfbot.sendMessage(src, "Loaded the " + tier + " pack.", channel);
        }
    } else if (command === "pokesets") {
        args = commandData.split(":");
        var pokeId = sys.pokeNum(args[0]) % 65536;
        tier = find_pack(args[1]);
        if (args.length !== 2) {
            bfbot.sendMessage(src, "Usage: /pokesets [poke]:[tier]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "That is not a valid tier!", channel);
        } else if (!bfSets[tier].hasOwnProperty(pokeId)) {
            bfbot.sendMessage(src, "No sets exist for that Pokemon.", channel);
        } else {
            var sets = bfSets[tier][pokeId].map(function(set) {
                if (typeof set === "object") {
                    return (getReadablePoke(set.set)
                            + "<br />Submitted By: " + html_escape(set.submitter)
                            + "<br />Accepted By: " + html_escape(set.auth));
                }
                return getReadablePoke(set);
            });
            if (sets.length > 0) {
                sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>" + sets.join("<br/><br/>") + "</pre></td></tr></table>", channel);
            }
        }
    } else if (command === "scansets") {
        var lintResults = {};
        var checkFile;
        if (commandData.indexOf("http://") === 0 || commandData.indexOf("https://") === 0) {
            bfbot.sendMessage(src, "Fetching teams from " + commandData + " for checking.", channel);
            sys.webCall(commandData, function(response) {
                try {
                    if (response === "") {
                        throw "Web file not found: Invalid URL or web functions are not working.";
                    }
                    checkFile = JSON.parse(response);
                    lintResults = setLint(checkFile);
                } catch (error) {
                    lintResults = {
                        "errors": ["<td>Error: " + html_escape(error + "") + "</td>"],
                        "warnings": [],
                        "suggestions": []
                    };
                }
                printLintResults(src, lintResults, channel);
            });
        } else {
            try {
                var fileName = "bfteams.json";
                if (commandData !== "") {
                    fileName = commandData;
                }
                var content = sys.getFileContent(dataDir + fileName);
                if (typeof content === "undefined") {
                    throw "Invalid File Path: The file '" + fileName + "' does not exist or could not be accessed";
                }
                checkFile = JSON.parse(content);
                lintResults = setLint(checkFile);
            } catch (error) {
                lintResults = {
                    "errors": ["<td>Error: " + html_escape(error + "") + "</td>"],
                    "warnings": [],
                    "suggestions": []
                };
            }
            printLintResults(src, lintResults, channel);
        }
    } else if (command === "bfversion") {
        bfbot.sendMessage(src, "Battle Factory v" + bfVersion, channel);
    } else if (command === "viewpacks") {
        var table = "<table><tr><th colspan=4>Battle Factory Packs</th></tr><tr><th>Name</th><th>Enabled</th><th>Working</th><th>URL</th></tr>";
        for (var h in bfHash) {
            table += "<tr><td>" + html_escape(h) + "</td>";
            table += "<td>" + (bfHash[h].active ? "Yes" : "No") + "</td>";
            table += "<td>" + (bfHash[h].enabled ? "Yes" : "No") + "</td>";
            table += "<td>" + (bfHash[h].hasOwnProperty("url") ? "<a href=" + bfHash[h].url + ">" + html_escape(bfHash[h].url) + "</a>" : "Not Specified") + "</td></tr>";
        }
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
    } else if (command === "submitsets") {
        // This will export the first team to a submission queue
        cleanEntries(); // clean out any invalid entries
        var comment = commandData;
        tier = sys.tier(src, 0);
        if (!sys.dbRegistered(sys.name(src))) {
            bfbot.sendMessage(src, "You need to register to submit sets.", channel);
        } else if (submitBans.hasOwnProperty(sys.ip(src))) {
            bfbot.sendMessage(src, "You are banned from submitting sets!", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "No submissions are available for your tier!", channel);
        } else {
            var submissions = 0;
            for (var q in userQueue) {
                for (var i = 0; i < userQueue[q].length; i++) {
                    if (userQueue[q][i].ip === sys.ip(src) || userQueue[q][i].name === sys.name(src)) {
                        submissions += 1;
                    }
                }
            }
            var maxSubmissions = isReviewer(src) ? 100 : 15;
            if (!isReviewAdmin(src) && submissions >= maxSubmissions) {
                bfbot.sendMessage(src, "You already have " + maxSubmissions + " or more submissions in the queue, please wait until they get reviewed!", channel);
            } else {
                var team = [];
                for (var x = 0; x < 6; x++) {
                    if (sys.teamPoke(src, 0, x) !== 0) {
                        var moveIds = [];
                        for (var m = 0; m < 4; m++) {
                            moveIds.push(sys.teamPokeMove(src, 0, x, m));
                        }
                        var evs = [], dvs = [];
                        for (var s = 0; s < 6; s++) {
                            evs.push(sys.teamPokeEV(src, 0, x, s));
                            dvs.push(sys.teamPokeDV(src, 0, x, s));
                        }
                        var level = sys.teamPokeLevel(src, 0, x);
                        if (isLCTier(tier)) {
                            level = Math.min(5, level);
                        }
                        var pokeCode = pokemonToPokeCode({
                            "pokeId": sys.teamPoke(src, 0, x),
                            "natureId": sys.teamPokeNature(src, 0, x),
                            "abilityId": sys.teamPokeAbility(src, 0, x),
                            "itemId": sys.teamPokeItem(src, 0, x),
                            "level": level,
                            "moveIds": moveIds,
                            "evs": evs,
                            "dvs": dvs,
                            "genNum": sys.gen(src, 0),
                            "subgenNum": sys.subgen(src, 0),
                            "hiddenPowerType": sys.teamPokeHiddenPower(src, 0, x)
                        });
                        if (!setIsDuplicate(pokeCode, tier)) {
                            team.push({
                                "ip": sys.ip(src),
                                "name": sys.name(src),
                                "sets": [pokeCode],
                                "tier": tier,
                                "comment": comment,
                                "rating": 0
                            });
                        }
                    }
                }
                if (team.length === 0) {
                    if (setIsDuplicate(pokeCode, tier)) {
                        bfbot.sendMessage(src, "This set already exists in " + tier + ".");
                    } else {
                        bfbot.sendMessage(src, "You have no Pokemon that can be submitted!", channel);
                    }
                } else {
                    if (!userQueue.hasOwnProperty(tier)) {
                        userQueue[tier] = [];
                    }
                    userQueue[tier] = userQueue[tier].concat(team);
                    bfbot.sendMessage(src, "Submitted your sets. See your submission below.", channel);
                    bfbot.sendAll(sys.name(src) + " submitted some " + tier + " sets for Battle Factory.", reviewChannel);
                    var readableTeam = team.map(function(teamPoke) {
                        return getReadablePoke(teamPoke.sets[0]);
                    }).join("<br/><br/>");
                    sys.sendHtmlMessage(src, "<table border='2'><tr><td><pre>" + readableTeam + "</pre></td></tr></table>", channel);
                }
            }
        }
    } else if (command === "checkqueue") {
        tier = find_pack(commandData);
        if (!userQueue.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Usage: /checkqueue [tier]", channel);
        } else if (userQueue[tier].length === 0) {
            bfbot.sendMessage(src, "Nothing in the " + tier + " queue.", channel);
        } else {
            seeQueueItem(0, tier);
        }
    } else if (command === "acceptset") {
        tier = find_pack(commandData);
        if (!userQueue.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Usage: /acceptset [tier]", channel);
        } else if (userQueue[tier].length === 0) {
            bfbot.sendMessage(src, "Nothing in the " + tier + " queue.", channel);
        } else {
            var accept = userQueue[tier][0];
            if (!isTierReviewer(src, tier)) {
                bfbot.sendMessage(src, "You are not authorised to review " + tier + " sets.", channel);
            } else if (accept.ip === sys.ip(src) && !isReviewAdmin(src)) {
                bfbot.sendMessage(src, "Can't accept your own sets.", channel);
            } else {
                for (var a = 0; a < accept.sets.length; a++) {
                    var entry = {
                        "set": accept.sets[a],
                        "submitter": accept.name,
                        "auth": sys.name(src)
                    };
                    var species = toNumber(entry.set.substr(0, 2));
                    if (bfSets[tier].hasOwnProperty(species)) {
                        bfSets[tier][species].push(entry);
                    } else {
                        bfSets[tier][species] = [entry];
                    }
                }
                userQueue[tier].shift();
                bfbot.sendAll(accept.name + "'s submission was accepted by " + sys.name(src) + ".", reviewChannel);
                seeQueueItem(0, tier);
            }
        }
    } else if (command === "rejectset") {
        tier = find_pack(commandData);
        if (!userQueue.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Usage: /rejectset [tier]", channel);
        } else if (userQueue[tier].length === 0) {
            bfbot.sendMessage(src, "Nothing in the " + tier + " queue.", channel);
        } else if (!isTierReviewer(src, tier)) {
            bfbot.sendMessage(src, "You are not authorised to review " + tier + " sets.", channel);
        } else {
            bfbot.sendAll(userQueue[tier][0].name + "'s submission was rejected by " + sys.name(src) + ".", reviewChannel);
            userQueue[tier].shift();
            seeQueueItem(0, tier);
        }
    } else if (command === "nextset") {
        tier = find_pack(commandData);
        if (!userQueue.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "Usage: /nextset [tier]", channel);
        } else if (userQueue[tier].length === 0) {
            bfbot.sendMessage(src, "Nothing in the " + tier + " queue.", channel);
        } else {
            var shiftedSet = userQueue[tier].shift();
            userQueue[tier].push(shiftedSet);
            seeQueueItem(0, tier);
        }
    } else if (command === "savesets") {
        autoSave("all", "");
        bfbot.sendAll("Saved user generated sets!", channel);
    } else if (command === "deleteset") {
        args = commandData.split(":");
        tier = find_pack(args[0]);
        if (args.length !== 2) {
            bfbot.sendMessage(src, "Usage: /deleteset [tier]:[code]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "No such tier exists!", channel);
        } else if (!isTierReviewer(src, tier)) {
            bfbot.sendMessage(src, "You are not authorised to review " + tier + " sets.", channel);
        } else {
            var found = false;
            var deleteSetPack = bfSets[tier];
            for (var deleteSetPoke in deleteSetPack) {
                var deleteSets = deleteSetPack[deleteSetPoke];
                if (typeof deleteSets === "object") {
                    for (var j = 0; !found && j < deleteSets.length; j++) {
                        if (deleteSets[j] === args[1] || (typeof deleteSets[j] === "object" && deleteSets[j].set === args[1])) {
                            bfSets[tier][deleteSetPoke].splice(j, 1);
                            if (bfSets[tier][deleteSetPoke].length === 0) {
                                delete bfSets[tier][deleteSetPoke];
                            }
                            found = true;
                        }
                    }
                }
            }
            if (!found) {
                bfbot.sendMessage(src, "No such set exists!", channel);
            } else {
                var deleteMsg = getReadablePoke(args[1]);
                sendChanHtmlAll("<table border='2'><tr><td style='background-color:#ff7777;'><pre>" + deleteMsg + "</pre></td></tr></table>", reviewChannel);
                bfbot.sendAll(sys.name(src) + " deleted set id " + args[1] + " from " + tier + "!", reviewChannel);
            }
        }
    } else if (command === "deletepoke") {
        var setDeleted = false;
        args = commandData.split(":");
        var pokeNum = sys.pokeNum(args[0]);
        tier = find_pack(args[1]);
        if (args.length !== 2) {
            bfbot.sendMessage(src, "Usage: /deletepoke [poke]:[tier]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "That is not a valid tier!", channel);
        } else if (!isTierReviewer(src, tier)) {
            bfbot.sendMessage(src, "You are not authorised to review " + tier + " sets.", channel);
        } else {
            var deletePokeSets = bfSets[tier];
            for (var deletePokeId in deletePokeSets) {
                if (parseInt(deletePokeId, 10) === pokeNum) {
                    delete bfSets[tier][deletePokeId];
                    setDeleted = true;
                    break;
                }
            }
            if (!setDeleted) {
                bfbot.sendMessage(src, "No such Pokemon exists!", channel);
            } else {
                bfbot.sendAll(sys.name(src) + " deleted " + args[0] + " from " + tier + "!", reviewChannel);
            }
        }
    } else if (command === "submitbans") {
        sys.sendMessage(src, "*** SUBMIT BANS ***", channel);
        for (var ban in submitBans) {
            sys.sendMessage(src, submitBans[ban].user + " was banned by " + submitBans[ban].auth, channel);
        }
    } else if (command === "submitban") {
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /submitban [user]", channel);
        } else {
            var banIp = sys.dbIp(commandData);
            if (typeof banIp === "undefined") {
                bfbot.sendMessage(src, "No such user.", channel);
            } else if (sys.maxAuth(banIp) > 0) {
                bfbot.sendMessage(src, "Can't submit ban auth.", channel);
            } else if (submitBans.hasOwnProperty(banIp)) {
                bfbot.sendMessage(src, commandData + " is already banned from submitting!", channel);
            } else {
                submitBans[banIp] = {
                    "user": commandData.toLowerCase(),
                    "auth": sys.name(src)
                };
                bfbot.sendAll(commandData + " was banned from submitting sets by " + sys.name(src) + "!", reviewChannel);
                sys.writeToFile(submitDir + "bans.json", JSON.stringify(submitBans));
            }
        }
    } else if (command === "submitunban") {
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /submitunban [user]", channel);
        } else {
            var unbanIp = sys.dbIp(commandData);
            if (typeof unbanIp === "undefined") {
                bfbot.sendMessage(src, "No such user.", channel);
            } else if (!submitBans.hasOwnProperty(unbanIp)) {
                bfbot.sendMessage(src, commandData + " is not banned from submitting!", channel);
            } else {
                delete submitBans[unbanIp];
                bfbot.sendAll(commandData + " was unbanned from submitting sets by " + sys.name(src) + "!", reviewChannel);
                sys.writeToFile(submitDir + "bans.json", JSON.stringify(submitBans));
            }
        }
    } else if (command === "export") {
        // to-do: make this upload to pastebin or something
        tier = find_pack(commandData);
        if (commandData === "") {
            bfbot.sendMessage(src, "Usage: /export [pack]", channel);
        } else if (!bfSets.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "No such pack exists!", channel);
        } else {
            sys.sendHtmlMessage(src, "<table><tr><td><pre>"
                + html_escape(JSON.stringify(bfSets[tier], null, 4))
                + "</pre></td></tr></table>", channel);
        }
    } else if (command === "addreviewer") {
        args = commandData.split(":");
        tier = find_pack(args[1]);
        if (args.length !== 2) {
            bfbot.sendMessage(src, "Usage: /addreviewer [name]:[tier]", channel);
        } else if (!reviewers.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "That is not a valid tier!", channel);
        } else if (typeof sys.dbIp(args[0]) === "undefined") {
            bfbot.sendMessage(src, "No such user.", channel);
        } else if (!sys.dbRegistered(args[0])) {
            bfbot.sendMessage(src, "Reviewers must be registered!", channel);
        } else {
            var reviewerAlreadyExists = reviewers[tier].some(function(reviewer) {
                if (reviewer.toLowerCase() === args[0].toLowerCase()) {
                    return true;
                }
                return false;
            });
            if (reviewerAlreadyExists) {
                bfbot.sendMessage(src, args[0] + " is already a reviewer!", channel);
            } else {
                reviewers[args[1]].push(args[0]);
                bfbot.sendAll(sys.name(src) + " made " + args[0] + " an approved " + tier + " reviewer!", reviewChannel);
                sys.writeToFile(submitDir + "reviewers.json", JSON.stringify(reviewers));
            }
        }
    } else if (command === "removereviewer") {
        args = commandData.split(":");
        tier = find_pack(args[1]);
        if (args.length !== 2) {
            bfbot.sendMessage(src, "Usage: /removereviewer [name]:[tier]", channel);
        } else if (!reviewers.hasOwnProperty(tier)) {
            bfbot.sendMessage(src, "That is not a valid tier!", channel);
        } else {
            var removeUser = args[0].toLowerCase();
            var reviewerRemoved = false;
            for (var r = 0; r < reviewers[tier].length; r++) {
                if (reviewers[tier][r].toLowerCase() === removeUser) {
                    reviewers[tier].splice(r, 1);
                    reviewerRemoved = true;
                }
            }
            if (reviewerRemoved) {
                bfbot.sendAll(sys.name(src) + " fired " + args[0] + " from reviewing " + tier + "!", reviewChannel);
                sys.writeToFile(submitDir + "reviewers.json", JSON.stringify(reviewers));
            } else {
                bfbot.sendMessage(src, args[0] + " is not a reviewer for " + tier + "!", channel);
            }
        }
    } else if (command === "reviewers") {
        sys.sendMessage(src, "*** Current Reviewers ***", channel);
        for (var pack in reviewers) {
            sys.sendMessage(src, pack + ": " + reviewers[pack].join(", "), channel);
        }
    } else if (command === "backlog") {
        sys.sendMessage(src, "*** Current Queue Lengths ***", channel);
        for (var packName in bfHash) {
            if (packName !== "preset" && userQueue.hasOwnProperty(packName)) {
                sys.sendMessage(src, packName + ": " + userQueue[packName].length, channel);
            }
        }
    } else if (command === "forcestart") {
        if (working) {
            bfbot.sendMessage(src, "Battle Factory is already working.", channel);
        } else {
            working = true;
            bfbot.sendMessage(src, "Battle Factory has been force started.", channel);
        }
    } else {
        return "no command";
    }
}

// Set file checking
function setLint(checkFile) {
    var errors = [];
    var warnings = [];
    var suggestions = [];
    if (!checkFile.hasOwnProperty("desc")) {
        suggestions.push("<td>Description</td><td>Property 'desc' can be used to give a description for your team pack.</td>");
    } else if (typeof checkFile.desc !== "string") {
        warnings.push("<td>Bad Description</td><td>Property 'desc' must be a string.</td>");
    }
    if (!checkFile.hasOwnProperty("mode")) {
        suggestions.push("<td>Mode</td><td>Property 'mode' can be used to designate a pack for Singles, Doubles, or Triples.</td>");
    } else if (typeof checkFile.mode !== "string" || ["singles", "doubles", "triples"].indexOf(checkFile.mode.toLowerCase())) {
        warnings.push("<td>Bad Mode</td><td>Property 'mode' must be a string (Singles, Doubles, Triples).</td>");
    }
    if (checkFile.hasOwnProperty("readable")) {
        errors.push("<td>Readable</td><td>Property 'readable' is no longer supported.</td>");
    }
    if (checkFile.hasOwnProperty("perfectivs")) {
        warnings.push("<td>PerfectIVs</td><td>Property 'perfectivs' is now defunct.</td>");
    }
    var stats = ["HP", "Atk", "Def", "SAtk", "SDef", "Spd"];
    for (var property in checkFile) {
        if (Array.isArray(checkFile[property])) {
            for (var s = 0; s < checkFile[property].length; s++) {
                try {
                    var set = checkFile[property][s];
                    var parsedSet;
                    if (set && typeof set === "object" && set.hasOwnProperty("set")) {
                        set = set.set;
                    } else if (typeof set !== "string") {
                        throw "bad set";
                    }
                    parsedSet = pokeCodeToPokemon(set);
                    if (parsedSet.pokeId === 0) {
                        errors.push("<td>Missing Pokemon</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": Pokemon detected was Missingno.</td>");
                    }
                    if (parsedSet.level < 1 || parsedSet.level > 100) {
                        errors.push("<td>Level Out of Range</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": level must be an integer between 1 and 100 inclusive.</td>");
                    }
                    if (parsedSet.itemId === 0 && parsedSet.moves.indexOf("Acrobatics") < 0) {
                        warnings.push("<td>Missing Item</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": Set does not have an item.</td>");
                    }
                    if (isNaN(parsedSet.natureId) || parsedSet.natureId < 0 || parsedSet.natureId > 23) {
                        errors.push("<td>Invalid Nature</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": Set has an invalid nature.</td>");
                    }
                    if (parsedSet.natureId % 6 === 0) {
                        suggestions.push("<td>Neutral Nature</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": Set has a neutral nature. This may not be what was intended.</td>");
                    }
                    var validMoves = 0;
                    for (var m = 0; m < 4; m++) {
                        if (parsedSet.moveIds[m] === 0) {
                            warnings.push("<td>Missing Move</td><td>Property '" + html_escape(property) + "'; set "
                                + set + ": Moveslot " + (m + 1) + " is empty.</td>");
                        } else if (parsedSet.moveIds.lastIndexOf(parsedSet.moveIds[m]) !== m) {
                            errors.push("<td>Duplicate Move</td><td>Property '" + html_escape(property) + "'; set "
                                + set + ": Set contains the move '" + html_escape(parsedSet.moves[m]) + "' more than once.</td>");
                        } else {
                            validMoves += 1;
                        }
                    }
                    if (validMoves === 0) {
                        errors.push("<td>No Moves</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": Set has no moves.</td>");
                    }
                    var evSum = 0;
                    for (var e = 0; e < 6; e++) {
                        if (isNaN(parsedSet.evs[e]) || parsedSet.evs[e] < 0 || parsedSet.evs[e] > 255) {
                            errors.push("<td>Bad EV Amount</td><td>Property '" + html_escape(property)
                                + "'; set " + set + "; stat " + stats[e] + ": EVs must be integers between 0 and 255 inclusive.</td>");
                        } else if (parsedSet.evs[e] % 4 !== 0) {
                            warnings.push("<td>Wasted EVs</td><td>Property '" + html_escape(property)
                                + "'; set " + set + "; stat " + stats[e] + ": EVs should be a multiple of 4.</td>");
                            evSum += parsedSet.evs[e];
                        } else {
                            evSum += parsedSet.evs[e];
                        }
                    }
                    // uncomment when hackmons are properly flagged
                    /*if (evSum > 510) {
                        errors.push("<td>Too many EVs</td><td>Property '" + html_escape(property)
                            + "'; set " + set + ": EV total exceeds 510.</td>");
                    }*/
                    for (var d = 0; d < 6; d++) {
                        // gens 1 & 2 are 0 to 15 inclusive
                        if (isNaN(parsedSet.dvs[d]) || parsedSet.dvs[d] < 0 || parsedSet.dvs[d] > 31) {
                            errors.push("<td>Bad IV Amount</td><td>Property '" + html_escape(property)
                                + "'; set " + set + "; stat " + stats[e] + ": IVs must be integers between 0 and 31 inclusive.</td>");
                        }
                    }
                } catch (error) {
                    errors.push("<td>Bad Set</td><td>Property '" + html_escape(property) + "'; expected 39 or 40 character alphanumeric strings.</td>");
                }
            }
        } else if (["readable", "desc", "mode", "perfectivs", "maxpokes"].indexOf(property) < 0) {
            warnings.push("<td>Bad Property</td><td>Property '" + html_escape(property) + "' must be an Array.</td>");
        }
    }
    if (errors.length > 10) {
        errors = errors.slice(0, 10);
        errors.push("<td>Too many errors</td><td>Only the first 10 errors in this file are shown.</td>");
    }
    if (warnings.length > 10) {
        warnings = warnings.slice(0, 10);
        warnings.push("<td>Too many warnings</td><td>Only the first 10 warnings in this file are shown.</td>");
    }
    if (suggestions.length > 10) {
        suggestions = suggestions.slice(0, 10);
        suggestions.push("<td>Too many suggestions</td><td>Only the first 10 suggestions in this file are shown.</td>");
    }
    return {
        "errors": errors,
        "warnings": warnings,
        "suggestions": suggestions
    };
}

function printLintResults(src, lintResults, channel) {
    if (lintResults.errors.length > 0) {
        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=red>Errors</font></th><th>"
            + lintResults.errors.length + "</th></tr><tr>"
            + lintResults.errors.join("</tr><tr>")
            + "</tr></table>", channel);
    }
    if (lintResults.warnings.length > 0) {
        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=orange>Warnings</font></th><th>"
            + lintResults.warnings.length + "</th></tr><tr>"
            + lintResults.warnings.join("</tr><tr>")
            + "</tr></table>", channel);
    }
    if (lintResults.suggestions.length > 0) {
        sys.sendHtmlMessage(src, "<table border='2' cellpadding='3'><tr><th><font color=green>Suggestions</font></th><th>"
            + lintResults.suggestions.length + "</th></tr><tr>"
            + lintResults.suggestions.join("</tr><tr>")
            + "</tr></table>", channel);
    }
}

// converts a set code to a readable format, or importable. The lineBreak parameter defaults to "<br />"
function getReadablePoke(setCode, lineBreak) {
    if (setCode.length < 39 || setCode.length > 40) {
        throw "Invalid Set, each set should be 39 or 40 alphanumeric characters long.";
    }
    lineBreak = lineBreak || "<br />";
    var stats = ["HP", "Atk", "Def", "SAtk", "SDef", "Spd"];
    var info = pokeCodeToPokemon(setCode);
    var readablePoke = setCode + lineBreak;
    readablePoke += info.poke + " @ " + info.item + lineBreak;
    if (info.level < 100) {
        readablePoke += "Level: " + info.level + lineBreak;
    }
    readablePoke += "Trait: " + info.ability + lineBreak;
    var evList = [];
    var dvList = [];
    for (var i = 0; i < 6; i++) {
        if (info.evs[i] > 0) {
            evList.push(info.evs[i] + " " + stats[i]);
        }
        if (info.dvs[i] < 31) {
            dvList.push(info.dvs[i] + " " + stats[i]);
        }
    }
    readablePoke += "EVs: " + evList.join(" / ") + lineBreak;
    if (dvList.length > 0) {
        readablePoke += "IVs: " + dvList.join(" / ") + lineBreak;
    }
    readablePoke += info.nature + " Nature";
    if (info.natureInfo[0] !== 0) {
        readablePoke += " (+" + stats[info.natureInfo[0]] + ", -" + stats[info.natureInfo[1]] + ")";
    }
    readablePoke += lineBreak;
    for (var m = 0; m < 4; m++) {
        if (info.moves[m] === "Hidden Power") {
            var hpType = info.gen < 7 ? sys.hiddenPowerType(5, dvs[0], dvs[1], dvs[2], dvs[3], dvs[4], dvs[5]) :
                                                info.hiddenPowerType;
            readablePoke += "- Hidden Power [" + sys.type(hpType) + "]" + lineBreak;
        } else if (info.moves[m] !== "(No Move)") {
            readablePoke += "- " + info.moves[m] + lineBreak;
        }
    }
    return readablePoke + "Generation: " + info.gen;
}

// Gets stat boosted and lowered by a nature
// 1=Atk, 2=Def, 3=SAtk, 4=SDef, 5=Spd
// returns [stat boosted, stat lowered];
function getNature(nature) {
    var natureTable = {
        "Hardy": [0, 0],
        "Lonely": [1, 2],
        "Brave": [1, 5],
        "Adamant": [1, 3],
        "Naughty": [1, 4],
        "Bold": [2, 1],
        "Docile": [0, 0],
        "Relaxed": [2, 5],
        "Impish": [2, 3],
        "Lax": [2, 4],
        "Timid": [5, 1],
        "Hasty": [5, 2],
        "Serious": [0, 0],
        "Jolly": [5, 3],
        "Naive": [5, 4],
        "Modest": [3, 1],
        "Mild": [3, 2],
        "Quiet": [3, 5],
        "Bashful": [0, 0],
        "Rash": [3, 4],
        "Calm": [4, 1],
        "Gentle": [4, 2],
        "Sassy": [4, 5],
        "Careful": [4, 3],
        "Quirky": [0, 0]
    };
    return natureTable[nature];
}

// This gets a preview of the Pokemon for the player to view
// In an ideal world this takes an alphanumeric code
function getPokePreview(src, team, poke) {
    var evs = [];
    var dvs = [];
    for (var i = 0; i < 6; i++) {
        evs.push(sys.teamPokeEV(src, team, poke, i));
        dvs.push(sys.teamPokeDV(src, team, poke, i));
    }
    var pokeName = sys.pokemon(sys.teamPoke(src, team, poke));
    var nature = sys.nature(sys.teamPokeNature(src, team, poke));
    var ability = sys.ability(sys.teamPokeAbility(src, team, poke));
    var item = sys.item(sys.teamPokeItem(src, team, poke));
    var level = sys.teamPokeLevel(src, team, poke);
    var stats = ["HP", "Attack", "Defense", "Sp.Atk", "Sp.Def", "Speed"];
    var statList = [];
    var baseStats = sys.pokeBaseStats(sys.teamPoke(src, team, poke));
    for (var s = 0; s < 6; s++) {
        var natureBoost = getNature(nature);
        if (s === 0) { // HP Stat
            if (baseStats[s] === 1) { // Shedinja
                statList.push("1 HP");
            } else {
                // ((iv + 2*base + ev/4 + 100) * this.level / 100) + 10
                // flooring all divisions
                var hpStat = Math.floor((dvs[s] + 2 * baseStats[s] + Math.floor(evs[s] / 4) + 100) * level / 100) + 10;
                statList.push(hpStat + " HP");
            }
        } else {
            // ((iv + 2*base + ev/4) * this.level / 100) + 5
            // flooring all divisions
            var stat = Math.floor((dvs[s] + 2 * baseStats[s] + Math.floor(evs[s] / 4)) * level / 100) + 5;
            if (s === natureBoost[0]) {
                stat = Math.floor(stat * 1.1);
            } else if (s === natureBoost[1]) {
                stat = Math.floor(stat * 0.9);
            }
            statList.push(stat + " " + stats[s]);
        }
    }
    var moves = [];
    for (var m = 0; m < 4; m++) {
        moves.push(sys.move(sys.teamPokeMove(src, team, poke, m)));
        if (moves[m] === "Hidden Power") {
            var hpType = sys.gen(src, team) < 7 ? sys.hiddenPowerType(5, dvs[0], dvs[1], dvs[2], dvs[3], dvs[4], dvs[5]) :
                                                sys.teamPokeHiddenPower(src, team, poke);
            moves[m] += " [" + sys.type(hpType) + "]";
        }
    }
    var preview = pokeName + " @ " + item;
    preview += "; Ability: " + ability;
    preview += "; " + nature + " Nature;";
    preview += " Level " + level;
    preview += "<br />" + moves.join(" / ");
    preview += "<br />" + statList.join(" / ");
    return preview;
}

function setToPokemon(set) {
    if (typeof set === "object") {
        return pokeCodeToPokemon(set.set);
    }
    return pokeCodeToPokemon(set);
}

function megaFilter(set) {
    return this.megaCount < this.megaLimit || !isMegaStone(set.itemId);
}

// Checks if the item is a Mega Stone
// Accepts both numbers (item ids) and strings (item names)
function isMegaStone(item) {
    if (isNaN(item)) {
        item = sys.itemNum(item);
    }
    return item > 2000 && item < 3000 && sys.item(item);
}

function zFilter(set) {
    return this.zCount < this.zLimit || !isZCrystal(set.itemId);
}

function isZCrystal(item) {
    if (isNaN(item)) {
        item = sys.itemNum(item);
    }
    
    return item >= 3000 && item <= 3028 && sys.item(item);
}

function isHazard(move) {
    return ["Spikes", "Stealth Rock", "Sticky Web", "Toxic Spikes"].indexOf(move) > -1;
}

function isHazardRemoval(move) {
    return move === "Defog" || move === "Rapid Spin";
}

function totalHazards(moveCounts) {
    return ((moveCounts["Spikes"] || 0)
        + (moveCounts["Stealth Rock"] || 0)
        + (moveCounts["Sticky Web"] || 0)
        + (moveCounts["Toxic Spikes"] || 0)
    );
}

function hazardLimitFilter(set) {
    var hazardsInSet = 0;
    // check if any moves are duplicate hazards
    for (var m = 0; m < 4; m++) {
        if (isHazard(set.moves[m])) {
            if (this.moveCounts[set.moves[m]] > 0) {
                return false;
            }
            hazardsInSet += 1;
        }
    }
    // check if adding this pokemon's moveset will surpass the hazardsLimit
    if (hazardsInSet > this.maxHazards) {
        return false;
    }
    return true;
}

function hazardControlOnlyFilter(set) {
    return set.moves.some(isHazard) || set.moves.some(isHazardRemoval);
}

function noMoveLast(m1, m2) {
    if (m1 === 0) return 1;
    if (m2 === 0) return -1;
    return 0;
}

function missingNoLast(p1, p2) {
    if (p1.pokeId === 0) return 1;
    if (p2.pokeId === 0) return -1;
    return 0;
}

function generateTeam(src, team, tier) {
    var megaLimit = 1, megaCount = 0;
    var zLimit = 1, zCount = 0;
    var hazardsLimit = 2;
    var moveCounts = {};
    try {
        var pack = bfSets.hasOwnProperty(tier) ? bfSets[tier] : bfSets.preset;
        var teamInfo = [];
        var pokeArray = [];
        var badPokeArray = []; // backup if a team cannot be generated
        for (var x in pack) {
            if (Array.isArray(pack[x])) {
                pokeArray.push(x);
            }
        }
        for (var p = 0; p < 6; p++) {
            var pokemonAdded = false;
            while (!pokemonAdded && pokeArray.length > 0) {
                var poke = pokeArray.splice(sys.rand(0, pokeArray.length), 1)[0];
                var filteredSets = pack[poke].map(setToPokemon);
                filteredSets = filteredSets
                                   .filter(megaFilter, { "megaCount": megaCount, "megaLimit": megaLimit })
                                   .filter(zFilter, { "zLimit": zLimit, "zCount": zCount })
                                   .filter(hazardLimitFilter, { "maxHazards": hazardsLimit - totalHazards(moveCounts), "moveCounts": moveCounts });

                // make sure to add some sort of hazard control if none exists
                if (p === 5 && totalHazards(moveCounts) === 0) {
                    filteredSets = filteredSets.filter(hazardControlOnlyFilter);
                }
                if (filteredSets.length > 0) {
                    var tmp = filteredSets[sys.rand(0, filteredSets.length)];
                    if (sys.isPokeBannedFromTier(tmp.pokeId, tier)) {
                        continue;
                    }
                    teamInfo[p] = tmp;
                    pokemonAdded = true;
                } else {
                    badPokeArray.push(poke);
                }
            }
            if (!pokemonAdded && badPokeArray.length > 0) {
                var badPoke = badPokeArray.splice(sys.rand(0, badPokeArray.length), 1)[0];
                var badSet = pack[badPoke][sys.rand(0, pack[badPoke].length)];
                teamInfo[p] = setToPokemon(badSet);
                pokemonAdded = true;
            }
            if (!pokemonAdded) {
                throw "Team file was empty or corrupt";
            }
            if (isMegaStone(teamInfo[p].itemId)) {
                megaCount += 1;
            }
            if (isZCrystal(teamInfo[p].itemId)) {
                zCount += 1;
            }
            for (var c = 0; c < 4; c++) {
                moveCounts[teamInfo[p].moves[c]] = (moveCounts[teamInfo[p].moves[c]] || 0) + 1;
            }
        }
        // shuffle to avoid giving information via position dependent choices
        teamInfo = (teamInfo.shuffle()).sort(missingNoLast);
        // Everything below copies the selected Pokemon to the user's team
        for (var s = 0; s < 6; s++) {
            var pokeData = teamInfo[s];
            sys.changePokeNum(src, team, s, pokeData.pokeId);
            sys.changePokeName(src, team, s, pokeData.poke);
            sys.changePokeNature(src, team, s, pokeData.natureId);
            sys.changePokeAbility(src, team, s, pokeData.abilityId);
            sys.changePokeItem(src, team, s, pokeData.itemId);
            sys.changePokeHiddenPower(src, team, s, pokeData.hiddenPowerType);
            //                                         Conversion                  Normalium Z
            var shuffledMoves = pokeData.moveIds.contains(160) && pokeData.itemId === 3000 ? pokeData.moveIds : ((pokeData.moveIds.slice()).shuffle()).sort(noMoveLast); // Z-Conversion
            for (var m = 0; m < 4; m++) {
                sys.changePokeMove(src, team, s, m, shuffledMoves[m]);
            }
            for (var i = 0; i < 6; i++) {
                sys.changeTeamPokeEV(src, team, s, i, pokeData.evs[i]);
                sys.changeTeamPokeDV(src, team, s, i, pokeData.dvs[i]);
            }
            // maximise happiness if the poke has Return, minimise if it has frustration
            if (pokeData.moves.indexOf("Return") > -1) {
                sys.changePokeHappiness(src, team, s, 255);
            } else {
                sys.changePokeHappiness(src, team, s, 0);
            }
            var ladderRating = 1000;
            if (typeof sys.ladderRating(src, "Battle Factory 6v6") !== "undefined") {
                ladderRating += Math.max(0, sys.ladderRating(src, "Battle Factory 6v6") - 1000);
            }
            if (typeof sys.ladderRating(src, "Battle Factory") !== "undefined") {
                ladderRating += Math.max(0, sys.ladderRating(src, "Battle Factory") - 1000);
            }
            var shineChance = Math.ceil(8192 * 1000000 / Math.pow(ladderRating, 2));
            sys.changePokeShine(src, team, s, sys.rand(0, shineChance) === 0);
            var possibleGenders = sys.pokeGenders(pokeData.pokeId);
            if (possibleGenders.hasOwnProperty("neutral")) {
                sys.changePokeGender(src, team, s, 0);
            } else if (possibleGenders.hasOwnProperty("male") && sys.rand(0, 100) <= possibleGenders.male) {
                sys.changePokeGender(src, team, s, 1);
            } else {
                sys.changePokeGender(src, team, s, 2);
            }
            // do not move this, it's the only thing updating stats apparently!!
            if (isLCTier(tier)) {
                sys.changePokeLevel(src, team, s, Math.min(5, pokeData.level));
            } else {
                sys.changePokeLevel(src, team, s, pokeData.level);
            }
        }
        sys.updatePlayer(src);
    } catch (error) {
        bfbot.sendMessage(src, "Could not generate a team. Please report this to the Battle Factory staff. [Error: " + error + "]");
        throw "Corrupt Team File: " + error;
    }
}

function countPokes(tier) {
    var pokeCount = 0;
    for (var poke in bfSets[tier]) {
        if (Array.isArray(bfSets[tier][poke])) {
            pokeCount += 1;
        }
    }
    return pokeCount;
}

function countSets(tier, poke) {
    var setCount = 0;
    if (typeof poke === "undefined") {
        // add up all sets for all pokes
        for (var currentPoke in bfSets[tier]) {
            if (Array.isArray(bfSets[tier][currentPoke])) {
                setCount += bfSets[tier][currentPoke].length;
            }
        }
    } else {
        // add up all sets for a single poke
        if (bfSets[tier].hasOwnProperty(poke) && Array.isArray(bfSets[tier][poke])) {
            setCount += bfSets[tier][poke].length;
        }
    }
    return setCount;
}

// returns the number of valid packs
function validPacks() {
    var packCount = 0;
    for (var packName in bfHash) {
        if (bfHash[packName].enabled && bfHash[packName].active) {
            packCount += 1;
        }
    }
    return packCount;
}

function isReviewAdmin(src) {
    return SESSION.channels(reviewChannel).isChannelOwner(src);
}

function isGlobalReviewer(src) {
    return SESSION.channels(reviewChannel).isChannelAdmin(src);
}

function isReviewer(src) {
    if (isReviewAdmin(src) || isGlobalReviewer(src)) {
        return true;
    }
    for (var tier in reviewers) {
        var tierReviewers = reviewers[tier];
        for (var i = 0; i < tierReviewers.length; i++) {
            if (sys.name(src).toLowerCase() === tierReviewers[i].toLowerCase()) {
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
    var tierReviewers = reviewers[tier];
    for (var i = 0; i < tierReviewers.length; i++) {
        if (sys.name(src).toLowerCase() === tierReviewers[i].toLowerCase()) {
            return true;
        }
    }
    return false;
}

module.exports = {
    handleCommand: function (src, message, channel) {
        // please keep these alphabetized
        var userCommands = [
            "backlog", "bfversion", "pokeslist", "pokesets",
            "reviewers", "submitsets", "viewpacks"
        ];
        var reviewerCommands = [
            "acceptset", "checkqueue", "deletepoke", "deleteset",
            "nextset", "pokecode", "refresh", "rejectset", "savesets",
            "submitban", "submitunban", "submitbans"
        ];
        var modCommands = [];
        var adminCommands = [
            "addpack", "addreviewer", "addtier", "deletepack", "disablepack",
            "enablepack", "export", "forcestart", "loadfromfile", "removereviewer",
            "scansets", "updatepack", "updateteams"
        ];
        var bfAuthCommands = reviewerCommands.concat(modCommands).concat(adminCommands);
        var command, commandData = "", split = message.indexOf(" ");
        if (split > -1) {
            command = message.substring(0, split).toLowerCase();
            commandData = message.substring(split + 1);
        } else {
            command = message.toLowerCase();
        }
        // permissions handling
        // Reviewer command without reviewer status
        if (reviewerCommands.indexOf(command) > -1 && !isReviewer(src)) {
            return false;
        }
        // Global Reviewer command without being a global reviewer or review admin
        if (modCommands.indexOf(command) > -1 && !isGlobalReviewer(src) && !isReviewAdmin(src)) {
            return false;
        }
        // Review Admin command without being a review admin
        if (adminCommands.indexOf(command) > -1 && !isReviewAdmin(src)) {
            return false;
        }
        // Non-user command without being in the review channel (assumed sufficient auth)
        if (bfAuthCommands.indexOf(command) > -1 && channel !== reviewChannel) {
            return false;
        }
        // run the command and if "no command", then pass the command on
        if (factoryCommand(src, command, commandData, channel) === "no command") {
            return false;
        }
        return true;
    },
    stepEvent: function() {
        if (sys.time() % saveInterval === 0) {
            autoSave("all", "");
            bfbot.sendAll("Autosaved user generated sets.", reviewChannel);
        }
    },
    init: function() {
        try {
            initFactory();
        } catch (err) {
            sendStaff("Error in starting battle factory: " + err);
            working = false;
        }
    },
    afterChannelJoin: function(player, channel) {
        reviewChannel = sys.channelId("BF Review");
        if (channel === reviewChannel && isReviewer(player)) {
            for (var tier in userQueue) {
                if (isTierReviewer(player, tier) && userQueue[tier].length > 0) {
                    sendQueueItem(player, 0, tier);
                }
            }
        }
    },
    beforeChallengeIssued: function(source, dest, clauses, rated, mode, team, destTier) {
        if (isInBFTier(source, team) && isBFTier(destTier) && (!working || validPacks() === 0)) {
            sys.sendMessage(source, "Battle Factory is not working, so you can't issue challenges in that tier.");
            return true;
        }
        return false;
    },
    beforeChangeTier: function(src, team, oldtier, newtier) { // This shouldn't be needed, but it's here in case
        if (isBFTier(newtier) && (!working || validPacks() === 0)) {
            sys.sendMessage(src, "Battle Factory is not working, so you can't move into that tier. Your team is now in Challenge Cup.");
            sys.changeTier(src, team, "Challenge Cup");
            return true;
        }
    },
    beforeBattleStarted: function(src, dest, rated, mode, srcteam, destteam) {
        var modes = ["Singles", "Doubles", "Triples"];
        if (isInBFTier(src, srcteam) && isInBFTier(dest, destteam)) {
            try {
                var allowedTypes = [];
                var suggestedTypes = [];
                for (var pack in bfHash) {
                    if (bfHash[pack].enabled && bfHash[pack].active) {
                        allowedTypes.push(pack);
                        if (bfSets[pack].hasOwnProperty("mode") && script.cmp(bfSets[pack].mode, modes[mode])) {
                            suggestedTypes.push(pack);
                        } else if (bfSets[pack].hasOwnProperty("maxpokes") && bfSets[pack].maxpokes === 6
                                   && sys.tier(src, srcteam) === sys.tier(dest, destteam)
                                   && sys.tier(src, srcteam) === "Battle Factory 6v6") {
                            suggestedTypes.push(pack);
                        }
                    }
                }
                if (allowedTypes.length === 0) {
                    throw "No valid packs to choose from!";
                }
                var type = allowedTypes[sys.rand(0, allowedTypes.length)];
                if (suggestedTypes.length > 0) {
                    type = suggestedTypes[sys.rand(0, suggestedTypes.length)];
                }
                generateTeam(src, srcteam, type);
                generateTeam(dest, destteam, type);
                /*if (find_tier(type)) {
                    var k = 0;
                    var errsrc, errdest;
                    while (!tier_checker.has_legal_team_for_tier(src, srcteam, type, true) || !tier_checker.has_legal_team_for_tier(dest, destteam, type, true)) { //for complex bans like SS+Drizzle
                        generateTeam(src, srcteam, type);
                        generateTeam(dest, destteam, type);
                        errsrc = tier_checker.has_legal_team_for_tier(src, srcteam, type, true, true);
                        errdest = tier_checker.has_legal_team_for_tier(dest, destteam, type, true, true);
                        if(++k>100) throw "Cannot generate legal teams after 100 attempts in tier: " + type + (errsrc ? "(Last error: " + errsrc + ")" : errdest ? "(Last error: " + errdest + ")" : "!");

                    }
                }*/
                dumpData(src, srcteam);
                dumpData(dest, destteam);
            } catch (err) {
                sendStaff("Error in generating teams: " + err);
            }
        }
    },
    onHelp: function(src, topic, channel) {
        var help = [];
        if (topic.toLowerCase() === "battlefactory" || topic.toLowerCase() === "battle factory") {
            var adminHelp = [
                "*** Battle Factory Admin Commands ***",
                "/addreviewer [name]:[tier]: Adds the user as a reviewer for that tier.",
                "/removereviewer [name]:[tier]: Removes the user as a reviewer for that tier.",
                "/addtier [tier]:[mode]: Creates a pack for that tier, mode is optional (Singles/Doubles/Triples)",
                "/deletepack [pack]: Deletes the pack associated with that tier.",
                "/enablepack [pack]: Enables a pack to be used if it is working.",
                "/disablepack [pack]: Disables a pack regardless of if it's working.",
                "/export [tier]: Exports a pack as raw JSON (will be quite long).",
                "/scansets [url/location]: Scan a set file for any critical errors (scans current if no file specified, /scanusersets scans the user sets)",
                "/addpack [pack] ~ [url]: Downloads a Battle Factory pack from the Internet.",
                "/updatepack [pack] ~ [url]: Updates a Battle Factory pack from the Internet. Loads from the last known URL if no URL is specified.",
                "/updateteams: Update default teams from the web.",
                "/forcestart: Force starts Battle Factory even after an error. It's unlikely to fix anything."
            ];
            var reviewHelp = [
                "*** Battle Factory Reviewer Commands ***",
                "/acceptset [tier]: Accepts the current set in the queue for that tier.",
                "/rejectset [tier]: Rejects the current set in the queue for that tier.",
                "/nextset [tier]: Goes to the next set in the queue for that tier.",
                "/checkqueue [tier]: Checks the current set in the queue for that tier.",
                "/deleteset [tier]:[code]: Deletes the first set with the given code in that tier.",
                "/deletepoke [poke]:[tier]: Deletes a Pokemon along with all its sets (use for tier changes).",
                "/savesets: Saves user generated Battle Factory sets (use before updating/server downtime)",
                "/submit[un]ban: [Un]bans a player from submitting sets.",
                "/submitbans: Views the list of submit bans.",
                "/refresh [tier]: Refreshes a tier (saves and checks if it's working)",
                "/pokecode [alpha code]: Converts a code to readable format."
            ];
            var userHelp = [
                "*** Battle Factory Commands ***",
                "/reviewers: Views the list of authorised reviewers.",
                "/submitsets [comment]: Submits the first team in the teambuilder for review in the team's tier. Comments are optional.",
                "/pokeslist [tier]: Views the list of installed Pokemon for the given tier.",
                "/pokesets [poke]:[tier]: Gets the sets for a Pokemon in the given tier.",
                "/backlog: Views the queue lengths.",
                "/viewpacks: Views currently installed Battle Factory tiers.",
                "/bfversion: Gives information about Battle Factory."
            ];
            help = userHelp;
            if (isReviewer(src)) {
                help = help.concat(reviewHelp);
            }
            if (isReviewAdmin(src)) {
                help = help.concat(adminHelp);
            }
        }
        if (help.length > 0) {
            for (var i = 0; i < help.length; i++) {
                sys.sendMessage(src, help[i], channel);
            }
            return true;
        }
        return false;
    },
    getVersion: function(type) {
        if (type === "script") {
            return bfVersion;
        }
        if (type === "team") {
            return "Default";
        }
        return "Invalid Type";
    },
    generateTeam: function(src, team) {
        // generate a team for players with no Pokemon
        generateTeam(src, team, "preset");
        return true;
    },
    saveSets: function() {
        autoSave("all", "");
        bfbot.sendAll("Saved user generated sets!", reviewChannel);
    },
    "help-string": ["battlefactory: To know the battlefactory commands"]
};
