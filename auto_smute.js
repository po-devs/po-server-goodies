module.exports.afterLogIn = function afterLogIn(src) {

    var name = sys.name(src);

    if (/^conflict/i.test(name)) {
        script.issueBan("smute", "Scripts!", undefined, "" + sys.name(src) + ":conflict:2h");
    }

}
