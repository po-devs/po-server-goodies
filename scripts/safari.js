/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys, module, SESSION, safaribot, require, script, sachannel, getTimeString */

var MemoryHash = require("memoryhash.js").MemoryHash;
var Bot = require('bot.js').Bot;

function Safari() {
    var safari = this;
    var safchan;
    
    var safaribot = new Bot("Tauros");

    var defaultChannel = "Safari Game";
    
    var shinyChance = 512; //Chance of 1/512 for Shiny Pokémon
    var starters = [1, 4, 7];
    var itemPrices = {
        safari: 30,
        gacha: 149,
        bait: 100
    };
    
    var currentPokemon = null;
    
    var tradeRequests = {};
    
    var saveFiles = "scriptdata/safarisaves.txt";
    var rawPlayers;
    
    var contestCooldownLength = 1200; //1 contest every 20 minutes
    var baitCooldownLength = 0;
    var contestBroadcast = true; //Determines whether Tohjo gets notified
    var contestCooldown = (SESSION.global() && SESSION.global().safariContestCooldown ? SESSION.global().safariContestCooldown : contestCooldownLength);
    var baitCooldown = (SESSION.global() && SESSION.global().safariBaitCooldown ? SESSION.global().safariBaitCooldown : baitCooldownLength);
    var contestDuration = 300; //Contest lasts for 5 minutes
    var contestCount = 0;
    
    var effectiveness = {
        "Normal": {
            "Rock": 0.5,
            "Ghost": 0,
            "Steel": 0.5
        },
        "Fighting": {
            "Normal": 2,
            "Flying": 0.5,
            "Poison": 0.5,
            "Rock": 2,
            "Bug": 0.5,
            "Ghost": 0,
            "Steel": 2,
            "Psychic": 0.5,
            "Ice": 2,
            "Dark": 2,
            "Fairy": 0.5
        },
        "Flying": {
            "Fighting": 2,
            "Rock": 0.5,
            "Bug": 2,
            "Steel": 0.5,
            "Grass": 2,
            "Electric": 0.5
        },
        "Poison": {
            "Poison": 0.5,
            "Ground": 0.5,
            "Rock": 0.5,
            "Ghost": 0.5,
            "Steel": 0,
            "Grass": 2,
            "Fairy": 2
        },
        "Ground": {
            "Flying": 0,
            "Poison": 2,
            "Rock": 2,
            "Bug": 0.5,
            "Steel": 2,
            "Fire": 2,
            "Grass": 0.5,
            "Electric": 2
        },
        "Rock": {
            "Fighting": 0.5,
            "Flying": 2,
            "Ground": 0.5,
            "Bug": 2,
            "Steel": 0.5,
            "Fire": 2,
            "Ice": 2
        },
        "Bug": {
            "Fighting": 0.5,
            "Flying": 0.5,
            "Poison": 0.5,
            "Ghost": 0.5,
            "Steel": 0.5,
            "Fire": 0.5,
            "Grass": 2,
            "Psychic": 2,
            "Dark": 2,
            "Fairy": 0.5
        },
        "Ghost": {
            "Normal": 0,
            "Ghost": 2,
            "Psychic": 2,
            "Dark": 0.5
        },
        "Steel": {
            "Rock": 2,
            "Steel": 0.5,
            "Fire": 0.5,
            "Water": 0.5,
            "Electric": 0.5,
            "Ice": 2,
            "Fairy": 2
        },
        "Fire": {
            "Rock": 0.5,
            "Bug": 2,
            "Steel": 2,
            "Fire": 0.5,
            "Water": 0.5,
            "Grass": 2,
            "Ice": 2,
            "Dragon": 0.5
        },
        "Water": {
            "Ground": 2,
            "Rock": 2,
            "Fire": 2,
            "Water": 0.5,
            "Grass": 0.5,
            "Dragon": 0.5
        },
        "Grass": {
            "Flying": 0.5,
            "Poison": 0.5,
            "Ground": 2,
            "Rock": 2,
            "Bug": 0.5,
            "Steel": 0.5,
            "Fire": 0.5,
            "Water": 2,
            "Grass": 0.5,
            "Dragon": 0.5
        },
        "Electric": {
            "Flying": 2,
            "Ground": 0,
            "Water": 2,
            "Grass": 0.5,
            "Electric": 0.5,
            "Dragon": 0.5
        },
        "Psychic": {
            "Fighting": 2,
            "Poison": 2,
            "Steel": 0.5,
            "Psychic": 0.5,
            "Dark": 0
        },
        "Ice": {
            "Flying": 2,
            "Ground": 2,
            "Steel": 0.5,
            "Fire": 0.5,
            "Water": 0.5,
            "Grass": 2,
            "Ice": 0.5,
            "Dragon": 2
        },
        "Dragon": {
            "Steel": 0.5,
            "Dragon": 2,
            "Fairy": 0
        },
        "Dark": {
            "Fighting": 0.5,
            "Ghost": 2,
            "Psychic": 2,
            "Dark": 0.5,
            "Fairy": 0.5
        },
        "Fairy": {
            "Fighting": 2,
            "Poison": 0.5,
            "Steel": 0.5,
            "Fire": 0.5,
            "Dragon": 2,
            "Dark": 2
        }
    };
    
    var safariAliases = ["safariball", "safari", "safari ball", "*"];
    var greatAliases = ["greatball", "great", "great ball"];
    var ultraAliases = ["ultraball", "ultra", "ultra ball"];
    var masterAliases = ["masterball", "master", "master ball"];
    var dreamAliases = ["dreamball", "dream", "dream ball"];
    var heavyAliases = ["heavyball", "heavy", "heavy ball"];
    var nestAliases = ["nestball", "nest", "nest ball"];
    var fastAliases = ["fastball", "fast", "fast ball"];
    var luxuryAliases = ["luxuryball", "luxury", "luxury ball"];
    var quickAliases = ["quickball", "quick", "quick ball"];
    
    
    function getAvatar(src) {
        if (SESSION.users(src)) {
            return SESSION.users(src).safari;
        }
    }
    function now() {
        return new Date().getTime();
    }
    function getDay(time) {
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function add(arr) {
        var result = 0;
        for (var e in arr) {
            result += arr[e];
        }
        return result;
    }
    function countRepeated(arr, val) {
        var count = 0;
        arr.forEach(function(x) {
            count += x === val ? 1 : 0;
        });
        return count;
    }
    function getInputPokemon(info) {
        var shiny = false, id = info;
        
        if (info[0] == "*" || info[info.length-1] == "*") {
            shiny = true;
            info = info.replace("*", "");
        }
        id = parseInt(info, 10);
        if (isNaN(id)) {
            id = sys.pokeNum(info);
        }
        
        return [id, shiny];
    }
    function getPokemonInfo(info) {
        var shiny = false, id = info;
        
        if (typeof info == "string") {
            shiny = true;
            id = parseInt(info, 10);
            if (isNaN(id)) {
                id = null;
            }
        }
        
        
        return [id, shiny];
    }
    function poke(num) {
        var shiny = false;
        if (typeof num === "string") {
            num = parseInt(num, 10);
            shiny = true;
        }
        
        if (isNaN(num)) {
            return null;
        }
        var name = sys.pokemon(num);
        
        return name ? (shiny ? "Shiny " : "") + name : null;
    }
    function pokeImage(num) {
        return "<img src='pokemon:num=" + num + (typeof num == "string" ? "&shiny=true" : "") + "&gen=6'>";
    }
    function ballAlias(name) {
        if (greatAliases.indexOf(name) !== -1) {
            return "great";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "ultra";
        } else if (masterAliases.indexOf(name) !== -1) {
            return "master";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "dream";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "heavy";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "nest";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "fast";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "luxury";
        } else if (ultraAliases.indexOf(name) !== -1) {
            return "quick";
        } else {
            return "safari";
        }
    }
    
    this.createWild = function(dexNum, makeShiny) {
        var num,
            pokeId,
            shiny = sys.rand(0, shinyChance) < 1,
            maxStats = sys.rand(300, 750);
            if (makeShiny) {
                shiny = true;
            }
        if (dexNum) {
            num = parseInt(dexNum, 10);
            pokeId = poke(num);
            if (makeShiny) {
                pokeId = poke(dexNum);
            }
        } else {
            do {
                num = sys.rand(1, 722);
                pokeId = poke(num + (shiny ? "" : 0));
            } while (!pokeId || add(sys.pokeBaseStats(num)) > maxStats);
        }
        
        sys.sendHtmlAll("<hr><center>A wild " + pokeId + " appeared! <i>(BST: " + add(sys.pokeBaseStats(num)) + ")</i><br/>" + pokeImage(num + (shiny ? "" : 0)) + "<br/></center><hr>", safchan);
        currentPokemon = shiny ? "" + num : num;
    };
    this.throwBall = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (!currentPokemon) {
            safaribot.sendMessage(src, "No wild pokémon around!", safchan);
            return;
        }
        var currentTime = now();
        if (player.cooldown > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldown - currentTime)/1000) + 1) + " seconds before throwing another ball!", safchan);
            return;
        }
        var ball = "safari";
        var ballBonus = 1;
        var cooldown = 8000;
        switch (ballAlias(data.toLowerCase())) {
            case "great":
                ball = "great";
                ballBonus = 1.5;
                cooldown = 11000;
                break;
            case "ultra":
                ball = "ultra";
                ballBonus = 2;
                cooldown = 15000;
                break;
            case "master":
                ball = "master";
                ballBonus = 255;
                cooldown = 180000;
                break;
            case "dream":
                ball = "dream";
                ballBonus = 0.99;
                cooldown = 11000;
                break;
            case "safari":
                ball = "safari";
                ballBonus = 1;
                cooldown = 8000;
        }
        if (isNaN(player.balls[ball])) {
            player.balls[ball] = 0;
        }
        if (!(ball in player.balls) || player.balls[ball] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(ball) + " Balls!", safchan);
            return;
        }
        
        player.balls[ball] -= 1;
        var pokeName = poke(currentPokemon);
        var wild = typeof currentPokemon == "string" ? parseInt(currentPokemon, 10) : currentPokemon;
        var shinyChance = typeof currentPokemon == "string" ? 0.40 : 1;
        if (ballBonus == 0.99 && shinyChance == 0.40) {
            shinyChance = 1;
            ballBonus = 3;
        }
        
        var userStats = add(sys.pokeBaseStats(player.party[0]));
        var wildStats = add(sys.pokeBaseStats(wild));
        var statsBonus = (userStats - wildStats) / 6000;
        
        var typeBonus = this.checkEffective(sys.type(sys.pokeType1(player.party[0])), sys.type(sys.pokeType2(player.party[0])), sys.type(sys.pokeType1(wild)), sys.type(sys.pokeType2(wild)));
        
        var tiers = ["ORAS LC", "ORAS NU", "ORAS LU", "ORAS UU", "ORAS OU", "ORAS Ubers"];
        var tierChance = 0.14;
        for (var x = 0; x < tiers.length; x++) {
            if (sys.isPokeBannedFromTier && !sys.isPokeBannedFromTier(wild, tiers[x])) {
                tierChance = [0.26, 0.22, 0.18, 0.14, 0.10, 0.06][x];
                break;
            }
        }
        
        var finalChance = (tierChance + statsBonus) * typeBonus * shinyChance;
        if (finalChance <= 0) {
            finalChance = 0.01;
        }
        finalChance *= ballBonus;
        
        var rng = Math.random();
        if (rng < finalChance || ballBonus == 255) {
            sys.sendAll("", safchan);
            safaribot.sendAll(sys.name(src) + " caught the "+pokeName+" with a " + cap(ball) + " Ball!" , safchan);
            safaribot.sendMessage(src, "Gotcha! "+pokeName+" was caught with a " + cap(ball) + " Ball! You still have " + player.balls[ball] + " " + cap(ball) + " Ball(s)!", safchan);
            sys.sendAll("", safchan);
            player.pokemon.push(currentPokemon);
            currentPokemon = null;
        } else {
            safaribot.sendMessage(src, "You threw a  " + cap(ball) + " Ball at " + pokeName +"! You still have " + player.balls[ball] + " " + cap(ball) + " Ball(s)!", safchan);
            if (rng < finalChance + 0.1) {
                safaribot.sendMessage(src, "Gah! It was so close, too! ", safchan);
            } else if (rng < finalChance + 0.2) {
                safaribot.sendMessage(src, "Aargh! Almost had it! ", safchan);
            } else if (rng < finalChance + 0.3) {
                safaribot.sendMessage(src, "Aww! It appeared to be caught! ", safchan);
            } else {
                safaribot.sendMessage(src, "Oh no! The " + pokeName + " broke free! ", safchan);
            }
            safaribot.sendAll(pokeName + " broke out of " + sys.name(src) + "'s " + cap(ball) + " Ball!", safchan);
        }
        player.cooldown = currentTime + cooldown;
        this.saveGame(player);
    };
    this.checkEffective = function(atk1, atk2, def1, def2) {
        var result = 1;
        var attacker = effectiveness[atk1];
        if (def1 in attacker) {
            result *= attacker[def1];
        }
        if (def2 in attacker) {
            result *= attacker[def2];
        }
        
        if (atk2 !== "???") {
            attacker = effectiveness[atk2];
            if (def1 in attacker) {
                result *= attacker[def1];
            }
            if (def2 in attacker) {
                result *= attacker[def2];
            }
        }
        
        return result;
    };
    this.sellPokemon = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't sell a Pokémon during a contest!", safchan);
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To sell a Pokémon, use /sell [name] to check its price, and /sell [name]:confirm to sell it.", safchan);
            return;
        }
        if (player.pokemon.length == 1) {
            safaribot.sendMessage(src, "You can't sell your last Pokémon!", safchan);
            return;
        }
        var info = data.split(":");
        var pokeId = getInputPokemon(info[0]);
        var shiny = pokeId[1];
        pokeId = pokeId[0];
        if (pokeId === undefined) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var pokeNum = shiny ? "" + pokeId : pokeId;
        if (player.pokemon.indexOf(pokeNum) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return;
        }
        var count = countRepeated(player.pokemon, pokeNum);
        if (player.party.length == 1 && player.party[0] === pokeNum && count <= 1) {
            safaribot.sendMessage(src, "You can't sell the only Pokémon in your party!", safchan);
            return;
        }
        if (player.starter === pokeNum && count <= 1) {
            safaribot.sendMessage(src, "You can't sell your starter Pokémon!", safchan);
            return;
        }
        
        var price = Math.round(add(sys.pokeBaseStats(pokeId))/2 * (shiny ? 5 : 1));
        
        if (info.length < 2 || info[1].toLowerCase() !== "confirm") {
            safaribot.sendMessage(src, "You can sell your " + poke(pokeNum) + " for $" + price + ". To confirm it, type /sell " + (shiny ? "*":"") + sys.pokemon(pokeId) + ":confirm.", safchan);
            return;
        }
        
        player.money += price;
        this.removePokemon(src, pokeNum);
        
        safaribot.sendMessage(src, "You sold your " + poke(pokeNum) + " for $" + price + "!", safchan);
        
        this.saveGame(player);
    };
    this.buyItems = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "You can buy the following items:", safchan);
            safaribot.sendMessage(src, "Safari Ball: $" + itemPrices.safari, safchan);
            //safaribot.sendMessage(src, "Gachapon Ticket: $" + itemPrices.gacha, safchan);
            safaribot.sendMessage(src, "Bait: $" + itemPrices.bait, safchan);
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You currently have $" + player.money + ". To buy a ball, use /buy ball:quantity (e.g.: /buy safari:3)", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        var info = data.split(":");
        var item = info[0].toLowerCase();
        var amount = 1;
        if (info.length > 1) {
            amount = parseInt(info[1], 10);
            if (isNaN(amount) || amount < 1) {
                amount = 1;
            }
        }
        
        switch (item) {
            case "safari ball":
            case "safariball":
                item = "safari";
            break;
            case "gachapon ticket":
            case "gachaponticket":
                item = "gacha";
            break;
        }
        
        var validItems = ["safari", "bait"];
        if (validItems.indexOf(item) == -1) {
            safaribot.sendMessage(src, "You can only buy Safari Balls and Bait at this shop!", safchan);
            return;
        }
        var cost = amount * itemPrices[item];
        var ballStr = item === "safari" ? " Ball(s)" : "";
        if (isNaN(player.money)) {
            player.money = 0;
        }
        if (player.money < cost) {
            safaribot.sendMessage(src, "You need $" + cost + " to buy " + amount + " " + cap(item) + ballStr + ", but you only have $" + player.money + "!", safchan);
            return;
        }
        
        player.money -= cost;
        if (isNaN(player.balls[item])) {
            player.balls[item] = 0;
        }
        player.balls[item] += amount;
        safaribot.sendMessage(src, "You bought " + amount + " " + cap(item) + ballStr + " for $" + cost + "! You now have " + player.balls[item] + " " + cap(item) + ballStr + " and $" + player.money + "!", safchan);
        this.saveGame(player);
    };
    this.tradePokemon = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        
        var userName = sys.name(src).toLowerCase();
        if (data.toLowerCase() == "cancel" && userName in tradeRequests) {
            safaribot.sendMessage(src, "You cancelled your trade request with " + tradeRequests[userName].target + "!", safchan);
            delete tradeRequests[userName];
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't trade during a contest!", safchan);
            return;
        }
        
        var info = data.split(":");
        if (info.length < 3) {
            safaribot.sendMessage(src, "To trade Pokémon with another player, use /trade [Player]:[Your Offer]:[What you want].", safchan);
            return;
        }
        if (player.pokemon.length <= 1) {
            safaribot.sendMessage(src, "You cannot trade until you catch another Pokémon!", safchan);
            return;
        }
        if (userName in tradeRequests) {
            safaribot.sendMessage(src, "You already have a pending trade! To cancel it, type '/trade cancel'.", safchan);
            return;
        }
        
        var targetId = sys.id(info[0].toLowerCase());
        if (!targetId) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return;
        }
        if (src === targetId) {
            safaribot.sendMessage(src, "You can't trade with yourself!", safchan);
            return;
        }
        var target = getAvatar(targetId);
        if (!target) {
            safaribot.sendMessage(src, "This person didn't enter the Safari!", safchan);
            return;
        }
        
        var offer = getInputPokemon(info[1].toLowerCase());
        
        if (offer[0] === undefined) {
            safaribot.sendMessage(src, "Please specify a valid Pokémon on your offer!", safchan);
            return;
        }
        
        var offerId = offer[0] + (offer[1] === true ? "" : 0);
        
        var check = this.canTradePokemon(player, offerId);
        if (check == "noPokemon") {
            safaribot.sendMessage(src, "You don't have that Pokémon!", safchan);
            return;
        }
        if (check == "isStarter") {
            safaribot.sendMessage(src, "You can't trade your starter Pokémon!", safchan);
            return;
        }
        if (check == "isActive") {
            safaribot.sendMessage(src, "You can't trade the only Pokémon in your party!", safchan);
            return;
        }
        
        var request = getInputPokemon(info[2].toLowerCase());
        if (request[0] === undefined) {
            safaribot.sendMessage(src, "Please specify a valid Pokémon on your request!", safchan);
            return;
        }
        var requestId = request[0] + (request[1] === true ? "" : 0);
        var targetName = sys.name(targetId).toLowerCase();
        
        sys.sendMessage(src, "" , safchan);
        sys.sendMessage(targetId, "" , safchan);
        safaribot.sendMessage(src, "You are offering a " + poke(offerId) + " to " + sys.name(targetId) + " for their " + poke(requestId) + "!" , safchan);
        safaribot.sendMessage(targetId, sys.name(src) + " is offering you a " + poke(offerId) + " for your " + poke(requestId) + "!" , safchan);
        
        if (targetName in tradeRequests && tradeRequests[targetName].target === userName) {
            var req = tradeRequests[targetName];
            if (offerId === req.request && requestId === req.offer) {
                check = this.canTradePokemon(target, requestId);
                if (check == "noPokemon") {
                    safaribot.sendMessage(src, "Trade cancelled because " + sys.name(targetId) + " doesn't have a " + poke(requestId) + "!", safchan);
                    safaribot.sendMessage(targetId, "Trade cancelled because you don't have a " + poke(requestId) + "!", safchan);
                    sys.sendMessage(src, "" , safchan);
                    sys.sendMessage(targetId, "" , safchan);
                    return;
                }
                if (check == "isStarter") {
                    safaribot.sendMessage(src, "Trade cancelled because " + sys.name(targetId) + " can't trade their starter Pokémon!", safchan);
                    safaribot.sendMessage(targetId, "Trade cancelled because you can't trade your starter Pokémon!", safchan);
                    sys.sendMessage(src, "" , safchan);
                    sys.sendMessage(targetId, "" , safchan);
                    return;
                }
                if (check == "isActive") {
                    safaribot.sendMessage(src, "Trade cancelled because " + sys.name(targetId) + " can't trade the only Pokémon in their party!", safchan);
                    safaribot.sendMessage(targetId, "Trade cancelled because you can't trade the only Pokémon in your party!", safchan);
                    sys.sendMessage(src, "" , safchan);
                    sys.sendMessage(targetId, "" , safchan);
                    return;
                }
                
                this.removePokemon(src, offerId);
                this.removePokemon(targetId, requestId);
                
                player.pokemon.push(requestId);
                target.pokemon.push(offerId);
                
                this.saveGame(player);
                this.saveGame(target);
                
                safaribot.sendMessage(src, "You traded your " + poke(offerId) + " for " + sys.name(targetId) + "'s " + poke(requestId) + "!", safchan);
                safaribot.sendMessage(targetId, "You traded your " + poke(requestId) + " for " + sys.name(src) + "'s " + poke(offerId) + "!", safchan);
                sys.sendMessage(src, "" , safchan);
                    sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
            } else {
                safaribot.sendMessage(src, "Trade cancelleded because you and " + sys.name(targetId) + " didn't come to an agreement!" , safchan);
                safaribot.sendMessage(targetId, "Trade cancelled because you and " + sys.name(src) + " didn't come to an agreement!" , safchan);
                sys.sendMessage(src, "" , safchan);
                    sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
            }
        } else {
            var acceptCommand = "/trade " + sys.name(src) + ":" + sys.pokemon(request[0]) + (request[1] === true ? "*" : "") + ":" + sys.pokemon(offer[0]) + (offer[1] === true ? "*" : "");
            sys.sendHtmlMessage(targetId, "<font color=#3daa68><timestamp/><b>"+("±" + safaribot.name)+":</b></font> To accept the trade, type <a href='po:setmsg/" + acceptCommand + "'>" + acceptCommand + "</a>.", safchan);
            sys.sendMessage(src, "" , safchan);
            sys.sendMessage(targetId, "" , safchan);
            tradeRequests[userName] = { target: targetName, offer: offerId, request: requestId };
        }
    };
    this.canTradePokemon  = function(player, pokeNum) {
        if (player.pokemon.indexOf(pokeNum) === -1) {
            return "noPokemon";
        }
        var count = countRepeated(player.pokemon, pokeNum);
        if (pokeNum === player.starter && count <= 1) {
            return "isStarter";
        }
        if (pokeNum === player.party[0] && player.party.length == 1 && count <= 1) {
            return "isActive";
        }
    };
    this.bait = function (src) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "There's already a wild Pokémon around!", safchan);
            return;
        }
        if (baitCooldown > 0) {
            safaribot.sendMessage(src, "Please wait " + baitCooldown + " seconds before trying to attract another Pokémon with bait!", safchan);
            return;
        }
        var item = "bait";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "!", safchan);
            return;
        }
        player.balls[item] -= 1;
        safaribot.sendAll(sys.name(src) + " left some bait out...", safchan);
        var rng = Math.random();
        if (rng < 0.45) {
            safaribot.sendAll("The bait attracted a wild Pokémon!", safchan);
            baitCooldown = 60;
            safari.createWild();
        } else {
            baitCooldown = 20;
            safaribot.sendAll("... but nothing showed up.", safchan);
        }
    };
    
    
    this.viewOwnInfo = function(src) {
        var player = getAvatar(src), e;
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        
        var out = "";
        
        //Current Party table
        out += this.showParty(src, true);
        
        //All owned Pokémon
        var normal = [], shiny = [], member, name, isShiny, index, count = 0, rowSize = 12;
        for (e in player.pokemon) {
            member = getPokemonInfo(player.pokemon[e]);
            index = member[0];
            isShiny = member[1];
            name = sys.pokemon(index);
            
            if (isShiny) {
                shiny.push("<img src='icon:" + index +"' title='#" + index + " " + name + "'>");
            } else {
                normal.push("<img src='icon:" + index +"' title='#" + index + " " + name + "'>");
            }
        }
        if (shiny.length > 0) {
            out += "<table border = 1 cellpadding = 3><tr><th colspan=2>Owned Pokémon</th></td>  <tr><th>Normal</th><th>Shiny</th></tr>";
        } else {
            out += "<table border = 1 cellpadding = 3><tr><th>Owned Pokémon</th></td></tr>";
        }
        out += "<tr><td>";
        for (e in normal) {
            count++;
            out += normal[e] + " ";
            if (count == rowSize) {
                out += "<p>";
            }
        }
        out += "</td>";
        if (shiny.length > 0) {
            count = 0;
            out += "<td>";
            for (e in shiny) {
                count++;
                out += shiny[e] + " ";
                if (count == rowSize) {
                    out += "<p>";
                }
            }
            out += "</td>";
        }
        out += "</tr></table>";
        
        //All owned Pokémon (Text-only version, lighter but uglier)
        /* var owned = {}, member, name, list = [], normal, shiny;
        for (e in player.pokemon) {
            member = getPokemonInfo(player.pokemon[e]);
            name = sys.pokemon(member[0]);
            if (!(name in owned)) {
                owned[name] = { normal: 0, shiny: 0 };
            }
            owned[name][member[1] === true ? "shiny" : "normal"] += 1;
        }
        for (e in owned) {
            member = owned[e];
            normal = member.normal;
            shiny = member.shiny;
            list.push(e + ": " + (normal > 0 ? normal : "") + (shiny > 0 ? (normal > 0 ? " + " : "") + shiny + "*" : ""));
        }
        list = list.sort();
        
        var rows = Math.ceil(list.length / 12), i, count = 0;
        out += "<table border = 1 cellpadding = 3><tr><th colspan="+rows+">Owned Pokémon</th></td><tr>";
        for (e = 0; e < rows; e++) {
            out += "<td>";
            for (i = 0; i < 12; i++) {
                if (count >= list.length) {
                    break;
                } else {
                    out += "<p style='margin: 2px;'>" + list[count] + "</p>";
                }
                count++;
            }
            out += "</td>";
        }
        out += "</tr></table>"; */
        
        
        //Money/Balls table
        out +=  "<table border = 1 cellpadding = 3><tr><th colspan=8>Inventory</th></tr>";
        out += "<tr><td valign=middle align=center><img src='item:274' title='Money'></td><td><img src='item:8017' title='Bait'></td><td><img src='item:206' title='Rocks'></td><td><img src='item:132' title='Gachapon Tickets'></td><td><img src='item:309' title='Safari Balls'></td><td><img src='item:306' title='Great Balls'></td><td><img src='item:307' title='Ultra Balls'></td><td><img src='item:308' title='Master Balls'></td></tr>";
        out += "<tr><td align=center>$" + player.money + "</td><td align=center>" + player.balls.bait + "</td><td align=center>" + player.balls.rocks + "</td><td align=center>" + player.balls.gacha + "</td><td align=center>" + player.balls.safari + "</td><td align=center>" + player.balls.great + "</td><td align=center>" + player.balls.ultra + "</td><td align=center>" + player.balls.master + "</td></tr>";
        
        out += "<tr><td valign=middle align=center><img src='item:267' title='Dream Balls'></td><td><img src='item:324' title='Luxury Balls'></td><td><img src='item:321' title='Nest Balls'></td><td><img src='item:315' title='Heavy Balls'></td><td><img src='item:326' title='Quick Balls'></td><td><img src='item:316' title='Fast Balls'></td><td><img src='item:312' title='Moon Balls'></td><td><img src='item:318' title='Premier Balls'></td></tr>";
        out += "<tr><td align=center>" + player.balls.dream + "</td><td align=center>" + player.balls.luxury + "</td><td align=center>" + player.balls.nest + "</td><td align=center>" + player.balls.heavy + "</td><td align=center>" + player.balls.quick + "</td><td align=center>" + player.balls.fast + "</td><td align=center>" + player.balls.moon + "</td><td align=center>" + player.balls.premier + "</td></tr>";
        
        out += "</table>";
        sys.sendHtmlMessage(src, out, safchan);
    };
    this.viewPlayer = function(src, data) {
        var id = sys.id(data);
        if (!id) {
            safaribot.sendMessage(src, "No such player!", safchan);
            return;
        }
        var target = getAvatar(id);
        if (!target) {
            safaribot.sendMessage(src, "This person didn't enter the Safari!", safchan);
            return;
        }
        
        sys.sendHtmlMessage(src, this.showParty(id), safchan);
    };
    this.manageParty = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (data === "*") {
            sys.sendHtmlMessage(src, this.showParty(src, true), safchan);
            safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
            return;
        }
        
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't modify your party during a contest!", safchan);
            return;
        }
        
        var info = data.split(":"), action, targetId;
        if (info.length < 2) {
            info = data.split(" ");
            if (info.length < 2) {
                safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
                return;
            }
            action = info[0];
            targetId = info.slice(1).join(" ");
        } else {
            action = info[0].toLowerCase();
            targetId = info[1].toLowerCase();
        }
        
        var target = getInputPokemon(targetId);
        if (target[0] === undefined) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var id = target[0] + (target[1] === true ? "" : 0);
        
        if (player.pokemon.indexOf(id) === -1) {
            safaribot.sendMessage(src, "You don't have that Pokémon!", safchan);
            return;
        }
        
        if (action === "add") {
            if (player.party.length >= 6) {
                safaribot.sendMessage(src, "Please remove a Pokémon from your party before adding another one!", safchan);
                return;
            }
            if (player.party.indexOf(id) !== -1 && countRepeated(player.party, id) >= countRepeated(player.pokemon, id)) {
                safaribot.sendMessage(src, "You don't have more of this pokémon to add to your party!", safchan);
                return;
            }
            
            player.party.push(id);
            safaribot.sendMessage(src, "You added " + poke(id) + " to your party!", safchan);
            this.saveGame(player);
        } else if (action === "remove") {
            if (player.party.indexOf(id) === -1) {
                safaribot.sendMessage(src, "This Pokémon is not in your party!", safchan);
                return;
            }
            if (player.party.length == 1) {
                safaribot.sendMessage(src, "You must have at least 1 Pokémon in your party!", safchan);
                return;
            }
            player.party.splice(player.party.indexOf(id), 1);
            safaribot.sendMessage(src, "You removed " + poke(id) + " from your party!", safchan);
            this.saveGame(player);
        } else if (action === "active") {
            if (player.party.indexOf(id) === -1) {
                safaribot.sendMessage(src, "You need to add that Pokémon to your party first!", safchan);
                return;
            }
            if (player.party[0] === id) {
                safaribot.sendMessage(src, "This is already your active Pokémon!", safchan);
                return;
            }
            
            player.party.splice(player.party.indexOf(id), 1);
            player.party.splice(0, 0, id);
            safaribot.sendMessage(src, "You are now using " + poke(id) + " as your active Pokémon!", safchan);
            this.saveGame(player);
        } else {
            safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
        }
    };
    this.showParty = function(id, ownParty) {
        var player = getAvatar(id),
            party = player.party.map(pokeImage);
        var out = "<table border = 1 cellpadding = 3><tr><th colspan=" + party.length + ">" + (ownParty ? "Current" : sys.name(id) + "'s" ) + " Party</th></tr><tr>";
        for (var e in party) {
            out += "<td>" + party[e] + "</td>";
        }
        out += "</tr><tr>";
        for (var e in player.party) {
            var member = getPokemonInfo(player.party[e]);
            out += "<td align=center>#" + member[0] + " " + sys.pokemon(member[0]) + (member[1] === true ? "*" : "")  + "</td>";
        }
        out += "</tr></table>";
        return out;
    };
    this.removePokemon = function(src, pokeNum) {
        var player = getAvatar(src);
        player.pokemon.splice(player.pokemon.indexOf(pokeNum), 1);
        
        if (player.pokemon.indexOf(pokeNum) === -1) {
            if (player.party.indexOf(pokeNum) !== -1) {
                player.party.splice(player.party.indexOf(pokeNum), 1);
            }
        }
    };
    /*this.dailyReward = function(src, today) {
        var player = getAvatar(src);
        
        if (today > player.lastLogin) {
            if (today !== player.lastLogin + 1) {
                player.consecutiveLogins = 0;
            }
            player.consecutiveLogins += 1;
            player.lastLogin = today;
            var logins = player.consecutiveLogins;
            
            var gained = [];
            
            var moneyRewards = [50, 50, 50, 50, 75, 75, 75, 75, 100, 100, 100, 150, 150, 150, 200, 200, 250, 250, 300];
            var moneyGained = 0;
            
            if (logins > moneyRewards.length) {
                moneyGained = moneyRewards[moneyRewards.length-1];
            } else {
                moneyGained = moneyRewards[logins-1];
            }
            gained.push("$" + moneyGained);
            player.money += moneyGained;
            
            var safariGained = 0;
            if (logins <= 2) {
                safariGained = 1;
            } else if (logins <= 4) {
                safariGained = 2;
            } else if (logins <= 6) {
                safariGained = 3;
            } else if (logins <= 8) {
                safariGained = 4;
            } else {
                safariGained = 5;
            }
            player.balls.safari += safariGained;
            gained.push(safariGained + "x Safari Ball" + (safariGained > 1 ? "s" : ""));
            
            if (logins % 12 === 0) {
                player.balls.master += 1;
                gained.push("1x Master Ball");
            } else if (logins % 6 === 0) {
                player.balls.ultra += 1;
                gained.push("1x Ultra Ball");
            } else if (logins % 3 === 0) {
                player.balls.great += 1;
                gained.push("1x Great Ball");
            }
            
            safaribot.sendMessage(src, "You received the following rewards for joining Safari today: " + gained.join(", "), safchan);
            this.saveGame(player);
        }
    };*/
    
    this.startGame = function(src, data) {
        if (getAvatar(src)) {
            safaribot.sendMessage(src, "You already have a starter pokémon!", safchan);
            return;
        }
        if (!sys.dbRegistered(sys.name(src).toLowerCase())) {
            safaribot.sendMessage(src, "Please register your account before starting the game!");
            return true;
        }
        var num = getInputPokemon(data)[0];
        if (!num || starters.indexOf(num) === -1) {
            safaribot.sendMessage(src, "Invalid Pokémon! Possible choices: " + starters.map(sys.pokemon).join(", "), safchan);
            return;
        }
        var player = {
            id: sys.name(src).toLowerCase(),
            pokemon: [num],
            party: [num],
            money: 300,
            balls: {
                safari: 30,
                great: 0,
                ultra: 0,
                master: 0,
                dream: 0,
                heavy: 0,
                nest: 0,
                luxury: 0,
                quick: 0,
                fast: 0,
                moon: 0,
                bait: 0,
                rocks: 0,
                premier: 0,
                gacha: 0
            },
            starter: num,
            lastLogin: getDay(now()),
            consecutiveLogins: 1,
            cooldown: 0
        };
        SESSION.users(src).safari = player;
        this.saveGame(player);
        safaribot.sendMessage(src, "You received a " + poke(num) + " and 30 Safari Balls!", safchan);
    };
    this.saveGame = function(player) {
        rawPlayers.add(player.id, JSON.stringify(player));
    };
    this.loadGame = function(src) {
        var data = rawPlayers.get(sys.name(src).toLowerCase());
        if (data) {
            var player = JSON.parse(data);
            
            // clean bad player values here
            for (var ball in player.balls) {
                if (player.balls[ball] === undefined || isNaN(player.balls[ball])) player.balls[ball] = 0;
            }
            
            SESSION.users(src).safari = player;
            
            safaribot.sendMessage(src, "Your Safari data was successfully loaded!", safchan);
            //this.dailyReward(src, getDay(now()));
        }
    };
    this.changeAlt = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var targetId = sys.id(data);
        if (!targetId) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return;
        }
        if (targetId === src) {
            safaribot.sendMessage(src, "You can't pass it to the same alt!", safchan);
            return;
        }
        if (!sys.dbRegistered(data.toLowerCase())) {
            safaribot.sendMessage(src, "That account isn't registered so you can't pass your Safari data!", safchan);
            return true;
        }
        if (sys.ip(targetId) !== sys.ip(src)) {
            safaribot.sendMessage(src, "Both accounts must be on the same IP to switch!", safchan);
            return true;
        }
        
        var target = getAvatar(targetId);
        
        if (target) {
            target.id = player.id;
            player.id = sys.name(targetId).toLowerCase();
            
            SESSION.users(src).safari = target;
            SESSION.users(targetId).safari = player;
            
            this.saveGame(player);
            this.saveGame(target);
            
            safaribot.sendMessage(src, "You swapped Safari data with " + sys.name(targetId) + "!", safchan);
            safaribot.sendMessage(targetId, "You swapped Safari data with " + sys.name(src) + "!", safchan);
        } else {
            SESSION.users(src).safari = null;
            rawPlayers.remove(player.id);
            
            SESSION.users(targetId).safari = player;
            player.id = data.toLowerCase();
            this.saveGame(player);
            
            safaribot.sendMessage(src, "You passed your Safari data to " + sys.name(targetId) + "!", safchan);
            safaribot.sendMessage(targetId, sys.name(src) + " passed their Safari data to you!", safchan);
        }
    };
    
    this.showRules = function (src) {
        var rules = [
            "",
            "*** *********************************************************************** ***",
            "±Rules: Catch them all.",
            "*** *********************************************************************** ***",
            ""
        ];
        for (var x = 0; x < rules.length; x++) {
            sys.sendMessage(src, rules[x], safchan);
        }
    };
    this.showHelp = function (src) {
        var x, help = [
            "",
            "*** *********************************************************************** ***",
            "±Goal: Use your Poké Balls to catch Wild Pokémon that appear during contest times.",
            "±Goal: You can trade those Pokémon with other players or simply brag about your collection.",
            "±Goal: To start playing, type /start to choose your starter Pokémon and receive 30 Safari Balls.",
            "*** *********************************************************************** ***",
            "±Contest: A contest starts every 30 minutes. During that time, wild Pokémon may suddenly appear.",
            "±Contest: When a wild Pokémon is around, players can use /catch to throw a ball until someone gets it.",
            "±Contest: Different balls can be used to get a better chance, but they also have higher cooldown between throws.",
            "*** *********************************************************************** ***",
            "±Actions: Pokémon you caught can be sold to the NPC with /sell or traded with other players with /trade.",
            "±Actions: You can use the money gained by selling Pokémon and logging in everyday to /buy more Poké Balls.",
            "±Actions: You can set up to 6 Pokémon to be visible to anyone. Form your party with /party, and view others' party with /view.",
            "±Actions: Use /party active:[pokémon] to choose your active Pokémon. This can give you a small bonus when trying to catch Wild Pokémon based on type effectiveness and base stats difference.",
            "*** *********************************************************************** ***",
            ""
        ];
        for (x in help) {
            sys.sendMessage(src, help[x], safchan);
        }
    };
    this.onHelp = function (src, topic, channel) {
        if (topic === "safari") {
            safari.showCommands(src, channel);
            return true;
        }
        return false;
    };
    this.showCommands = function (src, channel) {
        var userHelp = [
            "",
            "*** Safari Commands ***",
            "/help: For a how-to-play guide.",
            "/start: To pick a starter Pokémon and join the Safari game.",
            "/catch [ball]: To throw a Safari Ball when a wild Pokémon appears. [ball] can be Safari, Great, Ultra, Master, or Dream Ball.",
            "/sell: To sell one of your Pokémon*.",
            "/trade: To request a Pokémon trade with another player*.",
            "/buy: To buy more Poké Balls.",
            "/party: To add or remove a Pokémon from your party, or to set your party's leader*.",
            "/mydata: To view your caught Pokémon, money and remaining balls.",
            "/view: To view another player's party. If no player is specified, your data will show up.",
            "/changealt: To pass your Safari data to another alt.",
            "/bait: To throw bait in the attempt to lure a Wild Pokémon",
            "",
            "*: Add an * to a Pokémon's name to indicate a shiny Pokémon."
        ];
        var help = userHelp;
        /*var adminHelp = [
            "*** Hangman Admin Commands ***",
            "/hangmanban: To ban a user in safari. Format /hangmanban name:reason:time"
        ];*/
        var superAdminHelp = [
            "*** Safari Admin Commands ***",
            "/contest: Force starts a Safari contest. Use /contestsoft to skip broadcasting to Tohjo Falls.",
            "/wild: Spawns a random wild Pokemon with no restrictions. Use a valid dex number for a specific spawn."
        ];
        var ownerHelp = [
            "*** Safari Owner Commands ***",
            "/wipesafari: Clears a user's Safari data permanently."
        ];
        /*if (sys.auth(src) > 0) {
            help.push.apply(help, adminHelp);
        }*/
        if (sys.auth(src) > 1) {
            help.push.apply(help, superAdminHelp);
        }
        if (sys.auth(src) > 2) {
            help.push.apply(help, ownerHelp);
        }
        for (var x = 0; x < help.length; x++) {
            sys.sendMessage(src, help[x], channel);
        }
    };
    this["help-string"] = ["safari: To know the safari commands"];

    this.handleCommand = function (src, message, channel) {
        var command;
        var commandData = "*";
        var pos = message.indexOf(' ');
        if (pos !== -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        }
        else {
            command = message.substr(0).toLowerCase();
        }
        if (channel !== safchan && [].indexOf(command) === -1) {
            return false;
        }
        if (command === "help") {
            safari.showHelp(src);
            return true;
        }
        if (command === "start") {
            safari.startGame(src, commandData);
            return true;
        }
        if (command === "catch") {
            safari.throwBall(src, commandData);
            return true;
        }
        if (command === "sell") {
            safari.sellPokemon(src, commandData);
            return true;
        }
        if (command === "buy") {
            safari.buyItems(src, commandData);
            return true;
        }
        if (command === "view") {
            if (!commandData) {
                safari.viewOwnInfo(src, commandData);
            } else {
                safari.viewPlayer(src, commandData);
            }
            return true;
        }
        if (command === "trade") {
            safari.tradePokemon(src, commandData);
            return true;
        }
        if (command === "party") {
            safari.manageParty(src, commandData);
            return true;
        }
        if (command === "mydata") {
            safari.viewOwnInfo(src, commandData);
            return true;
        }
        if (command === "changealt") {
            safari.changeAlt(src, commandData);
            return true;
        }
        if (command === "bait") {
            safari.bait(src);
            return true;
        }
        if (command === "gacha") {
            commandbot.sendMessage(src, "The command gacha is coming soon!", safchan);
            return true;
            //safari.gachapon(src);
            //return true;
        }
        
        //Test commands to make a wild Pokémon appear or start/end a contest
        if (command === "wild" || command == "wilds") {
            if (sys.auth(src) < 2) {
                commandbot.sendMessage(src, "The command wild doesn't exist", safchan);
                return true;
            }
            if (currentPokemon) {
                safaribot.sendMessage(src, "There's already a Wild Pokemon out there silly!", safchan);
                return true;
            }
            var dexNum = 0, makeShiny = false;
            if (!isNaN(commandData) && commandData > 0 && commandData < 722) {
                dexNum = commandData;
            }
            if (command === "wilds") {
                makeShiny = true;
            }
            safari.createWild(dexNum, makeShiny);
            return true;
        }
        if (command === "contest" || command === "contestsoft") {
            if (sys.auth(src) < 2) {
                commandbot.sendMessage(src, "The command " + command + " doesn't exist", safchan);
                return true;
            }
            if (command == "contestsoft") {
                contestBroadcast = false;
            }
            if (contestCount > 0) {
                contestCount = 1;
            } else {
                contestCooldown = 1;
            }
            return true;
        }
        if (command === "wipesafari") {
            if (sys.auth(src) < 2) {
                commandbot.sendMessage(src, "The command " + command + " doesn't exist", safchan);
                return true;
            }
            
            var playerId = sys.id(commandData);
            if (!playerId) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return;
            }
            var player = getAvatar(playerId);
            SESSION.users(playerId).safari = null;
            rawPlayers.remove(sys.name(playerId).toLowerCase());
            this.saveGame(player);
            
            safaribot.sendAll(commandData + "'s safari has been reset!", safchan);
            return true;
        }
        if (command === "sanitize") {
            if (sys.auth(src) < 1) {
                commandbot.sendMessage(src, "The command " + command + " doesn't exist", safchan);
                return true;
            }
            var playerId = sys.id(commandData);
            if (!playerId) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }
            var player = getAvatar(playerId);
            if (player) {
                var item = ["bait", "rock", "gacha", "safari", "great", "ultra", "master",
                   "dream", "luxury", "nest", "heavy", "quick", "fast", "moon", "premier"];
                for (var item in player.balls) {
                    if (player.balls[item] === undefined || isNaN(player.balls[item])) {
                        player.balls[item] = 0;
                    }
                }
                if (player.money === undefined || isNaN(player.money)) {
                    player.money = 0;
                }
                this.saveGame(player);
                safaribot.sendAll(commandData + "'s Safari has been sanitized of invalid values!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }
            
            return true;
        }
        if (command === "safaripay") {
            if (sys.auth(src) < 1) {
                commandbot.sendMessage(src, "The command " + command + " doesn't exist", safchan);
                return true;
            }
            
            var cmd = commandData.split(":");
            var target = cmd[0];
            var moneyGained = parseInt(cmd[1], 10);
            
            var playerId = sys.id(target);
            if (!playerId) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }
            var player = getAvatar(playerId);
            if (player) {
                player.money += moneyGained;
                if (player.money < 0) {
                    player.money = 0;
                } else if (player.money > 9999999) {
                    player.money = 9999999;
                }
                this.saveGame(player);
                safaribot.sendAll(target + " has been awarded with $" + moneyGained + " by " + sys.name(src) + "!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }
            return true;
        }
        
        return false;
    };
    this.init = function () {
        var name = defaultChannel;
        if (sys.existChannel(name)) {
            safchan = sys.channelId(name);
        }
        else {
            safchan = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(safchan);
        SESSION.channels(safchan).perm = true;
        rawPlayers = new MemoryHash(saveFiles);
    };
    this.afterChannelJoin = function (src, channel) {
        if (channel == safchan) {
            this.loadGame(src);
        }
        return false;
    };
    this.stepEvent = function () {
        contestCooldown--;
        baitCooldown--;
        if (contestCooldown === 180) {
            sys.sendAll("*** ************************************************************ ***", safchan);
            safaribot.sendAll("A new Safari contest will start in 3 minutes! Prepare your active Pokémon and all Poké Balls you need!", safchan);
            sys.sendAll("*** ************************************************************ ***", safchan);
            
            sys.sendAll("*** ************************************************************ ***", 0);
            safaribot.sendAll("A new Safari contest will start in 3 minutes at #" + defaultChannel + "! Prepare your active Pokémon and all Poké Balls you need!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
        }
        if (contestCooldown === 0) {
            contestCooldown = contestCooldownLength;
            contestCount = contestDuration;
            sys.sendAll("*** ************************************************************ ***", safchan);
            safaribot.sendAll("A new Safari contest is starting now!", safchan);
            sys.sendAll("*** ************************************************************ ***", safchan);
            
            if (contestBroadcast) {
                sys.sendAll("*** ************************************************************ ***", 0);
                safaribot.sendAll("A new Safari contest is starting now at #" + defaultChannel + "!", 0);
                sys.sendAll("*** ************************************************************ ***", 0);
            } else {
                contestBroadcast = true;
            }
            
            safari.createWild();
        }
        SESSION.global().safariContestCooldown = contestCooldown;
        SESSION.global().safariBaitCooldown = baitCooldown;
        
        if (contestCount > 0) {
            contestCount--;
            if (contestCount === 0) {
                sys.sendAll("*** ************************************************************ ***", safchan);
                safaribot.sendAll("The Safari contest is now over! Please come back during the next contest!", safchan);
                sys.sendAll("*** ************************************************************ ***", safchan);
                currentPokemon = null;
                
                //Check daily rewards after a contest so players won't need to relog to get their reward when date changes
                var onChannel = sys.playersOfChannel(safchan),
                    today = getDay(now());
                /*for (var e in onChannel) {
                    safari.dailyReward(onChannel[e], today);
                }*/
                rawPlayers.save();
            } else {
                if (!currentPokemon && Math.random() < 0.05) {
                    safari.createWild();
                }
            }
        }
    };
}
module.exports = new Safari();
