/* Object that manages channels */
function POChannelManager(fname)
{
    /* Permanent channels */
    this.channelDataFile = fname;
    this.channelMap = new MemoryHash(this.channelDataFile);
    sys.makeDir("scriptdata/channeldata");
}

POChannelManager.prototype.toString = function()
{
    return "[object POChannelManager]";
};

POChannelManager.prototype.copyAttrs = [
    "topic",
    "topicSetter",
    "perm",
    "members",
    "operators",
    "admins",
    "masters",
    "inviteonly",
    "muteall",
    "meoff",
    "muted",
    "banned",
    "ignorecaps",
    "ignoreflood",
    "rules"
];

POChannelManager.prototype.update = function(channel)
{
    var chan = SESSION.channels(channel);
    var chanData = {};
    this.copyAttrs.forEach(function(attr) {
        chanData[attr] = chan[attr];
    });
    this.saveChan(channel, chanData);
};

POChannelManager.prototype.restoreSettings = function(channel)
{
    var chan = SESSION.channels(channel);
    var chanData = this.loadChan(channel);
    this.copyAttrs.forEach(function(attr) {
        if (chanData !== null && chanData.hasOwnProperty(attr))
            chan[attr] = chanData[attr];
    });
};

POChannelManager.prototype.dataFileFor = function(channel)
{
    var chanName = sys.channel(channel).toLowerCase();
    if (!this.channelMap.get(chanName)) {
       var genName = "scriptdata/channeldata/" + Date.now() + Math.random().toString().substr(2) + ".json";
       this.channelMap.add(chanName,genName)
    }
    return this.channelMap.get(chanName);
};

POChannelManager.prototype.saveChan = function(channel, channelData)
{
    var channelDataFile = this.dataFileFor(channel);
    sys.writeToFile(channelDataFile, JSON.stringify(channelData));
};

POChannelManager.prototype.loadChan = function(channel)
{
    var channelDataFile = this.dataFileFor(channel);
    var content = sys.getFileContent(channelDataFile);
    if (content) {
        try {
            var data = JSON.parse(content);
            return data;
        } catch(e) {}
    }
    return {};
};

POChannelManager.prototype.createPermChannel = function(name, defaultTopic)
{
    var cid;
    if (sys.existChannel(name)) {
        cid = sys.channelId(name);
    } else {
        cid = sys.createChannel(name);
    }
    this.restoreSettings(cid);
    if (!SESSION.channels(cid).topic) {
        SESSION.channels(cid).topic = defaultTopic;
    }
    SESSION.channels(cid).perm = true;
    return cid;
};

exports.POChannelManager = POChannelManager;
