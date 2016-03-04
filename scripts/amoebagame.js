/*global module, script, SESSION, sys, utilities*/
/*jslint plusplus: true, sloppy: true*/
function EvolutionGame() {
    var id,
        name = "Evolution Game",
        defaultTopic = "~How to Play~ There are 6 Pokémon in this game: Solosis, Lilligant, Krokorok, Minccino, Mankey and Arceus. Simply send a message. When 2 of the same species have spoken, they battle - one evolves and the other unevolves. When an Arceus, you can speak properly. Requires at least 7 players to play. | Avoid going overactive, spamming doesn't make battles happen, only when 2 of the same species has spoken.",
        poke = [
            {species: "Solosis", cry: "solosis solosis", icon: 577},
            {species: "Lilligant", cry: "lilli-lilligant", icon: 549},
            {species: "Krokorok", cry: "krokokokokorok!", icon: 552},
            {species: "Minccino", cry: "minccino?", icon: 572},
            {species: "Mankey", cry: "ma-mankey mankey!", icon: 56},
            {species: "Arceus", cry: "-", icon: 493}
        ],
        battles = {},
        htmlEscape = utilities.html_escape;

    function pokeIcon(num) {
        return "<img src='icon:" + poke[num].icon + "'>";
    }

    this.init = function () {
        if (sys.existChannel(name)) {
            id = sys.channelId(name);
        } else {
            id = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(id);
        if (!SESSION.channels(id).topic) {
            SESSION.channels(id).topic = defaultTopic;
        }
        SESSION.channels(id).perm = true;
        SESSION.channels(id).master = "lamperi";
    };
    this.beforeChatMessage = function (src, message, channel) {
        if (channel !== id) {
            return false;
        }
        var role = SESSION.users(src).amoeba.role,
            isAuth = sys.auth(src) > 0 && sys.auth(src) < 4, // ignores hidden auth
            name = htmlEscape(sys.name(src)),
            messagePrefix = "<font color='" + script.getColor(src) + "'><timestamp/>" + /*pokeIcon(role) +*/ (isAuth ? "+" : "") + "<b>" + (isAuth ? "<i>" + name + ":</i> " : name + ": ") + "</b></font>";
        if (sys.auth(src) > 0 && ["/", "!"].indexOf(message.charAt(0)) > -1) {
            sys.stopEvent();
            sys.sendHtmlAll(messagePrefix + message, id);
            return false;
        }
        if (role !== poke.length) { // poke.length - 1 if no battle with Arceus
            sys.sendHtmlAll(messagePrefix + (role !== poke.length - 1 ? poke[role].cry : message), id);
            if (battles[role] && battles[role] !== src && sys.isInChannel(battles[role], id)) {
                var winner = sys.rand(0, 2) > 0 ? battles[role] : src,
                    loser = winner === src ? battles[role] : src;
                if (role < poke.length - 1) {
                    SESSION.users(winner).amoeba.role++;
                    if (SESSION.users(loser).amoeba.role > 0) {
                        SESSION.users(loser).amoeba.role--;
                    }
                } else {
                    // SESSION.users(loser).amoeba.role = 0;
                }
                if (role === 0) {
                    sys.sendHtmlAll("<hr><center>" + /*pokeIcon(role) +*/ "<b>" + htmlEscape(sys.name(battles[role])) + "</b> and " + /*pokeIcon(role) +*/ "<b>" + htmlEscape(sys.name(src)) + "</b> engaged in a fierce battle!</center><br /><b><font color='#0000ff'>" + htmlEscape(sys.name(winner)) + "</font></b> won and evolves into " + /*pokeIcon(SESSION.users(winner).amoeba.role) +*/ poke[SESSION.users(winner).amoeba.role].species + " while <b><font color='#ff0000'>" + htmlEscape(sys.name(loser)) + "</font></b> lost and remains a " + /*pokeIcon(SESSION.users(loser).amoeba.role) +*/ poke[SESSION.users(loser).amoeba.role].species + ".<hr>", id);
                } else if (role > 0 && role < 5) {
                    sys.sendHtmlAll("<hr><center>" + /*pokeIcon(role) +*/ "<b>" + htmlEscape(sys.name(battles[role])) + "</b> and " + /*pokeIcon(role) +*/ "<b>" + htmlEscape(sys.name(src)) + "</b> engaged in a fierce battle!</center><br /><b><font color='#0000ff'>" + htmlEscape(sys.name(winner)) + "</font></b> won and evolves into " + /*pokeIcon(SESSION.users(winner).amoeba.role) +*/ poke[SESSION.users(winner).amoeba.role].species + " while <b><font color='#ff0000'>" + htmlEscape(sys.name(loser)) + "</font></b> lost and unevolved into " + /*pokeIcon(SESSION.users(loser).amoeba.role) +*/ poke[SESSION.users(loser).amoeba.role].species + ".<hr>", id);
                } else {
                    // sys.sendHtmlAll("<hr><center>" + /*pokeIcon(role) +*/ "<b>" + htmlEscape(sys.name(battles[role])) + "</b> and " + /*pokeIcon(role) +*/ "<b>" + htmlEscape(sys.name(src)) + "</b> engaged in a fierce battle of the Gods!</center><br /><b><font color='#0000ff'>" + htmlEscape(sys.name(winner)) + "</font></b> defeated <b><font color='#ff0000'>" + htmlEscape(sys.name(loser)) + "</font></b> and mercilessly reset their evolution back to " + /*pokeIcon(SESSION.users(loser).amoeba.role) +*/ poke[SESSION.users(loser).amoeba.role].species + ".<hr>", id);
                }
                delete battles[role];
            } else {
                battles[role] = src;
            }
            sys.stopEvent();
            return true;
        }
        return false;
    };
    this.beforeChannelJoin = function (src, channel) {
        if (channel !== id) {
            return false;
        }
        SESSION.users(src).amoeba = {};
        SESSION.users(src).amoeba.role = 0;
        return false;
    };
}
module.exports = new EvolutionGame();
