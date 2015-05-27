function POGlobal(id)
{
    var plugin_files = Config.Plugins;
    var plugins = [];
    for (var i = 0; i < plugin_files.length; ++i) {
        var plugin = require(plugin_files[i]);
        plugin.source = plugin_files[i];
        plugins.push(plugin);
    }
    this.plugins = plugins;
    this.coins = 0;
    this.channelManager = new POChannelManager('scriptdata/channelHash.txt');
    var manager = this.channelManager;
    sys.channelIds().forEach(function(id) {
        manager.restoreSettings(id);
    });
}

POGlobal.prototype.callplugins = function callplugins(event) {
    /* if a plugin wishes to stop event, it should return true */
    var plugins = this.plugins;
    var ret = false;
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < plugins.length; ++i) {
        if (plugins[i].hasOwnProperty(event)) {
            try {
                if (plugins[i][event].apply(plugins[i], args)) {
                    ret = true;
                    break;
                }
            } catch (e) {
                sys.sendAll('Plugins-error on {0}: {1}'.format(plugins[i].source, e + (e.lineNumber ? " on line: " + e.lineNumber : "")), staffchannel);
            }
        }
    }
    return ret;
};

POGlobal.prototype.getplugins = function getplugins(data) {
    var plugins = this.plugins;
    var ret = {};
    for (var i = 0; i < plugins.length; ++i) {
        if (plugins[i].hasOwnProperty(data)) {
            ret[plugins[i].source] = plugins[i][data];
        }
    }
    return ret;
};

exports.POGlobal = POGlobal;