/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys, module, SESSION, safaribot, require, commandbot */

var MemoryHash = require("memoryhash.js").MemoryHash;
var Bot = require('bot.js').Bot;
var utilities = require('utilities.js');
var html_escape = utilities.html_escape;

function Safari() {
    var safari = this;
    var safchan;
    var safaribot = new Bot("Tauros");
    var defaultChannel = "Safari";
    var saveFiles = "scriptdata/safarisaves.txt";
    var rawPlayers;
    
    var shinyChance = 1024; //Chance for Shiny Pokémon
    var starters = [1, 4, 7];
    var currentPokemon = null;

    var tradeRequests = {};
    var gachaponPrizes = []; //Creates Gachapon on update.
    var gachaJackpotAmount = 100; //Jackpot for gacha tickets. Number gets divided by 10 later.
    var gachaJackpot = (SESSION.global() && SESSION.global().safariGachaJackpot ? SESSION.global().safariGachaJackpot : gachaJackpotAmount);
    
    var contestCooldownLength = 1800; //1 contest every 30 minutes
    var baitCooldownLength = 0;
    var releaseCooldownLength = 240; //1 release every 4 minutes
    var contestBroadcast = true; //Determines whether Tohjo gets notified
    var contestCooldown = (SESSION.global() && SESSION.global().safariContestCooldown ? SESSION.global().safariContestCooldown : contestCooldownLength);
    var baitCooldown = (SESSION.global() && SESSION.global().safariBaitCooldown ? SESSION.global().safariBaitCooldown : baitCooldownLength);
    var releaseCooldown = (SESSION.global() && SESSION.global().safariReleaseCooldown ? SESSION.global().safariReleaseCooldown : releaseCooldownLength);
    var contestDuration = 300; //Contest lasts for 5 minutes
    var contestCount = 0;
    var contestCatchers = [];
    var preparationPhase = 0;
    var preparationThrows = {};
    var preparationFirst = null;
    
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
    
    //Data on items
    var itemData = {
        //Balls
        safari: {name: "safari", fullName: "Safari Ball", type: "ball", price: 30, ballBonus: 1, cooldown: 6000, aliases:["safariball", "safari", "safari ball", "*"]},
        great: {name: "great", fullName: "Great Ball", type: "ball", price: 60, ballBonus: 1.5, cooldown: 9000, aliases:["greatball", "great", "great ball"]},
        ultra: {name: "ultra", fullName: "Ultra Ball", type: "ball", price: 120, ballBonus: 2, cooldown: 12000, aliases:["ultraball", "ultra", "ultra ball"]},
        master: {name: "master", fullName: "Master Ball", type: "ball", price: 0, ballBonus: 255, cooldown: 90000, aliases:["masterball", "master", "master ball"]},
        
        dream: {name: "dream", fullName: "Dream Ball", type: "ball", price: 0, ballBonus: 1, bonusRate: 3, cooldown: 9000, aliases:["dreamball", "dream", "dream ball"]},
        heavy: {name: "heavy", fullName: "Heavy Ball", type: "ball", price: 0, ballBonus: 1, bonusRate: 5, cooldown: 12000, aliases:["heavyball", "heavy", "heavy ball"]},
        nest: {name: "nest", fullName: "Nest Ball", type: "ball", price: 0, ballBonus: 1,  bonusRate: 5, cooldown: 4000, aliases:["nestball", "nest", "nest ball"]},
        luxury: {name: "luxury", fullName: "Luxury Ball", type: "ball", price: 0, ballBonus: 2, cooldown: 8000, aliases:["luxuryball", "luxury", "luxury ball"]},
        moon: {name: "moon", fullName: "Moon Ball", type: "ball", price: 0, ballBonus: 1, bonusRate: 5, cooldown: 8000, aliases:["moonball", "moon", "moon ball"]},
        premier: {name: "premier", fullName: "Premier Ball", type: "ball", price: 0, ballBonus: 1.5, bonusRate: 3, cooldown: 6000, aliases:["premierball", "premier", "premier ball"]},
    
        //Other Items
        bait: {name: "bait", fullName: "Bait", type: "usable", price: 100, successRate: 0.35, failCD: 15, successCD: 50, aliases:["bait"]},
        rock: {name: "rock", fullName: "Rock", type: "usable", price: 50, successRate: 0.70, bounceRate: 0.02, aliases:["rock", "rocks"]},
        gacha: {name: "gacha", fullName: "Gachapon Ticket", type: "usable", price: 149, aliases:["gacha", "gachapon", "gachapon ticket", "gachaponticket"]},
        
        //Perks
        amulet: {name: "amulet", fullName: "Amulet Coin", type: "perk", price: 0, bonusRate: 0.05, maxRate: 0.25, aliases:["amulet", "amuletcoin", "amulet coin", "coin"]},
        honey: {name: "honey", fullName: "Honey", type: "perk", price: 0, bonusRate: 0.05, maxRate: 0.25, aliases:["honey"]},
        zoom: {name: "zoom", fullName: "Zoom Lens", type: "perk", price: 0, bonusRate: 0.05, maxRate: 0.25, aliases:["zoom", "zoomlens", "zoom lens", "lens"]}
    };
    
    //Master list of items
    var currentItems = Object.keys(itemData);
    var retiredItems = ["rocks", "fast", "quick"];
    var allItems = currentItems.concat(retiredItems);
        
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
    function modeArray(arr) {
        var mode = {};
        var max = 0, count = 0;
        
        arr.forEach(function(e) {
            if (mode[e]) {
                mode[e]++;
            } else {
                mode[e] = 1;
            }

            if (count<mode[e]) {
                max = e;
                count = mode[e];
            }
        });
       
        return max;
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
    function hasType(pokeNum, type) {
        return sys.type(sys.pokeType1(pokeNum)) == type || sys.type(sys.pokeType2(pokeNum)) == type;
    }
    function getBST(pokeNum) {
        return add(sys.pokeBaseStats(pokeNum));
    }
    function pokeImage(num) {
        return "<img src='pokemon:num=" + num + (typeof num == "string" ? "&shiny=true" : "") + "&gen=6'>";
    }
    function itemAlias(name) {
        name = name.toLowerCase();
        for (var e in itemData) {
            if (itemData[e].aliases.indexOf(name) !== -1) {
                return itemData[e].name;
            }
        }
        return "safari";
    }
    function fillArray(item, amount) {
        var ret = [];
        for (var i = 0; i < amount; i++) {
            ret.push(item);
        }
        return ret;
    }
    function countArray(arr, item) {
        var first = arr.indexOf(item);
        var last = arr.lastIndexOf(item);
        var count =  last - first + (first === -1 ? 0 : 1);
        return count;
    }
    
    function finishName(item) {
        return itemData[item].fullName;
    }
    function isBall(item) {
        return itemData[item].type === "ball";
    }
    function shuffle(o) {
        for (var j, x, i = o.length; i; j = parseInt(Math.random() * i, 10), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }
    
    this.initGacha = function () {
        var tempArray = [];
        var gachaItems =   {
            safari: 70, great: 30, ultra: 20, master: 2, luxury: 20, dream: 20, nest: 20, heavy: 20,
            moon: 20, bait: 30, rock: 30,  wild: 30, gacha: 1,  honey: 1,  amulet: 1, zoom: 1
        };

        for (var e in gachaItems) {
            if (currentItems.indexOf(e) === -1) {
                continue;
            }
            tempArray = fillArray(e, gachaItems[e]);
            gachaponPrizes = gachaponPrizes.concat(tempArray);
            tempArray = [];
        }
    };
    
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
        
        sys.sendHtmlAll("<hr><center>A wild " + pokeId + " appeared! <i>(BST: " + add(sys.pokeBaseStats(num)) + ")</i><br/>" + pokeImage(num + (shiny ? "" : 0)) + "</center><hr>", safchan);
        currentPokemon = shiny ? "" + num : num;
        preparationPhase = sys.rand(4, 7);
        preparationThrows = {};
        preparationFirst = null;
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
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldown - currentTime)/1000) + 1) + " seconds before throwing a ball!", safchan);
            return;
        }
        
        var ball = itemAlias(data);
        var ballBonus = itemData[ball].ballBonus;
        var cooldown = itemData[ball].cooldown;
        
        if (isNaN(player.balls[ball])) {
            player.balls[ball] = 0;
        }
        if (!(ball in player.balls) || player.balls[ball] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(ball) + " Balls!", safchan);
            return;
        }
        
        if (preparationPhase > 0) {
            safaribot.sendMessage(src, "You are preparing to throw your " + cap(ball) + " Ball!", safchan);
            preparationThrows[sys.name(src)] = ball;
            return;
        }
        
        player.balls[ball] -= 1;
        var pokeName = poke(currentPokemon);
        var wild = typeof currentPokemon == "string" ? parseInt(currentPokemon, 10) : currentPokemon;
        var shinyChance = typeof currentPokemon == "string" ? 0.40 : 1;
        
        var userStats = add(sys.pokeBaseStats(player.party[0]));
        var wildStats = add(sys.pokeBaseStats(wild));
        var statsBonus = (userStats - wildStats) / 6000;
        
        var legendaries = ["Articuno","Zapdos","Moltres","Mewtwo","Mew","Raikou","Entei","Suicune","Lugia","Ho-Oh","Celebi","Regirock","Regice","Registeel","Latias","Latios","Kyogre","Groudon","Rayquaza","Jirachi","Deoxys","Uxie","Mesprit","Azelf","Dialga","Palkia","Heatran","Regigigas","Giratina","Cresselia","Manaphy","Darkrai","Shaymin","Arceus","Victini","Cobalion","Terrakion","Virizion","Tornadus","Thundurus","Reshiram","Zekrom","Landorus","Kyurem","Keldeo","Meloetta","Genesect","Xerneas","Yveltal","Zygarde","Diancie","Hoopa","Volcanion"];
        
        if (ball === "dream" && shinyChance == 0.40) {
            shinyChance = 1;
            ballBonus = itemData[ball].bonusRate;
        }
        if (ball === "heavy" && wildStats > 550) {
            ballBonus = itemData[ball].bonusRate;
        }
        if (ball === "nest" && wildStats < 420) {
            ballBonus = itemData[ball].bonusRate;
        }
        if (ball === "moon" && legendaries.indexOf(pokeName) != -1) {
            ballBonus = itemData[ball].bonusRate;
        }
        if (ball === "premier" && (sys.type(sys.pokeType1(player.party[0])) === "Normal" || sys.type(sys.pokeType2(player.party[0])) === "Normal")) {
            ballBonus = itemData[ball].bonusRate;
        }
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
            safaribot.sendAll(sys.name(src) + " caught the " + pokeName + " with a " + cap(ball) + " Ball!" , safchan);
            safaribot.sendMessage(src, "Gotcha! " + pokeName + " was caught with a " + cap(ball) + " Ball! You still have " + player.balls[ball] + " " + cap(ball) + " Ball(s)!", safchan);
            player.pokemon.push(currentPokemon);
            
            if (ball == "luxury") {
                safaribot.sendAll(sys.name(src) + " also found $" + Math.floor(wildStats/2) + " on the ground after catching " + pokeName + "!" , safchan);
                player.money += Math.floor(wildStats/2);
            }
            
            sys.sendAll("", safchan);
            currentPokemon = null;
            cooldown *= 2;
            if (contestCount > 0) {
                contestCatchers.push(sys.name(src));
            }
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
        
        var perk = "amulet";
        var perkBonus = 1 + Math.min(itemData[perk].bonusRate * player.balls[perk], itemData[perk].maxRate);
        var price = Math.round(add(sys.pokeBaseStats(pokeId)) * (shiny ? 5 : 1) * perkBonus);
        
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
            safaribot.sendMessage(src, "Safari Ball: $" + itemData.safari.price, safchan);
            safaribot.sendMessage(src, "Great Ball: $" + itemData.great.price, safchan);
            safaribot.sendMessage(src, "Ultra Ball: $" + itemData.ultra.price, safchan);
            safaribot.sendMessage(src, "Gachapon Ticket: $" + itemData.gacha.price, safchan);
            safaribot.sendMessage(src, "Bait: $" + itemData.bait.price, safchan);
            safaribot.sendMessage(src, "Rock: $" + itemData.rock.price, safchan);
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You currently have $" + player.money + ". To buy an item, use /buy item:quantity (e.g.: /buy safari:3)", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        var info = data.split(":");
        var item = itemAlias(info[0]);
        var amount = 1;
        if (info.length > 1) {
            amount = parseInt(info[1], 10);
            if (isNaN(amount) || amount < 1) {
                amount = 1;
            }
        }
        
        var validItems = ["safari", "bait", "gacha", "ultra", "great", "rock"];
        if (validItems.indexOf(item) == -1) {
            safaribot.sendMessage(src, "You can not buy this item here!", safchan);
            return;
        }
        
        var cost = amount * itemData[item].price;
        if (isNaN(player.money)) {
            player.money = 0;
        }
        if (player.money < cost) {
            safaribot.sendMessage(src, "You need $" + cost + " to buy " + amount + " " + finishName(item) + ", but you only have $" + player.money + "!", safchan);
            return;
        }
        
        player.money -= cost;
        if (isNaN(player.balls[item])) {
            player.balls[item] = 0;
        }
        player.balls[item] += amount;
        safaribot.sendMessage(src, "You bought " + amount + " " + finishName(item) +  " for $" + cost + "! You now have " + player.balls[item] + " " + finishName(item) + " and $" + player.money + "!", safchan);
        
        var bonus;
        if (amount >= 10) {
            if (isBall(item)) {
                bonus = "premier";
                safaribot.sendMessage(src, "Here, take these " + Math.floor(amount / 10) + " Premier Balls for your patronage!", safchan);
            } else if (item === "gacha") {
                bonus = "gacha";
                safaribot.sendMessage(src, "Here, take these " + Math.floor(amount / 10) + " extra Gachapon Tickets for your patronage!", safchan);
            }
            player.balls[bonus] += Math.floor(amount / 10);
        }
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
                safaribot.sendMessage(src, "Trade cancelled because you and " + sys.name(targetId) + " didn't come to an agreement!" , safchan);
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
    this.throwBait = function (src, commandData) {
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
        if (contestCount > 0) {
            safaribot.sendMessage(src, "Contest rules forbid the use of Bait. Please wait until the Contest is over.", safchan);
            return;
        }
        var item = "bait";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "!", safchan);
            return;
        }
        player.balls[item] -= 1;
        
        var rng = Math.random();
        var perk = "honey";
        var perkBonus = Math.min(itemData[perk].bonusRate * player.balls[perk], itemData[perk].maxRate);
        
        if (rng < (itemData.bait.successRate + perkBonus)) {
            safaribot.sendAll(sys.name(src) + " left some bait out. The bait attracted a wild Pokémon!", safchan);
            baitCooldown = itemData.bait.successCD + sys.rand(0,10);
            safari.createWild();
            if (commandData !== undefined) {
                safari.throwBall(src, commandData);
                preparationFirst = sys.name(src);
            }
        } else {
            baitCooldown = itemData.bait.failCD + sys.rand(0,5);
            safaribot.sendAll(sys.name(src) + " left some bait out... but nothing showed up.", safchan);
        }
    };
    this.throwRock = function (src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var targetId = sys.id(commandData);
        if (!targetId) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return true;
        }
        var target = getAvatar(targetId);
        if (!target) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return true;
        }
        var currentTime = now();
        if (player.rockCooldown > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.rockCooldown - currentTime)/1000) + 1) + " seconds before trying to a throw another rock!", safchan);
            return;
        }
        var item = "rock";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "s!", safchan);
            return;
        }
        
        player.balls[item] -= 1;
        
        var rng = Math.random();
        var perk = "zoom";
        var perkBonus = Math.min(itemData[perk].bonusRate * player.balls[perk], itemData[perk].maxRate);
        var success = itemData.rock.successRate + perkBonus;
        
        var targetName = utilities.non_flashing(sys.name(targetId));
        if (rng < success) {
            safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "! *THUD* A direct hit! " + targetName + " was stunned!", safchan);
            // target.cooldown = currentTime + 6000; //Remove comment to make rocks actually work
        } else if (rng < success + itemData.rock.bounceRate) {
            safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + ", but it hit a wall and bounced back at " + sys.name(src) + "! *THUD* That will leave a mark on " + sys.name(src) + "'s face and pride!", safchan);
            player.cooldown = currentTime + 8000;
        } else {
            safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "... but it missed!", safchan);
        }
        player.rockCooldown = currentTime + 10000;
    };
    this.gachapon = function (src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        
        var currentTime = now();
        if (currentPokemon) {
            safaribot.sendMessage(src, "It's unwise to ignore a wild Pokémon in order to use a Gachapon Machine...", safchan);
            return;
        }
        if (player.gachaCooldown > currentTime) {
            safaribot.sendMessage(src, "A long line forms in front of the Gachapon Machine. It will probably take " + (Math.floor((player.gachaCooldown - currentTime)/1000) + 1) + " seconds before you can use the Gachapon Machine again!", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] For maintenance. Will be fixed by time the contest is over!", safchan);
            return;
        }
        var gach = "gacha";
        if (isNaN(player.balls[gach])) {
            player.balls[gach] = 0;
        }
        if (!(gach in player.balls) || player.balls[gach] <= 0) {
            safaribot.sendMessage(src, "You have no Gachapon Tickets!", safchan);
            return;
        }
        player.balls[gach] -= 1;
        var rng = sys.rand(0, gachaponPrizes.length);
        var reward = gachaponPrizes[rng];
        safaribot.sendMessage(src, "Gacha-PON! The Gachapon Machine has dispensed an item capsule.", safchan);
        
        //Variable for higher quantity rewards later. Make better later maybe?
        var amount = 1;
        var rng2 = Math.random();
        if (rng2 < 0.03) {
            amount = 4;
        } else if (rng2 < 0.13) {
            amount = 3;
        } else if (rng2 < 0.45) {
            amount = 2;
        }
        var plural = amount > 1 ? "s" : "";
        
        switch (reward) {
            case "master":
                if (player.balls[reward] >= 1) {
                    sys.sendHtmlAll("<font color=#3DAA68><timestamp/><b>±Gachapon:</b></font> <b>JACKP--</b> Wait a second... " + html_escape(sys.name(src)) + "'s Master Ball turned out to be a simple Safari Ball painted to look like a Master Ball! What a shame!", safchan);
                    safaribot.sendMessage(src, "You wiped the paint off of the ball and pocketed 1 Safari Ball for your troubles.", safchan);
                    reward = "safari";
                    player.balls[reward] += 1;
                } else {
                    sys.sendHtmlAll("<font color=#3DAA68><timestamp/><b>±Gachapon:</b></font> <b>JACKPOT! " + html_escape(sys.name(src)) + " just won a Master Ball from the Gachapon Machine!</b>", safchan);
                    safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
                    player.balls[reward] += 1;
                }
            break;
            case "bait":
                player.balls[reward] += amount;
                safaribot.sendMessage(src, "A sweet, fruity aroma wafts through the air as you open your capsule. You received " + amount + " " + finishName(reward) + ".", safchan);
            break;
            case "rock":
                player.balls[reward] += amount;
                safaribot.sendMessage(src, "A loud clunk comes from the machine. Some prankster put rocks in the Gachapon Machine! You received  " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
            case "wild":
                var mod = Math.random();
                var spawn = true;
                safaribot.sendAll(sys.name(src) + " goes to grab their item from the Gachapon Machine but the noise lured a wild Pokémon!", safchan);
                if (mod < 0.1) {
                    safaribot.sendAll("But it fled before anyone could try to catch it!", safchan);
                    spawn = false;
                }
                if (spawn) {
                    safari.createWild();
                    if (commandData !== undefined) {
                        safari.throwBall(src, commandData);
                        preparationFirst = sys.name(src);
                    }
                }
            break;
            case "safari":
                player.balls[reward] += 1;
                safaribot.sendMessage(src, "Bummer, only a Safari Ball... You received 1 " + finishName(reward) + ".", safchan);
            break;
            case "gacha":
                var jackpot = Math.floor(gachaJackpot/10);
                sys.sendHtmlAll("<font color=#3DAA68><timestamp/><b>±Gachapon:</b></font> <b>JACKPOT! " + html_escape(sys.name(src)) + " just won the Gachapon Ticket Jackpot valued at " + jackpot + " tickets!</b>", safchan);
                player.balls[reward] += jackpot;
                safaribot.sendMessage(src, "You received " + jackpot + " Gachapon Tickets.", safchan);
                gachaJackpot = 100; //Reset jackpot for next player
            break;
            case "honey":
            case "amulet":
            case "zoom":
                player.balls[reward] += 1;
                safaribot.sendAll("Sweet! " + sys.name(src) + " just won a " + finishName(reward) + " from Gachapon!", safchan);
                safaribot.sendMessage(src, "You received " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
            default:
                player.balls[reward] += amount;
                safaribot.sendMessage(src, "You received " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
        }
        player.gachaCooldown = currentTime + 5000;
        gachaJackpot += 1;
        SESSION.global().safariGachaJackpot = gachaJackpot;
    };
    this.releasePokemon = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        //Maybe reduce this into a function? Most is used in sellPokemon and tradePokemon
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't release during a contest!", safchan);
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To release a Pokémon, use /release [name]:confirm!", safchan);
            return;
        }
        if (player.pokemon.length == 1) {
            safaribot.sendMessage(src, "You cannot release your last Pokémon!", safchan);
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
            safaribot.sendMessage(src, "You can't release the only Pokémon in your party!", safchan);
            return;
        }
        if (player.starter === pokeNum && count <= 1) {
            safaribot.sendMessage(src, "You can't release your starter Pokémon!", safchan);
            return;
        }
        if (releaseCooldown > 0) {
            safaribot.sendMessage(src, "Please spend the next  " + releaseCooldown + " seconds saying good bye to your Pokémon before releasing it!", safchan);
            return;
        }
        if (info.length < 2 || info[1].toLowerCase() !== "confirm") {
            safaribot.sendMessage(src, "You can release your " + poke(pokeNum) + " by typing /release " + (shiny ? "*":"") + sys.pokemon(pokeId) + ":confirm.", safchan);
            return;
        }
        
        safaribot.sendAll(sys.name(src) + " released their " + poke(pokeNum) + "!", safchan);
        this.removePokemon(src, pokeNum);
        this.saveGame(player);
        releaseCooldown = releaseCooldownLength;
        safari.createWild(pokeNum, shiny);
    };
    
    this.viewOwnInfo = function(src) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        
        var out = "";
        
        //Current Party table
        out += this.showParty(src, true);
        
        //All owned Pokémon
        out += this.showBox(player, "all");
        
        //Money/Balls table
        out += this.showBag(player);
        
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
    this.viewItems = function(src) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        sys.sendHtmlMessage(src, this.showBag(player), safchan);
    };
    this.viewBox = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        
        sys.sendHtmlMessage(src, this.showBox(player, (data === "*" ? 1 : data)), safchan);
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
    this.showBox = function(player, num) {
        var out = "";
        var perPage = 96, maxPages,
            list = player.pokemon,
            page = parseInt(num, 10);
        
        if (!isNaN(page) && num != "all") {
            maxPages = Math.floor(list.length / (perPage + 1)) + 1;
            
            if (page > maxPages) {
                page = maxPages;
            }
            list = list.slice(perPage * (page - 1), perPage * (page - 1) + perPage);
        }
        
        out += this.listPokemon(list, "Owned Pokémon");
        
        if (!isNaN(page)) {
            if (page > 1) {
                out += "<a href='po:send//box " + (page - 1) + "'>" + utilities.html_escape("< Box " + (page - 1)) + "</a>";
            }
            if (page < maxPages) {
                if (page > 1) {
                    out += " | ";
                }
                out += "<a href='po:send//box " + (page + 1) + "'>" + utilities.html_escape("Box " + (page + 1) + " >") + "</a>";
            }
        }
        return out;
    };
    this.listPokemon = function(list, title) {
        var out = "", normal = [], shiny = [], member, name, isShiny, index, count = 0, rowSize = 12, e;
        for (e in list) {
            member = getPokemonInfo(list[e]);
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
            out += "<table border = 1 cellpadding = 3><tr><th colspan=2>" + title + "</th></td>  <tr><th>Normal</th><th>Shiny</th></tr>";
        } else {
            out += "<table border = 1 cellpadding = 3><tr><th>" + title + "</th></td></tr>";
        }
        out += "<tr><td>";
        for (e in normal) {
            count++;
            out += normal[e] + " ";
            if (count == rowSize) {
                out += "<p>";
                count = 0;
            }
        }
        out += "</td>";
        if (shiny.length > 0) {
            count = 0;
            out += "<td><p>";
            for (e in shiny) {
                count++;
                out += shiny[e] + " ";
                if (count == rowSize) {
                    out += "<p>";
                    count = 0;
                }
            }
            out += "</td>";
        }
        out += "</tr></table>";
        return out;
    };
    this.showBag = function(player) {
        var out = "<table border = 1 cellpadding = 3><tr><th colspan=10>Inventory</th></tr>";
        out += "<tr><td valign=middle align=center><img src='item:274' title='Money'></td><td><img src='item:8017' title='Bait'></td><td><img src='item:206' title='Rocks'></td><td><img src='item:132' title='Gachapon Tickets'></td><td valign=middle align=center><img src='item:42' title='Amulet Coin'></td><td><img src='item:82' title='Honey'></td><td><img src='item:41' title='Zoom Lens'></td></tr>";
        out += "<tr><td align=center>$" + player.money + "</td><td align=center>" + player.balls.bait + "</td><td align=center>" + player.balls.rock + "</td><td align=center>" + player.balls.gacha + "</td><td align=center>" + player.balls.amulet + "</td><td align=center>" + player.balls.honey + "</td><td align=center>" + player.balls.zoom + "</td></tr>";
        
        out += "<tr><td valign=middle align=center><img src='item:309' title='Safari Balls'></td><td><img src='item:306' title='Great Balls'></td><td><img src='item:307' title='Ultra Balls'></td><td><img src='item:308' title='Master Balls'></td><td><img src='item:267' title='Dream Balls'></td><td><img src='item:324' title='Luxury Balls'></td><td><img src='item:321' title='Nest Balls'></td><td><img src='item:315' title='Heavy Balls'></td><td><img src='item:312' title='Moon Balls'></td><td><img src='item:318' title='Premier Balls'></td></tr>";
        out += "<tr><td align=center>" + player.balls.safari + "</td><td align=center>" + player.balls.great + "</td><td align=center>" + player.balls.ultra + "</td><td align=center>" + player.balls.master + "</td><td align=center>" + player.balls.dream + "</td><td align=center>" + player.balls.luxury + "</td><td align=center>" + player.balls.nest + "</td><td align=center>" + player.balls.heavy + "</td><td align=center>" + player.balls.moon + "</td><td align=center>" + player.balls.premier + "</td></tr>";
                
        out += "</table>";
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
    this.findPokemon = function(src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (commandData === "*") {
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "How to use /find:", safchan);
            safaribot.sendMessage(src, "Define a parameter (Name, Number, BST, Type or Duplicate) and a value to find Pokémon in your box. Examples: ", safchan);
            safaribot.sendMessage(src, "For Name: Type any part of the Pokémon's name. e.g.: /find name LUG (both Lugia and Slugma will be displayed, among others with LUG on the name)", safchan);
            safaribot.sendMessage(src, "For Type: Type any one or two types. If you type 2, only pokémon with both types will appear. e.g.: /find type water grass", safchan);
            safaribot.sendMessage(src, "For Duplicate: Type a number greater than 1. e.g.: /find duplicate 3 (will display all Pokémon that you have at least 3 copies)", safchan);
            safaribot.sendMessage(src, "For Number and BST: There are 4 ways to search with those parameters:", safchan);
            safaribot.sendMessage(src, "-Exact value. e.g.: /find bst 500 (displays all Pokémon with BST of exactly 500)", safchan);
            safaribot.sendMessage(src, "-Greater than. e.g.: /find bst 400 > (displays all Pokémon with BST of 400 or more)", safchan);
            safaribot.sendMessage(src, "-Less than. e.g.: /find bst 350 < (displays all Pokémon with BST of 350 or less)", safchan);
            safaribot.sendMessage(src, "-Range. e.g.: /find number 1 150 (displays all Pokémon with pokédex number between 1 and 150)", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        
        var info = commandData.split(":");
        var crit = "abc", val = "1";
        if (info.length < 2) {
            info = commandData.split(" ");
        }
        
        crit = info[0];
        val = info.length > 1 ? info[1].toLowerCase() : "asc";
        
        if (info.length >= 2) {
            switch (crit.toLowerCase()) {
                case "number":
                case "num":
                case "index":
                case "no":
                case "dex":
                    crit = "number";
                    break;
                case "bst":
                case "status":
                case "stats":
                case "stat":
                    crit = "bst";
                    break;
                case "type":
                    crit = "type";
                    break;
                case "duplicate":
                case "duplicates":
                case "repeated":
                    crit = "duplicate";
                    break;
                default:
                    crit = "abc";
            }
        } else {
            crit = "abc";
            val = info[0].toLowerCase();
        }
        
        var list = [], title = "Owned Pokémon", mode = "equal";
        if (crit == "abc") {
            val = val.toLowerCase();
            player.pokemon.forEach(function(x){
                if (sys.pokemon(x).toLowerCase().indexOf(val) !== -1) {
                    list.push(x);
                }
            });
            title = "Pokémon with " + val + " on their name";
        }
        else if (crit == "number") {
            title = rangeFilter(src, player, list, val, mode, "Pokédex Number", info, crit);
        }
        else if (crit == "bst") {
            title = rangeFilter(src, player, list, val, mode, "BST", info, crit);
        }
        else if (crit == "type") {
            var type1 = cap(val.toLowerCase()),
                type2 = null;
            
            if (info.length > 2) {
                type2 = cap(info[2].toLowerCase());
            }
            
            if (!(type1 in effectiveness)) {
                safaribot.sendMessage(src, type1 + " is not a valid type!", safchan);
                return;
            }
            if (type2 && !(type2 in effectiveness)) {
                safaribot.sendMessage(src, type2 + " is not a valid type!", safchan);
                return;
            }
            
            player.pokemon.forEach(function(x){
                if (hasType(x, type1) && (!type2 || hasType(x, type2))) {
                    list.push(x);
                }
            });
            title = "Pokémon with " + type1 + (type2 ? "/" + type2 : "") + " type";
        }
        else if (crit == "duplicate") {
            var pokeList = player.pokemon.concat().sort();
            val = parseInt(val, 10);
            if (isNaN(val) || val < 2) {
                safaribot.sendMessage(src, "Please specify a valid number higher than 1!", safchan);
                return;
            }
            pokeList.forEach(function(x){
                if (countArray(pokeList, x) >= val) {
                    list.push(x);
                }
            });
            title = "Pokémon with at least " + val + " duplicates";
        }
        sys.sendHtmlMessage(src, this.listPokemon(list, title), safchan);
    };
    function rangeFilter(src, player, list, val, mode, paramName, info, type) {
        val = parseInt(val, 10);
        var val2;
        if (isNaN(val)) {
            safaribot.sendMessage(src, "Please specify a valid number!", safchan);
            return;
        }
        var title = "Pokémon with " + paramName + " equal to " + val;
        if (info.length > 2) {
            val2 = parseInt(info[2], 10);
            if (isNaN(val2)) {
                switch (info[2].toLowerCase()) {
                    case ">":
                    case "higher":
                    case "greater":
                    case "more":
                    case "+":
                    case "above":
                        mode = "greater";
                        title = "Pokémon with " + paramName + " greater than " + val;
                        break;
                    case "<":
                    case "lower":
                    case "less":
                    case "-":
                    case "below":
                        mode = "less";
                        title = "Pokémon with " + paramName + " less than " + val;
                        break;
                }
                if (mode !== "greater" && mode !== "less") {
                    safaribot.sendMessage(src, "Invalid parameter! Use either >, < or another number.", safchan);
                    return;
                }
            } else {
                mode = "range";
                title = "Pokémon with " + paramName + " between " + val + " and " + val2;
            }
        }
        var param;
        player.pokemon.forEach(function(x){
            switch (type) {
                case "bst":
                    param = getBST(x);
                    break;
                case "number":
                    param = parseInt(x, 10);
                    break;
            }
            if (mode == "equal" && param === val) {
                list.push(x);
            }
            else if (mode == "greater" && param >= val) {
                list.push(x);
            }
            else if (mode == "less" && param <= val) {
                list.push(x);
            }
            else if (mode == "range" && param >= val && param <= val2) {
                list.push(x);
            }
        });
        return title;
    }
    this.sortBox = function(src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var info = commandData.split(":");
        var crit = "number", order = "asc";
        if (info.length < 2) {
            info = commandData.split(" ");
        }
        crit = info[0];
        order = info.length > 1 ? info[1].toLowerCase() : "asc";
        
        switch (crit.toLowerCase()) {
            case "abc":
            case "alpha":
            case "alphabet":
            case "alphabetical":
            case "name":
                crit = "abc";
                break;
            case "bst":
            case "status":
            case "stats":
            case "stat":
                crit = "bst";
                break;
            case "type":
                crit = "type";
                break;
            case "duplicate":
            case "duplicates":
            case "repeated":
                crit = "duplicate";
                break;
            default:
                crit = "number";
        }
        switch (order.toLowerCase()) {
            case "descending":
            case "desc":
            case "cba":
            case "321":
                order = "desc";
                break;
            case "ascending":
            case "asc":
            case "abc":
            case "123":
                order = "asc";
        }
        
        if (crit === "number") {
            player.pokemon.sort(function(a, b){return a-b;});
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by Pokédex Number (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        else if (crit === "abc") {
            player.pokemon.sort(function(a, b){
                    if(sys.pokemon(a) < sys.pokemon(b)) return -1;
                    if(sys.pokemon(a) > sys.pokemon(b)) return 1;
                    return 0;
                }
            );
            
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted " + (order === "desc" ? "inversely " : "") + "alphabetically.", safchan);
        }
        else if (crit === "bst") {
            player.pokemon.sort(function(a, b){return getBST(a)-getBST(b);});
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by BST (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        else if (crit === "type") {
            var type1 = cap(order.toLowerCase());
            if (!(type1 in effectiveness)) {
                safaribot.sendMessage(src, "Please specify a valid type!", safchan);
                return;
            }
            var type2 = info.length > 2 ? cap(info[2].toLowerCase()) : null;
            if (type2 && !(type2 in effectiveness)) {
                safaribot.sendMessage(src, "Please specify a valid secondary type!", safchan);
                return;
            }
            
            player.pokemon.sort(function(a, b) {
                if (hasType(a, type1) && !hasType(b, type1)) {
                    return -1;
                }
                if (!hasType(a, type1) && hasType(b, type1)) {
                    return 1;
                }
                if (type2) {
                    if (hasType(a, type2) && !hasType(b, type2)) {
                        return -1;
                    }
                    if (!hasType(a, type2) && hasType(b, type2)) {
                        return 1;
                    }
                }
                return 0;
            });
            
            safaribot.sendMessage(src, "Your box was sorted by types (" +(type2 ? type1 + "/" + type2 + " > " : "")+ type1 + (type2 ? " > " + type2 : "" ) + ").", safchan);
        }
        else if (crit === "duplicate") {
            player.pokemon.sort();
            player.pokemon.sort(function(a, b){return countArray(player.pokemon, a)-countArray(player.pokemon, b);});
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by duplicates (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        this.saveGame(player);
    };
    this.dailyReward = function(src, today) {
        var player = getAvatar(src);
        if (!player) {
            return;
        }
        
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
                player.balls.dream += 1;
                gained.push("1x Dream Ball");
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
    };
    
    this.startGame = function(src, data) {
        if (getAvatar(src)) {
            safaribot.sendMessage(src, "You already have a starter pokémon!", safchan);
            return;
        }
        if (!sys.dbRegistered(sys.name(src).toLowerCase())) {
            safaribot.sendMessage(src, "Please register your account before starting the game!");
            return true;
        }
        if (rawPlayers.get(sys.name(src).toLowerCase())) {
            safaribot.sendMessage(src, "You already have a save under that alt! Loading it instead.", safchan);
            this.loadGame(src);
            return;
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
                moon: 0,
                bait: 0,
                rock: 0,
                premier: 0,
                gacha: 0,
                zoom: 0,
                amulet: 0,
                honey: 0
            },
            starter: num,
            lastLogin: getDay(now()),
            consecutiveLogins: 1,
            cooldown: 0,
            rockCooldown: 0,
            gachaCooldown: 0
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
            SESSION.users(src).safari = player;
            this.sanitize(getAvatar(src));
            safaribot.sendMessage(src, "Your Safari data was successfully loaded!", safchan);
            this.dailyReward(src, getDay(now()));
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
    this.sanitize = function(player) {
        if (player) {
            var clean;
            for (var i = 0; i < allItems.length; i++) {
                clean = allItems[i];
                if (player.balls[clean] === undefined || isNaN(player.balls[clean]) || player.balls[clean] === null || player.balls[clean] < 0 || retiredItems.indexOf(player.balls[clean]) !== -1) {
                    player.balls[clean] = 0;
                }
                if (player.balls[clean] > 9999) {
                    player.balls[clean] = 9999;
                }
                if (clean === "master" && player.balls[clean] > 1) {
                    player.balls[clean] = 1;
                }
            }
            if (player.money === undefined || isNaN(player.money) || player.money < 0) {
                player.money = 0;
            } else if (player.money > 9999999) {
                player.money = 9999999;
            }
            if (player.money % 1 !== 0) {
                player.money = Math.floor(player.money);
            }
            
            player.cooldown = now();
            player.gachaCooldown = now();
            player.rockCooldown = now();
            
            this.saveGame(player);
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
    this.showItemHelp = function (src) {
        var x, help = [
            "",
            "*** Items and Pokeballs ***",
            "Pokédollars: Used to purchase items from the shop.",
            "Bait: Tasty Bluk Berries used to attract wild Pokémon, set down with /bait. Has a 45% success rate with a 60 second cooldown on success, and a 20 second cooldown on failure.",
            "Rock: A small rock that can be thrown to stun another player for a short period with /rock. Has a 10 second cooldown.",
            "Gachapon Ticket: Used to play the Gachapon Machine with /gacha, and win random prizes. Has a 5 second cooldown.",
            "Safari Ball: Standard issue Poké Ball used to catch Pokémon. Has a 6 second cooldown.",
            "Great Ball: A Poké Ball that has a slightly increased catch rate. Has a 9 second cooldown.",
            "Ultra Ball: A high functioning Poké Ball that has a better catch rate than a Great Ball. Has a 12 second cooldown.",
            "Master Ball: An extremely rare Poké Ball that never fails to catch. Has a 90 second cooldown.",
            "Dream Ball: An unusual Poké Ball that works better on Pokémon of alternate colorations. Has a 9 second cooldown.",
            "Luxury Ball: A comfortable Poké Ball with an increased catch rate that is said to make one wealthy. Has a 12 second cooldown.",
            "Nest Ball: A homely Poké Ball that has an increased catch rate against weaker Pokémon. Has a 4 second cooldown.",
            "Heavy Ball: An industrial Poké Ball that works better against hardier and stronger Pokémon. Has an 8 second cooldown.",
            "Moon Ball: A stylized Poké Ball that supposedly works better against Pokémon seen once in a blue moon. Has an 8 second cooldown.",
            "Premier Ball: A plain Poké Ball gifted to you for your patronage. It works better when a Normal-type Pokémon is active. Has a 6 second cooldown.",
            "",
            "Note: Cooldown for Balls is doubled when a Pokémon is caught successfully.",
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
            "/itemhelp: A comprehensive guide on items and Poké Balls.",
            "/start: To pick a starter Pokémon and join the Safari game. Valid starters are Bulbasaur, Charmander, and Squirtle.",
            "/catch [ball]: To throw a Safari Ball when a wild Pokémon appears. [ball] can be Safari, Great, Ultra, Master, or Dream Ball.",
            "/sell: To sell one of your Pokémon*.",
            "/trade: To request a Pokémon trade with another player*.",
            "/buy: To buy more Poké Balls.",
            "/party: To add or remove a Pokémon from your party, or to set your party's leader*.",
            "/box [number]: To view all your caught Pokémon organized in boxes.",
            "/bag: To view all money and items.",
            "/mydata: To view your party, caught Pokémon, money and items.",
            "/view: To view another player's party. If no player is specified, your data will show up.",
            "/changealt: To pass your Safari data to another alt.",
            "/bait: To throw bait in the attempt to lure a Wild Pokémon. Specify a ball type to throw that first.",
            "/gacha: Use a ticket to win a prize!",
            "/rock: To throw a rock at another player.",
            "/find [criteria] [value]: To find Pokémon that you have that fit that criteria. Type /find for more details.",
            "/sort [criteria] [ascending|descending]: To sort the order in which the Pokémon are listed on /mydata. Criteria are Alphabetical, Number, BST, Type and Duplicate",
            "/info: View time until next contest and current Gachapon jackpot prize!",
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
            "/wild: Spawns a random wild Pokemon with no restrictions. Use a valid dex number for a specific spawn.",
            "/wilds: Spawns a random wild Pokemon with no restrictions. Use a valid dex number to spawn a shiny Pokemon.",
            "/safaripay: Awards a player with any amount of money. Use /safaripay [player]:[amount].",
            "/safarigift: Gifts a player with any amount of an item or ball. Use /safarigift [player]:[item]:[amount].",
            "/sanitize: Removes invalid values from the target's inventory, such as NaN and undefined."
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
        if (command === "itemhelp") {
            safari.showItemHelp(src);
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
            if (commandData !== "*") {
                safari.viewPlayer(src, commandData);
            } else {
                safari.viewOwnInfo(src, commandData);
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
        if (command === "bag") {
            safari.viewItems(src, commandData);
            return true;
        }
        if (command === "box") {
            safari.viewBox(src, commandData);
            return true;
        }
        if (command === "changealt") {
            safari.changeAlt(src, commandData);
            return true;
        }
        if (command === "bait") {
            safari.throwBait(src, commandData);
            return true;
        }
        if (command === "rock") {
            safari.throwRock(src, commandData);
            return true;
        }
        if (command === "gacha") {
            safari.gachapon(src, commandData);
            return true;
        }
        if (command === "sort") {
            safari.sortBox(src, commandData);
            return true;
        }
        if (command === "find") {
            safari.findPokemon(src, commandData);
            return true;
        }
        if (command === "info") {
            if (contestCount > 0) {
                var min = Math.floor(contestCount/60);
                var sec = contestCount%60;
                safaribot.sendMessage(src, "Time until the Contest ends: " + min + " minutes, " + sec + " seconds.", safchan);
            } else {
                var min = Math.floor(contestCooldown/60);
                var sec = contestCooldown%60;
                safaribot.sendMessage(src, "Time until next Contest: " + min + " minutes, " + sec + " seconds.", safchan);
            }
            safaribot.sendMessage(src, "Current Gachapon Jackpot: " + Math.floor(gachaJackpot/10) + ".", safchan);
            return true;
        }
        if (command === "release") {
            safari.releasePokemon(src, commandData);
            return true;
        }
        
        //Staff Commands
        if (!SESSION.channels(safchan).isChannelOperator(src)) {
            return false;
        }
        if (command === "checkrate") {
            if (allItems.indexOf(commandData) !== -1) {
                var instance = countArray(gachaponPrizes, commandData);
                var total = gachaponPrizes.length;
                var percent = instance / total * 100;
                safaribot.sendMessage(src, "The rate of " + finishName(commandData) + " is " + instance + "/" + total + ", or " + percent.toFixed(2) + "%.", safchan);
            } else {
                safaribot.sendMessage(src, "No such item!", safchan);
            }
            return true;
        }
        if (command === "sanitize") {
            var playerId = sys.id(commandData);
            if (!playerId) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }
            
            var player = getAvatar(playerId);
            if (player) {
                safari.sanitize(player);
                safaribot.sendMessage(src, commandData + "'s safari has been sanitized of invalid values!", safchan);
                safaribot.sendMessage(playerId, "Your Safari has been sanitized of invalid values!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
            }
            return true;
        }
        if (command === "sanitizeall") {
            var onChannel = sys.playersOfChannel(safchan);
            var player;
            for (var e in onChannel) {
                player = getAvatar(onChannel[e]);
                if (!player) {
                    continue;
                }
                this.sanitize(player);
            }
            safaribot.sendAll("All safaris have been sanitized!", safchan);
            return true;
        }
        
        if (!SESSION.channels(safchan).isChannelAdmin(src)) {
            return false;
        }
        if (command === "wild" || command == "wilds") {
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
        if (command === "safaripay") {
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
                this.sanitize(player);
                this.saveGame(player);
                safaribot.sendAll(target + " has been awarded with $" + moneyGained + " by " + sys.name(src) + "!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
            }
            return true;
        }
        if (command === "safarigift") {
            var cmd = commandData.split(":");
            var target = cmd[0];
            var item = cmd[1];
            var itemQty = parseInt(cmd[2], 10);
            
            var playerId = sys.id(target);
            if (!playerId) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }
            if (allItems.indexOf(item) === -1) {
                safaribot.sendMessage(src, "No such item!", safchan);
                return true;
            }
            var player = getAvatar(playerId);
            if (player) {
                player.balls[item] += itemQty;
                this.sanitize(player);
                this.saveGame(player);
                safaribot.sendAll(target + " has been awarded with " + itemQty + " " + finishName(item) + " by " + sys.name(src) + "!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
            }
            return true;
        }
        if (command === "findsaves") {
            safaribot.sendMessage(src, "List of all saves by name: " + Object.keys(rawPlayers.hash).sort().join(", "), safchan);
            return true;
        }
                
        if (!SESSION.channels(safchan).isChannelOwner(src)) {
            return false;
        }
        if (command === "testbot") {
            safaribot.sendHtmlAll("<b>Bot works.</b>", sys.id("Indigo Plateau"));
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
        this.initGacha();
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
        releaseCooldown--;
        if (preparationPhase > 0) {
            preparationPhase--;
            if (preparationPhase <= 0) {
                var throwers = shuffle(Object.keys(preparationThrows));
                var name, i;
                if (preparationFirst) {
                    if (throwers.indexOf(preparationFirst) !== -1) {
                        throwers.splice(throwers.indexOf(preparationFirst), 1);
                        throwers.splice(0, 0, preparationFirst);
                    }
                }
                for (i = 0; i < throwers.length; i++) {
                    name = throwers[i];
                    if (sys.isInChannel(sys.id(name), safchan)) {
                        safari.throwBall(sys.id(name), preparationThrows[name]);
                    }
                }
            }
        }
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
        SESSION.global().safariReleaseCooldown = releaseCooldown;
        
        if (contestCount > 0) {
            contestCount--;
            if (contestCount === 0) {
                var winner = modeArray(contestCatchers);
                contestCatchers = [];
                
                sys.sendAll("*** ************************************************************ ***", safchan);
                safaribot.sendAll("The Safari contest is now over! Please come back during the next contest!", safchan);
                if (winner) {
                    safaribot.sendAll(winner + " caught the most Pokémon during the contest and has won a prize pack!", safchan);
                }
                sys.sendAll("*** ************************************************************ ***", safchan);
                currentPokemon = null;
                if (winner) {
                    var playerId = sys.id(winner);
                    var player = getAvatar(playerId);
                    var item = "gacha";
                    player.balls[item] += 10;
                    safaribot.sendMessage(playerId, "You received 10 Gachapon Tickets for winning the contest!", safchan);
                }
                
                //Check daily rewards after a contest so players won't need to relog to get their reward when date changes
                var onChannel = sys.playersOfChannel(safchan),
                    today = getDay(now());
                for (var e in onChannel) {
                    safari.dailyReward(onChannel[e], today);
                }
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