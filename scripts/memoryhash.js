/*
 * Prototype: MemoryHash
 * Functions:
 *  - add(key,value)
 *  - get(key)
 *  - remove(key)
 *  - removeIf(callBack)
 *  - clear()
 *  - save()
 *  - escapeValue(val)
 *
 *  All keys and values must be strings.
 */
function MemoryHash(filename)
{
    this.hash = {};
    this.fname = filename;

    var contents = sys.getFileContent(this.fname);
    if (contents !== undefined) {
        var lines = contents.split("\n");
        for(var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            var key_value = line.split("*");
            var key = key_value[0];
            var value = key_value.slice(1).join("*");
            if (key.length > 0) {
                if (value === undefined)
                    value = '';
                this.hash[key] = value;
            }
        }
    }
}

MemoryHash.prototype.add = function(key, value)
{
    this.hash[key] = value;
    // it doesn't matter if we add a duplicate,
    // when we remove something eventually,
    // duplicates will be deleted
    sys.appendToFile(this.fname, key +'*' + value + '\n');
}

MemoryHash.prototype.get = function(key)
{
    if (this.hash.hasOwnProperty(key)) {
        return this.hash[key];
    }
    return undefined;
}

MemoryHash.prototype.has = function(key)
{
    return this.hash.hasOwnProperty(key);
}

MemoryHash.prototype.remove = function(key)
{
    delete this.hash[key];
    this.save();
}

MemoryHash.prototype.removeIf = function(test)
{
    var i;
    var toDelete = []
    for (i in this.hash) {
        if (test(this, i)) {
            toDelete.push(i);
        }
    }
    for (i in toDelete) {
        delete this.hash[toDelete[i]];
    }
}

MemoryHash.prototype.clear = function()
{
    this.hash = {};
    this.save();
}

MemoryHash.prototype.save = function()
{
    var lines = [];
    for (var i in this.hash) {
        lines.push(i +'*' + this.hash[i] + '\n');
    }
    sys.writeToFile(this.fname, lines.join(""))
}

MemoryHash.prototype.escapeValue = function(value)
{
    return value.replace(/\*\n/g,'');
}

/* End of prototype MemoryHash */

exports.MemoryHash = MemoryHash;
