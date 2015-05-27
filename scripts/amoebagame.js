/*
 * amoebagame.js
 */
module.exports = function() {
    var id;
    var name = "Evolution Game";
    var species = ['Solosis', 'Lilligant', 'Krokorok', 'Minccino', 'Mankey', 'Arceus'];
    var messages = ['solosis solosis', 'lilli-lilligant', 'krokokokokorok!', 'minccino?', 'ma-mankey mankey!', '-'];
    var battles = {};

    var init = function() {
        if (sys.existChannel(name)) {
            id = sys.channelId(name);
        } else {
            id = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(id);
        SESSION.channels(id).perm = true;
        SESSION.channels(id).master = "lamperi";
    };

    var beforeChatMessage = function(src, message, chan) {
        if (chan != id) return false;
        var role = SESSION.users(src).amoeba.role;
        if (sys.auth(src) > 0 && ["/","!"].indexOf(message[0]) > -1) return false;
        if (role != species.length - 1) {
            sendChanAll(sys.name(src) + ": " + messages[role], id);
            if (battles[role] && battles[role] != src && sys.isInChannel(battles[role], id)) {
                var winner = sys.rand(0,2) > 0 ? battles[role] : src;
                var loser = winner == src ? battles[role] : src;
                SESSION.users(winner).amoeba.role++;
                if (SESSION.users(loser).amoeba.role > 0) SESSION.users(loser).amoeba.role--;
                sendChanAll("+EvolutionBot: Two " + species[role] + "s, "
                    + sys.name(battles[role]) + " and " + sys.name(src) + " engaged in a fierce battle! "
                    + sys.name(winner) + " won and is now a " + species[SESSION.users(winner).amoeba.role] + ". "
                    + sys.name(loser) + " lost and is now a " + species[SESSION.users(loser).amoeba.role] + ".",
                id);
                delete battles[role];
            } else {
                battles[role] = src;
            }
            sys.stopEvent();
            return true;
        }
        return false;
    }

    var beforeChannelJoin = function(src, channel) {
        if (channel != id) return false;
        SESSION.users(src).amoeba = {};
        SESSION.users(src).amoeba.role = 0;
        return false;
    }

    return {
        init: init,
        beforeChatMessage: beforeChatMessage,
        beforeChannelJoin: beforeChannelJoin
    }
}();
