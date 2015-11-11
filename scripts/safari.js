/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys, module, SESSION, script, safaribot, require */

var MemoryHash = require("memoryhash.js").MemoryHash;
var utilities = require('utilities.js');
var html_escape = utilities.html_escape;
var Bot = require('bot.js').Bot;

function Safari() {
    var safari = this;
    var safchan;
    var defaultChannel = "Safari";
    var saveFiles = "scriptdata/safarisaves.txt";
    var rawPlayers;
    
    var safaribot = new Bot("Tauros");

    var shinyChance = 1024; //Chance for Shiny Pokémon
    var starters = [1, 4, 7];
    var currentPokemon = null;
    var currentPokemonCount = 1;

    var tradeRequests = {};
    var gachaJackpotAmount = 100; //Jackpot for gacha tickets. Number gets divided by 10 later.
    var gachaJackpot = (SESSION.global() && SESSION.global().safariGachaJackpot ? SESSION.global().safariGachaJackpot : gachaJackpotAmount);
    var leaderboards = {};
    var lastLeaderboardUpdate;

    var contestCooldownLength = 1800; //1 contest every 30 minutes
    var baitCooldownLength = 0;
    var releaseCooldownLength = 180; //1 release every 3 minutes
    var contestBroadcast = true; //Determines whether Tohjo gets notified
    var contestCooldown = (SESSION.global() && SESSION.global().safariContestCooldown ? SESSION.global().safariContestCooldown : contestCooldownLength);
    var baitCooldown = (SESSION.global() && SESSION.global().safariBaitCooldown ? SESSION.global().safariBaitCooldown : baitCooldownLength);
    var releaseCooldown = (SESSION.global() && SESSION.global().safariReleaseCooldown ? SESSION.global().safariReleaseCooldown : releaseCooldownLength);
    var contestDuration = 300; //Contest lasts for 5 minutes
    var contestCount = 0;
    var contestCatchers = {};
    var preparationPhase = 0;
    var preparationThrows = {};
    var preparationFirst = null;
    var itemCap = 999;
    var moneyCap = 9999999;
    var wildEvent = false;

    //Don't really care if this resets after an update.
    var lastBaiters = [];
    var lastBaitersAmount = 3; //Amount of people that need to bait before you can
    var lastBaitersDecay = 40; //Seconds before the first entry in lastBaiters is purged
    var lastBaitersDecayTime = 120;

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
    /* Poke Info Functions */
    var pokeInfo = {};
    pokeInfo.species = function(poke) {
        return poke & ((1 << 16) - 1);
    };
    pokeInfo.forme = function(poke) {
        return poke >> 16;
    };
    pokeInfo.shiny = function(poke) {
        return typeof poke === "string";
    };
    pokeInfo.readableNum = function(poke) {
        var ret = [];
        ret += pokeInfo.species(poke);
        if (pokeInfo.forme(poke) > 0) {
            ret += "-";
            ret += pokeInfo.forme(poke);
        }
        return ret;
    };
    pokeInfo.icon = function(p, shinyBG) {
       return "<img src='icon:" + p + "' title='#" + pokeInfo.readableNum(p) + " " + poke(p) + (shinyBG && pokeInfo.shiny(p) ? "' style='background:yellow'" : "'") + ">";
    };
    pokeInfo.sprite = function(poke) {
        var ret = [];
        ret += "<img src='pokemon:num=";
        ret += pokeInfo.readableNum(poke);
        if (pokeInfo.shiny(poke)) {
            ret += "&shiny=true";
        }
        ret += "&gen=6'>";
        return ret;
    };
    pokeInfo.valid = function(poke) {
        return sys.pokemon(poke) !== "Missingno";
    };
    pokeInfo.calcForme = function(base, forme) {
        return parseInt(base,10) + parseInt(forme << 16, 10);
    };
    /* End Poke Info Functions */


    //Data on items
    var itemData = {
        //Balls
        safari: {name: "safari", fullName: "Safari Ball", type: "ball", icon: 309, price: 30, ballBonus: 1, cooldown: 6000, aliases:["safariball", "safari", "safari ball"], sellable: false, buyable: true, tradable: false},
        great: {name: "great", fullName: "Great Ball", type: "ball", icon: 306, price: 60, ballBonus: 1.5, cooldown: 9000, aliases:["greatball", "great", "great ball"], sellable: false, buyable: true, tradable: false},
        ultra: {name: "ultra", fullName: "Ultra Ball", type: "ball", icon: 307, price: 120, ballBonus: 2, cooldown: 12000, aliases:["ultraball", "ultra", "ultra ball"], sellable: false, buyable: true, tradable: false},
        master: {name: "master", fullName: "Master Ball", type: "ball", icon: 308, price: 0, ballBonus: 255, cooldown: 90000, aliases:["masterball", "master", "master ball"], sellable: false, buyable: false, tradable: true},

        myth: {name: "myth", fullName: "Myth Ball", type: "ball", icon: 329, price: 0, ballBonus: 1, bonusRate: 4, cooldown: 9000, aliases:["mythball", "myth", "myth ball"], sellable: false, buyable: false, tradable: true},
        heavy: {name: "heavy", fullName: "Heavy Ball", type: "ball", icon: 315, price: 0, ballBonus: 1, bonusRate: 0.5, maxBonus: 5, cooldown: 12000, aliases:["heavyball", "heavy", "heavy ball"], sellable: false, buyable: false, tradable: true},
        quick: {name: "quick", fullName: "Quick Ball", type: "ball", icon: 326, price: 0, ballBonus: 1, cooldown: 12000, aliases:["quickball", "quick", "quick ball"], sellable: false, buyable: false, tradable: true},
        luxury: {name: "luxury", fullName: "Luxury Ball", type: "ball", icon: 324, price: 0, ballBonus: 1.8, cooldown: 8000, aliases:["luxuryball", "luxury", "luxury ball"], sellable: false, buyable: false, tradable: true},
        premier: {name: "premier", fullName: "Premier Ball", type: "ball", icon: 318, price: 0, ballBonus: 1.5, bonusRate: 3.5, cooldown: 10000, aliases:["premierball", "premier", "premier ball"], sellable: false, buyable: false, tradable: false},
        spy: {name: "spy", fullName: "Spy Ball", type: "ball", icon: 328, price: 0, ballBonus: 1.25, bonusRate: 1.25, cooldown: 9000, aliases:["spyball", "spy", "spy ball"], sellable: false, buyable: false, tradable: true},
        clone: {name: "clone", fullName: "Clone Ball", type: "ball", icon: 327, price: 0, ballBonus: 1, bonusRate: 0.05, cooldown: 11000, aliases:["cloneball", "clone", "clone ball"], sellable: false, buyable: false, tradable: true},

        //Other Items
        bait: {name: "bait", fullName: "Bait", type: "usable", icon: 8017, price: 149, successRate: 0.40, failCD: 15, successCD: 50, aliases:["bait"], sellable: false, buyable: true, tradable: false},
        rock: {name: "rock", fullName: "Rock", type: "usable", icon: 206, price: 50, successRate: 0.65, bounceRate: 0.1, targetCD: 7000, bounceCD: 11000, throwCD: 15000,  aliases:["rock", "rocks"], sellable: false, buyable: true, tradable: false},
        gacha: {name: "gacha", fullName: "Gachapon Ticket", type: "usable", icon: 132, price: 189, cooldown: 6000, aliases:["gacha", "gachapon", "gachapon ticket", "gachaponticket"], sellable: false, buyable: true, tradable: false},
        rare: {name: "rare", fullName: "Rare Candy", type: "usable", icon: 117, price: 0, aliases:["rare", "rarecandy", "rare candy", "candy"], sellable: false, buyable: true, tradable: true},
        mega: {name: "mega", fullName: "Mega Stone", type: "usable", icon: 2001, price: 0, aliases:["mega", "mega stone"], sellable: false, buyable: true, tradable: true},
        stick: {name: "stick", fullName: "Stick", type: "usable", icon: 164, price: 99999, cooldown: 10000, aliases:["stick","sticks"], sellable: false, buyable: true, tradable: false},
        itemfinder: {name: "itemfinder", fullName: "Itemfinder", type: "usable", icon: 69, price: 0, cooldown: 9000, charges: 30, aliases:["itemfinder", "finder", "item finder"], sellable: false, buyable: false, tradable: false},
        
        //Consumables (for useItem)
        gem: {name: "gem", fullName: "Ampere Gem", type: "consumable", icon: 245, price: 0, cooldown: 0, charges: 20, aliases:["gem", "ampere", "ampere gem", "amperegem"], sellable: false, buyable: false, tradable: false},

        //Perks
        amulet: {name: "amulet", fullName: "Amulet Coin", type: "perk", icon: 42, price: 0, bonusRate: 0.03, maxRate: 0.3, aliases:["amulet", "amuletcoin", "amulet coin", "coin"], sellable: false, buyable: false, tradable: false},
        honey: {name: "honey", fullName: "Honey", type: "perk", icon: 82, price: 0, bonusRate: 0.03, maxRate: 0.3, aliases:["honey"], sellable: false, buyable: false, tradable: true},
        soothe: {name: "soothe", fullName: "Soothe Bell", type: "perk", icon: 35, price: 0, bonusRate: 0.03, maxRate: 0.3, aliases:["soothe", "soothebell", "soothe bell", "bell"], sellable: false, buyable: false, tradable: true},
        crown: {name: "crown", fullName: "Relic Crown", type: "perk", icon: 278, price: 0, bonusRate: 0.01, maxRate: 0.1, aliases:["crown", "reliccrown", "relic crown", "relic"], sellable: false, buyable: false, tradable: false},
        scarf: {name: "scarf", fullName: "Silk Scarf", type: "perk", icon: 31, price: 0, bonusRate: 0.015, maxRate: 0.15, aliases:["scarf", "silkscarf", "silk scarf", "silk"], sellable: false, buyable: false, tradable: true},
        battery: {name: "battery", fullName: "Cell Battery", type: "perk", icon: 241, price: 0, bonusRate: 2, maxRate: 20, aliases:["battery", "cellbattery", "cell battery", "cell"], sellable: false, buyable: false, tradable: true},

        //Sellables
        pearl: {name: "pearl", fullName: "Pearl", type: "misc", icon: 111, price: 500, aliases:["pearl"], sellable: true, buyable: false, tradable: true},
        stardust: {name: "stardust", fullName: "Stardust", type: "misc", icon: 135, price: 750, aliases:["stardust"], sellable: true, buyable: false, tradable: true},
        bigpearl: {name: "bigpearl", fullName: "Big Pearl", type: "misc", icon: 46, price: 1500, aliases:["bigpearl", "big pearl"], sellable: true, buyable: false, tradable: true},
        starpiece: {name: "starpiece", fullName: "Star Piece", type: "misc", icon: 134, price: 3000, aliases:["starpiece", "star piece"], sellable: true, buyable: false, tradable: true},
        nugget: {name: "nugget", fullName: "Nugget", type: "misc", icon: 108, price: 4000, aliases:["nugget"], sellable: true, buyable: false, tradable: true},
        bignugget: {name: "bignugget", fullName: "Big Nugget", type: "misc", icon: 269, price: 10000, aliases:["bignugget", "big nugget"], sellable: true, buyable: false, tradable: true}
    };

    var base64icons = {
    itemfinder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAALHRFWHRDcmVhdGlvbiBUaW1lAEZyaSAyMSBOb3YgMjAxNCAyMDozMDo0NCAtMDAwMKEIypIAAAAHdElNRQfeCxUUHwrCV61vAAAACXBIWXMAAAsSAAALEgHS3X78AAAABGdBTUEAALGPC/xhBQAABExJREFUeNqFVutPHFUU/93ZpWyAamOMgIm2Pgrl0ZVHq9t+EAPtZiHWRGOaSFPoF+tnYrJGv+jXEhL/Ah8gaRPb2KSNFqqtSiOQxnYXpFUxatwEAbWBpkuz7GOuc+7OnblzZ0hPcrMze8+5v/M7rzuMr/UDMHCwb5EXiyZIrl9uYUABuWwOkZoIpPjf8+g+mnHsps4/wyLVoUD9sAS5du1jGMw632CIxU7w2YkmFqkho5JQ5Jw7RvRMdgSi2h2w7TjPg1n/qU4ZscQvfGrqI0tvD+5m5sHMEmZmP8UL8QXe2b1gnViBzY2iMJSyubGJA72/BtrtP7zANzcKUIWYGfLlbuZz7HiyFeuZBVgu4YuTjRjuq8e+nnkee3lRAEpRPdXt9H0ZifC2ijBM08TDO9uw/lcaO3Y+h2KphKOf/I5SyUTY2n/skUfR0T3Ppy82ODkIsqN3nYkENaYuPs0O9byFQqGA7U9EUTI5urrexA9fNrDZid1iZe+toa6uDgePEDNDePn9had8dlfffxfcBtNzyqjqCDn+xt88Xygn/rtzu6xCqPB49tLrGV4omLhxZS/LZe85h7x45A9hl88XhTMrKyuYvmBVX802j31YxpSYOeh24rkW88HBQew7NMZ//KbVUjBtZs8y0o8lfuahUEjRNz32YTWmVE2V1ZWe97KRIcDn5uaE1/sP3+JSp2Tlk/Zqa2uRTCYxNDQUYA8vkAriemaIUm5qahUHxuNxdHR0OKxHR0fF79LSEtLptB0Jcsz0VJ+TI/VPl5kLsrq6KkKxtvYfOHedGR4eAYWMAIkd5Wh5eRk3r7aI8PpyFMSMmrmlJSqMJcjMpT1MTotyMbwjioEAx8fHnYIAQpBAdL6hAhATV8p5kQklY6pGFYQ8pSKiFkgm38bAwAAMw0B7e7voO5qF7ml2ddGSTOiZ2DQ373VCVlkZtvbdvtD7RDawdK4866qdfUMy0WeZKsRm5lKjwyZIn5gFsSIutB/2T2WKaZVQ1sX1VNePYCuR5xuqZ/n7NN5D4to4dWpEeFVfX2+DhnxMdWYquFPW9r6vjyg3IyMfIpVKiZKluLe1taGzZ47fuNLsTAT9vpEA6dRNWFmi68kjYVk9upEEEcZ2I6pM/DdvlQBv+udrvPb8Q0QFr6aYiEQue79cDHqM6WA1BHo4dH0CocY+dmwAVX3v4YPr1Th5fh3HB0+IcRWp2e7vIypTOphyQx7Somcq71zWmyNiQkLh7u8/LkYTRYFyKnNDg7iz5yfu6yMq03Nnz4ghSV1OiybC9FeNztWh95EqFHIq8d7eXkxOTjrRCOyjy2ceZ78t3sadO/+K9e3ZXYyG5IOqTTSmxYZYSQBP1QXd8cRMV96qjyjcdIUQSDQaxdjYmBisiURCgFLYWfm7zvVUvSoe/F2X89y0uxuaRSuobE+f/kyEXQCpt+pWot+8QaHreuVP53NAyuxEedr/DwgKwzi3jMhsAAAAAElFTkSuQmCC",
    gacha: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAkUExURdXeUpR7e1qLe9Xe3sWDamqLc5ykpHNzezExMSlqi////////w/mkLQAAAAMdFJOU///////////////ABLfzs4AAACDSURBVHjarJFJFsQgCETLIYYy979viwZipteLbpf/UwiK7eXgdyHyKERqlbtQ/CBEyOQGM0YsV6GYSDgicExGkGUSHS/cj0WwSWMha6cuyiGU52YiezJVsVZcQw60jPgeLbKGcbvjMdWYCZywi0XLJ2x78Fw9iwu2J7nhv3ztV/ERYAAG0RZIuHExdgAAAABJRU5ErkJggg==",
    mega:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAACXBIWXMAAAsSAAALEgHS3X78AAAG6UlEQVRIS5WTCVDW1xXFH8iigBCNCIqAKDuKgCCINIoYrSWO1iWIuGGrpm6JuJvUDa0LJUYdUShThcoiiB8qUUKUaBBQ/BAUN1DZDCiggMgmH3y/PglpZprJND0zZ97M/957zr33/Z/4LVCr1NO6fnh9SlVSV/b2/vMmdVnjI/WL5gi1Wu3dk/L/Q61uMlaX1v+1I6f8wZvUO50tMTdpj7xBe0QulQfTeXkim9a0++2qWxV56orGTwCdntL/jc5n9fPbbz6r6kwtoXZfJtUb0yhbdYYLs/exwSOAALsJKJdE82zDOV59mUXXpVI6CqrvqJ43TOiR+HU0PakNe329mnuyMHvdeXJD0ogOOECAy0c4mthgbWzFDOepZH16lqurz3B1VTLfhyh4EqmkLqeyq7G0bnmP1C9RVVLz94rcl5zZk0n8F5f5xzoF83yXMNzMAWtJ/7EBuNl4MdHVn9gtl4jdfJGYTV9zUk4YI/n1wWwqlXXUlL0M7pH8GS+qGgMLChoJl0mhe3P5LCSRUS6TMTWzx81zBqvWn2Z/mBIfn7lYDXMlZGMKoX+7zvZdmd3ctvMK23Zc4XjUbQoKalXNDW9de6TfXai6/7Wi2rrticUs+ErJzO1pWIyayPvmDpgMdcbOcxrT1kQTfPwBfisj6Gdmi+eczSyOKCIoPFcyp5vzwuQZls3h9CpyH9belBev0W1w+4embUcKW/gg8jZjIwsYNCkIg+EuWC/ZjVXgZgyt3dC3cMDML4iRa44xYMxUDO3ccfniND4ni/GOUOJ97Ed6HVXyYXQBsQ9aeFzXMl1IF82E4rrHU9PLMYu7z8Cd8ejYjkLfawoWUTlYpT3HZG8KBr8PQsfKEV1bF/TcfNF1GoOe5xQGH7mM+elizE/kY34ynyGSZieULM6p5WJ5Q6p41a7y336nSj0w5S5aimK0VoSiYe+GhpMHml4forPxML1Ti+mdVopWaAyafwhC01HGHNzRcBiN5u/80T2ajq7iEbrx+egk5KMVp8T2YjGHHtZUCmV9c2JwfgWaSXmI8/cQK7YhbJ0RU2YhXL0RlraISTMRO6MQF2Q8vRgRHo/4eKmM+yCsHBBjfBER5xDn7iJO30Ak3sBAkc+GO5XNIrOmvnJGdqEMfCMTriFCv5JFNojglYgTKYi5i6ShE2KoNWLiVMSm3VJA5mbcQpyU8WVrEDbSxGciIlaapGTKeDo6yd+yXHlfJb59Uf3GP+s7aXAKkRyHSIhFTBiPcLBHbFiPOJuEOC5NA+cgHKWQhQXCfTRi4QLEwXA59VnEpytkA5byW5BsMlka/Avt5Hj+lJfbKa6+qHg8M1s6J4Qh4g8gFIcRB9YhRsgprM0RvmMQO1ZLo0OI6B2IpXJdnnKFQ80Qw2R8vIwvmI5wc5TGctLoXYikcHSTvuQvtzI6RGF9VeQy5Rm0EmS3cZ9Jk7WI1C2Iz2fLjmW39lLIfrAUGoHYLKdIlHlJIYjdAYjZXvIerORKTRHOQ2VTMn+/nCx5PUZntrKlMK1JtHa0jt11N6XT+OwyafAxmvFzJQPRTF2E5g4/KSANnEzRGGkid90f4WGOxp890Tg6i16KhfKPCaDXnklojJdGDiZohPtLg0Ds0tdx5NGlp90PLfFpRsHkrLX0PeWLUZwf771j/CTeS5UP6qA32p4maDn0Q3f8IHTGmqBprk8vWyN0JpujF+KKwYEfc7THmmIYIzUSJrGocA+XqrJjug0K6+5+El5+DIckbyzjXbFKdGfYOya4M/y8F0MOjqD3CEMMfI2xjHRh0GZrjKYMRG9kX/o46KM3wgAda30Grh2OlcKd0al+RJXFUt5UPq7bQL7m3hmV5x+FFCxmnMIOb4UtPqn2/+H4y05YrzRFf6guTjvMmZjjjN93Tozaa0F/DwP0bfpgOW8A4y7Y8cE5R/Y+2URW9RVFt/hPqGl96pNZc1K9NW8CC74ZwoKMdzTvZvA1S2bGDcbEWRfneYYs+d4Cv/0DsfDVp5+dLq7BRsyX+YszLdh/bxbZNcl1anWLWY/0z3jWmLesqCWK6AfjCM02ZldOf0JzBrD7hrE8jfGY0Qd7Hx08/tiHQbZa2HhpE7SvL3uU77M3z5TE0o8oajzVVt9a/EGP5C/R0Jy/5FlLdHtBwxwUD8w4fdeApCI9zhbr479QG3NbgaO7BvPXahF1tQ/nSo24UGLFw5alVLclVje8KfLtkfp1dHQ89WhRXchq7tpNbdt0SmrtuFMxgKWrtVm3VZeL1w0peWVC+euRvOoIpLE9jLbOjGRaWy16JH4b1OpH07s6z6e0tx8qa3q96U1tzXKVSrWs8+3bVR3Nbz5/3dZ2rFjddemfUOHTU/JfEOLfaNlYA5IkYeIAAAAASUVORK5CYII=",
    myth: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAARhJREFUSEvNlT0OgzAMhTlGj8CYo3TsETp2ZOzI2JGRscfoyNiRsUdgzObqIb0qGOenqkAdLCCJ32eHOK5EpNrSNhVH4P8BcM6JZSVbm8yAotPzKJZxPgWKAuAcEw7Hx66es4tBTADF/asVWA6UgqwAC3HvxcMyEABikH0Bet+/2aJYFosMSn+s/skUt7ZpfwCiyJ0azoeR4/126VZHdpVBfR7mE0ERfNNiwhTHOl0TJiAUvZ8O4lsneBLOyBFxuDYLQDUigqa5fhwhTtNi4Td8rIo262AcprnA4KQz0BCswfq+f5QBmEUIgQiFMK4tJp7sB0gXjpYgxzCfEs82HF7HFNLPn67r8PrdrOGUdKzcmv/oybkoU/NvdoVkS0HgewQAAAAASUVORK5CYII="
    };

    var gachaItems = {
        safari: 180, great: 100, ultra: 50, luxury: 75, myth: 40, quick: 40, heavy: 40, clone: 10,
        bait: 50, rock: 60, gem: 6,
        wild: 32, horde: 8,
        gacha: 1,  master: 2,
        amulet: 1, soothe: 1, scarf: 1, battery: 1,
        pearl: 12, stardust: 10, bigpearl: 8, starpiece: 5, nugget: 4, bignugget: 1
    };
    var finderItems = {
        crown: 1, honey: 1,
        rare: 5, recharge: 8, spy: 20, rock: 16, bait: 16, pearl: 16, stardust: 8, luxury: 16, gacha: 13,
        nothing: 400
    };

    //Master list of items
    var currentItems = Object.keys(itemData);
    var retiredItems = ["rocks", "fast", "zoom", "moon", "dream", "nest"];
    var allItems = currentItems.concat(retiredItems, "permfinder");

    var currentTheme;
    var nextTheme;
    /* Theme Syntax:
    forest: {
        types: ["Grass", "Bug"], //Types that will be included. Pokémon only needs to match one of these types
        excludeTypes: [], //Types that will be excluded even if it matches the type above
        include: [16, 17, 18, 25, 163, 164], //Pokémon that do not match any of the criteria above, but will be included anyway
        exclude: [492, 649], //Pokémon that matches all of the previous criteria, but will be excluded anyway,
        customBST: { "289": 600 }, //Makes a pokémon count as a different BST for this theme. In the example, Pokémon #289 (Slaking) will be considered a 600 BST Pokémon for this theme.
        maxBST: 600, //Choose a different maximum BST for pokémon to spawn. Optional, defaults to 600.
        minBST: 300 //Choose a different minimum BST for pokémon to spawn. Optional, defaults to 300.
    }
    */
    var contestThemes = {
        "forest" : {
            "name" : "Forest",
            "types" : ["Grass", "Bug"],
            "excludeTypes" : [],
            "include" : [16, 17, 18, 25, 163, 164, 438, 185, 452, 65948, 131484, 65949, 131485, 649, 172, 287, 288, 289],
            "exclude" : [649],
            "customBST" : {
                "289" : 600
            },
            "minBST" : 300,
            "maxBST" : 601
        },
        "sea" : {
            "name" : "Sea",
            "types" : ["Water"],
            "excludeTypes" : [],
            "include" : [524954, 656026, 721562, 852634, 399, 489, 65958, 65959, 131423, 298, 712, 713, 686, 687, 691, 249, 382],
            "exclude" : [721],
            "customBST" : {
                "249" : 630,
                "382" : 630
            },
            "minBST" : 300,
            "maxBST" : 631
        },
        "volcano" : {
            "name" : "Volcano",
            "types" : ["Fire", "Rock"],
            "excludeTypes" : ["Water", "Ice"],
            "include" : [1049242, 721, 208],
            "exclude" : [438, 185, 639, 345, 346],
            "customBST" : {},
            "minBST" : 315,
            "maxBST" : 601
        },
        "cave" : {
            "name" : "Cave",
            "types" : ["Rock", "Ground", "Dark"],
            "excludeTypes" : ["Flying"],
            "include" : [41, 42, 169, 92, 93, 202, 360, 486, 29, 30, 32, 33, 206],
            "exclude" : [],
            "customBST" : {
                "486" : 600
            },
            "minBST" : 300,
            "maxBST" : 601
        },
        "sky" : {
            "name" : "Sky",
            "types" : ["Flying"],
            "excludeTypes" : ["Bug"],
            "include" : [329, 330, 635, 380, 381, 250, 621],
            "exclude" : [6, 130],
            "customBST" : {
                "250" : 620
            },
            "minBST" : 300,
            "maxBST" : 621
        },
        "urban" : {
            "name" : "Urban",
            "types" : ["Poison", "Dark", "Steel"],
            "excludeTypes" : ["Grass", "Water", "Fairy"],
            "include" : [52, 53, 209, 210, 300, 301, 479, 66015, 131551, 197087, 262623, 328159, 506, 507, 508, 19, 20, 582, 583, 584, 66217, 676, 66212, 131748, 197284, 262820, 328356, 393892, 459428, 524964, 590500, 358, 707],
            "exclude" : [],
            "customBST" : {
                "66015" : 590,
                "131551" : 590,
                "197087" : 590,
                "262623" : 590,
                "328159" : 590,
                "66217" : 600,
                "590500" : 580,
                "524964" : 580,
                "459428" : 580,
                "393892" : 580,
                "328356" : 580,
                "262820" : 580,
                "197284" : 580,
                "131748" : 580,
                "66212" : 580
            },
            "minBST" : 300,
            "maxBST" : 601
        },
        "tundra" : {
            "name" : "Tundra",
            "types" : ["Ice"],
            "excludeTypes" : [],
            "include" : [86, 90, 216, 217, 223, 244, 234, 245, 393, 394, 395, 197193, 197194, 66202, 787098, 1114778],
            "exclude" : []
        },
        "factory" : {
            "name" : "Factory",
            "types" : ["Steel", "Electric"],
            "excludeTypes" : [],
            "include" : [137, 233, 474],
            "exclude" : [],
            "customBST" : {
                "644" : 620
            },
            "minBST" : 300,
            "maxBST" : 621
        },
        "field" : {
            "name" : "Field",
            "types" : ["Normal", "Fairy"],
            "excludeTypes" : [],
            "include" : [262810, 66205, 131741, 197277, 262813, 66206, 131742, 197278, 262814, 328350, 66207, 131743, 197279, 262815, 672, 673, 77, 78, 522, 523],
            "exclude" : [137, 233, 474],
            "customBST" : {
                "289" : 600
            },
            "minBST" : 300,
            "maxBST" : 601
        },
        "dojo" : {
            "name" : "Dojo",
            "types" : ["Fighting"],
            "excludeTypes" : [],
            "include" : [291, 656, 657, 658, 390, 679, 680, 66217, 624, 625],
            "exclude" : [],
            "customBST" : {
                "66217" : 590
            },
            "minBST" : 300,
            "maxBST" : 601
        },
        "pyre" : {
            "name" : "Mt. Pyre",
            "types" : ["Ghost", "Psychic"],
            "excludeTypes" : ["Steel", "Normal"],
            "include" : [37, 38, 359, 491, 104, 105, 654, 228, 229, 198, 430],
            "exclude" : [201, 479, 386],
            "customBST" : {
                "487" : 620
            },
            "minBST" : 300,
            "maxBST" : 621
        },
        "daycare" : {
            "name" : "Daycare",
            "types" : ["Normal", "Fire", "Water", "Grass", "Electric", "Rock", "Ground", "Bug", "Dark", "Psychic", "Steel", "Ghost", "Dragon", "Fighting", "Flying", "Fairy", "Ice", "Poison"],
            "excludeTypes" : [],
            "include" : [66205, 131741, 197277, 262813],
            "exclude" : [17, 397, 292, 281, 188],
            "customBST" : {},
            "minBST" : 240,
            "maxBST" : 350
        },
        "tower" : {
            "name" : "Dragonspiral Tower",
            "types" : ["Dragon"],
            "excludeTypes" : [],
            "include" : [4, 5, 6, 116, 117, 179, 180, 181, 252, 253, 254, 328, 333, 690, 643, 644, 622, 623],
            "exclude" : [],
            "customBST" : {
                "380" : 620,
                "381" : 620,
                "643" : 620,
                "644" : 620,
                "718" : 620
            },
            "minBST" : 300,
            "maxBST" : 621
        },
        "desert" : {
            "name" : "Desert",
            "types" : ["Rock", "Ground"],
            "excludeTypes" : ["Water", "Ice"],
            "include" : [918170, 331, 332, 556, 383, 262495, 455, 30, 29, 32, 33, 23, 24],
            "exclude" : [],
            "customBST" : {
                "383" : 620
            },
            "minBST" : 300,
            "maxBST" : 621
        },
        "starter" : {
            "name" : "Starter Pokémon",
            "types" : [],
            "excludeTypes" : [],
            "include" : [1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 133, 152, 153, 154, 155, 156, 157, 158, 159, 160, 252, 253, 254, 255, 256, 257, 258, 259, 260, 387, 388, 389, 390, 391, 392, 393, 394, 395, 495, 496, 497, 498, 499, 500, 501, 502, 503, 650, 651, 652, 653, 654, 655, 656, 657, 658],
            "exclude" : [],
            "customBST" : {
                "25" : 420,
                "133" : 480,
                "196" : 535,
                "197" : 535
            },
            "minBST" : 320,
            "maxBST" : 550
        }
    };
    /*Vivillon Forms not in theme:
        2- Archipelago
        3- Continental
        5- Garden
        6- High Plains
        7- Jungle
        9- Modern
        15- Savannah
    */
    var wildForms = {
        "201": 27,
        "412": 2,
        "413": 2,
        "422": 1,
        "423": 1,
        "550": 1,
        "585": 3,
        "586": 3,
        "666": 17,
        "669": 4,
        "670": 4,
        "671": 4,
        "710": 3,
        "711": 3
    };
    var evolutions = {
        "1":{"evo":2,"candies":1},"2":{"evo":3},"4":{"evo":5,"candies":1},"5":{"evo":6},"7":{"evo":8,"candies":1},"8":{"evo":9},"10":{"evo":11,"candies":1},"11":{"evo":12},"13":{"evo":14,"candies":1},"14":{"evo":15},"16":{"evo":17,"candies":1},"17":{"evo":18},"19":{"evo":20},"21":{"evo":22},"23":{"evo":24},"25":{"evo":26},"27":{"evo":28},"29":{"evo":30,"candies":1},"30":{"evo":31},"32":{"evo":33,"candies":1},"33":{"evo":34},"35":{"evo":36},"37":{"evo":38},"39":{"evo":40},"41":{"evo":42,"candies":1},"42":{"evo":169},"43":{"evo":44,"candies":1},"44":{"evo":[45,182]},"46":{"evo":47},"48":{"evo":49},"50":{"evo":51},"52":{"evo":53},"54":{"evo":55},"56":{"evo":57},"58":{"evo":59},"60":{"evo":61,"candies":1},"61":{"evo":[62,186]},"63":{"evo":64,"candies":1},"64":{"evo":65},"66":{"evo":67,"candies":1},"67":{"evo":68},"69":{"evo":70,"candies":1},"70":{"evo":71},"72":{"evo":73},"74":{"evo":75,"candies":1},"75":{"evo":76},"77":{"evo":78},"79":{"evo":[80,199]},"81":{"evo":82,"candies":1},"82":{"evo":462},"84":{"evo":85},"86":{"evo":87},"88":{"evo":89},"90":{"evo":91},"92":{"evo":93,"candies":1},"93":{"evo":94},"95":{"evo":208},"96":{"evo":97},"98":{"evo":99},"100":{"evo":101},"102":{"evo":103},"104":{"evo":105},"108":{"evo":463},"109":{"evo":110},"111":{"evo":112,"candies":1},"112":{"evo":464},"113":{"evo":242},"114":{"evo":465},"116":{"evo":117,"candies":1},"117":{"evo":230},"118":{"evo":119},"120":{"evo":121},"123":{"evo":212},"125":{"evo":466},"126":{"evo":467},"129":{"evo":130},"133":{"evo":[470,471,135,134,136,196,197,700]},"137":{"evo":233,"candies":1},"138":{"evo":139},"140":{"evo":141},"147":{"evo":148,"candies":1},"148":{"evo":149},"152":{"evo":153,"candies":1},"153":{"evo":154},"155":{"evo":156,"candies":1},"156":{"evo":157},"158":{"evo":159,"candies":1},"159":{"evo":160},"161":{"evo":162},"163":{"evo":164},"165":{"evo":166},"167":{"evo":168},"170":{"evo":171},"172":{"evo":25,"candies":1},"173":{"evo":35,"candies":1},"174":{"evo":39,"candies":1},"175":{"evo":176,"candies":1},"176":{"evo":468},"177":{"evo":178},"179":{"evo":180,"candies":1},"180":{"evo":181},"183":{"evo":184},"187":{"evo":188,"candies":1},"188":{"evo":189},"190":{"evo":424},"191":{"evo":192},"193":{"evo":469},"194":{"evo":195},"198":{"evo":430},"200":{"evo":429},"204":{"evo":205},"207":{"evo":472},"209":{"evo":210},"215":{"evo":461},"216":{"evo":217},"218":{"evo":219},"220":{"evo":221,"candies":1},"221":{"evo":473},"223":{"evo":224},"228":{"evo":229},"231":{"evo":232},"233":{"evo":474},"236":{"evo":[107,106,237]},"238":{"evo":124},"239":{"evo":125,"candies":1},"240":{"evo":126,"candies":1},"246":{"evo":247,"candies":1},"247":{"evo":248},"252":{"evo":253,"candies":1},"253":{"evo":254},"255":{"evo":256,"candies":1},"256":{"evo":257},"258":{"evo":259,"candies":1},"259":{"evo":260},"261":{"evo":262},"263":{"evo":264},"265":{"evo":[266,268],"candies":1},"266":{"evo":267},"268":{"evo":269},"270":{"evo":271,"candies":1},"271":{"evo":272},"273":{"evo":274,"candies":1},"274":{"evo":275},"276":{"evo":277},"278":{"evo":279},"280":{"evo":281,"candies":1},"281":{"evo":[282,475]},"283":{"evo":284},"285":{"evo":286},"287":{"evo":288,"candies":1},"288":{"evo":289},"290":{"evo":[291,292]},"293":{"evo":294,"candies":1},"294":{"evo":295},"296":{"evo":297},"298":{"evo":183,"candies":1},"299":{"evo":476},"300":{"evo":301},"304":{"evo":305,"candies":1},"305":{"evo":306},"307":{"evo":308},"309":{"evo":310},"315":{"evo":407},"316":{"evo":317},"318":{"evo":319},"320":{"evo":321},"322":{"evo":323},"325":{"evo":326},"328":{"evo":329,"candies":1},"329":{"evo":330},"331":{"evo":332},"333":{"evo":334},"339":{"evo":340},"341":{"evo":342},"343":{"evo":344},"345":{"evo":346},"347":{"evo":348},"349":{"evo":[350,350]},"353":{"evo":354},"355":{"evo":356,"candies":1},"356":{"evo":477},"360":{"evo":202},"361":{"evo":[362,478]},"363":{"evo":364,"candies":1},"364":{"evo":365},"366":{"evo":[367,368]},"371":{"evo":372,"candies":1},"372":{"evo":373},"374":{"evo":375,"candies":1},"375":{"evo":376},"387":{"evo":388,"candies":1},"388":{"evo":389},"390":{"evo":391,"candies":1},"391":{"evo":392},"393":{"evo":394,"candies":1},"394":{"evo":395},"396":{"evo":397,"candies":1},"397":{"evo":398},"399":{"evo":400},"401":{"evo":402},"403":{"evo":404,"candies":1},"404":{"evo":405},"406":{"evo":315,"candies":1},"408":{"evo":409},"410":{"evo":411},"412":{"evo":[413,414]},"415":{"evo":416},"418":{"evo":419},"420":{"evo":421},"422":{"evo":423},"425":{"evo":426},"427":{"evo":428},"431":{"evo":432},"433":{"evo":358},"434":{"evo":435},"436":{"evo":437},"438":{"evo":185},"439":{"evo":122},"440":{"evo":113,"candies":1},"443":{"evo":444,"candies":1},"444":{"evo":445},"446":{"evo":143},"447":{"evo":448},"449":{"evo":450},"451":{"evo":452},"453":{"evo":454},"456":{"evo":457},"458":{"evo":226},"459":{"evo":460},"495":{"evo":496,"candies":1},"496":{"evo":497},"498":{"evo":499,"candies":1},"499":{"evo":500},"501":{"evo":502,"candies":1},"502":{"evo":503},"504":{"evo":505},"506":{"evo":507,"candies":1},"507":{"evo":508},"509":{"evo":510},"511":{"evo":512},"513":{"evo":514},"515":{"evo":516},"517":{"evo":518},"519":{"evo":520,"candies":1},"520":{"evo":521},"522":{"evo":523},"524":{"evo":525,"candies":1},"525":{"evo":526},"527":{"evo":528},"529":{"evo":530},"532":{"evo":533,"candies":1},"533":{"evo":534},"535":{"evo":536,"candies":1},"536":{"evo":537},"540":{"evo":541,"candies":1},"541":{"evo":542},"543":{"evo":544,"candies":1},"544":{"evo":545},"546":{"evo":547},"548":{"evo":549},"551":{"evo":552,"candies":1},"552":{"evo":553},"554":{"evo":555},"557":{"evo":558},"559":{"evo":560},"562":{"evo":563},"564":{"evo":565},"566":{"evo":567},"568":{"evo":569},"570":{"evo":571},"572":{"evo":573},"574":{"evo":575,"candies":1},"575":{"evo":576},"577":{"evo":578,"candies":1},"578":{"evo":579},"580":{"evo":581},"582":{"evo":583,"candies":1},"583":{"evo":584},"585":{"evo":586},"588":{"evo":589},"590":{"evo":591},"592":{"evo":593},"595":{"evo":596},"597":{"evo":598},"599":{"evo":600,"candies":1},"600":{"evo":601},"602":{"evo":603,"candies":1},"603":{"evo":604},"605":{"evo":606},"607":{"evo":608,"candies":1},"608":{"evo":609},"610":{"evo":611,"candies":1},"611":{"evo":612},"613":{"evo":614},"616":{"evo":617},"619":{"evo":620},"622":{"evo":623},"624":{"evo":625},"627":{"evo":628},"629":{"evo":630},"633":{"evo":634,"candies":1},"634":{"evo":635},"636":{"evo":637},"650":{"evo":651,"candies":1},"651":{"evo":652},"653":{"evo":654,"candies":1},"654":{"evo":655},"656":{"evo":657,"candies":1},"657":{"evo":658},"659":{"evo":660},"661":{"evo":662,"candies":1},"662":{"evo":663},"664":{"evo":665,"candies":1},"665":{"evo":666},"667":{"evo":668},"669":{"evo":670,"candies":1},"670":{"evo":671},"672":{"evo":673},"674":{"evo":675},"677":{"evo":678},"679":{"evo":680,"candies":1},"680":{"evo":681},"682":{"evo":683},"684":{"evo":685},"686":{"evo":687},"688":{"evo":689},"690":{"evo":691},"692":{"evo":693},"694":{"evo":695},"696":{"evo":697},"698":{"evo":699},"704":{"evo":705,"candies":1},"705":{"evo":706},"708":{"evo":709},"710":{"evo":711},"712":{"evo":713},"714":{"evo":715}
    };
    var megaEvolutions = {
        "3":[65539],"6":[65542, 131078],"9":[65545],"15":[65551],"18":[65554],"65":[65601],"80":[65616],"94":[65630],"115":[65651],"127":[65663],"130":[65666],"142":[65678],"150":[65686, 131222],"181":[65717],"208":[65744],"212":[65748],"214":[65750],"229":[65765],"248":[65784],"254":[65790],"257":[65793],"260":[65796],"282":[65818],"302":[65838],"303":[65839],"306":[65842],"308":[65844],"310":[65846],"319":[65855],"323":[65859],"334":[65870],"354":[65890],"359":[65895],"362":[65898],"373":[65909],"376":[65912],"380":[65916],"381":[65917],"382":[65918],"383":[65919],"384":[65920],"428":[65964],"445":[65981],"448":[65984],"460":[65996],"475":[66011],"531":[66067],"719":[66255]
    };
    var megaPokemon = [65539,65542,131078,65545,65551,65554,65601,65616,65630,65651,65663,65666,65678,65686,131222,65717,65744,65748,65750,65765,65784,65790,65793,65796,65818,65838,65839,65842,65844,65846,65855,65859,65870,65890,65895,65898,65909,65912,65916,65917,65918,65919,65920,65964,65981,65984,65996,66011,66067,66255];

    //Adding a variable that already exists on player.records here will automatically make it available as a leaderboard
    //To add stuff not on player.records, you must add an exception on this.updateLeaderboards()
    var leaderboardTypes = {
        totalPokes: { desc: "by Pokémon owned", alts: [] },
        bst: { desc: "by total BST of Pokémon owned", alts: [] },
        money: { desc: "by money", alts: ["$"] },
        contestsWon: { desc: "by contests won", alts: ["contest", "contests"] },
        pokeSoldEarnings: { desc: "by money gained with selling Pokémon", alts: ["sold", "sell"] },
        luxuryEarnings: { desc: "by money gained with Luxury Balls", alts: ["luxury", "luxuryball", "luxury ball"] },
        consecutiveLogins: { desc: "by longest streak of consecutive days login", alts: ["login", "logins"] },
        pokesCaught: { desc: "by successful catches", alts: ["caught"] },
        gachasUsed: { desc: "by tickets used for Gachapon", alts: ["gacha"] }
    };

    function getAvatar(src) {
        if (SESSION.users(src)) {
            return SESSION.users(src).safari;
        }
    }
    function getAvatarOff(name) {
        var id = sys.id(name);
        var player;
        if (id) {
            player = getAvatar(id);
        }
        if (!player) {
            player = rawPlayers.get(name.toLowerCase());
            if (player) {
                player = JSON.parse(player);
            }
        }
        return player;
    }
    function now() {
        return new Date().getTime();
    }
    function timeLeft(time) {
        return Math.floor((time - now())/1000) + 1;
    }
    function getDay(time) {
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function readable(arr, last_delim) {
        if (!Array.isArray(arr))
            return arr;
        if (arr.length > 1) {
            return arr.slice(0, arr.length - 1).join(", ") + " " + last_delim + " " + arr.slice(-1)[0];
        } else if (arr.length == 1) {
            return arr[0];
        } else {
            return "";
        }
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
    /*function modeArray(arr) {
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
    }*/
    /*
        Use this function for every time you need information about a Pokémon typed by a player (don't use for pokémon picked from player.pokemon).
        Returns an object with the following properties:
        -num: Int; Pokémon's number; Same that you would get with sys.pokeNum()
        -id: Int or String; Pokémon's id that can be added to player.pokemon
        -shiny: Boolean; If the pokémon is shiny or not
        -name: String; Pokémon's name (including Shiny prefix). Same as poke()
        -input: String; What you need to type to get to that result. Used for trade
    */
    function getInputPokemon(info) {
        var shiny = false, id, num, name;

        if (info.length > 1 && (info[0] == "*" || info[info.length-1] == "*")) {
            shiny = true;
            info = info.replace("*", "");
        }
        num = parseInt(info, 10);
        if (isNaN(num)) {
            num = sys.pokeNum(info);
        }
        id = shiny ? num + "" : num;

        name = sys.pokemon(num);
        if (name == "Missingno") {
            num = null;
        }

        return { num: num, id: id, shiny: shiny, name: poke(id), input: (shiny ? "*" : "") + name };
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
    function itemAlias(name, returnGarbage) {
        name = name.toLowerCase();
        for (var e in itemData) {
            if (itemData[e].aliases.indexOf(name) !== -1) {
                return itemData[e].name;
            }
        }
        if (returnGarbage) {
            return name;
        } else {
            return "safari";
        }
    }
    /* function fillArray(item, amount) {
        var ret = [];
        for (var i = 0; i < amount; i++) {
            ret.push(item);
        }
        return ret;
    }*/
    function countArray(arr, item) {
        var first = arr.indexOf(item);
        var last = arr.lastIndexOf(item);
        var count =  last - first + (first === -1 ? 0 : 1);
        return count;
    }
    function randomSample(hash) {
        var cum = 0;
        var val = Math.random();
        var psum = 0.0;
        var x;
        var count = 0;
        for (x in hash) {
            psum += hash[x];
            count += 1;
        }
        if (psum === 0.0) {
            var j = 0;
            for (x in hash) {
                cum = (++j) / count;
                if (cum >= val) {
                    return x;
                }
            }
        } else {
            for (x in hash) {
                cum += hash[x] / psum;
                if (cum >= val) {
                    return x;
                }
            }
        }
    }

    function finishName(item) {
        if (item === "wild") {
            return "Wild Pokémon";
        } else if (item === "horde") {
            return "Horde of Wild Pokémon";
        } else if (item === "nothing") {
            return "No item";
        } else if (item === "recharge") {
            return "Recharge";
        } else if (item === "permfinder") {
            return "Itemfinder Bonus charge(s)";
        } else if (item === "itemfinder") {
            return "Itemfinder charge(s)";
        }
        return itemData[item].fullName;
    }
    function isBall(item) {
        return itemData[item].type === "ball";
    }
    function shuffle(o) {
        for (var j, x, i = o.length; i; j = parseInt(Math.random() * i, 10), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }
    function bagRow (player, arr, src, first) {
        var ret = [], item, item2;
        if (sys.os(src) === "android") {
            var linebreak = 6;
            if (first) {
                ret += "<br />Inventory<br />";
                ret += "<img src='item:274'>: $" + player.money + "";
                linebreak--;
            }
            for (var i = 0; i < arr.length; i++) {
                item = itemData[arr[i]];
                if (item.name === "itemfinder") {
                    item2 = player.balls.itemfinder + player.balls.permfinder;
                } else {
                    item2 = player.balls[arr[i]];
                }
                ret += " | <img src='item:" + item.icon + "'>: " + item2;
                linebreak--;
                if (linebreak === 0 || (i + 1 == arr.length)) {
                    ret += "<br />";
                }
            }
        } else {
            if (first) {
                ret += "<table border = 1 cellpadding = 3><tr><th colspan=12>Inventory</th></tr><tr>";
                ret += "<td valign=middle align=center colspan=2><img src='item:274' title='Money'></td>";
            } else {
                ret += "<tr>";
            }
            for (var i = 0; i < arr.length; i++) {
                item = itemData[arr[i]];
                ret += "<td align=center><img src='";
                if (item.name === "itemfinder") {
                    ret += base64icons.itemfinder;
                } else if (item.name === "gacha") {
                    ret += base64icons.gacha;
                } else if (item.name === "mega") {
                    ret += base64icons.mega;
                } else if (item.name === "myth") {
                    ret += base64icons.myth;
                }else {
                    ret += "item:" + item.icon;
                }
                ret += "' title='" + item.fullName + "'></td>";
            }
            ret += "</tr><tr>";
            if (first) {
                ret += "<td align=center colspan=2>$" + player.money + "</td>";
            }
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === "itemfinder") {
                    item = player.balls.itemfinder + player.balls.permfinder;
                } else {
                    item = player.balls[arr[i]];
                }
                ret += "<td align=center>" + item + "</td>";
            }
            ret += "</tr>";
        }
        return ret;
    }
    function isMega(num) {
        return megaPokemon.indexOf(num) !== -1;
    }
    function canLosePokemon(src, data, verb) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return false;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't " + verb + " a Pokémon during a contest!", safchan);
            return false;
        }
        if (player.pokemon.length == 1) {
            safaribot.sendMessage(src, "You can't " + verb + " your last Pokémon!", safchan);
            return false;
        }
        var input = data.split(":");
        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var id = info.id;
        if (!info.num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return false;
        }
        if (player.pokemon.indexOf(id) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return false;
        }
        var count = countRepeated(player.pokemon, id);
        if (player.party.length == 1 && player.party[0] === id && count <= 1) {
            safaribot.sendMessage(src, "You can't " + verb + " the only Pokémon in your party!", safchan);
            return false;
        }
        if (player.starter === id && count <= 1) {
            safaribot.sendMessage(src, "You can't " + verb + " your starter Pokémon!", safchan);
            return false;
        }
        if (pokeInfo.forme(info.num) > 0 && isMega(info.num)) {
            safaribot.sendMessage(src, "You can't " + verb + " a Pokémon while they are Mega Evolved!", safchan);
            return false;
        }
        return true;
    }
    function rewardCapCheck(src, reward, amount) {
        var cap = itemCap;
        var player = getAvatar(src);
        if (player.balls[reward] + amount > cap) {
            var check = cap - player.balls[reward];
            if (check < 1) {
                safaribot.sendMessage(src, "However, you didn't have any space left and were forced to discard " + (amount === 1 ? "it" : "them") + "!", safchan);
            } else {
                safaribot.sendMessage(src, "However, you only had space for " + check + " and were forced to discard the rest!", safchan);
            }
            player.records.itemsDiscarded += (amount - check);
            amount = check;
            if (amount < 0) {
                amount = 0;
            }
        }
        player.balls[reward] += amount;
    }
    
    this.startContest = function(commandData) {
        contestCooldown = contestCooldownLength;
        contestCount = contestDuration;
        if (commandData.toLowerCase() === "none") {
            currentTheme = null;
        } else if (commandData.toLowerCase() in contestThemes) {
            currentTheme = commandData.toLowerCase();
        } else if (nextTheme) {
            currentTheme = nextTheme == "none" ? null : nextTheme;
            nextTheme = null;
        } else {
            var themeList = Object.keys(contestThemes);
            currentTheme = Math.random() < 0.5 ? null : themeList[sys.rand(0, themeList.length)];
        }
        sys.sendAll("*** ************************************************************ ***", safchan);
        safaribot.sendAll("A new " + (currentTheme ? contestThemes[currentTheme].name + "-themed" : "") + " Safari contest is starting now!", safchan);
        sys.sendAll("*** ************************************************************ ***", safchan);

        if (contestBroadcast) {
            sys.sendAll("*** ************************************************************ ***", 0);
            safaribot.sendAll("A new " + (currentTheme ? contestThemes[currentTheme].name + "-themed" : "") + " Safari contest is starting now at #" + defaultChannel + "!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
        } else {
            contestBroadcast = true;
        }
        wildEvent = false;
        safari.createWild();
    };
    this.createWild = function(dexNum, makeShiny, amt, bstLimit, leader) {
        var num,
            pokeId,
            shiny = sys.rand(0, shinyChance) < 1,
            maxStats,
            amount = amt || 1,
            ignoreForms = false;

        if (amount > 1) {
            shiny = false;
        }
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
            if (currentTheme) {
                var theme = contestThemes[currentTheme];
                maxStats = sys.rand(theme.minBST || 300, theme.maxBST || 601);
                var list = [], bst, e;
                for (e = 1; e < 722; e++) {
                    bst = "customBST" in theme && e in theme.customBST ? theme.customBST[e] : getBST(e);
                    if (this.validForTheme(e, currentTheme) && bst <= maxStats) {
                        list.push(e);
                    }
                }
                if (list.length === 0) {
                    return;
                }
                num = list[sys.rand(0, list.length)];
                pokeId = poke(num + (shiny ? "" : 0));
                ignoreForms = true;
            }
            else {
                var maxRoll = bstLimit || 600;
                maxStats = sys.rand(300, maxRoll);
                if (leader) {
                    var list = [], loops = 0, found = false,
                        atk1 = sys.type(sys.pokeType1(leader)),
                        atk2 = sys.type(sys.pokeType2(leader));

                    do {
                        num = sys.rand(1, 722);
                        if (getBST(num) <= maxStats) {
                            if (this.checkEffective(atk1, atk2, sys.type(sys.pokeType1(num)), sys.type(sys.pokeType2(num))) > 1) {
                                found = true;
                                break;
                            } else {
                                list.push(num);
                            }
                        }
                        loops++;
                    } while (list.length < 7 && loops < 50);
                    
                    if (!found) {
                        if (list.length === 0) {
                            do {
                                num = sys.rand(1, 722);
                                pokeId = poke(num + (shiny ? "" : 0));
                            } while (!pokeId || getBST(num) > maxStats);
                        } else {
                            num = list[sys.rand(0, list.length)];
                        }
                    }
                    pokeId = poke(num + (shiny ? "" : 0));
                } else {
                    do {
                        num = sys.rand(1, 722);
                        pokeId = poke(num + (shiny ? "" : 0));
                    } while (!pokeId || getBST(num) > maxStats);
                }
            }
        }

        if (!ignoreForms && num in wildForms) {
            var pickedForm = sys.rand(0, wildForms[num] + 1);
            num = pokeInfo.calcForme(num, pickedForm);
        }
        pokeId = poke(num + (shiny ? "" : 0));
        currentPokemon = shiny ? "" + num : num;
        currentPokemonCount = amount;
        if (amount > 1) {
            var ret = [];
            ret += "<hr><center>A horde of wild " + pokeId + " appeared! <i>(BST: " + add(sys.pokeBaseStats(num)) + ")</i><br/>";
            for (var i = 0; i < amount; i++) {
                ret += pokeInfo.sprite(currentPokemon);
            }
            ret += "</center><hr>";
            sys.sendHtmlAll(ret, safchan);
        } else {
            sys.sendHtmlAll("<hr><center>A wild " + pokeId + " appeared! <i>(BST: " + add(sys.pokeBaseStats(num)) + ")</i><br/>" + (wildEvent ? "<b>This is an Event Pokémon! No Master Balls allowed!</b><br/>" : "") + pokeInfo.sprite(currentPokemon) + "</center><hr>", safchan);
        }
        preparationPhase = sys.rand(5, 8);
        preparationThrows = {};
        preparationFirst = null;
    };
    this.validForTheme = function(pokeId, themeName) {
        var theme = contestThemes[themeName];
        var pokeNum = parseInt(pokeId, 10);

        if (theme.exclude.indexOf(pokeNum) !== -1) {
            return false;
        }
        if (theme.include.indexOf(pokeNum) !== -1) {
            return true;
        }
        for (var e in theme.excludeTypes) {
            if (hasType(pokeNum, theme.excludeTypes[e])) {
                return false;
            }
        }
        for (e in theme.types) {
            if (hasType(pokeNum, theme.types[e])) {
                return true;
            }
        }
        return false;
    };
    this.throwBall = function(src, data, bypass) {
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
        if (!bypass && (!preparationFirst || sys.name(src).toLowerCase() !== preparationFirst.toLowerCase()) && player.cooldowns.ball > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldowns.ball - currentTime)/1000) + 1) + " seconds before throwing a ball!", safchan);
            return;
        }

        var ball = itemAlias(data);
        if (!isBall(ball)) {
            ball = "safari";
        }
        var ballBonus = itemData[ball].ballBonus;
        var cooldown = itemData[ball].cooldown;

        if (isNaN(player.balls[ball])) {
            player.balls[ball] = 0;
        }
        if (!(ball in player.balls) || player.balls[ball] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(ball) + " Balls!", safchan);
            return;
        }
        
        if (wildEvent && ball == "master") {
            safaribot.sendMessage(src, "This is an Event Pokémon, you cannot use Master Ball!", safchan);
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
        var shinyChance = typeof currentPokemon == "string" ? 0.30 : 1;

        var userStats = add(sys.pokeBaseStats(player.party[0]));
        var wildStats = add(sys.pokeBaseStats(wild));
        var statsBonus = (userStats - wildStats) / 6000;

        var legendaries = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,490,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721];

        if (ball === "myth") {
            if (typeof currentPokemon == "string") {
                shinyChance = 1;
            } else if (legendaries.indexOf(pokeInfo.species(currentPokemon)) != -1){
                ballBonus = itemData[ball].bonusRate;
            }
        }
        if (ball === "heavy" && wildStats >= 450) {
            ballBonus = 1 + itemData[ball].bonusRate * (Math.floor((wildStats - 450) / 25) + 1);
            if (ballBonus > itemData[ball].maxBonus) {
                ballBonus = itemData[ball].maxBonus;
            }
        }
        if (ball === "premier" && (sys.type(sys.pokeType1(player.party[0])) === "Normal" || sys.type(sys.pokeType2(player.party[0])) === "Normal")) {
            ballBonus = itemData[ball].bonusRate;
        }
        var typeBonus = this.checkEffective(sys.type(sys.pokeType1(player.party[0])), sys.type(sys.pokeType2(player.party[0])), sys.type(sys.pokeType1(wild)), sys.type(sys.pokeType2(wild)));

        var tiers = ["ORAS LC", "ORAS NU", "ORAS LU", "ORAS UU", "ORAS OU", "ORAS Ubers"];
        var tierChance = 0.02;
        for (var x = 0; x < tiers.length; x++) {
            if (sys.isPokeBannedFromTier && !sys.isPokeBannedFromTier(wild, tiers[x])) {
                tierChance = [0.20, 0.18, 0.14, 0.11, 0.07, 0.03][x];
                break;
            }
        }

        var finalChance = (tierChance + statsBonus) * typeBonus * shinyChance;
        if (finalChance <= 0) {
            finalChance = 0.01;
        }
        finalChance *= ballBonus;
        if (ball == "clone" && finalChance > itemData[ball].bonusRate) {
            finalChance = itemData[ball].bonusRate;
        }

        var rng = Math.random(), name = sys.name(src);
        if (rng < finalChance || ballBonus == 255) {
            currentPokemonCount--;
            var amt = currentPokemonCount;
            var remaining = " There " + (amt > 1 ? "are" : "is") + " still " + currentPokemonCount + " " + pokeName + " left to catch!";
            if (amt < 1) {
                sys.sendAll("", safchan);
            }
            if (ball == "spy") {
                safaribot.sendAll("Some stealthy person caught the " + pokeName + " with a " + cap(ball) + " Ball and the help of their well-trained spy Pokémon!" + (amt > 0 ? remaining : ""), safchan);
            } else {
                safaribot.sendAll(name + " caught the " + pokeName + " with a " + cap(ball) + " Ball and the help of their " + poke(player.party[0]) + "!" + (amt > 0 ? remaining : ""), safchan);
            }
            safaribot.sendMessage(src, "Gotcha! " + pokeName + " was caught with a " + cap(ball) + " Ball! You still have " + player.balls[ball] + " " + cap(ball) + " Ball(s)!", safchan);
            player.pokemon.push(currentPokemon);
            player.records.pokesCaught += 1;

            if (ball == "clone") {
                safaribot.sendAll("But wait! The " + pokeName + " was cloned by the Clone Ball! " + name + " received another " + pokeName + "!", safchan);
                player.pokemon.push(currentPokemon);
                player.records.pokesCloned += 1;
            }

            if (ball == "luxury") {
                var perkBonus = 1 + Math.min(itemData.scarf.bonusRate * player.balls.scarf, itemData.scarf.maxRate);
                var earnings = Math.floor(wildStats/2 * perkBonus);
                safaribot.sendAll((player.balls.scarf > 0 ? "The Fashionable " : "") + name + " found $" + earnings + " on the ground after catching " + pokeName + "!" , safchan);
                player.money += earnings;
                player.records.luxuryEarnings += earnings;
            }

            var penalty = 2 - Math.min(itemData.soothe.bonusRate * player.balls.soothe, itemData.soothe.maxRate);
            cooldown *= penalty;
            if (contestCount > 0) {
                if (!(name in contestCatchers)) {
                    contestCatchers[name] = [];
                }
                contestCatchers[name].push(currentPokemon);
                if (ball == "clone") {
                    contestCatchers[name].push(currentPokemon);
                }
            }
            if (amt < 1) {
                sys.sendAll("", safchan);
                currentPokemon = null;
                wildEvent = false;
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
            safaribot.sendAll(pokeName + " broke out of " + (ball == "spy" ? "an anonymous person" : name) + "'s " + cap(ball) + " Ball!", safchan);
            player.records.pokesNotCaught += 1;
        }
        player.cooldowns.ball = currentTime + cooldown;
        player.cooldowns.ballUse = player.cooldowns.ball;

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
        var verb = "sell";
        if (!canLosePokemon(src, data, verb)) {
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To sell a Pokémon, use /sell [name] to check its price, and /sell [name]:confirm to sell it.", safchan);
            return;
        }
        var player = getAvatar(src);
        var input = data.split(":");
        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var id = info.id;

        var perkBonus = 1 + Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
        var price = Math.round(add(sys.pokeBaseStats(id)) * (shiny ? 5 : 1) * perkBonus);

        if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
            safaribot.sendMessage(src, "You can sell your " + info.name + " for $" + price + ". To confirm it, type /sell " + (shiny ? "*":"") + sys.pokemon(id) + ":confirm.", safchan);
            return;
        }

        player.money += price;
        player.records.pokeSoldEarnings += price;
        this.removePokemon(src, id);

        safaribot.sendMessage(src, "You sold your " + info.name + " for $" + price + "!", safchan);
        this.saveGame(player);
    };
    this.buyItems = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var validItems = [];
        for (var e in itemData) {
            if (itemData[e].buyable && itemData[e].price > 0) {
                validItems.push(itemData[e].name);
            }
        }

        if (data === "*") {
            safaribot.sendMessage(src, "You can buy the following items:", safchan);
            for (var i = 0; i < validItems.length; i++) {
                safaribot.sendMessage(src, itemData[validItems[i]].fullName + ": $" + itemData[validItems[i]].price, safchan);
            }
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You currently have $" + player.money + ". To buy an item, use /buy item:quantity (e.g.: /buy safari:3)", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        var info = data.split(":");
        var item = itemAlias(info[0], true);
        var amount = 1;
        if (info.length > 1) {
            amount = parseInt(info[1], 10);
            if (isNaN(amount) || amount < 1) {
                amount = 1;
            }
        }

        if (validItems.indexOf(item) == -1) {
            safaribot.sendMessage(src, "We don't seem to sell \"" + info[0] +  "\" at this location.", safchan);
            return;
        }

        var cap = itemCap;
        if (item === "stick") {
            cap = 1;
        }

        if (player.balls[item] + amount > cap) {
            if (amount == cap) {
                safaribot.sendMessage(src, "You are carrying the maximum amount of " + finishName(item) + " (" + cap + ") and cannot buy any more!", safchan);
            } else {
                safaribot.sendMessage(src, "You can only carry " + cap + " " + finishName(item) + "! You currently have " + player.balls[item] + " which leaves space for " + (cap - player.balls[item]) + " more.", safchan);
            }
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
        player.balls[item] += amount;
        safaribot.sendMessage(src, "You bought " + amount + " " + finishName(item) +  " for $" + cost + "! You now have " + player.balls[item] + " " + finishName(item) + " and $" + player.money + "!", safchan);

        var bonus;
        if (amount >= 10) {
            var bonusAmt = Math.floor(amount / 10);
            if (isBall(item)) {
                bonus = "premier";
                safaribot.sendMessage(src, "Here, take these " + bonusAmt + " Premier Balls for your patronage!", safchan);
            } else if (item === "gacha") {
                bonus = "gacha";
                bonusAmt *= 2;
                safaribot.sendMessage(src, "Here, take these " + bonusAmt + " extra Gachapon Tickets for your patronage!", safchan);
            }

            if (player.balls[bonus] + bonusAmt > cap) {
                var check = cap - player.balls[bonus];
                if (check < 1) {
                    safaribot.sendMessage(src, "However, you didn't have any space left and were forced to discard " + (bonusAmt === 1 ? "it" : "them") + "!", safchan);
                } else {
                    safaribot.sendMessage(src, "However, you only had space for " + check + " and were forced to discard the rest!", safchan);
                }
                bonusAmt = check;
                if (bonusAmt < 0) {
                    bonusAmt = 0;
                }
            }
            player.balls[bonus] += bonusAmt;
        }
        this.saveGame(player);
    };
    this.sellItems = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var validItems = [];
        for (var e in itemData) {
            if (itemData[e].sellable && itemData[e].price > 0) {
                validItems.push(itemData[e].name);
            }
        }

        var perkBonus = 1 + Math.min(itemData.crown.bonusRate * player.balls.crown, itemData.crown.maxRate);
        if (data === "*") {
            safaribot.sendMessage(src, "You can sell the following items:", safchan);
            for (var i = 0; i < validItems.length; i++) {
                safaribot.sendMessage(src, itemData[validItems[i]].fullName + ": $" + Math.floor(itemData[validItems[i]].price/2 * perkBonus), safchan);
            }
            sys.sendMessage(src, "", safchan);
            var sellables = [];
            for (var i = 0; i < validItems.length; i++) {
                var misc = validItems[i];
                var amt = player.balls[misc];
                if (amt > 0) {
                    var plural = amt > 1 ? "s" : "";
                    sellables.push(amt + " " + finishName(misc) + plural);
                }
            }
            if (sellables.length > 0) {
                safaribot.sendMessage(src, "You currently have " + sellables.join(", ") + ". To sell an item, use /pawn item:quantity (e.g.: /pawn pearl:3)", safchan);
            } else {
                safaribot.sendMessage(src, "You don't have anything that can be sold at this time!", safchan);
            }
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        var info = data.split(":");
        var item = itemAlias(info[0], true);
        var amount = 1;
        if (info.length > 1) {
            amount = parseInt(info[1], 10);
            if (isNaN(amount) || amount < 1) {
                amount = 1;
            }
        }

        if (validItems.indexOf(item) == -1) {
            safaribot.sendMessage(src, "We do not buy \"" + info[0] +  "\" at this location.", safchan);
            return;
        }

        if (player.balls[item] < amount) {
            safaribot.sendMessage(src, "You don't have " + amount + " " + finishName(item) + ", you only have " + player.balls[item] + "!", safchan);
            return;
        }
        var cost = Math.floor(amount * itemData[item].price/2 * perkBonus);
        player.money += cost;
        player.balls[item] -= amount;
        player.records.pawnEarnings += cost;
        safaribot.sendMessage(src, "You sold " + amount + " " + finishName(item) +  " for $" + cost + "! You now have " + player.balls[item] + " " + finishName(item) + " and $" + player.money + "!", safchan);
        this.saveGame(player);
    };
    this.tradePokemon = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (player.pokemon.length < 5) {
            safaribot.sendMessage(src, "You can only trade after you catch more than 5 Pokémon!", safchan);
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
            safaribot.sendMessage(src, "You can trade a Pokémon (type the name or number), money (type $150) or item (type @master).", safchan);
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
        if (src === targetId || sys.ip(targetId) === sys.ip(src)) {
            safaribot.sendMessage(src, "You can't trade with yourself!", safchan);
            return;
        }
        var target = getAvatar(targetId);
        if (!target) {
            safaribot.sendMessage(src, "This person didn't enter the Safari!", safchan);
            return;
        }

        var offer = info[1].replace(/flabebe/gi, "flabébé").toLowerCase();
        var request = info[2].replace(/flabebe/gi, "flabébé").toLowerCase();

        var offerType = this.isValidTrade(src, offer, "offer", request);
        if (!offerType) {
            return;
        }
        var requestType = this.isValidTrade(src, request, "request", offer);
        if (!requestType) {
            return;
        }
        if (offerType == "money" && requestType == "money") {
            safaribot.sendMessage(src, "You cannot trade money for money!", safchan);
            return;
        }
        if (!this.canTrade(src, offer)) {
            return;
        }

        var targetName = sys.name(targetId).toLowerCase();

        var offerName = this.translateTradeOffer(offer);
        var requestName = this.translateTradeOffer(request);
        var offerInput = this.tradeOfferInput(offer);
        var reqInput = this.tradeOfferInput(request);

        if (offerType == "item" && requestType == "item" && itemAlias(offerInput.substr(offerInput.indexOf("@") + 1), true) == itemAlias(reqInput.substr(reqInput.indexOf("@") + 1), true)) {
            safaribot.sendMessage(src, "You cannot trade an item for the same one!", safchan);
            return;
        }

        sys.sendMessage(src, "" , safchan);
        sys.sendMessage(targetId, "" , safchan);
        safaribot.sendMessage(src, "You are offering a " + offerName + " to " + sys.name(targetId) + " for their " + requestName+ "!" , safchan);
        safaribot.sendMessage(targetId, sys.name(src) + " is offering you a " + offerName + " for your " + requestName + "!" , safchan);

        if (targetName in tradeRequests && tradeRequests[targetName].target === userName) {
            var req = tradeRequests[targetName];
            if (offerInput == req.request && reqInput == req.offer) {
                if (!this.canTrade(targetId, request)) {
                    safaribot.sendMessage(src, "Trade cancelled because " + sys.name(targetId) + " couldn't fulfill their offer." , safchan);
                    safaribot.sendMessage(targetId, "Trade cancelled because you couldn't fulfill your offer." , safchan);
                    delete tradeRequests[targetName];
                    return;
                }
                if (!this.canReceiveTrade(src, targetId, offerInput)) {
                    delete tradeRequests[targetName];
                    return;
                }
                if (!this.canReceiveTrade(targetId, src, reqInput)) {
                    delete tradeRequests[targetName];
                    return;
                }
                var obj, val;
                switch (offerType) {
                    case "poke":
                        obj = getInputPokemon(offer);
                        this.removePokemon(src, obj.id);
                        target.pokemon.push(obj.id);
                    break;
                    case "money":
                        val = parseInt(offer.substr(1), 10);
                        player.money -= val;
                        target.money += val;
                    break;
                    case "item":
                        obj = itemAlias(offer.substr(offer.indexOf("@") + 1), true);
                        val = parseInt(offer.substr(0, offer.indexOf("@")), 10) || 1;
                        player.balls[obj] -= val;
                        target.balls[obj] += val;
                    break;
                }

                switch (requestType) {
                    case "poke":
                        obj = getInputPokemon(request);
                        this.removePokemon(targetId, obj.id);
                        player.pokemon.push(obj.id);
                    break;
                    case "money":
                        val = parseInt(request.substr(1), 10);
                        player.money += val;
                        target.money -= val;
                    break;
                    case "item":
                        obj = itemAlias(request.substr(request.indexOf("@") + 1), true);
                        val = parseInt(request.substr(0, request.indexOf("@")), 10) || 1;
                        player.balls[obj] += val;
                        target.balls[obj] -= val;
                    break;
                }

                this.saveGame(player);
                this.saveGame(target);

                safaribot.sendMessage(src, "You traded your " + offerName + " for " + sys.name(targetId) + "'s " + requestName + "!", safchan);
                safaribot.sendMessage(targetId, "You traded your " + requestName + " for " + sys.name(src) + "'s " + offerName + "!", safchan);
                sys.sendMessage(src, "" , safchan);
                sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
            }
            else {
                safaribot.sendMessage(src, "Trade cancelled because you and " + sys.name(targetId) + " didn't come to an agreement!" , safchan);
                safaribot.sendMessage(targetId, "Trade cancelled because you and " + sys.name(src) + " didn't come to an agreement!" , safchan);
                sys.sendMessage(src, "" , safchan);
                sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
            }
        }
        else {
            var acceptCommand = "/trade " + sys.name(src) + ":" + reqInput + ":" + offerInput;
            safaribot.sendHtmlMessage(targetId, "To accept the trade, type <a href='po:send/" + acceptCommand + "'>" + acceptCommand + "</a>.", safchan);
            sys.sendMessage(src, "" , safchan);
            sys.sendMessage(targetId, "" , safchan);
            tradeRequests[userName] = { target: targetName, offer: offerInput, request: reqInput };
        }
    };
    this.translateTradeOffer = function(asset) {
        if (asset[0] == "$") {
            return "$" + parseInt(asset.substr(asset.indexOf("$") + 1), 10);
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            return amount + "x " + finishName(item);
        }
        else {
            return getInputPokemon(asset).name;
        }
    };
    this.tradeOfferInput = function(asset) {
        if (asset[0] == "$") {
            return "$" + parseInt(asset.substr(asset.indexOf("$") + 1), 10);
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            return (amount > 1 ? amount : "") + "@" + item;
        }
        else {
            return getInputPokemon(asset).input;
        }
    };
    this.isValidTrade = function(src, asset, action, traded) {
        if (asset[0] == "$") {
            var val = parseInt(asset.substr(1), 10);
            if (isNaN(val) || val <= 0) {
                safaribot.sendMessage(src, "Please " + action + " a valid amount of money!", safchan);
                return false;
            }
            return "money";
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            if (!(item in itemData)) {
                safaribot.sendMessage(src,  item + " is not a valid item!", safchan);
                return false;
            }
            if (!itemData[item].tradable) {
                safaribot.sendMessage(src,  finishName(item) + " cannot be traded!", safchan);
                return false;
            }
            if (isNaN(amount) || amount <= 0) {
                safaribot.sendMessage(src,  "Please " + action + " a valid amount of " + finishName(item) + "!", safchan);
                return false;
            }
            return "item";
        }
        else {
            var info = getInputPokemon(asset);
            if (!info.id) {
                safaribot.sendMessage(src, "Please " + action + " a valid pokémon!", safchan);
                return false;
            }
            if (sys.pokemon(info.id) == "Missingno") {
                safaribot.sendMessage(src, "Please " + action + " a valid pokémon!", safchan);
                return false;
            }
            if (traded[0] == "$") {
                var min = getBST(info.id) * (info.shiny === true ? 5 : 1);
                var money = parseInt(traded.substr(1), 10);
                if (isNaN(money) || money <= min) {
                    safaribot.sendMessage(src, info.name + " cannot be traded for less than $" + min + "!", safchan);
                    return false;
                }
            }
            return "poke";
        }
        return true;
    };
    this.canTrade = function(src, asset) {
        var player = getAvatar(src);
        if (asset[0] == "$") {
            var val = parseInt(asset.substr(1), 10);
            if (player.money < val) {
                safaribot.sendMessage(src, "You don't have enough $" + val + " to trade!", safchan);
                return false;
            }
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            if (player.balls[item] < amount) {
                safaribot.sendMessage(src, "You don't have " + amount + " " + finishName(item) + "(s) to trade!", safchan);
                return false;
            }
        }
        else {
            var info = getInputPokemon(asset);
            var pokeId = info.id;
            
            return canLosePokemon(src, info.input, "trade");
        }
        return true;
    };
    this.canReceiveTrade = function(src, receiverId, asset) {
        var receiver = getAvatar(receiverId);
        if (asset[0] == "$") {
            var val = parseInt(asset.substr(1), 10);
            if (receiver.money + val > moneyCap) {
                safaribot.sendMessage(receiverId, "Trade cancelled because you can't hold more than $" + moneyCap + " (you currently have $" + receiver.money + ", so you can receive at most $" + (moneyCap - receiver.money) + ")!", safchan);
                safaribot.sendMessage(src, "Trade cancelled because " + sys.name(receiverId) + " can't hold more than $" + moneyCap + "!", safchan);
                return false;
            }
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;

            if (receiver.balls[item] + amount > itemCap) {
                safaribot.sendMessage(src, "Trade cancelled because " + sys.name(receiverId) + " can't receive " + amount + " " + finishName(item) + "(s)!" , safchan);
                safaribot.sendMessage(receiverId, "Trade cancelled because you can't hold more than " + itemCap + " " + finishName(item) + "(s) (you currently have " + receiver.balls[item] + ", so you can receive at most " + (itemCap - amount) + ")!", safchan);
                return false;
            }
            if (item == "master" && receiver.balls[item] + amount > 1) {
                safaribot.sendMessage(src, "Trade cancelled because " + sys.name(receiverId) + " already has a Master Ball!" , safchan);
                safaribot.sendMessage(receiverId, "Trade cancelled because you already have a Master Ball!", safchan);
                return false;
            }
        }
        return true;
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
        if (player.cooldowns.ballUse > now()) {
            safaribot.sendMessage(src, "You used a ball recently, so please wait " + timeLeft(player.cooldowns.ballUse) + " seconds before throwing a bait!", safchan);
            return;
        }
        if (lastBaiters.indexOf(sys.name(src)) !== -1) {
            safaribot.sendMessage(src, "You just threw some bait not too long ago. Let others have a turn!", safchan);
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
        player.records.baitUsed += 1;

        var rng = Math.random();
        var perkBonus = Math.min(itemData.honey.bonusRate * player.balls.honey, itemData.honey.maxRate);

        if (rng < (itemData.bait.successRate + perkBonus)) {
            safaribot.sendAll(sys.name(src) + " left some bait out. The bait attracted a wild Pokémon!", safchan);
            baitCooldown = itemData.bait.successCD + sys.rand(0,10);
            player.records.baitAttracted += 1;

            if (lastBaiters.length >= lastBaitersAmount) {
                lastBaiters.shift();
            }
            lastBaiters.push(sys.name(src));

            safari.createWild(null, null, 1, null, player.party[0]);
            if (commandData !== undefined) {
                safari.throwBall(src, commandData, true);
                preparationFirst = sys.name(src);
            }
            lastBaitersDecay = lastBaitersDecayTime;
        } else {
            baitCooldown = itemData.bait.failCD + sys.rand(0,5);
            safaribot.sendAll(sys.name(src) + " left some bait out... but nothing showed up.", safchan);
            player.records.baitNothing += 1;
        }
        safaribot.sendMessage(src, "You still have " + player.balls[item] + " Baits remaining.", safchan);
        this.saveGame(player);
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
        if (targetId == src) {
            safaribot.sendMessage(src, "You can't throw a rock on yourself!", safchan);
            return true;
        }
        var target = getAvatar(targetId);
        if (!target) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return true;
        }
        var currentTime = now();
        if (player.cooldowns.rock > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldowns.rock - currentTime)/1000) + 1) + " seconds before trying to a throw another rock!", safchan);
            return;
        }
        var item = "rock";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "s!", safchan);
            return;
        }

        player.balls[item] -= 1;
        player.records.rocksThrown += 1;

        var rng = Math.random();
        var rng2 = Math.random();
        var success = (preparationPhase > 0 ? 0.15 : itemData.rock.successRate);
        var targetName = utilities.non_flashing(sys.name(targetId));

        if (commandData.toLowerCase() === preparationFirst) {
            success = 0;
        }

        if (rng < success) {
            if (rng2 < 0.4) {
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "! *THUD* A direct hit! " + targetName + " was stunned!", safchan);
                target.cooldowns.ball = target.cooldowns.ball > currentTime ? target.cooldowns.ball + itemData.rock.targetCD : currentTime + itemData.rock.targetCD;
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
            else if (rng2 < 0.5) {
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "! " + targetName +" evaded, but their " + poke(target.party[0]) + " got hit and stunned!", safchan);
                target.cooldowns.ball = target.cooldowns.ball > currentTime ? target.cooldowns.ball + Math.floor(itemData.rock.targetCD/2) : currentTime + Math.floor(itemData.rock.targetCD/2);
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
            else if (rng2 < 0.55) {
                var dropped = sys.rand(4, 10);
                if (target.money < dropped) {
                    dropped = target.money || 1;
                }
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + ", but only hit their wallet! " + sys.name(src) + " then picked the $" + dropped + " dropped by " + targetName + "!", safchan);
                if (player.money + dropped> moneyCap) {
                    safaribot.sendMessage(src, "But you could only keep $" + (moneyCap - player.money) + "!", safchan);
                    player.money = moneyCap;
                } else {
                    safaribot.sendMessage(src, "You received $" + dropped + "!", safchan);
                    player.money += dropped;
                }
                safaribot.sendMessage(targetId, "You lost $" + dropped + "!", safchan);
                target.money = target.money - dropped < 0 ? 0 : target.money - dropped;
            }
            else {
                var parts = ["right leg", "left leg", "right arm", "left arm", "back"];
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "! The rock hit " + targetName + "'s " + parts[sys.rand(0, parts.length)] + "!", safchan);
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
        } else {
            if (rng2 < itemData.rock.bounceRate + (preparationPhase > 0 ? 0.4 : 0)) {
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + ", but it hit a wall and bounced back at " + sys.name(src) + "! *THUD* That will leave a mark on " + sys.name(src) + "'s face and pride!", safchan);
                player.cooldowns.ball = currentTime + itemData.rock.bounceCD;
                player.records.rocksBounced += 1;
            }
            else if (rng2 < 0.25) {
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + ", but " + targetName + " saw it coming and caught the rock with their bare hands!", safchan);
                if (target.balls.rock < itemCap) {
                    target.balls.rock += 1;
                    safaribot.sendMessage(targetId, "You received 1 Rock!", safchan);
                } else {
                    safaribot.sendMessage(targetId, "But you couldn't keep the Rock because you already have " + itemCap + "!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else if (rng2 < 0.35) {
                var dropped = sys.rand(10, 17);
                if (player.money < dropped) {
                    dropped = player.money || 1;
                }
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + ", but missed and broke their house's window! " + sys.name(src) + " had to pay $" + dropped + " to " + targetName + "!", safchan);
                if (target.money + dropped> moneyCap) {
                    safaribot.sendMessage(targetId, "But you could only keep $" + (moneyCap - target.money) + "!", safchan);
                    target.money = moneyCap;
                } else {
                    safaribot.sendMessage(targetId, "You received $" + dropped + "!", safchan);
                    target.money += dropped;
                }
                safaribot.sendMessage(src, "You lost $" + dropped + "!", safchan);
                player.money = player.money - dropped < 0 ? 0 : player.money - dropped;
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else if (rng2 < 0.45) {
                var onChannel = sys.playersOfChannel(safchan);
                var randomTarget = onChannel[sys.rand(0, onChannel.length)];
                if (randomTarget != src && randomTarget != targetId && getAvatar(randomTarget)) {
                    safaribot.sendAll(sys.name(src) + " tried to throw a rock at " + targetName + ", but failed miserably and almost hit " + utilities.non_flashing(sys.name(randomTarget)) + "!", safchan);
                } else {
                    safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "... but it missed!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else if (rng2 < 0.5) {
                var extraThrown = "safari";
                if (player.balls[extraThrown] > 0) {
                    safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + ", but it missed... To make things worse, " + sys.name(src) + " also dropped a " + finishName(extraThrown) + " that was stuck together with the rock!", safchan);
                    safaribot.sendMessage(src, "You lost 1 " + finishName(extraThrown) + "!", safchan);
                    player.balls[extraThrown] -= 1;
                } else {
                    safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "... but it missed!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else {
                safaribot.sendAll(sys.name(src) + " threw a rock at " + targetName + "... but it missed!", safchan);
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
        }
        player.cooldowns.rock = currentTime + itemData.rock.throwCD;
        this.saveGame(player);
    };
    this.useStick = function (src, commandData) {
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
        if (player.cooldowns.stick > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldowns.stick - currentTime)/1000) + 1) + " seconds before using your stick!", safchan);
            return;
        }
        var item = "stick";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "s!", safchan);
            return;
        }

        var targetName = utilities.non_flashing(sys.name(targetId));

        safaribot.sendAll(sys.name(src) + " poked " + targetName + " with their stick.", safchan);

        player.cooldowns.stick = currentTime + itemData.stick.cooldown;
        this.saveGame(player);
    };
    this.gachapon = function (src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }

        var currentTime = now();
        /*if (currentPokemon) {
            safaribot.sendMessage(src, "It's unwise to ignore a wild Pokémon in order to use a Gachapon Machine...", safchan);
            return;
        }*/
        if (player.cooldowns.gacha > currentTime) {
            safaribot.sendMessage(src, "A long line forms in front of the Gachapon Machine. It will probably take " + timeLeft(player.cooldowns.gacha) + " seconds before you can use the Gachapon Machine again!", safchan);
            return;
        }
        /*if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] For maintenance. Will be fixed by time the contest is over!", safchan);
            return;
        }*/
        var gach = "gacha";
        if (isNaN(player.balls[gach])) {
            player.balls[gach] = 0;
        }
        if (!(gach in player.balls) || player.balls[gach] <= 0) {
            safaribot.sendMessage(src, "You have no Gachapon Tickets!", safchan);
            return;
        }
        player.balls[gach] -= 1;
        player.records.gachasUsed += 1;
        var reward = randomSample(gachaItems);
        safaribot.sendMessage(src, "Gacha-PON! The Gachapon Machine has dispensed an item capsule. [Remaining Tickets: " + player.balls[gach] + "]", safchan);

        //Variable for higher quantity rewards later. Make better later maybe?
        var amount = 1;
        var rng2 = Math.random();
        if (rng2 < 0.02) {
            amount = 4;
        } else if (rng2 < 0.12) {
            amount = 3;
        } else if (rng2 < 0.35) {
            amount = 2;
        }
        var plural = amount > 1 ? "s" : "";

        var giveReward = true;
        switch (reward) {
            case "master":
                if (player.balls[reward] >= 1) {
                    safaribot.sendHtmlAll("<b>JACKP--</b> Wait a second... " + html_escape(sys.name(src)) + "'s Master Ball turned out to be a simple Safari Ball painted to look like a Master Ball! What a shame!", safchan);
                    safaribot.sendMessage(src, "You wiped the paint off of the ball and pocketed 1 Safari Ball for your troubles.", safchan);
                    reward = "safari";
                    amount = 1;
                    player.records.masterballsWon += 1;
                } else {
                    safaribot.sendHtmlAll("<b>JACKPOT! " + html_escape(sys.name(src)) + " just won a Master Ball from the Gachapon Machine!</b>", safchan);
                    safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
                    amount = 1;
                    player.records.masterballsWon += 1;
                }
            break;
            case "bait":
                safaribot.sendMessage(src, "A sweet, fruity aroma wafts through the air as you open your capsule. You received " + amount + " " + finishName(reward) + ".", safchan);
            break;
            case "rock":
                safaribot.sendMessage(src, "A loud clunk comes from the machine. Some prankster put rocks in the Gachapon Machine! You received  " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
            case "wild":
            case "horde":
                giveReward = false;
                if (currentPokemon) {
                    safaribot.sendAll(sys.name(src) + " goes to grab their item from the Gachapon Machine but the capsule was swiped by the wild Pokémon!", safchan);
                    player.records.capsulesLost += 1;
                } else if (contestCount > 0) {
                    giveReward = true;
                    reward = "safari";
                    amount = 1;
                    safaribot.sendMessage(src, "Bummer, only a Safari Ball. You received 1 " + finishName(reward) + ".", safchan);
                } else {
                    var mod = Math.random();
                    var spawn = true;
                    var spawnHorde = (reward === "horde");
                    safaribot.sendAll(sys.name(src) + " goes to grab their item from the Gachapon Machine but the noise lured a " + finishName(reward) + "!", safchan);

                    if (mod < 0.08 || player.cooldowns.ballUse > currentTime) {
                        safaribot.sendAll("Unfortunately " + (spawnHorde ? "they" : "it") + " fled before anyone could try to catch "+ (spawnHorde ? "them" : "it") + "!", safchan);
                        spawn = false;
                    }

                    if (spawn) {
                        if (spawnHorde) {
                            safari.createWild(0, false, 3, 580);
                        } else {
                            safari.createWild();
                        }
                        if (commandData !== undefined) {
                            safari.throwBall(src, commandData);
                            preparationFirst = sys.name(src);
                        }
                    }
                }
            break;
            case "safari":
                amount = 1;
                safaribot.sendMessage(src, "Bummer, only a Safari Ball. You received 1 " + finishName(reward) + ".", safchan);
            break;
            case "gacha":
                var jackpot = Math.floor(gachaJackpot/10);
                safaribot.sendHtmlAll("<b>JACKPOT! " + html_escape(sys.name(src)) + " just won the Gachapon Ticket Jackpot valued at " + jackpot + " tickets!</b>", safchan);
                amount = jackpot;
                player.records.jackpotsWon += 1;
                safaribot.sendMessage(src, "You received " + jackpot + " Gachapon Tickets.", safchan);
                gachaJackpot = 100; //Reset jackpot for next player
            break;
            case "amulet":
            case "soothe":
            case "scarf":
                amount = 1;
                safaribot.sendHtmlAll("<b>Sweet! " + sys.name(src) + " just won a " + finishName(reward) + " from Gachapon!</b>", safchan);
                safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
            break;
            case "bignugget":
            case "nugget":
                amount = 1;
                safaribot.sendAll("Nice! " + sys.name(src) + " just won a " + finishName(reward) + " from Gachapon!", safchan);
                safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
            break;
            case "gem":
                amount = 1;
                safaribot.sendAll("The Gachapon machine emits a bright flash of light as " + sys.name(src) + "  reaches for their prize. Despite being temporarily blinded, " + sys.name(src) + " knows they just won a " + finishName(reward) + " due to a very faint baaing sound!", safchan);
                safaribot.sendMessage(src, "You received an " + finishName(reward) + ".", safchan);
            break;
            case "pearl":
            case "stardust":
            case "starpiece":
            case "bigpearl":
                amount = 1;
                safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
            break;
            default:
                safaribot.sendMessage(src, "You received " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
        }
        if (giveReward) {
            rewardCapCheck(src, reward, amount);
        }

        player.cooldowns.gacha = currentTime + itemData.gacha.cooldown;
        this.saveGame(player);
        gachaJackpot += 1;
        SESSION.global().safariGachaJackpot = gachaJackpot;
    };
    this.useRareCandy = function(src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't use Rare Candies during a contest!", safchan);
            return;
        }

        if (player.balls.rare < 1) {
            safaribot.sendMessage(src, "You have no Rare Candies!", safchan);
            return;
        }

        var info = getInputPokemon(commandData.replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var num = info.num;
        if (!num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var id = info.id;
        if (player.pokemon.indexOf(id) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return;
        }

        var species = pokeInfo.species(num);
        if (!(species in evolutions)) {
            safaribot.sendMessage(src, "This Pokémon cannot evolve!", safchan);
            return;
        }

        var evoData = evolutions[species];
        var candiesRequired = evoData.candies || 2;
        if (candiesRequired > 1 && player.balls.rare < candiesRequired) {
            safaribot.sendMessage(src, info.name + " requires " + candiesRequired + " Rare Candies to evolve!", safchan);
            return;
        }

        var possibleEvo = evoData.evo;
        var evolveTo = Array.isArray(possibleEvo) ? evoData.evo[sys.rand(0, possibleEvo.length)] : possibleEvo;
        var forme = pokeInfo.forme(num);
        if (forme !== 0) {
            var tempForme = pokeInfo.calcForme(evolveTo, forme);
            if (sys.pokemon(tempForme).toLowerCase() !== "missingno") {
                evolveTo = tempForme;
            }
        }
        var evolvedId = shiny ? "" + evolveTo : evolveTo;

        player.balls.rare -= candiesRequired;
        player.records.pokesEvolved += 1;

        this.evolvePokemon(src, info, evolvedId, "evolved into");
        safaribot.sendMessage(src, "Your " + info.name + " ate " + candiesRequired + " Rare Cand" + (candiesRequired > 1 ? "ies" : "y") + " and evolved into " + poke(evolvedId) + "!", safchan);
    };
    this.useMegaStone = function(src, commandData) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't use Mega Stones during a contest!", safchan);
            return;
        }

        if (player.balls.mega < 1) {
            safaribot.sendMessage(src, "You have no Mega Stones!", safchan);
            return;
        }

        var info = getInputPokemon(commandData.replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var num = info.num;
        if (!num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var id = info.id;
        if (player.pokemon.indexOf(id) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return;
        }

        var species = pokeInfo.species(num);
        if (!(species in megaEvolutions)) {
            safaribot.sendMessage(src, "This Pokémon cannot mega evolve!", safchan);
            return;
        }

        var possibleEvo = megaEvolutions[species];
        var evolveTo = possibleEvo[sys.rand(0, possibleEvo.length)];
        var evolvedId = shiny ? "" + evolveTo : evolveTo;

        player.balls.mega -= 1;

        this.evolvePokemon(src, info, evolvedId, "mega evolved into");
        player.megaTimers.push({
            id: evolvedId,
            expires: now() + 24 * 60 * 60 * 1000,
            to: id
        });
        safaribot.sendMessage(src, "You used a Mega Stone on " + info.name + " to evolve them into " + poke(evolvedId) + "! They will revert after 24 hours!", safchan);
    };
    this.evolvePokemon = function(src, info, evolution, verb) {
        var player = getAvatar(src);
        var id = info.id;
        var count = countRepeated(player.pokemon, id);
        if (id === player.starter && count <= 1) {
            player.starter = evolution;
        }
        var wasOnParty = player.party.indexOf(id) !== -1;

        player.pokemon.splice(player.pokemon.indexOf(id), 1, evolution);
        if (wasOnParty) {
            player.party.splice(player.party.indexOf(id), 1, evolution);
        }

        sys.sendAll("", safchan);
        safaribot.sendHtmlAll(pokeInfo.icon(info.num) + " -> " + pokeInfo.icon(parseInt(evolution, 10)), safchan);
        safaribot.sendAll(sys.name(src) + "'s " + info.name + " " + verb + " " + poke(evolution) + "!", safchan);
        sys.sendAll("", safchan);
        this.saveGame(player);
    };
    this.releasePokemon = function(src, data) {
        var verb = "release";
        if (!canLosePokemon(src, data, verb)) {
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To release a Pokémon, use /release [name]:confirm!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "There's already a Pokemon out there!", safchan);
            return true;
        }
        if (releaseCooldown > 0) {
            safaribot.sendMessage(src, "Please spend the next  " + releaseCooldown + " seconds saying good bye to your Pokémon before releasing it!", safchan);
            return;
        }
        var player = getAvatar(src);
        var input = data.split(":");
        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var num = info.num;
        var id = info.id;

        if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
            safaribot.sendMessage(src, "You can release your " + info.name + " by typing /release " + info.input + ":confirm.", safchan);
            return;
        }

        safaribot.sendAll(sys.name(src) + " released their " + info.name + "!", safchan);
        this.removePokemon(src, id);
        player.records.pokesReleased += 1;
        this.saveGame(player);
        releaseCooldown = releaseCooldownLength;
        safari.createWild(num, shiny);
    };
    this.revertMega = function(src) {
        var player = getAvatar(src);
        if (!player) {
            return;
        }
        var currentTime = now(), info;
        for (var e = player.megaTimers.length - 1; e >= 0; e--) {
            info = player.megaTimers[e];
            if (info.expires <= currentTime) {
                if (player.pokemon.indexOf(info.id) !== -1) {
                    this.evolvePokemon(src, getInputPokemon(info.id + (typeof info.id == "string" ? "*" : 0)), info.to, "reverted to");
                }
                player.megaTimers.splice(e, 1);
            }
        }
    };
    this.findItem = function(src) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var currentTime = now();
        if (player.cooldowns.itemfinder > currentTime) {
            safaribot.sendMessage(src, "Your Itemfinder needs to cool down otherwise it will overheat! Try again in " + timeLeft(player.cooldowns.itemfinder) + " seconds.", safchan);
            return;
        }
        var dailyCharges = player.balls.itemfinder,
            permCharges = player.balls.permfinder,
            totalCharges = dailyCharges + permCharges;
        if (totalCharges < 1) {
            safaribot.sendMessage(src, "You have no charges left for your Itemfinder!", safchan);
            return;
        }

        if (dailyCharges > 0 ) {
            player.balls.itemfinder -= 1;
            dailyCharges -= 1;
        } else {
            player.balls.permfinder -= 1;
            permCharges -= 1;
        }
        totalCharges -= 1;
        
        var reward = randomSample(finderItems);
        var amount = 1;

        var giveReward = true;
        var showMsg = true;
        switch (reward) {
            case "rare":
                safaribot.sendHtmlAll("<b>Beep. Beep. BEEP! " + sys.name(src) + " found a " + finishName(reward) + " behind a bush!</b>", safchan);
            break;
            case "recharge":
                reward = "permfinder";
                amount = 3;
                showMsg = false;
                safaribot.sendHtmlAll("<b>Pi-ka-CHUUU!</b> " + sys.name(src) + " was shocked by a Wild Pikachu while looking for items! On the bright side, " + sys.name(src) + "'s Itemfinder slightly recharged due to the shock.", safchan);
                safaribot.sendMessage(src, "Your Itemfinder gained " + amount + " charges [Remaining charges: " + (totalCharges + amount) + " (Daily " + dailyCharges + " plus " + Math.min(permCharges + amount, itemCap) + " bonus)].", safchan);
            break;
            case "crown":
                safaribot.sendHtmlAll("<b>BEEP! BEEPBEEP! Boop!?</b> " + sys.name(src) + "'s Itemfinder locates an old treasure chest full of ancient relics. Upon picking them up, they crumble into dust except for a single Relic Crown.", safchan);
            break;
            case "honey":
                safaribot.sendHtmlAll("<b>BEE! BEE! BEE!</b> " + sys.name(src) + " stumbled upon a beehive while using their Itemfinder. Before running off to avoid the swarm, " + sys.name(src) + " managed to steal a glob of Honey!", safchan);
            break;
            case "spy":
                safaribot.sendMessage(src, "Bep. Your Itemfinder is pointing towards a shadowy area. Within the darkness, you find a suspicious " + finishName(reward) + "!", safchan);
            break;
            case "gacha":
                safaribot.sendMessage(src, "Beeeep. You're led to a nearby garbage can by your Itemfinder. You decide to dig around anyway and find an unused " + finishName(reward) + "!", safchan);
            break;
            case "rock":
                safaribot.sendMessage(src, "Beep. Your Itemfinder pointed you towards a very conspicuous rock.", safchan);
            break;
            case "bait":
                safaribot.sendMessage(src, "Beep-Beep. Your Itemfinder pointed you towards a berry bush! You decided to pick one and put it in your bag.", safchan);
            break;
            case "pearl":
            case "stardust":
                safaribot.sendMessage(src, "Beep Beep Beep. You dig around a sandy area and unbury a " + finishName(reward) + "!", safchan);
            break;
            case "luxury":
                safaribot.sendMessage(src, "Be-Beep. You comb a patch of grass that your Itemfinder pointed you towards and found a " + finishName(reward) + "!", safchan);
            break;
            default:
                safaribot.sendMessage(src, "You pull out your Itemfinder ... ... ... But it did not detect anything. [Remaining charges: " + totalCharges + (permCharges > 0 ? " (Daily " + dailyCharges + " plus " + permCharges + " bonus)" : "") + "].", safchan);
                giveReward = false;
                showMsg = false;
            break;
        }
        if (showMsg) {
            safaribot.sendMessage(src, "You found a " + finishName(reward) + " with your Itemfinder! [Remaining charges: " + totalCharges + (permCharges > 0 ? " (Daily " + dailyCharges + " plus " + permCharges + " bonus)" : "") + "].", safchan);
        }
        if (giveReward) {
            player.records.itemsFound += 1;
            rewardCapCheck(src, reward, amount);
        }

        player.cooldowns.itemfinder = currentTime + itemData.itemfinder.cooldown;
        this.saveGame(player);
    };
    this.useItem = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var item = itemAlias(data, true);
        if (!(item in itemData)) {
            safaribot.sendMessage(src,  item + " is not a valid item!", safchan);
            return false;
        }
        
        if (itemData[item].type !== "consumable") {
            safaribot.sendMessage(src, item + " is not a usable item!", safchan);
        }
        
        if (player.balls[item] < 1) {
            safaribot.sendMessage(src, "You have no " + finishName(item) + "!", safchan);
            return;
        }
        
        if (item === "gem") {
            var chars = player.balls.itemfinder,
                gemdata = itemData.gem.charges,
                pchars = player.balls.permfinder + gemdata,
                tchars = chars + pchars;

            safaribot.sendHtmlMessage(src, "The Ampere Gem begins to emit a soft baaing sound. Your Itemfinder then lights up and responds with a loud <b>BAA~!</b>", safchan);
            safaribot.sendMessage(src, "Your Itemfinder gained " + gemdata + " charges. [Remaining Charges: " + tchars + " (Daily " + chars + " plus " + pchars + " bonus)].", safchan);
            rewardCapCheck(src, "permfinder", gemdata);
            player.balls.gem -= 1;
            return;
        }
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
        out += this.showBag(player, src);

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
        sys.sendHtmlMessage(src, this.showBag(player, src), safchan);
    };
    this.viewBox = function(src, data) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }
        var isAndroid = (sys.os(src) === "android");
        sys.sendHtmlMessage(src, this.showBox(player, (data === "*" ? 1 : data), isAndroid), safchan);
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
        if (currentPokemon) {
            safaribot.sendMessage(src, "You can't modify your party while a wild Pokémon is out!", safchan);
            return;
        }

        var input = data.split(":"), action, targetId;
        if (input.length < 2) {
            input = data.split(" ");
            if (input.length < 2) {
                safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
                return;
            }
            action = input[0];
            targetId = input.slice(1).join(" ");
        } else {
            action = input[0].toLowerCase();
            targetId = input[1].toLowerCase();
        }

        var info = getInputPokemon(targetId);
        if (!info.num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var id = info.id;

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
            safaribot.sendMessage(src, "You added " + info.name + " to your party!", safchan);
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
            safaribot.sendMessage(src, "You removed " + info.name + " from your party!", safchan);
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
            safaribot.sendMessage(src, "You are now using " + info.name + " as your active Pokémon!", safchan);
            this.saveGame(player);
        } else {
            safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
        }
    };
    this.showParty = function(id, ownParty) {
        var isAndroid = (sys.os(id) === "android");
        var player = getAvatar(id),
            party = player.party.map(pokeInfo.sprite);
        var out = "<table border = 1 cellpadding = 3><tr><th colspan=" + party.length + ">" + (ownParty ? "Current" : sys.name(id) + "'s" ) + " Party</th></tr><tr>";
        if (isAndroid) {
            out += "<br />";
        }
        for (var e in party) {
            out += "<td>" + party[e] + "</td>";
        }
        out += "</tr><tr>";
        for (var e in player.party) {
            var member = getPokemonInfo(player.party[e]);
            var name = sys.pokemon(member[0]) + (member[1] === true ? "*" : "");
            out += "<td align=center>#" + pokeInfo.readableNum(member[0]) + " " + name;
            if (ownParty && sys.os(id) !== "android") {
                out += "<p>"; //puts a little too much space between lines
                var active = "<a href='po:send//party active:" + name + "'>Active</a>";
                var remove = "<a href='po:send//party remove:" + name + "'>Remove</a>";
                out += "[" + active + " / " + remove + "]";
            }
            out += "</td>";
        }
        out += "</tr></table>";
        if (isAndroid) {
            out += "<br />";
        }
        return out;
    };
    this.showBox = function(player, num, isAndroid) {
        var out = "";
        var perPage = 96, maxPages,
            list = player.pokemon,
            page = parseInt(num, 10);

        if (!isNaN(page) && num != "all") {
            maxPages = Math.floor(list.length / (perPage)) + (list.length % perPage === 0 ? 0 : 1);
            
            if (page > maxPages) {
                page = maxPages;
            }
            list = list.slice(perPage * (page - 1), perPage * (page - 1) + perPage);
        }

        out += this.listPokemon(list, "Owned Pokémon (" + player.pokemon.length + ")");
        if (isAndroid) {
            out += "<br />";
        }

        if (!isNaN(page)) {
            if (page > 1) {
                out += "[<a href='po:send//box " + (page - 1) + "'>" + utilities.html_escape("< Box " + (page - 1)) + "</a>]";
            }
            if (page < maxPages) {
                if (page > 1) {
                    out += " ";
                }
                out += "[<a href='po:send//box " + (page + 1) + "'>" + utilities.html_escape("Box " + (page + 1) + " >") + "</a>]";
            }
        }
        return out;
    };
    this.listPokemon = function(list, title) {
        var out = "", normal = [], count = 0, rowSize = 12, e;
        for (e in list) {
            normal.push(pokeInfo.icon(list[e], true));
        }
        out += "<table border = 1 cellpadding = 3><tr><th>" + title + "</th></td></tr><tr><td>";
        for (e in normal) {
            count++;
            out += normal[e] + " ";
            if (count == rowSize) {
                out += "<p>";
                count = 0;
            }
        }
        out += "</td></tr></table>";
        return out;
    };
    this.showBag = function(player, src) {
        //Manual arrays because easier to put in desired order. Max of 11 in each array or you need to change the colspan. Line1 only gets 9 due to money taking up a slot
        var line1 = ["bait", "rock", "gacha", "stick", "itemfinder", "gem", "rare", "mega"];
        var line2 = ["safari", "great", "ultra", "master", "myth", "luxury", "quick", "heavy", "spy", "clone", "premier"];
        var line3 = ["amulet", "soothe",  "scarf", "battery", "crown", "honey", "pearl", "stardust", "bigpearl", "starpiece", "nugget", "bignugget"];

        var out = "";
        out += bagRow(player, line1, src, true);
        out += bagRow(player, line2, src);
        out += bagRow(player, line3, src);
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
            safaribot.sendMessage(src, "Define a parameter (Name, Number, BST, Type, Shiny or Duplicate) and a value to find Pokémon in your box. Examples: ", safchan);
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

        crit = info[0].toLowerCase();
        val = info.length > 1 ? info[1].toLowerCase() : "asc";

        if (info.length >= 2) {
            switch (crit) {
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
                case "shiny":
                    crit = "shiny";
                break;
                case "duplicate":
                case "duplicates":
                case "repeated":
                    crit = "duplicate";
                    break;
                default:
                    crit = "abc";
            }
        } else if (crit !== "shiny") {
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
            title = "Pokémon with " + val + " in their name";
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
        else if (crit == "shiny") {
            player.pokemon.forEach(function(x){
                if (typeof x === "string") {
                    list.push(x);
                }
            });
            title = "Shiny Pokémon";
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
        sys.sendHtmlMessage(src, this.listPokemon(list, title + " (" + list.length + ")"), safchan);
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
            case "shiny":
                crit = "shiny";
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
            player.pokemon.sort(function(a, b){return pokeInfo.species(a)-pokeInfo.species(b);});
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
        else if (crit === "shiny") {
            player.pokemon.sort(function(a, b){
                if (typeof a === "string" && typeof b !== "string") {
                    return -1;
                } else if (typeof a !== "string" && typeof b === "string") {
                    return 1;
                } else {
                    return 0;
                }
            });
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by Shiny Pokémon (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
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
            var moneyGained = 250 + 25 * logins;
            if (moneyGained > 1000) {
                moneyGained = 1000;
            }
            gained.push("$" + moneyGained);
            player.money += moneyGained;
            if (player.money > moneyCap) {
                player.money = moneyCap;
            }

            var safariGained = logins;
            if (safariGained > 30) {
                safariGained = 30;
            }
            player.balls.safari += safariGained;
            if (player.balls.safari > itemCap) {
                player.balls.safari = itemCap;
            }
            gained.push(safariGained + "x Safari Ball" + (safariGained > 1 ? "s" : ""));

            var milestone = logins % 30;
            var milestoneRewards = {
                "30": { reward: "master", amount: 1 },
                "27": { reward: "gacha", amount: 20 },
                "24": { reward: "rare", amount: 1 },
                "21": { reward: "clone", amount: 3 },
                "18": { reward: "luxury", amount: 3 },
                "15": { reward: "gacha", amount: 10 },
                "12": { reward: "bait", amount: 10 },
                "9": { reward: "ultra", amount: 3, repeatAmount: 10},
                "6": { reward: "great", amount: 4, repeatAmount: 15},
                "3": { reward: "rock", amount: 5, repeatAmount: 20}
            };

            if (milestone in milestoneRewards) {
                var reward = milestoneRewards[milestone];
                var item = reward.reward;
                var amount = logins > 30 && "repeatAmount" in reward? reward.repeatAmount : reward.amount;

                player.balls[item] += amount;
                if (player.balls[item] > itemCap) {
                    player.balls[item] = itemCap;
                }
                gained.push(amount + "x " + finishName(item) + (amount > 1 ? "s" : ""));
            }
            if (logins > player.records.consecutiveLogins) {
                player.records.consecutiveLogins = logins;
            }

            var perkBonus = Math.min(itemData.battery.bonusRate * player.balls.battery, itemData.battery.maxRate);
            var recharges = 30 + perkBonus;
            player.balls.itemfinder = recharges;

            safaribot.sendMessage(src, "You received the following rewards for joining Safari today: " + gained.join(", "), safchan);
            safaribot.sendMessage(src, "Your Itemfinder has been recharged to " + recharges + " charges!", safchan);
            this.saveGame(player);
        }
    };
    this.showRecords = function (src) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
            return;
        }

        var rec = player.records;

        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "*** Player Records ***", safchan);
        safaribot.sendMessage(src, "Pokémon-- Caught: " + rec.pokesCaught + ". Released: " + rec.pokesReleased + ". Evolved: " + rec.pokesEvolved + ". Cloned: " + rec.pokesCloned + ".", safchan);
        safaribot.sendMessage(src, "Earnings-- Sold Pokémon: $" + rec.pokeSoldEarnings + ". Luxury Balls: $" + rec.luxuryEarnings + ". Pawned Items: $" + rec.pawnEarnings + ".", safchan);
        safaribot.sendMessage(src, "Gachapon-- Used: " + rec.gachasUsed + ". Jackpots Won: " + rec.jackpotsWon + ". Master Balls Won: " + rec.masterballsWon + ". Items stolen by Pokémon: " + rec.capsulesLost + ". Rewards Discarded: " + rec.itemsDiscarded + ".", safchan);
        safaribot.sendMessage(src, "Rocks-- Thrown: " + rec.rocksThrown + ". Hit: " + rec.rocksHit + ". Missed: " + rec.rocksMissed + ". Bounced: " + rec.rocksBounced + ". Hit By: " + rec.rocksHitBy + ". Dodged: " + rec.rocksDodged + ".", safchan);
        safaribot.sendMessage(src, "Bait-- Used: " + rec.baitUsed + ". Attracted Pokémon: " + rec.baitAttracted + ". No Interest: " + rec.baitNothing + ".", safchan);
        safaribot.sendMessage(src, "Misc-- Contests Won: " + rec.contestsWon + ". Consecutive Logins: " + rec.consecutiveLogins + ". Failed Catches: " + rec.pokesNotCaught + ". Items Found: " + rec.itemsFound + ".", safchan);
        sys.sendMessage(src, "", safchan);
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
        var num = getInputPokemon(data).num;
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
                great: 5,
                ultra: 1,
                master: 0,
                myth: 0,
                heavy: 0,
                quick: 0,
                luxury: 0,
                bait: 10,
                rock: 0,
                stick: 0,
                premier: 0,
                spy: 0,
                clone: 0,
                gacha: 0,
                rare: 0,
                mega: 0,
                amulet: 0,
                honey: 0,
                soothe: 0,
                crown: 0,
                scarf: 0,
                battery: 0,
                itemfinder: 15,
                permfinder: 0,
                pearl: 0,
                stardust: 0,
                starpiece: 0,
                bigpearl: 0,
                nugget: 0,
                bignugget: 0,
                gem: 0
            },
            records: {
                gachasUsed: 0,
                masterballsWon: 0,
                jackpotsWon: 0,
                capsulesLost: 0,
                itemsDiscarded: 0,
                contestsWon: 0,
                pokesCaught: 0,
                pokesNotCaught: 0,
                pokesReleased: 0,
                pokesCloned: 0,
                pokesEvolved: 0,
                pokeSoldEarnings: 0,
                luxuryEarnings: 0,
                pawnEarnings: 0,
                rocksThrown: 0,
                rocksHit: 0,
                rocksMissed: 0,
                rocksBounced: 0,
                rocksDodged: 0,
                rocksHitBy: 0,
                baitUsed: 0,
                baitAttracted: 0,
                baitNothing: 0,
                itemsFound: 0,
                consecutiveLogins: 0
            },
            megaTimers: [],
            starter: num,
            lastLogin: getDay(now()),
            consecutiveLogins: 1,
            cooldowns: {
                ball: 0,
                ballUse: 0,
                rock: 0,
                gacha: 0,
                itemfinder: 0,
                stick: 0
            }
        };
        SESSION.users(src).safari = player;
        this.saveGame(player);
        safaribot.sendMessage(src, "You received a " + poke(num) + ", 30 Safari Balls, 10 Baits, 5 Great Balls, and 1 Ultra Ball!", safchan);
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
            this.revertMega(src);
        }
    };
    this.updateLeaderboards = function() {
        leaderboards = {};

        var player, data, e, i;
        for (e in leaderboardTypes) {
            leaderboards[e] = [];
        }
        for (e in rawPlayers.hash) {
            data = JSON.parse(rawPlayers.hash[e]);
            for (i in leaderboardTypes) {
                player = {
                    name: e,
                    value: 0
                };
                switch (i) {
                    case "totalPokes":
                        player.value = data.pokemon.length;
                    break;
                    case "bst":
                        player.value = add(data.pokemon.map(getBST));
                    break;
                    case "money":
                        player.value = data.money;
                    break;
                    default:
                        player.value = "records" in data ? (data.records[i] || 0 ): 0;
                    break;
                }
                leaderboards[i].push(player);
            }
        }
        var byHigherValue = function(a, b) {
            return b.value - a.value;
        };
        for (e in leaderboards) {
            leaderboards[e].sort(byHigherValue);
        }
        lastLeaderboardUpdate = new Date().toUTCString();
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
                if (typeof player.balls[clean] !== "number") {
                    player.balls[clean] = parseInt(player.balls[clean], 10);
                }
                if (player.balls[clean] === undefined || isNaN(player.balls[clean]) || player.balls[clean] === null || player.balls[clean] < 0) {
                    player.balls[clean] = 0;
                }
                if (player.balls[clean] > 999) {
                    player.balls[clean] = 999;
                }
                if ((clean === "master" || clean === "stick") && player.balls[clean] > 1) {
                    player.balls[clean] = 1;
                }
                if (retiredItems.indexOf(clean) !== -1) {
                    delete player.balls[clean];
                }
            }
            if (typeof player.money !== "number") {
                player.money = parseInt(player.money, 10);
            }
            if (player.money === undefined || isNaN(player.money) || player.money < 0) {
                player.money = 0;
            } else if (player.money > moneyCap) {
                player.money = moneyCap;
            }
            if (player.money % 1 !== 0) {
                player.money = Math.floor(player.money);
            }

            if (player.records === undefined) {
                player.records = {};
            }
            var recstr = ["gachasUsed", "masterballsWon", "jackpotsWon", "contestsWon", "pokesCaught", "pokesNotCaught", "pokesReleased", "pokesEvolved", "pokesCloned", "pokeSoldEarnings", "luxuryEarnings", "pawnEarnings", "rocksThrown", "rocksHit", "rocksMissed", "rocksBounced", "rocksDodged", "rocksHitBy", "baitUsed", "baitAttracted", "baitNothing", "itemsFound", "consecutiveLogins", "capsulesLost", "itemsDiscarded"], rec;
            for (var j = 0; j < recstr.length; j++) {
                rec = recstr[j];
                if (player.records[rec] === undefined || isNaN(player.records[rec]) || player.records[rec] < 0 || typeof player.records[rec] !== "number") {
                    player.records[rec] = 0;
                }
            }
            if (!("megaTimers" in player)) {
                player.megaTimers = [];
            }
            if (!("cooldowns" in player)) {
                player.cooldowns = {
                    ball: 0,
                    ballUse: 0,
                    rock: 0,
                    gacha: 0,
                    stick: 0
                };
                if (player.cooldown) {
                    delete player.cooldown;
                }
                if (player.gachaCooldown) {
                    delete player.gachaCooldown;
                }
                if (player.rockCooldown) {
                    delete player.rockCooldown;
                }
                if (player.stickCooldown) {
                    delete player.stickCooldown;
                }
                if (player.masterCooldown) {
                    delete player.masterCooldown;
                }
            }

            this.saveGame(player);
        }
    };
    this.sanitizePokemon = function(player) {
        if (player) {
            var e, id, list = player.pokemon;
            for (e = list.length - 1; e >= 0; e--) {
                id = player.pokemon[e];
                if (!pokeInfo.valid(id)) {
                    list.splice(e, 1);
                }
            }
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
            "±Contest: A contest starts every " + contestCooldownLength/60 + " minutes. During that time, wild Pokémon may suddenly appear.",
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
            "*** Items ***",
            "Pokédollars: Used to purchase items from the shop.",
            "Bait: Tasty Bluk Berries used to attract wild Pokémon, set down with /bait. Has a " + itemData.bait.successRate*100 + "% success rate with an approximate " + itemData.bait.successCD + " second cooldown on success, and an approximate " + itemData.bait.failCD + " second cooldown on failure.",
            "Rock: A small rock that can be thrown to stun another player for a short period with /rock. Has a 10 second cooldown.",
            "Gachapon Ticket: Used to play the Gachapon Machine with /gacha, and win random prizes. Has a " + itemData.gacha.cooldown/1000 + " second cooldown.",
            "Rare Candy: Used to evolve Pokémon. Requires 2 Rare Candies to evolve into a final form Pokémon. ",
            "Valuables: The items Pearl, Stardust, Big Pearl, Star Piece, Nugget and Big Nugget can be pawned off with /pawn for money.",
            "Itemfinder: An experimental machine that can help find rare items! By default, it can only hold " + itemData.itemfinder.charges + " charges. These charges are reset every day.",
            "Ampere Gem: An electrically charged gem created by a famous Ampharos in Olivine City. It is said to be able to recharge the Itemfinder, giving it " + itemData.gem.charges + " more uses for the day!",
            "",
            "*** Perks ***",
            "Amulet Coin: When holding this charm, a bonus yield of about " + itemData.amulet.bonusRate * 100 + "% can be made when selling Pokémon to the NPC (Max Rate: " + itemData.amulet.maxRate * 100 + "%).",
            "Honey: Sweet-smelling Combee Honey that, when applied to bait, increases the chance of a Pokémon being attracted by " + itemData.honey.bonusRate * 100 + "% (Max Rate: " + itemData.honey.maxRate * 100 + "%).",
            "Soothe Bell: A bell with a comforting chime that calms the owner and their Pokémon. Reduces delay after a successful catch by " + itemData.soothe.bonusRate * 100 + "% (Max Rate: " + itemData.soothe.maxRate * 100 + "%).",
            "Relic Crown: A rare crown with mysterious properties that brings good fortune to its owner. Increases rate of pawned items by " + itemData.crown.bonusRate * 100 + "% (Max Rate: " + itemData.crown.maxRate * 100 + "%).",
            "Silk Scarf: A fashionable scarf made of the finest silk. Wearing it allows you to lead a more luxurious life and grants you " + itemData.scarf.bonusRate * 100 + "% more money from Luxury Balls (Max Rate: " + itemData.scarf.maxRate * 100 + "%).",
            "Cell Battery: A high-capacity battery that can increase the uses of Item Finder by " + itemData.battery.bonusRate + ". (Max Rate: " + itemData.battery.maxRate + ").",
            "Stick: Legendary Stick of the almighty Farfetch'd that provides a neverending wave of prods and pokes unto your enemies and other nefarious evil-doers, with a simple use of the /stick command.",
            "",
            "*** Standard Poké Balls ***",
            "Safari Ball: Standard issue Poké Ball used to catch Pokémon. Has a cooldown of " + itemData.safari.cooldown / 1000 +" seconds.",
            "Great Ball: A Poké Ball that has a slightly increased catch rate. Has a cooldown of " + itemData.great.cooldown / 1000 +" seconds.",
            "Ultra Ball: A high functioning Poké Ball that has a better catch rate than a Great Ball. Has a cooldown of " + itemData.ultra.cooldown / 1000 +" seconds.",
            "Master Ball: An extremely rare Poké Ball that never fails to catch. Has a cooldown of " + itemData.master.cooldown / 1000 +" seconds.",
            "",
            "*** Special Poké Balls ***",
            "Myth Ball: An alternate colored Poké Ball that works better on really rare Pokémon. Has a cooldown of " + itemData.myth.cooldown / 1000 +" seconds.",
            "Luxury Ball: A comfortable Poké Ball with an increased catch rate that is said to make one wealthy. Has a cooldown of " + itemData.luxury.cooldown / 1000 +" seconds.",
            "Heavy Ball: An industrial Poké Ball that works better against hardier and stronger Pokémon. Has a cooldown of " + itemData.heavy.cooldown / 1000 +" seconds.",
            "Quick Ball: A somewhat different Poké Ball that tends to get better priority during throws. Has a cooldown of " + itemData.quick.cooldown / 1000 +" seconds.",
            "Premier Ball: A plain Poké Ball gifted to you for your patronage. It works better when a Normal-type Pokémon is active. Has a cooldown of " + itemData.premier.cooldown / 1000 +" seconds.",
            "Spy Ball: A stealthy Poké Ball that cannot be tracked. Has a cooldown of " + itemData.spy.cooldown / 1000 +" seconds.",
            "Clone Ball: A mysterious Poké Ball with a very low catch rate that can duplicate a pokémon's D.N.A.. Has a cooldown of " + itemData.clone.cooldown / 1000 +" seconds.",
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
            "/catch [ball]: To throw a Safari Ball when a wild Pokémon appears. [ball] can be replaced with the name of any other ball you possess.",
            "/sell: To sell one of your Pokémon*.",
            "/trade: To request a Pokémon trade with another player*. Use $200 to trade money and @luxury to trade items (use 3@luxury to trade more than 1 of that item).",
            "/release: Used to release a Pokémon that can be caught by other players*. Pokémon can only be released every 3 minutes.",
            "/buy: To buy items.",
            "/pawn: To sell items.",
            "/party: To add or remove a Pokémon from your party, or to set your party's leader*.",
            "/box [number]: To view all your caught Pokémon organized in boxes.",
            "/bag: To view all money and items.",
            "/view: To view another player's party. If no player is specified, all of your data will show up.",
            "/changealt: To pass your Safari data to another alt.",
            "/bait: To throw bait in the attempt to lure a Wild Pokémon. Specify a ball type to throw that first.",
            "/rarecandy: Use a Rare Candy to evolve a Pokémon*.",
            "/gacha: Use a ticket to win a prize!",
            "/finder: Use your item finder to look for items.",
            "/rock: To throw a rock at another player.",
            "/stick: To poke another player with your stick.",
            "/use: To use a consumable item.",
            "/find [criteria] [value]: To find Pokémon that you have that fit that criteria. Type /find for more details.",
            "/sort [criteria] [ascending|descending]: To sort the order in which the Pokémon are listed on /mydata. Criteria are Alphabetical, Number, BST, Type and Duplicate.",
            "/info: View time until next contest and current Gachapon jackpot prize!",
            "/leaderboard [type]: View the Safari Leaderboards. [type] can be pokemon, money, contest, bst, sold, luxury, gacha, logins or caught.",
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
            "/wild: Spawns a random wild Pokemon with no restrictions. Use a valid dex number for a specific spawn*.",
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
        if (SESSION.channels(safchan).muteall && !SESSION.channels(safchan).isChannelOperator(src) && sys.auth(src) === 0) {
            safaribot.sendMessage(src, "You can't play Safari while the channel is silenced.", safchan);
            return true;
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
        if (command === "catch" || command === "throw") {
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
        if (command === "pawn") {
            safari.sellItems(src, commandData);
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
        if (command === "stick") {
            safari.useStick(src, commandData);
            return true;
        }
        if (command === "gacha") {
            safari.gachapon(src, commandData);
            return true;
        }
        if (command === "rare" || command === "rarecandy" ) {
            safari.useRareCandy(src, commandData);
            return true;
        }
        if (command === "mega" || command === "megastone" ) {
            safari.useMegaStone(src, commandData);
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
        if (command === "leaderboard" || command == "lb") {
            var rec = commandData.toLowerCase(), e;

            var lbKeys = Object.keys(leaderboardTypes);
            var lowCaseKeys = lbKeys.map(function(x) { return x.toLowerCase(); });
            if (lowCaseKeys.indexOf(rec) !== -1) {
                rec = lbKeys[lowCaseKeys.indexOf(rec)];
            } else {
                var found = false;
                for (e in leaderboardTypes) {
                    if (leaderboardTypes[e].alts.indexOf(rec) !== -1) {
                        rec = e;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    rec = "totalPokes";
                }
            }

            var cut = 10;
            var list = leaderboards[rec].slice(0, cut);
            var out = ["", "<b>Safari Leaderboards " + leaderboardTypes[rec].desc + "</b>" + (lastLeaderboardUpdate ? " (last updated: " + lastLeaderboardUpdate + ")" : "")], selfFound = false;
            for (e = 0; e < list.length; e++) {
                out.push("<b>" + (e + 1) + ".</b> " + list[e].name + ": " + list[e].value);
                if (list[e].name == sys.name(src).toLowerCase()) {
                    selfFound = true;
                }
            }
            if (!selfFound) {
                list = leaderboards[rec];
                for (e = 0; e < list.length; e++) {
                    if (list[e].name == sys.name(src).toLowerCase()) {
                        out.push("<b>" + (e + 1) + ".</b> " + list[e].name + ": " + list[e].value);
                        selfFound = true;
                        break;
                    }
                }
                if (!selfFound) {
                    out.push("You are not ranked in this leaderboard!");
                }
            }
            out.push("");
            sys.sendHtmlMessage(src, out.join("<br/>"),safchan);

            return true;
        }
        if (command === "safarirules") {
            script.beforeChatMessage(src, "/crules", safchan);
            return true;
        }
        if (command === "info") {
            if (contestCount > 0) {
                var min = Math.floor(contestCount/60);
                var sec = contestCount%60;
                safaribot.sendMessage(src, "Current Contest's theme: " + (currentTheme ? contestThemes[currentTheme].name : "Default") + ".", safchan);
                safaribot.sendMessage(src, "Time until the Contest ends: " + min + " minutes, " + sec + " seconds.", safchan);
            } else {
                var min = Math.floor(contestCooldown/60);
                var sec = contestCooldown%60;
                safaribot.sendMessage(src, "Time until next Contest: " + min + " minutes, " + sec + " seconds.", safchan);
                if (nextTheme) {
                    safaribot.sendMessage(src, "Next Contest's theme: " + (nextTheme !== "none" ? contestThemes[nextTheme].name : "Default") + ".", safchan);
                }
            }
            safaribot.sendMessage(src, "Current Gachapon Jackpot: " + Math.floor(gachaJackpot/10) + ".", safchan);
            return true;
        }
        if (command === "release") {
            safari.releasePokemon(src, commandData);
            return true;
        }
        if (command === "records") {
            safari.showRecords(src);
            return true;
        }
        if (command === "itemfinder" || command === "finder") {
            safari.findItem(src);
            return true;
        }
        if (command === "use") {
            safari.useItem(src, commandData);
            return true;
        }

        //Staff Commands
        if (!SESSION.channels(safchan).isChannelOperator(src)) {
            return false;
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
                safari.sanitizePokemon(player);
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
                safari.sanitize(player);
                safari.sanitizePokemon(player);
            }
            safaribot.sendAll("All safaris have been sanitized!", safchan);
            return true;
        }

        if (!SESSION.channels(safchan).isChannelAdmin(src)) {
            return false;
        }
        if (command === "checkrate") {
            commandData = commandData.toLowerCase();
            if (allItems.indexOf(commandData) !== -1 || commandData === "wild" || commandData === "horde" || commandData === "nothing" || commandData === "recharge") {
                var total = 0, percent;
                var instance = gachaItems[commandData] || 0;
                if (instance < 1) {
                    safaribot.sendMessage(src, "Gachpon: This item is not available from Gachapon.", safchan);
                } else {
                    for (var e in gachaItems) {
                        total += gachaItems[e];
                    }
                    percent = instance / total * 100;
                    safaribot.sendMessage(src, "Gachpon: The rate of " + finishName(commandData) + " is " + instance + "/" + total + ", or " + percent.toFixed(2) + "%.", safchan);
                }

                total = 0;
                instance = finderItems[commandData] || 0;
                if (instance < 1) {
                    safaribot.sendMessage(src, "Itemfinder: This item is not available from Itemfinder.", safchan);
                } else {
                    for (var e in finderItems) {
                        total += finderItems[e];
                    }
                    percent = instance / total * 100;
                    safaribot.sendMessage(src, "Itemfinder: The rate of " + finishName(commandData) + " is " + instance + "/" + total + ", or " + percent.toFixed(2) + "%.", safchan);
                }
            } else {
                safaribot.sendMessage(src, "No such item!", safchan);
            }
            return true;
        }
        if (command === "wild" || command == "wilds" || command === "horde" || command === "wildevent") {
            if (currentPokemon) {
                safaribot.sendMessage(src, "There's already a Wild Pokemon out there silly!", safchan);
                return true;
            }
            var info = getInputPokemon(commandData), num = info.num, makeShiny = info.shiny, amount = 1;
            if (command === "wilds") {
                makeShiny = true;
            }
            if (command === "horde") {
                amount = 3; //Android might look crowded if more than 3
            }
            if (command === "wildevent") {
                wildEvent = true;
            }
            safari.createWild(num, makeShiny, amount);
            return true;
        }
        if (command === "contest" || command === "contestsoft") {
            if (command == "contestsoft") {
                contestBroadcast = false;
            }
            if (contestCount > 0) {
                contestCount = 1;
            } else {
                safari.startContest(commandData);
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
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var moneyGained = parseInt(cmd[1], 10);
            if (isNaN(moneyGained)) {
                safaribot.sendMessage(src, "Invalid amount!", safchan);
                return true;
            }
            player.money += moneyGained;
            this.sanitize(player);
            this.saveGame(player);
            safaribot.sendAll(target + " has been awarded with $" + moneyGained + " by " + sys.name(src) + "!", safchan);
            return true;
        }
        if (command === "safarigift") {
            var cmd = commandData.split(":");
            if (cmd.length < 2) {
                safaribot.sendMessage(src, "Invalid format! Use /safarigift Player:Item:Amount.", safchan);
                return true;
            }
            var target = cmd[0];
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var item = cmd[1].toLowerCase();
            var itemQty = cmd.length > 2 ? parseInt(cmd[2], 10) : 1;
            if (isNaN(itemQty)) {
                itemQty = 1;
            }

            if (allItems.indexOf(item) === -1) {
                safaribot.sendMessage(src, "No such item!", safchan);
                return true;
            }
            player.balls[item] += itemQty;
            this.sanitize(player);
            this.saveGame(player);
            safaribot.sendAll(target + " has been awarded with " + itemQty + " " + finishName(item) + " by " + sys.name(src) + "!", safchan);
            return true;
        }
        if (command === "findsaves") {
            safaribot.sendMessage(src, "List of all saves by name: " + Object.keys(rawPlayers.hash).sort().join(", "), safchan);
            return true;
        }
        if (command === "scare" || command === "glare") {
            if (currentPokemon) {
                safaribot.sendMessage(src, "You glared at the Wild Pokémon until they ran away!", safchan);
                if (command === "scare") {
                    safaribot.sendAll(sys.name(src) + " scared " + (currentPokemonCount > 1 ? "all " : "") + "the " + poke(currentPokemon) + " away!", safchan);
                }
                currentPokemon = null;
                currentPokemonCount = 1;
                wildEvent = false;
            }
            return true;
        }

        if (!SESSION.channels(safchan).isChannelOwner(src)) {
            return false;
        }
        //Needs some validation, but good for testing right now
        if (command === "bestow") {
            var cmd = commandData.split(":");
            if (cmd.length < 2) {
                safaribot.sendMessage(src, "Invalid format! Use /bestow Player:Pokémon.", safchan);
                return true;
            }
            var target = cmd[0];
            var playerId = sys.id(target);
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var info = getInputPokemon(cmd[1]);
            if (!info.num) {
                safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
                return true;
            }
            safaribot.sendMessage(src, "You gave a " + info.name + " to " + target + "!", safchan);
            if (playerId) {
                safaribot.sendMessage(playerId, "You received a " + info.name + "!", safchan);
            }
            player.pokemon.push(info.id);
            this.saveGame(player);
            return true;
        }
        if (command === "analyze") {
            var info = commandData.split(":");
            var target = sys.id(info[0]);
            var player = getAvatarOff(info[0]);
            if (!player) {
                safaribot.sendMessage(src, "This person doesn't have a Safari save!", safchan);
                return true;
            }
            var prop = (info.length < 2) ? [] : info[1].split(".");
            var attr = player[prop[0]];
            var propName = ["safari"];
            if (prop.length == 1 && prop[0] === "") {
                attr = player;
            } else {
                if (!attr) {
                    attr = player;
                }
                propName.push(prop[0]);
                for (var e = 1; e < prop.length; e++) {
                    propName.push(prop[e]);
                    if (prop[e] in attr) {
                        attr = attr[prop[e]];
                    } else {
                        safaribot.sendMessage(src, "This player does not have a '" + propName.join(".") + "' property!", safchan);
                        return true;
                    }
                }
            }

            safaribot.sendMessage(src, (target ? sys.name(target) : player.id) + "." + propName.join(".") + ": " + JSON.stringify(attr), safchan);
            return true;
        }
        if (command === "wipesafariall") {
            var info = commandData.toLowerCase().split(":");
            if (info[0] !== "confirm") {
                safaribot.sendMessage(src, "This will wipe all Safari's save data. If you wish to proceed, type /wipesafariall confirm.", safchan);
                return true;
            }
            if (info.length < 2 || info[1] !== "really") {
                safaribot.sendMessage(src, "Are you absolutely sure you want to delete all saves? This cannot be undone! To confirm, type /wipesafariall confirm:really.", safchan);
                return true;
            }

            var onChannel = sys.playersOfChannel(safchan);
            for (var e in onChannel) {
                if (sys.isInChannel(onChannel[e], safchan) && getAvatar(onChannel[e])) {
                    SESSION.users(onChannel[e]).safari = null;
                }
            }
            rawPlayers.clear();
            safaribot.sendAll("Safari has been completely reset!", safchan);
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
        this.updateLeaderboards();
    };
    this.afterChannelJoin = function (src, channel) {
        if (channel == safchan) {
            this.loadGame(src);
        }
        return false;
    };
    this.beforeChannelLeave = function (src, channel) {
        if (channel == safchan && getAvatar(src)) {
            this.saveGame(getAvatar(src));
        }
        return false;
    };
    this.afterChangeTeam = function (src) {
        if (sys.isInChannel(src, safchan)) {
            var player = getAvatar(src);
            if (player) {
                if (sys.name(src).toLowerCase() !== player.id) {
                    this.saveGame(player);

                    SESSION.users(src).safari = null;
                    this.loadGame(src);
                }
            } else {
                this.loadGame(src);
            }
        }
        return false;
    };
    this.stepEvent = function () {
        contestCooldown--;
        baitCooldown--;
        releaseCooldown--;
        lastBaitersDecay--;
        if (preparationPhase > 0) {
            preparationPhase--;
            if (preparationPhase <= 0) {
                var name, i;
                var list = Object.keys(preparationThrows);
                for (i in preparationThrows) {
                    if (preparationThrows[i] == "quick") {
                        list.push(i);
                        list.push(i);
                    }
                }
                var throwers = shuffle(list), alreadyThrow = [];
                if (preparationFirst) {
                    if (throwers.indexOf(preparationFirst) !== -1) {
                        throwers.splice(throwers.indexOf(preparationFirst), 1);
                        throwers.splice(0, 0, preparationFirst);
                    }
                }
                for (i = 0; i < throwers.length; i++) {
                    name = throwers[i];
                    if (sys.isInChannel(sys.id(name), safchan) && alreadyThrow.indexOf(name) === -1) {
                        alreadyThrow.push(name);
                        safari.throwBall(sys.id(name), preparationThrows[name]);
                    }
                }
                preparationFirst = null;
            }
        }
        if (contestCooldown === 180) {
            var themeList = Object.keys(contestThemes);
            nextTheme = Math.random() < 0.5 ? "none" : themeList[sys.rand(0, themeList.length)];
            sys.sendAll("*** ************************************************************ ***", safchan);
            safaribot.sendAll("A new " + (nextTheme !== "none" ? contestThemes[nextTheme].name + "-themed" : "") + " Safari contest will start in 3 minutes! Prepare your active Pokémon and all Poké Balls you need!", safchan);
            sys.sendAll("*** ************************************************************ ***", safchan);

            sys.sendAll("*** ************************************************************ ***", 0);
            safaribot.sendAll("A new " + (nextTheme !== "none" ? contestThemes[nextTheme].name + "-themed" : "") + " Safari contest will start in 3 minutes at #" + defaultChannel + "! Prepare your active Pokémon and all Poké Balls you need!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
        }
        if (contestCooldown === 0) {
            safari.startContest("*");
        }
        if (lastBaitersDecay === 0) {
            lastBaiters.shift();
            lastBaitersDecay = lastBaitersDecayTime;
        }
        SESSION.global().safariContestCooldown = contestCooldown;
        SESSION.global().safariBaitCooldown = baitCooldown;
        SESSION.global().safariReleaseCooldown = releaseCooldown;

        if (contestCount > 0) {
            contestCount--;
            if (contestCount === 0) {
                // var winner = modeArray(contestCatchers);
                var winners = [], maxCaught = 0, maxBST = 0;
                for (var e in contestCatchers) {
                    if (contestCatchers[e].length >= maxCaught) {
                        if (contestCatchers[e].length > maxCaught) {
                            winners = [];
                            maxCaught = contestCatchers[e].length;
                        }
                        winners.push(e);
                    }
                }
                var tieBreaker = [], bst, name, top = winners.length, catchersBST = {}, allContestants = [];

                for (e in contestCatchers) {
                    catchersBST[e] = add(contestCatchers[e].map(getBST));
                    allContestants.push(e + " (Caught " + contestCatchers[e].length + ", BST " + catchersBST[e] + ")");
                }
                if (top > 1) {
                    maxBST = 0;
                    for (e in winners) {
                        name = winners[e];
                        bst = catchersBST[name];

                        if (bst >= maxBST) {
                            if (bst > maxBST) {
                                tieBreaker = [];
                                maxBST = bst;
                            }
                            tieBreaker.push(winners[e]);
                        }
                    }
                    winners = tieBreaker;
                }

                sys.sendAll("*** ************************************************************ ***", safchan);
                safaribot.sendAll("The Safari contest is now over! Please come back during the next contest!", safchan);
                if (Object.keys(contestCatchers).length === 1) {
                    safaribot.sendAll("No prizes have been given because there was only one contestant!", safchan);
                    winners = [];
                } else if (winners.length > 0) {
                    safaribot.sendAll(readable(winners, "and") + " caught the most Pokémon (" + maxCaught + (top > 1 ? ", total BST: " + maxBST : "") + ") during the contest and has won a prize pack!", safchan);
                }
                if (allContestants.length > 0) {
                    safaribot.sendAll(allContestants.join(", "), safchan);
                }
                contestCatchers = [];
                sys.sendAll("*** ************************************************************ ***", safchan);
                currentPokemon = null;
                currentTheme = null;
                wildEvent = false;
                if (winners.length > 0) {
                    for (e in winners) {
                        var winner = winners[e];
                        var playerId = sys.id(winner);
                        if (playerId) {
                            var player = getAvatar(playerId);
                            if (player) {
                                player.balls.gacha += 10;
                                player.records.contestsWon += 1;
                                safari.saveGame(player);
                                safaribot.sendMessage(playerId, "You received 10 Gachapon Tickets for winning the contest!", safchan);
                            }
                        }
                    }
                }
                //Check daily rewards after a contest so players won't need to relog to get their reward when date changes
                var onChannel = sys.playersOfChannel(safchan),
                    today = getDay(now());
                for (e in onChannel) {
                    safari.dailyReward(onChannel[e], today);
                    safari.revertMega(onChannel[e]);
                }
                safari.updateLeaderboards();
                rawPlayers.save();
            } else {
                if (!currentPokemon && Math.random() < 0.084793) {
                    safari.createWild();
                }
            }
        }
    };
}
module.exports = new Safari();