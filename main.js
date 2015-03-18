require('helper.js');
require('reward.js');
require('dictionary.js');

// LETTER: value
var LetterValue = {
    A: 3,
    B: 3,
    C: 3,
    D: 2,
    E: 2,
    F: 3,
    G: 1,
    H: 2,
    I: 1,
    J: 5,
    K: 3,
    L: 1,
    M: 3,
    N: 2,
    O: 1,
    P: 3,
    Q: 7,
    R: 3,
    S: 1,
    T: 1,
    U: 1,
    V: 5,
    W: 3,
    X: 7,
    Y: 7,
    Z: 3
};

var ValueColorCodes = {
    0: 'W',
    1: 'C',
    2: 'O',
    3: '[255,80,40]',
    5: 'G',
    7: 'M'
};

// userId: { letters: [], word: '', value: 0, step: NONE/OKAY/VOTE/ACCEPT/REJECT, win: true/false }
var Round = {
    // none,submit,vote,score
    stage: 'none',
    target: 0,
    letters: [],
    players: {}
};

// all the remaining info from the last round
var LastRound = {
    stage: 'score',
    target: 0,
    letters: [],
    players: {}
};

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
    LetterCount: 12,
    ValueToAccept: 10,
    BonusTarget: {
        Points: 15,
        MinPlayers: 3
    },
    BonusSolo: {
        Points: 3,
        MinPlayers: 4
    },
    Timer: {
        score: 3000,
        signup: 5000,
        submit: 45000,
        submitFinal: 5000,
        vote: 15000
    },
    Season: {
        id: '2015-03',
        name: 'März'
    },
    LastSeason: {
        id: '2015-02',
        name: 'Februar'
    },

    DefaultBotColor: '°GG°'
};

var SettingsBlueprint = Settings;

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

        // C always appears with H or K
        if (letters.indexOf('C') != -1) {
            if (letters.indexOf('K') == -1 && letters.indexOf('H') == -1) {
                var pos = RandomOperations.nextInt(letters.length);
                var replacement = 'H';
                if (RandomOperations.nextInt(3) == 0) {
                    replacement = 'K';
                }
                letters.splice(pos, 1, replacement);
            }
        }

        // Q only ever appears with U
        if (letters.indexOf('Q') != -1) {
            if (letters.indexOf('U') == -1) {
                var pos = RandomOperations.nextInt(letters.length);
                letters.splice(pos, 1, 'U');
            }
        }
    }

    /** display the contents of the letters array in a human readable format */
    function lettersToString(letters) {
        var result = ' ';
        for (var i = 0; i < letters.length; ++i) {
            var colorCode = ValueColorCodes[LetterValue[letters[i]]];
            //result = result + letters[i] + '(' + LetterValue[letters[i]] + ') ';
            result = result + '°r' + colorCode + '°_' + letters[i] + '_°r10°' + LetterValue[letters[i]] + '  ';
        }
        result += '°r°' + Settings.DefaultBotColor;
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

    /** submit a word by a user */
    function submitWord(user, params) {
        if (Round.stage != 'submit') {
            sendPrivateMessage(user, 'In dieser Runde können gerade keine Worte eingereicht werden!');
            return;
        }
        var userId = user.getUserId();
        if (!Round.players.hasOwnProperty(userId)) {
            startPlayer(userId);
        }

        if (!Round.players.hasOwnProperty(userId)) {
            sendPrivateMessage(user, 'Sorry! Um mitzuspielen musst du im Channel sein!');
            return;
        }

        var obj = Round.players[userId];

        var entry = params.trim().toUpperCase();

        if (entry.length == 0) {
            sendPrivateMessage(user, 'Du musst ein Wort eingeben.°#°Du kannst diese Buchstaben verwenden:°#°' + lettersToString(Round.letters));
            return;
        }

        var value = getWordValue(Round.letters, entry);
        if (value < 0) {
            sendPrivateMessage(user, 'Das Wort "' + entry + '" ist mit den Buchstaben leider nicht möglich!°#°Du kannst diese Buchstaben verwenden:°#°' + lettersToString(Round.letters));
            return;
        }

        var acceptance = Dictionary.check(entry);

        if (acceptance === 'reject') {
            sendPrivateMessage(user, 'Die Buchstabenfolge "' + entry + '" ergibt leider kein akzeptiertes Wort!');
            return;
        }

        if (obj.step != 'none' && Voting.hasOwnProperty(obj.word)) {
            var index = Voting[obj.word].submit.indexOf(userId);
            Voting[obj.word].submit.splice(index, 1);
            if (Voting[obj.word].submit.length == 0) {
                delete Voting[obj.word];
            }
        }

        var extra = '';
        if (value == Round.target) {
            extra = ' Damit wirst du Bonuspunkte für die Punktzahl bekommen!';
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
            sendPrivateMessage(user, 'Dein Wort "' + entry + '" hat den Wert ' + value + ' - falls es von den anderen als gültig akzeptiert wird!' + extra);
        } else if (acceptance === 'accept') {
            obj.value = value;
            obj.word = entry;

            obj.step = 'okay';
            sendPrivateMessage(user, 'Dein Wort "' + entry + '" hat den Wert ' + value + '.' + extra);
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
                step: 'none',
                word: '',
                value: -1,
                win: false
            };

            Round.players[userId] = obj;
        }
    }

    /** check if a user has already voted on a word - or not */
    function hasVoted(voteBox, userId) {
        if (voteBox.accept.indexOf(userId) != -1) {
            return 'accept';
        }
        if (voteBox.reject.indexOf(userId) != -1) {
            return 'reject';
        }
        if (voteBox.submit.indexOf(userId) != -1) {
            return 'submit';
        }
        return '';
    }

    function acceptSpelling(user, params, command) {
        var word = params.trim().toUpperCase();
        if (Voting.hasOwnProperty(word)) {
            var voted = hasVoted(Voting[word], user.getUserId());
            if (voted === 'submit') {
                sendPrivateMessage(user, 'Du hast das Wort "' + word + '" selbst eingereicht.');
            } else if (voted) {
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
            var voted = hasVoted(Voting[word], user.getUserId());
            if (voted === 'submit') {
                sendPrivateMessage(user, 'Du hast das Wort "' + word + '" selbst eingereicht.');
            } else if (voted) {
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
        Round.target = 2 + RandomOperations.nextInt(10) + RandomOperations.nextInt(10);
        Round.stage = 'submit';
        Round.letters = [];
        refillLetters(Round.letters);

        sendPublicMessage('Die Buchstaben diese Runde:°#°' + lettersToString(Round.letters) + '°#°Worte können mit ""/x WORT"" eingereicht werden.°#°Bonuspunkte wenn du es schaffst genau ' + Round.target + ' Punkte zu erreichen!');

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
            if (Round.stage == 'submit') {
                sendPublicMessage('Nur noch ' + Settings.Timer.submitFinal / 1000  + ' Sekunden! Mit /x WORT kann ein Wort eingereicht werden!');
                setTimeout(endSubmit, Settings.Timer.submitFinal);
            }
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

        var winWords = {};
        var sortedWords = [];

        var text = 'Die Beiträge diese Runde:';

        var allowedFreePass = Settings.LetterCount - 2 - RandomOperations.nextInt(4);

        for (var word in Voting) {
            if (Voting.hasOwnProperty(word)) {
                if(Voting[word].accept.length > Voting[word].reject.length) {
                    Dictionary.userAccept(word, 1);
                } else if(word.length <= allowedFreePass && Voting[word].accept.length + Voting[word].submit.length > Voting[word].reject.length) {
                    Dictionary.userAccept(word, 1);
                }
            }
        }

        var allowedFreePass = Settings.LetterCount - 2 - RandomOperations.nextInt(3);
        var totalWinners = 0;
        for (var userId in Round.players) {
            if (Round.players.hasOwnProperty(userId)) {
                var entry = Round.players[userId];
                if (entry.step == 'vote') {
                    if (Voting[entry.word].accept.length > Voting[entry.word].reject.length) {
                        entry.step = 'accept';
                    } else if (entry.word.length <= allowedFreePass && Voting[entry.word].accept.length + Voting[entry.word].submit.length > Voting[entry.word].reject.length) {
                        entry.step = 'accept';
                    } else {
                        entry.step = 'reject';
                    }
                }

                if (entry.step == 'okay' || entry.step == 'accept') {
                    ++totalWinners;
                    if (winWords.hasOwnProperty(entry.word)) {
                        winWords[entry.word].winners.push(userId);
                    } else {
                        winWords[entry.word] = {
                            winners: [userId],
                            value: entry.value
                        };

                        var index = 0;
                        for (; index < sortedWords.length; ++index) {
                            if (winWords[sortedWords[index]].value < entry.value) {
                                break;
                            }
                        }
                        sortedWords.splice(index, 0, entry.word);
                    }
                }
            }
        }

        var extraPoints = Settings.BonusTarget.Points;
        if (totalWinners < Settings.BonusTarget.MinPlayers) {
            extraPoints = 1;
        }
        var soloPoints = Settings.BonusSolo.Points;
        if (totalWinners < Settings.BonusSolo.MinPlayers) {
            soloPoints = 0;
        }

        for (var i = 0; i < sortedWords.length; ++i) {
            var word = sortedWords[i];
            var outputWord = word;
            var endPiece = '';
            var value = winWords[sortedWords[i]].value;

            var pointsText = '(' + value;
            if (value === Round.target && extraPoints) {
                outputWord = '_' + word + '_';
                pointsText += ' + ' + extraPoints;
                value += extraPoints;
            }
            if (soloPoints && winWords[word].winners.length == 1) {
                endPiece = ' (Solo: +' + soloPoints + ' P)';
                value += soloPoints;
            }
            pointsText += ' P)';
            text += '°#°- ' + outputWord + ' ' + pointsText + ': ';



            var firstWinner = true;
            for (var k = 0; k < winWords[word].winners.length; ++k) {
                var user = KnuddelsServer.getUser(winWords[word].winners[k]);
                Reward.awardPoints(user, value);
                if (!firstWinner) {
                    text += ', ';
                }
                firstWinner = false;

                text += Reward.showUser(user);
            }

            text += endPiece;
        }

        if (totalWinners > 0) {
            sendPublicMessage(text);
        } else {
            sendPublicMessage("Keine Beiträge diese Runde!");
        }

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

        sendPublicMessage('Runde vorbei! Nächste Runde startet gleich! Ihr könnt jederzeit den °>Hutladen|/Hutladen<° besuchen!');

        setTimeout(function() {
            if (Round.stage == 'none') {
                beginSubmit();
            }
        }, Settings.Timer.signup);
    }

    /** advance the round to the next step */
    function advanceStep(user) {
        if (!user.isChannelModerator() && !user.isChannelOwner()) {
            return;
        }

        if (Round.stage == 'none') {
            beginSubmit();
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

    function showRules(user) {
        var rulesText = 'Willkommen zum Spiel VERRÜCKTE WORTE!';
        rulesText += '°#°Das Spiel ähnelt Scrabble - es geht darum Buchstaben zu legen. Jeder Buchstabe hat einen gewissen Wert.';
        rulesText += '°#°Jeder Spieler bekommt die gleichen Buchstaben um damit ein Wort zu legen.';
        rulesText += '°#°Folgende Befehle sind wichtig:';
        rulesText += '°#°/x WORT - reicht ein Wort ein, falls du die richtigen Buchstaben dafür hast!';
        rulesText += '°#°    Eine private Nachricht an die App geht dafür auch.';
        rulesText += '°#°°>/regeln|/regeln<° - zeigt diese Hilfe an.';
        rulesText += '°#°°>/punkte|/punkte<° - zeigt die Rangliste für die Saison an';
        rulesText += '°#°°>/altepunkte|/altepunkte<° - zeigt die Rangliste für die vergangene Saison an';
        rulesText += '°#°°>/hutladen|/hutladen<° - betrete den Hutladen, dort gibt es Symbole für Punkte';
        rulesText += '°#°Und am Wichtigsten:';
        rulesText += '°#°Viel Spaß!';
        sendPrivateMessage(user, rulesText);
    }

    function changeSettings(user, param) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            var newSettings = JSON.parse(param);

            for (var piece in newSettings) {
                if (SettingsBlueprint.hasOwnProperty(piece)) {
                    Settings[piece] = newSettings[piece];
                    sendPrivateMessage(user, 'Changed Settings.' + piece + ' to ' + Settings[piece]);
                }
            }
        }
    }

    App.chatCommands = {
        settings: changeSettings,

        x: submitWord,
        submit: submitWord,
        spell: submitWord,
        wort: submitWord,

        accept: acceptSpelling,
        richtig: acceptSpelling,
        '+': acceptSpelling,
        reject: rejectSpelling,
        '-': rejectSpelling,
        falsch: rejectSpelling,

        // next: advanceStep,
        weiter: advanceStep,

        regeln: showRules,
        rules: showRules,

        scores: Reward.showScores,
        punkte: Reward.showScores,
        highscore: Reward.showScores,
        brag: Reward.showScores,
        liste: Reward.showScores,

        alteliste: Reward.showOldScores,
        altepunkte: Reward.showOldScores,

        hutladen: Reward.showShop,
        laden: Reward.showShop,
        einkaufen: Reward.showShop,
        hatshop: Reward.showShop,
        buyhat: Reward.buyHat,
        equiphat: Reward.equipHat,

        teach: Dictionary.teach,
        forget: Dictionary.forget,
        showuseraccept: Dictionary.showUserList
    };

    App.onPrivateMessage = function(privateMessage) {
        submitWord(privateMessage.getAuthor(), privateMessage.getText(), 'p');
    };

    App.onUserJoined = function(user) {
        var text = 'Willkommen! Einige Befehle werden erklärt, wenn du °>/regeln|/regeln<° eingibst.';
        if (Round.stage == 'submit') {
            text += '°##°Folgende Buchstaben sind gerade verfügbar:°#°' + lettersToString(Round.letters) + '°#°Mit /x WORT kannst du noch schnell ein Wort einreichen. Alternativ auch als /p an mich!';
        }

        sendPrivateMessage(user, text);

        var AWARD_M = 'NPM', AWARD_F = 'NPF';
        if (user.getGender() == Gender.Female) {
            Reward.awardHat(user, AWARD_F, 'Als kleines Begrüßungsgeschenk bekommst du direkt deinen ersten Hut!');
        } else {
            Reward.awardHat(user, AWARD_M, 'Als kleines Begrüßungsgeschenk bekommst du direkt deinen ersten Hut!');
        }
    };

    var SETTINGS = '_SETTINGS_';
    App.onAppStart = function() {
        if (KnuddelsServer.getPersistence().hasObject(SETTINGS)) {
            Settings = KnuddelsServer.getPersistence().getObject(SETTINGS);
        }

        // ensure new settings are properly set!
        for (var piece in SettingsBlueprint) {
            if (!Settings.hasOwnProperty(piece)) {
                Settings[piece] = SettingsBlueprint[piece];
            }
        }

        Dictionary.load();

        beginSubmit();
    };

    App.onPrepareShutdown = function() {
        Dictionary.store();
    };

    App.onShutdown = function() {
        KnuddelsServer.getPersistence().setObject(SETTINGS, Settings);
    };

})();
