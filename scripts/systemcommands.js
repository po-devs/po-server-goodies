exports.handleCommand = function(src, command, commandData, tar, channel) {
	if (command === "changeservername") {
		if (commandData == undefined) {
			normalbot.sendMessage(src, "Cannot have an empty server name!", channel);
			return;
		}
		sys.changeServerName(commandData);
		return;
	}
	if (command === "cleardos") {
		sys.clearDosData();
		normalbot.sendMessage(src, "DOS Data has been cleared from the database.", channel);
		return;
	}
	if (command === "private") {
		sys.makeServerPublic(false);
		normalbot.sendMessage(src, "The server is now currently pirvate.", channel);
		return;
	}
	if (command === "public") {
		sys.makeServerPublic(true);
		normalbot.sendMessage(src, "The server is now currently public.", channel);
		return;
	}
	if (command === "setdescription") {
		sys.changeDescription(commandData);
		normalbot.sendMessage(src, "Description changed.", channel);
		return;
	}
	if (command === "seeannouncement") {
		sys.sendMessage(src, sys.getAnnouncement(), channel);
		return;
	}
	if (command === "checkports") {
		sys.sendMessage(src, sys.serverPorts(), channel);
		return;
	}
	if (command === "proxyservers") {
		sys.sendMessage(src, sys.proxyServers(), channel);
		return;
	}
	if (command === "trustip") {
		sys.addTrustedIp(commandData);
		normalbot.sendMessage(src, "IP added to trusted IPs array.", channel);
		return;
	}
	if (command === "untrustip") {
		sys.removeTrustedIp(commandData);
		normalbot.sendMessage(src, "IP removed from trusted IPs array.", channel);
		return;
	}
	//just in case its ever needed...
	if (command === "shutdown") {
	    sys.setTimer(sys.shutDown(), 60000);
	    normalbot.sendAll("The server is shutting down in one minute, Finish your battles quickly!");
	    return;
	}
	
	return "no command";
};
exports.help = 
    [
	    "/changeservername: Changes the server name.",
	    "/cleardos: Clears DOS data from the server",
	    "/private: Makes the server private",
	    "/public: Makes the server public",
	    "/setdescription: Sets the server description",
	    "/seeannouncement: Shows you the announcement",
	    "/checkports: Checks the ports used by the server",
	    "/proxyservers: Shows the proxy server array",
	    "/trustip [IP]: Adds [IP] to trusted IPs array",
	    "/untrustip [IP]: Removes [IP] from trusted IPs array"
    ];
