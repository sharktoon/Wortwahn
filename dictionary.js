/**
 * Created by Daniel on 03.03.2015.
 * basically the spellchecker
 *
 * decides if a word is okay, needs voting, and learns new words.
 */

var Dictionary = {};

(function() {
    var VALUE_OKAY = 999999;
    var VALUE_REJECT = -1;

    // 'WORD': { accepted: <int>, rejected: <int>, okay: true/false, used: <int> }
    var WordBase = {
        'ALTER': { okay: true },
        'BETT': { okay: true },
        'CHROME': { okay: true },
        'DOSEN': { okay: true },
        'ESEL': { okay: true },
        'FRIEDE': { okay: true },
        'GARTEN': { okay: true },
        'HAUS': { okay: true },
        'INSEL': { okay: true },
        'JAGEN': { okay: true },
        'KLUG': { okay: true },
        'LERNE': { okay: true },
        'MANN': { okay: true },
        'NOT': { okay: true },
        'OLDIE': { okay: true },
        'POKER': { okay: true },
        'QUARK': { okay: true },
        'ROT': { okay: true },
        'SAUFEN': { okay: true },
        'TOD': { okay: true },
        'UHR': { okay: true },
        'VOGEL': { okay: true },
        'WALD': { okay: true },
        'XYLOPHON': { okay: true },
        'YPSILON': { okay: true },
        'ZONE': { okay: true }
    };

    function checkWord(word) {
        var result = 'vote';
        if (WordBase.hasOwnProperty(word)) {
            if (WordBase[word].okay) {
                result = 'accept';
            } else {
                result = 'reject';
            }
        }

        var persistence = KnuddelsServer.getPersistence();
        var value = persistence.getNumber(word, 0);

        if (value == VALUE_OKAY) {
            result = 'accept';
        } else if (value == VALUE_REJECT) {
            result = 'reject';
        } else if (value > Settings.ValueToAccept && Settings.ValueToAccept > 0) {
            result = 'accept';
        }

        return result;
    }

    function userAccept(word) {
        var persistence = KnuddelsServer.getPersistence();
        var oldvalue = persistance.getNumber(word, 0);
        if (oldvalue !== VALUE_OKAY && oldvalue !== VALUE_REJECT) {
            persistence.addNumber(word, 1);
        }
    }

    function teach(user, word) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            word = word.trim().toUpperCase();
            if (word.length > Settings.LetterCount) {
                sendPrivateMessage(user, 'Das Wort "' + word + '" ist nicht möglich. Zu lang.');
                return;
            }
            var persistence = KnuddelsServer.getPersistence();
            persistence.setNumber(word, VALUE_OKAY);
            sendPrivateMessage(user, 'Das Wort "' + word + '" ist jetzt in der Liste der bekannten Worte.');
        } else {
            sendPrivateMessage(user, 'Das klappt so nicht.');
        }
    }

    function forget(user, word) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            var persistence = KnuddelsServer.getPersistence();
            persistence.deleteNumber(word);
            sendPrivateMessage(user, 'Das Wort "' + word + '" ist aus den Listen genommen worden.');
        } else {
            sendPrivateMessage(user, 'Das klappt so nicht.');
        }
    }

    function forbid(user, word) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            word = word.trim().toUpperCase();
            if (word.length > Settings.LetterCount) {
                sendPrivateMessage(user, 'Das Wort "' + word + '" ist nicht möglich. Zu lang.');
                return;
            }
            var persistence = KnuddelsServer.getPersistence();
            persistence.setNumber(word, VALUE_REJECT);
            sendPrivateMessage(user, 'Das Wort "' + word + '" ist jetzt verboten.');
        } else {
            sendPrivateMessage(user, 'Das klappt so nicht.');
        }
    }

    Dictionary = {
        check: checkWord,
        userAccept: userAccept,
        teach: teach,
        forget: forget,
        forbid: forbid
    }
})();
