This repository contains scripts.js and tiers.xml used in Pokemon Online Server.

*** Installation instructions ***

Download as .zip (https://github.com/po-devs/po-server-goodies/zipball/master) or tarball,
extract into the same folder with Pokemon-Online server executable.
Note: some builds on Windows systems (2.0.0x) are missing the SSL libraries making
the scripts impossible to reload from Github. (/updatescripts, /updatetiers etc.)

Forking the repo is recommended as these scripts contain hardcoded configuration parameters
only suitable for the server we are running.

*** Guidelines for contributors ***

DON'T USE THE TAB CHARACTER. The scripts use 4 spaces and the mix of tab and spaces is what
causes the formatting issues at times.
You can set Notepad++ to use 4 spaces when the tab key is hit though if you use that to edit.
Settings->Preferences->Language Menu/Tab Settings
Set it to "Tab Size 4" and tick the replace with space box

Using jshint for checking some coding style is recommended.
In particular, following practices are frowned upon:
- tab character when indenting (see above)
- trailing whitespace
- undefined variables (always use var in the outermost scope for that variable)

*** tours.js version notes ***
- All versions before 1.622p have hardcoded parameters - update or change them.
- Updating while tournaments are in progress on major updates may break the system - all future commits will note this
- Versions marked with a 'p' should be bugfree, 'a' means it is in alpha testing and could be unstable, 'b' means it's in beta testing.
