// Global variables inherited from scripts.js
/*global breedingpokemons, dwpokemons, checkbot, normalbot, lcpokemons, staffchannel, pokeNatures, lcmoves */

function TierChecker() {
    this.checkers = [];
}

TierChecker.prototype.add_new_check = function(exclusive, tiers, checker) {
    this.checkers.push({tiers: tiers, checker: checker, exclusive: exclusive});
};

TierChecker.prototype.has_legal_team_for_tier = function(src, team, tier, silent, returncomp) {
    if (tier == "Challenge Cup" || tier == "CC 1v1" || tier == "Wifi CC 1v1" || (tier == "Battle Factory" || tier == "Battle Factory 6v6") && sys.gen(src, team) === 6) return true;
    if (!sys.hasLegalTeamForTier(src, team, tier)) return false;

    var complaints = [];
    for (var i = 0; i < this.checkers.length; ++i) {
        var valid_tier = (this.checkers[i].exclusive === true
            ? this.checkers[i].tiers.indexOf(tier) == -1
            : this.checkers[i].tiers.indexOf(tier) != -1);
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
    var testPath = ["XY LC", "XY OU", "XY Ubers", "Pre-PokeBank OU","BW2 LC", "DW LC", "BW2 LC Ubers", "BW2 NU", "BW2 LU", "BW2 UU", "BW2 OU", "No Preview OU", "BW2 Ubers", "No Preview Ubers", "Battle Factory 6v6", "Challenge Cup"];
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
var challenge_cups = ["Challenge Cup", "CC 1v1", "Battle Factory", "Battle Factory 6v6"];

tier_checker.add_new_check(EXCLUDING, challenge_cups, function eventMovesCheck(src, team) {
    var ret = [];
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, team, i);
        if (poke in pokeNatures) {
            for (var x in pokeNatures[poke]) {
                if (sys.hasTeamPokeMove(src, team, i, x) && sys.teamPokeNature(src, team, i) != pokeNatures[poke][x])
                {
                    ret.push("" + sys.pokemon(poke) + " with " + sys.move(x) + " must be a " + sys.nature(pokeNatures[poke][x]) + " nature. Change it in the teambuilder.");
                }
            }
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["BW2 LC", "BW2 LC Ubers", "BW2 UU LC"], function littleCupCheck(src, team) {
    var ret = [];
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, team, i);
        if (x !== 0 && sys.hasDreamWorldAbility(src, team, i) && lcpokemons.indexOf(x) != -1 ) {
            ret.push("" + sys.pokemon(x) + " is not allowed with a Dream World ability in this tier. Change it in the teambuilder.");

        }
        if (x !== 0 && lcmoves.hasOwnProperty(sys.pokemon(x))) {
            for (var j = 0; j < 4; j++) {
                if (lcmoves[sys.pokemon(x)].indexOf(sys.move(sys.teamPokeMove(src, team, i, j))) !== -1) {
                    ret.push("" + sys.pokemon(x) + " is not allowed in this in tier with the move " + sys.move(sys.teamPokeMove(src, team, i, j)) + ". Change it in the teambuilder.");
                }
            }
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["BW2 NU"], function evioliteCheck(src, team, tier) {
    var evioliteLimit = 6;
    var eviolites = 0;
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, team, i);
        var item = sys.teamPokeItem(src, team, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        if (item == "Eviolite" && ++eviolites > evioliteLimit) {
            return ["Only 1 pokemon is allowed with eviolite in " + tier + " tier. Please remove extra evioites in teambuilder."];
        }
    }
});

if (typeof Config == "undefined") { Config = { DreamWorldTiers: ["No Preview OU",  "No Preview Ubers"] }; }
tier_checker.add_new_check(EXCLUDING, Config.DreamWorldTiers, function dwAbilityCheck(src, team, tier) {
    // Of course, DW ability only affects 5th gen
    var ret = [];
    if (sys.gen(src, team) === 5) {
        for (var i = 0; i < 6; i++) {
            var x = sys.teamPoke(src, team, i);
            if (x !== 0 && sys.hasDreamWorldAbility(src, team, i) && (!(x in dwpokemons) || (breedingpokemons.indexOf(x) != -1 && sys.compatibleAsDreamWorldEvent(src, team, i) !== true))) {
                if (!(x in dwpokemons)) {
                    ret.push("" + sys.pokemon(x) + " is not allowed with a Dream World ability in " + tier + " tier. Change it in the teambuilder.");
                } else {
                    ret.push("" + sys.pokemon(x) + " has to be Male and have no egg moves with its Dream World ability in  " + tier + " tier. Change it in the teambuilder.");
                }
            }
        }
    }
    // few unreleased abilities left in gen 6
    var pokebank = ["Tentacool", "Tentacruel", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking Staryu", "Starmie", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Mewtwo", "Sentret", "Furret", "Chinchou", "Lanturn", "Qwilfish", "Mantine", "Zigzagoon", "Linoone", "Skitty", "Delcatty", "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Torkoal", "Lunatone", "Solrock", "Barboach", "Whiscash", "Lileep", "Cradily", "Anorith", "Armaldo", "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Burmy", "Wormadam", "Mothim", "Chatot", "Munchlax", "Hippopotas", "Hippowdon", "Mantyke", "Patrat", "Watchog", "Basculin", "Tirtouga", "Carracosta", "Karrablast", "Escavalier", "Alomomola", "Shelmet", "Accelgor"];
    if (sys.gen(src, team) === 6) {
        for (var i = 0; i < 6; i++) {
            var x = sys.teamPoke(src, team, i);
            if (x !== 0 && script.hasDreamWorldAbility(x, sys.teamPokeAbility(src, team, i))) {
                if (!(x in script.hapokemons) && (tier !== "Pre-PokeBank OU" || pokebank.indexOf(sys.pokemon(x)) !== -1)) {
                    ret.push("" + sys.pokemon(x) + " is not allowed with Hidden Ability " + sys.ability(sys.teamPokeAbility(src, team, i)) + " in " + tier + " tier. Change it in the teambuilder.");
                }
            }
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["Inverted Battle", "XY 1v1","XY Ubers", "X/Y Cup", "XY OU", "Gen 6 LC", "No Preview OU", "BW2 OU", "BW2 UU", "BW2 LU", "BW2 LC", "DW LC", "BW2 Ubers", "No Preview Ubers", "Clear Skies", "Clear Skies DW", "Monotype", "Monocolour", "Monogen", "Smogon OU", "Smogon UU", "Smogon RU", "BW2 NU", "Metronome", "BW2 NEU"],
                           function inconsistentCheck(src, team, tier) {
    var moody = sys.abilityNum("Moody");
    var ret = [];
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, team, i);

        if (x !== 0 && sys.teamPokeAbility(src, team, i) == moody) {
            ret = ["" + sys.pokemon(x) + " is not allowed with Moody in " + tier + ". Change it in the teambuilder."];
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["Clear Skies"], function weatherlesstiercheck(src, team, tier) {
    var ret = [];
    for (var i = 0; i < 6; i++){
        var ability = sys.ability(sys.teamPokeAbility(src, team, i));
        if(ability.toLowerCase() == "drizzle" || ability.toLowerCase() == "drought" || ability.toLowerCase() == "snow warning" || ability.toLowerCase() == "sand stream") {
            ret.push("Your team has a pokemon with the ability: " + ability + ", please remove before entering " +tier+" tier.");
        }
    }
    return ret;
});
    
tier_checker.add_new_check(INCLUDING, ["Monotype"], function monotypeCheck(src, team) {
    var type1, type2, typea = 0, typeb = 0,teamLength = 0;
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, team, i);
        if (poke === 0) {
            continue;
        }
        type1 = sys.pokeType1(poke, 6);
        type2 = sys.pokeType2(poke, 6);
        teamLength++;
    }
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, team, i);
        if (poke === 0) {
            continue;
        }
        if ((type1 === sys.pokeType1(poke, 6) || type1 === sys.pokeType2(poke, 6)) && type1 !== 18) {
            typea++;
        }
        if ((type2 === sys.pokeType1(poke, 6) || type2 === sys.pokeType2(poke, 6)) && type2 !== 18) {
            typeb++;
        }
    }
    if (typea < teamLength && typeb < teamLength) {
        return ["Team is not monotype as not every team member is " + (typea >= typeb ? sys.type(type1) : sys.type(type2))];
    }
});

tier_checker.add_new_check(INCLUDING, ["Monogen"], function monoGenCheck(src, team) {
    var GEN_MAX = [0, 151, 252, 386, 493, 649, 718];
    var gen = 0;
    for (var i = 0; i < 6; ++i) {
        var pokenum = sys.teamPoke(src, team, i);
        var species = pokenum % 65536; // remove alt formes
        if (species === 0) continue;
        if (gen === 0) {
            while (species > GEN_MAX[gen]) ++gen; // Search for correct gen for first poke
        } else if (!(GEN_MAX[gen-1] < species && species <= GEN_MAX[gen])) {
            return [sys.pokemon(pokenum) + " is not from gen " + gen];
        }
    }
});


tier_checker.add_new_check(INCLUDING, ["Monocolour"], function monoColourCheck(src, team) {
    var colours = {
        'Red': ['Charmander', 'Charmeleon', 'Charizard', 'Vileplume', 'Paras', 'Parasect', 'Krabby', 'Kingler', 'Voltorb', 'Electrode', 'Goldeen', 'Seaking', 'Jynx', 'Magikarp', 'Magmar', 'Flareon', 'Ledyba', 'Ledian', 'Ariados', 'Yanma', 'Scizor', 'Slugma', 'Magcargo', 'Octillery', 'Delibird', 'Porygon2', 'Magby', 'Ho-Oh', 'Torchic', 'Combusken', 'Blaziken', 'Wurmple', 'Medicham', 'Carvanha', 'Camerupt', 'Solrock', 'Corphish', 'Crawdaunt', 'Latias', 'Groudon', 'Deoxys', 'Deoxys-A', 'Deoxys-D', 'Deoxys-S', 'Kricketot', 'Kricketune', 'Magmortar', 'Porygon-Z', 'Rotom', 'Rotom-H', 'Rotom-F', 'Rotom-W', 'Rotom-C', 'Rotom-S', 'Tepig', 'Pignite', 'Emboar', 'Pansear', 'Simisear', 'Throh', 'Venipede', 'Scolipede', 'Krookodile', 'Darumaka', 'Darmanitan', 'Dwebble', 'Crustle', 'Scrafty', 'Shelmet', 'Accelgor', 'Druddigon', 'Pawniard', 'Bisharp', 'Braviary', 'Heatmor'],
        'Blue': ['Squirtle', 'Wartortle', 'Blastoise', 'Nidoran?', 'Nidorina', 'Nidoqueen', 'Oddish', 'Gloom', 'Golduck', 'Poliwag', 'Poliwhirl', 'Poliwrath', 'Tentacool', 'Tentacruel', 'Tangela', 'Horsea', 'Seadra', 'Gyarados', 'Lapras', 'Vaporeon', 'Omanyte', 'Omastar', 'Articuno', 'Dratini', 'Dragonair', 'Totodile', 'Croconaw', 'Feraligatr', 'Chinchou', 'Lanturn', 'Marill', 'Azumarill', 'Jumpluff', 'Wooper', 'Quagsire', 'Wobbuffet', 'Heracross', 'Kingdra', 'Phanpy', 'Suicune', 'Mudkip', 'Marshtomp', 'Swampert', 'Taillow', 'Swellow', 'Surskit', 'Masquerain', 'Loudred', 'Exploud', 'Azurill', 'Meditite', 'Sharpedo', 'Wailmer', 'Wailord', 'Swablu', 'Altaria', 'Whiscash', 'Chimecho', 'Wynaut', 'Spheal', 'Sealeo', 'Walrein', 'Clamperl', 'Huntail', 'Bagon', 'Salamence', 'Beldum', 'Metang', 'Metagross', 'Regice', 'Latios', 'Kyogre', 'Piplup', 'Prinplup', 'Empoleon', 'Shinx', 'Luxio', 'Luxray', 'Cranidos', 'Rampardos', 'Gible', 'Gabite', 'Garchomp', 'Riolu', 'Lucario', 'Croagunk', 'Toxicroak', 'Finneon', 'Lumineon', 'Mantyke', 'Tangrowth', 'Glaceon', 'Azelf', 'Phione', 'Manaphy', 'Oshawott', 'Dewott', 'Samurott', 'Panpour', 'Simipour', 'Roggenrola', 'Boldore', 'Gigalith', 'Woobat', 'Swoobat', 'Tympole', 'Palpitoad', 'Seismitoad', 'Sawk', 'Tirtouga', 'Carracosta', 'Ducklett', 'Karrablast', 'Eelektrik', 'Eelektross', 'Elgyem', 'Cryogonal', 'Deino', 'Zweilous', 'Hydreigon', 'Cobalion', 'Thundurus', 'Thundurus-T'],
        'Green': ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Caterpie', 'Metapod', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Scyther', 'Chikorita', 'Bayleef', 'Meganium', 'Spinarak', 'Natu', 'Xatu', 'Bellossom', 'Politoed', 'Skiploom', 'Larvitar', 'Tyranitar', 'Celebi', 'Treecko', 'Grovyle', 'Sceptile', 'Dustox', 'Lotad', 'Lombre', 'Ludicolo', 'Breloom', 'Electrike', 'Roselia', 'Gulpin', 'Vibrava', 'Flygon', 'Cacnea', 'Cacturne', 'Cradily', 'Kecleon', 'Tropius', 'Rayquaza', 'Turtwig', 'Grotle', 'Torterra', 'Budew', 'Roserade', 'Bronzor', 'Bronzong', 'Carnivine', 'Yanmega', 'Leafeon', 'Shaymin', 'Shaymin-S', 'Snivy', 'Servine', 'Serperior', 'Pansage', 'Simisage', 'Swadloon', 'Cottonee', 'Whimsicott', 'Petilil', 'Lilligant', 'Basculin', 'Maractus', 'Trubbish', 'Garbodor', 'Solosis', 'Duosion', 'Reuniclus', 'Axew', 'Fraxure', 'Golett', 'Golurk', 'Virizion', 'Tornadus','Tornadus-T'],
        'Yellow': ['Kakuna', 'Beedrill', 'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Ninetales', 'Meowth', 'Persian', 'Psyduck', 'Ponyta', 'Rapidash', 'Drowzee', 'Hypno', 'Exeggutor', 'Electabuzz', 'Jolteon', 'Zapdos', 'Moltres', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Pichu', 'Ampharos', 'Sunkern', 'Sunflora', 'Girafarig', 'Dunsparce', 'Shuckle', 'Elekid', 'Raikou', 'Beautifly', 'Pelipper', 'Ninjask', 'Makuhita', 'Manectric', 'Plusle', 'Minun', 'Numel', 'Lunatone', 'Jirachi', 'Mothim', 'Combee', 'Vespiquen', 'Chingling', 'Electivire', 'Uxie', 'Cresselia', 'Victini', 'Sewaddle', 'Leavanny', 'Scraggy', 'Cofagrigus', 'Archen', 'Archeops', 'Deerling', 'Joltik', 'Galvantula', 'Haxorus', 'Mienfoo', 'Keldeo', 'Keldeo-R'],
        'Purple': ['Rattata', 'Ekans', 'Arbok', 'Nidoran?', 'Nidorino', 'Nidoking', 'Zubat', 'Golbat', 'Venonat', 'Venomoth', 'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Koffing', 'Weezing', 'Starmie', 'Ditto', 'Aerodactyl', 'Mewtwo', 'Crobat', 'Aipom', 'Espeon', 'Forretress', 'Gligar', 'Granbull', 'Mantine', 'Tyrogue', 'Cascoon', 'Delcatty', 'Sableye', 'Illumise', 'Swalot', 'Grumpig', 'Lileep', 'Shellos', 'Gastrodon', 'Ambipom', 'Drifloon', 'Drifblim', 'Mismagius', 'Stunky', 'Skuntank', 'Spiritomb', 'Skorupi', 'Drapion', 'Gliscor', 'Palkia', 'Purrloin', 'Liepard', 'Gothita', 'Gothorita', 'Gothitelle', 'Mienshao', 'Genesect'],
        'Pink': ['Clefairy', 'Clefable', 'Jigglypuff', 'Wigglytuff', 'Slowpoke', 'Slowbro', 'Exeggcute', 'Lickitung', 'Chansey', 'Mr. Mime', 'Porygon', 'Mew', 'Cleffa', 'Igglybuff', 'Flaaffy', 'Hoppip', 'Slowking', 'Snubbull', 'Corsola', 'Smoochum', 'Miltank', 'Blissey', 'Whismur', 'Skitty', 'Milotic', 'Gorebyss', 'Luvdisc', 'Cherubi', 'Cherrim', 'Mime Jr.', 'Happiny', 'Lickilicky', 'Mesprit', 'Munna', 'Musharna', 'Audino', 'Alomomola'],
        'Brown': ['Weedle', 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Raticate', 'Spearow', 'Fearow', 'Vulpix', 'Diglett', 'Dugtrio', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Abra', 'Kadabra', 'Alakazam', 'Geodude', 'Graveler', 'Golem', 'Farfetch\'d', 'Doduo', 'Dodrio', 'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan', 'Kangaskhan', 'Staryu', 'Pinsir', 'Tauros', 'Eevee', 'Kabuto', 'Kabutops', 'Dragonite', 'Sentret', 'Furret', 'Hoothoot', 'Noctowl', 'Sudowoodo', 'Teddiursa', 'Ursaring', 'Swinub', 'Piloswine', 'Stantler', 'Hitmontop', 'Entei', 'Zigzagoon', 'Seedot', 'Nuzleaf', 'Shiftry', 'Shroomish', 'Slakoth', 'Slaking', 'Shedinja', 'Hariyama', 'Torkoal', 'Spinda', 'Trapinch', 'Baltoy', 'Feebas', 'Regirock', 'Chimchar', 'Monferno', 'Infernape', 'Starly', 'Staravia', 'Staraptor', 'Bidoof', 'Bibarel', 'Buizel', 'Floatzel', 'Buneary', 'Lopunny', 'Bonsly', 'Hippopotas', 'Hippowdon', 'Mamoswine', 'Heatran', 'Patrat', 'Watchog', 'Lillipup', 'Conkeldurr', 'Sandile', 'Krokorok', 'Sawsbuck', 'Beheeyem', 'Stunfisk', 'Bouffalant', 'Vullaby', 'Mandibuzz', 'Landorus', 'Landorus-T'],
         'Black': ['Snorlax', 'Umbreon', 'Murkrow', 'Unown', 'Sneasel', 'Houndour', 'Houndoom', 'Mawile', 'Spoink', 'Seviper', 'Claydol', 'Shuppet', 'Banette', 'Duskull', 'Dusclops', 'Honchkrow', 'Chatot', 'Munchlax', 'Weavile', 'Dusknoir', 'Giratina', 'Darkrai', 'Blitzle', 'Zebstrika', 'Sigilyph', 'Yamask', 'Chandelure', 'Zekrom'],
        'Gray': ['Machop', 'Machoke', 'Machamp', 'Magnemite', 'Magneton', 'Onix', 'Rhyhorn', 'Rhydon', 'Misdreavus', 'Pineco', 'Steelix', 'Qwilfish', 'Remoraid', 'Skarmory', 'Donphan', 'Pupitar', 'Poochyena', 'Mightyena', 'Nincada', 'Nosepass', 'Aron', 'Lairon', 'Aggron', 'Volbeat', 'Barboach', 'Anorith', 'Armaldo', 'Snorunt', 'Glalie', 'Relicanth', 'Registeel', 'Shieldon', 'Bastiodon', 'Burmy', 'Wormadam', 'Wormadam-G', 'Wormadam-S', 'Glameow', 'Purugly', 'Magnezone', 'Rhyperior', 'Probopass', 'Arceus', 'Herdier', 'Stoutland', 'Pidove', 'Tranquill', 'Unfezant', 'Drilbur', 'Excadrill', 'Timburr', 'Gurdurr', 'Whirlipede', 'Zorua', 'Zoroark', 'Minccino', 'Cinccino', 'Escavalier', 'Ferroseed', 'Ferrothorn', 'Klink', 'Klang', 'Klinklang', 'Durant', 'Terrakion', 'Kyurem', 'Kyurem-B', 'Kyurem-W'],
        'White': ['Butterfree', 'Seel', 'Dewgong', 'Togepi', 'Togetic', 'Mareep', 'Smeargle', 'Lugia', 'Linoone', 'Silcoon', 'Wingull', 'Ralts', 'Kirlia', 'Gardevoir', 'Vigoroth', 'Zangoose', 'Castform', 'Absol', 'Shelgon', 'Pachirisu', 'Snover', 'Abomasnow', 'Togekiss', 'Gallade', 'Froslass', 'Dialga', 'Regigigas', 'Swanna', 'Vanillite', 'Vanillish', 'Vanilluxe', 'Emolga', 'Foongus', 'Amoonguss', 'Frillish', 'Jellicent', 'Tynamo', 'Litwick', 'Lampent', 'Cubchoo', 'Beartic', 'Rufflet', 'Larvesta', 'Volcarona', 'Reshiram', 'Meloetta', 'Meloetta-S']
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
            return ["" + poke + " has not the colour: " + thecolour];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Smogon OU", "BW2 OU", "No Preview OU"], function swiftSwimCheck(src, team) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Drizzle"){
            for(var j = 0; j <6; ++j){
                if(sys.ability(sys.teamPokeAbility(src, team, j)) == "Swift Swim"){
                    return ["You cannot have the combination of Swift Swim and Drizzle in OU"];
                }
            }
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Smogon UU"], function droughtCheck(src, team) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Drought"){
            return ["Drought is not allowed in Smogon UU"];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 UU", "BW2 LU", "BW2 NU", "BW2 NEU", "BW2 LC"], function sandStreamCheck(src, team, tier) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Sand Stream"){
            return ["Sand Stream is not allowed in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 UU", "BW2 LU", "BW2 NU", "BW2 NEU"], function snowWarningCheck(src, team, tier) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Snow Warning"){
            return ["Snow Warning is not allowed in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 OU", "No Preview OU"], function sandVeilCheck(src, team, tier) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Sand Veil"){
            return ["Sand Veil is not allowed in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 OU", "No Preview OU"], function snowCloakCheck(src, team, tier) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Snow Cloak"){
            return ["Snow Cloak is not allowed in " + tier + "."];
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 LC"], function regeneratorCheck(src, team, tier) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, team, i)) == "Speed Boost"){
            return ["Speed Boost is not allowed in " + tier + "."];
        }
    }
});

//remove these after tiers are updated on server
tier_checker.add_new_check(INCLUDING, ["Gen 6 OU"], function bannedPokesOU(src, team, tier) {
    for (var i = 0; i < 6; ++i) {
        var bans = ["Shaymin-S", "Ho-oh", "Deoxys-A", "Deoxys-S", "Kyurem-W"];
        for (var j = 0; j < bans.length; j++) {
            if (sys.teamPoke(src, team, i) === sys.pokeNum(bans[j])){
                return [bans[j] + " is banned in " + tier + "."];
            }
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["BW2 NU", "BW2 NEU"], function smashPassCheck(src, team, tier) {
    var ret = [];
    for (var i = 0; i < 6; i++) {
        if (sys.hasTeamPokeMove(src, team, i, sys.moveNum("Shell Smash")) && sys.hasTeamPokeMove(src, team, i, sys.moveNum("Baton Pass"))) {
            ret.push(sys.pokemon(sys.teamPoke(src, team, i)) + " has the combination of Shell Smash and Baton Pass which is banned in " + tier + " please remove before entering the tier");
        }
    }
    return ret;
});

tier_checker.add_new_check(INCLUDING, ["Shanai Cup"], function shanaiAbilityCheck(src, team) {
    var bannedAbilities = {
        'treecko': ['overgrow'],
        'chimchar': ['blaze'],
        'totodile': ['torrent'],
        'spearow': ['sniper'],
        'skorupi': ['battle armor', 'sniper'],
        'spoink': ['thick fat'],
        'golett': ['iron fist'],
        'magnemite': ['magnet pull', 'analytic'],
        'electrike': ['static', 'lightningrod'],
        'nosepass': ['sturdy', 'magnet pull'],
        'axew': ['rivalry'],
        'croagunk': ['poison touch', 'dry skin'],
        'cubchoo': ['rattled'],
        'joltik': ['swarm'],
        'shroomish': ['effect spore', 'quick feet'],
        'pidgeotto': ['big pecks'],
        'karrablast': ['swarm']
    };
    var ret = [];
    for (var i = 0; i < 6; ++i) {
        var ability = sys.ability(sys.teamPokeAbility(src, team, i));
        var lability = ability.toLowerCase();
        var poke = sys.pokemon(sys.teamPoke(src, team, i));
        var lpoke = poke.toLowerCase();
        if (lpoke in bannedAbilities && bannedAbilities[lpoke].indexOf(lability) != -1) {
            ret.push("" + poke + " is not allowed to have ability " + ability + " in this tier. Please change it in Teambuilder (You are now in Challenge Cup).");
        }
    }
    return ret;
});

tier_checker.add_new_check(EXCLUDING, [], function eventShinies(player, team) {
    var beasts = {};
    beasts[sys.pokeNum('Raikou')]  = ['Extremespeed', 'Aura Sphere', 'Weather Ball', 'Zap Cannon'] .map(sys.moveNum);
    beasts[sys.pokeNum('Suicune')] = ['Extremespeed', 'Aqua Ring',   'Sheer Cold',   'Air Slash']  .map(sys.moveNum);
    beasts[sys.pokeNum('Entei')]   = ['Extremespeed', 'Howl',        'Crush Claw',   'Flare Blitz'].map(sys.moveNum);
    beasts[sys.pokeNum('Genesect')] = ['Extremespeed', 'Blaze Kick', 'Shift Gear'].map(sys.moveNum);
 
    for (var beast in beasts)
        for (var slot=0; slot<6; slot++)
            if (sys.teamPoke(player, team, slot) == beast)
                for (var i=0; i<4; i++)
                    if (-1 != beasts[beast].indexOf(sys.teamPokeMove(player, team, slot, i)))
                        sys.changePokeShine(player, team, slot, true);
});

tier_checker.add_new_check(EXCLUDING, challenge_cups, function hasOneUsablePokemon(player, team) {
    for (var slot=0; slot<6; slot++)
        if (sys.teamPoke(player, team, slot) !== 0)
            for (var move=0; move<4; move++)
                if (sys.teamPokeMove(player, team , slot, move) !== 0)
                    return;
    return ["You do not have any valid pokemon."];
});

tier_checker.add_new_check(INCLUDING, ["Pre-PokeBank OU"], function pokeBankCheck(src, team) {
    var ret = [];
    for (var slot = 0; slot < 6; slot++) {
        var poke = sys.teamPoke(src, team, slot);
        if (poke) { 
            var moves = script.getAllGenMoves(poke);
            for (var move = 0; move < 4; move++) {
                if (sys.teamPokeMove(src, team, slot, move)) {
                    if (moves.indexOf(sys.teamPokeMove(src, team, slot, move).toString()) === -1) {
                        ret.push(sys.pokemon(poke) + " cannot have move " + sys.move(sys.teamPokeMove(src, team, slot, move)) + " in this tier");
                    }
                }
            }
        }
    }
    return ret;
});

module.exports = tier_checker;
