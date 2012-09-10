This repository contains scripts.js and tiers.xml used in Pokemon Online Server.

NOTICE IF UPDATING THESE SCRIPTS

DON'T USE THE TAB CHARACTER. The scripts use 4 spaces and the mix of tab and spaces is what causes the formatting issues at times.
You can set Notepad++ to use 4 spaces when the tab key is hit though if you use that to edit.
Settings->Preferences->Language Menu/Tab Settings
Set it to "Tab Size 4" and tick the replace with space box

If you're going to be using sys.sendAll() or sys.sendHtmlAll(), use sendChanAll or sendChanHtmlAll instead. 
Jirachier has created these functions to catch messages. 
For use it's just sendChanAll(message, optionalchannelid) if the optionalchannelid is -1 it sends to the entire server.