// Global variables inherited from scripts.js
/*global checkbot, sys, staffchannel, require, pokedex, Config, module */
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

var dwlist = [
    "Timburr", "Gurdurr", "Conkeldurr", "Pansage", "Pansear", "Panpour", "Simisear", "Simisage", "Simipour", "Ekans", "Arbok", "Paras", "Parasect", "Happiny", "Chansey", "Blissey", "Munchlax", "Snorlax", "Aipom", "Ambipom", "Pineco", "Forretress", "Wurmple", "Silcoon", "Cascoon", "Beautifly", "Dustox", "Seedot", "Nuzleaf", "Shiftry", "Slakoth", "Vigoroth", "Slaking", "Nincada", "Ninjask", "Plusle", "Minun", "Budew", "Roselia", "Gulpin", "Swalot", "Kecleon", "Kricketot", "Kricketune", "Cherubi", "Cherrim", "Carnivine", "Audino", "Throh", "Sawk", "Scraggy", "Scrafty", "Rattata", "Raticate", "Nidoran-F", "Nidorina", "Nidoqueen", "Nidoran-M", "Nidorino", "Nidoking", "Oddish", "Gloom", "Vileplume", "Bellossom", "Bellsprout", "Weepinbell", "Victreebel", "Ponyta", "Rapidash", "Farfetch'd", "Doduo", "Dodrio", "Exeggcute", "Exeggutor", "Lickitung", "Lickilicky", "Tangela", "Tangrowth", "Kangaskhan", "Sentret", "Furret", "Cleffa", "Clefairy", "Clefable", "Igglybuff", "Jigglypuff", "Wigglytuff", "Mareep", "Flaaffy", "Ampharos", "Hoppip", "Skiploom", "Jumpluff", "Sunkern", "Sunflora", "Stantler", "Poochyena", "Mightyena", "Lotad", "Ludicolo", "Lombre", "Taillow", "Swellow", "Surskit", "Masquerain", "Bidoof", "Bibarel", "Shinx", "Luxio", "Luxray", "Psyduck", "Golduck", "Growlithe", "Arcanine", "Scyther", "Scizor", "Tauros", "Azurill", "Marill", "Azumarill", "Bonsly", "Sudowoodo", "Girafarig", "Miltank", "Zigzagoon", "Linoone", "Electrike", "Manectric", "Castform", "Pachirisu", "Buneary", "Lopunny", "Glameow", "Purugly", "Natu", "Xatu", "Skitty", "Delcatty", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Leafeon", "Glaceon", "Bulbasaur", "Charmander", "Squirtle", "Ivysaur", "Venusaur", "Charmeleon", "Charizard", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Infernape", "Monferno", "Piplup", "Prinplup", "Empoleon", "Treecko", "Sceptile", "Grovyle", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Caterpie", "Metapod", "Butterfree", "Pidgey", "Pidgeotto", "Pidgeot", "Spearow", "Fearow", "Zubat", "Golbat", "Crobat", "Aerodactyl", "Hoothoot", "Noctowl", "Ledyba", "Ledian", "Yanma", "Yanmega", "Murkrow", "Honchkrow", "Delibird", "Wingull", "Pelipper", "Swablu", "Altaria", "Starly", "Staravia", "Staraptor", "Gligar", "Gliscor", "Drifloon", "Drifblim", "Skarmory", "Tropius", "Chatot", "Slowpoke", "Slowbro", "Slowking", "Krabby", "Kingler", "Horsea", "Seadra", "Kingdra", "Goldeen", "Seaking", "Magikarp", "Gyarados", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Wooper", "Quagsire", "Qwilfish", "Corsola", "Remoraid", "Octillery", "Mantine", "Mantyke", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Barboach", "Whiscash", "Clamperl", "Gorebyss", "Huntail", "Relicanth", "Luvdisc", "Buizel", "Floatzel", "Finneon", "Lumineon", "Tentacool", "Tentacruel", "Corphish", "Crawdaunt", "Lileep", "Cradily", "Anorith", "Armaldo", "Feebas", "Milotic", "Shellos", "Gastrodon", "Lapras", "Dratini", "Dragonair", "Dragonite", "Elekid", "Electabuzz", "Electivire", "Poliwag", "Poliwrath", "Politoed", "Poliwhirl", "Vulpix", "Ninetales", "Musharna", "Munna", "Darmanitan", "Darumaka", "Mamoswine", "Togekiss", "Burmy", "Burmy-Trash", "Burmy-Sandy", "Wormadam", "Wormadam-Trash", "Wormadam-Sandy", "Mothim", "Pichu", "Pikachu", "Raichu","Abra","Kadabra","Alakazam","Spiritomb","Mr. Mime","Mime Jr.","Meditite","Medicham","Meowth","Persian","Shuppet","Banette","Spinarak","Ariados","Drowzee","Hypno","Wobbuffet","Wynaut","Snubbull","Granbull","Houndour","Houndoom","Smoochum","Jynx","Ralts", "Kirlia", "Gardevoir","Gallade","Sableye","Mawile","Volbeat","Illumise","Spoink","Grumpig","Stunky","Skuntank","Bronzong","Bronzor","Mankey","Primeape","Machop","Machoke","Machamp","Magnemite","Magneton","Magnezone","Koffing","Weezing","Rhyhorn","Rhydon","Rhyperior","Teddiursa","Ursaring","Slugma","Magcargo","Phanpy","Donphan","Magby","Magmar","Magmortar","Larvitar","Pupitar","Tyranitar","Makuhita","Hariyama","Numel","Camerupt","Torkoal","Spinda","Trapinch","Vibrava","Flygon","Cacnea","Cacturne","Absol","Beldum","Metang","Metagross","Hippopotas","Hippowdon","Skorupi","Drapion","Tyrogue","Hitmonlee","Hitmonchan","Hitmontop","Bagon","Shelgon","Salamence","Seel","Dewgong","Shellder","Cloyster","Chinchou","Lanturn","Smeargle","Porygon","Porygon2","Porygon-Z","Drilbur", "Excadrill", "Basculin", "Basculin-Blue Striped", "Alomomola", "Stunfisk", "Druddigon", "Foongus", "Amoonguss", "Liepard", "Purrloin", "Minccino", "Cinccino", "Sandshrew", "Sandslash", "Vullaby", "Mandibuzz", "Braviary", "Frillish", "Jellicent", "Weedle", "Kakuna", "Beedrill", "Shroomish", "Breloom", "Zangoose", "Seviper", "Combee", "Vespiquen", "Patrat", "Watchog", "Blitzle", "Zebstrika", "Woobat", "Swoobat", "Mienfoo", "Mienshao", "Bouffalant", "Staryu", "Starmie", "Togepi", "Shuckle", "Togetic", "Rotom", "Sigilyph", "Riolu", "Lucario", "Lugia", "Ho-Oh", "Dialga", "Palkia", "Giratina", "Grimer", "Muk", "Ditto", "Venonat", "Venomoth", "Herdier", "Lillipup", "Stoutland", "Sewaddle", "Swadloon", "Leavanny", "Cubchoo", "Beartic", "Landorus", "Thundurus", "Tornadus","Dunsparce", "Sneasel", "Weavile", "Nosepass", "Probopass", "Karrablast", "Escavalier", "Shelmet", "Accelgor", "Snorunt", "Glalie", "Froslass", "Pinsir", "Emolga", "Heracross", "Trubbish", "Garbodor", "Snover", "Abomasnow","Diglett", "Dugtrio", "Geodude", "Graveler", "Golem", "Onix", "Steelix", "Voltorb", "Electrode", "Cubone", "Marowak", "Whismur", "Loudred", "Exploud", "Aron", "Lairon", "Aggron", "Spheal", "Sealeo", "Walrein", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Gible", "Gabite", "Garchomp", "Pidove", "Tranquill", "Unfezant", "Tympole", "Palpitoad", "Seismitoad", "Cottonee", "Whimsicott", "Petilil", "Lilligant", "Ducklett", "Swanna", "Deerling", "Sawsbuck", "Elgyem", "Beheeyem", "Pawniard", "Bisharp", "Heatmor", "Durant","Venipede","Whirlipede", "Scolipede", "Tirtouga", "Carracosta", "Joltik", "Galvantula", "Maractus", "Dwebble", "Crustle", "Roggenrola", "Boldore", "Gigalith", "Vanillite", "Vanillish", "Vanilluxe", "Klink", "Klang", "Klinklang", "Swinub", "Piloswine", "Golett", "Golurk", "Gothitelle", "Gothorita", "Solosis", "Duosion", "Reuniclus", "Deerling-Summer", "Deerling-Autumn", "Deerling-Winter", "Sawsbuck-Summer", "Sawsbuck-Autumn", "Sawsbuck-Winter", "Roserade", "Mewtwo"
];

var unreleasedHiddenList = [
    "Raikou", "Entei", "Suicune", "Heatran", "Gourgeist-Small", "Gourgeist-Large", "Flabébé-Orange", "Floette-Orange", "Florges-Orange", "Flabébé-White", "Floette-White", "Florges-White", "Rowlet", "Dartrix", "Decidueye", "Litten", "Torracat", "Incineroar", "Popplio", "Brionne", "Primarina", "Oranguru", "Passimian", "Tapu Koko", "Tapu Lele", "Tapu Bulu", "Tapu Fini"
];

/*
var halist = dwlist.concat([
    "Gothita", "Rufflet", "Klefki", "Phantump", "Trevenant", "Axew", "Fraxure", "Haxorus", "Carbink", "Scatterbug", "Spewpa", "Vivillon", "Sandile", "Krokorok", "Krookodile", "Inkay", "Malamar", "Noibat", "Noivern", "Goomy", "Sliggoo", "Goodra", "Dedenne", "Helioptile", "Heliolisk", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff", "Flabébé", "Floette", "Florges", "Pancham", "Pangoro", "Larvesta", "Volcarona", "Litleo", "Pyroar", "Fennekin", "Braixen", "Delphox", "Fletchling", "Fletchinder", "Talonflame", "Hawlucha", "Litwick", "Lampent", "Chandelure", "Pumpkaboo", "Pumpkaboo-Small", "Pumpkaboo-Large", "Pumpkaboo-Super", "Gourgeist", "Gourgeist-Small", "Gourgeist-Large", "Gourgeist-Super", "Duskull", "Dusclops", "Dusknoir", "Chespin", "Quilladin", "Chesnaught", "Skiddo", "Gogoat", "Bunnelby", "Diggersby", "Bergmite", "Avalugg", "Espurr", "Meowstic", "Meowstic-F", "Binacle", "Barbaracle", "Froakie", "Frogadier", "Greninja", "Sylveon", "Ferrothorn", "Skrelp", "Dragalge", "Snivy", "Servine", "Serperior", "Oshawott", "Dewott", "Samurott", "Tepig", "Pignite", "Emboar", "Tyrunt", "Tyrantrum", "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion", "Totodile", "Croconaw", "Feraligatr", "Amaura", "Aurorus", "Articuno", "Zapdos", "Moltres", "Regirock", "Regice", "Registeel"
]);
*/
//two lists for gen 5 and gen 6
/* use hash for faster lookup */
/*
var dwpokemons = {};
var hapokemons = {};
var dwpok;
for (dwpok = 0; dwpok < halist.length; dwpok++) {
    var num = sys.pokeNum(halist[dwpok]);
    if (num % 65536 == sys.pokeNum("Pikachu")) { //probably add a function to tell the difference between aesthetic and normal formes in the future
        num = sys.pokeNum("Pikachu");
    }
    if (num === undefined)
        sys.sendAll("Script Check: Unknown poke in hapokemons: '" +halist[dwpok]+"'.", staffchannel);
    else if (hapokemons[num])
        sys.sendAll("Script Check:  hapokemons contains '" +halist[dwpok]+"' multiple times.", staffchannel);
    else {
        hapokemons[num] = true;
        if (dwlist.indexOf(halist[dwpok]) > -1) {
            dwpokemons[num] = true;
        }
    }
}*/
// few unreleased abilities left in gen 6

var pokebank = [
    "Tentacool", "Tentacruel", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Mewtwo", "Sentret", "Furret", "Chinchou", "Lanturn", "Qwilfish", "Mantine", "Zigzagoon", "Linoone", "Skitty", "Delcatty", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Torkoal", "Lunatone", "Solrock", "Barboach", "Whiscash", "Lileep", "Cradily", "Anorith", "Armaldo", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", "Chatot", "Munchlax", "Hippopotas", "Hippowdon", "Mantyke", "Patrat", "Watchog", "Basculin", "Tirtouga", "Carracosta", "Karrablast", "Escavalier", "Alomomola", "Shelmet", "Accelgor"
];

var breedingList = [
    "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Croagunk", "Toxicroak", "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape", "Piplup", "Prinplup", "Empoleon", "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken", "Mudkip", "Marshtomp", "Swampert", "Hitmonlee","Hitmonchan","Hitmontop","Tyrogue", "Porygon", "Porygon2", "Porygon-Z", "Gothorita", "Gothitelle","Pansage", "Pansear", "Panpour", "Simisear", "Simisage", "Simipour"
];
var breedingpokemons = breedingList.map(sys.pokeNum);

var lclist = [
    "Bulbasaur", "Charmander", "Squirtle", "Croagunk", "Turtwig", "Chimchar", "Piplup", "Treecko", "Torchic", "Mudkip", "Pansage", "Pansear", "Panpour"
];
var lcpokemons = lclist.map(sys.pokeNum);
var lcmoves = {
    "Bronzor":["Iron Defense"],
    "Golett":["Rollout","Shadow Punch","Iron Defense","Mega Punch","Magnitude","DynamicPunch","Night Shade","Curse","Hammer Arm","Focus Punch"],
    "Klink":["Charge","Thundershock","Gear Grind","Bind","Mirror Shot","Screech","Discharge","Metal Sound","Shift Gear","Lock-On","Zap Cannon"],
    "Petilil":["Entrainment"],
    "Rufflet":["Wing Attack","Scary Face","Slash","Defog","Air Slash","Crush Claw","Whirlwind","Brave Bird","Thrash"]
};

var legality = {
    Alolan: { // ANNOYING
        "Raticate": ["Work Up", "Thunderbolt", "Thunder", "Charge Beam", "Thunder Wave", "Wild Charge", "Screech", "Flame Wheel", "Bite", "Last Resort"],
        "Sandslash": [],
        "Ninetales": [],
        "Dugtrio": [],
        "Persian": [],
        "Golem": [],
        "Muk": [],
        "Exeggutor": [],
        "Marowak": []
    },
    Event: {
        "Celebrate": {
            "Bulbasaur": {"min_level": 5, "hidden": true, "shiny": false},
            "Ivysaur": {"min_level": 16, "hidden": true, "shiny": false},
            "Venusaur": {"min_level": 32, "hidden": true, "shiny": false},
            "Charmander": {"min_level": 5, "hidden": true, "shiny": false},
            "Charmeleon": {"min_level": 16, "hidden": true, "shiny": false},
            "Charizard": {"min_level": 36, "hidden": true, "shiny": false},
            "Squirtle": {"min_level": 5, "hidden": true, "shiny": false},
            "Wartortle": {"min_level": 16, "hidden": true, "shiny": false},
            "Blastoise": {"min_level": 36, "hidden": true, "shiny": false},
            "Alolan Vulpix": {"min_level": 10, "hidden": false, "shiny": false},
            "Alolan Ninetales": {"min_level": 10, "hidden": false, "shiny": false},
            "Comfey": {"min_level": 10, "hidden": false, "shiny": false},
            "Eevee": {"min_level": 10, "hidden": false, "shiny": false},
            "Pikachu": {"min_level": 10, "hidden": false, "shiny": false},
            "Raichu": {"min_level": 10, "hidden": false, "shiny": false},
            "Alolan Raichu": {"min_level": 10, "hidden": false, "shiny": false},
            "Rayquaza": {"min_level": 100, "hidden": false, "shiny": true},
            "Ho-Oh": {"min_level": 50, "hidden": false, "shiny": true},
            "Magikarp": {"hidden": false, "shiny": ""},
            "Gyarados": {"min_level": 20, "hidden": false, "shiny": ""},
            "Sylveon": {"min_level": 10, "hidden": false, "shiny": false},
            "Glaceon": {"min_level": 10, "hidden": false, "shiny": false},
            "Leafeon": {"min_level": 10, "hidden": false, "shiny": false},
            "Umbreon": {"min_level": 10, "hidden": false, "shiny": false},
            "Espeon": {"min_level": 10, "hidden": false, "shiny": false},
            "Flareon": {"min_level": 10, "hidden": false, "shiny": false},
            "Jolteon": {"min_level": 10, "hidden": false, "shiny": false},
            "Vaporeon": {"min_level": 10, "hidden": false, "shiny": false}
        },
        "Happy Hour": {
            "Munchlax": {"min_level": 5, "hidden": false, "shiny": false},
            "Snorlax": {"min_level": 6, "hidden": false, "shiny": false},
            "Eevee": {"min_level": 10, "hidden": false, "shiny": false},
            "Sylveon": {"min_level": 11, "hidden": false, "shiny": false},
            "Glaceon": {"min_level": 11, "hidden": false, "shiny": false},
            "Leafeon": {"min_level": 11, "hidden": false, "shiny": false},
            "Umbreon": {"min_level": 11, "hidden": false, "shiny": false},
            "Espeon": {"min_level": 11, "hidden": false, "shiny": false},
            "Flareon": {"min_level": 10, "hidden": false, "shiny": false},
            "Jolteon": {"min_level": 10, "hidden": false, "shiny": false},
            "Vaporeon": {"min_level": 10, "hidden": false, "shiny": false},
            "Greninja": {"min_level": 100, "hidden": true, "shiny": false},
            "Meowth": {"min_level": 20, "hidden": false, "shiny": false},
            "Persian": {"min_level": 28, "hidden": false, "shiny": false},
            "Alolan Persian": {"min_level": 21, "hidden": false, "shiny": false},
            "Delibird": {"min_level": 10, "hidden": false, "shiny": false},
            "Pikachu": {"min_level": 99, "hidden": false, "shiny": false},
            "Raichu": {"min_level": 99, "hidden": false, "shiny": false},
            "Alolan Raichu": {"min_level": 99, "hidden": false, "shiny": false},
            "Magikarp": {"hidden": false, "shiny": ""},
            "Gyarados": {"min_level": 20, "hidden": false, "shiny": ""},
            "Jirachi": {"min_level": 25, "hidden": false, "shiny": true},
            "Inkay": {"min_level": 10, "hidden": false, "shiny": false},
            "Malamar": {"min_level": 30, "hidden": false, "shiny": false}
        },
        "Hold Back": {
            "Munchlax": {"min_level": 5, "hidden": false, "shiny": false},
            "Snorlax": {"min_level": 6, "hidden": false, "shiny": false},
            "Eevee": {"min_level": 10, "hidden": false, "shiny": false},
            "Sylveon": {"min_level": 11, "hidden": false, "shiny": false},
            "Glaceon": {"min_level": 11, "hidden": false, "shiny": false},
            "Leafeon": {"min_level": 11, "hidden": false, "shiny": false},
            "Umbreon": {"min_level": 11, "hidden": false, "shiny": false},
            "Espeon": {"min_level": 11, "hidden": false, "shiny": false},
            "Flareon": {"min_level": 10, "hidden": false, "shiny": false},
            "Jolteon": {"min_level": 10, "hidden": false, "shiny": false},
            "Vaporeon": {"min_level": 10, "hidden": false, "shiny": false},
            "Samurott": {"min_level": 50, "hidden": true, "shiny": false},
            "Emboar": {"min_level": 50, "hidden": true, "shiny": false},
            "Serperior": {"min_level": 50, "hidden": true, "shiny": false},
            "Mareep": {"min_level": 10, "hidden": false, "shiny": false},
            "Flaaffy": {"min_level": 15, "hidden": false, "shiny": false},
            "Ampharos": {"min_level": 30, "hidden": false, "shiny": false},
            "Beldum": {"min_level": 5, "hidden": false, "shiny": true},
            "Metang": {"min_level": 20, "hidden": false, "shiny": true},
            "Metagross": {"min_level": 45, "hidden": false, "shiny": true},
            "Celebi": {"min_level": 10}
        },
        "Hold Hands": {
            "Pikachu": {"min_level": 10, "hidden": "", "shiny": ""},
            "Raichu": {"min_level": 10, "hidden": "", "shiny": ""},
            "Alolan Raichu": {"min_level": 10, "hidden": "", "shiny": ""},
            "Charizard": {"min_level": 36, "hidden": false, "shiny": true},
            "Vivillon-Fancy": {"min_level": 12, "hidden": false, "shiny": false}
        },
        "V-Create": {
            "Victini": {"min_level": 15, "hidden": false, "shiny": false},
            "Rayquaza": {"min_level": 100, "hidden": false, "shiny": false}
        }
    }
};

function TierChecker() {
    this.checkers = [];
}

TierChecker.prototype.add_new_check = function(exclusive, tiers, checker) {
    this.checkers.push({tiers: tiers, checker: checker, exclusive: exclusive});
};

TierChecker.prototype.has_legal_team_for_tier = function(src, team, tier, silent, returncomp) {
    if (tier == "Challenge Cup" || tier == "CC 1v1" || tier == "Wifi CC 1v1" || tier == "Inverted Challenge Cup" || tier == "Hackmons Challenge Cup" || tier == "Hackmons CC 1v1" || tier == "Hackmons Wifi CC 1v1" || tier == "Hackmons Inverted CC" || (tier == "Battle Factory" || tier == "Battle Factory 6v6") && sys.gen(src, team) === 7) return true;
    if (!sys.hasLegalTeamForTier(src, team, tier)) return false;

    var complaints = [];
    for (var i = 0; i < this.checkers.length; ++i) {
        var valid_tier = (this.checkers[i].exclusive ? this.checkers[i].tiers.indexOf(tier) == -1 : this.checkers[i].tiers.indexOf(tier) != -1);
        if (valid_tier) {
            var new_comp = this.checkers[i].checker(src, team, tier);
            if (Array.isArray(new_comp)) {
                complaints = complaints.concat(new_comp);
            }
        }
    }
    if (complaints.length === 0) {
        return true;
    } else if (!silent) {
        for (var j = 0; j < complaints.length; ++j) {
            checkbot.sendMessage(src, complaints[j]);
        }
    }
    if (returncomp) {
        return complaints;
    }
    return false;
};

TierChecker.prototype.find_good_tier = function(src, team) {
    // TODO: write up
    var testPath = ["SM LC", "SM PU", "SM NU", "SM LU", "SM UU", "SM OU", "SM Ubers", "Anything Goes", "SM Balanced Hackmons", "SM Hackmons", "Battle Factory 6v6", "Challenge Cup", "ORAS Balanced Hackmons", "ORAS Hackmons"];
    for (var i = 0; i < testPath.length; ++i) {
        var testtier = testPath[i];
        if (sys.hasLegalTeamForTier(src, team, testtier) && this.has_legal_team_for_tier(src, team, testtier, true)) {
            sys.changeTier(src, team, testtier);
            if (testtier == "Battle Factory" || testtier == "Battle Factory 6v6") {
                require('battlefactory.js').generateTeam(src, team);
            }
            return;
        }
    }
};

var tier_checker = new TierChecker();
var INCLUDING = false;
var EXCLUDING = true;
var challenge_cups = ["Challenge Cup", "CC 1v1", "Wifi CC 1v1", "Inverted Challenge Cup", "Hackmons Challenge Cup", "Battle Factory", "Battle Factory 6v6", "Hackmons CC 1v1", "Hackmons Wifi CC 1v1", "Hackmons Inverted CC"];
var hackmons = ["ORAS Hackmons", "ORAS Balanced Hackmons", "Inverted Balanced Hackmons", "All Gen Hackmons", "SM Hackmons", "SM Balanced Hackmons"];

/*Structure:
    Pokemon Name 
    -> moves 
    -> -> abilities, natures, shinyForce
    
    Pokemon Name
    -> abilities
    -> -> shinyForce
*/
var eventMons = { //Try to keep in order of dex
    "Bulbasaur": {"moves": {"False Swipe": {"abilities": ["Overgrow"]}, "Block": {"abilities": ["Overgrow"]}, "Frenzy Plant": {"abilities": ["Overgrow"]}, "Weather Ball": {"abilities": ["Overgrow"]}}},
    "Ivysaur": {"moves": {"False Swipe": {"abilities": ["Overgrow"]}, "Block": {"abilities": ["Overgrow"]}, "Frenzy Plant": {"abilities": ["Overgrow"]}, "Weather Ball": {"abilities": ["Overgrow"]}}},
    "Venusaur": {"moves": {"False Swipe": {"abilities": ["Overgrow"]}, "Block": {"abilities": ["Overgrow"]}, "Weather Ball": {"abilities": ["Overgrow"]}}},
    
    "Charmander": {"moves": {"False Swipe": {"abilities": ["Blaze"]}, "Block": {"abilities": ["Blaze"]}, "Acrobatics": {"abilities": ["Blaze"]}}},
    "Charmeleon": {"moves": {"False Swipe": {"abilities": ["Blaze"]}, "Block": {"abilities": ["Blaze"]}, "Acrobatics": {"abilities": ["Blaze"]}}},
    "Charizard": {"moves": {"False Swipe": {"abilities": ["Blaze"]}, "Block": {"abilities": ["Blaze"]}}},
    
    "Squirtle": {"moves": {"False Swipe": {"abilities": ["Torrent"]}, "Block": {"abilities": ["Torrent"]}, "Hydro Cannon": {"abilities": ["Torrent"]}, "Follow Me": {"abilities": ["Torrent"]}}},
    "Wartortle": {"moves": {"False Swipe": {"abilities": ["Torrent"]}, "Block": {"abilities": ["Torrent"]}, "Hydro Cannon": {"abilities": ["Torrent"]}, "Follow Me": {"abilities": ["Torrent"]}}},
    "Blastoise": {"moves": {"False Swipe": {"abilities": ["Torrent"]}, "Block": {"abilities": ["Torrent"]}, "Follow Me": {"abilities": ["Torrent"]}}},
    
    "Pikachu": {"moves": {"Teeter Dance": {"shinyForce": true}}},
    
    "Articuno": {"moves": {"Pluck": {"abilities": ["Pressure"]}}},
    "Moltres": {"moves": {"Pluck": {"abilities": ["Pressure"]}}},
    "Dragonite": {"moves": {"Barrier": {"abilities": ["Inner Focus"]}}},    
    "Mewtwo": {"abilities": {"Unnerve": {"shinyForce": false}}},
    
    "Raikou": {"moves": {"Extreme Speed": {"natures": ["Rash"], "shinyForce": true}, "Weather Ball": {"natures": ["Rash"], "shinyForce": true}, "Aura Sphere": {"natures": ["Rash"], "shinyForce": true}, "Zap Cannon": {"natures": ["Rash"], "shinyForce": true}}},    
    "Entei": {"moves": {"Extreme Speed": {"natures": ["Adamant"], "shinyForce": true}, "Howl": {"natures": ["Adamant"], "shinyForce": true}, "Crush Claw": {"natures": ["Adamant"], "shinyForce": true}, "Flare Blitz": {"natures": ["Adamant"], "shinyForce": true}}},    
    "Suicune": {"moves": {"Extreme Speed": {"natures": ["Relaxed"], "shinyForce": true}, "Sheer Cold": {"natures": ["Relaxed"], "shinyForce": true}, "Aqua Ring": {"natures": ["Relaxed"], "shinyForce": true}, "Air Slash": {"natures": ["Relaxed"], "shinyForce": true}}},
    "Lugia": {"abilities": {"Multiscale": {"shinyForce": false}}},
    "Ho-Oh": {"abilities": {"Regenerator": {"shinyForce": false}}},
    
    "Regirock": {"abilities": {"Sturdy": {"shinyForce": false}}},
    "Regice": {"abilities": {"Ice Body": {"shinyForce": false}}},
    "Registeel": {"abilities": {"Light Metal": {"shinyForce": false}}},
    
    "Beldum": {"moves": {"Hold Back": {"shinyForce": true}}},
    "Metang": {"moves": {"Hold Back": {"shinyForce": true}}},
    "Metagross": {"moves": {"Hold Back": {"shinyForce": true}}},
    "Jirachi": {"moves": {"Moonblast": {"shinyForce": true}, "Happy Hour": {"shinyForce": true}, "Heart Stamp": {"shinyForce": false}, "Play Rough": {"shinyForce": false}}}, 
    
    "Dialga": {"abilities": {"Telepathy": {"shinyForce": false}}},
    "Palkia": {"abilities": {"Telepathy": {"shinyForce": false}}},
    "Giratina": {"abilities": {"Telepathy": {"shinyForce": false}}},
    "Heatran": {"moves": {"Eruption": {"natures": ["Quiet"]}}, "abilities": {"Flame Body": {"shinyForce": false}}},
    
    "Tornadus": {"abilities": {"Defiant":{"shinyForce": false}}},
    "Thundurus": {"abilities": {"Defiant":{"shinyForce": false}}},
    "Landorus": {"abilities": {"Sheer Force":{"shinyForce": false}}},
    "Genesect": {"moves": {"Extreme Speed": {"natures": ["Hasty"], "shinyForce": true}, "Blaze Kick": {"natures": ["Hasty"], "shinyForce": true}, "Shift Gear": {"natures": ["Hasty"], "shinyForce": true}}},
    
    "Snivy": {"moves": {"Aromatherapy": {"natures": ["Hardy"]}}}
};

tier_checker.add_new_check(EXCLUDING, challenge_cups.concat(hackmons), function eventValidation(src, team) {
    var ret = [];
    var events = Object.keys(eventMons);
    var restrAbs, currentAb;
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, team, i);
        var pname = sys.pokemon(poke);
        if (events.contains(pname) && poke !== 0) {
            var restrictions = Object.keys(eventMons[pname]);
            if (restrictions.contains("moves")) { //Check if pokemon has restricted move
                for (var e in eventMons[pname].moves) { //Loop in case there are multiple moves
                    if (sys.hasTeamPokeMove(src, team, i, sys.moveNum(e))) { //Proceed if mon has move
                        var mv = eventMons[pname].moves[e];
                        if (Object.keys(mv).contains("abilities")) { //Restricted by ability?
                            restrAbs = mv.abilities; //All restricted abilities
                            currentAb = sys.ability(sys.teamPokeAbility(src, team, i));
                            if (!restrAbs.contains(currentAb)) {
                                ret.push("{0} with {1} must have the ability {2}".format(pname, e, readable(restrAbs, "or")));
                            }
                        }
                        if (Object.keys(mv).contains("natures")) { //Restricted by nature?
                            var restrNats = mv.natures; //All restricted natures                                
                            var currentNat = sys.nature(sys.teamPokeNature(src, team, i));
                            if (!restrNats.contains(currentNat)) {
                                ret.push("{0} with {1} must have the nature {2}".format(pname, e, readable(restrNats, "or")));
                            }
                        }
                        if (Object.keys(mv).contains("shinyForce")) { //Just force correct shininess
                            sys.changePokeShine(src, team, i, mv.shinyForce);
                        }
                    }
                }
            }
            if (restrictions.contains("abilities")) { //Check if an ability is shiny locked
                for (var g in eventMons[pname].abilities) { //Unlikely this is needed. Required shiny locked mon with 2 normal and a hidden ability.
                    if (sys.ability(sys.teamPokeAbility(src, team, i)) === g) { //Proceed if mon has ability
                        var ab = eventMons[pname].abilities[g];
                        if (Object.keys(ab).contains("shinyForce")) { //Just force correct shininess
                            sys.changePokeShine(src, team, i, ab.shinyForce);
                        }
                    }
                }
            }
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["BW2 LC", "BW2 LC Ubers", "BW2 UU LC", "ORAS LC", "SM LC"], function littleCupCheck(src, team, tier) {
    var ret = [];
    var gen = sys.gen(src, team);
    var check = (gen > 5 ? ["Treecko", "Mudkip", "Turtwig", "Chimchar", "Piplup"].map(sys.pokeNum) : lcpokemons);
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, team, i);
        if (x !== 0 && sys.hasDreamWorldAbility(src, team, i) && check.indexOf(x) != -1 ) {
            ret.push(sys.pokemon(x) + " is not allowed with a " + (gen > 5 ? "Hidden":"Dream World") + " Ability in " + tier + ".");
        }
        if ((x !== 0 && lcmoves.hasOwnProperty(sys.pokemon(x))) || (sys.pokemon(x) === "Eevee" && gen > 6)) {
            if (gen < 7) {
                for (var j = 0; j < 4; j++) {
                    if (lcmoves[sys.pokemon(x)].indexOf(sys.move(sys.teamPokeMove(src, team, i, j))) !== -1) {
                        ret.push(sys.pokemon(x) + " is not allowed in " + tier + " with the move " + sys.move(sys.teamPokeMove(src, team, i, j)) + ".");
                    }
                }
            } else { //Eevee check
                for (var k = 0; k < 4; k++) {
                    if (["Celebrate", "Happy Hour"].indexOf(sys.move(sys.teamPokeMove(src, team, i, k))) !== -1) {
                        ret.push(sys.pokemon(x) + " is not allowed in " + tier + " with the move " + sys.move(sys.teamPokeMove(src, team, i, k)) + ".");
                    }
                }
            }
        }
    }
    return ret;
});

if (typeof Config == "undefined") { Config = { DreamWorldTiers: ["ORAS Hackmons", "ORAS Balanced Hackmons", "Inverted Balanced Hackmons", "All Gen Hackmons", "X/Y", "Black/White", "Black/White 2"] }; }
tier_checker.add_new_check(EXCLUDING, Config.DreamWorldTiers, function dwAbilityCheck(src, team, tier) {
    // Of course, DW ability only affects 5th gen
    var ret = [];
    var noDW, unreleasedHA;
    if (sys.gen(src, team) === 5) {
        for (var i = 0; i < 6; i++) {
            var x = sys.teamPoke(src, team, i);
            noDW = dwlist.indexOf(sys.pokemon(x)) === -1;
            if (x !== 0 && sys.hasDreamWorldAbility(src, team, i) && (noDW || (breedingpokemons.indexOf(x) != -1 && !sys.compatibleAsDreamWorldEvent(src, team, i)))) {
                if (noDW) {
                    ret.push(sys.pokemon(x) + " is not allowed with a Dream World ability in " + tier + " tier.");
                } else {
                    ret.push(sys.pokemon(x) + " has to be Male and have no egg moves with its Dream World ability in  " + tier + " tier.");
                }
            }
        }
    }
    else if (sys.gen(src, team) > 5) {
        for (var j = 0; j < 6; j++) {
            var y = sys.teamPoke(src, team, j);
            unreleasedHA = unreleasedHiddenList.indexOf(sys.pokemon(y)) > -1;
            if (y !== 0 && pokedex.hasDreamWorldAbility(y, sys.teamPokeAbility(src, team, j))) {
                if (unreleasedHA || (tier === "Random Battle") && pokebank.indexOf(sys.pokemon(y)) !== -1) {
                    ret.push(sys.pokemon(y) + " is not allowed with Hidden Ability " + sys.ability(sys.teamPokeAbility(src, team, j)) + " in " + tier + " tier. Change it in the teambuilder.");
                }
            }
        }
    }
    return ret;
});

tier_checker.add_new_check(EXCLUDING, challenge_cups, function endlessCheck(src, team, tier) {
    var ret = [];
    for (var i = 0; i < 6; i++) {
        if (sys.teamPokeItem(src, team, i) === sys.itemNum("Leppa Berry") && sys.hasTeamPokeMove(src, team, i, sys.moveNum("Recycle")) && (sys.hasTeamPokeMove(src, team, i, sys.moveNum("Fling")) || sys.hasTeamPokeMove(src, team, i, sys.moveNum("Pain Split")) || sys.hasTeamPokeMove(src, team, i, sys.moveNum("Heal Pulse")))) {
            ret.push(sys.pokemon(sys.teamPoke(src, team, i)) + " has the combination of Leppa Berry, Recycle and any of Fling/Heal Pulse/Pain Split which is banned in " + tier + " under the Endless Battle Clause.");
        }
    }
    return ret;
});


tier_checker.add_new_check(INCLUDING, ["Monogen"], function monoGenCheck(src, team) {
    var GEN_MAX = [0, 151, 252, 386, 493, 649, 721, 802];
    var gen = 0;
    for (var i = 0; i < 6; ++i) {
        var pokenum = sys.teamPoke(src, team, i);
        var species = pokenum % 65536; // remove alt formes
        if (species === 0) continue;
        if (gen === 0) {
            while (species > GEN_MAX[gen]) ++gen; // Search for correct gen for first poke
        } else if (!(GEN_MAX[gen-1] < species && species <= GEN_MAX[gen])) {
            return [sys.pokemon(pokenum) + " is not from Generation " + gen];
        }
    }
});

/* Monocolor no longer an official tier
tier_checker.add_new_check(INCLUDING, ["Monocolour"], function monoColourCheck(src, team) {
    var colours = {
        'Red': ['Charmander', 'Charmeleon', 'Charizard', 'Vileplume', 'Paras', 'Parasect', 'Krabby', 'Kingler', 'Voltorb', 'Electrode', 'Goldeen', 'Seaking', 'Jynx', 'Magikarp', 'Magmar', 'Flareon', 'Ledyba', 'Ledian', 'Ariados', 'Yanma', 'Scizor', 'Slugma', 'Magcargo', 'Octillery', 'Delibird', 'Porygon2', 'Magby', 'Ho-Oh', 'Torchic', 'Combusken', 'Blaziken', 'Wurmple', 'Medicham', 'Carvanha', 'Camerupt', 'Solrock', 'Corphish', 'Crawdaunt', 'Latias', 'Groudon', 'Deoxys', 'Deoxys-Attack', 'Deoxys-Defense', 'Deoxys-Speed', 'Kricketot', 'Kricketune', 'Magmortar', 'Porygon-Z', 'Rotom', 'Rotom-Heat', 'Rotom-Frost', 'Rotom-Wash', 'Rotom-Mow', 'Rotom-Fan', 'Tepig', 'Pignite', 'Emboar', 'Pansear', 'Simisear', 'Throh', 'Venipede', 'Scolipede', 'Krookodile', 'Darumaka', 'Darmanitan', 'Dwebble', 'Crustle', 'Scrafty', 'Shelmet', 'Accelgor', 'Druddigon', 'Pawniard', 'Bisharp', 'Braviary', 'Heatmor'],
        'Blue': ['Squirtle', 'Wartortle', 'Blastoise', 'Nidoran?', 'Nidorina', 'Nidoqueen', 'Oddish', 'Gloom', 'Golduck', 'Poliwag', 'Poliwhirl', 'Poliwrath', 'Tentacool', 'Tentacruel', 'Tangela', 'Horsea', 'Seadra', 'Gyarados', 'Lapras', 'Vaporeon', 'Omanyte', 'Omastar', 'Articuno', 'Dratini', 'Dragonair', 'Totodile', 'Croconaw', 'Feraligatr', 'Chinchou', 'Lanturn', 'Marill', 'Azumarill', 'Jumpluff', 'Wooper', 'Quagsire', 'Wobbuffet', 'Heracross', 'Kingdra', 'Phanpy', 'Suicune', 'Mudkip', 'Marshtomp', 'Swampert', 'Taillow', 'Swellow', 'Surskit', 'Masquerain', 'Loudred', 'Exploud', 'Azurill', 'Meditite', 'Sharpedo', 'Wailmer', 'Wailord', 'Swablu', 'Altaria', 'Whiscash', 'Chimecho', 'Wynaut', 'Spheal', 'Sealeo', 'Walrein', 'Clamperl', 'Huntail', 'Bagon', 'Salamence', 'Beldum', 'Metang', 'Metagross', 'Regice', 'Latios', 'Kyogre', 'Piplup', 'Prinplup', 'Empoleon', 'Shinx', 'Luxio', 'Luxray', 'Cranidos', 'Rampardos', 'Gible', 'Gabite', 'Garchomp', 'Riolu', 'Lucario', 'Croagunk', 'Toxicroak', 'Finneon', 'Lumineon', 'Mantyke', 'Tangrowth', 'Glaceon', 'Azelf', 'Phione', 'Manaphy', 'Oshawott', 'Dewott', 'Samurott', 'Panpour', 'Simipour', 'Roggenrola', 'Boldore', 'Gigalith', 'Woobat', 'Swoobat', 'Tympole', 'Palpitoad', 'Seismitoad', 'Sawk', 'Tirtouga', 'Carracosta', 'Ducklett', 'Karrablast', 'Eelektrik', 'Eelektross', 'Elgyem', 'Cryogonal', 'Deino', 'Zweilous', 'Hydreigon', 'Cobalion', 'Thundurus', 'Thundurus-Therian'],
        'Green': ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Caterpie', 'Metapod', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Scyther', 'Chikorita', 'Bayleef', 'Meganium', 'Spinarak', 'Natu', 'Xatu', 'Bellossom', 'Politoed', 'Skiploom', 'Larvitar', 'Tyranitar', 'Celebi', 'Treecko', 'Grovyle', 'Sceptile', 'Dustox', 'Lotad', 'Lombre', 'Ludicolo', 'Breloom', 'Electrike', 'Roselia', 'Gulpin', 'Vibrava', 'Flygon', 'Cacnea', 'Cacturne', 'Cradily', 'Kecleon', 'Tropius', 'Rayquaza', 'Turtwig', 'Grotle', 'Torterra', 'Budew', 'Roserade', 'Bronzor', 'Bronzong', 'Carnivine', 'Yanmega', 'Leafeon', 'Shaymin', 'Shaymin-Sky', 'Snivy', 'Servine', 'Serperior', 'Pansage', 'Simisage', 'Swadloon', 'Cottonee', 'Whimsicott', 'Petilil', 'Lilligant', 'Basculin', 'Maractus', 'Trubbish', 'Garbodor', 'Solosis', 'Duosion', 'Reuniclus', 'Axew', 'Fraxure', 'Golett', 'Golurk', 'Virizion', 'Tornadus','Tornadus-Therian'],
        'Yellow': ['Kakuna', 'Beedrill', 'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Ninetales', 'Meowth', 'Persian', 'Psyduck', 'Ponyta', 'Rapidash', 'Drowzee', 'Hypno', 'Exeggutor', 'Electabuzz', 'Jolteon', 'Zapdos', 'Moltres', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Pichu', 'Ampharos', 'Sunkern', 'Sunflora', 'Girafarig', 'Dunsparce', 'Shuckle', 'Elekid', 'Raikou', 'Beautifly', 'Pelipper', 'Ninjask', 'Makuhita', 'Manectric', 'Plusle', 'Minun', 'Numel', 'Lunatone', 'Jirachi', 'Mothim', 'Combee', 'Vespiquen', 'Chingling', 'Electivire', 'Uxie', 'Cresselia', 'Victini', 'Sewaddle', 'Leavanny', 'Scraggy', 'Cofagrigus', 'Archen', 'Archeops', 'Deerling', 'Joltik', 'Galvantula', 'Haxorus', 'Mienfoo', 'Keldeo', 'Keldeo-Resolute'],
        'Purple': ['Rattata', 'Ekans', 'Arbok', 'Nidoran?', 'Nidorino', 'Nidoking', 'Zubat', 'Golbat', 'Venonat', 'Venomoth', 'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Koffing', 'Weezing', 'Starmie', 'Ditto', 'Aerodactyl', 'Mewtwo', 'Crobat', 'Aipom', 'Espeon', 'Forretress', 'Gligar', 'Granbull', 'Mantine', 'Tyrogue', 'Cascoon', 'Delcatty', 'Sableye', 'Illumise', 'Swalot', 'Grumpig', 'Lileep', 'Shellos', 'Gastrodon', 'Ambipom', 'Drifloon', 'Drifblim', 'Mismagius', 'Stunky', 'Skuntank', 'Spiritomb', 'Skorupi', 'Drapion', 'Gliscor', 'Palkia', 'Purrloin', 'Liepard', 'Gothita', 'Gothorita', 'Gothitelle', 'Mienshao', 'Genesect'],
        'Pink': ['Clefairy', 'Clefable', 'Jigglypuff', 'Wigglytuff', 'Slowpoke', 'Slowbro', 'Exeggcute', 'Lickitung', 'Chansey', 'Mr. Mime', 'Porygon', 'Mew', 'Cleffa', 'Igglybuff', 'Flaaffy', 'Hoppip', 'Slowking', 'Snubbull', 'Corsola', 'Smoochum', 'Miltank', 'Blissey', 'Whismur', 'Skitty', 'Milotic', 'Gorebyss', 'Luvdisc', 'Cherubi', 'Cherrim', 'Mime Jr.', 'Happiny', 'Lickilicky', 'Mesprit', 'Munna', 'Musharna', 'Audino', 'Alomomola'],
        'Brown': ['Weedle', 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Raticate', 'Spearow', 'Fearow', 'Vulpix', 'Diglett', 'Dugtrio', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Abra', 'Kadabra', 'Alakazam', 'Geodude', 'Graveler', 'Golem', 'Farfetch\'d', 'Doduo', 'Dodrio', 'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan', 'Kangaskhan', 'Staryu', 'Pinsir', 'Tauros', 'Eevee', 'Kabuto', 'Kabutops', 'Dragonite', 'Sentret', 'Furret', 'Hoothoot', 'Noctowl', 'Sudowoodo', 'Teddiursa', 'Ursaring', 'Swinub', 'Piloswine', 'Stantler', 'Hitmontop', 'Entei', 'Zigzagoon', 'Seedot', 'Nuzleaf', 'Shiftry', 'Shroomish', 'Slakoth', 'Slaking', 'Shedinja', 'Hariyama', 'Torkoal', 'Spinda', 'Trapinch', 'Baltoy', 'Feebas', 'Regirock', 'Chimchar', 'Monferno', 'Infernape', 'Starly', 'Staravia', 'Staraptor', 'Bidoof', 'Bibarel', 'Buizel', 'Floatzel', 'Buneary', 'Lopunny', 'Bonsly', 'Hippopotas', 'Hippowdon', 'Mamoswine', 'Heatran', 'Patrat', 'Watchog', 'Lillipup', 'Conkeldurr', 'Sandile', 'Krokorok', 'Sawsbuck', 'Beheeyem', 'Stunfisk', 'Bouffalant', 'Vullaby', 'Mandibuzz', 'Landorus', 'Landorus-Therian'],
         'Black': ['Snorlax', 'Umbreon', 'Murkrow', 'Unown', 'Sneasel', 'Houndour', 'Houndoom', 'Mawile', 'Spoink', 'Seviper', 'Claydol', 'Shuppet', 'Banette', 'Duskull', 'Dusclops', 'Honchkrow', 'Chatot', 'Munchlax', 'Weavile', 'Dusknoir', 'Giratina', 'Darkrai', 'Blitzle', 'Zebstrika', 'Sigilyph', 'Yamask', 'Chandelure', 'Zekrom'],
        'Gray': ['Machop', 'Machoke', 'Machamp', 'Magnemite', 'Magneton', 'Onix', 'Rhyhorn', 'Rhydon', 'Misdreavus', 'Pineco', 'Steelix', 'Qwilfish', 'Remoraid', 'Skarmory', 'Donphan', 'Pupitar', 'Poochyena', 'Mightyena', 'Nincada', 'Nosepass', 'Aron', 'Lairon', 'Aggron', 'Volbeat', 'Barboach', 'Anorith', 'Armaldo', 'Snorunt', 'Glalie', 'Relicanth', 'Registeel', 'Shieldon', 'Bastiodon', 'Burmy', 'Wormadam', 'Wormadam-G', 'Wormadam-S', 'Glameow', 'Purugly', 'Magnezone', 'Rhyperior', 'Probopass', 'Arceus', 'Herdier', 'Stoutland', 'Pidove', 'Tranquill', 'Unfezant', 'Drilbur', 'Excadrill', 'Timburr', 'Gurdurr', 'Whirlipede', 'Zorua', 'Zoroark', 'Minccino', 'Cinccino', 'Escavalier', 'Ferroseed', 'Ferrothorn', 'Klink', 'Klang', 'Klinklang', 'Durant', 'Terrakion', 'Kyurem', 'Kyurem-Black', 'Kyurem-White'],
        'White': ['Butterfree', 'Seel', 'Dewgong', 'Togepi', 'Togetic', 'Mareep', 'Smeargle', 'Lugia', 'Linoone', 'Silcoon', 'Wingull', 'Ralts', 'Kirlia', 'Gardevoir', 'Vigoroth', 'Zangoose', 'Castform', 'Absol', 'Shelgon', 'Pachirisu', 'Snover', 'Abomasnow', 'Togekiss', 'Gallade', 'Froslass', 'Dialga', 'Regigigas', 'Swanna', 'Vanillite', 'Vanillish', 'Vanilluxe', 'Emolga', 'Foongus', 'Amoonguss', 'Frillish', 'Jellicent', 'Tynamo', 'Litwick', 'Lampent', 'Cubchoo', 'Beartic', 'Rufflet', 'Larvesta', 'Volcarona', 'Reshiram', 'Meloetta', 'Meloetta-Pirouette']
    };
    var poke = sys.pokemon(sys.teamPoke(src, team, 0));
    var thecolour = '';
    for (var colour in colours) {
        if (colours[colour].indexOf(poke) > -1) {
            thecolour = colour;
        }
    }
    if (thecolour === '') {
        return ["Bug! " + poke + " has not a colour in checkMonocolour :("];
    }
    for (var i = 1; i < 6; ++i) {
        poke = sys.pokemon(sys.teamPoke(src, team, i));
        if (colours[thecolour].indexOf(poke) == -1 && poke != "Missingno") {
            return [poke + " has not the colour: " + thecolour];
        }
    }
});*/

tier_checker.add_new_check(INCLUDING, ["BW2 OU"], function swiftSwimCheck(src, team, tier) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Drizzle"){
            for(var j = 0; j <6; ++j){
                if(sys.ability(sys.teamPokeAbility(src, team, j)) == "Swift Swim"){
                    return ["You cannot have the combination of Swift Swim and Drizzle in " + tier + "."];
                }
            }
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 NU"], function evioliteCheck(src, team, tier) {
    var evioliteLimit = 6;
    var eviolites = 0;
    for (var i = 0; i < 6; i++) {
        var item = sys.teamPokeItem(src, team, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        if (item == "Eviolite" && ++eviolites > evioliteLimit) {
            return ["Only 1 Pokémon is allowed with Eviolite in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 NU", "BW2 NEU"], function smashPassCheck(src, team, tier) {
    var ret = [];
    for (var i = 0; i < 6; i++) {
        if (sys.hasTeamPokeMove(src, team, i, sys.moveNum("Shell Smash")) && sys.hasTeamPokeMove(src, team, i, sys.moveNum("Baton Pass"))) {
            ret.push(sys.pokemon(sys.teamPoke(src, team, i)) + " has the combination of Shell Smash and Baton Pass, which is banned in " + tier + ".");
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["Monotype"], function monotypeCheck(src, team) {
    var type1, type2, typea = 0, typeb = 0,teamLength = 0, poke;
    for (var i = 0; i < 6; i++) {
        poke = sys.teamPoke(src, team, i);
        if (poke === 0) {
            continue;
        }
        type1 = sys.pokeType1(poke);
        type2 = sys.pokeType2(poke);
        teamLength++;
    }
    for (var j = 0; j < 6; j++) {
        poke = sys.teamPoke(src, team, j);
        if (poke === 0) {
            continue;
        }
        if ((type1 === sys.pokeType1(poke) || type1 === sys.pokeType2(poke)) && type1 !== 18) {
            typea++;
        }
        if ((type2 === sys.pokeType1(poke) || type2 === sys.pokeType2(poke)) && type2 !== 18) {
            typeb++;
        }
    }
    var teamType = typea >= typeb ? sys.type(type1) : sys.type(type2);
    if (typea < teamLength && typeb < teamLength) {
        return ["Your team is not a valid Monotype team as not every team member is " + teamType ];
    }
    
    /* Template */
    //  type: {type: "Type", items: [], pokes: [], abilities: []}
    /*********TYPE BANS CODE STARTS HERE*************/
 /*   var typeBans = {
        // This is empty now since SM just started.
    };
    var ret = [], item, pkmn, ability;
    for (var e in typeBans) {
        if (typeBans.hasOwnProperty(e)) {
            e = typeBans[e];
            if (teamType === e.type) {
                for (var p = 0; p < 6; p++) {
                    pkmn = sys.pokemon(sys.teamPoke(src, team, p));
                    if (pkmn === sys.pokemon(0)) {
                        continue;
                    }
                    
                    if (typeof(e.pokes) !== 'undefined') {
                        if (e.pokes.contains(pkmn)) {
                            ret.push("You are not allowed to use " + pkmn + " on a " + teamType + " team in Monotype.");
                        }
                    }
                    if (typeof(e.items) !== 'undefined') {
                        item = sys.item(sys.teamPokeItem(src, team, p));
                        if (e.items.contains(item)) {
                            ret.push("You are not allowed to use the Item " + item + " (held by " + pkmn + ") for a " + teamType + " team in Monotype.");
                        }
                    }
                    if (typeof(e.abilities) !== 'undefined') {
                        ability = sys.ability(sys.teamPokeAbility(src, team, p));
                        if (e.abilities.contains(ability)) {
                            ret.push("You are not allowed to use the Ability " + ability + " (on " + pkmn + ") for a " + teamType + " team in Monotype.");
                        }
                    }
                }
            }
        }
    }
    return ret;*/
});

/*tier_checker.add_new_check(EXCLUDING, challenge_cups.concat(hackmons), function haxCheck(src, team, tier) {
    var bannedItems = ["King's Rock", "Quick Claw", "Razor Fang"];
    for (var slot = 0; slot < 6; slot++) {
        var item_id = sys.teamPokeItem(src, team, slot);
        if (item_id && bannedItems.contains(sys.item(item_id))) {
            return ["You are not allowed to use the item " + bannedItems[bannedItems.indexOf(sys.item(item_id))] + " in " + tier + "."];
        }
    }
});*/

tier_checker.add_new_check(INCLUDING, ["ORAS Ubers"], function batonPassLimitXY(src, team, tier) {
    var batonPassLimit = 1;
    for (var i = 0, j = 0; i < 6; ++i) {
        if (sys.hasTeamPokeMove(src, team, i, sys.moveNum("Baton Pass")) && (++j > batonPassLimit)) {
            return ["Baton Pass is limited to "+batonPassLimit+" Pokémon per team in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["SM Ubers"], function ubersSleepTrap(src, team, tier) {
    for (var i = 0; i < 6; i++) {
        var hasStag = sys.teamPokeAbility(src, team, i) === sys.abilityNum("Shadow Tag") || sys.teamPoke(src, team, i) === sys.pokeNum("Gengar") && sys.teamPokeItem(src, team, i) === sys.itemNum("Gengarite");
        if (hasStag && sys.hasTeamPokeMove(src, team, i, sys.moveNum("Hypnosis"))) {
            return ["The combination of Shadow Tag and Hypnosis is forbidden in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(EXCLUDING, challenge_cups, function hasOneUsablePokemon(player, team) {
    for (var slot=0; slot<6; slot++)
        if (sys.teamPoke(player, team, slot) !== 0)
            for (var move=0; move<4; move++)
                if (sys.teamPokeMove(player, team , slot, move) !== 0)
                    return;
    return ["You do not have any valid Pokémon."];
});
// Leaving a note here that if we kill off Sky Battle (which we still might), this needs commenting out.
tier_checker.add_new_check(INCLUDING, ["Sky Battle"], function levitateCheck(src, team) {
    var bannedAbilities = {
        'duskull': ['frisk'],
        'bronzor': ['heatproof', 'heavy metal'],
        'bronzong': ['heatproof', 'heavy metal']
    };
    var ret = [];
    for (var i = 0; i < 6; ++i) {
        var ability = sys.ability(sys.teamPokeAbility(src, team, i));
        var lability = ability.toLowerCase();
        var poke = sys.pokemon(sys.teamPoke(src, team, i));
        var lpoke = poke.toLowerCase();
        if (lpoke in bannedAbilities && bannedAbilities[lpoke].indexOf(lability) != -1) {
            ret.push(poke + " is not allowed to have ability " + ability + " in Sky Battle. Please change it to Levitate in Teambuilder.");
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["ORAS Balanced Hackmons", "Inverted Balanced Hackmons", "SM Balanced Hackmons"], function abilityClause(src, team) {
    var abilities = {};
    var clones = {
        "Mold Breaker": ["Teravolt", "Turboblaze"],
        "Dazzling": ["Queenly Majesty"]
    };
    for (var i = 0; i < 6; i++) {
        var ability = sys.ability(sys.teamPokeAbility(src, team, i));
        for (var ab in clones) {
            if (clones[ab].contains(ability)) {
                ability = ab;
                break;
            }
        }
        if (abilities[ability]) {
            if (++abilities[ability] > 2) {
                return ["You are not allowed more than 2 of any ability in this tier"];
            }
        } else if (ability !== "(No Ability)") {
            abilities[ability] = 1;
        }
    }
    return;
});

tier_checker.add_new_check(INCLUDING, ["ORAS Balanced Hackmons", "Inverted Balanced Hackmons"], function ateAbilityCheck(src, team, tier) {
    var num = 0;
    for (var i = 0; i < 6; i++) {
        if (sys.teamPokeAbility(src, team, i) === sys.abilityNum("Aerilate") || sys.teamPokeAbility(src, team, i) === sys.abilityNum("Pixilate") || sys.teamPokeAbility(src, team, i) === sys.abilityNum("Refrigerate")) {
            num++;
        }
    }
    if (num > 1) {
        return ["You are not allowed more than one -ate ability in " + tier +"."];
    }
});

tier_checker.add_new_check(INCLUDING, ["ORAS Balanced Hackmons", "SM Balanced Hackmons"], function primalBan(src, team, tier) {
    var ret = [];
    var primals = [sys.pokeNum("Primal Groudon")];
    if (tier === "ORAS Balanced Hackmons") {
        primals.push(sys.pokeNum("Primal Kyogre"));
    }
    for (var i = 0; i < 6; i++) {
        if (primals.contains(sys.teamPoke(src, team, i))) {
            ret.push(("The Pokemon '{0}' is banned on tier '" + tier + "'.").format(sys.pokemon(sys.teamPoke(src,team,i))));
        }
    }    
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["SM Balanced Hackmons"], function banDirectZMoves(src, team, tier) {
    var p, m, move_num;
    for (p = 0; p < 6; p++) {
        for (m = 0; m < 4; m++) {
            move_num = sys.teamPokeMove(src, team, p, m);
            if (move_num >= 673 && move_num <= 701) { // Breakneck Blitz ~ 10,000,000 Volt Thunderbolt
                return ["You are not allowed to load Z-Moves directly in " + tier + "."];
            }
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["SM Balanced Hackmons"], function banComaTalk(src, team, tier) {
    var p, m, move_num, ability;
    for (p = 0; p < 6; p++) {
        for (m = 0; m < 4; m++) {
            move_num = sys.teamPokeMove(src, team, p, m);
            ability = sys.teamPokeAbility(src, team, p);
            if (move_num === sys.moveNum("Sleep Talk") && ability === sys.abilityNum("Comatose")) {
                return ["You are not allowed to use Sleep Talk + Comatose in " + tier + "."];
            }
        }
    }
});

tier_checker.add_new_check(EXCLUDING, challenge_cups.concat(hackmons), function GSCSleepTrap(src, team) {
	var ret = [];
	var gen = sys.gen(src, team);
	if (gen == 2) {
		var sleep = [sys.moveNum("Spore"), sys.moveNum("Hypnosis"), sys.moveNum("Lovely Kiss"), sys.moveNum("Sing"), sys.moveNum("Sleep Powder")].sort();
		var trap = [sys.moveNum("Mean Look"), sys.moveNum("Spider Web")].sort();
		
		pokes:
		for (var i = 0; i < 6; i++) {
			for (var j = 0; j < sleep.length; ++j) {
				if (sys.hasTeamPokeMove(src, team, i, sleep[j])) {
					for (var k = 0; k < trap.length; ++k) {
						if (sys.hasTeamPokeMove(src, team, i, trap[k])) {
							ret.push("Pokemon " + sys.pokemon(sys.teamPoke(src,team,i)) + "  has both a Sleep Inducing and a Trapping move, which is banned in GSC.");
						}
					}
				}
			}
		}
	}	
    return ret;
});

tier_checker.add_new_check(EXCLUDING, hackmons, function banEternal(src, team, tier) {
    var ret = [];
    for (var i = 0; i < 6; i++) {
        if (sys.teamPoke(src, team, i) === sys.pokeNum("Floette-Eternal")) {
            ret.push("The Pokemon 'Floette-Eternal' is banned in tier '" + tier + "'.");
        }
    }    
    return ret;    
});

tier_checker.add_new_check(EXCLUDING, hackmons, function greninjaLegalities(src, team) {
    var p, m, i;
    var ivs = [20, 31, 20, 31, 20, 31];
    for (p = 0; p < 6; p++) {
        if (sys.teamPokeAbility(src, team, p) === 215) { // battle bond
            for (m = 0; m < 4; m++) {
                if (sys.teamPokeMove(src, team, p, m) !== 237) {
                    continue;
                }
                if (sys.teamPokeHiddenPower(src, team, p) !== 7) { // ghost
                    return ["The Hidden Power type of Greninja with Battle Bond must be Ghost."];
                }
            }
            for (i = 0; i < 6; i++) {
                if (sys.teamPokeDV(src, team, p, i) < ivs[i]) {
                    return ["Greninja with Battle Bond must have the following minimum IV spread: " + ivs.join("/")];
                }
            }
            if (sys.teamPokeShine(src, team, p)) {
                return ["Greninja with Battle Bond cannot be Shiny."];
            }
        }
    }
});

tier_checker.add_new_check(EXCLUDING, challenge_cups.concat(hackmons), function GSCUnown(src, team) {
    var gen = sys.gen(src, team);
    //Both shininess and form are determined by IVs in gen 2, making the letters I and V the only ones that can be shiny
    if (gen == 2) {
        var letters = [sys.pokeNum("Unown-I"), sys.pokeNum("Unown-V")];
        for (var i = 0; i < 6; i++) {
            if (!letters.contains(sys.teamPoke(src, team, i))) {
                sys.changePokeShine(src, team, i, false);
            }
        }
    }
});

tier_checker.add_new_check(EXCLUDING, hackmons, function resolveLegality(src, team, tier) {
    for (var p = 0; p < 6; p++) {
        var pokeNum = sys.teamPoke(src, team, p),
            pokeName = sys.pokemon(pokeNum),
            baseName = sys.pokemon(utilities.baseForme(pokeName));
        var alolan = pokeName.indexOf("Alolan ") === 0;
        for (var m = 0; m < 4; m++) {
            var moveNum = sys.teamPokeMove(src, team, p, m),
                moveName = sys.move(moveNum);
            if (alolan && baseName in legality.Alolan && legality.Alolan[baseName].contains(moveName)) {
                return [pokeName + " cannot learn the move " + moveName + "."];
            }
            else if (moveName in legality.Event && pokeName in legality.Event[moveName]) {
                var constraints = legality.Event[moveName][pokeName], c;
                for (c in constraints) {
                    var legal = function() {
                        var val = constraints[c];
                        switch(c) {
                            case "min_level":
                                return [sys.teamPokeLevel(src, team, p) >= val, pokeName + " must be at least level " + val + " to be compatible with event move " + moveName + "."];
                            case "hidden":
                                var ability = sys.ability(sys.teamPokeAbility(src, team, p)),
                                    hiddenability = sys.ability(sys.pokeAbility(pokeNum, 2)),
                                    abilities = [sys.ability(sys.pokeAbility(pokeNum, 0))];
                                if (sys.pokeAbility(pokeNum, 1)) {
                                    abilities.push(sys.ability(sys.pokeAbility(pokeNum, 1)));
                                }
                                return [typeof val === "boolean" ? (val ? hiddenability && ability === hiddenability : abilities.contains(ability)) : true, pokeName + " must have " + (typeof val === "boolean" && val ? hiddenability : abilities.join(" or ")) + " to be compatible with event move " + moveName + "."];
                            case "shiny":
                                return [typeof val === "boolean" ? sys.teamPokeShine(src, team, p) === val : true, pokeName + (val ? " must be" : " cannot be") + " Shiny to be compatible with event move " + moveName + "."];
                            default:
                                return [true, ""];
                        }
                    }();
                    if (!legal[0]) {
                        return [legal[1]];
                    }
                }
            }
        }
    }
});

module.exports = tier_checker;
