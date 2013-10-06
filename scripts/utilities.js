/* utilities.js */
exports = {
    python_split: function python_split(string, delim, limit)
    {
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
    
    is_command: function is_command(string)
    {
        return (string[0] == '/' || string[0] == '!') && string.length > 1 && utilities.isLetter(string[1]);
    },

    as_command: function as_command(string, delim, limit)
    {
        var Command = {command: "", parameterString: ""};
        var pos = string.indexOf(' ');
        var startIndex = this.is_command(string) ? 1 : 0;
        if (pos != -1) {
            Command.command = string.substring(startIndex, pos).toLowerCase();
            Command.parameterString = string.substr(pos+1);
        } else {
            Command.command = string.substr(startIndex).toLowerCase();
        }
        if (delim !== undefined) {
            Command.parameters = this.python_split(Command.parameterString, delim, limit);
        }
        return Command;
    },

    find_poke: function find_poke(src, poke_id)
    {
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

    find_move: function find_move(src, poke_slot, move_id)
    {
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

    Lazy: function Lazy(func)
    {
        var done = false;
        return function() {
            if (done)
                return this._value;
            else {
                done = true;
                return this._value = func.apply(arguments.callee, arguments);
            }
        };
    },

    capitalize: function capitalize(string) {
        return string[0].toUpperCase() + string.slice(1);
    },

    non_flashing: function nonFlashing(name) {
        return name[0] + '\u200b' + name.substr(1);
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
    
    html_escape : function(text) {
        var m = String(text);
        if (m.length > 0) {
            var amp = "&am" + "p;";
            var lt = "&l" + "t;";
            var gt = "&g" + "t;";
            return m.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt);
        }else{
            return "";
        }
    },
    
    getSeconds : function(s) {
        var parts = s.split(" ");
        var secs = 0;
        for (var i = 0; i < parts.length; ++i) {
            var c = (parts[i][parts[i].length-1]).toLowerCase();
            var mul = 60;
            if (c == "s") { mul = 1; }
            else if (c == "m") { mul = 60; }
            else if (c == "h") { mul = 60*60; }
            else if (c == "d") { mul = 24*60*60; }
            else if (c == "w") { mul = 7*24*60*60; }
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
    }
};
