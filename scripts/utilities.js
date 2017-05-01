/* utilities.js */
exports = {
    /*arrayShuffle: function (array) {
        var x, tempValue, randomIndex;
        for (x = 0; x < array.length; x++) {
            randomIndex = Math.floor(Math.random() * array.length);
            tempValue = array[x];
            array[x] = array[randomIndex];
            array[randomIndex] = tempValue;
        }
        return array;
    },*/
    
    arraySlice: function (array, max) {
        var x, newArray = [], limit;
        if (max > array.length) {
            limit = array.length;
        } else {
            limit = max;
        }
        for (x = 0; x < limit; x++) {
            newArray.push(array[x]);
        }
        return newArray;
    },
    
    python_split: function python_split(string, delim, limit) {
        var arr;
        if ((delim.__proto__ === RegExp || delim.__proto__ == "/(?:)/") && limit !== undefined) {
            // lastIndex doesn't update without global match
            var flags = "g" + (delim.ignoreCase ? "i" : "") + (delim.multiline ? "m" : "");
            var re = new RegExp(delim.source, flags);
            arr = [];
            var lastIndex = 0;
            while (--limit >= 0) {
                var match = re.exec(string);
                if (match !== null) {
                    arr.push(string.substring(lastIndex, match.index));
                    lastIndex = re.lastIndex;
                } else {
                    arr.push(string.substring(lastIndex));
                    break;
                }
            }
            if (limit < 0) {
                arr.push(string.substring(lastIndex));
            }
            return arr;
        }
        arr = string.split(delim);
        if (delim.length > limit) {
            var b = arr.slice(delim);
            arr.push(b.join(delim));
        }
        return arr;
    },
    
    isLetter : function(f) {
        var x = f.toLowerCase();
        return x >= 'a' && x <= 'z';
    },
    
    is_command: function is_command(string) {
        return (string[0] === "/" || string[0] == '!') && string.length > 1 && utilities.isLetter(string[1]);
    },
    
    as_command: function as_command(string, delim, limit) {
        var Command = {command: "", parameterString: ""};
        var pos = string.indexOf(" ");
        var startIndex = this.is_command(string) ? 1 : 0;
        if (pos !== -1) {
            Command.command = string.substring(startIndex, pos).toLowerCase();
            Command.parameterString = string.substr(pos + 1);
        } else {
            Command.command = string.substr(startIndex).toLowerCase();
        }
        if (delim !== undefined) {
            Command.parameters = this.python_split(Command.parameterString, delim, limit);
        }
        return Command;
    },

    find_poke: function find_poke(src, poke_id) {
        var poke_slot;
        /* first try if poke_id is slot number between 1-6 */
        if (/^[1-6]$/.test(poke_id)) {
            poke_slot = parseInt(poke_id, 10) - 1;
        } else {
            /* try to see if poke_id is species */
            var pokeNum = sys.pokeNum(poke_id);
            if (pokeNum !== undefined) {
                poke_slot = sys.indexOfTeamPoke(src, pokeNum);
            }
            /* fallback to nickname */
            if (poke_slot !== undefined) {
                for (var slot = 0; slot < 6; ++slot) {
                    if (sys.teamPokeNick(src, slot) === poke_id) {
                        poke_slot = slot;
                        break;
                    }
                }
            }
        }
        return poke_slot;
    },
    
    find_move: function find_move(src, poke_slot, move_id) {
        var move_slot;
        if (/^[1-4]$/.test(move_id)) {
           move_slot = parseInt(move_id, 10) - 1;
        } else {
            var moveNum = sys.moveNum(move_id);
            if (moveNum !== undefined) {
                move_slot = sys.indexOfTeamPokeMove(src, poke_slot, moveNum);
            }
        }
        return move_slot;
    },
    
    find_tier: function find_tier(tier_name) {
        tier_name = tier_name.toLowerCase();
        var tiers = sys.getTierList();
        for (var i = 0; i < tiers.length; ++i) {
            if (tiers[i].toLowerCase() == tier_name) {
                return tiers[i];
            }
        }
        return null;
    },
    
    is_non_negative: function is_non_negative(n) {
        return typeof n == 'number' && !isNaN(n) && n >= 0;
    },
    
    Lazy: function Lazy(func) {
        var done = false;
        return function() {
            if (done) {
                return this._value;
            } else {
                done = true;
                return this._value = func.apply(arguments.callee, arguments);
            }
        };
    },
    
    capitalize: function capitalize(string) {
        return string[0].toUpperCase() + string.slice(1);
    },
    
    non_flashing: function nonFlashing(name) {
        return name[0] + "\u200b" + name.substr(1);
    },
    
    get_or_create_channel: function getOrCreateChannel(name) {
        var cid;
        if (sys.existChannel(name)) {
            cid = sys.channelId(name);
        } else {
            cid = sys.createChannel(name);
        }
        return cid;
    },
    
    html_escape: function(text) {
        var m = String(text);
        if (m.length > 0) {
            var amp = "&am" + "p;";
            var lt = "&l" + "t;";
            var gt = "&g" + "t;";
            return m.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt);
        }else {
            return "";
        }
    },
    
    getSeconds : function(s) {
        var parts = s.split(" ");
        var secs = 0;
        for (var i = 0; i < parts.length; ++i) {
            var c = parts[i][parts[i].length - 1];
            if (c === undefined) {
                continue;
            }
            var mul = 60;
            switch (c.toLowerCase()) {
                case "s":
                    mul = 1;
                    break;
                case "m":
                    mul = 60;
                    break;
                case "h":
                    mul = 60 * 60;
                    break;
                case "d":
                    mul = 24 * 60 * 60;
                    break;
                case "w":
                    mul = 7 * 24 * 60 * 60;
                    break;
                default:
                    break;
            }
            secs += mul * parseInt(parts[i], 10);
        }
        return secs;
    },
    
    getTimeString : function(sec) {
        var s = [];
        var n;
        var d = [[7*24*60*60, "week"], [24*60*60, "day"], [60*60, "hour"], [60, "minute"], [1, "second"]];
        for (var j = 0; j < 5; ++j) {
            n = parseInt(sec / d[j][0], 10);
            if (n > 0) {
                s.push((n + " " + d[j][1] + (n > 1 ? "s" : "")));
                sec -= n * d[j][0];
                if (s.length >= 2) break;
            }
        }
        return s.join(", ");
    },
    
    //make sure the name isn't repeated with another case when using this
    getCorrectPropName : function (prop, obj) {
        if (typeof obj !== "object" || typeof prop !== "string") {
            return prop;
        }
        var props = Object.getOwnPropertyNames(obj);
        for (var x = 0; x < props.length; x++) {
            if (prop.toLowerCase() === props[x].toLowerCase()) {
                return props[x];
            }
        }
        return prop;
    },
    
    inputToPokemon : function (input) {
        input = input.toLowerCase();
        if (input.indexOf("alola") > -1) {
            input = input.replace(/(-|\s){0,2}alola(n)*(-|\s)*/i, ""); //Accounts for "Alola" and "Alolan" separated by a space or hyphen at the beginning or end
            return "Alolan " + input;
        }        
        switch (input) {
            case "deoxys-a": case "deoxys a": case "deoxys attack": 
                input = "Deoxys-Attack"; break;
            case "deoxys-d": case "deoxys d": case "deoxys defense": 
                input = "Deoxys-Defense"; break;
            case "deoxys-s": case "deoxys s": case "deoxys speed": 
                input = "Deoxys-Speed"; break;
            case "hoopa-b": case "hoopa b": case "hoopa unbound": case "hoopa u": case "hoopa-u" : 
                input = "Hoopa-Unbound"; break;
            case "darmanitan-d": case "darmanitan d": case "darmanitan z": case "darmanitan-z": case "darmanitan zen":  
                input = "Darmanitan-Zen"; break;
            case "rotom-w": case "rotom w": case "rotom wash": 
                input = "Rotom-Wash"; break;
            case "rotom-f": case "rotom f": case "rotom frost": 
                input = "Rotom-Frost"; break;
            case "rotom-c": case "rotom c": case "rotom mow": case "rotom-m": case "rotom m":
                input = "Rotom-Mow"; break;
            case "rotom-s": case "rotom s": case "rotom spin": case "rotom-spin": case "rotom fan": 
                input = "Rotom-Fan"; break;
            case "rotom-h": case "rotom h": case "rotom heat":
                input = "Rotom-Heat"; break;
            case "porygonz": case "porygon z":
                input = "Porygon-Z"; break;
            case "porygon-2": case "porygon 2":
                input = "Porygon2"; break;
            case "kyurem-b": case "kyurem b": case "kyurem black": 
                input = "Kyurem-Black"; break;
            case "kyurem-w": case "kyurem w": case "kyurem white": 
                input = "Kyurem-White"; break;
            case "basculin-a": case "basculin a": case "basculin blue striped":
                input = "Basculin-Blue Striped"; break;
            case "shaymin-s": case "shaymin s": case "shaymin sky": 
                input = "Shaymin-Sky"; break;
            case "giratina-o": case "giratina o": case "giratina origin": 
                input = "Giratina-Origin"; break;
            case "keldeo-r": case "keldeo r": case "keldeo resolute": 
                input = "Keldeo-Resolute"; break;
            case "meloetta-s": case "meloetta s": case "meloetta p": case "meloetta pirouette": 
                input = "Meloetta-Pirouette"; break;
            case "landorus-t": case "landorus t": case "landorus therian":
                input = "Landorus-Therian"; break;
            case "tornadus-t": case "tornadus t": case "tornadus therian":
                input = "Tornadus-Therian"; break;
            case "thundurus-t": case "thundurus t": case "thundurus therian":
                input = "Thundurus-Therian"; break;
            case "mr mime": case "mrmime": case "mr.mime":
                input = "Mr. Mime"; break;
            case "mime jr": case "mimejr": case "mimejr.":
                input = "Mime Jr."; break;
            case "aegislash b": case "aegislash-b": case "aegislash blade":
                input = "Aegislash-Blade"; break;
            case "pumpkaboo-s": case "pumpkaboo s": case "pumpkaboo small":
                input = "Pumpkaboo-Small"; break;
            case "pumpkaboo-l": case "pumpkaboo l": case "pumpkaboo large":
                input = "Pumpkaboo-Large"; break;
            case "pumpkaboo-xl": case "pumpkaboo xl": case "pumpkaboo super":
                input = "Pumpkaboo-Super"; break;
            case "gourgeist-s": case "gourgeist s": case "gourgeist small":
                input = "Gourgeist-Small"; break;
            case "gourgeist-l": case "gourgeist l": case "gourgeist large":
                input = "Gourgeist-Large"; break;
            case "gourgeist-xl": case "gourgeist xl": case "gourgeist super":
                input = "Gourgeist-Super"; break;
            case "burmy-g": case "burmy g": case "burmy sandy":
                input = "Burmy-Sandy"; break;
            case "burmy-s": case "burmy s": case "burmy trash":
                input = "Burmy-Trash"; break;
            case "wormadam-g": case "wormadam g": case "wormadam sandy":
                input = "Wormadam-Sandy"; break;
            case "wormadam-s": case "wormadam s": case "wormadam trash":
                input = "Wormadam-Trash"; break;
            case "floette ef": case "floette-ef": case "floette eternal":
                input = "Floette-Eternal"; break;
            case "type null": case "typenull": case "type:null":
                input = "Type: Null"; break; //will literally break without fix below
            case "tapukoko":
                input = "Tapu Koko"; break;
            case "tapulele":
                input = "Tapu Lele"; break;
            case "tapubulu":
                input = "Tapu Bulu"; break;
            case "tapufini":
                input = "Tapu Fini"; break;
            case "jangmoo": case "jangmo o":
                input = "Jangmo-o"; break;
            case "hakamoo": case "hakamo o":
                input = "Hakamo-o"; break;
            case "kommoo": case "kommo o":
                input = "Kommo-o"; break;
            case "oricorio baile": case "oricorio-baile":
                input = "Oricorio"; break;
            case "oricorio pom pom": case "oricorio-pom-pom":
                input = "Oricorio-Pom Pom"; break;
            case "oricorio pa'u": case "oricorio-pau": case "oricorio pau":
                input = "Oricorio-Pa'u"; break;
            case "oricorio sensu":
                input = "Oricorio-Sensu"; break;
            case "midday lycanroc": case "midday-lycanroc": case "lycanroc-midday": case "lycanroc midday":
                input = "Lycanroc"; break;
            case "midnight lycanroc": case "midnight-lycanroc": case "lycanroc midnight":
                input = "Lycanroc-Midnight"; break;
            case "wishiwashi solo": case "wishiwashi-solo":
                input = "Wishiwashi"; break;
            case "wishiwashi school":
                input = "Wishiwashi-School"; break;
            case "ash-greninja":
                input = "Ash Greninja"; break;
            case "zygarde 10%": case "zygarde-10": case "zygarde 10":
                input = "Zygarde-10%"; break;
            case "zygarde-50%": case "zygarde 50%": case "zygarde-50": case "zygarde 50":
                input = "Zygarde"; break;
            case "zygarde 100%": case "zygarde-100": case "zygarde-100%": case "zygarde 100": case "zygarde complete":
                input = "Zygarde-Complete"; break;
            default: input = input.replace(/flabebe/i, "Flabébé");
        }
        return input;
    },
    
    baseForme: function(pokeId) {
        if (isNaN(pokeId)) {
            pokeId = sys.pokeNum(pokeId);
        }
        
        return pokeId & ((1 << 16) - 1);
    }
};
