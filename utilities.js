/* utilities.js */
exports = {
    python_split: function python_split(string, delim, limit)
    {
        if ((delim.__proto__ === RegExp || delim.__proto__ == "/(?:)/") && limit !== undefined) {
            // lastIndex doesn't update without global match
            var flags = "g" + (delim.ignoreCase ? "i" : "") + (delim.multiline ? "m" : "");
            var re = new RegExp(delim.source, flags);
            var arr = [];
            var lastIndex = 0;
            while (--limit >= 0) {
                var match = re.exec(string);
                if (match != null) {
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
        var arr = string.split(delim);
        if (delim.length > limit) {
            var b = arr.slice(delim);
            arr.push(b.join(delim));
        }
        return arr;
    },

    is_command: function is_command(string)
    {
        return (string[0] == '/' || string[0] == '!') && string.length > 1;
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
            poke_slot = parseInt(poke_id) - 1;
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
           move_slot = parseInt(move_id) - 1;
        } else {
            var moveNum = sys.moveNum(move_id);
            if (moveNum !== undefined) {
                move_slot = sys.indexOfTeamPokeMove(src, poke_slot, moveNum)
            }
        }
        return move_slot;
    },

    is_non_negative: function is_non_negative(n) {
        return typeof n == 'number' && !isNaN(n) && n >= 0;
    },

    Lazy: function Lazy(func)
    {       
        var done = false;
        return function() {
            if (done)
                return this._value
            else {
                done = true;
                return this._value = func.apply(arguments.callee, arguments);
            }
        }       
    },

    capitalize: function capitalize(string) {
        return string[0].toUpperCase() + string.slice(1);
    },

    non_flashing: function nonFlashing(name) {
        return name;
        // PO version 1.0.53 has a bug with zwsp due to (we think) qt.
        /* return name[0] + '\u200b' + name.substr(1) */
    }

}
