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
    vowels: [],
    players: {}
};

// all the remaining info from the last round
var LastRound = {
    stage: 'score',
    target: 0,
    letters: [],
    players: {}
};

// 'WORD': { accept: [], reject: [], submit: [] }
var Voting = {};

/** various settings for the game */
var Settings = {
    LetterPool: {
        A: 2, //6.5,
        B: 2, //1.9,
        C: 3, //3.1,
        D: 5, //5.1,
        E: 8, //17.4,
        F: 2, //1.7,
        G: 3, //3.0,
        H: 4, //4.8,
        I: 2,//7.6,
        J: 1,//0.3,
        K: 1,//1.2,
        L: 3,//3.4,
        M: 2,//2.5,
        N: 10,//9.8,
        O: 1,//2.5,
        P: 1,//0.8,
        Q: 1,//0.1,
        R: 7,//7.0,
        S: 8,//7.9,
        T: 6,//6.2,
        U: 1,//4.4,
        V: 1,//0.7,
        W: 1,//1.9,
        X: 1,//0.1,
        Y: 1,//0.1,
        Z: 1//1.1
    },
    VowelPool: {
        A: 6, //6.5,
        E: 10, //17.4,
        I: 7,//7.6,
        O: 4,//2.5,
        U: 6//4.4,
    },
    LetterCount: 12,
    VowelCount: 2,
    ValueToAccept: 10,
    BonusTarget: {
        Points: 15,
        NeighborPoints: 5,
        LonerPoints: 5,
        MinPlayers: 3
    },
    BonusSolo: {
        Points: 3,
        MinPlayers: 4
    },
    DisplayRejectedWords: true,
    Timer: {
        score: 3000,
        signup: 5000,
        submit: 45000,
        submitFinal: 5000,
        vote: 15000
    },
    ExtraRound: {
        Duration: 5,
        Reward: {
            1: 100,
            2: 50,
            3: 25,
            all: 10
        },
        MinPlayers: 4,
        Pause: 20
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
    var ExtraInstance = {
        Active: false,
        RoundsToStart: 5,
        // players: userId -> { Points, Words }
        Players: {},
        Turns: 0
    };
    var LetterPool = [];
    var VowelPool = [];

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

        for (var i = 0; i < Settings.VowelCount; ++i) {
            if (VowelPool.length <=  1) {
                for (var x in Settings.VowelPool) {
                    if (Settings.VowelPool.hasOwnProperty(x)) {
                        for (var k = 0; k < Settings.VowelPool[x]; ++k) {
                            VowelPool.push(x);
                        }
                    }
                }
                VowelPool = RandomOperations.shuffleObjects(VowelPool);
            }

            var pos = RandomOperations.nextInt(letters.length);
            letters.splice(pos, 0, VowelPool.pop());
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

    function wordToColorString(word) {
        var result = ' ';
        for (var i = 0; i < word.length; ++i) {
            var colorCode = ValueColorCodes[LetterValue[word[i]]];
            result = result + '°r' + colorCode + '°' + word[i];
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

    function turnToSpellWord(entryword) {
        var REPLACEMENTS = {
            ' ': '',
            '.': '',
            'ä': 'AE',
            'ö': 'OE',
            'ü': 'UE',
            'Ä': 'AE',
            'Ö': 'OE',
            'Ü': 'UE',
            'ß': 'SS'
        }
        var result = entryword;
        for (var germanLetter in REPLACEMENTS) {
            if (REPLACEMENTS.hasOwnProperty(germanLetter)) {
                result = result.replace(germanLetter, REPLACEMENTS[germanLetter]);
            }
        }

        return result.toUpperCase();
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

        var originalWord = params.trim();
        var entry = turnToSpellWord(originalWord);

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
            obj.original = originalWord;

            obj.step = 'vote';
            if (Voting.hasOwnProperty(entry)) {
                Voting[entry].submit.push(userId);
            } else {
                Voting[entry] = { accept: [], reject: [], submit: [userId], original: originalWord };
            }
            sendPrivateMessage(user, 'Dein Wort "' + entry + '" hat den Wert ' + value + ' - falls es von den anderen als gültig akzeptiert wird!' + extra);
        } else if (acceptance === 'accept') {
            obj.value = value;
            obj.word = entry;
            obj.original = originalWord;

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
                original: '',
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

        sendPublicMessage('Die Buchstaben dieser Runde:°#°' + lettersToString(Round.letters) + '°#°Worte können mit ""/x WORT"" eingereicht werden.°#°Bonuspunkte wenn du es schaffst genau _' + Round.target + ' Punkte_ zu erreichen!');

        function endSubmit() {
            if (Round.stage == 'submit') {
                var skipVote = true;
                for (var entry in Voting) {
                    if (Voting.hasOwnProperty(entry)) {
                        skipVote = false;
                        break;
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
                var original = Voting[entry].original;
                text += '°##° ' + original + ' (' + entry + ') - _°>okay|/accept ' + entry + '<°_ oder _°>falsch|/reject ' + entry + '<°_';
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
        var rejectedWords = [];

        var text = 'Die Beiträge diese Runde:';

        var allowedFreePass = Settings.LetterCount + Settings.VowelCount - 1 - RandomOperations.nextInt(4);

        for (var word in Voting) {
            if (Voting.hasOwnProperty(word)) {
                if(Voting[word].accept.length > Voting[word].reject.length) {
                    Voting[word].result = 'accept';
                    Dictionary.userAccept(word, 1);
                } else if(word.length <= allowedFreePass && Voting[word].accept.length + Voting[word].submit.length > Voting[word].reject.length) {
                    Dictionary.userAccept(word, 1);
                    Voting[word].result = 'tie-accept';
                } else if (Voting[word].accept.length + Voting[word].submit.length > Voting[word].reject.length) {
                    Voting[word].result = 'tie-reject';
                } else {
                    Voting[word].result = 'reject';
                }
            }
        }

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
                            original: entry.original,
                            value: entry.value
                        };
                    }
                } else {
                    rejectedWords.push(entry.word);
                }
            }
        }

        var extraPoints = Settings.BonusTarget.Points;
        var neighborPoints = Settings.BonusTarget.NeighborPoints;
        if (totalWinners < Settings.BonusTarget.MinPlayers) {
            extraPoints = Settings.BonusTarget.LonerPoints;
            neighborPoints = 0;
        }
        var soloPoints = Settings.BonusSolo.Points;
        if (totalWinners < Settings.BonusSolo.MinPlayers) {
            soloPoints = 0;
        }

        for (var word in winWords) {
            if (winWords.hasOwnProperty(word)) {
                var payout = winWords[word].value;
                if (winWords[word].value === Round.target) {
                    payout += extraPoints;
                } else if (neighborPoints && (winWords[word].value == Round.target + 1 || winWords[word].value == Round.target - 1)) {
                    payout += neighborPoints;
                }

                if (winWords[word].winners.length == 1) {
                    payout += soloPoints;
                }
                winWords[word].payout = payout;

                var index = 0;
                for (; index < sortedWords.length; ++index) {
                    if (winWords[sortedWords[index]].payout < payout) {
                        break;
                    }
                }
                sortedWords.splice(index, 0, word);
            }
        }

        for (var i = 0; i < sortedWords.length; ++i) {
            var word = sortedWords[i];
            var outputWord = winWords[word].original;
            var endPiece = '';
            var value = winWords[word].value;

            var pointsText = '';
            if (value === Round.target && extraPoints) {
                outputWord = '_' + winWords[word].original + '_';
                pointsText = ' (' + winWords[word].value + ' + ' + extraPoints + ' P)';
                value += extraPoints;
            } else if (neighborPoints && (winWords[word].value == Round.target + 1 || winWords[word].value == Round.target - 1)) {
                outputWord = '"' + winWords[word].original + '"';
                pointsText = ' (' + winWords[word].value + ' + ' + neighborPoints + ' P)';
                value += neighborPoints;
            }
            if (soloPoints && winWords[word].winners.length == 1) {
                endPiece = ' (Solo: +' + soloPoints + ' P)';
                value += soloPoints;
                if (pointsText == '') {
                    pointsText = ' (' + winWords[word].value + ' P)';
                }
            }
            text += '°#° ' + outputWord + ' - ' + winWords[word].payout + ' P' + pointsText + ': ';

            var firstWinner = true;
            for (var k = 0; k < winWords[word].winners.length; ++k) {
                var userId = winWords[word].winners[k];
                var user = KnuddelsServer.getUser(userId);
                Reward.awardPoints(user, value);
                if (!firstWinner) {
                    text += ', ';
                }
                firstWinner = false;

                text += Reward.showUser(user);

                if (ExtraInstance.Active) {
                    if (ExtraInstance.Players.hasOwnProperty(userId)) {
                        ExtraInstance.Players[userId].Points += value;
                        ExtraInstance.Players[userId].Words += 1;
                    } else {
                        ExtraInstance.Players[userId] = {
                            Points: value,
                            Words: 1
                        }
                    }
                }
            }

            text += endPiece;
        }

        var rejectText = '';
        if (rejectedWords.length > 0 && Settings.DisplayRejectedWords) {
            rejectText = '°##°"Abgelehnte Worte"';
            for (var i = 0; i < rejectedWords.length; ++i) {
                var word = rejectedWords[i];
                if (Voting.hasOwnProperty(word)) {
                    var entry = Voting[word];
                    rejectText += '°#° ' + entry.original + ' : ';
                    if (entry.accept.length == 0 && entry.reject.length == 0) {
                        rejectText += 'unentscheiden - Münzwurf verloren';
                    } else if (entry.result == 'tie-reject') {
                        rejectText += 'unentschieden - Münzwurf verloren'
                    } else if (entry.result == 'reject') {
                        rejectText += 'abgelehnt';
                    }
                }
            }
        }

        if (ExtraInstance.Active) {
            ++ExtraInstance.Turns;
        } else if (totalWinners >= Settings.ExtraRound.MinPlayers) {
            ++ExtraInstance.RoundsToStart;
        }

        if (totalWinners > 0) {
            sendPublicMessage(text + rejectText);
        } else {
            sendPublicMessage("Keine Beiträge diese Runde!" + rejectText);
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

        LastRound.Voting = {};
        for (var word in Voting) {
            if (Voting.hasOwnProperty(word)) {
                LastRound.Voting[word] = Voting[word];
            }
        }
        Voting = {};

        if (ExtraInstance.Active) {
            var hatWinners = [];
            var text = 'Runde vorbei! Nächste Runde startet gleich!';

            var sortedPlayers = [];
            for (var userId in ExtraInstance.Players) {
                if (ExtraInstance.Players.hasOwnProperty(userId)) {
                    var player = ExtraInstance.Players[userId];

                    var index = 0;
                    for (; index < sortedPlayers.length; ++index) {
                        if (ExtraInstance.Players[sortedPlayers[index]].Points < player.Points) {
                            break;
                        }
                    }
                    sortedPlayers.splice(index, 0, userId);
                }
            }

            var remainingRounds = Settings.ExtraRound.Duration - ExtraInstance.Turns;
            if (remainingRounds > 0) {
                text += ' Gerade läuft eine _Extra Runde_!';

                text += '°#°Zwischenstand Runde ' + ExtraInstance.Turns + ' von ' + Settings.ExtraRound.Duration;
                var rank = 0;
                var lastPoints = 10000000000;
                for (var i = 0; i < sortedPlayers.length; ++i) {
                    userId = sortedPlayers[i];
                    var user = KnuddelsServer.getUser(userId);
                    var player = ExtraInstance.Players[userId];
                    if (player.Points != lastPoints) {
                        rank = i + 1;
                        lastPoints = player.Points;
                    }
                    text += '°#° ' + rank + '. ' + Reward.showUser(user) + '     ' + player.Points;
                }
            } else {
                ExtraInstance.Active = false;
                ExtraInstance.RoundsToStart = 0;

                text += '°##°_Extra Runde Rangliste_';
                var rank = 0;
                var lastPoints = 10000000000;
                for (var i = 0; i < sortedPlayers.length; ++i) {
                    userId = sortedPlayers[i];
                    var user = KnuddelsServer.getUser(userId);
                    var player = ExtraInstance.Players[userId];
                    if (player.Points != lastPoints) {
                        rank = i + 1;
                        lastPoints = player.Points;
                    }

                    var bonusPoints = Settings.ExtraRound.Reward.all;
                    if (Settings.ExtraRound.Reward.hasOwnProperty('' + rank)) {
                        bonusPoints = Settings.ExtraRound.Reward['' + rank];
                    }

                    text += '°#° ' + rank + '. ' + Reward.showUser(user) + '     ' + player.Points + ' => +' + bonusPoints + ' P';
                    Reward.awardPoints(user, bonusPoints);

                    if (rank <= 3) {
                        hatWinners.push(userId);
                        // Reward.awardHat(user, '&03', 'Für deine Platzierung in der Extra Runde hast du diesen Hut gewonnen!');
                    }
                }
                text += '°##°Glückwunsch an alle Gewinner!';
            }

            sendPublicMessage(text);

            for (var i = 0; i < hatWinners.length; ++i) {
                userId = hatWinners[i];
                var user = KnuddelsServer.getUser(userId);
                Reward.awardHat(user, '&03', 'Für deine Platzierung in der Extra Runde hast du diesen Hut gewonnen!');
            }
        } else if (ExtraInstance.RoundsToStart >= Settings.ExtraRound.Pause) {
            ExtraInstance.Active = true;
            ExtraInstance.Turns = 0;
            ExtraInstance.Players = {};
            sendPublicMessage('Runde vorbei!°##°Es startet eine _Extra Runde_!°#°Die nächsten ' + Settings.ExtraRound.Duration + ' Runden werden zusammengezählt! Wer am meisten Punkte sammelt bekommt einen Bonus!°#°Ran an die Tasten!');
        } else {
            sendPublicMessage('Runde vorbei! Nächste Runde startet gleich! Ihr könnt jederzeit den °>Hutladen|/Hutladen<° besuchen!');
        }

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
    function startExtraRound(user) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            sendPrivateMessage(user, 'Wettkampf startet gleich!');
            ExtraInstance.RoundsToStart = Settings.ExtraRound.Pause;
        }
    }

    function revealVoting(user) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            if (LastRound.Voting) {
                var text = 'Abstimmungsergebnisse der letzten Runde:';
                for (var word in LastRound.Voting) {
                    var entry = LastRound.Voting[word];
                    text += '°#° ' + word + ' - ' + entry.result;
                    text += '°#°   eingereicht: ';
                    for (var i = 0; i < entry.submit.length; ++i) {
                        var userId = entry.submit[i];
                        var user = KnuddelsServer.getUser(userId);
                        text += Reward.showUser(user) + '; ';
                    }

                    text += '°#°   dafür: ';
                    for (var i = 0; i < entry.accept.length; ++i) {
                        var userId = entry.accept[i];
                        var user = KnuddelsServer.getUser(userId);
                        text += Reward.showUser(user) + '; ';
                    }

                    text += '°#°   dagegen: ';
                    for (var i = 0; i < entry.reject.length; ++i) {
                        var userId = entry.reject[i];
                        var user = KnuddelsServer.getUser(userId);
                        text += Reward.showUser(user) + '; ';
                    }
                }
                sendPrivateMessage(user, text);
            } else {
                sendPrivateMessage(user, 'Keine Ergebnisse vorhanden.');
            }
        } else {
            sendPrivateMessage(user, 'Das geht so nicht.')
        }
    }

    App.chatCommands = {
        settings: changeSettings,
        stimmencheck: revealVoting,
        stimmen: revealVoting,

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

        wettkampf: startExtraRound,

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
