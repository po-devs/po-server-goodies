var heightList, weightList, powerList, zPowerList, accList, ppList, categoryList, moveEffList, zEffList, moveFlagList, abilityList, itemList, berryList, flingPowerList, berryPowerList, berryTypeList, allMovesList, allGenMovesList;
var pokedex = {};

pokedex.hasDreamWorldAbility = function (pokemon, ability) {
    return sys.pokeAbility(pokemon, 2) === ability && sys.pokeAbility(pokemon, 0) !== sys.pokeAbility(pokemon, 2) && sys.pokeAbility(pokemon, 1) !== sys.pokeAbility(pokemon, 2);
};

pokedex.getAllMoves = function (pokeId) {
    if (allMovesList === undefined) {
        allMovesList = {};
        var data = sys.getFileContent(pokeDir + '7G/all_moves.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var allMoves = data[i].substr(index + 1).split(" ");
            allMovesList[key] = allMoves;
        }
    }
    return allMovesList[pokedex.getDBIndex(pokeId)];
};

pokedex.getAllGenMoves = function (pokeId) {
    if (!allGenMovesList) {
        allGenMovesList = {};
        var data = sys.getFileContent(Config.dataDir + 'all_gen_moves.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var allGenMoves = data[i].substr(index + 1).split(" ");
            allGenMovesList[key] = allGenMoves;
        }
    }
    return allGenMovesList[pokedex.getDBIndex(pokeId)];
};

pokedex.natures = [["Hardy", "Lonely", "Adamant", "Naughty", "Brave"],
    ["Bold", "Docile", "Impish", "Lax", "Relaxed"],
    ["Modest", "Mild", "Bashful", "Rash", "Quiet"],
    ["Calm", "Gentle", "Careful", "Quirky", "Sassy"],
    ["Timid", "Hasty", "Jolly", "Naive", "Serious"]];

pokedex.getNatureEffect = function (nature) {
    nature = nature.toLowerCase();
    for (var x = 0; x < 5; x++) {
        for (var y = 0; y < 5; y++) {
            if (pokedex.natures[x][y].toLowerCase() === nature) {
                return [x, y];
            }
        }
    }
    return false;
};

pokedex.dwCheck = function (pokemon) {
    return sys.pokeAbility(pokemon, 2, 5) !== 0 || sys.pokeAbility(pokemon, 1, 5) !== 0;
};

pokedex.calcStat = function (base, IV, EV, level, nature) {
    var stat = Math.floor(Math.floor((IV + (2 * base) + Math.floor(EV / 4)) * level / 100 + 5) * nature);
    return stat;
};

pokedex.calcHP = function (base, IV, EV, level) {
    if (base === 1) {
        return 1;
    }
    var HP = Math.floor((IV + (2 * base) + Math.floor(EV / 4) + 100) * level / 100 + 10);
    return HP;
};

pokedex.getDBIndex = function (pokeId) {
    var id = pokeId % 65536;
    var forme = (pokeId - id) / 65536;
    return id + ":" + forme;
};

pokedex.getWeight = function (pokeId) {
    if (weightList === undefined) {
        weightList = {};
        var data = sys.getFileContent(pokeDir + 'weight.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var id = data[i].substr(0, index);
            var weight = data[i].substr(index + 1);
            weightList[id] = weight;
        }
    }
    var key = pokedex.getDBIndex(pokeId);
    if (weightList[key] !== undefined) {
        return weightList[key];
    }
    var index = key.indexOf(":") + 1;
    var base = key.substr(0, index);
    return weightList[base + "0"];
};

pokedex.getHeight = function (pokeId) {
    if (heightList === undefined) {
        heightList = {};
        var data = sys.getFileContent(pokeDir + 'height.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var id = data[i].substr(0, index);
            var height = data[i].substr(index + 1);
            heightList[id] = height;
        }
    }
    var key = pokedex.getDBIndex(pokeId);
    if (heightList[key] !== undefined) {
        return heightList[key];
    }
    var index = key.indexOf(":") + 1;
    var base = key.substr(0, index);
    return heightList[base + "0"];
};

pokedex.weightPower = function (weight) {
    var power = 0;
    if (weight < 10) power = 20;
    if (weight >= 10 && weight < 25) power = 40;
    if (weight >= 25 && weight < 50) power = 60;
    if (weight >= 50 && weight < 100) power = 80;
    if (weight >= 100 && weight < 200) power = 100;
    if (weight >= 200) power = 120;
    return power;
};

pokedex.getMoveBP = function (moveId) {
    if (powerList === undefined) {
        powerList = {};
        var data = sys.getFileContent(moveDir + 'power.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            powerList[key] = power;
        }
    }
    if (powerList[moveId] === undefined || powerList[moveId] === "1") {
        return "---";
    }
    return powerList[moveId];
};

pokedex.getZBP = function (moveId) {
    if (zPowerList === undefined) {
        zPowerList = {};
        var data = sys.getFileContent(moveDir + "zpower.txt").split("\n");
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            zPowerList[key] = power;
        }
    }
    
    return zPowerList[moveId] || false;
};

pokedex.getMoveCategory = function (moveId) {
    if (categoryList === undefined) {
        categoryList = {};
        var data = sys.getFileContent(moveDir + 'damage_class.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var category = data[i].substr(index + 1);
            categoryList[key] = category;
        }
    }
    if (categoryList[moveId] === "1") {
        return "Physical";
    }
    if (categoryList[moveId] === "2") {
        return "Special";
    }
    return "Other";
};

pokedex.getMoveAccuracy = function (moveId) {
    if (accList === undefined) {
        accList = {};
        var data = sys.getFileContent(moveDir + 'accuracy.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var accuracy = data[i].substr(index + 1);
            accList[key] = accuracy;
        }
    }
    if (accList[moveId] === "101") {
        return "---";
    }
    return accList[moveId];
};

pokedex.getMovePP = function (moveId) {
    if (ppList === undefined) {
        ppList = {};
        var data = sys.getFileContent(moveDir + 'pp.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var pp = data[i].substr(index + 1);
            ppList[key] = pp;
        }
    }
    return ppList[moveId];
};

pokedex.getMoveEffect = function (moveId) {
    if (moveEffList === undefined) {
        moveEffList = {};
        var data = sys.getFileContent(moveDir + 'effect.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var effect = data[i].substr(index + 1);
            moveEffList[key] = effect;
        }
    }
    if (moveEffList[moveId] === undefined) {
        return "Deals normal damage.";
    }
    return moveEffList[moveId].replace(/[\[\]{}]/g, "");
};

pokedex.getZEffect = function (moveId) {
    if (zEffList === undefined) {
        zEffList = {};
        var data = sys.getFileContent(moveDir + "zeffect.txt").split("\n");
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var effect = data[i].substr(index + 1);
            zEffList[key] = effect;
        }
    }
    
    return zEffList[moveId] || false;
};

pokedex.getMoveContact = function (moveId) {
    if (moveFlagList === undefined) {
        moveFlagList = {};
        var data = sys.getFileContent(moveDir + 'flags.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var flags = data[i].substr(index + 1);
            moveFlagList[key] = flags;
        }
    }
    return moveFlagList[moveId] % 2 === 1;
};

pokedex.getAbility = function (abilityId) {
    if (abilityList === undefined) {
        abilityList = {};
        var data = sys.getFileContent(abilityDir + 'ability_battledesc.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var ability = data[i].substr(index + 1);
            abilityList[key] = ability;
        }
    }
    return abilityList[abilityId];
};

pokedex.getItem = function (itemId) {
    if (itemList === undefined) {
        itemList = {};
        var data = sys.getFileContent(itemDir + 'items_description.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var item = data[i].substr(index + 1);
            itemList[key] = item;
        }
    }
    return itemList[itemId];
};

pokedex.getBerry = function (berryId) {
    if (berryList === undefined) {
        berryList = {};
        var data = sys.getFileContent(itemDir + 'berries_description.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var berry = data[i].substr(index + 1);
            berryList[key] = berry;
        }
    }
    return berryList[berryId];
};

pokedex.getFlingPower = function (itemId) {
    if (flingPowerList === undefined) {
        flingPowerList = {};
        var data = sys.getFileContent(itemDir + 'items_pow.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            flingPowerList[key] = power;
        }
    }
    return flingPowerList[itemId];
};

pokedex.getBerryPower = function (berryId) {
    if (berryPowerList === undefined) {
        berryPowerList = {};
        var data = sys.getFileContent(itemDir + 'berry_pow.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var power = data[i].substr(index + 1);
            berryPowerList[key] = power;
        }
    }
    return +berryPowerList[berryId] + 20;
};

pokedex.getBerryType = function (berryId) {
    if (berryTypeList === undefined) {
        berryTypeList = {};
        var data = sys.getFileContent(itemDir + 'berry_type.txt').split('\n');
        for (var i = 0; i < data.length; i++) {
            var index = data[i].indexOf(" ");
            var key = data[i].substr(0, index);
            var type = data[i].substr(index + 1);
            berryTypeList[key] = sys.type(type);
        }
    }
    return berryTypeList[berryId];
};

module.exports = pokedex;