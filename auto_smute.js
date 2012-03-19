module.exports.afterLogIn = function afterLogIn(src) {

    var name = sys.name(src);

    if (/^conflict/i.test(name)) {
        script.issueBan("smute", "Scripts!", undefined, "" + sys.name(tar) + ":conflict:2h");
    }

}
