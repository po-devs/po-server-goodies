function TierChecker() {
    this.checkers = [];
}

TierChecker.prototype.add_new_check = function(exclusive, tier, checker) {
    this.checkers.append({tiers: tiers, checker: checker, exclusive: exclusive});
};

TierChecker.prototype.check_if_valid_for = function(src, tier) {
    if(tier == "Challenge Cup") return true;

    for (var i = 0; i < this.checkers; ++i) {
        var valid_tier = (this.checkers[i].exclusive === true
            ? this.checkers[i].tiers.indexOf(tier) == -1
            : this.checkers[i].tiers.indexOf(tier) != -1);
        if (valid_tier && this.checkers[i].checker(src, tier)) {
            return false;
        }
    }
    return true;
};

TierChecker.prototype.find_good_tier = function(src) {
    // TODO: write up
    var testPath = ["Wifi LC", "DW LC", "Wifi LC Ubers", "Wifi NU", "Wifi LU", "Wifi UU", "DW UU", "Wifi OU", "DW OU", "Wifi Ubers", "Wifi DW", "Challenge Cup"];
    for (var i = 0; i < testPath.length; ++i) {
        var testtier = testPath[i];
        if (sys.hasLegalTeamForTier(src, testtier) && this.check_if_valid_for(src, testtier)) {
            sys.changeTier(src, testtier);
            return;
        }
    }
};

var tier_checker = new TierChecker();
var INCLUDING = false;
var EXCLUDING = true;
var challenge_cups = ["Challenge Cup", "CC 1v1"];

tier_checker.add_new_check(EXCLUDING, challenge_cups, function eventMovesCheck(src) {
    for (var i = 0; i < 6; i++) {
        var poke = sys.teamPoke(src, i);
        if (poke in pokeNatures) {
            for (var x in pokeNatures[poke]) {
                if (sys.hasTeamPokeMove(src, i, x) && sys.teamPokeNature(src, i) != pokeNatures[poke][x])
                {
                    checkbot.sendMessage(src, "" + sys.pokemon(poke) + " with " + sys.move(x) + " must be a " + sys.nature(pokeNatures[poke][x]) + " nature. Change it in the teambuilder.");
                    return true; // If this is true, it is true for each tier...
                }
            }
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Wifi LC", "Wifi LC Ubers", "Wifi UU LC"], function littleCupCheck(src) {
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        if (x !== 0 && sys.hasDreamWorldAbility(src, i) && lcpokemons.indexOf(x) != -1 ) {
            checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with a Dream World ability in this tier. Change it in the teambuilder.");

            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Wifi NU"], function evioliteCheck(src) {
    var evioliteLimit = 6;
    var eviolites = 0;
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        var item = sys.teamPokeItem(src, i);
        item = item !== undefined ? sys.item(item) : "(no item)";
        if (item == "Eviolite" && ++eviolites > evioliteLimit) {
            checkbot.sendMessage(src, "Only 1 pokemon is allowed with eviolite in " + tier + " tier. Please remove extra evioites in teambuilder.");
            return true;
        }
    }
});

tier_checker.add_new_check(EXCLUDING, Config.DreamWorldTiers, function dwAbilityCheck(src) {
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);
        if (x !== 0 && sys.hasDreamWorldAbility(src, i) && (!(x in dwpokemons) || (breedingpokemons.indexOf(x) != -1 && sys.compatibleAsDreamWorldEvent(src, i) !== true))) {
            if (!(x in dwpokemons)) {
                checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with a Dream World ability in " + tier + " tier. Change it in the teambuilder.");
            } else {
                checkbot.sendMessage(src, "" + sys.pokemon(x) + " has to be Male and have no egg moves with its Dream World ability in  " + tier + " tier. Change it in the teambuilder.");
            }
            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["DW OU", "DW UU", "DW LU", "Wifi OU", "Wifi UU", "Wifi LU", "Wifi LC", "DW LC", "Wifi Ubers", "DW Ubers", "Clear Skies", "Clear Skies DW", "Monotype", "Monocolour", "Monogen", "Smogon OU", "Smogon UU", "Smogon RU", "Wifi NU"], function inconsistentCheck(src) {
    var moody = sys.abilityNum("Moody");
    for (var i = 0; i < 6; i++) {
        var x = sys.teamPoke(src, i);

        if (x !== 0 && sys.teamPokeAbility(src, i) == moody) {
            checkbot.sendMessage(src, "" + sys.pokemon(x) + " is not allowed with Moody in " + tier + ". Change it in the teambuilder.");
            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Clear Skies", "Clear Skies DW"], function weatherlesstiercheck(src, tier) {
    for (var i = 0; i < 6; i++){
        var ability = sys.ability(sys.teamPokeAbility(src, i));
        if(ability.toLowerCase() == "drizzle" || ability.toLowerCase() == "drought" || ability.toLowerCase() == "snow warning" || ability.toLowerCase() == "sand stream") {
            normalbot.sendMessage(src, "Your team has a pokemon with the ability: " + ability + ", please remove before entering " +tier+" tier.");
            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Monotype"], function monotypeCheck(src) {
    // TODO: this is too complicated.
    var TypeA = sys.pokeType1(sys.teamPoke(src, 0), 5);
    var TypeB = sys.pokeType2(sys.teamPoke(src, 0), 5);
    var k;
    var checkType;
    for (var i = 1; i < 6 ; i++) {
        if (sys.teamPoke(src, i) === 0) continue;
        var temptypeA = sys.pokeType1(sys.teamPoke(src, i), 5);
        var temptypeB = sys.pokeType2(sys.teamPoke(src, i), 5);

        if(checkType !== undefined) {
            k=3;
        }
        if(i==1){
            k=1;
        }
        if(TypeB !=17){
            if(temptypeA == TypeA && temptypeB == TypeB && k == 1 || temptypeA == TypeB && temptypeB == TypeA && k == 1){
                k=2;
            }
        }
        if (temptypeA == TypeA && k == 1 || temptypeB == TypeA && k == 1) {
            checkType=TypeA;
        }
        if (temptypeA == TypeB && k == 1 || temptypeB == TypeB && k == 1) {
           if(TypeB != 17){
                   checkType=TypeB;
                   }
                   if(TypeB == 17)
                   checkType=TypeA;
        }
        if(i>1 && k == 2) {
            k=1;
            if(temptypeA == TypeA && temptypeB == TypeB && k == 1 || temptypeA == TypeB && temptypeB == TypeA && k == 1){
                k=2;
            }
            if (temptypeA == TypeA && k == 1 || temptypeB == TypeA && k == 1) {
                checkType=TypeA;
            }
            if (temptypeA == TypeB && k == 1 || temptypeB == TypeB && k == 1) {
                 if(TypeB != 17){
                   checkType=TypeB;
                   }
                   if(TypeB == 17)
                   checkType=TypeA;
            }
        }
        if(k==3){

            if(temptypeA != checkType && temptypeB != checkType) {

                normalbot.sendMessage(src, "Team not Monotype as " + sys.pokemon(sys.teamPoke(src, i)) + " is not " + sys.type(checkType) + "!");
                /*
                if(sys.hasLegalTeamForTier(src, "DW OU")) {
                    if(sys.hasLegalTeamForTier(src,"Wifi OU")) {
                        sys.changeTier(src, "Wifi OU");
                        sys.stopEvent()
                        return;
                    }
                    sys.changeTier(src, "DW OU");
                    sys.stopEvent()
                    return;
                }
                if(sys.hasLegalTeamForTier(src,"Wifi Ubers")) {
                    sys.changeTier(src, "Wifi Ubers");
                    sys.stopEvent()
                    return;
                }
                sys.changeTier(src, "DW Ubers");
                */
                return true;
            }
        }

        if(k==1) {
                    if(TypeB == 17){
                        TypeB = TypeA;
                        }
            if (temptypeA != TypeA && temptypeB != TypeA && temptypeA != TypeB && temptypeB != TypeB) {
                normalbot.sendMessage(src, "Team not Monotype as " + sys.pokemon(sys.teamPoke(src, i)) + " does not share a type with " + sys.pokemon(sys.teamPoke(src, 0)) + "!");

                return true;
            }

        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Monogen"], function monoGenCheck(src) {
    var GEN_MAX = [0, 151, 252, 386, 493, 646];
    var gen = 0;
    for (var i = 0; i < 6; ++i) {
        var pokenum = sys.teamPoke(src, i);
        var species = pokenum % 65536; // remove alt formes
        if (species === 0) continue;
        if (gen === 0) {
            while (species > GEN_MAX[gen]) ++gen; // Search for correct gen for first poke
        } else if (!(GEN_MAX[gen-1] < species && species <= GEN_MAX[gen])) {
            normalbot.sendMessage(src, sys.pokemon(pokenum) + " is not from gen " + gen);
            return true;
        }
    }
});


tier_checker.add_new_check(INCLUDING, ["Monocolour"], function monoColourCheck(src) {
    var colours = {
        'Red': ['Charmander', 'Charmeleon', 'Charizard', 'Vileplume', 'Paras', 'Parasect', 'Krabby', 'Kingler', 'Voltorb', 'Electrode', 'Goldeen', 'Seaking', 'Jynx', 'Magikarp', 'Magmar', 'Flareon', 'Ledyba', 'Ledian', 'Ariados', 'Yanma', 'Scizor', 'Slugma', 'Magcargo', 'Octillery', 'Delibird', 'Porygon2', 'Magby', 'Ho-Oh', 'Torchic', 'Combusken', 'Blaziken', 'Wurmple', 'Medicham', 'Carvanha', 'Camerupt', 'Solrock', 'Corphish', 'Crawdaunt', 'Latias', 'Groudon', 'Deoxys', 'Deoxys-A', 'Deoxys-D', 'Deoxys-S', 'Kricketot', 'Kricketune', 'Magmortar', 'Porygon-Z', 'Rotom', 'Rotom-H', 'Rotom-F', 'Rotom-W', 'Rotom-C', 'Rotom-S', 'Tepig', 'Pignite', 'Emboar', 'Pansear', 'Simisear', 'Throh', 'Venipede', 'Scolipede', 'Krookodile', 'Darumaka', 'Darmanitan', 'Dwebble', 'Crustle', 'Scrafty', 'Shelmet', 'Accelgor', 'Druddigon', 'Pawniard', 'Bisharp', 'Braviary', 'Heatmor'],
        'Blue': ['Squirtle', 'Wartortle', 'Blastoise', 'Nidoran?', 'Nidorina', 'Nidoqueen', 'Oddish', 'Gloom', 'Golduck', 'Poliwag', 'Poliwhirl', 'Poliwrath', 'Tentacool', 'Tentacruel', 'Tangela', 'Horsea', 'Seadra', 'Gyarados', 'Lapras', 'Vaporeon', 'Omanyte', 'Omastar', 'Articuno', 'Dratini', 'Dragonair', 'Totodile', 'Croconaw', 'Feraligatr', 'Chinchou', 'Lanturn', 'Marill', 'Azumarill', 'Jumpluff', 'Wooper', 'Quagsire', 'Wobbuffet', 'Heracross', 'Kingdra', 'Phanpy', 'Suicune', 'Mudkip', 'Marshtomp', 'Swampert', 'Taillow', 'Swellow', 'Surskit', 'Masquerain', 'Loudred', 'Exploud', 'Azurill', 'Meditite', 'Sharpedo', 'Wailmer', 'Wailord', 'Swablu', 'Altaria', 'Whiscash', 'Chimecho', 'Wynaut', 'Spheal', 'Sealeo', 'Walrein', 'Clamperl', 'Huntail', 'Bagon', 'Salamence', 'Beldum', 'Metang', 'Metagross', 'Regice', 'Latios', 'Kyogre', 'Piplup', 'Prinplup', 'Empoleon', 'Shinx', 'Luxio', 'Luxray', 'Cranidos', 'Rampardos', 'Gible', 'Gabite', 'Garchomp', 'Riolu', 'Lucario', 'Croagunk', 'Toxicroak', 'Finneon', 'Lumineon', 'Mantyke', 'Tangrowth', 'Glaceon', 'Azelf', 'Phione', 'Manaphy', 'Oshawott', 'Dewott', 'Samurott', 'Panpour', 'Simipour', 'Roggenrola', 'Boldore', 'Gigalith', 'Woobat', 'Swoobat', 'Tympole', 'Palpitoad', 'Seismitoad', 'Sawk', 'Tirtouga', 'Carracosta', 'Ducklett', 'Karrablast', 'Eelektrik', 'Eelektross', 'Elgyem', 'Cryogonal', 'Deino', 'Zweilous', 'Hydreigon', 'Cobalion', 'Thundurus'],
        'Green': ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Caterpie', 'Metapod', 'Bellsprout', 'Weepinbell', 'Victreebel', 'Scyther', 'Chikorita', 'Bayleef', 'Meganium', 'Spinarak', 'Natu', 'Xatu', 'Bellossom', 'Politoed', 'Skiploom', 'Larvitar', 'Tyranitar', 'Celebi', 'Treecko', 'Grovyle', 'Sceptile', 'Dustox', 'Lotad', 'Lombre', 'Ludicolo', 'Breloom', 'Electrike', 'Roselia', 'Gulpin', 'Vibrava', 'Flygon', 'Cacnea', 'Cacturne', 'Cradily', 'Kecleon', 'Tropius', 'Rayquaza', 'Turtwig', 'Grotle', 'Torterra', 'Budew', 'Roserade', 'Bronzor', 'Bronzong', 'Carnivine', 'Yanmega', 'Leafeon', 'Shaymin', 'Shaymin-S', 'Snivy', 'Servine', 'Serperior', 'Pansage', 'Simisage', 'Swadloon', 'Cottonee', 'Whimsicott', 'Petilil', 'Lilligant', 'Basculin', 'Maractus', 'Trubbish', 'Garbodor', 'Solosis', 'Duosion', 'Reuniclus', 'Axew', 'Fraxure', 'Golett', 'Golurk', 'Virizion', 'Tornadus'],
        'Yellow': ['Kakuna', 'Beedrill', 'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Ninetales', 'Meowth', 'Persian', 'Psyduck', 'Ponyta', 'Rapidash', 'Drowzee', 'Hypno', 'Exeggutor', 'Electabuzz', 'Jolteon', 'Zapdos', 'Moltres', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Pichu', 'Ampharos', 'Sunkern', 'Sunflora', 'Girafarig', 'Dunsparce', 'Shuckle', 'Elekid', 'Raikou', 'Beautifly', 'Pelipper', 'Ninjask', 'Makuhita', 'Manectric', 'Plusle', 'Minun', 'Numel', 'Lunatone', 'Jirachi', 'Mothim', 'Combee', 'Vespiquen', 'Chingling', 'Electivire', 'Uxie', 'Cresselia', 'Victini', 'Sewaddle', 'Leavanny', 'Scraggy', 'Cofagrigus', 'Archen', 'Archeops', 'Deerling', 'Joltik', 'Galvantula', 'Haxorus', 'Mienfoo', 'Keldeo'],
        'Purple': ['Rattata', 'Ekans', 'Arbok', 'Nidoran?', 'Nidorino', 'Nidoking', 'Zubat', 'Golbat', 'Venonat', 'Venomoth', 'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Koffing', 'Weezing', 'Starmie', 'Ditto', 'Aerodactyl', 'Mewtwo', 'Crobat', 'Aipom', 'Espeon', 'Misdreavus', 'Forretress', 'Gligar', 'Granbull', 'Mantine', 'Tyrogue', 'Cascoon', 'Delcatty', 'Sableye', 'Illumise', 'Swalot', 'Grumpig', 'Lileep', 'Shellos', 'Gastrodon', 'Ambipom', 'Drifloon', 'Drifblim', 'Mismagius', 'Stunky', 'Skuntank', 'Spiritomb', 'Skorupi', 'Drapion', 'Gliscor', 'Palkia', 'Purrloin', 'Liepard', 'Gothita', 'Gothorita', 'Gothitelle', 'Mienshao', 'Genesect'],
'Pink': ['Clefairy', 'Clefable', 'Jigglypuff', 'Wigglytuff', 'Slowpoke', 'Slowbro', 'Exeggcute', 'Lickitung', 'Chansey', 'Mr. Mime', 'Porygon', 'Mew', 'Cleffa', 'Igglybuff', 'Flaaffy', 'Hoppip', 'Slowking', 'Snubbull', 'Corsola', 'Smoochum', 'Miltank', 'Blissey', 'Whismur', 'Skitty', 'Milotic', 'Gorebyss', 'Luvdisc', 'Cherubi', 'Cherrim', 'Mime Jr.', 'Happiny', 'Lickilicky', 'Mesprit', 'Munna', 'Musharna', 'Audino', 'Alomomola'],
        'Brown': ['Weedle', 'Pidgey', 'Pidgeotto', 'Pidgeot', 'Raticate', 'Spearow', 'Fearow', 'Vulpix', 'Diglett', 'Dugtrio', 'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Abra', 'Kadabra', 'Alakazam', 'Geodude', 'Graveler', 'Golem', 'Farfetch\'d', 'Doduo', 'Dodrio', 'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan', 'Kangaskhan', 'Staryu', 'Pinsir', 'Tauros', 'Eevee', 'Kabuto', 'Kabutops', 'Dragonite', 'Sentret', 'Furret', 'Hoothoot', 'Noctowl', 'Sudowoodo', 'Teddiursa', 'Ursaring', 'Swinub', 'Piloswine', 'Stantler', 'Hitmontop', 'Entei', 'Zigzagoon', 'Seedot', 'Nuzleaf', 'Shiftry', 'Shroomish', 'Slakoth', 'Slaking', 'Shedinja', 'Hariyama', 'Torkoal', 'Spinda', 'Trapinch', 'Baltoy', 'Feebas', 'Regirock', 'Chimchar', 'Monferno', 'Infernape', 'Starly', 'Staravia', 'Staraptor', 'Bidoof', 'Bibarel', 'Buizel', 'Floatzel', 'Buneary', 'Lopunny', 'Bonsly', 'Hippopotas', 'Hippowdon', 'Mamoswine', 'Heatran', 'Patrat', 'Watchog', 'Lillipup', 'Conkeldurr', 'Sandile', 'Krokorok', 'Sawsbuck', 'Beheeyem', 'Stunfisk', 'Bouffalant', 'Vullaby', 'Mandibuzz', 'Landorus'],
         'Black': ['Snorlax', 'Umbreon', 'Murkrow', 'Unown', 'Sneasel', 'Houndour', 'Houndoom', 'Mawile', 'Spoink', 'Seviper', 'Claydol', 'Shuppet', 'Banette', 'Duskull', 'Dusclops', 'Honchkrow', 'Chatot', 'Munchlax', 'Weavile', 'Dusknoir', 'Giratina', 'Darkrai', 'Blitzle', 'Zebstrika', 'Sigilyph', 'Yamask', 'Chandelure', 'Zekrom'],
        'Gray': ['Machop', 'Machoke', 'Machamp', 'Magnemite', 'Magneton', 'Onix', 'Rhyhorn', 'Rhydon', 'Pineco', 'Steelix', 'Qwilfish', 'Remoraid', 'Skarmory', 'Donphan', 'Pupitar', 'Poochyena', 'Mightyena', 'Nincada', 'Nosepass', 'Aron', 'Lairon', 'Aggron', 'Volbeat', 'Barboach', 'Anorith', 'Armaldo', 'Snorunt', 'Glalie', 'Relicanth', 'Registeel', 'Shieldon', 'Bastiodon', 'Burmy', 'Wormadam', 'Wormadam-G', 'Wormadam-S', 'Glameow', 'Purugly', 'Magnezone', 'Rhyperior', 'Probopass', 'Arceus', 'Herdier', 'Stoutland', 'Pidove', 'Tranquill', 'Unfezant', 'Drilbur', 'Excadrill', 'Timburr', 'Gurdurr', 'Whirlipede', 'Zorua', 'Zoroark', 'Minccino', 'Cinccino', 'Escavalier', 'Ferroseed', 'Ferrothorn', 'Klink', 'Klang', 'Klinklang', 'Durant', 'Terrakion', 'Kyurem'],
        'White': ['Butterfree', 'Seel', 'Dewgong', 'Togepi', 'Togetic', 'Mareep', 'Smeargle', 'Lugia', 'Linoone', 'Silcoon', 'Wingull', 'Ralts', 'Kirlia', 'Gardevoir', 'Vigoroth', 'Zangoose', 'Castform', 'Absol', 'Shelgon', 'Pachirisu', 'Snover', 'Abomasnow', 'Togekiss', 'Gallade', 'Froslass', 'Dialga', 'Regigigas', 'Swanna', 'Vanillite', 'Vanillish', 'Vanilluxe', 'Emolga', 'Foongus', 'Amoonguss', 'Frillish', 'Jellicent', 'Tynamo', 'Litwick', 'Lampent', 'Cubchoo', 'Beartic', 'Rufflet', 'Larvesta', 'Volcarona', 'Reshiram', 'Meloetta', 'Meloetta-S']
    };
    var poke = sys.pokemon(sys.teamPoke(src, 0));
    var thecolour = '';
    for (var colour in colours) {
        if (colours[colour].indexOf(poke) > -1) {
            thecolour = colour;
        }
    }
    if (thecolour === '') {
        normalbot.sendMessage(src, "Bug! " + poke + " has not a colour in checkMonocolour :(");
        return true;
    }
    for (var i = 1; i < 6; ++i) {
        poke = sys.pokemon(sys.teamPoke(src, i));
        if (colours[thecolour].indexOf(poke) == -1 && poke != "Missingno") {
            normalbot.sendMessage(src, "" + poke + " has not the colour: " + thecolour);
            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Smogon OU", "Wifi OU", "DW OU"], function swiftSwimCheck(src) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Drizzle"){
            for(var j = 0; j <6; ++j){
                if(sys.ability(sys.teamPokeAbility(src, j)) == "Swift Swim"){
                    normalbot.sendMessage(src, "You cannot have the combination of Swift Swim and Drizzle in OU");
                    return true;
                }
            }
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Smogon UU"], function droughtCheck(src) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Drought"){
            normalbot.sendMessage(src, "Drought is not allowed in Smogon UU");
            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Wifi UU", "Wifi LU", "Wifi NU"], function snowWarningCheck(src) {
    for(var i = 0; i <6; ++i){
        if(sys.ability(sys.teamPokeAbility(src, i)) == "Snow Warning"){
            normalbot.sendMessage(src, "Snow Warning is not allowed in " + tier + ".");
            return true;
        }
    }
});

tier_checker.add_new_check(INCLUDING, ["Shanai Cup", "Shanai Cup 1.5", "Shanai Cup STAT", "Original Shanai Cup TEST"], function shanaiAbilityCheck(src) {
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
    var valid = true;
    for (var i = 0; i < 6; ++i) {
        var ability = sys.ability(sys.teamPokeAbility(src, i));
        var lability = ability.toLowerCase();
        var poke = sys.pokemon(sys.teamPoke(src, i));
        var lpoke = poke.toLowerCase();
        if (lpoke in bannedAbilities && bannedAbilities[lpoke].indexOf(lability) != -1) {
            checkbot.sendMessage(src, "" + poke + " is not allowed to have ability " + ability + " in this tier. Please change it in Teambuilder (You are now in Challenge Cup).");
            valid = false;
        }
    }
    return !valid;
});


tier_checker.add_new_check(INCLUDING, ["Adv 200"], function advance200Check(src) {
    var poke;
    if (typeof advance200Banlist === 'undefined') {
        var pokes = {
        "Sceptile": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Thunderpunch", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Counter", "Seismic Toss", "Mimic", "Substitute"],
        "Torchic": ["Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide"],
        "Combusken": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Blaziken": ["Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Swift", "Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Substitute", "Rock Slide", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Mudkip": ["Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Defense Curl"],
        "Marshtomp": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl"],
        "Swampert": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl"],
        "Poochyena": ["Psych Up", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Body Slam", "Double-edge", "Counter", "Mimic", "Substitute"],
        "Mightyena": ["Psych Up", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Body Slam", "Double-edge", "Counter", "Mimic", "Substitute"],
        "Zigzagoon": ["Body Slam", "Double-edge", "Mimic", "Thunder Wave", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Linoone": ["Body Slam", "Double-edge", "Mimic", "Thunder Wave", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Wurmple":[],
        "Silcoon":[],
        "Cascoon":[],
        "Beautifly": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Dustox": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Lotad": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk"],

        "Lombre": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Dynamicpunch", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Ludicolo": ["Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Seedot": ["Swords Dance", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl"],
        "Nuzleaf": ["Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Shiftry": ["Swords Dance", "Mega Kick", "Body Slam", "Double-Edge", "Mimic", "Substitute", "Rollout", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Fury Cutter"],
        "Taillow": ["Double-edge", "Counter", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Swellow": ["Double-edge", "Counter", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Wingull": ["Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Pelipper": ["Double-Edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Ralts": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Kirlia": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Gardevoir": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Surskit": ["Double-edge", "Mimic", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Masquerain": ["Double-edge", "Mimic", "Substitute", "Psych Up", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Swift"],
        "Shroomish": ["Swords Dance", "Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Sleep Talk"],
        "Breloom": ["Mega Punch", "Swords Dance", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Sleep Talk", "Thunderpunch", "Fury Cutter"],
        "Slakoth": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Vigoroth": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Slaking": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Abra": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Kadabra": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Alakazam": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Thunder Wave", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Endure", "Swagger", "Sleep Talk", "Barrier"],
        "Nincada": ["Double-edge", "Mimic", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Ninjask": ["Double-edge", "Mimic", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Shedinja": ["Double-edge", "Mimic", "Dream Eater", "Substitute", "Snore", "Mud-slap", "Swagger", "Sleep Talk", "Fury Cutter"],
        "Whismur": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Loudred": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Exploud": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Psych Up", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Makuhita": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Hariyama": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch"],
        "Goldeen": ["Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Swift", "Psybeam", "Haze"],
        "Seaking": ["Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Swift", "Psybeam", "Haze"],
        "Magikarp": [],
        "Gyarados": ["Body Slam", "Double-Edge", "Mimic", "Thunder Wave", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk"],
        "Azurill": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl"],
        "Marill": ["Mega Punch", "Mega Kick", "Body Slam", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Present", "Belly Drum", "Perish Song"],
        "Azumarill": ["Mega Punch", "Mega Kick", "Body Slam", "Seismic Toss", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Present", "Belly Drum", "Perish Song"],
        "Geodude": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Mega Punch"],
        "Graveler": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Mega Punch"],
        "Golem": ["Body Slam", "Counter", "Seismic Toss", "Mimic", "Metronome", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Fire Punch", "Fury Cutter", "Mega Punch"],
        "Nosepass": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch"],
        "Skitty": ["Body Slam", "Mimic", "Dream Eater", "Thunder Wave", "Rollout", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Wish"],
        "Delcatty": ["Body Slam", "Mimic", "Dream Eater", "Thunder Wave", "Rollout", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Defense Curl", "Wish"],
        "Zubat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Golbat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Crobat": ["Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Swagger", "Sleep Talk", "Swift", "Faint Attack", "Whirlwind", "Curse"],
        "Tentacool": ["Swords Dance", "Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Aurora Beam", "Rapid Spin", "Haze"],
        "Tentacruel": ["Swords Dance", "Double-edge", "Mimic", "Substitute", "Snore", "Icy Wind", "Endure", "Swagger", "Sleep Talk", "Aurora Beam", "Rapid Spin", "Haze"],
        "Sableye": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Substitute", "Dynamicpunch", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Mawile": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Rock Slide", "Substitute", "Dynamicpunch", "Psych Up", "Snore", "Icy Wind", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch"],
        "Aron": ["Mimic", "Rock Slide", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl", "Fury Cutter"],
        "Lairon": ["Mimic", "Rock Slide", "Substitute", "Rollout", "Snore", "Endure", "Swagger", "Sleep Talk", "Defense Curl", "Fury Cutter"],
        "Aggron": ["Mega Punch", "Mega Kick", "Counter", "Seismic Toss", "Mimic", "Thunder Wave", "Rock Slide", "Substitute", "Dynamicpunch", "Rollout", "Snore", "Icy Wind", "Endure", "Ice Punch", "Swagger", "Sleep Talk", "Defense Curl", "Thunderpunch", "Fire Punch", "Fury Cutter"],
        "Machop": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Machoke": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Machamp": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Mimic", "Metronome", "Substitute", "Snore", "Endure", "Mud-slap", "Ice Punch", "Swagger", "Sleep Talk", "Thunderpunch", "Fire Punch", "Rolling Kick"],
        "Meditite": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Medicham": ["Mega Punch", "Mega Kick", "Body Slam", "Double-edge", "Counter", "Seismic Toss", "Mimic", "Metronome", "Dream Eater", "Rock Slide", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift"],
        "Electrike": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk"],
        "Manectric": ["Body Slam", "Double-edge", "Mimic", "Substitute", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk"],
        "Plusle": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Minun": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Magnemite": ["Double-Edge", "Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Magneton": ["Double-Edge", "Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Voltorb": ["Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Electrode": ["Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Volbeat": ["Body Slam", "Counter", "DynamicPunch", "Endure", "Ice Punch", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Illumise": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Ice Punch", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Oddish": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Gloom": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Vileplume": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Substitute", "Swagger", "Swords Dance"],
        "Bellossom": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Doduo": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Faint Attack", "Flail"],
        "Dodrio": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Faint Attack", "Flail"],
        "Roselia": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Swords Dance"],
        "Gulpin": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch", "Pain Split"],
        "Swalot": ["Counter", "Defense Curl", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch", "Pain Split"],
        "Carvanha": ["Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Sharpedo": ["Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Wailmer": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Wailord": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Numel": ["Body Slam", "Defense Curl", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Camerupt": ["Body Slam", "Defense Curl", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Slugma": ["Defense Curl", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Heat Wave"],
        "Magcargo": ["Defense Curl", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Heat Wave"],
        "Torkoal": ["Double-Edge", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Grimer": ["Body Slam", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch"],
        "Muk": ["Body Slam", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "ThunderPunch"],
        "Koffing": ["Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Psybeam", "Pain Split"],
        "Weezing": ["Endure", "Mimic", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Psybeam", "Pain Split"],
        "Spoink": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Swagger", "Swift"],
        "Grumpig": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Swagger", "Swift", "Thunderpunch"],
        "Sandshrew": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Sandslash": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Skarmory": ["Counter", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Whirlwind", "Curse"],
        "Spinda": ["Body Slam", "Counter", "Defense Curl", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Wish"],
        "Trapinch": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Vibrava": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Flygon": ["Body Slam", "Double-Edge", "Earth Power", "Endure", "Fire Punch", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Cacnea": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swords Dance", "ThunderPunch"],
        "Cacturne": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Low Kick", "Magic Coat", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swords Dance", "ThunderPunch"],
        "Swablu": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Altaria": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Zangoose": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Fire Punch", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Swords Dance", "Thunder Wave", "ThunderPunch"],
        "Seviper": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swift"],
        "Lunatone": ["Body Slam", "Defense Curl", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Solrock": ["Body Slam", "Defense Curl", "Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Barboach": ["Double-Edge", "Endure", "icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Substitute", "Swagger"],
        "Whiscash": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Substitute", "Swagger"],
        "Corphish": ["Body Slam", "Counter", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Crawdaunt": ["Body Slam", "Counter", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Baltoy": ["Double-Edge", "Dream Eater", "Endure", "Explosion", "Mimic", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Claydol": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Lileep": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Cradily": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Anorith": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Rapid Spin"],
        "Armaldo": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Rapid Spin"],
        "Igglybuff": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "Perish Song", "Present", "Wish"],
        "Jigglypuff": ["Body Slam", "Counter", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch", "Perish Song", "Present", "Wish"],
        "Wigglytuff": ["Body Slam", "Counter", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch", "Perish Song", "Present", "Wish"],
        "Feebas": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Milotic": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Castform": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave"],
        "Staryu": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Starmie": ["Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Kecleon": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Fire Punch", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Swagger", "Swift", "Thunder Wave", "ThunderPunch"],
        "Shuppet": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Banette": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave"],
        "Duskull": ["Body Slam", "Double-Edge", "Dream Eater", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Pain Split"],
        "Dusclops": ["Body Slam", "Counter", "Double-Edge", "Dream Eater", "DynamicPunch", "Endure", "Fire Punch", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Metronome", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunderpunch", "Pain Split"],
        "Tropius": ["Double-Edge", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Chimecho": ["Defense Curl", "Endure", "Icy Wind", "Mimic", "Psych Up", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Absol": ["Body Slam", "Counter", "Dream Eater", "Double-Edge", "Endure", "Fury Cutter", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Swagger", "Swift", "Thunder Wave"],
        "Vulpix": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Spite"],
        "Ninetales": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Spite"],
        "Pichu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "Present", "Wish"],
        "Pikachu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Present", "Wish"],
        "Raichu": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "ThunderPunch", "Present", "Wish"],
        "Psyduck": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Golduck": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "Fury Cutter", "Ice Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Natu": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave", "Faint Attack", "Featherdance"],
        "Xatu": ["Double-Edge", "Dream Eater", "Endure", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift", "Thunder Wave"],
        "Girafarig": ["Body Slam", "Double-edge", "Mimic", "Dream Eater", "Thunder Wave", "Substitute", "Psych Up", "Snore", "Endure", "Mud-slap", "Swagger", "Sleep Talk", "Swift", "Beat Up", "Wish"],
        "Phanpy": ["Body Slam", "Counter", "Double-Edge", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Donphan": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Pinsir": ["Body Slam", "Double-Edge", "Endure", "Fury Cutter", "Mimic", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Flail"],
        "Heracross": ["Body Slam", "Counter", "Double-Edge", "Fury Cutter", "Mimic", "Rock Slide", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "Bide", "Flail"],
        "Rhyhorn": ["Body Slam", "Counter", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance"],
        "Rhydon": ["Body Slam", "Counter", "Double-Edge", "DynamicPunch", "Endure", "fire Punch", "Icy Wind", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swords Dance", "ThunderPunch"],
        "Snorunt": ["Body Slam", "Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Glalie": ["Body Slam", "Double-Edge", "Explosion", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Spheal": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute", "Swagger"],
        "Sealeo": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute"],
        "Walrein": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Substitute"],
        "Clamperl": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Huntail": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Gorebyss": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Relicanth": ["Body Slam", "Endure", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Corsola": ["Body Slam", "Defense Curl", "Double-Edge", "Endure", "Explosion", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Icicle Spear"],
        "Chinchou": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Lanturn": ["Double-Edge", "Endure", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Luvdisc": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Psych Up", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Horsea": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Seadra": ["Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Kingdra": ["Body Slam", "Double-Edge", "Endure", "Icy Wind", "Mimic", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Bagon": ["Body Slam", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Shelgon": ["Body Slam", "Defense Curl", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger"],
        "Salamence": ["Body Slam", "Defense Curl", "Endure", "Fury Cutter", "Mimic", "Mud-Slap", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swagger", "Swift"],
        "Beldum": [],
        "Metang": ["Body Slam", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fury Cutter", "Ice Punch", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swift", "Thunderpunch"],
        "Metagross": ["Body Slam", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fury Cutter", "Ice Punch", "Icy Wind", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Sleep Talk", "Snore", "Substitute", "Swift", "Thunderpunch"],
        "Regirock": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Fire Punch", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"],
        "Regice": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"],
        "Registeel": ["Body Slam", "Counter", "Defense Curl", "Double-Edge", "DynamicPunch", "Endure", "Explosion", "Ice Punch", "Mega Kick", "Mega Punch", "Mimic", "Mud-Slap", "Psych Up", "Rock Slide", "Rollout", "Seismic Toss", "Sleep Talk", "Snore", "Substitute", "Swagger", "Thunder Wave", "ThunderPunch"]
        };
        advance200Banlist = {};
        for (poke in pokes) {
            var pokeNum = sys.pokeNum(poke);
            if (!pokeNum) {
                sys.sendAll("Script Error: pokemon " + poke + " is unknown in 200 banlist", staffchannel);
                continue;
            }
            advance200Banlist[pokeNum] = [];
            for (var k = 0; k < pokes[poke].length; ++k) {
                var moveNum = sys.moveNum(pokes[poke][k]);
                if (!moveNum) {

                    sys.sendAll("Script Error: move " + pokes[poke][k] + " for pokemon " + poke + " is unknown in 200 banlist", staffchannel);
                    continue;
                }
                advance200Banlist[pokeNum].push(moveNum);
            }
        }

    } // end of building the banlist
    var valid = true;
    var debug = function(msg) { if (false && sys.name(src) == "zeroality") { sys.sendAll(msg, staffchannel); }};
    for (var i = 0; i < 6; ++i) {
        poke = sys.teamPoke(src, i);
        debug("" + i + ". poke #" + poke + ": " + sys.pokemon(poke));
        if (poke !== 0 && !advance200Banlist.hasOwnProperty(poke)) {
            sys.sendAll("Script Error: pokemon " + sys.pokemon(poke) + " should be banned in advance 200 in tiers.xml", staffchannel);
            checkbot.sendMessage(src, "Pokemon " + sys.pokemon(poke) + " is not allowed in advance 200!");
            valid = false;
            continue;
        }
        if (poke === 0) continue;
        debug("Banned moves for it:" + advance200Banlist[poke].join(", "));
        for (var j = 0; j < 4; ++j) {
            var move = sys.teamPokeMove(src, i, j);
            debug("" + j + ". move #" + move + ": " + sys.move(move));
            debug("is allowed: " + (advance200Banlist[poke].indexOf(move) >= 0 ? "no" : "yes"));
            if (advance200Banlist[poke].indexOf(move) >= 0) {
                checkbot.sendMessage(src, "Pokemon " + sys.pokemon(poke) + " is not allowed to have move " + sys.move(move) + " in advance 200!");
                valid = false;
            }
        }
    }
    return !valid;
});

module = tier_checker;
