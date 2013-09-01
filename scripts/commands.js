var userCommands, modCommands, adminCommands, ownerCommands, channelCommands;

exports.handleCommand = function(src, command, commandData, tar) {
    if (userCommands === undefined) {
        userCommands = require("usercommands.js");
    }
    if (userCommands.handleCommand(src, command, commandData, tar) != "no command") {
        return;
    }
    if (modCommands === undefined) {
        modCommands = require("modcommands.js");
    }
    if (sys.auth(src) > 0 || (isMafiaAdmin(src) || isMafiaSuperAdmin(src)) && command == "mafiabans") {
        if (modCommands.handleCommand(src, command, commandData, tar, channel) != "no command") {
            return;
        }
    }
    if (adminCommands === undefined) {
        adminCommands = require("admincommands.js");
    }
    if (sys.auth(src) > 1) {
        if (adminCommands.handleCommand(src, command, commandData, tar) != "no command") {
            return;
        }
    }
    if (ownerCommands === undefined) {
        ownerCommands = require("ownercommands.js");
    }
    if (sys.auth(src) > 2) {
        if (ownerCommands.handleCommand(src, command, commandData, tar) != "no command") {
            return;
        }
    }
    if (channelCommands === undefined) {
        channelCommands = require("channelcommands.js");
    }
    if (sys.auth(src) > 1 || SESSION.channels(channel).isChannelOperator(src)) {
        if (channelCommands.handleCommand(src, command, commandData, tar) != "no command") {
            return;
        }
    }
    commandbot.sendChanMessage(src, "The command " + command + " doesn't exist");
};