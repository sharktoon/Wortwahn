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

    var STORAGE = "_STORAGE_";
    var STORAGE_SIZE = "SIZE_STORAGE";

    function store() {
        var persistence = KnuddelsServer.getPersistence();

        var metaCount = 0;
        var wordList = [];
        var dataCount = 0;

        for (var word in WordBase) {
            if (dataCount > 90000) {
                persistence.setObject(STORAGE + metaCount, wordList);

                wordList = [];
                dataCount = 0;
                ++metaCount;
            }

            if (WordBase.hasOwnProperty(word) && WordBase[word].okay) {
                wordList.push(word);
                dataCount += word.length;
                dataCount += 4;
            }
        }

        persistence.setObject(STORAGE + metaCount, wordList);
        ++metaCount;

        persistence.setNumber(STORAGE_SIZE, metaCount);
    }

    function load() {
        var persistence = KnuddelsServer.getPersistence();

        var metaNumber = persistence.getNumber(STORAGE_SIZE, 0);
        for(var metaCount = 0; metaCount < metaNumber; ++metaCount) {
            var wordList = persistence.getObject(STORAGE + metaCount);

            if (wordList) {
                for (var i = 0; i < wordList.length; ++i) {
                    WordBase[wordList[i]] = {okay: true};
                }
            }
        }
    }

    function checkWord(word) {
        var result = 'vote';
        if (WordBase.hasOwnProperty(word)) {
            if (WordBase[word].okay) {
                result = 'accept';
            } else if (WordBase[word].votes && WordBase[word].votes > Settings.ValueToAccept) {
                result = 'accept';
            }
        }

        return result;
    }

    function userAccept(word) {
        word = word.toUpperCase();

        if (WordBase.hasOwnProperty(word)) {
            if (WordBase[word].votes) {
                WordBase[word].votes += 1;
            } else {
                WordBase[word].votes = 1;
            }
        }
    }

    function teach(user, word) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            word = word.trim().toUpperCase();
            if (word.length > Settings.LetterCount) {
                sendPrivateMessage(user, 'Das Wort "' + word + '" ist nicht möglich. Zu lang.');
                return;
            }

            WordBase[word] = { okay: true };
            sendPrivateMessage(user, 'Das Wort "' + word + '" ist jetzt in der Liste der bekannten Worte.');
        } else {
            sendPrivateMessage(user, 'Das klappt so nicht.');
        }
    }

    function forget(user, word) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            word = word.trim().toUpperCase();
            delete WordBase[word];

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
            WordBase[word] = { forbidden: true };
            sendPrivateMessage(user, 'Das Wort "' + word + '" ist jetzt verboten.');
        } else {
            sendPrivateMessage(user, 'Das klappt so nicht.');
        }
    }

    Dictionary = {
        store: store,
        load: load,

        check: checkWord,
        userAccept: userAccept,
        teach: teach,
        forget: forget,
        forbid: forbid
    }
})();
