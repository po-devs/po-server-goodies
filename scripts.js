/*global client, print, script: true, SESSION: true, toString, sys*/
/*jshint strict: false, shadow: true, evil: true*/
/*jslint sloppy: true, vars: true, evil: true, plusplus: true*/

// Oddly toString isn't recognized as a global built-in JavaScript function

// RESET ONGOING TIMERS
sys.unsetAllTimers();

// DECLAIRE PROTOTYPES
Array.prototype.add = function (value) {
    if (typeof value === "string") {
        value = value.toLowerCase();
    }
    if (this.indexOf(value) === -1) {
        this.push(value);
        this.sort();
        return true;
    }
    return false;
};
Array.prototype.contains = function (value) {
    return this.indexOf(value) > -1;
};
Array.prototype.random = function () {
    return this[sys.rand(0, this.length)];
};
Array.prototype.remove = function (value) {
    if (typeof value === "string") {
        value = value.toLowerCase();
    }
    if (this.indexOf(value) > -1) {
        this.splice(this.indexOf(value), 1);
        this.sort();
        return true;
    }
    return false;
};
Object.defineProperties(Array.prototype, {
    "add": {
        enumerable: false
    },
    "contains": {
        enumerable: false
    },
    "random": {
        enumerable: false
    },
    "remove": {
        enumerable: false
    }
});
Date.prototype.getDigitalTime = function () {
    var d = this, h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    h = (h < 10 ? "0" + h : h);
    m = (m < 10 ? "0" + m : m);
    s = (s < 10 ? "0" + s : s);
    return h + ":" + m + ":" + s;
};
Number.prototype.getDaySuffix = function () {
    var day = this;
    if (day > 3 && day < 21) {
        return day + "th";
    }
    switch (day % 10) {
    case 1:
        return day + "st";
    case 2:
        return day + "nd";
    case 3:
        return day + "rd";
    default:
        return day + "th";
    }
};
String.prototype.htmlEscape = function () {
    return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
String.prototype.htmlStrip = function () {
    return this.replace(/(<([^>]+)>)/gi, "");
};
String.prototype.regexpEscape = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// DECLARE CLASSES
function Bot(name, color, symbol, enableTime) {
    this.name = (name === undefined ? "PluginBot" : name);
    this.color = (color === undefined ? "#318739" : color);
    this.symbol = (symbol === undefined ? "±" : symbol);
    this.enableTime = (enableTime === undefined ? true : enableTime);
    return;
}
Bot.prototype.sendMessage = function (channelId, message) {
    if (isNaN(channelId)) {
        return;
    }
    client.network().sendChanMessage(channelId, message);
    return;
};
Bot.prototype.sendMasterHtml = function (message) {
    var masterId = client.channelId(CONFIG.masterChannelName),
        baseMessage = "<font color='" + this.color + "'><timestamp/><b>" + this.symbol + this.name + ":</font></b> " + message;
    if (!CONFIG.masterChannelName) {
        client.printChannelMessage(baseMessage, client.currentChannel(), true);
    } else {
        if (isInChannel(client.ownId(), masterId)) {
            client.printChannelMessage(baseMessage, masterId, true);
            if (client.currentChannel() !== masterId) {
                client.printChannelMessage(baseMessage, client.currentChannel(), true);
            }
        } else {
            client.printChannelMessage(baseMessage, client.currentChannel(), true);
        }
    }
    return;
};
Bot.prototype.sendMasterText = function (message) {
    var masterId = client.channelId(CONFIG.masterChannelName),
        baseMessage = this.symbol + this.name + ": " + message;
    if (!CONFIG.masterChannelName) {
        client.printChannelMessage(baseMessage, client.currentChannel(), false);
    } else {
        if (isInChannel(client.ownId(), masterId)) {
            client.printChannelMessage(baseMessage, masterId, false);
            if (client.currentChannel() !== masterId) {
                client.printChannelMessage(baseMessage, client.currentChannel(), false);
            }
        } else {
            client.printChannelMessage(baseMessage, client.currentChannel(), false);
        }
    }
    return;
};
Bot.prototype.sendBotMessage = function (channelId, message) {
    if (isNaN(channelId)) {
        return;
    }
    client.network().sendChanMessage(channelId, this.symbol + this.name + ": " + message);
    return;
};
Bot.prototype.sendBotText = function (message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage(this.symbol + this.name + ": " + message, channelId, false);
    return;
};
Bot.prototype.sendBotHtml = function (message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage("<font color='" + this.color + "'>" + (this.enableTime === true ? "<timestamp/>" : "") + "<b>" + this.symbol + this.name + ":</font></b> " + message, channelId, true);
    return;
};

function Memory(fileDir) {
    this.fileDir = (CONSTANTS.pluginDataDir + fileDir).replace("\\", "/");
    var x, fileEx = this.fileDir.split(".")[this.fileDir.split(".").length - 1];
    if (fileEx !== "json") {
        this.fileDir = this.fileDir + ".json";
    }
    this.load();
    return;
}
Memory.prototype.deleteFile = function () {
    if (sys.isSafeScripts()) {
        print("±MemoryManager: Unable to delete file. Please disable Safe Scripts.");
        return;
    }
    sys.deleteFile(this.fileDir);
    return;
};
Memory.prototype.load = function () {
    if (sys.isSafeScripts()) {
        print("±MemoryManager: Unable to load file. Please disable Safe Scripts.");
        return;
    }
    var x, data;
    try {
        if (sys.fileExists(this.fileDir)) {
            data = JSON.parse(sys.getFileContent(this.fileDir));
            for (x in data) {
                this[x] = data[x];
            }
        }
    } catch (error) {
        print("±MemoryManager: Error loading file. " + error);
    }
    return;
};
Memory.prototype.save = function () {
    if (sys.isSafeScripts()) {
        print("±MemoryManager: Unable to save file. Please disable Safe Scripts.");
        return;
    }
    var dirArray = this.fileDir.split("/");
    try {
        if (!sys.fileExists(this.fileDir) && dirArray.length > 1) {
            sys.makeDir(dirArray.slice(0, dirArray.length - 1));
        }
        sys.writeToFile(this.fileDir, JSON.stringify(this, function (key, value) {
            if (["fileDir"].indexOf(key) > -1) {
                return;
            }
            return value;
        }));
        return;
    } catch (error) {
        print("±MemoryManager: Error saving file. " + error);
    }
    return;
};

// DECLAIRE GLOBAL VARIABLES
var INIT = false;

// CREATE AND SET DEFAULT CONFIG
var CONFIG = {
    authSymbolArray: ["", "+", "+", "+", ""],
    botAuthArray: [],
    botChannelArray: [],
    botColor: "blue",
    botEnabled: false,
    botName: "ClientBot",
    botSymbol: "±",
    flashColor: "#ff00ff",
    friendArray: [],
    ignoreArray: [],
    ignoreChallenge: false,
    loadAlertEnabled: false,
    masterChannelName: "",
    pluginEnabledArray: [],
    privateCommandSymbol: "-",
    publicCommandsEnabled: false,
    publicCommandSymbol: "?",
    removeCaps: false,
    saveAlertEnabled: false,
    stalkWordArray: [],
    tourRoundAlertEnabled: false,
    welcomeMessage: "<img src='pokemon:num=359-1&gen=6&shiny=false&back=false'>"
};

var CONSTANTS = {
    configFile: "Nova Script Alpha/config.json",
    pluginDir: "Nova Script Alpha/plugins/",
    pluginDataDir: "Nova Script Alpha/plugin_data/",
    pluginServerUrl: "https://raw.githubusercontent.com/NightfallAlicorn/po-scripts/master/nova_client_script_alpha/plugin_server.json",
    rootDir: "Nova Script Alpha/"
};

function buildDir() {
    if (!sys.fileExists(CONSTANTS.configFile)) {
        sys.makeDir(CONSTANTS.rootDir);
    }
    if (!sys.fileExists(CONSTANTS.pluginDir)) {
        sys.makeDir(CONSTANTS.pluginDir);
    }
    if (!sys.fileExists(CONSTANTS.pluginDataDir)) {
        sys.makeDir(CONSTANTS.pluginDataDir);
    }
    return;
}
function fillObject(scriptObject, loadObject) {
    var key;
    for (key in scriptObject) {
        if (scriptObject.hasOwnProperty(key)) {
            if (Object.prototype.toString.call(scriptObject[key]) === "[object Object]") {
                if (loadObject.hasOwnProperty(key) === false) {
                    loadObject[key] = {};
                    sendBotHtml("Creating missing settings object: " + key);
                }
                fillObject(scriptObject[key], loadObject[key]);
            } else if (loadObject.hasOwnProperty(key) === false) {
                loadObject[key] = scriptObject[key];
                sendBotHtml("Added missing config <b>" + key.htmlEscape() + "</b> value.");
            }
        }
    }
    for (key in loadObject) {
        if (loadObject.hasOwnProperty(key) === true) {
            if (scriptObject.hasOwnProperty(key) === false) {
                delete loadObject[key];
                sendBotHtml("Removed non-config <b>" + key.htmlEscape() + "</b> value.");
            }
        }
    }
}
function channelPlayerNames(channelId) {
    var x,
        idArray = client.channel(channelId).players(),
        length = idArray.length,
        nameArray = [];
    for (x = 0; x < length; x++) {
        nameArray[x] = client.name(idArray[x]);
    }
    return nameArray;
}
function getChannel(name) {
    var correctCase = client.channelName(client.channelId(name));
    if (correctCase.toLowerCase() === name.toLowerCase()) {
        return correctCase;
    }
    return name;
}
function getName(name) {
    return (client.playerExist(client.id(name)) ? client.name(client.id(name)) : name);
}
function getTier(tier) {
    var x, tierArray = client.getTierList(), length = tierArray.length;
    for (x = 0; x < length; x++) {
        if (tierArray[x].toLowerCase() === tier.toLowerCase()) {
            return tierArray[x];
        }
    }
    return;
}
function inChannels(src) {
    var x, y, foundArray = [], playerIdArray = [], myChannelArray = client.myChannels();
    for (x = 0; x < myChannelArray.length; x++) {
        playerIdArray = client.channel(client.channelId(myChannelArray[x])).players();
        for (y = 0; y < playerIdArray.length; y++) {
            if (client.name(src).toLowerCase() === client.name(playerIdArray[y]).toLowerCase()) {
                foundArray.push(myChannelArray[x]);
            }
        }
    }
    return foundArray;
}
function isBattling(src) {
    return [4, 5, 6, 7].contains(client.player(src).flags);
}
function isBotAuth(srcName) {
    return CONFIG.botAuthArray.contains(srcName.toLowerCase());
}
function isBotChannel(channelName) {
    return CONFIG.botChannelArray.contains(channelName.toLowerCase());
}
function isIdling(src) {
    return [1, 3, 5, 7].indexOf(client.player(src).flags) !== -1;
}
function isInChannel(src, channelId) {
    return client.channel(channelId).players().contains(src + "");
}
function isOffcialChannel(channelName) {
    return ["blackjack", "developer's den", "evolution game", "hangman", "indigo plateau", "mafia", "mafia review", "safari", "tohjo falls", "tournaments", "trivreview", "trivia", "victory road", "watch"].contains(channelName.toLowerCase());
}
function loadConfig() {
    if (sys.isSafeScripts()) {
        sendBotHtml("Unable to load settings. Please disable Safe Scripts.");
        return;
    }
    if (!sys.fileExists(CONSTANTS.configFile)) {
        sendBotHtml("No settings file found.");
    } else {
        try {
            var objData = JSON.parse(sys.getFileContent(CONSTANTS.configFile));
            fillObject(CONFIG, objData);
            CONFIG = objData;
            if (CONFIG.loadAlertEnabled) {
                sendBotHtml("Settings loaded.");
            }
        } catch (error) {
            sendBotHtml("Unknown error occurred. The settings file might be corrupted.");
        }
    }
    return;
}
function nameCheck(name) {
    if (name.length === 0) {
        return "Name not long enough.";
    }
    if (name.length > 20) {
        return "Name is " + name.length + "/20 too long.";
    }
    if (name.charAt(0) === "+") {
        return "'+' can't be used as the first letter.";
    }
    return true;
}
function poInfo(src, text) {
    return "<a href='po:info/" + src + "'>" + text + "</a>";
}
function poPm(src, text) {
    return "<a href='po:pm/" + src + "'>" + text + "</a>";
}
function poSend(link, text) {
    text = (text === undefined ? link : text);
    return "<a href='po:send/" + link + "'>" + text + "</a>";
}
function poWatch(src, text) {
    return "<a href='po:watchplayer/" + src + "'>" + text + "</a>";
}
function randomPoElement(obj) {
    // TESTED OBJECTS sys.ability, sys.gender, sys.item, sys.move, sys.nature, sys.pokemon
    var x = 0, elementArray = [];
    while (["Missingno", undefined, ""].indexOf(obj(x)) === -1 || x < 1) {
        elementArray[x] = obj(x);
        x++;
    }
    return elementArray[sys.rand(0, elementArray.length)];
}
function require(fileDir) {
    var exports = {};
    try {
        eval(sys.getFileContent(fileDir));
        return exports;
    } catch (error) {
        print("±Require: Error, unable to eval the file: " + fileDir + ", " + error.message);
        return {};
    }
}
function startUpDuration() {
    var diff = parseInt((new Date().getTime() / 1000) - (SESSION.startUpTime / 1000), 10),
        days = parseInt(diff / (60 * 60 * 24), 10),
        hours = parseInt((diff % (60 * 60 * 24)) / (60 * 60), 10),
        minutes = parseInt((diff % (60 * 60)) / 60, 10),
        seconds = (diff % 60);
    return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
}
function print(message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage(message, channelId, false);
    return;
}
function printHtml(message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage(message, channelId, true);
}
function saveConfig() {
    if (sys.isSafeScripts()) {
        sendBotHtml("Unable to save changes. Please disable Safe Scripts.");
        return;
    }
    buildDir();
    sys.writeToFile(CONSTANTS.configFile, JSON.stringify(CONFIG));
    if (CONFIG.saveAlertEnabled) {
        sendBotHtml("Settings saved.");
    }
    return;
}
function sendCostomHtml(title, message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage("<font color='" + CONFIG.botColor + "'><timestamp/><b>" + title + ":</font></b> " + message, channelId, true);
}
function sendBotHeader(text, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage("*** " + text + " ***", channelId, false);
    return;
}
function sendBotHtml(message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage("<font color='" + CONFIG.botColor + "'><timestamp/><b>" + CONFIG.botSymbol + CONFIG.botName + ":</font></b> " + message, channelId, true);
    return;
}
function sendBotMessage(channelId, message) {
    if (isNaN(channelId)) {
        return;
    }
    client.network().sendChanMessage(channelId, CONFIG.botSymbol + CONFIG.botName + ": " + message);
    return;
}
function sendBotText(message, channelId) {
    if (channelId === undefined) {
        channelId = client.currentChannel();
    }
    client.printChannelMessage(CONFIG.botSymbol + CONFIG.botName + ": " + message, channelId, false);
    return;
}
function sendMasterHtml(message) {
    var masterId = client.channelId(CONFIG.masterChannelName),
        baseMessage = "<font color='" + CONFIG.botColor + "'><timestamp/><b>" + CONFIG.botSymbol + CONFIG.botName + ":</font></b> " + message;
    if (CONFIG.masterChannelName === "") {
        client.printChannelMessage(baseMessage, client.currentChannel(), true);
    } else {
        if (isInChannel(client.ownId(), masterId)) {
            client.printChannelMessage(baseMessage, masterId, true);
            if (client.currentChannel() !== masterId) {
                client.printChannelMessage(baseMessage, client.currentChannel(), true);
            }
        } else {
            client.printChannelMessage(baseMessage, client.currentChannel(), true);
        }
    }
    return;
}
function sendMasterText(message) {
    var masterId = client.channelId(CONFIG.masterChannelName),
        baseMessage = CONFIG.botSymbol + CONFIG.botName + ": " + message;
    if (!CONFIG.masterChannelName) {
        client.printChannelMessage(baseMessage, client.currentChannel(), false);
    } else {
        if (isInChannel(client.ownId(), masterId)) {
            client.printChannelMessage(baseMessage, masterId, false);
            if (client.currentChannel() !== masterId) {
                client.printChannelMessage(baseMessage, client.currentChannel(), false);
            }
        } else {
            client.printChannelMessage(baseMessage, client.currentChannel(), false);
        }
    }
    return;
}
function sendMessage(channelId, message) {
    if (isNaN(channelId)) {
        return;
    }
    client.network().sendChanMessage(channelId, message);
    return;
}
function sendMe(channelId, message) {
    if (isNaN(channelId)) {
        return;
    }
    client.network().sendChanMessage(channelId, "/me " + message);
    return;
}
function spamBlockCoolDown() {
    SPAM_BLOCK.timerBlockDuraction = sys.setTimer(function () {
        SPAM_BLOCK.enabled = false;
        sendBotMessage(SPAM_BLOCK.occuredChannelId, "Bots have been re-enabled.");
    }, SPAM_BLOCK.timeDisabled, false);
}
function spamBlock(srcName, channelId) {
    if (!SPAM_BLOCK.enabled) {
        if (CONFIG.botChannelArray.contains(client.channelName(channelId))) {
            SPAM_BLOCK.messageCount++;
            if (SPAM_BLOCK.messageCount > SPAM_BLOCK.messageLimit) {
                SPAM_BLOCK.enabled = true;
                SPAM_BLOCK.messageCount = 0;
                sendBotMessage(channelId, "Bots are disabled for " + (SPAM_BLOCK.timeDisabled / 60000) + " minutes due to overuse.");
                SPAM_BLOCK.occuredChannelId = channelId;
                SPAM_BLOCK.occuredUserName = srcName;
                sendBotText("Spam Block has been turned on, in " + client.channelName(SPAM_BLOCK.occuredChannelId) + " by " + SPAM_BLOCK.occuredUserName + ".");
                spamBlockCoolDown();
            }
        }
    }
}
function welcomeMessage() {
    print("");
    if (CONFIG.welcomeMessage !== "none") {
        sendBotHtml(CONFIG.welcomeMessage);
    }
    sendBotHtml("<b>Nova's Client Script Alpha</b>");
    sendBotHtml("Use " + poSend(CONFIG.privateCommandSymbol + "help") + " for commands.");
    return;
}

var NOVA_C = {
	privateCommands: function (command, commandData, channelName, channelId) {
        if (command === "bauth") {
			if (!commandData) {
				sendBotText("Please input a user to auth.");
				return;
			}
			if (CONFIG.botAuthArray.add(commandData)) {
				sendBotHtml(commandData + " promoted to bot auth.");
			} else {
                sendBotHtml(commandData + " already bot auth.");
            }
			saveConfig();
			return;
		}
		if (command === "bauthoff") {
			if (!commandData) {
				sendBotText("Please input a user to deauth.");
				return;
			}
			if (CONFIG.botAuthArray.remove(commandData)) {
				sendBotHtml(commandData + " removed from bot auth.");
			} else {
                sendBotHtml(commandData + " isn't bot auth.");
            }
			saveConfig();
			return;
		}
        if (command === "bauths") {
            sendBotText("Current bauth: " + CONFIG.botAuthArray.join(", "));
            return;
        }
        if (command === "botchannel") {
            var input = (!commandData ? channelName : commandData);
            if (CONFIG.botChannelArray.add(input)) {
                sendBotHtml("<b>" + input + "</b> enabled for bot channels.");
            } else {
                sendBotHtml("<b>" + input + "</b> is a bot channel.");
            }
            saveConfig();
			return;
		}
        if (command === "botchannels") {
            sendBotText(CONFIG.botChannelArray.join(", "));
            return;
        }
		if (command === "botchanneloff") {
            var input = (!commandData ? channelName : commandData);
            if (CONFIG.botChannelArray.remove(input)) {
                sendBotHtml("<b>" + input + "</b> disabled for bot channels.");
            } else {
                sendBotHtml("<b>" + input + "</b> isn't a bot channel.");
            }
            saveConfig();
            return;
		}
        if (command === "caps") {
			if (commandData === "on") {
				CONFIG.removeCaps = true;
				sendBotHtml("Remove caps is on.");
				saveConfig();
				return;
			}
			if (commandData === "off") {
				CONFIG.removeCaps = false;
				sendBotHtml("Remove caps is off.");
				saveConfig();
				return;
			}
			sendBotHtml("Caps currently " + (CONFIG.removeCaps ? "on" : "off") + ".");
			return;
		}
        if (command === "changeauthsymbol" || command === "changeauthsym") {
            if (!commandData) {
                var array = CONFIG.authSymbolArray;
                sendBotHtml("Current auth symbols:");
                sendBotHtml("<b><font color='#ff0000'>" + array[0] + "</font></b>Member");
                sendBotHtml("<b><font color='#ff0000'>" + array[1] + "</font></b>Moderator");
                sendBotHtml("<b><font color='#ff0000'>" + array[2] + "</font></b>Administrator");
                sendBotHtml("<b><font color='#ff0000'>" + array[3] + "</font></b>Owner");
                sendBotHtml("<b><font color='#ff0000'>" + array[4] + "</font></b>Hidden");
                return;
            }
            if (commandData.indexOf("*") === -1) {
                sendBotHtml("Command data syntax: [auth]*[symbol]");
                return;
            }
            var dataArray = commandData.split("*", 2);
            if (isNaN(dataArray[0]) || dataArray[0] < 0 || dataArray[0] > 4) {
                sendBotHtml("Please enter a number range 0-4 for auth.");
                return;
            }
            if (dataArray[1].length > 5) {
                sendBotHtml("Please make the symbol 5 characters or less.");
                return;
            }
            CONFIG.authSymbolArray[dataArray[0]] = dataArray[1];
            saveConfig();
            return;
        }
        if (command === "changebotcolor" || command === "changebotcolour") {
			if (!commandData) {
				sendBotHtml("Current bot colo(u)r: " + CONFIG.botColor);
				return;
			}
			if (!sys.validColor(commandData)) {
				sendBotHtml("Invalid hex colo(u)r. Use hex command to help pick a colo(u)r.");
				return;
			}
			CONFIG.botColor = commandData;
			sendBotText("Bot colo(u)r changed to: " + commandData);
			saveConfig();
			return;
		}
        if (command === "changebotname") {
			if (!commandData) {
				sendBotHtml("Current bot name: <b>" + CONFIG.botName.htmlEscape() + "</b>");
				return;
			}
			if (commandData.length > 20) {
				sendBotHtml("Name is " + commandData.length + "/20 too long.");
				return;
			}
			CONFIG.botName = commandData;
			sendBotHtml("Bot name changed to " + commandData.htmlEscape());
			saveConfig();
			return;
		}
        if (command === "changebotsymbol") {
			if (!commandData) {
				sendBotHtml("Current bot name: " + CONFIG.botSymbol.htmlEscape());
				return;
			}
			if (commandData.length > 5) {
				sendBotHtml("Name is " + commandData.length + "/5 too long.");
				return;
			}
			CONFIG.botSymbol = commandData;
			sendBotHtml("Bot name changed to " + commandData.htmlEscape());
			saveConfig();
			return;
		}
        if (command === "changeflashcolor" || command === "changeflashcolour") {
			if (!commandData) {
				sendBotHtml("Current flash colo(u)r is: <b>" + CONFIG.flashColor + "</b>");
				return;
			}
			if (!sys.validColor(commandData)) {
				sendBotHtml("Invalid hex colo(u)r. Use hex command to help pick a colo(u)r.");
				return;
			}
			CONFIG.flashColor = commandData;
			sendBotHtml("Flash and Stalkword colo(u)r changed to: <b>" + commandData + "</b>");
			saveConfig();
			return;
		}
        if (command === "changename") {
            if (!commandData) {
                sendBotHtml("Current name: <b>" + client.ownName().htmlEscape() + "</b>");
                return;
            }
			if (commandData.toLowerCase() === client.ownName().toLowerCase()) {
                sendBotHtml("Your name is already: <b>" + client.ownName().htmlEscape() + "</b>");
				return;
            }
            var nameResult = nameCheck(commandData);
            if (nameResult !== true) {
                sendBotText(nameResult);
                return;
            }
            client.changeName(commandData);
            sendBotHtml("You changed your name to: <b>" + commandData.htmlEscape() + "</b>");
			return;
		}
        if (command === "changeprivatesymbol") {
            if (!commandData) {
                sendBotHtml("Current private command symbol: <b>" + CONFIG.privateCommandSymbol.htmlEscape() + "</b>");
                return;
            }
			if (commandData.length < 1 || commandData.length > 3) {
				sendBotHtml("Please insert a symbol between 1 to 3 characters.");
				return;
			}
			if (commandData.indexOf(" ") > -1) {
				sendBotHtml("The command symbol cannot contain spaces.");
				return;
			}
			CONFIG.privateCommandSymbol = commandData;
			sendBotHtml("Private command symbol changed to: <b>" + commandData.htmlEscape() + "</b>");
			saveConfig();
			return;
		}
        if (command === "changepublicsymbol") {
            if (!commandData) {
                sendBotHtml("Current public command symbol: <b>" + CONFIG.privateCommandSymbol.htmlEscape() + "</b>");
                return;
            }
			if (commandData.length < 1 || commandData.length > 3) {
				sendBotHtml("Please insert a symbol between 1 to 3 characters.");
				return;
			}
			if (commandData.indexOf(" ") > -1) {
				sendBotHtml("The command symbol cannot contain spaces.");
				return;
			}
			CONFIG.publicCommandSymbol = commandData;
			sendBotHtml("Public command symbol changed to: <b>" + commandData.htmlEscape() + "</b>");
			saveConfig();
			return;
		}
		if (command === "changewelcomemessage") {
			if (!commandData) {
				sendBotText("Please enter a welcome message. HTML can be used here but don't forget to close the tags. Has to have less than 1000 characters. Enter \"none\" for no welcome message. Enter 'reset' as command data to reset to default setting.");
				sendBotHeader("Example HTML Tags");
				sendBotHtml("&lt;b&gt;<b>bold</b>&lt;/b&gt;");
				sendBotHtml("&lt;i&gt;<i>italics</i>&lt;/i&gt;");
				sendBotHtml("&lt;u&gt;<u>underline</u>&lt;/u&gt;");
				sendBotHtml("&lt;font color=\"#AA00AA\"&gt;<font color=\"#AA00AA\">purple text</font>&lt;/font&gt;");
				sendBotHeader("Example Pokémon");
				sendBotHtml("<img src=\"pokemon:num=359-1&gen=6&shiny=false&back=false\">");
				sendBotText("<img src=\"pokemon:num=359-1&gen=6&shiny=false&back=false\">");
				sendBotHeader("Explanation");
				sendBotHtml("num=<b>359</b> is the Pokémon's Pokédex number to use. The <b>-1</b> being the alternative form.");
				sendBotHtml("gen=<b>4</b> is the Pokémon's generation sprite to use.");
				sendBotHtml("shiny=<b>false</b> is the Pokémon shiny? true/false");
				sendBotHtml("back=<b>false</b> use the Pokémon's back sprite? true/false");
				return;
			}
			if (commandData.length > 1000) {
				sendBotText("Welcome message to long, please make it shorter. (" + commandData.length + "/1000)");
				return;
			}
            if (commandData === "reset") {
				CONFIG.welcomeMessage = "<img src='pokemon:num=359-1&gen=6&shiny=false&back=false'>";
				sendBotHtml(CONFIG.welcomeMessage);
                sendBotHtml("Welcome message reset to default.");
			} else if (commandData === "none") {
                CONFIG.welcomeMessage = "none";
                sendBotHtml("Welcome message removed.");
            } else {
                CONFIG.welcomeMessage = commandData;
                sendBotHtml(CONFIG.welcomeMessage);
                sendBotHtml("Welcome message changed.");
            }
			saveConfig();
			return;
		}
        if (command === "channelplayer" || command === "channelplayers") {
			var namesArray = channelPlayerNames(channelId);
			sendBotText("There are " + namesArray.length + " users that are currently in " + channelName + ". The users are: " + namesArray.sort().join(", "));
			return;
		}
        if (command === "cp") {
            if (!commandData) {
                sendBotText("Please enter a user name. Server commands won't show unless you're an auth.");
                return;
            }
            if (commandData.indexOf("%") > -1) { // DECODES PO:SEND URLS
                commandData = decodeURIComponent(commandData);
            }
            if (!client.playerExist(client.id(commandData))) {
                sendBotHtml("User <b>" + commandData.htmlEscape() + "</b> doesn't exist or isn't currently logged in one of your channels.");
                return;
            }
            var userId = client.id(commandData),
                privateSymbol = CONFIG.privateCommandSymbol;
            print("");
            sendBotHtml("User: <b>" + client.name(userId).htmlEscape() + "</b> (Id: " + userId + ")");
            sendBotHtml("[Channel: " + poSend("/ck " + commandData, "Kick") + " | " + poSend("/lt " + commandData, "☛♥") + " ] " + (client.ownAuth() > 0 ? "[Server: " + poSend("/k " + commandData, "Kick") + " ]" : ""));
            sendBotHtml("[" + (isBattling(userId) ? poWatch(userId, "In Battle") : "Not Battling") + "] [PM: " + (SESSION.pmTempIgnoreArray.contains(commandData.toLowerCase()) === false ? poSend(privateSymbol + "temppmignore " + commandData, "Temp Ignore") : poSend(privateSymbol + "temppmignoreoff " + commandData, "Unignore")) + " ]");
            return;
        }
        if (command === "eval" || command === "evalp") {
			if (!commandData) {
				sendBotHtml("Enter a script value to print. Proceed with caution using this.");
				return;
			}
			try {
                sendBotText("Eval: " + commandData);
                var value = eval(commandData);
                if (command === "evalp") {
                    sendBotText("Type: '" + (typeof value) + "'");
                    sendBotText("Value: '" + value + "'");
                }
			} catch (error) {
				sendBotText(error);
			}
			return;
		}
        if (command === "friend") {
			if (!commandData) {
				sendBotHtml("Please input a user to add to friends list.");
				return;
			}
			if (CONFIG.friendArray.add(commandData)) {
				sendBotHtml("<b>" + commandData.htmlEscape() + "</b> added to friends list.");
			} else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> is already on the friends list.");
            }
			saveConfig();
			return;
		}
		if (command === "friendoff") {
			if (!commandData) {
				sendBotHtml("Please input a user to friend remove.");
				return;
			}
			if (CONFIG.friendArray.remove(commandData)) {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> removed from friends list.");
			} else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> isn't on the friends list.");
            }
            saveConfig();
			return;
		}
        if (command === "friends") {
			var x, listArray = [], length = CONFIG.friendArray.length;
			for (x = 0; x < length; x++) {
				if (client.playerExist(client.id(CONFIG.friendArray[x]))) {
					listArray.push(poPm(client.id(CONFIG.friendArray[x]), CONFIG.friendArray[x]) + " (<font color='#00aa00'>Online</font>)");
				} else {
					listArray.push(CONFIG.friendArray[x] + " (<font color='#ff0000'>Offline</font>)");
				}
			}
			sendBotHtml("Friends list: " + listArray.join(", "));
			return;
		}
        if (command === "gm") {
            var x,
                channelArray = client.myChannels(),
                length = channelArray.length,
                ignoreArray = [];
			if (!commandData) {
				sendBotHtml("Please enter a message to global send.");
				return;
			}
			for (x = 0; x < length; x++) {
				if (isOffcialChannel(channelArray[x])) {
					sendMessage(client.channelId(channelArray[x]), "[Global Message] " + commandData);
				} else {
                    ignoreArray.push(channelArray[x]);
				}
			}
            if (ignoreArray.length > 0) {
                sendBotHtml("Global messages were ignored in: " + ignoreArray.sort().join(", "));
            }
			return;
		}
        if (command === "help" || command === "commands") {
            var x,
                y,
                length,
                helpArray = [],
                privateSymbol = CONFIG.privateCommandSymbol,
                publicSymbol = CONFIG.publicCommandSymbol;
            if (!commandData) {
                sendBotHeader("Nova Client Script Alpha");
                helpArray = [
                    "channelplayer(s): Prints a list of names of players in channel.",
                    "cp [user]: Prints commands to perform on target.",
                    "gm [message]: Sends a global message to all channels you are currently in, excluding official ones.",
                    "hex [colo(u)r name]: Prints the hex of a color name. Doesn't have all colors.",
                    "memberall[off]: Adds/Removes all current channel members.",
                    "kickall: Kicks all users except self from channel.",
                    "linkshorten [link]: Prints a shorten version of a web link.",
                    "lookup [user]: Reveals detailed information about the user.",
                    "mc [command]:[name1, name2, name3...]: Performs a multi command on a list of users, separated by comma and space, at once.",
                    "mcstop: Stops a current Multi Command running.",
                    "pm [user]: PM a user.",
                    "reconnect: Reconnect to the server.",
                    "reverse[p] [message]: Send reverse message. reversep to test.",
                    "session: Display session info.",
                    "sing [lyrics]: Send sing message. Can add notes in middle with *.",
                    "stick[a] [target]: Pokes a user with a stick.",
                    "symbol(s): Displays an input panel of symbols."
                ];
            }
            if (commandData === "advanced") {
                sendBotHeader("Advanced");
                helpArray = [
                    "eval[p] [script]: Run script eval. Use with caution.",
                    "obj[p] [script object]: Display object properties and values. Exaple: client, global, sys",
                    "printhtml [html]: Prints HTML message that only you can see.",
                    "webcall [link]: Downloads and prints data from the web."
                ];
            }
            if (commandData === "plugins") {
                sendBotHeader("Plugins");
                helpArray = [
                    "plugindisable [plugin]: Disable the plugin.",
                    "plugindownload [url]: Downloads a plugin. " + CONFIG.privateCommandSymbol + "pluginserver recommended.",
                    "pluginenable [plugin]: Enables the plugin.",
                    "plugins: Displays current plugins and status.",
                    "pluginserver: Downloads list of plugins available.",
                    "pluginuninstall [plugin]: Disables and uninstalls the plugin."
                ];
            }
            if (commandData === "settings") {
                sendBotHeader("Settings");
                helpArray = [
                    "bauth[off] [user]: Add/Remove bot auth.",
                    "bauths: View current bot auth.",
                    "botchannel[off] [channel]: Add/Remove bot channel.",
                    "botchannels: Lists bot channels.",
                    "caps [off/on]: Remove caps from your messages. This doesn't include bot commands.",
                    "changename [name]: Changes name to input.",
                    "changeauthsymbol [auth]*[symbol]: Changes the auth symbol in messages.",
                    "changebotcolo(u)r [color/hex]: Changes bot color.",
                    "changebotname [name]: Changes the bot name.",
                    "changebotsymbol [name]: Changes the bot symbol.",
                    "changeflashcolo(u)r [hex]: Changes flash/stalkword color.",
                    "changewelcomemessage [new message/none/reset]: Changes the welcome message. Enter no command data for help.",
                    "changeprivatesymbol [symbol]: Changes the owner's command symbol.",
                    "changepublicsymbol [symbol]: Changes the public command symbol.",
                    "friends: Displays your friends and their online status.",
                    "friend[off]: Add/Remove friend.",
                    "idle [on/off]: Turns idle on or off.",
                    "ignores: Displays your ignore list.",
                    "ignore[off]: Add/Remove user ignore.",
                    "loadalert(s) [on/off]: Turn load notifications of or off.",
                    "masterchannel [name]: Sets a channel where some bot log messages are relayed.",
                    "masterchanneloff: Turns off master channel.",
                    "nochallenge(s) [on/off]: Auto refuse challenges even when not idle.",
                    "save: Manually save script settings.",
                    "savealert [on/off]: Turn save notifications on or off.",
                    "settingsexport: Prints an export code of your settings to be able to import later. Be aware, this doesn't include plugin data.",
                    "settingsimport [code]: Imports an exported settings code.",
                    "spam [off]: Manually disable SpamBlock.",
                    "stalkwords: Displays your current stalkwords.",
                    "stalkword[off] [word]: Add/Remove stalkwords."
                ];
            }
            length = helpArray.length;
            for (x = 0; x < length; x++) {
                print(privateSymbol + helpArray[x]);
            }
            var otherArray = ["advanced", "plugins", "settings"],
                pluginFound = false;
            length = otherArray.length;
            if (commandData === "") {
                sendBotHeader("Other Commands");
                for (x = 0; x < length; x++) {
                    printHtml("<timestamp/>" + poSend(privateSymbol + "help " + otherArray[x]));
                }
                var plugins = PLUGINS.cache;
                sendBotHeader("Plugins");
                for (x in plugins) {
                    if (plugins[x].help !== undefined) {
                        if (plugins[x].help.name !== undefined) {
                            printHtml("<timestamp/>" + poSend(privateSymbol + "help " + plugins[x].help.name));
                            pluginFound = true;
                        }
                    }
                }
                if (pluginFound === false) {
                    print("<no plugin help found>");
                }
                return;
            }
            if (otherArray.contains(commandData.toLowerCase())) {
                return;
            }
            var help;
            for (x in PLUGINS.cache) {
                if (PLUGINS.cache[x].help !== undefined) {
                    help = PLUGINS.cache[x].help;
                    if (!help.header || !help.name || !help.privateArray || !help.publicArray) {
                        sendBotText("Plugin Help: Issue with accessing " + x + " help.");
                        continue;
                    }
                    if (help.name === commandData.toLowerCase()) {
                        sendBotHeader(help.header);
                        length = help.privateArray.length;
                        for (y = 0; y < length; y++) {
                            print(privateSymbol + help.privateArray[y]);
                        }
                        if (help.publicArray[0] !== undefined) {
                            sendBotHtml("Public commands: " + publicSymbol + help.publicArray.join(", " + publicSymbol));
                            return;
                        }
                        return;
                    }
                }
            }
            sendBotHtml("No help available for <b>" + commandData.htmlEscape() + "</b>.");
            return;
		}
        if (command === "hex") {
			if (!commandData) {
				sendBotHtml("Please enter a color name.");
				return;
			}
            if (!sys.validColor(commandData)) {
                sendBotHtml("Invalid color.");
                return;
            }
			sendBotHtml("Colo(u)r: <b>" + sys.hexColor(commandData) + "</b>");
			return;
		}
        if (command === "idle") {
			if (commandData === "on") {
				client.goAway(true);
				sendBotHtml("Idling on.");
				return;
			}
			if (commandData === "off") {
				client.goAway(false);
				sendBotHtml("Idling off.");
				return;
			}
			sendBotHtml("Idle is currently: <b>" + (client.away() ? "on" : "off") + "</b>");
			return;
		}
        if (command === "ignores") {
			sendBotText("Ignore list: " + CONFIG.ignoreArray.join(", "));
			return;
		}
		if (command === "ignore") {
			if (!commandData) {
				sendBotText("Please input an user to ignore.");
				return;
			}
			client.ignore(client.id(commandData), true);
			if (CONFIG.ignoreArray.add(commandData)) {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> added to ignore.");
			} else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> already ignored.");
            }
			saveConfig();
			return;
		}
		if (command === "ignoreoff") {
			if (!commandData) {
				sendBotText("Please input a user to unignore.");
				return;
			}
			client.ignore(client.id(commandData), false);
			if (CONFIG.ignoreArray.remove(commandData)) {
				sendBotHtml("<b>" + commandData.htmlEscape() + "</b> removed from ignore.");
			} else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> isn't ignored.");
            }
			saveConfig();
			return;
		}
		if (command === "nochallenge") {
			if (commandData === "on") {
				CONFIG.ignoreChallenge = true;
				sendBotHtml("Ignore challenges: <b>on</b>");
				saveConfig();
				return;
			}
			if (commandData === "off") {
				CONFIG.ignoreChallenge = false;
				sendBotHtml("Ignore challenges: <b>off</b>");
				saveConfig();
				return;
			}
			sendBotHtml("Ignore challenges currently: <b>" + (CONFIG.ignoreChallenge ? "on" : "off") + "</b>");
			return;
		}
        if (command === "kickall") {
			var x, playerNamesArray = channelPlayerNames(channelId);
			if (commandData === "confirm") {
				sendBotHtml("Performing /ck on all players in " + channelName + "...");
				for (x = 0; x < playerNamesArray.length; x++) {
					if (x > 40) {
						sendBotText("Kick limit of 40 reached. Operation stopped.");
						return;
					}
					if (playerNamesArray[x] === client.ownName()) {
						continue;
					}
					sendMessage(channelId, "/ck " + playerNamesArray[x]);
				}
				sendBotHtml("Completed.");
				return;
			}
			sendBotHtml("Warning: This will kick everyone from the channel. Please enter 'confirm', without the quotes, as data input after the command to perform the action.");
			return;
		}
        if (command === "linkshorten") {
            if (!commandData) {
                sendBotHtml("Enter a link to shorten.");
                return;
            }
			try {
				// THIS API USES Strudels's USER NAME AND KEY FOR https://bitly.com/
				var apiUser = "strudelspo",
                    apiKey = "R_d6acf3bcdd39459cbb522f90465c1d9c",
                    format = "txt";
                sys.webCall("http://api.bit.ly/shorten?login=" + apiUser + "&apiKey= " + apiKey + "&format=" + format + "&longUrl=" + commandData, function (response) {
                    if (response === "INVALID_URI") {
                        sendBotHtml("Invalid URL.");
                        return;
                    }
                    sendBotText(response);
                    return;
                });
			} catch (error) {
				sendBotText(error);
			}
            return;
		}
        if (command === "loadalert" || command === "loadalerts") {
            if (commandData === "on") {
                CONFIG.loadAlertEnabled = true;
                sendBotHtml("Load alerts: <b>on</b>");
                saveConfig();
                return;
            }
            if (commandData === "off") {
                CONFIG.loadAlertEnabled = false;
                sendBotHtml("Load alerts: <b>off</b>");
                saveConfig();
                return;
            }
            sendBotHtml("Load alerts currently: <b>" + (CONFIG.loadAlertEnabled === true ? "on" : "off") + "</b>");
            return;
        }
        if (command === "lookup") {
            if (!commandData) {
                sendBotHtml("Please enter a user name.");
                return;
            }
            if (commandData.indexOf("%") > -1) { // DECODES PO:SEND URLS
                commandData = decodeURIComponent(commandData);
            }
            if (!client.playerExist(client.id(commandData))) {
                sendBotHtml("User <b>" + commandData.htmlEscape() + "</b> doesn't exist or isn't currently logged in.");
                return;
            }
            var tar = client.id(commandData),
                serverAuthNameArray = ["User", "Moderator", "Administrator", "Owner", "Hidden"],
                flagArray = [];
            flagArray[0] = "Idle Off | Ladder Off | Not In Battle";
            flagArray[1] = "Idle On | Ladder Off | Not In Battle";
            flagArray[2] = "Idle Off | Ladder On | Not In Battle";
            flagArray[3] = "Idle On | Ladder On | Not In Battle";
            flagArray[4] = "Idle Off | Ladder Off | " + poWatch(tar, "In Battle");
            flagArray[5] = "Idle On | Ladder Off | " + poWatch(tar, "In Battle");
            flagArray[6] = "Idle Off | Ladder On | " + poWatch(tar, "In Battle");
            flagArray[7] = "Idle On | Ladder On | " + poWatch(tar, "In Battle");
            var preColorArray = ["#5811b1", "#399bcd", "#0474bb", "#f8760d", "#a00c9e", "#0d762b", "#5f4c00", "#9a4f6d", "#d0990f", "#1b1390", "#028678", "#0324b1"];
            sendBotHtml("User: " + client.name(tar).htmlEscape() + " (Id: " + tar + ")");
            sendBotHtml("Avatar No: " + client.player(tar).avatar + " | " + "Color: " + client.color(tar) + (preColorArray.contains(toString(client.color(tar))) ? " [pre]" : "") + " | " + "Auth: " + serverAuthNameArray[client.auth(tar)] + " [" + client.auth(tar) + "]");
            sendBotHtml("Flags: " + flagArray[client.player(tar).flags] + " | Flag Bit: " + client.player(tar).flags);
            sendBotHtml("Tiers: " + client.tiers(tar).join(", "));
            sendBotText("Channels: " + "#" + inChannels(tar).sort().join(", #"));
            sendBotHtml("Trainer Information: " + client.player(tar).info.htmlEscape());
            sendBotHtml("[Channel: " + poSend("/ck " + commandData, "Kick") + " | " + poSend("/lt " + commandData, "☛♥") + " ] [Server: " + poSend("/k " + commandData, "Kick") + " ]");
            return;
        }
        if (command === "masterchannel") {
            if (!commandData) {
                sendBotHtml("Current channel: " + (!CONFIG.masterChannelName ? "<no channel>".htmlEscape() : "<b>" + CONFIG.masterChannelName + "</b>"));
                return;
            }
            var checkedName = nameCheck(commandData);
            if (checkedName !== true) {
                sendBotHtml(checkedName);
                return;
            }
            CONFIG.masterChannelName = commandData.toLowerCase();
            sendBotHtml("Master channel set to: <b>" + getChannel(commandData) + "</b>");
            saveConfig();
            return;
        }
        if (command === "masterchanneloff") {
            CONFIG.masterChannelName = commandData.toLowerCase();
            sendBotHtml("Master channel: <b>off</b>");
            saveConfig();
            return;
        }
        if (command === "memberall") {
			var x, playerNamesArray = channelPlayerNames(channelId);
			sendBotText("Performing /member on all players in " + channelName + "...");
			for (x = 0; x < playerNamesArray.length; x++) {
				if (x > 40) {
					sendBotText("Operation aborted due to exceeding 40 members.");
					return;
				}
				sendMessage(channelId, "/member " + playerNamesArray[x]);
			}
			sendBotText("Done.");
			return;
		}
		if (command === "memberalloff") {
			var x, playerNamesArray = channelPlayerNames(channelId);
			sendBotText("Performing /demember on all players in " + channelName + "...");
			for (x = 0; x < playerNamesArray.length; x++) {
				if (x > 40) {
					sendBotText("Operation aborted due to exceeding 40 members.");
					return;
				}
				sendMessage(channelId, "/demember " + playerNamesArray[x]);
			}
			sendBotText("Done.");
			return;
		}
        if (command === "mc") {
			if (TEMP.isScriptBusy) {
				sendBotText("Already busy performing: " + TEMP.currentAction);
				return;
			}
			if (!commandData || commandData.indexOf("*") === -1) {
				sendBotText("Command syntax: " + CONFIG.privateCommandSymbol + "mc command*value1, value2");
                return;
			}
            var dataArray = commandData.split("*", 2),
				multiCommand = dataArray[0],
				multiDataArray = (dataArray[1]).split(", "),
                loopCount = 0,
                loopLength = multiDataArray.length,
                multiTime = multiDataArray.length * 2;
            TEMP.currentAction = "Multi Command";
			TEMP.isScriptBusy = true;
			sendBotHtml("Performing <b>" + multiCommand.htmlEscape() + "</b> on " + loopLength + " users. This will take " + multiTime + " seconds.");
			multiCommandLoopTImer = sys.setTimer(function () {
				sendMessage(channelId, multiCommand + " " + multiDataArray[loopCount]);
                loopCount++;
				if (loopCount >= loopLength) {
                    TEMP.currentAction = "";
					TEMP.isScriptBusy = false;
					sendBotText("Done.");
					sys.unsetTimer(multiCommandLoopTImer);
				}
			}, 2000, true);
			return;
		}
        if (command === "mcstop") {
			if (TEMP.isScriptBusy) {
				sys.unsetTimer(multiCommandLoopTImer);
				TEMP.currentAction = "";
                TEMP.isScriptBusy = false;
				sendBotText("Multi Command stopped.");
				return;
			}
			sendBotText("No Multi Command currently running.");
			return;
		}
        if (command === "obj" || command === "objp") {
            if (!commandData) {
                sendBotHtml("Enter an object to print. Example: global or sys.");
                return;
            }
            try {
                var x, objKeys = Object.keys(eval(commandData));
                sendBotHtml("Printing " + commandData + ".keys");
                for (x = 0; x < objKeys.length; x++) {
                    print("." + objKeys[x] + (command === "objp" ? ": " + eval(commandData)[objKeys[x]] : ""));
                }
                sendBotHtml("Done.");
            } catch (error) {
                sendBotHtml(error);
            }
            return;
        }
        if (command === "plugindisable") {
            if (!commandData) {
                sendBotHtml("Please enter a plugin file.");
                return;
            }
            PLUGINS.disable(commandData);
            return;
        }
        if (command === "plugindownload") {
            if (!commandData) {
                sendBotHtml("Enter the plugin URL to download and install.");
                return;
            }
            PLUGINS.download(commandData);
            return;
        }
        if (command === "pluginenable") {
            if (!commandData) {
                sendBotHtml("Please enter a plugin file.");
                return;
            }
            PLUGINS.enable(commandData);
            return;
        }
        if (command === "pluginuninstall") {
            if (!commandData) {
                sendBotHtml("Please enter a plugin file.");
                return;
            }
            PLUGINS.unInstall(commandData);
            return;
        }
        if (command === "plugins") {
            PLUGINS.view();
            return;
        }
        if (command === "pluginserver") {
            PLUGINS.serverCall();
            return;
        }
        if (command === "pm") {
			if (!commandData) {
				sendBotHtml("Enter a user to PM.");
				return;
			}
			if (!client.playerExist(client.id(commandData))) {
				sendBotHtml("Target doesn't exist or isn't logged on.");
				return;
			}
			if (client.ownName().toLowerCase() === commandData.toLowerCase()) {
				sendBotHtml("You cannot PM yourself.");
				return;
			}
			client.startPM(client.id(commandData));
			return;
		}
        if (command === "printhtml") {
            if (!commandData) {
                sendBotHtml("Enter HTML.");
                return;
            }
            sendBotHtml(commandData);
            return;
        }
        if (command === "publiccommands") {
            if (commandData === "on") {
                CONFIG.publicCommandsEnabled = true;
                sendBotHtml("Public commands: <b>on</b>");
                saveConfig();
                return;
            }
            if (commandData === "off") {
                CONFIG.publicCommandsEnabled = false;
                sendBotHtml("Public commands: <b>off</b>");
                saveConfig();
                return;
            }
            sendBotHtml("Public commands currently: <b>" + (CONFIG.publicCommandsEnabled ? "enabled" : "disabled") + "</b>");
            return;
        }
        if (command === "reconnect") {
			client.reconnect();
            sendBotHtml("Reconnecting.");
			return;
		}
        if (command === "reverse" || command === "reversep") {
            if (!commandData) {
                sendBotHtml("Enter a message to reverse.");
                return;
            }
            if (command === "reverse") {
                sendMessage(channelId, commandData.split("").reverse().join(""));
            } else {
                sendBotText(commandData.split("").reverse().join(""));
            }
            return;
        }
        if (command === "save") {
            if (!CONFIG.saveAlertEnabled) {
                sendBotHtml("Settings saved");
            }
            saveConfig();
            return;
        }
        if (command === "savealert" || command === "savealerts") {
            if (commandData === "on") {
                CONFIG.saveAlertEnabled = true;
                sendBotHtml("Save alerts: <b>on</b>");
                saveConfig();
                return;
            }
            if (commandData === "off") {
                CONFIG.saveAlertEnabled = false;
                sendBotHtml("Save alerts: <b>off</b>");
                saveConfig();
                return;
            }
            sendBotHtml("Save alerts currently: <b>" + (CONFIG.saveAlertEnabled ? "on" : "off") + "</b>");
            return;
        }
        if (command === "settingsexport") {
            printHtml("<hr color=red>" + JSON.stringify(CONFIG).htmlEscape() + "<hr>");
            sendBotHtml("Copy and use the following code above to load your current settings again with <b>" + CONFIG.privateCommandSymbol.htmlEscape() + "settingsimport [data]</b>.");
            return;
        }
        if (command === "settingsimport") {
            try {
                var importObject = JSON.parse(commandData);
                fillObject(CONFIG, importObject);
                CONFIG = importObject;
                sendBotHtml("Import successful. If settings are okay, be sure to <b>" + CONFIG.privateCommandSymbol.htmlEscape() + "save</b> for data to be kept.");
            } catch (error) {
                sendBotText("Error importing settings. Detail: " + error);
            }
            return;
        }
        if (command === "session") {
            var x,
                length,
                pmTempIgnoreArray = [],
                symbol = CONFIG.privateCommandSymbol;
            length = SESSION.pmTempIgnoreArray.length;
            for (x = 0; x < length; x++) {
                pmTempIgnoreArray.push(poSend(symbol + "temppmignoreoff " + SESSION.pmTempIgnoreArray[x], SESSION.pmTempIgnoreArray[x]));
            }
            print("*** Session ***");
            sendCostomHtml("Challenges Auto Ignored", SESSION.challengeAutoIgnoreCount);
            sendCostomHtml("PM Count", SESSION.pmCount);
            sendCostomHtml("Script Updates", SESSION.scriptUpdateCount);
            sendCostomHtml("Startup Duration", startUpDuration());
            sendCostomHtml("Temp PM Ignored Users", (pmTempIgnoreArray.length > 0 ? pmTempIgnoreArray.join(", ") : "<none>"));
            return;
        }
        if (command === "stick" || command === "sticka") {
            if (!commandData) {
                sendBotHtml("Choose a target to poke.");
                return;
            }
            if (command === "stick") {
                sendMe(channelId, "poked " + commandData + " with their stick.");
            } else {
                sendMessage(channelId, "*poked " + commandData + " with their stick.*");
            }
            return;
        }
		if (command === "stalkwords") {
			sendBotText("Stalkwords: " + CONFIG.stalkWordArray.join(", "));
			return;
		}
		if (command === "stalkword") {
			if (!commandData) {
				sendBotHtml("Please input a stalkword to add.");
				return;
			}
			if (CONFIG.stalkWordArray.add(commandData)) {
				sendBotHtml("<b>" + commandData.htmlEscape() + "</b> added to stalkwords.");
			} else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> already in stalkwords.");
            }
			saveConfig();
			return;
		}
		if (command === "stalkwordoff") {
			if (!commandData) {
				sendBotText("Please input a stalkword to remove.");
				return;
			}
			if (CONFIG.stalkWordArray.remove(commandData)) {
				sendBotHtml("<b>" + commandData.htmlEscape() + "</b> removed from stalkwords.");
			} else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> isn't in stalkwords.");
            }
			saveConfig();
			return;
		}
		if (command === "spam") {
			if (commandData === "off") {
				if (SPAM_BLOCK.enabled) {
					sys.unsetTimer(SPAM_BLOCK.timerBlockDuraction);
					SPAM_BLOCK.enabled = false;
					SPAM_BLOCK.messageCount = 0;
					sendBotMessage(channelId, "Spam Block as been manually disabled.");
					return;
				}
				sendBotText("Spam Block isn't on.");
				return;
			}
		}
		if (command === "symbols" || command === "symbol") {
			var x,
                symbolArray = [
                    "♩", "♪", "♫", "♬", // MUSIC NOTES
                    "Ω" // GREEK
                ],
                newMessage = "";
			for (x = 0; x < symbolArray.length; x++) {
				newMessage = newMessage + " <a href='po:appendmsg/ " + symbolArray[x] + "'><font size='4'>[" + symbolArray[x] + "]</font></a>";
			}
			sendBotHtml(newMessage);
			return;
		}
        if (command === "temppmignore") {
            if (!commandData) {
                sendBotHtml("Enter user to temp PM ignore. Lasts till client close.");
                return;
            }
            if (commandData.toLowerCase() === client.ownName().toLowerCase()) {
                sendBotHtml("Can't temp PM ignore yourself.");
                return;
            }
            if (SESSION.pmTempIgnoreArray.add(commandData)) {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> temp PM ignored.");
            } else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> already PM ignored.");
            }
            return;
        }
        if (command === "temppmignoreoff") {
            if (!commandData) {
                sendBotHtml("Enter user to temp PM unignore.");
                return;
            }
            if (SESSION.pmTempIgnoreArray.remove(commandData)) {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> temp PM unignored.");
            } else {
                sendBotHtml("<b>" + commandData.htmlEscape() + "</b> isn't PM ignored.");
            }
            return;
        }
		if (command === "tourround") {
			if (commandData === "on") {
				CONFIG.tourRoundAlertEnabled = true;
				sendBotHtml("Tournaments round notification: <b>on</b>");
				saveConfig();
				return;
			}
			if (commandData === "off") {
				CONFIG.tourRoundAlertEnabled = false;
				sendBotHtml("Tournaments round notification: <b>off</b>");
				saveConfig();
				return;
			}
			sendBotHtml("Tournaments round notification currently <b>" + (CONFIG.tourRoundAlertEnabled ? "on" : "off") + "</b>");
			return;
		}
        if (command === "sing") {
            var notesArray = ["♩", "♪", "♫", "♬"],
                newMessage = commandData.replace(/\*/g, function () {
                    return " " + notesArray.random() + " ";
                });
            sendMessage(channelId, notesArray.random() + " " + newMessage + " " + notesArray.random());
            return;
        }
        if (command === "webcall") {
			if (!commandData) {
				sendBotText("Enter a web address to webcall.");
				return;
			}
			try {
				sys.webCall(commandData, function (response) {
                    sendBotText(response);
                    return;
                });
			} catch (error) {
				sendBotText(error);
			}
            return;
		}
		return false;
	},
	publicCommands: function (command, commandData, srcName, src, channelName, channelId) {
        if (SPAM_BLOCK.enabled && client.ownName() !== srcName) {
            return false;
        }

        if (isBotAuth(srcName) || srcName === client.ownName() || client.auth(src) > 0) {
            if (command === "passbauth" || command === "passbotauth") {
                if (srcName === client.ownName()) {
                    sendBotMessage(channelId, "Bot owner can't pass their own auth.");
                    return;
                }
                if (!isBotAuth(srcName.toLowerCase())) {
                    sendBotMessage(channelId, "You're not a bot auth.");
                    return;
                }
                var nameResult = nameCheck(commandData);
                if (nameResult !== true) {
                    sendBotMessage(channelId, nameResult);
                    return;
                }
                CONFIG.botAuthArray.remove(srcName);
                CONFIG.botAuthArray.add(commandData);
                sendBotMessage(channelId, srcName + " has passed on their bot auth to " + commandData + ".");
                sendBotHtml(srcName + " passed their bauth to " + commandData, client.channelId(CONFIG.masterChannelName) + ".");
                saveConfig();
                return;
            }
            if (command === "bot") {
                if (commandData === "on") {
                    if (isOffcialChannel(channelName)) {
                        sendBotHtml(srcName + " attempted to enable bots in official channel.", client.channelId("Chronoplast Chamber"));
                        sendBotHtml(srcName + " attempted to enable bots in official channel.");
                        return;
                    }
                    if (isBotChannel(channelName)) {
                        sendBotMessage(channelId, "Bots are already enabled.");
                        return;
                    }
                    CONFIG.botChannelArray.add(channelName);
                    sendBotHtml(srcName + " enabled bots in " + channelName + ".", client.channelId("Chronoplast Chamber"));
                    sendBotMessage(channelId, channelName + " now allowing bots.");
                    saveConfig();
                    return;
                }
                if (commandData === "off") {
                    if (!isBotChannel(channelName)) {
                        sendBotMessage(channelId, channelName + " isn't currently in the allowed list for bots.");
                        return;
                    }
                    CONFIG.botChannelArray.remove(channelName);
                    sendBotHtml(srcName + " disabled bots in " + channelName + ".", client.channelId("Chronoplast Chamber"));
                    sendBotMessage(channelId, channelName + " now disallowing bots.");
                    saveConfig();
                    return;
                }
            }
        }

        if (!isBotChannel(channelName)) {
            return false;
        }

        if (command === "bauth") {
            sendMe(channelId, "Auth for Bots are: " + CONFIG.botAuthArray.join(", "));
            return;
        }
        if (command === "help" || command === "commands") {
            var x,
                helpArray = ["bauth"],
                commandArray = [],
                symbol = CONFIG.publicCommandSymbol;
            if (commandData === "") {
                for (x in PLUGINS.cache) {
                    if (PLUGINS.cache[x].help !== undefined) {
                        if (PLUGINS.cache[x].help.name !== undefined) {
                            if (PLUGINS.cache[x].help.publicArray[0] !== undefined) {
                                helpArray.push(PLUGINS.cache[x].help.name);
                            }
                        }
                    }
                }
                sendBotMessage(channelId, symbol + "help " + helpArray.join(", " + symbol + "help "));
                return;
            }
            if (["bauth"].contains(commandData.toLowerCase())) {
                commandArray = ["bot on/off", "passbauth name"];
                sendBotMessage(channelId, symbol + commandArray.join(", " + symbol));
                return;
            }
            var help;
            for (x in PLUGINS.cache) {
                if (PLUGINS.cache[x].help !== undefined) {
                    help = PLUGINS.cache[x].help;
                    if (help.name === commandData.toLowerCase()) {
                        sendBotMessage(channelId, symbol + help.publicArray.join(", " + symbol));
                        return;
                    }
                }
            }
            return;
        }
        return false;
    }
};

var PLUGINS = {
    cache: {},
    call: function (event) {
        var x, length = arguments.length, newArg = [], result;
        for (x = 0; x < length; x++) {
            newArg[x] = arguments[x];
        }
        newArg.splice(0, 1);
        for (x in this.cache) {
            if (this.cache.hasOwnProperty(x)) {
                if (this.cache[x][event] !== undefined) {
                    try {
                        result = this.cache[x][event].apply(this, newArg);
                    } catch (error) {
                        delete this.cache[x];
                        sendBotText("Plugin error, " +  x + " been disabled, " + error.message);
                    }
                    if (result === undefined && ["privateCommands", "publicCommands"].contains(event)) {
                        return;
                    }
                }
            }
        }
        return false;
    },
    disable: function (pluginName) {
        pluginName = pluginName.toLowerCase();
        CONFIG.pluginEnabledArray.remove(pluginName);
        if (this.cache[pluginName] !== undefined) {
            delete this.cache[pluginName];
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> plugin disabled.");
        } else {
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> plugin isn't enabled.");
        }
        saveConfig();
        return;
    },
    download: function (url) {
        if (sys.isSafeScripts()) {
            sendBotHtml("Unable to download plugin from server. Please disable Safe Scripts.");
            return;
        }
        buildDir();
        try {
            sys.webCall(url, function (response) {
                var fileName = url.split("\\").pop().split("/").pop();
                sendBotHtml("Downloading <b>" + fileName.htmlEscape() + "</b>");
                sys.writeToFile(CONSTANTS.pluginDir + fileName, response);
                PLUGINS.enable(fileName);
                return;
            });
        } catch (error) {
            sendBotText("Error downloading plugin. Details: " + error);
        }
        return;
    },
    enable: function (pluginName) {
        pluginName = pluginName.toLowerCase();
        if (this.cache[pluginName] !== undefined) {
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> plugin already enabled.");
            return;
        }
        if (sys.filesForDirectory(CONSTANTS.pluginDir).contains(pluginName)) {
            this.cache[pluginName] = require(CONSTANTS.pluginDir + pluginName);
            CONFIG.pluginEnabledArray.add(pluginName);
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> enabled.");
        } else {
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> isn't installed.");
        }
        saveConfig();
        return;
    },
    loadAll: function () {
        if (sys.isSafeScripts()) {
            sendBotHtml("Unable to load plugins. Please disable Safe Scripts.");
            return;
        }
        if (!sys.fileExists(CONSTANTS.pluginDir)) {
            return;
        }
        var x,
            fileNameArray = sys.filesForDirectory(CONSTANTS.pluginDir),
            length = fileNameArray.length;
        for (x = 0; x < length; x++) {
            if (CONFIG.pluginEnabledArray.contains(fileNameArray[x].toLowerCase())) {
                this.cache[fileNameArray[x].toLowerCase()] = require(CONSTANTS.pluginDir + fileNameArray[x]);
            }
        }
        return;
    },
    serverCall: function () {
        if (sys.isSafeScripts()) {
            sendBotHtml("Unable to access plugin server. Please disable Safe Scripts.");
            return;
        }
        sys.webCall(CONSTANTS.pluginServerUrl, function (response) {
            try {
                var x, symbol = CONFIG.privateCommandSymbol, plugins = JSON.parse(response);
                sendBotHeader("Plugin Server");
                for (x in plugins) {
                    printHtml("&gt; " + poSend(symbol + "plugindownload " + plugins[x].url, plugins[x].name) + " ~ " + plugins[x].description);
                }
            } catch (error) {
                sendBotText("Error accessing server. GitHub maybe down or plugin lister is corrupted. Details: " + error);
            }
            return;
        });
    },
    unInstall: function (pluginName) {
        pluginName = pluginName.toLowerCase();
        if (this.cache[pluginName] !== undefined) {
            delete this.cache[pluginName];
            CONFIG.pluginEnabledArray.remove(pluginName);
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> plugin disabled.");
        }
        if (sys.fileExists(CONSTANTS.pluginDir + pluginName)) {
            sys.deleteFile(CONSTANTS.pluginDir + pluginName);
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> plugin uninstalled.");
        } else {
            sendBotHtml("<b>" + pluginName.htmlEscape() + "</b> plugin isn't installed.");
        }
        saveConfig();
        return;
    },
    view: function () {
        var x,
            messageArray = [],
            installedArray = sys.filesForDirectory(CONSTANTS.pluginDir),
            length = installedArray.length;
        for (x = 0; x < length; x++) {
            if (CONFIG.pluginEnabledArray.contains(installedArray[x])) {
                messageArray.push("<font color='#00aa00'>" + installedArray[x] + "</font>");
            } else {
                messageArray.push("<font color='#ff0000'>" + installedArray[x] + "</font>");
            }
        }
        sendBotHtml("Plugins installed (<b><font color='#00aa00'>Enabled</font></b>, <b><font color='#ff0000'>Disabled</font></b>): " + messageArray.join(", "));
        return;
    }
};

if (SESSION === undefined) {
    var SESSION = {
        challengeAutoIgnoreCount: 0,
        channelMessageCount: {},
        pmCount: 0,
        pmTempIgnoreArray: [],
        pmTempIgnoreCount: 0,
        scriptUpdateCount: 0,
        startUpTime: new Date().getTime()
    };
}

var SPAM_BLOCK = {
    enabled: false,
    messageCount: 0,
    messageLimit: 5, // default 5
    timeDisabled: 60000 * 3, // 3 min
    messageCooldown: 1000 * 15, // 15 secs
    occuredChannelId: undefined,
    occuredUserName: undefined,
    timerBlockDuraction: undefined,
    timerMessageCooldown: undefined
};
SPAM_BLOCK.timerMessageCooldown = sys.setTimer(function () {
    SPAM_BLOCK.messageCount = 0;
}, SPAM_BLOCK.messageCooldown, true);

var TEMP = {
    currentAction: "",
    isScriptBusy: false,
    multiCommandLoopTImer: "",
    publicCommandErrorOccured: false
};

// LOAD CONFIG, IF SCRIPT IS UPDATED BY SCRIPT WINDOW
if (client.ownId() > -1 && INIT === false) {
    INIT = true;
    loadConfig();
    PLUGINS.loadAll();
    welcomeMessage();
}
// LOAD CONFIG, IF USER LOGS ON
client.network().playerLogin.connect(function () {
    if (INIT === false) {
        INIT = true;
        loadConfig();
        PLUGINS.loadAll();
        sys.setTimer(function () {
            welcomeMessage();
        }, 1, false);
    }
});
SESSION.scriptUpdateCount++;

script = { // PO CREATES DUPLICATE IF NOT USING script AS NAME
    afterChallengeReceived: function (challengeId, opponentId, tier, clauses) {
        PLUGINS.call("afterChallengeReceived", challengeId, opponentId, tier, clauses);
        return;
    },
    afterChannelMessage: function (fullMessage, channelId, isHtml) {
        PLUGINS.call("afterChannelMessage", fullMessage, channelId, isHtml);
        return;
    },
    afterNewMessage: function (globalMessage, isHtml) {
        PLUGINS.call("afterNewMessage", globalMessage, isHtml);
        return;
    },
    afterPMReceived: function (src, message) {
        PLUGINS.call("afterPMReceived", src, message);
        return;
    },
    afterSendMessage: function (message, channelId) {
        PLUGINS.call("afterSendMessage", message, channelId);
        return;
    },
    beforeChallengeReceived: function (challengeId, opponentId, tier, clauses) {
        PLUGINS.call("beforeChallengeReceived", challengeId, opponentId, tier, clauses);
        if (CONFIG.ignoreChallenge) {
            sys.stopEvent();
            sendMasterHtml("Auto refused " + client.name(opponentId).htmlEscape() + " challenge.");
            SESSION.challengeAutoIgnoreCount++;
            return;
        }
    },
    beforeChannelMessage: function (fullMessage, channelId, isHtml) {
        if (INIT === false) {
            return;
        }
        PLUGINS.call("beforeChannelMessage", fullMessage, channelId, isHtml);
        var src = client.id(fullMessage.substring(0, fullMessage.indexOf(":"))),
            srcName = fullMessage.substring(0, fullMessage.indexOf(":")),
            srcMessage = fullMessage.substr(fullMessage.indexOf(":") + 2),
            userSentColor = client.color(client.id(fullMessage.substring(0, fullMessage.indexOf(":")))),
            channelName = client.channelName(channelId);

        var command = "",
            commandData = "",
            split = srcMessage.indexOf(" "),
            symbol = CONFIG.publicCommandSymbol;
        if (symbol.indexOf(srcMessage.charAt(0)) > -1) {
            if (split > -1) {
                command = srcMessage.substring(1, split).toLowerCase().trim();
                commandData = srcMessage.substr(split + 1).trim();
            } else {
                command = srcMessage.substr(1).toLowerCase().trim();
            }
        }

        // CHANNEL MESSAGE COUNT
        if (src > -1 && !isHtml) {
            if (SESSION.channelMessageCount[channelName.toLowerCase()] === undefined) {
                SESSION.channelMessageCount[channelName.toLowerCase()] = 0;
            }
            SESSION.channelMessageCount[channelName.toLowerCase()]++;
        }
        // PICK UP SERVER MESSAGE PINGS
        if (isHtml && (fullMessage.indexOf("<ping/>") === 0 || fullMessage.indexOf("<ping/>", fullMessage.length - 7) !== -1)) {
            client.trayMessage("Ping", "Detected in " + channelName + ".");
        }
        // AUTO IGNORE USER
        if (client.ownName() !== srcName && !client.isIgnored(src) && CONFIG.ignoreArray.contains(srcName.toLowerCase())) {
            client.ignore(src, true);
            return;
        }
        if (isHtml) {
            // BLOCK /ME IGNORE ESCAPE
            if (fullMessage.indexOf("<timestamp/> *** <b>") > -1) {
                var meName = fullMessage.substring(fullMessage.indexOf("<b>") + 3, fullMessage.indexOf("</b>"));
                if (CONFIG.ignoreArray.contains(meName.toLowerCase())) {
                    sys.stopEvent();
                    return;
                }
            }
            // BLOCK /RAINBOW IGNORE ESCAPE
            if (fullMessage.indexOf("<timestamp/><b><span style") > -1) {
                var htmlEscapedMsg = fullMessage.htmlStrip();
                if (htmlEscapedMsg.indexOf(": ") > -1) {
                    var rainbowName = htmlEscapedMsg.substring(0, htmlEscapedMsg.indexOf(": "));
                    if (rainbowName.charAt(0) === "+") {
                        rainbowName = rainbowName.substr(1);
                    }
                    if (CONFIG.ignoreArray.contains(rainbowName.toLowerCase())) {
                        sys.stopEvent();
                        return;
                    }
                }
            }
        }
        if (isHtml) {
            // TOUR ALERT NOTIFICATION
            var msgPrefix = "<font color=red>You are currently alerted when",
                msgSuffix = "tournament is started!</font><ping/>";
            if (fullMessage.substring(0, msgPrefix.length) === msgPrefix && fullMessage.indexOf(msgSuffix) !== -1) {
                if (fullMessage.substring(msgPrefix.length + 1, msgPrefix.length + 3) === "an") {
                    msgPrefix = msgPrefix + " an";
                } else {
                    msgPrefix = msgPrefix + " a";
                }
                var tierName = fullMessage.substring(msgPrefix.length + 1, fullMessage.indexOf(msgSuffix) - 1);
                client.trayMessage("Tour Alert", tierName + " tournament has just started signups.");
            }
            // TOUR ROUND NOFIFICATION
            if (CONFIG.tourRoundAlertEnabled) {
                if (fullMessage.indexOf("Round") > -1) {
                    client.trayMessage("Tour Alert", "Next round in tournament.");
                } else if (fullMessage.indexOf("Final Match") > -1) {
                    client.trayMessage("Tour Alert", "Final round in tournament.");
                }
            }
        }
        // IGNORE GUI IGNORED USERS
        if (client.isIgnored(src)) {
            return;
        }
        // REFORMAT MESSAGE WITH ADDONS
        if (fullMessage.indexOf(": ") > -1 && !isHtml) {
            sys.stopEvent();
            // ESCAPE HTML
            var newMessage = srcMessage.htmlEscape();
            // ADD FLASHES
            var x, length = CONFIG.stalkWordArray.length, regexp, word;
            for (x = -1; x < length; x++) {
                word = (x === -1 ? client.ownName() : CONFIG.stalkWordArray[x]);
                regexp = new RegExp("\\b(" + word.regexpEscape() + ")\\b", "gi");
                newMessage = newMessage.replace(regexp, "<i><span style='background-color: " + CONFIG.flashColor + "'>$1<ping/></span></i>");
            }
            // ADD WEB LINKS
            newMessage = newMessage.replace(/(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/gi, "<a href='$1'>$1</a>");
            // ADD CHANNEL LINKS
            newMessage = client.channel(channelId).addChannelLinks(newMessage);
            // PRINT HTML
            if (src === -1) { // BOT MESSAGE
                printHtml("<font color='" + CONFIG.botColor + "'><timestamp/><b>" + srcName + ":</b></font> " + newMessage, channelId);
            } else { // USER MESSAGE
                var nameFormat = srcName + ":",
                    symbol = CONFIG.authSymbolArray[client.auth(src)];
                // SERVER AUTH CHECK
                if (client.auth(src) > 0) {
                    nameFormat = "<i>" + nameFormat + "</i>";
                }
                printHtml("<font color='" + userSentColor + "'><a style='color: " + userSentColor + "; text-decoration: none;' href='po:send/-cp " + srcName + "'><timestamp/></a>" + symbol + "<b>" + nameFormat + "</b></font> " + newMessage, channelId);
            }
            // BLOCK PINGS FROM BOTS AND SELF
            if (src === -1 || srcName === client.ownName()) {
                newMessage = newMessage.replace(/<ping\/>/g, "");
            }
            // TASKBAR NOFIFICATION IF PING TAG ARE DETECTED
            if (newMessage.indexOf("<ping/>") > -1) {
                client.trayMessage("Flashed in " + channelName + ":", new Date().getDigitalTime() + " || " + srcName + ":\n" + srcMessage);
            }
        }
        if (CONFIG.publicCommandsEnabled && command.length > 0) {
            var isPublicCommand, isPluginCommand;
            try {
                isPublicCommand = NOVA_C.publicCommands(command, commandData, srcName, src, channelName, channelId);
                if (client.ownName() !== srcName && isPublicCommand === undefined) {
                    spamBlock(srcName, channelId);
                }
            } catch (error) {
                if (!TEMP.publicCommandErrorOccured) {
                    TEMP.publicCommandErrorOccured = true;
                    if (client.ownName() !== srcName) {
                        sendBotMessage(channelId, "Script error occurred. The bot owner been alerted about it.");
                    }
                    sendMasterText("publicCommands() error on line " + error.lineNumber + ", " + error.message + ", to prevent client crashes only one error will be given");
                }
            }
            try {
                isPluginCommand = PLUGINS.call("publicCommands", command, commandData, srcName, src, channelName, channelId);
                if (client.ownName() !== srcName && isPluginCommand === undefined) {
                    spamBlock(srcName, channelId);
                }
            } catch (error) {
                if (!TEMP.publicCommandErrorOccured) {
                    TEMP.publicCommandErrorOccured = true;
                    if (client.ownName() !== srcName) {
                        sendBotMessage(channelId, "Script error occurred. The bot owner been alerted about it.");
                    }
                    sendMasterText("publicCommands Plugin() error on line " + error.lineNumber + ", " + error.message + ", to prevent client crashes only one error will be given");
                }
            }
        }
        /*
        // MASTER CHANNEL WATCHER
        var x, channelDisplayer = "____________________", channelWatchColor = (channelName === "Victory Road" || channelName === "Indigo Plateau" ? "#ff3030" : "#aaaaaa");
        channelDisplayer = channelName + channelDisplayer.substring(channelName.length, channelDisplayer.length);
        channelDisplayer = channelDisplayer.substring(0, 10);
        if (src !== -1 && channelName !== CONFIG.masterChannelName && client.hasChannel(client.channelId(CONFIG.masterChannelName)) === true) {
            printHtml("[<b><span style='background-color: " + channelWatchColor + "; font-family: Courier;'>" + channelDisplayer + "</span></b>] <span style='color: " + userSentColor + "'><b>" + srcName + ":</b></span> " + srcMessage.htmlEscape(), client.channelId(CONFIG.masterChannelName));
        }
        */
    },
    beforeNewMessage: function (globalMessage, isHtml) {
        PLUGINS.call("beforeNewMessage", globalMessage, isHtml);
        return;
    },
    beforePMReceived: function (src, message) {
        PLUGINS.call("beforePMReceived", src, message);
        var name = client.name(src).toLowerCase();
        if (SESSION.pmTempIgnoreArray.contains(name)) {
            sys.stopEvent();
            SESSION.pmTempIgnoreCount++;
        }
        SESSION.pmCount++;
        if (!client.isIgnored(src) && CONFIG.ignoreArray.contains(name)) {
            client.ignore(src, true);
            return;
        }
        return;
    },
    beforeSendMessage: function (message, channelId) {
        PLUGINS.call("beforeSendMessage", message, channelId);
        var command = "",
            commandData = "",
            split = message.indexOf(" "),
            symbol = CONFIG.privateCommandSymbol;
        if (symbol === message.substring(0, symbol.length)) {
            if (split > -1) {
                command = message.substring(symbol.length, split).toLowerCase().trim();
                commandData = message.substr(split + 1).trim();
            } else {
                command = message.substr(symbol.length).toLowerCase().trim();
            }
        }
        if (command.length > 0) {
            sys.stopEvent();
            var isPrivateCommand, isPluginCommand;
            try {
                isPrivateCommand = NOVA_C.privateCommands(command, commandData, client.channelName(channelId), channelId);
            } catch (error) {
                sendBotText("privateCommands() error on line " + error.lineNumber + ", " + error.message);
                isPrivateCommand = false;
            }
            try {
                isPluginCommand = PLUGINS.call("privateCommands", command, commandData, client.channelName(channelId), channelId);
            } catch (error) {
                sendBotText("privateCommands Plugin() error on line " + error.lineNumber + ", " + error.message);
                isPluginCommand = false;
            }
            if (isPrivateCommand === false && isPluginCommand === false) {
                sendBotText("The bot command " + command + " doesn't exist.");
            }
        }
        if (CONFIG.removeCaps === true && command.length === 0 && message.toLowerCase() !== message) {
            sys.stopEvent();
            sendMessage(channelId, message.toLowerCase());
        }
        return;
    },
    clientShutDown: function () {
        PLUGINS.call("clientShutDown");
        return;
    },
    clientStartUp: function () {
        PLUGINS.call("clientStartUp");
        return;
    },
    onPlayerJoinChan: function (src, channelId) {
        PLUGINS.call("onPlayerJoinChan", src, channelId);
        return;
    },
    onPlayerLeaveChan: function (src, channelId) {
        PLUGINS.call("onPlayerLeaveChan", src, channelId);
        return;
    },
    onPlayerReceived: function (src) {
        PLUGINS.call("onPlayerReceived", src);
        var x,
            srcName = client.name(src),
            length = CONFIG.friendArray.length,
            htmlMessage = srcName + " [" + poInfo(src, "Challenge") + "|" + poPm(src, "PM") + "] has logged on.";
        for (x = 0; x < length; x++) {
            if (CONFIG.friendArray[x] === srcName.toLowerCase()) {
                sendBotHtml(htmlMessage);
                if (client.currentChannel() !== client.channelId(CONFIG.masterChannelName)) {
                    sendBotHtml(htmlMessage, client.channelId(CONFIG.masterChannelName));
                }
            }
        }
    },
    onPlayerRemoved: function (src) {
        PLUGINS.call("onPlayerRemoved", src);
        return;
    },
    stepEvent: function () {
        PLUGINS.call("stepEvent");
        return;
    }
};
