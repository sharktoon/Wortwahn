require('helper.js');
require('reward.js');
require('dictionary.js');

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

// 'WORD': { accept: [], reject: [], submit: [] }
var Voting = {};

/** various settings for the game */
var Settings = {
    LetterPool: {
        A: 7, //6.5,
        B: 2, //1.9,
        C: 3, //3.1,
        D: 5, //5.1,
        E: 17, //17.4,
        F: 2, //1.7,
        G: 3, //3.0,
        H: 4, //4.8,
        I: 8,//7.6,
        J: 1,//0.3,
        K: 1,//1.2,
        L: 3,//3.4,
        M: 2,//2.5,
        N: 10,//9.8,
        O: 3,//2.5,
        P: 1,//0.8,
        Q: 1,//0.1,
        R: 7,//7.0,
        S: 8,//7.9,
        T: 6,//6.2,
        U: 5,//4.4,
        V: 1,//0.7,
        W: 1,//1.9,
        X: 1,//0.1,
        Y: 1,//0.1,
        Z: 1//1.1
    },
    LetterCount: 8,
    ValueToAccept: 10,
    Timer: {
        score: 3000,
        signup: 5000,
        submit: 30000,
        submitFinal: 5000,
        vote: 5000
    },
    Season: {
        id: '2015-03',
        name: 'März'
    },
    LastSeason: {
        id: '2015-02',
        name: 'Februar'
    }
};

var App = {};


(function() {
    var LetterPool = [];

    /** fills the letters with available letters from the pool */
    function refillLetters(letters) {
        while(letters.length < Settings.LetterCount) {
            if (LetterPool.length <= 1) {
                // no letters left in pool? => refill!
                var base = Settings.LetterPool;
                for (var i in base) {
                    if (base.hasOwnProperty(i)) {
                        for(var k = 0; k < base[i]; ++k) {
                            LetterPool.push(i);
                        }
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
            sendPrivateMessage(user, 'In dieser Runde können gerade keine Worte eingereicht werden!');
            return;
        }
        var userId = user.getUserId();
        if (!Round.players.hasOwnProperty(userId)) {
            sendPrivateMessage(user, 'Diese Runde läuft noch ohne dich! Bitte gedulde dich etwas.');
            return;
        }

        var obj = Round.players[userId];
        //if (obj.step != 'none') {
        //    user.sendPrivateMessage('Du hast diese Runde schon ein Wort eingereicht!');
        //    return;
        //}

        var entry = params.trim().toUpperCase();

        if (entry.length == 0) {
            sendPrivateMessage(user, 'Du musst ein Wort eingeben.');
            return;
        }

        var value = getWordValue(obj.letters, entry);
        if (value < 0) {
            sendPrivateMessage(user, 'Das Wort "' + entry + '" ist mit deinen Buchstaben leider nicht möglich!°##°Du hast diese Buchstaben:' + lettersToString(obj.letters));
            return;
        }

        var acceptance = Dictionary.check(entry);

        if (acceptance === 'reject') {
            sendPrivateMessage(user, 'Die Buchstabenfolge "' + entry + '" ergibt leider kein akzeptiertes Wort!');
            return;
        }

        if (obj.step != 'none') {
            var index = Voting[obj.word].submit.indexOf(userId);
            Voting[obj.word].submit.splice(index, 1);
            if (Voting[obj.word].submit.length == 0) {
                delete Voting[obj.word];
            }
        }

        if (acceptance === 'vote') {
            obj.value = value;
            obj.word = entry;

            obj.step = 'vote';
            if (Voting.hasOwnProperty(entry)) {
                Voting[entry].submit.push(userId);
            } else {
                Voting[entry] = { accept: [], reject: [], submit: [userId] };
            }
            sendPrivateMessage(user, 'Dein Wort "' + entry + '" hat den Wert ' + value + ' - falls es von den anderen als gültig akzeptiert wird!');
        } else if (acceptance === 'accept') {
            obj.value = value;
            obj.word = entry;

            obj.step = 'okay';
            sendPrivateMessage(user, 'Dein Wort "' + entry + '" hat den Wert ' + value + '.');
        }
    }

    /** replaces all letters a user has */
    function replaceLetters(user) {
        var userId = user.getUserId();

        if (Round.players.hasOwnProperty(userId)) {
            Round.players[userId].letters = [];
            refillLetters(Round.players[userId].letters);

            sendPrivateMessage(user, 'Deine Buchstaben sind nun:' + lettersToString(Round.players[userId].letters));
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

            sendPrivateMessage(user, 'Deine Buchstaben diese Runde:' + lettersToString(obj.letters));
        }
    }

    var gameStartingTimer = undefined;

    function joinGame(user, params, command) {
        var userId = user.getUserId();
        if (Round.stage != 'none') {
            sendPrivateMessage(user, 'Momentan kannst du nicht einsteigen. Habe bitte einen Moment Geduld. Sobald das nächste Spiel losgeht, wirst du informiert!');
            Candidates.push(userId);
            return;
        }

        startPlayer(userId);

        var count = 0;
        for (var player in Round.players) {
            if (Round.players.hasOwnProperty(player)) {
                ++count;
            }
        }
        if (count >= 2) {
            if (gameStartingTimer == undefined) {
                sendPublicMessage('Spiel beginnt in ' + Settings.Timer.signup/1000 + ' Sekunden!');
                setTimeout(function() {
                    if (Round.stage == 'none') {
                        beginSubmit();
                    }
                }, Settings.Timer.signup);
            }
        } else {
            sendPublicMessage(count + ' Mitspieler angemeldet! Noch sind Plätze frei!');
        }
    }


    /** check if a user has already voted on a word - or not */
    function hasVoted(voteBox, userId) {
        if (voteBox.accept.indexOf(userId) != -1) {
            return true;
        }
        if (voteBox.reject.indexOf(userId) != -1) {
            return true;
        }
        if (voteBox.submit.indexOf(userId) != -1) {
            return true;
        }
        return false;
    }

    function acceptSpelling(user, params, command) {
        var word = params.trim().toUpperCase();
        if (Voting.hasOwnProperty(word)) {
            if (hasVoted(Voting[word], user.getUserId())) {
                sendPrivateMessage(user, 'Du hast deine Stimme bereits für das Wort "' + word + '" abgegeben.');
            } else {
                Voting[word].accept.push(user.getUserId());
                sendPrivateMessage(user, 'Du hast deine Stimme für das Wort "' + word + '" abgegeben: Du findest es okay.');
            }
        } else {
            sendPrivateMessage(user, 'Über das Wort "' + word + '" wird gerade nicht abgestimmt.');
        }
    }

    function rejectSpelling(user, params, command) {
        var word = params.trim().toUpperCase();
        if (Voting.hasOwnProperty(word)) {
            if (hasVoted(Voting[word], user.getUserId())) {
                sendPrivateMessage(user, 'Du hast deine Stimme bereits für das Wort "' + word + '" abgegeben.');
            } else {
                Voting[word].reject.push(user.getUserId());
                sendPrivateMessage(user, 'Du hast deine Stimme für das Wort "' + word + '" abgegeben: Du findest es NICHT okay.');
            }
        } else {
            sendPrivateMessage(user, 'Über das Wort "' + word + '" wird gerade nicht abgestimmt.');
        }
    }

    /** starts submit phase - every player gets letters assigned */
    function beginSubmit() {
        Round.target = 1 + RandomOperations.nextInt(20);
        Round.stage = 'submit';

        sendPublicMessage('Kommt möglichst nahe an _' + Round.target + '_ heran! Worte können mit ""/x WORT"" eingereicht werden');

        function endSubmit() {
            if (Round.stage == 'submit') {
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
            }
        }

        setTimeout(function() {
            sendPublicMessage('Nur noch ' + Settings.Timer.submitFinal / 1000  + ' Sekunden! Mit /x WORT kann ein Wort eingereicht werden!');
            setTimeout(endSubmit, Settings.Timer.submitFinal);
        }, Settings.Timer.submit);
    }

    /** starts voting phase - every player gets the vote links */
    function beginVoting() {
        var text = 'Folgende Worte wurde eingereicht:';
        Round.stage = 'vote';

        for (var entry in Voting) {
            if (Voting.hasOwnProperty(entry)) {
                text += '°##° ' + entry + ' = _°>okay|/accept ' + entry + '<°_ oder _°>falsch|/reject ' + entry + '<°_';
            }
        }

        sendPublicMessage(text);

        setTimeout(function() {
            if (Round.stage == 'vote') {
                beginScoring();
            }
        }, Settings.Timer.vote);
    }

    /** begin scoring - scores are compared against target score */
    function beginScoring() {
        Round.stage = 'score';

        var bestDelta = 100000;
        var bestEntries = [];

        var text = 'Die Beiträge diese Runde:';

        for (var word in Voting) {
            if (Voting.hasOwnProperty(word) && Voting[word].accept.length > Voting[word].reject.length) {
                Dictionary.userAccept(word);
            }
        }

        for (var userId in Round.players) {
            if (Round.players.hasOwnProperty(userId)) {
                var user = KnuddelsServer.getUser(userId);
                var entry = Round.players[userId];
                if (entry.step == 'vote') {
                    if (Voting[entry.word].accept.length > Voting[entry.word].reject.length) {
                        entry.step = 'accept';
                    } else {
                        entry.step = 'reject';
                    }
                }

                if (entry.step == 'okay' || entry.step == 'accept') {
                    text += '°##°- ' + Reward.showUser(user) + ': "' + entry.word + '" für ' + entry.value + ' Punkte';

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

        text += "°##°Gewinner:";
        if (bestEntries.length > 0) {
            for (var i = 0; i < bestEntries.length; ++i) {
                var user = KnuddelsServer.getUser(bestEntries[i]);
                text += ' ' + Reward.showUser(user);
                Reward.awardPoints(user, 1);
            }
        } else {
            text += ' -';
        }

        sendPublicMessage(text);

        setTimeout(function() {
            if(Round.stage == 'score') {
                beginEndOfRound();
            }
        }, Settings.Timer.score);
    }

    /** end of round - resets all necessary fields */
    function beginEndOfRound() {
        LastRound.target = Round.target;
        LastRound.players = Round.players;

        Round.stage = 'none';
        Round.players = {};

        Voting = {};

        sendPublicMessage('Runde vorbei! Jetzt _°>einsteigen|/spielen<°_!');
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

    function showRules(user, params, command) {
        var rulesText = 'Willkommen zum Spiel VERRÜCKTE WORTE!';
        rulesText += '°##°Das Spiel ähnelt Scrabble - es geht darum Buchstaben zu legen. Jeder Buchstabe hat einen gewissen Wert.';
        rulesText += '°##°Jeder Spieler bekommt die gleiche Anzahl an Buchstaben um damit ein Wort zu legen.';
        rulesText += '°##°Folgende Befehle sind wichtig:';
        rulesText += '°##°/x WORT - reicht ein Wort ein, falls du die richtigen Buchstaben dafür hast!';
        rulesText += '°##°    Eine private Nachricht an die App geht dafür auch.';
        rulesText += '°##°/regeln - zeigt diese Hilfe an.';
        rulesText += '°##°/spielen - damit tritst du dem Spiel bei!';
        rulesText += '°##°/abwerfen - ersetzt alle Buchstaben in deiner Hand.';
        rulesText += '°##°/punkte - zeigt die Rangliste für die Saison an';
        rulesText += '°##°/altepunkte - zeigt die Rangliste für die vergangene Saison an';
        rulesText += '°##°Viel Spaß!';
        sendPrivateMessage(user, rulesText);
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
        ersetzen: replaceLetters,

        regeln: showRules,
        rules: showRules,

        scores: Reward.showScores,
        punkte: Reward.showScores,
        highscore: Reward.showScores,
        brag: Reward.showScores,
        liste: Reward.showScores,

        alteliste: Reward.showOldScores,
        altepunkte: Reward.showOldScores,

        teach: Dictionary.teach,
        forget: Dictionary.forget,
        showuseraccept: Dictionary.showUserList
    };

    App.onPrivateMessage = function(privateMessage) {
        submitWord(privateMessage.getAuthor(), privateMessage.getText(), 'p');
    };

    App.onUserJoined = function(user) {
        sendPrivateMessage(user, 'Willkommen! Du kannst dem °>Spiel beitreten|/spielen<°. Oder die °>Regeln ansehen|/regeln<°.');
    };

    var SETTINGS = '_SETTINGS_';
    App.onAppStart = function() {
        if (KnuddelsServer.getPersistence().hasObject(SETTINGS)) {
            Settings = KnuddelsServer.getPersistence().getObject(SETTINGS);
        }

        Dictionary.load();
    };

    App.onPrepareShutdown = function() {
        Dictionary.store();
    };

    App.onShutdown = function() {
        KnuddelsServer.getPersistence().setObject(SETTINGS, Settings);
    };

})();
