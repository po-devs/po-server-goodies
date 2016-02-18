//Health script by Arburator
var Config = {
    system_ip = "192.168.0.32", //Computer IP
    dns_servers = ["192.198.0.1", "8.8.8.8"],
    ping_thread = "52",
    viewed_ip = "151.226.242.0",
    isDynamic = true
}

var reset = SESSION.hostPC(+ system_ip +, "reset");

for (if ping_thread > 52) {
    print("PING: Larger than 52, Possible DDoS attack");
    return true;
} else {
    print("PING: Status Normal.");
    return false;
}

if (ping_thread > 135) {
    print("PING: Ping has gone beyond 135, DDoS attack is iminent");
} else if (ping_thread > 145) {
    reset;
}

