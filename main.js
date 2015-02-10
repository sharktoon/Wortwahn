// LETTER: value
var LetterValue = {
    A: 4,
    B: 3,
    C: 0,
    D: 2,
    E: 3,
    F: 2,
    G: 1,
    H: 2,
    I: 0,
    J: 0,
    K: 2,
    L: 1,
    M: 3,
    N: 2,
    O: 0,
    P: 2,
    Q: 1,
    R: 3,
    S: 0,
    T: 1,
    U: 0,
    V: 1,
    W: 3,
    X: 1,
    Y: 1,
    Z: 2
};

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

// userId: { letters: [], word: '', value: 0, step: NONE/OKAY/VOTE/ACCEPT/REJECT, win: true/false }
var Round = {
    // none,submit,vote,points
    stage: 'none',
    target: 0,
    players: {}
};

// 'WORD': { accept: [], reject: [] }
var Voting = {};

var App = {};


(function() {
    App.chatCommands = {};

    /** display the contents of the letters array in a human readable format */
    function lettersToString(letters) {
        var result = ' ';
        for (var i = 0; i < letters.length; ++i) {
            result = result + letters[i] + '(' + LetterValue[letters[i]] + ') ';
        }
        return result;
    }

    /** retrieve value of the provided word - returns -1 if word was not possible */
    function getWordValue(letters, word) {
        if (letters.length < word.length) {
            return -1;
        }

        word = word.toUpperCase();

        var value = 0;
        var availableLetters = letters.copy();
        for (var i = 0; i < word.length; ++i) {
            var foundLetter = false;
            for (var k = 0; k < availableLetters.length; ++k) {
                if (word[i] == availableLetters[k]) {
                    availableLetters.slice(k);
                    foundLetter = true;
                    value += LetterValue[word[i]];
                    break;
                }
            }
            if (foundLetter == false) {
                return -1;
            }
        }
        return value;
    }

    /** submit a word by a user */
    function submitWord(user, params, command) {
        if (Round.stage != 'submit') {
            user.sendPrivateMessage('In dieser Runde können gerade keine Worte eingereicht werden!');
            return;
        }
        var userId = user.getUserId();
        if (!Round.players.hasOwnProperty(userId)) {
            user.sendPrivateMessage('Diese Runde läuft noch ohne dich! Bitte gedulde dich etwas.');
            return;
        }

        var obj = Round.players[userId];
        if (obj.step != 'none') {
            user.sendPrivateMessage('Du hast diese Runde schon ein Wort eingereicht!');
            return;
        }

        var entry = params.trim().toUpperCase();

        if (entry.length == 0) {
            user.sendPrivateMessage('Du musst ein Wort eingeben.');
            return;
        }

        var value = getWordValue(obj.letters, entry);
        if (value < 0) {
            user.sendPrivateMessage('Das Wort "' + entry + '" ist mit deinen Buchstaben leider nicht möglich!##Du hast diese Buchstaben:' + lettersToString(obj.letters));
            return;
        }

        obj.value = value;
        obj.word = entry;


        // TODO: not everything should be voted on!
        obj.step = 'vote';
        Voting[entry] = { accept: [], reject: [] };
        user.sendPrivateMessage('Dein Wort "' + entry + '" hat den Wert ' + value + ' - falls es von den anderen als gültig akzeptiert wird!');

        // TODO: check for end of submit stage!
    }

    App.chatCommands.x = submitWord;
    App.chatCommands.submit = submitWord;
    App.chatCommands.spell = submitWord;

    /** check if a user has already voted on a word - or not */
    function hasVoted(voteBox, userId) {
        if (voteBox.accept.indexOf(userId) != -1) {
            return true;
        }
        if (voteBox.reject.indexOf(userId) != -1) {
            return true;
        }
        return false;
    }

    function acceptSpelling(user, params, command) {
        var word = params.trim().toUpperCase();
        if (Voting.hasOwnProperty(word)) {
            if (hasVoted(Voting[word], user.getUserId())) {
                user.sendPrivateMessage('Du hast deine Stimme bereits für das Wort "' + word + '" abgegeben.');
            } else {
                Voting[word].accept.push(user.getUserId());
                user.sendPrivateMessage('Du hast deine Stimme für das Wort "' + word + '" abgegeben: Du findest es okay.');
            }
        } else {
            user.sendPrivateMessage('Über das Wort "' + word + '" wird gerade nicht abgestimmt.');
        }
    }

    function rejectSpelling(user, params, command) {
        var word = params.trim().toUpperCase();
        if (Voting.hasOwnProperty(word)) {
            if (hasVoted(Voting[word], user.getUserId())) {
                user.sendPrivateMessage('Du hast deine Stimme bereits für das Wort "' + word + '" abgegeben.');
            } else {
                Voting[word].reject.push(user.getUserId());
                user.sendPrivateMessage('Du hast deine Stimme für das Wort "' + word + '" abgegeben: Du findest es NICHT okay.');
            }
        } else {
            user.sendPrivateMessage('Über das Wort "' + word + '" wird gerade nicht abgestimmt.');
        }
    }

    App.chatCommands.accept = acceptSpelling;
    App.chatCommands.reject = rejectSpelling;

    /** starts submit phase - every player gets letters assigned */
    function beginSubmit() {
        Round.target = 1 + RandomOperations.nextInt(20);
        Round.stage = 'submit';

        KnuddelsServer.getDefaultBotUser().sendPublichMessage('Kommt möglichst nahe an ' + Round.target + ' heran!');
        // TODO: provide everyone with letters
    }

    /** starts voting phase - every player gets the vote links */
    function beginVoting() {
        var text = 'Folgende Worte wurde eingereicht:';

        for (var entry in Voting) {
            if (Voting.hasOwnProperty(entry)) {
                text += '## ' + entry + ' = _>okay|/accept ' + entry + '<_ oder _>falsch|/reject ' + entry + '<_';
            }
        }

        KnuddelsServer.getDefaultBotUser().sendPublicMessage(text)
    }

    /** begin scoring - scores are compared against target score */
    function beginScoring() {

    }

    /** end of round - resets all necessary fields */
    function beginEndOfRound() {
        Round.stage = 'none';
        Round.players = {};
    }

    /** advance the round to the next step */
    function advanceStep(user, params, command) {
        if (Round.stage == 'none') {
            for (var player in Round.players) {
                if (Round.players.hasOwnProperty(player)) {
                    beginSubmit();
                }
            }
        } else if (Round.stage == 'submit') {
            var skipVote = true;
            for (var entry in Voting) {
                if (Voting.hasOwnProperty(entry)) {
                    skipVote = false;
                }
            }
            if (skipVote) {
                beginScoring();
            } else {
                beginVoting();
            }
        } else if (Round.stage == 'vote') {
            beginScoring();
        } else if (Round.stage == 'points') {
            beginEndOfRound();
        }
    }

    App.chatCommands.next = advanceStep;
})();
