module.exports.afterLogIn = function afterLogIn(src) {

    var name = sys.name(src);

    if (/^conflict/i.test(name)) {
        script.issueBan("smute", "Scripts!", undefined, "" + name + ":conflict:2h");
        sys.sendAll("±Funkie: conflict auto muted under name " + name, staffchannel);
    }

}
