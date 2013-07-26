var isMafiaAdmin = require('mafia.js').isMafiaAdmin;
var isMafiaSuperAdmin = require('mafia.js').isMafiaSuperAdmin;

exports.handleCommand = function(src, command, commandData, tar) {
    if (commands.userCommand(src, command, commandData, tar) != "no command") {
        return;
    }

    if (sys.auth(src) > 0 || (isMafiaAdmin(src) || isMafiaSuperAdmin(src)) && command == "mafiabans") {
        if (commands.modCommand(src, command, commandData, tar, channel) != "no command") {
            return;
        }
    }

    if (sys.auth(src) > 1) {
        if (commands.adminCommand(src, command, commandData, tar) != "no command") {
            return;
        }
    }

    if (sys.auth(src) > 2) {
        if (commands.ownerCommand(src, command, commandData, tar) != "no command") {
            return;
        }
    }

    if (sys.auth(src) > 1 || SESSION.channels(channel).isChannelOperator(src)) {
        if (commands.channelCommand(src, command, commandData, tar) != "no command") {
            return;
        }
    }
    // Shanai commands
    if ((sys.auth(src) > 3 && sys.name(src) == "Shanai") || (command == "silencetriviaoff" && sys.auth(src) > 1)) {
        if (command == "sendhtmlall") {
            sendChanHtmlAll(commandData,channel);
            return;
        }
        if (command == "sendhtmlmessage") {
            var channelToSend = parseInt(commandData.split(":::")[0], 10);
            var targets = commandData.split(":::")[1].split(":");
            var htmlToSend = commandData.split(":::")[2];
            for (var i=0; i<targets.length; ++i) {
                var id = sys.id(targets[i]);
                if (id !== undefined && sys.isInChannel(id, channelToSend))
                    sys.sendHtmlMessage(id,htmlToSend,channelToSend);
            }
            return;
        }
        if (command == "silencetrivia") {
            var id = sys.channelId("Trivia");
            if (id === undefined) return;
            SESSION.channels(id).triviaon = true;
            return;
        }
        if (command == "silencetriviaoff") {
            var id = sys.channelId("Trivia");
            if (id === undefined) return;
            SESSION.channels(id).triviaon = false;
            return;
        }
        if (command == "teaminfo") {
            var id = sys.id(commandData);
            var team = 0;
            if (id) {
                var data = {type: 'TeamInfo', id: id, name: sys.name(id), gen: sys.gen(id,team), tier: sys.tier(id,team), importable: script.importable(id,team).join("\n"),
                    registered: sys.dbRegistered(sys.name(id)), ip: sys.ip(id)};
                sendChanMessage(src, ":"+JSON.stringify(data));
            }
        }
    }

    bots.command.sendChanMessage(src, "The command " + command + " doesn't exist");
};