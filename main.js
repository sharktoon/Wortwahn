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

var ValueColorCodes = {
    0: 'W',
    1: 'C',
    2: 'O',
    3: 'R',
    4: 'G',
    5: 'M'
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
    // none,submit,vote,score
    stage: 'none',
    target: 0,
    players: {}
};

// all the remaining info from the last round
var LastRound = {
    stage: 'score',
    target: 0,
    players: {}
}

var Candidates = [];

// 'WORD': { accept: [], reject: [] }
var Voting = {};

/** various settings for the game */
var Settings = {
    LetterPool: 'aaaaabbbbcccccdddeeeeeeeeeeeefffffgggggggghhhhhhhiiiiijjjkkkkkllllmmmmmmmnnnnnnooooooppppqrrrrrrssssstttttuuuvvvvwwxyzz',
    LetterCount: 8
};

var App = {};


(function() {
    var LetterPool = [];

    /** fills the letters with available letters from the pool */
    function refillLetters(letters) {
        while(letters.length < Settings.LetterCount) {
            if (LetterPool.length <= 1) {
                // no letters left in pool? => refill!
                var base = Settings.LetterPool.toUpperCase();
                for (var i = 0; i < base.length; ++i) {
                    LetterPool.push(base[i]);
                }
                // add at least one of each letter
                for (var k in LetterValue) {
                    if (LetterValue.hasOwnProperty(k)) {
                        LetterPool.push(k);
                    }
                }
                LetterPool = RandomOperations.shuffleObjects(LetterPool);
            }

            letters.push(LetterPool.pop());
        }
    }

    /** display the contents of the letters array in a human readable format */
    function lettersToString(letters) {
        var result = ' ';
        for (var i = 0; i < letters.length; ++i) {
            var colorCode = ValueColorCodes[LetterValue[letters[i]]];
            //result = result + letters[i] + '(' + LetterValue[letters[i]] + ') ';
            result = result + '°r' + colorCode + '°' + letters[i] + '°r10°' + LetterValue[letters[i]] + ' ';
        }
        result += '°r°';
        return result;
    }

    /** convenience function - so I only see warning once */
    function sendPublicMessage(text) {
        KnuddelsServer.getDefaultBotUser().sendPublicMessage(text);
    }

    /** retrieve value of the provided word - returns -1 if word was not possible */
    function getWordValue(letters, word) {
        if (letters.length < word.length) {
            return -1;
        }

        word = word.toUpperCase();

        var value = 0;
        var availableLetters = letters.slice();
        for (var i = 0; i < word.length; ++i) {
            var foundLetter = false;
            for (var k = 0; k < availableLetters.length; ++k) {
                if (word[i] == availableLetters[k]) {
                    availableLetters.splice(k, 1);
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

    /** removes the letters for the supplied word */
    function consumeLetters(entry) {
        for (var i = 0; i < entry.word.length; ++i) {
            for (var k = 0; k < entry.letters.length; ++k) {
                if (entry.word[i] == entry.letters[k]) {
                    entry.letters.splice(k, 1);
                    break;
                }
            }
        }
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
            user.sendPrivateMessage('Das Wort "' + entry + '" ist mit deinen Buchstaben leider nicht möglich!°#°#Du hast diese Buchstaben:' + lettersToString(obj.letters));
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

    /** replaces all letters a user has */
    function replaceLetters(user) {
        var userId = user.getUserId();

        if (Round.players.hasOwnProperty(userId)) {
            Round.players[userId].letters = [];
            refillLetters(Round.players[userId].letters);

            user.sendPrivateMessage('Deine Buchstaben sind nun:' + lettersToString(Round.players[userId].letters));
        }
    }

    /** initializes the player instance - inside the round object */
    function startPlayer(userId) {
        if (Round.players.hasOwnProperty(userId)) {
            return;
        }

        var user = KnuddelsServer.getUser(userId);
        if (user && user.isOnlineInChannel()) {
             var obj = {
                letters: [],
                step: 'none',
                word: '',
                value: -1,
                win: false
            }

            if (LastRound.players.hasOwnProperty(userId)) {
                obj.letters = LastRound.players[userId].letters;
            }

            refillLetters(obj.letters);
            Round.players[userId] = obj;

            user.sendPrivateMessage('Deine Buchstaben diese Runde:' + lettersToString(obj.letters));
        }
    }

    function joinGame(user, params, command) {
        var userId = user.getUserId();
        if (Round.stage != 'none') {
            user.sendPrivateMessage('Momentan kannst du nicht einsteigen. Habe bitte einen Moment Geduld. Sobald das nächste Spiel losgeht, wirst du informiert!');
            Candidates.push(userId);
            return;
        }

        startPlayer(userId);
    }


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

    /** starts submit phase - every player gets letters assigned */
    function beginSubmit() {
        Round.target = 1 + RandomOperations.nextInt(20);
        Round.stage = 'submit';

        sendPublicMessage('Kommt möglichst nahe an ' + Round.target + ' heran!');

    }

    /** starts voting phase - every player gets the vote links */
    function beginVoting() {
        var text = 'Folgende Worte wurde eingereicht:';
        Round.stage = 'vote';

        for (var entry in Voting) {
            if (Voting.hasOwnProperty(entry)) {
                text += '## ' + entry + ' = _°>okay|/accept ' + entry + '<°_ oder _°>falsch|/reject ' + entry + '<°_';
            }
        }

        sendPublicMessage(text);
    }

    /** begin scoring - scores are compared against target score */
    function beginScoring() {
        Round.stage = 'score';

        var bestDelta = 100000;
        var bestEntries = [];

        var text = 'Die Beiträge diese Runde:';
        for (var userId in Round.players) {
            if (Round.players.hasOwnProperty(userId)) {
                var user = KnuddelsServer.getUser(userId);
                var entry = Round.players[userId];
                if (entry.step == 'vote') {
                    if (Voting[entry.word].accept.length >= Voting[entry.word].reject.length) {
                        entry.step = 'accept';
                    } else {
                        entry.step = 'reject';
                    }
                }

                if (entry.step == 'okay' || entry.step == 'accept') {
                    text += '##' + user.getNick() + ': "' + entry.word + '" für ' + entry.value + ' Punkte';

                    consumeLetters(entry);

                    var delta = Math.abs(Round.target - entry.value);
                    if (delta < bestDelta) {
                        bestEntries = [userId];
                        bestDelta = delta;
                    } else if (delta == bestDelta) {
                        bestEntries.push(userId);
                    }
                }
            }
        }

        text += "##Gewinner:";
        if (bestEntries.length > 0) {
            for (var i = 0; i < bestEntries.length; ++i) {
                var user = KnuddelsServer.getUser(bestEntries[i]);
                text += ' ' + user.getNick();
            }
        } else {
            text += ' -';
        }

        sendPublicMessage(text);
    }

    /** end of round - resets all necessary fields */
    function beginEndOfRound() {
        LastRound.target = Round.target;
        LastRound.players = Round.players;

        Round.stage = 'none';
        Round.players = {};

        Voting = {};

        sendPublicMessage('Runde vorbei! Jetzt beitreten mit _°>/spielen|/spielen<°_');
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
        } else if (Round.stage == 'score') {
            beginEndOfRound();
        }
    }

    App.chatCommands = {
        x: submitWord,
        submit: submitWord,
        spell: submitWord,
        wort: submitWord,

        // game: joinGame,
        spiel: joinGame,
        join: joinGame,
        spielen: joinGame,

        accept: acceptSpelling,
        richtig: acceptSpelling,
        '+': acceptSpelling,
        reject: rejectSpelling,
        '-': rejectSpelling,
        falsch: rejectSpelling,

        // next: advanceStep,
        weiter: advanceStep,

        dump: replaceLetters,
        abwerfen: replaceLetters,
        ersetzen: replaceLetters
    };

})();
