/*jshint laxbreak:true,shadow:true,undef:true,evil:true,trailing:true,proto:true,withstmt:true,-W030*/
/*global sys, module, SESSION, script, safaribot, require, updateModule, staffchannel, sachannel, pokedex */

var MemoryHash = require("memoryhash.js").MemoryHash;
var utilities = require('utilities.js');
var html_escape = utilities.html_escape;
var Bot = require('bot.js').Bot;

function Safari() {
    /* Variables */ {
    var safari = this;
    var safariUpdating = false;
    var needsUpdating = false;
    var safchan;
    var defaultChannel = "Safari";
    var safaribot = new Bot("Tauros");
    var tutorbot = new Bot("Kangaskhan");
    var closedMessage = "<font color='#3daa68'><timestamp/><b>±PA:</b></font> <b>Ding-dong! The Safari Game is over! Please return to the front counter while an update is applied!</b>";
    var openedMessage = "<font color='#3daa68'><timestamp/><b>±Attendant:</b></font> <b>Welcome to the Safari Zone! You can catch all the Pokémon you want in the park! We'll call you on the PA when you run out of time or an update is needed!</b>";
    var separator = "*** *********************************************************** ***";

    var saveFiles = "scriptdata/safarisaves.txt";
    var deletedSaveFiles = "scriptdata/safari/deletedsafarisaves.txt";
    var themesFile = "scriptdata/safari/themes.txt";
    var decorationsFile = "scriptdata/safari/decorations.txt";
    var tradeLog = "scriptdata/safaritrades.txt";
    var rareTradeLog = "scriptdata/safari/raretrades.txt";
    var shopLog = "scriptdata/safarishoplog.txt";
    var auctionLog = "scriptdata/safariauctions.txt";
    var altLog = "scriptdata/safarialtlog.txt";
    var lostLog = "scriptdata/safaricommands.txt";
    var mythLog = "scriptdata/safari/mythlog.txt";
    var eventLog = "scriptdata/safari/eventlog.txt";
    var giftLog = "scriptdata/safari/giftlog.txt";
    var miscLog = "scriptdata/safari/misclog.txt";
    var tradebansFile = "scriptdata/safaribans.txt";
    var saltbansFile = "scriptdata/safarisalt.txt";
    var permFile = "scriptdata/safariobjects.txt";
    var configFile = "scriptdata/safari/config.txt";
    var rafflePlayersFile = "scriptdata/safari/raffleplayers.txt";
    var idnumFile = "scriptdata/safari/idnum.txt";

    var permObj;
    var configObj;
    var tradeBans;
    var saltBans;
    var rawPlayers;
    var cookedPlayers;
    var rafflePlayers;
    var npcShop;
    var idnumList;
    var lastIdAssigned;
    var rafflePrizeObj = null;

    var starters = [1, 4, 7];
    var playerTemplate = {
        id: "",
        casedName: "",
        nameColor: "",
        idnum: 0,
        pokemon: [],
        party: [],
        money: 0,
        costume: "none",
        tutorial: {
            inTutorial: false,
            step: 0,
            privateWildPokemon: null,
            viewedContestRules: false,
            viewedRules: false
        },
        favoriteBall: "safari",
        balls: {
            safari: 0,
            great: 0,
            ultra: 0,
            master: 0,
            myth: 0,
            heavy: 0,
            quick: 0,
            luxury: 0,
            mono: 0,
            bait: 0,
            golden: 0,
            rock: 0,
            stick: 0,
            premier: 0,
            spy: 0,
            clone: 0,
            gacha: 0,
            rare: 0,
            dust: 0,
            mega: 0,
            spray: 0,
            amulet: 0,
            honey: 0,
            eviolite: 0,
            soothe: 0,
            crown: 0,
            scarf: 0,
            battery: 0,
            itemfinder: 0,
            permfinder: 0,
            pearl: 0,
            stardust: 0,
            starpiece: 0,
            bigpearl: 0,
            nugget: 0,
            bignugget: 0,
            gem: 0,
            box: 4,
            salt: 0,
            entry: 0,
            silver: 0,
            pack: 0,
            fragment: 0,
            egg: 0,
            bright: 0,
            philosopher: 0,
            materia: 0,
            water: 0,
            cherry: 0,
            blkapricorn: 0,
            whtapricorn: 0,
            coupon: 0,
            burn: 0
        },
        decorations: {},
        records: {
            gachasUsed: 0,
            masterballsWon: 0,
            jackpotsWon: 0,
            contestsWon: 0,
            pokesCaught: 0,
            pokesNotCaught: 0,
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
            rocksWalletHit: 0,
            rocksWalletHitBy: 0,
            rocksCaught: 0,
            rocksDodgedWindow: 0,
            rocksMissedWindow: 0,
            rocksWalletEarned: 0,
            rocksWalletLost: 0,
            rocksWindowEarned: 0,
            rocksWindowLost: 0,
            rocksItemfinderHit: 0,
            rocksChargesGained: 0,
            rocksChargesLost: 0,
            baitUsed: 0,
            goldenBaitUsed: 0,
            goldenBaitWeak: 0,
            baitAttracted: 0,
            baitNothing: 0,
            itemsFound: 0,
            collectorEarnings: 0,
            collectorGiven: 0,
            scientistEarnings: 0,
            scientistGiven: 0,
            arenaWon: 0,
            arenaLost: 0,
            arenaPoints:0,
            towerHighest: 0,
            consecutiveLogins: 0,
            gemsUsed: 0,
            megaEvolutions: 0,
            devolutions: 0,
            devolutionDust: 0,
            wonderTrades: 0,
            factionMVPs: 0,
            factionWins: 0,
            pokeRaceWins: 0,
            pokeRaceEarnings: 0,
            underdogRaceWins: 0,
            favoriteRaceWins: 0,
            factoryFirst: 0,
            factorySecond: 0,
            factoryThird: 0,
            quizFirst: 0,
            quizSecond: 0,
            quizThird: 0,
            topQuizScore: 0,
            packsOpened: 0,
            pokesStolen: 0,
            notBaitedCaught: 0,
            pokeRaceSilver: 0,
            //fullyPlayedContests: 0,
            pyramidLeaderScore: 0,
            pyramidHelperScore: 0,
            pyramidLeaderClears: 0,
            pyramidHelperClears: 0,
            pyramidTotalScore: 0,
            pyramidMoney: 0,
            pyramidSilver: 0,
            eggsHatched: 0,
            brightEggsHatched: 0,
            rareHatched: 0,
            transmutations: 0,
            transmutationsMade: 0,
            burnReceived: 0,
            burnGiven: 0
        },
        hideLB: [],
        removedFromLB: false,
        secretBase: [],
        secretBaseCache: [],
        costumes: [],
        savedParties: [],
        ninjaParty: [],
        megaTimers: [],
        starter: null,
        starter2: [],
        lastLogin: null,
        consecutiveLogins: 1,
        lastViewedRules : 0,
        visible: true,
        flashme: false,
        altlog: [],
        tradeban: 0,
        truesalt: 0,
        trackers: [],
        auctionWarns: 0,
        auctionWarnCooldown: 0,
        cooldowns: {
            ball: 0,
            bait: 0,
            rock: 0,
            gacha: 0,
            itemfinder: 0,
            stick: 0,
            costume: 0,
            auction: 0,
            shopEdit: 0,
            lastBaits: [],
            nubTaunt: 0,
            baseView: 0,
            unown: 0,
            burn: 0
        },
        shop: {},
        quests: {
            collector: {
                requests: [],
                reward: 0,
                cooldown: 0,
                deadline: null
            },
            scientist: {
                cooldown: 0,
                pokemon: 0
            },
            arena: {
                cooldown: 0
            },
            tower: {
                cooldown: 0,
                bonusPower: 0
            },
            wonder: {
                cooldown: 0
            },
            pyramid: {
                cooldown: 0,
                bonusStamina: 0
            },
            alchemist: {
                cooldown: 0
            },
            decor: {
                cooldown: 0
            }
        },
        nextSpawn: {
            pokemon: {},
            amt: 1,
            appearAs: {}
        },
        pendingMessages: []
    };

    /* Item Variables */
    var itemCap = 999;
    var moneyCap = 9999999;
    var editableItemProps = {
        fullName: "string", icon: "number", price: ["number", "array"], aliases: "array",
        ballBonus: "number", bonusRate: "number", maxRate: "number", maxBonus: "number", cooldown: "number", bstBonus: "number", minBstBonus: "number", shinyBonus: "number",
        successRate: "number", bounceRate: "number", successCD: "number", failCD: "number", targetCD: "number", bounceCD: "number", throwCD: "number", duration: "number",
        charges: "number", minVar: "number", maxVar: "number", tradeReq: "number", threshold: "number", legendaryChance: "number", shinyChance: "number",
        tradable: "boolean", cap: "number"
    };
    var itemData = {
        //Balls
        safari: {name: "safari", fullName: "Safari Ball", type: "ball", icon: 309, price: 30, ballBonus: 1, cooldown: 6000, aliases:["safariball", "safari", "safari ball"], tradable: false},
        great: {name: "great", fullName: "Great Ball", type: "ball", icon: 306, price: 75, ballBonus: 1.5, cooldown: 9000, aliases:["greatball", "great", "great ball"], tradable: false},
        ultra: {name: "ultra", fullName: "Ultra Ball", type: "ball", icon: 307, price: 180, ballBonus: 2, cooldown: 12000, aliases:["ultraball", "ultra", "ultra ball"], tradable: false},
        master: {name: "master", fullName: "Master Ball", type: "ball", icon: 308, price: 10000, ballBonus: 255, cooldown: 90000, aliases:["masterball", "master", "master ball"], tradable: true, cap: 1},

        myth: {name: "myth", fullName: "Myth Ball", type: "ball", icon: 329, price: 500, ballBonus: 1, bonusRate: 2.5, cooldown: 9000, aliases:["mythball", "myth", "myth ball"], tradable: true},
        heavy: {name: "heavy", fullName: "Heavy Ball", type: "ball", icon: 315, price: 500, ballBonus: 1, bonusRate: 0.5, maxBonus: 3, cooldown: 12000, aliases:["heavyball", "heavy", "heavy ball"], tradable: true},
        quick: {name: "quick", fullName: "Quick Ball", type: "ball", icon: 326, price: 500, ballBonus: 1.1, cooldown: 12000, aliases:["quickball", "quick", "quick ball"], tradable: true},
        luxury: {name: "luxury", fullName: "Luxury Ball", type: "ball", icon: 324, price: 500, ballBonus: 1.25, cooldown: 10000, aliases:["luxuryball", "luxury", "luxury ball"], tradable: true},
        premier: {name: "premier", fullName: "Premier Ball", type: "ball", icon: 318, price: 500, ballBonus: 1.5, bonusRate: 3, cooldown: 10000, aliases:["premierball", "premier", "premier ball"], tradable: false},
        spy: {name: "spy", fullName: "Spy Ball", type: "ball", icon: 328, price: 500, ballBonus: 1.25, bonusRate: 1.25, cooldown: 9000, aliases:["spyball", "spy", "spy ball"], tradable: true},
        clone: {name: "clone", fullName: "Clone Ball", type: "ball", icon: 327, price: 500, ballBonus: 1, bonusRate: 0.05, cooldown: 11000, aliases:["cloneball", "clone", "clone ball"], tradable: true},
        mono: {name: "mono", fullName: "Mono Ball", type: "ball", icon: 327, price: 321, ballBonus: 1, bonusRate: 2, cooldown: 10000, aliases:["monoball", "mono", "mono ball"], tradable: true},

        //Other Items
        //Seasonal change. Rock icon is 206, Snowball is 334
        rock: {name: "rock", fullName: "Rock", type: "valuables", icon: 206, price: 50, successRate: 0.65, bounceRate: 0.1, targetCD: 7000, bounceCD: 11000, throwCD: 15000,  aliases:["rock", "rocks", "snow", "snowball", "snowballs"], tradable: true},
        bait: {name: "bait", fullName: "Bait", type: "items", icon: 8017, price: 129, successRate: 0.4, failCD: 13, successCD: 70, aliases:["bait"], tradable: false},
        golden: {name: "golden", fullName: "Golden Bait", type: "items", icon: 8016, price: 750, successRate: 0.75, failCD: 20, successCD: 30, minBstBonus: 10, bstBonus: 8, shinyBonus: 0, aliases:["goldenbait", "golden bait", "golden"], tradable: false},
        gacha: {name: "gacha", fullName: "Gachapon Ticket", type: "items", icon: 132, price: 218, cooldown: 9000, aliases:["gacha", "gachapon", "gachapon ticket", "gachaponticket"], tradable: false},
        spray: {name: "spray", fullName: "Devolution Spray", type: "items", icon: 137, price: 5000, aliases:["spray", "devolution", "devolution spray", "devolutionspray"], tradable: true},
        mega: {name: "mega", fullName: "Mega Stone", type: "items", icon: 2001, price: 10000, aliases:["mega", "mega stone", "megastone"], duration: 3, tradable: true},
        stick: {name: "stick", fullName: "Stick", type: "items", icon: 164, price: 99999, cooldown: 20000, aliases:["stick","sticks"], tradable: false, cap: 1},
        itemfinder: {name: "itemfinder", fullName: "Itemfinder Charge", type: "items", icon: 69, price: 50, cooldown: 9000, charges: 30, aliases:["itemfinder", "finder", "item finder"], tradable: false},
        permfinder: {name: "permfinder", fullName: "Itemfinder Bonus Charges", type: "items", icon: 0, price: 50, aliases:["permfinder"], tradable: false},
        dust: {name: "dust", fullName: "Candy Dust", type: "items", icon: 24, price: 100, aliases:["dust", "candydust", "candy dust"], tradable: false, cap: 1999},
        salt: {name: "salt", fullName: "Salt", type: "items", icon: 127, price: 1000, aliases: ["salt", "nacl"], tradable: false},
        burn: {name: "burn", fullName: "Burn Heal", type: "items", icon: 54, price: 5000, cooldown: 3600000, aliases: ["burn", "burnheal", "burn heal"], tradable: false},
        
        silver: {name: "silver", fullName: "Silver Coin", type: "items", icon: 273, price: 300, aliases: ["silver", "silver coin", "silvercoin"], tradable: false},
        entry: {name: "entry", fullName: "Raffle Entry", type: "items", icon: 333, price: 300, aliases: ["entry", "raffle", "raffleentry", "raffle entry"], tradable: false},
        coupon: {name: "coupon", fullName: "Decor Coupon", type: "items", icon: 132, price: 15000, aliases: ["coupon", "decor coupon", "decorcoupon", "decoupon"], tradable: false},

        //Consumables (for useItem)
        rare: {name: "rare", fullName: "Rare Candy", type: "consumable", icon: 117, price: 5000, charges: 230, minVar: 0, maxVar: 30, aliases:["rare", "rarecandy", "rare candy", "candy"], tradable: true},
        gem: {name: "gem", fullName: "Ampere Gem", type: "consumable", icon: 245, price: 1000, charges: 20, aliases:["gem", "ampere", "ampere gem", "amperegem"], tradable: true},
        pack: {name: "pack", fullName: "Prize Pack", type: "consumable", icon: 59, price: 5000, aliases:["prize", "pack", "prizepack", "prize pack"], tradable: true},
        egg: {name: "egg", fullName: "Egg", type: "consumable", icon: 94, price: 5000, aliases:["egg"], tradable: true},
        bright: {name: "bright", fullName: "Bright Egg", type: "consumable", icon: 94, price: 50000, shinyChance: 32, legendaryChance: 128, aliases:["bright", "bright egg", "brightegg"], tradable: true},
        water: {name: "water", fullName: "Fresh Water", type: "consumable", icon: 73, price: 3000, bonusRate: 0.1, aliases:["fresh", "fresh water", "water"], tradable: true},
        cherry: {name: "cherry", fullName: "Cherry Delight", type: "consumable", icon: 341, price: 5000, bonusRate: 10, aliases: ["cherry", "delight", "cherry delight", "cherrydelight"], tradable: true},
        
        //Alchemy related items
        materia: {name: "materia", fullName: "Prima Materia", type: "alchemy", icon: 93, price: 2000, aliases: ["materia", "prima", "primamateria", "prima materia"], threshold: 400, tradable: true},
        fragment: {name: "fragment", fullName: "Ball Fragment", type: "alchemy", icon: 120, price: 2000, aliases:["fragment", "ball fragment", "ballfragment"], threshold: 5, tradable: true},
        blkapricorn: {name: "blkapricorn", fullName: "Black Apricorn", type: "alchemy", icon: 59, price: 1000, aliases:["blackapricorn", "black apricorn", "blkapricorn"], tradable: true},
        whtapricorn: {name: "whtapricorn", fullName: "White Apricorn", type: "alchemy", icon: 133, price: 1000, aliases:["whiteapricorn", "white apricorn", "whtapricorn"], tradable: true},
        //philosopher: {name: "philosopher", fullName: "Philosopher's Stone", type: "alchemy", icon: 252, price: 10000, aliases: ["philosopher's stone", "philosopher'sstone", "philosophersstone", "philosopherstone", "philosophers stone", "philosopher stone", "philosopher", "stone", "philosopher's", "philosopher"], tradable: false},

        //Perks
        amulet: {name: "amulet", fullName: "Amulet Coin", type: "perk", icon: 42, price: 5000, bonusRate: 0.03, maxRate: 0.3, aliases:["amulet", "amuletcoin", "amulet coin", "coin"], tradable: true, tradeReq: 10},
        honey: {name: "honey", fullName: "Honey", type: "perk", icon: 82, price: 1000, bonusRate: 0.03, maxRate: 0.3, aliases:["honey"], tradable: true},
        soothe: {name: "soothe", fullName: "Soothe Bell", type: "perk", icon: 35, price: 5000, bonusRate: 0.03, maxRate: 0.3, aliases:["soothe", "soothebell", "soothe bell", "bell"], tradable: true},
        crown: {name: "crown", fullName: "Relic Crown", type: "perk", icon: 278, price: 5000, bonusRate: 0.01, maxRate: 0.1, aliases:["crown", "reliccrown", "relic crown", "relic"], tradable: true, tradeReq: 10},
        scarf: {name: "scarf", fullName: "Silk Scarf", type: "perk", icon: 31, price: 5000, bonusRate: 0.03, maxRate: 0.3, aliases:["scarf", "silkscarf", "silk scarf", "silk"], tradable: true},
        battery: {name: "battery", fullName: "Cell Battery", type: "perk", icon: 241, price: 2000, bonusRate: 2, maxRate: 20, aliases:["battery", "cellbattery", "cell battery", "cell"], tradable: true},
        eviolite: {name: "eviolite", fullName: "Eviolite", type: "perk", icon: 233, price: 2000, bonusRate: 8, maxRate: 80, threshold: 420, aliases:["eviolite"], tradable: true},
        box: {name: "box", fullName: "Box", type: "perk", icon: 175, price: [0, 0, 0, 0, 100000, 200000, 400000, 600000, 800000, 1000000], bonusRate: 96, aliases:["box", "boxes"], tradable: false},

        //Valuables
        pearl: {name: "pearl", fullName: "Pearl", type: "valuables", icon: 111, price: 500, aliases:["pearl"], tradable: true},
        stardust: {name: "stardust", fullName: "Stardust", type: "valuables", icon: 135, price: 750, aliases:["stardust"], tradable: true},
        bigpearl: {name: "bigpearl", fullName: "Big Pearl", type: "valuables", icon: 46, price: 1500, aliases:["bigpearl", "big pearl"], tradable: true},
        starpiece: {name: "starpiece", fullName: "Star Piece", type: "valuables", icon: 134, price: 3000, aliases:["starpiece", "star piece"], tradable: true},
        nugget: {name: "nugget", fullName: "Nugget", type: "valuables", icon: 108, price: 4000, aliases:["nugget"], tradable: true},
        bignugget: {name: "bignugget", fullName: "Big Nugget", type: "valuables", icon: 269, price: 10000, aliases:["bignugget", "big nugget"], tradable: true}
    };
    var editableCostumeProps = {
        fullName: "string", icon: "number", aliases: "array", rate: "number", rate2: "number", bonusChance: "number",
        acqReq: "number", acqReq2: "number", record: "string", record2: "string", noAcq: "string",
        thresh1: "number", thresh2: "number", thresh3: "number", changeRate: "number", specialAcq: "boolean"
    };
    var costumeData = {
        preschooler: {icon: 401, name: "preschooler", fullName: "Preschooler", aliases: ["preschooler", "pre schooler"], acqReq: 1, record: "pokesCaught", rate: 1.30, thresh1: 25, thresh2: 50, thresh3: 90, changeRate: 0.1, effect: "A master in friendship. Strengthens the bond between a trainer and their Starter Pokémon to increase catch rate at the beginning of an adventure.", noAcq: "Catch your first Pokémon"},
        breeder: {icon: 379, name: "breeder", fullName: "PokeBreeder", aliases: ["pokébreeder", "breeder", "pokebreeder", "poke breeder", "pokemonbreeder", "pokemon breeder"], acqReq: 15, record: "pokesEvolved", rate: 0.9, effect: "A master in evolution. Taps into years of experience in order to reduce the needed Candy Dust for evolution.", noAcq: "Evolve {0} more Pokémon"},
        pokefan: {icon: 398, name: "pokefan", fullName: "PokeFan", aliases: ["pokéfan", "pokefan", "poke fan"], acqReq: 200, record: "collectorGiven", rate: 1.2, effect: "A master in Pokémon. Aficionados of Pokémon tend to stick together and help each other out, granting a bonus when finding Pokémon for the Collector's collection.", noAcq: "Turn in {0} more Pokémon to the Collector"},
        explorer: {icon: 373, name: "explorer", fullName: "Explorer", aliases: ["explorer"], acqReq: 500, record: "itemsFound", rate: 0.1, rate2: 0.5, effect: "A master in scavenging. Uses knowledge from past finds to slightly increase the likelihood of finding an item with Itemfinder. Rarely you can even find multiple items or exclusive items!", noAcq: "Find {0} more items"},
        chef: {icon: 423, name: "chef", fullName: "Chef", aliases: ["chef"], acqReq: 500, record: "baitNothing", rate: 12, effect: "A master in cooking. After years of throwing bait that even a Garbodor wouldn't eat, all it took was simply adding a dash seasoning and some ketchup help to make the bait more irresistable to Pokémon with type disadvantages.", noAcq: "Fail to attract {0} more Pokémon with Bait"},
        battle: {icon: 386, name: "battle", fullName: "Battle Girl", aliases: ["battle girl", "battle", "battlegirl"], acqReq: 100, record: "arenaPoints", rate: 20, effect: "A master in fighting. Through rigorous training, people and Pokémon can become stronger without limit. Utilizing powerful offense techniques, attacks deal more damage in NPC Battles.", noAcq: "Accumulate {0} more Arena Points"},
        scientist: {icon: 431, name: "scientist", fullName: "Scientist", aliases: ["scientist"], acqReq: 6, record: "pokesCloned", acqReq2: 50, record2: "scientistEarnings", rate: 0.02, bonusChance: 0.05, effect: "A master in genetics. Recent breakthroughs in science allows easier modification of DNA, granting an increases success rate of cloning, a small chance to clone muiltiple times in a single attempt, and the ability to clone very rare Pokémon!", noAcq: "Clone {0} more Pokémon and obtain {1} more Silver Coins from the Scientist Quest"},
        ninja: {icon: 434, name: "ninja", fullName: "Ninja Boy", aliases: ["ninja boy", "ninja", "ninjaboy"], acqReq: 10, specialAcq: true, rate: 0.1, thresh: 499, effect: "A master in ninjutsu. Able to lurk amongst the shadow and create diversions to sneak past a small number of Trainers in the Battle Tower.", noAcq: "Reach Floor 11 of Battle Tower using a team of Pokémon with &lt;500 BST"},
        rocket: {icon: 999, name: "rocket", fullName: "Rocket", aliases: ["rocket"], acqReq: 100, record: "notBaitedCaught", acqReq2: 150000, record2: "pokeSoldEarnings", rate: 0.05, rate2: 0.03, effect: "A master in deception. Years of trickery have granted a small chance to keep a Pokémon given to NPCs!", noAcq: "Catch {0} Pokémon attracted by other players and earn ${1} more from selling Pokémon"},

        //guitarist: {icon: 428, name: "guitarist", fullName: "Guitarist", aliases: ["guitarist"], acqReq: 30, record: "gemsUsed", rate: 5, effect: "A master in melody. ", noAcq: "Use {0} more Ampere Gems"},
        //fisherman: {icon: 359, name: "fisherman", fullName: "Fisherman", aliases: ["fisher", "fisherman", "fisher man"], acqReq: 0, record: 0, rate: 0.2, effect: "A master in angling. ", noAcq: "{0}"},
        //triathlete: {icon: 361, name: "triathlete", fullName: "Triathlete", aliases: ["triathlete"], acqReq: 50, record: fullyPlayedContests, rate: 0.01, thresh1: 5, thresh2: 8, thresh3: 13, effect: "A master in endurance. Even after playing in the Safari Zone all day, extensive training allows a quick and alert response when a wild Pokémon appears.", noAcq: "{0}"},
        
        inver: {icon: 387, name: "inver", fullName: "Inver", aliases: ["inver"], specialAcq: true, effect: "A master in type matchups. Possesses a mystical power that inverts type effectiveness, making super effective moves not very effective, and vice versa.", noAcq: "It is not currently known how"}
    };
    
    var defaultItemData;
    var defaultCostumeData;
    var base64icons = {
    itemfinder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAALHRFWHRDcmVhdGlvbiBUaW1lAEZyaSAyMSBOb3YgMjAxNCAyMDozMDo0NCAtMDAwMKEIypIAAAAHdElNRQfeCxUUHwrCV61vAAAACXBIWXMAAAsSAAALEgHS3X78AAAABGdBTUEAALGPC/xhBQAABExJREFUeNqFVutPHFUU/93ZpWyAamOMgIm2Pgrl0ZVHq9t+EAPtZiHWRGOaSFPoF+tnYrJGv+jXEhL/Ah8gaRPb2KSNFqqtSiOQxnYXpFUxatwEAbWBpkuz7GOuc+7OnblzZ0hPcrMze8+5v/M7rzuMr/UDMHCwb5EXiyZIrl9uYUABuWwOkZoIpPjf8+g+mnHsps4/wyLVoUD9sAS5du1jGMw632CIxU7w2YkmFqkho5JQ5Jw7RvRMdgSi2h2w7TjPg1n/qU4ZscQvfGrqI0tvD+5m5sHMEmZmP8UL8QXe2b1gnViBzY2iMJSyubGJA72/BtrtP7zANzcKUIWYGfLlbuZz7HiyFeuZBVgu4YuTjRjuq8e+nnkee3lRAEpRPdXt9H0ZifC2ijBM08TDO9uw/lcaO3Y+h2KphKOf/I5SyUTY2n/skUfR0T3Ppy82ODkIsqN3nYkENaYuPs0O9byFQqGA7U9EUTI5urrexA9fNrDZid1iZe+toa6uDgePEDNDePn9had8dlfffxfcBtNzyqjqCDn+xt88Xygn/rtzu6xCqPB49tLrGV4omLhxZS/LZe85h7x45A9hl88XhTMrKyuYvmBVX802j31YxpSYOeh24rkW88HBQew7NMZ//KbVUjBtZs8y0o8lfuahUEjRNz32YTWmVE2V1ZWe97KRIcDn5uaE1/sP3+JSp2Tlk/Zqa2uRTCYxNDQUYA8vkAriemaIUm5qahUHxuNxdHR0OKxHR0fF79LSEtLptB0Jcsz0VJ+TI/VPl5kLsrq6KkKxtvYfOHedGR4eAYWMAIkd5Wh5eRk3r7aI8PpyFMSMmrmlJSqMJcjMpT1MTotyMbwjioEAx8fHnYIAQpBAdL6hAhATV8p5kQklY6pGFYQ8pSKiFkgm38bAwAAMw0B7e7voO5qF7ml2ddGSTOiZ2DQ373VCVlkZtvbdvtD7RDawdK4866qdfUMy0WeZKsRm5lKjwyZIn5gFsSIutB/2T2WKaZVQ1sX1VNePYCuR5xuqZ/n7NN5D4to4dWpEeFVfX2+DhnxMdWYquFPW9r6vjyg3IyMfIpVKiZKluLe1taGzZ47fuNLsTAT9vpEA6dRNWFmi68kjYVk9upEEEcZ2I6pM/DdvlQBv+udrvPb8Q0QFr6aYiEQue79cDHqM6WA1BHo4dH0CocY+dmwAVX3v4YPr1Th5fh3HB0+IcRWp2e7vIypTOphyQx7Somcq71zWmyNiQkLh7u8/LkYTRYFyKnNDg7iz5yfu6yMq03Nnz4ghSV1OiybC9FeNztWh95EqFHIq8d7eXkxOTjrRCOyjy2ceZ78t3sadO/+K9e3ZXYyG5IOqTTSmxYZYSQBP1QXd8cRMV96qjyjcdIUQSDQaxdjYmBisiURCgFLYWfm7zvVUvSoe/F2X89y0uxuaRSuobE+f/kyEXQCpt+pWot+8QaHreuVP53NAyuxEedr/DwgKwzi3jMhsAAAAAElFTkSuQmCC",
    gacha: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAA3NCSVQICAjb4U/gAAAAG1BMVEX////4+Piw2OjgoNh4kKi4cMCISKhwSGAwMDAYBeQdAAAACXRSTlMA//////////83ApvUAAAACXBIWXMAAArwAAAK8AFCrDSYAAAAIHRFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyBNWLuRKiQAAAB0SURBVHicpYwxCoAwDEUzdhXxApncxRt4AZHGveLHWTyAiyXHtlWLHQX/9B68hOjHNGfeM35FwVwnnmRNopjFPZ3O1mK8RWHLVsBd6AwwFIVg4ySlwNUx8+ijLNe9F9tUcnPowreHyUypiTvkZfIZk8n4007iyyLPYqOktAAAAABJRU5ErkJggg==",
    myth: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAARhJREFUSEvNlT0OgzAMhTlGj8CYo3TsETp2ZOzI2JGRscfoyNiRsUdgzObqIb0qGOenqkAdLCCJ32eHOK5EpNrSNhVH4P8BcM6JZSVbm8yAotPzKJZxPgWKAuAcEw7Hx66es4tBTADF/asVWA6UgqwAC3HvxcMyEABikH0Bet+/2aJYFosMSn+s/skUt7ZpfwCiyJ0azoeR4/126VZHdpVBfR7mE0ERfNNiwhTHOl0TJiAUvZ8O4lsneBLOyBFxuDYLQDUigqa5fhwhTtNi4Td8rIo262AcprnA4KQz0BCswfq+f5QBmEUIgQiFMK4tJp7sB0gXjpYgxzCfEs82HF7HFNLPn67r8PrdrOGUdKzcmv/oybkoU/NvdoVkS0HgewQAAAAASUVORK5CYII=",
    box: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXZwQWcAAAAgAAAAIACH+pydAAAA5UlEQVRIx92VwQ2DMAxFMwLHHjtCRuHIGDly7AgdgREyAkdGYIxuEGQJV6ljOwZSVerhCxGF//wTYbsYo/um3M8B3vuEag4A09f6eOsMzGxOZYWJ5tPk0zz3rDld12DVyhEET3y3JGMBtWMBEMK4dEsc0nO884CaOVc5gkBorgJwA0g7c65ygFUBsBElwaRjCeF2DIDKP6SwvJDDCVDwIZcsDN0H+FICdp0AmiVY+o4FtEkA5rukBPRvLrqmmCAzlxKYW0UOKxIIdyA1PfMs0C5Z66jmwVEk2wGn2nXLKef+f+hf1QY4PRz+Bnq4AwAAAABJRU5ErkJggg==",
    entry: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAJcEhZcwAAD2AAAA9gAXp4RY0AAAJ4SURBVEhL7ZNdSFNhGMe96y7qou6jXSXM7Xy8mzbmsmIO23Duq02jSIlJC0zMjwKR1ILIzYQRCRUGEnoq6CJtQiCCYZQFod2sKKplQREFQRc7+/ec7c0RzsrwKvaD5+KMvf/zPM/7OyVF/h9MkjgmScIAf1w/zBQqCcJCst2D2Yjru1kwrM9LGBN9TBKRCO9Dpr8eOHMA6A3iXrMTJtHYw/+2NioEYTszGHYEqsoxENiDTF8IGIoAH1PI0t8A0G9KowMui6lVp9Nt4Ed/jyzLpUwUfW1O6+tOVyXUc43AzQvApQ5gYRZIPgGezQHnm4Cr3dkXjx6qhtvCjvOIwlgshi2yKPZQ6PRwgx2fuvdnO8TDBJBRgZlbwI1BINYMTCtANAxVieFRixvD9XvhqWRxHrUSzQqPzTQ5RTt+0eEFpq7luuyjfX/+QBMM0QTtQGKE1nQMaSWKpVN+dLmsCNt3KrJQ5meMbeRxeczmvBVvuvy0VwqcuAJ8+5rrWrvMeEtuEip18CjUswcRtJnhs5mey3JZablev5XH5clawciKMbLiIh3upVLT1PWD3PjazrXueXCGjElTnaQ7YaIRPGYljJEVHrLi9G5k3tHhRTcw76Qug8D7V8DcxLIdPyt5og7KYccX0nFRNuqreVRhmGQcn7nthKqFP6bgtm1A3SbgLV3oCO+W1/2IE9qdUPC4LBpbecSfcTnk+OT1GqiXGeDbDHipUjTBS9rxaIisqF22goLX/hFptx30mqJ3Y+T4nV10qVVI0wRLT33obLLiiL1idSv+Fu1wbY0c19aVToUQcJvhcbGsFfpCVvwrmv9Mlla3okiRXykp+QE8HqM/vT34MQAAAABJRU5ErkJggg==",
    egg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAB5QTFRF////MDAwPJxXbcSHhqtvt+O4v6pv38qP9+qw+Pj4/Tk5SAAAAAF0Uk5TAEDm2GYAAABuSURBVBjTY2AgFwgKItiMHTMF4BzhiJmNcAlji45gmBRjcESHMYwj0dHRYWyIxGmFchgzOjqCO9oh6hiTTTuM4Rwn44iOjjIoR0nJoqMsDWqckJJ6WYoiA4yTluYE4zCmATlwxwmmpQli9wKJAABtjxkjucRGhQAAAABJRU5ErkJggg==",
    bright: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAB5QTFRF/vPSMDAw4tGw+rV8+ZZE/dzA8uLB+q1t+/v7////3kFdYAAAAAp0Uk5T////////////ALLMLM8AAABySURBVBjTldChDYAwFATQQ4CmAVNHPgIL+WEAkgbdpBt0hg5RW9ltEfALAtNzT13ukD9BDZR6kRB1wWBjI0i8wmmBs2BBD4C3D9oHaQIcOn1j3sEFgS3gHxizwtONPJrTL0cWEAVBIqIgpVkRqf8JlR9c2wmHPYayHNYAAAAASUVORK5CYII=",
    pack: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAA3NCSVQICAjb4U/gAAAAJ1BMVEX////w8PDw6Ijo0FD4yDjgqDjAqFComEDYcDiIaDg4YABYUDgwMDDaxm2rAAAADXRSTlMA////////////////LQRBrQAAAAlwSFlzAAAK8AAACvABQqw0mAAAACB0RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgTVi7kSokAAAAw0lEQVR4nH3PMQrCQBAFUA8wjeQGAQ+gA2vEY0jA3kJQGxsXJZ2FE0iXIg7JEey0SLpAICmcQ5nd1ZRO9R87w/JHo38jUg8ZAirkh4YoZvmyKYk5vzu1y6oHxfYQcM9cElkILpkr9wJJqvIncmYgt1QhKh2ZrbpZnPqsC7MFM3+utY7sCfjhCs/8SgzaSbhGxNIh8OmKeHibvXZKQY+dtkcOF4ejpzaoLhGYj7rxGHGrHxbQeX0+C7iqkpn86y4y9B7mAwpHT1Z1wCFpAAAAAElFTkSuQmCC",
    fragment: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAJFBMVEUAAAAxMTGcakFKSmq9i1rerHu0rM32xZzu7v+Ui6zVze7///+kAd76AAAAAXRSTlMAQObYZgAAAAFiS0dECx/XxMAAAAAJb0ZGcwAAAAMAAAADAHeTl6MAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAHdElNRQfeCxISIDTCst7zAAAACXZwQWcAAAAeAAAAHgD4T+E9AAAAoUlEQVQY02NgwAcYBQURHCElJQRPWEnFBc5jNHJxCREUgHKSjUNDXAOhUmJpIi6hhVCOxCwTl3Aoh7FrhqGzMVSP2MrmiWaGMInM5pkzLCEyEm0rm6dlNkM5q8CciWBVWatmWKalzQBrYkzLAnPAmqAciCbGaSubZ07LnAnlZCI4DJIzm6elZUItYpScYTlzJsRokLcbBQUbBWDeEwAjVAAAUGwxQVWp15AAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTUtMDMtMDJUMTc6MTk6MzYtMDY6MDDWjJb5AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE0LTExLTE4VDE4OjMyOjUyLTA2OjAwZ+O8ygAAAABJRU5ErkJggg==",
    mono: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTE5NkM1NDcwMDM5MTFFNjhENTlFMkEzNzYxNTAxMUMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTE5NkM1NDYwMDM5MTFFNjhENTlFMkEzNzYxNTAxMUMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmRpZDpEQjE4NzA3RDM5MDBFNjExOTBGRUJBQkUxRDhCNTE0RiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEQjE4NzA3RDM5MDBFNjExOTBGRUJBQkUxRDhCNTE0RiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Puecb4wAAAAqUExURfj4+Hp6es3NzZqamlZWVqamptra2oKCgrq6uk1NTTAwMHt7e2ZmZgAAAAV/T5sAAAAOdFJOU/////////////////8ARcDcyAAAAJdJREFUeNqskkkSwyAMBAW20AL5/3cjhALYKZ+SPlHThcBj4PUA/CDU+RKq1ZkqhFINSHehlI8QHMaF1gzghpmp6SYOgMyDtkQ/N3/y2poPc8ExxWLL7yKwfAniS35OIWZEZMyhU5YwEFB63Nc6r5tEAEAGafuOAqnv8LigbpWYSak4qJcSsUSMeq8dnXvtzz/qD4/hLcAAPMwYmRr6Be0AAAAASUVORK5CYII=",
    blkapricorn: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9kKBwQSCrGq9k4AAAF6SURBVEjH7ZUhc4MwFMd/9CaYAwcSOZm6dg5Zu49RyzfY1WH7MbBI3A5H5GRl4qjEMdELayGBdpvcu+MueSH/f97/vbzAvy2YZ3MKIXoAKaV3PR+bWZ+zJxv4R74D4DWjT5OA9/0WgLIokeHOgAP0S0SeC1yfFABvR0mxFwBESXxDkqYpAFmWOUlWY0dZlJRFOczTJBjGhtSAmy/Pc6eMq7Gmh/oybhoJwH6X3JXMOI6tJJMcpEnAoT6TJgHr0VrTyEGeqqoGf1VVCCFQSs0nWQjRb6IzmwjW6+nJax3gh9wAj6MA+ut8rFwhG4mMHcsT/st2ViYhxHKZ1jpgE50HklpfkrwEfvc9+OyeQX/P2yAxof8NwUAy1Kb+FcEkB23bTn6yVYejdSz3IiFE7zpxFEXWaJRSaK1RSk1utFWitm0Jw3Di11qjtca15y6JpJRe13UPa911nbUfeTM13fu+b41kfHIX+CzB9TtgIzLAD7XrJaKfPDj/tmhf5K2wqRPvPAwAAAAASUVORK5CYII=",
    whtapricorn: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9kKBwQSFEulyy0AAAGDSURBVEjH7VUteMIwEH3lQyA7N9wqwR1yrpXMIdkUm8RVTyEBVzlQbG5VgCxqwzVqRXaK4jo5l6n0Y03Sdj+Sp3KX9L171y854IQSGKokEXEAYIwZx3EeYv9HICK+X475fjnmRMTdnp3Fi0GLCyxf3jgRcZ240gER8dWoDwBI3ncAgLsZw8MtAQCaFy0E/hzXs+gbSafT0bqp5ROBP0fgz7PYscxsLUTzCMNQ28ZavqdT1gAA7MItAKDvWJVaO/IWShHJgWOZmLIG2Me5RLILt1J7BK4u2yh1QESczANc+lRWrhItc1HTHRYtEngKYkyeg0IBlYu6qkoyD5mIqLqMXAdJwHY9bKbDLB5MHtG2mr++yXVV0na9bB0n6Z8EpH+wWfvSoShOKpGtXqPyt4iI+MhbKAms5pnSTRQniJMU98Mb6UYrW7RZ+7C7PSkfJyniJIXum0otYowZgeZwEYK1r3yPjKJX1en2lE7ylevICwWO54BKSBCXzYVKA+NfB84JeXwBn+m8UXJeocMAAAAASUVORK5CYII="
    };
    var base64costumes = {
    //TODO: Cleaner sprite
    rocket: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAABWCAMAAABiiJHFAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzAzQUIwNkRDOTVFMTFFNTlGMTZCRDZGRUJDNjRENjciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzAzQUIwNkVDOTVFMTFFNTlGMTZCRDZGRUJDNjRENjciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDMDNBQjA2QkM5NUUxMUU1OUYxNkJENkZFQkM2NEQ2NyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDMDNBQjA2Q0M5NUUxMUU1OUYxNkJENkZFQkM2NEQ2NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PnEdDvwAAABgUExURdZfRmh5e0JOTygtLqOtt/zm411sbTtFR+XUz3qGh4KVldfLyJinqmF5hVQ0LjM9P/He2m5DO7uwrZ5SRJqSj25+ga24usrAv42dn+p7ZlJfYL7G0bCloN7j7EVUVQAAAF8gpikAAAAgdFJOU/////////////////////////////////////////8AXFwb7QAABTJJREFUeNrsmOlyozoQRrVgCQG2AFvAaBz5/d9yuoVYxOIFz/1za76qVJxKcmhard7I4z8R+Yf9h/2/YjlzFuQYk/xvYbW2gvYSQlgn2V/AcimMUsZ4KBjsmHNS8++wXAuVKeAqOgpMdpzzL7DcqU5RYbJshkVZ/YL7DKtF1lH46sDgGCvYC+4TrKNZJihA11QhtX7qYPKEqoxQCF1SqbCIfcbdxUpqhFMeuqYyrZ9z97BSgAPB3hWT+tjVL7hknwoRS9eaUz/GWkql2ISCB0bqPncHK4x121A3g+rdMCM7PgDHvobum7uNZcLZLShbUvfM3cWKJdOumfvmbmO1syJmOrkJ/czah3RiEKbvHeanvoWMCHkVxZ4gP44E4PIVAKR5+HwwbtHeGRK+ZF/O5PiQI7dszgWH+GgzU+4azD+QGMObcmnnsSZmCYEfyrfOvyqjUcIZcuLRfGtzBaWQdhRDOKTHxeU9ghVlbs6uS5IOzyqkA8ms45oq64PhCFaldW1dkSSF+d0Y7pigKiuSQlHX/BSdEvyQb29lfbu5pAFzf34KZjqVoIqC6t8/8LROH6q8qmxVLdq8bZKfU8dN0hWem1DuH6CO9QkivYPyMs3b/CeTJgkqoMkpjmMfNTihzU+nU5nWN3NrUIDz39u2MQexolZ1Wp68yjJN8zxvQXme4ufaHm2W1O1e16dJJSrFJ4Fn6uOt3a02t/IUq0Qs2Hv7omO83UW9wNZ5iian9Lu2WSzMvdcpKjffYeV94YTWY2/fzg62XjoXVLNvsQ89HVsfCml6F99POjA/tJ6Zp21b3/M0V/L7AcoXCZWXJVwGuM1p2r409Q1sXx+1A17pL1jtvh/3oI7JUCpV7gPrzvjXWGxxXcByS7EPe1kcX2L7Mm41n5dwLVGvStl+VyPtMH7MGpwBC8Kx+tM+QQco1lpf2MdORM71EdY3HGaiwuw8ciOq/KBZ4kxbQ+mcio2j3KB+gOU2U8yaBbXvSFfktztGoHad6meniDr0unOxt9tmmPRBfiZbUQN6pv0YXmBxzIc5X7Bt6ATvj3KXG2M19VRsN91rsf2ONMZahUsJA43cMDu8g93gknjYh0k/M/S5B0bJ/dEkwjqjPqAupt9dbL+bCjHAXnvhySxFojXK7BbI7UOD0GVL126ASZxdfSp0m1h/zS4VSMs1dkiWAU2i1cQ8vcjFoV+q65X8QpGL7BPQHDu4eollcXqRen44VSD2InqFhVSKq81hPzZiuYjTy9xaVv2KVbEoXXorGc4tuOJBg0l8XiOVza2dsKS3+hqwfD7A4gpC+InQWTJe2yi54HFMIdZjybWqpL6MWB1P3JyF1YZVRUGGhIh5QE5UjofLIuwF6lf4WA3YwJW9uZ4rTDJgtYWwmsV/OA05ZMBLj4X/rrwT/PP11Pb0lc35nYktmiRg7RCwISKXtYsjrBojDHyAhz51af75+HJwbAJnFo+1wvplAVjAPDVeJ8ALXgn5NYbYVS/qLh+XJc4yitMQ6VsiSAYCOq0+E+jHFnbSlS+TC+fjsWibZR06gQuYZZumMxhTDNuCF1hyWecsrkesAZEHM0VRNE0BGdHbG14u5lbBzsrzr5eNZkn3ntD2DCLWZgUYm2TmfBbwi+GvY+zFG4lN2OQGvtEKw/8zjy2EzhK0FX+CSNCPfezojmqvtcPdk8c2irMiUMFcLaeGeelc/+qX67W6POsYufDYgnEHRcFjz3z648hcjs6t+Fs7MEhmArAUoiNQz7MMv/ZCxd/ZA3r9EWAAv0eboM/sqZQAAAAASUVORK5CYII="
    };
    var base64trainers = {
        collector: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAEXRFWHRTb2Z0d2FyZQBKVEwtRGV2J4CxQ84AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAtUExURQAAALi40AAAAEAwKEhQiFB4yHBQQHhAQJB4ULB4UMBIQNiYcNi4SOjo+PjQuDxaNFYAAAACdFJOUwAAdpPNOAAAAAFiS0dEAmYLfGQAAAENSURBVCjPndGxasMwEAbgpG8g+wmsprSmIRCuNXhNlRcI1gskINAbFPIA8WA62CC4NbRLhw5dHDBkytChU9duWdpS0DNULpbktf0HDR/c6bgbDP6TISEkBDAvcRCmiNCDMEGUCjykCSql0qmFsBISpVhVFuJKtFlhZAGTFtIeKAAwjS0EiEoIKUv3C0U0JWVkIdhBm9tnB3Wzbpp17YCcf7/p4/uHKyEXe22y8z3qXOd3nxtXMmnG+etLcbm3c0z0dlwU9El3cCKPDwtK+fZr2YFaZofH+8NClB3gGf9N3MGQjnjGGM+obUpOr+ecz8EPNrq54hkwDwGbUcpmfskBRoTEZe8u1NwkiCz8NT+hdlqy1rCCiAAAAABJRU5ErkJggg==",
        scientist: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAKlBMVEX///8AAAAWIy0gaKgpQ08tSWZWbHVxSC2Mia/IyNTPlm/js4/u7vf3z7YQMY+8AAAAAXRSTlMAQObYZgAAAPhJREFUKM9jYCASMAoKCqDwRdLSHJFFRNxS3FIckRSopLm4pDkhlDA6gQRUEAJCKmkpbmlOinABJRfHrGUiLkowPruKi9TduwtdnApgAotcZO/eveiiBRdYKHgXCASlYAIMgloua2+5LBJEWFtyxi3ljDuSU6XOrL11ZiGS08XX3r17qxDZc1W31i5H9hxLo3ihhAOSgMyJwzY9B5F0zMk4GtN2EqFHYoZka8TEzkaEQJvk0ZiJGXAB9l0CMid6DjKuhvtll9iMEz2diXABhkLGzhmdMwTEkayZOaNzJrLDGDVndE5CEXARFHRBEVASACLkqBMEI+IAAPcBSGPvQC5SAAAAAElFTkSuQmCC",
        arena: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAKlBMVEX///8AAAAvLi9JSU1KKRJpUGlxSC2OKBGQiHPCuK3Plm/hUEru7vf3z7bCjtuyAAAAAXRSTlMAQObYZgAAAPFJREFUKM+Nj68OwjAYxFsEuiVsYYBZESTI9QmwuMkSBLM4MCQ4JHKiCU1mIPxR04ipySV7giV9FwZLu08guKSiv9xd7kPolzCtRSDpcR74gHQmnHPmt4nvnzECEzyAgDYWm+nwJrK1CfZNtKD7ZB/D9LA24LoPRtlrP2vB1M+y184C1Fu4WkdXsGyTp9X4AbYvdK0bOK6fal3N4f2bKoUJ5MRu5IXAoNTyrlRrGZ+FFPKUW0N5FDKRg9JYcEGFKCRNDBhG2FslMXEvBlxwWJYOGRqAiaMoVSEmYIeQcAfyROzJGAJJsIDgU2crm9rm/aU3xJBFi/RJuaoAAAAASUVORK5CYII=",
        wonder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OTIzRTMwQTlGNDdCMTFFNTg2MjdDNzEwNjcyQTIzRTkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTIzRTMwQUFGNDdCMTFFNTg2MjdDNzEwNjcyQTIzRTkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5MjNFMzBBN0Y0N0IxMUU1ODYyN0M3MTA2NzJBMjNFOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5MjNFMzBBOEY0N0IxMUU1ODYyN0M3MTA2NzJBMjNFOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pqi2bP0AAAAwUExURfjwaNCYcPj4+Ki40GAoIPjQuPig8NiYAIhIiNhwUHhIMCgoKLg4GPDAAAAAAAAAACeUxKwAAAAQdFJOU////////////////////wDgI10ZAAABAklEQVR42oSTC7KDIAxFTfhY8sH97/Zd1LYq8HoHNZAzkoSwbD+0PObaNAdUlyadAerNvU7/ILt/WVzGgLjvBD4yBU4NgYv/SnwAvQP6BNTMvn5MtAfKG9lN7bawUrDe1Ixui02kOU6ZSA+QfQgz6oFNibgSUa6cSQd1UEksKaUsnEWHlSS4i6Wcqa+kHHFSMkt0RChXQLAYY0TwqkgHJmC5AErMKEBcfcWIMJnPQM8tNAS0WvQAeYSJ+aPUenClHB7VYcsFDhjTlrPiDHmxMVCLe2Fu7zoGcNo4BgA2A1ZkihzXCQDilV8YV/89C7SlyK2nn1ev1uP55/L+vN2d/gQYAF8VM2lHYAE7AAAAAElFTkSuQmCC",
        tower: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAMFBMVEX///8AAAApQ08pcIFClKpJSU1Lq9BmLg9ubm5xSC2jycjPlm/cmhnork/u7vf3z7a4KRbKAAAAAXRSTlMAQObYZgAAASdJREFUKM9jYCAXMCkbKaDwVVxcnJBFlFOcTdyMEHxGsxRjY7dkAYQON5CKFIQeZbc0F5e0FIQeWZc0IHC5COMryZi4paWlOB9UgvI9dxqbOKk4G8+eAhZhMsvcZGysDcLTkkHmMroBBZT2/1YCCqSAbGZ0SVE0Wvz/v5WykJsL2CkizkbSD///l9uobOIIcaexkeR/IJiobAxxq5KhAqP07/0bBZiEIbYYAyUCJSeKApUag20BCrC2npwTEQBigZQIGzIwtp69EyEAYoH1CDBIxNy9e7SRgRHiX2UBzg7xs3cKOyYwQvyryDB/YaR44VSpnwxCUO9Kbwzt6AiV3ogIQtETHR09gQJIgRpz5sxRAeR4EJ0oGYgSUZIHZSaiCDAKMAoQG8sAZEpOkN/TuWMAAAAASUVORK5CYII=",
        pyramid: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAKlBMVEX///8AAAAuIhI0bC9KKRJLQyttZStxSC2JUC+mhS7EpUzPlm/UbjH3z7bDGGp+AAAAAXRSTlMAQObYZgAAAShJREFUKM+NkT9Lw0AYxu++Qd9W26Zbi36Ajo5KsWbooBCwZCrIYcZCByGT4J8TXYJp8LJ1zLuHFI7uDhm7Fb+Ld/R6yeDgs92P5/1z70PI3wKl+pumiFmjBhxUimqGqXYsK4tzK5Seo6rD10dZfr/ZLhQzDVK0NT1EIRBXtiRP9ZTMNw4K23yKuPQnsCfOaitzz/PlpBeZrSAEKaEAs1tbROGPUuGI2R4w1tmMF7s5YwcwO1psduPztgWtIYQFtIYGUOBnCUDwyc1Y0n11E86D+OHRbNp9EuL+RYgrAyhXIAkU4A0DXMaChLH4ANaXIkBMxN27AXLE9AnZSJop0HQ1iPs2ieaJLrno2yMf3wyUTq+rGLwBwMCrYqDlnJBOWYtOf4IC+Z9+Ab4jceSsepITAAAAAElFTkSuQmCC",
        alchemist: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAtUExURXCYOOCoiPjQyPj4+ChQEHhIMKjIiLiwoOCImPjgyPCoqJBAUNBgYAAAAP///2PjC4AAAAAPdFJOU///////////////////ANTcmKEAAAEJSURBVHjavJPRcoUgDESDiEI22///3C7aVrTc6dyX7jiDuocQSLCPP2T/DeDQSwCoh27IACC8hlQ9MAO+/QcxAPUC6gSADLhHuEMgZoD8U5gAh794ba1qGIgRWJZoUizLFFCAw++EQjyAM4NI3U8xZmFXAI/MDjAfxAMA9TOjAxrciTtAejjal6APcgQ0XWtESS3pKWK1Cu8RVEoHWYpeddS4RxCB0CpmKZkpfoDPoyaMji3nDU778YdqrmbkJpFm6+9qsq0mJme5tjZOgETl4K4cmCaANqJOqiq2KkJOOorqmDj9fZ8Bfadd+75fe7i3PUtKZEqFry4O+wFinP+8WT058r27+SnAAFJzMLawCe3JAAAAAElFTkSuQmCC",
        decor: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACpQTFRFAAAARi1GbUtQLy4v98+2iXVrz5Zv7HV1rUxLcUgt7u73o8nIbS8rAAAARr4BKgAAAA50Uk5T/////////////////wBFwNzIAAAA70lEQVR42pyTgXLEIAhEV1Eiav7/d7vYa3s34nXaHaNkeAOSAO5fhL8BWDoCQMpUekGebLprTmtDBECWfxGCCEg/QAoASJL6maLSRAB4iCUGiAB49CUa2ABT8fxJHodaDEgp8gYQ+klIBPhX1g4H0BX7HW6BlC+gyA54lVYesqc6v08vzbQol3nJEeC3NPM7xoBgtKHKDbIDJNAz2hgNoyMh+JsjDzQK6B0WAD13tOtqoKnFdkBznxc1SZQQUMxrcnkMRD3JBAwxPcmhq3PzFC2fgcpX1CNAX4U/x8liVwIvU7GP3n2/Gb3/TfeHAAMAaGMlUpM6VNUAAAAASUVORK5CYII="
    };
    var gachaItems = {
        safari: 95, great: 50, ultra: 30, luxury: 35, myth: 12, quick: 12, heavy: 20, clone: 25,
        bait: 95, rock: 135, gem: 9, dust: 60,
        wild: 70,
        gacha: 1,  master: 1,
        amulet: 1, soothe: 1, scarf: 1, battery: 1,
        pearl: 15, stardust: 12, bigpearl: 9, starpiece: 5, nugget: 4, bignugget: 1,
        whtapricorn: 9
    };
    var finderItems = {
        crown: 1, honey: 1, eviolite: 1, fragment: 1,
        rare: 4, recharge: 10, spy: 20, rock: 11, bait: 20,
        pearl: 10, stardust: 7, bigpearl: 3, luxury: 15, gacha: 16,
        blkapricorn: 10
    };
    var finderMissRate = 0.80;
    var packItems = {
        amulet: 2, crown: 2,
        scarf: 4, soothe: 4, battery: 4,
        honey: 6, eviolite: 6,
        rare: 3, spray: 2, nugget: 6,
        quick: 5, luxury: 6, clone: 6,
        rock: 8, bait: 8, silver: 9,
        gem: 6, gacha: 12,
        mega: 1
    };
    var currentItems = Object.keys(itemData);
    var retiredItems = [];
    var allItems = currentItems.concat(retiredItems, "permfinder");
    var allBalls = ["safari", "great", "ultra", "myth", "luxury", "quick", "heavy", "spy", "clone", "premier", "mono", "master"];
    var allCostumes = Object.keys(costumeData);
    
    var itemHelp = {
        silver: "Rare coins that can be used to purchase valuable items. Obtained from quests and contests.",
        bait: "A tasty treat used to attract wild Pokémon. Has " + an(itemData.bait.successRate*100) + "% success rate with an approximate " + itemData.bait.successCD + " second cooldown on success, and an approximate " + itemData.bait.failCD + " second cooldown on failure. Use with \"/bait\".",
        golden: "A premium bait used to attract wild Pokémon. Has " + an(itemData.golden.successRate*100) + "% success rate and can be used more often than normal Baits. Use with \"/gbait\".",
        gacha: "A ticket that allows you to try the Gachapon Machine to get a random reward! " + cdSeconds("gacha") + " Use with \"/gacha\".",
        rock: "A small rock that can be thrown to potentially stun another player for a short period of time. " + cdSeconds("rock", "throwCD") + " Use with \"/snowball [Player]\".",
        rare: "Can be smashed and transformed into around " + (itemData.rare.charges + Math.floor(itemData.rare.maxVar/2)) + " Candy Dusts. Use with \"/use rare\". Found with Itemfinder.",
        dust: "What you obtain after smashing a Rare Candy into powder. Has the power to evolve Pokémon. Use with \"/evolve [Pokémon]\".",
        spray: "A spray that affects the genetic code of a Pokémon, making them devolve and generating some Candy Dust. Use with \"/spray [Pokémon]\". Obtained from Prize Packs.",
        mega: "A mysterious stone that allows certain Pokémon to undergo a powerful transformation. It is said to wear off in approximately " + itemData.mega.duration + " days. Use with \"/mega [Pokémon]\". Obtained from Official Events and Prize Packs.",
        valuables: "The items Rock, Pearl, Stardust, Big Pearl, Star Piece, Nugget and Big Nugget can be sold for a varying amount of money. Sell with \"/pawn [Item]\". Obtained from Gachapon, found with Itemfinder, and rewarded from Contests.",
        itemfinder: "Itemfinder: An experimental machine that can help find rare items! By default, it can only hold " + itemData.itemfinder.charges + " charges. These charges are reset every day. Use with \"/finder\".",
        gem: "An electrically charged gem created by a famous Ampharos in Olivine City. It is said to be able to recharge the Itemfinder, giving it " + itemData.gem.charges + " more uses for the day! Use with \"/use gem\". Obtained from Gachapon and quests.",
        box: "Increases number of Pokémon that can be owned by " + itemData.box.bonusRate + " each. Can only acquire by purchasing.",
        stick: "Legendary Stick of the almighty Farfetch'd that provides a never ending wave of prods and pokes unto your enemies and other nefarious evil-doers. " + cdSeconds("stick") + " Use with \"/stick [Player]\".",
        salt: "A pile of salt that makes the holder increasingly unlucky the more they have.",
        burn: "A potion used to heal burns. Use /burn to give it to someone who may need it.",
        entry: "A Raffle Entry that can win a spectacular prize if you own the correct one at the time of drawing. Simply hold onto your ticket safely until the time of the drawing. Nothing more is needed on your part!",
        coupon: "A coupon holding a special offer to those interested in decorating their Secret Base. Can be traded for a Decoration at the Decor.",
        pack: "A wonderful package that could contain equally wonderful prizes! Use with \"/use pack\". Obtained from Official Events.",
        fragment: "A fragment of a broken Pokéball. Collecting " + itemData.fragment.threshold + " is said to be enough to form a Master Ball! Obtained from Itemfinder and when obtaining a Master Ball while having one already.",
        materia: "A basic substance required for various alchemic creations. Obtained from Alchemy quest.",
        //philosopher: "A legendary red gem that enables the holder to bypass the laws of equivalent exchange during alchemy.",
        egg: "An egg that seems to have a non-legendary Pokémon inside. Use with \"/use egg\". Obtained from Pyramid quest.",
        bright: "A mysterious egg that gives birth to a Pokémon when hatched. Small chance that this Pokémon will be shiny or even legendary! Use with \"/use bright\". Obtained from Pyramid quest.",
        water: "Water with high mineral content that increases your stamina at Pyramid by " + (itemData.water.bonusRate * 100) + "%. Use with \"/use water\".",
        cherry: "A tasty treat that keeps you energized during a Tower Challenge allowing you to deal more damage. Use with \"/use cherry\". Obtained from Alchemy quest.",
        blkapricorn: "An acorn-shaped fruit that can be crafted into a Pokéball. Has a very strong flavor. Found with Itemfinder.",
        whtapricorn: "An acorn-shaped fruit that can be crafted into a Pokéball. Has a very weak flavor. Obtained from Gachapon."
    };
    var perkHelp = {
        amulet: "When holding this charm, " + itemData.amulet.bonusRate * 100 + "% more money is obtained when selling a Pokémon to the store (Max Rate: " + itemData.amulet.maxRate * 100 + "%). Obtained from Gachapon.",
        soothe: "A bell with a comforting chime that calms the owner and their Pokémon. Reduces delay after a successful catch by " + itemData.soothe.bonusRate * 100 + "% (Max Rate: " + itemData.soothe.maxRate * 100 + "%). Obtained from Gachapon.",
        scarf: "A fashionable scarf made of the finest silk. Wearing it allows you to lead a more luxurious life and grants you " + itemData.scarf.bonusRate * 100 + "% more money from Luxury Balls (Max Rate: " + itemData.scarf.maxRate * 100 + "%). Obtained from Gachapon.",
        battery: " A high-capacity battery that can increase the uses of Item Finder by " + itemData.battery.bonusRate + " per day. (Max Rate: " + itemData.battery.maxRate + "). Obtained from Gachapon.",
        honey: "Sweet-smelling Combee Honey that, when applied to bait, increases the chance of a Pokémon being attracted by " + itemData.honey.bonusRate * 100 + "% (Max Rate: " + itemData.honey.maxRate * 100 + "%). Found with Itemfinder.",
        crown: "A rare crown with mysterious properties that brings good fortune to its owner. Increases rate of pawned items by " + itemData.crown.bonusRate * 100 + "% (Max Rate: " + itemData.crown.maxRate * 100 + "%). Found with Itemfinder.",
        eviolite: "A mysterious gem that automatically powers up Pokémon with 420 BST or less by " + itemData.eviolite.bonusRate + ". (Max Rate: " + itemData.eviolite.maxRate + "). Found with Itemfinder."
    };
    var ballHelp = {
        safari: "A standard issue Pokéball used to catch Pokémon. " + cdSeconds("safari"),
        great: "A Pokéball that has a slightly increased catch rate. " + cdSeconds("great"),
        ultra: "A high functioning Pokéball that has a better catch rate than a Great Ball. " + cdSeconds("ultra"),
        master: "An extremely rare Pokéball that never fails to catch. " + cdSeconds("master") + " Obtained from Gachapon and Alchemist.",
        premier: "A plain Pokéball gifted to you for your patronage. It works better when a Normal-type Pokémon is active. " + cdSeconds("premier") + " Obtained by purchasing a lot of Pokéballs from the shop.",
        luxury: "A comfortable Pokéball with an increased catch rate that is said to make one wealthy. " + cdSeconds("luxury") + " Obtained from Gachapon and found with Itemfinder.",
        myth: "An ancient Pokéball that ignores modern era catch modifiers. Said to be particularly effective against certain rare Pokémon. " + cdSeconds("myth") + " Obtained from Gachapon.",
        quick: "A somewhat different Pokéball that tends to get better priority during throws. " + cdSeconds("quick") + " Obtained from Gachapon.",
        heavy: "An industrial Pokéball that works better against hardier and stronger Pokémon. " + cdSeconds("heavy") + " Obtained from Gachapon.",
        clone: "A mysterious Pokéball with a very low catch rate that can duplicate a pokémon's D.N.A. " + cdSeconds("clone") + " Obtained from Gachapon.",
        spy: "A stealthy Pokéball that cannot be tracked. " + cdSeconds("spy") + " Found with Itemfinder.",
        mono: "A monochromatic Pokéball that enhances the catch rate of single-type Pokémon. " + cdSeconds("mono") + " Obtained from Alchemy Quest."
    };
    var costumeHelp = {};
    var decorations = {};
    var SECRET_BASE_WIDTH = 7;
    var SECRET_BASE_HEIGHT = 5;


    /* Wild Pokemon Variables */
    var shinyChance = 1024; //Chance for Shiny Pokémon
    var currentPokemon = null;
    var currentPokemonCount = 1;
    var lastPokemonCount = 1;
    var currentDisplay = null;
    var maxThrows = 10;
    var currentThrows;
    var preparationPhase = 0;
    var preparationThrows = {};
    var preparationFirst = null;
    var lastWild = 0;
    var wildEvent = false;
    var isBaited = false;
    var resolvingThrows = false;
    var catchTierChance = [0.20, 0.18, 0.14, 0.11, 0.07, 0.03];

    /* Leaderboard Variables */
    var leaderboards = {};
    var monthlyLeaderboards = {};
    var lastLeaderboards;
    var lastLeaderboardUpdate;
    //Adding a variable that already exists on player.records here will automatically make it available as a leaderboard
    //To add stuff not on player.records, you must add an exception on this.updateLeaderboards()
    var leaderboardTypes = {
        // totalPokes: { desc: "by Pokémon owned", alts: ["totalpokes"], alias: "owned" },
        pokesCaught: { desc: "by successful catches", alts: ["caught", "pokescaught"], alias: "caught" },
        // pokesEvolved: { desc: "by successful evolutions", alts: ["evolve", "evolved", "pokesevolved"], alias: "evolved" },
        // bst: { desc: "by total BST of Pokémon owned", alts: [], alias: "bst" },
        contestsWon: { desc: "by contests won", alts: ["contest", "contests", "contestswon"], alias: "contest" },
        earnings: { desc: "by money earned from NPC, quests, events and Luxury Balls", alts: ["earned", "earnings", "money", "$"], alias: "earnings", isMoney: true },
        // money: { desc: "by money", alts: ["$"], alias: "money", isMoney: true },
        // pokeSoldEarnings: { desc: "by money gained with selling Pokémon", alts: ["sold", "sell", "pokesoldearnings"], alias: "sold", isMoney: true },
        // luxuryEarnings: { desc: "by money gained with Luxury Balls", alts: ["luxury", "luxuryball", "luxury ball", "luxuryearnings"], alias: "luxury", isMoney: true },
        // consecutiveLogins: { desc: "by longest streak of consecutive days login", alts: ["login", "logins", "consecutivelogins"], alias: "login" },
        pokesCloned: { desc: "by successful clones", alts: ["clone", "clones", "cloned", "clone ball", "pokescloned"], alias: "cloned" },
        // gachasUsed: { desc: "by tickets used for Gachapon", alts: ["gacha", "gachasused"], alias: "gacha" },
        // itemsFound: { desc: "by items found with Itemfinder", alts: ["found", "itemsfound", "items found"], alias: "found" },
        collectorEarnings: { desc: "by money received from the Collector", alts: ["collector", "collector money", "collectormoney", "collector $", "collectorearnings"], alias: "collector", isMoney: true },
        // collectorGiven: { desc: "by Pokémon given to the Collector", alts: ["collector", "collector pokémon", "collectorpokémon", "collector pokemon", "collector poke", "collectorpoke", "collectorgiven"], alias: "collector" },
        towerHighest: { desc: "by best Battle Tower run", alts: ["tower", "battletower", "battle tower", "towerhighest"], alias: "tower" },
        arenaPoints: { desc: "by arena points", alts: ["points", "arena", "arenapoints"], alias: "arenapoints" },
        salt: { desc: "by saltiest players", alts: ["salt", "salty"], alias: "salt" },
        pokesStolen: { desc: "by Pokémon stolen from NPCs", alts: ["stolen", "pokesstolen"], alias: "stolen" },
        // topQuizScore: { desc: "by best score in Quiz", alts: ["quiz", "score", "quizscore", "quiz score", "topquizscore"], alias: "quiz" },
        pyramidScore: { desc: "by best Pyramid score", alts: ["pyramid", "pyramidscore", "pyramid score"], alias: "pyramid" },
        // pyramidTotalScore: { desc: "by total Pyramid points", alts: ["pyramidtotal", "pyramid total", "pyramidtotalscore"], alias: "pyramid total" },
        pyramidFinished: { desc: "by cleared Pyramid runs", alts: ["pyramidfinished", "pyramid finished"], alias: "pyramid finished" }
    };
    var monthlyLeaderboardTypes = {
        pokesCaught: { desc: "by successful catches during this month", alts: ["caught monthly"], alias: "caught monthly", lastAlias: "caught last", file: "scriptdata/safari/monthlyPokesCaught.txt", lastDesc: "by successful catches during the last month"  },
        contestsWon: { desc: "by contests won during this month", alts: ["contest monthly", "contests monthly"], alias: "contest monthly", lastAlias: "contest last", file: "scriptdata/safari/monthlyContestsWon.txt", lastDesc: "by contests won during the last month" },
        collectorEarnings: { desc: "by money received from the Collector during this month", alts: ["collector monthly", "collector money monthly", "collectormoney monthly", "collector $ monthly"], alias: "collector monthly",  lastAlias: "collector last",isMoney: true, file: "scriptdata/safari/monthlyCollectorEarnings.txt", lastDesc: "by money received from the Collector during the last month" },
        arenaPoints: { desc: "by Arena points won this month", alts: ["arena monthly"], alias: "arena monthly",  lastAlias: "arena last", file: "scriptdata/safari/monthlyArenaPoints.txt", lastDesc: "by Arena points won during the last month" }
    };

    /* Contest Variables */
    var contestDuration = 300; //Contest lasts for 5 minutes
    var contestCount = 0;
    var contestCatchers = {};
    var contestBroadcast = true; //Determines whether Tohjo gets notified
    var contestCooldownLength = 1800; //1 contest every 30 minutes
    var contestCooldown = (SESSION.global() && SESSION.global().safariContestCooldown ? SESSION.global().safariContestCooldown : contestCooldownLength);
    var contestantsCount = {};
    var contestantsWild = [];
    var currentTheme;
    var contestVotes;
    var contestVotingCooldown = 4;
    var contestVotingCount = (SESSION.global() && SESSION.global().contestVotingCount ? SESSION.global().contestVotingCount : contestVotingCooldown);
    var generations = ["None", "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos"];
    var nextTheme;
    var currentRules;
    var nextRules;
    var RULES_NERF = 0.30;
    var RULES_BUFF = 0.25;
    var defaultRules = {
        "onlyTypes": { //Picks one of the random sets and excludes all types not in that array
            "chance": 0,
            "sets": [
                ["Water", "Fire", "Grass"],
                ["Dark", "Fighting", "Psychic"]
            ]
        },
        "excludeTypes": { //onlyTypes has priority over excludeTypes; if a set from onlyTypes is used, excludeTypes will be skipped
            "Normal" : 0.015,
            "Fighting" : 0.06,
            "Flying" : 0.06,
            "Poison" : 0.06,
            "Ground" : 0.06,
            "Rock" : 0.06,
            "Bug" : 0.06,
            "Ghost" : 0.06,
            "Steel" : 0.06,
            "Fire" : 0.06,
            "Water" : 0.06,
            "Grass" : 0.06,
            "Electric" : 0.06,
            "Psychic" : 0.06,
            "Ice" : 0.06,
            "Dragon" : 0.06,
            "Dark" : 0.06,
            "Fairy" : 0.06
        },
        "bonusTypes": { //Excluded types have priority over bonus types. If a type is picked by both, it will only count for exclude.
            "Normal" : 0.06,
            "Fighting" : 0.06,
            "Flying" : 0.06,
            "Poison" : 0.06,
            "Ground" : 0.06,
            "Rock" : 0.06,
            "Bug" : 0.06,
            "Ghost" : 0.06,
            "Steel" : 0.06,
            "Fire" : 0.06,
            "Water" : 0.06,
            "Grass" : 0.06,
            "Electric" : 0.06,
            "Psychic" : 0.06,
            "Ice" : 0.06,
            "Dragon" : 0.06,
            "Dark" : 0.06,
            "Fairy" : 0.06
        },
        "excludeBalls": {
            "safari": 0,
            "great": 0.02,
            "ultra": 0.08,
            "master": 0.10,
            "myth": 0.125,
            "luxury": 0.125,
            "quick": 0.15,
            "heavy": 0.125,
            "spy": 0.125,
            "clone": 0.125,
            "premier": 0.125,
            "mono": 0.10
        },
        "bst": { //Both min and max are optional. It's possible to have only one of them in this object
            "minChance": 0,
            "min": [230, 400],
            "maxChance": 0.12,
            "max": [490, 535]
        },
        "noLegendaries": {
            "chance": 0.07
        },
        "shiny": {
            "nerf": 0,
            "buff": 0.05
        },
        "singleType": {
            "nerf": 0,
            "buff": 0.13
        },
        "dualType": {
            "nerf": 0,
            "buff": 0
        },
        "inver": {
            "chance": 0.12
        },
        "invertedBST": {
            "chance": 0.08
        },
        "defensive": {
            "chance": 0.10
        },
        "generation": {
            "kanto": {"nerf": 0.03, "buff": 0.03},
            "johto": {"nerf": 0.03, "buff": 0.03},
            "hoenn": {"nerf": 0.03, "buff": 0.03},
            "sinnoh": {"nerf": 0.03, "buff": 0.03},
            "unova": {"nerf": 0.03, "buff": 0.03},
            "kalos": {"nerf": 0.03, "buff": 0.03}
        },
        "rewards": {
            "sets": {
                "defaultSet": {
                    "gacha": 10
                },
                "silver": {
                    "gacha": 15,
                    "silver": 3
                },
                "gem": {
                    "gacha": 10,
                    "gem": 2
                },
                "nugget": {
                    "gacha": 10,
                    "nugget": 1
                },
                "dust": {
                    "gacha": 10,
                    "dust": 40
                },
                "rock": {
                    "gacha": 15,
                    "rock": 20
                },
                "fragment": {
                    "fragment": 1
                }
            },
            "chance": {
                "defaultSet": 0.74,
                "silver": 0.05,
                "gem": 0.05,
                "nugget": 0.05,
                "dust": 0.05,
                "rock": 0.05,
                "fragment": 0.01
            }
        }
    };
    var contestThemes = {
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

        "forest" : {
            "name":"Forest","types":["Grass","Bug"],"excludeTypes":[],"include":[16,17,18,25,163,164,438,185,452,65948,131484,65949,131485,172,287,288,289,26,251,65957,66122,66121,716],"exclude":[649,640,452,451,455,459,460,331,332,345,346,347,348,65948,131484,65949,131485,492,66028,556,557,558],"customBST":{"251":625,"289":600,"716":630},"minBST":300,"maxBST":631,"icon":716
        },
        "sea" : {
            "name":"Sea","types":["Water"],"excludeTypes":[],"include":[524954,721562,65958,65959,298,712,713,686,687,691,249,131738,618,604,603,602,147,148,347,345,346,348,490,66086],"exclude":[60,61,62,194,195,186,535,536,537,656,657,658,647,503,502,501,270,271,272,283,245,418,419,258,259,260,400,489,515,516,79,80,199,54,55,580,581,158,159,160],"customBST":{"249":640,"490":630},"minBST":300,"maxBST":641,"icon":249
        },
        "lake" : {
            "name":"Lake","types":["Water"],"excludeTypes":[],"include":[852634,656026,284,399,65958,65959,480,481,482,298,161,162,193,469,16,17,18,396,397,398,267,269,12,15,666,245,453,454,83],"exclude":[7,8,9,91,138,139,140,141,72,73,86,87,120,121,320,321,319,224,222,223,226,363,364,365,366,368,367,369,370,458,456,457,489,490,564,565,592,593,594,550,721,688,689,690,692,693,647,170,171,230,117,116,98,99,422,65958,423,65959,393,394,395],"customBST":{"245":625,"480":620,"481":620,"482":620},"minBST":300,"maxBST":626,"icon":245
        },
        "volcano" : {
            "name":"Volcano","types":["Fire","Rock"],"excludeTypes":["Water","Ice"],"include":[1049242,721,208,661,146,244,485],"exclude":[377,639,719,703,494],"customBST":{"146":634,"244":634,"485":637,"721":637},"minBST":315,"maxBST":641,"icon":485
        },
        "cave" : {
            "name":"Cave","types":["Rock","Ground","Dark"],"excludeTypes":["Flying"],"include":[41,42,169,92,93,202,360,29,30,32,33,206,535,718,719,147,148,35,36,236,296,297,307,308,66,67],"exclude":[185,197,219,220,221,222,318,319,332,342,359,369,389,423,473,434,435,438,449,450,452,461,509,510,551,552,553,559,560,564,565,570,571,624,625,658,660,675,686,687,215,622,623],"customBST":{"248":610,"442":550,"445":610,"718":640,"719":627},"minBST":300,"maxBST":641,"icon":718
        },
        "sky" : {
            "name":"Sky","types":["Flying"],"excludeTypes":["Bug"],"include":[329,330,635,351,641,642,645,717],"exclude":[146,145,144,226,458,130],"customBST":{"149":610,"373":610,"635":610,"641":620,"642":620,"645":620,"717":630},"minBST":300,"maxBST":631,"icon":717
        },
        "urban" : {
            "name":"Urban","types":["Poison","Dark","Steel"],"excludeTypes":["Grass","Water","Fairy"],"include":[52,53,209,210,300,301,479,66015,131551,197087,262623,328159,506,507,508,19,20,582,583,584,676,66212,131748,197284,262820,328356,393892,459428,524964,590500,358,707,25,66,67,68,64,63,65,56,57,494,720,143,204,425,426,446,447,616,532,534,533,131484,131485],"exclude":[],"customBST":{"66015":590,"131551":590,"197087":590,"262623":590,"328159":590,"590500":580,"524964":580,"459428":580,"393892":580,"328356":580,"262820":580,"197284":580,"131748":580,"66212":580,"494":625,"720":625,"376":610},"minBST":300,"maxBST":626,"icon":66015
        },
        "tundra" : {
            "name":"Tundra","types":["Ice"],"excludeTypes":[],"include":[86,90,216,217,234,393,394,395,197193,197194,66202,787098,1114778,144,378,646],"exclude":[],"customBST":{"144":625,"378":625,"646":635},"minBST":300,"maxBST":636,"icon":646
        },
        "factory" : {
            "name":"Factory","types":["Steel","Electric"],"excludeTypes":[],"include":[137,233,474,145,243,649],"exclude":[385,379,642,638,476,485,530,624,625,589,212],"customBST":{"145":622,"243":622,"376":610,"649":630},"minBST":300,"maxBST":631,"icon":145
        },
        "meadow" : {
            "name":"Meadow","types":["Normal","Fairy"],"excludeTypes":["Flying"],"include":[262810,66205,131741,197277,262813,66206,131742,197278,262814,328350,66207,131743,197279,262815,672,673,492,152,153,154,328346,590490,182,189,188,187,176,468,333,334,315,406,407,415,416,417,420,421,65957,285,286,548,549,43,45,44,69,70,71,66121,131657,197193,66122,131658,197194,587,666,12,15,414,193,283,284,469,470,311,312,25,26,648],"exclude":[719,137,351,474,233,694,695,303,676,703,707,132,122,439],"customBST":{"289":600,"492":617,"648":617,"328350":617},"minBST":300,"maxBST":621,"icon":492
        },
        "dojo" : {
            "name":"Dojo","types":["Fighting"],"excludeTypes":[],"include":[291,656,657,658,390,679,680,66217,624,625,681,143,638,639,640,647],"exclude":[],"customBST":{"66217":600,"647":610,"640":610,"639":610,"638":610},"minBST":300,"maxBST":611,"icon":107
        },
        "pyre" : {
            "name":"Mt. Pyre","types":["Ghost","Psychic"],"excludeTypes":["Normal","Steel","Fairy"],"include":[37,38,359,491,104,105,654,228,229,198,430,197,679,680,487],"exclude":[720,488,482,481,480,380,381,386,151,494,251,121],"customBST":{"487":640,"491":633},"minBST":300,"maxBST":641,"icon":487
        },
        "daycare" : {
            "name":"Daycare","types":["Normal","Fire","Water","Grass","Electric","Rock","Ground","Bug","Dark","Psychic","Steel","Ghost","Dragon","Fighting","Flying","Fairy","Ice","Poison"],"excludeTypes":[],"include":[66205,131741,197277,262813,65958,65948,131484,489],"exclude":[201,188,271,266,268,274,281,292,329],"customBST":{"58":320,"77":320,"111":320,"132":300,"138":320,"140":340,"215":340,"239":305,"240":305,"320":320,"345":340,"347":340,"366":320,"408":340,"410":340,"425":320,"427":320,"446":320,"489":340,"559":320,"564":340,"566":340,"619":320,"627":320,"629":320,"636":340,"682":320,"684":320,"696":340,"698":340},"minBST":240,"maxBST":341,"icon":132,
            "rules":{"bst":{"maxChance":1,"max":450},"onlyBalls":{"chance":1,"sets":[["safari","great","premier"]]},"rewards": {
            "sets":{"gacha":{"gacha":10},"rare":{"rare":1},"evio":{"eviolite":1}},"chance":{"gacha":0.85,"rare":0.12,"evio":0.03}}}
        },
        "tower" : {
            "name":"Dragonspiral Tower","types":["Dragon"],"excludeTypes":[],"include":[4,5,6,116,117,181,252,253,254,328,333,690,622,623,643,644],"exclude":[718,381,380],"customBST":{"643":630,"644":630},"minBST":300,"maxBST":631,"icon":644
        },
        "desert" : {
            "name":"Desert","types":["Rock","Ground"],"excludeTypes":["Water","Ice"],"include":[918170,331,332,556,455,23,24,379,508,227,65949,65948,694,695,377],"exclude":[],"customBST":{"248":610,"377":618,"379":618},"minBST":300,"maxBST":621,"icon":332
        },
        "starter" : {
            "name":"Starter Pokémon","types":[],"excludeTypes":[],"include":[1,2,3,4,5,6,7,8,9,25,133,152,153,154,155,156,157,158,159,160,252,253,254,255,256,257,258,259,260,387,388,389,390,391,392,393,394,395,495,496,497,498,499,500,501,502,503,650,651,652,653,654,655,656,657,658,250],"exclude":[],"customBST":{"3":610,"6":615,"9":610,"25":420,"133":480,"154":610,"157":610,"160":610,"196":535,"197":535,"250":640,"254":610,"257":625,"260":620,"389":610,"392":615,"395":610,"497":610,"500":615,"503":610,"652":615,"655":615,"658":625},"minBST":320,"maxBST":641,"icon":250
        },
        "cerulean" : {
            "name":"Cerulean Cave","types":[],"excludeTypes":[],"include":[24,26,28,42,44,47,49,64,70,75,82,85,97,132,129,60,118,80,117,119,40,101,105,111,112,113,150,57,67,202,55,79,54,130,74,61,53,359,296,433,436,151],"exclude":[],"customBST":{"151":675},"minBST":300,"maxBST":681,"icon":150
        },
        "ruins" : {
            "name":"Ruins","types":[],"excludeTypes":[],"include":[201,65737,131273,196809,262345,327881,393417,458953,524489,590025,655561,721097,786633,852169,917705,983241,1048777,1114313,1179849,1245385,1310921,1376457,1441993,1507529,1573065,1638601,1704137,1769673,202,360,353,354,355,356,235,436,437,92,93,94,524,525,526,343,344,177,178,679,680,442,561,562,563,138,139,140,141,142,622,623,605,606,696,299,476,200,429,359,566,567,486,345,346,483,484,697,698,699,410,408,409,411,564,565],"exclude":[],"customBST":{"442":550,"483":670,"484":670,"486":670},"minBST":300,"maxBST":671,"icon":486
        },
        "space" : {
            "name":"Space","types":[],"excludeTypes":[],"include":[386,385,374,375,376,35,36,120,121,173,577,578,579,605,606,337,338,622,623,132,351,517,518,488,524,525,526,197,371,372,373,81,82,462,299,476,704,705,706,425,426,206,599,600,601,545,586,628,608,626,611,516,594,547,558,575,343,344,358,433],"exclude":[],"customBST":{"132":350,"373":610,"376":610,"385":640,"386":640,"488":640},"minBST":300,"maxBST":641,"icon":385//"name":"Space","types":[],"excludeTypes":[],"include":[386,385,374,375,376,345,346,35,36,120,121,173,577,578,579,202,605,606,436,437,337,338,343,344,360,622,623,132,359,351,131423,65887,262495,517,518,488,177,178,442,599,600,601,524,525,526,561,197,43,44,45,371,372,373,81,82,462,299,476,621,704,705,706,703,425,426],"exclude":[],"customBST":{"132":350,"373":610,"376":610,"385":640,"386":640,"488":640},"minBST":300,"maxBST":641,"icon":385
        },
        "mega": {
            "name":"Mega Pokémon","types":[],"excludeTypes":[],"include":[1,2,3,4,5,6,7,8,9,13,14,15,16,17,18,63,64,65,79,80,92,93,94,95,115,123,127,129,130,142,179,180,181,199,208,212,214,228,229,246,247,248,252,253,254,255,256,257,258,259,260,280,281,282,302,303,304,305,306,307,308,309,310,318,319,322,323,333,334,353,354,359,361,362,371,372,373,374,375,376,380,381,384,427,428,443,444,445,447,448,459,460,475,531],"exclude":[],"customBST":{"380":670,"381":670},"minBST":320,"maxBST":681,"icon":65920
        },
        "weather": {
            "name":"Weather","types":[],"excludeTypes":[],"include":[351,65887,131423,262495,420,421,382,383,186,37,38,60,61,62,248,247,246,449,450,698,699,460,459,425,426,705,704,706,695,694,191,192,357,54,55,333,334,108,463,613,614,46,47,453,454,529,530,470,471,478,541,540,542,86,87,361,362,363,364,365,585,66121,197193,131657,586,66122,131658,197194,270,271,272,283,284,331,332,207,472,445,444,443,27,28,50,51,4,5,6,473,220,221,65957,422,65958,423,65959,1,2,3,315,406,407,582,583,584,69,70,71,131,128,83,78,277,310,338,337,580,581,628,627,629,630],"exclude":[],"customBST":{"65887":550,"131423":550,"262495":550,"65957":620,"383":640,"382":640,"706":610,"445":610},"minBST":300,"maxBST":641,"icon":351
        }
    };

    /* Events Variables */
    var currentEvent;

    /* Bait Variables */
    var lastBaiters = [];
    var lastBaitersAmount = 3; //Amount of people that need to bait before you can
    var lastBaitersDecay = 40; //Seconds before the first entry in lastBaiters is purged
    var lastBaitersDecayTime = 40;
    var successfulBaitCount = 40;
    var nextGachaSpawn = 0;
    var baitCooldownLength = 0;
    var baitCooldown = (SESSION.global() && SESSION.global().safariBaitCooldown ? SESSION.global().safariBaitCooldown : baitCooldownLength);
    var releaseCooldownLength = 180; //1 release every 3 minutes
    var releaseCooldown = (SESSION.global() && SESSION.global().safariReleaseCooldown ? SESSION.global().safariReleaseCooldown : releaseCooldownLength);
    var goldenBaitCooldown = (SESSION.global() && SESSION.global().safariGoldenBaitCooldown? SESSION.global().safariGoldenBaitCooldown: 0);
    
    /* Pokemon Variables */
    var effectiveness = {
        "Normal": { "Rock": 0.5, "Ghost": 0, "Steel": 0.5 },
        "Fighting": { "Normal": 2, "Flying": 0.5, "Poison": 0.5, "Rock": 2, "Bug": 0.5, "Ghost": 0, "Steel": 2, "Psychic": 0.5, "Ice": 2, "Dark": 2, "Fairy": 0.5 },
        "Flying": { "Fighting": 2, "Rock": 0.5, "Bug": 2, "Steel": 0.5, "Grass": 2, "Electric": 0.5 },
        "Poison": { "Poison": 0.5, "Ground": 0.5, "Rock": 0.5, "Ghost": 0.5, "Steel": 0, "Grass": 2, "Fairy": 2 },
        "Ground": { "Flying": 0, "Poison": 2, "Rock": 2, "Bug": 0.5, "Steel": 2, "Fire": 2, "Grass": 0.5, "Electric": 2 },
        "Rock": { "Fighting": 0.5, "Flying": 2, "Ground": 0.5, "Bug": 2, "Steel": 0.5, "Fire": 2, "Ice": 2 },
        "Bug": { "Fighting": 0.5, "Flying": 0.5, "Poison": 0.5, "Ghost": 0.5, "Steel": 0.5, "Fire": 0.5, "Grass": 2, "Psychic": 2, "Dark": 2, "Fairy": 0.5 },
        "Ghost": { "Normal": 0, "Ghost": 2, "Psychic": 2, "Dark": 0.5 },
        "Steel": { "Rock": 2, "Steel": 0.5, "Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Ice": 2, "Fairy": 2 },
        "Fire": { "Rock": 0.5, "Bug": 2, "Steel": 2, "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 2, "Dragon": 0.5 },
        "Water": { "Ground": 2, "Rock": 2, "Fire": 2, "Water": 0.5, "Grass": 0.5, "Dragon": 0.5 },
        "Grass": { "Flying": 0.5, "Poison": 0.5, "Ground": 2, "Rock": 2, "Bug": 0.5, "Steel": 0.5, "Fire": 0.5, "Water": 2, "Grass": 0.5, "Dragon": 0.5 },
        "Electric": { "Flying": 2, "Ground": 0, "Water": 2, "Grass": 0.5, "Electric": 0.5, "Dragon": 0.5 },
        "Psychic": { "Fighting": 2, "Poison": 2, "Steel": 0.5, "Psychic": 0.5, "Dark": 0 },
        "Ice": { "Flying": 2, "Ground": 2, "Steel": 0.5, "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 0.5, "Dragon": 2 },
        "Dragon": { "Steel": 0.5, "Dragon": 2, "Fairy": 0 },
        "Dark": { "Fighting": 0.5, "Ghost": 2, "Psychic": 2, "Dark": 0.5, "Fairy": 0.5 },
        "Fairy": { "Fighting": 2, "Poison": 0.5, "Steel": 0.5, "Fire": 0.5, "Dragon": 2, "Dark": 2 }
    };
    var immuneMultiplier = 0.15;
    var pokeInfo = {
        species: function(poke) {
            return poke & ((1 << 16) - 1);
        },
        forme: function(poke) {
            return poke >> 16;
        },
        shiny: function(poke) {
            return typeof poke === "string";
        },
        readableNum: function(poke) {
            var ret = [];
            ret += pokeInfo.species(poke);
            if (pokeInfo.forme(poke) > 0) {
                ret += "-";
                ret += pokeInfo.forme(poke);
            }
            return ret;
        },
        icon: function(p, shinyBG) {
            /*Unown Icon hack. Remove after client update
            var p2 = p;
            var pcheck = p2%65536;
            if (pcheck == 201) {
                var pshift = Math.floor((p-201)/65536);
                if (pshift >= 5 && pshift < 17) {
                    p2 += 65536;
                } else if (pshift >= 17 && pshift <= 25) {
                    p2 += (65536*2);
                } else if (pshift === 26) {
                    p2 = 327881;
                } else if (pshift === 27) {
                    p2 = 1179849;
                }
            }
            //End of unown hack*/
           return '<img src="icon:' + p + '" title="#' + pokeInfo.readableNum(p) + " " + poke(p) + (shinyBG && pokeInfo.shiny(p) ? '" style="background:yellow"' : '"') + '>';
        },
        sprite: function(poke) {
            var ret = [];
            ret += "<img src='pokemon:num=";
            //ret += pokeInfo.readableNum(poke);
            ret += poke;
            if (pokeInfo.shiny(poke)) {
                ret += "&shiny=true";
            }
            ret += "&gen=6'>";
            return ret;
        },
        valid: function(poke) {
            return sys.pokemon(poke) !== "Missingno";
        },
        calcForme: function(base, forme) {
            return parseInt(base,10) + parseInt(forme << 16, 10);
        }
    };
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
        "1":{"evo":2,"candies":207},"2":{"evo":3,"candies":656},"4":{"evo":5,"candies":207},"5":{"evo":6,"candies":668},"7":{"evo":8,"candies":207},"8":{"evo":9,"candies":663},"10":{"evo":11,"candies":105},"11":{"evo":12,"candies":332},"13":{"evo":14,"candies":105},"14":{"evo":15,"candies":332},"16":{"evo":17,"candies":178},"17":{"evo":18,"candies":402},"19":{"evo":20,"candies":347},"21":{"evo":22,"candies":371},"23":{"evo":24,"candies":368},"25":{"evo":26,"candies":407},"27":{"evo":28,"candies":378},"29":{"evo":30,"candies":186},"30":{"evo":31,"candies":424},"32":{"evo":33,"candies":186},"33":{"evo":34,"candies":424},"35":{"evo":36,"candies":406},"37":{"evo":38,"candies":424},"39":{"evo":40,"candies":365},"41":{"evo":42,"candies":232},"42":{"evo":169,"candies":449},"43":{"evo":44,"candies":201},"44":{"evo":[45,182],"candies":412},"46":{"evo":47,"candies":340},"48":{"evo":49,"candies":378},"50":{"evo":51,"candies":340},"52":{"evo":53,"candies":370},"54":{"evo":55,"candies":420},"56":{"evo":57,"candies":382},"58":{"evo":59,"candies":466},"60":{"evo":61,"candies":196},"61":{"evo":[62,186],"candies":424},"63":{"evo":64,"candies":204},"64":{"evo":65,"candies":575},"66":{"evo":67,"candies":207},"67":{"evo":68,"candies":424},"69":{"evo":70,"candies":199},"70":{"evo":71,"candies":412},"72":{"evo":73,"candies":433},"74":{"evo":75,"candies":199},"75":{"evo":76,"candies":416},"77":{"evo":78,"candies":420},"79":{"evo":[80,199],"candies":412},"81":{"evo":82,"candies":237},"82":{"evo":462,"candies":449},"84":{"evo":85,"candies":386},"86":{"evo":87,"candies":399},"88":{"evo":89,"candies":420},"90":{"evo":91,"candies":441},"92":{"evo":93,"candies":207},"93":{"evo":94,"candies":575},"95":{"evo":208,"candies":428},"96":{"evo":97,"candies":406},"98":{"evo":99,"candies":399},"100":{"evo":101,"candies":403},"102":{"evo":103,"candies":437},"104":{"evo":105,"candies":357},"108":{"evo":463,"candies":433},"109":{"evo":110,"candies":412},"111":{"evo":112,"candies":247},"112":{"evo":464,"candies":449},"113":{"evo":242,"candies":621},"114":{"evo":465,"candies":449},"116":{"evo":117,"candies":224},"117":{"evo":230,"candies":454},"118":{"evo":119,"candies":378},"120":{"evo":121,"candies":437},"123":{"evo":212,"candies":420},"125":{"evo":466,"candies":454},"126":{"evo":467,"candies":454},"129":{"evo":130,"candies":454},"133":{"evo":[470,471,135,134,136,196,197,700],"candies":656},"137":{"evo":233,"candies":263},"138":{"evo":139,"candies":416},"140":{"evo":141,"candies":416},"147":{"evo":148,"candies":214},"148":{"evo":149,"candies":699},"152":{"evo":153,"candies":207},"153":{"evo":154,"candies":656},"155":{"evo":156,"candies":207},"156":{"evo":157,"candies":668},"158":{"evo":159,"candies":207},"159":{"evo":160,"candies":663},"161":{"evo":162,"candies":349},"163":{"evo":164,"candies":371},"165":{"evo":166,"candies":328},"167":{"evo":168,"candies":328},"170":{"evo":171,"candies":386},"172":{"evo":25,"candies":163},"173":{"evo":35,"candies":165},"174":{"evo":39,"candies":138},"175":{"evo":176,"candies":207},"176":{"evo":468,"candies":627},"177":{"evo":178,"candies":395},"179":{"evo":180,"candies":186},"180":{"evo":181,"candies":428},"183":{"evo":184,"candies":353},"187":{"evo":188,"candies":173},"188":{"evo":189,"candies":386},"190":{"evo":424,"candies":405},"191":{"evo":192,"candies":357},"193":{"evo":469,"candies":433},"194":{"evo":195,"candies":361},"198":{"evo":430,"candies":424},"200":{"evo":429,"candies":416},"204":{"evo":205,"candies":391},"207":{"evo":472,"candies":428},"209":{"evo":210,"candies":378},"215":{"evo":461,"candies":428},"216":{"evo":217,"candies":420},"218":{"evo":219,"candies":344},"220":{"evo":221,"candies":230},"221":{"evo":473,"candies":445},"223":{"evo":224,"candies":403},"228":{"evo":229,"candies":420},"231":{"evo":232,"candies":420},"233":{"evo":474,"candies":449},"236":{"evo":[107,106,237],"candies":382},"238":{"evo":124,"candies":382},"239":{"evo":125,"candies":250},"240":{"evo":126,"candies":252},"246":{"evo":247,"candies":209},"247":{"evo":248,"candies":699},"252":{"evo":253,"candies":207},"253":{"evo":254,"candies":663},"255":{"evo":256,"candies":207},"256":{"evo":257,"candies":663},"258":{"evo":259,"candies":207},"259":{"evo":260,"candies":669},"261":{"evo":262,"candies":353},"263":{"evo":264,"candies":353},"265":{"evo":[266,268],"candies":105},"266":{"evo":267,"candies":332},"268":{"evo":269,"candies":323},"270":{"evo":271,"candies":173},"271":{"evo":272,"candies":552},"273":{"evo":274,"candies":173},"274":{"evo":275,"candies":403},"276":{"evo":277,"candies":361},"278":{"evo":279,"candies":361},"280":{"evo":281,"candies":142},"281":{"evo":[282,475],"candies":435},"283":{"evo":284,"candies":348},"285":{"evo":286,"candies":386},"287":{"evo":288,"candies":224},"288":{"evo":289,"candies":781},"290":{"evo":[291,292],"candies":291},"293":{"evo":294,"candies":184},"294":{"evo":295,"candies":412},"296":{"evo":297,"candies":398},"298":{"evo":183,"candies":128},"299":{"evo":476,"candies":441},"300":{"evo":301,"candies":319},"304":{"evo":305,"candies":219},"305":{"evo":306,"candies":610},"307":{"evo":308,"candies":344},"309":{"evo":310,"candies":399},"315":{"evo":407,"candies":433},"316":{"evo":317,"candies":392},"318":{"evo":319,"candies":386},"320":{"evo":321,"candies":420},"322":{"evo":323,"candies":575},"325":{"evo":326,"candies":395},"328":{"evo":329,"candies":173},"329":{"evo":330,"candies":598},"331":{"evo":332,"candies":399},"333":{"evo":334,"candies":412},"339":{"evo":340,"candies":393},"341":{"evo":342,"candies":393},"343":{"evo":344,"candies":420},"345":{"evo":346,"candies":416},"347":{"evo":348,"candies":416},"349":{"evo":[350],"candies":454},"353":{"evo":354,"candies":382},"355":{"evo":356,"candies":232},"356":{"evo":477,"candies":441},"360":{"evo":202,"candies":340},"361":{"evo":[362,478],"candies":403},"363":{"evo":364,"candies":209},"364":{"evo":365,"candies":445},"366":{"evo":[367,368],"candies":407},"371":{"evo":372,"candies":214},"372":{"evo":373,"candies":699},"374":{"evo":375,"candies":214},"375":{"evo":376,"candies":699},"387":{"evo":388,"candies":207},"388":{"evo":389,"candies":656},"390":{"evo":391,"candies":207},"391":{"evo":392,"candies":668},"393":{"evo":394,"candies":207},"394":{"evo":395,"candies":663},"396":{"evo":397,"candies":173},"397":{"evo":398,"candies":407},"399":{"evo":400,"candies":344},"401":{"evo":402,"candies":323},"403":{"evo":404,"candies":185},"404":{"evo":405,"candies":439},"406":{"evo":315,"candies":204},"408":{"evo":409,"candies":416},"410":{"evo":411,"candies":416},"412":{"evo":[413,414],"candies":356},"415":{"evo":416,"candies":398},"418":{"evo":419,"candies":416},"420":{"evo":421,"candies":378},"422":{"evo":423,"candies":399},"425":{"evo":426,"candies":418},"427":{"evo":428,"candies":403},"431":{"evo":432,"candies":380},"433":{"evo":358,"candies":357},"434":{"evo":435,"candies":402},"436":{"evo":437,"candies":420},"438":{"evo":185,"candies":344},"439":{"evo":122,"candies":386},"440":{"evo":113,"candies":230},"443":{"evo":444,"candies":209},"444":{"evo":445,"candies":699},"446":{"evo":143,"candies":454},"447":{"evo":448,"candies":604},"449":{"evo":450,"candies":441},"451":{"evo":452,"candies":420},"453":{"evo":454,"candies":412},"456":{"evo":457,"candies":386},"458":{"evo":226,"candies":391},"459":{"evo":460,"candies":415},"495":{"evo":496,"candies":211},"496":{"evo":497,"candies":660},"498":{"evo":499,"candies":213},"499":{"evo":500,"candies":660},"501":{"evo":502,"candies":211},"502":{"evo":503,"candies":660},"504":{"evo":505,"candies":353},"506":{"evo":507,"candies":189},"507":{"evo":508,"candies":420},"509":{"evo":510,"candies":375},"511":{"evo":512,"candies":418},"513":{"evo":514,"candies":418},"515":{"evo":516,"candies":418},"517":{"evo":518,"candies":409},"519":{"evo":520,"candies":183},"520":{"evo":521,"candies":410},"522":{"evo":523,"candies":417},"524":{"evo":525,"candies":199},"525":{"evo":526,"candies":433},"527":{"evo":528,"candies":357},"529":{"evo":530,"candies":427},"532":{"evo":533,"candies":207},"533":{"evo":534,"candies":424},"535":{"evo":536,"candies":196},"536":{"evo":537,"candies":428},"540":{"evo":541,"candies":194},"541":{"evo":542,"candies":420},"543":{"evo":544,"candies":184},"544":{"evo":545,"candies":407},"546":{"evo":547,"candies":403},"548":{"evo":549,"candies":403},"551":{"evo":552,"candies":179},"552":{"evo":553,"candies":597},"554":{"evo":555,"candies":403},"557":{"evo":558,"candies":399},"559":{"evo":560,"candies":410},"562":{"evo":563,"candies":406},"564":{"evo":565,"candies":416},"566":{"evo":567,"candies":652},"568":{"evo":569,"candies":398},"570":{"evo":571,"candies":428},"572":{"evo":573,"candies":395},"574":{"evo":575,"candies":199},"575":{"evo":576,"candies":412},"577":{"evo":578,"candies":189},"578":{"evo":579,"candies":412},"580":{"evo":581,"candies":397},"582":{"evo":583,"candies":201},"583":{"evo":584,"candies":449},"585":{"evo":586,"candies":399},"588":{"evo":589,"candies":416},"590":{"evo":591,"candies":390},"592":{"evo":593,"candies":403},"595":{"evo":596,"candies":396},"597":{"evo":598,"candies":411},"599":{"evo":600,"candies":224},"600":{"evo":601,"candies":437},"602":{"evo":603,"candies":207},"603":{"evo":604,"candies":433},"605":{"evo":606,"candies":407},"607":{"evo":608,"candies":189},"608":{"evo":609,"candies":598},"610":{"evo":611,"candies":209},"611":{"evo":612,"candies":621},"613":{"evo":614,"candies":407},"616":{"evo":617,"candies":416},"619":{"evo":620,"candies":428},"622":{"evo":623,"candies":555},"624":{"evo":625,"candies":412},"627":{"evo":628,"candies":428},"629":{"evo":630,"candies":428},"633":{"evo":634,"candies":214},"634":{"evo":635,"candies":699},"636":{"evo":637,"candies":462},"650":{"evo":651,"candies":207},"651":{"evo":652,"candies":663},"653":{"evo":654,"candies":209},"654":{"evo":655,"candies":668},"656":{"evo":657,"candies":207},"657":{"evo":658,"candies":663},"659":{"evo":660,"candies":355},"661":{"evo":662,"candies":195},"662":{"evo":663,"candies":624},"664":{"evo":665,"candies":109},"665":{"evo":666,"candies":345},"667":{"evo":668,"candies":426},"669":{"evo":670,"candies":189},"670":{"evo":671,"candies":464},"672":{"evo":673,"candies":446},"674":{"evo":675,"candies":416},"677":{"evo":678,"candies":391},"679":{"evo":680,"candies":228},"680":{"evo":681,"candies":598},"682":{"evo":683,"candies":388},"684":{"evo":685,"candies":403},"686":{"evo":687,"candies":405},"688":{"evo":689,"candies":420},"690":{"evo":691,"candies":415},"692":{"evo":693,"candies":420},"694":{"evo":695,"candies":404},"696":{"evo":697,"candies":438},"698":{"evo":699,"candies":651},"704":{"evo":705,"candies":231},"705":{"evo":706,"candies":699},"708":{"evo":709,"candies":398},"710":{"evo":711,"candies":415},"712":{"evo":713,"candies":432},"714":{"evo":715,"candies":449}
    };
    var devolutions = {
        "2":1,"3":2,"5":4,"6":5,"8":7,"9":8,"11":10,"12":11,"14":13,"15":14,"17":16,"18":17,"20":19,"22":21,"24":23,"26":25,"28":27,"30":29,"31":30,"33":32,"34":33,"36":35,"38":37,"40":39,"42":41,"169":42,"44":43,"45":44,"182":44,"47":46,"49":48,"51":50,"53":52,"55":54,"57":56,"59":58,"61":60,"62":61,"186":61,"64":63,"65":64,"67":66,"68":67,"70":69,"71":70,"73":72,"75":74,"76":75,"78":77,"80":79,"199":79,"82":81,"462":82,"85":84,"87":86,"89":88,"91":90,"93":92,"94":93,"208":95,"97":96,"99":98,"101":100,"103":102,"105":104,"463":108,"110":109,"112":111,"464":112,"242":113,"465":114,"117":116,"230":117,"119":118,"121":120,"212":123,"466":125,"467":126,"130":129,"470":133,"471":133,"135":133,"134":133,"136":133,"196":133,"197":133,"700":133,"233":137,"139":138,"141":140,"148":147,"149":148,"153":152,"154":153,"156":155,"157":156,"159":158,"160":159,"162":161,"164":163,"166":165,"168":167,"171":170,"25":172,"35":173,"39":174,"176":175,"468":176,"178":177,"180":179,"181":180,"184":183,"188":187,"189":188,"424":190,"192":191,"469":193,"195":194,"430":198,"429":200,"205":204,"472":207,"210":209,"461":215,"217":216,"219":218,"221":220,"473":221,"224":223,"229":228,"232":231,"474":233,"107":236,"106":236,"237":236,"124":238,"125":239,"126":240,"247":246,"248":247,"253":252,"254":253,"256":255,"257":256,"259":258,"260":259,"262":261,"264":263,"266":265,"268":265,"267":266,"269":268,"271":270,"272":271,"274":273,"275":274,"277":276,"279":278,"281":280,"282":281,"475":281,"284":283,"286":285,"288":287,"289":288,"291":290,"292":290,"294":293,"295":294,"297":296,"183":298,"476":299,"301":300,"305":304,"306":305,"308":307,"310":309,"407":315,"317":316,"319":318,"321":320,"323":322,"326":325,"329":328,"330":329,"332":331,"334":333,"340":339,"342":341,"344":343,"346":345,"348":347,"350":349,"354":353,"356":355,"477":356,"202":360,"362":361,"478":361,"364":363,"365":364,"367":366,"368":366,"372":371,"373":372,"375":374,"376":375,"388":387,"389":388,"391":390,"392":391,"394":393,"395":394,"397":396,"398":397,"400":399,"402":401,"404":403,"405":404,"315":406,"409":408,"411":410,"413":412,"414":412,"416":415,"419":418,"421":420,"423":422,"426":425,"428":427,"432":431,"358":433,"435":434,"437":436,"185":438,"122":439,"113":440,"444":443,"445":444,"143":446,"448":447,"450":449,"452":451,"454":453,"457":456,"226":458,"460":459,"496":495,"497":496,"499":498,"500":499,"502":501,"503":502,"505":504,"507":506,"508":507,"510":509,"512":511,"514":513,"516":515,"518":517,"520":519,"521":520,"523":522,"525":524,"526":525,"528":527,"530":529,"533":532,"534":533,"536":535,"537":536,"541":540,"542":541,"544":543,"545":544,"547":546,"549":548,"552":551,"553":552,"555":554,"558":557,"560":559,"563":562,"565":564,"567":566,"569":568,"571":570,"573":572,"575":574,"576":575,"578":577,"579":578,"581":580,"583":582,"584":583,"586":585,"589":588,"591":590,"593":592,"596":595,"598":597,"600":599,"601":600,"603":602,"604":603,"606":605,"608":607,"609":608,"611":610,"612":611,"614":613,"617":616,"620":619,"623":622,"625":624,"628":627,"630":629,"634":633,"635":634,"637":636,"651":650,"652":651,"654":653,"655":654,"657":656,"658":657,"660":659,"662":661,"663":662,"665":664,"666":665,"668":667,"670":669,"671":670,"673":672,"675":674,"678":677,"680":679,"681":680,"683":682,"685":684,"687":686,"689":688,"691":690,"693":692,"695":694,"697":696,"699":698,"705":704,"706":705,"709":708,"711":710,"713":712,"715":714
    };
    var megaEvolutions = {
        "3":[65539],"6":[65542, 131078],"9":[65545],"15":[65551],"18":[65554],"65":[65601],"80":[65616],"94":[65630],"115":[65651],"127":[65663],"130":[65666],"142":[65678],"150":[65686, 131222],"181":[65717],"208":[65744],"212":[65748],"214":[65750],"229":[65765],"248":[65784],"254":[65790],"257":[65793],"260":[65796],"282":[65818],"302":[65838],"303":[65839],"306":[65842],"308":[65844],"310":[65846],"319":[65855],"323":[65859],"334":[65870],"354":[65890],"359":[65895],"362":[65898],"373":[65909],"376":[65912],"380":[65916],"381":[65917],"382":[65918],"383":[65919],"384":[65920],"428":[65964],"445":[65981],"448":[65984],"460":[65996],"475":[66011],"531":[66067],"719":[66255]
    };
    var megaPokemon = [
        65539,65542,131078,65545,65551,65554,65601,65616,65630,65651,65663,65666,65678,65686,131222,65717,65744,65748,65750,65765,65784,65790,65793,65796,65818,65838,65839,65842,65844,65846,65855,65859,65870,65890,65895,65898,65909,65912,65916,65917,65918,65919,65920,65964,65981,65984,65996,66011,66067,66255
    ];
    var legendaries = [
        144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721
    ];

    /* Quest Variables */
    var arenaOpponents = {
        nub: {
            name: "Trainer Nub",
            party: [19,50,316,582,116,27,194,207,200,570,489,"235",236,624,513,511,417,147],
            power: [10, 60],
            postArgs: {
                rewardAmt: 0,
                moneyReward: 5,
                cooldown: 0.1667,
                noRecords: true,
                taunt: true
            },
            desc: "Arena NPC"
        },
        pink: {
            name: "Trainer Pink",
            party: ["36",80,222,700,594,706,65838,472,205,423,308,620,368,429,510,151],
            power: [60, 130],
            postArgs: {
                rewardAmt: 1,
                cooldown: 0.75
            },
            desc: "Arena NPC"
        },
        mustard: {
            name: "Trainer Mustard",
            party: [65,131743,38,203,"26",560,297,563,145,71,479,65964,15,28,135],
            power: [90, 170],
            postArgs: {
                rewardAmt: 2,
                cooldown: 1.25
            },
            desc: "Arena NPC"
        },
        cyan: {
            name: "Trainer Cyan",
            party: [448,202,539,476,635,593,376,"171",65959,445,66091,214,378,658,465],
            power: [110, 200],
            postArgs: {
                rewardAmt: 3,
                cooldown: 1.75
            },
            desc: "Arena NPC"
        },
        crimson: {
            name: "Trainer Crimson",
            party: [131078,101,625,"663",212,342,553,538,721,149,45,197087,168,571,213, 308, 702, 702],
            power: [150, 300],
            postArgs: {
                rewardAmt: 6,
                cooldown: 2.75
            },
            desc: "Arena NPC"
        },
        rainbow: {
            name: "Trainer Rainbow",
            party: [721,483,66023,462,272,442,411,227,429,563,323,208,630,373,65790,230,"59",66217],
            power: [200, 380],
            postArgs: {
                rewardAmt: 10,
                cooldown: 4
            },
            desc: "Arena NPC"
        }
    };
    var recipeData = { //Makes = how many are made when the recipe is completed
        "prima materia" : {
            "cooldown" : 12,
            "reward" : {
                "@materia" : 1
            },
            "ingredients" : {
                "@safari" : 400
            },
            "failChance" : 0.03,
            "transmutation" : true,
            "immediate" : false,
            "failUses" : {
                "@safari" : 40
            }
        },
        "master ball" : {
            "cooldown" : 24,
            "reward" : {
                "@master" : 1
            },
            "ingredients" : {
                "@materia" : 1,
                "@fragment" : 5
            },
            "failChance" : 0.05,
            "transmutation" : true,
            "immediate" : false,
            "failUses" : {
                "@materia" : 1
            }
        },
        "cherry delight" : {
            "cooldown" : 2,
            "reward" : {
                "@cherry" : 2
            },
            "ingredients" : {
                "@materia" : 1,
                "@bait" : 50,
                "@honey" : 2,
                "@dust" : 50,
                "@bigpearl" : 2
            },
            "failChance" : 0.02,
            "transmutation" : true,
            "immediate" : false,
            "failUses" : {
                "@bait" : 50
            }
        },
        "big pearl" : {
            "cooldown" : 1,
            "reward" : {
                "@bigpearl" : 15
            },
            "ingredients" : {
                "@pearl" : 50
            },
            "failChance" : 0,
            "transmutation" : false,
            "immediate" : false
        },
        "ampere gem" : {
            "cooldown" : 2,
            "reward" : {
                "@gem" : 1
            },
            "ingredients" : {
                "@itemfinder" : 15
            },
            "failChance" : 0.8,
            "transmutation" : false,
            "immediate" : false,
            "failUses" : {
                "@itemfinder" : 15
            }
        },
        "mega stone" : {
            "cooldown" : 8,
            "reward" : {
                "@mega" : 1
            },
            "ingredients" : {
                "@gem" : 20,
                "@eviolite" : 4,
                "@materia" : 1
            },
            "failChance" : 0,
            "transmutation" : true,
            "immediate" : false
        },
        "mono ball" : {
            "cooldown" : 2,
            "reward" : {
                "@mono" : 20
            },
            "ingredients" : {
                "@blkapricorn" : 10,
                "@whtapricorn" : 10
            },
            "failChance" : 0,
            "transmutation" : true,
            "immediate" : false
        },
        "golden bait" : {
            "cooldown" : 4,
            "reward" : {
                "@golden" : 5
            },
            "ingredients" : {
                "@bait" : 80,
                "@luxury" : 5,
                "@myth" : 5,
                "@premier" : 10,
                "@nugget" : 1
            },
            "failChance" : 0,
            "transmutation" : true,
            "immediate" : false
        }
    };
    
    /* Misc Variables */
    var stopQuests = {"collector": false, "scientist": false, "arena": false, "wonder": false, "tower": false, "pyramid": false, "alchemist": false, "decoration": false };
    var tradeRequests = {};
    var challengeRequests = {};
    var pyramidRequests = {};
    var currentBattles = [];
    var currentPyramids = [];
    var currentAuctions = [];
    var lastContests = [];
    var gachaJackpotAmount = 200; //Jackpot for gacha tickets. Number gets divided by 10 later.
    var gachaJackpot = (SESSION.global() && SESSION.global().safariGachaJackpot ? SESSION.global().safariGachaJackpot : gachaJackpotAmount);
    var allTrackers = (SESSION.global() && SESSION.global().allTrackers ? SESSION.global().allTrackers : ["safari warden"]);
    var dailyBoost;
    var scientistQuest;
    var ccatch = "ccatch";
    var ccatch2 = "ccatchh";
    var allowedSharedIPNames = [];
    var forbiddenNames = ["on", "off", "cancel", "name"];
    }

    /* Safari Functions */
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
    function hasSave(name) {
        if (Object.keys(rawPlayers.hash).contains(name.toLowerCase())) {
            return true;
        }
        return false;
    }
    function themeName(obj) {
        if (Array.isArray(obj)) {
            return readable(obj.map(function(x){
                if (x === "none") {
                    return "Default";
                } else {
                    return contestThemes[x].name;
                }
            }), "or");
        }
        if (obj in contestThemes) {
            return contestThemes[obj].name;
        }
        return "Default";
    }
    function loadLastId () {
        try {
            return parseInt(permObj.get("lastIdAssigned"), 10);
        } catch (err) {
            return 0;
        }
    }
    function validPlayers (scope, src, tar, selfmsg) {
        var self = (scope === "self" || scope === "both");
        if (self) {
            var player = getAvatar(src);
            if (!player) {
                safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
                return false;
            }
        }

        var other = (scope === "target" || scope === "both");
        if (other) {
            var targetId = sys.id(tar);
            if (!targetId || !sys.isInChannel(targetId, safchan)) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return false;
            }
            if ((targetId == src || sys.ip(targetId) === sys.ip(src)) && selfmsg) {
                safaribot.sendMessage(src, selfmsg, safchan);
                return false;
            }
            var target = getAvatar(targetId);
            if (!target) {
                safaribot.sendMessage(src, "This person doesn't have a Safari Save!", safchan);
                return false;
            }
        }
        return true;
    }
    function canLosePokemon(src, data, verb, cantBecause, loseCount) {
        if (!validPlayers("self", src)) {
            return;
        }
        if (!cantBecause) {
            if (contestCount > 0) {
                safaribot.sendMessage(src, "You can't " + verb + " a Pokémon during a contest!", safchan);
                return false;
            }
            if (safari.isBattling(sys.name(src))) {
                safaribot.sendMessage(src, "You can't " + verb + " a Pokémon during a battle!", safchan);
                return;
            }
            if (currentEvent && currentEvent.isInEvent(sys.name(src))) {
                safaribot.sendMessage(src, "You can't " + verb + " a Pokémon during an event!", safchan);
                return;
            }
        }
        var amt = loseCount || 1;

        var player = getAvatar(src);
        if (player.pokemon.length <= amt) {
            safaribot.sendMessage(src, "You can't " + verb + " your remaining Pokémon!", safchan);
            return false;
        }
        var input = data.split(":");
        var info = getInputPokemon(input[0]);
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
        if (amt > 1 && amt > count) {
            safaribot.sendMessage(src, "You do not have " + amt + " of that Pokémon!", safchan);
            return false;
        }
        if (player.party.length == 1 && player.party[0] === id && count <= 1) {
            safaribot.sendMessage(src, "You can't " + verb + " the only Pokémon in your party!", safchan);
            return false;
        }
        var pCount = countRepeated(player.party, id);
        if (amt > 1 && pCount === player.party.length && amt >= pCount && count <= amt) {
            safaribot.sendMessage(src, "You can't " + verb + " all the Pokémon in your party!", safchan);
            return false;
        }
        if (player.starter === id && count <= amt) {
            safaribot.sendMessage(src, "You can't " + verb + " your starter Pokémon!", safchan);
            return false;
        }
        if (info.input in player.shop && player.shop[info.input].limit >= count) {
            safaribot.sendMessage(src, "You need to remove " + info.name + " from your shop before you can " + verb + " it!", safchan);
            return false;
        }
        if (pokeInfo.forme(info.num) > 0 && isMega(info.num)) {
            safaribot.sendMessage(src, "You can't " + verb + " a Pokémon while they are Mega Evolved!", safchan);
            return false;
        }
        return true;
    }
    function chance(value) {
        return Math.random() < value;
    }
    function cantBecause(src, action, arr, item) {
        var player = getAvatar(src);
        if (arr.contains("tutorial")) {
            if (player.tutorial.inTutorial) {
                safaribot.sendHtmlMessage(src, "You cannot " + action + " at this stage in the tutorial! If you forgot what to do, use " + link("/tutorial") + ".", safchan);
                return true;
            }
        }

        if (item) {
            if (!(item in itemData)) {
                safaribot.sendMessage(src,  item + " is not a valid item!", safchan);
                return true;
            }
            if (arr.contains("item")) {
                if (player.balls[item] < 1) {
                    safaribot.sendMessage(src, "You don't have any " + finishName(item) + "!", safchan);
                    return true;
                }
            }
        }
        if (arr.contains("contest")) {
            if (contestCount > 0) {
                safaribot.sendMessage(src, "You can't " + action + " during a contest!", safchan);
                return true;
            }
        }
        if (arr.contains("wild")) {
            if (currentPokemon) {
                safaribot.sendMessage(src, "You can't " + action + " while a Wild Pokemon is out!", safchan);
                return true;
            }
        }
        if (arr.contains("precontest")) {
            if (contestCooldown <= 181) {
                safaribot.sendMessage(src, "You can't " + action + " with less than 3 minutes before the next contest starts!", safchan);
                return true;
            }
        }
        if (arr.contains("auction")) {
            if (safari.isInAuction(sys.name(src))) {
                safaribot.sendMessage(src, "You can't " + action + " while participating in an auction!", safchan);
                return true;
            }
        }
        if (arr.contains("battle")) {
            if (safari.isBattling(sys.name(src))) {
                safaribot.sendMessage(src, "You can't " + action + " during a battle!", safchan);
                return true;
            }
        }
        if (arr.contains("event") && currentEvent) {
            if (currentEvent.isInEvent(sys.name(src))) {
                safaribot.sendMessage(src, "You can't " + action + " during an event!", safchan);
                return true;
            }
        }
        if (arr.contains("pyramid")) {
            for (var p in currentPyramids) {
                if (currentPyramids[p].isInPyramid(sys.name(src))) {
                    safaribot.sendMessage(src, "You can't " + action + " while inside the Pyramid!", safchan);
                    return true;
                }
            }
        }
        return false;
    }
    function tutorMsg(src, mess) {
        if (![".", "?", "!"].contains(mess.charAt(mess.length-1))) {
            mess = mess + ".";
        }
        tutorbot.sendHtmlMessage(src, "<font color='DarkOrchid'>" + mess + "</font>", safchan);
    }
    function advanceTutorial(src, step) {
        var player = getAvatar(src);
        player.tutorial.step = step;
        safari.progressTutorial(src, step);
    }
    function welcomePack(src, complete) {
        var player = getAvatar(src);
        player.tutorial.inTutorial = false;

        var rew = [];
        if (complete) {
            var cash = 300;
            player.money = cash;
            var giftpack = { safari: 30, great: 5, ultra: 1, dust: 100, itemfinder: 30, golden: 5};
            for (var e in giftpack) {
                if (giftpack.hasOwnProperty(e)) {
                    player.balls[e] = giftpack[e];
                    rew.push(plural(giftpack[e], e));
                }
            }
            player.balls.permfinder = 0;
            player.records.goldenBaitWeak = 5;

            var johto;
            switch (player.starter) {
                case 1: johto = 155; player.pokemon.push(155); break;
                case 4: johto = 158; player.pokemon.push(158); break;
                case 7: johto = 152; player.pokemon.push(152); break;
            }
            safaribot.sendMessage(src, "You received $" + cash + ", " + rew.join(", ") + ", and " + an(sys.pokemon(johto)) + "!", safchan);
            tutorbot.sendHtmlMessage(src, toColor("One last advice: You can use " + link("/gbait") + " to use " + an(finishName("golden")) + ", a special and more efficient bait!", "DarkOrchid"), safchan);
            //sys.sendAll("", safchan);
            //tutorbot.sendHtmlAll("<font color='DarkOrchid'>Congratulations to <b>" + html_escape(sys.name(src)) + "</b> on completing the tutorial!</font>", safchan);
            //sys.sendAll("", safchan);
        } else {
            var cash = 300;
            player.money = cash;
            var giftpack = { safari: 30, great: 5, itemfinder: 15 };
            for (var e in giftpack) {
                if (giftpack.hasOwnProperty(e)) {
                    player.balls[e] = giftpack[e];
                    rew.push(plural(giftpack[e], e));
                }
            }
            safaribot.sendMessage(src, "You received $" + cash + ", " + readable(rew, "and") + "!", safchan);
        }
    }
    function resetVars(saveContest) {
        preparationPhase = 0;
        preparationThrows = {};
        preparationFirst = null;
        baitCooldown = sys.rand(4,7);
        goldenBaitCooldown = sys.rand(8,10);
        currentPokemon = null;
        currentDisplay = null;
        wildEvent = false;
        currentPokemonCount = 1;
        lastPokemonCount = 1;
        isBaited = false;
        if (!saveContest) {
            currentTheme = null;
            contestVotes = null;
        }
    }
    function getMaxThrows(num, count, shiny) {
        var amt = maxThrows;
        var bst = getBST(num);
        if (inclusive(bst, 0, 360)) {
            amt += 7;
        } else if (inclusive(bst, 360, 420)) {
            amt += 5;
        } else if (inclusive(bst, 420, 520)) {
            amt += 3;
        } else if (!isRare(num)) {
            amt += 1;
        } else {
            amt -= 1;
        }
        amt += 2 * count;
        amt -= 2 * shiny;
        return Math.max(maxThrows, amt);
    }
    
    /* Message Functions */
    function sendAll(mess, html, system) {
        var players = sys.playersOfChannel(safchan).filter(function(x) {
            var name = sys.name(x);
            if (currentEvent && currentEvent.isInEvent(name)) {
                return false;
            }
            for (var p in currentPyramids) {
                if (currentPyramids[p].isInPyramid(name)) {
                    return false;
                }
            }
            var player = getAvatar(x);
            if (player && player.tutorial.inTutorial) {
                return false;
            }
            return true;
        });
        if (system) {
            for (var e in players) {
                sys.sendHtmlMessage(players[e], mess, safchan);
            }
        } else if (html) {
            for (var e in players) {
                safaribot.sendHtmlMessage(players[e], mess, safchan);
            }
        } else {
            for (var e in players) {
                safaribot.sendMessage(players[e], mess, safchan);
            }
        }
    }
    
    /* Time Functions */
    function now() {
        return new Date().getTime();
    }
    function timeLeft(time) {
        return Math.floor((time - now())/1000) + 1;
    }
    function timeLeftString(time) {
        return utilities.getTimeString(timeLeft(time));
    }
    function getDay(time) {
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }
    function hours(number) {
        return number * 60 * 60 * 1000;
    }
    function cdSeconds(item, value) {
        value = value || "cooldown";
        return "Cooldown: " + plural(itemData[item][value] / 1000, "second") + ".";
    }
    
    /* Data Type Functions */
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
            if (hash.hasOwnProperty(x)) {
                psum += hash[x];
                count += 1;
            }
        }
        if (psum === 0.0) {
            var j = 0;
            for (x in hash) {
                if (hash.hasOwnProperty(x)) {
                    cum = (++j) / count;
                    if (cum >= val) {
                        return x;
                    }
                }
            }
        } else {
            for (x in hash) {
                if (hash.hasOwnProperty(x)) {
                    cum += hash[x] / psum;
                    if (cum >= val) {
                        return x;
                    }
                }
            }
        }
    }
    function randomSampleObj(hash, returnId) {
        var sampled = {};
        for (var e in hash) {
            sampled[e] = hash[e].chance;
        }
        if (returnId) {
            return randomSample(sampled);
        } else {
            return hash[randomSample(sampled)];
        }
    }
    function getRange(input) {
        var range = input.split("-"), lower, upper;

        if (range.length > 1) {
            lower = parseInt(range[0], 10);
            upper = parseInt(range[1], 10);
        } else {
            lower = 0;
            upper = parseInt(range[0], 10);
        }

        if (isNaN(lower) || isNaN(upper)) {
            return null;
        }
        if (lower === 0) {
            lower = 1;
        }
        return { lower: lower, upper: upper};
    }
    function getArrayRange(arr, lower, upper) {
        var result = arr.concat();

        if (lower >= 0) {
            return result.slice(Math.max(lower-1, 0), upper);
        } else {
            return result.slice(-upper, -lower);
        }
    }
    function removeDuplicates(arr) {
        var result = {};
        for (var x in arr) {
            result[arr[x]] = 1;
        }
        return Object.keys(result);
    }
    function compare(a,b) {
        if (a.sort < b.sort) {
            return -1;
        } else if (a.sort > b.sort) {
            return 1;
        } else {
            return 0;
        }
    }
    function countProps(obj) { //Stolen from http://stackoverflow.com/a/3849480
        var count = 0;
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                count++;
            }
        }
        return count;
    }
    function objectEquals(v1, v2) {
        if (typeof(v1) !== typeof(v2)) {
            return false;
        }

        if (typeof(v1) === "function") {
            return v1.toString() === v2.toString();
        }

        if (v1 instanceof Object && v2 instanceof Object) {
            if (countProps(v1) !== countProps(v2)) {
                return false;
            }
            var r = true;
            for (var k in v1) {
                r = objectEquals(v1[k], v2[k]);
                if (!r) {
                    return false;
                }
            }
            return true;
        } else {
            return v1 === v2;
        }
    }
    function inclusive(value, lower, upper) {
        return lower <= value && value <= upper;
    }
    function toCommandData(str, props) {
        var out = {};
        var data = str.split(str.indexOf(":::") !== -1 && str.indexOf(":::") <= str.search(/:(?!:)/) ? ":::" : ":");
        for (var p = 0; p < props.length; p++) {
            out[props[p]] = data.length > p && data[p].trim() !== "" ? data[p].trim() : null;
        }
        return out;
    }
    
    /* Formatting Functions */
    function cap(string, sentence) {
        if (sentence) {
            return string.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
        } else {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }
    function plural(qty, string, forceNumber) {
        var input = getInput(string);
        var q = parseFloat(qty);
        var plur = isNaN(q) || Math.abs(q) !== 1;
        qty = addComma(qty);
        if (input) {
            if (input.type === "poke") {
                if (forceNumber) {
                    return qty + " " + input.name;
                } else if (plur) {
                    return toWord(qty) + " " + input.name;
                } else {
                    return an(input.name);
                }
            }
            if (input.type === "item" && !isNaN(q)) {
                return qty + " " + (plur ? es(input.name) : input.name);
            }
        }
        return qty + " " + (plur ? es(string) : string);
    }
    function toWord(num) {
        //Realistically shouldn't need more than this. Also add comma will mess up anything 1000+
        return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][num] || num;
    }
    function an(string) {
        var vowels = "aeioux";
        string = string + ""; //For the numbers
        if (vowels.indexOf(string.charAt(0).toLowerCase()) > -1 || string.charAt(0) === "8" || string === "11" || string === "18") {
            string = "an " + string;
        } else {
            string = "a " + string;
        }
        return string;
    }
    function es(string) {
        var end = string.charAt(string.length-1); //Last character would be the quotes
        var preEnd = string.charAt(string.length-2);
        var lasttwo = preEnd + end;
        if (["ch", "sh", "ss"].contains(lasttwo) || ["x", "z"].contains(end)) {
            return string + "es";
        }
        if (end === "s") {
            return string;
        }
        if (end === "y" && !["a", "e", "i", "o", "u"].contains(preEnd)) {
            return string.slice(0, -1) + "ies";
        }
        return string + "s";
    }
    function readable(arr, last_delim) {
        if (!Array.isArray(arr)) {
            return arr;
        }
        if (arr.length > 1) {
            return arr.slice(0, arr.length - 1).join(", ") + " " + (last_delim ? last_delim : "and") + " " + arr.slice(-1)[0];
        } else if (arr.length == 1) {
            return arr[0];
        } else {
            return "";
        }
    }
    function getOrdinal(n) {
        //Shamelessly stolen from http://stackoverflow.com/questions/23291256/ext-form-field-number-formatting-the-value
        var s=["th","st","nd","rd"],
        v=n%100;
        return n+(s[(v-20)%10]||s[v]||s[0]);
    }
    function addComma(num) {
        if (typeof num !== "number") {
            return num;
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function link(string, string2, setmsg) {
        string2 = string2 || string;
        return "<a href=\"po:" + (setmsg ? "setmsg" : "send") + "/" + html_escape(string) + "\">" + html_escape(string2) + "</a>";
    }
    function toColor(str, color) {
        return "<font color='" + color + "'>" + str + "</font>";
    }
    function addFlashTag(name) {
        return "<!--f-->" + name + "<!--f-->";
    }
    function addColorTag(name) {
        return "<!--c-->" + name + "<!--c-->";
    }
    function toFlashing(message, name) { //Totally not stolen from tours
        var newmessage = message;
        var flashtag = "<!--f-->";
        var htmlname = html_escape(name);
        var regex = new RegExp(flashtag+htmlname+flashtag, "gi");
        var newregex1 = "";
        if (sys.os(sys.id(name)) !== "android") {
            newregex1 = "<font style='BACKGROUND-COLOR: #FCD116'>" + htmlname.toCorrectCase() + "</font><ping/>";
        } else {
            newregex1 = "<background color='#FCD116'>" + htmlname.toCorrectCase() + "</background><ping/>";
        }
        var flashregex = new RegExp(flashtag,"g");
        newmessage = message.replace(regex,newregex1).replace(flashregex,"");
        return newmessage;
    }
    function toColored(message, name) {
        var newmessage = message;
        var flashtag = "<!--c-->";
        var htmlname = html_escape(name);
        var regex = flashtag+htmlname+flashtag;
        var newregex1 = "";
        var color = sys.id(name) ? script.getColor(sys.id(name)) : "#000000";
        if (sys.os(sys.id(name)) !== "android") {
            newregex1 = "<span style='COLOR: " + color + "'>" + htmlname + "</span>";
        } else {
            newregex1 = "<font color='"+color+"'>" + htmlname + "</font>";
        }
        var flashregex = new RegExp(flashtag,"g");
        newmessage = message.replace(regex,newregex1).replace(flashregex,"");
        return newmessage;
    }
    function percentage(num, denom, places) {
        places = places || 2;
        if (typeof num !== "number" || typeof denom !== "number") {
            return "??.??%";
        }
        if (denom === 0) {
            return "0.00%";
        }
        return (num/denom*100).toFixed(places) + "%";
    }
    function toFixed(num, digits) {
        return (+num).toFixed(digits).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1');
    }
    function escapeRegExp(str) { //From http://stackoverflow.com/a/6969486
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
    
    /* Pokemon Functions */
    function getInputPokemon(info) {
        /*
        Use this function for every time you need information about a Pokémon typed by a player (don't use for pokémon picked from player.pokemon).
        Returns an object with the following properties:
        -num: Int; Pokémon's number; Same that you would get with sys.pokeNum()
        -id: Int or String; Pokémon's id that can be added to player.pokemon
        -shiny: Boolean; If the pokémon is shiny or not
        -name: String; Pokémon's name (including Shiny prefix). Same as poke()
        -input: String; What you need to type to get to that result. Used for trade
        */
        var shiny = false, id, num, name;
        info = info.replace(/flabebe|flabébe|flabebé/gi, "flabébé").toLowerCase();

        if ((info.length > 1 && (info[0] == "*" || info[info.length-1] == "*")) || info.indexOf("shiny ") === 0) {
            shiny = true;
            info = info.replace("*", "");
            info = info.replace("shiny ", "");
        }
        num = parseInt(info, 10);
        if (isNaN(num)) {
            num = sys.pokeNum(info);
        }
        id = shiny ? num + "" : num;

        name = sys.pokemon(num);
        if (name.toLowerCase() == "missingno") {
            num = null;
        }

        return { num: num, id: id, shiny: shiny, name: poke(id), input: (shiny ? "*" : "") + name, type: "poke" };
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
    function getPrice(pokeNum, shiny, perkBonus) {
        return Math.round(getBST(pokeNum) * (shiny ? 5 : 1) * (isLegendary(pokeNum) ? 10 : 1) * (perkBonus ? perkBonus : 1));
    }
    function isMega(num) {
        return megaPokemon.indexOf(num) !== -1;
    }
    function isLegendary(num) {
        return legendaries.indexOf(pokeInfo.species(num)) !== -1;
    }
    function getInput(info) {
        var input = getInputPokemon(info);
        if (!input.num) {
            if (info[0] == "@") {
                info = info.substr(1);
            }
            info = itemAlias(info, true);
            if (allItems.indexOf(info) === -1) {
                return false;
            }
            input = {
                input: "@" + info,
                id: info,
                name: finishName(info),
                type: "item"
            };
        }

        return input;
    }
    function hasPokeInShop(src, remove) {
        var player = getAvatar(src);
        if (player.shop) {
            var isInShop = [];
            for (var e = 0; e < player.party.length; e++) {
                var id = player.party[e];
                id += typeof id === "string" ? "*" : "";

                var input = getInputPokemon(id);
                id = input.input;
                var count = countRepeated(player.pokemon, input.id);
                if (player.shop.hasOwnProperty(id)) {
                    var lim = player.shop[id].limit;
                    if (lim > 0 && count - lim < countRepeated(player.party, input.id)) {
                        if (!isInShop.contains(input.name)) {
                            isInShop.push(input.name);
                            if (remove) {
                                delete player.shop[id];
                            }
                        }
                    }
                }
            }
            if (isInShop.length > 0) {
                if (remove) {
                    safaribot.sendMessage(src, "In order to participate in the event, " + readable(isInShop, "and") + " " + (isInShop.length === 1 ? "was" : "were") + " removed from your shop because it is also in your party!", safchan);
                    return false;
                } else {
                    safaribot.sendMessage(src, "You need to remove " + readable(isInShop, "and") + " from your shop before you start this challenge!", safchan);
                    return true;
                }
            }
        }
        return false;
    }
    function isRare(id) {
        if (typeof id == "string") {
            return true;
        }
        if (isLegendary(id)) {
            return true;
        }
        var base = pokeInfo.species(id), form = pokeInfo.forme(id);
        if (form > 0 && (!(base in wildForms) || form > wildForms[base] )) {
            return true;
        }
        return false;
    }
    function findLink(id) {
        return link("/find " + poke(id), poke(id));
    }
    function generation(pokeNum, wordy) {
        var num = pokeInfo.species(pokeNum);
        var ret = 1;
        if (inclusive(num, 152, 251)) {
            ret = 2;
        } else if (inclusive(num, 252, 386)) {
            ret = 3;
        } else if (inclusive(num, 387, 493)) {
            ret = 4;
        } else if (inclusive(num, 494, 649)) {
            ret = 5;
        } else if (inclusive(num, 650, 721)) {
            ret = 6;
        }
        if (wordy) {
            return generations[ret];
        } else {
            return ret;
        }
    }
    
    /* Item & Costume Functions */
    function itemAlias(name, returnGarbage, full) {
        name = name.toLowerCase();
        for (var e in itemData) {
            if (itemData[e].aliases.indexOf(name) !== -1) {
                if (full) {
                    return itemData[e].fullName;
                } else {
                    return itemData[e].name;
                }
            }
        }
        if (returnGarbage) {
            if (name === "wild") {
                return "Wild Pokémon";
            } else if (name === "nothing") {
                return "No item";
            } else if (name === "recharge") {
                return "Recharge";
            } else if (name === "valuables") {
                return "Valuables";
            }
            return name;
        } else {
            return "safari";
        }
    }
    function finishName(name) {
        return itemAlias(name, true, true);
    }
    function costumeAlias(name, returnGarbage, full) {
        for (var e in costumeData) {
            if (costumeData[e].aliases.indexOf(name) !== -1) {
                if (full) {
                    return costumeData[e].fullName;
                } else {
                    return costumeData[e].name;
                }
            }
        }
        if (returnGarbage || name === "none") {
            return name;
        } else {
            return "error";
        }
    }
    function costumeSprite(id, android) {
        var n = costumeAlias(id);
        if (isNaN(id)) {
            if (costumeData.hasOwnProperty(n)) {
                id = costumeData[n].icon;
            } else {
                id = 1;
            }
        }
        for (var e in base64costumes) {
            if (e === costumeData[n].name) {
                return "<img src='" + base64costumes[e] + "'>";
            }
        }
        if (android) {
            return "<img src='trainer:" + id + "'>";
        } else {
            return "<img src='Themes/Classic/Trainer Sprites/" + id + ".png'>";
        }
    }
    function decorationAlias(name, returnGarbage, full) {
        if (decorations.hasOwnProperty(name)) {
            return full ? decorations[name].name : name;
        }
        var n = name.toLowerCase(), dec;
        for (var e in decorations) {
            dec = decorations[e];
            if (n === dec.name.toLowerCase() || (dec.aliases && dec.aliases.contains(n))) {
                if (full) {
                    return dec.name;
                } else {
                    return e;
                }
            }
        }
        if (returnGarbage || name === "none") {
            return name;
        } else {
            return "error";
        }
    }
    function isBall(item) {
        return item in itemData && itemData[item].type === "ball";
    }
    function bagRow (player, arr, isAndroid, textOnly, first) {
        var ret = [], item, item2;
        if (textOnly) {
            if (first) {
                ret += "<br /><b>Inventory</b><br />";
                ret += "Money: $" + addComma(player.money) + " | ";
            } else {
                ret += "<br />";
            }
            for (var i = 0; i < arr.length; i++) {
                item = itemData[arr[i]];
                if (item.name === "itemfinder") {
                    item2 = player.balls.itemfinder + player.balls.permfinder;
                } else {
                    item2 = player.balls[arr[i]];
                }
                ret += item.fullName + ": " + item2;
                if (i + 1 < arr.length) {
                    ret += " | ";
                }
            }
        } else {
            if (isAndroid) {
                var linebreak = 6;
                if (first) {
                    ret += "<br /><b>Inventory</b><br />";
                    ret += "<img src='item:274'>: $" + addComma(player.money);
                    linebreak--;
                }
                for (var i = 0; i < arr.length; i++) {
                    item = itemData[arr[i]];
                    if (item.name === "itemfinder") {
                        item2 = player.balls.itemfinder + player.balls.permfinder;
                    } else {
                        item2 = player.balls[arr[i]];
                    }
                    ret += " | <img src='";
                    var foundIcon = false;
                    for (var e in base64icons) {
                        if (e === item.name) {
                            ret += base64icons[e];
                            foundIcon = true;
                        }
                    }
                    if (!foundIcon) {
                        ret += "item:" + item.icon;
                    }
                    ret += "'>: " + item2;
                    linebreak--;
                    if (linebreak === 0 || (i + 1 == arr.length)) {
                        ret += "<br />";
                    }
                }
            } else {
                if (first) {
                    ret += "<table border = 1 cellpadding = 3><tr><th colspan=14>Inventory</th></tr><tr>";
                    ret += "<td valign=middle align=center colspan=2><img src='item:274' title='Money'></td>";
                } else {
                    ret += "<tr>";
                }
                for (var i = 0; i < arr.length; i++) {
                    item = itemData[arr[i]];
                    ret += "<td align=center><img src='";
                    var foundIcon = false;
                    for (var e in base64icons) {
                        if (e === item.name) {
                            ret += base64icons[e];
                            foundIcon = true;
                        }
                    }
                    if (!foundIcon) {
                        ret += "item:" + item.icon;
                    }

                    ret += "' title='" + item.fullName + "'></td>";
                }
                ret += "</tr><tr>";
                if (first) {
                    ret += "<td align=center colspan=2>$" + addComma(player.money) + "</td>";
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
        }
        return ret;
    }
    function toUsableBall(player, ball) {
        var picked, ballOrder = ["safari", "great", "ultra", "quick", "spy", "luxury", "heavy", "premier", "clone", "myth", "master"];

        var startFrom = 0;
        if (ball == ballOrder[0]) {
            startFrom = 1;
        }
        if (player.balls[ball] <= 0) {
            for (var e = startFrom; e < ballOrder.length; e++) {
                picked = ballOrder[e];
                if (player.balls[picked] > 0) {
                    return picked;
                }
            }
        } else {
            return ball;
        }
        return null;
    }
    function ballMacro(src, override) {
        var player = getAvatar(src);
        var name = sys.name(src);
        if (!player || sys.os(src) === "android" || (currentEvent && currentEvent.isInEvent(name)) || (player.tutorial.inTutorial && !override)) {
            return;
        }
        for (var p in currentPyramids) {
            if (currentPyramids[p].isInPyramid(name)) {
                return;
            }
        }
        var ret = "", hasBalls = false;
        for (var i = 0; i < allBalls.length; i++) {
            var e = allBalls[i];
            if (player.balls[e] > 0 && (!currentRules || !currentRules.excludeBalls || !currentRules.excludeBalls.contains(e)) && !(wildEvent && e === "master")) {
                ret += "«" + link("/" + ccatch + " " + itemData[e].name, cap(itemData[e].name)) + "» ";
                hasBalls = true;
            }
        }
        if (hasBalls) {
            safaribot.sendHtmlMessage(src, "Throw: " + ret +  "[" + link("/" + ccatch + " cancel", "Cancel") + "] ", safchan);
        }
    }
    function getCap(item) {
        return item in itemData ? (itemData[item].cap || itemCap) : itemCap;
    }
    function rewardCapCheck(player, reward, amount, withName, suppress) {
        var cap = getCap(reward);
        var master = reward === "master";
        if (player.balls[reward] + amount > cap) {
            var check = cap - player.balls[reward];
            var src = sys.id(player.id);
            if (!suppress) {
                if (src) {
                    if (master) {
                        //TODO: Change message if a better sprite idea comes up?
                        safaribot.sendMessage(src, "As you try to put it away, the " + finishName(reward) + " starts to glow very bright and then shatters in your hands. Sadly, all you could do was carefully grab a salvageable piece and stow it safely in your bag.", safchan);
                    } else if (check < 1) {
                        safaribot.sendMessage(src, "However, you didn't have any space left and were forced to discard " + (withName ?  " the " + finishName(reward) : (amount === 1 ? "it" : "them")) + "!", safchan);
                    } else {
                        safaribot.sendMessage(src, "However, you only had space for " + check + " and were forced to discard the rest" + (withName ? " of the " + finishName(reward) : "") + "!", safchan);
                    }
                }
                //player.records.itemsDiscarded += (amount - check);
            }
            if (master) {
                check = amount + player.balls[reward] - cap;
                reward = "fragment";
            }

            amount = check;
            if (amount < 0) {
                amount = 0;
            }
        }
        player.balls[reward] += amount;
    }
    function toMoney(str) {
        if (str[0] === "$") {
            str = str.substr(1);
        }
        return parseInt(str.replace(",", ""), 10);
    }
    function translateAsset(asset) {
        if (asset[0] == "$") {
            var amount = toMoney(asset);
            return {
                id: "$" + amount,
                input: asset,
                amount: amount,
                name: "$" + addComma(amount),
                type: "money"
            };
        }
        else if (asset.indexOf("@") !== -1 || allItems.contains(itemAlias(asset, true))) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            return {
                id: item,
                input: "@" + item,
                amount: amount,
                name: itemAlias(item, true, true),
                type: "item"
            };
        }
        else {
            return getInputPokemon(asset);
        }
    }
    function toStuffObj(raw) {
        var out = {}, info = raw.replace(/,/g, ":").split(":"), data, n;
        
        for (var e = 0; e < info.length; e++) {
            n = info[e].trim();
            if (!n) {
                continue;
            }
            data = translateAsset(n);
            if (data.type == "money") {
                if (!out.$) {
                    out.$ = 0;
                }
                out.$ += data.amount;
            } else if (data.type == "item" || (data.type == "poke" && data.num)) {
                if (!(data.input in out)) {
                    out[data.input] = 0;
                }
                out[data.input] += data.amount || 1;
            }
        }
        
        return out;
    }
    function toStuffInput(stuff) {
        var out = [], s, p, amt, asset;
        for (s in stuff) {
            amt = stuff[s];
            if (amt === 0) {
                continue;
            }
            if (s[0] === "$") {
                out.push("$" + amt);
            } else if (s[0] === "@" || (allItems.contains(itemAlias(s, true)))) {
                asset = s;
                if (asset[0] === "@") {
                    asset = asset.substr(1);
                }
                asset = itemAlias(asset, true);
                
                out.push((amt === 1 ? "" : amt) + "@" + asset);
            } else {
                asset = getInputPokemon(s);
                for (p = 0; p < amt; p++) {
                    out.push(asset.name);
                }
            }
        }
        return out.join(",");
    }
    function validateStuff(str) {
        var info = str.replace(/\,/g, ":").split(":"), out = [], data, n;
        for (var e = 0; e < info.length; e++) {
            n = info[e].trim();
            if (!n) {
                continue;
            }
            data = translateAsset(n);
            if ((data.type === "poke" && !data.num) || (data.type === "item" && !allItems.contains(data.id)) || (data.type === "money" && isNaN(data.amount))) {
                out.push(info[e]);
            }
        }
        return out;
    }
    function translateStuff(stuff, forceNumber) {
        if (typeof stuff === "string") {
            stuff = toStuffObj(stuff.replace(/,/g, ":"));
        }
        var out = [], s, amt, asset;
        for (s in stuff) {
            amt = stuff[s];
            if (s[0] === "$") {
                if (amt > 0) {
                    out.push("$" + addComma(amt));
                } else if (amt < 0) {
                    out.push("-$" + addComma(-amt));
                }
            } else if (s[0] === "@" || (allItems.contains(itemAlias(s, true)))) {
                asset = s;
                if (asset[0] === "@") {
                    asset = asset.substr(1);
                }
                asset = itemAlias(asset, true);
                
                if (amt !== 0) {
                    out.push(plural(amt, asset));
                }
            } else {
                asset = getInputPokemon(s);
                out.push(plural(amt, asset.input, forceNumber));
            }
        }
        return readable(out);
    }
    function giveStuff(player, stuff, rawResult) {
        var out = { gained: [], lost: [], discarded: [] }, asset, amt, total, max;
        if (!player) {
            return "nothing";
        }
        
        if (typeof stuff === "string") {
            stuff = {};
            if (asset[0] === "$") {
                stuff.$ = parseInt(asset.replace(",", "").substr(1), 10);
            } else if (asset.indexOf("@") >= 0) {
                amt = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
                asset = asset.substr(asset.indexOf("@"));
                stuff[asset] = amt;
            } else {
                asset = getInputPokemon(asset);
                stuff[asset.input] = 1;
            }
        }
        for (var s in stuff) {
            total = amt = stuff[s];
            if (s[0] === "$") {
                player.money += amt;
                if (amt > 0) {
                    if (player.money > moneyCap) {
                        out.discarded.push("$" + (player.money - moneyCap));
                        total = amt - (player.money - moneyCap);
                        player.money = moneyCap;
                    }
                    out.gained.push("$" + addComma(total));
                } else if (amt < 0) {
                    if (player.money < 0) {
                        total = amt - player.money;
                        player.money = 0;
                    }
                    out.lost.push("$" + addComma(-total));
                }
            } else if (s[0] === "@" || (allItems.contains(itemAlias(s, true)))) {
                asset = s;
                if (asset[0] === "@") {
                    asset = asset.substr(1);
                }
                asset = itemAlias(asset, true);
                
                player.balls[asset] += amt;
                max = getCap(asset);
                if (player.balls[asset] > max) {
                    out.discarded.push(plural(player.balls[asset] - max, asset));
                    total = amt - (player.balls[asset] - max);
                    player.balls[asset] = max;
                } else if (player.balls[asset] < 0) {
                    total = amt - player.balls[asset];
                    player.balls[asset] = 0;
                }
                if (asset === "entry") {
                    rafflePlayers.add(player.id, player.balls.entry);
                }
                safari.updateShop(player, asset);
                
                if (total > 0) {
                    out.gained.push(plural(total, asset));
                } else if (total < 0) {
                    out.lost.push(plural(-total, asset));
                }
            } else {
                asset = getInputPokemon(s);
                total = 0;
                if (amt > 0) {
                    for (var p = 0; p < amt; p++) {
                        player.pokemon.push(asset.id);
                        total++;
                    }
                    out.gained.push(plural(total, asset.input, rawResult));
                } else if (amt < 0) {
                    for (var p = 0; p < -amt; p++) {
                        if (!player.pokemon.contains(asset.id)) {
                            break;
                        }
                        safari.removePokemon2(player, asset.id);
                        total++;
                    }
                    out.lost.push(plural(total, asset.input, rawResult));
                }
            }
        }
        
        if (rawResult) {
            return out;
        }
        
        var res = [];
        if (out.gained.length > 0) {
            res.push("received " + readable(out.gained));
        }
        if (out.lost.length > 0) {
            res.push("lost " + readable(out.lost));
        }
        if (out.discarded.length > 0) {
            if (res.length > 0) {
                res.push("discarded " + readable(out.discarded) + " due to excess");
            } else {
                res.push("could not receive " + readable(out.discarded) + " due to excess");
            }
        }
        
        return res.length > 0 ? readable(res) : "received nothing";
    }
    function hasStuff(player, stuff) {
        var out = { missing: [], needs: [] }, asset, amt, total;
        if (!player) {
            return out;
        }
        
        if (typeof stuff === "string") {
            stuff = toStuffObj(stuff.replace(/,/g, ":"));
        }
        for (var s in stuff) {
            amt = stuff[s];
            if (s[0] === "$") {
                if (amt > 0 && player.money < amt) {
                    out.missing.push("$" + amt);
                    out.needs.push("$" + (amt - player.money));
                }
            } else if (s[0] === "@" || (allItems.contains(itemAlias(s, true)))) {
                asset = s;
                if (asset[0] === "@") {
                    asset = asset.substr(1);
                }
                asset = itemAlias(asset, true);
                
                if (amt > 0 && player.balls[asset] < amt) {
                    out.missing.push(plural(amt, asset));
                    out.needs.push(plural(amt-player.balls[asset], asset));
                }
            } else {
                asset = getInputPokemon(s);
                total = countRepeated(player.pokemon, asset.id);
                
                if (amt > 0 && total < amt) {
                    out.missing.push(plural(amt, asset.input));
                    out.needs.push(plural(amt-total, asset.input));
                }
            }
        }
        out.result = out.missing.length === 0;
        return out;
    }
    
    /* Wild Pokemon & Contests */
    this.createWild = function(dexNum, makeShiny, amt, bstLimit, leader, player, appearAs, goldenBait) {
        var num,
            pokeId,
            goldenBonus = goldenBait && player.records.goldenBaitUsed >= player.records.goldenBaitWeak,
            shiny = sys.rand(0, shinyChance - (goldenBonus ? itemData.golden.shinyBonus : 0)) < 1,
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
                var list = [], bst, e, id;
                for (e = 1; e < 722; e++) {
                    bst = "customBST" in theme && e in theme.customBST ? theme.customBST[e] : getBST(e);
                    if (this.validForTheme(e, currentTheme) && bst <= maxStats) {
                        list.push(e);
                    }
                }
                for (e in theme.include) {
                    id = theme.include[e];
                    bst = "customBST" in theme && id in theme.customBST ? theme.customBST[id] : getBST(id);
                    if (this.validForTheme(id, currentTheme) && bst <= maxStats && list.indexOf(id) === -1) {
                        list.push(id);
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
                var maxRoll = bstLimit || 600 + (goldenBonus ? itemData.golden.bstBonus : 0);
                maxStats = sys.rand(300 + (goldenBonus ? itemData.golden.minBstBonus : 0), maxRoll);
                if (leader) {
                    var list = [], loops = 0, found = false,
                        atk1 = sys.type(sys.pokeType1(leader)),
                        atk2 = sys.type(sys.pokeType2(leader)),
                        maxList = player.costume === "chef" ? costumeData.chef.rate : 7;

                    do {
                        num = sys.rand(1, 722);
                        if (getBST(num) <= maxStats) {
                            var typeBonus = this.checkEffective(atk1, atk2, sys.type(sys.pokeType1(num)), sys.type(sys.pokeType2(num)), false, player.costume === "inver");
                            if (typeBonus > 1) {
                                found = true;
                                break;
                            } else {
                                list.push(num);
                            }
                        }
                        loops++;
                    } while (list.length < maxList && loops < 50);

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
        if (isRare(num) && !dexNum) {
            amount = 1;
            if (isLegendary(num) && contestCount > 0 && contestCount % 2 === 0) {
                wildEvent = true;
            }
        }

        if (!ignoreForms && num in wildForms) {
            var pickedForm = sys.rand(0, wildForms[num] + 1);
            num = pokeInfo.calcForme(num, pickedForm);
        }
        pokeId = poke(num + (shiny ? "" : 0));
        currentPokemon = shiny ? "" + num : num;
        currentPokemonCount = lastPokemonCount = amount;
        currentThrows = getMaxThrows(num, amount, shiny);

        var disguise, appearance, multiplier = 1;
        if (appearAs) {
            disguise = true;
            appearance = appearAs.num;
            //At this point changing shiny is purely aesthetic and won't affect the caught pokemon
            shiny = appearAs.shiny;
        } else {
            disguise = [132, 151, 570, 571].contains(num);
            if (disguise) {
                appearance = sys.rand(1,722);
                if (shiny) {
                    multiplier = 5;
                }
            }
        }
        currentDisplay = (disguise ? appearance : num) + (shiny ? "" : 0);
        var currentPokemonDisplay = shiny ? "" + currentDisplay : currentDisplay;
        var currentId = poke(currentPokemonDisplay);

        if (currentDisplay === currentPokemon) {
            disguise = false;
        }
        var bst = getBST(currentDisplay) + (disguise && !isLegendary(num) ? [-5, -4, -3, 3, 4, 5].random() * multiplier : 0);

        if (amount > 1) {
            var ret = [];
            var term = amount === 2 ? "pair" : amount === 3 ? "group" : "horde";
            ret += "<hr><center>A " + term + " of wild " + currentId + " appeared! <i>(BST: " + bst + ")</i><br/>" + (wildEvent ? "<b>This is an Event Pokémon! No " + es(finishName("master")) + " allowed!</b><br/>" : "");
            for (var i = 0; i < amount; i++) {
                ret += pokeInfo.sprite(currentPokemonDisplay);
            }
            ret += "</center><hr>";
            sendAll(ret, true, true);
        } else {
            sendAll("<hr><center>" + (shiny ? "<font color='DarkOrchid'>" : "") + "A wild " + currentId + " appeared! <i>(BST: " + bst + ")</i>" + (shiny ? "</font>" : "") + "<br/>" + (wildEvent ? "<b>This is an Event Pokémon! No " + es(finishName("master")) + " allowed!</b><br/>" : "") + pokeInfo.sprite(currentPokemonDisplay) + "</center><hr>", true, true);
        }
        var onChannel = sys.playersOfChannel(safchan);
        for (var e in onChannel) {
            ballMacro(onChannel[e]);
        }
        preparationPhase = sys.rand(5, 8);
        preparationThrows = {};
        preparationFirst = null;
        if (contestCount > 0) {
            this.compileThrowers();
        }
        lastWild = now();
    };
    this.startContest = function(commandData) {
        contestCooldown = contestCooldownLength;
        contestCount = contestDuration;
        
        var votesResult;
        if (commandData.toLowerCase() === "none") {
            currentTheme = null;
            currentRules = this.pickRules(currentTheme);
        } else if (commandData.toLowerCase() in contestThemes) {
            currentTheme = commandData.toLowerCase();
            currentRules = this.pickRules(currentTheme);
        } else if (nextTheme) {
            if (contestVotes) {
                var vCount = {}, max = 0, winners = nextTheme.concat();
                for (var t in contestVotes) {
                    if (nextTheme.contains(contestVotes[t])) {
                        if (!vCount.hasOwnProperty(contestVotes[t])) {
                            vCount[contestVotes[t]] = 0;
                        }
                        vCount[contestVotes[t]]++;
                    }
                }
                for (t in vCount) {
                    if (vCount[t] >= max) {
                        if (vCount[t] > max) {
                            winners = [];
                            max = vCount[t];
                        }
                        winners.push(t);
                    }
                }
                votesResult = "Votes: " + nextTheme.map(function(x) { return themeName(x) + " (" + (vCount[x] || 0) + ")"; }).join(", ");
                nextTheme = winners.random();
                contestVotes = null;
            } else {
                if (Array.isArray(nextTheme)) {
                    nextTheme = nextTheme[sys.rand(0, nextTheme.length)];
                }
            }
            currentTheme = nextTheme == "none" ? null : nextTheme;
            if (nextRules && nextTheme in nextRules) {
                currentRules = nextRules[nextTheme];
            }
            nextTheme = null;
        } else {
            var themeList = Object.keys(contestThemes);
            currentTheme = chance(0.4) ? null : themeList[sys.rand(0, themeList.length)];
            currentRules = this.pickRules(currentTheme);
        }

        var icon = currentTheme && contestThemes[currentTheme].icon ? pokeInfo.icon(contestThemes[currentTheme].icon) + " " : "";
        if (icon) {
            sys.sendHtmlAll("<font color='magenta'><timestamp/> *** ***********************************************************</font> " + icon, safchan);
        } else {
            sys.sendAll(separator, safchan);
        }
        if (votesResult) {
            safaribot.sendAll(votesResult, safchan);
        }
        safaribot.sendHtmlAll("A new " + (currentTheme ? "<b>" + contestThemes[currentTheme].name + "</b>-themed" : "") + " Safari contest is starting now!", safchan);
        if (currentRules && Object.keys(currentRules).length > 0) {
            safaribot.sendHtmlAll("Rules: " + this.translateRules(currentRules), safchan);
        }
        sys.sendAll(separator, safchan);

        if (contestBroadcast) {
            sys.sendAll("", 0);
            sys.sendAll(separator, 0);
            safaribot.sendAll("A new " + (currentTheme ? contestThemes[currentTheme].name + "-themed" : "") + " Safari contest is starting now at #" + defaultChannel + "!", 0);
            sys.sendAll(separator, 0);
            sys.sendAll("", 0);
        } else {
            contestBroadcast = true;
        }
        this.flashPlayers();

        contestantsCount = {};
        contestantsWild = [];
        wildEvent = false;
        isBaited = false;
        nextRules = null;
        if (currentPokemon && isRare(currentPokemon)) {
            sys.appendToFile(mythLog, now() + "|||" + poke(currentPokemon) + "::disappeared with the contest::\n");
        }
        safari.createWild();
    };
    this.pickRules = function(theme) {
        var out = {}, e, list, exclude, obj;
        var rules = theme in contestThemes ? contestThemes[theme].rules : null;

        if (!rules) {
            if (sys.rand(0, 100) < 20) {
                return {};
            }
            rules = defaultRules;
        }

        var getRule = function(name) {
            return rules[name] === "default" ? defaultRules[name] : rules[name];
        };

        var buffNerfCount = 0;
        if ("onlyTypes" in rules && chance(getRule("onlyTypes").chance)) {
            obj = getRule("onlyTypes");
            list = obj.sets.random();
            exclude = [];
            for (e in effectiveness) {
                if (!list.contains(e)) {
                    exclude.push(e);
                }
            }
            out.excludeTypes = exclude;
            buffNerfCount += exclude.length;
        } else if ("excludeTypes" in rules) {
            exclude = [];
            obj = getRule("excludeTypes");
            for (e in obj) {
                if (chance(obj[e])) {
                    exclude.push(e);
                    if (exclude.length >= 3) {
                        break;
                    }
                }
            }
            out.excludeTypes = exclude;
            buffNerfCount += exclude.length;
        }
        if ("bonusTypes" in rules) {
            obj = getRule("bonusTypes");
            list = [];
            for (e in obj) {
                if ((!out.excludeTypes || !out.excludeTypes.contains(e) ) && chance(obj[e])) {
                    list.push(e);
                    if (list.length >= 3) {
                        break;
                    }
                }
            }
            out.bonusTypes = list;
            buffNerfCount += list.length;
        }
        if ("singleType" in rules) {
            var obj = getRule("singleType");
            if ("nerf" in obj && chance(obj.nerf)) {
                out.nerfSingle = true;
                buffNerfCount++;
            } else if ("buff" in obj && chance(obj.buff)) {
                out.buffSingle = true;
                buffNerfCount++;
            }
        }
        if ("dualType" in rules) {
            var obj = getRule("dualType");
            if ("nerf" in obj && chance(obj.nerf) && !out.nerfSingle) {
                out.nerfDual = true;
                buffNerfCount++;
            } else if ("buff" in obj && chance(obj.buff) && !out.buffSingle) {
                out.buffDual = true;
                buffNerfCount++;
            }
        }
        if ("shiny" in rules) {
            var obj = getRule("shiny");
            if ("nerf" in obj && chance(obj.nerf)) {
                out.nerfShiny = true;
                buffNerfCount++;
            } else if ("buff" in obj && chance(obj.buff)) {
                out.buffShiny = true;
                buffNerfCount++;
            }
        }
        if ("generation" in rules) {
            var obj = getRule("generation");
            for (var i = 1; i < generations.length; i++) {
                var g = generations[i].toLowerCase();
                if (g in obj) {
                    if ("nerf" in obj[g] && chance(obj[g].nerf)) {
                        out["nerfGen" + cap(g)] = true;
                        buffNerfCount++;
                    } else if ("buff" in obj[g] && chance(obj[g].buff)) {                      
                        out["buffGen" + cap(g)]= true;
                        buffNerfCount++;
                    }
                }
            }
        }

        if ("noLegendaries" in rules && chance(getRule("noLegendaries").chance)) {
            out.noLegendaries = true;
                buffNerfCount++;
        }

        var removables = [];
        if ("onlyBalls" in rules && chance(getRule("onlyBalls").chance)) {
            obj = getRule("onlyBalls");
            list = obj.sets.random();
            exclude = [];
            for (e = 0; e < allBalls.length; e++) {
                if (!list.contains(allBalls[e])) {
                    exclude.push(allBalls[e]);
                }
            }
            out.excludeBalls = exclude;
            if (obj.chance < 1) {
                removables.push("excludeBalls");
            }
        } else if ("excludeBalls" in rules) {
            exclude = [];
            obj = getRule("excludeBalls");
            var canRemove = true;
            for (e in obj) {
                if (chance(obj[e])) {
                    if (obj[e] === 1) {
                        canRemove = false;
                    }
                    exclude.push(e);
                    if (exclude.length >= 3) {
                        break;
                    }
                }
            }
            out.excludeBalls = exclude;
            if (canRemove) {
                removables.push("excludeBalls");
            }
        }
        if ("bst" in rules) {
            var bst = getRule("bst");
            if ("min" in bst && "minChance" in bst && chance(bst.minChance)) {
                if (typeof bst.min === "number") {
                    out.minBST = bst.min;
                } else {
                    out.minBST = sys.rand(bst.min[0], bst.min[1]);
                }
            }
            if ("max" in bst && "maxChance" in bst && chance(bst.maxChance)) {
                if (typeof bst.max === "number") {
                    out.maxBST = bst.max;
                } else {
                    out.maxBST = sys.rand(bst.max[0], bst.max[1]);
                }
            }
            if (bst.maxChance < 1 && bst.minChance < 1) {
                removables.push("bst");
            }
        }
        if ("inver" in rules && chance(getRule("inver").chance)) {
            out.inver = true;
            if (getRule("inver").chance < 1) {
                removables.push("inver");
            }
        }
        if ("invertedBST" in rules && chance(getRule("invertedBST").chance)) {
            out.invertedBST = true;
            if (getRule("invertedBST").chance < 1) {
                removables.push("invertedBST");
            }
        }
        if ("defensive" in rules && chance(getRule("defensive").chance)) {
            out.defensive = true;
            if (getRule("defensive").chance < 1) {
                removables.push("defensive");
            }
        }

        var extraRules = 2;
        if (buffNerfCount >= 6) {
            extraRules = 0;
        } else if (buffNerfCount >= 4) {
            extraRules = 1;
        } else if (buffNerfCount <= 1) {
            extraRules = 3;
        }

        while (removables.length > extraRules) {
            var toRemove = removables.random();
            if (toRemove == "bst") {
                delete out.minBST;
                delete out.maxBST;
            } else {
                delete out[toRemove];
            }
            removables.splice(removables.indexOf(toRemove), 1);
        }
        if ("rewards" in rules) {
            var rew = getRule("rewards");
            var set = randomSample(rew.chance);
            if (set in rew.sets) {
                out.rewards = rew.sets[set];
            }
        }

        return out;
    };
    this.translateRules = function(rules) {
        var out = [], list, e;

        if (!rules) {
            return "No special rules";
        }
        var buffed = [];
        var nerfed = [];

        if ("bonusTypes" in rules && rules.bonusTypes.length > 0) {
            buffed = buffed.concat(rules.bonusTypes);
        }
        if ("excludeTypes" in rules && rules.excludeTypes.length > 0) {
            if (rules.excludeTypes.length > Object.keys(effectiveness).length / 2) {
                list = [];
                for (e in effectiveness) {
                    if (!rules.excludeTypes.contains(e)) {
                        list.push(e);
                    }
                }
                out.push("Enforced Types: " + readable(list, "and"));
            } else {
                nerfed = nerfed.concat(rules.excludeTypes);
            }
        }
        if (rules.nerfSingle) {
            nerfed.push("Single-type Pokémon");
        } else if (rules.buffSingle) {
            buffed.push("Single-type Pokémon");
        }
        if (rules.nerfDual) {
            nerfed.push("Dual-type Pokémon");
        } else if (rules.buffDual) {
            buffed.push("Dual-type Pokémon");
        }
        if (rules.noLegendaries) {
            nerfed.push("Legendaries");
        }
        if (rules.nerfShiny) {
            nerfed.push("Shiny Pokémon");
        } else if (rules.buffShiny) {
            buffed.push("Shiny Pokémon");
        }
        
        for (var i = 1; i < generations.length; i++) {
            var g = generations[i];
            if (rules["nerfGen" + g]) {
                nerfed.push(g + " Pokémon");
            } else if (rules["buffGen" + g]) {
                buffed.push(g + " Pokémon");
            }
        }
        
        if (buffed.length > 0) {
            out.push("Buffed: " + readable(buffed, "and"));
        }
        if (nerfed.length > 0) {
            out.push("Nerfed: " + readable(nerfed, "and"));
        }

        var inver = rules.inver;
        var invertedBST = rules.invertedBST;
        var defensive = rules.defensive;
        if (inver && defensive) {
            out.push("Weakness Mode");
            if (invertedBST) {
                out.push("Inverted BST");
            }
        } else if (inver && invertedBST) {
            out.push("Inverted BST & Type Effectiveness");
        } else {
            if (inver) {
                out.push("Inverted Type Effectiveness");
            }
            if (invertedBST) {
                out.push("Inverted BST");
            }
            if (defensive) {
                out.push("Resistance Mode");
            }
        }

        if ("minBST" in rules && "maxBST" in rules) {
            out.push("Recommended BST: " + rules.minBST + "~" + rules.maxBST);
        } else {
            if ("minBST" in rules) {
                out.push("Recommended BST: " + rules.minBST + " or more");
            }
            if ("maxBST" in rules) {
                out.push("Recommended BST: " + rules.maxBST + " or less");
            }
        }
        if ("excludeBalls" in rules && rules.excludeBalls.length > 0) {
            if (rules.excludeBalls.length > allBalls.length / 2) {
                list = [];
                for (e = 0; e < allBalls.length; e++) {
                    if (!rules.excludeBalls.contains(allBalls[e])) {
                        list.push(allBalls[e]);
                    }
                }
                out.push("Allowed Balls: " + readable(list.map(cap), "and"));
            } else {
                out.push("Forbidden Balls: " + readable(rules.excludeBalls.map(cap), "and"));
            }
        }
        if ("rewards" in rules) {
            list = [];
            for (var e in rules.rewards) {
                list.push(rules.rewards[e] + " " + itemAlias(e, false, true) + (rules.rewards[e] === 1 ? "" : "s"));
            }
            if (list.length > 1 || list[0] !== "10 Gachapon Tickets") {
                out.push("Reward: " + readable(list, "and"));
            }
        }

        if (out.length === 0) {
            return "No special rules";
        }

        return out.join(" | ");
    };
    this.validForTheme = function(pokeId, name) {
        var theme = contestThemes[name];
        var pokeNum = parseInt(pokeId, 10);

        if (theme.exclude.indexOf(pokeNum) !== -1) {
            return false;
        }
        if (theme.include.indexOf(pokeNum) !== -1) {
            return true;
        }
        var bst = theme.customBST.pokeNum || getBST(pokeNum);
        if (bst > theme.maxBST) {
            return false;
        }
        for (var e in theme.excludeTypes) {
            if (hasType(pokeNum, theme.excludeTypes[e])) {
                return false;
            }
        }
        for (e in theme.types) {
            //Legendary can only be manually added.
            if (hasType(pokeNum, theme.types[e]) && !isRare(pokeNum)) {
                return true;
            }
        }
        return false;
    };
    this.getRulesMod = function(pokeId, rules) {
        var type1 = sys.type(sys.pokeType1(pokeId)),
            type2 = sys.type(sys.pokeType2(pokeId)),
            id = parseInt(pokeId, 10),
            bst = getBST(pokeId),
            val = 1,
            gen = generation(id);

        if (("excludeTypes" in rules && (rules.excludeTypes.contains(type1) || rules.excludeTypes.contains(type2))) ||
        ("minBST" in rules && bst < rules.minBST) ||
        ("maxBST" in rules && bst > rules.maxBST) ||
        (rules.noLegendaries && isLegendary(id)) ||
        ("minBST" in rules && bst < rules.minBST) ||
        (rules.nerfShiny && typeof pokeId === "string") ||
        (rules.nerfSingle && type2 === "???") ||
        (rules.nerfDual && type2 !== "???")) {
            val = RULES_NERF;
        }

        for (var i = 1; i < generations.length; i++) {
            if (gen === i) {
                var g = generations[i];
                if (rules["nerfGen" + g]) {
                    val = RULES_NERF;
                } else if (rules["buffGen" + g]) {
                    val += RULES_BUFF;
                }
                break;
            }
        }
        
        if ("bonusTypes" in rules) {
            if (rules.bonusTypes.contains(type1)) {
                val += RULES_BUFF;
            }
            if (rules.bonusTypes.contains(type2)) {
                val += RULES_BUFF;
            }
        }
        if (rules.buffShiny && typeof pokeId === "string") {
            val += RULES_BUFF;
        }
        if (rules.buffSingle && type2 === "???") {
            val += RULES_BUFF;
        }
        if (rules.buffDual && type2 !== "???") {
            val += RULES_BUFF;
        }
        return val;
    };
    this.computeCatchRate = function(src, data) {
        var player = getAvatar(src);
        var ball = itemAlias(data);
        if (!isBall(ball)) {
            ball = "safari";
        }

        var ballBonus = itemData[ball].ballBonus;
        var isShiny = typeof currentPokemon == "string";
        var wild = isShiny ? parseInt(currentPokemon, 10) : currentPokemon;
        var shinyChance = isShiny ? 0.30 : 1;
        var isLegend = isLegendary(wild);
        var legendaryChance = isLegend ? 0.50 : 1;

        var userStats = getBST(player.party[0]);
        var evioBonus = 0;
        if (userStats <= itemData.eviolite.threshold) {
            evioBonus = Math.min(itemData.eviolite.bonusRate * player.balls.eviolite, itemData.eviolite.maxRate);
            userStats += evioBonus;
        }
        var wildStats = getBST(wild);
        var statsBonus = (userStats - wildStats) / 8000;
        if (currentRules && currentRules.invertedBST) {
            userStats -= evioBonus;
            statsBonus = (userStats - wildStats) / -8000;
        }
        if (ball === "heavy" && wildStats >= 450) {
            ballBonus = 1 + itemData[ball].bonusRate * (Math.floor((wildStats - 450) / 30) + 1);
            if (ballBonus > itemData[ball].maxBonus) {
                ballBonus = itemData[ball].maxBonus;
            }
        }
        var typeBonus;
        var inverse = (player.costume === "inver" || (currentRules && currentRules.inver));
        if (currentRules && currentRules.defensive) {
            typeBonus = this.checkEffective(sys.type(sys.pokeType1(wild)), sys.type(sys.pokeType2(wild)), sys.type(sys.pokeType1(player.party[0])), sys.type(sys.pokeType2(player.party[0])), false, !inverse);
        } else {
            typeBonus = this.checkEffective(sys.type(sys.pokeType1(player.party[0])), sys.type(sys.pokeType2(player.party[0])), sys.type(sys.pokeType1(wild)), sys.type(sys.pokeType2(wild)), false, inverse);
        }

        var tiers = ["ORAS LC", "ORAS NU", "ORAS LU", "ORAS UU", "ORAS OU", "ORAS Ubers"];
        var tierChance = 0.02;
        for (var x = 0; x < tiers.length; x++) {
            if (sys.isPokeBannedFromTier && !sys.isPokeBannedFromTier(wild, tiers[x])) {
                tierChance = catchTierChance[x];
                break;
            }
        }
        var leader = parseInt(player.party[0], 10);
        var species = pokeInfo.species(leader);
        var noDailyBonusForms = ["Floette-EF", "Rotom-C", "Rotom-F", "Rotom-H", "Rotom-W", "Rotom-S", "Darmanitan-D"];
        var dailyBonus = dailyBoost.pokemon == species && !isMega(leader) && !noDailyBonusForms.contains(sys.pokemon(leader)) ? dailyBoost.bonus : 1;
        var rulesMod = currentRules ? this.getRulesMod(player.party[0], currentRules) : 1;
        var costumeMod = 1;
        if (player.costume === "preschooler" && (player.party[0] === player.starter || player.starter2.contains(player.party[0]))) {
            var c = costumeData.preschooler;
            costumeMod = c.rate;
            var rec = player.records.pokesCaught;
            if (rec > c.thresh3) {
                costumeMod = 1;
            } else if (rec > c.thresh2) {
                costumeMod -= c.changeRate*2;
            } else if (rec > c.thresh1) {
                costumeMod -= c.changeRate;
            }
        }

        if (ball === "premier" && hasType(player.party[0], "Normal") && player.costume !== "inver") {
            if (typeBonus >= itemData.premier.bonusRate) {
                //Type Bonus makes Premier better, so we don't bonus it more
                ballBonus = 1;
            } else if (typeBonus >= itemData.premier.ballBonus) {
                //Type Bonus isnt as good as standard Premier, so we apply the bonus
                typeBonus = itemData.premier.bonusRate;
                ballBonus = 1;
            } else {
                //Type Bonus is reducing catch rate, so let's boost it back up
                ballBonus = itemData.premier.bonusRate;
            }
        }
        
        var eventChance = (wildEvent ? 0.4 : 1);
        if (ball === "myth") {
            shinyChance = 1;
            legendaryChance = 1;
            eventChance = 1;
            rulesMod = 1;
            if (isLegend || isShiny){
                ballBonus = itemData[ball].bonusRate;
            } else {
                typeBonus = 1;
            }
        }
        if (ball === "mono" && hasType(player.party[0], "???")) {
            typeBonus *= itemData.mono.bonusRate;
        }
        
        var finalChance = Math.max((tierChance + statsBonus) * typeBonus * shinyChance * legendaryChance * dailyBonus * rulesMod * costumeMod * ballBonus, 0.01) * eventChance;
        if (ball == "clone") {
            var maxCloneRate = itemData.clone.bonusRate + (player.costume === "scientist" ? costumeData.scientist.rate : 0);
            finalChance = Math.min(finalChance, maxCloneRate);
        }
        if (player.truesalt >= now()) {
            finalChance = 0;
        }

        return finalChance;
    };
    this.throwBall = function(src, data, bypass, suppress, command, baitThrow) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "catch Pokémon";
        if (player.tutorial.inTutorial) {
            if (player.tutorial.privateWildPokemon) {
                safari.tutorialCatch(src, data);
                return;
            } else {
                if (cantBecause(src, reason, ["tutorial"])) {
                    return;
                }
            }
        }

        if (!suppress && !bypass) {
            var mess = "[Track] " + sys.name(src) + " is using /" + (command || "catch") + " " + data + " (Time since last wild/trick: " + ((now() - lastWild)/1000) + " seconds)";
            this.trackMessage(mess, player);
        }

        if (preparationPhase > 0 && data === "cancel") {
            safaribot.sendMessage(src, "You cancelled your throw!", safchan);
            delete preparationThrows[sys.name(src).toLowerCase()];
            return;
        }

        if (!currentPokemon) {
            if (suppress) {
                safaribot.sendMessage(src, "Someone caught the wild Pokémon while you were preparing your throw!", safchan);
            } else {
                safaribot.sendMessage(src, "No wild Pokémon around!", safchan);
            }
            return;
        }
        var ball = itemAlias(data, true);
        if (!isBall(ball) || player.balls[ball] === 0) {
            ball = (player.balls[player.favoriteBall] > 0 ? player.favoriteBall : "safari");
        }

        if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
            safaribot.sendMessage(src, "Your boxes are full! You cannot catch any more Pokémon unless you buy another " + finishName("box") + " or decrease the number of Pokémon in your possession.", safchan);
            return;
        }
        if (cantBecause(src, reason, ["item", "auction", "battle", "event", "pyramid"], ball)) {
            return;
        }
        var currentTime = now();
        if (!bypass && (!preparationFirst || sys.name(src).toLowerCase() !== preparationFirst) && player.cooldowns.ball > currentTime) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.ball) + " before throwing a ball!", safchan);
            return;
        }

        if (wildEvent && ball == "master") {
            safaribot.sendMessage(src, "This is an Event Pokémon, you cannot use " + es(finishName("master")) + "!", safchan);
            return;
        }
        var ballName = finishName(ball);
        if (currentRules && currentRules.excludeBalls && currentRules.excludeBalls.contains(ball)) {
            safaribot.sendMessage(src, "The use of " + ballName + " is forbidden during this contest!", safchan);
            return;
        }

        var name = sys.name(src);
        if (contestCount > 0 && contestantsWild.indexOf(name.toLowerCase()) === -1) {
            contestantsWild.push(name.toLowerCase());
        }
        
        if (baitThrow) {
            safaribot.sendMessage(src, "You quickly scramble to put your " + finishName("bait") + " away in order to try to catch the wild Pokémon lured by someone else!", safchan);
        }

        if (preparationPhase > 0) {
            if (ball === "master") {
                safaribot.sendHtmlMessage(src, toColor("You are preparing to throw your " + ballName + "!", "red") + " [" + link("/catch cancel", "Cancel") + "]", safchan);
            } else {
                safaribot.sendMessage(src, "You are preparing to throw your " + ballName + "!", safchan);
            }
            preparationThrows[sys.name(src).toLowerCase()] = ball;
            return;
        }

        player.balls[ball] -= 1;
        this.updateShop(player, ball);

        var finalChance = safari.computeCatchRate(src, data);

        var ballBonus = itemData[ball].ballBonus;
        var cooldown = itemData[ball].cooldown;

        var pokeName = poke(currentPokemon);
        var isShiny = typeof currentPokemon == "string";
        var wild = isShiny ? parseInt(currentPokemon, 10) : currentPokemon;
        var isLegend = isLegendary(wild);
        var wildStats = getBST(wild);

        var rng = Math.random();
        var flee;
        if (rng < finalChance || ballBonus == 255) {
            currentPokemonCount--;
            var amt = currentPokemonCount;
            var remaining = " There " + (amt > 1 ? "are" : "is") + " still " + currentPokemonCount + " " + pokeName + " left to catch!";
            if (amt < 1) {
                sendAll("", true, true);
            }
            var revealName = poke(currentDisplay) != poke(currentPokemon) ? "<b>" + pokeName + "</b> (who was disguised as "+ poke(currentDisplay) + ")" : "<b>" + pokeName + "</b>";
            var msg = "";
            if (now() > player.cooldowns.unown) {
                for (var u = 0; u < player.party.length; u++) {
                    if (pokeInfo.species(player.party[u]) === 201) {
                        msg += "abcdefghijklmnopqrstuvwxyz!?".charAt(pokeInfo.forme(player.party[u]));
                    }
                }
                msg = msg.length > 4 ? msg : "";
                msg = /asshole|dick|pussy|bitch|porn|nigga|cock|gay|slut|whore|cunt|penis|vagina|nigger|fuck|dildo|anus|boner|tits|condom|rape/gi.test(msg) ? "" : msg;
                if (msg) {
                    player.cooldowns.unown = now() + hours(0.33);
                }
            }
            if (ball == "spy") {
                safaribot.sendHtmlAll("Some stealthy person caught the " + revealName + " with " + an(ballName) + " and the help of their well-trained spy Pokémon!" + (amt > 0 ? remaining : ""), safchan);
            } else {
                safaribot.sendHtmlAll(name + " caught the " + revealName + " with " + an(ballName)+ " and the help of their " + poke(player.party[0]) + "!" + (msg ? " Some shadows shaped like the letters <b>" + msg.toUpperCase() + "</b> could be seen around the " + ballName + "!" : "") + (amt > 0 ? remaining : ""), safchan);
            }
            safaribot.sendMessage(src, "Gotcha! " + pokeName + " was caught with " + an(ballName) + "! You still have " + plural(player.balls[ball], ballName) + " left!", safchan);
            player.pokemon.push(currentPokemon);
            player.records.pokesCaught += 1;
            if (isBaited) {
                player.records.notBaitedCaught += 1;
            }
            this.addToMonthlyLeaderboards(player.id, "pokesCaught", 1);

            var clonedAmount = 0;
            if (ball === "clone") {
                var costumed = player.costume === "scientist";
                if (costumed && chance(costumeData.scientist.bonusChance) && !isLegend && !isShiny) {
                    //TWO CLONES
                    safaribot.sendAll("But wait! The " + pokeName + " was cloned by the " + ballName + "! " + name + " received another " + pokeName + "!", safchan);
                    safaribot.sendHtmlAll("<b>Hold on!</b> The " + pokeName + " was actually cloned TWICE by the " + ballName + "! " + html_escape(name) + " received yet another " + pokeName + "!", safchan);
                    clonedAmount = 2;
                } else if (!costumed && (isLegend || isShiny)) {
                    //NO CLONE
                    safaribot.sendAll("But wait! The " + pokeName + " was cloned by the " + ballName + ".. or so " + name + " thought! Unfortunately, due to the complex genetic sequence of " + pokeName + ", the cloning process failed!", safchan);
                } else {
                    // ONE CLONE
                    safaribot.sendAll("But wait! The " + pokeName + " was cloned by the " + ballName + "! " + name + " received another " + pokeName + "!", safchan);
                    clonedAmount = 1;
                }
                if (clonedAmount > 0) {
                    for (var i = 0; i < clonedAmount; i++) {
                        player.pokemon.push(currentPokemon);
                    }
                    player.records.pokesCloned += clonedAmount;
                }
            }

            if (ball == "luxury") {
                var perkBonus = 1 + Math.min(itemData.scarf.bonusRate * player.balls.scarf, itemData.scarf.maxRate);
                var earnings = Math.floor(wildStats/2 * perkBonus);
                safaribot.sendAll((player.balls.scarf > 0 ? "The Fashionable " : "") + name + " found $" + addComma(earnings) + " on the ground after catching " + pokeName + "!" , safchan);
                player.money += earnings;
                player.records.luxuryEarnings += earnings;
            }
            this.fullBoxWarning(src);

            var penalty = 2 - Math.min(itemData.soothe.bonusRate * player.balls.soothe, itemData.soothe.maxRate);
            cooldown *= penalty;
            if (contestCount > 0) {
                var nameLower = name.toLowerCase();
                if (!(nameLower in contestCatchers)) {
                    contestCatchers[nameLower] = [];
                }
                contestCatchers[nameLower].push(currentPokemon);
                if (ball == "clone") {
                    for (var i = 0; i < clonedAmount; i++) {
                        contestCatchers[nameLower].push(currentPokemon);
                    }
                }
            }
            if (isRare(currentPokemon) || ball === "master") {
                sys.appendToFile(mythLog, now() + "|||" + poke(currentPokemon) + (poke(currentDisplay) != poke(currentPokemon) ? " (disguised as "+ poke(currentDisplay) +")" : "") + "::caught::" + name + "'s " + finishName(ball) + "\n");
            }
            if (amt < 1) {
                sendAll("", true, true);
                currentPokemon = null;
                currentDisplay = null;
                wildEvent = false;
                isBaited = false;
                checkUpdate();
            } else {
                currentThrows -= (lastPokemonCount > 4 ? 2 : 4) * (lastPokemonCount - amt);
                if (currentThrows <= 0 && !wildEvent && !resolvingThrows) {
                    flee = true;
                }
            }
        } else {
            var keep = false;
            /*if (player.costume === "fisher") {
                if (rng2 < chance(costumeData.fisher.rate)) {
                    keep = true;
                    player.balls[ball] += 1;
                }
            }*/
            pokeName = poke(currentDisplay);
            safaribot.sendMessage(src, "You threw a  " + ballName + " at " + pokeName +"! " + (keep ? "A quick jerk of your fishing rod snags the " + finishName(ball) + " you just threw, allowing you to recover it!" : "") + " You still have " + plural(player.balls[ball], ballName) + " left!", safchan);
            if (rng < finalChance + 0.1) {
                safaribot.sendHtmlMessage(src, "<b>Gah! It was so close, too!</b>", safchan);
            } else if (rng < finalChance + 0.2) {
                safaribot.sendHtmlMessage(src, "<b>Aargh! Almost had it!</b>", safchan);
            } else if (rng < finalChance + 0.3) {
                safaribot.sendHtmlMessage(src, "<b>Aww! It appeared to be caught!</b>", safchan);
            } else {
                safaribot.sendHtmlMessage(src, "<b>Oh no! The " + pokeName + " broke free!</b>", safchan);
            }
            sendAll(pokeName + " broke out of " + (ball == "spy" ? "an anonymous person" : name) + "'s " + ballName + "!");
            player.records.pokesNotCaught += 1;

            currentThrows -= 1;
            if (currentThrows <= 0 && !wildEvent && !resolvingThrows) {
                flee = true;
            }
        }

        if (flee) {
            pokeName = poke(currentPokemon);
            var runmsgs = [
                "The wild {0} got spooked and fled!",
                "The wild {0} got hungry and went somewhere else to find food!",
                "The wild {0} went back home to take their medicine!",
                "The wild {0} hid in a hole and disappeared!",
                "The wild {0} pointed to the sky. While everyone was looking at the clouds, the {0} fled!",
                "The wild {0} vanished into thin air!",
                "The wild {0} spontaneously combusted and turned to ash.",
                "The wild {0} was really just a figment of everyone's imagination!",
                "The wild {0} got eaten by a much larger Pokémon!",
                "The wild {0} was actually just a well made PokéDoll!",
                "The wild {0} was actually a Poké Fan cosplaying as a {0}!",
                "The wild {0} turned into MissingNo and glitched out of existence!",
                "The wild {0} was not really wild! Their owner called them back to their Pokéball!"
            ];
            if (isRare(currentPokemon)) {
                sys.appendToFile(mythLog, now() + "|||" + poke(currentPokemon) + "::fled::\n");
            }

            sys.sendAll("", safchan);
            safaribot.sendAll(runmsgs.random().format(pokeName), safchan);
            sys.sendAll("", safchan);
            currentPokemon = null;
            currentDisplay = null;
            currentPokemonCount = lastPokemonCount = 1;
            isBaited = false;
        }

        player.cooldowns.ball = currentTime + cooldown;
        player.cooldowns.bait = player.cooldowns.ball;
        if (ball === player.favoriteBall && ball !== "safari" && player.balls[ball] <= 5) {
            if (player.balls[ball] === 0) {
                safaribot.sendMessage(src, "Note: You are completely out of " + es(ballName) + ". Consider obtaining more or setting a new favorite ball with /favorite.", safchan);
            } else {
                safaribot.sendMessage(src, "Note: You have " + plural(player.balls[ball], ballName) + " left. Consider obtaining more or setting a new favorite ball with /favorite.", safchan);
            }
        }

        this.saveGame(player);
    };
    this.checkEffective = function(atk1, atk2, def1, def2, def3, inverted) {
        var result = 1;
        var immuneCount = 0;
        var typeCount = 1;

        var countImmune = function(value) {
            if (value === 0) {
                immuneCount++;
                return immuneMultiplier;
            }
            return value;
        };
        var inverse = function(value) {
            if (inverted) {
                return Math.max(value, 0.5);
            }
            return value;
        };

        var attacker = effectiveness[atk1];
        if (def1 in attacker) {
            result *= countImmune(inverse(attacker[def1]));
        }
        if (def2 in attacker) {
            result *= countImmune(inverse(attacker[def2]));
        }
        if (def3 && def3 in attacker) {
            result *= countImmune(inverse(attacker[def3]));
        }

        if (atk2 !== "???") {
            typeCount++;
            attacker = effectiveness[atk2];
            if (def1 in attacker) {
                result *= countImmune(inverse(attacker[def1]));
            }
            if (def2 in attacker) {
                result *= countImmune(inverse(attacker[def2]));
            }
            if (def3 && def3 in attacker) {
                result *= countImmune(inverse(attacker[def3]));
            }
        }
        if (immuneCount >= typeCount) {
            return 0;
        }

        return inverted ? 1 / result : result;
    };
    this.releasePokemon = function(src, data) {
        var verb = "release";
        if (!canLosePokemon(src, data, verb)) {
            return;
        }
        var player = getAvatar(src);
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from releasing for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To release a Pokémon, use /release [name]:confirm!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't release a Pokémon during a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't release a Pokémon while participating in an auction!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "There's already a Pokemon out there!", safchan);
            return true;
        }
        if (releaseCooldown > 0) {
            safaribot.sendMessage(src, "Please spend the next  " + timeLeftString(releaseCooldown) + " saying good bye to your Pokémon before releasing it!", safchan);
            return;
        }
        var input = data.split(":");
        var info = getInputPokemon(input[0]);
        var shiny = info.shiny;
        var num = info.num;
        var id = info.id;

        if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
            safaribot.sendMessage(src, "You can release your " + info.name + " by typing /release " + info.input + ":confirm.", safchan);
            return;
        }

        safaribot.sendAll(sys.name(src) + " released their " + info.name + "!", safchan);
        this.logLostCommand(sys.name(src), "release " + data);
        this.removePokemon(src, id);
        player.records.pokesReleased += 1;
        player.cooldowns.ball = now() + 20 * 1000;
        this.saveGame(player);
        releaseCooldown = releaseCooldownLength;
        safari.createWild(num, shiny);
    };
    this.compileThrowers = function() {
        var name, e;
        for (e in contestantsWild) {
            if (contestantsWild.hasOwnProperty(e)) {
                name = contestantsWild[e];
                if (!(name in contestantsCount)) {
                    contestantsCount[name] = 0;
                }
                contestantsCount[name]++;
            }
        }
        contestantsWild = [];
    };
    this.flashPlayers = function() {
        var players = sys.playersOfChannel(safchan);
        for (var pid in players) {
            var player = getAvatar(players[pid]);
            if (player && player.flashme) {
                sys.sendHtmlMessage(players[pid], "<ping/>", safchan);
            }
        }
    };
    this.fullBoxWarning = function(src) {
        var player = getAvatar(src);
        if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate - 5) {
            var remaining = player.balls.box * itemData.box.bonusRate - player.pokemon.length;
            if (remaining > 0) {
                safaribot.sendMessage(src, "Your boxes are almost full! You can still catch " + remaining + " more Pokémon!", safchan);
            } else {
                safaribot.sendMessage(src, "Your boxes are full! You cannot catch any more Pokémon unless you buy another box or decrease the number of Pokémon in your possession.", safchan);
            }
        }
    };

    /* Player Info */
    this.viewOwnInfo = function(src, textOnly) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var isAndroid = (sys.os(src) === "android");

        var out = "";

        //Current Party table
        out += this.showParty(src, true);

        //All owned Pokémon
        out += this.showBox(player, "all", isAndroid, textOnly);

        //Money/Balls table
        out += this.showBag(player, isAndroid, textOnly);

        //Costumes
        out += this.showCostumes(player);

        sys.sendHtmlMessage(src, out, safchan);
    };
    this.viewPlayer = function(src, data) {
        var player = getAvatar(src);
        if (player) {
            switch (data.toLowerCase()) {
                case "on":
                    player.visible = true;
                    safaribot.sendMessage(src, "Now allowing other players to view your party!", safchan);
                    return;
                case "off":
                    player.visible = false;
                    safaribot.sendMessage(src, "Now disallowing other players from viewing your party!", safchan);
                    return;
            }
        }

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

        if (target != player && !target.visible && !SESSION.channels(safchan).isChannelAdmin(src)) {
            safaribot.sendMessage(src, "You cannot view this person's party!", safchan);
            return;
        }

        sys.sendHtmlMessage(src, this.showParty(id, false, src), safchan);
    };
    this.viewItems = function(src, textOnly) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var isAndroid = (sys.os(src) === "android");
        sys.sendHtmlMessage(src, this.showBag(player, isAndroid, textOnly), safchan);
    };
    this.viewCostumes = function(src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        safaribot.sendHtmlMessage(src, this.showCostumes(player), safchan);
    };
    this.viewBox = function(src, data, textOnly, shopLink) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var isAndroid = (sys.os(src) === "android");
        sys.sendHtmlMessage(src, this.showBox(player, (data === "*" ? 1 : data), isAndroid, textOnly, shopLink), safchan);
    };
    this.manageParty = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (data === "*") {
            sys.sendHtmlMessage(src, this.showParty(src, true), safchan);
            safaribot.sendMessage(src, "To modify your party, type /add [pokémon] or /remove [pokémon]. Use /active [pokémon] to set your party leader. You can also manage saved parties with /party save:[slot] and /party load:[slot], or quickly change your party with /qload Pokémon1,Pokémon2,Pokémon3,etc.", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        var input = data.split(":"), action, targetId;
        if (input.length < 2) {
            input = data.split(" ");
            if (input.length < 2) {
                sys.sendMessage(src, "", safchan);
                safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader. To quickly change your party, use /qload Pokémon1,Pokémon2,Pokémon3,etc.", safchan);
                safaribot.sendMessage(src, "You can also manage saved parties with /party save:[slot] and /party load:[slot]. " + (player.savedParties.length > 0 ? "You have the following parties saved: " : ""), safchan);
                this.showSavedParties(src);
                sys.sendMessage(src, "", safchan);
                return;
            }
            action = input[0];
            targetId = input.slice(1).join(" ");
        } else {
            action = input[0].toLowerCase();
            targetId = input[1].toLowerCase();
        }

        var info, id, slots = 10;
        if (!["save", "load"].contains(action)) {
            info = getInputPokemon(targetId);
            if (!info.num) {
                safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
                return;
            }
            id = info.id;

            if (player.pokemon.indexOf(id) === -1) {
                safaribot.sendMessage(src, "You don't have that Pokémon!", safchan);
                return;
            }
        } else {
            targetId = parseInt(targetId, 10);
            targetId = isNaN(targetId) ? 0 : targetId;

            if (targetId === 0) {
                if (player.savedParties.length > 0) {
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendMessage(src, "Your saved parties are:", safchan);
                    this.showSavedParties(src);
                    safaribot.sendMessage(src, "Use /party save:[slot] to save your current party to that slot, or /party load:[slot] to load that party.", safchan);
                    sys.sendMessage(src, "", safchan);
                } else {
                    safaribot.sendMessage(src, "You have no party saved! Use /party save:1 to save your current party to a slot.", safchan);
                }
                return;
            }
        }

        if (action === "add") {
            if (player.tutorial.inTutorial && info.name !== "Pikachu") {
                if (cantBecause(src, reason, ["tutorial"])) {
                    return;
                }
            }
            if (cantBecause(src, "modify your party", ["auction", "battle", "event", "pyramid"])) {
                return;
            }
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
            if (player.tutorial.inTutorial && player.party.contains(sys.pokeNum("Pikachu"))) {
                advanceTutorial(src, 4);
            }
            this.saveGame(player);
        } else if (action === "remove") {
            var restrictions = ["auction", "battle", "event", "tutorial", "pyramid"];
            var reason = "modify your party";
            //Allow selling of pokemon that are not the lead if the rest of the party doesn't matter at that point
            if (player.party[0] === id) {
                restrictions = restrictions.concat(["wild", "contest"]);
                reason = "remove your active Pokémon";
            }
            if (cantBecause(src, reason, restrictions)) {
                return;
            }

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
            if (cantBecause(src, "change your active Pokémon", ["wild", "contest", "auction", "battle", "event", "pyramid", "tutorial"])) {
                return;
            }
            if (player.party[0] === id) {
                safaribot.sendMessage(src, "This is already your active Pokémon!", safchan);
                return;
            }
            if (player.party.indexOf(id) === -1) {
                if (player.party.length >= 6) {
                    var removedId = player.party.splice(5, 1)[0];
                    safaribot.sendMessage(src, poke(removedId) + " was removed from your party!", safchan);
                }
            } else {
                player.party.splice(player.party.indexOf(id), 1);
            }

            player.party.splice(0, 0, id);
            safaribot.sendMessage(src, "You are now using " + info.name + " as your active Pokémon!", safchan);
            this.saveGame(player);
        } else if (action === "save") {
            if (cantBecause(src, "modify your party", ["tutorial"])) {
                return;
            }
            var num = targetId - 1;
            if (num > slots-1) {
                num = slots-1;
            } else if (num < 0) {
                num = 0;
            }

            var toSave = player.party.concat();
            if (num >= player.savedParties.length) {
                player.savedParties.push(toSave);
                num = player.savedParties.length - 1;
            } else {
                player.savedParties[num] = toSave;
            }

            safaribot.sendMessage(src, "Saved your current party to slot " + (num + 1) + "!", safchan);
            this.saveGame(player);
        } else if (action === "load") {
            if (cantBecause(src, "modify your party", ["wild", "contest", "auction", "battle", "event", "pyramid", "tutorial"])) {
                return;
            }
            var num = targetId - 1;
            if (num < 0) {
                num = 0;
            }
            if (player.savedParties.length > 0 && num >= player.savedParties.length) {
                num = player.savedParties.length - 1;
            }

            if (num >= player.savedParties.length) {
                safaribot.sendMessage(src, "You have no party saved on that slot!", safchan);
                return;
            }

            var toLoad = player.savedParties[num];

            for (var p = toLoad.length - 1; p >= 0; p--) {
                id = toLoad[p];
                if (player.pokemon.indexOf(id) === -1) {
                    safaribot.sendMessage(src, "You no longer have " + an(poke(id)) + "!", safchan);
                    toLoad.splice(p, 1);
                    continue;
                }
                var c = countRepeated(toLoad, id);
                if (c > countRepeated(player.pokemon, id)) {
                    safaribot.sendMessage(src, "You no longer have " + c + " " + poke(id) + "!", safchan);
                    toLoad.splice(p, 1);
                }
            }

            if (toLoad.length === 0) {
                safaribot.sendMessage(src, "Couldn't load from slot " + targetId + " because you no longer have any of those Pokémon!", safchan);
                return;
            }

            player.party = toLoad.concat();
            safaribot.sendMessage(src, "Loaded your party from slot " + (num + 1) + " (" + readable(player.party.map(poke), "and") + ")!", safchan);
            this.saveGame(player);
        } else {
            safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
        }
    };
    this.quickLoadParty = function(src, data) {
        if (cantBecause(src, "modify your party", ["wild", "contest", "auction", "battle", "event", "pyramid", "tutorial"])) {
            return;
        }
        var player = getAvatar(src);
        data = data.replace(/\,[\s]/gi, ",").split(",");
        
        var toLoad = [], invalid = [], info, p, id, c;
        for (var p = 0; p < 6 && p < data.length; p++) {
            info = getInputPokemon(data[p]);
            if (info.num) {
                toLoad.push(info.id);
            } else {
                invalid.push(data[p]);
            }
        }
        if (invalid.length > 0) {
            safaribot.sendMessage(src, "Cannot load invalid Pokémon " + readable(invalid) + "!", safchan);
        }
        for (p = toLoad.length - 1; p >= 0; p--) {
            id = toLoad[p];
            if (player.pokemon.indexOf(id) === -1) {
                safaribot.sendMessage(src, "You don't have " + an(poke(id)) + "!", safchan);
                toLoad.splice(p, 1);
                continue;
            }
            c = countRepeated(toLoad, id);
            if (c > countRepeated(player.pokemon, id)) {
                safaribot.sendMessage(src, "You don't have " + c + " " + poke(id) + "!", safchan);
                toLoad.splice(p, 1);
            }
        }

        if (toLoad.length === 0) {
            safaribot.sendMessage(src, "Couldn't load party don't have any of those Pokémon!", safchan);
            return;
        }

        player.party = toLoad.concat();
        safaribot.sendMessage(src, "Quick loaded party " + readable(player.party.map(poke), "and") + "!", safchan);
        this.saveGame(player);
    };
    this.showSavedParties = function(src) {
        var player = getAvatar(src);
        for (var e = 0; e < player.savedParties.length; e++) {
            safaribot.sendHtmlMessage(src, link("/party load: " + (e + 1), "Slot " + (e + 1)) + ": " + readable(player.savedParties[e].map(poke), "and"), safchan);
        }
    };
    this.showParty = function(id, ownParty, srcId) {
        var player = getAvatar(id),
            party = player.party.map(pokeInfo.sprite),
            costumed = (player.costume !== "none");
        var out = "<table border = 1 cellpadding = 3><tr><th colspan=" + (party.length + (costumed ? 1 : 0)) + ">" + (ownParty ? "Current" : sys.name(id) + "'s" ) + " Party</th></tr><tr>";
        if (!ownParty) {
            id = srcId || id;
        }
        var isAndroid = (sys.os(id) === "android");
        if (isAndroid) {
            out += "<br />";
        }
        if (costumed) {
            out += "<td>" + costumeSprite(player.costume, isAndroid) + "</td>";
        }
        for (var e in party) {
            out += "<td align=center>" + party[e] + "</td>";
        }
        out += "</tr><tr>";
        if (costumed) {
            out += "<td align=center>" + costumeAlias(player.costume, false, true) + "</td>";
        }
        for (var e in player.party) {
            var member = getPokemonInfo(player.party[e]);
            var name = sys.pokemon(member[0]) + (member[1] ? "*" : "");
            out += "<td align=center>#" + pokeInfo.readableNum(member[0]) + " " + name;
            if (ownParty && sys.os(id) !== "android") {
                out += "<p>"; //puts a little too much space between lines
                out += "[" + link("/party active:" + name, "Active") + " / " + link("/party remove:" + name, "Remove") + "]";
            }
            out += "</td>";
        }
        out += "</tr></table>";
        if (isAndroid) {
            out += "<br />";
        }
        return out;
    };
    this.showBox = function(player, num, isAndroid, textOnly, shopLink) {
        var out = "";
        var maxPages,
            list = player.pokemon,
            page = parseInt(num, 10);

        var perBox = itemData.box.bonusRate;
        if (!isNaN(page) && num != "all") {
            maxPages = Math.floor(list.length / (perBox)) + (list.length % perBox === 0 ? 0 : 1);

            if (page > maxPages) {
                page = maxPages;
            }
            list = list.slice(perBox * (page - 1), perBox * (page - 1) + perBox);
        }
        
        var label = "Box Capacity (" + player.pokemon.length + "/" + (player.balls.box *  perBox) + ")";
        if (textOnly) {
            out += this.listPokemonText(list, label, shopLink);
        } else {
            out += this.listPokemon(list, label);
            if (isAndroid) {
                out += "<br />";
            }
        }

        if (!isNaN(page)) {
            if (page > 1) {
                out += "[<a href='po:send//box" + (shopLink ? "s" : (textOnly? "t" : "" )) + " " + (page - 1) + "'>" + utilities.html_escape("< Box " + (page - 1)) + "</a>]";
            }
            if (page < maxPages) {
                if (page > 1) {
                    out += " ";
                }
                out += "[<a href='po:send//box" + (shopLink ? "s" : (textOnly? "t" : "" )) + " " + (page + 1) + "'>" + utilities.html_escape("Box " + (page + 1) + " >") + "</a>]";
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
    this.listPokemonText = function(list, title, shopLink) {
        var out = "", normal = [], e, p;
        for (e in list) {
            p = poke(list[e]);
            if (shopLink) {
                normal.push(link("/sell " + p, p));
            } else {
                normal.push(p);
            }
        }
        out += "<b>" + title + "</b><br/>";
        out += normal.join(", ");
        out += "<br/>";
        return out;
    };
    this.showBag = function(player, isAndroid, textOnly) {
        //Manual arrays because easier to put in desired order. Max of 11 in each array or you need to change the colspan. Line1 only gets 9 due to money taking up a slot
        var line1 = [/*money*/ "silver", "box", "entry", "gacha", "itemfinder", "gem", "dust", "rare", "spray", "mega", "bait", "rock"];
        var line2 = ["safari", "great", "ultra", "master", "myth", "luxury", "quick", "heavy", "spy", "clone", "premier", "mono", "egg", "bright"];
        var line3 = ["amulet", "soothe", "scarf", "eviolite", "crown", "honey", "battery", "pearl", "stardust", "bigpearl", "starpiece", "nugget", "bignugget", "stick"];
        var line4 = ["pack", "water", "materia", "fragment", "cherry", "blkapricorn", "whtapricorn", "coupon", "burn", "golden"];

        var out = "";
        out += bagRow(player, line1, isAndroid, textOnly, true);
        out += bagRow(player, line2, isAndroid, textOnly);
        out += bagRow(player, line3, isAndroid, textOnly);
        out += bagRow(player, line4, isAndroid, textOnly);
        out += (textOnly ? "" : "</table>");
        return out;
    };
    this.showCostumes = function (player) {
        var out = [], n, i;
        for (i = 0; i < player.costumes.length; i++) {
            n = costumeAlias(player.costumes[i], false, true);
            out.push(link("/dressup " + n, n));
        }
        return "Owned Costumes: " + (out.length > 0 ? out.join(", ") : "None");
    };
    this.changeCostume = function (src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (!player.tutorial.inTutorial && player.tutorial.step !== 4) {
            if (cantBecause(src, "change your costume", ["battle", "auction", "wild", "contest", "event", "tutorial"])) {
                return;
            }
        }

        data = data.toLowerCase();
        if (data === "*") {
            if (player.cooldowns.costume > now()) {
                safaribot.sendMessage(src, "You can change your costume in " + timeLeftString(player.cooldowns.costume) + ".", safchan);
            } else {
                safaribot.sendMessage(src, "You are able to change your costume right now!", safchan);
            }
            return;
        }
        
        var cos = costumeAlias(data, true);
        var currentTime = now();
        var costumeName = costumeAlias(data, false, true);

        if (cos !== "none") {
            if (player.costume === cos) {
                safaribot.sendMessage(src, "You are already wearing the " + costumeName + " costume!", safchan);
                return;
            }
            if (allCostumes.indexOf(cos) === -1){
                safaribot.sendMessage(src, cos + " is not a valid costume!", safchan);
                return;
            }
            if (!player.costumes.contains(cos)) {
                safaribot.sendMessage(src, "You do not have the " + costumeName + " costume!", safchan);
                return;
            }
            if (player.cooldowns.costume > currentTime) {
                safaribot.sendMessage(src, "You changed your costume recently. Please try again in " + timeLeftString(player.cooldowns.costume) + "!", safchan);
                return;
            }
        } else if (player.costume === "none") {
            safaribot.sendMessage(src, "You are not currently wearing a costume!", safchan);
            return;
        }

        player.costume = cos;
        if (cos === "none") {
            safaribot.sendMessage(src, "You removed your costume! You can put on a new costume in " + timeLeftString(player.cooldowns.costume) + ".", safchan);
        } else {
            player.cooldowns.costume = currentTime + hours(4);
            safaribot.sendMessage(src, "You changed into your " + costumeName + " costume! [Effect: " + costumeData[cos].effect + "]", safchan);
            if (player.tutorial.inTutorial && player.tutorial.step === 4 && costumeName === costumeData.preschooler.fullName) {
                advanceTutorial(src, 5);
            }
        }
        this.saveGame(player);
    };
    this.getCostumes = function (src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);

        var rec = player.records;
        var c = player.costumes;
        var received = [], notReceived = [];

        for (var e in costumeData) {
            if (costumeData.hasOwnProperty(e)) {
                e = costumeData[e];
                var giveCostume = false;
                if (!c.contains(e.name)) {
                    if (e.acqReq > 0 && e.record in rec && !e.specialAcq) {
                        if (rec[e.record] >= e.acqReq) {
                            if (e.acqReq2 > 0 && e.record2 in rec) {
                                if (rec[e.record2] >= e.acqReq2) {
                                    giveCostume = true;
                                }
                            } else {
                                giveCostume = true;
                            }
                        }
                        if (giveCostume) {
                            c.push(e.name);
                            received.push(e.fullName);
                        } else {
                            notReceived.push(((e.noAcq || "It is not currently known how") + " to obtain the <b>" + e.fullName + "</b> costume!").format(addComma(Math.max(e.acqReq - rec[e.record], 0)), addComma(Math.max(e.acqReq2 - rec[e.record2], 0))));
                        }
                    } else if (e.specialAcq) {
                        notReceived.push(e.noAcq + " to obtain the <b>" + e.fullName + "</b> costume!");
                    }
                }
            }
        }
        if (received.length + notReceived.length === 0) {
            safaribot.sendMessage(src, "You currently own all of the available costumes.", safchan);
        } else {
            for (var x in notReceived) {
                safaribot.sendHtmlMessage(src, notReceived[x], safchan);
            }
            if (received.length > 0) {
                safaribot.sendHtmlMessage(src, "<b>Received the following " + plural(received.length, "costume") + ":</b> " + readable(received, "and") + ".", safchan);
            }
        }
        if (player.tutorial.step === 4) {
            tutorMsg(src, "Great! Now you can use " + link("/dressup Preschooler") + " to change costumes.");
        }
        this.saveGame(player);
    };
    this.removePokemon = function(src, pokeNum) {
        var player = getAvatar(src);
        if (player.pokemon.contains(pokeNum)) {
            player.pokemon.splice(player.pokemon.lastIndexOf(pokeNum), 1);
        }

        if (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum)) {
            do {
                player.party.splice(player.party.lastIndexOf(pokeNum), 1);
            } while (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum));
        }
    };
    this.removePokemon2 = function(player, pokeNum) {
        if (player.pokemon.contains(pokeNum)) {
            player.pokemon.splice(player.pokemon.lastIndexOf(pokeNum), 1);
        }
        if (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum)) {
            do {
                player.party.splice(player.party.lastIndexOf(pokeNum), 1);
            } while (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum));
        }
    };
    this.findPokemon = function(src, commandData, textOnly, shopLink) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (commandData === "*") {
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "How to use /find:", safchan);
            safaribot.sendMessage(src, "Define a parameter (Name, Number, BST, Type, Shiny, CanEvolve, FinalForm, CanMega, Duplicate or Region) and a value to find Pokémon in your box. Examples: ", safchan);
            safaribot.sendMessage(src, "For Name: Type any part of the Pokémon's name. e.g.: /find name LUG (both Lugia and Slugma will be displayed, among others with LUG on the name)", safchan);
            safaribot.sendMessage(src, "For Type: Type any one or two types. If you type 2, only pokémon with both types will appear. e.g.: /find type water grass", safchan);
            safaribot.sendMessage(src, "For Duplicate: Type a number greater than 1. e.g.: /find duplicate 3 (will display all Pokémon that you have at least 3 copies)", safchan);
            safaribot.sendMessage(src, "For Region: Select any valid region (" +  readable(generations.slice(1, generations.length), "or") + ") to display all currently owned Pokémon from that region", safchan);
            safaribot.sendMessage(src, "For Number and BST: There are 4 ways to search with those parameters:", safchan);
            safaribot.sendMessage(src, "-Exact value. e.g.: /find bst 500 (displays all Pokémon with BST of exactly 500)", safchan);
            safaribot.sendMessage(src, "-Greater than. e.g.: /find bst 400 > (displays all Pokémon with BST of 400 or more)", safchan);
            safaribot.sendMessage(src, "-Less than. e.g.: /find bst 350 < (displays all Pokémon with BST of 350 or less)", safchan);
            safaribot.sendMessage(src, "-Range. e.g.: /find number 1 150 (displays all Pokémon with pokédex number between 1 and 150)", safchan);
            safaribot.sendMessage(src, "For Shiny, CanEvolve, FinalForm and CanMega: No additional parameter required.", safchan);
            safaribot.sendMessage(src, "To look for more than one paramater, use && (e.g.: '/find region johto && duplicate 3' to look for Pokémon from Johto that you have 3 copies)", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        
        var multi = commandData.split("&&");
        var str, info, crit, val, m, def, title = [], list, current = player.pokemon.concat();
        
        for (m = 0; m < multi.length; m++) {
            list = [];
            str = multi[m].trim();
            info = str.split(":");
            crit = "abc", val = "1";
            if (info.length < 2) {
                info = str.split(" ");
            }

            crit = info[0].toLowerCase();
            val = info.length > 1 ? info[1].toLowerCase() : "asc";
            
            def = applyFilterCriteria(src, info, crit, val, list, current);
            if (!def) {
                return;
            }
            title.push(def);
            
            current = list.concat();
        }
        if (textOnly) {
            sys.sendHtmlMessage(src, this.listPokemonText(list, "Pokémon " + readable(title) + " (" + list.length + ")", shopLink), safchan);
        } else {
            sys.sendHtmlMessage(src, this.listPokemon(list, "Pokémon " + readable(title) + " (" + list.length + ")"), safchan);
        }
    };
    function applyFilterCriteria(src, info, crit, val, list, current) {
        var noparam = ["shiny", "canevolve", "finalform", "canmega"], def;
        
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
                case "canevolve":
                    crit = "canevolve";
                    break;
                case "canmega":
                    crit = "canmega";
                    break;
                case "finalform":
                    crit = "finalform";
                    break;
                case "region":
                    crit = "region";
                    break;
                default:
                    crit = "abc";
            }
        } else if (!noparam.contains(crit)) {
            crit = "abc";
            val = info[0].toLowerCase();
        }

        var mode = "equal";
        if (crit == "abc") {
            val = val.toLowerCase();
            current.forEach(function(x){
                if (sys.pokemon(x).toLowerCase().indexOf(val) !== -1) {
                    list.push(x);
                }
            });
            return "with " + val + " in their name";
        }
        else if (crit == "number") {
            def = rangeFilter(src, current, list, val, mode, "Pokédex Number", info, crit);
            if (!def) {
                return false;
            }
            return def;
        }
        else if (crit == "bst") {
            def = rangeFilter(src, current, list, val, mode, "BST", info, crit);
            if (!def) {
                return false;
            }
            return def;
        }
        else if (crit == "type") {
            var type1 = cap(val.toLowerCase()),
                type2 = null;

            if (info.length > 2) {
                type2 = cap(info[2].toLowerCase());
            }

            if (!(type1 in effectiveness)) {
                safaribot.sendMessage(src, type1 + " is not a valid type!", safchan);
                return false;
            }
            if (type2 && !(type2 in effectiveness)) {
                safaribot.sendMessage(src, type2 + " is not a valid type!", safchan);
                return false;
            }

            current.forEach(function(x){
                if (hasType(x, type1) && (!type2 || hasType(x, type2))) {
                    list.push(x);
                }
            });
            return "with " + type1 + (type2 ? "/" + type2 : "") + " type";
        }
        else if (crit == "shiny") {
            current.forEach(function(x){
                if (typeof x === "string") {
                    list.push(x);
                }
            });
            return "shiny";
        }
        else if (crit == "duplicate") {
            var pokeList = current.concat().sort();
            val = parseInt(val, 10);
            if (isNaN(val) || val < 2) {
                safaribot.sendMessage(src, "Please specify a valid number higher than 1!", safchan);
                return false;
            }
            var normalCount = {}, shinyCount = {}, p, obj, e;
            for (var i = 0, l = pokeList.length; i < l; i++) {
                p = pokeList[i];
                obj = typeof p === "string" ? shinyCount : normalCount;
                if (!obj.hasOwnProperty(p)) {
                    obj[p] = 0;
                }
                obj[p]++;
            }
            for (i in normalCount) {
                if (normalCount[i] >= val) {
                    p = parseInt(i, 10);
                    for (e = 0, l = normalCount[i]; e < l; e++) {
                        list.push(p);
                    }
                }
            }
            for (i in shinyCount) {
                if (shinyCount[i] >= val) {
                    for (e = 0, l = shinyCount[i]; e < l; e++) {
                        list.push(i);
                    }
                }
            }
            return "with at least " + val + " duplicates";
        }
        else if (crit == "canevolve") {
            current.forEach(function(x){
                if (pokeInfo.species(x) in evolutions) {
                    list.push(x);
                }
            });
            return "that can evolve";
        }
        else if (crit == "finalform") {
            current.forEach(function(x){
                if (!(pokeInfo.species(x) in evolutions) && !isMega(x)) {
                    list.push(x);
                }
            });
            return "fully evolved";
        }
        else if (crit == "canmega") {
            current.forEach(function(x){
                if (!isMega(x) && pokeInfo.species(x) in megaEvolutions) {
                    list.push(x);
                }
            });
            return "that can mega evolve";
        } 
        else if (crit == "region") {
            val = cap(val.toLowerCase());
            var pos = generations.indexOf(val);
            if (pos < 1) { //"None" is 0 index, we don't want to include that. Both here and in the readable
                safaribot.sendMessage(src, val + " is not a valid region! Valid regions are " + readable(generations.slice(1, generations.length)) + ".", safchan);
                return false;
            }
            current.forEach(function(x){
               if (generation(x) === pos) {
                    list.push(x);
               }               
            });
            return "from the " + val + " Region";
        }
    }
    function rangeFilter(src, current, list, val, mode, paramName, info, type) {
        val = parseInt(val, 10);
        var val2;
        if (isNaN(val)) {
            safaribot.sendMessage(src, "Please specify a valid number!", safchan);
            return false;
        }
        var title = "with " + paramName + " equal to " + val;
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
                        title = "with " + paramName + " greater than " + val;
                        break;
                    case "<":
                    case "lower":
                    case "less":
                    case "-":
                    case "below":
                        mode = "less";
                        title = "with " + paramName + " less than " + val;
                        break;
                }
                if (mode !== "greater" && mode !== "less") {
                    safaribot.sendMessage(src, "Invalid parameter! Use either >, < or another number.", safchan);
                    return false;
                }
            } else {
                mode = "range";
                title = "with " + paramName + " between " + val + " and " + val2;
            }
        }
        var param;
        current.forEach(function(x){
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
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
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
            player.pokemon.sort(function(a, b){
                if (pokeInfo.species(a) != pokeInfo.species(b)) {
                    return pokeInfo.species(a)-pokeInfo.species(b);
                } else {
                    return pokeInfo.forme(a)-pokeInfo.forme(b);
                }
            });
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by Pokédex Number (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        else if (crit === "abc") {
            player.pokemon.sort(function(a, b){
                    if(sys.pokemon(a) < sys.pokemon(b)) { return -1;}
                    if(sys.pokemon(a) > sys.pokemon(b)) { return 1;}
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
    this.showRecords = function (src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var rec = player.records;

        if (commandData === "*" || commandData.toLowerCase() !== "earnings") {
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "*** Player Records ***", safchan);
            sys.sendMessage(src, "±Pokémon: {0} Pokémon caught in {1} attempts ({2}). Performed {3}, {4}, and {5}. Stole {6} Pokémon from NPCs.".format(rec.pokesCaught, rec.pokesNotCaught, percentage(rec.pokesCaught, rec.pokesNotCaught), plural(rec.pokesEvolved, "Evolution"), plural(rec.megaEvolutions, "Mega Evolution"), plural(rec.pokesCloned, "Cloning"), rec.pokesStolen), safchan);
            sys.sendMessage(src, "±Bait: Used {0} with {1} ({2}) and {3} ({4}). Snagged {5} Pokémon away from other Players.".format(plural(rec.baitUsed, "bait"), plural(rec.baitAttracted, "success"), percentage(rec.baitAttracted, rec.baitUsed), plural(rec.baitNothing, "failure"), percentage(rec.baitNothing, rec.baitUsed), rec.notBaitedCaught), safchan);
            var earnings = rec.pokeSoldEarnings + rec.luxuryEarnings + rec.pawnEarnings + rec.collectorEarnings + rec.rocksWalletEarned + rec.rocksWindowEarned - rec.rocksWindowLost - rec.rocksWalletLost + rec.pokeRaceEarnings + rec.pyramidMoney;
            var silverEarnings = rec.scientistEarnings + rec.arenaPoints + rec.pyramidSilver;
            sys.sendHtmlMessage(src, "<font color='#3daa68'><timestamp/><b>±Money:</b></font> Earned ${0} and {1} [{2}].".format(addComma(earnings), plural(silverEarnings, "silver"), (sys.os(src) === "android" ? "Use \"/records earnings\" to show a breakdown by source" : link("/records earnings", "By source"))), safchan);
            sys.sendMessage(src, "±Gachapon: Used {0} ({1}, {2}).".format(plural(rec.gachasUsed, "gacha"), plural(rec.masterballsWon, "master"), plural(rec.jackpotsWon, "Jackpot")), safchan);
            var onOthers = rec.rocksHit + rec.rocksWalletHit + rec.rocksMissedWindow + rec.rocksItemfinderHit;
            sys.sendMessage(src, "±{0}: Threw {1} ({2} accuracy, {3}). Embarassed {4}.".format(finishName("rock"), plural(rec.rocksThrown, "rock"), percentage(onOthers, rec.rocksThrown), plural(rec.rocksHit, "hit"), plural(rec.rocksBounced, "time")), safchan);
            var onMe = rec.rocksHitBy + rec.rocksWalletHit + rec.rocksDodgedWindow + rec.rocksChargesLost;
            sys.sendMessage(src, "±{0}: Hit by {1} ({2} evasion, {3}). Caught {4}.".format(finishName("rock"), plural(onMe, "rock"), percentage(rec.rocksDodged, rec.rocksDodged + onMe), plural(rec.rocksDodged, "dodge"), plural(rec.rocksCaught, "throw")), safchan);
            sys.sendMessage(src, "±Game: {0} Consecutive Logins{1}. Won {2} Contests.".format(rec.consecutiveLogins, (player.consecutiveLogins !== rec.consecutiveLogins ? " (currently " + player.consecutiveLogins + ")" : ""),rec.contestsWon), safchan);
            sys.sendMessage(src, "±Game: Opened {0} and used {1}. Hatched {2} and {3} with {4} being a Rare Pokémon!".format(plural(rec.packsOpened, "pack"), plural(rec.gemsUsed, "gem"), plural(rec.eggsHatched, "egg"), plural(rec.brightEggsHatched, "bright"), rec.rareHatched), safchan);
            var given = rec.collectorGiven + rec.scientistGiven;
            sys.sendMessage(src, "±Quests: Turned in {0} Pokémon (Collector: {1}, Scientist: {2}). Arena Record: {3}-{4} ({5}, {6}). Performed {7} and {8}.".format(given, rec.collectorGiven, rec.scientistGiven, rec.arenaWon, rec.arenaLost, percentage(rec.arenaWon, rec.arenaWon + rec.arenaLost), plural(rec.arenaPoints, "point"), plural(rec.wonderTrades, "Wonder Trade"), plural(rec.transmutationsMade, "Transmutation")), safchan);
            sys.sendMessage(src, "±Quests: Lead a {0} point Pyramid Run. Participated in a {1} point Pyramid Run. Cleared the Pyramid {2} as Leader and {3} as Helper. Reached the {4} Floor of Battle Tower.".format(rec.pyramidLeaderScore, rec.pyramidHelperScore, plural(rec.pyramidLeaderClears, "time"), plural(rec.pyramidHelperClears, "time"), getOrdinal(rec.towerHighest)), safchan);
            sys.sendMessage(src, "±Events: Won {0} with {1}. Won {2} ({3} as Favorite, {4} as Underdog). Won Battle Factory {5} and was Runner-up {6}. Scored a high of {7} and received a prize during a Quiz.".format(plural(rec.factionWins, "Faction War"), plural(rec.factionMVPs, "MVP"), plural(rec.pokeRaceWins, "Pokémon Race"), rec.favoriteRaceWins, rec.underdogRaceWins, plural(rec.factoryFirst, "time"), plural(rec.factorySecond, "time"), plural(rec.topQuizScore, "point")), safchan);
            sys.sendMessage(src, "", safchan);
        } else {
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "*** Earnings Breakdown ***", safchan);
            safaribot.sendMessage(src, "Sold Pokémon: $" + addComma(rec.pokeSoldEarnings), safchan);
            safaribot.sendMessage(src, es(finishName("luxury")) + ": $" + addComma(rec.luxuryEarnings), safchan);
            safaribot.sendMessage(src, "Pawned Items: $" + addComma(rec.pawnEarnings), safchan);
            safaribot.sendMessage(src, "Collector Reward: $" + addComma(rec.collectorEarnings), safchan);
            safaribot.sendMessage(src, "Pokémon Race: $" + addComma(rec.pokeRaceEarnings), safchan);
            safaribot.sendMessage(src, "Hitting Wallets: $" + addComma(rec.rocksWalletEarned), safchan);
            safaribot.sendMessage(src, "Window Restitution: $" + addComma(rec.rocksWindowEarned), safchan);
            safaribot.sendMessage(src, "Pyramid Loot: $" + addComma(rec.pyramidMoney), safchan);
            safaribot.sendMessage(src, "Dropped from Wallet: -$" + addComma(rec.rocksWalletLost), safchan);
            safaribot.sendMessage(src, "Repairing Windows: -$" + addComma(rec.rocksWindowLost), safchan);
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Scientist Reward: " + plural(rec.scientistEarnings, "silver"), safchan);
            safaribot.sendMessage(src, "Arena Reward: " + plural(rec.arenaPoints, "silver"), safchan);
            safaribot.sendMessage(src, "Pokémon Race: " + plural(rec.pokeRaceSilver, "silver"), safchan);
            safaribot.sendMessage(src, "Pyramid Loot: " + plural(rec.pyramidSilver, "silver"), safchan);
            sys.sendMessage(src, "", safchan);
        }
    };
    this.assignIdNumber = function(player, force) {
        if (!lastIdAssigned) {
            lastIdAssigned = loadLastId();
        }
        if (player) {
            if (!("idnum" in player) || player.idnum === undefined || player.idnum === null || isNaN(player.idnum) || player.idnum < 0 || typeof player.idnum !== "number") {
                player.idnum = 0;
            }
            if (player.idnum === 0 || force) {
                lastIdAssigned++;
                permObj.add("lastIdAssigned", lastIdAssigned);
                permObj.save();
                player.idnum = lastIdAssigned;
            }
        }
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
                    this.evolvePokemon(src, getInputPokemon(info.id + (typeof info.id == "string" ? "*" : "")), info.to, "reverted to", true);
                }
                player.megaTimers.splice(e, 1);
            }
        }
    };
    this.setFavoriteBall = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (cantBecause(src, "set a favorite ball", ["tutorial"])) {
            return;
        }
        if (commandData === "*") {
            safaribot.sendMessage(src, "Your favorite ball is " + finishName(player.favoriteBall) + "! This ball will be thrown automatically if you do not specify a ball when throwing.", safchan);
            return;
        }
        
        var ball = itemAlias(commandData);
        if (!isBall(ball)) {
            ball = "safari";
        }
        player.favoriteBall = ball;
        safaribot.sendMessage(src, "You changed your favorite ball to " + finishName(ball) + "! This ball will be thrown automatically if you do not specify a ball when throwing.", safchan);
        this.saveGame(player);
    };
    
    /* Tutorial */
    this.skipTutorial = function (src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (!player.tutorial.inTutorial) {
            safaribot.sendMessage(src, "You have either completed or skipped the tutorial!", safchan);
            return;
        }
        if (commandData !== "confirm") {
            tutorMsg(src, "Are you sure you want to skip the tutorial? You may have a difficult time playing and will miss out on a special gift to help you in your journey! If you are really sure you want to skip the tutorial, type " + link("/skiptutorial confirm"));
            return;
        }
        if (player.tutorial.step > 0) {
            if (player.tutorial.step > 9) {
                tutorMsg(src, "You're nearly finished! Just hold on a little longer and you'll be ready to play! Use " + link("/tutorial") + " to repeat the last step.");
                return;
            }
            tutorMsg(src, "It's sad to see you skip the tutorial while you have already made progress on it. Take care on your journey and if you have any questions, other players may be able to assist you!");
            safari.resetToStart(src);
        } else {
            tutorMsg(src, "Here's a small gift pack to help you out. Take care on your journey and if you have any questions, other players may be able to assist you!");
        }
        welcomePack(src);
        sys.appendToFile(miscLog, now() + "|||" + sys.name(src) + "|||used /skiptutorial\n");

    };
    this.progressTutorial = function (src, automatedStep, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        this.saveGame(player); //Save so if anything breaks, progress isn't lost
        var step = automatedStep || player.tutorial.step;
        if (step === 0) {
            step = 1;
            advanceTutorial(src, step);
            return;
        } else if (step === 12 && commandData && commandData.toLowerCase() === "finish") {
            step = 13;
        }

        switch(step) {
            //Buy Safari Ball + Bait
            case 1: {
                player.money = 100;
                player.balls.safari = 6;
                tutorMsg(src, "Thank for you letting me teach you the basics of Safari! I have given you $100 and a handful of Safari Balls. You can use " + link("/bag") + " to see what you are currently carrying. Now, your " + poke(player.starter) + " looks a little lonely. Why don't you buy a bait from the shop to attract a friend? Use " + link("/buy bait") + " to directly buy that item, or you can use " + link("/buy") + " to check what else the shop has to offer!");
                tutorMsg(src, "If at any point you forget what you need to do, simply type " + link("/tutorial") + " to repeat the directions for that step!");
            }
            break;
            //Use Bait+ Catch Wild
            case 2: {
                tutorMsg(src, "Great job! After you finish the tutorial, the shop will have plenty of items to help you during your stay. Now let's use this bait to attempt to attract a Wild Pokémon with " + link("/bait") + ". Then when one appears, use " + link("/catch") + " to throw a ball to catch it!");
            }
            break;
            //Party modification
            case 3: {
                tutorMsg(src, "Congratulations on your catch! One thing to note about Bait is that the person that attracts the Wild Pokémon gets to throw their ball first while everyone else prepares. After they throw, everyone else's ball is thrown in a random order, so make sure you prepare your throw quickly after a Wild Pokémon appears!");
                tutorMsg(src, "Your " + poke(player.starter) + " is excited they have a new friend to play with! Why don't you add that Pikachu you just caught to your party with " + link("/add Pikachu") + "? As you catch more Pokémon, it may be difficult to keep track. Luckily, you can view your currently owned Pokémon with " + link("/box") + " and even view your current party with " + link("/party"));
            }
            break;
            //Get Costume + Equip Costume
            case 4: {
                tutorMsg(src, "Oh right! I almost forgot, with all the excitement of catching your first Pokémon, you can even wear costumes in Safari to express your individuality. Use " + link("/getcostumes") + " to obtain the Preschooler costume and then you can use " + link("/dressup Preschooler") + " to change into your new costume. Costumes are fun to collect and wear but some are difficult to obtain; you should try to collect them all one day! You can view what costumes you currently own with " + link("/costumes"));
            }
            break;
            //Buy Gacha Ticket+ Use gacha
            case 5: {
                if (player.balls.gacha !== 1) {
                    player.money = 200;
                }
                tutorMsg(src, "Now, let's learn about some recreational activities around the Safari Zone. First up is Gachapon. The premise of Gachapon is simple: You put in a ticket and a capsule pops out with a prize! The easiest way of obtaining these tickets is buying them from the shop. If you forgot how to view the shop, use " + link("/buy") + " or buy them directly with " + link("/buy gacha") + ". Once you have the ticket in hand, use " + link("/gacha") + " to use the machine.");
            }
            break;
            //Use Gem + Finder
            case 6: {
                tutorMsg(src, "The next recreational activity is using the Itemfinder to look for rare items! I've got a spare one you can have, but unfortunately it doesn't have any charge left... Wait a second, you got an Ampere Gem from Gachapon?! Wow, what luck! This works out perfectly! You can use the gem to recharge the Itemfinder with " + link("/use gem") + ". Then you can use " + link("/finder") + " to start looking for rare items!");
            }
            break;
            //Use Rare (extra dust provided) + Evolve Pokemon
            case 7: {
                tutorMsg(src, "Nice! You found a Rare Candy. You seem to be very lucky during this tutorial. It almost seems rigged... Anyway, you should unwrap that Rare Candy and feed it to your Pikachu to evolve it. You can unwrap it by using " + link("/use rare") + ".");
            }
            break;
            case 8: {
                var cr = evolutions[pokeInfo.species(sys.pokeNum("Pikachu"))].candies;
                tutorMsg(src, "Hmm... You didn't seem to get enough to evolve your Pikachu. According to " + link("/bst Pikachu") + ", you need " + cr + " Candy Dust. I'll help you out this time and give you the additional 200 you need, then you will be able to evolve your Pikachu with " + link("/evolve Pikachu"));
                if (player.balls.dust < cr) {
                    player.balls.dust = cr;
                    safaribot.sendMessage(src, "You received a pouch of 200 Candy Dust from Kangaskhan.", safchan);
                }
            }
            break;
            //Turn in evolved Pokemon to Collector (Quests)
            case 9: {
                tutorMsg(src, "Congratulations on your first evolution! While every evolved Pokémon is catchable in the Safari Zone, some are much rarer than others, so you'll likely need to perform some evolutions. The next major recreational activity in Safari is questing! Quests are fun, varied, and give you rewards unobtainable elsewhere. Quests range from the Battle Tower to Arena Battles to helping out inhabitants of the Safari Zone. You can check them all out with " + link("/quests") + " but for now we're going to help the Collector with his urgent request. You can access this quest with " + link("/quest Collector:start"));
            }
            break;
            //Contests
            case 10: {
                tutorMsg(src, "Well that was nice of you to help the Collector out. Now you're able to participate in Contests that happen every " + Math.floor(contestCooldownLength/60) + " minutes. Rumor has it that certain Pokémon only spawn during Contests and Contests are an easy way to amass a large collection of Pokémon, so you should participate often! Shortly before each Contest begins, there will be an announcement stating possible themes and rules for the next Contest. Themes determine what Pokémon will spawn. Rules affect catch rate, both positively and negatively, so pay attention and adjust your party accordingly! Why don't you flip through the Contest Booklet with " + link("/contestrules") + "? Once you have completed this, you can progress to the next step with " + link("/tutorial"));
            }
            break;
            //Rules
            case 11: {
                tutorMsg(src, "Now, in order to make the experience fun for everyone, there are a few rules you need to follow while playing in Safari. All you need to do to finish this step of the tutorial is read the information in " + link("/safarirules") + " then use " + link("/tutorial") + " to progress the tutorial.");
            }
            break;
            //Shop, Auction, Battles
            case 12: {
                tutorMsg(src, "Nicely done. You have completed the tutorial. There are lots of different things to still do in Safari, but you're pretty well set with the basics. You can interact with other players by challenging them to a battle with " + link("/challenge") + ", host auctions to sell your Pokémon or items with " + link("/auction") + ", and even set up a shop for others to buy from you with " + link("/shop") + "! You can use " + link("/commands safari") + " to view all the commands available, both ones we went over and ones we didn't. If you have any additional questions, feel free to ask other Trainers, they will help you out! When you are ready to start your adventure, use " + link("/tutorial finish"));
            }
            break;
            //End of tutorial
            case 13: {
                tutorMsg(src, "Congratulations! You have completed the tutorial.");
                welcomePack(src, true);
            }
            break;
        }
        this.saveGame(player);
    };
    this.buyForTutorial = function(src, data) {
        var info = data.split(":"),
            product = info.length > 1 && info[1] !== "" ? info[1].toLowerCase() : "*",
            player = getAvatar(src);

        if (player.tutorial.privateWildPokemon) {
            tutorMsg(src, "This is no time to be shopping! Use " + link("/catch") + " to throw a ball at the Pikachu before it runs away!");
            return;
        }

        if (product === "*") {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You can buy the following Items:", safchan);
            if (player.tutorial.step >= 1) { safaribot.sendHtmlMessage(src, link("/buy bait", "Bait") + ": $100", safchan);}
            if (player.tutorial.step >= 5) { safaribot.sendHtmlMessage(src, link("/buy gacha", "Gachapon Ticket") + ": $200", safchan);}
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (player.tutorial.step === 1 && player.money === 100) {
            if (product !== "bait") {
                tutorMsg(src, "I gave you that money to buy a Bait! Please do so with " + link("/buy bait"));
                return;
            } else {
                if (player.balls.bait === 1) {
                    tutorMsg(src, "You already bought the Bait. Please use it with " + link("/bait"));
                    return;
                }
                safaribot.sendMessage(src, "You bought a Bait for $100!", safchan);
                player.balls.bait = 1;
                player.money -= 100;
                advanceTutorial(src, 2);
                return;
            }
        } else if (player.tutorial.step === 5 && player.money === 200) {
            if (product !== "gacha") {
                tutorMsg(src, "I gave you that money to buy a Gachapon Ticket! Please do so with " + link("/buy gacha"));
                return;
            } else {
                if (player.balls.gacha === 1) {
                    tutorMsg(src, "You already bought the Gachapon Ticket. Please use it with " + link("/gacha"));
                    return;
                }
                safaribot.sendMessage(src, "You bought a Gachapon Ticket for $200!", safchan);
                player.balls.gacha = 1;
                player.money -= 200;
                tutorMsg(src, "You're pretty good at this, so I probably don't need to remind you that you can now use that ticket with " + link("/gacha"));
                return;
            }
        }
        tutorMsg(src, "You don't need to buy any item right now. If you forgot what to do, use " + link("/tutorial"));
    };
    this.tutorialBait = function (src) {
        var player = getAvatar(src);
        if (player.tutorial.privateWildPokemon) {
            tutorMsg(src, "There's already a Pokémon in front of you! Use " + link("/catch") + " to throw a ball at the Pikachu before it runs away!");
            return;
        }
        if (player.balls.bait !== 1) {
            player.balls.bait = 1;
            tutorMsg(src, "You seem to have misplaced your bait! Here's another one. Try throwing again with " + link("/bait"));
            return;
        }
        player.balls.bait = 0;
        this.saveGame(player);
        safaribot.sendMessage(src, "You left some bait out. The bait attracted a wild Pokémon!", safchan);
        safari.createTutorialWild(src, sys.pokeNum("Pikachu"));
    };
    this.createTutorialWild = function(src, dexNum) {
        var player = getAvatar(src);
        var num = parseInt(dexNum, 10);
        var pokeName = poke(num);
        player.tutorial.privateWildPokemon = num;

        var bst = getBST(num);
        sys.sendHtmlMessage(src, "<hr><center>A wild " + pokeName + " appeared! <i>(BST: " + bst + ")</i><br/>" + pokeInfo.sprite(num) + "<br />(Note: This Pokémon is only visible to you and will flee if you leave the channel! Any ball you throw will be directed at this Pokémon.)</center><hr>", safchan);
        ballMacro(src, true);
        tutorMsg(src, "Wow, a Wild Pikachu! Quick, throw a ball at it with " + link("/catch") + " before it flees!");
    };
    this.tutorialCatch = function(src, data) {
        var player = getAvatar(src);
        var pokeNum = player.tutorial.privateWildPokemon;
        var pokeName = poke(pokeNum);

        var ball = itemAlias(data);
        if (!isBall(ball)) {
            ball = "safari";
        }
        if (cantBecause(src, null, ["item"], ball)) {
            tutorMsg(src, "Try throwing a Safari Ball with " + link("/catch"));
            return;
        }
        var fullBall = finishName(ball);
        player.balls[ball] -= 1;

        sys.sendMessage(src, "", safchan);
        safaribot.sendMessage(src, "Gotcha! " + pokeName + " was caught with " + an(fullBall) + "! You still have " + plural(player.balls[ball], fullBall) + " left!", safchan);
        sys.sendMessage(src, "", safchan);

        player.pokemon.push(pokeNum);
        player.records.pokesCaught = 1; //We need this for preschooler costume
        player.tutorial.privateWildPokemon = null;
        advanceTutorial(src, 3);
    };
    this.tutorialGacha = function(src) {
        var player = getAvatar(src);
        if (player.balls.gacha !== 1) {
            if (player.money === 200) {
               tutorMsg(src, "You need to buy a Gachapon Ticket to use the Machine. Try " + link("/buy gacha") + " to buy one.");
               return;
            }
            player.balls.gacha = 1;
            tutorMsg(src, "You seem to have misplaced your Gachapon Ticket! Here's another one. Try using it again with " + link("/gacha"));
            return;
        }
        player.balls.gacha = 0;
        safaribot.sendMessage(src, "Gacha-PON! The Gachapon Machine has dispensed an item capsule. [Remaining Tickets: " + player.balls.gacha + "]", safchan);
        safaribot.sendMessage(src, "The Gachapon machine emits a bright flash of light as you reach for your prize. Despite being temporarily blinded, you know you just won an Ampere Gem due to a very faint baaing sound!", safchan);
        safaribot.sendMessage(src, "You received an Ampere Gem.", safchan);
        player.balls.gem = 1;
        advanceTutorial(src, 6);
    };
    this.tutorialUseItem = function(src, item) {
        var player = getAvatar(src);
        if (item === "gem") {
            if (player.balls.permfinder > 0) {
                player.balls.gem = 0;
                tutorMsg(src, "You've already recharged your Itemfinder. Now you can use it with " + link("/finder"));
                return;
            }
            if (player.balls.gem !== 1) {
                player.balls.gem = 1;
                tutorMsg(src, "You seem to have misplaced your Ampere Gem! Here's another one. Try using it with " + link("/use gem"));
                return;
            }
            safaribot.sendHtmlMessage(src, "The Ampere Gem begins to emit a soft baaing sound. Your Itemfinder then lights up and responds with a loud <b>BAA~!</b>", safchan);
            safaribot.sendMessage(src, "Your Itemfinder now has " + itemData.gem.charges + " charges!", safchan);
            player.balls.gem = 0;
            player.balls.permfinder = itemData.gem.charges;
            tutorMsg(src, "Great. Now the Itemfinder is working again. As a reminder, the manual states to use " + link("/finder") + " to use it!");
        } else if (item === "rare") {
            if (player.balls.dust > 0) {
                player.balls.rare = 0;
                tutorMsg(src, "You've already opened your Rare Candy. Now you can evolve your Pikachu with " + link("/evolve Pikachu"));
                return;
            }
            if (player.balls.rare !== 1) {
                player.balls.rare = 1;
                tutorMsg(src, "You seem to have misplaced your Rare Candy! Here's another one. Try using it with " + link("/use rare"));
                return;
            }
            var evoData = evolutions[pokeInfo.species(sys.pokeNum("Pikachu"))];
            var candiesRequired = evoData.candies || 300;
            safaribot.sendMessage(src, "You unwrap the Rare Candy and immediately notice it's cracked. Before you could touch it, the candy instantly turns into dust!", safchan);
            safaribot.sendMessage(src, "You received " + (candiesRequired - 200) + " Candy Dust!", safchan);
            player.balls.dust = candiesRequired - 200;
            player.balls.rare = 0;
            advanceTutorial(src, 8);
        }
    };
    this.tutorialFinder = function(src) {
        var player = getAvatar(src);
        if (player.balls.permfinder === itemData.gem.charges) {
            player.balls.permfinder -= 1;
            safaribot.sendMessage(src, "You pull out your Itemfinder ... ... ... But it did not detect anything. [Remaining charges: " + player.balls.permfinder + "].", safchan);
            tutorMsg(src, "I guess you weren't as lucky with Itemfinder as you were with Gachapon. Don't worry, it's not often you find items. Why don't you try using your Itemfinder again? (" + link("/finder") + ")");
        } else if (player.balls.permfinder === (itemData.gem.charges - 1)) {
            player.balls.permfinder -= 1;
            safaribot.sendHtmlMessage(src, "<b>Beep. Beep. BEEP! You found a Rare Candy behind a bush!</b>", safchan);
            player.balls.rare = 1;
            advanceTutorial(src, 7);
        }

    };
    this.tutorialQuest = function(src, start) {
        var player = getAvatar(src);
        var quest = player.quests.collector;
        if (start) {
            sys.sendMessage(src, "", safchan);
            safaribot.sendHtmlMessage(src, "Collector: Thank you so much for hearing my request! My Raichu has been very lonely lately. I'm looking to find another Raichu to keep it company. I don't have much to give you right now, but I can give you my old Contest Booklet and Entry Pass, allowing you to participate in Contests to catch wild Pokémon!", safchan);
            tutorMsg(src, "Oh! You have a Raichu! You could give it to him and get that Contest Booklet. It's a very helpful item that will allow you to catch tons of Pokémon! Your Raichu seems estatic to bring joy to another person, why don't you help the Collector out? Use " + link("/quest collector:finish") + " to fulfill his request!");
            sys.sendMessage(src, "", safchan);
            quest.requests = [sys.pokeNum("Raichu")];
            quest.reward = 1;
            quest.deadline = null;
            quest.cooldown = 0;
            this.saveGame(player);
        } else {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Collector: Thank you very much! My Raichu will be so happy playing with your Raichu! As promised, here's your Contest Booklet and Entry Pass. Feel free to flip through the booklet at any point, there's a lot of important information in it.", safchan);
            sys.sendMessage(src, "", safchan);
            this.removePokemon(src, quest.requests[0]);
            quest.reward = 0;
            quest.requests = [];
            quest.cooldown = now();
            quest.deadline = 0;
            advanceTutorial(src, 10);
        }
    };
    this.resetToStart = function(src) {
        var player = getAvatar(src);
        
        var tutItem = ["safari", "bait", "gacha", "gem", "rare", "permfinder", "dust"];
        for (var i = 0; i < tutItem.length; i++) {
            player.balls[tutItem[i]] = 0;
        }
        player.records.pokesCaught = 0;
        player.costume = "none";
        player.costumes = [];
        
        var start = player.starter;
        player.party = [];
        player.pokemon = [];
        player.pokemon.push(start);
        player.party.push(start);
        this.saveGame(player);
    };

    /* Items */
    this.throwBait = function (src, commandData, golden) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (player.tutorial.inTutorial && player.tutorial.step === 2) {
            safari.tutorialBait(src);
            return;
        }
        var isPreparing = preparationPhase > 0 && (!preparationFirst || sys.name(src).toLowerCase() !== preparationFirst);

        var mess = "[Track] " + sys.name(src) + " is using /"+(golden ? "g" : "")+"bait " + commandData;
        if (!isPreparing) {
            this.trackMessage(mess, player);
        }
        
        var item = golden ? "golden" : "bait";
        
        var baitName = finishName(item);
        var bName = baitName.toLowerCase();

        if (cantBecause(src, "throw " + bName, ["contest", "auction", "battle", "item", "event", "pyramid", "tutorial"], item)) {
            return;
        }
        if (isPreparing) {
            safari.throwBall(src, commandData, false, false, (golden ? "g" : "")+"bait", true);
            return;
        }
        if (cantBecause(src, "throw " + bName, ["wild"])) {
            return;
        }
        
        if (contestCooldown <= 13) {
            safaribot.sendMessage(src, "A contest is about to start, the Pokémon will run away if you throw " + an(bName) + " now!", safchan);
            return;
        }
        if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
            safaribot.sendMessage(src, "You can't catch any new Pokémon because all your boxes are full! Please buy a new box with /buy.", safchan);
            return;
        }
        var ballUsed = itemAlias(commandData, true);
        if (!isBall(ballUsed) || player.balls[ballUsed] === 0) {
            ballUsed = (player.balls[player.favoriteBall] > 0 ? player.favoriteBall : "safari");
        } else {
            ballUsed = isBall(commandData.toLowerCase()) ? commandData.toLowerCase() : "safari";
            ballUsed = toUsableBall(player, ballUsed);
        }
        if (!ballUsed) {
            safaribot.sendMessage(src, "If you throw " + an(bName) + " now, you will have no way to catch a Pokémon because you are out of balls!", safchan);
           return;
        }
        if (!golden && lastBaiters.indexOf(sys.name(src).toLowerCase()) !== -1) {
            safaribot.sendMessage(src, "You just threw some " + bName + " not too long ago. Let others have a turn! " + (baitCooldown > 0 ? "[Global cooldown: " + plural(baitCooldown, "second") + "]" : ""), safchan);
            return;
        }
        player.cooldowns.lastBaits.push(now());
        if (player.cooldowns.lastBaits.length > 5) {
            player.cooldowns.lastBaits.shift();
        }
        var list = player.cooldowns.lastBaits;
        var l = list.length - 1;
        var slip = 0;
        if (l >= 4 && list[l] - list[l-4] < 5000) {
            slip = 4;
        } else if (l >= 3 && list[l] - list[l-3] < 3900) {
            slip = 3;
        } else if (l >= 2 && list[l] - list[l-2] < 2800) {
            slip = 2;
        } else if (l >= 1 && list[l] - list[l-1] < 1800) {
            slip = 1;
        }
        if (slip) {
            var n = now(), amt = sys.rand(2, 3 + slip) * 1000;
            player.cooldowns.bait = (player.cooldowns.bait > n ? player.cooldowns.bait : n) + amt;
            safaribot.sendMessage(src, "The " + bName + " you were preparing to throw slipped from your hand! You went to catch it and now need to wait " + timeLeftString(player.cooldowns.bait) + " to throw again!", safchan);
            return;
        }
        if (golden) {
            if (goldenBaitCooldown > 0) {
                safaribot.sendMessage(src, "Please wait " + plural(goldenBaitCooldown, "second") + " before trying to attract another Pokémon with " + an(bName) + "!", safchan);
                return;
            }
        } else {
            if (baitCooldown > 0) {
                safaribot.sendMessage(src, "Please wait " + plural(baitCooldown, "second") + " before trying to attract another Pokémon with " + an(bName) + "!", safchan);
                return;
            }
        }
        if (player.cooldowns.bait > now()) {
            safaribot.sendMessage(src, "You can't use " + bName + " now! Please wait " + timeLeftString(player.cooldowns.bait) + " before throwing again!", safchan);
            return;
        }

        player.balls[item] -= 1;
        player.records[golden ? "goldenBaitUsed" : "baitUsed"] += 1;

        var perkBonus = Math.min(itemData.honey.bonusRate * player.balls.honey, itemData.honey.maxRate);
        if (player.truesalt < now() && chance(itemData[item].successRate + perkBonus)) {
            safaribot.sendAll((ballUsed == "spy" ? "Some stealthy person" : sys.name(src)) + " left some " + bName + " out. The " + bName + " attracted a wild Pokémon!", safchan);
            if (golden) {
                goldenBaitCooldown = itemData[item].successCD + sys.rand(0,9);
            } else { 
                baitCooldown = successfulBaitCount = itemData[item].successCD + sys.rand(0,9);
            }
            player.records.baitAttracted += 1;

            if (!golden) {
                if (lastBaiters.length >= lastBaitersAmount) {
                    lastBaiters.shift();
                }
                lastBaiters.push(sys.name(src).toLowerCase());
            }

            var p = player.nextSpawn;
            if (p.pokemon.num) {
                safari.createWild(p.pokemon.num, p.pokemon.shiny, p.amt, null, null, player, p.disguise);
                p.pokemon = p.disguise = {};
                p.amt = 1;
            } else {
                safari.createWild(null, null, 1, null, player.party[0], player, null, golden);
            }
            safari.throwBall(src, commandData, true);
            preparationFirst = sys.name(src).toLowerCase();
            if (!golden) {
                lastBaitersDecay = lastBaitersDecayTime;
            }
            isBaited = true;
            
            if (nextGachaSpawn <= now() + 9 * 1000) {
                nextGachaSpawn = now() + sys.rand(8, 11) * 1000;
            }
        } else {
            player.cooldowns.bait = now() + (itemData[item].failCD + sys.rand(0,4)) * 1000;
            sendAll((ballUsed == "spy" ? "Some stealthy person" : sys.name(src)) + " left some " + bName + " out... but nothing showed up.");
            player.records.baitNothing += 1;
        }
        safaribot.sendMessage(src, "You still have " + plural(player.balls[item], baitName) + " remaining.", safchan);
        this.saveGame(player);
    };
    this.throwRock = function (src, commandData) {
        if (!validPlayers("both", src, commandData, "You cannot throw  " + an(finishName("rock")) + " at yourself!")) {
            return;
        }
        var player = getAvatar(src);
        var item = "rock";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + es(finishName(item)) + "!", safchan);
            return;
        }
        var currentTime = now();
        if (player.cooldowns.rock > currentTime) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.rock) + " before trying to a throw another " + finishName(item) + "!", safchan);
            return;
        }

        player.balls[item] -= 1;
        player.records.rocksThrown += 1;

        var rng = Math.random();
        var rng2 = Math.random();
        var success = (preparationPhase > 0 ? 0.15 : itemData.rock.successRate);
        var targetName = utilities.non_flashing(commandData.toCorrectCase());
        var targetId = sys.id(commandData);
        var target = getAvatar(targetId);

        if (target.tutorial.inTutorial) {
            safaribot.sendMessage(src, "Hey! That's not nice. You shouldn't throw " + an(finishName(item)) + " at someone completing the tutorial!", safchan);
            return;
        }
        
        if (commandData.toLowerCase() === preparationFirst || player.truesalt >= now()) {
            success = 0;
        }

        var verb = "stunned"; //change to stunned, seasonal change
        if (rng < success) {
            if (rng2 < 0.4) {
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "! *THUD* A direct hit! " + targetName + " was " + verb + "!", safchan);
                target.cooldowns.ball = target.cooldowns.ball > currentTime ? target.cooldowns.ball + itemData.rock.targetCD : currentTime + itemData.rock.targetCD;
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
            else if (rng2 < 0.5) {
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "! " + targetName + " evaded, but their " + poke(target.party[0]) + " got hit and " + verb + "!", safchan);
                target.cooldowns.ball = target.cooldowns.ball > currentTime ? target.cooldowns.ball + Math.floor(itemData.rock.targetCD/2) : currentTime + Math.floor(itemData.rock.targetCD/2);
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
            else if (rng2 < 0.55) {
                var dropped = sys.rand(4, 10);
                if (target.money < dropped) {
                    dropped = target.money || 1;
                }
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but only hit their wallet! " + sys.name(src) + " then picked up the $" + dropped + " dropped by " + targetName + "!", safchan);
                if (player.money + dropped> moneyCap) {
                    safaribot.sendMessage(src, "But you could only keep $" + (moneyCap - player.money) + "!", safchan);
                    player.money = moneyCap;
                } else {
                    safaribot.sendMessage(src, "You received $" + dropped + "!", safchan);
                    player.money += dropped;
                }
                player.records.rocksWalletHit += 1;
                player.records.rocksWalletEarned += dropped;
                target.records.rocksWalletHitBy += 1;
                target.records.rocksWalletLost += dropped;
                safaribot.sendMessage(targetId, "You lost $" + dropped + "!", safchan);
                target.money = target.money - dropped < 0 ? 0 : target.money - dropped;
            }
            else if (rng2 < 0.56) {
                
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but only hit their Itemfinder, which caused the Itemfinder to get slightly discharged!", safchan);
                if (target.balls.permfinder > 1) {
                    safaribot.sendMessage(targetId, "You lost " + plural(1, finishName("recharge")) + "!", safchan);
                    target.balls.permfinder -= 1;
                }
                player.records.rocksItemfinderHit += 1;
                target.records.rocksChargesLost += 1;
            }
            else {
                var parts = ["right leg", "left leg", "right arm", "left arm", "back"];
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "! The " + finishName(item) + " hit " + targetName + "'s " + parts[sys.rand(0, parts.length)] + "!", safchan);
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
        } else {
            if (rng2 < itemData.rock.bounceRate + (preparationPhase > 0 ? 0.4 : 0)) {
                //Seasonal change
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but it hit a wall and bounced back at " + sys.name(src) + "! *THUD* That will leave a mark on " + sys.name(src) + "'s face and pride!", safchan);
                // safaribot.sendAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but it broke apart before it was thrown and covered " + sys.name(src) + " in snow! That will leave a mark on " + sys.name(src) + "'s face and pride!", safchan);

                player.cooldowns.ball = currentTime + itemData.rock.bounceCD;
                player.records.rocksBounced += 1;
            }
            else if (rng2 < 0.25) {
                //seasonal change
                // safaribot.sendAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but " + targetName + " saw it coming and caught the " + finishName(item) + " with their mitten-covered hands!", safchan);
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but " + targetName + " saw it coming and caught the " + finishName(item) + " with their bare hands!", safchan);
                if (target.balls.rock < getCap("rock")) {
                    target.balls.rock += 1;
                    safaribot.sendMessage(targetId, "You received " + plural(1, item) + "!", safchan);
                } else {
                    safaribot.sendMessage(targetId, "But you couldn't keep the " + finishName(item) + " because you already have " + getCap("rock") + "!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksCaught += 1;
            }
            else if (rng2 < 0.35) {
                var dropped = sys.rand(10, 17);
                if (player.money < dropped) {
                    dropped = player.money || 1;
                }
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but missed and broke their house's window! " + sys.name(src) + " had to pay $" + dropped + " to " + targetName + "!", safchan);
                if (target.money + dropped> moneyCap) {
                    safaribot.sendMessage(targetId, "But you could only keep $" + (moneyCap - target.money) + "!", safchan);
                    target.money = moneyCap;
                } else {
                    safaribot.sendMessage(targetId, "You received $" + dropped + "!", safchan);
                    target.money += dropped;
                }
                safaribot.sendMessage(src, "You lost $" + dropped + "!", safchan);
                player.money = player.money - dropped < 0 ? 0 : player.money - dropped;
                player.records.rocksMissedWindow += 1;
                player.records.rocksWindowLost += dropped;
                target.records.rocksDodgedWindow += 1;
                target.records.rocksWindowEarned += dropped;
            }
            else if (rng2 < 0.45) {
                var onChannel = sys.playersOfChannel(safchan);
                var randomTarget = onChannel[sys.rand(0, onChannel.length)];
                if (randomTarget != src && randomTarget != targetId && getAvatar(randomTarget)) {
                    safaribot.sendHtmlAll(sys.name(src) + " tried to throw " + an(finishName(item)) + " at " + targetName + ", but failed miserably and almost hit " + utilities.non_flashing(sys.name(randomTarget)) + "!", safchan);
                } else {
                    safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "... but it missed!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else if (rng2 < 0.5) {
                var extraThrown = "safari";
                if (player.balls[extraThrown] > 0) {
                    safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + ", but it missed... To make things worse, " + sys.name(src) + " also dropped " + an(finishName(extraThrown)) + " that was stuck together with the " + finishName(item) + "!", safchan);
                    safaribot.sendMessage(src, "You lost 1 " + finishName(extraThrown) + "!", safchan);
                    player.balls[extraThrown] -= 1;
                } else {
                    safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "... but it missed!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else if (rng2 < 0.53) {
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "! " + targetName + " evaded, but their Itemfinder got hit! The Itemfinder reacted to the impact and gained 1 extra charge!!", safchan);
                safaribot.sendMessage(targetId, "You received " + plural(1, finishName("recharge")) + "!", safchan);
                    
                target.balls.permfinder += 1;
                player.records.rocksMissed += 1;
                target.records.rocksChargesGained += 1;
            }
            else {
                safaribot.sendHtmlAll(sys.name(src) + " threw " + an(finishName(item)) + " at " + targetName + "... but it missed!", safchan);
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
        }
        player.cooldowns.rock = currentTime + itemData.rock.throwCD;
        this.saveGame(player);
        this.saveGame(target);
    };
    this.useStick = function (src, commandData) {
        var sName = finishName("stick");
        if (!validPlayers("both", src, commandData, "You cannot poke yourself with " + an(sName) + "!")) {
            return;
        }
        var player = getAvatar(src);
        var item = "stick";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + es(cap(item)) + "!", safchan);
            return;
        }
        var currentTime = now();
        if (player.cooldowns.stick > currentTime) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.stick) + " before using your " + sName + "!", safchan);
            return;
        }

        var targetName = utilities.non_flashing(commandData.toCorrectCase());
        sendAll(sys.name(src) + " poked " + targetName + " with their " + sName + ".");
        player.cooldowns.stick = currentTime + itemData.stick.cooldown;
        this.saveGame(player);
    };
    this.giveBurnHeal = function (src, commandData) {
        var item = "burn";
        var sName = finishName(item);
        if (!validPlayers("both", src, commandData, "You cannot give " + an(sName) + " to yourself!")) {
            return;
        }
        var player = getAvatar(src);
        var targetId = sys.id(commandData);
        var target = getAvatar(targetId);
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + sName + "!", safchan);
            return;
        }
        var currentTime = now();
        if (player.cooldowns.burn > currentTime) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.burn) + " before giving someone " + an(sName) + "!", safchan);
            return;
        }

        var targetName = utilities.non_flashing(commandData.toCorrectCase());
        sendAll("", true, true);
        sendAll(sys.name(src) + " gave " + an(sName) + " to " + targetName + "!");
        safaribot.sendMessage(targetId, "You received " + plural(1, item) + "!", safchan);
        sendAll("", true, true);
        
        player.cooldowns.burn = currentTime + itemData.burn.cooldown;
        if (target.balls[item] === 0) {
            target.cooldowns.burn = currentTime + itemData.burn.cooldown;
        }
        player.balls[item] -= 1;
        target.balls[item] += 1;
        
        player.records.burnGiven += 1;
        target.records.burnReceived += 1;
        
        this.saveGame(player);
        this.saveGame(target);
    };
    this.gachapon = function (src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (player.tutorial.inTutorial && player.tutorial.step === 5) {
            safari.tutorialGacha(src);
            return;
        }

        if (cantBecause(src, "use the Gachapon Machine", ["item", "auction", "battle", "pyramid", "event", "tutorial"], "gacha")) {
            return;
        }
        var currentTime = now();
        if (player.cooldowns.gacha > currentTime) {
            safaribot.sendMessage(src, "Strict gambling regulations require you to wait " + timeLeftString(player.cooldowns.gacha) + " before you can use the Gachapon Machine again!", safchan);
            return;
        }

        player.balls.gacha -= 1;
        player.records.gachasUsed += 1;
        var reward = randomSample(gachaItems);
        safaribot.sendMessage(src, "Gacha-PON! The Gachapon Machine has dispensed an item capsule. [Remaining Tickets: " + player.balls.gacha + "]", safchan);

        //Variable for higher quantity rewards later. Make better later maybe?
        var amount = 1;
        var rng = Math.random();
        if (rng < 0.01) {
            amount = 4;
        } else if (rng < 0.05) {
            amount = 3;
        } else if (rng < 0.15) {
            amount = 2;
        }

        var giveReward = true;
        if (player.truesalt > now()) {
            reward = ["rock", "wild", "rock", "rock", "rock", "rock", "wild", "safari"].random();
            giveReward = false;
        }
        var masterCap;
        switch (reward) {
            case "master": {
                if (player.balls[reward] >= getCap("master")) {
                    /*safaribot.sendHtmlAll("<b>JACKP--</b> Wait a second... " + html_escape(sys.name(src)) + "'s " + finishName("master") + " turned out to be a simple " + finishName("safari") + " painted to look like " + an(finishName("master")) + "! What a shame!", safchan);
                    safaribot.sendMessage(src, "You wiped the paint off of the ball and pocketed " + plural(1, "safari") + " for your troubles.", safchan);
                    reward = "safari";
                    amount = 1;
                    player.records.masterballsWon += 1;*/
                    giveReward = false;
                    masterCap = true;
                }
                safaribot.sendHtmlAll("<b>JACKPOT! " + html_escape(sys.name(src)) + " just won " + an(finishName("master")) + " from the Gachapon Machine!</b>", safchan);
                if (!masterCap) {
                    safaribot.sendMessage(src, "You received " + an(finishName(reward)) + ".", safchan);
                }
                amount = 1;
                player.records.masterballsWon += 1;
            }
            break;
            case "bait": {
                safaribot.sendMessage(src, "A delicious smell wafts through the air as you open your capsule. You received " + plural(amount, reward) + ".", safchan);
            }
            break;
            case "rock": {
                var snowball = finishName("rock") === "Snowball";
                safaribot.sendMessage(src, "A " + (snowball ? "wet splashing sound" : "loud clunk" ) + " comes from the machine. Some prankster put " + (snowball ? "snow" : es(finishName("rock"))) + " in the Gachapon Machine! You received  " + plural(amount, finishName(reward)) + ".", safchan);
            }
            break;
            case "wild": {
                giveReward = false;
                if (currentPokemon || contestCount > 0 || contestCooldown <= 13) {
                    giveReward = true;
                    reward = "safari";
                    amount = 1;
                    safaribot.sendMessage(src, "Bummer, only " + an(finishName(reward)) + ". You received " + plural(amount, reward) + ".", safchan);
                } else {
                    var spawn = true;
                    var spawnHorde = amount > 1;
                    var ballUsed = itemAlias(commandData, true);
                    if (!isBall(ballUsed) || player.balls[ballUsed] === 0) {
                        ballUsed = (player.balls[player.favoriteBall] > 0 ? player.favoriteBall : "safari");
                    }
                    this.trackMessage("[Track] " + sys.name(src) + " is using /gacha " + commandData, player);
                    safaribot.sendAll((ballUsed == "spy" ? "Some stealthy person" : sys.name(src)) + " goes to grab their item from the Gachapon Machine but the noise lured " + an(finishName(reward)) + "!", safchan);

                    if (chance(0.15) || nextGachaSpawn > currentTime || player.cooldowns.bait > currentTime) {
                        safaribot.sendAll("Unfortunately " + (spawnHorde ? "they" : "it") + " fled before anyone could try to catch "+ (spawnHorde ? "them" : "it") + "!", safchan);
                        spawn = false;
                    }

                    if (spawn) {
                        var p = player.nextSpawn;
                        if (p.pokemon.num) {
                            safari.createWild(p.pokemon.num, p.pokemon.shiny, p.amt, null, null, player, p.disguise);
                            p.pokemon = p.disguise = {};
                            p.amt = 1;
                        } else {
                            if (spawnHorde) {
                                safari.createWild(0, false, amount, 580);
                            } else {
                                safari.createWild();
                        }
                        }
                        safari.throwBall(src, ballUsed, true);
                        preparationFirst = sys.name(src).toLowerCase();
                        nextGachaSpawn = currentTime + 23 * 1000;
                        if (baitCooldown <= 9) {
                            baitCooldown = sys.rand(9, 13);
                        }
                        if (goldenBaitCooldown <= 6) {
                            goldenBaitCooldown = sys.rand(6, 11);
                        }
                    }
                }
            }
            break;
            case "safari": {
                amount = 1;
                safaribot.sendMessage(src, "Bummer, only " + an(finishName(reward)) + ". You received 1 " + finishName(reward) + ".", safchan);
            }
            break;
            case "dust": {
                amount *= 5;
                safaribot.sendMessage(src, "You open the capsule to find " + an(finishName("rare")) + "! Unfortunately, some rude player pushes you out of the way causing you to drop it. The " + finishName("rare") + " impacts the ground, shatters, and sends dust flying everywhere. You only manage to scoop up " + plural(amount, finishName(reward)) + ".", safchan);
            }
            break;
            case "gacha": {
                var jackpot = Math.floor(gachaJackpot/10);
                safaribot.sendHtmlAll("<b>JACKPOT! " + html_escape(sys.name(src)) + " just won the Gachapon Ticket Jackpot valued at " + jackpot + " tickets!</b>", safchan);
                amount = jackpot;
                player.records.jackpotsWon += 1;
                safaribot.sendMessage(src, "You received " + plural(jackpot, "gacha") + ". ", safchan);
                gachaJackpot = gachaJackpotAmount; //Reset jackpot for next player
            }
            break;
            case "amulet":
            case "soothe":
            case "scarf":
            case "battery": {
                amount = 1;
                sendAll("<b>Sweet! " + sys.name(src) + " just won " + an(finishName(reward)) + " from Gachapon!</b>", true);
                safaribot.sendMessage(src, "You received " + an(finishName(reward)) + ".", safchan);
            }
            break;
            case "gem": {
                amount = 1;
                safaribot.sendMessage(src, "The Gachapon machine emits a bright flash of light as you reach for your prize. Despite being temporarily blinded, you know you just won " + an(finishName(reward)) + " due to a very faint baaing sound!", safchan);
                safaribot.sendMessage(src, "You received " + an(finishName(reward)) + ".", safchan);
            }
            break;
            case "whtapricorn":
            case "pearl":
            case "stardust":
            case "starpiece":
            case "bigpearl":
            case "nugget":
            case "bignugget": {
                amount = 1;
            }
            /* falls through */
            default:
                safaribot.sendMessage(src, "You received " + plural(amount, reward) + ".", safchan);
            break;
        }
        if (giveReward) {
            rewardCapCheck(player, reward, amount);
        }
        if (masterCap) {
            safaribot.sendMessage(src, "You received " + an(finishName("fragment")) + ".", safchan);
            rewardCapCheck(player, "fragment", 1);
        }

        player.cooldowns.gacha = currentTime + itemData.gacha.cooldown;
        this.saveGame(player);
        gachaJackpot += 1;
        SESSION.global().safariGachaJackpot = gachaJackpot;
    };
    this.useCandyDust = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "evolve a Pokémon";
        var isTut = player.tutorial.inTutorial && player.tutorial.step === 8;
        if (!isTut) {
            if (cantBecause(src, reason, ["tutorial"])) {
                return;
            }
        }
        var input = commandData.split(":");
        var info = getInputPokemon(input[0]);
        var starter = input.length > 1 ? input[1].toLowerCase() : "*";
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

        if (isTut && sys.pokemon(info.id) !== "Pikachu") {
            tutorMsg(src, "You can only evolve Pikachu during the tutorial. Please do so with " + link("/evolve Pikachu"));
            return;
        }

        var species = pokeInfo.species(num);
        if (!(species in evolutions) || sys.pokemon(info.id) === "Floette-EF") {
            safaribot.sendMessage(src, "This Pokémon cannot evolve!", safchan);
            return;
        }

        var evoData = evolutions[species];
        var candiesRequired = Math.floor((evoData.candies || 300) * (info.shiny ? 1.15 : 1));
        var costumed = false;
        var prev = candiesRequired;
        if (player.costume === "breeder") {
            candiesRequired = Math.floor(candiesRequired * costumeData.breeder.rate);
            costumed = true;
        }

        if (!["confirm", "starter", "normal"].contains(starter)) {
            var evo = evoData.evo;

            safaribot.sendHtmlMessage(src, info.name + " requires " + plural(candiesRequired, "dust") + " to evolve into " + (Array.isArray(evo) ? readable(evo.map(poke), "or") : poke(evo)) + ". " + (costumed ? "<i>[Note: Without " + costumeAlias("breeder", true, true) + " " + plural(prev, "dust") + " are required.]</i>" : ""), safchan);
            safaribot.sendHtmlMessage(src, "If you really wish to evolve " + info.name + ", type " + link("/evolve " + info.input + ":confirm") + ".", safchan);
            return;
        }

        if (info.input in player.shop) {
            safaribot.sendMessage(src, "You need to remove this Pokémon from your shop before evolving them!", safchan);
            return;
        }

        if (player.balls.dust < candiesRequired) {
            safaribot.sendMessage(src, info.name + " requires " + plural(candiesRequired, "dust") + " to evolve!", safchan);
            return;
        }

        var evolveStarter = true;
        if (player.starter == id) {
            var count = countRepeated(player.pokemon, id);
            if (count > 1) {
                if (starter == "starter") {
                    evolveStarter = true;
                } else if (starter == "normal") {
                    evolveStarter = false;
                } else {
                    safaribot.sendMessage(src, "This Pokémon is your starter, but you have more than one! To pick which one you want to evolve, type /evolve " + info.input +":starter or /evolve " + info.input +":normal.", safchan);
                    return;
                }
            }
        }

        var restrictions = ["auction", "battle", "item", "event", "pyramid"];
        //Allow selling of pokemon that are not the lead if the rest of the party doesn't matter at that point
        if (player.party[0] === id) {
            restrictions = restrictions.concat(["wild", "contest"]);
            reason = "evolve your active Pokémon";
        }
        if (cantBecause(src, reason, restrictions, "dust")) {
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

        player.balls.dust -= candiesRequired;
        if (!isTut) {
            player.records.pokesEvolved += 1;
        }

        this.evolvePokemon(src, info, evolvedId, "evolved into", evolveStarter, isTut);
        this.logLostCommand(sys.name(src), "evolve " + commandData, "evolved into " + poke(evolvedId));
        if (costumed) {
            safaribot.sendMessage(src, "Your " + info.name + " only needed to eat " + plural(candiesRequired, "dust") + " before evolving into " + poke(evolvedId) + "!", safchan);
        } else {
            safaribot.sendMessage(src, "Your " + info.name + " ate " + plural(candiesRequired, "dust") + " and evolved into " + poke(evolvedId) + "!", safchan);
        }
        if (isTut) {
            advanceTutorial(src, 9);
        }
    };
    this.useSpray = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "devolve a Pokémon";
        var input = commandData.split(":");
        var info = getInputPokemon(input[0]);
        var starter = input.length > 1 ? input[1].toLowerCase() : "*";
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
        if (isMega(info.num)) {
            safaribot.sendMessage(src, "You cannot devolve a Mega Pokémon!", safchan);
            return;
        }
        
        var species = pokeInfo.species(num);
        if (!(species in devolutions) || sys.pokemon(info.id) === "Floette-EF") {
            safaribot.sendMessage(src, "This Pokémon cannot devolve!", safchan);
            return;
        }

        var evoData = devolutions[species];
        var dustRegained = Math.floor((evolutions[pokeInfo.species(evoData)].candies || 300) * (info.shiny ? 1.15 : 1) * 0.5);
        
        if (!["confirm", "starter", "normal"].contains(starter)) {
            safaribot.sendHtmlMessage(src, info.name + " can devolve into " + poke(evoData) + " with " + an(finishName("spray")) + " to regain " + plural(dustRegained, "dust") + ". ", safchan);
            safaribot.sendHtmlMessage(src, "If you really wish to devolve " + info.name + ", type " + link("/spray " + info.input + ":confirm") + ".", safchan);
            return;
        }

        if (info.input in player.shop) {
            safaribot.sendMessage(src, "You need to remove this Pokémon from your shop before devolving them!", safchan);
            return;
        }

        var evolveStarter = true;
        if (player.starter == id) {
            var count = countRepeated(player.pokemon, id);
            if (count > 1) {
                if (starter == "starter") {
                    evolveStarter = true;
                } else if (starter == "normal") {
                    evolveStarter = false;
                } else {
                    safaribot.sendMessage(src, "This Pokémon is your starter, but you have more than one! To pick which one you want to devolve, type /spray " + info.input +":starter or /spray " + info.input +":normal.", safchan);
                    return;
                }
            }
        }

        var restrictions = ["auction", "battle", "item", "event", "pyramid"];
        if (player.party[0] === id) {
            restrictions = restrictions.concat(["wild", "contest"]);
            reason = "devolve your active Pokémon";
        }
        if (cantBecause(src, reason, restrictions, "spray")) {
            return;
        }

        var forme = pokeInfo.forme(num);
        if (forme !== 0) {
            var tempForme = pokeInfo.calcForme(evoData, forme);
            if (sys.pokemon(tempForme).toLowerCase() !== "missingno") {
                evoData = tempForme;
            }
        }
        var evolvedId = shiny ? "" + evoData : evoData;

        player.balls.spray -= 1;
        player.records.devolutions += 1;
        player.records.devolutionDust += dustRegained;

        this.evolvePokemon(src, info, evolvedId, "devolved into", evolveStarter);
        this.logLostCommand(sys.name(src), "spray " + commandData, "devolved into " + poke(evolvedId));
        safaribot.sendMessage(src, "You sprayed " + an(finishName("spray")) + " onto your " + info.name + ", making them devolve into " + poke(evolvedId) + "! You received " + plural(dustRegained, "dust") + " from that!", safchan);
        rewardCapCheck(player, "dust", dustRegained);
        this.saveGame(player);
        
    };
    this.useMegaStone = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (cantBecause(src, "use " + es(finishName("mega")), ["wild", "contest", "auction", "battle", "item", "event", "tutorial", "pyramid"], "mega")) {
            return;
        }

        var info = getInputPokemon(commandData);
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
        if (info.input in player.shop) {
            safaribot.sendMessage(src, "You need to remove this Pokémon from your shop before mega evolving them!", safchan);
            return;
        }

        var possibleEvo = megaEvolutions[species];
        var evolveTo = possibleEvo[sys.rand(0, possibleEvo.length)];
        var evolvedId = shiny ? "" + evolveTo : evolveTo;

        player.balls.mega -= 1;
        player.records.megaEvolutions += 1;
        this.updateShop(player, "mega");

        this.evolvePokemon(src, info, evolvedId, "mega evolved into", true);
        this.logLostCommand(sys.name(src), "mega " + commandData, "mega evolved into " + poke(evolvedId));
        player.megaTimers.push({
            id: evolvedId,
            expires: now() + hours(itemData.mega.duration * 24),
            to: id
        });
        safaribot.sendMessage(src, "You used " + an(finishName("mega")) + " on " + info.name + " to evolve them into " + poke(evolvedId) + "! They will revert after 72 hours!", safchan);
    };
    this.evolvePokemon = function(src, info, evolution, verb, evolveStarter, isTut) {
        var player = getAvatar(src);
        var id = info.id;
        var count = countRepeated(player.pokemon, id);
        if (id === player.starter && (count <= 1 || evolveStarter)) {
            player.starter = evolution;
        }
        var wasOnParty = player.party.indexOf(id) !== -1;

        player.pokemon.splice(player.pokemon.indexOf(id), 1, evolution);
        if (wasOnParty) {
            player.party.splice(player.party.indexOf(id), 1, evolution);
        }
        var evoInput = getInputPokemon(evolution + (typeof evolution == "string" ? "*" : ""));
        if (evolution === player.starter && evoInput.input in player.shop) {
            delete player.shop[evoInput.input];
            safaribot.sendMessage(src, evoInput.name + " was removed from your shop!", safchan);
        }

        if (isTut) {
            sys.sendMessage(src, "", safchan);
            safaribot.sendHtmlMessage(src, pokeInfo.icon(info.num) + " -> " + pokeInfo.icon(parseInt(evolution, 10)), safchan);
            safaribot.sendMessage(src, "Your " + info.name + " " + verb + " " + poke(evolution) + "!", safchan);
            sys.sendMessage(src, "", safchan);
        } else {
            sendAll("", false, true);
            sendAll(pokeInfo.icon(info.num) + " -> " + pokeInfo.icon(parseInt(evolution, 10)), true);
            sendAll(sys.name(src) + "'s " + info.name + " " + verb + " " + poke(evolution) + "!");
            sendAll("", false, true);
        }
        this.saveGame(player);
    };
    this.findItem = function(src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "use the Itemfinder";
        var isTut = false;
        if (player.tutorial.inTutorial && player.tutorial.step === 6) {
            isTut = true;
        } else {
            if (cantBecause(src, reason, ["tutorial"])) {
                return;
            }
        }

        var dailyCharges = player.balls.itemfinder,
            permCharges = player.balls.permfinder,
            totalCharges = dailyCharges + permCharges;
        if (totalCharges < 1) {
            if (isTut) {
                tutorMsg(src, "You need to recharge your Itemfinder before you can use it! You can recharge it with " + link("/use gem"));
            } else {
                safaribot.sendMessage(src, "You have no charges left for your Itemfinder!", safchan);
            }
            return;
        }
        if (isTut) {
            safari.tutorialFinder(src, totalCharges);
            return;
        }

        var currentTime = now();
        if (player.cooldowns.itemfinder > currentTime) {
            safaribot.sendMessage(src, "Your Itemfinder needs to cool down otherwise it will overheat! Try again in " + timeLeftString(player.cooldowns.itemfinder) + ".", safchan);
            return;
        }
        if (cantBecause(src, reason, ["auction", "battle", "event", "pyramid"])) {
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

        var reward = chance(finderMissRate) ? "nothing" : randomSample(finderItems);
        var amount = 1;
        if (player.costume === "explorer") {
            if (reward === "nothing" && chance(costumeData.explorer.rate)) {
                reward = chance(finderMissRate) ? "nothing" : randomSample(finderItems);
            }
            if (reward === "pearl" || reward === "stardust") {
                amount = chance(costumeData.explorer.rate2) ? 2 : 1;
            }
        }

        var giveReward = true;
        var showMsg = true;
        if (player.truesalt >= now()) {
            reward = reward !== "nothing" ? (Math.random() < 0.4 ? "rock" : "nothing") : reward;
        }
        switch (reward) {
            case "rare": {
                safaribot.sendHtmlAll("<b>Beep. Beep. BEEP! " + sys.name(src) + " found " + an(finishName(reward)) + " behind a bush!</b>", safchan);
            }
            break;
            case "recharge": {
                reward = "permfinder";
                amount = 3;
                showMsg = false;
                safaribot.sendHtmlMessage(src, "<b>Pi-ka-CHUUU!</b> You were shocked by a wild Pikachu while looking for items! On the bright side, your Itemfinder slightly recharged due to the shock.", safchan);
                safaribot.sendMessage(src, "Your Itemfinder gained " + plural(amount, "charge") + " [Remaining charges: " + (totalCharges + amount) + " (Daily " + dailyCharges + " plus " + Math.min(permCharges + amount, getCap("permfinder")) + " bonus)].", safchan);
            }
            break;
            case "crown": {
                sendAll("<b>BEEP! BEEPBEEP! Boop!?</b> " + sys.name(src) + "'s Itemfinder locates an old treasure chest full of ancient relics. Upon picking them up, they crumble into dust except for a single " + finishName("crown") + ".", true);
            }
            break;
            case "eviolite": {
                sendAll("<b>!PEEB !PEEB</b> Another trainer approaches " + sys.name(src) + " as they are looking for items and snickers: <i>\"You have it on backwards.\"</i> " + sys.name(src) + " corrects the position, turns around, and finds a sizeable chunk of " + finishName("eviolite") + " on the ground.", true);
            }
            break;
            case "honey": {
                sendAll("<b>BEE! BEE! BEE!</b> " + sys.name(src) + " stumbled upon a beehive while using their Itemfinder. Before running off to avoid the swarm, " + sys.name(src) + " managed to steal a glob of " + finishName("honey") + "!", true);
            }
            break;
            case "spy": {
                safaribot.sendMessage(src, "Bep. Your Itemfinder is pointing towards a shadowy area. Within the darkness, you find a suspicious " + finishName(reward) + "!", safchan);
            }
            break;
            case "gacha": {
                safaribot.sendMessage(src, "Beeeep. You're led to a nearby garbage can by your Itemfinder. You decide to dig around anyway and find an unused " + finishName(reward) + "!", safchan);
            }
            break;
            case "rock": {
                safaribot.sendMessage(src, "Beep. Your Itemfinder pointed you towards a very conspicuous " + finishName(reward) + ".", safchan);
            }
            break;
            case "blkapricorn": {
                safaribot.sendMessage(src, "Beep-Beep. Your Itemfinder pointed you towards an Apricorn Tree! You decided to pick one and put it in your bag!", safchan);
            }
            break;
            case "bait": {
                safaribot.sendMessage(src, "Beep-Beep. Your Itemfinder pointed you towards a berry bush! You decided to pick one and put it in your bag.", safchan);
            }
            break;
            case "bigpearl": {
                if (player.costume !== "explorer") {
                    reward = "pearl";
                }
            }
            /*falls through*/
            case "pearl":
            case "stardust": {
                safaribot.sendMessage(src, "Beep Beep Beep. You dig around a sandy area and unbury " + an(finishName(reward)) + "!", safchan);
                if (amount > 1) {
                    safaribot.sendMessage(src, "You decided to keep digging and found another " + finishName(reward) + "!", safchan);
                }
            }
            break;
            case "fragment": {
                if (player.costume === "explorer") {
                    safaribot.sendHtmlAll("<b>Be-Be-Be-Beeep! " + sys.name(src) + " found " + an(finishName(reward)) + "  in a patch of grass!</b>", safchan);
                    break;
                } else {
                    reward = "luxury";
                }
            }
            /* falls through*/
            case "luxury": {
                safaribot.sendMessage(src, "Be-Beep. You comb a patch of grass that your Itemfinder pointed you towards and found " + an(finishName(reward)) + "!", safchan);
            }
            break;
            default:
                safaribot.sendMessage(src, "You pull out your Itemfinder ... ... ... But it did not detect anything. [Remaining charges: " + totalCharges + (permCharges > 0 ? " (Daily " + dailyCharges + " plus " + permCharges + " bonus)" : "") + "].", safchan);
                giveReward = false;
                showMsg = false;
            break;
        }
        if (showMsg) {
            safaribot.sendMessage(src, "You found " + plural(amount, reward) + " with your Itemfinder! [Remaining charges: " + totalCharges + (permCharges > 0 ? " (Daily " + dailyCharges + " plus " + permCharges + " bonus)" : "") + "].", safchan);
        }
        if (giveReward) {
            player.records.itemsFound += 1;
            rewardCapCheck(player, reward, amount);
        }

        player.cooldowns.itemfinder = currentTime + itemData.itemfinder.cooldown;
        this.saveGame(player);
    };
    this.useItem = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var item = itemAlias(data, true);

        if (!allItems.contains(item)) {
            safaribot.sendMessage(src, "This is not a valid item.", safchan);
            return;
        }
        if (itemData[item].type !== "consumable") {
            safaribot.sendMessage(src, item + " is not a usable item!", safchan);
            return;
        }

        var input = "@" + item;
        if (input in player.shop && player.shop[input].limit >= player.balls[item]) {
            safaribot.sendMessage(src, "You need to remove that item from your shop before using it!", safchan);
            return;
        }
        if (player.tutorial.inTutorial && (player.tutorial.step === 6 || player.tutorial.step === 7)) {
            safari.tutorialUseItem(src, item);
            return;
        }
        if (cantBecause(src, "use an item", ["item", "contest", "auction", "battle", "event", "tutorial", "pyramid"], item)) {
            return;
        }
        if (item === "gem") {
            var chars = player.balls.itemfinder,
                gemdata = itemData.gem.charges,
                pchars = player.balls.permfinder + gemdata,
                tchars = chars + pchars;

            safaribot.sendHtmlMessage(src, "The " + finishName("gem") + " begins to emit a soft baaing sound. Your Itemfinder then lights up and responds with a loud <b>BAA~!</b>", safchan);
            safaribot.sendMessage(src, "Your Itemfinder gained " + gemdata + " charges. [Remaining Charges: " + tchars + " (Daily " + chars + " plus " + pchars + " bonus)].", safchan);
            rewardCapCheck(player, "permfinder", gemdata);
            player.balls.gem -= 1;
            player.records.gemsUsed += 1;
            this.updateShop(player, "gem");
            this.saveGame(player);
            return;
        }
        if (item === "rare") {
            if (player.balls.dust >= itemData.dust.cap) {
                safaribot.sendMessage(src, "You already have " + itemData.dust.cap + " Candy Dusts!", safchan);
                return;
            }
            var dustdata = itemData.rare.charges + sys.rand(itemData.rare.minVar, itemData.rare.maxVar),
                totaldust = player.balls.dust + dustdata;

            safaribot.sendMessage(src, "You unwrap the " + finishName("rare") + " and immediately notice it's cracked. Before you could touch it, the candy instantly turns into dust!", safchan);
            safaribot.sendMessage(src, "You received " + plural(dustdata, "dust") + " and now have " + totaldust + ".", safchan);
            rewardCapCheck(player, "dust", dustdata);
            player.balls.rare -= 1;
            this.saveGame(player);
            return;
        }
        if (item === "pack") {
            var reward = randomSample(packItems);
            var amount = 1;
            switch (reward) {
                case "gem": amount = 3; break;
                case "rock": amount = 50; break;
                case "bait": amount = 10; break;
                case "gacha": amount = 10; break;
                case "silver": amount = 8; break;
                case "clone": case "luxury": case "quick": amount = 5; break;
            }
            safaribot.sendMessage(src, "You excitedly open your " + finishName("pack") + " to reveal " + plural(amount, reward) + "!", safchan);
            if (reward === "mega") {
                safaribot.sendHtmlAll("<b>Wow! " + sys.name(src) + " found " + an(finishName("mega")) + " in their " + finishName("pack") + "!</b>", safchan);
            }
            rewardCapCheck(player, reward, amount);
            player.balls.pack -= 1;
            player.records.packsOpened += 1;
            this.saveGame(player);
            return;
        }
        if (item === "egg") {
            if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
                safaribot.sendMessage(src, "You can't hatch " + an(finishName("egg")) + " because all your boxes are full! Please buy a new box with /buy.", safchan);
                return;
            }
            var id, shiny = sys.rand(0, shinyChance) < 1;
            
            do {
                id = sys.rand(1, 722);
            } while (isLegendary(id));
            
            if (shiny) {
                id = id + "";
            }
            sys.sendMessage(src, "", safchan);
            safaribot.sendHtmlMessage(src, "Oh? The {0} is hatching... {2} {1} hatched from the {0}!".format(finishName("egg"), (shiny ? toColor(poke(id), "DarkOrchid") : poke(id)), pokeInfo.icon(id, shiny)), safchan);
            sys.sendMessage(src, "", safchan);
            
            player.pokemon.push(id);
            player.balls.egg -= 1;
            player.records.eggsHatched += 1;
            if (isRare(id)) {
                sys.appendToFile(mythLog, now() + "|||" + poke(id) + "::hatched from Egg::" + sys.name(src) + "\n");
                player.records.rareHatched +=1;
            }
            this.saveGame(player);
            return;
        }
        if (item === "bright") {
            if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
                safaribot.sendMessage(src, "You can't hatch " + an(finishName("bright")) + " because all your boxes are full! Please buy a new box with /buy.", safchan);
                return;
            }
            var id, shiny = sys.rand(0, shinyChance) < itemData.bright.shinyChance;
            if (sys.rand(0, itemData.bright.legendaryChance) < 1) {
                do {
                    id = legendaries.random();
                } while (getBST(id) > 600);
                shiny = false;
            } else {
                do {
                    id = sys.rand(1, 722);
                } while (isLegendary(id));
            }
            
            if (shiny) {
                id = id + "";
            }
            sys.sendMessage(src, "", safchan);
            if (isLegendary(id)) {
                safaribot.sendHtmlMessage(src, "Oh? The {0} is hatching... {2} <b>OH MY GOD! {1} HATCHED FROM THE {3}!!</b>".format(finishName("bright"), an(poke(id)).toUpperCase(), pokeInfo.icon(id, shiny), finishName("bright").toUpperCase()), safchan);
            } else {
                safaribot.sendHtmlMessage(src, "Oh? The {0} is hatching... {2} {1} hatched from the {0}!".format(finishName("bright"), (shiny ? toColor(poke(id), "DarkOrchid") : poke(id)), pokeInfo.icon(id, shiny)), safchan);
            }
            sys.sendMessage(src, "", safchan);
            player.pokemon.push(id);
            player.balls.bright -= 1;
            player.records.brightEggsHatched += 1;
            if (isRare(id)) {
                sys.appendToFile(mythLog, now() + "|||" + poke(id) + "::hatched from Bright Egg::" + sys.name(src) + "\n");
                player.records.rareHatched +=1;
            }
            this.saveGame(player);
            return;
        }
        if (item === "water") {
            if (player.quests.pyramid.bonusStamina > 0) {
                safaribot.sendMessage(src, "You already packed  " + an(finishName("water")) + " for your next Pyramid tour!", safchan);
                return;
            }
            
            player.balls.water -= 1;
            player.quests.pyramid.bonusStamina = itemData.water.bonusRate;
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You packed some " + finishName("water") + "! You will start your next Pyramid tour with " + (itemData.water.bonusRate * 100) + "% more Stamina!", safchan);
            sys.sendMessage(src, "", safchan);
            this.saveGame(player);
            return;
        }
        if (item === "cherry") {
            if (player.quests.tower.bonusPower > 0) {
                safaribot.sendMessage(src, "You already ate  " + an(finishName("cherry")) + ". There's no reason to eat another before attempting your next Battle Tower challenge!", safchan);
                return;
            }
            
            player.balls.cherry -= 1;
            player.quests.tower.bonusPower = itemData.cherry.bonusRate;
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You and your Pokémon ate " + an(finishName("cherry")) + "! You will start your next Battle Tower challenge more energized and able to deal up to " + (itemData.cherry.bonusRate) + " more damage with your attacks!", safchan);
            sys.sendMessage(src, "", safchan);
            this.saveGame(player);
            return;
        }
    };

    /* Shops & Raffles */
    this.sellItems = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "sell items";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        var validItems = [];
        for (var e in itemData) {
            if (itemData[e].type === "valuables" && itemData[e].price > 0) {
                validItems.push(itemData[e].name);
            }
        }

        var perkBonus = 1 + Math.min(itemData.crown.bonusRate * player.balls.crown, itemData.crown.maxRate);
        if (data === "*") {
            safaribot.sendMessage(src, "You can sell the following items:", safchan);
            for (var i = 0; i < validItems.length; i++) {
                safaribot.sendMessage(src, itemData[validItems[i]].fullName + ": $" + addComma(Math.floor(itemData[validItems[i]].price/2 * perkBonus)), safchan);
            }
            sys.sendMessage(src, "", safchan);
            var valuables = [];
            for (var i = 0; i < validItems.length; i++) {
                var misc = validItems[i];
                var amt = player.balls[misc];
                if (amt > 0) {
                    var p = amt > 1 ? "s" : "";
                    valuables.push(amt + " " + finishName(misc) + p);
                }
            }
            if (valuables.length > 0) {
                safaribot.sendMessage(src, "You currently have " + readable(valuables, "and") + ". To sell an item, use /pawn item:quantity (e.g.: /pawn pearl:3).", safchan);
            } else {
                safaribot.sendMessage(src, "You don't have anything that can be sold at this time!", safchan);
            }
            return;
        }

        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }

        var pawning = [], item, amount, pawnAll;
        if (data.toLowerCase() === "all") {
            pawning = validItems;
            pawnAll = true;
        } else {
            var info = data.split(":");
            item = itemAlias(info[0], true);
            amount = 1;
            if (info.length > 1) {
                amount = parseInt(info[1], 10);
                if (isNaN(amount) || amount < 1) {
                    amount = 1;
                }
            }

            if (!validItems.contains(item)) {
                safaribot.sendMessage(src, "We do not buy \"" + info[0] +  "\" at this location.", safchan);
                return;
            }

            if (player.balls[item] < amount) {
                safaribot.sendMessage(src, "You don't have " + plural(amount, item) + ", you only have " + player.balls[item] + "!", safchan);
                return;
            }
            pawning.push(item);
        }
        
        var cost, out = [], remaining = [], skipped = [], totalMoney = 0;
        for (var i = 0; i < pawning.length; i++) {
            item = pawning[i];
            if (player.balls[item] > 0) {
                if (pawnAll) {
                    amount = player.balls[item];
                }
                cost = Math.floor(amount * itemData[item].price/2 * perkBonus);
                if (player.money + cost > moneyCap) {
                    skipped.push(plural(amount, item));
                } else {
                    player.money += cost;
                    player.balls[item] -= amount;
                    player.records.pawnEarnings += cost;
                    
                    totalMoney += cost;
                    out.push(plural(amount, item));
                }
                remaining.push(plural(player.balls[item], item));
                this.updateShop(player, item);
            }
        }
        if (skipped.length > 0) {
            safaribot.sendMessage(src, "You can't hold more than $" + addComma(moneyCap) + ", so you cannot currently sell your " + readable(skipped, "and") + "!", safchan);
        }

        if (out.length > 0) {
            safaribot.sendMessage(src, "You sold " + readable(out, "and") +  " for $" + addComma(totalMoney) + "! You now have " + readable(remaining, "and") + " and $" + addComma(player.money) + "!", safchan);
        } else {
            safaribot.sendMessage(src, "Huh? You didn't actually sell anything... If you change your mind, I'll be happy to buy from you! You still have " + readable(remaining, "and") + " and $" + addComma(player.money) + "!", safchan);
        }
        
        this.saveGame(player);
    };
    this.sellPokemon = function(src, data) {
        if (data === "*") {
            safaribot.sendMessage(src, "To sell a Pokémon, use /sell [name] to check its price, and /sell [name]:confirm to sell it.", safchan);
            return;
        }
        if (!validPlayers("self", src)) {
            return;
        }
        var reason = "sell a Pokémon";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        if (!canLosePokemon(src, data, "sell", true)) {
            return;
        }

        var player = getAvatar(src);
        var input = data.split(":");
        var info = getInputPokemon(input[0]);
        var shiny = info.shiny;
        var id = info.id;

        var perkBonus = 1 + Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
        var price = getPrice(info.num, info.shiny, perkBonus);

        if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
            var confirmCommand = "/sell " + (shiny ? "*":"") + sys.pokemon(id) + ":confirm";
            safaribot.sendHtmlMessage(src, "You can sell your " + info.name + " for $" + addComma(price) + ". To confirm it, type " + link(confirmCommand) + ".", safchan);
            return;
        }

        var restrictions = ["contest", "auction", "battle", "event", "pyramid", "tutorial"];
        //Allow selling of pokemon that are not the lead if the rest of the party doesn't matter at that point
        if (player.party[0] === id) {
            restrictions = restrictions.concat(["wild"]);
            reason = "sell your active Pokémon";
        }
        if (cantBecause(src, reason, restrictions)) {
            return;
        }

        player.money += price;
        player.records.pokeSoldEarnings += price;

        safaribot.sendMessage(src, "You sold your " + info.name + " for $" + addComma(price) + "! You now have $" + addComma(player.money) + ".", safchan);
        
        var theft = "";
        if (player.costume === "rocket" && chance(costumeData.rocket.rate2)) {
            safaribot.sendMessage(src, "You cleverly distract the Shopkeeper and while he is not looking, you grab your " + poke(id) + " back and run off!", safchan);
            player.records.pokesStolen += 1;
            theft = "but stole it back";
        } else {
            this.removePokemon(src, id);
            if (isRare(id)) {
                sys.sendAll("", safchan);
                safaribot.sendHtmlAll("<b><font color=tomato>Haha! " + sys.name(src) + " just sold their " + info.name + " to the shop! You should make fun of them with " + link("/rock " + sys.name(src)) + "!</font></b>", safchan);
                sys.sendAll("", safchan);
                player.balls.salt += 1;
            }
        }
        
        this.logLostCommand(sys.name(src), "sell " + data, theft);
        this.saveGame(player);
    };
    this.showPrices = function(src, shop, command, seller) {
        var i, info, input, price, player = getAvatar(src), pokemon = [], items = [], silverPokemon = [], silverItems = [];
        var fullCommand = "/" + command + " " + (seller ? seller + ":" : "");
        var silverName = finishName("silver");
        for (i in shop) {
            info = shop[i];
            input = getInputPokemon(i);
            if (info.silver) {
                if (input.num) {
                    silverPokemon.push({string: "<a href=\"po:setmsg/" + fullCommand + input.name + "\">" + input.name + "</a>: " + plural(info.price, silverName) + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")), sort: info.price});
                }
                else if (i[0] == "@") {
                    input = i.substr(1);
                    price = input == "box" ? itemData.box.price[Math.min(player.balls.box, itemData.box.price.length - 1)] : info.price;
                    silverItems.push({string: "<a href=\"po:setmsg/" + fullCommand + input + ":1\">" + finishName(input) + "</a>: " + plural(price, silverName) + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")), sort: info.price});
                }
            } else {
                if (input.num) {
                    pokemon.push({string: "<a href=\"po:setmsg/" + fullCommand + input.name + "\">" + input.name + "</a>: $" + addComma(info.price) + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")), sort: info.price});
                }
                else if (i[0] == "@") {
                    input = i.substr(1);
                    price = input == "box" ? itemData.box.price[Math.min(player.balls.box, itemData.box.price.length - 1)] : info.price;
                    items.push({string: "<a href=\"po:setmsg/" + fullCommand + input + ":1\">" + finishName(input) + "</a>: $" + addComma(price) + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")), sort: price});
                }
            }
        }
        sys.sendMessage(src, "", safchan);

        var hasNormal = false;
        var hasSilver = false;

        if (items.length > 0) {
            safaribot.sendMessage(src, "You can buy the following Items" + (seller ? " from " + seller : "") + ":", safchan);
            items.sort(compare);
            for (i in items) {
                safaribot.sendHtmlMessage(src, items[i].string, safchan);
            }
            hasNormal = true;
        }
        if (pokemon.length > 0) {
            if (items.length > 0) {
                sys.sendMessage(src, "", safchan);
            }
            safaribot.sendMessage(src, "You can buy the following Pokémon" + (seller ? " from " + seller : "") + ":", safchan);
            pokemon.sort(compare);
            for (i in pokemon) {
                safaribot.sendHtmlMessage(src, pokemon[i].string, safchan);
            }
            hasNormal = true;
        }
        if (silverItems.length > 0) {
            if (pokemon.length > 0 || items.length > 0) {
                sys.sendMessage(src, "", safchan);
            }
            safaribot.sendMessage(src, "You can buy the following Items with " + es(silverName) + (seller ? " from " + seller : "") + ":", safchan);
            silverItems.sort(compare);
            for (i in silverItems) {
                safaribot.sendHtmlMessage(src, silverItems[i].string, safchan);
            }
            hasSilver = true;
        }
        if (silverPokemon.length > 0) {
            if (pokemon.length > 0 || items.length > 0 || silverItems.length > 0) {
                sys.sendMessage(src, "", safchan);
            }
            safaribot.sendMessage(src, "You can buy the following Pokémon with " + es(silverName) + (seller ? " from " + seller : "") + ":", safchan);
            silverPokemon.sort(compare);
            for (i in silverPokemon) {
                safaribot.sendHtmlMessage(src, silverPokemon[i].string, safchan);
            }
            hasSilver = true;
        }
        sys.sendMessage(src, "", safchan);
        safaribot.sendMessage(src, "You currently have $" + addComma(player.money) + " and " + plural(player.balls.silver, silverName) + ". To buy something, use " + fullCommand + "[Pokémon/Item] (e.g.: " + fullCommand + "Pikachu or " + fullCommand + "Heavy Ball)", safchan);
    };
    this.isBelowCap = function(src, product, amount, type) {
        var player = getAvatar(src);
        if (type == "poke" && player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
            safaribot.sendMessage(src, "All your boxes are full! Please buy a new box with /buy before buying any Pokémon.", safchan);
            return false;
        }
        if (type == "item") {
            var cap = getCap(product);
            if (player.balls[product] + amount > cap) {
                if (amount == cap) {
                    safaribot.sendMessage(src, "You are carrying the maximum amount of " + finishName(product) + " (" + cap + ") and cannot buy any more!", safchan);
                } else {
                    safaribot.sendMessage(src, "You can only carry " + cap + " " + finishName(product) + "! You currently have " + player.balls[product] + " which leaves space for " + (cap - player.balls[product]) + " more.", safchan);
                }
                return false;
            }
        }
        return true;
    };
    this.buyBonus = function(src, product, amount, cap) {
        var bonus, player = getAvatar(src);
        if (amount >= 10) {
            var bonusAmt = Math.floor(amount / 10);
            if (isBall(product)) {
                bonus = "premier";
                safaribot.sendMessage(src, "Here, you also get " + plural(bonusAmt, bonus) + " for your patronage!", safchan);
            } else if (product === "gacha") {
                bonus = "gacha";
                //bonusAmt *= 2;
                safaribot.sendMessage(src, "Here, you also get " + plural(bonusAmt, bonus) + " for your patronage!", safchan);
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
        if (product === "entry") {
            rafflePlayers.add(player.id, player.balls.entry);
            rafflePlayers.save();
        }
    };
    this.updateShop = function(player, item) {
        var itemInput = "@" + item;
        if (player && itemInput in player.shop && player.shop[itemInput].limit > player.balls[item]) {
            player.shop[itemInput].limit = player.balls[item];
        }
    };
    this.buyFromShop = function(src, data, command, fromNPC) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (player.tutorial.inTutorial) {
            safari.buyForTutorial(src, data);
            return;
        }
        var reason = "buy items";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }

        if (!fromNPC && player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from buying from other players for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (!fromNPC && player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only enter this shop after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        
        //Show own shop if nothing is specified
        if ((!data || data === "*") && !fromNPC) {
            data = sys.name(src);
        }

        var info = data.split(":"),
            input,
            sellerName = info[0],
            sName,
            seller,
            sellerId,
            shop = npcShop,
            product = info.length > 1 && info[1] !== "" ? info[1].toLowerCase() : "*";

        if (!fromNPC) {
            sellerId = sys.id(sellerName);
            if (sellerId) {
                seller = getAvatar(sellerId);
                if (!seller) {
                    safaribot.sendMessage(src, "No such person! Use /" + command + " Name to see their shop!", safchan);
                    return;
                }
            } else {
                safaribot.sendMessage(src, "No such person! Use /" + command + " Name to see their shop!", safchan);
                return;
            }
        }
        if (seller) {
            shop = seller.shop;
            sName = "<b>" + sys.name(sellerId) + ":</b> ";
        }
        if (!shop || Object.keys(shop).length === 0) {
            if (fromNPC) {
                safaribot.sendMessage(src, "[Closed] This shop is closed for maintenance. Please come back later.", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I have nothing to sell right now.", safchan);
            }
            return;
        }

        if (product === "*") {
            this.showPrices(src, shop, command, (sellerId ? sys.name(sellerId) : null));
            return;
        }
        if (!fromNPC && (sellerName.toLowerCase() == sys.name(src).toLowerCase() || sys.ip(sellerId) === sys.ip(src))) {
            safaribot.sendMessage(src, "You cannot buy things from your own Shop!", safchan);
            return;
        }

        //Tutorial is restricted above
        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }

        input = getInput(product);
        if (!input) {
            if (fromNPC) {
                safaribot.sendMessage(src, "What's that \"" + product +  "\" you are talking about? A new item? Some unknown Pokémon species?", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I don't have anything called \"" + product +  "\" in my humble shop.", safchan);
            }
            return;
        }
        if (!(input.input in shop)) {
            if (fromNPC) {
                safaribot.sendMessage(src, "Sorry, we are not selling any " + input.name + " at the moment.", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I'm not selling any " + input.name + " right now, please don't insist!", safchan);
            }
            return;
        }
        if (shop[input.input].limit === 0) {
            if (fromNPC) {
                safaribot.sendMessage(src, "Sorry, we already sold all the " + (input.type === "poke" ? input.name : es(input.name)) + " we had.", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "You are out of luck, I just sold my last " + input.name + " " + plural(sys.rand(1, 10), "second") + " ago!", safchan);
            }
            return;
        }

        if (input.type == "poke" && !fromNPC && countRepeated(seller.pokemon, input.id) <= 1) {
            if (seller.party.length === 1 && seller.party[0] == input.id) {
                safaribot.sendHtmlMessage(src, sName + "You are out of luck, I just sold my last " + input.name + " " + plural(sys.rand(1, 10), "second") + " ago!", safchan);
                safaribot.sendMessage(sellerId, "You cannot sell the last Pokémon in your party! Removing them from your shop.", safchan);
                delete seller.shop[input.input];
                return;
            }
            if (seller.starter === input.id) {
                safaribot.sendHtmlMessage(src, sName + "You are out of luck, I just sold my last " + input.name + " " + plural(sys.rand(1, 10), "second") + " ago!", safchan);
                safaribot.sendMessage(sellerId, "You cannot sell your starter Pokémon! Removing them from your shop.", safchan);
                delete seller.shop[input.input];
                return;
            }
        }

        var amount = 1;
        if (info.length > 2) {
            amount = parseInt(info[2], 10);
            if (input.type == "poke") {
                if (amount > 1) {
                    safaribot.sendHtmlMessage(src, "You cannot buy multiples Pokémon at once! Changing amount to 1!", safchan);
                    amount = 1;
                }
            } else {
                if (isNaN(amount) || amount < 1 || input.id == "box") {
                    amount = 1;
                }
            }
        }

        if (shop[input.input].limit !== -1 && shop[input.input].limit - amount < 0) {
            if (fromNPC) {
                safaribot.sendMessage(src, "I'm sorry, but we currently only have " + plural(shop[input.input].limit, input.name) + " to sell, so you can't buy " + amount + "!", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I only have " + plural(shop[input.input].limit, input.name) + " to sell, how do you expect me to sell you " + amount + "?", safchan);
            }
            return;
        }

        var cap = getCap(input.id);
        if (!this.isBelowCap(src, input.id, amount, input.type)) {
            return;
        }
        if (fromNPC) {
            if (player.balls.entry > 0) {
                var check = rafflePlayers.get(sys.name(src).toLowerCase());
                if (!check) {
                    safaribot.sendMessage(src, "You seem to have some raffle entries from a previous drawing. I'll dispose of them so you don't get confused!", safchan);
                    player.balls.entry = 0;
                }
            }

            if (input.id === "entry" && !rafflePrizeObj) {
                safaribot.sendMessage(src, "There is no raffle going on right now so we cannot legally sell you an entry! Sorry!", safchan);
                return;
            }
        } else {
            //Eventually enable this when there's a way to confirm you want to buy it. As it is, no one will be able to buy from this shop until the 15 seconds pass.
            /* if (now() < seller.cooldowns.shopEdit + 15 * 1000) {
                safaribot.sendMessage(src, "This shop was modified in the last 15 seconds. Please verify if the price for the product you wish to buy didn't change!", safchan);
                return;
            } */
        }

        var isSilver = shop[input.input].silver || false;
        var silverName = finishName("silver");

        var boxPrice = itemData.box.price[Math.min(player.balls.box, itemData.box.price.length - 1)];
        var cost = input.id == "box" ? boxPrice : shop[input.input].price * amount;
        
        var discount = false, discountRate = 0.5;
        if (discount) {
            cost = Math.ceil(cost * discountRate);
        }
        
        if (isSilver) {
            if (player.balls.silver < cost) {
                if (fromNPC) {
                    safaribot.sendMessage(src, "You need " + plural(cost, silverName) + " to buy " + plural(amount, input.name) + ", but you only have " + plural(player.balls.silver, silverName) + "!", safchan);
                } else {
                    safaribot.sendHtmlMessage(src, sName + "Ok, it will cost you " + plural(cost, silverName) + " to buy " + plural(amount, input.name) + "... Hey! You only have " + plural(player.balls.silver,silverName) + ", so no deal!", safchan);
                }
                return;
            }
            player.balls.silver -= cost;
        } else {
            if (player.money < cost) {
                if (fromNPC) {
                    safaribot.sendMessage(src, "You need $" + addComma(cost) + " to buy " + plural(amount, input.name) + ", but you only have $" + addComma(player.money) + "!", safchan);
                } else {
                    safaribot.sendHtmlMessage(src, sName + "Ok, it will cost you $" + addComma(cost) + " to buy " + plural(amount, input.name) + "... Hey! You only have $" + addComma(player.money) + ", so no deal!", safchan);
                }
                return;
            }
            player.money -= cost;
        }

        if (input.type == "poke") {
            player.pokemon.push(input.id);
        }
        else if (input.type == "item") {
            if (!fromNPC && input.id == "battery") {
                this.dailyReward(src, getDay(now()));
            }
            player.balls[input.id] += amount;
        }
        if (isSilver) {
            if (fromNPC) {
                safaribot.sendMessage(src, "You bought " + plural(amount, input.name) + " for " + plural(cost, silverName) + "! You now have " + plural(player.balls.silver, silverName) + "!", safchan);
                if (input.type == "poke" && isRare(input.id)) {
                    sys.appendToFile(mythLog, now() + "|||" + input.name + "::was bought  by " + sys.name(src) + " for " +plural(cost, silverName) + "::\n");
                }
            } else {
                safaribot.sendHtmlMessage(src, sName + "Thanks for buying " + plural(amount, input.name) + " for " + plural(cost, silverName) + "! You now have " + plural(player.balls.silver, silverName) + "!", safchan);
            }
        } else {
            if (fromNPC) {
                safaribot.sendMessage(src, "You bought " + plural(amount, input.name) + " for $" + addComma(cost) + "! You now have $" + addComma(player.money) + "!", safchan);
                if (input.type == "poke" && isRare(input.id)) {
                    sys.appendToFile(mythLog, now() + "|||" + input.name + "::was bought  by " + sys.name(src) + " for $" + cost + "::\n");
                }
            } else {
                safaribot.sendHtmlMessage(src, sName + "Thanks for buying " + plural(amount, input.name) + " for $" + addComma(cost) + "! You now have $" + addComma(player.money) + "!", safchan);
            }
        }

        var limitChanged = false;
        if (shop[input.input].limit > 0) {
            shop[input.input].limit -= amount;
            limitChanged = true;
        }
        if (seller) {
            if (isSilver) {
                seller.balls.silver = Math.min(seller.balls.silver + cost, getCap("silver"));
            } else {
                seller.money = Math.min(seller.money + cost, moneyCap);
            }
            if (input.type == "poke") {
                this.removePokemon(sellerId, input.id);
            } else if (input.type == "item") {
                if (input.id == "battery") {
                    this.dailyReward(sellerId, getDay(now()));
                }
                seller.balls[input.id] -= amount;
                this.updateShop(seller, input.id);
            }
            sys.sendMessage(sellerId, "", safchan);
            if (isSilver) {
                safaribot.sendMessage(sellerId, "Someone bought " + amount + " of your " + input.name + "! You received " + plural(cost, silverName) + " and now have " + plural(seller.balls.silver, silverName) + "!", safchan);
            } else {
                safaribot.sendMessage(sellerId, "Someone bought " + plural(amount, input.name) + " from your shop! You received $" + addComma(cost) + " and now have $" + addComma(seller.money) + "!", safchan);
            }
            sys.sendMessage(sellerId, "", safchan);
            this.saveGame(seller);
            sys.appendToFile(shopLog, now() + "|||" + sys.name(sellerId) + "::" + amount + "::" + input.name + "::" + shop[input.input].price + "::" + cost + ":::" + isSilver + "|||" + sys.name(src) + "\n");
            if (input.type == "poke" && isRare(input.id)) {
                sys.appendToFile(rareTradeLog, now() + "|||" + sys.name(src) + " bought " + plural(amount, input.input) + " from " + sys.name(sellerId) + " for $" + addComma(cost) + (amount > 1 ? " ($" + addComma(shop[input.input].price) + " each)" : "") + "\n");
            }
        } else {
            this.buyBonus(src, input.id, amount, cap);
            if (limitChanged) {
                this.saveShop();
            }
        }
        this.saveGame(player);
    };
    this.editShop = function(src, data, editNPCShop, isSilver) {
        var player = getAvatar(src);
        if (!editNPCShop) {
            if (!validPlayers("self", src)) {
                return;
            }
            var reason = "edit your shop";
            if (cantBecause(src, reason, ["tutorial"])) {
                return;
            }
            if (player.tradeban > now()) {
                safaribot.sendMessage(src, "You are banned from creating your own shop for " + timeLeftString(player.tradeban) + "!", safchan);
                return;
            }
            if (player.records.pokesCaught < 4) {
                safaribot.sendMessage(src, "You can only set a shop after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
                return;
            }
            if (cantBecause(src, reason, ["contest", "auction", "battle", "event"])) {
                return;
            }
        }
        var comm = editNPCShop ? "npc" : "shop";

        var info = data.split(":");
        if (info.length < 2) {
            safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[amount] or /"+comm+"remove [pokémon/item].", safchan);
            return true;
        }
        var action = info[0];
        var product = info[1];
        var input = getInput(product);

        if ((action !== "close" && action !== "clean") && !input) {
            safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[limit] or /"+comm+"remove [pokémon/item]. You can clear your shop with /"+comm+"close or /"+comm+"clean.", safchan);
            return true;
        }
        var productType = input.type;

        if (action == "add") {
            if (info.length < 3) {
                safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[limit] or /"+comm+"remove [pokémon/item]. You can clear your shop with /"+comm+"close or /"+comm+"clean.", safchan);
                return true;
            }
            var limit = info.length > 3 ? parseInt(info[3], 10) : -1;
            limit = isNaN(limit) ? -1 : limit;
            if (limit < 1 && !editNPCShop) {
                limit = 1;
            }

            if (!editNPCShop) {
                if (productType == "poke") {
                    if (!canLosePokemon(src, input.input, "sell")) {
                        return true;
                    }
                    if (limit > countRepeated(player.pokemon, input.id)) {
                        safaribot.sendMessage(src, "You do not have " + limit + " " + input.name + " to add to your shop!", safchan);
                        return true;
                    }
                }
                else if (productType == "item") {
                    if (!itemData[input.id].tradable) {
                        safaribot.sendMessage(src, "This item cannot be added to your shop!", safchan);
                        return true;
                    }
                    if (player.balls[input.id] < limit) {
                        safaribot.sendMessage(src, "You do not have " + limit + " " + input.name + " to add to your shop!", safchan);
                        return true;
                    }
                    if ("tradeReq" in itemData[input.id] && player.balls[input.id] - limit < itemData[input.id].tradeReq) {
                        safaribot.sendMessage(src, "This item cannot be added to your shop unless you have more than " + itemData[input.id].tradeReq + " of those!", safchan);
                        return true;
                    }
                }
                if (Object.keys(player.shop).length >= 22) {
                    safaribot.sendMessage(src, "Your shop is too large! Please remove something before adding a new item!", safchan);
                    return true;
                }
            }
            var price = parseInt(info[2].replace(",", ""), 10);
            if (isNaN(price) || price < 1 || price > moneyCap) {
                safaribot.sendMessage(src, "Please type a valid price!", safchan);
                return true;
            }
            if (!editNPCShop && productType == "poke") {
                var minPrice = getPrice(input.id, input.shiny);
                if (price < minPrice) {
                    safaribot.sendMessage(src, "You cannot sell " + input.name + " for less than $" + addComma(minPrice) + "!", safchan);
                    return true;
                }
            }

            
            safaribot.sendMessage(src, input.name + " has been " + (input.input in player.shop ? "re" : "") + "added to " + (editNPCShop ? "the NPC Shop" : "your shop") + " with the price of " + (isSilver ? plural(price, "silver") : "$" + price) + " (Units Available: " + (limit == -1 ? "Unlimited" : limit) + ")!", safchan);
            if (editNPCShop) {
                npcShop[input.input] = { price: price, limit: limit, silver: isSilver };
                this.saveShop();
            } else {
                player.shop[input.input] = { price: price, limit: limit };
                player.cooldowns.shopEdit = now();
                this.saveGame(player);
            }
        }
        else if (action == "remove") {
            if (editNPCShop) {
                if (input.input in npcShop) {
                    delete npcShop[input.input];
                    safaribot.sendMessage(src, input.name + " has been removed from the NPC shop!", safchan);
                    this.saveShop();
                } else {
                    safaribot.sendMessage(src, "You can't remove a Pokémon/Item from the shop if they are not there!", safchan);
                }
            } else {
                if (input.input in player.shop) {
                    delete player.shop[input.input];
                    safaribot.sendMessage(src, input.name + " has been removed from your shop!", safchan);
                    this.saveGame(player);
                } else {
                    safaribot.sendMessage(src, "You can't remove a Pokémon/Item from the shop if they are not there!", safchan);
                }
            }
        }
        else if (action == "close") {
            if (editNPCShop) {
                for (var e in npcShop) {
                    delete npcShop[e];
                }
                safaribot.sendMessage(src, "The NPC Shop has been cleared!", safchan);
                this.saveShop();
            } else {
                for (var e in player.shop) {
                    delete player.shop[e];
                }
                safaribot.sendMessage(src, "Removed all Pokémon/Items from your shop!", safchan);
                this.saveGame(player);
            }
        }
        else if (action == "clean") {
            if (editNPCShop) {
                for (var e in npcShop) {
                    if (npcShop[e].limit === 0) {
                        delete npcShop[e];
                    }
                }
                safaribot.sendMessage(src, "The NPC Shop has been cleaned!", safchan);
                this.saveShop();
            } else {
                for (var e in player.shop) {
                    if (player.shop[e].limit === 0) {
                        delete player.shop[e];
                    }
                }
                safaribot.sendMessage(src, "Removed all Out of Stock Pokémon/Items from your shop!", safchan);
                this.saveGame(player);
            }
        }
        else {
            safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[limit] or /"+comm+"remove [pokémon/item]. You can clear your shop with /"+comm+"close or /"+comm+"clean.", safchan);
        }
        return true;
    };
    this.dailyReward = function(src, today) {
        var player = getAvatar(src);
        if (!player) {
            return;
        }
        
        player.casedName = sys.name(src);
        player.nameColor = script.getColor(src);
        
        if (player.tutorial.inTutorial) {
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
            if (player.balls.safari > getCap("safari")) {
                player.balls.safari = getCap("safari");
            }
            gained.push( plural(safariGained, "safari"));

            var milestone = logins % 32;
            var milestoneRewards = {
                "31": { reward: "master", amount: 1 },
                "27": { reward: "gacha", amount: 30 },
                "24": { reward: "clone", amount: 5 },
                "21": { reward: "luxury", amount: 5 },
                "18": { reward: "gacha", amount: 15 },
                "15": { reward: "rare", amount: 1, repeatAmount: 2 },
                "12": { reward: "bait", amount: 10 },
                "9": { reward: "ultra", amount: 5, repeatAmount: 15},
                "6": { reward: "great", amount: 8, repeatAmount: 25},
                "3": { reward: "rock", amount: 5, repeatAmount: 25}
            };

            var frag;
            if (milestone in milestoneRewards) {
                var reward = milestoneRewards[milestone];
                var item = reward.reward;
                var amount = logins > 30 && "repeatAmount" in reward? reward.repeatAmount : reward.amount;

                if (item === "master" && player.balls.master >= getCap("master")) {
                    frag = true;
                }
                rewardCapCheck(player, item, amount, null, true);
                gained.push(plural(amount, item));
            }
            if (logins > player.records.consecutiveLogins) {
                player.records.consecutiveLogins = logins;
            }

            var perkBonus = Math.min(itemData.battery.bonusRate * player.balls.battery, itemData.battery.maxRate);
            var recharges = 30 + perkBonus;
            player.balls.itemfinder = recharges;

            safaribot.sendMessage(src, "You received the following rewards for playing Safari " + (logins > 1 ? logins + "  days in a row" : "today" ) + ": " + gained.join(", "), safchan);
            safaribot.sendMessage(src, "Your Itemfinder has been recharged to " + recharges + " charges!", safchan);
            if (frag) {
                safaribot.sendMessage(src, "As you try to put it away, the " + finishName("master") + " starts to glow very bright and then shatters in your hands. Sadly, all you could do was carefully grab a salvageable piece and stow it safely in your bag.", safchan);
            }
            if (logins % 32 === 30) {
                safaribot.sendHtmlMessage(src, "Tip: Logging in tomorrow will reward you with " + an(finishName("master")) + "!", safchan);
            }
        }
        this.saveGame(player);
    };
    this.refundRaffle = function(player, id, refund) {
        if (!player) {
            return;
        }
        var totalRefund = player.balls.entry * refund;
        player.balls.entry = 0;

        if (totalRefund) {
            player.money += totalRefund;
            if (id) {
                if (player.money >= moneyCap) {
                    var excess = player.money - moneyCap;
                    safaribot.sendMessage(id, "You received $" + addComma(totalRefund) + " for your refunded raffle entries but you could only hold $" + addComma(totalRefund - excess) + ". You now have $" + addComma(Math.min(moneyCap, player.money)) + ".", safchan);
                } else {
                    safaribot.sendMessage(id, "You received $" + addComma(totalRefund) + " for your refunded raffle entries. You now have $" + addComma(player.money) + ".", safchan);
                }
            }
        }
        this.sanitize(player);
    };

    /* Secret Base */
    this.viewDecorations = function(src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var isAndroid = (sys.os(src) === "android");
        var player = getAvatar(src), obj = player.decorations, info;
        
        var list = Object.keys(obj).filter(function(x) {
            return obj[x] > 0;
        }).sort();
        sys.sendMessage(src, "", safchan);
        safaribot.sendMessage(src, "Your decorations:", safchan);
        
        var out = [];
        for (var e = 0; e < list.length; e++) {
            info = decorations[list[e]];
            out.push(obj[list[e]] + "x " + info.name + " (" + info.width + "x" + info.height + ")");
        }
        if (isAndroid) {
            safaribot.sendMessage(src, out.join(" | "), safchan);
        } else {
            if (out.length > 10) {
                var rowsNumber = 12;
                var rows = [];
                for (e = 0; e < rowsNumber; e++) {
                    rows.push([]);
                }
                for (e = 0; e < out.length; e++) {
                    rows[e%rowsNumber].push(out[e]);
                }
                for (e = 0; e < rowsNumber; e++) {
                    out.push("<tr><td>" + rows[e].join("</td><td> | </td><td>") + "</td></tr>");
                }
                sys.sendHtmlMessage(src, "<table border='0' cellpadding='0' cellspacing='0'>" + out.join("") + "</table>", safchan);
            } else {
                for (e = 0; e < out.length; e++) {
                    safaribot.sendMessage(src, out[e], safchan);
                }
            }
        }
        
        sys.sendMessage(src, "", safchan);
    };
    this.viewBase = function(src, data) {
        if (data === "*") {
            data = sys.name(src);
        }
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
        if (id !== src && target.secretBase.length === 0) {
            safaribot.sendMessage(src, "This person's Secret Base is empty!", safchan);
            return;
        }
        // Possibly disable this. Adding this because printing Secret Base may end using a fair amount of bandwidth
        var currentTime = now();
        var lastView = SESSION.users(src).secretBaseView || 0;
        if (lastView > currentTime) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(lastView) + " before trying to visit another Secret Base!", safchan);
            return;
        }
        SESSION.users(src).secretBaseView = now() + (src === id ? 30 : 60) * 1000;

        safaribot.sendMessage(src, sys.name(id) + "'s Secret Base:", safchan);
        this.printBase(src, target.secretBaseCache);
    };
    this.printBase = function(src, base) {
        var isAndroid = (sys.os(src) === "android");
        var out = [], e, rowData = [];
        
        if (isAndroid) {
            var side = "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAwCAMAAAAfDRtEAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAAAA////pdmf3QAAAAJ0Uk5T/wDltzBKAAAAF0lEQVR42mJgZGAEIUYQOcoc8UyAAAMAjV8BgZdkvloAAAAASUVORK5CYII='>";
            for (e = 0; e < base.length; e++) {
                rowData.push(this.getDecorationPic(base[e]));
                if (e % SECRET_BASE_WIDTH === SECRET_BASE_WIDTH-1) {
                    out.push(rowData.join("") + side);
                    rowData = [];
                }
            }
            sys.sendHtmlMessage(src, "1↓ 1→ ______________________", safchan);
            for (e = 0; e < out.length; e++) {
                sys.sendHtmlMessage(src, out[e], safchan);
            }
            sys.sendHtmlMessage(src, "¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯", safchan);
        } else {
            for (e = 1; e <= SECRET_BASE_WIDTH; e++) {
                rowData.push(e);
            }
            out.push("<tr><td></td><td align='center'>" + rowData.join("</td><td align='center'>") + "</td></tr>");
            rowData = [];
            for (e = 0; e < base.length; e++) {
                rowData.push(this.getDecorationPic(base[e]));
                if (e % SECRET_BASE_WIDTH === SECRET_BASE_WIDTH-1) {
                    out.push("<tr><td valign='middle'>" + (out.length) + "</td><td>" + rowData.join("</td><td>") + "</td></tr>");
                    rowData = [];
                }
            }
            out = "<table border='1'><tr><td><table border='0' cellpadding='0' cellspacing='0'>" + out.join("") + "</table></td></tr></table>";
            sys.sendHtmlMessage(src, out, safchan);
        }
    };
    this.getDecorationPic = function(id) {
        if (id === null) {
            return "<img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAAAAAAAApWe5zwAAAAF0Uk5TAEDm2GYAAAAdSURBVHja7MGBAAAAAMOg+VPf4ARVAQDwTAABBgAJMAABIBu2IQAAAABJRU5ErkJggg=='>";
        }
        
        var picId = id.substr(0, id.indexOf(":"));
        var picIndex = parseInt(id.substr(id.indexOf(":")+1), 10);
        return "<img src='" + decorations[picId].img[picIndex] + "'>";
    };
    this.editBase = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        
        var info = data.split(":");
        var deco = decorationAlias(info[0].toLowerCase(), true);
        if (info.length < 3 && deco !== "wipe") {
            safaribot.sendMessage(src, "Invalid format! Use /editbase Decoration:PositionX:PositionY! To remove a decoration, use /editbase remove:PositionX:PositionY, or /editbase wipe to remove all decorations. Bases dimensions are " + SECRET_BASE_WIDTH + "x" + SECRET_BASE_HEIGHT + ".", safchan);
            return;
        }
        var x = parseInt(info[1], 10) - 1;
        var y = parseInt(info[2], 10) - 1;
        var clearing = ["remove", "clear", "empty", "wipe"].contains(deco);
        var current = this.getDecoAtPos(player.secretBase, x, y);
        
        if (clearing) {
            if (deco === "wipe") {
                player.secretBase = [];
                player.secretBaseCache = this.cacheBase(player.secretBase);
                this.saveGame(player);
                safaribot.sendMessage(src, "Removed all decorations from your Secret Base!", safchan);
                return;
            }
            if (!current) {
                safaribot.sendMessage(src, "There's no decoration to remove from this position!", safchan);
                return;
            }
            player.secretBase.splice(player.secretBase.indexOf(current), 1);
            player.secretBaseCache = this.cacheBase(player.secretBase);
            safaribot.sendMessage(src, "You removed the " + decorations[current.deco].name + " from the position " + (x+1) + "," + (y+1) + "!", safchan);
            return;
        } 
        if (!decorations.hasOwnProperty(deco)) {
            safaribot.sendMessage(src, "Invalid decoration!", safchan);
            return;
        }
        if (!player.decorations.hasOwnProperty(deco) || player.decorations[deco] === 0) {
            safaribot.sendMessage(src, "You do not have this decoration!", safchan);
            return;
        }
        var e, count = 0;
        for (e = 0; e < player.secretBase.length; e++) {
            if (player.secretBase[e].deco === deco) {
                count++;
            }
        }
        if (player.decorations[deco] - count < 1) {
            safaribot.sendMessage(src, "You do not have any more of this decoration available!", safchan);
            return;
        }
        if (!this.canFitDeco(deco, player.secretBaseCache, x, y)) {
            safaribot.sendMessage(src, "You cannot put this decoration at this position! Please check if there's enough space at this point.", safchan);
            return;
        }
        player.secretBase.push({ deco: deco, x: x, y: y});
        player.secretBaseCache = this.cacheBase(player.secretBase);
        this.saveGame(player);
        safaribot.sendMessage(src, "You added the " + decorations[deco].name + " to the position " + (x+1) + "," + (y+1) + "!", safchan);
    };
    this.canFitDeco = function(deco, base, x, y) {
        var data = decorations[deco];
        if (x < 0 || y < 0 || x + data.width > SECRET_BASE_WIDTH || y + data.height > SECRET_BASE_HEIGHT) {
            return false;
        }
        var px, py, index;
        for (py = y; py < y + data.height; py++) {
            for (px = x; px < x + data.width; px++) {
                index = py * SECRET_BASE_WIDTH + px;
                if (base[index] !== null) {
                    return false;
                }
            }
        }
        return true;
    };
    this.getDecoAtPos = function(data, x, y) {
        var e, obj, info;
        for (e = 0; e < data.length; e++) {
            obj = data[e];
            info = decorations[obj.deco];
            if (x >= obj.x && x < obj.x + info.width && y >= obj.y && y < obj.y + info.height) {
                return obj;
            }
        }
        return null;
    };
    this.cacheBase = function(data) {
        var out = [], e, slots = SECRET_BASE_WIDTH * SECRET_BASE_HEIGHT;
        for (e = 0; e < slots; e++) {
            out.push(null);
        }
        
        var info, id, x, y, px, py, deco, part;
        for (e in data) {
            deco = data[e];
            id = deco.deco;
            info = decorations[id];
            x = deco.x;
            y = deco.y;
            if (info.width > 1 || info.height > 1) {
                part = 0;
                for (py = 0; py < info.height; py++) {
                    for (px = 0; px < info.width; px++) {
                        out[Math.floor((y + py) * SECRET_BASE_WIDTH) + ((x + px) % SECRET_BASE_WIDTH)] = id + ":" + part;
                        part++;
                    }
                }
            } else {
                out[Math.floor(y * SECRET_BASE_WIDTH) + (x % SECRET_BASE_WIDTH)] = id + ":" + 0;
            }
        }    
        return out;
    };
    this.sanitizeBase = function(player) {
        if (player) {
            var decosCount = {}, e, data, diff, amt, i, d;
            for (e = 0; e < player.secretBase.length; e++) {
                data = player.secretBase[e];
                if (!decosCount.hasOwnProperty(data.deco)) {
                    decosCount[data.deco] = 0;
                }
                decosCount[data.deco]++;
            }
            for (e in decosCount) {
                amt = player.decorations.hasOwnProperty(e) ? player.decorations[e] : 0;
                if (amt < decosCount[e]) {
                    diff = decosCount[e] - amt;
                    for (i = 0; i < diff; i++) {
                        for (d = 0; d < player.secretBase.length; d++) {
                            if (player.secretBase[d].deco === e) {
                                player.secretBase.splice(d, 1);
                                break;
                            }
                        }
                    }
                }
            }
            player.secretBaseCache = this.cacheBase(player.secretBase);
        }
    };
    function printDecoration(src, id) {
        var isAndroid = (sys.os(src) === "android");
        var out = [], e, rowData = [], deco = decorations[id], imgset = deco.img, w = deco.width;
        
        if (isAndroid) {
            for (e = 0; e < imgset.length; e++) {
                rowData.push("<img src='" + imgset[e] + "'>");
                if (e % w === w-1) {
                    out.push(rowData.join(""));
                    rowData = [];
                }
            }
            for (e = 0; e < out.length; e++) {
                sys.sendHtmlMessage(src, out[e], safchan);
            }
        } else {
            for (e = 0; e < imgset.length; e++) {
                rowData.push("<img src='" + imgset[e] + "'>");
                if (e % w === w-1) {
                    out.push("<tr><td>" + rowData.join("</td><td>") + "</td></tr>");
                    rowData = [];
                }
            }
            out = "<table border='0' cellpadding='0' cellspacing='0'>" + out.join("") + "</table>";
            sys.sendHtmlMessage(src, out, safchan);
        }
    }
    
    /* Battles */
    this.challengePlayer = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "start a battle";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        var name = sys.name(src).toLowerCase();
        if (data.toLowerCase() === "cancel") {
            if (name in challengeRequests) {
                safaribot.sendMessage(src, "You cancelled your challenge against " + challengeRequests[name].toCorrectCase() + "!", safchan);
                delete challengeRequests[name];
            } else {
                safaribot.sendMessage(src, "You have no pending challenges initiated by you!", safchan);
            }
            return;
        }

        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "precontest", "event", "pyramid"])) {
            return;
        }
        
        var autoCancel;
        var targetId = sys.id(data);
        if (!targetId) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return;
        }        
        var tName = sys.name(targetId).toLowerCase();
        if (name in challengeRequests) {
            if (challengeRequests[name].toLowerCase() === tName) {
                safaribot.sendHtmlMessage(src, "You already have a pending challenge with this person! To cancel it, type " + link("/challenge cancel") + ".", safchan);
                return;
            } else {
                autoCancel = true;
            }
        }

        if (!validPlayers("target", src, data, "You can't battle yourself!")) {
            return;
        }
        var target = getAvatar(targetId);
        if (this.isInAuction(tName)) {
            safaribot.sendMessage(src, "This person is currently in an auction! Wait for them to finish to challenge again!", safchan);
            return;
        }
        if (this.isBattling(tName)) {
            safaribot.sendMessage(src, "This person is already battling! Wait for them to finish to challenge again!", safchan);
            return;
        }
        if (target.tutorial.inTutorial) {
            safaribot.sendMessage(src, "This person is currently completing the tutorial! Wait for them to finish to challenge again!", safchan);
            return;
        }

        if (player.party.length < 3) {
            safaribot.sendMessage(src, "Your party must have at least 3 Pokémon to battle!", safchan);
            return;
        }

        if (challengeRequests.hasOwnProperty(tName) && challengeRequests[tName] == name) {
            if (target.party.length < 3) {
                safaribot.sendMessage(src, "Battle not started because " + sys.name(targetId) + " has less than 3 Pokémon in their party!", safchan);
                safaribot.sendMessage(targetId, "Your party must have at least 3 Pokémon to battle!", safchan);
                return;
            }
            var battle = new Battle(targetId, src);
            currentBattles.push(battle);

            delete challengeRequests[tName];
        } else {
            if (autoCancel) {
                safaribot.sendHtmlMessage(src, "You cancelled your challenge against " + challengeRequests[name].toCorrectCase() + " to challenge " + tName.toCorrectCase() + " instead.", safchan);
                delete tradeRequests[name];
            }
            
            challengeRequests[name] = tName;
            var commandLink = "/challenge cancel";
            safaribot.sendHtmlMessage(src, "You are challenging " + sys.name(targetId) + " to a battle! Wait for them to accept, or cancel the challenge with " + link(commandLink) + ".", safchan);

            commandLink = "/challenge " + sys.name(src);
            sys.sendMessage(targetId, "", safchan);
            safaribot.sendHtmlMessage(targetId, sys.name(src) + " is challenging you for a battle! To accept, type " + link(commandLink) + ".", safchan);
            sys.sendMessage(targetId, "", safchan);
        }
    };
    this.watchBattle = function(src, data) {
        if (!validPlayers("target", src, data)) {
            return;
        }
        var name = sys.name(src);
        var tName = sys.name(sys.id(data)).toLowerCase();
        var canView = function(src, name) {
            var target = getAvatarOff(name);
            if (!target) {
                return false;
            }
            return !(target.id !== sys.name(src).toLowerCase() && !target.visible && !SESSION.channels(safchan).isChannelAdmin(src));
        };

        var battle, b;
        for (b in currentBattles) {
            battle = currentBattles[b];
            if (battle.isInBattle(tName)) {
                if (battle.viewers.indexOf(name.toLowerCase()) !== -1) {
                    battle.sendToViewers(name + " stopped watching this battle!");
                    battle.viewers.splice(battle.viewers.indexOf(name.toLowerCase()), 1);
                } else {
                    if (!battle.isInBattle(name) && (!canView(src, battle.name1) || (!battle.npcBattle && !canView(src, battle.name2)))) {
                        safaribot.sendMessage(src, "You cannot view this person's battles!", safchan);
                        return;
                    }
                    battle.viewers.push(name.toLowerCase());
                    battle.sendToViewers(name + " is watching this battle!");
                }
                return;
            }
        }

        safaribot.sendMessage(src, "This person is not battling!", safchan);
    };
    this.isBattling = function(name) {
        for (var b in currentBattles) {
            if (currentBattles[b].isInBattle(name)) {
                return true;
            }
        }
        return false;
    };
    function Battle(p1, p2) {
        var player1 = getAvatar(p1);

        this.name1 = sys.name(p1);
        this.viewers = [this.name1.toLowerCase()];
        this.team1 = player1.party.concat().shuffle();

        var isNPC = this.npcBattle = typeof p2 == "object";
        var player2 = isNPC ? p2 : getAvatar(p2);
        var npcDesc = null;

        if (isNPC) {
            var costumeBonus = player1.costume === "battle" ? costumeData.battle.rate : 0;
            var useBonus = 0;
            if (p2.desc.indexOf("Tower Lvl.") > -1) {
                useBonus = player1.quests.tower.bonusPower;
            }
            this.selfPowerMin = 10 + costumeBonus + useBonus;
            this.selfPowerMax = (100 + costumeBonus + useBonus) * (player1.truesalt >= now() ? 0.35 : 1);

            this.name2 = player2.name;
            this.team2 = player2.party.concat().shuffle();
            if (!player2.power || player2.length < 2) {
                player2.power = [10, 100];
            }
            this.powerMin = player2.power[0];
            this.powerMax = player2.power[1];
            this.postBattle = player2.postBattle;
            this.postArgs = player2.postArgs;
            npcDesc = player2.desc || null;
        } else {
            this.name2 = sys.name(p2);
            this.viewers.push(this.name2.toLowerCase());
            this.team2 = player2.party.concat().shuffle();
        }

        this.turn = -1;
        this.duration = Math.min(this.team1.length, this.team2.length);
        if (this.team1.length > this.duration) {
            this.team1 = this.team1.slice(0, this.duration);
        }
        if (this.team2.length > this.duration) {
            this.team2 = this.team2.slice(0, this.duration);
        }

        this.p1Score = 0;
        this.p2Score = 0;
        this.p1TotalScore = 0;
        this.p2TotalScore = 0;
        this.scoreOrder = [];
        this.finished = false;

        sendAll("A battle between " + this.name1 + " and " + this.name2 + (npcDesc ? " (" + npcDesc + ")" : "") + " has started! [" + link("/watch " + this.name1, "Watch") + "]", true);
    }
    Battle.prototype.nextTurn = function() {
        if (this.turn < 0) {
            this.turn++;
            this.sendToViewers("Preparations complete, battle will start soon!");
            return;
        }
        var p1Poke = this.team1[this.turn];
        var p2Poke = this.team2[this.turn];
        
        var res = calcDamage(p1Poke, p2Poke, (this.npcBattle ? [this.selfPowerMin, this.selfPowerMax] : null), (this.npcBattle ? [this.powerMin, this.powerMax] : null));

        var name1 = this.name1 + "'s " + poke(p1Poke);
        var name2 = this.name2 + "'s " + poke(p2Poke);

        this.sendToViewers("Turn " + (this.turn + 1) + " | " + res.statName + " | " + name1 + " " + pokeInfo.icon(p1Poke) + " x " + pokeInfo.icon(p2Poke) + " " + name2);
        this.sendToViewers(name1 + " | " + res.statName + ": " + res.stat[0] + " | Move Power: " + res.move[0] + " | Type Effectiveness: " + res.bonusString[0] + "x");
        this.sendToViewers(name2 + " | " + res.statName + ": " + res.stat[1] + " | Move Power: " + res.move[1] + " | Type Effectiveness: " + res.bonusString[1] + "x");

        var p1Power = res.power[0];
        var p2Power = res.power[1];
        
        if (p1Power > p2Power) {
            this.p1Score++;
            this.scoreOrder.push(1);
            this.sendToViewers("Result: <b>" + name1 + " (" + p1Power + ")</b> x (" + p2Power + ") " + name2, true);
        }
        else if (p2Power > p1Power) {
            this.p2Score++;
            this.scoreOrder.push(2);
            this.sendToViewers("Result: " + name1 + " (" + p1Power + ") x <b>(" + p2Power + ") " + name2 + "</b>", true);
        }
        else {
            this.scoreOrder.push(0);
            this.sendToViewers("Result: " + name1 + " (" + p1Power + ") x (" + p2Power + ") " + name2 + " | <b>Draw</b>", true);
        }

        this.p1TotalScore += p1Power;
        this.p2TotalScore += p2Power;

        this.turn++;
        if (this.turn >= this.duration) {
            if (this.turn == this.duration && this.p1Score == this.p2Score) {
                this.team1.push(this.team1.random());
                this.team2.push(this.team2.random());
                this.sendToViewers("No winner after the regular rounds! An extra tiebreaker round will be held!", true);
            } else {
                this.finishBattle();
            }
        } else {
            if (Math.abs(this.p1Score - this.p2Score) > this.duration - this.turn) {
                this.finishBattle();
            }
        }
        this.sendToViewers("");
    };
    Battle.prototype.finishBattle = function() {
        var winner = 0, loser, score, tiebreaker = false, tiebreakerMsg;
        if (this.p1Score > this.p2Score) {
            winner = 1;
        }
        else if (this.p2Score > this.p1Score) {
            winner = 2;
        }
        else {
            var e;
            if (this.p1TotalScore > this.p2TotalScore) {
                winner = 1;
                tiebreakerMsg = "More damage dealt - " + this.p1TotalScore + " x " + this.p2TotalScore;
                tiebreaker = true;
            }
            else if (this.p1TotalScore < this.p2TotalScore) {
                winner = 2;
                tiebreakerMsg = "More damage dealt - " + this.p2TotalScore + " x " + this.p1TotalScore;
                tiebreaker = true;
            } else {
                for (e = 0; e < this.scoreOrder.length; e++) {
                    if (this.scoreOrder[e] !== 0) {
                        winner = this.scoreOrder[e];
                        tiebreaker = true;
                        tiebreakerMsg = "First to score";
                        break;
                    }
                }
            }
        }
        if (winner === 1) {
            winner = this.name1;
            loser = this.name2;
            score = this.p1Score + " x " + this.p2Score;
        } else if (winner == 2) {
            winner = this.name2;
            loser = this.name1;
            score = this.p2Score + " x " + this.p1Score;
        }

        if (winner) {
            this.sendToViewers("<b>" + winner + " defeated " + loser + " in a battle with a score of " + score + (tiebreaker ? " (Tiebreaker: " + tiebreakerMsg + ")" : "") + "!</b>", true);
        } else {
            this.sendToViewers("<b>The battle between " + this.name1 + " and " + this.name2 + " ended in a draw!</b>", true);
        }
        if (this.npcBattle && this.postBattle) {
            this.postBattle(this.name1, winner === this.name1, this.p1Score, this.p2Score, this.postArgs, this.viewers);
        }
        this.finished = true;
    };
    Battle.prototype.sendMessage = function(name, msg) {
        var id = sys.id(name);
        if (id && sys.isInChannel(id, safchan)) {
            if (msg === "") {
                sys.sendHtmlMessage(id, msg, safchan);
            } else {
                safaribot.sendHtmlMessage(id, msg, safchan);
            }
        }
    };
    Battle.prototype.sendToViewers = function(msg, bypassUnwatch) {
        var e;
        for (e in this.viewers) {
            this.sendMessage(this.viewers[e], msg);
        }
        if (bypassUnwatch) {
            if (!this.viewers.contains(this.name1.toLowerCase())) {
                this.sendMessage(this.name1, msg);
            }
            if (!this.npcBattle && !this.viewers.contains(this.name2.toLowerCase())) {
                this.sendMessage(this.name2, msg);
            }
        }
    };
    Battle.prototype.isInBattle = function(name) {
        return this.name1.toLowerCase() == name.toLowerCase() || (!this.npcBattle && this.name2.toLowerCase() == name.toLowerCase());
    };
    function calcDamage(p1, p2, p1Handicap, p2Handicap, inverted) {
        var p1Type1 = sys.type(sys.pokeType1(p1)), p1Type2 = sys.type(sys.pokeType2(p1));
        var p2Type1 = sys.type(sys.pokeType1(p2)), p2Type2 = sys.type(sys.pokeType2(p2));
        
        var p1Bonus = safari.checkEffective(p1Type1, p1Type2, p2Type1, p2Type2, false, inverted);
        var p2Bonus = safari.checkEffective(p2Type1, p2Type2, p1Type1, p1Type2, false, inverted);
        
        var p1Move = p1Handicap ? sys.rand(p1Handicap[0], p1Handicap[1]) : sys.rand(10, 100);
        var p2Move = p2Handicap ? sys.rand(p2Handicap[0], p2Handicap[1]) : sys.rand(10, 100);
        
        var statName = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var stat = sys.rand(0, 6);
        var sName = statName[stat];
        
        var p1Stat = sys.baseStats(p1, stat);
        var p2Stat = sys.baseStats(p2, stat);
        
        var p1Power = Math.round((p1Stat + p1Move) * p1Bonus);
        var p2Power = Math.round((p2Stat + p2Move) * p2Bonus);
        
        return {
            type: [[p1Type1, p1Type2], [p2Type1, p2Type2]],
            bonus: [p1Bonus, p2Bonus],
            bonusString: [toFixed(p1Bonus, 3), toFixed(p2Bonus, 3)],
            move: [p1Move, p2Move],
            statName: sName,
            stat: [p1Stat, p2Stat],
            power:[p1Power, p2Power]
        };
    }
    
    /* Auctions */
    this.createAuction = function(src, data) {
        if (!validPlayers("self", src, data)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "start an auction";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        var info = data.split(":");

        if (info.length < 3) {
            safaribot.sendMessage(src, "To create an auction, type /auction product:startingOffer:minimumBid.", safchan);
            safaribot.sendMessage(src, "Example: /auction Bulbasaur:550:10 to auction a Bulbasaur, with offers starting at $550 and bids at least $10 higher than current offer.", safchan);
            if (player.cooldowns.auction > now()) {
                safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.auction) + " before starting a new auction!", safchan);
            }
            return;
        }
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from starting auctions for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only start an auction after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        if (player.cooldowns.auction > now()) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.auction) + " before starting a new auction!", safchan);
            return;
        }
        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "precontest", "event", "pyramid"])) {
            return;
        }

        var product = info[0];
        var startingOffer = toMoney(info[1]);
        var minBid = toMoney(info[2]);

        var input = getInput(product);
        if (!input) {
            safaribot.sendMessage(src, "Invalid format! Use /auction product:startingOffer:minimumBid.", safchan);
            return;
        }

        if (isNaN(startingOffer) || startingOffer < 1) {
            safaribot.sendMessage(src, "Please type a valid number for the starting offer!", safchan);
            return;
        }
        if (isNaN(minBid) || minBid < 1) {
            safaribot.sendMessage(src, "Please type a valid number for the minimum bid raise!", safchan);
            return;
        }
        if (input.type == "poke") {
            if (!player.pokemon.contains(input.id)) {
                safaribot.sendMessage(src, "You do not have " + an(input.name) + "!", safchan);
                return;
            }
            if (!canLosePokemon(src, input.input, "auction")) {
                return;
            }
            if (startingOffer < getPrice(input.id, input.shiny)) {
                safaribot.sendMessage(src, "Starting offer for " + input.name + " must be at least $" + addComma(getPrice(input.id, input.shiny)) + "!", safchan);
                return;
            }
        } else {
            if (!itemData[input.id].tradable) {
                safaribot.sendMessage(src, "You can't auction this item!", safchan);
                return true;
            }
            if (player.balls[input.id] < 1) {
                safaribot.sendMessage(src, "You do not have " + an(input.name) + "!", safchan);
                return;
            }
            if ("tradeReq" in itemData[input.id] && player.balls[input.id] - 1 < itemData[input.id].tradeReq) {
                safaribot.sendMessage(src, "This item cannot be auctioned unless you have more than " + itemData[input.id].tradeReq + " of those!", safchan);
                return true;
            }
        }
        if (minBid > startingOffer / 2) {
            safaribot.sendMessage(src, "Minimum bid raise can't be more than half of the starting offer ($" + Math.floor(startingOffer/2) + ")!", safchan);
            return;
        }
        if (startingOffer + minBid >= moneyCap) {
            safaribot.sendMessage(src, "Starting offer plus minimum bid raise must be lower than $" + addComma(moneyCap) + "!", safchan);
            return;
        }
        if (input.input in player.shop) {
            safaribot.sendMessage(src, "Please remove the " + input.name + " from your shop before auctioning it!", safchan);
            return;
        }
        var auction = new Auction(src, input.input, startingOffer, minBid);
        currentAuctions.push(auction);

        player.cooldowns.auction = now() + 15 * 60 * 1000;
        this.saveGame(player);
    };
    this.joinAuction = function(src, data) {
        if (!validPlayers("both", src, data)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "join an auction";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only join an auction after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from joining auctions for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        var name = sys.name(src);
        var tName = sys.name(sys.id(data)).toLowerCase();

        if (preparationFirst && preparationFirst.toLowerCase() === name.toLowerCase() && preparationThrows.hasOwnProperty(name.toLowerCase())) {
            safaribot.sendMessage(src, "You will be unable to catch the Pokémon you just attracted if you join an auction now! ", safchan);
            return;
        }

        if (cantBecause(src, reason, ["auction", "battle", "event", "pyramid"])) {
            return;
        }

        var auction, b;
        for (b in currentAuctions) {
            auction = currentAuctions[b];
            if (auction.host == tName) {
                auction.join(src);
                return;
            }
        }

        safaribot.sendMessage(src, "This person is not hosting any auction!", safchan);
    };
    this.quitAuction = function(src, data) {
        if (!validPlayers("self", src, data)) {
            return;
        }
        var name = sys.name(src), auction, b;
        for (b in currentAuctions) {
            auction = currentAuctions[b];
            if (auction.isInAuction(name)) {
                auction.leave(src);
                return;
            }
        }

        safaribot.sendMessage(src, "You are not participating in any auction!", safchan);
    };
    this.bidAuction = function(src, data) {
        if (!validPlayers("self", src, data)) {
            return;
        }
        var name = sys.name(src), auction, b;
        for (b in currentAuctions) {
            auction = currentAuctions[b];
            if (auction.isInAuction(name)) {
                auction.makeOffer(src, data);
                return;
            }
        }

        safaribot.sendMessage(src, "You are not participating in any auction!", safchan);
    };
    this.isInAuction = function(name) {
        for (var b in currentAuctions) {
            if (currentAuctions[b].isInAuction(name)) {
                return true;
            }
        }
        return false;
    };
    this.isHostingAuction = function(name) {
        for (var b in currentAuctions) {
            if (currentAuctions[b].host == name.toLowerCase()) {
                return true;
            }
        }
        return false;
    };
    function Auction(src, product, starting, minBid) {
        this.host = sys.name(src).toLowerCase();
        this.hostName = sys.name(src);

        this.members = [];
        this.product = product;
        this.startingOffer = starting;
        this.minBid = minBid;

        this.currentOffer = starting - minBid;
        this.currentBidder = null;
        this.unbiddedTurns = 0;
        this.suddenDeath = false;
        this.suddenDeathOffers = {};
        this.confirmBid = {};

        this.turn = 0;
        this.finished = false;
        this.changed = false;

        if (product[0] == "@") {
            this.product = product.substr(product.indexOf("@") + 1);
            this.productName = itemAlias(this.product, false, true);
            this.type = "item";
        } else {
            this.productName = getInputPokemon(product).name;
            this.type = "poke";
        }

        var joinCommand = "/join " + this.hostName;
        sendAll("", true, true);
        sendAll(this.hostName + " is starting an auction! The product is " + an(this.productName) + ", with bids starting at $" + addComma(starting) + " (Minimum bid raise: $" + addComma(minBid) + ")! Type " + link(joinCommand) + " to join the auction!", true);
        safaribot.sendMessage(src, "You started an auction! The auction ends when the current bid is not matched after 3 turns or if no one makes a bid for the first 40 seconds!", safchan);
        sendAll("", true, true);
    }
    Auction.prototype.nextTurn = function() {
        if (this.turn === 0) {
            this.turn++;
            this.sendToViewers("[Auction] Preparations complete, the auction will start soon!");
            return;
        }
        if (this.finished) {
            return;
        }
        if (this.turn == 5 && !this.currentBidder) {
            this.sendToViewers("");
            this.sendToViewers("[Auction] Auction cancelled because no bids have been made!");
            this.sendToViewers("");
            this.finished = true;
            return;
        }

        if (this.turn > 20) {
            if (this.turn === 21) {
                if (this.changed) {
                    this.unbiddedTurns = 0;
                }
                this.unbiddedTurns++;
                if (this.checkWinner()) {
                    return;
                }
                this.sendToViewers("");
                this.sendToViewers("[Auction] No winner after 20 turns! Auction will now proceed to sudden death mode!");
                this.sendToViewers("[Auction] All participants can make one last secret bid. All offers will be revealed simultaneously. Highest offer wins.");
                this.sendToViewers("");
                this.turn++;
                this.suddenDeath = true;
                return;
            }
            if (this.turn === 22) {
                this.turn++;
                this.sendToViewers("");
                this.sendToViewers("[Auction] Please make your final bid if you haven't made it yet!");
                this.sendToViewers("");
                return;
            }
            for (var e in this.suddenDeathOffers) {
                if (this.suddenDeathOffers[e] > this.currentOffer) {
                    this.currentOffer = this.suddenDeathOffers[e];
                    this.currentBidder = e;
                }
            }

            this.finishAuction();
        } else {
            if (this.changed) {
                this.unbiddedTurns = 0;
            }
            if (this.currentBidder) {
                this.unbiddedTurns++;
                if (this.checkWinner()) {
                    return;
                }

                this.sendToViewers("");
                this.sendToViewers("[Auction] Current highest bid is $" + addComma(this.currentOffer) + " by " + this.currentBidder.toCorrectCase() + "!");
                if (this.unbiddedTurns > 0) {
                    this.sendToViewers("[Auction] If no one bids more, " + this.currentBidder.toCorrectCase() + " will win the auction in " + plural(4 - this.unbiddedTurns, "turn") + "!");
                }
                this.sendToViewers("");
            }
            this.changed = false;
        }
        this.turn++;
    };
    Auction.prototype.checkWinner = function() {
        if (this.unbiddedTurns >= 4) {
            this.finishAuction();
            return true;
        }
        return false;
    };
    Auction.prototype.finishAuction = function() {
        this.sendToViewers("");
        this.sendToViewers("[Auction] The auction is finished! " + this.currentBidder.toCorrectCase() + " takes the " + this.productName + " for $" + addComma(this.currentOffer) + "!");
        if (this.suddenDeath && Object.keys(this.suddenDeathOffers).length > 0) {
            var allOffers = [];
            for (var e in this.suddenDeathOffers) {
                if (this.suddenDeathOffers.hasOwnProperty(e)) {
                    allOffers.push(e.toCorrectCase() + " ($" + addComma(this.suddenDeathOffers[e]) + ")");
                }
            }
            this.sendToViewers("[Auction] All offers: " + allOffers.join(", "));
        }

        var host = getAvatarOff(this.host);
        var winner = getAvatarOff(this.currentBidder);

        winner.money -= this.currentOffer;
        host.money += this.currentOffer;

        var input;
        if (this.type == "item") {
            host.balls[this.product] -= 1;
            winner.balls[this.product] += 1;
        } else {
            input = getInputPokemon(this.product);

            safari.removePokemon2(host, input.id);
            winner.pokemon.push(input.id);
        }
        safari.saveGame(host);
        safari.saveGame(winner);

        var id = sys.id(this.host);
        if (id) {
            safaribot.sendMessage(id, "You received $" + addComma(this.currentOffer) + " from " + this.currentBidder.toCorrectCase() + " for your " + this.productName + "!", safchan);
        }
        id = sys.id(this.currentBidder);
        if (id) {
            safaribot.sendMessage(id, "You bought " + an(this.productName) + " from " + this.hostName + " for $" + addComma(this.currentOffer) + "!", safchan);
        }
        this.sendToViewers("");
        this.finished = true;

        sys.appendToFile(auctionLog, now() + "|||" + this.hostName + "::" + 1 + "::" + this.productName + "::" + this.currentOffer + "|||" + this.currentBidder.toCorrectCase() + "\n");
        if (this.type == "poke" && isRare(input.id)) {
            sys.appendToFile(rareTradeLog, now() + "|||" + this.currentBidder.toCorrectCase() + " won " + this.hostName + "'s auction for " + this.productName + " by paying $" + addComma(this.currentOffer) + "\n");
        }
    };
    Auction.prototype.join = function(src) {
        if (!safari.isBelowCap(src, this.product, 1, this.type)) {
            return;
        }

        this.sendToViewers(sys.name(src) + " has joined the auction!");
        this.members.push(sys.name(src).toLowerCase());
        sys.sendMessage(src, "", safchan);
        safaribot.sendHtmlMessage(src, "You joined " + this.hostName + "'s auction for " + an(this.productName) + ". Type <a href='po:setmsg//bid " + (this.currentOffer + this.minBid) + "'>/bid [value]</a> to make your offer, or " + link("/leave") + " to quit the auction.", safchan);
        if (this.currentBidder) {
            safaribot.sendMessage(src, "The current offer is $" + addComma(this.currentOffer) + ". You can only make offers at least $" + addComma(this.minBid) + " higher than the current offer.", safchan);
        } else {
            safaribot.sendMessage(src, "No offer has been made yet, so you can bid the starting offer ($" + addComma(this.currentOffer + this.minBid) + "). Further offers must at least $" + addComma(this.minBid) + " higher than the current one.", safchan);
        }
        sys.sendMessage(src, "", safchan);
    };
    Auction.prototype.leave = function(src) {
        var name = sys.name(src).toLowerCase();
        if (this.host == name) {
            safaribot.sendMessage(src, "You can't leave your own auction!", safchan);
            return;
        }
        if (this.currentBidder == name) {
            safaribot.sendMessage(src, "You can't leave the auction while your bid is the highest one!", safchan);
            return;
        }
        if (this.suddenDeath) {
            safaribot.sendMessage(src, "You can't leave the auction while it's in sudden death mode!", safchan);
            return;
        }

        this.members.splice(this.members.indexOf(name), 1);
        this.sendToViewers(sys.name(src) + " left the auction!");
        safaribot.sendMessage(src, "You left " + this.hostName + "'s auction!", safchan);
    };
    Auction.prototype.removePlayer = function(src) {
        var name = sys.name(src).toLowerCase();
        if (this.isInAuction(name)) {
            if (this.host == name) {
                this.sendToViewers("This auction was cancelled because the host was trade banned!");
                this.finished = true;
            } else {
                if (this.currentBidder == name) {
                    this.sendToViewers("This auction was cancelled because the current highest bidder was trade banned!!");
                    safaribot.sendMessage(sys.id(this.host), "Your auction was cancelled, but you can start a new one immediately!", safchan);
                    this.finished = true;
                    var player = getAvatarOff(this.host);
                    if (player) {
                        player.cooldowns.auction = 0;
                    }
                } else {
                    this.sendToViewers(sys.name(src) + " was removed from the auction!");
                    this.members.splice(this.members.indexOf(name), 1);
                }
            }
        }
    };
    Auction.prototype.makeOffer = function(src, bid) {
        var player = getAvatar(src);
        var id = sys.name(src).toLowerCase();

        if (id == this.host) {
            safaribot.sendMessage(src, "You can't bid in your own auction!", safchan);
            return;
        }
        if (this.turn === 0) {
            safaribot.sendMessage(src, "Please wait a moment before making a bid!", safchan);
            return;
        }

        var offer = toMoney(bid);
        if (isNaN(offer) || offer < 1) {
            safaribot.sendMessage(src, "Please offer a valid value!", safchan);
            return;
        }
        if (offer < this.currentOffer + this.minBid) {
            safaribot.sendMessage(src, "You must offer a minimum of $" + addComma(this.currentOffer + this.minBid) + "!", safchan);
            return;
        }
        if (player.money < offer) {
            safaribot.sendMessage(src, "You do not have $" + addComma(offer) + "!", safchan);
            return;
        }

        if (offer >= this.currentOffer * 6 && (!(id in this.confirmBid) || this.confirmBid[id] != offer)) {
            safaribot.sendMessage(src, "Do you really want to offer $" + addComma(offer) + " or was that a typo? If you really want to offer that, make that bid again!", safchan);
            this.confirmBid[id] = offer;
            return;
        }
        delete this.confirmBid[id];

        if (this.suddenDeath) {
            safaribot.sendMessage(src, "[Auction] You are offering $" + addComma(offer) + " for the " + this.productName + "!", safchan);
            this.suddenDeathOffers[id] = offer;
        } else {
            if (this.currentBidder === id) {
                safaribot.sendMessage(src, "You cannot bid when your offer is the highest one!", safchan);
                return;
            }
            this.sendToViewers("");
            this.sendToViewers("[Auction] " + sys.name(src) + " is offering $" + addComma(offer) + " for the " + this.productName + "!");

            if (id !== this.currentBidder) {
                this.changed = true;
            }
            this.currentBidder = id;
            this.currentOffer = offer;
        }
    };
    Auction.prototype.sendMessage = function(name, msg) {
        var id = sys.id(name);
        if (id) {
            if (msg === "") {
                sys.sendHtmlMessage(id, msg, safchan);
            } else {
                safaribot.sendHtmlMessage(id, msg, safchan);
            }
        }
    };
    Auction.prototype.sendToViewers = function(msg) {
        var e;
        for (e in this.members) {
            this.sendMessage(this.members[e], msg);
        }
        this.sendMessage(this.host, msg);
    };
    Auction.prototype.isInAuction = function(name) {
        return this.host == name.toLowerCase() || this.members.contains(name.toLowerCase());
    };

    /* Trades */
    this.offerTrade = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var reason = "trade";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from trading for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only trade after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        var userName = sys.name(src).toLowerCase();
        if (data.toLowerCase() === "cancel") {
            if (userName in tradeRequests) {
                safaribot.sendMessage(src, "You cancelled your trade request with " + tradeRequests[userName].target.toCorrectCase() + "!", safchan);
                delete tradeRequests[userName];
            } else {
                safaribot.sendMessage(src, "You have no pending trades initiated by you!", safchan);
            }
            return;
        }

        var info = data.split(":");
        if (info.length < 3) {
            safaribot.sendMessage(src, "To trade Pokémon with another player, use /trade [Player]:[Your Offer]:[Your Request].", safchan);
            safaribot.sendHtmlMessage(src, "You can trade a Pokémon (type the name or number), money (type $150) or item (type @master). To trade multiple items, type " + toColor("Pichu,3@honey,$200", "blue") + " in the [Your Offer] or [Your Request] spots.", safchan);
            return;
        }
        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }

        var autoCancel;
        var targetName = info[0].toLowerCase();
        if (userName in tradeRequests) {
            if (tradeRequests[userName].target.toLowerCase() === targetName) {
                safaribot.sendHtmlMessage(src, "You already have a pending trade with this person! To cancel it, type " + link("/trade cancel") + ".", safchan);
                return;
            } else {
                autoCancel = true;
            }
        }

        if (!validPlayers("target", src, info[0].toLowerCase())) {
            return;
        }
        var targetId = sys.id(targetName);
        var target = getAvatar(targetId);
        if (target.tradeban > now() || target.tutorial.inTutorial) {
            safaribot.sendMessage(src, "This person cannot receive trade requests right now!", safchan);
            return;
        }
        if (info[0].toLowerCase() == userName || sys.ip(targetId) === sys.ip(src)) {
            safaribot.sendMessage(src, "You can't trade with yourself!", safchan);
            return;
        }

        var offer = info[1].toLowerCase();
        var request = info[2].toLowerCase();
        
        var offerObj = toStuffObj(offer);
        var requestObj = toStuffObj(request);
        
        var valid = validateStuff(offer);
        if (valid.length > 0) {
            safaribot.sendMessage(src, "The following are not valid Pokémon, item or money: " + readable(valid) + "!", safchan);
            return;
        }
        valid = validateStuff(request);
        if (valid.length > 0) {
            safaribot.sendMessage(src, "The following are not valid Pokémon, item or money: " + readable(valid) + "!", safchan);
            return;
        }

        var offerType = this.isValidTrade(src, offerObj, "offer", requestObj);
        if (!offerType) {
            return;
        }
        var requestType = this.isValidTrade(src, requestObj, "request", offerObj);
        if (!requestType) {
            return;
        }
        if (!this.canTrade(src, offerObj)) {
            return;
        }

        var offerName = translateStuff(offerObj, true);
        var requestName = translateStuff(requestObj, true);
        var offerInput = toStuffInput(offerObj);
        var reqInput = toStuffInput(requestObj);

        if (offerType == "money" && requestType == "money") {
            safaribot.sendMessage(src, "You cannot trade money for money!", safchan);
            return;
        }
        var identical = {};
        for (var i in offerObj) {
            if (requestObj.hasOwnProperty(i)) {
                identical[i] = offerObj[i];
            }
        }
        if (Object.keys(identical).length > 0) {
            var rejected = [];
            identical = toStuffInput(identical).split(",");
            for (i = 0; i < identical.length; i++) {
                rejected.push(translateAsset(identical[i]).name);
            }
            safaribot.sendMessage(src, "You cannot request the same Pokémon/Item/Money that you offer! Please remove " + readable(rejected) + " from the offer or from the request!", safchan);
            return;
        }

        sys.sendMessage(src, "" , safchan);
        sys.sendMessage(targetId, "" , safchan);

        if (autoCancel) {
            safaribot.sendHtmlMessage(src, "You cancelled your trade with " + tradeRequests[userName].target.toCorrectCase() + " to start a new trade with " + targetName.toCorrectCase() + ".", safchan);
            delete tradeRequests[userName];
        }

        safaribot.sendMessage(src, "You are offering " + offerName + " to " + sys.name(targetId) + " for their " + requestName+ "!" , safchan);
        safaribot.sendMessage(targetId, sys.name(src) + " is offering you " + offerName + " for your " + requestName + "!" , safchan);

        if (tradeRequests.hasOwnProperty(targetName) && tradeRequests[targetName].target === userName) {
            var req = tradeRequests[targetName];
            if (objectEquals(offerObj, toStuffObj(req.request)) && objectEquals(requestObj, toStuffObj(req.offer))) {
                if (!this.canTrade(targetId, requestObj)) {
                    safaribot.sendMessage(src, "Trade cancelled because " + sys.name(targetId) + " couldn't fulfill their offer." , safchan);
                    safaribot.sendMessage(targetId, "Trade cancelled because you couldn't fulfill your offer." , safchan);
                    delete tradeRequests[targetName];
                    return;
                }
                if (!this.canReceiveTrade(src, targetId, offerObj, requestObj)) {
                    delete tradeRequests[targetName];
                    return;
                }
                if (!this.canReceiveTrade(targetId, src, requestObj, offerObj)) {
                    delete tradeRequests[targetName];
                    return;
                }
                if ("@battery" in offerObj || "@battery" in requestObj) {
                    this.dailyReward(src, getDay(now()));
                    this.dailyReward(targetId, getDay(now()));
                }
                var hasRare = false;
                
                var inverted1 = {}, inverted2 = {}, asset;
                for (var e in offerObj) {
                    inverted2[e] = -offerObj[e];
                }
                for (e in requestObj) {
                    inverted1[e] = -requestObj[e];
                }
                for (e in inverted1) {
                    if (!(e in offerObj)) {
                        offerObj[e] = 0;
                    }
                    offerObj[e] += inverted1[e];
                }
                for (e in inverted2) {
                    if (!(e in requestObj)) {
                        requestObj[e] = 0;
                    }
                    requestObj[e] += inverted2[e];
                }
                
                var out1 = readable(giveStuff(player, requestObj, true).gained);
                var out2 = readable(giveStuff(target, offerObj, true).gained);
                
                for (e in offerObj) {
                    asset = translateAsset(e);
                    if (asset.type === "item") {
                        this.updateShop(player, e.substr(1));
                    } else if (asset.type === "poke") {
                        if (isRare(asset.id)) {
                            hasRare = true;
                        }
                    }
                }
                for (e in requestObj) {
                    asset = translateAsset(e);
                    if (asset.type === "item") {
                        this.updateShop(target, e.substr(1));
                    } else if (asset.type === "poke") {
                        if (isRare(asset.id)) {
                            hasRare = true;
                        }
                    }
                }
                
                this.saveGame(player);
                this.saveGame(target);

                safaribot.sendMessage(src, "You traded your " + out2 + " for " + sys.name(targetId) + "'s " + out1 + "!", safchan);
                safaribot.sendMessage(targetId, "You traded your " + out1 + " for " + sys.name(src) + "'s " + out2 + "!", safchan);
                sys.sendMessage(src, "" , safchan);
                sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
                sys.appendToFile(tradeLog, now() + "|||" + sys.name(src) + "::" + out2 + "|||" + sys.name(targetId) + "::" + out1 + "\n");
                if (hasRare) {
                    sys.appendToFile(rareTradeLog, now() + "|||" + sys.name(src) + "'s " + out2 + " <--> " + sys.name(targetId) + "'s " + out1 + "\n");
                }
            }
            else {
                var acceptCommand = "/trade " + sys.name(src) + ":" + reqInput + ":" + offerInput;
                safaribot.sendMessage(src, "You sent a counter-offer to " + sys.name(targetId) + "!" , safchan);
                safaribot.sendHtmlMessage(targetId, sys.name(src) + " sent you a counter-offer. To accept it, type " + link(acceptCommand, false, true) + ".", safchan);
                sys.sendMessage(src, "" , safchan);
                sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
                tradeRequests[userName] = { target: targetName, offer: offerInput, request: reqInput };
            }
        }
        else {
            var acceptCommand = "/trade " + sys.name(src) + ":" + reqInput + ":" + offerInput;
            safaribot.sendHtmlMessage(targetId, "To accept the trade, type " + link(acceptCommand, false, true) + ".", safchan);
            sys.sendMessage(src, "" , safchan);
            sys.sendMessage(targetId, "" , safchan);
            tradeRequests[userName] = { target: targetName, offer: offerInput, request: reqInput };
        }
    };
    this.isValidTrade = function(src, stuff, action, traded) {
        var types = [], warns = [], asset, amt, pkValue = 0, pkTraded = [], moneyOffered = (traded.hasOwnProperty("$") ? traded.$ : 0);
        
        for (var e in stuff) {
            asset = e;
            amt = stuff[e];
            if (asset[0] == "$") {
                if (isNaN(amt) || amt <= 0) {
                    warns.push("Please " + action + " a valid amount of money!");
                }
                if (amt > moneyCap) {
                    warns.push("You can't " + action + " more than $" + addComma(moneyCap) + "!");
                }
                types.push("money");
            }
            else if (asset.indexOf("@") !== -1) {
                var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
                if (!itemData[item].tradable) {
                    warns.push(finishName(item) + " cannot be traded!");
                }
                if (isNaN(amt) || amt <= 0) {
                    warns.push("Please " + action + " a valid amount of " + finishName(item) + "!");
                }
                types.push("item");
            }
            else {
                var info = getInputPokemon(asset);
                pkValue += getPrice(info.id, info.shiny) * amt;
                pkTraded.push(plural(amt, info.input));
                types.push("poke");
            }
        }
        if (pkValue > 0 && moneyOffered > 0 && pkValue > moneyOffered) {
            var onlyMoney = true;
            for (e in traded) {
                if (e[0] !== "$") {
                    onlyMoney = false;
                    break;
                }
            }
            
            if (onlyMoney) {
                warns.push(cap(readable(pkTraded)) + " cannot be traded for less than $" + addComma(pkValue) + "!");
            }
        }
        if (warns.length > 0) {
            for (e = 0; e < warns.length; e++) {
                safaribot.sendMessage(src, warns[e], safchan);
            }
            return false;
        }
        var typeFound = types[0];
        for (e = 1; e < types.length; e++) {
            if (types[e] !== typeFound) {
                return "mixed";
            }
        }
        return typeFound;
    };
    this.canTrade = function(src, asset) {
        var player = getAvatar(src);
        var out = hasStuff(player, asset);
        
        if (cantBecause(src, "trade", ["wild", "contest", "auction", "battle", "event", "tutorial", "pyramid"])) {
            return false;
        }
        if (!out.result) {
            safaribot.sendMessage(src, "You don't have " + readable(out.missing) + " to trade!", safchan);
            return false;
        }
        var e, p, info, item, amount, pokeList = [];
        for (e in asset) {
            amount = asset[e];
            if (e[0] === "@") {
                item = itemAlias(e.substr(e.indexOf("@") + 1), true);
                info = itemData[item];
                if (info.tradeReq && player.balls[item] - amount < info.tradeReq) {
                    safaribot.sendMessage(src, "You can't trade " + finishName(item) + " unless you have more than " + info.tradeReq + " of those!", safchan);
                    return false;
                }
            }
            else if (e[0] !== "$") {
                info = getInputPokemon(e);
                if (!canLosePokemon(src, info.input, "trade", false, amount)) {
                    return false;
                }
                for (p = 0; p < amount; p++) {
                    pokeList.push(info.id);
                }
            }
        }
        var canEmptyParty = pokeList.length >= player.party.length,
            partyAmt, boxAmt;
        if (canEmptyParty) {
            for (e = 0; e < pokeList.length; e++) {
                p = pokeList[e];
                
                amount = countRepeated(pokeList, p);
                partyAmt = countRepeated(player.party, p);
                boxAmt = countRepeated(player.pokemon, p);
                
                if (partyAmt === 0 || amount < partyAmt || boxAmt > amount) {
                    canEmptyParty = false;
                    break;
                }
            }
            if (canEmptyParty) {
                safaribot.sendMessage(src, "You cannot trade all the Pokémon from your party!", safchan);
                return false;
            }
        }
        
        return true;
    };
    this.canReceiveTrade = function(src, receiverId, stuff, offer) {
        var receiver = getAvatar(receiverId), asset, amt, e, warns = [], warnsTarget = [], pkReceived = 0, pkGiven = 0;
        
        for (e in stuff) {
            asset = e;
            amt = stuff[e];
            if (asset[0] == "$") {
                if (receiver.money + amt > moneyCap) {
                    warns.push("Trade cancelled because " + sys.name(receiverId) + " can't hold more than $" + moneyCap + "!");
                    warnsTarget.push("Trade cancelled because you can't hold more than $" + moneyCap + " (you currently have $" + receiver.money + ", so you can receive at most $" + (moneyCap - receiver.money) + ")!");
                }
            }
            else if (asset.indexOf("@") !== -1) {
                var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
                if (receiver.balls[item] + amt > getCap(item)) {
                    warns.push("Trade cancelled because " + sys.name(receiverId) + " can't receive " + plural(amt, item) + "!");
                    warnsTarget.push("Trade cancelled because you can't hold more than " + plural(getCap(item), item) + " (you currently have " + receiver.balls[item] + ", so you can receive at most " + (getCap(item) - receiver.balls[item]) + ")!");
                }
            }
            else {
                pkReceived += amt;
            }
        }
        if (pkReceived > 0) {
            for (e in offer) {
                if (e[0] !== "$" && e[0] !== "@") {
                    pkGiven += offer[e];
                }
            }
            
            if (receiver.pokemon.length + pkReceived - pkGiven > receiver.balls.box * itemData.box.bonusRate) {
                warns.push("Trade cancelled because " + sys.name(receiverId) + "'s boxes cannot hold " + pkReceived + " more Pokémon!");
                warnsTarget.push("Trade cancelled because your boxes cannot hold " + (pkReceived - pkGiven) + " more Pokémon!");
            }
        }
        for (e = 0; e < warns.length; e++) {
            safaribot.sendMessage(src, warns[e], safchan);
            safaribot.sendMessage(receiverId, warnsTarget[e], safchan);
        }
        return warns.length === 0;
    };

    /* Quests */
    this.questNPC = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        if (data == "*") {
            var n = now(), quest = getAvatar(src).quests;
            var qs = Object.keys(base64trainers);
            var sprites = [];
            for (var i = 0; i < qs.length; i++) {
                sprites.push('<img src="' + base64trainers[qs[i]] + '">');
            }
            safaribot.sendHtmlMessage(src, "<b>Quests available:</b>" + sprites.join(""), safchan);
            safaribot.sendHtmlMessage(src, "-" + link("/quest collector", "Collector") + " " + (quest.collector.cooldown > n ? "[Available in " + timeLeftString(quest.collector.cooldown) + "]" : (quest.collector.deadline > n ? "[Ends in " + timeLeftString(quest.collector.deadline) + "]" : "[Available]")) + (stopQuests.collector ? " <b>[Disabled]</b>" : ""), safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest scientist", "Scientist") + " " + (scientistQuest.expires > n ? "[Ends in " + timeLeftString(scientistQuest.expires) + "]" : "[Standby]") + (stopQuests.scientist ? " <b>[Disabled]</b>" : ""), safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest arena", "Arena") + " " + (quest.arena.cooldown > n ? "[Available in " + timeLeftString(quest.arena.cooldown) + "]" : "[Available]") + (stopQuests.arena ? " <b>[Disabled]</b>" : ""), safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest wonder", "Wonder Trade") + " " + (quest.wonder.cooldown > n ? "[Available in " + timeLeftString(quest.wonder.cooldown) + "]" : "[Available]") + (stopQuests.wonder ? " <b>[Disabled]</b>" : ""), safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest tower", "Battle Tower") + " " + (quest.tower.cooldown > n ? "[Available in " + timeLeftString(quest.tower.cooldown) + "]" : "[Available]") + (stopQuests.tower ? " <b>[Disabled]</b>" : ""), safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest pyramid", "Pyramid") + " " + (quest.pyramid.cooldown > n ? "[Available in " + timeLeftString(quest.pyramid.cooldown) + "]" : "[Available]") + (stopQuests.pyramid ? " <b>[Disabled]</b>" : ""), safchan);
            //safaribot.sendHtmlMessage(src, "-Pyramid [Closed for renovation]", safchan);
            //safaribot.sendHtmlMessage(src, "-" + link("/quest piramyd", "Piramyd") + " [Available]", safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest alchemist", "Alchemist") + " " + (quest.alchemist.cooldown > n ? "[Available in " + timeLeftString(quest.alchemist.cooldown) + "]" : "[Available]") + (stopQuests.alchemist ? " <b>[Disabled]</b>" : ""), safchan);
            
            safaribot.sendHtmlMessage(src, "-" + link("/quest decor", "Decor") + " " + (quest.decor.cooldown > n ? "[Available in " + timeLeftString(quest.decor.cooldown) + "]" : "[Available]") + (stopQuests.decor ? " <b>[Disabled]</b>" : ""), safchan);
            
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "For more information, type /quest [name] (example: /quest collector).", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        var info = data.split(":");
        var quest = info[0].toLowerCase();
        var args = info.slice(1);
        args = args.length > 0 ?  args : [];

        switch (quest) {
            case "collector":
                this.collectorQuest(src, args);
            break;
            case "scientist":
                this.scientistQuest(src, args);
            break;
            case "arena":
                this.fightArena(src, args);
            break;
            case "wonder":
            case "wondertrade":
            case "wonder trade":
                this.wonderTrade(src, args);
            break;
            case "tower":
            case "battletower":
            case "battle tower":
                this.fightTower(src, args);
            break;
            case "pyramid":
                this.pyramidQuest(src, args);
            break;
            case "piramyd":
                safaribot.sendHtmlMessage(src, "You need ohter 22 palyers to joyn you at Piramyd! Alll of them must be wearing the Yuongster costume and have a Psichyc-type Pokéman in their party!", safchan);
            break;
            case "alchemy":
            case "alchemist":
                this.alchemyQuest(src, args);
            break;
            case "decor":
            case "decoration":
                this.decorationQuest(src, args);
            break;
            default:
                safaribot.sendMessage(src, "This is not a valid quest!", safchan);
        }
    };
    this.collectorQuest = function(src, data) {
        var player = getAvatar(src);
        if (player.tutorial.inTutorial && player.tutorial.step !== 9) {
            if (cantBecause(src, "start a quest", ["tutorial"])) {
                return;
            }
        }
        var quest = player.quests.collector;
        var ongoing = quest.reward > 0;
        var trainerSprite = '<img src="' + base64trainers.collector + '">';

        if (ongoing && now() > quest.deadline && !player.tutorial.inTutorial) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Collector: I'm sorry, but since you took too long to fulfill my request I decided to buy from someone else!", safchan);
            safaribot.sendHtmlMessage(src, "Collector: If you still wish to help me, type " + link("/quest collector:start") + " for a new request!", safchan);
            sys.sendMessage(src, "", safchan);

            quest.reward = 0;
            quest.requests = [];
            quest.cooldown = 0;
            quest.deadline = null;
            this.saveGame(player);
            return;
        }

        if (data.length < 1 || !data[0]) {
            if (ongoing) {
                safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Hello, did you bring the " + readable(quest.requests.map(findLink), "and") + " that I asked for?", safchan);
                if (player.tutorial.inTutorial) {
                    tutorMsg(src, "You can complete the Collector's request with " + link("/quest collector:finish"));
                } else {
                    safaribot.sendHtmlMessage(src, "Collector: If you did, type " + link("/quest collector:finish") + " and I will pay you $" + addComma(quest.reward) + " for those Pokémon, but please bring them in less than " + timeLeftString(quest.deadline) + ".", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: You can also type " + link("/quest collector:abort") + " if you no longer wish to help me.", safchan);
                }
                sys.sendMessage(src, "", safchan);
            } else {
                if (player.tutorial.inTutorial) {
                    tutorMsg(src, "Please start the quest with " + link("/quest collector:start"));
                } else {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Hello, I'm The Collector! I am always willing to pay well for some interesting Pokémon. If you wish to help me, type " + link("/quest collector:help") + ".", safchan);
                    if (quest.cooldown >= now()) {
                        safaribot.sendMessage(src, "Collector: I'm currently organizing my collection, so I won't be making any new request now. Please come back in " + timeLeftString(quest.cooldown) + "!", safchan);
                    }
                }
            }
            return;
        }

        var action = data[0].toLowerCase();

        switch (action) {
            case "information":
            case "info":
            case "help":
                    if (player.tutorial.inTutorial) {
                        tutorMsg(src, "Please start the quest with " + link("/quest collector:start"));
                        return;
                    }
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: I love to collect Pokémon, but I'm not good at catching them. Therefore, I buy them!", safchan);
                    safaribot.sendMessage(src, "Collector: If you want to help me, type /quest collector:start:difficulty, and I will request some Pokémon for you to bring me.", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: Once you have them, type " + link("/quest collector:finish") + ", and I will pay about from 2.4x to 4.8x their normal value. After that, I will need some time to organize my collection, so I won't make any new request until I finish.", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: If you wish to give up on my request, type " + link("/quest collector:abort") + ".", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: To learn more about the difficulty levels, type " + link("/quest collector:difficulty") + ".", safchan);

                    sys.sendMessage(src, "", safchan);
            break;
            case "difficulty":
            case "level":
            case "levels":
                    if (player.tutorial.inTutorial) {
                        tutorMsg(src, "Please start the quest with " + link("/quest collector:start"));
                        return;
                    }
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: My requests are organized into 4 different levels:", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: " + link("/quest collector:start:Easy", "Easy") + " - Three Pokémon with BST between 180 and 320. Reward is 2.4x their price.", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: " + link("/quest collector:start:Normal", "Normal") + " - Four Pokémon with BST between 320 and 460. Reward is 3.3x their price.", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: " + link("/quest collector:start:Hard", "Hard") + " - Five Pokémon with BST between 460 and 599. Reward is 4.8x their price.", safchan);
                    safaribot.sendHtmlMessage(src, "Collector: " + link("/quest collector:start:Epic", "Epic") + " - Six Pokémon with BST between 500 and 720, with one of them being a Legendary. Reward is 10x their price.", safchan);
                    sys.sendMessage(src, "", safchan);
            break;
            case "start":
            case "begin":
                if (player.tutorial.inTutorial) {
                    safari.tutorialQuest(src, true);
                    return;
                }
                if (stopQuests.collector) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Sorry, I am buried in Pokémon right now. Please return at a later point in time!", safchan);
                    return;
                }
                if (ongoing) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Please fulfill my previous request before getting a new one! If you wish to give up this request, type " + link("/quest collector:abort") + ".", safchan);
                    return;
                }
                if (quest.cooldown >= now()) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: I'm sorry, I'm currently organizing my collection. Please come back in " + timeLeftString(quest.cooldown) + "!", safchan);
                    return;
                }
                if (data.length < 2) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Please choose a difficulty (" + link("/quest collector:start:easy", "Easy") + ", " + link("/quest collector:start:normal", "Normal") + ", " + link("/quest collector:start:hard", "Hard") + ", or " + link("/quest collector:start:epic", "Epic") + ") using /quest collector:start:[difficulty]! Type " + link("/quest collector:difficulty") + " to learn more about the different difficulty levels.", safchan);
                    return;
                }
                var diff = data[1].toLowerCase();

                var level = 1;
                switch (diff) {
                    case "easy":
                    case "[easy]":
                        level = 0;
                    break;
                    case "normal":
                    case "[normal]":
                    case "medium":
                        level = 1;
                    break;
                    case "hard":
                    case "[hard]":
                        level = 2;
                    break;
                    case "epic":
                    case "[epic]":
                        level = 3;
                    break;
                    default:
                        safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Please choose a difficulty (" + link("/quest collector:start:easy", "Easy") + ", " + link("/quest collector:start:normal", "Normal") + ", " + link("/quest collector:start:hard", "Hard") + ", or " + link("/quest collector:start:epic", "Epic") + ") using /quest collector:start:[difficulty]!", safchan);
                        return;
                }

                var request = [];
                var difficultBonus = [2.4, 3.3, 4.8, 10][level];
                var minBST = [180, 320, 460, 500][level];
                var maxBST = [320, 460, 599, 720][level];
                var amount = [3, 4, 5, 5][level];
                var deadlineDays = 2;

                while (request.length < amount) {
                    var randomNum = sys.rand(1, 722);
                    var bst = getBST(randomNum);
                    if (!request.contains(randomNum) && bst >= minBST && bst <= maxBST && !isLegendary(randomNum)) {
                        request.push(randomNum);
                    }
                }
                if (level == 3) {
                    var legend = 0;
                    //This kills the Phione
                    while (legend === sys.pokeNum("Phione") || legend === 0) {
                        legend = legendaries.random();
                    }
                    request.push(legend);
                }

                var reward = 0;
                for (e = 0; e < request.length; e++) {
                    reward += getPrice(request[e]);
                }
                var perkBonus = Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
                quest.requests = request;
                quest.reward = Math.round(reward * (difficultBonus + perkBonus));
                quest.deadline = now() + hours(deadlineDays * 24);
                this.saveGame(player);


                var costumed;
                var payout = quest.reward;
                if (player.costume === "pokefan") {
                    payout = Math.floor(payout * costumeData.pokefan.rate);
                    costumed = true;
                }
                safaribot.sendHtmlMessage(src, trainerSprite + "Collector: So you will help me? Great! Then bring me " + readable(request.map(findLink), "and") + ", and I will pay you $" + addComma(payout) + " for them!" + (costumed ? "<i>[Note: Without PokeFan Costume only $" + addComma(quest.reward) + " is paid.]</i>" : ""), safchan);
                safaribot.sendMessage(src, "Collector: But please don't take too long! If you take more than " + (deadlineDays * 24) + " hours, I may buy them from someone else!", safchan);
                sys.sendMessage(src, "", safchan);
            break;
            case "finish":
            case "complete":
                if (player.tutorial.inTutorial) {
                    if (!ongoing) {
                        tutorMsg(src, "Please start the quest with " + link("/quest collector:start"));
                        return;
                    } else {
                        safari.tutorialQuest(src);
                        return;
                    }
                }
                if (!ongoing) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: I don't recall requesting anything from you. Type " + link("/quest collector:help") + " if you wish to help me.", safchan);
                    return;
                }
                if (stopQuests.collector) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Sorry, I am buried in Pokémon right now. Please return at a later point in time!", safchan);
                    return;
                }
                //Tutorial blocked earlier
                if (cantBecause(src, "finish this quest", ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
                    return;
                }

                var e, hasPokemon = true, id, showSprite = true;
                for (e = 0; e < quest.requests.length; e++) {
                    id = quest.requests[e];
                    if (!player.pokemon.contains(id)) {
                        safaribot.sendHtmlMessage(src, (showSprite ? trainerSprite : "") + "Collector: You don't have " + an(sys.pokemon(id)) + "!", safchan);
                        hasPokemon = false;
                        showSprite = false;
                    }
                }
                if (!hasPokemon) {
                    return;
                }
                for (e = 0; e < quest.requests.length; e++) {
                    id = quest.requests[e];
                    if (!canLosePokemon(src, id + "", "give")) {
                        return;
                    }
                }
                if (player.party.length <= quest.requests.length) {
                    var allInParty = true;
                    for (e = 0; e < player.party.length; e++) {
                        if (!quest.requests.contains(player.party[e])) {
                            allInParty = false;
                            break;
                        }
                    }
                    if (allInParty) {
                        safaribot.sendHtmlMessage(src, trainerSprite + "Collector: I can't possibly take these Pokémon while they are in your party!", safchan);
                        return;
                    }
                }
                var payout = quest.reward;
                var costumed;
                if (player.costume === "pokefan") {
                    payout = Math.floor(payout * costumeData.pokefan.rate);
                    costumed = true;
                }
                safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Superb! You brought everything! Here's your payment!", safchan);
                safaribot.sendMessage(src, "You gave your " + readable(quest.requests.map(poke), "and") + " to the Collector and received $" + addComma(payout) + "!", safchan);
                if (costumed) {
                    safaribot.sendMessage(src, "Collector: Enjoy the little extra I threw in for you, buddy! Always a pleasure doing business with a fellow PokéFan.", safchan);
                }

                player.money = Math.min(player.money + payout, moneyCap);
                
                var stole = 1, costumed = player.costume === "rocket", theft = "";
                quest.requests = quest.requests.shuffle(); //Shuffle to make it more random
                for (e = 0; e < quest.requests.length; e++) {
                    if (costumed && chance(costumeData.rocket.rate * stole)) {
                        theft = " but stole the " + poke(quest.requests[e]) + " back";
                        safaribot.sendMessage(src, "You cleverly distract the Collector and while he is not looking, you grab your " + poke(quest.requests[e]) + " back and run off!", safchan);
                        player.records.pokesStolen += 1;
                        stole /= 3;
                        continue;
                    }
                    this.removePokemon(src, quest.requests[e]);
                }
                sys.sendMessage(src, "", safchan);
                this.logLostCommand(sys.name(src), "quest collector:" + data.join(":"), "gave " + readable(quest.requests.map(poke), "and") + theft);
                player.records.collectorEarnings += payout;
                player.records.collectorGiven += quest.requests.length;
                this.addToMonthlyLeaderboards(player.id, "collectorEarnings", payout);
                quest.reward = 0;
                quest.requests = [];
                quest.cooldown = now() + hours(3);
                quest.deadline = 0;
                this.saveGame(player);
            break;
            case "abort":
            case "cancel":
            case "giveup":
            case "give up":
                if (player.tutorial.inTutorial) {
                    if (!ongoing) {
                        tutorMsg(src, "Please start the quest with " + link("/quest collector:start"));
                        return;
                    } else {
                        tutorMsg(src, "You cannot abort the tutorial quest. Finish it instead with " + link("/quest collector:finish"));
                        return;
                    }
                }
                if (!ongoing) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Collector: You can't abort a quest even before you start it! Type " + link("/quest collector:help") + " if you wish to help me.", safchan);
                    return;
                }
                safaribot.sendHtmlMessage(src, trainerSprite + "Collector: Oh, you don't want to help me anymore? It's a shame, but I understand. Come back later if you change your mind!", safchan);
                quest.reward = 0;
                quest.requests = [];
                quest.cooldown = now() + hours(1);
                quest.deadline = null;
                this.saveGame(player);
            break;
            default:
                safaribot.sendHtmlMessage(src, trainerSprite + "Collector: I don't think I can help you with that. But if you wish to help me, type " + link("/quest collector:help") + "!", safchan);
        }
    };
    this.scientistQuest = function(src, data) {
        var player = getAvatar(src);
        if (cantBecause(src, "start a quest", ["tutorial"])) {
            return;
        }
        var quest = scientistQuest;
        var id = quest.pokemon;
        var trainerSprite = '<img src="' + base64trainers.scientist + '">';
        if (now() > quest.expires || stopQuests.scientist) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: I'm going to present my research results in a convention. Please come back later!", safchan);
            return;
        }
        if (player.quests.scientist.cooldown >= now() && player.quests.scientist.pokemon == id) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: That " + poke(id) + " that you brought earlier is really helping me! Come back in " + timeLeftString(quest.expires) + " to check my next research!", safchan);
            return;
        }

        if (!data[0]) {
            //Feel free to change these messages and the ones below if you get a better idea
            var typeResearch = {
                "Normal": "{0}'s genealogy",
                "Fighting": "how many martial arts a {0} can learn",
                "Flying": "{0}'s flying patterns",
                "Poison": "a possible cure for a {0}'s venom",
                "Ground": "how deep a {0} can dig into the earth",
                "Rock": "how a {0} moves if they are made of rocks",
                "Bug": "how a group of {0} work together in a colony",
                "Ghost": "if and how a {0} can move into the ethereal world",
                "Steel": "if {0}'s body is similar to industrial steel",
                "Fire": "{0}'s maximum body temperature",
                "Water": "how much percent of {0}'s body is composed of water",
                "Grass": "how the photosynthesis process works for {0}",
                "Electric": "how many houses a {0} could provide energy to",
                "Psychic": "if a {0} can read an human's mind",
                "Ice": "{0}'s minimum body temperature",
                "Dragon": "how tough a {0}'s fang is",
                "Dark": "if a {0} becomes stronger during the night",
                "Fairy": "if a {0} has magical powers"
            };
            var type = sys.type(sys.pokeType1(id));
            var researching = typeResearch[type].format(link("/find " + poke(id), poke(id)));
            type = sys.type(sys.pokeType2(id));
            type = type === "???" ? sys.type(sys.pokeType1(id)) : sys.type(sys.pokeType2(id));

            typeResearch = {
                "Normal": "if they can be domesticated",
                "Fighting": "how strong they are when compared to humans",
                "Flying": "how fast they can fly",
                "Poison": "which parts of their body is poisonous",
                "Ground": "their ability to level the ground",
                "Rock": "how many different minerals can be found in their body",
                "Bug": "in which environments they can camouflage themselves better",
                "Ghost": "if they can possess an human",
                "Steel": "what they eat since they are made of steel",
                "Fire": "how able they are to adapt to colder environments",
                "Water": "how deep they can dive into the sea",
                "Grass": "in which season they grow faster",
                "Electric": "if there's any side effect to storing electricity in their body",
                "Psychic": "how far they can exert their psychic powers",
                "Ice": "how able they are to adapt to warmer environments",
                "Dragon": "their expected lifespan",
                "Dark": "how smart they are",
                "Fairy": "if their charm spells can affect humans"
            };
            researching += " and " + typeResearch[type];

            safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: Hello, my friend! I'm currently researching " + researching + ", so I would appreciate if you could bring one to me. If you do, I shall reward you with " + plural(quest.reward, "silver") + "!", safchan);
            safaribot.sendHtmlMessage(src, "Scientist: I expect to finish this research in about " + timeLeftString(quest.expires) + ". If you want to help me, bring them until then and type " + link("/quest scientist:finish", null, true) + ".", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (data[0].toLowerCase() === "finish") {
            if (!player.pokemon.contains(id)) {
                safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: You don't have " + an(sys.pokemon(id)) + "!", safchan);
                return;
            }
            if (!canLosePokemon(src, id + "", "give")) {
                return;
            }
            //Tutorial blocked earlier
            if (cantBecause(src, "finish this quest", ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
                return;
            }

            if (player.balls.silver + quest.reward > getCap("silver")) {
                safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: I see you brought the Pokémon, but you are currently unable to carry any more Silver Coin! Come back after spending some of them!", safchan);
                return;
            }

            safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: Oh, you brought the " + poke(id) + "! Here, have your " + plural(quest.reward, "silver") + "!", safchan);
            safaribot.sendMessage(src, "You gave your " + poke(id) + " to the Scientist and received " + plural(quest.reward, "silver") + "!", safchan);

            player.records.scientistEarnings += quest.reward;
            player.records.scientistGiven += 1;

            player.quests.scientist.cooldown = quest.expires;
            player.quests.scientist.pokemon = id;
            
            player.balls.silver += quest.reward;
            var theft = "";
            if (player.costume === "rocket" && chance(costumeData.rocket.rate * 2)) {
                safaribot.sendMessage(src, "You cleverly distract the Scientist and while he is not looking, you grab your " + poke(id) + " back and run off!", safchan);
                player.records.pokesStolen += 1;
                theft = " but stole it back";
            } else {
                this.removePokemon(src, id);
            }
            
            sys.sendMessage(src, "", safchan);
            this.logLostCommand(sys.name(src), "quest scientist:" + data.join(":"), "gave " + poke(id) + theft);
            this.saveGame(player);
        } else {
            safaribot.sendHtmlMessage(src, trainerSprite + "Scientist: I don't think I can help you with that.", safchan);
        }
    };
    this.changeScientistQuest = function(data) {
        var randomNum, bst;

        if (data) {
            randomNum = getInputPokemon(data).num;
            bst = getBST(randomNum);
        }
        if (!randomNum) {
            do {
                randomNum = sys.rand(1, 722);
                bst = getBST(randomNum);

            } while (bst > 600 || isLegendary(randomNum));
        }
        
        var bstRange = [ 180, 211, 251, 301, 351, 391, 431, 481, 511, 525, 536, 581 ], ind;
        var rewRange = [   1,   2,   3,   4,   5,   6,   7,   8,  11,  14,  18,  24 ];
        for (ind = bstRange.length - 1; ind >= 0; ind--) {
            if (bst >= bstRange[ind]) {
                break;
            }
        }

        var reward = rewRange[ind];
        scientistQuest = {
            pokemon: randomNum,
            reward: reward,
            expires: now() + hours(3) - 3 * 60 * 1000
        };
        permObj.add("scientistQuest", JSON.stringify(scientistQuest));
    };
    this.fightArena = function(src, data) {
        var player = getAvatar(src);
        var reason = "start a battle";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        var trainerSprite = '<img src="' + base64trainers.arena + '">';
        if (data.length === 0) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Arena Clerk: You want a battle? Then type /quest arena:name to pick who you want to fight!", safchan);
            safaribot.sendHtmlMessage(src, "Arena Clerk: You need to pay an entry fee and get some " + es(finishName("silver")) + " if you win! Type " + link("/quest arena:help") + "! for more details!", safchan);
            if (player.quests.arena.cooldown >= now()) {
                safaribot.sendMessage(src, "Arena Clerk: There's currently a long queue of people fighting in the Arena, so it may need to wait " + timeLeftString(player.quests.arena.cooldown) + " to try a challenge!", safchan);
            }
            sys.sendMessage(src, "", safchan);
            return;
        }
        var postBattle = function(name, isWinner, playerScore, npcScore, args) {
            var player = getAvatarOff(name);
            var id = sys.id(name);
            sys.sendMessage(id, "", safchan);
            if (isWinner) {
                var amt = args.rewardAmt;
                if (!args.noRecords) {
                    player.records.arenaWon += 1;
                    player.records.arenaPoints += amt;
                    safari.addToMonthlyLeaderboards(player.id, "arenaPoints", amt);
                }
                safaribot.sendHtmlMessage(id, "<b>" + args.name + ":</b> Wow, I didn't expect to lose! Good job, here's your reward!", safchan);
                var rew = args.reward || "silver";

                if (amt !== 0) {
                    safaribot.sendMessage(id, "You received " + plural(amt, rew) + "!", safchan);
                    rewardCapCheck(player, rew, amt, true);
                }
                if (args.moneyReward) {
                    safaribot.sendMessage(id, "You received $" + addComma(args.moneyReward) + "!", safchan);
                    player.money += args.moneyReward;
                    if (player.money > moneyCap) {
                        player.money = moneyCap;
                    }
                }
            } else {
                if (!args.noRecords) {
                    player.records.arenaLost += 1;
                }
                if (args.taunt && now() > player.cooldowns.nubTaunt) {
                    sys.sendAll("", safchan);
                    safaribot.sendHtmlAll("<b><font color=tomato>LOLOLOL! " + name.toCorrectCase() + " lost a battle against Trainer Nub! You should make fun of them with " + link("/rock " + name.toCorrectCase()) + "!</font></b>", safchan);
                    sys.sendAll("", safchan);
                    player.cooldowns.nubTaunt = now() + hours(24);
                }
                safaribot.sendHtmlMessage(id, "<b>" + args.name + ":</b> Haha, seems like I won this time! Try harder next time!", safchan);
            }
            player.quests.arena.cooldown = now() + hours(args.cooldown);
            safari.saveGame(player);
        };
        var price = {
            nub: 0,
            pink: 100,
            mustard: 200,
            cyan: 300,
            crimson: 500,
            rainbow: 1000,
            copycat: 400
        };
        var copycat = {
            name: "Trainer " + sys.name(src),
            party: [],
            power: [10, 100],
            postArgs: {
                reward: "dust",
                rewardAmt: 40,
                cooldown: 1.2,
                noRecords: true
            },
            desc: "Arena NPC"
        };

        var opt = data[0].toLowerCase();
        if (opt === "help") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Arena Clerk: Challenge our trainers for a chance to receive some " + es(finishName("silver")) + "! The trainers available are: ", safchan);
            for (var n in arenaOpponents) {
                var opp = arenaOpponents[n];
                safaribot.sendHtmlMessage(src, "-" + link("/quest arena:" + cap(n), cap(n)) + ": Entry Fee: $" + addComma(price[n])  + ". Reward: " + (opp.postArgs.rewardAmt !== 0 ? plural(opp.postArgs.rewardAmt, (opp.postArgs.reward || "silver")) : "") + (opp.postArgs.moneyReward ? "$" + addComma(opp.postArgs.moneyReward) : "") + ". Cooldown: " + utilities.getTimeString(opp.postArgs.cooldown * 60 * 60) + ". ", safchan);
            }
            safaribot.sendHtmlMessage(src, "-" + link("/quest arena:" + sys.name(src), sys.name(src)) + ": Entry Fee: $" + addComma(price.copycat)  + ". Reward: " + plural(copycat.postArgs.rewardAmt, copycat.postArgs.reward) + ". Cooldown: " + utilities.getTimeString(1.2 * 60 * 60) + ". ", safchan);
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Arena Clerk: Once you decide on your challenge, type /quest arena:[name] (e.g.: /quest arena:yellow).", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        if (player.quests.arena.cooldown >= now()) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Arena Clerk: There's a long queue of people fighting in the Arena! Please come after " + timeLeftString(player.quests.arena.cooldown) + " to try another challenge!", safchan);
            return;
        }
        if (stopQuests.arena) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Arena Clerk: Sorry, we need to clean out the stadium before we can host more battles. Please return at a later point in time!", safchan);
            return;
        }
        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }
        if (contestCooldown <= 35) {
            safaribot.sendHtmlMessage(src, trainerSprite + "You cannot battle right before a contest is about to start!", safchan);
            return;
        }

        var npc = arenaOpponents[opt];
        if (!npc) {
            if (opt === sys.name(src).toLowerCase()) {
                npc = copycat;
                npc.party = player.party.concat();
                opt = "copycat";
            } else {
                safaribot.sendMessage(src, "There's no one with that name around here!", safchan);
                return;
            }
        }

        var cost = price[opt];
        if (player.money < cost) {
            safaribot.sendMessage(src, "You need to pay $" + addComma(cost) + " for this challenge, but you only have $" + addComma(player.money) + "!", safchan);
            return;
        }

        if (player.party.length < 6) {
            safaribot.sendMessage(src, "Your party must have 6 Pokémon for this challenge!", safchan);
            return;
        }
        npc = JSON.parse(JSON.stringify(npc));
        npc.postBattle = postBattle;
        var rep = false, count = 0, list = player.party.map(function(x) { var arr = [sys.type(sys.pokeType1(x)), sys.type(sys.pokeType2(x))].sort(); return arr.join("|"); });
        for (var e = 0; e < 6; e++) {
            count = countRepeated(list, list[e]);
            if (count > 3) {
                rep = player.party[e];
                break;
            }
        }
        if (rep) {
            var oppTeam = npc.party.concat().shuffle(), result = [], rest = [], t1 = sys.type(sys.pokeType1(rep)), t2 = sys.type(sys.pokeType2(rep)), p1, p2;
            for (e = 0; e < oppTeam.length; e++) {
                p1 = sys.type(sys.pokeType1(oppTeam[e]));
                p2 = sys.type(sys.pokeType2(oppTeam[e]));
                if (result.length < count && this.checkEffective(p1, p2, t1, t2) >= this.checkEffective(t1, t2, p1, p2)) {
                    result.push(oppTeam[e]);
                } else {
                    rest.push(oppTeam[e]);
                }
            }
            rest = rest.shuffle();
            while (result.length < 6) {
                result.push(rest.shift());
            }
            npc.party = result;
        }
        
        npc.postArgs.name = npc.name;
        player.money -= cost;
        this.saveGame(player);

        safaribot.sendHtmlMessage(src, trainerSprite + "Arena Clerk: I see you paid the $" + addComma(cost) + " Entry Fee, so you can now proceed to your challenge against " + npc.name + "!", safchan);
        var battle = new Battle(src, npc);
        currentBattles.push(battle);
    };
    this.fightTower = function(src, data) {
        var player = getAvatar(src);
        var reason = "start a battle";
        if (cantBecause(src, reason, ["tutorial"])) {
            return;
        }
        var cost = costumeData.ninja.thresh || 499;
        for (var i = 0; i < player.party.length; i++) {
            cost = Math.max(cost, getBST(player.party[i]));
        }
        var trainerSprite = '<img src="' + base64trainers.tower + '">';
        if (data.length === 0) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Tower Clerk: Welcome to the Battle Tower, a place where you can face successive battles until you lose! Type " + link("/quest tower:help") + " for more information!", safchan);
            safaribot.sendHtmlMessage(src, "Tower Clerk: To enter the Tower, you must pay a cost based on your strongest Pokémon's BST (currently $" + cost + ") and have a party of 6 Pokémon (currently " + player.party.length + "), then type " + link("/quest tower:start") + "! Be careful though, you may miss a contest during this challenge!", safchan);
            if (player.quests.tower.cooldown >= now()) {
                safaribot.sendMessage(src, "Tower Clerk: Our trainers are still restoring their Pokémon from the last challenge, so please wait " + timeLeftString(player.quests.tower.cooldown) + " to try again!", safchan);
            }
            sys.sendMessage(src, "", safchan);
            return;
        }
        var opt = data[0].toLowerCase();
        if (opt === "help") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Tower Clerk: In this challenge, you must battle successive trainers in a row with no time to change your party between each round, until you are defeated!", safchan);
            safaribot.sendMessage(src, "Tower Clerk: You receive prizes such as Balls, Candy Dusts, Silver Coins and others according to your progress! Try to win lots of rounds for better rewards!", safchan);
            safaribot.sendMessage(src, "Tower Clerk: Be careful though, once you start the challenge you can't stop until you lose, so you may miss contests or important spawns!", safchan);
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Tower Clerk: If you are ready to challenge the Battle Tower, type /quest tower:start.", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        if (player.quests.tower.cooldown >= now()) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Tower Clerk: You want to challenge the Battle Tower again already? Please take a rest while our trainers are preparing their teams, you will be able to challenge again in " + timeLeftString(player.quests.tower.cooldown) + "!", safchan);
            return;
        }
        if (cantBecause(src, reason, ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }
        if (opt !== "start") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Tower Clerk: If you are ready to challenge the Battle Tower, type /quest tower:start. If you need more information, type /quest tower:help.", safchan);
            return;
        }
        if (stopQuests.tower) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Tower Clerk: Sorry, our Trainers are taking a short lunch break. Please return at a later point in time!", safchan);
            return;
        }
        
        if (player.party.length < 6) {
            safaribot.sendMessage(src, "Your party must have 6 Pokémon for this challenge!", safchan);
            return;
        }
        if (hasPokeInShop(src)) {
            return;
        }

        if (player.money < cost) {
            safaribot.sendMessage(src, "You need to pay $" + addComma(cost) + " to enter the Tower, but you only have $" + addComma(player.money) + "!", safchan);
            return;
        }
        player.money -= cost;
        this.saveGame(player);

        var skip = false;
        var postBattle = function(name, isWinner, playerScore, npcScore, args, viewers) {
            var player = getAvatarOff(name);
            var id = sys.id(name);
            if (isWinner) {
                skip = false;
                if (player.costume === "ninja" && chance(costumeData.ninja.rate)) {
                    skip = true;
                }
                var ac = args.count + skip;
                var npc = {
                    name: "Trainer " + generateName(),
                    party: generateTeam(6, null, null, null, chance(Math.min(0.02 * ac, 0.42)) ? Object.keys(effectiveness).random() : null),
                    power: [10 + Math.floor(args.count/2), 100 + ac],
                    postBattle: postBattle,
                    postArgs: {
                        count: ac + 1,
                        reward: args.reward
                    },
                    desc: "Tower Lvl. " + (ac + 1)
                };
                var mod, rew, amt, loop, c, times = 1 + skip,
                    specialPrizes = {
                        "4": "gem",
                        "8": "rare",
                        "15": "master"
                    };
                for (var i = 0; i < times; i++) {
                    //We calculate the level they are on first, then go back and grab the reward from previous floor
                    c = args.count - i;
                    mod = c % 6;
                    loop = Math.floor(c / 6) + 1;
                    switch (mod) {
                        case 0:
                            if ((loop % 16) in specialPrizes) {
                                rew = specialPrizes[loop%16];
                                amt = 1;
                            } else {
                                rew = "silver";
                                amt = 1;
                            }
                        break;
                        case 1:
                            rew = "bait";
                            amt = Math.floor(loop * 1.5);
                        break;
                        case 2:
                            rew = "dust";
                            amt = loop * 10;
                        break;
                        case 3:
                            rew = "money";
                            amt = loop * 30;
                        break;
                        case 4:
                            rew = "gacha";
                            amt = Math.floor(loop * 1.5);
                        break;
                        case 5:
                            rew = ["myth", "luxury", "quick", "heavy", "clone"].random();
                            amt = Math.floor(loop * 1.25);
                        break;
                    }
                    if (!npc.postArgs.reward.hasOwnProperty(rew)) {
                        npc.postArgs.reward[rew] = 0;
                    }
                    npc.postArgs.reward[rew] += amt;
                }
                
                sys.sendMessage(id, "", safchan);
                safaribot.sendMessage(id, "Tower Clerk: Good job! You have defeated " + plural(args.count, "trainer") + " so far! Now for the next battle!", safchan);
                if (skip) {
                    safaribot.sendMessage(id, "You carefully time your movements as you head up to the next floor. You dash for the stairs to skip battling, but not before mocking the unaware Trainer!", safchan);
                }
                for (var e = 0; e < viewers.length; e++) {
                    if (viewers[e] !== name.toLowerCase()) {
                        safaribot.sendMessage(sys.id(viewers[e]), "Tower Clerk: " + name + " has defeated " + plural(args.count, "trainer") + " so far!", safchan);
                        if (skip) {
                            safaribot.sendMessage(sys.id(viewers[e]), "You notice " + name + " sneak around on the next floor and dash for the stairs without being noticed. Impressed by their ability, you remain quiet so they don't get caught.", safchan);
                        }
                    }
                }
                if (id && getAvatar(id)) {
                    var battle = new Battle(id, npc);
                    for (e = 0; e < viewers.length; e++) {
                        if (!battle.viewers.contains(viewers[e])) {
                            battle.viewers.push(viewers[e]);
                        }
                    }
                    if (!viewers.contains(name.toLowerCase())) {
                        battle.viewers.splice(battle.viewers.indexOf(name.toLowerCase()), 1);
                    }
                    currentBattles.push(battle);
                } else {
                    player.quests.tower.cooldown = now() + hours(0.5);
                    safari.saveGame(player);
                    for (e = 0; e < viewers.length; e++) {
                        safaribot.sendMessage(sys.id(viewers[e]), "Tower Clerk: The challenge was cancelled because " + name + " is nowhere to be found for their next match!", safchan);
                    }
                }
            } else {
                var count = args.count - 1 - skip, updatelb = false;
                if (count > player.records.towerHighest) {
                    player.records.towerHighest = count;
                    if (leaderboards.towerHighest.length === 0 || count > leaderboards.towerHighest[0].value) {
                        safaribot.sendHtmlAll("<b>" + name.toCorrectCase() + " has defeated " + plural(count, "trainer") + " at the Battle Tower and set a new record!</b>", safchan);
                        updatelb = true;
                    }
                }
                var traveledCount = count;
                var h = 3;
                var penalty = player.quests.tower.bonusPower !== 0; //could edit player value to a negative number mid-tower to act as a kill switch in order to complete a run
                if (traveledCount === 0) {
                    h = 0.5;
                } else if (traveledCount <= 3) {
                    h = 1;
                } else if (traveledCount <= 6) {
                    h = 1.5;
                } else if (traveledCount <= 10) {
                    h = 2;
                }
                player.quests.tower.cooldown = now() + hours(h + penalty);

                var rewardText = [];
                for (var r in args.reward) {
                    if (r == "money") {
                        rewardText.push("$" + args.reward[r]);
                    } else {
                        rewardText.push(args.reward[r] + "x " + finishName(r));
                    }
                }
                if (id) {
                    var team = " Your Team: " + (player.costume !== "none" ? " [" + costumeAlias(player.costume, true, true) + " costume] " : "") + readable(player.party.map(poke));
                    if (count === 0) {
                        safaribot.sendHtmlMessage(id, trainerSprite + "Tower Clerk: Too bad, " + name + "! You couldn't defeat any trainer!", safchan);
                    } else if (count < 5) {
                        safaribot.sendHtmlMessage(id, trainerSprite + "Tower Clerk: Game over, " + name + "! You defeated " + count + " trainer" + (count == 1 ? "" : "s") + "!" + team, safchan);
                    } else if (count < 20) {
                        safaribot.sendHtmlMessage(id, trainerSprite + "Tower Clerk: Good job, " + name + "! You defeated " + count + " trainers!" + team, safchan);
                    } else if (count < 50) {
                        safaribot.sendHtmlMessage(id, trainerSprite + "Tower Clerk: Amazing, " + name + "! You defeated " + count + " trainers! Congratulations!" + team, safchan);
                    } else {
                        safaribot.sendHtmlMessage(id, trainerSprite + "Tower Clerk: OH MY GOD, " + name + "! You defeated " + count + " trainers! That was superb!" + team, safchan);
                    }
                    if (skip) {
                        safaribot.sendHtmlMessage(id, trainerSprite + "Tower Clerk: Hey wait a minute! You didn't defeat the previous Trainer so I can't count it in your performance assessment.", safchan);
                    }
                    if (rewardText.length > 0) {
                        safaribot.sendMessage(id, "Tower Clerk: For your performance in the Battle Tower challenge, we reward you with " + readable(rewardText, "and") + "!", safchan);
                    }
                }
                for (r in args.reward) {
                    if (r == "money") {
                        player.money += args.reward[r];
                        if (player.money > moneyCap) {
                            player.money = moneyCap;
                        }
                    } else {
                        rewardCapCheck(player, r, args.reward[r], true);
                    }
                }
                for (var e = 0; e < viewers.length; e++) {
                    if (viewers[e] !== name.toLowerCase()) {
                        safaribot.sendMessage(sys.id(viewers[e]), "Tower Clerk: " + name + " has defeated " + count + " trainers!", safchan);
                    }
                }

                if (!player.costumes.contains("ninja") && count >= costumeData.ninja.acqReq && player.costume !== "battle") {
                    var noAcq;
                    for (var i = 0; i < player.party.length; i++) {
                        if (getBST(player.party[i]) > costumeData.ninja.thresh) {
                            noAcq = true;
                            break;
                        }
                    }
                    if (!noAcq) {
                        player.costumes.push("ninja");
                        safaribot.sendHtmlMessage(src, "<b>Received the following costume:</b> " + costumeData.ninja.fullName + ".", safchan);
                        player.ninjaParty = player.party.concat();
                    }
                }

                if (penalty) {
                    safaribot.sendMessage(src, "Due to the intense sweetness of the " + finishName("cherry") + ", you will be unable to challenge Tower for longer than normal due the resulting sugar crash!", safchan);
                    player.quests.tower.bonusPower = 0;
                }
                safari.saveGame(player);
                if (updatelb) {
                    safari.updateLeaderboards();
                }
            }
        };
        var npc = {
            name: "Trainer " + generateName(),
            party: generateTeam(),
            power: [10, 100],
            postBattle: postBattle,
            postArgs: {
                count: 1,
                reward: {}
            },
            desc: "Tower Lvl. 1"
        };

        safaribot.sendHtmlMessage(src, trainerSprite + "Tower Clerk: You have a party with 6 Pokémon and paid the $" + addComma(cost) + " Entry Fee, therefore you are allowed to enter that door and start your Battle Tower challenge!", safchan);

        var battle = new Battle(src, npc);
        currentBattles.push(battle);
    };
    this.wonderTrade = function(src, data) {
        var player = getAvatar(src);
        var quest = player.quests.wonder;
        var trainerSprite = '<img src="' + base64trainers.wonder + '">';

        if (!data[0]) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: Welcome to Wonder Trade, a place where you can trade a Pokémon you own for a random one!", safchan);
            safaribot.sendHtmlMessage(src, "Wonder Trade Operator: Use /quest wonder:[Pokémon] to choose a Pokémon to trade. If you wish to know how our system works, type " + link("/quest wonder:help") + "!", safchan);
            if (quest.cooldown > now()) {
                safaribot.sendMessage(src, "Wonder Trade Operator: Due to the rules imposed by the Pokémon Association, we cannot allow another trade in less than " + timeLeftString(quest.cooldown) + "!", safchan);
            }
            sys.sendMessage(src, "", safchan);
            return;
        }

        var opt = data[0].toLowerCase();
        if (opt == "help") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: To get a trade here you simply choose one of your Pokémon, pay a small fee and then you will receive a random Pokémon immediately!", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: The fee is based on your Pokémon's BST, and you will receive a Pokémon within the same BST range.", safchan);
            safaribot.sendHtmlMessage(src, "Wonder Trade Operator: The available BST ranges are " + link("/find bst 180 249", "180~249") + " ($50 fee), " + link("/find bst 250 319", "250~319") + " ($100), " + link("/find bst 320 389", "320~389") + " ($150), " + link("/find bst 390 459", "390~459") + " ($300), " + link("/find bst 460 529", "460~529") + " ($500) and " + link("/find bst 530 599", "530~599") + " ($750).", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: Also be aware that you CANNOT receive legendaries from Wonder Trade!", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (quest.cooldown > now()) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: Due to the rules imposed by the Pokémon Association, we cannot allow another trade in less than " + timeLeftString(quest.cooldown) + "!", safchan);
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only trade after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        if (data.length < 1) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: Please use /quest wonder:[Pokémon] to choose the Pokémon you wish to trade. You can also type " + link("/quest wonder:help") + " for more information.", safchan);
            return;
        }

        var input = getInputPokemon(data[0]);
        if (!input.num) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: That's not a valid Pokémon!", safchan);
            return;
        }

        var id = input.id;
        var bst = getBST(id);

        if (bst >= 600) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: I'm terribly sorry, but we don't accept Pokémon with a BST of 600 or more in the Wonder Trade!", safchan);
            return;
        }
        if (isMega(id)) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: I'm terribly sorry, but we don't accept Mega Pokémon in the Wonder Trade!", safchan);
            return;
        }
        if (!player.pokemon.contains(id)) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: You don't have " + an(sys.pokemon(id)) + "!", safchan);
            return;
        }
        if (stopQuests.wonder) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: Sorry, we are having problems with our communication and trading devices, they will be fixed shortly. Please return at a later point in time!", safchan);
            return;
        }

        var rangeIndex = Math.floor((bst - 180)/70);
        var bstRange = [[180,249], [250,319], [320,389], [390,459], [460,529], [530,599]][rangeIndex];
        var fee = [50, 100, 150, 300, 500, 750][rangeIndex];
        var cooldown = [0.5, 0.75, 1, 1.33, 1.66, 2][rangeIndex];

        if (data.length < 2 || data[1].toLowerCase() !== "confirm") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: " + input.name + "'s BST is in the " + bstRange.join("~") + " range, so your fee will be $" + addComma(fee) + "!", safchan);
            safaribot.sendHtmlMessage(src, "Wonder Trade Operator: If you are sure you want to proceed, type " + link("/quest wonder:" + input.input + ":confirm") + " and you will receive a Pokémon in the same range!", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't finish this quest during a contest.", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You can't finish this quest while there's a wild Pokémon around.", safchan);
            return;
        }
        if (player.money < fee) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: You don't have $" + addComma(fee) + "!", safchan);
            return;
        }
        if (!canLosePokemon(src, input.input + "", "trade")) {
            return;
        }
        safaribot.sendHtmlMessage(src, trainerSprite + "Wonder Trade Operator: So you want to try the Wonder Trade? Please give me the $" + addComma(fee) + " and your " + input.name + "!", safchan);

        var receivedId, receivedBST, isShiny = sys.rand(0, shinyChance) < (input.shiny ? 16 : 1);
        do {
            receivedId = sys.rand(1, 722);
            receivedBST = getBST(receivedId);
        } while (receivedBST < bstRange[0] || receivedBST > bstRange[1] || isLegendary(receivedId) || receivedId == input.num);
        
        if (receivedId in wildForms && chance(0.5)) {
            var pickedForm = sys.rand(1, wildForms[receivedId] + 1);
            receivedId = pokeInfo.calcForme(receivedId, pickedForm);
        }
        receivedId = isShiny ? receivedId + "" : receivedId;

        safaribot.sendMessage(src, "Wonder Trade Operator: Please wait a moment while we process the trade...", safchan);
        this.removePokemon(src, id);
        player.pokemon.push(receivedId);
        player.money -= fee;
        player.records.wonderTrades += 1;

        quest.cooldown = now() + hours(cooldown);
        this.saveGame(player);
        safaribot.sendMessage(src, "Wonder Trade Operator: The trade was finished successfully! You traded your " + input.name + " and received " + an(poke(receivedId)) + "!", safchan);
        sys.sendMessage(src, "", safchan);
        this.logLostCommand(sys.name(src), "quest wonder:" + data.join(":"), "received " + poke(receivedId));
        if (isRare(receivedId)) {
            sys.appendToFile(mythLog, now() + "|||" + poke(receivedId) + "::wonder traded::" + sys.name(src) + "\n");
        }
    };
    this.pyramidQuest = function(src, data) {
        var player = getAvatar(src);
        if (cantBecause(src, "start a quest", ["tutorial"])) {
            return;
        }
        var quest = player.quests.pyramid,
            cost = 5000,
            action,
            trainerSprite = '<img src="' + base64trainers.pyramid + '">';

        if (pyramidRequests.hasOwnProperty(player.id) && now() > pyramidRequests[player.id].deadline) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Pyramid Guide: You prepared for Pyramid quest before, but couldn't start it before deadline! Please use " + link("/quest pyramid:start:Name1:Name2", null, true) + " to start it again!", safchan);
            delete pyramidRequests[player.id];
        }
        if (data.length < 1 || !data[0]) {
            action = "*";
        } else {
            action = data[0].toLowerCase();
        }

        switch (action) {
            case "start":
                var name = sys.name(src);
                if (player.records.pokesCaught < 4) {
                    safaribot.sendMessage(src, "You can only enter the Pyramid after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
                    return;
                }
                if (quest.cooldown > now()) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Pyramid Guide: You need to wait " + timeLeftString(quest.cooldown) + " before starting another Pyramid quest (you can join someone else's meanwhile)!", safchan);
                    return;
                }
                if (player.money < cost) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Pyramid Guide: You need $" + addComma(cost) + " to enter the Pyramid!", safchan);
                    return;
                }
                if (stopQuests.pyramid) {
                    safaribot.sendHtmlMessage(src, trainerSprite + "Pyramid Guide: Sorry, it seems the Pharaoh's Curse is preventing access to the Pyramid right now. Please return at a later point in time!", safchan);
                    return;
                }
                if (cantBecause(src, "start a Pyramid quest", ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
                    return;
                }
                if (pyramidRequests.hasOwnProperty(player.id)) {
                    var invited = Object.keys(pyramidRequests[player.id].invites).map(function(x) { return x.toCorrectCase(); });
                    safaribot.sendMessage(src, "You already have invited " + readable(invited, "and") + " to join you in the pyramid quest! Please wait for them to accept your invitation!", safchan);
                    return;
                }
                if (player.party.length < 3) {
                    safaribot.sendMessage(src, "You need to have a party of 3 Pokémon to enter the Pyramid!", safchan);
                    return;
                }
                if (data.length < 3) {
                    safaribot.sendHtmlMessage(src, "You need to invite two other players to join you in the Pyramid! Use " + link("/quest pyramid:start:Name1:Name2", null, true) + ".", safchan);
                    return;
                }
                var n1 = data[1].toLowerCase().trim();
                var n2 = data[2].toLowerCase().trim();
                var id1 = sys.id(n1);
                var id2 = sys.id(n2);
                var p1 = getAvatar(id1);
                var p2 = getAvatar(id2);
                
                if (!p1) {
                    safaribot.sendMessage(src, "There's no player with the name '" + data[1] + "' around to join you in the Pyramid!", safchan);
                    return;
                }
                if (!p2) {
                    safaribot.sendMessage(src, "There's no player with the name '" + data[2] + "' around to join you in the Pyramid!", safchan);
                    return;
                }
                if (n1 == player.id || n2 == player.id) {
                    safaribot.sendMessage(src, "You cannot invite yourself to the Pyramid!", safchan);
                    return;
                }
                if (n1 === n2) {
                    safaribot.sendMessage(src, "You cannot invite the same person twice!", safchan);
                    return;
                }
                safaribot.sendMessage(src, "You invited " + n1.toCorrectCase() + " and " + n2.toCorrectCase() + " to join you in the Pyramid!", safchan);
                safaribot.sendMessage(src, "The quest will start if they accept your invitation within 1 minute!", safchan);
                
                safaribot.sendHtmlMessage(id1, name + " is inviting you and " + n2.toCorrectCase() + " to join their party in the Pyramid quest! To accept it, type " + link("/quest pyramid:join:"+name) + " within the next minute!", safchan);
                safaribot.sendHtmlMessage(id2, name + " is inviting you and " + n1.toCorrectCase() + " to join their party in the Pyramid quest! To accept it, type " + link("/quest pyramid:join:"+name) + " within the next minute!", safchan);
                
                pyramidRequests[player.id] = {
                    invites: {},
                    deadline: now() + 60*1000
                };
                pyramidRequests[player.id].invites[n1] = false;
                pyramidRequests[player.id].invites[n2] = false;
            break;
            case "join":
                if (player.records.pokesCaught < 4) {
                    safaribot.sendMessage(src, "You can only enter the Pyramid after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
                    return;
                }
                if (cantBecause(src, "join a Pyramid quest", ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
                    return;
                }
                var invites = [];
                for (var e in pyramidRequests) {
                    if(pyramidRequests.hasOwnProperty(e) && pyramidRequests[e].invites.hasOwnProperty(player.id)) {
                        invites.push(e);
                    }
                }
                if (data.length < 2) {
                    safaribot.sendMessage(src, "Please specify whose Pyramid's Party you are joining! Use /quest pyramid:join:Name for that!", safchan);
                    if (invites.length > 0) {
                        safaribot.sendHtmlMessage(src, "You have pending invites from the following players: " + invites.map(function(x){ return link("/quest pyramid:join:" + x, x.toCorrectCase()); }), safchan);
                    }
                    return;
                }
                if (pyramidRequests.hasOwnProperty(player.id)) {
                    safaribot.sendMessage(src, "You can't accept an invitation to the Pyramid because you are already preparing to start your own Pyramid quest!", safchan);
                    return;
                }
                for (e in pyramidRequests) {
                    if (pyramidRequests[e].invites[player.id] && now() <= pyramidRequests[e].deadline) {
                        safaribot.sendMessage(src, "You already accepted an invitation to a Pyramid quest!", safchan);
                        return;
                    }
                }
                var leader = data[1].toLowerCase();
                if (!pyramidRequests.hasOwnProperty(leader)) {
                    safaribot.sendMessage(src, "You didn't receive any invitation from " + leader.toCorrectCase() + "!", safchan);
                    return;
                }
                var req = pyramidRequests[leader];
                if (!req.invites.hasOwnProperty(player.id)) {
                    safaribot.sendMessage(src, "You didn't receive any invitation from " + leader.toCorrectCase() + "!", safchan);
                    return;
                }
                if (player.party.length < 3) {
                    safaribot.sendMessage(src, "You need to have a party of 3 Pokémon to enter the Pyramid!", safchan);
                    return;
                }
                req.invites[player.id] = true;
                if (now() > req.deadline) {
                    var party = [leader];
                    for (e in req.invites) {
                        if (req.invites[e] === true) {
                            party.push(e);
                        }
                    }
                    for (e = 0; e < party.length; e++) {
                        safaribot.sendMessage(sys.id(party[e]), "Pyramid Quest cancelled because the party took too long to organize themselves!", safchan);
                    }
                    delete pyramidRequests[leader];
                    return;
                }
                
                var isReady = true;
                for (e in req.invites) {
                    if (req.invites[e] === false) {
                        isReady = false;
                        break;
                    }
                }
                
                safaribot.sendMessage(src, "You joined " + leader.toCorrectCase() + " on their Pyramid quest!", safchan);
                safaribot.sendMessage(sys.id(leader), sys.name(src) + " accepted your invitation to the Pyramid quest!", safchan);
                
                if (isReady) {
                    var players = [leader].concat(Object.keys(req.invites));
                    var unavailable = [], n, p;
                    for (e = 0; e < players.length; e++) {
                        n = players[e];
                        if (!sys.id(n)) {
                            unavailable.push(n + " couldn't be found");
                            continue;
                        }
                        p = getAvatar(sys.id(n));
                        if (!p) {
                            unavailable.push(n + " couldn't be found");
                            continue;
                        }
                        if (p.party.length < 3) {
                            unavailable.push(n + "'s party has less than 3 Pokémon");
                        }
                        if (this.isBattling(n) || this.isInAuction(n) || (currentEvent && currentEvent.isInEvent(n))) {
                            unavailable.push(n + " is already participating in another activity");
                        }
                        for (var p in currentPyramids) {
                            if (currentPyramids[p].isInPyramid(n)) {
                                unavailable.push(n + " is already participating in a Pyramid quest");
                            }
                        }
                        if (n == leader && p.money < cost) {
                            unavailable.push(n + " doesn't have $" + addComma(cost) + " for the entry fee");
                        }
                    }
                    if (unavailable.length > 0) {
                        for (e = players.length-1; e--;) {
                            safaribot.sendMessage(sys.id(players[e]), "Pyramid Quest couldn't be started due to the following reasons: " + unavailable.join(", "), safchan);
                        }
                        return;
                    }
                    var leaderPlayer = getAvatarOff(leader);
                    leaderPlayer.money -= cost;
                    this.saveGame(leaderPlayer);
                    
                    players = players.map(getAvatarOff);
                    currentPyramids.push(new Pyramid(players[0], players[1], players[2]));
                    
                    delete pyramidRequests[leader];
                }
            break;
            case "information":
            case "info":
            case "help":
                safaribot.sendHtmlMessage(src, trainerSprite + "Pyramid Guide: In the Pyramid, your goal is to form a party with 2 other players to clear all the seven floors before the leader's stamina drops to 0!", safchan);
                safaribot.sendMessage(src, "Pyramid Guide: Each player can only bring 3 Pokémon in their party. If you bring more than that, only the first 3 in your party will be used.", safchan);
                safaribot.sendMessage(src, "Pyramid Guide: Once you enter the pyramid, you can use the '/pyr' command to make your choices in each room.", safchan);
                safaribot.sendMessage(src, "Pyramid Guide: To advance, you must pass several challenges in each room. After a certain number of rooms, the leader can choose to go up a level or quit the challenge.", safchan);
                safaribot.sendMessage(src, "Pyramid Guide: Be aware that only the leader pays the entry fee and receives the final reward for the quest, but other players can keep treasures they find during the quest!", safchan);
                sys.sendMessage(src, "", safchan);
            break;
            default:
                safaribot.sendHtmlMessage(src, trainerSprite + "Pyramid Guide: Welcome to the Pyramid, a place for those looking for a thrilling challenge!", safchan);
                safaribot.sendHtmlMessage(src, "Pyramid Guide: To learn more about the Pyramid, type " + link("/quest pyramid:help") + "! To enter the Pyramid, pay $" + addComma(cost) + " and invite 2 other players with " + link("/quest pyramid:start:Name1:Name2", null, true) + " to join you!", safchan);
                sys.sendMessage(src, "", safchan);
        }
    };
    this.alchemyQuest = function(src, data) {
        var player = getAvatar(src);
        if (cantBecause(src, "start a quest", ["tutorial"])) {
            return;
        }
        var trainerSprite = '<img src="' + base64trainers.alchemist + '">';
        if (stopQuests.alchemist) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: Naptime! Zzz... Zzz... (Perhaps you should come back later...)", safchan);
            return;
        }
        var recipes = recipeData;
        var validItems = Object.keys(recipes);
        if (!data[0] || data[0].toLowerCase() === "help") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: Princess Fluffybutt and I can make ya some items if you bring me materials y'see! (Use /quest alchemist:[recipe name] to view the required materials)", safchan);
            safaribot.sendHtmlMessage(src, "Available Recipes: " + validItems.map(function(x) {
                return " " + link("/quest alchemist:" + x, cap(x, true)) + " <small>(CD: " + recipes[x].cooldown + "h)</small>";
            }), safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        
        var item = data[0].toLowerCase();
        if (!validItems.contains(item)) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: That's not sumthin' I can make, ya silly badonkadonk! (To view available recipes use " + link("/quest alchemist:help") + ")", safchan);
            return;
        }
        var rec = recipes[item];
        
        var recipeString = translateStuff(rec.ingredients, true);
        var rewardString = translateStuff(rec.reward, true);
        
        var canMake = true, progress = [], asset, val, req, pokeIng = 0;
        for (var e in rec.ingredients) {
            asset = translateAsset(e);
            if (asset.type == "item") {
                val = player.balls[asset.id];
                req = plural(rec.ingredients[e], asset.input);
            } else if (asset.type == "money") {
                val = player.money;
                req = addComma(rec.ingredients[e]);
            } else {
                val = countRepeated(player.pokemon, asset.id);
                pokeIng += val;
                req = rec.ingredients[e] + " " +  asset.name;
            }
            if (val < rec.ingredients[e]) {
                canMake = false;
            }
            if (asset.type === "money") {
                progress.push("$" + addComma(val) + "/$" + addComma(req));
            } else {
                progress.push(val + "/" + req);
            }
        }
        if (!data[1] || data[1].toLowerCase() !== "finish") {
            safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: See those materials? Bring 'em back here so I can make you some shiny new items! (If you have the required materials you can use " + link("/quest alchemist:" + item + ":finish") + " to create an item)", safchan);
            safaribot.sendHtmlMessage(src, "<b>" + cap(item, true) + "</b> Recipe: " + toColor(recipeString, "red") + " --> " + toColor(rewardString, "blue"), safchan);
            safaribot.sendHtmlMessage(src, "Progress: " + progress.join(", ") + (canMake ? " <b>[Available]</b>" : "") + (rec.immediate ? toColor(" [You can make this recipe even during cooldown]", "DarkGreen") : ""), safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        
        if (cantBecause(src, "finish this quest", ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }
        
        if (!canMake) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: Wait-a-secon'. That ain't enough materials! (Progress: " + progress.join(", ") + ")", safchan);
            return;
        }
        
        if (!rec.immediate && player.quests.alchemist.cooldown >= now()) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: Hey now! We gotsta wait " + timeLeftString(player.quests.alchemist.cooldown) + " to use this magic spell thingy again else it goes POP! KAPOW! BOOMY BOOM BOOM!", safchan);
            return;
        }
        
        for (e in rec.ingredients) {
            asset = translateAsset(e);
            if (asset.type == "poke") {
                if (!canLosePokemon(src, asset.input, "give", false, rec.ingredients[e])) {
                    return;
                }
            }
        }
        
        var cantHold = [], pokeRew = 0, ing;
        for (e in rec.reward) {
            asset = translateAsset(e);
            ing = rec.ingredients[e] || 0;
            if (asset.type == "item") {
                if (player.balls[asset.id] - ing + rec.reward[e] > getCap(asset.id)) {
                    cantHold.push(asset.name);
                }
            } else if (asset.type == "money") {
                if (player.money - ing + rec.reward[e] > moneyCap) {
                    cantHold.push("money");
                }
            } else {
                pokeRew += rec.reward[e];
            }
        }
        if (pokeRew > 0 && player.pokemon.length - pokeIng + pokeRew > player.balls.box * itemData.box.bonusRate) {
            cantHold.push("Pokémon");
        }
        if (cantHold.length > 0) {
            safaribot.sendHtmlMessage(src, trainerSprite + readable(cantHold) + " mus' be your favoritest thing" + (cantHold.length > 1 ? "s" : "") + " or sumthin' cuz you are already full of " + (cantHold.length > 1 ? "those" : "that") + "!", safchan);
            return;
        }
        
        safaribot.sendHtmlMessage(src, trainerSprite + "Alchemist: Yo yo yo yo yo. Less blow stuff up Princess Fluffybutt!", safchan);
        if (chance(recipes[item].failChance)) {
            var failUses = {};
            for (var e in rec.failUses) {
                failUses[e] = -rec.failUses[e];
            }
            var out = giveStuff(player, failUses, true);
            safaribot.sendMessage(src, "A bright circle appears in the room. The room starts to smell like burnt marshmallows as you notice your ingredients ignite! You quickly douse the flames to prevent the whole place from burning down.", safchan);
            if (out.lost.length > 0) {
                safaribot.sendMessage(src, "As the smoke clears you realize that your " + readable(out.lost) + " were burnt to a crisp!", safchan);
            }
            player.quests.alchemist.cooldown = now() + hours(0.25); //about 15 minutes
        } else {
            var ingUsed = {};
            for (var e in rec.ingredients) {
                ingUsed[e] = -rec.ingredients[e];
            }
            giveStuff(player, ingUsed, true);
            var rew = giveStuff(player, rec.reward, true);
            safaribot.sendMessage(src, "A bright circle appears in the room. The room starts to fill with a sparkling mist but it quickly disappates to reveal " + readable(rew.gained) + ".", safchan);
            safaribot.sendMessage(src, "You received " + readable(rew.gained) + ".", safchan);
            player.records.transmutationsMade += recipes[item].transmutation || 0;
            player.quests.alchemist.cooldown = now() + hours(recipes[item].cooldown);
        }
        this.saveGame(player);
    };
    this.decorationQuest = function(src, data) {
        var player = getAvatar(src);
        if (cantBecause(src, "start a quest", ["tutorial"])) {
            return;
        }
        var trainerSprite = '<img src="' + base64trainers.decor + '">';
        if (stopQuests.decor) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Home Designer: I'm sorry but we are closed right now to revamp our stock for the next season!", safchan);
            return;
        }
        
        var moneyCost = 50000, silverCost = 50;
        if (!data[0] || !["buy", "coupon"].contains(data[0].toLowerCase())) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Home Designer: Your face screams \"I need to decorate my home\", so you came to the right place! By paying $" + addComma(moneyCost) + " and " + plural(silverCost, "silver") + " you will receive some random but beautiful decoration for your Secret base!", safchan);
            safaribot.sendHtmlMessage(src, "If I piqued your interest, then you can type " + link("/quest decor:buy") + " to receive your new item right now! If you have a " + finishName("coupon") + ", you can trade it for a free decoration by typing " + link("/quest decor:coupon") + "!", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        
        if (cantBecause(src, "finish this quest", ["wild", "contest", "auction", "battle", "event", "pyramid"])) {
            return;
        }
        
        var payment = data[0].toLowerCase();
        if (payment === "buy") {
            if (player.money < moneyCost || player.balls.silver < silverCost) {
                safaribot.sendHtmlMessage(src, trainerSprite + "Home Designer: Wait a moment! Our goods are top quality stuff, so we cannot sell you anything for less than $" + addComma(moneyCost) + " and " + plural(silverCost, "silver") + "! Please come again when you have those!", safchan);
                return;
            }
        } else if (payment === "coupon") {
            if (player.balls.coupon < 1) {
                safaribot.sendHtmlMessage(src, trainerSprite + "Home Designer: Excuse me, but whatever you have in your hands is not a valid " + finishName("coupon") + "!", safchan);
                return;
            }
        }
        
        if (player.quests.decor.cooldown >= now()) {
            safaribot.sendHtmlMessage(src, trainerSprite + "Home Designer: We are currently renewing our stock, please come back in " + timeLeftString(player.quests.decor.cooldown) + " to check our new goods!", safchan);
            return;
        }
        
        var paymsg = "";
        if (payment === "buy") {
            player.money -= moneyCost;
            player.balls.silver -= silverCost;
            paymsg = "You paid $" + addComma(moneyCost) + " and " + plural(silverCost, "silver") + " and received {0}!";
        } else {
            player.balls.coupon -= 1;
            paymsg = "You gave your " + finishName("coupon") + " and received {0}!";
        }
        var out = randomSampleObj(decorations, true);
        if (!player.decorations.hasOwnProperty(out)) {
            player.decorations[out] = 0;
        }
        player.decorations[out] += 1;
        
        var decoName = decorationAlias(out, false, true);
        safaribot.sendHtmlMessage(src, trainerSprite + "Home Designer: So you made up your mind? Good, you can now proudly declare that you are newest owner of a brand new " + decoName + "!", safchan);
        safaribot.sendMessage(src, paymsg.format(an(decoName)), safchan);
        printDecoration(src, out);
        player.quests.decor.cooldown = now() + hours(payment == "buy" ? 3 : 1);
        this.saveGame(player);
    };
    function generateName() {
        var part1 = sys.rand(1, 722), part2, name2, out,
            name1 = sys.pokemon(part1);

        do {
            part2 = sys.rand(1, 722);
            name2 = sys.pokemon(part2);

            out = name1.substr(0, Math.floor(name1.length/2)) + name2.substr(Math.floor(name2.length/2));
        } while (part2 == part1 || (/asshole|dick|pussy|bitch|porn|nigga|cock|gay|slut|whore|cunt|penis|vagina|nigger|fuck|dildo|anus|boner|tits|condom|rape/gi.test(out)) || sys.pokeNum(out));

        return out;
    }
    function generateTeam(size, minBST, maxBST, maxLegends, useType, onlyEvolved) {
        var out = [], p, legendCount = 0, bst;
        size = size || 6;
        maxLegends = maxLegends || 1;

        while (out.length < size) {
            p = sys.rand(1, 722);
            bst = getBST(p);
            
            if (minBST && bst < minBST) {
                continue;
            } else if (maxBST && bst > maxBST) {
                continue;
            }
            if (onlyEvolved && p in evolutions) {
                continue;
            }

            if (useType && out.length < 3) {
                if (!hasType(p, useType)) {
                    continue;
                }
            }
            if (out.contains(p)) {
                continue;
            }
            if (isLegendary(p)) {
                if (legendCount >= maxLegends) {
                    continue;
                }
                legendCount++;
            }
            out.push(p);
        }
        return out;
    }

    /* Pyramid */
    function Pyramid(p1, p2, p3) {
        this.finished = false;
        
        this.leader = p1.id;
        this.players = [p1, p2, p3];
        this.names = [p1.id, p2.id, p3.id];
        this.fullNames = this.names.map(function(x) { return x.toCorrectCase(); });
        this.viewers = [p1.id, p2.id, p3.id];
        
        this.level = 1;
        this.room = 0;
        this.currentRoom = null;
        this.points = 0;
        this.ticks = 0;
        this.turn = -1;
        this.turnToAdvance = 1;
        this.movingRoom = false;
        this.movingFloor = false;
        this.quitWarning = false;
        this.finishMode = null;
        
        this.stamina = {};
        this.stamina[p1.id] = 300 + Math.floor(300 * p1.quests.pyramid.bonusStamina);
        this.stamina[p2.id] = 300 + Math.floor(300 * p2.quests.pyramid.bonusStamina);
        this.stamina[p3.id] = 300 + Math.floor(300 * p3.quests.pyramid.bonusStamina);
        
        p1.quests.pyramid.bonusStamina = 0;
        p2.quests.pyramid.bonusStamina = 0;
        p3.quests.pyramid.bonusStamina = 0;
        safari.saveGame(p1);
        safari.saveGame(p2);
        safari.saveGame(p3);
        
        this.maxStamina = {};
        this.maxStamina[p1.id] = this.stamina[p1.id];
        this.maxStamina[p2.id] = this.stamina[p2.id];
        this.maxStamina[p3.id] = this.stamina[p3.id];
        
        this.parties = {};
        this.parties[p1.id] = p1.party.slice(0, 3);
        this.parties[p2.id] = p2.party.slice(0, 3);
        this.parties[p3.id] = p3.party.slice(0, 3);
        
        this.sendToViewers("");
        this.sendToViewers(readable(this.fullNames, "and") + " are entering the Pyramid!");
        this.sendToViewers("");
    }
    Pyramid.prototype.nextTurn = function() {
        this.ticks++;
        if (this.ticks % 6 !== 0) {
            if (this.ticks % 3 === 0) {
                if (!(this.movingRoom || this.turn < 1) || this.movingFloor) {
                    return;
                }
            } else {
                return;
            }
        }
        this.turn++;
        if (this.turn === 0) {
            this.sendToViewers("The Pyramid challenge is starting! Preparing to enter the first room!");
            return;
        }
        if (this.quitWarning) {
            this.sendToViewers("");
            this.sendToViewers("The party leader (" + this.leader.toCorrectCase() + ") can finish this Pyramid quest by typing " + link("/pyr quit") + ", or keep going by waiting a few seconds.");
            this.sendToViewers("");
            this.quitWarning = false;
        }
        else if (this.movingRoom) {
            if (this.movingFloor) {
                this.level++;
                this.room = 0;
            }
            this.sendToViewers("");
            this.sendToViewers("You are now moving towards the room {0}-{1}!".format(this.level, (this.room+1)));
            this.sendToViewers("");
            this.movingRoom = false;
            this.movingFloor = false;
        }
        else if (this.currentRoom === null) {
            var type = randomSample({
                horde: 11,
                riddle: 12,
                hazard: 13,
                blocked: 13,
                trainer: 13,
                defense: 13,
                empty: 6,
                strong: 13
            });
            this.room++;
            switch (type) {
                case "horde":
                    this.currentRoom = new HordeRoom(this, this.level, this.room);
                break;
                case "strong":
                    this.currentRoom = new StrongRoom(this, this.level, this.room);
                break;
                case "riddle":
                    this.currentRoom = new RiddleRoom(this, this.level, this.room);
                break;
                case "hazard":
                    this.currentRoom = new HazardRoom(this, this.level, this.room);
                break;
                case "blocked":
                    this.currentRoom = new BlockedRoom(this, this.level, this.room);
                break;
                case "trainer":
                    this.currentRoom = new TrainerRoom(this, this.level, this.room);
                break;
                case "defense":
                    this.currentRoom = new DefenseRoom(this, this.level, this.room);
                break;
                case "empty":
                    this.currentRoom = new EmptyRoom(this, this.level, this.room);
                break;
            }
            this.currentRoom.turnToAdvance = this.turn + 2;
        }
        else {
            if (this.turn < this.currentRoom.turnToAdvance) {
                this.currentRoom.midturn();
            } else {
                if (!this.currentRoom.earlyFinish) {
                    this.currentRoom.advance();
                }
                if (!this.hasStamina()) {
                    this.finishMode = "stamina";
                    this.finish();
                } else if (this.currentRoom.passed) {
                    var early = this.currentRoom.earlyFinish;
                    this.currentRoom = null;
                    this.movingRoom = true;
                    if (this.room >= 7) {
                        if (this.level >= 7) {
                            this.finishMode = "cleared";
                            this.finish();
                        } else {
                            var stmBonus = {};
                            for (var s in this.stamina) {
                                if (this.stamina[s] > 0) {
                                    stmBonus[s] = Math.ceil(this.stamina[s] * (0.03 + this.level * 0.0095));
                                    if (this.stamina[s] + stmBonus[s] > this.maxStamina[s]) {
                                        stmBonus[s] = this.maxStamina[s] - this.stamina[s];
                                    }
                                }
                            }
                            var staminaStr = [];
                            for (s in stmBonus) {
                                if (this.stamina[s] <= 0) {
                                    continue;
                                }
                                staminaStr.push(s.toCorrectCase() + " +" + stmBonus[s]);
                            }
                            
                            this.sendToViewers("You cleared the level " + this.level + "! Stamina restored: " + staminaStr.join(", "));
                            this.updateStatus(0, stmBonus);
                            this.sendMessage(this.leader, "You can go up one floor or quit the Pyramid now. To leave now, type " + link("/pyr quit") + ". To keep going, just wait a few seconds!");
                            this.sendToViewers("");
                            this.movingFloor = true;
                            this.quitWarning = true;
                        }
                    } else if (early) {
                        this.nextTurn();
                    }
                }
            }
        }
    };
    Pyramid.prototype.hasStamina = function() {
        if (this.stamina[this.leader] <= 0) {
            this.sendToViewers("");
            this.sendToViewers("Party leader " + this.leader.toCorrectCase() + "'s stamina dropped to 0! This Pyramid quest is now over!");
            return false;
        }
        for (var e in this.stamina) {
            if (this.stamina[e] > 0) {
                return true;
            }
        }
        
        this.sendToViewers("");
        this.sendToViewers("Everyone's stamina dropped to 0! This Pyramid quest is now over!");
        return false;
    };
    Pyramid.prototype.updateStatus = function(points, stamina, showChange) {
        if (points) {
            this.points += points;
        }
        if (stamina) {
            for (var e in stamina) {
                this.stamina[e] += stamina[e];
                if (this.stamina[e] < 0) {
                    this.stamina[e] = 0;
                }
            }
        }
        var stm = this.stamina;
        if (showChange) {
            var staminaStr = [];
            for (var n in stamina) {
                staminaStr.push(n.toCorrectCase() + " " + (stamina[n] >= 0 ? "+" + stamina[n] : stamina[n]));
            }
            if (points !== 0 || staminaStr.length > 0) {
                this.sendToViewers("Points gained: " + points + (staminaStr.length > 0 ? " | Stamina lost: " +  staminaStr.join(", ") : ""));
            }
        }
        this.sendToViewers("Points: " + this.points + " | Stamina: " + this.names.map(function(x){ return x.toCorrectCase() + " (" + stm[x] + ")"; }).join(", "));
    };
    Pyramid.prototype.useCommand = function(src, commandData) {
        if (this.currentRoom) {
            this.currentRoom.useCommand(src, commandData);
        }
        else if (this.movingFloor && sys.name(src).toLowerCase() === this.leader && ["quit", "leave", "exist", "abort", "give up"].contains(commandData)) { //Leader can abort quest between floors
            this.sendToViewers(this.leader.toCorrectCase() + " decided to finish this Pyramid quest!");
            this.finishMode = "quit";
            this.finish();
        }
    };
    Pyramid.prototype.finish = function() {
        var stmBonus = 0;
        for (var m in this.stamina) {
            stmBonus += this.stamina[m];
        }
        if (this.finishMode === "cleared") {
            sys.sendAll("", safchan);
        } else {
            this.sendToViewers("");
        }
        stmBonus = Math.round(stmBonus * (this.level/7));
        if (stmBonus > 0) {
            this.points += stmBonus;
            this.sendToViewers("You received a bonus " + plural(stmBonus, "Point") + " from your remaining stamina!");
        }
        if (this.finishMode === "cleared") {
            var finishBonus = Math.round(this.points * 0.10);
            this.points += finishBonus;
            this.sendToViewers("You received a bonus " + plural(finishBonus, "Point") + " for clearing all floors!");
            safaribot.sendAll(readable(this.fullNames, "and") + " reached the " + getOrdinal(this.room) + " room of the " + getOrdinal(this.level) + " floor with a total of " + plural(this.points, "Point") + "!", safchan);
        } else {
            this.sendToViewers(readable(this.fullNames, "and") + " reached the " + getOrdinal(this.room) + " room of the " + getOrdinal(this.level) + " floor with a total of " + plural(this.points, "Point") + "!");
        }
        switch (this.finishMode) {
            case "quit":
                this.sendToViewers("This Pyramid run was finished because the leader decided to leave!");
            break;
            case "stamina":
                this.sendToViewers("This Pyramid run was finished because the leader's stamina dropped to 0!");
            break;
            case "cleared":
                this.sendToViewers("This Pyramid run was finished because the challengers cleared all floors!");
            break;
        }
        this.sendToViewers("Team: " + this.fullNames.map(function(x) { return x + " (" + this.parties[x.toLowerCase()].map(poke).join(", ") + ")"; }, this).join(", "));
        
        var p = this.points, reward = null, amt = 1;
        if (p >= 15000) {
            reward = "bright";
            amt = 5;
        } else if (p >= 13000) {
            reward = "bright";
            amt = 3;
        } else if (p >= 11000) {
            reward = "bright";
            amt = 2;
        } else if (p >= 9000) {
            reward = "bright";
        } else if (p >= 8000) {
            reward = "mega";
        } else if (p >= 7000) {
            reward = "rare";
        } else if (p >= 6000) {
            reward = "pack";
        } else if (p >= 5000) {
            reward = "egg";
        } else if (p >= 3000) {
            reward = "nugget";
        } else if (p >= 1500) {
            reward = ["quick", "heavy", "clone", "premier"].random();
            amt = this.level * 3;
        } else if (this.finishMode === "cleared"){
            reward = "gem";
            amt = 2;
        } else {
            reward = "gacha";
            amt = this.level * 2;
        }
        
        var e, name, player;
        for (e = 0; e < this.names.length; e++) {
            name = this.names[e];
            player = getAvatarOff(name);
            if (name === this.leader) {
                player.quests.pyramid.cooldown = now() + 45*60*1000;
                if (this.points > player.records.pyramidLeaderScore) {
                    player.records.pyramidLeaderScore = this.points;
                }
                if (this.finishMode === "cleared") {
                    player.records.pyramidLeaderClears += 1;
                }
                if (reward) {
                    this.sendToViewers("Party leader " + name.toCorrectCase() + " received " + plural(amt, reward) + " for their performance at Pyramid!");
                    rewardCapCheck(player, reward, amt);
                }
            } else {
                if (player.quests.pyramid.cooldown < now()) {
                    player.quests.pyramid.cooldown = now() + 15*60*1000;
                }
                if (this.points > player.records.pyramidHelperScore) {
                    player.records.pyramidHelperScore = this.points;
                }
                if (this.finishMode === "cleared") {
                    player.records.pyramidHelperClears += 1;
                }
            }
            player.records.pyramidTotalScore += this.points;
            safari.saveGame(player);
        }
        
        if (this.finishMode === "cleared") {
            sys.sendAll("", safchan);
        } else {
            this.sendToViewers("");
        }
        this.finished = true;
        checkUpdate();
    };
    Pyramid.prototype.sendMessage = function(name, msg, flashing, colored) {
        var id = sys.id(name);
        if (id) {
            if (msg === "") {
                sys.sendHtmlMessage(id, msg, safchan);
            } else {
                if (flashing) {
                    safaribot.sendHtmlMessage(id, toFlashing(msg, name), safchan);
                } else if (colored) {
                    safaribot.sendHtmlMessage(id, toColored(msg, name), safchan);
                } else {
                    safaribot.sendHtmlMessage(id, msg, safchan);
                }
            }
        }
    };
    Pyramid.prototype.sendToViewers = function(msg, flashing, colored) {
        var e;
        var list = removeDuplicates(this.viewers);
        for (e = 0 ; e < list.length; e++) {
            this.sendMessage(list[e], msg, flashing, colored);
        }
    };
    Pyramid.prototype.isInPyramid = function(name) {
        return this.stamina.hasOwnProperty(name.toLowerCase()) && this.stamina[name.toLowerCase()] > 0;
    };
    function pyrLink(x) {
        return link("/pyr " + poke(x));
    }
    function getTreasure(id, reward) {
        var player = getAvatarOff(id);
        if (player) {
            if (reward.item === "money") {
                player.money += reward.amount;
                player.records.pyramidMoney += reward.amount;
            } else {
                rewardCapCheck(player, reward.item, reward.amount);
                if (reward.item == "silver") {
                    player.records.pyramidSilver += reward.amount;
                }
            }
            safari.saveGame(player);
        }
    }
    function treasureName(reward) {
        if (reward.item === "money") {
            return "$" + addComma(reward.amount);
        } else {
            return plural(reward.amount, reward.item);
        }
    }
    
    function PyramidRoom(pyramidRef) {
        this.pyr = pyramidRef;
        this.passed = false;
        this.choices = {};
        this.midmsg = "Make your choice, you have 8 seconds!";
        this.individualmsg = {};
        this.defaultToFirstPoke = true;
        this.turnToAdvance = 0;
    }
    PyramidRoom.prototype.midturn = function() {
        this.sendToAlive(this.midmsg);
        this.sendIndividuals();
    };
    PyramidRoom.prototype.sendIndividuals = function() {
        for (var n in this.individualmsg) {
            if (this.pyr.stamina[n] > 0) {
                this.send(n, this.individualmsg[n]);
            }
        }
    };
    PyramidRoom.prototype.useCommand = function(src, commandData) {
        var player = getAvatar(src);
        
        if (this.validInput && !this.validInput(player.id, commandData)) {
            return;
        }
        this.choices[player.id] = commandData;
        if (this.postInput && this.postInput(src, commandData)) {
            return;
        }
        this.sendAll(toColor("{0} is going to use {1}!".format(player.id.toCorrectCase(), commandData), "crimson"));
    };
    PyramidRoom.prototype.pokeInParty = function(id, commandData) {
        var p = getInputPokemon(commandData);
        if (!p.num) {
            this.send(id, "Please type a valid Pokémon!");
            return false;
        }
        if (!this.pyr.parties[id].contains(p.id)) {
            this.send(id, "You didn't bring this Pokémon in your Pyramid party!");
            return false;
        }
        return true;
    };
    PyramidRoom.prototype.getChoices = function() {
        var out = {}, p, id, members = this.pyr.names;
        for (p in members) {
            id = members[p];
            if (this.pyr.stamina[id] <= 0) {
                continue;
            }
            if (id in this.choices) {
                var pkmn = getInputPokemon(this.choices[id]);
                if (pkmn.num) {
                    out[id] = pkmn.id;
                } else {
                    out[id] = this.choices[id];
                }
            } else {
                if (this.defaultLeaderChoice && id === this.pyr.leader) {
                    out[id] = this.defaultLeaderChoice;
                } else if (this.defaultChoice) {
                    out[id] = this.defaultChoice;
                } else if (this.defaultToFirstPoke) {
                    out[id] = this.pyr.parties[id][0];
                }
            }
        }
        
        return out;
    };
    PyramidRoom.prototype.send = function(name, msg, flashing, colored) {
        var id = sys.id(name);
        if (id) {
            if (msg === "") {
                sys.sendHtmlMessage(id, msg, safchan);
            } else {
                if (flashing) {
                    safaribot.sendHtmlMessage(id, toFlashing(msg, name), safchan);
                } else if (colored) {
                    safaribot.sendHtmlMessage(id, toColored(msg, name), safchan);
                } else {
                    safaribot.sendHtmlMessage(id, msg, safchan);
                }
            }
        }
    };
    PyramidRoom.prototype.sendAll = function(msg, flashing, colored) {
        var e;
        var list = removeDuplicates(this.pyr.viewers);
        for (e = 0 ; e < list.length; e++) {
            this.send(list[e], msg, flashing, colored);
        }
    };
    PyramidRoom.prototype.sendToAlive = function(msg, flashing, colored) {
        for (var n in this.pyr.stamina) {
            if (this.pyr.stamina[n] > 0) {
                this.send(n, msg, flashing, colored);
            }
        }
    };
    
    function HordeRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.midmsg = "Choose a Pokémon to defeat the horde!";
        this.horde = [];
        
        this.level = level;
        
        var size = 8 + level * 2, p;
        var minBST = 130 + 50 * level;
        this.damageCap = [4, 4, 5, 5, 6, 6, 7][level-1] * (3 * this.level);
        while (this.horde.length < size) {
            p = sys.rand(1, 722);
            if (!isLegendary(p) && getBST(p) >= minBST) {
                this.horde.push(p);
            }
        }
        
        var typeChances = { "Normal":7,"Fighting":9,"Flying":13,"Poison":9,"Ground":11,"Rock":9.5,"Bug":7,"Ghost":19,"Steel":25,"Fire":12,"Water":13,"Grass":7.5,"Electric":10,"Psychic":7.5,"Ice":4.5,"Dragon":16,"Dark":14,"Fairy":12 };
        var fTypes = this.forbiddenTypes = [randomSample(typeChances)], t;
        while (fTypes.length < 2) {
            t = randomSample(typeChances);
            if (!fTypes.contains(t)) {
                fTypes.push(t);
            }
        }
        
        var isValidForBattle = function(pokeId) {
            return !hasType(pokeId, fTypes[0]) && !hasType(pokeId, fTypes[1]);
        };
        
        var parties = pyramidRef.parties, pt;
        this.noBattlers = true;
        this.possibleBattlers = {};
        for (var p in parties) {
            pt = parties[p].filter(isValidForBattle);
            this.possibleBattlers[p] = pt;
            if (pt.length > 0) {
                this.noBattlers = false;
                this.individualmsg[p] = "Send one of your Pokémon to help: " + pt.map(pyrLink).join(", ");
            } else {
                this.individualmsg[p] = "None of your Pokémon can participate in this battle!";
            }
        }
        
        this.hordePower = [20 + level * 12, 100 + level * 25];
        
        this.treasures = {
            starpiece: { chance: 3 * level, item: "starpiece", amount: 1 },
            bignugget: { chance: 1 * level, item: "bignugget", amount: 1 },
            bait: { chance: 18, item: "bait", amount: 2 * level },
            gacha: { chance: 12, item: "gacha", amount: 3 * level },
            dust: { chance: 15, item: "dust", amount: 10 * level },
            safari: { chance: 15, item: "safari", amount: 3 * level },
            great: { chance: 12, item: "great", amount: level },
            quick: { chance: 9, item: "quick", amount: level },
            spy: { chance: 9, item: "spy", amount: level },
            rock: { chance: 12, item: "rock", amount: 5 * level },
            pearl: { chance: 10, item: "pearl", amount: 1 * level },
            stardust: { chance: 7, item: "stardust", amount: 1 * level }
        };
        this.treasureHolder = null;
        if (chance(0.2 + this.level * 0.06)) {
            this.treasureHolder = sys.rand(0, this.horde.length);
            this.treasureHeld = randomSampleObj(this.treasures);
        }
        
        this.sendAll("");
        this.sendAll("Room {0}-{1}: This room is infested with lots of wild Pokémon! Defeat them to pass, but <b>{2}</b>-type and <b>{3}</b>-type Pokémon are forbidden!".format(level, roomNum, toColor(this.forbiddenTypes[0], "blue"), toColor(this.forbiddenTypes[1], "blue")));
        this.sendAll("Wild Pokémon: " + this.horde.map(pokeInfo.icon).join(""));
        this.sendIndividuals();
        this.sendAll("");
    }
    HordeRoom.prototype = new PyramidRoom();
    HordeRoom.prototype.validInput = function(id, commandData) {
        if (!this.pokeInParty(id, commandData)) {
            return false;
        }
        var num = getInputPokemon(commandData).id;
        if (hasType(num, this.forbiddenTypes[0])) {
            this.send(id, "You can't choose a " + this.forbiddenTypes[0] + "-type Pokémon for this room!");
            return false;
        }
        if (hasType(num, this.forbiddenTypes[1])) {
            this.send(id, "You can't choose a " + this.forbiddenTypes[1] + "-type Pokémon for this room!");
            return false;
        }
        return true;
    };
    HordeRoom.prototype.getChoices = function() {
        var out = {}, p, id, members = this.pyr.names, fTypes = this.forbiddenTypes, f, party;
        for (p in members) {
            id = members[p];
            if (this.pyr.stamina[id] <= 0) {
                continue;
            }
            if (id in this.choices) {
                var pkmn = getInputPokemon(this.choices[id]);
                if (pkmn.num) {
                    out[id] = pkmn.id;
                } else {
                    out[id] = this.choices[id];
                }
            } else {
                if (this.defaultLeaderChoice && id === this.pyr.leader) {
                    out[id] = this.defaultLeaderChoice;
                } else if (this.defaultChoice) {
                    out[id] = this.defaultChoice;
                } else if (this.defaultToFirstPoke) {
                    party = this.pyr.parties[id];
                    for (f = 0; f < party.length; f++) {
                        if (!hasType(party[f], fTypes[0]) && !hasType(party[f], fTypes[1])) {
                            out[id] = party[f];
                            break;
                        }
                    }
                }
            }
        }
        
        return out;
    };
    HordeRoom.prototype.advance = function() {
        var members = this.pyr.names, id, choice, m, p, dmg, opp, res, defeated = {}, stamina = {}, defeatedCount = 0, points = 0, attackers = {}, attackersNames, lastAttacker = 0, l, n, treasureWinner, treasurePoke;
        
        if (this.noBattlers) {
            this.sendAll("");
            this.sendAll("Wait! No one in your party has any Pokémon able to battle! Your only option is to run by the wild Pokémon!");
            
            points = -12 - 10 * this.level;
            for (m in this.pyr.stamina) {
                stamina[m] = -this.damageCap;
            }
        
            this.pyr.updateStatus(points, stamina, true);
            this.sendAll("");
            this.passed = true;
            return;
        }
        
        attackers = this.getChoices();
        attackersNames = Object.keys(attackers);
        
        for (m = this.horde.length; m--; ) {
            opp = this.horde[m];
            
            for (p = lastAttacker, l = 0; l < attackersNames.length; p++, l++) {
                n = p % (attackersNames.length);
                id = attackersNames[n];
                choice = attackers[id];
                
                res = calcDamage(choice, opp, null, this.hordePower);
                lastAttacker = n + 1;
                
                if (res.power[0] > res.power[1]) {
                    defeatedCount++;
                    if (!defeated.hasOwnProperty(id)) {
                        defeated[id] = [];
                    }
                    defeated[id].push("{0} ({1} x {2})".format(toColor(poke(opp), "blue"), res.power[0], res.power[1]));
                    this.horde.splice(m, 1);
                    points += 5 + this.level;
                    if (this.treasureHolder !== null && m === this.treasureHolder) {
                        treasurePoke = opp;
                        treasureWinner = id;
                    }
                    break;
                }
            }
        }
        
        var defeatedStr = [];
        for (p in defeated) {
            defeatedStr.push("{0}'s {1} defeated {2}".format("<b>" + p.toCorrectCase() + "</b>", "<b>" + poke(attackers[p]) + "</b>", readable(defeated[p].reverse(), "and")));
        }
        
        this.sendAll("");
        if (defeatedStr.length > 0) {
            this.sendAll(defeatedStr.join(" | "));
            if (treasureWinner) {
                this.sendAll("");
                this.sendAll("The <b>{0}</b> defeated by {1} dropped something! <b>{1}</b> found {2}!".format(poke(treasurePoke), addFlashTag(treasureWinner.toCorrectCase()), toColor(treasureName(this.treasureHeld), "blue")), true);
                getTreasure(treasureWinner, this.treasureHeld);
            }
        }
        if (this.horde.length > 0) {
            var averageDamage = Math.min(this.damageCap, this.horde.length * (0 + 3 * this.level));
            for (p in members) {
                id = members[p];
                if (this.pyr.stamina[id] <= 0) {
                    continue;
                }
                dmg = Math.round(averageDamage * (1 - (((id in defeated ? defeated[id].length : 0) / Math.max(defeatedCount, 1)) - 0.5)));
                stamina[id] = -dmg;
            }
            this.sendAll("The following Wild Pokémon haven't been defeated and attacked the players: " + readable(this.horde.map(function(x){ return toColored(poke(x), "red"); }), "and") + "!");
        }
        points = Math.round(points);
        
        this.pyr.updateStatus(points, stamina, true);
        this.sendAll("");
        
        this.passed = true;
    };
    
    function StrongRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.level = level;
        this.attacks = 0;
        
        var parties = pyramidRef.parties;
        for (var p in parties) {
            this.individualmsg[p] = "Send one of your Pokémon to help: " + parties[p].map(pyrLink).join(", ") + (p == pyramidRef.leader ? " | You can instead run away with " + link("/pyr flee") + " at the cost of " + (8 + 5 * level) + " stamina!" : "");
        }
        
        this.opponent = [149, 248, 289, 373, 376, 445, 609, 635, 681, 697, 706, 66256, 66184,66028].concat(legendaries).concat(megaPokemon).random();
        this.opponentHP = 220 + 170 * level;
        this.opponentPower = 9 + 6 * level;
        this.isRevealed = false;
        
        this.treasures = {
            egg: { chance: 1 * level, item: "egg", amount: 1 },
            bignugget: { chance: 2 + level, item: "bignugget", amount: 1 },
            bait: { chance: 12, item: "bait", amount: 5 * level },
            dust: { chance: 10, item: "dust", amount: 14 * level },
            myth: { chance: 15, item: "myth", amount: 2 * level },
            heavy: { chance: 12, item: "heavy", amount: 2 * level },
            spy: { chance: 13, item: "spy", amount: 2 * level },
            bigpearl: { chance: 5, item: "bigpearl", amount: level }
        };
        
        this.sendAll("");
        this.sendAll("Pokémon: " + pokeInfo.sprite(0));
        this.sendAll("Room " + level + "-" + roomNum + ": A strong Pokémon stands in your way, but it's too dark to identify them! Defeat them, unless the leader decided to flee!");
        this.sendIndividuals();
        this.sendAll("");
    }
    StrongRoom.prototype = new PyramidRoom();
    StrongRoom.prototype.midturn = function() {
        this.sendToAlive("Choose a Pokémon to defeat the {0}!".format(this.isRevealed ? poke(this.opponent) : "hidden Pokémon"));
        this.sendIndividuals();
    };
    StrongRoom.prototype.validInput = function(id, commandData) {
        return ["run", "runaway", "run away", "flee"].contains(commandData) || this.pokeInParty(id, commandData);
    };
    StrongRoom.prototype.postInput = function(src, commandData) {
        if (sys.name(src).toLowerCase() === this.pyr.leader && ["run", "runaway", "run away", "flee"].contains(commandData)) {
            this.advance();
            return true;
        }
    };
    StrongRoom.prototype.advance = function() {
        var m, p, res, stamina = {},
            opp = this.opponent,
            defeated = false,
            choices = this.getChoices(),
            attackerNames = Object.keys(choices);
        
        this.sendAll("");
        if (["run", "runaway", "run away", "flee"].contains(choices[this.pyr.leader])) {
            var pointsLost = 9 + 5 * this.level;
            this.sendAll(toColor("Party leader {0} decided to run away from the {1}! {0} lost {2} Stamina!".format(this.pyr.leader.toCorrectCase(), (this.isRevealed ? poke(opp) : "hidden Pokémon"), pointsLost), "crimson"));
            stamina[this.pyr.leader] = -pointsLost;
            this.pyr.updateStatus(0, stamina);
            this.sendAll("");
            this.turnToAdvance = 0;
            this.earlyFinish = true;
            this.passed = true;
            return;
        }
        this.choices = {};
        
        for (p in choices) {
            m = choices[p];
            
            res = calcDamage(m, opp, [15 + 15 * this.level, 80 + 20 * this.level]);
            if (this.opponentHP > 0) {
                this.sendAll("<b>{0}</b>'s <b>{1}</b> dealt {2} damage to the {3}!".format(p.toCorrectCase(), poke(m), toColor(res.power[0], "blue"), (this.isRevealed ? poke(opp) : "hidden Pokémon")));
                if (res.power[0] > 0) {
                    this.opponentHP -= res.power[0];
                    if (this.opponentHP <= 0) {
                        this.opponentHP = 0;
                        defeated = true;
                        if (this.attacks === 0 && chance(0.3 + 0.5 * this.level)) {
                            var reward = randomSampleObj(this.treasures);
                            this.sendAll("<b>{0}</b> picked something dropped by the {1}! {0} received {2}!".format(addFlashTag(p.toCorrectCase()), (this.isRevealed ? poke(opp) : "hidden Pokémon"), toColor(treasureName(reward), "blue")), true);
                            getTreasure(p, reward);
                        }
                        break;
                    }
                }
            }
        }
        this.attacks++;
        if (!this.isRevealed) {
            this.sendAll("The hidden Pokémon is revealed to be <b>{0}</b>! {1}".format(poke(opp), pokeInfo.sprite(opp)));
            this.isRevealed = true;
        }
        
        if (defeated) {
            var pointsRange = [48 + 32 * this.level, 30 + 20 * this.level, 6 + 6 * this.level, -10 - 8 * this.level];
            var points = pointsRange[Math.min(this.attacks-1, pointsRange.length-1)];
            this.sendAll("<b>{0}</b>'s HP dropped to 0! The {0} has fainted! Points gained: {1}".format(poke(opp), plural(points, "Point")));
            this.pyr.updateStatus(points, stamina);
            this.passed = true;
        } else {
            var target = attackerNames.random();
            m = choices[target];
            var dmg = Math.round(this.opponentPower * safari.checkEffective(sys.type(sys.pokeType1(opp)), sys.type(sys.pokeType2(opp)), sys.type(sys.pokeType1(m)), sys.type(sys.pokeType2(m))));
            stamina[target] = -(dmg);
            
            this.sendAll("<b>{0}</b>'s HP is now at {1}! The {0} attacks <b>{2}'s {3}</b>! {2} loses {4} stamina!".format(poke(opp), toColor(this.opponentHP, "blue"), target.toCorrectCase(), poke(m), toColor(dmg, "red")));
            this.sendAll("");
            this.pyr.updateStatus(0, stamina);
            this.sendAll("You may try to attack them again or run away!".format(poke(opp), this.opponentHP));
            
            this.sendIndividuals();
            this.turnToAdvance += 2;
        }
        this.sendAll("");
    };
    
    function BlockedRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.level = level;
        this.attacks = 0;
        
        var parties = pyramidRef.parties;
        for (var p in parties) {
            this.individualmsg[p] = "Send one of your Pokémon to help: " + parties[p].map(pyrLink).join(", ");
        }
        
        this.types = [];
        var allTypes = Object.keys(effectiveness), t;
        while (this.types.length < 3) {
            t = allTypes.random();
            if (!this.types.contains(t)) {
                this.types.push(t);
            }
        }
        this.revealedTypes = [this.types[0]];
        this.hp = 860 + 210 * level;
        this.dealt = {};
        this.treasureGoal = Math.round(this.hp * (1.65 - this.level * 0.07));
        
        this.treasures = {
            pack: { chance: 1 * level, item: "pack", amount: 1 },
            spray: { chance: 2 + level, item: "spray", amount: 1 },
            starpiece: { chance: 4 + level, item: "starpiece", amount: 1 },
            silver: { chance: 13, item: "silver", amount: 2 * level },
            ultra: { chance: 15, item: "ultra", amount: 1 * level },
            quick: { chance: 15, item: "quick", amount: 1 * level },
            clone: { chance: 15, item: "clone", amount: 1 * level },
            rock: { chance: 20, item: "rock", amount: 10 * level },
            stardust: { chance: 8, item: "stardust", amount: 1 * level }
        };
        
        this.sendAll("");
        this.sendAll("Room " + level + "-" + roomNum + ": A weird statue is blocking the exit. The statue seems to have 3 types, but only one is visible: " + toColor(this.types[0], "blue") + ". Destroy the statue to proceed!");
        this.sendIndividuals();
        this.sendAll("");
    }
    BlockedRoom.prototype = new PyramidRoom();
    BlockedRoom.prototype.midturn = function() {
        var known = this.revealedTypes.concat();
        while (known.length < this.types.length) {
            known.push("???");
        }
        this.sendToAlive("Choose a Pokémon to break the {0}-type statue!".format(toColor(known.join("/"), "blue")));
        this.sendIndividuals();
    };
    BlockedRoom.prototype.validInput = function(id, commandData) {
        return this.pokeInParty(id, commandData);
    };
    BlockedRoom.prototype.advance = function() {
        var m, p, dmg, pow, stamina = {}, turnDealt = {}, turnDamage = 0,
            defeated = false,
            choices = this.getChoices();
        
        this.sendAll("");
        for (p in choices) {
            m = choices[p];
            pow = sys.rand(130 + this.level * 15, 240 + this.level * 37);
            dmg = Math.round(pow * safari.checkEffective(sys.type(sys.pokeType1(m)), sys.type(sys.pokeType2(m)), this.types[0], this.types[1], this.types[2]));
            if (!this.dealt.hasOwnProperty(p)) {
                this.dealt[p] = 0;
            }
            turnDealt[p] = dmg;
            this.sendAll("<b>{0}</b>'s <b>{1}</b> dealt {2} damage to the statue!".format(p.toCorrectCase(), poke(m), toColor(dmg, "blue")));
            if (dmg > 0) {
                this.hp -= dmg;
                turnDamage += dmg;
                this.dealt[p] += dmg;
                if (this.hp <= 0) {
                    this.hp = 0;
                    defeated = true;
                    break;
                }
            }
        }
        this.choices = {};
        this.attacks++;
        
        if (defeated) {
            var totalDealt = 0, bestDmg = 0, bestAttacker;
            for (p in this.dealt) {
                dmg = this.dealt[p];
                totalDealt += dmg;
                if (dmg > bestDmg) {
                    bestDmg = dmg;
                    bestAttacker = p;
                }
            }
            
            var pointsRange = [48 + 32 * this.level, 28 + 18 * this.level, 10 + 6 * this.level, -6 - 6 * this.level];
            var points = pointsRange[Math.min(this.attacks-1, pointsRange.length-1)];
            this.sendAll("The {0}-type statue's HP dropped to 0! The statue was destroyed! Points gained: {1}".format(toColor(this.types.join("/"), "blue"), plural(points, "Point")));
            if (totalDealt >= this.treasureGoal) {
                var reward = randomSampleObj(this.treasures);
                this.sendAll("<b>{0}</b> found something stuck to a fragment of the statue! {0} received {1}!".format(addFlashTag(bestAttacker.toCorrectCase()), toColor(treasureName(reward), "blue")), true);
                getTreasure(bestAttacker, reward);
            }
            this.pyr.updateStatus(points, stamina);
            this.passed = true;
        } else {
            var rt = this.revealedTypes.length;
            if (rt < this.types.length) {
                this.revealedTypes.push(this.types[rt]);
                this.sendAll("The statue's {0} type is revealed to be <b>{1}</b>! You now know the statue is {2}-type!".format(getOrdinal(rt+1), this.types[rt], toColor(this.revealedTypes.join("/"), "blue")));
            }
            
            var staminaStr = [], members = this.pyr.names, id;
            var averageDamage = 5 + 6 * this.level;
            for (p in members) {
                id = members[p];
                if (this.pyr.stamina[id] <= 0) {
                    continue;
                }
                dmg = Math.round(averageDamage * (1 - ((turnDealt[id]/turnDamage) - 0.5)));
                stamina[id] = -dmg;
                staminaStr.push(id.toCorrectCase() + " -" + dmg);
            }
            
            this.sendAll("The statue's HP is now at {0}! Stamina lost: {1}".format(toColor(this.hp, "blue"), staminaStr.join(", ")));
            this.sendAll("");
            
            this.pyr.updateStatus(0, stamina);
            this.sendAll("Keep attacking the statue until you destroy it!");
            this.sendIndividuals();
            this.turnToAdvance += 2;
        }
        this.sendAll("");
    };
    
    function RiddleRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.level = level;
        this.defaultChoice = "none";
        this.answerType = chance(0.36 + level * 0.04) ? "move" : "name";
        
        this.answerAttempts = 0;
        this.cluesSearched = {};
        this.turns = 9 - Math.floor(level/2) + (this.answerType === "move" ? 1 : 0);
        
        var hints;
        if (this.answerType === "name") {
            this.answerId = sys.rand(1, 722);
            this.answer = poke(this.answerId);
            hints = this.writeHints(level);
        } else if (this.answerType === "move") {
            do {
                this.answerId = sys.rand(1, 622);
            } while (pokedex.getMoveBP(this.answerId) === "---" && pokedex.getMoveAccuracy(this.answerId) === "---");
            this.answer = sys.move(this.answerId);
            hints = this.writeHintsMove(level);
        }
        
        var objects = ["crate", "barrel", "rock", "box", "wall", "corner", "floor", "ceiling", "puddle", "coffin", "chains", "pillar", "vase", "statue", "chest", "table", "sword", "torch", "chair"].shuffle();
        this.hintsLocation = {};
        for (var h = 0; h < hints.length; h++){
            this.hintsLocation[objects.shift()] = hints[h];
        }
        var treasuresAmt = 0;
        switch (hints.length) {
            case 8:
            case 9:
            case 10:
                treasuresAmt = 3;
            break;
            case 6:
            case 11:
            case 12:
                treasuresAmt = 2;
            break;
            case 7:
            case 13:
                treasuresAmt = 1;
            break;
            default:
                treasuresAmt = 0;
        }
        var rew = {
            gem: { chance: 2 * level, item: "gem", amount: 1 },
            nugget: { chance: 1 * level, item: "nugget", amount: 1 },
            money: { chance: 12, item: "money", amount: 200 * level },
            safari: { chance: 18, item: "safari", amount: 5 * level },
            myth: { chance: 12, item: "myth", amount: 1 * level },
            spy: { chance: 12, item: "spy", amount: 1 * level },
            pearl: { chance: 10, item: "pearl", amount: 1 * level }
        };
        while (treasuresAmt > 0) {
            this.hintsLocation[objects.shift()] = randomSampleObj(rew);
            treasuresAmt--;
        }
        this.validObjects = Object.keys(this.hintsLocation).shuffle();
        
        this.hintsFound = [];
        this.leaderChoice = null;
        
        this.sendAll("");
        this.sendAll("Room {0}-{1}: The door requires a Pokémon <b>{2}</b> as a password to open! Search for clues in the room so the leader can input the password!!".format(level, roomNum, toColor(cap(this.answerType), "blue")));
        this.sendIndividuals();
        this.sendAll("");
    }
    RiddleRoom.prototype = new PyramidRoom();
    RiddleRoom.prototype.writeHints = function(level) {
        var hints = [], h;
        hints.push("Starts with '{0}'".format(this.answer[0]));
        if (level <= 4) {
            hints.push("Ends with '{0}'".format(cap(this.answer[this.answer.length-1])));
        }
        hints.push("One of the types is '{0}'".format(sys.type(sys.pokeType1(this.answerId))));
        h = sys.type(sys.pokeType2(this.answerId));
        if (h !== "???" && level <= 6) {
            hints.push("One of the types is '{0}'".format(h));
        }
        hints.push("Can have the ability '{0}'".format(sys.ability(sys.pokeAbility(this.answerId, 0))));
        h = sys.pokeAbility(this.answerId, 1);
        if (h) {
            hints.push("Can have the ability '{0}'".format(sys.ability(h)));
        }
        h = sys.pokeAbility(this.answerId, 2);
        if (h) {
            hints.push("Can have the ability '{0}'".format(sys.ability(h)));
        }
        var maxMoves = level <= 2 ? 6 : 8;
        var moves = pokedex.getAllMoves(this.answerId).shuffle().slice(0, maxMoves).map(sys.move);
        for (h = moves.length; h--; ) {
            if (h >= 1) {
                hints.push("Can have the moves '{0} and {1}'".format(moves[h], moves[h-1]));
                h--;
            } else {
                hints.push("Can have the move '{0}'".format(moves[h]));
            }
        }
        h = generation(this.answerId, true);
        hints.push("Is from the " + h + " region");
        
        h = getBST(this.answerId);
        hints.push("BST is between {0} and {1}".format(h - sys.rand(0, 45), h + sys.rand(1, 45)));
        if (this.answerId in evolutions) {
            hints.push("Can evolve");
        } else {
            hints.push("Can't evolve");
        }
        if (this.answerId in devolutions) {
            hints.push("Is evolved");
        } else {
            hints.push("Is not evolved");
        }
        return hints.shuffle();
    };
    RiddleRoom.prototype.writeHintsMove = function(level) {
        var hints = [], h;
        
        hints.push("Starts with '{0}'".format(this.answer[0]));
        if (level <= 4) {
            hints.push("Ends with '{0}'".format(cap(this.answer[this.answer.length-1])));
        }
        hints.push("Type is '{0}'".format(sys.type(sys.moveType(this.answerId))));
        
        h = pokedex.getMoveBP(this.answerId);
        if (h !== "---") {
            h = parseInt(h, 10);
            hints.push("Power is between {0} and {1}".format(h - sys.rand(0, 10), h + sys.rand(1, 10)));
        }
        
        h = pokedex.getMovePP(this.answerId);
        hints.push("Base PP is {0}".format(h));
        
        h = pokedex.getMoveAccuracy(this.answerId);
        if (h !== "---") {
            hints.push("Accuracy is {0}".format(h));
        }
        
        h = pokedex.getMoveCategory(this.answerId);
        hints.push("Category is {0}".format(h));
        
        h = pokedex.getMoveContact(this.answerId);
        hints.push(h ? "Makes contact" : "Doesn't make contact");
        
        var cropHint = function(hint) {
            var c = hint.length, i;
            
            i = hint.indexOf(". ");
            if (i >= 0 && i < c) {
                c = i;
            }
            if (c > 150) {
                i = h.indexOf(", ", 100);
                if (i >= 0 && i < c) {
                    c = i;
                }
            }
            if (c >= hint.length) {
                c = hint.length;
            }
            
            hint = hint.substring(0, c).trim();
            c = hint.length-1;
            if (hint[c] === "." || hint[c] === ",") {
                hint = hint.substr(0, hint.length-1);
            }
            return hint;
        };
        
        h = pokedex.getMoveEffect(this.answerId);
        var res = cropHint(h);
        hints.push("Description contains \"{0}\"".format(res));
        
        res = h.substr(res.length + 2);
        if (res.length > 24 && level <= 6) {
            res = cropHint(res);
            hints.push("Description contains \"{0}\"".format(res));
        }
        
        var canLearn = [];
        var cantLearn = [];
        for (var i = 1; i < 722; i++) {
            if (pokedex.getAllMoves(i).contains(this.answerId + "")) {
                if (i !== 235) {
                    canLearn.push(sys.pokemon(i));
                }
            } else {
                cantLearn.push(sys.pokemon(i));
            }
        }
        if (canLearn.length > 0) {
            canLearn = canLearn.shuffle();
            hints.push("Can be learned by {0}".format(readable(canLearn.slice(0, 4))));
            if (canLearn.length > 4 && level > 2) {
                hints.push("Can be learned by {0}".format(readable(canLearn.slice(4, 8))));
            }
        }
        
        if (cantLearn.length > 0) {
            hints.push("Can NOT be learned by {0}".format(readable(cantLearn.shuffle().slice(0, 3))));
        }
        
        h = this.answer.replace(/[\s\-']/g, "").length;
        i = (this.answer.match(/[\s\-]/g) || []).length + 1;
        hints.push("Name has {0} letters and {1}".format(h, plural(i, "word")));
        
        return hints.shuffle();
    };
    RiddleRoom.prototype.midturn = function() {
        this.sendToAlive("Find the password (Pokémon " + this.answerType + ") to open the door! " + (this.hintsFound.length > 0 ? "Hints found: " + this.hintsFound.map(function(x){ return toColor(x, "blue");}).join(", ") : ""));
        this.sendIndividuals();
    };
    RiddleRoom.prototype.sendIndividuals = function() {
        var n, id;
        var toCommand = function(x) {
            return link("/pyr " + cap(x));
        };
        if (this.validObjects.length > 0) {
            for (n = this.pyr.names.length; n-- ;) {
                id = this.pyr.names[n];
                if (this.pyr.stamina[id] > 0) {
                    this.send(id, "Look for clues at: " + this.validObjects.map(toCommand).join(", ") + (id === this.pyr.leader ? " | Or input the password with " + link("/pyr Answer", null, true) : ""));
                }
            }
        } else {
            this.send(this.pyr.leader, "Input the password with " + link("/pyr [Answer]", null, true));
        }
    };
    RiddleRoom.prototype.useCommand = function(src, commandData) {
        var player = getAvatar(src),
            info = getInputPokemon(commandData);
        
        if (player.id === this.pyr.leader) {
            if (this.answerType === "name" && info.num !== null && !info.shiny) {
                this.checkAnswer(info.name, sys.pokeNum(info.name));
                return;
            }
            if (this.answerType === "move" && sys.moveNum(commandData)) {
                this.checkAnswer(sys.move(sys.moveNum(commandData)), sys.moveNum(commandData));
                return;
            }
        }
        if (this.validInput && !this.validInput(player.id, commandData)) {
            return;
        }
        this.choices[player.id] = commandData;
        if (this.postInput && this.postInput(src, commandData)) {
            return;
        }
        this.sendAll(toColor("{0} is going to use {1}!".format(player.id.toCorrectCase(), commandData), "crimson"));
    };
    RiddleRoom.prototype.validInput = function(id, commandData) {
        if (!this.validObjects.contains(commandData.toLowerCase())) {
            this.send(id, "There's no {0} to look for clues at!".format(commandData));
            return false;
        }
        for (var e in this.choices) {
            if (this.choices[e].toLowerCase() === commandData.toLowerCase()) {
                this.send(id, "{0} is already going to look for clues at the {1}! Look somewhere else!".format(e.toCorrectCase(), commandData));
                return false;
            }
        }
        return true;
    };
    RiddleRoom.prototype.postInput = function(src, commandData) {
        this.sendAll(toColor("{0} is going to look for a clue at the {1}!".format(sys.name(src), cap(commandData.toLowerCase())), "crimson"));
        return true;
    };
    RiddleRoom.prototype.checkAnswer = function(commandData, id) {
        var stamina = {}, name = this.pyr.leader.toCorrectCase();
        this.sendAll("");
        if (id == this.answerId) {
            var extraPoints = 12 + 8 * this.level, hintsUsed = this.hintsFound.length;
            if (hintsUsed > 10) {
                extraPoints = Math.round(-extraPoints * 0.115 * (hintsUsed - 10));
            } else if (hintsUsed > 3) {
                extraPoints = Math.round(extraPoints - (extraPoints * (hintsUsed - 3) / 4));
            }
            
            var basePointsRange = [36 + 24 * this.level, 18 + 12 * this.level, 6 + 6 * this.level, 1 + 2 * this.level];
            var points = basePointsRange[Math.min(this.answerAttempts, basePointsRange.length-1)] + extraPoints;
            
            this.sendAll("<b>{0}</b> answered <b>{1}</b> and the door opened! Points gained: {2}".format(name, this.answer, plural(points, "Point")));
            this.pyr.updateStatus(points, {});
            this.passed = true;
            this.earlyFinish = true;
            this.turnToAdvance = 0;
        } else {
            this.answerAttempts++;
            var stmLost = 5 + 5 * this.level;
            if (this.answerAttempts > 1) {
                stamina[this.pyr.leader] = -stmLost;
            }
            
            this.sendAll("<b>{0}</b> answered <b>{1}</b>, but nothing happened! {2}".format(name, commandData, (this.answerAttempts > 1 ? "Stamina lost: " + name + "-" + stmLost : "") ));
            this.pyr.updateStatus(0, stamina);
            if (!this.pyr.hasStamina()) {
                this.pyr.finishMode = "stamina";
                this.pyr.finish();
                return;
            }
        }
        this.sendAll("");
    };
    RiddleRoom.prototype.advance = function() {
        var p, stamina = {}, place, res, staminaStr = [], isTreasure,
            choices = this.getChoices(), locationsSearched = {};
        
        this.sendAll("");
        
        for (p in choices) {
            place = choices[p].toLowerCase();
            if (place !== "none") {
                if (!this.cluesSearched.hasOwnProperty(p)) {
                    this.cluesSearched[p] = 0;
                }
                res = this.hintsLocation[place];
                isTreasure = typeof res === "object";
                
                if (!isTreasure) {
                    this.cluesSearched[p]++;
                    if (this.cluesSearched[p] > 1) {
                        stamina[p] =  -1 - Math.round((this.answerType === "move" ? 1.5 : 2) * this.level);
                    }
                }
                
                locationsSearched[place] = true;
                
                if (isTreasure) {
                    this.sendAll("<b>{0}</b> investigated the <b>{1}</b> and found {2}!".format(addFlashTag(p.toCorrectCase()), cap(place), toColor(treasureName(res), "blue")), true);
                    getTreasure(p, res);
                } else {
                    this.sendAll("<b>{0}</b> investigated the <b>{1}</b> and found a hint: \"{2}\"".format(p.toCorrectCase(), cap(place), toColor(res, "blue")));
                    if (!this.hintsFound.contains(res)) {
                        this.hintsFound.push(res);
                    }
                }
            }
        }
        this.choices = {};
        
        for (p in locationsSearched) {
            this.validObjects.splice(this.validObjects.indexOf(p), 1);
        }
        
        this.turns--;
        if (this.turns > 0) {
            for (p in stamina) {
                staminaStr.push(p.toCorrectCase() + " " + stamina[p]);
            }
            if (staminaStr.length > 0) {
                this.sendAll("The search for the password is becoming tiresome! Stamina lost: {0}".format(staminaStr.join(", ")));
            }
            this.pyr.updateStatus(0, stamina);
            this.sendAll("");
            this.sendAll("Look for more clues or input the password to open the door! The password is a Pokémon " + this.answerType + "! You only have {0} turns left!".format(this.turns));
            this.sendIndividuals();
            this.sendAll("");
            this.turnToAdvance += 2;
        } else {
            for (p in this.pyr.stamina) {
                if (this.pyr.stamina[p] > 0) {
                    if (!stamina.hasOwnProperty(p)) {
                        stamina[p] = 0;
                    }
                    stamina[p] -= 7 + 5 * this.level;
                    staminaStr.push(p.toCorrectCase() + " " + stamina[p]);
                }
            }
            var points = -10 - this.level * 8;
            this.sendAll("As the door opened by itself, a voice so loud that it hurts your ears could be heard: <b>\"YOU ARE TERRIBLE AT RIDDLES!!\"</b> | Points: {0} | Stamina lost: {1}".format(points, staminaStr.join(", ")));
            this.pyr.updateStatus(points, stamina);
            this.sendAll("");
            this.passed = true;
        }
    };
    
    function TrainerRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.trainerName = "Trainer " + generateName();
        this.midmsg = "Choose a Pokémon to fight the {0}!".format(this.trainerName);
        this.horde = [];
        
        this.level = level;
        
        var parties = pyramidRef.parties;
        for (var p in parties) {
            this.individualmsg[p] = "Send one of your Pokémon to help: " + parties[p].map(pyrLink).join(", ");
        }
        this.trainerPower = [9 + level * 7, 85 + level * 15];
        
        this.trainerTeam = [];
        var num, bst = 285 + 30 * level, maxLegend = Math.floor((level-1)/3) + 1;
        while (this.trainerTeam.length < 3) {
            num = sys.rand(1, 722);
            if (getBST(num) >= bst) {
                if (isLegendary(num)) {
                    if (maxLegend <= 0) {
                        continue;
                    }
                    maxLegend--;
                }
                this.trainerTeam.push(num);
            }
        }
        
        this.treasures = {
            rare: { chance: 1 * level, item: "rare", amount: 1 },
            spray: { chance: 1 + level, item: "spray", amount: 1 },
            money: { chance: 3, item: "money", amount: 240 * level },
            money2: { chance: 12, item: "money", amount: 150 * level },
            silver: { chance: 7, item: "silver", amount: 2 * level },
            gacha: { chance: 10, item: "gacha", amount: 5 * level },
            great: { chance: 10, item: "great", amount: 3 * level },
            ultra: { chance: 8, item: "ultra", amount: 2 + level },
            luxury: { chance: 10, item: "luxury", amount: 1 * level },
            clone: { chance: 10, item: "clone", amount: 1 * level },
            premier: { chance: 8, item: "premier", amount: 2 * level }
        };
        
        this.inverted = chance(0.35 + 0.05 * this.level);
        
        this.sendAll("");
        this.sendAll("Room {0}-{1}: {2} challenges you to a 3v3 {3}battle! You can't refuse!".format(level, roomNum, this.trainerName, this.inverted ? "<b>Inverted</b> " : ""));
        this.sendIndividuals();
        this.sendAll("");
    }
    TrainerRoom.prototype = new PyramidRoom();
    TrainerRoom.prototype.validInput = function(id, commandData) {
        return this.pokeInParty(id, commandData);
    };
    TrainerRoom.prototype.advance = function() {
        var id, m, p, opp, res, points = 0, stamina = {}, choices = {}, attackers = [], attackersNames = [];
        
        choices = this.getChoices();
        for (m in choices) {
            attackers.push(choices[m]);
            attackersNames.push(m);
        }
        var leaderParty = this.pyr.parties[this.pyr.leader].concat(), c = 0;
        leaderParty.splice(leaderParty.indexOf(choices[this.pyr.leader]), 1);
        for (c = 0; c < leaderParty.length && attackers.length < 3; c++) {
            m = leaderParty[c];
            attackers.push(m);
            attackersNames.push(this.pyr.leader);
        }
        this.sendAll("");
        if (attackers.length === 0) {
            this.sendAll("Wait! No one in your party has any Pokémon able to battle! You lose by default!");
            
            points = -15 - 15 * this.level;
            for (m in this.pyr.stamina) {
                stamina[m] = -(15 * this.level);
            }
        
            this.pyr.updateStatus(points, stamina, true);
            this.sendAll("");
            this.passed = true;
            return;
        }
        while (attackers.length < 3) {
            attackers.push(attackers[0]);
            attackersNames.push(this.pyr.leader);
        }
        
        var score = 0, oppScore = 0, result, status, n1, n2, treasureTo, treasurePoke;
        for (p = 0; p < 3; p++) {
            id = attackersNames[p];
            m = attackers[p];
            opp = this.trainerTeam[p];
            
            res = calcDamage(m, opp, null, this.trainerPower, this.inverted);
            
            result = "{0} {2} ({4}) x ({5}) {3} {1}";
            if (res.power[0] == res.power[1]) {
                result += " <b>Draw</b>";
            }
            status = "Details ({0}/Power/Type) | {1} ({3}/{5}/{7}x) x {2} ({4}/{6}/{8}x)";
            
            n1 = id.toCorrectCase() + "'s " + poke(m);
            n1 = res.power[0] > res.power[1] ? "<b>" + n1 + "</b>" : n1;
            
            n2 = this.trainerName + "'s " + poke(opp);
            n2 = res.power[0] < res.power[1] ? "<b>" + n2 + "</b>" : n2;

            this.sendAll(result.format(n1, n2, pokeInfo.icon(m), pokeInfo.icon(opp), res.power[0], res.power[1]));
            this.sendAll(toColor(status.format(res.statName, poke(m), poke(opp), res.stat[0], res.stat[1], res.move[0], res.move[1], res.bonusString[0], res.bonusString[1]), "gray"));
            
            if (res.power[0] > res.power[1]) {
                score++;
                if (res.power[0] >= 750 && !treasureTo) {
                    treasureTo = id;
                    treasurePoke = poke(m);
                }
            } else {
                if (res.power[0] < res.power[1]) {
                    oppScore++;
                }
                if (!stamina.hasOwnProperty(id)) {
                    stamina[id] = 0;
                }
                stamina[id] -= 5 + 7 * this.level;
            }
        }
        
        if (score > oppScore) {
            this.sendAll("Your party defeated {0}! Final score {1} x {2}".format(this.trainerName, "<b>" + score + "</b>", "<b>" + oppScore + "</b>"));
            if (treasureTo) {
                var reward = randomSampleObj(this.treasures);
                this.sendAll("");
                this.sendAll("{0} was really impressed by <b>{1}</b>'s <b>{2}</b>! {0} gives {3} to {1}!".format(this.trainerName, addFlashTag(treasureTo.toCorrectCase()), treasurePoke, toColor(treasureName(reward), "blue")), true);
                getTreasure(treasureTo, reward);
            }
        } else {
            this.sendAll("Your party couldn't beat {0}! Final score {2} x {1}".format(this.trainerName, "<b>" + score + "</b>", "<b>" + oppScore + "</b>"));
        }
        points = [-6 - 4 * this.level, 0, 30 + 20 * this.level, 48 + 32 * this.level][score];
        
        this.pyr.updateStatus(points, stamina, true);
        this.sendAll("");
        
        this.passed = true;
    };
    
    function DefenseRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.horde = [];
        
        this.level = level;
        
        var parties = pyramidRef.parties;
        for (var p in parties) {
            this.individualmsg[p] = "Send one of your Pokémon to defend yourself: " + parties[p].map(pyrLink).join(", ");
        }
        
        do {
            this.opponent = sys.rand(1, 722);
        } while ([10, 11, 13, 14, 129, 132, 201, 202, 265, 266, 268, 360, 374, 401, 412, 602, 664, 665].contains(this.opponent));
        
        var moves = pokedex.getAllMoves(this.opponent), damaging = [], m;
        for (m = moves.length; m--; ) {
            if (pokedex.getMoveBP(moves[m]) !== "---") {
                damaging.push(moves[m]);
            }
        }
        
        var type, count = 0;
        do {
            this.firstAtk = damaging.random();
            type = sys.type(sys.moveType(this.firstAtk));
            count++;
        } while (count < 1 + level * 2 && type === "Normal");
        this.firstAtk = sys.move(this.firstAtk);
        
        do {
            this.secondAtk = damaging.random();
            type = sys.type(sys.moveType(this.secondAtk));
            count++;
        } while (count < 2 + level * 2 && type === "Normal");
        
        this.treasures = {
            rare: { chance: 1 * level, item: "rare", amount: 1 },
            gem: { chance: 3 * level, item: "gem", amount: 1 },
            silver: { chance: 6, item: "silver", amount: 1 * level },
            bait: { chance: 10, item: "bait", amount: 2 * level },
            great: { chance: 10, item: "great", amount: 2 * level },
            luxury: { chance: 10, item: "luxury", amount: 1 * level },
            quick: { chance: 10, item: "quick", amount: 1 * level },
            rock: { chance: 10, item: "rock", amount: 10 * level },
            stardust: { chance: 6, item: "stardust", amount: 1 * level }
        };
        var typeChances = {"Normal":18,"Fighting":20.25,"Flying":18.25,"Poison":15.75,"Ground":19.5,"Rock":23,"Bug":20.25,"Ghost":15.5,"Steel":9.5,"Fire":16.5,"Water":17,"Grass":23,"Electric":16.25,"Psychic":21.5,"Ice":24.75,"Dragon":19,"Dark":19.5,"Fairy":16.25};
        this.bonusTypes = [randomSample(typeChances)];
        var type2 = randomSample(typeChances);
        if (type2 !== this.bonusTypes[0]) {
            this.bonusTypes.push(type2);
        }
        
        this.midmsg = "Choose a Pokémon to defend from the next attack (Using a Pokémon with the type" + (this.bonusTypes.length > 1 ? "s" : "") + " " + readable(this.bonusTypes, "or") + " will give bonus points!)!";
        
        this.sendAll("");
        this.sendAll("Room {0}-{1}: As soon as you enter the room, you see a Pokémon in the shadows using {2}. They then look at you and prepare another attack!".format(level, roomNum, toColor(this.firstAtk, "blue")));
        this.sendAll("Using a Pokémon with the type" + (this.bonusTypes.length > 1 ? "s" : "") + " " + toColor(readable(this.bonusTypes, "or"), "red") + " will give bonus points!");
        this.sendIndividuals();
        this.sendAll("");
    }
    DefenseRoom.prototype = new PyramidRoom();
    DefenseRoom.prototype.validInput = function(id, commandData) {
        return this.pokeInParty(id, commandData);
    };
    DefenseRoom.prototype.advance = function() {
        var members, m, p,  points = 0, stamina = {}, choices = {}, atk, dmg, totalDef = 1, defended = [], hit = [], eff, treasureTo, bonusPoints = 0, halfBonus = 0, bonusUsed, bonusMsg = [];
        
        choices = this.getChoices();
        members = Object.keys(choices);
        
        this.sendAll("");
        this.sendAll(toColor("{0} {1} used {2}!".format(pokeInfo.icon(this.opponent), poke(this.opponent), sys.move(this.secondAtk)), "blue"));
        
        atk = sys.type(sys.moveType(this.secondAtk));
        for (p in choices) {
            m = choices[p];
            
            dmg = safari.checkEffective(atk, "???", sys.type(sys.pokeType1(m)), sys.type(sys.pokeType2(m)));
            totalDef *= dmg;
            
            if (dmg === 0) {
                eff = toColor("It has no effect!", "gray");
            } else if (dmg < 1) {
                eff = toColor("It's not very effective... ({0}x)!".format(dmg), "green");
            } else if (dmg === 1) {
                eff = toColor("A normal hit!", "blue");
            } else if (dmg > 1) {
                eff = toColor("It's super-effective ({0}x)!".format(dmg), "red");
            }
            
            this.sendAll("<b>{0}</b>'s <b>{1}</b> was hit by {2}'s {3}! {4}".format(p.toCorrectCase(), poke(m), poke(this.opponent), sys.move(this.secondAtk), eff));
            if (dmg < 1) {
                defended.push(p.toCorrectCase());
                if (!treasureTo && dmg <= 0.25 && chance(0.2 + 0.5 * this.level)) {
                    treasureTo = p;
                }
            } else {
                hit.push(p.toCorrectCase());
                stamina[p] = -(dmg * (3 + 6 * this.level));
            }
            if (dmg <= 1) {
                bonusUsed = [];
                for (var l = this.bonusTypes.length; l--; ) {
                    if (hasType(m, this.bonusTypes[l])) {
                        if (dmg === 1) {
                            halfBonus++;
                        } else {
                            bonusPoints++;
                        }
                        bonusUsed.push(this.bonusTypes[l]);
                    }
                }
                if (bonusUsed.length > 0) {
                    bonusMsg.push(p.toCorrectCase() + " defended with " + bonusUsed.join("/") + "-type Pokémon");
                }
            }
        }
        
        if (defended.length >= members.length) {
            this.sendAll(toColor("The entire party managed to defend from the attack!", "blue"));
            points = Math.round((25 + 25 * this.level) * (members.length/3));
        } else if (defended.length === 0) {
            this.sendAll(toColor("No one managed to defend from the attack!", "red"));
            points = Math.round((-7 - 5 * this.level) * (members.length/3));
        } else {
            this.sendAll("{0} managed to defend from the attack, but {1} have been hit!".format(readable(defended, "and"), readable(hit, "and")));
            if (members.length === 3) {
                points = defended.length > hit.length ? 10 + 10 * this.level : 3 + 3 * this.level;
            } else {
                points = 10 + 10 * this.level;
            }
        }
        
        if (bonusPoints > 0 || halfBonus > 0) {
            var pointsGained = bonusPoints * (8 + 5 * this.level) + Math.round(halfBonus * (8 + 5 * this.level) / 2);
            this.sendAll("Received {0} Bonus Points because {1}!".format(pointsGained, readable(bonusMsg)));
            points += pointsGained;
        }
        if (treasureTo) {
            var reward = randomSampleObj(this.treasures);
            this.sendAll("After defending itself, <b>{0}</b> found {1} at the place the {2} was!".format(addFlashTag(treasureTo.toCorrectCase()), toColor(treasureName(reward), "blue"), poke(this.opponent)), true);
            getTreasure(treasureTo, reward);
        }
        
        this.sendAll("");
        this.pyr.updateStatus(points, stamina, true);
        this.sendAll("");
        
        this.passed = true;
    };
    
    function HazardRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.midmsg = "Choose a move to clear the obstacles!";
        this.defaultChoice = "struggle";
        this.level = level;
        
        this.hazardMoves = {
            "plants":[163,13],
            "water":[57,181],
            "boulder":[276,477],
            "toxic":[432,54],
            "pit":[19,22],
            "ice":[498,257],
            "flame":[56,410],
            "electric":[50,300],
            "dark":[430,497]
        };
        this.validMoves = [];
        for (var c in this.hazardMoves) {
            this.validMoves = this.validMoves.concat(this.hazardMoves[c]);
        }
        this.hazardNames = {
            "plants": "Plants",
            "water": "Water Stream",
            "boulder": "Boulders",
            "toxic": "Toxic Gas",
            "pit": "Pit",
            "ice": "Ice Pillar",
            "flame": "Flamethrowers",
            "electric": "Electric Fence",
            "dark": "Darkness"
        };
        this.hazards = {};
        var pickedHazards = Object.keys(this.hazardMoves).shuffle();
        var count = 100, index = 0, added, minVal = 7;
        while (count > minVal && index < pickedHazards.length) {
            added = sys.rand(minVal, count);
            this.hazards[pickedHazards[index]] = added;
            count -= added;
            index++;
        }
        if (count > 0) {
            this.hazards[pickedHazards[0]] += count;
        }
        var randomHazard = randomSample(this.hazards);
        var randomHazard2 = randomSample(this.hazards);
        
        this.usableMoves = {};
        this.usableCommands = {};
        var parties = pyramidRef.parties, p, m, move, set, id;
        var toMoveCommand = function(x) {
            return link("/pyr " + sys.move(x));
        };
        var toLowerMove = function(x) {
            return sys.move(x).toLowerCase();
        };
        for (p in parties) {
            this.usableMoves[p] = [];
            for (m = parties[p].length; m--; ) {
                id = parseInt(parties[p][m], 10);
                set = pokedex.getAllMoves(id);
                if (!set) {
                    set = pokedex.getAllMoves(pokeInfo.species(id));
                }
                for (c = this.validMoves.length; c--;) {
                    move = this.validMoves[c] + "";
                    if (set.contains(move) && !this.usableMoves[p].contains(move)) {
                        this.usableMoves[p].push(move);
                    }
                }
            }
            this.usableMoves[p].push("165"); //Struggle
            this.usableCommands[p] = this.usableMoves[p].map(toLowerMove);
            
            this.individualmsg[p] = "Pick a move to clear the obstacles: " + this.usableMoves[p].map(toMoveCommand).join(", ");
        }
        
        this.treasures = {
            egg: { chance: 1 * level, item: "egg", amount: 1 },
            nugget: { chance: 2 + level, item: "nugget", amount: 1 },
            silver: { chance: 8, item: "silver", amount: 2 + level },
            dust: { chance: 14, item: "dust", amount: 9 * level },
            quick: { chance: 10, item: "quick", amount: 1 * level },
            rock: { chance: 15, item: "rock", amount: 15 * level },
            bigpearl: { chance: 5, item: "bigpearl", amount: 1 * level }
        };
        if (chance(0.44 + 0.06 * this.level)) {
            this.hiddenTreasure = randomSampleObj(this.treasures);
            this.treasureLocation = Object.keys(this.hazards).random();
        }
        
        this.sendAll("");
        this.sendAll("Room {0}-{1}: Some hazards obstruct your path to the next door! You can identify some <b>{2}</b>, but there are more, so clear them!".format(level, roomNum, this.hazardNames[randomHazard] + (randomHazard !== randomHazard2 ? " and " + this.hazardNames[randomHazard2] : "")));
        this.sendIndividuals();
        this.sendAll("");
    }
    HazardRoom.prototype = new PyramidRoom();
    HazardRoom.prototype.validInput = function(id, commandData) {
        return this.usableCommands[id].contains(commandData.toLowerCase());
    };
    HazardRoom.prototype.advance = function() {
        var parties = this.pyr.parties, members = this.pyr.names, id, m, p, points = 0, attackers = {}, attackersNames, n, pId, move, cat, power, set, liveHazards, struggled, strugglers = {}, strugglemsg, stamina = {};
        
        attackers = this.getChoices();
        attackersNames = Object.keys(attackers);
        
        this.sendAll("");
        for (p in attackers) {
            move = sys.moveNum(attackers[p]);
            struggled = false;
            
            if (move === 165) {
                liveHazards = [];
                for (m in this.hazards) {
                    if (this.hazards[m] > 0) {
                        liveHazards.push(m);
                    }
                }
                if (liveHazards.length > 0) {
                    cat = liveHazards.random();
                    struggled = true;
                } else {
                    continue;
                }
            } else {
                for (m in this.hazardMoves) {
                    if (this.hazardMoves[m].contains(move)) {
                        cat = m;
                        break;
                    }
                }
            }
            
            strugglemsg = "";
            if (struggled) {
                id = parties[p].random();
                strugglers[p] = 2 + 3 * this.level;
                strugglemsg = p.toCorrectCase() + " lost " + strugglers[p] + " Stamina!";
            } else {
                for (n in parties[p]) {
                    pId = parseInt(parties[p][n], 10);
                    set = pokedex.getAllMoves(pId);
                    if (!set) {
                        set = pokedex.getAllMoves(pokeInfo.species(pId));
                    }
                    if (set.contains(move + "")) {
                        id = parties[p][n];
                        break;
                    }
                }
            }
            
            if (cat in this.hazards && this.hazards[cat] > 0) {
                if (struggled) {
                    power = Math.min(sys.rand(8, 40 - this.level), this.hazards[cat]);
                } else {
                    power = Math.min(sys.rand(15 + this.level, 67 - this.level), this.hazards[cat]);
                }
                
                this.sendAll("<b>{0}</b>'s <b>{1}</b> used <b>{2}</b> to pass through the {3} and clear <b>{4}%</b> of the room! {5}".format(p.toCorrectCase(), poke(id), toColor(sys.move(move), "blue"), toColor(this.hazardNames[cat], "blue"), power, strugglemsg));
                this.hazards[cat] -= power;
                if (cat == this.treasureLocation && this.hazards[cat] <= 0) {
                    this.sendAll("After clearing the {1}, <b>{0}</b> found {2}!".format(addFlashTag(p.toCorrectCase()), this.hazardNames[cat], toColor(treasureName(this.hiddenTreasure), "blue")), true);
                    getTreasure(p, this.hiddenTreasure);
                }
            } else {
                this.sendAll("<b>{0}</b>'s <b>{1}</b> used <b>{2}</b> to pass through the {3}, but there was no {3}! {4}".format(p.toCorrectCase(), poke(id), toColor(sys.move(move), "blue"), toColor(this.hazardNames[cat], "blue"), strugglemsg));
            }
        }
        
        var rest = 0, remaining = [];
        for (p in this.hazards) {
            m = this.hazards[p];
            if (m > 0) {
                rest += m;
                remaining.push(m + "% " + this.hazardNames[p]);
            }
        }
        for (p in strugglers) {
            if (!(p in stamina)) {
                stamina[p] = 0;
            }
            stamina[p] -= strugglers[p];
        }
        this.sendAll("");
        if (rest > 50) {
            for (p in members) {
                id = members[p];
                if (this.pyr.stamina[id] <= 0) {
                    continue;
                }
                if (!(id in stamina)) {
                    stamina[id] = 0;
                }
                stamina[id] -= ((2 + 3 * this.level) * Math.ceil((rest-50)/5));
            }
            this.sendAll("Only {0}% of the hazards have been cleared, so you struggled to reach the door due to the remaining hazards ({1})!".format(100-rest, readable(remaining, "and")));
        } else {
            this.sendAll("You cleared {0}% of the hazards, so reaching the door was piece of cake! Remaining hazards: {1}".format(100-rest, readable(remaining, "and")));
            points = Math.round((5 + 3 * this.level) * Math.ceil((50-rest)/5));
        }
        
        this.pyr.updateStatus(points, stamina, true);
        this.sendAll("");
        
        this.passed = true;
    };
    
    function EmptyRoom(pyramidRef, level, roomNum) {
        PyramidRoom.call(this, pyramidRef);
        this.midmsg = "Choose a Pokémon to help you explore the room to find the door.";
        this.defaultChoice = "ignore";
        this.level = level;
        
        var parties = pyramidRef.parties;
        for (var p in parties) {
            this.individualmsg[p] = "Send one of your Pokémon to explore the room: " + parties[p].map(pyrLink).join(", ") + " | Or do nothing with " + link("/pyr ignore");
        }
        
        var types = Object.keys(effectiveness).shuffle();
        this.traps = {};
        for (p = 0; p < 3; p++) {
            this.traps[types.shift()] = {
                stamina: -(8 + this.level * 8)
            };
        }
        this.treasures = {};
        var rew = {
            pack: { chance: 3 + level, item: "pack", amount: 1 },
            gem: { chance: 4 + level, item: "gem", amount: 1 },
            nugget: { chance: 3 + level, item: "nugget", amount: 1 },
            bignugget: { chance: 2 + level, item: "bignugget", amount: 1 },
            money: { chance: 2, item: "money", amount: 900 * level },
            money2: { chance: 8, item: "money", amount: 220 * level },
            silver: { chance: 7, item: "silver", amount: 3 * level },
            gacha: { chance: 12, item: "gacha", amount: 5 * level },
            dust: { chance: 14, item: "dust", amount: 10 * level },
            ultra: { chance: 15, item: "ultra", amount: 3 * level },
            myth: { chance: 14, item: "myth", amount: 2 * level },
            luxury: { chance: 14, item: "luxury", amount: 2 * level },
            heavy: { chance: 14, item: "heavy", amount: 2 * level },
            premier: { chance: 11, item: "premier", amount: 3 * level },
            pearl: { chance: 10, item: "pearl", amount: 2 + level },
            bigpearl: { chance: 8, item: "bigpearl", amount: 1 * level }
        };
        for (p = 0; p < 3; p++) {
            this.treasures[types.shift()] = randomSampleObj(rew);
        }
        
        var target, t1, t2, badTypes = Object.keys(this.traps);
        while (true) {
            target = sys.rand(1, 722);
            t1 = sys.type(sys.pokeType1(target));
            t2 = sys.type(sys.pokeType2(target));
            
            if (t2 !== "???" && (badTypes.contains(t1) || badTypes.contains(t2))) {
                break;
            }
        }
        
        this.sendAll("");
        this.sendAll("Room {0}-{1}: Other than a sign saying \"Pokémon like {2} are not recommended in this room\", there's nothing of interest in this room. Or is there?".format(level, roomNum, toColor(poke(target), "blue")));
        this.sendIndividuals();
        this.sendAll("");
    }
    EmptyRoom.prototype = new PyramidRoom();
    EmptyRoom.prototype.validInput = function(id, commandData) {
        return ["ignore", "nothing", "none", "go ahead", "keep going", "walk", "walk away"].contains(commandData.toLowerCase()) || this.pokeInParty(id, commandData);
    };
    EmptyRoom.prototype.advance = function() {
        var choices = this.getChoices(), id, p, points = 0, stamina = {}, t1, t2, hasTrap, hasTreasure, trapType, treasureType, out, reward, foundTreasure = {}, c, lazyPlayers = 0, players = 0;
        
        this.sendAll("");
        for (p in choices) {
            c = choices[p];
            players++;
            if (typeof c === "string" && ["ignore", "nothing", "none", "go ahead", "keep going", "walk", "walk away"].contains(c.toLowerCase())) {
                this.sendAll("<b>{0}</b> ignored the room and took a break!".format(p.toCorrectCase()));
                lazyPlayers++;
                continue;
            }
            id = c;
            t1 = sys.type(sys.pokeType1(id));
            t2 = sys.type(sys.pokeType2(id));
            
            hasTrap = false;
            hasTreasure = false;
            if (t1 in this.traps || t2 in this.traps) {
                hasTrap = true;
                if (t1 in this.traps && t2 in this.traps) {
                    trapType = sys.rand(0, 2) === 0 ? t1 : t2;
                } else {
                    trapType = t1 in this.traps ? t1 : t2;
                }
            }
            if (t1 in this.treasures || t2 in this.treasures) {
                hasTreasure = true;
                if (t1 in this.treasures && t2 in this.treasures) {
                    treasureType = sys.rand(0, 2) === 0 ? t1 : t2;
                } else {
                    treasureType = t1 in this.treasures ? t1 : t2;
                }
            }
            if (hasTrap && hasTreasure) {
                if (sys.rand(0, 2) === 0) {
                    hasTreasure = false;
                } else {
                    hasTrap = false;
                }
            }
            out = "But they found nothing...";
            reward = null;
            if (hasTrap) {
                stamina[p] = this.traps[trapType].stamina;
                foundTreasure[p] = -10 - 10 * this.level;
                out = "{0}'s {1} {3}! <b>{0}</b> lost <b>{2} Stamina</b>!".format(p.toCorrectCase(), poke(c), -stamina[p], toColor("triggered a trap", "red"));
            } else if (hasTreasure) {
                reward = this.treasures[treasureType];
                foundTreasure[p] = 16 + 16 * this.level;
                out = "{0}'s {1} {3}! <b>{0}</b> received <b>{2}</b>!".format(addFlashTag(p.toCorrectCase()), poke(c), treasureName(reward), toColor("found a treasure", "blue"));
            } else {
                stamina[p] = -2 * this.level - 1;
            }
            
            this.sendAll("<b>{0}</b> asked for their <b>{1}</b> to explore the room! {2}".format(p.toCorrectCase(), poke(c), out), true);
            if (reward) {
                getTreasure(p, reward);
            }
        }
        if (lazyPlayers >= players) {
            for (p in choices) {
                stamina[p] = -4 * this.level - 4;
            }
            this.sendAll("After arguing why no one went to look for the door, the entire team decided to split up in order to find it at the cost of {0} Stamina each.".format(-stamina[p]), true);
        }
        for (p in foundTreasure) {
            points += foundTreasure[p];
        }
        
        this.pyr.updateStatus(points, stamina, true);
        this.sendAll("");
        
        this.passed = true;
    };
    
    /* Events */
    function SafariEvent(src) {
        this.hostName = sys.name(src);
        this.eventName = "Safari Event";
        this.signups = [];
        this.forbiddenPlayers = [];
        this.viewers = [];

        this.turn = -1;
        this.turnLength = 6;
        this.minPlayers = 1;
        this.signupsDuration = 6;
        this.finished = false;
        this.eventCommands = {};
        this.rewardName = "";
        
        this.allowRejoin = false;
        this.joinmsg = "Type " + link("/signup") + " to participate!";
    }
    SafariEvent.prototype.setupEvent = function() {};
    SafariEvent.prototype.nextTurn = function() {
        this.turn++;
        var duration = this.signupsDuration;
        if (this.turn < duration) { //Sign-up Phase
            if (this.turn == Math.round(duration/2)) {
                sys.sendAll("", safchan);
                safaribot.sendHtmlAll("A <b>" + this.eventName + "</b> event is starting in " + ((duration - Math.round(duration/2)) * this.turnLength) + " seconds! " + this.joinmsg, safchan);
                sys.sendAll("", safchan);
            }
        }
        else if (this.turn === duration) { //Setup
            if (this.signups.length < this.minPlayers) {
                safaribot.sendHtmlAll("The " + this.eventName + " event was cancelled due to the low number of participants!", safchan);
                this.finished = true;
                return;
            }
            this.setupEvent();
        }
        else {
            this.playTurn();
        }
    };
    SafariEvent.prototype.playTurn = function() {

    };
    SafariEvent.prototype.finish = function() {
        this.finished = true;
    };
    SafariEvent.prototype.log = function(finished, winners, extra) {
        sys.appendToFile(eventLog, now() + "|||" + this.eventName + "|||" + this.hostName + "|||" + this.signups.join(", ") + "|||" + finished + "|||" + (Array.isArray(winners) ? (winners.length > 0 ? winners.join(", ") : "None") : winners) + "|||" + this.rewardName + "|||" + (extra || "N/A") + "\n");
    };
    SafariEvent.prototype.handleCommand = function(src, command, commandData) {
        this.eventCommands[command].call(this, src, commandData);
    };
    SafariEvent.prototype.join = function(src, data) {
        if (this.turn >= this.signupsDuration) {
            safaribot.sendMessage(src, "The " + this.eventName + " is already underway, you can't join now!", safchan);
            return;
        }
        var player = getAvatar(src);
        var name = sys.name(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter Safari to join this event!", safchan);
            return;
        }
        if (cantBecause(src, "join an event", ["auction", "battle", "tutorial", "pyramid"])) {
            return;
        }
        if (this.forbiddenPlayers.contains(name.toLowerCase())) {
            safaribot.sendMessage(src, "You have been shoved from this event and is not allowed to join!", safchan);
            return;
        }
        var signupsLower = this.signups.map(function(x) { return x.toLowerCase(); });
        if (!this.allowRejoin) {
            if (signupsLower.contains(name.toLowerCase())) {
                safaribot.sendMessage(src, "You already joined the event!", safchan);
                return;
            }
        }

        if (this.canJoin && !this.canJoin(src, data)) {
            return;
        }
        var verb = signupsLower.contains(name.toLowerCase()) ? "rejoined" : "joined";
        if (verb === "rejoined") {
            if (this.onLeave) {
                this.onLeave(this.signups[signupsLower.indexOf(name.toLowerCase())]);
            }
        } else {
            this.signups.push(name);
        }
        
        var onJoinMsg = "";
        if (this.onJoin) {
            onJoinMsg = this.onJoin(name, data);
        }
        
        this.sendToViewers(name + " has " + verb + " the " + this.eventName + onJoinMsg + "!");
        safaribot.sendHtmlMessage(src, "You " + verb + " the " + this.eventName + onJoinMsg + "! To leave the event, type " + link("/unjoin") + "!", safchan);
    };
    SafariEvent.prototype.unjoin = function(src) {
        var player = getAvatar(src);
        if (!player) {
            safaribot.sendMessage(src, "You need to enter Safari to use this command!", safchan);
            return;
        }
        var signupsLower = this.signups.map(function(x) { return x.toLowerCase(); });
        var name = sys.name(src);
        if (!signupsLower.contains(name.toLowerCase())) {
            safaribot.sendMessage(src, "You didn't even join this event!", safchan);
            return;
        }
        if (this.turn >= this.signupsDuration) {
            safaribot.sendMessage(src, "The " + this.eventName + " is already underway, you can't unjoin now!", safchan);
            return;
        }
        var index = signupsLower.indexOf(name.toLowerCase());
        this.signups.splice(index, 1);
        if (this.onLeave) {
            this.onLeave(name);
        }
        this.sendToViewers(name + " has unjoined the " + this.eventName + "!");
        safaribot.sendMessage(src, "You unjoined the " + this.eventName + " event!", safchan);
    };
    SafariEvent.prototype.shove = function(src, target) {
        var signupsLower = this.signups.map(function(x) { return x.toLowerCase(); });
        if (!signupsLower.contains(target.toLowerCase())) {
            if (src) {
                safaribot.sendMessage(src, target.toCorrectCase() + " didn't join this event!", safchan);
            }
            return;
        }
        if (this.turn >= this.signupsDuration) {
            if (src) {
                safaribot.sendMessage(src, "The " + this.eventName + " is already underway, you can't shove anyone now!", safchan);
            }
            return;
        }
        var index = signupsLower.indexOf(target.toLowerCase());
        this.sendMessage(target, "You have been shoved from the event!");
        if (this.onLeave) {
            this.onLeave(this.signups[index]);
        }
        this.signups.splice(index, 1);
        if (src) {
            this.sendToViewers(sys.name(src) + " shoved " + target.toCorrectCase() + " from the " + this.eventName + "!");
        } else {
            this.sendToViewers(target.toCorrectCase() + " has been shoved from the " + this.eventName + "!");
        }
        this.forbiddenPlayers.push(target.toLowerCase());
    };
    SafariEvent.prototype.watchEvent = function(src) {
        if (this.turn < this.signupsDuration) {
            safaribot.sendHtmlMessage(src, "The " + this.eventName + " didn't start yet! " + this.joinmsg, safchan);
            return;
        }
        var name = sys.name(src);
        if (this.canWatch && !this.canWatch(src)) {
            return;
        }

        if (this.viewers.contains(name.toLowerCase())) {
            this.viewers.splice(this.viewers.indexOf(name.toLowerCase()), 1);
            this.sendToViewers(name + " stopped watching this " + this.eventName + "!");
            safaribot.sendMessage(src, "You are no longer watching the " + this.eventName + "!", safchan);
        } else {
            this.sendToViewers(name + " is watching this " + this.eventName + "!");
            this.viewers.push(name.toLowerCase());
            if (this.onWatch) {
                this.onWatch(src);
            }
        }
    };
    SafariEvent.prototype.canWatch = function(src) {
        var name = sys.name(src);
        var signupsLower = this.signups.map(function(x) { return x.toLowerCase(); });
        if (signupsLower.contains(name.toLowerCase())) {
            safaribot.sendMessage(src, "You are one of the participants, you can't watch/unwatch this event!", safchan);
            return false;
        }
        return true;
    };
    SafariEvent.prototype.sendMessage = function(name, msg, flashing, colored, nobot, androidAlt) {
        var id = sys.id(name);
        if (id) {
            if (androidAlt && sys.os(id) === "android") {
                msg = androidAlt;
            }
            if (msg === "" || nobot) {
                if (flashing) {
                    sys.sendHtmlMessage(id, toFlashing(msg, name), safchan);
                } else if (colored) {
                    sys.sendHtmlMessage(id, toColored(msg, name), safchan);
                } else {
                    sys.sendHtmlMessage(id, msg, safchan);
                }
            } else {
                if (flashing) {
                    safaribot.sendHtmlMessage(id, toFlashing(msg, name), safchan);
                } else if (colored) {
                    safaribot.sendHtmlMessage(id, toColored(msg, name), safchan);
                } else {
                    safaribot.sendHtmlMessage(id, msg, safchan);
                }
            }
        }
    };
    SafariEvent.prototype.sendToViewers = function(msg, flashing, colored, nobot) {
        var e;
        var list = removeDuplicates(this.signups.concat(this.viewers));
        for (e = 0 ; e < list.length; e++) {
            this.sendMessage(list[e], msg, flashing, colored, nobot);
        }
    };
    SafariEvent.prototype.isInEvent = function(name) {
        var signupsLower = this.signups.map(function(x) { return x.toLowerCase(); });
        return signupsLower.contains(name.toLowerCase());
    };

    function FactionWar(src, reward, team1, team2, inverted, reward2) {
        SafariEvent.call(this, src);
        this.eventName = (inverted ? "Inverted " : "") + "Faction War";

        this.team1Name = team1;
        this.team2Name = team2;
        this.team1Color = "red";
        this.team2Color = "blue";
        this.team1 = [];
        this.team2 = [];
        this.party1 = [];
        this.party2 = [];
        this.inverted = inverted;

        this.npcs = [];
        this.preferredTeams = {};
        this.playerTeams = {};

        this.reward = reward;
        this.diffRewards = reward2 && reward !== reward2;
        this.reward2 = this.diffRewards ? reward2 : reward;
        this.rewardName = translateStuff(reward);
        this.reward2Name = translateStuff(this.reward2);
        this.hasReward = true;

        this.team1Defeated = 0;
        this.team2Defeated = 0;
        this.suddenDeath = false;
        this.allowRejoin = true;

        this.joinmsg = "Type " + link("/signup " + this.team1Name) + ", " + link("/signup " + this.team2Name) + " or " + link("/signup") + " "  + " to participate! " + (this.diffRewards ? "Members of " + this.team1Name + " will receive <b>" + this.rewardName + "</b> if winning, members of " + this.team2Name + " will receive <b>" + this.reward2Name + "</b> if winning" : "Winners will receive <b>" + this.rewardName + "</b>") + "!";

        var joinCommand = "/signup";
        sys.sendAll("", safchan);
        if (this.diffRewards) {
            safaribot.sendHtmlAll(sys.name(src) + " is starting a <b>" + this.eventName + "</b> event! The teams are " + toColor(team1, this.team1Color) + " (Reward: <b>" + this.rewardName + "</b>) and " + toColor(team2, this.team2Color) + " (Reward: <b>" + this.reward2Name + "</b>)!", safchan);
        } else {
            safaribot.sendHtmlAll(sys.name(src) + " is starting a <b>" + this.eventName + "</b> event! The teams are " + toColor(team1, this.team1Color) + " and " + toColor(team2, this.team2Color) + ", and each player from the winning team will receive <b>" + this.rewardName + "</b>!", safchan);
        }
        safaribot.sendHtmlAll("Type " + link(joinCommand + " " + team1) + " or " + link(joinCommand + " " + team2) + " to join a side, or " + link(joinCommand) + " to join a random side (you have " + (this.signupsDuration * this.turnLength) + " seconds)!", safchan);
        sys.sendAll("", safchan);
    }
    FactionWar.prototype = new SafariEvent();
    FactionWar.prototype.setupEvent = function() {
        //SETUP TEAMS
        var teamSize = Math.ceil(Math.max(this.signups.length, 6)/2);

        var pickedSides = this.preferredTeams, name, e, overflow = [], changedTeams = {};
        for (e in pickedSides) {
            name = pickedSides[e];
            if (this.signups.contains(e)) {
                if (name == this.team1Name) {
                    if (this.team1.length < teamSize) {
                        this.team1.push(e);
                        changedTeams[e] = "you have been added to the " + toColor(this.team1Name, this.team1Color) + " side!";
                    } else {
                        overflow.push(e);
                    }
                } else if (name == this.team2Name) {
                    if (this.team2.length < teamSize) {
                        this.team2.push(e);
                        changedTeams[e] = "you have been added to the " + toColor(this.team2Name, this.team2Color) + " side!";
                    } else {
                        overflow.push(e);
                    }
                } else {
                    overflow.push(e);
                }
            }
        }

        var players = overflow.shuffle(), otherTeam, chosenTeam, chosenColor;
        while (players.length > 0) {
            name = players.shift();
            chosenTeam = pickedSides[name];
            if (this.team1.length >= teamSize) {
                this.team2.push(name);
                otherTeam = this.team2Name;
                chosenColor = this.team2Color;
            } else if (this.team2.length >= teamSize) {
                this.team1.push(name);
                otherTeam = this.team1Name;
                chosenColor = this.team1Color;
            } else {
                var randomTeam = Math.random() < 0.5 ? this.team1 : this.team2;
                otherTeam = randomTeam == this.team1 ? this.team1Name : this.team2Name;
                chosenColor = randomTeam == this.team1 ? this.team1Color : this.team2Color;
                randomTeam.push(name);
            }
            if (chosenTeam === "*") {
                changedTeams[name] = "you have been added to the " + toColor(otherTeam, chosenColor) + " side!";
            } else {
                changedTeams[name] = "you have been moved to the " + toColor(otherTeam, chosenColor) + " side because the " + chosenTeam + " side was full!";
            }
        }

        var i, len = this.team1.length, player, member;
        for (e = 0; e < len; e++) {
            name = this.team1[e];
            player = getAvatarOff(name);
            this.playerTeams[name] = [];
            for (i = 0; i < 6; i++) {
                member = { owner: name, id: player.party[i], score: 0, fought: false };
                this.party1.push(member);
                this.playerTeams[name].push(member);
            }
        }
        len = this.team2.length;
        for (e = 0; e < len; e++) {
            name = this.team2[e];
            player = getAvatarOff(name);
            this.playerTeams[name] = [];
            for (i = 0; i < 6; i++) {
                member = { owner: name, id: player.party[i], score: 0, fought: false };
                this.party2.push(member);
                this.playerTeams[name].push(member);
            }
        }

        var createFillerPlayer = function() {
            var name = "[NPC] " + generateName();
            var party = generateTeam();
            return { name: name, party: party };
        };

        var playerCount = this.signups.length;
        if (playerCount < 4) {
            this.hasReward = false;
        }

        while (playerCount < 6 || playerCount % 2 === 1) {
            var useSide1 = this.team1.length < this.team2.length;
            var team = useSide1 ? this.team1 : this.team2;
            var party = useSide1 ? this.party1 : this.party2;

            var npc = createFillerPlayer();

            if (!team.contains(npc.name) && !this.npcs.contains(npc.name)) {
                team.push(npc.name);
                this.npcs.push(npc.name);
                this.playerTeams[npc.name] = [];
                for (i = 0; i < 6; i++) {
                    member = { owner: npc.name, id: npc.party[i], score: 0, fought: false };
                    party.push(member);
                    this.playerTeams[npc.name].push(member);
                }
                playerCount++;
            }
        }

        this.party1.shuffle();
        this.party2.shuffle();
        this.battleSize = this.party1.length;

        this.sendToViewers("");
        safaribot.sendHtmlAll("The " + this.eventName + " is starting now! If you didn't join, you still can watch by typing " + link("/watch") + "!", safchan);
        this.sendToViewers("The teams have been defined! ");
        this.sendToViewers(toColor(this.team1Name, this.team1Color) + ": " + readable(this.team1.map(addFlashTag), "and"), true);
        this.sendToViewers(toColor(this.team2Name, this.team2Color) + ": " + readable(this.team2.map(addFlashTag), "and"), true);
        for (e in changedTeams) {
            this.sendMessage(e, addFlashTag(e) + ", " + changedTeams[e], true);
        }
        this.sendToViewers("Battles will start now!");
        this.sendToViewers("");
    };
    FactionWar.prototype.playTurn = function() {
        var p1, p2, result, e;

        for (e = 0; e < 3; e++) {
            p1 = this.party1[this.team1Defeated];
            p2 = this.party2[this.team2Defeated];

            result = this.runBattle(p1.id, p2.id, p1.owner, p2.owner);
            p1.fought = true;
            p2.fought = true;
            if (result === 1) {
                this.team2Defeated++;
                p1.score++;
            } else if (result === 2) {
                this.team1Defeated++;
                p2.score++;
            } else {
                this.team1Defeated++;
                this.team2Defeated++;
            }
            if (this.team1Defeated >= this.party1.length || this.team2Defeated >= this.party2.length) {
                break;
            }
        }
        this.sendToViewers("[" + toColor(this.team1Name, this.team1Color) + ": " + (this.party1.length - this.team1Defeated) + " Pokémon remaining] ["+ toColor(this.team2Name, this.team2Color) + ": " + (this.party2.length - this.team2Defeated) + " Pokémon remaining]");
        this.sendToViewers("");

        if (this.team1Defeated >= this.battleSize || this.team2Defeated >= this.battleSize) {
            if (this.team1Defeated !== this.team2Defeated) {
                this.finish();
            } else {
                if (!this.suddenDeath) {
                    this.sendToViewers("Both teams have been defeated at the same time! Starting sudden death mode!");
                    this.suddenDeath = true;
                } else {
                    this.sendToViewers("Winner still undefined, sudden death mode will continue!");
                }

                this.party1.push(this.party1.random());
                this.party2.push(this.party2.random());
            }
        }
    };
    FactionWar.prototype.runBattle = function(p1Poke, p2Poke, owner1, owner2) {
        var res = calcDamage(p1Poke, p2Poke, null, null, this.inverted);
        var name1 = owner1 + "'s " + poke(p1Poke);
        var name2 = owner2 + "'s " + poke(p2Poke);

        name1 = res.power[0] > res.power[1] ? "<b>" + toColor(name1, this.team1Color) + "</b>" : name1;
        name2 = res.power[1] > res.power[0] ? "<b>" + toColor(name2, this.team2Color) + "</b>" : name2;
        

        var result = name1 + " " + pokeInfo.icon(p1Poke) + " (" + res.power[0] + ") x (" + res.power[1] + ") "+ pokeInfo.icon(p2Poke) + " " + name2;
        if (res.power[0] == res.power[1]) {
            result += " <b>Draw</b>";
        }
        this.sendToViewers(result);

        var status = "Details (" + res.statName + "/Power/Type) | " + poke(p1Poke) + " (" + res.stat[0] + " / " + res.move[0] + " / " + res.bonusString[0] + "x) x " + poke(p2Poke) + " (" + res.stat[1] + " / " + res.move[1] + " / " + res.bonusString[1] + "x)";
        this.sendToViewers(toColor(status, "gray"));

        if (res.power[0] > res.power[1]) {
            return 1;
        }
        else if (res.power[1] > res.power[0]) {
            return 2;
        }
        else {
            return 0;
        }
    };
    FactionWar.prototype.finish = function() {
        var winner, loser;
        var rewName = this.team1Defeated > this.team2Defeated ? this.reward2Name : this.rewardName;
        var reward = this.team1Defeated > this.team2Defeated ? this.reward2 : this.reward;
        var rewardmsg = this.hasReward ? "Each player will receive " + rewName + "!" : "";
        if (this.team1Defeated > this.team2Defeated) {
            winner = this.team2;
            loser = this.team1;
            safaribot.sendHtmlAll("The " + toColor(this.team2Name, this.team2Color) + " (" + readable(winner, "and") + ") has won the Faction War! " + rewardmsg, safchan);
        } else {
            winner = this.team1;
            loser = this.team2;
            safaribot.sendHtmlAll("The " + toColor(this.team1Name, this.team1Color) + " (" + readable(winner, "and") + ") has won the Faction War! " + rewardmsg, safchan);
        }

        var mvp = [], mvpPoints = 0, e, i, teams = this.playerTeams, id, player, score, mon, totalPoints;

        for (e in teams) {
            id = sys.id(e);
            player = teams[e];
            score = [];
            totalPoints = 0;
            for (i = 0; i < player.length; i++) {
                mon = player[i];
                totalPoints += mon.score;
                score.push(poke(mon.id) + ": " + (mon.fought ? plural(mon.score, "point") : "Didn't fight"));
                if (mon.score >= mvpPoints) {
                    if (mon.score > mvpPoints) {
                        mvpPoints = mon.score;
                        mvp = [];
                    }
                    mvp.push(mon);
                }
            }
            this.sendMessage(e, "Your score: " + score.join(" | ") + " | Total: " + plural(totalPoints, "Point"));
        }
        if (mvp.length > 0) {
            this.sendToViewers("The MVP for this " + this.eventName + " was <b>" + readable(mvp.map(function(obj) { return addFlashTag(obj.owner) + "'s " + poke(obj.id); }), "and") + "</b> with " + plural(mvpPoints, "Point") + "!", true);
        }

        if (!this.hasReward) {
            this.sendToViewers("No records or rewards will be given due to the low number of participants!");
        } else {
            var name, len = winner.length, stuff, out;

            for (e = 0; e < len; e++) {
                name = winner[e];
                if (!this.npcs.contains(name)) {
                    player = getAvatarOff(name);
                    if (player) {
                        id = sys.id(name);
                        if (id) {
                            safaribot.sendMessage(id, "You received " + rewName + " for winning the event!", safchan);
                        }
                        
                        stuff = toStuffObj(reward.replace(/,/g, ":")),
                        out = giveStuff(player, stuff);
                        player.records.factionWins += 1;

                        for (i = 0; i < mvp.length; i++) {
                            if (mvp[i].owner == name) {
                                player.records.factionMVPs += 1;
                            }
                        }
                        safari.saveGame(player);
                    }
                }
            }
            rafflePlayers.save();
            len = loser.length;
            for (e = 0; e < len; e++) {
                name = loser[e];
                if (!this.npcs.contains(name)) {
                    player = getAvatarOff(name);
                    if (player) {
                        for (i = 0; i < mvp.length; i++) {
                            if (mvp[i].owner == name) {
                                player.records.factionMVPs += 1;
                            }
                        }
                        safari.saveGame(player);
                    }
                }
            }
        }
        this.rewardName = rewName;
        this.log(true, winner, "Teams: " + this.team1Name + (winner == this.team1 ? " (Winner)" : "") + " x " + this.team2Name + (winner == this.team2 ? " (Winner)" : "") + " / MVP: " + readable(mvp.map(function(obj) { return obj.owner + "'s " + poke(obj.id); })) + " with " + plural(mvpPoints, "Point"));
        this.finished = true;
    };
    FactionWar.prototype.canJoin = function(src) {
        var player = getAvatar(src);
        if (player.party.length < 6) {
            safaribot.sendMessage(src, "You must have a party with 6 Pokémon to join this event!", safchan);
            return false;
        }
        if (hasPokeInShop(src, true)) {
            return false;
        }
        if (this.inverted) {
            for (var e = 0; e < player.party.length; e++) {
                if (hasType(player.party[e], "Normal") && hasType(player.party[e], "???")) {
                    safaribot.sendMessage(src, "You cannot use a pure Normal-type Pokémon on " + an(this.eventName) + "!", safchan);
                    return false;
                }
            }
        }
        return true;
    };
    FactionWar.prototype.onJoin = function(name, data) {
        var pickedTeam = "";
        if (data.toLowerCase() == this.team1Name.toLowerCase()) {
            pickedTeam = " on the " + this.team1Name + " side";
            this.preferredTeams[name] = this.team1Name;
        } else if (data.toLowerCase() == this.team2Name.toLowerCase()) {
            pickedTeam = " on the " + this.team2Name + " side";
            this.preferredTeams[name] = this.team2Name;
        } else {
            this.preferredTeams[name] = "*";
        }
        return pickedTeam;
    };
    FactionWar.prototype.onLeave = function(name) {
        delete this.preferredTeams[name];
    };
    FactionWar.prototype.onWatch = function(src) {
        safaribot.sendMessage(src, "You are watching the " + this.eventName + "! The teams are: ", safchan);
        safaribot.sendHtmlMessage(src, toColor(this.team1Name, this.team1Color) + ": " + readable(this.team1, "and"), safchan);
        safaribot.sendHtmlMessage(src, toColor(this.team2Name, this.team2Color) + ": " + readable(this.team2, "and"), safchan);
        if (this.diffRewards) {
            safaribot.sendMessage(src, "Rewards for " + this.team1Name + ": " + this.rewardName + " | Rewards for " + this.team2Name + ": " + this.reward2Name, safchan);
        } else {
            safaribot.sendMessage(src, "Winners will receive " + this.rewardName + "!", safchan);
        }
    };

    function BFactory(src, reward1, reward2, reward3) {
        SafariEvent.call(this, src);
        this.eventName = "Battle Factory";
        this.minPlayers = 4;

        this.playerTeams = {};
        this.survivors = [];
        this.battles = [];
        this.lastByes = [];
        this.eliminationOrder = [];
        this.round = -1;
        
        this.currentMatch = 0;
        this.choices = {};
        this.opponents = {};
        this.resting = "";
        
        this.phase = "signup";
        this.subturn = 0;
        
        this.thirdPrize = false;
        this.thirdPlace = null;
        this.isThirdPlaceMatch = false;
        this.fightingForThird = [];

        this.reward1 = reward1;
        this.reward2 = reward2;
        this.reward3 = reward3;
        this.rewardName1 = translateStuff(reward1);
        this.rewardName2 = translateStuff(reward2);
        this.rewardName3 = translateStuff(reward3);
        
        this.rewardName = "1st: " + this.rewardName1 + (reward2 ? ", 2nd: " + this.rewardName2 : "") + (reward3 ? ", 3rd: " + this.rewardName3 : "");
        this.rewardNameB = "<b>1st:</b> " + this.rewardName1 + (reward2 ? ", <b>2nd:</b> " + this.rewardName2 : "") + (reward3 ? ", <b>3rd:</b> " + this.rewardName3 : "");
        this.hasReward = true;
        
        this.eventCommands = {
            choose: this.choosePokemon
        };
        
        var joinCommand = "/signup";
        this.joinmsg = "Type " + link(joinCommand) + " to participate! Rewards: " + this.rewardNameB + "!";

        sys.sendAll("", safchan);
        safaribot.sendHtmlAll(sys.name(src) + " is starting a <b>" + this.eventName + "</b> event with the following rewards: " + this.rewardNameB + "!", safchan);
        safaribot.sendHtmlAll("Type " + link(joinCommand) + " to participate (you have " + (this.signupsDuration * this.turnLength) + " seconds)!", safchan);
        sys.sendAll("", safchan);
    }
    BFactory.prototype = new SafariEvent();
    BFactory.prototype.setupEvent = function() {
        this.thirdPrize = this.signups.length > 6;
        
        for (var e = 0; e < this.signups.length; e++) {
            this.playerTeams[this.signups[e].toLowerCase()] = generateTeam(8, 450, 600, 1, null, true);
            this.survivors.push(this.signups[e].toLowerCase());
        }
        
        this.sendToViewers("");
        safaribot.sendHtmlAll("The " + this.eventName + " is starting now! If you didn't join, you still can watch by typing " + link("/watch") + "!", safchan);
        for (e in this.playerTeams) {
            this.sendMessage(e, "Parties have been formed! " + addFlashTag(e.toCorrectCase()) + ",  your team for this event is: ", true);
            this.sendMessage(e, this.playerTeams[e].map(pokeInfo.icon).join(" "));
        }
        this.sendToViewers("");
    };
    function toChooseLink(x) {
        return link("/choose " + poke(x), poke(x));
    }
    BFactory.prototype.playTurn = function() {
        if (this.phase === "signup") {
            this.phase = "prepare";
            this.sendToViewers("Battles will start soon, use this time to get used to your team!");
            return;
        }
        if (this.phase === "input") {
            this.subturn--;
            if (this.subturn === 3) {
                this.sendToViewers("Round " + (this.round + 1) + " Matches will start in 18 seconds!");
            }
            if (this.subturn > 0) {
                return;
            }
            this.phase = "match";
        }
        
        if (this.phase === "prepare") { //Create match-ups here
            this.prepareBattles();
        }
        else if (this.phase === "match") { //Run battles here
            this.nextMatch();
        }
        if (this.survivors.length === 1) { //Check if event is over here
            this.finish();
        }
    };
    BFactory.prototype.prepareBattles = function() {
        var players = this.survivors.concat().shuffle(), freePass, e, bat, det;
        this.resting = "";
        //Check if some player automatically advances to the next round due to odd number of players
        if (players.length % 2 === 1) {
            var canPass = [];
            for (e = 0; e < players.length; e++) {
                if (!this.lastByes.contains(players[e])) {
                    canPass.push(players[e]);
                }
            }
            if (canPass.length > 0) {
                freePass = canPass.random();
            } else {
                this.lastByes = [];
                freePass = players.random();
            }
            this.resting = freePass;
            players.splice(players.indexOf(freePass), 1);
            this.lastByes.push(freePass);
        }
        this.battles = [];
        var isFinal = this.survivors.length === 2;
        
        var prepareForThird = isFinal;
        if (this.round >= 0 && this.eliminationOrder[this.round].length === 1) {
            prepareForThird = false;
            this.thirdPlace = this.eliminationOrder[this.round][0];
        }
        if (prepareForThird) {
            var eliminated = this.eliminationOrder[this.round];
            this.battles.push([eliminated[0], eliminated[1]]);
            this.fightingForThird = [eliminated[0], eliminated[1]];
            this.isThirdPlaceMatch = true;
        }
        
        for (e = 0; e < players.length; e += 2) {
            this.battles.push([players[e], players[e+1]]);
        }
        
        this.round++;
        this.sendToViewers("");
        this.sendToViewers(toColor("*** *************************************************** ***", "peru"), false, false, true);
        
        var roundTable = "<table cellpadding=2 cellspacing=0 style='margin-left: 50px'><tr><th colspan=" + (isFinal ? 4 : 3) + ">Round " + (this.round + 1) + "</b></th></tr>";
        var androidTable = ["<br/>Round " + (this.round + 1)];
        for (e = 0; e < this.battles.length; e++) {
            bat = this.battles[e];
            det = "";
            if (prepareForThird && e === 0) {
                det = "Third Place Match: ";
            } else if (isFinal) {
                det = toColor("Final: ", "red");
            }
            
            roundTable += "<tr>" + (det ? "<td align=right><b>" + det + "</b></td>" : "") + "<td align=right>" + addFlashTag(bat[0].toCorrectCase()) + "</td> <td align=center>" + toColor("vs", "gray") + "</td> <td align=left>" + addFlashTag(bat[1].toCorrectCase()) + "</td></tr>";
            androidTable.push(det + addFlashTag(bat[0].toCorrectCase()) + " " + toColor("vs", "gray") + " " + addFlashTag(bat[1].toCorrectCase()));
        }
        if (freePass) {
            roundTable += "<tr><td align=center colspan=" + (isFinal ? 4 : 3) + ">" + addFlashTag(freePass.toCorrectCase()) + " advances to the next round!</td></tr>";
            androidTable.push(addFlashTag(freePass.toCorrectCase()) + " advances to the next round!");
        }
        roundTable += "</table>";
        this.sendToViewers(roundTable, true, false, true, androidTable.join("<br/>"));
        
        this.sendToViewers("");
        this.sendToViewers(toColor("*** *************************************************** ***", "peru"), false, false, true);
        
        this.choices = {};
        this.opponents = {};
        for (e = 0; e < this.battles.length; e++) {
            bat = this.battles[e];
            
            this.sendMessage(bat[0], "Your opponent (" + bat[1].toCorrectCase() + ")'s Team: " + this.playerTeams[bat[1]].map(pokeInfo.icon).join(" "));
            this.sendMessage(bat[0], "Use /choose to pick 3 of your Pokémon for this battle (you have 36 seconds): " + this.playerTeams[bat[0]].map(toChooseLink).join(", "));
            
            this.sendMessage(bat[1], "Your opponent (" + bat[0].toCorrectCase() + ")'s Team: " + this.playerTeams[bat[0]].map(pokeInfo.icon).join(" "));
            this.sendMessage(bat[1], "Use /choose to pick 3 of your Pokémon for this battle (you have 36 seconds): " + this.playerTeams[bat[1]].map(toChooseLink).join(", "));
            
            this.choices[bat[0]] = [];
            this.choices[bat[1]] = [];
            this.opponents[bat[0]] = bat[1];
            this.opponents[bat[1]] = bat[0];
        }
        this.sendToViewers("");
        
        this.currentMatch = 0;
        this.eliminationOrder.push([]);
        this.phase = "input";
        this.subturn = 6;
    };
    BFactory.prototype.nextMatch = function() {
        var bat = this.battles[this.currentMatch], res, p1 = bat[0], p2 = bat[1], p1Poke, p2Poke, r, points1 = 0, points2 = 0;
            
        var team1 = this.choices[p1];
        var team2 = this.choices[p2];
        
        var roundName = "Round " + (this.round + 1) + ", Match " + (this.currentMatch + 1) + ": ";
        if (this.isThirdPlaceMatch) {
            roundName = "Third Place Match: ";
        } else if (this.survivors.length === 2) {
            roundName = toColor("Final: ", "red");
        }
        
        this.sendToViewers("");
        this.sendToViewers(toColor(separator, "PaleVioletRed"));
        this.sendToViewers("<b>" + roundName + "</b>" + addFlashTag(p1.toCorrectCase()) + " x " + addFlashTag(p2.toCorrectCase()), true);
        while (team1.length < 3) {
            r = this.playerTeams[p1].random();
            if (!team1.contains(r)) {
                team1.push(r);
            }
        }
        while (team2.length < 3) {
            r = this.playerTeams[p2].random();
            if (!team2.contains(r)) {
                team2.push(r);
            }
        }
        for (var e = 0; e < 3; e++) {
            p1Poke = team1[e];
            p2Poke = team2[e];
            res = this.runBattle(p1Poke, p2Poke, p1.toCorrectCase(), p2.toCorrectCase());
            if (res === 1) {
                points1++;
            } else if (res === 2) {
                points2++;
            }
        }
        team1 = team1.shuffle();
        team2 = team2.shuffle();
        if (points1 === points2) {
            this.sendToViewers("");
            this.sendToViewers("Match winner still not defined! Going into tiebreak rounds!");
        }
        for (e = 0; e < 3 && points1 === points2; e++) {
            p1Poke = team1[e];
            p2Poke = team2[e];
            res = this.runBattle(p1Poke, p2Poke, p1.toCorrectCase(), p2.toCorrectCase());
            if (res === 1) {
                points1++;
            } else if (res === 2) {
                points2++;
            }
        }
        if (points1 === points2) {
            this.sendToViewers("Players are stalling! Match will be decided with a coin flip!", true);
            if (Math.random() < 0.5) {
                points1++;
            } else {
                points2++;
            }
        }
        
        var score = " with a score of <b>" + (points1 > points2 ? points1 + " x " + points2 : points2 + " x " + points1) + "</b>";
        var eliminated = this.eliminationOrder[this.round];
        if (this.isThirdPlaceMatch) {
            this.isThirdPlaceMatch = false;
            if (points1 > points2) {
                this.thirdPlace = p1;
                this.sendToViewers(addFlashTag(p1.toCorrectCase()) + " defeated " + addFlashTag(p2.toCorrectCase()) + score + " and got Third Place!", true);
            } else if (points2 > points1) {
                this.thirdPlace = p2;
                this.sendToViewers(addFlashTag(p2.toCorrectCase()) + " defeated " + addFlashTag(p1.toCorrectCase()) + score + " and got Third Place!", true);
            }
        }
        else {
            if (points1 > points2) {
                this.sendToViewers(addFlashTag(p1.toCorrectCase()) + " defeated " + addFlashTag(p2.toCorrectCase()) + score + "!", true);
                this.survivors.splice(this.survivors.indexOf(p2), 1);
                this.viewers.push(p2);
                eliminated.push(p2);
            } else {
                this.sendToViewers(addFlashTag(p2.toCorrectCase()) + " defeated " + addFlashTag(p1.toCorrectCase()) + score + "!", true);
                this.survivors.splice(this.survivors.indexOf(p1), 1);
                this.viewers.push(p1);
                eliminated.push(p1);
            }
        }
        this.sendToViewers(toColor(separator, "PaleVioletRed"));
        this.sendToViewers("");
        
        this.currentMatch++;
        if (this.currentMatch >= this.battles.length) {
            this.phase = "prepare";
        }
    };
    BFactory.prototype.runBattle = function(p1Poke, p2Poke, owner1, owner2) {
        var res = calcDamage(p1Poke, p2Poke);
        var name1 = owner1 + "'s " + poke(p1Poke);
        var name2 = owner2 + "'s " + poke(p2Poke);

        name1 = res.power[0] > res.power[1] ? "<b>" + name1 + "</b>" : name1;
        name2 = res.power[1] > res.power[0] ? "<b>" + name2 + "</b>" : name2;
        
        var result = name1 + " " + pokeInfo.icon(p1Poke) + " (" + res.power[0] + ") x (" + res.power[1] + ") "+ pokeInfo.icon(p2Poke) + " " + name2;
        if (res.power[0] == res.power[1]) {
            result += " <b>Draw</b>";
        }
        this.sendToViewers(result);

        var status = "Details (" + res.statName + "/Power/Type) | " + poke(p1Poke) + " (" + res.stat[0] + " / " + res.move[0] + " / " + res.bonusString[0] + "x) x " + poke(p2Poke) + " (" + res.stat[1] + " / " + res.move[1] + " / " + res.bonusString[1] + "x)";
        this.sendToViewers(toColor(status, "gray"));

        if (res.power[0] > res.power[1]) {
            return 1;
        }
        else if (res.power[1] > res.power[0]) {
            return 2;
        }
        else {
            return 0;
        }
    };
    BFactory.prototype.choosePokemon = function(src, commandData) {
        var name = sys.name(src).toLowerCase();
        if (this.phase === "signup") {
            this.sendMessage(name, "The event didn't even start yet!");
            return;
        }
        if (name === this.resting) {
            this.sendMessage(name, "You are not in any battle during this round!");
            return;
        }
        var choices = this.choices[name];
        if (!choices) {
            this.sendMessage(name, "Please wait for an opponent to choose your Pokémon!");
            return;
        }
        var team = this.playerTeams[name];
        var list = commandData.split(":"), info, id, e;
        if (list.length > 3) {
            this.sendMessage(name, "You can only choose up to 3 Pokémon for each match!");
            return;
        }
        var invalid = [];
        for (e = 0; e < list.length; e++) {
            info = getInputPokemon(list[e]);
            if (!info.num) {
                this.sendMessage(name, list[e] + " is not a valid Pokémon!");
                return;
            }
            id = info.id;
            if (!team.contains(id)) {
                invalid.push(info.name);
                continue;
            }
            if (choices.contains(id)) {
                choices.splice(choices.indexOf(id), 1);
            }
            choices.push(id);
            if (choices.length > 3) {
                choices.shift();
            }
        }
        if (invalid.length > 0) {
            this.sendMessage(name, "You don't have " + readable(invalid) + " available for this event! You can use " + team.map(toChooseLink) + "!");
        } else {
            this.sendMessage(name, "You picked " + toColor(readable(choices.map(poke)), "blue") + " for your match against " + this.opponents[name].toCorrectCase() + "!");
        }
    };
    BFactory.prototype.finish = function() {
        var winner = this.survivors[0];
        var runnerup = this.eliminationOrder[this.round][0];
        var thirdplace = this.thirdPlace;
        
        var winnerName = winner.toCorrectCase();
        var runnerupName = runnerup.toCorrectCase();
        var thirdplaceName = thirdplace ? thirdplace.toCorrectCase() : "";
        
        safaribot.sendHtmlAll("<b>" + toColor(winnerName, "blue") + "</b> won the <b>" + this.eventName + "</b> and received " + this.rewardName1 + "!", safchan);
        var player = getAvatarOff(winner), out, stuff;
        if (player) {
            stuff = toStuffObj(this.reward1.replace(/,/g, ":")),
            out = giveStuff(player, stuff);
            
            player.records.factoryFirst += 1;
            safari.saveGame(player);
            this.sendMessage(winner, "You " + out + "!");
        }
        
        safaribot.sendHtmlAll(runnerupName + " got the second place and received " + this.rewardName2 + "!", safchan);
        player = getAvatarOff(runnerup);
        if (player) {
            stuff = toStuffObj(this.reward2.replace(/,/g, ":")),
            out = giveStuff(player, stuff);
            
            player.records.factorySecond += 1;
            safari.saveGame(player);
            this.sendMessage(runnerup, "You " + out + "!");
        }
        
        if (thirdplace && this.thirdPrize && this.reward3) {
            safaribot.sendHtmlAll(thirdplaceName + " got the third place and received " + this.rewardName3 + "!", safchan);
            player = getAvatarOff(thirdplace);
            if (player) {
                stuff = toStuffObj(this.reward3.replace(/,/g, ":")),
                out = giveStuff(player, stuff);
                
                player.records.factoryThird += 1;
                safari.saveGame(player);
                this.sendMessage(thirdplace, "You " + out + "!");
            }
        } else {
            this.sendToViewers("No third place prize will be given due to the low number of participants!");
        }
        
        this.log(true, "1st: " + winnerName + ", 2nd: " + runnerupName + (thirdplace ? ", 3rd: " + thirdplaceName : ""));
        this.finished = true;
    };
    BFactory.prototype.canJoin = function(src) {
        var player = getAvatar(src);
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You can't join this event while tradebanned!", safchan);
            return false;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only join this event after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        return true;
    };
    BFactory.prototype.canWatch = function(src) {
        var name = sys.name(src);
        var signupsLower = this.survivors.map(function(x) { return x.toLowerCase(); });
        if (signupsLower.contains(name.toLowerCase())) {
            safaribot.sendMessage(src, "You are one of the participants, you can't watch/unwatch this event!", safchan);
            return false;
        }
        return true;
    };
    BFactory.prototype.onWatch = function(src) {
        safaribot.sendMessage(src, "You are watching the " + this.eventName + "! Current matches:", safchan);
        if (this.battles.length > 0) {
            for (var e in this.battles) {
                safaribot.sendMessage(src, this.battles[e][0].toCorrectCase() + " x " + this.battles[e][1].toCorrectCase(), safchan);
            }
        } else {
            safaribot.sendMessage(src, "Matches will be drawn in a few seconds.", safchan);
        }
    };
    BFactory.prototype.sendToViewers = function(msg, flashing, colored, nobot, androidAlt) {
        var e, players = this.phase === "signup" ? this.signups : this.survivors;
        var list = removeDuplicates(players.concat(this.viewers));
        for (e = 0 ; e < list.length; e++) {
            this.sendMessage(list[e], msg, flashing, colored, nobot, androidAlt);
        }
    };
    BFactory.prototype.isInEvent = function(name) {
        var signupsLower = this.signups.map(function(x) { return x.toLowerCase(); });
        var n = name.toLowerCase();
        return signupsLower.contains(n) && (this.phase === "signup" || (this.survivors.contains(n) || this.fightingForThird.contains(n)));
    };
    
    function Quiz(src, reward1, reward2, reward3) {
        SafariEvent.call(this, src);
        this.eventName = "Quiz";
        this.minPlayers = 3;
        this.turnLength = 5;
        this.signupsDuration = 8;
        
        this.round = 0;
        this.phase = "signup";
        this.points = {};
        this.answered = {};
        this.thirdPrize = false;
        
        this.currentQuestion = "";
        this.validAnswers = [];
        this.usedAnswers = [];
        this.playersAnswered = [];
        this.noSmeargle = false;

        this.reward1 = reward1;
        this.reward2 = reward2;
        this.reward3 = reward3;
        this.rewardName1 = translateStuff(reward1);
        this.rewardName2 = translateStuff(reward2);
        this.rewardName3 = translateStuff(reward3);
        
        this.rewardName = "1st: " + this.rewardName1 + (reward2 ? ", 2nd: " + this.rewardName2 : "") + (reward3 ? ", 3rd: " + this.rewardName3 : "");
        this.rewardNameB = "<b>1st:</b> " + this.rewardName1 + (reward2 ? ", <b>2nd:</b> " + this.rewardName2 : "") + (reward3 ? ", <b>3rd:</b> " + this.rewardName3 : "");
        this.hasReward = true;
        
        this.eventCommands = {
            answer: this.answer,
            ans: this.answer
        };
        
        var joinCommand = "/signup";
        this.joinmsg = "Type " + link(joinCommand) + " to participate! Rewards: " + this.rewardNameB + "!";

        sys.sendAll("", safchan);
        safaribot.sendHtmlAll(sys.name(src) + " is starting a <b>" + this.eventName + "</b> event with the following rewards: " + this.rewardNameB + "!", safchan);
        safaribot.sendHtmlAll("Type " + link(joinCommand) + " to participate (you have " + (this.signupsDuration * this.turnLength) + " seconds)!", safchan);
        sys.sendAll("", safchan);
    }
    Quiz.prototype = new SafariEvent();
    Quiz.prototype.setupEvent = function() {
        this.thirdPrize = this.signups.length > 6;
        
        for (var e = 0; e < this.signups.length; e++) {
            this.points[this.signups[e].toLowerCase()] = 0;
            this.answered[this.signups[e].toLowerCase()] = 0;
        }
        
        this.sendToViewers("");
        safaribot.sendHtmlAll("The " + this.eventName + " is starting now! If you didn't join, you still can watch by typing " + link("/watch") + "!", safchan);
        this.sendToViewers("Your goal is to answer each round's question with a Pokémon name . Use " + toColor("/ans [Pokémon]", "blue") + " for that!");
        this.sendToViewers("One answer per player, repeated answers and forms are not accepted. Event lasts for 10 rounds, fastest to answer gains more points.");
        this.sendToViewers("");
        this.phase = "preparing";
    };
    Quiz.prototype.playTurn = function() {
        if (this.phase === "answer2") {
            this.sendToViewers("Only 5 seconds remaining to answer!");
            this.phase = "answer3";
            return;
        }
        if (this.phase === "answer") {
            this.phase = "answer2";
            return;
        }
        if (this.round === 10) { //Check if event is over here
            this.finish();
            return;
        }
        if (this.phase === "preparing" || this.phase === "answer3") {
            this.sendToViewers((this.round === 0 ? "First" : "<b>Time's Over!</b> Next") + " question coming in 5 seconds!");
            this.phase = "question";
            return;
        }
        if (this.phase === "question") { //Prepare next question
            var list = [];
            this.validAnswers = [];
            for (var e = 1; e < 722; e++) {
                list.push(e);
            }
            
            var typesUsed = [], result, desc = [], e;
            do {
                result = this.filter(list.concat(), typesUsed);
            } while (result.list.length < 3);
            desc.push(result.desc);
            typesUsed.push(result.type);
            this.validAnswers = result.list;
            
            //Second parameter
            if (this.validAnswers.length > 15) {
                for (e = 0; e < 30; e++) {
                    result = this.filter(this.validAnswers.concat(), typesUsed);
                    if (result.list.length > 3 && result.list.length !== this.validAnswers.length) {
                        this.validAnswers = result.list.concat();
                        desc.push(result.desc);
                        typesUsed.push(result.type);
                        break;
                    }
                }
            }
            //Third parameter
            if (this.validAnswers.length > 12) {
                for (e = 0; e < 16; e++) {
                    result = this.filter(this.validAnswers.concat(), typesUsed);
                    if (result.list.length > 3 && result.list.length !== this.validAnswers.length) {
                        this.validAnswers = result.list.concat();
                        desc.push(result.desc);
                        typesUsed.push(result.type);
                        break;
                    }
                }
            }
            this.noSmeargle = false;
            for (e = 0; e < typesUsed.length; e++) {
                if (typesUsed[e] === "move") {
                    this.noSmeargle = true;
                    break;
                }
            }
            
            this.currentQuestion = cap(readable(desc));
            this.usedAnswers = [];
            this.playersAnswered = [];
            this.round++;
            this.sendToViewers("");
            this.sendToViewers("<b>Round " + this.round + "</b>: Use /ans [Pokémon] to say a Pokémon with these features: " + toColor(this.currentQuestion, "blue") + " (You have 15 seconds)!");
            this.sendToViewers("");
            this.phase = "answer";
        }
        
    };
    Quiz.prototype.filter = function(list, typesUsed) {
        var type, val2, val, desc;
        var types = {
            "start": 9,
            "end": 9,
            "move": 28,
            "type": 16,
            "bst": 3,
            "gen": 6,
            "height": 3,
            "weight": 3,
            "evolve": 2,
            "evolved": 2
        };
        do {
            type = ["start", "start", "end", "move", "type", "bst", "gen", "height", "weight", "evolve", "evolved"].random();
            type = randomSample(types);
            
        } while (type !== "move" && typesUsed.contains(type));
        
        switch (type) {
            case "start":
                val = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"].random();
                list = list.filter(function(x){
                    return sys.pokemon(x).toLowerCase()[0] === val;
                });
                desc = "starts with " + val.toUpperCase();
            break;
            case "end":
                val = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"].random();
                list = list.filter(function(x){
                    var n = sys.pokemon(x).toLowerCase();
                    return n[n.length-1] === val;
                });
                desc = "ends with " + val.toUpperCase();
            break;
            case "move":
                val = sys.rand(1, 622);
                list = list.filter(function(x){
                    return pokedex.getAllMoves(x).contains("" + val);
                });
                desc = "can learn " + sys.move(val);
            break;
            case "type":
                val = Object.keys(effectiveness).random();
                list = list.filter(function(x){
                    return hasType(x, val);
                });
                desc = "has " + val + " type";
            break;
            case "gen":
                val = generations.slice(1).random();
                list = list.filter(function(x){
                    return generation(x, true) === val;
                });
                desc = "is from the " + val + " region";
            break;
            case "bst":
                val = sys.rand(200, 515);
                val2 = sys.rand(val + 18, val + 98);
                list = list.filter(function(x){
                    return getBST(x) >= val && getBST(x) <= val2;
                });
                desc = "BST is between " + val + " and " + val2;
            break;
            case "weight":
                val = sys.rand(4, 125);
                val2 = sys.rand(val + 8, val + 70);
                list = list.filter(function(x){
                    return parseFloat(pokedex.getWeight(x)) >= val && parseFloat(pokedex.getWeight(x)) <= val2;
                });
                desc = "weight is between " + val + "~" + val2 + " kg / " + (val * 2.20462).toFixed(1) + "~" + (val2 * 2.20462).toFixed(1) + " lbs";
            break;
            case "height":
                val = sys.rand(2, 17);
                val2 = sys.rand(val + 3, val + 10);
                val = val/10;
                val2 = val2/10;
                list = list.filter(function(x){
                    return parseFloat(pokedex.getHeight(x)) >= val && parseFloat(pokedex.getHeight(x)) <= val2;
                });
                desc = "height is between " + val + "m and " + val2 + "m";
            break;
            case "evolve":
                val = chance(0.5) ? true : false;
                list = list.filter(function(x){
                    return (x in evolutions) === val;
                });
                desc = "can" + (val ? "" : "not")+ " evolve";
            break;
            case "evolved":
                val = chance(0.5) ? true : false;
                list = list.filter(function(x){
                    return (x in devolutions) === val;
                });
                desc = "is " + (val ? "" : "not ")+ "evolved";
            break;
        }
        return {
            list: list,
            type: type,
            val: val,
            desc: desc
        };
    };
    Quiz.prototype.answer = function(src, commandData) {
        var name = sys.name(src).toLowerCase();
        if (this.phase === "signup") {
            this.sendMessage(name, "The event didn't even start yet!");
            return;
        }
        if (["answer", "answer2", "answer3"].contains(this.phase) === false) {
            this.sendMessage(name, "Wait for the next question!");
            return;
        }
        if (this.playersAnswered.contains(name)) {
            this.sendMessage(name, "You already answered during this round! Wait for the next question!");
            return;
        }
        var info = getInputPokemon(commandData);
        if (!info.num) {
            this.sendMessage(name, "This is not a valid Pokémon!");
            return;
        }
        if (this.usedAnswers.contains(info.num)) {
            this.sendMessage(name, info.name + " was already answered!");
            return;
        }
        if (!this.validAnswers.contains(info.num)) {
            this.sendMessage(name, info.name + " doesn't fit all the criteria for this round (criteria required: " + this.currentQuestion + ")!");
            return;
        }
        if (this.noSmeargle && info.num === 235) {
            this.sendMessage(name, info.name + " is not allowed when the hints include moves!");
            return;
        }
        var pointsRange = [100, 85, 75, 60, 50, 40, 30, 20, 15, 12];
        var points = pointsRange[Math.min(this.playersAnswered.length, pointsRange.length-1)];
        this.playersAnswered.push(name);
        this.usedAnswers.push(info.num);
        this.points[name] += points;
        this.answered[name] += 1;
        
        this.sendToViewers(addFlashTag(name.toCorrectCase()) + " answered " + toColor(info.name, "blue") + " and got " + plural(points, "point") + "!", true);
    };
    Quiz.prototype.finish = function() {
        var ordered = Object.keys(this.points);
        var pts = this.points, ans = this.answered;
        ordered = ordered.sort(function(a, b) {
            if (pts[b] !== pts[a]) {
                return pts[b] - pts[a];
            } else {
                return ans[b] - ans[a];
            }
        });
        
        this.sendToViewers("");
        this.sendToViewers("<b>Final Score</b>: " + ordered.map(function(x) { return addFlashTag(x.toCorrectCase()) + " (" + plural(pts[x], "point") + ")"; }).join(", "), true);
        
        var winner = ordered[0];
        var runnerup = ordered[1];
        var thirdplace = ordered.length > 2 ? ordered[2] : "";
        
        var winnerName = winner.toCorrectCase();
        var runnerupName = runnerup.toCorrectCase();
        var thirdplaceName = thirdplace ? thirdplace.toCorrectCase() : "";
        
        safaribot.sendHtmlAll("<b>" + toColor(winnerName, "blue") + "</b> won the <b>" + this.eventName + "</b> and received " + this.rewardName1 + "!", safchan);
        var player = getAvatarOff(winner), out, stuff;
        if (player) {
            stuff = toStuffObj(this.reward1.replace(/,/g, ":")),
            out = giveStuff(player, stuff);
            
            player.records.quizFirst += 1;
            player.records.topQuizScore = Math.max(player.records.topQuizScore, pts[winner]);
            safari.saveGame(player);
            this.sendMessage(winner, "You " + out + "!");
        }
        
        safaribot.sendHtmlAll(runnerupName + " got the second place and received " + this.rewardName2 + "!", safchan);
        player = getAvatarOff(runnerup);
        if (player) {
            stuff = toStuffObj(this.reward2.replace(/,/g, ":")),
            out = giveStuff(player, stuff);
            
            player.records.quizSecond += 1;
            player.records.topQuizScore = Math.max(player.records.topQuizScore, pts[runnerup]);
            safari.saveGame(player);
            this.sendMessage(runnerup, "You " + out + "!");
        }
        
        if (thirdplace && this.thirdPrize && this.reward3) {
            safaribot.sendHtmlAll(thirdplaceName + " got the third place and received " + this.rewardName3 + "!", safchan);
            player = getAvatarOff(thirdplace);
            if (player) {
                stuff = toStuffObj(this.reward3.replace(/,/g, ":")),
                out = giveStuff(player, stuff);
                
                player.records.quizThird += 1;
                player.records.topQuizScore = Math.max(player.records.topQuizScore, pts[thirdplace]);
                safari.saveGame(player);
                this.sendMessage(thirdplace, "You " + out + "!");
            }
        } else {
            this.sendToViewers("No third place prize will be given due to the low number of participants!");
        }
        this.sendToViewers("");
        
        this.log(true, "1st: " + winnerName + ", 2nd: " + runnerupName + (thirdplace ? ", 3rd: " + thirdplaceName : ""));
        this.finished = true;
    };
    Quiz.prototype.canJoin = function(src) {
        var player = getAvatar(src);
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You can't join this event while tradebanned!", safchan);
            return false;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only join this event after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        return true;
    };
    Quiz.prototype.onWatch = function(src) {
        safaribot.sendHtmlMessage(src, "You are watching the " + this.eventName + "! <b>" + toColor("Please don't give hints or answers to the participants", "red") + "</b>!", safchan);
        if (["answer", "answer2", "answer3"].contains(this.phase)) {
            safaribot.sendMessage(src, "Current round's question: " + this.currentQuestion, safchan);
        }
    };
    
    function PokeRace(src, type, data) {
        SafariEvent.call(this, src);
        this.type = type;
        this.eventName = "Pokémon " + (type === "bet" ? "Bet " : "") + "Race";

        this.runners = {};
        this.bets = {};
        this.goal = 50;

        this.turnLength = 6;
        this.signupsDuration = 7;
        this.minPlayers = 1;
        this.allowRejoin = true;
        this.betList = [];
        this.payouts = {};
        
        var r;
        while (Object.keys(this.runners).length < 6) {
            r = sys.pokemon(sys.rand(1, 722));
            if (!(r in this.runners)) {
                this.runners[r] = 0;
            }
        }
        
        if (type === "bet") {
            
            this.minBet = data.minBet || 10;
            this.maxBet = data.maxBet || 1000;
            
            this.underdogPay = data.underdog || 8;
            this.favoritePay = data.favorite || 1.35;
            this.normalPay = data.normal || 4;
            
            this.bet = data.bet || "$1";
            this.reward = data.reward || "$1";
            
            this.betType = translateAsset(this.bet).type;
            
            this.item = this.betType === "item" ? translateAsset(this.bet).id : null;
            this.betRange = this.item ?  "<b>" + (this.minBet) + " and " + plural(this.maxBet, this.item) + "</b>" : "$" + addComma(this.minBet) + " and $" + addComma(this.maxBet);
            
            this.favorite = Object.keys(this.runners).random();
            do {
                this.underdog = Object.keys(this.runners).random();
            } while (this.underdog == this.favorite);
            
        } else {
            this.reward = data.reward;
            this.favorite = null;
            this.underdog = null;
            
            if (data.rewardUnderdog) {
                this.rewardUnderdog = data.rewardUnderdog;
                this.underdog = Object.keys(this.runners).random();
            }
            if (data.rewardFavorite) {
                this.rewardFavorite = data.rewardFavorite;
                do {
                    this.favorite = Object.keys(this.runners).random();
                } while (this.favorite == this.underdog);
            }
        }
        this.rewardObj = translateAsset(this.reward);
        this.rewardType = this.rewardObj.type;
        
        this.racersList = Object.keys(this.runners).map(function(x) {
            if (x == this.favorite) {
                return "<font color='red'>" + x + "</font> (Favorite)";
            } else if (x == this.underdog) {
                return "<font color='red'>" + x + "</font> (Underdog)";
            } else {
                return "<font color='red'>" + x + "</font>";
            }
        }, this);
        this.icons = {};
        for (var e in this.runners) {
            this.icons[e] = pokeInfo.icon(sys.pokeNum(e));
        }
        
        var joinCommand = "/signup";
        var betCommands = Object.keys(this.runners).map(function(x) {
            if (type === "bet") {
                return link(joinCommand + " " + x + ":" + this.minBet, null, true);
            } else {
                return link(joinCommand + " " + x);
            }
        }, this);

        if (type === "bet") {
            if (this.betType === this.rewardType && (this.betType === "money" || (this.betType === "item" && this.item === this.rewardObj.id))) {
                this.payoutmsg = "Favorite (" + this.favorite + ") " + this.favoritePay + "x, Underdog (" + this.underdog + ") " + this.underdogPay + "x, Others " + this.normalPay + "x";
                this.rewardName = "Favorite: {0}x / Underdog: {1}x / Normal: {2}x".format(this.favoritePay, this.underdogPay, this.normalPay);
            } else {
                var favPay, dogPay, norPay, val,
                    itemName = this.betType === "item" ? " " + finishName(this.item) : " $1",
                    betType = this.betType, rew = this.rewardObj;
                    
                var getPayout = function(value) {
                    if (value >= 1) {
                        return (rew.type !== "money" ? plural(value, rew.input) : "$" + addComma(value)) + " for each" + itemName;
                    } else {
                        val = Math.round(1/value);
                        return (rew.type !== "money" ? plural(1, rew.input) : "$" + addComma(1)) + " for each " + (betType === "money" ? "$" + addComma(val) : val + itemName );
                    }
                };
                
                favPay = getPayout(this.favoritePay);
                dogPay = getPayout(this.underdogPay);
                norPay = getPayout(this.normalPay);
                
                this.payoutmsg = "Favorite (" + this.favorite + ") " + favPay + ", Underdog (" + this.underdog + ") " + dogPay + ", Others " + norPay;
                this.rewardName = "Favorite: {0} / Underdog: {1} / Normal: {2}".format(favPay, dogPay, norPay);
            }
            this.joinmsg = "Bet with " + readable(betCommands, "or") + "! Bets must be between " + this.betRange + " (Payout: " + this.payoutmsg + ")";
        } else {
            this.joinmsg = "Join with " + readable(betCommands, "or");
            this.rewardName = translateStuff(this.reward);
            if (this.rewardFavorite || this.rewardUnderdog) {
                var extraRewards = [];
                if (this.rewardUnderdog) {
                    extraRewards.push(translateStuff(this.rewardUnderdog) + " if Underdog");
                }
                if (this.rewardFavorite) {
                    extraRewards.push(translateStuff(this.rewardFavorite) + " if Favorite");
                }
                this.rewardName += " (" + extraRewards.join(", ") + ")";
            }
        }
        
        sys.sendAll("", safchan);
        safaribot.sendHtmlAll(sys.name(src) + " is starting a <b>" + this.eventName + "</b> event! The contestants will be " + readable(this.racersList, "and") + "!", safchan);
        if (type === "bet") {
            safaribot.sendHtmlAll("Bets must be between " + this.betRange + "! Payouts are " + this.payoutmsg + "!", safchan);
            safaribot.sendHtmlAll("To place your bets, type " + readable(betCommands, "or") + " (you have " + (this.signupsDuration * this.turnLength) + " seconds)!", safchan);
        } else {
            safaribot.sendHtmlAll("Rewards: " + this.rewardName + "! To join, type " + readable(betCommands, "or") + " (you have " + (this.signupsDuration * this.turnLength) + " seconds)!", safchan);
        }
        sys.sendAll("", safchan);
    }
    PokeRace.prototype = new SafariEvent();
    PokeRace.prototype.setupEvent = function() {
        var e, bet;
        
        this.sendToViewers("");
        safaribot.sendHtmlAll("The " + this.eventName + " is starting now! If you didn't join, you still can watch by typing " + link("/watch") + "!", safchan);
        for (e in this.bets) {
            if (!this.signups.contains(e)) {
                delete this.bets[e];
            } else {
                bet = this.bets[e];
                if (this.type === "bet") {
                    this.betList.push(addColorTag(e) + " bets " + (this.item ? plural(bet.bet, this.item) : "$" + addComma(bet.bet)) + " on " + bet.racer + (bet.racer == this.favorite ? " (Favorite)" : (bet.racer == this.underdog ? " (Underdog)" : "") ));
                } else {
                    this.betList.push(addColorTag(e) + " bets on " + bet.racer + (bet.racer == this.favorite ? " (Favorite)" : (bet.racer == this.underdog ? " (Underdog)" : "") ));
                }
            }
        }
        this.sendToViewers("Bets: " + this.betList.join(", "), false, true);
        
        this.sendToViewers("Preparations are complete, the race will start shortly!");
        this.sendToViewers("");

    };
    PokeRace.prototype.playTurn = function() {
        var r, w, passed = [];
        this.sendToViewers("");
        for (r in this.runners) {
            switch (r) {
                case this.underdog:
                    w = sys.rand(1, 10);
                break;
                case this.favorite:
                    w = sys.rand(2, 11);
                break;
                default:
                    w = sys.rand(1, 11);
            }
            this.runners[r] += w;
            if (this.runners[r] >= this.goal) {
                passed.push(r);
            }
            this.sendToViewers(r + " advanced " + w + " spaces and is now at space " + this.runners[r] + "m!");
        }

        var line = [" | Goal | "], spaceUsed;
        for (w = this.goal-1; w >= 0; w--) {
            spaceUsed = false;
            for (r in this.runners) {
                if (this.runners[r] == w) {
                    line.push(this.icons[r]);
                    spaceUsed = true;
                }
            }
            if (spaceUsed) {
                line.push(w +"m ");
            }
            line.push("-");
        }
        line.push(" | Start | ");

        var runners = this.runners;
        passed = passed.sort(function(a, b) {
            return runners[b] - runners[a];
        }).map(function(x) {
            return this.icons[x] + this.runners[x] + "m";
        }, this);

        line = passed.concat(line);
        this.sendToViewers("<b>Standings</b>: " + line.join(""));
        this.sendToViewers("");

        var winners = [], highest = this.goal;
        for (r in this.runners) {
            if (this.runners[r] >= highest) {
                if (this.runners[r] > highest) {
                    highest = this.runners[r];
                    winners = [];
                }
                winners.push(r);
            }
        }

        if (winners.length > 0) {
            this.finish(winners);
        }
    };
    PokeRace.prototype.finish = function(winners) {
        this.sendToViewers("");
        this.sendToViewers(readable(winners.map(function(x){ return "<b>" + x + "</b>" + (x === this.favorite ? " (Favorite)" : "") + (x === this.underdog ? " (Underdog)" : ""); }, this), "and") + " won the " + this.eventName  + "!");

        var pwinners = [], player, r, bet, betStr = [], payments = [];

        for (r in this.bets) {
            bet = this.bets[r];
            if (winners.contains(bet.racer)) {
                pwinners.push(r);
            } else if (this.type === "bet"){
                player = getAvatarOff(r);
                if (player) {
                    if (this.item) {
                        player.balls[this.item] -= bet.bet;
                    } else {
                        player.money -= bet.bet;
                    }
                    safari.saveGame(player);
                    this.sendMessage(r, "You lost " + (this.item ? plural(bet.bet, this.item) : "$" + addComma(bet.bet)) + " from your losing bet!");
                }
            }
            if (this.type === "bet") {
                betStr.push(r + " (" + (this.item ? plural(bet.bet, this.item) : "$" + addComma(bet.bet)) + ")");
            }
        }

        if (pwinners.length > 0) {
            var payouts = this.payouts;
            var betType = this.type === "bet";
            this.sendToViewers("The following players placed a bet on the winner{0} and won the event: {1}".format((winners.length == 1 ? "" : "s"), readable(pwinners.map(function(x) { return "<b>" + addFlashTag(x) + "</b>" +  " (" + payouts[x.toLowerCase()] + ")"; }), "and")), true);

            var prize, name, bet, stuff, out, p, rewName, discarded;
            for (r = 0 ; r < pwinners.length; r++) {
                name = pwinners[r];
                bet = this.bets[name];
                
                if (betType) {
                    switch (bet.racer) {
                        case this.underdog:
                            prize = Math.floor(bet.bet * this.underdogPay);
                        break;
                        case this.favorite:
                            prize = Math.floor(bet.bet * this.favoritePay);
                        break;
                        default:
                            prize = Math.floor(bet.bet * this.normalPay);
                    }
                }

                player = getAvatarOff(name);
                if (player) {
                    if (betType) {
                        if (this.item) {
                            player.balls[this.item] -= bet.bet;
                            if (player.balls[this.item] < 0) {
                                player.balls[this.item] = 0;
                            }
                        } else {
                            player.money -= bet.bet;
                            if (player.money < 0) {
                                player.money = 0;
                            }
                        }
                        discarded = 0;
                        if (this.rewardType == "item") {
                            stuff = this.rewardObj;
                            
                            player.balls[stuff.id] += prize;
                            if (player.balls[stuff.id] > getCap(stuff.id)) {
                                discarded = player.balls[stuff.id] - getCap(stuff.id);
                                player.balls[stuff.id] = getCap(stuff.id);
                            }
                            if (stuff.id === "silver") {
                                player.records.pokeRaceSilver += prize;
                            }
                        } else if (this.rewardType == "poke") {
                            for (p = 0; p < prize; p++) {
                                player.pokemon.push(this.rewardObj.id);
                            }
                        } else {
                            player.money += prize;
                            if (player.money > moneyCap) {
                                player.money = moneyCap;
                            }
                            player.records.pokeRaceEarnings += prize - (this.item ? 0 : bet.bet);
                        }
                        player.records.pokeRaceWins += 1;
                        if (bet.racer == this.favorite) {
                            player.records.favoriteRaceWins += 1;
                        } else if (bet.racer == this.underdog) {
                            player.records.underdogRaceWins += 1;
                        }
                        if (this.item) {
                            this.sendMessage(name, "You paid " + plural(bet.bet, this.item) + " as your bet!");
                        } else {
                            this.sendMessage(name, "You paid $" + addComma(bet.bet) + " as your bet!");
                        }
                        rewName = (this.rewardType === "money" ? "$" + addComma(prize) : plural(prize, this.rewardObj.input));
                        if (discarded > 0) {
                            discarded = "But you didn't have enough space, so you had to discard " + plural(discarded, this.rewardObj.id) + "! ";
                        } else {
                            discarded = "";
                        }
                        this.sendMessage(name, "You received " + rewName + " for winning this event! " + discarded + (this.rewardType !== "poke" ? "You now have " + (this.rewardType === "money" ? "$" + addComma(player.money) : plural(player.balls[this.rewardObj.id],  this.rewardObj.id)) : "") + "!");
                        payments.push(name.toCorrectCase() + " (" + rewName + ")");
                    } else {
                        player.records.pokeRaceWins += 1;
                        
                        if (bet.racer == this.favorite) {
                            p = this.rewardFavorite;
                            player.records.favoriteRaceWins += 1;
                        } else if (bet.racer == this.underdog) {
                            p = this.rewardUnderdog;
                            player.records.underdogRaceWins += 1;
                        } else {
                            p = this.reward;
                        }
                        stuff = toStuffObj(p.replace(/,/g, ":"));
                        out = giveStuff(player, stuff);
                        if ("$" in stuff) {
                            player.records.pokeRaceSilver += stuff.$;
                        }
                        if ("@silver" in stuff) {
                            player.records.pokeRaceSilver += stuff["@silver"];
                        }
                        this.sendMessage(name, "You " + out + "!");
                        payments.push(name.toCorrectCase() + (this.rewardUnderdog || this.rewardFavorite ? " (" + translateStuff(stuff) + ")" : ""));
                    }
                    safari.saveGame(player);
                }
            }
        } else {
            this.sendToViewers("No one placed a winning bet on this " + this.eventName + "! Better luck next time!");
        }
        this.sendToViewers("");
        this.finished = true;
        this.log(true, payments, (this.type === "bet" ? "Bets: " + betStr.join(", ") : ""));
    };
    PokeRace.prototype.canJoin = function(src, data) {
        var player = getAvatar(src);
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You can't join this event while tradebanned!", safchan);
            return false;
        }
        var info = data.split(":");
        if (this.type === "bet" && info.length < 2) {
            safaribot.sendMessage(src, "Invalid format! Type /signup [Pokémon]:[Bet] to join!", safchan);
            return false;
        }
        var racer = getInputPokemon(info[0]);
        if (!racer.num) {
            safaribot.sendHtmlMessage(src, "This is not a valid Pokémon! Contestants are " + readable(this.racersList, "and") + "!", safchan);
            return false;
        }
        if (!this.runners.hasOwnProperty(racer.name)) {
            safaribot.sendHtmlMessage(src, racer.name + " is not participating in this race! Contestants are " + readable(this.racersList, "and") + "!", safchan);
            return false;
        }
        if (this.type === "bet") {
            var bet = parseInt(info[1], 10);
            if (!bet || isNaN(bet)) {
                safaribot.sendMessage(src, "Please type a valid bet!", safchan);
                return false;
            }
            if (bet < this.minBet || bet > this.maxBet) {
                safaribot.sendHtmlMessage(src, "Bets must be between " + this.betRange + "!", safchan);
                return false;
            }
            if (this.item && player.balls[this.item] < bet) {
                safaribot.sendMessage(src, "You don't have " + plural(bet, this.item) + " to bet!", safchan);
                return false;
            } else if (player.money < bet) {
                safaribot.sendMessage(src, "You don't have $" + addComma(bet) + " to bet!", safchan);
                return false;
            }
            if (this.item) {
                var input = "@" + this.item;
                if (input in player.shop && player.shop[input].limit > player.balls[this.item] - bet) {
                    safaribot.sendMessage(src, "You need to remove that item from your shop before betting it!", safchan);
                    return false;
                }
            }
        }

        return true;
    };
    PokeRace.prototype.onWatch = function(src) {
        safaribot.sendMessage(src, "You are watching the " + this.eventName + "!", safchan);
        safaribot.sendHtmlMessage(src, "Contestants: " + readable(this.racersList, "and"), safchan);
        if (this.type === "bet") {
            this.sendMessage(sys.name(src), "Bets: " + this.betList.join(", "), false, true);
        }
    };
    PokeRace.prototype.onJoin = function(name, data) {
        var info = data.split(":");
        var racer = getInputPokemon(info[0]).name;
        var bet = this.type === "bet" ? parseInt(info[1], 10) : 0;

        this.bets[name] = {
            bet: bet,
            racer: racer
        };
        var payout = 0;
        switch (racer) {
            case this.favorite:
                payout = bet * this.favoritePay;
                break;
            case this.underdog:
                payout = bet * this.underdogPay;
                break;
            default:
                payout = bet * this.normalPay;
        }
        payout = this.rewardType === "money" ? "$" + addComma(Math.floor(payout)) : plural(Math.floor(payout), this.rewardObj.input);
        if (this.type === "bet") {
            this.payouts[name.toLowerCase()] = payout;
            return " by betting " + (this.item ? plural(bet, this.item) : "$" + addComma(bet)) + " on " + racer + " (Payout: " + payout + ")";
        } else {
            this.payouts[name.toLowerCase()] = payout = translateStuff(this.getReward(racer));
            return " by betting on " + racer + " (Payout: " + payout + ")";
        }
    };
    PokeRace.prototype.getReward = function(racer) {
        if (racer == this.favorite) {
            return this.rewardFavorite;
        } else if (racer == this.underdog) {
            return this.rewardUnderdog;
        } else {
            return this.reward;
        }
    };
    PokeRace.prototype.onLeave = function(name) {
        delete this.bets[name];
    };

    /* System Functions */
    this.startGame = function(src, data) {
        if (getAvatar(src) || SESSION.users(src).smute.active) {
            safaribot.sendMessage(src, "You already have a starter pokémon!", safchan);
            return;
        }
        var id = sys.name(src).toLowerCase();
        if (!sys.dbRegistered(id)) {
            safaribot.sendMessage(src, "Please register your account before starting the game!", safchan);
            return true;
        }
        if (/[&<>'"]/gi.test(id)) {
            safaribot.sendMessage(src, "You can't start a game with a name that contains >, <, &, ' or \" !", safchan);
            return true;
        }
        if (id in Object || forbiddenNames.contains(id)) {
            safaribot.sendMessage(src, "You can't start a game with this name!", safchan);
            return true;
        }
        if (rawPlayers.get(id)) {
            safaribot.sendMessage(src, "You already have a save under that alt! Loading it instead.", safchan);
            this.loadGame(src);
            return;
        }
        
        var ip = sys.ip(src);
        var foundSaves = [];
        sys.aliases(ip).sort().forEach(function(n){
            if (hasSave(n)) {
                foundSaves.push(n);
            }
        });
        if (foundSaves.length > 0) {
            if (!allowedSharedIPNames.contains(id)) {
                safaribot.sendMessage(src, "You already have saves under the following names: " + foundSaves.join(", ") + ". Change your name to one of those to load them, or contact a Safari Auth if you have a reason to create a brand new save.", safchan);
                return;
            }
        }
        
        var num = getInputPokemon(data).num;
        if (!num || starters.indexOf(num) === -1) {
            safaribot.sendHtmlMessage(src, "Invalid Pokémon! Possible choices: " + starters.map(function (x) { x = sys.pokemon(x); return link("/start " + x, x); }).join(", "), safchan);
            return;
        }

        var player = JSON.parse(JSON.stringify(playerTemplate));

        player.id = id;
        player.pokemon.push(num);
        player.party.push(num);
        player.starter = num;

        player.lastLogin = getDay(now());
        player.altlog.push(id);
        player.tutorial.inTutorial = true;
        player.tutorial.step = 0;

        SESSION.users(src).safari = player;
        this.assignIdNumber(player);
        this.saveGame(player);
        idnumList.add(player.idnum, player.id);
        
        if (allowedSharedIPNames.contains(id)) {
            allowedSharedIPNames.splice(allowedSharedIPNames.indexOf(id), 1);
            permObj.add("allowedSharedIPs", JSON.stringify(allowedSharedIPNames));
        }
        
        tutorMsg(src, "Welcome to Safari! There are a lot of things to do around here and it may be very overwhelming! If you would like to learn how to play Safari you can use the command " + link("/tutorial") + " and start a guided tour around the facility!" /*If you would rather fend for yourself, you can use " + link("/skiptutorial") + " and get right to playing!"*/);
        safaribot.sendMessage(src, "You enter the Safari Zone with your " + poke(num) + " by your side!", safchan);
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
            if (player.tutorial.inTutorial) {
                this.progressTutorial(src);
            }
            if (player.pendingMessages.length > 0) {
                sys.sendMessage(src, "", safchan);
                safaribot.sendHtmlMessage(src, toFlashing(addFlashTag(sys.name(src)) + ", you received the following messages while offline: ", sys.name(src)), safchan);
                while (player.pendingMessages.length > 0) {
                    safaribot.sendMessage(src, player.pendingMessages[0], safchan);
                    player.pendingMessages.splice(0, 1);
                }
                sys.sendMessage(src, "", safchan);
            }
        } else if (getAvatar(src)) {
            SESSION.users(src).safari = null;
        }
    };
    this.offlineMessage = function(player, msg) {
        if (!player.hasOwnProperty("pendingMessages")) {
            player.pendingMessages = [];
        }
        player.pendingMessages.push(msg);
        this.saveGame(player);
    };
    this.updateLeaderboards = function() {
        leaderboards = {};

        var player, data, e, i, rec;
        for (e in leaderboardTypes) {
            leaderboards[e] = [];
        }
        for (e in monthlyLeaderboardTypes) {
            leaderboards[e + "Monthly"] = [];
        }
        for (e in rawPlayers.hash) {
            if (rawPlayers.hash.hasOwnProperty(e)) {
                if (e.toLowerCase() === "safari warden") {
                    continue;
                }
                data = JSON.parse(rawPlayers.hash[e]);
                if (data.removedFromLB) {
                    continue;
                }
                for (i in leaderboardTypes) {
                    player = {
                        name: e,
                        fullName: data.casedName || e,
                        color: data.nameColor || "#000000",
                        value: 0
                    };
                    if (data.hideLB && data.hideLB.contains(i)) {
                        continue;
                    }
                    rec = data.records;
                    switch (i) {
                        case "totalPokes":
                            player.value = data.pokemon.length;
                        break;
                        case "bst":
                            player.value = add(data.pokemon.map(getBST));
                        break;
                        case "earnings":
                            player.value = (rec.pokeSoldEarnings || 0) + (rec.luxuryEarnings || 0) + (rec.pawnEarnings || 0) + (rec.collectorEarnings || 0) + (rec.rocksWalletEarned || 0) + (rec.rocksWindowEarned || 0) - (rec.rocksWindowLost || 0) - (rec.rocksWalletLost || 0) + (rec.pokeRaceEarnings || 0) + (rec.pyramidMoney || 0);
                        break;
                        case "money":
                            player.value = data.money;
                        break;
                        case "salt":
                            player.value = data.balls.salt || 0;
                        break;
                        case "pyramidFinished":
                            player.value = data.records.pyramidLeaderClears + data.records.pyramidHelperClears || 0;
                        break;
                        case "pyramidScore":
                            player.value = Math.max(data.records.pyramidLeaderScore, data.records.pyramidHelperScore) || 0;
                        break;
                        default:
                            player.value = "records" in data ? (data.records[i] || 0 ): 0;
                        break;
                    }
                    if (player.value === 0 || isNaN(player.value)) {
                        continue;
                    }
                    leaderboards[i].push(player);
                }
                for (i in monthlyLeaderboardTypes) {
                    player = {
                        name: e,
                        fullName: data.casedName || e,
                        color: data.nameColor || "#000000",
                        value: 0
                    };
                    player.value = monthlyLeaderboards[i].get(e) || 0;
                    if (player.value === 0 || player.value == "0") {
                        continue;
                    }
                    player.value = parseInt(player.value, 10);
                    leaderboards[i + "Monthly"].push(player);
                }
            }
        }
        var byHigherValue = function(a, b) {
            return b.value - a.value;
        };
        for (e in leaderboards) {
            leaderboards[e].sort(byHigherValue);
        }
        for (e in monthlyLeaderboardTypes) {
            leaderboards[e + "Last"] = lastLeaderboards && lastLeaderboards.hasOwnProperty(e + "Last") ? lastLeaderboards[e + "Last"] : [];
        }
        var val, prev;
        for (e in leaderboards) {
            data = leaderboards[e];
            if (data.length > 0) {
                val = data[0].value;
                prev = 1;
                for (i = 0; i < data.length; i++) {
                    player = data[i];
                    if (player.value === val) {
                        player.pos = prev;
                    } else {
                        player.pos = prev = i + 1;
                        val = player.value;
                    }
                }
            }
        }
        lastLeaderboardUpdate = new Date().toUTCString();
    };
    this.addToMonthlyLeaderboards = function(name, record, value) {
        name = name.toLowerCase();
        var val = monthlyLeaderboards[record].get(name) || 0;
        if (typeof val != "number") {
            val = parseInt(val, 10);
            if (isNaN(val)) {
                val = 0;
            }
        }
        monthlyLeaderboards[record].add(name, val + value);
    };
    this.loadConfigurables = function() {
        var val;
        var loadArenaTeams = function(name) {
            val = configObj.get("arena_" + name);
            try {
                val = JSON.parse(val);
            } catch (err) { val = null; }
            if (Array.isArray(val)) {
                if (name in arenaOpponents) {
                    arenaOpponents[name].party = val;
                }
            }
        };
        loadArenaTeams("pink");
        loadArenaTeams("teal");
        loadArenaTeams("mustard");
        loadArenaTeams("cyan");
        loadArenaTeams("crimson");
        loadArenaTeams("rainbow");
        
        val = configObj.get("tier_chances");
        try {
            val = JSON.parse(val);
        } catch (err) { val = null; }
        if (Array.isArray(val)) {
            var valid = true;
            for (var e = 0; e < val.length; e++) {
                if (typeof val[e] !== "number") {
                    valid = false;
                    break;
                }
            }
            if (val.length < 6) {
                valid = false;
            }
            
            if (valid) {
                catchTierChance = val;
            }
        }
        
    };
    this.checkNewMonth = function() {
        var date = new Date().getUTCMonth();
        if (date != permObj.get("currentMonth")) {
            var old = {};
            for (var e in monthlyLeaderboards) {
                old[e + "Last"] = JSON.parse(JSON.stringify(leaderboards[e + "Monthly"]));
                monthlyLeaderboards[e].clear();
            }
            lastLeaderboards = old;
            permObj.add("lastLeaderboards", JSON.stringify(lastLeaderboards));
            permObj.add("currentMonth", date);
            permObj.save();
            this.updateLeaderboards();
        }
    };
    this.changeDailyBoost = function(data) {
        var randomNum, bst;

        if (data) {
            randomNum = getInputPokemon(data).num;
            bst = getBST(randomNum);
        }
        if (!randomNum) {
            do {
                randomNum = sys.rand(1, 722);
                bst = getBST(randomNum);

            } while (bst > 498 || isLegendary(randomNum));
        }

        var bonus = 1.78 - (318 - (498 - bst)) * 0.5 / 318;

        dailyBoost = {
            pokemon: randomNum,
            bonus: bonus,
            expires: now() + hours(24)
        };
        permObj.add("dailyBoost", JSON.stringify(dailyBoost));
        permObj.save();
        sys.sendAll(separator, safchan);
        safaribot.sendAll("The Boost-of-the-Day is now " + sys.pokemon(randomNum) + ", who will give a bonus catch rate of " + bonus.toFixed(2) + "x if used as your active Pokémon!", safchan);
        sys.sendAll(separator, safchan);
    };
    this.changeAlt = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var targetId = sys.id(data);
        if (!targetId) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return;
        }
        if (sys.ip(targetId) !== sys.ip(src)) {
            safaribot.sendMessage(src, "Both accounts must be on the same IP to switch!", safchan);
            return true;
        }
        this.transferAlt(sys.name(src), data, src);
    };
    this.transferAlt = function(name1, name2, user) {
        var player = getAvatarOff(name1);
        var target = getAvatarOff(name2);
        var n1 = name1.toLowerCase(), n2 = name2.toLowerCase();

        var src = sys.id(name1);
        var targetId = sys.id(name2);
        var byAuth = sys.name(user).toLowerCase() != name1.toLowerCase();

        if (!player) {
            safaribot.sendMessage(user, "There's no Safari data under the " + name1.toCorrectCase() + " name!", safchan);
            return;
        }
        if (name1.toLowerCase() == name2.toLowerCase()) {
            safaribot.sendMessage(user, "You can't pass it to the same alt!", safchan);
            return;
        }
        if (!sys.dbRegistered(name2.toLowerCase())) {
            safaribot.sendMessage(user, "That account isn't registered so you can't pass Safari data to them!", safchan);
            return true;
        }
        if (/[&<>'"]/gi.test(name2)) {
            safaribot.sendMessage(user, "You can't pass save data to a name with >, <, &, ' or \" !", safchan);
            return true;
        }
        if (name2 in Object || forbiddenNames.contains(name2)) {
            safaribot.sendMessage(user, "You can't pass save data to this name!", safchan);
            return true;
        }
        if (player.tradeban > now()) {
            if (!byAuth) {
                safaribot.sendMessage(user, "You can't pass save data while you are tradebanned!", safchan);
            } else {
                safaribot.sendMessage(user, "You can't pass save data while " + name1.toCorrectCase() + " is tradebanned!", safchan);
            }
            return true;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(user, "You can't pass save data during a contest!", safchan);
            return true;
        }
        if (preparationThrows.hasOwnProperty(n1)) {
            safaribot.sendMessage(user, "You can't pass save data while one of the players is preparing to throw a ball!", safchan);
            return true;
        }
        if (this.isBattling(name1)) {
            safaribot.sendMessage(user, "You can't pass save data while one of the players is in a battle!", safchan);
            return true;
        }
        if (this.isInAuction(name1)) {
            safaribot.sendMessage(user, "You can't pass save data while one of the players is participating in an auction!", safchan);
            return;
        }
        if (currentEvent && currentEvent.isInEvent(name1)) {
            safaribot.sendMessage(user, "You can't pass save data while one of the players is participating in an event!", safchan);
            return;
        }

        if (target) {
            if (target.tradeban > now()) {
                safaribot.sendMessage(user, "You can't pass save data to a tradebanned save!!", safchan);
                return true;
            }
            if (preparationThrows.hasOwnProperty(n2)) {
                safaribot.sendMessage(user, "You can't pass save data while one of the players is preparing to throw a ball!", safchan);
                return true;
            }
            if (this.isBattling(name2)) {
                safaribot.sendMessage(user, "You can't pass save data while one of the players is in a battle!", safchan);
                return true;
            }
            if (this.isInAuction(name2)) {
                safaribot.sendMessage(user, "You can't pass save data while one of the players is participating in an auction!", safchan);
                return;
            }
            if (currentEvent && currentEvent.isInEvent(name2)) {
                safaribot.sendMessage(user, "You can't pass save data while one of the players is participating in an event!", safchan);
                return;
            }
            var save1 = JSON.stringify(player);
            var save2 = JSON.stringify(target);
            cookedPlayers.add(player.id, save1);
            cookedPlayers.add(target.id, save2);
            try {
                for (var e in monthlyLeaderboards) {
                    if (monthlyLeaderboards[e].get(player.id)) {
                        var val = monthlyLeaderboards[e].get(player.id) || 0;
                        monthlyLeaderboards[e].add(player.id, monthlyLeaderboards[e].get(target.id) || 0);
                        monthlyLeaderboards[e].add(target.id, val);
                    }
                    else if (monthlyLeaderboards[e].get(target.id)) {
                        var val = monthlyLeaderboards[e].get(target.id) || 0;
                        monthlyLeaderboards[e].add(target.id, monthlyLeaderboards[e].get(player.id) || 0);
                        monthlyLeaderboards[e].add(player.id, val);
                    }
                }
                var tId = target.id;
                target.id = player.id;
                player.id = tId;

                if (target.altlog.indexOf(target.id) === -1) {
                    target.altlog.push(target.id);
                }
                if (player.altlog.indexOf(player.id) === -1) {
                    player.altlog.push(player.id);
                }

                if (src) {
                    SESSION.users(src).safari = target;
                    this.clearPlayer(src);
                    safaribot.sendMessage(src, "You swapped Safari data with " + name2.toCorrectCase() + "!", safchan);
                }
                if (targetId) {
                    SESSION.users(targetId).safari = player;
                    this.clearPlayer(targetId);
                    safaribot.sendMessage(targetId, "You swapped Safari data with " + name1.toCorrectCase() + "!", safchan);
                }
                if (byAuth) {
                    safaribot.sendMessage(user, "You swapped Safari between " + name1.toCorrectCase() + " and " + name2.toCorrectCase() + "!", safchan);
                }
                player.casedName = sys.name(targetId);
                player.nameColor = script.getColor(targetId);
                target.casedName = sys.name(src);
                target.nameColor = script.getColor(src);
                this.saveGame(player);
                this.saveGame(target);
            } catch (err) {
                if (byAuth) {
                    safaribot.sendMessage(user, "Alt Transfer aborted due to an error during the operation! [" + err + (err.lineNumber ? " at line " + err.lineNumber : "") + "]", safchan);
                    safaribot.sendAll("Alt Transfer aborted due to an error during the operation! [" + err + (err.lineNumber ? " at line " + err.lineNumber : "") + "]", staffchannel);
                } else {
                    safaribot.sendMessage(src, "Alt Change aborted due to an error during the operation!", safchan);
                    safaribot.sendAll("An Alt Change between " + name1.toCorrectCase() + " and " + name2.toCorrectCase() + " was aborted due to an error during the operation! [" + err + (err.lineNumber ? " at line " + err.lineNumber : "") + "]", staffchannel);
                }
                if (src) {
                    SESSION.users(src).safari = JSON.parse(save1);
                }
                if (targetId) {
                    SESSION.users(targetId).safari = JSON.parse(save2);
                }
                return;
            }
            if (lastBaiters.contains(n1) && !lastBaiters.contains(n2)) {
                lastBaiters.splice(lastBaiters.indexOf(n1), 1, n2);
            } else if (lastBaiters.contains(n2) && !lastBaiters.contains(n1)) {
                lastBaiters.splice(lastBaiters.indexOf(n2), 1, n1);
            }
            
            if (contestVotes) {
                var pVote = contestVotes[player.id], tVote = contestVotes[target.id];
                
                delete contestVotes[player.id];
                delete contestVotes[target.id];
                contestVotes[player.id] = tVote;
                contestVotes[target.id] = pVote;
            }
            
            rafflePlayers.add(player.id, player.balls.entry);
            rafflePlayers.add(target.id, target.balls.entry);
            rafflePlayers.save();

            if (saltBans.hash.hasOwnProperty(player.id) || saltBans.hash.hasOwnProperty(target.id)) {
                saltBans.add(player.id, player.truesalt);
                saltBans.add(target.id, target.truesalt);
                saltBans.save();
            }
            
            idnumList.add(player.idnum, player.id);
            idnumList.add(target.idnum, target.id);
            
            sys.appendToFile(altLog, now() + "|||" + name1 + " <--> " + name2 + "|||" + sys.name(user) + "\n");
        } else {
            var save1 = JSON.stringify(player);
            cookedPlayers.add(player.id, save1);
            try {
                if (src) {
                    SESSION.users(src).safari = null;
                }
                rawPlayers.remove(player.id);

                if (targetId) {
                    SESSION.users(targetId).safari = player;
                }
                for (var e in monthlyLeaderboards) {
                    if (monthlyLeaderboards[e].get(player.id)) {
                        monthlyLeaderboards[e].add(name2.toLowerCase(), monthlyLeaderboards[e].get(player.id));
                        monthlyLeaderboards[e].remove(player.id);
                    }
                }
                player.id = name2.toLowerCase();
                if (player.altlog.indexOf(player.id) === -1) {
                    player.altlog.push(player.id);
                }

                if (src) {
                    this.clearPlayer(src);
                }
                if (targetId) {
                    this.clearPlayer(targetId);
                }
                player.casedName = sys.name(targetId);
                player.nameColor = script.getColor(targetId);
                this.saveGame(player);
            } catch (err) {
                if (byAuth) {
                    safaribot.sendMessage(user, "Alt Transfer aborted due to an error during the operation! [" + err + (err.lineNumber ? " at line " + err.lineNumber : "") + "]", safchan);
                    safaribot.sendAll("Alt Transfer aborted due to an error during the operation! [" + err + (err.lineNumber ? " at line " + err.lineNumber : "") + "]", staffchannel);
                } else {
                    safaribot.sendMessage(src, "Alt Change aborted due to an error during the operation!", safchan);
                    safaribot.sendAll("An Alt Change between " + name1.toCorrectCase() + " and " + name2.toCorrectCase() + " was aborted due to an error during the operation! [" + err + (err.lineNumber ? " at line " + err.lineNumber : "") + "]", staffchannel);
                }
                if (src) {
                    SESSION.users(src).safari = JSON.parse(save1);
                }
                if (targetId) {
                    SESSION.users(targetId).safari = null;
                }
                return;
            }
            if (lastBaiters.contains(n1)) {
                lastBaiters.splice(lastBaiters.indexOf(n1), 1, n2);
            }
            
            rafflePlayers.add(player.id, player.balls.entry);
            rafflePlayers.remove(name1.toLowerCase());
            rafflePlayers.save();
            
            if (contestVotes) {
                var pVote = contestVotes[targetId];
                delete contestVotes[targetId];
                contestVotes[player.id] = pVote;
            }

            if (saltBans.hash.hasOwnProperty(name1.toLowerCase())) {
                saltBans.add(player.id, player.truesalt);
                saltBans.remove(name1.toLowerCase());
                saltBans.save();
            }
            
            idnumList.add(player.idnum, player.id);

            if (src) {
                safaribot.sendMessage(src, "You passed your Safari data to " + name2.toCorrectCase() + "!", safchan);
            }
            if (targetId) {
                safaribot.sendMessage(targetId, name1.toCorrectCase() + " passed their Safari data to you!", safchan);
            }
            if (byAuth) {
                safaribot.sendMessage(user, "You passed " + name1.toCorrectCase() + "'s Safari data to " + name2.toCorrectCase() + "!", safchan);
            }
            sys.appendToFile(altLog, now() + "|||" + name1 + " --> " + name2 + "|||" + sys.name(user) + "\n");
        }
    };
    this.logLostCommand = function(user, command, info) {
        sys.appendToFile(lostLog, now() + "|||" + user + "::" + command + "::" + (info || ".") + "\n");
    };
    this.clearPlayer = function(src) {
        var name = sys.name(src).toLowerCase();
        if (name in tradeRequests) {
            delete tradeRequests[name];
        }
        if (name in challengeRequests) {
            delete challengeRequests[name];
        }
        var player = getAvatar(src);
        if (player) {
            safari.sanitize(player);
            player.tutorial.privateWildPokemon = null;
            this.saveGame(player);
        }
    };
    this.saveShop = function() {
        permObj.add("npcShop", JSON.stringify(npcShop));
    };
    this.showLog = function(src, command, commandData, file, name, parser) {
        var log = sys.getFileContent(file);

        if (log) {
            log = log.split("\n");
            this.showLogList(src, command, commandData, log, name, parser);
        } else {
            safaribot.sendMessage(src, cap(name) + " Log not found!", safchan);
        }
    };
    this.showLogList = function(src, command, commandData, log, name, parser, html) {
        var info = commandData.split(":"),
            range = getRange(info[0]),
            term = info.length > 1 ? info[1] : "",
            limit = info.length > 2 && !isNaN(parseInt(info[2], 10)) ? parseInt(info[2], 10) : 100,
            e, query, termDesc;
        if (log.indexOf("") !== -1) {
            log.splice(log.indexOf(""), 1);
        }
        if (!range) {
            range = { lower: 1, upper: 10 };
        }
        log = getArrayRange(log.reverse(), range.lower, range.upper).reverse();

        if (term) {
            var queryMode = term.indexOf("||") < term.indexOf("&&") ? "&&" : "||";
            query = term.split(queryMode).map(function(x) { return x.trim(); }).filter(function(x) { return x.length > 0; });
            
            if (queryMode === "&&") {
                var queryStr = "^";
                for (e = 0; e < query.length; e++) {
                    queryStr += "(?=.*" + escapeRegExp(query[e]) + ")";
                }
                queryStr += ".+";
                var exp = new RegExp(queryStr, "i");
                for (e = log.length - 1; e >= 0; e--) {
                    if (!exp.test(log[e])) {
                        log.splice(e, 1);
                    }
                }
            } else {
                var queryStr = [];
                for (e = 0; e < query.length; e++) {
                    queryStr.push("(" + escapeRegExp(query[e]) + ")");
                }
                queryStr = queryStr.join("|");
                var exp = new RegExp(queryStr, "i");
                for (e = log.length - 1; e >= 0; e--) {
                    if (!exp.test(log[e])) {
                        log.splice(e, 1);
                    }
                }
            }
            termDesc = readable(query, queryMode === "&&" ? "and" : "or");
        }
        if (log.length <= 0) {
            safaribot.sendMessage(src, "No " + name + " log found for this query!", safchan);
        } else {
            var spliced = false;
            if (log.length > limit) {
                log = log.slice(log.length-limit, log.length);
                spliced = true;
            }
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, cap(name) + " Log (last " + (range.lower > 1 ? range.lower + "~" : "") + range.upper + " entries" + (term ? ", only displaying entries with the term" + (query.length > 1 ? "s" : "") + " " + termDesc : "") + "):", safchan);
            for (e in log) {
                if (!log[e]) {
                    continue;
                }
                if (html) {
                    safaribot.sendHtmlMessage(src, parser(log[e]), safchan);
                } else {
                    safaribot.sendMessage(src, parser(log[e]), safchan);
                }
            }
            if (spliced) {
                safaribot.sendMessage(src, "Only showing first " + limit + " entries found. Narrow down your search or use /" + command + " [Range]:[Query]:[Max Entries Displayed] for more results.", safchan);
            }
        }
        var more = range.upper - range.lower + (range.lower <= 1 ? 1 : 0);
        safaribot.sendHtmlMessage(src, link("/" + command + " " + range.upper + "-" + (range.upper + more) + (term ? ":" + term : "")), safchan);
        if (log.length > 0) {
            sys.sendMessage(src, "", safchan);
        }
    };
    this.applyTradeban = function(self, name, player, duration) {
        var chans = [safchan, staffchannel, sachannel];
        if (duration === 0) {
            player.tradeban = 0;
            for (var x in chans) {
                safaribot.sendAll(name + " has been unbanned from trading and shopping by " + self + "!", chans[x]);
            }
            safari.saveGame(player);
            tradeBans.remove(player.id);
        } else {
            var length, changing = player.tradeban > now();
            if (duration == -1) {
                length = "permanently";
                player.tradeban = 2147483000000;
            } else {
                length = "for " + utilities.getTimeString(duration);
                player.tradeban = now() + duration * 1000;
            }
            player.shop = {};
            safari.saveGame(player);
            for (var x in chans) {
                if (changing) {
                    safaribot.sendAll(name + "'s tradeban was changed by " + self + " and now they are banned from trading and shopping " + length + "!", chans[x]);
                } else {
                    safaribot.sendAll(name + " has been banned from trading and shopping " + length + " by " + self + "!", chans[x]);
                }
            }
            var id = sys.id(name);
            if (id) {
                for (var b in currentAuctions) {
                    currentAuctions[b].removePlayer(id);
                }
            }
            tradeBans.add(player.id, player.tradeban);
        }
        tradeBans.removeIf(function(obj, e) {
            return parseInt(obj.get(e), 10) === 0 || parseInt(obj.get(e), 10) < now();
        });
        tradeBans.save();
    };
    this.sanitize = function(player) {
        if (player) {
            var clean, i;
            var toTemplate = function(obj, prop, template) {
                var p;
                if (obj[prop] === undefined) {
                    if (Array.isArray(template[prop])) {
                        obj[prop] = [];
                    } else if (typeof template[prop] == "object") {
                        obj[prop] = {};
                        for (p in template[prop]) {
                            toTemplate(obj[prop], p, template[prop]);
                        }
                    } else {
                        obj[prop] = template[prop];
                    }
                } else {
                    if (!Array.isArray(obj[prop]) && typeof obj[prop] == "object" && typeof template[prop] == "object") {
                        for (p in template[prop]) {
                            if (!["shop", "decorations", "secretBase", "nextSpawn"].contains(p)) {
                                toTemplate(obj[prop], p, template[prop]);
                            }
                        }
                    }
                }
            };
            var removeInvalid = function(obj, prop, template) {
                var p;
                if (!(prop in template)) {
                    delete obj[prop];
                } else if (!Array.isArray(obj[prop]) && typeof obj[prop] == "object" && typeof template[prop] == "object") {
                    if (!["shop", "decorations", "secretBase", "nextSpawn"].contains(prop)) {
                        for (p in obj[prop]) {
                            removeInvalid(obj[prop], p, template[prop]);
                        }
                    }
                }
            };
            for (i in playerTemplate) {
                toTemplate(player, i, playerTemplate);
            }
            for (i in player) {
                removeInvalid(player, i, playerTemplate);
            }

            if (!Array.isArray(player.costumes)) {
               player.costumes = [];
            }

            for (i = 0; i < allItems.length; i++) {
                clean = allItems[i];
                if (typeof player.balls[clean] !== "number") {
                    player.balls[clean] = parseInt(player.balls[clean], 10);
                }
                if (isNaN(player.balls[clean]) || player.balls[clean] === null || player.balls[clean] < 0) {
                    if (clean == "box") {
                        player.balls[clean] = 4;
                    } else {
                        player.balls[clean] = 0;
                    }
                }
                var cap = getCap(clean);
                if (player.balls[clean] > cap) {
                    player.balls[clean] = cap;
                }
            }
            var redoBase = false;
            for (i in player.decorations) {
                if (!decorations.hasOwnProperty(i)) {
                    delete player.decorations[i];
                    redoBase = true;
                }
            }
            if (redoBase || player.secretBaseCache.length !== SECRET_BASE_WIDTH * SECRET_BASE_HEIGHT) {
                this.sanitizeBase(player);
            }

            if (typeof player.money !== "number") {
                player.money = parseInt(player.money, 10);
            }
            if (isNaN(player.money) || player.money < 0) {
                player.money = 0;
            } else if (player.money > moneyCap) {
                player.money = moneyCap;
            }
            if (player.money % 1 !== 0) {
                player.money = Math.floor(player.money);
            }
            if (player.party.length === 0) {
                player.party = [player.starter];
            }
            if (player.altlog.length === 0) {
                player.altlog.push(player.id);
            }
            for (i in player.shop) {
                if (!player.shop[i].price) {
                    delete player.shop[i];
                }
            }
            if (!("idnum" in player) || player.idnum === undefined || player.idnum === null || isNaN(player.idnum) || player.idnum < 0 || typeof player.idnum !== "number") {
                player.idnum = 0;
                this.assignIdNumber(player);
            }
            if (!player.costumes.contains(player.costume)) {
                player.costume = "none";
            }
            if (player.casedName.length === 0) {
                player.casedName = sys.name(sys.id(player.id));
            }
            if (player.nameColor.length === 0) {
                player.nameColor = script.getColor(sys.id(player.id));
            }

            if (player.starter2 === null || !Array.isArray(player.starter2) || player.starter2.length === 0) {
                player.starter2 = [];
                switch (player.starter) {
                    case 1: case 2: case 3: player.starter2 = [155, 156, 157]; break;
                    case 4: case 4: case 5: player.starter2 = [158, 159, 160]; break;
                    case 7: case 8: case 9: player.starter2 = [152, 153, 154]; break;
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
    this.sanitizeAll = function() {
        var onChannel = sys.playersOfChannel(safchan);
        var player;
        for (var e in onChannel) {
            player = getAvatar(onChannel[e]);
            if (!player) {
                continue;
            }
            safari.sanitize(player);
            safari.sanitizePokemon(player);
            safari.sanitizeBase(player);
            safari.saveGame(player);
        }
    };
    this.trackMessage = function(mess, player) {
        var id;
        for (var t = 0; t < player.trackers.length; t++) {
            id = sys.id(player.trackers[t]);
            if (id !== undefined && !allTrackers.contains(player.trackers[t])) {
                safaribot.sendMessage(id, mess, safchan);
            }
        }
        for (t = allTrackers.length; t--; ) {
            id = sys.id(allTrackers[t]);
            if (id) {
                safaribot.sendMessage(id, mess, safchan);
            }
        }
    };
    this.toursPromo = function (name, placing) {
        var player = getAvatarOff(name);
        if (!player) {
            return;
        }
        var rew;
        switch (placing) {
            case 1:
                player.balls.rare += 1;
                player.balls.gem += 1;
                player.balls.mega += 1;
                rew = plural(1, "mega") + ", " + plural(1, "rare") + ", " + plural(1, "gem");
            break;
            case 2:
                player.balls.rare += 1;
                player.balls.gem += 1;
                rew = plural(1, "rare") + ", " + plural(1, "gem");
            break;
            case 3:
                player.balls.gem += 1;
                rew = plural(1, "gem");
            break;
            default:
                return; //Only top 3 get. Nothing more than 3 should be passed anyway
        }
        if (!sys.id(name)) {
            this.offlineMessage(player, "You won " + rew + " from an Event Tour!");
        }
        this.sanitize(player);
        safaribot.sendHtmlAll("<b>" + getOrdinal(placing) + "</b>: " + html_escape(name.toCorrectCase()) + " <i>(" + rew + ")</i>", safchan);
    };
    this.isChannelAdmin = function (src) {
        return SESSION.channels(safchan).isChannelAdmin(src);
    };
    function runUpdate() {
        var POglobal = SESSION.global();
        var index, source;
        for (var i = 0; i < POglobal.plugins.length; ++i) {
            if ("safari.js" == POglobal.plugins[i].source) {
                source = POglobal.plugins[i].source;
                index = i;
            }
        }
        if (index !== undefined) {
            updateModule(source, function (module) {
                POglobal.plugins[index] = module;
                module.source = source;
                module.init();
            });
        }
    }
    function checkUpdate() {
        if (!needsUpdating) {
            return;
        }
        if (currentPokemon || contestCount > 0 || contestCooldown < 200 || currentAuctions.length > 0 || currentBattles.length > 0 || currentPyramids.length > 0 || currentEvent) {
            return;
        }
        safariUpdating = true;
        sys.sendHtmlAll(closedMessage, safchan);
        runUpdate();
    }
    
    /* Help & Commands */
    this["help-string"] = ["safari: To know the safari commands"];
    this.showHelp = function (src) {
        var x, help = [
            "",
            separator,
            "±Goal: Use your Pokéballs to catch Wild Pokémon that appear during contest times.",
            //"±Goal: You can trade those Pokémon with other players or simply brag about your collection.",
            "±Goal: To start playing, type /start to choose your starter Pokémon and receive 30 Safari Balls.",
            separator,
            //"±Contest: A contest starts every " + contestCooldownLength/60 + " minutes. During that time, wild Pokémon may suddenly appear.",
            "±Contest: When a wild Pokémon appears, players can use /catch to throw a ball until someone gets it.",
            "±Contest: Different balls can be used to get a better chance, but they also may have higher cooldown between throws or other effects.",
            separator,
            "±Actions: Pokémon you caught can be sold to the NPC with /sell or traded with other players with /trade.",
            "±Actions: You can use the money gained by selling Pokémon and logging in everyday to /buy more Pokéballs.",
            //"±Actions: You can set up to 6 Pokémon to be visible to anyone. Form your party with /party, and view others' party with /view.",
            "±Actions: Use /party to form your party. This can give you a small bonus when trying to catch Pokémon based on type effectiveness and stats.",
            "±Actions: You can dress up in costumes to gain different bonuses! Use /getcostumes to see how to obtain them and /dressup [costume name] to change into a costume!", 
            separator,
            "±More: To learn other commands, use /commands safari.",
            separator,
            ""
        ];
        for (x in help) {
            sys.sendMessage(src, help[x], safchan);
        }
    };
    this.showItemHelp = function (src, data) {
        if (data === "*") {
            safaribot.sendMessage(src, "You can use /itemhelp [item] to return information on a particular item, costume, or category. You can display the help for all items using \"/itemhelp all\" or from the following categories: \"balls\", \"items\", \"perks\".", safchan);
            return;
        }
        var help, help2;
        data = data.toLowerCase();
        var catStrings = ["all", "balls", "items", "perks", "costumes"];
        for (var e in costumeData) {
            if (costumeData.hasOwnProperty(e)) {
                costumeHelp[e] = costumeData[e].effect;
            }
        }

        if (catStrings.indexOf(data) === -1) {
            //Try to decode which item the user is looking for
            var lookup = itemAlias(data, true);
            if (allItems.indexOf(lookup) !== -1) {
                //Now grab the help from whichever category it is
                if (itemHelp.hasOwnProperty(lookup)) {
                    help = finishName(lookup) + ": " + itemHelp[lookup];
                } else if (itemData[lookup].type == "valuables") {
                    lookup = "valuables";
                    help = finishName(lookup) + ": " + itemHelp[lookup];
                } else if (perkHelp.hasOwnProperty(lookup)) {
                    help = finishName(lookup) + ": " + perkHelp[lookup];
                    help2 = "Note: This item is a Perk and the effects are passive.";
                } else if (ballHelp.hasOwnProperty(lookup)) {
                    help = finishName(lookup) + ": " + ballHelp[lookup];
                    help2 = "Note: Cooldown value doubles following a successful catch.";
                }
            } else {
                //If it's not an item, it's either a costume or invalid.
                lookup = costumeAlias(data, true);
                if (allCostumes.indexOf(lookup) !== -1) {
                    if (costumeHelp.hasOwnProperty(lookup)) {
                        help = costumeAlias(lookup, false, true) + " Costume: " + costumeHelp[lookup];
                    }
                }
            }

            //Frame out result
            if (!help) {
                safaribot.sendMessage(src, lookup + " is either an invalid item or no help string is defined!", safchan);
                return;
            }
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "*** Item Help ***", safchan);
            sys.sendMessage(src, help, safchan);
            if (help2) {
                sys.sendMessage(src, help2, safchan);
            }
            sys.sendMessage(src, "", safchan);
        } else {
            var x, dataArray, out = [];
            out.push("");
            if (data === "all" || data === "items") {
                out.push("*** Item Help ***");
                dataArray = Object.keys(itemHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(finishName(e) + ": " + itemHelp[e]);
                }
                out.push("");
            }
            if (data === "all" || data === "balls") {
                out.push("*** Ball Help ***");
                dataArray = Object.keys(ballHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(finishName(e)  + ": " + ballHelp[e]);
                }
                out.push("Note: Cooldown value doubles following a successful catch.");
                out.push("");
            }
            if (data === "all" || data === "perks") {
                out.push("*** Perk Help ***");
                dataArray = Object.keys(perkHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(finishName(e)  + ": " + perkHelp[e]);
                }
                out.push("Note: These items are Perks and the effects are passive.");
                out.push("");
            }
            if (data === "all" || data === "costumes") {
                out.push("*** Costume Help ***");
                dataArray = Object.keys(costumeHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(costumeAlias(e, false, true) + " Costume: " + costumeHelp[e]);
                }
                out.push("");
            }
            for (x in out) {
                sys.sendMessage(src, out[x], safchan);
            }
        }
    };
    this.showEventHelp = function (src) {
        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "*** EVENTS INFORMATION ***", safchan);
        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "Faction War: Players join one of the two teams to battle each other. Pokémon defeated are eliminated from the battle. The team that defeats the all Pokémon from the other side first wins.", safchan);
        sys.sendMessage(src, "Requirements: A full party (6 Pokémon). Minimum of 1 player for event to start, and 4 players for rewards. If Inverted Faction War, pure Normal-type Pokémon cannot be used.", safchan);

        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "Pokémon Race: 6 Pokémon compete in a race to the goal. Players can place bets for the winner to win the reward.", safchan);
        sys.sendMessage(src, "Requirements: None.", safchan);
        
        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "Pokémon Bet Race: 6 Pokémon compete in a race to the goal. Players can place bets for the winner to win a better payout. Favorite has a better chance of winning, but lower payout, while Underdog has a lower chance of winning but with a higher payout.", safchan);
        sys.sendMessage(src, "Requirements: Money, Silver Coins or Items to place the bet.", safchan);
        
        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "Battle Factory: Each player is given 8 rental Pokémon. Players then battle each other in a tournament using 3 of those 8 Pokémon on each match (they are sent in the order picked; if not enough Pokémon are selected, the rest will be picked randomly). Rewards are given to the 1st, 2nd and 3rd place.", safchan);
        sys.sendMessage(src, "Requirements: Have caught at least 4 Pokémon. Minimum of 4 players to start, and 7 for the 3rd place reward.", safchan);
        
        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "Quiz: On each round, a question is made and players must answer with a Pokémon. One answer per player, can't repeat answer within the round. Lasts for 10 rounds, rewards are given to the 1st, 2nd and 3rd place.", safchan);
        sys.sendMessage(src, "Requirements: Have caught at least 4 Pokémon. Minimum of 3 players to start, and 7 for the 3rd place reward.", safchan);
        sys.sendMessage(src, "", safchan);
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
            "/itemhelp [item or category]: Returns information on a particular item, costume, or category. You can display the help for all items using \"/itemhelp all\" or from the following categories: \"balls\", \"items\", \"perks\", \"costumes\".",
            "/start: To pick a starter Pokémon and join the Safari game. Valid starters are Bulbasaur, Charmander, and Squirtle.",
            "/catch [ball]: To throw a Safari Ball when a wild Pokémon appears. [ball] can be replaced with the name of any other ball you possess.",
            "/sell: To sell one of your Pokémon.",
            "/exchange: To exchange one of your Pokémon for Raffle Entries!",
            "/pawn: To sell specific items. Use /pawnall to sell all your pawnable items at once!",
            "/trade: To request a Pokémon trade with another player*. Use $200 to trade money and @luxury to trade items (use 3@luxury to trade more than 1 of that item).",
            "/buy: To buy items or Pokémon from an NPC.",
            "/shop: To buy items or Pokémon from a another player.",
            "/shopadd: To add items or Pokémon to your personal shop. Use /shopremove to something from your shop, /shopclose to remove all items at once or /shopclean to remove all items out of stock.",
            "/auction: To start an auction.",
            "/party: To add or remove a Pokémon from your party, set your party's leader*, or load a previously saved party. Type /party for more details.",
            "/quest: To view available quests.",
            "/box [number]: To view all your caught Pokémon organized in boxes. Use /boxt for a text-only version or /boxs for a text version with links to sell them.",
            "/bag: To view all money and items. Use /bagt for a text-only version.",
            "/costumes: To view your current costumes. Use /getcostume to check your records to see if you earned any new costumes!",
            "/changecostume [costume]: To change your costume to a new one. Can also use /dressup [costume].",
            "/base: To view another player's Secret Base.",
            "/editbase [decoration]։[Coordinate X]։[Coordinate Y]: To edit your Secret Base. Use /decorations to check what you can decorate it with.",
            "/view: To view another player's party. If no player is specified, all of your data will show up. You can also use /view on or /view off to enable/disable others from viewing your party/battles. Use /viewt for a text-only version of your data (excluding party).",
            "/challenge: To challenge another player to a battle.",
            "/watch: To watch someone else's battle.",
            "/changealt: To pass your Safari data to another alt.",
            "/bait: To throw bait in the attempt to lure a Wild Pokémon. Specify a ball type to throw that first.",
            "/evolve: Use a Candy Dusts to evolve a Pokémon*.",
            "/spray: Use a Devolution Spray to devolve a Pokémon*.",
            "/megastone: Use a Mega Stone to mega evolve a Pokémon*.",
            "/gacha: Use a ticket to win a prize!",
            "/finder: Use your item finder to look for items.",
            //seasonal change
            "/rock: To throw a rock at another player.",
            "/stick: To poke another player with your stick.",
            "/burn: To give a Burn Heal to another player.",
            "/use: To use a consumable item.",
            "/find [criteria] [value]: To find Pokémon that you have that fit that criteria. Type /find for more details. Use /findt for a text-only version or /finds for a text version with links to sell them.",
            "/sort [criteria] [ascending|descending]: To sort the order in which the Pokémon are listed on /mydata. Criteria are Alphabetical, Number, BST, Type and Duplicate.",
            "/bst [pokémon]: To view the BST of a Pokémon and price you can sell a Pokémon.",
            "/info: View global information like time until next contest, contest's theme, current Gachapon jackpot prize.",
            "/records: To view your records. Use \"/records earnings\" to show a break down of earnings by source.",
            "/leaderboard [type]: View the Safari Leaderboards. Type \"/leaderboard list\" to see all existing leaderboards.",
            // "/hidelb [type]: To hide yourself from a specific leaderboard.",
            "/flashme: Toggle whether or not you get flashed when a contest or event starts.",
            "/lastcontests: For information about the recent contests played.",
            "/themes: View available contest themes.",
            "/contestrules: For information about contest rules.",
            "/eventhelp: For a explanation about events like Faction War and Pokémon Race.",
            "/favorite [ball]: Sets your favorite ball. This will be thrown automatically if you do not specify a different ball to throw."
        ];
        var help = userHelp;
        var adminHelp = [
            "*** Safari Warden Commands ***",
            "/startevent [type]։[parameters]: Starts an event. Use /startevent help for more details. To cancel an event, use /abortevent.",
            "/sanitize [player]: Removes invalid values from the target's inventory, such as NaN and undefined. Use /sanitizeall to sanitize everyone in the channel at once.",            
            "/transferalt [name1]։[name2]: Changes Safari data between two players. Make sure they are the same person before using this.",
            "/allowname [name]: Allows/disallows a person to start a new Safari save while they share IP with another Safari Player.",
            "/tradeban [player]։[duration]: Bans a player from trading or using their shop. Use /tradeban [player]:[length]. Use -1 for length to denote permanent, 0 for length to unban. Use /tradebans to view players currently tradebanned.",
            "/salt [player]։[duration]: Reduces a player's luck to near 0 (unrelated to Salt item/leaderboard). Use /salt [player]:[length]. Use -1 for length to denote permanent, 0 for length to unban. Use /saltbans to view players currently saltbanned.",
            "/safariban [player]։[duration]: Bans a player from the Safari Channel. Use /safariunban [player] to unban and /safaribans to view players currently banned from Safari.",
            "/lbban [player]: Removes a player from all leaderboards.",
            "/analyze [player]։[lookup]: Returns the value of a specified property relating to a person's save. Lookup follows object notation, leave blank to return the entire save's data.",
            "/track [player]: Adds a tracker to a player that sends a message every time they attempt to bait and throw a ball. Useful to catch botters.",
            "/trick [player]։[pokemon]։[message]: Sends the designated player a fake wild Pokémon. Pokémon is optional, defaults to random. Message is an optional message such as \"Don't throw!\", defaults to nothing.",            
            "Log Files: Use /command [amount]։[lookup]։[limit] to return a list of logged data. Defaults to 10. Lookup will only return logs with the specified value in the past amount of logs (can use && or || for multiples terms). Limit will restrict the number of results displayed even if more than that is found (defaults to 100).",
            "Available logs: ***tradelog (trades), raretrades (trades involving legendaries, shinies or rare forms), shoplog (shop transactions), auctionlog (auctions), lostlog (actions that led to a Pokémon being lost), mythlog (rare spawns and Masterball usage), altlog (save transfers), eventlog (events), giftlog (gifts or values edited), showids (saves created with their idnum), misclog (other stuff)"
        ];
        var ownerHelp = [
            "*** Safari Owner Commands ***",
            "/contest[soft]: Force starts a Safari contest. Use /contestsoft to skip broadcasting to Tohjo Falls.",
            "/precontest: Enter the pre-contest phase. Use /skipcontest to cancel the pre-contest phase and skip the contest.",
            "/wild[event] [pokemon (optional)]։[amount]։[disguise]: Spawns a random or designated wild Pokémon with no restrictions. Use /wildevent for a spawn that cannot be caught with Master Balls. Amount must be between 1 and 4, else defaults to 1. Disguise is optional and makes the spawned Pokémon appear as something it is not.",
            "/horde: Spawns a group of random wild Pokémon with no restrictions. Use a valid dex number to spawn a specific Pokémon.",
            "/checkrate [item]: Displays the rate of obtaining that item from Gachapon, Itemfinder, and Prize Pack.",
            "/editdata [type]։[item]։[property]։[value]: Changes a property from an item/costume.",
            "/safaripay [player]։[amount]: Awards a player with the specified amount of money.",
            "/safarigift [player/player names]։[item]։[amount]: Gifts a player with any amount of an item or ball. You can send to multiple players at once if you separate each name with a comma or a comma and a space.",
            "/bestow [player]։[pokemon]: Gifts a player a specific Pokémon. Use /bestow [player]։[pokemon]։Remove to confiscate a Pokémon from a player.",
            "/forgerecord [player]։[record]։[amount]: Alters a specific record of a player.",
            "/wipesafari [player]: Wipes the targeted player's safari. Irreversable-ish.",
            "/loadsafari [JSON]: Creates a safari save with the specified JSON code.",
            "/findsaves: Lists all saves the Safari Game currently has data on.",
            "/checksaves [user1, user2, etc.]: Checks a list of users to see if they have a save file.",
            "/showids [amount]։[lookup]: Shows all players by their idnum. Use /reloadids to recreate the list if necessary.",
            "/updatelb: Manually updates the leaderboards.",
            "/newmonth: Manually verifies if the month changed to reset monthly leaderboards.",
            "/ongoing: To verify ongoing NPC Battles and Auction (use before updating Safari). Use /stopongoing to cancel all ongoing Battles and Auctions.",
            "/clearcd [player]։[type]: To clear a player's cooldown on a quest/ball throw/auction.",
            "/scare: Scares the wild Pokemon away. Use /glare for a silent action.",
            "/npc[add/remove] [item/pokemon]։[price]։[limit]: Adds or removes an item to the NPC shop with the provided arguments. Use /npcclose to clear the NPC shop or /npcclean to remove items out of stock.",
            "/addrecipe: Adds/edits a recipe for the Alchemist quest. Use /removerecipe [name] to remove a recipe and /showrecipes to view information about current recipes.",
            "/addraffle [pokemon]: Changes the current raffle prize to the specified Pokémon.",
            "/cancelraffle: Clears the current raffle prize. To completely cancel a raffle use /cancelraffle clearfile:[amount], where an optional refund amount can be specified to credit back raffle ticket holders.",
            "/checkraffle: To see the Raffle Tickets sold so far.",
            "/drawraffle confirm: Draws the current raffle.",
            "/dqraffle [player]։[refund]: Disqualifies a person from the current raffle by removing their name from the raffle players hash and by removing all their current entries. Refund is optional and will refund at the specified rate (Defaults to 0, or no refund).",
            "/disablequest [quest/all/long]: Disables specified quest, or all of them, or just long ones (Pyramid/Tower). Use /enablequest to re-enable. Updating the script will re-enable all quests.",
            "/updateafter [abort/cancel/stop]: Updates Safari at next available opportunity. Use any of the command data listed to cancel the pending update.",
            "/nextspawn [player]։[pokemon]։[amount]։[disguise]: Makes a player's next spawn equal to [amount] of [pokemon] diguised as [disguise]. Amount and Disguse are optional. Affects Bait and Gacha."
            //"/tourgift [1st], [2nd], [3rd]: Distributes current prize grid for Tournaments promotion to event winners. Please check save files and spelling before distributing prizes as undoing this takes a bit of effort!",
            //"/preptour [number, optional]: Checks the saves of the past number of event tours and provides an easy gifting link. If a name is not a valid save, it will be bolded and \"/tourgift\" will print to make substituting easy!"
        ];
        if (SESSION.channels(safchan).isChannelAdmin(src)) {
            help.push.apply(help, adminHelp);
        }
        if (SESSION.channels(safchan).isChannelOwner(src)) {
            help.push.apply(help, ownerHelp);
        }
        for (var x = 0; x < help.length; x++) {
            sys.sendMessage(src, help[x], channel);
        }
    };
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
        if (channel !== safchan && ["safariban", "safariunban"].indexOf(command) === -1) {
            return false;
        }
        if (SESSION.channels(safchan).muteall && !SESSION.channels(safchan).isChannelOwner(src)) {
            safaribot.sendMessage(src, "You can't play Safari while the channel is silenced.", safchan);
            return true;
        }

        //User commands
        if (!safariUpdating || SESSION.channels(safchan).isChannelOwner(src)) {
            if (command === "me" || command === "rainbow") {
                if (commandData === "*") {
                    return true; //retain server behavior
                }
                if (!SESSION.channels(safchan).isChannelOwner(src)) {
                    sys.sendAll(sys.name(src) + ": " + commandData, safchan);
                    return true;
                }
            }
            if (command === "tutorial") {
                var player = getAvatar(src);
                if (!player || !player.tutorial.inTutorial) {
                    return false;
                }
                safari.progressTutorial(src, player.tutorial.step, commandData);
                return true;
            }
            if (command === "skiptutorial") {
                var player = getAvatar(src);
                if (!player || !player.tutorial.inTutorial) {
                    return false;
                }
                safari.skipTutorial(src, commandData);
                return true;
            }
            if (command === "exchange") {
                if (true) {
                    safaribot.sendMessage(src, "Sorry, we are not exchanging anything right now! Please try again later.", safchan);
                    return true;
                }
                var values = {"Ditto": 1}; //Make this editable on server maybe
                var exchanged = Object.keys(values);
                if (commandData === "*") {
                    safaribot.sendMessage(src, "Welcome to the Safari Exchange System! You can connect with players around the world and send them your Pokémon to brighten their day. In return, you will receive some entries into the current raffle! If you have " + readable(exchanged, "or") + ", you could give it a try with \"/exchange [Pokémon]\"!", safchan);
                    return true;
                }
                var player = getAvatar(src);
                var input = commandData.split(":");
                var info = getInputPokemon(input[0]);
                var id = info.id;
                
                if (!exchanged.contains(info.name)) {
                    safaribot.sendMessage(src, "Sorry, only " + readable(exchanged, "and") + " can be exchanged right now!", safchan);
                    return true;
                }
                if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
                    var confirmCommand = "/exchange "+ sys.pokemon(id) + ":confirm";
                    safaribot.sendHtmlMessage(src, "You can exchange your " + info.name + " for " + plural(values[info.name], "Raffle Entry") + ". To confirm it, type <a href=\"po:send/" + confirmCommand + "\">" + confirmCommand + "</a>.", safchan);
                    return true;
                }
                
                if (!canLosePokemon(src, commandData, "exchange", true)) {
                    return true;
                }
                
                var restrictions = ["contest", "auction", "battle", "event", "tutorial", "pyramid"];
                var reason = "exchange a Pokémon";
                //Allow exchanging of pokemon that are not the lead if the rest of the party doesn't matter at that point
                if (player.party[0] === id) {
                    restrictions = restrictions.concat(["wild"]);
                    reason = "exchange your active Pokémon";
                }
                if (cantBecause(src, reason, restrictions)) {
                    return true;
                }
                
                player.balls.entry += values[info.name];
                rafflePlayers.add(player.id, player.balls.entry);
                rafflePlayers.save();
                safaribot.sendMessage(src, "You exchanged your " + info.name + " for " + plural(values[info.name], "Raffle Entry") + "! You now have " + plural(player.balls.entry, "Raffle Entry") + ".", safchan);
                this.removePokemon(src, id);
                this.logLostCommand(sys.name(src), "exchanged " + commandData);
                this.saveGame(player);
                return true;
            }
            if (command === "help") {
                safari.showHelp(src);
                return true;
            }
            if (command === "itemhelp") {
                safari.showItemHelp(src, commandData);
                return true;
            }
            if (command === "eventhelp") {
                safari.showEventHelp(src, commandData);
                return true;
            }
            if (command === "start") {
                safari.startGame(src, commandData);
                return true;
            }
            if (command === "catch" || command === "throw" || command === ccatch || command === ccatch2) {
                safari.throwBall(src, commandData, null, null, command);
                return true;
            }
            if (command === "sell") {
                safari.sellPokemon(src, commandData);
                return true;
            }
            if (command === "buy") {
                safari.buyFromShop(src, ":" + commandData, command, true);
                return true;
            }
            if (command === "getcostume" || command === "getcostumes") {
                safari.getCostumes(src);
                return true;
            }
            if (command === "shop") {
                safari.buyFromShop(src, commandData, command);
                return true;
            }
            var shopCommands = ["shopadd", "addshop", "shopremove", "removeshop", "closeshop", "shopclose", "cleanshop", "shopclean"];
            if (shopCommands.contains(command)) {
                var action = "remove";
                switch (command) {
                    case "shopadd":
                    case "addshop":
                        action = "add";
                        break;
                    case "shopclose":
                    case "closeshop":
                        action = "close";
                        break;
                    case "shopclean":
                    case "cleanshop":
                        action = "clean";
                        break;
                    case "shopremove":
                    case "removeshop":
                        action = "remove";
                        break;
                }
                safari.editShop(src, action + ":" + commandData);
                return true;
            }
            if (command === "pawn" || command === "pawnall") {
                safari.sellItems(src, command === "pawnall" ? "all" : commandData);
                return true;
            }
            if (command === "trade") {
                // safari.tradePokemon(src, commandData);
                safari.offerTrade(src, commandData);
                return true;
            }
            if (command === "auction") {
                safari.createAuction(src, commandData);
                return true;
            }
            if (command === "join") {
                safari.joinAuction(src, commandData);
                return true;
            }
            if (command === "bid") {
                safari.bidAuction(src, commandData);
                return true;
            }
            if (command === "leave") {
                safari.quitAuction(src, commandData);
                return true;
            }
            if (command === "signup") {
                if (currentEvent) {
                    currentEvent.join(src, commandData);
                } else {
                    safaribot.sendMessage(src, "There's no event going on!", safchan);
                }
                return true;
            }
            if (command === "unjoin") {
                if (currentEvent) {
                    currentEvent.unjoin(src);
                } else {
                    safaribot.sendMessage(src, "There's no event going on!", safchan);
                }
                return true;
            }
            if (command === "party") {
                safari.manageParty(src, commandData);
                return true;
            }
            if (command === "add") {
                safari.manageParty(src, "add:" + commandData);
                return true;
            }
            if (command === "remove") {
                safari.manageParty(src, "remove:" + commandData);
                return true;
            }
            if (command === "active") {
                safari.manageParty(src, "active:" + commandData);
                return true;
            }
            if (command === "qload") {
                safari.quickLoadParty(src, commandData);
                return true;
            }
            if (command === "view" || command === "mydata" || command === "viewt" || command === "mydatat") {
                if (command !== "view" || commandData === "*") {
                    safari.viewOwnInfo(src, (command === "viewt" || command === "mydatat"));
                } else {
                    safari.viewPlayer(src, commandData);
                }
                return true;
            }
            if (command === "bag" || command === "bagt") {
                safari.viewItems(src, command === "bagt");
                return true;
            }
            if (command === "box" || command === "boxt" || command === "boxs") {
                safari.viewBox(src, commandData, (command === "boxt" || command === "boxs"), command === "boxs");
                return true;
            }
            if (command === "costumes" || command === "costume") {
                safari.viewCostumes(src);
                return true;
            }
            if (command === "dressup" || command === "changecostume") {
                safari.changeCostume(src, commandData);
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
            if (command === "gbait" || command === "golden") {
                safari.throwBait(src, commandData, true);
                return true;
            }
            if (command === "rock" || command === "snowball" || command === "snow") {
                safari.throwRock(src, commandData);
                return true;
            }
            if (command === "stick") {
                safari.useStick(src, commandData);
                return true;
            }
            if (command === "burn") {
                safari.giveBurnHeal(src, commandData);
                return true;
            }
            if (command === "gacha") {
                safari.gachapon(src, commandData);
                return true;
            }
            if (command === "evolve") {
                safari.useCandyDust(src, commandData);
                return true;
            }
            if (command === "spray" || command === "devolve" || command === "devolution" || command === "devolutionspray") {
                safari.useSpray(src, commandData);
                return true;
            }
            if (command === "mega" || command === "megastone") {
                safari.useMegaStone(src, commandData);
                return true;
            }
            if (command === "challenge") {
                safari.challengePlayer(src, commandData);
                return true;
            }
            if (command === "watch") {
                if (currentEvent && commandData === "*") {
                    currentEvent.watchEvent(src);
                } else {
                    safari.watchBattle(src, commandData);
                }
                return true;
            }
            if (["decoration", "decorations", "deco", "decos"].contains(command)) {
                safari.viewDecorations(src, commandData);
                return true;
            }
            if (command === "base") {
                safari.viewBase(src, commandData);
                return true;
            }
            if (command === "editbase") {
                safari.editBase(src, commandData);
                return true;
            }
            if (command === "quest" || command === "quests") {
                safari.questNPC(src, commandData);
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
            if (command === "findt") {
                safari.findPokemon(src, commandData, true);
                return true;
            }
            if (command === "finds") {
                safari.findPokemon(src, commandData, true, true);
                return true;
            }
            if (command === "favorite" || command === "favoriteball" || command === "favourite" || command === "favouriteball") {
                safari.setFavoriteBall(src, commandData);
                return true;
            }
            if (command === "leaderboard" || command == "lb") {
                var rec = commandData.toLowerCase(), e;

                if (rec === "list") {
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendMessage(src, "Existing leaderboards (type /lb [type] for the list): ", safchan);
                    for (e in leaderboardTypes) {
                        safaribot.sendHtmlMessage(src, "<a href='po:send//lb " + leaderboardTypes[e].alias + "'>" + cap(leaderboardTypes[e].alias) + "</a> : Leaderboard " + leaderboardTypes[e].desc, safchan);
                    }
                    for (e in monthlyLeaderboardTypes) {
                        safaribot.sendHtmlMessage(src, "<a href='po:send//lb " + monthlyLeaderboardTypes[e].alias + "'>" + cap(monthlyLeaderboardTypes[e].alias) + "</a> : Leaderboard " + monthlyLeaderboardTypes[e].desc, safchan);
                    }
                    for (e in monthlyLeaderboardTypes) {
                        safaribot.sendHtmlMessage(src, "<a href='po:send//lb " + monthlyLeaderboardTypes[e].lastAlias + "'>" + cap(monthlyLeaderboardTypes[e].lastAlias) + "</a> : Leaderboard " + monthlyLeaderboardTypes[e].lastDesc, safchan);
                    }
                    sys.sendMessage(src, "", safchan);
                    return true;
                }

                var info = rec.split(":");
                rec = info[0];

                var lbKeys = Object.keys(leaderboards);
                var lbData = leaderboardTypes;
                var recName = rec, desc;
                var lowCaseKeys = lbKeys.map(function(x) { return x.toLowerCase(); });
                if (lowCaseKeys.indexOf(rec) !== -1) {
                    rec = recName = lbKeys[lowCaseKeys.indexOf(rec)];
                    desc = lbData[rec].desc;
                } else {
                    var found = false;
                    for (e in leaderboards) {
                        if (e.indexOf("Monthly") >= 0) {
                            recName = e.substr(0, e.indexOf("Monthly"));
                            if (recName in monthlyLeaderboardTypes && monthlyLeaderboardTypes[recName].alts.indexOf(rec) !== -1) {
                                rec = e;
                                found = true;
                                lbData = monthlyLeaderboardTypes;
                                desc = lbData[recName].desc;
                                break;
                            }
                        } else if (e.indexOf("Last") >= 0) {
                            recName = e.substr(0, e.indexOf("Last"));
                            if (recName in monthlyLeaderboardTypes && monthlyLeaderboardTypes[recName].lastAlias == rec.toLowerCase()) {
                                rec = e;
                                found = true;
                                lbData = monthlyLeaderboardTypes;
                                desc = lbData[recName].lastDesc;
                                break;
                            }
                        } else if (leaderboardTypes[e].alts.indexOf(rec) !== -1) {
                            rec = recName = e;
                            found = true;
                            desc = lbData[rec].desc;
                            break;
                        }
                    }
                    if (!found) {
                        rec = recName = "pokesCaught";
                        desc = lbData[rec].desc;
                    }
                }

                var range = info.length > 1 ? getRange(info[1]) : { lower: 1, upper: 10 };
                var self = sys.name(src).toLowerCase();
                if (!range) {
                    range = { lower: 1, upper: 10 };
                    if (info.length > 1) {
                        self = info[1].toLowerCase();
                    }
                }
                var list = getArrayRange(leaderboards[rec], range.lower, range.upper);
                var out = ["", "<b>" + (recName == "salt" ? "Safari Lameboards " : "Safari Leaderboards ") + desc + "</b>" + (lastLeaderboardUpdate ? " (last updated: " + lastLeaderboardUpdate + ")" : "")], selfFound = false;
                var sign = (lbData[recName].isMoney ? "$" : "");
                for (e = 0; e < list.length; e++) {
                    out.push("<b>" + (list[e].pos) + ". <font color='" + list[e].color + "'>" + list[e].fullName + ":</font></b> " + sign + addComma(list[e].value));
                    if (list[e].name == self) {
                        selfFound = true;
                    }
                }
                if (!selfFound) {
                    list = leaderboards[rec];
                    for (e = 0; e < list.length; e++) {
                        if (list[e].name == self) {
                            var entry = "<b>" + (list[e].pos) + ". <font color='" + list[e].color + "'>" + list[e].fullName + ":</font></b> " + sign + addComma(list[e].value);
                            if (e < range.lower) {
                                out.splice(2, 0, entry);
                            } else {
                                out.push(entry);
                            }
                            selfFound = true;
                            break;
                        }
                    }
                    if (!selfFound) {
                        out.push((self == sys.name(src).toLowerCase() ? "You are" : self.toCorrectCase() + " is" ) + " not ranked in this leaderboard!");
                    }
                }
                out.push("");
                sys.sendHtmlMessage(src, out.join("<br/>"),safchan);
                return true;
            }
            /* if (command === "hidelb") {
                if (!validPlayers("self", src)) {
                    return;
                }
                var player = getAvatar(src);
                
                if (commandData === "*") {
                    if (player.hideLB.length > 0) { 
                        safaribot.sendMessage(src, "You are currently hidden on the following leaderboards: " + player.hideLB.map(function(x) { return leaderboardTypes[x].alias; }).join(", "), safchan);
                    } else {
                        safaribot.sendMessage(src, "You are currently visible on all leaderboards!", safchan);
                    }
                    safaribot.sendMessage(src, "To hide/show yourself on a leaderboard, use /hidelb [LearboardName].", safchan);
                    return true;
                }
                
                var n = commandData.toLowerCase();
                var lbname;
                for (var l in leaderboardTypes) {
                    if (leaderboardTypes[l].alias === "n" || leaderboardTypes[l].alts.contains(n)) {
                        lbname = l;
                        break;
                    }
                }
                if (!lbname) {
                    safaribot.sendMessage(src, "This is not a valid leaderboard!", safchan);
                    return true;
                }
                if (lbname === "salt") {
                    safaribot.sendMessage(src, "You cannot hide yourself from this leaderboard!", safchan);
                    return true;
                }
                
                if (player.hideLB.contains(lbname)) {
                    player.hideLB.splice(player.hideLB.indexOf(lbname), 1);
                    safaribot.sendMessage(src, "You are back to the the " + leaderboardTypes[lbname].alias + " leaderboard!", safchan);
                } else {
                    player.hideLB.push(lbname);
                    safaribot.sendMessage(src, "You are now hidden from the " + leaderboardTypes[lbname].alias + " leaderboard!", safchan);
                }
                
                safari.saveGame(player);
                return true;
            } */
            if (command === "flashme") {
                if (!validPlayers("self", src)) {
                    return;
                }
                var player = getAvatar(src);
                if (!player.flashme) {
                    player.flashme = true;
                    safaribot.sendMessage(src, "You will now be flashed when a contest or event starts!", safchan);
                }
                else {
                    player.flashme = false;
                    safaribot.sendMessage(src, "You will no longer be flashed when a contest or event starts!", safchan);
                }
                safari.saveGame(player);
                return true;
            }
            if (command === "safarirules") {
                script.beforeChatMessage(src, "/crules", safchan);
                var player = getAvatar(src);
                if (player) {
                    if (player.tutorial.inTutorial && player.tutorial.step === 11) {
                        player.tutorial.viewedRules = true;
                        player.tutorial.step = 12;
                        tutorMsg(src, "These rules can be referenced at any time. When you are ready, proceed with " + link("/tutorial"));
                    }
                    player.lastViewedRules = now();
                }
                return true;
            }
            if (command === "safariadmins" || command === "safariauth" || command === "sas") {
                script.beforeChatMessage(src, "/cauth", safchan);
                return true;
            }
            if (command === "info") {
                var time = new Date(now()).toUTCString();
                sys.sendMessage(src, separator, safchan);
                safaribot.sendMessage(src, "Current Time: " + time, safchan);
                if (contestCount > 0) {
                    var min = Math.floor(contestCount/60);
                    var sec = contestCount%60;
                    safaribot.sendMessage(src, "Current Contest's theme: " + (currentTheme ? contestThemes[currentTheme].name : "Default") + ".", safchan);
                    if (currentRules) {
                        safaribot.sendMessage(src, "Contest's Rules: " + this.translateRules(currentRules), safchan);
                    }
                    safaribot.sendMessage(src, "Time until the Contest ends: " + plural(min, "minute") + ", " + plural(sec, "seconds") + ".", safchan);
                } else {
                    var min = Math.floor(contestCooldown/60);
                    var sec = contestCooldown%60;
                    safaribot.sendMessage(src, "Time until next Contest: " + plural(min, "minute") + ", " + plural(sec, "second") + ".", safchan);
                    if (nextTheme) {
                        safaribot.sendMessage(src, "Next Contest's theme: " + (nextTheme !== "none" ? themeName(nextTheme) : "Default") + ".", safchan);

                        if (Array.isArray(nextTheme) && nextRules) { //Disabled for now
                            var t, n;

                            for (n = 0; n < nextTheme.length; n++) {
                                t = nextTheme[n];
                                if (nextRules && t in nextRules) {
                                    safaribot.sendMessage(src, "--- Rules for " + themeName(t) + ": " + this.translateRules(nextRules[t]), safchan);
                                }
                            }
                        }
                        if (contestVotes) {
                            safaribot.sendHtmlMessage(src, "You can choose which theme will be started! Type " + readable(nextTheme.map(function(x){ return link("/vote " + themeName(x)); }), "or") + " to choose!", safchan);
                        }
                    }
                }
                safaribot.sendHtmlMessage(src, "Boost-of-the-Day: " + link("/active " + sys.pokemon(dailyBoost.pokemon), sys.pokemon(dailyBoost.pokemon)) + " (" + dailyBoost.bonus.toFixed(2) + "x catch rate if used as active).", safchan);
                safaribot.sendMessage(src, "Current Gachapon Jackpot: " + Math.floor(gachaJackpot/10) + " Tickets.", safchan);
                if (rafflePrizeObj) {
                    var total = 0;
                    for (var e in rafflePlayers.hash) {
                        if (rafflePlayers.hash.hasOwnProperty(e)) {
                            total += parseInt(rafflePlayers.hash[e], 10);
                        }
                    }
                    safaribot.sendMessage(src, "Current Raffle Prize: " + plural(rafflePrizeObj.amount, rafflePrizeObj.name) + " with " + total + " entries sold!" + (rafflePrizeObj.drawDate ? " Estimated draw date: " + rafflePrizeObj.drawDate : ""), safchan);
                }
                sys.sendMessage(src, separator, safchan);
                return true;
            }
            if (command === "bst") {
                var info = getInputPokemon(commandData);

                if (!info.num) {
                    safaribot.sendMessage(src, "Invalid Pokémon.", safchan);
                    return true;
                }

                sys.sendMessage(src, "", safchan);
                var type1 = sys.type(sys.pokeType1(info.num));
                var type2 = sys.type(sys.pokeType2(info.num));
                safaribot.sendMessage(src, pokeInfo.species(info.num) + ". " + info.name + "'s BST is " + getBST(info.num) + ". [Type: " +(type1 + (type2 === "???" ? "" : "/" + type2))+ ", Region: " + generation(info.num, true) + "]", safchan);
                var player = getAvatar(src);
                if (player) {
                    if (isMega(info.num)) {
                        safaribot.sendMessage(src, info.name + " cannot be sold.", safchan);
                    } else {
                        var perkBonus = 1 + Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
                        var price = getPrice(info.num, info.shiny, perkBonus);
                        safaribot.sendMessage(src, "You can sell " + an(info.name) + " for $" + addComma(price) + ". " + (!info.shiny ? "If it's Shiny, you can sell it for $" + addComma(getPrice(info.num, true, perkBonus))  + ". " : ""), safchan);
                    }
                }
                var species = pokeInfo.species(info.num);
                if (species in evolutions) {
                    var evoData = evolutions[species];
                    var candiesRequired = Math.floor((evoData.candies || 300) * (info.shiny ? 1.15 : 1));
                    var evo = evoData.evo;

                    var conditionals = [];
                    if (!info.shiny) {
                        conditionals.push(Math.floor(candiesRequired *  1.15) + " if shiny");
                    }
                    if (player && player.costumes.contains("breeder")) {
                        conditionals.push(Math.floor(candiesRequired * costumeData.breeder.rate) + " if using " + costumeAlias("breeder", true, true));
                    }

                    safaribot.sendMessage(src, info.name + " requires " + plural(candiesRequired, "dust") + " to evolve into " + (Array.isArray(evo) ? readable(evo.map(poke), "or") : poke(evo)) + (conditionals.length > 0 ? " (" + conditionals.join(", ") + ")" : "") + ". ", safchan);
                }
                if (!isMega(info.num) && species in megaEvolutions) {
                    safaribot.sendMessage(src, info.name + " can mega evolve into " + readable(megaEvolutions[species].map(poke), "or") + ". ", safchan);
                }
                if (isLegendary(info.num) || SESSION.channels(safchan).isChannelOwner(src)) {
                    var themes = [];
                    for (var e in contestThemes) {
                        if ((info.num < 722 || contestThemes[e].include.contains(info.num)) && this.validForTheme(info.num, e)) {
                            themes.push(contestThemes[e].name);
                        }
                    }
                    if (themes.length > 0) {
                        safaribot.sendMessage(src, info.name + " can be found in the following " + plural(themes.length, "theme") + ": " + readable(themes, "and") + ".", safchan);
                    } else {
                        safaribot.sendMessage(src, info.name + " cannot be found in any theme currently.", safchan);
                    }
                }
                sys.sendMessage(src, "", safchan);
                return true;
            }
            if (command === "lastcontest" || command === "lastcontests" || command === "lc") {
                sys.sendMessage(src, "", safchan);
                sys.sendMessage(src, "*** LAST CONTESTS ***", safchan);
                for (var e = 0, x; e < lastContests.length; e++) {
                    x = lastContests[e];
                    safaribot.sendHtmlMessage(src, "Theme: {0} --- Won by: {1} --- Score: {2} --- Rules: {3} --- Finished {4} ago".format(x.theme, (x.winners ? x.winners : "No one"), (x.winners ? "Caught " + x.caught + ", BST " + x.bst + "" : "N/A"), x.rules, utilities.getTimeString(Math.floor((now() - x.finished)/1000) + 1)), safchan);
                }
                sys.sendMessage(src, "", safchan);
                return true;
            }
            if (command === "records" || command === "record") {
                safari.showRecords(src, commandData);
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
            if (command === "themes") {
                var ret = [];
                var contests = Object.keys(contestThemes);
                for (var e in contests) {
                    ret.push(contestThemes[contests[e]].name);
                }
                ret.sort();
                safaribot.sendMessage(src, "Available Contest Themes: " + readable(ret, "and") + ".", safchan);
                if (SESSION.channels(safchan).isChannelOwner(src)) {
                    var url = permObj.get("themesurl");
                    if (url) {
                        safaribot.sendMessage(src, "Current themes file: " + url, safchan);
                    }
                }
                return true;
            }
            if (command === "vote") {
                if (!contestVotes || !nextTheme) {
                    safaribot.sendMessage(src, "There's no voting for a theme ongoing!", safchan);
                    return true;
                }
                var player = getAvatar(src);
                if (!player) {
                    safaribot.sendMessage(src, "You need to start the game to vote!", safchan);
                    return true;
                }
                var voted = commandData.toLowerCase();
                if (!nextTheme.contains(voted)) {
                    var tNames = nextTheme.map(themeName).map(function(x) { return x.toLowerCase();});
                    if (tNames.contains(voted)) {
                        voted = nextTheme[tNames.indexOf(voted)];
                    } else {
                        if (voted in contestThemes || voted === "none") {
                            safaribot.sendMessage(src, "This theme is not available to vote at this time! Type /info to find out which themes can be voted for.", safchan);
                        } else {
                            safaribot.sendMessage(src, voted + " is not a valid theme!", safchan);
                        }
                        return true;
                    }
                }
                
                if (contestVotes.hasOwnProperty(player.id)) {
                    safaribot.sendMessage(src, "You changed your vote to " + themeName(voted) + "!", safchan);
                } else {
                    safaribot.sendMessage(src, "You voted for " + themeName(voted) + "!", safchan);
                }
                contestVotes[player.id] = voted;
                return true;
            }
            if (command === "contestrules" || command === "contestrule") {
                var out = [
                    "",
                    "*** CONTEST RULES EXPLANATION *** ",
                    "NERF: Any number of nerfs reduces the catch rate to " + (RULES_NERF * 100) + "%.",
                    "BUFF: Each buff increases the catch rate by " + (RULES_BUFF * 100) + "%.",
                    "Nerf is only applied once, but Buffs can stack.",
                    "",
                    "Buffed/Nerfed Types: Pokémon with any of those types gets Buffed/Nerfed.",
                    "Buffed/Nerfed Regions: Pokémon from that region are Buffed/Nerfed. Forms and Megas use the base form for this check.",
                    "Enforced Types: Pokémon with any type not in this list gets Nerfed.",
                    "Shiny Pokémon Buffed/Nerfed: Shiny Pokémon gets Buffed/Nerfed.",
                    "Single-type Pokémon Buffed/Nerfed: Pokémon with only one type gets Buffed/Nerfed.",
                    "Dual-type Pokémon Buffed/Nerfed: Pokémon with only two types gets Buffed/Nerfed.",
                    "Legendaries Nerfed: Legendary Pokémon get Nerfed.",
                    "Recommended BST: Pokémon outside of this BST range gets Nerfed.",
                    "",
                    "Inverted BST: Lower BST = Better.",
                    "Inverted Type Effectiveness*: Wild Pokémon resisting your Pokémon = Good (example: Using Normal-type against a Steel-type Wild Pokémon).",
                    "Resistance Mode*: Your Pokémon resisting the Wild Pokémon = Good (example: Using Steel-type against a Normal-type Wild Pokémon).",
                    "Weakness Mode*: Wild Pokémon super-effective on your Pokémon = Good (example: Using Ground-type against an Ice-type Wild Pokémon).",
                    "*These rules replace normal Type Effectiveness.",
                    "",
                    "Allowed/Forbidden Balls: Balls not allowed cannot be thrown.",
                    "Reward: Different items given to the contest winner.",
                    ""
                ];

                for (var e = 0; e < out.length; e++) {
                    sys.sendMessage(src, out[e], safchan);
                }
                var player = getAvatar(src);
                if (player) {
                    if (player.tutorial.inTutorial && player.tutorial.step === 10) {
                        player.tutorial.viewedContestRules = true;
                        player.tutorial.step = 11;
                        tutorMsg(src, "These rules can be referenced at any time. When you are ready, proceed with " + link("/tutorial"));
                    }
                }
                return true;
            }
            if (command === "pyr") {
                var found = false;
                for (var p in currentPyramids) {
                    if (currentPyramids[p].isInPyramid(sys.name(src))) {
                        currentPyramids[p].useCommand(src, commandData);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return false;
                }
                return true;
            }
            if (currentEvent && currentEvent.isInEvent(sys.name(src)) && currentEvent.eventCommands.hasOwnProperty(command)) {
                currentEvent.handleCommand(src, command, commandData);
                return true;
            }
        } else {
            safaribot.sendMessage(src, "You can't play Safari while it is updating.", safchan);
            return true;
        }

        //Staff Commands
        if (SESSION.channels(safchan).isChannelAdmin(src)) {
            if (command === "startevent") {
                if (currentEvent) {
                    safaribot.sendMessage(src, "There's already an event going on!", safchan);
                    return true;
                }
                var info = commandData.split(":");
                var type;
                switch (info[0].toLowerCase()) {
                    case "war":
                    case "factionwar":
                    case "faction war":
                    case "faction":
                        type = "factionwar";
                    break;
                    case "inverwar":
                    case "invertedwar":
                    case "inverted war":
                        type = "invertedwar";
                    break;
                    case "race":
                    case "pokerace":
                        type = "race";
                    break;
                    case "betrace":
                        type = "betrace";
                    break;
                    case "bf":
                    case "factory":
                    case "bfactory":
                    case "battlefactory":
                        type = "bfactory";
                    break;
                    case "quiz":
                        type = "quiz";
                    break;
                    default:
                    case "help":
                    case "info":
                        safaribot.sendHtmlMessage(src, "To start an event, use one of the following commands (parameters in red are optional):", safchan);
                        safaribot.sendHtmlMessage(src, "Faction War: /startevent [war/invertedwar]:[Reward]:" + toColor("[Team1]:[Team2]:[Team2Reward]", "orangered"), safchan);
                        safaribot.sendHtmlMessage(src, "Pokémon Race: /startevent race:[Reward]:" + toColor("[UnderdogReward]:[FavoriteReward]", "orangered"), safchan);
                        safaribot.sendHtmlMessage(src, "Pokémon Bet Race: " + link("/startevent betrace:BetItem:Reward:MinimumBet:MaximumBet:FavoritePayout:UnderdogPayout:NormalPayout", "/startevent betrace:[BetItem]:[Reward]:[MinimumBet]:[MaximumBet]:[FavoritePayout]:[UnderdogPayout]:[NormalPayout]", true) + toColor(" (everything is optional)", "orangered"), safchan);
                        safaribot.sendHtmlMessage(src, "Battle Factory: /startevent factory:[1st Place Rewards]:[2nd Place Rewards]:" + toColor("[3rd Place Rewards]", "orangered"), safchan);
                        safaribot.sendHtmlMessage(src, "Quiz: /startevent quiz:[1st Place Rewards]:[2nd Place Rewards]:" + toColor("[3rd Place Rewards]", "orangered"), safchan);
                        return true;
                }

                var param = info.slice(1);

                if (type == "factionwar" || type == "invertedwar") {
                    if (param.length < 1) {
                        safaribot.sendMessage(src, "Use /startevent [FactionWar/InvertedWar]:Reward:Team1:Team2:Reward2 to start a Faction War!", safchan);
                        return true;
                    }
                    
                    var reward = param[0];
                    var valid = validateStuff(reward);
                    if (valid.length > 0) {
                        safaribot.sendMessage(src, "Invalid reward found: " + readable(valid) + "!", safchan);
                        return true;
                    }

                    var name1 = param.length > 1 && param[1] ? param[1] : sys.pokemon(sys.rand(1, 722));
                    var name2;
                    if (param.length > 2 && param[2]) {
                        name2 = param[2];
                    } else {
                        do {
                            name2 = sys.pokemon(sys.rand(1, 722));
                        } while (name1 === name2);
                    }
                    
                    var reward2 = null;
                    if (param.length > 3 && param[3]) {
                        reward2 = param[3];
                        var valid = validateStuff(reward2);
                        if (valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid reward2 found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                    }
                    
                    var ev = new FactionWar(src, reward, name1, name2, type == "invertedwar", reward2);
                    currentEvent = ev;
                    safari.flashPlayers();
                }
                else if (type == "race") {
                    var r1 = param[0], r2 = "", r3 = "", l = param.length;

                    if (!r1) {
                        safaribot.sendMessage(src, "Please specify a valid reward for the first place!", safchan);
                        return true;
                    }
                    var valid = validateStuff(r1);
                    if (valid.length > 0) {
                        safaribot.sendMessage(src, "Invalid reward found: " + readable(valid) + "!", safchan);
                        return true;
                    }
                    if (l > 1) {
                        r2 = param[1];
                        valid = validateStuff(r2);
                        if (r2 && valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid Underdog reward found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                    }
                    if (l > 2) {
                        r3 = param[2];
                        valid = validateStuff(r3);
                        if (r3 && valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid Favorite reward found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                    }
                    var data = {
                        reward: r1,
                        rewardUnderdog: r2,
                        rewardFavorite: r3
                    };
                    
                    var ev = new PokeRace(src, "normal", data);
                    currentEvent = ev;
                    safari.flashPlayers();
                }
                else if (type == "betrace") {
                    var data = {
                        minBet: null,
                        maxBet: null,
                        favorite: null,
                        underdog: null,
                        normal: null,
                        bet: null,
                        reward: null
                    };
                    var l = param.length;
                    
                    if (l > 0) {
                        var valid = validateStuff(param[0]);
                        if (valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid bet found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                        valid = toStuffObj(param[0]);
                        if (Object.keys(valid).length > 1) {
                            safaribot.sendMessage(src, "You cannot set more than one item as the bet asset!", safchan);
                            return true;
                        }
                        valid = translateAsset(param[0]);
                        if (valid.type === "poke") {
                            safaribot.sendMessage(src, "You cannot set a Pokémon as the bet asset!", safchan);
                            return true;
                        }
                        data.bet = param[0];
                    }
                    if (l > 1) {
                        var valid = validateStuff(param[1]);
                        if (valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid reward found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                        valid = toStuffObj(param[1]);
                        if (Object.keys(valid).length > 1) {
                            safaribot.sendMessage(src, "You cannot set more than one item as the reward payout!", safchan);
                            return true;
                        }
                        data.reward = param[1];
                    }
                    if (l > 2) {
                        val = parseInt(param[2], 10);
                        if (val && !isNaN(val) && val > 0) {
                            data.minBet = val;
                        }
                    }
                    if (l > 3) {
                        val = parseInt(param[3], 10);
                        if (val && !isNaN(val)) {
                            data.maxBet = val;
                        }
                    }
                    if (l > 4) {
                        val = parseFloat(param[4]);
                        if (val && !isNaN(val) && val > 0) {
                            data.favorite = val;
                        }
                    }
                    if (l > 5) {
                        val = parseFloat(param[5]);
                        if (val && !isNaN(val) && val > 0) {
                            data.underdog = val;
                        }
                    }
                    if (l > 6) {
                        val = parseFloat(param[6]);
                        if (val && !isNaN(val) && val > 0) {
                            data.normal = val;
                        }
                    }
                    
                    var ev = new PokeRace(src, "bet", data);
                    currentEvent = ev;
                    safari.flashPlayers();
                }
                else if (type == "bfactory") {
                    var r1 = "", r2 = "", r3 = "", pLen = param.length;

                    if (pLen > 0) {
                        r1 = param[0];
                    }
                    if (pLen > 1) {
                        r2 = param[1];
                    }
                    if (pLen > 2) {
                        r3 = param[2];
                    }
                    if (!r1) {
                        safaribot.sendMessage(src, "Please specify a valid reward for the first place!", safchan);
                        return true;
                    }
                    if (!r2) {
                        safaribot.sendMessage(src, "Please specify a valid reward for the second place!", safchan);
                        return true;
                    }
                    var valid = validateStuff(r1);
                    if (valid.length > 0) {
                        safaribot.sendMessage(src, "Invalid reward for first place found: " + readable(valid) + "!", safchan);
                        return true;
                    }
                    valid = validateStuff(r2);
                    if (valid.length > 0) {
                        safaribot.sendMessage(src, "Invalid reward for second place found: " + readable(valid) + "!", safchan);
                        return true;
                    }
                    if (r3) {
                        valid = validateStuff(r3);
                        if (valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid reward for third place found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                    }
                    
                    var ev = new BFactory(src, r1, r2, r3);
                    currentEvent = ev;
                    safari.flashPlayers();
                }
                else if (type == "quiz") {
                    var r1 = "", r2 = "", r3 = "", pLen = param.length;

                    if (pLen > 0) {
                        r1 = param[0];
                    }
                    if (pLen > 1) {
                        r2 = param[1];
                    }
                    if (pLen > 2) {
                        r3 = param[2];
                    }
                    if (!r1) {
                        safaribot.sendMessage(src, "Please specify a valid reward for the first place!", safchan);
                        return true;
                    }
                    if (!r2) {
                        safaribot.sendMessage(src, "Please specify a valid reward for the second place!", safchan);
                        return true;
                    }
                    var valid = validateStuff(r1);
                    if (valid.length > 0) {
                        safaribot.sendMessage(src, "Invalid reward for first place found: " + readable(valid) + "!", safchan);
                        return true;
                    }
                    valid = validateStuff(r2);
                    if (valid.length > 0) {
                        safaribot.sendMessage(src, "Invalid reward for second place found: " + readable(valid) + "!", safchan);
                        return true;
                    }
                    if (r3) {
                        valid = validateStuff(r3);
                        if (valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid reward for third place found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                    }
                    
                    var ev = new Quiz(src, r1, r2, r3);
                    currentEvent = ev;
                    safari.flashPlayers();
                }
                else {
                    safaribot.sendMessage(src, info[0] + " is not a valid event! Type /startevent help for more information!", safchan);
                }
                return true;
            }
            if (command === "shove") {
                if (!currentEvent) {
                    safaribot.sendMessage(src, "There's no event going on!", safchan);
                    return true;
                }
                currentEvent.shove(src, commandData);
                return true;
            }
            if (command === "abortevent") {
                if (!currentEvent) {
                    safaribot.sendMessage(src, "There's no event going on!", safchan);
                    return true;
                }
                safaribot.sendAll(sys.name(src) + " cancelled the " + currentEvent.eventName + " event!", safchan);
                currentEvent.log(false, [], "Signups: " + currentEvent.signups.join(", "));
                currentEvent = null;
                checkUpdate();
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
                    safari.sanitizePokemon(player);
                    safaribot.sendMessage(src, commandData + "'s safari has been sanitized of invalid values!", safchan);
                    safaribot.sendMessage(playerId, "Your Safari has been sanitized of invalid values!", safchan);
                } else {
                    safaribot.sendMessage(src, "No such person!", safchan);
                }
                return true;
            }
            if (command === "sanitizeall") {
                safari.sanitizeAll();
                safaribot.sendMessage(src, "All safaris have been sanitized of invalid values!", safchan);
                return true;
            }
            if (command === "track") {
                var target = getAvatarOff(commandData);

                if (!target) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }
                var name = sys.name(src).toLowerCase();
                if (target.trackers.contains(name)) {
                    target.trackers.splice(target.trackers.indexOf(name), 1);
                    safari.saveGame(target);
                    safaribot.sendMessage(src, "No longer tracking " + commandData.toCorrectCase() + "!", safchan);
                } else {
                    target.trackers.push(name);
                    safari.saveGame(target);
                    safaribot.sendMessage(src, "Now tracking " + commandData.toCorrectCase() + "!", safchan);
                }
                return true;
            }
            if (command === "trackall") {
                var name = sys.name(src).toLowerCase();
                var someoneElse = false;
                if (commandData !== "*" && sys.id(commandData) && sys.ip(sys.id(commandData)) === sys.ip(src)) {
                    name = commandData.toLowerCase();
                    someoneElse = true;
                }
                if (allTrackers.contains(name)) {
                    allTrackers.splice(allTrackers.indexOf(name), 1);
                    safaribot.sendMessage(src, "You are no longer tracking everyone" + (someoneElse ? " as " + name.toCorrectCase() : "") + "!", safchan);
                } else {
                    allTrackers.push(name);
                    safaribot.sendMessage(src, "You are now tracking everyone" + (someoneElse ? " as " + name.toCorrectCase() : "") + "!", safchan);
                }
                SESSION.global().allTrackers = allTrackers;
                return true;
            }
            if (command === "trick" || command === "trick2") {
                var info = commandData.split(":");
                var targetId = sys.id(info[0]);
                if (!targetId || !sys.isInChannel(targetId, safchan)) {
                    safaribot.sendMessage(src, "No such person in the channel!", safchan);
                    return true;
                }
                var input;
                if (info.length > 1) {
                    input = getInputPokemon(info[1]);
                }
                if (!input || !input.num) {
                    input = getInputPokemon(sys.rand(1, 722) + "");
                }

                var player = getAvatar(targetId);
                if (player) {
                    safaribot.sendMessage(src, "Tricking " + sys.name(targetId) + " into seeing a wild " + input.name + "!", safchan);
                    for (var x in player.trackers) {
                        var trackerName = player.trackers[x];
                        var trackerId = sys.id(trackerName);
                        if (trackerId && trackerId !== src) {
                            safaribot.sendMessage(trackerId, sys.name(src).toCorrectCase() + " is tricking " + sys.name(targetId) + " into seeing a wild " + input.name + "!", safchan);
                        }
                    }
                    if (sys.id("Safari Warden") !== undefined) {
                        safaribot.sendMessage(sys.id("Safari Warden"), sys.name(src).toCorrectCase() + " is tricking " + sys.name(targetId) + " into seeing a wild " + input.name + "!", safchan);
                    }
                } else {
                    safaribot.sendMessage(src, "Tricking " + sys.name(targetId) + " into seeing a wild " + input.name + "!", safchan);
                }
                if (contestCount <= 0) {
                    var bName = finishName("bait").toLowerCase();
                    safaribot.sendMessage(targetId, "Some stealthy person left some " + bName + " out. The " + bName + " attracted a wild Pokémon!", safchan);
                }
                sys.sendHtmlMessage(targetId, "<hr><center>" + (input.shiny ? "<font color='DarkOrchid'>" : "") + "A wild " + input.name + " appeared! <i>(BST: " + getBST(input.num) + ")</i>" + (input.shiny ? "</font>" : "") + "<br/>" + pokeInfo.sprite(input.id) + "</center><hr>", safchan);
                ballMacro(targetId);
                if (info.length > 2) {
                    sys.sendMessage(targetId, info.slice(2).join(":"), safchan);
                }
                if (command === "trick2") {
                    sys.setTimer(function() {
                        sys.sendMessage(targetId, "", safchan);
                        safaribot.sendHtmlMessage(targetId, "Some stealthy person caught the <b>" + input.name + "</b> with " + an(finishName("spy")) + " and the help of their well-trained spy Pokémon!", safchan);
                        sys.sendMessage(targetId, "", safchan);
                    }, 3200, false);
                }
                lastWild = now();

                return true;
            }
            if (command === "tradeban") {
                var info = commandData.split(":");
                var name = info[0];
                if (info.length < 2) {
                    safaribot.sendMessage(src, "Please set a duration!", safchan);
                    return true;
                }

                var duration = info[1];
                if (duration != -1) {
                    duration = utilities.getSeconds(info[1]);
                }
                var player = getAvatarOff(name);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }

                var self = utilities.non_flashing(sys.name(src).toCorrectCase());
                safari.applyTradeban(self, name, player, duration);
                return true;
            }
            if (command === "tradebans") {
                if (tradeBans) {
                    var out = [], val, currentTime = now();
                    for (var b in tradeBans.hash) {
                        if (tradeBans.hash.hasOwnProperty(b)) {
                            val = parseInt(tradeBans.hash[b], 10);
                            if (val > currentTime) {
                                out.push(b.toCorrectCase() + " is tradebanned until " + (new Date(val).toUTCString()) + ".");
                            } else if (val == -1) {
                                out.push(b.toCorrectCase() + " is permanently tradebanned.");
                            }
                        }
                    }
                    if (out.length > 0) {
                        sys.sendMessage(src, "", safchan);
                        sys.sendMessage(src, "*** SAFARI TRADE BANS ***", safchan);
                        for (b = 0; b < out.length; b++) {
                            safaribot.sendMessage(src, out[b], safchan);
                        }
                        sys.sendMessage(src, "", safchan);
                    } else {
                        safaribot.sendMessage(src, "No one is currently tradebanned!", safchan);
                    }
                } else {
                    safaribot.sendMessage(src, "Trade Bans file not found!", safchan);
                }
                return true;
            }
            if (command === "salt") {
                var info = commandData.split(":");
                var name = info[0];
                if (info.length < 2) {
                    safaribot.sendMessage(src, "Please set a duration!", safchan);
                    return true;
                }

                var duration = info[1];
                if (duration != -1) {
                    duration = utilities.getSeconds(info[1]);
                }
                var player = getAvatarOff(name);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    if (saltBans.get(name.toLowerCase()) && duration === 0) {
                        safaribot.sendMessage(src, "Removing entry " + name + " from the salt list!", safchan);
                        saltBans.remove(name.toLowerCase());
                    }
                    return true;
                }

                if (duration === 0) {
                    player.truesalt = 0;
                    safaribot.sendMessage(src, name + " has been de-salted!", safchan);
                    safari.saveGame(player);
                    saltBans.remove(player.id);
                } else {
                    var length;
                    if (duration == -1) {
                        length = "permanently";
                        player.truesalt = 2147483000000;
                    } else {
                        length = "for " + utilities.getTimeString(duration);
                        player.truesalt = now() + duration * 1000;
                    }
                    safari.saveGame(player);
                    safaribot.sendMessage(src, name + " has been salted " + length + "!", safchan);
                    saltBans.add(player.id, player.truesalt);
                }
                saltBans.removeIf(function(obj, e) {
                    return parseInt(obj.get(e), 10) === 0 || parseInt(obj.get(e), 10) < now();
                });
                saltBans.save();
                return true;
            }
            if (command === "saltbans") {
                if (saltBans) {
                    var out = [], val, currentTime = now();
                    for (var b in saltBans.hash) {
                        if (saltBans.hash.hasOwnProperty(b)) {
                            val = parseInt(saltBans.hash[b], 10);
                            if (val > currentTime) {
                                out.push(b.toCorrectCase() + " is salted until " + (new Date(val).toUTCString()) + ".");
                            } else if (val == -1) {
                                out.push(b.toCorrectCase() + " is permanently salted.");
                            }
                        }
                    }
                    if (out.length > 0) {
                        sys.sendMessage(src, "", safchan);
                        sys.sendMessage(src, "*** SAFARI SALT BANS ***", safchan);
                        for (b = 0; b < out.length; b++) {
                            safaribot.sendMessage(src, out[b], safchan);
                        }
                        sys.sendMessage(src, "", safchan);
                    } else {
                        safaribot.sendMessage(src, "No one is currently salted!", safchan);
                    }
                } else {
                    safaribot.sendMessage(src, "Salt Bans file not found!", safchan);
                }
                return true;
            }
            if (command === "safariban") {
                if (commandData === undefined) {
                    safaribot.sendMessage(src, "Please specify a valid user to safari ban!", channel);
                    return true;
                }
                var tar = sys.id(commandData);
                //No upper limit on time because you have to be admin to use this command anyway!
                script.issueBan("safban", src, tar, commandData);
                return true;
            }
            if (command === "safariunban") {
                var tar = sys.id(commandData);
                script.unban("safban", src, tar, commandData);
                return true;
            }
            if (command === "lbban") {
                var info = commandData.split(":");
                var name = info[0];
                
                var player = getAvatarOff(name);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }

                if (player.removedFromLB) {
                    player.removedFromLB = false;
                    safaribot.sendMessage(src, name + " has been readded to all Leaderboards!", safchan);
                } else {
                    player.removedFromLB = true;
                    safaribot.sendMessage(src, name + " has been removed from all Leaderboards!", safchan);
                }
                safari.saveGame(player);
                return true;
            }
            if (command === "analyze" || command === "analyzer") {
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
                    if (attr === undefined) {
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

                var spc = 0;
                if (command === "analyzer") { //Readable format
                    if (["pokemon", "party", "ninjaParty"].contains(propName[1])) {
                        attr = attr.map(poke);
                        spc = 1;
                    }
                }
                safaribot.sendMessage(src, (target ? sys.name(target) : player.id) + "." + propName.join(".") + ": " + JSON.stringify(attr, null, spc), safchan);
                return true;
            }

            if (command === "allowname" || command === "sharedname") {
                if (commandData === "*") {
                    safaribot.sendMessage(src, "The following names are currently allowed to create a new save sharing IP with another player: " + readable(allowedSharedIPNames), safchan);
                    return true;
                }
                var id = commandData.toLowerCase();
                if (allowedSharedIPNames.contains(id)) {
                    allowedSharedIPNames.splice(allowedSharedIPNames.indexOf(id), 1);
                    safaribot.sendMessage(src, id + " is no longer allowed to create a new save while sharing IP with another player!", safchan);
                } else {
                    allowedSharedIPNames.push(id);
                    safaribot.sendMessage(src, id + " is now allowed to create a new save despite sharing IP with another player!", safchan);
                    if (sys.id(id)) {
                        safaribot.sendMessage(sys.id(id), "You can now create a Safari save with /start!", safchan);
                    }
                }
                permObj.add("allowedSharedIPs", JSON.stringify(allowedSharedIPNames));
                return true;
            }
            if (command === "transferalt") {
                var data = commandData.split(":");
                if (data.length < 2) {
                    safaribot.sendMessage(src, "You need to define 2 names! Use /transferalt Name1:Name2 for that!", safchan);
                    return true;
                }
                safari.transferAlt(data[0], data[1], src);
                return true;
            }
            if (command === "tradelog") {
                safari.showLog(src, command, commandData, tradeLog, "trade", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var p1 = info[1].split("::")[0];
                    var p1offer = info[1].split("::")[1];
                    var p2 = info[2].split("::")[0];
                    var p2offer = info[2].split("::")[1];

                    return p1 + "'s " + p1offer + " <--> " + p2 + "'s " + p2offer + " - (" + time + ")";
                });
                return true;
            }
            if (command === "raretrades") {
                safari.showLog(src, command, commandData, rareTradeLog, "rare trade", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var data = info[1];

                    return data + " - (" + time + ")";
                });
                return true;
            }
            if (command === "shoplog") {
                safari.showLog(src, command, commandData, shopLog, "shop", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var p1Info = info[1].split("::");
                    var p1 = p1Info[0];
                    var amount = parseInt(p1Info[1], 10);
                    var item = p1Info[2];
                    var price = parseInt(p1Info[3], 10);
                    var cost = parseInt(p1Info[4], 10);
                    var p2 = info[2].split("::")[0];

                    return p2 + " bought " + amount + "x " + item + " from " + p1 + " for $" + addComma(cost) + (amount > 1 ? " ($" + addComma(price) + " each)" : "") + " --- (" + time + ")";
                });
                return true;
            }
            if (command === "auctionlog") {
                safari.showLog(src, command, commandData, auctionLog, "auction", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var p1Info = info[1].split("::");
                    var p1 = p1Info[0];
                    var amount = parseInt(p1Info[1], 10);
                    var item = p1Info[2];
                    var price = parseInt(p1Info[3], 10);
                    var p2 = info[2].split("::")[0];

                    return p2 + " won " + p1 + "'s auction for " + amount + "x " + item + " by paying $" + addComma(price) + " --- (" + time + ")";
                });
                return true;
            }
            if (command === "altlog") {
                safari.showLog(src, command, commandData, altLog, "alt Change", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();

                    var transfer = info[1].split("::");
                    var user = info[2];

                    return transfer + " --- (by " + user + " at " + time + ")";
                });
                return true;
            }
            if (command === "lostlog") {
                safari.showLog(src, command, commandData, lostLog, "lost Pokémon", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();

                    var p1Info = info[1].split("::");
                    var user = p1Info[0];
                    var comm = p1Info[1];
                    var extra = p1Info[2];

                    return user + " used /" + comm + (extra == "." ? "" : " [" + extra + "]") + " --- (" + time + ")";
                });
                return true;
            }
            if (command === "mythlog") {
                safari.showLog(src, command, commandData, mythLog, "Legendary/Shiny Pokémon spawn", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();

                    var p1Info = info[1].split("::");
                    var pk = p1Info[0];
                    var act = p1Info[1];
                    var who = p1Info[2];
                    
                    if (act == "caught") {
                        return pk + " was caught by " + who + " --- (" + time + ")";
                    } else if (["hatched from Egg", "hatched from Bright Egg", "won from Raffle"].contains(act)) {
                        return pk + " " + act + " by " + who + " --- (" + time + ")";
                    } else if (["wonder traded"].contains(act)) {
                        return pk + " " + act + " to " + who + " --- (" + time + ")";
                    } else {
                        return pk + " " + act + " --- (" + time + ")";
                    }
                });
                return true;
            }
            if (command === "eventlog") {
                safari.showLog(src, command, commandData, eventLog, "event", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var name = info[1];
                    var host = info[2];
                    var signups = info[3];
                    var finished = info[4];
                    var winners = info[5];
                    var rewards = info[6];
                    var extra = info[7];

                    return name + " (" + plural(signups.split(",").length, "Player") + ", by " + host + ", " + (finished == "true" ? "finished" : "aborted") + ") " + " --- Winners: " + winners + " --- Rewards: " + rewards + (extra ? " --- " + extra : "") + " --- (" + time + ")";
                });
                return true;
            }
            if (command === "misclog") {
                safari.showLog(src, command, commandData, miscLog, "misc", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var name = info[1];
                    var action = info[2];

                    return name + " " + action + " --- (" + time + ")";
                });
                return true;
            }
            if (command === "showids") {
                var list = [];
                for (var e in idnumList.hash) {
                    if (idnumList.hash.hasOwnProperty(e)) {
                        list.push(e + ": " + idnumList.hash[e]);
                    }
                }
                list.sort(function(b, a) {
                    var inA = parseInt(a.substr(0, a.indexOf(":")), 10);
                    var inB = parseInt(b.substr(0, b.indexOf(":")), 10);
                    return inB - inA;
                });
                safari.showLogList(src, command, commandData, list, "ID Numbers", function(x) {
                    var n = x.substr(x.indexOf(": ") + 2);
                    return x + " [" + link("/analyze " + n, "Analyze", true) + "]";
                }, true);
                return true;
            }
        }

        if (SESSION.channels(safchan).isChannelOwner(src)) {
            var shopCommands = ["npcadd", "addnpc", "npcremove", "removenpc", "closenpc", "npcclose", "npcclean", "cleannpc", "silveradd", "addsilver"];
            if (shopCommands.contains(command)) {
                var action = "remove";
                var isSilver = false;
                switch (command) {
                    case "npcadd":
                    case "addnpc":
                        action = "add";
                        break;
                    case "silveradd":
                    case "addsilver":
                        action = "add";
                        isSilver = true;
                        break;
                    case "closenpc":
                    case "npcclose":
                        action = "close";
                        break;
                    case "cleannpc":
                    case "npcclean":
                        action = "clean";
                        break;
                    case "npcremove":
                    case "removenpc":
                        action = "remove";
                        break;
                }
                safari.editShop(src, action + ":" + commandData, true, isSilver);
                return true;
            }
            if (command === "addrecipe") {
                if (commandData == "*") {
                    safaribot.sendHtmlMessage(src, "To add or edit an Alchemist recipe, use " + link("/addrecipe RecipeName:Reward:Ingredients:Cooldown:FailChance:FailUses:Transmutation:Immediate", null, true), safchan);
                    return true;
                }
                var data = toCommandData(commandData, ["name", "reward", "ingredients", "cooldown", "failChance", "failUses", "transmutation", "immediate"]);
                data.name = data.name.toLowerCase();
                if (!data.reward || !data.ingredients) {
                    safaribot.sendHtmlMessage(src, "Invalid format! To add or edit an Alchemist recipe, use " + link("/addrecipe RecipeName:Reward:Ingredients:Cooldown:FailChance:FailUses:Transmutation:Immediate", null, true), safchan);
                    return true;
                }
                var valid = validateStuff(data.reward);
                if (valid.length > 0) {
                    safaribot.sendMessage(src, "Invalid reward found: " + readable(valid) + "!", safchan);
                    return true;
                }
                data.reward = toStuffObj(data.reward);
                
                valid = validateStuff(data.ingredients);
                if (valid.length > 0) {
                    safaribot.sendMessage(src, "Invalid ingredient found: " + readable(valid) + "!", safchan);
                    return true;
                }
                data.ingredients = toStuffObj(data.ingredients);
                
                if (data.failChance) {
                    data.failChance = parseFloat(data.failChance);
                    if (isNaN(data.failChance)) {
                        safaribot.sendHtmlMessage(src, "Please choose a valid fail chance!", safchan);
                        return true;
                    }
                    if (data.failUses) {
                        valid = validateStuff(data.failUses);
                        if (valid.length > 0) {
                            safaribot.sendMessage(src, "Invalid failUses found: " + readable(valid) + "!", safchan);
                            return true;
                        }
                        data.failUses = toStuffObj(data.failUses);
                    }
                } else {
                    data.failChance = 0;
                }
                
                if (data.cooldown) {
                    data.cooldown = parseFloat(data.cooldown);
                    if (isNaN(data.cooldown)) {
                        safaribot.sendHtmlMessage(src, "Please choose a valid duration for the cooldown!", safchan);
                        return true;
                    }
                } else {
                    data.cooldown = 2;
                }
                
                data.transmutation = data.transmutation && ["true", "yes", "y", "1"].contains(data.transmutation.toLowerCase()) ? true : false;
                data.immediate = data.immediate && ["true", "yes", "y", "1"].contains(data.immediate.toLowerCase()) ? true : false;
                
                var rec = {
                    cooldown: data.cooldown,
                    reward: data.reward,
                    ingredients: data.ingredients,
                    failChance: data.failChance,
                    transmutation: data.transmutation,
                    immediate: data.immediate
                };
                if (data.failUses) {
                    rec.failUses = data.failUses;
                }
                recipeData[data.name] = rec;
                permObj.add("alchemistRecipes", JSON.stringify(recipeData));
                sys.sendMessage(src, "", safchan);
                safaribot.sendHtmlMessage(src, "Recipe <b>" + cap(data.name, true) + "</b> added to Alchemist quest!", safchan);
                safaribot.sendMessage(src, "Ingredients: " + translateStuff(rec.ingredients), safchan);
                safaribot.sendMessage(src, "Reward: " + translateStuff(rec.reward), safchan);
                safaribot.sendMessage(src, "Cooldown: " + rec.cooldown + "h | Immediate: " + rec.immediate + " | Transmutation: " + rec.immediate + " | Fail Chance: " + percentage(rec.failChance, 1, 1) + (rec.failChance > 0 && rec.failUses ? " (uses " + (translateStuff(rec.failUses) || "nothing") + " at failure)" : ""), safchan);
                sys.sendMessage(src, "", safchan);
                return true;
            }
            if (command === "showrecipes") {
                var recipes = recipeData, rec, l;
                sys.sendMessage(src, "", safchan);
                for (var e in recipes) {
                    rec = recipes[e];
                    l = "/addrecipe " + e + ":" + toStuffInput(rec.reward) + ":" + toStuffInput(rec.ingredients) + ":" + rec.cooldown + ":" + rec.failChance + ":" + toStuffInput(rec.failUses) + ":" + rec.transmutation + ":" + rec.immediate;
                    safaribot.sendHtmlMessage(src, "<b>" + link(l, cap(e, true), true) + "</b>: " + toColor(translateStuff(rec.ingredients, true), "red") + " --> "+ toColor(translateStuff(rec.reward, true), "blue") + " --- Cooldown: " + rec.cooldown + "h | Transmutation: " + rec.transmutation + " | Immediate: " + rec.immediate + " | Fail Chance: " + percentage(rec.failChance, 1, 1) + (rec.failChance > 0 && rec.failUses ? ", uses " + (translateStuff(rec.failUses) || "nothing") + " at failure" : "") + " --- [" + link("/removerecipe " + e, "Remove", true) + "]", safchan);
                }
                sys.sendMessage(src, "", safchan);
                return true;
            }
            if (command === "removerecipe") {
                var n = commandData.toLowerCase();
                if (recipeData.hasOwnProperty(n)) {
                    delete recipeData[n];
                    safaribot.sendMessage(src, "Removed recipe " + n + " from Alchemist!", safchan);
                    permObj.add("alchemistRecipes", JSON.stringify(recipeData));
                } else {
                    safaribot.sendMessage(src, cap(n) + " is not a valid Alchemist recipe!", safchan);
                }
                return true;
            }
            if (command === "checkrate") {
                commandData = commandData.toLowerCase();
                if (allItems.indexOf(commandData) !== -1 || commandData === "wild" || commandData === "nothing" || commandData === "recharge") {
                    var itemSets = [gachaItems, finderItems, packItems];
                    var method = ["Gachapon", "Item Finder", "Prize Pack"];
                    for (var i = 0; i < itemSets.length; i++) {
                        var nothing = method[i] === "Item Finder" && commandData === "nothing";
                        var total = 0;
                        var instance = itemSets[i][commandData] || 0;
                        if (instance < 1 && !nothing) {
                            safaribot.sendMessage(src, method[i] + ": This item is not available from " + method[i] + ".", safchan);
                        } else {
                            for (var e in itemSets[i]) {
                                total += itemSets[i][e];
                            }
                            if (method[i] === "Item Finder") {
                                total = Math.floor(total / (1 - finderMissRate));
                            }
                            if (nothing) {
                                instance = total * finderMissRate;
                            }
                            safaribot.sendMessage(src, method[i] + ": The rate of " + finishName(commandData) + " is " + instance + "/" + total + ", or " + percentage(instance, total) + ".", safchan);
                        }
                    }
                } else {
                    safaribot.sendMessage(src, "No such item!", safchan);
                }
                return true;
            }
            if (["wild", "wildevent", "horde", "wild2"].contains(command)) {
                if (currentPokemon) {
                    safaribot.sendMessage(src, "There's already a Wild Pokemon out there silly!", safchan);
                    return true;
                }
                var data = commandData.split(":");
                var info = getInputPokemon(data[0]), num = info.num, makeShiny = info.shiny;
                
                var amount = command === "horde" ? 3 : 1;
                if (data.length > 1) {
                    amount = parseInt(data[1], 10);
                }
                
                var appearAs = null;
                if (data.length > 2) {
                    appearAs = getInputPokemon(data[2]);
                }
                
                if (command === "wildevent") {
                    wildEvent = true;
                } else if (command === "wild2" && contestCount === 0) {
                    var bName = finishName("bait").toLowerCase();
                    if (amount > 1 || baitCooldown > 28 || chance(0.3)) {
                        safaribot.sendAll("Some stealthy person goes to grab their item from the Gachapon Machine but the noise lured " + an(finishName("wild")) + "!", safchan);
                    } else {
                        safaribot.sendAll("Some stealthy person left some " + bName + " out. The " + bName + " attracted a wild Pokémon!", safchan);
                    }
                }
                safari.createWild(num, makeShiny, amount, null, null, null, appearAs);
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
            if (command === "precontest") {
                if (contestCount > 0) {
                    safaribot.sendMessage(src, "You can't use this command during a contest!", safchan);
                } else {
                    contestCooldown = 181;
                    safaribot.sendMessage(src, "Entering the pre-contest preparation phase!", safchan);
                }
                return true;
            }
            if (command === "skipcontest") {
                if (contestCount > 0 || contestCooldown <= 180) {
                    if (contestCount > 0) {
                        if (currentPokemon && isRare(currentPokemon)) {
                            sys.appendToFile(mythLog, now() + "|||" + poke(currentPokemon) + "::disappeared with the contest::\n");
                        }
                        resetVars();
                        currentRules = null;
                        sys.sendAll(separator, safchan);
                        safaribot.sendAll("The current Contest has been aborted!", safchan);
                        sys.sendAll(separator, safchan);
                    } else {
                        sys.sendAll(separator, safchan);
                        safaribot.sendAll("The next Contest will be skipped!", safchan);
                        sys.sendAll(separator, safchan);
                    }
                    contestCooldown = contestCooldownLength;
                    contestCount = 0;
                    currentTheme = null;
                    nextRules = null;
                    nextTheme = null;
                    contestCatchers = {};
                    checkUpdate();
                } else {
                    safaribot.sendMessage(src, "You can't skip a contest if there's none running or about to start!", safchan);
                }
                return true;
            }
            if (command === "wipesafari") {
                var name = commandData.toLowerCase();
                var playerId = sys.id(name);

                var player = getAvatarOff(name);
                if (player) {
                    cookedPlayers.add(player.id, JSON.stringify(player)); //Create a backup in case a save is wiped accidentally
                    if (playerId) {
                        SESSION.users(playerId).safari = null;
                    }
                    rafflePlayers.remove(name);
                    rawPlayers.remove(name);
                    idnumList.remove(player.idnum);
                    safaribot.sendAll(commandData + "'s safari has been reset!", safchan);
                } else {
                    safaribot.sendMessage(src, "No such person!", safchan);
                }
                return true;
            }
            if (command === "loadsafari") {
                var info;
                try {
                    info = JSON.parse(commandData);
                } catch (err) {
                    safaribot.sendMessage(src, "Invalid JSON!", safchan);
                    return;
                }
                var name = info.id;
                var id = sys.id(name);
                if (id) {
                    SESSION.users(id).safari = info;
                }

                safari.saveGame(info);
                safaribot.sendMessage(src, "Created save with the name " + name + "!", safchan);
                return true;
            }
            if (command === "forgerecord") {
                var cmd = commandData.split(":");
                var target = cmd[0];
                var player = getAvatarOff(target);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }
                var record = cmd[1];
                if (!(record in playerTemplate.records)) {
                    safaribot.sendMessage(src, "Invalid record!", safchan);
                    return true;
                }
                var recValue = parseInt(cmd[2], 10);
                if (isNaN(recValue)) {
                    safaribot.sendMessage(src, "Invalid amount!", safchan);
                    return true;
                }
                player.records[record] = recValue;
                this.sanitize(player);
                safaribot.sendAll(target.toCorrectCase() + "'s \"" + record + "\" record has been changed to " + recValue + " by " + sys.name(src) + "!", safchan);
                sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + target.toCorrectCase() + "|||forgerecord|||had their " + record + " record forged to|||" + recValue + "\n");
                return true;
            }
            if (command === "reassignid") {
                var target = commandData;
                var player = getAvatarOff(target);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }
                this.assignIdNumber(player, true);
                this.saveGame(player);
                safaribot.sendMessage(src, target.toCorrectCase() + "'s ID has been reset and is now " + player.idnum + ".", safchan);
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
                safaribot.sendAll(target.toCorrectCase() + " has been awarded with $" + moneyGained + " by " + sys.name(src) + "!", safchan);
                sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + target.toCorrectCase() + "|||safaripay|||" + (moneyGained < 0 ? "lost" : "received") + "|||$" + addComma(moneyGained) + "\n");
                return true;
            }
            if (command === "safarigift" || command === "gift") {
                var cmd = commandData.split(":");
                if (cmd.length < 2) {
                    safaribot.sendMessage(src, "Invalid format! Use /safarigift Player:Item:Amount.", safchan);
                    return true;
                }
                var target = cmd[0];
                var res, playerArray = [];

                if (target.indexOf(",") !== -1) {
                    res = target.split(",");
                    for (var i = 0; i < res.length; i++) {
                        playerArray.push(res[i].trim());
                    }
                } else {
                    playerArray.push(target);
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
                var player, index, invalidPlayers = [];
                for (var j = 0; j < playerArray.length; j++) {
                    player = getAvatarOff(playerArray[j]);
                    if (!player) {
                        invalidPlayers.push(playerArray[j]);
                        index = playerArray.indexOf(playerArray[j]);
                        playerArray.splice(index, 1);
                        continue;
                    }
                    player.balls[item] += itemQty;
                    if (item === "entry") {
                        rafflePlayers.add(player.id, player.balls.entry);
                        rafflePlayers.save();
                    }
                    this.updateShop(player, item);
                    this.sanitize(player);
                }

                var customValues;
                try {
                    customValues = JSON.parse(permObj.get("customItemData"))[item].fullName;
                } catch (err) {
                    customValues = item;
                }
                if (playerArray.length > 0) {
                    var targets = readable(playerArray.map(function (x) { return x.toCorrectCase(); }), "and");
                    safaribot.sendAll(targets + " has been awarded with " + plural(itemQty, item) + " by " + sys.name(src) + "!", safchan);
                    sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + targets + "|||gift|||" + (itemQty < 0 ? "lost" : "received") + "|||" + plural(itemQty, item) + (customValues === finishName(item) ? " [actually " + defaultItemData[item].fullName + "]" : "") + "\n");
                }
                if (invalidPlayers.length > 0) {
                    safaribot.sendMessage(src, readable(invalidPlayers, "and") + (invalidPlayers.length > 1 ? " were" : " was") + "  not given anything because their name did not match any current save file.", safchan);
                }
                return true;
            }
            if (command === "givedeco") {
                var cmd = commandData.split(":");
                if (cmd.length < 2) {
                    safaribot.sendMessage(src, "Invalid format! Use /givedeco Player:Decoration:Amount.", safchan);
                    return true;
                }
                var target = cmd[0];
                var res, playerArray = [];

                if (target.indexOf(",") !== -1) {
                    res = target.split(",");
                    for (var i = 0; i < res.length; i++) {
                        playerArray.push(res[i].trim());
                    }
                } else {
                    playerArray.push(target);
                }

                var item = decorationAlias(cmd[1].toLowerCase(), true);
                var itemQty = cmd.length > 2 ? parseInt(cmd[2], 10) : 1;
                if (isNaN(itemQty)) {
                    itemQty = 1;
                }

                if (!decorations.hasOwnProperty(item)) {
                    safaribot.sendMessage(src, "No such decoration!", safchan);
                    return true;
                }
                var player, index, invalidPlayers = [];
                for (var j = 0; j < playerArray.length; j++) {
                    player = getAvatarOff(playerArray[j]);
                    if (!player) {
                        invalidPlayers.push(playerArray[j]);
                        index = playerArray.indexOf(playerArray[j]);
                        playerArray.splice(index, 1);
                        continue;
                    }
                    if (!player.decorations.hasOwnProperty(item)) {
                        player.decorations[item] = 0;
                    }
                    player.decorations[item] += itemQty;
                    if (itemQty < 0) {
                        this.sanitizeBase(player);
                    }
                    this.sanitize(player);
                }
                
                var decoName = decorationAlias(item, false, true);
                if (playerArray.length > 0) {
                    var targets = readable(playerArray.map(function (x) { return x.toCorrectCase(); }), "and");
                    safaribot.sendAll(targets + " has been awarded with " + plural(itemQty, decoName) + " by " + sys.name(src) + "!", safchan);
                    sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + targets + "|||givedeco|||" + (itemQty < 0 ? "lost" : "received") + "|||" + plural(itemQty, decoName) + "\n");
                }
                if (invalidPlayers.length > 0) {
                    safaribot.sendMessage(src, readable(invalidPlayers, "and") + (invalidPlayers.length > 1 ? " were" : " was") + "  not given anything because their name did not match any current save file.", safchan);
                }
                return true;
            }
            if (command === "undo") {
                var info = commandData.split(":");
                if (info.length < 4) {
                    safaribot.sendMessage(src, "Invalid format! Use /undo Player1:Player2:Items,To,Player1:Items,To,Player2!", safchan);
                    return true;
                }
                var n1 = info[0],
                    n2 = info[1],
                    p1 = getAvatarOff(n1),
                    p2 = getAvatarOff(n2);
                if (!p1) {
                    safaribot.sendMessage(src, "No player found with the name " + n1.toCorrectCase(), safchan);
                    return true;
                }
                if (!p2) {
                    safaribot.sendMessage(src, "No player found with the name " + n2.toCorrectCase(), safchan);
                    return true;
                }
                var stuff1 = toStuffObj(info[2].replace(/,/g, ":")),
                    stuff2 = toStuffObj(info[3].replace(/,/g, ":"));
                
                var valid = validateStuff(info[2]);
                if (valid.length > 0) {
                    safaribot.sendMessage(src, "Invalid assets found: " + readable(valid) + " !", safchan);
                    return true;
                }
                valid = validateStuff(info[3]);
                if (valid.length > 0) {
                    safaribot.sendMessage(src, "Invalid assets found: " + readable(valid) + " !", safchan);
                    return true;
                }
                
                var out = hasStuff(p1, stuff2);
                if (!out.result) {
                    safaribot.sendMessage(src, n1.toCorrectCase() + " doesn't have " + readable(out.missing) + "!", safchan);
                    return true;
                }
                out = hasStuff(p2, stuff1);
                if (!out.result) {
                    safaribot.sendMessage(src, n2.toCorrectCase() + " doesn't have " + readable(out.missing) + "!", safchan);
                    return true;
                }
                
                var inverted1 = {}, inverted2 = {}, e;
                for (e in stuff1) {
                    inverted2[e] = -stuff1[e];
                }
                for (e in stuff2) {
                    inverted1[e] = -stuff2[e];
                }
                for (e in inverted1) {
                    if (!(e in stuff1)) {
                        stuff1[e] = 0;
                    }
                    stuff1[e] += inverted1[e];
                }
                for (e in inverted2) {
                    if (!(e in stuff2)) {
                        stuff2[e] = 0;
                    }
                    stuff2[e] += inverted2[e];
                }
                
                var out1 = giveStuff(p1, stuff1);
                var out2 = giveStuff(p2, stuff2);
                safari.sanitize(p1); //This also saves
                safari.sanitize(p2);
                
                safaribot.sendMessage(src, n1.toCorrectCase() + " " + out1 + "!", safchan);
                safaribot.sendMessage(src, n2.toCorrectCase() + " " + out2 + "!", safchan);
                if (sys.id(n1) && out1 !== "received nothing") {
                    safaribot.sendMessage(sys.id(n1), "You " + out1 + "!", safchan);
                }
                if (sys.id(n2) && out2 !== "received nothing") {
                    safaribot.sendMessage(sys.id(n2), "You " + out2 + "!", safchan);
                }
                sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + n1.toCorrectCase() + " and " + n2.toCorrectCase() + "|||undo|||exchanged|||" + translateStuff(info[2]) + " <--> " + translateStuff(info[3]) + "\n");
                return true;
            }
            if (command === "clearcd") {
                var cmd = commandData.split(":");
                if (cmd.length < 2) {
                    safaribot.sendMessage(src, "Wrong format! Use /clearcd Player:Type!", safchan);
                    safaribot.sendMessage(src, "Types can be ball, bait, auction, stick, costume, rock, gacha, itemfinder, baseView, unown, burn, collector, scientist, arena, tower, pyramid, wonder, alchemist or decor!", safchan);
                    return true;
                }
                var target = cmd[0];
                var player = getAvatarOff(target);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }
                var type = cmd[1].toLowerCase();
                switch (type) {
                    case "collector":
                    case "scientist":
                    case "arena":
                    case "tower":
                    case "wonder":
                    case "pyramid":
                    case "alchemist":
                    case "decor":
                        player.quests[type].cooldown = 0;
                    break;
                    case "ball":
                    case "bait":
                    case "stick":
                    case "costume":
                    case "rock":
                    case "auction":
                    case "gacha":
                    case "itemfinder":
                    case "burn":
                    case "unown":
                        player.cooldowns[type] = 0;
                    break;
                    case "baseview":
                        SESSION.users(src).secretBaseView = 0;
                    break;
                    default:
                        safaribot.sendMessage(src, type + " is not a valid cooldown!", safchan);
                        return true;
                }

                this.saveGame(player);
                safaribot.sendMessage(src, target.toCorrectCase() + "'s cooldown for " + type + " was reset!", safchan);
                return true;
            }
            if (command === "disablequest" || command === "enablequest") {
                if (commandData === "*") {
                    var status = [];
                    for (var e in stopQuests) {
                        status.push(cap(e) + ": " + stopQuests[e]);
                    }
                    safaribot.sendMessage(src, "Disabled? " + status.join(", "), safchan);
                    return true;
                }
                var off = command === "disablequest";
                if (commandData.toLowerCase() === "all") {
                    for (var e in stopQuests) {
                        stopQuests[e] = off;
                    }
                    safaribot.sendMessage(src, "All quests were " + (off ? "disabled" : "enabled") + ".", safchan);
                    return true;
                } else if (commandData.toLowerCase() === "long") {
                    stopQuests.pyramid = off;
                    stopQuests.tower = off;
                    safaribot.sendMessage(src, "Pyramid and Tower were " + (off ? "disabled" : "enabled") + ".", safchan);
                    return true;
                }
                var data = commandData.split(":");
                var quest = data[0].toLowerCase();
                var allQuests = Object.keys(stopQuests);
                if (allQuests.contains(quest)) {
                    stopQuests[quest] = off;
                    safaribot.sendMessage(src, cap(quest) + " was " + (off ? "disabled" : "enabled") + ".", safchan);
                } else {
                    safaribot.sendMessage(src, "This is not a valid quest. Valid quests are: " + readable(allQuests, "and") + ".", safchan);
                }
                return true;
            }
            if (command === "tourgift") {
                var tour = commandData.split("*");
                var targets = tour[1].split(", ");
                var placing = 1, player, invalidPlayers = [], out = [];
                for (var i in targets) {
                    i = targets[i];
                    player = getAvatarOff(i);
                    if (!player) {
                        invalidPlayers.push(i.toCorrectCase());
                        placing++;
                        continue;
                    }
                    switch (placing) {
                        case 1:
                            player.balls.rare += 1;
                            player.balls.gem += 1;
                            player.balls.mega += 1;
                        break;
                        case 2:
                            player.balls.rare += 1;
                            player.balls.gem += 1;
                        break;
                        case 3:
                            player.balls.gem += 1;
                        break;
                    }
                    this.sanitize(player);
                    out.push("<b>" + getOrdinal(placing) + "</b>: " + html_escape(i.toCorrectCase()));
                    placing++;
                }
                if (out.length === 0) {
                    safaribot.sendMessage(src, "No names supplied match existing Safari Accounts.", safchan);
                    return true;
                }
                sendAll("<b>" + cap(tour[0]) + " Event Prizes:</b> " + out.join(" | "), true);
                if (invalidPlayers.length > 0) {
                    safaribot.sendMessage(src, "The following players did not match any save: " + invalidPlayers.join(", "), safchan);
                }
                return true;
            }
            if (command === "preptour") {
                var file = "scriptdata/tourdata/tourhistory.json";
                var eventData = JSON.parse(sys.getFileContent(file)).eventtours;

                var amount = parseInt(commandData, 10);
                if (isNaN(amount)) {
                    amount = 10;
                }

                var firstPos, lastPos, ranks = [], player, playerState = [], tourName, noSave = 0;
                for (var x = 0; x < amount; x++) {
                    var string = eventData[x];
                    tourName = string.substring(0, string.indexOf("Event:")).trim();
                    for (var i = 1; i < 4; i++) {
                        firstPos = string.indexOf("#" + i + ":") + 3;
                        lastPos = string.indexOf(";");
                        player = string.substring(firstPos, lastPos).trim();
                        ranks.push(player);
                        if (!hasSave(player)) {
                            playerState.push("<b>~~" + player + "~~</b>");
                            noSave++;
                        } else {
                            playerState.push(player);
                        }
                        string = string.substring(lastPos + 1);
                    }
                    var rankString = ranks.join(", ");
                    var printString = playerState.join(", ");
                    sys.sendHtmlMessage(src, "[" + link("/tourgift " + tourName + "*" + rankString, "Gift") + "] " + tourName + ": " + (noSave > 0 ? "/tourgift " + tourName + "*" : "") + printString, safchan);
                    ranks = [];
                    playerState = [];
                    noSave = 0;
                }
                return true;
            }
            if (command === "checksave" || command === "checksaves") {
                var checks = [], temp = commandData.split(",");
                for (var i = 0; i < temp.length; i++) {
                    checks.push(temp[i].trim());
                }

                var has = [], hasNot = [], player;
                for (var j = 0; j < checks.length; j++) {
                    player = hasSave(checks[j]);
                    if (!player) {
                        hasNot.push(checks[j]);
                    } else {
                        has.push(link("/analyze " + html_escape(checks[j]), checks[j]));
                    }
                }
                if (has.length > 0) {
                    safaribot.sendHtmlMessage(src, "The following have a save: " + has.join(", "), safchan);
                }
                if (hasNot.length > 0) {
                    safaribot.sendMessage(src, "The following do not have a save: " + hasNot.join(", "), safchan);
                }
                return true;
            }
            if (command === "changeboost") {
                safari.changeDailyBoost(commandData);
                return true;
            }
            if (command === "changescientist") {
                safari.changeScientistQuest(commandData);
                safaribot.sendMessage(src, "You changed the scientist quest to request for " + poke(scientistQuest.pokemon) + ".", safchan);
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
                        safaribot.sendAll(sys.name(src) + " scared " + (currentPokemonCount > 1 ? "all " : "") + "the " + poke(currentDisplay) + " away!", safchan);
                    }
                    if (isRare(currentPokemon)) {
                        sys.appendToFile(mythLog, now() + "|||" + poke(currentPokemon) + "::was " + command + "d by " + sys.name(src) + "::\n");
                    }
                    resetVars(true);
                }
                checkUpdate();
                return true;
            }
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
                var remove = cmd.length > 2 && ["remove", "confiscate", "-1"].contains(cmd[2].toLowerCase());
                if (!info.num) {
                    safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
                    return true;
                }
                if (remove) {
                    if (!player.pokemon.contains(info.id)) {
                        safaribot.sendMessage(src, target.toCorrectCase() + " doesn't have " + an(info.name) + "!", safchan);
                        return true;
                    }
                    if (info.id == player.starter && countRepeated(player.pokemon, info.id) <= 1) {
                        safaribot.sendMessage(src, "You can't remove " + target.toCorrectCase() + "'s starter Pokémon!", safchan);
                        return true;
                    }
                    if (safari.isHostingAuction(player.id)) {
                        safaribot.sendMessage(src, "You can't remove a Pokémon from " + target.toCorrectCase() + " while they are hosting an auction!", safchan);
                        return true;
                    }
                    safari.removePokemon2(player, info.id);
                    if (player.party.length === 0) {
                        player.party = [player.starter];
                    }
                    if (player.shop && player.shop.hasOwnProperty(info.input) && player.shop[info.input].limit > countRepeated(player.pokemon, info.id)) {
                        delete player.shop[info.input];
                    }
                    safari.logLostCommand(sys.name(src), "bestow " + target.toCorrectCase() + ":" + info.input + ":" + cmd[2]);
                    safaribot.sendMessage(src, "You took away " + an(info.name) + " from " + target.toCorrectCase() + "!", safchan);
                    if (playerId) {
                        safaribot.sendMessage(playerId, "A Safari Warden confiscated " + an(info.name) + " from you!", safchan);
                    }
                    sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + target.toCorrectCase() + "|||bestow|||lost|||" + info.name + "\n");
                } else {
                    safaribot.sendMessage(src, "You gave " + an(info.name) + " to " + target.toCorrectCase() + "!", safchan);
                    if (playerId) {
                        safaribot.sendMessage(playerId, "You received " + an(info.name) + "!", safchan);
                    }
                    player.pokemon.push(info.id);
                    sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + target.toCorrectCase() + "|||bestow|||received|||" + info.name + "\n");
                }
                this.saveGame(player);
                return true;
            }
            if (command === "giftlog") {
                safari.showLog(src, command, commandData, giftLog, "gift", function(x) {
                    var info = x.split("|||");
                    var time = new Date(parseInt(info[0], 10)).toUTCString();
                    var name = info[1];
                    var target = info[2];
                    var commandName = info[3];
                    var verb = info[4];
                    var gift = info[5];

                    return name + " used /" + commandName + " --- " + target + " " + verb + " " + gift + " --- (" + time + ")";
                });
                return true;
            }
            if (command === "clearjackpot") {
                gachaJackpot = 200;
                safaribot.sendAll("Gachapon Jackpot was reset!", safchan);
                return true;
            }
            if (command === "changelastid") {
                var value = parseInt(commandData, 10);
                if (isNaN(value)) {
                    safaribot.sendMessage(src, "Invalid number!", safchan);
                    return true;
                }
                permObj.add("lastIdAssigned", value);
                permObj.save();
                safaribot.sendMessage(src, "Last ID number reset to " + value + ".", safchan);
                return true;
            }
            /*if (command === "wipesafariall") {
                var info = commandData.toLowerCase().split(":");
                if (info[0] !== "confirm") {
                    safaribot.sendMessage(src, "This will wipe all Safari's save data. If you wish to proceed, type /wipesafariall confirm.", safchan);
                    return true;
                }
                if (info.length < 2 || info[1] !== "really") {
                    safaribot.sendMessage(src, "Are you absolutely sure you want to delete all saves? This cannot be undone! To confirm, type /wipesafariall confirm:really.", safchan);
                    return true;
                }

                var onChannel = sys.playerIds(safchan);
                for (var e in onChannel) {
                    if (sys.isInChannel(onChannel[e], safchan) && getAvatar(onChannel[e])) {
                        SESSION.users(onChannel[e]).safari = null;
                    }
                }
                rawPlayers.clear();
                idnumList.clear();
                safaribot.sendAll("Safari has been completely reset!", safchan);
                return true;
            }*/
            if (command === "update") {
                if (commandData !== "force") {
                    if (contestCount > 0 || contestCooldown < 181) {
                        safaribot.sendMessage(src, "You shouldn't update during or right before a contest!", safchan);
                        return true;
                    }
                    if (currentPokemon) {
                        safaribot.sendMessage(src, "You shouldn't update while a Wild Pokemon is out!", safchan);
                        return true;
                    }
                }
                sys.sendHtmlAll(closedMessage, safchan);
                safariUpdating = true;
                safaribot.sendHtmlMessage(src, "There are currently <b>" + currentBattles.length + "</b> ongoing battles, <b>" + currentAuctions.length + "</b> ongoing auctions, <b>" + currentPyramids.length + "</b> ongoing Pyramid quests and <b>" + (currentEvent ? "1" : "0") + "</b> ongoing events.", safchan);
                return true;
            }
            if (command === "cancelupdate") {
                if (safariUpdating) {
                    safariUpdating = false;
                    sys.sendHtmlAll(openedMessage, safchan);
                } else {
                    safaribot.sendMessage(src, "Safari was not in an updating state.", safchan);
                }
                return true;
            }
            if (command === "updategame") {
                if (!currentPokemon && contestCooldown > 180 && contestCount <= 0 && currentBattles.length === 0 && currentPyramids.length === 0 && currentAuctions.length === 0 && !currentEvent && !safariUpdating) {
                    safariUpdating = true;
                    sys.sendHtmlAll(closedMessage, safchan);
                }
                if (!safariUpdating) {
                    safaribot.sendMessage(src, "You shouldn't update without putting Safari into an update ready state with /update.", safchan);
                    return true;
                }

                safariUpdating = true;
                runUpdate();
                return true;
            }
            if (command === "updateafter") {
                if (["abort", "cancel", "stop"].contains(commandData.toLowerCase())) {
                    safaribot.sendMessage(src, needsUpdating ? "Pending update has been cancelled." : "No update was pending.", safchan);
                    needsUpdating = false;
                } else {
                    safaribot.sendMessage(src, "Safari will be updated at the next available opportunity.", safchan);
                    needsUpdating = true;
                    checkUpdate(); //in case it can go right away
                }
                return true;
            }
            if (command === "updatelb") {
                safari.updateLeaderboards();
                safaribot.sendMessage(src, "Leaderboards updated!", safchan);
                return true;
            }
            if (command === "newmonth") {
                safaribot.sendMessage(src, "Checking if current month changed!", safchan);
                safari.checkNewMonth();
                return true;
            }
            if (command === "addraffle") {
                var info = commandData.split(":");
                var input = getInput(info[0]);
                if (!input) {
                    safaribot.sendMessage(src, "Invalid Pokémon/Item!", safchan);
                    return true;
                }
                sys.sendAll("", safchan);
                var amt = 1;
                if (input.type === "item") {
                    if (info.length > 1) {
                        amt = parseInt(info[1], 10);
                        if (!amt || isNaN(amt)) {
                            amt = 1;
                        }
                    }
                }
                var when;
                if (info.length > 2) {
                    when = info.slice(2).join(":");
                    input.drawDate = when;
                }
                input.amount = amt;

                if (!rafflePrizeObj) {
                    safaribot.sendAll("A new raffle has started! Buy your tickets for a chance to win " + plural(amt, input.name) + (input.drawDate ? " (Estimated draw date: " + input.drawDate + ")" : "") + "! ", safchan);
                } else {
                    safaribot.sendAll("The current raffle prize has been changed to " + plural(amt, input.name)  + (input.drawDate ? " (Estimated draw date: " + input.drawDate + ")" : "") + ". ", safchan);
                }
                sys.sendAll("", safchan);
                permObj.add("rafflePrize", JSON.stringify(input));
                rafflePrizeObj = input;
                return true;
            }
            if (command === "cancelraffle") {
                var info = commandData.split(":");
                if (info[0] === "clearfile") {
                    var refund = 0;
                    if (info.length === 2) {
                        refund = parseInt(info[1], 10);
                        if (isNaN(refund) || refund < 0) {
                            safaribot.sendMessage(src, "Invalid refund amount!", safchan);
                            return true;
                        }
                    }
                    sys.sendAll("", safchan);
                    safaribot.sendAll("The current raffle has been cancelled." + (refund > 0 ? " Tickets have been refunded at $" + refund + " each." : ""), safchan);
                    sys.sendAll("", safchan);

                    rafflePlayers.save();
                    for (var e in rafflePlayers.hash) {
                        if (rafflePlayers.hash.hasOwnProperty(e)) {
                            this.refundRaffle(getAvatarOff(e), sys.id(e), refund);
                        }
                    }
                    rafflePlayers.clear();
                } else if (rafflePrizeObj) {
                    sys.sendAll("", safchan);
                    safaribot.sendAll("The current raffle prize has been cleared.", safchan);
                    sys.sendAll("", safchan);
                }
                rafflePrizeObj = null;
                permObj.add("rafflePrize", JSON.stringify(rafflePrizeObj));
                return true;
            }
            if (command === "checkraffle") {
                var obj = {};
                for (var e in rafflePlayers.hash) {
                    if (rafflePlayers.hash.hasOwnProperty(e)) {
                        obj[e] = parseInt(rafflePlayers.get(e), 10);
                    }
                }
                if (Object.keys(obj).length === 0) {
                    safaribot.sendMessage(src, "No one has entered this raffle yet!", safchan);
                    return true;
                }
                safaribot.sendMessage(src, "Raffle Entries bought: " + Object.keys(obj).filter(function(x) { return obj[x] > 0; }).map(function(x) { return x + ": " + obj[x]; }).join(" | "), safchan);
                return true;
            }
            if (command === "drawraffle") {
                if (commandData !== "confirm") {
                    safaribot.sendMessage(src, "This will conclude the current raffle and immediately pick a winner. If you wish to proceed type /drawraffle confirm.", safchan);
                    return true;
                }
                if (!rafflePrizeObj) {
                    safaribot.sendMessage(src, "No prize is defined! Use /addraffle to create a prize before trying to draw!", safchan);
                    return true;
                }

                //Clean out duplicates
                rafflePlayers.save();

                var obj = {};
                for (var e in rafflePlayers.hash) {
                    if (rafflePlayers.hash.hasOwnProperty(e)) {
                        obj[e] = parseInt(rafflePlayers.get(e), 10);
                    }
                }
                if (Object.keys(obj).length === 0) {
                    safaribot.sendMessage(src, "No one has entered this raffle meaning you can't draw a winner!", safchan);
                    return true;
                }

                var winner = randomSample(obj);
                var player = getAvatarOff(winner);
                do {
                    winner = randomSample(obj);
                    player = getAvatarOff(winner);
                } while (!player);

                sys.sendAll("", safchan);
                sys.sendHtmlAll("<b><span style='font-size:15px;'>The winner of the raffle for " + plural(rafflePrizeObj.amount, rafflePrizeObj.name) + " is: " + html_escape(winner.toCorrectCase()) + "!</span></b>", safchan);
                safaribot.sendMessage(src, "Raffle Entries bought: " + Object.keys(obj).map(function(x) { return x + ": " + obj[x]; }).join(" | "), safchan);

                var playerId = sys.id(winner);
                if (playerId) {
                    safaribot.sendMessage(playerId, "You received " + plural(rafflePrizeObj.amount, rafflePrizeObj.name) + "!", safchan);
                } else {
                    safari.offlineMessage(player, "You won a raffle for " + plural(rafflePrizeObj.amount, rafflePrizeObj.name) + "!");
                }
                if (rafflePrizeObj.type == "poke") {
                    player.pokemon.push(rafflePrizeObj.id);
                    if (isRare(rafflePrizeObj.id)) {
                        sys.appendToFile(mythLog, now() + "|||" + poke(rafflePrizeObj.id) + "::won from Raffle::" + winner.toCorrectCase() + "\n");
                    }
                } else {
                    rewardCapCheck(player, rafflePrizeObj.id, rafflePrizeObj.amount);
                }
                this.saveGame(player);
                sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + player.casedName + "|||drawraffle|||" + "won|||" + plural(rafflePrizeObj.amount, rafflePrizeObj.name) + "\n");
                sys.sendAll("", safchan);

                var currentPlayer;
                for (var e in obj) {
                    if (obj.hasOwnProperty(e)) {
                        currentPlayer = getAvatarOff(e);
                        if (currentPlayer) {
                            currentPlayer.balls.entry = 0;
                            this.saveGame(currentPlayer);
                        }
                    }
                }
                rafflePrizeObj = null;
                permObj.add("rafflePrize", JSON.stringify(rafflePrizeObj));
                rafflePlayers.clear();
                return true;
            }
            if (command === "ongoing") {
                var out = [], e, nothingFound = true, obj, list, i;
                for (e = 0; e < currentBattles.length; e++) {
                    if (currentBattles[e].npcBattle) {
                        out.push(currentBattles[e].name1 + " x " + currentBattles[e].name2);
                    }
                }
                if (out.length > 0) {
                    nothingFound = false;
                    safaribot.sendMessage(src, "Ongoing NPC Battles: " + out.join(" | "), safchan);
                }
                out = [];
                for (e = 0; e < currentAuctions.length; e++) {
                    out.push(currentAuctions[e].hostName + "'s " + currentAuctions[e].productName);
                }
                if (out.length > 0) {
                    nothingFound = false;
                    safaribot.sendMessage(src, "Ongoing Auctions: " + out.join(" | "), safchan);
                }
                out = [];
                for (e = 0; e < currentPyramids.length; e++) {
                    obj = currentPyramids[e];
                    list = [];
                    for (i in obj.stamina) {
                        list.push(i.toCorrectCase() + " (" + obj.stamina[i] + ")");
                    }
                    out.push(readable(list, "and") + " at Room " + obj.level + "-" + obj.room + " (" + plural(obj.points, "Point") + ")");
                }
                if (out.length > 0) {
                    nothingFound = false;
                    safaribot.sendMessage(src, "Ongoing Pyramid quests: " + out.join(" | "), safchan);
                }
                if (currentEvent) {
                    nothingFound = false;
                    safaribot.sendMessage(src, "Ongoing Event: " + currentEvent.eventName, safchan);
                }
                if (nothingFound) {
                    safaribot.sendMessage(src, "No ongoing NPC Battles, Auctions or Events!", safchan);
                }
                return true;
            }
            if (command === "stopongoing") {
                for (var e = 0; e < currentAuctions.length; e++) {
                    var player = getAvatar(sys.id(currentAuctions[e].hostName));
                    player.cooldowns.auction = 0;
                }
                currentAuctions = [];
                currentBattles = [];
                currentPyramids = [];
                if (currentEvent) {
                    currentEvent.log(false, [], "Signups: " + currentEvent.signups.join(", "));
                }
                currentEvent = null;
                safaribot.sendAll("All ongoing battles, auctions and events have been stopped.", safchan);
                checkUpdate();
                return true;
            }
            if (command === "dqraffle" || command === "sdqraffle") {
                var cmd = commandData.split(":");
                var target = cmd[0];
                var playerId = command === "sdqraffle" ? null : sys.id(target);
                var player = getAvatarOff(target);
                if (!player) {
                    safaribot.sendMessage(src, "No such player!", safchan);
                    return true;
                }

                if (playerId) {
                    safaribot.sendMessage(playerId, "A Safari Warden disqualified you from the current raffle.", safchan);
                }
                var refund = parseInt(cmd[1], 10) || 0;
                this.refundRaffle(player, playerId, refund);
                rafflePlayers.remove(target);

                this.saveGame(player);
                safaribot.sendMessage(src, target.toCorrectCase() + " was disqualified from the current raffle.", safchan);
                return true;
            }
            if (["gachaload", "finderload", "packload"].contains(command)) {
                var setName = ["Gachapon", "Itemfinder", "Prize Pack"][["gachaload", "finderload", "packload"].indexOf(command)];
                if (commandData === "*") {
                    switch (command) {
                        case "gachaload":
                            safaribot.sendMessage(src, setName + " set: " + JSON.stringify(gachaItems), safchan);
                        break;
                        case "finderload":
                            safaribot.sendMessage(src, setName + " set: " + JSON.stringify(finderItems), safchan);
                        break;
                        case "packload":
                            safaribot.sendMessage(src, setName + " set: " + JSON.stringify(packItems), safchan);
                        break;
                    }
                    return true;
                }
                var data;
                try {
                    data = JSON.parse(commandData);
                } catch (err) {
                    safaribot.sendMessage(src, "Invalid JSON format!", safchan);
                    return true;
                }
                for (var e in data) {
                    if (allItems.indexOf(e) !== -1 || e === "wild" || e === "nothing" || e === "recharge") {
                        continue;
                    }
                    safaribot.sendMessage(src, e + " is not a valid item!", safchan);
                    return true;
                }
                switch (command) {
                    case "gachaload":
                        gachaItems = data;
                        permObj.add("gachaRates", JSON.stringify(data));
                    break;
                    case "finderload":
                        finderItems = data;
                        permObj.add("finderRates", JSON.stringify(data));
                    break;
                    case "packload":
                        packItems = data;
                        permObj.add("packRates", JSON.stringify(data));
                    break;
                }
                safaribot.sendMessage(src, "Successfully loaded " + setName + " chances!", safchan);
                return true;
            }
            if (command === "loadthemes" || command === "loadtheme") {
                var cThemes = contestThemes;
                var url = commandData === "*" ? (permObj.get("themesurl") || commandData) : commandData;
                if (url === "*") {
                    safaribot.sendMessage(src, "Please type a valid URL!", safchan);
                    return true;
                }
                safaribot.sendMessage(src, "Loading themes from " + url + "!", safchan);
                try {
                    sys.webCall(url, function (resp) {
                        try {
                            contestThemes = JSON.parse(resp);
                            sys.write(themesFile, resp);
                            permObj.add("themesurl", url);
                            safaribot.sendMessage(src, "Contest Themes successfully loaded!", safchan);
                        } catch (error) {
                            contestThemes = cThemes;
                            safaribot.sendMessage(src, "Couldn't load Contest Themes from " + url + "! Error: " + error, safchan);
                        }
                    });
                } catch (err) {
                    contestThemes = cThemes;
                    safaribot.sendMessage(src, "Couldn't load Contest Themes from " + url + "! Error: " + err, safchan);
                }
                return true;
            }
            if (command === "loaddecorations" || command === "loaddecoration") {
                var cThemes = decorations;
                var url = commandData === "*" ? (permObj.get("decosurl") || commandData) : commandData;
                if (url === "*") {
                    safaribot.sendMessage(src, "Please type a valid URL!", safchan);
                    return true;
                }
                safaribot.sendMessage(src, "Loading decorations from " + url + "!", safchan);
                try {
                    sys.webCall(url, function (resp) {
                        try {
                            decorations = JSON.parse(resp);
                            sys.write(decorationsFile, resp);
                            permObj.add("decosurl", url);
                            safaribot.sendMessage(src, "Decorations successfully loaded!", safchan);
                            safari.sanitizeAll();
                        } catch (error) {
                            decorations = cThemes;
                            safaribot.sendMessage(src, "Couldn't load Decorations from " + url + "! Error: " + error, safchan);
                        }
                    });
                } catch (err) {
                    decorations = cThemes;
                    safaribot.sendMessage(src, "Couldn't load Contest Themes from " + url + "! Error: " + err, safchan);
                }
                return true;
            }
            if (command === "reloadids") {
                var e, data, obj = {};
                for (e in rawPlayers.hash) {
                    if (rawPlayers.hash.hasOwnProperty(e)) {
                        data = JSON.parse(rawPlayers.hash[e]);
                        if (data.idnum === undefined) {
                            safari.sanitize(data);
                        }
                        obj[data.idnum] = data.id;
                    }
                }
                idnumList.clear();
                for (e in obj) {
                    if (obj.hasOwnProperty(e)) {
                        idnumList.add(e, obj[e]);
                    }
                }
                safaribot.sendMessage(src, "ID Numbers successfully reloaded!", safchan);
                return true;
            }
            if (command === "setccatch" || command === "setccatch2") {
                if (commandData === "*") {
                    safaribot.sendMessage(src, "Current ccatch are '" + ccatch + "' and '" + ccatch2 + "'!", safchan);
                    return true;
                }
                if (command === "setccatch") {
                    ccatch = commandData.toLowerCase();
                    permObj.add("ccatch", ccatch);
                    safaribot.sendMessage(src, "Changed ccatch to " + ccatch + "!", safchan);
                } else {
                    ccatch2 = commandData.toLowerCase();
                    permObj.add("ccatch2", ccatch2);
                    safaribot.sendMessage(src, "Changed ccatch2 to " + ccatch2 + "!", safchan);
                }
                return true;
            }
            if (command === "editplayer") {
                var info = commandData.split(":");
                var player = getAvatarOff(info[0]);
                if (!player) {
                    safaribot.sendMessage(src, "This person doesn't have a Safari save!", safchan);
                    return true;
                }
                if (info.length < 3) {
                    safaribot.sendMessage(src, "Invalid format! Use /editplayer Name:Property.child1.child2:NewValue to edit someone's data!", safchan);
                    return true;
                }
                try {
                    var prop = info[1].split(".");
                    var val = JSON.parse(info.slice(2).join(":")), oldVal;
                    var attr = player;
                    var propName = [];
                    var success = false;
                    
                    if (prop.length == 1 && prop[0] === "") {
                        safaribot.sendMessage(src, "Please specify a valid property to edit!", safchan);
                        return true;
                    } else {
                        for (var e = 0; e < prop.length; e++) {
                            propName.push(prop[e]);
                            if (prop[e] in attr) {
                                if (propName.join(".") === prop.join(".")) {
                                    oldVal = JSON.stringify(attr[prop[e]]);
                                    attr[prop[e]] = val;
                                    success = true;
                                    break;
                                } else {
                                    attr = attr[prop[e]];
                                }
                            } else {
                                safaribot.sendMessage(src, "This player does not have a '" + propName.join(".") + "' property!", safchan);
                                return true;
                            }
                        }
                    }
                    if (success) {
                        safaribot.sendMessage(src, "Successfully changed {0}.{1} from '{2}' to '{3}'!".format(info[0].toCorrectCase(), propName.join("."), oldVal, JSON.stringify(val)), safchan);
                        safari.saveGame(player);
                        sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + info[0].toCorrectCase() + "|||editplayer|||had their " + propName.join(".") + " property changed from|||" + oldVal + " to " + JSON.stringify(val) + "\n");
                    } else {
                        safaribot.sendMessage(src, "Couldn't edit {0}.{1} from '{2}' to '{3}'!".format(info[0].toCorrectCase(), propName.join("."), oldVal, JSON.stringify(val)), safchan);
                    }
                } catch (err) {
                    safaribot.sendMessage(src, "Error when trying to edit data: " + err + (err.lineNumber ? " on line " + err.lineNumber : ""), safchan);
                }
                return true;
            }
            if (command === "nextspawn") {
                if (commandData === "*") {
                    safaribot.sendMessage(src, "Syntax: /nextspawn [player]:[pokemon]:[amount]:[disguise].", safchan);
                    return true;
                }
                var data = commandData.split(":");
                var player = getAvatarOff(data[0]);
                if (!player) {
                    safaribot.sendMessage(src, "This person doesn't have a Safari save!", safchan);
                    return true;
                }
                if (data.length < 2) {
                    safaribot.sendMessage(src, "Invalid format! Use /nextspawn [player]:[pokemon]:[amount]:[disguise]!", safchan);
                    return true;
                }
                var info = getInputPokemon(data[1]);
                if (!info.num) {
                    safaribot.sendMessage(src, "Invalid Actual Pokémon!", safchan);
                    return;
                }
                
                player.nextSpawn.pokemon = info;
                var amount = parseInt(data[2], 10) || 1;
                player.nextSpawn.amt = amount;
                var appearAs = info;
                if (data[3]) {
                    appearAs = getInputPokemon(data[3]);
                    if (!appearAs.num) {
                        safaribot.sendMessage(src, "Invalid Disguise Pokémon!", safchan);
                        return true;
                    }
                }
                player.nextSpawn.disguise = appearAs;                
                safari.saveGame(player);
                var translated = plural(amount, info.name) + (appearAs.name !== info.name ? " disguised as " + appearAs.name : "") + ".";
                safaribot.sendMessage(src, "The next spawn by " + data[0].toCorrectCase() + " will be " + translated, safchan);
                sys.appendToFile(giftLog, now() + "|||" + sys.name(src) + "|||" + data[0].toCorrectCase() + "|||nextspawn|||had their next spawn changed to " + translated + "|||\n");
                return true;                
            }
            if (command === "editdata") {
                if (commandData === "*") {
                    safaribot.sendMessage(src, "Syntax: /editdata [costume/item]:[Name]:[Property]:[New Value].", safchan);
                    safaribot.sendMessage(src, "When editing a string, remember to include the quotation marks.", safchan);
                    return true;
                }
                var info = commandData.indexOf("::") > -1 ? commandData.split("::") : commandData.split(":");
                var data, e, type, list, defaultData, customValues;
                switch (info[0]) {
                    case "costume":
                    case "costumes":
                        type = "costume";
                        data = costumeData;
                        defaultData = defaultCostumeData;
                        list = editableCostumeProps;
                    break;
                    default:
                        type = "item";
                        data = itemData;
                        defaultData = defaultItemData;
                        list = editableItemProps;
                }
                var objName = "custom" + cap(type) + "Data";
                try {
                    customValues = JSON.parse(permObj.get(objName));
                } catch (err) {
                    customValues = {};
                }
                var showEditable = function(obj, list, id) {
                    var out = [], i;
                    for (i in obj) {
                        if (i in list) {
                            if (customValues.hasOwnProperty(id) && customValues[id].hasOwnProperty(i) && customValues[id][i] !== defaultData[id][i]) {
                                out.push("<span style='color: blue'><b>" + i + ": " + obj[i] + "</b></span>");
                            } else {
                                out.push(i + ": " + obj[i]);
                            }
                        }
                    }
                    return out.join(", ");
                };
                if (info.length < 2 || info[1] === "") {
                    sys.sendMessage(src, "", safchan);
                    for (e in data) {
                        safaribot.sendHtmlMessage(src, e + ": " + showEditable(data[e], list, e), safchan);
                    }
                    sys.sendMessage(src, "", safchan);
                    return true;
                }
                var item = info[1].toLowerCase();
                if (!data.hasOwnProperty(item)) {
                    safaribot.sendMessage(src, "Invalid " + cap(type) + "!", safchan);
                    return true;
                }
                if (info.length < 3) {
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendHtmlMessage(src, item + ": " + showEditable(data[item], list, item), safchan);
                    sys.sendMessage(src, "", safchan);
                    return true;
                }
                var prop = info[2];
                if (!(prop in list)) {
                    safaribot.sendMessage(src, prop + " is not a valid editable property!", safchan);
                    return true;
                }
                var propTypes = Array.isArray(list[prop]) ? list[prop] : [list[prop]];
                var currentVal = data[item][prop];
                if (info.length < 4 || info[3] === "") {
                    safaribot.sendMessage(src, "The property " + prop + " can be edited into " + an(readable(propTypes, "or")) + "! " + (prop in data[item] ? "Current value: " + currentVal : ""), safchan);
                    return true;
                }
                var newVal;
                if (info[3].toLowerCase() === "clear") {
                    if (!customValues.hasOwnProperty(item)) {
                        safaribot.sendMessage(src, "The " + type + " " + item + " has no customized property to clear!", safchan);
                        return true;
                    }
                    if (!customValues[item].hasOwnProperty(prop)) {
                        safaribot.sendMessage(src, "The property " + prop + " for " + type + " " + item + " is not customized!", safchan);
                        return true;
                    }
                    delete customValues[item][prop];
                    data[item][prop] = newVal = defaultData[item][prop];
                    if (newVal === undefined) {
                        delete data[item][prop];
                    }
                    safaribot.sendMessage(src, "Reset custom property " + prop + " for " + type + "Data." + item + "." + prop + " to its default value '" + newVal + "'!", safchan);
                } else {
                    try {
                        newVal = JSON.parse(info[3]);
                    } catch (err) {
                        safaribot.sendMessage(src, info[3] + " is not a valid value!", safchan);
                        return true;
                    }
                    var newType = Array.isArray(newVal) ? "array" : typeof newVal;
                    var currentType = Array.isArray(currentVal) ? "array" : typeof currentVal;
                    if (newType !== currentType && !propTypes.contains(newType)) {
                        safaribot.sendMessage(src, prop + " cannot be " + an(newType) + "!", safchan);
                        return true;
                    }
                    if (!customValues.hasOwnProperty(item)) {
                        customValues[item] = {};
                    }
                    data[item][prop] = newVal;
                    customValues[item][prop] = newVal;
                    safaribot.sendMessage(src, "Changed " + type + "Data." + item + "." + prop + " from '" + currentVal + "' to '" + newVal + "'!", safchan);
                }
                permObj.add(objName, JSON.stringify(customValues));
                return true;
            }
            if (command === "config") {
                var info = commandData.split(":"), editable = ["arena_pink", "arena_teal", "arena_mustard", "arena_cyan", "arena_crimson", "arena_rainbow", "tier_chances"], prop, val;
                if (commandData.toLowerCase() === "current") {
                    safaribot.sendMessage(src, "Current configurable values:", safchan);
                    for (var e = 0; e < editable.length; e++) {
                        prop = editable[e];
                        val = configObj.get(prop);
                        if (val) {
                            safaribot.sendMessage(src, prop + ": " + val, safchan);
                        }
                    }
                    return true;
                }
                if (commandData === "*" || info.length < 2) {
                    safaribot.sendMessage(src, "Syntax: /config [Property]:[New Value].", safchan);
                    safaribot.sendMessage(src, "When editing a string, remember to include the quotation marks.", safchan);
                    safaribot.sendMessage(src, "Valid Properties: " + editable.join(", ") + ". Type '/config current' to see the current values.", safchan);
                    return true;
                }
                prop = info[0].toLowerCase();
                val = info.slice(1).join(":");
                
                
                if (editable.contains(prop) === false) {
                    safaribot.sendMessage(src, "Invalid property! Type /config for more details!", safchan);
                    return true;
                }
                var old = configObj.get(prop);
                
                configObj.add(prop, val);
                safari.loadConfigurables();
                safaribot.sendMessage(src, "Edited property '{0}' from '{1}' to '{2}'!".format(prop, old, val), safchan);
                return true;
            }
        }
        /*if (sys.auth(src) > 2) {
            if (command === "updateplugin" && commandData === "safari.js") {
                if (!currentPokemon && contestCooldown > 180 && contestCount <= 0 && currentBattles.length === 0 && currentPyramids.length === 0 && currentAuctions.length === 0 && !currentEvent && !safariUpdating) {
                    safariUpdating = true;
                    sys.sendHtmlAll(closedMessage, safchan);
                }
                if (!safariUpdating) {
                    safaribot.sendMessage(src, "You shouldn't update without putting Safari into an update ready state with /update.", safchan);
                    return true;
                }

                safariUpdating = true;
                //Then fall through to the actual command to update plugin
            }
        }*/
        return false;
    };
    
    /* Events */
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
        cookedPlayers = new MemoryHash(deletedSaveFiles);
        rafflePlayers = new MemoryHash(rafflePlayersFile);
        tradeBans = new MemoryHash(tradebansFile);
        saltBans = new MemoryHash(saltbansFile);
        idnumList = new MemoryHash(idnumFile);
        permObj = new MemoryHash(permFile);
        configObj = new MemoryHash(configFile);
        safari.loadConfigurables();
        try {
            npcShop = JSON.parse(permObj.get("npcShop"));
        } catch (err) {
            npcShop = {};
        }
        try {
            recipeData = JSON.parse(permObj.get("alchemistRecipes"));
        } catch (err) {
            recipeData = {};
        }
        var temp;
        try {
            temp = JSON.parse(permObj.get("gachaRates"));
            gachaItems = temp;
        } catch (err) {}
        try {
            temp = JSON.parse(permObj.get("finderRates"));
            finderItems = temp;
        } catch (err) {}
        try {
            temp = JSON.parse(permObj.get("packRates"));
            packItems = temp;
        } catch (err) {}
        try {
            dailyBoost = JSON.parse(permObj.get("dailyBoost"));
        } catch (err) {
            this.changeDailyBoost();
        }
        try {
            scientistQuest = JSON.parse(permObj.get("scientistQuest"));
        } catch (err) {
            this.changeScientistQuest();
        }
        try {
            lastLeaderboards = JSON.parse(permObj.get("lastLeaderboards"));
        } catch (err) {
            lastLeaderboards = null;
        }
        try {
            rafflePrizeObj = JSON.parse(permObj.get("rafflePrize"));
        } catch (err) {
            rafflePrizeObj = null;
        }
        try {
            lastContests = JSON.parse(permObj.get("lastContests"));
        } catch (err) {
            lastContests = [];
        }
        try {
            allowedSharedIPNames = JSON.parse(permObj.get("allowedSharedIPs"));
        } catch (err) {
            allowedSharedIPNames = [];
        }
        if (permObj.hash.hasOwnProperty("ccatch")) {
            ccatch = permObj.get("ccatch");
        }
        if (permObj.hash.hasOwnProperty("ccatch2")) {
            ccatch2 = permObj.get("ccatch2");
        }
        try {
            if (!defaultItemData) {
                defaultItemData = JSON.parse(JSON.stringify(itemData));
            }
            var customValues = JSON.parse(permObj.get("customItemData")), e, i, obj;
            for (e in customValues) {
                if (e in itemData) {
                    obj = customValues[e];
                    for (i in obj) {
                        itemData[e][i] = obj[i];
                    }
                }
            }
        } catch (err) {
        }
        try {
            if (!defaultCostumeData) {
                defaultCostumeData = JSON.parse(JSON.stringify(costumeData));
            }
            var customValues = JSON.parse(permObj.get("customCostumeData")), e, i, obj;
            for (e in customValues) {
                if (e in costumeData) {
                    obj = customValues[e];
                    for (i in obj) {
                        costumeData[e][i] = obj[i];
                    }
                }
            }
        } catch (err) {
        }
        try {
            var data = JSON.parse(sys.getFileContent(themesFile));
            contestThemes = data || contestThemes;
        } catch (err) {
        }
        try {
            var data = JSON.parse(sys.getFileContent(decorationsFile));
            decorations = data || {};
        } catch (err) {
        }
        monthlyLeaderboards = {};
        for (var e in monthlyLeaderboardTypes) {
            monthlyLeaderboards[e] = new MemoryHash(monthlyLeaderboardTypes[e].file);
        }
        lastIdAssigned = loadLastId();
        
        var template = permObj.get("playerTemplate");
        if (template) {
            template = JSON.parse(template);
            if (!objectEquals(playerTemplate, template)) {
                safaribot.sendAll("Updating save files...", safchan);
                safari.sanitizeAll();
            }
        }
        permObj.add("playerTemplate", JSON.stringify(playerTemplate));
        
        this.updateLeaderboards();
        sys.sendHtmlAll(openedMessage, safchan);
        if (baitCooldown < 7) {
            baitCooldown = sys.rand(5,7);
        }
        if (goldenBaitCooldown < 10) {
            goldenBaitCooldown = sys.rand(10, 13);
        }
    };
    this.afterChannelJoin = function (src, channel) {
        if (channel == safchan) {
            this.loadGame(src);
        }
        return false;
    };
    this.beforeChannelLeave = function (src, channel) {
        if (channel == safchan && getAvatar(src)) {
            this.clearPlayer(src);
            this.saveGame(getAvatar(src));
        }
        return false;
    };
    this.afterChangeTeam = function (src) {
        if (sys.isInChannel(src, safchan)) {
            var player = getAvatar(src);
            if (player) {
                if (sys.name(src).toLowerCase() !== player.id) {
                    this.clearPlayer(src);
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
    this.onSafban = function (src) {
        if (this.isInAuction(sys.name(src))) {
            for (var b in currentAuctions) {
                currentAuctions[b].removePlayer(src);
            }
        }
        if (currentEvent) {
            currentEvent.shove(null, sys.name(src));
        }
        //TODO: Make them lose their battle too
        if (sys.isInChannel(src, safchan)) {
            sys.kick(src, safchan);
        }

    };
    this.stepEvent = function () {
        contestCooldown--;
        releaseCooldown--;
        baitCooldown--;
        goldenBaitCooldown--;
        successfulBaitCount--;

        if (currentEvent && contestCooldown % currentEvent.turnLength === 0) {
            currentEvent.nextTurn();
            if (currentEvent.finished) {
                currentEvent = null;
                checkUpdate(); //test
            }
        }
        if (currentBattles.length > 0 && contestCooldown % 4 === 0) {
            for (var e = currentBattles.length - 1; e >= 0; e--) {
                var battle = currentBattles[e];
                battle.nextTurn();
                if (battle.finished) {
                    currentBattles.splice(e, 1);
                    checkUpdate();
                }
            }
        }
        if (currentPyramids.length > 0) {
            for (var e = currentPyramids.length - 1; e >= 0; e--) {
                var pyr = currentPyramids[e];
                pyr.nextTurn();
                if (pyr.finished) {
                    currentPyramids.splice(e, 1);
                    checkUpdate();
                }
            }
        }
        if (currentAuctions.length > 0 && contestCooldown % 8 === 0) {
            for (var e = currentAuctions.length - 1; e >= 0; e--) {
                var auction = currentAuctions[e];
                auction.nextTurn();
                if (auction.finished) {
                    currentAuctions.splice(e, 1);
                    checkUpdate();
                }
            }
        }

        if (successfulBaitCount <= 0) {
            lastBaitersDecay--;
        }
        if (preparationPhase > 0) {
            preparationPhase--;
            if (preparationPhase <= 0) {
                resolvingThrows = true;
                var name, i;
                var list = Object.keys(preparationThrows);
                for (i in preparationThrows) {
                    if (preparationThrows[i] == "quick") {
                        list.push(i);
                        list.push(i);
                    }
                }
                var throwers = list.shuffle(), alreadyThrow = [];
                if (preparationFirst) {
                    if (throwers.indexOf(preparationFirst) !== -1) {
                        throwers.splice(throwers.indexOf(preparationFirst), 1);
                        throwers.splice(0, 0, preparationFirst);
                    }
                }
                //Store value to prevent first person from getting credit
                var temp = isBaited;
                isBaited = false;
                for (i = 0; i < throwers.length; i++) {
                    if (i + 1 >= throwers.length) {
                        resolvingThrows = false;
                    }
                    name = throwers[i];
                    if (sys.isInChannel(sys.id(name), safchan) && alreadyThrow.indexOf(name) === -1) {
                        alreadyThrow.push(name);
                        safari.throwBall(sys.id(name), preparationThrows[name], false, true);
                    }
                    //Now toggle it correctly again
                    isBaited = temp;
                }
                preparationFirst = null;
                preparationThrows = {};
            }
        }
        if (contestCooldown === 180) {
            var possibleThemes = Object.keys(contestThemes).concat();
            var repetitionCooldown = 4;
            for (var e = lastContests.length - 1, i = 0; e >= 0 && i < repetitionCooldown; e--, i++) {
                if (possibleThemes.contains(lastContests[e].themeId)) {
                    possibleThemes.splice(possibleThemes.indexOf(lastContests[e].themeId), 1);
                }
            }
            if (sys.rand(0, 100) < 38) {
                nextTheme = ["none"];
                nextTheme = nextTheme.concat(possibleThemes.shuffle().slice(0, 2));
            } else {
                nextTheme = [];
                nextTheme = possibleThemes.shuffle().slice(0, 3);
            }

            nextRules = {};
            var rulesDesc = [];
            for (var n = 0; n < nextTheme.length; n++) {
                var t = nextTheme[n];
                if (t == "none") {
                    nextRules[t] = safari.pickRules(null);
                } else {
                    nextRules[t] = safari.pickRules(t);
                }
                rulesDesc.push("Rules for " + themeName(t) + " --- " + safari.translateRules(nextRules[t]));
            }
            contestVotingCount--;
            contestVotes = null;
            if (contestVotingCount <= 0) {
                contestVotes = {};
                contestVotingCount = contestVotingCooldown;
            }

            sys.sendAll(separator, safchan);
            safaribot.sendAll("A new " + (nextTheme !== "none" ? themeName(nextTheme) + "-themed" : "") + " Safari contest will start in 3 minutes! Prepare your active Pokémon and all Pokéballs you need!", safchan);
            for (n = 0; n < rulesDesc.length; n++) {
                safaribot.sendAll(" --- " + rulesDesc[n], safchan);
            }
            if (contestVotes) {
                safaribot.sendHtmlAll("You can choose which theme will be started! Type " + readable(nextTheme.map(function(x){ return link("/vote " + themeName(x)); }), "or") + " to choose!", safchan);
            }
            sys.sendAll(separator, safchan);

            sys.sendAll("", 0);
            sys.sendAll(separator, 0);
            safaribot.sendAll("A new " + (nextTheme !== "none" ? themeName(nextTheme) + "-themed" : "") + " Safari contest will start in 3 minutes at #" + defaultChannel + "! Prepare your active Pokémon and all Pokéballs you need!", 0);
            sys.sendAll(separator, 0);
            sys.sendAll("", 0);
            safari.flashPlayers();
            var players = sys.playersOfChannel(safchan);
            for (var pid in players) {
                var player = getAvatar(players[pid]);
                if (player) {
                    safari.fullBoxWarning(players[pid]);
                }
            }
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
                var winners = [], pokeWinners = [], maxCaught = 0, maxBST = 0, player, contestInfo = { finished: now() }, fullWinners = [];
                for (var e in contestCatchers) {
                    if (contestCatchers.hasOwnProperty(e)) {
                        if (contestCatchers[e].length >= maxCaught) {
                            player = getAvatarOff(e);
                            if (player) {
                                if (contestCatchers[e].length > maxCaught) {
                                    winners = [];
                                    pokeWinners = [];
                                    fullWinners = [];
                                    maxCaught = contestCatchers[e].length;
                                }
                                winners.push(e);
                                pokeWinners.push(poke(player.party[0]));
                                fullWinners.push(e.toCorrectCase() + " (using " + poke(player.party[0]) + ")");
                            }
                        }
                    }
                }
                var tieBreaker = [], bst, name, top = winners.length, catchersBST = {}, allContestants = [];

                safari.compileThrowers();
                var allContestants = Object.keys(contestCatchers), pokemonSpawned = 0;
                for (e in contestCatchers) {
                    if (contestCatchers.hasOwnProperty(e)) {
                        catchersBST[e] = add(contestCatchers[e].map(getBST));
                        pokemonSpawned += contestCatchers[e].length;
                    }
                }
                if (top > 1) {
                    maxBST = 0;
                    pokeWinners = [];
                    for (e in winners) {
                        name = winners[e];
                        bst = catchersBST[name];

                        if (bst >= maxBST) {
                            player = getAvatarOff(name);
                            if (player) {
                                if (bst > maxBST) {
                                    tieBreaker = [];
                                    pokeWinners = [];
                                    fullWinners = [];
                                    maxBST = bst;
                                }
                                tieBreaker.push(name);
                                pokeWinners.push(poke(player.party[0]));
                                fullWinners.push(name.toCorrectCase() + " (using " + poke(player.party[0]) + ")");
                            }
                        }
                    }
                    winners = tieBreaker;
                }
                allContestants.sort(function(a, b) {
                    if (contestCatchers[a].length > contestCatchers[b].length) {
                        return -1;
                    }
                    else if (contestCatchers[a].length < contestCatchers[b].length) {
                        return 1;
                    }
                    else if (catchersBST[a] > catchersBST[b]) {
                        return -1;
                    }
                    else if (catchersBST[a] < catchersBST[b]) {
                        return 1;
                    }
                    return 0;
                });

                var playerScore = function(name) {
                    return "(Caught " + contestCatchers[name].length + ", BST " + catchersBST[name] + ")";
                };

                var reward = currentRules && currentRules.rewards ? currentRules.rewards : { gacha: 10 };
                sys.sendAll(separator, safchan);
                safaribot.sendAll("The Safari contest is now over! Please come back during the next contest!", safchan);
                if (Object.keys(contestCatchers).length === 1) {
                    safaribot.sendAll("No prizes have been given because there was only one contestant!", safchan);
                    winners = [];
                    contestInfo.winners = null;
                } else if (winners.length > 0) {
                    var list = [];
                    for (var e in reward) {
                        list.push(reward[e] + " " + itemAlias(e, false, true) + (reward[e] === 1 ? "" : "s"));
                    }
                    if (list.length < 1) {
                        list.push("a prize");
                    }
                    safaribot.sendAll(readable(winners.map(function (x) { return x.toCorrectCase(); }), "and") + ", with the help of their " + readable(pokeWinners, "and") + ", caught the most Pokémon (" + maxCaught + (top > 1 ? ", total BST: " + maxBST : "") + ") during the contest and " + (winners.length > 1 ? "have" : "has") + " won " + readable(list, "and")  + "!", safchan);
                    contestInfo.winners = readable(fullWinners, "and");
                    contestInfo.caught = maxCaught;
                    contestInfo.bst = maxBST === 0 ? catchersBST[winners[0]] : maxBST;
                }
                if (allContestants.length > 0) {
                    safaribot.sendAll(allContestants.map(function (x) { return x.toCorrectCase() + " " + playerScore(x); }).join(", "), safchan);
                }
                sys.sendAll(separator, safchan);

                var winner, playerId, amt;
                for (e in contestantsCount) {
                    if (contestantsCount.hasOwnProperty(e)) {
                        player = getAvatarOff(e);
                        if (contestantsCount[e] > 0 && player) {
                            playerId = sys.id(e);
                            var basis = 2.5;
                            amt = Math.max(Math.floor(Math.min(contestantsCount[e] / pokemonSpawned, 1) * basis), 1);
                            if (playerId) {
                                if (e in contestCatchers) {
                                    safaribot.sendMessage(playerId, "You finished in " + getOrdinal(winners.contains(e) ? 1 : allContestants.indexOf(e) + 1) + " place " + playerScore(e), safchan);
                                }
                                safaribot.sendMessage(playerId, "You received " + plural(amt, "bait") + " for participating in the contest!", safchan);
                            }
                            rewardCapCheck(player, "bait", amt);
                            /*if (amt >= Math.floor(basis)) {
                                player.records.fullyPlayedContests += 1;
                            }*/
                            safari.saveGame(player);
                        }
                    }
                }

                if (winners.length > 0) {
                    var r, rewardName, amt;
                    for (e in winners) {
                        winner = winners[e];
                        player = getAvatarOff(winner);
                        if (player) {
                            rewardName = [];
                            for (r in reward) {
                                amt = reward[r];
                                if (amt > 0) {
                                    player.balls[r] += amt;
                                    if (player.balls[r] > getCap(r)) {
                                        player.balls[r] = getCap(r);
                                    }
                                    rewardName.push(amt + " " + itemAlias(r, false, true) + (amt === 1 ? "" : "s"));
                                }
                            }
                            player.records.contestsWon += 1;
                            safari.addToMonthlyLeaderboards(player.id, "contestsWon", 1);
                            safari.saveGame(player);
                            playerId = sys.id(winner);
                            if (playerId) {
                                safaribot.sendMessage(playerId, "You received " + readable(rewardName, "and") + " for winning the contest!", safchan);
                            }
                        }
                    }
                }
                if (currentPokemon && isRare(currentPokemon)) {
                    sys.appendToFile(mythLog, now() + "|||" + poke(currentPokemon) + "::disappeared with the contest::\n");
                }
                
                contestInfo.themeId = currentTheme ? currentTheme : "none";
                contestInfo.theme = currentTheme ? contestThemes[currentTheme].name : "Default";
                contestInfo.rules = safari.translateRules(currentRules);
                lastContests.push(contestInfo);
                if (lastContests.length > 10) {
                    lastContests.shift();
                }
                permObj.add("lastContests", JSON.stringify(lastContests));
                //Clear throwers if the contest ends with a Wild Pokemon uncaught
                resetVars();
                currentRules = null;
                contestCatchers = {};

                //Check daily rewards after a contest so players won't need to relog to get their reward when date changes
                var onChannel = sys.playersOfChannel(safchan),
                    today = getDay(now());
                for (e in onChannel) {
                    safari.dailyReward(onChannel[e], today);
                    safari.revertMega(onChannel[e]);
                }
                safari.updateLeaderboards();
                rawPlayers.save();
                cookedPlayers.save();
                rafflePlayers.save();
                if (now() > scientistQuest.expires) {
                    safari.changeScientistQuest();
                }
                if (today >= getDay(dailyBoost.expires)) {
                    safari.changeDailyBoost();
                    safari.checkNewMonth();
                }
                checkUpdate();
            } else {
                if (!currentPokemon && chance(0.089743 + (sys.playersOfChannel(safchan).length > 54 ? 0.011 : 0) )) {
                    var amt = chance(0.05919) ? (chance(0.35) ? 3 : 2) : 1;
                    safari.createWild(null, null, amt);
                }
            }
        }
    };
}
module.exports = new Safari();
