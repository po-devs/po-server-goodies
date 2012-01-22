/* utilities.js */
exports = {
    python_split: function python_split(string, delim, limit)
    {
        if (delim.__proto__ === RegExp && limit !== undefined)
            throw("python_split: RegExp not supported when limit is set.")
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

        if (pos != -1) {
            Command.command = string.substring(1, pos).toLowerCase();
            Command.parameterString = string.substr(pos+1);
        } else {
            Command.command = string.substr(1).toLowerCase();
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
    } 

}
