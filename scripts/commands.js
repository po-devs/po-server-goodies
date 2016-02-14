var userCommands, modCommands, adminCommands, ownerCommands, channelCommands, sysCommands, clearChat;

exports.handleCommand = function(src, command, commandData, tar, channel) {
    if (userCommands === undefined) {
        userCommands = require("usercommands.js");
    }
    if (userCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
        return;
    }
    if (modCommands === undefined) {
        modCommands = require("modcommands.js");
    }
    if (sys.auth(src) > 0 || SESSION.users(src).tempMod || (script.isMafiaAdmin(src) || script.isMafiaSuperAdmin(src)) && command === "mafiabans" || script.isMafiaSuperAdmin(src) && command === "aliases" || script.isSafariAdmin(src) && command === "safaribans") {
        if (modCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
            return;
        }
    }
    if (adminCommands === undefined) {
        adminCommands = require("admincommands.js");
    }
    if (sys.auth(src) > 1 || SESSION.users(src).tempAdmin) {
        if (adminCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
            return;
        }
    }
    /*if (clearChat === undefined) {
    	clearChat = require("clearchat.js");
    }
    if (sys.auth(src) > 1 || SESSION.users(src).tempAdmin) {
    	if (clearChat.handleCommand(src, command, commandData, tar, channel) != "no command") {
    	    return;
    	}
    }*/
    if (ownerCommands === undefined) {
        ownerCommands = require("ownercommands.js");
    }
    if (sys.auth(src) > 2) {
        if (ownerCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
            return;
        }
    }
    if (sysCommands === undefined) {
	sysCommands = require("systemcommands.js");
    }
    if (sys.auth(src) > 2) {
	if (sysCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
            return;
        }
    }
    if (channelCommands === undefined) {
        channelCommands = require("channelcommands.js");
    }
    if (channelCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
        return;
    }
    commandbot.sendMessage(src, "The command " + command + " doesn't exist", channel);
};
