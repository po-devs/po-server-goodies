This repository contains scripts.js and tiers.xml used in Pokemon Online Server.

NOTICE IF UPDATING THESE SCRIPTS
If you're going to be using sys.sendAll() or sys.sendHtmlAll(), use sendChanAll or sendChanHtmlAll instead. 
Jirachier has created these functions to catch messages. 
For use it's just sendChanAll(message, optionalchannelid) if the optionalchannelid is -1 it sends to the entire server.