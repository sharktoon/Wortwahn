/**
 * this helper provides the ability to track certain commands and who used them when.
 * Created by Daniel on 22.04.2015.
 */

var Tracker = (function() {
    var MyLog = [];

    // log a special function
    function log(user, key, param) {
        var entry = {
            nick: user.getNick(),
            key: key,
            params: param,
            time: new Date().toISOString()
        };

        MyLog.push(entry);
    }

    // show log with a filter
    function show(user, param) {
        var shortLog = [];
        var filter = param.trim();

        for (var i = 0; i < MyLog.length; ++i) {
            var entry = MyLog[i];
            if ('*' === filter || entry.key === filter) {
                shortLog.push(entry);
            }
        }

        sendPrivateInfoMessage(user, JSON.stringify(shortLog));
    }


    return {
        log: log,
        show: show
    };
})();